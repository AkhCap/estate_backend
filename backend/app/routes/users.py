from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, BackgroundTasks, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import timedelta
import logging
from pydantic import BaseModel
import random
import time
import json

from app import schemas, models, crud, auth
from app.database import SessionLocal, engine, get_db
from app.core.email import send_email_code
from app.core.redis_client import redis_client

# Настройка логирования
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Константы для мониторинга
SUSPICIOUS_ATTEMPTS_THRESHOLD = 10  # Количество попыток для блокировки IP
IP_BLOCK_DURATION = 3600  # Время блокировки IP в секундах (1 час)

router = APIRouter()

# Инициализируем базу данных (если необходимо)
models.Base.metadata.create_all(bind=engine)

# Настройка хеширования паролей
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Функция для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Модель для входа
class LoginRequest(BaseModel):
    email: str
    password: str

# Временное хранилище кодов (email -> (код, время_создания))
email_codes = {}
CODE_TTL = 300  # 5 минут

# Лимиты на отправку кода
SEND_CODE_INTERVAL = 60  # секунд между отправками
SEND_CODE_MAX_PER_HOUR = 5
send_code_history = {}  # email -> [timestamp, ...]

# Лимит на количество попыток ввода кода
MAX_CODE_ATTEMPTS = 5
code_attempts = {}  # email -> [количество_попыток, время_создания_кода]

class EmailCodeRequest(BaseModel):
    email: str

class EmailCodeVerifyRequest(BaseModel):
    email: str
    code: str

class SetPasswordRequest(BaseModel):
    email: str
    password: str

class ChangeEmailRequest(BaseModel):
    new_email: str

class ChangeEmailVerifyRequest(BaseModel):
    old_email: str
    new_email: str
    code: str

class ResetPasswordRequest(BaseModel):
    email: str

class ResetPasswordVerifyRequest(BaseModel):
    email: str
    code: str

class ResetPasswordSetRequest(BaseModel):
    email: str
    code: str
    new_password: str

# --- Регистрация и логин ---

# Удалён эндпоинт /users/register, регистрация теперь только через email-код и установку пароля

@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    print(f"Получены данные для входа: username={form_data.username}, password=***")
    
    # Сначала проверяем существование пользователя
    user = crud.get_user_by_email(db, form_data.username)
    if not user:
        print(f"Пользователь с email {form_data.username} не найден")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Затем проверяем пароль
    if not auth.verify_password(form_data.password, user.hashed_password):
        print(f"Неверный пароль для пользователя {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    print(f"Пользователь найден и пароль верный: {user.email}")
    access_token = auth.create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/send-email-code")
async def send_email_code_endpoint(request: EmailCodeRequest, background_tasks: BackgroundTasks, req: Request, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    client_ip = req.client.host
    now = int(time.time())
    
    # Проверка: если пользователь уже существует, не отправлять код
    if crud.get_user_by_email(db, email=email):
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    # Проверяем, не заблокирован ли IP
    if redis_client.get(f"blocked_ip:{client_ip}"):
        logger.warning(f"Заблокированный IP {client_ip} пытается запросить код для {email}")
        raise HTTPException(status_code=429, detail="Слишком много попыток. Попробуйте позже.")
    
    # Проверка лимита по времени между отправками
    history_key = f"email_code_history:{email}"
    history = redis_client.lrange(history_key, 0, -1)
    history = [int(t) for t in history if now - int(t) < 3600]
    
    if history and now - history[-1] < SEND_CODE_INTERVAL:
        logger.info(f"Слишком частый запрос кода для {email} с IP {client_ip}")
        raise HTTPException(status_code=429, detail=f"Код можно запрашивать не чаще, чем раз в {SEND_CODE_INTERVAL} секунд")
    
    if len(history) >= SEND_CODE_MAX_PER_HOUR:
        logger.warning(f"Превышен лимит отправок кода для {email} с IP {client_ip}")
        raise HTTPException(status_code=429, detail=f"Превышен лимит отправок кода. Попробуйте позже")
    
    # Генерируем 6-значный код
    code = str(random.randint(100000, 999999))
    
    # Сохраняем код и время создания в Redis
    redis_client.set(f"email_code:{email}", f"{code}:{now}", ex=CODE_TTL)
    
    # Обновляем историю отправок
    redis_client.rpush(history_key, now)
    redis_client.expire(history_key, 3600)
    
    # Сбрасываем попытки
    redis_client.delete(f"email_code_attempts:{email}")
    
    # Логируем успешную отправку
    logger.info(f"Отправлен код для {email} с IP {client_ip}")
    
    # Отправляем email в фоне
    background_tasks.add_task(send_email_code, email, code)
    return {"detail": "Код отправлен на email (если он существует)", "success": True}

@router.post("/verify-email-code")
def verify_email_code_endpoint(request: EmailCodeVerifyRequest, req: Request):
    email = request.email.strip().lower()
    code = request.code.strip()
    client_ip = req.client.host
    
    # Проверяем, не заблокирован ли IP
    if redis_client.get(f"blocked_ip:{client_ip}"):
        logger.warning(f"Заблокированный IP {client_ip} пытается верифицировать код для {email}")
        raise HTTPException(status_code=429, detail="Слишком много попыток. Попробуйте позже.")
    
    entry = redis_client.get(f"email_code:{email}")
    if not entry:
        logger.info(f"Попытка верификации несуществующего кода для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Код не найден или истёк срок действия")
    
    saved_code, created_at = entry.split(":")
    created_at = int(created_at)
    now = int(time.time())
    
    # Проверяем количество попыток
    attempts_key = f"email_code_attempts:{email}"
    attempts = redis_client.get(attempts_key)
    attempts = int(attempts) if attempts else 0
    
    if attempts >= MAX_CODE_ATTEMPTS:
        logger.warning(f"Превышено количество попыток для {email} с IP {client_ip}")
        # Блокируем IP при множественных попытках
        redis_client.set(f"blocked_ip:{client_ip}", "1", ex=IP_BLOCK_DURATION)
        raise HTTPException(status_code=429, detail="Превышено количество попыток. Запросите новый код.")
    
    if now - created_at > CODE_TTL:
        redis_client.delete(f"email_code:{email}")
        redis_client.delete(attempts_key)
        logger.info(f"Истёкший код для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Код истёк, запросите новый")
    
    if code != saved_code:
        redis_client.incr(attempts_key)
        redis_client.expire(attempts_key, CODE_TTL)
        logger.warning(f"Неверный код для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Неверный код")
    
    # Успешно — сбрасываем попытки
    redis_client.delete(attempts_key)
    logger.info(f"Успешная верификация кода для {email} с IP {client_ip}")
    return {"detail": "Код подтверждён", "success": True}

@router.post("/set-password")
def set_password_endpoint(request: SetPasswordRequest, db: Session = Depends(get_db)):
    email = request.email.strip().lower()
    password = request.password
    # Проверяем, что код был подтверждён
    entry = redis_client.get(f"email_code:{email}")
    if not entry:
        raise HTTPException(status_code=400, detail="Сначала подтвердите email через код")
    # Проверяем, что пользователь ещё не существует
    if crud.get_user_by_email(db, email=email):
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    # Хэшируем пароль
    hashed_password = pwd_context.hash(password)
    # Создаём пользователя
    user_in = schemas.UserCreate(email=email, password=password)
    created_user = crud.create_user(db=db, user=user_in, hashed_password=hashed_password)
    # Удаляем код из Redis
    redis_client.delete(f"email_code:{email}")
    return {"detail": "Пользователь успешно зарегистрирован", "success": True, "user": schemas.UserOut.model_validate(created_user)}

# --- Профиль пользователя ---

@router.get("/me", response_model=schemas.UserOut)
def read_current_user(
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    print("Извлеченный current_user:", current_user)
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return schemas.UserOut.model_validate(user)

@router.put("/me", response_model=schemas.UserOut)
def update_user_me(
    updated_data: schemas.UserUpdate,
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    updated_user = crud.update_user(db, user_id=user.id, updated_data=updated_data)
    if not updated_user:
        raise HTTPException(status_code=400, detail="Ошибка обновления профиля")
    
    return schemas.UserOut.model_validate(updated_user)

# --- Загрузка аватара ---

@router.post("/me/avatar", response_model=schemas.UserOut)
def upload_avatar(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Директория для хранения аватаров
    uploads_dir = "uploads/avatars"
    os.makedirs(uploads_dir, exist_ok=True)
    
    # Формируем имя файла (например, user_23_filename.jpg)
    filename = f"user_{user.id}_{file.filename}"
    file_path = os.path.join(uploads_dir, filename)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    
    # Формируем URL для доступа к файлу через собственный endpoint
    avatar_url = f"http://127.0.0.1:8000/uploads/avatars/{filename}"
    
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    
    return schemas.UserOut.model_validate(user)

@router.delete("/me/avatar", response_model=schemas.UserOut)
def delete_avatar(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    if user.avatar_url:
        # Получаем имя файла из URL
        filename = user.avatar_url.split('/')[-1]
        file_path = os.path.join("uploads/avatars", filename)
        
        # Удаляем файл, если он существует
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Ошибка при удалении файла: {e}")
        
        # Очищаем URL аватара в базе данных
        user.avatar_url = None
        db.commit()
        db.refresh(user)
    
    return schemas.UserOut.model_validate(user)

# --- Получение объявлений текущего пользователя ---

@router.get("/me/properties", response_model=List[schemas.PropertyOut])
def read_my_properties(
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return [schemas.PropertyOut.model_validate(prop) for prop in user.properties]

# --- НОВЫЙ ЭНДПОИНТ: Получение публичной информации о пользователе по ID --- 
@router.get("/{user_id}", response_model=schemas.UserPublicOut)
async def get_user_public_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Возвращает публичную информацию о пользователе по его ID.
    """
    user = crud.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return schemas.UserPublicOut.model_validate(user)

@router.post("/me/change-email/request")
async def request_email_change(
    request: ChangeEmailRequest,
    background_tasks: BackgroundTasks,
    req: Request,
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Запрос на смену email с подтверждением"""
    old_email = current_user
    new_email = request.new_email.strip().lower()
    client_ip = req.client.host
    
    # Проверяем, не заблокирован ли IP
    if redis_client.get(f"blocked_ip:{client_ip}"):
        logger.warning(f"Заблокированный IP {client_ip} пытается сменить email")
        raise HTTPException(status_code=429, detail="Слишком много попыток. Попробуйте позже.")
    
    # Проверяем, что новый email не занят
    if crud.get_user_by_email(db, email=new_email):
        raise HTTPException(status_code=400, detail="Этот email уже используется")
    
    # Проверяем, что новый email отличается от текущего
    if old_email == new_email:
        raise HTTPException(status_code=400, detail="Новый email должен отличаться от текущего")
    
    # Генерируем код подтверждения
    code = str(random.randint(100000, 999999))
    now = int(time.time())
    
    # Сохраняем данные в Redis
    change_data = {
        "old_email": old_email,
        "new_email": new_email,
        "created_at": now
    }
    redis_client.set(f"email_change:{new_email}", json.dumps(change_data), ex=CODE_TTL)
    redis_client.set(f"email_change_code:{new_email}", f"{code}:{now}", ex=CODE_TTL)
    
    # Отправляем код на новый email
    background_tasks.add_task(send_email_code, new_email, code)
    logger.info(f"Отправлен код подтверждения для смены email с {old_email} на {new_email}")
    
    return {"detail": "Код подтверждения отправлен на новый email", "success": True}

@router.post("/me/change-email/verify")
async def verify_email_change(
    request: ChangeEmailVerifyRequest,
    req: Request,
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    """Подтверждение смены email"""
    old_email = request.old_email.strip().lower()
    new_email = request.new_email.strip().lower()
    code = request.code.strip()
    client_ip = req.client.host
    
    # Проверяем, что пользователь авторизован и это его текущий email
    if old_email != current_user:
        raise HTTPException(status_code=403, detail="Неверный текущий email")
    
    # Проверяем, не заблокирован ли IP
    if redis_client.get(f"blocked_ip:{client_ip}"):
        logger.warning(f"Заблокированный IP {client_ip} пытается подтвердить смену email")
        raise HTTPException(status_code=429, detail="Слишком много попыток. Попробуйте позже.")
    
    # Получаем данные о смене email
    change_data = redis_client.get(f"email_change:{new_email}")
    if not change_data:
        raise HTTPException(status_code=400, detail="Запрос на смену email не найден или истёк")
    
    change_data = json.loads(change_data)
    if change_data["old_email"] != old_email:
        raise HTTPException(status_code=400, detail="Неверные данные для смены email")
    
    # Проверяем код
    code_entry = redis_client.get(f"email_change_code:{new_email}")
    if not code_entry:
        raise HTTPException(status_code=400, detail="Код подтверждения не найден или истёк")
    
    saved_code, created_at = code_entry.split(":")
    created_at = int(created_at)
    now = int(time.time())
    
    if now - created_at > CODE_TTL:
        redis_client.delete(f"email_change:{new_email}")
        redis_client.delete(f"email_change_code:{new_email}")
        raise HTTPException(status_code=400, detail="Код подтверждения истёк")
    
    if code != saved_code:
        raise HTTPException(status_code=400, detail="Неверный код подтверждения")
    
    # Получаем пользователя
    user = crud.get_user_by_email(db, email=old_email)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Обновляем email
    user.email = new_email
    db.commit()
    db.refresh(user)
    
    # Очищаем данные в Redis
    redis_client.delete(f"email_change:{new_email}")
    redis_client.delete(f"email_change_code:{new_email}")
    
    # Создаём новый токен с новым email
    access_token = auth.create_access_token(
        data={"sub": new_email},
        expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    logger.info(f"Email успешно изменён с {old_email} на {new_email}")
    
    return {
        "detail": "Email успешно изменён",
        "success": True,
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/reset-password/request")
async def request_password_reset(
    request: ResetPasswordRequest,
    background_tasks: BackgroundTasks,
    req: Request,
    db: Session = Depends(get_db)
):
    """Запрос на восстановление пароля"""
    email = request.email.strip().lower()
    client_ip = req.client.host
    
    # Проверяем, не заблокирован ли IP
    if redis_client.get(f"blocked_ip:{client_ip}"):
        logger.warning(f"Заблокированный IP {client_ip} пытается запросить сброс пароля для {email}")
        raise HTTPException(status_code=429, detail="Слишком много попыток. Попробуйте позже.")
    
    # Проверяем существование пользователя
    user = crud.get_user_by_email(db, email=email)
    if not user:
        # Для безопасности не сообщаем, что пользователь не найден
        logger.info(f"Попытка сброса пароля для несуществующего email {email} с IP {client_ip}")
        return {"detail": "Если email существует, на него будет отправлен код", "success": True}
    
    # Проверка лимита по времени между отправками
    history_key = f"reset_password_history:{email}"
    history = redis_client.lrange(history_key, 0, -1)
    now = int(time.time())
    history = [int(t) for t in history if now - int(t) < 3600]
    
    if history and now - history[-1] < SEND_CODE_INTERVAL:
        logger.info(f"Слишком частый запрос сброса пароля для {email} с IP {client_ip}")
        raise HTTPException(status_code=429, detail=f"Код можно запрашивать не чаще, чем раз в {SEND_CODE_INTERVAL} секунд")
    
    if len(history) >= SEND_CODE_MAX_PER_HOUR:
        logger.warning(f"Превышен лимит запросов сброса пароля для {email} с IP {client_ip}")
        raise HTTPException(status_code=429, detail=f"Превышен лимит запросов. Попробуйте позже")
    
    # Генерируем код
    code = str(random.randint(100000, 999999))
    
    # Сохраняем код в Redis
    redis_client.set(f"reset_password_code:{email}", f"{code}:{now}", ex=CODE_TTL)
    
    # Обновляем историю
    redis_client.rpush(history_key, now)
    redis_client.expire(history_key, 3600)
    
    # Сбрасываем попытки
    redis_client.delete(f"reset_password_attempts:{email}")
    
    # Отправляем email
    background_tasks.add_task(send_email_code, email, code)
    logger.info(f"Отправлен код для сброса пароля на {email} с IP {client_ip}")
    
    return {"detail": "Если email существует, на него будет отправлен код", "success": True}

@router.post("/reset-password/verify")
async def verify_reset_password_code(
    request: ResetPasswordVerifyRequest,
    req: Request
):
    """Подтверждение кода для сброса пароля"""
    email = request.email.strip().lower()
    code = request.code.strip()
    client_ip = req.client.host
    
    # Проверяем, не заблокирован ли IP
    if redis_client.get(f"blocked_ip:{client_ip}"):
        logger.warning(f"Заблокированный IP {client_ip} пытается верифицировать код сброса пароля для {email}")
        raise HTTPException(status_code=429, detail="Слишком много попыток. Попробуйте позже.")
    
    # Проверяем код
    entry = redis_client.get(f"reset_password_code:{email}")
    if not entry:
        logger.info(f"Попытка верификации несуществующего кода сброса пароля для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Код не найден или истёк срок действия")
    
    saved_code, created_at = entry.split(":")
    created_at = int(created_at)
    now = int(time.time())
    
    # Проверяем количество попыток
    attempts_key = f"reset_password_attempts:{email}"
    attempts = redis_client.get(attempts_key)
    attempts = int(attempts) if attempts else 0
    
    if attempts >= MAX_CODE_ATTEMPTS:
        logger.warning(f"Превышено количество попыток сброса пароля для {email} с IP {client_ip}")
        redis_client.set(f"blocked_ip:{client_ip}", "1", ex=IP_BLOCK_DURATION)
        raise HTTPException(status_code=429, detail="Превышено количество попыток. Запросите новый код.")
    
    if now - created_at > CODE_TTL:
        redis_client.delete(f"reset_password_code:{email}")
        redis_client.delete(attempts_key)
        logger.info(f"Истёкший код сброса пароля для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Код истёк, запросите новый")
    
    if code != saved_code:
        redis_client.incr(attempts_key)
        redis_client.expire(attempts_key, CODE_TTL)
        logger.warning(f"Неверный код сброса пароля для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Неверный код")
    
    # Успешно — сбрасываем попытки
    redis_client.delete(attempts_key)
    logger.info(f"Успешная верификация кода сброса пароля для {email} с IP {client_ip}")
    return {"detail": "Код подтверждён", "success": True}

@router.post("/reset-password/set")
async def set_new_password(
    request: ResetPasswordSetRequest,
    req: Request,
    db: Session = Depends(get_db)
):
    """Установка нового пароля после подтверждения кода"""
    email = request.email.strip().lower()
    code = request.code.strip()
    new_password = request.new_password
    client_ip = req.client.host
    
    # Проверяем, не заблокирован ли IP
    if redis_client.get(f"blocked_ip:{client_ip}"):
        logger.warning(f"Заблокированный IP {client_ip} пытается установить новый пароль для {email}")
        raise HTTPException(status_code=429, detail="Слишком много попыток. Попробуйте позже.")
    
    # Проверяем код
    entry = redis_client.get(f"reset_password_code:{email}")
    if not entry:
        logger.info(f"Попытка установки пароля без кода для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Код не найден или истёк срок действия")
    
    saved_code, created_at = entry.split(":")
    created_at = int(created_at)
    now = int(time.time())
    
    if now - created_at > CODE_TTL:
        redis_client.delete(f"reset_password_code:{email}")
        logger.info(f"Истёкший код при установке пароля для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Код истёк, запросите новый")
    
    if code != saved_code:
        logger.warning(f"Неверный код при установке пароля для {email} с IP {client_ip}")
        raise HTTPException(status_code=400, detail="Неверный код")
    
    # Получаем пользователя
    user = crud.get_user_by_email(db, email=email)
    if not user:
        logger.warning(f"Попытка установки пароля для несуществующего пользователя {email} с IP {client_ip}")
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Хэшируем новый пароль
    hashed_password = pwd_context.hash(new_password)
    
    # Обновляем пароль
    user.hashed_password = hashed_password
    db.commit()
    db.refresh(user)
    
    # Очищаем данные в Redis
    redis_client.delete(f"reset_password_code:{email}")
    redis_client.delete(f"reset_password_attempts:{email}")
    
    logger.info(f"Пароль успешно изменён для {email} с IP {client_ip}")
    
    return {"detail": "Пароль успешно изменён", "success": True}
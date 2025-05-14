from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
import os
from datetime import timedelta
import logging
from pydantic import BaseModel

from app import schemas, models, crud, auth
from app.database import SessionLocal, engine, get_db

logger = logging.getLogger(__name__)
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

# --- Регистрация и логин ---

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, email=user.email):
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    hashed_password = pwd_context.hash(user.password)
    created_user = crud.create_user(db=db, user=user, hashed_password=hashed_password)
    return created_user

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
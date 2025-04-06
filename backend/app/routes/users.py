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
    try:
        print(f"Получены данные для входа: username={form_data.username}, password=***")  # Логируем полученные данные
        
        user = crud.authenticate_user(db, form_data.username, form_data.password)
        if not user:
            print("Пользователь не найден или неверный пароль")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Неверный email или пароль",
                headers={"WWW-Authenticate": "Bearer"},
            )
        print(f"Пользователь найден: {user.email}")
        access_token = auth.create_access_token(
            data={"sub": user.email},
            expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        print(f"Ошибка при входе: {str(e)}")
        logger.error(f"Ошибка при входе: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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

# --- Работа с избранным ---

@router.post("/favorites", response_model=schemas.FavoriteOut, summary="Add property to favorites")
def add_favorite(
    favorite: schemas.FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    property_exists = crud.get_property(db, property_id=favorite.property_id)
    if not property_exists:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    existing = crud.get_favorite_by_user_and_property(db, user_id=user.id, property_id=favorite.property_id)
    if existing:
        return schemas.FavoriteOut.model_validate(existing)
    fav = crud.add_to_favorites(db, user_id=user.id, property_id=favorite.property_id)
    return schemas.FavoriteOut.model_validate(fav)

@router.get("/favorites", response_model=List[schemas.FavoriteOut], summary="List favorites")
def list_favorites(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    favorites = crud.get_favorites(db, user_id=user.id)
    return [schemas.FavoriteOut.model_validate(fav) for fav in favorites]

@router.delete("/favorites/{property_id}", summary="Remove property from favorites")
def remove_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    fav = crud.get_favorite_by_user_and_property(db, user_id=user.id, property_id=property_id)
    if not fav:
        raise HTTPException(status_code=404, detail="Объявление не найдено в избранном")
    crud.remove_from_favorites(db, user_id=user.id, property_id=property_id)
    return {"detail": "Объявление удалено из избранного"}

@router.get("/me/history", response_model=List[schemas.HistoryOut])
def read_user_history(
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    history = crud.get_history_by_user(db, user_id=user.id)
    return [schemas.HistoryOut.model_validate(h) for h in history]

@router.delete("/me/history/{history_id}", summary="Remove item from history")
def remove_from_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Сначала находим запись, чтобы получить property_id
    history_item = db.query(models.History).filter(
        models.History.id == history_id,
        models.History.user_id == user.id
    ).first()
    
    if not history_item:
        raise HTTPException(status_code=404, detail="Запись не найдена в истории")
    
    # Удаляем все записи для этого объявления
    db.query(models.History).filter(
        models.History.user_id == user.id,
        models.History.property_id == history_item.property_id
    ).delete()
    
    db.commit()
    return {"detail": "Запись удалена из истории"}

@router.delete("/me/history", summary="Clear all history")
def clear_history(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Удаляем все записи истории для данного пользователя
    db.query(models.History).filter(models.History.user_id == user.id).delete()
    db.commit()
    
    return {"detail": "История просмотров очищена"}

# --- НОВЫЙ ЭНДПОИНТ: Получение публичной информации о пользователе по ID --- 
@router.get("/{user_id}", response_model=schemas.UserPublicOut) # Используем новую схему
async def get_user_public_profile(user_id: int, db: Session = Depends(get_db)):
    """
    Возвращает публичную информацию о пользователе по его ID.
    Не требует аутентификации.
    """
    logger.info(f"Fetching public profile for user_id: {user_id}")
    user = crud.get_user(db, user_id=user_id) # Предполагаем, что есть crud.get_user
    if not user:
        logger.warning(f"Public profile requested for non-existent user_id: {user_id}")
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Важно: Не возвращайте email, пароль и т.д.!
    # Используйте специальную Pydantic схему UserPublicOut
    return schemas.UserPublicOut.model_validate(user)
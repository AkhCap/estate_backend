from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import schemas, models, crud, auth
from app.database import SessionLocal, engine
from passlib.context import CryptContext
from typing import List

router = APIRouter()

# Инициализируем базу данных
models.Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Функция для получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔹 Регистрация пользователя с выбором роли
@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")

    hashed_password = pwd_context.hash(user.password)
    created_user = crud.create_user(db=db, user=user, hashed_password=hashed_password)

    return schemas.UserOut.model_validate(created_user)

# 🔹 Логин и получение токена
@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}

# 🔹 Получение данных текущего пользователя
@router.get("/me", response_model=schemas.UserOut)
def read_current_user(
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return schemas.UserOut.model_validate(user)  # ✅

# 🔹 Получение объявлений текущего пользователя
@router.get("/me/properties", response_model=List[schemas.PropertyOut])
def read_my_properties(
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return [schemas.PropertyOut.model_validate(prop) for prop in user.properties]  # ✅

# 🔹 Добавление объявления в избранное
@router.post("/favorites", response_model=schemas.FavoriteOut, summary="Add property to favorites")
def add_favorite(
    favorite: schemas.FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ✅ Проверяем, существует ли объявление
    property_exists = crud.get_property(db, property_id=favorite.property_id)
    if not property_exists:
        raise HTTPException(status_code=404, detail="Property not found")

    existing_favorite = crud.get_favorite_by_user_and_property(db, user_id=user.id, property_id=favorite.property_id)
    if existing_favorite:
        return schemas.FavoriteOut.model_validate(existing_favorite)  # ✅

    fav = crud.add_to_favorites(db, user_id=user.id, property_id=favorite.property_id)
    return schemas.FavoriteOut.model_validate(fav)  # ✅

# 🔹 Удаление объявления из избранного
@router.delete("/favorites/{property_id}", response_model=schemas.FavoriteOut, summary="Remove property from favorites")
def remove_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    fav = crud.get_favorite_by_user_and_property(db, user_id=user.id, property_id=property_id)
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")

    removed_favorite = crud.remove_from_favorites(db, user_id=user.id, property_id=property_id)
    return schemas.FavoriteOut.model_validate(removed_favorite)  # ✅

# 🔹 Получение списка избранных объявлений
@router.get("/favorites", response_model=List[schemas.FavoriteOut])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    favorites = crud.get_favorites(db, user_id=user.id)
    return [schemas.FavoriteOut.model_validate(fav) for fav in favorites]  # ✅
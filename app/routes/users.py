from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app import schemas, models, crud, auth
from app.database import SessionLocal, engine
from passlib.context import CryptContext
from fastapi import APIRouter, Depends, Header
from app import auth
from typing import List

router = APIRouter()

router = APIRouter()
models.Base.metadata.create_all(bind=engine)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    hashed_password = pwd_context.hash(user.password)
    return crud.create_user(db=db, user=user, hashed_password=hashed_password)

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверные учетные данные")
    token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer"}



@router.get("/me")
def read_current_user(current_user: str = Depends(auth.get_current_user)):
    return {"email": current_user}

# Пример: получение данных текущего пользователя (личный кабинет)
@router.get("/me", response_model=schemas.UserOut)
def read_current_user(
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.get("/me/properties", response_model=List[schemas.PropertyOut])
def read_my_properties(
    current_user: str = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user.properties

@router.post("/", response_model=schemas.FavoriteOut, summary="Add property to favorites")
def add_favorite(
    favorite: schemas.FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    fav = crud.add_to_favorites(db, user_id=user.id, property_id=favorite.property_id)
    if not fav:
        raise HTTPException(status_code=400, detail="Error adding to favorites")
    return fav

@router.delete("/", response_model=schemas.FavoriteOut, summary="Remove property from favorites")
def remove_favorite(
    favorite: schemas.FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    fav = crud.remove_from_favorites(db, user_id=user.id, property_id=favorite.property_id)
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return fav

@router.get("/", response_model=List[schemas.FavoriteOut], summary="List favorites")
def list_favorites(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.get_favorites(db, user_id=user.id)
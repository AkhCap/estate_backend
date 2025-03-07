from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.FavoriteOut, summary="Add property to favorites")
def add_favorite(
    favorite: schemas.FavoriteCreate,  # данные, которые отправляет клиент
    db: Session = Depends(get_db),       # зависимость для получения сессии базы данных
    current_user: str = Depends(auth.get_current_user)  # зависимость для авторизации
):
    # Здесь current_user будет содержать значение, возвращенное функцией auth.get_current_user
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
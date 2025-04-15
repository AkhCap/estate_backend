from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import get_db
import logging
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# Добавить объявление в избранное
@router.post("/", response_model=schemas.FavoriteOut, summary="Добавить объект в избранное")
def add_favorite(
    favorite: schemas.FavoriteCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Добавить объект в избранное"""
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

# Получить список избранных объявлений для текущего пользователя
@router.get("/", response_model=List[schemas.FavoriteOut], summary="Список избранных объектов")
def list_favorites(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Получить список избранных объектов"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    favorites = crud.get_favorites(db, user_id=user.id)
    return [schemas.FavoriteOut.model_validate(fav) for fav in favorites]

# Удалить объявление из избранного
@router.delete("/{property_id}", response_model=dict, summary="Удалить объект из избранного")
def remove_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Удалить объект из избранного"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    fav = crud.get_favorite_by_user_and_property(db, user_id=user.id, property_id=property_id)
    if not fav:
        raise HTTPException(status_code=404, detail="Объявление не найдено в избранном")
    crud.remove_from_favorites(db, user_id=user.id, property_id=property_id)
    logger.info(f"Удалено из избранного: user_id={user.id}, property_id={property_id}")
    return {"detail": "Объявление удалено из избранного"}
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
    try:
        user = crud.get_user_by_email(db, email=current_user)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        result = crud.add_to_favorites(db, user_id=user.id, property_id=favorite.property_id)
        logger.info(f"Добавлено в избранное: user_id={user.id}, property_id={favorite.property_id}")
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Ошибка при добавлении в избранное: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

# Получить список избранных объявлений для текущего пользователя
@router.get("/", response_model=List[schemas.FavoriteOut], summary="Список избранных объектов")
def list_favorites(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    try:
        user = crud.get_user_by_email(db, email=current_user)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        result = crud.get_favorites(db, user_id=user.id)
        logger.info(f"Получен список избранного для пользователя: user_id={user.id}")
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Ошибка при получении списка избранного: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )

# Удалить объявление из избранного
@router.delete("/{property_id}", response_model=dict, summary="Удалить объект из избранного")
def remove_favorite(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    try:
        user = crud.get_user_by_email(db, email=current_user)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
            
        favorite = crud.get_favorite_by_user_and_property(db, user_id=user.id, property_id=property_id)
        if not favorite:
            raise HTTPException(status_code=404, detail="Объект не найден в избранном")
            
        crud.remove_from_favorites(db, user_id=user.id, property_id=property_id)
        logger.info(f"Удалено из избранного: user_id={user.id}, property_id={property_id}")
        return {"detail": "Объект успешно удален из избранного"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Ошибка при удалении из избранного: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)}
        )
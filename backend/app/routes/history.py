from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth, models
from app.database import get_db

router = APIRouter()

@router.get("/", response_model=List[schemas.HistoryOut])
def get_history(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Получить историю просмотров пользователя"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    history = crud.get_history_by_user(db, user_id=user.id)
    return [schemas.HistoryOut.model_validate(h) for h in history]

@router.post("/", response_model=schemas.HistoryOut)
def add_to_history(
    history: schemas.HistoryCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Добавить просмотр объекта в историю"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return crud.create_history(db, history=history, user_id=user.id)

@router.delete("/{history_id}")
def remove_from_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Удалить запись из истории просмотров"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    history_item = db.query(models.History).filter(
        models.History.id == history_id,
        models.History.user_id == user.id
    ).first()
    
    if not history_item:
        raise HTTPException(status_code=404, detail="Запись не найдена в истории")
    
    db.query(models.History).filter(
        models.History.user_id == user.id,
        models.History.property_id == history_item.property_id
    ).delete()
    
    db.commit()
    return {"detail": "Запись удалена из истории"}

@router.delete("/")
def clear_history(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Очистить всю историю просмотров"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    db.query(models.History).filter(models.History.user_id == user.id).delete()
    db.commit()
    
    return {"detail": "История просмотров очищена"}
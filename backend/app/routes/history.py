from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import get_db

router = APIRouter()

@router.post("/", response_model=schemas.HistoryOut, summary="Добавить просмотр объекта")
def add_history(
    history: schemas.HistoryCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return crud.create_history(db, history, user_id=user.id)

@router.get("/", response_model=List[schemas.HistoryOut], summary="История просмотров пользователя")
def list_history(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return crud.get_history_by_user(db, user_id=user.id)
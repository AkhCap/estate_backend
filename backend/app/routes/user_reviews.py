from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth
from app.database import get_db

router = APIRouter()

@router.post("/users/{user_id}/reviews", response_model=schemas.UserReviewOut)
def create_user_review(
    user_id: int,
    review: schemas.UserReviewCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Создать отзыв о пользователе"""
    try:
        user = crud.get_user_by_email(db, email=current_user)
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        db_review = crud.create_user_review(db, review=review, reviewer_id=user.id)
        return db_review
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/users/{user_id}/reviews", response_model=List[schemas.UserReviewOut])
def get_user_reviews(
    user_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Получить все отзывы о пользователе"""
    reviews = crud.get_user_reviews(db, user_id=user_id, skip=skip, limit=limit)
    return reviews

@router.get("/users/{user_id}/reviews/me", response_model=schemas.UserReviewOut)
def get_my_review(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Получить свой отзыв о пользователе"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    review = crud.get_user_review_by_reviewer(db, reviewer_id=user.id, reviewed_user_id=user_id)
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    
    return review

@router.put("/users/{user_id}/reviews/me", response_model=schemas.UserReviewOut)
def update_my_review(
    user_id: int,
    review_update: schemas.UserReviewUpdate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Обновить свой отзыв о пользователе"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    review = crud.get_user_review_by_reviewer(db, reviewer_id=user.id, reviewed_user_id=user_id)
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    
    updated_review = crud.update_user_review(db, review_id=review.id, review_update=review_update)
    return updated_review

@router.delete("/users/{user_id}/reviews/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_review(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """Удалить свой отзыв о пользователе"""
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    review = crud.get_user_review_by_reviewer(db, reviewer_id=user.id, reviewed_user_id=user_id)
    if not review:
        raise HTTPException(status_code=404, detail="Отзыв не найден")
    
    crud.delete_user_review(db, review_id=review.id)
    return None

@router.get("/users/{user_id}/rating", response_model=schemas.UserRatingOut)
def get_user_rating(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Получить статистику рейтинга пользователя"""
    rating_stats = crud.get_user_rating_stats(db, user_id=user_id)
    return rating_stats 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app import schemas, crud, auth, models
from app.database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=schemas.ReviewOut, summary="Add a review for a property")
def add_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_review(db, review, user_id=user.id)

@router.get("/me", response_model=List[schemas.ReviewOut], summary="List my reviews")
def list_my_reviews(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.get_reviews_by_user(db, user_id=user.id)

@router.get("/property/{property_id}", response_model=List[schemas.ReviewOut], summary="List reviews for a property")
def list_property_reviews(property_id: int, db: Session = Depends(get_db)):
    reviews = crud.get_reviews_by_property(db, property_id=property_id)
    return reviews

@router.put("/{review_id}", response_model=schemas.ReviewOut, summary="Update a review")
def update_review(
    review_id: int,
    review_update: schemas.ReviewBase,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    db_review = db.query(models.Review).filter(
        models.Review.id == review_id, 
        models.Review.user_id == user.id
    ).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    updated_review = crud.update_review(db, review_id, review_update)
    return updated_review

@router.delete("/{review_id}", response_model=schemas.ReviewOut, summary="Delete a review")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    db_review = db.query(models.Review).filter(
        models.Review.id == review_id, 
        models.Review.user_id == user.id
    ).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
    deleted_review = crud.delete_review(db, review_id)
    return deleted_review
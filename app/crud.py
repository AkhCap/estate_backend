from sqlalchemy.orm import Session
from app import models, schemas
from typing import Optional

def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def create_property(db: Session, property: schemas.PropertyCreate, owner_id: int):
    db_property = models.Property(**property.dict(), owner_id=owner_id)
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

def get_property(db: Session, property_id: int):
    return db.query(models.Property).filter(models.Property.id == property_id).first()

def get_properties(
    db: Session, 
    skip: int = 0, 
    limit: int = 10, 
    min_price: Optional[float] = None, 
    max_price: Optional[float] = None, 
    search: Optional[str] = None,
    rooms: Optional[int] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    floor: Optional[int] = None,
    property_type: Optional[str] = None,
    sort_by: Optional[str] = None,   # Имя поля для сортировки
    sort_order: Optional[str] = "asc"  # "asc" или "desc"
):
    query = db.query(models.Property)
    if min_price is not None:
        query = query.filter(models.Property.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Property.price <= max_price)
    if search:
        query = query.filter(
            (models.Property.title.ilike(f"%{search}%")) |
            (models.Property.address.ilike(f"%{search}%"))
        )
    if rooms is not None:
        query = query.filter(models.Property.rooms == rooms)
    if min_area is not None:
        query = query.filter(models.Property.area >= min_area)
    if max_area is not None:
        query = query.filter(models.Property.area <= max_area)
    if floor is not None:
        query = query.filter(models.Property.floor == floor)
    if property_type:
        query = query.filter(models.Property.property_type == property_type)
    
    # Добавляем сортировку, если указано поле
    if sort_by in {"price", "rooms", "area", "floor"}:
        order_attr = getattr(models.Property, sort_by)
        if sort_order == "desc":
            order_attr = order_attr.desc()
        else:
            order_attr = order_attr.asc()
        query = query.order_by(order_attr)
        
    return query.offset(skip).limit(limit).all()

def update_property(db: Session, property_id: int, property_update: schemas.PropertyUpdate):
    db_property = get_property(db, property_id)
    if not db_property:
        return None
    update_data = property_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)
    db.commit()
    db.refresh(db_property)
    return db_property

def delete_property(db: Session, property_id: int):
    db_property = get_property(db, property_id)
    if not db_property:
        return None
    db.delete(db_property)
    db.commit()
    return db_property

def add_to_favorites(db: Session, user_id: int, property_id: int):
    # Проверьте, не добавлено ли уже объявление в избранное
    existing = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.property_id == property_id
    ).first()
    if existing:
        return existing
    fav = models.Favorite(user_id=user_id, property_id=property_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav

def remove_from_favorites(db: Session, user_id: int, property_id: int):
    fav = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.property_id == property_id
    ).first()
    if not fav:
        return None
    db.delete(fav)
    db.commit()
    return fav

def get_favorites(db: Session, user_id: int):
    return db.query(models.Favorite).filter(models.Favorite.user_id == user_id).all()

def create_review(db: Session, review: schemas.ReviewCreate, user_id: int):
    db_review = models.Review(
        user_id=user_id,
        property_id=review.property_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_reviews_by_property(db: Session, property_id: int):
    return db.query(models.Review).filter(models.Review.property_id == property_id).all()

def get_reviews_by_user(db: Session, user_id: int):
    return db.query(models.Review).filter(models.Review.user_id == user_id).all()

def update_review(db: Session, review_id: int, review_update: schemas.ReviewBase):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if db_review:
        if review_update.rating is not None:
            db_review.rating = review_update.rating
        if review_update.comment is not None:
            db_review.comment = review_update.comment
        db.commit()
        db.refresh(db_review)
    return db_review

def delete_review(db: Session, review_id: int):
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if db_review:
        db.delete(db_review)
        db.commit()
    return db_review
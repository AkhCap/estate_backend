from sqlalchemy.orm import Session, joinedload, selectinload
from app import models, schemas
from typing import Optional, List
from sqlalchemy.exc import SQLAlchemyError

# Получение пользователя по email
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.email == email).first()
    print(f"🔍 Ищем пользователя по email: {email} -> Найден: {user}")  # 🛠 DEBUG
    return user


# Создание нового пользователя с выбором роли
def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.User:
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
        role=user.role,  # Используем значение из UserCreate
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Обновление профиля пользователя с дополнительными полями
def update_user(db: Session, user_id: int, updated_data: schemas.UserUpdate) -> Optional[models.User]:
    # Находим пользователя по ID
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None

    # Обновляем поля пользователя, если они переданы
    if updated_data.email is not None:
        user.email = updated_data.email
    if updated_data.first_name is not None:
        user.first_name = updated_data.first_name
    if updated_data.last_name is not None:
        user.last_name = updated_data.last_name
    if updated_data.phone is not None:
        user.phone = updated_data.phone
    if updated_data.avatar_url is not None:
        user.avatar_url = updated_data.avatar_url

    try:
        db.commit()
        db.refresh(user)
    except SQLAlchemyError as e:
        db.rollback()
        raise e

    return user



# Получение списка объявлений
def get_properties(db: Session, skip: int = 0, limit: int = 10):
    properties = db.query(models.Property).offset(skip).limit(limit).all()
    
    for property in properties:
        # Преобразуем JSON поля в списки
        property.windowView = property.windowView or []
        property.parking = property.parking or []
        property.livingConditions = property.livingConditions or []
        property.contactMethod = property.contactMethod or []
    
    return properties

# Получение одного объявления по ID
def get_property(db: Session, property_id: int):
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if prop:
        # Преобразуем JSON поля в списки
        prop.windowView = prop.windowView or []
        prop.parking = prop.parking or []
        prop.livingConditions = prop.livingConditions or []
        prop.contactMethod = prop.contactMethod or []

    return prop

# Создание объявления
def create_property(db: Session, property: schemas.PropertyCreate, owner_id: int):
    db_property = models.Property(
        title=property.title,
        description=property.description,
        price=property.price,
        address=property.address,
        rooms=property.rooms,
        area=property.area,
        floor=property.floor,
        total_floors=property.total_floors,
        property_type=property.property_type,
        deal_type=property.deal_type,
        owner_id=owner_id,
        propertyCondition=property.propertyCondition or "",
        hasBalcony=property.hasBalcony if property.hasBalcony is not None else False,
        windowView=property.windowView or [],
        bathroom=property.bathroom or "",
        bathType=property.bathType or "",
        heating=property.heating or "",
        renovation=property.renovation or "",
        liftsPassenger=property.liftsPassenger or 0,
        liftsFreight=property.liftsFreight or 0,
        parking=property.parking or [],
        prepayment=property.prepayment or "нет",
        deposit=property.deposit or 0.0,
        livingConditions=property.livingConditions or [],
        whoRents=property.whoRents or "",
        landlordContact=property.landlordContact or "",
        contactMethod=property.contactMethod or []
    )

    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property

# Обновление объявления
def update_property(db: Session, property_id: int, property_update: schemas.PropertyUpdate) -> Optional[models.Property]:
    db_property = get_property(db, property_id)
    if not db_property:
        return None

    update_data = property_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_property, key, value)

    db.commit()
    db.refresh(db_property)
    return db_property

# Удаление объявления
def delete_property(db: Session, property_id: int) -> Optional[models.Property]:
    db_property = get_property(db, property_id)
    if not db_property:
        return None

    db.delete(db_property)
    db.commit()
    return db_property

# Функции работы с избранным
def get_favorite_by_user_and_property(db: Session, user_id: int, property_id: int):
    return db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.property_id == property_id
    ).first()

def add_to_favorites(db: Session, user_id: int, property_id: int) -> Optional[models.Favorite]:
    existing_favorite = get_favorite_by_user_and_property(db, user_id, property_id)
    if existing_favorite:
        return existing_favorite

    fav = models.Favorite(user_id=user_id, property_id=property_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav

def get_favorites(db: Session, user_id: int) -> List[models.Favorite]:
    return db.query(models.Favorite).filter(models.Favorite.user_id == user_id).all()

def remove_from_favorites(db: Session, user_id: int, property_id: int) -> Optional[models.Favorite]:
    favorite = get_favorite_by_user_and_property(db, user_id, property_id)
    if favorite:
        db.delete(favorite)
        db.commit()
    return favorite

# Добавление изображений к объявлению
def add_property_image(db: Session, property_id: int, image_url: str) -> models.PropertyImage:
    image = models.PropertyImage(property_id=property_id, image_url=image_url)
    db.add(image)
    db.commit()
    db.refresh(image)
    return image

def get_property_images(db: Session, property_id: int) -> List[models.PropertyImage]:
    return db.query(models.PropertyImage).filter(models.PropertyImage.property_id == property_id).all()

# Работа с отзывами
def create_review(db: Session, review: schemas.ReviewCreate, user_id: int) -> models.Review:
    db_review = models.Review(
        user_id=user_id,
        property_id=review.property_id,
        rating=review.rating,
        comment=review.comment,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_reviews_by_property(db: Session, property_id: int):
    return db.query(models.Review).filter(models.Review.property_id == property_id).all()

def get_reviews_by_user(db: Session, user_id: int) -> List[models.Review]:
    return db.query(models.Review).filter(models.Review.user_id == user_id).all()

def update_review(db: Session, review_id: int, review_update: schemas.ReviewBase) -> Optional[models.Review]:
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
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if review:
        db.delete(review)
        db.commit()
    return review

# История просмотров
def create_history(db: Session, history: schemas.HistoryCreate, user_id: int):
    db_history = models.History(
        user_id=user_id,
        property_id=history.property_id
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

def get_history_by_user(db: Session, user_id: int):
    return db.query(models.History).filter(models.History.user_id == user_id).all()
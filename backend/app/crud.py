from sqlalchemy.orm import Session, joinedload, selectinload
from app import models, schemas
from typing import Optional, List, Dict
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException, status
from sqlalchemy import func, desc, distinct, or_, text
from . import auth
import logging
from passlib.context import CryptContext
from datetime import datetime

logger = logging.getLogger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Получение пользователя по email
def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    user = db.query(models.User).filter(models.User.email == email).first()
    print(f"🔍 Ищем пользователя по email: {email} -> Найден: {user}")  # 🛠 DEBUG
    return user


# Создание нового пользователя
def create_user(db: Session, user: schemas.UserCreate, hashed_password: str) -> models.User:
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
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
def get_property(db: Session, property_id: int, user_id: int = None):
    prop = db.query(models.Property).options(
        joinedload(models.Property.price_history)
    ).filter(models.Property.id == property_id).first()
    
    if prop:
        # Преобразуем JSON поля в списки
        prop.window_view = prop.window_view or []
        prop.parking = prop.parking or []
        prop.living_conditions = prop.living_conditions or []
        prop.contact_method = prop.contact_method or []
        prop.furniture = prop.furniture or []
        prop.appliances = prop.appliances or []
        prop.connectivity = prop.connectivity or []
        
        # По умолчанию устанавливаем is_viewed в False
        prop.is_viewed = False
        
        # Добавляем информацию о просмотре только если:
        # 1. Пользователь авторизован (user_id не None)
        # 2. Пользователь не является владельцем объявления
        if user_id and prop.owner_id != user_id:
            view = db.query(models.PropertyViews).filter(
                models.PropertyViews.user_id == user_id,
                models.PropertyViews.property_id == property_id
            ).first()
            prop.is_viewed = view is not None
            
        # Сортируем историю цен по дате изменения (новые сверху)
        if prop.price_history:
            prop.price_history.sort(key=lambda x: x.change_date, reverse=True)
            
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
        property_condition=property.property_condition or "",
        has_balcony=property.has_balcony if property.has_balcony is not None else False,
        window_view=property.window_view or [],
        bathroom=property.bathroom or "",
        bath_type=property.bath_type or "",
        heating=property.heating or "",
        renovation=property.renovation or "",
        lifts_passenger=property.lifts_passenger or 0,
        lifts_freight=property.lifts_freight or 0,
        parking=property.parking or [],
        prepayment=property.prepayment or "нет",
        deposit=property.deposit or 0.0,
        living_conditions=property.living_conditions or [],
        who_rents=property.who_rents or "",
        landlord_contact=property.landlord_contact or "",
        contact_method=property.contact_method or [],
        furniture=property.furniture or [],
        appliances=property.appliances or [],
        connectivity=property.connectivity or [],
        build_year=property.build_year
    )

    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    
    # Создаем первую запись в истории цен
    create_price_history(db, db_property.id, db_property.price)
    
    return db_property

# Обновление объявления
def update_property(db: Session, property_id: int, property_update: schemas.PropertyUpdate) -> Optional[models.Property]:
    db_property = get_property(db, property_id)
    if not db_property:
        return None

    # Сначала сохраняем старую цену в историю, если цена изменилась
    if 'price' in property_update.dict(exclude_unset=True) and property_update.price != db_property.price:
        old_price = db_property.price
        create_price_history(db, property_id, old_price)

    # Обновляем поля объявления
    update_data = property_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_property, field, value)

    try:
        db.commit()
        db.refresh(db_property)
        return db_property
    except Exception as db_error:
        print(f"Ошибка при сохранении в БД: {db_error}")
        db.rollback()
        raise

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
    return db.query(models.Favorite)\
        .filter(models.Favorite.user_id == user_id)\
        .options(
            joinedload(models.Favorite.property).joinedload(models.Property.images)
        )\
        .all()

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

# История просмотров
def create_history(db: Session, history: schemas.HistoryCreate, user_id: int):
    # Проверяем, существует ли уже такая запись
    existing_history = db.query(models.History).filter(
        models.History.user_id == user_id,
        models.History.property_id == history.property_id
    ).first()
    
    if existing_history:
        # Если запись существует, обновляем время просмотра
        existing_history.viewed_at = datetime.now()
        db.commit()
        db.refresh(existing_history)
        return existing_history
    
    # Если записи нет, создаем новую
    db_history = models.History(
        user_id=user_id,
        property_id=history.property_id
    )
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history

# Функции для работы с просмотрами
def add_property_view(db: Session, user_id: int, property_id: int):
    """Добавляет запись о просмотре объявления"""
    view = models.PropertyViews(user_id=user_id, property_id=property_id)
    db.add(view)
    db.commit()
    db.refresh(view)
    return view

def is_property_viewed(db: Session, user_id: int, property_id: int) -> bool:
    """
    Проверяет, было ли объявление просмотрено пользователем.
    Возвращает True только если:
    1. Пользователь не является владельцем объявления
    2. Пользователь просматривал детальную страницу объявления
    """
    # Получаем объявление для проверки владельца
    property = db.query(models.Property).filter(models.Property.id == property_id).first()
    if not property or property.owner_id == user_id:
        return False
        
    # Проверяем наличие записи в таблице просмотров
    view = db.query(models.PropertyViews).filter(
        models.PropertyViews.user_id == user_id,
        models.PropertyViews.property_id == property_id
    ).first()
    
    # Проверяем также наличие записи в истории просмотров
    history = db.query(models.History).filter(
        models.History.user_id == user_id,
        models.History.property_id == property_id
    ).first()
    
    # Возвращаем True только если есть и запись о просмотре, и запись в истории
    return view is not None and history is not None

# Работа с историей цен
def create_price_history(db: Session, property_id: int, price: float) -> models.PriceHistory:
    db_price_history = models.PriceHistory(
        property_id=property_id,
        price=price
    )
    db.add(db_price_history)
    db.commit()
    db.refresh(db_price_history)
    return db_price_history

def get_price_history(db: Session, property_id: int, limit: int = 2) -> List[models.PriceHistory]:
    return db.query(models.PriceHistory)\
        .filter(models.PriceHistory.property_id == property_id)\
        .order_by(models.PriceHistory.change_date.desc())\
        .limit(limit)\
        .all()

def get_price_change_percentage(db: Session, property_id: int) -> Optional[float]:
    history = get_price_history(db, property_id, limit=2)
    if len(history) < 2:
        return None
    
    old_price = history[1].price
    new_price = history[0].price
    return ((new_price - old_price) / old_price) * 100

def authenticate_user(db: Session, email: str, password: str):
    """
    Проверяет учетные данные пользователя
    """
    try:
        print(f"Поиск пользователя с email: {email}")  # Добавляем логирование
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            print("Пользователь не найден")  # Добавляем логирование
            return None
        
        print(f"Проверка пароля для пользователя: {user.email}")  # Добавляем логирование
        if not pwd_context.verify(password, user.hashed_password):
            print("Неверный пароль")  # Добавляем логирование
            return None
            
        print(f"Аутентификация успешна для пользователя: {user.email}")  # Добавляем логирование
        return user
    except Exception as e:
        print(f"Ошибка при аутентификации: {str(e)}")  # Добавляем логирование
        logger.error(f"Ошибка при аутентификации: {str(e)}")
        return None

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """Получает пользователя по ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

# Работа с отзывами о пользователях
def create_user_review(db: Session, review: schemas.UserReviewCreate, reviewer_id: int) -> models.UserReview:
    # Проверяем, что пользователь не оставляет отзыв самому себе
    if reviewer_id == review.reviewed_user_id:
        raise ValueError("Нельзя оставить отзыв самому себе")
    
    # Проверяем, не оставлял ли уже пользователь отзыв
    existing_review = db.query(models.UserReview).filter(
        models.UserReview.reviewer_id == reviewer_id,
        models.UserReview.reviewed_user_id == review.reviewed_user_id
    ).first()
    
    if existing_review:
        raise ValueError("Вы уже оставили отзыв этому пользователю")
    
    db_review = models.UserReview(
        reviewer_id=reviewer_id,
        reviewed_user_id=review.reviewed_user_id,
        rating=review.rating,
        comment=review.comment,
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

def get_user_reviews(db: Session, user_id: int, skip: int = 0, limit: int = 10) -> List[models.UserReview]:
    return (
        db.query(models.UserReview)
        .filter(models.UserReview.reviewed_user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_user_review_by_reviewer(db: Session, reviewer_id: int, reviewed_user_id: int) -> Optional[models.UserReview]:
    return (
        db.query(models.UserReview)
        .filter(
            models.UserReview.reviewer_id == reviewer_id,
            models.UserReview.reviewed_user_id == reviewed_user_id
        )
        .first()
    )

def update_user_review(db: Session, review_id: int, review_update: schemas.UserReviewUpdate) -> Optional[models.UserReview]:
    db_review = db.query(models.UserReview).filter(models.UserReview.id == review_id).first()
    if db_review:
        if review_update.rating is not None:
            db_review.rating = review_update.rating
        if review_update.comment is not None:
            db_review.comment = review_update.comment

        db.commit()
        db.refresh(db_review)
    return db_review

def delete_user_review(db: Session, review_id: int):
    review = db.query(models.UserReview).filter(models.UserReview.id == review_id).first()
    if review:
        db.delete(review)
        db.commit()
    return review

def get_user_rating_stats(db: Session, user_id: int) -> Dict:
    reviews = db.query(models.UserReview).filter(models.UserReview.reviewed_user_id == user_id).all()
    
    if not reviews:
        return {
            "average_rating": 0.0,
            "total_reviews": 0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
    
    total_rating = sum(review.rating for review in reviews)
    rating_distribution = {i: 0 for i in range(1, 6)}
    
    for review in reviews:
        rating_distribution[review.rating] += 1
    
    return {
        "average_rating": round(total_rating / len(reviews), 2),
        "total_reviews": len(reviews),
        "rating_distribution": rating_distribution
    }

def get_history_by_user(db: Session, user_id: int) -> List[models.History]:
    """
    Получает историю просмотров для указанного пользователя
    """
    return db.query(models.History)\
        .filter(models.History.user_id == user_id)\
        .order_by(models.History.viewed_at.desc())\
        .all()

def set_main_image(db: Session, property_id: int, image_id: int) -> models.PropertyImage:
    # Сначала сбрасываем предыдущее главное фото
    db.query(models.PropertyImage).filter(
        models.PropertyImage.property_id == property_id,
        models.PropertyImage.is_main == True
    ).update({"is_main": False})
    
    # Устанавливаем новое главное фото
    image = db.query(models.PropertyImage).filter(
        models.PropertyImage.id == image_id,
        models.PropertyImage.property_id == property_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
        
    image.is_main = True
    db.commit()
    db.refresh(image)
    return image

def update_existing_images(db: Session):
    """Обновляет существующие записи изображений, устанавливая is_main=False там, где оно NULL"""
    try:
        db.execute(text("UPDATE property_images SET is_main = FALSE WHERE is_main IS NULL"))
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Error updating existing images: {str(e)}")
        return False

from sqlalchemy.orm import Session
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
        hashed_password=hashed_password,
        role=user.role  # ✅ Теперь при регистрации можно задать роль (PRIVATE, AGENT, DEVELOPER)
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
    if updated_data.username is not None:
        user.username = updated_data.username
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


# Создание объявления
def create_property(db: Session, property: schemas.PropertyCreate, owner_id: int):
    db_property = models.Property(
        **property.dict(exclude={"deal_type"}),  # ❗ Исключаем deal_type из словаря
        owner_id=owner_id,
        deal_type=property.deal_type.value  # ✅ Преобразуем ENUM в строку перед вставкой
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return db_property


# Получение одного объявления по ID
def get_property(db: Session, property_id: int) -> Optional[models.Property]:
    return db.query(models.Property).filter(models.Property.id == property_id).first()


# Получение списка объявлений с фильтрацией
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
    deal_type: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
) -> List[models.Property]:
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
    if deal_type:
        query = query.filter(models.Property.deal_type == deal_type)

    if sort_by in {"price", "rooms", "area", "floor"}:
        order_attr = getattr(models.Property, sort_by)
        if sort_order == "desc":
            query = query.order_by(order_attr.desc())
        else:
            query = query.order_by(order_attr.asc())

    return query.offset(skip).limit(limit).all()


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
    
    # Если у объявления есть связанные записи (например, избранное), их можно удалить заранее:
    db.query(models.Favorite).filter(models.Favorite.property_id == property_id).delete(synchronize_session=False)

    db.delete(db_property)
    db.commit()
    return db_property


# Получение избранного по пользователю и объявлению
def get_favorite_by_user_and_property(db: Session, user_id: int, property_id: int) -> Optional[models.Favorite]:
    return db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.property_id == property_id
    ).first()


# Добавление в избранное
def add_to_favorites(db: Session, user_id: int, property_id: Optional[int]) -> Optional[models.Favorite]:
    if property_id is None:
        raise ValueError("❌ Ошибка: property_id не может быть None!")

    existing_favorite = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.property_id == property_id
    ).first()

    if existing_favorite:
        return existing_favorite

    fav = models.Favorite(user_id=user_id, property_id=property_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav


# Удаление из избранного
def remove_from_favorites(db: Session, user_id: int, property_id: int) -> Optional[models.Favorite]:
    fav = db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.property_id == property_id
    ).first()
    if not fav:
        return None

    db.delete(fav)
    db.commit()
    return fav


# Получение избранных объявлений пользователя
def get_favorites(db: Session, user_id: int) -> List[models.Favorite]:
    return db.query(models.Favorite).filter(models.Favorite.user_id == user_id).all()


# Добавление отзыва
def create_review(db: Session, review: schemas.ReviewCreate, user_id: int) -> models.Review:
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


# Получение отзывов по объявлению
def get_reviews_by_property(db: Session, property_id: int) -> List[models.Review]:
    return db.query(models.Review).filter(models.Review.property_id == property_id).all()


# Получение отзывов по пользователю
def get_reviews_by_user(db: Session, user_id: int) -> List[models.Review]:
    return db.query(models.Review).filter(models.Review.user_id == user_id).all()


# Обновление отзыва
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


# Удаление отзыва
def delete_review(db: Session, review_id: int) -> Optional[models.Review]:
    db_review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if db_review:
        db.delete(db_review)
        db.commit()
    return db_review
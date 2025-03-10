import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


# 🔹 Определяем роли пользователей
class UserRoleEnum(str, enum.Enum):  
    PRIVATE = "private"  # Частное лицо
    AGENT = "agent"  # Агент
    DEVELOPER = "developer"  # Застройщик


# 🔹 Определяем тип сделки
class DealTypeEnum(str, enum.Enum):  
    SALE = "sale"
    RENT = "rent"

    
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(UserRoleEnum), nullable=False, default=UserRoleEnum.PRIVATE)

    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")  # ✅ Удаление объявлений при удалении пользователя
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")  # ✅ Удаление избранного при удалении пользователя
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")  # ✅ Удаление отзывов при удалении пользователя


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    rooms = Column(Integer)
    area = Column(Float)
    floor = Column(Integer)
    total_floors = Column(Integer)  
    property_type = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    image_url = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # ✅ Каскадное удаление объявлений пользователя

    # ENUM теперь соответствует Pydantic
    deal_type = Column(Enum(DealTypeEnum, name="deal_type_enum", create_type=False), nullable=False)

    # Связи
    owner = relationship("User", back_populates="properties")
    favorited_by = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")  # ✅ Удаление из избранного при удалении объявления
    reviews = relationship("Review", back_populates="property", cascade="all, delete-orphan")  # ✅ Удаление отзывов при удалении объявления


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)  # ✅ Добавлено CASCADE
    created_at = Column(DateTime, server_default=func.now())

    # Связи
    user = relationship("User", back_populates="favorites")
    property = relationship("Property", back_populates="favorited_by")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)  # ✅ Добавлено CASCADE
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)  # ✅ Добавлено CASCADE
    rating = Column(Float, nullable=False)  # Оценка, например, от 1 до 5
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Связи
    user = relationship("User", back_populates="reviews")
    property = relationship("Property", back_populates="reviews")
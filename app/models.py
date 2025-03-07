from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# Определяем ENUM для типа сделки
class DealTypeEnum(enum.Enum):
    SALE = "sale"
    RENT = "rent"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    # Связи
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")


class Property(Base):
    __tablename__ = "properties"
    __table_args__ = {"extend_existing": True}  # Разрешаем изменять существующую таблицу

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    price = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    rooms = Column(Integer)
    area = Column(Float)
    floor = Column(Integer)
    total_floors = Column(Integer)  # Добавлена этажность дома
    property_type = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    image_url = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Добавляем ENUM "Тип сделки"
    deal_type = Column(Enum(DealTypeEnum, name="deal_type_enum"), nullable=False)

    # Связи
    owner = relationship("User", back_populates="properties")
    favorited_by = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="property", cascade="all, delete-orphan")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Связи
    user = relationship("User", back_populates="favorites")
    property = relationship("Property", back_populates="favorited_by")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False)
    rating = Column(Float, nullable=False)  # Оценка, например, от 1 до 5
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    # Связи
    user = relationship("User", back_populates="reviews")
    property = relationship("Property", back_populates="reviews")
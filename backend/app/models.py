import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum, DateTime, Text, func, ARRAY, JSON, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base


# 🔹 Определяем роли пользователей
class UserRoleEnum(str, enum.Enum):  
    PRIVATE = "private"  # Частное лицо


# 🔹 Определяем тип сделки
class DealTypeEnum(str, enum.Enum):  
    SALE = "sale"
    RENT = "rent"

    
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="private")  # Значение по умолчанию
    first_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    history = relationship("History", back_populates="user", cascade="all, delete-orphan")
    property_views = relationship("PropertyViews", back_populates="user", cascade="all, delete-orphan")
    reviews_given = relationship("UserReview", foreign_keys="UserReview.reviewer_id", back_populates="reviewer", cascade="all, delete-orphan")
    reviews_received = relationship("UserReview", foreign_keys="UserReview.reviewed_user_id", back_populates="reviewed_user", cascade="all, delete-orphan")

  

class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    description = Column(String)
    price = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    rooms = Column(String)
    area = Column(Float)
    floor = Column(Integer)
    total_floors = Column(Integer)  
    property_type = Column(String, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    image_url = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ceiling_height = Column(Float, nullable=True)
    property_condition = Column(String, nullable=True)
    has_balcony = Column(Boolean, default=False)
    window_view = Column(ARRAY(String), default=list)
    bathroom = Column(String, nullable=True)
    bath_type = Column(String, nullable=True)
    heating = Column(String, nullable=True)
    renovation = Column(String, nullable=True)
    lifts_passenger = Column(Integer, default=0)
    lifts_freight = Column(Integer, default=0)
    parking = Column(ARRAY(String), default=list)
    prepayment = Column(String, default="нет")
    deposit = Column(Float, default=0.0)
    living_conditions = Column(ARRAY(String), default=list)
    who_rents = Column(String, nullable=True)
    landlord_contact = Column(String, nullable=True)
    contact_method = Column(JSON)
    build_year = Column(Integer, nullable=True)
    furniture = Column(ARRAY(String), default=list)
    appliances = Column(ARRAY(String), default=list)
    connectivity = Column(ARRAY(String), default=list)
    created_at = Column(DateTime, server_default=func.now())
    
    # ENUM теперь соответствует Pydantic
    deal_type = Column(Enum(DealTypeEnum, name="deal_type_enum", create_type=False), nullable=False)

    # Связи
    owner = relationship("User", back_populates="properties")
    favorites = relationship("Favorite", back_populates="property", cascade="all, delete-orphan")
    history = relationship("History", back_populates="property", cascade="all, delete-orphan")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete", passive_deletes=True)
    property_views = relationship("PropertyViews", back_populates="property", cascade="all, delete-orphan")
    price_history = relationship("PriceHistory", back_populates="property", cascade="all, delete-orphan")

 

class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
    is_main = Column(Boolean, default=False)
    uploaded_at = Column(DateTime, server_default=func.now())

    property = relationship("Property", back_populates="images")

    
class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())

    # Обратные связи:
    user = relationship("User", back_populates="favorites")
    property = relationship("Property", back_populates="favorites")


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="history")
    property = relationship("Property", back_populates="history")


class PropertyViews(Base):
    __tablename__ = "property_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="property_views")
    property = relationship("Property", back_populates="property_views")


class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    price = Column(Float, nullable=False)
    change_date = Column(DateTime, server_default=func.now())

    property = relationship("Property", back_populates="price_history")


class UserReview(Base):
    __tablename__ = "user_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewed_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    reviewer = relationship("User", foreign_keys=[reviewer_id], back_populates="reviews_given")
    reviewed_user = relationship("User", foreign_keys=[reviewed_user_id], back_populates="reviews_received")

    __table_args__ = (
        UniqueConstraint('reviewer_id', 'reviewed_user_id', name='unique_user_review'),
    )
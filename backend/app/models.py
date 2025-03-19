import enum
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Enum, DateTime, Text, func, ARRAY
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
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Это поле будет хранить значения "private", "agent", "developer"
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    

    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")  
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan") 
    reviews = relationship("Review", back_populates="user", cascade="all, delete-orphan")
    history = relationship("History", back_populates="user", cascade="all, delete-orphan")

  

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
    contact_method = Column(ARRAY(String), default=list)
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
    reviews = relationship("Review", back_populates="property", cascade="all, delete-orphan")
    history = relationship("History", back_populates="property", cascade="all, delete-orphan")
    images = relationship("PropertyImage", back_populates="property", cascade="all, delete", passive_deletes=True)

 

class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
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


class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    user = relationship("User", back_populates="reviews")
    property = relationship("Property", back_populates="reviews")


class History(Base):
    __tablename__ = "history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    property_id = Column(Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False)
    viewed_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="history")
    property = relationship("Property", back_populates="history")
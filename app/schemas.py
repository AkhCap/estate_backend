from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.enums import PropertyTypeEnum
import enum

# Схемы для пользователей
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True

# Схемы для объявлений
class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    address: str
    rooms: Optional[int] = None
    area: Optional[float] = None
    floor: Optional[int] = None
    property_type: Optional[PropertyTypeEnum] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    
class PropertyCreate(PropertyBase):
    pass

class PropertyOut(PropertyBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

class PropertyUpdate(PropertyBase):
    # При обновлении можно сделать поля опциональными для частичного обновления
    title: Optional[str] = None
    price: Optional[float] = None
    address: Optional[str] = None
    rooms: Optional[int] = None
    area: Optional[float] = None
    floor: Optional[int] = None
    property_type: Optional[PropertyTypeEnum] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None

class PropertyOut(PropertyBase):
    id: int
    owner_id: int

    class Config:
        orm_mode = True

class FavoriteBase(BaseModel):
    property_id: int

class FavoriteCreate(FavoriteBase):
    pass

class FavoriteOut(BaseModel):
    id: int
    property_id: int
    created_at: datetime

    class Config:
        orm_mode = True  

class ReviewBase(BaseModel):
    rating: float
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    property_id: int

class ReviewOut(ReviewBase):
    id: int
    user_id: int
    property_id: int
    created_at: datetime

    class Config:
        orm_mode = True       

class DealType(str, enum.Enum):
    sale = "sale"
    rent = "rent"

class PropertyBase(BaseModel):
    title: str
    description: str
    price: float
    address: str
    rooms: int
    area: float
    floor: int
    total_floors: Optional[int] = None
    property_type: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    deal_type: DealType  # Используем Enum

    class Config:
        from_attributes = True         

# Схема для входа
class UserLogin(BaseModel):
    email: EmailStr
    password: str

from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
import enum

# 🔹 ENUM для типа сделки (Продажа / Аренда)
class DealType(str, enum.Enum):
    SALE = "sale"
    RENT = "rent"

# 🔹 ENUM для ролей пользователей
class UserRole(str, enum.Enum):
    PRIVATE = "private"  # Частное лицо
    AGENT = "agent"  # Агент
    DEVELOPER = "developer"  # Застройщик


# 🔹 Базовая схема пользователя
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole = UserRole.PRIVATE  # Роль по умолчанию – частное лицо


# 🔹 Схема регистрации пользователя
class UserCreate(UserBase):
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


# 🔹 Схема вывода данных о пользователе
class UserOut(UserBase):
    id: int
    is_active: bool
    role: UserRole = UserRole.PRIVATE
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

    class Config:
        orm_mode = True

    class Config:
        from_attributes = True  # Pydantic v2 (замена orm_mode)


# 🔹 Базовая схема недвижимости
class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    address: str
    rooms: Optional[int] = None
    area: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    property_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    deal_type: DealType  # Используем ENUM

    class Config:
        from_attributes = True  # Pydantic v2 (замена orm_mode)


# 🔹 Схема создания недвижимости
class PropertyCreate(PropertyBase):
    pass


# 🔹 Схема вывода недвижимости
class PropertyOut(PropertyBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True


# 🔹 Схема обновления недвижимости
class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    address: Optional[str] = None
    rooms: Optional[int] = None
    area: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    property_type: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    deal_type: Optional[DealType] = None  # Сделал ENUM опциональным

    class Config:
        from_attributes = True


# 🔹 Схемы для избранного
class FavoriteBase(BaseModel):
    property_id: int


class FavoriteCreate(FavoriteBase):
    pass


class FavoriteOut(BaseModel):
    id: int
    property_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# 🔹 Схемы для отзывов
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
        from_attributes = True


# 🔹 Схема входа пользователя
class UserLogin(BaseModel):
    email: EmailStr
    password: str
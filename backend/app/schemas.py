from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from enum import Enum

# 🔹 ENUM для типа сделки
class DealType(str, Enum):
    SALE = "sale"
    RENT = "rent"

# 🔹 ENUM для ролей пользователей
class UserRole(str, Enum):
    PRIVATE = "private"  # Частное лицо
    AGENT = "agent"  # Агент
    DEVELOPER = "developer"  # Застройщик

# 🔹 Базовая схема пользователя
class UserBase(BaseModel):
    email: EmailStr
    username: str

# 🔹 Схема регистрации пользователя
class UserCreate(UserBase):
    password: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

# 🔹 Схема вывода данных о пользователе
class UserOut(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}

# 🔹 Базовая схема недвижимости
class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    address: str
    rooms: Optional[str] = None
    area: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    property_type: str
    deal_type: DealType

    class Config:
        from_attributes = True

class PropertyImageOut(BaseModel):
    id: int
    image_url: str

    model_config = {"from_attributes": True}

class PropertyCreate(BaseModel):
    title: str
    description: str
    price: float
    address: str
    rooms: str
    area: float
    floor: int
    total_floors: int
    property_type: str
    deal_type: str
    property_condition: Optional[str] = None
    has_balcony: Optional[bool] = None
    window_view: Optional[List[str]] = []
    bathroom: Optional[str] = None
    bath_type: Optional[str] = None
    heating: Optional[str] = None
    renovation: Optional[str] = None
    lifts_passenger: Optional[int] = 0
    lifts_freight: Optional[int] = 0
    parking: Optional[List[str]] = []
    prepayment: Optional[str] = "нет"
    deposit: Optional[float] = 0.0
    living_conditions: Optional[List[str]] = []
    who_rents: Optional[str] = None
    landlord_contact: Optional[str] = None
    contact_method: Optional[List[str]] = []
    furniture: Optional[List[str]] = []
    appliances: Optional[List[str]] = []
    connectivity: Optional[List[str]] = []
    build_year: Optional[int] = None
    ceiling_height: Optional[float] = None

    model_config = {"from_attributes": True}

# 🔹 Схема вывода недвижимости
class PropertyOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    price: float
    address: str
    rooms: str  
    area: float
    floor: int
    total_floors: int
    property_type: str
    deal_type: DealType
    owner_id: int
    ceiling_height: Optional[float] = None
    property_condition: Optional[str] = None
    has_balcony: Optional[bool] = False
    window_view: List[str] = []
    bathroom: Optional[str] = None
    bath_type: Optional[str] = None
    heating: Optional[str] = None
    renovation: Optional[str] = None
    lifts_passenger: Optional[int] = 0
    lifts_freight: Optional[int] = 0
    parking: List[str] = []
    prepayment: Optional[str] = "нет"
    deposit: Optional[float] = 0.0
    living_conditions: List[str] = []
    who_rents: Optional[str] = None
    landlord_contact: Optional[str] = None
    contact_method: List[str] = []
    images: List[PropertyImageOut] = []
    build_year: Optional[int] = None
    furniture: List[str] = []
    appliances: List[str] = []
    connectivity: List[str] = []
    created_at: datetime
    is_viewed: bool = False

    model_config = {"from_attributes": True}

# 🔹 Схема обновления недвижимости
class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    address: Optional[str] = None
    rooms: Optional[str] = None
    area: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    property_type: Optional[str] = None
    deal_type: Optional[str] = None
    property_condition: Optional[str] = None
    has_balcony: Optional[bool] = None
    window_view: Optional[List[str]] = None
    bathroom: Optional[str] = None
    bath_type: Optional[str] = None
    heating: Optional[str] = None
    renovation: Optional[str] = None
    lifts_passenger: Optional[int] = None
    lifts_freight: Optional[int] = None
    parking: Optional[List[str]] = None
    prepayment: Optional[str] = None
    deposit: Optional[float] = None
    living_conditions: Optional[List[str]] = None
    who_rents: Optional[str] = None
    landlord_contact: Optional[str] = None
    contact_method: Optional[List[str]] = None
    furniture: Optional[List[str]] = None
    appliances: Optional[List[str]] = None
    connectivity: Optional[List[str]] = None
    build_year: Optional[int] = None
    ceiling_height: Optional[float] = None

    model_config = {"from_attributes": True}

# 🔹 Схемы для избранного
class FavoriteBase(BaseModel):
    property_id: int

class FavoriteCreate(FavoriteBase):
    pass

class FavoriteOut(BaseModel):
    id: int
    property_id: int
    created_at: datetime

    model_config = {"from_attributes": True}

# 🔹 Схемы для отзывов
class ReviewBase(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    property_id: int

class ReviewOut(ReviewBase):
    id: int
    user_id: int
    property_id: int

    model_config = {"from_attributes": True}

class HistoryBase(BaseModel):
    property_id: int

class HistoryCreate(HistoryBase):
    pass

class HistoryOut(HistoryBase):
    id: int
    viewed_at: datetime
    property: PropertyOut

    model_config = {"from_attributes": True}

# 🔹 Схема входа пользователя
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class PropertyViewsBase(BaseModel):
    property_id: int

class PropertyViewsCreate(PropertyViewsBase):
    pass

class PropertyViewsOut(PropertyViewsBase):
    id: int
    viewed_at: datetime
    user_id: int

    model_config = {"from_attributes": True}
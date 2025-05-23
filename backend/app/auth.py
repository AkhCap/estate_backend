from datetime import datetime, timedelta
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv
from passlib.context import CryptContext
from typing import Optional
from . import crud
from .database import get_db
from sqlalchemy.orm import Session
from . import models

# Загружаем переменные окружения из файла .env
load_dotenv()

# Объект для получения токена из заголовка Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login", auto_error=False)

# Секретный ключ и алгоритм для JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

# Контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Проверяет соответствие пароля его хешу.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Создает хеш пароля.
    """
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """
    Создает JWT-токен, добавляя время истечения.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Получает текущего пользователя по токену (обязательная аутентификация).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        return email
    except JWTError:
        raise credentials_exception

def get_optional_current_user(token: str = Depends(oauth2_scheme)) -> Optional[str]:
    """
    Получает текущего пользователя по токену (опциональная аутентификация).
    Возвращает None, если токен отсутствует или недействителен.
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        return email if email else None
    except JWTError:
        return None

def get_current_user_model(token: str = Depends(oauth2_scheme)):
    """
    Получает текущего пользователя по токену (обязательная аутентификация).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Пользователь не найден",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        user = crud.get_user_by_email(get_db(), email)
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception
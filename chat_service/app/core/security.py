from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import HTTPException, status
import requests
from app.core.config import settings
import logging
import time
import traceback

logger = logging.getLogger(__name__)

def get_current_user(token: str) -> dict:
    """
    Получает текущего пользователя по токену через основной API
    """
    try:
        logger.debug(f"[{time.time()}] Начало проверки пользователя с токеном: {token[:10]}...")
        
        logger.debug(f"[{time.time()}] Проверка пользователя через основной API: {settings.MAIN_API_URL}/users/me")
        # Проверяем пользователя через основной API
        try:
            response = requests.get(
                f"{settings.MAIN_API_URL}/users/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            logger.debug(f"[{time.time()}] Ответ от основного API: статус {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"[{time.time()}] Ошибка при проверке пользователя: {response.status_code} - {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Не удалось проверить пользователя"
                )
                
            user_data = response.json()
            logger.debug(f"[{time.time()}] Пользователь успешно проверен: {user_data}")
            return user_data
        except requests.RequestException as req_error:
            logger.error(f"[{time.time()}] Ошибка при запросе к основному API: {str(req_error)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Ошибка при запросе к основному API: {str(req_error)}"
            )
    except Exception as e:
        logger.error(f"[{time.time()}] Ошибка аутентификации: {str(e)}")
        logger.error(f"[{time.time()}] Стек ошибки: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ошибка аутентификации"
        )

def verify_token(token: str) -> dict:
    """
    Проверяет токен и возвращает информацию о пользователе
    """
    try:
        logger.debug(f"[{time.time()}] Проверка токена: {token[:10]}...")
        # Для простоты проверки используем get_current_user
        return get_current_user(token)
    except Exception as e:
        logger.error(f"[{time.time()}] Ошибка при проверке токена: {str(e)}")
        raise

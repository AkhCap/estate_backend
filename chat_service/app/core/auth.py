from fastapi import Depends, HTTPException, Header
from typing import Optional
import logging

# Импортируем get_current_user из security.py
from .security import get_current_user 

logger = logging.getLogger(__name__)

async def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """
    Получает ID текущего пользователя из токена, используя основной бэкенд.
    Выбрасывает HTTPException при ошибке.
    """
    if not authorization or not authorization.startswith('Bearer '):
        logger.warning("Попытка доступа без токена или с неверным форматом")
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(' ')[1]
    try:
        # Используем get_current_user для получения данных с основного бэкенда
        user_data = get_current_user(token)
        user_id = user_data.get('id')
        if user_id is None:
            logger.error(f"Поле 'id' не найдено в данных пользователя от основного API: {user_data}")
            raise HTTPException(status_code=500, detail="User ID not found in user data")
        logger.info(f"Успешно получен ID пользователя: {user_id}")
        return int(user_id) # Убедимся, что возвращаем int
            
    except HTTPException as auth_exc: # Перехватываем HTTPException от get_current_user
        logger.error(f"Ошибка аутентификации при получении ID: {auth_exc.detail}")
        raise auth_exc # Пробрасываем оригинальную ошибку
    except Exception as e:
        logger.error(f"Неожиданная ошибка при получении ID пользователя: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token or authentication error: {e}")

def get_user_id_from_token_or_none(token: Optional[str]) -> int | None:
    """
    Пытается получить ID пользователя из токена, используя основной бэкенд.
    Возвращает ID или None в случае ошибки.
    """
    if not token:
        return None
    try:
        # Используем get_current_user для получения данных с основного бэкенда
        user_data = get_current_user(token)
        user_id = user_data.get('id')
        if user_id is None:
             logger.warning(f"Поле 'id' не найдено в данных пользователя от основного API (для WS): {user_data}")
             return None
        return int(user_id) # Убедимся, что возвращаем int
            
    except Exception as e:
        # Не выбрасываем исключение, т.к. эта функция может вызываться при connect
        # и отсутствие валидного ID может быть ожидаемым (для анонимных)
        logger.info(f"Не удалось получить user_id из токена (ожидаемо для WS connect): {e}")
        return None 
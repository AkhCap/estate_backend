from fastapi import APIRouter, HTTPException, Depends, Header, Request, Response, status, Query
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import logging
import json # Импортируем json для безопасной сериализации/десериализации
import httpx # Для асинхронных HTTP запросов к основному бэкенду

from app.schemas import (
    ChatCreate,
    ChatResponse,
    MessageCreate,
    MessageResponse,
    ChatListResponse,
    ChatMessageListResponse,
    ChatListDetail,
    ParticipantDetail
)
from app.core.config import settings
from app.core.security import get_current_user
import redis
from app import sio  # Импортируем sio из модуля app.__init__
from app.core.redis import redis_client
from app.core.auth import get_current_user_id
from app.core.http_client import http_client
from app.services.chat_service import save_and_emit_message # <-- Импортируем только нужный импорт
from app.services.postgres_service import PostgresChatService
from app.dependencies import get_postgres_chat_service

logger = logging.getLogger(__name__)

# Используем существующую настройку settings.MAIN_API_URL
MAIN_BACKEND_API_URL = settings.MAIN_API_URL 
http_client = httpx.AsyncClient(base_url=MAIN_BACKEND_API_URL)

# Меняем префикс роутера
router = APIRouter(prefix="/chat-api/chats")
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    db=settings.REDIS_DB,
    decode_responses=True # Важно: автоматически декодировать ответы из Redis в строки
)

# --- Helper function to make datetime timezone-aware (UTC if naive) ---
def make_aware(dt: datetime) -> datetime:
    if not isinstance(dt, datetime):
        # Если пришло не datetime, пытаемся его создать или возвращаем None/min
        try:
            dt = datetime.fromisoformat(str(dt))
        except (ValueError, TypeError):
            logger.warning(f"Could not parse datetime from: {dt}")
            return datetime.min.replace(tzinfo=timezone.utc) # Возвращаем минимальную дату с UTC
            
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt
# ---------------------------------------------------------------------

# --- Вспомогательная функция для формирования URL изображения --- 
def get_full_image_url(image_value: Optional[str]) -> Optional[str]:
    if not image_value:
        return None
    if image_value.startswith('http://') or image_value.startswith('https://'):
        return image_value # Уже полный URL
    else:
        # Считаем, что это имя файла, формируем полный URL
        base_upload_url = settings.MAIN_API_URL.replace("/api/v1", "")
        return f"{base_upload_url}/uploads/properties/{image_value}"

# --- Вспомогательная функция для получения данных о недвижимости --- 
async def fetch_property_details(property_id: int) -> Optional[dict]:
    logger.info(f"Fetching details for property {property_id} from main backend")
    try:
        request_url = f"/properties/{property_id}"
        response = await http_client.get(request_url)
        response.raise_for_status()
        details = response.json()
        
        # Извлекаем имя файла первого изображения
        image_filename = None
        images = details.get("images")
        if images and isinstance(images, list) and len(images) > 0 and isinstance(images[0], dict):
            image_filename = images[0].get("image_url")
            
        # Извлекаем имя продавца из объекта owner
        seller_name_str = "Неизвестный продавец" # Значение по умолчанию
        owner_data = details.get("owner")
        if owner_data and isinstance(owner_data, dict):
            first_name = owner_data.get("first_name")
            last_name = owner_data.get("last_name")
            if first_name and last_name:
                seller_name_str = f"{first_name} {last_name}"
            elif first_name:
                seller_name_str = first_name
            elif last_name:
                seller_name_str = last_name

        # Извлекаем owner_id из ответа основного бэкенда
        owner_id = details.get("owner_id") 
        if not owner_id:
             logger.warning(f"Owner ID not found in property details response for {property_id}")
             return None 

        # Возвращаем словарь с нужными полями, ВКЛЮЧАЯ owner_id
        result_dict = {
            "title": details.get("title"),
            "image": image_filename,
            "owner_id": owner_id
        }
        return result_dict
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching property {property_id}: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        logger.exception(f"Error fetching property details for {property_id}: {e}")
        return None

# --- Вспомогательная функция для получения данных о пользователе --- 
async def fetch_user_details(user_id: int) -> Optional[dict]:
    logger.info(f"Fetching details for user {user_id} from main backend")
    try:
        request_url = f"/users/{user_id}"
        response = await http_client.get(request_url)
        response.raise_for_status()
        user_details = response.json()
        
        first_name = user_details.get("first_name", "")
        last_name = user_details.get("last_name", "")
        full_name = ""
        if first_name and last_name:
            full_name = f"{first_name} {last_name}"
        elif first_name:
            full_name = first_name
        elif last_name:
            full_name = last_name
            
        return {
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "avatar": user_details.get("avatar"),
            "email": user_details.get("email")
        }
        
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error fetching user {user_id}: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        logger.exception(f"Error fetching user details for {user_id}: {e}")
        return None

# --- Функция получения ID пользователя --- 
async def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    """
    Получает ID текущего пользователя из токена
    """
    if not authorization or not authorization.startswith('Bearer '):
        logger.error("Токен отсутствует или имеет неверный формат")
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(' ')[1]
    try:
        user_data = get_current_user(token)
        logger.info(f"Получен ID пользователя: {user_data['id']}")
        return user_data['id']
    except Exception as e:
        logger.error(f"Ошибка при получении ID пользователя: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=ChatListResponse)
async def get_my_chats(
    request: Request,
    current_user_id: int = Depends(get_current_user_id),
    postgres_service: PostgresChatService = Depends(get_postgres_chat_service)
):
    try:
        logger.info(f"User {current_user_id} getting their chats")
        chats = []
        
        # Получаем чаты из PostgreSQL
        try:
            db_chats = await postgres_service.get_user_chats(current_user_id)
            logger.info(f"Found {len(db_chats)} chats in PostgreSQL for user {current_user_id}")
        except Exception as db_error:
            logger.error(f"Error getting chats from PostgreSQL: {db_error}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error while fetching chats"
            )
        
        for chat in db_chats:
            try:
                chat_id = str(chat.id)
                chat_key = f"chat:{chat_id}"
                participants_key = f"chat:{chat_id}:participants"
                
                # Получаем или создаем данные в Redis
                try:
                    chat_data = redis_client.hgetall(chat_key)
                    if not chat_data:
                        # Если данных нет в Redis, создаем их
                        chat_data = {
                            "property_id": str(chat.property_id),
                            "property_title": chat.property_title or "",
                            "property_image": chat.property_image or "",
                            "created_at": chat.created_at.isoformat() if chat.created_at else datetime.now(timezone.utc).isoformat(),
                            "updated_at": chat.updated_at.isoformat() if chat.updated_at else datetime.now(timezone.utc).isoformat(),
                            "is_archived": str(chat.is_archived).lower(),
                            "unread_count_user1": "0",
                            "unread_count_user2": "0"
                        }
                        redis_client.hmset(chat_key, chat_data)
                except Exception as redis_error:
                    logger.error(f"Redis error for chat {chat_id}: {redis_error}")
                    continue
                
                # Получаем участников
                try:
                    participants = []
                    for participant in chat.participants:
                        participants.append(participant.user_id)
                        redis_client.sadd(participants_key, str(participant.user_id))
                except Exception as participant_error:
                    logger.error(f"Error processing participants for chat {chat_id}: {participant_error}")
                    continue
                
                if chat_data and participants:
                    logger.debug(f"Processing chat {chat_id} data: {chat_data}")
                    
                    # Безопасное получение времени последнего сообщения
                    try:
                        last_msg_content = chat_data.get("last_message")
                        last_msg_time_str = chat_data.get("last_message_time")
                        last_msg_time = None
                        if last_msg_time_str:
                            try:
                                last_msg_time = datetime.fromisoformat(last_msg_time_str)
                            except ValueError:
                                logger.warning(f"Invalid last_message_time format in Redis for chat {chat_id}")
                    except Exception as msg_time_error:
                        logger.error(f"Error processing message time for chat {chat_id}: {msg_time_error}")
                        last_msg_content = None
                        last_msg_time = None
                    
                    # Получаем счетчик непрочитанных
                    try:
                        sorted_participants = sorted(participants)
                        user_index = 1 if current_user_id == sorted_participants[0] else 2
                        unread_count = int(chat_data.get(f"unread_count_user{user_index}", 0))
                    except Exception as unread_error:
                        logger.error(f"Error getting unread count for chat {chat_id}: {unread_error}")
                        unread_count = 0
                    
                    # Получаем детали участников
                    participants_details = []
                    for participant_id in participants:
                        try:
                            user_details = await fetch_user_details(participant_id)
                            if user_details:
                                participants_details.append(ParticipantDetail(
                                    user_id=participant_id,
                                    username=user_details.get("username", ""),
                                    full_name=user_details.get("full_name", ""),
                                    avatar_url=get_full_image_url(user_details.get("avatar_url")),
                                    last_read_at=None
                                ))
                        except Exception as user_details_error:
                            logger.error(f"Error fetching user details for participant {participant_id}: {user_details_error}")
                            continue
                    
                    # Получаем и проверяем URL изображения
                    try:
                        image_url = get_full_image_url(chat_data.get("property_image"))
                    except Exception as image_error:
                        logger.error(f"Error processing image URL for chat {chat_id}: {image_error}")
                        image_url = None
                    
                    try:
                        chat_detail = ChatListDetail(
                            id=chat_id,
                            property_id=int(chat_data.get("property_id", -1)),
                            property_title=chat_data.get("property_title", ""),
                            property_image=image_url,
                            participants=participants_details,
                            created_at=make_aware(datetime.fromisoformat(chat_data.get("created_at", datetime.now(timezone.utc).isoformat()))),
                            updated_at=make_aware(datetime.fromisoformat(chat_data.get("updated_at", datetime.now(timezone.utc).isoformat()))),
                            is_archived=chat_data.get("is_archived", "false").lower() == "true",
                            last_message=last_msg_content,
                            last_message_time=make_aware(last_msg_time) if last_msg_time else None,
                            unread_count=unread_count
                        )
                        chats.append(chat_detail)
                    except Exception as chat_detail_error:
                        logger.error(f"Error creating ChatListDetail for chat {chat_id}: {chat_detail_error}")
                        continue
                else:
                    logger.warning(f"Chat data or participants not found for chat_id {chat_id}")
                    
            except Exception as chat_error:
                logger.error(f"Error processing chat {chat.id}: {chat_error}")
                continue
                
        # Сортируем чаты по времени последнего обновления
        try:
            chats.sort(key=lambda x: make_aware(x.updated_at), reverse=True)
        except Exception as sort_error:
            logger.error(f"Error sorting chats: {sort_error}")
        
        logger.info(f"Returning {len(chats)} chats for user {current_user_id}")
        return ChatListResponse(chats=chats, total=len(chats))
        
    except Exception as e:
        logger.exception(f"Error getting user chats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/{user_id}", response_model=ChatListResponse)
async def get_user_chats(user_id: int, request: Request, current_user_id: int = Depends(get_current_user_id)):
    # Примечание: Доступ к чатам другого пользователя может требовать дополнительных проверок прав
    # Здесь предполагается, что текущий пользователь может видеть чаты другого пользователя
    # (Например, администратор или если это чаты, где они оба участвуют)
    # Для простоты, пока логика получения идентична get_my_chats, но для user_id
    logger.info(f"User {current_user_id} getting chats for user_id: {user_id}")
    chats = []
    user_chats_key = f"user:{user_id}:chats" # Используем запрошенный user_id
    chat_ids = redis_client.smembers(user_chats_key)

    for chat_id in chat_ids:
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        
        chat_data = redis_client.hgetall(chat_key)
        participants_str = redis_client.smembers(participants_key)
        participants = [int(p) for p in participants_str]

        if chat_data and participants:
            # Проверяем, имеет ли ТЕКУЩИЙ пользователь доступ к этому чату (является ли участником)
            # Это ВАЖНО, чтобы пользователь не мог посмотреть чужие чаты
            if current_user_id not in participants:
                logger.warning(f"User {current_user_id} attempted to access chat {chat_id} of user {user_id} without being a participant.")
                continue # Пропускаем этот чат

            logger.debug(f"Processing chat {chat_id} data for user {user_id}: {chat_data}")
            last_msg_content = chat_data.get("last_message")
            last_msg_time_str = chat_data.get("last_message_time")
            last_msg_time = datetime.fromisoformat(last_msg_time_str) if last_msg_time_str else None
            
            # Получаем счетчик непрочитанных для ТЕКУЩЕГО пользователя, который запрашивает данные
            sorted_participants = sorted(participants)
            req_user_index = 1 if current_user_id == sorted_participants[0] else 2
            unread_count_key = f"unread_count_user{req_user_index}"
            unread_count = int(chat_data.get(unread_count_key, 0))

            # Получаем и проверяем URL изображения
            image_url = get_full_image_url(chat_data.get("property_image"))

            chat_detail = ChatListDetail(
                id=chat_id,
                property_id=int(chat_data.get("property_id", -1)),
                participants=participants,
                created_at=make_aware(datetime.fromisoformat(chat_data.get("created_at", datetime.min.isoformat()))),
                updated_at=make_aware(datetime.fromisoformat(chat_data.get("updated_at", datetime.min.isoformat()))),
                is_archived=chat_data.get("is_archived") == 'True',
                property_title=chat_data.get("property_title"),
                property_image=image_url, # Используем полный URL
                seller_name=chat_data.get("seller_name"),
                last_message=last_msg_content if last_msg_content else None,
                last_message_time=make_aware(last_msg_time) if last_msg_time else None,
                unread_count=unread_count
            )
            chats.append(chat_detail)
        else:
            logger.warning(f"Chat data or participants not found for chat_id {chat_id} in user {user_id}'s list.")
            # Не удаляем из чужого списка
            
    # Сортируем чаты по времени последнего обновления
    chats.sort(key=lambda x: make_aware(x.updated_at), reverse=True)

    logger.info(f"Returning {len(chats)} chats accessible by user {current_user_id} for target user {user_id}")
    return ChatListResponse(chats=chats, total=len(chats))

@router.post("", response_model=ChatResponse)
async def create_chat(
    chat_data: ChatCreate,
    request: Request,
    current_user_id: int = Depends(get_current_user_id),
    postgres_service: PostgresChatService = Depends(get_postgres_chat_service)
):
    try:
        logger.info(f"Creating chat for property {chat_data.property_id} with participants {chat_data.participants}")
        
        # Проверяем, что текущий пользователь в списке участников
        if current_user_id not in chat_data.participants:
            logger.warning(f"User {current_user_id} not in participants list {chat_data.participants}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Current user must be in participants list"
            )

        # Проверяем существование чата
        logger.info("Checking for existing chat")
        existing_chat = await postgres_service.get_existing_chat(
            chat_data.property_id,
            chat_data.participants
        )
        if existing_chat:
            logger.info(f"Found existing chat {existing_chat.id}")
            # Если чат существует, возвращаем его
            participants_details = []
            for participant in existing_chat.participants:
                user_details = await fetch_user_details(participant.user_id)
                if user_details:
                    participants_details.append(ParticipantDetail(
                        user_id=participant.user_id,
                        username=user_details.get("username", ""),
                        full_name=user_details.get("full_name", ""),
                        avatar_url=get_full_image_url(user_details.get("avatar_url")),
                        last_read_at=participant.last_read_at
                    ))
            
            return ChatResponse(
                id=str(existing_chat.id),
                property_id=existing_chat.property_id,
                property_title=existing_chat.property_title,
                property_image=get_full_image_url(existing_chat.property_image),
                participants=participants_details,
                created_at=existing_chat.created_at,
                updated_at=existing_chat.updated_at,
                is_archived=existing_chat.is_archived
            )

        # Получаем детали объекта недвижимости
        logger.info(f"Fetching property details for {chat_data.property_id}")
        property_details = await fetch_property_details(chat_data.property_id)
        if not property_details:
            logger.error(f"Property {chat_data.property_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Property not found"
            )
        logger.info(f"Property details: {property_details}")

        # Создаем чат в PostgreSQL
        logger.info("Creating new chat in PostgreSQL")
        chat = await postgres_service.create_chat(
            property_id=chat_data.property_id,
            user_ids=chat_data.participants,
            property_title=property_details.get("title"),
            property_image=property_details.get("image")
        )
        logger.info(f"Created new chat {chat.id}")

        # Сохраняем данные чата в Redis
        chat_key = f"chat:{str(chat.id)}"
        redis_client.hmset(chat_key, {
            "property_id": str(chat.property_id),
            "property_title": chat.property_title,
            "property_image": chat.property_image,
            "created_at": chat.created_at.isoformat(),
            "updated_at": chat.updated_at.isoformat(),
            "is_archived": str(chat.is_archived).lower(),
            "unread_count_user1": "0",
            "unread_count_user2": "0"
        })

        # Сохраняем участников в Redis
        participants_key = f"chat:{str(chat.id)}:participants"
        for participant_id in chat_data.participants:
            redis_client.sadd(participants_key, str(participant_id))
            
        # Добавляем чат в списки чатов пользователей
        for user_id in chat_data.participants:
            user_chats_key = f"user:{user_id}:chats"
            redis_client.sadd(user_chats_key, str(chat.id))

        # Получаем детали участников
        logger.info("Fetching participant details")
        participants_details = []
        for user_id in chat_data.participants:
            user_details = await fetch_user_details(user_id)
            if not user_details:
                logger.error(f"User details not found for user {user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User details not found for user {user_id}"
                )
            participants_details.append(ParticipantDetail(
                user_id=user_id,
                username=user_details.get("username", ""),
                full_name=user_details.get("full_name", ""),
                avatar_url=get_full_image_url(user_details.get("avatar_url")),
                last_read_at=datetime.now(timezone.utc) if user_id == current_user_id else None
            ))
            logger.info(f"Added participant details for user {user_id}")

        # Формируем ответ
        logger.info("Forming response")
        return ChatResponse(
            id=str(chat.id),
            property_id=chat.property_id,
            property_title=property_details.get("title"),
            property_image=property_details.get("image"),
            participants=participants_details,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            is_archived=chat.is_archived
        )
    except Exception as e:
        logger.exception(f"Error creating chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create chat: {str(e)}"
        )

@router.get("/{chat_id}/messages", response_model=ChatMessageListResponse)
async def get_chat_messages(
    chat_id: str,
    current_user_id: int = Depends(get_current_user_id),
    before: Optional[str] = None, # Для пагинации (временная метка ISO)
    limit: int = 50
) -> ChatMessageListResponse:
    logger.info(f"User {current_user_id} getting messages for chat {chat_id} (before={before}, limit={limit})")
    try:
        # Проверяем существование чата и права доступа
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        
        if not redis_client.exists(chat_key):
            logger.warning(f"Attempt to get messages from non-existent chat {chat_id}")
            raise HTTPException(status_code=404, detail="Чат не найден")
            
        participants_ids_str = redis_client.smembers(participants_key)
        if not participants_ids_str:
            logger.error(f"Participants set not found for existing chat {chat_id}")
            raise HTTPException(status_code=500, detail="Ошибка данных чата: участники не найдены")
             
        participants = [int(p) for p in participants_ids_str]
        if current_user_id not in participants:
            logger.warning(f"User {current_user_id} tried to get messages from chat {chat_id} they are not part of")
            raise HTTPException(status_code=403, detail="Нет доступа к чату")
            
        # Получаем общее количество сообщений
        messages_zset_key = f"chat:{chat_id}:messages"
        total_messages = redis_client.zcard(messages_zset_key)
        
        # --- Логика получения ID сообщений (Исправлено) --- 
        start_score = '+inf' # По умолчанию берем самые новые
        if before:
            try:
                # Используем timestamp как score. Ищем сообщения СТРОГО ДО указанной метки.
                before_dt = datetime.fromisoformat(before)
                start_score = f"({before_dt.timestamp()}" # Скобка означает эксклюзивный интервал
            except ValueError:
                logger.warning(f"Некорректный формат 'before': {before}. Загружаем последние сообщения.")
                # Оставляем start_score = '+inf'

        message_ids = redis_client.zrevrangebyscore(
            messages_zset_key,
            max=start_score, # Ищем сообщения со score < score(before)
            min='-inf',
            start=0,      # Смещение внутри найденного диапазона (обычно 0)
            num=limit     # Количество сообщений для получения
        )
        
        messages = []
        # --- Получаем детали каждого сообщения --- 
        for message_id in message_ids:
            message_key = f"message:{message_id}"
            data = None # Инициализация для блока finally
            try:
                # УЖЕ декодированный словарь благодаря decode_responses=True
                data = redis_client.hgetall(message_key)
                
                # --- ЛОГ УЖЕ ДЕКОДИРОВАННЫХ ДАННЫХ ---
                logger.debug(f"[get_chat_messages] Data from Redis for message {message_id}: {data}")
                # --- КОНЕЦ ЛОГА ---
                
                if not data:
                    logger.warning(f"Данные для сообщения {message_id} не найдены в Redis. Пропускаем.")
                    continue 
                    
                # Извлекаем и проверяем обязательные поля
                message_type = data.get("message_type", "text")
                required_keys = ['id', 'chat_id', 'sender_id', 'content', 'created_at']
                if not all(key in data for key in required_keys):
                    logger.warning(f"Пропущены обязательные ключи для сообщения {message_id}. Data: {data}")
                    continue

                # Извлекаем и конвертируем остальные поля
                sender_id_str = data.get('sender_id')
                if not sender_id_str or not sender_id_str.isdigit():
                    logger.warning(f"Некорректный sender_id '{sender_id_str}' для сообщения {message_id}. Пропускаем.")
                    continue
                sender_id = int(sender_id_str)
                
                is_read_str = data.get("is_read", "False") 
                is_read = is_read_str.lower() == 'true'
                
                created_at_str = data.get('created_at')
                if not created_at_str:
                     logger.warning(f"Отсутствует created_at для сообщения {message_id}. Пропускаем.")
                     continue
                
                # Парсим дату
                created_at = datetime.fromisoformat(created_at_str)
                
                # --- ИСПРАВЛЕНИЕ: Приводим все даты к offset-aware (UTC) --- 
                if created_at.tzinfo is None:
                    # Если дата наивная, считаем, что это UTC
                    created_at = created_at.replace(tzinfo=timezone.utc)
                else:
                    # Если дата уже aware, конвертируем ее в UTC на всякий случай
                    created_at = created_at.astimezone(timezone.utc)
                # --- КОНЕЦ ИСПРАВЛЕНИЯ --- 
                
                content = data.get('content', '')

                # Создаем объект сообщения
                message_response = MessageResponse(
                    id=data['id'],
                    chat_id=data['chat_id'],
                    sender_id=sender_id,
                    content=content,
                    created_at=created_at, # Теперь дата всегда offset-aware UTC
                    is_read=is_read,
                    message_type=message_type
                )
                messages.append(message_response)

            except ValueError as e:
                logger.error(f"Ошибка преобразования данных для сообщения {message_id}: {e}. Data: {data}") 
                continue 
            except KeyError as e:
                 logger.error(f"Error processing message {message_id}: Missing key {e}. Data: {data}")
                 continue
            except Exception as e:
                # Логируем именно исходные (уже декодированные) данные при общей ошибке
                logger.exception(f"Неожиданная ошибка при обработке сообщения {message_id}: {e}. Data: {data}")
                continue
        # --- Конец цикла for ---

        logger.info(f"Успешно получено и обработано {len(messages)} сообщений для чата {chat_id} перед сортировкой")

        # Сортировка (теперь должна работать)
        messages.sort(key=lambda m: m.created_at)

        # --- Логика расчета has_more (Исправлено) ---
        has_more = False
        if messages:
            # Берем timestamp самого старого из полученных сообщений
            oldest_fetched_score = messages[0].created_at.timestamp() # Сообщения отсортированы от старых к новым
            # Проверяем, есть ли в Redis сообщения ЕЩЕ СТАРШЕ
            older_messages_exist = redis_client.zrevrangebyscore(
                messages_zset_key,
                max=f"({oldest_fetched_score}", # Строго меньше самого старого из полученных
                min='-inf',
                start=0,
                num=1 # Нам достаточно знать, что есть хотя бы одно
            )
            has_more = bool(older_messages_exist)

        return ChatMessageListResponse(
            messages=messages,
            total=total_messages,
            has_more=has_more
        )

    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.exception(f"Error getting messages for chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка сервера при получении сообщений: {str(e)}")

@router.post("/{chat_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    chat_id: str,
    message: MessageCreate,
    current_user_id: int = Depends(get_current_user_id),
    postgres_service: PostgresChatService = Depends(get_postgres_chat_service)
):
    try:
        # Проверяем существование чата в PostgreSQL
        chat = await postgres_service.get_chat_by_id(uuid.UUID(chat_id))
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )

        # Сохраняем сообщение в Redis и PostgreSQL
        message_response = await save_and_emit_message(
            sio=sio,
            chat_id=chat_id,
            sender_id=current_user_id,
            content=message.content,
            message_type=message.message_type,
            attachments=message.attachments,
            temp_id=message.temp_id,
            postgres_service=postgres_service
        )

        return message_response
    except Exception as e:
        logger.exception(f"Error creating message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create message"
        )

@router.put("/{chat_id}/messages/readall")
async def mark_all_messages_as_read(
    chat_id: str,
    current_user_id: int = Depends(get_current_user_id),
    postgres_service: PostgresChatService = Depends(get_postgres_chat_service)
):
    try:
        # Проверяем существование чата в PostgreSQL
        chat = await postgres_service.get_chat_by_id(uuid.UUID(chat_id))
        if not chat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )

        # Отмечаем сообщения как прочитанные в PostgreSQL
        await postgres_service.mark_messages_as_read(uuid.UUID(chat_id), current_user_id)
        
        # Обновляем время последнего прочтения для участника
        await postgres_service.update_chat_participant_last_read(
            uuid.UUID(chat_id),
            current_user_id,
            datetime.now(timezone.utc)
        )

        return {"status": "success"}
    except Exception as e:
        logger.exception(f"Error marking messages as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark messages as read"
        )

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: str,
    current_user_id: int = Depends(get_current_user_id),
    postgres_service: PostgresChatService = Depends(get_postgres_chat_service)
):
    """
    Мягкое удаление чата для текущего пользователя.
    Если все участники удалили чат - полное удаление.
    """
    logger.info(f"Attempting to delete chat {chat_id} by user {current_user_id}")
    try:
        # Проверяем существование чата в Redis
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        
        if not redis_client.exists(chat_key):
            logger.warning(f"Chat {chat_id} not found in Redis")
            return Response(status_code=status.HTTP_204_NO_CONTENT)
            
        # Получаем участников из Redis
        participants_ids_str = redis_client.smembers(participants_key)
        participants = [int(p) for p in participants_ids_str]
        
        if current_user_id not in participants:
            logger.warning(f"User {current_user_id} tried to delete chat {chat_id} without permission")
            raise HTTPException(status_code=403, detail="У вас нет прав для удаления этого чата")

        # Удаляем чат в PostgreSQL
        try:
            chat_uuid = uuid.UUID(chat_id)
            deleted = await postgres_service.delete_chat(chat_uuid, current_user_id)
            if not deleted:
                logger.error(f"Failed to delete chat {chat_id} in PostgreSQL")
                raise HTTPException(status_code=500, detail="Ошибка при удалении чата")
        except ValueError:
            logger.error(f"Invalid chat_id format: {chat_id}")
            raise HTTPException(status_code=400, detail="Неверный формат ID чата")

        # Обновляем статус в Redis
        try:
            # Обновляем статус удаления для пользователя
            user_status_key = f"chat:{chat_id}:user:{current_user_id}:status"
            redis_client.hmset(user_status_key, {
                "is_deleted": "true",
                "is_visible": "false",
                "deleted_at": datetime.utcnow().isoformat()
            })

            # Проверяем, все ли участники удалили чат
            all_deleted = True
            for participant_id in participants:
                participant_status_key = f"chat:{chat_id}:user:{participant_id}:status"
                participant_status = redis_client.hgetall(participant_status_key)
                if not participant_status or participant_status.get("is_deleted") != "true":
                    all_deleted = False
                    break

            if all_deleted:
                # Если все удалили - удаляем все данные чата из Redis
                message_ids = redis_client.zrange(f"chat:{chat_id}:messages", 0, -1)
                keys_to_delete = [
                    chat_key,
                    participants_key,
                    f"chat:{chat_id}:messages"
                ]
                # Добавляем ключи сообщений
                for message_id in message_ids:
                    keys_to_delete.append(f"message:{message_id}")
                # Добавляем ключи статусов пользователей
                for participant_id in participants:
                    keys_to_delete.append(f"chat:{chat_id}:user:{participant_id}:status")
                
                redis_client.delete(*keys_to_delete)
                logger.info(f"All chat data deleted from Redis for chat {chat_id}")
            else:
                logger.info(f"Chat {chat_id} marked as deleted for user {current_user_id} in Redis")

        except Exception as redis_error:
            logger.error(f"Redis error while deleting chat {chat_id}: {redis_error}")
            # Не прерываем выполнение, так как основная операция в PostgreSQL уже выполнена

        # Отправляем событие об удалении чата через WebSocket
        recipient_id = next((p for p in participants if p != current_user_id), None)
        if recipient_id:
            await sio.emit('chat_deleted', {
                'chat_id': chat_id,
                'deleted_by': current_user_id,
                'timestamp': datetime.utcnow().isoformat()
            }, room=str(recipient_id))
            logger.info(f"Emitted chat_deleted event for chat {chat_id} to user {recipient_id}")
            
        return Response(status_code=status.HTTP_204_NO_CONTENT)
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.exception(f"Error deleting chat {chat_id} by user {current_user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка сервера при удалении чата: {str(e)}")

@router.get("/{chat_id}/participants", response_model=List[ParticipantDetail])
async def get_chat_participants(
    chat_id: str,
    current_user_id: int = Depends(get_current_user_id),
    postgres_service: PostgresChatService = Depends(get_postgres_chat_service)
):
    logger.info(f"User {current_user_id} getting participants for chat {chat_id}")
    try:
        # Преобразуем строковый ID в UUID
        chat_uuid = uuid.UUID(chat_id)
        
        # Получаем участников из PostgreSQL
        participants = await postgres_service.get_chat_participants(chat_uuid)
        if not participants:
            logger.error(f"No participants found in PostgreSQL for chat {chat_id}")
            raise HTTPException(status_code=404, detail="Участники чата не найдены")

        # Проверяем права доступа
        if not any(str(p["id"]) == str(current_user_id) for p in participants):
            logger.warning(f"User {current_user_id} tried to get participants from chat {chat_id} without permission.")
            raise HTTPException(status_code=403, detail="Нет доступа к чату")

        # Получаем детали участников
        participants_details = []
        for participant in participants:
            user_id = int(participant["id"])
            
            try:
                # Получаем детали пользователя
                user_details = await fetch_user_details(user_id)
                if not user_details:
                    logger.warning(f"Could not fetch details for user {user_id} in chat {chat_id}")
                    user_details = {
                        "username": "",
                        "full_name": "Пользователь",
                        "avatar_url": None
                    }

                participants_details.append(ParticipantDetail(
                    user_id=user_id,
                    username=user_details.get("username", ""),
                    full_name=user_details.get("full_name", ""),
                    avatar_url=get_full_image_url(user_details.get("avatar_url")),
                    last_read_at=datetime.fromisoformat(participant["last_read_at"]) if participant.get("last_read_at") else None,
                    joined_at=datetime.fromisoformat(participant["joined_at"]) if participant.get("joined_at") else None
                ))
            except Exception as user_details_error:
                logger.error(f"Error processing participant {user_id}: {user_details_error}")
                continue

        return participants_details
    except Exception as e:
        logger.exception(f"Error getting chat participants: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat participants"
        )

# Убедитесь, что роутер подключен в main.py или app/__init__.py

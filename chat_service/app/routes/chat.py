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
            "property_title": details.get("title"),
            "property_image_filename": image_filename,
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
# (Перемещаем ее определение сюда, ДО get_current_user_id и create_chat)
async def fetch_user_details(user_id: int) -> Optional[dict]:
    logger.info(f"Fetching details for user {user_id} from main backend")
    try:
        request_url = f"/users/{user_id}"
        response = await http_client.get(request_url)
        response.raise_for_status()
        user_details = response.json()
        
        first_name = user_details.get("first_name")
        last_name = user_details.get("last_name")
        full_name = "Неизвестный пользователь"
        if first_name and last_name:
            full_name = f"{first_name} {last_name}"
        elif first_name:
            full_name = first_name
        elif last_name:
            full_name = last_name
            
        return {"full_name": full_name}
        
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
async def get_my_chats(request: Request, current_user_id: int = Depends(get_current_user_id)):
    logger.info(f"[get_my_chats] <<< Starting request for user {current_user_id} >>>")
    chats = []
    user_chats_key = f"user:{current_user_id}:chats"
    chat_ids = redis_client.smembers(user_chats_key)

    for chat_id in chat_ids:
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        
        chat_data = redis_client.hgetall(chat_key)
        participants_ids_str = redis_client.smembers(participants_key)
        participants = {int(p) for p in participants_ids_str if p.isdigit()}

        if chat_data and len(participants) == 2 and current_user_id in participants:
            owner_id_str = chat_data.get("owner_id")
            owner_name_redis = chat_data.get("owner_name")
            buyer_id_str = chat_data.get("buyer_id")
            buyer_name_redis = chat_data.get("buyer_name")
            
            participant_name = "Собеседник"
            
            other_user_id = next((p for p in participants if p != current_user_id), None)

            if other_user_id:
                owner_id = 0
                buyer_id = 0
                try:
                    if owner_id_str: owner_id = int(owner_id_str)
                    if buyer_id_str: buyer_id = int(buyer_id_str)
                except (ValueError, TypeError): pass
                
                owner_name = owner_name_redis if owner_name_redis else None
                buyer_name = buyer_name_redis if buyer_name_redis else None

                if other_user_id == owner_id:
                    participant_name = owner_name if owner_name else "Владелец"
                elif other_user_id == buyer_id:
                    participant_name = buyer_name if buyer_name else "Покупатель"
                else:
                    logger.warning(f"[get_my_chats] Could not match other_user_id {other_user_id} to owner {owner_id} or buyer {buyer_id}. Data inconsistency?")
                    if current_user_id == buyer_id and owner_name:
                         participant_name = owner_name
                    elif current_user_id == owner_id and buyer_name:
                         participant_name = buyer_name
                    else:
                         participant_name = "Собеседник (?)"
            else:
                logger.error(f"[get_my_chats] Could not determine other user ID for current user {current_user_id} in participants {participants}")
                participant_name = "Собеседник (Error)" 
                 
            image_url = get_full_image_url(chat_data.get("property_image"))
            last_msg_content = chat_data.get("last_message")
            last_msg_time_str = chat_data.get("last_message_time")
            last_msg_time = datetime.fromisoformat(last_msg_time_str) if last_msg_time_str else None
            sorted_participants = sorted(list(participants))
            user_index = 1 if current_user_id == sorted_participants[0] else 2
            unread_count_key = f"unread_count_user{user_index}"
            unread_count = int(chat_data.get(unread_count_key, 0))
            
            chat_detail = ChatListDetail(
                 id=chat_id,
                 property_id=int(chat_data.get("property_id", -1)),
                 participants=list(participants),
                 created_at=make_aware(datetime.fromisoformat(chat_data.get("created_at", datetime.min.isoformat()))),
                 updated_at=make_aware(datetime.fromisoformat(chat_data.get("updated_at", datetime.min.isoformat()))),
                 is_archived=chat_data.get("is_archived") == 'True',
                 property_title=chat_data.get("property_title"),
                 property_image=image_url,
                 participant_name=participant_name, 
                 last_message=last_msg_content if last_msg_content else None,
                 last_message_time=make_aware(last_msg_time) if last_msg_time else None,
                 unread_count=unread_count
            )
            chats.append(chat_detail)
        else:
             logger.warning(f"[get_my_chats] Chat data or participants not found for chat_id {chat_id} in user {current_user_id}'s list. Removing orphan ID.")
             redis_client.srem(user_chats_key, chat_id)
            
    chats.sort(key=lambda x: make_aware(x.updated_at), reverse=True)

    logger.info(f"Returning {len(chats)} chats for user {current_user_id}")
    return ChatListResponse(chats=chats, total=len(chats))

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
async def create_chat(chat_data: ChatCreate, request: Request, current_user_id: int = Depends(get_current_user_id)):
    logger.info(f"[create_chat] <<< Starting chat creation for property {chat_data.property_id} by user {current_user_id} >>>")
    # Проверка, что участники переданы и их двое (если это ожидается)
    if not chat_data.participants or len(chat_data.participants) != 2:
         logger.error(f"[create_chat] Invalid participants list: {chat_data.participants}")
         raise HTTPException(status_code=400, detail="Необходимо передать ровно двух участников чата.")

    # Проверка, что текущий пользователь является одним из участников
    if current_user_id not in chat_data.participants:
         logger.warning(f"[create_chat] User {current_user_id} trying to create chat they are not part of: {chat_data.participants}")
         raise HTTPException(status_code=403, detail="Вы не можете создать чат, в котором не участвуете.")

    try:
        # --- Шаг 1: Проверка существующего чата --- 
        # Используем участников из chat_data, а не вычисляем buyer_id позже
        user1_id, user2_id = sorted(chat_data.participants)
        lookup_key = f"lookup_chat:{chat_data.property_id}:{user1_id}:{user2_id}"
        logger.info(f"[create_chat] Checking lookup key: {lookup_key}")
        existing_chat_id = redis_client.get(lookup_key)
        
        if existing_chat_id:
            logger.info(f"[create_chat] Found existing chat {existing_chat_id}, returning it.")
            chat_key = f"chat:{existing_chat_id}"
            existing_chat_data = redis_client.hgetall(chat_key)
            if not existing_chat_data:
                 logger.error(f"[create_chat] Lookup key found chat {existing_chat_id}, but chat data is missing in {chat_key}.")
                 # Удаляем невалидный lookup ключ
                 redis_client.delete(lookup_key)
                 # Продолжаем создание нового чата вместо ошибки 500
                 logger.warning(f"[create_chat] Proceeding to create a new chat instead of returning missing existing chat.")
            else:
                # Возвращаем данные существующего чата, соответствующие ChatResponse
                return ChatResponse(
                    id=existing_chat_id,
                    property_id=int(existing_chat_data.get("property_id", chat_data.property_id)),
                    participants=sorted([int(p) for p in redis_client.smembers(f"chat:{existing_chat_id}:participants")]) or [user1_id, user2_id],
                    created_at=datetime.fromisoformat(existing_chat_data.get("created_at", datetime.now().isoformat())),
                    updated_at=datetime.fromisoformat(existing_chat_data.get("updated_at", datetime.now().isoformat())),
                    is_archived=existing_chat_data.get("is_archived") == 'True',
                    property_title=existing_chat_data.get("property_title"),
                    property_image=existing_chat_data.get("property_image") # URL уже должен быть полным при сохранении
                )

        # --- Шаг 2: Получение деталей недвижимости (owner_id) --- 
        logger.info(f"[create_chat] Fetching property details for {chat_data.property_id}")
        property_details = await fetch_property_details(chat_data.property_id)
        logger.info(f"[create_chat] Property details result: {property_details}")
        if not property_details:
            logger.error("[create_chat] Failed to get property details (fetch_property_details returned None).")
            raise HTTPException(status_code=400, detail="Не удалось получить информацию об объекте недвижимости")
            
        try:
            owner_id = property_details["owner_id"]
        except KeyError:
            logger.error(f"[create_chat] Missing 'owner_id' key in property_details: {property_details}")
            raise HTTPException(status_code=500, detail="Ошибка обработки данных недвижимости: отсутствует ID владельца")

        # Проверяем, что один из участников - это владелец
        if owner_id not in chat_data.participants:
             logger.error(f"[create_chat] Owner ID {owner_id} from property details is not in the provided participants list {chat_data.participants}")
             raise HTTPException(status_code=400, detail="Владелец объекта не является участником чата.")
        
        # Проверяем, что текущий пользователь не владелец (уже должно быть проверено выше, но дублируем)
        if current_user_id == owner_id:
             logger.warning(f"[create_chat] User {current_user_id} is the owner {owner_id}, cannot create chat.")
             raise HTTPException(status_code=400, detail="Владелец не может создать чат сам с собой по своему объекту.")
             
        property_title = property_details.get("property_title")
        image_filename = property_details.get("property_image_filename")
        full_image_url = get_full_image_url(image_filename) # Формируем полный URL здесь
        logger.info(f"[create_chat] Property details processed: owner_id={owner_id}, title='{property_title}'")

        # --- Шаг 3: Определение и получение деталей участников --- 
        buyer_id = next((p for p in chat_data.participants if p != owner_id), None)
        # Эта проверка лишняя, т.к. мы проверили owner_id in participants и len(participants) == 2
        # if not buyer_id: ... 

        logger.info(f"[create_chat] Fetching details for owner {owner_id} and buyer {buyer_id}...")
        owner_details = await fetch_user_details(owner_id)
        buyer_details = await fetch_user_details(buyer_id)
        owner_name = owner_details.get("full_name") if owner_details else "Владелец"
        buyer_name = buyer_details.get("full_name") if buyer_details else "Покупатель"
        logger.info(f"[create_chat] Names determined: Owner='{owner_name}', Buyer='{buyer_name}'")

        # --- Шаг 4: Подготовка данных для Redis --- 
        chat_id = str(uuid.uuid4())
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        now = datetime.now()
        now_iso = now.isoformat()
        chat_to_save = { 
            "property_id": chat_data.property_id,
            "owner_id": owner_id,
            "buyer_id": buyer_id,
            "owner_name": owner_name,
            "buyer_name": buyer_name,
            "created_at": now_iso,
            "updated_at": now_iso,
            "is_archived": 'False',
            "property_title": property_title or "",
            "property_image": full_image_url or "", # Сохраняем ПОЛНЫЙ URL
            "last_message": "", # Пустые строки вместо None
            "last_message_time": "",
            "unread_count_user1": 0, 
            "unread_count_user2": 0
        }
        logger.info(f"[create_chat] Data prepared for Redis: {chat_to_save}")

        # --- Шаг 5: Транзакция Redis --- 
        logger.info(f"[create_chat] Starting Redis transaction for chat {chat_id}")
        pipe = redis_client.pipeline()
        pipe.hset(chat_key, mapping=chat_to_save)
        pipe.sadd(participants_key, str(owner_id), str(buyer_id))
        pipe.sadd(f"user:{owner_id}:chats", chat_id)
        pipe.sadd(f"user:{buyer_id}:chats", chat_id)
        pipe.set(lookup_key, chat_id)
        results = pipe.execute()
        logger.info(f"[create_chat] Redis transaction finished. Results: {results}")

        if not all(results):
            logger.error(f"[create_chat] Redis pipeline failed! Results: {results}")
            # Попытка очистки? Сложно. Лучше вернуть ошибку.
            raise HTTPException(status_code=500, detail="Ошибка сохранения данных чата в Redis.")

        # --- Шаг 6: Уведомление через WebSocket --- 
        logger.info(f"[create_chat] Emitting 'new_chat' event for chat {chat_id}")
        await sio.emit('new_chat', {'chat_id': chat_id, 'participants': [owner_id, buyer_id]})

        # --- Шаг 7: Формирование и возврат ответа --- 
        logger.info(f"[create_chat] Preparing final response for new chat {chat_id}")
        # Возвращаем только поля, соответствующие упрощенной ChatResponse
        response_obj = ChatResponse(
            id=chat_id,
            property_id=chat_data.property_id,
            participants=[owner_id, buyer_id], # Используем вычисленные ID
            created_at=now, # Используем объект datetime
            updated_at=now, 
            is_archived=False,
            property_title=chat_to_save["property_title"],
            property_image=chat_to_save["property_image"]
        )
        logger.info(f"[create_chat] <<< Finished chat creation successfully for chat {chat_id}. Returning response. >>>")
        return response_obj

    except HTTPException as http_exc:
        # Логируем и передаем дальше HTTP исключения, которые мы сами вызвали
        logger.error(f"[create_chat] HTTP Exception occurred: {http_exc.status_code} - {http_exc.detail}")
        raise http_exc
    except Exception as e:
        # Логируем любые другие непредвиденные ошибки
        logger.exception(f"[create_chat] UNEXPECTED Error creating chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Непредвиденная ошибка сервера при создании чата: {str(e)}")

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
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Создает новое сообщение в чате.
    """
    logger.info(f"[create_message] <<< User {current_user_id} creating message in chat {chat_id} >>>")
    
    # 1. Проверка, является ли пользователь участником чата
    participants_key = f"chat:{chat_id}:participants"
    if not redis_client.sismember(participants_key, str(current_user_id)):
        logger.warning(f"User {current_user_id} not member of chat {chat_id}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Вы не являетесь участником этого чата")

    # 2. Валидация сообщения (может быть добавлена позже)
    if not message.content or message.content.isspace():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Сообщение не может быть пустым")

    # 3. Вызов сервисной функции для сохранения и отправки
    try:
        message_response = await save_and_emit_message(
            sio=sio,
            chat_id=chat_id,
            sender_id=current_user_id,
            content=message.content.strip(), # Передаем очищенный контент
            message_type="text" # Этот эндпоинт только для текста
        )
        logger.info(f"[create_message] Message {message_response.id} created and emitted successfully.")
        return message_response
    except Exception as e:
        # Ошибки из save_and_emit_message будут пойманы здесь
        logger.exception(f"[create_message] Failed to save or emit message for chat {chat_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="Не удалось создать или отправить сообщение"
        )

@router.put("/{chat_id}/messages/readall")
async def mark_all_messages_as_read(
    chat_id: str,
    current_user_id: int = Depends(get_current_user_id)
):
    logger.info(f"User {current_user_id} marking all messages as read in chat {chat_id}")
    try:
        # Проверяем существование чата и права доступа
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        
        if not redis_client.exists(chat_key):
            logger.warning(f"Attempt to mark messages as read in non-existent chat {chat_id}")
            raise HTTPException(status_code=404, detail="Чат не найден")
            
        participants_ids_str = redis_client.smembers(participants_key)
        if not participants_ids_str:
            logger.error(f"Participants set not found for existing chat {chat_id}")
            raise HTTPException(status_code=500, detail="Ошибка данных чата: участники не найдены")
             
        participants = [int(p) for p in participants_ids_str]
        if current_user_id not in participants:
            logger.warning(f"User {current_user_id} tried to mark messages as read in chat {chat_id} they are not part of")
            raise HTTPException(status_code=403, detail="Нет доступа к чату")
            
        # Получаем все сообщения чата
        message_ids = redis_client.zrange(f"chat:{chat_id}:messages", 0, -1)
        if not message_ids:
            return {"status": "success", "message": "Нет сообщений для отметки"}
        
        updated_message_ids = [] # Список ID сообщений, статус которых обновлен

        # Отмечаем все сообщения как прочитанные
        with redis_client.pipeline() as pipe:
            for message_id in message_ids:
                message_key = f"message:{message_id}" 
                
                sender_id_str = redis_client.hget(message_key, 'sender_id')
                is_read_str = redis_client.hget(message_key, 'is_read') # Получаем текущий статус
                
                if not sender_id_str:
                    logger.warning(f"Could not get sender_id for message key {message_key} while marking as read.")
                    continue
                    
                try:
                    sender_id = int(sender_id_str)
                    # Обновляем, если сообщение от ДРУГОГО пользователя И оно еще НЕ прочитано
                    if sender_id != current_user_id and is_read_str == "False":
                        pipe.hset(message_key, "is_read", "True") 
                        updated_message_ids.append(message_id) # Добавляем ID в список обновленных
                except ValueError:
                     logger.error(f"Invalid sender_id '{sender_id_str}' for message key {message_key}.")
                     continue
                    
            results = pipe.execute()
            logger.info(f"Marked {len(updated_message_ids)} messages as read in chat {chat_id}. Pipeline results: {results}")
            
        # Сбрасываем счетчик непрочитанных для текущего пользователя
        sorted_participants = sorted(participants)
        user_index = 1 if current_user_id == sorted_participants[0] else 2
        unread_key = f"unread_count_user{user_index}"
        redis_client.hset(chat_key, unread_key, 0)
        logger.info(f"Unread count for user {current_user_id} (index {user_index}) reset.")
        
        # --- ДОБАВЛЕНО: Отправка события Socket.IO отправителю --- 
        if updated_message_ids:
            # Определяем ID отправителя (того, кто НЕ является текущим пользователем)
            other_user_id = next((p for p in participants if p != current_user_id), None)
            if other_user_id:
                try:
                    # Готовим данные для события
                    event_data = {
                        "chat_id": chat_id,
                        "reader_id": current_user_id, # Кто прочитал
                        "message_ids": updated_message_ids # Какие сообщения прочитаны
                    }
                    # Отправляем событие в комнату = ID другого пользователя
                    await sio.emit('messages_read', event_data, room=str(other_user_id))
                    logger.info(f"Emitted 'messages_read' event to user {other_user_id} for chat {chat_id}")
                except Exception as e:
                    logger.exception(f"Failed to emit 'messages_read' event: {e}")
            else:
                 logger.error(f"Could not determine other user ID to send 'messages_read' event for chat {chat_id}")
        # --- КОНЕЦ ДОБАВЛЕНИЯ --- 

        return {"status": "success", "message": "Все сообщения отмечены как прочитанные"}
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.exception(f"Error marking messages as read for user {current_user_id} in chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка сервера при отметке сообщений как прочитанных: {str(e)}")

@router.delete("/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat(
    chat_id: str,
    current_user_id: int = Depends(get_current_user_id)
):
    logger.info(f"Attempting to delete chat {chat_id} by user {current_user_id}")
    try:
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        messages_set_key = f"chat:{chat_id}:messages"
        
        # 1. Проверяем существование чата
        chat_exists = redis_client.exists(chat_key)
        if not chat_exists:
            logger.warning(f"Chat {chat_id} not found for deletion attempt by user {current_user_id}")
            return Response(status_code=status.HTTP_204_NO_CONTENT)
            
        # 2. Получаем участников и проверяем права
        participants_ids_str = redis_client.smembers(participants_key)
        participants = [int(p) for p in participants_ids_str]
        
        if current_user_id not in participants:
            logger.warning(f"User {current_user_id} tried to delete chat {chat_id} without permission. Participants: {participants}")
            raise HTTPException(status_code=403, detail="У вас нет прав для удаления этого чата")
            
        # 3. Собираем ключи для удаления
        # Ключи метаданных чата
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        messages_set_key = f"chat:{chat_id}:messages"
        # Ключ для обратного поиска (если используется)
        chat_data = redis_client.hgetall(chat_key)
        owner_id = chat_data.get("owner_id")
        buyer_id = chat_data.get("buyer_id")
        property_id = chat_data.get("property_id")
        lookup_key = None
        if owner_id and buyer_id and property_id:
             try:
                 user1_id, user2_id = sorted([int(owner_id), int(buyer_id)])
                 lookup_key = f"lookup_chat:{property_id}:{user1_id}:{user2_id}"
             except ValueError:
                  logger.warning(f"Could not form lookup key for chat {chat_id} due to invalid IDs.")
        
        keys_to_delete = [chat_key, participants_key, messages_set_key]
        if lookup_key:
             keys_to_delete.append(lookup_key)
        
        # Добавляем ключи сообщений
        message_ids = redis_client.zrange(messages_set_key, 0, -1)
        for message_id in message_ids:
            keys_to_delete.append(f"message:{message_id}") 
            
        # Удаляем ссылки на чат у пользователей
        if owner_id: keys_to_delete.append(f"user:{owner_id}:chats") # Удаляем ключ целиком, это может быть неверно если у юзера много чатов
        if buyer_id: keys_to_delete.append(f"user:{buyer_id}:chats") # Правильнее использовать SREM
        
        # 4. Удаляем все ключи транзакцией
        if keys_to_delete:
            pipe = redis_client.pipeline()
            # Используем SREM для удаления chat_id из списков пользователей
            if owner_id: pipe.srem(f"user:{owner_id}:chats", chat_id)
            if buyer_id: pipe.srem(f"user:{buyer_id}:chats", chat_id)
            # Удаляем остальные ключи
            keys_to_delete_final = [k for k in keys_to_delete if not k.startswith("user:")]
            if keys_to_delete_final:
                 pipe.delete(*keys_to_delete_final) # Используем * для передачи нескольких ключей в delete
                 
            results = pipe.execute()
            logger.info(f"Deleted chat {chat_id} and related keys/references. Results: {results}")
        else:
            logger.info(f"No keys found to delete for chat {chat_id}")

        # 5. Отправляем событие об удалении чата через WebSocket (опционально)
        # Убедитесь, что у вас есть ID получателя, если хотите уведомить его
        recipient_id = next((p for p in participants if p != current_user_id), None)
        if recipient_id:
            await sio.emit('chat_deleted', {'chat_id': chat_id}, room=str(recipient_id))
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
    current_user_id: int = Depends(get_current_user_id)
):
    logger.info(f"User {current_user_id} getting participants for chat {chat_id}")
    try:
        chat_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"
        
        # Проверяем существование чата
        if not redis_client.exists(chat_key):
            logger.warning(f"Chat {chat_id} not found when getting participants.")
            raise HTTPException(status_code=404, detail="Чат не найден")
            
        # Получаем участников и проверяем права доступа
        participants_ids_str = redis_client.smembers(participants_key)
        if not participants_ids_str:
            logger.error(f"Participants set not found for existing chat {chat_id}")
            raise HTTPException(status_code=500, detail="Ошибка данных чата: участники не найдены")
            
        participants = {int(p) for p in participants_ids_str}
        if current_user_id not in participants:
            logger.warning(f"User {current_user_id} tried to get participants from chat {chat_id} without permission.")
            raise HTTPException(status_code=403, detail="Нет доступа к чату")
            
        # Получаем информацию о чате
        chat_data = redis_client.hgetall(chat_key)
        
        # Получаем детали участников
        participants_details = []
        for participant_id in participants:
            if participant_id == current_user_id:
                # Для текущего пользователя используем данные из контекста
                participants_details.append({
                    "id": current_user_id,
                    "name": "Вы",
                    "email": "",
                    "avatar": "",
                    "lastSeen": datetime.now().isoformat(),
                    "isOnline": True
                })
            else:
                # Для других участников получаем данные из Redis или API
                user_details = await fetch_user_details(participant_id)
                participants_details.append({
                    "id": participant_id,
                    "name": user_details.get("full_name", "Собеседник"),
                    "email": user_details.get("email", ""),
                    "avatar": user_details.get("avatar", ""),
                    "lastSeen": datetime.now().isoformat(), # TODO: Реализовать получение реального времени последней активности
                    "isOnline": True # TODO: Реализовать проверку онлайн-статуса
                })
        
        return participants_details
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        logger.exception(f"Error getting participants for chat {chat_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Ошибка сервера при получении участников: {str(e)}")

# Убедитесь, что роутер подключен в main.py или app/__init__.py

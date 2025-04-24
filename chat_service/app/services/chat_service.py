import uuid
from datetime import datetime, timezone
import json
import logging
from typing import Optional, List, Dict

import socketio
import asyncpg

from app.core.redis import redis_client
from app.core.config import settings
from app.schemas.chat import MessageResponse
from app.services.postgres_service import PostgresChatService

logger = logging.getLogger(__name__)

# Конфигурация для подключения к PostgreSQL
DB_CONFIG = {
    "user": settings.POSTGRES_USER,
    "password": settings.POSTGRES_PASSWORD,
    "host": settings.POSTGRES_HOST,
    "port": settings.POSTGRES_PORT,
    "database": settings.POSTGRES_DB
}

async def sync_message_to_postgres(message_data: dict):
    """Синхронизирует сообщение с PostgreSQL."""
    try:
        async with asyncpg.create_pool(**DB_CONFIG) as pool:
            async with pool.acquire() as conn:
                await conn.execute('''
                    INSERT INTO messages (id, chat_id, sender_id, content, created_at, message_type, attachments)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (id) DO UPDATE SET
                        content = EXCLUDED.content,
                        message_type = EXCLUDED.message_type,
                        attachments = EXCLUDED.attachments
                ''', 
                message_data["id"],
                message_data["chat_id"],
                message_data["sender_id"],
                message_data["content"],
                message_data["created_at"],
                message_data["message_type"],
                message_data["attachments"]
                )
    except Exception as e:
        logger.error(f"Ошибка при синхронизации сообщения с PostgreSQL: {str(e)}")
        # Не прерываем выполнение, так как основное хранилище - Redis

async def save_and_emit_message(
    sio: socketio.AsyncServer,
    chat_id: str,
    sender_id: int,
    content: str,
    message_type: str = "text",
    attachments: Optional[List[dict]] = None,
    temp_id: Optional[str] = None,
    postgres_service: Optional[PostgresChatService] = None
) -> MessageResponse:
    """
    Сохраняет сообщение в Redis и PostgreSQL, обновляет метаданные чата и отправляет
    событие 'new_message' через Socket.IO.
    Возвращает созданный объект MessageResponse.
    Включает temp_id в ответ, если он был предоставлен.
    """
    logger.info(f"[ChatService] Сохранение сообщения для чата {chat_id} от пользователя {sender_id}. TempID: {temp_id}")

    try:
        # 1. Генерация ID и временной метки
        message_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        timestamp_iso = timestamp.isoformat()

        # Создаем naive версию timestamp для PostgreSQL
        naive_timestamp = timestamp.replace(tzinfo=None)

        # 2. Подготовка контента и превью
        message_content_to_save = content
        last_message_preview = content
        
        if message_type != "text":
            try:
                parsed_content = json.loads(content)
                filename = parsed_content.get("filename", "файл")
                type_display = message_type.capitalize()
                last_message_preview = f"[{type_display}] {filename}"
            except json.JSONDecodeError:
                logger.warning(f"Не удалось распарсить JSON контент для типа {message_type}: {content}")
                last_message_preview = f"[{message_type.capitalize()}]"

        if len(last_message_preview) > 100:
            last_message_preview = last_message_preview[:97] + "..."

        # 3. Подготовка данных для Redis
        message_data = {
            "id": str(message_id),
            "chat_id": str(chat_id),
            "sender_id": str(sender_id),
            "content": str(message_content_to_save),
            "created_at": str(timestamp_iso),
            "message_type": str(message_type),
            "attachments": str(json.dumps(attachments)) if attachments else None
        }

        # 4. Сохранение в Redis
        message_key = f"message:{message_id}"
        chat_meta_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"

        pipeline = redis_client.pipeline()
        
        # Сохраняем данные сообщения
        for key, value in message_data.items():
            if value is not None:
                pipeline.hset(message_key, key, str(value))
        
        # Добавляем сообщение в список сообщений чата
        pipeline.zadd(f"chat:{chat_id}:messages", {str(message_id): float(timestamp.timestamp())})
        
        # Обновляем метаданные чата
        pipeline.hset(chat_meta_key, "last_message", str(last_message_preview))
        pipeline.hset(chat_meta_key, "last_message_time", str(timestamp_iso))
        pipeline.hset(chat_meta_key, "sender_id_of_last_message", str(sender_id))
        pipeline.hset(chat_meta_key, "updated_at", str(timestamp_iso))

        # Обновляем счетчики непрочитанных
        participants_ids_str = redis_client.smembers(participants_key)
        if participants_ids_str:
            participants_ids = {int(p) for p in participants_ids_str if p.isdigit()}
            sorted_participants = sorted(list(participants_ids))
            if len(sorted_participants) == 2:
                user1_id = sorted_participants[0]
                user2_id = sorted_participants[1]
                if sender_id == user1_id:
                    pipeline.hincrby(chat_meta_key, "unread_count_user2", 1)
                elif sender_id == user2_id:
                    pipeline.hincrby(chat_meta_key, "unread_count_user1", 1)
            else:
                logger.warning(f"Чат {chat_id} имеет {len(participants_ids)} участников, ожидается 2")

        # Выполняем транзакцию Redis
        results = pipeline.execute()
        logger.info(f"Сообщение {message_id} сохранено в Redis для чата {chat_id}. Результаты транзакции: {results}")

        # 5. Синхронизируем с PostgreSQL
        if postgres_service:
            try:
                # Подготавливаем данные для PostgreSQL
                pg_message_data = {
                    "id": message_id,
                    "chat_id": chat_id,
                    "sender_id": sender_id,
                    "content": message_content_to_save,
                    "created_at": naive_timestamp,  # Используем naive datetime для PostgreSQL
                    "message_type": message_type,
                    "is_read": False,
                    "attachments": attachments
                }
                await postgres_service.save_message(pg_message_data)
                logger.info(f"Сообщение {message_id} успешно сохранено в PostgreSQL")
            except Exception as e:
                logger.error(f"Ошибка при сохранении сообщения в PostgreSQL: {str(e)}")
                # Продолжаем выполнение, так как сообщение уже сохранено в Redis
        else:
            logger.warning("PostgresChatService не предоставлен, пропускаем сохранение в PostgreSQL")

        # 6. Создаем объект ответа
        response_data = {
            "id": message_id,
            "chat_id": chat_id,
            "sender_id": sender_id,
            "content": message_content_to_save,
            "created_at": timestamp,  # Используем объект datetime с UTC
            "message_type": message_type,
            "is_read": False,
            "attachments": attachments
        }
        
        if temp_id is not None:
            response_data["temp_id"] = temp_id

        message_response = MessageResponse(**response_data)

        # 7. Отправляем событие через Socket.IO
        emit_data_json = message_response.model_dump_json()
        logger.info(f"[DEBUG ChatService Emit JSON] {emit_data_json}")
        logger.info(f"[ChatService] Отправка 'new_message' в комнату {chat_id}")
        await sio.emit('new_message', emit_data_json, room=chat_id)
        logger.info(f"[ChatService] Событие 'new_message' УСПЕШНО отправлено в комнату {chat_id}")
        
        return message_response

    except Exception as e:
        logger.exception(f"Ошибка при сохранении/отправке сообщения для чата {chat_id}: {e}")
        raise 
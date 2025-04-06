import uuid
from datetime import datetime, timezone
import json
import logging
from typing import Optional, List

import socketio

from app.core.redis import redis_client
from app.schemas.chat import MessageResponse

logger = logging.getLogger(__name__)

async def save_and_emit_message(
    sio: socketio.AsyncServer,
    chat_id: str,
    sender_id: int,
    content: str,
    message_type: str = "text",
    attachments: Optional[List[dict]] = None,
    temp_id: Optional[str] = None
) -> MessageResponse:
    """
    Сохраняет сообщение в Redis, обновляет метаданные чата и отправляет
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
            "id": message_id,
            "chat_id": chat_id,
            "sender_id": str(sender_id),
            "content": message_content_to_save,
            "created_at": timestamp_iso,
            "message_type": message_type,
            "attachments": json.dumps(attachments) if attachments else None
        }

        # 4. Сохранение в Redis
        message_key = f"message:{message_id}"
        chat_meta_key = f"chat:{chat_id}"
        participants_key = f"chat:{chat_id}:participants"

        pipeline = redis_client.pipeline()
        
        # Сохраняем данные сообщения
        for key, value in message_data.items():
            if value is not None:
                pipeline.hset(message_key, key, value)
        
        # Добавляем сообщение в список сообщений чата
        pipeline.zadd(f"chat:{chat_id}:messages", {message_id: timestamp.timestamp()})
        
        # Обновляем метаданные чата
        pipeline.hset(chat_meta_key, "last_message", last_message_preview)
        pipeline.hset(chat_meta_key, "last_message_time", timestamp_iso)
        pipeline.hset(chat_meta_key, "sender_id_of_last_message", str(sender_id))
        pipeline.hset(chat_meta_key, "updated_at", timestamp_iso)

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

        # Выполняем транзакцию
        results = pipeline.execute()
        logger.info(f"Сообщение {message_id} сохранено в Redis для чата {chat_id}. Результаты транзакции: {results}")

        # 5. Создаем объект ответа
        response_data = {
            "id": message_id,
            "chat_id": chat_id,
            "sender_id": sender_id,
            "content": message_content_to_save,
            "created_at": timestamp,
            "message_type": message_type,
            "is_read": False,
            "attachments": attachments
        }
        
        if temp_id is not None:
            response_data["temp_id"] = temp_id

        message_response = MessageResponse(**response_data)

        # 6. Отправляем событие через Socket.IO
        emit_data_json = message_response.model_dump_json()
        logger.info(f"[DEBUG ChatService Emit JSON] {emit_data_json}")
        logger.info(f"[ChatService] Отправка 'new_message' в комнату {chat_id}")
        await sio.emit('new_message', emit_data_json, room=chat_id)
        logger.info(f"[ChatService] Событие 'new_message' УСПЕШНО отправлено в комнату {chat_id}")
        
        return message_response

    except Exception as e:
        logger.exception(f"Ошибка при сохранении/отправке сообщения для чата {chat_id}: {e}")
        raise 
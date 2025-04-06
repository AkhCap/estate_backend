import os
import shutil
import uuid
from pathlib import Path
from typing import Annotated, List
from datetime import datetime, timezone # Добавляем datetime
import json # Добавляем json для сериализации контента

from fastapi import APIRouter, Depends, UploadFile, HTTPException, Request, Header, status, File, Form
from fastapi.datastructures import UploadFile # <-- Используем это для isinstance
from fastapi.responses import JSONResponse, FileResponse
import logging

from app import sio # << Импортируем sio
from app.core.config import settings
from app.core.auth import get_current_user_id # Используем существующую функцию аутентификации
from app.core.redis import redis_client # Для проверки существования чата и участников
from app.schemas.chat import MessageResponse # << Импортируем схему ответа для сообщения

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat-api/uploads", tags=["Chat Uploads"])

# Директория для сохранения загруженных файлов чата
UPLOAD_DIR = Path("uploads/chat_files") 
# Убедимся, что директория существует
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# --- Добавляем константы --- 
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10 MB
ALLOWED_MIME_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
} # Используем set для быстрого поиска

# --- Вспомогательные функции (перенесены или адаптированы) ---

async def check_chat_membership(chat_id: str, user_id: int):
    """Проверяет, является ли пользователь участником чата."""
    chat_key = f"chat:{chat_id}"
    participants_key = f"chat:{chat_id}:participants"
    
    if not redis_client.exists(chat_key):
        logger.warning(f"Попытка загрузить файл в несуществующий чат {chat_id} пользователем {user_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Чат не найден")
        
    is_member = redis_client.sismember(participants_key, str(user_id))
    if not is_member:
        logger.warning(f"Пользователь {user_id} попытался загрузить файл в чат {chat_id}, в котором не участвует")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Вы не являетесь участником этого чата")
    logger.info(f"Пользователь {user_id} подтвержден как участник чата {chat_id}")

# --- UPDATED ENDPOINT --- 
@router.post("/{chat_id}")
async def upload_chat_files_with_caption( 
    chat_id: str,
    files: List[UploadFile] = File(...), # Expect a list of files
    message: Annotated[str | None, Form()] = None, # Optional single message
    request: Request = None, # Needed for url_for
    current_user_id: int = Depends(get_current_user_id)
):
    """
    Uploads ONE or MORE files with an optional shared caption.
    Creates ONE chat message of type 'files'.
    """
    logger.info(f"[upload_chat_files] <<< Start request for chat {chat_id}, user {current_user_id}, files: {len(files)} >>>")

    await check_chat_membership(chat_id, current_user_id)

    processed_files_metadata = [] 
    errors = []

    chat_upload_dir = UPLOAD_DIR / chat_id
    chat_upload_dir.mkdir(parents=True, exist_ok=True)

    # --- Process EACH file --- 
    for file in files:
        file_size = None
        try:
            file.file.seek(0, os.SEEK_END)
            file_size = file.file.tell()
            file.file.seek(0) 
        except Exception as e:
             logger.warning(f"Could not get size for file '{file.filename}' via seek/tell: {e}. Attempting read.")
             try:
                 # Read the entire file to get size (for InMemoryUploadedFile)
                 content_for_size = await file.read()
                 file_size = len(content_for_size)
                 await file.seek(0) # Reset pointer!
                 logger.info(f"File size for '{file.filename}' determined via read(): {file_size}")
             except Exception as read_e:
                 logger.error(f"Failed to get size for file '{file.filename}' via read() as well: {read_e}")
                 errors.append(f"Error determining file size: {file.filename}")
                 continue 

        file_content_type = file.content_type
        file_filename = file.filename

        logger.info(f"Processing file: filename='{file_filename}', content_type='{file_content_type}', size={file_size}")

        # --- Validation --- 
        if file_size is None:
            logger.warning(f"Skipping size check for '{file_filename}' as size is undetermined.")
        elif file_size > MAX_FILE_SIZE:
            logger.warning(f"File '{file_filename}' ({file_size} bytes) is too large.")
            errors.append(f"File too large: {file_filename} (max {MAX_FILE_SIZE // 1024 // 1024} MB)")
            continue 

        if not file_content_type or file_content_type not in ALLOWED_MIME_TYPES:
            logger.warning(f"Invalid file type for '{file_filename}' ({file_content_type}).")
            errors.append(f"Invalid file type: {file_filename}")
            continue 

        # --- Save File --- 
        file_extension = Path(file_filename).suffix if file_filename else ""
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = chat_upload_dir / unique_filename

        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"File '{unique_filename}' saved successfully.")

            # Store metadata of processed file
            if request: # Check if request object is available
              file_url = request.url_for('get_chat_file', chat_id=chat_id, filename=unique_filename)
              processed_files_metadata.append({
                  "url": str(file_url),
                  "filename": file_filename,
                  "content_type": file_content_type,
                  "size": file_size
              })
            else:
              logger.error("Request object not available, cannot generate file URL.")
              errors.append(f"Internal error generating URL for: {file_filename}")
              # Should we continue or raise? For now, log error and skip adding to metadata
              # raise HTTPException(status_code=500, detail="Internal server error: Request context unavailable")

        except Exception as e:
            logger.exception(f"Error saving file '{unique_filename}': {e}")
            errors.append(f"Error saving file: {file_filename}")
            await file.close() # Ensure file is closed on error
            continue 
        finally:
             await file.close()
             logger.debug(f"File '{file_filename}' closed.")
    # --- End file processing loop --- 

    if not processed_files_metadata:
        logger.error(f"No files were processed successfully for chat {chat_id}. Errors: {errors}")
        error_detail = "Failed to process any files." + (" Reasons: " + "; ".join(errors) if errors else "")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_detail
        )

    # --- Create ONE message in Redis --- 
    try:
        message_id = str(uuid.uuid4())
        timestamp = datetime.now(timezone.utc)
        timestamp_iso = timestamp.isoformat()
        caption = message.strip() if message else None

        # --- New message content format --- 
        message_content_data = {
            "type": "files", # New type
            "caption": caption,
            "files": processed_files_metadata # List of file metadata
        }
        message_content_json = json.dumps(message_content_data)

        # --- Determine last_message_preview --- 
        file_count = len(processed_files_metadata)
        if file_count == 1:
             preview_filename = processed_files_metadata[0].get('filename', 'file')
             last_message_preview = f"[Файл] {preview_filename}"
             if caption:
                 last_message_preview = f"{caption} ({preview_filename})"
        else:
             last_message_preview = f"[Файлы ({file_count} шт.)]"
             if caption:
                 last_message_preview = f"{caption} (+{file_count} файла)"

        # ... Redis and Socket.IO logic ...
        message_data = {
            "id": message_id,
            "chat_id": chat_id,
            "sender_id": str(current_user_id),
            "content": message_content_json,
            "created_at": timestamp_iso,
            "message_type": "files" # Set new type
        }
        message_key = f"message:{message_id}"

        pipeline = redis_client.pipeline()
        pipeline.hmset(message_key, message_data)
        pipeline.zadd(f"chat:{chat_id}:messages", {message_id: timestamp.timestamp()})
        chat_meta_key = f"chat:{chat_id}"
        pipeline.hset(chat_meta_key, "last_message", last_message_preview)
        pipeline.hset(chat_meta_key, "last_message_time", timestamp_iso)
        pipeline.hset(chat_meta_key, "updated_at", timestamp_iso)
        # Update unread count logic
        participants_key = f"chat:{chat_id}:participants"
        participants_ids_str = redis_client.smembers(participants_key)
        participants_ids = {int(p) for p in participants_ids_str if p.isdigit()}
        sorted_participants = sorted(list(participants_ids))
        if len(sorted_participants) == 2:
             user1_id = sorted_participants[0]
             user2_id = sorted_participants[1]
             if current_user_id == user1_id:
                 pipeline.hincrby(chat_meta_key, "unread_count_user2", 1)
             elif current_user_id == user2_id:
                 pipeline.hincrby(chat_meta_key, "unread_count_user1", 1)

        pipeline.execute()
        logger.info(f"Message for files {message_id} saved to Redis for chat {chat_id}")

        # --- Emit via WebSocket --- 
        message_response = MessageResponse(
            id=message_id,
            chat_id=chat_id,
            sender_id=current_user_id,
            content=message_content_json,
            created_at=timestamp,
            message_type="files",
            is_read=False 
        )
        emit_data_json = message_response.model_dump_json()
        await sio.emit('new_message', emit_data_json, room=chat_id)
        logger.info(f"[SocketIO Emit] Event 'new_message' (type files) SUCCESS sent to room {chat_id}")

    except Exception as e:
        logger.exception(f"Error creating/sending message for files in chat {chat_id}: {e}")
        return JSONResponse(
            status_code=status.HTTP_207_MULTI_STATUS, 
            content={
                "detail": "Files uploaded, but failed to create chat message.",
                "uploaded_files": [f.get("filename") for f in processed_files_metadata],
                "processing_errors": errors,
                "message_error": str(e)
            }
        )

    # --- Success Response --- 
    final_status_code = status.HTTP_201_CREATED if not errors else status.HTTP_207_MULTI_STATUS

    return JSONResponse(
        status_code=final_status_code,
        content={
            "detail": f"Successfully processed {len(processed_files_metadata)} out of {len(files)} files." if final_status_code == 207 else "All files uploaded successfully and message created.",
            "message_id": message_id,
            "uploaded_files": [f.get("filename") for f in processed_files_metadata],
            "processing_errors": errors
        }
    )

# --- Эндпоинт для отдачи статических файлов чата ---
# Нужен, чтобы клиенты могли скачивать загруженные файлы по URL

@router.get("/files/{chat_id}/{filename}", name="get_chat_file")
async def get_chat_file(chat_id: str, filename: str):
    """
    Отдает статический файл, загруженный в чат.
    Аутентификация для этого эндпоинта убрана для простоты.
    """
    logger.debug(f"Запрос на получение файла '{filename}' из чата {chat_id}")
    
    file_path = UPLOAD_DIR / chat_id / filename
    
    if not file_path.is_file():
        logger.warning(f"Файл '{filename}' не найден в чате {chat_id}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Файл не найден")
        
    # Возвращаем файл. 
    return FileResponse(path=file_path) 
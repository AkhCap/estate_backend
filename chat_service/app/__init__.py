# app/__init__.py
import socketio
import logging
from app.core.redis import redis_client # Убедимся, что redis_client импортирован

# Инициализация Socket.IO
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],  # Разрешаем соединения с фронтенда
    logger=True,
    engineio_logger=True,
    ping_timeout=60,
    ping_interval=25,
    transports=["polling", "websocket"],  # Разрешаем оба типа транспорта
    always_connect=True,  # Всегда разрешать соединение для отладки
    max_http_buffer_size=1e8  # Увеличиваем размер буфера
)

# Обработчики событий Socket.IO
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")
    try:
        # Проверяем наличие токена в query параметрах
        query = environ.get('QUERY_STRING', '')
        import urllib.parse
        params = dict(urllib.parse.parse_qsl(query))
        
        print(f"Query params: {params}")
        
        if 'token' in params:
            try:
                from app.core.security import verify_token
                # Проверяем токен
                payload = verify_token(params['token'])
                print(f"Authenticated user connected via query param: {payload}")
                return True
            except Exception as e:
                print(f"Authentication error (query param): {str(e)}")
                # В режиме разработки разрешаем соединения несмотря на ошибки
                return True
                
        # Проверяем наличие токена в заголовках
        auth_header = environ.get('HTTP_AUTHORIZATION')
        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]
            try:
                from app.core.security import verify_token
                # Проверяем токен
                payload = verify_token(token)
                print(f"Authenticated user connected: {payload}")
                return True
            except Exception as e:
                print(f"Authentication error: {str(e)}")
                # В режиме разработки разрешаем соединения несмотря на ошибки
                return True
                
        # В режиме разработки разрешаем соединения без токена
        print("Warning: Unauthenticated WebSocket connection")
        return True
    except Exception as e:
        print(f"Error during WebSocket connection: {str(e)}")
        # В режиме разработки разрешаем соединения несмотря на ошибки
        return True

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

@sio.event
async def join_chat(sid, data):
    print(f"[DEBUG] Received join_chat event. SID: {sid}, Data: {data}")
    
    chat_id = data.get('chat_id')
    user_id = data.get('user_id')
    
    print(f"[DEBUG] Extracted chat_id: {chat_id}, user_id: {user_id}")

    if chat_id:
        print(f"[DEBUG] Entering room {chat_id} for SID {sid}")
        await sio.enter_room(sid, chat_id)
        print(f"[DEBUG] Successfully entered room {chat_id}")
        
        print(f"[DEBUG] Emitting user_joined event to room {chat_id}")
        await sio.emit('user_joined', {'user_id': user_id}, room=chat_id)
        print(f"[DEBUG] Successfully emitted user_joined event")
    else:
        print(f"[ERROR] Missing chat_id in join_chat event from {sid}")

@sio.event
async def leave_chat(sid, data):
    chat_id = data.get('chat_id')
    if chat_id:
        sio.leave_room(sid, chat_id)
        await sio.emit('user_left', {'user_id': data.get('user_id')}, room=chat_id)

@sio.event
async def message(sid, data):
    chat_id = data.get('chat_id')
    sender_id = data.get('sender_id') # Получаем sender_id
    
    print(f"Received message event from {sid} for chat {chat_id}: {data}")

    if chat_id and sender_id:
        try:
            from app.services.chat_service import save_and_emit_message
            print(f"Attempting to save and emit message for chat {chat_id} from user {sender_id}")
            message_response = await save_and_emit_message(
                sio=sio,
                chat_id=chat_id,
                sender_id=sender_id,
                content=data.get('content', ''),
                temp_id=data.get('temp_id')
            )
            print(f"Message saved and emitted successfully. Response: {message_response}")
        except Exception as e:
            print(f"Error saving/emitting message: {str(e)}")
            # В случае ошибки все равно ретранслируем сообщение
            await sio.emit('message', data, room=chat_id)
    else:
        print(f"Missing chat_id or sender_id in message event from {sid}")

@sio.event
async def send_message(sid, data):
    print(f"[DEBUG] Received send_message event. SID: {sid}, Data: {data}")
    
    chat_id = data.get('chat_id')
    sender_id = data.get('sender_id')
    
    print(f"[DEBUG] Extracted chat_id: {chat_id}, sender_id: {sender_id}")

    if chat_id and sender_id:
        try:
            from app.services.chat_service import save_and_emit_message
            print(f"[DEBUG] Calling save_and_emit_message with data: {data}")
            message_response = await save_and_emit_message(
                sio=sio,
                chat_id=chat_id,
                sender_id=sender_id,
                content=data.get('content', ''),
                message_type=data.get('message_type', 'text'),
                temp_id=data.get('temp_id')
            )
            print(f"[DEBUG] Message saved and emitted successfully. Response: {message_response}")
        except Exception as e:
            print(f"[ERROR] Error in send_message handler: {str(e)}")
            import traceback
            print(f"[ERROR] Full traceback: {traceback.format_exc()}")
            # В случае ошибки все равно ретранслируем сообщение
            await sio.emit('message', data, room=chat_id)
    else:
        print(f"[ERROR] Missing required data in send_message event. chat_id: {chat_id}, sender_id: {sender_id}")

@sio.event
async def typing(sid, data):
    chat_id = data.get('chat_id')
    if chat_id:
        await sio.emit('user_typing', data, room=chat_id)

@sio.event
async def stop_typing(sid, data):
    chat_id = data.get('chat_id')
    if chat_id:
        await sio.emit('user_stop_typing', data, room=chat_id)

# --- НОВЫЙ ОБРАБОТЧИК --- 
logger = logging.getLogger(__name__)

# --- УНИВЕРСАЛЬНЫЙ ОБРАБОТЧИК (для отладки) ---
@sio.on("*")
async def catch_all(event, sid, data):
    # Делаем лог более заметным
    logger.warning(f"[CatchAll WARNING] Received event '{event}' from SID {sid}. Data: {data}")
    # Не нужно вызывать sio.default_namespace.trigger_event, 
    # т.к. декоратор @sio.event сам найдет нужный обработчик, если он есть.
    # Если этот лог есть, а лога из read_messages нет, значит проблема в диспетчеризации.

@sio.event
async def read_messages(sid, data):
    # !!! Переносим лог в самое начало !!!
    logger.info(f"[read_messages ENTRY] Received from SID {sid}. Data: {data}")
    """
    Обрабатывает событие, когда пользователь прочитал сообщения в чате.
    Обновляет статус сообщений в Redis и отправляет уведомление отправителю.
    """
    chat_id = data.get('chat_id')
    reader_user_id = data.get('reader_user_id') # ID пользователя, который прочитал

    if not chat_id or not reader_user_id:
        logger.warning(f"[read_messages] Missing chat_id or reader_user_id in data from SID {sid}. Data: {data}")
        return

    try:
        # 1. Получаем ID всех участников чата
        participants_key = f"chat:{chat_id}:participants"
        participants_ids_str = redis_client.smembers(participants_key)
        if not participants_ids_str:
            logger.warning(f"[read_messages] Participants not found for chat {chat_id}. Cannot process read status.")
            return
        participants_ids = {int(p_id) for p_id in participants_ids_str if p_id.isdigit()}
        logger.debug(f"[read_messages] Participants for chat {chat_id}: {participants_ids}")

        # Убедимся, что читающий - участник
        if reader_user_id not in participants_ids:
             logger.warning(f"[read_messages] User {reader_user_id} is not a participant of chat {chat_id}. Ignoring.")
             return

        # 2. Находим ID отправителя (другого участника)
        # Пока предполагаем, что в чате только двое
        sender_id = next((p_id for p_id in participants_ids if p_id != reader_user_id), None)
        if not sender_id:
             logger.warning(f"[read_messages] Could not determine sender ID in chat {chat_id} for reader {reader_user_id}. Participants: {participants_ids}")
             return
        logger.debug(f"[read_messages] Determined Sender ID: {sender_id}")

        logger.debug(f"[read_messages] Chat: {chat_id}. Reader: {reader_user_id}, Sender: {sender_id}")

        # 3. Получаем ID всех сообщений в чате
        messages_zset_key = f"chat:{chat_id}:messages"
        all_message_ids = redis_client.zrange(messages_zset_key, 0, -1)
        if not all_message_ids:
            logger.info(f"[read_messages] No messages found in chat {chat_id}. Nothing to mark as read.")
            return
        logger.debug(f"[read_messages] Found {len(all_message_ids)} message IDs in chat {chat_id}")

        updated_message_ids = []
        pipeline = redis_client.pipeline()

        # 4. Итерируем по ID сообщений и обновляем статус, если нужно
        for message_id_bytes in all_message_ids:
            message_id = message_id_bytes.decode('utf-8') # Декодируем ID
            message_key = f"message:{message_id}"
            logger.debug(f"[read_messages] Checking message: {message_id}")

            # Проверяем отправителя и текущий статус is_read
            msg_data = redis_client.hmget(message_key, 'sender_id', 'is_read')
            msg_sender_id_str = msg_data[0]
            msg_is_read_val = msg_data[1] # Получаем байты или строку или None

            # Проверяем, что данные получены
            if not msg_sender_id_str:
                 logger.warning(f"[read_messages] Missing sender_id for message {message_id} in chat {chat_id}. Skipping.")
                 continue

            try:
                msg_sender_id = int(msg_sender_id_str)
            except (ValueError, TypeError):
                logger.warning(f"[read_messages] Invalid sender_id '{msg_sender_id_str}' for message {message_id}. Skipping.")
                continue

            # --- Улучшенная проверка is_read --- 
            is_currently_read = False
            if isinstance(msg_is_read_val, bytes):
                is_currently_read = msg_is_read_val.decode('utf-8').lower() == 'true'
            elif isinstance(msg_is_read_val, str):
                is_currently_read = msg_is_read_val.lower() == 'true'
            # Если None, считаем как False
            # --- Конец улучшенной проверки --- 

            logger.debug(f"[read_messages] Message {message_id}: Sender={msg_sender_id}, IsRead={is_currently_read}")
            
            # Обновляем, если сообщение ОТ ДРУГОГО пользователя и оно еще НЕ прочитано
            if msg_sender_id == sender_id and not is_currently_read:
                logger.info(f"[read_messages] Marking message {message_id} as read for chat {chat_id}.")
                pipeline.hset(message_key, "is_read", "True")
                updated_message_ids.append(message_id)
            else:
                 logger.debug(f"[read_messages] Skipping message {message_id} (Sender: {msg_sender_id} != {sender_id} or IsRead: {is_currently_read})")

        # 5. Сбрасываем счетчик непрочитанных для читающего
        chat_meta_key = f"chat:{chat_id}"
        sorted_participants = sorted(list(participants_ids))
        # Определяем индекс пользователя (1 или 2) в отсортированном списке
        reader_index_in_sorted = sorted_participants.index(reader_user_id) + 1
        unread_count_key = f"unread_count_user{reader_index_in_sorted}"
        pipeline.hset(chat_meta_key, unread_count_key, 0)
        logger.debug(f"[read_messages] Resetting unread count key '{unread_count_key}' for user {reader_user_id} in chat {chat_id}.")

        # Выполняем транзакцию Redis
        if len(pipeline.command_stack) > 0: # Выполняем, только если есть команды
            results = pipeline.execute()
            logger.info(f"[read_messages] Redis pipeline executed for chat {chat_id}. Results: {results}. Marked {len(updated_message_ids)} messages.")
        else:
             logger.info(f"[read_messages] No commands in Redis pipeline for chat {chat_id}. Nothing executed.")

        # 6. Отправляем событие 'message_status_update' ОТПРАВИТЕЛЮ, если что-то обновилось
        if updated_message_ids:
            event_data = {
                "chat_id": chat_id,
                "message_ids": updated_message_ids,
                "is_read": True # Явно указываем, что статус - "прочитано"
            }
            # Отправляем событие в комнату ЧАТА
            target_room = chat_id
            await sio.emit('message_status_update', event_data, room=target_room)
            logger.info(f"[read_messages] >>> Emitted 'message_status_update' to room {target_room} for sender {sender_id}. Messages: {updated_message_ids}")
        else:
            logger.info(f"[read_messages] No messages were updated for chat {chat_id}. No status update emitted.")

    except Exception as e:
        logger.exception(f"[read_messages] Error processing read status for chat {chat_id}, reader {reader_user_id}: {e}")

# --- Проверка регистрации --- 
logger.info("[Init Check] 'read_messages' event handler defined.")

# Этот код должен быть в конце файла 
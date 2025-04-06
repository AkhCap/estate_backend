# chat_service/app/schemas/__init__.py

# Импортируем все необходимые схемы из модуля chat.py
from .chat import (
    ChatCreate,
    ChatResponse,
    ChatListDetail,
    ChatListResponse,
    ParticipantDetail,
    MessageCreate,
    MessageResponse,
    ChatMessageListResponse
    # User удален, так как его нет в chat.py и он не используется в routes/chat.py
)

# Можно добавить __all__ для явного указания экспортируемых имен
__all__ = [
    "ChatCreate",
    "ChatResponse",
    "ChatListDetail",
    "ChatListResponse",
    "ParticipantDetail",
    "MessageCreate",
    "MessageResponse",
    "ChatMessageListResponse"
    # User удален
]

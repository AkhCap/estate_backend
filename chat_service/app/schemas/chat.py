from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid

class MessageBase(BaseModel):
    content: Optional[str] = None
    attachments: Optional[List[dict]] = None

class MessageCreate(MessageBase):
    pass

class MessageResponse(MessageBase):
    id: str
    chat_id: str
    sender_id: int
    created_at: datetime
    is_read: bool
    message_type: Optional[str] = 'text'
    temp_id: Optional[str] = None

class ChatBase(BaseModel):
    property_id: int
    participants: List[int]

class ChatCreate(ChatBase):
    pass

class ChatResponse(ChatBase):
    id: str
    created_at: datetime
    updated_at: datetime
    is_archived: bool
    property_title: Optional[str] = None
    property_image: Optional[str] = None

class ChatListDetail(BaseModel):
    id: str
    property_id: int
    participants: List[int]
    created_at: datetime
    updated_at: datetime
    is_archived: bool
    property_title: Optional[str] = None
    property_image: Optional[str] = None
    participant_name: Optional[str] = None
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: Optional[int] = 0

class ChatListResponse(BaseModel):
    chats: List[ChatListDetail]
    total: int

class ChatMessageListResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    has_more: bool

class ParticipantDetail(BaseModel):
    id: int
    name: str
    email: str
    avatar: str
    lastSeen: str
    isOnline: bool

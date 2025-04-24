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

class ParticipantDetail(BaseModel):
    user_id: int
    username: str = ""
    full_name: str
    avatar_url: Optional[str] = None
    last_read_at: Optional[datetime] = None
    joined_at: Optional[datetime] = None

class ChatResponse(BaseModel):
    id: str
    property_id: int
    created_at: datetime
    updated_at: datetime
    is_archived: bool
    property_title: Optional[str] = None
    property_image: Optional[str] = None
    participants: List[ParticipantDetail]

class ChatListDetail(BaseModel):
    id: str
    property_id: int
    property_title: Optional[str] = None
    property_image: Optional[str] = None
    participants: List[ParticipantDetail]
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime
    is_archived: bool = False

class ChatListResponse(BaseModel):
    chats: List[ChatListDetail]
    total: Optional[int] = None

class ChatMessageListResponse(BaseModel):
    messages: List[MessageResponse]
    total: int
    has_more: bool

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class Message(BaseModel):
    id: str
    chat_id: str
    sender_id: int
    content: str
    created_at: datetime
    is_read: bool = False
    attachments: Optional[List[str]] = None

class Chat(BaseModel):
    id: str
    property_id: int
    participants: List[int]
    last_message: Optional[Message] = None
    created_at: datetime
    updated_at: datetime
    is_archived: bool = False

class ChatParticipant(BaseModel):
    user_id: int
    chat_id: str
    joined_at: datetime
    last_read_at: Optional[datetime] = None
    is_muted: bool = False

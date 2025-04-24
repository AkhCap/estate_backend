from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from app.db.base_class import Base

class Chat(Base):
    __tablename__ = "chats"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_archived = Column(Boolean, default=False)
    property_title = Column(String)
    property_image = Column(String)

    # Отношения
    participants = relationship("ChatParticipant", back_populates="chat")
    messages = relationship("Message", back_populates="chat")

class ChatParticipant(Base):
    __tablename__ = "chat_participants"

    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"), primary_key=True)
    user_id = Column(Integer, primary_key=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_read_at = Column(DateTime)
    is_visible = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    deleted_at = Column(DateTime, nullable=True)

    chat = relationship("Chat", back_populates="participants")

class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chat_id = Column(UUID(as_uuid=True), ForeignKey("chats.id"))
    sender_id = Column(Integer, nullable=False)
    content = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    message_type = Column(String, default="text")
    attachments = Column(JSON)

    chat = relationship("Chat", back_populates="messages")

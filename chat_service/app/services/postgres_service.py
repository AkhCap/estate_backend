from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import uuid
import logging
from sqlalchemy.orm import selectinload

from app.models.chat import Chat, ChatParticipant, Message
from app.schemas.chat import MessageResponse

logger = logging.getLogger(__name__)

class PostgresChatService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_chat(
        self,
        property_id: int,
        user_ids: List[int],
        property_title: Optional[str] = None,
        property_image: Optional[str] = None
    ) -> Chat:
        """Создает новый чат между пользователями для данного объекта недвижимости"""
        try:
            # Создаем новый чат
            chat = Chat(
                property_id=property_id,
                property_title=property_title,
                property_image=property_image,
                is_archived=False,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.db.add(chat)
            await self.db.flush()  # Получаем ID чата
            
            # Добавляем участников
            for i, user_id in enumerate(user_ids):
                participant = ChatParticipant(
                    chat_id=chat.id,
                    user_id=user_id,
                    is_visible=(i == 0)  # Только создатель чата видит его сразу
                )
                self.db.add(participant)
            
            await self.db.commit()
            await self.db.refresh(chat)
            return chat
        except Exception as e:
            await self.db.rollback()
            logger.exception(f"Error in create_chat: {e}")
            raise

    async def add_participant(self, chat_id: uuid.UUID, user_id: int) -> ChatParticipant:
        """Добавляет участника в чат"""
        participant = ChatParticipant(
            chat_id=chat_id,
            user_id=user_id
        )
        self.db.add(participant)
        await self.db.commit()
        await self.db.refresh(participant)
        return participant

    async def save_message(self, message_data: dict) -> Message:
        """Сохраняет сообщение в базу данных и делает чат видимым для всех участников"""
        try:
            # Проверяем, является ли created_at строкой или объектом datetime
            created_at = message_data["created_at"]
            if isinstance(created_at, str):
                # Если это строка, преобразуем ее в datetime с учетом UTC
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            elif isinstance(created_at, datetime):
                # Если это datetime, убеждаемся, что он имеет информацию о часовом поясе
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
            
            # Преобразуем в naive datetime перед сохранением
            naive_created_at = created_at.replace(tzinfo=None)
            
            message = Message(
                id=uuid.UUID(message_data["id"]),
                chat_id=uuid.UUID(message_data["chat_id"]),
                sender_id=int(message_data["sender_id"]),
                content=message_data["content"],
                message_type=message_data["message_type"],
                created_at=naive_created_at,  # Используем naive datetime
                is_read=message_data.get("is_read", False),
                attachments=message_data.get("attachments")
            )
            self.db.add(message)

            # Делаем чат видимым для всех участников
            chat_id = uuid.UUID(message_data["chat_id"])
            query = select(ChatParticipant).where(ChatParticipant.chat_id == chat_id)
            result = await self.db.execute(query)
            participants = result.scalars().all()
            
            for participant in participants:
                participant.is_visible = True
            
            await self.db.commit()
            await self.db.refresh(message)
            return message
        except Exception as e:
            await self.db.rollback()
            logger.error(f"Error saving message to PostgreSQL: {str(e)}")
            raise

    async def get_chat_messages(
        self,
        chat_id: uuid.UUID,
        limit: int = 50,
        offset: int = 0
    ) -> List[Message]:
        """Получает сообщения чата с пагинацией"""
        query = select(Message).where(
            Message.chat_id == chat_id
        ).order_by(
            Message.created_at.desc()
        ).offset(offset).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_chat_by_id(self, chat_id: uuid.UUID) -> Optional[Chat]:
        """Получает чат по ID"""
        query = select(Chat).where(Chat.id == chat_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_user_chats(self, user_id: int) -> List[Chat]:
        """Получает все видимые чаты пользователя"""
        query = select(Chat).join(
            ChatParticipant
        ).where(
            ChatParticipant.user_id == user_id,
            ChatParticipant.is_visible == True  # Добавляем условие видимости
        ).options(
            selectinload(Chat.participants)
        ).order_by(Chat.updated_at.desc())
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def mark_messages_as_read(self, chat_id: uuid.UUID, user_id: int) -> None:
        """Отмечает все сообщения в чате как прочитанные для указанного пользователя"""
        query = select(Message).where(
            Message.chat_id == chat_id,
            Message.sender_id != user_id,
            Message.is_read == False
        )
        result = await self.db.execute(query)
        messages = result.scalars().all()
        
        for message in messages:
            message.is_read = True
        
        await self.db.commit()

    async def update_chat_participant_last_read(
        self,
        chat_id: uuid.UUID,
        user_id: int,
        last_read_at: datetime
    ) -> None:
        """Обновляет время последнего прочтения для участника чата"""
        query = select(ChatParticipant).where(
            ChatParticipant.chat_id == chat_id,
            ChatParticipant.user_id == user_id
        )
        result = await self.db.execute(query)
        participant = result.scalar_one_or_none()
        
        if participant:
            participant.last_read_at = last_read_at
            await self.db.commit()

    async def get_existing_chat(self, property_id: int, user_ids: List[int]) -> Optional[Chat]:
        """Проверяет существование чата между пользователями для данного объекта недвижимости"""
        try:
            # Сначала получаем все чаты для данного объекта недвижимости
            query = select(Chat).where(
                Chat.property_id == property_id,
                Chat.is_archived == False
            )
            
            result = await self.db.execute(query)
            chats = result.scalars().all()
            
            # Проверяем каждый чат на соответствие участников
            for chat in chats:
                chat_user_ids = {p.user_id for p in chat.participants}
                if chat_user_ids == set(user_ids):
                    return chat
                    
            return None
        except Exception as e:
            logger.exception(f"Error in get_existing_chat: {e}")
            return None

    async def get_chat(self, chat_id: str) -> Optional[Chat]:
        """Получает чат по строковому ID"""
        try:
            chat_uuid = uuid.UUID(chat_id)
            query = select(Chat).where(Chat.id == chat_uuid)
            result = await self.db.execute(query)
            return result.scalar_one_or_none()
        except ValueError:
            logger.error(f"Invalid chat_id format: {chat_id}")
            return None
        except Exception as e:
            logger.exception(f"Error getting chat {chat_id}: {e}")
            return None

    async def get_chat_participants(self, chat_id: uuid.UUID) -> List[Dict[str, Any]]:
        """Получает список участников чата"""
        try:
            # Получаем чат
            chat = await self.get_chat_by_id(chat_id)
            if not chat:
                logger.warning(f"Chat {chat_id} not found")
                return []

            # Получаем всех участников
            participants = []
            for participant in chat.participants:
                participants.append({
                    "id": str(participant.user_id),
                    "joined_at": participant.joined_at.isoformat() if participant.joined_at else None,
                    "last_read_at": participant.last_read_at.isoformat() if participant.last_read_at else None
                })

            return participants
        except Exception as e:
            logger.exception(f"Error getting chat participants: {e}")
            return []

    async def delete_chat(self, chat_id: uuid.UUID, user_id: int) -> bool:
        """
        Мягкое удаление чата для конкретного пользователя.
        Если все участники удалили чат - полное удаление.
        """
        try:
            # Получаем чат и проверяем существование
            chat = await self.get_chat_by_id(chat_id)
            if not chat:
                logger.warning(f"Chat {chat_id} not found for deletion")
                return False

            # Получаем всех участников чата
            participants_query = select(ChatParticipant).where(ChatParticipant.chat_id == chat_id)
            result = await self.db.execute(participants_query)
            participants = result.scalars().all()

            # Проверяем, является ли пользователь участником
            user_participant = next((p for p in participants if p.user_id == user_id), None)
            if not user_participant:
                logger.warning(f"User {user_id} is not a participant of chat {chat_id}")
                return False

            # Помечаем чат как удаленный для пользователя
            user_participant.is_deleted = True
            user_participant.is_visible = False
            user_participant.deleted_at = datetime.utcnow()

            # Проверяем, все ли участники удалили чат
            all_deleted = all(p.is_deleted for p in participants)

            if all_deleted:
                # Если все удалили - удаляем полностью
                logger.info(f"All participants deleted chat {chat_id}, performing full deletion")
                
                # Удаляем все сообщения
                await self.db.execute(
                    delete(Message).where(Message.chat_id == chat_id)
                )

                # Удаляем всех участников
                await self.db.execute(
                    delete(ChatParticipant).where(ChatParticipant.chat_id == chat_id)
                )

                # Удаляем сам чат
                await self.db.execute(
                    delete(Chat).where(Chat.id == chat_id)
                )
            else:
                logger.info(f"Chat {chat_id} marked as deleted for user {user_id}")

            await self.db.commit()
            return True

        except Exception as e:
            await self.db.rollback()
            logger.exception(f"Error in delete_chat: {e}")
            return False

    async def restore_chat(self, chat_id: uuid.UUID, user_id: int) -> bool:
        """
        Восстанавливает чат для пользователя после удаления
        """
        try:
            # Получаем запись участника
            query = select(ChatParticipant).where(
                ChatParticipant.chat_id == chat_id,
                ChatParticipant.user_id == user_id
            )
            result = await self.db.execute(query)
            participant = result.scalar_one_or_none()

            if not participant:
                logger.warning(f"Participant record not found for chat {chat_id} and user {user_id}")
                return False

            # Восстанавливаем видимость
            participant.is_deleted = False
            participant.is_visible = True
            participant.deleted_at = None

            await self.db.commit()
            logger.info(f"Chat {chat_id} restored for user {user_id}")
            return True

        except Exception as e:
            await self.db.rollback()
            logger.exception(f"Error in restore_chat: {e}")
            return False

    async def get_chat_messages_after_deletion(self, chat_id: uuid.UUID, user_id: int) -> List[Message]:
        """
        Получает сообщения чата, отправленные после удаления пользователем
        """
        try:
            # Получаем время удаления
            query = select(ChatParticipant).where(
                ChatParticipant.chat_id == chat_id,
                ChatParticipant.user_id == user_id
            )
            result = await self.db.execute(query)
            participant = result.scalar_one_or_none()

            if not participant or not participant.deleted_at:
                # Если чат не был удален, возвращаем все сообщения
                query = select(Message).where(Message.chat_id == chat_id)
            else:
                # Возвращаем только сообщения после удаления
                query = select(Message).where(
                    Message.chat_id == chat_id,
                    Message.created_at > participant.deleted_at
                )

            result = await self.db.execute(query)
            return result.scalars().all()

        except Exception as e:
            logger.exception(f"Error in get_chat_messages_after_deletion: {e}")
            return [] 
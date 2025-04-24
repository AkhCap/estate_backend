from typing import AsyncGenerator
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.postgres_service import PostgresChatService

async def get_postgres_chat_service(
    db: AsyncSession = Depends(get_db)
) -> AsyncGenerator[PostgresChatService, None]:
    """
    Зависимость для получения экземпляра PostgresChatService.
    Автоматически создает и закрывает сессию базы данных.
    """
    service = PostgresChatService(db)
    try:
        yield service
    finally:
        await db.close() 
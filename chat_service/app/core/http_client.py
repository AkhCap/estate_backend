import httpx
from app.core.config import settings

http_client = httpx.AsyncClient(base_url=settings.MAIN_API_URL) 
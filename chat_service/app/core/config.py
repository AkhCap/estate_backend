from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # Основные настройки
    PROJECT_NAME: str = "Chat Service"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Настройки Redis
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    
    # Настройки JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Настройки CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:8001",
        "http://127.0.0.1:8001"
    ]
    
    # Настройки WebSocket
    SOCKETIO_PATH: str = "/socket.io"
    
    # Main API URL for token validation
    MAIN_API_URL: str = os.getenv("MAIN_API_URL", "http://localhost:8000")
    
    class Config:
        case_sensitive = True

settings = Settings()

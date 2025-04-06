from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio
import logging
from app.core.config import settings
from app.routes import chat, uploads
from app import sio  # Импортируем sio из модуля __init__

# Настройка логирования
logging.basicConfig(level=logging.INFO)
# Устанавливаем уровень WARNING для шумных библиотек WebSocket
logging.getLogger("engineio").setLevel(logging.WARNING)
logging.getLogger("socketio").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)

# Инициализация FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Настройка CORS
origins = [
    "http://localhost:3000", # React frontend
    # Добавьте другие origins при необходимости
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # Разрешенные источники
    allow_credentials=True,    # Разрешить cookies
    allow_methods=["*"],         # Разрешить все методы (GET, POST, etc.)
    allow_headers=["*"],         # Разрешить все заголовки
)

# Подключение роутеров API
app.include_router(chat.router)
app.include_router(uploads.router)

# Добавляем тестовый роут для проверки
@app.get("/")
async def root():
    return {"message": "Chat service is running"}

logger.info("Chat service initialized with routes:")
for route in app.routes:
    logger.info(f"Route: {route.path} [{route.methods}]")

# Создание ASGI приложения путем добавления Socket.IO к FastAPI
# Это позволяет обрабатывать как HTTP запросы через FastAPI, так и Socket.IO соединения
asgi_app = socketio.ASGIApp(
    sio,
    app,
    socketio_path="socket.io"  # Путь должен соответствовать настройкам в клиенте
)

# Для запуска через Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(asgi_app, host="0.0.0.0", port=8001)

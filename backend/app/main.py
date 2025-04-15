import os
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import users, properties, favorites, history, uploads, user_reviews
from app.database import Base, engine, SessionLocal
from app import crud

# Создаем таблицы в базе данных
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Estate - Сервис недвижимости",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Создаем директории для загрузок, если их нет
os.makedirs("uploads/properties", exist_ok=True)
os.makedirs("uploads/avatars", exist_ok=True)

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Разрешаем запросы с фронтенда
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все HTTP методы
    allow_headers=["*"],  # Разрешаем все заголовки
    expose_headers=["*"]  # Разрешаем доступ ко всем заголовкам в ответе
)

# Монтируем статические файлы
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Подключаем роуты
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(properties.router, prefix="/properties", tags=["properties"])
app.include_router(favorites.router, prefix="/favorites", tags=["favorites"])
app.include_router(history.router, prefix="/history", tags=["history"])
app.include_router(uploads.router, prefix="/uploads", tags=["uploads"])
app.include_router(user_reviews.router, prefix="/reviews", tags=["reviews"])

# Добавляем обработчик ошибок
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    print(f"Global error handler caught: {exc}")  # Логируем ошибку
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)}
    )

@app.get("/")
def read_root():
    return {"message": "Добро пожаловать в Estate!"}

@app.on_event("startup")
async def startup_event():
    # Обновляем существующие записи изображений
    db = SessionLocal()
    try:
        crud.update_existing_images(db)
    finally:
        db.close()

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version="1.0.0",
        description="Custom API schema with security definitions",
        routes=app.routes,
    )

    openapi_schema["components"]["securitySchemes"] = {
        "OAuth2PasswordBearer": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "users/login",
                    "scopes": {}
                }
            }
        }
    }

    # Применяем авторизацию к защищенным маршрутам
    protected_routes = [
        ("users/me", ["get"]),
        ("users/me/properties", ["get"]),
        ("favorites", ["get", "post", "delete"]),
        ("properties", ["post", "put", "delete"]),
        ("history", ["get", "post", "delete"])
    ]

    for path, methods in openapi_schema["paths"].items():
        for method_type, method in methods.items():
            for route, route_methods in protected_routes:
                if path.startswith(f"/{route}") and method_type in route_methods:
                    method["security"] = [{"OAuth2PasswordBearer": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
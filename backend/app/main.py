import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routes import users, properties, favorites, reviews, history, uploads
from app.database import Base, engine

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

# Подключаем статические файлы
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Настраиваем CORS
origins = [
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Подключаем роутеры
app.include_router(users.router, prefix="/users", tags=["Пользователи"])
app.include_router(properties.router, prefix="/properties", tags=["Объявления"])
app.include_router(favorites.router, prefix="/favorites", tags=["Избранное"])
app.include_router(reviews.router, prefix="/reviews", tags=["Отзывы"])
app.include_router(history.router, prefix="/users/me/history", tags=["История"])
app.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])

@app.get("/uploads/{file_name}")
async def get_file(file_name: str):
    file_path = os.path.join("uploads", file_name)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")

@app.get("/")
def read_root():
    return {"message": "Добро пожаловать в Estate!"}

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
        ("favorites", ["post", "delete"]),
        ("properties", ["post", "put", "delete"]),
        ("reviews", ["post"]),
    ]

    for path, methods in openapi_schema["paths"].items():
        for method_type, method in methods.items():
            for route, route_methods in protected_routes:
                if path.startswith(f"/{route}") and method_type in route_methods:
                    method["security"] = [{"OAuth2PasswordBearer": []}]

    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
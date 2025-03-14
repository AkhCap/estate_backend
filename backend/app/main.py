# app/main.py
from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, properties, favorites, reviews, history, uploads

app = FastAPI(
    title="Estate - Сервис недвижимости",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Настройка CORS – убедитесь, что origin соответствует вашему фронтенду
origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # или ["*"] для разрешения всем, но лучше ограничить
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(users.router, prefix="/users", tags=["Пользователи"])
app.include_router(properties.router, prefix="/properties", tags=["Объявления"])
app.include_router(favorites.router, prefix="/favorites", tags=["Избранное"])
app.include_router(reviews.router, prefix="/reviews", tags=["Отзывы"])
app.include_router(history.router, prefix="/history", tags=["История"])
app.include_router(uploads.router, prefix="", tags=["Uploads"])
#app.include_router(uploads.router, prefix="/uploads", tags=["Uploads"])
# Добавляем корневой маршрут
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
                    "tokenUrl": "/users/login",
                    "scopes": {}
                }
            }
        }
    }

    # Применяем авторизацию к защищенным маршрутам
    protected_routes = [
        ("/users/me", ["get"]),
        ("/users/me/properties", ["get"]),
        ("/favorites/", ["post", "delete"]),
        ("/properties/", ["post", "put", "delete"]),
        ("/reviews/", ["post"]),
    ]

    for path, methods in openapi_schema["paths"].items():
        for method_type, method in methods.items():
            for route, route_methods in protected_routes:
                if path.startswith(route) and method_type in route_methods:
                    method["security"] = [{"OAuth2PasswordBearer": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
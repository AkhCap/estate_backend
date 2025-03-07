from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from app.routes import users, properties, favorites, reviews

app = FastAPI(
    title="Estate - Сервис недвижимости",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Подключаем роутеры
app.include_router(users.router, prefix="/users", tags=["Пользователи"])
app.include_router(properties.router, prefix="/properties", tags=["Объявления"])
app.include_router(favorites.router, prefix="/favorites", tags=["Избранное"])
app.include_router(reviews.router, prefix="/reviews", tags=["Отзывы"])


@app.get("/")
def read_root():
    return {"message": "Добро пожаловать в Estate!"}

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
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

    # Маршруты, которые должны требовать авторизацию
    protected_routes = [
        ("/users/me", ["get"]),
        ("/users/me/properties", ["get"]),
        ("/favorites/", ["post", "delete"]),
        ("/properties/", ["post", "put", "delete"]),
        ("/reviews/", ["post"]),
    ]

    for path, methods in openapi_schema["paths"].items():
        for method_type, method in methods.items():
            # Если путь и метод совпадают с защищенными маршрутами – добавляем авторизацию
            if any(path.startswith(route) and method_type in methods for route, methods in protected_routes):
                method["security"] = [{"OAuth2PasswordBearer": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi
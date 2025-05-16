from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SQLALCHEMY_DATABASE_URI: str = "postgresql://aminjon:aminjon1@localhost/estate_bd"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0

settings = Settings() 
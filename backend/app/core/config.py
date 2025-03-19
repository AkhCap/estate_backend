from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SQLALCHEMY_DATABASE_URI: str = "postgresql://aminjon:aminjon1@localhost/estate_bd"

settings = Settings() 
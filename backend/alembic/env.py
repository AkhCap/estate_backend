import os
from dotenv import load_dotenv  # Импорт dotenv для загрузки переменных окружения
from logging.config import fileConfig
from sqlalchemy import create_engine, pool
from app.database import Base  # Убедись, что путь к базе верный
from alembic import context

# Загружаем переменные окружения из .env
load_dotenv()

# Alembic Config object, который предоставляет доступ к настройкам
config = context.config

# Получаем строку подключения к БД из .env или из alembic.ini
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    DATABASE_URL = config.get_main_option("sqlalchemy.url")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL не найден в переменных окружения или в alembic.ini! Пожалуйста, настройте подключение к базе данных.")

# Устанавливаем URL в конфигурацию
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Настройка логирования, если файл конфигурации существует
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Добавляем метаданные моделей для поддержки autogenerate
# Убедись, что Base.metadata содержит все модели
target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Запуск миграций в оффлайн-режиме."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Запуск миграций в онлайн-режиме."""
    connectable = create_engine(
        config.get_main_option("sqlalchemy.url"), 
        poolclass=pool.NullPool
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

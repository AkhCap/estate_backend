# Estate Backend

Проект для управления недвижимостью, построенный на FastAPI и Next.js.

## Структура проекта

```
estate_backend/
├── backend/                 # Backend на FastAPI
│   ├── app/                # Основной код приложения
│   ├── alembic/            # Миграции базы данных
│   ├── uploads/            # Загруженные файлы
│   ├── requirements.txt    # Python зависимости
│   ├── Dockerfile         # Конфигурация Docker
│   └── docker-compose.yml # Docker Compose конфигурация
│
├── frontend/               # Frontend на Next.js
│   ├── app/               # Основной код приложения
│   ├── public/            # Статические файлы
│   └── package.json       # Node.js зависимости
│
└── .gitignore            # Git ignore файл
```

## Технологии

### Backend
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic (миграции)
- Docker

### Frontend
- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Axios

## Установка и запуск

### Backend

1. Установите зависимости:
```bash
cd backend
pip install -r requirements.txt
```

2. Запустите сервер:
```bash
uvicorn app.main:app --reload
```

### Frontend

1. Установите зависимости:
```bash
cd frontend
npm install
```

2. Запустите сервер разработки:
```bash
npm run dev
```

## Docker

Для запуска с помощью Docker:

```bash
cd backend
docker-compose up --build
```

## API Документация

После запуска бэкенда, документация API доступна по адресам:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Разработка

- Backend API доступен на http://localhost:8000
- Frontend доступен на http://localhost:3000 
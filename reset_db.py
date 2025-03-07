from app.database import engine, Base

print("Удаляем все таблицы...")
Base.metadata.drop_all(bind=engine)
print("Создаем таблицы заново...")
Base.metadata.create_all(bind=engine)
print("База данных обновлена!")
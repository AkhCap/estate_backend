from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app import schemas, crud, auth
from app.database import SessionLocal
import os
import uuid


router = APIRouter()

# Функция для получения сессии базы данных
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Эндпоинт для создания объявления (с аутентификацией)
@router.post("/", response_model=schemas.PropertyOut)
def create_property(
    property: schemas.PropertyCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    # Здесь current_user — это email пользователя, полученный из JWT.
    # Получаем пользователя по email, чтобы узнать его id.
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return crud.create_property(db=db, property=property, owner_id=user.id)

# Альтернативный эндпоинт для создания объявления без аутентификации (для тестирования)
@router.post("/test", response_model=schemas.PropertyOut)
def create_property_test(property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    owner_id = 1  # Фиктивное значение, когда аутентификация не используется
    return crud.create_property(db=db, property=property, owner_id=owner_id)

# Эндпоинт для получения списка объявлений (без аутентификации)
@router.get("/", response_model=List[schemas.PropertyOut])
def read_properties(
    skip: int = 0,
    limit: int = 10,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    search: Optional[str] = None,
    rooms: Optional[int] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    floor: Optional[int] = None,
    property_type: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: Optional[str] = "asc",
    db: Session = Depends(get_db)
):
    return crud.get_properties(
        db,
        skip=skip,
        limit=limit,
        min_price=min_price,
        max_price=max_price,
        search=search,
        rooms=rooms,
        min_area=min_area,
        max_area=max_area,
        floor=floor,
        property_type=property_type,
        sort_by=sort_by,
        sort_order=sort_order
    )

# Эндпоинт для получения конкретного объявления (без аутентификации)
@router.get("/{property_id}", response_model=schemas.PropertyOut)
def read_property(property_id: int, db: Session = Depends(get_db)):
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return db_property

# Эндпоинт для обновления объявления (с аутентификацией)
@router.put("/{property_id}", response_model=schemas.PropertyOut)
def update_property(
    property_id: int, 
    property_update: schemas.PropertyUpdate, 
    db: Session = Depends(get_db), 
    current_user: str = Depends(auth.get_current_user)
):
    db_property = crud.get_property(db, property_id=property_id)
    if not db_property:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    user = crud.get_user_by_email(db, email=current_user)
    if db_property.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Нет прав для изменения объявления")
    updated_property = crud.update_property(db, property_id, property_update)
    if updated_property is None:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return updated_property

# Эндпоинт для удаления объявления (с аутентификацией)
@router.delete("/{property_id}", response_model=schemas.PropertyOut)
def delete_property(
    property_id: int, 
    db: Session = Depends(get_db), 
    current_user: str = Depends(auth.get_current_user)
):
    db_property = crud.get_property(db, property_id=property_id)
    if not db_property:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    user = crud.get_user_by_email(db, email=current_user)
    if db_property.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Нет прав для удаления объявления")
    deleted_property = crud.delete_property(db, property_id)
    return deleted_property

# Пример эндпоинта для загрузки изображения
@router.post("/{property_id}/upload-image", response_model=schemas.PropertyOut)
async def upload_property_image(
    property_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    # Найдем объявление
    db_property = crud.get_property(db, property_id=property_id)
    if not db_property:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    # Проверим, что текущий пользователь является владельцем
    user = crud.get_user_by_email(db, email=current_user)
    if db_property.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Нет прав для загрузки изображения")

    # Определим путь для сохранения файла
    uploads_dir = "uploads"
    if not os.path.exists(uploads_dir):
        os.makedirs(uploads_dir)
    
    # Создадим уникальное имя файла
    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(uploads_dir, unique_filename)
    
    # Сохраним файл
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Обновим свойство объявления: установим image_url (для простоты будем возвращать путь относительно корня)
    db_property.image_url = "/" + file_path.replace("\\", "/")
    db.commit()
    db.refresh(db_property)
    
    return db_property
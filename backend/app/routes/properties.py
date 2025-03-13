from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app import schemas, crud, auth, models
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


# Эндпоинт для создания объявления (с аутентификацией и проверкой ролей)
@router.post("/", response_model=schemas.PropertyOut)
def create_property(
    property: schemas.PropertyCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Проверка ролей
    if user.role == models.UserRoleEnum.DEVELOPER and property.property_type == "secondary":
        raise HTTPException(status_code=403, detail="Застройщики могут публиковать только новостройки.")

    return crud.create_property(db=db, property=property, owner_id=user.id)


# Эндпоинт для тестового создания объявления (без аутентификации)
@router.post("/test", response_model=schemas.PropertyOut)
def create_property_test(property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    owner_id = 1  # Фиксированное значение, если нет аутентификации
    created_property = crud.create_property(db=db, property=property, owner_id=owner_id)
    return schemas.PropertyOut.model_validate(created_property)


# Эндпоинт для получения списка объявлений
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
    properties = crud.get_properties(
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
    return [schemas.PropertyOut.model_validate(prop) for prop in properties]


# Эндпоинт для получения конкретного объявления
@router.get("/{property_id}", response_model=schemas.PropertyOut)
def read_property(property_id: int, db: Session = Depends(get_db)):
    db_property = crud.get_property(db, property_id=property_id)
    if db_property is None:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return schemas.PropertyOut.model_validate(db_property)


# Эндпоинт для обновления объявления
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
    return schemas.PropertyOut.model_validate(updated_property)


# Эндпоинт для удаления объявления
@router.delete("/properties/{property_id}", response_model=dict)
def delete_property_endpoint(
    property_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    property = crud.get_property(db, property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    # Проверка владельца (если требуется)
    user = crud.get_user_by_email(db, email=current_user)
    if property.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа для удаления объявления")
    
    deleted_property = crud.delete_property(db, property_id)
    if not deleted_property:
        raise HTTPException(status_code=400, detail="Ошибка удаления объявления")
    
    return {"detail": "Объявление успешно удалено"}


# Эндпоинт для загрузки изображения
@router.post("/{property_id}/upload-images", response_model=schemas.PropertyOut)
async def upload_property_images(
    property_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    db_property = crud.get_property(db, property_id=property_id)
    if not db_property:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    user = crud.get_user_by_email(db, email=current_user)
    if db_property.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Нет прав для загрузки изображений")
    
    # Папка для изображений объявлений
    uploads_dir = "uploads/properties"
    os.makedirs(uploads_dir, exist_ok=True)

    for file in files:
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(uploads_dir, unique_filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        # Формируем URL, если вы отдаёте файлы через endpoint /uploads/...
        image_url = f"/uploads/properties/{unique_filename}"
        crud.add_property_image(db, property_id, image_url)
    
    db.commit()
    db.refresh(db_property)
    # При необходимости, можно дополнить PropertyOut, чтобы он возвращал images
    return schemas.PropertyOut.model_validate(db_property)
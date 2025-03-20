from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Property, PropertyImage
from app import crud, auth
import shutil
import os
from typing import List
from datetime import datetime
import uuid

# Импортируем Pydantic-схемы
from app.schemas import PropertyCreate, PropertyOut, PropertyImageOut

router = APIRouter()

# Путь для сохранения изображений
UPLOAD_DIR = "uploads/properties"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/", response_model=List[PropertyOut])
async def get_properties(db: Session = Depends(get_db)):
    try:
        properties = db.query(Property).all()
        return [PropertyOut.model_validate(prop) for prop in properties]
    except Exception as e:
        print(f"Error getting properties: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=PropertyOut)
async def create_property(
    property_data: PropertyCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    property_dict = property_data.model_dump()
    property_dict["owner_id"] = user.id
    property_dict["created_at"] = datetime.utcnow()
    new_property = Property(**property_dict)
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    return PropertyOut.model_validate(new_property)

@router.get("/{property_id}", response_model=PropertyOut)
async def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return PropertyOut.model_validate(prop)

@router.put("/{property_id}", response_model=PropertyOut)
async def update_property(property_id: int, property_data: PropertyCreate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    for key, value in property_data.model_dump(exclude_unset=True).items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    return PropertyOut.model_validate(prop)

@router.delete("/{property_id}")
async def delete_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    db.delete(prop)
    db.commit()
    return {"message": "Объявление удалено", "property_id": property_id}

@router.post("/{property_id}/upload-images", response_model=dict)
async def upload_images(
    property_id: int, 
    files: List[UploadFile] = File(...), 
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    # Проверяем существование объявления
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    # Проверяем права пользователя
    user = crud.get_user_by_email(db, email=current_user)
    if not user or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Нет прав для загрузки изображений")

    uploaded_files = []
    for file in files:
        # Проверяем расширение файла
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ['.jpg', '.jpeg', '.png', '.gif']:
            raise HTTPException(status_code=400, detail="Неподдерживаемый формат файла")

        # Создаем уникальное имя файла
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        try:
            # Сохраняем файл
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Создаем запись в базе данных
            new_image = PropertyImage(property_id=property_id, image_url=unique_filename)
            db.add(new_image)
            db.commit()
            db.refresh(new_image)
            
            uploaded_files.append({
                "id": new_image.id,
                "image_url": new_image.image_url
            })
        except Exception as e:
            # Если что-то пошло не так, удаляем файл если он был создан
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Ошибка при загрузке файла: {str(e)}")

    return {
        "message": "Изображения успешно загружены",
        "property_id": property_id,
        "files": uploaded_files
    }
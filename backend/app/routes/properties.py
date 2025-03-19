from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Property, PropertyImage
from app import crud, auth
import shutil
import os
from typing import List

# Импортируем Pydantic-схемы
from app.schemas import PropertyCreate, PropertyOut, PropertyImageOut

router = APIRouter()

# Путь для сохранения изображений
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/", response_model=List[PropertyOut])
async def get_properties(db: Session = Depends(get_db)):
    try:
        properties = db.query(Property).all()
        return properties
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
    
    property_dict = property_data.dict()
    property_dict["owner_id"] = user.id
    new_property = Property(**property_dict)
    db.add(new_property)
    db.commit()
    db.refresh(new_property)
    return new_property

@router.get("/{property_id}", response_model=PropertyOut)
async def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    return prop

@router.put("/{property_id}", response_model=PropertyOut)
async def update_property(property_id: int, property_data: PropertyCreate, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    for key, value in property_data.dict(exclude_unset=True).items():
        setattr(prop, key, value)
    db.commit()
    db.refresh(prop)
    return prop

@router.delete("/{property_id}")
async def delete_property(property_id: int, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    db.delete(prop)
    db.commit()
    return {"message": "Объявление удалено", "property_id": property_id}

@router.post("/{property_id}/upload-images", response_model=dict, tags=["Properties"])
async def upload_images(property_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    uploaded_files = []
    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        new_image = PropertyImage(property_id=property_id, image_url=f"/uploads/{file.filename}")
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        uploaded_files.append({"id": new_image.id, "image_url": new_image.image_url})

    return {"message": "Изображения загружены", "property_id": property_id, "files": uploaded_files}
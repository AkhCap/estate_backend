from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Property, PropertyImage, PropertyViews
from app import crud, auth, models
import shutil
import os
from typing import List, Optional
from datetime import datetime
import uuid

# Импортируем Pydantic-схемы
from app.schemas import PropertyCreate, PropertyOut, PropertyImageOut, HistoryCreate, PropertyUpdate

router = APIRouter()

# Путь для сохранения изображений
UPLOAD_DIR = "uploads/properties"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.get("/list", response_model=List[PropertyOut])
async def get_properties_list(
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_optional_current_user),
    limit: Optional[int] = None,
    include_viewed: bool = False
):
    """
    Получение списка объявлений.
    Доступно без аутентификации.
    """
    try:
        print("Starting get_properties_list function")
        user_id = None
        if current_user:
            print(f"Current user: {current_user}")
            user = crud.get_user_by_email(db, email=current_user)
            if user:
                user_id = user.id
                print(f"User ID: {user_id}")
        
        print("Querying properties")
        query = db.query(Property).options(
            joinedload(Property.images),
            joinedload(Property.price_history)
        )
        
        if limit:
            print(f"Applying limit: {limit}")
            query = query.limit(limit)
        
        properties = query.all()
        print(f"Found {len(properties)} properties")
        
        for prop in properties:
            # По умолчанию устанавливаем is_viewed в False
            prop.is_viewed = False
            
            if user_id and include_viewed:
                print(f"Checking if property {prop.id} is viewed by user {user_id}")
                # Используем функцию is_property_viewed, которая проверяет:
                # 1. Пользователь не является владельцем
                # 2. Есть запись в таблице property_views
                prop.is_viewed = crud.is_property_viewed(db, user_id, prop.id)
        
        print("Converting properties to response model")
        result = [PropertyOut.model_validate(prop) for prop in properties]
        print("Successfully converted properties")
        return result
    except Exception as e:
        print(f"Error in get_properties_list: {str(e)}")
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
async def get_property(
    property_id: str, 
    is_detail_view: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[str] = Depends(auth.get_optional_current_user)
):
    """
    Получение детальной информации об объявлении.
    Доступно без аутентификации, но запись в историю создается только для авторизованных пользователей
    и только при просмотре детальной страницы (is_detail_view=True).
    """
    user_id = None
    if current_user:
        user = crud.get_user_by_email(db, email=current_user)
        if user:
            user_id = user.id
    
    # Загружаем объявление со всеми связанными данными, включая владельца
    prop = db.query(Property).options(
        joinedload(Property.images),
        joinedload(Property.price_history),
        joinedload(Property.owner)
    ).filter(Property.id == property_id).first()
    
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")
    
    # По умолчанию устанавливаем is_viewed в False
    prop.is_viewed = False
    
    # Добавляем информацию о просмотре только если:
    # 1. Пользователь авторизован (user_id не None)
    # 2. Пользователь не является владельцем объявления
    if user_id and prop.owner_id != user_id:
        view = db.query(models.PropertyViews).filter(
            models.PropertyViews.user_id == user_id,
            models.PropertyViews.property_id == property_id
        ).first()
        prop.is_viewed = view is not None
    
    # Создаем запись в истории и добавляем просмотр только если:
    # 1. Это просмотр детальной страницы
    # 2. Пользователь авторизован
    # 3. Пользователь не является владельцем объявления
    if is_detail_view and user_id and prop.owner_id != user_id:
        crud.create_history(db, HistoryCreate(property_id=property_id), user_id)
        crud.add_property_view(db, user_id, property_id)
    
    return PropertyOut.model_validate(prop)

@router.put("/{property_id}", response_model=PropertyOut)
async def update_property(
    property_id: int, 
    property_data: PropertyUpdate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """
    Обновление объявления по ID.
    Требует аутентификации и прав владельца объявления.
    """
    try:
        print(f"Получен запрос на обновление объявления {property_id}")
        # Получаем текущего пользователя
        user = crud.get_user_by_email(db, email=current_user)
        if not user:
            print(f"Пользователь {current_user} не найден")
            raise HTTPException(status_code=404, detail="Пользователь не найден")

        # Получаем текущее объявление
        property = crud.get_property(db, property_id)
        if not property:
            print(f"Объявление {property_id} не найдено")
            raise HTTPException(status_code=404, detail="Объявление не найдено")

        # Проверяем права пользователя
        if property.owner_id != user.id:
            print(f"Пользователь {user.id} не имеет прав на редактирование объявления {property_id}")
            raise HTTPException(status_code=403, detail="Нет прав для редактирования этого объявления")

        # Обновляем объявление
        updated_property = crud.update_property(db, property_id, property_data)
        if not updated_property:
            print(f"Не удалось обновить объявление {property_id}")
            raise HTTPException(status_code=404, detail="Объявление не найдено")
        
        print(f"Объявление {property_id} успешно обновлено")
        return updated_property
    except HTTPException as he:
        print(f"HTTP ошибка при обновлении объявления: {he.detail}")
        raise he
    except Exception as e:
        print(f"Неожиданная ошибка при обновлении объявления: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

@router.get("/{property_id}/images", response_model=List[PropertyImageOut])
async def get_property_images(
    property_id: int,
    db: Session = Depends(get_db)
):
    """
    Получение списка фотографий объявления.
    Доступно без аутентификации.
    """
    images = crud.get_property_images(db, property_id)
    return [PropertyImageOut.model_validate(img) for img in images]

@router.delete("/{property_id}/images/{image_id}")
async def delete_property_image(
    property_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    """
    Удаление фотографии объявления.
    Требует аутентификации и прав владельца объявления.
    """
    # Проверяем существование объявления
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Объявление не найдено")

    # Проверяем права пользователя
    user = crud.get_user_by_email(db, email=current_user)
    if not user or prop.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Нет прав для удаления изображения")

    # Получаем изображение
    image = db.query(PropertyImage).filter(
        PropertyImage.id == image_id,
        PropertyImage.property_id == property_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Изображение не найдено")

    try:
        # Удаляем файл
        file_path = os.path.join(UPLOAD_DIR, image.image_url)
        if os.path.exists(file_path):
            os.remove(file_path)

        # Удаляем запись из базы данных
        db.delete(image)
        db.commit()

        return {"message": "Изображение успешно удалено"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении изображения: {str(e)}")
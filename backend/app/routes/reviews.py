from fastapi import APIRouter, Depends, Query, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
from app import schemas, crud, auth, models
from app.database import SessionLocal, get_db
import os
import uuid

router = APIRouter()

# Эндпоинт для создания объявления (с аутентификацией)
@router.post("/", response_model=schemas.PropertyOut)
def create_property(
    property: schemas.PropertyCreate, 
    db: Session = Depends(get_db),
    current_user: str = Depends(auth.get_current_user)
):
    user = crud.get_user_by_email(db, email=current_user)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    # Проверка ролей (пример проверки)
    if user.role == models.UserRoleEnum.DEVELOPER and property.property_type == "secondary":
        raise HTTPException(status_code=403, detail="Застройщики могут публиковать только новостройки.")
    return crud.create_property(db=db, property=property, owner_id=user.id)

# Эндпоинт для тестового создания объявления (без аутентификации)
@router.post("/test", response_model=schemas.PropertyOut)
def create_property_test(property: schemas.PropertyCreate, db: Session = Depends(get_db)):
    owner_id = 1  # Фиксированное значение, если нет аутентификации
    created_property = crud.create_property(db=db, property=property, owner_id=owner_id)
    return schemas.PropertyOut.model_validate(created_property)

# Эндпоинт для получения списка объявлений с фильтрами (новые фильтры добавлены)
@router.get("/", response_model=List[schemas.PropertyOut])
def read_properties(
    skip: int = 0,
    limit: int = 10,
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    rooms: Optional[str] = Query(None),
    min_area: Optional[float] = Query(None),
    max_area: Optional[float] = Query(None),
    floor: Optional[int] = Query(None),
    property_type: Optional[str] = Query(None),
    deal_type: Optional[str] = Query(None),
    # Новые фильтры:
    propertyCondition: Optional[str] = Query(None),
    hasBalcony: Optional[bool] = Query(None),
    prepayment: Optional[str] = Query(None),
    min_deposit: Optional[float] = Query(None),
    max_deposit: Optional[float] = Query(None),
    sort_by: Optional[str] = Query(None),
    sort_order: Optional[str] = Query("asc"),
    db: Session = Depends(get_db)
):
    props = crud.get_properties(
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
        deal_type=deal_type,
        propertyCondition=propertyCondition,
        hasBalcony=hasBalcony,
        prepayment=prepayment,
        min_deposit=min_deposit,
        max_deposit=max_deposit,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return [schemas.PropertyOut.model_validate(p) for p in props]

# Эндпоинт для получения конкретного объявления
@router.get("/{property_id}", response_model=schemas.PropertyOut)
def read_property(property_id: int, db: Session = Depends(get_db)):
    db_property = (
        db.query(models.Property)
        .options(selectinload(models.Property.images))
        .filter(models.Property.id == property_id)
        .first()
    )
    if not db_property:
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
    
    user = crud.get_user_by_email(db, email=current_user)
    if property.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Нет доступа для удаления объявления")
    
    deleted_property = crud.delete_property(db, property_id)
    if not deleted_property:
        raise HTTPException(status_code=400, detail="Ошибка удаления объявления")
    
    return {"detail": "Объявление успешно удалено"}

# Эндпоинт для загрузки изображений
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
    
    uploads_dir = "uploads/properties"
    os.makedirs(uploads_dir, exist_ok=True)

    for file in files:
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(uploads_dir, unique_filename)
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        image_url = f"/uploads/properties/{unique_filename}"
        crud.add_property_image(db, property_id, image_url)
    
    db.commit()
    db.refresh(db_property)
    return schemas.PropertyOut.model_validate(db_property)
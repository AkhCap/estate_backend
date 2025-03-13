from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path

router = APIRouter()

# Путь к директории с загруженными файлами
BASE_UPLOADS_DIR = Path("uploads")


@router.get("/uploads/avatars/{filename}")
def get_avatar(filename: str):
    file_path = BASE_UPLOADS_DIR / "avatars" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(file_path)


@router.get("/uploads/properties/{filename}")
def get_property_image(filename: str):
    file_path = BASE_UPLOADS_DIR / "properties" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(file_path)
from app.database import SessionLocal
from app.models import PropertyImage
import os

def update_image_paths():
    db = SessionLocal()
    try:
        images = db.query(PropertyImage).all()
        for img in images:
            # Извлекаем только имя файла из полного пути
            filename = os.path.basename(img.image_url.replace('/uploads/properties/', '').replace('/uploads/', ''))
            img.image_url = filename
        db.commit()
        print("Пути к изображениям успешно обновлены")
    except Exception as e:
        print(f"Ошибка при обновлении путей: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_image_paths() 
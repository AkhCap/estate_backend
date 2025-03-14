// frontend/app/properties/page.tsx
"use client";
import { useState, useEffect } from "react";
import axios from "../../lib/axios";
import Link from "next/link";

// Интерфейс для изображения объявления (если возвращается массив объектов)
interface PropertyImage {
  id: number;
  image_url: string;
  uploaded_at: string;
}

// Интерфейс для объявления
interface Property {
  id: number;
  title: string;
  price: number;
  rooms: number;
  area: number;
  floor: number;
  total_floors: number;
  address: string;
  // Если сервер возвращает массив изображений как строки, замените на: images?: string[];
  images?: PropertyImage[]; // Если изображения приходят как объекты с полем image_url
  image_url?: string; // Если возвращается одно изображение
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    axios
      .get("/properties/")
      .then((res) => {
        console.log("Получены объявления:", res.data);
        setProperties(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки объявлений:", err);
        setError("Ошибка загрузки объявлений");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-xl">Загрузка объявлений...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-center text-xl text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Список объявлений</h1>
      {properties.length === 0 ? (
        <p className="text-center text-gray-600">Объявления не найдены</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {properties.map((property) => {
            // Если массив изображений существует и не пуст, берем первое изображение
            const firstImage =
              property.images && property.images.length > 0
                ? `http://127.0.0.1:8000${property.images[0].image_url}`
                : property.image_url
                ? `http://127.0.0.1:8000${property.image_url}`
                : "/fallback.jpg";

            return (
              <Link
                key={property.id}
                href={`/properties/${property.id}`}
                className="block bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <img
                  src={firstImage}
                  alt={`Фото объявления ${property.title}`}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{property.title}</h3>
                  <p className="text-gray-700">
                    Цена: {property.price.toLocaleString()} ₽
                  </p>
                  <p className="text-gray-700">
                    {property.rooms} комн. {property.area} м² {property.floor}/{property.total_floors} этаж
                  </p>
                  <p className="mt-2 text-gray-600 text-sm">{property.address}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
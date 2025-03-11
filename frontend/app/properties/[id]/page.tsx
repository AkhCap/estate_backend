"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import axios from "../../../lib/axios"; // Проверьте, что путь корректен

// Интерфейс для объявления (пример)
interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  rooms: number;
  area: number;
  address: string;
  property_type: string;
  deal_type: string;
  images: string[];
  owner_id: number;
  // Добавьте другие параметры, если нужно
}

export default function PropertyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params as { id: string };

  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  // Загрузка данных объявления
  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const res = await axios.get(`/properties/${id}`);
        setProperty(res.data);
        setLoading(false);

        // Проверка владельца (если токен есть)
        const token = localStorage.getItem("token");
        if (token) {
          // Предполагается, что на backend функция get_current_user возвращает email
          // и вы можете получить данные пользователя по email
          const userRes = await axios.get("/users/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const currentUser = userRes.data;
          // Сравниваем owner_id объявления с id текущего пользователя
          if (currentUser && currentUser.id === res.data.owner_id) {
            setIsOwner(true);
          }
        }
      } catch (err: any) {
        console.error("Ошибка загрузки объявления:", err.response?.data);
        setError("Ошибка загрузки объявления");
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  if (loading) return <p>Загрузка...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!property) return <p>Объявление не найдено</p>;

  return (
    <main className="main-container" style={{ padding: "20px" }}>
      {/* Кнопка назад */}
      <button onClick={() => router.back()} style={{ marginBottom: "20px" }}>
        Назад
      </button>

      <h1>{property.title}</h1>
      <p style={{ fontSize: "1.25rem", color: "#555" }}>
        {property.address}
      </p>

      {/* Галерея изображений */}
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", marginBottom: "20px" }}>
        {property.images && property.images.length > 0 ? (
          property.images.map((imgUrl, index) => (
            <img
              key={index}
              src={imgUrl}
              alt={`${property.title} ${index + 1}`}
              style={{ width: "300px", height: "200px", objectFit: "cover", borderRadius: "8px" }}
            />
          ))
        ) : (
          <img
            src="/fallback.jpg"
            alt="Нет изображений"
            style={{ width: "300px", height: "200px", objectFit: "cover", borderRadius: "8px" }}
          />
        )}
      </div>

      {/* Подробное описание и параметры */}
      <section style={{ marginBottom: "20px" }}>
        <h2>Описание</h2>
        <p>{property.description}</p>
      </section>

      <section style={{ marginBottom: "20px" }}>
        <h2>Параметры</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li>
            <strong>Цена:</strong> {property.price.toLocaleString()} ₽
          </li>
          <li>
            <strong>Комнат:</strong> {property.rooms}
          </li>
          <li>
            <strong>Площадь:</strong> {property.area} м²
          </li>
          <li>
            <strong>Тип недвижимости:</strong> {property.property_type}
          </li>
          <li>
            <strong>Тип сделки:</strong> {property.deal_type}
          </li>
        </ul>
      </section>

      {/* Кнопка редактирования (если владелец) */}
      {isOwner && (
        <section style={{ marginBottom: "20px" }}>
          <Link href={`/properties/${property.id}/edit`}>
            <button style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Редактировать объявление
            </button>
          </Link>
        </section>
      )}
    </main>
  );
}
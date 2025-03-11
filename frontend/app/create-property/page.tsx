"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios"; // Проверьте, что путь корректен

export default function CreateProperty() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    rooms: "",
    area: "",
    address: "",
    property_type: "",
    deal_type: "", // возможно, используйте select, если это ENUM
    // добавьте другие поля, если нужны
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Пожалуйста, войдите в систему");
      return;
    }

    try {
      // Преобразуйте числовые поля, если нужно
      const payload = {
        ...formData,
        price: Number(formData.price),
        rooms: Number(formData.rooms),
        area: Number(formData.area),
      };
      const res = await axios.post("/properties/", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      // После успешного создания перенаправляем пользователя
      router.push("/profile"); 
    } catch (err: any) {
      console.error("Ошибка создания объявления:", err.response?.data);
      setError("Ошибка создания объявления");
    }
  };

  return (
    <main style={{ padding: "20px" }}>
      <h1>Создать новое объявление</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Заголовок:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>
        <div>
          <label>Описание:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
        <div>
          <label>Цена:</label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
        <div>
          <label>Комнат:</label>
          <input
            type="number"
            value={formData.rooms}
            onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
          />
        </div>
        <div>
          <label>Площадь:</label>
          <input
            type="number"
            value={formData.area}
            onChange={(e) => setFormData({ ...formData, area: e.target.value })}
          />
        </div>
        <div>
          <label>Адрес:</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>
        <div>
          <label>Тип недвижимости:</label>
          <input
            type="text"
            value={formData.property_type}
            onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
          />
        </div>
        <div>
          <label>Тип сделки:</label>
          <input
            type="text"
            value={formData.deal_type}
            onChange={(e) => setFormData({ ...formData, deal_type: e.target.value })}
          />
        </div>
        <button type="submit">Создать объявление</button>
      </form>
    </main>
  );
}
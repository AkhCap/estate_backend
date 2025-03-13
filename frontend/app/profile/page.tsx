"use client";
import { useState, useEffect } from "react";
import axios from "../../lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar_url?: string;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Форма для редактирования профиля
  const [formData, setFormData] = useState<User>({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    avatar_url: "",
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

useEffect(() => {
  if (!token) {
    setError("Пожалуйста, войдите в систему");
    router.push("/login");
    return;
  }
  console.log("Токен из localStorage:", token);
  axios
    .get("/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      console.log("Данные профиля:", res.data);
      setUser(res.data);
      setFormData({
        username: res.data.username || "",
        email: res.data.email || "",
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        phone: res.data.phone || "",
        avatar_url: res.data.avatar_url || "",
      });
    })
    .catch((err) => {
      console.error("Ошибка получения профиля:", err);
      setError("Ошибка получения данных профиля");
    });
}, [token, router]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await axios.put("/users/me", formData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      setUser(res.data);
      setIsEditing(false);
    } catch (err: any) {
      console.error("Ошибка обновления профиля:", err.response?.data);
      setError("Ошибка обновления профиля");
    }
  };

  // Функция для загрузки аватара
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formDataFile = new FormData();
    formDataFile.append("file", file);
    try {
      const res = await axios.post("/users/me/avatar", formDataFile, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      // Обновляем данные пользователя с новым avatar_url
      setUser(res.data);
      setFormData((prev) => ({ ...prev, avatar_url: res.data.avatar_url }));
    } catch (err: any) {
      console.error("Ошибка загрузки аватара:", err.response?.data);
      setError("Ошибка загрузки аватара");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Профиль пользователя</h1>
      {/* Отображение аватара */}
      <div className="mb-4">
        <img
          src={user?.avatar_url ? user.avatar_url : "/fallback.jpg"}
          alt="Аватар"
          style={{ width: "150px", borderRadius: "50%" }}
        />
      </div>
      {/* Загрузка нового аватара */}
      <div className="mb-4">
        <label className="block mb-1">Загрузить аватар:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="border p-1"
        />
      </div>
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block mb-1">Имя пользователя:</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Имя:</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Фамилия:</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Телефон:</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Сохранить изменения
            </button>
            <button
              type="button"
              onClick={handleEditToggle}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-2">
          <p>
            <strong>Имя пользователя:</strong> {user?.username}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Имя:</strong> {user?.first_name}
          </p>
          <p>
            <strong>Фамилия:</strong> {user?.last_name}
          </p>
          <p>
            <strong>Телефон:</strong> {user?.phone}
          </p>
          <button
            onClick={handleEditToggle}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Редактировать профиль
          </button>
        </div>
      )}
      {error && <p className="text-center text-red-500 mt-4">{error}</p>}
    </div>
  );
}
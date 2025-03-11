"use client";
import { useState, useEffect } from "react";
import axios from "../../lib/axios";
import { useRouter } from "next/navigation";

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
  
  // Обновляем состояние формы с новыми полями, инициализируя пустыми строками
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
    axios
      .get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
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

  if (error) return <p style={{ textAlign: "center" }}>{error}</p>;
  if (!user) return <p style={{ textAlign: "center" }}>Загрузка...</p>;

  return (
    <div style={{ maxWidth: 800, margin: "50px auto", padding: "0 20px" }}>
      <h1>Профиль пользователя</h1>
      {user.avatar_url && (
        <div style={{ marginBottom: "20px" }}>
          <img src={user.avatar_url} alt="Аватар" style={{ width: "150px", borderRadius: "50%" }} />
        </div>
      )}
      <div style={{ marginBottom: "20px" }}>
        <label>Загрузить аватар:</label>
        <input type="file" accept="image/*" onChange={handleAvatarUpload} />
      </div>
      {isEditing ? (
        <form onSubmit={handleSave}>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Имя пользователя:</label>
            <input
              type="text"
              value={formData.username || ""}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Email:</label>
            <input
              type="email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Имя:</label>
            <input
              type="text"
              value={formData.first_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Фамилия:</label>
            <input
              type="text"
              value={formData.last_name || ""}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <label style={{ display: "block", marginBottom: "4px" }}>Телефон:</label>
            <input
              type="text"
              value={formData.phone || ""}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <button
            type="submit"
            style={{
              padding: "10px 20px",
              background: "#00A3E0",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Сохранить изменения
          </button>
          <button
            type="button"
            onClick={handleEditToggle}
            style={{
              padding: "10px 20px",
              background: "#ccc",
              color: "#000",
              border: "none",
              cursor: "pointer",
            }}
          >
            Отмена
          </button>
        </form>
      ) : (
        <div>
          <p><strong>Имя пользователя:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Имя:</strong> {user.first_name}</p>
          <p><strong>Фамилия:</strong> {user.last_name}</p>
          <p><strong>Телефон:</strong> {user.phone}</p>
          <button
            onClick={handleEditToggle}
            style={{
              padding: "10px 20px",
              background: "#00A3E0",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Редактировать профиль
          </button>
        </div>
      )}
    </div>
  );
}
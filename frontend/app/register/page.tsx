"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Отправляем данные регистрации на backend
      await axios.post("/users/register", formData);
      router.push("/login"); // Перенаправляем на страницу входа после успешной регистрации
    } catch (err) {
      console.error(err);
      setError("Ошибка регистрации");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: "0 20px" }}>
      <h1>Регистрация</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Имя пользователя"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
          }
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) =>
            setFormData({ ...formData, email: e.target.value })
          }
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={formData.password}
          onChange={(e) =>
            setFormData({ ...formData, password: e.target.value })
          }
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "10px",
            background: "#00A3E0",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
}
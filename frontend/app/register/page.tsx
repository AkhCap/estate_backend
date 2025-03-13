"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Отправляем запрос на регистрацию
      const res = await axios.post("/users/register", formData);
      // Если запрос успешен, переходим на страницу логина
      router.push("/login");
    } catch (err: any) {
      console.error("Полный объект ошибки:", err);
      // Выводим подробное сообщение об ошибке
      const errorMessage = err.response?.data || err.message || "Неизвестная ошибка";
      console.error("Ошибка регистрации:", errorMessage);
      setError("Ошибка регистрации: " + errorMessage);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: "0 20px" }}>
      <h1>Регистрация</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
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
          type="text"
          placeholder="Имя пользователя"
          value={formData.username}
          onChange={(e) =>
            setFormData({ ...formData, username: e.target.value })
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
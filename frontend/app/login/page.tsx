"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Отправляемые данные:", formData);

    // Создаем URLSearchParams для отправки form data
    const payload = new URLSearchParams();
    payload.append("grant_type", "password");
    payload.append("username", formData.username);
    payload.append("password", formData.password);
    payload.append("scope", "");
    payload.append("client_id", "");
    payload.append("client_secret", "");

    try {
      const res = await axios.post("/users/login", payload, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const token = res.data.access_token; // Извлекаем access_token
      localStorage.setItem("token", token);
      router.push("/profile");
    } catch (err: any) {
      console.error("Ошибка входа:", err.response?.data);
      setError("Ошибка входа");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", padding: "0 20px" }}>
      <h1>Вход</h1>
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
          Войти
        </button>
      </form>
    </div>
  );
}
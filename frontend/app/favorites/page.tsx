"use client";

import { useState, useEffect } from "react";
import axios from "../../lib/axios";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Favorites() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Пожалуйста, войдите в систему");
      return;
    }
    axios
      .get("/users/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setFavorites(res.data);
      })
      .catch((err) => {
        console.error(err);
        setError("Ошибка получения избранного");
      });
  }, []);

  if (error) return <p style={{ textAlign: "center" }}>{error}</p>;
  if (!favorites.length) return <p style={{ textAlign: "center" }}>Избранных объектов нет.</p>;

  return (
    <div style={{ maxWidth: 800, margin: "50px auto", padding: "0 20px" }}>
      <h1>Избранное</h1>
      {favorites.map((fav) => (
        <div key={fav.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
          <h3>{fav.title}</h3>
          <p>Цена: {fav.price}</p>
          {/* Можно добавить кнопку для удаления из избранного */}
        </div>
      ))}
    </div>
  );
}
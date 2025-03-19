"use client";
import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "../../lib/utils";

const mockListings = [
  { 
    id: 1, title: "Квартира в центре", price: 5000000, rooms: 2, area: 60,
    images: ["/images/photo1.jpg", "/images/photo2.jpg", "/images/photo3.jpg"]
  },
  { 
    id: 2, title: "Однушка в спальном районе", price: 3500000, rooms: 1, area: 40,
    images: ["/images/photo4.jpg", "/images/photo5.jpg"]
  },
  { 
    id: 3, title: "Трёшка рядом с метро", price: 8000000, rooms: 3, area: 80,
    images: ["/images/photo6.jpg", "/images/photo7.jpg"]
  }
];

export default function ListingsPage() {
  const [search, setSearch] = useState("");

  return (
    <div className="main-container">
      <h1>🔍 Найденные объявления</h1>

      {/* Поисковая строка */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Введите город, район, улицу или ЖК..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button>Поиск</button>
      </div>

      {/* Список объявлений */}
      <div className="listings">
        {mockListings.length > 0 ? (
          mockListings.map((listing) => (
            <div key={listing.id} className="listing-card">
              {/* Отображаем ПЕРВОЕ изображение из списка */}
              <img src={listing.images[0]} alt={listing.title} className="listing-image" />
              <h3>{listing.title}</h3>
              <p>Цена: {formatPrice(listing.price)} ₽</p>
              <p>Комнат: {listing.rooms}</p>
              <p>Площадь: {listing.area} м²</p>

              {/* Кнопка "Подробнее" */}
              <Link href={`/listings/${listing.id}`}>
                <button className="details-button">Подробнее</button>
              </Link>
            </div>
          ))
        ) : (
          <p>🔍 Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
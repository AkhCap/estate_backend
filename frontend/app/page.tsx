"use client";
import Link from "next/link";
import { useState } from "react";

const mockListings = [
  {
    id: 1,
    title: "Квартира в центре",
    price: 5000000,
    rooms: 2,
    area: 60,
    category: "buy",
    images: ["/images/photo1.jpg"],
  },
  {
    id: 2,
    title: "Однушка в спальном районе",
    price: 3500000,
    rooms: 1,
    area: 40,
    category: "rent",
    images: ["/images/photo2.jpg"],
  },
  {
    id: 3,
    title: "Трёшка рядом с метро",
    price: 8000000,
    rooms: 3,
    area: 80,
    category: "daily",
    images: ["/images/photo3.jpg"],
  },
];

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [rooms, setRooms] = useState("");
  const [area, setArea] = useState("");

  // Фильтрация объявлений по параметрам
  const filteredListings = mockListings.filter((listing) => {
    return (
      (selectedCategory === "all" || listing.category === selectedCategory) &&
      (!priceMin || listing.price >= parseInt(priceMin)) &&
      (!priceMax || listing.price <= parseInt(priceMax)) &&
      (!rooms || listing.rooms === parseInt(rooms)) &&
      (!area || listing.area >= parseInt(area)) &&
      (!search || listing.title.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <main className="main-container">
      {/* Хедер */}
      <header className="header">
        <h1>Estate</h1>
        <nav>
          <Link href="/register">
            <button className="nav-button">Регистрация</button>
          </Link>
          <Link href="/login">
            <button className="nav-button">Вход</button>
          </Link>
          <Link href="/profile">
            <button className="nav-button">Профиль</button>
          </Link>
        </nav>
      </header>

      {/* Секция поиска */}
      <section className="search-container">
        <h2 style={{ fontSize: "1.75rem", marginBottom: "10px" }}>
          Поиск недвижимости
        </h2>
        <div style={{ display: "flex" }}>
          <input
            type="text"
            placeholder="Введите город, район, улицу или ЖК..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button>Поиск</button>
        </div>
      </section>

      {/* Секция объявлений */}
      <section>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ fontSize: "1.75rem" }}>Популярные объявления</h2>
          <div>
            <Link href="/create-property">
              <button className="nav-button" style={{ backgroundColor: "#28a745" }}>
                Создать объявление
              </button>
            </Link>
            <Link href="/properties">
              <button className="nav-button">Список объявлений</button>
            </Link>
          </div>
        </div>
     </section>
        {/* Дополнительная секция поиска и фильтров */}
        <div className="search-bar" style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Введите город, район, улицу или ЖК..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "70%", padding: "10px", marginRight: "8px" }}
          />
          <button style={{ padding: "10px 20px" }}>Поиск</button>
        </div>

        <div className="categories" style={{ marginBottom: "20px" }}>
          <button
            onClick={() => setSelectedCategory("buy")}
            style={{
              marginRight: "10px",
              background: selectedCategory === "buy" ? "#007bff" : "transparent",
              color: selectedCategory === "buy" ? "#fff" : "#007bff",
            }}
          >
            Купить
          </button>
          <button
            onClick={() => setSelectedCategory("rent")}
            style={{
              marginRight: "10px",
              background: selectedCategory === "rent" ? "#007bff" : "transparent",
              color: selectedCategory === "rent" ? "#fff" : "#007bff",
            }}
          >
            Снять
          </button>
          <button
            onClick={() => setSelectedCategory("daily")}
            style={{
              background: selectedCategory === "daily" ? "#007bff" : "transparent",
              color: selectedCategory === "daily" ? "#fff" : "#007bff",
            }}
          >
            Посуточно
          </button>
        </div>

        <div className="filters" style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
          <div>
            <label>Цена (от):</label>
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="₽"
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
          <div>
            <label>Цена (до):</label>
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="₽"
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
          <div>
            <label>Комнат:</label>
            <select
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            >
              <option value="">Любое</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4+</option>
            </select>
          </div>
          <div>
            <label>Площадь (м²):</label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="м²"
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
            />
          </div>
        </div>

        <div className="cards-grid">
          {filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <div key={listing.id} className="card">
                <img
                  src={listing.images?.[0] || "/fallback.jpg"}
                  alt={listing.title}
                />
                <h3 style={{ fontWeight: "bold", marginBottom: "8px" }}>
                  {listing.title}
                </h3>
                <p>Цена: {listing.price.toLocaleString()} ₽</p>
                <p>Комнат: {listing.rooms}</p>
                <p>Площадь: {listing.area} м²</p>
                <div style={{ marginTop: "10px" }}>
                  <Link href={`/listings/${listing.id}`}>
                    <button className="card-button edit">Подробнее</button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p>🔍 Ничего не найдено</p>
          )}
        </div>

        <section className="view-all" style={{ textAlign: "center", marginTop: "30px" }}>
          <Link href="/properties">
            <button className="view-all-button">
              Смотреть все объявления
            </button>
          </Link>
        </section>
      
    </main>
   );
}
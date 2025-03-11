"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const mockListings = [
  { 
    id: 1, title: "Квартира в центре", price: 5000000, rooms: 2, area: 60,
    images: ["/images/apartment1-1.jpg", "/images/apartment1-2.jpg", "/images/apartment1-3.jpg"],
    description: "Просторная квартира в центре города, рядом с метро.",
    contact: "+7 900 123-45-67"
  },
  { 
    id: 2, title: "Однушка в спальном районе", price: 3500000, rooms: 1, area: 40,
    images: ["/images/apartment2-1.jpg", "/images/apartment2-2.jpg"],
    description: "Тихий район, свежий ремонт, развитая инфраструктура.",
    contact: "+7 901 456-78-90"
  },
  { 
    id: 3, title: "Трёшка рядом с метро", price: 8000000, rooms: 3, area: 80,
    images: ["/images/apartment3-1.jpg", "/images/apartment3-2.jpg"],
    description: "Идеальный вариант для семьи, рядом школа и магазины.",
    contact: "+7 902 234-56-78"
  }
];

export default function ListingPage() {
  const params = useParams();
  const id = params?.id as string;
  const listing = mockListings.find((item) => item.id.toString() === id);
  const [currentImage, setCurrentImage] = useState(0);
  const [showContact, setShowContact] = useState(false);

  if (!listing) {
    return <p>Объявление не найдено</p>;
  }

  const nextImage = () => {
    setCurrentImage((prev) => (prev + 1) % listing.images.length);
  };

  const prevImage = () => {
    setCurrentImage((prev) => (prev - 1 + listing.images.length) % listing.images.length);
  };

  return (
    <div className="listing-details">
      {/* Галерея фото */}
      <div className="gallery">
        <button onClick={prevImage} className="gallery-button">◀</button>
        <img src={listing.images[currentImage]} alt={listing.title} />
        <button onClick={nextImage} className="gallery-button">▶</button>
      </div>

      <h1>{listing.title}</h1>
      <p><strong>Цена:</strong> {listing.price.toLocaleString()} ₽</p>
      <p><strong>Комнат:</strong> {listing.rooms}</p>
      <p><strong>Площадь:</strong> {listing.area} м²</p>
      <p>{listing.description}</p>

      {/* Кнопка "Связаться с продавцом" */}
      <button className="contact-button" onClick={() => setShowContact(true)}>📞 Связаться с продавцом</button>

      {/* Отображение контактов после нажатия */}
      {showContact && (
        <div className="contact-info">
          <p><strong>Телефон:</strong> {listing.contact}</p>
          <button className="close-button" onClick={() => setShowContact(false)}>Закрыть</button>
        </div>
      )}

      <Link href="/listings">
        <button className="back-button">⬅ Назад к объявлениям</button>
      </Link>
    </div>
  );
}
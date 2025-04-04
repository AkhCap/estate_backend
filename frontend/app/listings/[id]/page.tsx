"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "../../../lib/utils";
import axios from "../../../lib/axios";

interface Image {
  id: number;
  image_url: string;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  rooms: string;
  area: number;
  images: Image[];
  contact: string;
}

export default function ListingPage() {
  const params = useParams();
  const id = params?.id as string;
  const [listing, setListing] = useState<Property | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [showContact, setShowContact] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await axios.get(`/properties/${id}`, {
          params: {
            is_detail_view: true
          }
        });
        setListing(response.data);
      } catch (err) {
        setError("Ошибка при загрузке данных");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (error) {
    return <div className="text-center text-red-500 p-4">{error}</div>;
  }

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
    <div className="listing-details max-w-4xl mx-auto p-4">
      {/* Галерея фото */}
      <div className="gallery relative">
        <button 
          onClick={prevImage} 
          className="gallery-button absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white/75 rounded-full p-2"
        >
          ◀
        </button>
        <img 
          src={listing.images[currentImage]?.image_url} 
          alt={listing.title} 
          className="w-full h-96 object-cover rounded-lg"
        />
        <button 
          onClick={nextImage} 
          className="gallery-button absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white/75 rounded-full p-2"
        >
          ▶
        </button>
      </div>

      <div className="mt-6 space-y-4">
        <h1 className="text-2xl font-bold">{listing.title}</h1>
        <p className="text-xl"><strong>Цена:</strong> {formatPrice(listing.price)} ₽</p>
        <p><strong>Комнат:</strong> {listing.rooms}</p>
        <p><strong>Площадь:</strong> {listing.area} м²</p>
        <p><strong>Адрес:</strong> {listing.address}</p>
        <p className="whitespace-pre-line">{listing.description}</p>

        {/* Кнопка "Связаться с продавцом" */}
        <button 
          className="contact-button bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" 
          onClick={() => setShowContact(true)}
        >
          📞 Связаться с продавцом
        </button>

        {/* Отображение контактов после нажатия */}
        {showContact && (
          <div className="contact-info bg-gray-50 p-4 rounded-lg">
            <p><strong>Телефон:</strong> {listing.contact}</p>
            <button 
              className="close-button mt-2 text-blue-500 hover:text-blue-700" 
              onClick={() => setShowContact(false)}
            >
              Закрыть
            </button>
          </div>
        )}

        <Link href="/listings">
          <button className="back-button bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
            ⬅ Назад к объявлениям
          </button>
        </Link>
      </div>
    </div>
  );
}
// Файл: app/properties/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "../../lib/axios";
import { formatPrice } from "../../lib/utils";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaHeart, FaRegCalendarAlt } from "react-icons/fa";

// Добавляем базовый URL для изображений
const BASE_URL = "http://localhost:8000";

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
  floor: number;
  total_floors: number;
  property_type: string;
  deal_type: string;
  property_condition: string;
  has_balcony: boolean;
  window_view: string[];
  bathroom: string;
  bath_type: string;
  heating: string;
  renovation: string;
  lifts_passenger: number;
  lifts_freight: number;
  parking: string[];
  prepayment: string;
  deposit: number;
  living_conditions: string[];
  who_rents: string;
  landlord_contact: string;
  contact_method: string[];
  owner_id: number;
  images: Image[];
  created_at: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Функция форматирования даты
const formatDate = (dateString: string) => {
  if (!dateString) return 'Дата не указана';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Дата не указана';
    }
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'Дата не указана';
  }
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем объявления
        const propertiesResponse = await axios.get("/properties");
        setProperties(propertiesResponse.data);

        // Загружаем избранное
        const favoritesResponse = await axios.get('/favorites');
        const favoritesData = favoritesResponse.data;
        setFavorites(new Set(favoritesData.map((fav: any) => fav.property_id)));
      } catch (err: any) {
        setError(err.response?.data?.detail || "Ошибка при загрузке данных");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, propertyId: number) => {
    e.preventDefault(); // Предотвращаем переход по ссылке
    try {
      if (favorites.has(propertyId)) {
        await axios.delete(`/favorites/${propertyId}`);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      } else {
        await axios.post('/favorites', { property_id: propertyId });
        setFavorites(prev => new Set([...prev, propertyId]));
      }
    } catch (err) {
      console.error('Ошибка при изменении избранного:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 font-medium">Загрузка объявлений...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
          <div className="text-red-500 text-center font-medium">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок и фильтры */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">Объявления</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <select className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Тип жилья</option>
                <option value="apartment">Квартира</option>
                <option value="house">Дом</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <select className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Количество комнат</option>
                <option value="1">1 комната</option>
                <option value="2">2 комнаты</option>
                <option value="3">3 комнаты</option>
                <option value="4+">4+ комнаты</option>
              </select>
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Цена от"
                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                placeholder="Цена до"
                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Список объявлений */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {properties.map((property) => (
            <motion.div
              key={property.id}
              variants={item}
              className="group"
            >
              <Link href={`/properties/${property.id}`}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
                  {/* Изображение */}
                  <div className="relative h-64">
                    <img
                      src={property.images[0] ? `${BASE_URL}/uploads/properties/${property.images[0].image_url}` : "/no-image.jpg"}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/no-image.jpg';
                      }}
                    />
                    <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {property.deal_type === "sale" ? "Продажа" : "Аренда"}
                    </div>
                    <button
                      onClick={(e) => toggleFavorite(e, property.id)}
                      className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                        favorites.has(property.id)
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-white text-gray-400 hover:text-red-600 hover:bg-red-50'
                      } shadow-lg`}
                    >
                      <FaHeart className={`w-5 h-5 ${favorites.has(property.id) ? 'fill-current' : ''}`} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                      <p className="text-white text-2xl font-bold">
                        {formatPrice(property.price)}
                      </p>
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <FaMapMarkerAlt className="mr-2" />
                      <p className="text-sm line-clamp-1">{property.address}</p>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <FaBed className="w-4 h-4" />
                        <span>{property.rooms} комнат</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaRulerCombined className="w-4 h-4" />
                        <span>Площадь: {property.area} м²</span>
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <FaRegCalendarAlt className="w-4 h-4 mr-2" />
                      <span>Создано: {formatDate(property.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Пагинация */}
        <div className="mt-12 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-500 text-white">
              1
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors">
              2
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors">
              3
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
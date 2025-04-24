// Файл: app/properties/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "../../lib/axios";
import { formatPrice } from "../../lib/utils";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaHeart, FaRegCalendarAlt, FaCheck, FaPlus } from "react-icons/fa";
import { useRouter } from "next/navigation";

// Добавляем базовый URL для изображений
const BASE_URL = "http://localhost:8000";

interface Image {
  id: number;
  image_url: string;
  is_main: boolean;
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
  is_viewed: boolean;
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

// Функция для получения главного изображения объявления
const getMainImageUrl = (property: Property): string => {
  if (!property.images || property.images.length === 0) {
    return "/no-image.jpg";
  }
  
  // Ищем главное изображение
  const mainImage = property.images.find(img => img.is_main);
  
  // Если главное изображение не найдено, берем первое
  const imageUrl = mainImage ? mainImage.image_url : property.images[0].image_url;
  
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return `${BASE_URL}/uploads/properties/${imageUrl}`;
};

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем объявления с информацией о просмотрах
        const propertiesResponse = await axios.get("/properties/list", {
          params: {
            include_viewed: true
          }
        });
        setProperties(propertiesResponse.data);

        // Проверяем наличие токена в localStorage
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Пробуем загрузить данные пользователя и избранное
            const [userResponse, favoritesResponse] = await Promise.all([
              axios.get('/users/me'),
              axios.get('/favorites')
            ]);
            setCurrentUserId(userResponse.data.id);
            const favoritesData = favoritesResponse.data;
            setFavorites(new Set(favoritesData.map((fav: any) => fav.property_id)));
            setIsAuthenticated(true);
          } catch (err) {
            // Если получаем 401, значит токен недействителен
            if (err.response?.status === 401) {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              setCurrentUserId(null);
            }
          }
        } else {
          setIsAuthenticated(false);
          setCurrentUserId(null);
        }
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
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

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
      if (err.response?.status === 401) {
        router.push('/login');
      }
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
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">Объявления</h1>
            <Link href="/create-property">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                <FaPlus /> Добавить объявление
              </button>
            </Link>
          </div>
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
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
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
                  <div className="relative h-[200px]">
                    <img
                      src={getMainImageUrl(property)}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/no-image.jpg';
                      }}
                    />
                    {property.is_viewed && property.owner_id !== currentUserId && (
                      <div className="absolute top-4 left-4 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                        <FaCheck className="w-2.5 h-2.5" />
                        Просмотрено
                      </div>
                    )}
                    <button
                      onClick={(e) => toggleFavorite(e, property.id)}
                      className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                        favorites.has(property.id)
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-white text-gray-400 hover:text-red-600 hover:bg-red-50'
                      } shadow-lg`}
                    >
                      <FaHeart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-current' : ''}`} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-xl font-bold">
                        {formatPrice(property.price)}
                      </p>
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                    <div className="flex items-center text-gray-600 mb-3">
                      <FaMapMarkerAlt className="mr-1 w-3 h-3" />
                      <p className="text-sm truncate">{property.address}</p>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <FaBed className="w-3 h-3" />
                        <span className="text-sm">
                            {property.rooms}
                            {typeof property.rooms === 'string' && property.rooms.trim() !== '' && property.rooms.trim().toLowerCase() !== 'студия' && ' комнат'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaRulerCombined className="w-3 h-3" />
                        <span className="text-sm">Площадь: {property.area} м²</span>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <FaRegCalendarAlt className="w-3 h-3 mr-1" />
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
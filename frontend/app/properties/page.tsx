// Файл: app/properties/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "../../lib/axios";
import { formatPrice } from "../../lib/utils";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaHeart, FaRegCalendarAlt, FaCheck, FaPlus, FaSearch, FaBuilding, FaParking, FaBath, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { useRouter } from "next/navigation";
import PropertyCard from "@/components/PropertyCard";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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

  const filteredAndSortedProperties = properties
    .filter(property =>
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime() : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return sortOrder === "desc" ? b.price - a.price : a.price - b.price;
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Фильтры и поиск */}
        <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm mb-8">
          <div className="flex-grow relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск по названию или адресу..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "price" | "date")}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">По дате</option>
              <option value="price">По цене</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">По убыванию</option>
              <option value="asc">По возрастанию</option>
            </select>
          </div>
        </div>

        {/* Список объявлений */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filteredAndSortedProperties.length === 0 ? (
            <div className="col-span-4 text-center py-12 bg-white rounded-2xl">
              <p className="text-gray-600">По вашему запросу ничего не найдено</p>
            </div>
          ) : (
            filteredAndSortedProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={{
                  ...property,
                  deal_type: (property.deal_type as 'sale' | 'rent' | 'daily') || 'sale',
                  floor: property.floor ? String(property.floor) : undefined,
                }}
                favorites={favorites}
                currentUserId={currentUserId}
                toggleFavorite={(e) => toggleFavorite(e, property.id)}
              />
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
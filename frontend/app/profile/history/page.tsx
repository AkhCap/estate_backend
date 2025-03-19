"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaClock, FaTrash, FaRegCalendarAlt, FaSearch } from "react-icons/fa";

const BASE_URL = "http://localhost:8000";

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  rooms: string;
  area: number;
  images: Array<{ id: number; image_url: string }>;
  viewed_at: string;
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

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRetrying, setIsRetrying] = useState(false);

  const fetchHistory = async (isRetry = false) => {
    try {
      setLoading(true);
      if (isRetry) {
        setIsRetrying(true);
      }
      const response = await axios.get("/users/me/history");
      setHistory(response.data);
      setError("");
    } catch (err: any) {
      console.error("Error fetching history:", err);
      
      if (err.response?.status === 401) {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        
        // Если есть токен, но получили 401, возможно он истек
        // Попробуем обновить токен через axios interceptor
        if (!isRetry) {
          await fetchHistory(true);
          return;
        }
      }
      
      setError(
        err.response?.status === 404
          ? "История просмотров недоступна"
          : err.response?.data?.detail || "Ошибка при загрузке истории просмотров"
      );
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const retryFetch = () => {
    setError("");
    fetchHistory();
  };

  const clearHistory = async () => {
    if (window.confirm("Вы уверены, что хотите очистить всю историю просмотров?")) {
      try {
        await axios.delete("/users/me/history");
        setHistory([]);
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const removeFromHistory = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Удалить это объявление из истории просмотров?")) {
      try {
        await axios.delete(`/users/me/history/${propertyId}`);
        setHistory(history.filter(property => property.id !== propertyId));
      } catch (err: any) {
        console.error(err);
      }
    }
  };

  const filteredAndSortedHistory = history
    .filter(property => 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" 
          ? new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
          : new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime();
      } else {
        return sortOrder === "desc" 
          ? b.price - a.price
          : a.price - b.price;
      }
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        {isRetrying && (
          <p className="text-gray-600">Переподключение к серверу...</p>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="p-6 bg-red-50 text-red-600 rounded-2xl mb-4 text-center">
          <p className="font-medium mb-4">{error}</p>
          <button
            onClick={retryFetch}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-12">
        <div className="mb-6">
          <FaClock className="w-16 h-16 text-gray-300 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          История просмотров пуста
        </h3>
        <p className="text-gray-600 mb-8 max-w-md">
          Здесь будут отображаться просмотренные вами объявления. 
          Начните просматривать объявления, чтобы они появились в истории.
        </p>
        <Link
          href="/properties"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Смотреть объявления
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок и управление */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          История просмотров
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {history.length} {history.length === 1 ? "объявление" : "объявлений"}
          </span>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearHistory}
            className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FaTrash className="w-4 h-4" />
            <span>Очистить историю</span>
          </motion.button>
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl shadow-sm">
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
            onChange={(e) => setSortBy(e.target.value as "date" | "price")}
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
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {filteredAndSortedHistory.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-600">По вашему запросу ничего не найдено</p>
          </div>
        ) : (
          filteredAndSortedHistory.map((property) => (
            <motion.div
              key={property.id}
              variants={item}
              className="group relative"
            >
              <Link href={`/properties/${property.id}`}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                  {/* Изображение */}
                  <div className="relative aspect-[4/3]">
                    <img
                      src={property.images[0] ? `${BASE_URL}/uploads/properties/${property.images[0].image_url}` : "/no-image.jpg"}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/no-image.jpg';
                      }}
                    />
                    <button
                      onClick={(e) => removeFromHistory(property.id, e)}
                      className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 hover:bg-white"
                    >
                      <FaTrash className="text-red-500" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                      <p className="text-white text-2xl font-bold">
                        {formatPrice(property.price)}
                      </p>
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {property.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <FaMapMarkerAlt className="mr-2 flex-shrink-0" />
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
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaRegCalendarAlt className="w-4 h-4 mr-2" />
                        <span>Создано: {formatDate(property.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaRegCalendarAlt className="w-4 h-4 mr-2" />
                        <span>Просмотрено: {formatDate(property.viewed_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
} 
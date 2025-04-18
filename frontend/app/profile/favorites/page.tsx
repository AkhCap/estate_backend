"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion } from "framer-motion";
import { 
  FaBed, 
  FaRulerCombined, 
  FaMapMarkerAlt, 
  FaHeart, 
  FaSearch,
  FaBuilding,
  FaParking,
  FaBath,
  FaSortAmountDown,
  FaSortAmountUp,
  FaRegCalendarAlt,
  FaCheck
} from "react-icons/fa";

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
  images: Image[];
  property_type: string;
  bathroom: string;
  has_parking: boolean;
  floor?: number;
  total_floors?: number;
  created_at: string;
  is_viewed: boolean;
  owner_id: number;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
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

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"price" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userResponse, favoritesResponse] = await Promise.all([
          axios.get('/users/me'),
          axios.get('/favorites')
        ]);
        setCurrentUserId(userResponse.data.id);
        
        // Получаем свойства из ответа API
        const favoriteProperties = favoritesResponse.data.map((fav: any) => fav.property || {});
        setFavorites(favoriteProperties);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Ошибка при загрузке избранного");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const removeFavorite = async (propertyId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPropertyToDelete(propertyId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      await axios.delete(`/favorites/${propertyToDelete}`);
      setFavorites(prev => prev.filter(property => property.id !== propertyToDelete));
      setShowDeleteModal(false);
      setPropertyToDelete(null);
    } catch (err) {
      console.error('Ошибка при удалении из избранного:', err);
    }
  };

  const filteredAndSortedFavorites = favorites
    .filter(property => 
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" 
          ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          : new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else {
        return sortOrder === "desc" ? b.price - a.price : a.price - b.price;
      }
    });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Загрузка избранного...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-2xl text-center">
        <p className="font-medium mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center py-12">
        <div className="mb-6">
          <FaHeart className="w-16 h-16 text-gray-300 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          У вас пока нет избранных объявлений
        </h3>
        <p className="text-gray-600 mb-8 max-w-md">
          Добавляйте понравившиеся объявления в избранное, чтобы не потерять их
        </p>
        <Link
          href="/properties"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          Смотреть все объявления
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Заголовок и статистика */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Избранные объявления
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            {favorites.length} {favorites.length === 1 ? "объявление" : "объявлений"}
          </span>
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
          <button
            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
            className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {sortOrder === "desc" ? <FaSortAmountDown /> : <FaSortAmountUp />}
          </button>
        </div>
      </div>

      {/* Список объявлений */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {filteredAndSortedFavorites.length === 0 ? (
          <div className="col-span-2 text-center py-12 bg-white rounded-2xl">
            <p className="text-gray-600">По вашему запросу ничего не найдено</p>
          </div>
        ) : (
          filteredAndSortedFavorites.map((property) => (
            <motion.div
              key={property.id}
              variants={item}
              className="group relative"
            >
              <Link href={`/properties/${property.id}`}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Изображение */}
                  <div className="relative h-[200px] w-full overflow-hidden bg-gray-100">
                    <img
                      src={property.images && property.images.length > 0 && property.images[0].image_url 
                        ? `${BASE_URL}/uploads/properties/${property.images[0].image_url}`
                        : "/images/placeholder.png"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/photo1.jpg';
                        target.onerror = null;
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-xl font-bold">
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

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <FaRegCalendarAlt className="w-4 h-4 mr-2" />
                        <span>Создано: {formatDate(property.created_at)}</span>
                      </div>

                      <button
                        onClick={(e) => removeFavorite(property.id, e)}
                        className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:text-white bg-red-50 hover:bg-red-600 rounded-xl transition-colors duration-200"
                      >
                        <FaHeart className="mr-1" />
                        Убрать
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Модальное окно подтверждения удаления */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Подтверждение удаления
            </h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить это объявление из избранного?
            </p>
            <div className="flex justify-end space-x-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowDeleteModal(false);
                  setPropertyToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Отмена
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Удалить
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 
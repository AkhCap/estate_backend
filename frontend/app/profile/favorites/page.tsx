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
  FaCheck,
  FaArrowLeft
} from "react-icons/fa";
import PropertyCard from "@/components/PropertyCard";

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
  deal_type: string;
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

  const toggleFavorite = (e: React.MouseEvent, propertyId: number) => {
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
    <div className="fixed inset-0 top-16 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/profile">
            <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <FaArrowLeft className="w-4 h-4" />
              <span>Вернуться в профиль</span>
            </button>
          </Link>
        </div>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Избранное</h1>
        </div>

        <div className="space-y-6">
          {favorites.map((favorite) => (
            <PropertyCard
              key={favorite.id}
              property={{
                ...favorite,
                deal_type: (favorite.deal_type as 'sale' | 'rent' | 'daily') || 'sale',
                floor: favorite.floor ? String(favorite.floor) : undefined,
              }}
              favorites={new Set(favorites.map(p => p.id))}
              currentUserId={currentUserId}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      </div>

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
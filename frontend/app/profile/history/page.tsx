"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaClock, FaTrash, FaRegCalendarAlt, FaSearch, FaExclamationTriangle, FaCheck, FaArrowLeft, FaTrashAlt } from "react-icons/fa";
import PropertyCard from "@/components/PropertyCard";
import { useAuth } from "@/app/context/AuthContext";

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
  created_at: string;
  is_viewed: boolean;
  owner_id: number;
  deal_type?: string;
  floor?: string;
}

interface HistoryItem {
  id: number;
  property_id: number;
  viewed_at: string;
  property: Property;
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

const itemAnimation = {
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

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md m-4 relative z-10"
      >
        <div className="flex items-center gap-3 mb-4">
          <FaExclamationTriangle className="text-red-500 w-6 h-6" />
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            Удалить
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function HistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    itemId?: number;
    isClearAll: boolean;
  }>({
    isOpen: false,
    itemId: undefined,
    isClearAll: false
  });

  const fetchHistory = async (isRetry = false) => {
    try {
      setLoading(true);
      if (isRetry) {
        setIsRetrying(true);
      }
      const [userResponse, historyResponse, favoritesResponse] = await Promise.all([
        axios.get('/users/me'),
        axios.get("/history"),
        axios.get("/favorites")
      ]);
      setCurrentUserId(userResponse.data.id);
      const filteredHistory = historyResponse.data.filter(
        (item: any) => item.property.owner_id !== userResponse.data.id
      );
      setHistory(filteredHistory);
      const favoriteIdsSet = new Set<number>(favoritesResponse.data.map((fav: any) => Number(fav.property.id)));
      setFavoriteIds(favoriteIdsSet);
      setError("");
    } catch (err: any) {
      console.error("Error fetching history:", err);
      
      if (err.response?.status === 401) {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }
        
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
      setHistory([]);
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
    try {
      await axios.delete("/history");
      setHistory([]);
    } catch (err: any) {
      console.error("Error clearing history:", err);
      setError(err.response?.data?.detail || "Ошибка при очистке истории просмотров");
    }
  };

  const removeFromHistory = async (historyId: number) => {
    try {
      await axios.delete(`/history/${historyId}`);
      setHistory(history.filter(item => item.id !== historyId));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleConfirmAction = () => {
    if (confirmModal.isClearAll) {
      clearHistory();
    } else if (confirmModal.itemId !== undefined) {
      removeFromHistory(confirmModal.itemId);
    }
  };

  const filteredAndSortedHistory = history
    .filter(item => 
      (item.property?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.property?.address?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "desc" 
          ? new Date(b.viewed_at).getTime() - new Date(a.viewed_at).getTime()
          : new Date(a.viewed_at).getTime() - new Date(b.viewed_at).getTime();
      } else {
        return sortOrder === "desc" 
          ? (b.property?.price || 0) - (a.property?.price || 0)
          : (a.property?.price || 0) - (b.property?.price || 0);
      }
    });

  const toggleFavorite = async (e: React.MouseEvent, propertyId: number) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (favoriteIds.has(propertyId)) {
        await axios.delete(`/favorites/${propertyId}`);
        setFavoriteIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(propertyId);
          return newSet;
        });
      } else {
        await axios.post('/favorites', { property_id: propertyId });
        setFavoriteIds(prev => new Set([...prev, propertyId]));
      }
    } catch (err) {
      console.error('Ошибка при изменении избранного:', err);
    }
  };

  const removeView = async (propertyId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`/viewed-properties/${propertyId}`);
      setHistory(prev => prev.filter(item => item.property.id !== propertyId));
    } catch (err) {
      console.error('Ошибка при удалении просмотра:', err);
    }
  };

  const clearAllViews = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete('/viewed-properties');
      setHistory([]);
    } catch (err) {
      console.error('Ошибка при очистке истории просмотров:', err);
    }
  };

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
    <div className="fixed inset-0 top-16 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">История просмотров</h1>
          </div>
          {history.length > 0 && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirmModal({
                  isOpen: true,
                  isClearAll: true
                });
              }}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <FaTrashAlt className="w-4 h-4" />
              <span>Очистить историю</span>
            </button>
          )}
        </div>

        <div className="space-y-6">
          <ConfirmModal
            isOpen={confirmModal.isOpen}
            onClose={() => setConfirmModal({ isOpen: false, itemId: undefined, isClearAll: false })}
            onConfirm={handleConfirmAction}
            title={confirmModal.isClearAll ? "Очистить историю" : "Удалить запись"}
            message={
              confirmModal.isClearAll
                ? "Вы уверены, что хотите очистить всю историю просмотров? Это действие нельзя отменить."
                : "Вы уверены, что хотите удалить эту запись из истории просмотров?"
            }
          />

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
              filteredAndSortedHistory.map((item) => (
                <motion.div
                  key={`${item.property.id}-${item.viewed_at}`}
                  variants={itemAnimation}
                  className="relative group"
                >
                  <PropertyCard
                    property={{
                      ...item.property,
                      deal_type: (item.property.deal_type as 'sale' | 'rent' | 'daily') || 'sale',
                      floor: item.property.floor ? String(item.property.floor) : undefined,
                    }}
                    favorites={favoriteIds}
                    currentUserId={currentUserId}
                    toggleFavorite={(e) => toggleFavorite(e, item.property.id)}
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setConfirmModal({
                        isOpen: true,
                        itemId: item.id,
                        isClearAll: false
                      });
                    }}
                    className="absolute bottom-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/30 backdrop-blur-md rounded-full text-gray-600 hover:text-red-500 hover:bg-white/40 transition-all duration-300"
                    aria-label="Удалить из истории просмотров"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
} 
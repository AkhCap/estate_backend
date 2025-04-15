"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaClock, FaTrash, FaRegCalendarAlt, FaSearch, FaExclamationTriangle, FaCheck } from "react-icons/fa";

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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "price">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
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
      const [userResponse, historyResponse] = await Promise.all([
        axios.get('/users/me'),
        axios.get("/history")
      ]);
      setCurrentUserId(userResponse.data.id);
      const filteredHistory = historyResponse.data.filter(
        (item: any) => item.property.owner_id !== userResponse.data.id
      );
      setHistory(filteredHistory);
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
            onClick={() => setConfirmModal({ isOpen: true, isClearAll: true })}
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
          filteredAndSortedHistory.map((item) => (
            <motion.div
              key={`${item.property.id}-${item.viewed_at}`}
              variants={itemAnimation}
              className="group relative"
            >
              <Link href={`/properties/${item.property.id}`}>
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Изображение */}
                  <div className="relative h-[200px] w-full overflow-hidden bg-gray-100">
                    <img
                      src={item.property.images && item.property.images.length > 0 && item.property.images[0].image_url 
                        ? `${BASE_URL}/uploads/properties/${item.property.images[0].image_url}`
                        : "/images/photo1.jpg"}
                      alt={item.property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/photo1.jpg';
                        target.onerror = null;
                      }}
                    />
                    {item.property.is_viewed && item.property.owner_id !== currentUserId && (
                      <div className="absolute top-4 right-4 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                        <FaCheck className="w-2.5 h-2.5" />
                        Просмотрено
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                      <p className="text-white text-xl font-bold">
                        {formatPrice(item.property.price)}
                      </p>
                    </div>
                  </div>

                  {/* Информация */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                      {item.property.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <FaMapMarkerAlt className="mr-2 flex-shrink-0" />
                      <p className="text-sm line-clamp-1">{item.property.address}</p>
                    </div>
                    <div className="flex items-center gap-4 text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <FaBed className="w-4 h-4" />
                        <span>{item.property.rooms} комнат</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaRulerCombined className="w-4 h-4" />
                        <span>Площадь: {item.property.area} м²</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaRegCalendarAlt className="w-4 h-4 mr-2" />
                        <span>Создано: {formatDate(item.property.created_at)}</span>
                      </div>
                      <div className="flex items-center">
                        <FaRegCalendarAlt className="w-4 h-4 mr-2" />
                        <span>Просмотрено: {formatDate(item.viewed_at)}</span>
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
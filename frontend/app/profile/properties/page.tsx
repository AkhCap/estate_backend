"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaEdit, FaTrash, FaEye, FaPlus, FaRegCalendarAlt, FaArrowLeft } from "react-icons/fa";
import PropertyCard from "@/components/PropertyCard";

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
  views_count: number;
  status: "active" | "inactive" | "pending";
  created_at: string;
  deal_type: "sale" | "rent" | "daily";
  property_type: string;
  floor: number;
  total_floors: number;
  owner_id: number | null;
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

const statusColors = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800"
};

const statusLabels = {
  active: "Активно",
  inactive: "Неактивно",
  pending: "На модерации"
};

const formatDate = (dateString: string) => {
  if (!dateString) return 'Дата не указана';
  
  try {
    // Преобразуем строку даты в объект Date
    const date = new Date(dateString);
    
    // Проверяем, что дата валидная
    if (isNaN(date.getTime())) {
      return 'Дата не указана';
    }
    
    // Форматируем дату
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (error) {
    return 'Дата не указана';
  }
};

export default function MyPropertiesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const [propertiesResponse, favoritesResponse] = await Promise.all([
        axios.get("/users/me/properties"),
        axios.get("/favorites")
      ]);
      setProperties(propertiesResponse.data);
      const favoriteIdsSet = new Set<number>(favoritesResponse.data.map((fav: any) => Number(fav.property.id)));
      setFavoriteIds(favoriteIdsSet);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при загрузке объявлений");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async (propertyId: number) => {
    setPropertyToDelete(propertyId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      await axios.delete(`/properties/${propertyToDelete}`);
      setProperties(properties.filter(property => property.id !== propertyToDelete));
      setShowDeleteModal(false);
      setPropertyToDelete(null);
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl">
        {error}
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
          <h1 className="text-3xl font-bold">Мои объявления</h1>
          <Link href="/create-property">
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <FaPlus /> Добавить объявление
            </button>
          </Link>
        </div>

        <div className="space-y-6">
          {properties.map((property) => (
            <div key={property.id} className="flex items-start gap-4">
              <div className="flex-grow max-w-2xl">
                <PropertyCard
                  property={{
                    ...property,
                    deal_type: (property.deal_type as 'sale' | 'rent' | 'daily') || 'sale',
                    floor: property.floor ? String(property.floor) : undefined,
                    owner_id: typeof property.owner_id === 'number' ? property.owner_id : 0,
                  }}
                  favorites={favoriteIds}
                  currentUserId={null}
                  toggleFavorite={(e) => toggleFavorite(e, property.id)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => router.push(`/properties/edit/${property.id}`)}
                  className="text-base bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                >
                  <FaEdit className="w-4 h-4" /> Редактировать
                </button>
                <button 
                  onClick={() => handleDelete(property.id)}
                  className="text-base bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <FaTrash className="w-4 h-4" /> Удалить
                </button>
              </div>
            </div>
          ))}

          {properties.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-600 mb-4">У вас пока нет объявлений</p>
              <Link href="/create-property">
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto">
                  <FaPlus /> Создать первое объявление
                </button>
              </Link>
            </div>
          )}
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
              Вы уверены, что хотите удалить это объявление? Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPropertyToDelete(null);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
} 
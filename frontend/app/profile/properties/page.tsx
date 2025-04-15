"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaEdit, FaTrash, FaEye, FaPlus, FaRegCalendarAlt } from "react-icons/fa";
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
  deal_type: "sale" | "rent";
  property_type: string;
  floor: number;
  total_floors: number;
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

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await axios.get("/users/me/properties");
      setProperties(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при загрузке объявлений");
      console.error(err);
    } finally {
      setLoading(false);
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
    <div className="container mx-auto px-4 py-8">
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
          <motion.div
            key={property.id}
            variants={item}
            className="group relative"
          >
            <Link href={`/properties/${property.id}`}>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="flex flex-col md:flex-row h-[240px]">
                  {/* Изображение */}
                  <div className="relative md:w-72 h-full overflow-hidden bg-gray-100">
                    <img
                      src={property.images && property.images.length > 0 && property.images[0].image_url 
                        ? `${BASE_URL}/uploads/properties/${property.images[0].image_url}`
                        : "/images/photo1.jpg"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/images/photo1.jpg';
                        target.onerror = null;
                      }}
                    />
                  </div>

                  {/* Информация */}
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {property.title}
                          </h3>
                          <div className="flex items-center text-gray-600 mt-1">
                            <FaMapMarkerAlt className="mr-2" />
                            <p className="text-sm line-clamp-1">{property.address}</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {formatPrice(property.price)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <FaBed className="w-4 h-4" />
                          <span>{property.rooms} комнат</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FaRulerCombined className="w-4 h-4" />
                          <span>Площадь: {property.area} м²</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <FaRegCalendarAlt className="w-4 h-4 mr-2" />
                        <span>Создано: {formatDate(property.created_at)}</span>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/properties/edit/${property.id}`);
                          }}
                          className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                        >
                          <FaEdit className="w-3 h-3" /> Редактировать
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(property.id);
                          }}
                          className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1.5"
                        >
                          <FaTrash className="w-3 h-3" /> Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
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
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaEdit, FaTrash, FaEye, FaPlus } from "react-icons/fa";

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

const formatCreatedDate = (dateString: string | null) => {
  if (!dateString || dateString === "null") return 'Дата не указана';
  
  try {
    // Если дата приходит в формате "YYYY-MM-DD HH:mm:ss", преобразуем её в ISO формат
    const isoDate = dateString.replace(' ', 'T');
    const date = new Date(isoDate);
    
    // Проверяем, что дата валидная
    if (isNaN(date.getTime())) return 'Дата не указана';
    
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
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

  const handleEdit = (propertyId: number) => {
    router.push(`/properties/edit/${propertyId}`);
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
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Мои объявления
        </h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/properties/create")}
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          <FaPlus className="mr-2" />
          Добавить объявление
        </motion.button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-6">
            <FaPlus className="w-16 h-16 text-gray-300 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            У вас пока нет объявлений
          </h3>
          <p className="text-gray-600 mb-6">
            Создайте свое первое объявление, чтобы начать продавать или сдавать в аренду
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/properties/create")}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="mr-2" />
            Добавить объявление
          </motion.button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-6"
        >
          {properties.map((property) => (
            <motion.div
              key={property.id}
              variants={item}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="flex flex-col md:flex-row">
                {/* Изображение */}
                <div className="relative md:w-72 aspect-[4/3] md:aspect-auto">
                  <img
                    src={property.images[0] ? `${BASE_URL}${property.images[0].image_url}` : "/no-image.jpg"}
                    alt={property.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/no-image.jpg';
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[property.status]}`}>
                      {statusLabels[property.status]}
                    </span>
                  </div>
                </div>

                {/* Информация */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {property.title}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-4">
                        <FaMapMarkerAlt className="mr-2" />
                        <p className="text-sm">{property.address}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(property.price)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <FaBed className="mr-2" />
                      <span>{property.rooms}</span>
                    </div>
                    <div className="flex items-center">
                      <FaRulerCombined className="mr-2" />
                      <span>{property.area} м²</span>
                    </div>
                    <div className="flex items-center">
                      <FaEye className="mr-2" />
                      <span>{property.views_count} просмотров</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      Создано: {formatCreatedDate(property.created_at)}
                    </div>
                    <div className="flex items-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEdit(property.id)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                      >
                        <FaEdit className="mr-2" />
                        Редактировать
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDelete(property.id)}
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
                      >
                        <FaTrash className="mr-2" />
                        Удалить
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

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
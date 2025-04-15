import Link from "next/link";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaHeart, FaRegCalendarAlt, FaRegClock } from "react-icons/fa";
import { formatPrice } from "../lib/utils";
import Image from "next/image";

const BASE_URL = "http://localhost:8000";

interface Image {
  id: number;
  image_url: string;
}

interface Property {
  id: number;
  title: string;
  price: number;
  rooms: string;
  area: number;
  deal_type: string;
  images: Image[];
  address: string;
  created_at: string;
}

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

const getDealTypeLabel = (type: string) => {
  switch (type) {
    case "sale":
      return "Продажа";
    case "rent":
      return "Аренда";
    case "daily":
      return "Посуточно";
    default:
      return type;
  }
};

interface PropertyCardProps {
  property: Property;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function PropertyCard({ property, onEdit, onDelete, showActions = false }: PropertyCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden w-full">
      {/* Контейнер для изображения фиксированного размера */}
      <div className="relative w-full h-[240px]">
        <Image
          src={property.images?.[0]?.image_url || '/placeholder.jpg'}
          alt={property.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      
      {/* Информация о недвижимости */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-semibold text-gray-900">{property.price} TJS</h3>
          {showActions && (
            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span className="text-sm">Редактировать</span>
              </button>
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <span className="text-sm">Удалить</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <FaMapMarkerAlt className="w-4 h-4" />
            <span className="text-sm">{property.address}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FaBed className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">{property.rooms} комнат</span>
            </div>
            <div className="flex items-center gap-1">
              <FaRulerCombined className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">Площадь: {property.area} м²</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-gray-500">
            <FaRegClock className="w-4 h-4" />
            <span className="text-sm">Создано: {new Date(property.created_at).toLocaleDateString('ru-RU')}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 
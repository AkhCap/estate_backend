import Link from "next/link";
import { motion } from "framer-motion";
import { FaBed, FaRulerCombined, FaMapMarkerAlt, FaHeart, FaRegCalendarAlt } from "react-icons/fa";
import { formatPrice } from "../lib/utils";

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
  index: number;
  favorites?: Set<number>;
  onToggleFavorite?: (e: React.MouseEvent, propertyId: number) => void;
}

export default function PropertyCard({ property, index, favorites, onToggleFavorite }: PropertyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <Link href={`/properties/${property.id}`}>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
          {/* Изображение */}
          <div className="relative h-64">
            <img
              src={property.images[0] ? `${BASE_URL}/uploads/properties/${property.images[0].image_url}` : "/no-image.jpg"}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/no-image.jpg';
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <p className="text-white text-2xl font-bold">
                {formatPrice(property.price)}
              </p>
            </div>
            <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
              {getDealTypeLabel(property.deal_type)}
            </div>
            {favorites && onToggleFavorite && (
              <button
                onClick={(e) => onToggleFavorite(e, property.id)}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                  favorites.has(property.id)
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-white text-gray-400 hover:text-red-600 hover:bg-red-50'
                } shadow-lg`}
              >
                <FaHeart className={`w-5 h-5 ${favorites.has(property.id) ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>

          {/* Информация */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
            <div className="flex items-center text-gray-600 mb-4">
              <FaMapMarkerAlt className="mr-2" />
              <p className="text-sm line-clamp-1">{property.address || "Адрес не указан"}</p>
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
            <div className="flex items-center text-sm text-gray-500">
              <FaRegCalendarAlt className="w-4 h-4 mr-2" />
              <span>Создано: {formatDate(property.created_at)}</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
} 
import Link from "next/link";
import { motion } from "framer-motion";
import { FaHeart, FaRegCalendarAlt } from "react-icons/fa";
import { formatPrice } from "../lib/utils";
import Image from "next/image";

// Интерфейсы
interface Image {
    id: number;
    image_url: string;
    is_main?: boolean;
}

interface Property {
    id: number;
    title: string;
    price: number;
    rooms: string;
    area: number;
    deal_type: "sale" | "rent" | "daily";
    images: Image[];
    address: string;
    created_at: string;
    owner_id: number;
    is_viewed?: boolean;
    floor?: string;
    total_floors?: number;
}

// Форматирование даты
const formatDateLocal = (dateString: string | undefined): string => {
  if (!dateString) return 'Дата не указана';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Дата не указана';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (error) { return 'Дата не указана'; }
};

// Получение главного изображения
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const getMainImageUrl = (property: Property): string => {
  if (!property.images || property.images.length === 0) {
    return "/no-image.jpg";
  }
  const mainImage = property.images.find(img => img.is_main);
  const imageUrl = mainImage ? mainImage.image_url : property.images[0].image_url;
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  return `${BASE_URL}/uploads/properties/${imageUrl}`;
};

// Пропсы карточки
interface PropertyCardProps {
    property: Property;
    favorites: Set<number>;
    currentUserId?: number | null;
    toggleFavorite: (e: React.MouseEvent, propertyId: number) => void;
}

export default function PropertyCard({ property, favorites, currentUserId, toggleFavorite }: PropertyCardProps) {
    return (
        <motion.div className="group">
            <Link href={`/properties/${property.id}`}>
                <div className="bg-white rounded-3xl shadow-sm overflow-hidden transition-all duration-500 ease-in-out hover:shadow-md h-full flex flex-col relative group/card">
                    {/* Изображение с градиентом */}
                    <div className="relative h-[240px] flex-shrink-0 overflow-hidden">
                        <Image
                            src={getMainImageUrl(property)}
                            alt={property.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="transition-transform duration-700 ease-out group-hover/card:scale-105"
                            onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                target.srcset = '';
                                target.src = '/no-image.jpg';
                            }}
                        />
                        {/* Полупрозрачный оверлей с градиентом */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 ease-in-out" />
                        {/* Тип сделки */}
                        <div className="absolute top-4 left-4 px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-medium z-10 transition-transform duration-300 ease-out group-hover/card:translate-y-0.5">
                            {property.deal_type === 'sale' ? 'Продажа' : property.deal_type === 'rent' ? 'Аренда' : 'Посуточно'}
                        </div>
                        {/* Кнопка избранного */}
                        <button
                            onClick={(e) => toggleFavorite(e, property.id)}
                            className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ease-out backdrop-blur-md z-10 ${
                                favorites.has(property.id)
                                    ? 'bg-white/30 text-red-500 hover:bg-white/40'
                                    : 'bg-white/30 text-white hover:text-red-500 hover:bg-white/40'
                            }`}
                            aria-label={favorites.has(property.id) ? "Удалить из избранного" : "Добавить в избранное"}
                        >
                            <FaHeart className={`w-4 h-4 transition-transform duration-500 ease-out ${favorites.has(property.id) ? 'scale-110' : 'scale-100'}`} />
                        </button>
                        {property.is_viewed && property.owner_id !== currentUserId && (
                            <div className="absolute bottom-4 left-4 bg-blue-600/90 text-white px-3 py-1 rounded-full text-xs font-medium transition-opacity duration-300 ease-out group-hover/card:opacity-100">
                                Просмотрено
                            </div>
                        )}
                    </div>
                    {/* Информация */}
                    <div className="p-5 flex-grow flex flex-col transition-transform duration-300 ease-out group-hover/card:translate-y-[-0.25rem]">
                        {/* Цена */}
                        <div className="mb-3 flex items-baseline gap-2">
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(property.price)}</p>
                            {(property.deal_type === 'rent' || property.deal_type === 'daily') && (
                                <p className="text-sm text-gray-500">
                                    за {property.deal_type === 'rent' ? 'месяц' : 'сутки'}
                                </p>
                            )}
                        </div>
                        {/* Заголовок */}
                        <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1 group-hover/card:text-blue-600 transition-colors duration-300 ease-out">
                            {property.title}
                        </h3>
                        {/* Основные характеристики */}
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2 transition-opacity duration-300 ease-out group-hover/card:opacity-90">
                            <span>{property.rooms?.toLowerCase() === 'студия' ? 'Студия' : `${property.rooms}-комн.`}</span>
                            <span className="h-3 w-px bg-gray-300"></span>
                            <span>{property.area} м²</span>
                            {property.floor && (
                                <>
                                    <span className="h-3 w-px bg-gray-300"></span>
                                    <span>
                                        {property.floor}
                                        {property.total_floors ? ` из ${property.total_floors} этажей` : ' этаж'}
                                    </span>
                                </>
                            )}
                        </div>
                        {/* Адрес */}
                        <div className="flex text-gray-500 mb-2 transition-opacity duration-300 ease-out group-hover/card:opacity-90">
                            <p className="text-sm pr-2 truncate">{property.address}</p>
                        </div>
                        {/* Дата публикации */}
                        <div className="mt-auto pt-2 border-t border-gray-100 transition-opacity duration-300 ease-out group-hover/card:opacity-80">
                            <div className="flex items-center text-xs text-gray-400">
                                <FaRegCalendarAlt className="w-3.5 h-3.5 mr-1.5" />
                                <span>Создано: </span>
                                {formatDateLocal(property.created_at).replace(/\.$/, '')}, {new Date(property.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
 

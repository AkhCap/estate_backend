"use client";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaMapMarkerAlt, FaHome, FaDollarSign, FaRulerCombined, FaBed, FaChevronDown, FaChevronUp, FaFilter, FaTimes, FaHeart, FaRegCalendarAlt, FaCheck } from "react-icons/fa";
import { useRouter } from "next/navigation";
import axios from "../lib/axios"; // Используем настроенный axios
import { useAuth } from "@/app/context/AuthContext";
import { formatPrice } from "../lib/utils";
import Image from 'next/image'; // <<< Добавляем импорт Image из next/image >>>
import Footer from "../components/Footer"; // <<< Добавляем импорт Footer >>>
import { CheckCircle, Search, Users, Quote } from 'lucide-react'; // Удаляем Handshake из импорта
import SearchHero from './components/SearchHero';
import PopularDistricts from './components/PopularDistricts';

// <<< Определяем базовый URL API (лучше через .env.local) >>>
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Интерфейсы (можно вынести в отдельный файл types.ts)
interface Image {
    id: number;
    image_url: string;
    is_main?: boolean;
}

interface Property {
    id: number;
    title: string;
    price: number;
    rooms: string; // Оставляем строкой для совместимости, но будем обрабатывать
    area: number;
    deal_type: "sale" | "rent" | "daily";
    images: Image[];
    address: string;
    created_at: string;
    owner_id: number;
    is_viewed?: boolean; // Добавляем поле для значка "Просмотрено"
    floor?: string;
}

interface Filters {
    deal_type: string;
    location: string;
    rooms: string; // '1', '2', '3', '4+'
    price_min: string;
    price_max: string;
    area_min: string;
    property_type?: string; // Тип недвижимости
    renovation?: string;    // Состояние/ремонт
    floor_min?: string;     // Этаж от
    floor_max?: string;     // Этаж до
    year_min?: string;      // Год постройки от
    year_max?: string;      // Год постройки до
    amenities?: string[];   // Удобства (массив выбранных)
}

const dealTypes = [
    { value: "all", label: "Любой тип" },
    { value: "sale", label: "Продажа" },
    { value: "rent", label: "Аренда" },
    { value: "daily", label: "Посуточно" }
];

const roomOptions = [
    { value: "", label: "Любое" },
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4+", label: "4+" } // Используем '4+' для 4 и более комнат
];

// <<< Новые опции для фильтров >>>
const propertyTypeOptions = [
    { value: "", label: "Любой" },
    { value: "apartment", label: "Квартира" },
    { value: "house", label: "Дом" },
    { value: "commercial", label: "Коммерческая" },
    { value: "land", label: "Земельный участок" },
];

const renovationOptions = [
    { value: "", label: "Любое" },
    { value: "cosmetic", label: "Косметический" },
    { value: "euro", label: "Евроремонт" },
    { value: "design", label: "Дизайнерский" },
    { value: "needs_repair", label: "Требует ремонта" },
    { value: "rough_finish", label: "Черновая отделка" },
];

const amenityOptions = [
    { value: "balcony", label: "Балкон/Лоджия" },
    { value: "furniture", label: "Мебель" },
    { value: "kitchen_furniture", label: "Кухонная мебель" },
    { value: "internet", label: "Интернет" },
    { value: "air_conditioner", label: "Кондиционер" },
    { value: "washing_machine", label: "Стиральная машина" },
    { value: "fridge", label: "Холодильник" },
    { value: "tv", label: "Телевизор" },
    { value: "parking", label: "Парковка" },
];

// Компонент для кастомного селекта
const CustomSelect = ({ label, options, value, onChange, icon: Icon }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = options.find((opt: any) => opt.value === value)?.label || options[0]?.label;

    return (
        <div className="relative">
            <label className="block text-sm font-medium text-gray-200 mb-1">{label}</label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-white/30 border border-white/40 rounded-lg shadow-sm text-sm text-left focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:bg-white/40 transition duration-200"
            >
                <div className="flex items-center">
                    {Icon && <Icon className="w-4 h-4 mr-2 text-gray-100" />}
                    <span className="text-white font-medium">{selectedLabel}</span>
                </div>
                <FaChevronDown className={`w-4 h-4 text-gray-200 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-20 mt-1 w-full bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-lg py-1 text-sm max-h-60 overflow-auto"
                >
                    {options.map((option: any) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2 cursor-pointer text-gray-800 hover:bg-blue-100/50 ${option.value === value ? 'bg-blue-100/70 font-semibold' : ''}`}
                        >
                            {option.label}
                        </div>
                    ))}
                </motion.div>
            )}
        </div>
    );
};

// Компонент для инпута диапазона
const RangeInput = ({ label, valueMin, valueMax, onChangeMin, onChangeMax, placeholderMin, placeholderMax, icon: Icon }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">{label}</label>
        <div className="flex space-x-2">
            <div className="relative flex-1">
                {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-200" />}
                <input
                    type="number"
                    value={valueMin}
                    onChange={onChangeMin}
                    placeholder={placeholderMin}
                    className={`w-full px-4 py-2.5 bg-white/30 border border-white/40 rounded-lg shadow-sm text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:bg-white/40 transition duration-200 ${Icon ? 'pl-9' : ''}`}
                />
            </div>
            <div className="relative flex-1">
                {Icon && <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-200" />}
                <input
                    type="number"
                    value={valueMax}
                    onChange={onChangeMax}
                    placeholder={placeholderMax}
                    className={`w-full px-4 py-2.5 bg-white/30 border border-white/40 rounded-lg shadow-sm text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:bg-white/40 transition duration-200 ${Icon ? 'pl-9' : ''}`}
                />
            </div>
        </div>
    </div>
);

// <<< Добавляем локальную formatDate, если ее нет в utils >>>
const formatDateLocal = (dateString: string | undefined): string => {
  if (!dateString) return 'Дата не указана';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Дата не указана';
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (error) { return 'Дата не указана'; }
};

// <<< Определяем варианты анимации для секций >>>
const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { 
            duration: 0.6,
            ease: "easeOut" 
        }
    }
};

// Функция для получения главного изображения объявления
const getMainImageUrl = (property: Property): string => {
  if (!property.images || property.images.length === 0) {
    return "/no-image.jpg";
  }
  
  // Ищем главное изображение
  const mainImage = property.images.find(img => img.is_main);
  
  // Если главное изображение не найдено, берем первое
  const imageUrl = mainImage ? mainImage.image_url : property.images[0].image_url;
  
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  
  return `${BASE_URL}/uploads/properties/${imageUrl}`;
};

export default function HomePage() {
    const router = useRouter();
    const { user } = useAuth(); // Получаем пользователя для избранного и т.д.
    const [properties, setProperties] = useState<Property[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<Set<number>>(new Set());
    const [filters, setFilters] = useState<Filters>({
        deal_type: 'all',
        location: '',
        rooms: '',
        price_min: '',
        price_max: '',
        area_min: '',
        property_type: '',
        renovation: '',
        floor_min: '',
        floor_max: '',
        year_min: '',
        year_max: '',
        amenities: [],
    });
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const propertiesPerPage = 12;

    // Загрузка объявлений и избранного
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            const token = localStorage.getItem("token"); // Проверяем токен заранее
            try {
                // <<< Добавляем include_viewed=true если есть токен >>>
                const params: { limit: number; include_viewed?: boolean } = { limit: 8 };
                if (token) {
                    params.include_viewed = true;
                }

                const response = await axios.get(`/properties/list`, { params });
                setProperties(response.data || []);

                // Загрузка избранного, если пользователь авторизован
                if (token && user) {
                    try {
                        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                        const favoritesResponse = await axios.get(`/favorites`);
                        setFavorites(new Set(favoritesResponse.data.map((fav: any) => fav.property_id)));
                    } catch (favError) {
                        console.error('Error fetching favorites:', favError);
                    }
                }
            } catch (err) {
                console.error('Error fetching properties:', err);
                setError('Ошибка при загрузке объявлений');
                setProperties([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        if (user) {
            setCurrentUserId(user.id);
        }
    }, [user]);

    const handleFilterChange = (field: keyof Filters, value: string | boolean) => {
        setFilters(prev => {
            // Обработка чекбоксов удобств
            if (field === 'amenities') {
                const amenityValue = value as string; // Значение чекбокса (e.g., 'balcony')
                const currentAmenities = prev.amenities || [];
                let newAmenities: string[];
                
                if (currentAmenities.includes(amenityValue)) {
                    // Если уже есть - удаляем (чекбокс сняли)
                    newAmenities = currentAmenities.filter(item => item !== amenityValue);
                } else {
                    // Если нет - добавляем (чекбокс поставили)
                    newAmenities = [...currentAmenities, amenityValue];
                }
                return { ...prev, amenities: newAmenities };
            }
            
            // Обработка остальных полей
            return { ...prev, [field]: value as string }; // Приводим value к string для остальных
        });
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const searchParams = new URLSearchParams();

        // <<< Добавляем все фильтры в параметры запроса >>>
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'amenities' && Array.isArray(value) && value.length > 0) {
                searchParams.append(key, value.join(',')); 
            } else if (typeof value === 'string' && value.trim() !== '' && value !== 'all' && key !== 'amenities') {
                const paramKey = key === 'location' ? 'address' 
                             : key === 'price_min' ? 'min_price'
                             : key === 'price_max' ? 'max_price'
                             : key === 'area_min' ? 'min_area'
                             : key === 'year_min' ? 'min_year'
                             : key === 'year_max' ? 'max_year'
                             : key === 'floor_min' ? 'min_floor' // Добавляем min_floor/max_floor если бэк их ожидает
                             : key === 'floor_max' ? 'max_floor'
                             : key;
                searchParams.append(paramKey, value.trim());
            }
        });

        router.push(`/properties?${searchParams.toString()}`);
    };

    // Обработка избранного (оставляем логику из старой версии)
    const toggleFavorite = async (e: React.MouseEvent, propertyId: number) => {
        e.preventDefault();
        e.stopPropagation(); // Важно, чтобы не перейти на страницу объявления
        const token = localStorage.getItem('token');
        if (!token || !user) {
            router.push('/login?redirect=/properties/' + propertyId); // Редирект с возвратом
            return;
        }
        try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const isFavorite = favorites.has(propertyId);
            if (isFavorite) {
                await axios.delete(`/favorites/${propertyId}`);
                setFavorites(prev => {
                    const next = new Set(prev);
                    next.delete(propertyId);
                    return next;
                });
            } else {
                await axios.post(`/favorites`, { property_id: propertyId });
                setFavorites(prev => new Set(prev).add(propertyId));
            }
        } catch (err: any) {
            console.error('Ошибка при изменении избранного:', err);
            if (err.response?.status === 401) {
                // Возможно, стоит обработать автоматический выход
                router.push('/login');
            }
        }
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <SearchHero />
            <PopularDistricts />
            
            {/* Новая секция со статистикой */}
            <motion.section 
                className="py-12 bg-white"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Статистика */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                        {[
                            { number: "5,000+", label: "Объектов" },
                            { number: "1,200+", label: "Клиентов" },
                            { number: "500+", label: "Агентов" },
                            { number: "98%", label: "Довольных клиентов" }
                        ].map((stat, index) => (
                            <motion.div 
                                key={stat.label}
                                className="text-center bg-white p-6 rounded-2xl shadow-sm"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-4xl font-bold mb-2 text-blue-600">{stat.number}</div>
                                <div className="text-gray-600">{stat.label}</div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Преимущества */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Search,
                                title: "Умный поиск",
                                description: "Используйте расширенные фильтры для поиска идеального варианта. Находите объекты по районам, цене, площади и другим параметрам."
                            },
                            {
                                icon: Users,
                                title: "Проверенные агенты",
                                description: "Работайте только с проверенными специалистами. Все агенты проходят тщательную проверку и имеют подтвержденный рейтинг."
                            },
                            {
                                icon: CheckCircle,
                                title: "Гарантия качества",
                                description: "Мы проверяем каждое объявление на достоверность информации и соответствие заявленным характеристикам."
                            }
                        ].map((feature, index) => (
                            <motion.div 
                                key={feature.title}
                                className="bg-white rounded-2xl p-8 shadow-sm"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
                                    <feature.icon className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-gray-900">{feature.title}</h3>
                                <p className="text-gray-600">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

            {/* Секция объявлений */}
            <motion.section 
                className="py-12 bg-gray-50" 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6 md:mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold">Новые объявления</h2>
                        <Link
                            href="/properties"
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Смотреть все
                        </Link>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-600">
                            <p>{error}</p>
                        </div>
                    ) : properties.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>Пока нет доступных объявлений.</p>
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                            initial="hidden"
                            animate="show"
                            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                        >
                            {properties.map((property, index) => (
                                <motion.div
                                    key={property.id}
                                    variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                                    className="group"
                                >
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
                                                        const target = e.currentTarget;
                                                        target.srcset = '';
                                                        target.src = '/no-image.jpg'; 
                                                    }}
                                                />
                                                {/* Полупрозрачный оверлей с градиентом */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 ease-in-out" />
                                                
                                                {/* Тип сделки */}
                                                <div className="absolute top-4 left-4 px-3 py-1 bg-black/30 backdrop-blur-md rounded-full text-white text-xs font-medium z-10 transition-transform duration-300 ease-out group-hover/card:translate-y-0.5">
                                                    {property.deal_type === 'sale' ? 'Продажа' : 
                                                     property.deal_type === 'rent' ? 'Аренда' : 'Посуточно'}
                                                </div>

                                                {/* Кнопка избранного */}
                                                <button
                                                    onClick={(e) => toggleFavorite(e, property.id)}
                                                    className={`absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ease-out backdrop-blur-md z-10 ${
                                                        favorites.has(property.id)
                                                        ? 'bg-white/10 text-red-500'
                                                        : 'bg-white/10 text-white hover:text-red-500'
                                                    }`}
                                                    aria-label={favorites.has(property.id) ? "Удалить из избранного" : "Добавить в избранное"}
                                                >
                                                    <FaHeart className={`w-4 h-4 transition-transform duration-500 ease-out ${favorites.has(property.id) ? 'scale-110' : 'scale-100'}`} />
                                                </button>

                                                {/* Цена */}
                                                <div className="absolute bottom-4 inset-x-4 flex items-end justify-between z-10 transition-transform duration-300 ease-out group-hover/card:translate-y-[-0.5rem]">
                                                    <div>
                                                        <p className="text-2xl font-bold text-white mb-1 transition-transform duration-300 ease-out group-hover/card:translate-y-[-0.25rem]">{formatPrice(property.price)}</p>
                                                        {(property.deal_type === 'rent' || property.deal_type === 'daily') && (
                                                            <p className="text-xs text-white/70">
                                                                за {property.deal_type === 'rent' ? 'месяц' : 'сутки'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {property.is_viewed && property.owner_id !== currentUserId && (
                                                        <div className="bg-green-500/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs flex items-center gap-1.5 transition-opacity duration-300 ease-out group-hover/card:opacity-80">
                                                            <FaCheck className="w-3 h-3" />
                                                            Просмотрено
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Информация */}
                                            <div className="p-5 flex-grow flex flex-col transition-transform duration-300 ease-out group-hover/card:translate-y-[-0.25rem]">
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
                                                            <span>{property.floor} этаж</span>
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
                                                        {formatDateLocal(property.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>
            </motion.section>

            {/* Отзывы клиентов */}
            <motion.section
                className="py-12 bg-white"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Что говорят наши клиенты</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Отзыв 1 */}
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                            <Quote className="w-8 h-8 text-blue-500 mb-4 flex-shrink-0" aria-hidden="true" />
                            <p className="text-gray-600 italic mb-6 flex-grow">Нашли идеальную квартиру через EstateApp буквально за пару дней! Удобный поиск, много вариантов и фото соответствовали реальности. Очень довольны!</p>
                            <div className="mt-auto border-t border-gray-200 pt-4">
                                <p className="font-semibold text-gray-900">Александра В.</p>
                                <p className="text-sm text-gray-500">Покупатель квартиры</p>
                            </div>
                        </div>
                        {/* Отзыв 2 */}
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                            <Quote className="w-8 h-8 text-blue-500 mb-4 flex-shrink-0" aria-hidden="true" />
                            <p className="text-gray-600 italic mb-6 flex-grow">Продавал дом через этот сайт. Понравилось, что объявление разместить легко, и быстро нашлись заинтересованные покупатели. Рекомендую.</p>
                             <div className="mt-auto border-t border-gray-200 pt-4">
                                <p className="font-semibold text-gray-900">Максим П.</p>
                                <p className="text-sm text-gray-500">Продавец дома</p>
                            </div>
                        </div>
                        {/* Отзыв 3 */}
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 flex flex-col">
                            <Quote className="w-8 h-8 text-blue-500 mb-4 flex-shrink-0" aria-hidden="true" />
                            <p className="text-gray-600 italic mb-6 flex-grow">Снимали квартиру посуточно во время поездки. Все прошло гладко, связались с владельцем, квартира была точно как на фото. Спасибо сервису!</p>
                             <div className="mt-auto border-t border-gray-200 pt-4">
                                <p className="font-semibold text-gray-900">Елена и Сергей</p>
                                <p className="text-sm text-gray-500">Арендаторы</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* CTA секция */}
            <motion.section 
                className="bg-white py-8"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-4">Готовы начать?</h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Присоединяйтесь к тысячам довольных клиентов, которые уже нашли свой идеальный дом через наш сервис.
                            </p>
                            <Link
                                href="/create-property"
                                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                Разместить объявление
                            </Link>
                        </div>
                        <div className="relative h-64 md:h-80 flex items-center justify-center bg-white">
                            <Image
                                src="/illustrations/undraw_house-searching_g2b8.svg"
                                alt="Готовы начать"
                                fill
                                className="object-contain p-6"
                                style={{ objectPosition: 'center' }}
                            />
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                <Footer /> 
            </motion.div>
        </main>
    );
}

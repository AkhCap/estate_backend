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
import { CheckCircle, Search, Users, Handshake, Quote } from 'lucide-react'; // Добавляем иконки

// <<< Определяем базовый URL API (лучше через .env.local) >>>
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Интерфейсы (можно вынести в отдельный файл types.ts)
interface Image {
    id: number;
    image_url: string;
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
        <div className="min-h-screen bg-gray-50 text-gray-800 overflow-x-hidden"> {/* Добавляем overflow-x-hidden */}
            {/* Hero Section */}
            <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center text-white overflow-hidden">
                {/* Фоновое изображение */}
                <div
                    className="absolute inset-0 bg-cover bg-center brightness-[.6]"
                    style={{
                        backgroundImage: "url('/dushanbe-night.jpg')", // Убедись, что путь верный
                    }}
                />
                {/* Градиент поверх */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>

                {/* Контент Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 container mx-auto px-4 text-center w-full"
                >
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight drop-shadow-md">Найди свой идеальный дом</h1>
                    <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto drop-shadow">Исследуй тысячи предложений недвижимости легко и удобно.</p>

                    {/* Форма поиска - Стили стекла */}
                    <form
                        onSubmit={handleSearch}
                        className="bg-black/20 backdrop-blur-md p-4 md:p-6 rounded-2xl border border-white/30 shadow-xl max-w-5xl mx-auto text-left mt-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {/* Локация */}
                            <div className="lg:col-span-2">
                                <label htmlFor="location" className="block text-sm font-medium text-gray-200 mb-1">Локация</label>
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-200" />
                                    <input
                                        id="location"
                                        type="text"
                                        value={filters.location}
                                        onChange={(e) => handleFilterChange('location', e.target.value)}
                                        placeholder="Город, район, улица..."
                                        className="w-full pl-9 pr-4 py-2.5 bg-white/30 border border-white/40 rounded-lg shadow-sm text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:bg-white/40 transition duration-200"
                                    />
                                </div>
                            </div>

                            {/* Тип сделки */}
                            <CustomSelect
                                label="Тип сделки"
                                options={dealTypes}
                                value={filters.deal_type}
                                onChange={(val: string) => handleFilterChange('deal_type', val)}
                                icon={FaHome}
                            />

                            {/* Комнаты */}
                            <CustomSelect
                                label="Комнаты"
                                options={roomOptions}
                                value={filters.rooms}
                                onChange={(val: string) => handleFilterChange('rooms', val)}
                                icon={FaBed}
                            />
                        </div>

                        {/* Расширенные фильтры - применяем стили к внутренним элементам */}
                        {showAdvancedFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pt-4 border-t border-white/30 overflow-hidden"
                            >
                                {/* Тип недвижимости */}
                                <CustomSelect
                                    label="Тип недвижимости"
                                    options={propertyTypeOptions}
                                    value={filters.property_type || ''}
                                    onChange={(val: string) => handleFilterChange('property_type', val)}
                                />
                                {/* Ремонт */}
                                <CustomSelect
                                    label="Ремонт"
                                    options={renovationOptions}
                                    value={filters.renovation || ''}
                                    onChange={(val: string) => handleFilterChange('renovation', val)}
                                />
                                {/* Этаж */}
                                <RangeInput
                                    label="Этаж"
                                    valueMin={filters.floor_min || ''}
                                    valueMax={filters.floor_max || ''}
                                    onChangeMin={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('floor_min', e.target.value)}
                                    onChangeMax={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('floor_max', e.target.value)}
                                    placeholderMin="От"
                                    placeholderMax="До"
                                />
                                {/* Год постройки */}
                                <RangeInput
                                    label="Год постройки"
                                    valueMin={filters.year_min || ''}
                                    valueMax={filters.year_max || ''}
                                    onChangeMin={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('year_min', e.target.value)}
                                    onChangeMax={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('year_max', e.target.value)}
                                    placeholderMin="От"
                                    placeholderMax="До"
                                />
                                {/* Цена */}
                                <RangeInput
                                    label="Цена (TJS)"
                                    valueMin={filters.price_min}
                                    valueMax={filters.price_max}
                                    onChangeMin={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('price_min', e.target.value)}
                                    onChangeMax={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange('price_max', e.target.value)}
                                    placeholderMin="От"
                                    placeholderMax="До"
                                    icon={FaDollarSign}
                                />
                                {/* Площадь */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-1">Площадь (м²)</label>
                                    <div className="relative">
                                        <FaRulerCombined className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-200" />
                                        <input
                                            type="number"
                                            value={filters.area_min}
                                            onChange={(e) => handleFilterChange('area_min', e.target.value)}
                                            placeholder="От"
                                            className="w-full pl-9 pr-4 py-2.5 bg-white/30 border border-white/40 rounded-lg shadow-sm text-sm text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 focus:bg-white/40 transition duration-200"
                                        />
                                    </div>
                                </div>
                                
                                {/* Удобства */}
                                <div className="md:col-span-2 lg:col-span-4">
                                    <label className="block text-sm font-medium text-gray-200 mb-2">Удобства</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
                                        {amenityOptions.map((amenity) => (
                                            <label key={amenity.value} className="flex items-center space-x-2 cursor-pointer text-sm group">
                                                <input
                                                    type="checkbox"
                                                    value={amenity.value}
                                                    checked={(filters.amenities || []).includes(amenity.value)}
                                                    onChange={(e) => handleFilterChange('amenities', e.target.value)}
                                                    className="rounded border-white/40 bg-transparent text-blue-400 shadow-sm focus:ring-blue-400 focus:ring-offset-0 focus:ring-2 transition duration-200"
                                                />
                                                <span className="text-gray-100 group-hover:text-white transition duration-200">{amenity.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Кнопки управления - обновленные стили */}
                        <div className="flex flex-col sm:flex-row justify-between items-center pt-5 border-t border-white/30 mt-4">
                            <button
                                type="button"
                                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                className="flex items-center text-sm font-medium text-white/80 hover:text-white transition duration-200 mb-4 sm:mb-0"
                            >
                                {showAdvancedFilters ? <FaChevronUp className="w-3 h-3 mr-1.5" /> : <FaFilter className="w-3 h-3 mr-1.5" />}
                                {showAdvancedFilters ? 'Меньше фильтров' : 'Больше фильтров'}
                            </button>
                            <button
                                type="submit"
                                className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-3 rounded-lg shadow-lg transition duration-300 transform hover:scale-105 font-semibold flex items-center justify-center"
                            >
                                <FaSearch className="w-4 h-4 mr-2" />
                                Найти
                            </button>
                        </div>
                    </form>
                </motion.div>
            </section>

            {/* Информационная секция - добавляем анимацию */}
            <motion.section 
                className="py-16 bg-gray-50" 
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">
                        {/* <<< Оборачиваем блок в "карточку" >>> */}
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100"> 
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Почему выбирают нас?</h2>
                            <ul className="space-y-6"> {/* Увеличиваем space-y */} 
                                <li className="flex items-start group p-3 rounded-lg hover:bg-green-50 transition-colors duration-200"> {/* Добавляем hover и padding */} 
                                    <div className="flex-shrink-0">
                                        {/* <<< Увеличиваем иконку >>> */}
                                        <CheckCircle className="h-7 w-7 text-green-500 group-hover:text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">Большая база объектов</h4>
                                        <p className="mt-1 text-sm text-gray-600">Тысячи актуальных объявлений квартир, домов и коммерческой недвижимости.</p>
                                    </div>
                                </li>
                                <li className="flex items-start group p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
                                    <div className="flex-shrink-0">
                                        <CheckCircle className="h-7 w-7 text-green-500 group-hover:text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">Проверенные объявления</h4>
                                        <p className="mt-1 text-sm text-gray-600">Мы тщательно проверяем информацию, чтобы вы были уверены в своем выборе.</p>
                                    </div>
                                </li>
                                <li className="flex items-start group p-3 rounded-lg hover:bg-green-50 transition-colors duration-200">
                                    <div className="flex-shrink-0">
                                        <CheckCircle className="h-7 w-7 text-green-500 group-hover:text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">Удобный поиск и фильтры</h4>
                                        <p className="mt-1 text-sm text-gray-600">Настройте поиск под свои нужды с помощью детальных фильтров.</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* <<< Оборачиваем блок в "карточку" >>> */}
                        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">Как это работает?</h2>
                            <ol className="space-y-6"> {/* Увеличиваем space-y */} 
                                <li className="flex items-start group p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200"> {/* Добавляем hover и padding */} 
                                    <div className="flex-shrink-0">
                                        {/* <<< Увеличиваем padding иконки в круге >>> */}
                                        <div className="flex items-center justify-center h-11 w-11 rounded-full bg-blue-50 border border-blue-200 group-hover:bg-blue-100 transition-colors duration-200">
                                            <Search className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">1. Найдите</h4>
                                        <p className="mt-1 text-sm text-gray-600">Используйте поиск и фильтры, чтобы найти подходящие вам варианты.</p>
                                    </div>
                                </li>
                                <li className="flex items-start group p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-11 w-11 rounded-full bg-blue-50 border border-blue-200 group-hover:bg-blue-100 transition-colors duration-200">
                                            <Users className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">2. Свяжитесь</h4>
                                        <p className="mt-1 text-sm text-gray-600">Свяжитесь с владельцем или агентом напрямую через нашу платформу.</p>
                                    </div>
                                </li>
                                <li className="flex items-start group p-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center h-11 w-11 rounded-full bg-blue-50 border border-blue-200 group-hover:bg-blue-100 transition-colors duration-200">
                                            <Handshake className="h-5 w-5 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <h4 className="text-lg font-medium text-gray-900">3. Заключите сделку</h4>
                                        <p className="mt-1 text-sm text-gray-600">Договоритесь об условиях и оформите сделку безопасно.</p>
                                    </div>
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* <<< Новая секция: Отзывы клиентов >>> */}
            <motion.section
                className="py-16 bg-gray-50" // Фон как у основной страницы
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Что говорят наши клиенты</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

            {/* Секция объявлений - добавляем анимацию */}
            <motion.section 
                className="py-16" 
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }} // Меньший amount, т.к. секция высокая
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-8 md:mb-12">
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
                        <> {/* Обертка для grid и pagination */} 
                            <motion.div
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                                // Убираем stagger с grid, т.к. анимируется вся секция
                                initial="hidden" // Можно оставить для карточек, если хочется двойной анимации
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
                                            <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl h-full flex flex-col">
                                                <div className="relative h-[200px] flex-shrink-0">
                                                    <Image
                                                        src={property.images?.[0]?.image_url 
                                                             ? `${BASE_URL}/uploads/properties/${property.images[0].image_url}`
                                                             : "/no-image.jpg"} 
                                                        alt={property.title}
                                                        fill
                                                        style={{ objectFit: 'cover' }}
                                                        className="transition-transform duration-300 group-hover:scale-105"
                                                        onError={(e) => { 
                                                            const target = e.currentTarget;
                                                            target.srcset = '';
                                                            target.src = '/no-image.jpg'; 
                                                        }}
                                                    />
                                                    {property.is_viewed && property.owner_id !== currentUserId && (
                                                        <div className="absolute top-4 left-4 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 z-10">
                                                            <FaCheck className="w-2.5 h-2.5" />
                                                            Просмотрено
                                                        </div>
                                                    )}
                                                    {user && (
                                                        <button
                                                            onClick={(e) => toggleFavorite(e, property.id)}
                                                            className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${ 
                                                                favorites.has(property.id)
                                                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                                                : 'bg-white text-gray-400 hover:text-red-600 hover:bg-red-50'
                                                            } shadow-lg z-10`}
                                                            aria-label={favorites.has(property.id) ? "Удалить из избранного" : "Добавить в избранное"}
                                                        >
                                                            <FaHeart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-current' : ''}`} />
                                                        </button>
                                                    )}
                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                                        <p className="text-white text-xl font-bold">
                                                            {formatPrice(property.price)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="p-4 flex-grow flex flex-col">
                                                    <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1 flex-shrink-0">{property.title}</h3>
                                                    <div className="flex items-center text-gray-600 mb-3 flex-shrink-0">
                                                        <FaMapMarkerAlt className="mr-1.5 w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                                                        <p className="text-sm line-clamp-1">{property.address}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-gray-600 mb-2 flex-shrink-0">
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <FaBed className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-gray-400" />
                                                            <span>{property.rooms?.toLowerCase() === 'студия' ? 'Студия' : `${property.rooms} комнат`}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm">
                                                            <FaRulerCombined className="w-3.5 h-3.5 mr-1 flex-shrink-0 text-gray-400" />
                                                            Площадь: {property.area} м²
                                                        </div>
                                                    </div>
                                                    <div className="mt-auto pt-2 flex items-center text-xs text-gray-500 flex-shrink-0">
                                                        <FaRegCalendarAlt className="w-3.5 h-3.5 mr-1.5 flex-shrink-0 text-gray-400" />
                                                        <span>Создано: {formatDateLocal(property.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </motion.div>

                            {/* Пагинация - Условие использует totalPages */}
                            {!loading && totalPages > 1 && (
                                <div className="mt-12 flex justify-center space-x-2">
                                     {[...Array(totalPages).keys()].map((page) => (
                                        <button
                                            key={page + 1}
                                            // onClick={() => fetchProperties(page + 1, filters)} // Ошибка была не здесь
                                            // ... rest of button ...
                                        >
                                            {page + 1}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </motion.section>

            {/* CTA секция - добавляем анимацию */}
            <motion.section 
                className="bg-blue-50 py-16"
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                       {/* ... код CTA блоков ... */} 
                    </div>
                </div>
            </motion.section>

            {/* Footer - можно тоже добавить анимацию */}
            <motion.div
                variants={sectionVariants} // Используем те же варианты
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
            >
                <Footer /> 
            </motion.div>
        </div>
    );
}
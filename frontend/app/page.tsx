"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaHome, FaBuilding, FaHotel, FaBed, FaRulerCombined, FaMoneyBillWave, FaMapMarkerAlt, FaHeart, FaRegCalendarAlt, FaCheck, FaEye } from "react-icons/fa";
import { formatPrice } from "../lib/utils";
import { useRouter } from "next/navigation";
import PropertyCard from "../components/PropertyCard";
import axios from "axios";

// Добавляем базовый URL для изображений
const BASE_URL = "http://localhost:8000";

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
  deal_type: "sale" | "rent" | "daily";
  images: Image[];
  address: string;
  created_at: string;
  is_viewed: boolean;
  owner_id: number;
}

// Функция форматирования даты
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

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [rooms, setRooms] = useState("");
  const [area, setArea] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isRoomsOpen, setIsRoomsOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Добавляем опции для выпадающих списков
  const dealTypes = [
    { value: "all", label: "Все типы" },
    { value: "sale", label: "Продажа" },
    { value: "rent", label: "Аренда" },
    { value: "daily", label: "Посуточно" }
  ];

  const roomOptions = [
    { value: "", label: "Любое" },
    { value: "1", label: "1 комната" },
    { value: "2", label: "2 комнаты" },
    { value: "3", label: "3 комнаты" },
    { value: "4", label: "4+ комнат" }
  ];

  // Закрываем выпадающие списки при клике вне их области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-select')) {
        setIsTypeOpen(false);
        setIsRoomsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Загружаем объявления
        const response = await axios.get(`${BASE_URL}/properties/list`, {
          params: {
            include_viewed: true,
            limit: 8
          }
        });
        
        // Получаем сохраненные просмотры из localStorage
        const viewedProperties = JSON.parse(localStorage.getItem('viewedProperties') || '{}');
        
        // Сохраняем данные с учетом статуса просмотра
        const propertiesWithViewed = response.data.map(property => ({
          ...property,
          is_viewed: property.is_viewed || viewedProperties[property.id] || false
        }));
        
        setProperties(propertiesWithViewed);

        // Проверяем авторизацию и загружаем избранное
        const token = localStorage.getItem("token");
        if (token) {
          try {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const [userResponse, favoritesResponse] = await Promise.all([
              axios.get(`${BASE_URL}/users/me`),
              axios.get(`${BASE_URL}/favorites`)
            ]);
            setCurrentUserId(userResponse.data.id);
            const favoritesData = favoritesResponse.data;
            setFavorites(new Set(favoritesData.map((fav: any) => fav.property_id)));
            setIsAuthenticated(true);
          } catch (err) {
            console.error('Error fetching favorites:', err);
            localStorage.removeItem("token");
            setIsAuthenticated(false);
            setCurrentUserId(null);
          }
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Ошибка при загрузке данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Фильтрация объявлений по параметрам
  const filteredListings = Array.isArray(properties) ? properties.filter((property) => {
    return (
      (selectedCategory === "all" || property.deal_type === selectedCategory) &&
      (!priceMin || property.price >= parseInt(priceMin)) &&
      (!priceMax || property.price <= parseInt(priceMax)) &&
      (!rooms || property.rooms === rooms) &&
      (!area || property.area >= parseInt(area)) &&
      (!search || property.title.toLowerCase().includes(search.toLowerCase()))
    );
  }) : [];

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const searchParams = new URLSearchParams();
    
    for (const [key, value] of formData.entries()) {
      if (value && typeof value === 'string') {
        searchParams.append(key, value);
      }
    }
    
    router.push(`/properties?${searchParams.toString()}`);
  };

  const toggleFavorite = async (e: React.MouseEvent, propertyId: number) => {
    e.preventDefault(); // Предотвращаем переход по ссылке
    
    const token = localStorage.getItem('token');
    if (!token || !isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      // Устанавливаем заголовок авторизации
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      if (favorites.has(propertyId)) {
        await axios.delete(`${BASE_URL}/favorites/${propertyId}`);
        setFavorites(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      } else {
        await axios.post(`${BASE_URL}/favorites`, { property_id: propertyId });
        setFavorites(prev => new Set([...prev, propertyId]));
      }
    } catch (err) {
      console.error('Ошибка при изменении избранного:', err);
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        router.push('/login');
      }
    }
  };

  // Добавляем обработчик клика по карточке
  const handlePropertyClick = (propertyId: number) => {
    // Обновляем статус просмотра в localStorage
    const viewedProperties = JSON.parse(localStorage.getItem('viewedProperties') || '{}');
    viewedProperties[propertyId] = true;
    localStorage.setItem('viewedProperties', JSON.stringify(viewedProperties));
    
    // Обновляем состояние
    setProperties(prevProperties => 
      prevProperties.map(property => 
        property.id === propertyId 
          ? { ...property, is_viewed: true }
          : property
      )
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-xl font-semibold mb-2">Ошибка загрузки данных</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative h-[600px]">
        {/* Фоновое изображение */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/dushanbe-night.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-center mb-8"
          >
            Найдите идеальное жилье
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-center mb-12 max-w-2xl"
          >
            Тысячи объявлений недвижимости в одном месте. Купить, снять или сдать - все просто!
          </motion.p>
          
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-4 flex items-center"
          >
            <FaSearch className="text-gray-400 text-xl mr-4" />
            <input
              type="text"
              placeholder="Введите город, район, улицу или ЖК..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-gray-800 text-lg focus:outline-none"
            />
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Поиск
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Категории недвижимости</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer hover:shadow-xl transition-shadow"
            >
              <FaHome className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Квартиры</h3>
              <p className="text-gray-600">Купить или снять квартиру</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer hover:shadow-xl transition-shadow"
            >
              <FaBuilding className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Дома</h3>
              <p className="text-gray-600">Частные дома и коттеджи</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer hover:shadow-xl transition-shadow"
            >
              <FaHotel className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Посуточно</h3>
              <p className="text-gray-600">Апартаменты на короткий срок</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Поиск недвижимости
              </h2>
              <p className="text-gray-600 text-lg">
                Найдите идеальный вариант с помощью удобных фильтров
              </p>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-2xl p-8 backdrop-blur-sm bg-white/80 border border-gray-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Тип сделки */}
              <div className="space-y-2 custom-select">
                <label className="block text-sm font-semibold text-gray-700">Тип сделки</label>
                <div className="relative">
                  <div
                    onClick={() => setIsTypeOpen(!isTypeOpen)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
                  >
                    <span>{dealTypes.find(type => type.value === selectedCategory)?.label}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isTypeOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {isTypeOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-60 overflow-auto">
                      {dealTypes.map((type) => (
                        <div
                          key={type.value}
                          onClick={() => {
                            setSelectedCategory(type.value);
                            setIsTypeOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                        >
                          {type.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Количество комнат */}
              <div className="space-y-2 custom-select">
                <label className="block text-sm font-semibold text-gray-700">Количество комнат</label>
                <div className="relative">
                  <div
                    onClick={() => setIsRoomsOpen(!isRoomsOpen)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all duration-200 flex items-center justify-between"
                  >
                    <span>{roomOptions.find(option => option.value === rooms)?.label || "Любое"}</span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isRoomsOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {isRoomsOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 max-h-60 overflow-auto">
                      {roomOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => {
                            setRooms(option.value);
                            setIsRoomsOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors duration-200"
                        >
                          {option.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Площадь</label>
                <input
                  type="number"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Минимальная площадь"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Цена от</label>
                <div className="relative">
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="Минимальная цена"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <span className="text-gray-400">₽</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Цена до</label>
                <div className="relative">
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="Максимальная цена"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-gray-100"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <span className="text-gray-400">₽</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка объявлений...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : !Array.isArray(properties) ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">Ошибка: данные не являются массивом</p>
              <p className="mt-2 text-gray-500">Получено: {JSON.stringify(properties)}</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">Объявлений пока нет</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Популярные объявления</h2>
                <Link
                  href="/properties"
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
                >
                  Смотреть все
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {properties.slice(0, 8).map((property) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group relative"
                    onClick={() => handlePropertyClick(property.id)}
                  >
                    <Link href={`/properties/${property.id}`}>
                      <div className="bg-white rounded-xl shadow-md overflow-hidden">
                        {/* Изображение */}
                        <div className="relative h-[200px]">
                          <img
                            src={property.images[0] ? `${BASE_URL}/uploads/properties/${property.images[0].image_url}` : "/no-image.jpg"}
                            alt={property.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/no-image.jpg';
                            }}
                          />
                          {property.is_viewed && property.owner_id !== currentUserId && (
                            <div className="absolute top-4 left-4 bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                              <FaCheck className="w-2.5 h-2.5" />
                              Просмотрено
                            </div>
                          )}
                          <button
                            onClick={(e) => toggleFavorite(e, property.id)}
                            className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
                              favorites.has(property.id)
                                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                : 'bg-white text-gray-400 hover:text-red-600 hover:bg-red-50'
                            } shadow-lg`}
                          >
                            <FaHeart className={`w-4 h-4 ${favorites.has(property.id) ? 'fill-current' : ''}`} />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <p className="text-white text-xl font-bold">
                              {formatPrice(property.price)}
                            </p>
                          </div>
                        </div>

                        {/* Информация */}
                        <div className="p-4">
                          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1">{property.title}</h3>
                          <div className="flex items-center text-gray-600 mb-3">
                            <FaMapMarkerAlt className="mr-1 w-3 h-3" />
                            <p className="text-sm line-clamp-1">{property.address || "Адрес не указан"}</p>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <FaBed className="w-3 h-3" />
                              <span className="text-sm">{property.rooms} комнат</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <FaRulerCombined className="w-3 h-3" />
                              <span className="text-sm">Площадь: {property.area} м²</span>
                            </div>
                          </div>
                          <div className="flex items-center text-xs text-gray-500">
                            <FaRegCalendarAlt className="w-3 h-3 mr-1" />
                            <span>Создано: {formatDate(property.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Готовы найти свой идеальный дом?</h2>
          <p className="text-xl mb-8">Присоединяйтесь к тысячам довольных клиентов</p>
          <div className="flex justify-center gap-4">
            <Link href="/create-property">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Создать объявление
              </button>
            </Link>
            <Link href="/properties">
              <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors">
                Смотреть все объявления
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
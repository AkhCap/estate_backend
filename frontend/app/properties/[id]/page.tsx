// Файл: app/properties/page.tsx
"use client";

import React from 'react';
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaBed, FaRulerCombined, FaBuilding, FaCar, FaThermometerHalf, FaStar, FaMapMarkerAlt, FaRegCalendarAlt, FaRegListAlt, FaHeart, FaChevronLeft, FaChevronRight, FaTimes, FaChild, FaPaw, FaArrowRight, FaBath, FaShower, FaWindowMaximize, FaHashtag, FaEye, FaRulerVertical, FaWifi, FaUser } from "react-icons/fa";
import ImageCarousel from "../../../components/ImageCarousel";

const BASE_URL = "http://localhost:8000";

interface Image {
  id: number;
  image_url: string;
}

interface PriceHistory {
  id: number;
  price: number;
  change_date: string;
}

interface Property {
  id: number;
  title: string;
  description: string;
  price: number;
  address: string;
  rooms: string;
  area: number;
  floor: number;
  total_floors: number;
  property_type: string;
  deal_type: string;
  property_condition: string;
  has_balcony: boolean;
  window_view: string[];
  bathroom: string;
  bath_type: string;
  heating: string;
  renovation: string;
  lifts_passenger: number;
  lifts_freight: number;
  parking: string[];
  prepayment: string;
  deposit: number;
  living_conditions: string[];
  who_rents: string;
  landlord_contact: string;
  contact_method: string[];
  owner_id: number;
  images: Image[];
  build_year: number;
  furniture: string[];
  appliances: string[];
  connectivity: string[];
  ceiling_height: number;
  rent_duration?: string;
  apartment_number?: string;
  price_history?: PriceHistory[];
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string | null;
  rating: number | null;
  reviews_count: number;
  created_at: string;
  properties_count: number;
}

interface ImageGalleryProps {
  images: string[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const nextImage = (e) => {
    e.stopPropagation();
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevImage = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleImageError = (e) => {
    e.target.src = '/no-image.jpg';
  };

  return (
    <div className="relative w-full h-[400px] bg-gray-100 rounded-2xl overflow-hidden">
      {/* Основное изображение */}
      <div 
        className="w-full h-full cursor-pointer"
        onClick={() => setShowLightbox(true)}
      >
        <img
          src={`${BASE_URL}${images[currentIndex]}`}
          alt={`Фото ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      </div>

      {/* Счетчик фотографий */}
      <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
        {currentIndex + 1}/{images.length}
      </div>

      {/* Кнопки навигации */}
      {currentIndex > 0 && (
        <button
          onClick={prevImage}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
        >
          <FaChevronLeft className="text-gray-800" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          onClick={nextImage}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-lg transition-all"
        >
          <FaChevronRight className="text-gray-800" />
        </button>
      )}

      {/* Лайтбокс */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setShowLightbox(false)}
          >
            <FaTimes size={24} />
          </button>
          
          <div className="relative max-w-7xl w-full h-full p-4 flex items-center justify-center">
            <img
              src={`${BASE_URL}${images[currentIndex]}`}
              alt={`Фото ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onError={handleImageError}
            />
            
            {/* Кнопки навигации в лайтбоксе */}
            {currentIndex > 0 && (
              <button
                onClick={prevImage}
                className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <FaChevronLeft className="text-white text-xl" />
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={nextImage}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <FaChevronRight className="text-white text-xl" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const PropertyDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [showPhone, setShowPhone] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newPrice, setNewPrice] = useState<string>('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isPriceHistoryExpanded, setIsPriceHistoryExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  const renderDescription = () => {
    if (!property?.description) return null;
    
    const maxLength = 150;
    const shouldTruncate = property.description.length > maxLength && !isDescriptionExpanded;
    const displayText = shouldTruncate 
      ? property.description.slice(0, maxLength) + '...' 
      : property.description;

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium text-gray-700">Описание</span>
        </div>
        <div className="text-sm text-gray-600 whitespace-pre-line">
          {displayText}
        </div>
        {property.description.length > maxLength && (
          <button
            onClick={toggleDescription}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {isDescriptionExpanded ? 'Свернуть' : 'Читать далее'}
          </button>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Загружаем данные объявления
        const propertyResponse = await axios.get(`/properties/${params.id}`, {
          params: {
            is_detail_view: true
          }
        });
        setProperty(propertyResponse.data);

        // Проверяем наличие токена в localStorage
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Пробуем загрузить данные пользователя
            const userResponse = await axios.get('/users/me');
            setCurrentUserId(userResponse.data.id);
            setIsAuthenticated(true);
          } catch (err) {
            // Если получаем 401, значит токен недействителен
            if (err.response?.status === 401) {
              localStorage.removeItem('token');
              setIsAuthenticated(false);
              setCurrentUserId(null);
            }
          }
        } else {
          setIsAuthenticated(false);
          setCurrentUserId(null);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Ошибка при загрузке данных");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id]);

  // Добавляем функцию для обновления данных
  const refreshPropertyData = async () => {
    if (!params?.id) return;
    try {
      const propertyResponse = await axios.get(`/properties/${params.id}`, {
        params: {
          is_detail_view: true
        }
      });
      setProperty(propertyResponse.data);
    } catch (err) {
      console.error("Error refreshing property data:", err);
    }
  };

  // Добавляем обработчик изменения цены
  const handlePriceChange = async (newPrice: number) => {
    if (!property) return;
    try {
      console.log("Отправляем запрос на обновление цены:", newPrice);
      console.log("Текущая цена:", property.price);
      const response = await axios.put(`/properties/${property.id}`, {
        price: newPrice
      });
      console.log("Ответ от сервера:", response.data);
      console.log("Цена успешно обновлена");
      // Обновляем данные после изменения цены
      await refreshPropertyData();
      console.log("Данные обновлены после изменения цены");
    } catch (err) {
      console.error("Error updating price:", err);
      setError("Ошибка при обновлении цены");
    }
  };

  // Изменяем обработчик изменения цены
  const handlePriceUpdate = () => {
    if (!property) return;
    setNewPrice(property.price.toString());
    setShowPriceModal(true);
  };

  // Добавляем обработчик сохранения новой цены
  const handleSavePrice = async () => {
    if (!property) return;
    
    const price = parseFloat(newPrice);
    if (isNaN(price) || price <= 0) {
      setError("Некорректная цена");
      return;
    }
    
    console.log("Новая цена:", price);
    console.log("Текущая цена:", property.price);
    await handlePriceChange(price);
    setShowPriceModal(false);
    setNewPrice('');
  };

  const toggleFavorite = async () => {
    if (!property) return;
    
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    try {
      if (isFavorite) {
        await axios.delete(`/favorites/${property.id}`);
        setIsFavorite(false);
      } else {
        await axios.post('/favorites', { property_id: property.id });
        setIsFavorite(true);
      }
    } catch (err) {
      console.error('Ошибка при изменении избранного:', err);
      if (err.response?.status === 401) {
        router.push('/login');
      }
    }
  };

  const handleContactClick = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    setShowPhone(true);
  };

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="text-red-500 text-center">{error}</div>
      </div>
    </div>
  );

  if (!property) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация (левая колонка) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Основная информация с фото и описанием */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-lg overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.title}</h1>
                  <div className="flex items-center text-gray-600">
                    <FaMapMarkerAlt className="mr-2" />
                    <p>{property.address}</p>
                  </div>
                </div>
              </div>

              {/* Карусель изображений */}
              <div className="relative w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden mb-6">
                <ImageCarousel
                  images={property.images.map(img => `${BASE_URL}/uploads/properties/${img.image_url}`)}
                />
              </div>

              {/* Описание */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Описание</h3>
                </div>
                <div className="text-gray-600 leading-relaxed">
                  {isDescriptionExpanded ? property.description : property.description?.slice(0, 280)}
                  {property.description && property.description.length > 280 && (
                    <>
                      {!isDescriptionExpanded && (
                        <span className="text-gray-400">...</span>
                      )}
                      <button
                        onClick={toggleDescription}
                        className="ml-2 text-blue-600 hover:text-blue-700 font-medium text-sm inline-flex items-center gap-0.5"
                      >
                        {isDescriptionExpanded ? (
                          <>
                            Свернуть
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </>
                        ) : (
                          <>
                            Читать далее
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Основные характеристики */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900">Основные характеристики</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaRulerCombined className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Площадь</div>
                    <div className="font-medium">{property.area} м²</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaBed className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Комнат</div>
                    <div className="font-medium">{property.rooms}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaRegListAlt className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Этаж</div>
                    <div className="font-medium">{property.floor}/{property.total_floors}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaStar className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Ремонт</div>
                    <div className="font-medium">{property.renovation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaThermometerHalf className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Отопление</div>
                    <div className="font-medium">{property.heating}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaBath className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Санузел</div>
                    <div className="font-medium">{property.bathroom}</div>
                  </div>
                </div>
                {property.bath_type && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FaShower className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Ванная</div>
                      <div className="font-medium">{property.bath_type}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaWindowMaximize className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Балкон</div>
                    <div className="font-medium">{property.has_balcony ? "Есть" : "Нет"}</div>
                  </div>
                </div>
                {property.window_view && property.window_view.length > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FaEye className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Вид из окна</div>
                      <div className="font-medium">{property.window_view.join(", ")}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaRulerVertical className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Высота потолков</div>
                    <div className="font-medium">{property.ceiling_height} м</div>
                  </div>
                </div>
                {property.apartment_number && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <FaHashtag className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Номер квартиры</div>
                      <div className="font-medium">{property.apartment_number}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* О доме */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900">О доме</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaBuilding className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Тип дома</div>
                    <div className="font-medium">{property.property_condition}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaRegListAlt className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Этажей в доме</div>
                    <div className="font-medium">{property.total_floors}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaRegCalendarAlt className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Год постройки</div>
                    <div className="font-medium">{property.build_year}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaCar className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Парковка</div>
                    <div className="font-medium">{property.parking?.join(", ") || "Нет"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <FaRegListAlt className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Лифты</div>
                    <div className="font-medium">
                      {property.lifts_passenger > 0 && `Пассажирский: ${property.lifts_passenger}`}
                      {property.lifts_freight > 0 && ` Грузовой: ${property.lifts_freight}`}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* В квартире есть */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-6 text-gray-900">В квартире есть</h2>
              <div className="space-y-4">
                {property.furniture && property.furniture.length > 0 && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                      <FaBed className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="font-semibold text-gray-900 mb-1">Мебель</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{property.furniture.join(", ")}</p>
                    </div>
                  </motion.div>
                )}
                {property.appliances && property.appliances.length > 0 && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center p-5 rounded-2xl bg-gradient-to-r from-green-50 to-green-100/50 border border-green-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shadow-sm">
                      <FaThermometerHalf className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="font-semibold text-gray-900 mb-1">Бытовая техника</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {property.appliances.map((appliance, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                            {appliance}
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                {property.connectivity && property.connectivity.length > 0 && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center p-5 rounded-2xl bg-gradient-to-r from-purple-50 to-purple-100/50 border border-purple-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shadow-sm">
                      <FaWifi className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="font-semibold text-gray-900 mb-1">Связь</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.connectivity.map((item, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Условия проживания */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-6 shadow-lg"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900">Условия проживания</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full ${property.living_conditions?.includes("children") ? "bg-green-100" : "bg-red-100"} flex items-center justify-center`}>
                    <FaChild className={property.living_conditions?.includes("children") ? "text-green-600" : "text-red-600"} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Можно с детьми</div>
                    <div className={`font-medium ${property.living_conditions?.includes("children") ? "text-green-600" : "text-red-600"}`}>
                      {property.living_conditions?.includes("children") ? "Разрешено" : "Не разрешено"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-8 h-8 rounded-full ${property.living_conditions?.includes("pets") ? "bg-green-100" : "bg-red-100"} flex items-center justify-center`}>
                    <FaPaw className={property.living_conditions?.includes("pets") ? "text-green-600" : "text-red-600"} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Домашние животные</div>
                    <div className={`font-medium ${property.living_conditions?.includes("pets") ? "text-green-600" : "text-red-600"}`}>
                      {property.living_conditions?.includes("pets") ? "Разрешено" : "Не разрешено"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-6">
            {/* Карточка с ценой и условиями */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl p-8 shadow-lg sticky top-6"
            >
              {/* Цена */}
              <div className="mb-8">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(property.price)}
                  </div>
                  <span className="text-gray-500">/ месяц</span>
                </div>
                {currentUserId === property.owner_id && (
                  <button
                    onClick={handlePriceUpdate}
                    className="mt-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Изменить цену
                  </button>
                )}

                {/* История изменения цены */}
                {property.price_history && property.price_history.length > 0 && (
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs text-gray-500 font-medium">История изменения цены</div>
                      <button
                        onClick={() => setIsPriceHistoryExpanded(!isPriceHistoryExpanded)}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        {isPriceHistoryExpanded ? 'Свернуть' : 'Развернуть'}
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className={`h-3 w-3 transform transition-transform ${isPriceHistoryExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                    <AnimatePresence>
                      {isPriceHistoryExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {[...property.price_history].reverse().map((history, index, arr) => {
                            const oldPrice = history.price;
                            const newPrice = index === 0 ? property.price : arr[index - 1].price;
                            const percentChange = ((newPrice - oldPrice) / oldPrice * 100).toFixed(1);
                            const date = new Date(history.change_date).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'long'
                            });
                            const isIncrease = newPrice > oldPrice;

                            return (
                              <div key={history.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${isIncrease ? "bg-red-400" : "bg-green-400"}`} />
                                  <span className="text-[13px] tabular-nums">
                                    {Math.floor(oldPrice).toLocaleString()} TJS
                                  </span>
                                  <FaArrowRight className={`w-3 h-3 ${isIncrease ? "text-red-400" : "text-green-400"}`} />
                                  <span className="text-[13px] tabular-nums">
                                    {Math.floor(newPrice).toLocaleString()} TJS
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[13px] font-medium ${isIncrease ? "text-red-500" : "text-green-500"}`}>
                                    {isIncrease ? "+" : ""}{percentChange}%
                                  </span>
                                  <span className="text-[11px] text-gray-400">{date}</span>
                                </div>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Условия */}
              <div className="space-y-6">
                {/* Предоплата и залог */}
                <div className="grid grid-cols-2 gap-4">
                  {property.prepayment && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <span className="block text-sm text-gray-500 mb-1">Предоплата</span>
                      <span className="font-medium text-gray-900">{property.prepayment}</span>
                    </div>
                  )}
                  {property.deposit > 0 && (
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <span className="block text-sm text-gray-500 mb-1">Залог</span>
                      <span className="font-medium text-gray-900">{formatPrice(property.deposit)}</span>
                    </div>
                  )}
                </div>

                {/* Способ связи */}
                {property.contact_method && property.contact_method.length > 0 && (
                  <div className="border-t border-gray-100 pt-6">
                    <span className="block text-sm text-gray-500 mb-3">Способ связи</span>
                    <div className="flex flex-wrap gap-2">
                      {property.contact_method.map((method) => (
                        <span 
                          key={method} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-600"
                        >
                          {method === "Чат" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          )}
                          {method}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Кнопки связи */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <button
                    onClick={handleContactClick}
                    className="w-full bg-blue-600 text-white py-3.5 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow flex items-center justify-center"
                  >
                    {showPhone ? (
                      <span className="flex items-center">
                        <span className="text-lg">{property.landlord_contact}</span>
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <span>Показать телефон</span>
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {/* TODO: Добавить функционал чата */}}
                    className="w-full bg-white text-blue-600 py-3.5 px-6 rounded-xl font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors duration-200 flex items-center justify-center"
                  >
                    Написать
                  </button>

                  <button
                    onClick={toggleFavorite}
                    className={`w-full py-3.5 px-6 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center ${
                      isFavorite 
                        ? 'bg-red-50 text-red-600 border-2 border-red-600 hover:bg-red-100' 
                        : 'bg-white text-gray-600 border-2 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <FaHeart className={`mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                    {isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Модальное окно для изменения цены */}
      {showPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Изменить цену</h3>
              <button
                onClick={() => setShowPriceModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Новая цена (TJS)
              </label>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Введите новую цену"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowPriceModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Отмена
              </button>
              <button
                onClick={handleSavePrice}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetailPage;
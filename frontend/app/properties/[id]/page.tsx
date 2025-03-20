// Файл: app/properties/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaBed, FaRulerCombined, FaBuilding, FaCar, FaThermometerHalf, FaStar, FaMapMarkerAlt, FaRegCalendarAlt, FaRegListAlt, FaHeart, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import ImageCarousel from "../../../components/ImageCarousel";

const BASE_URL = "http://localhost:8000";

interface Image {
  id: number;
  image_url: string;
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

const ImageGallery = ({ images }) => {
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

export default function PropertyDetailPage() {
  const params = useParams();
  const [property, setProperty] = useState<Property | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [error, setError] = useState("");
  const [showPhone, setShowPhone] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!params?.id) return;
      try {
        console.log("Fetching property with ID:", params.id);
        const propertyResponse = await axios.get(`/properties/${params.id}`, {
          params: {
            is_detail_view: true
          }
        });
        console.log("Property data:", propertyResponse.data);
        setProperty(propertyResponse.data);
        
        // Проверяем, есть ли объявление в избранном
        try {
          const favoritesResponse = await axios.get('/favorites');
          const favorites = favoritesResponse.data;
          setIsFavorite(favorites.some((fav: any) => fav.property_id === propertyResponse.data.id));
        } catch (err) {
          console.error('Ошибка при проверке избранного:', err);
        }
      } catch (err: any) {
        console.error("Error fetching property:", err);
        setError(err.response?.data?.detail || "Ошибка при загрузке данных");
      }
    };
    fetchProperty();
  }, [params?.id]);

  const toggleFavorite = async () => {
    if (!property) return;
    
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
    }
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
            {/* Заголовок и адрес */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{property.title}</h1>
              <div className="flex items-center text-gray-600">
                <FaMapMarkerAlt className="mr-2" />
                <p>{property.address}</p>
              </div>
            </motion.div>

            {/* Карусель изображений */}
            <div className="relative w-full h-[500px] bg-gray-100 rounded-2xl overflow-hidden">
              <ImageCarousel
                images={property.images.map(img => `${BASE_URL}/uploads/properties/${img.image_url}`)}
              />
            </div>

            {/* Описание объявления */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">Описание объявления</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </motion.div>

            {/* О квартире */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">О квартире</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Тип жилья</span>
                    <span className="font-semibold text-gray-900">{property.property_type}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Комнат</span>
                    <span className="font-semibold text-gray-900">{property.rooms}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Площадь</span>
                    <span className="font-semibold text-gray-900">{property.area} м²</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Этаж</span>
                    <span className="font-semibold text-gray-900">{property.floor} из {property.total_floors}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Балкон</span>
                    <span className="font-semibold text-gray-900">{property.has_balcony ? "Есть" : "Нет"}</span>
                  </div>
                  {property.window_view && property.window_view.length > 0 && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Вид из окна</span>
                      <span className="font-semibold text-gray-900">{property.window_view.join(", ")}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Санузел</span>
                    <span className="font-semibold text-gray-900">{property.bathroom}</span>
                  </div>
                  {property.bath_type && (
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Ванная</span>
                      <span className="font-semibold text-gray-900">{property.bath_type}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Ремонт</span>
                    <span className="font-semibold text-gray-900">{property.renovation}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* О доме */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">О доме</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Год постройки</span>
                  <span className="font-semibold text-gray-900">{property.build_year || "Не указано"}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Лифты</span>
                  <span className="font-semibold text-gray-900">
                    {property.lifts_passenger > 0 && `Пассажирский: ${property.lifts_passenger}`}
                    {property.lifts_passenger > 0 && property.lifts_freight > 0 && ", "}
                    {property.lifts_freight > 0 && `Грузовой: ${property.lifts_freight}`}
                    {property.lifts_passenger === 0 && property.lifts_freight === 0 && "Нет"}
                  </span>
                </div>
                {property.parking && property.parking.length > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Парковка</span>
                    <span className="font-semibold text-gray-900">{property.parking.join(", ")}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Отопление</span>
                  <span className="font-semibold text-gray-900">{property.heating || "Не указано"}</span>
                </div>
              </div>
            </motion.div>

            {/* В квартире есть */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">В квартире есть</h2>
              <div className="space-y-6">
                {property.furniture && property.furniture.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Мебель</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.furniture.map((item) => (
                        <span key={item} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {property.appliances && property.appliances.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Техника</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.appliances.map((item) => (
                        <span key={item} className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {property.connectivity && property.connectivity.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Связь</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.connectivity.map((item) => (
                        <span key={item} className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!property.furniture?.length && !property.appliances?.length && !property.connectivity?.length && (
                  <p className="text-gray-500 text-center">Информация отсутствует</p>
                )}
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
                <div className="flex items-baseline">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPrice(property.price)}
                  </div>
                  <span className="ml-2 text-gray-500">/ месяц</span>
                </div>
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

                {/* Условия проживания */}
                {property.living_conditions && property.living_conditions.length > 0 && (
                  <div className="border-t border-gray-100 pt-6">
                    <span className="block text-sm text-gray-500 mb-3">Условия проживания</span>
                    <div className="flex flex-wrap gap-2">
                      {property.living_conditions.map((condition) => (
                        <span 
                          key={condition} 
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-600"
                        >
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Способ связи */}
                {property.contact_method && property.contact_method.length > 0 && (
                  <div className="border-t border-gray-100 pt-6">
                    <span className="block text-sm text-gray-500 mb-3">Способ связи</span>
                    <div className="flex flex-wrap gap-2">
                      {property.contact_method.map((method) => (
                        <span 
                          key={method} 
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                            method === property.contact_method[0]
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-gray-50 text-gray-600'
                          }`}
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
                          {method === property.contact_method[0] && (
                            <span className="ml-1 text-xs opacity-75">(предпочтительно)</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Кнопки связи */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <button
                    onClick={() => setShowPhone(!showPhone)}
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
    </div>
  );
}
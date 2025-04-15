// Файл: app/properties/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../lib/axios";
import { formatPrice } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FaBed, FaRulerCombined, FaBuilding, FaCar, FaThermometerHalf, FaStar, FaMapMarkerAlt, FaRegCalendarAlt, FaRegListAlt, FaHeart, FaChevronLeft, FaChevronRight, FaTimes, FaChild, FaPaw, FaArrowRight } from "react-icons/fa";
import { TbRuler, TbBed, TbLayersIntersect, TbStar, TbBuilding, TbHome, TbCalendar, TbCar, TbFlame, TbLock } from 'react-icons/tb';
import { MdOutlineSquare, MdOutlineBedroomParent, MdOutlineLayers, MdOutlineStarPurple500, MdOutlineBuild, MdOutlineHome, MdOutlineCalendarMonth, MdOutlineDirectionsCar, MdOutlineLocalFireDepartment, MdOutlineElevator, MdOutlineBathroom, MdOutlineShower, MdOutlineWindow, MdOutlineVisibility, MdOutlineTag, MdOutlineWifi, MdOutlineChat, MdOutlineLock, MdOutlineHeight } from 'react-icons/md';
import ImageCarousel from "../../../components/ImageCarousel";
import Link from "next/link";
import chatAxiosInstance from "@/lib/chatAxios";
import { ShareButton } from '@/app/components/ui/ShareButton';
import { ReportButton } from '@/app/components/ui/ReportButton';
import { Button } from '@/components/ui/button';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  owner?: User;
  created_at: string;
  updated_at: string;
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
  reviews?: Review[];
}

interface Review {
  id: number;
  comment: string;
  created_at: string;
  reviewer: {
    id: number;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
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

// Функция для определения последнего изменения (включая изменения цены)
const getLastModification = (property: Property) => {
  if (!property) return null;

  let dates = [new Date(property.created_at)];
  
  if (property.updated_at) {
    dates.push(new Date(property.updated_at));
  }
  
  if (property.price_history && property.price_history.length > 0) {
    dates.push(...property.price_history.map(ph => new Date(ph.change_date)));
  }
  
  const lastDate = new Date(Math.max(...dates.map(date => date.getTime())));
  const isCreated = lastDate.getTime() === new Date(property.created_at).getTime();
  
  return {
    date: lastDate,
    isCreated
  };
};

const windowViewLabels: { [key: string]: string } = {
  "Во двор": "Во двор",
  "На парк": "На парк",
  "На улицу": "На улицу",
  "На горы": "На горы"
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
        console.log('Property data:', propertyResponse.data);
        console.log('Owner data:', propertyResponse.data.owner);
        setProperty(propertyResponse.data);

        // Проверяем наличие токена в localStorage
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Пробуем загрузить данные пользователя
            const userResponse = await axios.get('/users/me');
            setCurrentUserId(userResponse.data.id);
            setIsAuthenticated(true);
            
            // Проверяем, находится ли объявление в избранном
            const favoritesResponse = await axios.get('/favorites');
            const isInFavorites = favoritesResponse.data.some(
              (favorite: any) => favorite.property_id === propertyResponse.data.id
            );
            setIsFavorite(isInFavorites);
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  const handleStartChat = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!property || !currentUserId) {
      console.error('Данные объявления или пользователя не загружены');
      return;
    }

    console.log(`[handleStartChat] Starting chat for property ${property.id} between user ${currentUserId} and owner ${property.owner_id}`);

    try {
      const response = await chatAxiosInstance.post('/chats', {
        property_id: property.id,
        participants: [currentUserId, property.owner_id]
      });

      console.log("[handleStartChat] Chat creation response:", response);

      if (response.data && response.data.id) {
        const chatId = response.data.id;
        console.log(`[handleStartChat] Chat created/found with ID: ${chatId}. Redirecting...`);
        router.push(`/chat/${chatId}`);
        } else {
        console.error('[handleStartChat] Некорректный ответ от сервера при создании чата:', response.data);
        alert("Не удалось получить ID чата от сервера.");
      }
    } catch (error: any) {
      console.error('[handleStartChat] Ошибка при создании/получении чата:', error);
      const errorMessage = error.response?.data?.detail || error.message || "Неизвестная ошибка";
      alert(`Ошибка при попытке начать чат: ${errorMessage}`);
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
            {/* Основная информация с фото и описанием */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{property?.title}</h1>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center text-gray-600">
                      <FaMapMarkerAlt className="mr-2" />
                      <p>{property?.address}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FaRegCalendarAlt className="mr-1" />
                      {(() => {
                        const modification = getLastModification(property);
                        if (modification) {
                          return modification.isCreated
                            ? `Опубликовано: ${modification.date.toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`
                            : `Обновлено: ${modification.date.toLocaleString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`;
                        }
                        return '';
                      })()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ShareButton
                    title={property.title}
                    url={typeof window !== 'undefined' ? window.location.href : ''}
                  />
                  <ReportButton propertyId={property.id.toString()} />
                </div>
              </div>

              {/* Карусель изображений */}
              <div className="relative w-full h-[500px] bg-gray-100 rounded-xl overflow-hidden mb-6">
                <ImageCarousel
                  images={property?.images?.map(img => `${BASE_URL}/uploads/properties/${img.image_url}`)}
                />
              </div>

              {/* Описание */}
              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-semibold text-gray-900">Описание</h3>
                </div>
                <div className="text-gray-600 leading-relaxed">
                  {isDescriptionExpanded ? property?.description : property?.description?.slice(0, 280)}
                  {property?.description && property.description.length > 280 && (
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
              className="p-6 overflow-hidden"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900">Основные характеристики</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineSquare className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Площадь</div>
                    <div className="text-gray-600">{property?.area} м²</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineBedroomParent className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Комнат</div>
                    <div className="text-gray-600">{property?.rooms}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineLayers className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Этаж</div>
                    <div className="text-gray-600">{property?.floor}/{property?.total_floors}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineStarPurple500 className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Ремонт</div>
                    <div className="text-gray-600">{property?.renovation}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineBathroom className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Санузел</div>
                    <div className="text-gray-600">{property?.bathroom}</div>
                  </div>
                </div>
                {property?.bath_type && (
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MdOutlineShower className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Ванная</div>
                      <div className="text-gray-600">{property?.bath_type}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineWindow className="text-blue-600 w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Балкон</div>
                    <div className="text-gray-600">{property?.has_balcony ? "Есть" : "Нет"}</div>
                  </div>
                </div>
                {property?.window_view && property.window_view.length > 0 && (
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MdOutlineWindow className="text-blue-600 w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Вид из окна</div>
                      <div className="text-gray-600">{property.window_view.join(", ")}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineHeight className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Высота потолков</div>
                    <div className="text-gray-600">{property?.ceiling_height} м</div>
                  </div>
                </div>
                {property?.apartment_number && (
                  <div className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MdOutlineTag className="text-blue-600 text-lg" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Номер квартиры</div>
                      <div className="text-gray-600">{property?.apartment_number}</div>
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
              className="p-6 overflow-hidden"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900">О доме</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineBuild className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Тип дома</div>
                    <div className="text-gray-600">{property?.property_condition}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineHome className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Этажей в доме</div>
                    <div className="text-gray-600">{property?.total_floors}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineCalendarMonth className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Год постройки</div>
                    <div className="text-gray-600">{property?.build_year}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineDirectionsCar className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Парковка</div>
                    <div className="text-gray-600">{property?.parking?.join(", ") || "Нет"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineLocalFireDepartment className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Отопление</div>
                    <div className="text-gray-600">{property?.heating}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MdOutlineElevator className="text-blue-600 text-lg" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Лифты</div>
                    <div className="text-gray-600">
                      {property?.lifts_passenger > 0 && `Пассажирский: ${property.lifts_passenger}`}
                      {property?.lifts_freight > 0 && ` Грузовой: ${property.lifts_freight}`}
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
              className="p-6 overflow-hidden"
            >
              <h2 className="text-xl font-bold mb-6 text-gray-900">В квартире есть</h2>
              <div className="space-y-4">
                {property?.furniture && property.furniture.length > 0 && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center p-5"
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
                {property?.appliances && property.appliances.length > 0 && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center p-5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                      <FaThermometerHalf className="w-6 h-6 text-blue-600" />
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
                {property?.connectivity && property.connectivity.length > 0 && (
                  <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center p-5"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shadow-sm">
                      <MdOutlineWifi className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="ml-5">
                      <h3 className="font-semibold text-gray-900 mb-1">Связь</h3>
                      <div className="flex flex-wrap gap-2">
                        {property.connectivity.map((item, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
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
              className="p-6 overflow-hidden"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900">Условия проживания</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-xl">
                  <div className={`w-12 h-12 rounded-full ${property?.living_conditions?.includes("children") ? "bg-green-100" : "bg-red-100"} flex items-center justify-center`}>
                    <FaChild className={property?.living_conditions?.includes("children") ? "text-green-600" : "text-red-600"} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Можно с детьми</div>
                    <div className={`font-medium ${property?.living_conditions?.includes("children") ? "text-gray-600" : "text-gray-600"}`}>
                      {property?.living_conditions?.includes("children") ? "Разрешено" : "Не разрешено"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl">
                  <div className={`w-12 h-12 rounded-full ${property?.living_conditions?.includes("pets") ? "bg-green-100" : "bg-red-100"} flex items-center justify-center`}>
                    <FaPaw className={property?.living_conditions?.includes("pets") ? "text-green-600" : "text-red-600"} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Домашние животные</div>
                    <div className={`font-medium ${property?.living_conditions?.includes("pets") ? "text-gray-600" : "text-gray-600"}`}>
                      {property?.living_conditions?.includes("pets") ? "Разрешено" : "Не разрешено"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Правая колонка */}
          <div className="space-y-6">
            {/* Объединенная секция с ценой, условиями и информацией о пользователе */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 overflow-hidden sticky top-6"
            >
              <div className="space-y-6">
                {/* Цена */}
                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-blue-600">
                      {formatPrice(property?.price)}
                    </div>
                    <span className="text-gray-500">/ месяц</span>
                  </div>
                  {currentUserId === property?.owner_id && (
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
                  {property?.price_history && property.price_history.length > 0 && (
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
                    {property?.prepayment && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="mb-1">
                          <span className="text-sm text-gray-500">Предоплата</span>
                        </div>
                        <span className="font-medium text-gray-900">{property.prepayment}</span>
                      </div>
                    )}
                    {property?.deposit > 0 && (
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="mb-1">
                          <span className="text-sm text-gray-500">Залог</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatPrice(property.deposit)}</span>
                      </div>
                    )}
                  </div>

                  {/* Способ связи */}
                  {property?.contact_method && property.contact_method.length > 0 && (
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
                          <span className="text-lg">{property?.landlord_contact}</span>
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <span>Показать телефон</span>
                        </span>
                      )}
                    </button>

                    {/* Показываем кнопку "Написать" только если пользователь не владелец объявления */}
                    {currentUserId !== property?.owner_id && (
                      <button
                        onClick={handleStartChat}
                        className="w-full bg-blue-600 text-white py-3.5 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
                      >
                        <MdOutlineChat size={20} />
                        <span>Написать</span>
                      </button>
                    )}

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

                {/* Информация о пользователе */}
                <div className="border-t border-gray-100 pt-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img 
                        src={(() => {
                          const avatarUrl = property?.owner?.avatar_url;
                          if (!avatarUrl) return "/images/placeholder.png";
                          if (avatarUrl.startsWith('http')) return avatarUrl;
                          return `/uploads/avatars/${avatarUrl}`;
                        })()}
                        alt={property?.owner?.first_name}
                        className="w-24 h-24 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/images/placeholder.png";
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {property?.owner?.first_name} {property?.owner?.last_name}
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <span>На сайте с</span>
                        <span>{property?.owner?.created_at ? new Date(property.owner.created_at).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long'
                        }) : 'Не указано'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-6 mt-6">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-gray-500">Объявлений:</div>
                      <div className="text-sm text-gray-900">
                        {property?.owner?.properties_count || 0}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-gray-500">Рейтинг:</div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-900">
                          {property?.owner?.rating?.toFixed(1) || 'Нет'}
                        </span>
                        {property?.owner?.rating && (
                          <FaStar className="text-yellow-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {(property?.owner?.reviews_count || 0) > 0 && property?.owner?.reviews && (
                    <div className="border-t border-gray-100 pt-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Отзывы</h4>
                        {property.owner.id && (
                          <Link 
                            href={`/users/${property.owner.id}/reviews`}
                            className="text-sm text-blue-600 hover:text-blue-700"
                          >
                            Все отзывы
                          </Link>
                        )}
                      </div>
                      <div className="space-y-3">
                        {property.owner.reviews.slice(0, 2).map((review) => (
                          <div key={review.id} className="bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {review.reviewer.avatar_url ? (
                                  <img 
                                    src={`${BASE_URL}${review.reviewer.avatar_url}`} 
                                    alt="Аватар" 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-semibold text-gray-600">
                                    {review.reviewer.first_name?.[0] || '?'}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {review.reviewer.first_name} {review.reviewer.last_name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString('ru-RU', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {review.comment}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
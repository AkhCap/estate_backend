"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaComments, FaTimes, FaUser } from 'react-icons/fa';
import axios from "../../lib/axios";
import chatAxiosInstance from "../../lib/chatAxios";
import { useAuth } from "@/app/context/AuthContext";
import Image from 'next/image';
import ChatWidget from '@/app/components/chat/ChatWidget';

interface Chat {
  id: string;
  other_user_id: number;
  last_message?: {
    content: string;
  };
  unread_count: number;
}

interface ParticipantDetails {
  id: number;
  name: string;
  avatar_url?: string;
}

interface PropertyInfo {
  id: number;
  title: string;
  price: number;
  address: string;
  image?: string;
}

const ChatButton = () => {
  // ... existing code ...
};

export default function Navigation() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isUnread, setIsUnread] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [participantDetails, setParticipantDetails] = useState<{ [key: number]: ParticipantDetails }>({});
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);
  const [propertyDetails, setPropertyDetails] = useState<PropertyInfo | null>(null);
  const [isLoadingProperty, setIsLoadingProperty] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const pathname = usePathname();

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.get('/users/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        setIsLoggedIn(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('authStateChanged'));
        router.push('/login');
      }
    } else {
      setIsLoggedIn(false);
      router.push('/login');
    }
  };

  useEffect(() => {
    checkAuth();

    window.addEventListener('authStateChanged', checkAuth);
    return () => {
      window.removeEventListener('authStateChanged', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    window.dispatchEvent(new Event('authStateChanged'));
    router.push('/login');
  };

  const handleChatClick = async () => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    try {
      // Выведем токен в консоль для отладки (первые 10 символов)
      const token = localStorage.getItem('token');
      console.log('Токен для запроса:', token ? token.substring(0, 10) + '...' : 'отсутствует');
      
      const response = await chatAxiosInstance.get('/chats/me');
      if (response.data?.chats?.length > 0) {
        router.push(`/chat/${response.data.chats[0].id}`);
      } else {
        router.push('/chat/new');
      }
    } catch (error) {
      console.error('Ошибка при получении чатов:', error);
      router.push('/login');
    }
  };

  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);
    setShowChatWidget(true);
    setIsLoadingParticipants(true);
    setIsLoadingProperty(true);

    try {
      const response = await chatAxiosInstance.get(`/chats/${chat.id}/participants`);
      const participants = response.data.participants;
      const propertyResponse = await chatAxiosInstance.get(`/chats/${chat.id}/property`);
      const property = propertyResponse.data.property;

      const details: { [key: number]: ParticipantDetails } = {};
      for (const participant of participants) {
        details[participant.id] = {
          id: participant.id,
          name: participant.name,
          avatar_url: participant.avatar_url,
        };
      }

      setParticipantDetails(details);
      setPropertyDetails({
        id: property.id,
        title: property.title,
        price: property.price,
        address: property.address,
        image: property.image,
      });
    } catch (error) {
      console.error('Ошибка при получении деталей чата:', error);
    } finally {
      setIsLoadingParticipants(false);
      setIsLoadingProperty(false);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">Estate</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/properties" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                Объявления
              </Link>
              <Link href="/about" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                О нас
              </Link>
              <Link href="/contact" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                Контакты
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isLoggedIn ? (
              <>
                <div className="relative mr-4">
                  <button
                    onClick={handleChatClick}
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-lg
                      bg-white
                      shadow-sm hover:shadow-md
                      transition-all duration-300
                      transform hover:scale-105
                      focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-opacity-50
                      border border-gray-200
                      ${isUnread ? 'animate-pulse' : ''}
                    `}
                  >
                    <div className="relative">
                      <FaComments className="w-5 h-5 text-gray-600" />
                      {isUnread && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center border border-white">
                          <span className="text-[10px] text-white font-bold">{unreadCount}</span>
                        </div>
                      )}
                    </div>
                  </button>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Чаты
                  </div>
                </div>
                <div className="relative mr-4">
                  <Link 
                    href="/profile" 
                    className={`
                      relative flex items-center justify-center w-10 h-10 rounded-lg
                      bg-white
                      shadow-sm hover:shadow-md
                      transition-all duration-300
                      transform hover:scale-105
                      focus:outline-none focus:ring-1 focus:ring-gray-300 focus:ring-opacity-50
                      border border-gray-200
                    `}
                  >
                    <FaUser className="w-5 h-5 text-gray-600" />
                  </Link>
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Профиль
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  Выйти
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/register" className="text-gray-900 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-blue-50">
                  Регистрация
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/login" className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Войти
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 
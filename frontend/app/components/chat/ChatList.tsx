"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaExclamationCircle,
  FaComments,
  FaTrash,
  FaEllipsisV
} from "react-icons/fa";
import { MessagesSquare } from "lucide-react";
import { useAuth } from '../../hooks/useAuth';
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { PropertyInfo } from "@/types";

interface Chat {
  id: string;
  property_id: number;
  participants: Array<{
    user_id: number;
    username: string;
    full_name: string;
    avatar_url?: string | null;
    last_read_at?: string | null;
    is_online?: boolean;
  }>;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  property_title?: string | null;
  property_image?: string | null;
  property?: PropertyInfo;
  last_message?: string | null;
  last_message_time?: string | null;
  unread_count?: number | null;
}

interface ChatListProps {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenDeleteModal: (chatId: string) => void;
  currentChatId: string;
  searchQuery?: string;
}

const getPropertyImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return "/no-image.jpg";
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    return imageUrl;
  }
  const MAIN_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  return `${MAIN_BACKEND_BASE_URL}/uploads/properties/${imageUrl}`;
};

// Функция для получения главного изображения объявления
const getMainImageUrl = (property: PropertyInfo): string => {
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
  
  const MAIN_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  return `${MAIN_BACKEND_BASE_URL}/uploads/properties/${imageUrl}`;
};

const ChatList: React.FC<ChatListProps> = ({ 
  chats, 
  isLoading, 
  error, 
  onSelectChat, 
  onOpenDeleteModal,
  currentChatId, 
  searchQuery = "" 
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const getParticipantName = (chat: Chat) => {
    const otherParticipant = chat.participants.find(p => p.user_id.toString() !== user?.id?.toString());
    return otherParticipant?.full_name || '';
  };

  const filteredChats = chats.filter(chat => {
    const searchLower = searchQuery.toLowerCase();
    const participantName = getParticipantName(chat);
    return participantName.toLowerCase().includes(searchLower);
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenuId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-gray-500 text-sm">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500 mr-3"></div>
        Загрузка чатов...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-red-600">
        <FaExclamationCircle className="text-3xl text-red-400 mb-3" />
        <p className="text-sm font-medium mb-1">Ошибка загрузки чатов</p>
        <p className="text-xs px-4">{error}</p>
      </div>
    );
  }

  if (filteredChats.length === 0) {
    const message = searchQuery ? "Чаты не найдены" : "У вас пока нет чатов";
    const subMessage = searchQuery 
        ? "Попробуйте изменить поисковый запрос."
        : "Начните общение на странице объявления, и чат появится здесь.";
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">У вас пока нет чатов</h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Начните общение на странице объявления, и чат появится здесь
        </p>
      </div>
    );
  }

  return (
    <div 
      className="h-full"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectChat('new');
        }
      }}
    >
      {filteredChats.map((chat, index) => {
        const hasUnread = chat.unread_count && chat.unread_count > 0;
        const isActive = chat.id === currentChatId;

        return (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className={`relative cursor-pointer transition-all duration-200 flex items-center space-x-3 p-3 ${
              isActive
                ? "bg-white shadow-sm border-l-[3px] border-blue-500"
                : "hover:bg-white/70 border-l-[3px] border-transparent"
            }`}
            onClick={() => {
              if (openMenuId === chat.id) {
                setOpenMenuId(null);
              } else {
                onSelectChat(chat.id);
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={chat.property ? getMainImageUrl(chat.property) : getPropertyImageUrl(chat.property_image)}
                  alt={chat.property_title || "Объявление без названия"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/no-image.jpg";
                  }}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-medium line-clamp-1 mb-0.5 ${
                isActive ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {chat.property_title || "Объявление без названия"}
              </h3>
              <div className={`text-xs ${
                hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
              }`}>
                <span className="text-gray-600 font-medium mr-1">
                  {getParticipantName(chat)}:
                </span>
                <span className={`line-clamp-1 ${!hasUnread && 'text-gray-500'}`}>
                  {chat.last_message || <span className="italic">Нет сообщений</span>}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 ml-2 space-y-1">
              {(chat.unread_count && chat.unread_count > 0) ? (
                <span
                  className="px-1.5 py-0.5 text-[10px] font-medium leading-none text-white bg-blue-500 rounded-full"
                  title={`${chat.unread_count} непрочитанных`}
                >
                  {chat.unread_count > 9 ? '9+' : chat.unread_count}
                </span>
              ) : null}
            </div>
            <div className="absolute top-2 right-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                }}
                title="Опции чата"
                className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-150"
              >
                <FaEllipsisV size={14} />
              </button>

              <AnimatePresence>
                {openMenuId === chat.id && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-1 w-40 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black/5 focus:outline-none py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        onOpenDeleteModal(chat.id);
                        setOpenMenuId(null);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <FaTrash className="w-3.5 h-3.5 mr-2" />
                      Удалить чат
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChatList; 
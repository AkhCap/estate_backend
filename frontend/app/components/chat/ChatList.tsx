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

interface Chat {
  id: string;
  property_id: number;
  participants: number[];
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  property_title?: string | null;
  property_image?: string | null;
  participant_name?: string | null;
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

  const filteredChats = chats.filter((chat) =>
    (chat.property_title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (chat.participant_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

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
      <div className="flex items-center justify-center h-full p-4">
         <motion.div 
            className="bg-white rounded-xl shadow-md border border-gray-100 p-8 w-full max-w-sm flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="p-4 mb-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shadow-inner ring-4 ring-white/50">
                <MessagesSquare className="w-14 h-14 text-gray-400" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-semibold text-gray-700 mb-1">{message}</p>
            <p className="text-sm text-gray-500">{subMessage}</p>
          </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      {filteredChats.map((chat, index) => {
        const hasUnread = chat.unread_count && chat.unread_count > 0;
        const isActive = chat.id === currentChatId;
        console.log(`Rendering chat ${chat.id}: unread=${chat.unread_count}`);

        return (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: index * 0.03 }}
            className={`relative cursor-pointer transition-all duration-200 flex items-center space-x-3 p-4 rounded-xl ${ 
              isActive
                ? "bg-indigo-100 shadow-md"
                : "hover:bg-gray-100 hover:shadow-sm border border-transparent hover:border-gray-100"
            }`}
            onClick={() => {
              if (openMenuId === chat.id) {
                setOpenMenuId(null);
              } else {
                onSelectChat(chat.id);
              }
            }}
          >
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={getPropertyImageUrl(chat.property_image)}
                alt={chat.property_title || "Объект"}
                fill
                sizes="48px"
                className="rounded-lg object-cover border border-gray-200"
                onError={(e) => { e.currentTarget.src = '/no-image.jpg'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-semibold text-gray-800 line-clamp-1 mb-0.5 ${isActive ? 'text-indigo-800' : 'text-gray-800'}`}>
                {chat.property_title || "Объявление без названия"}
              </h3>
              <div className={`text-xs ${ 
                  hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500' 
              }`}>
                 <span className="text-gray-600 font-semibold mr-1">{chat.participant_name || "Собеседник"}:</span> 
                 <span className={`line-clamp-1 ${!hasUnread && 'text-gray-500'}`}> 
                     {chat.last_message || <span className="italic">Нет сообщений</span>}
                 </span>
              </div>
            </div>
            <div className="flex flex-col items-end flex-shrink-0 ml-2 space-y-1">
              {(chat.unread_count && chat.unread_count > 0) ? ( 
                <span 
                    className="px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-sm"
                    title={`${chat.unread_count} непрочитанных`}
                >
                  {chat.unread_count > 9 ? '9+' : chat.unread_count}
                </span>
              ) : (
                 null
              )}
            </div>
            <div className="absolute top-3 right-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                }}
                title="Опции чата"
                className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-150"
              >
                <FaEllipsisV size={16} />
              </button>

              <AnimatePresence>
                {openMenuId === chat.id && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-1 w-40 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => {
                        onOpenDeleteModal(chat.id);
                        setOpenMenuId(null);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                    >
                      <FaTrash className="w-4 h-4 mr-2" />
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
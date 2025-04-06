"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser,
  FaClock,
  FaCircle,
  FaEllipsisV,
  FaTrash,
  FaPenSquare,
  FaExclamationCircle,
  FaComments
} from "react-icons/fa";

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

const ChatList: React.FC<ChatListProps> = ({ 
  chats, 
  isLoading, 
  error, 
  onSelectChat, 
  onOpenDeleteModal,
  currentChatId, 
  searchQuery = "" 
}) => {
  // Оставляем лог получения props, он может быть полезен
  // console.log('[ChatList] Received props:', { chats, isLoading, error, currentChatId, searchQuery }); 

  const filteredChats = chats.filter((chat) =>
    (chat.property_title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (chat.participant_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );
  // Оставляем лог отфильтрованных чатов
  // console.log('[ChatList] Filtered chats:', filteredChats);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-sm text-gray-500">Загрузка чатов...</p>
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
    const message = searchQuery 
      ? "Чаты не найдены по вашему запросу"
      : "У вас пока нет активных чатов";
    const subMessage = searchQuery
      ? "Попробуйте изменить условия поиска"
      : "Начните общение с продавцами";
      
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FaComments className="text-4xl text-gray-300 mb-4" /> 
        <p className="text-gray-500 mb-1 font-medium">{message}</p>
        <p className="text-sm text-gray-400">{subMessage}</p>
      </div>
    );
  }

  // Убираем лог перед рендерингом списка
  // console.log(`[ChatList] Rendering list with ${filteredChats.length} chats...`);
  return (
    <div className="p-2 space-y-1">
      {filteredChats.map((chat, index) => {
        // --- УДАЛЯЕМ ДИАГНОСТИЧЕСКИЙ ЛОГ ---
        // console.log(`[ChatList] Rendering item ${index}. Data received:`, JSON.stringify(chat, null, 2));
        // --- КОНЕЦ УДАЛЕНИЯ ---

        const hasUnread = chat.unread_count && chat.unread_count > 0;
        const isActive = chat.id === currentChatId;

        return (
          <motion.div
            key={chat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className={`relative group cursor-pointer rounded-lg transition-colors duration-150 flex items-center space-x-3 p-3 ${ 
              isActive
                ? "bg-blue-50 shadow-sm"
                : "hover:bg-gray-50"
            }`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="relative w-12 h-12 flex-shrink-0">
              <Image
                src={chat.property_image || "/placeholder.jpg"}
                alt={chat.property_title || "Изображение недвижимости"}
                fill
                sizes="48px"
                className="rounded-lg object-cover border border-gray-100"
              />
              {hasUnread && (
                <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ring-2 ring-white">
                  {chat.unread_count}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <h3 className={`text-sm font-semibold text-gray-800 truncate pr-2 ${isActive ? 'text-blue-700' : ''}`}>
                  {chat.participant_name || "Неизвестный собеседник"}
                </h3>
                {chat.last_message_time && (
                  <span className={`text-xs whitespace-nowrap ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                    {new Date(chat.last_message_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              <div className={`text-xs truncate ${isActive ? 'text-gray-600' : 'text-gray-500'} mb-1`}>
                {chat.property_title || "Объявление без названия"}
              </div>
              <p className={`text-xs truncate flex items-center ${hasUnread ? 'text-gray-900 font-medium' : (isActive ? 'text-gray-600' : 'text-gray-500')}`}>
                {hasUnread ? (
                  <FaCircle className="mr-1.5 text-blue-500 flex-shrink-0" size={6} />
                ) : (
                  <span className="w-[6px] mr-1.5 flex-shrink-0"></span>
                )}
                {chat.last_message || <span className="italic text-gray-400">Нет сообщений</span>}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDeleteModal(chat.id);
              }}
              title="Действия"
              className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 z-10"
            >
              <FaEllipsisV size={14} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ChatList; 
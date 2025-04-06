"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import ChatWidget from "@/app/components/chat/ChatWidget";
import ChatList from "@/app/components/chat/ChatList";
import { FaArrowLeft, FaHome, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaBed, FaRulerCombined, FaCalendarAlt, FaSearch, FaComments, FaPaperclip, FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import chatAxiosInstance from "@/lib/chatAxios";
import { PropertyInfo } from "@/types";
import ConfirmationModal from "@/app/components/shared/ConfirmationModal";
import toast from 'react-hot-toast';

// Определяем базовый URL основного бэкенда (для формирования URL картинок)
// Убедитесь, что этот URL правильный и не содержит /api/v1, если картинки в /uploads
const MAIN_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

// Определяем базовый URL сервиса чатов (для отправки файла)
const CHAT_SERVICE_BASE_URL = process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || "http://localhost:8001";

// Интерфейс Chat (можно вынести в @/types)
interface Chat {
  id: string;
  property_id: number;
  // Добавляем поля, которые реально приходят от /chats/me
  participants: number[];
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  property_title?: string | null;
  property_image?: string | null; // Ожидаем ПОЛНЫЙ URL от chat_service
  seller_name?: string | null;
  last_message?: string | null;
  last_message_time?: string | null;
  unread_count?: number | null;
}

// Используем PropertyInfo из @/types, но дополним его для ясности
// Ожидаем, что /properties/{id} вернет нечто похожее
interface PropertyDetails extends PropertyInfo {
  // PropertyInfo уже содержит title, price, description, location и т.д.
  images?: Array<{ id: number; image_url: string }>; // Массив объектов с именами файлов
  user?: { full_name?: string }; // Информация о владельце
}

// Вспомогательная функция для получения полного URL первого изображения
const getFirstImageUrl = (property?: PropertyDetails | null): string | null => {
  if (!property || !property.images || property.images.length === 0 || !property.images[0].image_url) {
    return null; // Нет изображения
  }
  const filename = property.images[0].image_url;
  // Проверяем, не является ли уже полным URL (на всякий случай)
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
      return filename;
  }
  // Формируем полный URL
  return `${MAIN_BACKEND_BASE_URL}/uploads/properties/${filename}`;
};

// В начале файла добавляем типы для параметров
interface PageProps {
  params: {
    id: string;
  };
}

interface ParticipantDetail {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

interface ParticipantDetails {
  [key: number]: ParticipantDetail;
}

// --- Новый интерфейс для сообщения ---
// Расширяем, чтобы включить message_type
interface Message {
  id: string;
  chat_id: string;
  sender_id: number;
  content: string; // Может быть текстом или JSON-строкой для файлов/изображений
  created_at: string; // Или Date, если парсим
  message_type?: 'text' | 'image' | 'file'; // Добавляем тип
  // Можно добавить is_read, если нужно
}

// --- Новый интерфейс для распарсенного контента файла/изображения ---
interface FileContent {
  type: 'image' | 'file';
  url: string;
  filename: string;
  content_type: string;
  size: number;
}

const ChatPage = ({ params }: PageProps) => {
  const router = useRouter();
  const { user } = useAuth();
  console.log('[ChatPage] User from useAuth:', user);
  const [propertyInfo, setPropertyInfo] = useState<PropertyDetails | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDeleteId, setChatToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [participantDetails, setParticipantDetails] = useState<ParticipantDetails | null>(null);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchChatData = async () => {
      if (!user) {
        setPageError("Пожалуйста, войдите в систему");
        setPageLoading(false);
        setChatsLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setPageError("Токен авторизации отсутствует");
        setPageLoading(false);
        setChatsLoading(false);
        return;
      }
      
      setPageLoading(true);
      setChatsLoading(true);
      setPageError(null);
      setChatsError(null);

      let fetchedChats: Chat[] = [];

      try {
        console.log('[ChatPage] Запрос списка чатов...');
        const chatListResponse = await chatAxiosInstance.get("/chats/me");
        console.log('[ChatPage] Ответ от /chats/me:', chatListResponse);
        
        if (!chatListResponse.data || !Array.isArray(chatListResponse.data.chats)) {
           console.error('[ChatPage] Неверный формат данных чатов:', chatListResponse.data);
           throw new Error("Неверный формат данных чатов");
        }
        fetchedChats = chatListResponse.data.chats;
        console.log('[ChatPage] Получены чаты:', fetchedChats);
        setChats(fetchedChats);
        console.log('[ChatPage] Чаты установлены в состояние.');
      } catch (error: any) {
        console.error("[ChatPage] Ошибка при загрузке списка чатов:", error);
        const errorMessage = error.response?.status === 401
            ? "Ошибка авторизации при загрузке чатов. Пожалуйста, войдите снова."
            : "Не удалось загрузить список чатов";
        setChatsError(errorMessage);
        console.log(`[ChatPage] Установлена ошибка загрузки чатов: ${errorMessage}`);
      } finally {
        setChatsLoading(false);
        console.log('[ChatPage] Загрузка чатов завершена (chatsLoading=false).');
      }

      if (params.id && params.id !== 'new' && fetchedChats.length > 0) {
        const currentChatData = fetchedChats.find(
          (chat: any) => chat.id === params.id
        );

        if (!currentChatData) {
          setPageError("Чат не найден в загруженном списке");
          setPropertyInfo(null);
          setCurrentChat(null);
          setPageLoading(false);
          return;
        }
        
        setCurrentChat(currentChatData);

        try {
          console.log(`[ChatPage] Fetching property details from /properties/${currentChatData.property_id}`);
          const propertyResponse = await axios.get(
            `${MAIN_BACKEND_BASE_URL}/properties/${currentChatData.property_id}`
          );
          console.log("[ChatPage] Property details response:", propertyResponse.data);
          setPropertyInfo(propertyResponse.data);
        } catch (propertyError) {
          console.error(
            "Ошибка при загрузке информации о недвижимости:",
            propertyError
          );
          setPageError("Не удалось загрузить информацию о недвижимости для этого чата");
          setPropertyInfo(null);
        }
      } else if (params.id === 'new') {
         setPropertyInfo(null);
         setCurrentChat(null);
      } else if (!params.id) {
          setPropertyInfo(null);
          setCurrentChat(null);
      }

      setPageLoading(false);
    };

    fetchChatData();
  }, [params.id, user]);

  useEffect(() => {
    const fetchParticipantDetails = async (participantIds: number[]) => {
      // Не делаем запрос, если нет активного чата или это страница создания нового чата
      if (!currentChat || params.id === 'new') {
        setIsLoadingParticipants(false); // Устанавливаем false, т.к. запрос не нужен
        setParticipantDetails({});
        return;
      }

      // Устанавливаем флаг загрузки перед запросом
      setIsLoadingParticipants(true);
      try {
        const response = await chatAxiosInstance.get(`/chats/${params.id}/participants`);
        if (response.data) {
          const details = response.data.reduce((acc: Record<number, any>, participant: any) => {
            acc[participant.id] = participant;
            return acc;
          }, {});
          setParticipantDetails(details);
        }
      } catch (error) {
        console.error('Ошибка при загрузке информации об участниках:', error);
        setParticipantDetails({}); // Очищаем детали при ошибке
        // Можно также установить сообщение об ошибке, если нужно
        // setPageError("Не удалось загрузить данные участников."); 
      } finally {
        // !!! ГАРАНТИРОВАННО сбрасываем флаг загрузки !!!
        setIsLoadingParticipants(false); 
      }
    };

    // Передаем participantIds из currentChat, если он есть
    fetchParticipantDetails(currentChat?.participants || []);
  }, [currentChat, params.id]); // Зависимости: currentChat и params.id

  // --- ОБНОВЛЕННАЯ функция для отправки НЕСКОЛЬКИХ файлов ОДНИМ запросом --- 
  const handleSendFilesAndMessage = async (files: File[], message: string) => {
    const chatId = params.id;
    if (!chatId || chatId === 'new') {
      toast.error("Не выбран чат для отправки файлов.");
      return Promise.reject(new Error("Чат не выбран")); 
    }
    if (files.length === 0 && message.trim() === "") {
        console.warn("handleSendFilesAndMessage вызвана без файлов и сообщения");
        return Promise.resolve(); // Ничего не делаем, если нечего отправлять
    }

    // Валидация файлов (делаем здесь перед созданием FormData)
    const validFiles = files.filter(file => {
         const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
         if (file.size > MAX_FILE_SIZE) {
           toast.error(`Файл \"${file.name}\" слишком большой (макс. 10 MB).`);
           return false;
         }
         // ALLOWED_TYPES определены выше в коде бэкенда, хорошо бы их шарить
         const ALLOWED_TYPES = [ 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
         if (!ALLOWED_TYPES.includes(file.type)) {
           toast.error(`Файл \"${file.name}\" имеет неподдерживаемый тип.`);
           return false;
         }
         return true;
    });

    if (validFiles.length === 0 && message.trim() === "") {
        console.log("Нет валидных файлов для отправки и нет сообщения.");
         return Promise.reject(new Error("Нет валидных файлов для отправки")); // Чтобы ChatInput не очищался
    }
    // Если есть только сообщение, его должен отправлять onSendMessage
    if (validFiles.length === 0 && message.trim() !== "") {
         console.error("Логическая ошибка: handleSendFilesAndMessage вызвана только с сообщением.");
         return Promise.reject(new Error("Попытка отправить только текст через функцию для файлов"));
    }

    // --- Создаем ОДИН FormData --- 
    const formData = new FormData();

    // Добавляем подпись (если есть)
    if (message.trim() !== "") {
      formData.append("message", message.trim());
    }

    // Добавляем ВСЕ валидные файлы под одним ключом "files"
    validFiles.forEach(file => {
      formData.append("files", file); // Ключ "files", как ожидает бэкенд
    });

    // --- Отправляем ОДИН запрос --- 
    setIsUploading(true);
    const uploadToastId = toast.loading(validFiles.length > 1 
         ? `Загрузка ${validFiles.length} файлов...` 
         : `Загрузка ${validFiles[0]?.name || 'файла'}...`
    );

    try {
      const response = await chatAxiosInstance.post(
        `/uploads/${chatId}`,
        formData,
        // Content-Type не указываем, axios сам поставит multipart/form-data с boundary
      );

      console.log('Ответ на загрузку файлов:', response.data);

      if (response.status === 201) {
         toast.success(validFiles.length > 1
             ? `Файлы (${validFiles.length}) и сообщение отправлены!`
             : `Файл \"${validFiles[0]?.name}\" и сообщение отправлены!`,
         { id: uploadToastId });
      } else if (response.status === 207) {
          const detail = response.data?.detail || "Некоторые файлы не удалось обработать.";
          const errors = response.data?.processing_errors || [];
          toast.error(`${detail} ${errors.length > 0 ? '(' + errors.join('; ') + ')' : ''}`, { id: uploadToastId, duration: 6000 });
          return Promise.reject(new Error(detail));
      } else {
           toast.error(`Неожиданный ответ сервера: ${response.status}`, { id: uploadToastId });
           return Promise.reject(new Error(`Неожиданный ответ сервера: ${response.status}`));
      }

      return Promise.resolve(); // Все успешно

    } catch (error: any) {
      console.error("Ошибка при загрузке файлов:", error);
      const errorMsg = error.response?.data?.detail || "Не удалось загрузить файлы.";
      toast.error(`Ошибка: ${errorMsg}`, { id: uploadToastId });
      return Promise.reject(error); // Прерываем
    } finally {
      setIsUploading(false);
    }
  };

  if (!user && !pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Пожалуйста, войдите в систему
          </h2>
          <button
            onClick={() => router.push("/login")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Войти
          </button>
        </div>
      </div>
    );
  }

  if (pageError && !pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-semibold mb-4">Ошибка</h2>
          <p>{pageError}</p>
          <button
            onClick={() => router.push("/properties")}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            К объявлениям
          </button>
        </div>
      </div>
    );
  }

  const handleSelectChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const openDeleteModal = (chatId: string) => {
    console.log("[ChatPage] Opening delete modal for chat:", chatId);
    setChatToDeleteId(chatId);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    console.log("[ChatPage] Closing delete modal");
    setIsDeleteModalOpen(false);
    setChatToDeleteId(null);
    setIsDeleting(false);
  };

  const handleDeleteChat = async () => {
    if (!chatToDeleteId) return;
    console.log("[ChatPage] Attempting to delete chat:", chatToDeleteId);
    setIsDeleting(true);

    try {
      const response = await chatAxiosInstance.delete(`/chats/${chatToDeleteId}`);
      console.log("[ChatPage] Delete response:", response);

      if (response.status === 200 || response.status === 204) {
        console.log("[ChatPage] Chat deleted successfully:", chatToDeleteId);
        setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatToDeleteId));
        
        if (params.id === chatToDeleteId) {
           console.log("[ChatPage] Current chat deleted, redirecting...");
           router.push('/chat/new');
        }
        
      } else {
        console.error("[ChatPage] Failed to delete chat, status:", response.status);
        alert(`Не удалось удалить чат. Статус: ${response.status}`);
      }
    } catch (error: any) {
      console.error("[ChatPage] Error deleting chat:", error);
      alert(`Ошибка при удалении чата: ${error.message || 'Неизвестная ошибка'}`);
    } finally {
      closeDeleteModal();
    }
  };

  // Формируем URL изображения для заголовка чата
  const headerImageUrl = getFirstImageUrl(propertyInfo);

  return (
    <div className="min-h-screen bg-gray-100 py-8"> {/* Внешний контейнер */}
      <div className="max-w-7xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden h-[calc(100vh-4rem)] flex"> {/* Контейнер с макс. шириной и flex */}
        {/* Левая панель: Список чатов */} 
        <div className="w-full md:w-[300px] lg:w-[350px] xl:w-[400px] h-full flex flex-col border-r border-gray-200 bg-white"> {/* Адаптивная ширина */} 
           <div className="p-4 border-b border-gray-200 flex items-center"> {/* Заголовок списка чатов */} 
             <button
               onClick={() => router.push("/properties")}
               className="mr-4 text-gray-400 hover:text-gray-600 transition-colors"
               title="Назад к объявлениям"
             >
               <FaArrowLeft size={18} />
             </button>
             <h2 className="text-xl font-semibold text-gray-800">
               Сообщения
             </h2>
           </div>
           <div className="flex-1 overflow-y-auto"> {/* Контейнер для скролла списка */} 
             <ChatList
               chats={chats}
               currentChatId={params.id}
               onSelectChat={handleSelectChat}
               isLoading={chatsLoading}
               error={chatsError}
               onOpenDeleteModal={openDeleteModal}
             />
           </div>
        </div>

        {/* Правая панель: Окно чата */}
        <div className="flex-1 flex flex-col bg-gray-50"> {/* Фон правой панели */} 
           {/* Убираем дублирующую логику отображения состояний отсюда */} 
           {/* Она теперь будет внутри ChatWidget */} 
            {pageLoading ? (
              <div className="flex items-center justify-center h-full">
                 <p className="text-gray-500">Загрузка...</p> {/* Просто загрузка */} 
              </div>
            ) : pageError ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">Ошибка: {pageError}</p>
              </div>
            ) : params.id === 'new' ? (
               <div className="flex items-center justify-center h-full text-center p-8">
                  <div>
                     <FaComments className="w-16 h-16 mx-auto text-blue-100 mb-4" />
                     <h2 className="text-xl font-medium text-gray-800 mb-3">
                       Выберите чат
                     </h2>
                     <p className="text-gray-500 text-sm">
                       Выберите чат из списка слева, чтобы начать общение.
                     </p>
                   </div>
              </div>
            ) : currentChat && propertyInfo && user?.id ? (
              // Передаем все нужные props в ChatWidget
              <ChatWidget
                key={params.id} 
                chatId={params.id}
                userId={user.id}
                property={propertyInfo} 
                participantDetails={participantDetails || {}} 
                isLoadingParticipants={isLoadingParticipants}
                // Передаем НОВУЮ функцию
                onSendFilesAndMessage={handleSendFilesAndMessage} 
              />
            ) : (
               // Состояние, когда чат не найден после загрузки
               <div className="flex items-center justify-center h-full text-center p-8">
                  <div>
                     <FaExclamationTriangle className="w-16 h-16 mx-auto text-yellow-400 mb-4" />
                     <h2 className="text-xl font-medium text-gray-800 mb-3">
                       Чат не найден
                     </h2>
                     <p className="text-gray-500 text-sm">
                       {chatsError ? `Ошибка: ${chatsError}` : "Возможно, чат был удален или ссылка неверна."}
                     </p>
                  </div>
               </div>
            )}
        </div>
      </div> {/* Конец max-w-7xl flex контейнера */} 

      {/* Модальное окно подтверждения удаления (вне основной структуры) */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteChat}
        title="Подтвердите удаление"
        message="Вы уверены, что хотите удалить этот чат? Это действие необратимо."
        confirmButtonText="Удалить"
        cancelButtonText="Отмена"
        isProcessing={isDeleting}
      />
        
    </div> //{/* Конец внешнего контейнера */}
  );
};

export default ChatPage; 
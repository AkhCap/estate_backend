"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { Manager } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaTimes, FaExclamationTriangle, FaUserCircle, FaPaperclip, FaFileAlt } from "react-icons/fa";
import { BsCheck, BsCheckAll } from "react-icons/bs";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import { PropertyInfo } from "@/types";
import chatAxiosInstance from "@/lib/chatAxios";
import Link from "next/link";
import axios from "axios";
import toast from 'react-hot-toast';
import styles from './ChatWidget.module.css';
import ChatInput, { ChatInputHandle } from './ChatInput';

interface FileContent {
  type: 'image' | 'file';
  url: string;
  filename: string;
  content_type: string;
  size: number;
  caption?: string;
}

interface FilesMessageContent {
  type: 'files';
  caption: string | null;
  files: Array<{
    url: string;
    filename: string;
    content_type: string;
    size: number;
  }>;
}

interface Message {
  id: string;
  chat_id?: string;
  sender_id: number;
  content: string;
  created_at: string;
  message_type?: 'text' | 'image' | 'file';
  is_read?: boolean;
  error?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  temp_id?: string;
}

interface ParticipantDetails {
    avatar_url?: string | null;
    name?: string; 
    isOnline?: boolean;
}

interface ChatProps {
  chatId: string;
  userId: number;
  property: PropertyInfo;
  participantDetails: { [key: number]: ParticipantDetails };
  isLoadingParticipants: boolean;
  onSendFilesAndMessage: (files: File[], message: string) => Promise<void>;
}

const formatDateSeparator = (dateString: string): string => {
  const messageDate = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  messageDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) {
    return "Сегодня";
  }
  if (messageDate.getTime() === yesterday.getTime()) {
    return "Вчера";
  }
  return messageDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const MAIN_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const getFullImageUrl = (filename?: string | null): string => {
  if (!filename) return "/images/placeholder.png";
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  if (filename.includes('avatar')) {
      return `${MAIN_BACKEND_BASE_URL}/uploads/avatars/${filename}`;
  }
  return `${MAIN_BACKEND_BASE_URL}/uploads/properties/${filename}`;
};

interface ChatHeaderProps {
  property: PropertyInfo;
  participantDetails: { [key: number]: ParticipantDetails };
  userId: number;
}

const ChatHeader = memo(({ property, participantDetails, userId }: ChatHeaderProps) => {
  console.log("[ChatHeader] Rendering. Property:", property, "Participants:", participantDetails);
  const otherParticipantId = Object.keys(participantDetails).find(id => parseInt(id) !== userId);
  const otherUserDetails = otherParticipantId ? participantDetails[parseInt(otherParticipantId)] : null;

  console.log("[ChatHeader] Other User Details:", otherUserDetails);

  const propertyImageUrl = getFullImageUrl(property?.image);
  
  const participantName = otherUserDetails?.name || 'Собеседник';
  const initial = participantName.charAt(0).toUpperCase();

  return (
    <Link href={`/properties/${property.id}`} legacyBehavior passHref>
      <a 
        className="block bg-white border-b border-gray-200 p-3 hover:bg-gray-50 transition-colors duration-150 group cursor-pointer"
        aria-label={`Перейти к объявлению ${property.title}`}
      >
        <div className="flex items-center justify-between space-x-4">
           <div className="flex items-center space-x-3 min-w-0">
             <div className="relative flex-shrink-0">
                 <span className="flex items-center justify-center h-11 w-11 rounded-full bg-gray-300 text-gray-600 font-medium text-lg border-2 border-white shadow-sm">
                     {initial}
                 </span>
                 {otherUserDetails && (
                    <span 
                        className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${otherUserDetails.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                        title={otherUserDetails.isOnline ? 'В сети' : 'Не в сети'}
                    ></span>
                 )}
             </div>
             <div className="min-w-0">
                 <p className="text-sm font-semibold text-gray-900 truncate">{participantName}</p>
             </div>
           </div>

           <div className="flex items-center space-x-3 flex-shrink-0">
                <div className="text-right min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                        {property.title || "Объявление"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                        {property.price ? `${property.price.toLocaleString('ru-RU')} TJS` : "Цена не указана"}
                    </p>
                </div>
                <div className="w-12 h-12 flex-shrink-0 relative">
                     <Image 
                         src={propertyImageUrl || '/images/placeholder.png'} 
                         alt={property.title || "Фото объекта"}
                         fill
                         sizes="48px"
                         className="rounded-md object-cover border border-gray-200"
                         onError={(e) => { 
                             const target = e.target as HTMLImageElement;
                             target.onerror = null;
                             target.src='/images/placeholder.png'; 
                         }}
                     />
                 </div>
           </div>
        </div>
      </a>
    </Link>
  );
});

ChatHeader.displayName = 'ChatHeader';

const ChatWidget: React.FC<ChatProps> = ({ chatId, userId, property, participantDetails, isLoadingParticipants, onSendFilesAndMessage }) => {
  console.log(`[ChatWidget Init] Received props: chatId=${chatId}, userId=${userId}`);

  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<typeof Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [showConnectionError, setShowConnectionError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);
  const initialLoadCompleteRef = useRef(false);

  const scrollToBottomSmooth = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    console.log("[scrollToBottomSmooth] Attempted smooth scroll.");
  }, []);
  
  const scrollToBottomInstant = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    console.log("[scrollToBottomInstant] Attempted instant scroll.");
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      if (!initialLoadCompleteRef.current) {
        scrollToBottomInstant();
        initialLoadCompleteRef.current = true;
      } else {
        scrollToBottomSmooth();
      }
    }
    return () => {
      initialLoadCompleteRef.current = false;
    };
  }, [messages, scrollToBottomInstant, scrollToBottomSmooth, chatId]);

  const groupedMessages = useMemo(() => {
    console.log('[ChatWidget useMemo] Recalculating groupedMessages. Input messages:', messages);
    const sortedMessages = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    if (sortedMessages.length === 0) return [];

    const groups: { dateString: string; messages: Message[] }[] = [];
    let currentGroup: { dateString: string; messages: Message[] } | null = null;
    for (const message of sortedMessages) {
      const messageDateStr = new Date(message.created_at).toDateString();
      if (!currentGroup || currentGroup.dateString !== messageDateStr) {
        currentGroup = { dateString: messageDateStr, messages: [message] };
        groups.push(currentGroup);
      } else {
        currentGroup.messages.push(message);
      }
    }
    return groups;
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    if (!chatId) return;
    setIsLoadingHistory(true);
    setHistoryError(null);
    console.log(`[ChatWidget] Загрузка истории для чата ${chatId}`);
    try {
      const response = await chatAxiosInstance.get(`/chats/${chatId}/messages`);
      console.log(`[ChatWidget] История получена для ${chatId}:`, response.data);
      if (response.data && Array.isArray(response.data.messages)) {
        const fetchedMessages = response.data.messages.map((msg: any) => ({
          ...msg,
          created_at: new Date(msg.created_at).toISOString(),
          message_type: msg.message_type || 'text' 
        }));
        setMessages(fetchedMessages);
      } else {
        setMessages([]);
      }
    } catch (error: any) {
      console.error(`[ChatWidget] Ошибка загрузки истории для ${chatId}:`, error);
      setHistoryError("Не удалось загрузить историю сообщений.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [chatId]);

  useEffect(() => {
    if (!userId || !chatId) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.error("[ChatWidget] Токен отсутствует, не могу подключиться к сокету.");
      return;
    }

    const SOCKET_URL = process.env.NEXT_PUBLIC_CHAT_SOCKET_URL || "http://localhost:8001"; 
    console.log(`[ChatWidget] Connecting to Socket.IO at: ${SOCKET_URL}`);

    const manager = new Manager(SOCKET_URL, {
      path: '/socket.io',
      transportOptions: {
        polling: {
          extraHeaders: {
            Authorization: `Bearer ${token}`
          }
        }
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    const newSocket = manager.socket('/');

    newSocket.on("connect", () => {
      console.log("[ChatWidget] Connected to chat server, SID:", newSocket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectAttempt(0);
      setShowConnectionError(false);
      newSocket.emit("join_chat", { chat_id: chatId, user_id: userId });
      console.log(`[ChatWidget] Emitted join_chat for chat ${chatId}`);
      fetchMessages(); 
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("[ChatWidget] Disconnected from chat server:", reason);
      setIsConnected(false);
      if (reason !== "io client disconnect") {
         setIsReconnecting(true);
         setShowConnectionError(true);
      }
    });

    newSocket.on("connect_error", (err) => {
      console.error("[ChatWidget] Connection error:", err);
      setIsConnected(false);
      setIsReconnecting(true);
      setShowConnectionError(true);
    });

    newSocket.on("reconnect_attempt", (attempt) => {
      console.log(`[ChatWidget] Reconnect attempt ${attempt}`);
      setReconnectAttempt(attempt + 1);
      setIsReconnecting(true);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("[ChatWidget] Reconnect failed");
      setIsReconnecting(false);
      setShowConnectionError(true);
    });

    newSocket.on("reconnect", (attempt) => {
      console.log(`[ChatWidget] Reconnected successfully after ${attempt} attempts`);
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectAttempt(0);
      setShowConnectionError(false);
      newSocket.emit("join_chat", { chat_id: chatId, user_id: userId });
      console.log(`[ChatWidget] Re-joined chat ${chatId} after reconnect`);
      fetchMessages(); 
    });

    newSocket.on("new_message", (message: any) => {
      console.log("[ChatWidget] === Received new_message Event ===", message);
      
      let parsedMessage: Message;
      try {
          console.log("[ChatWidget new_message] Attempting to parse message...");
          if (typeof message === 'string') {
              parsedMessage = JSON.parse(message);
          } else if (typeof message === 'object' && message !== null) {
              parsedMessage = message;
          } else {
              throw new Error("Invalid message format received from server");
          }
          
          parsedMessage.message_type = parsedMessage.message_type || 'text';
          parsedMessage.created_at = new Date(parsedMessage.created_at).toISOString();
          const receivedTempId = parsedMessage.temp_id;

          console.log(`[ChatWidget new_message] Parsed message ID ${parsedMessage.id} for chat ${parsedMessage.chat_id}. Received temp_id: ${receivedTempId}. Current chat ID: ${chatId}`);

          if (parsedMessage.chat_id === chatId) {
              console.log("[ChatWidget new_message] Chat ID matches. Preparing to update state...");
              setMessages((prevMessages) => {
                  console.log(`[ChatWidget setMessages] Updating state. Prev count: ${prevMessages.length}. New message ID: ${parsedMessage.id}. Temp ID: ${receivedTempId}`);
                  
                  let messageExists = false;
                  const updatedMessages = prevMessages.map(msg => {
                      if (receivedTempId && msg.temp_id === receivedTempId) {
                          console.log(`[ChatWidget setMessages] Found matching temp_id ${receivedTempId}. Replacing message ID ${msg.id} with ${parsedMessage.id}.`);
                          messageExists = true;
                          return { 
                              ...parsedMessage,
                              status: parsedMessage.sender_id === userId ? 'sent' : 'delivered'
                          } as Message;
                      }
                      if (msg.id === parsedMessage.id) {
                          console.warn(`[ChatWidget setMessages] Duplicate message detected by real ID (${parsedMessage.id}), not adding/replacing.`);
                          messageExists = true;
                          return msg;
                      }
                      return msg;
                  });

                  if (!messageExists) {
                      console.log(`[ChatWidget setMessages] No existing message found. Adding new message.`);
                      updatedMessages.push({ 
                          ...parsedMessage,
                          status: parsedMessage.sender_id === userId ? 'sent' : 'delivered'
                      } as Message);
                  }

                  console.log(`[ChatWidget setMessages] State update calculated. New count: ${updatedMessages.length}. Returning new array.`);
                  return updatedMessages;
              });
              
              console.log(`[ChatWidget new_message Check] Sender ID: ${parsedMessage.sender_id} (Type: ${typeof parsedMessage.sender_id}), Current User ID: ${userId} (Type: ${typeof userId})`);
              
              if (parsedMessage.sender_id !== userId) {
                  console.log(`[ChatWidget] Отправка события read_messages для чата ${chatId}, пользователь ${userId}`);
                  console.log(`[ChatWidget PRE-TIMEOUT CHECK] newSocket connected: ${newSocket.connected}`); 
                  setTimeout(() => {
                      if (newSocket.connected) { 
                          console.log(`[ChatWidget Emit read_messages Delayed] Emitting for chat ${chatId}, user ${userId}`);
                          newSocket.emit('read_messages', { chat_id: chatId, reader_user_id: userId });
                      } else {
                          console.warn('[ChatWidget Emit read_messages Delayed] Socket disconnected before emit.');
                      }
                  }, 200);
              }

              if (receivedTempId && parsedMessage.sender_id === userId) {
                  console.log('[ChatWidget new_message] Message confirmed by server, resetting isSending.');
                  setIsSending(false);
              }

          } else {
              console.warn(`[ChatWidget new_message] Received message for different chat (${parsedMessage.chat_id}), ignoring.`);
          }
          
      } catch (error) {
          console.error("[ChatWidget new_message] Error processing received message:", error, "Original message:", message);
          const receivedTempId = message?.temp_id; 
          if (receivedTempId) {
              setMessages(prev => prev.map(msg => 
                  msg.temp_id === receivedTempId ? { ...msg, error: true, status: undefined } : msg
              ));
              if (message?.sender_id === userId) setIsSending(false);
          }
      }
    });

    const handleMessageStatusUpdate = (data: { message_ids: string[], chat_id: string, is_read: boolean }) => {
        console.log('[ChatWidget] === Received message_status_update Event ===', data);
        if (data.chat_id === chatId && data.is_read && Array.isArray(data.message_ids)) {
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    data.message_ids.includes(msg.id) && msg.sender_id === userId
                      ? { ...msg, is_read: true, status: 'read' }
                      : msg
                )
            );
        } else {
             console.warn('[ChatWidget message_status_update] Ignoring update:', data);
        }
    };

    newSocket.on('message_status_update', handleMessageStatusUpdate);

    newSocket.on("chat_error", (errorData: any) => {
        console.error("[ChatWidget] Received chat_error:", errorData);
        toast.error(errorData.message || "Произошла ошибка в чате");
    });

    setSocket(newSocket);

    return () => {
      console.log("[ChatWidget] Disconnecting socket...");
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("connect_error");
      newSocket.off("reconnect_attempt");
      newSocket.off("reconnect_failed");
      newSocket.off("reconnect");
      newSocket.off("new_message");
      newSocket.off("chat_error");
      newSocket.off("message_status_update", handleMessageStatusUpdate);
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setIsReconnecting(false);
      setShowConnectionError(false);
    };
  }, [chatId, userId, fetchMessages]);

  // --- Новый useEffect для отправки read_messages --- 
  const hasSentReadEventRef = useRef(false); // Флаг для предотвращения повторной отправки

  useEffect(() => {
      // Проверяем, есть ли непрочитанные сообщения от ДРУГОГО пользователя
      const hasUnreadFromOther = messages.some(
          (msg) => msg.sender_id !== userId && !msg.is_read
      );

      console.log(`[ChatWidget readEffect Check] HasUnreadFromOther: ${hasUnreadFromOther}, HasSentReadEvent: ${hasSentReadEventRef.current}`);

      // Если есть непрочитанные И мы еще не отправляли событие
      if (hasUnreadFromOther && !hasSentReadEventRef.current && socket?.connected && chatId && userId) {
           console.log(`[ChatWidget readEffect Emit] Emitting read_messages for chat ${chatId}, user ${userId}`);
           socket.emit('read_messages', { chat_id: chatId, reader_user_id: userId });
           hasSentReadEventRef.current = true; // Устанавливаем флаг, что отправили
      } else if (!hasUnreadFromOther && hasSentReadEventRef.current) {
          // Если непрочитанных больше нет, сбрасываем флаг для будущих сообщений
          console.log('[ChatWidget readEffect Reset] Resetting read event flag.');
          hasSentReadEventRef.current = false;
      }
      // Добавляем socket?.connected в зависимости, чтобы эффект перезапускался при изменении статуса сокета
  }, [messages, chatId, userId, socket?.connected]); 
  // --- Конец нового useEffect --- 

  const handleSendMessage = useCallback(async (content: string) => {
    console.log('[handleSendMessage] Triggered for optimistic update. Content:', content);
    console.log('[handleSendMessage] Socket state:', {
      connected: socket?.connected,
      id: socket?.id
    });
    
    if (!socket || !chatId || !userId || !content.trim() || isSending) {
        console.warn('[handleSendMessage] Pre-send check failed or already sending. Aborting.', {
            socket: !!socket,
            chatId,
            userId,
            content: content.trim(),
            isSending
        });
        return;
    }

    setIsSending(true);

    console.log('[handleSendMessage] Creating optimistic message with userIdProp:', userId);
    
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMessage: Message = {
      id: tempId,
      temp_id: tempId,
      chat_id: chatId,
      sender_id: userId,
      content: content,
      created_at: new Date().toISOString(),
      message_type: 'text',
      status: 'sending',
      is_read: false,
    };

    setMessages((prevMessages) => [...prevMessages, optimisticMessage]);
    console.log('[handleSendMessage] Optimistic message added to state:', optimisticMessage);
    
    try {
      const messageData = {
        chat_id: chatId,
        sender_id: userId,
        content: content,
        message_type: 'text',
        temp_id: tempId
      };
      
      console.log('[handleSendMessage] Emitting send_message event with data:', messageData);
      socket.emit('send_message', messageData, (response: any) => {
        console.log('[handleSendMessage] Server acknowledged message:', response);
      });
      console.log('[handleSendMessage] Event emitted successfully');
    } catch (error) {
      console.error("[handleSendMessage] Error sending message:", error);
      toast.error("Не удалось отправить сообщение.");
      setMessages(prev => prev.map(msg => 
        msg.temp_id === tempId ? { ...msg, error: true, status: undefined } : msg
      ));
      setIsSending(false);
    }
  }, [socket, chatId, userId, isSending]);

  const handleSendFileWithMessage = useCallback(async (files: File[], message: string): Promise<void> => {
    if (!socket || !chatId || !userId || isUploading) return;

    setIsUploading(true);
    const uploadToastId = toast.loading('Загрузка файла...');

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    if (message.trim() !== "") {
      formData.append("message", message.trim());
    }

    try {
      const response = await chatAxiosInstance.post(`/uploads/${chatId}`, formData, {
      });
      
      toast.success('Файл отправлен', { id: uploadToastId });
      chatInputRef.current?.focusInput();

    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || "Не удалось загрузить файл.";
      toast.error(`Ошибка: ${errorMsg}`, { id: uploadToastId });
    } finally {
      setIsUploading(false);
    }
  }, [socket, chatId, userId, isUploading]);

  const renderMessageContent = useCallback((message: Message) => {
      let parsedContent: FileContent | FilesMessageContent | null = null;
      let contentToRender: React.ReactNode = message.content;

      try {
          parsedContent = JSON.parse(message.content);
          if (!parsedContent || typeof parsedContent !== 'object') {
             throw new Error('Invalid JSON content');
          }
      } catch (e) {
          parsedContent = null;
      }

      if (parsedContent) {
          if ((parsedContent.type === 'image' || parsedContent.type === 'file') && 'url' in parsedContent && !('files' in parsedContent)) {
               const fileInfo = parsedContent as FileContent;
               if (fileInfo.type === 'image') {
                   contentToRender = (
                       <div className="relative w-60 h-[135px] cursor-pointer group overflow-hidden rounded-md" onClick={() => { setModalImageUrl(fileInfo.url); setIsImageModalOpen(true); }}>
                           <Image 
                             src={fileInfo.url} 
                             alt={fileInfo.filename || "Изображение"} 
                             fill sizes="240px" 
                             style={{ objectFit: 'cover' }} 
                             className="transition-transform duration-300 group-hover:scale-105" 
                             onError={(e) => { e.currentTarget.src = '/images/placeholder.png'; }} 
                           />
                           <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity duration-300">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                             </svg>
                           </div>
                       </div>
                   );
               } else {
                   contentToRender = (
                       <a href={fileInfo.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 group" download={fileInfo.filename}>
                           <FaPaperclip className="text-gray-500 flex-shrink-0 group-hover:text-blue-500 transition-colors" size={18} />
                           <div className="flex-1 min-w-0">
                               <span className="text-sm font-medium text-gray-800 block truncate" title={fileInfo.filename}>
                                   {fileInfo.filename}
                               </span>
                               <span className="text-xs text-gray-500">
                                   ({(fileInfo.size / 1024).toFixed(1)} KB)
                               </span>
                           </div>
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                           </svg>
                       </a>
                   );
               }
               if ('caption' in fileInfo && typeof fileInfo.caption === 'string' && fileInfo.caption) {
                    contentToRender = (
                        <>
                            {contentToRender}
                            <div className="mt-1.5 text-sm break-words">{fileInfo.caption}</div>
                        </>
                    );
               }
          } else if (parsedContent.type === 'files' && Array.isArray(parsedContent.files)) {
               const filesInfo = parsedContent as FilesMessageContent;
               contentToRender = (
                   <div className="space-y-2">
                       {filesInfo.files.map((fileMeta, index) => (
                           <div key={index}>
                               {fileMeta.content_type.startsWith('image/') ? (
                                   <div className="relative w-60 h-[135px] cursor-pointer group overflow-hidden rounded-md" onClick={() => { setModalImageUrl(fileMeta.url); setIsImageModalOpen(true); }}>
                                       <Image 
                                        src={fileMeta.url} 
                                        alt={fileMeta.filename || "Изображение"} 
                                        fill sizes="240px" 
                                        style={{ objectFit: 'cover' }} 
                                        className="transition-transform duration-300 group-hover:scale-105" 
                                        onError={(e) => { e.currentTarget.src = '/images/placeholder.png'; }} 
                                      />
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-opacity duration-300">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                        </svg>
                                      </div>
                                   </div>
                               ) : (
                                   <a href={fileMeta.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-3 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors border border-gray-200 group" download={fileMeta.filename}>
                                       <FaPaperclip className="text-gray-500 flex-shrink-0 group-hover:text-blue-500 transition-colors" size={18} />
                                       <div className="flex-1 min-w-0">
                                           <span className="text-sm font-medium text-gray-800 block truncate" title={fileMeta.filename}>
                                               {fileMeta.filename}
                                           </span>
                                           <span className="text-xs text-gray-500">
                                               ({(fileMeta.size / 1024).toFixed(1)} KB)
                                           </span>
                                       </div>
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                       </svg>
                                   </a>
                               )}
                           </div>
                       ))}
                       {filesInfo.caption && (
                           <div className="text-sm text-gray-600 break-words mt-2">{filesInfo.caption}</div>
                       )}
                   </div>
               );
          } else {
               contentToRender = <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-w-full">{JSON.stringify(parsedContent, null, 2)}</pre>;
          }
      } else {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          const parts = message.content.split(urlRegex);
          contentToRender = parts.map((part, index) =>
              urlRegex.test(part) ? (
                  <a href={part} key={index} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {part}
                  </a>
              ) : (
                  part
              )
          );
      }

      return contentToRender;
  }, [setModalImageUrl, setIsImageModalOpen]);

  const isLoading = isLoadingHistory || isLoadingParticipants;
  const error = historyError;

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Пожалуйста, войдите в систему для доступа к чату</p>
      </div>
    );
  }

  console.log(`[ChatWidget Render] Rendering component. Messages count: ${messages.length}`);
  if (messages.length > 0) {
    console.log(`[ChatWidget Render] Last message in state:`, messages[messages.length - 1]);
  }
  console.log(`[ChatWidget Render] Calculated groupedMessages:`, groupedMessages);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ChatHeader 
        property={property} 
        participantDetails={participantDetails}
        userId={userId}
      />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth relative">
        {isLoading && (
          <div className="absolute inset-0 flex justify-center items-center bg-gray-50 bg-opacity-80 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        {!isLoading && error && (
          <div className="flex justify-center items-center h-full">
            <p className="text-red-500">{error}</p>
          </div>
        )}
        {!isLoading && !error && groupedMessages.length === 0 && (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-500">Нет сообщений в этом чате.</p>
          </div>
        )}
        {!isLoading && !error && groupedMessages.length > 0 && (
          groupedMessages.map((group) => (
            <div key={group.dateString}>
              <div className="text-center my-4">
                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                  {formatDateSeparator(group.dateString)}
                </span>
              </div>
              {group.messages.map((message, messageIndex) => {
                const isCurrentUser = message.sender_id === userId;
                const participant = participantDetails[message.sender_id];

                let avatarUrl: string | undefined = undefined;
                if (participant && participant.avatar_url) {
                  if (participant.avatar_url.startsWith('http') || participant.avatar_url.startsWith('/')) {
                    avatarUrl = participant.avatar_url;
                  } else {
                    const MAIN_BACKEND_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
                    avatarUrl = `${MAIN_BACKEND_BASE_URL}/uploads/avatars/${participant.avatar_url}`;
                  }
                }
                
                const participantName = participant?.name || 'Пользователь';
                const initial = participantName.charAt(0).toUpperCase();

                return (
                  <motion.div
                    key={message.id || message.temp_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex mb-3 ${ 
                      isCurrentUser ? 'justify-end' : 'justify-start' 
                    } items-end`}
                  >
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 mr-2">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={participantName}
                            width={32}
                            height={32}
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'; 
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="flex items-center justify-center h-full w-full bg-gray-300 text-gray-600 font-medium">${initial}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="flex items-center justify-center h-full w-full bg-gray-300 text-gray-600 font-medium">
                            {initial}
                          </span>
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-gray-500 mb-1 ml-1 mr-1">
                        {isCurrentUser ? 'Вы' : participantName}
                      </span>

                      <div
                        className={`relative max-w-full break-words ${
                            message.message_type === 'text' 
                            ? `px-4 py-2 rounded-2xl ${
                                isCurrentUser
                                ? 'bg-blue-600 text-white rounded-br-none chat-bubble-sent' 
                                : 'bg-gray-200 text-gray-800 rounded-bl-none chat-bubble-received'
                              } ${message.error ? 'border border-red-300' : ''}`
                            : ''
                        }`}
                      >
                        <div className="text-base"> 
                            {renderMessageContent(message)}
                        </div>
                        {message.error && (
                            <div className="absolute bottom-1 right-1 p-0.5 bg-white rounded-full">
                                <FaExclamationTriangle className="text-red-500 w-3 h-3" title="Ошибка отправки" />
                            </div>
                        )}
                      </div>
                      <div className={`mt-1.5 text-xs flex items-center ${isCurrentUser ? 'justify-end text-gray-400' : 'text-gray-400'}`}>
                        <span>{new Date(message.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        {isCurrentUser && !message.error && (
                          <span className="ml-1.5 flex items-center" title={message.is_read ? "Прочитано" : "Отправлено/Доставлено"}>
                            {message.is_read ? (
                              <BsCheckAll className="h-4 w-4 text-blue-400" />
                            ) : (
                              <BsCheck className="h-4 w-4 text-gray-400" /> 
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {isCurrentUser && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-blue-100 ml-2">
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={participantName}
                            width={32}
                            height={32}
                            className="object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="flex items-center justify-center h-full w-full bg-blue-200 text-blue-700 font-medium">${initial}</span>`;
                              }
                            }}
                          />
                        ) : (
                          <span className="flex items-center justify-center h-full w-full bg-blue-200 text-blue-700 font-medium">
                            {initial}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
      {showConnectionError && (
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-100 border-b border-red-300 text-red-700 px-4 py-2 text-sm flex items-center justify-between"
          >
              <span>
                  {isReconnecting 
                      ? `Проблема с соединением. Попытка переподключения ${reconnectAttempt > 0 ? `(${reconnectAttempt})` : '...'}` 
                      : "Не удалось подключиться к чату."} 
              </span>
              <button onClick={() => setShowConnectionError(false)} className="text-red-500 hover:text-red-700">
                  <FaTimes />
              </button>
          </motion.div>
      )}
      </AnimatePresence>

      <ChatInput 
        ref={chatInputRef}
        onSendMessage={handleSendMessage}
        onSendFilesAndMessage={handleSendFileWithMessage}
        isUploading={isUploading} 
        disabled={!isConnected || isLoading}
      />

      <AnimatePresence>
        {isImageModalOpen && modalImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
            onClick={() => setIsImageModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative rounded-lg overflow-hidden shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image 
                src={modalImageUrl} 
                alt="Увеличенное изображение"
                width={1920}
                height={1080}
                style={{ objectFit: 'contain' }}
                className="block max-h-[80vh]"
              />
              <button 
                onClick={() => setIsImageModalOpen(false)} 
                className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1.5 hover:bg-opacity-75 transition-opacity"
                aria-label="Закрыть"
              >
                <FaTimes size={18} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatWidget; 
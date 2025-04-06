import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react';
import { FaPaperPlane, FaPaperclip, FaTimes, FaFileAlt, FaImage, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendFilesAndMessage: (files: File[], message: string) => Promise<void>;
  disabled?: boolean;
  isUploading?: boolean;
}

export interface ChatInputHandle {
  focusInput: () => void;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/plain'
];

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({ 
  onSendMessage, 
  onSendFilesAndMessage,
  disabled = false, 
  isUploading = false 
}, ref) => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focusInput: () => {
      textAreaRef.current?.focus();
    }
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'inherit';
      const scrollHeight = textAreaRef.current.scrollHeight;
      const maxHeight = 120; 
      textAreaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      if (e.target.value === '' && selectedFiles.length === 0) {
        textAreaRef.current.style.height = '42px';
      }
    }
  };

  const handleAttachClick = () => {
    if (!isUploading && !disabled) {
        fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const files = Array.from(event.target.files);
    const validFiles: File[] = [];
    
    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`Файл "${file.name}" слишком большой (макс. ${MAX_FILE_SIZE_MB} MB).`);
      } else if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`Файл "${file.name}" имеет неподдерживаемый тип.`);
      } else {
        validFiles.push(file);
      }
    });

    setSelectedFiles(validFiles); 
    
    event.target.value = "";

    textAreaRef.current?.focus();
  };

  const handleRemoveFile = (indexToRemove: number) => {
      setSelectedFiles(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
      if (selectedFiles.length === 1 && newMessage === "") {
           if (textAreaRef.current) textAreaRef.current.style.height = '42px';
      }
  };

  const handleSendClick = async () => {
    if (disabled) return; 

    const messageToSend = newMessage.trim();
    const filesToSend = selectedFiles;

    if (messageToSend === "" && filesToSend.length === 0) return;

    try {
      if (filesToSend.length > 0) {
        console.log('[ChatInput] Sending files and message via onSendFilesAndMessage');
        await onSendFilesAndMessage(filesToSend, messageToSend);
        setNewMessage("");
        setSelectedFiles([]);
        if (textAreaRef.current) {
            textAreaRef.current.style.height = '42px';
        }
      } else if (messageToSend !== "") {
        console.log('[ChatInput] Sending text message via onSendMessage');
        onSendMessage(messageToSend);
        setNewMessage("");
        if (textAreaRef.current) {
            textAreaRef.current.style.height = '42px';
        }
      }
    } catch (error) {
        console.error("Ошибка при отправке сообщения/файлов из ChatInput:", error);
    }
    
    requestAnimationFrame(() => {
      textAreaRef.current?.focus();
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !disabled) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const renderFilePreview = (file: File, index: number) => {
    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    return (
        <div key={index} className="mb-2 mr-2 p-2 border border-gray-200 rounded-md bg-gray-50 relative max-w-[150px] inline-block shadow-sm">
           <button 
            onClick={() => handleRemoveFile(index)}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 z-10 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
            aria-label="Удалить файл"
           >
               <FaTimes className="w-2.5 h-2.5"/> 
           </button>
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded flex-shrink-0 border border-gray-200">
              {isImage && previewUrl ? ( 
                <Image
                  src={previewUrl}
                  alt={`Превью ${file.name}`}
                  width={40}
                  height={40}
                  className="rounded object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                  onError={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); }}
                />
              ) : ( 
                 <FaFileAlt className="w-5 h-5 text-gray-400" />
              )}
            </div>
             <div className="text-xs text-gray-600 truncate min-w-0">
                  <span className="block font-medium truncate" title={file.name}> {file.name} </span>
                  <span className="text-gray-500 block">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
              </div>
          </div>
        </div>
    );
  }

  return (
    <div className="p-4 bg-white border-t border-gray-200">
      {selectedFiles.length > 0 && (
        <div className="mb-2 border-b border-gray-200 pb-2 overflow-x-auto whitespace-nowrap">
           {selectedFiles.map(renderFilePreview)}
        </div>
      )}
      
      <div className="relative flex items-end">
        <button
          onClick={handleAttachClick}
          disabled={isUploading || disabled}
          className={`p-2 text-gray-400 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed mr-2 transition-colors self-center`}
          title="Прикрепить файл"
        >
         {isUploading ? (
            <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <FaPaperclip className="w-5 h-5" />
          )}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*, application/pdf, .doc, .docx, .txt"
          disabled={isUploading || disabled}
          multiple
        />
        <textarea
          ref={textAreaRef}
          rows={1}
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={
            selectedFiles.length > 0 ? "Добавьте подпись (необязательно)..." : 
            (disabled ? "Подключение..." : "Введите сообщение...")
          }
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition-colors disabled:bg-gray-100 resize-none overflow-hidden text-sm"
          disabled={disabled}
          style={{ minHeight: '42px', maxHeight: '120px' }}
          onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'inherit';
              const scrollHeight = target.scrollHeight;
               const maxHeight = 120;
              target.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
               if (target.value === '') {
                 target.style.height = '42px';
               }
          }}
        />
        <button
          onClick={handleSendClick}
          disabled={ (newMessage.trim() === "" && selectedFiles.length === 0) || disabled } 
          className="ml-2 bg-blue-500 text-white p-2.5 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
        >
          <FaPaperPlane className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 
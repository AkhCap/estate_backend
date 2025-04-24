"use client";
import React, { forwardRef, useRef, useState, useImperativeHandle } from 'react';
import { FaPaperPlane, FaPaperclip, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage, FaFileExcel, FaTimes, FaEye } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export interface ChatInputHandle {
  focusInput: () => void;
  clearInput: () => void;
}

export interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onSendFilesAndMessage: (files: File[], message: string) => Promise<void>;
  isUploading?: boolean;
  isSending?: boolean;
  disabled?: boolean;
  className?: string;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({
  onSendMessage,
  onSendFilesAndMessage,
  isUploading = false,
  isSending = false,
  disabled = false,
  className = ''
}, ref) => {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  useImperativeHandle(ref, () => ({
    clearInput: () => {
      setMessage('');
      setFiles([]);
    },
    focusInput: () => {
      textareaRef.current?.focus();
    }
  }));

  const handleSend = async () => {
    if ((!message.trim() && files.length === 0) || isSending || isUploading) return;

    if (files.length > 0) {
      await onSendFilesAndMessage(files, message);
      setFiles([]);
    } else {
      await onSendMessage(message);
    }
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      
      // Создаем URL для предпросмотра изображений
      const newPreviewUrls = newFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });
      setPreviewUrls(newPreviewUrls);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(newFiles);
      
      // Создаем URL для предпросмотра изображений
      const newPreviewUrls = newFiles.map(file => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });
      setPreviewUrls(newPreviewUrls);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <FaFileImage className="w-5 h-5 text-blue-500" />;
    }
    if (file.type === 'application/pdf') {
      return <FaFilePdf className="w-5 h-5 text-red-500" />;
    }
    if (file.type.includes('word') || file.type.includes('doc')) {
      return <FaFileWord className="w-5 h-5 text-blue-600" />;
    }
    if (file.type.includes('excel') || file.type.includes('sheet')) {
      return <FaFileExcel className="w-5 h-5 text-green-500" />;
    }
    return <FaFileAlt className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Очистка URL при размонтировании компонента
  React.useEffect(() => {
    return () => {
      previewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  const openPreview = (index: number) => {
    setPreviewIndex(index);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const nextPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewIndex((prev) => (prev + 1) % previewUrls.filter(Boolean).length);
  };

  const prevPreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewIndex((prev) => (prev - 1 + previewUrls.filter(Boolean).length) % previewUrls.filter(Boolean).length);
  };

  return (
    <div 
      className={`p-3 ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className={`relative rounded-2xl transition-all duration-200 ${
        isDragging ? 'bg-blue-50 border-2 border-dashed border-blue-200' : 'bg-gray-50/70 border border-gray-100'
      }`}>
        {files.length > 0 && (
          <div className="px-3 pt-2">
            <div className="flex flex-wrap gap-2 mb-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-white px-2 py-1 rounded-lg text-xs border border-gray-100"
                >
                  {file.type.startsWith('image/') && previewUrls[index] ? (
                    <div className="relative group">
                      <div className="w-8 h-8 rounded overflow-hidden mr-2">
                        <Image 
                          src={previewUrls[index]} 
                          alt={file.name} 
                          width={32} 
                          height={32} 
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <button
                        onClick={() => openPreview(index)}
                        className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded"
                      >
                        <FaEye size={12} className="text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded overflow-hidden mr-2 flex items-center justify-center bg-gray-100">
                      {getFileIcon(file)}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <span className="text-gray-400 text-[10px]">{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    onClick={() => {
                      const newFiles = files.filter((_, i) => i !== index);
                      setFiles(newFiles);
                      if (previewUrls[index]) {
                        URL.revokeObjectURL(previewUrls[index]);
                        const newUrls = [...previewUrls];
                        newUrls[index] = '';
                        setPreviewUrls(newUrls);
                      }
                    }}
                    className="ml-2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex items-end p-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={disabled}
          >
            <FaPaperclip size={16} />
          </button>
          
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            className="flex-1 mx-2 p-2 bg-transparent text-gray-700 text-sm placeholder-gray-400 outline-none resize-none max-h-32"
            rows={1}
            disabled={disabled}
          />
          
          <button
            onClick={handleSend}
            disabled={(!message.trim() && files.length === 0) || disabled || isSending || isUploading}
            className={`p-2 rounded-xl transition-colors ${
              (!message.trim() && files.length === 0) || disabled || isSending || isUploading
                ? 'text-gray-300'
                : 'text-blue-500 hover:text-blue-600'
            }`}
          >
            {isUploading || isSending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            ) : (
              <FaPaperPlane size={16} />
            )}
          </button>
        </div>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Модальное окно для предпросмотра изображений */}
      <AnimatePresence>
        {showPreview && previewUrls.filter(Boolean).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={closePreview}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl w-full rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video">
                <Image 
                  src={previewUrls.filter(Boolean)[previewIndex]} 
                  alt="Предпросмотр"
                  fill
                  style={{ objectFit: 'contain' }}
                  className="bg-black"
                />
              </div>
              
              {previewUrls.filter(Boolean).length > 1 && (
                <>
                  <button 
                    onClick={prevPreview}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button 
                    onClick={nextPreview}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
              
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {previewUrls.filter(Boolean).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewIndex(idx);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === previewIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
              
              <button 
                onClick={closePreview}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors"
              >
                <FaTimes size={16} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 
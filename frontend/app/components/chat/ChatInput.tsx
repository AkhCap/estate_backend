"use client";
import React, { forwardRef, useRef, useState } from 'react';
import { FaPaperPlane, FaPaperclip, FaFileAlt, FaFilePdf, FaFileWord, FaFileImage, FaFileExcel } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export interface ChatInputHandle {
  focusInput: () => void;
}

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  onSendFilesAndMessage: (files: File[], message: string) => Promise<void>;
  isUploading: boolean;
  disabled?: boolean;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(({
  onSendMessage,
  onSendFilesAndMessage,
  isUploading,
  disabled = false
}, ref) => {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  React.useImperativeHandle(ref, () => ({
    focusInput: () => {
      textareaRef.current?.focus();
    }
  }));

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    if (selectedFiles.length > 0) {
      await onSendFilesAndMessage(selectedFiles, message);
      setSelectedFiles([]);
    } else {
      onSendMessage(message);
    }
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-lg"
          >
            {selectedFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
              >
                {file.type.startsWith('image/') ? (
                  <div className="relative w-10 h-10 rounded overflow-hidden">
                    <Image
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      fill
                      className="object-cover"
                      onLoad={() => URL.revokeObjectURL(URL.createObjectURL(file))}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 flex items-center justify-center">
                    {getFileIcon(file)}
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600 truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="p-2.5 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Прикрепить файл"
        >
          <FaPaperclip className="w-5 h-5" />
        </button>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            className="w-full px-4 py-3 rounded-xl focus:outline-none resize-none"
            rows={1}
            disabled={disabled}
          />
        </div>

        <button
          onClick={handleSend}
          disabled={disabled || isUploading || (!message.trim() && selectedFiles.length === 0)}
          className="p-2.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm hover:shadow-md"
          title="Отправить"
        >
          <FaPaperPlane className="w-5 h-5" />
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        multiple
      />
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput; 
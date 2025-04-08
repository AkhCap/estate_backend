import React from 'react';
import { motion } from 'framer-motion';
// import { FaRegComments } from 'react-icons/fa'; 
import { MessagesSquare } from 'lucide-react'; // Используем иконку из Lucide

const SelectChatPlaceholder: React.FC = () => {
  return (
    // <<< Убираем градиент, делаем фон прозрачным >>>
    // Контейнер для центрирования карточки
    <div className="flex items-center justify-center h-full p-4 md:p-8 bg-transparent">
      {/* <<< Карточка с рамкой и тенью >>> */}
      <motion.div 
          className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-10 max-w-md w-full flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // Expo-out easing
      >
        {/* Стилизованная иконка */}
        <div className="p-5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full shadow-lg mb-8 ring-4 ring-white/60">
          <MessagesSquare className="w-20 h-20 text-indigo-600" strokeWidth={1.5} />
        </div>
        {/* Обновленный текст */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Выберите чат</h2>
        <p className="text-gray-500 text-base">
          Выберите существующий диалог из списка слева, чтобы продолжить общение.
        </p>
      </motion.div>
    </div>
  );
};

export default SelectChatPlaceholder;
import React from 'react';
import { FaRegComments } from 'react-icons/fa'; // Используем другую иконку

const SelectChatPlaceholder: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center">
      <div className="p-6 bg-white rounded-full shadow-md mb-6">
        <FaRegComments className="w-16 h-16 text-blue-500" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Добро пожаловать в чат!</h2>
      <p className="text-gray-500 max-w-xs">
        Выберите чат из списка слева, чтобы просмотреть сообщения или продолжить переписку.
      </p>
    </div>
  );
};

export default SelectChatPlaceholder;
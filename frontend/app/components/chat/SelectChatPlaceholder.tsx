"use client";
import { MessagesSquare } from "lucide-react";
import { motion } from "framer-motion";

const SelectChatPlaceholder = () => {
  return (
    <div className="flex items-center justify-center h-full p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        <div className="w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-inner">
          <MessagesSquare className="w-8 h-8 text-gray-400" strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">
          Выберите чат
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          Выберите существующий диалог из списка слева, чтобы продолжить общение.
        </p>
      </motion.div>
    </div>
  );
};

export default SelectChatPlaceholder;
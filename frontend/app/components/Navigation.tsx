"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import axios from "../../lib/axios";

export default function Navigation() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await axios.get('/users/me');
        setIsLoggedIn(true);
      } catch (error) {
        setIsLoggedIn(false);
        localStorage.removeItem('token');
      }
    }
  };

  useEffect(() => {
    checkAuth();

    // Добавляем слушатель события authStateChanged
    window.addEventListener('authStateChanged', checkAuth);

    // Очищаем слушатель при размонтировании компонента
    return () => {
      window.removeEventListener('authStateChanged', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600">Estate</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/properties" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                Объявления
              </Link>
              <Link href="/about" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                О нас
              </Link>
              <Link href="/contact" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                Контакты
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isLoggedIn ? (
              <>
                <Link href="/profile" className="text-gray-900 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-blue-50">
                  Профиль
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Выйти
                </motion.button>
              </>
            ) : (
              <>
                <Link href="/register" className="text-gray-900 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md hover:bg-blue-50">
                  Регистрация
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/login" className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Войти
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 
"use client";
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User, MessageSquare, PlusCircle } from 'lucide-react';
import { FaBars, FaTimes } from 'react-icons/fa';
import { useAuth } from "@/app/context/AuthContext";
import chatAxiosInstance from "../../lib/chatAxios";

// Анимации для hover эффектов
const hoverEffect = {
    scale: 1.05,
    transition: { type: "spring", stiffness: 300, damping: 15 }
};

const tapEffect = {
    scale: 0.95
};

export default function Navigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
    const [isMounted, setIsMounted] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        if (user) {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                chatAxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const response = await chatAxiosInstance.get("/chats/me");
                if (response.data && typeof response.data.total_unread_count === 'number') {
                    setUnreadChatCount(response.data.total_unread_count);
                } else {
                    setUnreadChatCount(0);
                }
            } catch (error: any) {
                if (error.response?.status !== 401) {
                    console.error("[Navigation] Error fetching unread count:", error);
                }
                setUnreadChatCount(0);
            }
        } else {
            setUnreadChatCount(0);
        }
    }, [user]);

    useEffect(() => {
        if (isMounted) {
            fetchUnreadCount();
            // Подписка на событие обновления, если оно будет реализовано
            const handleAuthChange = () => fetchUnreadCount();
            window.addEventListener('authStateChanged', handleAuthChange);
            // TODO: Подписаться на WebSocket событие для обновления счетчика
            return () => {
                window.removeEventListener('authStateChanged', handleAuthChange);
            };
        }
    }, [isMounted, user?.id, fetchUnreadCount]);

    // Закрытие мобильного/пользовательского меню при клике вне его
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };
        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    const handleLogout = () => {
        logout();
        setIsUserMenuOpen(false); // Закрываем меню при выходе
        router.push('/');
    };

    // Функция для навигации к чату
    const handleChatNavigation = useCallback(async () => {
        if (!user) {
            router.push('/login');
            return;
        }
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        try {
            console.log("[Navigation] Fetching chats to navigate...");
            chatAxiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const response = await chatAxiosInstance.get("/chats/me");
            if (response.data?.chats?.length > 0) {
                const firstChatId = response.data.chats[0].id;
                console.log("[Navigation] Navigating to first chat:", firstChatId);
                router.push(`/chat/${firstChatId}`);
            } else {
                console.log("[Navigation] No chats found, navigating to properties.");
                router.push('/properties'); 
            }
        } catch (error) {
            console.error("[Navigation] Error fetching chats for navigation:", error);
            router.push('/');
        }
    }, [user, router]);

    const navLinks = [
        { href: "/properties", label: "Объявления" },
        { href: "/about", label: "О нас" },
        { href: "/contact", label: "Контакты" },
    ];

    if (!isMounted) {
        return <div className="h-16"></div>; // Заглушка для предотвращения скачка макета
    }

    return (
        <nav className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md py-3 px-4 sm:px-6 lg:px-8 fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-14 items-center">
                    {/* Левая часть: Лого и основные ссылки */}
                    <div className="flex items-center">
                        <motion.div whileHover={hoverEffect} whileTap={tapEffect}>
                            <Link href="/" className="flex-shrink-0 flex items-center">
                                <span className="text-2xl font-bold text-white">EstateApp</span>
                            </Link>
                        </motion.div>
                        <div className="hidden sm:ml-10 sm:flex sm:space-x-8">
                            {navLinks.map(link => (
                                <motion.div key={link.href} whileHover={hoverEffect} whileTap={tapEffect}>
                                    <Link
                                        href={link.href}
                                        className={`inline-flex items-center pt-1 border-b-2 text-sm font-medium transition-colors ${pathname === link.href
                                                ? 'border-white text-white'
                                                : 'border-transparent text-indigo-100 hover:text-white'
                                            }`}
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Правая часть: Иконки и кнопки (Десктоп) */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-5">
                        {user ? (
                            <>
                                <motion.div whileHover={hoverEffect} whileTap={tapEffect}>
                                    <Link href="/create-property" className="flex items-center text-sm font-medium text-indigo-100 hover:text-white transition-colors" title="Добавить объявление">
                                        <PlusCircle className="h-5 w-5 mr-1.5" /> Добавить
                                    </Link>
                                </motion.div>

                                <motion.div whileHover={hoverEffect} whileTap={tapEffect}>
                                    <Link href="/chat/new" className="relative p-2 rounded-full text-indigo-100 hover:text-white transition-colors" title="Чаты">
                                        <MessageSquare className="h-5 w-5" />
                                        {unreadChatCount > 0 && (
                                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/3 -translate-y-1/3">
                                                {unreadChatCount > 9 ? '9+' : unreadChatCount}
                                            </span>
                                        )}
                                    </Link>
                                </motion.div>

                                <div className="relative" ref={userMenuRef}>
                                    <motion.button 
                                        whileHover={hoverEffect} whileTap={tapEffect}
                                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                        className="flex items-center text-sm font-medium text-indigo-100 hover:text-white transition-colors p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                                        aria-label="Меню пользователя"
                                    >
                                        <User className="h-6 w-6" />
                                    </motion.button>
                                    <AnimatePresence>
                                        {isUserMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.15 }}
                                                className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none text-gray-700"
                                            >
                                                <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 w-full text-left">
                                                    <User className="w-4 h-4 mr-2"/> Профиль
                                                </Link>
                                                <button 
                                                    onClick={handleLogout} 
                                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                                >
                                                    <LogOut className="w-4 h-4 mr-2"/> Выйти
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <>
                                <motion.div whileHover={hoverEffect} whileTap={tapEffect}>
                                    <Link href="/login" className="text-sm font-medium text-indigo-100 hover:text-white transition-colors">
                                        Войти
                                    </Link>
                                </motion.div>
                                <motion.div whileHover={hoverEffect} whileTap={tapEffect}>
                                    <Link href="/register" className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-blue-700 bg-white hover:bg-gray-100 transition-colors">
                                        Регистрация
                                    </Link>
                                </motion.div>
                            </>
                        )}
                    </div>

                    {/* Мобильное меню: Иконка бургер */}
                    <div className="-mr-2 flex items-center sm:hidden">
                        {user && (
                            <motion.div whileHover={hoverEffect} whileTap={tapEffect} className="relative mr-2">
                                <Link 
                                    href="/chat/new"
                                    className="p-2 rounded-full text-indigo-100 hover:text-white hover:bg-white/10 transition-colors focus:outline-none"
                                >
                                    <MessageSquare className="h-6 w-6" />
                                    {unreadChatCount > 0 && (
                                        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                            {unreadChatCount > 9 ? '9+' : unreadChatCount}
                                        </span>
                                    )}
                                </Link>
                            </motion.div>
                        )}
                        <motion.button
                            whileHover={hoverEffect} whileTap={tapEffect}
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            type="button"
                            className="inline-flex items-center justify-center p-2 rounded-md text-indigo-100 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
                            aria-controls="mobile-menu"
                            aria-expanded={isUserMenuOpen}
                        >
                            <span className="sr-only">Открыть меню</span>
                            {isUserMenuOpen ? (
                                <FaTimes className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <FaBars className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Выпадающее мобильное меню (темное с градиентом) */}
            <AnimatePresence>
                {isUserMenuOpen && (
                    <motion.div
                        ref={userMenuRef}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="sm:hidden bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg border-t border-white/20"
                        id="mobile-menu"
                    >
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            {navLinks.map(link => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsUserMenuOpen(false)}
                                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname === link.href
                                            ? 'bg-white/10 text-white' 
                                            : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="pt-4 pb-3 border-t border-white/20">
                                {user ? (
                                    <div className="px-2 space-y-1">
                                        <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-white/10 hover:text-white">
                                            Профиль
                                        </Link>
                                        <Link href="/create-property" onClick={() => setIsUserMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-white/10 hover:text-white">
                                            Добавить объявление
                                        </Link>
                                        <button 
                                            onClick={() => { handleLogout(); setIsUserMenuOpen(false); }}
                                            className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-300 hover:bg-red-500/20 hover:text-red-100"
                                        >
                                            Выйти
                                        </button>
                                    </div>
                                ) : (
                                    <div className="px-2 space-y-1">
                                        <Link href="/login" onClick={() => setIsUserMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-indigo-100 hover:bg-white/10 hover:text-white">
                                            Войти
                                        </Link>
                                        <Link href="/register" onClick={() => setIsUserMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-center text-blue-700 bg-white hover:bg-gray-100">
                                            Регистрация
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
} 
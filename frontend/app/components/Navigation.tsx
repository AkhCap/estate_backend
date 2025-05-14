"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MessageSquare, Plus, User } from 'lucide-react';
import { FaHome, FaBuilding, FaMapMarkedAlt, FaHandshake, FaInfoCircle, FaPhone } from 'react-icons/fa';
import { useAuth } from "@/app/context/AuthContext";
import chatAxiosInstance from "../../lib/chatAxios";

const Navigation = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (user) {
                try {
                    const response = await chatAxiosInstance.get("/chats/me");
                    setUnreadChatCount(response.data?.total_unread_count || 0);
                } catch (error) {
                    console.error("Error fetching unread count:", error);
                }
            }
        };
        fetchUnreadCount();
    }, [user]);

    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        router.push('/');
    };

    const menuItems = [
        { href: "/properties", label: "Недвижимость", icon: FaHome },
        { href: "/about", label: "О нас", icon: FaInfoCircle },
        { href: "/contact", label: "Контакты", icon: FaPhone },
    ];

    return (
        <header className="sticky top-0 z-50">
            <div className="absolute inset-0 bg-white/95 backdrop-blur-md border-b border-gray-100" />
            <nav className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Левая часть: Логотип */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center">
                            <span className="text-2xl font-bold text-gray-900">
                                ESTATE.TJ
                            </span>
                        </Link>
                    </div>

                    {/* Центральная часть: Вертикальное меню */}
                    <div className="hidden md:flex items-center space-y-0">
                        {menuItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 ${
                                    pathname === item.href
                                        ? 'text-gray-900 border-b-2 border-gray-900'
                                        : 'text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300'
                                }`}
                            >
                                <item.icon className="w-4 h-4 mr-2" />
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Правая часть */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link
                                    href="/create-property"
                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    <span className="flex items-center">
                                        <Plus className="w-4 h-4 mr-1.5" />
                                        Разместить
                                    </span>
                                </Link>
                                
                                <Link href="/chat/new" className="relative p-2">
                                    <MessageSquare className="w-6 h-6 text-gray-600 hover:text-gray-900 transition-colors" />
                                    {unreadChatCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs flex items-center justify-center rounded-full">
                                            {unreadChatCount}
                                        </span>
                                    )}
                                </Link>

                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 transition-all duration-200"
                                    >
                                        <div className="relative w-6 h-6">
                                            <User className="w-full h-full text-gray-600" strokeWidth={1.5} />
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {isMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-2 border border-gray-100"
                                            >
                                                <Link
                                                    href="/profile"
                                                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    <User className="w-5 h-5 mr-2 text-gray-500" strokeWidth={1.5} />
                                                    Мой профиль
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut className="w-5 h-5 mr-2" strokeWidth={1.5} />
                                                    Выйти
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                                >
                                    Войти
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    Регистрация
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Мобильное меню */}
                    <button
                        className="md:hidden p-2 hover:bg-gray-50"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <svg
                            className="w-6 h-6 text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {isMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Мобильное меню (выпадающее) */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden border-t border-gray-100 py-2"
                        >
                            <div className="space-y-1 px-2">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center px-3 py-2 text-sm font-medium ${
                                            pathname === item.href
                                                ? 'text-gray-900 border-l-2 border-gray-900'
                                                : 'text-gray-600 hover:text-gray-900 hover:border-l-2 hover:border-gray-300'
                                        }`}
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.label}
                                    </Link>
                                ))}

                                {user ? (
                                    <>
                                        <Link
                                            href="/create-property"
                                            className="block w-full px-3 py-1.5 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            <span className="flex items-center justify-center">
                                                <Plus className="w-4 h-4 mr-1.5" />
                                                Разместить
                                            </span>
                                        </Link>
                                        <div className="pt-4 border-t border-gray-100">
                                            <Link
                                                href="/profile"
                                                className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Мой профиль
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Выйти
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="pt-4 space-y-2">
                                        <Link
                                            href="/login"
                                            className="block px-3 py-1.5 text-center text-gray-600 hover:text-gray-900 text-sm font-medium"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Войти
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="block px-3 py-1.5 text-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Регистрация
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
};

export default Navigation; 
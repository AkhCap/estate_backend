"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MessageSquare } from 'lucide-react';
import { FaHome, FaBuilding, FaMapMarkedAlt, FaHandshake, FaInfoCircle, FaPhone, FaUserCircle } from 'react-icons/fa';
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
        <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Левая часть: Логотип и меню */}
                    <div className="flex items-center space-x-8">
                        <Link href="/" className="flex items-center">
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                                Estate
                            </span>
                        </Link>

                        <div className="flex items-center space-x-1">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                                        pathname === item.href
                                            ? 'text-emerald-600 bg-emerald-50'
                                            : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Правая часть */}
                    <div className="hidden md:flex items-center space-x-4">
                        {user ? (
                            <>
                                <Link
                                    href="/create-property"
                                    className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-200"
                                >
                                    Разместить объявление
                                </Link>
                                
                                <Link href="/chat/new" className="relative p-2">
                                    <MessageSquare className="w-6 h-6 text-gray-600 hover:text-emerald-600 transition-colors" />
                                    {unreadChatCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
                                            {unreadChatCount}
                                        </span>
                                    )}
                                </Link>

                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-50 transition-colors"
                                    >
                                        <FaUserCircle className="w-6 h-6 text-gray-600" />
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
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    Мой профиль
                                                </Link>
                                                <Link
                                                    href="/properties/my"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                    onClick={() => setIsMenuOpen(false)}
                                                >
                                                    Мои объявления
                                                </Link>
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
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
                                    className="px-4 py-2 text-gray-600 hover:text-emerald-600 font-medium transition-colors"
                                >
                                    Войти
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-medium hover:shadow-lg transition-all duration-200"
                                >
                                    Регистрация
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Мобильное меню */}
                    <button
                        className="md:hidden p-2 rounded-lg hover:bg-gray-50"
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
                                        className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium ${
                                            pathname === item.href
                                                ? 'text-emerald-600 bg-emerald-50'
                                                : 'text-gray-600 hover:text-emerald-600 hover:bg-gray-50'
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
                                            className="block w-full px-3 py-2 text-center rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-medium"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Разместить объявление
                                        </Link>
                                        <div className="pt-4 border-t border-gray-100">
                                            <Link
                                                href="/profile"
                                                className="block px-3 py-2 rounded-lg text-sm text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                Мой профиль
                                            </Link>
                                            <button
                                                onClick={handleLogout}
                                                className="block w-full text-left px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Выйти
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="pt-4 space-y-2">
                                        <Link
                                            href="/login"
                                            className="block px-3 py-2 text-center rounded-lg text-gray-600 hover:text-emerald-600 font-medium"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            Войти
                                        </Link>
                                        <Link
                                            href="/register"
                                            className="block px-3 py-2 text-center rounded-lg bg-gradient-to-r from-emerald-600 to-blue-600 text-white font-medium"
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
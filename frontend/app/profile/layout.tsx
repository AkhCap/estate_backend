"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FaUser, FaHeart, FaHistory, FaHome } from "react-icons/fa";

const navigation = [
  { name: "Профиль", href: "/profile", icon: FaUser },
  { name: "Мои объявления", href: "/profile/properties", icon: FaHome },
  { name: "Избранное", href: "/profile/favorites", icon: FaHeart },
  { name: "История просмотров", href: "/profile/history", icon: FaHistory },
];

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Мобильная навигация */}
          <div className="block lg:hidden mb-6">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-full flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm"
            >
              <span className="text-gray-900 font-medium">Меню</span>
              <svg
                className={`w-5 h-5 text-gray-500 transform transition-transform ${
                  isMobileMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-2 bg-white rounded-xl shadow-lg overflow-hidden"
              >
                <nav className="space-y-1 px-2 py-3">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-900 hover:bg-gray-50"
                        }`}
                      >
                        <Icon
                          className={`mr-3 h-5 w-5 ${
                            isActive ? "text-blue-600" : "text-gray-400"
                          }`}
                        />
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            )}
          </div>

          {/* Десктопная боковая навигация */}
          <div className="hidden lg:block lg:col-span-3">
            <nav className="space-y-2 sticky top-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-blue-50 text-blue-600 shadow-sm"
                        : "text-gray-900 hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? "text-blue-600" : "text-gray-400"
                      }`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Основной контент */}
          <main className="lg:col-span-9">
            <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[calc(100vh-8rem)]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 
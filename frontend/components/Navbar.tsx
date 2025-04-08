"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const handleProfileClick = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  };

  return (
    <nav className="bg-gradient-to-r from-white to-gray-50 shadow-md py-4 px-6 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Логотип или название */}
        <div className="text-2xl font-bold text-blue-600">
          <Link href="/">Estate</Link>
        </div>
        {/* Навигационное меню */}
        <ul className="flex space-x-6">
          <li>
            <Link href="/register" className="text-gray-700 hover:text-blue-600">
              Регистрация
            </Link>
          </li>
          <li>
            <Link href="/login" className="text-gray-700 hover:text-blue-600">
              Вход
            </Link>
          </li>
          <li>
            {isAuthenticated ? (
              <Link href="/profile" className="text-gray-700 hover:text-blue-600">
                Профиль
              </Link>
            ) : (
              <button onClick={handleProfileClick} className="text-gray-700 hover:text-blue-600">
                Профиль
              </button>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}
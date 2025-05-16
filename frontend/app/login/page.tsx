"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";
import { motion } from "framer-motion";
import { FaEnvelope, FaLock } from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const loginData = new URLSearchParams();
      loginData.append('username', formData.email);
      loginData.append('password', formData.password);

      const response = await axios.post("/users/login", loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Получаем данные пользователя
      const userResponse = await axios.get("/users/me", {
        headers: {
          'Authorization': `Bearer ${response.data.access_token}`
        }
      });

      // Сохраняем токен и данные пользователя
      login(userResponse.data, response.data.access_token);
      
      // Принудительно обновляем страницу для обновления контекста
      window.location.href = "/";
    } catch (err: any) {
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          setError(err.response.data.detail);
        } else if (Array.isArray(err.response.data.detail)) {
          setError(err.response.data.detail[0].msg);
        } else {
          setError("Неверный email или пароль");
        }
      } else {
        setError("Ошибка входа. Попробуйте позже");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-8 sm:px-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Вход в аккаунт</h2>
              <p className="text-gray-600">Добро пожаловать обратно!</p>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-500 p-4 rounded-lg mb-6"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  href="/reset-password"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Забыли пароль?
                </Link>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-lg shadow-lg disabled:opacity-50"
              >
                {loading ? "Вход..." : "Войти"}
              </motion.button>

              <p className="text-center text-gray-600 mt-4">
                Нет аккаунта?{" "}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Зарегистрироваться
                </Link>
              </p>
            </form>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-center text-sm text-gray-600">
              Войдите, чтобы получить доступ к тысячам объявлений о недвижимости
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
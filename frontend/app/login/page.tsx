"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";
import { motion } from "framer-motion";
import { useAuth, User } from "../context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Очищаем предыдущие ошибки
    
    try {
      const formDataToSend = new URLSearchParams();
      formDataToSend.append("username", formData.email);
      formDataToSend.append("password", formData.password);

      const response = await axios.post("/users/login", formDataToSend, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      
      if (response.data.access_token) {
        const token = response.data.access_token;
        
        try {
          // Получаем данные пользователя
          const userResponse = await axios.get("/users/me", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          // Сохраняем данные пользователя и токен
          const userData: User = {
            id: userResponse.data.id,
            email: userResponse.data.email,
            first_name: userResponse.data.first_name,
            last_name: userResponse.data.last_name,
            phone: userResponse.data.phone,
            avatar_url: userResponse.data.avatar_url
          };
          
          login(userData, token);
          router.push("/");
        } catch (userError) {
          console.error("Ошибка получения данных пользователя:", userError);
          setError("Ошибка получения данных пользователя. Пожалуйста, попробуйте снова.");
        }
      } else {
        setError("Не получен токен доступа");
      }
    } catch (err: any) {
      console.error("Ошибка входа:", err);
      if (err.response?.status === 401) {
        // Показываем конкретную ошибку от сервера
        const errorDetail = err.response.data.detail;
        if (errorDetail === "Пользователь с таким email не найден") {
          setError("Пользователь с таким email не найден. Пожалуйста, зарегистрируйтесь.");
          // Добавляем задержку перед перенаправлением
          setTimeout(() => {
            router.push("/register");
          }, 2000);
        } else if (errorDetail === "Неверный пароль") {
          setError("Неверный пароль");
        } else {
          setError("Неверные учетные данные");
        }
      } else {
        setError("Произошла ошибка при входе. Пожалуйста, попробуйте снова позже.");
      }
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Добро пожаловать</h2>
              <p className="text-gray-600">Войдите в свой аккаунт</p>
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
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="example@email.com"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Пароль</label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
                    Забыли пароль?
                  </Link>
                </div>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-lg shadow-lg"
              >
                Войти
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
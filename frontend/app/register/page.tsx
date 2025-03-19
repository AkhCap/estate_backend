"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaUserTie, FaChevronDown } from "react-icons/fa";
import Link from "next/link";

const roles = [
  { id: 'private', label: 'Частное лицо', icon: '👤' },
  { id: 'agent', label: 'Риелтор', icon: '🏢' },
  { id: 'developer', label: 'Застройщик', icon: '🏗️' }
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    role: "private"
  });
  const [error, setError] = useState("");
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("/users/register", formData);
      router.push("/login");
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || "Неизвестная ошибка";
      setError("Ошибка регистрации: " + errorMessage);
    }
  };

  const getCurrentRoleLabel = () => {
    return roles.find(role => role.id === formData.role)?.label || 'Выберите роль';
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Создайте аккаунт</h2>
              <p className="text-gray-600">Присоединяйтесь к нашему сообществу недвижимости</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя пользователя</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="username"
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsRoleOpen(!isRoleOpen)}
                    className="relative w-full pl-10 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white text-left flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <FaUserTie className="absolute left-3 h-5 w-5 text-gray-400" />
                      <span>{getCurrentRoleLabel()}</span>
                    </div>
                    <FaChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isRoleOpen ? 'transform rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isRoleOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                      >
                        {roles.map((role) => (
                          <motion.button
                            key={role.id}
                            type="button"
                            whileHover={{ backgroundColor: '#F3F4F6' }}
                            onClick={() => {
                              setFormData({ ...formData, role: role.id });
                              setIsRoleOpen(false);
                            }}
                            className="w-full px-4 py-2 text-left flex items-center space-x-2 hover:bg-gray-50"
                          >
                            <span className="text-xl">{role.icon}</span>
                            <span>{role.label}</span>
                          </motion.button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-lg shadow-lg"
              >
                Зарегистрироваться
              </motion.button>

              <p className="text-center text-gray-600 mt-4">
                Уже есть аккаунт?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Войти
                </Link>
              </p>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
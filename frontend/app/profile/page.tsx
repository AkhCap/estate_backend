"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";
import { FaUser, FaEnvelope, FaEdit, FaHistory, FaHeart, FaHome, FaPhone } from 'react-icons/fa';
import Image from 'next/image';
import DefaultAvatar from '../components/DefaultAvatar';

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  phone: string;
  avatar_url: string | null;
}

type Step = "profile" | "change-email";

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [step, setStep] = useState<Step>("profile");
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    first_name: "",
    phone: "",
    email: "",
    avatar_url: null
  });
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [countdown, setCountdown] = useState(0);

  const profileLinks = [
    { href: "/profile/history", label: "История просмотров", icon: FaHistory },
    { href: "/profile/favorites", label: "Избранное", icon: FaHeart },
    { href: "/profile/properties", label: "Мои объявления", icon: FaHome },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  // Функция для запуска таймера
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get("/users/me");
      setFormData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Ошибка при загрузке профиля";
      setError(errorMessage);
      console.error('Ошибка загрузки профиля:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value || "" }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      
      // Создаем URL для предпросмотра
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Сначала обновляем основные данные профиля
      const profileData = {
        first_name: formData.first_name,
        phone: formData.phone
      };

      await axios.put("/users/me", profileData);

      // Если есть новый аватар, отправляем его отдельным запросом
      if (avatar) {
        const avatarFormData = new FormData();
        avatarFormData.append('file', avatar);
        
        await axios.post("/users/me/avatar", avatarFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      await fetchProfile(); // Обновляем данные профиля после успешного сохранения
      setSuccess("Профиль успешно обновлен");
      setIsEditing(false);
      setAvatar(null);
      setAvatarPreview(null); // Очищаем предпросмотр
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Ошибка при обновлении профиля";
      setError(errorMessage);
      console.error('Ошибка обновления профиля:', err);
    }
  };

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post("/users/me/change-email/request", { new_email: newEmail });
      setSuccess("Код подтверждения отправлен на новый email");
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при отправке кода");
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await axios.post("/users/me/change-email/verify", {
        old_email: formData.email,
        new_email: newEmail,
        code: verificationCode
      });

      // Обновляем токен в localStorage
      localStorage.setItem("token", response.data.access_token);
      
      setSuccess("Email успешно изменен");
      setStep("profile");
      await fetchProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при подтверждении кода");
    }
  };

  // Очищаем URL предпросмотра при размонтировании компонента
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 top-16 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Профиль */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="bg-white rounded-3xl shadow-sm overflow-hidden"
        >
          {/* Верхняя часть с градиентом */}
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          
          {/* Основная информация */}
          <div className="relative px-6 pb-6">
            {/* Аватар */}
            <div className="absolute -top-12 left-6 flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-sm">
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  {avatarPreview ? (
                    <Image
                      src={avatarPreview}
                      alt="Profile Preview"
                      width={96}
                      height={96}
                      priority
                      className="object-cover w-full h-full"
                    />
                  ) : formData.avatar_url ? (
                    <Image
                      src={formData.avatar_url}
                      alt="Profile"
                      width={96}
                      height={96}
                      priority
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <DefaultAvatar
                      firstName={formData.first_name}
                      size={96}
                      className="rounded-full"
                    />
                  )}
                </div>
              </div>
              {isEditing && (
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                    <FaEdit className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Изменить</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Кнопка редактирования */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-4 right-6 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <FaEdit className="w-4 h-4" />
              <span>{isEditing ? 'Отмена' : 'Редактировать'}</span>
            </button>

            {/* Форма профиля */}
            <form onSubmit={handleSubmit} className="pt-16">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaPhone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ""}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-50"
                        placeholder="+992 XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaEnvelope className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={formData.email || ""}
                        disabled
                        className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50"
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => setStep("change-email")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Изменить почту
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-4 pt-4">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
                      >
                        Сохранить
                      </button>
                    </div>
                  )}
                </div>

                <div className="hidden md:flex items-center justify-center">
                  <Image
                    src="/illustrations/undraw_profile_d7qw.svg"
                    alt="Profile Illustration"
                    width={400}
                    height={400}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </form>
          </div>
        </motion.div>

        {/* Форма смены email */}
        <AnimatePresence>
          {step === "change-email" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8 bg-white rounded-3xl shadow-sm overflow-hidden"
            >
              <div className="px-6 py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Смена email</h2>
                <form onSubmit={handleRequestEmailChange} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Новый email
                    </label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setStep("profile")}
                      className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={countdown > 0}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                    >
                      {countdown > 0 ? `Повторить через ${countdown}с` : "Получить код"}
                    </button>
                  </div>
                </form>

                {success && success.includes("отправлен") && (
                  <form onSubmit={handleVerifyEmailChange} className="mt-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Код подтверждения
                      </label>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
                      >
                        Подтвердить
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Быстрые действия */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Управление недвижимостью</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {profileLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                whileHover={{ y: -5 }}
              >
                <Link
                  href={link.href}
                  className="block bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <link.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{link.label}</h3>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Сообщения об ошибках и успехе */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl"
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
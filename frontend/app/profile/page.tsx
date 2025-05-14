"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "../../lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, type User } from "@/app/context/AuthContext";
import { FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaEdit, FaHistory, FaHeart, FaHome } from 'react-icons/fa';
import Image from 'next/image';
import DefaultAvatar from '../components/DefaultAvatar';

interface UserProfile {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string | null;
  role: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    avatar_url: null
  });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const profileLinks = [
    { href: "/profile/history", label: "История просмотров", icon: FaHistory },
    { href: "/profile/favorites", label: "Избранное", icon: FaHeart },
    { href: "/profile/properties", label: "Мои объявления", icon: FaHome },
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const formatErrorMessage = (errorData: any): string => {
    if (typeof errorData === 'string') {
      return errorData;
    }
    
    if (errorData.detail) {
      return String(errorData.detail);
    }
    
    if (Array.isArray(errorData)) {
      return errorData
        .map((item: any) => {
          if (typeof item === 'object' && item.msg) {
            return String(item.msg);
          }
          return String(item);
        })
        .filter(Boolean)
        .join(', ');
    }
    
    if (typeof errorData === 'object') {
      const messages = Object.entries(errorData)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return value
              .map((item: any) => {
                if (typeof item === 'object' && item.msg) {
                  return String(item.msg);
                }
                return String(item);
              })
              .filter(Boolean)
              .join(', ');
          }
          if (typeof value === 'object' && value !== null) {
            const errorObj = value as { msg?: string };
            if (errorObj.msg) {
              return String(errorObj.msg);
            }
            return Object.values(value)
              .map(v => String(v))
              .filter(Boolean)
              .join(', ');
          }
          return String(value);
        })
        .filter(Boolean)
        .join(', ');
      return messages || "Произошла ошибка при обработке запроса";
    }
    
    return "Произошла ошибка при обработке запроса";
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get("/users/me");
      setFormData(response.data);
    } catch (err: any) {
      const errorMessage = err.response?.data 
        ? formatErrorMessage(err.response.data)
        : "Ошибка при загрузке профиля";
      
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
      setAvatar(e.target.files[0]);
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
        last_name: formData.last_name,
        email: formData.email,
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
    } catch (err: any) {
      const errorMessage = err.response?.data 
        ? formatErrorMessage(err.response.data)
        : "Ошибка при обновлении профиля";
      
      setError(errorMessage);
      console.error('Ошибка обновления профиля:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Профиль */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Верхняя часть с фоном */}
          <div className="h-32 bg-gradient-to-r from-emerald-600 to-blue-600"></div>
          
          {/* Основная информация */}
          <div className="relative px-6 pb-6">
            {/* Аватар */}
            <div className="absolute -top-12 left-6">
              <div className="w-24 h-24 rounded-full bg-white p-1">
                <div className="relative w-full h-full rounded-full overflow-hidden">
                  {formData.avatar_url ? (
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
                      lastName={formData.last_name}
                      size={96}
                      className="rounded-full"
                    />
                  )}
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer transition-opacity hover:bg-black/70">
                      <span className="text-white text-sm">Изменить</span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Кнопка редактирования */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="absolute top-4 right-6 px-4 py-2 rounded-full bg-white/90 backdrop-blur-md text-gray-700 hover:text-emerald-600 font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <FaEdit className="w-4 h-4" />
              <span>{isEditing ? 'Отмена' : 'Редактировать'}</span>
            </button>

            {/* Форма профиля */}
            <form onSubmit={handleSubmit} className="pt-16 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone || ""}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200"
                  >
                    Сохранить
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Статистика и быстрые действия */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Управление недвижимостью</h2>
          <div className="grid grid-cols-1 gap-4">
            <Link
              href="/profile/properties"
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <FaHome className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Мои объявления</h3>
                    <p className="text-sm text-gray-500">Управляйте своими объявлениями о недвижимости</p>
                  </div>
                </div>
                <div className="text-emerald-600">→</div>
              </div>
            </Link>

            <Link
              href="/profile/favorites"
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <FaHeart className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Избранное</h3>
                    <p className="text-sm text-gray-500">Сохраненные объявления и интересные предложения</p>
                  </div>
                </div>
                <div className="text-emerald-600">→</div>
              </div>
            </Link>

            <Link
              href="/profile/history"
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                    <FaHistory className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">История просмотров</h3>
                    <p className="text-sm text-gray-500">Недавно просмотренные объявления</p>
                  </div>
                </div>
                <div className="text-emerald-600">→</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Сообщения об ошибках и успехе */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl">
            {success}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "../../lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      setProfile(response.data);
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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      const updateData: any = {};
      
      // Отправляем только измененные поля
      const allowedFields = ['email', 'first_name', 'last_name', 'phone'];
      allowedFields.forEach(field => {
        if (
          formData[field] !== undefined && 
          formData[field] !== null && 
          profile && 
          formData[field] !== profile[field]
        ) {
          updateData[field] = formData[field];
        }
      });

      // Отправляем данные в формате JSON
      await axios.put("/users/me", updateData);

      // Если есть аватар, отправляем его отдельно
      if (avatar) {
        const avatarFormData = new FormData();
        avatarFormData.append("file", avatar);
        await axios.post("/users/me/avatar", avatarFormData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setSuccess("Профиль успешно обновлен");
      setIsEditing(false);
      fetchProfile();
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
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Мой профиль</h1>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
        >
          {isEditing ? "Отменить" : "Редактировать"}
        </motion.button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-xl">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Аватар */}
        <div className="flex items-center space-x-6">
          <div className="relative">
            <img
              src={
                avatar
                  ? URL.createObjectURL(avatar)
                  : profile?.avatar_url
                  ? profile.avatar_url.startsWith('http')
                    ? profile.avatar_url
                    : `${process.env.NEXT_PUBLIC_API_URL}${profile.avatar_url}`
                  : "/default-avatar.jpg"
              }
              alt={profile?.username}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-50"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/default-avatar.jpg";
              }}
            />
            {isEditing && (
              <label
                htmlFor="avatar"
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-gray-600">{profile?.email}</p>
          </div>
        </div>

        {/* Поля формы */}
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
        </div>

        {/* Кнопки */}
        {isEditing && (
          <div className="flex justify-end space-x-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setIsEditing(false);
                setFormData(profile || {});
                setAvatar(null);
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              Отмена
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Сохранить
            </motion.button>
          </div>
        )}
      </form>
    </div>
  );
}
import axios from "axios";
import { useAuth } from '../app/context/AuthContext';

// Получаем URL чат-сервиса из переменных окружения или используем дефолтный
const CHAT_API_BASE_URL = process.env.NEXT_PUBLIC_CHAT_API_URL || "http://localhost:8001/chat-api";

// Создаем экземпляр axios для чат-сервиса
export const chatAxiosInstance = axios.create({
  baseURL: CHAT_API_BASE_URL,
});

// Добавляем токен в каждый запрос
chatAxiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Обрабатываем ошибки
chatAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event('authStateChanged'));
    }
    return Promise.reject(error);
  }
);

export default chatAxiosInstance; 
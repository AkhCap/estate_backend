// lib/axios.ts
import axios from "axios";

// Создаем экземпляр axios с базовым URL, который указывает на адрес вашего backend.
// Если backend запущен локально на порту 5000, используйте "http://localhost:5000".
const instance = axios.create({
  baseURL: "http://127.0.0.1:8000", // Укажите здесь адрес вашего backend
  headers: {
    "Content-Type": "application/json",
  },
  // Вы можете добавить и другие настройки, например, таймаут:
  timeout: 10000, // 10 секунд
});

// Можно добавить перехватчики (interceptors) для обработки запросов/ответов:
// Перехватчик запроса
instance.interceptors.request.use(
  (config) => {
    // Пример: добавляем токен авторизации, если он есть в localStorage
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

// Перехватчик ответа
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Здесь можно обработать ошибки, например, перенаправить пользователя на страницу логина
    return Promise.reject(error);
  }
);

export default instance;
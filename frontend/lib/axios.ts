// lib/axios.ts
// frontend/lib/axios.ts
import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


instance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// Перехватчик ответа: возвращаем ответ или ошибку
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Можно добавить обработку ошибок, например, перенаправление на страницу логина
    return Promise.reject(error);
  }
);

export default instance;
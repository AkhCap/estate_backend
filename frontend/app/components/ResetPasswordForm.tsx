"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaEnvelope, FaLock, FaCheck, FaEye, FaEyeSlash } from "react-icons/fa";
import Link from "next/link";

type Step = "email" | "code" | "password";

interface FormState {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [formData, setFormData] = useState<FormState>({
    email: "",
    code: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Загрузка сохраненного состояния
  useEffect(() => {
    const savedState = localStorage.getItem("resetPasswordFormState");
    if (savedState) {
      const { step: savedStep, formData: savedFormData } = JSON.parse(savedState);
      setStep(savedStep);
      setFormData(savedFormData);
    }
  }, []);

  // Сохранение состояния
  useEffect(() => {
    localStorage.setItem("resetPasswordFormState", JSON.stringify({ step, formData }));
  }, [step, formData]);

  // Очистка состояния при успешном сбросе пароля
  const clearFormState = () => {
    localStorage.removeItem("resetPasswordFormState");
  };

  // Валидация email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Проверка сложности пароля
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

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

  // Отправка кода на email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(formData.email)) {
      setError("Пожалуйста, введите корректный email");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/users/reset-password/request", { 
        email: formData.email
      });
      setStep("code");
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при отправке кода");
    } finally {
      setLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendCode = async () => {
    if (countdown > 0) return;
    setError("");
    setLoading(true);

    try {
      await axios.post("/users/reset-password/request", { 
        email: formData.email
      });
      startCountdown();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при отправке кода");
    } finally {
      setLoading(false);
    }
  };

  // Проверка кода
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await axios.post("/users/reset-password/verify", { 
        email: formData.email, 
        code: formData.code 
      });
      setStep("password");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при проверке кода");
    } finally {
      setLoading(false);
    }
  };

  // Установка нового пароля
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    if (passwordStrength < 3) {
      setError("Пароль слишком простой. Используйте буквы разного регистра, цифры и специальные символы");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/users/reset-password/set", { 
        email: formData.email, 
        code: formData.code,
        new_password: formData.password 
      });
      clearFormState();
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при установке пароля");
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения пароля
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setFormData({ ...formData, password: newPassword });
    setPasswordStrength(checkPasswordStrength(newPassword));
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Восстановление пароля</h2>
              <p className="text-gray-600">Введите email для получения кода подтверждения</p>
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

            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.form
                  key="email"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSendCode}
                  className="space-y-6"
                >
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

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-lg shadow-lg disabled:opacity-50"
                  >
                    {loading ? "Отправка..." : "Получить код"}
                  </motion.button>
                </motion.form>
              )}

              {step === "code" && (
                <motion.form
                  key="code"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleVerifyCode}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Код подтверждения</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaCheck className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Введите код из письма"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
                    >
                      {loading ? "Проверка..." : "Подтвердить"}
                    </motion.button>

                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={countdown > 0 || loading}
                      className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                    >
                      {countdown > 0 ? `Повторить через ${countdown}с` : "Отправить код повторно"}
                    </button>
                  </div>
                </motion.form>
              )}

              {step === "password" && (
                <motion.form
                  key="password"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleSetPassword}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={handlePasswordChange}
                        className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <FaEyeSlash className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FaEye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="mt-2">
                      <div className="flex space-x-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1 w-full rounded-full ${
                              i < passwordStrength
                                ? i < 2
                                  ? "bg-red-500"
                                  : i < 4
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {passwordStrength < 2
                          ? "Слабый пароль"
                          : passwordStrength < 4
                          ? "Средний пароль"
                          : "Сильный пароль"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaLock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="pl-10 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash className="h-5 w-5 text-gray-400" />
                        ) : (
                          <FaEye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium text-lg shadow-lg disabled:opacity-50"
                  >
                    {loading ? "Сохранение..." : "Сохранить новый пароль"}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>

            <p className="text-center text-gray-600 mt-4">
              Вспомнили пароль?{" "}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Войти
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 
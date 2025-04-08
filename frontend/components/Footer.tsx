// frontend/app/components/Footer.tsx
"use client";
import Link from 'next/link';
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
} from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Лого и краткое описание (можно добавить лого) */}
          <div className="col-span-2 lg:col-span-1 mb-6 md:mb-0">
            <Link href="/" className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
              EstateApp
            </Link>
            <p className="mt-4 text-sm text-gray-500">
              Ваш надежный партнер в поиске недвижимости.
            </p>
          </div>

          {/* Ссылки: Навигация */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Навигация
            </h3>
            <ul className="space-y-3">
              <li><Link href="/" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Главная</Link></li>
              <li><Link href="/properties" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Объявления</Link></li>
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">О нас</Link></li> 
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Контакты</Link></li>
            </ul>
          </div>

          {/* Ссылки: Сервисы */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Сервисы
            </h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Добавить объявление</Link></li>
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Ипотечный калькулятор</Link></li>
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Оценка недвижимости</Link></li>
            </ul>
          </div>

          {/* Ссылки: Поддержка */}
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Поддержка
            </h3>
            <ul className="space-y-3">
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">FAQ</Link></li>
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Служба поддержки</Link></li>
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Политика конфиденциальности</Link></li>
              <li><Link href="#" className="text-base text-gray-600 hover:text-blue-600 transition-colors">Условия использования</Link></li>
            </ul>
          </div>

          {/* Ссылки: Юридическая информация (Опционально) */}
          <div className='hidden lg:block'> {/* Показываем только на больших экранах */}
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-3">
                {/* Добавить ссылки, если нужно */}
            </ul>
          </div>
        </div>

        {/* Нижняя часть: Копирайт и соцсети */}
        <div className="mt-10 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500 order-2 md:order-1 mt-4 md:mt-0">
            &copy; {currentYear} EstateApp. Все права защищены.
          </p>
          <div className="flex space-x-5 order-1 md:order-2">
            <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <span className="sr-only">Facebook</span>
              <FaFacebookF className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <span className="sr-only">Twitter</span>
              <FaTwitter className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <span className="sr-only">Instagram</span>
              <FaInstagram className="h-5 w-5" />
            </Link>
            <Link href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
              <span className="sr-only">LinkedIn</span>
              <FaLinkedinIn className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
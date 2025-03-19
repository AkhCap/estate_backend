"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch, FaHome, FaBuilding, FaHotel, FaBed, FaRulerCombined, FaMoneyBillWave } from "react-icons/fa";
import { formatPrice } from "../lib/utils";

interface Property {
  id: number;
  title: string;
  price: number;
  rooms: string;
  area: number;
  deal_type: "sale" | "rent" | "daily";
  images: string[];
}

export default function HomePage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [rooms, setRooms] = useState("");
  const [area, setArea] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/properties/');
        if (!response.ok) {
          throw new Error('Ошибка при загрузке данных');
        }
        const data = await response.json();
        setProperties(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Фильтрация объявлений по параметрам
  const filteredListings = properties.filter((property) => {
    return (
      (selectedCategory === "all" || property.deal_type === selectedCategory) &&
      (!priceMin || property.price >= parseInt(priceMin)) &&
      (!priceMax || property.price <= parseInt(priceMax)) &&
      (!rooms || property.rooms === rooms) &&
      (!area || property.area >= parseInt(area)) &&
      (!search || property.title.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const getDealTypeLabel = (type: string) => {
    switch (type) {
      case "sale":
        return "Продажа";
      case "rent":
        return "Аренда";
      case "daily":
        return "Посуточно";
      default:
        return type;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative h-[600px]">
        {/* Фоновое изображение */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/dushanbe-night.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-white">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl font-bold text-center mb-8"
          >
            Найдите идеальное жилье
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-center mb-12 max-w-2xl"
          >
            Тысячи объявлений недвижимости в одном месте. Купить, снять или сдать - все просто!
          </motion.p>
          
          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-3xl bg-white rounded-lg shadow-xl p-4 flex items-center"
          >
            <FaSearch className="text-gray-400 text-xl mr-4" />
            <input
              type="text"
              placeholder="Введите город, район, улицу или ЖК..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 text-gray-800 text-lg focus:outline-none"
            />
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Поиск
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Категории недвижимости</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer hover:shadow-xl transition-shadow"
            >
              <FaHome className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Квартиры</h3>
              <p className="text-gray-600">Купить или снять квартиру</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer hover:shadow-xl transition-shadow"
            >
              <FaBuilding className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Дома</h3>
              <p className="text-gray-600">Частные дома и коттеджи</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-xl shadow-lg p-6 text-center cursor-pointer hover:shadow-xl transition-shadow"
            >
              <FaHotel className="text-4xl text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Посуточно</h3>
              <p className="text-gray-600">Апартаменты на короткий срок</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Расширенный поиск</h2>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="text-blue-600 hover:text-blue-700 flex items-center"
            >
              {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
            </button>
          </div>

          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Цена (от)</label>
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="₽"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Цена (до)</label>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="₽"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Комнат</label>
                  <select
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Любое</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Площадь (м²)</label>
                  <input
                    type="number"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="м²"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Listings Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold">Популярные объявления</h2>
            <Link href="/properties">
              <button className="text-blue-600 hover:text-blue-700 font-medium">
                Смотреть все →
              </button>
            </Link>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Загрузка объявлений...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">
              <p>{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredListings.map((property, index) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-48">
                    <img
                      src={property.images[0] || "/fallback.jpg"}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                      {getDealTypeLabel(property.deal_type)}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
                    
                    <div className="flex items-center gap-4 text-gray-600 mb-4">
                      <div className="flex items-center">
                        <FaBed className="mr-2" />
                        <span>{property.rooms} комн.</span>
                      </div>
                      <div className="flex items-center">
                        <FaRulerCombined className="mr-2" />
                        <span>{property.area} м²</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center text-blue-600 font-semibold mb-4">
                      <FaMoneyBillWave className="mr-2" />
                      <span>{formatPrice(property.price)} ₽</span>
                    </div>
                    
                    <Link href={`/listings/${property.id}`}>
                      <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Подробнее
                      </button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Готовы найти свой идеальный дом?</h2>
          <p className="text-xl mb-8">Присоединяйтесь к тысячам довольных клиентов</p>
          <div className="flex justify-center gap-4">
            <Link href="/create-property">
              <button className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                Создать объявление
              </button>
            </Link>
            <Link href="/properties">
              <button className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-600 transition-colors">
                Смотреть все объявления
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
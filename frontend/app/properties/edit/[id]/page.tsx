"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../../lib/axios";
import { motion } from "framer-motion";
import { FaArrowLeft, FaBed, FaRulerCombined, FaMoneyBillWave, FaMapMarkerAlt, FaHome, FaList, FaUser, FaChevronDown } from "react-icons/fa";

const BASE_URL = "http://localhost:8000";

const RENT_RESIDENTIAL_LONG = [
  "Квартира",
  "Комната",
  "Хавли/Дом",
  "Койко-место",
  "Дача",
  "Гараж",
  "Котедж",
];

const SALE_LIVING = [
  "Квартира",
  "Квартира в новостройке",
  "Комната",
  "Хавли/Дом",
  "Дача",
  "Гараж",
  "Коттедж",
];

const SALE_COMMERCIAL = [
  "Офис",
  "Здание",
  "Склад",
  "Торговая площадь",
  "Производство",
  "Помещение свободного назначения",
  "Бизнес",
];

interface PropertyFormData {
  deal_type: "Аренда" | "Продажа";
  rent_duration?: "Долгосрочная" | "Посуточная";
  main_category?: "Жилая" | "Коммерческая" | "";
  sub_category?: string;
  address: string;
  apartmentNumber: string;
  rooms: string;
  area: number;
  ceilingHeight: number;
  floor: number;
  totalFloors: number;
  photos: File[];
  propertyCondition: "Вторичка" | "Новостройка" | "";
  hasBalcony: boolean;
  windowView: string[];
  bathroom: "Разделенный" | "Совмещенный" | "";
  bathType: "Ванна" | "Душевая кабина" | "";
  heating: "Да" | "Нет" | "";
  renovation: "Без ремонта" | "Коробка" | "Косметический" | "Дизайнерская" | "Евро" | "";
  liftsPassenger: number;
  liftsFreight: number;
  parking: string[];
  furniture: string[];
  appliances: string[];
  connectivity: string[];
  description: string;
  title: string;
  price: number;
  prepayment: string;
  deposit: number;
  livingConditions: string[];
  whoRents: "Собственник" | "Риелтор" | "";
  landlordContact: string;
  contactMethod: string[];
  buildYear: number;
}

// Общий компонент для стилизованного Select
const StyledSelect = ({ label, name, value, onChange, options, required = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2.5 text-left bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value || "Выберите значение"}
          </span>
          <FaChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? "rotate-180" : ""} text-gray-400`} />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                    value === option.value ? "bg-blue-50 text-blue-600" : "text-gray-900"
                  }`}
                  onClick={() => {
                    onChange({ target: { name, value: option.value } });
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [initialData, setInitialData] = useState(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    deal_type: "Аренда",
    rent_duration: "Долгосрочная",
    main_category: "",
    sub_category: "",
    address: "",
    apartmentNumber: "",
    rooms: "",
    area: 0,
    ceilingHeight: 0,
    floor: 0,
    totalFloors: 0,
    photos: [],
    propertyCondition: "",
    hasBalcony: false,
    windowView: [],
    bathroom: "",
    bathType: "",
    heating: "",
    renovation: "",
    liftsPassenger: 0,
    liftsFreight: 0,
    parking: [],
    furniture: [],
    appliances: [],
    connectivity: [],
    description: "",
    title: "",
    price: 0,
    prepayment: "",
    deposit: 0,
    livingConditions: [],
    whoRents: "",
    landlordContact: "",
    contactMethod: [],
    buildYear: 0
  });

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await axios.get(`/properties/${propertyId}`);
        const data = {
          ...response.data,
          deal_type: response.data.deal_type === "rent" ? "Аренда" : "Продажа"
        };
        setInitialData(data);
        setFormData(data);
      } catch (err: any) {
        setError(err.response?.data?.detail || "Ошибка при загрузке объявления");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        deal_type: formData.deal_type === "Аренда" ? "rent" : "sale",
      };
      await axios.put(`/properties/${propertyId}`, payload);
      router.push("/profile/properties");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Ошибка при обновлении объявления");
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (name: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleArrayChange = (name: string, value: string[]) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-xl">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <button
          onClick={() => router.back()}
          className="group flex items-center text-gray-500 hover:text-gray-900 mb-8 transition-all"
        >
          <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Вернуться назад</span>
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Редактирование объявления
        </h1>
        <p className="text-gray-500 mb-8">Заполните все необходимые поля для обновления вашего объявления</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Основная информация */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
                <FaHome className="text-blue-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Основная информация</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StyledSelect
                  label="Тип сделки"
                  name="deal_type"
                  value={formData.deal_type}
                  onChange={handleChange}
                  options={[
                    { value: "Аренда", label: "Аренда" },
                    { value: "Продажа", label: "Продажа" }
                  ]}
                  required
                />
                {formData.deal_type === "Аренда" && (
                  <StyledSelect
                    label="Тип аренды"
                    name="rent_duration"
                    value={formData.rent_duration}
                    onChange={handleChange}
                    options={[
                      { value: "Долгосрочная", label: "Долгосрочная" },
                      { value: "Посуточная", label: "Посуточная" }
                    ]}
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StyledSelect
                  label="Категория"
                  name="main_category"
                  value={formData.main_category}
                  onChange={handleChange}
                  options={[
                    { value: "Жилая", label: "Жилая" },
                    { value: "Коммерческая", label: "Коммерческая" }
                  ]}
                  required
                />
                <StyledSelect
                  label="Тип недвижимости"
                  name="sub_category"
                  value={formData.sub_category}
                  onChange={handleChange}
                  options={
                    formData.deal_type === "Аренда"
                      ? RENT_RESIDENTIAL_LONG.map(type => ({ value: type, label: type }))
                      : formData.main_category === "Жилая"
                      ? SALE_LIVING.map(type => ({ value: type, label: type }))
                      : SALE_COMMERCIAL.map(type => ({ value: type, label: type }))
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Заголовок объявления
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  required
                />
              </div>
            </div>
          </section>

          {/* Расположение и параметры */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mr-3">
                <FaMapMarkerAlt className="text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Расположение и параметры</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Номер квартиры
                  </label>
                  <input
                    type="text"
                    name="apartmentNumber"
                    value={formData.apartmentNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Год постройки
                  </label>
                  <input
                    type="number"
                    name="buildYear"
                    value={formData.buildYear}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Количество комнат
                  </label>
                  <input
                    type="number"
                    name="rooms"
                    value={formData.rooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Площадь (м²)
                  </label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Высота потолков (м)
                  </label>
                  <input
                    type="number"
                    name="ceilingHeight"
                    value={formData.ceilingHeight}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Этаж
                  </label>
                  <input
                    type="number"
                    name="floor"
                    value={formData.floor}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Этажей в доме
                  </label>
                  <input
                    type="number"
                    name="totalFloors"
                    value={formData.totalFloors}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Характеристики */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mr-3">
                <FaList className="text-purple-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Характеристики</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <StyledSelect
                  label="Состояние"
                  name="propertyCondition"
                  value={formData.propertyCondition}
                  onChange={handleChange}
                  options={[
                    { value: "Вторичка", label: "Вторичка" },
                    { value: "Новостройка", label: "Новостройка" }
                  ]}
                />
                <StyledSelect
                  label="Ремонт"
                  name="renovation"
                  value={formData.renovation}
                  onChange={handleChange}
                  options={[
                    { value: "Без ремонта", label: "Без ремонта" },
                    { value: "Коробка", label: "Коробка" },
                    { value: "Косметический", label: "Косметический" },
                    { value: "Дизайнерская", label: "Дизайнерская" },
                    { value: "Евро", label: "Евро" }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StyledSelect
                  label="Санузел"
                  name="bathroom"
                  value={formData.bathroom}
                  onChange={handleChange}
                  options={[
                    { value: "Разделенный", label: "Разделенный" },
                    { value: "Совмещенный", label: "Совмещенный" }
                  ]}
                />
                <StyledSelect
                  label="Тип санузла"
                  name="bathType"
                  value={formData.bathType}
                  onChange={handleChange}
                  options={[
                    { value: "Ванна", label: "Ванна" },
                    { value: "Душевая кабина", label: "Душевая кабина" }
                  ]}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <StyledSelect
                  label="Отопление"
                  name="heating"
                  value={formData.heating}
                  onChange={handleChange}
                  options={[
                    { value: "Да", label: "Да" },
                    { value: "Нет", label: "Нет" }
                  ]}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Балкон/Лоджия
                  </label>
                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      name="hasBalcony"
                      checked={formData.hasBalcony}
                      onChange={(e) => handleCheckboxChange("hasBalcony", e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Есть балкон/лоджия</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Цена и условия */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center mr-3">
                <FaMoneyBillWave className="text-yellow-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Цена и условия</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Цена
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
                {formData.deal_type === "Аренда" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Депозит
                    </label>
                    <input
                      type="number"
                      name="deposit"
                      value={formData.deposit}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                    />
                  </div>
                )}
              </div>

              {formData.deal_type === "Аренда" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Предоплата
                  </label>
                  <input
                    type="text"
                    name="prepayment"
                    value={formData.prepayment}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  />
                </div>
              )}
            </div>
          </section>

          {/* Контактная информация */}
          <section className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mr-3">
                <FaUser className="text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Контактная информация</h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Кто сдает/продает
                  </label>
                  <select
                    name="whoRents"
                    value={formData.whoRents}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                  >
                    <option value="">Выберите</option>
                    <option value="Собственник">Собственник</option>
                    <option value="Риелтор">Риелтор</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Контактный телефон
                  </label>
                  <input
                    type="text"
                    name="landlordContact"
                    value={formData.landlordContact}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-100 py-4 px-8 mt-8">
            <div className="max-w-5xl mx-auto flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-white text-gray-700 rounded-xl font-medium border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
              >
                Сохранить изменения
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 
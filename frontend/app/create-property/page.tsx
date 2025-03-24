// Файл: app/create-property/page.tsx
"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaChevronDown, FaChevronUp, FaExclamationCircle, FaHome, FaBuilding, FaMapMarkerAlt, FaRulerCombined, FaImages, FaPaintRoller, FaEdit, FaMoneyBillWave, FaPhone, FaClock, FaPlus } from "react-icons/fa";
import { PropertyFormData, CreatePropertyPageProps } from "./types";
import Image from "next/image";
import { XMarkIcon } from "@heroicons/react/24/outline";
import PhotoUpload from "../../components/PhotoUpload";
import { IconType } from "react-icons";

const baseButtonClass =
  "px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium text-sm";

const activeButtonClass =
  "px-4 py-2.5 rounded-lg border-2 border-gray-900 bg-gray-900 text-white transition-all duration-200 font-medium text-sm";

const inputClass = 
  "w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all duration-200 outline-none text-sm";

const labelClass = "block text-gray-600 font-medium text-sm mb-2";

const sectionClass = "bg-white rounded-xl p-6 border border-gray-100";

const subheadingClass = "text-xl font-semibold mb-6 text-gray-800";

const buttonGroupClass = "grid grid-cols-2 gap-4";

const stepContainerClass = "min-h-screen bg-gray-50 py-12";

const formContainerClass = "max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-8";

const titleClass = "text-2xl font-semibold mb-8 text-center text-gray-900";

const errorClass = "bg-red-50 border-l-4 border-red-400 p-4 mb-6 rounded-r-lg text-sm text-red-700";

// Примеры массивов для выбора
const RENT_SHORT = ["Квартира", "Комната", "Хавли/Дом", "Спальное место"];
const RENT_COMMERCIAL_LONG = [
  "Офис",
  "Склад",
  "Торговая площадь",
  "Производство",
  "Помещение свободного назначения",
  "Коворкинг",
  "Здание",
];
const RENT_RESIDENTIAL_LONG = [
  "Квартира",
  "Комната",
  "Койко-место",
  "Хавли/Дом",
  "Гараж",
  "Парковочное место",
  "Дача"
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

const initialPropertyFormData: PropertyFormData = {
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
  prepayment: "нет",
  deposit: 0,
  livingConditions: [],
  whoRents: "",
  landlordContact: "",
  contactMethod: [],
  buildYear: 0,
  owner_id: undefined
};

interface DecodedToken {
  sub: string;
  exp: number;
}

interface StepStatus {
  isCompleted: boolean;
  isActive: boolean;
  error?: string;
}

interface Step {
  id: string;
  number: number;
  title: string;
  icon: IconType;
  condition?: (data: PropertyFormData) => boolean;
}

const steps: Step[] = [
  {
    id: "deal_type",
    number: 1,
    title: "Тип сделки",
    icon: FaHome
  },
  {
    id: "category",
    number: 2,
    title: "Категория",
    icon: FaBuilding
  },
  {
    id: "rent_duration",
    number: 3,
    title: "Срок аренды",
    icon: FaClock,
    condition: (data) => data.deal_type === "Аренда"
  },
  {
    id: "sub_category",
    number: 4,
    title: "Подкатегория",
    icon: FaBuilding
  },
  {
    id: "address",
    number: 5,
    title: "Адрес",
    icon: FaMapMarkerAlt
  },
  {
    id: "rooms",
    number: 6,
    title: "Характеристики",
    icon: FaRulerCombined
  },
  {
    id: "photos",
    number: 7,
    title: "Фотографии",
    icon: FaImages
  },
  {
    id: "property_condition",
    number: 8,
    title: "Состояние",
    icon: FaPaintRoller
  },
  {
    id: "additional",
    number: 9,
    title: "Дополнительно",
    icon: FaPlus
  },
  {
    id: "description",
    number: 10,
    title: "Описание",
    icon: FaEdit
  },
  {
    id: "price_and_contacts",
    number: 11,
    title: "Цена и контакты",
    icon: FaPhone
  }
];

const generateTitle = (data: PropertyFormData): string => {
  let title = '';
  
  // Добавляем тип сделки
  if (data.deal_type === "Аренда") {
    title = "Сдается ";
  } else {
    title = "Продается ";
  }

  // Добавляем количество комнат и тип жилья
  if (data.sub_category === "Квартира") {
    if (data.rooms === "Студия") {
      title += "квартира-студия";
    } else if (data.rooms === "Свободная планировка") {
      title += "квартира свободной планировки";
    } else {
      title += `${data.rooms}-комн. квартира`;
    }
  } else if (data.sub_category === "Комната") {
    title += "комната";
  } else if (data.sub_category === "Койко-место") {
    title += "койко-место";
  } else if (data.sub_category === "Хавли/Дом") {
    title += "дом";
  } else if (data.sub_category === "Гараж") {
    title += "гараж";
  } else if (data.sub_category === "Парковочное место") {
    title += "парковочное место";
  } else if (data.sub_category === "Дача") {
    title += "дача";
  }

  // Добавляем площадь, если она указана
  if (data.area) {
    title += `, ${data.area} м²`;
  }

  return title;
};

export default function CreatePropertyPage({ initialData, isEditing, propertyId }: CreatePropertyPageProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<PropertyFormData>(initialData || initialPropertyFormData);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({
    1: { isCompleted: false, isActive: true },
    2: { isCompleted: false, isActive: false },
    3: { isCompleted: false, isActive: false },
    4: { isCompleted: false, isActive: false },
    5: { isCompleted: false, isActive: false },
    6: { isCompleted: false, isActive: false },
    7: { isCompleted: false, isActive: false },
    8: { isCompleted: false, isActive: false },
    9: { isCompleted: false, isActive: false },
    10: { isCompleted: false, isActive: false },
    11: { isCompleted: false, isActive: false }
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      // Получаем пользователя по email из токена
      axios.get(`/users/me`).then(response => {
        setFormData(prev => ({ ...prev, owner_id: response.data.id }));
      }).catch(error => {
        console.error("Ошибка при получении данных пользователя:", error);
        router.push("/login");
      });
    } catch (error) {
      console.error("Ошибка при декодировании токена:", error);
      router.push("/login");
    }
  }, [router]);

  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!formData.deal_type;
      case 2:
        return !!formData.main_category;
      case 3:
        // Пропускаем валидацию для продажи и коммерческой недвижимости
        if (formData.deal_type === "Продажа" || formData.main_category === "Коммерческая") {
          return true;
        }
        return !!formData.rent_duration;
      case 4:
        return !!formData.sub_category;
      case 5:
        return !!formData.address && !!formData.apartmentNumber;
      case 6:
        return !!formData.rooms && 
               !!formData.area && formData.area > 0 && 
               (formData.floor === "Цокольный" || (typeof formData.floor === "number" && formData.floor >= 0)) && 
               !!formData.totalFloors && formData.totalFloors > 0;
      case 7:
        return (formData.photos.length > 0) || (formData.existingPhotos !== undefined && formData.existingPhotos.length > 0);
      case 8:
        return !!formData.propertyCondition && !!formData.renovation;
      case 9:
        return !!formData.buildYear && 
               (formData.liftsPassenger !== undefined || formData.liftsFreight !== undefined) &&
               !!formData.heating &&
               formData.hasBalcony !== undefined &&
               !!formData.bathroom;
      case 10:
        return !!formData.description && formData.description.length >= 20;
      case 11:
        return !!formData.price && 
               !!formData.landlordContact && 
               formData.contactMethod.length > 0 &&
               (formData.deal_type === "Продажа" || !!formData.prepayment);
      default:
        return false;
    }
  };

  const updateStepStatus = (step: string | number, isCompleted?: boolean) => {
    const stepNumber = typeof step === 'string' ? steps.findIndex(s => s.id === step) : step;
    setStepStatuses(prev => {
      const newStatuses = { ...prev };
      newStatuses[stepNumber] = {
        ...newStatuses[stepNumber],
        isCompleted: isCompleted === undefined ? validateStep(stepNumber) : isCompleted,
        isActive: true
      };
      return newStatuses;
    });
  };

  const handleStepClick = (stepNumber: number) => {
    setStepStatuses(prev => {
      const newStatuses = { ...prev };
      
      // Активируем выбранный шаг
      newStatuses[stepNumber] = {
        ...newStatuses[stepNumber],
        isActive: true
      };

      // Проверяем все предыдущие шаги
      for (let i = 1; i <= stepNumber; i++) {
        const isStepCompleted = validateStep(i);
        newStatuses[i] = {
          ...newStatuses[i],
          isCompleted: isStepCompleted,
          isActive: true
        };
      }

      // Если все предыдущие шаги заполнены, активируем следующий
      if (stepNumber < 11 && validateStep(stepNumber)) {
        newStatuses[stepNumber + 1] = {
          ...newStatuses[stepNumber + 1],
          isActive: true
        };
      }

      return newStatuses;
    });
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      let nextStep = currentStep + 1;
      
      // Пропускаем шаг длительности аренды если это продажа или коммерческая недвижимость
      if (nextStep === 3 && (
        formData.deal_type === "Продажа" || 
        formData.main_category === "Коммерческая"
      )) {
        nextStep = 4;
      }
      
      setStepStatuses(prev => ({
        ...prev,
        [currentStep]: { ...prev[currentStep], isCompleted: true },
        [nextStep]: { ...prev[nextStep], isActive: true }
      }));
      setCurrentStep(nextStep);
      setError("");
    } else {
      setError("Пожалуйста, заполните все обязательные поля на этом шаге");
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      // Возвращаемся на предыдущую страницу
      router.back();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className={buttonGroupClass}>
              <button
                type="button"
                onClick={() => handleDealSelect("Аренда")}
                className={formData.deal_type === "Аренда" ? activeButtonClass : baseButtonClass}
              >
                Аренда
              </button>
              <button
                type="button"
                onClick={() => handleDealSelect("Продажа")}
                className={formData.deal_type === "Продажа" ? activeButtonClass : baseButtonClass}
              >
                Продажа
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className={buttonGroupClass}>
              <button
                type="button"
                onClick={() => handleMainCategorySelect("Жилая")}
                className={formData.main_category === "Жилая" ? activeButtonClass : baseButtonClass}
              >
                Жилая
              </button>
              <button
                type="button"
                onClick={() => handleMainCategorySelect("Коммерческая")}
                className={formData.main_category === "Коммерческая" ? activeButtonClass : baseButtonClass}
              >
                Коммерческая
              </button>
            </div>
          </div>
        );
      case 3:
        return formData.deal_type === "Аренда" ? (
          <div className="space-y-6">
            <div className={buttonGroupClass}>
              <button
                type="button"
                onClick={() => handleRentDurationSelect("Долгосрочная")}
                className={formData.rent_duration === "Долгосрочная" ? activeButtonClass : baseButtonClass}
              >
                Долгосрочная
              </button>
              <button
                type="button"
                onClick={() => handleRentDurationSelect("Посуточная")}
                className={formData.rent_duration === "Посуточная" ? activeButtonClass : baseButtonClass}
              >
                Посуточная
              </button>
            </div>
          </div>
        ) : null;
      case 4:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {(formData.main_category === "Жилая" 
                ? (formData.deal_type === "Аренда" ? RENT_RESIDENTIAL_LONG : SALE_LIVING)
                : (formData.deal_type === "Аренда" ? RENT_COMMERCIAL_LONG : SALE_COMMERCIAL)
              ).map((subCat: string) => (
                <button
                  key={subCat}
                  type="button"
                  onClick={() => handleSubCategorySelect(subCat)}
                  className={formData.sub_category === subCat ? activeButtonClass : baseButtonClass}
                >
                  {subCat}
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Адрес</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Введите адрес"
              />
            </div>
            <div>
              <label className={labelClass}>Номер квартиры/офиса</label>
              <input
                type="text"
                name="apartmentNumber"
                value={formData.apartmentNumber}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Введите номер"
              />
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Количество комнат</label>
              <div className="grid grid-cols-4 gap-2">
                {["Студия", "1", "2", "3", "4", "5+", "Свободная планировка"].map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => handleRoomSelect(room)}
                    className={formData.rooms === room ? activeButtonClass : baseButtonClass}
                  >
                    {room}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Площадь (м²)</label>
              <input
                type="number"
                name="area"
                value={formData.area || ""}
                onChange={handleInputChange}
                className={inputClass}
                min="1"
                placeholder="Введите площадь"
              />
            </div>
            <div>
              <label className={labelClass}>Высота потолков (м)</label>
              <input
                type="number"
                name="ceilingHeight"
                value={formData.ceilingHeight || ""}
                onChange={handleInputChange}
                className={inputClass}
                min="1"
                step="0.1"
                placeholder="Введите высоту потолков"
              />
            </div>
            <div>
              <label className={labelClass}>Этаж</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleFloorSelect("Цокольный")}
                  className={formData.floor === "Цокольный" ? activeButtonClass : baseButtonClass}
                >
                  Цокольный
                </button>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor === "Цокольный" ? "" : formData.floor || ""}
                  onChange={handleInputChange}
                  className={inputClass}
                  min="0"
                  placeholder="Введите этаж"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Всего этажей</label>
              <input
                type="number"
                name="totalFloors"
                value={formData.totalFloors || ""}
                onChange={handleInputChange}
                className={inputClass}
                min="1"
                placeholder="Введите количество этажей"
              />
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <PhotoUpload
              onUpload={handlePhotoUpload}
              photos={formData.photos}
              onDelete={handlePhotoDelete}
              existingPhotos={formData.existingPhotos}
              onExistingPhotoDelete={handleExistingPhotoDelete}
            />
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
          </div>
        );
      case 8:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Состояние</label>
              <div className={buttonGroupClass}>
                <button
                  type="button"
                  onClick={() => handlePropertyConditionSelect("Вторичка")}
                  className={formData.propertyCondition === "Вторичка" ? activeButtonClass : baseButtonClass}
                >
                  Вторичка
                </button>
                <button
                  type="button"
                  onClick={() => handlePropertyConditionSelect("Новостройка")}
                  className={formData.propertyCondition === "Новостройка" ? activeButtonClass : baseButtonClass}
                >
                  Новостройка
                </button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Ремонт</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Черновая отделка",
                  "Коробка",
                  "Частичный ремонт",
                  "Чистовой ремонт",
                  "Ремонт по дизайн-проекту",
                  "Евро"
                ].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleRenovationSelect(type as PropertyFormData["renovation"])}
                    className={formData.renovation === type ? activeButtonClass : baseButtonClass}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Год постройки</label>
              <input
                type="number"
                name="buildYear"
                value={formData.buildYear || ""}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Введите год постройки"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>

            <div>
              <label className={labelClass}>Парковка</label>
              <div className="grid grid-cols-2 gap-4">
                {["Подземная", "Наземная", "Многоуровневая"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleParkingToggle(type)}
                    className={formData.parking?.includes(type) ? activeButtonClass : baseButtonClass}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Лифты</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1">Пассажирский</label>
                  <input
                    type="number"
                    name="liftsPassenger"
                    value={formData.liftsPassenger || ""}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Количество"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1">Грузовой</label>
                  <input
                    type="number"
                    name="liftsFreight"
                    value={formData.liftsFreight || ""}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Количество"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Отопление</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleHeatingSelect("Да")}
                  className={formData.heating === "Да" ? activeButtonClass : baseButtonClass}
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => handleHeatingSelect("Нет")}
                  className={formData.heating === "Нет" ? activeButtonClass : baseButtonClass}
                >
                  Нет
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Балкон/Лоджия</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleBalconySelect(true)}
                  className={formData.hasBalcony ? activeButtonClass : baseButtonClass}
                >
                  Да
                </button>
                <button
                  type="button"
                  onClick={() => handleBalconySelect(false)}
                  className={!formData.hasBalcony ? activeButtonClass : baseButtonClass}
                >
                  Нет
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Санузел</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleBathroomSelect("Разделенный")}
                  className={formData.bathroom === "Разделенный" ? activeButtonClass : baseButtonClass}
                >
                  Раздельный
                </button>
                <button
                  type="button"
                  onClick={() => handleBathroomSelect("Совмещенный")}
                  className={formData.bathroom === "Совмещенный" ? activeButtonClass : baseButtonClass}
                >
                  Совмещенный
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Ванная</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleBathTypeSelect("Душевая кабина")}
                  className={formData.bathType === "Душевая кабина" ? activeButtonClass : baseButtonClass}
                >
                  Душевая кабина
                </button>
                <button
                  type="button"
                  onClick={() => handleBathTypeSelect("Ванна")}
                  className={formData.bathType === "Ванна" ? activeButtonClass : baseButtonClass}
                >
                  Ванна
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Бытовая техника</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Телевизор",
                  "Кондиционер",
                  "Холодильник",
                  "Стиральная машина",
                  "Посудомоечная машина",
                  "Плита",
                  "Микроволновая печь",
                  "Духовка",
                  "Пылесос",
                  "Бойлер"
                ].map((appliance) => (
                  <button
                    key={appliance}
                    type="button"
                    onClick={() => handleApplianceToggle(appliance)}
                    className={formData.appliances?.includes(appliance) ? activeButtonClass : baseButtonClass}
                  >
                    {appliance}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Подключения и связь</label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  "Кабельное ТВ",
                  "Спутниковое ТВ",
                  "WiFi",
                  "Телефон"
                ].map((connection) => (
                  <button
                    key={connection}
                    type="button"
                    onClick={() => handleConnectivitySelect(connection)}
                    className={formData.connectivity?.includes(connection) ? activeButtonClass : baseButtonClass}
                  >
                    {connection}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Условия проживания</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleLivingConditionsToggle("children")}
                  className={formData.livingConditions?.includes("children") ? activeButtonClass : baseButtonClass}
                >
                  Можно с детьми
                </button>
                <button
                  type="button"
                  onClick={() => handleLivingConditionsToggle("pets")}
                  className={formData.livingConditions?.includes("pets") ? activeButtonClass : baseButtonClass}
                >
                  Можно с домашними животными
                </button>
              </div>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-6">
            <div className={sectionClass}>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={labelClass}>
                      Описание
                      <span className="text-gray-500 text-sm ml-1">
                        (минимум 20 символов)
                      </span>
                    </label>
                    <span className="text-sm text-gray-500">
                      {formData.description.length}/3000 символов
                    </span>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 p-3 mb-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full mr-2"></div>
                        Расположение и район
                      </div>
                      <div className="flex items-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full mr-2"></div>
                        Транспортная доступность
                      </div>
                      <div className="flex items-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full mr-2"></div>
                        Состояние и ремонт
                      </div>
                      <div className="flex items-center">
                        <div className="w-1 h-1 bg-gray-300 rounded-full mr-2"></div>
                        Инфраструктура рядом
                      </div>
                    </div>
                  </div>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className={`${inputClass} h-48 resize-none`}
                    placeholder="Пример описания:
• Продается уютная квартира в районе Гипрозем
• 5 минут до Садбарга, рядом школа и детский сад
• Свежий ремонт, встроенная кухня, кондиционер
• Тихий двор, хорошие соседи, охраняемая территория"
                    maxLength={3000}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 11:
        return (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>Цена</label>
              <input
                type="number"
                name="price"
                value={formData.price || ""}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Введите цену"
              />
            </div>
            {formData.deal_type === "Аренда" && (
              <>
                <div>
                  <label className={labelClass}>Предоплата</label>
                  <div className="grid grid-cols-2 gap-4">
                    {["нет", "1 месяц", "2 месяца", "3 месяца", "4+ месяца"].map((prepayment) => (
                      <button
                        key={prepayment}
                        type="button"
                        onClick={() => handlePrepaymentSelect(prepayment as "нет" | "1 месяц" | "2 месяца" | "3 месяца" | "4+ месяца")}
                        className={formData.prepayment === prepayment ? activeButtonClass : baseButtonClass}
                      >
                        {prepayment}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Залог (сомони)</label>
                  <input
                    type="number"
                    name="deposit"
                    value={formData.deposit || ""}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Введите сумму залога"
                    min="0"
                  />
                </div>
              </>
            )}
            <div>
              <label className={labelClass}>Контактный телефон</label>
              <input
                type="tel"
                name="landlordContact"
                value={formData.landlordContact}
                onChange={handleInputChange}
                className={inputClass}
                placeholder="Введите номер телефона"
              />
            </div>
            <div>
              <label className={labelClass}>Способ связи</label>
              <div className="grid grid-cols-2 gap-4">
                {["Звонки", "Чат"].map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleContactMethodToggle(method)}
                    className={formData.contactMethod.includes(method) ? activeButtonClass : baseButtonClass}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleDealSelect = (deal: "Аренда" | "Продажа") => {
    setFormData((prev) => ({ ...prev, deal_type: deal }));
    updateStepStatus("deal_type");
  };

  const handleRentDurationSelect = (duration: "Долгосрочная" | "Посуточная") => {
    setFormData((prev) => ({ ...prev, rent_duration: duration }));
    updateStepStatus("rent_duration");
  };

  const handleMainCategorySelect = (cat: "Жилая" | "Коммерческая") => {
    setFormData((prev) => ({ 
      ...prev, 
      main_category: cat,
      // Если выбрана коммерческая недвижимость и тип сделки аренда, 
      // автоматически устанавливаем долгосрочную аренду
      rent_duration: cat === "Коммерческая" && prev.deal_type === "Аренда" 
        ? "Долгосрочная" 
        : prev.rent_duration
    }));
    updateStepStatus("category");
  };

  const handleSubCategorySelect = (subCat: string) => {
    setFormData((prev) => ({ ...prev, sub_category: subCat }));
    updateStepStatus("sub_category");
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "rooms"
          ? value
          : name === "floor"
          ? value === "" ? 0 : Number(value)
          : [
              "price",
              "area",
              "ceilingHeight",
              "totalFloors",
              "deposit",
              "liftsPassenger",
              "liftsFreight",
              "owner_id",
              "buildYear"
            ].includes(name)
          ? value === "" ? 0 : Number(value)
          : value,
    }));

    // Автоматически проверяем и обновляем статус шага при изменении полей
    if (["title", "description"].includes(name)) {
      setTimeout(() => updateStepStatus("description"), 0);
    } else if (["price", "whoRents", "landlordContact", "prepayment", "deposit"].includes(name)) {
      setTimeout(() => updateStepStatus("price_and_contacts"), 0);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
      setFormData((prev) => ({ ...prev, photos: Array.from(e.target.files ?? []) }));
      // Сразу вызываем updateStepStatus после загрузки файлов
      setTimeout(() => updateStepStatus("photos"), 0);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Проверяем все обязательные поля
    const requiredFields = {
      address: "Адрес",
      apartmentNumber: "Номер квартиры/офиса",
      rooms: "Количество комнат",
      owner_id: "ID владельца",
      price: "Цена",
      description: "Описание",
      landlordContact: "Контактный телефон",
      contactMethod: "Способ связи",
      main_category: "Категория",
      sub_category: "Подкатегория",
      area: "Площадь",
      totalFloors: "Количество этажей",
      propertyCondition: "Состояние",
      renovation: "Ремонт",
      heating: "Отопление",
      bathroom: "Санузел",
      buildYear: "Год постройки"
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => {
        const value = formData[key as keyof PropertyFormData];
        if (Array.isArray(value)) {
          return value.length === 0;
        }
        return !value;
      })
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      setError(`Пожалуйста, заполните следующие обязательные поля: ${missingFields.join(", ")}`);
      return;
    }

    const payload = {
      title: generateTitle(formData),
      description: formData.description,
      price: formData.price,
      address: formData.address,
      apartment_number: formData.apartmentNumber,
      rooms: formData.rooms,
      area: formData.area,
      ceiling_height: formData.ceilingHeight,
      floor: formData.floor === "Цокольный" ? -1 : Number(formData.floor),
      total_floors: formData.totalFloors,
      property_type: formData.sub_category || "",
      owner_id: formData.owner_id,
      deal_type: formData.deal_type === "Аренда" ? "rent" : "sale",
      property_condition: formData.propertyCondition,
      has_balcony: formData.hasBalcony,
      window_view: Array.isArray(formData.windowView) ? formData.windowView : [],
      bathroom: formData.bathroom,
      bath_type: formData.bathType,
      heating: formData.heating,
      renovation: formData.renovation,
      lifts_passenger: formData.liftsPassenger,
      lifts_freight: formData.liftsFreight,
      parking: Array.isArray(formData.parking) ? formData.parking : [],
      prepayment: formData.prepayment,
      deposit: formData.deposit,
      living_conditions: Array.isArray(formData.livingConditions) ? formData.livingConditions : [],
      landlord_contact: formData.landlordContact,
      contact_method: Array.isArray(formData.contactMethod) ? formData.contactMethod : [],
      furniture: Array.isArray(formData.furniture) ? formData.furniture : [],
      appliances: Array.isArray(formData.appliances) ? formData.appliances : [],
      connectivity: Array.isArray(formData.connectivity) ? formData.connectivity : [],
      build_year: Number(formData.buildYear)
    };

    try {
      let response;
      if (isEditing && propertyId) {
        response = await axios.put(`/properties/${propertyId}`, payload);
      } else {
        response = await axios.post("/properties/", payload);
      }
      
      const responsePropertyId = response.data.id || propertyId;

      // Загружаем новые фотографии
      if (formData.photos && formData.photos.length > 0) {
        const formDataFiles = new FormData();
        formData.photos.forEach((file) => {
          formDataFiles.append("files", file);
        });
        await axios.post(`/properties/${responsePropertyId}/upload-images`, formDataFiles, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      
      router.push(`/properties/${responsePropertyId}`);
    } catch (err: any) {
      console.error("Ошибка при " + (isEditing ? "обновлении" : "создании") + " объявления:", err);
      console.error("Payload:", JSON.stringify(payload, null, 2));
      
      let errorMessage = "Ошибка при " + (isEditing ? "обновлении" : "создании") + " объявления";
      
      if (err.response?.data) {
        const errorData = err.response.data;
        console.error("Error response data:", JSON.stringify(errorData, null, 2));
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map((item: any) => {
                if (typeof item === 'object' && item.msg) {
                  return `${item.loc.join('. ')}: ${item.msg}`;
                }
                return String(item);
              })
              .filter(Boolean)
              .join(', ');
          } else if (typeof errorData.detail === 'object') {
            const messages: Array<string> = [];
            for (const [key, value] of Object.entries(errorData.detail)) {
              if (Array.isArray(value)) {
                messages.push(`${key}: ${value.map((v: unknown) => String(v)).join(', ')}`);
              } else {
                messages.push(`${key}: ${String(value)}`);
              }
            }
            errorMessage = messages.join('. ');
          }
        }
      }
      
      setError(errorMessage);
    }
  };

  const handleRoomSelect = (rooms: string) => {
    setFormData(prev => ({ ...prev, rooms }));
    updateStepStatus("rooms");
  };

  const handlePropertyConditionSelect = (condition: "Вторичка" | "Новостройка") => {
    setFormData(prev => ({ ...prev, propertyCondition: condition }));
    updateStepStatus("property_condition");
  };

  const handleRenovationSelect = (type: PropertyFormData["renovation"]) => {
    setFormData(prev => ({ ...prev, renovation: type }));
    updateStepStatus("property_condition");
  };

  const handleBathroomSelect = (type: "Разделенный" | "Совмещенный") => {
    setFormData(prev => ({ ...prev, bathroom: type }));
    updateStepStatus("property_condition");
  };

  const handleBathTypeSelect = (type: "Душевая кабина" | "Ванна") => {
    setFormData(prev => ({ ...prev, bathType: type }));
    updateStepStatus("property_condition");
  };

  const handleBalconySelect = (hasBalcony: boolean) => {
    setFormData(prev => ({ ...prev, hasBalcony }));
    updateStepStatus("property_condition");
  };

  const handleWhoRentsSelect = (who: "Собственник" | "Риелтор") => {
    setFormData(prev => ({ ...prev, whoRents: who }));
    updateStepStatus("description");
  };

  const handlePrepaymentSelect = (prepayment: "нет" | "1 месяц" | "2 месяца" | "3 месяца" | "4+ месяца") => {
    setFormData(prev => ({ ...prev, prepayment }));
    updateStepStatus("price_and_contacts");
  };

  const handleContactMethodToggle = (method: string) => {
    setFormData(prev => {
      const currentMethods = prev.contactMethod || [];
      const newMethods = currentMethods.includes(method)
        ? currentMethods.filter(m => m !== method)
        : [...currentMethods, method];
      return { ...prev, contactMethod: newMethods };
    });
    updateStepStatus("price_and_contacts");
  };

  const handleHeatingSelect = (hasHeating: "Да" | "Нет") => {
    setFormData(prev => ({ ...prev, heating: hasHeating }));
    updateStepStatus("property_condition");
  };

  const handleApplianceToggle = (appliance: string) => {
    setFormData(prev => {
      const currentAppliances = prev.appliances || [];
      const newAppliances = currentAppliances.includes(appliance)
        ? currentAppliances.filter(a => a !== appliance)
        : [...currentAppliances, appliance];
      return { ...prev, appliances: newAppliances };
    });
    updateStepStatus("property_condition");
  };

  const handleLiftChange = (type: 'passenger' | 'freight', value: number) => {
    setFormData(prev => ({
      ...prev,
      [type === 'passenger' ? 'liftsPassenger' : 'liftsFreight']: value
    }));
    updateStepStatus("property_condition");
  };

  const handleFurnitureSelect = (type: string) => {
    setFormData(prev => {
      const currentFurniture = prev.furniture || [];
      const newFurniture = currentFurniture.includes(type)
        ? currentFurniture.filter(f => f !== type)
        : [...currentFurniture, type];
      return { ...prev, furniture: newFurniture };
    });
    updateStepStatus("property_condition");
  };

  const handleConnectivitySelect = (type: string) => {
    setFormData(prev => {
      const currentConnectivity = prev.connectivity || [];
      const newConnectivity = currentConnectivity.includes(type)
        ? currentConnectivity.filter(c => c !== type)
        : [...currentConnectivity, type];
      return { ...prev, connectivity: newConnectivity };
    });
    updateStepStatus("property_condition");
  };

  const handleDepositChange = (depositPeriod: PropertyFormData["prepayment"]) => {
    setFormData(prev => ({
      ...prev,
      prepayment: depositPeriod,
      deposit: depositPeriod === "нет" ? 0 : prev.deposit
    }));
    updateStepStatus("price_and_contacts");
  };

  const getSubcategories = (mainCategory: string, dealType: string, rentDuration?: string): string[] => {
    if (mainCategory === "Жилая") {
      if (dealType === "Аренда") {
        if (rentDuration === "Долгосрочная") {
          return [
            "Квартира",
            "Комната",
            "Койко-место",
            "Хавли/Дом",
            "Гараж",
            "Парковочное место",
            "Дача"
          ];
        } else { // Посуточная аренда
          return [
            "Квартира",
            "Комната",
            "Дом",
            "Таунхаус"
          ];
        }
      } else { // Продажа
        return [
          "Квартира",
          "Комната",
          "Дом",
          "Таунхаус",
          "Участок"
        ];
      }
    } else if (mainCategory === "Коммерческая") {
      // ... существующий код для коммерческой недвижимости ...
    }
    return [];
  };

  const handlePhotoUpload = async (files: File[]) => {
    try {
      if (isEditing && propertyId) {
        // Сначала добавляем фотографии в состояние для отображения
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...files]
        }));
        
        // Обновляем статус шага
        const totalPhotos = (formData.photos.length + files.length) + (formData.existingPhotos?.length || 0);
        updateStepStatus("photos", totalPhotos > 0);
      } else {
        // Для нового объявления просто добавляем фотографии в состояние
        setFormData((prev) => ({
          ...prev,
          photos: [...prev.photos, ...files]
        }));
        updateStepStatus("photos", true);
      }
    } catch (error) {
      console.error('Error handling photos:', error);
      setError('Ошибка при обработке фотографий');
    }
  };

  const handlePhotoDelete = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
    updateStepStatus("photos", formData.photos.length > 1);
  };

  const handleExistingPhotoDelete = async (photoId: number) => {
    try {
      console.log('Удаление фотографии с ID:', photoId);
      
      if (isEditing && propertyId) {
        // Отправляем запрос на удаление фотографии
        await axios.delete(`/properties/${propertyId}/images/${photoId}`);
        console.log('Фотография успешно удалена с сервера');
        
        // Обновляем состояние после успешного удаления
        setFormData((prev) => {
          const updatedExistingPhotos = prev.existingPhotos?.filter(photo => photo.id !== photoId) || [];
          console.log('Обновленный список фотографий:', updatedExistingPhotos);
          
          // Проверяем общее количество фотографий для обновления статуса шага
          const totalPhotos = prev.photos.length + updatedExistingPhotos.length;
          updateStepStatus("photos", totalPhotos > 0);
          
          return {
            ...prev,
            existingPhotos: updatedExistingPhotos
          };
        });
      }
    } catch (error) {
      console.error('Ошибка при удалении фотографии:', error);
      setError('Не удалось удалить фотографию. Пожалуйста, попробуйте еще раз.');
    }
  };

  const handleParkingToggle = (type: string) => {
    setFormData(prev => {
      const currentParking = prev.parking || [];
      const newParking = currentParking.includes(type)
        ? currentParking.filter(p => p !== type)
        : [...currentParking, type];
      return { ...prev, parking: newParking };
    });
    updateStepStatus("property_condition");
  };

  const handleLivingConditionsToggle = (condition: "children" | "pets") => {
    const currentConditions = formData.livingConditions || [];
    const newConditions = currentConditions.includes(condition)
      ? currentConditions.filter(c => c !== condition)
      : [...currentConditions, condition];
    setFormData(prev => ({ ...prev, livingConditions: newConditions }));
    updateStepStatus("additional");
  };

  const handleFloorSelect = (floor: "Цокольный") => {
    setFormData(prev => ({ ...prev, floor }));
    updateStepStatus("rooms");
  };

  return (
    <div className={stepContainerClass}>
      <div className={formContainerClass}>
        <h1 className={titleClass}>{isEditing ? "Редактирование объявления" : "Создание объявления"}</h1>
        
        {/* Прогресс-бар */}
        <div className="mb-8">
          {/* Линия прогресса */}
          <div className="relative h-1 bg-gray-200 rounded-full mb-8">
            <div 
              className="absolute h-full bg-gray-900 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentStep - 1) / (steps.filter(step => !step.condition || step.condition(formData)).length - 1)) * 100}%`,
                left: 0
              }}
            />
          </div>
          
          {/* Шаги */}
          <div className="flex justify-between relative px-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isVisible = !step.condition || step.condition(formData);
              const isCompleted = stepStatuses[step.number].isCompleted;
              const isActive = step.number === currentStep;
              
              if (!isVisible) return null;
              
              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center relative ${
                    step.number > currentStep ? "opacity-50" : ""
                  }`}
                  style={{ width: '60px' }}
                >
                  {/* Иконка */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isCompleted ? <FaCheck className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  
                  {/* Линия между шагами */}
                  {index < steps.length - 1 && isVisible && (
                    <div className="absolute top-5 left-[60%] w-[80%] h-0.5 bg-gray-200">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? "bg-green-500" : "bg-gray-200"
                        } ${isCompleted ? "w-full" : "w-0"}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Содержимое шага */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {steps[currentStep - 1].title}
              </h2>
            </div>

            {renderStepContent()}

            {/* Кнопки навигации */}
            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                className={baseButtonClass}
              >
                Назад
              </button>
              {currentStep === steps.length ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm ${
                    validateStep(currentStep)
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!validateStep(currentStep)}
                >
                  {isEditing ? "Сохранить изменения" : "Создать объявление"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm ${
                    validateStep(currentStep)
                      ? "bg-gray-900 text-white hover:bg-gray-800"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                  disabled={!validateStep(currentStep)}
                >
                  Далее
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
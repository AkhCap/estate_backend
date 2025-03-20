// Файл: app/create-property/page.tsx
"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";
import { jwtDecode } from "jwt-decode";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheck, FaChevronDown, FaChevronUp, FaExclamationCircle } from "react-icons/fa";

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
  owner_id: number; // Добавляем owner_id
}

const initialPropertyFormData: PropertyFormData = {
  deal_type: "Аренда",
  rent_duration: undefined,
  main_category: "",
  sub_category: "",
  address: "",
  apartmentNumber: "",
  rooms: "",
  area: 30,
  ceilingHeight: 2.5,
  floor: 1,
  totalFloors: 5,
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
  buildYear: new Date().getFullYear(),
  owner_id: 1, // Устанавливаем owner_id по умолчанию (замени на реальный ID пользователя)
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

export default function CreatePropertyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<PropertyFormData>(initialPropertyFormData);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
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
    10: { isCompleted: false, isActive: false }
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
        return formData.deal_type === "Продажа" || !!formData.rent_duration;
      case 3:
        return !!formData.main_category;
      case 4:
        return !!formData.sub_category && !!formData.address && !!formData.apartmentNumber;
      case 5:
        return !!formData.rooms && !!formData.area && !!formData.floor && !!formData.totalFloors;
      case 6:
        return formData.photos.length > 0;
      case 7:
        return !!formData.propertyCondition && !!formData.renovation;
      case 8:
        return true; // Опциональные характеристики
      case 9:
        return !!formData.title && !!formData.description;
      case 10:
        const hasRequiredFields = !!formData.price && !!formData.landlordContact;
        const hasContactMethod = formData.contactMethod && formData.contactMethod.length > 0;
        
        if (formData.deal_type === "Аренда") {
          return hasRequiredFields && !!formData.prepayment && hasContactMethod;
        }
        return hasRequiredFields && hasContactMethod;
      default:
        return false;
    }
  };

  const updateStepStatus = (stepNumber: number) => {
    const isCompleted = validateStep(stepNumber);
    
    setStepStatuses(prev => {
      const newStatuses = { ...prev };
      
      // Обновляем статус текущего шага
      newStatuses[stepNumber] = {
        ...newStatuses[stepNumber],
        isCompleted,
        isActive: true
      };
      
      // Если текущий шаг завершен, активируем следующий шаг
      if (isCompleted && stepNumber < 10) {
        newStatuses[stepNumber + 1] = {
          ...newStatuses[stepNumber + 1],
          isActive: true
        };
      }

      // Проверяем и активируем все шаги, которые уже заполнены
      for (let i = 1; i <= 10; i++) {
        const stepIsCompleted = validateStep(i);
        newStatuses[i] = {
          ...newStatuses[i],
          isCompleted: stepIsCompleted,
          isActive: i <= stepNumber + 1 || stepIsCompleted
        };
      }
      
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
      if (stepNumber < 10 && validateStep(stepNumber)) {
        newStatuses[stepNumber + 1] = {
          ...newStatuses[stepNumber + 1],
          isActive: true
        };
      }

      return newStatuses;
    });
  };

  const StepHeader = ({ number, title }: { number: number; title: string }) => {
    const status = stepStatuses[number];
    return (
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
          status.isActive ? 'bg-white' : 'bg-gray-50'
        } ${status.isCompleted ? 'border-l-2 border-gray-900' : ''}`}
        onClick={() => handleStepClick(number)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
            status.isCompleted ? 'bg-gray-900 text-white' : 
            status.isActive ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {status.isCompleted ? <FaCheck className="w-3 h-3" /> : number}
          </div>
          <span className={`font-medium text-sm ${status.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {status.error && (
            <FaExclamationCircle className="text-red-500 w-4 h-4" />
          )}
          {status.isActive ? 
            <FaChevronUp className="w-3 h-3 text-gray-400" /> : 
            <FaChevronDown className="w-3 h-3 text-gray-400" />
          }
        </div>
      </div>
    );
  };

  const handleDealSelect = (deal: "Аренда" | "Продажа") => {
    setFormData((prev) => ({ ...prev, deal_type: deal }));
    updateStepStatus(1);
  };

  const handleRentDurationSelect = (duration: "Долгосрочная" | "Посуточная") => {
    setFormData((prev) => ({ ...prev, rent_duration: duration }));
    updateStepStatus(2);
  };

  const handleMainCategorySelect = (cat: "Жилая" | "Коммерческая") => {
    setFormData((prev) => ({ ...prev, main_category: cat }));
    updateStepStatus(3);
  };

  const handleSubCategorySelect = (subCat: string) => {
    setFormData((prev) => ({ ...prev, sub_category: subCat }));
    updateStepStatus(4);
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
          : [
              "price",
              "area",
              "ceilingHeight",
              "floor",
              "totalFloors",
              "deposit",
              "liftsPassenger",
              "liftsFreight",
              "owner_id",
            ].includes(name)
          ? Number(value)
          : value,
    }));

    // Автоматически проверяем и обновляем статус шага при изменении полей
    if (["title", "description"].includes(name)) {
      setTimeout(() => updateStepStatus(9), 0);
    } else if (["price", "whoRents", "landlordContact", "prepayment", "deposit"].includes(name)) {
      setTimeout(() => updateStepStatus(10), 0);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
      setFormData((prev) => ({ ...prev, photos: Array.from(e.target.files ?? []) }));
      // Сразу вызываем updateStepStatus после загрузки файлов
      setTimeout(() => updateStepStatus(6), 0);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.address || !formData.apartmentNumber || !formData.rooms || !formData.owner_id) {
      setError("Пожалуйста, заполните все обязательные поля");
      return;
    }
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: formData.price,
        address: formData.address,
        rooms: formData.rooms,
        area: formData.area,
        ceiling_height: formData.ceilingHeight,
        floor: formData.floor,
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
        build_year: formData.buildYear
      };

      console.log("Отправляемый URL:", axios.getUri({ url: "/properties/" }));
      console.log("Отправляемый payload:", payload);
      console.log("Файлы для загрузки:", files ? Array.from(files).map(f => f.name) : "Нет файлов");

      const response = await axios.post("/properties/", payload);
      const propertyId = response.data.id;

      if (files && files.length > 0) {
        console.log("Загружаем изображения для property_id:", propertyId);
        const formDataFiles = new FormData();
        Array.from(files).forEach((file) => {
          formDataFiles.append("files", file);
        });
        await axios.post(`/properties/${propertyId}/upload-images`, formDataFiles, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        console.log("Изображения не выбраны, пропускаем загрузку.");
      }
      router.push(`/properties/${propertyId}`);
    } catch (err: any) {
      console.error("Ошибка создания объявления:", err);
      
      let errorMessage = "Ошибка при создании объявления";
      
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail
              .map((item: any) => {
                if (typeof item === 'object' && item.msg) {
                  return String(item.msg);
                }
                return String(item);
              })
              .filter(Boolean)
              .join(', ');
          } else if (typeof errorData.detail === 'object') {
            const messages: Array<string> = [];
            for (const [_, value] of Object.entries(errorData.detail)) {
              if (Array.isArray(value)) {
                messages.push(value.map((v: unknown) => String(v)).join(', '));
              } else {
                messages.push(String(value));
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
    updateStepStatus(5);
  };

  const handlePropertyConditionSelect = (condition: "Вторичка" | "Новостройка") => {
    setFormData(prev => ({ ...prev, propertyCondition: condition }));
    updateStepStatus(7);
  };

  const handleRenovationSelect = (type: PropertyFormData["renovation"]) => {
    setFormData(prev => ({ ...prev, renovation: type }));
    updateStepStatus(7);
  };

  const handleBathroomSelect = (type: "Разделенный" | "Совмещенный") => {
    setFormData(prev => ({ ...prev, bathroom: type }));
    updateStepStatus(8);
  };

  const handleBalconySelect = (hasBalcony: boolean) => {
    setFormData(prev => ({ ...prev, hasBalcony }));
    updateStepStatus(8);
  };

  const handleWhoRentsSelect = (who: "Собственник" | "Риелтор") => {
    setFormData(prev => ({ ...prev, whoRents: who }));
    updateStepStatus(10);
  };

  const handlePrepaymentSelect = (prepayment: string) => {
    setFormData(prev => ({ ...prev, prepayment }));
    updateStepStatus(10);
  };

  const handleContactMethodToggle = (method: string) => {
    setFormData(prev => {
      const currentMethods = prev.contactMethod || [];
      const newMethods = currentMethods.includes(method)
        ? currentMethods.filter(m => m !== method)
        : [...currentMethods, method];
      return { ...prev, contactMethod: newMethods };
    });
    updateStepStatus(10);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className={titleClass}>Создание объявления</h1>
        
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Шаг 1: Тип сделки */}
          <div className="border-b">
            <StepHeader number={1} title="Тип сделки" />
            <AnimatePresence>
              {stepStatuses[1].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className={buttonGroupClass}>
                    <button
                      className={formData.deal_type === "Аренда" ? activeButtonClass : baseButtonClass}
                      onClick={() => {
                        handleDealSelect("Аренда");
                        updateStepStatus(1);
                      }}
                    >
                      Аренда
                    </button>
                    <button
                      className={formData.deal_type === "Продажа" ? activeButtonClass : baseButtonClass}
                      onClick={() => {
                        handleDealSelect("Продажа");
                        updateStepStatus(1);
                      }}
                    >
                      Продажа
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 2: Срок аренды */}
          <div className="border-b">
            <StepHeader number={2} title="Срок аренды" />
            <AnimatePresence>
              {stepStatuses[2].isActive && formData.deal_type === "Аренда" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className={buttonGroupClass}>
                    <button
                      className={formData.rent_duration === "Долгосрочная" ? activeButtonClass : baseButtonClass}
                      onClick={() => {
                        handleRentDurationSelect("Долгосрочная");
                        updateStepStatus(2);
                      }}
                    >
                      Долгосрочная
                    </button>
                    <button
                      className={formData.rent_duration === "Посуточная" ? activeButtonClass : baseButtonClass}
                      onClick={() => {
                        handleRentDurationSelect("Посуточная");
                        updateStepStatus(2);
                      }}
                    >
                      Посуточная
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 3: Категория недвижимости */}
          <div className="border-b">
            <StepHeader number={3} title="Категория недвижимости" />
            <AnimatePresence>
              {stepStatuses[3].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className={buttonGroupClass}>
                    <button
                      className={formData.main_category === "Жилая" ? activeButtonClass : baseButtonClass}
                      onClick={() => {
                        handleMainCategorySelect("Жилая");
                        updateStepStatus(3);
                      }}
                    >
                      Жилая
                    </button>
                    <button
                      className={formData.main_category === "Коммерческая" ? activeButtonClass : baseButtonClass}
                      onClick={() => {
                        handleMainCategorySelect("Коммерческая");
                        updateStepStatus(3);
                      }}
                    >
                      Коммерческая
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 4: Подкатегория и адрес */}
          <div className="border-b">
            <StepHeader number={4} title="Тип недвижимости и адрес" />
            <AnimatePresence>
              {stepStatuses[4].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className="mb-6">
                    <label className={labelClass}>Тип недвижимости</label>
                    <div className="grid grid-cols-2 gap-4">
                      {(formData.deal_type === "Продажа"
                        ? (formData.main_category === "Жилая" ? SALE_LIVING : SALE_COMMERCIAL)
                        : formData.rent_duration === "Посуточная"
                        ? RENT_SHORT
                        : formData.main_category === "Жилая"
                        ? RENT_RESIDENTIAL_LONG
                        : RENT_COMMERCIAL_LONG
                      ).map((category: string) => (
                        <button
                          key={category}
                          className={formData.sub_category === category ? activeButtonClass : baseButtonClass}
                          onClick={() => handleSubCategorySelect(category)}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
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
                      <label className={labelClass}>Номер квартиры/помещения</label>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 5: Основные характеристики */}
          <div className="border-b">
            <StepHeader number={5} title="Основные характеристики" />
            <AnimatePresence>
              {stepStatuses[5].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>Количество комнат</label>
                      <div className="grid grid-cols-4 gap-4">
                        {["Студия", "1", "2", "3", "4", "5+", "Свободная планировка"].map((room) => (
                          <button
                            key={room}
                            className={formData.rooms === room ? activeButtonClass : baseButtonClass}
                            onClick={() => handleRoomSelect(room)}
                          >
                            {room}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Площадь (м²)</label>
                        <input
                          type="number"
                          name="area"
                          value={formData.area}
                          onChange={handleInputChange}
                          className={inputClass}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Этаж</label>
                        <input
                          type="number"
                          name="floor"
                          value={formData.floor}
                          onChange={handleInputChange}
                          className={inputClass}
                          min="1"
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Всего этажей</label>
                        <input
                          type="number"
                          name="totalFloors"
                          value={formData.totalFloors}
                          onChange={handleInputChange}
                          className={inputClass}
                          min="1"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 6: Фотографии */}
          <div className="border-b">
            <StepHeader number={6} title="Фотографии" />
            <AnimatePresence>
              {stepStatuses[6].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className="space-y-4">
                    <label className={labelClass}>Загрузите фотографии объекта</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full"
                    />
                    <p className="text-sm text-gray-500">
                      Можно загрузить до 30 фотографий. Форматы: JPG, PNG. Максимальный размер: 10MB
                    </p>
                    {formData.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-4">
                        {Array.from(formData.photos).map((photo, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(photo)}
                              alt={`Фото ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 7: Состояние */}
          <div className="border-b">
            <StepHeader number={7} title="Состояние" />
            <AnimatePresence>
              {stepStatuses[7].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>Состояние объекта</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          className={formData.propertyCondition === "Вторичка" ? activeButtonClass : baseButtonClass}
                          onClick={() => handlePropertyConditionSelect("Вторичка")}
                        >
                          Вторичка
                        </button>
                        <button
                          className={formData.propertyCondition === "Новостройка" ? activeButtonClass : baseButtonClass}
                          onClick={() => handlePropertyConditionSelect("Новостройка")}
                        >
                          Новостройка
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Ремонт</label>
                      <div className="grid grid-cols-2 gap-4">
                        {["Без ремонта", "Коробка", "Косметический", "Евро", "Дизайнерская"].map((type) => (
                          <button
                            key={type}
                            className={formData.renovation === type ? activeButtonClass : baseButtonClass}
                            onClick={() => handleRenovationSelect(type as PropertyFormData["renovation"])}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 8: Дополнительные характеристики */}
          <div className="border-b">
            <StepHeader number={8} title="Дополнительные характеристики" />
            <AnimatePresence>
              {stepStatuses[8].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>Санузел</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          className={formData.bathroom === "Разделенный" ? activeButtonClass : baseButtonClass}
                          onClick={() => handleBathroomSelect("Разделенный")}
                        >
                          Разделенный
                        </button>
                        <button
                          className={formData.bathroom === "Совмещенный" ? activeButtonClass : baseButtonClass}
                          onClick={() => handleBathroomSelect("Совмещенный")}
                        >
                          Совмещенный
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Балкон/лоджия</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          className={formData.hasBalcony ? activeButtonClass : baseButtonClass}
                          onClick={() => handleBalconySelect(true)}
                        >
                          Есть
                        </button>
                        <button
                          className={!formData.hasBalcony ? activeButtonClass : baseButtonClass}
                          onClick={() => handleBalconySelect(false)}
                        >
                          Нет
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 9: Описание */}
          <div className="border-b">
            <StepHeader number={9} title="Описание объявления" />
            <AnimatePresence>
              {stepStatuses[9].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>Заголовок объявления</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className={inputClass}
                        placeholder="Например: Уютная квартира в центре города"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Описание</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className={`${inputClass} h-32`}
                        placeholder="Опишите все преимущества вашего объекта"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Шаг 10: Условия и контакты */}
          <div className="border-b">
            <StepHeader number={10} title="Условия и контакты" />
            <AnimatePresence>
              {stepStatuses[10].isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-6"
                >
                  <div className="space-y-6">
                    <div>
                      <label className={labelClass}>Цена</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className={inputClass}
                        min="0"
                        placeholder="Введите цену"
                      />
                    </div>
                    {formData.deal_type === "Аренда" && (
                      <>
                        <div>
                          <label className={labelClass}>Предоплата</label>
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              "нет",
                              "за 1 месяц",
                              "за 2 месяца",
                              "за 3 месяца",
                              "за 4+ месяца"
                            ].map((option) => (
                              <button
                                key={option}
                                className={formData.prepayment === option ? activeButtonClass : baseButtonClass}
                                onClick={() => handlePrepaymentSelect(option)}
                              >
                                {option}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Депозит</label>
                          <input
                            type="number"
                            name="deposit"
                            value={formData.deposit}
                            onChange={handleInputChange}
                            className={inputClass}
                            min="0"
                            placeholder="Сумма депозита"
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
                        placeholder="+7 (XXX) XXX-XX-XX"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Способ связи</label>
                      <div className="grid grid-cols-2 gap-4">
                        {["Звонки", "Чат"].map((method) => (
                          <button
                            key={method}
                            className={`${
                              formData.contactMethod?.includes(method)
                                ? activeButtonClass
                                : baseButtonClass
                            } relative`}
                            onClick={() => handleContactMethodToggle(method)}
                          >
                            {method}
                            {formData.contactMethod?.includes(method) && (
                              <span className="absolute top-2 right-2">
                                <FaCheck className="w-4 h-4" />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Кнопка отправки формы */}
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <button
              className={`w-full px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                Object.values(stepStatuses).every(status => status.isCompleted)
                  ? "bg-gray-900 text-white hover:bg-gray-800"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              onClick={handleSubmit}
              disabled={!Object.values(stepStatuses).every(status => status.isCompleted)}
            >
              Опубликовать объявление
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
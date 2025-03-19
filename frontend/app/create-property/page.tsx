// Файл: app/create-property/page.tsx
"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";
import { jwtDecode } from "jwt-decode";

const baseButtonClass =
  "bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium";

const activeButtonClass =
  "bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg transition-all duration-200 shadow-md transform scale-105 font-medium border-2 border-green-400";

const inputClass = "w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 outline-none";
const labelClass = "block text-gray-700 font-medium mb-2";
const sectionClass = "bg-white rounded-xl p-6 shadow-sm border border-gray-100";
const subheadingClass = "text-2xl font-semibold mb-6 text-gray-800";
const buttonGroupClass = "grid grid-cols-2 gap-6";
const stepContainerClass = "min-h-screen bg-gray-50 py-12";
const formContainerClass = "max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8";
const titleClass = "text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent";
const errorClass = "bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg";

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

export default function CreatePropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<PropertyFormData>(initialPropertyFormData);
  const [error, setError] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);

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

  const nextStep = () => {
    if (step === 4 && (!formData.address || !formData.apartmentNumber)) {
      setError("Пожалуйста, заполните адрес и номер квартиры");
      return;
    }
    if (step === 5 && !formData.rooms) {
      setError("Пожалуйста, выберите количество комнат");
      return;
    }
    if (step === 6 && formData.photos.length === 0) {
      setError("Пожалуйста, добавьте хотя бы одну фотографию");
      return;
    }
    if (step === 9 && (!formData.title || !formData.description)) {
      setError("Пожалуйста, заполните заголовок и описание");
      return;
    }
    if (
      step === 10 &&
      (!formData.price || !formData.whoRents || !formData.landlordContact)
    ) {
      setError("Пожалуйста, укажите цену, кто сдает и контакты арендодателя");
      return;
    }
    setError("");
    setStep((prev) => (prev < 10 ? prev + 1 : prev));
  };

  const prevStep = () => setStep((prev) => (prev > 1 ? prev - 1 : prev));

  const handleDealSelect = (deal: "Аренда" | "Продажа") => {
    setFormData((prev) => ({ ...prev, deal_type: deal }));
    nextStep();
  };

  const handleRentDurationSelect = (duration: "Долгосрочная" | "Посуточная") => {
    setFormData((prev) => ({ ...prev, rent_duration: duration }));
    nextStep();
  };

  const handleMainCategorySelect = (cat: "Жилая" | "Коммерческая") => {
    setFormData((prev) => ({ ...prev, main_category: cat }));
    nextStep();
  };

  const handleSubCategorySelect = (subCat: string) => {
    setFormData((prev) => ({ ...prev, sub_category: subCat }));
    setStep(4);
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
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
      setFormData((prev) => ({ ...prev, photos: Array.from(e.target.files ?? []) }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.address || !formData.apartmentNumber || !formData.rooms || !formData.owner_id) {
      setError("Пожалуйста, заполните все обязательные поля: адрес, номер квартиры, количество комнат и owner_id");
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
        who_rents: formData.whoRents,
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

  const renderStepContent = () => {
    if (step <= 3) {
      return (
        <div className={stepContainerClass}>
          <div className={formContainerClass}>
            <h1 className={titleClass}>Создать объявление</h1>
            {error && (
              <div className={errorClass}>
                <p className="text-red-700">{error}</p>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className={subheadingClass}>Тип сделки</h2>
                <div className={buttonGroupClass}>
                  <button
                    type="button"
                    onClick={() => handleDealSelect("Аренда")}
                    className={`w-full ${formData.deal_type === "Аренда" ? activeButtonClass : baseButtonClass}`}
                  >
                    Аренда
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDealSelect("Продажа")}
                    className={`w-full ${formData.deal_type === "Продажа" ? activeButtonClass : baseButtonClass}`}
                  >
                    Продажа
                  </button>
                </div>
              </div>
            )}
            {step === 2 && formData.deal_type === "Аренда" && (
              <div className="space-y-6">
                <h2 className={subheadingClass}>Тип аренды</h2>
                <div className={buttonGroupClass}>
                  <button
                    type="button"
                    onClick={() => handleRentDurationSelect("Долгосрочная")}
                    className={`w-full ${formData.rent_duration === "Долгосрочная" ? activeButtonClass : baseButtonClass}`}
                  >
                    Долгосрочная
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRentDurationSelect("Посуточная")}
                    className={`w-full ${formData.rent_duration === "Посуточная" ? activeButtonClass : baseButtonClass}`}
                  >
                    Посуточная
                  </button>
                </div>
                <button
                  type="button"
                  onClick={prevStep}
                  className="mt-6 text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Назад
                </button>
              </div>
            )}
            {step === 2 && formData.deal_type === "Продажа" && (
              <div className="space-y-6">
                <h2 className={subheadingClass}>Выберите категорию</h2>
                <div className={buttonGroupClass}>
                  <button
                    type="button"
                    onClick={() => handleMainCategorySelect("Жилая")}
                    className={`w-full ${formData.main_category === "Жилая" ? activeButtonClass : baseButtonClass}`}
                  >
                    Жилая
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMainCategorySelect("Коммерческая")}
                    className={`w-full ${formData.main_category === "Коммерческая" ? activeButtonClass : baseButtonClass}`}
                  >
                    Коммерческая
                  </button>
                </div>
                <button
                  type="button"
                  onClick={prevStep}
                  className="mt-6 text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Назад
                </button>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className={subheadingClass}>Выберите тип</h2>
                <div className="grid grid-cols-2 gap-4">
                  {(formData.deal_type === "Аренда"
                    ? formData.rent_duration === "Долгосрочная"
                      ? RENT_RESIDENTIAL_LONG
                      : RENT_SHORT
                    : formData.main_category === "Жилая"
                    ? SALE_LIVING
                    : SALE_COMMERCIAL
                  ).map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => handleSubCategorySelect(item)}
                      className={`w-full ${formData.sub_category === item ? activeButtonClass : baseButtonClass} text-sm`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={prevStep}
                  className="mt-6 text-blue-600 hover:text-blue-800 transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Назад
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={stepContainerClass}>
        <div className={formContainerClass}>
          <h1 className={titleClass}>Создать объявление</h1>
          {error && (
            <div className={errorClass}>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            {renderDetailStep()}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Назад
              </button>
              {step < 10 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className={`${baseButtonClass} flex items-center gap-2`}
                >
                  Далее
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button type="submit" className={`${baseButtonClass} flex items-center gap-2`}>
                  Создать объявление
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderDetailStep = () => {
    if (step === 5 && !formData.sub_category) {
      return <div>Пожалуйста, выберите тип недвижимости на предыдущем шаге.</div>;
    }

    switch (step - 3) {
      case 1:
        return (
          <div className={sectionClass}>
            <h2 className={subheadingClass}>Адрес</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Введите адрес:</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Номер квартиры:</label>
                <input
                  type="text"
                  name="apartmentNumber"
                  value={formData.apartmentNumber}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={sectionClass}>
            <h2 className={subheadingClass}>Параметры квартиры</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Количество комнат:</label>
                <div className={buttonGroupClass}>
                  {["Студия", "1", "2", "3", "4", "5+", "Свободная планировка"].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, rooms: r }))
                      }
                      className={`w-full ${
                        formData.rooms === r ? activeButtonClass : baseButtonClass
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Площадь (м²):</label>
                <input
                  type="number"
                  name="area"
                  value={formData.area}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Высота потолков (м):</label>
                <input
                  type="number"
                  name="ceilingHeight"
                  value={formData.ceilingHeight}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Этаж:</label>
                <input
                  type="number"
                  name="floor"
                  value={formData.floor}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Всего этажей:</label>
                <input
                  type="number"
                  name="totalFloors"
                  value={formData.totalFloors}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={sectionClass}>
            <h2 className={subheadingClass}>Фотографии</h2>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className={inputClass}
            />
            {formData.photos.length > 0 && (
              <ul className="mt-2">
                {formData.photos.map((file, idx) => (
                  <li key={idx}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>
        );
      case 4:
        return (
          <div className={sectionClass}>
            <h2 className={subheadingClass}>Особенности квартиры</h2>
                <div>
                  <label className={labelClass}>Год постройки дома:</label>
                     <input
                      type="number"
                      name="buildYear"
                      value={formData.buildYear}
                      onChange={handleInputChange}
                      min="1900"
                      max={new Date().getFullYear()}
                      className={inputClass}
                      placeholder="Например: 2010"
                      />
                 </div>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Тип жилья:</label>
                <div className={buttonGroupClass}>
                  {["Вторичка", "Новостройка"].map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          propertyCondition: t as "Вторичка" | "Новостройка" | "",
                        }))
                      }
                      className={`w-full ${
                        formData.propertyCondition === t ? activeButtonClass : baseButtonClass
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Есть балкон:</label>
                <div className="mt-4">
                  <label className="mr-2">
                    <input
                      type="checkbox"
                      checked={formData.hasBalcony}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          hasBalcony: e.target.checked,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
              <div>
                <label className={labelClass}>Вид из окна:</label>
                <div className="mt-4">
                  {["Во двор", "На улицу"].map((view) => {
                    const selected = formData.windowView.includes(view);
                    return (
                      <label key={view} className="mr-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            const newViews = selected
                              ? formData.windowView.filter((v) => v !== view)
                              : [...formData.windowView, view];
                            setFormData((prev) => ({
                              ...prev,
                              windowView: newViews,
                            }));
                          }}
                        />
                        {view}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelClass}>Санузел:</label>
                <div className="mt-4">
                  <div className={buttonGroupClass}>
                    {["Разделенный", "Совмещенный"].map((b) => (
                      <button
                        type="button"
                        key={b}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            bathroom: b as "Разделенный" | "Совмещенный" | "",
                          }))
                        }
                        className={`w-full ${
                          formData.bathroom === b ? activeButtonClass : baseButtonClass
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Ванная комната:</label>
                <div className="mt-4">
                  <div className={buttonGroupClass}>
                    {["Ванна", "Душевая кабина"].map((b) => (
                      <button
                        type="button"
                        key={b}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            bathType: b as "Ванна" | "Душевая кабина" | "",
                          }))
                        }
                        className={`w-full ${
                          formData.bathType === b ? activeButtonClass : baseButtonClass
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Отопление:</label>
                <div className="mt-4">
                  <div className={buttonGroupClass}>
                    {["Да", "Нет"].map((opt) => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            heating: opt as "Да" | "Нет" | "",
                          }))
                        }
                        className={`w-full ${
                          formData.heating === opt ? activeButtonClass : baseButtonClass
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Ремонт:</label>
                <div className="mt-4">
                  <div className={buttonGroupClass}>
                    {[
                      "Без ремонта",
                      "Коробка",
                      "Косметический",
                      "Дизайнерская",
                      "Евро",
                    ].map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            renovation: r as
                              | "Без ремонта"
                              | "Коробка"
                              | "Косметический"
                              | "Дизайнерская"
                              | "Евро"
                              | "",
                          }))
                        }
                        className={`w-full ${
                          formData.renovation === r ? activeButtonClass : baseButtonClass
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Лифты - Пассажирский:</label>
                <input
                  type="number"
                  name="liftsPassenger"
                  value={formData.liftsPassenger}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      liftsPassenger: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Лифты - Грузовой:</label>
                <input
                  type="number"
                  name="liftsFreight"
                  value={formData.liftsFreight}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      liftsFreight: Number(e.target.value),
                    }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Парковка:</label>
                <div className="mt-4">
                  {["Подземная", "Многоуровневая", "Наземная"].map((p) => {
                    const selected = formData.parking.includes(p);
                    return (
                      <label key={p} className="mr-4">
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            const newParking = selected
                              ? formData.parking.filter((v) => v !== p)
                              : [...formData.parking, p];
                            setFormData((prev) => ({
                              ...prev,
                              parking: newParking,
                            }));
                          }}
                        />
                        {p}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className={sectionClass}>
            <h2 className={subheadingClass}>В квартире есть</h2>
            <div className="space-y-8">
              {/* Мебель */}
              <div>
                <label className={labelClass}>Мебель</label>
                <div className={buttonGroupClass}>
                  {["Без мебели", "В комнатах", "На кухне"].map((option) => {
                    const isSelected = formData.furniture.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          const newFurniture = isSelected
                            ? formData.furniture.filter(f => f !== option)
                            : [...formData.furniture, option];
                          setFormData(prev => ({ ...prev, furniture: newFurniture }));
                        }}
                        className={`w-full ${
                          isSelected ? activeButtonClass : baseButtonClass
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Техника */}
              <div>
                <label className={labelClass}>Техника</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Кондиционер",
                    "Холодильник",
                    "Телевизор",
                    "Посудомоечная машина",
                    "Стиральная машина",
                    "Микроволновка"
                  ].map((appliance) => {
                    const isSelected = formData.appliances.includes(appliance);
                    return (
                      <button
                        key={appliance}
                        type="button"
                        onClick={() => {
                          const newAppliances = isSelected
                            ? formData.appliances.filter(a => a !== appliance)
                            : [...formData.appliances, appliance];
                          setFormData(prev => ({ ...prev, appliances: newAppliances }));
                        }}
                        className={`w-full ${
                          isSelected ? activeButtonClass : baseButtonClass
                        }`}
                      >
                        {appliance}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Связь */}
              <div>
                <label className={labelClass}>Связь</label>
                <div className={buttonGroupClass}>
                  {["Интернет", "Телефон"].map((option) => {
                    const isSelected = formData.connectivity.includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          const newConnectivity = isSelected
                            ? formData.connectivity.filter(c => c !== option)
                            : [...formData.connectivity, option];
                          setFormData(prev => ({ ...prev, connectivity: newConnectivity }));
                        }}
                        className={`w-full ${
                          isSelected ? activeButtonClass : baseButtonClass
                        }`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className={sectionClass}>
            <h2 className={subheadingClass}>Описание квартиры</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Заголовок:</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Описание:</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className={inputClass}
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className={sectionClass}>
            <h2 className={subheadingClass}>Цена и условия аренды</h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>Аренда в месяц:</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Предоплата:</label>
                <div className="mt-4">
                  {["нет", "За 1 месяц", "За 2 месяца", "За 3 месяца", "За 4+ месяцев"].map((pp) => (
                    <button
                      type="button"
                      key={pp}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, prepayment: pp }))
                      }
                      className={`w-full ${
                        formData.prepayment === pp ? activeButtonClass : baseButtonClass
                      }`}
                    >
                      {pp}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Залог:</label>
                <input
                  type="number"
                  name="deposit"
                  value={formData.deposit}
                  onChange={handleInputChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Условия проживания:</label>
                <div className="mt-4">
                  {["Можно с детьми", "Можно с домашними животными"].map((cond) => (
                    <label key={cond} className="mr-4">
                      <input
                        type="checkbox"
                        checked={formData.livingConditions.includes(cond)}
                        onChange={() => {
                          const newConds = formData.livingConditions.includes(cond)
                            ? formData.livingConditions.filter((c) => c !== cond)
                            : [...formData.livingConditions, cond];
                          setFormData((prev) => ({
                            ...prev,
                            livingConditions: newConds,
                          }));
                        }}
                      />
                      {cond}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Кто сдает:</label>
                <div className="mt-4">
                  <div className={buttonGroupClass}>
                    {["Собственник", "Риелтор"].map((ownerType) => (
                      <button
                        type="button"
                        key={ownerType}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            whoRents: ownerType as "Собственник" | "Риелтор" | "",
                          }))
                        }
                        className={`w-full ${
                          formData.whoRents === ownerType ? activeButtonClass : baseButtonClass
                        }`}
                      >
                        {ownerType}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className={labelClass}>Контакты арендодателя:</label>
                <input
                  type="text"
                  name="landlordContact"
                  placeholder="+992774447717"
                  value={formData.landlordContact}
                  onChange={handleInputChange}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Способ связи:</label>
                <div className="mt-4">
                  {["Звонки", "Чат"].map((method) => (
                    <label key={method} className="mr-4">
                      <input
                        type="checkbox"
                        checked={formData.contactMethod.includes(method)}
                        onChange={() => {
                          const newMethods = formData.contactMethod.includes(method)
                            ? formData.contactMethod.filter((m) => m !== method)
                            : [...formData.contactMethod, method];
                          setFormData((prev) => ({
                            ...prev,
                            contactMethod: newMethods,
                          }));
                        }}
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <div>Неизвестный шаг</div>;
    }
  };

  return renderStepContent();
}
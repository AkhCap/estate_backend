"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "../../lib/axios";

interface CreatePropertyForm {
  title: string;
  description: string;
  price: number;
  address: string;
  rooms: number;
  area: number;
  property_type: string;
  deal_type: string;
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreatePropertyForm>({
    title: "",
    description: "",
    price: 0,
    address: "",
    rooms: 1,
    area: 30,
    property_type: "квартира",
    deal_type: "sale",
  });

  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // 1. Создаём объявление
      const createRes = await axios.post("/properties/", formData);
      const createdProperty = createRes.data;
      console.log("Создано объявление:", createdProperty);

      const propertyId = createdProperty.id;

      // 2. Если есть файлы — загружаем их
      if (files && files.length > 0) {
        const formDataFiles = new FormData();
        // Добавляем все файлы в FormData
        Array.from(files).forEach((file) => {
          formDataFiles.append("files", file);
        });

        // Вызываем эндпоинт /properties/{property_id}/upload-images
        await axios.post(`/properties/${propertyId}/upload-images`, formDataFiles, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      // После успеха — переходим, например, на список объявлений
      router.push("/properties");
    } catch (err: any) {
      console.error("Ошибка при создании объявления:", err);
      setError("Не удалось создать объявление");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Создать новое объявление</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleCreateProperty} className="space-y-4">
        <div>
          <label className="block font-medium">Заголовок:</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Описание:</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Цена:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Комнат:</label>
          <input
            type="number"
            name="rooms"
            value={formData.rooms}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Площадь (м²):</label>
          <input
            type="number"
            name="area"
            value={formData.area}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Адрес:</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-medium">Тип недвижимости:</label>
          <select
            name="property_type"
            value={formData.property_type}
            onChange={handleInputChange}
            className="border p-2 w-full"
          >
            <option value="квартира">Квартира</option>
            <option value="дом">Дом</option>
            <option value="комната">Комната</option>
          </select>
        </div>
        <div>
          <label className="block font-medium">Тип сделки:</label>
          <select
            name="deal_type"
            value={formData.deal_type}
            onChange={handleInputChange}
            className="border p-2 w-full"
          >
            <option value="sale">Продажа</option>
            <option value="rent">Аренда</option>
          </select>
        </div>

        {/* Блок для загрузки фотографий */}
        <div>
          <label className="block font-medium">Фотографии:</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="border p-2 w-full"
          />
          <p className="text-sm text-gray-500">Можно выбрать несколько файлов</p>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Создать объявление
        </button>
      </form>
    </div>
  );
}
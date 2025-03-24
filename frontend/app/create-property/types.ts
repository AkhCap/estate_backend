export interface PropertyFormData {
  deal_type: "Аренда" | "Продажа";
  rent_duration?: "Долгосрочная" | "Посуточная";
  main_category?: "Жилая" | "Коммерческая" | "";
  sub_category?: string;
  address: string;
  apartmentNumber: string;
  rooms: string;
  area: number;
  ceilingHeight: number;
  floor: number | "Цокольный";
  totalFloors: number;
  photos: File[];
  existingPhotos?: Array<{
    id: number;
    url: string;
  }>;
  propertyCondition: "Вторичка" | "Новостройка" | "";
  hasBalcony: boolean;
  windowView: string[];
  bathroom: "Разделенный" | "Совмещенный" | "";
  bathType: "Ванна" | "Душевая кабина" | "";
  heating: "Да" | "Нет" | "";
  renovation: "Черновая отделка" | "Коробка" | "Частичный ремонт" | "Чистовой ремонт" | "Ремонт по дизайн-проекту" | "Евро" | "";
  liftsPassenger: number;
  liftsFreight: number;
  parking: string[];
  furniture: string[];
  appliances: string[];
  connectivity: string[];
  description: string;
  title: string;
  price: number;
  prepayment: "нет" | "1 месяц" | "2 месяца" | "3 месяца" | "4+ месяца";
  deposit: number;
  livingConditions: string[];
  whoRents: "Собственник" | "Риелтор" | "";
  landlordContact: string;
  contactMethod: string[];
  buildYear: number;
  owner_id?: number;
}

export interface CreatePropertyPageProps {
  initialData?: PropertyFormData;
  isEditing?: boolean;
  propertyId?: string | string[];
} 
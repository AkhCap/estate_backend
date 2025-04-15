// Интерфейс для информации о недвижимости
export interface PropertyInfo {
  id: number;
  title: string;
  price: number;
  images?: Array<{ id: number; image_url: string }>;
  seller_name: string;
  seller_phone?: string;
  seller_email?: string;
  description: string;
  location: string;
  address?: string;
  bedrooms?: number;
  area?: number;
  created_at: string;
}

// Можно добавить сюда и другие общие типы, например Chat
// export interface Chat { ... } 
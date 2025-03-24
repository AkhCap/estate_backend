"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "../../../../lib/axios";
import CreatePropertyPage from "../../../create-property/page";
import { PropertyFormData } from "../../../create-property/types";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [initialData, setInitialData] = useState<PropertyFormData | null>(null);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const response = await axios.get(`/properties/${propertyId}`, {
          params: {
            is_detail_view: false
          }
        });
        console.log('Property response:', response.data);
        
        // Получаем существующие фотографии
        const photosResponse = await axios.get(`/properties/${propertyId}/images`);
        console.log('Raw photos response:', photosResponse);
        console.log('Photos response data:', photosResponse.data);
        
        const existingPhotos = photosResponse.data.map((photo: any) => {
          console.log('Raw photo object:', photo);
          console.log('Photo image_url:', photo.image_url);
          
          // Используем полный URL для изображений с учетом поддиректории properties
          const photoUrl = `http://localhost:8000/uploads/properties/${photo.image_url}`;
          console.log('Generated photo URL:', photoUrl);
          
          const photoObject = {
            id: photo.id,
            url: photoUrl
          };
          console.log('Created photo object:', photoObject);
          return photoObject;
        });
        
        console.log('Final existing photos array:', existingPhotos);

        const data: PropertyFormData = {
          deal_type: response.data.deal_type === "rent" ? "Аренда" : "Продажа",
          rent_duration: response.data.rent_duration,
          main_category: response.data.main_category || "",
          sub_category: response.data.property_type,
          address: response.data.address,
          apartmentNumber: response.data.apartment_number,
          rooms: response.data.rooms,
          area: response.data.area,
          ceilingHeight: response.data.ceiling_height,
          floor: response.data.floor,
          totalFloors: response.data.total_floors,
          photos: [],
          existingPhotos: existingPhotos,
          propertyCondition: response.data.property_condition || "",
          hasBalcony: response.data.has_balcony,
          windowView: response.data.window_view || [],
          bathroom: response.data.bathroom || "",
          bathType: response.data.bath_type || "",
          heating: response.data.heating || "",
          renovation: response.data.renovation || "",
          liftsPassenger: response.data.lifts_passenger,
          liftsFreight: response.data.lifts_freight,
          parking: response.data.parking || [],
          furniture: response.data.furniture || [],
          appliances: response.data.appliances || [],
          connectivity: response.data.connectivity || [],
          description: response.data.description,
          title: response.data.title,
          price: response.data.price,
          prepayment: response.data.prepayment || "нет",
          deposit: response.data.deposit || 0,
          livingConditions: response.data.living_conditions || [],
          whoRents: response.data.who_rents || "",
          landlordContact: response.data.landlord_contact,
          contactMethod: response.data.contact_method || [],
          buildYear: response.data.build_year,
          owner_id: response.data.owner_id
        };
        console.log('Initial data with photos:', data);
        setInitialData(data);
      } catch (err: any) {
        console.error('Error fetching property:', err);
        console.error('Error response:', err.response);
        setError(err.response?.data?.detail || "Ошибка при загрузке объявления");
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchProperty();
    }
  }, [propertyId]);

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

  if (!initialData) {
    return null;
  }

  return <CreatePropertyPage initialData={initialData} isEditing={true} propertyId={propertyId} />;
} 
import React, { useCallback } from 'react';
import { FaImages } from 'react-icons/fa';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface ExistingPhoto {
  id: number;
  url: string;
}

interface PhotoUploadProps {
  onUpload: (files: File[]) => void;
  photos: File[];
  onDelete: (index: number) => void;
  existingPhotos?: ExistingPhoto[];
  onExistingPhotoDelete?: (photoId: number) => void;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  onUpload, 
  photos, 
  onDelete,
  existingPhotos = [],
  onExistingPhotoDelete
}) => {
  console.log('PhotoUpload render - all props:', {
    photosCount: photos.length,
    existingPhotosCount: existingPhotos.length,
    hasDeleteHandler: !!onExistingPhotoDelete
  });
  console.log('Existing photos array:', existingPhotos);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onUpload(Array.from(event.target.files));
    }
  }, [onUpload]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FaImages className="w-5 h-5 text-gray-500 mt-0.5" />
          <p className="text-sm text-gray-600">
            На фото не должно быть людей, животных, алкоголя, табака, оружия. Не добавляйте чужие фото, картинки с водяными знаками и рекламу.
          </p>
        </div>
      </div>

      {existingPhotos && existingPhotos.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Существующие фотографии</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingPhotos.map((photo) => {
              console.log('Rendering existing photo:', photo);
              return (
                <div key={photo.id} className="relative group">
                  <div className="w-full h-48 relative">
                    <Image
                      src={photo.url}
                      alt={`Photo ${photo.id}`}
                      fill
                      className="object-cover rounded-lg border border-gray-200"
                      unoptimized
                      onError={(e) => {
                        console.error('Error loading image:', photo.url);
                        console.error('Error event:', e);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', photo.url);
                      }}
                    />
                  </div>
                  {onExistingPhotoDelete && (
                    <button
                      onClick={() => onExistingPhotoDelete(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-all duration-200">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="photo-upload"
        />
        <label 
          htmlFor="photo-upload" 
          className="cursor-pointer flex flex-col items-center"
        >
          <FaImages className="w-12 h-12 text-gray-400 mb-4" />
          <span className="text-blue-600 font-medium">Добавить фото</span>
        </label>
      </div>

      {photos.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Новые фотографии</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((file, index) => (
              <div key={index} className="relative group">
                <div className="w-full h-48 relative">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover rounded-lg border border-gray-200"
                    unoptimized
                  />
                </div>
                <button
                  onClick={() => onDelete(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload; 
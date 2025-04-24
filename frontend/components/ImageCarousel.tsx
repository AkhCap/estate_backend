"use client";
import { useState } from "react";
import { FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";

interface ImageCarouselProps {
  images: string[];
  altPrefix?: string; // Необязательный проп для формирования alt-текста
  initialImageIndex?: number; // Начальный индекс изображения
}

export default function ImageCarousel({ images, altPrefix = "Фото", initialImageIndex = 0 }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialImageIndex);
  const [showLightbox, setShowLightbox] = useState(false);

  // Если массив пустой — показываем заглушку
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-2xl">
        <p className="text-gray-500">Нет фотографий</p>
      </div>
    );
  }

  // Кнопка «Назад»
  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Кнопка «Вперёд»
  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  // Текущее изображение
  const currentImage = images[currentIndex];

  return (
    <>
      <div className="relative w-full h-full">
        {/* Основное изображение */}
        <div 
          className="w-full h-full cursor-pointer"
          onClick={() => setShowLightbox(true)}
        >
          <img
            src={currentImage}
            alt={`${altPrefix} ${currentIndex + 1}`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Кнопки навигации */}
        <button
          onClick={handlePrev}
          className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        >
          <FaChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={handleNext}
          className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors"
        >
          <FaChevronRight className="w-5 h-5" />
        </button>

        {/* Индикатор слайда (1 / n) */}
        <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Лайтбокс */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setShowLightbox(false)}
          >
            <FaTimes size={24} />
          </button>
          
          <div className="relative max-w-7xl w-full h-full p-4 flex items-center justify-center">
            <img
              src={currentImage}
              alt={`${altPrefix} ${currentIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Кнопки навигации в лайтбоксе */}
            {currentIndex > 0 && (
              <button
                onClick={(e) => handlePrev(e)}
                className="absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <FaChevronLeft className="text-white text-xl" />
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button
                onClick={(e) => handleNext(e)}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              >
                <FaChevronRight className="text-white text-xl" />
              </button>
            )}

            {/* Индикатор в лайтбоксе */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
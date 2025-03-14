"use client";
import { useState } from "react";

interface ImageCarouselProps {
  images: string[];
  altPrefix?: string; // Необязательный проп для формирования alt-текста
}

export default function ImageCarousel({ images, altPrefix = "Фото" }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Если массив пустой — показываем заглушку
  if (!images || images.length === 0) {
    return (
      <div style={{ width: "300px", height: "200px", borderRadius: "8px", background: "#ccc" }}>
        Нет фотографий
      </div>
    );
  }

  // Кнопка «Назад»
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Кнопка «Вперёд»
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  // Текущее изображение
  const currentImage = images[currentIndex];

  return (
    <div style={{ width: "300px", position: "relative" }}>
      {/* Само изображение */}
      <img
        src={currentImage}
        alt={`${altPrefix} ${currentIndex + 1}`}
        style={{
          width: "300px",
          height: "200px",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />

      {/* Кнопка «Назад» */}
      <button
        onClick={handlePrev}
        style={{
          position: "absolute",
          top: "50%",
          left: "10px",
          transform: "translateY(-50%)",
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "8px",
        }}
      >
        {"<"}
      </button>

      {/* Кнопка «Вперёд» */}
      <button
        onClick={handleNext}
        style={{
          position: "absolute",
          top: "50%",
          right: "10px",
          transform: "translateY(-50%)",
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          padding: "8px",
        }}
      >
        {">"}
      </button>

      {/* Индикатор слайда (1 / n) */}
      <div
        style={{
          position: "absolute",
          bottom: "5px",
          right: "10px",
          background: "rgba(0,0,0,0.5)",
          color: "#fff",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "0.875rem",
        }}
      >
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
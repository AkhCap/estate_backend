// frontend/app/components/Footer.tsx
"use client";
export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
      <p>© {new Date().getFullYear()} Estate. Все права защищены.</p>
    </footer>
  );
}
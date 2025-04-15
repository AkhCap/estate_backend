"use client";

import { usePathname, useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Проверяем, нужно ли показывать кнопку "Назад"
  const showBackButton = [
    "/profile/properties",
    "/profile/favorites",
    "/profile/history"
  ].includes(pathname);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-20">
        <main>
          {showBackButton && (
            <button
              onClick={() => router.push("/profile")}
              className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Вернуться в профиль</span>
            </button>
          )}
          <div className="bg-white rounded-2xl shadow-sm p-6 min-h-[calc(100vh-8rem)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 
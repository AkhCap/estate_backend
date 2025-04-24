// frontend/app/layout.tsx
// "use client"; // Убираем

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/global.css";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./context/AuthContext";
// Удаляем импорты framer-motion и usePathname
// import { motion, AnimatePresence } from "framer-motion";
// import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

// Раскомментируем Metadata
export const metadata: Metadata = {
  title: 'MANZIL',
  description: 'Find your dream home in Tajikistan',
};

// Удаляем константы анимаций
// const pageVariants = { ... };
// const pageTransition = { ... };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Удаляем usePathname
  // const pathname = usePathname();

  return (
    <html lang="ru">
      <body className={`${inter.className} bg-gray-50`}>
        <AuthProvider>
          <Navigation />
          {/* Возвращаем обычный main без анимаций */}
          {/* <AnimatePresence mode="wait"> */}
            <main
              // key={pathname} // Удаляем
              // initial="initial" // Удаляем
              // animate="in" // Удаляем
              // exit="out" // Удаляем
              // variants={pageVariants} // Удаляем
              // transition={pageTransition} // Удаляем
              className="pt-20"
            >
              {children}
            </main>
          {/* </AnimatePresence> */}
        </AuthProvider>
      </body>
    </html>
  );
}
// frontend/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/global.css";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Estate",
  description: "Платформа для поиска недвижимости",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <Navigation />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
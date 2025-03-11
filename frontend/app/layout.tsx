// frontend/app/layout.tsx
import "../styles/global.css"; // Подключаем глобальные стили

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        {children}
      </body>
    </html>
  );
}
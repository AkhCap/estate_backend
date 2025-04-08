/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      // <<< Удаляем кастомную анимацию >>>
      // keyframes: {
      //   slowPanZoom: {
      //     '0%, 100%': { 
      //       backgroundPosition: '0% 0%', 
      //       transform: 'scale(1)' 
      //     },
      //     '50%': { 
      //       backgroundPosition: '100% 100%', 
      //       transform: 'scale(1.05)' 
      //     },
      //   }
      // },
      // animation: {
      //   slowPanZoom: 'slowPanZoom 40s ease-in-out infinite alternate',
      // }
      // <<< Конец удаления >>>
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Добавляем плагин для кастомных scrollbar (если используется)
    // require('tailwind-scrollbar'), 
  ],
}; 
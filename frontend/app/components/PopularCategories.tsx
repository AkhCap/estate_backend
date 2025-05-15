"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FaHome, FaBuilding, FaStore, FaWarehouse, FaParking, FaLandmark } from "react-icons/fa";

const categories = [
  {
    id: 1,
    title: "Квартиры",
    icon: FaHome,
    description: "Апартаменты и квартиры",
    link: "/properties?type=apartment",
    color: "from-blue-500 to-blue-600"
  },
  {
    id: 2,
    title: "Дома",
    icon: FaBuilding,
    description: "Частные дома и коттеджи",
    link: "/properties?type=house",
    color: "from-green-500 to-green-600"
  },
  {
    id: 3,
    title: "Коммерческая",
    icon: FaStore,
    description: "Офисы и магазины",
    link: "/properties?type=commercial",
    color: "from-purple-500 to-purple-600"
  },
  {
    id: 4,
    title: "Склады",
    icon: FaWarehouse,
    description: "Складские помещения",
    link: "/properties?type=warehouse",
    color: "from-orange-500 to-orange-600"
  },
  {
    id: 5,
    title: "Гаражи и парковки",
    icon: FaParking,
    description: "Гаражи и парковочные места",
    link: "/properties?type=parking",
    color: "from-red-500 to-red-600"
  },
  {
    id: 6,
    title: "Участки",
    icon: FaLandmark,
    description: "Земельные участки",
    link: "/properties?type=land",
    color: "from-yellow-500 to-yellow-600"
  }
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: "easeOut"
    }
  }),
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

export default function PopularCategories() {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Популярные категории
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Выберите интересующий вас тип недвижимости и найдите идеальный вариант
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              whileHover="hover"
              viewport={{ once: true }}
              className="group bg-white rounded-xl shadow hover:shadow-md transition-all duration-200 p-2 flex flex-col items-center text-center h-full"
            >
              <Link href={category.link} className="flex flex-col items-center w-full h-full">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg mb-1 bg-gray-50 group-hover:bg-blue-50 transition-colors">
                  <category.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-0.5">
                  {category.title}
                </h3>
                <p className="text-gray-500 text-[11px] mb-2 flex-1">
                  {category.description}
                </p>
                <span className="inline-flex items-center text-blue-600 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  Смотреть
                  <svg
                    className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
} 
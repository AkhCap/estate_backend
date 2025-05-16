import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaHome } from 'react-icons/fa';

const districts = [
    {
        name: 'Исмоили Сомони',
        image: '/illustrations/centr svyazi.png',
        properties: 120,
        description: 'Центральный район с развитой инфраструктурой'
    },
    {
        name: 'Сино',
        image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2070',
        properties: 85,
        description: 'Современный развивающийся район'
    },
    {
        name: 'Фирдавси',
        image: 'https://images.unsplash.com/photo-1545241047-6083a3684587?q=80&w=2070',
        properties: 95,
        description: 'Тихий район с хорошей экологией'
    },
    {
        name: 'Шохмансур',
        image: 'https://images.unsplash.com/photo-1580041065738-e72023775cdc?q=80&w=2070',
        properties: 75,
        description: 'Исторический район с богатым наследием'
    }
];

export default function PopularDistricts() {
    return (
        <motion.section 
            className="py-16 bg-white"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.h2 
                    className="text-3xl font-bold text-gray-900 mb-8 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                    Популярные районы
                </motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                    {districts.map((district, index) => (
                        <Link
                            key={district.name}
                            href={`/properties?district=${encodeURIComponent(district.name)}`}
                            className="w-full"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: index * 0.1, ease: 'easeOut' }}
                                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer w-full border border-gray-100"
                            >
                                <div className="relative h-48 bg-white flex items-center justify-center rounded-t-2xl overflow-hidden">
                                    <Image
                                        src={district.image}
                                        alt={district.name}
                                        fill
                                        priority={index === 0}
                                        className="object-contain"
                                    />
                                </div>
                                <div className="px-4 py-3 flex flex-col items-start gap-1">
                                    <h3 className="text-base font-bold text-gray-900 mb-1 truncate w-full">{district.name}</h3>
                                    <div className="flex items-center gap-1 text-blue-600 text-xs font-medium mb-1">
                                        <FaHome className="w-4 h-4" />
                                        <span>{district.properties} объектов</span>
                                    </div>
                                    <p className="text-xs text-gray-500 leading-snug line-clamp-2 min-h-[32px]">{district.description}</p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </motion.section>
    );
} 
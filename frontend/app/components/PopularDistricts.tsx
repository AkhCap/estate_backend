import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const districts = [
    {
        name: 'Исмоили Сомони',
        image: 'https://images.unsplash.com/photo-1582653291997-079a1c04e5a1?q=80&w=2070',
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
                    className="text-3xl font-bold text-gray-900 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                    Популярные районы
                </motion.h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {districts.map((district, index) => (
                        <motion.div
                            key={district.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="relative h-48">
                                <Image
                                    src={district.image}
                                    alt={district.name}
                                    fill
                                    priority={index === 0}
                                    className="object-cover"
                                />
                            </div>
                            <div className="p-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{district.name}</h3>
                                <p className="text-gray-600 mb-3">{district.description}</p>
                                <div className="flex items-center text-emerald-600">
                                    <span className="font-medium">{district.properties}</span>
                                    <span className="ml-2 text-sm">объектов</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
} 
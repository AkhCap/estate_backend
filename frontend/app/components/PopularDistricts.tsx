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
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900">Районы Душанбе</h2>
                    <p className="mt-4 text-lg text-gray-600">Исследуйте все районы столицы и найдите свой идеальный дом</p>
                </div>
                
                <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {districts.map((district, index) => (
                        <motion.div
                            key={district.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.2 }}
                            className="group relative overflow-hidden rounded-2xl shadow-lg"
                            whileHover={{ 
                                scale: 1.03,
                                transition: { duration: 0.2 }
                            }}
                        >
                            <Link href={`/search?district=${encodeURIComponent(district.name)}`}>
                                <div className="relative h-72 w-full">
                                    <Image
                                        src={district.image}
                                        alt={district.name}
                                        fill
                                        className="object-cover transition-transform duration-300 hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <h3 className="text-xl font-semibold">{district.name}</h3>
                                        <p className="text-sm opacity-90 mt-1">{district.description}</p>
                                        <p className="text-sm mt-2 font-medium">
                                            <span className="bg-white/20 px-2 py-1 rounded-full">
                                                {district.properties} объектов
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
} 
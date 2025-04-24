import { useState } from 'react';
import { FaMapMarkerAlt, FaFilter } from 'react-icons/fa';

const SearchHero = () => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#19376D] to-[#19376D]/90" />
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
                        Найди свой идеальный дом
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-100 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Исследуй тысячи предложений недвижимости легко и удобно.
                    </p>
                </div>

                {/* Search Form */}
                <div className="mt-10 max-w-4xl mx-auto">
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5">
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Город, район, улица..."
                                        className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-300 focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <select className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all">
                                    <option className="text-gray-900">Любой тип</option>
                                    <option className="text-gray-900">Квартира</option>
                                    <option className="text-gray-900">Дом</option>
                                    <option className="text-gray-900">Коммерческая</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <select className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-white/30 focus:ring-2 focus:ring-white/20 transition-all">
                                    <option className="text-gray-900">Любое</option>
                                    <option className="text-gray-900">Продажа</option>
                                    <option className="text-gray-900">Аренда</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <button className="w-full py-3 px-4 bg-white hover:bg-white/90 text-[#19376D] font-semibold rounded-lg transition-all transform hover:scale-105">
                                    Найти
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-white hover:text-white/80 flex items-center gap-2 text-sm font-medium"
                            >
                                <FaFilter className="w-4 h-4" />
                                Больше фильтров
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchHero; 
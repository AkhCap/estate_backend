import { useState } from 'react';
import { FaMapMarkerAlt, FaFilter } from 'react-icons/fa';

const SearchHero = () => {
    const [showFilters, setShowFilters] = useState(false);

    return (
        <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                        Найди свой идеальный дом
                    </h1>
                    <p className="mt-3 max-w-md mx-auto text-base text-gray-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                        Исследуй тысячи предложений недвижимости легко и удобно.
                    </p>
                </div>

                {/* Search Form */}
                <div className="mt-10 max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-5">
                                <div className="relative">
                                    <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Город, район, улица..."
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                    <option className="text-gray-900">Любой тип</option>
                                    <option className="text-gray-900">Квартира</option>
                                    <option className="text-gray-900">Дом</option>
                                    <option className="text-gray-900">Коммерческая</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all">
                                    <option className="text-gray-900">Любое</option>
                                    <option className="text-gray-900">Продажа</option>
                                    <option className="text-gray-900">Аренда</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <button className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105">
                                    Найти
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className="text-gray-600 hover:text-gray-900 flex items-center gap-2 text-sm font-medium transition-colors"
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
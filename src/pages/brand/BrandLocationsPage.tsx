import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Store,
    MapPin,
    Users,
    ShoppingCart,
    Package
} from 'lucide-react';
import api from '../../config/api';

interface Brand {
    id: string;
    name: string;
    ownerPosId: string;
    establishments: {
        id: string;
        name: string;
        type: string;
        currency: string;
    }[];
}

interface LocationStats {
    id: string;
    name: string;
    type: string;
    currency: string;
    subscriptionStatus: string;
    employeeCount: number;
    orderCount: number;
    itemCount: number;
}

export function BrandLocationsPage() {
    const { brandId } = useParams<{ brandId: string }>();
    const context = useOutletContext<{ brand: Brand | null }>();
    const { setCurrentEstablishment } = useAuth();
    const brand = context?.brand;

    const [locations, setLocations] = useState<LocationStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (brandId) {
            fetchLocations();
        }
    }, [brandId]);

    const fetchLocations = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/brands/${brandId}`);
            if (response.data?.establishments) {
                setLocations(response.data.establishments);
            }
        } catch (err) {
            console.error('Failed to fetch locations:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return 'bg-green-500/10 text-green-500';
            case 'TRIAL':
                return 'bg-blue-500/10 text-blue-500';
            case 'EXPIRED':
                return 'bg-red-500/10 text-red-500';
            default:
                return 'bg-gray-500/10 text-gray-500';
        }
    };

    const handleLocationClick = (loc: any) => {
        // Set as current establishment and open dashboard in NEW TAB
        const establishment = {
            id: loc.id,
            name: loc.name,
            type: loc.type,
            currency: loc.currency,
            subscriptionStatus: loc.subscriptionStatus || 'ACTIVE'
        };

        setCurrentEstablishment(establishment);
        localStorage.setItem('selectedEstablishmentId', loc.id);
        window.open('/dashboard', '_blank');
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/20">
                            <MapPin size={32} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Brand Locations</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {brand?.establishments.length || 0} establishments under {brand?.name}
                            </p>
                        </div>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                    <Store size={20} className="text-paymint-green" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">{locations.length}</p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Locations</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <Users size={20} className="text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                                        {locations.reduce((sum, l) => sum + (l.employeeCount || 0), 0)}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Staff</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Package size={20} className="text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                                        {locations.reduce((sum, l) => sum + (l.itemCount || 0), 0)}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Products</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <ShoppingCart size={20} className="text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                                        {locations.reduce((sum, l) => sum + (l.orderCount || 0), 0)}
                                    </p>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Orders</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Locations Grid */}
            <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl border border-gray-200 dark:border-white/5 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                        <Store size={20} className="text-paymint-green" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900 dark:text-white">All Locations</h2>
                        <p className="text-xs text-gray-500">Detailed view of each establishment</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-10 h-10 border-4 border-paymint-green border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : locations.length === 0 ? (
                    <div className="text-center py-16">
                        <Store size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500">No locations found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {locations.map((location, index) => (
                            <motion.div
                                key={location.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => handleLocationClick(location)}
                                className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-paymint-green/50 transition-all group cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-paymint-green to-emerald-500 flex items-center justify-center shadow-lg shadow-paymint-green/20">
                                            <Store size={20} className="text-black" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-gray-900 dark:text-white">{location.name}</h3>
                                            <p className="text-xs text-gray-500 uppercase">{location.type}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${getStatusColor(location.subscriptionStatus)}`}>
                                        {location.subscriptionStatus}
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    <div className="text-center p-3 bg-white dark:bg-black/20 rounded-xl">
                                        <p className="text-lg font-black text-gray-900 dark:text-white">{location.employeeCount || 0}</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Staff</p>
                                    </div>
                                    <div className="text-center p-3 bg-white dark:bg-black/20 rounded-xl">
                                        <p className="text-lg font-black text-gray-900 dark:text-white">{location.itemCount || 0}</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Products</p>
                                    </div>
                                    <div className="text-center p-3 bg-white dark:bg-black/20 rounded-xl">
                                        <p className="text-lg font-black text-gray-900 dark:text-white">{location.orderCount || 0}</p>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase">Orders</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100 dark:border-white/5">
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-lg font-bold text-gray-500">{location.currency}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

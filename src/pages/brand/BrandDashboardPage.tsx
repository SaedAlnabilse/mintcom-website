import { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import {
    Building2,
    Store,
    Users,
    DollarSign,
    ShoppingCart,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    Clock,
    BarChart3,
    Hash
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

interface BrandStats {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalEmployees: number;
    revenueChange: number;
    ordersChange: number;
}

interface LocationPerformance {
    id: string;
    name: string;
    type: string;
    currency: string;
    revenue: number;
    orders: number;
}

interface RecentActivity {
    id: string;
    type: string;
    location: string;
    amount: number;
    employee?: string;
    time: string;
}

export function BrandDashboardPage() {
    const { brandId } = useParams<{ brandId: string }>();
    const context = useOutletContext<{ brand: Brand | null }>();
    const { setCurrentEstablishment } = useAuth();
    const brand = context?.brand;

    const [stats, setStats] = useState<BrandStats>({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalEmployees: 0,
        revenueChange: 0,
        ordersChange: 0
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [locationPerformance, setLocationPerformance] = useState<LocationPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (brandId) {
            fetchDashboardStats();
        }
    }, [brandId]);

    const fetchDashboardStats = async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/brands/${brandId}/dashboard-stats`);
            if (response.data) {
                setStats(response.data.stats);
                setRecentActivity(response.data.recentActivity?.map((a: any) => ({
                    ...a,
                    time: formatTimeAgo(new Date(a.time))
                })) || []);
                setLocationPerformance(response.data.locationPerformance || []);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard stats:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
        return `${Math.floor(diff / 86400)} days ago`;
    };

    const handleLocationClick = (loc: { id: string; name: string; type: string; currency: string }) => {
        // Set as current establishment and open dashboard in NEW TAB
        const establishment = {
            id: loc.id,
            name: loc.name,
            type: loc.type,
            currency: loc.currency,
            subscriptionStatus: 'ACTIVE' // Default for now
        };

        setCurrentEstablishment(establishment);
        localStorage.setItem('selectedEstablishmentId', loc.id);
        window.open('/dashboard', '_blank');
    };

    return (
        <div className="space-y-8">
            {/* Header - Green Theme */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/20">
                            <Building2 size={32} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{brand?.name || 'Brand'} Dashboard</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <Hash size={14} className="text-gray-400" />
                                <code className="text-sm font-mono text-gray-500 dark:text-gray-400">{brand?.ownerPosId}</code>
                                <span className="px-2 py-0.5 bg-paymint-green/20 rounded-full text-xs font-bold text-paymint-green">
                                    {brand?.establishments.length} Locations
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                    <DollarSign size={20} className="text-paymint-green" />
                                </div>
                                {stats.revenueChange !== 0 && (
                                    <div className={`flex items-center gap-1 text-xs font-bold ${stats.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stats.revenueChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {Math.abs(stats.revenueChange)}%
                                    </div>
                                )}
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">${stats.totalRevenue.toLocaleString()}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue</p>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                    <ShoppingCart size={20} className="text-blue-500" />
                                </div>
                                {stats.ordersChange !== 0 && (
                                    <div className={`flex items-center gap-1 text-xs font-bold ${stats.ordersChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {stats.ordersChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                        {Math.abs(stats.ordersChange)}%
                                    </div>
                                )}
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalOrders.toLocaleString()}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Orders</p>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                                    <Package size={20} className="text-purple-500" />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalProducts}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Products</p>
                        </div>

                        <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-gray-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                    <Users size={20} className="text-orange-500" />
                                </div>
                            </div>
                            <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalEmployees}</p>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Team Members</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Location Performance */}
                <div className="lg:col-span-2 bg-white dark:bg-[#0A0A0A] rounded-3xl border border-gray-200 dark:border-white/5 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                <BarChart3 size={20} className="text-paymint-green" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-gray-900 dark:text-white">Location Performance</h2>
                                <p className="text-xs text-gray-500">Revenue by establishment</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-4 border-paymint-green border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : locationPerformance.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No data available yet</p>
                        ) : (
                            locationPerformance.map((location, index) => (
                                <motion.div
                                    key={location.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleLocationClick(location)}
                                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl cursor-pointer hover:border-paymint-green/30 border border-transparent transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-paymint-green to-emerald-500 flex items-center justify-center text-black font-black">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900 dark:text-white">{location.name}</p>
                                        <p className="text-xs text-gray-500">{location.orders} orders</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900 dark:text-white">${location.revenue.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">{location.currency}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl border border-gray-200 dark:border-white/5 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/10 flex items-center justify-center">
                            <Clock size={20} className="text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Recent Activity</h2>
                            <p className="text-xs text-gray-500">Across all locations</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="w-8 h-8 border-4 border-paymint-green border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : recentActivity.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No recent activity</p>
                        ) : (
                            recentActivity.map((activity, index) => (
                                <motion.div
                                    key={activity.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl"
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-500/10">
                                        <DollarSign size={14} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            ${activity.amount?.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500">{activity.location}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">{activity.time}</span>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Locations Grid */}
            <div className="bg-white dark:bg-[#0A0A0A] rounded-3xl border border-gray-200 dark:border-white/5 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                            <Store size={20} className="text-paymint-green" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-gray-900 dark:text-white">Brand Locations</h2>
                            <p className="text-xs text-gray-500">{brand?.establishments.length} establishments under this brand</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {brand?.establishments.map((est, index) => (
                        <motion.div
                            key={est.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleLocationClick(est)}
                            className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 hover:border-paymint-green/50 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-paymint-green to-emerald-500 flex items-center justify-center">
                                    <Store size={18} className="text-black" />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">{est.name}</p>
                                    <p className="text-xs text-gray-500 uppercase">{est.type}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 rounded-lg font-bold text-gray-500">{est.currency}</span>
                                <span className="text-paymint-green font-bold group-hover:underline">View Details →</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

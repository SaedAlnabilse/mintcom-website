import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface OverviewStats {
    totalRevenue: number;
    revenueChange: number;
    activeLocations: number;
    totalBrands: number;
    totalEmployees: number;
}

export function OwnerOverviewPage() {
    const { establishments } = useAuth();
    const [stats, setStats] = useState<OverviewStats>({
        totalRevenue: 0,
        revenueChange: 0,
        activeLocations: 0,
        totalBrands: 0,
        totalEmployees: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchOverviewStats();
    }, []);

    const fetchOverviewStats = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/accounts/overview-stats');
            if (response.data) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Failed to fetch overview stats:', err);
            // Fallback to counting from local data
            setStats({
                totalRevenue: 0,
                revenueChange: 0,
                activeLocations: establishments.length,
                totalBrands: 1,
                totalEmployees: 0,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' JOD';
    };

    return (
        <div className="max-w-5xl">
            {/* Header */}
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
                            <TrendingUp size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Summary of all your locations</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Revenue */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm"
                >
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Total Revenue</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">All locations • Last 30 days</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {isLoading ? '...' : formatCurrency(stats.totalRevenue)}
                    </p>
                    {stats.revenueChange > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-paymint-green">
                            <TrendingUp size={14} />
                            <span className="text-sm font-medium">↑ {stats.revenueChange}% from last month</span>
                        </div>
                    )}
                </motion.div>

                {/* Active Locations */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm"
                >
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Active Locations</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Currently operational</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {isLoading ? '...' : stats.activeLocations}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Across {stats.totalBrands} Brand{stats.totalBrands !== 1 ? 's' : ''}
                    </p>
                </motion.div>

                {/* Total Employees */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm"
                >
                    <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Total Employees</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Active staff members</p>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {isLoading ? '...' : stats.totalEmployees}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

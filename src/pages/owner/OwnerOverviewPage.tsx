import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Store,
    Users,
    Building2,
    RefreshCw,
    Activity,
    Zap,
    Calendar,
    X,
    DollarSign,
    UserPlus
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface OverviewStats {
    totalRevenue: number;
    revenueChange: number;
    totalProfit: number;
    profitChange: number;
    activeLocations: number;
    totalBrands: number;
    totalEmployees: number;
    revenueByDay?: { name: string; value: number }[];
}

export function OwnerOverviewPage() {
    const navigate = useNavigate();
    const { establishments } = useAuth();
    const [stats, setStats] = useState<OverviewStats>({
        totalRevenue: 0,
        revenueChange: 0,
        totalProfit: 0,
        profitChange: 0,
        activeLocations: 1,
        totalBrands: 1,
        totalEmployees: 0,
        revenueByDay: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('today');
    const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);

    // Custom Date Picker State
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');

    // No longer need manual brands count fetch as it's included in overview-stats

    useEffect(() => {
        if (timeRange !== 'custom') {
            fetchOverviewStats();
        }
    }, [timeRange]);

    const fetchOverviewStats = async () => {
        try {
            setIsLoading(true);

            // Map UI filter IDs to API expected parameters
            let apiRange = timeRange;
            let query = '';

            if (timeRange === 'yesterday') {
                query = `?range=yesterday`;
            } else if (timeRange === 'custom' && customStartDate && customEndDate) {
                query = `?range=custom&startDate=${customStartDate}&endDate=${customEndDate}`;
            } else {
                if (timeRange === 'last_week') apiRange = '7d';
                if (timeRange === 'last_month') apiRange = '30d';
                if (timeRange === 'all_time') apiRange = 'all';
                query = `?range=${apiRange}`;
            }

            const response = await api.get(`/api/accounts/overview-stats${query}`);

            if (response.data) {
                setStats(response.data);
                setChartData(response.data.revenueByDay || []);
            } else {
                // Fallback / Mock for initial state if API is empty
                setStats({
                    totalRevenue: 0,
                    revenueChange: 0,
                    totalProfit: 0,
                    profitChange: 0,
                    activeLocations: establishments.length,
                    totalBrands: 0,
                    totalEmployees: 0,
                });
                setChartData([]);
            }

        } catch (err) {
            console.error('Failed to fetch overview stats:', err);
            // Non-blocking error handling for UI
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomDateApply = () => {
        if (customStartDate && customEndDate) {
            setTimeRange('custom');
            setShowDatePicker(false);
            fetchOverviewStats();
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'Usd',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const filterOptions = [
        { id: 'today', label: 'Today' },
        { id: 'yesterday', label: 'Yesterday' },
        { id: 'last_week', label: 'Last Week' },
        { id: 'last_month', label: 'Last Month' },
        { id: 'all_time', label: 'All Time' }
    ];

    const selectedFilterLabel = timeRange === 'custom'
        ? `${customStartDate} - ${customEndDate}`
        : filterOptions.find(f => f.id === timeRange)?.label || 'Custom Range';

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
                            Business Overview
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <Activity size={14} className="text-emerald-500" />
                            System Active
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Monitoring {establishments.length} locations and {stats.totalBrands} brands.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchOverviewStats}
                        className="p-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                        title="Refresh Data"
                    >
                        <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowDatePicker(!showDatePicker)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold tracking-wide border transition-all ${showDatePicker
                                ? 'bg-paymint-green text-black border-paymint-green'
                                : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                                }`}
                        >
                            <Calendar size={16} />
                            <span className="flex items-center gap-2">
                                <span>{selectedFilterLabel}</span>
                                {timeRange !== 'today' && (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] ${showDatePicker
                                        ? 'bg-black/20 text-black'
                                        : 'bg-paymint-green/20 text-paymint-green'
                                        }`}>
                                        Active
                                    </span>
                                )}
                            </span>
                        </button>

                        <AnimatePresence>
                            {showDatePicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/10 shadow-xl z-50 p-4"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">Select Period</h4>
                                        <button onClick={() => setShowDatePicker(false)}>
                                            <X size={16} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4">
                                        {filterOptions.map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => {
                                                    setTimeRange(opt.id);
                                                    setShowDatePicker(false);
                                                }}
                                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${timeRange === opt.id
                                                    ? 'bg-paymint-green/20 text-paymint-green'
                                                    : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] font-bold text-gray-400">Custom Range</p>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-paymint-green"
                                        />
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-paymint-green"
                                        />
                                        <button
                                            onClick={handleCustomDateApply}
                                            disabled={!customStartDate || !customEndDate}
                                            className="w-full py-2.5 rounded-lg bg-paymint-green text-black text-xs font-bold tracking-wide hover:bg-emerald-400 transition-all disabled:opacity-50"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Kpi Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    {
                        label: 'Total Sales',
                        value: formatCurrency(stats.totalRevenue),
                        change: stats.revenueChange,
                        icon: DollarSign,
                        color: 'text-emerald-500',
                        bg: 'bg-emerald-500/10',
                        hideChange: true
                    },
                    {
                        label: 'Total Profit',
                        value: formatCurrency(stats.totalProfit),
                        change: stats.profitChange,
                        icon: TrendingUp,
                        color: 'text-paymint-green',
                        bg: 'bg-paymint-green/10',
                        hideChange: true
                    },
                    {
                        label: 'Active Locations',
                        value: stats.activeLocations,
                        sub: 'Open',
                        icon: Store,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10'
                    },
                    {
                        label: 'Brands',
                        value: stats.totalBrands,
                        sub: 'Managed',
                        icon: Building2,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/10'
                    },
                    {
                        label: 'Total Staff',
                        value: stats.totalEmployees || '-',
                        sub: 'Total',
                        icon: Users,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/10'
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon size={24} />
                                </div>
                                {stat.change !== undefined && !stat.hideChange && (
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${stat.change >= 0
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                        : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                        }`}>
                                        {stat.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {stat.change >= 0 ? '+' : ''}{stat.change}%
                                    </div>
                                )}
                            </div>
                            <p className="text-xs font-bold text-gray-400 tracking-wide mb-1">{stat.label}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            {stat.sub && (
                                <p className="text-xs font-medium text-gray-500 mt-1">{stat.sub}</p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sales Trends</h3>
                            <p className="text-xs text-gray-500 mt-1">Period: {selectedFilterLabel}</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <div className="w-2 h-2 rounded-full bg-paymint-green" />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Total Revenue</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full relative">
                        {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7CC39F" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#7CC39F" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.3} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        tickFormatter={(value) => `$${value}`}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderColor: '#E5E7EB',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: '#111827' }}
                                        formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#7CC39F"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#revenueGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                                    <Activity size={32} className="text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    No Revenue Data
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                    There are no sales recorded for the selected period.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-4"
                >
                    <div className="p-6 bg-paymint-green/10 rounded-2xl border border-paymint-green/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-paymint-green flex items-center justify-center text-black mb-4">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Grow Business</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Add new locations or create brands.</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/onboarding')}
                                    className="w-full py-3 bg-paymint-green text-black font-bold rounded-xl text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                                >
                                    Add Establishment
                                </button>
                                <button
                                    onClick={() => navigate('/owner/brands')}
                                    className="w-full py-3 bg-white dark:bg-white/10 text-gray-900 dark:text-white font-bold rounded-xl text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 transition-all"
                                >
                                    Manage Brands
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide mb-4">Quick Management</h4>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/owner/employees')}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group/btn"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <UserPlus size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Staff Management</span>
                                    </div>
                                    <Activity size={14} className="text-gray-400 group-hover/btn:text-blue-500 transition-colors" />
                                </button>
                                <button
                                    onClick={() => navigate('/owner/establishments')}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group/btn"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <Store size={16} />
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Establishments</span>
                                    </div>
                                    <Activity size={14} className="text-gray-400 group-hover/btn:text-emerald-500 transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

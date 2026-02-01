import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
    Clock,
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
import { SingleSelect } from '../../components/SingleSelect';

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

    // New Filter State
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('23:59');
    const [selectedDateRange, setSelectedDateRange] = useState<string>('today');

    const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);

    // No longer need manual brands count fetch as it's included in overview-stats

    useEffect(() => {
        fetchOverviewStats();
    }, [startDate, endDate, startTime, endTime, selectedDateRange]);

    const setQuickDate = (range: string) => {
        setSelectedDateRange(range);
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (range) {
            case 'today':
                // already set to today
                break;
            case 'yesterday':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'this_week':
                const dayOfWeek = today.getDay();
                if (dayOfWeek === 0) {
                    start.setDate(today.getDate() - 6);
                } else {
                    start.setDate(today.getDate() - dayOfWeek);
                }
                end = new Date(today);
                break;
            case 'this_month':
                start.setDate(1);
                end = new Date(today);
                break;
            case 'last_30':
                start.setDate(today.getDate() - 30);
                end = new Date(today);
                break;
        }

        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
        setStartTime('00:00');
        setEndTime('23:59');
    };

    const fetchOverviewStats = async () => {
        try {
            setIsLoading(true);

            // Map UI filter IDs to API expected parameters
            // Map UI filter IDs to API expected parameters
            let query = '';

            // If using quick selects that map directly to backend presets, we can use them
            // But strict date/time usage is better for specific checks.
            // However, existing backend logic supports 'yesterday', '7d', '30d', 'all'.
            // For now, we will construct custom range query to be precise with the inputs.

            // Note: The backend might not support time in the date strings for the simple overview endpoint 
            // if it expects "YYYY-MM-DD". We will send startDate and endDate as dates.
            // If the user modified time, we might strictly want to send full ISO. 
            // Let's assume standard date filtering for overview.

            if (selectedDateRange === 'yesterday') {
                query = `?range=yesterday`;
            } else if (selectedDateRange === 'today') {
                query = `?range=today`;
            } else {
                // For last_30, custom, etc. use explicit dates
                const startISO = `${startDate}T${startTime}:00`;
                const endISO = `${endDate}T${endTime}:00`;
                query = `?range=custom&startDate=${startISO}&endDate=${endISO}`;
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

    const selectedFilterLabel = selectedDateRange === 'custom'
        ? `${startDate} - ${endDate}`
        : selectedDateRange === 'today' ? 'Today'
            : selectedDateRange === 'yesterday' ? 'Yesterday'
                : selectedDateRange === 'this_week' ? 'This Week'
                    : selectedDateRange === 'this_month' ? 'This Month'
                        : 'Custom Range';

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="space-y-8 pb-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                            Overview
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <Activity size={14} className="text-emerald-500" />
                            Online
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Managing {establishments.length} locations and {stats.totalBrands} brands.
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

                    {/* Unified Filter Control Deck */}
                    <div className="bg-white dark:bg-[#0B1120] rounded-[20px] shadow-sm shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-1.5">
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 xl:gap-0">

                            {/* Sector 1: Quick Period Dropdown */}
                            <div className={`flex-none w-[160px] rounded-xl border transition-all ${selectedDateRange !== 'custom' ? 'bg-paymint-green/5 border-paymint-green ring-1 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'border-transparent'}`}>
                                <SingleSelect
                                    value={selectedDateRange === 'custom' ? null : selectedDateRange}
                                    onChange={(val) => setQuickDate(val || 'today')}
                                    options={[
                                        { label: 'Today', value: 'today' },
                                        { label: 'Yesterday', value: 'yesterday' },
                                        { label: 'This Week', value: 'this_week' },
                                        { label: 'This Month', value: 'this_month' },
                                    ]}
                                    showAllOption={false}
                                    placeholder="Select Period"
                                    className="w-full"
                                    buttonClassName={`!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !p-2.5 !h-full !text-xs !font-bold ${selectedDateRange !== 'custom' ? '!text-paymint-green' : ''}`}
                                />
                            </div>

                            {/* Vertical Divider (Desktop) */}
                            <div className="hidden xl:block w-px h-8 bg-gray-100 dark:bg-white/10 mx-3" />

                            {/* Sector 2: Time & Date Controls */}
                            {(() => {
                                const isDateFiltered = selectedDateRange === 'custom';
                                const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';

                                return (
                                    <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                                        {/* Date Input Group */}
                                        <div className={`flex-1 flex flex-col justify-center px-3 py-1 rounded-xl border transition-all group ${isDateFiltered ? 'bg-paymint-green/5 border-paymint-green ring-1 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'bg-transparent border-transparent'}`}>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Calendar size={10} className={isDateFiltered ? "text-[#7CC39F]" : "text-gray-400"} />
                                                <span className={`text-[10px] uppercase font-black tracking-widest transition-colors ${isDateFiltered ? "text-[#7CC39F]" : "text-gray-400"}`}>Date Range</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    value={startDate}
                                                    onChange={(e) => { setStartDate(e.target.value); setSelectedDateRange('custom'); }}
                                                    className={`bg-transparent p-0 text-xs font-bold border-none focus:ring-0 w-full h-auto dark:[color-scheme:dark] cursor-pointer transition-colors ${isDateFiltered ? "text-[#7CC39F]" : "text-gray-400 dark:text-white/40"}`}
                                                />
                                                <span className={`font-light transition-colors ${isDateFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/10"}`}>/</span>
                                                <input
                                                    type="date"
                                                    value={endDate}
                                                    onChange={(e) => { setEndDate(e.target.value); setSelectedDateRange('custom'); }}
                                                    className={`bg-transparent p-0 text-xs font-bold border-none focus:ring-0 w-full h-auto dark:[color-scheme:dark] text-right cursor-pointer transition-colors ${isDateFiltered ? "text-[#7CC39F]" : "text-gray-400 dark:text-white/40"}`}
                                                />
                                            </div>
                                        </div>

                                        {/* Vertical Divider (Inner) */}
                                        <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-white/10" />

                                        {/* Time Input Group */}
                                        <div className={`flex-1 flex flex-col justify-center px-3 py-1 rounded-xl border transition-all group ${isTimeFiltered ? 'bg-paymint-green/5 border-paymint-green ring-1 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'bg-transparent border-transparent'}`}>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <Clock size={10} className={isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400"} />
                                                <span className={`text-[10px] uppercase font-black tracking-widest transition-colors ${isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400"}`}>Active Hours</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => { setStartTime(e.target.value); setSelectedDateRange('custom'); }}
                                                    className={`bg-transparent p-0 text-xs font-bold border-none focus:ring-0 w-[60px] h-auto dark:[color-scheme:dark] cursor-pointer transition-colors ${isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400 dark:text-white/40"}`}
                                                />
                                                <span className={`font-light transition-colors ${isTimeFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
                                                <input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => { setEndTime(e.target.value); setSelectedDateRange('custom'); }}
                                                    className={`bg-transparent p-0 text-xs font-bold border-none focus:ring-0 w-[60px] h-auto dark:[color-scheme:dark] text-right cursor-pointer transition-colors ${isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400 dark:text-white/40"}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
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
                                    Add Location
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
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Manage Locations</span>
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

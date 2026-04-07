import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp,
    TrendingDown,
    Store,
    Users,
    Building2,
    Activity,
    Zap,
    DollarSign,
    UserPlus
} from 'lucide-react';
import {
    Area,
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { SingleSelect } from '../../components/SingleSelect';
import { DateRangePicker } from '../../components/DateRangePicker';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput, getDatePeriodLabel } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';

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
    const { t } = useTranslation();
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
    const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
    const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('00:00');
    const [endTime, setEndTime] = useState('23:59');
    const [selectedDateRange, setSelectedDateRange] = useState<string>('today');

    // No longer need manual brands count fetch as it's included in overview-stats

    const setQuickDate = (range: string) => {
        setSelectedDateRange(range);
        const { start, end } = calculateDateRange(range as DatePeriod);
        setStartDate(formatDateForInput(start));
        setEndDate(formatDateForInput(end));
        setStartTime('00:00');
        setEndTime('23:59');
    };

    const fetchOverviewStats = useCallback(async () => {
        try {
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
        }
    }, [startDate, endDate, startTime, endTime, selectedDateRange, establishments.length]);

    useEffect(() => {
        fetchOverviewStats();
    }, [fetchOverviewStats]);

    const selectedFilterLabel = selectedDateRange === 'custom'
        ? `${startDate} - ${endDate}`
        : getDatePeriodLabel(selectedDateRange);

    const formatCurrency = (amount: number) => {
        const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
        const formatted = amount.toLocaleString(locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${formatted} ${establishments?.[0]?.currency || 'JOD'}`;
    };

    return (
        <div className="space-y-8 pb-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center gap-1.5 dashboard-card-meta">
                            <Activity size={14} className="text-paymint-green" />
                            {t('owner.overview.liveSystem')}
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.overview.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                        {t('owner.overview.subtitle', { count: establishments.length, brands: stats.totalBrands })}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Unified Filter Control Deck */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-sm shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-1.5">
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 xl:gap-0">

                            {/* Sector 1: Quick Period Dropdown */}
                            <div className={`flex-none w-[160px] rounded-xl border transition-all ${selectedDateRange !== 'custom' ? 'bg-paymint-green/5 border-paymint-green ring-1 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'border-transparent'}`}>
                                <SingleSelect
                                    value={selectedDateRange === 'custom' ? null : selectedDateRange}
                                    onChange={(val) => setQuickDate(val || 'today')}
                                    options={DATE_PERIOD_OPTIONS}
                                    showAllOption={false}
                                    placeholder={t('owner.overview.selectPeriod')}
                                    className="w-full"
                                    buttonClassName={`!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !p-2.5 !h-full !text-xs !font-bold ${selectedDateRange !== 'custom' ? '!text-paymint-green' : ''}`}
                                />
                            </div>

                            {/* Vertical Divider (Desktop) */}
                            <div className="hidden xl:block w-px h-8 bg-gray-100 dark:bg-white/10 mx-3" />

                            {/* Sector 2: Time & Date Controls */}
                            {(() => {
                                const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';

                                return (
                                    <div className="flex-1 flex flex-col md:flex-row gap-4 items-center">
                                        {/* Date Input Group */}
                                        <div className="flex-none min-w-[200px] sm:min-w-[240px] relative z-[60]">
                                            <DateRangePicker
                                                startDate={startDate}
                                                endDate={endDate}
                                                onRangeChange={(start, end) => {
                                                    setStartDate(start);
                                                    setEndDate(end);
                                                    setSelectedDateRange('custom');
                                                }}
                                                onClear={() => setQuickDate('today')}
                                                isActive={selectedDateRange === 'custom'}
                                                align="left"
                                            />
                                        </div>

                                        {/* Vertical Divider (Inner) */}
                                        <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-white/10" />

                                        {/* Time Input Group */}
                                        <div className={`flex-none w-auto min-w-[155px] sm:min-w-[180px] relative z-[55]`}>
                                            <div className={`flex flex-col justify-center px-3 h-12 rounded-xl border transition-all shadow-sm ${isTimeFiltered
                                                ? 'bg-paymint-green/5 border-paymint-green ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10'
                                                : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/10 hover:border-paymint-green/50'
                                                }`}>
                                                <div className="flex items-center gap-2 justify-between relative">
                                                    <CustomTimePicker
                                                        value={startTime}
                                                        onChange={(val) => { setStartTime(val); }}
                                                        className="w-[85px] sm:w-[95px]"
                                                        showIcon={true}
                                                        isActive={isTimeFiltered}
                                                    />
                                                    <span className={`text-xs font-bold transition-colors flex-shrink-0 ${isTimeFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
                                                    <CustomTimePicker
                                                        value={endTime}
                                                        onChange={(val) => { setEndTime(val); }}
                                                        className="w-[85px] sm:w-[95px]"
                                                        showIcon={true}
                                                        align="right"
                                                        isActive={isTimeFiltered}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    {
                        label: t('owner.overview.totalSales'),
                        value: formatCurrency(stats.totalRevenue),
                        change: stats.revenueChange,
                        icon: DollarSign,
                        color: 'text-paymint-green',
                        bg: 'bg-paymint-green/10',
                        hideChange: true
                    },
                    {
                        label: t('owner.overview.totalProfit'),
                        value: formatCurrency(stats.totalProfit),
                        change: stats.profitChange,
                        icon: TrendingUp,
                        color: 'text-paymint-green',
                        bg: 'bg-paymint-green/10',
                        hideChange: true
                    },
                    {
                        label: t('owner.overview.activeLocations'),
                        value: stats.activeLocations,
                        sub: t('owner.overview.open'),
                        icon: Store,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10'
                    },
                    {
                        label: t('owner.overview.brands'),
                        value: stats.totalBrands,
                        sub: t('owner.overview.managed'),
                        icon: Building2,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/10'
                    },
                    {
                        label: t('owner.overview.totalStaff'),
                        value: stats.totalEmployees || '-',
                        sub: t('owner.overview.total'),
                        icon: Users,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/10'
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10 flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="dashboard-card-label">{stat.label}</p>
                                <p className="dashboard-card-value text-xl">{stat.value}</p>
                                {stat.sub && (
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">{stat.sub}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.overview.salesTrends')}</h3>
                            <p className="card-subtitle">{t('owner.overview.period')}: {selectedFilterLabel}</p>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5">
                            <div className="w-2 h-2 rounded-full bg-paymint-green" />
                            <span className="text-xs font-black tracking-wider text-gray-600 dark:text-gray-400">{t('owner.overview.totalRevenue')}</span>
                        </div>
                    </div>

                    <div className="h-[450px] w-full relative flex-1">
                        {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
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
                                        tickFormatter={(value) => `${value.toLocaleString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US')} ${establishments?.[0]?.currency || 'JOD'}`}
                                        width={80}
                                        dx={-5}
                                    />
                                    <Tooltip
                                        cursor={chartData.length > 1 ? { stroke: '#7CC39F', strokeWidth: 2, strokeDasharray: '6 6' } : false}
                                        contentStyle={{
                                            backgroundColor: '#1E293B',
                                            borderColor: 'rgba(255,255,255,0.05)',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value) => [formatCurrency(value as number), t('owner.overview.revenue')]}
                                    />
                                    {chartData.length === 1 ? (
                                        <Bar 
                                            dataKey="value" 
                                            fill="url(#revenueGradient)" 
                                            barSize={60} 
                                            radius={[8, 8, 0, 0]} 
                                            animationDuration={1500} 
                                        />
                                    ) : (
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#7CC39F"
                                            strokeWidth={2.5}
                                            fillOpacity={1}
                                            fill="url(#revenueGradient)"
                                        />
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4">
                                    <Activity size={32} className="text-gray-400 dark:text-gray-500" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">
                                    {t('owner.overview.noRevenueData')}
                                </h3>
                                <p className="text-sm font-bold text-gray-500 text-center">
                                    {t('owner.overview.noSalesRecorded')}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
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
                            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">{t('owner.overview.growBusiness')}</h3>
                            <p className="text-sm font-bold text-gray-500 mb-6">{t('owner.overview.growBusinessDesc')}</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/onboarding')}
                                    className="w-full py-3 bg-paymint-green text-black font-bold rounded-xl text-sm hover:bg-[#68B390] transition-all shadow-sm"
                                >
                                    {t('owner.overview.addLocation')}
                                </button>
                                <button
                                    onClick={() => navigate('/owner/brands')}
                                    className="w-full py-3 bg-white dark:bg-white/10 text-gray-900 dark:text-white font-bold rounded-xl text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/20 transition-all"
                                >
                                    {t('owner.overview.manageBrands')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-100 dark:bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                        <div className="relative z-10">
                            <h4 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">{t('owner.overview.quickManagement')}</h4>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/owner/employees')}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group/btn"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                                            <UserPlus size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t('owner.overview.staffManagement')}</span>
                                    </div>
                                    <Activity size={14} className="text-gray-400 group-hover/btn:text-blue-500 transition-colors" />
                                </button>
                                <button
                                    onClick={() => navigate('/owner/establishments')}
                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all group/btn"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-paymint-green/10 text-paymint-green flex items-center justify-center">
                                            <Store size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t('owner.overview.manageLocations')}</span>
                                    </div>
                                    <Activity size={14} className="text-gray-400 group-hover/btn:text-paymint-green transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

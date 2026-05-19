import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    TrendingUp,
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
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { formatInputPlaceholder } from '../../utils/textCase';
import { formatCurrencyCode } from '../../utils/currency';
import { StatValue } from '../../components/ui/StatValue';

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
        activeLocations: 0,
        totalBrands: 0,
        totalEmployees: 0,
        revenueByDay: []
    });

    const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);
    const [selectedDateRange, setSelectedDateRange] = useState<DatePeriod>('this_week');
    const [startDate, setStartDate] = useState<string>(formatDateForInput(calculateDateRange('this_week').start));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(calculateDateRange('this_week').end));
    const [startTime, setStartTime] = useState<string>('00:00');
    const [endTime, setEndTime] = useState<string>('23:59');

    const setQuickDate = (period: DatePeriod) => {
        setSelectedDateRange(period);
        const range = calculateDateRange(period);
        setStartDate(formatDateForInput(range.start));
        setEndDate(formatDateForInput(range.end));
    };

    const fetchOverviewStats = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            params.append('startDate', `${startDate}T${startTime}:00Z`);
            params.append('endDate', `${endDate}T${endTime}:59Z`);

            const response = await api.get(`/owner/overview-stats?${params.toString()}`);
            const data = response.data;

            if (data) {
                setStats({
                    totalRevenue: data.totalRevenue || 0,
                    revenueChange: data.revenueChange || 0,
                    totalProfit: data.totalProfit || 0,
                    profitChange: data.profitChange || 0,
                    activeLocations: establishments.length,
                    totalBrands: data.totalBrands || 0,
                    totalEmployees: data.totalEmployees || 0,
                    revenueByDay: data.revenueTrend || []
                });
                setChartData(data.revenueTrend || []);
            } else {
                setStats({
                    totalRevenue: 0,
                    revenueChange: 0,
                    totalProfit: 0,
                    profitChange: 0,
                    activeLocations: establishments.length,
                    totalBrands: 0,
                    totalEmployees: 0,
                    revenueByDay: []
                });
                setChartData([]);
            }

        } catch (err) {
            console.error('Failed to fetch overview stats:', err);
        }
    }, [startDate, endDate, startTime, endTime, selectedDateRange, establishments.length]);

    useEffect(() => {
        fetchOverviewStats();
    }, [fetchOverviewStats]);

    const formatCurrency = (amount: number) => {
        const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
        return formatCurrencyCode(amount, establishments?.[0]?.currency || 'JOD', locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10">
            {/* Header with Integrated Filter */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.overview.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                        {t('owner.overview.subtitle', { count: establishments.length, brands: stats.totalBrands })}
                    </p>
                </div>

                <div className="flex items-stretch lg:items-center gap-3 w-full lg:w-auto">
                    <div className="w-full lg:w-auto bg-white dark:bg-[#1E293B] rounded-[20px] shadow-sm shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-1.5">
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 xl:gap-0">
                            <div className={`flex-none w-full xl:w-[160px] rounded-xl border transition-all ${selectedDateRange !== 'custom' ? 'bg-mintcom-green/5 border-mintcom-green ring-1 ring-mintcom-green shadow-lg shadow-mintcom-green/10' : 'border-transparent'}`}>
                                <SingleSelect
                                    value={selectedDateRange === 'custom' ? null : selectedDateRange}
                                    onChange={(val) => setQuickDate((val || 'today') as DatePeriod)}
                                    options={DATE_PERIOD_OPTIONS}
                                    showAllOption={false}
                                    placeholder={formatInputPlaceholder(t('owner.overview.selectPeriod'), t('common.locale'))}
                                    className="w-full"
                                    buttonClassName={`!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !p-2.5 !h-full !text-xs !font-bold !justify-center xl:!justify-between ${selectedDateRange !== 'custom' ? '!text-mintcom-green' : ''}`}
                                />
                            </div>

                            <div className="hidden xl:block w-px h-8 bg-gray-100 dark:bg-white/10 mx-3" />

                            <div className="flex-1 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
                                <div className="w-full md:w-auto md:min-w-[240px] relative z-[60]">
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
                                        buttonClassName="justify-center md:justify-start"
                                    />
                                </div>

                                <div className="hidden md:block w-px h-6 bg-gray-100 dark:bg-white/10" />

                                <div className={`w-full md:w-auto md:min-w-[180px] relative z-[55]`}>
                                    <div className={`flex flex-col justify-center px-3 h-12 rounded-xl border transition-all shadow-sm ${startTime !== '00:00' || endTime !== '23:59'
                                        ? 'bg-mintcom-green/5 border-mintcom-green ring-2 ring-mintcom-green shadow-lg shadow-mintcom-green/10'
                                        : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/10 hover:border-mintcom-green/50'
                                        }`}>
                                        <div className="flex items-center gap-2 justify-center md:justify-between relative">
                                            <CustomTimePicker
                                                value={startTime}
                                                onChange={(val) => { setStartTime(val); }}
                                                className="flex-none"
                                                buttonClassName="justify-center md:justify-start"
                                                showIcon={true}
                                            />
                                            <span className={`text-xs font-bold transition-colors flex-shrink-0 ${(startTime !== '00:00' || endTime !== '23:59') ? "text-[#7dc6a2]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
                                            <CustomTimePicker
                                                value={endTime}
                                                onChange={(val) => { setEndTime(val); }}
                                                className="flex-none"
                                                buttonClassName="justify-center md:justify-start"
                                                showIcon={true}
                                                align="right"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    {
                        label: t('owner.overview.totalSales'),
                        value: stats.totalRevenue,
                        change: stats.revenueChange,
                        icon: DollarSign,
                        color: 'text-mintcom-green',
                        bg: 'bg-mintcom-green/10',
                        isCurrency: true
                    },
                    {
                        label: t('owner.overview.totalProfit'),
                        value: stats.totalProfit,
                        change: stats.profitChange,
                        icon: TrendingUp,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10',
                        isCurrency: true
                    },
                    {
                        label: t('owner.overview.activeLocations'),
                        value: stats.activeLocations,
                        change: null,
                        icon: Store,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/10',
                        isCurrency: false
                    },
                    {
                        label: t('owner.overview.totalBrands'),
                        value: stats.totalBrands,
                        change: null,
                        icon: Building2,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/10',
                        isCurrency: false
                    },
                    {
                        label: t('owner.overview.totalStaff'),
                        value: stats.totalEmployees,
                        change: null,
                        icon: Users,
                        color: 'text-pink-500',
                        bg: 'bg-pink-500/10',
                        isCurrency: false
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden group relative"
                    >
                        <div className="absolute top-0 end-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-current opacity-5" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                                    <stat.icon size={24} />
                                </div>
                                {stat.change !== null && (
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${stat.change >= 0
                                        ? 'bg-mintcom-green/10 text-mintcom-green'
                                        : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                        }`}>
                                        {stat.change >= 0 ? '+' : ''}{stat.change}%
                                    </div>
                                )}
                            </div>
                            <p className="dashboard-stat-title mb-1">{stat.label}</p>
                            <StatValue 
                                value={stat.value} 
                                currency={stat.isCurrency ? (establishments?.[0]?.currency || 'JOD') : null}
                                className="text-2xl"
                                isInteger={!stat.isCurrency}
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t('owner.overview.revenueTrend')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('owner.overview.consolidatedPerf')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-mintcom-green" />
                            <span className="text-xs font-medium text-gray-500">{t('owner.overview.revenue')}</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7dc6a2" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#7dc6a2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
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
                                        tickFormatter={(value) => formatCurrency(value)}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderColor: '#E5E7EB',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)'
                                        }}
                                        formatter={(value) => [formatCurrency(value as number), t('owner.overview.revenue')]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#7dc6a2"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <Activity size={48} strokeWidth={1} className="mb-4 opacity-20" />
                                <p className="text-sm">{t('owner.overview.noData')}</p>
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
                    <div className="p-6 bg-mintcom-green/10 rounded-2xl border border-mintcom-green/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-mintcom-green flex items-center justify-center text-black mb-4">
                                <Zap size={24} />
                            </div>
                            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">{t('owner.overview.growBusiness')}</h3>
                            <p className="text-sm font-normal text-gray-500 mb-6">{t('owner.overview.growBusinessDesc')}</p>
                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/onboarding')}
                                    className="w-full py-3 bg-mintcom-green text-black font-bold rounded-xl text-sm hover:bg-[#5fa888] transition-all shadow-sm"
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

                    <div className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm transition-all duration-300 group relative overflow-hidden">
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
                                        <div className="w-8 h-8 rounded-lg bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
                                            <Store size={16} />
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{t('owner.overview.manageLocations')}</span>
                                    </div>
                                    <Activity size={14} className="text-gray-400 group-hover/btn:text-mintcom-green transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

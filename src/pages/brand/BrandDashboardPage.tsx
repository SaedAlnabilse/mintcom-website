import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Users,
    Store,
    DollarSign,
    ShoppingBag,
    Clock,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Activity,
    Target,
    Award,
    ArrowRight,
    ChevronRight,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    ComposedChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';
import api from '../../config/api';
import { SingleSelect } from '../../components/SingleSelect';
import { DateRangePicker } from '../../components/DateRangePicker';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import toast from 'react-hot-toast';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';

interface BrandStats {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalEmployees: number;
    revenueGrowth: number;
    orderGrowth: number;
    avgOrderValue: number;
    activeLocations: number;
}

interface LocationPerformance {
    id: string;
    name: string;
    revenue: number;
    orders: number;
    growth: number;
    employees: number;
}

interface RevenueDataPoint {
    name: string;
    value: number;
    orders: number;
}

interface CategoryDataPoint {
    name: string;
    value: number;
    quantity: number;
    color: string;
    share: number;
    [key: string]: string | number;
}
// Ported State Logic from OwnerOverviewPage for Unified Filter
type DateRangePreset = DatePeriod;



const CHART_COLORS = ['#7CC39F', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

export function BrandDashboardPage() {
    const { t } = useTranslation();
    const { brandId: paramBrandId } = useParams<{ brandId: string }>();
    const { brand } = useOutletContext<{ brand: any }>() || {};
    const brandId = brand?.id || paramBrandId;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [brandName, setBrandName] = useState(t('brand.dashboard.title'));
    const [stats, setStats] = useState<BrandStats | null>(null);
    const [locations, setLocations] = useState<LocationPerformance[]>([]);
    const initialDateRange = useMemo(() => calculateDateRange('this_week'), []);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>('this_week');
    const [startDate, setStartDate] = useState<string>(formatDateForInput(initialDateRange.start));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(initialDateRange.end));
    const [startTime, setStartTime] = useState<string>('00:00');
    const [endTime, setEndTime] = useState<string>('23:59');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Remove old state mapping
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<Array<{ name: string; value: number; quantity: number }>>([]);
    const hasLoadedOnceRef = useRef(false);

    const setQuickDate = (range: DateRangePreset) => {
        setSelectedDateRange(range);
        const { start, end } = calculateDateRange(range);
        setStartDate(formatDateForInput(start));
        setEndDate(formatDateForInput(end));
        setStartTime('00:00');
        setEndTime('23:59');
    };

    const fetchBrandData = useCallback(async () => {
        try {
            if (hasLoadedOnceRef.current) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }

            // Fetch real dashboard stats from the backend
            const params: Record<string, any> = {};

            // Map our UI state to backend params
            if (selectedDateRange === 'yesterday') {
                params.timeRange = 'yesterday';
            } else if (selectedDateRange === 'today') {
                params.timeRange = '24h'; // or 'today' depending on backend support
            } else {
                // For all other cases, use custom range with full time precision
                params.timeRange = 'custom';
                params.startDate = `${startDate}T${startTime}:00`;
                params.endDate = `${endDate}T${endTime}:00`;
            }

            const [brandResponse, statsResponse] = await Promise.all([
                api.get(`/api/brands/${brandId}`),
                api.get(`/api/brands/${brandId}/dashboard-stats`, { params })
            ]);

            setBrandName(brandResponse.data?.name || t('brand.dashboard.title'));

            const dashboardData = statsResponse.data;
            const establishments = brandResponse.data?.establishments || [];

            // Set real stats from backend
            const totalRevenue = dashboardData.stats?.totalRevenue || 0;
            const totalOrders = dashboardData.stats?.totalOrders || 0;

            setStats({
                totalRevenue,
                totalOrders,
                totalProducts: dashboardData.stats?.totalProducts || 0,
                totalEmployees: dashboardData.stats?.totalEmployees || 0,
                revenueGrowth: dashboardData.stats?.revenueChange || 0,
                orderGrowth: dashboardData.stats?.ordersChange || 0,
                avgOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,
                activeLocations: establishments.length,
            });

            // Use real location performance data from backend
            const locationPerformance = dashboardData.locationPerformance || [];
            const locationData = locationPerformance.map((loc: any) => ({
                id: loc.id,
                name: loc.name,
                revenue: loc.revenue || 0,
                orders: loc.orders || 0,
                growth: 0, // Backend doesn't provide growth yet
                employees: loc.employees || 0,
            }));

            // Sort by revenue descending
            locationData.sort((a: LocationPerformance, b: LocationPerformance) => b.revenue - a.revenue);
            setLocations(locationData);

            // Generate chart data based on loaded stats or simple mapping
            const chartData = generateChartData(selectedDateRange, totalRevenue, totalOrders, startDate, endDate);
            setRevenueData(chartData);

            const categoryStats = Array.isArray(dashboardData.categoryBreakdown)
                ? dashboardData.categoryBreakdown
                : [];
            const processedCategoryBreakdown = categoryStats
                .map((category: any) => ({
                    name: category.categoryName || category.name || t('common.unknown'),
                    value: Number(category.totalSales ?? category.value ?? category.revenue ?? 0),
                    quantity: Number(category.quantity ?? category.count ?? 0),
                }))
                .filter((category: { value: number }) => category.value > 0)
                .sort((a: { value: number }, b: { value: number }) => b.value - a.value);
            setCategoryBreakdown(processedCategoryBreakdown);

        } catch (error) {
            console.error('Failed to fetch brand data:', error);
            toast.error(t('brand.dashboard.failedToLoad'));
        } finally {
            hasLoadedOnceRef.current = true;
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [brandId, endDate, endTime, selectedDateRange, startDate, startTime, t]);

    useEffect(() => {
        if (brandId) {
            hasLoadedOnceRef.current = false;
            fetchBrandData();
        }
    }, [brandId]);

    useEffect(() => {
        if (brandId && hasLoadedOnceRef.current) {
            fetchBrandData();
        }
    }, [brandId, fetchBrandData]);

    const generateChartData = (range: DateRangePreset, totalRevenue: number, totalOrders: number, startStr: string, endStr: string): RevenueDataPoint[] => {
        const data: RevenueDataPoint[] = [];
        let points = 7;
        let labels: string[] = [];

        switch (range) {
            case 'today': {
                points = 24;
                labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
                break;
            }
            case 'this_week':
            case 'last_30':
            case 'this_month':
            case 'custom': {
                const start = new Date(startStr);
                const end = new Date(endStr);
                const diffTime = Math.abs(end.getTime() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                if (diffDays <= 7) {
                    points = diffDays || 7; // prevent 0
                    labels = Array.from({ length: points }, (_, i) => {
                        const date = new Date(start);
                        date.setDate(date.getDate() + i);
                        return date.toLocaleDateString(t('common.language') === 'Arabic' ? 'ar-SA' : 'en-US', { weekday: 'short' });
                    });
                } else if (diffDays <= 31) {
                    points = diffDays;
                    labels = Array.from({ length: diffDays }, (_, i) => {
                        const date = new Date(start);
                        date.setDate(date.getDate() + i);
                        return date.toLocaleDateString(t('common.language') === 'Arabic' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
                    });
                } else {
                    const weeks = Math.ceil(diffDays / 7);
                    points = Math.min(weeks, 12);
                    labels = Array.from({ length: points }, (_, i) => `${t('owner.roles.global')} ${i + 1}`);
                }
                break;
            }
        }

        const avgValue = totalRevenue / points;
        const avgOrders = totalOrders / points;

        for (let i = 0; i < points; i++) {
            data.push({
                name: labels[i],
                value: Math.round(avgValue * (0.5 + Math.random())),
                orders: Math.round(avgOrders * (0.5 + Math.random())),
            });
        }

        return data;
    };

    // Category distribution for pie chart
    const categoryData = useMemo<CategoryDataPoint[]>(() => {
        const topCategories = categoryBreakdown.slice(0, 6);
        const totalCategoryRevenue = topCategories.reduce((sum, category) => sum + category.value, 0);

        return topCategories.map((category, index) => ({
            ...category,
            color: CHART_COLORS[index % CHART_COLORS.length],
            share: totalCategoryRevenue > 0 ? Math.round((category.value / totalCategoryRevenue) * 100) : 0,
        }));
    }, [categoryBreakdown]);
    const formatCurrency = (value: number) => {
        const symbol = t('common.currencySymbol') || '$';
        const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';

        if (value >= 1000000) {
            return `${symbol}${(value / 1000000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
        } else if (value >= 1000) {
            return `${symbol}${(value / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
        }
        return `${symbol}${value.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    const formatNumber = (value: number) => {
        const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
        if (value >= 1000000) {
            return `${(value / 1000000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}M`;
        } else if (value >= 1000) {
            return `${(value / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}K`;
        }
        return value.toLocaleString(locale);
    };

    const getNumericTooltipValue = (value: number | string | ReadonlyArray<number | string> | undefined) => {
        const normalizedValue = Array.isArray(value) ? value[0] : value;
        return typeof normalizedValue === 'number' ? normalizedValue : Number(normalizedValue ?? 0);
    };

    const isTopBrand = brandId === 'cmkek5eme0001vjjqvfm3wjwa';

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
                    <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
                </div>
                <p className="text-sm font-bold text-gray-400 tracking-widest">{t('brand.dashboard.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10 relative">
            {/* Premium Glow effect for top brand */}
            {isTopBrand && (
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-paymint-green/10 rounded-full blur-[120px] pointer-events-none" />
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-50">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                            <Activity size={14} className="text-emerald-500" />
                            {t('brand.dashboard.liveData')}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">{brandName}</h1>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm sm:text-base mt-2">
                        <div className="flex items-center gap-1.5">
                            <Store size={16} />
                            <span>{locations.length} {t('brand.dashboard.locations')}</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                        <div className="flex items-center gap-1.5">
                            <Clock size={16} />
                            <span>{t('brand.dashboard.updatedNow')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-50">
                    {/* Unified Filter Control Deck */}
                    <div className="bg-white dark:bg-[#0B1120] rounded-[20px] shadow-sm shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-1.5 ">
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 xl:gap-0 h-full">

                            {/* Sector 1: Quick Period Dropdown */}
                            <div className={`flex-none w-[160px] rounded-xl border transition-all ${selectedDateRange !== 'custom' ? 'bg-paymint-green/5 border-paymint-green ring-1 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'border-transparent'}`}>
                                <SingleSelect
                                    value={selectedDateRange === 'custom' ? null : selectedDateRange}
                                    onChange={(val) => setQuickDate(val as DateRangePreset || 'today')}
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
                                            <div className={`flex flex-col justify-center px-3 py-1.5 rounded-xl border transition-all ${isTimeFiltered ? '!bg-emerald-50 dark:!bg-[#064E3B] border-paymint-green ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10' : '!bg-gray-50 dark:!bg-[#1E293B] border-transparent'}`}>
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className={`text-[9px] font-black tracking-wider transition-colors ${isTimeFiltered ? "text-[#7CC39F]" : "text-gray-400"}`}>{t('owner.overview.activeHours')}</span>
                                                </div>
                                                <div className="flex items-center gap-2 justify-between relative">
                                                    <CustomTimePicker
                                                        value={startTime}
                                                        onChange={(val) => { setStartTime(val); setSelectedDateRange('custom'); }}
                                                        className="w-[85px] sm:w-[95px]"
                                                        showIcon={true}
                                                    />
                                                    <span className={`text-xs font-bold transition-colors flex-shrink-0 ${isTimeFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
                                                    <CustomTimePicker
                                                        value={endTime}
                                                        onChange={(val) => { setEndTime(val); setSelectedDateRange('custom'); }}
                                                        className="w-[85px] sm:w-[95px]"
                                                        showIcon={true}
                                                        align="right"
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

            {/* Kpi Grid */}
            <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
                {[
                    {
                        label: t('brand.dashboard.totalRevenue'),
                        value: formatCurrency(stats?.totalRevenue || 0),
                        change: null,
                        icon: DollarSign,
                        color: 'text-emerald-500',
                        bg: 'bg-emerald-500/10'
                    },
                    {
                        label: t('brand.dashboard.totalOrders'),
                        value: formatNumber(stats?.totalOrders || 0),
                        change: null,
                        icon: ShoppingBag,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10'
                    },
                    {
                        label: t('brand.dashboard.avgOrderValue'),
                        value: `${t('common.currencySymbol') || '$'}${(stats?.avgOrderValue || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        change: null,
                        icon: Target,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/10'
                    },
                    {
                        label: t('brand.dashboard.teamSize'),
                        value: formatNumber(stats?.totalEmployees || 0),
                        change: null,
                        icon: Users,
                        color: 'text-orange-500',
                        bg: 'bg-orange-500/10'
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border shadow-sm overflow-hidden ${isTopBrand
                            ? 'border-paymint-green/30 shadow-paymint-green/5'
                            : 'border-gray-200 dark:border-white/5'
                            }`}
                    >
                        
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center ${isTopBrand ? 'shadow-lg shadow-current/10' : ''
                                    }`}>
                                    <stat.icon size={24} />
                                </div>
                                {stat.change !== null && (
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${stat.change >= 0
                                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                        : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                        }`}>
                                        {stat.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {stat.change >= 0 ? '+' : ''}{stat.change}%
                                    </div>
                                )}
                            </div>
                            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">{stat.label}</p>
                            <p className={`text-2xl font-bold text-gray-900 dark:text-white ${isTopBrand ? 'tracking-tight' : ''}`}>{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Location Performance */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('brand.dashboard.locationPerformance')}</h3>
                        <p className="text-xs text-gray-500 mt-1">{t('brand.dashboard.rankedByRevenue')}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/brand/${brandId}/locations`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold tracking-wide hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    >
                        {t('brand.dashboard.viewAll')}
                        <ChevronRight size={16} />
                    </button>
                </div>

                {locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Store size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{t('brand.dashboard.noLocations')}</p>
                        <p className="text-sm font-bold text-gray-500 mt-1">{t('brand.dashboard.addLocationsDesc')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {locations.slice(0, 5).map((loc, i) => (
                            <div
                                key={loc.id}
                                className="flex items-center gap-6 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                onClick={() => navigate(`/brand/${brandId}/locations`)}
                            >
                                {/* Rank */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                    i === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' :
                                        i === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                                            'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                                    }`}>
                                    {i === 0 ? <Award size={20} /> : `#${i + 1}`}
                                </div>

                                {/* Location Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors truncate">
                                            {loc.name}
                                        </h4>

                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <ShoppingBag size={12} />
                                            {loc.orders} {t('brand.dashboard.orders')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users size={12} />
                                            {loc.employees} {t('brand.dashboard.staff')}
                                        </span>
                                    </div>
                                </div>

                                {/* Revenue */}
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(loc.revenue)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {(loc.revenue / (stats?.totalRevenue || 1)).toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })} {t('brand.dashboard.ofTotal')}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-32 hidden lg:block">
                                    <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${(loc.revenue / (locations[0]?.revenue || 1)) * 100}%` }}
                                            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                                            className="h-full bg-paymint-green rounded-full"
                                        />
                                    </div>
                                </div>

                                <ChevronRight size={20} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`xl:col-span-2 p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('brand.dashboard.revenueTrend')}</h3>
                            <p className="text-xs text-gray-500 mt-1">{t('brand.dashboard.consolidatedPerformance')}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-paymint-green" />
                                <span className="text-xs font-black tracking-wider text-gray-500">{t('brand.dashboard.revenue')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-xs font-black tracking-wider text-gray-500">{t('brand.dashboard.orders')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        {revenueData.length > 0 && revenueData.some(d => d.value > 0 || d.orders > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="brandRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7CC39F" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#7CC39F" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="brandOrders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.3} />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        dy={10}
                                        interval={selectedDateRange === 'last_30' || selectedDateRange === 'last_30_days' || selectedDateRange === 'this_month' || selectedDateRange === 'last_28_days' || selectedDateRange === 'last_90_days' ? 4 : 0}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        tickFormatter={(value) => formatCurrency(value)}
                                        dx={-10}
                                    />
                                    <Tooltip
                                        cursor={revenueData.length > 1 ? { stroke: '#7CC39F', strokeWidth: 2, strokeDasharray: '6 6' } : false}
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderColor: '#E5E7EB',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)'
                                        }}
                                        formatter={(value, name) => [
                                            name === 'value' ? formatCurrency(value as number) : String(value),
                                            name === 'value' ? t('brand.dashboard.revenue') : t('brand.dashboard.orders')
                                        ]}
                                    />
                                    {revenueData.length === 1 ? (
                                        <>
                                            <Bar 
                                                dataKey="value" 
                                                fill="url(#brandRevenue)" 
                                                barSize={40} 
                                                radius={[8, 8, 0, 0]} 
                                                animationDuration={1500} 
                                            />
                                            <Bar 
                                                dataKey="orders" 
                                                fill="url(#brandOrders)" 
                                                barSize={40} 
                                                radius={[8, 8, 0, 0]} 
                                                animationDuration={1500} 
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#7CC39F"
                                                strokeWidth={2.5}
                                                fillOpacity={1}
                                                fill="url(#brandRevenue)"
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="orders"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#brandOrders)"
                                            />
                                        </>
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center space-y-4 bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                <div className="p-4 rounded-full bg-gray-100 dark:bg-white/5">
                                    <BarChart3 size={32} className="text-gray-400 dark:text-gray-600" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">{t('owner.overview.noRevenueData')}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t('owner.overview.noSalesRecorded')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Category Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('brand.dashboard.salesByCategory')}</h3>
                            <p className="text-xs text-gray-500 mt-1">{t('brand.dashboard.revenueDistribution')}</p>
                        </div>
                    </div>

                    <div className="h-[200px] w-full">
                        {categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPieChart>
                                    <Pie
                                        data={categoryData as unknown as Array<Record<string, string | number>>}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            borderColor: '#E5E7EB',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                        }}
                                        formatter={(value, _name, item) => [formatCurrency(getNumericTooltipValue(value)), `${item?.payload?.share ?? 0}% ${t('brand.dashboard.share')}`]}
                                    />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center space-y-4 bg-gray-50/50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                                <div className="p-4 rounded-full bg-gray-100 dark:bg-white/5">
                                    <BarChart3 size={32} className="text-gray-400 dark:text-gray-600" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">{t('owner.overview.noRevenueData')}</p>
                                    <p className="text-xs text-gray-500 mt-1">{t('owner.overview.noSalesRecorded')}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 mt-4">
                        {categoryData.map((cat, i) => (
                            <div key={i} className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                    <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{cat.name}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 dark:text-white shrink-0">{cat.share}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Quick Actions */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
                {[
                    {
                        title: t('brand.dashboard.viewAllLocations'),
                        description: t('brand.dashboard.manageLocationsDesc'),
                        icon: Store,
                        color: 'text-blue-500',
                        bg: 'bg-blue-500/10',
                        action: () => navigate(`/brand/${brandId}/locations`)
                    },
                    {
                        title: t('brand.dashboard.manageTeam'),
                        description: t('brand.dashboard.manageTeamDesc'),
                        icon: Users,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/10',
                        action: () => navigate(`/brand/${brandId}/team`)
                    },
                ].map((action, i) => (
                    <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        onClick={action.action}
                        className={`p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm text-left transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}
                    >
                                    <div className={`w-12 h-12 rounded-xl ${action.bg} ${action.color} flex items-center justify-center mb-4`}>
                                      <action.icon size={24} />
                                    </div>                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                            {action.title}
                        </h4>
                        <p className="text-sm font-bold text-gray-500">{action.description}</p>
                        <div className="flex items-center gap-1 mt-4 text-xs font-bold text-paymint-green">
                            <span>{t('brand.dashboard.goTo', { name: action.title })}</span>
                            <ArrowRight size={14} />
                        </div>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}













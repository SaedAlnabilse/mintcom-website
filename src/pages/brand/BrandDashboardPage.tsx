import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import {
    Users,
    Store,
    ShoppingBag,
    Clock,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Award,
    ChevronRight,
    Globe,
} from 'lucide-react';
import { biIcon } from '../../components/ui/BiIcon';
import {
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
import { SectionLoader } from '../../components/LoadingState';
import { formatInputPlaceholder } from '../../utils/textCase';
import { formatCompactCurrencyCode, formatCurrencyCode } from '../../utils/currency';
import { StatValue } from '../../components/ui/StatValue';
import { parseChartDate } from '../../utils/chartDate';
import { getDateLocale } from '../../utils/dateLocale';
import { useTheme } from '../../context/ThemeContext';
import { buildBrandDateParams } from '../../utils/brandDateParams';

interface BrandStats {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalEmployees: number;
    revenueGrowth: number | null;
    orderGrowth: number | null;
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
    currency?: string;
    originalRevenue?: number;
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

const CHART_COLORS = ['#7dc6a2', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899'];

const toFiniteNumber = (value: unknown): number => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
};

/** Format trend X labels as "Jul 6" instead of ambiguous "7/6". */
const formatTrendLabel = (raw: unknown, locale: string): string => {
    const value = String(raw ?? '').trim();
    if (!value) return '—';

    // Already a friendly short label (e.g. "Jul 6", "Mon")
    if (/^[A-Za-z]{3,}/.test(value) && !value.includes('T')) return value;

    // M/D or MM/DD (optionally with year)
    const md = value.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (md) {
        const month = Number(md[1]);
        const day = Number(md[2]);
        const year = md[3] ? Number(md[3].length === 2 ? `20${md[3]}` : md[3]) : new Date().getFullYear();
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            const date = new Date(year, month - 1, day);
            if (!isNaN(date.getTime())) {
                return format(date, 'MMM d', { locale: getDateLocale(locale) });
            }
        }
    }

    // ISO / timestamp / YYYY-MM-DD
    const parsed = parseChartDate(value);
    if (!isNaN(parsed.getTime())) {
        // Hourly bucket like "14:00"
        if (/^\d{1,2}:\d{2}/.test(value)) {
            return format(parsed, 'HH:mm', { locale: getDateLocale(locale) });
        }
        return format(parsed, 'MMM d', { locale: getDateLocale(locale) });
    }

    return value;
};

const normalizeRevenueTrend = (raw: unknown[], locale: string): RevenueDataPoint[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map((item: any) => ({
        name: formatTrendLabel(item?.name ?? item?.date ?? item?.day ?? item?.label, locale),
        value: toFiniteNumber(item?.value ?? item?.revenue ?? item?.total ?? item?.amount),
        orders: toFiniteNumber(item?.orders ?? item?.orderCount ?? item?.count),
    }));
};

const normalizeCategoryBreakdown = (raw: unknown[], unknownLabel: string): CategoryDataPoint[] => {
    if (!Array.isArray(raw)) return [];
    const rows = raw
        .map((item: any, index: number) => {
            const value = toFiniteNumber(item?.value ?? item?.totalSales ?? item?.revenue ?? item?.total ?? item?.amount);
            const name = String(item?.name ?? item?.categoryName ?? item?.category ?? item?.label ?? '').trim() || unknownLabel;
            return {
                name,
                value,
                quantity: toFiniteNumber(item?.quantity ?? item?.count ?? item?.qty),
                color: CHART_COLORS[index % CHART_COLORS.length],
                share: toFiniteNumber(item?.share ?? item?.percentage),
            };
        })
        // Keep named rows even at 0 so empty states can show a legend; drop totally empty junk
        .filter((row) => row.name);

    const total = rows.reduce((sum, row) => sum + Math.max(row.value, 0), 0);
    return rows.map((row) => ({
        ...row,
        // Prefer computed share from totals; fall back to API share only when total is 0 and API sent a finite share
        share: total > 0.005
            ? row.value / total
            : (Number.isFinite(row.share) && row.share > 1 ? row.share / 100 : (Number.isFinite(row.share) ? row.share : 0)),
    }));
};

export function BrandDashboardPage() {
    const { t } = useTranslation();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';
    const { brandId: paramBrandId } = useParams<{ brandId: string }>();
    const { brand } = useOutletContext<{ brand: any }>() || {};
    const brandId = brand?.id || paramBrandId;
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [brandName, setBrandName] = useState(brand?.name || t('brand.dashboard.title'));
    const [stats, setStats] = useState<BrandStats | null>(null);
    const [locations, setLocations] = useState<LocationPerformance[]>([]);
    const initialDateRange = useMemo(() => calculateDateRange('this_week'), []);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRangePreset>('this_week');
    const [startDate, setStartDate] = useState<string>(formatDateForInput(initialDateRange.start));
    const [endDate, setEndDate] = useState<string>(formatDateForInput(initialDateRange.end));
    const [startTime, setStartTime] = useState<string>('00:00');
    const [endTime, setEndTime] = useState<string>('23:59');
    const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
    const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryDataPoint[]>([]);
    // Currency the API aggregated brand figures in (the account's working
    // currency, derived from its locations) — never assume USD.
    const [baseCurrency, setBaseCurrency] = useState<string>('USD');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const hasMixedCurrencies = useMemo(() => {
        if (locations.length === 0) return false;
        const firstCurrency = locations[0].currency;
        return locations.some(loc => loc.currency && loc.currency !== firstCurrency);
    }, [locations]);

    const setQuickDate = (period: DateRangePreset) => {
        setSelectedDateRange(period);
        const range = calculateDateRange(period);
        setStartDate(formatDateForInput(range.start));
        setEndDate(formatDateForInput(range.end));
    };

    const localizedDateOptions = useMemo(() =>
        DATE_PERIOD_OPTIONS.map(opt => ({
            ...opt,
            label: t(`common.datePeriods.${opt.value}`)
        })), [t]);

    const fetchBrandData = useCallback(async (isInitial = false) => {
        if (!brandId) return;

        if (isInitial) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const brandParams = buildBrandDateParams({ startDate, endDate, startTime, endTime });
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', brandParams.startDate);
            if (endDate) params.append('endDate', brandParams.endDate);

            const response = await api.get(`/brands/${brandId}/dashboard-stats?${params.toString()}`);
            const data = response.data;

            const toGrowth = (v: unknown): number | null => {
              if (v === null || v === undefined) return null;
              const n = typeof v === 'number' ? v : Number(v);
              return Number.isFinite(n) ? n : null;
            };
            setStats(data.stats
                ? {
                    ...data.stats,
                    revenueGrowth: toGrowth(data.stats.revenueGrowth ?? data.stats.revenueChange),
                    orderGrowth: toGrowth(data.stats.orderGrowth ?? data.stats.ordersChange),
                }
                : null);
            setLocations(data.locationPerformance || data.locations || []);
            setRevenueData(normalizeRevenueTrend(data.revenueTrend || data.revenueByDay || [], t('common.locale')));
            setCategoryBreakdown(
                normalizeCategoryBreakdown(
                    data.categoryBreakdown || [],
                    t('common.unknown', { defaultValue: 'Unknown' }),
                ),
            );
            setBaseCurrency((data.baseCurrency || 'USD').toUpperCase());
            setBrandName(data.brandName || brand?.name || t('brand.dashboard.title'));
        } catch (error) {
            console.error('Failed to fetch brand dashboard data:', error);
            toast.error(t('brand.dashboard.failedToLoad'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [brandId, brand?.name, startDate, endDate, startTime, endTime, t]);

    const hasLoadedRef = useRef(false);
    useEffect(() => {
        if (!brandId) return;
        if (!hasLoadedRef.current) {
            hasLoadedRef.current = true;
            fetchBrandData(true);
            return;
        }
        const timer = setTimeout(() => {
            fetchBrandData();
        }, 500);
        return () => clearTimeout(timer);
    }, [brandId, startDate, endDate, startTime, endTime]);

    // Format in a location's original (local) currency
    const formatLocalCurrency = (value: number, currencyCode: string) => {
        const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
        return formatCurrencyCode(value, currencyCode, locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });
    };



    const formatCurrency = (value: number) => {
        const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
        return formatCompactCurrencyCode(value, baseCurrency, locale);
    };

    // Compact number without the currency code for axis ticks — "38.0M USD"
    // wraps to two lines inside the narrow YAxis and gets clipped.
    const formatAxisValue = (value: number) => {
        const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
        const abs = Math.abs(value);
        if (abs >= 1000000) {
            return `${(value / 1000000).toLocaleString(locale, { maximumFractionDigits: 1 })}M`;
        }
        if (abs >= 1000) {
            return `${(value / 1000).toLocaleString(locale, { maximumFractionDigits: 1 })}K`;
        }
        return value.toLocaleString(locale, { maximumFractionDigits: 0 });
    };

    const isTopBrand = brandId === 'cmkek5eme0001vjjqvfm3wjwa';

    if (isLoading) {
        return <SectionLoader message={t('brand.dashboard.loading')} />;
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-10 relative font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Premium Glow effect for top brand */}
            {isTopBrand && (
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-mintcom-green/10 rounded-full blur-[120px] pointer-events-none" />
            )}

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative z-50">
                <div>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{brandName}</h1>
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
                        {hasMixedCurrencies && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold">
                                    <Globe size={13} />
                                    <span>{t('brand.dashboard.standardizedIn', { currency: baseCurrency })}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-50 w-full lg:w-auto">
                    {/* Unified Filter Control Deck */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-[20px] shadow-sm shadow-indigo-500/5 dark:shadow-black/20 border border-gray-100 dark:border-white/[0.05] p-1.5 w-full lg:w-auto">
                        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 xl:gap-0 h-full">

                            {/* Sector 1: Quick Period Dropdown */}
                            <div className={`flex-none w-full xl:w-[160px] rounded-xl border transition-all ${selectedDateRange !== 'custom' ? 'bg-mintcom-green/5 border-mintcom-green ring-1 ring-mintcom-green shadow-lg shadow-mintcom-green/10' : 'border-transparent'}`}>
                                <SingleSelect
                                    value={selectedDateRange === 'custom' ? null : selectedDateRange}
                                    onChange={(val) => setQuickDate(val as DateRangePreset || 'today')}
                                    options={localizedDateOptions}
                                    showAllOption={false}
                                    searchable={false}
                                    placeholder={formatInputPlaceholder(t('owner.overview.selectPeriod'), t('common.locale'))}
                                    className="w-full"
                                    buttonClassName={`!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10 !rounded-xl !p-2.5 !h-full !text-xs !font-bold ${selectedDateRange !== 'custom' ? '!text-mintcom-green' : ''}`}
                                />
                            </div>

                            {/* Vertical Divider (Desktop) */}
                            <div className="hidden xl:block w-px h-8 bg-gray-100 dark:bg-white/10 mx-3" />

                            {/* Sector 2: Time & Date Controls */}
                            {(() => {
                                const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';

                                return (
                                    <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
                                        {/* Date Input Group */}
                                        <div className="flex-none w-full sm:min-w-[200px] lg:min-w-[240px] relative z-[60]">
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
                                        <div className={`flex-none w-full sm:w-auto sm:min-w-[180px] relative z-[55]`}>
                                            <div className={`flex flex-col justify-center px-3 h-12 rounded-xl border transition-all shadow-sm ${isTimeFiltered
                                                ? 'bg-mintcom-green/5 border-mintcom-green'
                                                : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/10 hover:border-mintcom-green/50'
                                                }`}>
                                                <div className="flex items-center gap-2 justify-between relative">
                                                    <CustomTimePicker
                                                        value={startTime}
                                                        onChange={(val) => { setStartTime(val); }}
                                                        className="w-[85px] sm:w-[95px]"
                                                        showIcon={true}
                                                        isActive={isTimeFiltered}
                                                    />
                                                    <span className={`text-xs font-bold transition-colors flex-shrink-0 ${isTimeFiltered ? "text-[#7dc6a2]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
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

            {/* Kpi Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}>
                {[
                    {
                        label: t('brand.dashboard.totalRevenue'),
                        value: stats?.totalRevenue || 0,
                        change: stats?.revenueGrowth ?? null,
                        icon: biIcon('bi-wallet2'),
                        color: 'text-mintcom-green',
                        bg: 'bg-mintcom-green/10',
                        isCurrency: true
                    },
                    {
                        label: t('brand.dashboard.totalOrders'),
                        value: stats?.totalOrders || 0,
                        change: stats?.orderGrowth ?? null,
                        icon: biIcon('bi-receipt-cutoff'),
                        color: 'text-mintcom-green',
                        bg: 'bg-mintcom-green/10',
                        isCurrency: false
                    },
                    {
                        label: t('brand.dashboard.avgOrderValue'),
                        value: stats?.avgOrderValue || 0,
                        change: null,
                        icon: biIcon('bi-calculator'),
                        color: 'text-mintcom-green',
                        bg: 'bg-mintcom-green/10',
                        isCurrency: true
                    },
                    {
                        label: t('brand.dashboard.teamSize'),
                        value: stats?.totalEmployees || 0,
                        change: null,
                        icon: biIcon('bi-people'),
                        color: 'text-mintcom-green',
                        bg: 'bg-mintcom-green/10',
                        isCurrency: false
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`relative p-6 rounded-2xl bg-white dark:bg-[#1E293B] border shadow-sm overflow-hidden ${isTopBrand
                            ? 'border-mintcom-green/30 shadow-mintcom-green/5'
                            : 'border-gray-200 dark:border-white/5'
                            }`}
                    >

                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center ${isTopBrand ? 'shadow-lg shadow-current/10' : ''
                                    }`}>
                                    <stat.icon size={24} />
                                </div>
                                {typeof stat.change === 'number' && Number.isFinite(stat.change) && (
                                    <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${stat.change >= 0
                                        ? 'bg-mintcom-green/10 text-mintcom-green dark:bg-mintcom-green/ dark:text-mintcom-green'
                                        : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                        }`}>
                                        {stat.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {stat.change >= 0 ? '+' : ''}{stat.change}%
                                    </div>
                                )}
                            </div>
                            <p className="dashboard-stat-title mb-1">{stat.label}</p>
                            <StatValue 
                                value={stat.value} 
                                currency={stat.isCurrency ? baseCurrency : null}
                                className="text-2xl"
                                isInteger={!stat.isCurrency}
                            />
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
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{t('brand.dashboard.rankedByRevenue')}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/brand/${brandId}/locations`)}
                        className="text-xs font-bold text-mintcom-green hover:underline tracking-wide mt-1.5 flex items-center gap-1"
                    >
                        {t('brand.dashboard.viewAll')}
                        <ChevronRight size={14} />
                    </button>
                </div>

                {locations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Store size={48} className="text-gray-300 dark:text-gray-700 mb-4" />
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{t('brand.dashboard.noLocations')}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('brand.dashboard.addLocationsDesc')}</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {locations.slice(0, 5).map((loc, i) => (
                            <div
                                key={loc.id}
                                className="flex items-center gap-3 sm:gap-6 px-4 sm:px-6 py-4 sm:py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                onClick={() => window.open(`/dashboard/${loc.id}`, '_blank')}
                            >
                                {/* Rank */}
                                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-sm font-black ${i === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                    i === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400' :
                                        i === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400' :
                                            'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                                    }`}>
                                    {i === 0 ? <Award size={20} /> : `#${i + 1}`}
                                </div>

                                {/* Location Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors truncate">
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
                                <div className="text-right shrink-0 min-w-0">
                                    <StatValue 
                                        value={loc.revenue} 
                                        currency={baseCurrency}
                                        className="text-lg"
                                    />
                                    {loc.currency && loc.currency !== baseCurrency && loc.originalRevenue !== undefined && (
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                                            {t('brand.dashboard.localRevenue')}: {formatLocalCurrency(loc.originalRevenue, loc.currency)}
                                        </p>
                                    )}
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
                                            className="h-full bg-mintcom-green rounded-full"
                                        />
                                    </div>
                                </div>

                                <ChevronRight size={20} className="text-gray-400 group-hover:text-mintcom-green group-hover:translate-x-1 transition-all" />
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <div className="min-w-0">
                            <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t('brand.dashboard.revenueTrend')}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{t('brand.dashboard.consolidatedPerformance')}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-mintcom-green" />
                                <span className="text-xs font-medium tracking-wider text-gray-500">{t('brand.dashboard.revenue')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-xs font-medium tracking-wider text-gray-500">{t('brand.dashboard.orders')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        {revenueData.length > 0 && revenueData.some(d => d.value > 0 || d.orders > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={revenueData} margin={{ top: 12, right: 12, left: 4, bottom: 4 }}>
                                    <defs>
                                        <linearGradient id="brandRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7dc6a2" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#7dc6a2" stopOpacity={0} />
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
                                        minTickGap={24}
                                        interval={
                                            selectedDateRange === 'last_30' ||
                                            selectedDateRange === 'last_30_days' ||
                                            selectedDateRange === 'this_month' ||
                                            selectedDateRange === 'last_28_days' ||
                                            selectedDateRange === 'last_90_days'
                                                ? 'preserveStartEnd'
                                                : 0
                                        }
                                    />
                                    <YAxis
                                        yAxisId="revenue"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        tickFormatter={(value) => formatAxisValue(Number(value))}
                                        width={56}
                                        dx={-4}
                                    />
                                    <YAxis
                                        yAxisId="orders"
                                        orientation="right"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#93C5FD', fontSize: 11 }}
                                        allowDecimals={false}
                                        width={36}
                                        dx={4}
                                    />
                                    <Tooltip
                                        cursor={revenueData.length > 1 ? { stroke: '#7dc6a2', strokeWidth: 2, strokeDasharray: '6 6' } : false}
                                        contentStyle={{
                                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.95)',
                                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                                            color: isDark ? '#fff' : '#111',
                                        }}
                                        formatter={(value, name) => [
                                            name === 'value'
                                                ? formatCurrency(Number(value) || 0)
                                                : Number(value || 0).toLocaleString(t('common.locale')),
                                            name === 'value' ? t('brand.dashboard.revenue') : t('brand.dashboard.orders'),
                                        ]}
                                    />
                                    {revenueData.length === 1 ? (
                                        <Bar yAxisId="revenue" dataKey="value" barSize={40} fill="url(#brandRevenue)" radius={[10, 10, 0, 0]} />
                                    ) : (
                                        <>
                                            <Area
                                                yAxisId="revenue"
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#7dc6a2"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#brandRevenue)"
                                                animationDuration={1500}
                                            />
                                            <Area
                                                yAxisId="orders"
                                                type="monotone"
                                                dataKey="orders"
                                                stroke="#3B82F6"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#brandOrders)"
                                                strokeDasharray="5 5"
                                                animationDuration={2000}
                                            />
                                        </>
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <BarChart3 size={48} className="text-gray-200 dark:text-gray-800 mb-4" />
                                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('brand.dashboard.noRevenueData')}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Category Pie Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm transition-opacity duration-200 ${isRefreshing ? 'opacity-70' : 'opacity-100'}`}
                >
                    <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">{t('brand.dashboard.revenueDistribution')}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">{t('brand.dashboard.salesByCategory')}</p>

                    {(() => {
                        const topCategories = categoryBreakdown.slice(0, 6);
                        const categoryTotal = topCategories.reduce((sum, c) => sum + Math.max(toFiniteNumber(c.value), 0), 0);
                        const hasCategoryData = categoryTotal > 0.005;
                        const emptyFill = isDark ? '#334155' : '#e5e7eb';
                        const pieData = hasCategoryData
                            ? topCategories.map((c) => ({ ...c, value: Math.max(toFiniteNumber(c.value), 0) }))
                            : [{ name: '__empty__', value: 1, quantity: 0, color: emptyFill, share: 0 }];

                        return (
                            <>
                                <div className="h-[260px] relative">
                                    {topCategories.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RechartsPieChart>
                                                <Pie
                                                    data={pieData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={65}
                                                    outerRadius={85}
                                                    paddingAngle={hasCategoryData ? 5 : 0}
                                                    dataKey="value"
                                                    animationDuration={hasCategoryData ? 1500 : 0}
                                                    isAnimationActive={hasCategoryData}
                                                    stroke="none"
                                                >
                                                    {pieData.map((_entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={hasCategoryData ? CHART_COLORS[index % CHART_COLORS.length] : emptyFill}
                                                            stroke="none"
                                                        />
                                                    ))}
                                                </Pie>
                                                {hasCategoryData && (
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(255, 255, 255, 0.95)',
                                                            borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
                                                            borderRadius: '12px',
                                                            fontSize: '12px',
                                                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                                                            color: isDark ? '#fff' : '#111',
                                                        }}
                                                        formatter={(value, _name, item) => [
                                                            formatCurrency(toFiniteNumber(value)),
                                                            String((item?.payload as CategoryDataPoint | undefined)?.name ?? ''),
                                                        ]}
                                                    />
                                                )}
                                            </RechartsPieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center">
                                            <div className="w-32 h-32 rounded-full border-4 border-gray-100 dark:border-white/5 flex items-center justify-center mb-3">
                                                <ShoppingBag size={32} className="text-gray-200 dark:text-gray-800" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {t('brand.dashboard.noCategoryData', { defaultValue: 'No category sales yet' })}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {topCategories.length > 0 && (
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-3 mt-6">
                                        {topCategories.map((entry, index) => {
                                            const pct = Number.isFinite(entry.share)
                                                ? entry.share
                                                : (categoryTotal > 0 ? entry.value / categoryTotal : 0);
                                            const safePct = Number.isFinite(pct) ? Math.max(0, pct) : 0;

                                            return (
                                                <div key={`${entry.name}-${index}`} className="flex items-center gap-2 min-w-0">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                                        style={{
                                                            backgroundColor: hasCategoryData
                                                                ? CHART_COLORS[index % CHART_COLORS.length]
                                                                : emptyFill,
                                                        }}
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="text-[11px] font-bold text-gray-900 dark:text-white truncate">
                                                            {entry.name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 font-medium tabular-nums">
                                                            {(safePct * 100).toFixed(1)}%
                                                            <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
                                                            {formatCurrency(toFiniteNumber(entry.value))}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </motion.div>
            </div>
        </div>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Store,
    Activity,
    Zap,
    UserPlus,
    ExternalLink
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
import { BusyOverlay } from '../../components/BusyOverlay';
import { DateRangePicker } from '../../components/DateRangePicker';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { formatInputPlaceholder } from '../../utils/textCase';
import { formatCurrencyCode } from '../../utils/currency';
import { StatValue } from '../../components/ui/StatValue';
import { PageHeader, FilterBar, StatCard, StatCardGrid, filterSelectButtonClass, filterSelectActiveClass, filterSelectInactiveClass, filterBoxActiveClass, filterBoxInactiveClass, primaryButtonClass } from '../../components/ui';
import { QuickInfo } from '../../components/QuickInfo';
import { biIcon } from '../../components/ui/BiIcon';

interface OverviewStats {
    /** Gross sales including tax + service charge */
    totalRevenue: number;
    /** Net sales excluding tax + service charge */
    netSales: number;
    totalProfit: number;
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
        netSales: 0,
        totalProfit: 0,
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
    const [isLoading, setIsLoading] = useState(true);

    const setQuickDate = (period: DatePeriod) => {
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

    const fetchOverviewStats = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            params.append('range', 'custom');
            params.append('startDate', `${startDate}T${startTime}:00Z`);
            params.append('endDate', `${endDate}T${endTime}:59Z`);

            const response = await api.get(`/accounts/overview-stats?${params.toString()}`);
            const data = response.data;
            const revenueTrend = data.revenueTrend || data.revenueByDay || [];

            if (data) {
                const totalSales = data.totalSales ?? data.totalRevenue ?? 0;
                const netSales =
                    data.netSales ??
                    data.netSalesBeforeTaxAndServiceCharge ??
                    0;
                setStats({
                    totalRevenue: totalSales,
                    netSales,
                    totalProfit: data.totalProfit || 0,
                    activeLocations: establishments.length,
                    totalBrands: data.totalBrands || 0,
                    totalEmployees: data.totalEmployees || 0,
                    revenueByDay: revenueTrend
                });
                setChartData(revenueTrend);
            } else {
                setStats({
                    totalRevenue: 0,
                    netSales: 0,
                    totalProfit: 0,
                    activeLocations: establishments.length,
                    totalBrands: 0,
                    totalEmployees: 0,
                    revenueByDay: []
                });
                setChartData([]);
            }

        } catch (err) {
            console.error('Failed to fetch overview stats:', err);
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, startTime, endTime, establishments.length]);

    useEffect(() => {
        fetchOverviewStats();
    }, [fetchOverviewStats]);

    const currencyCode = establishments?.[0]?.currency || 'JOD';
    const numberLocale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';

    /** Full currency for tooltips / detail text */
    const formatCurrency = (amount: number) =>
        formatCurrencyCode(amount, currencyCode, numberLocale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        });

    /**
     * Short single-line axis ticks (26M, 19.5M, 6.5K) — no currency code so
     * the top tick is never clipped. Full amount + currency stays in the tooltip.
     */
    const formatAxisCurrency = (amount: number) => {
        const safe = Number.isFinite(amount) ? amount : 0;
        const abs = Math.abs(safe);

        const trim = (n: number) => {
            const rounded = Math.round(n * 10) / 10;
            if (Math.abs(rounded - Math.round(rounded)) < 0.05) {
                return Math.round(rounded).toLocaleString(numberLocale);
            }
            return rounded.toLocaleString(numberLocale, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
            });
        };

        if (abs >= 1_000_000) return `${trim(safe / 1_000_000)}M`;
        if (abs >= 1_000) return `${trim(safe / 1_000)}K`;
        return safe.toLocaleString(numberLocale, { maximumFractionDigits: 0 });
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Full-screen blocker while a filter-triggered load is in flight,
                so filters can't be stacked on an in-flight request. */}
            <BusyOverlay visible={isLoading} />
            {/* Header with Integrated Filter */}
            <PageHeader
                title={t('owner.overview.title')}
                subtitle={t('owner.overview.subtitle', { count: establishments.length, brands: stats.totalBrands })}
                actions={
                    <>
                    <FilterBar className="w-full lg:w-auto">
                            <div className="flex-none w-full sm:w-[160px]">
                                <SingleSelect
                                    value={selectedDateRange === 'custom' ? null : selectedDateRange}
                                    onChange={(val) => setQuickDate((val || 'today') as DatePeriod)}
                                    options={localizedDateOptions}
                                    showAllOption={false}
                                    searchable={false}
                                    placeholder={formatInputPlaceholder(t('owner.overview.selectPeriod'), t('common.locale'))}
                                    className="w-full"
                                    buttonClassName={`${filterSelectButtonClass} ${selectedDateRange !== 'custom' ? filterSelectActiveClass : filterSelectInactiveClass}`}
                                />
                            </div>

                            {/* Date Input Group */}
                            <div className="w-full md:w-[240px] relative z-[60]">
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

                                <div className={`w-full md:w-auto md:min-w-[180px] relative z-[55]`}>
                                    <div className={`flex flex-col justify-center px-4 h-12 rounded-lg border transition-colors ${(startTime !== '00:00' || endTime !== '23:59') ? filterBoxActiveClass : filterBoxInactiveClass}`}>
                                        <div className="flex items-center gap-2 justify-center md:justify-between relative">
                                            <CustomTimePicker
                                                value={startTime}
                                                onChange={(val) => { setStartTime(val); }}
                                                className="flex-none"
                                                buttonClassName="justify-center md:justify-start"
                                                showIcon={true}
                                            />
                                            <span className={`text-xs font-semibold transition-colors flex-shrink-0 ${(startTime !== '00:00' || endTime !== '23:59') ? "text-emerald-700/60 dark:text-mintcom-green/60" : "text-stone-300 dark:text-zinc-700"}`}>-</span>
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
                    </FilterBar>
                    </>
                }
            />

            {/* KPI Grid — quiet support-style cards */}
            <StatCardGrid columns={3}>
                {[
                    {
                        label: t('owner.overview.activeLocations'),
                        value: stats.activeLocations,
                        icon: biIcon('bi-geo-alt'),
                        isCurrency: false,
                        sub: null as string | null,
                        info: t('owner.overview.activeLocationsInfo'),
                        route: '/owner/establishments',
                    },
                    {
                        label: t('owner.overview.totalBrands'),
                        value: stats.totalBrands,
                        icon: biIcon('bi-collection'),
                        isCurrency: false,
                        sub: null as string | null,
                        info: null as string | null,
                        route: '/owner/brands',
                    },
                    {
                        label: t('owner.overview.totalStaff'),
                        value: stats.totalEmployees,
                        icon: biIcon('bi-people'),
                        isCurrency: false,
                        sub: null as string | null,
                        info: null as string | null,
                        route: '/owner/employees',
                    },
                    {
                        label: t('owner.overview.netSales'),
                        value: stats.netSales,
                        icon: biIcon('bi-cash-coin'),
                        isCurrency: true,
                        sub: t('owner.overview.netSalesSub'),
                        info: t('owner.overview.netSalesInfo'),
                        route: undefined,
                    },
                    {
                        label: t('owner.overview.totalSales'),
                        value: stats.totalRevenue,
                        icon: biIcon('bi-wallet2'),
                        isCurrency: true,
                        sub: t('owner.overview.totalSalesSub'),
                        info: t('owner.overview.totalSalesInfo'),
                        route: undefined,
                    },
                    {
                        label: t('owner.overview.totalProfit'),
                        value: stats.totalProfit,
                        icon: biIcon('bi-graph-up-arrow'),
                        isCurrency: true,
                        sub: null as string | null,
                        info: t('owner.overview.totalProfitInfo'),
                        route: undefined,
                    },
                ].map((stat, i) => (
                    <StatCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        currency={stat.isCurrency ? (establishments?.[0]?.currency || 'JOD') : null}
                        isInteger={!stat.isCurrency}
                        icon={stat.icon}
                        iconTone="green"
                        sub={stat.sub}
                        info={stat.info}
                        route={stat.route}
                        delay={i * 0.05}
                    />
                ))}
            </StatCardGrid>

            <div className="flex flex-col lg:grid lg:grid-cols-3 lg:items-stretch gap-3">
                {/* Revenue Trend */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col h-full"
                >
                    <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
                        <div>
                            <h3 className="font-magilio text-xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('owner.overview.netSalesTrend')}</h3>
                            <p className="mt-0.5 text-[13px] text-stone-500 dark:text-zinc-400">{t('owner.overview.consolidatedPerf')}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-mintcom-green" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                                {t('owner.overview.netSales')}
                            </span>
                        </div>
                    </div>

                    <div className="h-[260px] lg:h-auto lg:flex-1 lg:min-h-[240px] w-full">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData} margin={{ top: 12, right: 12, left: 4, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7dc6a2" stopOpacity={0.18} />
                                            <stop offset="95%" stopColor="#7dc6a2" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.4} />
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
                                        tickFormatter={(value) => formatAxisCurrency(value)}
                                        width={44}
                                        dx={-2}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            borderColor: '#E5E7EB',
                                            borderRadius: '10px',
                                            fontSize: '12px',
                                            boxShadow: '0 4px 16px -8px rgba(0,0,0,0.12)',
                                        }}
                                        formatter={(value) => [formatCurrency(value as number), t('owner.overview.netSales')]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#7dc6a2"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-stone-400">
                                <Activity size={36} strokeWidth={1} className="mb-3 opacity-30" />
                                <p className="text-sm">{t('owner.overview.noData')}</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Side column */}
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col gap-3 h-full min-h-0 w-full"
                >
                    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                        <div className="mb-3">
                            <h3 className="font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('owner.overview.growBusiness')}</h3>
                            <p className="text-[13px] leading-relaxed text-stone-500 dark:text-zinc-400">{t('owner.overview.growBusinessDesc')}</p>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/onboarding?new=1')}
                                className={primaryButtonClass}
                            >
                                {t('owner.overview.addLocation')}
                            </button>
                            <button
                                onClick={() => navigate('/owner/brands')}
                                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 text-[13px] font-semibold text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                            >
                                {t('owner.overview.manageBrands')}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col">
                        <h4 className="font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100 mb-3 shrink-0">{t('owner.overview.quickManagement')}</h4>
                        <div className="space-y-2 mt-auto">
                            <button
                                onClick={() => navigate('/owner/employees')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/60"
                            >
                                <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300">
                                    <UserPlus size={15} strokeWidth={1.75} />
                                </div>
                                <span className="font-semibold text-stone-700 dark:text-zinc-200">{t('owner.overview.staffManagement')}</span>
                                <Activity size={13} className="ms-auto text-stone-300" />
                            </button>
                            <button
                                onClick={() => navigate('/owner/establishments')}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors hover:bg-stone-50 dark:hover:bg-zinc-800/60"
                            >
                                <div className="h-8 w-8 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300">
                                    <Store size={15} strokeWidth={1.75} />
                                </div>
                                <span className="font-semibold text-stone-700 dark:text-zinc-200">{t('owner.overview.manageLocations')}</span>
                                <Activity size={13} className="ms-auto text-stone-300" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

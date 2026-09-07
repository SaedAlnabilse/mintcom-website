import {
  TrendingUp,
  Wallet,
  Activity,
  ExternalLink,
  CreditCard,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { biIcon } from '../../../ui/BiIcon';
import { motion } from 'framer-motion';
import { ComposedChart, Area, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../../utils/dateLocale';
import { parseChartDate } from '../../../../utils/chartDate';
import { useCurrency } from '../../../../context/CurrencyContext';
import { useTheme } from '../../../../context/ThemeContext';
import type { SalesSummary } from '../../../../types';
import { useNavigate, useParams } from 'react-router-dom';
import React, { useState, useMemo } from 'react';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';
import { StatValue } from '../../../../components/ui/StatValue';
import { formatPaymentBrandName } from '../../../../utils/paymentCard';
import { formatBucketLabel } from '../../../../utils/reportBuckets';
import { formatDurationMs, hoursToMs } from '../../../../utils/shiftDuration';

const COLORS = [
  '#7dc6a2',
  '#3b82f6',
  '#f59e0b',
  '#D55263',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#06b6d4',
  '#6366f1',
  '#f97316',
  '#84cc16',
  '#a855f7',
];

const isCardMethod = (name: string) => {
  const n = String(name).toUpperCase();
  return (
    n === 'CARD' ||
    n === 'CARDS' ||
    n.includes('VISA') ||
    n.includes('MASTER') ||
    n.includes('AMEX') ||
    n.includes('MADA') ||
    n.includes('CREDIT') ||
    n.includes('DEBIT') ||
    n.includes('MEEZA') ||
    n.includes('DISCOVER') ||
    n.includes('JCB') ||
    n.includes('UNIONPAY')
  );
};

const isCashMethod = (name: string) => {
  const n = String(name).toUpperCase();
  return n === 'CASH' || n === 'MONEY';
};

const isOtherMethod = (name: string) => {
  return !isCashMethod(name) && !isCardMethod(name);
};

/** Evenly spaced, rounded Y-axis ticks so the scale isn't just 0 and max. */
function buildYAxisScale(minValue: number, maxValue: number, tickCount = 5) {
  const min = Number.isFinite(minValue) ? minValue : 0;
  const max = Number.isFinite(maxValue) && maxValue > min ? maxValue : min + 100;
  const hasNegative = min < 0;
  const spanMin = hasNegative ? min : 0;
  const roughStep = (max - spanMin) / Math.max(tickCount - 1, 1);
  const magnitude = Math.pow(10, Math.floor(Math.log10(Math.max(Math.abs(roughStep), 1e-9))));
  const residual = roughStep / magnitude;
  const niceFactor = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = niceFactor * magnitude;
  const niceMin = hasNegative ? Math.floor(spanMin / step) * step : 0;
  const niceMax = Math.ceil(max / step) * step || step;
  const ticks: number[] = [];
  for (let v = niceMin; v <= niceMax + step * 1e-9; v += step) {
    ticks.push(Math.abs(v) < 1e-9 ? 0 : Number(v.toPrecision(12)));
  }
  if (hasNegative && !ticks.some((t) => t === 0)) {
    ticks.push(0);
    ticks.sort((a, b) => a - b);
  }
  return { domain: [niceMin, niceMax] as [number, number], ticks };
}

const CurrencyAmount = ({ amount, size = "text-2xl", color = "text-gray-900 dark:text-white" }: { amount: number, size?: string, color?: string }) => {
  const { currencySymbol } = useCurrency();
  return (
    <StatValue 
      value={amount} 
      currency={currencySymbol} 
      className={`${size} ${color}`}
    />
  );
};

const FormatCurrency = ({ value }: { value: number }) => {
  const { currencySymbol } = useCurrency();
  return (
    <StatValue 
      value={value} 
      currency={currencySymbol} 
      className="text-sm"
    />
  );
};

interface SalesViewProps {
  salesData: SalesSummary;
  selectedDateRange: string;
  setShowPayInOutModal: (show: boolean) => void;
}

export const SalesView = React.memo(function SalesView({ salesData, selectedDateRange, setShowPayInOutModal }: SalesViewProps) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();
  const { locationSlug } = useParams();
  const grossSales = salesData.totalRevenue ?? 0;
  const taxCollected = salesData.taxCollected ?? 0;
  const serviceChargeCollected = salesData.netServiceChargeCollected ?? salesData.serviceChargeCollected ?? 0;

  const getMethodName = (name: any) => {
    if (!name) return '—';
    const nameStr = String(name).toUpperCase();
    if (nameStr === 'CARD') return t('orders.payment.allCards');
    if (nameStr === 'CASH') return t('orders.payment.cash');
    if (nameStr === 'OTHER') return t('orders.payment.allOther');
    return formatPaymentBrandName(String(name));
  };

  const netSales = Math.max(
    salesData.netSalesBeforeTaxAndServiceCharge ?? (grossSales - taxCollected - serviceChargeCollected),
    0,
  );
  // Gross with tax removed but service charge kept — the figure that matches
  // the "Total Sales (Excl. Tax)" column in the exports.
  const salesExclTax = salesData.totalSalesExcludingTax ?? (grossSales - taxCollected);
  const totalOrders = salesData.totalOrders ?? 0;
  const averageOrderValue = salesData.averageOrderValue ?? (totalOrders > 0 ? grossSales / totalOrders : 0);
  const [salesPaymentTab, setSalesPaymentTab] = useState<'all' | 'cards' | 'others'>('all');

  const rawPaymentMethodBreakdown = useMemo(() => (salesData.paymentMethodBreakdown || [])
    .map((item: any) => {
      const value = Number(item.value ?? item.amount ?? item.total ?? 0);
      const safeValue = Number.isFinite(value) ? value : 0;
      return {
        ...item,
        value: safeValue,
        chartValue: Math.abs(safeValue),
      };
    }), [salesData.paymentMethodBreakdown]);

  const cardsData = useMemo(() => {
    if (salesData.cardTypeBreakdown && salesData.cardTypeBreakdown.length > 0) {
      return salesData.cardTypeBreakdown
        .map((item: any) => ({
          ...item,
          value: Number(item.value ?? item.amount ?? 0),
          chartValue: Math.abs(Number(item.value ?? item.amount ?? 0)),
        }))
        .filter((item: any) => item.value > 0);
    }
    return rawPaymentMethodBreakdown.filter((r: any) => isCardMethod(r.name));
  }, [salesData.cardTypeBreakdown, rawPaymentMethodBreakdown]);

  const othersData = useMemo(() => {
    if (salesData.otherPaymentBreakdown && salesData.otherPaymentBreakdown.length > 0) {
      return salesData.otherPaymentBreakdown
        .map((item: any) => ({
          ...item,
          value: Number(item.value ?? item.amount ?? 0),
          chartValue: Math.abs(Number(item.value ?? item.amount ?? 0)),
        }))
        .filter((item: any) => item.value > 0);
    }
    return rawPaymentMethodBreakdown.filter((r: any) => isOtherMethod(r.name));
  }, [salesData.otherPaymentBreakdown, rawPaymentMethodBreakdown]);

  const currentPaymentData = useMemo(() => {
    if (salesPaymentTab === 'cards') return cardsData;
    if (salesPaymentTab === 'others') return othersData;
    return rawPaymentMethodBreakdown;
  }, [salesPaymentTab, cardsData, othersData, rawPaymentMethodBreakdown]);

  const currentPaymentTotal = useMemo(
    () => currentPaymentData.reduce((sum: number, item: any) => sum + Math.max(item.value, 0), 0),
    [currentPaymentData]
  );
  const hasPaymentData = currentPaymentTotal > 0.005;
  // Recharts hides zero-value slices — use a single gray ring when empty.
  const emptyFill = isDark ? '#334155' : '#e5e7eb';
  const pieData = hasPaymentData
    ? currentPaymentData
    : [{ name: '__empty__', value: 0, chartValue: 1 }];

  return (
    <div className="space-y-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          {
            label: t('orders.reports.sales.totalSales'),
            amount: grossSales,
            isCurrency: true,
            icon: biIcon('bi-wallet2'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.totalIncTax')
          },
          {
            label: t('orders.reports.export.salesExclTax'),
            amount: salesExclTax,
            isCurrency: true,
            icon: biIcon('bi-receipt'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.exclTax')
          },
          {
            label: t('orders.reports.export.averageOrderValue'),
            amount: averageOrderValue,
            isCurrency: true,
            icon: biIcon('bi-calculator'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.totalIncTax')
          },
          {
            label: t('orders.reports.sales.netSales'),
            amount: netSales,
            isCurrency: true,
            icon: biIcon('bi-cash-coin'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.exclTax')
          },
          {
            label: t('orders.reports.sales.profit'),
            amount: (salesData.grossProfit ?? 0),
            isCurrency: true,
            icon: biIcon('bi-graph-up-arrow'),
            color: (salesData.grossProfit ?? 0) >= 0 ? 'text-mintcom-green' : 'text-red-500',
            bg: (salesData.grossProfit ?? 0) >= 0 ? 'bg-mintcom-green/10' : 'bg-red-500/10',
            sub: t('orders.reports.sales.netSalesCost')
          },
          {
            label: t('orders.reports.sales.totalTax'),
            amount: (salesData.taxCollected ?? 0),
            isCurrency: true,
            icon: biIcon('bi-receipt'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.taxAmount')
          },
          {
            label: t('orders.reports.sales.serviceCharge', { defaultValue: 'Service Charge' }),
            amount: serviceChargeCollected,
            isCurrency: true,
            icon: biIcon('bi-credit-card'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.serviceChargeSub', {
              defaultValue: '{{count}} orders | avg {{avg}}',
              count: salesData.serviceChargeOrderCount ?? 0,
              avg: `${Number(salesData.averageServiceChargePerOrder ?? 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`,
            })
          },
          {
            label: t('orders.reports.sales.numOrders'),
            labelClassName: 'capitalize-none',
            value: totalOrders,
            isCurrency: false,
            suffix: t('dashboard.stats.orders'),
            icon: biIcon('bi-receipt-cutoff'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.completed')
          },
          {
            label: t('orders.reports.sales.refunds'),
            amount: (salesData.totalRefunds ?? 0),
            isCurrency: true,
            icon: biIcon('bi-arrow-counterclockwise'),
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            sub: t('orders.reports.sales.returns')
          },
          {
            label: t('orders.reports.sales.hours'),
            value: null,
            isCurrency: false,
            icon: biIcon('bi-clock-history'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.staffHours'),
            // Same "2h 15m" shape as the Shifts and Staff tabs (and the POS and
            // admin app) — a bare "7.5" reads as money and never matches the
            // per-shift durations it is the sum of.
            customContent: (
              <>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatDurationMs(t, hoursToMs(salesData.totalHoursWorked ?? 0))}
                </p>
                <p className="sentence-case-text text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                  {t('orders.reports.sales.staffHours')}
                </p>
              </>
            ),
            onClick: () => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => navigate(`/dashboard/${locationSlug}/reports/shifts`), 700);
            }
          },
          {
            label: t('orders.reports.sales.nonSales'),
            value: null,
            icon: biIcon('bi-arrow-left-right'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: null,
            customContent: (
              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">{t('orders.reports.sales.payIn')}</span>
                  <CurrencyAmount amount={salesData.totalPayIn ?? 0} size="text-sm" color="text-mintcom-green" />
                </div>
                <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">{t('orders.reports.sales.payOut')}</span>
                  <CurrencyAmount amount={salesData.totalPayOut ?? 0} size="text-sm" color="text-red-500" />
                </div>
              </div>
            ),
            onClick: () => setShowPayInOutModal(true)
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={stat.onClick}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300 overflow-hidden ${stat.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className={`absolute top-0 end-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                  <stat.icon size={20} />
                </div>
                {stat.onClick && (
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-mintcom-green transition-colors">
                    <ExternalLink size={14} />
                  </div>
                )}
              </div>
              <p className={`dashboard-stat-title mb-1 flex items-center gap-1 ${stat.labelClassName || ''}`}>
                {stat.label}
              </p>
              {stat.customContent ? (
                stat.customContent
              ) : (
                <>
                  <StatValue 
                    value={stat.isCurrency ? (stat.amount || 0) : (stat.value || 0)} 
                    currency={stat.isCurrency ? currencySymbol : null}
                    className="text-2xl"
                    isInteger={!stat.isCurrency}
                  />
                  <p className="sentence-case-text text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                    {stat.sub}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('orders.reports.sales.revenueStats')}
                </h3>
                <p className="card-subtitle">{t('orders.reports.sales.performance')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <Activity size={12} className="text-mintcom-green" />
              <span className="sentence-case-text text-xs font-bold text-gray-500 tracking-wide">{t('orders.reports.sales.realtime')}</span>
            </div>
          </div>
          <div className="h-[400px]">
            <div className="flex h-full relative" dir="ltr">
              {(() => {
                const isHourly = salesData.dailyBreakdown?.some((d: any) => d.date.includes(':'));
                // Long ranges come back rolled up per month (keyed by the 1st).
                const isMonthly = salesData.granularity === 'month';
                let chartData = salesData.dailyBreakdown || [];

                // Determine if we need daily aggregation (for week/month views)
                const needsDailyAggregation = ['this_week', 'this_month', 'last_30'].includes(selectedDateRange) && isHourly;

                // If it's "Yesterday" or "Today" and we have hourly data, fill in the missing hours to show a full 24h timeline
                if (['yesterday', 'today'].includes(selectedDateRange) && isHourly && chartData.length > 0) {
                  const allHours = Array.from({ length: 24 }, (_, i) => {
                    const hourStr = `${String(i).padStart(2, '0')}:00`;
                    // Aggregate all sales within this hour
                    const hourItems = chartData.filter((d: any) => {
                      if (d.date === hourStr) return true;
                      const date = new Date(d.date);
                      if (!isNaN(date.getTime())) {
                        return date.getHours() === i;
                      }
                      // For "10:30" format that might not be full date
                      if (d.date.includes(':')) {
                        const h = parseInt(d.date.split(':')[0]);
                        return h === i;
                      }
                      return false;
                    });

                    if (hourItems.length > 0) {
                      return {
                        date: hourStr,
                        revenue: hourItems.reduce((sum, d) => sum + (Number.isFinite(Number(d.revenue)) ? Number(d.revenue) : 0), 0),
                        count: hourItems.reduce((sum, d) => sum + (Number.isFinite(Number(d.count)) ? Number(d.count) : 0), 0)
                      };
                    }
                    return { date: hourStr, revenue: 0, count: 0 };
                  });
                  chartData = allHours;
                }

                if (needsDailyAggregation) {
                  const dailyMap: { [key: string]: any } = {};
                  chartData.forEach((d: any) => {
                    const dateObj = new Date(d.date);
                    if (!isNaN(dateObj.getTime())) {
                      const dayKey = dateObj.toISOString().split('T')[0];
                      const dateLocale = getDateLocale(t('common.locale'));
                      const dayName = format(dateObj, 'EEE', { locale: dateLocale });
                      const fullDate = format(dateObj, 'MMM d', { locale: dateLocale });
                      if (!dailyMap[dayKey]) {
                        dailyMap[dayKey] = {
                          date: dayKey,
                          revenue: 0,
                          displayDate: selectedDateRange === 'this_week' ? dayName : fullDate,
                          count: 0
                        };
                      }
                      dailyMap[dayKey].revenue += Number.isFinite(Number(d.revenue)) ? Number(d.revenue) : 0;
                      dailyMap[dayKey].count += Number.isFinite(Number(d.count)) ? Number(d.count) : 0;
                    }
                  });
                  chartData = Object.values(dailyMap).sort((a: any, b: any) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                }

                const revenueValues = chartData.map((d: any) => {
                  const value = Number(d.revenue);
                  return Number.isFinite(value) ? value : 0;
                });
                const maxRevenue = revenueValues.length > 0 ? Math.max(...revenueValues) : 0;
                const minRevenue = revenueValues.length > 0 ? Math.min(...revenueValues) : 0;
                const { domain: yDomain, ticks: yTicks } = buildYAxisScale(
                  minRevenue < 0 ? minRevenue : 0,
                  maxRevenue > 0 ? maxRevenue : 100,
                  5,
                );
                const [minY, maxY] = yDomain;
                const hasRevenueData = revenueValues.some((value) => Math.abs(value) > 0.005);

                if (!hasRevenueData) {
                  return (
                    <AnalyticsEmptyState
                      icon={Activity}
                      title={t('orders.reports.sales.noRevenue')}
                      description={t('orders.reports.sales.noRevenueDesc')}
                      className="h-full w-full rounded-2xl bg-gray-50/50 dark:bg-black/20 border border-dashed border-gray-200 dark:border-white/[0.03]"
                    />
                  );
                }

                return (
                  <>
                    <div className="absolute start-0 top-0 bottom-0 w-[56px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to ' + (t('common.locale') === 'ar' ? 'left' : 'right') + ', ' + (isDark ? '#1E293B 80%, transparent' : '#FFFFFF 80%, transparent') + ')' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontWeight: '700' }}
                            axisLine={false}
                            tickFormatter={(val) =>
                              Number(val).toLocaleString(t('common.locale'), {
                                maximumFractionDigits: Number(val) % 1 === 0 ? 0 : 1,
                              })
                            }
                            domain={yDomain}
                            ticks={yTicks}
                            interval={0}
                            width={48}
                          />
                          <Area dataKey="revenue" stroke="none" fill="none" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 overflow-x-auto overflow-y-hidden ps-[56px] scrollbar-none scroll-smooth" ref={(el) => {
                      // Auto-scroll to the end (latest hours) so recent sales are visible
                      if (el && isHourly && !needsDailyAggregation) {
                        el.scrollLeft = el.scrollWidth;
                      }
                    }}>
                      <div style={{ width: isHourly && !needsDailyAggregation ? `${Math.max(800, chartData.length * 65)}px` : chartData.length > 1 ? `${Math.max(800, chartData.length * 85)}px` : '100%', height: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={chartData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                          >
                            <defs>
                              <linearGradient id="colorRevenuePremium" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#7dc6a2" stopOpacity={0.4} />
                                <stop offset="60%" stopColor="#7dc6a2" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#7dc6a2" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="0 0" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                            <XAxis
                              dataKey={needsDailyAggregation ? "displayDate" : "date"}
                              stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                              fontSize={10}
                              tickLine={false}
                              axisLine={{ stroke: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)", strokeWidth: 1 }}
                              tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontWeight: '700' }}
                              tickFormatter={(val) => {
                                const dateLocale = getDateLocale(t('common.locale'));
                                if (needsDailyAggregation) return val;
                                if (val.length === 5 && val.includes(':')) return val;
                                if (isMonthly) return formatBucketLabel(val, 'month', t('common.locale'));
                                const date = parseChartDate(val);
                                return !isNaN(date.getTime()) ? (val.includes(':') ? format(date, 'HH:00', { locale: dateLocale }) : format(date, 'MMM d', { locale: dateLocale })) : val;
                              }}
                              dy={15}
                              interval={isHourly && !needsDailyAggregation ? 0 : "preserveStartEnd"}
                            />
                            <YAxis hide domain={[minY, maxY]} />
                            <Tooltip
                              cursor={chartData.length > 1 ? { stroke: '#7dc6a2', strokeWidth: 2, strokeDasharray: '6 6' } : false}
                              formatter={(val: any) => [`${Number(val).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`, t('dashboard.revenueChart.revenue')]}
                              contentStyle={{
                                backgroundColor: isDark ? '#0B1120' : '#fff',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                padding: '12px'
                              }}
                              itemStyle={{ color: '#7dc6a2', fontWeight: '900', fontSize: '12px' }}
                              labelStyle={{ fontWeight: '900', color: isDark ? '#fff' : '#000', marginBottom: '8px', fontSize: '10px' }}
                              labelFormatter={(val, payload) => {
                                const dateLocale = getDateLocale(t('common.locale'));
                                if (needsDailyAggregation && payload && payload[0]?.payload?.date) {
                                  const dateStr = payload[0].payload.date;
                                  return !isNaN(new Date(dateStr).getTime()) ? format(new Date(dateStr), 'EEEE, MMM d, yyyy', { locale: dateLocale }) : val;
                                }
                                if (val.length === 5 && val.includes(':')) return val;
                                const date = parseChartDate(val);
                                if (isNaN(date.getTime())) return val;
                                // A month bucket covers the whole month, so a
                                // day and clock time would both be fiction.
                                if (isMonthly) return format(date, 'MMMM yyyy', { locale: dateLocale });
                                return format(date, 'MMM d, yyyy HH:mm', { locale: dateLocale });
                              }}
                            />
                            {isHourly && !needsDailyAggregation ? (
                              <Bar 
                                dataKey="revenue" 
                                fill="url(#colorRevenuePremium)" 
                                barSize={chartData.length > 24 ? 20 : 40} 
                                radius={[8, 8, 0, 0]} 
                                animationDuration={1500} 
                              />
                            ) : chartData.length === 1 ? (
                              <Bar 
                                dataKey="revenue" 
                                fill="url(#colorRevenuePremium)" 
                                barSize={60} 
                                radius={[8, 8, 0, 0]} 
                                animationDuration={1500} 
                              />
                            ) : (
                              <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="#7dc6a2"
                                strokeWidth={6}
                                fillOpacity={1}
                                fill="url(#colorRevenuePremium)"
                                animationDuration={1500}
                                strokeLinecap="round"
                              />
                            )}
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Payment Source Breakdown */}
        <div className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('orders.reports.sales.paymentMethods')}</h3>
                <p className="card-subtitle">{t('orders.reports.sales.breakdown')}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/dashboard/${locationSlug}/reports/payments`)}
              className="text-xs font-bold text-mintcom-green hover:underline tracking-wide shrink-0"
            >
              {t('orders.reports.sales.viewAll')}
            </button>
          </div>

          {/* Clickable Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-100/80 dark:bg-white/5 rounded-xl mb-3">
            <button
              type="button"
              onClick={() => setSalesPaymentTab('all')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                salesPaymentTab === 'all'
                  ? 'bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Layers size={13} className="shrink-0" />
              <span>{t('orders.payment.all', { defaultValue: 'All' })}</span>
            </button>
            <button
              type="button"
              onClick={() => setSalesPaymentTab('cards')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                salesPaymentTab === 'cards'
                  ? 'bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CreditCard size={13} className="shrink-0" />
              <span>{t('orders.payment.allCards', { defaultValue: 'Cards' })}</span>
              {cardsData.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  salesPaymentTab === 'cards' ? 'bg-mintcom-green/15 text-mintcom-green' : 'bg-gray-200/70 dark:bg-white/10 text-gray-500'
                }`}>
                  {cardsData.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setSalesPaymentTab('others')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                salesPaymentTab === 'others'
                  ? 'bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Wallet size={13} className="shrink-0" />
              <span>{t('orders.payment.allOther', { defaultValue: 'Others' })}</span>
              {othersData.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                  salesPaymentTab === 'others' ? 'bg-mintcom-green/15 text-mintcom-green' : 'bg-gray-200/70 dark:bg-white/10 text-gray-500'
                }`}>
                  {othersData.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center min-h-0">
            <div className="h-[150px] w-full" dir="ltr">
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={1}
                minHeight={1}
                initialDimension={{ width: 320, height: 150 }}
              >
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={hasPaymentData && pieData.length > 1 ? 4 : 0}
                    dataKey="chartValue"
                    animationDuration={hasPaymentData ? 1500 : 0}
                    stroke="none"
                    isAnimationActive={hasPaymentData}
                  >
                    {pieData.map((_: any, index: number) => (
                      <Cell
                        key={index}
                        fill={hasPaymentData ? COLORS[index % COLORS.length] : emptyFill}
                      />
                    ))}
                  </Pie>
                  {hasPaymentData && (
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0B1120' : '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)',
                        padding: '12px'
                      }}
                      itemStyle={{
                        color: isDark ? '#fff' : '#111',
                        fontWeight: 'bold',
                        fontSize: '11px'
                      }}
                      formatter={(val: any, _name: any, entry: any) => {
                        const signedValue = Number(entry?.payload?.value ?? val);
                        return [
                          <StatValue
                            key="val"
                            value={signedValue}
                            currency={currencySymbol}
                            className="text-sm font-bold"
                          />,
                          getMethodName(String(entry?.payload?.name ?? '')),
                        ];
                      }}
                      position={{ y: -10 }}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Scrollable Legend (never stretches the card) */}
            <div className="max-h-[145px] overflow-y-auto custom-scrollbar space-y-1 mt-2 pr-1">
              {currentPaymentData.length > 0 ? (
                currentPaymentData.map((item: any, i: number) => {
                  const percentage = currentPaymentTotal > 0 ? (Math.max(Number(item.value) || 0, 0) / currentPaymentTotal) : 0;
                  const isCard = salesPaymentTab === 'all' && (item.name.toUpperCase() === 'CARD' || item.name.toUpperCase() === 'CARDS');
                  const isOther = salesPaymentTab === 'all' && (item.name.toUpperCase() === 'OTHER' || item.name.toUpperCase() === 'OTHERS');
                  const isClickable = isCard || isOther;

                  return (
                    <div
                      key={`${item.name}-${i}`}
                      onClick={() => {
                        if (isCard && cardsData.length > 0) setSalesPaymentTab('cards');
                        if (isOther && othersData.length > 0) setSalesPaymentTab('others');
                      }}
                      className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-all ${
                        isClickable
                          ? 'cursor-pointer hover:bg-mintcom-green/5 dark:hover:bg-white/5 active:scale-[0.99] group/item'
                          : 'hover:bg-gray-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: hasPaymentData ? COLORS[i % COLORS.length] : emptyFill }}
                        />
                        <span className="sentence-case-text text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{getMethodName(item.name)}</span>
                        {isClickable && (
                          <ChevronRight
                            size={13}
                            className="text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-gray-900 dark:text-white"><FormatCurrency value={item.value} /></span>
                        <StatValue value={percentage} isPercentage={true} className="text-xs font-bold text-gray-500 min-w-[36px] text-end" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-4 text-center text-xs text-gray-400 font-medium">
                  {t('common.noData', { defaultValue: 'No payment data available' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

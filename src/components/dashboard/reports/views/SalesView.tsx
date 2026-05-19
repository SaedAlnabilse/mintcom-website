import {
  TrendingUp,
  Wallet,
  DollarSign,
  Percent,
  ShoppingBag,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Activity,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ComposedChart, Area, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../../utils/dateLocale';
import { useCurrency } from '../../../../context/CurrencyContext';
import { useTheme } from '../../../../context/ThemeContext';
import type { SalesSummary } from '../../../../types';
import { useNavigate, useParams } from 'react-router-dom';
import React from 'react';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';

const COLORS = ['#7dc6a2', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CurrencyAmount = ({ amount, className = "", size = "text-2xl", color = "text-gray-900 dark:text-white" }: { amount: number, className?: string, size?: string, color?: string }) => {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className={`${size} font-bold ${color} tracking-tight`}>
        {amount.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currencySymbol}</span>
    </span>
  );
};

const FormatCurrency = ({ value }: { value: number }) => {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-bold tracking-tight">
        {value.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currencySymbol}</span>
    </span>
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
  const netSales = Math.max(
    salesData.netSalesBeforeTaxAndServiceCharge ?? (grossSales - taxCollected - serviceChargeCollected),
    0,
  );
  const paymentMethodBreakdown = (salesData.paymentMethodBreakdown || [])
    .map((item: any) => {
      const value = Number(item.value ?? item.amount ?? item.total ?? 0);
      const safeValue = Number.isFinite(value) ? value : 0;
      return {
        ...item,
        value: safeValue,
        chartValue: Math.abs(safeValue),
      };
    })
    .filter((item: any) => item.chartValue > 0.005);

  return (
    <div className="space-y-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          {
            label: t('orders.reports.sales.totalSales'),
            amount: grossSales,
            isCurrency: true,
            icon: Wallet,
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.totalIncTax')
          },
          {
            label: t('orders.reports.sales.netSales'),
            amount: netSales,
            isCurrency: true,
            icon: TrendingUp,
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.exclTax')
          },
          {
            label: t('orders.reports.sales.profit'),
            amount: (salesData.grossProfit ?? 0),
            isCurrency: true,
            icon: DollarSign,
            color: (salesData.grossProfit ?? 0) >= 0 ? 'text-mintcom-green' : 'text-red-500',
            bg: (salesData.grossProfit ?? 0) >= 0 ? 'bg-mintcom-green/10' : 'bg-red-500/10',
            sub: t('orders.reports.sales.netSalesCost')
          },
          {
            label: t('orders.reports.sales.totalTax'),
            amount: (salesData.taxCollected ?? 0),
            isCurrency: true,
            icon: Percent,
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.taxAmount')
          },
          {
            label: t('orders.reports.sales.serviceCharge', { defaultValue: 'Service Charge' }),
            amount: serviceChargeCollected,
            isCurrency: true,
            icon: CreditCard,
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.serviceChargeSub', {
              defaultValue: '{{count}} orders | avg {{avg}}',
              count: salesData.serviceChargeOrderCount ?? 0,
              avg: `${currencySymbol}${Number(salesData.averageServiceChargePerOrder ?? 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            })
          },
          {
            label: t('orders.reports.sales.numOrders'),
            labelClassName: 'capitalize-none',
            value: (salesData.totalOrders ?? 0).toLocaleString(t('common.locale')),
            suffix: t('dashboard.stats.orders'),
            icon: ShoppingBag,
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.completed')
          },
          {
            label: t('orders.reports.sales.refunds'),
            amount: (salesData.totalRefunds ?? 0),
            isCurrency: true,
            icon: ArrowDownRight,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            sub: t('orders.reports.sales.returns')
          },
          {
            label: t('orders.reports.sales.hours'),
            value: (salesData.totalHoursWorked ?? 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            suffix: t('orders.reports.sales.hours'),
            icon: Clock,
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            sub: t('orders.reports.sales.staffHours'),
            onClick: () => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => navigate(`/dashboard/${locationSlug}/reports/shifts`), 700);
            }
          },
          {
            label: t('orders.reports.sales.nonSales'),
            value: null,
            icon: ArrowUpRight,
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
                  <p className="flex flex-col">
                    {stat.isCurrency ? (
                      <CurrencyAmount amount={stat.amount || 0} color={stat.color.startsWith('text-mintcom-green') ? "text-gray-900 dark:text-white" : stat.color} />
                    ) : (
                      <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {stat.value}
                        {stat.suffix && <span className="text-sm ml-1 text-gray-400 font-black">{stat.suffix}</span>}
                      </span>
                    )}
                  </p>
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
                const maxY = maxRevenue > 0 ? maxRevenue : 100;
                const minY = minRevenue < 0 ? minRevenue : 0;
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
                    <div className="absolute start-0 top-0 bottom-0 w-[50px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to ' + (t('common.locale') === 'ar' ? 'left' : 'right') + ', ' + (isDark ? '#1E293B 80%, transparent' : '#FFFFFF 80%, transparent') + ')' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => val.toLocaleString(t('common.locale'), { maximumFractionDigits: 1 })}
                            domain={[minY, maxY]}
                            ticks={minY < 0 ? [minY, 0, maxY] : [0, maxY / 2, maxY]}
                            width={40}
                          />
                          <Area dataKey="revenue" stroke="none" fill="none" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 overflow-x-auto overflow-y-hidden ps-[50px] scrollbar-none scroll-smooth" ref={(el) => {
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
                                const date = new Date(val);
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
                                const date = new Date(val);
                                return !isNaN(date.getTime()) ? format(date, 'MMM d, yyyy HH:mm', { locale: dateLocale }) : val;
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
              className="text-xs font-bold text-mintcom-green hover:underline tracking-wide"
            >
              {t('orders.reports.sales.viewAll')}
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {paymentMethodBreakdown.length > 0 ? (
              <>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodBreakdown}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="chartValue"
                        animationDuration={1500}
                        stroke="none"
                      >
                        {paymentMethodBreakdown.map((_: any, index: number) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
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
                          return (
                            <span className="inline-flex items-baseline gap-1">
                              <span className="font-bold tracking-tight">
                                {signedValue.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">{currencySymbol}</span>
                            </span>
                          );
                        }}
                        position={{ y: -10 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {paymentMethodBreakdown.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="sentence-case-text text-sm font-bold text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white"><FormatCurrency value={item.value} /></span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <AnalyticsEmptyState
                icon={CreditCard}
                title={t('dashboard.paymentMethods.noData')}
                description={t('orders.reports.sales.breakdown')}
                compact
                className="h-full"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});



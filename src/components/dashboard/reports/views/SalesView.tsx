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

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface SalesViewProps {
  salesData: SalesSummary;
  selectedDateRange: string;
  setShowPayInOutModal: (show: boolean) => void;
}

export const SalesView = React.memo(function SalesView({ salesData, selectedDateRange, setShowPayInOutModal }: SalesViewProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { formatAmount } = useCurrency();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();
  const { locationSlug } = useParams();

  const formatCurrency = (value: number) => formatAmount(value);

  return (
    <div className="space-y-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[
          {
            label: t('orders.reports.sales.totalSales'),
            value: ((salesData.totalRevenue || 0) + (salesData.taxCollected || 0)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            icon: Wallet,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            sub: t('orders.reports.sales.totalIncTax')
          },
          {
            label: t('orders.reports.sales.netSales'),
            value: (salesData.totalRevenue || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            icon: TrendingUp,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            sub: t('orders.reports.sales.exclTax')
          },
          {
            label: t('orders.reports.sales.profit'),
            value: (salesData.grossProfit || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            icon: DollarSign,
            color: (salesData.grossProfit || 0) >= 0 ? 'text-paymint-green' : 'text-red-500',
            bg: (salesData.grossProfit || 0) >= 0 ? 'bg-paymint-green/10' : 'bg-red-500/10',
            sub: t('orders.reports.sales.netSalesCost')
          },
          {
            label: t('orders.reports.sales.totalTax'),
            value: (salesData.taxCollected || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            icon: Percent,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            sub: t('orders.reports.sales.taxAmount')
          },
          {
            label: t('orders.reports.sales.numOrders'),
            value: (salesData.totalOrders || 0).toLocaleString(t('common.locale')),
            suffix: t('dashboard.stats.orders'),
            icon: ShoppingBag,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            sub: t('orders.reports.sales.completed')
          },
          {
            label: t('orders.reports.sales.refunds'),
            value: (salesData.totalRefunds || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            icon: ArrowDownRight,
            color: 'text-red-500',
            bg: 'bg-red-500/10',
            sub: t('orders.reports.sales.returns')
          },
          {
            label: t('orders.reports.sales.hours'),
            value: (salesData.totalHoursWorked || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            suffix: t('orders.reports.sales.hours'),
            icon: Clock,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
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
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            sub: null,
            customContent: (
              <div className="w-full mt-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">{t('orders.reports.sales.payIn')}</span>
                  <span className="text-sm font-bold text-paymint-green tracking-tight">+{ (salesData.totalPayIn || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</span>
                </div>
                <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-400">{t('orders.reports.sales.payOut')}</span>
                  <span className="text-sm font-bold text-red-500 tracking-tight">-{ (salesData.totalPayOut || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</span>
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
            className={`group relative p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col transition-all duration-300 overflow-hidden ${stat.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className={`absolute top-0 end-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                  <stat.icon size={20} />
                </div>
                {stat.onClick && (
                  <ExternalLink size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-paymint-green transition-colors" />
                )}
              </div>
              <p className="text-xs font-bold text-gray-400 tracking-wide mb-1 flex items-center gap-1">
                {stat.label}
              </p>
              {stat.customContent ? (
                stat.customContent
              ) : (
                <>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {stat.value}
                    {stat.suffix && <span className="text-base ml-1 text-gray-300 dark:text-gray-500">{stat.suffix}</span>}
                  </p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
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
        <div className="lg:col-span-2 p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="text-paymint-green" size={20} />
                {t('orders.reports.sales.revenueStats')}
              </h3>
              <p className="card-subtitle">{t('orders.reports.sales.performance')}</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
              <Activity size={12} className="text-paymint-green" />
              <span className="text-xs font-bold text-gray-500 tracking-wide">{t('orders.reports.sales.realtime')}</span>
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
                        revenue: hourItems.reduce((sum, d) => sum + (Number(d.revenue) || 0), 0),
                        count: hourItems.reduce((sum, d) => sum + (Number(d.count) || 0), 0)
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
                      dailyMap[dayKey].revenue += Number(d.revenue) || 0;
                      dailyMap[dayKey].count += Number(d.count) || 0;
                    }
                  });
                  chartData = Object.values(dailyMap).sort((a: any, b: any) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
                  );
                }

                const maxRevenue = chartData.length > 0
                  ? Math.max(...chartData.map((d: any) => Number(d.revenue) || 0))
                  : 100;
                const maxY = maxRevenue > 0 ? maxRevenue : 100;
                const hasRevenueData = chartData.length > 0 && chartData.some((d: any) => Number(d.revenue) > 0);

                if (!hasRevenueData) {
                  return (
                    <div className="h-full w-full flex flex-col items-center justify-center space-y-4 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.03]">
                      <div className="p-5 rounded-full bg-gray-100 dark:bg-white/5">
                        <Activity size={36} className="text-gray-400 dark:text-gray-600" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">{t('orders.reports.sales.noRevenue')}</p>
                        <p className="card-subtitle">{t('orders.reports.sales.noRevenueDesc')}</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    <div className="absolute start-0 top-0 bottom-0 w-[50px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to ' + (t('common.locale') === 'ar' ? 'left' : 'right') + ', ' + (isDark ? '#0B1120 80%, transparent' : '#FFFFFF 80%, transparent') + ')' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(val) => val.toLocaleString(t('common.locale'), { maximumFractionDigits: 1 })}
                            domain={[0, maxY]}
                            ticks={[0, maxY / 2, maxY]}
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
                                <stop offset="5%" stopColor="#7CC39F" stopOpacity={0.4} />
                                <stop offset="60%" stopColor="#7CC39F" stopOpacity={0.1} />
                                <stop offset="100%" stopColor="#7CC39F" stopOpacity={0} />
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
                            <YAxis hide domain={[0, maxY]} />
                            <Tooltip
                              cursor={chartData.length > 1 ? { stroke: '#7CC39F', strokeWidth: 2, strokeDasharray: '6 6' } : false}
                              formatter={(val: any) => [Number(val).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }), t('dashboard.revenueChart.revenue')]}
                              contentStyle={{
                                backgroundColor: isDark ? '#0B1120' : '#fff',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                                padding: '12px'
                              }}
                              itemStyle={{ color: '#7CC39F', fontWeight: '900', fontSize: '12px', textTransform: 'capitalize' }}
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
                                stroke="#7CC39F"
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
        <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('orders.reports.sales.paymentMethods')}</h3>
                <p className="card-subtitle">{t('orders.reports.sales.breakdown')}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/dashboard/${locationSlug}/reports/payments`)}
              className="text-xs font-bold text-paymint-green hover:underline tracking-wide"
            >
              {t('orders.reports.sales.viewAll')}
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {salesData.paymentMethodBreakdown && salesData.paymentMethodBreakdown.length > 0 ? (
              <>
                <div className="h-[160px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesData.paymentMethodBreakdown}
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={1500}
                        stroke="none"
                      >
                        {salesData.paymentMethodBreakdown.map((_: any, index: number) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: isDark ? '#0B1120' : '#fff',
                          borderRadius: '16px',
                          border: 'none',
                          padding: '12px'
                        }}
                        itemStyle={{
                          color: isDark ? '#fff' : '#111',
                          fontWeight: '800',
                          fontSize: '10px',
                          textTransform: 'capitalize'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-4">
                  {salesData.paymentMethodBreakdown.slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CreditCard size={32} className="mb-3 opacity-20" />
                <p className="text-xs font-bold tracking-wide">{t('dashboard.paymentMethods.noData')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

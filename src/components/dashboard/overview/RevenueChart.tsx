import React from 'react';
import { TrendingUp, Activity, Zap } from 'lucide-react';
import { ComposedChart, Area, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../utils/dateLocale';

interface RevenueChartProps {
  dailyBreakdown: { date: string; revenue: number; count?: number }[];
  viewMode: 'current_shift' | 'previous_shift' | 'last_24_hours';
  selectedDateRange?: string;
}

export const RevenueChart = React.memo(function RevenueChart({ dailyBreakdown, viewMode, selectedDateRange }: RevenueChartProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const isHourly = dailyBreakdown?.some((d: any) => d.date.includes(':'));
  let chartData = dailyBreakdown || [];

  // Determine if we need daily aggregation (for week/month views)
  const needsDailyAggregation = ['this_week', 'this_month', 'last_30'].includes(selectedDateRange || '');

  // If it's a shift or yesterday and we have hourly data, fill in the missing hours to show a full 24h timeline
  if (['yesterday', 'current_shift', 'previous_shift'].includes(viewMode === 'last_24_hours' ? selectedDateRange || '' : viewMode) && isHourly && chartData.length > 0) {
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

  // For week/month views, aggregate hourly data into daily data
  if (needsDailyAggregation) {
    const dailyMap: { [key: string]: { date: string; revenue: number; displayDate: string; count: number } } = {};

    chartData.forEach((d: any) => {
      const dateObj = new Date(d.date);
      if (!isNaN(dateObj.getTime())) {
        // Create a day key (YYYY-MM-DD)
        const dayKey = dateObj.toISOString().split('T')[0];
        const dayName = format(dateObj, 'EEE', { locale: getDateLocale(t('common.locale')) });
        const fullDate = format(dateObj, 'MMM d', { locale: getDateLocale(t('common.locale')) });

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

    // Sort by date and convert to array
    chartData = Object.values(dailyMap).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ) as any[]; 
  }

  const maxRevenue = chartData.length > 0
    ? Math.max(...chartData.map((d: any) => Number(d.revenue) || 0))
    : 100;
  const maxY = maxRevenue > 0 ? maxRevenue : 100;

  // Check if there's any actual revenue data
  const hasRevenueData = chartData.length > 0 && chartData.some((d: any) => Number(d.revenue) > 0);

  return (
    <div id="tour-revenue-chart" className="lg:col-span-2 p-4 sm:p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm transition-all duration-300 group relative overflow-hidden">
      <div className="absolute top-0 end-0 w-64 h-64 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green transition-transform duration-300 shrink-0">
              <TrendingUp size={20} />
            </div>
            <div className="pt-0.5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{viewMode === 'current_shift' ? t('dashboard.revenueChart.currentTitle') : viewMode === 'previous_shift' ? t('dashboard.revenueChart.previousTitle') : t('dashboard.revenueChart.last24hTitle')}</h3>
              <p className="card-subtitle">{t('dashboard.revenueChart.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <Activity size={12} className="text-paymint-green" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">{t('dashboard.revenueChart.realtime')}</span>
          </div>
        </div>

        <div className="h-[200px] sm:h-[300px]">
          {hasRevenueData ? (
            <div className="flex h-full relative" dir="ltr">
                {/* Fixed Y-Axis Container */}
                <div className="absolute start-0 top-0 bottom-0 w-[50px] z-20 pointer-events-none" style={{ background: 'linear-gradient(to right, ' + (isDark ? '#0B1120 80%, transparent' : '#FFFFFF 80%, transparent') + ')' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                    data={chartData}
                    margin={{ top: 10, right: 0, left: 0, bottom: 20 }}
                    >
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => Math.round(val) === val ? val.toLocaleString(t('common.locale')) : val.toLocaleString(t('common.locale'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                        domain={[0, maxY]}
                        ticks={[0, maxY / 2, maxY]}
                        width={40}
                    />
                    {/* Dummy Area to force render */}
                    <Area dataKey="revenue" stroke="none" fill="none" />
                    </ComposedChart>
                </ResponsiveContainer>
                </div>

                {/* Scrollable Chart Area */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden ps-[50px] scrollbar-none scroll-smooth" ref={(el) => {
                  // Auto-scroll to the end (latest hours) so recent sales are visible
                  if (el && isHourly && !needsDailyAggregation) {
                    el.scrollLeft = el.scrollWidth;
                  }
                }}>
                {isHourly && !needsDailyAggregation ? (
                    <div style={{ width: `${Math.max(800, chartData.length * 65)}px`, height: '100%' }}>
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
                        dataKey="date"
                        stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)"}
                        fontSize={10}
                        tickLine={false}
                        axisLine={{ stroke: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)", strokeWidth: 1 }}
                        tick={{ fill: isDark ? "#94a3b8" : "#64748b", fontWeight: '700' }}
                        tickFormatter={(val) => {
                            if (val.length === 5 && val.includes(':')) {
                              if (t('common.locale') === 'ar') {
                                const [h] = val.split(':');
                                return `${Number(h).toLocaleString('ar-EG')}:00`;
                              }
                              return val;
                            }
                            const date = new Date(val);
                            const dateLocale = getDateLocale(t('common.locale'));
                            return !isNaN(date.getTime()) ? format(date, 'HH:00', { locale: dateLocale }) : val;
                        }}
                        dy={15}
                        interval={0}
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
                        labelFormatter={(val) => {
                            const dateLocale = getDateLocale(t('common.locale'));
                            if (val.length === 5 && val.includes(':')) {
                              if (t('common.locale') === 'ar') {
                                const [h] = val.split(':');
                                return `${Number(h).toLocaleString('ar-EG')}:00`;
                              }
                              return val;
                            }
                            const date = new Date(val);
                            return !isNaN(date.getTime()) ? format(date, 'MMM d, HH:00', { locale: dateLocale }) : val;
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
                            ) : (                    <ResponsiveContainer width="100%" height="100%">
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
                            // If it's already a display value (like "Mon" or "Jan 5"), return as-is
                            if (needsDailyAggregation) return val;
                            // Otherwise format the date
                            const date = new Date(val);
                            const dateLocale = getDateLocale(t('common.locale'));
                            return !isNaN(date.getTime()) ? format(date, 'MMM d', { locale: dateLocale }) : val;
                        }}
                        dy={15}
                        interval="preserveStartEnd"
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
                            // For aggregated data, show the full date from the date field
                            if (needsDailyAggregation && payload && payload[0]) {
                            const dateStr = payload[0].payload?.date;
                            if (dateStr) {
                                const date = new Date(dateStr);
                                return !isNaN(date.getTime()) ? format(date, 'EEEE, MMM d, yyyy', { locale: dateLocale }) : val;
                            }
                            }
                            const date = new Date(val);
                            return !isNaN(date.getTime()) ? format(date, 'MMM d, yyyy', { locale: dateLocale }) : val;
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
                )}
                </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Zap size={32} className="mb-3 opacity-20" />
              <p className="text-xs font-bold tracking-wide">{t('dashboard.revenueChart.noData')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

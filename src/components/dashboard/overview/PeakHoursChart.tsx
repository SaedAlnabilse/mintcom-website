import React from 'react';
import { Clock } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid } from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import { useCurrency } from '../../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';

interface PeakHour {
  hour: number | string;
  total: number;
  count: number;
}

interface PeakHoursChartProps {
  peakHours: PeakHour[];
}

export const PeakHoursChart = React.memo(function PeakHoursChart({ peakHours }: PeakHoursChartProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useTheme();
  const { formatAmount, currencySymbol } = useCurrency();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="group relative bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm transition-all duration-300">
      <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 transition-transform duration-300">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('dashboard.peakHours.title')}</h3>
              <p className="text-xs font-bold text-gray-500 tracking-wide">{t('dashboard.peakHours.subtitle')}</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {peakHours.length > 0 && peakHours.some((h: any) => Number(h.total) > 0) ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours.map(h => ({ ...h, hour: `${h.hour}:00` }))}>
                  <defs>
                    <linearGradient id="barGradientDash" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7CC39F" stopOpacity={1} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.8} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#ffffff05" : "#00000005"} vertical={false} />
                  <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: isDark ? '#111' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
                    itemStyle={{ fontWeight: 'bold', fontSize: '10px' }}
                    labelStyle={{ color: '#7CC39F', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}
                    formatter={(val: any) => formatAmount(val).replace(currencySymbol, '').trim()}
                  />
                  <Bar dataKey="total" name={t('dashboard.peakHours.revenue')} fill="url(#barGradientDash)" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex flex-col items-center justify-center space-y-3 bg-gray-50/50 dark:bg-black/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/5">
              <div className="p-4 rounded-full bg-gray-100 dark:bg-black/20">
                <Clock size={28} className="text-gray-400 dark:text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">{t('dashboard.peakHours.noData')}</p>
                <p className="text-xs text-gray-500 mt-1">{t('dashboard.peakHours.noDataDesc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

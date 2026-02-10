import { Clock } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { PeakHour } from '../../../../types';
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, Tooltip } from 'recharts';
import { useTheme } from '../../../../context/ThemeContext';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface PeakHoursViewProps {
  peakHours: PeakHour[];
}

export const PeakHoursView = React.memo(function PeakHoursView({ peakHours }: PeakHoursViewProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('orders.reports.peakHours.title')}</h3>
            <p className="text-xs font-bold text-gray-500 tracking-widest">{t('orders.reports.peakHours.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="h-[400px]" dir="ltr">
        {peakHours.length > 0 && peakHours.some((h: any) => Number(h.total) > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHours.map(h => ({ ...h, hourFormatted: `${h.hour}:00` }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                  <stop offset="100%" stopColor="#ec4899" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#ffffff10" : "#00000010"} />
              <XAxis
                dataKey="hourFormatted"
                stroke="#94a3b8"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={10}
                tickFormatter={(val) => {
                  if (t('common.locale') === 'ar') {
                    const [h] = val.split(':');
                    return `${Number(h).toLocaleString('ar-EG')}:00`;
                  }
                  return val;
                }}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  backgroundColor: isDark ? '#0B1120' : '#fff',
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                  padding: '12px'
                }}
                itemStyle={{ color: '#f97316', fontWeight: 'bold', fontSize: '12px', textTransform: 'capitalize' }}
                labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}
                formatter={(val: any) => [formatAmount(val), t('orders.reports.peakHours.revenue')]}
              />
              <Bar dataKey="total" name={t('orders.reports.peakHours.revenue')} fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={40} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center space-y-4 bg-gray-50/50 dark:bg-[#0B1120]/50 rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.03]">
            <div className="p-5 rounded-full bg-gray-100 dark:bg-white/5">
              <Clock size={36} className="text-gray-400 dark:text-gray-600" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">{t('orders.reports.peakHours.noData')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('orders.reports.peakHours.noDataDesc')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
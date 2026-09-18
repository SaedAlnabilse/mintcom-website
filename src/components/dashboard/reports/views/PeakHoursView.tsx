import { Activity, TrendingUp, Wallet } from 'lucide-react';
import { biIcon } from '../../../ui/BiIcon';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { PeakHour } from '../../../../types';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { useTheme } from '../../../../context/ThemeContext';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { StatValue } from '../../../../components/ui/StatValue';

interface PeakHoursViewProps {
  peakHours: PeakHour[];
}

type HourRow = {
  hour: number;
  total: number;
  count: number;
  hourLabel: string;
};

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const parseHourValue = (hour: unknown) => {
  if (typeof hour === 'number' && Number.isFinite(hour)) {
    return ((Math.trunc(hour) % 24) + 24) % 24;
  }

  const raw = String(hour ?? '').trim();
  const match = raw.match(/(\d{1,2})/);
  let parsed = match ? Number.parseInt(match[1], 10) : 0;
  const upper = raw.toUpperCase();

  if (upper.includes('PM') && parsed < 12) parsed += 12;
  if (upper.includes('AM') && parsed === 12) parsed = 0;

  return Number.isFinite(parsed) ? ((parsed % 24) + 24) % 24 : 0;
};

const buildHourLabel = (hour: number, locale: string) => {
  try {
    return new Intl.DateTimeFormat(locale, {
      hour: 'numeric',
      hour12: true,
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(2026, 0, 1, hour)));
  } catch {
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    return `${h12} ${suffix}`;
  }
};

const dayPartKey = (hour: number) => {
  if (hour >= 5 && hour <= 10) return 'morningPeak';
  if (hour >= 11 && hour <= 16) return 'afternoonPeak';
  if (hour >= 17 && hour <= 20) return 'eveningPeak';
  return 'nightPeak';
};

export const PeakHoursView = React.memo(function PeakHoursView({ peakHours }: PeakHoursViewProps) {
  const { t } = useTranslation();
  const locale = t('common.locale') || 'en-US';
  const { currencySymbol } = useCurrency();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const rows = React.useMemo(() => {
    const byHour = new Map<number, { hour: number; total: number; count: number }>();

    (peakHours || []).forEach((row: any) => {
      const hour = parseHourValue(row.hour);
      const current = byHour.get(hour) || { hour, total: 0, count: 0 };
      current.total += toNumber(row.total ?? row.revenue ?? row.sales);
      current.count += toNumber(row.count ?? row.orders);
      byHour.set(hour, current);
    });

    return Array.from({ length: 24 }, (_, hour) => {
      const current = byHour.get(hour) || { hour, total: 0, count: 0 };
      return {
        ...current,
        total: Number(current.total.toFixed(2)),
        count: Math.max(0, current.count),
        hourLabel: buildHourLabel(hour, locale),
      };
    });
  }, [peakHours, locale]);

  const activeRows = rows.filter((row) => row.count > 0 || Math.abs(row.total) > 0.005);
  const hasData = activeRows.length > 0;

  // Keep full UI with zeros when empty (same pattern as other report tabs).
  const emptyHour: HourRow = { hour: -1, total: 0, count: 0, hourLabel: '—' };

  const peak = hasData
    ? activeRows.reduce(
        (best, row) =>
          row.count > best.count || (row.count === best.count && row.total > best.total)
            ? row
            : best,
        activeRows[0],
      )
    : emptyHour;

  const quietest = hasData
    ? activeRows.reduce(
        (worst, row) =>
          row.count < worst.count || (row.count === worst.count && row.total < worst.total)
            ? row
            : worst,
        activeRows[0],
      )
    : emptyHour;

  const totalOrders = activeRows.reduce((sum, row) => sum + row.count, 0);
  const totalRevenue = activeRows.reduce((sum, row) => sum + row.total, 0);
  const peakShare = totalOrders > 0 ? peak.count / totalOrders : 0;
  const peakAverageTicket = peak.count > 0 ? peak.total / peak.count : 0;
  const avgOrdersPerActiveHour = activeRows.length > 0 ? totalOrders / activeRows.length : 0;
  const maxCount = Math.max(...rows.map((row) => row.count), 1);

  // Always render exactly 5 slots. Fill ranked hours from the top; remaining stay empty (0 / —).
  const rankedHours: HourRow[] = hasData
    ? [...activeRows]
        .sort((a, b) => (b.count - a.count) || (b.total - a.total))
        .slice(0, 5)
    : [];
  const topHours: HourRow[] = Array.from({ length: 5 }, (_, index) =>
    rankedHours[index] ?? {
      hour: -100 - index, // never matches a real peak hour id
      total: 0,
      count: 0,
      hourLabel: '—',
    },
  );

  const rushWindows = rows.slice(0, 22).map((row, index) => {
    const span = rows.slice(index, index + 3);
    return {
      start: row.hour,
      end: span[span.length - 1].hour,
      count: span.reduce((sum, current) => sum + current.count, 0),
      total: span.reduce((sum, current) => sum + current.total, 0),
    };
  });
  const rushWindow = rushWindows.reduce(
    (best, row) =>
      row.count > best.count || (row.count === best.count && row.total > best.total)
        ? row
        : best,
    rushWindows[0],
  );

  const rushShare = totalOrders > 0 ? rushWindow.count / totalOrders : 0;
  const peakHourId = hasData ? peak.hour : -1;

  const statCards = [
    {
      icon: biIcon('bi-lightning-charge'),
      label: t('orders.reports.peakHours.busiestHour'),
      value: hasData ? peak.hourLabel : '—',
      detail: t('orders.reports.peakHours.busiestHourDesc', {
        count: hasData ? peak.count : 0,
        percent: `${Math.round(peakShare * 100)}%`,
      }),
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      ring: 'ring-orange-500/10',
    },
    {
      icon: biIcon('bi-moon-stars'),
      label: t('orders.reports.peakHours.quietestHour'),
      value: hasData ? quietest.hourLabel : '—',
      detail: t('orders.reports.peakHours.quietestHourDesc', {
        count: hasData ? quietest.count : 0,
      }),
      color: 'text-stone-500',
      bg: 'bg-stone-500/10',
      ring: 'ring-stone-500/10',
    },
    {
      icon: biIcon('bi-clock-history'),
      label: t('orders.reports.peakHours.rushWindow'),
      value: hasData
        ? `${buildHourLabel(rushWindow.start, locale)} – ${buildHourLabel(rushWindow.end, locale)}`
        : '—',
      detail: t('orders.reports.peakHours.rushWindowDesc', {
        count: hasData ? rushWindow.count : 0,
        percent: `${Math.round(rushShare * 100)}%`,
      }),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/10',
    },
    {
      icon: biIcon('bi-receipt-cutoff'),
      label: t('orders.reports.peakHours.totalOrders'),
      value: totalOrders,
      integer: true,
      detail: t('orders.reports.peakHours.activeHoursDesc', {
        hours: activeRows.length,
        avg: avgOrdersPerActiveHour.toLocaleString(locale, { maximumFractionDigits: 1 }),
      }),
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      ring: 'ring-blue-500/10',
    },
  ];

  return (
    <div className="space-y-5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Summary info boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`p-4 sm:p-5 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm ring-1 ${card.ring}`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
                <card.icon size={20} />
              </div>
            </div>
            <p className="dashboard-stat-title mb-1">{card.label}</p>
            {card.integer ? (
              <StatValue value={Number(card.value) || 0} isInteger className={`text-2xl ${card.color}`} />
            ) : (
              <p className={`text-2xl font-bold tracking-tight ${card.color}`}>{card.value}</p>
            )}
            <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
              {card.detail}
            </p>
          </div>
        ))}
      </div>

      {/* Chart + Top hours — equal height when both cards are full */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 xl:items-stretch">
        <div className="xl:col-span-2 p-5 sm:p-6 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm flex flex-col h-full min-h-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                  {t('orders.reports.peakHours.chartTitle')}
                </h3>
                <p className="card-subtitle">{t('orders.reports.peakHours.chartSubtitle')}</p>
              </div>
            </div>

            {/* Color legend */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[11px] font-bold text-stone-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
                {t('orders.reports.peakHours.legendPeak')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-mintcom-green" />
                {t('orders.reports.peakHours.legendActive')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-sm ${isDark ? 'bg-stone-600' : 'bg-stone-200'}`} />
                {t('orders.reports.peakHours.legendQuiet')}
              </span>
            </div>
          </div>

          <div className="h-[260px] sm:h-[280px] xl:h-auto xl:flex-1 xl:min-h-[260px]" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rows}
                margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="32%"
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#ffffff10' : '#00000010'} />
                <XAxis
                  dataKey="hourLabel"
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  dy={8}
                  interval={1}
                  minTickGap={8}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  cursor={{ fill: isDark ? '#ffffff08' : '#00000006' }}
                  contentStyle={{
                    backgroundColor: isDark ? '#0B1120' : '#fff',
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                    padding: '12px',
                  }}
                  itemStyle={{ color: '#f97316', fontWeight: 'bold', fontSize: '12px' }}
                  labelStyle={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', marginBottom: '4px', fontSize: '11px' }}
                  formatter={(val: any, _name: any, props: any) => {
                    const payload = props?.payload;
                    const orders = Number(val || 0).toLocaleString(locale);
                    const revenue = Number(payload?.total || 0).toLocaleString(locale, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    });
                    return [
                      `${orders} ${t('orders.reports.peakHours.orders')} · ${revenue} ${currencySymbol}`,
                      t('orders.reports.peakHours.hourActivity'),
                    ];
                  }}
                />
                <Bar
                  dataKey="count"
                  name="count"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={18}
                  animationDuration={900}
                >
                  {rows.map((row) => (
                    <Cell
                      key={row.hour}
                      fill={
                        row.hour === peakHourId
                          ? '#f97316'
                          : row.count > 0
                            ? '#7dc6a2'
                            : isDark
                              ? '#334155'
                              : '#e5e7eb'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Peak insight strip under chart */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
            <div className="rounded-xl bg-orange-500/5 border border-orange-500/15 px-3.5 py-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-orange-500/80 mb-0.5">
                {t('orders.reports.peakHours.peakRevenue')}
              </p>
              <StatValue value={peak.total} currency={currencySymbol} className="text-base text-orange-600 dark:text-orange-400" />
              <p className="text-[11px] font-medium text-stone-500 mt-0.5">
                {t('orders.reports.peakHours.peakRevenueDesc')}
              </p>
            </div>
            <div className="rounded-xl bg-mintcom-green/5 border border-mintcom-green/15 px-3.5 py-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-mintcom-green mb-0.5">
                {t('orders.reports.peakHours.avgTicket')}
              </p>
              <StatValue value={peakAverageTicket} currency={currencySymbol} className="text-base text-mintcom-green" />
              <p className="text-[11px] font-medium text-stone-500 mt-0.5">
                {hasData
                  ? t(`orders.reports.peakHours.${dayPartKey(peak.hour)}`)
                  : t('orders.reports.peakHours.noData')}
              </p>
            </div>
            <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 px-3.5 py-3">
              <p className="text-[10px] font-black uppercase tracking-wide text-blue-500 mb-0.5">
                {t('orders.reports.peakHours.totalRevenue')}
              </p>
              <StatValue value={totalRevenue} currency={currencySymbol} className="text-base text-blue-600 dark:text-blue-400" />
              <p className="text-[11px] font-medium text-stone-500 mt-0.5">
                {t('orders.reports.peakHours.totalRevenueDesc')}
              </p>
            </div>
          </div>
        </div>

        {/* Top rush hours — same card height as Orders by Hour */}
        <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm flex flex-col h-full min-h-0">
          <div className="flex items-center gap-3 mb-1 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <TrendingUp size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                {t('orders.reports.peakHours.topHours')}
              </h3>
              <p className="card-subtitle">{t('orders.reports.peakHours.topHoursDesc')}</p>
            </div>
          </div>

          <div className="mt-4 flex-1 min-h-0 flex flex-col gap-2.5">
            {topHours.map((row, index) => {
              const isFilled = row.hour >= 0;
              const isPeak = isFilled && row.hour === peakHourId;
              const width = isFilled
                ? Math.max(8, Math.round((row.count / maxCount) * 100))
                : 0;
              return (
                <div
                  key={`${row.hour}-${index}`}
                  className={`rounded-xl border p-3 flex-1 min-h-0 flex flex-col justify-center ${
                    isPeak
                      ? 'border-orange-500/30 bg-orange-500/5'
                      : 'border-stone-100 dark:border-zinc-800'
                  } ${!isFilled ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-stone-900 dark:text-zinc-100 truncate">
                        <span className={isPeak ? 'text-orange-500 font-black' : 'text-stone-500 dark:text-zinc-400 font-bold'}>{index + 1}.</span>{' '}
                        {row.hourLabel}
                      </p>
                      <p className="text-xs font-semibold text-stone-600 dark:text-zinc-300">
                        {row.count.toLocaleString(locale)} {t('orders.reports.peakHours.orders')}
                        {isFilled && totalOrders > 0 && (
                          <span className="text-stone-500 dark:text-zinc-400 font-medium">
                            {' '}· {Math.round((row.count / totalOrders) * 100)}%
                          </span>
                        )}
                      </p>
                    </div>
                    <StatValue value={row.total} currency={currencySymbol} className="text-sm font-bold text-orange-500" />
                  </div>
                  <div className="h-1.5 rounded-full bg-stone-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isPeak ? 'bg-orange-500' : 'bg-mintcom-green'}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day load map — full width, compact */}
      <div className="p-5 sm:p-6 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900 dark:text-zinc-100">
                {t('orders.reports.peakHours.dayMap')}
              </h3>
              <p className="card-subtitle">{t('orders.reports.peakHours.dayMapDesc')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-stone-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-mintcom-green/20 border border-mintcom-green/30" />
              {t('orders.reports.peakHours.legendQuiet')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-mintcom-green" />
              {t('orders.reports.peakHours.legendBusy')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-orange-500" />
              {t('orders.reports.peakHours.legendPeak')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
          {rows.map((row) => {
            const intensity = row.count > 0 ? 0.18 + (row.count / maxCount) * 0.82 : 0.06;
            const isPeak = row.hour === peakHourId;
            return (
              <div
                key={row.hour}
                className={`rounded-xl border px-1.5 py-2.5 flex flex-col items-center justify-center min-h-[64px] ${
                  isPeak ? 'border-orange-500 shadow-sm shadow-orange-500/20' : 'border-stone-100 dark:border-zinc-800'
                }`}
                style={{
                  backgroundColor: isPeak
                    ? '#f97316'
                    : `rgba(125, 198, 162, ${intensity})`,
                }}
                title={`${row.hourLabel}: ${row.count} ${t('orders.reports.peakHours.orders')}`}
              >
                <span className={`text-[10px] font-black leading-tight ${isPeak ? 'text-white' : 'text-stone-700 dark:text-zinc-100'}`}>
                  {row.hourLabel.replace(/\s/g, '')}
                </span>
                <span className={`text-[11px] font-bold mt-0.5 ${isPeak ? 'text-zinc-300' : 'text-stone-600 dark:text-zinc-200'}`}>
                  {row.count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

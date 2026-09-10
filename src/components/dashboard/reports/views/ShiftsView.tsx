import { Clock } from 'lucide-react';
import { BiIcon } from '../../../ui/BiIcon';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { Shift } from '../../../../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../../utils/dateLocale';
import { Pagination } from '../../../ui';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';
import { StatValue } from '../../../../components/ui/StatValue';
import { clampNowToRangeEnd, formatDurationMs, getShiftDurationMs } from '../../../../utils/shiftDuration';

const CurrencyAmount = ({ amount, className = "", size = "text-2xl", color = "text-gray-900 dark:text-white", containerClassName = "" }: { amount: number, className?: string, size?: string, color?: string, containerClassName?: string }) => {
  const { currencySymbol } = useCurrency();
  return (
    <StatValue 
      value={amount} 
      currency={currencySymbol} 
      className={`${size} ${color} ${className}`}
      containerClassName={containerClassName}
    />
  );
};

const FormatCurrency = ({ value, className = "text-sm", containerClassName = "justify-end w-full" }: { value: number; className?: string; containerClassName?: string }) => {
  const { currencySymbol } = useCurrency();
  return (
    <StatValue 
      value={value} 
      currency={currencySymbol} 
      className={className}
      containerClassName={containerClassName}
    />
  );
};

interface ShiftsViewProps {
  shifts: Shift[];
  /** End of the active report window, ISO. Bounds still-open shifts. */
  rangeEnd: string;
}

/**
 * Muted one-line annotation under a figure. Deliberately plain text rather
 * than <StatValue>: that component only understands Tailwind's named sizes,
 * so an arbitrary `text-[11px]` silently falls back to text-2xl and the
 * caption ends up larger than the number it explains.
 */
const Caption = ({ children }: { children: React.ReactNode }) => (
  <div className="mt-0.5 text-[11px] font-semibold leading-tight text-gray-400 dark:text-gray-500 whitespace-nowrap">
    {children}
  </div>
);

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

// A sales-per-hour figure computed over a couple of minutes is noise (a 8.19
// sale in one minute is not "491/hr"), so very short shifts show no rate.
const MIN_MS_FOR_RATE = 5 * 60_000;

export const ShiftsView = React.memo(function ShiftsView({ shifts, rangeEnd }: ShiftsViewProps) {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Captions carry no currency code — the figure above them already does —
  // so they only need the locale-formatted number.
  const formatAmount = React.useCallback(
    (value: number) =>
      value.toLocaleString(t('common.locale'), {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [t],
  );

  const hasOpenShift = React.useMemo(
    () => shifts.some((s: any) => s.status === 'OPEN'),
    [shifts],
  );

  // An open shift is measured against "now", so its duration has to keep
  // ticking; without this the column would freeze until the next refresh.
  const [now, setNow] = useState(() => Date.now());
  React.useEffect(() => {
    if (!hasOpenShift) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [hasOpenShift]);

  // ...but never past the end of the window being reported on, so a shift left
  // open days ago doesn't pour every hour since into a single-day report. The
  // Staff report clamps identically — same shifts, same hours.
  const openShiftCutoff = React.useMemo(() => clampNowToRangeEnd(now, rangeEnd), [now, rangeEnd]);

  // Sort shifts: Active (OPEN) first, then by startTime newest to oldest
  const sortedShifts = React.useMemo(() => {
    return [...shifts].sort((a: any, b: any) => {
      // 1. Active (OPEN) shifts first
      if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
      if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;

      // 2. Newest to oldest (based on startTime)
      const timeA = new Date(a.startTime).getTime();
      const timeB = new Date(b.startTime).getTime();
      return timeB - timeA;
    });
  }, [shifts]);

  const paginatedShifts = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedShifts.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedShifts, currentPage]);

  // This report answers "who was on the till, for how long, and how much did
  // they trade". Drawer reconciliation (opening / expected / counted /
  // variance) is deliberately absent — that is the Cash Discrepancy report.
  const totals = React.useMemo(() => {
    let ms = 0;
    let sales = 0;
    let orders = 0;
    for (const shift of shifts as any[]) {
      ms += getShiftDurationMs(shift.startTime, shift.endTime, openShiftCutoff) ?? 0;
      sales += toNumber(shift.totalSales);
      orders += toNumber(shift.orderCount);
    }
    const hours = ms / 3_600_000;
    return {
      ms,
      sales,
      orders,
      salesPerHour: ms >= MIN_MS_FOR_RATE ? sales / hours : null,
    };
  }, [shifts, openShiftCutoff]);

  const activeShiftsCount = shifts.filter((s: any) => s.status === 'OPEN').length;

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
              <BiIcon icon="bi-clock-history" size={20} />
            </div>
            <p className="dashboard-stat-title">{t('dashboard.menu.shiftsReports')}</p>
          </div>
          <StatValue
            value={shifts.length}
            className="text-2xl"
            isInteger={true}
          />
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.shifts.activeShifts', { count: activeShiftsCount })}</p>
        </div>
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <BiIcon icon="bi-hourglass-split" size={20} />
            </div>
            <p className="dashboard-stat-title">{t('orders.reports.staff.totalHours')}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {formatDurationMs(totals.ms, i18n.language)}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.shifts.timeOnTill', { defaultValue: 'Time on the till' })}</p>
        </div>
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
              <BiIcon icon="bi-cash-coin" size={20} />
            </div>
            <p className="dashboard-stat-title">{t('orders.stats.totalSales')}</p>
          </div>
          <CurrencyAmount amount={totals.sales} />
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
            {t('orders.reports.shifts.ordersCount', { count: totals.orders, defaultValue: '{{count}} orders' })}
          </p>
        </div>
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <BiIcon icon="bi-speedometer2" size={20} />
            </div>
            <p className="dashboard-stat-title">{t('orders.reports.shifts.salesPerHour', { defaultValue: 'Sales per Hour' })}</p>
          </div>
          {totals.salesPerHour === null ? (
            <p className="text-2xl font-bold text-gray-400 tracking-tight">-</p>
          ) : (
            <CurrencyAmount amount={totals.salesPerHour} />
          )}
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.shifts.acrossAllShifts', { defaultValue: 'Across all shifts in range' })}</p>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-5 py-5 text-start label-strong font-sans whitespace-nowrap">{t('orders.reports.shifts.staff')}</th>
                <th className="px-5 py-5 text-start label-strong font-sans whitespace-nowrap">{t('orders.reports.shifts.time')}</th>
                <th className="px-5 py-5 text-start label-strong font-sans whitespace-nowrap">{t('orders.reports.shifts.duration', { defaultValue: 'Duration' })}</th>
                <th className="px-5 py-5 text-end label-strong font-sans whitespace-nowrap">{t('orders.exportFields.orderNumber')}</th>
                <th className="px-5 py-5 text-end label-strong font-sans whitespace-nowrap">{t('orders.stats.totalSales')}</th>
                <th className="px-5 py-5 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.shifts.salesPerHour', { defaultValue: 'Sales per Hour' })}</th>
                <th className="px-5 py-5 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.shifts.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedShifts.length > 0 ? (
                paginatedShifts.map((shift: any, idx: number) => (
                  <motion.tr
                    key={shift.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-5 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black text-xs shrink-0">
                          {shift.user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{shift.user?.username || t('common.unknown')}</span>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-start">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {format(new Date(shift.startTime), 'MMM d, HH:mm', { locale: getDateLocale(t('common.locale')) })}
                        </span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {t('common.to')} {shift.endTime ? format(new Date(shift.endTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) }) : t('orders.reports.shifts.present')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-start">
                      <span className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatDurationMs(
                          getShiftDurationMs(shift.startTime, shift.endTime, openShiftCutoff),
                          i18n.language,
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-end">
                      <StatValue
                        value={toNumber(shift.orderCount)}
                        className="text-sm font-bold"
                        isInteger
                        containerClassName="justify-end w-full"
                      />
                    </td>
                    <td className="px-5 py-5 text-end font-bold text-mintcom-green">
                      <FormatCurrency value={shift.totalSales} />
                      {/* Payment mix: how much of the trade actually landed in
                          the drawer. The drawer's own reconciliation lives in
                          the Cash Discrepancy report. */}
                      {Math.abs(toNumber(shift.cashSales) - toNumber(shift.totalSales)) > 0.001 && (
                        <Caption>
                          {formatAmount(toNumber(shift.cashSales))}{' '}
                          {t('orders.reports.shifts.inCash', { defaultValue: 'in cash' })}
                        </Caption>
                      )}
                    </td>
                    <td className="px-5 py-5 text-end font-medium text-gray-500">
                      {(() => {
                        const ms = getShiftDurationMs(shift.startTime, shift.endTime, openShiftCutoff) ?? 0;
                        if (ms < MIN_MS_FOR_RATE) {
                          return <span className="text-gray-400 font-normal">-</span>;
                        }
                        return (
                          <FormatCurrency
                            value={toNumber(shift.totalSales) / (ms / 3_600_000)}
                          />
                        );
                      })()}
                    </td>
                    <td className="px-5 py-5 text-end">
                      {shift.status === 'OPEN' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-mintcom-green/10 text-mintcom-green border border-mintcom-green/20">
                          {t('orders.reports.shifts.currentlyActive', { defaultValue: 'Currently Active' })}
                        </span>
                      ) : shift.autoClose ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {t('orders.reports.shifts.autoClosed', { defaultValue: 'Auto-closed' })}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                          {t('orders.reports.shifts.manualClose', { defaultValue: 'Cashed out' })}
                        </span>
                      )}
                      {/* A pointer, not a number: the drawer gap itself is
                          reported — with all its inputs — in Cash Discrepancy. */}
                      {shift.status === 'CLOSED' && Math.abs(toNumber(shift.discrepancy)) > 0.01 && (
                        <Caption>
                          <span className={toNumber(shift.discrepancy) < 0 ? 'text-red-500' : 'text-amber-500'}>
                            {toNumber(shift.discrepancy) < 0
                              ? t('orders.reports.cashGap.cashShort')
                              : t('orders.reports.cashGap.cashOver')}
                          </span>
                        </Caption>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-14">
                    <AnalyticsEmptyState
                      icon={Clock}
                      title={t('orders.reports.shifts.noActivity')}
                      description={t('orders.reports.shifts.noActivityDesc')}
                      compact
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(sortedShifts.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
});

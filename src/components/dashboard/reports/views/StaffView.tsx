import { Users } from 'lucide-react';
import { BiIcon } from '../../../ui/BiIcon';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { Shift } from '../../../../types';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { Pagination } from '../../../ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';
import { StatValue } from '../../../../components/ui/StatValue';
import { clampNowToRangeEnd, formatDurationMs, getShiftDurationMs } from '../../../../utils/shiftDuration';

const CurrencyAmount = ({ amount, className = "", size = "text-2xl", color = "text-gray-900 dark:text-white" }: { amount: number, className?: string, size?: string, color?: string }) => {
  const { currencySymbol } = useCurrency();
  return (
    <StatValue 
      value={amount} 
      currency={currencySymbol} 
      className={`${size} ${color} ${className}`}
    />
  );
};

const FormatCurrency = ({ value, className = "text-sm", containerClassName = "justify-center" }: { value: number; className?: string; containerClassName?: string }) => {
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

// A rate computed over a couple of minutes is noise, not performance: one 8.19
// sale a minute into a shift is not "491/hr". Matches the floor the Shifts
// report and the exports already use.
const MIN_MS_FOR_RATE = 5 * 60_000;

interface StaffViewProps {
  shifts: Shift[];
  selectedEmployeeId: string | null;
  employees: { label: string; value: string }[];
  /** End of the active report window, ISO. Bounds still-open shifts. */
  rangeEnd: string;
}

export const StaffView = React.memo(function StaffView({ shifts, selectedEmployeeId, employees, rangeEnd }: StaffViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { locationSlug, slug } = useParams();
  const activeSlug = locationSlug || slug;
  const { currencySymbol } = useCurrency();
  const [staffPage, setStaffPage] = useState(1);
  const itemsPerPage = 10;
  const selectedEmp = selectedEmployeeId ? employees.find(e => e.value === selectedEmployeeId) : null;
  const empName = selectedEmp?.label || '';
  const isSpecificEmployee = !!selectedEmployeeId;
  // Always summarise the shifts the page actually fetched for the active
  // filters. The staff dropdown's own shift list is deliberately widened to
  // whole days (so every shift stays pickable) and ignores the time-of-day and
  // selected-shift filters — summing it here made the cards report the whole
  // day whenever a staff member (or a single shift) was selected, while the
  // leaderboard below stayed on the filtered data.
  const dataSource = shifts;

  // An open shift is measured against "now", so the figure has to keep ticking
  // or it freezes at first paint.
  const hasOpenShift = React.useMemo(() => shifts.some((s: any) => !s.endTime), [shifts]);
  const [now, setNow] = useState(() => Date.now());
  React.useEffect(() => {
    if (!hasOpenShift) return;
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [hasOpenShift]);

  // Open shifts are measured against the same clamped cutoff the Shifts report
  // uses — the two tabs read the same shifts, so their hours must agree to the
  // minute.
  const openShiftCutoff = React.useMemo(() => clampNowToRangeEnd(now, rangeEnd), [now, rangeEnd]);

  const shiftMs = React.useCallback(
    (shift: any) => getShiftDurationMs(shift.startTime, shift.endTime, openShiftCutoff) ?? 0,
    [openShiftCutoff],
  );

  // Calculate stats
  const totalMs = dataSource.reduce((acc: number, shift: any) => acc + shiftMs(shift), 0);

  const totalOrders = dataSource.reduce((acc: number, shift: any) => acc + (shift.orderCount || 0), 0);
  const totalSales = dataSource.reduce((acc: number, shift: any) => acc + (shift.totalSales || 0), 0);
  const totalDiscounts = dataSource.reduce((acc: number, shift: any) => acc + (shift.totalDiscounts || 0), 0);
  const totalRefunds = dataSource.reduce((acc: number, shift: any) => acc + (shift.totalRefunds || 0), 0);
  const positiveVariance = dataSource.reduce((acc: number, shift: any) => {
    const variance = (shift.variance || shift.discrepancy || 0);
    return variance > 0 ? acc + variance : acc;
  }, 0);
  const negativeVariance = dataSource.reduce((acc: number, shift: any) => {
    const variance = (shift.variance || shift.discrepancy || 0);
    return variance < 0 ? acc + Math.abs(variance) : acc;
  }, 0);

  // Leaderboard / Staff Calculation including all employees in the establishment
  const employeeStats = useMemo(() => {
    const acc: Record<string, any> = {};

    // 1. Populate all establishment employees so all staff are represented even with 0 sales
    (employees || []).forEach((emp) => {
      if (emp.value) {
        const username = emp.label || t('common.unknown');
        acc[username] = {
          id: emp.value,
          username,
          totalShifts: 0,
          totalSales: 0,
          totalHours: 0,
          totalMs: 0,
          avgTransaction: 0,
          transactionCount: 0,
        };
      }
    });

    // 2. Aggregate from shifts
    (shifts || []).forEach((shift: any) => {
      const username = shift.user?.username || shift.user?.name || t('common.unknown');
      if (!acc[username]) {
        acc[username] = {
          id: shift.userId || shift.user?.id || username,
          username,
          totalShifts: 0,
          totalSales: 0,
          totalHours: 0,
          totalMs: 0,
          avgTransaction: 0,
          transactionCount: 0,
        };
      }
      acc[username].totalShifts += 1;
      acc[username].totalSales += Number(shift.totalSales || 0);
      acc[username].transactionCount += Number(shift.orderCount || 0);
      const ms = shiftMs(shift);
      acc[username].totalMs += ms;
      acc[username].totalHours += ms / 3_600_000;
    });

    return acc;
  }, [employees, shifts, t, shiftMs]);

  const sortedEmployees: any[] = useMemo(() => {
    const list = Object.values(employeeStats);
    if (selectedEmployeeId) {
      const match = list.filter((e: any) => e.id === selectedEmployeeId || e.username === empName);
      if (match.length > 0) return match;
    }
    return list.sort((a: any, b: any) => {
      if (b.totalSales !== a.totalSales) {
        return b.totalSales - a.totalSales;
      }
      if (b.transactionCount !== a.transactionCount) {
        return b.transactionCount - a.transactionCount;
      }
      return a.username.localeCompare(b.username);
    });
  }, [employeeStats, selectedEmployeeId, empName]);

  const totalStoreSales = useMemo(() => {
    return sortedEmployees.reduce((acc: number, curr: any) => acc + curr.totalSales, 0);
  }, [sortedEmployees]);

  const hasLeaderboardData = sortedEmployees.length > 0;
  const topPerformer = !selectedEmployeeId && sortedEmployees.length > 0 && sortedEmployees[0].totalSales > 0
    ? sortedEmployees[0]
    : null;

  return (
    <div className="space-y-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Overview Cards */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green">
            <BiIcon icon="bi-people" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isSpecificEmployee ? t('orders.reports.staff.performance', { name: empName }) : t('orders.reports.staff.overview')}
            </h3>
            <p className="text-xs text-gray-500">{t('orders.reports.staff.breakdown')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
          {/* Total Hours */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col justify-between min-h-[96px] transition-all duration-300 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 truncate" title={t('orders.reports.staff.totalHours')}>
              {t('orders.reports.staff.totalHours')}
            </p>
            {/* Same "2h 15m" shape the Shifts report uses — decimal hours read
                as a bare number and round a short shift down to "0.0". */}
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatDurationMs(totalMs, i18n.language)}
            </p>
          </div>

          {/* Total Orders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col justify-between min-h-[96px] transition-all duration-300 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 truncate" title={t('orders.reports.staff.totalOrders')}>
              {t('orders.reports.staff.totalOrders')}
            </p>
            <StatValue 
              value={totalOrders} 
              className="text-xl sm:text-2xl font-bold"
              isInteger={true}
            />
          </div>

          {/* Total Sales */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col justify-between min-h-[96px] transition-all duration-300 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 truncate" title={t('orders.reports.staff.totalSales')}>
              {t('orders.reports.staff.totalSales')}
            </p>
            <CurrencyAmount amount={totalSales} size="text-xl sm:text-2xl font-bold" />
          </div>

          {/* Total Discounts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col justify-between min-h-[96px] transition-all duration-300 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 truncate" title={t('orders.reports.staff.totalDiscounts')}>
              {t('orders.reports.staff.totalDiscounts')}
            </p>
            <CurrencyAmount amount={totalDiscounts} size="text-xl sm:text-2xl font-bold" color="text-orange-500" />
          </div>

          {/* Total Refunds */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col justify-between min-h-[96px] transition-all duration-300 shadow-sm">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 truncate" title={t('orders.reports.staff.totalRefunds')}>
              {t('orders.reports.staff.totalRefunds')}
            </p>
            <CurrencyAmount amount={totalRefunds} size="text-xl sm:text-2xl font-bold" color="text-red-500" />
          </div>

          {/* Variances */}
          <div 
            onClick={() => navigate(`/dashboard/${activeSlug}/reports/shifts`)}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col justify-between min-h-[96px] transition-all duration-300 shadow-sm cursor-pointer hover:border-mintcom-green/30 group"
          >
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-mintcom-green transition-colors mb-1.5 truncate" title={t('orders.reports.staff.totalVariances')}>
              {t('orders.reports.staff.totalVariances')}
            </p>
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <StatValue value={positiveVariance} currency={currencySymbol} className="text-sm sm:text-base font-bold text-amber-500" />
              <span className="text-gray-300 dark:text-white/20 font-light text-xs sm:text-sm">/</span>
              <StatValue value={-negativeVariance} currency={currencySymbol} className="text-sm sm:text-base font-bold text-red-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Top Performer — Highlight Banner (when there is a top seller) */}
        {topPerformer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-[24px] border border-gray-100 dark:border-white/[0.05] shadow-sm bg-white dark:bg-[#1E293B]"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="inline-flex items-center shrink-0 px-3.5 py-2 rounded-[12px] bg-mintcom-green text-black text-[11px] font-bold tracking-wide uppercase leading-none" style={{ borderRadius: '12px' }}>
                {t('common.top')} #1
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                {topPerformer.username}
              </h3>
            </div>
            <div className="flex items-center gap-6 sm:gap-8 sm:ps-6 sm:border-s border-gray-100 dark:border-white/[0.06] sm:ms-auto">
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-1">{t('orders.reports.staff.revenue')}</p>
                <CurrencyAmount amount={topPerformer.totalSales} size="text-lg" color="text-gray-900 dark:text-white" />
              </div>
              <div className="hidden sm:block w-px self-stretch bg-gray-100 dark:bg-white/[0.06]" aria-hidden="true" />
              <div>
                <p className="text-[11px] font-medium text-gray-400 mb-1">{t('orders.reports.staff.avgTicket')}</p>
                <CurrencyAmount
                  amount={topPerformer.transactionCount > 0 ? topPerformer.totalSales / topPerformer.transactionCount : 0}
                  size="text-lg"
                  color="text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Detailed Metrics Table — showing all staff */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[24px] border border-gray-100 dark:border-white/[0.05] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('orders.reports.staff.title')}</h3>
              <p className="text-xs text-gray-500">{t('orders.reports.staff.subtitle')}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <colgroup>
                <col style={{ width: '64px' }} />
                <col />
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
              </colgroup>
              <thead className="bg-gray-50/50 dark:bg-white/[0.01]">
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  <th className="px-4 py-4 text-start label-strong font-sans">{t('orders.reports.staff.rank')}</th>
                  <th className="px-4 py-4 text-start label-strong font-sans">{t('orders.reports.staff.staff')}</th>
                  <th className="px-4 py-4 text-center label-strong font-sans" style={{ textAlign: 'center' }}>{t('orders.reports.staff.sales')}</th>
                  <th className="px-4 py-4 text-center label-strong font-sans whitespace-nowrap" style={{ textAlign: 'center' }}>{t('orders.reports.staff.share')}</th>
                  <th className="px-4 py-4 text-center label-strong font-sans whitespace-nowrap" style={{ textAlign: 'center' }}>{t('orders.reports.staff.avgOrder')}</th>
                  <th className="px-4 py-4 text-center label-strong font-sans whitespace-nowrap" style={{ textAlign: 'center' }}>{t('orders.reports.staff.salesPerHour')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.03]">
                {hasLeaderboardData ? (
                  sortedEmployees
                    .slice((staffPage - 1) * itemsPerPage, staffPage * itemsPerPage)
                    .map((emp: any, idx: number) => {
                      const shareRatio = totalStoreSales > 0 ? (emp.totalSales / totalStoreSales) : 0;
                      const sharePercent = shareRatio * 100;
                      const avgTicket = emp.transactionCount > 0 ? emp.totalSales / emp.transactionCount : 0;
                      // Below the floor there is no meaningful rate to show — a
                      // few minutes on the till would read as hundreds per hour.
                      const efficiency = emp.totalMs >= MIN_MS_FOR_RATE
                        ? emp.totalSales / (emp.totalMs / 3_600_000)
                        : null;
                      const globalIndex = (staffPage - 1) * itemsPerPage + idx;
                      const isTopRank = globalIndex === 0 && emp.totalSales > 0;

                      return (
                        <motion.tr 
                          key={`${staffPage}-${emp.username || idx}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="px-4 py-4 text-start">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs mx-auto sm:mx-0 ${isTopRank ? 'bg-[#7dc6a2]/20 text-[#7dc6a2]' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                              <StatValue 
                                value={globalIndex + 1} 
                                isInteger={true} 
                                className="text-xs"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-start">
                            <span className="font-bold text-gray-900 dark:text-white text-sm truncate block" title={emp.username}>{emp.username}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center">
                              <FormatCurrency value={emp.totalSales} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                              <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full bg-mintcom-green rounded-full" style={{ width: `${Math.min(sharePercent, 100)}%` }} />
                              </div>
                              <StatValue 
                                value={sharePercent} 
                                isPercentage={true} 
                                isAlreadyPercent={true} 
                                className="text-xs font-bold text-gray-500"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center">
                              <FormatCurrency value={avgTicket} />
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex justify-center">
                              {efficiency === null ? (
                                <span className="text-xs font-bold text-gray-400">-</span>
                              ) : (
                                <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap text-xs font-bold text-gray-500">
                                  <FormatCurrency value={efficiency} /> <span className="whitespace-nowrap">/ {t('orders.reports.staff.perHour')}</span>
                                </span>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-14">
                      <AnalyticsEmptyState
                        icon={Users}
                        title={t('orders.reports.staff.noActivity')}
                        description={t('orders.reports.staff.noActivityDesc')}
                        compact
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={staffPage}
            totalPages={Math.max(Math.ceil(sortedEmployees.length / itemsPerPage), 1)}
            onPageChange={(p) => setStaffPage(p)}
            totalItems={sortedEmployees.length}
            itemsPerPage={itemsPerPage}
          />
        </div>
      </div>
    </div>
  );
});

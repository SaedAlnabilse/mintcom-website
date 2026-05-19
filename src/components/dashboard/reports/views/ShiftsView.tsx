import { Activity, Clock } from 'lucide-react';
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

interface ShiftsViewProps {
  shifts: Shift[];
}

export const ShiftsView = React.memo(function ShiftsView({ shifts }: ShiftsViewProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalVariance = shifts.reduce((acc: number, shift: any) => acc + (shift.discrepancy || 0), 0);
  const activeShiftsCount = shifts.filter((s: any) => s.status === 'OPEN').length;

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Activity size={20} />
            </div>
            <p className="dashboard-stat-title">{t('orders.reports.shifts.cashVariance')}</p>
          </div>
          <div className="flex items-baseline gap-1">
            <CurrencyAmount 
              amount={totalVariance} 
              color={totalVariance < -0.01 ? 'text-red-500' : totalVariance > 0.01 ? 'text-amber-500' : 'text-mintcom-green'} 
            />
          </div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.shifts.totalOverShort')}</p>
        </div>
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
              <Clock size={20} />
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
      </div>

      {/* Shifts Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-5 py-5 text-start label-strong font-outfit">{t('orders.reports.shifts.staff')}</th>
                <th className="px-5 py-5 text-start label-strong font-outfit">{t('orders.reports.shifts.time')}</th>
                <th className="px-5 py-5 text-end label-strong font-outfit">{t('orders.reports.shifts.opening')}</th>
                <th className="px-5 py-5 text-end label-strong font-outfit">{t('orders.stats.totalSales')}</th>
                <th className="px-5 py-5 text-end label-strong font-outfit">{t('orders.reports.shifts.closing')}</th>
                <th className="px-5 py-5 text-center label-strong font-outfit">{t('orders.reports.shifts.variance')}</th>
                <th className="px-5 py-5 text-center label-strong font-outfit">{t('orders.reports.shifts.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedShifts.length > 0 ? (
                paginatedShifts.map((shift: any) => (
                  <motion.tr
                    key={shift.id}
                    className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black text-xs">
                          {shift.user?.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{shift.user?.username || t('common.unknown')}</span>
                      </div>
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {format(new Date(shift.startTime), 'MMM d, HH:mm', { locale: getDateLocale(t('common.locale')) })}
                        </span>
                        <span className="text-xs font-medium text-gray-500">
                          {t('common.to')} {shift.endTime ? format(new Date(shift.endTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) }) : t('orders.reports.shifts.present')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-end font-medium text-gray-500">
                      <FormatCurrency value={shift.openingBalance} />
                    </td>
                    <td className="px-5 py-5 text-end font-bold text-mintcom-green">
                      <FormatCurrency value={shift.totalSales} />
                    </td>
                    <td className="px-5 py-5 text-end">
                      {shift.status === 'CLOSED' ? (
                        <span className="font-bold text-mintcom-green">
                          {shift.closingBalance !== null && shift.closingBalance !== undefined
                            ? <FormatCurrency value={shift.closingBalance} />
                            : '-'}
                        </span>
                      ) : (
                        <span className="label-strong font-outfit">{t('orders.reports.shifts.active')}</span>
                      )}
                    </td>
                    <td className="px-5 py-5 text-center">
                      {shift.status === 'CLOSED' && shift.discrepancy !== null && shift.discrepancy !== undefined ? (
                        <div className="flex flex-col items-center">
                          <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1 label-strong font-outfit border ${shift.discrepancy > 0.001
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : shift.discrepancy < -0.001
                              ? 'bg-red-500/10 text-red-500 border-red-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            }`}>
                            <CurrencyAmount
                              amount={shift.discrepancy}
                              size="text-[10px]"
                              color={shift.discrepancy > 0.001 ? 'text-amber-500' : shift.discrepancy < -0.001 ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'}
                            />
                            <span className="ml-1">
                              {shift.discrepancy > 0.001 ? t('orders.reports.shifts.over') : shift.discrepancy < -0.001 ? t('orders.reports.shifts.short') : ''}
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span className="label-strong font-outfit">-</span>
                      )}
                    </td>
                    <td className="px-5 py-5 text-center">
                      <span className={`px-2.5 py-1 rounded-lg label-strong font-outfit border transition-all ${shift.status === 'OPEN'
                        ? 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'
                        }`}>
                        {shift.status === 'OPEN' ? t('orders.reports.shifts.active') : t('orders.status.completed')}
                      </span>
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

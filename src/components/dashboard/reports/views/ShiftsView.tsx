import { Activity, Clock } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { Shift } from '../../../../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../../utils/dateLocale';
import { Pagination } from '../../../ui';

interface ShiftsViewProps {
  shifts: Shift[];
}

export const ShiftsView = React.memo(function ShiftsView({ shifts }: ShiftsViewProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (value: number) => formatAmount(value);

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

  // If no shifts, return empty state early
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 transform rotate-3">
          <Clock size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('orders.reports.shifts.noActivity')}</h3>
        <p className="text-xs font-medium text-gray-500 max-w-sm leading-relaxed">
          {t('orders.reports.shifts.noActivityDesc')}
        </p>
      </div>
    );
  }

  const totalVariance = shifts.reduce((acc: number, shift: any) => acc + (shift.discrepancy || 0), 0);
  const activeShiftsCount = shifts.filter((s: any) => s.status === 'OPEN').length;

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <Activity size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide capitalize">{t('orders.reports.shifts.cashVariance')}</p>
          </div>
          <p className={`text-2xl font-bold ${totalVariance < -0.01 ? 'text-red-500' : 'text-paymint-green'} tracking-tight`}>
            {totalVariance > 0 ? '+' : ''}{totalVariance.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-sm mx-1 text-gray-400 font-black"> {currencySymbol}</span>
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">{t('orders.reports.shifts.totalOverShort')}</p>
        </div>
        <div className="p-4 sm:p-5 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center">
              <Clock size={20} />
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide capitalize">{t('dashboard.menu.shiftsReports')}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{shifts.length.toLocaleString(t('common.locale'))}</p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">{t('orders.reports.shifts.activeShifts', { count: activeShiftsCount })}</p>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-5 py-5 text-start text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.shifts.staff')}</th>
                <th className="px-5 py-5 text-start text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.shifts.time')}</th>
                <th className="px-5 py-5 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.shifts.opening')}</th>
                <th className="px-5 py-5 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.stats.totalSales')}</th>
                <th className="px-5 py-5 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.shifts.closing')}</th>
                <th className="px-5 py-5 text-center text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.shifts.variance')}</th>
                <th className="px-5 py-5 text-center text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.shifts.status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {paginatedShifts.map((shift: any) => (
                <motion.tr
                  key={shift.id}
                  className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black text-xs">
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
                    {formatCurrency(shift.openingBalance)}
                  </td>
                  <td className="px-5 py-5 text-end font-bold text-paymint-green">
                    {formatCurrency(shift.totalSales)}
                  </td>
                  <td className="px-5 py-5 text-end">
                    {shift.status === 'CLOSED' ? (
                      <span className="font-bold text-paymint-green">
                        {shift.closingBalance !== null && shift.closingBalance !== undefined
                          ? formatCurrency(shift.closingBalance)
                          : '—'}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.shifts.active')}</span>
                    )}
                  </td>
                  <td className="px-5 py-5 text-center">
                    {shift.status === 'CLOSED' && shift.discrepancy !== null && shift.discrepancy !== undefined ? (
                      <div className="flex flex-col items-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-widest border ${shift.discrepancy > 0.001
                          ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                          : shift.discrepancy < -0.001
                            ? 'bg-red-500/10 text-red-500 border-red-500/20'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'
                          }`}>
                          {shift.discrepancy > 0.001
                            ? `+${shift.discrepancy.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('orders.reports.shifts.over')}`
                            : shift.discrepancy < -0.001
                              ? `${shift.discrepancy.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('orders.reports.shifts.short')}`
                              : (0).toLocaleString(t('common.locale'))}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-black text-gray-400 tracking-widest">—</span>
                    )}
                  </td>
                  <td className="px-5 py-5 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black tracking-widest border transition-all ${shift.status === 'OPEN'
                      ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10'
                      }`}>
                      {shift.status === 'OPEN' ? t('orders.reports.shifts.active') : t('orders.status.completed')}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedShifts.length > itemsPerPage && (
          <div className="p-4 border-t border-gray-200 dark:border-white/5">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedShifts.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
});

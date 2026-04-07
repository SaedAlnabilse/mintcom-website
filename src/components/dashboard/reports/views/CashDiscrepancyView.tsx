import { useState, useMemo } from 'react';
import { Scale, TrendingUp, TrendingDown, AlertCircle, User } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../../utils/dateLocale';
import type { Shift } from '../../../../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import React from 'react';
import { Pagination } from '../../../ui';

interface CashDiscrepancyViewProps {
  shifts: Shift[];
}

export const CashDiscrepancyView = React.memo(function CashDiscrepancyView({ shifts }: CashDiscrepancyViewProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'short' | 'over' | 'balanced'>('all');
  const itemsPerPage = 10;

  const formatCurrency = (value: number) => formatAmount(value);

  // Filter only closed shifts with discrepancies
  const closedShifts = useMemo(() => {
    return shifts.filter((s: any) => s.status === 'CLOSED');
  }, [shifts]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOver = closedShifts.reduce((acc: number, shift: any) => {
      const disc = shift.discrepancy || 0;
      return disc > 0 ? acc + disc : acc;
    }, 0);

    const totalShort = closedShifts.reduce((acc: number, shift: any) => {
      const disc = shift.discrepancy || 0;
      return disc < 0 ? acc + Math.abs(disc) : acc;
    }, 0);

    const netVariance = totalOver - totalShort;
    const overCount = closedShifts.filter((s: any) => (s.discrepancy || 0) > 0.001).length;
    const shortCount = closedShifts.filter((s: any) => (s.discrepancy || 0) < -0.001).length;
    const balancedCount = closedShifts.filter((s: any) => {
      const disc = s.discrepancy || 0;
      return disc >= -0.001 && disc <= 0.001;
    }).length;

    return {
      totalOver,
      totalShort,
      netVariance,
      overCount,
      shortCount,
      balancedCount,
      totalShifts: closedShifts.length
    };
  }, [closedShifts]);

  // Filter shifts based on status filter
  const filteredShifts = useMemo(() => {
    return closedShifts.filter((s: any) => {
      const discrepancy = s.discrepancy || 0;
      if (statusFilter === 'over') return discrepancy > 0.001;
      if (statusFilter === 'short') return discrepancy < -0.001;
      if (statusFilter === 'balanced') return discrepancy >= -0.001 && discrepancy <= 0.001;
      return true;
    });
  }, [closedShifts, statusFilter]);

  // Sort shifts by discrepancy (largest first for over, most negative for short)
  const sortedShifts = useMemo(() => {
    return [...filteredShifts].sort((a: any, b: any) => {
      const discA = Math.abs(a.discrepancy || 0);
      const discB = Math.abs(b.discrepancy || 0);
      return discB - discA; // Sort by absolute value, largest first
    });
  }, [filteredShifts]);

  const handleStatusFilterChange = (filter: 'all' | 'short' | 'over' | 'balanced') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const paginatedShifts = useMemo(() => {
    return sortedShifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedShifts, currentPage]);

  // Calculate accuracy rate
  const accuracyRate = stats.totalShifts > 0
    ? (stats.balancedCount / stats.totalShifts).toLocaleString(t('common.locale'), { style: 'percent' })
    : (0).toLocaleString(t('common.locale'), { style: 'percent' });

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 transform rotate-3">
          <Scale size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('orders.reports.cashGap.noData')}</h3>
        <p className="text-xs font-medium text-gray-500 max-w-sm leading-relaxed">
          {t('orders.reports.cashGap.noDataDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Variance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
            stats.netVariance >= 0 
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' 
              : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-red-500/5 border-red-200 dark:border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              stats.netVariance >= 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}>
              <Scale size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide capitalize">{t('orders.reports.cashGap.netVariance')}</span>
          </div>
          <p className={`text-2xl font-bold ${stats.netVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} tracking-tight`}>
            {stats.netVariance >= 0 ? '+' : ''}{formatCurrency(stats.netVariance)}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {stats.netVariance >= 0 ? t('orders.reports.cashGap.overExpected') : t('orders.reports.cashGap.underExpected')}
          </p>
        </motion.div>

        {/* Total Over */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 sm:p-5 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide capitalize">{t('orders.reports.cashGap.totalOver')}</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            +{formatCurrency(stats.totalOver)}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {t('orders.reports.cashGap.shiftsOver', { count: stats.overCount })}
          </p>
        </motion.div>

        {/* Total Short */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 sm:p-5 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide capitalize">{t('orders.reports.cashGap.totalShort')}</span>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 tracking-tight">
            -{formatCurrency(stats.totalShort)}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {t('orders.reports.cashGap.shiftsShort', { count: stats.shortCount })}
          </p>
        </motion.div>

        {/* Accuracy Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 sm:p-5 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide capitalize">{t('orders.reports.cashGap.accuracyRate')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {accuracyRate}
          </p>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">
            {t('orders.reports.cashGap.shiftsBalanced', { count: stats.balancedCount, total: stats.totalShifts })}
          </p>
        </motion.div>
      </div>

      {/* Discrepancy Breakdown Chart */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-6 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">{t('orders.reports.cashGap.overview')}</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.overCount.toLocaleString(t('common.locale'))}</p>
            <p className="text-xs font-bold text-gray-500">{t('orders.reports.cashGap.cashOver')}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
              <Scale size={24} className="text-gray-500" />
            </div>
            <p className="text-2xl font-black text-gray-700 dark:text-gray-300">{stats.balancedCount.toLocaleString(t('common.locale'))}</p>
            <p className="text-xs font-bold text-gray-500">{t('orders.reports.cashGap.balanced')}</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-red-500/10 flex items-center justify-center">
              <TrendingDown size={24} className="text-red-500" />
            </div>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.shortCount.toLocaleString(t('common.locale'))}</p>
            <p className="text-xs font-bold text-gray-500">{t('orders.reports.cashGap.cashShort')}</p>
          </div>
        </div>
      </div>

      {/* Detailed Shifts Table */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('orders.reports.cashGap.details')}</h3>
            <p className="text-xs text-gray-500 mt-1">
              {t('orders.reports.cashGap.detailsDesc')}
            </p>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {t('common.showing')} {Math.min(paginatedShifts.length, itemsPerPage).toLocaleString(t('common.locale'))} {t('common.of')} {sortedShifts.length.toLocaleString(t('common.locale'))} {t('dashboard.menu.shiftsReports')}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: t('orders.reports.cashGap.all'), icon: Scale, color: 'gray' },
            { id: 'over', label: t('orders.reports.cashGap.over'), icon: TrendingUp, color: 'emerald' },
            { id: 'short', label: t('orders.reports.cashGap.short'), icon: TrendingDown, color: 'red' },
            { id: 'balanced', label: t('orders.reports.cashGap.balanced'), icon: Scale, color: 'blue' },
          ].map((filter) => {
            const isSelected = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => handleStatusFilterChange(filter.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? filter.color === 'emerald'
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                      : filter.color === 'red'
                        ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                        : filter.color === 'blue'
                          ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20'
                          : 'bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white shadow-lg shadow-gray-900/20 dark:shadow-white/20'
                    : 'bg-white dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10'
                }`}
              >
                <filter.icon size={14} />
                {filter.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-lg text-[10px] ${
                  isSelected ? 'bg-black/10 dark:bg-white/20' : 'bg-gray-100 dark:bg-white/10'
                }`}>
                  {filter.id === 'all' ? closedShifts.length : filter.id === 'over' ? stats.overCount : filter.id === 'short' ? stats.shortCount : stats.balancedCount}
                </span>
              </button>
            );
          })}
        </div>

        {sortedShifts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-sm">{t('orders.reports.cashGap.noClosedShifts')}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="px-5 py-4 text-start text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.cashGap.staff')}</th>
                    <th className="px-5 py-4 text-start text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.cashGap.period')}</th>
                    <th className="px-5 py-4 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.cashGap.opening')}</th>
                    <th className="px-5 py-4 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.cashGap.sales')}</th>
                    <th className="px-5 py-4 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.cashGap.closing')}</th>
                    <th className="px-5 py-4 text-center text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.cashGap.expected')}</th>
                    <th className="px-5 py-4 text-center text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.cashGap.variance')}</th>
                    <th className="px-5 py-4 text-center text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.cashGap.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {paginatedShifts.map((shift: any, idx: number) => {
                    const discrepancy = shift.discrepancy || 0;
                    const expected = (shift.openingBalance || 0) + (shift.totalSales || 0);
                    const isOver = discrepancy > 0.001;
                    const isShort = discrepancy < -0.001;
                    return (
                      <motion.tr
                        key={shift.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-paymint-green/10 text-paymint-green flex items-center justify-center font-black text-xs">
                              <User size={14} />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                              {shift.user?.username || t('common.unknown')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {format(new Date(shift.startTime), 'MMM d, yyyy', { locale: getDateLocale(t('common.locale')) })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(shift.startTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) })} - {format(new Date(shift.endTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) })}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-end font-medium text-gray-600 dark:text-gray-400">
                          {formatCurrency(shift.openingBalance || 0)}
                        </td>
                        <td className="px-5 py-4 text-end">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(shift.totalSales || 0)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-end font-bold text-gray-900 dark:text-white">
                          {formatCurrency(shift.closingBalance || 0)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-xs font-medium text-gray-500">
                            {formatCurrency(expected)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider border ${
                            isOver
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                              : isShort
                                ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-white/5 dark:text-gray-400 dark:border-white/10'
                          }`}>
                            {isOver ? (
                              <><TrendingUp size={12} /> +{discrepancy.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                            ) : isShort ? (
                              <><TrendingDown size={12} /> {discrepancy.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                            ) : (
                              <><Scale size={12} /> {(0).toLocaleString(t('common.locale'))}</>
                            )}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            isOver 
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                              : isShort 
                                ? 'bg-red-500/10 text-red-600 dark:text-red-400' 
                                : 'bg-gray-100 text-gray-500 dark:bg-white/5'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isOver ? 'bg-emerald-500' : isShort ? 'bg-red-500' : 'bg-gray-400'
                            }`} />
                            {isOver ? t('orders.reports.cashGap.over') : isShort ? t('orders.reports.cashGap.short') : t('orders.reports.cashGap.isBalanced')}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedShifts.length / itemsPerPage)}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Summary Note */}
      <div className="bg-paymint-green/5 dark:bg-paymint-green/5 border border-paymint-green/20 dark:border-paymint-green/10 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-paymint-green flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-paymint-green dark:text-paymint-green">{t('orders.reports.cashGap.understandingTitle')}</p>
          <p className="text-xs text-paymint-green dark:text-paymint-green/70 mt-1">
            {t('orders.reports.cashGap.understandingDesc')}
          </p>
        </div>
      </div>
    </div>
  );
});

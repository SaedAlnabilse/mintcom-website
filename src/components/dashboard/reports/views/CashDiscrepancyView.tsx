import { useState, useMemo } from 'react';
import { Scale, TrendingUp, TrendingDown, AlertCircle, User, HelpCircle } from 'lucide-react';
import { BiIcon } from '../../../ui/BiIcon';
import { useCurrency } from '../../../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../../../utils/dateLocale';
import type { Shift } from '../../../../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import React from 'react';
import { Pagination } from '../../../ui';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';
import { StatValue } from '../../../../components/ui/StatValue';

interface CashDiscrepancyViewProps {
  shifts: Shift[];
}

export const CashDiscrepancyView = React.memo(function CashDiscrepancyView({ shifts }: CashDiscrepancyViewProps) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'all' | 'short' | 'over' | 'balanced' | 'uncounted'>('all');
  const itemsPerPage = 10;

  const formatCurrency = (
    value: number,
    className?: string,
    align: 'start' | 'center' | 'end' = 'end',
  ) => (
    <StatValue
      value={value}
      currency={currencySymbol}
      className={className || 'text-sm font-bold'}
      containerClassName={
        align === 'center'
          ? 'justify-center w-full'
          : align === 'end'
            ? 'justify-end w-full'
            : 'justify-start w-full'
      }
    />
  );
  const toNumber = (value: unknown) => Number(value || 0);
  const formatAmount = (value: number) =>
    value.toLocaleString(t('common.locale'), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const getCashSales = (shift: any) =>
    toNumber(shift.cashSales ?? shift.totalCashSales ?? shift.cashPayments ?? 0);
  const getExpectedBalance = (shift: any) =>
    toNumber(
      shift.expectedBalance ??
        shift.expectedCash ??
        shift.expectedCashBalance ??
        toNumber(shift.openingBalance) +
          getCashSales(shift) +
          toNumber(shift.totalPayIn) -
          toNumber(shift.totalPayOut),
    );
  const getClosingBalance = (shift: any) =>
    toNumber(shift.closingBalance ?? shift.actualCash ?? 0);
  const getDiscrepancy = (shift: any) =>
    toNumber(
      shift.discrepancy ??
        shift.variance ??
        getClosingBalance(shift) - getExpectedBalance(shift),
    );

  // Filter only closed shifts with discrepancies
  const closedShifts = useMemo(() => {
    return shifts.filter((s: any) => s.status === 'CLOSED');
  }, [shifts]);

  /**
   * An auto-closed shift was never counted by a human: the API closes it with
   * closingBalance = expectedBalance, so its variance is 0.00 by construction.
   * Treating those as "balanced" would inflate the accuracy rate and hide the
   * real exposure, so every statistic below is computed over counted shifts
   * only, and the uncounted ones are reported separately.
   */
  const isCounted = (shift: any) => !shift.autoClose;
  const countedShifts = useMemo(() => closedShifts.filter(isCounted), [closedShifts]);
  const uncountedShifts = useMemo(
    () => closedShifts.filter((s: any) => !isCounted(s)),
    [closedShifts],
  );

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOver = countedShifts.reduce((acc: number, shift: any) => {
      const disc = getDiscrepancy(shift);
      return disc > 0 ? acc + disc : acc;
    }, 0);

    const totalShort = countedShifts.reduce((acc: number, shift: any) => {
      const disc = getDiscrepancy(shift);
      return disc < 0 ? acc + Math.abs(disc) : acc;
    }, 0);

    const netVariance = totalOver - totalShort;
    const overCount = countedShifts.filter((s: any) => getDiscrepancy(s) > 0.001).length;
    const shortCount = countedShifts.filter((s: any) => getDiscrepancy(s) < -0.001).length;
    const balancedCount = countedShifts.filter((s: any) => {
      const disc = getDiscrepancy(s);
      return disc >= -0.001 && disc <= 0.001;
    }).length;

    // Cash that closed the day without anyone verifying it.
    const unverifiedCash = uncountedShifts.reduce(
      (acc: number, shift: any) => acc + getExpectedBalance(shift),
      0,
    );

    return {
      totalOver,
      totalShort,
      netVariance,
      overCount,
      shortCount,
      balancedCount,
      uncountedCount: uncountedShifts.length,
      unverifiedCash,
      totalShifts: countedShifts.length
    };
  }, [countedShifts, uncountedShifts]);

  // Filter shifts based on status filter
  const filteredShifts = useMemo(() => {
    return closedShifts.filter((s: any) => {
      if (statusFilter === 'uncounted') return !isCounted(s);
      // A drawer nobody counted has no meaningful over/short verdict, so it is
      // excluded from those buckets instead of masquerading as balanced.
      if (!isCounted(s)) return statusFilter === 'all';
      const discrepancy = getDiscrepancy(s);
      if (statusFilter === 'over') return discrepancy > 0.001;
      if (statusFilter === 'short') return discrepancy < -0.001;
      if (statusFilter === 'balanced') return discrepancy >= -0.001 && discrepancy <= 0.001;
      return true;
    });
  }, [closedShifts, statusFilter]);

  // Sort shifts by discrepancy (largest first for over, most negative for short)
  const sortedShifts = useMemo(() => {
    return [...filteredShifts].sort((a: any, b: any) => {
      const discA = Math.abs(getDiscrepancy(a));
      const discB = Math.abs(getDiscrepancy(b));
      return discB - discA; // Sort by absolute value, largest first
    });
  }, [filteredShifts]);

  const handleStatusFilterChange = (filter: 'all' | 'short' | 'over' | 'balanced' | 'uncounted') => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  const paginatedShifts = useMemo(() => {
    return sortedShifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedShifts, currentPage]);

  // Calculate accuracy rate
  const accuracyRatio = stats.totalShifts > 0
    ? (stats.balancedCount / stats.totalShifts)
    : 0;

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
              <BiIcon icon="bi-plus-slash-minus" size={20} />
            </div>
            <span className="dashboard-stat-title">{t('orders.reports.cashGap.netVariance')}</span>
          </div>
          <StatValue 
            value={stats.netVariance} 
            currency={currencySymbol} 
            className={`text-2xl ${stats.netVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
          />
          <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">
            {stats.netVariance >= 0 ? t('orders.reports.cashGap.overExpected') : t('orders.reports.cashGap.underExpected')}
          </p>
        </motion.div>

        {/* Total Over */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 sm:p-5 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <BiIcon icon="bi-arrow-up-circle" size={20} />
            </div>
            <span className="dashboard-stat-title">{t('orders.reports.cashGap.totalOver')}</span>
          </div>
          <StatValue 
            value={stats.totalOver} 
            currency={currencySymbol} 
            className="text-2xl text-amber-600 dark:text-amber-400"
          />
          <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">
            {t('orders.reports.cashGap.shiftsOver', { count: stats.overCount })}
          </p>
        </motion.div>

        {/* Total Short */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 sm:p-5 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <BiIcon icon="bi-arrow-down-circle" size={20} />
            </div>
            <span className="dashboard-stat-title">{t('orders.reports.cashGap.totalShort')}</span>
          </div>
          <StatValue 
            value={-stats.totalShort} 
            currency={currencySymbol} 
            className="text-2xl text-red-600 dark:text-red-400"
          />
          <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">
            {t('orders.reports.cashGap.shiftsShort', { count: stats.shortCount })}
          </p>
        </motion.div>

        {/* Accuracy Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 sm:p-5 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 transition-all duration-300"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center">
              <BiIcon icon="bi-check2-circle" size={20} />
            </div>
            <span className="dashboard-stat-title">{t('orders.reports.cashGap.accuracyRate')}</span>
          </div>
          <StatValue 
            value={accuracyRatio} 
            isPercentage={true} 
            className="text-2xl"
          />
          <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">
            {t('orders.reports.cashGap.shiftsBalanced', { count: stats.balancedCount, total: stats.totalShifts })}
          </p>
          {/* Auto-closed drawers are excluded above, so say so — otherwise the
              rate reads as "97% accurate" when most tills were never counted. */}
          {stats.uncountedCount > 0 && (
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
              {t('orders.reports.cashGap.excludesUncounted', {
                count: stats.uncountedCount,
                defaultValue: '{{count}} uncounted shifts excluded',
              })}
            </p>
          )}
        </motion.div>
      </div>

      {/* The blind spot: a shift the POS closed by itself was balanced to the
          expected amount, so it can never show a variance. Owners need to know
          how much cash went unverified, not just where the gaps were found. */}
      {stats.uncountedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 sm:p-5 flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <HelpCircle size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="text-sm font-black text-amber-700 dark:text-amber-400">
                {t('orders.reports.cashGap.uncountedTitle', {
                  count: stats.uncountedCount,
                  defaultValue: '{{count}} shifts closed without a cash count',
                })}
              </h3>
              <StatValue
                value={stats.unverifiedCash}
                currency={currencySymbol}
                className="text-sm text-amber-700 dark:text-amber-400"
                containerClassName="inline-flex"
              />
            </div>
            <p className="text-xs font-medium text-amber-700/80 dark:text-amber-400/80 mt-1">
              {t('orders.reports.cashGap.uncountedDesc', {
                defaultValue:
                  'The POS closed these drawers on its own (logout, inactivity or user switch) and recorded the expected amount as counted. Their variance is unknown, so they are excluded from the figures above.',
              })}
            </p>
          </div>
        </motion.div>
      )}

      {/* Discrepancy Breakdown Chart */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">{t('orders.reports.cashGap.overview')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col items-center text-center p-5 rounded-xl bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
            <div className="w-12 h-12 mb-3 rounded-full bg-amber-500/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-amber-500" />
            </div>
            <StatValue
              value={stats.overCount}
              className="text-3xl font-black text-amber-600 dark:text-amber-400"
              isInteger
              containerClassName="justify-center w-full"
            />
            <p className="text-xs font-bold text-stone-500 mt-1.5">{t('orders.reports.cashGap.cashOver')}</p>
          </div>
          <div className="flex flex-col items-center text-center p-5 rounded-xl bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800">
            <div className="w-12 h-12 mb-3 rounded-full bg-stone-200 dark:bg-zinc-800 flex items-center justify-center">
              <Scale size={24} className="text-stone-500" />
            </div>
            <StatValue
              value={stats.balancedCount}
              className="text-3xl font-black text-stone-700 dark:text-zinc-300"
              isInteger
              containerClassName="justify-center w-full"
            />
            <p className="text-xs font-bold text-stone-500 mt-1.5">{t('orders.reports.cashGap.balanced')}</p>
          </div>
          <div className="flex flex-col items-center text-center p-5 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
            <div className="w-12 h-12 mb-3 rounded-full bg-red-500/10 flex items-center justify-center">
              <TrendingDown size={24} className="text-red-500" />
            </div>
            <StatValue
              value={stats.shortCount}
              className="text-3xl font-black text-red-600 dark:text-red-400"
              isInteger
              containerClassName="justify-center w-full"
            />
            <p className="text-xs font-bold text-stone-500 mt-1.5">{t('orders.reports.cashGap.cashShort')}</p>
          </div>
        </div>
      </div>

      {/* Detailed Shifts Table */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-stone-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green">
              <Scale size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">{t('orders.reports.cashGap.details')}</h3>
              <p className="text-xs text-stone-500 mt-1">
                {t('orders.reports.cashGap.detailsDesc')}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-stone-400 whitespace-nowrap shrink-0">
            {t('common.showing')}{' '}
            {Math.min(paginatedShifts.length, itemsPerPage).toLocaleString(t('common.locale'))}
            {' '}{t('common.of')}{' '}
            {sortedShifts.length.toLocaleString(t('common.locale'))}
            {' '}{t('dashboard.menu.shiftsReports')}
          </span>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-4 border-b border-stone-200 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: t('orders.reports.cashGap.all'), icon: Scale, color: 'gray' },
            { id: 'over', label: t('orders.reports.cashGap.over'), icon: TrendingUp, color: 'amber' },
            { id: 'short', label: t('orders.reports.cashGap.short'), icon: TrendingDown, color: 'red' },
            { id: 'balanced', label: t('orders.reports.cashGap.balanced'), icon: Scale, color: 'blue' },
            { id: 'uncounted', label: t('orders.reports.cashGap.notCounted', { defaultValue: 'Not counted' }), icon: HelpCircle, color: 'amber' },
          ].map((filter) => {
            const isSelected = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                onClick={() => handleStatusFilterChange(filter.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? filter.color === 'amber'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-500/20'
                      : filter.color === 'red'
                        ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                        : filter.color === 'blue'
                          ? 'bg-stone-500 text-white border-stone-500 shadow-lg shadow-stone-500/20'
                          : 'bg-stone-900 dark:bg-white text-white dark:text-black border-stone-900 dark:border-white shadow-lg shadow-stone-900/20 dark:shadow-white/20'
                    : 'bg-white dark:bg-zinc-800 text-stone-500 border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800'
                }`}
              >
                <filter.icon size={14} />
                {filter.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-lg text-[10px] ${
                  isSelected ? 'bg-black/10 dark:bg-zinc-800' : 'bg-stone-100 dark:bg-zinc-800'
                }`}>
                  {filter.id === 'all'
                    ? closedShifts.length
                    : filter.id === 'over'
                      ? stats.overCount
                      : filter.id === 'short'
                        ? stats.shortCount
                        : filter.id === 'uncounted'
                          ? stats.uncountedCount
                          : stats.balancedCount}
                </span>
              </button>
            );
          })}
        </div>

        {sortedShifts.length === 0 ? (
          <AnalyticsEmptyState
            icon={Scale}
            title={t('orders.reports.cashGap.noData')}
            description={t('orders.reports.cashGap.noClosedShifts')}
            compact
            className="py-14"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50 dark:bg-zinc-800/40">
                  <tr className="border-b border-stone-200 dark:border-zinc-800">
                    <th className="px-5 py-4 text-start label-strong font-sans whitespace-nowrap">{t('orders.reports.cashGap.staff')}</th>
                    <th className="px-5 py-4 text-start label-strong font-sans whitespace-nowrap">{t('orders.reports.cashGap.period')}</th>
                    <th className="px-5 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.cashGap.opening')}</th>
                    <th className="px-5 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.shifts.cashSales', { defaultValue: 'Cash Sales' })}</th>
                    <th className="px-5 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.cashGap.drawerMovements', { defaultValue: 'Pay In / Out' })}</th>
                    <th className="px-5 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.shifts.expectedCash', { defaultValue: 'Expected Cash' })}</th>
                    <th className="px-5 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.cashGap.counted', { defaultValue: 'Counted' })}</th>
                    <th className="px-5 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.cashGap.variance')}</th>
                    <th className="px-5 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.reports.cashGap.countType', { defaultValue: 'Count' })}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {paginatedShifts.map((shift: any, idx: number) => {
                    const discrepancy = getDiscrepancy(shift);
                    const expected = getExpectedBalance(shift);
                    const cashSales = getCashSales(shift);
                    const payIn = toNumber(shift.totalPayIn);
                    const payOut = toNumber(shift.totalPayOut);
                    const counted = isCounted(shift);
                    const isOver = counted && discrepancy > 0.001;
                    const isShort = counted && discrepancy < -0.001;
                    return (
                      <motion.tr
                        key={shift.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        className="group hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="px-5 py-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-mintcom-green/10 text-mintcom-green flex items-center justify-center font-black text-xs shrink-0">
                              <User size={14} />
                            </div>
                            <span className="font-bold text-stone-900 dark:text-zinc-100 text-sm">
                              {shift.user?.username || t('common.unknown')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-start">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-stone-900 dark:text-zinc-100">
                              {format(new Date(shift.startTime), 'MMM d, yyyy', { locale: getDateLocale(t('common.locale')) })}
                            </span>
                            <span className="text-xs text-stone-500">
                              {format(new Date(shift.startTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) })} - {format(new Date(shift.endTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) })}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-end">
                          {formatCurrency(shift.openingBalance || 0, 'text-sm font-medium text-stone-600 dark:text-zinc-400', 'end')}
                        </td>
                        <td className="px-5 py-4 text-end">
                          <StatValue
                            value={cashSales}
                            currency={currencySymbol}
                            prefix="+"
                            className="text-sm font-bold text-emerald-600 dark:text-emerald-400"
                            containerClassName="justify-end w-full"
                          />
                        </td>
                        <td className="px-5 py-4 text-end">
                          {/* Pay-ins and pay-outs move real cash in and out of
                              the drawer mid-shift and are invisible everywhere
                              else in the reports. */}
                          {payIn < 0.001 && payOut < 0.001 ? (
                            <span className="text-sm text-stone-400 font-normal">-</span>
                          ) : (
                            <div className="flex flex-col items-end gap-0.5">
                              {payIn > 0.001 && (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                                  +{formatAmount(payIn)} {t('orders.reports.sales.payIn')}
                                </span>
                              )}
                              {payOut > 0.001 && (
                                <span className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap">
                                  -{formatAmount(payOut)} {t('orders.reports.sales.payOut')}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-end">
                          {formatCurrency(expected, 'text-sm font-medium text-stone-500', 'end')}
                        </td>
                        <td className="px-5 py-4 text-end">
                          {counted
                            ? formatCurrency(getClosingBalance(shift), 'text-sm font-bold text-stone-900 dark:text-zinc-100', 'end')
                            : (
                              <span className="text-xs font-bold text-stone-400 dark:text-zinc-500 whitespace-nowrap">
                                {t('orders.reports.cashGap.neverCounted', { defaultValue: 'Not counted' })}
                              </span>
                            )}
                        </td>
                        <td className="px-5 py-4 text-end">
                          <div className="flex justify-end">
                            {/* An uncounted drawer has no verdict to give. Showing
                                0.00 here would be a lie the POS invented when it
                                closed the shift at the expected amount. */}
                            {!counted ? (
                              // Quiet on purpose: the Count column next to it
                              // says why, and a wall of identical warning chips
                              // reads as noise rather than as information.
                              <span
                                className="text-sm font-bold text-stone-300 dark:text-zinc-600"
                                title={t('orders.reports.cashGap.notVerified', { defaultValue: 'Unverified' })}
                              >
                                —
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black tracking-wider border ${
                                isOver
                                  ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                  : isShort
                                    ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                    : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800'
                              }`}>
                                {isOver ? <TrendingUp size={12} className="shrink-0" /> : isShort ? <TrendingDown size={12} className="shrink-0" /> : <Scale size={12} className="shrink-0" />}
                                <StatValue
                                  value={isShort || isOver ? discrepancy : 0}
                                  currency={currencySymbol}
                                  className="text-xs"
                                  containerClassName="inline-flex"
                                />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-end">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              counted
                                ? 'bg-mintcom-green/10 text-mintcom-green'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${counted ? 'bg-mintcom-green' : 'bg-amber-500'}`} />
                              {counted
                                ? t('orders.reports.shifts.manualClose', { defaultValue: 'Cashed out' })
                                : t('orders.reports.shifts.autoClosed', { defaultValue: 'Auto-closed' })}
                            </span>
                            {/* Why the POS closed it for them — inactivity,
                                logout, user switch — is the actionable part. */}
                            {!counted && shift.closeReason && (
                              <span className="text-[11px] font-semibold text-stone-400 dark:text-zinc-500 whitespace-nowrap">
                                {t(`orders.reports.cashGap.closeReasons.${shift.closeReason}`, {
                                  defaultValue: String(shift.closeReason).replace(/_/g, ' ').toLowerCase(),
                                })}
                              </span>
                            )}
                          </div>
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
      <div className="bg-mintcom-green/5 dark:bg-mintcom-green/5 border border-mintcom-green/20 dark:border-mintcom-green/10 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-mintcom-green flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-mintcom-green dark:text-mintcom-green">{t('orders.reports.cashGap.understandingTitle')}</p>
          <p className="text-xs text-mintcom-green dark:text-mintcom-green/70 mt-1">
            {t('orders.reports.cashGap.understandingDesc')}
          </p>
        </div>
      </div>
    </div>
  );
});

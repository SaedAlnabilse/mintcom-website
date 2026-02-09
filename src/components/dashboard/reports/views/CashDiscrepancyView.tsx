import { useState, useMemo } from 'react';
import { Scale, TrendingUp, TrendingDown, AlertCircle, User } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { Shift } from '../../../../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import React from 'react';
import { Pagination } from '../../../ui';
import { useTranslation } from 'react-i18next';

interface CashDiscrepancyViewProps {
  shifts: Shift[];
}

export const CashDiscrepancyView = React.memo(function CashDiscrepancyView({ shifts }: CashDiscrepancyViewProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
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

  // Sort shifts by discrepancy (largest first for over, most negative for short)
  const sortedShifts = useMemo(() => {
    return [...closedShifts].sort((a: any, b: any) => {
      const discA = Math.abs(a.discrepancy || 0);
      const discB = Math.abs(b.discrepancy || 0);
      return discB - discA; // Sort by absolute value, largest first
    });
  }, [closedShifts]);

  const paginatedShifts = useMemo(() => {
    return sortedShifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedShifts, currentPage]);

  // Calculate accuracy rate
  const accuracyRate = stats.totalShifts > 0 
    ? Math.round((stats.balancedCount / stats.totalShifts) * 100) 
    : 0;

  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 transform rotate-3">
          <Scale size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No shift data found</h3>
        <p className="text-xs font-medium text-gray-500 max-w-sm leading-relaxed">
          There are no closed shifts recorded for the selected time period.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Variance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl border shadow-sm ${
            stats.netVariance >= 0 
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-500/10 dark:to-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' 
              : 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-500/10 dark:to-red-500/5 border-red-200 dark:border-red-500/20'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              stats.netVariance >= 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}>
              <Scale size={20} />
            </div>
            <span className="text-xs font-black text-gray-500 tracking-widest uppercase">Net Variance</span>
          </div>
          <p className={`text-2xl font-black ${stats.netVariance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {stats.netVariance >= 0 ? '+' : ''}{formatCurrency(stats.netVariance)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.netVariance >= 0 ? 'More cash than expected' : 'Less cash than expected'}
          </p>
        </motion.div>

        {/* Total Over */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-emerald-200 dark:border-emerald-500/20 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <span className="text-xs font-black text-gray-500 tracking-widest uppercase">Total Over</span>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(stats.totalOver)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.overCount} shift{stats.overCount !== 1 ? 's' : ''} over
          </p>
        </motion.div>

        {/* Total Short */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-red-200 dark:border-red-500/20 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <TrendingDown size={20} />
            </div>
            <span className="text-xs font-black text-gray-500 tracking-widest uppercase">Total Short</span>
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">
            -{formatCurrency(stats.totalShort)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.shortCount} shift{stats.shortCount !== 1 ? 's' : ''} short
          </p>
        </motion.div>

        {/* Accuracy Rate */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <span className="text-xs font-black text-gray-500 tracking-widest uppercase">Accuracy Rate</span>
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white">
            {accuracyRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.balancedCount} of {stats.totalShifts} shifts balanced
          </p>
        </motion.div>
      </div>

      {/* Discrepancy Breakdown Chart */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-6 shadow-sm">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6">Discrepancy Overview</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp size={24} className="text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.overCount}</p>
            <p className="text-xs font-bold text-gray-500">Cash Over</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center">
              <Scale size={24} className="text-gray-500" />
            </div>
            <p className="text-2xl font-black text-gray-700 dark:text-gray-300">{stats.balancedCount}</p>
            <p className="text-xs font-bold text-gray-500">Balanced</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-red-500/10 flex items-center justify-center">
              <TrendingDown size={24} className="text-red-500" />
            </div>
            <p className="text-2xl font-black text-red-600 dark:text-red-400">{stats.shortCount}</p>
            <p className="text-xs font-bold text-gray-500">Cash Short</p>
          </div>
        </div>
      </div>

      {/* Detailed Shifts Table */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Shift Discrepancy Details</h3>
            <p className="text-xs font-black text-gray-400 tracking-widest mt-1">
              Sorted by largest variance
            </p>
          </div>
          <span className="text-xs font-bold text-gray-400">
            Showing {Math.min(paginatedShifts.length, itemsPerPage)} of {sortedShifts.length} shifts
          </span>
        </div>
        
        {sortedShifts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-sm">No closed shifts with discrepancy data found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-white/[0.02]">
                  <tr className="border-b border-gray-200 dark:border-white/5">
                    <th className="px-5 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Staff</th>
                    <th className="px-5 py-4 text-left text-xs font-black text-gray-400 tracking-widest">Shift Period</th>
                    <th className="px-5 py-4 text-right text-xs font-black text-gray-400 tracking-widest">Opening</th>
                    <th className="px-5 py-4 text-right text-xs font-black text-gray-400 tracking-widest">Sales</th>
                    <th className="px-5 py-4 text-right text-xs font-black text-gray-400 tracking-widest">Closing</th>
                    <th className="px-5 py-4 text-center text-xs font-black text-gray-400 tracking-widest">Expected</th>
                    <th className="px-5 py-4 text-center text-xs font-black text-gray-400 tracking-widest">Variance</th>
                    <th className="px-5 py-4 text-center text-xs font-black text-gray-400 tracking-widest">Status</th>
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
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xs">
                              <User size={14} />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                              {shift.user?.username || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                              {format(new Date(shift.startTime), 'MMM d, yyyy')}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(shift.startTime), 'HH:mm')} - {format(new Date(shift.endTime), 'HH:mm')}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-medium text-gray-600 dark:text-gray-400">
                          {formatCurrency(shift.openingBalance || 0)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(shift.totalSales || 0)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-gray-900 dark:text-white">
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
                              <><TrendingUp size={12} /> +{formatCurrency(discrepancy).replace(currencySymbol, '').trim()}</>
                            ) : isShort ? (
                              <><TrendingDown size={12} /> {formatCurrency(discrepancy).replace(currencySymbol, '').trim()}</>
                            ) : (
                              <><Scale size={12} /> 0</>
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
                            {isOver ? 'Over' : isShort ? 'Short' : 'Balanced'}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
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
          </>
        )}
      </div>

      {/* Summary Note */}
      <div className="bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/10 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-900 dark:text-blue-400">Understanding Cash Gap Reports</p>
          <p className="text-xs text-blue-700 dark:text-blue-300/70 mt-1">
            Variance is calculated as: (Closing Balance - Opening Balance) - Total Sales. 
            Positive values indicate cash over, negative values indicate cash short. 
            Regular small variances are normal, but large or frequent discrepancies may indicate training needs.
          </p>
        </div>
      </div>
    </div>
  );
});

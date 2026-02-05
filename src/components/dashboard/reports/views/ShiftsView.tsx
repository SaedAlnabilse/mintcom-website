import { Activity, Clock, Wallet } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { Shift } from '../../../../types';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import React from 'react';

interface ShiftsViewProps {
  shifts: Shift[];
}

export const ShiftsView = React.memo(function ShiftsView({ shifts }: ShiftsViewProps) {
  const { formatAmount, currencySymbol } = useCurrency();

  const formatCurrency = (value: number) => formatAmount(value);

  // If no shifts, return empty state early (though original code handles it inside map with a fallback row if length > 0 check fails, but simpler here)
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 transform rotate-3">
          <Clock size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No shift activity found</h3>
        <p className="text-xs font-medium text-gray-500 max-w-sm leading-relaxed">
          There are no shifts recorded for the selected time period.
        </p>
      </div>
    );
  }

  const totalVariance = shifts.reduce((acc: number, shift: any) => acc + (shift.discrepancy || 0), 0);
  const activeShifts = shifts.filter((s: any) => s.status === 'OPEN').length;

  return (
    <div className="space-y-6">
      {/* Audit Oversight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-100 dark:border-white/[0.05] shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-orange-500">
            <Activity size={20} />
            <h4 className="text-xs font-black tracking-widest text-gray-400">Cash Variance</h4>
          </div>
          <p className={`text-3xl font-black ${totalVariance < -0.01 ? 'text-red-500' : 'text-paymint-green'}`}>
            {totalVariance > 0 ? '+' : ''}{formatCurrency(totalVariance)}
          </p>
          <p className="text-xs font-bold text-gray-500 mt-2">Total over/short</p>
        </div>
        <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-100 dark:border-white/[0.05] shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-blue-500">
            <Clock size={20} />
            <h4 className="text-xs font-black tracking-widest text-gray-400">Shifts</h4>
          </div>
          <p className="text-3xl font-black text-gray-900 dark:text-white">{shifts.length}</p>
          <p className="text-xs font-bold text-gray-500 mt-2">{activeShifts} active shifts</p>
        </div>
        <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-100 dark:border-white/[0.05] shadow-sm">
          <div className="flex items-center gap-3 mb-4 text-paymint-green">
            <Wallet size={20} />
            <h4 className="text-xs font-black tracking-widest text-gray-400">Audited</h4>
          </div>
          <p className="text-3xl font-black text-paymint-green">100%</p>
          <p className="text-xs font-bold text-gray-500 mt-2">Shifts closed</p>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th className="px-5 py-5 text-left text-xs font-black text-gray-400 tracking-widest">Staff</th>
                <th className="px-5 py-5 text-left text-xs font-black text-gray-400 tracking-widest">Time</th>
                <th className="px-5 py-5 text-right text-xs font-black text-gray-400 tracking-widest">Opening</th>
                <th className="px-5 py-5 text-right text-xs font-black text-gray-400 tracking-widest">Sales</th>
                <th className="px-5 py-5 text-right text-xs font-black text-gray-400 tracking-widest">Closing</th>
                <th className="px-5 py-5 text-center text-xs font-black text-gray-400 tracking-widest">Variance</th>
                <th className="px-5 py-5 text-center text-xs font-black text-gray-400 tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {shifts.map((shift: any, idx: number) => (
                <motion.tr
                  key={shift.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-black text-xs">
                        {shift.user?.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">{shift.user?.username || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {format(new Date(shift.startTime), 'MMM d, HH:mm')}
                      </span>
                      <span className="text-xs font-medium text-gray-500">
                        to {shift.endTime ? format(new Date(shift.endTime), 'HH:mm') : 'Present'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-5 text-right font-medium text-gray-500">
                    {formatCurrency(shift.openingBalance)}
                  </td>
                  <td className="px-5 py-5 text-right font-bold text-paymint-green">
                    {formatCurrency(shift.totalSales)}
                  </td>
                  <td className="px-5 py-5 text-right">
                    {shift.status === 'CLOSED' ? (
                      <span className="font-bold text-blue-500">
                        {shift.closingBalance !== null && shift.closingBalance !== undefined
                          ? formatCurrency(shift.closingBalance)
                          : '—'}
                      </span>
                    ) : (
                      <span className="text-xs font-black text-gray-400 tracking-widest">Active</span>
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
                            ? `+${formatAmount(shift.discrepancy).replace(currencySymbol, '').trim()} Over`
                            : shift.discrepancy < -0.001
                              ? `${formatAmount(shift.discrepancy).replace(currencySymbol, '').trim()} Short`
                              : '0'}
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
                      {shift.status.charAt(0).toUpperCase() + shift.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
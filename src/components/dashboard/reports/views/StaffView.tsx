import { Users, Activity } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { Shift, ShiftOption } from '../../../../types';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useState } from 'react';
import { Pagination } from '../../../ui';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface StaffViewProps {
  shifts: Shift[];
  selectedEmployeeId: string | null;
  employees: { label: string; value: string }[];
  employeeShifts: ShiftOption[];
}

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const StaffView = React.memo(function StaffView({ shifts, selectedEmployeeId, employees, employeeShifts }: StaffViewProps) {
  const { t } = useTranslation();
  const { formatAmount, currencySymbol } = useCurrency();
  const [staffPage, setStaffPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (value: number) => formatAmount(value);

  // If no shifts, return empty state early
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 transform rotate-3">
          <Users size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('orders.reports.staff.noActivity')}</h3>
        <p className="text-xs font-medium text-gray-500 max-w-sm leading-relaxed">
          {t('orders.reports.staff.noActivityDesc')}
        </p>
      </div>
    );
  }

  // Calculate Aggregates
  const selectedEmp = selectedEmployeeId ? employees.find(e => e.value === selectedEmployeeId) : null;
  const empName = selectedEmp?.label || t('orders.reports.staff.byStaff');
  const isSpecificEmployee = !!selectedEmployeeId;

  // Use employee shifts if employee selected, otherwise use all shifts
  const dataSource = isSpecificEmployee ? employeeShifts : shifts;

  // Calculate stats
  const totalHours = dataSource.reduce((acc: number, shift: any) => {
    if (shift.startTime) {
      const start = new Date(shift.startTime);
      const end = shift.endTime ? new Date(shift.endTime) : new Date();
      return acc + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return acc;
  }, 0);

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

  // Leaderboard Calculation
  const employeeStats = shifts.reduce((acc: any, shift: any) => {
    const username = shift.user?.username || 'Unknown';
    if (!acc[username]) {
      acc[username] = {
        username,
        totalShifts: 0,
        totalSales: 0,
        totalHours: 0,
        avgTransaction: 0,
        transactionCount: shift.orderCount || 20,
      };
    }
    acc[username].totalShifts += 1;
    acc[username].totalSales += shift.totalSales || 0;
    acc[username].transactionCount += shift.orderCount || 0;
    if (shift.startTime) {
      const start = new Date(shift.startTime);
      const end = shift.endTime ? new Date(shift.endTime) : new Date();
      acc[username].totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }
    return acc;
  }, {});

  const sortedEmployees = Object.values(employeeStats).sort((a: any, b: any) => b.totalSales - a.totalSales);
  const totalStoreSales = sortedEmployees.reduce((acc: number, curr: any) => acc + curr.totalSales, 0);

  // Prepare Pie Chart Data (Top 4 + Others)
  const pieData = sortedEmployees.slice(0, 4).map((emp: any) => ({
    name: emp.username,
    value: emp.totalSales,
    color: ''
  }));
  if (sortedEmployees.length > 4) {
    pieData.push({
      name: t('common.others', 'Others'),
      value: sortedEmployees.slice(4).reduce((acc: number, curr: any) => acc + curr.totalSales, 0),
      color: '#94A3B8'
    });
  }

  // Assign colors
  pieData.forEach((entry: any, index: number) => {
    if (entry.name !== 'Others' && entry.name !== 'أخرى') entry.color = COLORS[index % COLORS.length];
  });

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-paymint-green/10 flex items-center justify-center">
            <Users size={24} className="text-paymint-green" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isSpecificEmployee ? t('orders.reports.staff.performance', { name: empName }) : t('orders.reports.staff.overview')}
            </h3>
            <p className="text-xs text-gray-500">{t('orders.reports.staff.breakdown')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">{t('orders.reports.staff.totalHours')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-gray-500">{t('orders.reports.staff.byStaff')} {empName}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">{t('orders.reports.staff.totalOrders')}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
            <p className="text-xs text-gray-500">{t('orders.reports.staff.byStaff')} {empName}</p>
          </div>
          <div className="p-4 rounded-xl bg-paymint-green/10 border border-paymint-green/20">
            <p className="text-xs font-black text-paymint-green tracking-widest mb-1">{t('orders.reports.staff.totalSales')}</p>
            <p className="text-xl font-bold text-paymint-green">{totalSales.toFixed(3)} {currencySymbol}</p>
            <p className="text-xs text-paymint-green/70">{t('orders.reports.staff.byStaff')} {empName}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">{t('orders.reports.staff.totalDiscounts')}</p>
            <p className="text-xl font-bold text-orange-500">{totalDiscounts.toFixed(3)} {currencySymbol}</p>
            <p className="text-xs text-gray-500">{t('orders.reports.staff.issuedBy', { name: empName })}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">{t('orders.reports.staff.totalRefunds')}</p>
            <p className="text-xl font-bold text-red-500">{totalRefunds.toFixed(3)} {currencySymbol}</p>
            <p className="text-xs text-gray-500">{t('orders.reports.staff.byStaff')} {empName}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">{t('orders.reports.staff.totalVariances')}</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-emerald-500">+{positiveVariance.toFixed(2)}</span>
              <span className="text-gray-300">/</span>
              <span className="text-sm font-bold text-red-500">-{negativeVariance.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-500">{t('orders.reports.staff.byStaff')} {empName}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Visual Analytics Row - Hide when filtered by specific employee */}
        {!selectedEmployeeId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 1. Revenue Share Chart (The "Slice" View) */}
            <div className="bg-white dark:bg-[#0B1120] p-6 rounded-[24px] border border-gray-100 dark:border-white/[0.05] shadow-sm flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('orders.reports.staff.salesShare')}</h3>
                <p className="text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.byStaff')}</p>
              </div>
              <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number | undefined) => formatCurrency(value || 0)}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stat */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-xs font-black text-gray-400">{t('owner.overview.total')}</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{formatAmount(totalStoreSales).replace(currencySymbol, '').trim()}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {pieData.map((entry: any) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <p className="text-xs font-bold text-gray-500 truncate">{entry.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Top Performer Spotlight (The "Star" View) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedEmployees.slice(0, 2).map((emp: any, idx: number) => (
                <motion.div
                  key={emp.username}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative overflow-hidden p-6 rounded-[24px] border shadow-lg flex flex-col justify-between ${idx === 0
                    ? 'bg-gradient-to-br from-[#7CC39F] to-[#5FAF87] text-black border-transparent'
                    : 'bg-white dark:bg-[#0B1120] border-gray-100 dark:border-white/[0.05]'
                    }`}
                >
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${idx === 0 ? 'bg-black/10' : 'bg-paymint-green/10 text-paymint-green'}`}>
                        {emp.username.charAt(0).toUpperCase()}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-black tracking-widest ${idx === 0 ? 'bg-black/10 text-black' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                        {idx === 0 ? `#1 ${t('common.top', 'Top')}` : `#${idx + 1}`}
                      </div>
                    </div>

                    <div>
                      <h3 className={`text-xl font-black mb-1 ${idx === 0 ? 'text-black' : 'text-gray-900 dark:text-white'}`}>{emp.username}</h3>
                      <div className="flex gap-4 mt-4">
                        <div>
                          <p className={`text-xs font-black tracking-widest mb-1 ${idx === 0 ? 'text-black/60' : 'text-gray-400'}`}>{t('orders.reports.staff.revenue')}</p>
                          <p className={`text-2xl font-black ${idx === 0 ? 'text-black' : 'text-gray-900 dark:text-white'}`}>{formatAmount(emp.totalSales).replace(currencySymbol, '').trim()}</p>
                        </div>
                        <div>
                          <p className={`text-xs font-black tracking-widest mb-1 ${idx === 0 ? 'text-black/60' : 'text-gray-400'}`}>{t('orders.reports.staff.avgTicket')}</p>
                          <p className={`text-2xl font-black ${idx === 0 ? 'text-black' : 'text-gray-900 dark:text-white'}`}>
                            {formatAmount(emp.totalSales / (emp.transactionCount || 1)).replace(currencySymbol, '').trim()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  {idx === 0 && <Activity className="absolute -right-6 -bottom-6 w-40 h-40 text-black/5 rotate-12" />}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Detailed Metrics Table */}
        <div className="bg-white dark:bg-[#0B1120] rounded-[24px] border border-gray-100 dark:border-white/[0.05] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">{t('orders.reports.staff.title')}</h3>
              <p className="text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.subtitle')}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-white/[0.01]">
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.rank')}</th>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.staff')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.sales')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.share')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.avgOrder')}</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.salesPerHour')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.03]">
                {sortedEmployees
                  .slice((staffPage - 1) * itemsPerPage, staffPage * itemsPerPage)
                  .map((emp: any, idx: number) => {
                    const share = totalStoreSales > 0 ? ((emp.totalSales / totalStoreSales) * 100).toFixed(1) : '0';
                    const avgTicket = emp.totalSales / (emp.transactionCount || 1);
                    const efficiency = emp.totalSales / (emp.totalHours || 1);

                    return (
                      <tr key={emp.username} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-left">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-[#7CC39F]/20 text-[#7CC39F]' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                            {idx + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{emp.username}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                          {formatCurrency(emp.totalSales)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${share}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-500">{share}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                          {formatAmount(avgTicket).replace(currencySymbol, '').trim()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs font-bold text-gray-500">
                            {formatAmount(efficiency).replace(currencySymbol, '').trim()} / {t('orders.reports.staff.perHour')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-white/[0.05]">
            <Pagination
              currentPage={staffPage}
              totalPages={Math.ceil(sortedEmployees.length / itemsPerPage)}
              onPageChange={(p) => setStaffPage(p)}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
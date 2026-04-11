import { Users, Activity, TrendingUp, ShoppingBag } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { Shift, ShiftOption } from '../../../../types';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useState } from 'react';
import { Pagination } from '../../../ui';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';

interface StaffViewProps {
  shifts: Shift[];
  selectedEmployeeId: string | null;
  employees: { label: string; value: string }[];
  employeeShifts: ShiftOption[];
}

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const StaffView = React.memo(function StaffView({ shifts, selectedEmployeeId, employees, employeeShifts }: StaffViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locationSlug, slug } = useParams();
  const activeSlug = locationSlug || slug;
  const { formatAmount, currencySymbol } = useCurrency();
  const [staffPage, setStaffPage] = useState(1);
  const itemsPerPage = 10;

  const formatCurrency = (value: number) => formatAmount(value);
  const getNumericTooltipValue = (value: number | string | ReadonlyArray<number | string> | undefined) => {
    const normalizedValue = Array.isArray(value) ? value[0] : value;
    return typeof normalizedValue === 'number' ? normalizedValue : Number(normalizedValue ?? 0);
  };

  // If no shifts, return empty state early
  if (shifts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm">
        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 transform rotate-3">
          <Users size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('orders.reports.staff.noActivity')}</h3>
        <p className="text-xs font-medium text-gray-500 max-w-sm leading-relaxed">
          {t('orders.reports.staff.noActivityDesc')}
        </p>
      </div>
    );
  }

  // Calculate Aggregates
  const selectedEmp = selectedEmployeeId ? employees.find(e => e.value === selectedEmployeeId) : null;
  const empName = selectedEmp?.label || '';
  const isSpecificEmployee = !!selectedEmployeeId;
  const footerText = isSpecificEmployee ? `${t('orders.reports.staff.byStaff')} ${empName}` : (t('common.allStaff') || 'All Staff');
  const footerIssuedText = isSpecificEmployee ? (t('orders.reports.staff.issuedBy', { name: empName }) || `Issued by ${empName}`) : (t('common.allStaff') || 'All Staff');

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
    const username = shift.user?.username || t('common.unknown');
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

  const sortedEmployees: any[] = Object.values(employeeStats).sort((a: any, b: any) => b.totalSales - a.totalSales);
  const totalStoreSales = sortedEmployees.reduce((acc: number, curr: any) => acc + curr.totalSales, 0);

  // Prepare Pie Chart Data (Top 4 + Others)
  const pieData = sortedEmployees.slice(0, 4).map((emp: any) => ({
    name: emp.username,
    value: emp.totalSales,
    color: ''
  }));
  if (sortedEmployees.length > 4) {
    pieData.push({
      name: t('common.others'),
      value: sortedEmployees.slice(4).reduce((acc: number, curr: any) => acc + curr.totalSales, 0),
      color: '#94A3B8'
    });
  }

  // Assign colors
  pieData.forEach((entry: any, index: number) => {
    if (entry.name !== t('common.others')) entry.color = COLORS[index % COLORS.length];
  });

  return (
    <div className="space-y-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Overview Cards */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {isSpecificEmployee ? t('orders.reports.staff.performance', { name: empName }) : t('orders.reports.staff.overview')}
            </h3>
            <p className="text-xs text-gray-500">{t('orders.reports.staff.breakdown')}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Total Hours */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300 overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 truncate">{t('orders.reports.staff.totalHours')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">{totalHours.toLocaleString(t('common.locale'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-auto truncate" title={footerText}>{footerText}</p>
          </div>

          {/* Total Orders */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300 overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 truncate">{t('orders.reports.staff.totalOrders')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">{totalOrders.toLocaleString(t('common.locale'))}</p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-auto truncate" title={footerText}>{footerText}</p>
          </div>

          {/* Total Sales */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300 overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 truncate">{t('orders.reports.staff.totalSales')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mb-1">{formatCurrency(totalSales)}</p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-auto truncate" title={footerText}>{footerText}</p>
          </div>

          {/* Total Discounts */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300 overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 truncate">{t('orders.reports.staff.totalDiscounts')}</p>
            <p className="text-2xl font-bold text-orange-500 tracking-tight mb-1">{formatCurrency(totalDiscounts)}</p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-auto truncate" title={footerIssuedText}>{footerIssuedText}</p>
          </div>

          {/* Total Refunds */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300 overflow-hidden">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 truncate">{t('orders.reports.staff.totalRefunds')}</p>
            <p className="text-2xl font-bold text-red-500 tracking-tight mb-1">{formatCurrency(totalRefunds)}</p>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-auto truncate" title={footerText}>{footerText}</p>
          </div>

          {/* Variances */}
          <div 
            onClick={() => navigate(`/dashboard/${activeSlug}/reports/shifts`)}
            className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] flex flex-col transition-all duration-300 overflow-hidden cursor-pointer group"
          >
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-paymint-green transition-colors tracking-wide mb-1 truncate">{t('orders.reports.staff.totalVariances')}</p>
            <div className="flex flex-wrap items-center gap-1.5 mb-1 leading-none">
              <span className="text-xl font-bold text-amber-500 tracking-tight">+{positiveVariance.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-gray-300 dark:text-white/20 font-light text-xl">/</span>
              <span className="text-xl font-bold text-red-500 tracking-tight">-{negativeVariance.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mt-auto truncate" title={footerText}>{footerText}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Visual Analytics Row - Hide when filtered by specific employee */}
        {!selectedEmployeeId && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* 1. Revenue Share Chart (The "Slice" View) */}
            <div className="bg-white dark:bg-[#1E293B] p-5 rounded-[24px] border border-gray-100 dark:border-white/[0.05] shadow-sm flex flex-col">
              <div className="mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('orders.reports.staff.salesShare')}</h3>
                <p className="text-xs text-gray-500">{t('orders.reports.staff.byStaff')}</p>
              </div>
              <div className="flex-1 min-h-[160px] relative" dir="ltr">
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
                      cornerRadius={8}
                    >
                      {pieData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(getNumericTooltipValue(value))}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', backgroundColor: '#fff', color: '#000', fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Stat */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center bg-white dark:bg-[#1E293B] w-20 h-20 rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-gray-50 dark:border-white/5">
                    <p className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{t('owner.overview.total')}</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white mt-0.5">{totalStoreSales.toLocaleString(t('common.locale'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {pieData.map((entry: any) => (
                  <div key={entry.name} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-gray-100 dark:border-white/5">
                    <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                    <p className="text-[13px] font-bold text-gray-600 dark:text-gray-300 truncate max-w-[120px]" title={entry.name}>{entry.name}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Top Performer Spotlight (The "Star" View) */}
            {sortedEmployees.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative overflow-hidden p-5 rounded-[24px] border border-transparent shadow-xl flex flex-col justify-between bg-gradient-to-br from-[#7CC39F] via-[#5FAF87] to-[#3A8A61]"
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
                <Activity className="absolute -right-4 -bottom-4 w-32 h-32 text-black/5 rotate-12" />

                <div className="relative z-10 flex-1 flex flex-col">
                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md shadow-inner flex items-center justify-center font-black text-xl text-white border border-white/30">
                        {sortedEmployees[0].username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black tracking-widest text-white border border-white/20 mb-1 shadow-sm uppercase">
                          <span className="text-yellow-300">★</span> {t('common.top')} #1
                        </div>
                        <h3 className="text-xl font-black text-white drop-shadow-sm tracking-tight">{sortedEmployees[0].username}</h3>
                      </div>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="mt-auto grid grid-cols-2 gap-3">
                    <div className="bg-black/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group hover:bg-black/20 transition-colors">
                      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                        <TrendingUp size={20} className="text-white" />
                      </div>
                      <p className="text-[10px] font-black tracking-widest mb-1 text-white/70 uppercase">{t('orders.reports.staff.revenue')}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black text-white tracking-tight">{sortedEmployees[0].totalSales.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <span className="text-xs font-bold text-white/80">{currencySymbol}</span>
                      </div>
                    </div>
                    <div className="bg-black/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative overflow-hidden group hover:bg-black/20 transition-colors">
                      <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                        <ShoppingBag size={20} className="text-white" />
                      </div>
                      <p className="text-[10px] font-black tracking-widest mb-1 text-white/70 uppercase">{t('orders.reports.staff.avgTicket')}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-2xl font-black text-white tracking-tight">
                          {(sortedEmployees[0].totalSales / (sortedEmployees[0].transactionCount || 1)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <span className="text-xs font-bold text-white/80">{currencySymbol}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* 3. Detailed Metrics Table */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[24px] border border-gray-100 dark:border-white/[0.05] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 dark:border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('orders.reports.staff.title')}</h3>
              <p className="text-xs text-gray-500">{t('orders.reports.staff.subtitle')}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-white/[0.01]">
                <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                  <th className="px-6 py-4 text-start text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.rank')}</th>
                  <th className="px-6 py-4 text-start text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.staff')}</th>
                  <th className="px-6 py-4 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.sales')}</th>
                  <th className="px-6 py-4 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.share')}</th>
                  <th className="px-6 py-4 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.avgOrder')}</th>
                  <th className="px-6 py-4 text-end text-xs font-black text-gray-400 tracking-widest">{t('orders.reports.staff.salesPerHour')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.03]">
                {sortedEmployees
                  .slice((staffPage - 1) * itemsPerPage, staffPage * itemsPerPage)
                  .map((emp: any, idx: number) => {
                    const shareRatio = totalStoreSales > 0 ? (emp.totalSales / totalStoreSales) : 0;
                    const sharePercent = shareRatio * 100;
                    const avgTicket = emp.totalSales / (emp.transactionCount || 1);
                    const efficiency = emp.totalSales / (emp.totalHours || 1);

                    return (
                      <tr key={emp.username} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-start">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${idx === 0 ? 'bg-[#7CC39F]/20 text-[#7CC39F]' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                            {((staffPage - 1) * itemsPerPage + idx + 1).toLocaleString(t('common.locale'))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-900 dark:text-white text-sm" title={emp.username}>{emp.username}</span>
                        </td>
                        <td className="px-6 py-4 text-end font-black text-gray-900 dark:text-white">
                          {formatCurrency(emp.totalSales)}
                        </td>
                        <td className="px-6 py-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-paymint-green rounded-full" style={{ width: `${sharePercent}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-500">
                              {shareRatio.toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-end font-bold text-gray-900 dark:text-white">
                          {avgTicket.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-end">
                          <span className="text-xs font-bold text-gray-500">
                            {efficiency.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / {t('orders.reports.staff.perHour')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={staffPage}
            totalPages={Math.ceil(sortedEmployees.length / itemsPerPage)}
            onPageChange={(p) => setStaffPage(p)}
          />
        </div>
      </div>
    </div>
  );
});


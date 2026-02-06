import { Wallet, CreditCard, PieChart as PieChartIcon, ChevronRight, Activity } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { SalesSummary } from '../../../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useTheme } from '../../../../context/ThemeContext';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface PaymentsViewProps {
  salesData: SalesSummary;
  effectiveDateRange: { start: string; end: string };
  selectedDateRange: string;
}

export const PaymentsView = React.memo(function PaymentsView({ salesData, effectiveDateRange, selectedDateRange }: PaymentsViewProps) {
  const { formatAmount } = useCurrency();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();
  const { locationSlug } = useParams();
  const [expandedPaymentMethod, setExpandedPaymentMethod] = useState<string | null>(null);

  const formatCurrency = (value: number) => formatAmount(value);

  return (
    <div className="space-y-6">
      {/* Summary Cards for Payments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">Total Collected</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(salesData.totalRevenue || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Across all payment channels</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-paymint-green/10 rounded-full blur-3xl -mr-10 -mt-10" />
        </div>

        <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">Top Method</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {[...(salesData.paymentMethodBreakdown || [])].sort((a: any, b: any) => b.value - a.value)[0]?.name || '—'}
            </p>
            <p className="text-xs text-gray-500 mt-2">Highest volume channel</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        </div>

        <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">Transaction Count</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {salesData.totalOrders || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Total processed payments</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed Distribution Chart */}
        <div className="p-6 bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-paymint-green" />
            Distribution
          </h3>
          <div className="h-[300px] w-full relative">
            {salesData.paymentMethodBreakdown && salesData.paymentMethodBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesData.paymentMethodBreakdown}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={1000}
                    stroke="none"
                  >
                    {salesData.paymentMethodBreakdown.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0B1120' : '#fff',
                      borderRadius: '16px',
                      border: 'none',
                      padding: '12px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                    }}
                    itemStyle={{
                      color: isDark ? '#fff' : '#111',
                      fontWeight: '800',
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}
                    formatter={(val: any) => formatCurrency(val)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-2">
                <CreditCard size={32} className="opacity-20" />
                <span className="text-xs font-bold tracking-widest">No data available</span>
              </div>
            )}
            {/* Center Stats */}
            {salesData.paymentMethodBreakdown && salesData.paymentMethodBreakdown.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {salesData.paymentMethodBreakdown.length}
                </span>
                <span className="text-xs font-bold text-gray-500 tracking-widest">Methods</span>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity size={20} className="text-blue-500" />
                Details
              </h3>
              <p className="text-xs text-gray-500 mt-1">Click on CARD or OTHER to see breakdown</p>
            </div>
            <button
              onClick={() => navigate(`/dashboard/${locationSlug}/orders`, {
                state: {
                  startDate: effectiveDateRange.start,
                  endDate: effectiveDateRange.end,
                  selectedDateRange: selectedDateRange
                }
              })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-xs font-black tracking-widest border border-gray-200 dark:border-white/10"
            >
              <span>View All Orders</span>
              <ChevronRight size={14} className="text-paymint-green" />
            </button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full relative">
              <thead className="bg-gray-50 dark:bg-white/[0.02] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest bg-gray-50 dark:bg-[#0B1120] border-b border-gray-100 dark:border-white/5">Method</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest bg-gray-50 dark:bg-[#0B1120] border-b border-gray-100 dark:border-white/5">Revenue</th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest bg-gray-50 dark:bg-[#0B1120] border-b border-gray-100 dark:border-white/5">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {salesData.paymentMethodBreakdown?.map((item: any, i: number) => {
                  const total = salesData.totalRevenue || 1;
                  const percentage = ((item.value / total) * 100).toFixed(1);
                  
                  // Check if this method has breakdown details
                  const isCard = item.name === 'CARD';
                  const isOther = item.name === 'OTHER';
                  
                  const hasDetails = (isCard && (salesData.cardTypeBreakdown?.length || 0) > 0) ||
                                   (isOther && (salesData.otherPaymentBreakdown?.length || 0) > 0);
                                   
                  const isExpanded = expandedPaymentMethod === item.name;

                  return (
                    <React.Fragment key={i}>
                      <tr
                        className={`group transition-colors ${hasDetails ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]' : ''} ${isExpanded ? 'bg-gray-50 dark:bg-white/[0.02]' : ''}`}
                        onClick={() => {
                          if (hasDetails) {
                            setExpandedPaymentMethod(isExpanded ? null : item.name);
                          }
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 text-gray-500" style={{ color: COLORS[i % COLORS.length], backgroundColor: `${COLORS[i % COLORS.length]}20` }}>
                              {isCard ? <CreditCard size={16} /> : <Wallet size={16} />}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-gray-900 dark:text-white">{item.name}</span>
                              {hasDetails && (
                                <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white">
                          {formatCurrency(item.value)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                            </div>
                            <span className="text-xs font-bold text-gray-500">{percentage}%</span>
                          </div>
                        </td>
                      </tr>
                      
                      {/* Card Breakdown */}
                      {isExpanded && isCard && salesData.cardTypeBreakdown?.map((card: any, ci: number) => (
                        <tr key={`card-${ci}`} className="bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-6 py-3 pl-16">
                            <span className="text-xs font-bold text-gray-500">{card.name}</span>
                          </td>
                          <td className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300">
                            {formatCurrency(card.value)}
                          </td>
                          <td className="px-6 py-3 text-right text-xs font-medium text-gray-400">
                            {((card.value / item.value) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                      
                      {/* Other Payment Breakdown */}
                      {isExpanded && isOther && salesData.otherPaymentBreakdown?.map((op: any, oi: number) => (
                        <tr key={`other-${oi}`} className="bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-6 py-3 pl-16">
                            <span className="text-xs font-bold text-gray-500">{op.name}</span>
                          </td>
                          <td className="px-6 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300">
                            {formatCurrency(op.value)}
                          </td>
                          <td className="px-6 py-3 text-right text-xs font-medium text-gray-400">
                            {((op.value / item.value) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
});
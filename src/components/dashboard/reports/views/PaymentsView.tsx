import { Wallet, CreditCard, PieChart as PieChartIcon, ChevronRight, Activity } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { SalesSummary } from '../../../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useTheme } from '../../../../context/ThemeContext';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const COLORS = ['#7CC39F', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CurrencyAmount = ({ amount, className = "", size = "text-2xl", color = "text-gray-900 dark:text-white" }: { amount: number, className?: string, size?: string, color?: string }) => {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  return (
    <span className={`inline-flex items-baseline gap-1 ${className}`}>
      <span className={`${size} font-bold ${color} tracking-tight`}>
        {amount.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currencySymbol}</span>
    </span>
  );
};

const FormatCurrency = ({ value }: { value: number }) => {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-bold tracking-tight">
        {value.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currencySymbol}</span>
    </span>
  );
};

interface PaymentsViewProps {
  salesData: SalesSummary;
  effectiveDateRange: { start: string; end: string };
  selectedDateRange: string;
}

export const PaymentsView = React.memo(function PaymentsView({ salesData, effectiveDateRange, selectedDateRange }: PaymentsViewProps) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const navigate = useNavigate();
  const { locationSlug } = useParams();
  const [expandedPaymentMethod, setExpandedPaymentMethod] = useState<string | null>(null);

  const getMethodName = (name: any) => {
    if (!name) return '—';
    const nameStr = String(name);
    if (nameStr === 'CARD') return t('orders.payment.allCards');
    if (nameStr === 'CASH') return t('orders.payment.cash');
    if (nameStr === 'OTHER') return t('orders.payment.allOther');
    return nameStr;
  };

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Summary Cards for Payments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.payments.totalCollected')}</p>
            <CurrencyAmount amount={salesData.totalRevenue || 0} />
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.payments.totalCollectedDesc')}</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-paymint-green/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.payments.topMethod')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight text-ellipsis overflow-hidden whitespace-nowrap">
              {getMethodName([...(salesData.paymentMethodBreakdown || [])].sort((a: any, b: any) => b.value - a.value)[0]?.name)}
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.payments.topMethodDesc')}</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-paymint-green/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.payments.txnCount')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {(salesData.totalOrders || 0).toLocaleString(t('common.locale'))}
              <span className="text-sm mx-1 text-gray-400 font-black"> {t('dashboard.stats.orders')}</span>
            </p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{t('orders.reports.payments.txnCountDesc')}</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detailed Distribution Chart */}
        <div className="p-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
              <PieChartIcon size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('orders.reports.payments.distribution')}
            </h3>
          </div>
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
                    nameKey="name"
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
                      fontSize: '12px'
                    }}
                    formatter={(val: any) => (
                      <span className="inline-flex items-baseline gap-1">
                        <span className="font-bold tracking-tight">
                          {Number(val).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">{currencySymbol}</span>
                      </span>
                    )}
                    labelFormatter={(name: any) => getMethodName(name)}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-2">
                <CreditCard size={32} className="opacity-20" />
                <span className="text-xs font-bold tracking-widest">{t('orders.reports.payments.noData')}</span>
              </div>
            )}
            {/* Center Stats */}
            {salesData.paymentMethodBreakdown && salesData.paymentMethodBreakdown.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" dir="ltr">
                <span className="text-3xl font-black text-gray-900 dark:text-white">
                  {salesData.paymentMethodBreakdown.length.toLocaleString(t('common.locale'))}
                </span>
                <span className="text-xs font-bold text-gray-500 tracking-widest">{t('orders.reports.payments.methods')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] shadow-sm overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                <Activity size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('orders.reports.payments.details')}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{t('orders.reports.payments.detailsDesc')}</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/dashboard/${locationSlug}/orders`, {
                state: {
                  startDate: effectiveDateRange.start,
                  endDate: effectiveDateRange.end,
                  selectedDateRange: selectedDateRange
                }
              })}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all label-strong font-outfit border border-gray-200 dark:border-white/10"
            >
              <span>{t('orders.reports.payments.viewAllOrders')}</span>
              <ChevronRight size={14} className={`text-paymint-green transition-transform ${t('common.locale') === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full relative">
              <thead className="bg-gray-50 dark:bg-white/[0.02] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-start label-strong font-outfit bg-gray-50 dark:bg-[#1E293B] border-b border-gray-100 dark:border-white/5">{t('orders.reports.payments.method')}</th>
                  <th className="px-6 py-4 text-end label-strong font-outfit bg-gray-50 dark:bg-[#1E293B] border-b border-gray-100 dark:border-white/5">{t('orders.reports.payments.revenue')}</th>
                  <th className="px-6 py-4 text-end label-strong font-outfit bg-gray-50 dark:bg-[#1E293B] border-b border-gray-100 dark:border-white/5">{t('orders.reports.payments.share')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {salesData.paymentMethodBreakdown?.map((item: any, i: number) => {
                  const total = salesData.totalRevenue || 1;
                  const percentage = (item.value / total);

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
                              <span className="font-bold text-sm text-gray-900 dark:text-white">{getMethodName(item.name)}</span>
                              {hasDetails && (
                                <ChevronRight size={16} className={`text-gray-400 transition-transform ${isExpanded ? (t('common.locale') === 'ar' ? '-rotate-90' : 'rotate-90') : (t('common.locale') === 'ar' ? 'rotate-180' : '')}`} />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-end font-black text-gray-900 dark:text-white">
                          <FormatCurrency value={item.value} />
                        </td>
                        <td className="px-6 py-4 text-end">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${(percentage * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                            </div>
                            <span className="text-xs font-bold text-gray-500">{percentage.toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Card Breakdown */}
                      {isExpanded && isCard && salesData.cardTypeBreakdown?.map((card: any, ci: number) => (
                        <tr key={`card-${ci}`} className="bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-6 py-3 ps-16">
                            <span className="text-xs font-bold text-gray-500">{card.name}</span>
                          </td>
                          <td className="px-6 py-3 text-end text-xs font-bold text-gray-700 dark:text-gray-300">
                            <FormatCurrency value={card.value} />
                          </td>
                          <td className="px-6 py-3 text-end text-xs font-medium text-gray-400">
                            {(card.value / item.value).toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </td>
                        </tr>
                      ))}

                      {/* Other Payment Breakdown */}
                      {isExpanded && isOther && salesData.otherPaymentBreakdown?.map((op: any, oi: number) => (
                        <tr key={`other-${oi}`} className="bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-6 py-3 ps-16">
                            <span className="text-xs font-bold text-gray-500">{op.name}</span>
                          </td>
                          <td className="px-6 py-3 text-end text-xs font-bold text-gray-700 dark:text-gray-300">
                            <FormatCurrency value={op.value} />
                          </td>
                          <td className="px-6 py-3 text-end text-xs font-medium text-gray-400">
                            {(op.value / item.value).toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}
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



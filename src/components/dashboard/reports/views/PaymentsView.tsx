import { ChevronRight, CreditCard } from 'lucide-react';
import { BiIcon } from '../../../ui/BiIcon';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { SalesSummary } from '../../../../types';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Label } from 'recharts';
import { useTheme } from '../../../../context/ThemeContext';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';
import { StatValue } from '../../../../components/ui/StatValue';
import { formatPaymentBrandName } from '../../../../utils/paymentCard';

const COLORS = ['#7dc6a2', '#3b82f6', '#f59e0b', '#D55263', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const CurrencyAmount = ({ amount, className = "", size = "text-2xl", color = "text-stone-900 dark:text-zinc-100" }: { amount: number, className?: string, size?: string, color?: string }) => {
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
      containerClassName="justify-end w-full"
    />
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
  const paymentMethodBreakdown = (salesData.paymentMethodBreakdown || [])
    .map((item: any) => ({
      ...item,
      value: Number(item.value) || 0
    }));
  const paymentTotal = paymentMethodBreakdown.reduce((sum: number, item: any) => sum + item.value, 0);
  const hasPaymentData = paymentTotal > 0.005;
  // Zero-value pie slices don't render — show a solid gray ring when empty.
  const emptyPieFill = isDark ? '#334155' : '#e5e7eb';
  const pieChartData = hasPaymentData
    ? paymentMethodBreakdown.map((item: any) => ({
        ...item,
        value: Math.max(Number(item.value) || 0, 0),
      }))
    : [{ name: '__empty__', value: 1 }];

  const getMethodName = (name: any) => {
    if (!name || name === '__empty__') return '—';
    const nameStr = String(name).toUpperCase();
    if (nameStr === 'CARD') return t('orders.payment.allCards');
    if (nameStr === 'CASH') return t('orders.payment.cash');
    if (nameStr === 'OTHER') return t('orders.payment.allOther');
    return formatPaymentBrandName(String(name));
  };

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Summary Cards for Payments */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.payments.totalCollected')}</p>
            <CurrencyAmount amount={salesData.totalRevenue || 0} />
            <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">{t('orders.reports.payments.totalCollectedDesc')}</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-mintcom-green/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.payments.topMethod')}</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight text-ellipsis overflow-hidden whitespace-nowrap">
              {getMethodName([...paymentMethodBreakdown].sort((a: any, b: any) => b.value - a.value)[0]?.name)}
            </p>
            <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">{t('orders.reports.payments.topMethodDesc')}</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-mintcom-green/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        </div>

        <div className="p-4 sm:p-5 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 relative overflow-hidden flex flex-col transition-all duration-300">
          <div className="relative z-10">
            <p className="dashboard-stat-title mb-1">{t('orders.reports.payments.txnCount')}</p>
            <div className="flex items-baseline gap-1">
              <StatValue 
                value={salesData.totalOrders || 0} 
                className="text-2xl"
                isInteger={true}
              />
              <span className="text-sm text-stone-400 font-black"> {t('dashboard.stats.orders')}</span>
            </div>
            <p className="text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">{t('orders.reports.payments.txnCountDesc')}</p>
          </div>
          <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        </div>
      </div>

      {/* Distribution + Details — one combined card */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0">
              <BiIcon icon="bi-cash-stack" size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">
                {t('orders.reports.payments.distribution')}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">{t('orders.reports.payments.detailsDesc')}</p>
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
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-50 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-all label-strong font-sans border border-stone-200 dark:border-zinc-800 shrink-0"
          >
            <span>{t('orders.reports.payments.viewAllOrders')}</span>
            <ChevronRight size={14} className={`text-mintcom-green transition-transform ${t('common.locale') === 'ar' ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 lg:items-stretch">
          {/* Compact pie chart */}
          <div className="lg:col-span-2 p-5 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-e border-stone-100 dark:border-zinc-800">
            <div className="h-[200px] w-full max-w-[240px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <Pie
                    data={pieChartData}
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={hasPaymentData ? 3 : 0}
                    dataKey="value"
                    animationDuration={hasPaymentData ? 1000 : 0}
                    stroke="none"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    isAnimationActive={hasPaymentData}
                  >
                    {pieChartData.map((_: any, index: number) => (
                      <Cell
                        key={index}
                        fill={hasPaymentData ? COLORS[index % COLORS.length] : emptyPieFill}
                      />
                    ))}
                    <Label
                      content={({ viewBox }: any) => {
                        const { cx, cy } = viewBox;
                        const centerCount = hasPaymentData
                          ? paymentMethodBreakdown.filter((r: any) => Number(r.value) > 0).length || paymentMethodBreakdown.length
                          : 0;
                        return (
                          <g>
                            <text
                              x={cx}
                              y={cy - 6}
                              fill={isDark ? '#ffffff' : '#111827'}
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{ fontSize: 22, fontWeight: 800 }}
                            >
                              {centerCount}
                            </text>
                            <text
                              x={cx}
                              y={cy + 14}
                              fill="#6b7280"
                              textAnchor="middle"
                              dominantBaseline="central"
                              style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}
                            >
                              {t('orders.reports.payments.methods').toUpperCase()}
                            </text>
                          </g>
                        );
                      }}
                    />
                  </Pie>
                  {hasPaymentData && (
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
                        <StatValue
                          value={Number(val)}
                          currency={currencySymbol}
                          className="text-sm font-bold"
                        />
                      )}
                      labelFormatter={(name: any) => getMethodName(name)}
                    />
                  )}
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown table */}
          <div className="lg:col-span-3 flex flex-col min-h-0 max-h-[360px]">
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full relative">
                <thead className="bg-stone-50 dark:bg-zinc-800/40 sticky top-0 z-10">
                  <tr>
                    <th className="px-5 py-3.5 text-start label-strong font-sans whitespace-nowrap bg-stone-50 dark:bg-zinc-900/60 border-b border-stone-100 dark:border-zinc-800">
                      {t('orders.reports.payments.method')}
                    </th>
                    <th className="px-5 py-3.5 text-end label-strong font-sans whitespace-nowrap bg-stone-50 dark:bg-zinc-900/60 border-b border-stone-100 dark:border-zinc-800">
                      {t('orders.reports.payments.revenue')}
                    </th>
                    <th className="px-5 py-3.5 text-end label-strong font-sans whitespace-nowrap bg-stone-50 dark:bg-zinc-900/60 border-b border-stone-100 dark:border-zinc-800">
                      {t('orders.reports.payments.share')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {paymentMethodBreakdown.length > 0 ? (
                    paymentMethodBreakdown.map((item: any, i: number) => {
                      const total = paymentTotal || 1;
                      const percentage = (item.value / total);

                      const isCard = item.name === 'CARD';
                      const isOther = item.name === 'OTHER';
                      const hasDetails = (isCard && (salesData.cardTypeBreakdown?.length || 0) > 0) ||
                                       (isOther && (salesData.otherPaymentBreakdown?.length || 0) > 0);
                      const isExpanded = expandedPaymentMethod === item.name;

                      return (
                        <React.Fragment key={i}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`group transition-colors ${hasDetails ? 'cursor-pointer hover:bg-stone-50 dark:hover:bg-zinc-800/40' : ''} ${isExpanded ? 'bg-stone-50 dark:bg-zinc-800/40' : ''}`}
                            onClick={() => {
                              if (hasDetails) {
                                setExpandedPaymentMethod(isExpanded ? null : item.name);
                              }
                            }}
                          >
                            <td className="px-5 py-3.5 text-start">
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-stone-900 dark:text-zinc-100">{getMethodName(item.name)}</span>
                                  {hasDetails && (
                                    <ChevronRight size={16} className={`text-stone-400 transition-transform ${isExpanded ? (t('common.locale') === 'ar' ? '-rotate-90' : 'rotate-90') : (t('common.locale') === 'ar' ? 'rotate-180' : '')}`} />
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-end font-black text-stone-900 dark:text-zinc-100">
                              <FormatCurrency value={item.value} />
                            </td>
                            <td className="px-5 py-3.5 text-end">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-1.5 bg-stone-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${(percentage * 100)}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                                </div>
                                <StatValue value={percentage} isPercentage={true} className="text-xs font-bold text-stone-500" />
                              </div>
                            </td>
                          </motion.tr>

                          {isExpanded && isCard && salesData.cardTypeBreakdown?.map((card: any, ci: number) => (
                            <tr key={`card-${ci}`} className="bg-stone-50/50 dark:bg-zinc-800/40">
                              <td className="px-5 py-2.5 ps-16">
                                <span className="text-xs font-bold text-stone-500">{formatPaymentBrandName(card.name)}</span>
                              </td>
                              <td className="px-5 py-2.5 text-end text-xs font-bold text-stone-700 dark:text-zinc-300">
                                <FormatCurrency value={card.value} />
                              </td>
                              <td className="px-5 py-2.5 text-end text-xs font-medium text-stone-400">
                                <StatValue value={card.value / item.value} isPercentage={true} className="text-xs font-medium text-stone-400" />
                              </td>
                            </tr>
                          ))}

                          {isExpanded && isOther && salesData.otherPaymentBreakdown?.map((op: any, oi: number) => (
                            <tr key={`other-${oi}`} className="bg-stone-50/50 dark:bg-zinc-800/40">
                              <td className="px-5 py-2.5 ps-16">
                                <span className="text-xs font-bold text-stone-500">{formatPaymentBrandName(op.name)}</span>
                              </td>
                              <td className="px-5 py-2.5 text-end text-xs font-bold text-stone-700 dark:text-zinc-300">
                                <FormatCurrency value={op.value} />
                              </td>
                              <td className="px-5 py-2.5 text-end text-xs font-medium text-stone-400">
                                <StatValue value={op.value / item.value} isPercentage={true} className="text-xs font-medium text-stone-400" />
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-14">
                        <AnalyticsEmptyState
                          icon={CreditCard}
                          title={t('orders.reports.payments.noData')}
                          description={t('orders.reports.payments.detailsDesc')}
                          compact
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

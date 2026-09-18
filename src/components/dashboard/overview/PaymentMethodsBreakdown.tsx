import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { StatValue } from '../../ui/StatValue';
import { useCurrency } from '../../../context/CurrencyContext';
import { formatPaymentBrandName } from '../../../utils/paymentCard';

interface PaymentMethodsBreakdownProps {
  paymentMethodBreakdown: { name: string; value: number }[];
  cardTypeBreakdown?: { name: string; value: number }[];
  otherPaymentBreakdown?: { name: string; value: number }[];
  viewMode: 'current_shift' | 'previous_shift' | 'last_24_hours';
}

const COLORS = [
  '#7dc6a2', // Mint green (Cash / primary)
  '#3b82f6', // Blue (Visa / Cards)
  '#f59e0b', // Amber / Orange (Mastercard / Others)
  '#D55263', // Coral / Red (AMEX)
  '#8b5cf6', // Purple (CliQ / Wallets)
  '#ec4899', // Pink (Apple Pay)
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#f97316', // Bright Orange
  '#84cc16', // Lime
  '#a855f7', // Violet
];

export const PaymentMethodsBreakdown = React.memo(function PaymentMethodsBreakdown({
  paymentMethodBreakdown = [],
}: PaymentMethodsBreakdownProps) {
  const { t } = useTranslation();
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { currencySymbol } = useCurrency();
  const isDark = resolvedTheme === 'dark';

  const rows = useMemo(() => paymentMethodBreakdown || [], [paymentMethodBreakdown]);

  const currentTotal = useMemo(
    () => rows.reduce((sum, item) => sum + Math.max(Number(item.value) || 0, 0), 0),
    [rows]
  );

  const hasData = currentTotal > 0.005;
  const emptyFill = isDark ? '#334155' : '#e5e7eb';

  const pieData = useMemo(() => {
    if (hasData) {
      return rows.map((item) => ({
        name: item.name,
        value: Math.max(Number(item.value) || 0, 0),
      }));
    }
    return [{ name: '__empty__', value: 1 }];
  }, [rows, hasData]);

  const getMethodName = (name: string) => {
    if (!name || name === '__empty__') return '—';
    const nameStr = String(name).toUpperCase();
    if (nameStr === 'CARD') return t('orders.payment.allCards');
    if (nameStr === 'CASH') return t('orders.payment.cash');
    if (nameStr === 'OTHER') return t('orders.payment.allOther');
    return formatPaymentBrandName(name);
  };

  return (
    <div id="tour-capital-sources" className="group relative p-4 sm:p-6 bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm flex flex-col transition-all duration-300 overflow-hidden">
      <div className="absolute top-0 end-0 w-40 h-40 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green transition-transform duration-300 shrink-0">
              <Wallet size={20} />
            </div>
            <div className="pt-0.5">
              <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100">{t('dashboard.paymentMethods.title')}</h3>
              <p className="card-subtitle">{t('dashboard.paymentMethods.distributionOverview', { defaultValue: 'Shift Distribution Overview' })}</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/dashboard/${locationSlug}/reports/payments`)}
            className="text-xs font-bold text-mintcom-green hover:underline tracking-wide mt-1.5 shrink-0"
          >
            {t('common.viewAll')}
          </button>
        </div>

        {/* Donut Chart & Legend */}
        <div className="flex-1 flex flex-col justify-center min-h-0">
          <div className="h-[155px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pieData}
                  innerRadius={46}
                  outerRadius={70}
                  paddingAngle={hasData && pieData.length > 1 ? 4 : 0}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={hasData}
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={hasData ? COLORS[index % COLORS.length] : emptyFill}
                    />
                  ))}
                </Pie>
                {hasData && (
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0B1120' : '#fff',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                      fontSize: '12px',
                    }}
                    itemStyle={{ color: isDark ? '#fff' : '#111', fontWeight: 'bold' }}
                    formatter={(val: any, _name: any, entry: any) => [
                      <StatValue
                        key="val"
                        value={Number(val)}
                        currency={currencySymbol}
                        className="text-xs font-bold"
                      />,
                      getMethodName(String(entry?.payload?.name ?? '')),
                    ]}
                  />
                )}
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          {/* Scrollable Legend List */}
          <div className="max-h-[175px] overflow-y-auto custom-scrollbar space-y-1 mt-3 pr-1">
            {rows.length > 0 ? (
              rows.map((item, i) => {
                const percentage = currentTotal > 0 ? (Math.max(Number(item.value) || 0, 0) / currentTotal) : 0;

                return (
                  <div
                    key={`${item.name}-${i}`}
                    className="flex items-center justify-between gap-2.5 p-2 rounded-xl transition-all hover:bg-stone-50 dark:hover:bg-zinc-800"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: hasData ? COLORS[i % COLORS.length] : emptyFill }}
                      />
                      <span className="text-xs font-bold text-stone-700 dark:text-zinc-200 truncate">
                        {getMethodName(item.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatValue value={Number(item.value) || 0} currency={currencySymbol} className="text-xs font-bold text-stone-900 dark:text-zinc-100" />
                      <StatValue value={percentage} isPercentage={true} className="text-xs font-bold text-stone-500 dark:text-zinc-400 min-w-[36px] text-end" />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-xs text-stone-400 font-medium">
                {t('common.noData', { defaultValue: 'No payment data available' })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});


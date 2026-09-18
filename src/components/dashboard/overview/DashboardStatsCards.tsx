import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { biIcon } from '../../ui/BiIcon';
import { useCurrency } from '../../../context/CurrencyContext';
import { StatValue } from '../../ui/StatValue';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  activeEmployees: number;
  taxCollected: number;
  netServiceChargeCollected?: number;
  serviceChargeCollected?: number;
  netOtherChargesCollected?: number;
  otherChargesCollected?: number;
  netSales?: number;
  baseSales?: number;
  netSalesBeforeTaxAndServiceCharge?: number;
  totalRefunds: number;
  grossProfit: number;
  totalPayIn: number;
  totalPayOut: number;
}

interface PreviousShiftSnapshot {
  drawerAmount: number;
  closingBalance: number;
  discrepancy: number;
}

interface DashboardStatsCardsProps {
  stats: DashboardStats | null;
  viewMode: 'current_shift' | 'previous_shift' | 'last_24_hours';
  previousShiftSnapshot: PreviousShiftSnapshot | null;
  setShowPayInOutModal: (show: boolean) => void;
}

export const DashboardStatsCards = React.memo(function DashboardStatsCards({ stats, viewMode, previousShiftSnapshot, setShowPayInOutModal }: DashboardStatsCardsProps) {
  const { t } = useTranslation();
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const { currencySymbol } = useCurrency();
  const grossSales = stats?.totalRevenue ?? 0;
  const taxCollected = stats?.taxCollected ?? 0;
  const serviceChargeCollected = (stats as any)?.netOtherChargesCollected ?? stats?.netServiceChargeCollected ?? (stats as any)?.otherChargesCollected ?? stats?.serviceChargeCollected ?? 0;
  const netSales = Math.max(
    (stats as any)?.netSales ?? (grossSales - taxCollected),
    0
  );
  const baseSales = Math.max(
    (stats as any)?.baseSales ?? stats?.netSalesBeforeTaxAndServiceCharge ?? (netSales - serviceChargeCollected),
    0
  );

  const statCards: any[] = [
    {
      label: t('dashboard.stats.totalSales'),
      value: grossSales,
      sub: t('dashboard.stats.includingTaxServiceCharge'),
      icon: biIcon('bi-wallet2'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: true
    },
    {
      label: t('dashboard.stats.netSales'),
      value: netSales,
      sub: t('dashboard.stats.excludingTax'),
      icon: biIcon('bi-cash-coin'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: true
    },
    {
      label: t('dashboard.stats.baseSales', { defaultValue: 'Base Sales' }),
      value: baseSales,
      sub: t('dashboard.stats.excludingTaxServiceCharge'),
      icon: biIcon('bi-basket'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: true
    },
    {
      label: t('dashboard.stats.otherCharges', { defaultValue: 'Other Charges' }),
      value: serviceChargeCollected,
      sub: t('dashboard.stats.partOfTotalSales', { defaultValue: 'Extra fees added to orders' }),
      icon: biIcon('bi-plus-circle'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: true
    },
    {
      label: t('dashboard.stats.profit'),
      value: stats?.grossProfit ?? 0,
      sub: t('dashboard.stats.netSalesCosts'),
      icon: biIcon('bi-graph-up-arrow'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: true
    },
    {
      label: t('dashboard.stats.tax'),
      value: stats?.taxCollected ?? 0,
      sub: t('dashboard.stats.totalTax'),
      icon: biIcon('bi-receipt'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: true
    },
    {
      label: t('dashboard.stats.totalOrders'),
      value: stats?.totalOrders ?? 0,
      sub: viewMode === 'current_shift' ? t('dashboard.stats.thisShift') : viewMode === 'previous_shift' ? t('dashboard.stats.previousShift') : t('dashboard.stats.last24h'),
      icon: biIcon('bi-receipt-cutoff'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: false,
      onClick: () => {
        const state: any = { statusFilter: 'all' };
        if (viewMode === 'current_shift') state.selectedDateRange = 'current_shift';
        if (viewMode === 'previous_shift') state.selectedDateRange = 'previous_shift';
        navigate(`/dashboard/${locationSlug}/orders`, { state });
      }
    },
    {
      label: t('dashboard.stats.onHold'),
      value: stats?.pendingOrders ?? 0,
      // Open held tickets (HeldOrder), not last-24h sales — matches Orders page.
      sub: t('dashboard.stats.pendingOrders'),
      icon: biIcon('bi-pause-circle'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: false,
      onClick: () => {
        const state: any = { statusFilter: 'HELD' };
        navigate(`/dashboard/${locationSlug}/orders`, { state });
      }
    }
  ];

  statCards.push(
    {
      label: t('dashboard.stats.avgOrder'),
      value: stats?.averageOrderValue ?? 0,
      sub: t('dashboard.stats.averageValue'),
      icon: biIcon('bi-calculator'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      isCurrency: true
    },
    {
      label: t('dashboard.stats.refunds'),
      value: stats?.totalRefunds ?? 0,
      sub: viewMode === 'current_shift' ? t('dashboard.stats.thisShift') : viewMode === 'previous_shift' ? t('dashboard.stats.previousShift') : t('dashboard.stats.last24h'),
      icon: biIcon('bi-arrow-counterclockwise'),
      // Refunds read red everywhere, matching the sales report.
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      isCurrency: true
    },
    {
      label: t('dashboard.stats.nonSales'),
      value: null, // Custom content
      sub: null,
      icon: biIcon('bi-arrow-left-right'),
      color: 'text-mintcom-green',
      bg: 'bg-mintcom-green/10',
      customContent: (
        <div className="space-y-3 mt-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">{t('dashboard.stats.payIn')}</span>
            <StatValue value={stats?.totalPayIn ?? 0} currency={currencySymbol} prefix="+" className="text-sm text-mintcom-green" />
          </div>
          <div className="w-full h-px bg-stone-100 dark:bg-zinc-800" />
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">{t('dashboard.stats.payOut')}</span>
            <StatValue value={stats?.totalPayOut ?? 0} currency={currencySymbol} prefix="-" className="text-sm text-red-500" />
          </div>
        </div>
      ),
      onClick: () => setShowPayInOutModal(true)
    }
  );

  if (viewMode === 'previous_shift' && previousShiftSnapshot) {
    statCards.push({
      label: t('dashboard.stats.variance'),
      value: null as any,
      sub: null as any,
      icon: biIcon('bi-plus-slash-minus'),
      color: previousShiftSnapshot.discrepancy > 0.01 ? 'text-amber-500' : previousShiftSnapshot.discrepancy < -0.01 ? 'text-red-500' : 'text-mintcom-green',
      bg: previousShiftSnapshot.discrepancy > 0.01 ? 'bg-amber-500/10' : previousShiftSnapshot.discrepancy < -0.01 ? 'bg-red-500/10' : 'bg-mintcom-green/10',
      customContent: (
        <div className="space-y-3 mt-6">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">{t('dashboard.stats.expected')}</span>
            <StatValue value={previousShiftSnapshot.drawerAmount || 0} currency={currencySymbol} className="text-sm text-stone-700 dark:text-zinc-300" />
          </div>
          <div className="w-full h-px bg-stone-100 dark:bg-zinc-800" />
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">{t('dashboard.stats.actual')}</span>
            <StatValue value={previousShiftSnapshot.closingBalance || 0} currency={currencySymbol} className="text-sm text-mintcom-green" />
          </div>
          <div className="w-full h-px bg-stone-100 dark:bg-zinc-800" />
          <div className="flex min-w-0 items-center justify-between gap-3">
            <span className="text-xs font-bold text-stone-500 dark:text-zinc-400">{t('dashboard.stats.variance')}</span>
            {previousShiftSnapshot.discrepancy > 0.01 ? (
              <StatValue value={previousShiftSnapshot.discrepancy} currency={currencySymbol} prefix="+" suffix={t('dashboard.stats.over')} className="text-sm text-amber-500" />
            ) : previousShiftSnapshot.discrepancy < -0.01 ? (
              <StatValue value={Math.abs(previousShiftSnapshot.discrepancy)} currency={currencySymbol} prefix="-" suffix={t('dashboard.stats.short')} className="text-sm text-red-500" />
            ) : (
              <StatValue value={0} currency={currencySymbol} prefix={`${t('dashboard.stats.perfect')} `} className="text-sm text-stone-500" />
            )}
          </div>
        </div>
      ),
      onClick: () => navigate(`/dashboard/${locationSlug}/reports/cash-discrepancy`)
    } as any);
  }

  return (
    <div id="tour-kpi-cards" className="space-y-3">
      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="flex overflow-x-auto scrollbar-none gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 sm:overflow-visible">
        {statCards.map((stat: any, index) => (
          <motion.div
            key={`${stat.label}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={stat.onClick}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 transition-all duration-300 overflow-hidden min-w-[160px] sm:min-w-0 flex-shrink-0 sm:flex-shrink ${stat.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className={`absolute top-0 end-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                  <stat.icon size={20} />
                </div>
                {stat.onClick && (
                  <div className="w-8 h-8 rounded-lg bg-stone-50 dark:bg-zinc-800 flex items-center justify-center text-stone-400 group-hover:text-mintcom-green transition-colors">
                    <ExternalLink size={14} />
                  </div>
                )}
              </div>

              <p className="dashboard-stat-title mb-1 flex items-center gap-1">
                {stat.label}
              </p>

              {stat.customContent ? (
                stat.customContent
              ) : (
                <>
                  <StatValue 
                    value={stat.value} 
                    currency={stat.isCurrency ? currencySymbol : null}
                    className="text-2xl"
                    isInteger={!stat.isCurrency}
                  />
                  <p className="sentence-case-text text-xs font-medium text-stone-500 dark:text-zinc-400 mt-1">
                    {stat.sub}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

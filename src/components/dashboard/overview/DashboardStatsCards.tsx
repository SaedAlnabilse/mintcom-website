import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  ShoppingBag,
  ArrowDownRight,
  ArrowUpRight,
  Scale,
  ExternalLink
} from 'lucide-react';
import { useCurrency } from '../../../context/CurrencyContext';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  activeEmployees: number;
  taxCollected: number;
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

  const statCards: any[] = [
    {
      label: t('dashboard.stats.totalSales'),
      value: ((stats?.totalRevenue || 0) + (stats?.taxCollected || 0)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sub: t('dashboard.stats.includingTax'),
      icon: Wallet,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10'
    },
    {
      label: t('dashboard.stats.netSales'),
      value: (stats?.totalRevenue || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sub: t('dashboard.stats.excludingTax'),
      icon: DollarSign,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10'
    },
    {
      label: t('dashboard.stats.profit'),
      value: (stats?.grossProfit || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sub: t('dashboard.stats.netSalesCosts'),
      icon: TrendingUp,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10'
    },
    {
      label: t('dashboard.stats.tax'),
      value: (stats?.taxCollected || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sub: t('dashboard.stats.totalTax'),
      icon: Percent,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10'
    },
    {
      label: t('dashboard.stats.totalOrders'),
      value: (stats?.totalOrders || 0).toLocaleString(t('common.locale')),
      sub: viewMode === 'current_shift' ? t('dashboard.stats.thisShift') : viewMode === 'previous_shift' ? t('dashboard.stats.previousShift') : t('dashboard.stats.last24h'),
      icon: Receipt,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10',
      onClick: () => {
        const state: any = { statusFilter: 'all' };
        if (viewMode === 'current_shift') state.selectedDateRange = 'current_shift';
        if (viewMode === 'previous_shift') state.selectedDateRange = 'previous_shift';
        navigate(`/dashboard/${locationSlug}/orders`, { state });
      }
    },
    {
      label: t('dashboard.stats.onHold'),
      value: (stats?.pendingOrders || 0).toLocaleString(t('common.locale')),
      sub: `${t('dashboard.stats.pendingOrders')} (${t('dashboard.stats.last24h')})`,
      icon: ShoppingBag,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10',
      onClick: () => {
        const state: any = { statusFilter: 'HELD', selectedDateRange: 'last_24_hours' };
        navigate(`/dashboard/${locationSlug}/orders`, { state });
      }
    }
  ];

  statCards.push(
    {
      label: t('dashboard.stats.avgOrder'),
      value: (stats?.averageOrderValue || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sub: t('dashboard.stats.averageValue'),
      icon: Scale,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10'
    },
    {
      label: t('dashboard.stats.refunds'),
      value: (stats?.totalRefunds || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      sub: viewMode === 'current_shift' ? t('dashboard.stats.thisShift') : viewMode === 'previous_shift' ? t('dashboard.stats.previousShift') : t('dashboard.stats.last24h'),
      icon: ArrowDownRight,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10'
    },
    {
      label: t('dashboard.stats.nonSales'),
      value: null, // Custom content
      sub: null,
      icon: ArrowUpRight,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10',
      customContent: (
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('dashboard.stats.payIn')}</span>
            <span className="text-sm font-bold text-paymint-green tracking-tight">+{ (stats?.totalPayIn || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</span>
          </div>
          <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('dashboard.stats.payOut')}</span>
            <span className="text-sm font-bold text-red-500 tracking-tight">-{ (stats?.totalPayOut || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</span>
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
      icon: Scale,
      color: previousShiftSnapshot.discrepancy > 0.01 ? 'text-amber-500' : previousShiftSnapshot.discrepancy < -0.01 ? 'text-red-500' : 'text-paymint-green',
      bg: previousShiftSnapshot.discrepancy > 0.01 ? 'bg-amber-500/10' : previousShiftSnapshot.discrepancy < -0.01 ? 'bg-red-500/10' : 'bg-paymint-green/10',
      customContent: (
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('dashboard.stats.expected')}</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-tight">{ (previousShiftSnapshot.drawerAmount || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</span>
          </div>
          <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('dashboard.stats.actual')}</span>
            <span className="text-sm font-bold text-paymint-green tracking-tight">{ (previousShiftSnapshot.closingBalance || 0).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }</span>
          </div>
          <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{t('dashboard.stats.variance')}</span>
            <span className={`text-sm font-bold tracking-tight ${previousShiftSnapshot.discrepancy > 0.01 ? 'text-amber-500' : previousShiftSnapshot.discrepancy < -0.01 ? 'text-red-500' : 'text-gray-500'}`}>
              {previousShiftSnapshot.discrepancy > 0.01
                ? `+${previousShiftSnapshot.discrepancy.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('dashboard.stats.over')}`
                : previousShiftSnapshot.discrepancy < -0.01
                  ? `${previousShiftSnapshot.discrepancy.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('dashboard.stats.short')}`
                  : `${t('dashboard.stats.perfect')} ${(0).toLocaleString(t('common.locale'))}`}
            </span>
          </div>
        </div>
      ),
      onClick: () => navigate(`/dashboard/${locationSlug}/reports/cash-discrepancy`)
    } as any);
  }

  return (
    <div id="tour-kpi-cards" className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="px-2.5 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-bold tracking-wide border border-paymint-green/20">
          {t('dashboard.stats.overview')}
        </span>
      </div>
      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="flex overflow-x-auto scrollbar-none gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 sm:overflow-visible">
        {statCards.map((stat: any, index) => (
          <motion.div
            key={`${stat.label}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={stat.onClick}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] transition-all duration-300 overflow-hidden min-w-[160px] sm:min-w-0 flex-shrink-0 sm:flex-shrink ${stat.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className={`absolute top-0 end-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                  <stat.icon size={20} />
                </div>
                {stat.onClick && (
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green transition-colors">
                    <ExternalLink size={14} />
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 flex items-center gap-1 capitalize">
                {stat.label}
              </p>

              {stat.customContent ? (
                stat.customContent
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {stat.value}
                    {stat.label.includes(t('dashboard.stats.totalOrders')) || stat.label.includes(t('dashboard.stats.onHold')) ? '' : <span className="text-sm mx-1 text-gray-400 font-black"> {currencySymbol}</span>}
                  </p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize">
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

import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();

  const formatCurrency = (value: number) => {
    return formatAmount(value);
  };

  const statCards = [
    {
      label: 'Total Sales',
      value: formatCurrency((stats?.totalRevenue || 0) + (stats?.taxCollected || 0)),
      sub: 'Including Tax',
      icon: Wallet,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Net Sales',
      value: formatCurrency(stats?.totalRevenue || 0),
      sub: 'Excluding Tax',
      icon: DollarSign,
      color: 'text-paymint-green',
      bg: 'bg-paymint-green/10'
    },
    {
      label: 'Profit',
      value: formatCurrency(stats?.grossProfit || 0),
      sub: 'Net Sales - Costs',
      icon: TrendingUp,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    {
      label: 'Tax',
      value: formatCurrency(stats?.taxCollected || 0),
      sub: 'Total Tax',
      icon: Percent,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      label: 'Orders',
      value: stats?.totalOrders?.toString() || '0',
      sub: viewMode === 'current_shift' ? 'This Shift' : viewMode === 'previous_shift' ? 'Previous Shift' : 'Last 24h',
      icon: Receipt,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      onClick: () => {
        const state: any = { statusFilter: 'all' };
        if (viewMode === 'current_shift') state.selectedDateRange = 'current_shift';
        if (viewMode === 'previous_shift') state.selectedDateRange = 'previous_shift';
        navigate(`/dashboard/${locationSlug}/orders`, { state });
      }
    },
    {
      label: 'On Hold',
      value: stats?.pendingOrders?.toString() || '0',
      sub: 'Pending Orders',
      icon: ShoppingBag,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      onClick: () => {
        const state: any = { statusFilter: 'HELD' };
        if (viewMode === 'current_shift') state.selectedDateRange = 'current_shift';
        if (viewMode === 'previous_shift') state.selectedDateRange = 'previous_shift';
        navigate(`/dashboard/${locationSlug}/orders`, { state });
      }
    },
    {
      label: 'Avg Order',
      value: formatCurrency(stats?.averageOrderValue || 0),
      sub: 'Average Value',
      icon: Scale,
      color: 'text-pink-500',
      bg: 'bg-pink-500/10'
    },
    {
      label: 'Refunds',
      value: formatCurrency(stats?.totalRefunds || 0),
      sub: viewMode === 'current_shift' ? 'This Shift' : viewMode === 'previous_shift' ? 'Previous Shift' : 'Last 24h',
      icon: ArrowDownRight,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
    {
      label: 'Non Sales',
      value: null, // Custom content
      sub: null,
      icon: ArrowUpRight,
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      customContent: (
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Pay In</span>
            <span className="text-sm font-bold text-paymint-green tracking-tight">+{formatCurrency(stats?.totalPayIn || 0)}</span>
          </div>
          <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Pay Out</span>
            <span className="text-sm font-bold text-red-500 tracking-tight">-{formatCurrency(stats?.totalPayOut || 0)}</span>
          </div>
        </div>
      ),
      onClick: () => setShowPayInOutModal(true)
    }
  ];

  if (viewMode === 'previous_shift' && previousShiftSnapshot) {
    statCards.push({
      label: 'Cash Variance',
      value: null as any,
      sub: null as any,
      icon: Scale,
      color: previousShiftSnapshot.discrepancy >= 0 ? 'text-paymint-green' : 'text-red-500',
      bg: previousShiftSnapshot.discrepancy >= 0 ? 'bg-paymint-green/10' : 'bg-red-500/10',
      customContent: (
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Expected</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-tight">{formatCurrency(previousShiftSnapshot.drawerAmount || 0)}</span>
          </div>
          <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Actual</span>
            <span className="text-sm font-bold text-blue-500 tracking-tight">{formatCurrency(previousShiftSnapshot.closingBalance || 0)}</span>
          </div>
          <div className="w-full h-px bg-gray-100 dark:bg-white/5" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Variance</span>
            <span className={`text-sm font-bold tracking-tight ${previousShiftSnapshot.discrepancy > 0.01 ? 'text-paymint-green' : previousShiftSnapshot.discrepancy < -0.01 ? 'text-red-500' : 'text-gray-500'}`}>
              {previousShiftSnapshot.discrepancy > 0.01
                ? `+${formatCurrency(previousShiftSnapshot.discrepancy)} Over`
                : previousShiftSnapshot.discrepancy < -0.01
                  ? `${formatCurrency(previousShiftSnapshot.discrepancy)} Short`
                  : 'Perfect $0.00'}
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
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-bold tracking-wide border border-blue-500/20">
          Overview
        </span>
      </div>
      {/* Mobile: horizontal scroll, Desktop: grid */}
      <div className="flex overflow-x-auto scrollbar-none gap-3 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-4 sm:overflow-visible">
        {statCards.map((stat: any, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={stat.onClick}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] transition-all duration-300 overflow-hidden min-w-[160px] sm:min-w-0 flex-shrink-0 sm:flex-shrink ${stat.onClick ? 'cursor-pointer' : ''}`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center transition-transform duration-300`}>
                  <stat.icon size={20} />
                </div>
                {stat.customContent && stat.onClick && (
                  <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green transition-colors">
                    <ExternalLink size={14} />
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 flex items-center gap-1">
                {stat.label}
              </p>

              {stat.customContent ? (
                stat.customContent
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
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
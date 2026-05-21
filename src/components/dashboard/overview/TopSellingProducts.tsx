import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../context/CurrencyContext';
import { StatValue } from '../../ui/StatValue';

interface TopProduct {
  name: string;
  orders: number;
  revenue: number;
}

interface TopSellingProductsProps {
  topProducts: TopProduct[];
  categoryBreakdown: { name: string; value: number; count?: number }[];
  viewMode: 'current_shift' | 'previous_shift' | 'last_24_hours';
  canViewReports?: boolean;
}

export const TopSellingProducts = React.memo(function TopSellingProducts({
  topProducts,
  categoryBreakdown,
  viewMode,
  canViewReports = true,
}: TopSellingProductsProps) {
  const { t } = useTranslation();
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const { currencySymbol } = useCurrency();

  return (
    <div id="tour-top-products" className="group relative bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm transition-all duration-300">
      <div className="absolute top-0 end-0 w-40 h-40 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green transition-transform duration-300">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">{t('dashboard.stats.bestSellers')}</h3>
              <p className="card-subtitle">
                {viewMode === 'current_shift' ? t('dashboard.stats.thisShift') : viewMode === 'previous_shift' ? t('dashboard.stats.previousShift') : t('dashboard.stats.last24h')}
              </p>
            </div>
          </div>
          {canViewReports && (
            <button
              onClick={() => navigate(`/dashboard/${locationSlug}/reports/items`)}
              className="text-xs font-bold text-mintcom-green hover:underline tracking-wide"
            >
              {t('orders.reports.sales.viewAll')}
            </button>
          )}
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Items Column */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-3 text-center">{t('dashboard.stats.top3Items')}</h4>
            {topProducts.length > 0 ? topProducts.slice(0, 3).map((item, index) => (
              <motion.div
                key={`${item.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between group/item hover:bg-white dark:hover:bg-white/5 hover:border-mintcom-green/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-xs font-black text-gray-500 group-hover/item:text-mintcom-green transition-colors border border-gray-100 dark:border-white/5">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-gray-900 dark:text-white group-hover/item:text-mintcom-green transition-colors truncate max-w-[120px]">{item.name}</p>
                    <div className="text-xs text-gray-500 font-medium">
                      <StatValue value={item.orders} isInteger={true} suffix={t('dashboard.stats.sold')} className="text-xs text-gray-500 inline-flex" />
                    </div>
                  </div>
                </div>
                <StatValue value={item.revenue} currency={currencySymbol} className="text-xs" />
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-xs text-gray-400">{t('dashboard.stats.noProducts')}</p>
              </div>
            )}
          </div>

          {/* Top Categories Column */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-3 text-center">{t('dashboard.stats.top3Categories')}</h4>
            {categoryBreakdown && categoryBreakdown.length > 0 ? categoryBreakdown.slice(0, 3).map((cat, index) => (
              <motion.div
                key={`${cat.name}-${index}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between group/cat hover:bg-white dark:hover:bg-white/5 hover:border-purple-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-xs font-black text-gray-500 group-hover/cat:text-purple-500 transition-colors border border-gray-100 dark:border-white/5">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-gray-900 dark:text-white group-hover/cat:text-purple-500 transition-colors truncate max-w-[120px]">{cat.name}</p>
                    <div className="text-xs text-gray-500 font-medium">
                      <StatValue value={cat.count || 0} isInteger={true} suffix={t('dashboard.stats.orders')} className="text-xs text-gray-500 inline-flex" />
                    </div>
                  </div>
                </div>
                <StatValue value={cat.value} currency={currencySymbol} className="text-xs" />
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <PieChart className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-xs text-gray-400">{t('dashboard.stats.noCategories')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});



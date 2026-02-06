import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Package, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCurrency } from '../../../context/CurrencyContext';

interface TopProduct {
  name: string;
  orders: number;
  revenue: number;
}

interface TopSellingProductsProps {
  topProducts: TopProduct[];
  categoryBreakdown: { name: string; value: number; count?: number }[];
  viewMode: 'current_shift' | 'previous_shift' | 'last_24_hours';
}

export const TopSellingProducts = React.memo(function TopSellingProducts({ topProducts, categoryBreakdown, viewMode }: TopSellingProductsProps) {
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const { formatAmount } = useCurrency();

  const formatCurrency = (value: number) => {
    return formatAmount(value);
  };

  return (
    <div id="tour-top-products" className="group relative bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm transition-all duration-300">
      <div className="absolute top-0 right-0 w-40 h-40 bg-paymint-green/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />
      <div className="relative z-10">
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green transition-transform duration-300">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Your Best Sellers</h3>
              <p className="text-xs font-bold text-gray-500 tracking-wide">
                {viewMode === 'current_shift' ? 'This Shift' : viewMode === 'previous_shift' ? 'Previous Shift' : 'Last 24h'}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/dashboard/${locationSlug}/reports`)}
            className="text-xs font-bold text-paymint-green hover:underline tracking-wide"
          >
            View All
          </button>
        </div>
        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Top Items Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Top 3 Items</h4>
            {topProducts.length > 0 ? topProducts.slice(0, 3).map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-3 rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between group/item hover:bg-white dark:hover:bg-white/5 hover:border-paymint-green/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center text-xs font-black text-gray-500 group-hover/item:text-paymint-green transition-colors border border-gray-100 dark:border-white/5">
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-gray-900 dark:text-white group-hover/item:text-paymint-green transition-colors truncate max-w-[120px]">{item.name}</p>
                    <p className="text-xs text-gray-500 font-medium">{item.orders} sold</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.revenue)}
                </p>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-xs text-gray-400">No products data</p>
              </div>
            )}
          </div>

          {/* Top Categories Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Top 3 Categories</h4>
            {categoryBreakdown && categoryBreakdown.length > 0 ? categoryBreakdown.slice(0, 3).map((cat, index) => (
              <motion.div
                key={cat.name}
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
                    <p className="text-xs text-gray-500 font-medium">{cat.count || 0} orders</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {formatCurrency(cat.value)}
                </p>
              </motion.div>
            )) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <PieChart className="w-8 h-8 text-gray-200 dark:text-gray-700 mb-2" />
                <p className="text-xs text-gray-400">No category data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
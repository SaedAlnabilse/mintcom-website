import { Percent, Tag } from 'lucide-react';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { SalesSummary } from '../../../../types';
import { motion } from 'framer-motion';
import { Pagination } from '../../../ui';
import { useState, useMemo } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

interface DiscountsViewProps {
  salesData: SalesSummary;
  isFetching: boolean;
}

export const DiscountsView = React.memo(function DiscountsView({ salesData, isFetching }: DiscountsViewProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [discountPage, setDiscountPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const formatCurrency = (value: number) => formatAmount(value);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedDiscounts = useMemo(() => {
    if (!salesData?.discountBreakdown) return [];
    const items = [...salesData.discountBreakdown];
    if (sortConfig) {
      items.sort((a, b) => {
        // Safe access using keyof
        const key = sortConfig.key as keyof typeof a;
        const aValue = a[key] ?? 0;
        const bValue = b[key] ?? 0;

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return items;
  }, [salesData, sortConfig]);

  return (
    <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Discount Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex items-center gap-4 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Percent size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">{t('orders.reports.discounts.totalDiscounted')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(salesData.totalDiscounts || 0)}
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] flex items-center gap-4 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">{t('orders.reports.discounts.timesApplied')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {(salesData.totalDiscountCount || 0).toLocaleString(t('common.locale'))}
            </p>
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
              <Tag size={20} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('orders.reports.discounts.breakdown')}</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th
                  className="px-6 py-4 text-start label-strong font-outfit cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={() => requestSort('name')}
                >
                  {t('orders.reports.discounts.name')}
                </th>
                <th
                  className="px-6 py-4 text-center label-strong font-outfit cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={() => requestSort('count')}
                >
                  {t('orders.reports.discounts.count')}
                </th>
                <th
                  className="px-6 py-4 text-center label-strong font-outfit cursor-pointer hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  onClick={() => requestSort('value')}
                >
                  {t('orders.reports.discounts.value')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sortedDiscounts.length > 0 ? (
                sortedDiscounts
                  .slice((discountPage - 1) * itemsPerPage, discountPage * itemsPerPage)
                  .map((item: any, idx: number) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isFetching ? 0.5 : 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 text-start">
                        <span className="font-bold text-gray-900 dark:text-white text-sm">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-gray-700 dark:text-gray-300">
                        {item.count.toLocaleString(t('common.locale'))}
                      </td>
                      <td className="px-6 py-4 text-center font-black text-orange-500">
                        {formatCurrency(item.value)}
                      </td>
                    </motion.tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-20 text-center text-gray-400 font-medium text-sm">
                    {t('orders.reports.discounts.noData')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={discountPage}
          totalPages={Math.ceil((salesData.discountBreakdown?.length || 0) / itemsPerPage)}
          onPageChange={(p) => setDiscountPage(p)}
        />
      </div>
    </div>
  );
});


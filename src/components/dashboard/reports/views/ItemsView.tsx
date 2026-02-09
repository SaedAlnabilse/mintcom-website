import { Search, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { ItemReportData } from '../../../../types';
import { Pagination } from '../../../ui';
import { useState, useMemo } from 'react';
import React from 'react';

interface ItemsViewProps {
  itemReportData: ItemReportData;
  itemReportTab: 'items' | 'categories' | 'modifiers' | 'attributes';
  setItemReportTab: (tab: 'items' | 'categories' | 'modifiers' | 'attributes') => void;
  itemSearchQuery: string;
  setItemSearchQuery: (query: string) => void;
  isFetching: boolean;
}

export const ItemsView = React.memo(function ItemsView({
  itemReportData,
  itemReportTab,
  setItemReportTab,
  itemSearchQuery,
  setItemSearchQuery,
  isFetching
}: ItemsViewProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
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

  const sortedItems = useMemo(() => {
    if (!itemReportData?.breakdown) return [];
    let items = [...itemReportData.breakdown];

    // Apply search filter
    if (itemSearchQuery.trim()) {
      const query = itemSearchQuery.toLowerCase();
      items = items.filter(item => {
        const name = (item.itemName || item.name || '').toLowerCase();
        return name.includes(query);
      });
    }

    if (sortConfig) {
      items.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle fallbacks
        if (sortConfig.key === 'name') {
          aValue = a.itemName || a.name;
          bValue = b.itemName || b.name;
        } else if (sortConfig.key === 'revenue') {
          aValue = a.totalSales || a.revenue;
          bValue = b.totalSales || b.revenue;
        }

        // Handle undefined values safely
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;

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
  }, [itemReportData, sortConfig, itemSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Sub-tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={t('orders.reports.items.searchPlaceholder', { type: t(`orders.reports.items.types.${itemReportTab}`) })}
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
          />
        </div>

        {/* Sub-tabs based on mode */}
        <div className="flex gap-2">
          {(itemReportTab === 'items' || itemReportTab === 'categories') ? (
            <>
              <button
                onClick={() => setItemReportTab('items')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${itemReportTab === 'items'
                  ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                  : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                  }`}
              >
                {t('orders.reports.items.byProducts')}
              </button>
              <button
                onClick={() => setItemReportTab('categories')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${itemReportTab === 'categories'
                  ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                  : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                  }`}
              >
                {t('orders.reports.items.byCategory')}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setItemReportTab('modifiers')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${itemReportTab === 'modifiers'
                  ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                  : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                  }`}
              >
                {t('orders.reports.items.byAddons')}
              </button>
              <button
                onClick={() => setItemReportTab('attributes')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${itemReportTab === 'attributes'
                  ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                  : 'bg-white dark:bg-white/5 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
                  }`}
              >
                {t('orders.reports.items.byAttributes')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th
                  className={`px-8 py-5 text-left text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'name' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-2">
                    {itemReportTab === 'categories' ? t('orders.reports.items.categoryName') : (itemReportTab === 'modifiers' ? t('orders.reports.items.addonName') : itemReportTab === 'attributes' ? t('orders.reports.items.attributeGroup') : t('orders.reports.items.productName'))}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'name' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className={`px-8 py-5 text-right text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'quantity' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-2">
                    {t('orders.reports.items.unitsSold')}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'quantity' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className={`px-8 py-5 text-right text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'revenue' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  onClick={() => requestSort('revenue')}
                >
                  <div className="flex items-center justify-end gap-2">
                    {t('orders.reports.items.grossRevenue')}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'revenue' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {sortedItems.length > 0 ? (
                sortedItems
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item: any, idx: number) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isFetching ? 0.5 : 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center font-black text-xs text-gray-500 border border-gray-200 dark:border-white/5 shadow-sm">
                            {(currentPage - 1) * itemsPerPage + idx + 1}
                          </div>
                          <span className="font-bold text-gray-900 dark:text-white text-sm">{item.itemName || item.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-gray-700 dark:text-gray-300">
                        {item.quantity}
                      </td>
                      <td className="px-8 py-5 text-right font-bold text-paymint-green">
                        {formatCurrency((item.totalSales || item.revenue) || 0)}
                      </td>
                    </motion.tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-20 text-center text-gray-400 font-black text-xs tracking-[0.2em]">{t('orders.reports.items.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil((itemReportData.breakdown?.length || 0) / itemsPerPage)}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
    </div>
  );
});
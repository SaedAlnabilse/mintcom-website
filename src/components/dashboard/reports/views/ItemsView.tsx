import { Search, ArrowUpDown, X, LayoutGrid, ShoppingBag, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { ItemReportData, ItemReportBreakdown } from '../../../../types';
import { Pagination } from '../../../ui';
import { useState, useMemo } from 'react';
import React from 'react';
import api from '../../../../config/api';
import { createPortal } from 'react-dom';

interface ItemsViewProps {
  itemReportData: ItemReportData;
  itemReportTab: 'items' | 'categories' | 'modifiers' | 'attributes';
  setItemReportTab: (tab: 'items' | 'categories' | 'modifiers' | 'attributes') => void;
  itemSearchQuery: string;
  setItemSearchQuery: (query: string) => void;
  isFetching: boolean;
  startDate?: string;
  endDate?: string;
  selectedEmployeeId?: string | null;
}

export const ItemsView = React.memo(function ItemsView({
  itemReportData,
  itemReportTab,
  setItemReportTab,
  itemSearchQuery,
  setItemSearchQuery,
  isFetching,
  startDate,
  endDate,
  selectedEmployeeId
}: ItemsViewProps) {
  const { t } = useTranslation();
  const { currencySymbol } = useCurrency();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Breakdown Modal State
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string } | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<ItemReportBreakdown[]>([]);
  const [isFetchingBreakdown, setIsFetchingBreakdown] = useState(false);
  const [breakdownSearchQuery, setBreakdownSearchQuery] = useState('');

  const formatCurrency = (value: number) => (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-bold tracking-tight">
        {value.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{currencySymbol}</span>
    </span>
  );

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

  const fetchCategoryBreakdown = async (categoryId: string, categoryName: string) => {
    setSelectedCategory({ id: categoryId, name: categoryName });
    setIsBreakdownModalOpen(true);
    setIsFetchingBreakdown(true);
    setBreakdownSearchQuery('');

    try {
      const res = await api.get('/reports/item-report', {
        params: {
          startDate,
          endDate,
          employeeId: selectedEmployeeId || '',
          categoryId: categoryId
        }
      });
      setCategoryBreakdown(res.data?.breakdown || []);
    } catch (error) {
      console.error('Failed to fetch category breakdown:', error);
    } finally {
      setIsFetchingBreakdown(false);
    }
  };

  const filteredBreakdown = useMemo(() => {
    if (!breakdownSearchQuery.trim()) return categoryBreakdown;
    const query = breakdownSearchQuery.toLowerCase();
    return categoryBreakdown.filter(item =>
      (item.itemName || item.name || '').toLowerCase().includes(query)
    );
  }, [categoryBreakdown, breakdownSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Sub-tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input maxLength={255}
            type="text"
            placeholder={t('orders.reports.items.searchPlaceholder', { type: t(`orders.reports.items.types.${itemReportTab}`) })}
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            className="w-full pl-12 pr-11 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none transition-all"
          />
          {itemSearchQuery && (
            <button
              type="button"
              onClick={() => setItemSearchQuery('')}
              aria-label={t('common.clearSearch', 'Clear search')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X size={12} strokeWidth={2.75} />
            </button>
          )}
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
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-white/[0.02]">
              <tr className="border-b border-gray-200 dark:border-white/5">
                <th
                  className={`px-8 py-5 text-start label-strong font-outfit cursor-pointer select-none transition-colors group ${sortConfig?.key === 'name' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-2">
                    {itemReportTab === 'categories' ? t('orders.reports.items.categoryName') : (itemReportTab === 'modifiers' ? t('orders.reports.items.addonName') : itemReportTab === 'attributes' ? t('orders.reports.items.attributeGroup') : t('orders.reports.items.productName'))}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'name' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className={`px-8 py-5 text-end label-strong font-outfit cursor-pointer select-none transition-colors group ${sortConfig?.key === 'quantity' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center justify-end gap-2">
                    {t('orders.reports.items.unitsSold')}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'quantity' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className={`px-8 py-5 text-end label-strong font-outfit cursor-pointer select-none transition-colors group ${sortConfig?.key === 'revenue' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
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
                      onClick={() => {
                        if (itemReportTab === 'categories') {
                          const categoryId = item.id || item.categoryId;
                          const categoryName = item.itemName || item.name || t('common.unknown');
                          if (categoryId) {
                            fetchCategoryBreakdown(categoryId, categoryName);
                          }
                        }
                      }}
                      className={`group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${itemReportTab === 'categories' ? 'cursor-pointer select-none active:scale-[0.995]' : ''}`}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center font-black text-xs text-gray-500 border border-gray-200 dark:border-white/5 shadow-sm">
                            {((currentPage - 1) * itemsPerPage + idx + 1).toLocaleString(t('common.locale'))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-white text-sm">{item.itemName || item.name || t('common.unknown')}</span>
                            {itemReportTab === 'categories' && (
                              <ChevronRight size={14} className="text-gray-300 dark:text-white/10 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-end font-bold text-gray-700 dark:text-gray-300">
                        {item.quantity.toLocaleString(t('common.locale'))}
                      </td>
                      <td className="px-8 py-5 text-end font-bold text-paymint-green">
                        {formatCurrency((item.totalSales || item.revenue) || 0)}
                      </td>
                    </motion.tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-32 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="w-16 h-16 rounded-[24px] bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-white/10 border border-gray-100 dark:border-white/5">
                        <ShoppingBag size={32} />
                      </div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide max-w-xs mx-auto leading-relaxed">
                        {t('orders.reports.items.noData')}
                      </p>
                    </div>
                  </td>
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

      {/* Category Breakdown Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isBreakdownModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBreakdownModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-[#1E293B] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                        {selectedCategory?.name}
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t('orders.reports.items.categoryBreakdown')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsBreakdownModalOpen(false)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-200 dark:border-white/10 transition-all hover:rotate-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                  {isFetchingBreakdown ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
                      <p className="text-sm font-bold text-gray-400">{t('common.loading')}</p>
                    </div>
                  ) : filteredBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {filteredBreakdown.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 group hover:border-paymint-green/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 border border-gray-100 dark:border-white/10 shadow-sm group-hover:text-paymint-green transition-colors">
                              <ShoppingBag size={18} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900 dark:text-white text-base">{item.itemName || item.name}</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-gray-400">{item.quantity} {t('orders.reports.items.unitsSold')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-paymint-green text-base">
                              {formatCurrency((item.totalSales || item.revenue) || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-300 dark:text-white/10 mb-4 border border-gray-100 dark:border-white/5">
                        <ShoppingBag size={28} />
                      </div>
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 tracking-wide text-center max-w-[240px]">
                        {t('orders.reports.items.noData')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-gray-400">{t('common.total', 'Total')}:</span>
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                      {filteredBreakdown.length} {t('common.items', 'Items')}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 items-end">
                    <span className="text-xs font-bold text-gray-400">{t('dashboard.stats.revenue')}:</span>
                    <span className="text-xl font-bold text-paymint-green">
                      {formatCurrency(filteredBreakdown.reduce((acc, curr) => acc + ((curr.totalSales || curr.revenue) || 0), 0))}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
});


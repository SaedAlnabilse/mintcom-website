import { Search, ArrowUpDown, X, LayoutGrid, ShoppingBag, ChevronRight, History, Info, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { ItemReportData, ItemReportBreakdown, ItemPriceHistory } from '../../../../types';
import { Pagination } from '../../../ui';
import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import api from '../../../../config/api';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { getDateLocale } from '../../../../utils/dateLocale';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';

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

  // Price History State
  const [priceHistory, setPriceHistory] = useState<ItemPriceHistory[]>([]);
  const [, setIsFetchingPriceHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<{ id: string, name: string, type: 'ITEM' | 'ADDON' } | null>(null);
  const [historyScope, setHistoryScope] = useState<'all' | 'period'>('all');

  // Breakdown Modal State
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<{ id: string, name: string } | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<ItemReportBreakdown[]>([]);
  const [isFetchingBreakdown, setIsFetchingBreakdown] = useState(false);
  const [breakdownSearchQuery, setBreakdownSearchQuery] = useState('');

  const historyTargets = useMemo(() => {
    const breakdown = itemReportData?.breakdown || [];

    if (itemReportTab === 'items') {
      return {
        itemIds: Array.from(
          new Set(
            breakdown
              .map((item) => item.itemId || item.id)
              .filter((value): value is string => Boolean(value)),
          ),
        ),
        subAttributeIds: [] as string[],
      };
    }

    if (itemReportTab === 'modifiers') {
      return {
        itemIds: [] as string[],
        subAttributeIds: Array.from(
          new Set(
            breakdown
              .map((item) => item.modifierId || item.id)
              .filter((value): value is string => Boolean(value)),
          ),
        ),
      };
    }

    return { itemIds: [] as string[], subAttributeIds: [] as string[] };
  }, [itemReportData?.breakdown, itemReportTab]);

  // Fetch Price History when report content changes
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (
        itemReportTab !== 'items' &&
        itemReportTab !== 'modifiers'
      ) {
        setPriceHistory([]);
        return;
      }

      if (
        historyTargets.itemIds.length === 0 &&
        historyTargets.subAttributeIds.length === 0
      ) {
        setPriceHistory([]);
        return;
      }

      setIsFetchingPriceHistory(true);
      try {
        const res = await api.get('/reports/price-history', {
          params: {
            ...(startDate && endDate ? { startDate, endDate } : {}),
            ...(historyTargets.itemIds.length > 0
              ? { itemIds: historyTargets.itemIds.join(',') }
              : {}),
            ...(historyTargets.subAttributeIds.length > 0
              ? { subAttributeIds: historyTargets.subAttributeIds.join(',') }
              : {}),
          }
        });
        setPriceHistory(res.data || []);
      } catch (err) {
        console.error('Failed to fetch price history:', err);
      } finally {
        setIsFetchingPriceHistory(false);
      }
    };

    fetchPriceHistory();
  }, [
    startDate,
    endDate,
    itemReportTab,
    historyTargets.itemIds,
    historyTargets.subAttributeIds,
  ]);

  useEffect(() => {
    setSelectedHistoryItem(null);
    setHistoryScope('all');
  }, [itemReportTab, startDate, endDate]);

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

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage));
  const paginatedItems = useMemo(
    () => sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [currentPage, sortedItems],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [itemReportTab, itemSearchQuery, itemReportData]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
          ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
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

  const getItemPriceHistory = (
    id: string,
    type: 'ITEM' | 'ADDON',
    scope: 'all' | 'period' = 'all',
  ) => {
    return priceHistory.filter((historyEntry) => {
      const matchesId =
        historyEntry.type === type &&
        (historyEntry.itemId === id || historyEntry.subAttributeId === id);

      if (!matchesId) {
        return false;
      }

      return scope === 'all' || Boolean(historyEntry.inSelectedRange);
    });
  };

  const selectedAllHistory = useMemo(() => {
    if (!selectedHistoryItem) {
      return [];
    }

    return getItemPriceHistory(
      selectedHistoryItem.id,
      selectedHistoryItem.type,
      'all',
    );
  }, [selectedHistoryItem, priceHistory]);

  const selectedPeriodHistory = useMemo(() => {
    if (!selectedHistoryItem) {
      return [];
    }

    return getItemPriceHistory(
      selectedHistoryItem.id,
      selectedHistoryItem.type,
      'period',
    );
  }, [selectedHistoryItem, priceHistory]);

  const selectedHistoryEntries =
    historyScope === 'all' ? selectedAllHistory : selectedPeriodHistory;

  const getHistoryFieldLabel = (field?: ItemPriceHistory['field']) => {
    if (field === 'name') {
      return t('reports.history.fieldName', { defaultValue: 'Name' });
    }
    if (field === 'image') {
      return t('reports.history.fieldImage', { defaultValue: 'Image' });
    }
    return t('reports.history.fieldPrice', { defaultValue: 'Price' });
  };

  const getHistoryImageUrl = (value: unknown) => {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }
    const imagePath = value.trim();
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    const cleanPath = imagePath.replace('/public', '').replace('public/', '');
    return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  };

  const formatHistoryMoney = (
    value: ItemPriceHistory['oldValue'] | ItemPriceHistory['newValue'],
    fallback?: number | null,
  ) => {
    const numericValue = typeof value === 'number' ? value : fallback;
    if (typeof numericValue !== 'number' || Number.isNaN(numericValue)) {
      return '-';
    }

    return `${numericValue.toLocaleString(t('common.locale'), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} ${currencySymbol}`;
  };

  const renderHistoryValue = (
    history: ItemPriceHistory,
    side: 'old' | 'new',
  ) => {
    const field = history.field || 'price';
    const value = side === 'old' ? history.oldValue : history.newValue;

    if (field === 'price') {
      return formatHistoryMoney(
        value,
        side === 'old' ? history.oldPrice : history.newPrice,
      );
    }

    if (field === 'image') {
      const imageUrl = getHistoryImageUrl(
        side === 'old'
          ? history.oldImage ?? history.oldValue
          : history.newImage ?? history.newValue,
      );

      return imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="h-16 w-16 rounded-xl object-cover border border-gray-200 dark:border-white/10"
        />
      ) : (
        <span className="text-sm font-bold text-gray-400">
          {t('reports.history.noImage', { defaultValue: 'No image' })}
        </span>
      );
    }

    return (
      <span className="text-sm font-bold text-gray-700 dark:text-gray-200 break-words">
        {typeof value === 'string' && value.trim()
          ? value
          : t('reports.history.emptyValue', { defaultValue: 'Empty' })}
      </span>
    );
  };

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
                paginatedItems.map((item: any, idx: number) => {
                    const itemId =
                      itemReportTab === 'items'
                        ? (item.itemId || item.id)
                        : (item.modifierId || item.id);
                    const itemType = itemReportTab === 'modifiers' ? 'ADDON' : 'ITEM';
                    const canShowHistory =
                      (itemReportTab === 'items' || itemReportTab === 'modifiers') &&
                      Boolean(itemId);
                    const itemHist =
                      canShowHistory
                        ? getItemPriceHistory(itemId, itemType, 'all')
                        : [];
                    const periodHist =
                      canShowHistory
                        ? getItemPriceHistory(itemId, itemType, 'period')
                        : [];
                    const hasHistory = itemHist.length > 0;
                    const hasHistoryInRange = periodHist.length > 0;

                    return (
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
                              {canShowHistory && (
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setHistoryScope('all');
                                     setSelectedHistoryItem({ 
                                       id: itemId,
                                       name: item.itemName || item.name || t('common.unknown'),
                                       type: itemType,
                                     });
                                   }}
                                   className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border transition-all ${
                                     hasHistoryInRange
                                       ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                       : 'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/20'
                                   }`}
                                   title={
                                     hasHistoryInRange
                                       ? t('reports.history.inRange', {
                                           defaultValue: 'Has changes in the selected report period',
                                         })
                                       : hasHistory
                                         ? t('reports.history.allOnly', {
                                             defaultValue: 'View all recorded history',
                                           })
                                         : t('reports.history.noneYet', {
                                             defaultValue: 'No recorded price history yet',
                                           })
                                   }
                                 >
                                   <History size={12} strokeWidth={2.5} />
                                   <span className="text-[10px] font-black uppercase tracking-wider">
                                     {t('reports.history.badge', { defaultValue: 'History' })}
                                   </span>
                                 </button>
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
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={3} className="py-32 text-center">
                    <AnalyticsEmptyState
                      icon={ShoppingBag}
                      title={t('orders.reports.items.noData')}
                      description={t('orders.reports.items.totalSales')}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
          totalItems={sortedItems.length}
          itemsPerPage={itemsPerPage}
        />
      </div>

      {/* Price History Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedHistoryItem && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedHistoryItem(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-white/5"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <History size={20} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                         {selectedHistoryItem.name}
                       </h3>
                       <p className="text-xs text-gray-500 mt-0.5">
                         {t('reports.history.modalTitle', { defaultValue: 'Change History' })}
                       </p>
                     </div>
                   </div>
                  <button
                    onClick={() => setSelectedHistoryItem(null)}
                    className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 border border-gray-200 dark:border-white/10 transition-all hover:rotate-90"
                  >
                    <X size={20} />
                  </button>
                </div>

                 {/* Content */}
                 <div className="p-6 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                   <div className="mb-4 flex items-center justify-between gap-3">
                     <div>
                       <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                         {t('reports.history.scopeLabel', { defaultValue: 'Scope' })}
                       </p>
                       <p className="text-xs text-gray-500 mt-1">
                         {t('reports.history.scopeSummary', {
                          defaultValue: '{{all}} total changes - {{period}} in selected range',
                           all: selectedAllHistory.length,
                           period: selectedPeriodHistory.length,
                         })}
                       </p>
                     </div>
                     <div className="inline-flex rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-1">
                       <button
                         type="button"
                         onClick={() => setHistoryScope('all')}
                         className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                           historyScope === 'all'
                             ? 'bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white shadow-sm'
                             : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                         }`}
                       >
                         {t('reports.history.scopeAll', { defaultValue: 'All history' })}
                       </button>
                       <button
                         type="button"
                         onClick={() => setHistoryScope('period')}
                         className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                           historyScope === 'period'
                             ? 'bg-white dark:bg-[#0F172A] text-gray-900 dark:text-white shadow-sm'
                             : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'
                         }`}
                       >
                         {t('reports.history.scopePeriod', { defaultValue: 'This period' })}
                       </button>
                     </div>
                   </div>
                   <div className="space-y-4">
                     {selectedHistoryEntries.length > 0 ? selectedHistoryEntries.map((history) => (
                       <div
                         key={history.id}
                         className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                            <Calendar size={12} />
                            {format(new Date(history.createdAt), 'PPpp', { locale: getDateLocale(t('common.locale')) })}
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-wider">
                            <Info size={10} />
                            {t('reports.history.updatedLabel', { defaultValue: 'Updated' })}
                          </div>
                        </div>

                        {(history.changedByName || history.changedById) && (
                          <div className="px-3 py-2 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 text-xs font-bold text-gray-500 dark:text-gray-400">
                            {t('reports.history.changedBy', {
                              defaultValue: 'Changed by {{name}}',
                              name: history.changedByName || history.changedById,
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 px-3 py-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {t('reports.history.fieldLabel', { defaultValue: 'Changed field' })}
                          </p>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                            <Info size={10} />
                            {getHistoryFieldLabel(history.field)}
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 py-2">
                          <div className="min-w-0 flex-1 text-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              {t('reports.history.from', { defaultValue: 'Old value' })}
                            </p>
                            <div className={(history.field || 'price') === 'price' ? 'text-lg font-bold text-gray-500 line-through decoration-paymint-red/40' : 'flex justify-center'}>
                              {renderHistoryValue(history, 'old')}
                            </div>
                          </div>
                          <ChevronRight className="text-gray-300" />
                          <div className="min-w-0 flex-1 text-center">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                              {t('reports.history.to', { defaultValue: 'New value' })}
                            </p>
                            <div className={(history.field || 'price') === 'price' ? 'text-xl font-black text-gray-900 dark:text-white' : 'flex justify-center'}>
                              {renderHistoryValue(history, 'new')}
                            </div>
                          </div>
                        </div>

                        {history.reason && (
                          <div className="mt-2 p-3 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                              {t('reports.history.reason', { defaultValue: 'Reason' })}
                            </p>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">"{history.reason}"</p>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="py-10 text-center">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {historyScope === 'all'
                            ? t('reports.history.noAllHistory', {
                                defaultValue: 'No history has been recorded for this item yet.',
                              })
                            : t('reports.history.noPeriodHistory', {
                                defaultValue: 'No changes were recorded for this item in the selected report period.',
                              })}
                        </p>
                      </div>
                    )}
                   </div>
                 </div>

                {/* Footer */}
                 <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between">
                   <p className="text-xs font-bold text-gray-500 max-w-[280px]">
                     {t('reports.history.disclaimer', {
                       defaultValue: 'History helps explain reporting changes when item or add-on details are updated over time.',
                     })}
                   </p>
                   <button
                     onClick={() => setSelectedHistoryItem(null)}
                     className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-105 transition-all"
                   >
                     {t('common.close', { defaultValue: 'Close' })}
                   </button>
                 </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

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
                    <AnalyticsEmptyState
                      icon={ShoppingBag}
                      title={t('orders.reports.items.noData')}
                      description={t('orders.reports.items.subtitle')}
                      compact
                      className="py-20"
                    />
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


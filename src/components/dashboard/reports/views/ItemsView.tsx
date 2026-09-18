import { Search, ArrowUpDown, X, LayoutGrid, ShoppingBag, ChevronRight, History, Info, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../../../context/CurrencyContext';
import type { ItemReportData, ItemReportBreakdown, ItemPriceHistory } from '../../../../types';
import { Pagination, ModalCloseButton } from '../../../ui';
import { useState, useMemo, useEffect } from 'react';
import React from 'react';
import api from '../../../../config/api';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { getDateLocale } from '../../../../utils/dateLocale';
import { AnalyticsEmptyState } from '../AnalyticsEmptyState';
import { StatValue } from '../../../../components/ui/StatValue';

// Report names arrive with inline status markers baked into the string, e.g.
// "Tea Type > Black Tea [History]". Strip them for display and lift [Deleted]
// out so it renders as the dedicated badge instead of literal text.
const DELETED_MARKER_RE = /\[\s*deleted\s*\]/i;
const NAME_MARKER_RE = /\[\s*(?:history|deleted)\s*\]/gi;
const stripNameMarkers = (raw: string) =>
  raw
    .replace(NAME_MARKER_RE, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+>/g, ' >')
    .trim();

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
        attributeIds: [] as string[],
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
        attributeIds: [] as string[],
      };
    }

    if (itemReportTab === 'attributes') {
      return {
        itemIds: [] as string[],
        subAttributeIds: [] as string[],
        attributeIds: Array.from(
          new Set(
            breakdown
              .map((item: any) => item.attributeId || item.id)
              .filter((value: unknown): value is string => Boolean(value)),
          ),
        ),
      };
    }

    return {
      itemIds: [] as string[],
      subAttributeIds: [] as string[],
      attributeIds: [] as string[],
    };
  }, [itemReportData?.breakdown, itemReportTab]);

  // Fetch Price History when report content changes
  useEffect(() => {
    const fetchPriceHistory = async () => {
      if (
        itemReportTab !== 'items' &&
        itemReportTab !== 'categories' &&
        itemReportTab !== 'modifiers' &&
        itemReportTab !== 'attributes'
      ) {
        setPriceHistory([]);
        return;
      }

      if (
        historyTargets.itemIds.length === 0 &&
        historyTargets.subAttributeIds.length === 0 &&
        historyTargets.attributeIds.length === 0
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
            ...(historyTargets.attributeIds.length > 0
              ? { attributeIds: historyTargets.attributeIds.join(',') }
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
    historyTargets.attributeIds,
  ]);

  useEffect(() => {
    setSelectedHistoryItem(null);
    setHistoryScope('all');
  }, [itemReportTab, startDate, endDate]);

  const formatCurrency = (value: number, align: 'start' | 'end' | 'center' = 'center') => (
    <StatValue
      value={value}
      currency={currencySymbol}
      className="text-sm font-bold"
      containerClassName={align === 'end' ? 'justify-end w-full' : align === 'center' ? 'justify-center w-full' : 'justify-start w-full'}
    />
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
        const name = stripNameMarkers(item.itemName || item.name || '').toLowerCase();
        return name.includes(query);
      });
    }

    if (sortConfig) {
      items.sort((a: any, b: any) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle fallbacks
        if (sortConfig.key === 'name') {
          aValue = a.itemName || a.name;
          bValue = b.itemName || b.name;
        } else if (sortConfig.key === 'revenue') {
          aValue = a.totalSales || a.revenue;
          bValue = b.totalSales || b.revenue;
        } else if (sortConfig.key === 'refundQuantity') {
          aValue = a.refundQuantity || 0;
          bValue = b.refundQuantity || 0;
        } else if (sortConfig.key === 'totalRefunds') {
          aValue = a.totalRefunds || 0;
          bValue = b.totalRefunds || 0;
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
        (historyEntry.itemId === id ||
          historyEntry.subAttributeId === id ||
          historyEntry.attributeId === id);

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
    if (field === 'cost') {
      return t('reports.history.fieldCost', { defaultValue: 'Cost' });
    }
    if (field === 'category') {
      return t('reports.history.fieldCategory', { defaultValue: 'Category' });
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

    return (
      <StatValue 
        value={numericValue} 
        currency={currencySymbol} 
        className="text-sm font-bold"
      />
    );
  };

  const renderHistoryValue = (
    history: ItemPriceHistory,
    side: 'old' | 'new',
  ) => {
    const field = history.field || 'price';
    const value = side === 'old' ? history.oldValue : history.newValue;

    if (field === 'price' || field === 'cost') {
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
          className="h-16 w-16 rounded-xl object-cover border border-stone-200 dark:border-zinc-800"
        />
      ) : (
        <span className="text-sm font-bold text-stone-400">
          {t('reports.history.noImage', { defaultValue: 'No image' })}
        </span>
      );
    }

    return (
      <span className="text-sm font-bold text-stone-700 dark:text-zinc-200 break-words">
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
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input maxLength={255}
            type="text"
            placeholder={t('orders.reports.items.searchPlaceholder', { type: t(`orders.reports.items.types.${itemReportTab}`) })}
            value={itemSearchQuery}
            onChange={(e) => setItemSearchQuery(e.target.value)}
            className="w-full pl-12 pr-11 py-3 rounded-xl bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-sm font-medium text-stone-900 dark:text-zinc-100 placeholder-stone-400 focus:outline-none transition-all"
          />
          {itemSearchQuery && (
            <button
              type="button"
              onClick={() => setItemSearchQuery('')}
              aria-label={t('common.clearSearch', 'Clear search')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors"
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
                  ? 'bg-mintcom-green text-black shadow-lg shadow-mintcom-green/20'
                  : 'bg-white dark:bg-zinc-800 text-stone-500 hover:bg-stone-50 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800'
                  }`}
              >
                {t('orders.reports.items.byProducts')}
              </button>
              <button
                onClick={() => setItemReportTab('categories')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${itemReportTab === 'categories'
                  ? 'bg-mintcom-green text-black shadow-lg shadow-mintcom-green/20'
                  : 'bg-white dark:bg-zinc-800 text-stone-500 hover:bg-stone-50 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800'
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
                  ? 'bg-mintcom-green text-black shadow-lg shadow-mintcom-green/20'
                  : 'bg-white dark:bg-zinc-800 text-stone-500 hover:bg-stone-50 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800'
                  }`}
              >
                {t('orders.reports.items.byAddons')}
              </button>
              <button
                onClick={() => setItemReportTab('attributes')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${itemReportTab === 'attributes'
                  ? 'bg-mintcom-green text-black shadow-lg shadow-mintcom-green/20'
                  : 'bg-white dark:bg-zinc-800 text-stone-500 hover:bg-stone-50 dark:hover:bg-zinc-800 border border-stone-200 dark:border-zinc-800'
                  }`}
              >
                {t('orders.reports.items.byAttributes')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-stone-50 dark:bg-zinc-800/40">
              <tr className="border-b border-stone-200 dark:border-zinc-800">
                <th
                  className={`px-8 py-5 text-start label-strong font-sans cursor-pointer select-none transition-colors group ${sortConfig?.key === 'name' ? 'text-mintcom-green' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center gap-2">
                    {itemReportTab === 'categories' ? t('orders.reports.items.categoryName') : (itemReportTab === 'modifiers' ? t('orders.reports.items.addonName') : itemReportTab === 'attributes' ? t('orders.reports.items.attributeGroup') : t('orders.reports.items.productName'))}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'name' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className={`px-8 py-5 text-center label-strong font-sans cursor-pointer select-none transition-colors group ${sortConfig?.key === 'quantity' ? 'text-mintcom-green' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                  onClick={() => requestSort('quantity')}
                >
                  <div className="flex items-center justify-center gap-2">
                    {t('orders.reports.items.unitsSold')}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'quantity' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className={`px-8 py-5 text-center label-strong font-sans cursor-pointer select-none transition-colors group ${sortConfig?.key === 'revenue' ? 'text-mintcom-green' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                  onClick={() => requestSort('revenue')}
                >
                  <div className="flex items-center justify-center gap-2">
                    {t('orders.reports.items.grossRevenue')}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'revenue' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className={`px-8 py-5 text-center label-strong font-sans cursor-pointer select-none transition-colors group ${sortConfig?.key === 'refundQuantity' ? 'text-mintcom-green' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                  onClick={() => requestSort('refundQuantity')}
                >
                  <div className="flex items-center justify-center gap-2">
                    {t('orders.reports.items.refundQty')}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'refundQuantity' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
                <th
                  className={`px-8 py-5 text-center label-strong font-sans cursor-pointer select-none transition-colors group ${sortConfig?.key === 'totalRefunds' ? 'text-mintcom-green' : 'text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300'}`}
                  onClick={() => requestSort('totalRefunds')}
                >
                  <div className="flex items-center justify-center gap-2">
                    {t('orders.reports.items.refunds')}
                    <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'totalRefunds' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
              {sortedItems.length > 0 ? (
                paginatedItems.map((item: any, idx: number) => {
                    const itemId =
                      itemReportTab === 'items'
                        ? (item.itemId || item.id)
                        : itemReportTab === 'attributes'
                          ? (item.attributeId || item.id)
                          : (item.modifierId || item.id);
                    const itemType =
                      itemReportTab === 'modifiers' || itemReportTab === 'attributes'
                        ? 'ADDON'
                        : 'ITEM';
                    const canShowHistory =
                      (itemReportTab === 'items' ||
                        itemReportTab === 'modifiers' ||
                        itemReportTab === 'attributes') &&
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
                    const rawName = item.itemName || item.name || t('common.unknown');
                    const displayName = stripNameMarkers(rawName) || rawName;
                    const isDeleted =
                      Boolean(item.deletedAt) ||
                      Boolean(item.deactivatedAt) ||
                      item.isActive === false ||
                      item.deleted === true ||
                      item.isDeleted === true ||
                      DELETED_MARKER_RE.test(rawName);

                    return (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isFetching ? 0.5 : 1 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={() => {
                          if (itemReportTab === 'categories') {
                            const categoryId = item.id || item.categoryId;
                            if (categoryId) {
                              fetchCategoryBreakdown(categoryId, displayName);
                            }
                          }
                        }}
                        className={`group hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors ${itemReportTab === 'categories' ? 'cursor-pointer select-none active:scale-[0.995]' : ''}`}
                      >
                        <td className="px-8 py-5 text-start">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-stone-500 border border-stone-200 dark:border-zinc-800 shadow-sm">
                              <StatValue value={(currentPage - 1) * itemsPerPage + idx + 1} isInteger={true} className="text-xs" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900 dark:text-zinc-100 text-sm">{displayName}</span>
                              {isDeleted && (
                                <span className="text-[11px] font-black uppercase tracking-wider text-paymint-red">
                                  {t('reports.deletedBadge', { defaultValue: '[Deleted]' })}
                                </span>
                              )}
                              {itemReportTab === 'categories' && (
                                <ChevronRight size={14} className="text-stone-300 dark:text-zinc-700 opacity-40 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                              )}
                              {canShowHistory && (
                                 <button
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setHistoryScope('all');
                                     setSelectedHistoryItem({
                                       id: itemId,
                                       name: displayName,
                                       type: itemType,
                                     });
                                   }}
                                   className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                                     hasHistoryInRange
                                       ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                                       : 'bg-stone-500/10 text-stone-500 border-stone-500/20 hover:bg-stone-500/20'
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
                                   <History size={13} strokeWidth={2.5} />
                                 </button>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center font-bold text-stone-700 dark:text-zinc-300">
                          <StatValue 
                            value={item.quantity} 
                            isInteger={true}
                            className="text-sm"
                            containerClassName="justify-center w-full"
                          />
                        </td>
                        <td className="px-8 py-5 text-center font-bold text-mintcom-green">
                          {formatCurrency((item.totalSales || item.revenue) || 0, 'center')}
                        </td>
                        <td className="px-8 py-5 text-center font-bold text-stone-700 dark:text-zinc-300">
                          <StatValue 
                            value={item.refundQuantity || 0} 
                            isInteger={true}
                            className={`text-sm ${(item.refundQuantity || 0) > 0 ? 'text-paymint-red' : ''}`}
                            containerClassName="justify-center w-full"
                          />
                        </td>
                        <td className={`px-8 py-5 text-center font-bold ${(item.totalRefunds || 0) > 0 ? 'text-paymint-red' : 'text-stone-400'}`}>
                          {formatCurrency(item.totalRefunds || 0, 'center')}
                        </td>
                      </motion.tr>
                    );
                  })
              ) : (
                <tr>
                  <td colSpan={5} className="py-32 text-center">
                    <AnalyticsEmptyState
                      icon={ShoppingBag}
                      title={t('orders.reports.items.noData')}
                      description={t('orders.reports.items.noDataDesc')}
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
                className="relative w-full max-w-lg bg-white dark:bg-zinc-900/60 rounded-[32px] shadow-md overflow-hidden border border-stone-100 dark:border-zinc-800"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-stone-100 dark:border-zinc-800 flex items-center justify-between bg-stone-50/50 dark:bg-zinc-800/40">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <History size={20} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                         {selectedHistoryItem.name}
                       </h3>
                       <p className="text-xs text-stone-500 mt-0.5">
                         {t('reports.history.modalTitle', { defaultValue: 'Change History' })}
                       </p>
                     </div>
                   </div>
                  <ModalCloseButton onClose={() => setSelectedHistoryItem(null)} />
                </div>

                 {/* Content */}
                 <div className="p-6 max-h-[50vh] overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-white/10">
                   <div className="mb-4 flex items-center justify-between gap-3">
                     <div>
                       <p className="text-xs font-black uppercase tracking-widest text-stone-400">
                         {t('reports.history.scopeLabel', { defaultValue: 'Scope' })}
                       </p>
                       <p className="text-xs text-stone-500 mt-1">
                         {t('reports.history.scopeSummary', {
                          defaultValue: '{{all}} total changes - {{period}} in selected range',
                           all: selectedAllHistory.length,
                           period: selectedPeriodHistory.length,
                         })}
                       </p>
                     </div>
                     <div className="inline-flex rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800/40 p-1">
                       <button
                         type="button"
                         onClick={() => setHistoryScope('all')}
                         className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                           historyScope === 'all'
                             ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-sm'
                             : 'text-stone-500 hover:text-stone-700 dark:hover:text-zinc-200'
                         }`}
                       >
                         {t('reports.history.scopeAll', { defaultValue: 'All history' })}
                       </button>
                       <button
                         type="button"
                         onClick={() => setHistoryScope('period')}
                         className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wide transition-all ${
                           historyScope === 'period'
                             ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 shadow-sm'
                             : 'text-stone-500 hover:text-stone-700 dark:hover:text-zinc-200'
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
                         className="p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/40 border border-stone-100 dark:border-zinc-800 flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-stone-400">
                            <Calendar size={12} />
                            {format(new Date(history.createdAt), 'PPpp', { locale: getDateLocale(t('common.locale')) })}
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-mintcom-green/10 text-mintcom-green text-[10px] font-black uppercase tracking-wider">
                            <Info size={10} />
                            {t('reports.history.updatedLabel', { defaultValue: 'Updated' })}
                          </div>
                        </div>

                        {history.name &&
                          !selectedHistoryItem.name
                            .toLowerCase()
                            .includes(history.name.toLowerCase()) && (
                          <div className="text-sm font-bold text-stone-900 dark:text-zinc-100">
                            {history.name}
                          </div>
                        )}

                        {(history.changedByName || history.changedById) && (
                          <div className="px-3 py-2 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-zinc-800 text-xs font-bold text-stone-500 dark:text-zinc-400">
                            {t('reports.history.changedBy', {
                              defaultValue: 'Changed by {{name}}',
                              name: history.changedByName || history.changedById,
                            })}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-3 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-zinc-800 px-3 py-2">
                          <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">
                            {t('reports.history.fieldLabel', { defaultValue: 'Changed field' })}
                          </p>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                            <Info size={10} />
                            {getHistoryFieldLabel(history.field)}
                          </div>
                        </div>

                        <div className="flex items-center justify-center gap-4 py-2">
                          <div className="min-w-0 flex-1 text-center">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
                              {t('reports.history.from', { defaultValue: 'Old value' })}
                            </p>
                            <div className={['price', 'cost'].includes(history.field || 'price') ? 'text-lg font-bold text-stone-500 line-through decoration-mintcom-red/40' : 'flex justify-center'}>
                              {renderHistoryValue(history, 'old')}
                            </div>
                          </div>
                          <ChevronRight className="text-stone-300" />
                          <div className="min-w-0 flex-1 text-center">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">
                              {t('reports.history.to', { defaultValue: 'New value' })}
                            </p>
                            <div className={['price', 'cost'].includes(history.field || 'price') ? 'text-xl font-black text-stone-900 dark:text-zinc-100' : 'flex justify-center'}>
                              {renderHistoryValue(history, 'new')}
                            </div>
                          </div>
                        </div>

                        {history.reason && (
                          <div className="mt-2 p-3 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-zinc-800">
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">
                              {t('reports.history.reason', { defaultValue: 'Reason' })}
                            </p>
                            <p className="text-sm font-medium text-stone-700 dark:text-zinc-300 italic">"{history.reason}"</p>
                          </div>
                        )}
                      </div>
                     )) : (
                       <div className="py-10 text-center">
                         <p className="text-sm font-medium text-stone-500 dark:text-zinc-400">
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
                 <div className="px-6 py-5 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
                   <p className="text-xs font-bold text-stone-500 max-w-[280px]">
                     {t('reports.history.disclaimer', {
                       defaultValue: 'History helps explain reporting changes when item or add-on details are updated over time.',
                     })}
                   </p>
                   <button
                     onClick={() => setSelectedHistoryItem(null)}
                     className="px-6 py-2.5 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-105 transition-all"
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
            <div className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsBreakdownModalOpen(false)}
                className="absolute inset-0"
              />
              <motion.div
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                className="relative w-full max-w-4xl bg-white dark:bg-zinc-900/60 rounded-t-[32px] sm:rounded-[32px] shadow-md overflow-hidden border border-stone-100 dark:border-zinc-800 flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="px-8 py-6 border-b border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shadow-sm">
                      <LayoutGrid size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                        {selectedCategory?.name}
                      </h3>
                      <p className="text-xs text-stone-500 mt-1">
                        {t('orders.reports.items.breakdownTitle', { count: filteredBreakdown.length })}
                      </p>
                    </div>
                  </div>
                  <ModalCloseButton onClose={() => setIsBreakdownModalOpen(false)} />
                </div>

                {/* Filter Bar */}
                <div className="px-8 py-4 bg-white dark:bg-zinc-900/60 border-b border-stone-100 dark:border-zinc-800">
                  <div className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                    <input maxLength={255}
                      type="text"
                      placeholder={t('orders.reports.items.searchPlaceholder', { type: t('orders.reports.items.types.items') })}
                      value={breakdownSearchQuery}
                      onChange={(e) => setBreakdownSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-11 py-3 rounded-xl bg-stone-50 dark:bg-black/20 border border-stone-100 dark:border-zinc-800 text-sm font-medium text-stone-900 dark:text-zinc-100 placeholder-stone-400 focus:outline-none transition-all focus:ring-2 focus:ring-mintcom-green/20"
                    />
                    {breakdownSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBreakdownSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 transition-colors"
                      >
                        <X size={12} strokeWidth={2.75} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Table Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-stone-200 dark:scrollbar-thumb-white/10">
                  <table className="w-full">
                    <thead className="bg-stone-50/50 dark:bg-zinc-800/40 sticky top-0 z-10 backdrop-blur-md">
                      <tr className="border-b border-stone-100 dark:border-zinc-800">
                        <th className="px-8 py-4 text-start label-strong font-sans">{t('orders.reports.items.productName')}</th>
                        <th className="px-8 py-4 text-center label-strong font-sans">{t('orders.reports.items.unitsSold')}</th>
                        <th className="px-8 py-4 text-center label-strong font-sans">{t('orders.reports.items.grossRevenue')}</th>
                        <th className="px-8 py-4 text-center label-strong font-sans">{t('orders.reports.items.refundQty')}</th>
                        <th className="px-8 py-4 text-center label-strong font-sans">{t('orders.reports.items.refunds')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                      {isFetchingBreakdown ? (
                        [...Array(5)].map((_, i) => (
                          <tr key={i} className="animate-pulse">
                            <td className="px-8 py-6"><div className="h-4 bg-stone-100 dark:bg-zinc-800 rounded w-2/3" /></td>
                            <td className="px-8 py-6"><div className="h-4 bg-stone-100 dark:bg-zinc-800 rounded w-1/3 ml-auto" /></td>
                            <td className="px-8 py-6"><div className="h-4 bg-stone-100 dark:bg-zinc-800 rounded w-1/3 ml-auto" /></td>
                            <td className="px-8 py-6"><div className="h-4 bg-stone-100 dark:bg-zinc-800 rounded w-1/3 ml-auto" /></td>
                            <td className="px-8 py-6"><div className="h-4 bg-stone-100 dark:bg-zinc-800 rounded w-1/3 ml-auto" /></td>
                          </tr>
                        ))
                      ) : filteredBreakdown.length > 0 ? (
                        filteredBreakdown.map((item, idx) => (
                          <tr key={idx} className="group hover:bg-stone-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="px-8 py-5 text-start">
                              <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-lg bg-stone-100 dark:bg-zinc-800 flex items-center justify-center font-black text-[10px] text-stone-400 border border-stone-100 dark:border-zinc-800">
                                  <StatValue value={idx + 1} isInteger={true} className="text-[10px]" />
                                </div>
                                <span className="font-bold text-stone-900 dark:text-zinc-100 text-sm">{stripNameMarkers(item.itemName || item.name || '') || t('common.unknown')}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5 text-center font-bold text-stone-700 dark:text-zinc-300">
                               <StatValue
                                value={item.quantity}
                                isInteger={true}
                                className="text-sm"
                                containerClassName="justify-center w-full"
                              />
                            </td>
                            <td className="px-8 py-5 text-center font-bold text-mintcom-green">
                              {formatCurrency((item.totalSales || item.revenue) || 0, 'center')}
                            </td>
                            <td className="px-8 py-5 text-center font-bold text-stone-700 dark:text-zinc-300">
                              <StatValue 
                                value={item.refundQuantity || 0} 
                                isInteger={true}
                                className={`text-sm ${(item.refundQuantity || 0) > 0 ? 'text-paymint-red' : ''}`}
                                containerClassName="justify-center w-full"
                              />
                            </td>
                            <td className={`px-8 py-5 text-center font-bold ${(item.totalRefunds || 0) > 0 ? 'text-paymint-red' : 'text-stone-400'}`}>
                              {formatCurrency(item.totalRefunds || 0, 'center')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-20 text-center">
                            <AnalyticsEmptyState
                              icon={ShoppingBag}
                              title={t('orders.reports.items.noData')}
                              description={t('orders.reports.items.noDataDesc')}
                              compact
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-stone-100 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-800/40 flex items-center justify-between gap-6">
                  <div className="flex items-center gap-6 sm:gap-8 min-w-0">
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-zinc-400">
                        {t('orders.reports.items.totalItems')}
                      </p>
                      <StatValue
                        value={filteredBreakdown.reduce((acc, curr) => acc + curr.quantity, 0)}
                        isInteger={true}
                        className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="w-px h-10 bg-stone-200 dark:bg-zinc-800" />
                    <div className="flex flex-col gap-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-stone-500 dark:text-zinc-400">
                        {t('orders.reports.items.totalRevenue')}
                      </p>
                      <StatValue
                        value={filteredBreakdown.reduce((acc, curr) => acc + (curr.totalSales || curr.revenue || 0), 0)}
                        currency={currencySymbol}
                        className="text-xl sm:text-2xl font-bold text-mintcom-green"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setIsBreakdownModalOpen(false)}
                    className="px-8 py-3 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:scale-105 transition-all shadow-lg active:scale-95 shrink-0"
                  >
                    {t('common.done')}
                  </button>
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

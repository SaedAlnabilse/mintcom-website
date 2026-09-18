import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Percent, DollarSign, Trash2, Edit2, Tag, ShieldAlert, Grid3X3, List, ArrowUpDown, RotateCcw } from 'lucide-react';
import { BiIcon, biIcon } from '../../components/ui/BiIcon';
import api from '../../config/api';
import { useCurrency } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { DiscountFormModal } from '../../components/forms/DiscountFormModal';
import { EmptyState, SearchInput, SelectInput, Pagination, PageHeader, Badge } from '../../components/ui';
import { StatValue } from '../../components/ui/StatValue';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useAuth } from '../../context/AuthContext';
import { formatInputPlaceholder } from '../../utils/textCase';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface Discount {
  id: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  percentage: number;
  adminOnly: boolean;
  createdAt?: string;
}

type ViewMode = 'grid' | 'list';
type SortKey = 'name' | 'value' | 'type' | 'adminOnly' | 'status';
type StatusFilterValue = 'ALL' | 'ACTIVE' | 'INACTIVE';

export function DiscountsPage() {
  const { t } = useTranslation();
  const location = useLocation();
    const { currentEstablishment } = useAuth();
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });
  usePermissionGuard(['manage_discounts']);
  const { currencySymbol } = useCurrency();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilterValue>('ACTIVE');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
  const ITEMS_PER_PAGE = 10;
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
    confirmText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortConfig, filterStatus]);

  // `silent` skips the blocking loading state — used for realtime background
  // refreshes so the busy overlay doesn't flash on every incoming event.
  const fetchDiscounts = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const response = await api.get('/app-settings/discounts', {
        params: { includeInactive: true },
      });
      const mappedDiscounts = (response.data || []).map((d: Record<string, any>) => ({
        id: d.id,
        name: d.name,
        type: 'percentage' as const,
        // Stored as a whole percent already — no scaling.
        value: d.percentage,
        percentage: d.percentage,
        adminOnly: d.adminOnly,
        isActive: d.isActive !== false,
        createdAt: d.createdAt,
      }));
      setDiscounts(mappedDiscounts);
    } catch {
      toast.error(t('discounts.messages.loadFailed'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onRefresh((eventType) => {
      if (eventType === DataChangeEventTypes.SETTINGS_UPDATED) {
        // Background refresh: don't block the UI for realtime events.
        fetchDiscounts(true);
      }
    });

    return unsubscribe;
  }, [onRefresh, currentEstablishment?.id]);

  const handleSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredDiscounts = useMemo(() => {
    const result = (Array.isArray(discounts) ? discounts : []).filter(discount => {
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' ? discount.isActive : !discount.isActive);

      if (!matchesStatus) return false;
      if (!normalizedSearchQuery) return true;
      return discount.name.toLowerCase().includes(normalizedSearchQuery);
    });

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = sortConfig.key === 'status' ? (a.isActive ? 1 : 0) : a[sortConfig.key];
        const bValue = sortConfig.key === 'status' ? (b.isActive ? 1 : 0) : b[sortConfig.key];

        // Handle string comparison
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        // Handle boolean comparison
        if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
          if (aValue === bValue) return 0;
          return sortConfig.direction === 'asc'
            ? (aValue ? 1 : -1)
            : (aValue ? -1 : 1);
        }

        // Handle number comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [discounts, normalizedSearchQuery, sortConfig, filterStatus]);
  const hasDiscountFilters = filterStatus !== 'ALL';
  const discountsEmptyTitle = !normalizedSearchQuery && hasDiscountFilters
    ? t('common.noFilteredResults')
    : t('discounts.messages.noResults', 'No results found');
  const discountsEmptyDescription = !normalizedSearchQuery && hasDiscountFilters
    ? t('common.noFilteredResultsDesc')
    : t('discounts.messages.noResultsDesc', { query: searchQuery.trim(), defaultValue: 'No discounts matching "{{query}}"' });
  const totalPages = Math.ceil((Array.isArray(filteredDiscounts) ? filteredDiscounts : []).length / ITEMS_PER_PAGE);

  const paginatedDiscounts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (Array.isArray(filteredDiscounts) ? filteredDiscounts : []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDiscounts, currentPage]);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setShowModal(true);
  };

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean } | null;
    if (state?.openCreateModal && !isLoading) {
      openCreateModal();
      window.history.replaceState({}, document.title);
    }
  }, [location.state, isLoading]);

  const moveCreateViewToActive = () => {
    if (filterStatus === 'INACTIVE') {
      setFilterStatus('ACTIVE');
      setCurrentPage(1);
    }
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setShowModal(true);
  };

  const onSubmit = async (name: string, percentage: number, adminOnly: boolean) => {
    // Check for duplicates (same name or same percentage)
    const normalizedName = name.trim().toLowerCase();
    const isDuplicate = discounts.some(d => {
      if (editingDiscount && d.id === editingDiscount.id) return false;
      return d.name.toLowerCase() === normalizedName || d.percentage === percentage;
    });

    if (isDuplicate) {
      setConfirmConfig({
        isOpen: true,
        title: t('common.warning'),
        message: t('discounts.messages.duplicate'),
        type: 'warning',
        confirmText: t('common.ok'),
        showCancel: false,
        onConfirm: () => { },
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        name,
        percentage,
        adminOnly,
      };

      if (editingDiscount) {
        await api.put(`/app-settings/discounts/${editingDiscount.id}`, payload);
        toast.success(t('common.success'));
      } else {
        await api.post('/app-settings/discounts', payload);
        toast.success(t('common.success'));
        moveCreateViewToActive();
      }

      setShowModal(false);
      fetchDiscounts();
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (discountId: string, name: string) => {
    setShowModal(false);
    setEditingDiscount(null);
    // Resolve whether removing this discount permanently deletes it (unused) or
    // deactivates it (used by historical orders) so the dialog matches.
    let willHardDelete = false;
    try {
      const { data } = await api.get(`/app-settings/discounts/${discountId}/delete-impact`);
      willHardDelete = Boolean(data?.hardDeleted);
    } catch {
      willHardDelete = false;
    }
    setConfirmConfig({
      isOpen: true,
      title: willHardDelete ? t('discounts.confirm.hardDeleteTitle') : t('discounts.confirm.deleteTitle'),
      message: willHardDelete
        ? t('discounts.confirm.hardDeleteMessage', { name })
        : t('discounts.confirm.deleteMessage', { name }),
      type: 'danger',
      confirmText: willHardDelete ? t('common.delete') : t('common.deactivate'),
      onConfirm: async () => {
        try {
          const response = await api.delete(`/app-settings/discounts/${discountId}`);
          // Response flag is the source of truth; the pre-check's
          // willHardDelete is stale the moment history lands between calls.
          const deleted = response.data as { hardDeleted?: boolean } | undefined;
          const wasHardDeleted =
            deleted?.hardDeleted === true ||
            (deleted?.hardDeleted !== false && willHardDelete);
          toast.success(
            wasHardDeleted
              ? t('discounts.messages.deleted', { defaultValue: 'Discount deleted' })
              : t('discounts.messages.deactivated', { defaultValue: 'Discount deactivated — historical orders keep it' }),
          );
          fetchDiscounts();
        } catch {
          toast.error(t('common.error'));
        }
      }
    });
  };

  const reactivateDiscount = async (discountId: string) => {
    try {
      await api.put(`/app-settings/discounts/${discountId}`, { isActive: true });
      toast.success(t('discounts.messages.reactivated', { defaultValue: 'Discount reactivated' }));
      setShowModal(false);
      fetchDiscounts();
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('common.error'));
    }
  };

  const handleReactivate = (discount: Discount) => {
    setConfirmConfig({
      isOpen: true,
      title: t('common.reactivate', { defaultValue: 'Reactivate' }),
      message: t('discounts.confirm.reactivateMessage', {
        name: discount.name,
        defaultValue: `Reactivate "${discount.name}" so it can be used in new sales again? Historical discounts on old receipts stay unchanged.`,
      }),
      type: 'success',
      confirmText: t('common.reactivate', { defaultValue: 'Reactivate' }),
      onConfirm: async () => {
        await reactivateDiscount(discount.id);
      },
    });
  };

  const formatValue = (discount: Discount) => {
    if (discount.type === 'percentage') {
      return `${discount.value.toLocaleString(t('common.locale'))}%`;
    }
    return discount.value.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + currencySymbol;
  };

  const stats = useMemo(() => {
    return {
      total: discounts.length,
      active: discounts.filter(d => d.isActive).length,
      adminOnly: discounts.filter(d => d.adminOnly).length,
    };
  }, [discounts]);

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-screen blocker while a user-triggered load is in flight —
          realtime refreshes stay silent. */}
      <BusyOverlay visible={isLoading} />
      {/* Header */}
      <PageHeader
          title={t('discounts.title')}
          subtitle={
              <>
                  <span>{t('discounts.subtitle')}</span>
                  {currentEstablishment?.name && (
                      <Badge>{currentEstablishment.name}</Badge>
                  )}
              </>
          }
          actions={
              <>
                  <button
                      onClick={openCreateModal}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mintcom-green text-black font-semibold text-sm hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors"
                  >
                      <Plus size={18} strokeWidth={2.5} />
                      <span>{t('discounts.newDiscount')}</span>
                  </button>
              </>
          }
      />

      {/* Stats Cards */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 scrollbar-none snap-x snap-mandatory">
        {[
          { label: t('discounts.allDiscounts', 'All Discounts'), value: stats.total, icon: biIcon('bi-percent'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
          { label: t('common.active', 'Active'), value: stats.active, icon: biIcon('bi-check-circle'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
          { label: t('discounts.form.managerOnly', 'Manager Only'), value: stats.adminOnly, icon: biIcon('bi-shield-lock'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-[160px] sm:w-auto snap-start group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300`}>
                <stat.icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">{stat.label}</p>
                <div className="flex flex-col">
                  <StatValue value={stat.value} isInteger={true} className="text-2xl" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={formatInputPlaceholder(t('discounts.searchPlaceholder', 'Search discounts'), t('common.locale'))}
          />        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-40">
            <SelectInput
              value={filterStatus === 'ALL' ? null : filterStatus}
              onChange={(value) => setFilterStatus((value as StatusFilterValue) || 'ALL')}
              options={[
                { label: t('common.active', 'Active'), value: 'ACTIVE' },
                { label: t('common.inactive', 'Inactive'), value: 'INACTIVE' },
              ]}
              allOptionLabel={t('common.allStatuses', 'All Statuses')}
              placeholder={t('common.allStatuses', 'All Statuses')}
              searchable={false}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-50 dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-800 p-1 h-[44px]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-mintcom-green shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              title={t('common.view')}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-mintcom-green shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
              title={t('common.view')}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Discounts Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-mintcom-green/30 border-t-mintcom-green rounded-full animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={t('discounts.messages.emptyTitle', 'No discounts created yet')}
          description={t('discounts.messages.emptySubtitle', 'Create your first discount to start offering special deals to your customers.')}
          action={
            <button
              onClick={() => {
                setEditingDiscount(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-mintcom-green text-black rounded-lg font-semibold text-sm hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors"
            >
              <Plus size={18} strokeWidth={2.5} />
              {t('discounts.newDiscount')}
            </button>
          }
        />
      ) : filteredDiscounts.length === 0 ? (
        <EmptyState
          icon={Tag}
          title={discountsEmptyTitle}
          description={discountsEmptyDescription}
        />
      ) : (
        <div className="space-y-8">
          {viewMode === 'grid' ? (
            /* Grid View */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedDiscounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="group relative bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-mintcom-green/0 via-transparent to-mintcom-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${discount.type === 'percentage' ? 'bg-mintcom-green/10 text-emerald-700 dark:text-mintcom-green' : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                        {discount.type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                      </div>

                      <div className="flex gap-2 transition-all translate-y-0">
                        <button
                          onClick={() => openEditModal(discount)}
                          className="p-2 bg-stone-50 dark:bg-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg text-stone-600 dark:text-zinc-100 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        {discount.isActive ? (
                          <button
                            onClick={() => handleDelete(discount.id, discount.name)}
                            className="p-2 bg-stone-50 dark:bg-zinc-800 hover:bg-mintcom-red/10 hover:text-mintcom-red rounded-lg transition-colors text-stone-600 dark:text-zinc-100"
                            title={t('common.deactivate')}
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactivate(discount)}
                            className="p-2 bg-stone-50 dark:bg-zinc-800 hover:bg-mintcom-green/10 hover:text-mintcom-green rounded-lg transition-colors text-stone-600 dark:text-zinc-100"
                            title={t('common.reactivate', { defaultValue: 'Reactivate' })}
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-stone-900 dark:text-zinc-100 mb-1 truncate group-hover:text-mintcom-green transition-colors" title={discount.name}>{discount.name}</h3>
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <p className="text-2xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">{formatValue(discount)}</p>
                        <Badge tone={discount.isActive ? 'green' : 'red'}>
                          {discount.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-stone-100 dark:border-zinc-800">
                        {discount.adminOnly ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 text-xs text-amber-700 dark:text-yellow-500 font-bold tracking-wider">
                            {t('discounts.form.managerOnly')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs text-stone-500 font-bold tracking-wider">
                            {t('common.all')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredDiscounts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                className="mt-6"
              />
            </>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-stone-50 dark:bg-zinc-800/40 border-b border-stone-100 dark:border-zinc-800">
                    <tr>
                      <th
                        className="px-6 py-4 text-start label-strong font-sans cursor-pointer hover:text-mintcom-green transition-colors whitespace-nowrap"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          {t('common.name')}
                          {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-end label-strong font-sans cursor-pointer hover:text-mintcom-green transition-colors whitespace-nowrap"
                        onClick={() => handleSort('value')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {t('products.table.price')}
                          {sortConfig?.key === 'value' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-center label-strong font-sans cursor-pointer hover:text-mintcom-green transition-colors whitespace-nowrap"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {t('common.status.label', 'Status')}
                          {sortConfig?.key === 'status' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-center label-strong font-sans cursor-pointer hover:text-mintcom-green transition-colors whitespace-nowrap"
                        onClick={() => handleSort('adminOnly')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {t('staff.form.accessLabel')}
                          {sortConfig?.key === 'adminOnly' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                    {paginatedDiscounts.map((discount) => (
                      <tr
                        key={discount.id}
                        className="group hover:bg-stone-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                          <td className="px-6 py-4 text-start">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shrink-0 ${discount.type === 'percentage' ? 'bg-mintcom-green/10 text-emerald-700 dark:text-mintcom-green' : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                                {discount.type === 'percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
                              </div>
                              <div>
                                <p className="font-bold text-stone-900 dark:text-zinc-100 text-sm">{discount.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-end">
                            <span className="text-sm sm:text-base font-bold text-stone-900 dark:text-zinc-100">{formatValue(discount)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge tone={discount.isActive ? 'green' : 'red'}>
                              {discount.isActive ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {discount.adminOnly ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 text-xs text-amber-700 dark:text-yellow-500 font-bold tracking-wide">
                                <ShieldAlert size={10} />
                                {t('discounts.form.managerOnly')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 text-xs text-stone-500 font-bold tracking-wide">
                                {t('common.all')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-end">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditModal(discount)}
                                className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 text-stone-400 hover:text-stone-900 dark:hover:text-zinc-100 transition-all shadow-sm active:scale-90"
                                title={t('common.edit')}
                              >
                                <Edit2 size={16} />
                              </button>
                              {discount.isActive ? (
                                <button
                                  onClick={() => handleDelete(discount.id, discount.name)}
                                  className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 text-mintcom-red/60 hover:text-mintcom-red hover:bg-mintcom-red/5 transition-all shadow-sm active:scale-90"
                                  title={t('common.deactivate')}
                                >
                                  <Trash2 size={16} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(discount)}
                                  className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-stone-100 dark:border-zinc-800 text-mintcom-green/70 hover:text-mintcom-green hover:bg-mintcom-green/10 transition-all shadow-sm active:scale-90"
                                  title={t('common.reactivate', { defaultValue: 'Reactivate' })}
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredDiscounts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                variant="footer"
              />
            </div>
          )}
        </div>
      )}

      {/* Discount Modal */}
      <DiscountFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        onDelete={editingDiscount?.isActive ? () => handleDelete(editingDiscount.id, editingDiscount.name) : undefined}
        onReactivate={editingDiscount && !editingDiscount.isActive ? reactivateDiscount : undefined}
        initialData={editingDiscount}
        isSubmitting={isSubmitting}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel}
      />
    </div>
  );
}








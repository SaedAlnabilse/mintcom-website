import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Percent, DollarSign, Trash2, Edit2, Tag, ShieldAlert, Award, Grid3X3, List, ArrowUpDown } from 'lucide-react';
import api from '../../config/api';
import { useCurrency } from '../../context/CurrencyContext';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { DiscountFormModal } from '../../components/forms/DiscountFormModal';
import { SearchInput, Pagination } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useAuth } from '../../context/AuthContext';

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
type SortKey = 'name' | 'value' | 'type' | 'adminOnly';

export function DiscountsPage() {
  const { t } = useTranslation();
    const { currentEstablishment } = useAuth();
  usePermissionGuard(['manage_discounts']);
  const { currencySymbol } = useCurrency();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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
  }, [searchQuery, sortConfig]);

  const fetchDiscounts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/app-settings/discounts');
      const mappedDiscounts = (response.data || []).map((d: Record<string, any>) => ({
        id: d.id,
        name: d.name,
        type: 'percentage' as const,
        value: d.percentage * 100,
        percentage: d.percentage,
        adminOnly: d.adminOnly,
        isActive: true,
        createdAt: d.createdAt,
      }));
      setDiscounts(mappedDiscounts);
    } catch {
      toast.error(t('discounts.messages.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

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
      if (!normalizedSearchQuery) return true;
      return discount.name.toLowerCase().includes(normalizedSearchQuery);
    });

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

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
  }, [discounts, normalizedSearchQuery, sortConfig]);
  const totalPages = Math.ceil((Array.isArray(filteredDiscounts) ? filteredDiscounts : []).length / ITEMS_PER_PAGE);

  const paginatedDiscounts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (Array.isArray(filteredDiscounts) ? filteredDiscounts : []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDiscounts, currentPage]);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setShowModal(true);
  };

  const openEditModal = (discount: Discount) => {
    setEditingDiscount(discount);
    setShowModal(true);
  };

  const onSubmit = async (name: string, percentage: number, adminOnly: boolean) => {
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
      }

      setShowModal(false);
      fetchDiscounts();
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async (discountId: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: t('discounts.confirm.deleteTitle'),
      message: t('discounts.confirm.deleteMessage', { name }),
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/app-settings/discounts/${discountId}`);
          toast.success(t('common.success'));
          fetchDiscounts();
        } catch {
          toast.error(t('common.error'));
        }
      }
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
    <div className="max-w-7xl mx-auto space-y-8 pb-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('discounts.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('discounts.subtitle')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green label-strong font-outfit border border-paymint-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>{t('discounts.newDiscount')}</span>
          </button>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={t('common.search')}
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-1 h-[44px]">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            title={t('common.view')}
          >
            <Grid3X3 size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
            title={t('common.view')}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      {!isLoading && filteredDiscounts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="group relative bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 capitalize truncate">{t('common.all')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight mt-1">{stats.total.toLocaleString(t('common.locale'))}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center relative z-10 transition-transform">
              <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          <div className="group relative bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] rounded-2xl p-4 sm:p-5 flex items-center justify-between transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl opacity-0 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 capitalize truncate">{t('discounts.form.managerOnly')}</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-yellow-400 tracking-tight mt-1">{stats.adminOnly.toLocaleString(t('common.locale'))}</p>
            </div>
            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center relative z-10 transition-transform">
              <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      )}

      {/* Discounts Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
        </div>
      ) : discounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
            <Tag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('discounts.messages.emptyTitle', 'No discounts created yet')}</h3>
          <p className="text-sm font-bold text-gray-500 max-w-sm mb-6">
            {t('discounts.messages.emptySubtitle', 'Create your first discount to start offering special deals to your customers.')}
          </p>
          <button
            onClick={() => {
              setEditingDiscount(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold text-sm hover:bg-[#68B390] hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <Plus size={18} />
            {t('discounts.newDiscount')}
          </button>
        </div>
      ) : filteredDiscounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
            <Tag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('discounts.messages.noResults', 'No results found')}</h3>
          <p className="text-sm font-bold text-gray-500 max-w-xs">
            {t('discounts.messages.noResultsDesc', { query: searchQuery.trim(), defaultValue: 'No discounts matching "{{query}}"' })}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {viewMode === 'grid' ? (
            /* Grid View */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedDiscounts.map((discount) => (
                  <div
                    key={discount.id}
                    className="group relative bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-paymint-green/0 via-transparent to-paymint-green/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${discount.type === 'percentage' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                        {discount.type === 'percentage' ? <Percent size={20} /> : <DollarSign size={20} />}
                      </div>

                      <div className="flex gap-2 transition-all translate-y-0">
                        <button
                          onClick={() => openEditModal(discount)}
                          className="p-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-white transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(discount.id, discount.name)}
                          className="p-2 bg-gray-50 dark:bg-white/5 hover:bg-paymint-red/10 hover:text-paymint-red rounded-lg transition-colors text-gray-600 dark:text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 truncate group-hover:text-paymint-green transition-colors" title={discount.name}>{discount.name}</h3>
                      <p className="text-3xl font-black text-paymint-green mb-4 tracking-tight">{formatValue(discount)} <span className="text-xs font-bold text-gray-500 tracking-widest ml-1">{t('common.active')}</span></p>

                      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
                        {discount.adminOnly ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 text-xs text-amber-700 dark:text-yellow-500 font-bold tracking-wider">
                            {t('discounts.form.managerOnly')}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-500 font-bold tracking-wider">
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
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                    <tr>
                      <th
                        className="px-6 py-4 text-left label-strong font-outfit cursor-pointer hover:text-paymint-green transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          {t('common.search')}
                          {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-center label-strong font-outfit cursor-pointer hover:text-paymint-green transition-colors"
                        onClick={() => handleSort('value')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {t('products.table.price')}
                          {sortConfig?.key === 'value' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                      </th>
                      <th
                        className="px-6 py-4 text-center label-strong font-outfit cursor-pointer hover:text-paymint-green transition-colors"
                        onClick={() => handleSort('adminOnly')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {t('staff.form.accessLabel')}
                          {sortConfig?.key === 'adminOnly' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-center label-strong font-outfit">{t('orders.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {paginatedDiscounts.map((discount) => (
                      <tr
                        key={discount.id}
                        className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                          <td className="px-6 py-4 text-left">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${discount.type === 'percentage' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                                {discount.type === 'percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white text-sm">{discount.name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-lg font-black text-paymint-green">{formatValue(discount)}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {discount.adminOnly ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-yellow-500/10 border border-amber-200 dark:border-yellow-500/20 text-xs text-amber-700 dark:text-yellow-500 font-bold tracking-wide">
                                <ShieldAlert size={10} />
                                {t('discounts.form.managerOnly')}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-500 font-bold tracking-wide">
                                {t('common.all')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(discount)}
                                className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-90"
                                title={t('common.edit')}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(discount.id, discount.name)}
                                className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 text-paymint-red/60 hover:text-paymint-red hover:bg-paymint-red/5 transition-all shadow-sm active:scale-90"
                                title={t('common.delete')}
                              >
                                <Trash2 size={16} />
                              </button>
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
        onDelete={editingDiscount ? () => handleDelete(editingDiscount.id, editingDiscount.name) : undefined}
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







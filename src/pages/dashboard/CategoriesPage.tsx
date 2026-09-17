import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCurrency } from '../../context/CurrencyContext';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import {
  Plus,
  Package,
  Layers,
  ChevronRight,
  Edit2,
  Trash2,
  Tag,
  AlertTriangle,
  Grid,
  List,
  Upload
} from 'lucide-react';
import { biIcon } from '../../components/ui/BiIcon';
import api from '../../config/api';
import { fetchAllPages } from '../../utils/fetchAllPages';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CategoryFormModal, ICON_MAP } from '../../components/forms/CategoryFormModal';
import { CsvImportModal, type CsvColumn, type ImportResult } from '../../components/CsvImportModal';
import { EmptyState, SearchInput, SelectInput, Pagination, Modal, ModalHeader, ModalBody, PageHeader, Badge } from '../../components/ui';
import { StatValue } from '../../components/ui/StatValue';
import { ThumbnailImage } from '../../components/OptimizedImage';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { formatInputPlaceholder } from '../../utils/textCase';
import { withExcelBom } from '../../utils/csvBom';
import { exportTable } from '../../utils/export';
import type { ExportFormat } from '../../utils/export';
import { ExportMenu } from '../../components/ExportMenu';
import { BusyOverlay } from '../../components/BusyOverlay';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';

interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  icon?: string;
  color?: string;
  isActive?: boolean;
  deletedAt?: string | null;
  deactivatedAt?: string | null;
  _count?: { items: number };
}

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  image?: string;
  availableStock?: number;
  description?: string;
}

type StatusFilterValue = 'ALL' | 'ACTIVE' | 'INACTIVE';

const isArchivedRecord = (record: { deletedAt?: string | null; deactivatedAt?: string | null; isActive?: boolean }) =>
  !!record?.deletedAt || !!record?.deactivatedAt || record?.isActive === false;

const sortArchivedLastByNewest = <T extends { id?: string; deletedAt?: string | null; deactivatedAt?: string | null; isActive?: boolean }>(
  records: T[],
) =>
  [...records].sort((a, b) => {
    const aArchived = isArchivedRecord(a);
    const bArchived = isArchivedRecord(b);

    if (aArchived !== bArchived) {
      return aArchived ? 1 : -1;
    }

    return (b.id || '').localeCompare(a.id || '');
  });

export function CategoriesPage() {
  const { t } = useTranslation();
  const { currentEstablishment } = useAuth();
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });
  usePermissionGuard(['manage_inventory']);
  const { currencySymbol } = useCurrency();
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showModal, setShowModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteBlockedCategory, setDeleteBlockedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilterValue>('ACTIVE');
  const [recentlyArchivedCategoryIds, setRecentlyArchivedCategoryIds] = useState<Set<string>>(() => new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const ITEMS_PER_PAGE = 12;

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onSecondary?: () => void;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    secondaryText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const isCategoryActive = (category: Category) =>
    category.isActive !== false && !category.deletedAt && !category.deactivatedAt;

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean };
    if (state?.openCreateModal) {
      setEditingCategory(null);
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (silent = false, preserveCurrentOrder = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [catsRes, products] = await Promise.all([
        api.get('/api/categories', { params: { includeInactive: true } }),
        fetchAllPages<Product>(api, '/api/items', { includeInactive: true }),
      ]);
      const sortedCategories = sortArchivedLastByNewest(Array.isArray(catsRes.data) ? catsRes.data : []);
      if (preserveCurrentOrder && recentlyArchivedCategoryIds.size > 0) {
        setCategories((currentCategories) => {
          const freshById = new Map(sortedCategories.map((category) => [category.id, category]));
          const merged = currentCategories
            .map((category) => {
              const fresh = freshById.get(category.id);
              if (!fresh) return null;
              freshById.delete(category.id);
              return fresh;
            })
            .filter((category): category is Category => Boolean(category));

          return [...merged, ...Array.from(freshById.values())];
        });
      } else {
        setRecentlyArchivedCategoryIds(new Set());
        setCategories(sortedCategories);
      }
      setProducts(products);
    } catch {
      toast.error(t('categories.messages.loadFailed'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    const categoryEvents = [
      DataChangeEventTypes.CATEGORY_CREATED,
      DataChangeEventTypes.CATEGORY_UPDATED,
      DataChangeEventTypes.CATEGORY_DELETED,
      DataChangeEventTypes.ITEM_CREATED,
      DataChangeEventTypes.ITEM_UPDATED,
      DataChangeEventTypes.ITEM_DELETED,
    ];

    const unsubscribe = onRefresh((eventType) => {
      if (categoryEvents.includes(eventType as any)) {
        fetchData(true, true);
      }
    });

    return unsubscribe;
  }, [onRefresh, currentEstablishment?.id, recentlyArchivedCategoryIds]);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormError(null);
    setShowModal(true);
  };

  const moveCreateViewToActive = () => {
    if (filterStatus === 'INACTIVE') {
      setFilterStatus('ACTIVE');
      setCurrentPage(1);
    }
  };

  const categoryCsvColumns: CsvColumn[] = [
    { key: 'name', label: 'Name', required: true, type: 'string' },
  ];

  const categorySampleData = [
    { name: 'Hot Drinks' },
    { name: 'Cold Drinks' },
    { name: 'Food' },
    { name: 'Desserts' },
    { name: 'Sandwiches' },
  ];

  const detectIconFromName = (name: string): string => {
    const lower = name.toLowerCase();
    const keywords: [string[], string][] = [
      [['coffee', 'espresso', 'latte', 'cappuccino', 'mocha', 'americano', 'hot drink', 'tea'], 'coffee'],
      [['cold drink', 'juice', 'smoothie', 'soda', 'lemonade', 'milkshake', 'shake', 'drink', 'beverage'], 'cup'],
      [['cocktail', 'wine', 'beer', 'alcohol', 'spirit', 'bar', 'mojito'], 'glass-cocktail'],
      [['cake', 'pastry', 'muffin', 'cupcake', 'tart', 'pie'], 'cake'],
      [['dessert', 'sweet', 'chocolate', 'candy', 'sugar'], 'ice-cream'],
      [['bread', 'croissant', 'baguette', 'bakery', 'toast', 'waffle', 'pancake'], 'bread-slice'],
      [['cookie', 'biscuit', 'brownie', 'donut', 'doughnut'], 'cookie'],
      [['pizza'], 'pizza'],
      [['burger', 'sandwich', 'wrap', 'sub', 'panini', 'hotdog'], 'hamburger'],
      [['chicken', 'wing', 'nugget', 'poultry', 'turkey'], 'food-drumstick'],
      [['fish', 'seafood', 'shrimp', 'sushi', 'salmon', 'tuna'], 'fish'],
      [['fruit', 'apple', 'banana', 'berry', 'melon', 'mango', 'orange'], 'fruit-watermelon'],
      [['salad', 'vegetable', 'veggie', 'vegan', 'carrot', 'healthy'], 'carrot'],
      [['noodle', 'noodles', 'ramen', 'pasta', 'spaghetti', 'pho', 'udon', 'chow mein'], 'noodles'],
      [['beer', 'draft', 'ale', 'lager', 'ipa', 'cider', 'brewery', 'pint'], 'beer'],
      [['wine', 'red wine', 'white wine', 'rose', 'champagne', 'cellar', 'vintage'], 'glass-wine'],
      [['grill', 'bbq', 'barbecue', 'flame', 'spicy', 'hot', 'smoke', 'smoked'], 'fire'],
      [['food', 'meal', 'lunch', 'dinner', 'breakfast', 'main', 'entree', 'dish', 'plate', 'kitchen', 'meat', 'steak', 'rice', 'soup', 'appetizer', 'starter'], 'food'],
      [['combo', 'set', 'bundle', 'special', 'offer', 'deal', 'promo', 'value'], 'star'],
      [['gift', 'present', 'voucher', 'card'], 'gift'],
      [['shop', 'merchandise', 'merch', 'retail', 'product', 'accessory', 'item'], 'shopping'],
      [['favorite', 'popular', 'best', 'top', 'recommended', 'featured'], 'heart'],
    ];

    for (const [words, icon] of keywords) {
      if (words.some(w => lower.includes(w))) {
        return icon;
      }
    }
    return 'tag';
  };

  const handleCsvImport = useCallback(async (rows: Record<string, string>[]): Promise<ImportResult> => {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    let existingNames: Set<string>;
    let nextSortOrder: number;
    try {
      const res = await api.get('/api/categories', { params: { includeInactive: true } });
      const existing = Array.isArray(res.data) ? res.data : [];
      existingNames = new Set(existing.map((c: Category) => c.name.toLowerCase().trim()));
      const maxSort = existing.reduce((max: number, c: Category) => Math.max(max, c.sortOrder || 0), 0);
      nextSortOrder = maxSort + 1;
    } catch {
      existingNames = new Set(categories.map(c => c.name.toLowerCase().trim()));
      const maxSort = categories.reduce((max, c) => Math.max(max, c.sortOrder || 0), 0);
      nextSortOrder = maxSort + 1;
    }

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.name?.trim();

      if (!name) {
        errors.push(`Row ${i + 1}: Name is required`);
        failed++;
        continue;
      }

      if (existingNames.has(name.toLowerCase())) {
        errors.push(`Row ${i + 1}: Category "${name}" already exists, skipped`);
        failed++;
        continue;
      }

      const icon = detectIconFromName(name);

      try {
        await api.post('/api/categories', { name, icon, sortOrder: nextSortOrder });
        existingNames.add(name.toLowerCase());
        nextSortOrder++;
        success++;
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Unknown error';
        if (msg.includes('Unique constraint')) {
          errors.push(`Row ${i + 1}: Category "${name}" already exists`);
        } else {
          errors.push(`Row ${i + 1}: Failed to create "${name}" - ${msg}`);
        }
        failed++;
      }
    }

    if (success > 0) {
      fetchData(true);
    }

    return { success, failed, errors };
  }, [categories]);

  const handleExport = (format: ExportFormat) => {
    if (format !== 'csv') {
      const rows = (Array.isArray(filteredCategories) ? filteredCategories : []).map(c => ({
        name: c.name,
        description: c.description ?? '',
        items: c._count?.items ?? 0,
      }));
      if (rows.length === 0) {
        toast.error(t('dashboard.messages.noData', { defaultValue: 'No data to export' }));
        return;
      }
      return exportTable(format, {
        filename: 'categories_export',
        title: t('categories.title', { defaultValue: 'Categories' }),
        meta: currentEstablishment?.name ? [{ label: t('common.location'), value: currentEstablishment.name }] : undefined,
        columns: [
          { key: 'name', label: t('common.name', { defaultValue: 'Name' }) },
          { key: 'description', label: t('products.form.descriptionLabel') },
          { key: 'items', label: t('categories.table.items') },
        ],
        rows,
      });
    }

    // Escape a value for CSV: wrap in quotes and double any inner quotes.
    const esc = (val: unknown): string => {
      const str = val === null || val === undefined ? '' : String(val);
      if (/[",\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // "name" matches the import schema for round-trips; description/items are
    // extra reference columns the importer simply ignores.
    const headers = ['name', 'description', 'items'];
    const rows = (Array.isArray(filteredCategories) ? filteredCategories : []).map(c =>
      [esc(c.name), esc(c.description ?? ''), esc(c._count?.items ?? 0)].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');

    // UTF-8, with a BOM only on Windows so legacy Excel reads Arabic correctly
    // there while the file stays clean (no "ï»¿") elsewhere.
    const blob = new Blob([withExcelBom(csvContent)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'categories_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('categories.messages.exportDownloaded'));
  };

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return (Array.isArray(categories) ? categories : []).filter(cat => {
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE'
          ? isCategoryActive(cat) || recentlyArchivedCategoryIds.has(cat.id)
          : !isCategoryActive(cat));

      if (!normalizedSearchQuery) return matchesStatus;
      return matchesStatus && (
        cat.name.toLowerCase().includes(normalizedSearchQuery) ||
        cat.description?.toLowerCase().includes(normalizedSearchQuery)
      );
    });
  }, [categories, normalizedSearchQuery, filterStatus, recentlyArchivedCategoryIds]);
  const hasCategoryFilters = filterStatus !== 'ALL';
  const categoriesEmptyTitle = !normalizedSearchQuery && hasCategoryFilters
    ? t('common.noFilteredResults')
    : normalizedSearchQuery
      ? t('categories.messages.noResults')
      : t('categories.messages.noCategories');
  const categoriesEmptyDescription = !normalizedSearchQuery && hasCategoryFilters
    ? t('common.noFilteredResultsDesc')
    : normalizedSearchQuery
      ? t('categories.messages.noResultsDesc', { query: searchQuery.trim() })
      : t('categories.messages.noCategoriesDesc');

  const totalPages = Math.ceil((Array.isArray(filteredCategories) ? filteredCategories : []).length / ITEMS_PER_PAGE);

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (Array.isArray(filteredCategories) ? filteredCategories : []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterStatus]);

  const openEditModal = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    setFormError(null);
    setEditingCategory(category);
    setShowModal(true);
  };

  const saveCategory = async (payload: { name: string; icon: string; sortOrder: number }) => {
    if (editingCategory) {
      await api.patch(`/api/categories/${editingCategory.id}`, payload);
      toast.success(t('categories.messages.updated'));
    } else {
      await api.post('/api/categories', payload);
      toast.success(t('categories.messages.created'));
      moveCreateViewToActive();
    }
    setShowModal(false);
    fetchData();
  };

  const onSubmit = async (name: string, icon: string, sortOrder: number) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      const payload = { name, icon, sortOrder };

      if (!editingCategory) {
        const conflict = await api.get('/api/categories/name-conflicts', {
          params: { name },
        });
        const data = conflict.data;
        if (data?.activeDuplicate) {
          setFormError(`An active category named "${data.activeDuplicate.displayName}" already exists.`);
          return;
        }
        const archived = data?.archivedDuplicates?.[0];
        if (archived) {
          setConfirmConfig({
            isOpen: true,
            title: 'Archived category found',
            message: `An archived category named "${archived.displayName}" already exists. Categories cannot be reactivated, but historical reports keep the archived category as [Deleted]. Create a new category with this name?`,
            type: 'warning',
            confirmText: 'Create new category',
            onConfirm: async () => {
              setIsSubmitting(true);
              try {
                await saveCategory(payload);
              } catch (error: any) {
                setFormError(error.response?.data?.message || t('categories.messages.saveFailed'));
              } finally {
                setIsSubmitting(false);
              }
            },
          });
          return;
        }
      }

      await saveCategory(payload);
    } catch (error: any) {
      let message = error.response?.data?.message || t('categories.messages.saveFailed');
      if (message.includes('Unique constraint failed') && message.includes('name')) {
        message = t('categories.messages.exists');
      }
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const impact = await api.get(`/api/categories/${categoryId}/delete-impact`).then((res) => res.data);
      const category = categories.find((c) => c.id === categoryId) || null;

      if (impact.action === 'block') {
        setDeleteBlockedCategory(category || null);
        return;
      }

      const shouldDelete = impact.action === 'delete';

      setConfirmConfig({
        isOpen: true,
        title: shouldDelete ? 'Delete category' : t('categories.delete.title'),
        message: shouldDelete
          ? `Delete "${category?.name || 'this category'}" permanently? It is not used in reports or active products.`
          : t('categories.delete.message', { name: category?.name || 'this category' }),
        type: 'danger',
        confirmText: shouldDelete ? t('common.delete', { defaultValue: 'Delete' }) : t('common.archive'),
        onConfirm: async () => {
          try {
            const response = await api.delete(`/api/categories/${categoryId}`);
            // hardDeleted from the DELETE response is the source of truth.
            // The pre-check's shouldDelete is stale the moment history lands
            // between the impact call and this call — branching on it removes
            // rows the server actually archived. Fall back to the pre-check
            // only when the flag is absent (older API).
            const deletedCategory = response.data as Partial<Category> & { hardDeleted?: boolean } | undefined;
            const wasHardDeleted =
              deletedCategory?.hardDeleted === true ||
              (deletedCategory?.hardDeleted !== false && shouldDelete && !deletedCategory?.deletedAt && !deletedCategory?.deactivatedAt);
            if (wasHardDeleted) {
              setRecentlyArchivedCategoryIds((prev) => {
                const next = new Set(prev);
                next.delete(categoryId);
                return next;
              });
              setCategories((currentCategories) =>
                currentCategories.filter((currentCategory) => currentCategory.id !== categoryId),
              );
            } else {
              const archivedAt = new Date().toISOString();
              const archivedCategory = response.data as Partial<Category> | undefined;
              setRecentlyArchivedCategoryIds((prev) => new Set(prev).add(categoryId));
              setCategories((currentCategories) =>
                currentCategories.map((currentCategory) =>
                  currentCategory.id === categoryId
                    ? {
                        ...currentCategory,
                        ...archivedCategory,
                        deletedAt: archivedCategory?.deletedAt ?? archivedAt,
                        deactivatedAt: archivedCategory?.deactivatedAt ?? archivedAt,
                        isActive: false,
                      }
                    : currentCategory,
                ),
              );
            }
            toast.success(t('categories.messages.deleted'));
          } catch (error: any) {
            const errorMessage = error.response?.data?.message || t('categories.messages.deleteFailed');
            if (errorMessage.includes('historical records') || errorMessage.includes('used in orders')) {
              toast.error(t('categories.delete.blocked'), { duration: 6000 });
            } else {
              toast.error(errorMessage, { duration: 4000 });
            }
          }
        }
      });
    } catch (error) {
      toast.error(t('categories.messages.verifyFailed'));
    }
  };

  const stats = useMemo(() => {
    const sortedCats = [...categories].sort((a, b) => (b._count?.items || 0) - (a._count?.items || 0));
    const topCategory = sortedCats[0];
    return {
      total: categories.length,
      products: products.length,
      top: topCategory
    };
  }, [categories, products]);

  const categoryProducts = useMemo(() => {
    const targetId = viewingCategory?.id || deleteBlockedCategory?.id;
    if (!targetId) return [];
    return products.filter(p => p.categoryId === targetId);
  }, [viewingCategory, deleteBlockedCategory, products]);

  const ViewingIcon = viewingCategory ? (ICON_MAP[viewingCategory.icon || 'tag'] || Tag) : Tag;

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-screen blocker while a user-triggered load is in flight —
          background/realtime refreshes stay silent. */}
      <BusyOverlay visible={isLoading} />
      {/* Header */}
      <PageHeader
          title={t('categories.title')}
          subtitle={
              <>
                  <span>{t('categories.subtitle')}</span>
                  {currentEstablishment?.name && (
                      <Badge>{currentEstablishment.name}</Badge>
                  )}
              </>
          }
          actions={
              <>
                  <ExportMenu onExport={handleExport} formats={['xlsx', 'pdf', 'csv']} className="!px-3 sm:!px-4 !py-2.5 sm:!py-3" />
                  <button
                      onClick={() => setShowCsvImport(true)}
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm group"
                  >
                      <Upload size={18} className="group-hover:text-mintcom-green transition-colors" />
                      <span className="font-bold text-xs sm:text-sm hidden sm:inline">{t('products.importCsv')}</span>
                  </button>
                  <button
                      onClick={openCreateModal}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mintcom-green text-black font-semibold text-sm hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors"
                  >
                      <Plus size={18} strokeWidth={2.5} />
                      <span className="hidden xs:inline">{t('categories.newCategory')}</span>
                      <span className="xs:hidden">{t('common.add')}</span>
                  </button>
              </>
          }
      />

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 scrollbar-none snap-x snap-mandatory">
        {[
          { label: t('categories.stats.totalCategories'), value: stats.total, icon: biIcon('bi-grid-3x3-gap'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
          { label: t('categories.stats.totalItems'), value: stats.products, icon: biIcon('bi-box-seam'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
          { label: t('categories.stats.topCategory'), value: stats.top?.name || t('common.notAvailable'), sub: `${stats.top?._count?.items || 0} ${t('dashboard.menu.products')}`, icon: biIcon('bi-graph-up-arrow'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex-shrink-0 w-[160px] sm:w-auto snap-start group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300`}>
                <stat.icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">{stat.label}</p>
                <div className="flex flex-col">
                  {typeof stat.value === 'number' ? (
                    <StatValue value={stat.value} isInteger={true} className="text-2xl" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                      {stat.value}
                    </p>
                  )}
                  {stat.sub && (
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 truncate">{stat.sub}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={formatInputPlaceholder(t('categories.searchPlaceholder'), t('common.locale'))}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
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

          <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-mintcom-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-mintcom-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <List size={18} />
          </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-mintcom-green/30 border-t-mintcom-green rounded-full animate-spin mb-4" />
          <p className="text-xs font-black text-gray-400">{t('categories.messages.loading')}</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={categoriesEmptyTitle}
          description={categoriesEmptyDescription}
        />
      ) : (
        <div className="space-y-8">
          {viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {paginatedCategories.map((category, idx) => {
                  const IconComponent = ICON_MAP[category.icon || 'tag'] || Tag;
                  return (
                    <motion.div
                      key={category.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setViewingCategory(category)}
                      className="group relative bg-white dark:bg-[#1E293B] p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-mintcom-green/50 hover:shadow-xl transition-all cursor-pointer overflow-hidden duration-300"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-mintcom-green opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-mintcom-green/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-500 group-hover:bg-mintcom-green group-hover:text-black transition-all duration-300 shadow-sm">
                          <IconComponent size={24} />
                        </div>
                        <div className="flex gap-1">
                          {isCategoryActive(category) && (
                            <>
                              <button
                                onClick={(e) => openEditModal(e, category)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-mintcom-green transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-mintcom-red transition-colors"
                                title={t('common.archive')}
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors leading-tight truncate relative z-10">
                        {category.name}
                      </h3>

                      <div className="mt-3 relative z-10">
                        <Badge tone={isCategoryActive(category) ? 'green' : 'red'}>
                          {isCategoryActive(category) ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                        </Badge>
                      </div>

                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-gray-400 group-hover:text-mintcom-green transition-colors" />
                          <span className="dashboard-card-meta group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{t('categories.itemsCount', { count: category._count?.items || 0 })}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-mintcom-green group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredCategories.length}
                itemsPerPage={ITEMS_PER_PAGE}
                className="mt-6"
              />
            </>
          ) : (
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                    <tr>
                      <th className="px-6 py-4 text-center dashboard-card-label w-16 whitespace-nowrap">{t('categories.table.icon')}</th>
                      <th className="px-6 py-4 text-start dashboard-card-label whitespace-nowrap">{t('categories.table.name')}</th>
                      <th className="px-6 py-4 text-center dashboard-card-label whitespace-nowrap">{t('common.status.label', 'Status')}</th>
                      <th className="px-6 py-4 text-end dashboard-card-label whitespace-nowrap">{t('categories.table.items')}</th>
                      <th className="px-6 py-4 text-end dashboard-card-label w-32 whitespace-nowrap">{t('owner.locations.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {paginatedCategories.map((category) => {
                      const IconComponent = ICON_MAP[category.icon || 'tag'] || Tag;
                      return (
                        <tr
                          key={category.id}
                          onClick={() => setViewingCategory(category)}
                          className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                        >
                          <td className="px-6 py-4 text-center">
                            <div className="w-10 h-10 mx-auto rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-mintcom-green group-hover:text-black transition-colors">
                              <IconComponent size={20} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-start">
                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors">{category.name}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge tone={isCategoryActive(category) ? 'green' : 'red'}>
                              {isCategoryActive(category) ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-end">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 dashboard-card-meta">
                              <Package size={12} />
                              {category._count?.items || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-end">
                            <div className="flex items-center justify-end gap-2">
                              {isCategoryActive(category) && (
                                <>
                                  <button
                                    onClick={(e) => openEditModal(e, category)}
                                    className="p-2 text-gray-400 hover:text-mintcom-green hover:bg-mintcom-green/10 rounded-lg transition-colors"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                                    className="p-2 text-gray-400 hover:text-mintcom-red hover:bg-mintcom-red/10 rounded-lg transition-colors"
                                    title={t('common.archive')}
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
                totalItems={filteredCategories.length}
                itemsPerPage={ITEMS_PER_PAGE}
                variant="footer"
              />
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!viewingCategory}
        onClose={() => setViewingCategory(null)}
        size={categoryProducts.length === 0 ? 'sm' : 'xl'}
        className={categoryProducts.length > 1 ? 'sm:max-w-4xl' : ''}
      >
        {viewingCategory && (
          <>
            <ModalHeader
              title={viewingCategory.name}
              subtitle={t('categories.itemsCount', { count: categoryProducts.length })}
              icon={<ViewingIcon size={24} />}
              onClose={() => setViewingCategory(null)}
            />

            <ModalBody>
                  {categoryProducts.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 shadow-sm">
                        <Package size={40} strokeWidth={1.5} className="text-gray-300" />
                      </div>
                      <h3 className="dashboard-card-value mb-2">{t('products.messages.noProducts')}</h3>
                      <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto mb-6">{t('products.messages.noProductsDesc')}</p>
                      {isCategoryActive(viewingCategory) && (
                        <button
                          onClick={() => navigate(`/dashboard/${locationSlug}/products`, { state: { openCreateModal: true, categoryId: viewingCategory.id } })}
                          className="px-4 py-2.5 rounded-lg bg-mintcom-green text-black font-semibold text-sm hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors flex items-center gap-2"
                        >
                          <Plus size={18} strokeWidth={2.5} />
                          {t('common.add')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`grid grid-cols-1 ${
                      categoryProducts.length === 1 ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
                    } gap-4`}>
                      {categoryProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => navigate(`/dashboard/${locationSlug}/products`, { state: { productId: p.id, categoryId: viewingCategory.id } })}
                          className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group hover:border-mintcom-green/30 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 overflow-hidden shrink-0">
                            <ThumbnailImage
                              src={p.image || '/default_product.png'}
                              alt={p.name || 'Default Product'}
                              size={48}
                              className="rounded-lg"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                            <p className="text-sm font-bold text-mintcom-green mt-0.5">
                              {p.price.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                            </p>
                          </div>
                        </div>
                      ))}
                      {isCategoryActive(viewingCategory) && (
                        <div
                          onClick={() => navigate(`/dashboard/${locationSlug}/products`, { state: { openCreateModal: true, categoryId: viewingCategory.id } })}
                          className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-300 dark:border-white/20 rounded-xl group hover:border-mintcom-green/50 hover:bg-mintcom-green/5 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4 shadow-sm"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center shrink-0">
                             <Plus size={20} className="text-gray-400 group-hover:text-mintcom-green group-hover:scale-110 transition-all" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-600 dark:text-gray-300 group-hover:text-mintcom-green transition-colors truncate">{t('common.add')}</p>
                            <p className="text-xs font-medium text-gray-400 dark:text-white/40 mt-0.5">
                              New Product
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
            </ModalBody>
          </>
        )}
      </Modal>

      <CategoryFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        onDelete={editingCategory && isCategoryActive(editingCategory) ? () => handleDelete(editingCategory.id) : undefined}
        initialData={editingCategory}
        isSubmitting={isSubmitting}
        externalError={formError}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        secondaryText={confirmConfig.secondaryText}
        onSecondary={confirmConfig.onSecondary}
      />

      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        title={t('categories.importCategories')}
        description={t('categories.importDescription')}
        columns={categoryCsvColumns}
        sampleData={categorySampleData}
        sampleFileName="categories_sample.csv"
        onImport={handleCsvImport}
        maxRows={200}
      />

      <Modal
        isOpen={!!deleteBlockedCategory}
        onClose={() => setDeleteBlockedCategory(null)}
        size="xl"
        className="sm:max-w-4xl"
      >
        {deleteBlockedCategory && (
          <>
            <ModalHeader
              title={deleteBlockedCategory.name}
              subtitle={t('categories.itemsCount', { count: categoryProducts.length })}
              icon={(() => {
                const Icon = ICON_MAP[deleteBlockedCategory.icon || 'tag'] || Tag;
                return <Icon size={24} />;
              })()}
              onClose={() => setDeleteBlockedCategory(null)}
            />

            <ModalBody>
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                    <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {t('categories.messages.deleteBlocked')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/dashboard/${locationSlug}/products`, { state: { productId: p.id, categoryId: deleteBlockedCategory.id } })}
                        className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group hover:border-mintcom-green/30 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 overflow-hidden shrink-0">
                          <ThumbnailImage
                            src={p.image || '/default_product.png'}
                            alt={p.name || 'Default Product'}
                            size={48}
                            className="rounded-lg"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-xs font-black text-mintcom-green mt-0.5">
                            {p.price.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
            </ModalBody>
          </>
        )}
      </Modal>
    </div>
  );
}


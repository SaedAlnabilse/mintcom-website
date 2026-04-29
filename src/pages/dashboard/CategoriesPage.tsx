import { useAuth } from '../../context/AuthContext';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { useNavigate, useLocation, useOutletContext, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import {
  Plus,
  Package,
  TrendingUp,
  Layers,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Tag,
  AlertTriangle,
  Grid,
  List,
  Upload
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CategoryFormModal, ICON_MAP } from '../../components/forms/CategoryFormModal';
import { CsvImportModal, type CsvColumn, type ImportResult } from '../../components/CsvImportModal';
import { SearchInput, Pagination } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { formatInputPlaceholder } from '../../utils/textCase';

interface Category {
  id: string;
  name: string;
  description?: string;
  sortOrder: number;
  icon?: string;
  color?: string;
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

export function CategoriesPage() {
  const { t } = useTranslation();
  const { currentEstablishment } = useAuth();
  usePermissionGuard(['manage_inventory']);
  const { currencySymbol } = useCurrency();
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen } = useOutletContext<{ sidebarOpen: boolean }>();
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
  const [currentPage, setCurrentPage] = useState(1);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const ITEMS_PER_PAGE = 12;

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

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

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [catsRes, prodsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/items')
      ]);
      setCategories(catsRes.data || []);
      setProducts(prodsRes.data?.items || []);
    } catch {
      toast.error(t('categories.messages.loadFailed'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormError(null);
    setShowModal(true);
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
      [['food', 'meal', 'lunch', 'dinner', 'breakfast', 'main', 'entree', 'dish', 'plate', 'kitchen', 'grill', 'bbq', 'meat', 'steak', 'pasta', 'rice', 'soup', 'appetizer', 'starter'], 'food'],
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
      const res = await api.get('/api/categories');
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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    return (Array.isArray(categories) ? categories : []).filter(cat => {
      if (!normalizedSearchQuery) return true;
      return cat.name.toLowerCase().includes(normalizedSearchQuery) ||
        cat.description?.toLowerCase().includes(normalizedSearchQuery);
    });
  }, [categories, normalizedSearchQuery]);

  const totalPages = Math.ceil((Array.isArray(filteredCategories) ? filteredCategories : []).length / ITEMS_PER_PAGE);

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (Array.isArray(filteredCategories) ? filteredCategories : []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const openEditModal = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    setFormError(null);
    setEditingCategory(category);
    setShowModal(true);
  };

  const onSubmit = async (name: string, icon: string, sortOrder: number) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      const payload = { name, icon, sortOrder };
      if (editingCategory) {
        await api.patch(`/api/categories/${editingCategory.id}`, payload);
        toast.success(t('categories.messages.updated'));
      } else {
        await api.post('/api/categories', payload);
        toast.success(t('categories.messages.created'));
      }
      setShowModal(false);
      fetchData();
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
      const [catsRes, prodsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/items')
      ]);

      const freshCategories = catsRes.data || [];
      const freshProducts = prodsRes.data?.items || [];

      const category = freshCategories.find((c: Category) => c.id === categoryId);
      const categoryItems = freshProducts.filter((p: Product) => p.categoryId === categoryId);

      if (categoryItems.length > 0) {
        setCategories(freshCategories);
        setProducts(freshProducts);
        setDeleteBlockedCategory(category || null);
        return;
      }

      setConfirmConfig({
        isOpen: true,
        title: t('categories.delete.title'),
        message: t('categories.delete.message'),
        type: 'danger',
        onConfirm: async () => {
          try {
            await api.delete(`/api/categories/${categoryId}`);
            toast.success(t('categories.messages.deleted'));
            fetchData();
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
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('categories.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            <span>{t('categories.subtitle')}</span>
            {currentEstablishment?.name && (
              <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green label-strong font-outfit border border-paymint-green/20">
                {currentEstablishment.name}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setShowCsvImport(true)}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm group"
          >
            <Upload size={18} className="group-hover:text-paymint-green transition-colors" />
            <span className="font-bold text-xs sm:text-sm hidden sm:inline">Import CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-paymint-green text-black font-bold text-xs sm:text-sm hover:bg-[#68B390] transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">{t('categories.newCategory')}</span>
            <span className="xs:hidden">{t('common.add')}</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 scrollbar-none snap-x snap-mandatory">
        {[
          { label: t('categories.stats.totalCategories'), value: stats.total, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t('categories.stats.totalItems'), value: stats.products, icon: Package, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
          { label: t('categories.stats.topCategory'), value: stats.top?.name || t('common.notAvailable'), sub: `${stats.top?._count?.items || 0} ${t('dashboard.menu.products')}`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString(t('common.locale')) : stat.value}
                  </p>
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

        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5 shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
          <p className="text-xs font-black text-gray-400">{t('categories.messages.loading')}</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
            <Layers className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="dashboard-card-value mb-2">
            {normalizedSearchQuery ? t('categories.messages.noResults') : t('categories.messages.noCategories')}
          </h3>
          <p className="text-sm font-bold text-gray-500 max-w-xs">
            {normalizedSearchQuery ? t('categories.messages.noResultsDesc', { query: searchQuery.trim() }) : t('categories.messages.noCategoriesDesc')}
          </p>
        </div>
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
                      className="group relative bg-white dark:bg-[#1E293B] p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 hover:shadow-xl transition-all cursor-pointer overflow-hidden duration-300"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-paymint-green opacity-0 group-hover:opacity-100 transition-all duration-300" />
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-paymint-green/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                      <div className="flex justify-between items-start mb-6 relative z-10">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-500 group-hover:bg-paymint-green group-hover:text-black transition-all duration-300 shadow-sm">
                          <IconComponent size={24} />
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => openEditModal(e, category)}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-paymint-green transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-paymint-red transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors leading-tight truncate relative z-10">
                        {category.name}
                      </h3>

                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-2">
                          <Package size={14} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
                          <span className="dashboard-card-meta group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{t('categories.itemsCount', { count: category._count?.items || 0 })}</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
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
                      <th className="px-6 py-4 text-center dashboard-card-label w-16">{t('categories.table.icon')}</th>
                      <th className="px-6 py-4 text-left dashboard-card-label">{t('categories.table.name')}</th>
                      <th className="px-6 py-4 text-center dashboard-card-label">{t('categories.table.items')}</th>
                      <th className="px-6 py-4 text-center dashboard-card-label w-32">{t('owner.locations.actions')}</th>
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
                            <div className="w-10 h-10 mx-auto rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:bg-paymint-green group-hover:text-black transition-colors">
                              <IconComponent size={20} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">{category.name}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 dashboard-card-meta">
                              <Package size={12} />
                              {category._count?.items || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={(e) => openEditModal(e, category)}
                                className="p-2 text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10 rounded-lg transition-colors"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                                className="p-2 text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
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

      {createPortal(
        <AnimatePresence>
          {viewingCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[100] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm transition-all duration-300 ${sidebarOpen ? 'lg:pl-[300px]' : 'lg:pl-[100px]'}`}
              onClick={() => setViewingCategory(null)}
            >
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                className={`bg-white dark:bg-[#1E293B] w-full ${
                  categoryProducts.length === 0 
                    ? 'sm:max-w-md' 
                    : categoryProducts.length === 1 
                      ? 'sm:max-w-2xl' 
                      : 'sm:max-w-4xl'
                } rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] border border-gray-200 dark:border-white/10 shadow-2xl`}
                onClick={e => e.stopPropagation()}
              >
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                </div>

                <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-paymint-green/10 text-paymint-green">
                      <ViewingIcon size={24} />
                    </div>
                    <div>
                      <h2 className="dashboard-card-value leading-none">{viewingCategory.name}</h2>
                      <p className="text-[11px] font-medium text-paymint-green mt-1.5">{t('categories.itemsCount', { count: categoryProducts.length })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/dashboard/${locationSlug}/products`, { state: { openCreateModal: true, categoryId: viewingCategory.id } })}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-paymint-green transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                    <button
                      onClick={() => setViewingCategory(null)}
                      className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                  {categoryProducts.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 shadow-sm">
                        <Package size={40} strokeWidth={1.5} className="text-gray-300" />
                      </div>
                      <h3 className="dashboard-card-value mb-2">{t('products.messages.noProducts')}</h3>
                      <p className="text-sm font-bold text-gray-500 max-w-xs mx-auto mb-6">{t('products.messages.noProductsDesc')}</p>
                      <button
                        onClick={() => navigate(`/dashboard/${locationSlug}/products`, { state: { openCreateModal: true, categoryId: viewingCategory.id } })}
                        className="px-6 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Plus size={18} />
                        {t('common.add')}
                      </button>
                    </div>
                  ) : (
                    <div className={`grid grid-cols-1 ${
                      categoryProducts.length === 1 ? 'sm:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'
                    } gap-4`}>
                      {categoryProducts.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => navigate(`/dashboard/${locationSlug}/products`, { state: { productId: p.id, categoryId: viewingCategory.id } })}
                          className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group hover:border-paymint-green/30 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4"
                        >
                          <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 overflow-hidden shrink-0">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <img src="/default_product.png" alt="Default Product" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                            <p className="text-sm font-bold text-paymint-green mt-0.5">
                              {p.price.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div
                        onClick={() => navigate(`/dashboard/${locationSlug}/products`, { state: { openCreateModal: true, categoryId: viewingCategory.id } })}
                        className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-dashed border-gray-300 dark:border-white/20 rounded-xl group hover:border-paymint-green/50 hover:bg-paymint-green/5 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4 shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center shrink-0">
                           <Plus size={20} className="text-gray-400 group-hover:text-paymint-green group-hover:scale-110 transition-all" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-600 dark:text-gray-300 group-hover:text-paymint-green transition-colors truncate">{t('common.add')}</p>
                          <p className="text-xs font-medium text-gray-400 dark:text-white/40 mt-0.5">
                            New Product
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <CategoryFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        onDelete={editingCategory ? () => handleDelete(editingCategory.id) : undefined}
        initialData={editingCategory}
        isSubmitting={isSubmitting}
        externalError={formError}
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={t('categories.delete.title')}
        message={t('categories.delete.message')}
        type={confirmConfig.type}
      />

      <CsvImportModal
        isOpen={showCsvImport}
        onClose={() => setShowCsvImport(false)}
        title="Import Categories"
        description="Bulk import categories from a CSV file"
        columns={categoryCsvColumns}
        sampleData={categorySampleData}
        sampleFileName="categories_sample.csv"
        onImport={handleCsvImport}
        maxRows={200}
      />

      {createPortal(
        <AnimatePresence>
          {deleteBlockedCategory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-[100] popup-surface flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300 ${sidebarOpen ? 'lg:pl-[300px]' : 'lg:pl-[100px]'}`}
              onClick={() => setDeleteBlockedCategory(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-[#1E293B] w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-white/10 shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500">
                      {(() => {
                        const Icon = ICON_MAP[deleteBlockedCategory.icon || 'tag'] || Tag;
                        return <Icon size={24} />;
                      })()}
                    </div>
                    <div>
                      <h2 className="dashboard-card-value tracking-tight leading-none">{deleteBlockedCategory.name}</h2>
                      <p className="text-[11px] font-medium text-red-500 mt-1.5">{t('categories.itemsCount', { count: categoryProducts.length })}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteBlockedCategory(null)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
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
                        className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group hover:border-paymint-green/30 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 overflow-hidden shrink-0">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <img src="/default_product.png" alt="Default Product" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-xs font-black text-paymint-green mt-0.5">
                            {p.price.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}



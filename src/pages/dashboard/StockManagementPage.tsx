import React, { useState, useEffect, useMemo, useRef, useCallback, Fragment } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  RotateCcw,
  Save,
  Check,
  Plus,
  Minus,
  Sliders,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Box,
  ChevronDown,
  ChevronRight,
  PlusSquare,
  ExternalLink,
} from 'lucide-react';
import api, { extractErrorMessage } from '../../config/api';
import { fetchAllPages } from '../../utils/fetchAllPages';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { Pagination, SearchInput, SelectInput } from '../../components/ui';
import { ThumbnailImage } from '../../components/OptimizedImage';
import { useCurrency } from '../../context/CurrencyContext';
import { biIcon } from '../../components/ui/BiIcon';
import { useAuth } from '../../context/AuthContext';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useRealtime } from '../../hooks/useRealtime';

interface Category {
  id: string;
  name: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  categoryId?: string;
  image?: string;
  isAvailable: boolean;
  availableStock?: number;
  trackStock?: boolean;
  allowNegativeStock?: boolean;
  lowStockThresholdYellow?: number;
  lowStockThresholdRed?: number;
  category?: Category;
  deletedAt?: string | null;
  deactivatedAt?: string | null;
  isActive?: boolean;
}

interface SubAttribute {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  isActive?: boolean;
  attributeId: string;
  // PROTOTYPE preview — backend not wired yet
  trackStock?: boolean;
  availableStock?: number;
}

interface Attribute {
  id: string;
  name: string;
  inputType?: 'SINGLE_SELECT' | 'MULTI_SELECT';
  isRequired?: boolean;
  isActive?: boolean;
  subAttributes: SubAttribute[];
}

type MainTab = 'stock' | 'availability';
type StockStatusFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
type AddonStatusFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';

const QUICK_INCREMENTS = [1, 5, 10, 25, 50];

export function StockManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { locationSlug } = useParams();
  usePermissionGuard(['manage_inventory', 'restock_items']);
  const { formatAmount } = useCurrency();
  const { currentEstablishment } = useAuth();

  const handleOpenProduct = (productId: string) => {
    const targetSlug = locationSlug || currentEstablishment?.id;
    if (targetSlug) {
      navigate(`/dashboard/${targetSlug}/products`, { state: { productId } });
    } else {
      navigate('/products', { state: { productId } });
    }
  };

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<MainTab>('stock');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [savingItemId, setSavingItemId] = useState<string | null>(null);
  const [savingSubAttrId, setSavingSubAttrId] = useState<string | null>(null);
  const [bulkUpdatingAttrId, setBulkUpdatingAttrId] = useState<string | null>(null);

  // Raw Data
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);

  // Draft Stock Inputs: map of productId -> current typed stock count (string)
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const [stockErrors, setStockErrors] = useState<Record<string, string>>({});

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [selectedAddonGroupId, setSelectedAddonGroupId] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('ALL');
  const [addonStatusFilter, setAddonStatusFilter] = useState<AddonStatusFilter>('ALL');

  // Pagination for stock list
  const [stockPage, setStockPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const [sortKey, setSortKey] = useState<'name' | 'stock' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Confirm Modals
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const [bulkConfirmState, setBulkConfirmState] = useState<{
    targetAvailable: boolean;
    count: number;
    attrGroup: Attribute;
  } | null>(null);

  // Collapsed state for Add-on Groups (all expanded by default)
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>({});

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Initial Fetch & Realtime
  const fetchData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    try {
      const [fetchedProducts, fetchedCategories, attributesRes] = await Promise.all([
        fetchAllPages<Product>(api, '/api/items', { includeInactive: 'false' }),
        fetchAllPages<Category>(api, '/api/categories'),
        api.get('/api/attributes').then((res) => (Array.isArray(res.data) ? res.data : [])).catch(() => []),
      ]);

      const activeProducts = (fetchedProducts || []).filter((p) => !p.deletedAt && !p.deactivatedAt && p.isActive !== false);
      const activeCats = (fetchedCategories || []).filter((c) => c.isActive !== false);

      setProducts(activeProducts);
      setCategories(activeCats);
      setAttributes(attributesRes || []);

      // Initialize editingStock with existing availableStock
      setEditingStock((prevDraft) => {
        const next: Record<string, string> = { ...prevDraft };
        activeProducts.forEach((p) => {
          if (next[p.id] === undefined) {
            next[p.id] = String(p.availableStock ?? 0);
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error(extractErrorMessage(error) || t('stockManagement.errorFetching', { defaultValue: 'Failed to load stock data' }));
    } finally {
      if (!quiet) setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Realtime hook for automatic live sync
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });

  useEffect(() => {
    const unsubscribe = onRefresh(() => {
      fetchData(true);
    });
    return unsubscribe;
  }, [onRefresh, fetchData]);

  // Category Map
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [categories]);

  // Stock Level Evaluator
  const getProductStockLevel = useCallback((item: Product, stockVal?: number): 'out' | 'low' | 'in_stock' => {
    const current = stockVal !== undefined ? stockVal : (item.availableStock ?? 0);
    const yellow = item.lowStockThresholdYellow ?? 5;
    const red = item.lowStockThresholdRed ?? 0;

    if (current <= red || current <= 0) return 'out';
    if (current <= yellow) return 'low';
    return 'in_stock';
  }, []);

  // Filtered Stock Items (for Stock Tab - items that track stock)
  const trackedItemsList = useMemo(() => {
    return products.filter((p) => p.trackStock === true);
  }, [products]);

  // Modified Item IDs (Unsaved Changes)
  const modifiedItemIds = useMemo(() => {
    const ids: string[] = [];
    trackedItemsList.forEach((item) => {
      const serverStock = item.availableStock ?? 0;
      const draft = editingStock[item.id];
      if (draft !== undefined && draft !== '' && parseInt(draft, 10) !== serverStock) {
        ids.push(item.id);
      }
    });
    return ids;
  }, [trackedItemsList, editingStock]);

  // KPI Calculations
  const stockStats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValuation = 0;

    trackedItemsList.forEach((item) => {
      const current = item.availableStock ?? 0;
      const level = getProductStockLevel(item, current);
      if (level === 'out') outOfStock++;
      else if (level === 'low') lowStock++;
      else inStock++;

      const unitPrice = item.costPrice || item.price || 0;
      totalValuation += unitPrice * Math.max(0, current);
    });

    return {
      total: trackedItemsList.length,
      inStock,
      lowStock,
      outOfStock,
      totalValuation,
    };
  }, [trackedItemsList, getProductStockLevel]);

  // Non-empty modifier groups (groups that actually have add-on options)
  const nonEmptyAttributes = useMemo(() => {
    return attributes.filter((attr) => (attr.subAttributes || []).length > 0);
  }, [attributes]);

  // Add-on Stats
  const addonStats = useMemo(() => {
    let total = 0;
    let available = 0;
    let unavailable = 0;

    nonEmptyAttributes.forEach((attr) => {
      (attr.subAttributes || []).forEach((sa) => {
        total++;
        if (sa.isAvailable) available++;
        else unavailable++;
      });
    });

    return {
      groupsCount: nonEmptyAttributes.length,
      total,
      available,
      unavailable,
    };
  }, [nonEmptyAttributes]);

  // Filtered Stock Items for Display
  const filteredStockItems = useMemo(() => {
    return trackedItemsList
      .filter((item) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = item.name.toLowerCase().includes(q);
          const catName = categoryMap.get(item.categoryId || '')?.toLowerCase() || '';
          const matchesCat = catName.includes(q);
          if (!matchesName && !matchesCat) return false;
        }

        // Category Filter
        if (selectedCategoryId !== 'ALL' && item.categoryId !== selectedCategoryId) {
          return false;
        }

        // Status Filter (evaluated on current saved stock so items do not disappear while typing/adjusting)
        if (stockStatusFilter !== 'ALL') {
          const level = getProductStockLevel(item, item.availableStock ?? 0);
          if (stockStatusFilter === 'IN_STOCK' && level !== 'in_stock') return false;
          if (stockStatusFilter === 'LOW_STOCK' && level !== 'low') return false;
          if (stockStatusFilter === 'OUT_OF_STOCK' && level !== 'out') return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortKey === 'name') {
          return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortKey === 'stock') {
          const aStock = a.availableStock ?? 0;
          const bStock = b.availableStock ?? 0;
          return sortOrder === 'asc' ? aStock - bStock : bStock - aStock;
        }
        if (sortKey === 'category') {
          const aCat = categoryMap.get(a.categoryId || '') || '';
          const bCat = categoryMap.get(b.categoryId || '') || '';
          return sortOrder === 'asc' ? aCat.localeCompare(bCat) : bCat.localeCompare(aCat);
        }
        return 0;
      });
  }, [trackedItemsList, searchQuery, categoryMap, selectedCategoryId, stockStatusFilter, getProductStockLevel, sortKey, sortOrder]);

  // Paginated Stock Items
  const totalStockPages = Math.max(1, Math.ceil(filteredStockItems.length / itemsPerPage));
  const paginatedStockItems = useMemo(() => {
    const start = (stockPage - 1) * itemsPerPage;
    return filteredStockItems.slice(start, start + itemsPerPage);
  }, [filteredStockItems, stockPage, itemsPerPage]);

  // Filtered Add-on Groups for Availability Tab (never includes empty groups)
  const filteredGroupedAttributes = useMemo(() => {
    return nonEmptyAttributes
      .filter((attr) => {
        if (selectedAddonGroupId !== 'ALL' && attr.id !== selectedAddonGroupId) {
          return false;
        }
        return true;
      })
      .map((attr) => {
        let matchingSubs = attr.subAttributes || [];
        if (addonStatusFilter === 'AVAILABLE') {
          matchingSubs = matchingSubs.filter((sa) => sa.isAvailable);
        } else if (addonStatusFilter === 'UNAVAILABLE') {
          matchingSubs = matchingSubs.filter((sa) => !sa.isAvailable);
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesGroup = attr.name.toLowerCase().includes(q);
          if (!matchesGroup) {
            matchingSubs = matchingSubs.filter((sa) => sa.name.toLowerCase().includes(q));
          }
        }

        return {
          ...attr,
          filteredSubs: matchingSubs,
          totalCount: attr.subAttributes?.length || 0,
          availableCount: (attr.subAttributes || []).filter((s) => s.isAvailable).length,
        };
      })
      .filter((attr) => {
        // Only show groups that have options matching current filter
        return attr.filteredSubs.length > 0;
      });
  }, [nonEmptyAttributes, selectedAddonGroupId, addonStatusFilter, searchQuery]);

  // Stock Edit Handlers
  const handleStockInputChange = (itemId: string, value: string) => {
    const numeric = value.replace(/[^0-9]/g, '');
    setEditingStock((prev) => ({ ...prev, [itemId]: numeric }));
    if (stockErrors[itemId]) {
      setStockErrors((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
    }
  };

  const handleAdjustStock = (itemId: string, delta: number) => {
    const current = parseInt(editingStock[itemId] || '0', 10) || 0;
    const nextVal = Math.max(0, current + delta);
    setEditingStock((prev) => ({ ...prev, [itemId]: String(nextVal) }));
    if (stockErrors[itemId]) {
      setStockErrors((prev) => {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      });
    }
  };

  const handleResetItem = (item: Product) => {
    setEditingStock((prev) => ({
      ...prev,
      [item.id]: String(item.availableStock ?? 0),
    }));
    if (stockErrors[item.id]) {
      setStockErrors((prev) => {
        const copy = { ...prev };
        delete copy[item.id];
        return copy;
      });
    }
  };

  const handleDiscardAll = () => {
    const restored: Record<string, string> = {};
    products.forEach((p) => {
      restored[p.id] = String(p.availableStock ?? 0);
    });
    setEditingStock(restored);
    setStockErrors({});
    setConfirmDiscardOpen(false);
    toast.success(t('stockManagement.changesDiscarded', { defaultValue: 'All changes discarded' }));
  };

  // Single Item Stock Save
  const handleSaveStock = async (item: Product) => {
    const draft = editingStock[item.id];
    if (draft === '' || draft === undefined) {
      setStockErrors((prev) => ({ ...prev, [item.id]: t('stockManagement.enterValidStock', { defaultValue: 'Please enter a valid number' }) }));
      return;
    }

    const newStock = parseInt(draft, 10);
    if (isNaN(newStock) || newStock < 0) {
      setStockErrors((prev) => ({ ...prev, [item.id]: t('stockManagement.invalidNumber', { defaultValue: 'Invalid number' }) }));
      return;
    }

    if (newStock === item.availableStock) return;

    setSavingItemId(item.id);
    try {
      await api.patch(`/api/items/${item.id}/stock`, { availableStock: newStock });
      setProducts((prev) => prev.map((p) => (p.id === item.id ? { ...p, availableStock: newStock } : p)));
      toast.success(t('stockManagement.stockUpdatedFor', { defaultValue: 'Updated stock for {{name}}', name: item.name }));
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error(extractErrorMessage(error) || t('stockManagement.errorUpdatingStock', { defaultValue: 'Failed to update stock' }));
    } finally {
      setSavingItemId(null);
    }
  };

  // Batch Save All Modified Items
  const handleSaveAll = async () => {
    if (modifiedItemIds.length === 0 || isSavingAll) return;

    setIsSavingAll(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const itemsToUpdate = modifiedItemIds
        .map((id) => {
          const item = products.find((p) => p.id === id);
          const stock = parseInt(editingStock[id] || '', 10);
          return { item, newStock: stock };
        })
        .filter((entry): entry is { item: Product; newStock: number } => !!entry.item && !isNaN(entry.newStock) && entry.newStock >= 0);

      for (const { item, newStock } of itemsToUpdate) {
        if (newStock === item.availableStock) continue;
        try {
          await api.patch(`/api/items/${item.id}/stock`, { availableStock: newStock });
          setProducts((prev) => prev.map((p) => (p.id === item.id ? { ...p, availableStock: newStock } : p)));
          successCount++;
        } catch (err) {
          console.error(`Failed to update item ${item.name}:`, err);
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(t('stockManagement.batchSavedSuccess', { defaultValue: 'Successfully updated {{count}} items', count: successCount }));
      }
      if (failCount > 0) {
        toast.error(t('stockManagement.batchSavedFailed', { defaultValue: 'Failed to update {{count}} items', count: failCount }));
      }
    } finally {
      setIsSavingAll(false);
    }
  };

  // Toggle Sub-Attribute Availability
  const handleToggleSubAttributeAvailability = async (sub: SubAttribute, attributeId: string) => {
    const nextAvailability = !sub.isAvailable;
    setSavingSubAttrId(sub.id);

    // Optimistic update
    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id !== attributeId) return attr;
        return {
          ...attr,
          subAttributes: attr.subAttributes.map((sa) => (sa.id === sub.id ? { ...sa, isAvailable: nextAvailability } : sa)),
        };
      })
    );

    try {
      await api.patch(`/api/attributes/sub-attributes/${sub.id}`, {
        name: sub.name,
        price: sub.price,
        isAvailable: nextAvailability,
      });
      toast.success(
        nextAvailability
          ? t('stockManagement.addonNowAvailable', { defaultValue: '{{name}} is now available', name: sub.name })
          : t('stockManagement.addonNowUnavailable', { defaultValue: '{{name}} marked as unavailable', name: sub.name })
      );
    } catch (error) {
      console.error('Error toggling sub-attribute availability:', error);
      // Revert optimistic update
      setAttributes((prev) =>
        prev.map((attr) => {
          if (attr.id !== attributeId) return attr;
          return {
            ...attr,
            subAttributes: attr.subAttributes.map((sa) => (sa.id === sub.id ? { ...sa, isAvailable: !nextAvailability } : sa)),
          };
        })
      );
      toast.error(extractErrorMessage(error) || t('stockManagement.errorTogglingAddon', { defaultValue: 'Failed to update add-on availability' }));
    } finally {
      setSavingSubAttrId(null);
    }
  };

  // Execute Bulk Toggle All Sub-Attributes in a Group
  const handleBulkToggleGroup = async (attr: Attribute, targetAvailable: boolean) => {
    setBulkUpdatingAttrId(attr.id);
    const subsToUpdate = (attr.subAttributes || []).filter((sa) => sa.isAvailable !== targetAvailable);

    if (subsToUpdate.length === 0) {
      setBulkUpdatingAttrId(null);
      return;
    }

    // Optimistic update
    setAttributes((prev) =>
      prev.map((a) => {
        if (a.id !== attr.id) return a;
        return {
          ...a,
          subAttributes: a.subAttributes.map((sa) => ({ ...sa, isAvailable: targetAvailable })),
        };
      })
    );

    try {
      for (const sa of subsToUpdate) {
        await api.patch(`/api/attributes/sub-attributes/${sa.id}`, {
          name: sa.name,
          price: sa.price,
          isAvailable: targetAvailable,
        });
      }
      toast.success(
        targetAvailable
          ? t('stockManagement.allGroupAvailable', { defaultValue: 'All options in "{{name}}" marked as available', name: attr.name })
          : t('stockManagement.allGroupUnavailable', { defaultValue: 'All options in "{{name}}" marked as unavailable', name: attr.name })
      );
    } catch (error) {
      console.error('Error bulk updating group:', error);
      fetchData(true);
      toast.error(extractErrorMessage(error) || t('stockManagement.errorBulkUpdating', { defaultValue: 'Failed to update some items' }));
    } finally {
      setBulkUpdatingAttrId(null);
    }
  };

  // Prompt confirmation for Bulk Group Toggle
  const promptBulkToggleGroup = (attr: Attribute, targetAvailable: boolean) => {
    const subsToUpdate = (attr.subAttributes || []).filter((sa) => sa.isAvailable !== targetAvailable);
    if (subsToUpdate.length === 0) return;
    setBulkConfirmState({
      targetAvailable,
      count: subsToUpdate.length,
      attrGroup: attr,
    });
  };

  // Execute Bulk Action after modal confirmation
  const handleConfirmBulkAction = () => {
    if (!bulkConfirmState) return;
    void handleBulkToggleGroup(bulkConfirmState.attrGroup, bulkConfirmState.targetAvailable);
    setBulkConfirmState(null);
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('stockManagement.title', { defaultValue: 'Stock & Availability' })}
          </h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            <span>{t('stockManagement.subtitle', { defaultValue: 'Manage item stock counts and add-on availability' })}</span>
            {currentEstablishment?.name && (
              <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-sans border border-mintcom-green/20">
                {currentEstablishment.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Main Tabs (Stock vs Addons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('stock')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'stock'
                ? 'bg-white dark:bg-[#1E293B] text-mintcom-green shadow-sm border border-gray-200/60 dark:border-white/10'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{t('stockManagement.tabStockLevels', { defaultValue: 'Stock Levels' })}</span>
            <span
              className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
                activeTab === 'stock'
                  ? 'bg-mintcom-green/10 text-mintcom-green'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              {stockStats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'availability'
                ? 'bg-white dark:bg-[#1E293B] text-mintcom-green shadow-sm border border-gray-200/60 dark:border-white/10'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <PlusSquare className="w-4 h-4" />
            <span>{t('stockManagement.tabAddons', { defaultValue: 'Add-ons & Modifiers' })}</span>
            <span
              className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
                activeTab === 'availability'
                  ? 'bg-mintcom-green/10 text-mintcom-green'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
              }`}
            >
              {addonStats.total}
            </span>
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS */}
      {activeTab === 'stock' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => {
              setStockStatusFilter('ALL');
              setStockPage(1);
            }}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border text-left transition-all duration-300 overflow-hidden cursor-pointer ${
              stockStatusFilter === 'ALL'
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none bg-mintcom-green/10 group-hover:opacity-10" />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-mintcom-green/10 text-mintcom-green transition-transform duration-300 group-hover:scale-110">
                {biIcon('bi-box-seam')({ size: 18, className: 'sm:w-5 sm:h-5' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">
                  {t('stockManagement.trackedItems', { defaultValue: 'Tracked Items' })}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {stockStats.total}
                </h3>
              </div>
            </div>

            {/* Active Indicator Dot */}
            {stockStatusFilter === 'ALL' ? (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            ) : (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStockStatusFilter('IN_STOCK');
              setStockPage(1);
            }}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border text-left transition-all duration-300 overflow-hidden cursor-pointer ${
              stockStatusFilter === 'IN_STOCK'
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none bg-mintcom-green/10 group-hover:opacity-10" />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-mintcom-green/10 text-mintcom-green transition-transform duration-300 group-hover:scale-110">
                {biIcon('bi-check2-circle')({ size: 18, className: 'sm:w-5 sm:h-5' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">
                  {t('stockManagement.inStock', { defaultValue: 'In Stock' })}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {stockStats.inStock}
                </h3>
              </div>
            </div>

            {/* Active Indicator Dot */}
            {stockStatusFilter === 'IN_STOCK' ? (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            ) : (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStockStatusFilter('LOW_STOCK');
              setStockPage(1);
            }}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border text-left transition-all duration-300 overflow-hidden cursor-pointer ${
              stockStatusFilter === 'LOW_STOCK'
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none bg-mintcom-green/10 group-hover:opacity-10" />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-mintcom-green/10 text-mintcom-green transition-transform duration-300 group-hover:scale-110">
                {biIcon('bi-exclamation-triangle')({ size: 18, className: 'sm:w-5 sm:h-5' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">
                  {t('stockManagement.lowStock', { defaultValue: 'Low Stock' })}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {stockStats.lowStock}
                </h3>
              </div>
            </div>

            {/* Active Indicator Dot */}
            {stockStatusFilter === 'LOW_STOCK' ? (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            ) : (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setStockStatusFilter('OUT_OF_STOCK');
              setStockPage(1);
            }}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border text-left transition-all duration-300 overflow-hidden cursor-pointer ${
              stockStatusFilter === 'OUT_OF_STOCK'
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none bg-mintcom-green/10 group-hover:opacity-10" />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-mintcom-green/10 text-mintcom-green transition-transform duration-300 group-hover:scale-110">
                {biIcon('bi-x-circle')({ size: 18, className: 'sm:w-5 sm:h-5' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">
                  {t('stockManagement.outOfStock', { defaultValue: 'Out of Stock' })}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {stockStats.outOfStock}
                </h3>
              </div>
            </div>

            {/* Active Indicator Dot */}
            {stockStatusFilter === 'OUT_OF_STOCK' ? (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            ) : (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => setAddonStatusFilter('ALL')}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border text-left transition-all duration-300 overflow-hidden cursor-pointer ${
              addonStatusFilter === 'ALL'
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none bg-mintcom-green/10 group-hover:opacity-10" />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-mintcom-green/10 text-mintcom-green transition-transform duration-300 group-hover:scale-110">
                {biIcon('bi-collection')({ size: 18, className: 'sm:w-5 sm:h-5' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">
                  {t('stockManagement.addonGroups', { defaultValue: 'Add-on Groups' })}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {addonStats.groupsCount}
                </h3>
              </div>
            </div>

            {/* Active Indicator Dot */}
            {addonStatusFilter === 'ALL' ? (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            ) : (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAddonStatusFilter('ALL')}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border text-left transition-all duration-300 overflow-hidden cursor-pointer ${
              addonStatusFilter === 'ALL'
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none bg-mintcom-green/10 group-hover:opacity-10" />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-mintcom-green/10 text-mintcom-green transition-transform duration-300 group-hover:scale-110">
                {biIcon('bi-tags')({ size: 18, className: 'sm:w-5 sm:h-5' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">
                  {t('stockManagement.totalOptions', { defaultValue: 'Total Modifier Options' })}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {addonStats.total}
                </h3>
              </div>
            </div>

            {/* Active Indicator Dot */}
            {addonStatusFilter === 'ALL' ? (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            ) : (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAddonStatusFilter('AVAILABLE')}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border text-left transition-all duration-300 overflow-hidden cursor-pointer ${
              addonStatusFilter === 'AVAILABLE'
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none bg-mintcom-green/10 group-hover:opacity-10" />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-mintcom-green/10 text-mintcom-green transition-transform duration-300 group-hover:scale-110">
                {biIcon('bi-check2-circle')({ size: 18, className: 'sm:w-5 sm:h-5' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">
                  {t('stockManagement.availableOptions', { defaultValue: 'Available' })}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {addonStats.available}
                </h3>
              </div>
            </div>

            {/* Active Indicator Dot */}
            {addonStatusFilter === 'AVAILABLE' ? (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            ) : (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </button>

          <button
            type="button"
            onClick={() => setAddonStatusFilter('UNAVAILABLE')}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border text-left transition-all duration-300 overflow-hidden cursor-pointer ${
              addonStatusFilter === 'UNAVAILABLE'
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'
            }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none bg-mintcom-green/10 group-hover:opacity-10" />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl bg-mintcom-green/10 text-mintcom-green transition-transform duration-300 group-hover:scale-110">
                {biIcon('bi-x-circle')({ size: 18, className: 'sm:w-5 sm:h-5' })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">
                  {t('stockManagement.unavailableOptions', { defaultValue: 'Unavailable' })}
                </p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {addonStats.unavailable}
                </h3>
              </div>
            </div>

            {/* Active Indicator Dot */}
            {addonStatusFilter === 'UNAVAILABLE' ? (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            ) : (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </button>
        </div>
      )}

      {/* FILTER CONTROLS */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <SearchInput
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setStockPage(1);
              }}
              onClear={() => {
                setSearchQuery('');
                setStockPage(1);
              }}
              placeholder={
                activeTab === 'stock'
                  ? t('stockManagement.searchPlaceholder', { defaultValue: 'Search by item name or category...' })
                  : t('stockManagement.searchAddonsPlaceholder', { defaultValue: 'Search modifier groups or options...' })
              }
              className="w-full"
            />
          </div>

          {/* Category Dropdown (for Stock tab) */}
          {activeTab === 'stock' && (
            <div className="w-full lg:w-64">
              <SelectInput
                value={selectedCategoryId === 'ALL' ? null : selectedCategoryId}
                onChange={(val) => {
                  setSelectedCategoryId(val || 'ALL');
                  setStockPage(1);
                }}
                options={categories.map((c) => ({ label: c.name, value: c.id }))}
                allOptionLabel={t('stockManagement.allCategories', { defaultValue: 'All Categories' })}
                placeholder={t('stockManagement.allCategories', { defaultValue: 'All Categories' })}
                showAllOption={true}
                searchable={true}
              />
            </div>
          )}

          {/* Modifier Group Dropdown (for Addons tab) */}
          {activeTab === 'availability' && (
            <div className="w-full lg:w-64">
              <SelectInput
                value={selectedAddonGroupId === 'ALL' ? null : selectedAddonGroupId}
                onChange={(val) => {
                  setSelectedAddonGroupId(val || 'ALL');
                }}
                options={nonEmptyAttributes.map((a) => ({ label: a.name, value: a.id }))}
                allOptionLabel={t('stockManagement.allModifierGroups', { defaultValue: 'All Modifier Groups' })}
                placeholder={t('stockManagement.allModifierGroups', { defaultValue: 'All Modifier Groups' })}
                showAllOption={true}
                searchable={true}
              />
            </div>
          )}

          {/* Status Dropdown */}
          {activeTab === 'stock' ? (
            <div className="w-full lg:w-60">
              <SelectInput
                value={stockStatusFilter === 'ALL' ? null : stockStatusFilter}
                onChange={(val) => {
                  setStockStatusFilter((val as StockStatusFilter) || 'ALL');
                  setStockPage(1);
                }}
                options={[
                  { label: `${t('stockManagement.inStock', { defaultValue: 'In Stock' })} (${stockStats.inStock})`, value: 'IN_STOCK' },
                  { label: `${t('stockManagement.lowStock', { defaultValue: 'Low Stock' })} (${stockStats.lowStock})`, value: 'LOW_STOCK' },
                  { label: `${t('stockManagement.outOfStock', { defaultValue: 'Out of Stock' })} (${stockStats.outOfStock})`, value: 'OUT_OF_STOCK' },
                ]}
                allOptionLabel={`${t('stockManagement.allStockStatuses', { defaultValue: 'All Stock Statuses' })} (${stockStats.total})`}
                placeholder={t('stockManagement.allStockStatuses', { defaultValue: 'All Stock Statuses' })}
                showAllOption={true}
                searchable={false}
              />
            </div>
          ) : (
            <div className="w-full lg:w-60">
              <SelectInput
                value={addonStatusFilter === 'ALL' ? null : addonStatusFilter}
                onChange={(val) => {
                  setAddonStatusFilter((val as AddonStatusFilter) || 'ALL');
                }}
                options={[
                  { label: `${t('stockManagement.available', { defaultValue: 'Available' })} (${addonStats.available})`, value: 'AVAILABLE' },
                  { label: `${t('stockManagement.unavailable', { defaultValue: 'Unavailable' })} (${addonStats.unavailable})`, value: 'UNAVAILABLE' },
                ]}
                allOptionLabel={`${t('stockManagement.allAddonStatuses', { defaultValue: 'All Add-on Statuses' })} (${addonStats.total})`}
                placeholder={t('stockManagement.allAddonStatuses', { defaultValue: 'All Add-on Statuses' })}
                showAllOption={true}
                searchable={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: STOCK LEVELS & COUNTS TABLE */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th
                      className="px-6 py-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      onClick={() => {
                        if (sortKey === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else {
                          setSortKey('name');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t('stockManagement.item', { defaultValue: 'Item & Category' })}</span>
                        {sortKey === 'name' && <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">{t('stockManagement.status', { defaultValue: 'Status' })}</th>
                    <th className="px-6 py-4 text-center">{t('stockManagement.thresholds', { defaultValue: 'Thresholds' })}</th>
                    <th
                      className="px-6 py-4 text-center cursor-pointer hover:text-slate-900 dark:hover:text-white"
                      onClick={() => {
                        if (sortKey === 'stock') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        else {
                          setSortKey('stock');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>{t('stockManagement.onHandStock', { defaultValue: 'On-Hand Stock' })}</span>
                        {sortKey === 'stock' && <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-center">{t('stockManagement.quickAdjust', { defaultValue: 'Quick Restock (+Qty)' })}</th>
                    <th className="px-6 py-4 text-right">{t('common.actions', { defaultValue: 'Action' })}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                        <p>{t('stockManagement.loadingItems', { defaultValue: 'Loading stock inventory...' })}</p>
                      </td>
                    </tr>
                  ) : paginatedStockItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <Box className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="font-medium text-slate-600 dark:text-slate-300">
                          {t('stockManagement.noItemsFound', { defaultValue: 'No items match your filter criteria' })}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedStockItems.map((item) => {
                      const serverStock = item.availableStock ?? 0;
                      const draftStockStr = editingStock[item.id] ?? String(serverStock);
                      const currentVal = parseInt(draftStockStr, 10);
                      const isModified = !isNaN(currentVal) && currentVal !== serverStock;
                      const level = getProductStockLevel(item, isNaN(currentVal) ? serverStock : currentVal);

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                            isModified ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                          }`}
                        >
                          {/* Item Name & Image */}
                          <td className="px-6 py-4">
                            <div
                              onClick={() => handleOpenProduct(item.id)}
                              className="group flex items-center gap-3 cursor-pointer select-none"
                              title={t('stockManagement.openProduct', { defaultValue: 'Click to open product' })}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleOpenProduct(item.id);
                                }
                              }}
                            >
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 group-hover:border-mintcom-green/60 group-hover:ring-2 group-hover:ring-mintcom-green/20 transition-all">
                                {item.image ? (
                                  <ThumbnailImage
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                ) : (
                                  <Box className="w-5 h-5 text-slate-400 group-hover:text-mintcom-green transition-colors" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900 dark:text-white group-hover:text-mintcom-green transition-colors">
                                    {item.name}
                                  </span>
                                  {isModified && (
                                    <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Unsaved changes" />
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    {categoryMap.get(item.categoryId || '') || t('stockManagement.uncategorized', { defaultValue: 'Uncategorized' })}
                                  </span>
                                  {item.price > 0 && (
                                    <span className="text-xs text-slate-400">{formatAmount(item.price)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4 text-center">
                            {level === 'in_stock' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-mintcom-green/15 text-[#1b6140] dark:text-mintcom-green border border-mintcom-green/30">
                                <CheckCircle2 className="w-3.5 h-3.5 text-mintcom-green" />
                                {t('stockManagement.inStock', { defaultValue: 'In Stock' })}
                              </span>
                            )}
                            {level === 'low' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-[#f8b30a] border border-amber-500/30">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-[#f8b30a]" />
                                {t('stockManagement.lowStock', { defaultValue: 'Low Stock' })}
                              </span>
                            )}
                            {level === 'out' && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#D55263]/15 text-[#b83749] dark:text-[#D55263] border border-[#D55263]/30">
                                <XCircle className="w-3.5 h-3.5 text-[#D55263]" />
                                {t('stockManagement.outOfStock', { defaultValue: 'Out of Stock' })}
                              </span>
                            )}
                          </td>

                          {/* Thresholds (clean badges with vibrant website colors) */}
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-1.5 text-xs font-bold">
                              <span
                                className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-[#f8b30a] border border-amber-500/30"
                                title="Low Stock Threshold"
                              >
                                ≤ {item.lowStockThresholdYellow ?? 5}
                              </span>
                              <span
                                className="px-2.5 py-1 rounded-lg bg-[#D55263]/15 text-[#b83749] dark:text-[#D55263] border border-[#D55263]/30"
                                title="Critical Out-of-Stock Threshold"
                              >
                                ≤ {item.lowStockThresholdRed ?? 0}
                              </span>
                            </div>
                          </td>

                          {/* Editable Stock Input with +/- */}
                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAdjustStock(item.id, -1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors disabled:opacity-30"
                                disabled={currentVal <= 0}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>

                              <input
                                type="text"
                                value={draftStockStr}
                                onChange={(e) => handleStockInputChange(item.id, e.target.value)}
                                className={`w-20 text-center font-bold text-sm py-1.5 rounded-lg border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                                  isModified
                                    ? 'border-amber-400 dark:border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                                    : 'border-slate-200 dark:border-slate-700'
                                }`}
                              />

                              <button
                                type="button"
                                onClick={() => handleAdjustStock(item.id, 1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {stockErrors[item.id] && (
                              <p className="text-xs text-rose-500 mt-1 font-medium">{stockErrors[item.id]}</p>
                            )}
                          </td>

                          {/* Quick Add Pills */}
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {QUICK_INCREMENTS.map((amount) => (
                                <button
                                  key={amount}
                                  type="button"
                                  onClick={() => handleAdjustStock(item.id, amount)}
                                  className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-colors"
                                >
                                  +{amount}
                                </button>
                              ))}
                            </div>
                          </td>

                          {/* Row Actions */}
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isModified && (
                                <button
                                  type="button"
                                  onClick={() => handleResetItem(item)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title={t('stockManagement.reset', { defaultValue: 'Reset to original' })}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSaveStock(item)}
                                disabled={!isModified || savingItemId === item.id}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                                  isModified
                                    ? 'bg-mintcom-green hover:bg-[#6cb591] text-black shadow-sm'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 opacity-60 cursor-not-allowed'
                                }`}
                              >
                                {savingItemId === item.id ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Save className="w-3.5 h-3.5" />
                                )}
                                <span>{t('common.save', { defaultValue: 'Save' })}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <Pagination
              currentPage={stockPage}
              totalPages={totalStockPages}
              onPageChange={setStockPage}
              totalItems={filteredStockItems.length}
              itemsPerPage={itemsPerPage}
              variant="footer"
            />
          </div>
        </div>
      )}

      {/* TAB 2: ADD-ONS & MODIFIERS AVAILABILITY */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
              <p>{t('stockManagement.loadingAddons', { defaultValue: 'Loading modifier options...' })}</p>
            </div>
          ) : filteredGroupedAttributes.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-12 text-center text-slate-400">
              <PlusSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium text-slate-600 dark:text-slate-300">
                {t('stockManagement.noAddonGroupsFound', { defaultValue: 'No modifier groups or options match your filter criteria' })}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredGroupedAttributes.map((group) => {
                const isGroupAllAvailable = group.totalCount > 0 && group.availableCount === group.totalCount;
                const isGroupAllUnavailable = group.totalCount > 0 && group.availableCount === 0;
                const isUpdatingGroup = bulkUpdatingAttrId === group.id;
                const isCollapsed = Boolean(collapsedGroupIds[group.id]);

                return (
                  <div
                    key={group.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700"
                  >
                    {/* GROUP HEADER */}
                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="p-2.5 rounded-xl bg-mintcom-green/10 text-mintcom-green border border-mintcom-green/20 shrink-0">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                              {group.name}
                            </h3>
                            {group.inputType && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {group.inputType === 'SINGLE_SELECT'
                                  ? t('attributes.list.singleChoice', { defaultValue: 'Single Choice' })
                                  : t('attributes.list.multipleChoice', { defaultValue: 'Multiple Choice' })}
                              </span>
                            )}
                            {group.isRequired && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/15 text-amber-700 dark:text-[#f8b30a] border border-amber-500/30">
                                {t('attributes.list.mandatory', { defaultValue: 'Required' })}
                              </span>
                            )}
                          </div>

                          {/* Availability Progress Indicator */}
                          <div className="flex items-center gap-2.5 mt-1.5 flex-wrap">
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {group.availableCount} / {group.totalCount} {t('stockManagement.available', { defaultValue: 'Available' })}
                            </span>
                            <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  group.availableCount === group.totalCount
                                    ? 'bg-mintcom-green'
                                    : group.availableCount === 0
                                    ? 'bg-rose-500'
                                    : 'bg-amber-400'
                                }`}
                                style={{ width: `${group.totalCount > 0 ? (group.availableCount / group.totalCount) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* GROUP HEADER ACTIONS */}
                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        {/* Group Master Switch */}
                        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-2xs">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 select-none">
                            {isGroupAllAvailable
                              ? t('common.active', { defaultValue: 'Active' })
                              : isGroupAllUnavailable
                              ? t('common.inactive', { defaultValue: 'Inactive' })
                              : t('stockManagement.turnAllGroup', { defaultValue: 'All Group:' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => promptBulkToggleGroup(group, !isGroupAllAvailable)}
                            disabled={isUpdatingGroup}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                              isGroupAllAvailable
                                ? 'bg-mintcom-green'
                                : isGroupAllUnavailable
                                ? 'bg-slate-300 dark:bg-slate-700'
                                : 'bg-amber-400 dark:bg-amber-500'
                            }`}
                            title={isGroupAllAvailable ? 'Turn off all options in this group' : 'Turn on all options in this group'}
                          >
                            {isUpdatingGroup ? (
                              <span className="absolute inset-0 flex items-center justify-center">
                                <RefreshCw className="w-3 h-3 text-white animate-spin" />
                              </span>
                            ) : (
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                  isGroupAllAvailable ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            )}
                          </button>
                        </div>

                        {/* Collapse / Expand Button */}
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(group.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
                          title={isCollapsed ? 'Expand options' : 'Collapse options'}
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* GROUP OPTIONS TABLE / LIST */}
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                          <thead className="bg-slate-50/50 dark:bg-slate-800/20 text-xs uppercase font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-6 py-3 font-semibold">{t('stockManagement.addonOption', { defaultValue: 'Modifier / Option' })}</th>
                              <th className="px-6 py-3 text-center font-semibold">{t('stockManagement.extraPrice', { defaultValue: 'Extra Price' })}</th>
                              <th className="px-6 py-3 text-center font-semibold">{t('stockManagement.status', { defaultValue: 'Status' })}</th>
                              <th className="px-6 py-3 text-center font-semibold">{t('stockManagement.onHandStock', { defaultValue: 'On-Hand Stock' })} <span className="ml-1 px-1 py-0.5 rounded text-[9px] font-black bg-amber-500/15 text-amber-600 align-middle">PREVIEW</span></th>
                              <th className="px-6 py-3 text-right font-semibold">{t('stockManagement.availabilityToggle', { defaultValue: 'Availability' })}</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                            {group.filteredSubs.map((opt) => {
                              const isSavingThis = savingSubAttrId === opt.id;
                              return (
                                <tr
                                  key={opt.id}
                                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${
                                    !opt.isAvailable ? 'bg-rose-50/10 dark:bg-rose-950/5' : ''
                                  }`}
                                >
                                  {/* Option Name with Status Indicator Dot */}
                                  <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          opt.isAvailable ? 'bg-mintcom-green shadow-[0_0_8px_rgba(27,97,64,0.35)]' : 'bg-slate-300 dark:bg-slate-600'
                                        }`}
                                      />
                                      <span
                                        className={`font-semibold text-slate-900 dark:text-white ${
                                          !opt.isAvailable ? 'text-slate-400 dark:text-slate-500' : ''
                                        }`}
                                      >
                                        {opt.name}
                                      </span>
                                    </div>
                                  </td>

                                  {/* Extra Price */}
                                  <td className="px-6 py-3.5 text-center">
                                    {opt.price > 0 ? (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                                        +{formatAmount(opt.price)}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-mintcom-green/10 text-mintcom-green border border-mintcom-green/20">
                                        {t('stockManagement.free', { defaultValue: 'Free' })}
                                      </span>
                                    )}
                                  </td>

                                  {/* Status Badge */}
                                  <td className="px-6 py-3.5 text-center">
                                    {opt.isAvailable ? (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-mintcom-green/15 text-[#1b6140] dark:text-mintcom-green border border-mintcom-green/30">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-mintcom-green" />
                                        <span>{t('stockManagement.available', { defaultValue: 'Available' })}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#D55263]/15 text-[#b83749] dark:text-[#D55263] border border-[#D55263]/30">
                                        <XCircle className="w-3.5 h-3.5 text-[#D55263]" />
                                        <span>{t('stockManagement.unavailable', { defaultValue: 'Unavailable' })}</span>
                                      </span>
                                    )}
                                  </td>

                                  {/* Toggle Switch */}
                                  <td className="px-6 py-3.5 text-center">
                                    {opt.trackStock ? (
                                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                                        (opt.availableStock ?? 0) <= 0
                                          ? 'bg-[#D55263]/10 text-[#b83749] dark:text-[#D55263] border-[#D55263]/30'
                                          : (opt.availableStock ?? 0) <= 5
                                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                            : 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20'
                                      }`}>
                                        {(opt.availableStock ?? 0) <= 0
                                          ? t('stockManagement.outOfStock', { defaultValue: 'Out of stock' })
                                          : `${opt.availableStock ?? 0}`}
                                      </span>
                                    ) : (
                                      <span className="text-xs font-medium text-slate-400">—</span>
                                    )}
                                  </td>

                                  {/* Toggle Switch */}
                                  <td className="px-6 py-3.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleSubAttributeAvailability(opt, group.id)}
                                      disabled={isSavingThis}
                                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                        opt.isAvailable ? 'bg-mintcom-green' : 'bg-slate-300 dark:bg-slate-700'
                                      }`}
                                      title={opt.isAvailable ? 'Click to make unavailable' : 'Click to make available'}
                                    >
                                      {isSavingThis ? (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                          <RefreshCw className="w-3 h-3 text-white animate-spin" />
                                        </span>
                                      ) : (
                                        <span
                                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                            opt.isAvailable ? 'translate-x-5' : 'translate-x-0'
                                          }`}
                                        />
                                      )}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FLOATING BATCH SAVE BAR FOR UNSAVED CHANGES */}
      <AnimatePresence>
        {modifiedItemIds.length > 0 && activeTab === 'stock' && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-2xl bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
              </span>
              <div>
                <p className="text-sm font-bold">
                  {t('stockManagement.unsavedChangesCount', {
                    defaultValue: '{{count}} items have modified stock levels',
                    count: modifiedItemIds.length,
                  })}
                </p>
                <p className="text-xs text-slate-300">
                  {t('stockManagement.saveToApply', { defaultValue: 'Save changes to sync across POS and online stores' })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setConfirmDiscardOpen(true)}
                disabled={isSavingAll}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors"
              >
                {t('stockManagement.discard', { defaultValue: 'Discard' })}
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-mintcom-green hover:bg-[#6cb591] text-black transition-all flex items-center gap-2 shadow-lg shadow-mintcom-green/20 disabled:opacity-50"
              >
                {isSavingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('stockManagement.savingAll', { defaultValue: 'Saving...' })}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('stockManagement.saveAllChanges', { defaultValue: 'Save All Changes' })}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discard Changes Confirm Modal */}
      <ConfirmModal
        isOpen={confirmDiscardOpen}
        title={t('stockManagement.discardTitle', { defaultValue: 'Discard Unsaved Changes?' })}
        message={t('stockManagement.discardMessage', {
          defaultValue: 'Are you sure you want to revert all {{count}} modified stock quantities back to their previous values?',
          count: modifiedItemIds.length,
        })}
        confirmText={t('stockManagement.discard', { defaultValue: 'Discard' })}
        cancelText={t('common.cancel', { defaultValue: 'Keep Editing' })}
        type="danger"
        onConfirm={handleDiscardAll}
        onClose={() => setConfirmDiscardOpen(false)}
      />

      {/* Group Modifier Options Availability Confirm Modal */}
      <ConfirmModal
        isOpen={bulkConfirmState !== null}
        title={
          bulkConfirmState?.targetAvailable
            ? t('stockManagement.confirmEnableTitle', { defaultValue: 'Enable Modifier Options?' })
            : t('stockManagement.confirmDisableTitle', { defaultValue: 'Disable Modifier Options?' })
        }
        message={
          bulkConfirmState?.targetAvailable
            ? t('stockManagement.confirmEnableGroupMessage', {
                defaultValue: 'Are you sure you want to mark all {{count}} options in "{{groupName}}" as available? They will become available for customers to order immediately.',
                count: bulkConfirmState.count,
                groupName: bulkConfirmState.attrGroup.name,
              })
            : t('stockManagement.confirmDisableGroupMessage', {
                defaultValue: 'Are you sure you want to mark all {{count}} options in "{{groupName}}" as unavailable? These options will be blocked from ordering across all POS terminals.',
                count: bulkConfirmState?.count ?? 0,
                groupName: bulkConfirmState?.attrGroup.name ?? '',
              })
        }
        confirmText={
          bulkConfirmState?.targetAvailable
            ? t('stockManagement.enableAll', { defaultValue: 'Enable All' })
            : t('stockManagement.disableAll', { defaultValue: 'Disable All' })
        }
        cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
        type={bulkConfirmState?.targetAvailable ? 'success' : 'danger'}
        onConfirm={handleConfirmBulkAction}
        onClose={() => setBulkConfirmState(null)}
      />
    </div>
  );
}

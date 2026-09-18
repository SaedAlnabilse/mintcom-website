import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Package,
  Pizza,
  Edit2,
  Trash2,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Layers,
  Sparkles,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api, { extractErrorMessage } from '../../config/api';
import { fetchAllPages } from '../../utils/fetchAllPages';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { CustomSelect } from '../../components/CustomSelect';
import { QuickInfo } from '../../components/QuickInfo';
import { EmptyState, SearchInput, Pagination, SelectInput, PageHeader, Badge, Card } from '../../components/ui';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton } from '../../components/ui';
import { biIcon } from '../../components/ui/BiIcon';
import { StatValue } from '../../components/ui/StatValue';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useRealtime } from '../../hooks/useRealtime';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import { formatInputPlaceholder, formatInputLabel } from '../../utils/textCase';

const UNIT_CONVERSIONS: Record<string, { type: 'mass' | 'volume' | 'count'; factor: number }> = {
  Kg: { type: 'mass', factor: 1000 }, // Base: g
  G: { type: 'mass', factor: 1 },
  Mg: { type: 'mass', factor: 0.001 },
  L: { type: 'volume', factor: 1000 }, // Base: ml
  Ml: { type: 'volume', factor: 1 },
  Units: { type: 'count', factor: 1 },
  Pcs: { type: 'count', factor: 1 },
  Portions: { type: 'count', factor: 1 },
  Servings: { type: 'count', factor: 1 },
};

const getCompatibleUnits = (baseUnit: string) => {
  const baseInfo = UNIT_CONVERSIONS[baseUnit];
  if (!baseInfo) return [baseUnit];
  return Object.keys(UNIT_CONVERSIONS).filter(u => UNIT_CONVERSIONS[u].type === baseInfo.type);
};

const convertToDisplay = (baseQty: number, baseUnit: string, targetUnit: string) => {
  const baseInfo = UNIT_CONVERSIONS[baseUnit];
  const targetInfo = UNIT_CONVERSIONS[targetUnit];
  if (!baseInfo || !targetInfo || baseInfo.type !== targetInfo.type) return baseQty;
  return (baseQty * baseInfo.factor) / targetInfo.factor;
};

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  costPerUnit: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  deactivatedAt?: string | null;
}

interface SubRecipeIngredient {
  rawMaterialId: string;
  rawMaterial?: { name: string; unit: string };
  quantity: number;
}

interface SubRecipe {
  id: string;
  name: string;
  description?: string;
  yield: number;
  yieldUnit: string;
  quantity: number;
  ingredients: SubRecipeIngredient[];
  isActive?: boolean;
  deactivatedAt?: string | null;
}

interface FinalRecipeIngredient {
  rawMaterialId?: string;
  subRecipeId?: string;
  rawMaterial?: { name: string; unit: string };
  subRecipe?: { name: string; yieldUnit: string };
  quantity: number;
}

interface FinalRecipe {
  id: string;
  itemId?: string;
  subAttributeId?: string;
  item?: { name: string };
  subAttribute?: { name: string; attribute?: { name: string } };
  ingredients: FinalRecipeIngredient[];
  version?: number;
  isActive?: boolean;
  deactivatedAt?: string | null;
}

interface MenuItem {
  id: string;
  name: string;
  type: 'product' | 'addon';
  groupName?: string;
  isActive?: boolean;
  isAvailable?: boolean;
  deletedAt?: string | null;
  deactivatedAt?: string | null;
}

interface AttributeGroup {
  id: string;
  name: string;
  isActive?: boolean;
  deletedAt?: string | null;
  deactivatedAt?: string | null;
  subAttributes?: Array<{
    id: string;
    name: string;
    price?: number;
    isActive?: boolean;
    isAvailable?: boolean;
    deletedAt?: string | null;
    deactivatedAt?: string | null;
  }>;
}

export type TabType = 'materials' | 'sub' | 'final';
export type RawFilterType = 'ALL' | 'LOW' | 'OUT' | 'INACTIVE';
export type SubFilterType = 'ALL' | 'READY' | 'SHORTAGE' | 'INACTIVE';
export type FinalFilterType = 'ALL' | 'PRODUCTS' | 'ADDONS' | 'INACTIVE';

const isEntityActive = (entity: { isActive?: boolean; deactivatedAt?: string | null; deletedAt?: string | null }) =>
  entity.isActive !== false && !entity.deactivatedAt && !entity.deletedAt;

const getFinalRecipeTargetId = (recipe: FinalRecipe) =>
  recipe.itemId || recipe.subAttributeId || '';

const getFinalRecipeTargetName = (recipe: FinalRecipe) =>
  recipe.item?.name ||
  (recipe.subAttribute?.attribute?.name && recipe.subAttribute?.name
    ? `${recipe.subAttribute.attribute.name} > ${recipe.subAttribute.name}`
    : recipe.subAttribute?.name) ||
  'Unknown target';

export function RecipesPage() {
  const { t } = useTranslation();
  const { currentEstablishment } = useAuth();
  const { formatAmount, currencySymbol } = useCurrency();
  usePermissionGuard(['manage_inventory']);
  const { locationSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationTargetHandledRef = useRef(false);

  // 3-Pillar Tab
  const [activeTab, setActiveTab] = useState<TabType>('materials');

  // Dynamic filter states matching POS
  const [rawFilter, setRawFilter] = useState<RawFilterType>('ALL');
  const [subFilter, setSubFilter] = useState<SubFilterType>('ALL');
  const [finalFilter, setFinalFilter] = useState<FinalFilterType>('ALL');

  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [finalRecipes, setFinalRecipes] = useState<FinalRecipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [materialForm, setMaterialForm] = useState({
    name: '', unit: 'Kg', quantity: 0, costPerUnit: 0, lowStockThreshold: 0
  });

  const [showSubRecipeModal, setShowSubRecipeModal] = useState(false);
  const [showFinalRecipeModal, setShowFinalRecipeModal] = useState(false);
  const [showManufactureModal, setShowManufactureModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<SubRecipe | FinalRecipe | null>(null);
  const [manufactureRecipe, setManufactureRecipe] = useState<SubRecipe | null>(null);
  const [numBatches, setNumBatches] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
    confirmText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const [subRecipeForm, setSubRecipeForm] = useState({
    name: '',
    description: '',
    yield: 1,
    yieldUnit: 'Units',
    ingredients: [] as { rawMaterialId: string; quantity: number; selectedUnit?: string }[],
  });

  const [finalRecipeForm, setFinalRecipeForm] = useState({
    itemId: '',
    ingredients: [] as { rawMaterialId?: string; subRecipeId?: string; quantity: number; type: 'raw' | 'sub'; selectedUnit?: string }[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const units = ['Units', 'Kg', 'G', 'L', 'Ml', 'Pcs', 'Portions', 'Servings'];

  const fetchData = async (quiet = false) => {
    try {
      if (!quiet) setIsLoading(true);
      const [subRes, finalRes, materialsRes, itemsData, attributesRes] = await Promise.all([
        api.get('/api/manufacturing/sub-recipes', { params: { includeInactive: true } }),
        api.get('/api/manufacturing/final-recipes', { params: { includeInactive: true } }),
        api.get('/api/manufacturing/raw-materials', { params: { includeInactive: true } }),
        fetchAllPages<any>(api, '/api/items'),
        api.get('/api/attributes', { params: { includeInactive: true } }),
      ]);
      const attributesData: AttributeGroup[] = Array.isArray(attributesRes.data)
        ? attributesRes.data
        : attributesRes.data?.items || [];
      const productTargets = itemsData.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: 'product' as const,
        groupName: item.category?.name,
        isActive: item.deletedAt == null && item.deactivatedAt == null,
        isAvailable: item.isAvailable,
        deletedAt: item.deletedAt,
        deactivatedAt: item.deactivatedAt,
      }));
      const addonTargets = attributesData.flatMap((attribute) =>
        (attribute.subAttributes || []).map((option) => ({
          id: option.id,
          name: option.name,
          type: 'addon' as const,
          groupName: attribute.name,
          isActive:
            option.deletedAt == null &&
            option.deactivatedAt == null &&
            option.isActive !== false &&
            attribute.deletedAt == null &&
            attribute.deactivatedAt == null &&
            attribute.isActive !== false,
          isAvailable: option.isAvailable,
          deletedAt: option.deletedAt,
          deactivatedAt: option.deactivatedAt || attribute.deactivatedAt,
        })),
      );
      setSubRecipes(subRes.data || []);
      setFinalRecipes(finalRes.data || []);
      setRawMaterials(materialsRes.data || []);
      setMenuItems([...productTargets, ...addonTargets]);
    } catch {
      toast.error(t('manufacturing.messages.syncFailed', { defaultValue: 'Failed to sync data' }));
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  const fetchDataRef = useRef(fetchData);
  fetchDataRef.current = fetchData;

  useEffect(() => {
    fetchDataRef.current();
  }, []);

  // Live sync: background-refresh on manufacturing + sale events from any
  // surface (POS, admin portal, second dashboard tab). Debounced so a
  // multi-item sale or batch restock triggers one quiet refetch, not a storm.
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });

  useEffect(() => {
    let debounceTimer: number | null = null;
    const unsubscribe = onRefresh((eventType) => {
      if (
        eventType.startsWith('raw_material.') ||
        eventType.startsWith('sub_recipe.') ||
        eventType.startsWith('final_recipe.') ||
        eventType.startsWith('manufacturing.') ||
        eventType.startsWith('item.')
      ) {
        if (debounceTimer) window.clearTimeout(debounceTimer);
        debounceTimer = window.setTimeout(() => {
          // Quiet: no blocking loader for realtime background refreshes.
          void fetchDataRef.current(true);
        }, 500);
      }
    });
    return () => {
      if (debounceTimer) window.clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [onRefresh]);

  useEffect(() => {
    if (isLoading || navigationTargetHandledRef.current) return;

    const rawMaterialId = new URLSearchParams(location.search).get('rawMaterialId');
    if (!rawMaterialId) return;

    navigationTargetHandledRef.current = true;
    const materialIndex = rawMaterials.findIndex((material) => material.id === rawMaterialId);
    const material = materialIndex >= 0 ? rawMaterials[materialIndex] : null;

    if (material) {
      setActiveTab('materials');
      setSearchQuery('');
      setRawFilter('ALL');
      setPage(Math.floor(materialIndex / itemsPerPage) + 1);
      setEditingMaterial(material);
      setMaterialForm({
        name: material.name,
        unit: material.unit,
        quantity: material.quantity,
        costPerUnit: material.costPerUnit,
        lowStockThreshold: material.lowStockThreshold || 0,
      });
      setShowMaterialModal(true);
    }

    navigate(location.pathname, { replace: true });
  }, [isLoading, location.pathname, location.search, navigate, rawMaterials]);

  // Check if raw materials are available for a sub-recipe
  const checkRawMaterialsAvailable = useCallback(
    (recipe: SubRecipe, quantity = 1): boolean => {
      if (!recipe || !recipe.ingredients || recipe.ingredients.length === 0) return true;
      for (const ingredient of recipe.ingredients) {
        const material = (rawMaterials || []).find((m) => m.id === ingredient.rawMaterialId);
        if (!material || (material.quantity || 0) < (ingredient.quantity || 0) * quantity) {
          return false;
        }
      }
      return true;
    },
    [rawMaterials]
  );

  // Status helper for raw materials
  const getRawStockStatus = useCallback((material: RawMaterial): 'ok' | 'low' | 'out' => {
    if (material.quantity <= 0) return 'out';
    if (material.lowStockThreshold && material.lowStockThreshold > 0 && material.quantity <= material.lowStockThreshold) {
      return 'low';
    }
    return 'ok';
  }, []);

  // Raw Material KPI & Filter Counts
  const rawCounts = useMemo(() => {
    let low = 0;
    let out = 0;
    let inactive = 0;
    let totalValue = 0;
    (rawMaterials || []).forEach((m) => {
      const active = isEntityActive(m);
      if (!active) {
        inactive += 1;
      } else {
        const s = getRawStockStatus(m);
        if (s === 'low') low += 1;
        if (s === 'out') out += 1;
        totalValue += (m.quantity || 0) * (m.costPerUnit || 0);
      }
    });
    return {
      active: (rawMaterials || []).length - inactive,
      total: (rawMaterials || []).length,
      low,
      out,
      inactive,
      totalValue,
    };
  }, [rawMaterials, getRawStockStatus]);

  // Sub Recipe KPI & Filter Counts
  const intermediateCounts = useMemo(() => {
    let ready = 0;
    let shortage = 0;
    let inactive = 0;
    let totalStock = 0;
    (subRecipes || []).forEach((s) => {
      const active = isEntityActive(s);
      if (!active) {
        inactive += 1;
      } else {
        totalStock += s.quantity || 0;
        if (checkRawMaterialsAvailable(s, 1)) {
          ready += 1;
        } else {
          shortage += 1;
        }
      }
    });
    return {
      active: (subRecipes || []).length - inactive,
      total: (subRecipes || []).length,
      ready,
      shortage,
      inactive,
      totalStock,
    };
  }, [subRecipes, checkRawMaterialsAvailable]);

  // Final Recipe KPI & Filter Counts
  const recipeCounts = useMemo(() => {
    let products = 0;
    let addons = 0;
    let inactive = 0;
    (finalRecipes || []).forEach((r) => {
      const active = isEntityActive(r);
      if (!active) {
        inactive += 1;
      } else {
        if (r.subAttributeId) addons += 1;
        else products += 1;
      }
    });
    return {
      active: (finalRecipes || []).length - inactive,
      total: (finalRecipes || []).length,
      products,
      addons,
      inactive,
    };
  }, [finalRecipes]);

  const activeRawMaterials = useMemo(() => (Array.isArray(rawMaterials) ? rawMaterials : []).filter(isEntityActive), [rawMaterials]);
  const activeSubRecipes = useMemo(() => (Array.isArray(subRecipes) ? subRecipes : []).filter(isEntityActive), [subRecipes]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (rawMaterials || []).filter((m) => {
      if (q && !m.name.toLowerCase().includes(q) && !(m.unit && m.unit.toLowerCase().includes(q))) {
        return false;
      }
      const active = isEntityActive(m);
      if (rawFilter === 'LOW') {
        return active && getRawStockStatus(m) === 'low';
      }
      if (rawFilter === 'OUT') {
        return active && getRawStockStatus(m) === 'out';
      }
      if (rawFilter === 'INACTIVE') {
        return !active;
      }
      return active;
    });
  }, [rawMaterials, searchQuery, rawFilter, getRawStockStatus]);

  // Filtered sub recipes
  const filteredSub = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (subRecipes || []).filter((s) => {
      if (q && !s.name.toLowerCase().includes(q)) {
        return false;
      }
      const active = isEntityActive(s);
      if (subFilter === 'READY') {
        return active && checkRawMaterialsAvailable(s, 1);
      }
      if (subFilter === 'SHORTAGE') {
        return active && !checkRawMaterialsAvailable(s, 1);
      }
      if (subFilter === 'INACTIVE') {
        return !active;
      }
      return active;
    });
  }, [subRecipes, searchQuery, subFilter, checkRawMaterialsAvailable]);

  // Filtered final recipes
  const filteredFinal = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return (finalRecipes || []).filter((r) => {
      const targetName = getFinalRecipeTargetName(r).toLowerCase();
      if (q && !targetName.includes(q) && !(r.itemId || r.subAttributeId || '').includes(q)) {
        return false;
      }
      const active = isEntityActive(r);
      if (finalFilter === 'PRODUCTS') {
        return active && !r.subAttributeId;
      }
      if (finalFilter === 'ADDONS') {
        return active && !!r.subAttributeId;
      }
      if (finalFilter === 'INACTIVE') {
        return !active;
      }
      return active;
    });
  }, [finalRecipes, searchQuery, finalFilter]);

  const hasRecipeSearch = searchQuery.trim().length > 0;
  const hasRecipeFilters =
    activeTab === 'materials' ? rawFilter !== 'ALL' : activeTab === 'sub' ? subFilter !== 'ALL' : finalFilter !== 'ALL';

  const moveCreateViewToActive = () => {
    if (activeTab === 'materials' && rawFilter === 'INACTIVE') setRawFilter('ALL');
    if (activeTab === 'sub' && subFilter === 'INACTIVE') setSubFilter('ALL');
    if (activeTab === 'final' && finalFilter === 'INACTIVE') setFinalFilter('ALL');
    setPage(1);
  };

  const totalPages = Math.ceil(((activeTab === 'materials' ? filteredMaterials : activeTab === 'final' ? filteredFinal : filteredSub) || []).length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const items = activeTab === 'materials' ? filteredMaterials : activeTab === 'final' ? filteredFinal : filteredSub;
    return (Array.isArray(items) ? items : []).slice(start, start + itemsPerPage);
  }, [activeTab, filteredMaterials, filteredFinal, filteredSub, page]);

  const editingFinalTargetId = editingRecipe && ('itemId' in editingRecipe || 'subAttributeId' in editingRecipe)
    ? getFinalRecipeTargetId(editingRecipe as FinalRecipe)
    : '';
  const products = (Array.isArray(menuItems) ? menuItems : []).filter((p) =>
    isEntityActive(p) &&
    (!(Array.isArray(finalRecipes) ? finalRecipes : []).some((r) => getFinalRecipeTargetId(r) === p.id && isEntityActive(r)) ||
      editingFinalTargetId === p.id)
  );

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingMaterial && !isEntityActive(editingMaterial)) {
      return;
    }

    setErrors({});
    if (!materialForm.name.trim()) { setErrors({ name: t('common.required') }); return; }
    setIsSubmitting(true);
    try {
      if (editingMaterial) {
        await api.put(`/api/manufacturing/raw-materials/${editingMaterial.id}`, materialForm);
        toast.success(t('inventory.messages.updated', {defaultValue: 'Updated successfully'}));
      } else {
        await api.post('/api/manufacturing/raw-materials', materialForm);
        toast.success(t('inventory.messages.created', {defaultValue: 'Created successfully'}));
        moveCreateViewToActive();
      }
      setShowMaterialModal(false);
      fetchData();
    } catch {
      toast.error(t('inventory.messages.saveError', {defaultValue: 'Failed to save'}));
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    const impact = await api.get(`/api/manufacturing/raw-materials/${id}/delete-impact`)
      .then((res) => res.data)
      .catch(() => ({ action: 'archive' }));
    const shouldDelete = impact.action === 'delete';
    setConfirmConfig({
      isOpen: true,
      title: shouldDelete ? 'Delete Ingredient' : t('inventory.messages.removeTitle', {defaultValue: 'Archive Ingredient'}),
      message: shouldDelete
        ? `Delete "${name}" permanently? It is not used in recipes, stock, sales, or reports.`
        : `Archive "${name}"? It has usage or history, so it will become inactive instead of being deleted.`,
      type: 'danger',
      confirmText: shouldDelete ? t('common.delete', { defaultValue: 'Delete' }) : t('common.archive', { defaultValue: 'Archive' }),
      onConfirm: async () => {
        try {
          const response = await api.delete(`/api/manufacturing/raw-materials/${id}`);
          // Response flag is the source of truth; the pre-check's
          // shouldDelete is stale the moment usage lands between calls.
          const deleted = response.data as { hardDeleted?: boolean } | undefined;
          const wasHardDeleted =
            deleted?.hardDeleted === true ||
            (deleted?.hardDeleted !== false && shouldDelete);
          toast.success(wasHardDeleted ? 'Deleted successfully' : t('inventory.messages.removed', {defaultValue: 'Archived successfully'}));
          fetchData();
        } catch { toast.error(t('inventory.messages.deleteFailed', {defaultValue: 'Failed to remove'})); }
      }
    });
  };

  const handleReactivateMaterial = async (id: string) => {
    try {
      await api.post(`/api/manufacturing/raw-materials/${id}/reactivate`);
      toast.success(t('common.active', { defaultValue: 'Active' }));
      setShowMaterialModal(false);
      fetchData();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const openEditSubRecipe = (recipe: SubRecipe) => {
    setEditingRecipe(recipe);
    setSubRecipeForm({
      name: recipe.name,
      description: recipe.description || '',
      yield: recipe.yield,
      yieldUnit: recipe.yieldUnit,
      ingredients: (recipe.ingredients || []).map(i => {
        const mat = rawMaterials.find(m => m.id === i.rawMaterialId);
        return {
          rawMaterialId: i.rawMaterialId,
          quantity: i.quantity,
          selectedUnit: mat?.unit,
        };
      }),
    });
    setShowSubRecipeModal(true);
  };

  const openEditFinalRecipe = (recipe: FinalRecipe) => {
    setEditingRecipe(recipe);
    setFinalRecipeForm({
      itemId: getFinalRecipeTargetId(recipe),
      ingredients: (recipe.ingredients || []).map(i => {
        const type = i.subRecipeId ? 'sub' : 'raw';
        const mat = type === 'raw' ? rawMaterials.find(m => m.id === i.rawMaterialId) : null;
        const sub = type === 'sub' ? subRecipes.find(s => s.id === i.subRecipeId) : null;
        return {
          rawMaterialId: i.rawMaterialId,
          subRecipeId: i.subRecipeId,
          quantity: i.quantity,
          type,
          selectedUnit: type === 'raw' ? mat?.unit : sub?.yieldUnit,
        };
      }),
    });
    setShowFinalRecipeModal(true);
  };

  const openManufactureModal = (recipe: SubRecipe) => {
    setManufactureRecipe(recipe);
    setNumBatches(1);
    setShowManufactureModal(true);
  };

  const handleSubRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRecipe && !isEntityActive(editingRecipe)) {
      return;
    }

    setErrors({});
    if (!subRecipeForm.name.trim()) { setErrors({ name: t('common.required') }); return; }
    if (subRecipeForm.ingredients.length === 0) {
      toast.error(t('manufacturing.validation.atLeastOneIngredient'));
      return;
    }
    for (const ing of subRecipeForm.ingredients) {
      if (!ing.rawMaterialId) { toast.error(t('manufacturing.validation.selectMaterial')); return; }
      if (ing.quantity <= 0) { toast.error(t('manufacturing.validation.quantityGreaterThanZero')); return; }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: subRecipeForm.name,
        description: subRecipeForm.description,
        yield: subRecipeForm.yield,
        yieldUnit: subRecipeForm.yieldUnit,
        ingredients: subRecipeForm.ingredients.map(i => {
          return {
            rawMaterialId: i.rawMaterialId,
            quantity: i.quantity,
          };
        }),
      };

      if (editingRecipe) {
        await api.put(`/api/manufacturing/sub-recipes/${editingRecipe.id}`, payload);
      } else {
        await api.post('/api/manufacturing/sub-recipes', payload);
        moveCreateViewToActive();
      }
      toast.success(t('manufacturing.messages.saveSuccess'));
      setShowSubRecipeModal(false);
      fetchData();
    } catch {
      toast.error(t('manufacturing.messages.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRecipe && !isEntityActive(editingRecipe)) {
      return;
    }

    setErrors({});
    if (!editingRecipe && !finalRecipeForm.itemId) { setErrors({ itemId: t('common.required') }); return; }
    if (finalRecipeForm.ingredients.length === 0) {
      toast.error(t('manufacturing.validation.atLeastOneIngredient'));
      return;
    }
    for (const ing of finalRecipeForm.ingredients) {
      if (!ing.rawMaterialId && !ing.subRecipeId) { toast.error(t('manufacturing.validation.selectItem')); return; }
      if (ing.quantity <= 0) { toast.error(t('manufacturing.validation.quantityGreaterThanZero')); return; }
    }

    setIsSubmitting(true);
    try {
      const selectedTarget = menuItems.find(item => item.id === finalRecipeForm.itemId);
      const ingredients = finalRecipeForm.ingredients.map(i => {
        return {
          rawMaterialId: i.rawMaterialId,
          subRecipeId: i.subRecipeId,
          quantity: i.quantity,
        };
      });

      if (editingRecipe) {
        await api.put(`/api/manufacturing/final-recipes/${editingRecipe.id}`, {
          ingredients,
        });
      } else {
        if (!selectedTarget) {
          setErrors({ itemId: t('common.required') });
          return;
        }
        const targetPayload = selectedTarget?.type === 'addon'
          ? { subAttributeId: finalRecipeForm.itemId }
          : { itemId: finalRecipeForm.itemId };
        await api.post('/api/manufacturing/final-recipes', {
          ...targetPayload,
          ingredients,
        });
        moveCreateViewToActive();
      }
      toast.success(t('manufacturing.messages.saveSuccess'));
      setShowFinalRecipeModal(false);
      fetchData();
    } catch {
      toast.error(t('manufacturing.messages.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManufacture = async () => {
    if (!manufactureRecipe) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/manufacturing/sub-recipes/${manufactureRecipe.id}/manufacture`, { batches: numBatches });
      toast.success(t('manufacturing.manufactured'));
      setShowManufactureModal(false);
      fetchData();
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (id: string, type: 'sub' | 'final') => {
    const segment = type === 'sub' ? 'sub-recipes' : 'final-recipes';
    const impact = await api.get(`/api/manufacturing/${segment}/${id}/delete-impact`)
      .then((res) => res.data)
      .catch(() => ({ action: 'archive' }));
    const shouldDelete = impact.action === 'delete';
    setConfirmConfig({
      isOpen: true,
      title: shouldDelete ? t('common.delete', { defaultValue: 'Delete' }) : t('common.archive', { defaultValue: 'Archive' }),
      message: shouldDelete
        ? 'Delete this recipe operation permanently? It is not used in recipes, stock, sales, or reports.'
        : 'Archive this recipe operation? It has usage or history, so it will become inactive instead of being deleted.',
      type: 'danger',
      confirmText: shouldDelete ? t('common.delete', { defaultValue: 'Delete' }) : t('common.archive', { defaultValue: 'Archive' }),
      onConfirm: async () => {
        try {
          const response = await api.delete(`/api/manufacturing/${segment}/${id}`);
          const deleted = response.data as { hardDeleted?: boolean } | undefined;
          const wasHardDeleted =
            deleted?.hardDeleted === true ||
            (deleted?.hardDeleted !== false && shouldDelete);
          toast.success(wasHardDeleted ? t('common.delete', { defaultValue: 'Deleted successfully' }) : t('manufacturing.messages.removed'));
          fetchData();
        } catch (error) {
          toast.error(extractErrorMessage(error) || t('common.error'));
        }
      }
    });
  };

  const handleReactivateRecipe = async (id: string, type: 'sub' | 'final') => {
    try {
      await api.post(`/api/manufacturing/${type === 'sub' ? 'sub-recipes' : 'final-recipes'}/${id}/reactivate`);
      toast.success(t('common.active', { defaultValue: 'Active' }));
      setShowSubRecipeModal(false);
      setShowFinalRecipeModal(false);
      fetchData();
    } catch (error) {
      toast.error(extractErrorMessage(error) || t('common.error'));
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <BusyOverlay visible={isLoading} />

      {/* Page Header */}
      <PageHeader
          title={t('manufacturing.title')}
          subtitle={
              <>
                  <span>{t('manufacturing.subtitle')}</span>
                  {currentEstablishment?.name && (
                      <Badge>{currentEstablishment.name}</Badge>
                  )}
              </>
          }
          actions={
              <>
                  <button
                      onClick={() => {
                          if (activeTab === 'materials') {
                              setEditingMaterial(null);
                              setMaterialForm({ name: '', unit: 'Kg', quantity: 0, costPerUnit: 0, lowStockThreshold: 0 });
                              setShowMaterialModal(true);
                          } else if (activeTab === 'final') {
                              if (menuItems.length === 0 && !isLoading) {
                                  setConfirmConfig({
                                      isOpen: true,
                                      title: t('manufacturing.messages.noProducts'),
                                      message: t('manufacturing.messages.noProductsDesc'),
                                      type: 'warning',
                                      onConfirm: () => {
                                          navigate(`/dashboard/${locationSlug}/products`, { state: { openCreateModal: true } });
                                      }
                                  });
                                  return;
                              }
                              setEditingRecipe(null);
                              setFinalRecipeForm({ itemId: '', ingredients: [] });
                              setShowFinalRecipeModal(true);
                          } else {
                              setEditingRecipe(null);
                              setSubRecipeForm({ name: '', description: '', yield: 1, yieldUnit: 'Units', ingredients: [] });
                              setShowSubRecipeModal(true);
                          }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-mintcom-green text-black font-semibold text-sm hover:bg-mintcom-green/90 active:bg-mintcom-green/80 transition-colors"
                  >
                      <Plus size={18} strokeWidth={2.5} />
                      <span>{activeTab === 'materials' ? t('inventory.addIngredient', {defaultValue: 'Add Ingredient'}) : activeTab === 'final' ? t('manufacturing.linkProduct') : t('manufacturing.newPrep')}</span>
                  </button>
              </>
          }
      />

      {/* 3-PILLAR UNIFIED TABS WITH COUNT BADGES (matching POS) */}
      <div className="flex p-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => { setActiveTab('materials'); setPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'materials'
              ? 'bg-white dark:bg-[#1E293B] text-mintcom-green shadow-sm border border-gray-200/60 dark:border-white/10'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{t('inventory.materials', { defaultValue: 'Ingredients' })}</span>
          <span
            className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
              activeTab === 'materials'
                ? 'bg-mintcom-green/10 text-mintcom-green'
                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
            }`}
          >
            {rawMaterials.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('sub'); setPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'sub'
              ? 'bg-white dark:bg-[#1E293B] text-mintcom-green shadow-sm border border-gray-200/60 dark:border-white/10'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('manufacturing.prep', { defaultValue: 'Prep' })}</span>
          <span
            className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
              activeTab === 'sub'
                ? 'bg-mintcom-green/10 text-mintcom-green'
                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
            }`}
          >
            {subRecipes.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('final'); setPage(1); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === 'final'
              ? 'bg-white dark:bg-[#1E293B] text-mintcom-green shadow-sm border border-gray-200/60 dark:border-white/10'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('manufacturing.products', { defaultValue: 'Products' })}</span>
          <span
            className={`ml-1 px-2 py-0.5 text-xs font-bold rounded-full transition-colors ${
              activeTab === 'final'
                ? 'bg-mintcom-green/10 text-mintcom-green'
                : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
            }`}
          >
            {finalRecipes.length}
          </span>
        </button>
      </div>

      {/* TAB-SPECIFIC KPI OVERVIEW CARDS (matching Orders screen style) */}
      <div className="flex overflow-x-auto scrollbar-none gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible pb-2 sm:pb-0">
        {(activeTab === 'materials' ? [
          {
            label: t('manufacturing.totalMaterials', { defaultValue: 'Total Materials' }),
            value: rawCounts.total,
            isCurrency: false,
            sub: `${rawCounts.active} ${t('common.active', { defaultValue: 'Active' })}`,
            icon: biIcon('bi-box-seam'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: () => { setRawFilter('ALL'); setPage(1); },
            active: rawFilter === 'ALL',
          },
          {
            label: t('manufacturing.stockStatus', { defaultValue: 'Stock Health' }),
            value: rawCounts.low + rawCounts.out > 0 ? rawCounts.low + rawCounts.out : 0,
            isCurrency: false,
            sub: rawCounts.low + rawCounts.out > 0
              ? `${rawCounts.low} ${t('manufacturing.lowStock', { defaultValue: 'Low' })} · ${rawCounts.out} ${t('manufacturing.outOfStock', { defaultValue: 'Out' })}`
              : t('manufacturing.optimalLevels', { defaultValue: 'Optimal' }),
            icon: rawCounts.low + rawCounts.out > 0 ? biIcon('bi-exclamation-triangle') : biIcon('bi-shield-check'),
            color: rawCounts.low + rawCounts.out > 0 ? 'text-amber-500' : 'text-mintcom-green',
            bg: rawCounts.low + rawCounts.out > 0 ? 'bg-amber-500/10' : 'bg-mintcom-green/10',
            onClick: rawCounts.low + rawCounts.out > 0 ? () => { setRawFilter(rawCounts.low > 0 ? 'LOW' : 'OUT'); setPage(1); } : undefined,
            active: rawFilter === 'LOW' || rawFilter === 'OUT',
          },
          {
            label: t('manufacturing.inventoryValue', { defaultValue: 'Inventory Value' }),
            value: rawCounts.totalValue,
            isCurrency: true,
            sub: t('inventory.materials', { defaultValue: 'Ingredients' }),
            icon: biIcon('bi-wallet2'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: undefined,
            active: false,
          },
        ] : activeTab === 'sub' ? [
          {
            label: t('manufacturing.preparedRecipes', { defaultValue: 'Prep Recipes' }),
            value: intermediateCounts.total,
            isCurrency: false,
            sub: `${intermediateCounts.active} ${t('common.active', { defaultValue: 'Active' })}`,
            icon: biIcon('bi-layers'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: () => { setSubFilter('ALL'); setPage(1); },
            active: subFilter === 'ALL',
          },
          {
            label: t('manufacturing.readyToProduce', { defaultValue: 'Ready to Prep' }),
            value: intermediateCounts.ready,
            isCurrency: false,
            sub: `${intermediateCounts.shortage} ${t('manufacturing.ingredientShortage', { defaultValue: 'Shortage' })}`,
            icon: biIcon('bi-lightning-charge'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: () => { setSubFilter('READY'); setPage(1); },
            active: subFilter === 'READY',
          },
          {
            label: t('manufacturing.totalStockOnHand', { defaultValue: 'In-Stock Total' }),
            value: Number((intermediateCounts.totalStock || 0).toFixed(1)),
            isCurrency: false,
            sub: t('common.units', { defaultValue: 'units' }),
            icon: biIcon('bi-box-seam'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: undefined,
            active: false,
          },
        ] : [
          {
            label: t('manufacturing.allRecipes', { defaultValue: 'All Recipes' }),
            value: recipeCounts.total,
            isCurrency: false,
            sub: `${recipeCounts.active} ${t('common.active', { defaultValue: 'Active' })}`,
            icon: biIcon('bi-journal-bookmark'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: () => { setFinalFilter('ALL'); setPage(1); },
            active: finalFilter === 'ALL',
          },
          {
            label: t('manufacturing.productRecipes', { defaultValue: 'Product Recipes' }),
            value: recipeCounts.products,
            isCurrency: false,
            sub: t('manufacturing.products', { defaultValue: 'Products' }),
            icon: biIcon('bi-box-seam'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: () => { setFinalFilter('PRODUCTS'); setPage(1); },
            active: finalFilter === 'PRODUCTS',
          },
          {
            label: t('manufacturing.addonRecipes', { defaultValue: 'Add-on Recipes' }),
            value: recipeCounts.addons,
            isCurrency: false,
            sub: t('manufacturing.addonRecipes', { defaultValue: 'Add-on Recipes' }),
            icon: biIcon('bi-puzzle'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: () => { setFinalFilter('ADDONS'); setPage(1); },
            active: finalFilter === 'ADDONS',
          },
        ]).map((stat, i) => (
          <div
            key={i}
            onClick={stat.onClick}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border transition-all duration-300 overflow-hidden min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink
              ${stat.onClick ? 'cursor-pointer' : 'cursor-default'}
              ${stat.active
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'}`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg} ${stat.active ? 'opacity-20' : 'group-hover:opacity-10'}`} />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="dashboard-stat-title mb-1 truncate">{stat.label}</p>
                {typeof stat.value === 'string' && !stat.isCurrency ? (
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                    {stat.value}
                  </h3>
                ) : (
                  <StatValue
                    value={stat.value}
                    currency={stat.isCurrency ? currencySymbol : null}
                    isInteger={!stat.isCurrency}
                    className="text-2xl"
                  />
                )}
                {stat.sub && (
                  <p className="sentence-case-text text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">{stat.sub}</p>
                )}
              </div>
            </div>

            {/* Active Indicator Dot */}
            {stat.active && (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* FILTER & SEARCH BAR */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 w-full">
            <SearchInput
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              onClear={() => { setSearchQuery(''); setPage(1); }}
              placeholder={
                activeTab === 'materials'
                  ? formatInputPlaceholder(t('manufacturing.searchMaterials', { defaultValue: 'Search ingredients...' }), t('common.locale'))
                  : activeTab === 'sub'
                  ? formatInputPlaceholder(t('manufacturing.searchPrep', { defaultValue: 'Search prep items...' }), t('common.locale'))
                  : formatInputPlaceholder(t('manufacturing.searchRecipes', { defaultValue: 'Search product recipes...' }), t('common.locale'))
              }
              className="w-full"
            />
          </div>

          <div className="w-full sm:w-64 shrink-0">
            {activeTab === 'materials' ? (
              <SelectInput
                value={rawFilter === 'ALL' ? null : rawFilter}
                onChange={(val) => { setRawFilter((val as RawFilterType) || 'ALL'); setPage(1); }}
                options={[
                  { label: `${t('manufacturing.lowStock', { defaultValue: 'Low Stock' })} (${rawCounts.low})`, value: 'LOW' },
                  { label: `${t('manufacturing.outOfStock', { defaultValue: 'Out of Stock' })} (${rawCounts.out})`, value: 'OUT' },
                  ...(rawCounts.inactive > 0 ? [{ label: `${t('common.inactive', { defaultValue: 'Inactive' })} (${rawCounts.inactive})`, value: 'INACTIVE' }] : []),
                ]}
                allOptionLabel={`${t('manufacturing.allMaterials', { defaultValue: 'All Materials' })} (${rawCounts.active})`}
                placeholder={`${t('manufacturing.allMaterials', { defaultValue: 'All Materials' })} (${rawCounts.active})`}
                searchable={false}
              />
            ) : activeTab === 'sub' ? (
              <SelectInput
                value={subFilter === 'ALL' ? null : subFilter}
                onChange={(val) => { setSubFilter((val as SubFilterType) || 'ALL'); setPage(1); }}
                options={[
                  { label: `${t('manufacturing.readyToProduce', { defaultValue: 'Ready to Prep' })} (${intermediateCounts.ready})`, value: 'READY' },
                  { label: `${t('manufacturing.ingredientShortage', { defaultValue: 'Ingredient Shortage' })} (${intermediateCounts.shortage})`, value: 'SHORTAGE' },
                  ...(intermediateCounts.inactive > 0 ? [{ label: `${t('common.inactive', { defaultValue: 'Inactive' })} (${intermediateCounts.inactive})`, value: 'INACTIVE' }] : []),
                ]}
                allOptionLabel={`${t('manufacturing.allPrepared', { defaultValue: 'All Prepared' })} (${intermediateCounts.active})`}
                placeholder={`${t('manufacturing.allPrepared', { defaultValue: 'All Prepared' })} (${intermediateCounts.active})`}
                searchable={false}
              />
            ) : (
              <SelectInput
                value={finalFilter === 'ALL' ? null : finalFilter}
                onChange={(val) => { setFinalFilter((val as FinalFilterType) || 'ALL'); setPage(1); }}
                options={[
                  { label: `${t('manufacturing.productRecipes', { defaultValue: 'Product Recipes' })} (${recipeCounts.products})`, value: 'PRODUCTS' },
                  { label: `${t('manufacturing.addonRecipes', { defaultValue: 'Add-on Recipes' })} (${recipeCounts.addons})`, value: 'ADDONS' },
                  ...(recipeCounts.inactive > 0 ? [{ label: `${t('common.inactive', { defaultValue: 'Inactive' })} (${recipeCounts.inactive})`, value: 'INACTIVE' }] : []),
                ]}
                allOptionLabel={`${t('manufacturing.allRecipes', { defaultValue: 'All Recipes' })} (${recipeCounts.active})`}
                placeholder={`${t('manufacturing.allRecipes', { defaultValue: 'All Recipes' })} (${recipeCounts.active})`}
                searchable={false}
              />
            )}
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-mintcom-green/30 border-t-mintcom-green rounded-full animate-spin mb-4" />
            <p className="label-strong font-sans">{t('common.loading')}</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <EmptyState
            icon={Pizza}
            title={
              hasRecipeSearch
                ? t('common.noResults')
                : hasRecipeFilters
                  ? t('common.noFilteredResults')
                  : t('manufacturing.noRecipes')
            }
            description={
              hasRecipeSearch
                ? t('common.noMatchingResults', { entity: 'recipes', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })
                : hasRecipeFilters
                  ? t('common.noFilteredResultsDesc')
                  : t('manufacturing.noRecipesDesc')
            }
          />
        ) : (
          <div className="space-y-8">
            {activeTab === 'materials' ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                  {paginatedItems.map((item) => {
                    const m = item as RawMaterial;
                    const isLow = m.lowStockThreshold && m.quantity <= m.lowStockThreshold;
                    const active = isEntityActive(m);
                    return (
                      <div key={m.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border flex-shrink-0 ${isLow ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20'}`}>
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{m.name}</p>
                              <Badge tone={active ? 'green' : 'red'} className="mt-1">
                                {active ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            {active ? (
                              <>
                                <button onClick={() => { setEditingMaterial(m); setMaterialForm({ name: m.name, unit: m.unit, quantity: m.quantity, costPerUnit: m.costPerUnit, lowStockThreshold: m.lowStockThreshold || 0 }); setShowMaterialModal(true); }} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-mintcom-green transition-colors"><Edit2 size={14} /></button>
                                <button onClick={() => handleDeleteMaterial(m.id, m.name)} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-red-500 transition-colors" title={t('common.archive', { defaultValue: 'Archive' })}><Trash2 size={14} /></button>
                              </>
                            ) : (
                              <button onClick={() => handleReactivateMaterial(m.id)} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-mintcom-green transition-colors" title={t('common.reactivate', { defaultValue: 'Reactivate' })}><RefreshCcw size={14} /></button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2">
                            <p className="text-xs font-bold text-gray-400 mb-0.5">{t('inventory.quantity', {defaultValue: 'Quantity'})}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{(Number(m.quantity || 0)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-gray-500">{m.unit}</span></p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/[0.02]">
                      <tr className="border-b border-gray-200 dark:border-white/5">
                        <th className="px-6 py-4 text-start label-strong font-sans whitespace-nowrap">{t('inventory.form.name', {defaultValue: 'NAME'})}</th>
                        <th className="px-6 py-4 text-end label-strong font-sans whitespace-nowrap">{t('inventory.quantity', {defaultValue: 'QUANTITY'})}</th>
                        <th className="px-6 py-4 text-center label-strong font-sans whitespace-nowrap">{t('common.status_title', {defaultValue: 'STATUS'})}</th>
                        <th className="px-6 py-4 text-end label-strong font-sans whitespace-nowrap">{t('orders.table.actions', {defaultValue: 'ACTIONS'})}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {paginatedItems.map((item) => {
                        const m = item as RawMaterial;
                        const isLow = m.lowStockThreshold && m.quantity <= m.lowStockThreshold;
                        const active = isEntityActive(m);
                        return (
                          <tr key={m.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4 text-start">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border shrink-0 ${isLow ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20'}`}>
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-end">
                              <span className="font-bold text-gray-900 dark:text-white">{(Number(m.quantity || 0)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className="ml-1 text-xs font-medium text-gray-500">{m.unit}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Badge tone={active ? 'green' : 'red'}>
                                {active ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-end">
                              <div className="flex items-center justify-end gap-2 transition-opacity">
                                {active ? (
                                  <>
                                    <button onClick={() => { setEditingMaterial(m); setMaterialForm({ name: m.name, unit: m.unit, quantity: m.quantity, costPerUnit: m.costPerUnit, lowStockThreshold: m.lowStockThreshold || 0 }); setShowMaterialModal(true); }} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-mintcom-green transition-colors"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDeleteMaterial(m.id, m.name)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-red-500 transition-colors" title={t('common.archive', { defaultValue: 'Archive' })}><Trash2 size={14} /></button>
                                  </>
                                ) : (
                                  <button onClick={() => handleReactivateMaterial(m.id)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-mintcom-green transition-colors" title={t('common.reactivate', { defaultValue: 'Reactivate' })}><RefreshCcw size={14} /></button>
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
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={filteredMaterials.length}
                  itemsPerPage={itemsPerPage}
                  variant="footer"
                />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {paginatedItems.map((recipe) => {
                    const active = isEntityActive(recipe as any);
                    return (
                    <motion.div
                      layout
                      key={recipe.id}
                      className={`group relative bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:shadow-xl transition-all duration-300 overflow-hidden ${active ? '' : 'opacity-75'}`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="absolute left-0 top-0 h-full w-1 bg-mintcom-green opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm">
                              {activeTab === 'final' ? <Pizza size={20} /> : <Package size={20} />}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px] group-hover:text-mintcom-green transition-colors">
                                {activeTab === 'final' ? getFinalRecipeTargetName(recipe as FinalRecipe) : (recipe as SubRecipe).name}
                              </h3>
                              <p className="label-strong font-sans">{((recipe as any).ingredients || []).length} {t('manufacturing.ingredients')}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge tone={active ? 'green' : 'red'}>
                                  {active ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}
                                </Badge>
                                {activeTab === 'final' && (recipe as FinalRecipe).version && (
                                  <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-100 dark:bg-white/5 text-gray-500">
                                    v{(recipe as FinalRecipe).version}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 transition-all">
                            {active ? (
                              <>
                                <button onClick={() => activeTab === 'final' ? openEditFinalRecipe(recipe as FinalRecipe) : openEditSubRecipe(recipe as SubRecipe)} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-mintcom-green hover:bg-mintcom-green/10 transition-colors" title={t('common.edit')}><Edit2 size={16} /></button>
                                <button onClick={() => handleDeleteRecipe(recipe.id, activeTab)} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-mintcom-red hover:bg-mintcom-red/10 transition-colors" title={t('common.archive', { defaultValue: 'Archive' })}><Trash2 size={16} /></button>
                              </>
                            ) : (
                              <button onClick={() => handleReactivateRecipe(recipe.id, activeTab)} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-mintcom-green hover:bg-mintcom-green/10 transition-colors" title={t('common.reactivate', { defaultValue: 'Reactivate' })}><RefreshCcw size={16} /></button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3 mb-6 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                          {(Array.isArray((recipe as any).ingredients) ? (recipe as any).ingredients : []).slice(0, 3).map((ing: Record<string, any>, i: number) => {
                            const baseUnit = ing.rawMaterial?.unit || ing.subRecipe?.yieldUnit || 'Units';
                            let currentUnit = ing.selectedUnit || baseUnit;
                            if (!ing.selectedUnit) {
                              if (baseUnit === 'L' && ing.quantity < 1) currentUnit = 'Ml';
                              else if (baseUnit === 'Kg' && ing.quantity < 1) currentUnit = 'G';
                              else if (baseUnit === 'G' && ing.quantity < 1) currentUnit = 'Mg';
                            }
                            const displayQty = convertToDisplay(ing.quantity, baseUnit, currentUnit);
                            return (
                              <div key={i} className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{ing.rawMaterial?.name || ing.subRecipe?.name}</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white">
                                  {displayQty.toLocaleString(t('common.locale'), { maximumFractionDigits: 4 })} <span className="text-xs opacity-50">{currentUnit}</span>
                                </span>
                              </div>
                            );
                          })}
                          {((recipe as any).ingredients || []).length > 3 && <p className="text-xs font-black text-mintcom-green text-center mt-2 tracking-widest">+ {((recipe as any).ingredients || []).length - 3} {t('manufacturing.additionalElements')}</p>}
                        </div>

                        {activeTab === 'sub' && (
                          <button disabled={!active} onClick={() => openManufactureModal(recipe as SubRecipe)} className={`w-full py-2.5 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 ${active ? 'bg-mintcom-green text-black hover:bg-mintcom-green/90 active:bg-mintcom-green/80' : 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'}`}>
                            {t('manufacturing.produceBatch')}
                          </button>
                        )}
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                  totalItems={(activeTab === 'final' ? filteredFinal : filteredSub).length}
                  itemsPerPage={itemsPerPage}
                  className="mt-6"
                />
              </>
            )}
          </div>
        )}
      </AnimatePresence>

      <Modal isOpen={showMaterialModal} onClose={() => setShowMaterialModal(false)} size="sm">
        <ModalHeader
          title={editingMaterial ? t('inventory.editIngredient', {defaultValue: 'Edit Ingredient'}) : t('inventory.addIngredient', {defaultValue: 'Add Ingredient'})}
          onClose={() => setShowMaterialModal(false)}
        />
        <form id="material-form" onSubmit={handleMaterialSubmit}>
          <ModalBody className="space-y-6">
            <div>
              <label className="block text-sm font-normal text-gray-600 dark:text-gray-300 mb-3 px-1 flex items-center gap-2">{t('inventory.form.name', {defaultValue: 'Name'})} <span className="text-mintcom-red mx-1">*</span></label>
              <input maxLength={255} type="text" value={materialForm.name} onChange={(e) => { setMaterialForm({ ...materialForm, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }} className={`w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm shadow-sm border ${errors.name ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/[0.08]'} rounded-2xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-[3px] focus:ring-mintcom-green/10 focus:border-mintcom-green transition-all`} placeholder={t('inventory.form.namePlaceholder', {defaultValue: 'E.g. Flour'})} />
              {errors.name && <p className="mt-2 text-xs font-bold text-mintcom-red px-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-normal text-gray-600 dark:text-gray-300 mb-3 px-1 flex items-center gap-2">
                  {t('inventory.form.unit', {defaultValue: 'Unit'})}
                  <QuickInfo text={t('inventory.tips.unit', {defaultValue: 'The primary unit used to measure this ingredient (e.g., Kg, Liters).'})} />
                </label>
                <CustomSelect value={materialForm.unit} onChange={(val) => setMaterialForm({ ...materialForm, unit: val as string })} options={units.map(u => ({ value: u, label: u }))} />
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-600 dark:text-gray-300 mb-3 px-1 flex items-center gap-2">
                  {t('inventory.form.totalQuantity', {defaultValue: 'Total Quantity'})}
                  <QuickInfo text={t('inventory.tips.quantity', {defaultValue: 'Current stock available for this ingredient.'})} />
                </label>
                <div className="relative">
                  <input maxLength={255}
                    type="text"
                    inputMode="decimal"
                    value={materialForm.quantity === 0 ? '' : materialForm.quantity.toFixed(2)}
                    placeholder={formatInputPlaceholder("0.00", t('common.locale'))}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length > 19) return;
                      const numericValue = parseInt(val || '0', 10) / 100;
                      setMaterialForm({ ...materialForm, quantity: numericValue });
                    }}
                    className="w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm shadow-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-[3px] focus:ring-mintcom-green/10 focus:border-mintcom-green transition-all"
                  />
                  <p className="mt-2 text-[10px] font-bold text-mintcom-green tracking-widest px-1">{t('attributes.form.atmStyle', { defaultValue: 'Digits shift right to left (ATM style)' })}</p>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            {editingMaterial && !isEntityActive(editingMaterial) ? (
              <>
                <ModalCancelButton onClick={() => setShowMaterialModal(false)} disabled={isSubmitting}>
                  {t('common.cancel', { defaultValue: 'Cancel' })}
                </ModalCancelButton>
                <ModalSubmitButton type="button" loading={isSubmitting} onClick={() => handleReactivateMaterial(editingMaterial.id)}>
                  <RefreshCcw size={16} />
                  {t('common.reactivate', { defaultValue: 'Reactivate' })}
                </ModalSubmitButton>
              </>
            ) : (
              <>
                {editingMaterial && isEntityActive(editingMaterial) && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaterialModal(false);
                      handleDeleteMaterial(editingMaterial.id, editingMaterial.name);
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-5 py-3.5 border border-mintcom-red/20 text-mintcom-red font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 hover:bg-mintcom-red/5"
                  >
                    <Trash2 size={16} />
                    {t('common.archive', { defaultValue: 'Archive' })}
                  </button>
                )}
                <ModalSubmitButton form="material-form" loading={isSubmitting}>
                  {t('common.save', {defaultValue: 'Save'})}
                </ModalSubmitButton>
              </>
            )}
          </ModalFooter>
        </form>
      </Modal>

      <Modal isOpen={showSubRecipeModal} onClose={() => setShowSubRecipeModal(false)} size="lg">
        <ModalHeader
          title={editingRecipe ? t('manufacturing.formula.edit') : t('manufacturing.formula.new')}
          onClose={() => setShowSubRecipeModal(false)}
        />
        <ModalBody className="space-y-6 px-4 sm:px-6">
          <div>
            <label className="block text-sm font-normal text-gray-600 dark:text-gray-300 mb-3 px-1 flex items-center gap-2">
              {t('manufacturing.formula.name')} <span className="text-mintcom-red mx-1">*</span>
            </label>
            <input maxLength={255}
              type="text"
              value={subRecipeForm.name}
              onChange={(e) => {
                setSubRecipeForm({ ...subRecipeForm, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              className={`w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm shadow-sm border ${errors.name ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/[0.08]'} rounded-2xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-[3px] focus:ring-mintcom-green/10 focus:border-mintcom-green transition-all`}
              placeholder={formatInputPlaceholder(t('manufacturing.formula.namePlaceholder'), t('common.locale'))}
            />
            {errors.name && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="block text-sm font-normal text-gray-600 dark:text-gray-300 mb-3 px-1 flex items-center gap-2">
                {t('manufacturing.formula.yield')}
                <QuickInfo text={t('manufacturing.tips.yield', {defaultValue: 'How much of the Prep this recipe makes (e.g., 5 Liters of sauce).'})} />
              </label>
              <input
                maxLength={255}
                type="number"
                min="0"
                value={subRecipeForm.yield}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => {
                  if (e.target.value.length > 19) return;
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0) {
                    setSubRecipeForm({ ...subRecipeForm, yield: val });
                  } else if (e.target.value === '') {
                    setSubRecipeForm({ ...subRecipeForm, yield: 0 });
                  }
                }}
                className="w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-sm text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-mintcom-green/20 transition-all outline-none shadow-sm hover:border-mintcom-green/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.06]"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-normal text-gray-600 dark:text-gray-300 mb-3 px-1 flex items-center gap-2">
                {formatInputLabel(t('manufacturing.formula.unit'), t('common.locale'))}
              </label>
              <CustomSelect
                value={subRecipeForm.yieldUnit}
                onChange={(val) => setSubRecipeForm({ ...subRecipeForm, yieldUnit: String(val) })}
                options={units.map(u => ({ label: t(`inventory.units.${u.toLowerCase()}`, { defaultValue: u }), value: u }))}
                className="w-full"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-normal text-gray-600 dark:text-gray-300 flex items-center gap-2">{t('manufacturing.ingredients', {defaultValue: 'Ingredients'})}</label>
              <span className="label-strong font-sans bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10">{subRecipeForm.ingredients.length.toLocaleString(t('common.locale'))} {t('manufacturing.items', { defaultValue: 'items' })}</span>
            </div>

            <div className="space-y-3 min-h-[40px]">
              <AnimatePresence>
                {subRecipeForm.ingredients.map((ing, index) => {
                  const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                  const baseUnit = material?.unit || 'units';
                  const availableUnits = getCompatibleUnits(baseUnit);
                  const currentUnit = ing.selectedUnit || baseUnit;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={index}
                      className="flex gap-2 items-center p-2.5 sm:p-3 bg-gray-50 dark:bg-white/[0.04] rounded-2xl border border-gray-200 dark:border-white/10 min-w-0"
                    >
                      <CustomSelect
                        size="compact"
                        value={ing.rawMaterialId}
                        onChange={(val) => {
                          const stringVal = String(val);
                          const m = rawMaterials.find(rm => rm.id === stringVal);
                          const updated = [...subRecipeForm.ingredients];
                          updated[index].rawMaterialId = stringVal;
                          updated[index].selectedUnit = m?.unit;
                          updated[index].quantity = 0;
                          setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                        }}
                        options={(material && !isEntityActive(material) ? [material, ...activeRawMaterials] : activeRawMaterials).map(m => ({ label: `${m.name} (${m.unit})`, value: m.id }))}
                        placeholder={formatInputPlaceholder(t('manufacturing.formula.selectItem'), t('common.locale'))}
                        className="flex-1 min-w-0"
                      />

                      <div className="flex h-11 items-center bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden w-28 sm:w-32 shrink-0 focus-within:border-mintcom-green focus-within:ring-[3px] focus-within:ring-mintcom-green/10 transition-all">
                        <input
                          maxLength={255}
                          type="number"
                          min="0"
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e') {
                              e.preventDefault();
                            }
                          }}
                          value={ing.quantity || ''}
                          onChange={(e) => {
                            if (e.target.value.length > 19) return;
                            const updated = [...subRecipeForm.ingredients];
                            updated[index].quantity = parseFloat(e.target.value) || 0;
                            setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                          }}
                          placeholder={formatInputPlaceholder("Qty", t('common.locale'))}
                          className="w-full h-full min-w-0 px-3 py-0 bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
                        />
                        {availableUnits.length > 1 ? (
                          <div className="relative border-l border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-full flex items-center shrink-0">
                            <select
                              value={currentUnit}
                              onChange={(e) => {
                                const newUnit = e.target.value;
                                const updated = [...subRecipeForm.ingredients];
                                updated[index].selectedUnit = newUnit;
                                setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                              }}
                              className="h-full appearance-none bg-transparent pl-2.5 pr-5 py-0 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                            >
                              {availableUnits.map(u => (
                                <option key={u} value={u} className="bg-white dark:bg-[#1E293B]">{u}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="h-full px-3 bg-gray-50 dark:bg-white/5 border-l border-gray-200 dark:border-white/10 text-xs font-bold text-gray-400 flex items-center shrink-0">
                            {baseUnit}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = subRecipeForm.ingredients.filter((_, i) => i !== index);
                          setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                        }}
                        className="h-11 w-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-mintcom-red hover:bg-mintcom-red/10 border border-transparent hover:border-mintcom-red/20 transition-all shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubRecipeForm({
                  ...subRecipeForm,
                  ingredients: [...subRecipeForm.ingredients, { rawMaterialId: '', quantity: 0 }],
                });
              }}
              className="w-full py-3 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-xs font-bold text-gray-500 hover:text-mintcom-green hover:border-mintcom-green/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <span>{t('manufacturing.formula.addIngredient')}</span>
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalCancelButton onClick={() => setShowSubRecipeModal(false)}>
            {t('common.cancel')}
          </ModalCancelButton>
          <ModalSubmitButton type="button" loading={isSubmitting} onClick={handleSubRecipeSubmit}>
            {t('common.save')}
          </ModalSubmitButton>
        </ModalFooter>
      </Modal>

      <Modal isOpen={showFinalRecipeModal} onClose={() => setShowFinalRecipeModal(false)} size="lg">
        <ModalHeader
          title={editingRecipe ? t('manufacturing.recipe.edit') : t('manufacturing.recipe.new')}
          onClose={() => setShowFinalRecipeModal(false)}
        />
        <ModalBody className="space-y-6 px-4 sm:px-6">
          <div>
            <label className="block text-sm font-normal text-gray-600 dark:text-gray-300 mb-3 px-1 flex items-center gap-2">
              {t('manufacturing.recipe.product')} <span className="text-mintcom-red mx-1">*</span>
            </label>
            <CustomSelect
              value={finalRecipeForm.itemId}
              onChange={(val) => {
                setFinalRecipeForm({ ...finalRecipeForm, itemId: String(val) });
                if (errors.itemId) setErrors({ ...errors, itemId: '' });
              }}
              options={products.map(p => ({ label: p.name, value: p.id }))}
              placeholder={formatInputPlaceholder(t('manufacturing.recipe.selectProduct'), t('common.locale'))}
              disabled={!!editingRecipe}
              className="w-full"
            />
            {errors.itemId && <p className="mt-1 text-xs font-bold text-mintcom-red">{errors.itemId}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <label className="text-sm font-normal text-gray-600 dark:text-gray-300 flex items-center gap-2">{t('manufacturing.ingredients', {defaultValue: 'Ingredients'})}</label>
              <span className="label-strong font-sans bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10">{finalRecipeForm.ingredients.length.toLocaleString(t('common.locale'))} {t('manufacturing.items', { defaultValue: 'items' })}</span>
            </div>

            <div className="space-y-3 min-h-[40px]">
              <AnimatePresence>
                {finalRecipeForm.ingredients.map((ing, index) => {
                  const isRaw = ing.type === 'raw';
                  const item = isRaw ? rawMaterials.find(m => m.id === ing.rawMaterialId) : subRecipes.find(s => s.id === ing.subRecipeId);
                  const baseUnit = isRaw ? (item as RawMaterial)?.unit || 'units' : (item as SubRecipe)?.yieldUnit || 'units';
                  const availableUnits = getCompatibleUnits(baseUnit);
                  const currentUnit = ing.selectedUnit || baseUnit;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={index}
                      className="flex gap-2 items-center p-2.5 sm:p-3 bg-gray-50 dark:bg-white/[0.04] rounded-2xl border border-gray-200 dark:border-white/10 min-w-0"
                    >
                      <div className="flex h-11 items-center bg-white dark:bg-[#1E293B] rounded-xl p-1 border border-gray-200 dark:border-white/10 shadow-sm shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...finalRecipeForm.ingredients];
                            updated[index] = { type: 'raw', rawMaterialId: '', quantity: 0 };
                            setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                          }}
                          className={`h-full px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${ing.type === 'raw' ? 'bg-mintcom-green text-black font-black shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                        >
                          RAW
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...finalRecipeForm.ingredients];
                            updated[index] = { type: 'sub', subRecipeId: '', quantity: 0 };
                            setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                          }}
                          className={`h-full px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${ing.type === 'sub' ? 'bg-mintcom-green text-black font-black shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                        >
                          PREP
                        </button>
                      </div>

                      <CustomSelect
                        size="compact"
                        value={(ing.type === 'raw' ? ing.rawMaterialId : ing.subRecipeId) || ''}
                        onChange={(val) => {
                          const stringVal = String(val);
                          const updated = [...finalRecipeForm.ingredients];
                          if (ing.type === 'raw') {
                            const m = rawMaterials.find(rm => rm.id === stringVal);
                            updated[index].rawMaterialId = stringVal;
                            updated[index].selectedUnit = m?.unit;
                          } else {
                            const s = subRecipes.find(sr => sr.id === stringVal);
                            updated[index].subRecipeId = stringVal;
                            updated[index].selectedUnit = s?.yieldUnit;
                          }
                          updated[index].quantity = 0;
                          setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                        }}
                        options={ing.type === 'raw'
                          ? activeRawMaterials.map(m => ({ label: `${m.name} (${m.unit})`, value: m.id }))
                          : activeSubRecipes.map(s => ({ label: `${s.name} (${s.yieldUnit})`, value: s.id }))
                        }
                        placeholder={formatInputPlaceholder(t('manufacturing.recipe.selectComponent'), t('common.locale'))}
                        className="flex-1 min-w-0"
                      />

                      <div className="flex h-11 items-center bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden w-28 sm:w-32 shrink-0 focus-within:border-mintcom-green focus-within:ring-[3px] focus-within:ring-mintcom-green/10 transition-all">
                        <input
                          maxLength={255}
                          type="number"
                          min="0"
                          onKeyDown={(e) => {
                            if (e.key === '-' || e.key === 'e') {
                              e.preventDefault();
                            }
                          }}
                          value={ing.quantity || ''}
                          onChange={(e) => {
                            if (e.target.value.length > 19) return;
                            const updated = [...finalRecipeForm.ingredients];
                            updated[index].quantity = parseFloat(e.target.value) || 0;
                            setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                          }}
                          placeholder={formatInputPlaceholder("Qty", t('common.locale'))}
                          className="w-full h-full min-w-0 px-3 py-0 bg-transparent text-sm font-bold text-gray-900 dark:text-white outline-none"
                        />
                        {availableUnits.length > 1 ? (
                          <div className="relative border-l border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-full flex items-center shrink-0">
                            <select
                              value={currentUnit}
                              onChange={(e) => {
                                const newUnit = e.target.value;
                                const updated = [...finalRecipeForm.ingredients];
                                updated[index].selectedUnit = newUnit;
                                setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                              }}
                              className="h-full appearance-none bg-transparent pl-2.5 pr-5 py-0 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                            >
                              {availableUnits.map(u => (
                                <option key={u} value={u} className="bg-white dark:bg-[#1E293B]">{u}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <span className="h-full px-3 bg-gray-50 dark:bg-white/5 border-l border-gray-200 dark:border-white/10 text-xs font-bold text-gray-400 flex items-center shrink-0">
                            {baseUnit}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setFinalRecipeForm({
                            ...finalRecipeForm,
                            ingredients: finalRecipeForm.ingredients.filter((_, i) => i !== index),
                          });
                        }}
                        className="h-11 w-11 flex items-center justify-center rounded-xl text-gray-400 hover:text-mintcom-red hover:bg-mintcom-red/10 border border-transparent hover:border-mintcom-red/20 transition-all shrink-0"
                      >
                        <Trash2 size={18} />
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={() => {
                setFinalRecipeForm({
                  ...finalRecipeForm,
                  ingredients: [...finalRecipeForm.ingredients, { type: 'raw', rawMaterialId: '', quantity: 0 }],
                });
              }}
              className="w-full py-3 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-xs font-bold text-gray-500 hover:text-mintcom-green hover:border-mintcom-green/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              <span>{t('manufacturing.recipe.addIngredient')}</span>
            </button>
          </div>
        </ModalBody>
        <ModalFooter>
          <ModalCancelButton onClick={() => setShowFinalRecipeModal(false)}>
            {t('common.cancel')}
          </ModalCancelButton>
          <ModalSubmitButton type="button" loading={isSubmitting} onClick={handleFinalRecipeSubmit}>
            {t('common.save')}
          </ModalSubmitButton>
        </ModalFooter>
      </Modal>

      <Modal isOpen={showManufactureModal && !!manufactureRecipe} onClose={() => setShowManufactureModal(false)} size="sm">
        {manufactureRecipe && (
          <>
            <ModalHeader
              title={t('manufacturing.produceBatch')}
              onClose={() => setShowManufactureModal(false)}
            />
            <ModalBody className="pt-6 sm:pt-8">
              <p className="text-sm font-medium text-gray-500 mb-6">{t('manufacturing.produceSubtitle', { name: manufactureRecipe.name })}</p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('manufacturing.numberOfBatches')}</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setNumBatches(Math.max(1, numBatches - 1))} className="p-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors font-bold text-lg">-</button>
                    <input maxLength={255} type="number" min="1" value={numBatches} onChange={(e) => setNumBatches(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 text-center font-black text-xl py-2 bg-transparent text-gray-900 dark:text-white outline-none border-b-2 border-mintcom-green" />
                    <button type="button" onClick={() => setNumBatches(numBatches + 1)} className="p-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-colors font-bold text-lg">+</button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-100 dark:border-white/5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-bold">{t('manufacturing.totalYield')}:</span>
                    <span className="text-mintcom-green font-black">{numBatches * manufactureRecipe.yield} {manufactureRecipe.yieldUnit}</span>
                  </div>
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <ModalCancelButton onClick={() => setShowManufactureModal(false)}>
                {t('common.cancel')}
              </ModalCancelButton>
              <ModalSubmitButton type="button" loading={isSubmitting} onClick={handleManufacture}>
                {t('manufacturing.produceNow')}
              </ModalSubmitButton>
            </ModalFooter>
          </>
        )}
      </Modal>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
      />
    </div>
  );
}

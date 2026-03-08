import { useState, useEffect, useMemo } from 'react';
import { useNavigate , useParams } from 'react-router-dom';
import {
  Plus,
  Package,
  Pizza,
  Edit2,
  Trash2,
  X,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CustomSelect } from '../../components/CustomSelect';
import { QuickInfo } from '../../components/QuickInfo';
import { SearchInput, Pagination } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useAuth } from '../../context/AuthContext';

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
  // Convert both to common base (g or ml) then to target
  // Qty (BaseUnit) * Factor(Base) = CommonBase
  // CommonBase / Factor(Target) = Qty(Target)
  return (baseQty * baseInfo.factor) / targetInfo.factor;
};

const convertToBase = (displayQty: number, baseUnit: string, displayUnit: string) => {
  const baseInfo = UNIT_CONVERSIONS[baseUnit];
  const displayInfo = UNIT_CONVERSIONS[displayUnit];
  if (!baseInfo || !displayInfo || baseInfo.type !== displayInfo.type) return displayQty;
  // Qty(Display) * Factor(Display) = CommonBase
  // CommonBase / Factor(Base) = Qty(Base)
  return (displayQty * displayInfo.factor) / baseInfo.factor;
};

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  quantity: number;
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
  itemId: string;
  item?: { name: string };
  ingredients: FinalRecipeIngredient[];
}

interface MenuItem {
  id: string;
  name: string;
}

export function RecipesPage() {
  const { t } = useTranslation();
    const { currentEstablishment } = useAuth();
  usePermissionGuard(['manage_inventory']);
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'final' | 'sub'>('final');
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [finalRecipes, setFinalRecipes] = useState<FinalRecipe[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 9;

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
  const [activeDropdown, setActiveDropdown] = useState<{ index: number; type: 'sub' | 'final' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const units = ['Units', 'Kg', 'G', 'L', 'Ml', 'Pcs', 'Portions', 'Servings'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [subRes, finalRes, materialsRes, itemsRes] = await Promise.all([
        api.get('/api/manufacturing/sub-recipes'),
        api.get('/api/manufacturing/final-recipes'),
        api.get('/api/manufacturing/raw-materials'),
        api.get('/api/items'),
      ]);
      setSubRecipes(subRes.data || []);
      setFinalRecipes(finalRes.data || []);
      setRawMaterials(materialsRes.data || []);
      setMenuItems(itemsRes.data || []);
    } catch {
      toast.error(t('manufacturing.messages.syncFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSub = useMemo(() => (Array.isArray(subRecipes) ? subRecipes : []).filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())), [subRecipes, searchQuery]);
  const filteredFinal = useMemo(() => (Array.isArray(finalRecipes) ? finalRecipes : []).filter(r => r.item?.name?.toLowerCase().includes(searchQuery.toLowerCase())), [finalRecipes, searchQuery]);

  const totalPages = Math.ceil(((activeTab === 'final' ? filteredFinal : filteredSub) || []).length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const items = activeTab === 'final' ? filteredFinal : filteredSub;
    return (Array.isArray(items) ? items : []).slice(start, start + itemsPerPage);
  }, [activeTab, filteredFinal, filteredSub, page]);

  const products = (Array.isArray(menuItems) ? menuItems : []).filter(p => !(Array.isArray(finalRecipes) ? finalRecipes : []).some(r => r.itemId === p.id) || (editingRecipe as Record<string, any>)?.itemId === p.id);

  const openEditSubRecipe = (recipe: SubRecipe) => {
    setEditingRecipe(recipe);
    setSubRecipeForm({
      name: recipe.name,
      description: recipe.description || '',
      yield: recipe.yield,
      yieldUnit: recipe.yieldUnit,
      ingredients: recipe.ingredients.map(ing => {
        const baseUnit = ing.rawMaterial?.unit || 'Units';
        let unit = baseUnit;
        if (baseUnit === 'L' && ing.quantity < 1) unit = 'Ml';
        else if (baseUnit === 'Kg' && ing.quantity < 1) unit = 'G';
        else if (baseUnit === 'G' && ing.quantity < 1) unit = 'Mg';

        return {
          rawMaterialId: ing.rawMaterialId,
          quantity: ing.quantity,
          selectedUnit: unit
        };
      })
    });
    setErrors({});
    setShowSubRecipeModal(true);
  };

  const openEditFinalRecipe = (recipe: FinalRecipe) => {
    setEditingRecipe(recipe);
    setFinalRecipeForm({
      itemId: recipe.itemId,
      ingredients: recipe.ingredients.map(ing => {
        const baseUnit = ing.rawMaterialId ? ing.rawMaterial?.unit : ing.subRecipe?.yieldUnit;
        let unit = baseUnit || 'Units';
        if (unit === 'L' && ing.quantity < 1) unit = 'Ml';
        else if (unit === 'Kg' && ing.quantity < 1) unit = 'G';
        else if (unit === 'G' && ing.quantity < 1) unit = 'Mg';

        return {
          rawMaterialId: ing.rawMaterialId,
          subRecipeId: ing.subRecipeId,
          quantity: ing.quantity,
          type: ing.rawMaterialId ? 'raw' : 'sub',
          selectedUnit: unit
        };
      })
    });
    setErrors({});
    setShowFinalRecipeModal(true);
  };

  const openManufactureModal = (recipe: SubRecipe) => {
    setManufactureRecipe(recipe);
    setNumBatches(1);
    setShowManufactureModal(true);
  };

  const handleSaveSubRecipe = async () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!subRecipeForm.name.trim()) newErrors.name = t('common.required');
    if (!subRecipeForm.yield || subRecipeForm.yield <= 0) newErrors.yield = t('manufacturing.formula.yield');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecipe) await api.put(`/api/manufacturing/sub-recipes/${editingRecipe.id}`, subRecipeForm);
      else await api.post('/api/manufacturing/sub-recipes', subRecipeForm);
      toast.success(t('manufacturing.messages.saveSuccess'));
      setShowSubRecipeModal(false);
      fetchData();
    } catch {
      toast.error(t('manufacturing.messages.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFinalRecipe = async () => {
    setErrors({});
    if (!finalRecipeForm.itemId) {
      setErrors({ itemId: t('common.required') });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingRecipe) await api.put(`/api/manufacturing/final-recipes/${editingRecipe.id}`, finalRecipeForm);
      else await api.post('/api/manufacturing/final-recipes', finalRecipeForm);
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
    setConfirmConfig({
      isOpen: true,
      title: t('common.delete'),
      message: t('manufacturing.messages.deleteConfirm'),
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/manufacturing/${type === 'sub' ? 'sub-recipes' : 'final-recipes'}/${id}`);
          toast.success(t('manufacturing.messages.removed'));
          fetchData();
        } catch {
          toast.error(t('common.error'));
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
              </div>
              <span className="text-xs font-bold text-paymint-green tracking-widest">{t('dashboard.shiftStatus.live')}</span>
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">{t('manufacturing.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('manufacturing.subtitle')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeTab === 'final') {
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
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>{activeTab === 'final' ? t('manufacturing.linkProduct') : t('manufacturing.newPrep')}</span>
          </button>
        </div>
      </div>




      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <SearchInput
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            onClear={() => { setSearchQuery(''); setPage(1); }}
            placeholder={t('manufacturing.search')}
            className="w-full"
          />
        </div>
        <div className="flex p-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
          <button onClick={() => { setActiveTab('final'); setPage(1); }} className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'final' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{t('manufacturing.products')}</button>
          <button onClick={() => { setActiveTab('sub'); setPage(1); }} className={`px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'sub' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{t('manufacturing.prep')}</button>
        </div>
      </div>


      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black tracking-widest text-gray-400">Loading...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
              <Pizza size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('manufacturing.noRecipes')}</h3>
            <p className="text-sm font-bold text-gray-500 max-w-xs">{t('manufacturing.noRecipesDesc')}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedItems.map((recipe) => (
                <motion.div
                  layout
                  key={recipe.id}
                  className="group relative bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute left-0 top-0 h-full w-1 bg-paymint-green opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm">
                          {activeTab === 'final' ? <Pizza size={20} /> : <Package size={20} />}
                        </div>
                                                                          <div>
                                                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate max-w-[150px] group-hover:text-paymint-green transition-colors">
                                                                              {activeTab === 'final' ? (recipe as FinalRecipe).item?.name : (recipe as SubRecipe).name}
                                                                            </h3>
                                                                            <p className="text-xs font-black text-gray-400 tracking-widest">{(recipe.ingredients || []).length} {t('manufacturing.ingredients')}</p>
                                                                          </div>
                                                                        </div>
                                                                        <div className="flex gap-1 transition-all">
                                                                          <button onClick={() => activeTab === 'final' ? openEditFinalRecipe(recipe as FinalRecipe) : openEditSubRecipe(recipe as SubRecipe)} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10 transition-colors" title={t('common.edit')}><Edit2 size={16} /></button>
                                                                          <button onClick={() => handleDeleteRecipe(recipe.id, activeTab)} className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10 transition-colors" title={t('common.delete')}><Trash2 size={16} /></button>
                                                                        </div>
                                                                      </div>
                                              <div className="space-y-3 mb-6 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/5">
                                                {(Array.isArray(recipe.ingredients) ? recipe.ingredients : []).slice(0, 3).map((ing: Record<string, any>, i: number) => {
                                                  const baseUnit = ing.rawMaterial?.unit || ing.subRecipe?.yieldUnit || 'Units';

                                                  let currentUnit = ing.selectedUnit || baseUnit;
                                                  // Smart scaling if no explicit unit is saved and value is fractional
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
                                                {(recipe.ingredients || []).length > 3 && <p className="text-xs font-black text-paymint-green text-center mt-2 tracking-widest">+ {(recipe.ingredients || []).length - 3} {t('manufacturing.additionalElements')}</p>}
                                              </div>

                    {activeTab === 'sub' && (
                      <button onClick={() => openManufactureModal(recipe as SubRecipe)} className="w-full py-3 bg-paymint-green text-black font-bold rounded-xl hover:bg-emerald-400 text-xs transition-all flex items-center justify-center gap-2 shadow-sm">
                        {t('manufacturing.produceBatch')}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubRecipeModal && (
          <div className="fixed inset-0 z-[60] popup-surface flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingRecipe ? t('manufacturing.formula.edit') : t('manufacturing.formula.new')}</h2>
                <button onClick={() => setShowSubRecipeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1 flex items-center">
                    {t('manufacturing.formula.name')} <span className="text-paymint-red mx-1">*</span>
                    <QuickInfo text={t('manufacturing.formula.namePlaceholder')} />
                  </label>
                  <input
                    type="text"
                    value={subRecipeForm.name}
                    onChange={(e) => {
                      setSubRecipeForm({ ...subRecipeForm, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-5 py-3.5 bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder={t('manufacturing.formula.namePlaceholder')}
                  />
                  {errors.name && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1 flex items-center">
                      {t('manufacturing.formula.yield')}
                      <QuickInfo text={t('manufacturing.totalOutput')} />
                    </label>
                    <input
                      type="number"
                      value={subRecipeForm.yield}
                      onChange={(e) => setSubRecipeForm({ ...subRecipeForm, yield: parseFloat(e.target.value) || 0 })}
                      className="w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-sm text-gray-900 dark:text-white font-bold focus:ring-2 focus:ring-paymint-green/20 transition-all outline-none shadow-sm hover:border-paymint-green/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.06]"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-black text-gray-400 tracking-[0.2em] mb-3 px-1 flex items-center">
                      {t('manufacturing.formula.unit')}
                    </label>
                                            <CustomSelect
                                              value={subRecipeForm.yieldUnit}
                                              onChange={(val) => setSubRecipeForm({ ...subRecipeForm, yieldUnit: String(val) })}
                                              options={units.map(u => ({ label: t(`inventory.units.${u.toLowerCase()}`, { defaultValue: u }), value: u }))}
                                              className="w-full"
                                            />                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center">
                      <label className="text-xs font-black text-gray-400 tracking-[0.2em]">{t('manufacturing.ingredients')}</label>
                      <QuickInfo text={t('manufacturing.formula.noIngredients')} />
                    </div>
                    <span className="text-xs font-black text-gray-400 tracking-widest bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10">{subRecipeForm.ingredients.length.toLocaleString(t('common.locale'))} {t('dashboard.stats.orders')}</span>
                  </div>

                  <div className="space-y-3 min-h-[40px]">
                    <AnimatePresence>
                      {subRecipeForm.ingredients.map((ing, index) => {
                        const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                        const baseUnit = material?.unit || 'units';
                        const availableUnits = getCompatibleUnits(baseUnit);
                        const currentUnit = ing.selectedUnit || baseUnit;
                        const displayValue = convertToDisplay(ing.quantity, baseUnit, currentUnit);

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={index}
                            className="flex gap-3 items-center p-3 bg-gray-50 dark:bg-white/[0.04] rounded-2xl border border-gray-200 dark:border-white/10"
                          >
                            <CustomSelect
                              value={ing.rawMaterialId}
                              onChange={(val) => {
                                const stringVal = String(val);
                                const m = rawMaterials.find(rm => rm.id === stringVal);
                                const updated = [...subRecipeForm.ingredients];
                                updated[index].rawMaterialId = stringVal;
                                updated[index].selectedUnit = m?.unit; // Reset unit on material change
                                updated[index].quantity = 0; // Reset quantity on material change
                                setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                              }}
                              options={rawMaterials.map(m => ({ label: `${m.name} (${m.unit})`, value: m.id }))}
                              placeholder={t('manufacturing.formula.selectItem')}
                              className="flex-[2]"
                            />

                            <div className="flex bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-300 dark:border-white/10 overflow-hidden w-40">
                              <input
                                type="number"
                                value={displayValue === 0 ? '' : displayValue}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  const baseVal = convertToBase(val, baseUnit, currentUnit);
                                  const updated = [...subRecipeForm.ingredients];
                                  updated[index].quantity = baseVal;
                                  setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                                }}
                                className="w-16 flex-1 px-3 py-3.5 bg-transparent text-right font-black text-paymint-green focus:outline-none text-sm"
                                placeholder="0"
                              />
                              <div className="border-l border-gray-300 dark:border-white/10">
                                <select
                                  className="h-full px-2 bg-transparent text-xs font-black text-gray-500 hover:text-black dark:hover:text-white cursor-pointer outline-none appearance-none"
                                  value={currentUnit}
                                  onChange={(e) => {
                                    const newUnit = e.target.value;
                                    const newBaseVal = convertToBase(displayValue, baseUnit, newUnit);
                                    const updated = [...subRecipeForm.ingredients];
                                    updated[index].selectedUnit = newUnit;
                                    updated[index].quantity = newBaseVal;
                                    setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                                  }}
                                >
                                  {availableUnits.map(u => (
                                    <option key={u} value={u} className="bg-white dark:bg-[#1E293B] text-black dark:text-white">{t(`inventory.units.${u.toLowerCase()}`, { defaultValue: u })}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <button
                              onClick={() => setSubRecipeForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }))}
                              className="p-2 text-paymint-red hover:bg-paymint-red/10 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {subRecipeForm.ingredients.length === 0 && (
                      <div className="py-8 text-center border-2 border-dashed border-gray-200 dark:border-white/5 rounded-2xl">
                        <Package size={24} className="mx-auto text-gray-300 mb-2 opacity-50" />
                        <p className="text-xs font-black text-gray-400 tracking-widest">{t('manufacturing.formula.noIngredients')}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        if (rawMaterials.length === 0 && !isLoading) {
                          setConfirmConfig({
                            isOpen: true,
                            title: t('manufacturing.messages.noMaterials'),
                            message: t('manufacturing.messages.noMaterialsDesc'),
                            type: 'warning',
                            onConfirm: () => {
                              navigate(`/dashboard/${locationSlug}/materials`, { state: { openCreateModal: true } });
                            }
                          });
                          return;
                        }
                        setSubRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { rawMaterialId: '', quantity: 0 }] }));
                      }}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl text-xs font-black text-paymint-green tracking-widest hover:bg-paymint-green/5 hover:border-paymint-green/30 transition-all group"
                    >
                      <Plus size={16} className="group-hover:scale-125 transition-transform" />
                      <span>{t('manufacturing.formula.addMaterial')}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-gray-200 dark:border-white/5">
                <button onClick={handleSaveSubRecipe} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:bg-emerald-400 tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-paymint-green/20">
                  {t('manufacturing.formula.saveFormula')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinalRecipeModal && (
          <div className="fixed inset-0 z-[60] popup-surface flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-lg max-h-[85vh] flex flex-col overflow-visible shadow-2xl">
              <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingRecipe ? t('manufacturing.formula.editMap') : t('manufacturing.formula.map')}</h2>
                <button onClick={() => setShowFinalRecipeModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div>
                  <div className="flex items-center mb-1">
                    <label className="block text-xs font-black text-gray-400 tracking-[0.2em]">{t('manufacturing.formula.targetItem')} <span className="text-paymint-red">*</span></label>
                    <QuickInfo text={t('manufacturing.formula.targetItem')} />
                  </div>
                  <CustomSelect
                    value={finalRecipeForm.itemId}
                    onChange={(val) => {
                      setFinalRecipeForm({ ...finalRecipeForm, itemId: String(val) });
                      if (errors.itemId) setErrors({ ...errors, itemId: '' });
                    }}
                    options={products.map(p => ({ label: p.name, value: p.id }))}
                    placeholder={t('manufacturing.formula.selectItem')}
                  />
                  {errors.itemId && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.itemId}</p>}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center">
                      <label className="text-xs font-black text-gray-400 tracking-[0.2em]">{t('manufacturing.ingredients')}</label>
                      <QuickInfo text={t('manufacturing.formula.noIngredients')} />
                    </div>
                    <span className="text-xs font-black text-gray-400 tracking-widest bg-gray-50 dark:bg-white/5 px-3 py-1 rounded-lg border border-gray-200 dark:border-white/10">{finalRecipeForm.ingredients.length.toLocaleString(t('common.locale'))} {t('dashboard.stats.orders')}</span>
                  </div>

                  <div className="space-y-3 min-h-[40px]">
                    <AnimatePresence>
                      {finalRecipeForm.ingredients.map((ing, index) => {
                        let baseUnit = 'Units';
                        const isRaw = ing.type === 'raw';

                        if (isRaw) {
                          const m = rawMaterials.find(rm => rm.id === ing.rawMaterialId);
                          if (m) baseUnit = m.unit;
                        } else {
                          const s = subRecipes.find(sr => sr.id === ing.subRecipeId);
                          if (s) baseUnit = s.yieldUnit;
                        }

                        const availableUnits = getCompatibleUnits(baseUnit);
                        const currentUnit = ing.selectedUnit || baseUnit;
                        const displayValue = convertToDisplay(ing.quantity, baseUnit, currentUnit);

                        const validMaterialOptions = (Array.isArray(rawMaterials) ? rawMaterials : [])
                          .filter(m => !(Array.isArray(finalRecipeForm.ingredients) ? finalRecipeForm.ingredients : []).some((other, i) => i !== index && other.type === 'raw' && other.rawMaterialId === m.id))
                          .map(m => ({ label: `${m.name} (${m.unit})`, value: m.id }));

                        const validSubRecipeOptions = (Array.isArray(subRecipes) ? subRecipes : [])
                          .filter(r => !(Array.isArray(finalRecipeForm.ingredients) ? finalRecipeForm.ingredients : []).some((other, i) => i !== index && other.type === 'sub' && other.subRecipeId === r.id))
                          .map(r => ({ label: `${r.name} (${r.yieldUnit})`, value: r.id }));

                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            key={index}
                            className="flex gap-3 items-center p-3 bg-gray-50 dark:bg-white/[0.04] rounded-2xl border border-gray-200 dark:border-white/10"
                          >
                            {ing.type === 'raw' ? (
                              <CustomSelect
                                value={ing.rawMaterialId || ''}
                                onChange={(val) => {
                                  const stringVal = String(val);
                                  const m = rawMaterials.find(rm => rm.id === stringVal);
                                  const updated = [...finalRecipeForm.ingredients];
                                  updated[index].rawMaterialId = stringVal;
                                  updated[index].selectedUnit = m?.unit;
                                  updated[index].quantity = 0;
                                  setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                                }}
                                options={validMaterialOptions}
                                placeholder={t('manufacturing.formula.addMaterial')}
                                className="flex-[2] text-sm"
                              />
                            ) : (
                              <CustomSelect
                                value={ing.subRecipeId || ''}
                                onChange={(val) => {
                                  const stringVal = String(val);
                                  const s = subRecipes.find(sr => sr.id === stringVal);
                                  const updated = [...finalRecipeForm.ingredients];
                                  updated[index].subRecipeId = stringVal;
                                  updated[index].selectedUnit = s?.yieldUnit;
                                  updated[index].quantity = 0;
                                  setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                                }}
                                options={validSubRecipeOptions}
                                placeholder={t('manufacturing.prep')}
                                className="flex-[2] text-sm"
                              />
                            )}

                            {(ing.rawMaterialId || ing.subRecipeId) && (
                              <div className="flex bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-300 dark:border-white/10 w-48 transition-all hover:border-gray-400 dark:hover:border-white/20 focus-within:border-paymint-green/50 focus-within:ring-2 focus-within:ring-paymint-green/20 relative group/input">
                                <input
                                  type="number"
                                  value={displayValue === 0 ? '' : displayValue}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const baseVal = convertToBase(val, baseUnit, currentUnit);
                                    const updated = [...finalRecipeForm.ingredients];
                                    updated[index].quantity = baseVal;
                                    setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                                  }}
                                  className="flex-1 w-full pl-5 pr-3 py-4 bg-transparent text-right font-black text-gray-900 dark:text-white focus:outline-none placeholder-gray-500/30 touch-manipulation settings-no-spin rounded-l-2xl"
                                  placeholder="0"
                                />
                                {/* Custom Unit Selector */}
                                <div className="relative border-l border-gray-300 dark:border-white/10 rounded-r-2xl">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdown(activeDropdown?.index === index && activeDropdown?.type === 'final' ? null : { index, type: 'final' });
                                    }}
                                    className="h-full px-4 flex items-center gap-2 bg-gray-100/50 dark:bg-white/5 hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors rounded-r-2xl"
                                  >
                                    <span className="text-xs font-black text-gray-600 dark:text-gray-400 group-hover/input:text-gray-900 dark:group-hover/input:text-white transition-colors">{t(`inventory.units.${currentUnit.toLowerCase()}`, { defaultValue: currentUnit })}</span>
                                    <ChevronDown size={12} className="text-gray-400" />
                                  </button>

                                  {/* Unit Dropdown Menu */}
                                  <AnimatePresence>
                                    {activeDropdown?.index === index && activeDropdown?.type === 'final' && (
                                      <>
                                        <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                                        <motion.div
                                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                          className="absolute right-0 top-full mt-2 min-w-[80px] bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20 flex flex-col"
                                        >
                                          {availableUnits.map((u) => (
                                            <button
                                              key={u}
                                              onClick={() => {
                                                const newBaseVal = convertToBase(displayValue, baseUnit, u);
                                                const updated = [...finalRecipeForm.ingredients];
                                                updated[index].selectedUnit = u;
                                                updated[index].quantity = newBaseVal;
                                                setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                                                setActiveDropdown(null);
                                              }}
                                              className={`w-full px-4 py-2 text-center text-xs font-black transition-colors ${u === currentUnit ? 'bg-paymint-green text-gray-900' : 'text-gray-500 hover:text-black dark:hover:text-white'
                                                }`}
                                            >
                                              {t(`inventory.units.${u.toLowerCase()}`, { defaultValue: u })}
                                            </button>
                                          ))}
                                        </motion.div>
                                      </>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            )}

                            <button
                              onClick={() => setFinalRecipeForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }))}
                              className="p-2 text-paymint-red hover:bg-paymint-red/10 rounded-xl transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    {finalRecipeForm.ingredients.length === 0 && (
                      <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-white/5 rounded-[2rem]">
                        <Pizza size={32} className="mx-auto text-gray-300 mb-4 opacity-50" />
                        <p className="text-sm font-bold text-gray-500">{t('manufacturing.formula.noIngredients')}</p>
                        <p className="text-xs font-black text-gray-400 tracking-widest mt-1">{t('manufacturing.messages.noSubFormulasDesc')}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <button
                      onClick={() => {
                        if (rawMaterials.length === 0) {
                          setConfirmConfig({
                            isOpen: true,
                            title: t('manufacturing.messages.noMaterials'),
                            message: t('manufacturing.messages.noMaterialsDesc'),
                            type: 'warning',
                            onConfirm: () => {
                              navigate(`/dashboard/${locationSlug}/materials`, { state: { openCreateModal: true } });
                            }
                          });
                          return;
                        }
                        setFinalRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { rawMaterialId: '', quantity: 0, type: 'raw' }] }));
                      }}
                      className="flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl text-xs font-black text-paymint-green tracking-widest hover:bg-paymint-green/5 hover:border-paymint-green/30 transition-all group"
                    >
                      <Package size={16} className="group-hover:scale-125 transition-transform" />
                      <span>{t('manufacturing.formula.addMaterial')}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (subRecipes.length === 0) {
                          setConfirmConfig({
                            isOpen: true,
                            title: t('manufacturing.messages.noSubFormulas'),
                            message: t('manufacturing.messages.noSubFormulasDesc'),
                            type: 'warning',
                            onConfirm: () => {
                              setShowFinalRecipeModal(false);
                              setActiveTab('sub');
                              setSubRecipeForm({ name: '', description: '', yield: 1, yieldUnit: 'Units', ingredients: [] });
                              setShowSubRecipeModal(true);
                            }
                          });
                          return;
                        }
                        setFinalRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { subRecipeId: '', quantity: 0, type: 'sub' }] }));
                      }}
                      className="flex items-center justify-center gap-2 py-4 bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 rounded-2xl text-xs font-black text-blue-500 tracking-widest hover:bg-blue-500/5 hover:border-blue-500/30 transition-all group"
                    >
                      <Pizza size={16} className="group-hover:scale-125 transition-transform" />
                      <span>{t('manufacturing.formula.addPrep')}</span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-gray-200 dark:border-white/5">
                <button onClick={handleSaveFinalRecipe} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:bg-emerald-400 tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-paymint-green/20">
                  {t('manufacturing.formula.registerRecipe')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManufactureModal && manufactureRecipe && (
          <div className="fixed inset-0 z-[60] popup-surface flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('manufacturing.runBatch')}</h2>
                <p className="text-gray-500 font-bold mt-1 text-xs tracking-widest">{manufactureRecipe.name}</p>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <input type="number" min="1" value={numBatches} onChange={(e) => setNumBatches(parseInt(e.target.value) || 1)} className="w-full bg-transparent text-center text-6xl font-black text-paymint-green focus:outline-none placeholder-gray-300" autoFocus />
                  <div className="flex items-center justify-center mt-4 gap-1">
                    <p className="text-xs font-black text-gray-400 tracking-widest">{t('manufacturing.numBatches')}</p>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-gray-500 tracking-widest">{t('manufacturing.totalOutput')}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{(numBatches * manufactureRecipe.yield).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {manufactureRecipe.yieldUnit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-black text-gray-500 tracking-widest">{t('manufacturing.materialCost')}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white">{t('common.top')}</span>
                  </div>
                </div>
                <button onClick={handleManufacture} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:bg-emerald-400 tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-paymint-green/20">
                  {t('manufacturing.confirmProduction')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
      />
    </div>
  );
}



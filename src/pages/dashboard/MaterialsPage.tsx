import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  X,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useNavigate, useLocation , useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../config/api';
import { useCurrency } from '../../context/CurrencyContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CustomSelect } from '../../components/CustomSelect';
import { QuickInfo } from '../../components/QuickInfo';
import { SearchInput, Pagination } from '../../components/ui';
import { usePermissionGuard } from '../../hooks/usePermissionGuard';
import { useAuth } from '../../context/AuthContext';

interface RawMaterial {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  costPerUnit: number;
  lowStockThreshold: number | null;
}

interface SubRecipe {
  id: string;
  name: string;
  description?: string;
  yield: number;
  yieldUnit: string;
  quantity: number;
}

export function MaterialsPage() {
  const { t } = useTranslation();
    const { currentEstablishment } = useAuth();
  usePermissionGuard(['manage_inventory']);
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { formatAmount, currencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState<'materials' | 'prepared'>('materials');
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [materialForm, setMaterialForm] = useState({
    name: '',
    unit: 'Kg',
    quantity: 0,
    costPerUnit: 0,
    lowStockThreshold: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const units = ['Kg', 'G', 'L', 'Ml', 'Pcs', 'Units', 'Oz', 'Lb', 'Cups'];

  useEffect(() => {
    const state = location.state as { openCreateModal?: boolean };
    if (state?.openCreateModal) {
      setActiveTab('materials');
      setEditingMaterial(null);
      setMaterialForm({ name: '', unit: 'Kg', quantity: 0, costPerUnit: 0, lowStockThreshold: 0 });
      setShowMaterialModal(true);
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [materialsRes, recipesRes] = await Promise.all([
        api.get('/api/manufacturing/raw-materials'),
        api.get('/api/manufacturing/sub-recipes'),
      ]);
      setRawMaterials(materialsRes.data || []);
      setSubRecipes(recipesRes.data || []);
    } catch {
      toast.error(t('inventory.messages.syncFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    return (Array.isArray(rawMaterials) ? rawMaterials : []).filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rawMaterials, searchQuery]);

  const filteredPrepared = useMemo(() => {
    return (Array.isArray(subRecipes) ? subRecipes : []).filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subRecipes, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const items = activeTab === 'materials' ? filteredMaterials : filteredPrepared;
    return (Array.isArray(items) ? items : []).slice(start, start + itemsPerPage);
  }, [activeTab, filteredMaterials, filteredPrepared, page]);

  const totalPages = Math.ceil(((activeTab === 'materials' ? filteredMaterials : filteredPrepared) || []).length / itemsPerPage);

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!materialForm.name.trim()) {
      setErrors({ name: t('common.required') });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingMaterial) {
        await api.put(`/api/manufacturing/raw-materials/${editingMaterial.id}`, materialForm);
        toast.success(t('inventory.messages.updated'));
      } else {
        await api.post('/api/manufacturing/raw-materials', materialForm);
        toast.success(t('inventory.messages.created'));
      }
      setShowMaterialModal(false);
      fetchData();
    } catch {
      toast.error(t('inventory.messages.saveError'));
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleDeleteMaterial = async (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: t('inventory.messages.removeTitle'),
      message: t('inventory.messages.deleteConfirm', { name }),
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/manufacturing/raw-materials/${id}`);
          toast.success(t('inventory.messages.removed'));
          fetchData();
        } catch {
          toast.error(t('inventory.messages.deleteFailed'));
        }
      }
    });
  };

  const formatCurrency = (value: number) => {
    return formatAmount(value);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10">
      {/* Header */}
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('inventory.materials')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('inventory.manage')}</span>
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
              if (activeTab === 'materials') {
                setEditingMaterial(null);
                setMaterialForm({ name: '', unit: 'Kg', quantity: 0, costPerUnit: 0, lowStockThreshold: 0 });
                setShowMaterialModal(true);
              } else {
                navigate(`/dashboard/${locationSlug}/recipes`);
              }
            }}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-paymint-green text-black font-bold text-xs sm:text-sm hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden xs:inline">{activeTab === 'materials' ? t('inventory.addIngredient') : t('inventory.addPrep')}</span>
            <span className="xs:hidden">{t('common.add')}</span>
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <SearchInput
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            onClear={() => { setSearchQuery(''); setPage(1); }}
            placeholder={t('inventory.search')}
            className="w-full"
          />
        </div>
        <div className="flex p-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
          <button
            onClick={() => { setActiveTab('materials'); setPage(1); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'materials' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            {t('inventory.materials')}
          </button>
          <button
            onClick={() => { setActiveTab('prepared'); setPage(1); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-black tracking-widest transition-all ${activeTab === 'prepared' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            {t('inventory.prepared')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black tracking-widest text-gray-400">{t('common.loading')}</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
              <Package size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('inventory.noIngredients', { defaultValue: 'No ingredients' })}</h3>
            <p className="text-sm font-bold text-gray-500 max-w-xs">{t('inventory.noIngredientsDesc', { defaultValue: 'Add ingredients to track stock.' })}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'materials' ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
                  {paginatedItems.map((item) => {
                    const m = item as RawMaterial;
                    const isLow = m.lowStockThreshold && m.quantity <= m.lowStockThreshold;
                    return (
                      <div key={m.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border flex-shrink-0 ${isLow ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'}`}>
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{m.name}</p>
                              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold mt-1 ${isLow ? 'bg-red-500/10 text-red-500' : 'bg-paymint-green/10 text-paymint-green'}`}>
                                {isLow ? <AlertTriangle size={10} /> : <TrendingUp size={10} />}
                                {isLow ? t('inventory.lowStock') : t('inventory.optimal')}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <button onClick={() => { setEditingMaterial(m); setMaterialForm({ name: m.name, unit: m.unit, quantity: m.quantity, costPerUnit: m.costPerUnit, lowStockThreshold: m.lowStockThreshold || 0 }); setShowMaterialModal(true); }} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-paymint-green transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDeleteMaterial(m.id, m.name)} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2">
                            <p className="text-xs font-bold text-gray-400 mb-0.5">{t('inventory.quantity')}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{(Number(m.quantity || 0)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-gray-500">{m.unit}</span></p>
                          </div>
                          <div className="bg-gray-50 dark:bg-white/5 rounded-lg p-2">
                            <p className="text-xs font-bold text-gray-400 mb-0.5">{t('inventory.unitCost')}</p>
                            <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(m.costPerUnit)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/[0.02]">
                      <tr className="border-b border-gray-200 dark:border-white/5">
                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('inventory.form.name')}</th>
                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('inventory.quantity')}</th>
                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('inventory.cost')}</th>
                        <th className="px-6 py-4 text-left text-xs font-black text-gray-400 tracking-widest">{t('owner.locations.status')}</th>
                        <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest">{t('orders.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {paginatedItems.map((item) => {
                        const m = item as RawMaterial;
                        const isLow = m.lowStockThreshold && m.quantity <= m.lowStockThreshold;
                        return (
                          <tr key={m.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs border ${isLow ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'}`}>
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-bold text-gray-900 dark:text-white text-sm">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900 dark:text-white">{(Number(m.quantity || 0)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              <span className="ml-1 text-xs font-medium text-gray-500">{m.unit}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(m.costPerUnit)}</td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${isLow ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'}`}>
                                {isLow ? <AlertTriangle size={10} /> : <TrendingUp size={10} />}
                                {isLow ? t('inventory.lowStock') : t('inventory.optimal')}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 transition-opacity">
                                <button onClick={() => { setEditingMaterial(m); setMaterialForm({ name: m.name, unit: m.unit, quantity: m.quantity, costPerUnit: m.costPerUnit, lowStockThreshold: m.lowStockThreshold || 0 }); setShowMaterialModal(true); }} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-paymint-green transition-colors">
                                  <Edit2 size={14} />
                                </button>
                                <button onClick={() => handleDeleteMaterial(m.id, m.name)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-red-500 transition-colors">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedItems.map((item) => {
                  const r = item as SubRecipe;
                  return (
                    <motion.div
                      layout
                      key={r.id}
                      className="group relative bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:shadow-xl transition-all duration-300 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="absolute left-0 top-0 h-full w-1 bg-paymint-green opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-12 h-12 rounded-xl bg-paymint-green/10 text-paymint-green flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-sm">
                            <Package size={20} />
                          </div>
                          <button onClick={() => navigate(`/dashboard/${locationSlug}/recipes`)} className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green transition-all">
                            <Edit2 size={16} />
                          </button>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-paymint-green transition-colors">{r.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.description || t('manufacturing.noRecipesDesc')}</p>

                        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">{t('manufacturing.formula.yield')}</p>
                            <p className="font-bold text-gray-900 dark:text-white text-sm">{(r as any)['yield']} <span className="text-xs text-gray-500">{r.yieldUnit}</span></p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-gray-400 tracking-widest mb-1">{t('inventory.stock')}</p>
                            <p className="font-bold text-paymint-green text-sm">{(Number(r.quantity || 0)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">{r.yieldUnit}</span></p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} className="mt-6" />
          </div>
        )}
      </AnimatePresence>

      {/* Material Modal */}
      <AnimatePresence>
        {showMaterialModal && (
          <div className="fixed inset-0 z-[60] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} transition={{ type: "spring", duration: 0.4, bounce: 0.2 }} className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:max-w-md overflow-hidden shadow-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col">
              {/* Mobile drag handle */}
              <div className="sm:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
              </div>

              <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{editingMaterial ? t('inventory.editIngredient') : t('inventory.addIngredient')}</h2>
                <button onClick={() => setShowMaterialModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleMaterialSubmit} className="p-4 sm:p-8 space-y-6 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-black text-gray-400 tracking-widest mb-3 px-1 flex items-center">
                    {t('inventory.form.name')} <span className="text-paymint-red mx-1">*</span>
                    <QuickInfo text={t('inventory.form.namePlaceholder')} />
                  </label>
                  <input
                    type="text"
                    value={materialForm.name}
                    onChange={(e) => {
                      setMaterialForm({ ...materialForm, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm shadow-sm border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/[0.08]'} rounded-2xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-[3px] focus:ring-paymint-green/10 focus:border-paymint-green transition-all`}
                    placeholder={t('inventory.form.namePlaceholder')}
                  />
                  {errors.name && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 tracking-widest mb-3 px-1 flex items-center">
                      {t('inventory.form.unit')} <span className="text-paymint-red mx-1">*</span>
                      <QuickInfo text={t('inventory.form.unitInfo', { defaultValue: 'Choose how you measure this ingredient' })} />
                    </label>
                    <CustomSelect
                      value={materialForm.unit}
                      onChange={(val) => setMaterialForm({ ...materialForm, unit: String(val) })}
                      options={units.map(u => ({ label: t(`inventory.units.${u.toLowerCase()}`, { defaultValue: u }), value: u }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 tracking-widest mb-3 px-1 flex items-center">
                      {t('inventory.unitCost')}
                    </label>
                    <div className="relative group">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={materialForm.costPerUnit === 0 ? '' : (Number(materialForm.costPerUnit || 0)).toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        placeholder="0.00"
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const numericValue = parseInt(val || '0', 10) / 100;
                          setMaterialForm({ ...materialForm, costPerUnit: numericValue });
                        }}
                        className="w-full pl-[5rem] pr-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm shadow-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-[3px] focus:ring-paymint-green/10 focus:border-paymint-green transition-all"
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-100 dark:bg-white/10 rounded-[12px] shadow-sm border border-gray-200/50 dark:border-white/5 z-10 pointer-events-none text-center min-w-[40px] flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-400 text-xs font-black tracking-wider uppercase">{currencySymbol}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 tracking-widest mb-3 px-1 flex items-center">
                      {t('inventory.form.inStock')}
                      <QuickInfo text={t('inventory.form.inStockInfo', { defaultValue: 'How much you have in your inventory' })} />
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={materialForm.quantity === 0 ? '' : materialForm.quantity}
                      placeholder="0"
                      onChange={(e) => setMaterialForm({ ...materialForm, quantity: Number(e.target.value) })}
                      className="w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm shadow-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-[3px] focus:ring-paymint-green/10 focus:border-paymint-green transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 tracking-widest mb-3 px-1 flex items-center">
                      {t('inventory.form.lowStockThreshold')}
                      <QuickInfo text={t('inventory.form.lowStockThresholdInfo', { defaultValue: 'When do you like to be alerted' })} />
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={materialForm.lowStockThreshold === 0 ? '' : materialForm.lowStockThreshold}
                      placeholder="0"
                      onChange={(e) => setMaterialForm({ ...materialForm, lowStockThreshold: Number(e.target.value) })}
                      className="w-full px-5 py-3.5 bg-white dark:bg-white/[0.03] backdrop-blur-sm shadow-sm border border-gray-200 dark:border-white/[0.08] rounded-2xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-[3px] focus:ring-paymint-green/10 focus:border-paymint-green transition-all"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-paymint-green text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                  {t('common.save')}
                </button>
              </form>
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



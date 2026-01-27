import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Package,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CustomSelect } from '../../components/CustomSelect';
import { QuickInfo } from '../../components/QuickInfo';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'materials' | 'prepared'>('materials');
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [restockMaterial, setRestockMaterial] = useState<RawMaterial | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(0);
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
    } catch (err: any) {
      toast.error('Failed to sync inventory');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rawMaterials, searchQuery]);

  const filteredPrepared = useMemo(() => {
    return subRecipes.filter((r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subRecipes, searchQuery]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const items = activeTab === 'materials' ? filteredMaterials : filteredPrepared;
    return items.slice(start, start + itemsPerPage);
  }, [activeTab, filteredMaterials, filteredPrepared, page]);

  const totalPages = Math.ceil((activeTab === 'materials' ? filteredMaterials.length : filteredPrepared.length) / itemsPerPage);

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!materialForm.name.trim()) {
      setErrors({ name: 'Required' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingMaterial) {
        await api.put(`/api/manufacturing/raw-materials/${editingMaterial.id}`, materialForm);
        toast.success('Material updated');
      } else {
        await api.post('/api/manufacturing/raw-materials', materialForm);
        toast.success('Material created');
      }
      setShowMaterialModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Error saving material');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async () => {
    if (!restockAmount || restockAmount <= 0 || !restockMaterial) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/manufacturing/raw-materials/${restockMaterial.id}/restock`, { amount: restockAmount });
      toast.success('Inventory adjusted');
      setShowRestockModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Restock sequence failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMaterial = async (id: string, name: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Material',
      message: `Delete "${name}" from inventory? This action is permanent.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/manufacturing/raw-materials/${id}`);
          toast.success('Material removed');
          fetchData();
        } catch (err: any) {
          toast.error('Deletion failed');
        }
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'Jod',
    }).format(value).replace('Jod', '').trim() + ' Jod';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
              Inventory
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Materials</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage raw ingredients and costs
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
                navigate('/dashboard/recipes');
              }
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>{activeTab === 'materials' ? 'Add Material' : 'Add Prep'}</span>
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search materials..."
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
          />
        </div>

        <div className="flex p-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
          <button
            onClick={() => { setActiveTab('materials'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeTab === 'materials' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Raw
          </button>
          <button
            onClick={() => { setActiveTab('prepared'); setPage(1); }}
            className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${activeTab === 'prepared' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
          >
            Prepared
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black tracking-widest text-gray-400">Loading...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
              <Package size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Materials</h3>
            <p className="text-gray-500 max-w-xs text-sm">Add materials to track inventory.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'materials' ? (
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/[0.02]">
                      <tr className="border-b border-gray-200 dark:border-white/5">
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Name</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Qty</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Cost</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest">Status</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {paginatedItems.map((m: any) => {
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
                              <span className="font-bold text-gray-900 dark:text-white">{m.quantity.toFixed(2)}</span>
                              <span className="ml-1 text-xs font-medium text-gray-500">{m.unit}</span>
                            </td>
                            <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(m.costPerUnit)}</td>
                            <td className="px-6 py-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide border ${isLow ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'}`}>
                                {isLow ? <AlertTriangle size={10} /> : <TrendingUp size={10} />}
                                {isLow ? 'Low Stock' : 'Optimal'}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setRestockMaterial(m); setRestockAmount(0); setShowRestockModal(true); }} className="px-3 py-1.5 bg-paymint-green/10 text-paymint-green text-[10px] font-bold tracking-wide rounded-lg hover:bg-paymint-green hover:text-black transition-all">
                                  Restock
                                </button>
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
                {paginatedItems.map((r: any) => (
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
                        <button onClick={() => navigate('/dashboard/recipes')} className="p-2 rounded-lg bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-paymint-green opacity-0 group-hover:opacity-100 transition-all">
                          <Edit2 size={16} />
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate group-hover:text-paymint-green transition-colors">{r.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.description || 'Custom preparation formula.'}</p>

                      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Yield</p>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{r.yield} <span className="text-[10px] text-gray-500">{r.yieldUnit}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 tracking-widest mb-1">Stock</p>
                          <p className="font-bold text-paymint-green text-sm">{r.quantity.toFixed(2)} <span className="text-[10px]">{r.yieldUnit}</span></p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all">
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${page === i + 1 ? 'bg-paymint-green text-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all">
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Material Modal */}
      <AnimatePresence>
        {showMaterialModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-md overflow-hidden shadow-2xl">
              <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{editingMaterial ? 'Edit Material' : 'Add Material'}</h2>
                <button onClick={() => setShowMaterialModal(false)} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleMaterialSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 tracking-[0.2em] mb-2 flex items-center">
                    Name <span className="text-paymint-red mx-1">*</span>
                    <QuickInfo text="Unique name for this raw material (e.g., 'Flour Type 00')." />
                  </label>
                  <input
                    type="text"
                    value={materialForm.name}
                    onChange={(e) => {
                      setMaterialForm({ ...materialForm, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                  />
                  {errors.name && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <CustomSelect
                      label="Unit"
                      value={materialForm.unit}
                      onChange={(val) => setMaterialForm({ ...materialForm, unit: val })}
                      options={units}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 tracking-[0.2em] mb-2 flex items-center">
                      Cost per Unit
                      <QuickInfo text="The cost to acquire one unit of this material." />
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-gray-200 dark:bg-white/10 rounded-md">
                        <span className="text-gray-500 dark:text-gray-400 text-[10px] font-black">Jod</span>
                      </div>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={materialForm.costPerUnit === 0 ? '' : materialForm.costPerUnit.toFixed(2)}
                        placeholder="0.00"
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const numericValue = parseInt(val || '0', 10) / 100;
                          setMaterialForm({ ...materialForm, costPerUnit: numericValue });
                        }}
                        className="w-full pl-14 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 tracking-[0.2em] mb-2 flex items-center">
                      Current Stock
                      <QuickInfo text="Total quantity in stock." />
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={materialForm.quantity === 0 ? '' : materialForm.quantity}
                      placeholder="0"
                      onChange={(e) => setMaterialForm({ ...materialForm, quantity: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 tracking-[0.2em] mb-2 flex items-center">
                      Low Stock Alert
                      <QuickInfo text="Threshold to trigger a reorder warning." />
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={materialForm.lowStockThreshold === 0 ? '' : materialForm.lowStockThreshold}
                      placeholder="0"
                      onChange={(e) => setMaterialForm({ ...materialForm, lowStockThreshold: Number(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all"
                    />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-paymint-green text-black font-bold rounded-xl hover:bg-emerald-400 transition-all shadow-sm text-sm flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Save
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Modal */}
      <AnimatePresence>
        {showRestockModal && restockMaterial && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-sm overflow-hidden shadow-2xl">
              <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                <div className="w-16 h-16 bg-paymint-green/10 text-paymint-green rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Package size={32} />
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{restockMaterial.name}</h2>
                <p className="text-gray-500 font-bold mt-1 text-[10px] tracking-widest">Available: {restockMaterial.quantity.toFixed(2)} {restockMaterial.unit}</p>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <input type="number" step="0.01" value={restockAmount} onChange={(e) => setRestockAmount(Number(e.target.value))} className="w-full bg-transparent text-center text-5xl font-black text-paymint-green focus:outline-none placeholder-gray-300" placeholder="0.00" autoFocus />
                  <div className="flex items-center justify-center mt-2 gap-1">
                    <p className="text-[10px] font-black text-gray-400 tracking-widest">Volume to Add ({restockMaterial.unit})</p>
                  </div>
                </div>
                <button onClick={handleRestock} disabled={isSubmitting || restockAmount <= 0} className="w-full py-3.5 bg-paymint-green text-black font-bold rounded-xl hover:bg-emerald-400 transition-all text-sm flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Confirm Restock
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

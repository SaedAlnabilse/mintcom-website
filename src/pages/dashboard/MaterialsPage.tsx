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
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CustomSelect } from '../../components/CustomSelect';

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
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    unit: 'kg',
    quantity: 0,
    costPerUnit: 0,
    lowStockThreshold: 10,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const units = ['kg', 'g', 'L', 'ml', 'pcs', 'units', 'oz', 'lb', 'cups'];

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

  const totalPages = Math.ceil((activeTab === 'materials' ? filteredMaterials.length : filteredPrepared.length) / itemsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const items = activeTab === 'materials' ? filteredMaterials : filteredPrepared;
    return items.slice(start, start + itemsPerPage);
  }, [activeTab, filteredMaterials, filteredPrepared, page]);

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
      currency: 'JOD',
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Supply Chain & Inventory</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage raw stock, prepared materials, and manufacturing costs.</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'materials') {
              setEditingMaterial(null);
              setMaterialForm({ name: '', unit: 'kg', quantity: 0, costPerUnit: 0, lowStockThreshold: 10 });
              setShowMaterialModal(true);
            } else {
              navigate('/dashboard/recipes');
            }
          }}
          className="px-6 py-3 bg-paymint-green text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-paymint-green/20"
        >
          <Plus size={20} />
          <span>{activeTab === 'materials' ? 'Add Raw Material' : 'New Sub-Recipe'}</span>
        </button>
      </div>

      {/* Control Panel */}
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex p-1.5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 rounded-[1.5rem] shadow-md">
            <button
              onClick={() => { setActiveTab('materials'); setPage(1); }}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'materials' ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Raw Materials
            </button>
            <button
              onClick={() => { setActiveTab('prepared'); setPage(1); }}
              className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'prepared' ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
            >
              Prepared Stock
            </button>
          </div>

          <div className="flex-1 w-full max-w-md relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Filter inventory registry..."
              className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 rounded-[1.25rem] text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green/30 shadow-md transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Ledger...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-24 bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 text-center flex flex-col items-center shadow-md">
            <div className="w-24 h-24 bg-gray-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-gray-200 dark:border-transparent">
              <Package size={32} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Registry is empty</h3>
            <p className="text-gray-500 max-w-xs font-medium">Add materials to begin tracking your manufacturing costs and inventory levels.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTab === 'materials' ? (
              <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-white/5">
                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Material Signature</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Quantity in Stock</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Unit Cost</th>
                        <th className="px-8 py-6 text-left text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Readiness</th>
                        <th className="px-8 py-6 text-right text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {paginatedItems.map((m: any) => {
                        const isLow = m.lowStockThreshold && m.quantity <= m.lowStockThreshold;
                        return (
                          <tr key={m.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                            <td className="px-8 py-5">
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black border ${isLow ? 'bg-paymint-red/10 text-paymint-red border-paymint-red/20' : 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'}`}>
                                  {m.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{m.name}</span>
                              </div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="font-black text-gray-900 dark:text-white">{m.quantity.toFixed(2)}</span>
                              <span className="ml-1 text-[10px] font-black text-gray-400 uppercase">{m.unit}</span>
                            </td>
                            <td className="px-8 py-5 font-black text-gray-900 dark:text-white">{formatCurrency(m.costPerUnit)}</td>
                            <td className="px-8 py-5">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isLow ? 'bg-paymint-red/10 text-paymint-red border-paymint-red/20' : 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'}`}>
                                {isLow ? <AlertTriangle size={12} /> : <TrendingUp size={12} />}
                                {isLow ? 'Reorder Needed' : 'Stable'}
                              </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setRestockMaterial(m); setRestockAmount(0); setShowRestockModal(true); }} className="px-4 py-2 bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-paymint-green hover:text-black transition-all">
                                  Restock
                                </button>
                                <button onClick={() => { setEditingMaterial(m); setMaterialForm({ name: m.name, unit: m.unit, quantity: m.quantity, costPerUnit: m.costPerUnit, lowStockThreshold: m.lowStockThreshold || 10 }); setShowMaterialModal(true); }} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:border-paymint-green/30">
                                  <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteMaterial(m.id, m.name)} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-paymint-red hover:border-paymint-red/30">
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
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedItems.map((r: any) => (
                  <div key={r.id} className="group bg-white dark:bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-gray-200 dark:border-white/5 shadow-md hover:shadow-xl hover:border-gray-300 dark:hover:border-white/10 transition-all duration-300">
                    <div className="flex justify-between items-start mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-paymint-green/10 text-paymint-green flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        <Package size={24} />
                      </div>
                      <button onClick={() => navigate('/dashboard/recipes')} className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-transparent text-gray-600 dark:text-gray-400 hover:text-paymint-green hover:border-paymint-green/30 opacity-0 group-hover:opacity-100 transition-all">
                        <Edit2 size={18} />
                      </button>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">{r.name}</h3>
                    <p className="text-sm font-medium text-gray-500 mt-1 line-clamp-1">{r.description || 'Custom preparation formula.'}</p>

                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Batch Yield</p>
                        <p className="font-black text-gray-900 dark:text-white">{r.yield} <span className="text-[10px] opacity-50">{r.yieldUnit}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Stock Level</p>
                        <p className="font-black text-paymint-green">{r.quantity.toFixed(2)} <span className="text-[10px] opacity-50">{r.yieldUnit}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-3 rounded-xl bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-500 hover:text-paymint-green hover:border-paymint-green/30 disabled:opacity-30 transition-all">
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-paymint-green text-black shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-3 rounded-xl bg-white dark:bg-[#0A0A0A] border border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-500 hover:text-paymint-green hover:border-paymint-green/30 disabled:opacity-30 transition-all">
                  <ChevronRight size={20} />
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 w-full max-w-md shadow-2xl overflow-visible">
              <div className="p-8 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Material Registry</h2>
                <button onClick={() => setShowMaterialModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleMaterialSubmit} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Material Identity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={materialForm.name}
                    onChange={(e) => {
                      setMaterialForm({ ...materialForm, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-transparent'} rounded-2xl text-gray-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                  />
                  {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}
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
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Cost per Unit</label>
                    <input type="number" step="0.01" value={materialForm.costPerUnit} onChange={(e) => setMaterialForm({ ...materialForm, costPerUnit: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-gray-900 dark:text-white font-black focus:ring-2 focus:ring-paymint-green/20 transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl shadow-paymint-green/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Finalize Registry
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-8 text-center border-b border-gray-50 dark:border-white/5">
                <div className="w-20 h-20 bg-paymint-green/10 text-paymint-green rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <Package size={40} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">{restockMaterial.name}</h2>
                <p className="text-gray-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Available: {restockMaterial.quantity.toFixed(2)} {restockMaterial.unit}</p>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <input type="number" step="0.01" value={restockAmount} onChange={(e) => setRestockAmount(Number(e.target.value))} className="w-full bg-transparent text-center text-6xl font-black text-paymint-green focus:outline-none" placeholder="0.00" autoFocus />
                  <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Volume to Add ({restockMaterial.unit})</p>
                </div>
                <button onClick={handleRestock} disabled={isSubmitting || restockAmount <= 0} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl shadow-paymint-green/20 uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Confirm Settlement
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
import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Package,
  Pizza,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CustomSelect } from '../../components/CustomSelect';

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
    yieldUnit: 'units',
    ingredients: [] as { rawMaterialId: string; quantity: number }[],
  });

  const [finalRecipeForm, setFinalRecipeForm] = useState({
    itemId: '',
    ingredients: [] as { rawMaterialId?: string; subRecipeId?: string; quantity: number; type: 'raw' | 'sub' }[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const units = ['units', 'kg', 'g', 'L', 'ml', 'pcs', 'portions', 'servings'];

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
    } catch (err: any) {
      toast.error('Failed to sync data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSub = useMemo(() => subRecipes.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase())), [subRecipes, searchQuery]);
  const filteredFinal = useMemo(() => finalRecipes.filter(r => r.item?.name?.toLowerCase().includes(searchQuery.toLowerCase())), [finalRecipes, searchQuery]);

  const totalPages = Math.ceil((activeTab === 'final' ? filteredFinal.length : filteredSub.length) / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    const items = activeTab === 'final' ? filteredFinal : filteredSub;
    return items.slice(start, start + itemsPerPage);
  }, [activeTab, filteredFinal, filteredSub, page]);

  const products = menuItems.filter(p => !finalRecipes.some(r => r.itemId === p.id) || (editingRecipe as any)?.itemId === p.id);

  const openEditSubRecipe = (recipe: SubRecipe) => {
    setEditingRecipe(recipe);
    setSubRecipeForm({
      name: recipe.name,
      description: recipe.description || '',
      yield: recipe.yield,
      yieldUnit: recipe.yieldUnit,
      ingredients: recipe.ingredients.map(ing => ({ rawMaterialId: ing.rawMaterialId, quantity: ing.quantity }))
    });
    setErrors({});
    setShowSubRecipeModal(true);
  };

  const openEditFinalRecipe = (recipe: FinalRecipe) => {
    setEditingRecipe(recipe);
    setFinalRecipeForm({
      itemId: recipe.itemId,
      ingredients: recipe.ingredients.map(ing => ({
        rawMaterialId: ing.rawMaterialId,
        subRecipeId: ing.subRecipeId,
        quantity: ing.quantity,
        type: ing.rawMaterialId ? 'raw' : 'sub'
      }))
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
    if (!subRecipeForm.name.trim()) newErrors.name = 'Required';
    if (!subRecipeForm.yield || subRecipeForm.yield <= 0) newErrors.yield = 'Must be > 0';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecipe) await api.put(`/api/manufacturing/sub-recipes/${editingRecipe.id}`, subRecipeForm);
      else await api.post('/api/manufacturing/sub-recipes', subRecipeForm);
      toast.success('Saved formula');
      setShowSubRecipeModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveFinalRecipe = async () => {
    setErrors({});
    if (!finalRecipeForm.itemId) {
      setErrors({ itemId: 'Required' });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingRecipe) await api.put(`/api/manufacturing/final-recipes/${editingRecipe.id}`, finalRecipeForm);
      else await api.post('/api/manufacturing/final-recipes', finalRecipeForm);
      toast.success('Saved recipe');
      setShowFinalRecipeModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Error saving');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManufacture = async () => {
    if (!manufactureRecipe) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/manufacturing/sub-recipes/${manufactureRecipe.id}/manufacture`, { batches: numBatches });
      toast.success('Manufactured');
      setShowManufactureModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRecipe = async (id: string, type: 'sub' | 'final') => {
    setConfirmConfig({
      isOpen: true,
      title: 'Remove Formula',
      message: 'Delete this blueprint?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/manufacturing/${type === 'sub' ? 'sub-recipes' : 'final-recipes'}/${id}`);
          toast.success('Removed');
          fetchData();
        } catch (err: any) {
          toast.error('Failed');
        }
      }
    });
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cream-50 via-cream-100 to-cream-50 dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-cream-300 dark:border-white/5 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
              <Pizza size={28} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Production Formulas</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Design blueprints for menu items and sub-assemblies</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (activeTab === 'final') {
                  setEditingRecipe(null);
                  setFinalRecipeForm({ itemId: '', ingredients: [] });
                  setShowFinalRecipeModal(true);
                } else {
                  setEditingRecipe(null);
                  setSubRecipeForm({ name: '', description: '', yield: 1, yieldUnit: 'units', ingredients: [] });
                  setShowSubRecipeModal(true);
                }
              }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/30"
            >
              <Plus size={18} />
              <span>{activeTab === 'final' ? 'Link Product Recipe' : 'New Sub-Formula'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
          <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }} placeholder="Filter recipe blueprints..." className="w-full pl-11 pr-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green/30 shadow-md transition-all text-sm font-medium" />
        </div>
        <div className="flex p-1 bg-cream-100 dark:bg-[#0A0A0A] border border-cream-300 dark:border-white/10 rounded-2xl shadow-md">
          <button onClick={() => { setActiveTab('final'); setPage(1); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'final' ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Products Formulas</button>
          <button onClick={() => { setActiveTab('sub'); setPage(1); }} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sub' ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>Sub-Assemblies</button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="py-32 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Blueprints...</p>
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="py-24 bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-cream-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6">
              <Pizza size={32} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No blueprints found</h3>
            <p className="text-gray-500 max-w-xs font-medium">Start defining your production processes.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedItems.map((recipe: any) => (
                <motion.div layout key={recipe.id} className="group bg-cream-50 dark:bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-cream-300 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-paymint-green/10 text-paymint-green flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                        {activeTab === 'final' ? <Pizza size={24} /> : <Package size={24} />}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white truncate uppercase tracking-tight max-w-[150px]">
                          {activeTab === 'final' ? recipe.item?.name : recipe.name}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{recipe.ingredients.length} Inputs Linked</p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => activeTab === 'final' ? openEditFinalRecipe(recipe) : openEditSubRecipe(recipe)} className="p-2 rounded-xl bg-cream-100 dark:bg-white/5 text-gray-400 hover:text-paymint-green"><Edit2 size={18} /></button>
                      <button onClick={() => handleDeleteRecipe(recipe.id, activeTab)} className="p-2 rounded-xl bg-cream-100 dark:bg-white/5 text-gray-400 hover:text-paymint-red"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="space-y-3 mb-8 bg-cream-100 dark:bg-white/[0.02] p-5 rounded-[1.5rem] border border-cream-200 dark:border-white/5">
                    {recipe.ingredients.slice(0, 3).map((ing: any, i: number) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{ing.rawMaterial?.name || ing.subRecipe?.name}</span>
                        <span className="text-xs font-black text-gray-900 dark:text-white">{ing.quantity} <span className="text-[10px] opacity-50 uppercase">{ing.rawMaterial?.unit || ing.subRecipe?.yieldUnit}</span></span>
                      </div>
                    ))}
                    {recipe.ingredients.length > 3 && <p className="text-[9px] font-black text-paymint-green uppercase text-center mt-2 tracking-widest">+ {recipe.ingredients.length - 3} Additional Elements</p>}
                  </div>
                  {activeTab === 'sub' && (
                    <button onClick={() => openManufactureModal(recipe)} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl shadow-paymint-green/20 uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2">
                      <RefreshCw size={14} /> Batch Production
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-3 rounded-xl bg-cream-50 dark:bg-[#0A0A0A] border border-cream-300 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all"><ChevronLeft size={20} /></button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-paymint-green text-black shadow-lg' : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>{i + 1}</button>
                  ))}
                </div>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-3 rounded-xl bg-cream-50 dark:bg-[#0A0A0A] border border-cream-300 dark:border-white/10 text-gray-500 hover:text-paymint-green disabled:opacity-30 transition-all"><ChevronRight size={20} /></button>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubRecipeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 w-full max-w-lg shadow-2xl flex flex-col overflow-visible">
              <div className="p-8 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{editingRecipe ? 'Modify Formula' : 'Blueprint Creation'}</h2>
                <button onClick={() => setShowSubRecipeModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">
                    Formula Identity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={subRecipeForm.name}
                    onChange={(e) => {
                      setSubRecipeForm({ ...subRecipeForm, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: '' });
                    }}
                    className={`w-full px-5 py-4 bg-cream-100 dark:bg-[#1a1a1a] border ${errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/10'} rounded-2xl text-gray-900 dark:text-white font-black focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all`}
                    placeholder="e.g. HOUSE VINAIGRETTE"
                  />
                  {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Batch Yield</label>
                    <input type="number" value={subRecipeForm.yield} onChange={(e) => setSubRecipeForm({ ...subRecipeForm, yield: parseFloat(e.target.value) || 0 })} className="w-full px-5 py-4 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white font-black focus:ring-2 focus:ring-paymint-green/20 transition-all" />
                  </div>
                  <div>
                    <CustomSelect
                      label="Unit"
                      value={subRecipeForm.yieldUnit}
                      onChange={(val) => setSubRecipeForm({ ...subRecipeForm, yieldUnit: val })}
                      options={units}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Input Elements</label>
                    <button onClick={() => setSubRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { rawMaterialId: '', quantity: 0 }] }))} className="text-[10px] font-black text-paymint-green uppercase hover:underline">+ Link Material</button>
                  </div>
                  <div className="space-y-3">
                    {subRecipeForm.ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-3 items-center p-3 bg-cream-100 dark:bg-white/[0.02] rounded-2xl border border-cream-200 dark:border-white/5">
                        <select value={ing.rawMaterialId} onChange={(e) => { const updated = [...subRecipeForm.ingredients]; updated[index].rawMaterialId = e.target.value; setSubRecipeForm({ ...subRecipeForm, ingredients: updated }); }} className="flex-1 bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none">
                          <option value="">Element...</option>
                          {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                        </select>
                        <input type="number" value={ing.quantity} onChange={(e) => { const updated = [...subRecipeForm.ingredients]; updated[index].quantity = parseFloat(e.target.value) || 0; setSubRecipeForm({ ...subRecipeForm, ingredients: updated }); }} className="w-20 bg-transparent text-right font-black text-paymint-green focus:outline-none" placeholder="0" />
                        <button onClick={() => setSubRecipeForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }))} className="p-2 text-paymint-red hover:bg-paymint-red/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-cream-200 dark:border-white/5">
                <button onClick={handleSaveSubRecipe} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Finalize Blueprint
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFinalRecipeModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 w-full max-w-lg max-h-[90vh] shadow-2xl flex flex-col overflow-visible">
              <div className="p-8 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{editingRecipe ? 'Refine Product Recipe' : 'Production Mapping'}</h2>
                <button onClick={() => setShowFinalRecipeModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                <div>
                  <CustomSelect
                    label={<>Target Menu Item <span className="text-red-500">*</span></> as any}
                    value={finalRecipeForm.itemId}
                    onChange={(val) => {
                      setFinalRecipeForm({ ...finalRecipeForm, itemId: val });
                      if (errors.itemId) setErrors({ ...errors, itemId: '' });
                    }}
                    options={products.map(p => ({ label: p.name, value: p.id }))}
                    placeholder="Select Item..."
                  />
                  {errors.itemId && <p className="mt-1 text-xs font-bold text-red-500">{errors.itemId}</p>}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Bill of Materials</label>
                    <div className="flex gap-2">
                      <button onClick={() => setFinalRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { rawMaterialId: '', quantity: 0, type: 'raw' }] }))} className="text-[10px] font-black text-paymint-green uppercase hover:underline">+ Material</button>
                      <button onClick={() => setFinalRecipeForm(prev => ({ ...prev, ingredients: [...prev.ingredients, { subRecipeId: '', quantity: 0, type: 'sub' }] }))} className="text-[10px] font-black text-blue-500 uppercase hover:underline">+ Sub-Formula</button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {finalRecipeForm.ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-3 items-center p-3 bg-cream-100 dark:bg-white/[0.02] rounded-2xl border border-cream-200 dark:border-white/5">
                        {ing.type === 'raw' ? (
                          <select value={ing.rawMaterialId} onChange={(e) => { const updated = [...finalRecipeForm.ingredients]; updated[index].rawMaterialId = e.target.value; setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated }); }} className="flex-1 bg-transparent text-sm font-bold text-gray-900 dark:text-white focus:outline-none">
                            <option value="">Raw Material...</option>
                            {rawMaterials.map(m => <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>)}
                          </select>
                        ) : (
                          <select value={ing.subRecipeId} onChange={(e) => { const updated = [...finalRecipeForm.ingredients]; updated[index].subRecipeId = e.target.value; setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated }); }} className="flex-1 bg-transparent text-sm font-bold text-blue-500 focus:outline-none">
                            <option value="">Sub-Formula...</option>
                            {subRecipes.map(r => <option key={r.id} value={r.id}>{r.name} ({r.yieldUnit})</option>)}
                          </select>
                        )}
                        <input type="number" value={ing.quantity} onChange={(e) => { const updated = [...finalRecipeForm.ingredients]; updated[index].quantity = parseFloat(e.target.value) || 0; setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated }); }} className="w-20 bg-transparent text-right font-black text-paymint-green focus:outline-none" placeholder="0" />
                        <button onClick={() => setFinalRecipeForm(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }))} className="p-2 text-paymint-red hover:bg-paymint-red/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-8 border-t border-cream-200 dark:border-white/5">
                <button onClick={handleSaveFinalRecipe} disabled={isSubmitting} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Register Recipe
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManufactureModal && manufactureRecipe && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="p-8 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Production Log</h2>
                <button onClick={() => setShowManufactureModal(false)} className="p-2 text-gray-400 hover:text-white transition-colors"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-8 text-center">
                <div>
                  <p className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{manufactureRecipe.name}</p>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2">Cycle Yield: {manufactureRecipe.yield} {manufactureRecipe.yieldUnit}</p>
                </div>
                <div>
                  <input type="number" value={numBatches} onChange={(e) => setNumBatches(parseInt(e.target.value) || 1)} className="w-full bg-transparent text-center text-6xl font-black text-paymint-green focus:outline-none" min="1" />
                  <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mt-4">Cycles to Execute</p>
                </div>
                <div className="p-4 bg-paymint-green/5 rounded-2xl border border-paymint-green/10">
                  <p className="text-[10px] font-black text-paymint-green uppercase tracking-widest">Total Inventory Impact</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white mt-1">+{numBatches * manufactureRecipe.yield} {manufactureRecipe.yieldUnit}</p>
                </div>
                <button onClick={handleManufacture} disabled={isSubmitting || numBatches <= 0} className="w-full py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] shadow-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                  {isSubmitting && <RefreshCw size={16} className="animate-spin" />}
                  Execute Run
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
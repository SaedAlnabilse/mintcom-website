import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';

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
  const [activeTab, setActiveTab] = useState<'materials' | 'prepared'>('materials');
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [restockMaterial, setRestockMaterial] = useState<RawMaterial | null>(null);
  const [restockAmount, setRestockAmount] = useState('');
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

  // Form state
  const [materialForm, setMaterialForm] = useState({
    name: '',
    unit: 'kg',
    quantity: 0,
    costPerUnit: 0,
    lowStockThreshold: 10,
  });

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
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMaterials = rawMaterials.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubRecipes = subRecipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalMaterials: rawMaterials.length,
    lowStock: rawMaterials.filter((m) => m.lowStockThreshold && m.quantity <= m.lowStockThreshold).length,
    outOfStock: rawMaterials.filter((m) => m.quantity <= 0).length,
    totalPrepared: subRecipes.length,
  };

  // Open material modal
  const openMaterialModal = (material?: RawMaterial) => {
    if (material) {
      setEditingMaterial(material);
      setMaterialForm({
        name: material.name,
        unit: material.unit,
        quantity: material.quantity,
        costPerUnit: material.costPerUnit,
        lowStockThreshold: material.lowStockThreshold || 10,
      });
    } else {
      setEditingMaterial(null);
      setMaterialForm({ name: '', unit: 'kg', quantity: 0, costPerUnit: 0, lowStockThreshold: 10 });
    }
    setShowMaterialModal(true);
  };

  // Open restock modal
  const openRestockModal = (material: RawMaterial) => {
    setRestockMaterial(material);
    setRestockAmount('');
    setShowRestockModal(true);
  };

  // Save material
  const handleSaveMaterial = async () => {
    if (!materialForm.name.trim()) {
      toast.error('Please enter a material name');
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
      toast.error(err.response?.data?.message || 'Failed to save material');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Restock material
  const handleRestock = async () => {
    const amount = parseFloat(restockAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!restockMaterial) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/manufacturing/raw-materials/${restockMaterial.id}/restock`, { amount });
      toast.success('Material restocked');
      setShowRestockModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to restock');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete material
  const handleDeleteMaterial = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Material',
      message: 'Are you sure you want to delete this material? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/manufacturing/raw-materials/${id}`);
          toast.success('Material deleted');
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      }
    });
  };

  const getStockStatus = (material: RawMaterial) => {
    if (material.quantity <= 0) return { label: 'Out of Stock', color: 'red' };
    if (material.lowStockThreshold && material.quantity <= material.lowStockThreshold) {
      return { label: 'Low Stock', color: 'yellow' };
    }
    return { label: 'In Stock', color: 'green' };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
      minimumFractionDigits: 2,
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-green-500 text-xs font-semibold tracking-wider uppercase mb-1">Manufacturing</p>
          <h1 className="text-2xl font-bold text-white">Raw Materials & Inventory</h1>
        </div>
        {activeTab === 'materials' && (
          <button
            onClick={() => openMaterialModal()}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Material
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-white">{stats.totalMaterials}</p>
          <p className="text-gray-400 text-sm">Materials</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-yellow-500">{stats.lowStock}</p>
          <p className="text-gray-400 text-sm">Low Stock</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-red-500">{stats.outOfStock}</p>
          <p className="text-gray-400 text-sm">Out of Stock</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-green-500">{stats.totalPrepared}</p>
          <p className="text-gray-400 text-sm">Prepared Items</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'materials' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          Raw Materials
        </button>
        <button
          onClick={() => setActiveTab('prepared')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'prepared' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          Prepared Items
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab === 'materials' ? 'materials' : 'prepared items'}...`}
          className="w-full max-w-md px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : activeTab === 'materials' ? (
        // Raw Materials Table
        filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-gray-400">No materials found</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Material</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Quantity</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Cost/Unit</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredMaterials.map((material) => {
                  const status = getStockStatus(material);
                  return (
                    <tr key={material.id} className="hover:bg-gray-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                          <span className="text-white font-medium">{material.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {material.quantity.toFixed(2)} {material.unit}
                      </td>
                      <td className="px-6 py-4 text-green-500 font-medium">
                        {formatCurrency(material.costPerUnit)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${status.color === 'green' ? 'bg-green-500/20 text-green-400' : status.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openRestockModal(material)}
                            className="px-3 py-1.5 bg-green-600/20 text-green-400 text-sm rounded-lg hover:bg-green-600/30 transition-colors"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => openMaterialModal(material)}
                            className="text-green-500 hover:text-green-400"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="text-red-500 hover:text-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        // Prepared Items (Sub-recipes)
        filteredSubRecipes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-400">No prepared items found</p>
            <p className="text-gray-500 text-sm mt-1">Create recipes to see prepared items here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-gray-800 rounded-xl border border-gray-700 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-gray-400 text-sm mt-1">{recipe.description}</p>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">In Stock</p>
                    <p className="text-white font-semibold">{recipe.quantity.toFixed(2)} {recipe.yieldUnit}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Yield</p>
                    <p className="text-green-500 font-semibold">{recipe.yield} {recipe.yieldUnit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-md">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingMaterial ? 'Edit Material' : 'Add Material'}
              </h2>
              <button onClick={() => setShowMaterialModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  placeholder="e.g., Flour, Sugar, Butter"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    value={materialForm.quantity}
                    onChange={(e) => setMaterialForm({ ...materialForm, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Unit</label>
                  <select
                    value={materialForm.unit}
                    onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cost per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    value={materialForm.costPerUnit}
                    onChange={(e) => setMaterialForm({ ...materialForm, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Low Stock Alert</label>
                  <input
                    type="number"
                    step="0.01"
                    value={materialForm.lowStockThreshold}
                    onChange={(e) => setMaterialForm({ ...materialForm, lowStockThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowMaterialModal(false)}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMaterial}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {editingMaterial ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && restockMaterial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Restock Material</h2>
              <button onClick={() => setShowRestockModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-400 mb-4">
                Adding to <span className="text-white font-medium">{restockMaterial.name}</span>
              </p>
              <p className="text-gray-500 text-sm mb-2">
                Current: {restockMaterial.quantity.toFixed(2)} {restockMaterial.unit}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount to Add *</label>
                <input
                  type="number"
                  step="0.01"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowRestockModal(false)}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestock}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                Restock
              </button>
            </div>
          </div>
        </div>
      )}

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

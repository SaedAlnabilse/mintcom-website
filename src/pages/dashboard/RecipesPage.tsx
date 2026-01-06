import { useState, useEffect } from 'react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';

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

  // Modal states
  const [showSubRecipeModal, setShowSubRecipeModal] = useState(false);
  const [showFinalRecipeModal, setShowFinalRecipeModal] = useState(false);
  const [showManufactureModal, setShowManufactureModal] = useState(false);
  const [editingSubRecipe, setEditingSubRecipe] = useState<SubRecipe | null>(null);
  const [editingFinalRecipe, setEditingFinalRecipe] = useState<FinalRecipe | null>(null);
  const [manufactureRecipe, setManufactureRecipe] = useState<SubRecipe | null>(null);
  const [manufactureBatches, setManufactureBatches] = useState('1');
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

  // Sub-recipe form
  const [subRecipeForm, setSubRecipeForm] = useState({
    name: '',
    description: '',
    yield: 1,
    yieldUnit: 'units',
    ingredients: [] as { rawMaterialId: string; quantity: number }[],
  });

  // Final recipe form
  const [finalRecipeForm, setFinalRecipeForm] = useState({
    itemId: '',
    ingredients: [] as { rawMaterialId?: string; subRecipeId?: string; quantity: number }[],
  });

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
      toast.error(err.response?.data?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubRecipes = subRecipes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredFinalRecipes = finalRecipes.filter((r) =>
    r.item?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalSubRecipes: subRecipes.length,
    totalFinalRecipes: finalRecipes.length,
    linkedItems: finalRecipes.length,
    unlinkedItems: menuItems.length - finalRecipes.length,
  };

  // Get menu items without recipes
  const unlinkedMenuItems = menuItems.filter(
    (item) => !finalRecipes.some((r) => r.itemId === item.id)
  );

  // Open sub-recipe modal
  const openSubRecipeModal = (recipe?: SubRecipe) => {
    if (recipe) {
      setEditingSubRecipe(recipe);
      setSubRecipeForm({
        name: recipe.name,
        description: recipe.description || '',
        yield: recipe.yield,
        yieldUnit: recipe.yieldUnit,
        ingredients: recipe.ingredients.map((ing) => ({
          rawMaterialId: ing.rawMaterialId,
          quantity: ing.quantity,
        })),
      });
    } else {
      setEditingSubRecipe(null);
      setSubRecipeForm({ name: '', description: '', yield: 1, yieldUnit: 'units', ingredients: [] });
    }
    setShowSubRecipeModal(true);
  };

  // Open final recipe modal
  const openFinalRecipeModal = (recipe?: FinalRecipe) => {
    if (recipe) {
      setEditingFinalRecipe(recipe);
      setFinalRecipeForm({
        itemId: recipe.itemId,
        ingredients: recipe.ingredients.map((ing) => ({
          rawMaterialId: ing.rawMaterialId,
          subRecipeId: ing.subRecipeId,
          quantity: ing.quantity,
        })),
      });
    } else {
      setEditingFinalRecipe(null);
      setFinalRecipeForm({ itemId: '', ingredients: [] });
    }
    setShowFinalRecipeModal(true);
  };

  // Open manufacture modal
  const openManufactureModal = (recipe: SubRecipe) => {
    setManufactureRecipe(recipe);
    setManufactureBatches('1');
    setShowManufactureModal(true);
  };

  // Save sub-recipe
  const handleSaveSubRecipe = async () => {
    if (!subRecipeForm.name.trim()) {
      toast.error('Please enter a recipe name');
      return;
    }
    if (subRecipeForm.ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingSubRecipe) {
        await api.put(`/api/manufacturing/sub-recipes/${editingSubRecipe.id}`, subRecipeForm);
        toast.success('Sub-recipe updated');
      } else {
        await api.post('/api/manufacturing/sub-recipes', subRecipeForm);
        toast.success('Sub-recipe created');
      }
      setShowSubRecipeModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save sub-recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save final recipe
  const handleSaveFinalRecipe = async () => {
    if (!finalRecipeForm.itemId) {
      toast.error('Please select a menu item');
      return;
    }
    if (finalRecipeForm.ingredients.length === 0) {
      toast.error('Please add at least one ingredient');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingFinalRecipe) {
        await api.put(`/api/manufacturing/final-recipes/${editingFinalRecipe.id}`, {
          ingredients: finalRecipeForm.ingredients,
        });
        toast.success('Recipe updated');
      } else {
        await api.post('/api/manufacturing/final-recipes', finalRecipeForm);
        toast.success('Recipe created');
      }
      setShowFinalRecipeModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save recipe');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manufacture sub-recipe
  const handleManufacture = async () => {
    const batches = parseInt(manufactureBatches);
    if (!batches || batches <= 0) {
      toast.error('Please enter a valid number of batches');
      return;
    }
    if (!manufactureRecipe) return;
    setIsSubmitting(true);
    try {
      await api.post(`/api/manufacturing/sub-recipes/${manufactureRecipe.id}/manufacture`, { batches });
      toast.success(`Manufactured ${batches} batch(es) of ${manufactureRecipe.name}`);
      setShowManufactureModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to manufacture');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete sub-recipe
  const handleDeleteSubRecipe = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Sub-Recipe',
      message: 'Are you sure you want to delete this sub-recipe? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/manufacturing/sub-recipes/${id}`);
          toast.success('Sub-recipe deleted');
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      },
    });
  };

  // Delete final recipe
  const handleDeleteFinalRecipe = async (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Recipe',
      message: 'Are you sure you want to delete this recipe? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/manufacturing/final-recipes/${id}`);
          toast.success('Recipe deleted');
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete');
        }
      },
    });
  };

  // Add ingredient to sub-recipe
  const addSubRecipeIngredient = () => {
    setSubRecipeForm({
      ...subRecipeForm,
      ingredients: [...subRecipeForm.ingredients, { rawMaterialId: '', quantity: 0 }],
    });
  };

  // Remove ingredient from sub-recipe
  const removeSubRecipeIngredient = (index: number) => {
    setSubRecipeForm({
      ...subRecipeForm,
      ingredients: subRecipeForm.ingredients.filter((_, i) => i !== index),
    });
  };

  // Add ingredient to final recipe
  const addFinalRecipeIngredient = (type: 'raw' | 'sub') => {
    setFinalRecipeForm({
      ...finalRecipeForm,
      ingredients: [
        ...finalRecipeForm.ingredients,
        type === 'raw' ? { rawMaterialId: '', quantity: 0 } : { subRecipeId: '', quantity: 0 },
      ],
    });
  };

  // Remove ingredient from final recipe
  const removeFinalRecipeIngredient = (index: number) => {
    setFinalRecipeForm({
      ...finalRecipeForm,
      ingredients: finalRecipeForm.ingredients.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-green-500 text-xs font-semibold tracking-wider uppercase mb-1">Manufacturing</p>
          <h1 className="text-2xl font-bold text-white">Recipe Management</h1>
        </div>
        <button
          onClick={() => activeTab === 'final' ? openFinalRecipeModal() : openSubRecipeModal()}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {activeTab === 'final' ? 'Link Recipe' : 'New Sub-Recipe'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-white">{stats.totalFinalRecipes}</p>
          <p className="text-gray-400 text-sm">Product Recipes</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-white">{stats.totalSubRecipes}</p>
          <p className="text-gray-400 text-sm">Sub-Recipes</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-green-500">{stats.linkedItems}</p>
          <p className="text-gray-400 text-sm">Items with Recipes</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <p className="text-2xl font-bold text-yellow-500">{stats.unlinkedItems}</p>
          <p className="text-gray-400 text-sm">Items without Recipes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('final')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'final' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          Product Recipes
        </button>
        <button
          onClick={() => setActiveTab('sub')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'sub' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
        >
          Sub-Recipes
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab === 'final' ? 'product recipes' : 'sub-recipes'}...`}
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
      ) : activeTab === 'final' ? (
        // Final Recipes
        filteredFinalRecipes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-400">No product recipes found</p>
            <p className="text-gray-500 text-sm mt-1">Link a recipe to a menu item to track ingredients</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFinalRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">{recipe.item?.name || 'Unknown Item'}</h3>
                      <p className="text-gray-400 text-sm">{recipe.ingredients.length} ingredients</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openFinalRecipeModal(recipe)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteFinalRecipe(recipe.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {recipe.ingredients.slice(0, 3).map((ing, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">
                        {ing.rawMaterial?.name || ing.subRecipe?.name || 'Unknown'}
                      </span>
                      <span className="text-gray-300">
                        {ing.quantity} {ing.rawMaterial?.unit || ing.subRecipe?.yieldUnit || ''}
                      </span>
                    </div>
                  ))}
                  {recipe.ingredients.length > 3 && (
                    <p className="text-gray-500 text-sm">+{recipe.ingredients.length - 3} more</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Sub-Recipes
        filteredSubRecipes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-400">No sub-recipes found</p>
            <p className="text-gray-500 text-sm mt-1">Create sub-recipes for prepared items like sauces, doughs, etc.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSubRecipes.map((recipe) => (
              <div key={recipe.id} className="bg-gray-800 rounded-xl border border-gray-700 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">{recipe.name}</h3>
                    {recipe.description && (
                      <p className="text-gray-400 text-sm mt-1">{recipe.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openSubRecipeModal(recipe)}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteSubRecipe(recipe.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-gray-500 text-xs">In Stock</p>
                    <p className="text-white font-semibold">{recipe.quantity.toFixed(2)} {recipe.yieldUnit}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Yield/Batch</p>
                    <p className="text-green-500 font-semibold">{recipe.yield} {recipe.yieldUnit}</p>
                  </div>
                </div>
                <button
                  onClick={() => openManufactureModal(recipe)}
                  className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Manufacture
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {/* Sub-Recipe Modal */}
      {showSubRecipeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingSubRecipe ? 'Edit Sub-Recipe' : 'New Sub-Recipe'}
              </h2>
              <button onClick={() => setShowSubRecipeModal(false)} className="text-gray-400 hover:text-white">
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
                  value={subRecipeForm.name}
                  onChange={(e) => setSubRecipeForm({ ...subRecipeForm, name: e.target.value })}
                  placeholder="e.g., Pizza Dough, Tomato Sauce"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  value={subRecipeForm.description}
                  onChange={(e) => setSubRecipeForm({ ...subRecipeForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Yield per Batch</label>
                  <input
                    type="number"
                    step="0.01"
                    value={subRecipeForm.yield}
                    onChange={(e) => setSubRecipeForm({ ...subRecipeForm, yield: parseFloat(e.target.value) || 1 })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Unit</label>
                  <select
                    value={subRecipeForm.yieldUnit}
                    onChange={(e) => setSubRecipeForm({ ...subRecipeForm, yieldUnit: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Ingredients</label>
                  <button
                    type="button"
                    onClick={addSubRecipeIngredient}
                    className="text-green-500 text-sm hover:text-green-400"
                  >
                    + Add Ingredient
                  </button>
                </div>
                {subRecipeForm.ingredients.length === 0 ? (
                  <p className="text-gray-500 text-sm">No ingredients added</p>
                ) : (
                  <div className="space-y-2">
                    {subRecipeForm.ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-2">
                        <select
                          value={ing.rawMaterialId}
                          onChange={(e) => {
                            const updated = [...subRecipeForm.ingredients];
                            updated[index].rawMaterialId = e.target.value;
                            setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                          }}
                          className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select material</option>
                          {rawMaterials.map((m) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          value={ing.quantity}
                          onChange={(e) => {
                            const updated = [...subRecipeForm.ingredients];
                            updated[index].quantity = parseFloat(e.target.value) || 0;
                            setSubRecipeForm({ ...subRecipeForm, ingredients: updated });
                          }}
                          placeholder="Qty"
                          className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeSubRecipeIngredient(index)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowSubRecipeModal(false)}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSubRecipe}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors"
              >
                {editingSubRecipe ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final Recipe Modal */}
      {showFinalRecipeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingFinalRecipe ? 'Edit Recipe' : 'Link Recipe to Item'}
              </h2>
              <button onClick={() => setShowFinalRecipeModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              {!editingFinalRecipe && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Menu Item *</label>
                  <select
                    value={finalRecipeForm.itemId}
                    onChange={(e) => setFinalRecipeForm({ ...finalRecipeForm, itemId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select an item</option>
                    {unlinkedMenuItems.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-300">Ingredients</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addFinalRecipeIngredient('raw')}
                      className="text-green-500 text-sm hover:text-green-400"
                    >
                      + Raw Material
                    </button>
                    <button
                      type="button"
                      onClick={() => addFinalRecipeIngredient('sub')}
                      className="text-blue-500 text-sm hover:text-blue-400"
                    >
                      + Sub-Recipe
                    </button>
                  </div>
                </div>
                {finalRecipeForm.ingredients.length === 0 ? (
                  <p className="text-gray-500 text-sm">No ingredients added</p>
                ) : (
                  <div className="space-y-2">
                    {finalRecipeForm.ingredients.map((ing, index) => (
                      <div key={index} className="flex gap-2">
                        {ing.rawMaterialId !== undefined ? (
                          <select
                            value={ing.rawMaterialId}
                            onChange={(e) => {
                              const updated = [...finalRecipeForm.ingredients];
                              updated[index].rawMaterialId = e.target.value;
                              setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                            }}
                            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          >
                            <option value="">Select material</option>
                            {rawMaterials.map((m) => (
                              <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                            ))}
                          </select>
                        ) : (
                          <select
                            value={ing.subRecipeId}
                            onChange={(e) => {
                              const updated = [...finalRecipeForm.ingredients];
                              updated[index].subRecipeId = e.target.value;
                              setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                            }}
                            className="flex-1 px-3 py-2 bg-blue-900/30 border border-blue-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select sub-recipe</option>
                            {subRecipes.map((r) => (
                              <option key={r.id} value={r.id}>{r.name} ({r.yieldUnit})</option>
                            ))}
                          </select>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          value={ing.quantity}
                          onChange={(e) => {
                            const updated = [...finalRecipeForm.ingredients];
                            updated[index].quantity = parseFloat(e.target.value) || 0;
                            setFinalRecipeForm({ ...finalRecipeForm, ingredients: updated });
                          }}
                          placeholder="Qty"
                          className="w-20 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeFinalRecipeIngredient(index)}
                          className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowFinalRecipeModal(false)}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFinalRecipe}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors"
              >
                {editingFinalRecipe ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manufacture Modal */}
      {showManufactureModal && manufactureRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Manufacture</h2>
              <button onClick={() => setShowManufactureModal(false)} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <p className="text-white font-medium mb-2">{manufactureRecipe.name}</p>
              <p className="text-gray-400 text-sm mb-4">
                Each batch produces {manufactureRecipe.yield} {manufactureRecipe.yieldUnit}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Number of Batches</label>
                <input
                  type="number"
                  value={manufactureBatches}
                  onChange={(e) => setManufactureBatches(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <p className="text-gray-500 text-sm mt-2">
                This will produce {(parseInt(manufactureBatches) || 0) * manufactureRecipe.yield} {manufactureRecipe.yieldUnit}
              </p>
            </div>
            <div className="p-6 border-t border-gray-700 flex gap-3">
              <button
                onClick={() => setShowManufactureModal(false)}
                className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManufacture}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-600 transition-colors"
              >
                Manufacture
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

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CategoryFormModal } from '../../components/forms/CategoryFormModal';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [catsRes, prodsRes] = await Promise.all([
        api.get('/api/categories'),
        api.get('/api/items')
      ]);
      setCategories(catsRes.data || []);
      setProducts(prodsRes.data || []);
    } catch (err: any) {
      toast.error('Failed to load data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const openEditModal = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    setEditingCategory(category);
    setShowModal(true);
  };

  const onSubmit = async (name: string, icon: string, color: string) => {
    try {
      setIsSubmitting(true);
      const payload = { name, icon, color };

      if (editingCategory) {
        await api.patch(`/api/categories/${editingCategory.id}`, payload);
        toast.success('Category updated successfully');
      } else {
        await api.post('/api/categories', payload);
        toast.success('Category created successfully');
      }

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const itemCount = categories.find(c => c.id === categoryId)?._count?.items || 0;
    
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Category',
      message: itemCount > 0
        ? `This category has ${itemCount} products. Deleting it will remove the category from those products. Continue?`
        : 'Are you sure you want to delete this category?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/categories/${categoryId}`);
          toast.success('Category deleted successfully');
          fetchData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Failed to delete category');
        }
      }
    });
  };
  
  // Wrap handle delete for the event listener
  const handleDeleteClick = (e: React.MouseEvent, categoryId: string) => {
      e.stopPropagation();
      handleDelete(categoryId);
  }

  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [categories, searchQuery]);

  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const totalProducts = products.length; // Use actual product count from items API if available, or fallback to category counts
    // Actually sum of category._count might be safer if products array isn't full, but products array is fetched.
    // Let's use products array length for "Total Products" in system.

    // Calculate top category from categories array
    const topCategory = [...categories].sort((a, b) => (b._count?.items || 0) - (a._count?.items || 0))[0];

    return { totalCategories, totalProducts, topCategory };
  }, [categories, products]);

  const chartData = useMemo(() => {
    return categories
      .filter(c => (c._count?.items || 0) > 0)
      .map(c => ({ name: c.name, value: c._count?.items || 0 }))
      .sort((a, b) => b.value - a.value);
  }, [categories]);

  const categoryProducts = useMemo(() => {
    if (!viewingCategory) return [];
    return products.filter(p => p.categoryId === viewingCategory.id);
  }, [viewingCategory, products]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
      minimumFractionDigits: 2,
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  const colors = [
    '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b',
    '#ef4444', '#ec4899', '#6366f1', '#06b6d4'
  ];

  const borderColors = [
    'border-l-green-500', 'border-l-blue-500', 'border-l-purple-500', 'border-l-yellow-500',
    'border-l-red-500', 'border-l-pink-500', 'border-l-indigo-500', 'border-l-cyan-500'
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-gray-400 text-sm">Organize and manage your product catalog</p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-900/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Stats & Charts Overview */}
      {categories.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="space-y-4">
            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-gray-400 text-sm">Total Categories</p>
                <p className="text-2xl font-bold text-white">{stats.totalCategories}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>

            <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-gray-400 text-sm">Total Products</p>
                <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>

            {stats.topCategory && (
              <div className="bg-gray-800 p-5 rounded-xl border border-gray-700 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-gray-400 text-sm">Top Category</p>
                  <p className="text-xl font-bold text-white truncate max-w-[150px]">{stats.topCategory.name}</p>
                  <p className="text-xs text-gray-500">{stats.topCategory._count?.items || 0} items</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-500">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Distribution Chart */}
          <div className="lg:col-span-2 bg-gray-800 p-5 rounded-xl border border-gray-700 flex flex-col shadow-sm">
            <h3 className="text-lg font-semibold text-white mb-4">Product Distribution</h3>
            <div className="flex-1 min-h-[200px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '0.5rem',
                        color: '#F3F4F6'
                      }}
                      itemStyle={{ color: '#F3F4F6' }}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No products assigned to categories yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search & Toolbar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative group">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all group-hover:border-gray-600"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 transition-colors group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <svg className="animate-spin h-10 w-10 text-green-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="text-center py-24 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="w-16 h-16 mx-auto bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>
          <p className="text-gray-300 font-medium mb-2">No categories found</p>
          <p className="text-gray-500 mb-6">Create a new category to get started organizing your products.</p>
          <button
            onClick={openCreateModal}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category, index) => (
            <div
              key={category.id}
              onClick={() => setViewingCategory(category)}
              className={`bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-500 transition-all hover:shadow-xl group relative overflow-hidden cursor-pointer transform hover:-translate-y-1 ${borderColors[index % borderColors.length]} border-l-4`}
            >
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                <button
                  onClick={(e) => openEditModal(e, category)}
                  className="p-1.5 bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600 rounded-lg transition-colors shadow-md"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, category.id)}
                  className="p-1.5 bg-gray-700 text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shadow-md"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div 
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                    style={{ backgroundColor: category.color || '#22c55e' }}
                >
                  {/* We could use the icon here if we had the map in this file, but char is fine for now or pass icon map */}
                   <span className="text-white font-bold text-xl">
                    {category.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg truncate max-w-[140px] group-hover:text-green-400 transition-colors">{category.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-0.5 rounded">Order: {category.sortOrder}</span>
                  </div>
                </div>
              </div>

              {category.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2 min-h-[40px]">
                  {category.description}
                </p>
              )}
              {!category.description && <div className="min-h-[40px]" />}

              <div className="pt-4 border-t border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                  <svg className="w-4 h-4 text-gray-500 group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {category._count?.items || 0} Products
                </div>
                <span className="text-green-500 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  View
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Viewing Category Products Modal */}
      {viewingCategory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={() => setViewingCategory(null)}>
          <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-4xl shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-gray-800/50 rounded-t-2xl">
              <div className="flex items-center gap-4">
                <div 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg`}
                    style={{ backgroundColor: viewingCategory.color || '#22c55e' }}
                >
                  <span className="text-white font-bold text-xl">
                    {viewingCategory.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {viewingCategory.name} Products
                    <span className="text-sm font-normal text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">
                      {categoryProducts.length} items
                    </span>
                  </h2>
                  <p className="text-gray-400 text-sm">Manage products in this category</p>
                </div>
              </div>
              <button
                onClick={() => setViewingCategory(null)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {categoryProducts.length === 0 ? (
                <div className="text-center py-16 bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                  <div className="w-16 h-16 mx-auto bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <p className="text-gray-400 font-medium">No products in this category yet</p>
                  <p className="text-gray-500 text-sm mt-1">Go to Products section to add items.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryProducts.map((product) => (
                    <div key={product.id} className="bg-gray-700/30 border border-gray-700 rounded-xl p-4 hover:border-gray-500 hover:bg-gray-700/50 transition-all group">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-800 rounded-lg flex-shrink-0 flex items-center justify-center border border-gray-600 overflow-hidden">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-medium truncate group-hover:text-green-400 transition-colors">{product.name}</h3>
                          <p className="text-green-500 font-bold mt-1">{formatCurrency(Number(product.price))}</p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                            <span className={`w-2 h-2 rounded-full ${(product.availableStock || 0) > 0 ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                            {product.availableStock || 0} in stock
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl flex justify-end">
              <button
                onClick={() => setViewingCategory(null)}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit/Create Modal */}
      <CategoryFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={onSubmit}
        onDelete={editingCategory ? () => handleDelete(editingCategory.id) : undefined}
        initialData={editingCategory}
        isSubmitting={isSubmitting}
      />

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

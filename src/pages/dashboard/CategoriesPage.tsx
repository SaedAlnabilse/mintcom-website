import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Package,
  TrendingUp,
  Layers,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Tag,
  AlertTriangle
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CategoryFormModal, ICON_MAP } from '../../components/forms/CategoryFormModal';

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
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteBlockedCategory, setDeleteBlockedCategory] = useState<Category | null>(null);

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
    const state = location.state as { openCreateModal?: boolean };
    if (state?.openCreateModal) {
      setEditingCategory(null);
      setShowModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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

  const onSubmit = async (name: string, icon: string, sortOrder: number) => {
    try {
      setIsSubmitting(true);
      const payload = { name, icon, sortOrder };
      if (editingCategory) {
        await api.patch(`/api/categories/${editingCategory.id}`, payload);
        toast.success('Category updated');
      } else {
        await api.post('/api/categories', payload);
        toast.success('Category created');
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    const categoryItems = products.filter(p => p.categoryId === categoryId);

    if (categoryItems.length > 0) {
      setDeleteBlockedCategory(category || null);
      return;
    }

    setConfirmConfig({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/categories/${categoryId}`);
          toast.success('Category deleted');
          fetchData();
        } catch (err: any) {
          toast.error('Failed to delete category');
        }
      }
    });
  };

  const stats = useMemo(() => {
    const topCategory = [...categories].sort((a, b) => (b._count?.items || 0) - (a._count?.items || 0))[0];
    return {
      total: categories.length,
      products: products.length,
      top: topCategory
    };
  }, [categories, products]);

  const categoryProducts = useMemo(() => {
    const targetId = viewingCategory?.id || deleteBlockedCategory?.id;
    if (!targetId) return [];
    return products.filter(p => p.categoryId === targetId);
  }, [viewingCategory, deleteBlockedCategory, products]);


  const ViewingIcon = viewingCategory ? (ICON_MAP[viewingCategory.icon || 'tag'] || Tag) : Tag;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest border border-paymint-green/20">
              Menu Management
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Categories</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Organize your menu structure and groupings
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Categories', value: stats.total, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Total Products', value: stats.products, icon: Package, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
          { label: 'Most Popular', value: stats.top?.name || 'N/A', sub: `${stats.top?._count?.items || 0} items`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (

          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
            <div className="relative z-10 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white truncate">{stat.value}</p>
                {stat.sub && (
                  <p className="text-[10px] font-bold text-paymint-green uppercase tracking-wide mt-1">{stat.sub}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
          <p className="text-xs font-black uppercase text-gray-400">Loading Categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
            <Layers className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No categories yet</h3>
          <p className="text-gray-500 max-w-xs text-sm">Create your first category to start organizing your menu items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, idx) => {
            const IconComponent = ICON_MAP[category.icon || 'tag'] || Tag;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setViewingCategory(category)}
                className="group relative bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 hover:shadow-xl transition-all cursor-pointer overflow-hidden duration-300"
              >
                <div
                  className="absolute top-0 left-0 w-1 h-full bg-paymint-green opacity-0 group-hover:opacity-100 transition-all duration-300"
                />
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-paymint-green/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-500 group-hover:bg-paymint-green group-hover:text-black transition-all duration-300 shadow-sm group-hover:shadow-paymint-green/20"
                  >
                    <IconComponent size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={(e) => openEditModal(e, category)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-paymint-green transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-paymint-red transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors leading-tight truncate relative z-10">
                  {category.name}
                </h3>

                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">{category._count?.items || 0} Items</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {viewingCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setViewingCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1E293B] w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-white/10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-paymint-green/10 text-paymint-green"
                  >
                    <ViewingIcon size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{viewingCategory.name}</h2>
                    <p className="text-xs font-black text-paymint-green uppercase tracking-widest">{categoryProducts.length} Products Assigned</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/dashboard/products', { state: { openCreateModal: true, categoryId: viewingCategory.id } })}
                    className="p-2 rounded-xl hover:bg-paymint-green/10 text-paymint-green hover:scale-105 transition-all"
                    title="Add Product"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={() => setViewingCategory(null)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {categoryProducts.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 shadow-sm">
                      <Package size={40} strokeWidth={1.5} className="text-gray-300" />
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white uppercase tracking-tight text-lg mb-2">No items in this category</p>
                    <p className="text-sm text-gray-500 font-medium max-w-xs mx-auto mb-8">Start building your menu by adding products to this category.</p>
                    <button
                      onClick={() => navigate('/dashboard/products', { state: { openCreateModal: true, categoryId: viewingCategory.id } })}
                      className="flex items-center gap-2 px-6 py-3.5 bg-paymint-green text-black font-black text-xs rounded-xl hover:scale-[1.02] transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                    >
                      <Plus size={18} strokeWidth={3} />
                      <span>Create Your First Product</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigate('/dashboard/products', { state: { productId: p.id, categoryId: viewingCategory.id } })}
                        className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group hover:border-paymint-green/30 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4"
                      >
                        <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 overflow-hidden shrink-0">
                          {p.image ? (
                            <img src={p.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <ImageIcon size={16} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-xs font-black text-paymint-green mt-0.5">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'JOD' }).format(p.price).replace('JOD', '').trim()} JOD
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* Add New Product Card */}
                    <button
                      onClick={() => navigate('/dashboard/products', { state: { openCreateModal: true, categoryId: viewingCategory.id } })}
                      className="p-4 bg-gray-50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl group hover:border-paymint-green hover:bg-paymint-green/5 transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center gap-3 h-full min-h-[80px]"
                    >
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                        <Plus size={20} className="text-gray-400 group-hover:text-paymint-green" />
                      </div>
                      <span className="text-sm font-bold text-gray-400 group-hover:text-paymint-green">
                        Add New Item
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Delete Blocked Modal */}
      <AnimatePresence>
        {deleteBlockedCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setDeleteBlockedCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1E293B] w-full max-w-4xl rounded-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-200 dark:border-white/10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-500/10 text-red-500"
                  >
                    {(() => {
                      const Icon = ICON_MAP[deleteBlockedCategory.icon || 'tag'] || Tag;
                      return <Icon size={24} />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{deleteBlockedCategory.name}</h2>
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest">{categoryProducts.length} PRODUCTS ASSIGNED</p>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteBlockedCategory(null)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                    <AlertTriangle size={16} />
                    You cannot delete this category while it has products assigned. Please reassign or delete the products below first.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => navigate('/dashboard/products', { state: { productId: p.id, categoryId: deleteBlockedCategory.id } })}
                      className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-xl group hover:border-paymint-green/30 transition-all cursor-pointer active:scale-[0.98] flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 overflow-hidden shrink-0">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{p.name}</p>
                        <p className="text-xs font-black text-paymint-green mt-0.5">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'JOD' }).format(p.price).replace('JOD', '').trim()} JOD
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import {

  Plus,
  Search,
  PieChart as ChartIcon,
  Package,
  TrendingUp,
  Layers,
  ChevronRight,
  Edit2,
  Trash2,
  X,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { CategoryFormModal, ICON_MAP } from '../../components/forms/CategoryFormModal';
import { useTheme } from '../../context/ThemeContext';

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
  const { resolvedTheme } = useTheme();
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

  const onSubmit = async (name: string, icon: string) => {
    try {
      setIsSubmitting(true);
      const payload = { name, icon };
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
    const itemCount = categories.find(c => c.id === categoryId)?._count?.items || 0;
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Category',
      message: itemCount > 0
        ? `This category contains ${itemCount} products. Deleting it will un-categorize them. Proceed?`
        : 'Are you sure you want to delete this category?',
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

  const filteredCategories = useMemo(() => {
    return categories.filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const stats = useMemo(() => {
    const topCategory = [...categories].sort((a, b) => (b._count?.items || 0) - (a._count?.items || 0))[0];
    return {
      total: categories.length,
      products: products.length,
      top: topCategory
    };
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

  const colors = ['#7CC39F', '#3b82f6', '#8b5cf6', '#f59e0b', '#D55263', '#ec4899', '#6366f1', '#06b6d4'];
  const ViewingIcon = viewingCategory ? (ICON_MAP[viewingCategory.icon || 'tag'] || Tag) : Tag;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cream-50 via-cream-100 to-cream-50 dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-cream-300 dark:border-white/5 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
              <Layers size={28} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Catalog Categories</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Organize your menu items for better navigation and reporting</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/30"
            >
              <Plus size={18} />
              <span>New Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="grid grid-cols-1 gap-4">
          {[
            { label: 'Total Categories', value: stats.total, icon: Layers, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Total Products', value: stats.products, icon: Package, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
            { label: 'Most Popular', value: stats.top?.name || 'N/A', sub: `${stats.top?._count?.items || 0} items`, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          ].map((stat, i) => (
            <div key={i} className="p-6 rounded-3xl bg-cream-50 dark:bg-[#0A0A0A] border border-cream-300 dark:border-white/5 shadow-md hover:shadow-lg hover:border-cream-400 dark:hover:border-white/10 transition-all flex items-center gap-5">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                {stat.sub && <p className="text-xs font-bold text-paymint-green uppercase">{stat.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 bg-cream-50 dark:bg-[#0A0A0A] p-8 rounded-[2.5rem] border border-cream-300 dark:border-white/5 shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ChartIcon size={18} className="text-paymint-green" />
              Distribution Analysis
            </h3>
          </div>
          <div className="h-[320px] relative z-10 -mt-4">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="35%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={index} fill={colors[index % colors.length]} stroke="none" />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: resolvedTheme === 'dark' ? '#111111' : '#FFFFFF',
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      padding: '12px'
                    }}
                    itemStyle={{
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      fontSize: '10px',
                      letterSpacing: '0.05em',
                      color: resolvedTheme === 'dark' ? '#FFFFFF' : '#111111'
                    }}
                    labelStyle={{
                      color: resolvedTheme === 'dark' ? '#7CC39F' : '#059669',
                      fontWeight: '900',
                      marginBottom: '4px'
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span style={{
                        color: resolvedTheme === 'dark' ? '#A1A1AA' : '#4B5563',
                        fontSize: '11px',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        paddingLeft: '4px'
                      }}>
                        {value}
                      </span>
                    )}
                    wrapperStyle={{
                      paddingLeft: '20px',
                      overflowY: 'auto',
                      maxHeight: '280px'
                    }}
                  />

                </PieChart>
              </ResponsiveContainer>
            ) : (

              <div className="h-full flex items-center justify-center text-gray-400 text-sm font-bold uppercase tracking-widest">
                No Data Available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="flex-1 relative group max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-11 pr-4 py-3 bg-cream-100 dark:bg-[#1a1a1a] border border-cream-300 dark:border-white/10 rounded-2xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green/30 shadow-md transition-all text-sm font-medium"
        />
      </div>

      {isLoading ? (
        <div className="py-24 flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="py-24 bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] border border-cream-300 dark:border-white/5 text-center flex flex-col items-center shadow-md">
          <div className="w-24 h-24 bg-cream-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 border border-cream-300 dark:border-transparent">
            <Layers className="w-12 h-12 text-gray-300" />
          </div>
          <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No categories yet</h3>
          <p className="text-gray-500 max-w-xs font-medium">Create your first category to start organizing your menu items.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredCategories.map((category, idx) => {
            const IconComponent = ICON_MAP[category.icon || 'tag'] || Tag;
            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setViewingCategory(category)}
                className="group relative bg-cream-50 dark:bg-[#0A0A0A] p-6 rounded-[2rem] border border-cream-300 dark:border-white/5 shadow-md hover:shadow-xl hover:border-cream-400 dark:hover:border-white/10 transition-all cursor-pointer overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 w-2 h-full opacity-70 group-hover:w-3 transition-all bg-paymint-green"
                />

                <div className="flex justify-between items-start mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 bg-paymint-green"
                  >
                    <IconComponent size={28} className="text-black" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                    <button
                      onClick={(e) => openEditModal(e, category)}
                      className="p-2 rounded-lg bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-600 dark:text-gray-500 hover:text-paymint-green hover:border-paymint-green/30 transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(category.id); }}
                      className="p-2 rounded-lg bg-cream-100 dark:bg-white/5 border border-cream-300 dark:border-transparent text-gray-600 dark:text-gray-500 hover:text-paymint-red hover:border-paymint-red/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors leading-tight">
                  {category.name}
                </h3>

                <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Order: {category.sortOrder}</p>

                <div className="mt-8 pt-4 border-t border-cream-300 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400" />
                    <span className="text-sm font-black text-gray-500">{category._count?.items || 0} Items</span>
                  </div>
                  <ChevronRight size={18} className="text-gray-300 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setViewingCategory(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-cream-50 dark:bg-[#0A0A0A] w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 border-b border-cream-200 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div
                    className="w-16 h-16 rounded-[1.25rem] flex items-center justify-center shadow-lg bg-paymint-green"
                  >
                    <ViewingIcon size={32} className="text-black" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{viewingCategory.name}</h2>
                    <p className="text-sm font-black text-paymint-green uppercase tracking-widest">{categoryProducts.length} Products Assigned</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingCategory(null)}
                  className="p-3 rounded-2xl bg-cream-100 dark:bg-white/5 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                {categoryProducts.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center opacity-50">
                    <Package size={64} strokeWidth={1} className="text-gray-300 mb-4" />
                    <p className="font-black text-gray-500 uppercase tracking-widest text-xs">No items in this category</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryProducts.map((p) => (
                      <div key={p.id} className="p-5 bg-cream-100 dark:bg-white/[0.02] border border-cream-200 dark:border-white/5 rounded-3xl group hover:border-paymint-green/30 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-cream-50 dark:bg-white/5 border border-cream-200 dark:border-white/5 overflow-hidden">
                            {p.image ? (
                              <img src={p.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <ImageIcon size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white truncate max-w-[150px]">{p.name}</p>
                            <p className="text-paymint-green font-black mt-1">
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'JOD' }).format(p.price).replace('JOD', '').trim()} JOD
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
    </div >
  );
}
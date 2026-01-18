import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Grid,
  List,
  Package,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Download
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ProductFormModal } from '../../components/forms/ProductFormModal';
import { exportToCSV } from '../../utils/export';
import { CustomSelect } from '../../components/CustomSelect';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  costPrice?: number;
  categoryId?: string;
  category?: { id: string; name: string };
  image?: string;
  isAvailable: boolean;
  availableStock?: number;
  trackStock?: boolean;
  allowNegativeStock?: boolean;
  lowStockThresholdYellow?: number;
  lowStockThresholdRed?: number;
  barcode?: string;
  type?: 'ITEM' | 'ADDON';
}

interface Category {
  id: string;
  name: string;
}

export function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

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

  const getImageUrl = (imagePath?: string) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const baseUrl = 'https://grateful-liberation-production-d036.up.railway.app';
    return `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchProducts(),
        fetchCategories()
      ]);
    };
    init();
  }, []);

  useEffect(() => {
    if (isLoading || isCategoriesLoading) return; // Wait for both types of data to be ready

    const state = location.state as { productId?: string; categoryId?: string; openCreateModal?: boolean };

    if (state?.openCreateModal) {
      openCreateModal(state.categoryId);
    }
    // ... rest of logic
    if (state?.categoryId) {
      setCategoryFilter(state.categoryId);
    }

    if (state?.productId && products.length > 0) {
      const product = products.find(p => p.id === state.productId);
      if (product) {
        setEditingProduct(product);
        setShowModal(true);
      }
    }

    // Clean up state only after processing everything
    if (state?.productId || state?.categoryId || state?.openCreateModal) {
      window.history.replaceState({}, document.title);
    }
  }, [location.state, products, categories, isLoading, isCategoriesLoading]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/items');
      setProducts(response.data || []);
    } catch (err: any) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsCategoriesLoading(true);
      const response = await api.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories');
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  const openCreateModal = (defaultCategoryId?: string) => {
    // Skip categories length check if we already have a default category target
    // or if we are still loading (to prevent premature warning)
    if (!defaultCategoryId && categories.length === 0 && !isLoading && !isCategoriesLoading) {
      setConfirmConfig({
        isOpen: true,
        title: 'No Categories Found',
        message: 'You need to create a category before adding products. Would you like to create one now?',
        type: 'warning',
        onConfirm: () => {
          navigate('/dashboard/categories', { state: { openCreateModal: true } });
        }
      });
      return;
    }
    setEditingProduct(defaultCategoryId ? { categoryId: defaultCategoryId } as Product : null);
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setShowModal(true);
  };

  const handleExport = () => {
    const exportData = filteredProducts.map(p => ({
      name: p.name,
      category: p.category?.name || 'Uncategorized',
      price: p.price,
      cost: p.costPrice || 0,
      stock: p.trackStock ? p.availableStock : 'N/A',
      status: p.isAvailable ? 'Active' : 'Inactive',
      barcode: p.barcode || 'N/A'
    }));

    exportToCSV(exportData, 'products_catalog', {
      name: 'Product Name',
      category: 'Category',
      price: 'Price (JOD)',
      cost: 'Cost Price (JOD)',
      stock: 'Stock Level',
      status: 'Status',
      barcode: 'Barcode'
    });
  };

  const onSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      // Force Content-Type to undefined/null so browser sets the boundary
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: [(data: any) => data], // Prevent Axios from stringifying FormData
      };

      if (editingProduct?.id) {
        await api.patch(`/api/items/${editingProduct.id}`, formData, config);
      } else {
        await api.post('/api/items', formData, config);
      }
      toast.success(editingProduct?.id ? 'Product updated' : 'Product created');
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
      console.error(err);
      toast.error('Error saving product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Delete Product',
      message: 'This will permanently remove the product from your menu. Continue?',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.delete(`/api/items/${productId}`);
          toast.success('Product deleted');
          fetchProducts();
        } catch (err: any) {
          toast.error('Failed to delete product');
        }
      }
    });
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, page]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'JOD',
    }).format(value).replace('JOD', '').trim() + ' JOD';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black uppercase tracking-widest border border-paymint-green/20">
              Inventory
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Products & Menu</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage items, stock levels, and pricing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
          >
            <Plus size={18} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B1120] rounded-2xl border border-gray-200 dark:border-white/[0.03] p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              placeholder="Search products..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
            />
          </div>

          {/* Filters Top Right of Control Bar */}
          <div className="flex items-center gap-3">
            <div className="w-64">
              <CustomSelect
                value={categoryFilter}
                onChange={(val) => { setCategoryFilter(val as string); setPage(1); }}
                options={[
                  { label: 'All Categories', value: 'all' },
                  ...categories.map(cat => ({ label: cat.name, value: cat.id }))
                ]}
                className="category-pill-select"
              />
            </div>

            <div className="flex items-center bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/[0.03] p-1.5 shadow-sm">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 text-paymint-green shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div>
        {isLoading ? (
          <div className="py-20 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin mb-4" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">Loading Inventory...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center bg-white dark:bg-[#0B1120] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 shadow-inner">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 shadow-sm">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No items found</h3>
            <p className="text-gray-500 max-w-xs text-sm font-medium">Create your first product to get started with your inventory.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedProducts.map((product, index) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="group bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden hover:border-paymint-green/50 transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-white/5 relative overflow-hidden">
                    {getImageUrl(product.image) ? (
                      <img src={getImageUrl(product.image)!} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <ImageIcon size={32} strokeWidth={1.5} />
                      </div>
                    )}
                    {!product.isAvailable && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-gray-900/80 text-white backdrop-blur-sm">
                          Hidden
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                      <button onClick={() => openEditModal(product)} className="p-2.5 rounded-xl bg-white text-black hover:bg-paymint-green transition-colors active:scale-95">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="p-2.5 rounded-xl bg-white text-red-500 hover:bg-red-500 hover:text-white transition-colors active:scale-95">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{product.category?.name || 'Uncategorized'}</p>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-paymint-green transition-colors">{product.name}</h3>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(product.price)}</p>
                      {product.trackStock && (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${(product.availableStock || 0) <= (product.lowStockThresholdYellow || 5) ? 'text-paymint-red bg-paymint-red/10' : 'text-paymint-green bg-paymint-green/10'}`}>
                          {product.availableStock} Units
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr className="border-b border-gray-200 dark:border-white/5">
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory</th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {paginatedProducts.map((p) => (
                  <tr key={p.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 overflow-hidden border border-gray-200 dark:border-white/5">
                          {getImageUrl(p.image) ? <img src={getImageUrl(p.image)!} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="m-auto text-gray-300" />}
                        </div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{p.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-medium text-gray-500 dark:text-gray-400">{p.category?.name || 'Uncategorized'}</span></td>
                    <td className="px-6 py-4"><span className={`font-black text-[10px] uppercase tracking-widest ${p.trackStock && (p.availableStock || 0) <= 5 ? 'text-paymint-red bg-paymint-red/10 px-2 py-1 rounded-lg' : 'text-gray-700 dark:text-gray-300'} ${!p.trackStock ? 'text-xl text-gray-400' : ''}`}>{p.trackStock ? `${p.availableStock} Units` : '∞'}</span></td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white text-sm">{formatCurrency(p.price)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(p)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-paymint-green transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-[#0B1120] border border-gray-200 dark:border-white/[0.03] shadow-sm">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronLeft size={18} /></button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === i + 1 ? 'bg-paymint-green text-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        </div>
      )}

      <ProductFormModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={onSubmit} onDelete={editingProduct ? () => handleDelete(editingProduct.id) : undefined} initialData={editingProduct} categories={categories} isSubmitting={isSubmitting} />
      <ConfirmModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} />
    </div>
  );
}

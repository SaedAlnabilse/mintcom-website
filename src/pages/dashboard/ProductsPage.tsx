import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

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
    fetchProducts();
    fetchCategories();
  }, []);

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
      const response = await api.get('/api/categories');
      setCategories(response.data || []);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  const openCreateModal = () => {
    setEditingProduct(null);
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
      if (editingProduct) {
        await api.patch(`/api/items/${editingProduct.id}`, formData);
        toast.success('Product updated');
      } else {
        await api.post('/api/items', formData);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err: any) {
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
    <div className="h-[calc(100vh-120px)] flex flex-col space-y-6">
      {/* Header - Fixed */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Products & Menu</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage items, stock levels, and pricing.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <Download size={18} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-paymint-green text-black font-black rounded-2xl hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-paymint-green/20 active:scale-95"
          >
            <Plus size={20} />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Control Bar - Fixed */}
      <div className="shrink-0 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-paymint-green transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search products..."
            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 rounded-[1.25rem] text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-paymint-green/20 shadow-sm transition-all"
          />
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="pl-11 pr-8 py-3.5 bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 rounded-[1.25rem] text-gray-900 dark:text-white font-bold text-xs cursor-pointer focus:ring-2 focus:ring-paymint-green/20 shadow-sm appearance-none min-w-[160px]"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="bg-white dark:bg-[#0A0A0A] border border-gray-100 dark:border-white/5 rounded-[1.25rem] p-1 flex gap-1 shadow-sm">
            <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-paymint-green text-black' : 'text-gray-400 hover:text-gray-600'}`}>
              <Grid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-paymint-green text-black' : 'text-gray-400 hover:text-gray-600'}`}>
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase text-gray-400">Loading Inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mb-6">
                <Package className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No items found</h3>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
              {paginatedProducts.map((product) => (
                <motion.div layout key={product.id} className="group bg-white dark:bg-[#0A0A0A] rounded-[2rem] border border-gray-200 dark:border-white/5 overflow-hidden shadow-md hover:shadow-xl hover:border-paymint-green/30 transition-all duration-300 relative">
                  <div className="aspect-[4/3] bg-gray-100 dark:bg-black/20 relative overflow-hidden">
                    {getImageUrl(product.image) ? (
                      <img src={getImageUrl(product.image)!} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-300">
                        <ImageIcon size={40} strokeWidth={1} />
                      </div>
                    )}
                    {!product.isAvailable && (
                      <div className="absolute top-4 left-4">
                        <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg bg-accent text-white">
                          Hidden
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                      <button onClick={() => openEditModal(product)} className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center hover:bg-paymint-green hover:text-black transition-colors shadow-lg active:scale-95"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(product.id)} className="w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center hover:bg-accent hover:text-white transition-colors shadow-lg active:scale-95"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="p-5 bg-white dark:bg-[#0A0A0A]">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{product.category?.name || 'Uncategorized'}</p>
                    <h3 className="font-black text-gray-900 dark:text-white truncate group-hover:text-paymint-green transition-colors">{product.name}</h3>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                      <p className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(product.price)}</p>
                      {product.trackStock && (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${(product.availableStock || 0) <= (product.lowStockThresholdYellow || 5) ? 'text-accent bg-accent/10' : 'text-paymint-green bg-paymint-green/10'}`}>
                          {product.availableStock} Stock
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0A0A0A] rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-white dark:bg-[#0A0A0A]">
                  <tr className="border-b border-gray-50 dark:border-white/5">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Product</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inventory</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Price</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {paginatedProducts.map((p) => (
                    <tr key={p.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-black/40 overflow-hidden border border-gray-100 dark:border-white/5">
                            {getImageUrl(p.image) ? <img src={getImageUrl(p.image)!} className="w-full h-full object-cover" /> : <ImageIcon size={16} className="m-auto text-gray-300" />}
                          </div>
                          <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{p.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-4"><span className="text-[10px] font-black text-gray-500 uppercase">{p.category?.name || 'Uncategorized'}</span></td>
                      <td className="px-8 py-4"><span className={`text-xs font-bold ${p.trackStock && (p.availableStock || 0) <= 5 ? 'text-paymint-red' : 'text-gray-700 dark:text-gray-300'}`}>{p.trackStock ? `${p.availableStock} Units` : '∞'}</span></td>
                      <td className="px-8 py-4 font-black text-paymint-green">{formatCurrency(p.price)}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEditModal(p)} className="p-2 text-gray-400 hover:text-paymint-green transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-accent transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination - Fixed */}
        {totalPages > 1 && (
          <div className="shrink-0 px-8 py-4 border-t border-gray-50 dark:border-white/5 bg-gray-50/50 dark:bg-[#0A0A0A] flex items-center justify-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 disabled:opacity-30"><ChevronLeft size={18} /></button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${page === i + 1 ? 'bg-paymint-green text-black shadow-lg' : 'text-gray-400 hover:text-gray-900'}`}>{i + 1}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 disabled:opacity-30"><ChevronRight size={18} /></button>
          </div>
        )}
      </div>

      <ProductFormModal isOpen={showModal} onClose={() => setShowModal(false)} onSubmit={onSubmit} onDelete={editingProduct ? () => handleDelete(editingProduct.id) : undefined} initialData={editingProduct} categories={categories} isSubmitting={isSubmitting} />
      <ConfirmModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })} onConfirm={confirmConfig.onConfirm} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} />
    </div>
  );
}
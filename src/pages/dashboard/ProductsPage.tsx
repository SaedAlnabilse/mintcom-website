import { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check,
    ChevronDown,
    Plus,
    Search,
    Grid,
    List,
    Download,
    Trash2,
    Edit2,
    Package,

    ArrowUpDown,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ProductFormModal } from '../../components/forms/ProductFormModal';
import { LoadingFallback } from '../../components/LoadingFallback';
import { QuickInfo } from '../../components/QuickInfo';

interface Category {
    id: string;
    name: string;
    icon?: string;
    sortOrder?: number;
}

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    costPrice?: number;
    categoryId?: string;
    image?: string;
    isAvailable: boolean;
    availableStock?: number;
    trackStock?: boolean;
    allowNegativeStock?: boolean;
    lowStockThresholdYellow?: number;
    lowStockThresholdRed?: number;
    type?: 'ITEM' | 'ADDON';
}

export function ProductsPage() {
    const location = useLocation();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [categorySearchQuery, setCategorySearchQuery] = useState('');
    const categoryDropdownRef = useRef<HTMLDivElement>(null);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Product | 'category'; direction: 'asc' | 'desc' } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Click outside handler for category dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setShowCategoryDropdown(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirmation Modal
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

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategoryId, sortConfig]);

    // Handle navigation state opening modal automatically
    useEffect(() => {
        const state = location.state as { openCreateModal?: boolean; categoryId?: string; productId?: string };
        if (state?.openCreateModal) {
            setEditingProduct(null);
            if (state.categoryId) setSelectedCategoryId(state.categoryId);
            setShowModal(true);
            // Clear state to prevent reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location, products]);


    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                api.get('/api/items'),
                api.get('/api/categories')
            ]);
            setProducts(productsRes.data || []);
            setCategories(categoriesRes.data || []);

            // Handle product ID from state if available
            const state = location.state as { productId?: string };
            if (state?.productId) {
                const found = (productsRes.data || []).find((p: Product) => p.id === state.productId);
                if (found) {
                    setEditingProduct(found);
                    setShowModal(true);
                }
            }

        } catch (err) {
            console.error('Failed to load data', err);
            toast.error('Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateNew = () => {
        setEditingProduct(null);
        setShowModal(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Product',
            message: 'Are you sure you want to delete this product? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/items/${id}`);
                    toast.success('Product deleted');
                    fetchData(); // Refresh list
                    setShowModal(false); // Close modal if open
                } catch (err) {
                    console.error('Delete error', err);
                    toast.error('Failed to delete product');
                } finally {
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    const REMOTE_IMAGE_BASE_URL = 'https://grateful-liberation-production-d036.up.railway.app';

    // Used by ProductFormModal
    const onSubmit = async (formData: FormData) => {
        try {
            setIsSubmitting(true);
            const config = {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            };

            if (editingProduct) {
                await api.patch(`/api/items/${editingProduct.id}`, formData, config);
                toast.success('Product updated');
            } else {
                await api.post('/api/items', formData, config);
                toast.success('Product created');
            }
            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error('Save error', err);
            toast.error('Failed to save product');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        // Placeholder for export functionality
        const headers = ['Name', 'Price', 'Category', 'Stock'];
        const csvContent = [
            headers.join(','),
            ...filteredProducts.map(p => {
                const catName = categories.find(c => c.id === p.categoryId)?.name || 'Uncategorized';
                return `"${p.name}",${p.price},"${catName}",${p.trackStock ? p.availableStock : 'Unlimited'}`;
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'products_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSort = (key: keyof Product | 'category') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter by Category
        if (selectedCategoryId !== 'all') {
            result = result.filter(p => p.categoryId === selectedCategoryId);
        }

        // Filter by Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
        }

        // Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Product];
                let bValue: any = b[sortConfig.key as keyof Product];

                // Handle special case for category sorting
                if (sortConfig.key === 'category') {
                    aValue = categories.find(c => c.id === a.categoryId)?.name || '';
                    bValue = categories.find(c => c.id === b.categoryId)?.name || '';
                }

                // Handle string comparison
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                // Handle number comparison
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [products, selectedCategoryId, searchQuery, sortConfig, categories]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        return filteredProducts.slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredProducts, currentPage]);

    // Statistics
    const stats = useMemo(() => ({
        total: filteredProducts.length,
        lowStock: filteredProducts.filter(p => p.trackStock && (p.availableStock || 0) <= (p.lowStockThresholdYellow || 5)).length,
        totalValue: filteredProducts.reduce((acc, curr) => acc + (curr.price * (curr.availableStock || 0)), 0),
        categories: categories.length
    }), [filteredProducts, categories]);

    if (isLoading) return <LoadingFallback message="Loading Inventory..." />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-[10px] font-black tracking-widest border border-paymint-green/20">
                            Menu
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Products</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Manage items and stock.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm group"
                        title="Export Csv"
                    >
                        <Download size={18} className="group-hover:text-paymint-green transition-colors" />
                        <span className="font-bold text-sm">Export</span>
                    </button>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-lg hover:shadow-paymint-green/20 active:scale-95"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span>Add Product</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search Products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm"
                    />
                </div>

                {/* Category Filter (Dropdown) */}
                <div className="flex items-center gap-3">
                    <div className="relative min-w-[200px]" ref={categoryDropdownRef}>
                        <button
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm"
                        >
                            <span>
                                {selectedCategoryId === 'all'
                                    ? 'All Items'
                                    : categories.find(c => c.id === selectedCategoryId)?.name || 'Select Category'}
                            </span>
                            <ChevronDown
                                size={16}
                                className={`text-gray-400 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`}
                            />
                        </button>

                        <AnimatePresence>
                            {showCategoryDropdown && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                >
                                    <div className="p-2 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0f172a]">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={categorySearchQuery}
                                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green"
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                                        <button
                                            onClick={() => {
                                                setSelectedCategoryId('all');
                                                setShowCategoryDropdown(false);
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-between transition-colors ${selectedCategoryId === 'all'
                                                ? 'bg-paymint-green/10 text-paymint-green'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                }`}
                                        >
                                            All Items
                                            {selectedCategoryId === 'all' && <Check size={14} />}
                                        </button>

                                        {categories
                                            .filter(cat => cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                                            .map((cat) => (
                                                <button
                                                    key={cat.id || `cat-${Math.random()}`}
                                                    onClick={() => {
                                                        setSelectedCategoryId(cat.id);
                                                        setShowCategoryDropdown(false);
                                                        setCategorySearchQuery('');
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold flex items-center justify-between transition-colors ${selectedCategoryId === cat.id
                                                        ? 'bg-paymint-green/10 text-paymint-green'
                                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    {cat.name}
                                                    {selectedCategoryId === cat.id && <Check size={14} />}
                                                </button>
                                            ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/5 shrink-0">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-[#1E293B] shadow-sm text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><Package size={18} /></div>
                        <span className="text-[10px] font-black text-gray-400 tracking-widest flex items-center gap-2">
                            Total
                            <QuickInfo text="Total count of unique products." />
                        </span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500"><AlertCircle size={18} /></div>
                        <span className="text-[10px] font-black text-gray-400 tracking-widest flex items-center gap-2">
                            Low Stock
                            <QuickInfo text="Items running low on stock." />
                        </span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{stats.lowStock}</p>
                </div>

                <div className="bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-paymint-green/10 text-paymint-green"><ArrowUpDown size={18} /></div>
                        <span className="text-[10px] font-black text-gray-400 tracking-widest flex items-center gap-2">
                            Value
                            <QuickInfo text="Total value of your current inventory." />
                        </span>
                    </div>
                    <p className="text-xl font-black text-gray-900 dark:text-white truncate">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'Jod' }).format(stats.totalValue).replace('Jod', '').trim()} <span className="text-xs text-gray-400 font-normal">Jod</span>
                    </p>
                </div>
            </div>


            {/* Content */}
            {filteredProducts.length === 0 ? (
                <div className="py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                        <Package className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
                    <p className="text-gray-500 max-w-xs text-sm mb-6">Adjust search or add a product.</p>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-6 py-3 bg-paymint-green text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition-all tracking-widest"
                    >
                        <Plus size={16} />
                        Add First Product
                    </button>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            <AnimatePresence mode="popLayout">
                                {paginatedProducts.map((p, idx) => (
                                    <motion.div
                                        key={p.id || `prod-${idx}`}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 hover:shadow-xl transition-all overflow-hidden flex flex-col cursor-pointer"
                                        onClick={() => handleEdit(p)}
                                    >
                                        <div className="aspect-[4/3] bg-gray-50 dark:bg-black/20 relative overflow-hidden">
                                            {p.image ? (
                                                <img src={p.image.startsWith('http') ? p.image : `${REMOTE_IMAGE_BASE_URL}${p.image.startsWith('/') ? '' : '/'}${p.image}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <Package size={32} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-3">
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="p-1.5 bg-white rounded-lg text-gray-900 hover:bg-paymint-green hover:text-black transition-colors"><Edit2 size={14} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-1.5 bg-white rounded-lg text-paymint-red hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col">
                                            <div className="flex items-start justify-between mb-2 gap-2">
                                                <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight line-clamp-2">{p.name}</h3>
                                                <span className="text-[9px] font-black tracking-widest text-gray-400 bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                                                    {categories.find(c => c.id === p.categoryId)?.name || 'Uncategorized'}
                                                </span>
                                            </div>
                                            {p.description && <p className="text-[10px] text-gray-500 line-clamp-2 mb-3 flex-1">{p.description}</p>}
                                            <div className="border-t border-gray-100 dark:border-white/5 pt-3 flex items-center justify-between mt-auto">
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-400 tracking-widest mb-0.5">Price</p>
                                                    <p className="text-sm font-black text-paymint-green">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'Jod' }).format(p.price).replace('Jod', '').trim()} <span className="text-[10px] opacity-60">Jod</span>
                                                    </p>
                                                </div>
                                                {p.trackStock && (
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-gray-400 tracking-widest mb-0.5">Stock</p>
                                                        <div className={`text-xs font-bold flex items-center justify-end gap-1 ${(p.availableStock || 0) <= (p.lowStockThresholdYellow || 0) ? 'text-amber-500' : 'text-gray-900 dark:text-white'}`}>
                                                            {(p.availableStock || 0) <= (p.lowStockThresholdYellow || 0) && <AlertCircle size={10} />}
                                                            {p.availableStock}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest w-16">Image</th>
                                            <th
                                                className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest cursor-pointer hover:text-paymint-green transition-colors"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Name
                                                    {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest cursor-pointer hover:text-paymint-green transition-colors"
                                                onClick={() => handleSort('category')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Category
                                                    {sortConfig?.key === 'category' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-left text-[10px] font-black text-gray-400 tracking-widest cursor-pointer hover:text-paymint-green transition-colors"
                                                onClick={() => handleSort('availableStock')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Stock
                                                    {sortConfig?.key === 'availableStock' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-right text-[10px] font-black text-gray-400 tracking-widest cursor-pointer hover:text-paymint-green transition-colors"
                                                onClick={() => handleSort('price')}
                                            >
                                                <div className="flex items-center justify-end gap-1">
                                                    Price
                                                    {sortConfig?.key === 'price' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 tracking-widest w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {paginatedProducts.map((p, idx) => (
                                            <tr key={p.id || `table-row-${idx}`} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => handleEdit(p)}>
                                                <td className="px-6 py-4">
                                                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
                                                        {p.image ? (
                                                            <img src={p.image.startsWith('http') ? p.image : `${REMOTE_IMAGE_BASE_URL}${p.image.startsWith('/') ? '' : '/'}${p.image}`} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-300"><Package size={16} /></div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-500">
                                                        {categories.find(c => c.id === p.categoryId)?.name || 'Uncategorized'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {p.trackStock ? (
                                                        <span className={`text-xs font-bold ${(p.availableStock || 0) <= (p.lowStockThresholdYellow || 0) ? 'text-amber-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                                            {p.availableStock} Units
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Unlimited</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'Jod' }).format(p.price).replace('Jod', '').trim()} Jod
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} className="p-2 text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} className="p-2 text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 shadow-sm">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-4 text-xs font-bold text-gray-600 dark:text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 text-gray-500 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <ProductFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={onSubmit}
                onDelete={editingProduct ? () => handleDelete(editingProduct.id) : undefined}
                initialData={editingProduct}
                categories={categories}
                isSubmitting={isSubmitting}
                canViewCosts={true}
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

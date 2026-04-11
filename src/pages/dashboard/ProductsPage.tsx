import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    Check,
    ChevronDown,
    Plus,
    Grid,
    List,
    Download,
    Trash2,
    Edit2,
    Package,
    Infinity as InfinityIcon,
    Upload,
    ArrowUpDown,
    AlertCircle,
    Search,
    X,
    ExternalLink
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '../../components/ConfirmModal';
import { ProductFormModal } from '../../components/forms/ProductFormModal';
import { CsvImportModal, type CsvColumn, type ImportResult } from '../../components/CsvImportModal';
import { LoadingFallback } from '../../components/LoadingFallback';
import { SearchInput, Pagination } from '../../components/ui';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { checkPermission, usePermissionGuard } from '../../hooks/usePermissionGuard';


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
    const { t } = useTranslation();
    usePermissionGuard(['manage_inventory']);
    const { currencySymbol } = useCurrency();
    const { account , currentEstablishment } = useAuth();
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
    const [stockFilter, setStockFilter] = useState<'all' | 'yellow' | 'red' | 'out'>('all');
    const [showCsvImport, setShowCsvImport] = useState(false);
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

    const getStockColor = (stock: number, redLimit?: number, yellowLimit?: number, isList: boolean = false) => {
        const r = redLimit ?? 2;
        const y = yellowLimit ?? 5;
        if (stock <= 0) return 'text-slate-500';
        if (stock <= r) return 'text-paymint-red';
        if (stock <= y) return 'text-amber-500';
        return isList ? 'text-gray-600 dark:text-gray-300' : 'text-gray-900 dark:text-white';
    };

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

    const canViewCosts = checkPermission(account, ['view_cost']);

    const navigationStateChecked = useRef(false);

    const fetchData = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const [productsRes, categoriesRes] = await Promise.all([
                api.get('/api/items'),
                api.get('/api/categories')
            ]);
            // Backend returns { items: [...], total, limit, offset } for paginated response
            // or an array directly for backwards compatibility
            const productsData = productsRes.data?.items ?? productsRes.data;
            setProducts(Array.isArray(productsData) ? productsData : []);
            setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
        } catch (err) {
            console.error('Failed to load data', err);
            toast.error(t('products.messages.loadFailed'));
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    // Handle initial navigation state (once data is loaded)
    useEffect(() => {
        if (!isLoading && products.length > 0 && !navigationStateChecked.current) {
            const state = location.state as {
                productId?: string;
                filterCategoryId?: string;
                openCreateModal?: boolean;
                categoryId?: string;
            };

            if (state) {
                if (state.filterCategoryId || state.categoryId) {
                    setSelectedCategoryId(state.filterCategoryId || state.categoryId || 'all');
                }

                if (state.productId) {
                    const found = products.find((p: Product) => p.id === state.productId);
                    if (found) {
                        setEditingProduct(found);
                        setShowModal(true);
                    }
                } else if (state.openCreateModal) {
                    setEditingProduct(null);
                    setShowModal(true);
                }

                // Clear history state to avoid re-triggering on refresh
                window.history.replaceState({}, document.title);
                navigationStateChecked.current = true;
            }
        }
    }, [isLoading, products, location.state]);

    useEffect(() => {
        fetchData();
    }, [location.pathname]);

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
            title: t('products.delete.title'),
            message: t('products.delete.message'),
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.delete(`/api/items/${id}`);
                    toast.success(t('products.messages.deleted'));
                    fetchData(); // Refresh list
                    setShowModal(false); // Close modal if open
                } catch (err) {
                    console.error('Delete error', err);
                    toast.error(t('products.messages.deleteFailed'));
                } finally {
                    setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    };

    // Helper to construct full image URLs
    // In development, use relative paths to leverage Vite proxy (avoids CORS issues)
    // In production (Cloudflare Workers), use the full backend URL
    const isCloudflareWorkers = typeof window !== 'undefined' &&
        window.location.hostname.endsWith('.workers.dev');
    const BACKEND_URL = isCloudflareWorkers
        ? 'https://grateful-liberation-production-d036.up.railway.app'
        : '';

    const getProductImageUrl = (imagePath?: string) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        // Fix: Remove /public prefix to match POS behavior and correct serving path
        const cleanPath = imagePath.replace('/public', '').replace('public/', '');
        return `${BACKEND_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
    };

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
                toast.success(t('products.messages.updated'));
            } else {
                await api.post('/api/items', formData, config);
                toast.success(t('products.messages.created'));
            }
            setShowModal(false);
            fetchData(true);
        } catch (err) {
            console.error('Save error', err);
            toast.error(t('products.messages.saveFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = () => {
        // Placeholder for export functionality
        const headers = [
            t('products.table.name'),
            t('products.table.price'),
            t('products.table.category'),
            t('products.table.stock')
        ];
        const productsToExport = Array.isArray(filteredProducts) ? filteredProducts : [];
        const csvContent = [
            headers.join(','),
            ...productsToExport.map(p => {
                const catName = (Array.isArray(categories) ? categories : []).find(c => c.id === p.categoryId)?.name || t('categories.uncategorized');
                const stockVal = p.trackStock ? p.availableStock : t('products.table.unlimited');
                return `"${p.name}",${p.price},"${catName}",${stockVal}`;
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
        toast.success(t('products.messages.exportDownloaded'));
    };

    // ─── CSV Import Configuration ──────────────────────────────
    const productCsvColumns: CsvColumn[] = [
        { key: 'name', label: 'Name', required: true, type: 'string' },
        { key: 'price', label: 'Price', required: true, type: 'number' },
        { key: 'category', label: 'Category', required: true, type: 'string' },
        { key: 'description', label: 'Description', required: false, type: 'string' },
        { key: 'cost_price', label: 'Cost Price', required: false, type: 'number' },
        { key: 'track_stock', label: 'Track Stock', required: false, type: 'string' },
        { key: 'available_stock', label: 'Available Stock', required: false, type: 'number' },
    ];

    const productSampleData = [
        { name: 'Cappuccino', price: '4.50', category: 'Hot Drinks', description: 'Classic Italian coffee', cost_price: '1.20', track_stock: 'false', available_stock: '' },
        { name: 'Iced Latte', price: '5.00', category: 'Cold Drinks', description: 'Chilled espresso with milk', cost_price: '1.50', track_stock: 'false', available_stock: '' },
        { name: 'Chocolate Cake', price: '6.00', category: 'Desserts', description: 'Rich chocolate slice', cost_price: '2.00', track_stock: 'true', available_stock: '25' },
        { name: 'Chicken Burger', price: '8.50', category: 'Food', description: 'Grilled chicken with lettuce', cost_price: '3.50', track_stock: 'true', available_stock: '40' },
    ];

    const handleProductCsvImport = useCallback(async (rows: Record<string, string>[]): Promise<ImportResult> => {
        let success = 0;
        let failed = 0;
        const errors: string[] = [];
        const createdCategories: string[] = [];

        // Build a mapping of category name → ID (case-insensitive)
        // Refresh categories first to get latest state
        let categoryMap: Map<string, string>;
        try {
            const res = await api.get('/api/categories');
            const cats = Array.isArray(res.data) ? res.data : [];
            categoryMap = new Map(cats.map((c: Category) => [c.name.toLowerCase().trim(), c.id]));
        } catch {
            categoryMap = new Map(categories.map(c => [c.name.toLowerCase().trim(), c.id]));
        }

        // Build a set of existing product names for duplicate detection
        // Key: "productName|categoryId" (lowercase) to detect duplicates per category
        const existingProducts: Set<string> = new Set();
        try {
            const prodRes = await api.get('/api/items');
            const prods = prodRes.data?.items ?? prodRes.data;
            if (Array.isArray(prods)) {
                prods.forEach((p: Product) => {
                    existingProducts.add(`${p.name.toLowerCase().trim()}|${p.categoryId || ''}`);
                });
            }
        } catch {
            // Fallback to current state
            products.forEach(p => {
                existingProducts.add(`${p.name.toLowerCase().trim()}|${p.categoryId || ''}`);
            });
        }

        // Process rows one by one
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const name = row.name?.trim();
            const priceStr = row.price?.trim();
            const categoryName = row.category?.trim();

            // Validate required fields
            if (!name) {
                errors.push(`Row ${i + 1}: Name is required`);
                failed++;
                continue;
            }
            if (!priceStr || isNaN(Number(priceStr)) || Number(priceStr) < 0) {
                errors.push(`Row ${i + 1}: Price must be a valid positive number`);
                failed++;
                continue;
            }
            if (!categoryName) {
                errors.push(`Row ${i + 1}: Category is required`);
                failed++;
                continue;
            }

            // Find or create the category
            let categoryId = categoryMap.get(categoryName.toLowerCase());

            if (!categoryId) {
                // Auto-create the category
                try {
                    const catPayload = { name: categoryName, icon: 'tag', sortOrder: 0 };
                    const catRes = await api.post('/api/categories', catPayload);
                    categoryId = catRes.data.id;
                    categoryMap.set(categoryName.toLowerCase(), categoryId!);
                    createdCategories.push(categoryName);
                } catch (catErr: any) {
                    const catMsg = catErr.response?.data?.message || '';
                    // If unique constraint, try to fetch the category again (race condition)
                    if (catMsg.includes('Unique constraint')) {
                        try {
                            const refreshRes = await api.get('/api/categories');
                            const refreshCats = Array.isArray(refreshRes.data) ? refreshRes.data : [];
                            const found = refreshCats.find((c: Category) =>
                                c.name.toLowerCase().trim() === categoryName.toLowerCase()
                            );
                            if (found) {
                                categoryId = found.id;
                                categoryMap.set(categoryName.toLowerCase(), categoryId!);
                            }
                        } catch {
                            // ignore - will fail below
                        }
                    }

                    if (!categoryId) {
                        errors.push(`Row ${i + 1}: Failed to create category "${categoryName}" - ${catMsg || 'Unknown error'}`);
                        failed++;
                        continue;
                    }
                }
            }

            // Check for duplicate product (same name + same category)
            const dupKey = `${name.toLowerCase()}|${categoryId}`;
            if (existingProducts.has(dupKey)) {
                errors.push(`Row ${i + 1}: Product "${name}" already exists in "${categoryName}", skipped`);
                failed++;
                continue;
            }

            // Build FormData for product creation (same as ProductFormModal)
            const formData = new FormData();
            formData.append('name', name);
            formData.append('price', priceStr);
            formData.append('categoryId', categoryId!);
            formData.append('trackStock', row.track_stock?.toLowerCase() === 'true' ? 'true' : 'false');

            if (row.description?.trim()) {
                formData.append('description', row.description.trim());
            }
            if (row.cost_price?.trim() && !isNaN(Number(row.cost_price))) {
                formData.append('costPrice', row.cost_price.trim());
            }
            if (row.available_stock?.trim() && !isNaN(Number(row.available_stock))) {
                formData.append('availableStock', row.available_stock.trim());
            }

            // All imported products are considered standard items
            formData.append('type', 'ITEM');

            // isAvailable defaults to true
            formData.append('isAvailable', 'true');

            try {
                await api.post('/api/items', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                existingProducts.add(dupKey); // Track newly created to catch duplicates within same CSV
                success++;
            } catch (err: any) {
                const msg = err.response?.data?.message || err.message || 'Unknown error';
                errors.push(`Row ${i + 1}: Failed to create "${name}" - ${msg}`);
                failed++;
            }
        }

        if (success > 0) {
            fetchData(true); // Refresh silently so the CSV modal stays open
        }

        return { success, failed, errors, createdCategories };
    }, [categories, products, fetchData]);

    const handleSort = (key: keyof Product | 'category') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredProducts = useMemo(() => {
        let result = Array.isArray(products) ? [...products] : [];

        // Filter by Category
        if (selectedCategoryId !== 'all') {
            result = result.filter(p => p.categoryId === selectedCategoryId);
        }

        // Filter by Search Query
        const normalizedSearchQuery = searchQuery.trim().toLowerCase();
        if (normalizedSearchQuery) {
            const query = normalizedSearchQuery;
            result = result.filter(p =>
                p.name.toLowerCase().includes(query) ||
                (p.description && p.description.toLowerCase().includes(query))
            );
        }
        // Filter by Stock Status
        if (stockFilter !== 'all') {
            result = result.filter(p => {
                if (!p.trackStock) return false;
                const stock = p.availableStock || 0;
                const yellowLimit = p.lowStockThresholdYellow || 5;
                const redLimit = p.lowStockThresholdRed || 2;

                switch (stockFilter) {
                    case 'out':
                        return stock <= 0;
                    case 'red':
                        return stock > 0 && stock <= redLimit;
                    case 'yellow':
                        return stock > redLimit && stock <= yellowLimit;
                    default:
                        return true;
                }
            });
        }

        // Sorting
        if (sortConfig) {
            result.sort((a, b) => {
                let aValue: string | number = '';
                let bValue: string | number = '';

                // Handle special case for category sorting
                if (sortConfig.key === 'category') {
                    const cats = Array.isArray(categories) ? categories : [];
                    aValue = cats.find(c => c.id === a.categoryId)?.name || '';
                    bValue = cats.find(c => c.id === b.categoryId)?.name || '';
                } else {
                    const valA = a[sortConfig.key as keyof Product];
                    const valB = b[sortConfig.key as keyof Product];
                    aValue = (typeof valA === 'string' || typeof valA === 'number') ? valA : String(valA || '');
                    bValue = (typeof valB === 'string' || typeof valB === 'number') ? valB : String(valB || '');
                }

                // Handle string comparison
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }

                // Handle number comparison
                const numA = Number(aValue);
                const numB = Number(bValue);
                if (numA < numB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (numA > numB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [products, selectedCategoryId, searchQuery, sortConfig, stockFilter, categories]);

    const totalPages = Math.ceil((Array.isArray(filteredProducts) ? filteredProducts : []).length / ITEMS_PER_PAGE);
    const paginatedProducts = useMemo(() => {
        return (Array.isArray(filteredProducts) ? filteredProducts : []).slice(
            (currentPage - 1) * ITEMS_PER_PAGE,
            currentPage * ITEMS_PER_PAGE
        );
    }, [filteredProducts, currentPage]);

    const hasAnyProducts = (Array.isArray(products) ? products : []).length > 0;
    const selectedCategoryName = (Array.isArray(categories) ? categories : []).find(c => c.id === selectedCategoryId)?.name || '';
    const activeStockFilterLabel =
        stockFilter === 'yellow'
            ? t('products.stats.low')
            : stockFilter === 'red'
                ? t('products.stats.critical')
                : stockFilter === 'out'
                    ? t('products.stats.outOfStock')
                    : '';

    const emptyStateTitle = !hasAnyProducts
        ? t('products.messages.noProducts')
        : stockFilter !== 'all'
            ? `${t('products.messages.noProducts')} (${activeStockFilterLabel})`
            : t('products.messages.noResults');

    const emptyStateDescription = !hasAnyProducts
        ? t('products.messages.noProductsDesc')
        : searchQuery.trim()
            ? t('products.messages.noResultsDesc', { query: searchQuery.trim() })
            : selectedCategoryId !== 'all' && selectedCategoryName
                ? `${t('products.messages.noProducts')} (${selectedCategoryName})`
                : '';

    // Statistics - calculated from all products (not filtered) so counts remain accurate
    const stats = useMemo(() => {
        const trackingProducts = (Array.isArray(products) ? products : []).filter(p => p.trackStock);

        // Out of stock: stock is 0 or negative
        const outOfStock = trackingProducts.filter(p => (p.availableStock || 0) <= 0).length;

        // Red threshold: stock > 0 and stock <= red threshold
        const redThreshold = trackingProducts.filter(p => {
            const stock = p.availableStock || 0;
            const redLimit = p.lowStockThresholdRed || 2;
            return stock > 0 && stock <= redLimit;
        }).length;

        // Yellow threshold: stock > red threshold and stock <= yellow threshold
        const yellowThreshold = trackingProducts.filter(p => {
            const stock = p.availableStock || 0;
            const yellowLimit = p.lowStockThresholdYellow || 5;
            const redLimit = p.lowStockThresholdRed || 2;
            return stock > redLimit && stock <= yellowLimit;
        }).length;

        return {
            total: (Array.isArray(products) ? products : []).length,
            yellowThreshold,
            redThreshold,
            outOfStock,
            totalValue: (Array.isArray(products) ? products : []).reduce((acc, curr) => acc + (curr.price * (curr.availableStock || 0)), 0),
            categories: (Array.isArray(categories) ? categories : []).length
        };
    }, [products, categories]);

    if (isLoading) return <LoadingFallback message={t('products.messages.loading')} />;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('products.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('products.subtitle')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm group"
                        title={t('orders.export')}
                    >
                        <Download size={18} className="group-hover:text-paymint-green transition-colors" />
                        <span className="font-bold text-xs sm:text-sm hidden sm:inline">{t('orders.export')}</span>
                    </button>
                    <button
                        onClick={() => setShowCsvImport(true)}
                        className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm group"
                        title="Import from CSV"
                    >
                        <Upload size={18} className="group-hover:text-paymint-green transition-colors" />
                        <span className="font-bold text-xs sm:text-sm hidden sm:inline">Import CSV</span>
                    </button>
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-paymint-green text-black font-bold text-xs sm:text-sm hover:bg-[#68B390] transition-all shadow-sm"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        <span className="hidden xs:inline">{t('products.addProduct')}</span>
                        <span className="xs:hidden">{t('common.add')}</span>
                    </button>
                </div>
            </div>




            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <SearchInput
                        placeholder={t('products.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery('')}
                        className="w-full"
                    />
                </div>

                {/* Category Filter and View Toggle */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div className="relative flex-1 sm:flex-initial sm:min-w-[200px]" ref={categoryDropdownRef}>
                        <button
                            onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            className="w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-bold rounded-xl px-4 py-3 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm"
                        >
                            <span>
                                {selectedCategoryId === 'all'
                                    ? t('products.all')
                                    : categories.find(c => c.id === selectedCategoryId)?.name || t('common.select') + ' ' + t('products.table.category')}
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
                                            <input maxLength={255}
                                                type="text"
                                                placeholder={t('common.search')}
                                                value={categorySearchQuery}
                                                onChange={(e) => setCategorySearchQuery(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                className="w-full pl-8 pr-9 py-1.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green"
                                                autoFocus
                                            />
                                            {categorySearchQuery && (
                                                <button
                                                    type="button"
                                                    onClick={() => setCategorySearchQuery('')}
                                                    aria-label={t('common.clearSearch', 'Clear search')}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                                >
                                                    <X size={11} strokeWidth={2.75} />
                                                </button>
                                            )}
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
                                            {t('products.all')}
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

            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 md:grid-cols-4 scrollbar-none snap-x snap-mandatory">
                {/* Total Products */}
                <button
                    onClick={() => setStockFilter('all')}
                    className={`group flex-shrink-0 w-[160px] sm:w-auto snap-start text-left bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${stockFilter === 'all'
                        ? 'border-blue-500/50 ring-1 ring-blue-500/30 bg-blue-500/[0.02]'
                        : 'border-gray-200 dark:border-white/[0.03] hover:border-blue-300'
                        }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-500 transition-transform duration-300">
                                <Package size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide truncate capitalize">{t('products.stats.total')}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-blue-500 transition-colors">
                            <ExternalLink size={14} />
                        </div>
                    </div>
                    <p className={`text-2xl font-bold tracking-tight ${stockFilter === 'all' ? 'text-blue-500' : 'text-gray-900 dark:text-white'}`}>
                        {stats.total.toLocaleString(t('common.locale'))}
                    </p>
                    <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                        {t('products.stats.totalDesc')}
                    </p>
                </button>

                {/* Low Stock (Yellow) */}
                <button
                    onClick={() => setStockFilter(stockFilter === 'yellow' ? 'all' : 'yellow')}
                    className={`group flex-shrink-0 w-[160px] sm:w-auto snap-start text-left bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${stockFilter === 'yellow'
                        ? 'border-[#ffc107]/50 ring-1 ring-[#ffc107]/30 bg-[#ffc107]/5'
                        : 'border-gray-200 dark:border-white/[0.03] hover:border-[#ffc107]/30'
                        }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-[#ffc107]/10 text-[#ffc107] transition-transform duration-300">
                                <AlertCircle size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide truncate capitalize">{t('products.stats.low')}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-[#ffc107] transition-colors">
                            <ExternalLink size={14} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#ffc107] tracking-tight">
                        {stats.yellowThreshold.toLocaleString(t('common.locale'))}
                    </p>
                    <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                        {t('products.stats.lowDesc')}
                    </p>
                </button>

                {/* Critical (Red) */}
                <button
                    onClick={() => setStockFilter(stockFilter === 'red' ? 'all' : 'red')}
                    className={`group flex-shrink-0 w-[160px] sm:w-auto snap-start text-left bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${stockFilter === 'red'
                        ? 'border-[#D55263]/50 ring-1 ring-[#D55263]/30 bg-[#D55263]/5'
                        : 'border-gray-200 dark:border-white/[0.03] hover:border-[#D55263]/30'
                        }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-[#D55263]/10 text-[#D55263] transition-transform duration-300">
                                <AlertCircle size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide truncate capitalize">{t('products.stats.critical')}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-[#D55263] transition-colors">
                            <ExternalLink size={14} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-[#D55263] tracking-tight">
                        {stats.redThreshold.toLocaleString(t('common.locale'))}
                    </p>
                    <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                        {t('products.stats.criticalDesc')}
                    </p>
                </button>

                {/* Out of Stock (Gray) */}
                <button
                    onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
                    className={`group flex-shrink-0 w-[160px] sm:w-auto snap-start text-left bg-white dark:bg-[#1E293B] p-4 sm:p-5 rounded-2xl border transition-all duration-300 overflow-hidden ${stockFilter === 'out'
                        ? 'border-slate-500/50 ring-1 ring-slate-500/30 bg-slate-500/[0.02]'
                        : 'border-gray-200 dark:border-white/[0.03] hover:border-slate-400'
                        }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-500/10 text-slate-500 transition-transform duration-300">
                                <Package size={18} className="sm:w-5 sm:h-5" />
                            </div>
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide truncate capitalize">{t('products.stats.outOfStock')}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-slate-500 transition-colors">
                            <ExternalLink size={14} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-500 tracking-tight">
                        {stats.outOfStock.toLocaleString(t('common.locale'))}
                    </p>
                    <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400 mt-3 leading-relaxed">
                        {t('products.stats.outOfStockDesc')}
                    </p>
                </button>
            </div>


            {/* Content */}
            {filteredProducts.length === 0 ? (
                <div className="py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
                        <Package className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{emptyStateTitle}</h3>
                    {emptyStateDescription && (
                        <p className="text-sm font-bold text-gray-500 max-w-xs mb-6">{emptyStateDescription}</p>
                    )}
                    {!hasAnyProducts && (
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-6 py-3 bg-paymint-green text-black font-bold text-xs rounded-xl hover:bg-[#68B390] transition-all tracking-widest"
                        >
                            <Plus size={16} />
                            {t('products.messages.addFirst')}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'grid' ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {paginatedProducts.map((p) => (
                                    <div
                                        key={p.id || `prod-${p.name}`}
                                        className="group bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 hover:border-paymint-green/50 hover:shadow-xl transition-all overflow-hidden flex flex-col cursor-pointer h-full"
                                        onClick={() => handleEdit(p)}
                                    >
                                        <div className="aspect-[4/3] bg-gray-50 dark:bg-black/20 relative overflow-hidden shrink-0">
                                            {p.image ? (
                                                <img src={getProductImageUrl(p.image)!} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <img src="/default_product.png" alt="Default Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 flex items-end justify-between p-3">
                                                <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} aria-label={t('products.editProduct')} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white rounded-lg text-gray-900 hover:bg-paymint-green hover:text-black transition-colors shadow-sm"><Edit2 size={18} /></button>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} aria-label={t('products.delete.title')} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white rounded-lg text-paymint-red hover:bg-red-500 hover:text-white transition-colors shadow-sm"><Trash2 size={18} /></button>
                                            </div>
                                        </div>
                                        <div className="p-3 flex-1 flex flex-col min-h-0">
                                            <div className="flex items-start justify-between mb-2 gap-2">
                                                <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-tight line-clamp-2 h-10">{p.name}</h3>
                                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg whitespace-nowrap shrink-0 h-fit">
                                                    {(Array.isArray(categories) ? categories : []).find(c => c.id === p.categoryId)?.name || t('categories.uncategorized')}
                                                </span>
                                            </div>
                                            {p.description ? (
                                                <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1 min-h-[2.5rem]">{p.description}</p>
                                            ) : (
                                                <div className="flex-1 min-h-[2.5rem]" />
                                            )}
                                            <div className="border-t border-gray-100 dark:border-white/5 pt-3 flex items-center justify-between mt-auto">
                                                <div>
                                                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">{t('products.table.price')}</p>
                                                    <p className="text-sm font-bold text-paymint-green">
                                                        {p.price.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 mb-0.5">{t('products.table.stock')}</p>
                                                    {p.trackStock ? (
                                                        <div className={`text-xs font-bold flex items-center justify-end gap-1 ${getStockColor(p.availableStock || 0, p.lowStockThresholdRed, p.lowStockThresholdYellow)}`}>
                                                            {(p.availableStock || 0) <= (p.lowStockThresholdYellow || 5) && <AlertCircle size={10} />}
                                                            {(p.availableStock || 0).toLocaleString(t('common.locale'))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 flex items-center justify-end">
                                                            <InfinityIcon size={16} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredProducts.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                className="mt-6"
                            />
                        </>
                    ) : (
                        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 w-16">{t('products.table.image')}</th>
                                            <th
                                                className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 cursor-pointer hover:text-paymint-green transition-colors"
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    {t('products.table.name')}
                                                    {sortConfig?.key === 'name' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 cursor-pointer hover:text-paymint-green transition-colors"
                                                onClick={() => handleSort('category')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('products.table.category')}
                                                    {sortConfig?.key === 'category' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 cursor-pointer hover:text-paymint-green transition-colors"
                                                onClick={() => handleSort('availableStock')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('products.table.stock')}
                                                    {sortConfig?.key === 'availableStock' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th
                                                className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 cursor-pointer hover:text-paymint-green transition-colors"
                                                onClick={() => handleSort('price')}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    {t('products.table.price')}
                                                    {sortConfig?.key === 'price' && <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'rotate-0' : 'rotate-180'} />}
                                                </div>
                                            </th>
                                            <th className="px-6 py-4 text-center text-[11px] font-bold text-gray-400 w-24">{t('owner.locations.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {paginatedProducts.map((p, idx) => (
                                            <tr key={p.id || `table-row-${idx}`} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => handleEdit(p)}>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
                                                            {p.image ? (
                                                                <img src={getProductImageUrl(p.image)!} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <img src="/default_product.png" alt="Default Product" className="w-full h-full object-cover" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex px-2 py-1 rounded-md bg-gray-100 dark:bg-white/5 text-xs font-bold text-gray-500">
                                                        {(Array.isArray(categories) ? categories : []).find(c => c.id === p.categoryId)?.name || t('categories.uncategorized')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {p.trackStock ? (
                                                        <span className={`text-xs font-bold ${getStockColor(p.availableStock || 0, p.lowStockThresholdRed, p.lowStockThresholdYellow, true)}`}>
                                                            {t('products.table.units', { count: p.availableStock || 0 })}
                                                        </span>
                                                    ) : (
                                                        <div className="inline-flex items-center px-2 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
                                                            <InfinityIcon size={16} className="text-gray-400" strokeWidth={2.5} />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        {p.price.toLocaleString(t('common.locale'), { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currencySymbol}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                                        <button onClick={(e) => { e.stopPropagation(); handleEdit(p); }} aria-label={t('products.editProduct')} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-paymint-green hover:bg-paymint-green/10 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }} aria-label={t('products.delete.title')} className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-paymint-red hover:bg-paymint-red/10 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredProducts.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                                variant="footer"
                            />
                        </div>
                    )}
                </>
            )
            }

            {/* Modals */}
            <ProductFormModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={onSubmit}
                onDelete={editingProduct ? () => handleDelete(editingProduct.id) : undefined}
                initialData={editingProduct}
                categories={categories}
                isSubmitting={isSubmitting}
                canViewCosts={canViewCosts}
                defaultCategoryId={selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
            />

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                onConfirm={confirmConfig.onConfirm}
                title={t('products.delete.title')}
                message={t('products.delete.message')}
                type={confirmConfig.type}
            />

            <CsvImportModal
                isOpen={showCsvImport}
                onClose={() => setShowCsvImport(false)}
                title="Import Products"
                description="Bulk import products from a CSV file. Missing categories will be auto-created."
                columns={productCsvColumns}
                sampleData={productSampleData}
                sampleFileName="products_sample.csv"
                onImport={handleProductCsvImport}
                maxRows={500}
            />
        </div >

    );
}



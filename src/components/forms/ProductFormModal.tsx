import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, ChevronDown, Check, Wand2, Plus, RefreshCw, Search, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../../config/api';
import { QuickInfo } from '../QuickInfo';
import { ConfirmModal } from '../ConfirmModal';

import { AttributeFormModal } from './AttributeFormModal';


import { CategoryFormModal } from './CategoryFormModal';
import { useScrollLock } from '../../hooks/useScrollLock';



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

interface Category {
  id: string;
  name: string;
  icon?: string;
  sortOrder?: number;
}

interface Attribute {
  id: string;
  name: string;
  inputType: 'SINGLE_SELECT' | 'MULTI_SELECT';
  subAttributes: {
    id: string;
    name: string;
    price: number;
  }[];
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: Product | null;
  categories: Category[];
  isSubmitting?: boolean;
  canViewCosts?: boolean;
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  categories,
  isSubmitting = false,
  canViewCosts = false,
}: ProductFormModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [price, setPrice] = useState<string>('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'ITEM' | 'ADDON'>('ITEM');
  const [trackStock, setTrackStock] = useState(false);
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [stock, setStock] = useState<string>('');
  const [lowStockYellow, setLowStockYellow] = useState<string>('5');
  const [lowStockRed, setLowStockRed] = useState<string>('2');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const scrollRef = useRef<HTMLDivElement>(null);
  const stockRef = useRef<HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);
  const addonsRef = useRef<HTMLDivElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);
  const addonsTriggerRef = useRef<HTMLButtonElement>(null);

  // New states for FE parity
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [showAddonsDropdown, setShowAddonsDropdown] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [addonsSearchQuery, setAddonsSearchQuery] = useState('');

  // Local Category Creation State
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const isInitialLoad = useRef(true);

  useScrollLock(isOpen);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleCategorySubmit = async (name: string, icon: string, sortOrder: number) => {
    try {
      setIsCategorySubmitting(true);
      const res = await api.post('/api/categories', { name, icon, sortOrder });
      const newCategory = res.data;
      setLocalCategories(prev => [...prev, newCategory]);
      setCategoryId(newCategory.id);
      setShowCategoryModal(false);
      toast.success('Category created');
    } catch (err: any) {
      toast.error('Failed to create category');
    } finally {
      setIsCategorySubmitting(false);
    }
  };
  const [showAddonsWarning, setShowAddonsWarning] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState('JOD');

  const formatATM = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const cents = parseInt(digits || '0', 10);
    if (cents > 9999999) return null;
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
  };

  // Auto-scroll to category when opened
  useEffect(() => {
    if (showCategoryDropdown && categoryRef.current) {
      setTimeout(() => {
        categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [showCategoryDropdown]);

  // Auto-scroll to addons when opened
  useEffect(() => {
    if (showAddonsDropdown && addonsRef.current) {
      setTimeout(() => {
        addonsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    }
  }, [showAddonsDropdown]);

  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [isAttributeSubmitting, setIsAttributeSubmitting] = useState(false);

  const handleAttributeSubmit = async (name: string, inputType: 'SINGLE_SELECT' | 'MULTI_SELECT', isRequired: boolean) => {
    try {
      setIsAttributeSubmitting(true);
      const res = await api.post('/api/attributes', { name, inputType, isRequired });
      const newAttribute = res.data;
      setAttributes(prev => [...prev, newAttribute]);
      setSelectedAttributeIds(prev => [...prev, newAttribute.id]);
      setShowAttributeModal(false);
      toast.success('Add-on Created');
    } catch (err: any) {
      toast.error('Failed to create add-on');
    } finally {
      setIsAttributeSubmitting(false);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatATM(e.target.value);
    if (formatted !== null) setPrice(formatted);
  };

  const handleCostPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatATM(e.target.value);
    if (formatted !== null) setCostPrice(formatted);
  };

  const handleGenerateImage = async () => {
    if (!name.trim()) {
      toast.error('Please enter a product name first');
      return;
    }

    setIsGeneratingImage(true);
    try {
      // Use backend proxy to avoid CORS/403 issues
      const promptText = `professional appetizing food photography of ${name}, studio lighting, high resolution, 4k, delicious, isolated`;

      const response = await api.post('/api/items/generate-image',
        { prompt: promptText },
        { responseType: 'blob' }
      );

      const blob = response.data;
      const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'item';
      const file = new File([blob], `${safeName}-ai.jpg`, { type: 'image/jpeg' });

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(blob));
      toast.success('AI Image generated!');
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('Failed to generate image. Service may be unavailable.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const fetchAddonsAndSettings = async () => {
    try {
      const [attrRes, settingsRes] = await Promise.all([
        api.get('/api/attributes'),
        api.get('/app-settings')
      ]);
      setAttributes(attrRes.data || []);
      setTaxRate(settingsRes.data?.taxRate || 0);
      setCurrencySymbol(settingsRes.data?.currency || 'JOD');
    } catch (error) {
      console.error('Failed to fetch settings/addons:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      isInitialLoad.current = true;
      fetchAddonsAndSettings();


      // Allow initial render effects to pass before enabling auto-scroll
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 500);
      if (initialData) {
        setName(initialData.name || '');
        const priceVal = typeof initialData.price === 'string' ? parseFloat(initialData.price) : initialData.price;
        setPrice(priceVal == null || priceVal === 0 || isNaN(priceVal) ? '' : priceVal.toFixed(2));
        const costVal = typeof initialData.costPrice === 'string' ? parseFloat(initialData.costPrice) : initialData.costPrice;
        setCostPrice(!costVal || costVal === 0 || isNaN(costVal) ? '' : costVal.toFixed(2));
        setCategoryId(initialData.categoryId || '');
        setDescription(initialData.description || '');
        setType(initialData.type || 'ITEM');
        setTrackStock(initialData.trackStock || false);
        setAllowNegativeStock(initialData.allowNegativeStock || false);
        // Use loose check for null/undefined to hit both cases from Prisma
        setStock(initialData.availableStock != null ? String(initialData.availableStock) : '');
        setLowStockYellow(initialData.lowStockThresholdYellow != null ? String(initialData.lowStockThresholdYellow) : '5');
        setLowStockRed(initialData.lowStockThresholdRed != null ? String(initialData.lowStockThresholdRed) : '2');

        // Handle image preview
        if (initialData.image) {
          const baseUrl = 'https://grateful-liberation-production-d036.up.railway.app';
          const imgUrl = initialData.image.startsWith('http')
            ? initialData.image
            : `${baseUrl}${initialData.image.startsWith('/') ? '' : '/'}${initialData.image}`;
          setImagePreview(imgUrl);
        } else {
          setImagePreview(null);
        }
        setSelectedImage(null);

        // Fetch item attributes if editing
        const fetchItemAttrs = async () => {
          try {
            const res = await api.get(`/api/items/${initialData.id}`);
            if (res.data?.itemAttributes) {
              setSelectedAttributeIds(res.data.itemAttributes.map((ia: any) => ia.attributeId));
            }
          } catch (e) {
            console.error('Failed to fetch item attributes');
          }
        };
        fetchItemAttrs();
      } else {
        // Reset form
        setName('');
        setPrice('');
        setCostPrice('');
        setCategoryId('');
        setDescription('');
        setType('ITEM');
        setTrackStock(false);
        setAllowNegativeStock(false);
        setStock('');
        setLowStockYellow('5');
        setLowStockRed('2');
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedAttributeIds([]);
      }
      setCategorySearchQuery('');
      setAddonsSearchQuery('');
    }
  }, [isOpen, initialData, categories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear errors when any field changes
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  }, [name, price, categoryId, stock, lowStockYellow, lowStockRed, trackStock, description, costPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Item name is required';
    if (!price || parseFloat(price) <= 0) newErrors.price = 'Price must be greater than 0';
    if (!categoryId) newErrors.category = 'Please select a category';

    if (trackStock) {
      if (stock === '' || isNaN(parseInt(stock)) || parseInt(stock) < 0) newErrors.stock = 'Available units cannot be negative';

      const yellow = parseInt(lowStockYellow || '0');
      const red = parseInt(lowStockRed || '0');

      if (yellow < 0) newErrors.lowStockYellow = 'Yellow threshold cannot be negative';
      if (red < 0) newErrors.lowStockRed = 'Red threshold cannot be negative';
      if (yellow <= red) {
        newErrors.lowStockYellow = 'Yellow must be > Red';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Show first error in toast for immediate feedback
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    // Send canonical number strings to avoid backend string comparison issues (1.1 vs 1.10)
    formData.append('price', parseFloat(price || '0').toString());
    if (costPrice) formData.append('costPrice', parseFloat(costPrice).toString());

    if (categoryId) formData.append('categoryId', categoryId);
    if (description) formData.append('description', description);
    formData.append('type', type);
    formData.append('trackStock', String(trackStock));

    if (trackStock) {
      formData.append('availableStock', stock || '0');
      formData.append('allowNegativeStock', String(allowNegativeStock));
      formData.append('lowStockThresholdYellow', lowStockYellow || '5');
      formData.append('lowStockThresholdRed', lowStockRed || '2');
    }

    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    formData.append('attributeIds', JSON.stringify(selectedAttributeIds));

    await onSubmit(formData);
  };

  useEffect(() => {
    if (trackStock && stockRef.current && !isInitialLoad.current) {
      const timer = setTimeout(() => {
        stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [trackStock]);

  useEffect(() => {
    if (showCategoryDropdown) {
      setTimeout(() => {
        categoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [showCategoryDropdown]);

  useEffect(() => {
    if (showAddonsDropdown) {
      setTimeout(() => {
        addonsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    } else {
      setAddonsSearchQuery('');
    }
  }, [showAddonsDropdown]);

  useEffect(() => {
    if (!showCategoryDropdown) {
      setCategorySearchQuery('');
    }
  }, [showCategoryDropdown]);

  const filteredCategories = localCategories.filter(cat =>
    cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
  );

  const filteredAttributes = attributes.filter(attr =>
    attr.name.toLowerCase().includes(addonsSearchQuery.toLowerCase())
  );

  const totalRetailPrice = parseFloat(price) || 0;
  const effectiveTaxRate = taxRate < 1 ? taxRate : taxRate / 100;
  const netPrice = totalRetailPrice / (1 + effectiveTaxRate);
  const taxAmount = totalRetailPrice - netPrice;

  if (!isOpen) return null;

  return createPortal(
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-[#1E293B] w-[95vw] sm:w-[90vw] max-w-xl rounded-2xl overflow-hidden max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/5 shadow-2xl relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 pb-4 relative isolate">
              <div className="absolute top-0 right-0 w-48 h-48 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-gray-400 tracking-[0.2em]">Product</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                  <span className="text-xs font-black text-paymint-green tracking-widest">Active</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                  {initialData?.id ? 'Edit Product' : 'New Product'}
                </h2>
              </div>
              <button
                onClick={() => !isGeneratingImage && onClose()}
                disabled={isGeneratingImage}
                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90 disabled:opacity-30"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto p-8 pt-2 custom-scrollbar flex-1" ref={scrollRef}>
              <form id="product-form" onSubmit={handleSubmit} className="space-y-8">

                {/* Image Picker */}
                <div className="flex flex-col items-center justify-center py-6 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 shadow-inner mb-2">
                  <div className="relative group">
                    <div
                      className="w-40 h-40 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#1E293B] cursor-pointer hover:border-paymint-green transition-all shadow-sm"
                    >
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 group-hover:text-paymint-green transition-colors">
                          <Upload size={32} strokeWidth={1.5} className="mb-2" />
                          <span className="text-xs font-black tracking-widest">Upload</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => { setSelectedImage(null); setImagePreview(null); }}
                        className="absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1.5 text-paymint-red hover:bg-red-50 border border-gray-200 dark:border-white/10 shadow-lg active:scale-90 transition-all"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* AI Generation Button */}
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage || !name.trim()}
                    className="mt-6 flex items-center gap-2 text-xs font-black tracking-widest text-paymint-green bg-paymint-green/10 px-5 py-2.5 rounded-xl hover:bg-paymint-green/20 transition-all border border-paymint-green/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                  >
                    {isGeneratingImage ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    <span>Generate Image</span>
                  </button>
                </div>

                {/* Name */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1 flex items-center">
                    Name <span className="text-paymint-red mx-1">*</span>
                    <QuickInfo text="Product name." />
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Organic Espresso"
                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-bold shadow-sm`}
                  />
                  {errors.name && (
                    <p className="mt-1.5 px-1 text-paymint-red text-xs font-black tracking-widest">{errors.name}</p>
                  )}
                </div>

                {/* Prices Grid */}
                <div className="space-y-6">
                  <div className={`grid grid-cols-1 ${canViewCosts ? 'md:grid-cols-2' : ''} gap-6`}>
                    {/* Cost Price */}
                    {canViewCosts && (
                      <div className="space-y-3">
                        <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1 flex items-center">
                          Cost
                          <QuickInfo text="Item cost." />
                        </label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg shadow-sm">
                            <span className="text-gray-400 text-xs font-black">{currencySymbol}</span>
                          </div>
                          <input
                            type="text"
                            value={costPrice}
                            onChange={handleCostPriceChange}
                            placeholder="0.00"
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl pl-16 pr-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-bold text-lg shadow-sm group-hover:border-paymint-green/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Retail Price (Total) */}
                    <div className="space-y-3">
                      <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1 flex items-center">
                        Price <span className="text-paymint-red mx-1">*</span>
                        <QuickInfo text="Retail price." />
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-paymint-green/10 border border-paymint-green/20 rounded-lg shadow-sm">
                          <span className="text-paymint-green text-xs font-black">{currencySymbol}</span>
                        </div>
                        <input
                          type="text"
                          value={price}
                          onChange={handlePriceChange}
                          placeholder="0.00"
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.price ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl pl-16 pr-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-bold text-2xl shadow-sm group-hover:border-paymint-green/50`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax Breakdown (FE Style Calculation) */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className="flex items-center mb-1.5 gap-1">
                        <p className="text-xs font-black text-gray-400 tracking-widest leading-tight">Tax Rate</p>
                        <QuickInfo text="Tax %." />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-gray-900 dark:text-white font-bold text-lg">
                          {taxRate < 1 ? parseFloat((taxRate * 100).toFixed(2)) : taxRate}
                        </p>
                        <p className="text-xs text-gray-400 font-black">%</p>
                      </div>
                    </div>
                    <div className="bg-paymint-green/5 rounded-2xl p-4 border border-paymint-green/20 shadow-sm">
                      <p className="text-xs font-black text-paymint-green tracking-widest mb-1.5 leading-tight">Tax</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-paymint-green font-bold text-lg">{taxAmount.toFixed(3)}</p>
                        <p className="text-[8px] text-paymint-green/60 font-black">{currencySymbol}</p>
                      </div>
                    </div>
                    <div className="bg-paymint-green/10 rounded-2xl p-4 border border-paymint-green/30 shadow-sm">
                      <p className="text-xs font-black text-paymint-green tracking-widest mb-1.5 leading-tight">Net</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-paymint-green font-bold text-lg">{netPrice.toFixed(3)}</p>
                        <p className="text-[8px] text-paymint-green/60 font-black">{currencySymbol}</p>
                      </div>
                    </div>
                  </div>

                  {/* Profit Analysis */}
                  {(canViewCosts && parseFloat(costPrice) > 0) && (
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      {(() => {
                        const cost = parseFloat(costPrice) || 0;
                        const profit = netPrice - cost;
                        const margin = netPrice > 0 ? (profit / netPrice) * 100 : 0;
                        const isProfit = profit >= 0;
                        const colorClass = isProfit ? 'text-paymint-green' : 'text-paymint-red';
                        const bgClass = isProfit ? 'bg-paymint-green/5 border-paymint-green/20' : 'bg-red-500/5 border-red-500/20';

                        return (
                          <>
                            <div className={`${bgClass} rounded-2xl p-4 border shadow-sm transition-colors`}>
                              <p className={`text-xs font-black tracking-widest mb-1.5 leading-tight ${colorClass}`}>Profit</p>
                              <div className="flex items-baseline gap-1">
                                <p className={`${colorClass} font-bold text-lg`}>{profit.toFixed(3)}</p>
                                <p className={`text-[8px] font-black ${colorClass} opacity-60`}>{currencySymbol}</p>
                              </div>
                            </div>
                            <div className={`${bgClass} rounded-2xl p-4 border shadow-sm transition-colors`}>
                              <p className={`text-xs font-black tracking-widest mb-1.5 leading-tight ${colorClass}`}>Margin</p>
                              <div className="flex items-baseline gap-1">
                                <p className={`${colorClass} font-bold text-lg`}>{margin.toFixed(1)}</p>
                                <p className={`text-xs font-black ${colorClass} opacity-60`}>%</p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <label className="block text-xs font-black text-gray-400 tracking-[0.2em] flex items-center">
                      Description
                      <QuickInfo text="Details." />
                    </label>
                    <span className={`text-xs font-black tracking-widest ${description.length >= 30 ? 'text-paymint-red' : 'text-gray-400'}`}>
                      {description.length} / 30
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 30))}
                    placeholder="Summarize product characteristics..."
                    rows={2}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all resize-none font-medium shadow-sm group-hover:border-paymint-green/50"
                  />
                </div>

                {/* Category */}
                <div className="relative space-y-3" ref={categoryRef}>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1 flex items-center">
                    Category <span className="text-paymint-red mx-1">*</span>
                    <QuickInfo text="Group." />
                  </label>
                  <button
                    ref={categoryTriggerRef}
                    type="button"
                    onClick={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowAddonsDropdown(false);
                    }}
                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.category ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-left flex items-center justify-between text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all shadow-sm group-hover:border-paymint-green/50`}
                  >
                    <span className={categoryId ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400 italic'}>
                      {localCategories.find(c => c.id === categoryId)?.name || 'Select Category'}
                    </span>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${showCategoryDropdown ? 'rotate-180 text-paymint-green' : ''}`} />
                  </button>
                  {errors.category && (
                    <p className="mt-1.5 px-1 text-paymint-red text-xs font-black tracking-widest">{errors.category}</p>
                  )}

                  <AnimatePresence>
                    {showCategoryDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl z-[50] max-h-80 flex flex-col shadow-2xl overflow-hidden"
                      >
                        {/* Search Bar */}
                        <div className="bg-white dark:bg-[#1E293B] p-3 border-b border-gray-100 dark:border-white/5 z-10 shrink-0">
                          <div className="relative">
                            <input
                              type="text"
                              value={categorySearchQuery}
                              onChange={(e) => setCategorySearchQuery(e.target.value)}
                              placeholder="Filter Categories..."
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCategoryId('');
                              setShowCategoryDropdown(false);
                            }}
                            className="w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between group transition-colors border-b border-gray-100 dark:border-white/5"
                          >
                            <span className={`text-xs font-black tracking-widest ${!categoryId ? 'text-paymint-green' : 'text-gray-400 italic'}`}>
                              None Selected
                            </span>
                            {!categoryId && <Check size={18} className="text-paymint-green" strokeWidth={3} />}
                          </button>

                          {filteredCategories.length === 0 && (
                            <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                              <p className="text-xs font-black tracking-widest text-gray-400 italic">No Matches Found</p>
                            </div>
                          )}

                          {filteredCategories.map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                setCategoryId(cat.id);
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between group transition-colors border-b border-gray-100 dark:border-white/5 last:border-none"
                            >
                              <span className={`text-xs font-bold ${categoryId === cat.id ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                {cat.name}
                              </span>
                              {categoryId === cat.id && <Check size={18} className="text-paymint-green" strokeWidth={3} />}
                            </button>
                          ))}
                        </div>

                        {/* Sticky Bottom Create Button */}
                        <button
                          type="button"
                          onClick={() => { setShowCategoryModal(true); setShowCategoryDropdown(false); }}
                          className="w-full px-5 py-4 text-left bg-gray-50 dark:bg-white/[0.02] hover:bg-paymint-green/10 flex items-center gap-3 transition-colors text-paymint-green border-t border-gray-100 dark:border-white/10 shrink-0"
                        >
                          <Plus size={16} />
                          <span className="text-xs font-black tracking-widest">Create Category</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Add-ons (Attributes) */}
                <div className="relative space-y-3" ref={addonsRef}>
                  <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1 flex items-center">
                    Add-ons
                    <QuickInfo text="Extras." />
                  </label>

                  {attributes.length === 0 && (
                    <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 mb-1 border-dashed">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                          <AlertCircle size={16} className="text-red-600 dark:text-red-500" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-[0.15em] text-red-600 dark:text-red-500">Notice</p>
                          <p className="text-[11px] font-bold text-red-500/90 dark:text-red-400/70 leading-snug">No add-ons. <span className="underline cursor-pointer hover:text-red-600" onClick={() => setShowAddonsWarning(true)}>Create here</span>.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    ref={addonsTriggerRef}
                    type="button"
                    onClick={() => {
                      if (attributes.length === 0) return;
                      setShowAddonsDropdown(!showAddonsDropdown);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-left flex items-center justify-between text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all shadow-sm ${attributes.length === 0 ? 'opacity-50 cursor-not-allowed' : 'group-hover:border-paymint-green/50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-paymint-green/10 flex items-center justify-center">
                        <Plus size={16} className="text-paymint-green" strokeWidth={2.5} />
                      </div>
                      <span className={selectedAttributeIds.length > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-400 italic'}>
                        {selectedAttributeIds.length === 0
                          ? (attributes.length === 0 ? 'No Add-ons' : 'Add Add-ons')
                          : selectedAttributeIds.length === 1
                            ? attributes.find(a => a.id === selectedAttributeIds[0])?.name || '1 Active'
                            : `${selectedAttributeIds.length} Linked`}
                      </span>
                    </div>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${showAddonsDropdown ? 'rotate-180 text-paymint-green' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAddonsDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl z-[50] max-h-80 flex flex-col shadow-2xl overflow-hidden"
                      >
                        {/* Search Bar */}
                        <div className="bg-white dark:bg-[#1E293B] p-3 border-b border-gray-100 dark:border-white/5 z-10 shrink-0">
                          <div className="relative">
                            <input
                              type="text"
                              value={addonsSearchQuery}
                              onChange={(e) => setAddonsSearchQuery(e.target.value)}
                              placeholder="Search Add-ons..."
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                          {filteredAttributes.length === 0 ? (
                            <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                              <p className="text-xs font-black tracking-widest text-gray-400 italic">No Matches Found</p>
                            </div>
                          ) : (
                            filteredAttributes.map(attr => (
                              <button
                                key={attr.id}
                                type="button"
                                onClick={() => {
                                  if (selectedAttributeIds.includes(attr.id)) {
                                    setSelectedAttributeIds(selectedAttributeIds.filter(id => id !== attr.id));
                                  } else {
                                    setSelectedAttributeIds([...selectedAttributeIds, attr.id]);
                                  }
                                  setShowAddonsDropdown(false);
                                }}
                                className="w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/[0.02] flex items-center justify-between group transition-colors border-b border-gray-100 dark:border-white/5 last:border-none"
                              >
                                <div className="flex flex-col">
                                  <span className={`text-sm font-bold ${selectedAttributeIds.includes(attr.id) ? 'text-paymint-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {attr.name}
                                  </span>
                                  <span className="text-xs text-gray-400 tracking-widest font-black mt-0.5">
                                    {attr.subAttributes?.length === 0
                                      ? 'No Sub-Items'
                                      : `${attr.subAttributes?.length || 0} Option${attr.subAttributes?.length !== 1 ? 's' : ''}`}
                                  </span>
                                </div>
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedAttributeIds.includes(attr.id) ? 'bg-paymint-green border-paymint-green shadow-sm' : 'border-gray-300 dark:border-white/10'}`}>
                                  {selectedAttributeIds.includes(attr.id) && <Check size={14} className="text-black" strokeWidth={3} />}
                                </div>
                              </button>
                            ))
                          )}
                        </div>

                        {/* Sticky Bottom Create Button */}
                        <button
                          type="button"
                          onClick={() => { setShowAttributeModal(true); setShowAddonsDropdown(false); }}
                          className="w-full px-5 py-4 text-left bg-gray-50 dark:bg-white/[0.02] hover:bg-paymint-green/10 flex items-center gap-3 transition-colors text-paymint-green border-t border-gray-100 dark:border-white/10 shrink-0"
                        >
                          <Plus size={16} />
                          <span className="text-xs font-black tracking-widest">Create Add-on</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected Addon Pills */}
                  {selectedAttributeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 px-1">
                      {selectedAttributeIds.map(id => {
                        const attr = attributes.find(a => a.id === id);
                        if (!attr) return null;
                        return (
                          <div key={id} className="flex items-center gap-2 bg-paymint-green/10 text-paymint-green px-4 py-2 rounded-xl border border-paymint-green/20 shadow-sm transition-all hover:bg-paymint-green/20">
                            <span className="text-xs font-black tracking-widest">{attr.name}</span>
                            <button
                              type="button"
                              onClick={() => setSelectedAttributeIds(selectedAttributeIds.filter(idx => idx !== id))}
                              className="hover:text-paymint-red transition-colors active:scale-90"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Stock Tracking */}
                <div ref={stockRef} className="bg-gray-50 dark:bg-black/20 rounded-2xl p-8 border border-gray-200 dark:border-white/5 space-y-8 shadow-inner">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-bold text-sm tracking-tight flex items-center gap-2">
                        Track Inventory
                        <QuickInfo text="Inventory." />
                      </h4>
                      <p className="text-gray-400 text-xs font-black tracking-widest mt-1">Stock Control</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trackStock}
                        onChange={(e) => setTrackStock(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-7 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-5 shadow-sm"></div>
                    </label>
                  </div>

                  {trackStock && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <div className="flex items-center justify-between bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                        <div>
                          <h4 className="text-gray-900 dark:text-white font-bold text-xs tracking-tight flex items-center gap-1">
                            Allow Overselling
                            <QuickInfo text="Sell if empty." />
                          </h4>
                          <p className="text-gray-400 text-xs font-bold mt-0.5">Continue selling when out of stock</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allowNegativeStock}
                            onChange={(e) => setAllowNegativeStock(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-xs font-black text-gray-400 tracking-widest px-1 flex items-center">
                          Quantity
                          <QuickInfo text="Qty." />
                        </label>
                        <input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="0"
                          className={`w-full bg-white dark:bg-black/20 border ${errors.stock ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-gray-900 dark:text-white font-bold text-center text-2xl focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                        />
                        {errors.stock && (
                          <p className="mt-1.5 text-paymint-red text-xs font-black text-center tracking-widest">{errors.stock}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="block text-xs font-black text-gray-400 tracking-widest px-1 flex items-center">
                            <span className="text-yellow-500 mr-2 text-lg">●</span> Low
                          </label>
                          <input
                            type="number"
                            value={lowStockYellow}
                            onChange={(e) => setLowStockYellow(e.target.value)}
                            placeholder="5"
                            className={`w-full bg-white dark:bg-black/20 border ${errors.lowStockYellow ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-3 text-gray-900 dark:text-white font-bold text-center focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="block text-xs font-black text-gray-400 tracking-widest px-1 flex items-center">
                            <span className="text-paymint-red mr-2 text-lg">●</span> Very Low
                          </label>
                          <input
                            type="number"
                            value={lowStockRed}
                            onChange={(e) => setLowStockRed(e.target.value)}
                            placeholder="2"
                            className={`w-full bg-white dark:bg-black/20 border ${errors.lowStockRed ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-3 text-gray-900 dark:text-white font-bold text-center focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

              </form>
            </div >

            {/* Footer */}
            < div className="p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 bg-gray-50 dark:bg-black/20 transition-colors" >
              {initialData?.id && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(initialData.id!)}
                  className="flex-1 h-14 border border-paymint-red/20 text-paymint-red font-black text-xs rounded-2xl hover:bg-paymint-red/5 transition-all tracking-widest flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isGeneratingImage}
                className="flex-1 h-14 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black tracking-[0.2em] text-xs rounded-2xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="product-form"
                disabled={isSubmitting || isGeneratingImage || Object.keys(errors).length > 0}
                className="flex-1 h-14 bg-paymint-green text-black font-black tracking-[0.2em] text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
              >
                {isSubmitting ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  initialData?.id ? 'Save' : 'Add'
                )}
              </button>
            </div >
          </motion.div >
        </div >

        <ConfirmModal
          isOpen={showAddonsWarning}
          onClose={() => setShowAddonsWarning(false)}
          onConfirm={() => {
            onClose();
            navigate('/dashboard/addons', { state: { openCreateModal: true } });
          }}
          title="Discard Unsaved Product?"
          message="Navigating to the Add-ons section will discard your current product details."
          confirmText="Continue & Discard"
          cancelText="Cancel"
          type="warning"
        />
      </AnimatePresence >

      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleCategorySubmit}
        isSubmitting={isCategorySubmitting}
      />

      <AttributeFormModal
        isOpen={showAttributeModal}
        onClose={() => setShowAttributeModal(false)}
        onSubmit={handleAttributeSubmit}
        isSubmitting={isAttributeSubmitting}
      />
    </>,
    document.body
  );
}




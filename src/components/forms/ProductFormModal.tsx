import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, ChevronDown, Check, Wand2, Plus, Search, AlertCircle } from 'lucide-react';
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
  defaultCategoryId?: string;
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
  defaultCategoryId,
}: ProductFormModalProps) {
  const { t } = useTranslation();
  const { locationSlug } = useParams();
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
  const [isImageDeleted, setIsImageDeleted] = useState(false);
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
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const isInitialLoad = useRef(true);

  useScrollLock(isOpen);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleCategorySubmit = async (name: string, icon: string, sortOrder: number) => {
    try {
      setIsCategorySubmitting(true);
      setCategoryError(null);
      const res = await api.post('/api/categories', { name, icon, sortOrder });
      const newCategory = res.data;
      setLocalCategories(prev => [...prev, newCategory]);
      setCategoryId(newCategory.id);
      setShowCategoryModal(false);
      toast.success(t('categories.messages.created'));
    } catch (error: any) {
      console.error('Failed to create category:', error);
      let message = error.response?.data?.message || t('categories.errors.failedToCreate');

      // Map database unique constraint errors to user-friendly messages
      if (message.includes('Unique constraint failed') && message.includes('name')) {
        message = t('categories.messages.exists');
      }

      setCategoryError(message);
    } finally {
      setIsCategorySubmitting(false);
    }
  };
  const [showAddonsWarning, setShowAddonsWarning] = useState(false);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [currencySymbol, setCurrencySymbol] = useState('JOD');

  const toFiniteNumber = (value: unknown, fallback = 0) => {
    const numericValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  };

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
      toast.success(t('products.messages.addonCreated'));
    } catch {
      toast.error(t('products.messages.addonFailed'));
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
      toast.error(t('products.messages.nameRequired'));
      return;
    }

    setIsGeneratingImage(true);
    try {
      // Use backend proxy to avoid CORS/403 issues
      const promptText = `professional appetizing food photography of ${name}, studio lighting, high resolution, 4k, delicious, isolated`;

      const response = await api.post('/api/items/generate-image',
        { prompt: promptText }
      );

      if (response.data.success && response.data.image) {
        const dataUrl = response.data.image;

        // Convert base64 to File object for upload on save
        const fetchRes = await fetch(dataUrl);
        const blob = await fetchRes.blob();

        const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'item';
        const file = new File([blob], `${safeName}-ai.jpg`, { type: 'image/jpeg' });

        setSelectedImage(file);
        setImagePreview(dataUrl);
        setIsImageDeleted(false);
        toast.success(t('products.messages.imageGenerated'));
      } else {
        throw new Error(t('products.messages.invalidAiResponse'));
      }
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      const message = error.response?.data?.message || t('products.messages.aiOverloaded');
      toast.error(message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  useEffect(() => {
    const fetchAddonsAndSettings = async () => {
      try {
        const [attrRes, settingsRes] = await Promise.all([
          api.get('/api/attributes'),
          api.get('/app-settings')
        ]);
        setAttributes(attrRes.data || []);
        setTaxRate(toFiniteNumber(settingsRes.data?.taxRate, 0));
        setCurrencySymbol(settingsRes.data?.currency || 'JOD');
      } catch (error) {
        console.error('Failed to fetch settings/addons:', error);
      }
    };

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
        // Allow 0 as valid price (for free items), only show empty for null/undefined/NaN
        setPrice(priceVal == null || isNaN(priceVal) ? '' : priceVal.toFixed(2));
        const costVal = typeof initialData.costPrice === 'string' ? parseFloat(initialData.costPrice) : initialData.costPrice;
        // Allow 0 as valid cost (items with no cost)
        setCostPrice(costVal == null || isNaN(costVal) ? '' : costVal.toFixed(2));
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
          // Use relative path by default to leverage Vite proxy
          // Only use absolute URL if strictly necessary
          const baseUrl = '';

          // Fix: Remove /public prefix to match POS behavior and correct serving path
          const cleanPath = initialData.image.replace('/public', '').replace('public/', '');

          const imgUrl = initialData.image.startsWith('http')
            ? initialData.image
            : `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;

          console.log('🖼️ ProductFormModal Image URL:', imgUrl);
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
              setSelectedAttributeIds(res.data.itemAttributes.map((ia: { attributeId: string }) => ia.attributeId));
            }
          } catch {
            console.error('Failed to fetch item attributes');
          }
        };
        fetchItemAttrs();
      } else {
        // Reset form
        setName('');
        setPrice('');
        setCostPrice('');
        setCategoryId(defaultCategoryId || '');
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
        setIsImageDeleted(false);
      }
      setCategorySearchQuery('');
      setAddonsSearchQuery('');
    }
  }, [isOpen, initialData, categories, defaultCategoryId, t]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous object URL to avoid memory leaks
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImage(file);
      // Use URL.createObjectURL for reliable preview (same as AI generation)
      setImagePreview(URL.createObjectURL(file));
      setIsImageDeleted(false);
    }
  };

  const errorBannerRef = useRef<HTMLDivElement>(null);

  // Clear errors when any field changes
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  }, [name, price, categoryId, stock, lowStockYellow, lowStockRed, trackStock, description, costPrice, errors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('products.validation.nameRequired');
    if (!price || parseFloat(price) <= 0) newErrors.price = t('products.validation.priceMin');
    if (!categoryId) newErrors.category = t('products.validation.categoryRequired');

    if (trackStock) {
      const stockNum = parseInt(stock);
      if (stock === '' || isNaN(stockNum)) {
        newErrors.stock = t('products.validation.stockRequired');
      } else if (stockNum < 0) {
        newErrors.stock = t('products.validation.stockMin');
      }

      const yellow = parseInt(lowStockYellow || '0');
      const red = parseInt(lowStockRed || '0');

      if (isNaN(yellow) || yellow < 0) newErrors.lowStockYellow = t('products.validation.yellowMin');
      if (isNaN(red) || red < 0) newErrors.lowStockRed = t('products.validation.redMin');
      if (!isNaN(yellow) && !isNaN(red) && yellow <= red) {
        newErrors.lowStockYellow = t('products.validation.yellowGreater');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to error
      setTimeout(() => {
        errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    // Handle image deletion if requested
    if (isImageDeleted && initialData?.id && !selectedImage) {
      try {
        await api.delete(`/api/items/${initialData.id}/image`);
      } catch (error) {
        console.error('Failed to delete image:', error);
        toast.error(t('products.messages.imageRemovalFailed'));
      }
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

  const totalRetailPrice = toFiniteNumber(parseFloat(price), 0);
  const normalizedTaxRate = toFiniteNumber(taxRate, 0);
  const effectiveTaxRate = normalizedTaxRate < 1 ? normalizedTaxRate : normalizedTaxRate / 100;
  const displayTaxRatePercent = effectiveTaxRate * 100;
  const netPrice = totalRetailPrice / (1 + effectiveTaxRate);
  const taxAmount = totalRetailPrice - netPrice;

  if (!isOpen) return null;

  return createPortal(
    <>
      <AnimatePresence>
        <div
          key="product-form-modal-overlay"
          dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
        >
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-xl rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/5 shadow-2xl relative"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 pb-4 relative isolate">
              <div className="absolute top-0 right-0 w-48 h-48 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-gray-400 tracking-widest">{t('products.title')}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                  <span className="text-xs font-black text-paymint-green tracking-widest">{t('common.active')}</span>
                </div>
                <h2 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">
                  {initialData?.id ? t('products.editProduct') : t('products.newProduct')}
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

            <div className="overflow-y-auto p-4 sm:p-8 pt-2 custom-scrollbar flex-1 pb-safe" ref={scrollRef}>
              <form id="product-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Error Banner */}
                {Object.keys(errors).length > 0 && (
                  <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    {t('common.validationError')}
                  </div>
                )}

                {/* Name */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                    {t('products.form.nameLabel')} <span className="text-paymint-red">*</span>
                    <QuickInfo text={t('products.form.nameTip')} />
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('products.form.namePlaceholder')}
                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                  />
                  {errors.name && (
                    <p className="mt-1.5 px-1 text-xs font-bold text-paymint-red">{errors.name}</p>
                  )}
                </div>

                {/* Image Picker */}
                <div className="flex flex-col items-center justify-center py-4 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 shadow-inner mb-2">
                  <div className="relative group">
                    <div
                      className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#1E293B] cursor-pointer hover:border-paymint-green transition-all shadow-sm"
                    >
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt={t('products.form.imagePreview')}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error('Image failed to load:', target.src);

                            // Don't retry Base64 or already failed fallbacks
                            if (target.src.startsWith('data:') || target.dataset.failed) return;

                            // If it's a relative path and we're on localhost, try fallback to production backend explicitly
                            const prodUrl = 'https://grateful-liberation-production-d036.up.railway.app';
                            if (target.src.includes('/uploads/images/') && !target.src.includes(prodUrl)) {
                              console.log('🔄 Attempting fallback to production backend...');
                              target.dataset.failed = 'true';
                              const path = target.src.split('/uploads/')[1];
                              target.src = `${prodUrl}/uploads/${path}`;
                            }
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 group-hover:text-paymint-green transition-colors">
                          <Upload size={24} strokeWidth={1.5} className="mb-1.5" />
                          <span className="text-[10px] font-bold tracking-widest">{t('products.upload')}</span>
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
                        onClick={() => {
                          // Revoke object URL to prevent memory leaks
                          if (imagePreview && imagePreview.startsWith('blob:')) {
                            URL.revokeObjectURL(imagePreview);
                          }
                          setSelectedImage(null);
                          setImagePreview(null);
                          // Mark as deleted so we know to call the delete endpoint on submit
                          if (initialData?.image) {
                            setIsImageDeleted(true);
                          }
                        }}
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
                    className="mt-4 flex items-center gap-2 text-xs font-black tracking-widest text-paymint-green bg-paymint-green/10 px-4 py-2 rounded-xl hover:bg-paymint-green/20 transition-all border border-paymint-green/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-95"
                  >
                    {isGeneratingImage ? (
                      <div className="w-3.5 h-3.5 border-2 border-paymint-green/20 border-t-paymint-green rounded-full animate-spin" />
                    ) : (
                      <Wand2 size={14} />
                    )}
                    <span>{isGeneratingImage ? t('products.generating') : t('products.generateImage')}</span>
                  </button>
                </div>

                {/* Prices Grid */}
                <div className="space-y-6">
                  <div className={`grid grid-cols-1 ${canViewCosts ? 'md:grid-cols-2' : ''} gap-6`}>
                    {/* Cost Price */}
                    {canViewCosts && (
                      <div className="space-y-3">
                        <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                          {t('products.form.costLabel')}
                          <QuickInfo text={t('products.form.costTip')} />
                        </label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg shadow-sm">
                            <span className="text-gray-400 text-xs font-black">{currencySymbol}</span>
                          </div>
                          <input
                            type="text"
                            value={costPrice}
                            onChange={handleCostPriceChange}
                            placeholder={t('common.zero')}
                            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl pl-16 pr-4 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm group-hover:border-paymint-green/50"
                          />
                        </div>
                      </div>
                    )}

                    {/* Retail Price (Total) */}
                    <div className="space-y-3">
                      <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                        {t('products.form.priceLabel')} <span className="text-paymint-red">*</span>
                        <QuickInfo text={t('products.form.priceTip')} />
                      </label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-paymint-green/10 border border-paymint-green/20 rounded-lg shadow-sm">
                          <span className="text-paymint-green text-xs font-black">{currencySymbol}</span>
                        </div>
                        <input
                          type="text"
                          value={price}
                          onChange={handlePriceChange}
                          placeholder={t('common.zero')}
                          className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.price ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl pl-16 pr-4 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm group-hover:border-paymint-green/50`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax Breakdown (FE Style Calculation) */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 shadow-sm">
                      <div className="flex items-center mb-1.5 gap-1">
                        <p className="text-xs font-bold text-gray-500 tracking-widest leading-tight">{t('products.stats.taxRate')}</p>
                        <QuickInfo text={t('products.stats.taxPercent')} />
                      </div>
                      <div className="flex items-baseline gap-1">
                        <p className="text-gray-900 dark:text-white font-bold text-lg">
                          {displayTaxRatePercent.toLocaleString(t('common.locale'), { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-400 font-black">{t('common.percent')}</p>
                      </div>
                    </div>
                    <div className="bg-paymint-green/5 rounded-2xl p-4 border border-paymint-green/20 shadow-sm">
                      <p className="text-xs font-bold text-paymint-green tracking-widest mb-1.5 leading-tight">{t('products.stats.tax')}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-paymint-green font-bold text-lg">{taxAmount.toLocaleString(t('common.locale'), { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</p>
                        <p className="text-[8px] text-paymint-green/60 font-black">{currencySymbol}</p>
                      </div>
                    </div>
                    <div className="bg-paymint-green/10 rounded-2xl p-4 border border-paymint-green/30 shadow-sm">
                      <p className="text-xs font-bold text-paymint-green tracking-widest mb-1.5 leading-tight">{t('products.stats.net')}</p>
                      <div className="flex items-baseline gap-1">
                        <p className="text-paymint-green font-bold text-lg">{netPrice.toLocaleString(t('common.locale'), { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</p>
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
                        const margin = netPrice > 0 ? (profit / netPrice) : 0;
                        const isProfit = profit >= 0;
                        const colorClass = isProfit ? 'text-paymint-green' : 'text-paymint-red';
                        const bgClass = isProfit ? 'bg-paymint-green/5 border-paymint-green/20' : 'bg-red-500/5 border-red-500/20';

                        return (
                          <>
                            <div className={`${bgClass} rounded-2xl p-4 border shadow-sm transition-colors`}>
                              <p className={`text-xs font-black tracking-widest mb-1.5 leading-tight ${colorClass}`}>{t('products.stats.profit')}</p>
                              <div className="flex items-baseline gap-1">
                                <p className={`${colorClass} font-bold text-lg`}>{profit.toLocaleString(t('common.locale'), { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</p>
                                <p className={`text-[8px] font-black ${colorClass} opacity-60`}>{currencySymbol}</p>
                              </div>
                            </div>
                            <div className={`${bgClass} rounded-2xl p-4 border shadow-sm transition-colors`}>
                              <p className={`text-xs font-black tracking-widest mb-1.5 leading-tight ${colorClass}`}>{t('products.stats.margin')}</p>
                              <div className="flex items-baseline gap-1">
                                <p className={`${colorClass} font-bold text-lg`}>{margin.toLocaleString(t('common.locale'), { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
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
                    <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                      {t('products.form.descriptionLabel')}
                      <QuickInfo text={t('products.form.descriptionTip')} />
                    </label>
                    <span className={`text-xs font-black tracking-widest ${description.length >= 30 ? 'text-paymint-red' : 'text-gray-400'}`}>
                      {description.length.toLocaleString(t('common.locale'))} / {(30).toLocaleString(t('common.locale'))}
                    </span>
                  </div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value.slice(0, 30))}
                    placeholder={t('products.form.descriptionPlaceholder')}
                    rows={2}
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all resize-none shadow-sm group-hover:border-paymint-green/50"
                  />
                </div>

                {/* Category */}
                <div className="relative space-y-3" ref={categoryRef}>
                  <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                    {t('products.form.categoryLabel')} <span className="text-paymint-red">*</span>
                    <QuickInfo text={t('products.form.categoryTip')} />
                  </label>
                  <button
                    ref={categoryTriggerRef}
                    type="button"
                    onClick={() => {
                      setShowCategoryDropdown(!showCategoryDropdown);
                      setShowAddonsDropdown(false);
                    }}
                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.category ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all shadow-sm group-hover:border-paymint-green/50`}
                  >
                    <span className={categoryId ? 'text-sm font-bold text-gray-900 dark:text-white' : 'text-sm font-bold text-gray-400'}>
                      {localCategories.find(c => c.id === categoryId)?.name || t('products.form.selectCategory')}
                    </span>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform duration-300 ${showCategoryDropdown ? 'rotate-180 text-paymint-green' : ''}`} />
                  </button>
                  {errors.category && (
                    <p className="mt-1.5 px-1 text-xs font-bold text-paymint-red">{errors.category}</p>
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
                              placeholder={t('products.form.filterCategories')}
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none transition-all"
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
                            <span className={`text-xs font-bold ${!categoryId ? 'text-paymint-green' : 'text-gray-400'}`}>
                              {t('products.messages.noneSelected')}
                            </span>
                            {!categoryId && <Check size={18} className="text-paymint-green" strokeWidth={3} />}
                          </button>

                          {filteredCategories.length === 0 && (
                            <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                              <p className="text-xs font-bold text-gray-400">{t('products.messages.noMatches')}</p>
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
                          onClick={() => {
                            setCategoryError(null);
                            setShowCategoryModal(true);
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-5 py-4 text-left bg-gray-50 dark:bg-white/[0.02] hover:bg-paymint-green/10 flex items-center gap-3 transition-colors text-paymint-green border-t border-gray-100 dark:border-white/10 shrink-0"
                        >
                          <Plus size={16} />
                          <span className="text-xs font-bold tracking-widest">{t('categories.newCategory')}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Add-ons (Attributes) */}
                <div className="relative space-y-3" ref={addonsRef}>
                  <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                    {t('products.form.addonsLabel')}
                    <QuickInfo text={t('products.form.addonsTip')} />
                  </label>

                  {attributes.length === 0 && (
                    <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 mb-1 border-dashed">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 flex items-center justify-center shrink-0">
                          <AlertCircle size={16} className="text-red-600 dark:text-red-500" strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-xs font-black tracking-widest text-red-600 dark:text-red-500">{t('common.notice')}</p>
                          <p className="text-[11px] font-bold text-red-500/90 dark:text-red-400/70 leading-snug">{t('products.messages.noAddons')} <span className="underline cursor-pointer hover:text-red-600" onClick={() => setShowAddonsWarning(true)}>{t('products.messages.createHere')}</span>.</p>
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
                      <span className={selectedAttributeIds.length > 0 ? 'text-sm font-bold text-gray-900 dark:text-white' : 'text-sm font-bold text-gray-400'}>
                        {selectedAttributeIds.length === 0
                          ? (attributes.length === 0 ? t('products.messages.noAddons') : t('products.form.searchAddons'))
                          : selectedAttributeIds.length === 1
                            ? attributes.find(a => a.id === selectedAttributeIds[0])?.name || t('products.messages.active')
                            : t('products.messages.linked', { count: selectedAttributeIds.length })}
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
                              placeholder={t('products.form.searchAddons')}
                              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                          </div>
                        </div>

                        {/* Scrollable List */}
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                          {filteredAttributes.length === 0 ? (
                            <div className="p-8 text-center border-b border-gray-100 dark:border-white/5">
                              <p className="text-xs font-bold text-gray-400">{t('products.messages.noMatches')}</p>
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
                                      ? t('products.messages.noSubItems')
                                      : t('products.messages.options', { count: attr.subAttributes?.length || 0 })}
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
                          <span className="text-xs font-bold tracking-widest">{t('products.form.createAddon')}</span>
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
                            <span className="text-xs font-bold tracking-widest">{attr.name}</span>
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
                        {t('products.form.inventory.title')}
                        <QuickInfo text={t('products.form.inventory.tip')} />
                      </h4>
                      <p className="text-xs font-bold text-gray-500 tracking-widest mt-1">{t('products.form.inventory.subtitle')}</p>
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
                            {t('products.form.inventory.overselling')}
                            <QuickInfo text={t('products.form.inventory.oversellingTip')} />
                          </h4>
                          <p className="text-gray-400 text-xs font-bold mt-0.5">{t('products.form.inventory.oversellingDesc')}</p>
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
                        <label className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center justify-center gap-1">
                          <span className="text-paymint-green text-sm">●</span> {t('products.form.inventory.quantity')}
                          <QuickInfo text={t('products.form.inventory.quantityTip')} />
                        </label>
                        <input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder={(0).toLocaleString(t('common.locale'))}
                          className={`w-full bg-white dark:bg-black/20 border ${errors.stock ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 text-center focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                        />
                        {errors.stock && (
                          <p className="mt-1.5 text-center text-xs font-bold text-paymint-red">{errors.stock}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center justify-center gap-1">
                            <span className="text-yellow-500 text-sm">●</span> {t('products.form.inventory.low')}
                          </label>
                          <input
                            type="number"
                            value={lowStockYellow}
                            onChange={(e) => setLowStockYellow(e.target.value)}
                            placeholder={(5).toLocaleString(t('common.locale'))}
                            className={`w-full bg-white dark:bg-black/20 border ${errors.lowStockYellow ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 text-center focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center justify-center gap-1">
                            <span className="text-paymint-red text-sm">●</span> {t('products.form.inventory.veryLow')}
                          </label>
                          <input
                            type="number"
                            value={lowStockRed}
                            onChange={(e) => setLowStockRed(e.target.value)}
                            placeholder={(2).toLocaleString(t('common.locale'))}
                            className={`w-full bg-white dark:bg-black/20 border ${errors.lowStockRed ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 text-center focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

              </form>
            </div >

            {/* Footer */}
            <div className="p-4 sm:p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 sm:gap-4 bg-gray-50 dark:bg-black/20 transition-colors sticky bottom-0 pb-safe">
              {initialData?.id && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(initialData.id!)}
                  className="flex-1 h-14 border border-paymint-red/20 text-paymint-red font-black text-xs tracking-widest rounded-2xl hover:bg-paymint-red/5 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  <span>{t('common.delete')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting || isGeneratingImage}
                className="flex-1 h-12 sm:h-14 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black text-xs tracking-widest rounded-xl sm:rounded-2xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>

              <button
                type="submit"
                form="product-form"
                disabled={isSubmitting || isGeneratingImage || Object.keys(errors).length > 0}
                className="flex-1 h-12 sm:h-14 bg-paymint-green text-black font-black text-xs tracking-widest rounded-xl sm:rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
              >
                {isSubmitting ? (
                  <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  initialData?.id ? t('common.save') : t('common.add')
                )}
              </button>
            </div >
          </motion.div >
        </div >

        <ConfirmModal
          key="addons-discard-confirmation"
          isOpen={showAddonsWarning}
          onClose={() => setShowAddonsWarning(false)}
          onConfirm={() => {
            onClose();
            navigate(`/dashboard/${locationSlug}/addons`, { state: { openCreateModal: true } });
          }}
          title={t('products.messages.discardTitle')}
          message={t('products.messages.discardMessage')}
          confirmText={t('products.messages.discardConfirm')}
          cancelText={t('common.cancel')}
          type="warning"
        />
      </AnimatePresence >

      <CategoryFormModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleCategorySubmit}
        isSubmitting={isCategorySubmitting}
        externalError={categoryError}
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





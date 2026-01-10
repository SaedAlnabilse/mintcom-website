import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, ChevronDown, Check, Wand2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

import api from '../../config/api';

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
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  categories,
  isSubmitting = false,
}: ProductFormModalProps) {
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

  // New states for FE parity
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [selectedAttributeIds, setSelectedAttributeIds] = useState<string[]>([]);
  const [showAddonsDropdown, setShowAddonsDropdown] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [currencySymbol, setCurrencySymbol] = useState('JOD');

  const formatATM = (val: string) => {
    const digits = val.replace(/\D/g, '');
    const cents = parseInt(digits || '0', 10);
    if (cents > 9999999) return null;
    return (cents / 100).toFixed(2);
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
      const file = new File([blob], `${name.toLowerCase().replace(/\s+/g, '-')}-ai.jpg`, { type: 'image/jpeg' });

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
      fetchAddonsAndSettings();
      if (initialData) {
        setName(initialData.name);
        setPrice(String(initialData.price));
        setCostPrice(initialData.costPrice ? String(initialData.costPrice) : '');
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
        setCategoryId(categories.length > 0 ? categories[0].id : '');
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
    if (trackStock && stockRef.current) {
      const timer = setTimeout(() => {
        stockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [trackStock]);

  const totalRetailPrice = parseFloat(price) || 0;
  const netPrice = totalRetailPrice / (1 + (taxRate / 100));
  const taxAmount = totalRetailPrice - netPrice;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-cream-50 dark:bg-[#1e1e1e] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col transition-colors duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Item' : 'New Item'}
            </h2>
            <button
              onClick={() => !isGeneratingImage && onClose()}
              disabled={isGeneratingImage}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-cream-200 dark:hover:bg-white/10 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 pt-2 custom-scrollbar flex-1" ref={scrollRef}>
            <form id="product-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Image Picker */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative group">
                  <div
                    className="w-36 h-36 rounded-2xl border-2 border-dashed border-cream-400 dark:border-gray-600 flex flex-col items-center justify-center overflow-hidden bg-cream-100 dark:bg-[#2a2a2a] cursor-pointer hover:border-paymint-green transition-colors"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-paymint-green">
                        <Upload size={32} className="mb-2" />
                        <span className="text-xs font-bold">Upload Image</span>
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
                      className="absolute -top-2 -right-2 bg-cream-50 rounded-full p-1 text-accent shadow-md hover:bg-cream-100 border border-cream-300"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* AI Generation Button */}
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !name.trim()}
                  className="mt-3 flex items-center gap-2 text-xs font-bold text-paymint-green bg-paymint-green/10 px-4 py-2 rounded-xl hover:bg-paymint-green/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingImage ? (
                    <div className="w-4 h-4 border-2 border-paymint-green/30 border-t-paymint-green rounded-full animate-spin" />
                  ) : (
                    <Wand2 size={14} />
                  )}
                  <span>Generate AI Image</span>
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Latte"
                  className={`w-full bg-cream-100 dark:bg-[#2a2a2a] border ${errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/5'} rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all`}
                />
                {errors.name && (
                  <p className="mt-1 px-1 text-red-500 text-[10px] font-bold uppercase tracking-wider">{errors.name}</p>
                )}
              </div>

              {/* Prices Grid */}
              <div className="space-y-4">
                {/* Cost Price */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">Cost Price</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-cream-200 dark:bg-white/10 rounded-lg">
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-black">{currencySymbol}</span>
                    </div>
                    <input
                      type="text"
                      value={costPrice}
                      onChange={handleCostPriceChange}
                      placeholder="0.00"
                      className="w-full bg-cream-100 dark:bg-[#2a2a2a] border border-cream-300 dark:border-white/5 rounded-2xl pl-16 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-bold text-lg"
                    />
                  </div>
                </div>

                {/* Retail Price (Total) */}
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                    Retail Price (Total) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-paymint-green/10 rounded-lg">
                      <span className="text-paymint-green text-xs font-black">{currencySymbol}</span>
                    </div>
                    <input
                      type="text"
                      value={price}
                      onChange={handlePriceChange}
                      placeholder="0.00"
                      className={`w-full bg-cream-100 dark:bg-[#2a2a2a] border ${errors.price ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/5'} rounded-2xl pl-16 pr-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-black text-2xl`}
                    />
                  </div>
                  {errors.price && (
                    <p className="mt-1 px-1 text-red-500 text-[10px] font-bold uppercase tracking-wider">{errors.price}</p>
                  )}
                  <p className="mt-2 text-[10px] text-gray-500 font-bold uppercase tracking-tighter px-1 italic">Type your desired final customer price here</p>
                </div>

                {/* Tax Breakdown (FE Style Calculation) */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-cream-100 dark:bg-white/5 rounded-2xl p-4 border border-cream-300 dark:border-white/5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 leading-tight">Tax Rate</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-gray-900 dark:text-white font-black text-lg">{taxRate}</p>
                      <p className="text-[10px] text-gray-500 font-black uppercase">%</p>
                    </div>
                  </div>
                  <div className="bg-paymint-green/5 rounded-2xl p-4 border border-paymint-green/20">
                    <p className="text-[10px] font-black text-paymint-green uppercase tracking-widest mb-1.5 leading-tight">Tax Amount</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-paymint-green font-black text-lg">{taxAmount.toFixed(3)}</p>
                      <p className="text-[8px] text-paymint-green/60 font-black uppercase">{currencySymbol}</p>
                    </div>
                  </div>
                  <div className="bg-paymint-green/10 rounded-2xl p-4 border border-paymint-green/30">
                    <p className="text-[10px] font-black text-paymint-green uppercase tracking-widest mb-1.5 leading-tight">Net Price</p>
                    <div className="flex items-baseline gap-1">
                      <p className="text-paymint-green font-black text-lg">{netPrice.toFixed(3)}</p>
                      <p className="text-[8px] text-paymint-green/60 font-black uppercase">{currencySymbol}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description (30 chars limit like FE) */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest">Description</label>
                  <span className={`text-[10px] font-black ${description.length >= 30 ? 'text-accent' : 'text-gray-500'}`}>
                    {description.length}/30
                  </span>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 30))}
                  placeholder="e.g. A rich, aromatic coffee"
                  rows={2}
                  className="w-full bg-cream-100 dark:bg-[#2a2a2a] border border-cream-300 dark:border-white/5 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all resize-none font-medium"
                />
              </div>

              {/* Category */}
              <div className="relative">
                <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className={`w-full bg-cream-100 dark:bg-[#2a2a2a] border ${errors.category ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/5'} rounded-2xl px-4 py-4 text-left flex items-center justify-between text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all shadow-sm`}
                >
                  <span className={categoryId ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 italic'}>
                    {categories.find(c => c.id === categoryId)?.name || 'Select Category'}
                  </span>
                  <ChevronDown size={20} className={`text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                </button>
                {errors.category && (
                  <p className="mt-1 px-1 text-red-500 text-[10px] font-bold uppercase tracking-wider">{errors.category}</p>
                )}

                <AnimatePresence>
                  {showCategoryDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-cream-50 dark:bg-[#2a2a2a] border border-cream-300 dark:border-white/10 rounded-2xl shadow-2xl z-[30] max-h-48 overflow-y-auto custom-scrollbar overflow-hidden"
                    >
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryId(cat.id);
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full px-5 py-4 text-left hover:bg-paymint-green/5 flex items-center justify-between group transition-colors border-b border-cream-200 dark:border-white/5 last:border-none"
                        >
                          <span className={`text-sm ${categoryId === cat.id ? 'text-paymint-green font-black' : 'text-gray-700 dark:text-gray-300 font-bold'}`}>
                            {cat.name}
                          </span>
                          {categoryId === cat.id && <Check size={18} className="text-paymint-green" />}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Add-ons (Attributes) - FE style */}
              <div className="relative">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-2 px-1">Add-ons & Modifiers</label>
                <button
                  type="button"
                  onClick={() => setShowAddonsDropdown(!showAddonsDropdown)}
                  className="w-full bg-cream-100 dark:bg-[#2a2a2a] border border-cream-300 dark:border-white/5 rounded-2xl px-4 py-4 text-left flex items-center justify-between text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-paymint-green/20 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-paymint-green/10 flex items-center justify-center">
                      <Plus size={16} className="text-paymint-green" />
                    </div>
                    <span className={selectedAttributeIds.length > 0 ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 italic'}>
                      {selectedAttributeIds.length === 0
                        ? 'Select Add-ons'
                        : selectedAttributeIds.length === 1
                          ? attributes.find(a => a.id === selectedAttributeIds[0])?.name || '1 Add-on Selected'
                          : `${selectedAttributeIds.length} Add-ons Selected`}
                    </span>
                  </div>
                  <ChevronDown size={20} className={`text-gray-400 transition-transform ${showAddonsDropdown ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAddonsDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-cream-50 dark:bg-[#2a2a2a] border border-cream-300 dark:border-white/10 rounded-2xl shadow-2xl z-[30] max-h-48 overflow-y-auto custom-scrollbar overflow-hidden"
                    >
                      {attributes.map(attr => (
                        <button
                          key={attr.id}
                          type="button"
                          onClick={() => {
                            if (selectedAttributeIds.includes(attr.id)) {
                              setSelectedAttributeIds(selectedAttributeIds.filter(id => id !== attr.id));
                            } else {
                              setSelectedAttributeIds([...selectedAttributeIds, attr.id]);
                            }
                          }}
                          className="w-full px-5 py-4 text-left hover:bg-paymint-green/5 flex items-center justify-between group transition-colors border-b border-cream-200 dark:border-white/5 last:border-none"
                        >
                          <div className="flex flex-col">
                            <span className={`text-sm ${selectedAttributeIds.includes(attr.id) ? 'text-paymint-green font-black' : 'text-gray-700 dark:text-gray-300 font-bold'}`}>
                              {attr.name}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                              {attr.subAttributes?.length === 0
                                ? 'No options available'
                                : `${attr.subAttributes?.length || 0} option${attr.subAttributes?.length !== 1 ? 's' : ''} available`}
                            </span>
                          </div>
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedAttributeIds.includes(attr.id) ? 'bg-paymint-green border-paymint-green' : 'border-gray-200 dark:border-white/10'}`}>
                            {selectedAttributeIds.includes(attr.id) && <Check size={14} className="text-black" />}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selected Addon Pills */}
                {selectedAttributeIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedAttributeIds.map(id => {
                      const attr = attributes.find(a => a.id === id);
                      if (!attr) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 bg-paymint-green/10 text-paymint-green px-3 py-1.5 rounded-xl border border-paymint-green/20">
                          <span className="text-xs font-black uppercase tracking-wider">{attr.name}</span>
                          <button
                            type="button"
                            onClick={() => setSelectedAttributeIds(selectedAttributeIds.filter(idx => idx !== id))}
                            className="hover:text-accent transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Stock Tracking (FE Style) */}
              <div ref={stockRef} className="bg-cream-100 dark:bg-white/10 rounded-3xl p-6 border border-cream-300 dark:border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-wider">Track Stock</h4>
                    <p className="text-gray-500 text-[10px] font-bold uppercase mt-1">Manage inventory & alerts</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackStock}
                      onChange={(e) => setTrackStock(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-cream-200 dark:bg-white/5 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                  </label>
                </div>

                {trackStock && (
                  <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between bg-cream-50 dark:bg-black/20 p-4 rounded-2xl border border-cream-300 dark:border-white/5">
                      <div>
                        <h4 className="text-gray-900 dark:text-white font-black text-sm uppercase tracking-wider text-[10px]">Allow Negative Stock</h4>
                        <p className="text-gray-500 text-[8px] font-bold uppercase mt-0.5">Sell items when out of stock</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={allowNegativeStock}
                          onChange={(e) => setAllowNegativeStock(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-5 bg-cream-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Available Units</label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        placeholder="0"
                        className={`w-full bg-cream-50 dark:bg-black/20 border ${errors.stock ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/5'} rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-black text-center focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all`}
                      />
                      {errors.stock && (
                        <p className="mt-1 text-red-500 text-[8px] font-bold uppercase text-center">{errors.stock}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                          <span className="text-yellow-500 mr-1">●</span> Yellow Threshold
                        </label>
                        <input
                          type="number"
                          value={lowStockYellow}
                          onChange={(e) => setLowStockYellow(e.target.value)}
                          placeholder="5"
                          className={`w-full bg-cream-50 dark:bg-black/20 border ${errors.lowStockYellow ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/5'} rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-black text-center focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all`}
                        />
                        {errors.lowStockYellow && (
                          <p className="mt-1 text-red-500 text-[8px] font-bold uppercase text-center leading-tight">{errors.lowStockYellow}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                          <span className="text-red-500 mr-1">●</span> Red Threshold
                        </label>
                        <input
                          type="number"
                          value={lowStockRed}
                          onChange={(e) => setLowStockRed(e.target.value)}
                          placeholder="2"
                          className={`w-full bg-cream-50 dark:bg-black/20 border ${errors.lowStockRed ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-white/5'} rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-black text-center focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all`}
                        />
                        {errors.lowStockRed && (
                          <p className="mt-1 text-red-500 text-[8px] font-bold uppercase text-center leading-tight">{errors.lowStockRed}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </form>
          </div>

          {/* Footer (FE Parity Buttons) */}
          <div className="p-8 border-t border-cream-300 dark:border-white/5 flex items-center gap-4 bg-cream-100/50 dark:bg-white/[0.02]">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="px-6 py-4 bg-accent/10 text-accent font-black rounded-2xl hover:bg-accent hover:text-white transition-all active:scale-95 flex items-center gap-2 uppercase tracking-widest text-[10px]"
              >
                <Trash2 size={18} />
                <span>Remove</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || isGeneratingImage}
              className="flex-1 py-4 bg-gray-400 text-white font-black rounded-2xl hover:bg-gray-500 transition-all uppercase tracking-widest text-xs disabled:opacity-50 active:scale-95 shadow-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="product-form"
              disabled={isSubmitting || isGeneratingImage || Object.keys(errors).length > 0}
              className="flex-[1.5] py-4 bg-paymint-green text-black font-black rounded-2xl hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center shadow-xl shadow-paymint-green/20 text-xs uppercase tracking-widest active:scale-95"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                initialData ? 'Save Changes' : 'Add Item'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}




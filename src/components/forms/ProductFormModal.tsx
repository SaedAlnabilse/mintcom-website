import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Trash2, ChevronDown, Check } from 'lucide-react';

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
  lowStockThresholdYellow?: number;
  type?: 'ITEM' | 'ADDON';
}

interface Category {
  id: string;
  name: string;
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
  const [stock, setStock] = useState<string>('');
  const [lowStock, setLowStock] = useState<string>('5');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setPrice(String(initialData.price));
        setCostPrice(initialData.costPrice ? String(initialData.costPrice) : '');
        setCategoryId(initialData.categoryId || '');
        setDescription(initialData.description || '');
        setType(initialData.type || 'ITEM');
        setTrackStock(initialData.trackStock || false);
        setStock(initialData.availableStock ? String(initialData.availableStock) : '');
        setLowStock(initialData.lowStockThresholdYellow ? String(initialData.lowStockThresholdYellow) : '5');
        
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
      } else {
        // Reset form
        setName('');
        setPrice('');
        setCostPrice('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setDescription('');
        setType('ITEM');
        setTrackStock(true);
        setStock('');
        setLowStock('5');
        setSelectedImage(null);
        setImagePreview(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('price', price);
    if (costPrice) formData.append('costPrice', costPrice);
    if (categoryId) formData.append('categoryId', categoryId);
    if (description) formData.append('description', description);
    formData.append('type', type);
    formData.append('trackStock', String(trackStock));
    
    if (trackStock) {
        formData.append('availableStock', stock || '0');
        formData.append('lowStockThresholdYellow', lowStock || '5');
    }

    if (selectedImage) {
        formData.append('image', selectedImage);
    }

    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1e1e1e] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold text-white">
              {initialData ? 'Edit Item' : 'New Item'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 pt-2 custom-scrollbar flex-1">
            <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Image Picker */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div 
                    className="w-36 h-36 rounded-2xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center overflow-hidden bg-[#2a2a2a] cursor-pointer hover:border-green-500 transition-colors"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-green-500">
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
                        className="absolute -top-2 -right-2 bg-white rounded-full p-1 text-red-500 shadow-md hover:bg-gray-100"
                    >
                        <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Latte"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>

              {/* Price Row */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Selling Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">JOD</span>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl pl-14 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors font-bold"
                      required
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Cost Price</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">JOD</span>
                    <input
                      type="number"
                      step="0.01"
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl pl-14 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Category Dropdown */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-left flex items-center justify-between text-white focus:outline-none focus:border-green-500 transition-colors"
                >
                  <span className={categoryId ? 'text-white' : 'text-gray-500'}>
                    {categories.find(c => c.id === categoryId)?.name || 'Select Category'}
                  </span>
                  <ChevronDown size={20} className="text-gray-400" />
                </button>
                
                {showCategoryDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[#2a2a2a] border border-gray-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(cat.id);
                          setShowCategoryDropdown(false);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-white/5 flex items-center justify-between group"
                      >
                        <span className={`text-sm ${categoryId === cat.id ? 'text-green-500 font-bold' : 'text-gray-300'}`}>
                          {cat.name}
                        </span>
                        {categoryId === cat.id && <Check size={16} className="text-green-500" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Item details..."
                  rows={3}
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors resize-none"
                />
              </div>

              {/* Stock Toggle */}
              <div className="bg-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-sm">Track Stock</h4>
                  <p className="text-gray-500 text-xs mt-1">Manage inventory count</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={trackStock} 
                    onChange={(e) => setTrackStock(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {/* Stock Inputs */}
              {trackStock && (
                 <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-400 mb-2">In Stock</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Units</span>
                     <input
                       type="number"
                       value={stock}
                       onChange={(e) => setStock(e.target.value)}
                       placeholder="0"
                       className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl pl-16 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors font-bold"
                     />
                   </div>
                 </div>
                 <div className="flex-1">
                   <label className="block text-sm font-medium text-gray-400 mb-2">Low Stock</label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">Units</span>
                     <input
                       type="number"
                       value={lowStock}
                       onChange={(e) => setLowStock(e.target.value)}
                       placeholder="5"
                       className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl pl-16 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors font-bold"
                     />
                   </div>
                 </div>
               </div>
              )}
            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-800 flex items-center gap-3 bg-[#1e1e1e]">
            {initialData && onDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(initialData.id)}
                    className="w-12 h-12 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                    <Trash2 size={24} />
                </button>
            )}
            <button
                type="button"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl border border-gray-700 text-gray-300 font-semibold hover:bg-gray-800 transition-colors"
            >
                Cancel
            </button>
            <button
                type="submit"
                form="product-form"
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
                {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    initialData ? 'Save' : 'Add'
                )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trash2, Tag, Coffee, IceCream, Pizza, ShoppingBag, Gift, Star, Heart,
  Utensils, CupSoda, Martini, UtensilsCrossed, Cake, Croissant, Cookie,
  Sandwich, Drumstick, Fish, Apple, Carrot, RefreshCw
} from 'lucide-react';
import { QuickInfo } from '../QuickInfo';

// Mapping main app icons (MaterialCommunityIcons) to Lucide equivalents
export const ICON_MAP: Record<string, React.ElementType> = {
  'food': Utensils,
  'coffee': Coffee,
  'cup': CupSoda,
  'glass-cocktail': Martini,
  'food-fork-drink': UtensilsCrossed,
  'cake': Cake,
  'bread-slice': Croissant,
  'ice-cream': IceCream,
  'cookie': Cookie,
  'pizza': Pizza,
  'hamburger': Sandwich,
  'food-drumstick': Drumstick,
  'fish': Fish,
  'fruit-watermelon': Apple,
  'carrot': Carrot,
  'tag': Tag,
  'star': Star,
  'heart': Heart,
  'gift': Gift,
  'shopping': ShoppingBag,
};

export const ICONS = Object.keys(ICON_MAP);

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, icon: string, sortOrder: number) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: Category | null;
  isSubmitting?: boolean;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isSubmitting = false,
}: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag');
  const [sortOrder, setSortOrder] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setName(initialData.name);
        setSelectedIcon(initialData.icon || 'tag');
        setSortOrder(initialData.sortOrder || 0);
      } else {
        setName('');
        setSelectedIcon('tag');
        setSortOrder(0);
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: 'Category name is required' });
      return;
    }
    await onSubmit(name, selectedIcon, sortOrder);
  };

  if (!isOpen) return null;

  const SelectedIconComponent = ICON_MAP[selectedIcon] || Tag;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#1E293B] w-full max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300 border border-gray-200 dark:border-white/5 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-8 pb-4 relative isolate">
            <div className="absolute top-0 right-0 w-48 h-48 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inventory Hierarchy</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                <span className="text-[10px] font-black text-paymint-green uppercase tracking-widest">Active Schema</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {initialData ? 'Edit Category' : 'New Category'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-8 pt-2 custom-scrollbar flex-1">
            {/* Preview */}
            <div className="flex flex-col items-center mb-10 py-6 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 shadow-inner">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500 bg-paymint-green shadow-lg shadow-paymint-green/20 group-hover:scale-105"
              >
                <SelectedIconComponent size={48} className="text-black" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Visual Token</span>
            </div>

            <form id="category-form" onSubmit={handleSubmit} className="space-y-8">

              {/* Name */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center">
                  Legal Descriptor <span className="text-paymint-red mx-1">*</span>
                  <QuickInfo text="The unique name that will appear on the POS for this group." />
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="e.g. HOT INFUSIONS"
                  className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-bold shadow-sm`}
                />
                {errors.name && <p className="mt-1.5 px-1 text-[10px] font-black uppercase text-paymint-red tracking-wider">{errors.name}</p>}
              </div>

              {/* Icon Grid */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 flex items-center">
                  Interface Iconography
                  <QuickInfo text="Visual symbol to represent this category on the POS grid." />
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {ICONS.map(icon => {
                    const IconComp = ICON_MAP[icon];
                    const isSelected = selectedIcon === icon;
                    return (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSelectedIcon(icon)}
                        className={`aspect-square flex items-center justify-center rounded-xl border-2 transition-all duration-300 ${isSelected
                          ? 'bg-paymint-green border-paymint-green shadow-lg shadow-paymint-green/10 scale-110 z-10'
                          : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 hover:border-paymint-green/30'
                          }`}
                      >
                        <IconComp
                          size={22}
                          strokeWidth={isSelected ? 3 : 2}
                          className={isSelected ? 'text-black' : 'text-gray-400 group-hover:text-gray-600'}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 bg-gray-50 dark:bg-black/20 transition-colors">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="w-14 h-14 flex items-center justify-center bg-white dark:bg-white/5 text-gray-400 hover:text-paymint-red rounded-xl border border-gray-200 dark:border-white/10 transition-all shadow-sm group active:scale-90"
              >
                <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-14 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={isSubmitting}
              className="flex-[2] h-14 rounded-xl bg-paymint-green text-black font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
            >
              {isSubmitting ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                initialData ? 'Save Changes' : 'Add Category'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}




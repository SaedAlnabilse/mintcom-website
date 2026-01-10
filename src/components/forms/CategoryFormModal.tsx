import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trash2, Tag, Coffee, IceCream, Pizza, ShoppingBag, Gift, Star, Heart,
  Utensils, CupSoda, Martini, UtensilsCrossed, Cake, Croissant, Cookie,
  Sandwich, Drumstick, Fish, Apple, Carrot
} from 'lucide-react';

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
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, icon: string) => Promise<void>;
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        setName(initialData.name);
        setSelectedIcon(initialData.icon || 'tag');
      } else {
        setName('');
        setSelectedIcon('tag');
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: 'Category name is required' });
      return;
    }
    await onSubmit(name, selectedIcon);
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
          className="bg-cream-50 dark:bg-[#1e1e1e] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Category' : 'New Category'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-cream-200 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 pt-2 custom-scrollbar flex-1">
            {/* Preview */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-2 transition-colors bg-paymint-green"
              >
                <SelectedIconComponent size={40} className="text-black" />
              </div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</span>
            </div>

            <form id="category-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="e.g. Hot Drinks"
                  className={`w-full bg-cream-100 dark:bg-[#2a2a2a] border ${errors.name ? 'border-red-500 ring-2 ring-red-500/20' : 'border-cream-300 dark:border-gray-700'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-paymint-green transition-colors`}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name}</p>}
              </div>

              {/* Icon Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Icon</label>
                <div className="grid grid-cols-6 gap-3">
                  {ICONS.map(icon => {
                    const IconComp = ICON_MAP[icon];
                    const isSelected = selectedIcon === icon;
                    return (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setSelectedIcon(icon)}
                        className={`aspect-square flex items-center justify-center rounded-xl border transition-all ${isSelected
                          ? 'bg-paymint-green border-paymint-green'
                          : 'bg-cream-100 dark:bg-[#2a2a2a] border-cream-300 dark:border-gray-700 hover:bg-cream-200 dark:hover:bg-gray-700'
                          }`}
                      >
                        <IconComp
                          size={20}
                          className={isSelected ? 'text-black' : 'text-gray-400'}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-cream-200 dark:border-gray-800 flex items-center gap-3 bg-cream-100 dark:bg-[#1e1e1e] transition-colors">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="w-12 h-12 flex items-center justify-center bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-colors"
              >
                <Trash2 size={24} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border border-cream-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-cream-200 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-paymint-green text-black font-bold hover:bg-paymint-green/90 transition-colors disabled:opacity-50 flex items-center justify-center shadow-lg shadow-paymint-green/20"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                initialData ? 'Save' : 'Create'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}




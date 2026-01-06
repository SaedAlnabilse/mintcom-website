import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Check, Tag, Coffee, IceCream, Pizza, ShoppingBag, Gift, Star, Heart } from 'lucide-react';

// Using Lucide icons to match the design roughly
const ICON_MAP: Record<string, React.ElementType> = {
  'tag': Tag,
  'food': Pizza, // Approximations
  'coffee': Coffee,
  'ice-cream': IceCream,
  'shopping': ShoppingBag,
  'gift': Gift,
  'star': Star,
  'heart': Heart,
  // Add more mappings as needed or generic ones
};

const ICONS = Object.keys(ICON_MAP);

const COLORS_PALETTE = [
  '#7CC39F', // Primary Green
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Indigo
  '#EC4899', // Pink
  '#6366F1', // Violet
  '#10B981', // Emerald
  '#6B7280', // Gray
  '#111827', // Black
];

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, icon: string, color: string) => Promise<void>;
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
  const [selectedColor, setSelectedColor] = useState(COLORS_PALETTE[0]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setSelectedIcon(initialData.icon || 'tag');
        setSelectedColor(initialData.color || COLORS_PALETTE[0]);
      } else {
        setName('');
        setSelectedIcon('tag');
        setSelectedColor(COLORS_PALETTE[0]);
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit(name, selectedIcon, selectedColor);
  };

  if (!isOpen) return null;

  const SelectedIconComponent = ICON_MAP[selectedIcon] || Tag;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1e1e1e] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold text-white">
              {initialData ? 'Edit Category' : 'New Category'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 pt-2 custom-scrollbar flex-1">
             {/* Preview */}
             <div className="flex flex-col items-center mb-8">
                <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg mb-2 transition-colors"
                    style={{ backgroundColor: selectedColor }}
                >
                    <SelectedIconComponent size={40} className="text-white" />
                </div>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preview</span>
             </div>

            <form id="category-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Category Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Hot Drinks"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>

              {/* Icon Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Icon</label>
                <div className="grid grid-cols-6 gap-3">
                    {ICONS.map(icon => {
                        const IconComp = ICON_MAP[icon];
                        return (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => setSelectedIcon(icon)}
                                className={`aspect-square flex items-center justify-center rounded-xl border transition-all ${selectedIcon === icon ? 'bg-[#2a2a2a] border-2' : 'bg-[#2a2a2a] border-gray-700 hover:bg-gray-700'}`}
                                style={{ borderColor: selectedIcon === icon ? selectedColor : undefined }}
                            >
                                <IconComp 
                                    size={20} 
                                    className={selectedIcon === icon ? '' : 'text-gray-400'}
                                    style={{ color: selectedIcon === icon ? selectedColor : undefined }}
                                />
                            </button>
                        );
                    })}
                </div>
              </div>

              {/* Color Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">Color</label>
                <div className="flex flex-wrap gap-3">
                    {COLORS_PALETTE.map(color => (
                        <button
                            key={color}
                            type="button"
                            onClick={() => setSelectedColor(color)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${selectedColor === color ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1e1e1e]' : 'hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                        >
                            {selectedColor === color && <Check size={16} className="text-white" />}
                        </button>
                    ))}
                </div>
              </div>

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
                form="category-form"
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
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

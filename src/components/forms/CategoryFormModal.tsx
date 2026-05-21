import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Trash2, Tag, Coffee, IceCream, Pizza, ShoppingBag, Gift, Star, Heart,
  Utensils, CupSoda, Martini, UtensilsCrossed, Cake, Croissant, Cookie,
  Sandwich, Drumstick, Fish, Apple, Carrot
} from 'lucide-react';
import { QuickInfo } from '../QuickInfo';
import { useScrollLock } from '../../hooks/useScrollLock';
import { formatInputPlaceholder } from '../../utils/textCase';
import { TEXT_INPUT_LIMITS } from '../../config/textLimits';

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
  isActive?: boolean;
  deletedAt?: string | null;
  deactivatedAt?: string | null;
}

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, icon: string, sortOrder: number) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: Category | null;
  isSubmitting?: boolean;
  externalError?: string | null;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isSubmitting = false,
  externalError,
}: CategoryFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('tag');
  const [sortOrder, setSortOrder] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useScrollLock(isOpen);

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

  const scrollRef = useRef<HTMLDivElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: t('categories.errors.nameRequired') });
      // Scroll to the first field that has an error
      setTimeout(() => {
        const firstErrorField = scrollRef.current?.querySelector('.border-mintcom-red');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return;
    }
    await onSubmit(name, selectedIcon, sortOrder);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
      >
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] transition-colors duration-300 border border-gray-200 dark:border-white/5"
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-4 sm:py-5 relative isolate border-b border-gray-200 dark:border-white/10">
            <div className="absolute top-0 right-0 w-48 h-48 bg-mintcom-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
              <div>
                <h2 className="text-xl font-medium text-gray-900 dark:text-white tracking-tight">
                  {initialData ? t('categories.editCategory') : t('categories.newCategory')}
                </h2>
              </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          <div className="overflow-y-auto p-6 pt-8 sm:p-8 sm:pt-10 custom-scrollbar flex-1 pb-safe">
            <form id="category-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Error Banner */}
              {(Object.keys(errors).length > 0 || externalError) && (
                <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  {externalError || t('common.validationError')}
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <label className="label-strong block flex items-center gap-1">
                  {t('categories.form.nameLabel')} <span className="text-mintcom-red">*</span>
                  <QuickInfo text={t('categories.form.nameTip')} />
                </label>
                <input
                  name="category-name"
                  maxLength={TEXT_INPUT_LIMITS.CATEGORY_NAME}
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder={formatInputPlaceholder(t('categories.form.namePlaceholder'), t('common.locale'))}
                  className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.name || (externalError && externalError.toLowerCase().includes('already exists')) ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all shadow-sm`}
                />
                {errors.name && <p className="mt-1.5 px-1 text-xs font-medium text-mintcom-red">{errors.name}</p>}
              </div>

              {/* Icon Grid */}
              <div className="space-y-2">
                <label className="label-strong block flex items-center gap-1">
                  {t('categories.form.iconLabel')}
                  <QuickInfo text={t('categories.form.iconTip')} />
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
                          ? 'bg-mintcom-green border-mintcom-green shadow-lg shadow-mintcom-green/10 scale-110 z-10'
                          : 'bg-white dark:bg-[#1E293B] border-gray-100 dark:border-white/5 hover:border-mintcom-green/30'
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
          <div className="p-4 sm:p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 sm:gap-4 bg-gray-50 dark:bg-black/20 transition-colors sticky bottom-0 pb-safe">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                title={t('common.delete', { defaultValue: 'Delete' })}
                className="w-14 h-14 flex items-center justify-center bg-white dark:bg-white/5 text-gray-400 hover:text-mintcom-red rounded-xl border border-gray-200 dark:border-white/10 transition-all shadow-sm group active:scale-90"
              >
                <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 sm:h-14 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-barlow font-black text-xs tracking-widest hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="category-form"
              disabled={isSubmitting}
              className="flex-[2] h-12 sm:h-14 rounded-xl bg-mintcom-green text-black font-barlow font-black text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-mintcom-green/20"
            >
              {isSubmitting ? (
                <div className="w-[18px] h-[18px] border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                initialData ? t('common.save') : t('common.add')
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

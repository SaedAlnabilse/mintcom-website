import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Trash2, Tag, Coffee, IceCream, Pizza, ShoppingBag, Gift, Star, Heart,
  Utensils, CupSoda, Martini, UtensilsCrossed, Cake, Croissant, Cookie,
  Sandwich, Drumstick, Fish, Apple, Carrot, Soup, Beer, Wine, Flame
} from 'lucide-react';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton, TextInput, ErrorBanner } from '../ui';
import { QuickInfo } from '../QuickInfo';
import { formatInputPlaceholder } from '../../utils/textCase';
import { TEXT_INPUT_LIMITS } from '../../config/textLimits';

// Mapping main app icons (MaterialCommunityIcons) to Lucide equivalents
export const ICON_MAP: Record<string, React.ElementType> = {
  'food': Utensils,
  'silverware-fork-knife': Utensils,
  'coffee': Coffee,
  'cup': CupSoda,
  'glass-cocktail': Martini,
  'food-fork-drink': UtensilsCrossed,
  'silverware': UtensilsCrossed,
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
  'noodles': Soup,
  'beer': Beer,
  'glass-wine': Wine,
  'wine': Wine,
  'fire': Flame,
};

export const ICONS = [
  'food',
  'coffee',
  'cup',
  'glass-cocktail',
  'food-fork-drink',
  'cake',
  'bread-slice',
  'ice-cream',
  'cookie',
  'pizza',
  'hamburger',
  'food-drumstick',
  'fish',
  'fruit-watermelon',
  'carrot',
  'tag',
  'star',
  'heart',
  'gift',
  'shopping',
  'noodles',
  'beer',
  'glass-wine',
  'fire',
];

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title={initialData ? t('categories.editCategory') : t('categories.newCategory')}
        onClose={onClose}
      />

      <ModalBody className="pt-8 sm:pt-10">
        <form id="category-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Error Banner */}
              {(Object.keys(errors).length > 0 || externalError) && (
                <ErrorBanner ref={errorBannerRef} className="animate-pulse">
                  {externalError || t('common.validationError')}
                </ErrorBanner>
              )}

              {/* Name */}
              <TextInput
                label={<>{t('categories.form.nameLabel')} <QuickInfo text={t('categories.form.nameTip')} /></>}
                required
                name="category-name"
                maxLength={TEXT_INPUT_LIMITS.CATEGORY_NAME}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                placeholder={formatInputPlaceholder(t('categories.form.namePlaceholder'), t('common.locale'))}
                error={errors.name || (externalError && externalError.toLowerCase().includes('already exists') ? externalError : undefined)}
              />

              {/* Icon Grid */}
              <div className="space-y-2">
                <label className="label-strong block flex items-center gap-1">
                  {t('categories.form.iconLabel')}
                  <QuickInfo text={t('categories.form.iconTip')} />
                </label>
                <div className="grid grid-cols-6 gap-2.5">
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
      </ModalBody>

      <ModalFooter>
        {initialData && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(initialData.id)}
            title={t('common.delete', { defaultValue: 'Delete' })}
            className="w-14 h-14 flex items-center justify-center bg-white dark:bg-white/5 text-gray-400 hover:text-mintcom-red rounded-xl border border-gray-200 dark:border-white/10 transition-all shadow-sm group active:scale-90 shrink-0"
          >
            <Trash2 size={24} className="group-hover:scale-110 transition-transform" />
          </button>
        )}
        <ModalCancelButton onClick={onClose}>
          {t('common.cancel')}
        </ModalCancelButton>
        <ModalSubmitButton form="category-form" loading={isSubmitting}>
          {initialData ? t('common.save') : t('common.add')}
        </ModalSubmitButton>
      </ModalFooter>
    </Modal>
  );
}

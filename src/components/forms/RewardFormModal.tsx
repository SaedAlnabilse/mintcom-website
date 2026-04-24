import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Check } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';

interface Category {
  id: string;
  name: string;
}

interface Reward {
  id?: string;
  type: 'DISCOUNT' | 'FREE_ITEM';
  pointsRequired: number;
  discountPercentage?: number;
  freeCategoryId?: string;
  freeCategoryName?: string;
}

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Reward>) => void;
  initialData?: Partial<Reward>;
  categories: Category[];
}

export function RewardFormModal({ isOpen, onClose, onSave, initialData, categories }: RewardFormModalProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<'DISCOUNT' | 'FREE_ITEM'>('DISCOUNT');
  const [pointsRequired, setPointsRequired] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [freeCategoryId, setFreeCategoryId] = useState('');
  const [freeCategoryName, setFreeCategoryName] = useState('');

  const resetForm = () => {
    setType('DISCOUNT');
    setPointsRequired('');
    setDiscountPercentage('');
    setFreeCategoryId('');
    setFreeCategoryName('');
  };

  useEffect(() => {
    if (initialData && isOpen) {
      if (initialData.type) {
        setTimeout(() => setType(initialData.type as 'DISCOUNT' | 'FREE_ITEM'), 0);
      }
      setTimeout(() => {
        setPointsRequired(initialData.pointsRequired !== undefined ? initialData.pointsRequired.toLocaleString(t('common.locale'), { useGrouping: false }) : '');
        setDiscountPercentage(initialData.discountPercentage !== undefined ? initialData.discountPercentage.toLocaleString(t('common.locale'), { useGrouping: false }) : '');
        setFreeCategoryId(initialData.freeCategoryId || '');
        setFreeCategoryName(initialData.freeCategoryName || '');
      }, 0);
    } else if (isOpen) {
      setTimeout(() => resetForm(), 0);
    }
  }, [initialData, isOpen, t]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const formatATM = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length > 19) return null;
    const cents = parseInt(digits || '0', 10);
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!pointsRequired || parseFloat(pointsRequired) <= 0) {
      newErrors.pointsRequired = t('rewards.errors.pointsRequired');
    }

    if (type === 'DISCOUNT') {
      if (!discountPercentage || parseFloat(discountPercentage) <= 0 || parseFloat(discountPercentage) > 100) {
        newErrors.discountPercentage = t('rewards.errors.percentageRequired');
      }
    } else {
      if (!freeCategoryId) {
        newErrors.freeCategoryId = t('rewards.errors.categoryRequired');
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to the first field that has an error
      setTimeout(() => {
        const firstErrorField = scrollRef.current?.querySelector('.border-paymint-red, .ring-paymint-red\\/20');
        if (firstErrorField) {
          firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
      return;
    }

    setErrors({});
    onSave({
      type,
      pointsRequired: Number(pointsRequired),
      discountPercentage: discountPercentage ? Number(discountPercentage) : undefined,
      freeCategoryId,
      freeCategoryName
    });
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
          className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:w-[90vw] sm:max-w-lg relative overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-2 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-white dark:bg-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green shadow-sm">
                <Award size={22} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                {initialData ? t('rewards.editReward') : t('rewards.newReward')}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form id="reward-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto custom-scrollbar pb-safe">
            {/* Error Banner */}
            {Object.keys(errors).length > 0 && (
              <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                {t('common.validationError')}
              </div>
            )}

            {/* Reward Type */}
            <div className="space-y-2">
              <label className="label-strong block">{t('rewards.form.typeLabel')}</label>
              <div className="flex p-1 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5 relative isolate">
                <button
                  type="button"
                  onClick={() => setType('DISCOUNT')}
                  className={`relative flex-1 py-3 rounded-lg label-strong font-outfit transition-all duration-300 z-10 ${type === 'DISCOUNT' ? 'text-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  {type === 'DISCOUNT' && (
                    <motion.div layoutId="active-reward-type" className="absolute inset-0 bg-paymint-green rounded-lg -z-10 shadow-sm" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                  )}
                  {t('rewards.form.valueOff')}
                </button>
                <button
                  type="button"
                  onClick={() => setType('FREE_ITEM')}
                  className={`relative flex-1 py-3 rounded-lg label-strong font-outfit transition-all duration-300 z-10 ${type === 'FREE_ITEM' ? 'text-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  {type === 'FREE_ITEM' && (
                    <motion.div layoutId="active-reward-type" className="absolute inset-0 bg-paymint-green rounded-lg -z-10 shadow-sm" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                  )}
                  {t('rewards.form.freeItem')}
                </button>
              </div>
            </div>

            {/* Points Required */}
            <div className="space-y-2">
              <label className="label-strong block">{t('rewards.form.pointsCostLabel')}</label>
              <div className="relative group">
                <input
                  type="number"
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  value={pointsRequired}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length > 19) return;
                    if (val === '' || Number(val) >= 0) {                      setPointsRequired(val);
                      if (errors.pointsRequired) setErrors({ ...errors, pointsRequired: '' });
                    }
                  }}
                  className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.pointsRequired ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl pr-16 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all group-hover:border-paymint-green/50 shadow-sm`}
                  placeholder={t('rewards.form.pointsCostPlaceholder')}
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-paymint-green">
                  <Award size={20} strokeWidth={2.5} />
                </div>
              </div>
              {errors.pointsRequired && <p className="mt-1 px-1 text-xs font-bold text-paymint-red">{errors.pointsRequired}</p>}
            </div>

            {/* Dynamic Fields - Height Stabilized */}
            <div className="min-h-[90px]">
              {type === 'DISCOUNT' ? (
                <motion.div key="discount" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <label className="label-strong block">{t('rewards.form.discountPercentageLabel')}</label>
                  <div className="relative group">
                    <input maxLength={255}
                      type="text"
                      inputMode="decimal"
                      value={discountPercentage}
                      onChange={(e) => {
                        const formatted = formatATM(e.target.value);
                        if (formatted !== null) {
                          setDiscountPercentage(formatted);
                          if (errors.discountPercentage) setErrors({ ...errors, discountPercentage: '' });
                        }
                      }}
                      className={`w-full px-5 py-3.5 bg-gray-50 dark:bg-black/20 border ${errors.discountPercentage ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl pr-16 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all group-hover:border-paymint-green/50 shadow-sm`}
                      placeholder={t('common.zero')}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg group-focus-within:text-paymint-green transition-colors">{t('common.percent')}</div>
                  </div>
                  <p className="mt-2 text-[10px] font-bold text-paymint-green tracking-widest px-1">{t('attributes.form.atmStyle', { defaultValue: 'Digits shift right to left (ATM style)' })}</p>
                  {errors.discountPercentage && <p className="mt-1 px-1 text-xs font-bold text-paymint-red">{errors.discountPercentage}</p>}
                </motion.div>
              ) : (
                <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                  <label className="label-strong block flex items-center justify-between gap-1">
                    <span>{t('rewards.form.categoryLabel')}</span>
                    {errors.freeCategoryId && <span className="text-paymint-red normal-case tracking-normal font-bold text-[10px]">{errors.freeCategoryId}</span>}
                  </label>
                  <div className={errors.freeCategoryId ? 'ring-2 ring-paymint-red/20 rounded-2xl' : ''}>
                    <CustomSelect
                      value={freeCategoryId}
                      onChange={(val) => {
                        const stringVal = String(val);
                        setFreeCategoryId(stringVal);
                        const cat = categories.find(c => c.id === stringVal);
                        setFreeCategoryName(cat ? cat.name : '');
                        if (errors.freeCategoryId) setErrors({ ...errors, freeCategoryId: '' });
                      }}
                      options={[
                        { label: t('rewards.form.selectCategory'), value: '' },
                        ...categories.map(c => ({ label: c.name, value: c.id }))
                      ]}
                      placeholder={t('rewards.form.selectCategory')}
                      direction="up"
                    />
                  </div>
                </motion.div>
              )}
            </div>

          </form>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 sm:gap-4 bg-gray-50 dark:bg-black/20 transition-colors sticky bottom-0 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-12 sm:h-14 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-barlow font-black text-xs tracking-widest hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="reward-form"
              className="flex-[2] h-12 sm:h-14 rounded-xl bg-paymint-green text-black font-barlow font-black text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
            >
              <Check size={18} strokeWidth={3} />
              {initialData ? t('common.save') : t('common.add')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence >,
    document.body
  );
}



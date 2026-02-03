import { AppStrings } from '../../constants/AppStrings';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Award, Check } from 'lucide-react';
import { CustomSelect } from '../CustomSelect';
import { useScrollLock } from '../../hooks/useScrollLock';

interface Category {
  id: string;
  name: string;
}

interface RewardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  categories: Category[];
}

export function RewardFormModal({ isOpen, onClose, onSave, initialData, categories }: RewardFormModalProps) {
  const [type, setType] = useState<'DISCOUNT' | 'FREE_ITEM'>('DISCOUNT');
  const [pointsRequired, setPointsRequired] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [freeCategoryId, setFreeCategoryId] = useState('');
  const [freeCategoryName, setFreeCategoryName] = useState('');

  useScrollLock(isOpen);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setPointsRequired(String(initialData.pointsRequired));
      setDiscountPercentage(initialData.discountPercentage ? String(initialData.discountPercentage) : '');
      setFreeCategoryId(initialData.freeCategoryId || '');
      setFreeCategoryName(initialData.freeCategoryName || '');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setType('DISCOUNT');
    setPointsRequired('');
    setDiscountPercentage('');
    setFreeCategoryId('');
    setFreeCategoryName('');
  };

  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorBannerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!pointsRequired || parseFloat(pointsRequired) <= 0) {
      newErrors.pointsRequired = 'Valid points required';
    }

    if (type === 'DISCOUNT') {
      if (!discountPercentage || parseFloat(discountPercentage) <= 0 || parseFloat(discountPercentage) > 100) {
        newErrors.discountPercentage = 'Valid percentage (1-100) required';
      }
    } else {
      if (!freeCategoryId) {
        newErrors.freeCategoryId = 'Category required';
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

    setErrors({});
    onSave({
      type,
      pointsRequired,
      discountPercentage,
      freeCategoryId,
      freeCategoryName
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:w-[90vw] sm:max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh]"
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
          </div>

          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center text-paymint-green shadow-sm">
                <Award size={22} strokeWidth={2.5} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {initialData ? 'Edit Reward' : 'New Reward'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form id="reward-form" onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar pb-safe">
            {/* Error Banner */}
            {Object.keys(errors).length > 0 && (
              <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                Please correct the highlighted errors below
              </div>
            )}

            {/* Reward Type */}
            <div>
              <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">Type</label>
              <div className="flex p-1 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/5 relative isolate">
                <button
                  type="button"
                  onClick={() => setType('DISCOUNT')}
                  className={`relative flex-1 py-3 rounded-lg text-xs font-black tracking-widest transition-all duration-300 z-10 ${type === 'DISCOUNT' ? 'text-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  {type === 'DISCOUNT' && (
                    <motion.div layoutId="active-reward-type" className="absolute inset-0 bg-paymint-green rounded-lg -z-10 shadow-sm" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                  )}
                  Value Off
                </button>
                <button
                  type="button"
                  onClick={() => setType('FREE_ITEM')}
                  className={`relative flex-1 py-3 rounded-lg text-xs font-black tracking-widest transition-all duration-300 z-10 ${type === 'FREE_ITEM' ? 'text-black' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  {type === 'FREE_ITEM' && (
                    <motion.div layoutId="active-reward-type" className="absolute inset-0 bg-paymint-green rounded-lg -z-10 shadow-sm" transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }} />
                  )}
                  Free Item
                </button>
              </div>
            </div>

            {/* Points Required */}
            <div>
              <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">Points Cost</label>
              <div className="relative group">
                <input
                  type="number"
                  value={pointsRequired}
                  onChange={(e) => {
                    setPointsRequired(e.target.value);
                    if (errors.pointsRequired) setErrors({ ...errors, pointsRequired: '' });
                  }}
                  className={`w-full px-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.pointsRequired ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all pr-12 group-hover:border-paymint-green/50 shadow-sm`}
                  placeholder="0"
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
                <motion.div key="discount" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">Discount %</label>
                  <div className="relative group">
                    <input
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => {
                        setDiscountPercentage(e.target.value);
                        if (errors.discountPercentage) setErrors({ ...errors, discountPercentage: '' });
                      }}
                      className={`w-full px-5 py-3.5 bg-gray-50 dark:bg-black/20 border ${errors.discountPercentage ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all pr-12 group-hover:border-paymint-green/50 shadow-sm`}
                      placeholder="0"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg group-focus-within:text-paymint-green transition-colors">%</div>
                  </div>
                  {errors.discountPercentage && <p className="mt-1 px-1 text-xs font-bold text-paymint-red">{errors.discountPercentage}</p>}
                </motion.div>
              ) : (
                <motion.div key="category" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center justify-between gap-1">
                    <span>Category</span>
                    {errors.freeCategoryId && <span className="text-paymint-red normal-case tracking-normal font-bold text-[10px]">{errors.freeCategoryId}</span>}
                  </label>
                  <div className={errors.freeCategoryId ? 'ring-2 ring-paymint-red/20 rounded-2xl' : ''}>
                    <CustomSelect
                      value={freeCategoryId}
                      onChange={(val) => {
                        setFreeCategoryId(val);
                        const cat = categories.find(c => c.id === val);
                        setFreeCategoryName(cat ? cat.name : '');
                        if (errors.freeCategoryId) setErrors({ ...errors, freeCategoryId: '' });
                      }}
                      options={[
                        { label: 'Select category...', value: '' },
                        ...categories.map(c => ({ label: c.name, value: c.id }))
                      ]}
                      placeholder="Select category..."
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
              className="flex-1 h-12 sm:h-14 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 font-black text-xs tracking-widest hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="reward-form"
              className="flex-[2] h-12 sm:h-14 rounded-xl bg-paymint-green text-black font-black text-xs tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
            >
              <Check size={18} strokeWidth={3} />
              {initialData ? AppStrings.COMMON.SAVE : AppStrings.COMMON.ADD}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence >,
    document.body
  );
}

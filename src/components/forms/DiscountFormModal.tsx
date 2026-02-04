import { AppStrings } from '../../constants/AppStrings';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { QuickInfo } from '../QuickInfo';
import { useScrollLock } from '../../hooks/useScrollLock';

interface Discount {
  id: string;
  name: string;
  percentage: number;
  adminOnly: boolean;
}

interface DiscountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, percentage: number, adminOnly: boolean) => Promise<void>;
  onDelete?: (id: string) => void;
  initialData?: Discount | null;
  isSubmitting?: boolean;
}

export function DiscountFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialData,
  isSubmitting = false,
}: DiscountFormModalProps) {
  const [name, setName] = useState('');
  const [percentage, setPercentage] = useState<string>('');
  const [adminOnly, setAdminOnly] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setErrors({}), 0);
      if (initialData) {
        setTimeout(() => {
          setName(initialData.name);
          setPercentage(String(initialData.percentage * 100));
          setAdminOnly(initialData.adminOnly);
        }, 0);
      } else {
        setTimeout(() => {
          setName('');
          setPercentage('');
          setAdminOnly(false);
        }, 0);
      }
    }
  }, [isOpen, initialData]);

  const errorBannerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Required';

    const numVal = parseFloat(percentage);
    if (!percentage || isNaN(numVal)) {
      newErrors.percentage = 'Required';
    } else if (numVal > 100) {
      newErrors.percentage = 'Cannot exceed 100%';
    } else if (numVal < 0) {
      newErrors.percentage = 'Cannot be negative';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to error
      setTimeout(() => {
        errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    await onSubmit(name, numVal / 100, adminOnly);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
          className="bg-white dark:bg-[#1e1e1e] w-full sm:w-[90vw] sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] transition-colors duration-300 border border-gray-200 dark:border-white/10 shadow-2xl"
        >
          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 pb-2">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {initialData ? 'Edit Discount' : 'New Discount'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 sm:p-6 pt-2 flex-1 overflow-y-auto custom-scrollbar pb-safe">
            <form id="discount-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Error Banner */}
              {Object.keys(errors).length > 0 && (
                <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  Please correct the highlighted errors below
                </div>
              )}

              {/* Name */}
              <div>
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                  Name <span className="text-paymint-red">*</span>
                  <QuickInfo text="Name on receipt." />
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="E.g. Employee Discount"
                  className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                />
                {errors.name && <p className="mt-1.5 px-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
              </div>

              {/* Percentage */}
              <div>
                <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block flex items-center gap-1">
                  Percentage (%) <span className="text-paymint-red">*</span>
                  <QuickInfo text="Value to deduct." />
                </label>
                <div className="relative group">
                  <input
                    type="number"
                    value={percentage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (parseFloat(val) > 100) return;
                      setPercentage(val);
                      if (errors.percentage) setErrors({ ...errors, percentage: '' });
                    }}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    max="100"
                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.percentage ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all shadow-sm`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-paymint-green/10 border border-paymint-green/20 rounded-lg shadow-sm">
                    <span className="text-paymint-green text-xs font-black">%</span>
                  </div>
                </div>
                {errors.percentage && <p className="mt-1.5 px-1 text-xs font-bold text-paymint-red">{errors.percentage}</p>}
              </div>

              {/* Manager Only Toggle */}
              <div className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-white/5 transition-colors shadow-sm">
                <div className="flex items-center">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">Manager Only</span>
                  <QuickInfo text="Manager approval required." />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminOnly}
                    onChange={(e) => setAdminOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:bg-paymint-green after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-sm"></div>
                </label>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-3 sm:gap-4 bg-gray-50 dark:bg-black/20 transition-colors sticky bottom-0 pb-safe">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="flex-1 h-14 border border-paymint-red/20 text-paymint-red font-black text-xs tracking-widest rounded-2xl hover:bg-paymint-red/5 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-12 sm:h-14 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black text-xs tracking-widest rounded-xl sm:rounded-2xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="discount-form"
              disabled={isSubmitting}
              className="flex-1 h-12 sm:h-14 bg-paymint-green text-black font-black text-xs tracking-widest rounded-xl sm:rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                initialData ? AppStrings.COMMON.SAVE : AppStrings.COMMON.ADD
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}




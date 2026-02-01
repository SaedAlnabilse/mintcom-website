import { useState, useEffect } from 'react';
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
      setErrors({});
      if (initialData) {
        setName(initialData.name);
        setPercentage(String(initialData.percentage * 100));
        setAdminOnly(initialData.adminOnly);
      } else {
        setName('');
        setPercentage('');
        setAdminOnly(false);
      }
    }
  }, [isOpen, initialData]);

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
      return;
    }

    await onSubmit(name, numVal / 100, adminOnly);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#1e1e1e] w-[95vw] sm:w-[90vw] max-w-lg rounded-2xl overflow-hidden flex flex-col max-h-[85vh] transition-colors duration-300 border border-gray-200 dark:border-white/10 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {initialData ? 'Edit Discount' : 'New Discount'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 pt-2 flex-1 overflow-y-auto custom-scrollbar">
            <form id="discount-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Name */}
              <div>
                <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1 mb-2 flex items-center">
                  Name <span className="text-paymint-red mx-1">*</span>
                  <QuickInfo text="Name on receipt." />
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="E.g. Employee Discount"
                  className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-bold shadow-sm`}
                />
                {errors.name && <p className="mt-1.5 px-1 text-paymint-red text-xs font-black tracking-widest">{errors.name}</p>}
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-xs font-black text-gray-400 tracking-[0.2em] px-1 mb-2 flex items-center">
                  Percentage (%) <span className="text-paymint-red mx-1">*</span>
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
                    className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.percentage ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-2xl px-5 py-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-paymint-green/20 focus:border-paymint-green transition-all font-bold shadow-sm`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-paymint-green/10 border border-paymint-green/20 rounded-lg shadow-sm">
                    <span className="text-paymint-green text-xs font-black">%</span>
                  </div>
                </div>
                {errors.percentage && <p className="mt-1.5 px-1 text-paymint-red text-xs font-black tracking-widest">{errors.percentage}</p>}
              </div>

              {/* Manager Only Toggle */}
              <div className="bg-gray-50 dark:bg-black/20 p-5 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-white/5 transition-colors shadow-sm">
                <div className="flex items-center">
                  <span className="text-gray-900 dark:text-white font-bold text-sm tracking-tight">Manager Only</span>
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
          <div className="p-8 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 bg-gray-50 dark:bg-black/20 transition-colors">
            {initialData && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(initialData.id)}
                className="flex-1 h-14 border border-paymint-red/20 text-paymint-red font-black text-xs rounded-2xl hover:bg-paymint-red/5 transition-all tracking-widest flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-14 bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 font-black tracking-[0.2em] text-xs rounded-2xl hover:text-gray-900 dark:hover:text-white transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="discount-form"
              disabled={isSubmitting}
              className="flex-1 h-14 bg-paymint-green text-black font-black tracking-[0.2em] text-xs rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-paymint-green/20"
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
    </AnimatePresence>,
    document.body
  );
}




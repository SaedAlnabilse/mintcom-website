import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { QuickInfo } from '../QuickInfo';

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 dark:bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#1e1e1e] w-full max-w-md rounded-3xl overflow-hidden flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/10"
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

          <div className="p-6 pt-2 flex-1">
            <form id="discount-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                  Discount Name <span className="text-paymint-red mx-1">*</span>
                  <QuickInfo text="The name that appears on the receipt (e.g. 'Staff Meal')." />
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                  placeholder="e.g. Employee Discount"
                  className={`w-full bg-gray-50 dark:bg-[#2a2a2a] border ${errors.name ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-paymint-green transition-colors`}
                />
                {errors.name && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.name}</p>}
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                  Percentage (%) <span className="text-paymint-red mx-1">*</span>
                  <QuickInfo text="The percentage value to deduct from the item or order total." />
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={percentage}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (parseFloat(val) > 100) return; // Prevent typing more than 100
                      setPercentage(val);
                      if (errors.percentage) setErrors({ ...errors, percentage: '' });
                    }}
                    placeholder="0"
                    step="0.01"
                    min="0"
                    max="100"
                    className={`w-full bg-gray-50 dark:bg-[#2a2a2a] border ${errors.percentage ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-gray-700'} rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-paymint-green transition-colors font-bold`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                </div>
                {errors.percentage && <p className="mt-1 text-xs font-bold text-paymint-red">{errors.percentage}</p>}
              </div>

              {/* Manager Only Toggle */}
              <div className="bg-gray-50 dark:bg-[#2a2a2a] p-4 rounded-xl flex items-center justify-between border border-gray-200 dark:border-transparent transition-colors">
                <div className="flex items-center">
                  <span className="text-gray-900 dark:text-white font-medium">Manager Only</span>
                  <QuickInfo text="If enabled, a manager PIN is required to apply this discount." />
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={adminOnly}
                    onChange={(e) => setAdminOnly(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-paymint-green"></div>
                </label>
              </div>

            </form>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-gray-50 dark:bg-[#1e1e1e] transition-colors">
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
              className="flex-1 h-12 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="discount-form"
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-paymint-green text-black font-bold hover:bg-paymint-green/90 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                initialData ? 'Save Changes' : 'Add Discount'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}




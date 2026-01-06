import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';

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

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setPercentage(String(initialData.percentage * 100)); // Display as 0-100
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
    if (!name || !percentage) return;
    
    // Pass as decimal (0.10 for 10%)
    await onSubmit(name, parseFloat(percentage) / 100, adminOnly);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1e1e1e] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-2">
            <h2 className="text-2xl font-bold text-white">
              {initialData ? 'Edit Discount' : 'New Discount'}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 pt-2 flex-1">
            <form id="discount-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Discount Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Employee Discount"
                  className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
              </div>

              {/* Percentage */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Percentage (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    placeholder="10"
                    step="0.1"
                    min="0"
                    max="100"
                    className="w-full bg-[#2a2a2a] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors font-bold"
                    required
                  />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                </div>
              </div>

              {/* Manager Only Toggle */}
              <div className="bg-[#2a2a2a] p-4 rounded-xl flex items-center justify-between">
                <span className="text-white font-medium">Manager Only</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={adminOnly} 
                    onChange={(e) => setAdminOnly(e.target.checked)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
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
                form="discount-form"
                disabled={isSubmitting}
                className="flex-1 h-12 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
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
    </AnimatePresence>
  );
}

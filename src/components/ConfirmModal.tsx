import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'success' | 'warning' | 'info';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'success'
}: ConfirmModalProps) {

  const getTheme = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          buttonBg: 'bg-red-600 hover:bg-red-700 shadow-red-900/20',
          glow: 'shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/20',
          buttonBg: 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/20',
          glow: 'shadow-[0_0_30px_-10px_rgba(245,158,11,0.3)]'
        };
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          buttonBg: 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20',
          glow: 'shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)]'
        };
      case 'success':
      default:
        return {
          icon: CheckCircle2,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          buttonBg: 'bg-green-600 hover:bg-green-700 shadow-green-900/20',
          glow: 'shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]'
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.2 }}
            className={`relative w-full max-w-lg overflow-hidden rounded-2xl bg-gray-900 border ${theme.borderColor} shadow-2xl ${theme.glow}`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            <div className={`absolute top-0 inset-x-0 h-1 ${theme.buttonBg}`} />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {/* Icon */}
                <div className={`flex-shrink-0 p-3 rounded-xl ${theme.bgColor} ${theme.color} ring-1 ring-inset ${theme.borderColor}`}>
                  <Icon className="w-8 h-8" strokeWidth={2} />
                </div>

                {/* Content */}
                <div className="flex-1 pt-1">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 border border-gray-700 hover:border-gray-600 transition-all duration-200"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg ${theme.buttonBg} transition-all duration-200 flex items-center justify-center gap-2`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

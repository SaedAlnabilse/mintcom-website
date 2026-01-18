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
  showCancel?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'success',
  showCancel = true
}: ConfirmModalProps) {

  const getTheme = () => {
    switch (type) {
      case 'danger':
        return {
          icon: AlertTriangle,
          color: 'text-accent',
          bgColor: 'bg-accent/10',
          borderColor: 'border-accent/30',
          buttonBg: 'bg-accent text-white',
          glow: '',
          iconRing: 'ring-accent/20'
        };
      case 'warning':
        return {
          icon: AlertCircle,
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          buttonBg: 'bg-amber-500 text-white',
          glow: '',
          iconRing: 'ring-amber-500/20'
        };
      case 'info':
        return {
          icon: Info,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          buttonBg: 'bg-blue-500 text-white',
          glow: '',
          iconRing: 'ring-blue-500/20'
        };
      case 'success':
      default:
        return {
          icon: CheckCircle2,
          color: 'text-paymint-green',
          bgColor: 'bg-paymint-green/10',
          borderColor: 'border-paymint-green/30',
          buttonBg: 'bg-paymint-green text-black',
          glow: '',
          iconRing: 'ring-paymint-green/20'
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
            className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 ${theme.glow} transition-colors duration-300`}
          >

            {/* Top Accent Bar */}
            <div className={`absolute top-0 inset-x-0 h-1.5 ${theme.color.replace('text-', 'bg-')}`} />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all z-10 active:scale-90"
            >
              <X size={20} />
            </button>

            <div className="relative p-6 sm:p-8">
              <div className="flex flex-col items-center text-center">
                {/* Icon Container */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className={`mb-6 p-5 rounded-2xl ${theme.bgColor} ${theme.color} ring-1 ring-inset ${theme.iconRing} flex items-center justify-center`}
                >
                  <Icon size={40} strokeWidth={2.5} />
                </motion.div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 font-medium leading-relaxed max-w-sm mx-auto text-sm">
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className={`mt-10 ${showCancel ? 'grid grid-cols-2 gap-4' : 'flex justify-center'}`}>
                {showCancel && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 transition-all duration-200 active:scale-95"
                  >
                    {cancelText}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-6 py-4 rounded-xl text-xs font-bold uppercase tracking-widest ${theme.buttonBg} transition-all duration-300 active:scale-95 hover:scale-[1.02] ${!showCancel ? 'w-full' : ''}`}
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




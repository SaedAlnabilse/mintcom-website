import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, AlertCircle, X, Info } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

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
  confirmText,
  cancelText,
  type = 'success',
  showCancel = true
}: ConfirmModalProps) {
  const { t } = useTranslation();

  useScrollLock(isOpen);

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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans selection:bg-paymint-green selection:text-black"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300"
          />

          {/* Modal - slides up on mobile, scales on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
            className={`relative w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 ${theme.glow} transition-colors duration-300`}
          >

            {/* Top Accent Bar */}
            <div className={`absolute top-0 inset-x-0 h-1.5 ${theme.color.replace('text-', 'bg-')}`} />

            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label={t('common.closeModal')}
              className="absolute top-4 sm:top-6 right-4 sm:right-6 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all z-10 active:scale-90"
            >
              <X size={20} />
            </button>

            <div className="relative p-6 sm:p-8 pb-safe">
              <div className="flex flex-col items-center text-center">
                {/* Icon Container */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className={`mb-5 sm:mb-6 p-4 sm:p-5 rounded-2xl ${theme.bgColor} ${theme.color} ring-1 ring-inset ${theme.iconRing} flex items-center justify-center`}
                >
                  <Icon size={32} className="sm:w-10 sm:h-10" strokeWidth={2.5} />
                </motion.div>

                {/* Content */}
                <div className="space-y-2 sm:space-y-3">
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {title}
                  </h3>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                    {message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className={`mt-8 sm:mt-10 ${showCancel ? 'grid grid-cols-2 gap-3 sm:gap-4' : 'flex justify-center'}`}>
                {showCancel && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 sm:px-6 py-3.5 sm:py-4 rounded-xl text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 transition-all duration-200 active:scale-95 touch-target"
                  >
                    {cancelText || t('common.cancel')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-4 sm:px-6 py-3.5 sm:py-4 rounded-xl text-xs font-bold tracking-widest ${theme.buttonBg} transition-all duration-300 active:scale-95 hover:scale-[1.02] touch-target ${!showCancel ? 'w-full' : ''}`}
                >
                  {confirmText || t('common.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}




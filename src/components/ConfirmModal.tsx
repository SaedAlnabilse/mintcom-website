import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  secondaryText?: string;
  onSecondary?: () => void;
  type?: 'danger' | 'success' | 'warning' | 'info';
  showCancel?: boolean;
  showClose?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  secondaryText,
  onSecondary,
  type = 'success',
  showCancel = true,
  showClose = false
}: ConfirmModalProps) {
  const { t } = useTranslation();

  useScrollLock(isOpen);

  const getButtonBg = () => {
    switch (type) {
      case 'danger':
        return 'bg-mintcom-red hover:bg-red-600 text-white shadow-sm';
      case 'warning':
      case 'info':
      case 'success':
      default:
        return 'bg-mintcom-green hover:bg-[#5fa888] text-black shadow-sm';
    }
  };

  const buttonBg = getButtonBg();

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans selection:bg-mintcom-green selection:text-black"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm transition-colors duration-300"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.15 }}
            role="dialog"
            aria-modal="true"
            className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto overscroll-contain custom-scrollbar rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 shadow-2xl transition-colors duration-300 z-10"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
            </div>

            {/* Close Button */}
            {showClose && (
              <button
                onClick={onClose}
                aria-label={t('common.closeModal')}
                className="absolute top-4 sm:top-5 right-4 sm:right-5 p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/5 shadow-sm transition-all z-10 active:scale-90"
              >
                <X size={18} />
              </button>
            )}

            <div className="relative p-6 sm:p-8" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <div className="flex flex-col items-center text-center pt-2">
                {/* Content */}
                <div className="space-y-2 sm:space-y-3">
                  {title ? (
                    <>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {title}
                      </h3>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                        {message}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white tracking-tight max-w-sm mx-auto">
                      {message}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={`mt-8 sm:mt-9 ${showCancel || onSecondary ? 'grid gap-3' : 'flex justify-center'} ${showCancel && !onSecondary ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {showCancel && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 sm:px-6 py-3 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-transparent transition-all duration-200 active:scale-95 touch-target"
                  >
                    {cancelText || t('common.cancel')}
                  </button>
                )}
                {onSecondary && (
                  <button
                    type="button"
                    onClick={() => {
                      onSecondary();
                      onClose();
                    }}
                    className="px-4 sm:px-6 py-3 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 transition-all duration-200 active:scale-95 touch-target"
                  >
                    {secondaryText || t('common.continue', { defaultValue: 'Continue' })}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`px-4 sm:px-6 py-3 rounded-xl text-sm font-bold ${buttonBg} transition-all duration-200 active:scale-95 hover:brightness-105 touch-target ${!showCancel && !onSecondary ? 'w-full' : ''}`}
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






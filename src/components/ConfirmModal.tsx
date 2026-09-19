import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalCloseButton } from './ui';
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
  showClose = true
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
        return 'bg-mintcom-green hover:bg-mintcom-green/90 active:bg-mintcom-green/80 text-black';
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
            className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto overscroll-contain custom-scrollbar rounded-t-3xl sm:rounded-2xl bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 shadow-md transition-colors duration-300 z-10"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3">
              <div className="w-10 h-1 bg-stone-300 dark:bg-zinc-800 rounded-full" />
            </div>

            {/* Close Button */}
            {showClose && (
              <ModalCloseButton onClose={onClose} autoPositionAbsolute />
            )}

            <div className="relative p-6 sm:p-8" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <div className="flex flex-col items-center text-center pt-2">
                {/* Content */}
                <div className="space-y-2 sm:space-y-3">
                  {title ? (
                    <>
                      <h3 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                        {title}
                      </h3>
                      <p className="text-sm font-medium text-stone-500 dark:text-zinc-400 leading-relaxed max-w-sm mx-auto">
                        {message}
                      </p>
                    </>
                  ) : (
                    <p className="text-lg sm:text-xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight max-w-sm mx-auto">
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
                    className="px-4 sm:px-6 py-3 rounded-xl text-sm font-bold text-stone-700 dark:text-zinc-300 hover:text-stone-900 dark:hover:text-zinc-100 bg-stone-100 dark:bg-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-800 border border-transparent transition-all duration-200 active:scale-95 touch-target"
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
                    className="px-4 sm:px-6 py-3 rounded-xl text-sm font-bold text-stone-700 dark:text-zinc-200 hover:text-stone-900 dark:hover:text-zinc-100 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 transition-all duration-200 active:scale-95 touch-target"
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






import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ModalCloseButton } from './ModalCloseButton';
import { primaryButtonClass } from './theme';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-xl',
  xl: 'sm:max-w-2xl',
};

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  size?: ModalSize;
  /** Close when clicking the backdrop. Default true. */
  closeOnBackdrop?: boolean;
  /** Extra classes for the dialog panel. */
  className?: string;
  /** Accessible label. Falls back to role-only dialog. */
  ariaLabel?: string;
}

/**
 * Shared popup shell (1/3 of the modal kit).
 * Matches the established site pattern exactly:
 * bottom-sheet on mobile, centered dialog on sm+, spring-up animation,
 * blurred backdrop, mobile drag handle, RTL-aware.
 */
export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  closeOnBackdrop = true,
  className = '',
  ariaLabel,
}: ModalProps) {
  const { t } = useTranslation();
  useScrollLock(isOpen);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (closeOnBackdrop) onClose?.();
            }}
            className="absolute inset-0"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className={`bg-white dark:bg-zinc-900/60 w-full sm:w-[90vw] ${SIZE_CLASS[size]} rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[85vh] transition-colors duration-300 border border-stone-200 dark:border-zinc-800 relative z-10 ${className}`.trim()}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-2 pb-1 shrink-0">
              <div className="w-10 h-1 bg-stone-300 dark:bg-zinc-800 rounded-full" />
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional icon rendered in the mint tile (e.g. <Wallet size={24} />). */
  icon?: ReactNode;
  onClose: () => void;
  closeDisabled?: boolean;
  /** Optional action or button rendered next to the close button (e.g. a delete/trash button). */
  action?: ReactNode;
}

/**
 * Shared popup header (2/3 of the modal kit).
 * Title + optional subtitle/icon + optional action + consistent ModalCloseButton.
 */
export function ModalHeader({
  title,
  subtitle,
  icon,
  onClose,
  closeDisabled = false,
  action,
}: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 sm:px-8 py-4 sm:py-5 relative isolate border-b border-stone-200 dark:border-zinc-800 shrink-0">
      <div className="absolute top-0 right-0 w-48 h-48 bg-mintcom-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10 pointer-events-none" />
      <div className="flex items-center gap-4 min-w-0">
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm font-medium text-stone-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {action}
        <ModalCloseButton onClose={onClose} disabled={closeDisabled} />
      </div>
    </div>
  );
}

/**
 * Scrollable popup body.
 *
 * 20px vertical, flat across breakpoints, matching the header band so the
 * dialog keeps one rhythm top to bottom. `pb-safe` stays: a higher-specificity
 * rule in index.css (`.popup-surface .overflow-y-auto.pb-safe`) resolves it to
 * max(safe-area-inset, 1rem), which keeps scrolled content clear of the home
 * indicator on the mobile bottom sheet.
 */
export function ModalBody({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-y-auto px-6 sm:px-8 py-5 custom-scrollbar flex-1 pb-safe ${className}`.trim()}>
      {children}
    </div>
  );
}

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared popup footer container (3/3 of the modal kit).
 *
 * A flat 16px band (pt-4 / pb-4) at every breakpoint — enough to separate the
 * actions from the body without leaving dead space under them.
 *
 * The bottom value bakes in the safe-area inset rather than using the
 * `pb-safe` utility: Tailwind emits its own padding utilities after
 * `pb-safe`, so a plain `p-4` silently won and the iPhone home-indicator
 * inset was never actually applied.
 */
export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div
      className={`px-6 sm:px-8 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)] border-t border-stone-200 dark:border-zinc-800 flex items-center gap-3 sm:gap-4 bg-stone-50 dark:bg-zinc-900/60 transition-colors sticky bottom-0 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

interface ModalCancelButtonProps {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}

/** Standard secondary / cancel action. */
export function ModalCancelButton({ onClick, children, disabled = false }: ModalCancelButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex-1 h-12 rounded-xl bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 font-bold text-xs tracking-widest hover:text-stone-900 dark:hover:text-zinc-100 transition-all shadow-sm active:scale-95 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

interface ModalSubmitButtonProps {
  children: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  /** When the button lives outside a <form>, point it at the form id. */
  form?: string;
  onClick?: (e?: any) => void;
  type?: 'submit' | 'button';
}

/**
 * Standard primary action with built-in loading spinner.
 *
 * Colour comes from `primaryButtonClass`, the same token every other portal
 * CTA uses: stone-900 on white in light mode, mint in dark. Only the dialog
 * geometry (flex-[2], fixed height) is set here.
 */
export function ModalSubmitButton({
  children,
  disabled = false,
  loading = false,
  form,
  onClick,
  type = 'submit',
}: ModalSubmitButtonProps) {
  return (
    <button
      type={form ? 'submit' : type}
      form={form}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${primaryButtonClass} flex-[2] h-12`}
    >
      {loading ? (
        // design-token-exempt: spinner track follows the button's own text color
        <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white dark:border-black/20 dark:border-t-black rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}

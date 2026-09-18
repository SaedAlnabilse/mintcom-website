import { forwardRef } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ModalCloseButtonProps {
  onClose: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
  autoPositionAbsolute?: boolean;
}

/**
 * Shared close (X) button for every popup/modal across the website.
 * Matches the Add / Edit Brand popup style exactly so all popups stay consistent:
 * 40x40, rounded-xl, bordered, rotate-90 on hover, scale-90 on press.
 */
export const ModalCloseButton = forwardRef<HTMLButtonElement, ModalCloseButtonProps>(
  function ModalCloseButton(
    {
      onClose,
      label,
      className = '',
      disabled = false,
      autoPositionAbsolute = false,
    },
    ref,
  ) {
    const { t } = useTranslation();
    const baseClassName =
      'w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-zinc-200 border border-stone-200 dark:border-zinc-800 transition-all hover:rotate-90 active:scale-90 shrink-0 disabled:opacity-50 disabled:pointer-events-none';
    const positionClassName = autoPositionAbsolute ? ' absolute top-4 end-4 z-10' : '';

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClose}
        disabled={disabled}
        aria-label={label || t('common.close', { defaultValue: 'Close' })}
        className={`${baseClassName}${positionClassName} ${className}`.trim()}
      >
        <X size={20} />
      </button>
    );
  },
);

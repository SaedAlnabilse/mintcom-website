import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface BusyOverlayProps {
  /** Show the overlay while a user-triggered request is in flight. */
  visible: boolean;
  /** Optional message under the spinner; defaults to the shared "Processing" label. */
  message?: string;
}

/**
 * Full-screen busy blocker, portaled to <body> so it sits ABOVE every dropdown
 * popover (SingleSelect / DateRangePicker / CustomTimePicker all portal their
 * menus at z-index 9999). While visible, every click — tabs, filters, open
 * dropdowns, sidebar — is swallowed here, so the user can't stack a second
 * action on top of an in-flight load and race the responses.
 *
 * Only show it for user-triggered (non-silent) loads; background/realtime
 * refreshes should stay invisible to the user.
 */
export function BusyOverlay({ visible, message }: BusyOverlayProps) {
  const { t } = useTranslation();

  if (!visible || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center cursor-wait bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[2px]"
      role="status"
      aria-live="polite"
      onMouseDown={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-mintcom-green/10 border-t-mintcom-green rounded-full animate-spin mb-3" />
        <p className="label-strong font-sans">{message || t('common.processing', { defaultValue: 'Processing...' })}</p>
      </div>
    </div>,
    document.body
  );
}

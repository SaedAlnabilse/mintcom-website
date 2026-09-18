import {
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PartyPopper } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ModalCloseButton } from '../ui';
import { useScrollLock } from '../../hooks/useScrollLock';

type SetupGuideWelcomeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  establishmentName?: string | null;
};

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function SetupGuideWelcomeModal({
  isOpen,
  onClose,
  onStart,
  establishmentName,
}: SetupGuideWelcomeModalProps) {
  const { t } = useTranslation();
  const isRTL = t('common.locale') === 'ar';
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const startAfterExitRef = useRef(false);

  useScrollLock(isOpen);

  const close = useCallback(() => {
    startAfterExitRef.current = false;
    onClose();
  }, [onClose]);

  const start = useCallback(() => {
    startAfterExitRef.current = true;
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(focusFrame);
  }, [isOpen]);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
    );
    if (focusable.length === 0) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const handleExitComplete = () => {
    const returnTarget = returnFocusRef.current;
    if (returnTarget?.isConnected) {
      returnTarget.focus();
    } else {
      document
        .querySelector<HTMLElement>('[data-setup-guide-focus-fallback]')
        ?.focus();
    }
    returnFocusRef.current = null;

    if (startAfterExitRef.current) {
      startAfterExitRef.current = false;
      onStart();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence onExitComplete={handleExitComplete}>
      {isOpen && (
        <motion.div
          id="mintcom-dashboard-welcome-popup"
          dir={isRTL ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[2147483647] flex items-center justify-center bg-stone-950/50 p-4 font-sans backdrop-blur-sm dark:bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="setup-guide-welcome-title"
            aria-describedby="setup-guide-welcome-description"
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-stone-200/80 bg-white px-6 py-8 text-center shadow-md dark:border-zinc-800 dark:bg-zinc-900 sm:px-8"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <ModalCloseButton
              ref={closeButtonRef}
              onClose={close}
              autoPositionAbsolute
            />

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mintcom-green/15 text-mintcom-green">
              <PartyPopper size={34} aria-hidden="true" />
            </div>

            <h2
              id="setup-guide-welcome-title"
              className="text-2xl font-extrabold text-stone-950 dark:text-zinc-100"
            >
              {t('dashboard.setupGuide.title')}
            </h2>
            <p
              id="setup-guide-welcome-description"
              className="mt-2 text-sm font-medium leading-6 text-stone-600 dark:text-zinc-300"
            >
              {t('dashboard.setupGuide.message', {
                location:
                  establishmentName ||
                  t('dashboard.setupGuide.thisLocation'),
              })}
            </p>

            <div className="mt-6 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={start}
                className="w-full rounded-2xl bg-mintcom-green px-4 py-3.5 text-sm font-extrabold text-stone-950 shadow-lg shadow-mintcom-green/25 transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green focus-visible:ring-offset-2 dark:ring-offset-zinc-900"
              >
                {t('dashboard.setupGuide.start')}
              </button>
              <button
                type="button"
                onClick={close}
                className="w-full rounded-2xl px-4 py-3 text-sm font-bold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                {t('dashboard.setupGuide.later')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

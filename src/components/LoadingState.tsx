import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Spinner } from './ui/Spinner';

interface BaseLoadingProps {
  message?: string;
  spinnerSize?: number;
  className?: string;
}

function LoadingIndicator({
  message,
  spinnerSize = 32,
  className = '',
}: BaseLoadingProps) {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex flex-col items-center justify-center space-y-6 text-center ${className}`}
    >
      <Spinner size={spinnerSize} />
      <p className="label-strong text-stone-500 dark:text-zinc-400">{displayMessage}</p>
    </motion.div>
  );
}

export function FullScreenLoader({
  message,
  spinnerSize = 32,
  className = '',
}: BaseLoadingProps) {
  return (
    <div
      className={`min-h-screen bg-cream-50 dark:bg-zinc-950 text-stone-900 dark:text-mintcom-text transition-colors duration-300 flex items-center justify-center ${className}`}
    >
      <LoadingIndicator message={message} spinnerSize={spinnerSize} />
    </div>
  );
}

interface SectionLoaderProps extends BaseLoadingProps {
  minHeightClassName?: string;
}

export function SectionLoader({
  message,
  spinnerSize = 32,
  className = '',
  minHeightClassName = 'min-h-[60vh]',
}: SectionLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${minHeightClassName} ${className}`}>
      <LoadingIndicator message={message} spinnerSize={spinnerSize} />
    </div>
  );
}

/**
 * Portals its children to a fixed, viewport-centered box.
 * Used to make every dashboard loading state (route-chunk load, in-page data
 * load, session-lock screen) land in the exact same spot, since a
 * document.body portal is unaffected by whatever padding/width the caller's
 * parent happens to have at that moment.
 */
export function CenteredOverlay({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-stone-50 dark:bg-zinc-950 pointer-events-none">
      {children}
    </div>,
    document.body
  );
}

interface SurfaceLoaderProps extends BaseLoadingProps {
  paddingClassName?: string;
}

export function SurfaceLoader({
  message,
  spinnerSize = 32,
  className = '',
  paddingClassName = 'p-12',
}: SurfaceLoaderProps) {
  return (
    <div
      className={`rounded-2xl border border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-800 shadow-sm ${className}`}
    >
      <div className={`flex items-center justify-center ${paddingClassName}`}>
        <LoadingIndicator message={message} spinnerSize={spinnerSize} />
      </div>
    </div>
  );
}

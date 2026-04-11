import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from './ui/Spinner';
import { startGlobalLoading, stopGlobalLoading } from '../config/api';

interface LoadingFallbackProps {
  /** Optional message to display below the spinner */
  message?: string;
  /** Whether to use a full-screen layout (default) or inline */
  fullScreen?: boolean;
}

/**
 * Loading fallback component for React.lazy Suspense boundaries.
 * Provides a smooth, branded loading experience during code-splitting chunk loads.
 */
export function LoadingFallback({
  message,
  fullScreen = true
}: LoadingFallbackProps) {
  const { t } = useTranslation();
  const displayMessage = message || t('common.loading');

  useEffect(() => {
    startGlobalLoading();
    return () => stopGlobalLoading();
  }, []);

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col items-center justify-center space-y-6"
    >
      <Spinner size={32} />

      {/* Loading text */}
      <p className="text-sm font-bold text-gray-500 tracking-widest">
        {displayMessage}
      </p>
    </motion.div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-white dark:bg-paymint-dark flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-20">
      {content}
    </div>
  );
}

/**
 * Minimal loading fallback for smaller sections (modals, panels, etc.)
 */
export function InlineLoader({ message }: { message?: string }) {
  return <LoadingFallback message={message} fullScreen={false} />;
}


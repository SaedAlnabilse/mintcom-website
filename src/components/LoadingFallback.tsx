import { AppStrings } from '../constants/AppStrings';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
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
  message = AppStrings.COMMON.LOADING,
  fullScreen = true
}: LoadingFallbackProps) {
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
      {/* Spinner */}
      <div className="relative">
        {/* Outer ring (static) */}
        <div className="w-14 h-14 border-4 border-paymint-green/20 rounded-full" />
        {/* Inner ring (spinning) */}
        <div className="w-14 h-14 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
      </div>

      {/* Loading text */}
      <p className="text-sm font-bold text-gray-500 tracking-widest">
        {message}
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
export function InlineLoader({ message = AppStrings.COMMON.LOADING }: { message?: string }) {
  return <LoadingFallback message={message} fullScreen={false} />;
}

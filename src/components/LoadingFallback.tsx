import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
      {/* Spinner */}
      <div className="relative">
        {/* Outer pulsing ring */}
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-16 h-16 border-2 border-paymint-green/30 rounded-full absolute -inset-1" 
        />
        
        {/* Main rotating gradient ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-full border-4 border-transparent border-t-paymint-green border-r-paymint-green/40 shadow-[0_0_15px_rgba(124,195,159,0.3)]"
        />

        {/* Inner static/slow-pulse core */}
        <motion.div 
          animate={{ scale: [0.9, 1, 0.9] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-6 bg-paymint-green rounded-full absolute inset-0 m-auto shadow-[0_0_10px_rgba(124,195,159,0.5)]"
        />
      </div>

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

import { motion } from 'framer-motion';
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
      <p className="label-strong text-gray-500 dark:text-gray-400">{displayMessage}</p>
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
      className={`min-h-screen bg-cream-50 dark:bg-paymint-dark text-gray-900 dark:text-paymint-text transition-colors duration-300 flex items-center justify-center ${className}`}
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
      className={`rounded-2xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/5 shadow-sm ${className}`}
    >
      <div className={`flex items-center justify-center ${paddingClassName}`}>
        <LoadingIndicator message={message} spinnerSize={spinnerSize} />
      </div>
    </div>
  );
}

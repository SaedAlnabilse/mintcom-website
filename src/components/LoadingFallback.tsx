import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { startGlobalLoading, stopGlobalLoading } from '../config/api';
import { FullScreenLoader, SectionLoader } from './LoadingState';

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

  if (fullScreen) {
    return <FullScreenLoader message={displayMessage} />;
  }

  return (
    <SectionLoader
      message={displayMessage}
      minHeightClassName="py-20"
      className="w-full"
    />
  );
}

/**
 * Minimal loading fallback for smaller sections (modals, panels, etc.)
 */
export function InlineLoader({ message }: { message?: string }) {
  return <LoadingFallback message={message} fullScreen={false} />;
}


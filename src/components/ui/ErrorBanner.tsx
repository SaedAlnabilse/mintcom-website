import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

export interface ErrorBannerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  title?: string;
  className?: string;
  hideDot?: boolean;
}

/**
 * Shared error/validation banner.
 * Used for form validation errors, import issues, and critical operational alerts.
 * Supports scroll-to-error via ref forwarding and includes a standard red status indicator dot.
 */
export const ErrorBanner = forwardRef<HTMLDivElement, ErrorBannerProps>(function ErrorBanner(
  { children, title, className = '', hideDot = false, ...props },
  ref,
) {
  if (title) {
    return (
      <div
        ref={ref}
        role="alert"
        className={`p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold ${className}`.trim()}
        {...props}
      >
        <div className="flex items-center gap-2 mb-1">
          {!hideDot && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
          <span className="font-bold">{title}</span>
        </div>
        <div className="font-normal text-xs text-red-500 dark:text-red-400">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="alert"
      className={`p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2 ${className}`.trim()}
      {...props}
    >
      {!hideDot && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
      {children}
    </div>
  );
});

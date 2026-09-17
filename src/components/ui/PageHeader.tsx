import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Subtitle text or rich node (e.g. text + establishment badge). */
  subtitle?: ReactNode;
  /** Right-side actions (buttons, filters). Stacks below title on mobile. */
  actions?: ReactNode;
  className?: string;
}

/**
 * Shared page header (1/3 of the header/badge/empty-state kit).
 * Matches the established site pattern: responsive title + subtitle on the
 * left, actions on the right (stacked on mobile, inline on lg).
 */
export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex flex-col lg:flex-row lg:items-end justify-between gap-6 ${className}`.trim()}>
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

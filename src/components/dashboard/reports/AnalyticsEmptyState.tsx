import type { LucideIcon } from 'lucide-react';
import React from 'react';

interface AnalyticsEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  panelClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  compact?: boolean;
}

export const AnalyticsEmptyState = React.memo(function AnalyticsEmptyState({
  icon: Icon,
  title,
  description,
  className = '',
  panelClassName = '',
  titleClassName = '',
  descriptionClassName = '',
  compact = false,
}: AnalyticsEmptyStateProps) {
  const normalizedTitle = title.trim().toLowerCase().replace(/\s+/g, ' ');
  const normalizedDescription = description?.trim().toLowerCase().replace(/\s+/g, ' ');
  const visibleDescription =
    description && normalizedDescription && normalizedDescription !== normalizedTitle ? description : undefined;

  return (
    <div className={`flex min-h-[220px] w-full flex-col items-center justify-center text-center ${compact ? 'gap-3 py-10 px-5' : 'gap-4 py-12 px-6'} ${className}`}>
      <div
        className={`flex items-center justify-center rounded-2xl border border-stone-100 text-stone-300 dark:border-zinc-800 dark:text-zinc-700 ${compact ? 'h-14 w-14 bg-stone-50 dark:bg-zinc-800' : 'h-16 w-16 bg-stone-50 dark:bg-zinc-800'} ${panelClassName}`}
      >
        <Icon size={compact ? 24 : 28} className="text-current" />
      </div>
      <div className="mx-auto max-w-md space-y-1.5">
        <p className={`text-sm font-bold text-stone-900 dark:text-zinc-100 tracking-wide ${!visibleDescription ? 'text-base leading-snug' : ''} ${titleClassName}`}>{title}</p>
        {visibleDescription && (
          <p className={`mx-auto max-w-sm text-xs font-medium text-stone-500 dark:text-zinc-400 leading-relaxed ${descriptionClassName}`}>
            {visibleDescription}
          </p>
        )}
      </div>
    </div>
  );
});

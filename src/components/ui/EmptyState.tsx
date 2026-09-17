import type { ReactNode, ElementType } from 'react';

interface EmptyStateProps {
  /** Icon component rendered in the gray tile (e.g. Package). */
  icon: ElementType;
  title: string;
  description?: ReactNode;
  /** Optional CTA rendered below the description. */
  action?: ReactNode;
  className?: string;
}

/**
 * Shared empty state (3/3 of the kit).
 * Matches the established pattern: dashed card, gray icon tile,
 * bold title, muted description, optional action.
 */
export function EmptyState({ icon: Icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`py-16 sm:py-24 bg-white dark:bg-[#1E293B] rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center flex flex-col items-center px-6 ${className}`.trim()}
    >
      <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm font-bold text-gray-500 max-w-xs mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

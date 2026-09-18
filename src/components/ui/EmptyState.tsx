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
      className={`py-16 sm:py-24 bg-white dark:bg-zinc-900/60 rounded-2xl border border-dashed border-stone-200 dark:border-zinc-800 text-center flex flex-col items-center px-6 ${className}`.trim()}
    >
      <div className="w-20 h-20 bg-stone-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-stone-300" />
      </div>
      <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100 mb-2">{title}</h3>
      {description && (
        <p className="text-sm font-bold text-stone-500 max-w-xs mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}

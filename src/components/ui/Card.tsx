import type { ReactNode } from 'react';

type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const PADDING_CLASS: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 sm:p-8',
};

interface CardProps {
  children: ReactNode;
  padding?: CardPadding;
  className?: string;
  onClick?: () => void;
}

/**
 * Shared content card (4/5 of the UI kit).
 * Unifies the `bg-white dark:bg-[#1E293B] rounded-2xl border` cards:
 * same surface, border, radius, shadow. Padding via prop, extras via className.
 */
export function Card({ children, padding = 'md', className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm ${PADDING_CLASS[padding]} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

interface PanelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Shared muted inner panel (companion to Card).
 * The `bg-gray-50 dark:bg-black/20` inset surface used for toggles,
 * sub-sections and grouped controls.
 */
export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div
      className={`bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 ${className}`.trim()}
    >
      {children}
    </div>
  );
}

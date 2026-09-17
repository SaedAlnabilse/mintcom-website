import type { ReactNode } from 'react';

type BadgeTone = 'green' | 'red' | 'amber' | 'blue' | 'gray';

const TONE_CLASS: Record<BadgeTone, string> = {
  green: 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20',
  red: 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  gray: 'bg-gray-500/10 text-gray-500 dark:text-gray-400 border-gray-500/20',
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

/**
 * Shared status pill (2/3 of the kit).
 * Unifies the one-off bg/10 text status pills: same padding, border,
 * tiny bold type, dark-mode aware.
 */
export function Badge({ children, tone = 'green', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-bold shrink-0 ${TONE_CLASS[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  );
}

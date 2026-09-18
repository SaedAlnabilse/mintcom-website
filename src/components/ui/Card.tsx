import type { ReactNode } from 'react';
import { cardClass, insetPanelClass } from './theme';

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
 * Shared content card — surface comes from `theme.cardClass`.
 * To restyle every card on the site, edit the token, not this file.
 * Padding via prop, extras via className.
 */
export function Card({ children, padding = 'md', className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`${cardClass} ${PADDING_CLASS[padding]} ${className}`.trim()}
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
 * Shared muted inner panel — surface comes from `theme.insetPanelClass`.
 */
export function Panel({ children, className = '' }: PanelProps) {
  return (
    <div
      className={`${insetPanelClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
}

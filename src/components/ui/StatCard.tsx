import type { ComponentType, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Card } from './Card';
import { StatValue } from './StatValue';
import {
  statLabelClass,
  statValueClass,
  mutedClass,
  iconBoxGreenClass,
  iconBoxNeutralClass,
} from './theme';

export interface StatCardProps {
  label: ReactNode;
  value: string | number;
  currency?: string | null;
  isInteger?: boolean;
  /** Lucide icon component, BiIcon component, or custom node */
  icon?: ComponentType<{ size?: number; className?: string; strokeWidth?: number }> | ReactNode;
  /** Icon box tone. Authenticated portal defaults to 'green'; marketing/neutral uses 'neutral'. */
  iconTone?: 'green' | 'neutral';
  /** Secondary detail or subtext rendered below the value */
  sub?: ReactNode;
  /** Informational note or hint */
  info?: ReactNode;
  /** Trailing badge or indicator in the top row */
  badge?: ReactNode;
  /** Navigation route if clicking the card */
  route?: string;
  onClick?: () => void;
  /** 'stacked' is canonical support/overview style; 'horizontal' places icon on left */
  layout?: 'stacked' | 'horizontal';
  className?: string;
  delay?: number;
}

/**
 * Shared KPI Stat Card — composed directly from `Card` and `theme.ts` tokens.
 * Single source of truth for stat/KPI cards across Owner and Dashboard portals.
 */
export function StatCard({
  label,
  value,
  currency,
  isInteger = true,
  icon,
  iconTone = 'green',
  sub,
  info,
  badge,
  route,
  onClick,
  layout = 'stacked',
  className = '',
  delay = 0,
}: StatCardProps) {
  const navigate = useNavigate();
  const isClickable = Boolean(route || onClick);
  const iconBoxClass = iconTone === 'neutral' ? iconBoxNeutralClass : iconBoxGreenClass;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (route) {
      navigate(route);
    }
  };

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'function') {
      const IconComponent = icon as ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
      return <IconComponent size={19} strokeWidth={1.75} />;
    }
    return icon;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="h-full"
    >
      <Card
        padding="none"
        onClick={isClickable ? handleClick : undefined}
        className={`p-5 transition-colors h-full flex flex-col justify-between ${
          isClickable
            ? 'cursor-pointer hover:border-stone-300 dark:hover:border-zinc-700 group'
            : ''
        } ${className}`.trim()}
      >
        {layout === 'stacked' ? (
          <div>
            {(icon || badge || isClickable) && (
              <div className="flex items-center justify-between mb-3">
                {icon ? (
                  <div className={iconBoxClass}>
                    {renderIcon()}
                  </div>
                ) : <div />}

                <div className="flex items-center gap-2">
                  {badge}
                  {isClickable && (
                    <ExternalLink
                      size={14}
                      className="text-stone-300 transition-colors group-hover:text-stone-500 dark:text-zinc-600 dark:group-hover:text-zinc-400"
                    />
                  )}
                </div>
              </div>
            )}

            <p className={statLabelClass}>{label}</p>

            <StatValue
              value={value}
              currency={currency}
              isInteger={isInteger}
              className={`${statValueClass} mt-0.5`}
            />

            {(sub || info) && (
              <p className={`${mutedClass} mt-1 leading-relaxed`}>
                {sub || info}
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {icon && (
              <div className={iconBoxClass}>
                {renderIcon()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`${statLabelClass} truncate`}>{label}</p>
                {badge}
                {isClickable && (
                  <ExternalLink
                    size={14}
                    className="text-stone-300 transition-colors group-hover:text-stone-500 dark:text-zinc-600 dark:group-hover:text-zinc-400 shrink-0"
                  />
                )}
              </div>

              <StatValue
                value={value}
                currency={currency}
                isInteger={isInteger}
                className={`${statValueClass} mt-0.5`}
              />

              {(sub || info) && (
                <p className={`${mutedClass} mt-1 leading-relaxed truncate`}>
                  {sub || info}
                </p>
              )}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export interface StatCardGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
  id?: string;
}

const COLUMN_CLASS: Record<2 | 3 | 4 | 5, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
};

export function StatCardGrid({
  children,
  columns = 3,
  className = '',
  id,
}: StatCardGridProps) {
  return (
    <div id={id} className={`grid ${COLUMN_CLASS[columns]} gap-3 ${className}`.trim()}>
      {children}
    </div>
  );
}

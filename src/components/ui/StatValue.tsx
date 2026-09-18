import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface StatValueProps {
  value: string | number;
  currency?: string | null;
  className?: string;
  containerClassName?: string;
  isInteger?: boolean;
  isPercentage?: boolean;
  isAlreadyPercent?: boolean;
  prefix?: string;
  suffix?: string;
}

const TEXT_SIZE_CLASSES = new Set([
  'text-xs',
  'text-sm',
  'text-base',
  'text-lg',
  'text-xl',
  'text-2xl',
  'text-3xl',
  'text-4xl',
  'text-5xl',
  'text-6xl',
  'text-7xl',
  'text-8xl',
  'text-9xl',
]);

const TEXT_SIZE_RANK: Record<string, number> = {
  'text-xs': 0,
  'text-sm': 1,
  'text-base': 2,
  'text-lg': 3,
  'text-xl': 4,
  'text-2xl': 5,
  'text-3xl': 6,
  'text-4xl': 7,
  'text-5xl': 8,
  'text-6xl': 9,
  'text-7xl': 10,
  'text-8xl': 11,
  'text-9xl': 12,
};

const TEXT_SIZE_BY_RANK = Object.fromEntries(
  Object.entries(TEXT_SIZE_RANK).map(([className, rank]) => [rank, className])
) as Record<number, string>;

const getTailwindUtility = (className: string) => className.split(':').pop() || className;

const isTextSizeClass = (className: string) => {
  const utility = getTailwindUtility(className);
  if (TEXT_SIZE_CLASSES.has(utility)) return true;
  return /^text-\[(?:\d|\.)[\d.]+(?:px|rem|em|%)\]$/.test(utility);
};

const getBaseTextSize = (className: string) => (
  className
    .split(/\s+/)
    .map(getTailwindUtility)
    .find((token) => token in TEXT_SIZE_RANK) || 'text-2xl'
);

const stripTextSizeClasses = (className: string) => (
  className
    .split(/\s+/)
    .filter((token) => token && !isTextSizeClass(token))
    .join(' ')
);

const hasTextColorClass = (className: string) => (
  className
    .split(/\s+/)
    .some((token) => (
      getTailwindUtility(token).startsWith('text-')
      && !isTextSizeClass(token)
      && !['text-left', 'text-center', 'text-right', 'text-justify', 'text-start', 'text-end'].includes(getTailwindUtility(token))
    ))
);

const TEXT_SIZE_PX: Record<string, number> = {
  'text-xs': 12,
  'text-sm': 14,
  'text-base': 16,
  'text-lg': 18,
  'text-xl': 20,
  'text-2xl': 24,
  'text-3xl': 30,
  'text-4xl': 36,
  'text-5xl': 48,
  'text-6xl': 60,
  'text-7xl': 72,
  'text-8xl': 96,
  'text-9xl': 128,
};

const getTextSizePx = (textSizeClass: string) => {
  if (textSizeClass in TEXT_SIZE_PX) return TEXT_SIZE_PX[textSizeClass];

  const arbitraryPx = textSizeClass.match(/^text-\[(\d+(?:\.\d+)?)px\]$/);
  if (arbitraryPx) return Number(arbitraryPx[1]);

  const arbitraryRem = textSizeClass.match(/^text-\[(\d+(?:\.\d+)?)rem\]$/);
  if (arbitraryRem) return Number(arbitraryRem[1]) * 16;

  return TEXT_SIZE_PX['text-2xl'];
};

/**
 * Reusable component for displaying statistical values (numbers/currency/percentages).
 * Handles font-scaling for large numbers, truncation with ellipsis,
 * and consistent styling for currency codes.
 */
export const StatValue: React.FC<StatValueProps> = ({ 
  value, 
  currency, 
  className = "text-2xl",
  containerClassName = '',
  isInteger = false,
  isPercentage = false,
  isAlreadyPercent = false,
  prefix = '',
  suffix
}) => {
  const { t } = useTranslation();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState<{
    left: number;
    top: number;
    placement: 'top' | 'bottom';
    maxWidth: number;
  } | null>(null);
  
  // Format the value based on type and locale
  const displayValue = React.useMemo(() => {
    if (typeof value === 'number') {
      if (isPercentage) {
        const val = isAlreadyPercent ? value / 100 : value;
        return val.toLocaleString(t('common.locale'), {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });
      }
      return value.toLocaleString(t('common.locale'), {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2,
      });
    }
    return value;
  }, [value, t, isInteger, isPercentage, isAlreadyPercent]);

  const valueString = `${prefix}${String(displayValue)}`;
  const fullDisplay = [valueString, currency, suffix].filter(Boolean).join(' ');
  const length = valueString.length;

  // Determine font size class based on string length to prevent overflow
  const fontSizeClass = React.useMemo(() => {
    const baseSize = getBaseTextSize(className);
    const baseRank = TEXT_SIZE_RANK[baseSize] ?? TEXT_SIZE_RANK['text-2xl'];
    const maxRank = length > 18
      ? TEXT_SIZE_RANK['text-lg']
      : length > 15
        ? TEXT_SIZE_RANK['text-xl']
        : length > 12
          ? TEXT_SIZE_RANK['text-2xl']
          : baseRank;

    return TEXT_SIZE_BY_RANK[Math.min(baseRank, maxRank)] || baseSize;
  }, [className, length]);

  const amountFontPx = getTextSizePx(fontSizeClass);
  const currencyFontPx = Math.max(11, Math.round(amountFontPx * 0.75));

  // Truncation logic for extreme safety (e.g. 100 quadrillion)
  const isTruncated = length > 22;
  const finalDisplay = isTruncated ? `${valueString.slice(0, 19)}...` : valueString;
  const shouldShowTooltip = fullDisplay.length > 15;
  const valueClassName = stripTextSizeClasses(className);
  const defaultColorClassName = hasTextColorClass(valueClassName) ? '' : 'text-stone-900 dark:text-zinc-100';

  const updateTooltipPosition = React.useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || typeof window === 'undefined') return;

    const viewportPadding = 12;
    const maxWidth = Math.min(480, window.innerWidth - viewportPadding * 2);
    const left = Math.min(
      Math.max(rect.left, viewportPadding),
      window.innerWidth - maxWidth - viewportPadding
    );
    const placement = rect.top > 48 ? 'top' : 'bottom';

    setTooltipPosition({
      left,
      top: placement === 'top' ? rect.top - 8 : rect.bottom + 8,
      placement,
      maxWidth,
    });
  }, []);

  const showTooltip = React.useCallback(() => {
    if (!shouldShowTooltip) return;
    updateTooltipPosition();
  }, [shouldShowTooltip, updateTooltipPosition]);

  const hideTooltip = React.useCallback(() => {
    setTooltipPosition(null);
  }, []);

  React.useEffect(() => {
    if (!tooltipPosition) return;

    window.addEventListener('scroll', updateTooltipPosition, true);
    window.addEventListener('resize', updateTooltipPosition);

    return () => {
      window.removeEventListener('scroll', updateTooltipPosition, true);
      window.removeEventListener('resize', updateTooltipPosition);
    };
  }, [tooltipPosition, updateTooltipPosition]);

  const tooltip = tooltipPosition && typeof document !== 'undefined'
    ? createPortal(
      <div
        className="pointer-events-none fixed z-[9999]"
        style={{
          left: tooltipPosition.left,
          top: tooltipPosition.top,
          maxWidth: tooltipPosition.maxWidth,
          transform: tooltipPosition.placement === 'top' ? 'translateY(-100%)' : undefined,
        }}
      >
        <div className="max-w-full whitespace-normal break-words rounded-lg border border-stone-200 dark:border-zinc-800 bg-stone-900 dark:bg-zinc-800 px-3 py-1.5 text-[11px] font-semibold text-white dark:text-zinc-100 shadow-md">
          {fullDisplay}
        </div>
      </div>,
      document.body
    )
    : null;

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex max-w-full min-w-0 items-baseline gap-1 ${containerClassName}`}
      aria-label={shouldShowTooltip ? fullDisplay : undefined}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      tabIndex={shouldShowTooltip ? 0 : undefined}
    >
      <span 
        className={`${valueClassName} ${fontSizeClass} ${defaultColorClassName} block min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-bold tracking-tight transition-all duration-200`}
      >
        {finalDisplay}
      </span>
      
      {currency && (
        <span
          className="font-bold uppercase opacity-80 select-none text-current"
          style={{ fontSize: currencyFontPx }}
        >
          {currency}
        </span>
      )}

      {suffix && (
        <span className="min-w-0 truncate text-[11px] font-bold text-stone-400 dark:text-zinc-500">
          {suffix}
        </span>
      )}

      {tooltip}
    </div>
  );
};

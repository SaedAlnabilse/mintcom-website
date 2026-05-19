import React from 'react';
import { useTranslation } from 'react-i18next';

interface StatValueProps {
  value: string | number;
  currency?: string | null;
  className?: string;
  isInteger?: boolean;
  isPercentage?: boolean;
  isAlreadyPercent?: boolean;
}

/**
 * Reusable component for displaying statistical values (numbers/currency/percentages).
 * Handles font-scaling for large numbers, truncation with ellipsis,
 * and consistent styling for currency codes.
 */
export const StatValue: React.FC<StatValueProps> = ({ 
  value, 
  currency, 
  className = "text-2xl",
  isInteger = false,
  isPercentage = false,
  isAlreadyPercent = false
}) => {
  const { t } = useTranslation();
  
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

  const valueString = String(displayValue);
  const length = valueString.length;

  // Determine font size class based on string length to prevent overflow
  const getFontSize = () => {
    if (length > 18) return 'text-lg'; // Extremely long
    if (length > 15) return 'text-xl'; // Very long
    if (length > 12) return 'text-2xl'; // Long
    return className; // Default (usually text-2xl or text-3xl)
  };

  // Truncation logic for extreme safety (e.g. 100 quadrillion)
  const isTruncated = length > 22;
  const finalDisplay = isTruncated ? valueString.slice(0, 19) + '...' : displayValue;

  return (
    <div className="flex items-baseline gap-1.5 group/stat relative max-w-full overflow-hidden" title={length > 15 ? String(displayValue) + (currency ? ` ${currency}` : '') : undefined}>
      <span 
        className={`${getFontSize()} font-bold text-gray-900 dark:text-white tracking-tight transition-all duration-200 truncate`}
      >
        {finalDisplay}
      </span>
      
      {currency && (
        <span className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase self-end mb-[3px] select-none">
          {currency}
        </span>
      )}

      {/* Tooltip for long numbers (Native title is used as fallback, but this adds a styled one if needed) */}
      {length > 15 && (
        <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover/stat:opacity-100 pointer-events-none transition-opacity duration-200 z-[100]">
          <div className="bg-gray-900 dark:bg-slate-800 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-2xl border border-white/10 whitespace-nowrap font-bold">
            {displayValue} {currency}
          </div>
        </div>
      )}
    </div>
  );
};

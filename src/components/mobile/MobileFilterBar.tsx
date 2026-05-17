import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, ChevronDown, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  id: string;
  label: string;
  options: FilterOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  showAll?: boolean;
  allLabel?: string;
}

interface MobileFilterBarProps {
  filters: FilterConfig[];
  children?: ReactNode;
  className?: string;
}

export function MobileFilterBar({ filters, children, className = '' }: MobileFilterBarProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterSheet, setActiveFilterSheet] = useState<string | null>(null);

  // Count active filters
  const activeCount = filters.filter(f => f.value !== null).length;

  // Prevent body scroll when filter sheet is open
  useEffect(() => {
    if (activeFilterSheet) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeFilterSheet]);

  return (
    <>
      {/* Desktop Filter Bar - show as normal */}
      <div className={`hidden md:block ${className}`}>
        {children}
      </div>

      {/* Mobile Filter Bar */}
      <div className={`md:hidden ${className}`}>
        {/* Collapsed State - Filter Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${activeCount > 0
              ? 'bg-mintcom-green/5 border-mintcom-green text-mintcom-green'
              : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
            }`}
        >
          <div className="flex items-center gap-2">
            <Filter size={18} />
            <span className="text-sm font-bold">{t('common.filters')}</span>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-mintcom-green text-black label-strong font-outfit">
                {activeCount}
              </span>
            )}
          </div>
          <ChevronDown
            size={18}
            className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Expanded State - Filter Chips */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3">
                {/* Filter chips row */}
                <div className="flex flex-wrap gap-2">
                  {filters.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilterSheet(filter.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all touch-target ${filter.value !== null
                          ? 'bg-mintcom-green/10 text-mintcom-green border border-mintcom-green/30'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-transparent'
                        }`}
                    >
                      <span>{filter.label}</span>
                      {filter.value !== null ? (
                        <span className="text-xs opacity-75">
                          : {filter.options.find(o => o.value === filter.value)?.label || filter.value}
                        </span>
                      ) : (
                        <ChevronDown size={14} />
                      )}
                    </button>
                  ))}
                </div>

                {/* Clear all button */}
                {activeCount > 0 && (
                  <button
                    onClick={() => filters.forEach(f => f.onChange(null))}
                    className="flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <X size={14} />
                    {t('common.clearAll')}
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Filter Selection Sheet */}
      <AnimatePresence>
        {activeFilterSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[100] md:hidden"
              onClick={() => setActiveFilterSheet(null)}
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[101] bg-white dark:bg-mintcom-surface rounded-t-3xl shadow-2xl md:hidden max-h-[70vh] overflow-hidden flex flex-col"
            >
              {/* Handle */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {filters.find(f => f.id === activeFilterSheet)?.label}
                </h3>
                <button
                  onClick={() => setActiveFilterSheet(null)}
                  className="p-2 -mr-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Options */}
              <div className="flex-1 overflow-y-auto p-2 pb-safe">
                {(() => {
                  const filter = filters.find(f => f.id === activeFilterSheet);
                  if (!filter) return null;

                  const options = filter.showAll !== false
                    ? [{ label: filter.allLabel || t('common.all'), value: '' }, ...filter.options]
                    : filter.options;

                  return options.map((option) => {
                    const isSelected = filter.value === (option.value || null);
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          filter.onChange(option.value || null);
                          setActiveFilterSheet(null);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all touch-target ${isSelected
                            ? 'bg-mintcom-green/10'
                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                          }`}
                      >
                        <span className={`text-sm font-bold ${isSelected ? 'text-mintcom-green' : 'text-gray-900 dark:text-white'}`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <Check size={18} className="text-mintcom-green" />
                        )}
                      </button>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Standalone filter chip for use outside MobileFilterBar
interface FilterChipProps {
  label: string;
  value?: string | null;
  isActive?: boolean;
  onClick?: () => void;
  onClear?: () => void;
}

export function FilterChip({ label, value, isActive, onClick, onClear }: FilterChipProps) {
  const active = isActive || value !== null;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all touch-target ${active
          ? 'bg-mintcom-green/10 text-mintcom-green border border-mintcom-green/30'
          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-transparent'
        }`}
    >
      <span>{label}</span>
      {value && <span className="text-xs opacity-75">: {value}</span>}
      {active && onClear && (
        <X
          size={14}
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
          className="ml-1 hover:opacity-75"
        />
      )}
      {!active && <ChevronDown size={14} />}
    </button>
  );
}


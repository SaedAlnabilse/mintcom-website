import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, MoreVertical } from 'lucide-react';

interface MobileCardViewProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  onItemClick?: (item: T) => void;
  emptyState?: ReactNode;
  isLoading?: boolean;
  loadingCount?: number;
}

export function MobileCardView<T>({
  items,
  renderCard,
  keyExtractor,
  onItemClick,
  emptyState,
  isLoading = false,
  loadingCount = 3,
}: MobileCardViewProps<T>) {
  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100 dark:divide-white/5">
        {Array.from({ length: loadingCount }).map((_, i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-white/5">
      {items.map((item, index) => (
        <motion.div
          key={keyExtractor(item)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.03 }}
          onClick={() => onItemClick?.(item)}
          className={`p-4 ${onItemClick ? 'cursor-pointer active:bg-gray-50 dark:active:bg-white/[0.02]' : ''} transition-colors`}
        >
          {renderCard(item, index)}
        </motion.div>
      ))}
    </div>
  );
}

// Pre-built card layouts for common use cases

interface StandardCardProps {
  avatar?: ReactNode;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  details?: Array<{ label: string; value: string | ReactNode }>;
  actions?: ReactNode;
  showChevron?: boolean;
  onMoreClick?: () => void;
}

export function StandardMobileCard({
  avatar,
  title,
  subtitle,
  badge,
  details,
  actions,
  showChevron = true,
  onMoreClick,
}: StandardCardProps) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {avatar && (
            <div className="flex-shrink-0">
              {avatar}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
              {title}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {badge}
          {onMoreClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoreClick();
              }}
              className="p-2 -mr-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors touch-target"
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Details grid */}
      {details && details.length > 0 && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
          {details.map((detail, i) => (
            <div key={i}>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
                {detail.label}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {detail.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {(actions || showChevron) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2">
            {actions}
          </div>
          {showChevron && (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </div>
      )}
    </div>
  );
}

// Skeleton loader for cards
function MobileCardSkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-lg" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-24" />
        </div>
        <div className="h-6 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-white/5">
        <div>
          <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-12 mb-1" />
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-20" />
        </div>
        <div>
          <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-12 mb-1" />
          <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-20" />
        </div>
      </div>
    </div>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  label: string;
}

export function MobileStatusBadge({ status, label }: StatusBadgeProps) {
  const colorClasses = {
    success: 'bg-paymint-green/10 text-paymint-green border-paymint-green/20',
    warning: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    neutral: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold tracking-wide border ${colorClasses[status]}`}>
      {label}
    </span>
  );
}

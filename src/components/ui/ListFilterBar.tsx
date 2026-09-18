import type { ReactNode } from 'react';
import { Grid3X3, List } from 'lucide-react';
import { SearchInput } from './SearchInput';

export type ListViewMode = 'grid' | 'list';

interface ListFilterBarProps {
  searchValue: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearchClear: () => void;
  searchPlaceholder?: string;
  searchId?: string;
  children?: ReactNode;
  viewMode?: ListViewMode;
  onViewModeChange?: (mode: ListViewMode) => void;
  viewToggleId?: string;
}

/**
 * SHARED LIST FILTER BAR — the Employees-page standard.
 *
 * Layout: standalone search (left, max-w-md) + filter controls (right).
 * The deck itself is INVISIBLE — no Card, no border, no shadow.
 * Each control carries its own surface, per the rule documented in `./FilterBar`.
 * All controls use h-12 to keep heights aligned across every screen.
 */
export function ListFilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder,
  searchId,
  children,
  viewMode,
  onViewModeChange,
  viewToggleId,
}: ListFilterBarProps) {
  const showViewToggle = viewMode !== undefined && onViewModeChange !== undefined;

  return (
    <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between gap-3 sm:gap-4">
      <div id={searchId} className="relative flex-1 sm:max-w-md">
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          onClear={onSearchClear}
          placeholder={searchPlaceholder}
          className="w-full"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        {children}
        {showViewToggle && (
          <div
            id={viewToggleId}
            className="flex items-center bg-stone-100 dark:bg-zinc-800 rounded-xl border border-stone-200 dark:border-zinc-800 p-1 h-12 shrink-0"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-800 text-mintcom-green shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <Grid3X3 size={18} />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              className={`p-2 h-full px-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 text-mintcom-green shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
            >
              <List size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListFilterBar;

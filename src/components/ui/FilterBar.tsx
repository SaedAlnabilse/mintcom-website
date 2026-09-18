import React from 'react';

/**
 * SHARED FILTER ROW — single source of truth for every filter deck.
 *
 * Rule: the deck itself is INVISIBLE (no card, no border, no shadow).
 * Each control carries its own border + active tint, so there is never
 * a frame-inside-a-frame. Values mirror `./theme` toggle tokens (with `!`
 * to beat inner component styles) — keep them in sync when the theme changes.
 *
 * Companions (same language, different files):
 * - `./SingleSelect` / `./SelectInput` — dropdown buttons (h-12, rounded-xl)
 * - `./DateRangePicker` — date button (h-12, rounded-xl)
 * - time-group boxes below use `filterBoxActive/InactiveClass`
 */

/** Base metrics every filter dropdown button shares (passed as buttonClassName). */
export const filterSelectButtonClass =
  '!h-12 !rounded-xl !px-4 !text-sm !font-semibold border transition-colors';

/** Active (filtered) vs idle dropdown face. */
export const filterSelectActiveClass =
  '!bg-mintcom-green/10 !border-mintcom-green/30';
export const filterSelectInactiveClass =
  '!bg-white dark:!bg-zinc-900/60 !border-stone-200 dark:!border-zinc-800';

/** Active vs idle face for grouped boxes (e.g. the time-range box). */
export const filterBoxActiveClass =
  'bg-mintcom-green/10 border-mintcom-green/30';
export const filterBoxInactiveClass =
  'bg-white dark:bg-zinc-900/60 border-stone-200 dark:border-zinc-800';

export function FilterBar({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-stretch gap-2 ${className}`}>
      {children}
    </div>
  );
}

export default FilterBar;

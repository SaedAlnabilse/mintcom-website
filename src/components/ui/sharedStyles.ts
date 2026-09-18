/**
 * SHARED SELECTION LANGUAGE — single source of truth.
 *
 * Every "selected / active" state in the app (sidebar nav, drawer nav,
 * submenu rows, pagination numbers, user cards, avatars) reads from here.
 * Want to change what "chosen" looks like? Edit the constants below ONCE
 * and it updates everywhere.
 *
 * (Primary buttons live in `./Button.tsx` — same idea, one component.)
 *
 * Rules baked in:
 * - active = mint TINT (`bg-mintcom-green/12`), never a solid fill.
 *   Solid mint reads as a CTA button and renders as muddy sage on screen.
 * - active icon turns mint via `[&>svg]:text-mintcom-green`.
 * - radius is `rounded-lg` everywhere (nav rows, sub rows, page numbers).
 * - weight is `font-semibold`, never black.
 * - no shadows on rows — they create visual noise in lists.
 */

/** Selected sidebar / drawer row (desktop + mobile). */
export const activeRowClass =
  'bg-mintcom-green/12 text-stone-900 dark:text-zinc-100 font-semibold active-menu-item [&>svg]:text-mintcom-green';

/** Unselected sidebar / drawer row (desktop — gray-500 base). */
export const inactiveRowClass =
  'text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-100';

/** Unselected drawer row (mobile — gray-600 base for contrast on white). */
export const inactiveMobileRowClass =
  'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800';

/** Expanded group header that contains the active page. */
export const activeGroupClass =
  'bg-stone-100 dark:bg-zinc-800 text-stone-900 dark:text-zinc-100';

/** Selected submenu row (e.g. Add-ons under Item's Menu). */
export const activeSubRowClass =
  'bg-mintcom-green/12 text-stone-900 dark:text-zinc-100 font-semibold active-menu-item';

/** Unselected submenu row. */
export const inactiveSubRowClass =
  'text-stone-500 dark:text-zinc-400 font-medium hover:text-stone-900 dark:hover:text-zinc-100 hover:bg-stone-100 dark:hover:bg-zinc-800';

/** Submenu bullet dot — selected / unselected. */
export const subDotActiveClass = 'bg-mintcom-green';
export const subDotInactiveClass = 'bg-stone-300 dark:bg-zinc-600';

/** Selected pagination number. Border keeps its size identical to siblings. */
export const activePageClass =
  'bg-mintcom-green/12 text-stone-900 dark:text-zinc-100 font-semibold border border-mintcom-green/30';

/** Unselected pagination number. */
export const inactivePageClass =
  'bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 text-stone-500 dark:text-zinc-400 font-medium hover:text-stone-900 dark:hover:text-zinc-100';

/** Mint tint bubble (count badges, status chips). Shape/size stay local. */
export const tintBubbleClass =
  'bg-mintcom-green/15 text-emerald-700 dark:text-mintcom-green';

/** User avatar circle (initials). Shape AND text size stay at the call site. */
export const avatarClass = `${tintBubbleClass} font-bold`;

/** User identity card (sidebar / drawer footer). Padding/layout stay local. */
export const userCardClass =
  'bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-xl';

/** User card name + email lines. */
export const userNameClass =
  'text-sm font-semibold text-stone-900 dark:text-zinc-100 truncate';
export const userEmailClass =
  'text-xs text-stone-600 dark:text-zinc-400 truncate';

/** Tiny uppercase section label (e.g. "Active Establishment"). */
export const eyebrowClass =
  'text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-zinc-400';

/** Mint accent text on any background (icons + links that must stay vivid). */
export const accentTextClass = 'text-emerald-700 dark:text-mintcom-green';

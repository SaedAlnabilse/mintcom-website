/**
 * SITE THEME — single source of truth.
 *
 * Change a value here ONCE and every screen that uses these tokens follows.
 * This is the entire support-screen design system from
 * `docs/SUPPORT_THEME_REFERENCE.md`, expressed as full Tailwind class strings.
 *
 * ⚠️ TAILWIND RULE — tokens must stay COMPLETE literal strings.
 * Do NOT build them dynamically (`'rounded-' + size`) and do NOT .split() /
 * .join() fragments: Tailwind's scanner only generates classes it can read
 * verbatim in source. If a class doesn't appear literally, it won't exist
 * in the CSS. When adding a token, paste the full class list.
 */

/* ── Surfaces ─────────────────────────────────────────────── */
export const pageClass = 'min-h-screen bg-cream-100 dark:bg-zinc-950';

export const cardClass =
  'bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 shadow-sm';

export const insetPanelClass =
  'bg-stone-100 dark:bg-zinc-800 rounded-2xl border border-stone-200 dark:border-zinc-800';

export const dividerClass = 'border-stone-200 dark:border-zinc-800';

/* ── Typography ───────────────────────────────────────────── */
export const pageTitleClass =
  'font-magilio text-4xl font-bold tracking-tight md:text-5xl';

export const sectionTitleClass =
  'font-magilio text-4xl font-bold tracking-tight sm:text-5xl';

export const sectionEyebrowClass =
  'mb-1 text-[13px] font-semibold text-stone-500 dark:text-zinc-400';

export const sectionSubtitleClass =
  'mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400';

export const cardTitleClass =
  'font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100';

export const statValueClass =
  'font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100';

export const statLabelClass =
  'text-[13px] font-semibold text-stone-500 dark:text-zinc-400';

export const mutedClass = 'text-[13px] text-stone-400 dark:text-zinc-500';

export const formLabelClass =
  'text-[13px] font-semibold text-stone-700 dark:text-zinc-200';

export const titleHighlightClass = 'text-mintcom-green';

/* ── Icon boxes (h-10 w-10 rounded-xl, icon size 19 / stroke 1.75) ── */
export const iconBoxNeutralClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300';

export const iconBoxGreenClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green';

/* ── Buttons (all rounded-xl = 12px) ──────────────────────── */
export const primaryButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110';

export const primaryButtonInlineClass =
  'inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110';

export const secondaryButtonClass =
  'inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900';

/** Marketing commit actions only (Get Started, Pay & Launch). */
export const greenCtaButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green py-3 text-sm font-semibold text-black transition-colors hover:bg-mintcom-green/90 active:scale-[0.98] disabled:opacity-50';

export const textLinkClass =
  'text-[13px] font-semibold text-stone-500 transition-colors hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100';

/* ── Inputs ───────────────────────────────────────────────── */
export const inputClass =
  'w-full rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500';

/* ── Segmented toggle (frame 12px, pills 8px) ─────────────── */
export const toggleFrameClass =
  'rounded-xl border border-stone-200 bg-white p-1 dark:border-zinc-800 dark:bg-transparent';

export const toggleActiveClass =
  'rounded-lg bg-stone-900 text-white dark:bg-mintcom-green dark:text-black';

export const toggleInactiveClass =
  'text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100';

/* ── Stock levels ─────────────────────────────────────────────
 * The inventory ok / low / out traffic-light system. These are PRODUCT
 * semantics, not decoration: the same three colors identify stock state on
 * the POS app and on printed shelf labels, so they are pinned to exact hex
 * values rather than mapped onto the Tailwind amber/red ramps, which would
 * shift the shade. Change a level's color here and every surface follows.
 *
 * Written as complete literal class strings on purpose: Tailwind scans source
 * text, so a class assembled by interpolation (`text-[${COLOR}]`) is never
 * generated and silently renders as nothing. The hex values are:
 *   ok  #1b6140 (dark: mintcom-green)
 *   low #ffc107 (dark: #f8b30a)
 *   out #D55263 (dark text: #b83749)
 *
 * design-token-exempt: pinned inventory traffic-light colors, see above
 */
export const stockLevel = {
  ok: {
    // design-token-exempt: pinned inventory color
    text: 'text-[#1b6140] dark:text-mintcom-green',
    // design-token-exempt: pinned inventory color
    badge: 'bg-mintcom-green/15 text-[#1b6140] dark:text-mintcom-green border border-mintcom-green/30',
  },
  low: {
    // design-token-exempt: pinned inventory color
    text: 'text-[#ffc107]',
    // design-token-exempt: pinned inventory color
    icon: 'text-amber-500 dark:text-[#f8b30a]',
    // design-token-exempt: pinned inventory color
    iconBox: 'bg-[#ffc107]/10 text-[#ffc107]',
    // design-token-exempt: pinned inventory color
    badge: 'bg-amber-500/15 text-amber-700 dark:text-[#f8b30a] border border-amber-500/30',
    // design-token-exempt: pinned inventory color
    cardSelected: 'border-[#ffc107]/50 ring-1 ring-[#ffc107]/30 bg-[#ffc107]/5',
    // design-token-exempt: pinned inventory color
    cardHover: 'hover:border-[#ffc107]/30',
    // design-token-exempt: pinned inventory color
    groupHoverText: 'group-hover:text-[#ffc107]',
  },
  out: {
    // design-token-exempt: pinned inventory color
    text: 'text-[#D55263]',
    // design-token-exempt: pinned inventory color
    icon: 'text-[#D55263]',
    // design-token-exempt: pinned inventory color
    iconBox: 'bg-[#D55263]/10 text-[#D55263]',
    // design-token-exempt: pinned inventory color
    badge: 'bg-[#D55263]/15 text-[#b83749] dark:text-[#D55263] border border-[#D55263]/30',
    // design-token-exempt: pinned inventory color
    chip: 'bg-[#D55263]/10 text-[#b83749] dark:text-[#D55263] border-[#D55263]/30',
    // design-token-exempt: pinned inventory color
    cardSelected: 'border-[#D55263]/50 ring-1 ring-[#D55263]/30 bg-[#D55263]/5',
    // design-token-exempt: pinned inventory color
    cardHover: 'hover:border-[#D55263]/30',
    // design-token-exempt: pinned inventory color
    groupHoverText: 'group-hover:text-[#D55263]',
  },
} as const;

/* ── Recharts ─────────────────────────────────────────────────
 * Recharts takes raw colors via props/inline style, so it cannot read the
 * Tailwind tokens above. These are the same stone/zinc ramp as hex, so charts
 * stay in the system — and follow the theme instead of hardcoding a white
 * tooltip that is unreadable in dark mode.
 *
 * Series colors are NOT here: those are semantic and belong to the chart.
 */
export const chartTheme = (isDark: boolean) => ({
  /** CartesianGrid stroke — stone-200 / zinc-800 */
  grid: isDark ? '#27272a' : '#e7e5e4',
  /** Axis tick labels — stone-500 / zinc-400 */
  tick: isDark ? '#a1a1aa' : '#78716c',
  /** Neutral fill for empty/placeholder slices — stone-200 / zinc-700 */
  emptyFill: isDark ? '#3f3f46' : '#e7e5e4',
  /** Spread onto <Tooltip contentStyle={...}> */
  tooltip: {
    backgroundColor: isDark ? 'rgba(24, 24, 27, 0.96)' : 'rgba(255, 255, 255, 0.98)',
    borderColor: isDark ? '#3f3f46' : '#e7e5e4',
    borderRadius: '12px',
    fontSize: '12px',
    boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
    color: isDark ? '#f4f4f5' : '#1c1917',
  },
});

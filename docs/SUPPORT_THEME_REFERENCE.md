# Support Theme Reference — Site-Wide Design System

This is the single reference for converting every screen to the **support-screen style**:
quiet, bordered cards on a warm background, one green accent, no gradients, no glow.

> Rule in one sentence: **white cards + stone borders + stone text, green only where
> it means something (primary CTA, active state, success status).**

---

## 1. Foundations

### Page background
| Mode  | Class |
|-------|-------|
| Light | `bg-cream-100` (`#FAF9F7`) |
| Dark  | `dark:bg-zinc-950` |

Full-page wrappers: `min-h-screen bg-cream-100 dark:bg-zinc-950`.
App shells/layouts use the same pair (never `bg-gray-50`, `bg-white`, `#050505`,
`#0F172A`, `#1E293B`, `mintcom-dark`).

### Fonts
| Use | Class |
|-----|-------|
| Page / section titles | `font-magilio ... tracking-tight` |
| Card titles | `font-barlow text-[17px] font-bold tracking-tight` |
| Body / everything else | `font-sans` (default) |

### Text colors
| Use | Light | Dark |
|-----|-------|------|
| Headings | `text-stone-900` | `dark:text-zinc-100` |
| Body / subtitles | `text-stone-500` (`text-[15px]`) | `dark:text-zinc-400` |
| Muted / meta / counts | `text-stone-400` (`text-[13px]`) | `dark:text-zinc-500` |
| Labels (form) | `text-stone-700` (`text-[13px] font-semibold`) | `dark:text-zinc-200` |

Never use `text-gray-*` / `dark:text-gray-*` / `dark:text-white` in converted screens.

---

## 2. Type scale

```html
<!-- Page title (support header) -->
<h1 class="font-magilio text-4xl font-bold tracking-tight md:text-5xl">
  Title <span class="text-mintcom-green">highlight</span> rest
</h1>

<!-- Section title -->
<h2 class="font-magilio text-4xl font-bold tracking-tight sm:text-5xl">
  Title <span class="text-mintcom-green">highlight</span>
</h2>

<!-- Section eyebrow above every h2 -->
<p class="mb-1 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">Badge</p>

<!-- Section subtitle -->
<p class="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">…</p>

<!-- Card title -->
<h3 class="font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100">…</h3>

<!-- Stat value -->
<p class="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">…</p>
```

Only **one** green word/phrase per title (`text-mintcom-green`).

---

## 3. Cards

### Standard card (lists, forms, content)
```html
<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
```
Padding may be `p-6` / `sm:p-8` for large cards. Never `rounded-3xl`,
`rounded-[2.5rem]`, `shadow-2xl`, `shadow-xl`.

### Stat / KPI card
```html
<div class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
  <div class="mb-3 flex items-center justify-between">
    <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
      <Icon size={19} strokeWidth={1.75} />
    </span>
  </div>
  <p class="text-[13px] font-semibold text-stone-500 dark:text-zinc-400">Label</p>
  <p class="mt-0.5 font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">Value</p>
</div>
```

### Feature card with "Learn more" (old layout behavior)
- No forced heights: **no** `min-h-[250px]`, no `min-h-[2.5rem]` title rows.
- Description `line-clamp-3`, title `line-clamp-2`.
- Divider above the footer: `mt-4 border-t border-stone-200 pt-3 dark:border-zinc-800`.

### Layout widths
- Marketing sections: `mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8`, headers `text-start`.
- Support-style narrow sections: `max-w-5xl` / `max-w-3xl`.
- Grids: `gap-3`. Sections: `py-12`. Never alternating `bg-cream-200` bands.

---

## 4. Icon boxes — the one rule with two flavors

| Context | Box | Icon |
|---------|-----|------|
| Marketing / support / public screens | `bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300` | `size={19} strokeWidth={1.75}` |
| Authenticated portal screens (owner/dashboard) | `bg-mintcom-green/10 text-mintcom-green` | same size |

Box size is always `h-10 w-10 rounded-xl` (small rows: `h-8 w-8 rounded-lg`,
tiny: `h-9 w-9`). **Never** rainbow boxes (`bg-blue-500/10`, `bg-amber-500/10`,
`bg-red-500/10`) — convert them to whichever flavor applies.

---

## 5. Buttons — exact blocks (copy-paste)

### Primary (stone light / green dark)
```html
<button class="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110">
```
Inline variant: `inline-flex ... px-5 py-2.5`.

### Secondary (outline)
```html
<button class="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
```

### Green CTA (marketing commit actions only: Get Started, Pay & Launch, Dashboard)
```html
<button class="flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green py-3 text-sm font-semibold text-black transition-colors hover:bg-mintcom-green/90 active:scale-[0.98] disabled:opacity-50">
```

### Segmented toggle (Monthly/Yearly, grid/list)
- Frame: `rounded-xl border border-stone-200 bg-white p-1 dark:border-zinc-800 dark:bg-transparent`
- Active pill: `rounded-lg bg-stone-900 text-white dark:bg-mintcom-green dark:text-black`
- Inactive: `text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100`
- **Inner radius (8px) is always smaller than the frame (12px).**

### Text links
`text-[13px] font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100`.
Green underline links only for legal/brand links (`text-mintcom-greenInk dark:text-mintcom-green`).

### Geometry rule
All action buttons: `rounded-xl` (12px) + `py-3` + `text-sm` + `font-semibold` + `gap-2`
+ icons `size={15}`. Same height ⇒ same perceived roundness. Small utility buttons
(copy/eye, `h-7`) also use `rounded-xl`.

---

## 6. Inputs

```html
<input class="w-full rounded-xl border border-stone-200 bg-white py-3 px-4 text-sm text-stone-900 placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500" />
```
Labels: `text-[13px] font-semibold text-stone-700 dark:text-zinc-200`.
Errors: `text-xs font-semibold text-red-500`. No `rounded-2xl` inputs, no
`bg-gray-50` / `bg-black/20` fields.

---

## 7. Badges & status — semantic colors STAY

Status pills, dots, "NEW" labels, trial banners keep their meaning colors:
`mintcom-green` (active/success), `amber-500` (trial/warning), `red-500`/`accent`
(error), `blue-500` only inside real product mock data. Only the *decorative*
rainbow icon boxes get neutralized — never status indicators.

---

## 8. Dividers, radius, motion

- Dividers: `border-stone-200 dark:border-zinc-800` (`divide-stone-100 dark:divide-zinc-800`
  inside cards, `border-t ... pt-3` card footers).
- Radius scale: buttons/inputs `rounded-xl` (12px) · cards `rounded-2xl` (16px) ·
  toggle pills/badges `rounded-lg` (8px) · dots/avatars `rounded-full`.
- Motion: `initial={{ opacity: 0, y: 12 }}` → animate, `duration: 0.45`,
  `viewport={{ once: true }}`. No springs, no pulse rings, no gradient blurs,
  no orbital decoration on chrome. (Device mockups and product art are exempt.)

---

## 9. Dark-mode conversion table

| Old (remove) | New (use) |
|---|---|
| `bg-gray-50`, `bg-gray-100` | `bg-stone-100` (box) / `bg-white` (card) |
| `border-gray-200`, `border-gray-100` | `border-stone-200`, `border-stone-100` |
| `text-gray-900/800/700/600/500/400/300` | `text-stone-900/800/700/600` · `text-stone-500` (body) · `text-stone-400` (muted) |
| `dark:bg-[#050505]`, `dark:bg-mintcom-dark`, `dark:bg-[#0F172A]` | `dark:bg-zinc-950` (page) |
| `dark:bg-[#1E293B]`, `dark:bg-[#121212]`, `dark:bg-[#0a0a0a]`, `dark:bg-black/20`, `dark:bg-white/5` | `dark:bg-zinc-900/60` (card) / `dark:bg-zinc-800` (box, toggle frame) |
| `dark:border-white/5`, `dark:border-white/10` | `dark:border-zinc-800` (card) / `dark:border-zinc-700` (small controls) |
| `dark:text-white`, `dark:text-gray-100/200/300/400` | `dark:text-zinc-100` (headings) / `dark:text-zinc-200` (labels) / `dark:text-zinc-400` (body) / `dark:text-zinc-500` (muted) |
| `dark:hover:bg-white/5`, `dark:hover:bg-white/10` | `dark:hover:bg-zinc-800`, `dark:hover:bg-zinc-700` |
| `hover:bg-gray-50/100/200`, `hover:text-gray-600/900` | `hover:bg-stone-50/100/200`, `hover:text-stone-600/900` |
| `rounded-3xl`, `rounded-[2.5rem]`, `rounded-[2rem]`, `rounded-[12px]` | `rounded-2xl` (cards), `rounded-xl` (buttons/inputs), `rounded-lg` (inner pills) |
| `shadow-2xl`, `shadow-xl`, `shadow-gray-200/*` | `shadow-sm` (or none dark: `dark:shadow-none`) |
| `bg-mintcom-green text-black` CTA (non-payment) | stone primary block (§5); keep green only for pay/commit CTAs |

---

## 10. Conversion recipe (per screen)

1. Page/shell background → `bg-cream-100 dark:bg-zinc-950`; delete ambient
   gradient blobs, grids, glow divs.
2. Headers → eyebrow + `font-magilio` title (one green span) + 15px subtitle.
3. Cards → §3 block; delete blur/gradient decor divs and `group-hover:scale`
   icon effects; icons → §4 box.
4. Buttons/inputs/toggles → exact §5/§6 blocks; unify CTA geometry
   (`py-3 text-sm font-semibold gap-2`, icons 15px).
5. Text/borders/dark classes → §9 table via search-replace, then
   `tsc + build + locale check`.

Verify: `npx tsc --noEmit -p tsconfig.app.json && npm run validate:locales:strict && npm run build`.

---

## 12. Changing the theme once (shared tokens)

`src/components/ui/theme.ts` is the single source of truth. `Card`, `Panel`,
`PageHeader`, `Button` (secondary/ghost), and the toggle tokens read from it —
edit a token there and every consumer follows. `FilterBar` faces mirror the
toggle tokens (they need `!` overrides, so keep them in sync manually).

Rules:
- Tokens must be **complete literal class strings**. Never concatenate
  (`'rounded-' + size`) — Tailwind only generates classes it can read verbatim.
- `Button` primary stays color-only (no layout in the variant) so header
  actions don't inherit `w-full`. The full `w-full` CTA block is
  `greenCtaButtonClass`, for pages to use directly.
- Selection semantics (`sharedStyles.ts` mint tints, status pills, role badges)
  are NOT theme tokens — they carry meaning, not branding.

## 13. Rollout tracker

| Area | Status |
|---|---|
| Landing (hero, features, cloud, admin, pricing, hardware, contact, feature cards, deep links) | ✅ done |
| Navbar (slim auth state, trial CTA, stone system) | ✅ done |
| Auth (login, signup, forgot, reset, verify, recovery) | ✅ done |
| Onboarding (all steps incl. subscription + completion) | ✅ done |
| Owner Overview | ✅ done (green portal icons) |
| Owner Establishments | ✅ done (neutral icons) |
| OwnerLayout shell background | ✅ done |
| Select Establishment (logo link) | ✅ done (link only) |
| Owner Brands (stats, cards, buttons, filters) | ✅ done (role badges kept semantic) |
| Owner Employees / Billing / Roles / Account / Merge (support cards + green icons) | ✅ done |
| Owner Notifications | ✅ done (already quiet, verified) |
| Dashboard + Brand portals | ⬜ pending |
| Shared `ui` primitives (Card, Panel, PageHeader, Button, FilterBar, sharedStyles) | ✅ done — all read from `ui/theme.ts` |
| `ui/theme.ts` single source of truth | ✅ done |
| Marketing pages (Pricing, Why, Industries, …) | ⬜ pending |
| Legal / misc pages | ⬜ pending |

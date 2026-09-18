const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/**
 * Legacy design tokens that must not appear in files covered by the design system.
 *
 * Each rule is checked per-line and reported by name, so a failure says *which*
 * legacy pattern was reintroduced rather than just dumping a regex match.
 *
 * Deliberately NOT banned:
 *  - `bg-black/N` and light-mode `bg-white/N` — used for backdrop scrims/overlays
 *    (paired with `backdrop-blur`), which are intentional effects, not surfaces.
 *  - Semantic colors (red/amber/orange/emerald) — they carry meaning.
 */
const RULES = [
  {
    name: 'gray-palette',
    hint: 'use stone-* (light) / zinc-* (dark)',
    re: /\bgray-(100|200|300|400|500|600|700|800|900)\b/,
  },
  {
    name: 'slate-palette',
    hint: 'use stone-* (light) / zinc-* (dark)',
    re: /\bslate-(50|100|200|300|400|500|600|700|800|900|950)\b/,
  },
  {
    name: 'rainbow-accent',
    hint: 'mintcom-green is the only decorative accent',
    re: /\b(indigo|pink|purple|violet|fuchsia|cyan|teal|sky)-(50|100|200|300|400|500|600|700|800|900|950)\b/,
  },
  {
    name: 'arbitrary-hex-color',
    hint: 'use a palette token, not a raw hex',
    re: /\b(bg|text|border|divide|ring|from|to|via|shadow|outline|decoration)-\[#[0-9a-fA-F]{3,8}\]/,
  },
  {
    name: 'dark-white-alpha-surface',
    hint: 'use dark:bg-zinc-900/60, dark:border-zinc-800, dark:divide-zinc-800',
    re: /\bdark:(?:[a-z-]+:)*(bg|border|divide|ring)-white\/(?:\[[^\]]+\]|\d+)/,
  },
  {
    name: 'divide-white-alpha',
    hint: 'use divide-stone-100 dark:divide-zinc-800',
    re: /\b(?:[a-z-]+:)*divide-white\/(?:\[[^\]]+\]|\d+)/,
  },
  {
    name: 'black-alpha-border',
    hint: 'use border-stone-200 dark:border-zinc-800',
    re: /\b(?:[a-z-]+:)*(border|divide|ring)-black\/(?:\[[^\]]+\]|\d+)/,
  },
  {
    name: 'dark:text-white',
    hint: 'use dark:text-zinc-100',
    re: /\bdark:text-white\b/,
  },
  {
    name: 'oversized-shadow',
    hint: 'use shadow-sm (cards) or shadow-md (popovers)',
    re: /\bshadow-2xl\b/,
  },
  {
    name: 'oversized-radius',
    hint: 'use rounded-2xl (cards) or rounded-xl (controls)',
    re: /\b(rounded-3xl|rounded-\[(?:\d|\.)+rem\])/,
  },
  {
    // Guards against find-and-replace damage during a token sweep: these are not
    // real Tailwind classes, so they silently render as nothing.
    name: 'malformed-palette-class',
    hint: 'not a real Tailwind class — check for a botched find-and-replace',
    re: /\b(?:bg|text|border|divide|ring|from|to|via)-(?:white|black)\d+|\b(?:stone|zinc|gray|slate|neutral)-(?:0|1000|\d{4,})\b/,
  },
  {
    // A stone/zinc utility must be followed by a real shade. A truncated sweep
    // pattern leaves things like `dark:border-zinc/5` or `dark:border-zinc-5`,
    // which no legacy rule above would ever match — the class is simply dropped
    // by Tailwind and the border silently disappears.
    name: 'truncated-palette-class',
    hint: 'stone/zinc utility with no valid shade — a sweep pattern was cut short',
    re: /\b(?:[a-z-]+:)*(?:bg|text|border|divide|ring|from|to|via)-(?:zinc|stone)(?!-(?:50|100|200|300|400|500|600|700|800|900|950)\b)[^\s"'`]*/,
  },
];

/**
 * Escape hatch, same semantics as `eslint-disable-next-line`: put
 * `design-token-exempt: <reason>` on the offending line or the line above it.
 * Use only where a raw value is genuinely correct (e.g. a spinner track that
 * must match a CTA's own text color), never to silence a real legacy token.
 */
const EXEMPT = /design-token-exempt/;

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectFiles(fullPath);
    }
    return entry.isFile() && /\.(tsx?|jsx?)$/.test(entry.name) ? [fullPath] : [];
  });
}

/**
 * Files held to the design system. Grow this list one area at a time — each
 * area added here is locked in and can no longer regress.
 */
const targetFiles = [
  ...collectFiles(path.join(ROOT, 'src', 'pages', 'owner')),
  ...collectFiles(path.join(ROOT, 'src', 'pages', 'brand')),
  path.join(ROOT, 'src', 'components', 'OwnerLayout.tsx'),
  path.join(ROOT, 'src', 'components', 'BrandLayout.tsx'),
  path.join(ROOT, 'src', 'components', 'DashboardLayout.tsx'),
  path.join(ROOT, 'src', 'components', 'ui', 'theme.ts'),
  path.join(ROOT, 'src', 'components', 'notifications', 'BackofficeAlertsView.tsx'),
  path.join(ROOT, 'src', 'components', 'notifications', 'AlertRow.tsx'),
  path.join(ROOT, 'src', 'components', 'ui', 'StatValue.tsx'),
  path.join(ROOT, 'src', 'components', 'ui', 'StatCard.tsx'),
];

const failures = [];

for (const file of targetFiles) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (EXEMPT.test(line) || (idx > 0 && EXEMPT.test(lines[idx - 1]))) return;
    for (const rule of RULES) {
      const match = rule.re.exec(line);
      if (match) {
        failures.push(
          `${path.relative(ROOT, file)}:${idx + 1}: [${rule.name}: "${match[0]}"] ${rule.hint}\n    ${line.trim()}`
        );
      }
    }
  });
}

if (failures.length > 0) {
  console.error(`❌ Found ${failures.length} legacy token match(es) in target files:`);
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `✅ Legacy token check passed (0 matches, ${RULES.length} rules across ${targetFiles.length} target files).`
);

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
    // Shade 50 included deliberately: `bg-gray-50` was the dashboard's page
    // canvas and slipped past this rule for the whole sweep.
    re: /\bgray-(50|100|200|300|400|500|600|700|800|900)\b/,
  },
  {
    name: 'slate-palette',
    hint: 'use stone-* (light) / zinc-* (dark)',
    re: /\bslate-(50|100|200|300|400|500|600|700|800|900|950)\b/,
  },
  {
    // The pre-redesign dark canvas. Still valid in the POS demo and marketing
    // surfaces (and in index.css for <body>), which are not guarded here — but
    // inside an app screen it means the page never got the new background.
    name: 'legacy-dark-canvas',
    hint: 'use dark:bg-zinc-950 (page) or dark:bg-zinc-900/60 (card)',
    re: /\b(?:[a-z-]+:)*bg-mintcom-dark\b/,
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
    // Catches a colour utility whose PALETTE NAME is not real — `text-endigo-600`
    // from a careless prefix replace. Tailwind drops it silently, and neither the
    // malformed nor the truncated rule sees it: the shade is valid, the name is
    // not. This rule is the generalisation of both.
    name: 'unknown-palette-name',
    hint: 'not a real palette — check for a botched find-and-replace',
    re: new RegExp(
      '\\b(?:[a-z-]+:)*!?(?:bg|text|border|divide|ring|from|to|via|shadow|outline|decoration|placeholder|caret|accent|fill|stroke)-' +
        '(?!(?:inherit|current|transparent|black|white|opacity|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|mintcom|cream|text|surface|brand)-)' +
        '[a-z]+-(?:50|100|200|300|400|500|600|700|800|900|950)\\b'
    ),
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
 * Files held to the design system.
 *
 * The ROOTS are the app surfaces. Everything they import, transitively, is
 * guarded too — because a clean screen rendering a legacy component is still a
 * legacy screen. That is not hypothetical: the dark-mode date filter kept its
 * slate-navy `dark:bg-[#1E293B]` through the entire sweep purely because
 * DateRangePicker sits at src/components/ and nobody thought to add it to a
 * hand-written list.
 *
 * Deriving the list from imports means adding a component to a guarded screen
 * guards it automatically. Marketing and POS-demo surfaces stay out simply by
 * not being reachable from these roots.
 */
const ROOTS = [
  ...collectFiles(path.join(ROOT, 'src', 'pages', 'owner')),
  ...collectFiles(path.join(ROOT, 'src', 'pages', 'brand')),
  ...collectFiles(path.join(ROOT, 'src', 'pages', 'support')),
  ...collectFiles(path.join(ROOT, 'src', 'pages', 'dashboard')),
  ...collectFiles(path.join(ROOT, 'src', 'components', 'dashboard')),
  ...collectFiles(path.join(ROOT, 'src', 'components', 'forms')),
  ...collectFiles(path.join(ROOT, 'src', 'components', 'layout')),
  ...collectFiles(path.join(ROOT, 'src', 'components', 'notifications')),
  ...collectFiles(path.join(ROOT, 'src', 'components', 'ui')),
  path.join(ROOT, 'src', 'components', 'OwnerLayout.tsx'),
  path.join(ROOT, 'src', 'components', 'BrandLayout.tsx'),
  path.join(ROOT, 'src', 'components', 'DashboardLayout.tsx'),
];

/** Resolve a relative import specifier to a file on disk. */
function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.normalize(path.join(path.dirname(fromFile), spec));
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ]) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function reachableFrom(roots) {
  const seen = new Set(roots.filter((f) => fs.existsSync(f)));
  let frontier = [...seen];
  while (frontier.length) {
    const next = [];
    for (const file of frontier) {
      for (const m of fs.readFileSync(file, 'utf8').matchAll(/from '([^']+)'/g)) {
        const resolved = resolveImport(file, m[1]);
        if (resolved && !seen.has(resolved)) {
          seen.add(resolved);
          next.push(resolved);
        }
      }
    }
    frontier = next;
  }
  // Only .tsx carries classNames; .ts modules are pulled in but have nothing to check.
  return [...seen].filter((f) => f.endsWith('.tsx'));
}

const targetFiles = reachableFrom(ROOTS);

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

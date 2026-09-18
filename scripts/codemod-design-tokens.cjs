/**
 * One-shot codemod: rewrite legacy Tailwind classes to the stone/zinc design system.
 *
 * Operates on WHOLE class tokens, never on substrings. A previous hand-written
 * substring sweep truncated classes mid-name (`dark:border-zinc/5`), producing
 * utilities Tailwind silently drops. Splitting on whitespace and rewriting each
 * complete token makes that failure mode structurally impossible.
 *
 * Usage: node scripts/codemod-design-tokens.cjs <path>... [--dry]
 */
const fs = require('fs');
const path = require('path');

const SHADES = '(?:50|100|200|300|400|500|600|700|800|900|950)';

/** Exact whole-token rewrites, tried before the pattern rules. */
const EXACT = {
  // Dark surface hexes (slate-800/900 and near-blacks) -> zinc ramp
  'dark:bg-[#1E293B]': 'dark:bg-zinc-900/60',
  'dark:bg-[#1e293b]': 'dark:bg-zinc-900/60',
  'bg-[#1E293B]': 'bg-zinc-900/60',
  'dark:bg-[#0F172A]': 'dark:bg-zinc-900',
  'dark:bg-[#0f172a]': 'dark:bg-zinc-900',
  'dark:bg-[#0D0D0D]': 'dark:bg-zinc-900/60',
  'dark:bg-[#050505]': 'dark:bg-zinc-950',
  'dark:bg-[#0A0A0A]': 'dark:bg-zinc-900',
  'dark:bg-[#111111]': 'dark:bg-zinc-900',
  'dark:border-[#0A0A0A]': 'dark:border-zinc-900',

  // Oversized geometry
  'shadow-2xl': 'shadow-md',
  'rounded-3xl': 'rounded-2xl',

  // dark:text-white -> zinc-100
  'dark:text-white': 'dark:text-zinc-100',
  'dark:group-hover:text-white': 'dark:group-hover:text-zinc-100',
  'dark:hover:text-white': 'dark:hover:text-zinc-100',
  'dark:group-hover/sidebar:text-white': 'dark:group-hover/sidebar:text-zinc-100',
};

/**
 * Pattern rules. Each receives the full token and returns a replacement or null.
 * `variants` is everything before the utility (e.g. "dark:hover:"), so a rule can
 * tell a light-mode class from a dark-mode one.
 */
const RULES = [
  // rounded-[Nrem] -> rounded-2xl
  {
    name: 'radius',
    test: (tok) => /^rounded-\[(?:\d|\.)+rem\]$/.test(tok),
    apply: () => 'rounded-2xl',
  },

  // Faded white text (separators, disabled glyphs) -> zinc, not a white alpha.
  {
    name: 'white-alpha-text',
    test: (tok) => /^(?:[a-z-]+:)*!?text-white\/(?:\[[^\]]+\]|\d+)$/.test(tok),
    apply: (tok) => {
      const [, variants, bang, alpha] = tok.match(
        /^((?:[a-z-]+:)*)(!?)text-white\/(\[[^\]]+\]|\d+)$/
      );
      const numeric = alpha.startsWith('[') ? parseFloat(alpha.slice(1, -1)) : Number(alpha) / 100;
      // Very faint white text is a separator/placeholder, not body copy.
      const shade = numeric <= 0.2 ? '700' : numeric <= 0.5 ? '500' : '300';
      return `${variants}${bang}text-zinc-${shade}`;
    },
  },

  // White-alpha surfaces -> zinc. Very low alpha reads as a subtle row tint.
  {
    name: 'white-alpha',
    test: (tok) => /^(?:[a-z-]+:)*!?(?:bg|border|divide|ring)-white\/(?:\[[^\]]+\]|\d+)$/.test(tok),
    apply: (tok) => {
      const [, variants, bang, util, alpha] = tok.match(
        /^((?:[a-z-]+:)*)(!?)(bg|border|divide|ring)-white\/(\[[^\]]+\]|\d+)$/
      );
      if (util === 'border' || util === 'divide' || util === 'ring') {
        return `${variants}${bang}${util}-zinc-800`;
      }
      // bg: an alpha at or below 0.03 is a row tint, anything more is a surface
      const numeric = alpha.startsWith('[') ? parseFloat(alpha.slice(1, -1)) : Number(alpha) / 100;
      return numeric <= 0.03 ? `${variants}${bang}bg-zinc-800/40` : `${variants}${bang}bg-zinc-800`;
    },
  },

  // Black-alpha borders -> zinc/stone border
  {
    name: 'black-alpha-border',
    test: (tok) => /^(?:[a-z-]+:)*(?:border|divide|ring)-black\/(?:\[[^\]]+\]|\d+)$/.test(tok),
    apply: (tok) => {
      const [, variants, util] = tok.match(/^((?:[a-z-]+:)*)(border|divide|ring)-black\/(?:.+)$/);
      return `${variants}${util}-${variants.includes('dark:') ? 'zinc-800' : 'stone-200'}`;
    },
  },

  // gray/slate/neutral -> stone (light) or zinc (dark), same shade
  {
    name: 'palette',
    test: (tok) => new RegExp(`^(?:[a-z-/]+:)*!?[a-z-]+-(?:gray|slate|neutral)-${SHADES}(?:\\/(?:\\[[^\\]]+\\]|\\d+))?$`).test(tok),
    apply: (tok) => {
      const m = tok.match(
        new RegExp(`^((?:[a-z-/]+:)*)(!?)([a-z-]+)-(?:gray|slate|neutral)-(${SHADES})(\\/(?:\\[[^\\]]+\\]|\\d+))?$`)
      );
      if (!m) return null;
      const [, variants, bang, util, shade, alpha = ''] = m;
      const ramp = variants.includes('dark:') ? 'zinc' : 'stone';
      return `${variants}${bang}${util}-${ramp}-${shade}${alpha}`;
    },
  },
];

function rewriteToken(tok) {
  if (Object.prototype.hasOwnProperty.call(EXACT, tok)) return { out: EXACT[tok], rule: 'exact' };
  for (const rule of RULES) {
    if (rule.test(tok)) {
      const out = rule.apply(tok);
      if (out && out !== tok) return { out, rule: rule.name };
    }
  }
  return null;
}

function processFile(file, counts, dry) {
  const src = fs.readFileSync(file, 'utf8');
  let changed = 0;

  // Split on whitespace and JSX/string delimiters so each piece is a whole token.
  const out = src.replace(/[^\s"'`{}()<>,;=]+/g, (tok) => {
    if (tok.includes('design-token-exempt')) return tok;
    const res = rewriteToken(tok);
    if (!res) return tok;
    counts[res.rule] = (counts[res.rule] || 0) + 1;
    changed++;
    return res.out;
  });

  if (changed && !dry) fs.writeFileSync(file, out);
  return changed;
}

function collect(target) {
  const st = fs.statSync(target);
  if (st.isFile()) return [target];
  return fs.readdirSync(target, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(target, e.name);
    return e.isDirectory() ? collect(full) : /\.(tsx?|jsx?)$/.test(e.name) ? [full] : [];
  });
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const targets = args.filter((a) => a !== '--dry');
if (!targets.length) {
  console.error('usage: node scripts/codemod-design-tokens.cjs <path>... [--dry]');
  process.exit(1);
}

const counts = {};
let files = 0;
let total = 0;
for (const t of targets) {
  for (const f of collect(t)) {
    const n = processFile(f, counts, dry);
    if (n) {
      files++;
      total += n;
    }
  }
}

console.log(`${dry ? '[dry] ' : ''}${total} class token(s) rewritten across ${files} file(s)`);
Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([r, n]) => console.log(`  ${String(n).padStart(5)}  ${r}`));

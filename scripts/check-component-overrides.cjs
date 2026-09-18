/**
 * Guards shared UI components against having their own layout overridden at the
 * call site.
 *
 * This is the spacing counterpart to check-legacy-tokens.cjs. Same failure
 * shape, different property: a shared component exists, call sites pass
 * className utilities that beat its internal ones, the component stops being
 * the source of truth, and the dialogs/grids drift apart.
 *
 * The case this was written for: ten dialogs each set their own ModalBody
 * padding — pt-10, pt-8 sm:pt-10, pt-6 sm:pt-8, pt-0, pt-2 — so the same modal
 * kit produced anything from content jammed against the header divider to a
 * 40px void, and ModalBody's own py-5 was close to decorative.
 *
 * Escape hatch: `design-token-exempt: <reason>` on the tag's line or the one
 * above it — the same marker the token checker uses, so there is one convention
 * to remember.
 *
 * Adding a component here is cheap; do it whenever a component owns a piece of
 * layout that call sites keep re-deciding.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const GUARDS = [
  {
    component: 'ModalBody',
    owns: 'vertical padding',
    // The component sets py-5; call sites may still choose horizontal padding.
    re: /^(?:[a-z-]+:)*!?(?:py|pt|pb)-/,
    hint: 'ModalBody sets py-5 — drop the override so every dialog matches',
  },
  {
    component: 'ModalFooter',
    owns: 'padding',
    re: /^(?:[a-z-]+:)*!?p[xytb]?-/,
    hint: 'ModalFooter owns its padding band (px-6 sm:px-8 / pt-4 / pb-4)',
  },
  {
    component: 'ModalHeader',
    owns: 'padding',
    re: /^(?:[a-z-]+:)*!?p[xytb]?-/,
    hint: 'ModalHeader owns its padding band (px-6 sm:px-8 / py-4 sm:py-5)',
  },
  {
    component: 'StatCardGrid',
    owns: 'grid columns and gap',
    // `columns` is a prop (2-5). A grid-cols-* here fights the component and is
    // resolved by Tailwind's CSS source order, not by the order you wrote them.
    re: /^(?:[a-z-]+:)*!?(?:grid-cols-|gap-)/,
    hint: 'use the `columns` prop; a grid-cols-* override is resolved by CSS order, not yours',
  },
];

/** `design-token-exempt: <reason>` on this line or the previous one. */
const EXEMPT = /design-token-exempt/;

function collectFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectFiles(full);
    return entry.isFile() && /\.(tsx|jsx)$/.test(entry.name) ? [full] : [];
  });
}

/** Pull the class tokens out of a className="..." or className={`...`} attribute. */
function classTokens(openingTag) {
  const out = [];
  for (const m of openingTag.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
    const raw = m[1] ?? m[2] ?? '';
    // Drop ${...} interpolations: those are composed tokens, not literal utilities.
    for (const tok of raw.replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) {
      if (tok) out.push(tok);
    }
  }
  return out;
}

const failures = [];
const files = collectFiles(path.join(ROOT, 'src'));

for (const file of files) {
  const source = fs.readFileSync(file, 'utf8');
  const lines = source.split(/\r?\n/);

  for (const guard of GUARDS) {
    const tagRe = new RegExp(`<${guard.component}\\b[^>]*?>`, 'gs');
    for (const match of source.matchAll(tagRe)) {
      const tag = match[0];
      if (!tag.includes('className')) continue;

      const lineNo = source.slice(0, match.index).split('\n').length;
      const idx = lineNo - 1;
      if (EXEMPT.test(lines[idx] || '') || EXEMPT.test(lines[idx - 1] || '')) continue;

      const offenders = classTokens(tag).filter((t) => guard.re.test(t));
      if (offenders.length) {
        failures.push(
          `${path.relative(ROOT, file)}:${lineNo}: [${guard.component} owns ${guard.owns}] ` +
            `${guard.hint}\n    overriding: ${offenders.join(' ')}`
        );
      }
    }
  }
}

if (failures.length) {
  console.error(`❌ Found ${failures.length} component layout override(s):`);
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `✅ Component override check passed (0 overrides, ${GUARDS.length} guards across ${files.length} files).`
);

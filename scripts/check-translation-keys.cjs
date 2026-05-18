/**
 * Static analyzer that scans the codebase for translation key usages and
 * verifies every literal key actually exists in en.json and ar.json.
 *
 * It catches the class of bug where a developer ships
 *   t('orders.reports.items.totalSales')
 * but the key doesn't exist, so users see the raw "orders.reports.items.totalSales"
 * string instead of a translated value.
 *
 * Severity:
 *   - "critical" -> t('a.b.c') with no defaultValue. Renders the literal key
 *                   to the user. Fails the build.
 *   - "warning"  -> t('a.b.c', 'Fallback') or t('a.b.c', { defaultValue: ... }).
 *                   The user sees the fallback (English) instead of a localized
 *                   value, which is wrong but not raw-key bad. Reported only.
 *
 * Run with: node scripts/check-translation-keys.cjs
 *           node scripts/check-translation-keys.cjs --strict   (fail on warnings too)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const EN_PATH = path.join(SRC, 'i18n', 'locales', 'en.json');
const AR_PATH = path.join(SRC, 'i18n', 'locales', 'ar.json');

const STRICT = process.argv.includes('--strict');

function flatten(obj, prefix) {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

const en = JSON.parse(fs.readFileSync(EN_PATH, 'utf8'));
const ar = JSON.parse(fs.readFileSync(AR_PATH, 'utf8'));
const enFlat = flatten(en, '');
const arFlat = flatten(ar, '');

const PLURAL_SUFFIXES = ['_zero', '_one', '_two', '_few', '_many', '_other'];

function keyExists(key, flatMap) {
  if (Object.prototype.hasOwnProperty.call(flatMap, key)) return true;
  for (const suffix of PLURAL_SUFFIXES) {
    if (Object.prototype.hasOwnProperty.call(flatMap, key + suffix)) return true;
  }
  for (const suffix of PLURAL_SUFFIXES) {
    if (key.endsWith(suffix)) {
      const base = key.slice(0, -suffix.length);
      if (Object.prototype.hasOwnProperty.call(flatMap, base)) return true;
    }
  }
  // The key may resolve to a sub-tree (returnObjects) — treat any prefix match as valid.
  const prefix = key + '.';
  for (const existing of Object.keys(flatMap)) {
    if (existing.startsWith(prefix)) return true;
  }
  return false;
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__' || entry.name === 'test') {
        return [];
      }
      return walk(full);
    }
    if (!entry.isFile()) return [];
    if (!/\.(ts|tsx)$/.test(entry.name)) return [];
    if (/\.test\.(ts|tsx)$/.test(entry.name)) return [];
    if (/\.spec\.(ts|tsx)$/.test(entry.name)) return [];
    return [full];
  });
}

// Capture the call: function name, key string, and a peek at what comes after
// (so we can detect whether a defaultValue fallback was provided).
//
// Group 1: key
// Group 2: rest of arguments up to the closing paren of the t() call (best-effort)
const KEY_LITERAL_REGEX = /(?:\bi18n(?:ext)?\.t|\bt|\.t)\(\s*['"]([A-Za-z][A-Za-z0-9_.:]*)['"]\s*([^)]{0,300})\)/g;

const files = walk(SRC);
const critical = [];
const warnings = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  let match;
  while ((match = KEY_LITERAL_REGEX.exec(content)) !== null) {
    const key = match[1];
    const rest = match[2] || '';
    const cleanKey = key.includes(':') ? key.split(':').slice(1).join(':') : key;
    if (!cleanKey.includes('.')) continue; // not an i18n path

    const inEn = keyExists(cleanKey, enFlat);
    const inAr = keyExists(cleanKey, arFlat);

    if (inEn && inAr) continue;

    const lineNumber = content.slice(0, match.index).split(/\r?\n/).length;
    const lineText = (lines[lineNumber - 1] || '').trim();

    // Detect a fallback in the call:
    //   t('a.b', 'fallback')                  -> string second arg
    //   t('a.b', { defaultValue: '...' })     -> options with defaultValue
    //   t('a.b', { defaultValue: '...', ... }) -> same
    const hasStringFallback = /^,\s*['"`]/.test(rest);
    const hasOptionsFallback = /defaultValue\s*:/.test(rest);
    const hasFallback = hasStringFallback || hasOptionsFallback;

    const issue = {
      file: path.relative(ROOT, file).replace(/\\/g, '/'),
      line: lineNumber,
      key: cleanKey,
      missingIn: [!inEn && 'en', !inAr && 'ar'].filter(Boolean).join(' & '),
      snippet: lineText.length > 200 ? lineText.slice(0, 197) + '...' : lineText,
    };

    if (hasFallback) warnings.push(issue);
    else critical.push(issue);
  }
}

function printIssue(issue) {
  console.log(`  ${issue.file}:${issue.line}`);
  console.log(`    key:        ${issue.key}`);
  console.log(`    missing in: ${issue.missingIn}`);
  console.log(`    > ${issue.snippet}`);
  console.log('');
}

if (critical.length > 0) {
  console.log('\n[CRITICAL] Translation keys used without a defaultValue fallback');
  console.log('These will render the raw key (e.g. "orders.reports.items.totalSales")');
  console.log('to the user at runtime. Add the key to en.json and ar.json, or fix the path.\n');
  for (const issue of critical) printIssue(issue);
}

if (warnings.length > 0) {
  console.log('\n[WARNING] Translation keys missing from JSON but with a defaultValue fallback');
  console.log('These render the English fallback in every language, including Arabic.');
  console.log('Add proper translations to en.json and ar.json.\n');
  for (const issue of warnings) printIssue(issue);
}

console.log(`\nSummary: ${critical.length} critical, ${warnings.length} warnings (${files.length} files scanned).`);

if (critical.length > 0) process.exit(1);
if (STRICT && warnings.length > 0) process.exit(1);

const fs = require('fs');
const path = require('path');

// Load en.json
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));

// Flatten the JSON object to dot-notation keys
function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? prefix + '.' + key : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey));
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

const flatKeys = flatten(en);

// Find all .tsx and .ts files
function findFiles(dir, ext, results = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', 'dist', '.git'].includes(entry.name)) {
      findFiles(fullPath, ext, results);
    } else if (entry.isFile() && ext.some(e => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

const files = findFiles('src', ['.tsx', '.ts']);

// Extract t() calls with optional fallback values
const missingKeys = new Map(); // key -> { files: [], fallback: string|null, context: string }

// Match t('key.path') or t('key.path', 'fallback') or t('key.path', { defaultValue: 'xxx' })
const tCallRegex = /\bt\(\s*['"]([a-zA-Z][a-zA-Z0-9_.]+\.[a-zA-Z0-9_.]+)['"]\s*(?:,\s*['"]([^'"]*)['"]\s*)?\)/g;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  // Reset lastIndex
  tCallRegex.lastIndex = 0;
  while ((match = tCallRegex.exec(content)) !== null) {
    const key = match[1];
    const fallback = match[2] || null;

    if (key.includes('/') || key.startsWith('./') || key.startsWith('../')) continue;
    if (key.includes('px') || key.includes('rem')) continue;

    if (!flatKeys.hasOwnProperty(key)) {
      if (!missingKeys.has(key)) {
        missingKeys.set(key, { files: [], fallback: null, context: '' });
      }
      const entry = missingKeys.get(key);
      const relPath = path.relative('src', file).replace(/\\/g, '/');
      if (!entry.files.includes(relPath)) {
        entry.files.push(relPath);
      }
      if (fallback && !entry.fallback) {
        entry.fallback = fallback;
      }
    }
  }
}

// Generate English values from key names
function generateEnglishValue(key) {
  const parts = key.split('.');
  const lastPart = parts[parts.length - 1];

  // Convert camelCase to spaced words with first letter capitalized
  const words = lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_]/g, ' ')
    .trim();

  // Capitalize first letter
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Build the nested object from flat keys
function unflatten(flatObj) {
  const result = {};
  for (const [key, value] of Object.entries(flatObj)) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

// Generate values for all missing keys
const missingFlat = {};
const sorted = [...missingKeys.entries()].sort((a, b) => a[0].localeCompare(b[0]));

for (const [key, info] of sorted) {
  if (info.fallback) {
    missingFlat[key] = info.fallback;
  } else {
    missingFlat[key] = generateEnglishValue(key);
  }
}

// Output as JSON
const nested = unflatten(missingFlat);
console.log(JSON.stringify(nested, null, 2));

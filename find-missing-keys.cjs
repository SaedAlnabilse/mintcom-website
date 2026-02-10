const fs = require('fs');

function flatten(obj, prefix) {
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

const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('src/i18n/locales/ar.json', 'utf8'));
const enFlat = flatten(en, '');
const arFlat = flatten(ar, '');

const missing = Object.keys(enFlat).filter(k => !arFlat.hasOwnProperty(k));

// Group by top-level section
const groups = {};
for (const k of missing) {
  const section = k.split('.').slice(0, 2).join('.');
  if (!groups[section]) groups[section] = [];
  groups[section].push(k);
}

for (const [section, keys] of Object.entries(groups).sort()) {
  console.log(`\n--- ${section} (${keys.length}) ---`);
  for (const k of keys.slice(0, 3)) {
    console.log(`  ${k}: ${JSON.stringify(enFlat[k]).substring(0, 60)}`);
  }
  if (keys.length > 3) console.log(`  ... and ${keys.length - 3} more`);
}
console.log(`\nTotal missing: ${missing.length}`);

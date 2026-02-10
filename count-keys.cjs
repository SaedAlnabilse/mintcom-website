const fs = require('fs');

function count(obj) {
  let c = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      c += count(v);
    } else {
      c++;
    }
  }
  return c;
}

const ar = JSON.parse(fs.readFileSync('src/i18n/locales/ar.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
console.log('AR keys:', count(ar));
console.log('EN keys:', count(en));

// Find keys in EN but not in AR
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

const enFlat = flatten(en, '');
const arFlat = flatten(ar, '');
const missing = Object.keys(enFlat).filter(k => !arFlat.hasOwnProperty(k));
console.log('Keys in EN missing from AR:', missing.length);

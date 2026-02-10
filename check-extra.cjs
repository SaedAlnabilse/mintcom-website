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

const en = flatten(JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8')), '');
const ar = flatten(JSON.parse(fs.readFileSync('src/i18n/locales/ar.json', 'utf8')), '');

// Keys in AR not in EN
const extra = Object.keys(ar).filter(k => !(k in en));
console.log('Keys in AR but not in EN:', extra.length);
extra.forEach(k => console.log('  ' + k + ': ' + JSON.stringify(ar[k]).substring(0, 60)));

// Keys in EN not in AR
const missing = Object.keys(en).filter(k => !(k in ar));
console.log('\nKeys in EN but not in AR:', missing.length);
missing.forEach(k => console.log('  ' + k + ': ' + JSON.stringify(en[k]).substring(0, 60)));

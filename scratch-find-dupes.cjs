const fs = require('fs');
const content = fs.readFileSync('src/i18n/locales/en.json', 'utf8');
const keys = [];
const regex = /^  "([^"]+)":/gm;
let match;
while ((match = regex.exec(content)) !== null) {
  keys.push(match[1]);
}
const duplicates = keys.filter((e, i, a) => a.indexOf(e) !== i);
console.log('Duplicates:', duplicates);

const fs = require('fs');
const content = fs.readFileSync('src/i18n/locales/en.json', 'utf8');

// Find all occurrences of "overview": { within the owner block
const ownerIdx = content.indexOf('"owner": {');
const ownerSection = content.slice(ownerIdx, ownerIdx + 2000);

// Find all overview occurrences
let idx = 0;
while (true) {
  const found = content.indexOf('"overview":', idx);
  if (found === -1) break;
  const lineNum = content.slice(0, found).split('\n').length;
  console.log(`"overview" at line ${lineNum}: ${content.slice(found, found + 60)}`);
  idx = found + 1;
}

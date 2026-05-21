const fs = require('fs');
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
console.log('Keys of en.owner:', Object.keys(en.owner || {}));
console.log('Type of en.owner:', typeof en.owner);
if (en.owner) console.log('Keys of en.owner.overview:', en.owner.overview ? Object.keys(en.owner.overview) : 'undefined');

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/pages/SelectEstablishmentPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('--- BEFORE ---');
const match = content.match(/cancelText\s*=\s*AppStrings\.COMMON\.CANCEL/);
console.log(match ? `Match found: '${match[0]}'` : 'No match found');

if (match) {
    content = content.replace(/cancelText\s*=\s*(AppStrings\.[\w\.]+)/g, 'cancelText={$1}');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('--- AFTER ---');
    console.log(content.match(/cancelText\s*=\s*\{AppStrings\.COMMON\.CANCEL\}/) ? 'Fixed!' : 'Failed to fix!');
}

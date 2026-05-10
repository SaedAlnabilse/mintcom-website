const fs = require('fs');
const path = require('path');

const localeDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const suspiciousPattern = /[ÃÂâØÙ]/;

function collectJsonFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      return collectJsonFiles(fullPath);
    }

    return entry.isFile() && entry.name.endsWith('.json') ? [fullPath] : [];
  });
}

const failures = [];

for (const file of collectJsonFiles(localeDir)) {
  const content = fs.readFileSync(file, 'utf8');
  const jsonContent = content.replace(/^\uFEFF/, '');
  JSON.parse(jsonContent);

  content.split(/\r?\n/).forEach((line, index) => {
    if (suspiciousPattern.test(line)) {
      failures.push(`${path.relative(process.cwd(), file)}:${index + 1}: ${line.trim()}`);
    }
  });
}

if (failures.length > 0) {
  console.error('Suspicious mojibake characters found in locale files:');
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Locale encoding check passed.');

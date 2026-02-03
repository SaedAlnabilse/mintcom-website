const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Pattern: prop = AppStrings.CHAIN
    // We want to wrap it: prop={AppStrings.CHAIN}
    
    // We will use a function replacer to log what's happening
    const fixProp = (prop) => {
        const regex = new RegExp(`(${prop})\s*=\s*(AppStrings\.[\w\.]+)`, 'g');
        if (regex.test(content)) {
            console.log(`Match found for ${prop} in ${filePath}`);
            content = content.replace(regex, '$1={$2}');
        }
    };

    const propsToFix = ['cancelText', 'confirmText', 'message', 'title', 'label'];
    propsToFix.forEach(fixProp);

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed props in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        walkDir(filePath);
      }
    } else if (file.endsWith('.tsx')) {
      processFile(filePath);
    }
  });
}

console.log('Starting debug props fix...');
walkDir(path.join(process.cwd(), 'src'));
console.log('Done.');

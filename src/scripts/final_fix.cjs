const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    const propsToFix = ['cancelText', 'confirmText', 'message', 'title', 'label'];
    
    propsToFix.forEach(prop => {
        // We use a fresh regex for each replacement to avoid state issues
        // We capture the prop name and the value chain
        const regex = new RegExp(`(${prop})\s*=\s*(AppStrings\.[\w\.]+)`, 'g');
        content = content.replace(regex, '$1={$2}');
    });

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

console.log('Starting final props fix...');
walkDir(path.join(process.cwd(), 'src'));
console.log('Done.');


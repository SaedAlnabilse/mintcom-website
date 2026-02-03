const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Fix: initialData ? {AppStrings.X} : {AppStrings.Y} -> initialData ? AppStrings.X : AppStrings.Y
    // Pattern: : {AppStrings.X} -> : AppStrings.X
    content = content.replace(/:\s*{AppStrings\.([^}]+)}/g, ': AppStrings.$1');
    
    // Pattern: ? {AppStrings.X} -> ? AppStrings.X
    content = content.replace(/\?\s*{AppStrings\.([^}]+)}/g, '? AppStrings.$1');

    // Fix: label: {AppStrings.X} -> label: AppStrings.X
    content = content.replace(/label:\s*{AppStrings\.([^}]+)}/g, 'label: AppStrings.$1');

    // Fix: message = {AppStrings.X} -> message = AppStrings.X (default param)
    content = content.replace(/message\s*=\s*{AppStrings\.([^}]+)}/g, 'message = AppStrings.$1');
    
    // Fix: confirmText = {AppStrings.X} -> confirmText = AppStrings.X (default param in destructuring/args)
    content = content.replace(/Text\s*=\s*{AppStrings\.([^}]+)}/g, 'Text = AppStrings.$1');

    // Fix: !== {AppStrings.X}
    content = content.replace(/!==\s*{AppStrings\.([^}]+)}/g, '!== AppStrings.$1');
    
    // Fix: === {AppStrings.X}
    content = content.replace(/===\s*{AppStrings\.([^}]+)}/g, '=== AppStrings.$1');

    // Fix: || {AppStrings.X}
    content = content.replace(/\|\|\s*{AppStrings\.([^}]+)}/g, '|| AppStrings.$1');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed syntax in: ${filePath}`);
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
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

console.log('Starting syntax fix...');
walkDir(path.join(process.cwd(), 'src'));
console.log('Done.');

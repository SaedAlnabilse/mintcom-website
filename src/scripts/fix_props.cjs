const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Fix: prop = AppStrings.X -> prop={AppStrings.X}
    // We look for: word = AppStrings.CHAIN
    // This catches JSX props mostly. It might catch some JS assignments, but wrapping a JS assignment 
    // x = {AppStrings.X} is just assigning an object with a property value which isn't what we want?
    // No, {AppStrings.X} in JS expression context means an object with key AppStrings... wait.
    // {AppStrings.X} is invalid object literal syntax unless it's { key: AppStrings.X }.
    // BUT {AppStrings} is valid shorthand. {AppStrings.X} is SyntaxError.
    
    // So `x = {AppStrings.X}` is syntactically invalid JS.
    // `x = AppStrings.X` is valid JS.
    // `prop={AppStrings.X}` is valid JSX.
    // `prop=AppStrings.X` is invalid JSX (unless string literal).
    
    // So the previous script broke JSX. JS assignments `x = AppStrings.X` are fine.
    // I need to identify JSX context. That's hard with regex.
    // However, the error locations are specific.
    
    // Strategy: Look for `word = AppStrings.X` that is NOT preceded by `const`, `let`, `var`.
    // And generally JSX props are on new lines or separated by spaces. 
    
    // Let's rely on the specific errors reported:
    // cancelText = ...
    // message = ...
    // confirmText = ...
    
    const propsToFix = ['cancelText', 'confirmText', 'message', 'title', 'label'];
    
    propsToFix.forEach(prop => {
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

console.log('Starting props fix...');
walkDir(path.join(process.cwd(), 'src'));
console.log('Done.');

const fs = require('fs');
const path = require('path');

const replacements = [
  // Common
  { pattern: /['"]Loading\.\.\.['"]/g, replacement: 'AppStrings.COMMON.LOADING' },
  { pattern: /['"]No results found['"]/g, replacement: 'AppStrings.COMMON.NO_RESULTS' },
  { pattern: /['"]Save['"]/g, replacement: 'AppStrings.COMMON.SAVE' },
  { pattern: /['"]Cancel['"]/g, replacement: 'AppStrings.COMMON.CANCEL' },
  { pattern: /['"]Delete['"]/g, replacement: 'AppStrings.COMMON.DELETE' },
  { pattern: /['"]Edit['"]/g, replacement: 'AppStrings.COMMON.EDIT' },
  { pattern: /['"]Add['"]/g, replacement: 'AppStrings.COMMON.ADD' },
  { pattern: /['"]Confirm['"]/g, replacement: 'AppStrings.COMMON.CONFIRM' },
  
  // Status
  { pattern: /['"]Active['"]/g, replacement: 'AppStrings.STATUS.ACTIVE' },
  { pattern: /['"]Inactive['"]/g, replacement: 'AppStrings.STATUS.INACTIVE' },
  { pattern: /['"]Online['"]/g, replacement: 'AppStrings.STATUS.ONLINE' },
  { pattern: /['"]Offline['"]/g, replacement: 'AppStrings.STATUS.OFFLINE' },
];

function processFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let hasChanges = false;

    // Check if AppStrings is already imported
    const hasImport = content.includes('import { AppStrings }');

    replacements.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, (match) => {
          // Avoid replacing if it's already part of AppStrings or in a comment/key
          // This is a naive check, but helps avoid some issues.
          // Better would be AST, but regex is faster for this bulk task.
          return `{${replacement}}`; // Wrap in braces for JSX usage mostly
        });
        hasChanges = true;
      }
    });

    // Fix double braces if they occurred {{AppStrings...}} -> {AppStrings...}
    content = content.replace(/{{(AppStrings\.[^}]+)}}/g, '{$1}');
    
    // Fix props assignment: prop={AppStrings...} -> prop={AppStrings...} (already correct)
    // Fix string props: prop="AppStrings..." -> prop={AppStrings...}
    content = content.replace(/="{(AppStrings\.[^}]+)}"/g, '={$1}');

    if (hasChanges && content !== originalContent) {
      if (!hasImport) {
        // Add import at the top
        const importStatement = "import { AppStrings } from '../../constants/AppStrings';\n"; // Adjust path logic needed
        // Simpler: assume we fix imports later or add a relative path helper
        // For now, let's just log it or add it if we know the depth.
        // Let's rely on the user or a second pass to fix imports, 
        // OR add it now based on file depth.
        
        const depth = filePath.split(path.sep).length - 1; // src/components/File.tsx -> depth from root
        // root is C:\...\src...
        // We need path relative to src/constants/AppStrings.ts
        
        // Quick hack: Just add it, TS will complain, I can fix it.
        // Actually, let's try to calculate it.
        let relativePath = path.relative(path.dirname(filePath), path.join(process.cwd(), 'src', 'constants', 'AppStrings'));
        relativePath = relativePath.replace(/\\/g, '/');
        if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
        
        content = `import { AppStrings } from '${relativePath}';\n` + content;
      }
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated: ${filePath}`);
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
      // Limit scope for safety
      if (filePath.includes('pages') || filePath.includes('components')) {
         processFile(filePath);
      }
    }
  });
}

console.log('Starting text standardization...');
walkDir(path.join(process.cwd(), 'src'));
console.log('Done.');

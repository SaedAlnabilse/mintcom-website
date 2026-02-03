const fs = require('fs');
const path = require('path');

const files = [
    'src/components/forms/ProductFormModal.tsx',
    'src/components/OwnerLayout.tsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Fix cancelText = ...
    content = content.replace(/cancelText\s*=\s*(AppStrings\.[\w\.]+)/g, 'cancelText={$1}');
    
    // Fix confirmText = ...
    content = content.replace(/confirmText\s*=\s*(AppStrings\.[\w\.]+)/g, 'confirmText={$1}');
    
    // Fix message = ...
    content = content.replace(/message\s*=\s*(AppStrings\.[\w\.]+)/g, 'message={$1}');
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed ${file}`);
    } else {
        console.log(`No fix needed for ${file}`);
    }
});

const fs = require('fs');
const path = require('path');

const filesToFix = [
    'src/components/forms/ProductFormModal.tsx',
    'src/components/OwnerLayout.tsx',
    'src/pages/SelectEstablishmentPage.tsx'
];

const propsToFix = ['cancelText', 'confirmText', 'message', 'title', 'label'];

filesToFix.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;
        
        propsToFix.forEach(prop => {
            const regex = new RegExp(`(${prop})\s*=\s*(AppStrings\.[\w\.]+)`, 'g');
            content = content.replace(regex, '$1={$2}');
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed: ${file}`);
        } else {
            console.log(`No changes needed for: ${file}`);
        }
    } else {
        console.error(`File not found: ${file}`);
    }
});

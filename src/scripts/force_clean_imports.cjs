const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/dashboard/OrdersPage.tsx',
    'src/pages/dashboard/StaffPage.tsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove all existing imports of SearchInput/SelectInput (global replace)
    content = content.replace(/import\s*{\s*(SearchInput|SelectInput)(?:,\s*(SearchInput|SelectInput))?\s*}\s*from\s*['"].*?['"](;|)/g, '');
    
    // Remove empty lines that might have been left behind (consecutive newlines)
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Add correct import at the top
    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
            lastImportIdx = i;
        }
    }
    
    const newImport = "import { SearchInput, SelectInput } from '../../components/ui';";
    
    if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, newImport);
    } else {
        lines.unshift(newImport);
    }
    
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Cleaned imports in ${file}`);
});

const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/dashboard/CustomersPage.tsx',
    'src/pages/dashboard/MaterialsPage.tsx',
    'src/pages/dashboard/ProductsPage.tsx',
    'src/pages/dashboard/RecipesPage.tsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if SelectInput is used in the body (excluding import line)
    // We split lines, find import, exclude it, check rest.
    const lines = content.split('\n');
    let isUsed = false;
    
    lines.forEach(line => {
        if (!line.trim().startsWith('import') && line.includes('SelectInput')) {
            isUsed = true;
        }
    });
    
    if (!isUsed) {
        // Replace "import { SearchInput, SelectInput } ..." with "import { SearchInput } ..."
        content = content.replace(/import { SearchInput, SelectInput } from/g, 'import { SearchInput } from');
        // Also handle reversed order just in case
        content = content.replace(/import { SelectInput, SearchInput } from/g, 'import { SearchInput } from');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Removed unused SelectInput from ${file}`);
    }
});

const fs = require('fs');
const path = require('path');

function addImport(content, importLine) {
    if (content.includes(importLine.trim())) return content;
    
    // Check if we have the components/ui import already
    if (importLine.includes('../../components/ui')) {
        if (content.includes("from '../../components/ui'")) {
            // Modify existing
            // This is complex, easier to just remove and re-add via regex if not perfect
            return content; // Assume handled by previous scripts or logic below
        }
    }

    const lines = content.split('\n');
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
            lastImportIdx = i;
        }
    }
    
    if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, importLine);
    } else {
        lines.unshift(importLine);
    }
    return lines.join('\n');
}

function restoreLucideIcon(content, iconName) {
    if (content.includes(`import { ${iconName},`)) return content;
    if (content.includes(`, ${iconName} }`)) return content;
    if (content.includes(`, ${iconName},`)) return content;
    
    // Add to lucide-react import
    return content.replace(/} from 'lucide-react';/, `, ${iconName} } from 'lucide-react';`);
}

const pages = [
    'src/pages/dashboard/ProductsPage.tsx',
    'src/pages/dashboard/MaterialsPage.tsx',
    'src/pages/dashboard/CustomersPage.tsx',
    'src/pages/dashboard/RecipesPage.tsx'
];

pages.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Clean up broken imports first (lines starting with import that are indented)
    // content = content.replace(/^\s+import .*$/gm, ''); // Dangerous if code uses import in comments? 
    // Better: remove specific broken lines
    content = content.replace(/^\s+import { SearchInput.*$/gm, '');
    content = content.replace(/^\s+import { SelectInput.*$/gm, '');
    
    // Add UI import
    // Check if file uses SelectInput
    const usesSelect = content.includes('<SelectInput') || content.includes('SelectInput');
    const importStr = usesSelect 
        ? "import { SearchInput, SelectInput } from '../../components/ui';"
        : "import { SearchInput } from '../../components/ui';";
        
    // Remove any existing top-level ui import to avoid dupes before adding
    content = content.replace(/^import {.*} from '\.\.\/\.\.\/components\/ui';/gm, '');
    
    content = addImport(content, importStr);
    
    // ProductsPage needs Search icon
    if (file.includes('ProductsPage')) {
        content = restoreLucideIcon(content, 'Search');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed ${file}`);
});

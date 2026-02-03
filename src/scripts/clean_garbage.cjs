const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/dashboard/CustomersPage.tsx',
    'src/pages/dashboard/MaterialsPage.tsx',
    'src/pages/dashboard/OrdersPage.tsx',
    'src/pages/dashboard/ProductsPage.tsx',
    'src/pages/dashboard/RecipesPage.tsx',
    'src/pages/dashboard/StaffPage.tsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Remove the garbage lines I accidentally inserted
    // Pattern: import { SearchInput } ... followed by comments ... followed by In the render:
    // This is hard to regex exactly because of newlines.
    // But I can remove specific lines.
    
    const linesToRemove = [
        "import { SearchInput } from '../../components/ui/SearchInput';",
        "import { SelectInput } from '../../components/ui/SelectInput';",
        "// ... (keep other imports, remove Search if unused, or keep if used elsewhere)",
        "// ... (keep existing imports)",
        "// ...",
        "// In the render:",
        "import { SearchInput } from '../../components/ui';" // If I changed it via fix_imports
    ];
    
    // We split by line and filter
    let lines = content.split('\n');
    lines = lines.filter(line => {
        const trimmed = line.trim();
        // Remove if it matches any garbage line exactly or is the specific import we want to move
        if (linesToRemove.includes(trimmed)) return false;
        // Also remove if it is the combined import in the middle of file (indented)
        if (trimmed.startsWith("import { SearchInput") && line.startsWith(" ")) return false;
        return true;
    });
    
    // 2. Add proper import at the top
    // Find the last import
    let lastImportIdx = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
            lastImportIdx = i;
        }
    }
    
    if (lastImportIdx !== -1) {
        lines.splice(lastImportIdx + 1, 0, "import { SearchInput, SelectInput } from '../../components/ui';");
    } else {
        lines.unshift("import { SearchInput, SelectInput } from '../../components/ui';");
    }
    
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Cleaned ${file}`);
});

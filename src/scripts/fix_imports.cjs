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
    
    // Fix imports to use index
    content = content.replace(/import { SearchInput } from '..\/..\/components\/ui\/SearchInput';/g, "import { SearchInput } from '../../components/ui';");
    content = content.replace(/import { SelectInput } from '..\/..\/components\/ui\/SelectInput';/g, "import { SelectInput } from '../../components/ui';");
    
    // Combine if both exist
    if (content.includes("import { SearchInput } from '../../components/ui';") && content.includes("import { SelectInput } from '../../components/ui';")) {
        content = content.replace("import { SearchInput } from '../../components/ui';", "import { SearchInput, SelectInput } from '../../components/ui';");
        content = content.replace("import { SelectInput } from '../../components/ui';", "");
    }

    // Remove unused imports (naive removal, assuming they are on their own line or I can remove the word)
    // Error log says: 'Search' is declared but never read.
    // We should remove 'Search' from the import list.
    
    // Remove 'Search' from 'lucide-react'
    content = content.replace(/(import {[^}]*)\bSearch,?\s*([^}]*} from 'lucide-react';)/, '$1$2');
    content = content.replace(/(import {[^}]*)\bSearch\b\s*}/, '$1}'); // if last
    
    // Remove 'SingleSelect' import if not used (SelectInput used instead)
    // But SelectInput wraps SingleSelect, so pages using SelectInput might not need SingleSelect unless they use it directly?
    // The error log said 'SingleSelect' is declared but never read in OrdersPage and StaffPage.
    content = content.replace(/import { SingleSelect } from '..\/..\/components\/SingleSelect';\s*/g, '');
    
    // Remove 'CustomDatePicker' if unused (OrdersPage)
    // Error log said: 'CustomDatePicker' is declared but never read.
    // Wait, OrdersPage uses CustomDatePicker in the date range group?
    // "src/pages/dashboard/OrdersPage.tsx:26:1 - error TS6133: 'CustomDatePicker' is declared but its value is never read."
    // Did I accidentally remove the usage?
    // In my previous replace for OrdersPage:
    /*
          {/* Quick Date Select ... }
          <div className="flex-1 ...">
            <SelectInput ... />
          </div>

          {/* Date Range Group ... }
          <div className="hidden sm:block ...">
             ...
                    <CustomDatePicker ... />
             ...
          </div>
    */
    // I kept the Date Range Group in the `old_string`?
    // No, I replaced the *entire* filter deck in `OrdersPage.tsx` in one go?
    // Let's check `OrdersPage` content again. If I replaced the whole block, I might have removed CustomDatePicker usage if I didn't include it in the new string.
    // My replace string for OrdersPage was mostly "Search Bar", "Quick Date Select", "Status", "Payment".
    // I might have overwritten the "Date Range Group" part or put it back?
    // Looking at my `OrdersPage` replace call...
    // I replaced:
    /*
          {/* Search Bar ... }
          <div ...> <SearchInput ... /> </div>

          {/* Quick Date Select ... }
          <div ...> <SelectInput ... /> </div>

          {/* Vertical Divider ... }
    */
    // The "Date Range Group" (the one with CustomDatePicker) was IN BETWEEN Quick Date Select and Vertical Divider in the original code.
    // In my `new_string`, I had:
    /*
          {/* Search Bar ... }
          ...
          {/* Quick Date Select ... }
          ...
          {/* Status & Payment filters ... }
    */
    // I MISSED the Date Range Group in the `new_string`! I accidentally deleted it.
    // That explains why `CustomDatePicker` is unused.
    
    // I need to restore the Date Range Group in OrdersPage.tsx.
    
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Fixed imports and unused variables.');

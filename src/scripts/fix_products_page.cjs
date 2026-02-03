const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/pages/dashboard/ProductsPage.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix the lucide-react import
// Current state likely: ... ChevronRight,\n, Search } from ...
// We want: ... ChevronRight,\n Search } from ...

content = content.replace(/ChevronRight,\s*,\s*Search/s, 'ChevronRight,\n    Search');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed ProductsPage imports');

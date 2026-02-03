const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/DashboardLayout.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/confirmText\s*=\s*(AppStrings\.[\w\.]+)/g, 'confirmText={$1}');
content = content.replace(/cancelText\s*=\s*(AppStrings\.[\w\.]+)/g, 'cancelText={$1}');

fs.writeFileSync(filePath, content, 'utf8');
console.log(`Fixed DashboardLayout.tsx`);

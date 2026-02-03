const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/DashboardLayout.tsx');
const content = fs.readFileSync(filePath, 'utf8');

console.log("--- Snippet ---");
const snippet = content.match(/message\s*=\s*AppStrings\.[\w\.]+/);
console.log(snippet ? snippet[0] : "No match found for snippet");
console.log("--- End Snippet ---");

if (snippet) {
    const newContent = content.replace(/message\s*=\s*(AppStrings\.[\w\.]+)/g, 'message={$1}');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Wrote file.");
}

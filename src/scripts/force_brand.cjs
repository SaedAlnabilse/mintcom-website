const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/components/BrandLayout.tsx');
if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    const regex = /cancelText\s*=\s*AppStrings\.[\w\.]+/g;
    if (regex.test(content)) {
        console.log("Found match in BrandLayout.tsx");
        const newContent = content.replace(/cancelText\s*=\s*(AppStrings\.[\w\.]+)/g, 'cancelText={$1}');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log("Fixed BrandLayout.tsx");
    } else {
        console.log("No match in BrandLayout.tsx");
    }
} else {
    console.log("BrandLayout.tsx not found");
}

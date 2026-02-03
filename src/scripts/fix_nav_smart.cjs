const fs = require('fs');
const path = require('path');

const files = [
    'src/pages/dashboard/CategoriesPage.tsx',
    'src/pages/dashboard/EstablishmentsPage.tsx',
    'src/pages/dashboard/MaterialsPage.tsx',
    'src/pages/dashboard/RecipesPage.tsx',
    'src/pages/dashboard/ReportsPage.tsx',
    'src/pages/dashboard/DashboardPage.tsx',
    'src/components/forms/ProductFormModal.tsx'
];

files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Ensure useParams is imported
    if (!content.includes('useParams')) {
        content = content.replace(/import {([^}]*)} from 'react-router-dom';/, (match, inner) => {
            if (inner.includes('useParams')) return match;
            return `import {${inner}, useParams } from 'react-router-dom';`;
        });
        
        // If not found in existing import (e.g. strict format), try adding it
        if (!content.includes('useParams')) {
             // Fallback: try to find a line with react-router-dom that didn't match the simple regex
             // or just replace 'useNavigate' which is likely there
             content = content.replace('useNavigate', 'useNavigate, useParams');
        }
    }
    
    // 2. Add locationSlug extraction
    // Look for component start: export function Name() {
    // Insert after the first brace.
    if (!content.includes('const { locationSlug }')) {
        content = content.replace(/(export function \w+\s*\({?[^)]*}?\)\s*{)/, '$1\n  const { locationSlug } = useParams();');
    }
    
    // 3. Fix navigate calls
    // Replace navigate('/dashboard/XYZ'...) with navigate(`/dashboard/${locationSlug}/XYZ`...)
    // Need to handle quotes carefully.
    
    // Case 1: Single quotes
    content = content.replace(/navigate\('\/dashboard\/([^']+)'/g, 'navigate(`/dashboard/${locationSlug}/$1`');
    
    // Case 2: Double quotes
    content = content.replace(/navigate\("\/dashboard\/([^"]+)"/g, 'navigate(`/dashboard/${locationSlug}/$1`');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated navigation in ${file}`);
});

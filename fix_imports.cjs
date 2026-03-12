const fs = require('fs');

const files = [
  'src/components/DashboardLayout.tsx',
  'src/components/OwnerLayout.tsx',
  'src/components/BrandLayout.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('import { MobileAppModal }')) {
    content = "import { MobileAppModal } from './MobileAppModal';\n" + content;
  }
  
  fs.writeFileSync(file, content, 'utf8');
});

// Fix OwnerLayout remaining QR Code
let ownerContent = fs.readFileSync('src/components/OwnerLayout.tsx', 'utf8');
const ownerIndex = ownerContent.indexOf('{/* QR Code Popup */}');
if (ownerIndex !== -1) {
  const beforeStr = ownerContent.substring(0, ownerIndex);
  const startIdx = beforeStr.lastIndexOf('<div className="relative group">');
  
  if (startIdx !== -1) {
    let depth = 0;
    let endIdx = -1;
    let i = startIdx;
    
    while (i < ownerContent.length) {
      if (ownerContent.substring(i, i + 4) === '<div') {
        depth++;
        i += 4;
      } else if (ownerContent.substring(i, i + 5) === '</div') {
        depth--;
        i += 5;
        if (depth === 0) {
          endIdx = i + 1;
          break;
        }
      } else {
        i++;
      }
    }
    
    if (endIdx !== -1) {
      // It's the settings menu popup
      const replacement = `<button
                            onClick={() => {
                              setSettingsMenuOpen(false);
                              setMobileAppModalOpen(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                          >
                            <Smartphone size={18} />
                            <span>{t('owner.menu.getMobileApp')}</span>
                          </button>`;
                          
      ownerContent = ownerContent.substring(0, startIdx) + replacement + ownerContent.substring(endIdx);
      fs.writeFileSync('src/components/OwnerLayout.tsx', ownerContent, 'utf8');
      console.log('Fixed OwnerLayout popup');
    }
  }
}

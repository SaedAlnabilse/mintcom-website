const fs = require('fs');

function replaceQRPopup(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let index;

  // Add import and state if missing
  if (!content.includes('MobileAppModal')) {
    content = content.replace(/(import .* from 'lucide-react';)/, "$1\nimport { MobileAppModal } from './MobileAppModal';");
  }
  if (!content.includes('mobileAppModalOpen')) {
    content = content.replace(/(const \[sidebarOpen.*?;)/, "const [mobileAppModalOpen, setMobileAppModalOpen] = useState(false);\n  $1");
  }

  while ((index = content.indexOf('{/* QR Code Popup */}')) !== -1) {
    // Find the starting `<div className="relative group">` before this index
    const beforeStr = content.substring(0, index);
    const startIdx = beforeStr.lastIndexOf('<div className="relative group">');
    if (startIdx === -1) break;

    // Find the end of this div by balancing tags
    let depth = 0;
    let endIdx = -1;
    let i = startIdx;
    
    while (i < content.length) {
      if (content.substring(i, i + 4) === '<div') {
        depth++;
        i += 4;
      } else if (content.substring(i, i + 5) === '</div') {
        depth--;
        i += 5;
        if (depth === 0) {
          endIdx = i + 1; // include the '>'
          break;
        }
      } else {
        i++;
      }
    }

    if (endIdx === -1) break;

    // We found the block to replace
    const block = content.substring(startIdx, endIdx);

    // Determine what kind of button it was based on the text
    let tKey = block.match(/t\('([^']+)'\)/);
    let translationKey = tKey ? tKey[1] : 'dashboard.menu.getMobileApp';

    let replacement = '';
    
    if (block.includes('w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50')) {
      // Sidebar button
      replacement = `<button onClick={() => setMobileAppModalOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                <Smartphone size={16} className="text-gray-400" />
                <span className="text-sm font-bold">{t('${translationKey}')}</span>
              </button>`;
    } else if (block.includes('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold')) {
      // OwnerLayout Sidebar button
      replacement = `<button onClick={() => setMobileAppModalOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left">
                                    <Smartphone size={16} className="text-gray-400" />
                                    <span>{t('${translationKey}')}</span>
                                </button>`;
    } else {
      // Settings menu button
      replacement = `<button
                            onClick={() => {
                              setSettingsMenuOpen(false);
                              setMobileAppModalOpen(true);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                          >
                            <Smartphone size={18} />
                            <span>{t('${translationKey}')}</span>
                          </button>`;
    }

    content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  }

  if (!content.includes('<MobileAppModal')) {
    content = content.replace(/(<\/div>\s*)$/, `
      <MobileAppModal 
        isOpen={mobileAppModalOpen} 
        onClose={() => setMobileAppModalOpen(false)} 
      />
    $1`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

const files = [
  'src/components/DashboardLayout.tsx',
  'src/components/OwnerLayout.tsx',
  'src/components/BrandLayout.tsx'
];

files.forEach(replaceQRPopup);
console.log('Done replacing tags!');

const fs = require('fs');
const path = require('path');
const p = path.join('c:\\Users\\USER\\Desktop\\Mintcom\\MintcomWebsite\\src\\pages\\dashboard');

const regex1 = /<div className="flex items-center gap-3 mb-2">[\s\S]*?<div className="flex items-center gap-2">[\s\S]*?<div className="relative flex h-2 w-2">[\s\S]*?<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mintcom-green opacity-75"><\/span>[\s\S]*?<span className="relative inline-flex rounded-full h-2 w-2 bg-mintcom-green"><\/span>[\s\S]*?<\/div>[\s\S]*?<span className="text-xs font-bold text-mintcom-green tracking-widest\">\{t\('dashboard\.shiftStatus\.live'\)\}<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>\s*/g;

const regex2 = /<div className="flex items-center gap-2 sm:gap-3 mb-2">[\s\S]*?<div className="flex items-center gap-2">[\s\S]*?<div className="relative flex h-2 w-2">[\s\S]*?<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mintcom-green opacity-75"><\/span>[\s\S]*?<span className="relative inline-flex rounded-full h-2 w-2 bg-mintcom-green"><\/span>[\s\S]*?<\/div>[\s\S]*?<span className="text-xs font-bold text-mintcom-green tracking-widest\">\{t\('dashboard\.shiftStatus\.live'\)\}<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>\s*/g;

let count = 0;
fs.readdirSync(p).forEach(f => {
  if (f.endsWith('.tsx')) {
    let fp = path.join(p, f);
    let c = fs.readFileSync(fp, 'utf8');
    
    // Ignore DashboardPage, do it manually since it has conditions
    if (f === 'DashboardPage.tsx') {
        return;
    }

    let changed = false;
    if (regex1.test(c)) {
       c = c.replace(regex1, '');
       changed = true;
    }
    if (regex2.test(c)) {
       c = c.replace(regex2, '');
       changed = true;
    }
    
    if (changed) {
       fs.writeFileSync(fp, c);
       console.log('Removed from ' + f);
       count++;
    }
  }
});
console.log('Total dashboard files processed: ' + count);

// Search owner pages too
const ownerPath = path.join('c:\\Users\\USER\\Desktop\\Mintcom\\MintcomWebsite\\src\\pages\\owner');
if (fs.existsSync(ownerPath)) {
  fs.readdirSync(ownerPath).forEach(f => {
    if (f.endsWith('.tsx')) {
      let fp = path.join(ownerPath, f);
      let c = fs.readFileSync(fp, 'utf8');
      
      let changed = false;
      if (regex1.test(c)) {
         c = c.replace(regex1, '');
         changed = true;
      }
      if (regex2.test(c)) {
         c = c.replace(regex2, '');
         changed = true;
      }
      
      if (changed) {
         fs.writeFileSync(fp, c);
         console.log('Removed from owner ' + f);
         count++;
      }
    }
  });
}

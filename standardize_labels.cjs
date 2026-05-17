const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, "/", file));
    }
  });

  return arrayOfFiles;
}

const files = getAllFiles(srcDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.jsx'));

const replacements = [
  // 1. text-xs font-black text-gray-400 tracking-widest -> label-strong
  {
    regex: /text-xs font-black text-gray-400 tracking-widest/g,
    replacement: 'label-strong font-outfit'
  },
  // 4. text-xs font-black tracking-widest text-gray-400 -> label-strong
  {
    regex: /text-xs font-black tracking-widest text-gray-400/g,
    replacement: 'label-strong font-outfit'
  },
  // 2. text-xs font-black text-mintcom-green tracking-widest -> label-strong text-mintcom-green
  {
    regex: /text-xs font-black text-mintcom-green tracking-widest/gi,
    replacement: 'label-strong font-outfit text-mintcom-green'
  },
  // 3. text-xs font-black tracking-widest text-mintcom-green -> label-strong text-mintcom-green
  {
    regex: /text-xs font-black tracking-widest text-mintcom-green/gi,
    replacement: 'label-strong font-outfit text-mintcom-green'
  },
  // Variant with Mintcom capital (found in grep)
  {
    regex: /text-xs font-black text-Mintcom-green tracking-widest/gi,
    replacement: 'label-strong font-outfit text-mintcom-green'
  },
  {
    regex: /text-xs font-black tracking-widest text-Mintcom-green/gi,
    replacement: 'label-strong font-outfit text-mintcom-green'
  },
  // 5. Any remaining "text-xs font-black tracking-widest" with "label-strong"
  {
    regex: /text-xs font-black tracking-widest/g,
    replacement: 'label-strong font-outfit'
  }
];

// Additional variants found in grep that might need care:
// "text-gray-400 text-xs font-black tracking-widest"
const extraReplacements = [
    {
        regex: /text-gray-400 text-xs font-black tracking-widest/g,
        replacement: 'label-strong font-outfit'
    },
    {
        regex: /text-mintcom-green text-xs font-black tracking-widest/gi,
        replacement: 'label-strong font-outfit text-mintcom-green'
    }
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(r => {
    content = content.replace(r.regex, r.replacement);
  });
  
  extraReplacements.forEach(r => {
      content = content.replace(r.regex, r.replacement);
  });

  // Cleanup: if we end up with double spaces or something similar
  // e.g. className="label-strong  other-class"
  // content = content.replace(/  +/g, ' '); 
  // Actually, let's be careful with global space replacement.
  // Better to just ensure no triple spaces were created.

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
  }
});

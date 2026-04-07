const fs = require('fs');
const path = require('path');

const enPath = path.resolve('src/i18n/locales/en.json');
const arPath = path.resolve('src/i18n/locales/ar.json');
const chatbotPath = path.resolve('src/data/chatbotKnowledge.ts');
const faqPath = path.resolve('src/data/faq.ts');
const recipesPagePath = path.resolve('src/pages/dashboard/RecipesPage.tsx');

// Helper for en.json
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// 1. Replace "Inventory" values with "Recipe operations"
// 2. Replace "Inventory Management" with "Recipe operations"
// 3. Replace "Manage stock levels and suppliers" with "View and update recipes and ingredients"

function updateEn(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      // Order matters: replace longer specific phrases first
      obj[key] = obj[key].replace(/Inventory Management/g, 'Recipe operations');
      obj[key] = obj[key].replace(/Inventory Control/g, 'Recipe operations');
      obj[key] = obj[key].replace(/Manage stock levels and suppliers/g, 'View and update recipes and ingredients');
      obj[key] = obj[key].replace(/Track your stock levels/g, 'View and update recipes and ingredients');
      
      // Generic "Inventory" but be careful with "Inventory Manager" -> "Recipe operations manager"
      obj[key] = obj[key].replace(/Inventory Manager/g, 'Recipe operations manager');
      
      // "Inventory" as a standalone word or part of phrase
      // If it's just "Inventory", change to "Recipe operations"
      if (obj[key] === "Inventory") {
          obj[key] = "Recipe operations";
      }
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      updateEn(obj[key]);
    }
  }
}

updateEn(en);
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf8');

// Helper for ar.json
let ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

function updateAr(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/إدارة المخزون/g, 'إدارة عمليات الوصفات');
      obj[key] = obj[key].replace(/التحكم في المخزون/g, 'عمليات الوصفات');
      obj[key] = obj[key].replace(/إدارة مستويات المخزون والموردين/g, 'عرض وتحديث الوصفات والمكونات');
      obj[key] = obj[key].replace(/تتبع مستويات المخزون/g, 'عرض وتحديث الوصفات والمكونات');
      obj[key] = obj[key].replace(/إدارة المخزون الخاص بك/g, 'عرض وتحديث الوصفات والمكونات');
      
      if (obj[key] === "المخزون") {
          obj[key] = "عمليات الوصفات";
      }
      
      // Descriptions
      obj[key] = obj[key].replace(/مراقبة المبيعات والمخزون وأداء الموظفين/g, 'مراقبة المبيعات وعمليات الوصفات وأداء الموظفين');
      obj[key] = obj[key].replace(/تتبع المواد الخام والمخزون/g, 'تتبع المواد الخام والوصفات');
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      updateAr(obj[key]);
    }
  }
}

updateAr(ar);
fs.writeFileSync(arPath, JSON.stringify(ar, null, 2), 'utf8');

// chatbotKnowledge.ts and faq.ts (Regex based)
let chatbot = fs.readFileSync(chatbotPath, 'utf8');
chatbot = chatbot.replace(/Inventory control/g, 'Recipe operations');
chatbot = chatbot.replace(/Inventory/g, 'Recipe operations');
chatbot = chatbot.replace(/مراقبة المخزون/g, 'عمليات الوصفات');
chatbot = chatbot.replace(/المخزون/g, 'عمليات الوصفات');
fs.writeFileSync(chatbotPath, chatbot, 'utf8');

let faq = fs.readFileSync(faqPath, 'utf8');
faq = faq.replace(/inventory management/g, 'recipe operations');
faq = faq.replace(/Inventory management/g, 'Recipe operations');
faq = faq.replace(/inventory/g, 'recipe operations');
faq = faq.replace(/Inventory/g, 'Recipe operations');
faq = faq.replace(/إدارة المخزون/g, 'إدارة عمليات الوصفات');
faq = faq.replace(/المخزون/g, 'عمليات الوصفات');
fs.writeFileSync(faqPath, faq, 'utf8');

// RecipesPage.tsx
let recipesPage = fs.readFileSync(recipesPagePath, 'utf8');
// Replace hardcoded defaults in t() if any
// t('inventory.materials', {defaultValue: 'Ingredients'}) -> No change needed
// t('inventory.messages.removeTitle', {defaultValue: 'Remove Ingredient'}) -> No "Inventory" in value
// The prompt said: check 'src/pages/dashboard/RecipesPage.tsx' for hardcoded default values in t() calls and update them to "Recipe operations"
// I didn't see many with "Inventory" in values but let's check carefully.
recipesPage = recipesPage.replace(/defaultValue: 'Inventory'/g, "defaultValue: 'Recipe operations'");
recipesPage = recipesPage.replace(/defaultValue: 'Inventory Management'/g, "defaultValue: 'Recipe operations'");
fs.writeFileSync(recipesPagePath, recipesPage, 'utf8');

console.log('Replacements completed.');

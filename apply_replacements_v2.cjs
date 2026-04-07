const fs = require('fs');
const path = require('path');

const enPath = path.resolve('src/i18n/locales/en.json');
const arPath = path.resolve('src/i18n/locales/ar.json');
const chatbotPath = path.resolve('src/data/chatbotKnowledge.ts');
const faqPath = path.resolve('src/data/faq.ts');

function updateFile(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [oldStr, newStr] of Object.entries(replacements)) {
        const regex = new RegExp(oldStr, 'g');
        content = content.replace(regex, newStr);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

const enReplacements = {
    "Inventory Management": "Recipe operations",
    "Inventory Control": "Recipe operations",
    "Manage stock levels and suppliers": "View and update recipes and ingredients",
    "Track your stock levels": "View and update recipes and ingredients",
    "Menu items and inventory": "View and update recipes and ingredients",
    "Manage your recipes and prep operations": "View and update recipes and ingredients",
    "Track stock levels, manage raw materials, and receive low-stock alerts.": "View and update recipes and ingredients",
    "Inventory Manager": "Recipe operations manager",
    "Inventory system": "Recipe operations system",
    "Inventory System": "Recipe operations system",
    "Inventory Guide": "Recipe operations guide",
    "\"Inventory\"": "\"Recipe operations\"",
    "\"Inventory.\"": "\"Recipe operations.\""
};

const arReplacements = {
    "إدارة المخزون": "إدارة عمليات الوصفات",
    "التحكم في المخزون": "عمليات الوصفات",
    "إدارة مستويات المخزون والموردين": "عرض وتحديث الوصفات والمكونات",
    "تتبع مستويات المخزون": "عرض وتحديث الوصفات والمكونات",
    "إدارة المخزون الخاص بك": "عرض وتحديث الوصفات والمكونات",
    "أصناف القائمة والمخزون": "عرض وتحديث الوصفات والمكونات",
    "إدارة المنتجات ومستويات المخزون": "إدارة المنتجات وعمليات الوصفات",
    "تحديث مستويات المخزون من نقاط البيع": "تحديث عمليات الوصفات من نقاط البيع",
    "إعادة تعبئة المخزون": "تحديث الوصفات",
    "إنشاء تقارير مفصلة عن المبيعات والمخزون": "إنشاء تقارير مفصلة عن المبيعات وعمليات الوصفات",
    "تتبع مستويات المخزون في الوقت الحقيقي": "تتبع عمليات الوصفات في الوقت الحقيقي",
    "إعداد تنبيهات المخزون المنخفض": "إعداد تنبيهات الوصفات المنخفضة",
    "نظام المخزون": "نظام عمليات الوصفات",
    "مدير المخزون": "مدير عمليات الوصفات",
    "\"المخزون\"": "\"عمليات الوصفات\"",
    "\"المخزون.\"": "\"عمليات الوصفات.\"",
    "مراقبة المبيعات والمخزون وأداء الموظفين": "مراقبة المبيعات وعمليات الوصفات وأداء الموظفين",
    "تتبع المواد الخام والمخزون": "تتبع المواد الخام والوصفات"
};

const chatbotReplacements = {
    "Inventory control": "Recipe operations",
    "Inventory": "Recipe operations",
    "inventory": "recipe operations",
    "مراقبة المخزون": "عمليات الوصفات",
    "المخزون": "عمليات الوصفات"
};

const faqReplacements = {
    "inventory management": "recipe operations",
    "Inventory management": "Recipe operations",
    "inventory": "recipe operations",
    "Inventory": "Recipe operations",
    "إدارة المخزون": "إدارة عمليات الوصفات",
    "المخزون": "عمليات الوصفات"
};

updateFile(enPath, enReplacements);
updateFile(arPath, arReplacements);
updateFile(chatbotPath, chatbotReplacements);
updateFile(faqPath, faqReplacements);

console.log('Advanced replacements completed.');

const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('src/i18n/locales/ar.json', 'utf8'));

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) target[key] = {};
      deepMerge(target[key], source[key]);
    } else if (!(key in target)) {
      target[key] = source[key];
    }
  }
  return target;
}

const addToEn = {
  landing: {
    pricing: {
      additionalFeatures: {
        centralized: "Centralized management from a single dashboard",
        combinedReports: "Combined or filtered reports by branch",
        fullAccess: "Same full access level as your primary site",
        separate: "Separate staff and inventory for each branch"
      },
      additionalLocationsDesc: "Each additional location after your first",
      addLocation: "Add Location",
      insteadOf: "instead of",
      multiBranch: "Multi-Branch",
      planDetails: "Plan Details",
      viewDetails: "View Details",
      whatsIncluded: "What's included in the plan"
    }
  }
};

const addToAr = {
  attributes: {
    form: {
      availableTip: "إذا كان المنتج الإضافي غير متوفر حاليًا، يمكنك إلغاء تحديده في أي وقت."
    }
  },
  categories: {
    messages: {
      noMatchingResults: "لا توجد {{entity}} تطابق \"{{query}}\""
    }
  },
  chat: {
    faq: {
      noMatchingResults: "لا توجد {{entity}} تطابق \"{{query}}\""
    },
    tasks: {
      allDoneSubtitle: "موقعك جاهز تماماً للعمل.",
      allDoneTitle: "تم كل شيء! 🎉"
    }
  },
  common: {
    confirmDelete: "هل أنت متأكد أنك تريد الحذف؟",
    noMatchingResults: "لا توجد {{entity}} تطابق \"{{query}}\"",
    sortBy: "ترتيب حسب"
  },
  dashboard: {
    menu: {
      establishmentSettings: "إعدادات المنشأة"
    },
    shiftStatus: {
      activeOnly: "الوردية النشطة"
    }
  },
  discounts: {
    messages: {
      emptySubtitle: "أنشئ أول خصم لك للبدء في تقديم عروض خاصة لعملائك.",
      emptyTitle: "لم يتم إنشاء خصومات بعد",
      noMatchingResults: "لا توجد {{entity}} تطابق \"{{query}}\"",
      noResults: "لم يتم العثور على نتائج",
      noResultsDesc: "لا توجد خصومات تطابق \"{{query}}\""
    }
  },
  inventory: {
    subtitle: "عرض وتحديث الوصفات والمكونات"
  },
  orders: {
    reports: {
      subtitle: "تحليل بيانات مبيعاتك"
    },
    status: {
      paidTaxChanged: "مدفوع (تغيير الضريبة)"
    }
  },
  products: {
    messages: {
      noMatchingResults: "لا توجد {{entity}} تطابق \"{{query}}\""
    }
  },
  roles: {
    pos: {
      defaultSalesInfo: "يتم تضمين الوصول إلى شاشة المبيعات افتراضيًا عند تمكين هذا القسم."
    },
    subtitle: "إدارة الوصول والأذونات"
  },
  security: {
    deletion: {
      confirm: {
        locationIdTip: "المعرف الفريد لهذا الموقع"
      }
    },
    masterKeyInfo: {
      description: "هذه هي كلمة المرور الرئيسية لحسابك. يمكنك إعادة تعيينها من بوابة المالك.",
      title: "ما هو مفتاح الوصول الرئيسي؟"
    }
  },
  settings: {
    profile: {
      passwordResetNote: "لا يمكن إعادة تعيين كلمة المرور إلا من بوابة المالك"
    }
  },
  staff: {
    form: {
      phoneNumber: "رقم الهاتف"
    }
  },
  support: {
    qa: {
      noMatchingResults: "لا توجد {{entity}} تطابق \"{{query}}\""
    }
  }
};

deepMerge(en, addToEn);
deepMerge(ar, addToAr);

function sortKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return obj;
  const sorted = {};
  for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    sorted[key] = sortKeys(obj[key]);
  }
  return sorted;
}

fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(sortKeys(en), null, 2) + '\n', 'utf8');
fs.writeFileSync('src/i18n/locales/ar.json', JSON.stringify(sortKeys(ar), null, 2) + '\n', 'utf8');

console.log('Locales synchronized successfully.');

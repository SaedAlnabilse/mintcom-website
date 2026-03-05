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

// === Keys missing from EN (exist in AR only) — add English ===
const addToEn = {
  about: {
    story: {
      description: 'PayMint was founded with a mission to simplify business operations for merchants everywhere.'
    }
  },
  landing: {
    download: {
      downloadAPK: 'Download APK',
      getApp: 'Get the App',
      ios: 'iOS',
      qrCode: 'Scan QR code to download'
    },
    hero: {
      stats: {
        activeNow: 'Active Now',
        items: 'Items',
        orders: 'Orders',
        revenue: 'Revenue',
        table: 'Table'
      },
      subtitle: 'The all-in-one POS solution built for growth, efficiency, and seamless operations.'
    }
  },
  legal: {
    cookies: {
      content: {
        controlTitle: 'Control Your Cookies',
        questionsTitle: 'Questions About Cookies',
        thirdPartyTitle: 'Third-Party Services',
        typesTitle: 'Types of Cookies',
        updatesTitle: 'Policy Updates',
        whatAreTitle: 'What Are Cookies?',
        whyUseTitle: 'Why Do We Use Them?'
      },
      intro: 'Cookie Policy'
    },
    privacy: {
      sections: {
        lastUpdated: 'Last Updated',
        subtitle: 'How we protect your data',
        title: 'Privacy Policy'
      }
    },
    terms: {
      sections: {
        lastUpdated: 'Last Updated',
        subtitle: 'Terms & Conditions',
        title: 'Terms of Service'
      }
    }
  },
  portal: {
    quickActions: {
      title: 'Quick Actions'
    },
    recentTickets: {
      newTicket: 'New Ticket'
    },
    resources: {
      subtitle: 'Helpful resources',
      videoGuides: 'Video Guides'
    }
  },
  staff: {
    form: {
      locationsCount_few: '{{count}} locations',
      locationsCount_many: '{{count}} locations',
      locationsCount_one: '1 location',
      locationsCount_other: '{{count}} locations',
      locationsCount_two: '2 locations',
      locationsCount_zero: '{{count}} locations',
      permissionsCount_few: '{{count}} permissions',
      permissionsCount_many: '{{count}} permissions',
      permissionsCount_one: '1 permission',
      permissionsCount_other: '{{count}} permissions',
      permissionsCount_two: '2 permissions',
      permissionsCount_zero: '{{count}} permissions'
    }
  }
};

// === Keys missing from AR (exist in EN only) — add Arabic ===
const addToAr = {
  landing: {
    download: {
      completed: 'مكتمل',
      downloadFor: 'تحميل لـ',
      instantSync: 'مزامنة سحابية فورية',
      offline: 'إمكانيات كاملة بدون اتصال',
      order: 'طلب',
      platforms: 'متاح لأنظمة iOS و Android',
      totalSales: 'إجمالي المبيعات',
      universal: 'دعم شامل للأجهزة اللوحية والهواتف',
      updateLinkAlert: 'رابط التحميل سيكون متاحاً قريباً. يرجى المراجعة لاحقاً.'
    }
  },
  legal: {
    cookies: {
      legalCenter: 'المركز القانوني',
      openSettings: 'فتح إعدادات ملفات تعريف الارتباط',
      preferenceCenterSubtitle: 'يمكنك تغيير إعداداتك في أي وقت بالنقر على الزر أدناه.',
      preferenceCenterTitle: 'مركز التفضيلات',
      questions: 'أسئلة؟',
      sections: {
        control: 'كيفية التحكم في ملفات تعريف الارتباط',
        thirdParty: 'ملفات تعريف ارتباط الطرف الثالث',
        types: 'أنواع ملفات تعريف الارتباط',
        updates: 'تحديثات هذه السياسة',
        whatAre: 'ما هي ملفات تعريف الارتباط؟',
        whyUse: 'لماذا نستخدمها؟'
      }
    },
    privacy: {
      sections: {
        s9: '9. العمليات الدولية',
        s10: '10. خصوصية الأطفال',
        s11: '11. التغييرات على هذه السياسة',
        s12: '12. اتصل بنا'
      }
    }
  },
  portal: {
    quickActions: {
      updatePayment: 'تحديث طريقة الدفع'
    },
    resources: {
      guides: 'الأدلة',
      guidesDesc: 'تعلم أفضل الممارسات'
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

function countKeys(o) {
  let n = 0;
  for (const v of Object.values(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) n += countKeys(v);
    else n++;
  }
  return n;
}

const sortedEn = sortKeys(en);
const sortedAr = sortKeys(ar);

fs.writeFileSync('src/i18n/locales/en.json', JSON.stringify(sortedEn, null, 2) + '\n', 'utf8');
fs.writeFileSync('src/i18n/locales/ar.json', JSON.stringify(sortedAr, null, 2) + '\n', 'utf8');

console.log('EN keys:', countKeys(sortedEn));
console.log('AR keys:', countKeys(sortedAr));

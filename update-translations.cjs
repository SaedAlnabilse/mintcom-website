const fs = require('fs');

const updateTranslations = () => {
  const enPath = './src/i18n/locales/en.json';
  const arPath = './src/i18n/locales/ar.json';
  
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const ar = JSON.parse(fs.readFileSync(arPath, 'utf8'));

  // Hero - First Section
  en.landing.hero = {
    ...en.landing.hero,
    badge: "All-in-One Point of Sale System",
    title1: "Earn More.",
    title2: "Manage Better.",
    title3: "Work Smarter.",
    description: "Mintcom is a complete 360° POS solution built for modern businesses. Manage sales, inventory, staff, reporting, and operations—all from one simple system.",
    cta: "Start Free Trial",
    watchVideo: "See how it works",
    freeTrial: ""
  };

  ar.landing.hero = {
    ...ar.landing.hero,
    badge: "نظام نقاط البيع المتكامل",
    title1: "اكسب أكثر.",
    title2: "أدر أفضل.",
    title3: "اعمل بذكاء.",
    description: "باي منت هو حل متكامل 360 درجة لنقاط البيع مصمم للشركات الحديثة. أدر المبيعات، المخزون، الموظفين، التقارير، والعمليات - كل ذلك من نظام واحد بسيط.",
    cta: "ابدأ التجربة المجانية",
    watchVideo: "شاهد كيف يعمل",
    freeTrial: ""
  };

  // Features - Second Section
  en.landing.features = {
    ...en.landing.features,
    title: "Why",
    titleHighlight: "Mintcom?",
    subtitle: "At Mintcom, we believe in keeping things simple: simple onboarding, simple installation, simple setup, and simple pricing.",
    cards: {
      complete: {
        title: "A Complete Solution — No Hidden Costs",
        description: "Mintcom is more than a checkout system. You get a powerful reporting engine with advanced filters, staff and role management, customer profiles and loyalty programs, discounts, raw material and stock tracking, and much more—all included in one fixed monthly plan."
      },
      realUsers: {
        title: "Designed for Real Users",
        description: "Mintcom is built for business owners, cashiers, and managers—not tech experts. We worked closely with real users to design an intuitive experience that minimizes training time. From login to first sale in under 10 minutes."
      },
      security: {
        title: "Enterprise-Grade Security",
        description: "Your data is fully encrypted, securely stored, and automatically archived. We've invested heavily in top-tier security standards to ensure your business information is protected at all times."
      },
      multiBranch: {
        title: "Multi-Branch Management",
        description: "Run one store or many—Mintcom supports multiple merged branches or separate stores under one unified dashboard. Manage staff, products, sales, and performance across all locations from a single control panel."
      }
    }
  };

  ar.landing.features = {
    ...ar.landing.features,
    title: "لماذا",
    titleHighlight: "باي منت؟",
    subtitle: "في باي منت، نؤمن بإبقاء الأمور بسيطة: تسجيل بسيط، تثبيت بسيط، إعداد بسيط، وتسعير بسيط.",
    cards: {
      complete: {
        title: "حل متكامل — بدون تكاليف خفية",
        description: "باي منت هو أكثر من مجرد نظام دفع. ستحصل على محرك تقارير قوي مع فلاتر متقدمة، إدارة الموظفين والأدوار، ملفات تعريف العملاء وبرامج الولاء، الخصومات، تتبع المواد الخام والمخزون، وأكثر من ذلك بكثير — كل ذلك مشمول في خطة شهرية ثابتة."
      },
      realUsers: {
        title: "مصمم للمستخدمين الحقيقيين",
        description: "تم بناء باي منت لأصحاب الأعمال والكاشير والمديرين — وليس لخبراء التكنولوجيا. عملنا عن كثب مع مستخدمين حقيقيين لتصميم تجربة بديهية تقلل من وقت التدريب. من تسجيل الدخول إلى أول عملية بيع في أقل من 10 دقائق."
      },
      security: {
        title: "أمان على مستوى المؤسسات",
        description: "بياناتك مشفرة بالكامل، ومخزنة بأمان، ومؤرشفة تلقائيًا. لقد استثمرنا بكثافة في معايير الأمان عالية المستوى لضمان حماية معلومات عملك في جميع الأوقات."
      },
      multiBranch: {
        title: "إدارة الفروع المتعددة",
        description: "أدر متجرًا واحدًا أو العديد — يدعم باي منت الفروع المتعددة المدمجة أو المتاجر المنفصلة تحت لوحة تحكم واحدة موحدة. أدر الموظفين والمنتجات والمبيعات والأداء عبر جميع المواقع من لوحة تحكم واحدة."
      }
    }
  };

  // Workflow (Third Section) - What Do You Get for $20 / Month?
  en.landing.workflow = {
    ...en.landing.workflow,
    title: "What Do You Get for",
    titleHighlight: "$20 / Month?",
    subtitle: "",
    pointOfSale: {
      title: "Point of Sale",
      description: "Create products and categories, process sales quickly and easily."
    },
    inventory: {
      title: "Inventory Management",
      description: "Track stock levels, manage raw materials, and receive low-stock alerts."
    },
    staffManagement: {
      title: "Staff Management",
      description: "Add unlimited staff, assign roles, and track shifts and performance."
    },
    advancedReporting: {
      title: "Advanced Reporting",
      description: "Get real-time analytics and insights across every part of your business."
    },
    production: {
      title: "Production & Cost Tracking",
      description: "Set recipes, calculate costs, and track profit margins accurately."
    }
  };

  ar.landing.workflow = {
    ...ar.landing.workflow,
    title: "ماذا تحصل مقابل",
    titleHighlight: "20 دولار / شهرياً؟",
    subtitle: "",
    pointOfSale: {
      title: "نقاط البيع",
      description: "أنشئ المنتجات والفئات، وعالج المبيعات بسرعة وسهولة."
    },
    inventory: {
      title: "إدارة المخزون",
      description: "تتبع مستويات المخزون، وأدر المواد الخام، واحصل على تنبيهات انخفاض المخزون."
    },
    staffManagement: {
      title: "إدارة الموظفين",
      description: "أضف عددًا غير محدود من الموظفين، وعين الأدوار، وتتبع الورديات والأداء."
    },
    advancedReporting: {
      title: "تقارير متقدمة",
      description: "احصل على تحليلات ورؤى في الوقت الفعلي عبر كل جزء من عملك."
    },
    production: {
      title: "تتبع الإنتاج والتكاليف",
      description: "قم بإعداد الوصفات، وحساب التكاليف، وتتبع هوامش الربح بدقة."
    }
  };

  // Admin Control (Fourth Section)
  en.landing.admin = {
    ...en.landing.admin,
    title1: "Full Visibility.",
    title2: "Full Control.",
    title3: "From Your Pocket.",
    description: "With the Mintcom Admin Mobile App, you can monitor and manage your business anytime, anywhere—right from your phone.",
    shiftAlerts: "Shift Alerts",
    stockAlerts: "Stock Alerts",
    liveReports: "Live Sales & Performance Reports"
  };

  ar.landing.admin = {
    ...ar.landing.admin,
    title1: "رؤية كاملة.",
    title2: "تحكم كامل.",
    title3: "من جيبك.",
    description: "مع تطبيق مدير باي منت للهاتف المحمول، يمكنك مراقبة وإدارة عملك في أي وقت وفي أي مكان — مباشرة من هاتفك.",
    shiftAlerts: "تنبيهات الورديات",
    stockAlerts: "تنبيهات المخزون",
    liveReports: "تقارير المبيعات والأداء المباشرة"
  };

  // Pricing (Fifth Section)
  en.landing.pricing = {
    ...en.landing.pricing,
    title: "Get Started",
    subtitle: "Your \"aha\" moment is just minutes away.",
    planDescription: "",
    features: {
      ...en.landing.pricing.features,
      pos: "POS for tablets and mobile devices",
      dashboard: "Online dashboard & management system",
      unlimitedStaff: "Unlimited staff accounts",
      adminApp: "Access to the Admin Mobile App",
      support: "Dedicated customer support",
      reports: "Advanced reports & analytics"
    }
  };

  ar.landing.pricing = {
    ...ar.landing.pricing,
    title: "ابدأ الآن",
    subtitle: "لحظة \"اكتشافك\" على بعد دقائق فقط.",
    planDescription: "",
    features: {
      ...ar.landing.pricing.features,
      pos: "نقاط بيع للأجهزة اللوحية والهواتف المحمولة",
      dashboard: "لوحة تحكم عبر الإنترنت ونظام إدارة",
      unlimitedStaff: "حسابات موظفين غير محدودة",
      adminApp: "الوصول إلى تطبيق الإدارة عبر الهاتف",
      support: "دعم مخصص للعملاء",
      reports: "تقارير وتحليلات متقدمة"
    }
  };

  fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
  fs.writeFileSync(arPath, JSON.stringify(ar, null, 2));
};

updateTranslations();
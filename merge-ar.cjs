const fs = require('fs');

const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const ar = JSON.parse(fs.readFileSync('src/i18n/locales/ar.json', 'utf8'));

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      deepMerge(target[key], source[key]);
    } else if (!(key in target)) {
      target[key] = source[key];
    }
  }
  return target;
}

// ============================================================
// ARABIC TRANSLATIONS FOR ALL MISSING KEYS
// ============================================================
const arTranslations = {
  // -- Validation --
  validation: {
    emailInvalid: 'يرجى إدخال بريد إلكتروني صالح',
    firstNameMin: 'الاسم الأول يجب أن يكون حرفين على الأقل',
    lastNameMin: 'الاسم الأخير يجب أن يكون حرفين على الأقل',
    passwordMin: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    passwordRequired: 'كلمة المرور مطلوبة',
    passwordUppercase: 'يجب أن تحتوي على حرف كبير',
    passwordLowercase: 'يجب أن تحتوي على حرف صغير',
    passwordNumber: 'يجب أن تحتوي على رقم',
    passwordsDoNotMatch: 'كلمات المرور غير متطابقة'
  },

  // -- Auth --
  auth: {
    errors: {
      googleCancelled: 'تم إلغاء تسجيل الدخول بجوجل',
      googleInitFailed: 'فشل في تهيئة تسجيل الدخول بجوجل',
      googleLoadFailed: 'فشل في تحميل تسجيل الدخول بجوجل',
      googleNoSession: 'لا توجد جلسة جوجل نشطة',
      googlePromptFailed: 'فشل في عرض نافذة تسجيل الدخول بجوجل',
      googleUnavailable: 'تسجيل الدخول بجوجل غير متاح حالياً'
    },
    google: {
      continueWith: 'المتابعة مع جوجل',
      signIn: 'تسجيل الدخول بجوجل',
      signUpWith: 'التسجيل مع جوجل'
    },
    login: {
      checkingInfo: 'جاري التحقق من معلوماتك...',
      failed: 'فشل تسجيل الدخول. يرجى التحقق من بياناتك.',
      signingIn: 'جاري تسجيل الدخول...'
    },
    logout: {
      message: 'تم تسجيل الخروج بنجاح'
    },
    signup: {
      failed: 'فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.',
      success: 'تم إنشاء الحساب بنجاح!'
    },
    verifyEmail: {
      failed: 'فشل في إرسال رسالة التحقق',
      resendButton: 'إعادة إرسال رسالة التحقق'
    }
  },

  // -- Common --
  common: {
    actions: 'إجراءات',
    aria: {
      nextMonth: 'الشهر التالي',
      previousMonth: 'الشهر السابق',
      selectDateRange: 'اختر نطاق التاريخ'
    },
    category: 'التصنيف',
    confirmLogout: 'هل أنت متأكد من تسجيل الخروج؟',
    connecting: 'جاري الاتصال...',
    copied: 'تم النسخ',
    copy: 'نسخ',
    copyFailed: 'فشل النسخ',
    creating: 'جاري الإنشاء...',
    currencySymbol: '$',
    days: {
      fri: 'جمعة',
      mon: 'اثنين',
      sat: 'سبت',
      sun: 'أحد',
      thu: 'خميس',
      tue: 'ثلاثاء',
      wed: 'أربعاء'
    },
    entryError: 'خطأ في الإدخال',
    finalConfirmation: 'التأكيد النهائي',
    finish: 'إنهاء',
    guide: 'دليل',
    languages: {
      ar: 'العربية',
      en: 'English'
    },
    live: 'مباشر',
    loadingVideo: 'جاري تحميل الفيديو...',
    location: 'الموقع',
    locations: 'المواقع',
    logoAlt: 'شعار بيمنت',
    logout: 'تسجيل الخروج',
    mo: '/شهر',
    month: 'شهر',
    na: 'غ/م',
    name: 'الاسم',
    noData: 'لا توجد بيانات',
    noResults: 'لا توجد نتائج',
    note: 'ملاحظة',
    password: 'كلمة المرور',
    print: 'طباعة',
    privacyPolicy: 'سياسة الخصوصية',
    restoring: 'جاري الاستعادة...',
    role: 'الدور',
    saveChanges: 'حفظ التغييرات',
    searchArticles: 'البحث في المقالات...',
    searchPlaceholder: 'بحث...',
    security: 'الأمان',
    selected: 'محدد',
    settings: 'الإعدادات',
    share: 'مشاركة',
    sortByDate: 'ترتيب حسب التاريخ',
    sortByLocations: 'ترتيب حسب المواقع',
    sortByName: 'ترتيب حسب الاسم',
    sortByRole: 'ترتيب حسب الدور',
    status: 'الحالة',
    submitting: 'جاري الإرسال...',
    system: 'النظام',
    time: {
      am: 'ص',
      pm: 'م',
      hourAbbr: 'س',
      minuteAbbr: 'د'
    },
    tip: 'نصيحة',
    viewAll: 'عرض الكل',
    website: 'الموقع الإلكتروني',
    welcome: 'مرحباً!',
    welcomeBack: 'مرحباً بعودتك!'
  },

  // -- Password Reset --
  passwordReset: {
    form: {
      confirmPassword: 'تأكيد كلمة المرور',
      confirmPlaceholder: 'أعد إدخال كلمة المرور',
      newPassword: 'كلمة مرور جديدة',
      passwordPlaceholder: 'أدخل كلمة المرور الجديدة',
      resend: 'إعادة إرسال الرمز',
      resetButton: 'إعادة تعيين كلمة المرور',
      resetting: 'جاري إعادة التعيين...',
      sendCode: 'إرسال الرمز',
      sending: 'جاري الإرسال...',
      verifyCode: 'تحقق من الرمز',
      verifying: 'جاري التحقق...'
    },
    messages: {
      codeSent: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني',
      codeVerified: 'تم التحقق من الرمز بنجاح',
      enterFullCode: 'يرجى إدخال رمز التحقق الكامل',
      failedToReset: 'فشل في إعادة تعيين كلمة المرور',
      failedToSend: 'فشل في إرسال رمز التحقق',
      invalidCode: 'رمز تحقق غير صالح',
      passwordReset: 'تم إعادة تعيين كلمة المرور بنجاح'
    },
    steps: {
      enterCodeTitle: 'أدخل رمز التحقق',
      newPasswordDesc: 'أنشئ كلمة مرور قوية لحسابك',
      newPasswordTitle: 'تعيين كلمة مرور جديدة',
      successDesc: 'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
      successTitle: 'تم إعادة التعيين بنجاح',
      verifyDesc: 'أدخل البريد الإلكتروني المرتبط بحسابك',
      verifyTitle: 'تحقق من هويتك'
    },
    title: {
      account: 'إعادة تعيين كلمة مرور الحساب',
      default: 'إعادة تعيين كلمة المرور'
    }
  },

  // -- Cookies --
  cookies: {
    banner: {
      acceptAll: 'قبول الكل',
      description: 'نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح وتحليل حركة الموقع.',
      policyLink: 'سياسة ملفات تعريف الارتباط',
      preferences: 'إدارة التفضيلات',
      rejectAll: 'رفض الكل',
      title: 'موافقة ملفات تعريف الارتباط'
    },
    policy: {
      declaration: 'إعلان ملفات تعريف الارتباط',
      p1: 'يستخدم هذا الموقع ملفات تعريف الارتباط لضمان أفضل تجربة.',
      p2: 'يمكنك تغيير تفضيلاتك في أي وقت.'
    },
    preferences: {
      alwaysActive: 'نشط دائماً',
      manage: 'إدارة تفضيلات ملفات تعريف الارتباط',
      save: 'حفظ التفضيلات',
      subtitle: 'اختر ملفات تعريف الارتباط التي تريد قبولها.',
      title: 'تفضيلات ملفات تعريف الارتباط'
    },
    types: {
      analytics: {
        description: 'تساعدنا في فهم كيفية تفاعل الزوار مع موقعنا.',
        title: 'ملفات تعريف الارتباط التحليلية'
      },
      essential: {
        description: 'ضرورية لعمل الموقع. لا يمكن تعطيلها.',
        title: 'ملفات تعريف الارتباط الأساسية'
      },
      marketing: {
        description: 'تُستخدم لتتبع الزوار لعرض إعلانات ذات صلة.',
        title: 'ملفات تعريف الارتباط التسويقية'
      }
    }
  },

  // -- Contact --
  contact: {
    title: 'اتصل بنا'
  },

  // -- Hardware --
  hardware: {
    tip: 'نصيحة: جميع الأجهزة الموصى بها متوافقة تماماً مع نظام بيمنت.'
  },

  // -- Landing --
  landing: {
    contact: {
      terms: 'بالإرسال، أنت توافق على شروط الخدمة وسياسة الخصوصية.'
    },
    pricing: {
      features: {
        adminApp: 'تطبيق المدير',
        advancedReporting: 'تقارير وتحليلات متقدمة',
        dashboard: 'لوحة تحكم كاملة',
        inventory: 'إدارة المخزون',
        pointOfSale: 'نظام نقاط البيع',
        pos: 'نظام نقاط البيع',
        production: 'الإنتاج والوصفات',
        reports: 'التقارير والتحليلات',
        staffManagement: 'إدارة الموظفين',
        support: 'دعم أولوية',
        unlimitedStaff: 'عدد غير محدود من الموظفين'
      },
      monthlyPlan: 'الخطة الشهرية',
      perMonth: '/شهر',
      planDescription: 'كل ما تحتاجه لإدارة عملك.',
      startFreeTrial: 'ابدأ التجربة المجانية'
    }
  },

  // -- Pricing --
  pricing: {
    planDetails: 'تفاصيل الخطة',
    viewDetails: 'عرض التفاصيل',
    whatsIncluded: 'ما يشمله'
  },

  // -- Dashboard --
  dashboard: {
    menu: {
      billing: 'الفوترة',
      overview: 'نظرة عامة'
    },
    roles: {
      access: 'الوصول',
      actions: 'الإجراءات',
      addRole: 'إضافة دور',
      created: 'تم الإنشاء',
      date: 'التاريخ',
      deleteRole: 'حذف الدور',
      deleteTitle: 'حذف الدور',
      editRole: 'تعديل الدور',
      gridView: 'عرض شبكي',
      listView: 'عرض قائمة',
      loading: 'جاري تحميل الأدوار...',
      messages: {
        created: 'تم إنشاء الدور بنجاح',
        deleted: 'تم حذف الدور بنجاح',
        deleteFailed: 'فشل في حذف الدور',
        loadFailed: 'فشل في تحميل الأدوار',
        noLocation: 'لم يتم تحديد موقع',
        saveFailed: 'فشل في حفظ الدور',
        updated: 'تم تحديث الدور بنجاح'
      },
      name: 'الاسم',
      noRoles: 'لا توجد أدوار',
      noRolesDesc: 'أنشئ دوراً لتحديد صلاحيات الفريق.',
      office: 'المكتب الخلفي',
      permissions: 'الصلاحيات',
      pos: 'نقاط البيع',
      searchPlaceholder: 'البحث في الأدوار...',
      subtitle: 'إدارة أدوار وصلاحيات الفريق',
      title: 'الأدوار',
      type: 'النوع'
    },
    stats: {
      live: 'مباشر'
    }
  },

  // -- Roles (top-level) --
  roles: {
    backoffice: {
      description: 'صلاحيات المكتب الخلفي للوحة التحكم',
      title: 'المكتب الخلفي'
    },
    createRole: 'إنشاء دور',
    editRole: 'تعديل الدور',
    form: {
      allAllowed: 'جميع الخصومات مسموحة',
      allowAllDiscounts: 'السماح بكل الخصومات',
      allowedDiscounts: 'الخصومات المسموحة',
      roleNamePlaceholder: 'أدخل اسم الدور...'
    },
    newRole: 'دور جديد',
    permissions: 'الصلاحيات',
    pos: {
      description: 'صلاحيات نقاط البيع',
      title: 'نقاط البيع'
    },
    validation: {
      atLeastOnePermission: 'يجب تحديد صلاحية واحدة على الأقل'
    }
  },

  // -- Orders --
  orders: {
    actions: {
      refund: 'استرداد',
      refundOrder: 'استرداد الطلب',
      viewDetails: 'عرض التفاصيل'
    },
    details: {
      contact: 'جهة الاتصال',
      contactTip: 'معلومات الاتصال بالعميل',
      customer: 'العميل',
      customerTip: 'العميل الذي قدم الطلب',
      date: 'التاريخ',
      dateTip: 'تاريخ ووقت الطلب',
      discount: 'الخصم',
      items: 'العناصر',
      notes: 'ملاحظات',
      payment: 'الدفع',
      paymentTip: 'طريقة الدفع المستخدمة',
      processed: 'تمت المعالجة',
      qty: 'الكمية',
      refundConfirmMessage: 'هل أنت متأكد من استرداد هذا الطلب؟',
      refundConfirmTitle: 'تأكيد الاسترداد',
      refundedBy: 'تم الاسترداد بواسطة',
      refundedByTip: 'الموظف الذي قام بالاسترداد',
      staff: 'الموظف',
      staffTip: 'الموظف الذي تعامل مع الطلب',
      status: 'الحالة',
      statusTip: 'حالة الطلب الحالية',
      subtotal: 'المجموع الفرعي',
      tax: 'الضريبة',
      title: 'تفاصيل الطلب',
      total: 'الإجمالي'
    },
    kpi: {
      onHold: 'قيد الانتظار',
      totalOrders: 'إجمالي الطلبات',
      totalSales: 'إجمالي المبيعات'
    },
    messages: {
      checkShiftFailed: 'فشل في التحقق من حالة الوردية',
      loadFailed: 'فشل في تحميل الطلبات',
      loading: 'جاري تحميل الطلبات...',
      noOrders: 'لا توجد طلبات',
      noShiftFound: 'لا توجد وردية نشطة',
      refundConfirmMessage: 'هل أنت متأكد من استرداد هذا الطلب؟',
      refundConfirmTitle: 'تأكيد الاسترداد',
      refundFailed: 'فشل في معالجة الاسترداد',
      refundReasonWeb: 'تم الاسترداد عبر لوحة التحكم',
      refundSuccess: 'تم استرداد الطلب بنجاح'
    },
    payment: {
      deliveryApps: 'تطبيقات التوصيل'
    },
    period: 'الفترة',
    reports: {
      shifts: {
        sales: 'المبيعات'
      }
    },
    stats: {
      totalSales: 'إجمالي المبيعات'
    },
    table: {
      payment: 'الدفع'
    }
  },

  // -- Owner --
  owner: {
    account: {
      accountRestored: 'تم استعادة الحساب بنجاح',
      activeEstBlockModal: {
        activeLocations: 'مواقع نشطة',
        goToLocations: 'الانتقال للمواقع',
        subtitle: 'يجب تعطيل جميع المواقع قبل حذف حسابك.',
        title: 'تم العثور على مواقع نشطة'
      },
      brandLoginId: 'معرف تسجيل الدخول للعلامة التجارية',
      brandLoginsSubtitle: 'بيانات الدخول للوحات تحكم العلامات التجارية',
      dangerZoneHint: 'بمجرد الحذف، لا يمكن التراجع.',
      deleteAccount: 'حذف الحساب',
      deleteAccountModal: {
        confirmFinal: 'أفهم أن هذا الإجراء دائم',
        confirmPassword: 'أكد كلمة المرور',
        deleting: 'جاري حذف الحساب...',
        feedbackHint: 'ملاحظاتك تساعدنا على التحسين (اختياري)',
        passwordPlaceholder: 'أدخل كلمة المرور',
        title: 'حذف حسابك',
        warning: 'سيتم حذف حسابك وجميع بياناتك بشكل دائم.',
        whyLeaving: 'لماذا تغادر؟'
      },
      deletionFailed: 'فشل في بدء حذف الحساب',
      deletionInitiated: 'تم بدء عملية حذف الحساب',
      deletionScheduledHint: 'سيتم حذف حسابك بشكل دائم بعد فترة السماح.',
      loading: 'جاري تحميل الحساب...',
      locationLoginsSubtitle: 'بيانات الدخول لمواقع نقاط البيع',
      noLocationsOrBrands: 'لا توجد مواقع أو علامات تجارية',
      noLocationsOrBrandsHint: 'أنشئ موقعاً أو علامة تجارية للبدء.',
      profileUpdatedVerifyEmail: 'تم تحديث الملف الشخصي. يرجى التحقق من بريدك الجديد.',
      resources: {
        aboutUs: { desc: 'تعرف على فريق بيمنت', title: 'عن بيمنت' },
        privacyPolicy: { desc: 'كيف نتعامل مع بياناتك', title: 'سياسة الخصوصية' },
        qa: { desc: 'الأسئلة الشائعة', title: 'مركز الأسئلة والأجوبة' },
        setupManual: { desc: 'دليل إعداد الأجهزة', title: 'دليل الإعداد' },
        subtitle: 'موارد ووثائق مفيدة',
        termsOfUse: { desc: 'الشروط والأحكام', title: 'شروط الاستخدام' },
        title: 'الموارد والمساعدة',
        userManual: { desc: 'دليل شامل لاستخدام بيمنت', title: 'دليل المستخدم' },
        videoTutorial: { desc: 'شاهد كيف تبدأ', title: 'فيديو تعليمي' }
      },
      restoreAccount: 'استعادة الحساب',
      restoreMyAccount: 'استعادة حسابي',
      securityTips: {
        neverShareOtp: 'لا تشارك رموز التحقق مع أي شخص',
        title: 'نصائح أمنية',
        uniquePasswords: 'استخدم كلمات مرور فريدة لكل حساب',
        updatePeriodically: 'قم بتحديث كلمة المرور بشكل دوري'
      },
      stats: { admins: 'المسؤولون', brands: 'العلامات التجارية', locations: 'المواقع' },
      validation: { requiredFields: 'يرجى ملء جميع الحقول المطلوبة' }
    },
    billing: {
      fetchFailed: 'فشل في تحميل معلومات الفوترة',
      subtitle: 'إدارة الاشتراك والمدفوعات',
      title: 'الفوترة'
    },
    brands: {
      activeFilters: 'فلاتر نشطة',
      adminLoginId: 'معرف تسجيل الدخول',
      adminLoginIdHint: 'يُستخدم للوصول إلى لوحة تحكم العلامة التجارية',
      adminLoginIdPlaceholder: 'مثال: brand_admin',
      adminPassword: 'كلمة مرور المسؤول',
      brand: 'علامة تجارية',
      brandName: 'اسم العلامة التجارية',
      brandNamePlaceholder: 'مثال: علامتي التجارية',
      createBrandHint: 'اجمع عدة مواقع تحت علامة تجارية واحدة.',
      createBrandSubtitle: 'إعداد علامة تجارية جديدة',
      createBrandTitle: 'إنشاء علامة تجارية جديدة',
      createFirstBrand: 'أنشئ أول علامة تجارية',
      location: 'الموقع',
      noBrandsFound: 'لا توجد علامات تجارية',
      selectLocationsToLink: 'اختر المواقع للربط',
      tryAdjustingSearch: 'جرب تعديل البحث أو الفلاتر',
      validation: {
        loginIdMin: 'معرف الدخول يجب أن يكون 4 أحرف على الأقل',
        loginIdRegex: 'حروف وأرقام وشرطات فقط',
        nameMin: 'اسم العلامة يجب أن يكون حرفين على الأقل',
        passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      },
      wizard: { finalStepDesc: 'اختر الموظفين للوصول الشامل.' }
    },
    employees: { activeNow: 'نشط الآن', allRoles: 'جميع الأدوار', totalUsers: 'إجمالي المستخدمين' },
    merge: {
      availableLocations: 'المواقع المتاحة',
      brand: 'علامة تجارية',
      brandCreated: 'تم إنشاء العلامة التجارية بنجاح!',
      brandDetailsSubtitle: 'أدخل تفاصيل علامتك التجارية الجديدة',
      brandName: 'اسم العلامة التجارية',
      brandNamePlaceholder: 'أدخل اسم العلامة التجارية...',
      createBrand: 'إنشاء علامة تجارية',
      createFailed: 'فشل في إنشاء العلامة التجارية',
      enterBrandName: 'يرجى إدخال اسم العلامة التجارية',
      newBrandBadge: 'علامة تجارية جديدة',
      readyForNextStep: 'جاهز للخطوة التالية',
      selectedLocations: 'المواقع المحددة',
      selectMinLocations: 'اختر موقعين على الأقل',
      steps: { details: 'التفاصيل', select: 'اختر المواقع' },
      whyMergeDesc: 'إدارة الموظفين والتقارير والإعدادات عبر المواقع من لوحة تحكم واحدة.'
    },
    staff: {
      access: 'الوصول',
      accessRights: 'حقوق الوصول',
      addStaffDesc: 'إضافة عضو جديد للفريق',
      allLocations: 'جميع المواقع',
      enterPasswordPlaceholder: 'أدخل كلمة المرور',
      noStaffDesc: 'أضف أول عضو في الفريق للبدء',
      noStaffFound: 'لم يتم العثور على موظفين',
      passwordPlaceholder: 'أدخل كلمة المرور',
      staffRemoved: 'تم إزالة عضو الفريق',
      syncError: 'فشل في مزامنة بيانات الموظفين',
      undoneWarning: 'لا يمكن التراجع عن هذا الإجراء',
      verifyPassword: 'تحقق من كلمة المرور للمتابعة'
    }
  },

  // -- Account (top-level) --
  account: {
    restoreAction: 'استعادة الحساب',
    restored: 'تم استعادة الحساب بنجاح',
    restoreFailed: 'فشل في استعادة الحساب',
    restoring: 'جاري الاستعادة...'
  },

  // -- Brand --
  brand: {
    dashboard: {
      adjustFilters: 'تعديل الفلاتر',
      dissolveLocation: 'حل الموقع',
      openDashboard: 'فتح لوحة التحكم',
      revenue: 'الإيرادات',
      share: 'المشاركة',
      viewDashboard: 'عرض لوحة التحكم'
    }
  },

  // -- Chat --
  chat: {
    queries: {
      giveMeTips: 'أعطني بعض النصائح',
      showMeReports: 'أظهر لي تقاريري',
      whereAreOrders: 'أين طلباتي؟'
    },
    suggestions: {
      '0': 'كيف أضيف منتجاً؟',
      '1': 'كيف أبدأ وردية جديدة؟',
      '2': 'أين تقارير المبيعات؟',
      '3': 'كيف أدير نقاط الولاء؟',
      add_product: 'إضافة منتج',
      contact_support: 'التواصل مع الدعم',
      get_started: 'ابدأ الآن',
      manage_staff: 'إدارة الموظفين',
      view_orders: 'عرض الطلبات',
      view_reports: 'عرض التقارير'
    }
  },

  // -- Onboarding --
  onboarding: {
    errors: { failedToComplete: 'فشل في إكمال الإعداد. يرجى المحاولة مرة أخرى.' },
    location: 'الموقع',
    messages: { complete: 'اكتمل الإعداد! موقعك جاهز.' },
    select: 'اختر',
    step1: {
      businessTypes: { bakery: 'مخبز' },
      currencies: {
        AED: 'درهم إماراتي',
        BHD: 'دينار بحريني',
        EGP: 'جنيه مصري',
        EUR: 'يورو',
        GBP: 'جنيه إسترليني',
        JOD: 'دينار أردني',
        KWD: 'دينار كويتي',
        OMR: 'ريال عماني',
        QAR: 'ريال قطري',
        SAR: 'ريال سعودي',
        TRY: 'ليرة تركية',
        USD: 'دولار أمريكي'
      }
    },
    step4: { adminUsernamePlaceholder: 'مثال: admin' },
    step5: { ownerPortal: 'بوابة المالك' },
    validation: { locationPasswordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' }
  },

  // -- Settings --
  settings: {
    confirm: { criticalChange: 'هذا تغيير حرج في النظام' },
    danger: { cancelFailed: 'فشل في إلغاء الحذف' },
    messages: { loading: 'جاري تحميل الإعدادات...' },
    profile: { addressPlaceholder: 'أدخل عنوان عملك...' },
    sales: {
      taxErrorGeneric: 'خطأ في تحديث معدل الضريبة',
      taxErrorRange: 'معدل الضريبة يجب أن يكون بين 0% و100%'
    }
  },

  // -- Payment Methods --
  paymentMethods: {
    messages: { notActive: 'طريقة الدفع هذه غير نشطة' },
    modal: { expiryPlaceholder: 'شهر/سنة' }
  },

  // -- Products --
  products: {
    form: { imagePreview: 'معاينة الصورة' },
    messages: { addonCreated: 'تم إنشاء الإضافة بنجاح', addonFailed: 'فشل في إنشاء الإضافة' }
  },

  // -- Categories --
  categories: {
    errors: { failedToCreate: 'فشل في إنشاء التصنيف' }
  },

  // -- Attributes --
  attributes: {
    errors: { deleteFailed: 'فشل في الحذف' },
    filters: { activeFilters: 'فلاتر نشطة' }
  },

  // -- Inventory --
  inventory: {
    messages: { deleteFailed: 'فشل في حذف العنصر' }
  },

  // -- Staff --
  staff: {
    form: { locationLabel: 'الوصول للموقع', standardUsers: 'مستخدمون عاديون' }
  },

  // -- Support --
  support: {
    hero: {
      badge: 'مركز المساعدة',
      searchPlaceholder: 'كيف يمكننا مساعدتك؟',
      subtitle: 'ابحث عن إجابات أو تصفح المقالات أو تواصل مع فريق الدعم.',
      titleHighlight: 'الدعم',
      titlePart1: 'كيف يمكننا',
      titlePart2: 'مساعدتك؟'
    },
    categories: {
      all: 'جميع التصنيفات',
      billing: 'الفوترة والمدفوعات',
      billingDesc: 'إدارة اشتراكك وفواتيرك وطرق الدفع',
      billingDescShort: 'الاشتراك والمدفوعات',
      bug: 'تقارير الأخطاء',
      bugDescShort: 'الإبلاغ عن مشاكل',
      feature: 'طلبات الميزات',
      featureDescShort: 'اقتراح تحسينات',
      features: 'الميزات والشروحات',
      featuresDesc: 'تعرف على الميزات وكيفية استخدامها',
      gettingStarted: 'البدء',
      gettingStartedDesc: 'جديد على بيمنت؟ ابدأ من هنا',
      gettingStartedDescShort: 'الإعداد والتهيئة',
      notFound: 'التصنيف غير موجود',
      notFoundDesc: 'التصنيف الذي تبحث عنه غير موجود.',
      other: 'أخرى',
      otherDescShort: 'أسئلة عامة',
      sidebarTitle: 'التصنيفات',
      subtitle: 'تصفح حسب الموضوع',
      technical: 'الدعم الفني',
      technicalDesc: 'حل المشاكل التقنية',
      technicalDescShort: 'استكشاف الأخطاء',
      title: 'تصنيفات المساعدة'
    },
    cta: {
      stillNeedHelp: 'هل ما زلت بحاجة للمساعدة؟',
      stillNeedHelpDesc: 'فريق الدعم متاح لمساعدتك.',
      subtitle: 'تواصل مع فريق الدعم',
      title: 'اتصل بالدعم'
    },
    quickLinks: { community: 'منتدى المجتمع', submitTicket: 'تقديم تذكرة' },
    qa: {
      categories: {
        billing: 'الفوترة',
        orders: 'الطلبات',
        products: 'المنتجات',
        staff: 'الموظفين',
        technical: 'تقني'
      },
      needMoreHelp: 'هل تحتاج المزيد من المساعدة؟',
      noResults: 'لا توجد نتائج',
      searchPlaceholder: 'البحث عن إجابات...',
      subtitle: 'إجابات على الأسئلة الشائعة',
      tryDifferent: 'جرب مصطلح بحث مختلف'
    },
    popularArticles: {
      account: 'إدارة إعدادات حسابك',
      establishment: 'إعداد مؤسستك',
      payment: 'تهيئة طرق الدفع',
      printer: 'إعداد الطابعات',
      reports: 'فهم التقارير'
    },
    articles: {
      allTitle: 'جميع المقالات',
      backTo: 'العودة إلى',
      backToHelp: 'العودة لمركز المساعدة',
      clearFilters: 'مسح الفلاتر',
      clearSearch: 'مسح البحث',
      count: '{{count}} مقال',
      featuredTitle: 'مقالات مميزة',
      feedbackSorry: 'نعتذر عن ذلك. سنعمل على تحسين هذا المقال.',
      feedbackThanks: 'شكراً لملاحظاتك!',
      helpfulNo: 'لا',
      helpfulQuestion: 'هل كان هذا المقال مفيداً؟',
      helpfulYes: 'نعم',
      notFound: 'المقال غير موجود',
      notFoundDesc: 'المقال الذي تبحث عنه غير موجود.',
      notFoundDescDetail: 'ربما تم نقله أو حذفه.',
      popular: 'شائع',
      read: 'اقرأ المقال',
      related: 'مقالات ذات صلة',
      sortBy: 'ترتيب حسب',
      sortPopular: 'الأكثر شعبية',
      sortRecent: 'الأحدث',
      stubContentH1: 'البدء',
      stubContentH2: 'النقاط الرئيسية',
      stubContentP1: 'هذا المقال قيد الكتابة. تحقق لاحقاً.',
      stubContentP2: 'تواصل مع فريق الدعم للمساعدة.',
      stubTitle: 'قريباً',
      updated: 'تم التحديث',
      viewAll: 'عرض الكل',
      views: 'مشاهدة',
      // Article titles
      gs1: 'كيفية إنشاء أول موقع',
      gs1_excerpt: 'دليل خطوة بخطوة لإعداد أول موقع عمل.',
      gs2: 'إعداد نظام نقاط البيع',
      gs2_excerpt: 'شرح كامل لتهيئة نظام نقاط البيع.',
      gs3: 'إضافة منتجاتك الأولى',
      gs3_excerpt: 'تعلم كيفية إضافة وتنظيم المنتجات.',
      gs4: 'إدارة الموظفين والصلاحيات',
      gs4_excerpt: 'إعداد أعضاء الفريق بالصلاحيات المناسبة.',
      gs5: 'فهم لوحة التحكم',
      gs5_excerpt: 'تصفح لوحة التحكم والمقاييس الرئيسية.',
      gs6: 'إعداد طرق الدفع',
      gs6_excerpt: 'تهيئة طرق الدفع المقبولة.',
      gs7: 'إنشاء التصنيفات',
      gs7_excerpt: 'نظم قائمتك بالتصنيفات.',
      gs8: 'إعداد طابعات الإيصالات',
      gs8_excerpt: 'توصيل وتهيئة طابعات الإيصالات.',
      ft1: 'فهم تقارير المبيعات',
      ft1_excerpt: 'تعمق في تحليلات المبيعات.',
      ft2: 'إدارة المخزون',
      ft2_excerpt: 'تتبع مستويات المخزون والتنبيهات.',
      ft3: 'برامج ولاء العملاء',
      ft3_excerpt: 'إعداد الولاء والمكافآت.',
      ft4: 'تهيئة الخصومات',
      ft4_excerpt: 'إنشاء وإدارة الخصومات.',
      ft5: 'إدارة المواقع المتعددة',
      ft5_excerpt: 'إدارة مواقع متعددة.',
      ft6: 'تتبع أداء الموظفين',
      ft6_excerpt: 'مراقبة أداء مبيعات الموظفين.',
      ft7: 'الإضافات والمعدلات',
      ft7_excerpt: 'إنشاء إضافات المنتجات.',
      ft8: 'إدارة الوصفات',
      ft8_excerpt: 'تتبع تكاليف المكونات.',
      ft9: 'إدارة النقد',
      ft9_excerpt: 'تتبع التدفق النقدي.',
      ft10: 'إدارة العلامات التجارية',
      ft10_excerpt: 'تجميع المواقع في علامات تجارية.',
      bl1: 'خطط الاشتراك والأسعار',
      bl1_excerpt: 'فهم خيارات التسعير.',
      bl2: 'إدارة بطاقات الدفع',
      bl2_excerpt: 'إضافة أو تحديث أو إزالة البطاقات.',
      bl3: 'سجل الفواتير',
      bl3_excerpt: 'عرض وتحميل الفواتير.',
      bl4: 'إلغاء الاشتراك',
      bl4_excerpt: 'كيفية الإلغاء أو الإيقاف.',
      bl5: 'دليل التجربة المجانية',
      bl5_excerpt: 'عن التجربة المجانية.',
      bl6: 'ترقية خطتك',
      bl6_excerpt: 'كيفية الترقية.',
      bl7: 'سياسة الاسترداد',
      bl7_excerpt: 'سياسة الاسترداد والإلغاء.',
      bl8: 'طرق الدفع المقبولة',
      bl8_excerpt: 'طرق الدفع للاشتراكات.',
      tc1: 'قائمة فحص الإعداد الأولي',
      tc1_excerpt: 'قائمة فحص كاملة للإعداد.',
      tc2: 'حل مشاكل الطابعة',
      tc2_excerpt: 'إصلاح مشاكل الطابعة الشائعة.',
      tc3: 'الاتصال بالإنترنت',
      tc3_excerpt: 'ماذا تفعل عند فقدان الاتصال.',
      tc4: 'التطبيق لا يعمل',
      tc4_excerpt: 'خطوات لإصلاح مشاكل التحميل.',
      tc5: 'مشاكل المزامنة',
      tc5_excerpt: 'حل مشاكل المزامنة.',
      tc6: 'توافق المتصفح',
      tc6_excerpt: 'المتصفحات المدعومة.',
      tc7: 'أفضل ممارسات الأمان',
      tc7_excerpt: 'حافظ على أمان حسابك.',
      tc8: 'استعادة الحساب',
      tc8_excerpt: 'استعادة الوصول لحسابك.',
      tc9: 'دليل تكامل API',
      tc9_excerpt: 'التكامل باستخدام API.',
      tc10: 'تحسين الأداء',
      tc10_excerpt: 'تحسين أداء نظام نقاط البيع.'
    },
    newTicket: {
      addFiles: 'إضافة ملفات',
      attachmentLimit: 'بحد أقصى 3 ملفات، 5 ميجابايت لكل ملف',
      categoryLabel: 'التصنيف',
      descriptionLabel: 'الوصف',
      descriptionPlaceholder: 'وصف مشكلتك بالتفصيل...',
      error: 'فشل في تقديم التذكرة',
      errors: {
        category: 'يرجى اختيار تصنيف',
        description: 'الوصف مطلوب',
        descriptionLength: 'الوصف يجب أن يكون 20 حرفاً على الأقل',
        subject: 'الموضوع مطلوب',
        subjectLength: 'الموضوع يجب أن يكون 5 أحرف على الأقل'
      },
      priorityLabel: 'الأولوية',
      privacyAgreement: 'بالإرسال، أنت توافق على سياسة الخصوصية',
      subjectLabel: 'الموضوع',
      subjectPlaceholder: 'ملخص قصير لمشكلتك...',
      submit: 'تقديم التذكرة',
      subtitle: 'املأ النموذج وسيتواصل فريقنا معك',
      success: 'تم تقديم التذكرة بنجاح!',
      title: 'تقديم تذكرة دعم'
    },
    tickets: {
      attachFile: 'إرفاق ملف',
      attachments: 'المرفقات',
      conversation: 'المحادثة',
      created: 'تم الإنشاء',
      createFirst: 'قدم أول تذكرة للحصول على المساعدة',
      id: 'رقم التذكرة',
      lastUpdated: 'آخر تحديث',
      markResolved: 'وضع علامة محلول',
      mock: {
        desc1: 'أواجه مشكلة في توصيل طابعة الإيصالات.',
        reply1: 'هل جربت إعادة الاقتران عبر البلوتوث؟',
        reply2: 'نعم، لا تزال تظهر كمفصولة.',
        reply3: 'هل يمكنك مشاركة طراز جهازك وطابعتك؟',
        subject1: 'الطابعة لا تتصل'
      },
      myTickets: 'تذاكري',
      new: 'تذكرة جديدة',
      newLabel: 'جديد',
      notFound: 'التذكرة غير موجودة',
      notFoundSearch: 'لا توجد تذاكر مطابقة',
      noTicketsYet: 'لا توجد تذاكر بعد',
      priority: {
        high: 'عالية',
        highDesc: 'ميزة رئيسية معطلة',
        low: 'منخفضة',
        lowDesc: 'مشكلة بسيطة أو سؤال',
        medium: 'متوسطة',
        mediumDesc: 'ميزة متأثرة مع حل بديل',
        urgent: 'عاجلة',
        urgentDesc: 'النظام متوقف أو فقدان بيانات'
      },
      priorityLabel: 'الأولوية',
      replyPlaceholder: 'اكتب ردك...',
      resolvedQuestion: 'هل تم حل مشكلتك؟',
      sarah: 'سارة (الدعم)',
      searchPlaceholder: 'البحث في التذاكر...',
      sendReply: 'إرسال الرد',
      stats: { inProgress: 'قيد التنفيذ', open: 'مفتوحة', resolved: 'محلولة' },
      status: { closed: 'مغلقة', inProgress: 'قيد التنفيذ', open: 'مفتوحة', resolved: 'محلولة' },
      statusLabel: 'الحالة',
      subtitle: 'تتبع وإدارة طلبات الدعم',
      toClose: 'إغلاق التذكرة',
      updated: 'تم التحديث',
      you: 'أنت'
    }
  },

  // -- Legal --
  legal: {
    privacy: {
      intro: 'خصوصيتك مهمة لنا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية معلوماتك.',
      agreement: 'باستخدام خدماتنا، أنت توافق على هذه السياسة.',
      branch: {
        b1: 'بنية تحتية سحابية في أمريكا الشمالية وأوروبا',
        b2: 'تطبيقات الهاتف لنظامي iOS و Android',
        b3: 'لوحة تحكم وبوابة إدارية عبر الويب'
      },
      changes: { desc: 'قد نقوم بتحديث سياسة الخصوصية من وقت لآخر.' },
      children: { desc: 'خدماتنا غير مخصصة للأطفال دون سن 16.' },
      contact: { desc: 'تواصل معنا عبر privacy@mintcom.app' },
      cookies: {
        c1: 'ملفات تعريف ارتباط أساسية للمصادقة',
        c2: 'ملفات تعريف ارتباط تحليلية لأنماط الاستخدام',
        c3: 'ملفات تعريف ارتباط للتفضيلات',
        manage: 'إدارة التفضيلات عبر إعدادات ملفات تعريف الارتباط.'
      },
      fields: {
        analytics: 'تحليلات الاستخدام',
        billingAddress: 'عنوان الفوترة',
        businessInfo: 'اسم ونوع وعنوان العمل',
        cardDetails: 'تفاصيل بطاقة الدفع (متوافقة مع PCI)',
        cookies: 'بيانات ملفات تعريف الارتباط',
        credentials: 'بيانات تسجيل الدخول (مشفرة)',
        deviceInfo: 'معلومات الجهاز والمتصفح',
        email: 'البريد الإلكتروني',
        fullName: 'الاسم الكامل',
        ipAddress: 'عنوان IP',
        loyalty: 'بيانات الولاء والمكافآت',
        phone: 'رقم الهاتف',
        products: 'بيانات المنتجات والمخزون',
        sales: 'بيانات المبيعات والمعاملات',
        staff: 'معلومات الموظفين',
        transactionIds: 'معرفات المعاملات',
        usageLogs: 'سجلات استخدام الميزات'
      },
      international: { desc: 'قد يتم نقل بياناتك دولياً مع ضمانات مناسبة.' },
      retention: {
        deletionRequest: 'اطلب الحذف في أي وقت. تتم المعالجة خلال 30 يوماً.',
        r1: 'البيانات النشطة: طوال فترة الحساب',
        r2: 'السجلات المالية: 7 سنوات (متطلب قانوني)',
        r3: 'التحليلات: مجهولة الهوية، حتى سنتين'
      },
      rights: {
        contact: 'تواصل عبر privacy@mintcom.app لممارسة حقوقك.',
        ri1: 'الوصول: طلب نسخة من بياناتك',
        ri2: 'التصحيح: تحديث المعلومات غير الدقيقة',
        ri3: 'الحذف: طلب إزالة البيانات',
        ri4: 'النقل: استلام البيانات بتنسيق محمول'
      },
      sections: {
        s1_desc: 'نجمع المعلومات التي تقدمها مباشرة.',
        s1_1_desc: 'معلومات تسجيل الحساب',
        s1_2_desc: 'تفاصيل العمل',
        s1_2_note: 'نجمع فقط المعلومات الضرورية.',
        s1_3_desc: 'بيانات المعاملات والمدفوعات',
        s1_4_desc: 'اتصالات الدعم',
        s2_desc: 'نستخدم معلوماتك لتقديم وتحسين خدماتنا.',
        s3_desc: 'نطبق تدابير أمنية معيارية.',
        s4_desc: 'لا نبيع معلوماتك الشخصية.',
        s5_desc: 'لديك الحق في الوصول إلى بياناتك وتصحيحها وحذفها أو تصديرها.',
        s6_desc: 'نحتفظ بالبيانات فقط للمدة الضرورية.',
        s7_desc: 'نستخدم ملفات تعريف الارتباط لتحسين تجربتك.',
        s8_desc: 'تواصل معنا عبر privacy@mintcom.app'
      },
      security: {
        noAbsoluteSecurity: 'لا توجد طريقة إلكترونية آمنة بنسبة 100%.',
        sec1: 'تشفير AES-256 للبيانات المخزنة',
        sec2: 'TLS 1.3 للبيانات المنقولة',
        sec3: 'فحوصات أمنية دورية',
        sec4: 'توافق SOC 2 Type II'
      },
      sharing: {
        obligation: 'قد نكشف معلوماتك إذا طُلب قانونياً.',
        sh1: 'معالجو المدفوعات',
        sh2: 'مزودو البنية التحتية السحابية',
        sh3: 'مزودو التحليلات'
      },
      usage: {
        noSell: 'لا نبيع معلوماتك الشخصية.',
        u1: 'تقديم خدمات نقاط البيع',
        u2: 'معالجة المعاملات',
        u3: 'إرسال الإشعارات',
        u4: 'الرد على طلبات الدعم',
        u5: 'تحليل وتحسين الخدمات',
        u6: 'كشف الاحتيال',
        u7: 'الامتثال للالتزامات القانونية',
        u8: 'تخصيص تجربتك'
      }
    },
    terms: {
      intro: 'تحكم هذه الشروط استخدامك لمنصة بيمنت.',
      availability: { desc: 'نسعى لتوفير 99.9% وقت تشغيل لكن لا نضمن الوصول المتواصل.' },
      contact: { desc: 'تواصل عبر legal@mintcom.app للأسئلة.' },
      ip: { desc: 'جميع المحتويات مملوكة لشركة Mintcom LLC ومحمية بقوانين الملكية الفكرية.' },
      law: { desc: 'تخضع لقوانين ولاية ديلاوير.' },
      liability: { desc: 'لا تتحمل بيمنت المسؤولية عن الأضرار غير المباشرة.' },
      payments: {
        p1: 'رسوم الاشتراك شهرية. الرسوم غير قابلة للاسترداد.',
        p2: 'يحق لنا تغيير الأسعار بإشعار 30 يوماً.'
      },
      privacy: {
        p1: 'استخدامك محكوم أيضاً بسياسة الخصوصية.',
        p2: 'أنت توافق على جمع البيانات كما هو موضح في سياسة الخصوصية.'
      },
      responsibilities: {
        accuracy: 'أنت مسؤول عن دقة المعلومات المقدمة.',
        intro: 'كمستخدم، أنت توافق على:',
        r1: 'الحفاظ على أمان حسابك',
        r2: 'استخدام الخدمات بشكل قانوني',
        r3: 'عدم محاولة اختراق أنظمتنا'
      },
      termination: { desc: 'يمكننا إنهاء وصولك في حال مخالفة هذه الشروط.' },
      use: {
        u1: 'يجب أن يكون عمرك 18 سنة على الأقل',
        u2: 'أنت مسؤول عن جميع الأنشطة تحت حسابك'
      }
    },
    cookies: {
      cards: {
        advertisingDesc: 'تُستخدم للإعلانات المستهدفة وقياس الحملات.',
        analyticsDesc: 'تساعدنا في فهم تفاعل الزوار.',
        essentialDesc: 'مطلوبة لعمل الموقع.'
      },
      content: {
        control_1: 'تحكم في ملفات تعريف الارتباط عبر إعدادات المتصفح.',
        control_2: 'تعطيلها قد يؤثر على وظائف الموقع.',
        fb: 'فيسبوك بيكسل',
        fbDesc: 'قياس الإعلانات على فيسبوك.',
        ga: 'تحليلات جوجل',
        gaDesc: 'إحصائيات مجهولة عن استخدام الموقع.',
        questionsDesc: 'تواصل عبر privacy@mintcom.app للأسئلة.',
        thirdParty_1: 'نستخدم خدمات الطرف الثالث التالية:',
        updates_1: 'قد نحدث سياسة ملفات تعريف الارتباط دورياً.',
        updates_2: 'التغييرات ستُنشر على هذه الصفحة.',
        whatAre_1: 'ملفات تعريف الارتباط هي ملفات نصية صغيرة مخزنة على جهازك.',
        whatAre_2: 'تساعد المواقع على العمل بكفاءة أكبر.',
        whyUse_1: 'نستخدمها لضمان الأداء السليم وتحسين تجربتك.'
      }
    }
  },

  // -- Community --
  community: {
    discussions: {
      featured_1: { title: 'أفضل الممارسات لإدارة مواقع متعددة' },
      featured_2: { title: 'كيف قللنا وقت الدفع بنسبة 40%' },
      featured_3: { title: 'دمج بيمنت مع نظام المخزون' },
      item_1: { title: 'أفضل الممارسات لإدارة مواقع متعددة', excerpt: 'توسعت مؤخراً إلى 3 مواقع وأبحث عن نصائح...' },
      item_2: { title: 'كيف قللنا وقت الدفع بنسبة 40%', excerpt: 'بعد تحسين تصميم القائمة وتدريب الموظفين...' },
      item_3: { title: 'دمج بيمنت مع نظام المخزون', excerpt: 'هل نجح أحد في دمج بيمنت مع نظام مخزون خارجي؟' },
      item_4: { title: 'قوالب إيصالات مخصصة - هل هذا ممكن؟', excerpt: 'أريد إضافة شعارنا وتخصيص تذييل الإيصالات...' },
      item_5: { title: 'إعداد نقاط الولاء لمقهى', excerpt: 'أبحث عن نصيحة حول أفضل إعداد لبرنامج الولاء...' }
    },
    guides: {
      all: 'جميع الأدلة',
      item_1: { title: 'دليل الإعداد الكامل للمستخدمين الجدد' },
      item_2: { title: 'تحسين تصميم قائمتك' },
      item_3: { title: 'فهم تقارير المبيعات' },
      item_4: { title: 'أفضل ممارسات إدارة الموظفين' }
    },
    hub: { search_placeholder: 'البحث في المناقشات والأفكار والأدلة...' },
    ideas: {
      all: 'جميع الأفكار',
      item_1: { title: 'الوضع الداكن لتطبيق نقاط البيع', description: 'الوضع الداكن يقلل إجهاد العين في البيئات المعتمة.' },
      item_2: { title: 'طابعات متعددة لكل محطة', description: 'السماح بتوصيل طابعات متعددة بجهاز واحد.' },
      item_3: { title: 'شاشة مواجهة للعميل', description: 'شاشة ثانوية تعرض تفاصيل الطلب للعملاء.' },
      item_4: { title: 'تحسينات وضع عدم الاتصال', description: 'وظائف أفضل بدون اتصال مع مزامنة تلقائية.' },
      item_5: { title: 'إدارة الطاولات والحجوزات', description: 'محرر تخطيط طاولات ونظام حجز مدمج.' },
      item_6: { title: 'طلب QR للعملاء', description: 'السماح للعملاء بمسح رمز QR لعرض القائمة والطلب.' }
    }
  }
};

// ============================================================
// MERGE INTO AR.JSON
// ============================================================
deepMerge(ar, arTranslations);

// Fix ar.json common.time to have all keys
if (!ar.common.time || typeof ar.common.time !== 'object') ar.common.time = {};
if (!ar.common.time.am) ar.common.time.am = 'ص';
if (!ar.common.time.pm) ar.common.time.pm = 'م';
if (!ar.common.time.hourAbbr) ar.common.time.hourAbbr = 'س';
if (!ar.common.time.minuteAbbr) ar.common.time.minuteAbbr = 'د';

fs.writeFileSync(
  'src/i18n/locales/ar.json',
  JSON.stringify(ar, null, 2) + '\n',
  'utf8'
);

function countKeys(o) {
  let n = 0;
  for (const v of Object.values(o)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) n += countKeys(v);
    else n++;
  }
  return n;
}

console.log('ar.json updated successfully');
console.log('Total keys:', countKeys(ar));

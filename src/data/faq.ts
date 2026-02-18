export interface FAQItem {
  question: string;
  questionAr?: string;
  answer: string;
  answerAr?: string;
  category: 'general' | 'billing' | 'technical' | 'account' | 'products' | 'orders' | 'staff';
}

export const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    category: 'general',
    question: 'How do I get started with Paymint?',
    questionAr: 'كيف أبدأ مع بيمنت؟',
    answer: 'Sign up for an account, verify your email, complete the onboarding wizard to set up your first establishment, then start adding products and you\'re ready to sell!',
    answerAr: 'أنشئ حساباً، أكد بريدك الإلكتروني، أكمل معالج الإعداد لتهيئة أول منشأة لك، ثم ابدأ بإضافة المنتجات وستكون جاهزاً للبيع!'
  },

  // Products
  {
    category: 'products',
    question: 'How do I add a new product?',
    questionAr: 'كيف أضيف منتج جديد؟',
    answer: 'Go to Dashboard > Products and click "Add Product". Fill in the name, price, category, and optionally add an image. Enable "Track Stock" for inventory management.',
    answerAr: 'اذهب إلى لوحة التحكم > المنتجات واضغط "إضافة منتج". أكمل الاسم والسعر والتصنيف وأضف صورة اختيارياً. فعّل "تتبع المخزون" لإدارة المخزون.'
  },
  {
    category: 'products',
    question: 'Can I track inventory?',
    questionAr: 'هل يمكنني تتبع المخزون؟',
    answer: 'Yes! When editing a product, enable "Track Stock" and set your initial quantity. You can also set low-stock thresholds to get alerts when running low.',
    answerAr: 'نعم! عند تعديل المنتج، فعّل "تتبع المخزون" وحدد الكمية الأولية. يمكنك أيضاً تحديد حد المخزون المنخفض للحصول على تنبيهات عند النقص.'
  },
  {
    category: 'products',
    question: 'How do I set up product add-ons?',
    questionAr: 'كيف أعد إضافات المنتج؟',
    answer: 'Go to Dashboard > Add-ons to create modifier groups (like sizes, toppings, extras). Then link these groups to your products for customizable ordering.',
    answerAr: 'اذهب إلى لوحة التحكم > الإضافات لإنشاء مجموعات التعديل (مثل الأحجام والإضافات). ثم اربط هذه المجموعات بمنتجاتك للطلب القابل للتخصيص.'
  },
  {
    category: 'products',
    question: 'How do I organize products into categories?',
    questionAr: 'كيف أنظم المنتجات في تصنيفات؟',
    answer: 'Go to Dashboard > Categories to create categories. When adding or editing products, you can assign them to these categories for better organization.',
    answerAr: 'اذهب إلى لوحة التحكم > التصنيفات لإنشاء التصنيفات. عند إضافة أو تعديل المنتجات، يمكنك تعيينها لهذه التصنيفات لتنظيم أفضل.'
  },

  // Orders
  {
    category: 'orders',
    question: 'Where can I view my orders?',
    questionAr: 'أين يمكنني عرض طلباتي؟',
    answer: 'Go to Dashboard > Orders to see all your transactions. You can filter by date, status, payment method, and search for specific orders.',
    answerAr: 'اذهب إلى لوحة التحكم > الطلبات لرؤية جميع معاملاتك. يمكنك الفلترة حسب التاريخ والحالة وطريقة الدفع والبحث عن طلبات محددة.'
  },
  {
    category: 'orders',
    question: 'How do I process a refund?',
    questionAr: 'كيف أعمل استرداد؟',
    answer: 'Find the order in Dashboard > Orders, click on it to view details, then click "Refund" or "Void". You can do full or partial refunds.',
    answerAr: 'ابحث عن الطلب في لوحة التحكم > الطلبات، اضغط عليه لعرض التفاصيل، ثم اضغط "استرداد" أو "إلغاء". يمكنك عمل استرداد كامل أو جزئي.'
  },

  // Staff
  {
    category: 'staff',
    question: 'How do I add employees?',
    questionAr: 'كيف أضيف موظفين؟',
    answer: 'Go to Dashboard > Staff and click "Add Employee". Enter their details, assign a role, and set up their PIN for POS access. They\'ll receive an email to set up their account.',
    answerAr: 'اذهب إلى لوحة التحكم > الموظفين واضغط "إضافة موظف". أدخل تفاصيلهم، حدد الدور، وأعد رقم PIN للوصول لنقاط البيع. سيتلقون بريداً لإعداد حسابهم.'
  },
  {
    category: 'staff',
    question: 'How do roles and permissions work?',
    questionAr: 'كيف تعمل الأدوار والصلاحيات؟',
    answer: 'Go to Dashboard > Roles to create custom roles with specific permissions. You can control access to features like viewing orders, editing products, managing discounts, and more.',
    answerAr: 'اذهب إلى لوحة التحكم > الأدوار لإنشاء أدوار مخصصة بصلاحيات محددة. يمكنك التحكم بالوصول لميزات مثل عرض الطلبات وتعديل المنتجات وإدارة الخصومات والمزيد.'
  },

  // Billing
  {
    category: 'billing',
    question: 'How do I change my subscription?',
    questionAr: 'كيف أغير اشتراكي؟',
    answer: 'Navigate to Owner Portal > Billing to view your current plan, upgrade, or manage your subscription. You can also download invoices and update payment methods.',
    answerAr: 'اذهب إلى بوابة المالك > الفوترة لعرض خطتك الحالية أو الترقية أو إدارة اشتراكك. يمكنك أيضاً تحميل الفواتير وتحديث طرق الدفع.'
  },
  {
    category: 'billing',
    question: 'What payment methods do you accept?',
    questionAr: 'ما طرق الدفع التي تقبلونها؟',
    answer: 'We accept all major credit cards and debit cards for subscription payments. Your billing is processed securely through our payment provider.',
    answerAr: 'نقبل جميع بطاقات الائتمان والخصم الرئيسية لدفعات الاشتراك. تتم معالجة فوترتك بشكل آمن عبر مزود الدفع لدينا.'
  },

  // Technical
  {
    category: 'technical',
    question: 'The POS is offline, what do I do?',
    questionAr: 'نقاط البيع غير متصلة، ماذا أفعل؟',
    answer: 'Paymint works offline for basic cash sales. Your data will sync automatically when you reconnect. Check your internet connection if issues persist.',
    answerAr: 'بيمنت يعمل بدون اتصال للمبيعات النقدية الأساسية. بياناتك ستتزامن تلقائياً عند إعادة الاتصال. تحقق من اتصال الإنترنت إذا استمرت المشكلة.'
  },
  {
    category: 'technical',
    question: 'What hardware does Paymint support?',
    questionAr: 'ما الأجهزة التي يدعمها بيمنت؟',
    answer: 'Paymint works with popular receipt printers (Epson, Star), barcode scanners, cash drawers, and payment terminals. Check our hardware page for specific models.',
    answerAr: 'بيمنت يعمل مع طابعات الإيصالات الشائعة (Epson, Star)، ماسحات الباركود، أدراج النقد، وأجهزة الدفع. راجع صفحة الأجهزة للموديلات المحددة.'
  },
  {
    category: 'technical',
    question: 'How do I view activity logs?',
    questionAr: 'كيف أعرض سجلات النشاط؟',
    answer: 'Go to Dashboard > Activity Logs to see all actions taken in your establishment. You can filter by user, action type, and date range.',
    answerAr: 'اذهب إلى لوحة التحكم > سجل النشاط لرؤية جميع الإجراءات في منشأتك. يمكنك الفلترة حسب المستخدم ونوع الإجراء ونطاق التاريخ.'
  },

  // Account
  {
    category: 'account',
    question: 'How do I reset my password?',
    questionAr: 'كيف أعيد تعيين كلمة المرور؟',
    answer: 'Click "Forgot Password" on the login screen, enter your email, and check your inbox for a reset link. The link expires in 24 hours.',
    answerAr: 'اضغط "نسيت كلمة المرور" على شاشة الدخول، أدخل بريدك، وتحقق من بريدك الوارد لرابط إعادة التعيين. ينتهي صلاحية الرابط خلال 24 ساعة.'
  },
  {
    category: 'account',
    question: 'How do I update my profile?',
    questionAr: 'كيف أحدّث ملفي الشخصي؟',
    answer: 'Go to Owner Portal > Account to update your profile information, change your password, manage notification preferences, and security settings.',
    answerAr: 'اذهب إلى بوابة المالك > الحساب لتحديث معلوماتك الشخصية وتغيير كلمة المرور وإدارة تفضيلات الإشعارات وإعدادات الأمان.'
  },
  {
    category: 'account',
    question: 'How do I manage multiple locations?',
    questionAr: 'كيف أدير مواقع متعددة؟',
    answer: 'Go to Owner Portal > Establishments to view and manage all your locations. You can add new establishments, edit details, or group them under brands.',
    answerAr: 'اذهب إلى بوابة المالك > المنشآت لعرض وإدارة جميع مواقعك. يمكنك إضافة منشآت جديدة أو تعديل التفاصيل أو تجميعها تحت علامات تجارية.'
  }
];

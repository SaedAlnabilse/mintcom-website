export interface FAQItem {
  id: string;
  question: string;
  questionAr?: string;
  answer: string;
  answerAr?: string;
  category: 'general' | 'billing' | 'technical' | 'account' | 'products' | 'orders' | 'staff';
}

export const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: 'get-started',
    category: 'general',
    question: 'How do I get started with PayMint?',
    questionAr: 'كيف أبدأ مع بيمنت؟',
    answer: 'Sign up for an account, verify your email, and complete the onboarding wizard to set up your first establishment. Once done, you can start adding products and you\'re ready to sell immediately.',
    answerAr: 'أنشئ حساباً، أكد بريدك الإلكتروني، أكمل معالج الإعداد لتهيئة أول منشأة لك، ثم ابدأ بإضافة المنتجات وستكون جاهزاً للبيع!'
  },

  // Products
  {
    id: 'add-product',
    category: 'products',
    question: 'How do I add a new product?',
    questionAr: 'كيف أضيف منتج جديد؟',
    answer: 'Navigate to Dashboard > Products and click "Add Product". Fill in the essential details like name, price, and category. You can also upload a product image and enable "Track Stock" for advanced recipe operations.',
    answerAr: 'اذهب إلى لوحة التحكم > المنتجات واضغط "إضافة منتج". أكمل الاسم والسعر والتصنيف وأضف صورة اختيارياً. فعّل "تتبع عمليات الوصفات" لإدارة عمليات الوصفات.'
  },
  {
    id: 'track-stock',
    category: 'products',
    question: 'Can I track recipe operations and recipe operations?',
    questionAr: 'هل يمكنني تتبع عمليات الوصفات؟',
    answer: 'Yes! When editing a product, enable "Track Stock" to set your initial quantity and low-stock thresholds. This allows you to receive alerts when items are running low and manage your kitchen recipes effectively.',
    answerAr: 'نعم! عند تعديل المنتج، فعّل "تتبع عمليات الوصفات" وحدد الكمية الأولية. يمكنك أيضاً تحديد حد عمليات الوصفات المنخفض للحصول على تنبيهات عند النقص.'
  },
  {
    id: 'add-ons',
    category: 'products',
    question: 'How do I set up product add-ons?',
    questionAr: 'كيف أعد إضافات المنتج؟',
    answer: 'Go to Dashboard > Add-ons to create modifier groups (such as sizes, toppings, or extras). Link these groups to your products to offer customizable ordering options for your customers.',
    answerAr: 'اذهب إلى لوحة التحكم > الإضافات لإنشاء مجموعات التعديل (مثل الأحجام والإضافات). ثم اربط هذه المجموعات بمنتجاتك للطلب القابل للتخصص.'
  },
  {
    id: 'organize-products',
    category: 'products',
    question: 'How do I organize products into categories?',
    questionAr: 'كيف أنظم المنتجات في تصنيفات؟',
    answer: 'Use Dashboard > Categories to create organizational groups. When adding or editing products, simply assign them to these categories to keep your POS menu clean and easy to navigate.',
    answerAr: 'اذهب إلى لوحة التحكم > التصنيفات لإنشاء التصنيفات. عند إضافة أو تعديل المنتجات، يمكنك تعيينها لهذه التصنيفات لتنظيم أفضل.'
  },

  // Orders
  {
    id: 'view-orders',
    category: 'orders',
    question: 'Where can I view my sales and orders?',
    questionAr: 'أين يمكنني عرض طلباتي؟',
    answer: 'All transactions are visible in Dashboard > Orders. You can search for specific orders or use filters for date ranges, order status, and payment methods to analyze your performance.',
    answerAr: 'اذهب إلى لوحة التحكم > الطلبات لرؤية جميع معاملاتك. يمكنك الفلترة حسب التاريخ والحالة وطريقة الدفع والبحث عن طلبات محددة.'
  },
  {
    id: 'process-refund',
    category: 'orders',
    question: 'How do I process a refund?',
    questionAr: 'كيف أعمل استرداد؟',
    answer: 'Locate the specific transaction in Dashboard > Orders, click to view details, and select "Refund" or "Void". PayMint supports both full and partial refunds for maximum flexibility.',
    answerAr: 'ابحث عن الطلب في لوحة التحكم > الطلبات، اضغط عليه لعرض التفاصيل، ثم اضغط "استرداد" أو "إلغاء". يمكنك عمل استرداد كامل أو جزئي.'
  },

  // Staff
  {
    id: 'add-employees',
    category: 'staff',
    question: 'How do I add employees to my team?',
    questionAr: 'كيف أضيف موظفين؟',
    answer: 'Go to Dashboard > Staff and select "Add Employee". Enter their information, assign a specific role, and set up their unique PIN for POS access. They will receive an email to complete their account setup.',
    answerAr: 'اذهب إلى لوحة التحكم > الموظفين واضغط "إضافة موظف". أدخل تفاصيلهم، حدد الدور، وأعد رقم PIN للوصول لنقاط البيع. سيتلقون بريداً لإعداد حسابهم.'
  },
  {
    id: 'roles-permissions',
    category: 'staff',
    question: 'How do roles and permissions work?',
    questionAr: 'كيف تعمل الأدوار والصلاحيات؟',
    answer: 'Create custom roles in Dashboard > Roles with specific permissions. You can control exactly what your team can access, from viewing sensitive reports to editing products or managing discounts.',
    answerAr: 'اذهب إلى لوحة التحكم > الأدوار لإنشاء أدوار مخصصة بصلاحيات محددة. يمكنك التحكم بالوصول لميزات مثل عرض الطلبات وتعديل المنتجات وإدارة الخصومات والمزيد.'
  },

  // Billing
  {
    id: 'change-subscription',
    category: 'billing',
    question: 'How do I change my subscription plan?',
    questionAr: 'كيف أغير اشتراكي؟',
    answer: 'Manage your plan in Owner Portal > Billing. Here you can switch between monthly (20 USD/mo) and yearly (210 USD/yr) billing, download invoices, and update your payment methods at any time.',
    answerAr: 'اذهب إلى بوابة المالك > الفوترة لعرض خطتك الحالية أو التبديل بين الفوترة الشهرية (20 USD/شهر) والسنوية (210 USD/سنة) أو إدارة اشتراكك. يمكنك أيضاً تحميل الفواتير وتحديث طرق الدفع.'
  },
  {
    id: 'pricing-plans',
    category: 'billing',
    question: 'What are the pricing plans?',
    questionAr: 'ما هي خطط الأسعار؟',
    answer: 'Our standard plan starts at 20 USD/month or 210 USD/year for your first location. Each additional location is only 17 USD/month or 180 USD/year. All plans include every feature, with a 7-day free trial for new users.',
    answerAr: 'الموقع الأول: 20 USD/شهر أو 210 USD/سنة (وفّر 30 USD/سنة). المواقع الإضافية: 17 USD/شهر أو 180 USD/سنة لكل موقع (وفّر 24 USD/سنة لكل موقع). جميع الخطط تتضمن وصول كامل لجميع الميزات. المستخدمون الجدد يحصلون على تجربة مجانية 7 أيام!'
  },
  {
    id: 'accept-payments',
    category: 'billing',
    question: 'What payment methods do you accept?',
    questionAr: 'ما طرق الدفع التي تقبلونها؟',
    answer: 'We accept all major credit and debit cards for subscription payments. For your POS, PayMint enables you to accept cash, cards, and digital wallets through integrated payment terminals.',
    answerAr: 'نقبل جميع بطاقات الائتمان والخصم الرئيسية لدفعات الاشتراك. تتم معالجة فوترتك بشكل آمن عبر مزود الدفع لدينا.'
  },

  // Technical
  {
    id: 'offline-pos',
    category: 'technical',
    question: 'The POS is offline, what should I do?',
    questionAr: 'نقاط البيع غير متصلة، ماذا أفعل؟',
    answer: 'PayMint is designed to work offline for basic sales. Your data will automatically synchronize with our servers once your internet connection is restored. Check your local network settings if issues persist.',
    answerAr: 'بيمنت يعمل بدون اتصال للمبيعات النقدية الأساسية. بياناتك ستتزامن تلقائياً عند إعادة الاتصال. تحقق من اتصال الإنترنت إذا استمرت المشكلة.'
  },
  {
    id: 'hardware-support',
    category: 'technical',
    question: 'What hardware does PayMint support?',
    questionAr: 'ما الأجهزة التي يدعمها بيمنت؟',
    answer: 'We support a wide range of industry-standard hardware, including Epson and Star receipt printers, barcode scanners, cash drawers, and modern payment terminals. Visit our hardware page for compatible models.',
    answerAr: 'بيمنت يعمل مع طابعات الإيصالات الشائعة (Epson, Star)، ماسحات الباركود، أدراج النقد، وأجهزة الدفع. راجع صفحة الأجهزة للموديلات المحددة.'
  },
  {
    id: 'activity-logs',
    category: 'technical',
    question: 'How do I view activity logs?',
    questionAr: 'كيف أعرض سجلات النشاط؟',
    answer: 'Go to Dashboard > Activity Logs to monitor all actions taken within your establishment. You can filter logs by specific users, action types, or date ranges for complete transparency.',
    answerAr: 'اذهب إلى لوحة التحكم > سجل النشاط لرؤية جميع الإجراءات في منشأتك. يمكنك الفلترة حسب المستخدم ونوع الإجراء ونطاق التاريخ.'
  },

  // Account
  {
    id: 'reset-password',
    category: 'account',
    question: 'How do I reset my password?',
    questionAr: 'كيف أعيد تعيين كلمة المرور؟',
    answer: 'Click "Forgot Password" on the login screen and enter your registered email. You will receive a reset link that remains valid for 24 hours. Follow the link to create a new, secure password.',
    answerAr: 'اضغط "نسيت كلمة المرور" على شاشة الدخول، أدخل بريدك، وتحقق من بريدك الوارد لرابط إعادة التعيين. ينتهي صلاحية الرابط خلال 24 ساعة.'
  },
  {
    id: 'update-profile',
    category: 'account',
    question: 'How do I update my profile information?',
    questionAr: 'كيف أحدّث ملفي الشخصي؟',
    answer: 'Access Owner Portal > Account to update your personal details, change your password, and manage your notification and security preferences.',
    answerAr: 'اذهب إلى بوابة المالك > الحساب لتحديث معلوماتك الشخصية وتغيير كلمة المرور وإدارة تفضيلات الإشعارات وإعدادات الأمان.'
  },
  {
    id: 'multiple-locations',
    category: 'account',
    question: 'How do I manage multiple business locations?',
    questionAr: 'كيف أدير مواقع متعددة؟',
    answer: 'Visit Owner Portal > Establishments to oversee all your locations from a single dashboard. You can add new establishments, edit existing details, and organize them under unified brands.',
    answerAr: 'اذهب إلى بوابة المالك > المنشآت لعرض وإدارة جميع مواقعك. يمكنك إضافة منشآت جديدة أو تعديل التفاصيل أو تجميعها تحت علامات تجارية.'
  }
];

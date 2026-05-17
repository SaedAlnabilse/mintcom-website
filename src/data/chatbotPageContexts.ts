import { matchPath } from 'react-router-dom';
import type {
  ChatActionDefinition,
  ChatbotPageContextOptions,
  ChatbotPageContextDefinition,
  LocalizedChatText,
  ResolvedChatAction,
  ResolvedChatbotPageContext,
} from '../components/Chat/chatbotTypes';

const text = (en: string, ar: string): LocalizedChatText => ({ en, ar });

const PAGE_CONTEXTS: ChatbotPageContextDefinition[] = [
  {
    id: 'dashboard-products',
    match: ['/dashboard/:locationSlug/products'],
    title: text('Products', 'المنتجات'),
    launcherPrompt: text('Need help setting up products?', 'هل تحتاج مساعدة في إعداد المنتجات؟'),
    welcomeMessage: text(
      "You're on Products. I can help you add products, organize categories, manage pricing, and prepare items for sale.",
      'أنت الآن في صفحة المنتجات. أستطيع مساعدتك في إضافة المنتجات وتنظيم التصنيفات وإدارة الأسعار وتجهيز الأصناف للبيع.',
    ),
    defaultSuggestions: [
      text('How do I add a new product?', 'كيف أضيف منتجاً جديداً؟'),
      text('How do I organize products into categories?', 'كيف أنظم المنتجات في تصنيفات؟'),
      text('How do I set tax and receipt settings?', 'كيف أضبط الضريبة وإعدادات الإيصال؟'),
    ],
    quickActions: [
      {
        id: 'products-add',
        label: text('Add product', 'إضافة منتج'),
        icon: 'package',
        type: 'navigate',
        path: '/dashboard/:locationSlug/products',
        state: { openCreateModal: true },
      },
      {
        id: 'products-categories',
        label: text('Categories', 'التصنيفات'),
        icon: 'tag',
        type: 'navigate',
        path: '/dashboard/:locationSlug/categories',
      },
      {
        id: 'products-pricing',
        label: text('Pricing tips', 'نصائح التسعير'),
        icon: 'lightbulb',
        type: 'ask',
        query: text('Give me product pricing tips', 'أعطني نصائح لتسعير المنتجات'),
      },
      {
        id: 'products-tax',
        label: text('Tax settings', 'إعدادات الضريبة'),
        icon: 'receipt',
        type: 'navigate',
        path: '/dashboard/:locationSlug/settings',
        state: { openSettingsTab: 'sales' },
      },
    ],
  },
  {
    id: 'dashboard-categories',
    match: ['/dashboard/:locationSlug/categories'],
    title: text('Categories', 'التصنيفات'),
    launcherPrompt: text('Need help organizing categories?', 'هل تحتاج مساعدة في تنظيم التصنيفات؟'),
    welcomeMessage: text(
      "You're on Categories. I can help you create categories, reorder them, and connect them to products.",
      'أنت الآن في صفحة التصنيفات. أستطيع مساعدتك في إنشاء التصنيفات وترتيبها وربطها بالمنتجات.',
    ),
    defaultSuggestions: [
      text('How do I organize products into categories?', 'كيف أنظم المنتجات في تصنيفات؟'),
      text('How do I add a new product?', 'كيف أضيف منتجاً جديداً؟'),
      text('What is the best menu structure for my products?', 'ما أفضل هيكلة للقائمة والمنتجات؟'),
    ],
    quickActions: [
      {
        id: 'categories-add',
        label: text('New category', 'تصنيف جديد'),
        icon: 'tag',
        type: 'navigate',
        path: '/dashboard/:locationSlug/categories',
        state: { openCreateModal: true },
      },
      {
        id: 'categories-add-product',
        label: text('Add product', 'إضافة منتج'),
        icon: 'package',
        type: 'navigate',
        path: '/dashboard/:locationSlug/products',
        state: { openCreateModal: true },
      },
      {
        id: 'categories-tips',
        label: text('Menu tips', 'نصائح القائمة'),
        icon: 'lightbulb',
        type: 'ask',
        query: text('Give me tips for organizing my menu', 'أعطني نصائح لتنظيم القائمة'),
      },
    ],
  },
  {
    id: 'dashboard-orders',
    match: ['/dashboard/:locationSlug/orders'],
    title: text('Orders', 'الطلبات'),
    launcherPrompt: text('Need help with orders or refunds?', 'هل تحتاج مساعدة في الطلبات أو الاسترجاعات؟'),
    welcomeMessage: text(
      "You're on Orders. I can help you find receipts, filter order history, review payment status, and handle refunds.",
      'أنت الآن في صفحة الطلبات. أستطيع مساعدتك في العثور على الإيصالات وتصفية السجل ومراجعة حالة الدفع ومعالجة الاسترجاعات.',
    ),
    defaultSuggestions: [
      text('Where can I find my orders?', 'أين أجد طلباتي؟'),
      text('How do I process a refund?', 'كيف أعالج عملية استرجاع؟'),
      text('How do I filter orders by date?', 'كيف أصفي الطلبات حسب التاريخ؟'),
    ],
    quickActions: [
      {
        id: 'orders-find',
        label: text('Find orders', 'البحث عن الطلبات'),
        icon: 'clipboardList',
        type: 'ask',
        query: text('Where can I find my orders?', 'أين أجد طلباتي؟'),
      },
      {
        id: 'orders-refund',
        label: text('Refund help', 'مساعدة الاسترجاع'),
        icon: 'receipt',
        type: 'ask',
        query: text('How do I process a refund?', 'كيف أعالج عملية استرجاع؟'),
      },
      {
        id: 'orders-reports',
        label: text('Sales report', 'تقرير المبيعات'),
        icon: 'barChart3',
        type: 'navigate',
        path: '/dashboard/:locationSlug/reports/sales',
      },
    ],
  },
  {
    id: 'dashboard-reports',
    match: ['/dashboard/:locationSlug/reports', '/dashboard/:locationSlug/reports/:type'],
    title: text('Reports', 'التقارير'),
    launcherPrompt: text('Need help reading reports?', 'هل تحتاج مساعدة في قراءة التقارير؟'),
    welcomeMessage: text(
      "You're on Reports. I can help you read sales metrics, compare date ranges, export data, and understand performance.",
      'أنت الآن في صفحة التقارير. أستطيع مساعدتك في قراءة مؤشرات المبيعات ومقارنة الفترات وتصدير البيانات وفهم الأداء.',
    ),
    defaultSuggestions: [
      text('Show me my sales reports', 'أظهر لي تقارير المبيعات'),
      text('How do I compare sales by date?', 'كيف أقارن المبيعات حسب التاريخ؟'),
      text('How do I export my reports?', 'كيف أصدر تقاريري؟'),
    ],
    quickActions: [
      {
        id: 'reports-sales',
        label: text('Sales', 'المبيعات'),
        icon: 'barChart3',
        type: 'navigate',
        path: '/dashboard/:locationSlug/reports/sales',
      },
      {
        id: 'reports-payments',
        label: text('Payments', 'المدفوعات'),
        icon: 'creditCard',
        type: 'navigate',
        path: '/dashboard/:locationSlug/reports/payments',
      },
      {
        id: 'reports-tips',
        label: text('Explain metrics', 'شرح المؤشرات'),
        icon: 'lightbulb',
        type: 'ask',
        query: text('Explain the main report metrics', 'اشرح لي أهم مؤشرات التقارير'),
      },
    ],
  },
  {
    id: 'dashboard-staff',
    match: ['/dashboard/:locationSlug/staff'],
    title: text('Staff', 'الموظفون'),
    launcherPrompt: text('Need help managing staff?', 'هل تحتاج مساعدة في إدارة الموظفين؟'),
    welcomeMessage: text(
      "You're on Staff. I can help you add employees, manage roles, reset access, and prepare your team for launch.",
      'أنت الآن في صفحة الموظفين. أستطيع مساعدتك في إضافة الموظفين وإدارة الأدوار وإعادة ضبط الوصول وتجهيز الفريق.',
    ),
    defaultSuggestions: [
      text('How do I add staff members?', 'كيف أضيف موظفين؟'),
      text('How do I set up roles and permissions?', 'كيف أعد الأدوار والصلاحيات؟'),
      text('How do I deactivate an employee?', 'كيف أعطل حساب موظف؟'),
    ],
    quickActions: [
      {
        id: 'staff-add',
        label: text('Add staff', 'إضافة موظف'),
        icon: 'users',
        type: 'navigate',
        path: '/dashboard/:locationSlug/staff',
        state: { openCreateModal: true },
      },
      {
        id: 'staff-roles',
        label: text('Roles', 'الأدوار'),
        icon: 'shield',
        type: 'navigate',
        path: '/dashboard/:locationSlug/roles',
      },
      {
        id: 'staff-help',
        label: text('Permissions', 'الصلاحيات'),
        icon: 'lightbulb',
        type: 'ask',
        query: text('How do I set up roles and permissions?', 'كيف أعد الأدوار والصلاحيات؟'),
      },
    ],
  },
  {
    id: 'dashboard-settings',
    match: ['/dashboard/:locationSlug/settings'],
    title: text('Settings', 'الإعدادات'),
    launcherPrompt: text('Need help with settings?', 'هل تحتاج مساعدة في الإعدادات؟'),
    welcomeMessage: text(
      "You're on Settings. I can help you update location details, tax settings, receipts, and business profile data.",
      'أنت الآن في صفحة الإعدادات. أستطيع مساعدتك في تحديث بيانات الموقع والضرائب والإيصالات وملف النشاط.',
    ),
    defaultSuggestions: [
      text('How do I customize receipts?', 'كيف أخصص الإيصالات؟'),
      text('How do I set tax and receipt settings?', 'كيف أضبط الضريبة وإعدادات الإيصال؟'),
      text('How do I change the language?', 'كيف أغير اللغة؟'),
    ],
    quickActions: [
      {
        id: 'settings-profile',
        label: text('Profile', 'الملف'),
        icon: 'store',
        type: 'navigate',
        path: '/dashboard/:locationSlug/settings',
        state: { openSettingsTab: 'profile' },
      },
      {
        id: 'settings-sales',
        label: text('Tax settings', 'إعدادات الضريبة'),
        icon: 'creditCard',
        type: 'navigate',
        path: '/dashboard/:locationSlug/settings',
        state: { openSettingsTab: 'sales' },
      },
      {
        id: 'settings-receipt',
        label: text('Receipt', 'الإيصال'),
        icon: 'receipt',
        type: 'navigate',
        path: '/dashboard/:locationSlug/settings',
        state: { openSettingsTab: 'receipt' },
      },
    ],
  },
  {
    id: 'dashboard-payments',
    match: ['/dashboard/:locationSlug/payment-methods'],
    title: text('Payment Methods', 'طرق الدفع'),
    launcherPrompt: text('Need help with payment methods?', 'هل تحتاج مساعدة في طرق الدفع؟'),
    welcomeMessage: text(
      "You're on Payment Methods. I can help you add payment options, card brands, and prepare checkout settings.",
      'أنت الآن في صفحة طرق الدفع. أستطيع مساعدتك في إضافة وسائل الدفع وأنواع البطاقات وتجهيز إعدادات الكاشير.',
    ),
    defaultSuggestions: [
      text('How do I set up payment methods?', 'كيف أعد طرق الدفع؟'),
      text('How do I add card types?', 'كيف أضيف أنواع البطاقات؟'),
      text('How do I handle payment issues?', 'كيف أتعامل مع مشاكل الدفع؟'),
    ],
    quickActions: [
      {
        id: 'payments-add',
        label: text('Add method', 'إضافة طريقة'),
        icon: 'wallet',
        type: 'navigate',
        path: '/dashboard/:locationSlug/payment-methods',
        state: { openCreateModal: true },
      },
      {
        id: 'payments-settings',
        label: text('Sales settings', 'إعدادات البيع'),
        icon: 'creditCard',
        type: 'navigate',
        path: '/dashboard/:locationSlug/settings',
        state: { openSettingsTab: 'sales' },
      },
      {
        id: 'payments-help',
        label: text('Payment help', 'مساعدة الدفع'),
        icon: 'lightbulb',
        type: 'ask',
        query: text('How do I handle payment issues?', 'كيف أتعامل مع مشاكل الدفع؟'),
      },
    ],
  },
  {
    id: 'dashboard-loyalty',
    match: ['/dashboard/:locationSlug/loyalty'],
    title: text('Loyalty', 'الولاء'),
    launcherPrompt: text('Need help with loyalty setup?', 'هل تحتاج مساعدة في إعداد برنامج الولاء؟'),
    welcomeMessage: text(
      "You're on Loyalty. I can help you enable rewards, register customers, and explain how points and redemptions work.",
      'أنت الآن في صفحة الولاء. أستطيع مساعدتك في تفعيل المكافآت وتسجيل العملاء وشرح النقاط والاستبدال.',
    ),
    defaultSuggestions: [
      text('How does the loyalty program work?', 'كيف يعمل برنامج الولاء؟'),
      text('How do I register a customer for loyalty?', 'كيف أسجل عميلاً في برنامج الولاء؟'),
      text('How do customers redeem points?', 'كيف يستبدل العملاء النقاط؟'),
    ],
    quickActions: [
      {
        id: 'loyalty-help',
        label: text('Setup loyalty', 'إعداد الولاء'),
        icon: 'star',
        type: 'ask',
        query: text('How does the loyalty program work?', 'كيف يعمل برنامج الولاء؟'),
      },
      {
        id: 'loyalty-customers',
        label: text('Customers', 'العملاء'),
        icon: 'users',
        type: 'navigate',
        path: '/dashboard/:locationSlug/customers',
      },
    ],
  },
  {
    id: 'dashboard-inventory',
    match: ['/dashboard/:locationSlug/inventory'],
    title: text('Inventory', 'المخزون'),
    launcherPrompt: text('Need help with inventory or recipes?', 'هل تحتاج مساعدة في المخزون أو الوصفات؟'),
    welcomeMessage: text(
      "You're on Inventory. I can help you track stock, understand recipe operations, and connect ingredients to products.",
      'أنت الآن في صفحة المخزون. أستطيع مساعدتك في تتبع المخزون وفهم عمليات الوصفات وربط المكونات بالمنتجات.',
    ),
    defaultSuggestions: [
      text('How do recipe operations work?', 'كيف تعمل عمليات الوصفات؟'),
      text('How do I track stock levels?', 'كيف أتابع مستويات المخزون؟'),
      text('How do I connect products to ingredients?', 'كيف أربط المنتجات بالمكونات؟'),
    ],
    quickActions: [
      {
        id: 'inventory-add-product',
        label: text('Add product', 'إضافة منتج'),
        icon: 'package',
        type: 'navigate',
        path: '/dashboard/:locationSlug/products',
        state: { openCreateModal: true },
      },
      {
        id: 'inventory-low-stock',
        label: text('Stock tips', 'نصائح المخزون'),
        icon: 'lightbulb',
        type: 'ask',
        query: text('How do I track stock levels?', 'كيف أتابع مستويات المخزون؟'),
      },
    ],
  },
  {
    id: 'dashboard-home',
    match: ['/dashboard/:locationSlug'],
    title: text('Dashboard', 'لوحة التحكم'),
    launcherPrompt: text('Need help with this location dashboard?', 'هل تحتاج مساعدة في لوحة هذا الموقع؟'),
    welcomeMessage: text(
      "You're on the location dashboard. I can guide you through setup, products, orders, staff, reports, and daily operations.",
      'أنت الآن في لوحة تحكم الموقع. أستطيع إرشادك في الإعداد والمنتجات والطلبات والموظفين والتقارير والتشغيل اليومي.',
    ),
    defaultSuggestions: [
      text('How do I add a new product?', 'كيف أضيف منتجاً جديداً؟'),
      text('Where can I find my orders?', 'أين أجد طلباتي؟'),
      text('Show me my sales reports', 'أظهر لي تقارير المبيعات'),
    ],
    quickActions: [
      {
        id: 'dashboard-products',
        label: text('Products', 'المنتجات'),
        icon: 'package',
        type: 'navigate',
        path: '/dashboard/:locationSlug/products',
      },
      {
        id: 'dashboard-orders',
        label: text('Orders', 'الطلبات'),
        icon: 'clipboardList',
        type: 'navigate',
        path: '/dashboard/:locationSlug/orders',
      },
      {
        id: 'dashboard-reports',
        label: text('Reports', 'التقارير'),
        icon: 'barChart3',
        type: 'navigate',
        path: '/dashboard/:locationSlug/reports/sales',
      },
      {
        id: 'dashboard-staff',
        label: text('Staff', 'الموظفون'),
        icon: 'users',
        type: 'navigate',
        path: '/dashboard/:locationSlug/staff',
      },
    ],
  },
  {
    id: 'owner-billing',
    match: ['/owner/billing'],
    title: text('Owner Billing', 'فوترة المالك'),
    launcherPrompt: text('Need help with plans or invoices?', 'هل تحتاج مساعدة في الخطط أو الفواتير؟'),
    welcomeMessage: text(
      "You're on Owner Billing. I can explain plans, invoices, payment methods, and how additional locations are billed.",
      'أنت الآن في صفحة فوترة المالك. أستطيع شرح الخطط والفواتير وطرق الدفع وكيفية احتساب المواقع الإضافية.',
    ),
    defaultSuggestions: [
      text('How does billing work?', 'كيف تعمل الفوترة؟'),
      text('How do I update my payment method?', 'كيف أحدث طريقة الدفع؟'),
      text('How do extra locations affect pricing?', 'كيف تؤثر المواقع الإضافية على التسعير؟'),
    ],
    quickActions: [
      {
        id: 'owner-billing-help',
        label: text('Billing help', 'مساعدة الفوترة'),
        icon: 'creditCard',
        type: 'ask',
        query: text('How does billing work?', 'كيف تعمل الفوترة؟'),
      },
      {
        id: 'owner-establishments',
        label: text('Locations', 'المواقع'),
        icon: 'mapPinned',
        type: 'navigate',
        path: '/owner/establishments',
      },
    ],
  },
  {
    id: 'owner-brands',
    match: ['/owner/brands'],
    title: text('Owner Brands', 'علامات المالك التجارية'),
    launcherPrompt: text('Need help with brands or linked locations?', 'هل تحتاج مساعدة في العلامات التجارية أو ربط المواقع؟'),
    welcomeMessage: text(
      "You're on Owner Brands. I can help you create brands, link locations, and understand how the owner and brand portals work together.",
      'أنت الآن في صفحة العلامات التجارية للمالك. أستطيع مساعدتك في إنشاء العلامات وربط المواقع وشرح العلاقة بين بوابة المالك وبوابة العلامة.',
    ),
    defaultSuggestions: [
      text('How do I create a brand?', 'كيف أنشئ علامة تجارية؟'),
      text('How do I add or link a location to my brand?', 'كيف أضيف أو أربط موقعاً بعلامتي التجارية؟'),
      text('How do I manage multiple locations?', 'كيف أدير مواقع متعددة؟'),
    ],
    quickActions: [
      {
        id: 'owner-brands-create',
        label: text('Create brand', 'إنشاء علامة'),
        icon: 'building2',
        type: 'ask',
        query: text('How do I create a brand?', 'كيف أنشئ علامة تجارية؟'),
      },
      {
        id: 'owner-brands-locations',
        label: text('Locations', 'المواقع'),
        icon: 'mapPinned',
        type: 'navigate',
        path: '/owner/establishments',
      },
      {
        id: 'owner-brands-link',
        label: text('Link location', 'ربط موقع'),
        icon: 'tag',
        type: 'ask',
        query: text('How do I add or link a location to my brand?', 'كيف أضيف أو أربط موقعاً بعلامتي التجارية؟'),
      },
    ],
  },
  {
    id: 'owner-establishments',
    match: ['/owner/establishments'],
    title: text('Owner Locations', 'مواقع المالك'),
    launcherPrompt: text('Need help with locations?', 'هل تحتاج مساعدة في المواقع؟'),
    welcomeMessage: text(
      "You're on Owner Locations. I can help you create a new location, review existing ones, and plan brand links.",
      'أنت الآن في صفحة مواقع المالك. أستطيع مساعدتك في إنشاء موقع جديد ومراجعة المواقع الحالية والتخطيط لربطها بالعلامات.',
    ),
    defaultSuggestions: [
      text('How do I create a new location?', 'كيف أنشئ موقعاً جديداً؟'),
      text('How do I manage multiple locations?', 'كيف أدير مواقع متعددة؟'),
      text('How do I add or link a location to my brand?', 'كيف أضيف أو أربط موقعاً بعلامتي التجارية؟'),
    ],
    quickActions: [
      {
        id: 'owner-establishments-create',
        label: text('Add location', 'إضافة موقع'),
        icon: 'mapPinned',
        type: 'navigate',
        path: '/onboarding',
        fallbackPath: '/owner/establishments',
      },
      {
        id: 'owner-establishments-brand',
        label: text('Create brand', 'إنشاء علامة'),
        icon: 'building2',
        type: 'navigate',
        path: '/owner/brands',
      },
    ],
  },
  {
    id: 'owner-overview',
    match: ['/owner'],
    title: text('Owner Overview', 'نظرة المالك العامة'),
    launcherPrompt: text('Need help in the owner portal?', 'هل تحتاج مساعدة في بوابة المالك؟'),
    welcomeMessage: text(
      "You're in the owner portal. I can help you with locations, brands, billing, account-wide staff, and setup planning.",
      'أنت الآن في بوابة المالك. أستطيع مساعدتك في المواقع والعلامات التجارية والفوترة وموظفي الحساب وخطة الإعداد.',
    ),
    defaultSuggestions: [
      text('How do I create a new location?', 'كيف أنشئ موقعاً جديداً؟'),
      text('How do I create a brand?', 'كيف أنشئ علامة تجارية؟'),
      text('How does billing work?', 'كيف تعمل الفوترة؟'),
    ],
    quickActions: [
      {
        id: 'owner-overview-locations',
        label: text('Locations', 'المواقع'),
        icon: 'mapPinned',
        type: 'navigate',
        path: '/owner/establishments',
      },
      {
        id: 'owner-overview-brands',
        label: text('Brands', 'العلامات'),
        icon: 'building2',
        type: 'navigate',
        path: '/owner/brands',
      },
      {
        id: 'owner-overview-billing',
        label: text('Billing', 'الفوترة'),
        icon: 'creditCard',
        type: 'navigate',
        path: '/owner/billing',
      },
    ],
  },
  {
    id: 'brand-locations',
    match: ['/brand/:brandId/locations'],
    title: text('Brand Locations', 'مواقع العلامة التجارية'),
    launcherPrompt: text('Need help linking locations to this brand?', 'هل تحتاج مساعدة في ربط المواقع بهذه العلامة؟'),
    welcomeMessage: text(
      "You're on Brand Locations. I can help you link unassigned locations, review brand structure, and explain the brand workflow.",
      'أنت الآن في صفحة مواقع العلامة التجارية. أستطيع مساعدتك في ربط المواقع غير المرتبطة ومراجعة هيكل العلامة وشرح سير العمل.',
    ),
    defaultSuggestions: [
      text('How do I add or link a location to my brand?', 'كيف أضيف أو أربط موقعاً بعلامتي التجارية؟'),
      text('How do I create a new location?', 'كيف أنشئ موقعاً جديداً؟'),
      text('How do I manage multiple locations?', 'كيف أدير مواقع متعددة؟'),
    ],
    quickActions: [
      {
        id: 'brand-locations-link',
        label: text('Link location', 'ربط موقع'),
        icon: 'mapPinned',
        type: 'ask',
        query: text('How do I add or link a location to my brand?', 'كيف أضيف أو أربط موقعاً بعلامتي التجارية؟'),
      },
      {
        id: 'brand-locations-owner',
        label: text('Owner brands', 'علامات المالك'),
        icon: 'building2',
        type: 'navigate',
        path: '/owner/brands',
      },
    ],
  },
  {
    id: 'brand-team',
    match: ['/brand/:brandId/team'],
    title: text('Brand Team', 'فريق العلامة التجارية'),
    launcherPrompt: text('Need help with the brand team?', 'هل تحتاج مساعدة في فريق العلامة التجارية؟'),
    welcomeMessage: text(
      "You're on Brand Team. I can help you understand how brand-level people and location-level staff should be organized.",
      'أنت الآن في صفحة فريق العلامة التجارية. أستطيع مساعدتك في فهم تنظيم فريق العلامة مقابل موظفي المواقع.',
    ),
    defaultSuggestions: [
      text('How do I add staff members?', 'كيف أضيف موظفين؟'),
      text('How do I set up roles and permissions?', 'كيف أعد الأدوار والصلاحيات؟'),
    ],
    quickActions: [
      {
        id: 'brand-team-roles',
        label: text('Roles', 'الأدوار'),
        icon: 'shield',
        type: 'ask',
        query: text('How do I set up roles and permissions?', 'كيف أعد الأدوار والصلاحيات؟'),
      },
      {
        id: 'brand-team-locations',
        label: text('Locations', 'المواقع'),
        icon: 'mapPinned',
        type: 'navigate',
        path: '/brand/:brandId/locations',
      },
    ],
  },
  {
    id: 'brand-overview',
    match: ['/brand/:brandId'],
    title: text('Brand Dashboard', 'لوحة العلامة التجارية'),
    launcherPrompt: text('Need help in this brand dashboard?', 'هل تحتاج مساعدة في لوحة هذه العلامة التجارية؟'),
    welcomeMessage: text(
      "You're on the brand dashboard. I can help you review locations, compare performance, and manage brand-wide structure.",
      'أنت الآن في لوحة العلامة التجارية. أستطيع مساعدتك في مراجعة المواقع ومقارنة الأداء وإدارة الهيكل العام للعلامة.',
    ),
    defaultSuggestions: [
      text('How do I add or link a location to my brand?', 'كيف أضيف أو أربط موقعاً بعلامتي التجارية؟'),
      text('How do I manage multiple locations?', 'كيف أدير مواقع متعددة؟'),
      text('Show me my sales reports', 'أظهر لي تقارير المبيعات'),
    ],
    quickActions: [
      {
        id: 'brand-overview-locations',
        label: text('Locations', 'المواقع'),
        icon: 'mapPinned',
        type: 'navigate',
        path: '/brand/:brandId/locations',
      },
      {
        id: 'brand-overview-team',
        label: text('Team', 'الفريق'),
        icon: 'users',
        type: 'navigate',
        path: '/brand/:brandId/team',
      },
      {
        id: 'brand-overview-reports',
        label: text('Reports', 'التقارير'),
        icon: 'barChart3',
        type: 'ask',
        query: text('Show me my sales reports', 'أظهر لي تقارير المبيعات'),
      },
    ],
  },
  {
    id: 'support',
    match: ['/support', '/support/*'],
    title: text('Support', 'الدعم'),
    launcherPrompt: text('Need help finding an answer?', 'هل تحتاج مساعدة في العثور على إجابة؟'),
    welcomeMessage: text(
      "You're in Support. I can help you find the right article, clarify a workflow, or point you to the next step.",
      'أنت الآن في صفحة الدعم. أستطيع مساعدتك في العثور على المقال المناسب أو توضيح سير العمل أو إرشادك للخطوة التالية.',
    ),
    defaultSuggestions: [
      text('How do I get started with Mintcom?', 'كيف أبدأ مع مينتكوم؟'),
      text('How do I contact support?', 'كيف أتواصل مع الدعم؟'),
      text('How do I create a Mintcom account?', 'كيف أنشئ حساب مينتكوم؟'),
    ],
    quickActions: [
      {
        id: 'support-contact',
        label: text('Contact support', 'التواصل مع الدعم'),
        icon: 'lightbulb',
        type: 'ask',
        query: text('How do I contact support?', 'كيف أتواصل مع الدعم؟'),
      },
      {
        id: 'support-login',
        label: text('Login help', 'مساعدة الدخول'),
        icon: 'shield',
        type: 'ask',
        query: text('I forgot my password. How can I reset it?', 'نسيت كلمة المرور. كيف أعيد تعيينها؟'),
      },
    ],
  },
  {
    id: 'onboarding',
    match: ['/onboarding', '/onboarding/step/:step'],
    title: text('Onboarding', 'الإعداد'),
    launcherPrompt: text('Need help finishing setup?', 'هل تحتاج مساعدة في إكمال الإعداد؟'),
    welcomeMessage: text(
      "You're in onboarding. I can help you finish setup, understand each step, and prepare the first location correctly.",
      'أنت الآن في الإعداد. أستطيع مساعدتك في إكمال الخطوات وفهم كل مرحلة وتجهيز أول موقع بشكل صحيح.',
    ),
    defaultSuggestions: [
      text('How does the onboarding process work?', 'كيف تعمل عملية الإعداد؟'),
      text('How do I get started with Mintcom?', 'كيف أبدأ مع مينتكوم؟'),
      text('How do I create a new location?', 'كيف أنشئ موقعاً جديداً؟'),
    ],
    quickActions: [
      {
        id: 'onboarding-steps',
        label: text('Setup steps', 'خطوات الإعداد'),
        icon: 'layoutDashboard',
        type: 'ask',
        query: text('How does the onboarding process work?', 'كيف تعمل عملية الإعداد؟'),
      },
      {
        id: 'onboarding-profile',
        label: text('Business setup', 'إعداد النشاط'),
        icon: 'store',
        type: 'ask',
        query: text('What do I need for the first onboarding step?', 'ماذا أحتاج للخطوة الأولى في الإعداد؟'),
      },
    ],
  },
  {
    id: 'login',
    match: ['/login', '/forgot-password', '/reset-password'],
    title: text('Login', 'تسجيل الدخول'),
    launcherPrompt: text('Need help signing in?', 'هل تحتاج مساعدة في تسجيل الدخول؟'),
    welcomeMessage: text(
      "You're on the sign-in flow. I can help with login, password reset, account access, and what to do if a session expires.",
      'أنت الآن في مسار تسجيل الدخول. أستطيع مساعدتك في الدخول وإعادة تعيين كلمة المرور والوصول للحساب وما يجب فعله عند انتهاء الجلسة.',
    ),
    defaultSuggestions: [
      text('How do I log in to my account?', 'كيف أسجل الدخول إلى حسابي؟'),
      text('I forgot my password. How can I reset it?', 'نسيت كلمة المرور. كيف أعيد تعيينها؟'),
      text('I got logged out / session expired. Why?', 'تم تسجيل خروجي أو انتهت الجلسة. لماذا؟'),
    ],
    quickActions: [
      {
        id: 'login-password',
        label: text('Reset password', 'إعادة التعيين'),
        icon: 'shield',
        type: 'navigate',
        path: '/forgot-password',
      },
      {
        id: 'login-signup',
        label: text('Create account', 'إنشاء حساب'),
        icon: 'star',
        type: 'navigate',
        path: '/signup',
      },
    ],
  },
  {
    id: 'signup',
    match: ['/signup', '/verify-email'],
    title: text('Signup', 'إنشاء الحساب'),
    launcherPrompt: text('Need help creating an account?', 'هل تحتاج مساعدة في إنشاء الحساب؟'),
    welcomeMessage: text(
      "You're on signup. I can help you create an account, explain the trial, and walk through the first setup steps.",
      'أنت الآن في صفحة إنشاء الحساب. أستطيع مساعدتك في إنشاء الحساب وشرح التجربة الأولى وخطوات الإعداد الأساسية.',
    ),
    defaultSuggestions: [
      text('How do I create a Mintcom account?', 'كيف أنشئ حساب مينتكوم؟'),
      text('How do I get started with Mintcom?', 'كيف أبدأ مع مينتكوم؟'),
      text('How does billing work?', 'كيف تعمل الفوترة؟'),
    ],
    quickActions: [
      {
        id: 'signup-account',
        label: text('Create account', 'إنشاء حساب'),
        icon: 'star',
        type: 'ask',
        query: text('How do I create a Mintcom account?', 'كيف أنشئ حساب مينتكوم؟'),
      },
      {
        id: 'signup-login',
        label: text('Login instead', 'الذهاب للدخول'),
        icon: 'shield',
        type: 'navigate',
        path: '/login',
      },
    ],
  },
  {
    id: 'public-home',
    match: ['/'],
    title: text('Mintcom', 'مينتكوم'),
    launcherPrompt: text('Need help exploring Mintcom?', 'هل تحتاج مساعدة في استكشاف مينتكوم؟'),
    welcomeMessage: text(
      "You're on the main site. I can help you understand Mintcom, create an account, and find the right place to start.",
      'أنت الآن في الموقع الرئيسي. أستطيع مساعدتك في فهم مينتكوم وإنشاء حساب والعثور على أفضل نقطة للبداية.',
    ),
    defaultSuggestions: [
      text('What is Mintcom?', 'ما هو مينتكوم؟'),
      text('How do I get started with Mintcom?', 'كيف أبدأ مع مينتكوم؟'),
      text('How does billing work?', 'كيف تعمل الفوترة؟'),
    ],
    quickActions: [
      {
        id: 'public-signup',
        label: text('Sign up', 'إنشاء حساب'),
        icon: 'star',
        type: 'navigate',
        path: '/signup',
      },
      {
        id: 'public-login',
        label: text('Login', 'تسجيل الدخول'),
        icon: 'shield',
        type: 'navigate',
        path: '/login',
      },
      {
        id: 'public-pricing',
        label: text('Pricing', 'الأسعار'),
        icon: 'creditCard',
        type: 'ask',
        query: text('How does billing work?', 'كيف تعمل الفوترة؟'),
      },
    ],
  },
];

const resolveTemplatePath = (template: string, params: Record<string, string | undefined>) =>
  template.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => {
    const value = params[key];

    if (value) {
      return value;
    }

    if (key === 'location' && params.locationSlug) {
      return params.locationSlug;
    }

    if (key === 'brand' && params.brandId) {
      return params.brandId;
    }

    return `:${key}`;
  });

const localize = (value: LocalizedChatText, useArabic: boolean) => (useArabic ? value.ar : value.en);

const resolveAction = (
  action: ChatActionDefinition,
  params: Record<string, string | undefined>,
  useArabic: boolean,
): ResolvedChatAction => {
  const resolvedPath = action.path ? resolveTemplatePath(action.path, params) : undefined;
  const fallbackPath = action.fallbackPath ? resolveTemplatePath(action.fallbackPath, params) : undefined;

  return {
    id: action.id,
    label: localize(action.label, useArabic),
    icon: action.icon,
    type: action.type,
    query: action.query ? localize(action.query, useArabic) : undefined,
    path: resolvedPath && !resolvedPath.includes(':') ? resolvedPath : fallbackPath,
    state: action.state,
  };
};

function getSignedInPublicHomeContext(
  params: Record<string, string | undefined>,
  useArabic: boolean,
  options?: ChatbotPageContextOptions,
): ResolvedChatbotPageContext {
  const dashboardPath = options?.dashboardPath ?? '/select-establishment';
  const hasDashboard = dashboardPath !== '/select-establishment';
  const canAccessOwnerPortal = Boolean(options?.canAccessOwnerPortal);
  const welcomeMessage = hasDashboard
    ? text(
        "You're already signed in. I can help you jump back into your dashboard, review products, check reports, or find the next admin task.",
        'أنت مسجل الدخول بالفعل. أستطيع مساعدتك في العودة إلى لوحة التحكم ومراجعة المنتجات والاطلاع على التقارير ومعرفة الخطوة الإدارية التالية.',
      )
    : text(
        "You're already signed in. I can help you choose a location, continue setup, review billing, or get support.",
        'أنت مسجل الدخول بالفعل. أستطيع مساعدتك في اختيار موقع ومتابعة الإعداد ومراجعة الفوترة أو الوصول إلى الدعم.',
      );
  const defaultSuggestions = hasDashboard
    ? [
        text('Take me back to my dashboard', 'خذني إلى لوحة التحكم'),
        text('How do I manage products?', 'كيف أدير المنتجات؟'),
        text('Show me where sales reports are', 'أرني أين توجد تقارير المبيعات'),
      ]
    : [
        text('How do I choose a location?', 'كيف أختار موقعًا؟'),
        text('How do I continue setup?', 'كيف أتابع الإعداد؟'),
        text('How does billing work?', 'كيف تعمل الفوترة؟'),
      ];
  const quickActions: ChatActionDefinition[] = hasDashboard
    ? [
        {
          id: 'signedin-dashboard',
          label: text('Open dashboard', 'فتح لوحة التحكم'),
          icon: 'layoutDashboard',
          type: 'navigate',
          path: dashboardPath,
        },
        {
          id: 'signedin-products',
          label: text('Products', 'المنتجات'),
          icon: 'package',
          type: 'navigate',
          path: `${dashboardPath}/products`,
        },
        {
          id: 'signedin-reports',
          label: text('Reports', 'التقارير'),
          icon: 'barChart3',
          type: 'navigate',
          path: `${dashboardPath}/reports/sales`,
        },
        canAccessOwnerPortal
          ? {
              id: 'signedin-owner',
              label: text('Owner portal', 'بوابة المالك'),
              icon: 'building2',
              type: 'navigate',
              path: '/owner',
            }
          : {
              id: 'signedin-support',
              label: text('Support', 'الدعم'),
              icon: 'shield',
              type: 'navigate',
              path: '/support',
            },
      ]
    : [
        {
          id: 'signedin-locations',
          label: text('Choose location', 'اختيار موقع'),
          icon: 'mapPinned',
          type: 'navigate',
          path: '/select-establishment',
        },
        {
          id: 'signedin-setup',
          label: text('Continue setup', 'متابعة الإعداد'),
          icon: 'layoutDashboard',
          type: 'navigate',
          path: '/select-establishment',
        },
        canAccessOwnerPortal
          ? {
              id: 'signedin-billing',
              label: text('Billing', 'الفوترة'),
              icon: 'creditCard',
              type: 'navigate',
              path: '/owner/billing',
            }
          : {
              id: 'signedin-help',
              label: text('Account help', 'مساعدة الحساب'),
              icon: 'shield',
              type: 'navigate',
              path: '/support',
            },
        {
          id: 'signedin-support',
          label: text('Support', 'الدعم'),
          icon: 'shield',
          type: 'navigate',
          path: '/support',
        },
      ];

  return {
    id: 'public-home',
    title: localize(text('Mintcom', 'مينتكوم'), useArabic),
    launcherPrompt: localize(
      text('Need help getting back into Mintcom?', 'هل تحتاج مساعدة في العودة إلى مينتكوم؟'),
      useArabic,
    ),
    welcomeMessage: localize(welcomeMessage, useArabic),
    defaultSuggestions: defaultSuggestions.map((item) => localize(item, useArabic)),
    quickActions: quickActions.map((action) => resolveAction(action, params, useArabic)),
    params,
  };
}

export function resolveChatbotPageContext(
  pathname: string,
  useArabic: boolean,
  options?: ChatbotPageContextOptions,
): ResolvedChatbotPageContext {
  for (const pageContext of PAGE_CONTEXTS) {
    for (const pattern of pageContext.match) {
      const isWildcard = pattern.endsWith('*');
      const match = matchPath({ path: pattern, end: !isWildcard }, pathname);

      if (!match) {
        continue;
      }

      if (pageContext.id === 'public-home' && options?.isAuthenticated) {
        return getSignedInPublicHomeContext(match.params, useArabic, options);
      }

      return {
        id: pageContext.id,
        title: localize(pageContext.title, useArabic),
        launcherPrompt: localize(pageContext.launcherPrompt, useArabic),
        welcomeMessage: localize(pageContext.welcomeMessage, useArabic),
        defaultSuggestions: pageContext.defaultSuggestions.map((item) => localize(item, useArabic)),
        quickActions: pageContext.quickActions.map((action) => resolveAction(action, match.params, useArabic)),
        params: match.params,
      };
    }
  }

  const fallback = PAGE_CONTEXTS[PAGE_CONTEXTS.length - 1];

  if (fallback.id === 'public-home' && options?.isAuthenticated) {
    return getSignedInPublicHomeContext({}, useArabic, options);
  }

  return {
    id: fallback.id,
    title: localize(fallback.title, useArabic),
    launcherPrompt: localize(fallback.launcherPrompt, useArabic),
    welcomeMessage: localize(fallback.welcomeMessage, useArabic),
    defaultSuggestions: fallback.defaultSuggestions.map((item) => localize(item, useArabic)),
    quickActions: fallback.quickActions.map((action) => resolveAction(action, {}, useArabic)),
    params: {},
  };
}

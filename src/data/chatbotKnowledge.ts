/**
 * PayMint AI Chatbot Knowledge Base
 * Comprehensive information from User Manual v6.1 and application structure
 * This creates a friendly, helpful AI assistant named Minto
 */

export interface KnowledgeEntry {
  id: string;
  keywords: string[];
  question: string;
  questionAr?: string;
  answer: string;
  answerAr?: string;
  category: 'navigation' | 'feature' | 'billing' | 'technical' | 'account' | 'getting-started' | 'products' | 'orders' | 'staff' | 'reports' | 'settings' | 'pos' | 'shifts' | 'payments' | 'loyalty' | 'troubleshooting';
  navigationPath?: string;
  relatedTopics?: string[];
}

export const PAYMINT_KNOWLEDGE: KnowledgeEntry[] = [
  // ========== GETTING STARTED ==========
  {
    id: 'welcome',
    keywords: ['start', 'begin', 'new', 'first', 'getting started', 'how to use', 'introduction', 'hello', 'hi', 'help', 'بدء', 'جديد', 'أول', 'كيف أبدأ', 'كيف ابدا', 'مقدمة', 'مساعدة', 'ابدأ'],
    question: 'How do I get started with PayMint?',
    questionAr: 'كيف أبدأ مع بيمنت؟',
    answer: `Great question! Getting started with PayMint is easy. Here's what you need to do:

1. **Sign Up** - Create your account on our website
2. **Verify Email** - Check your inbox and click the verification link
3. **Complete Onboarding** - Set up your first establishment with business details
4. **Add Products** - Create your menu items and categories
5. **Start Selling** - You're ready to process your first order!

The whole process takes just a few minutes. What would you like help with first?`,
    answerAr: `البدء مع بيمنت سهل جداً! إليك الخطوات:

1. **إنشاء حساب** - سجل في موقعنا
2. **تأكيد البريد** - افتح بريدك واضغط على رابط التأكيد
3. **إكمال الإعداد** - أدخل تفاصيل عملك
4. **إضافة المنتجات** - أنشئ أصناف القائمة والتصنيفات
5. **ابدأ البيع** - أنت جاهز لمعالجة أول طلب!

العملية تستغرق دقائق فقط. بماذا تريد المساعدة أولاً؟`,
    category: 'getting-started',
    navigationPath: '/signup',
    relatedTopics: ['signup', 'onboarding', 'products']
  },
  {
    id: 'what-is-PayMint',
    keywords: ['what is PayMint', 'about PayMint', 'PayMint features', 'what does PayMint do', 'explain PayMint', 'ما هو بيمنت', 'عن بيمنت', 'ميزات بيمنت', 'ماذا يفعل بيمنت', 'ايش بيمنت'],
    question: 'What is PayMint?',
    questionAr: 'ما هو بيمنت؟',
    answer: `PayMint is a comprehensive Point of Sale (POS) system designed for restaurants, cafes, and retail establishments!

**Key Features:**
- Multi-device support - connect multiple devices to one account
- Real-time sales tracking and analytics
- Shift management with cash reconciliation
- Inventory control with low-stock alerts
- Built-in loyalty program for customer rewards
- Multi-language support (English & Arabic)
- Detailed reports with PDF export
- Split payment handling

It's designed to make your daily operations smooth and efficient!`,
    answerAr: `بيمنت هو نظام نقاط بيع (POS) شامل مصمم للمطاعم والكافيهات ومحلات التجزئة!

**الميزات الرئيسية:**
- دعم أجهزة متعددة متصلة بحساب واحد
- تتبع المبيعات والتحليلات بشكل فوري
- إدارة الورديات مع مطابقة النقد
- مراقبة المخزون مع تنبيهات النقص
- برنامج ولاء مدمج لمكافأة العملاء
- دعم اللغتين العربية والإنجليزية
- تقارير مفصلة مع تصدير PDF
- دعم الدفع المقسم

مصمم لجعل عملياتك اليومية سلسة وفعالة!`,
    category: 'getting-started',
    relatedTopics: ['features', 'pricing']
  },
  {
    id: 'signup',
    keywords: ['sign up', 'signup', 'register', 'create account', 'new account', 'join', 'تسجيل', 'إنشاء حساب', 'حساب جديد', 'انضمام', 'اشتراك'],
    question: 'How do I create a PayMint account?',
    questionAr: 'كيف أنشئ حساب بيمنت؟',
    answer: `Creating your PayMint account is quick and easy!

1. Click **"Sign Up"** or visit the signup page
2. Enter your **email address** and create a strong password
3. Fill in your **business details** (name, phone)
4. Click **"Sign Up"** to create your account
5. Check your email and click the **verification link**

Once verified, you'll go through our onboarding wizard to set up your first establishment. New users get a **7-day free trial** with full access to all features!`,
    answerAr: `إنشاء حساب بيمنت سريع وسهل!

1. اضغط **"تسجيل"** أو زر صفحة التسجيل
2. أدخل **بريدك الإلكتروني** وأنشئ كلمة مرور قوية
3. أكمل **تفاصيل عملك** (الاسم، الهاتف)
4. اضغط **"تسجيل"** لإنشاء حسابك
5. افتح بريدك واضغط على **رابط التأكيد**

بعد التأكيد، ستمر بمعالج الإعداد لتهيئة أول موقع لك. المستخدمون الجدد يحصلون على **تجربة مجانية 7 أيام**!`,
    category: 'getting-started',
    navigationPath: '/signup'
  },
  {
    id: 'login',
    keywords: ['login', 'log in', 'sign in', 'signin', 'access', 'enter', 'cant log in', 'تسجيل دخول', 'دخول', 'الوصول', 'ما أقدر أدخل'],
    question: 'How do I log in to my account?',
    questionAr: 'كيف أسجل الدخول؟',
    answer: `There are two ways to log in:

**Option 1: Web Dashboard**
1. Go to the login page
2. Enter your email and password
3. Click "Log In"

**Option 2: POS App (for staff)**
1. Select your profile from the staff list
2. Enter your 4-digit PIN
3. You're in!

Forgot your password? No worries - just click "Forgot Password" and we'll send you a reset link!`,
    answerAr: `هناك طريقتان لتسجيل الدخول:

**الطريقة 1: لوحة التحكم**
1. اذهب لصفحة الدخول
2. أدخل بريدك وكلمة المرور
3. اضغط "تسجيل الدخول"

**الطريقة 2: تطبيق نقاط البيع (للموظفين)**
1. اختر ملفك من قائمة الموظفين
2. أدخل رقم PIN المكون من 4 أرقام

نسيت كلمة المرور؟ اضغط "نسيت كلمة المرور" وسنرسل لك رابط إعادة التعيين!`,
    category: 'account',
    navigationPath: '/login'
  },
  {
    id: 'forgot-password',
    keywords: ['forgot password', 'reset password', 'password recovery', 'cant login', 'lost password', 'change password', 'نسيت كلمة المرور', 'استعادة كلمة المرور', 'تغيير كلمة المرور', 'إعادة تعيين', 'نسيت الباسورد'],
    question: 'I forgot my password. How can I reset it?',
    questionAr: 'نسيت كلمة المرور. كيف أستعيدها؟',
    answer: `No worries, it happens to the best of us! Here's how to reset your password:

1. Go to the **login page**
2. Click **"Forgot Password"**
3. Enter your registered **email address**
4. Check your inbox for the **reset link** (check spam too!)
5. Click the link and create a **new password**

The reset link expires in **24 hours** for security.`,
    answerAr: `لا تقلق! إليك طريقة إعادة تعيين كلمة المرور:

1. اذهب لصفحة **تسجيل الدخول**
2. اضغط **"نسيت كلمة المرور"**
3. أدخل **بريدك الإلكتروني** المسجل
4. افتح بريدك واضغط على **رابط إعادة التعيين** (تفقد مجلد الرسائل غير المرغوبة أيضاً!)
5. أنشئ **كلمة مرور جديدة**

ينتهي صلاحية الرابط خلال **24 ساعة** للأمان.`,
    category: 'account',
    navigationPath: '/forgot-password'
  },
  {
    id: 'onboarding',
    keywords: ['onboarding', 'setup', 'first time', 'new establishment', 'create store', 'add location', 'إعداد', 'تهيئة', 'أول مرة', 'موقع جديد', 'إنشاء متجر', 'إضافة موقع'],
    question: 'How does the onboarding process work?',
    questionAr: 'كيف تعمل عملية الإعداد؟',
    answer: `Our onboarding wizard makes setup a breeze! It's a 4-step process:

**Step 1: Establishment Details**
- Business name and category (Restaurant, Cafe, Retail)
- Contact info and address
- Currency settings

**Step 2: Subscription & Payment**
- New users get a 7-day free trial!
- Securely link your payment card

**Step 3: Establishment Credentials**
- Create a unique Establishment ID (e.g., "downtown-cafe")
- Set a password for POS app connections

**Step 4: First Admin Profile**
- Create the primary administrator account`,
    answerAr: `معالج الإعداد يجعل التهيئة سهلة! العملية من 4 خطوات:

**الخطوة 1: تفاصيل المنشأة** - اسم العمل والفئة والعنوان والعملة
**الخطوة 2: الاشتراك والدفع** - تجربة مجانية 7 أيام! ربط بطاقة الدفع
**الخطوة 3: بيانات المنشأة** - إنشاء معرف فريد وكلمة مرور للتطبيق
**الخطوة 4: ملف المسؤول الأول** - إنشاء حساب المسؤول الرئيسي`,
    category: 'getting-started',
    navigationPath: '/onboarding'
  },

  // ========== SHIFTS ==========
  {
    id: 'start-shift',
    keywords: ['start shift', 'begin shift', 'open shift', 'clock in', 'opening cash', 'new shift', 'بدء وردية', 'فتح وردية', 'وردية جديدة', 'الوردية', 'بداية وردية'],
    question: 'How do I start a shift?',
    questionAr: 'كيف أبدأ وردية؟',
    answer: `Starting your shift is simple!

1. **Log in** to the POS app
2. If no shift is active, you'll be prompted to start one
3. **Count the cash** in your drawer
4. Enter the **opening cash amount**
5. Tap **"Start Shift"** to begin!

The system will track all your transactions until you close the shift. Only one shift can be active at a time.`,
    answerAr: `بدء الوردية سهل!

1. **سجل الدخول** لتطبيق نقاط البيع
2. إذا لم تكن هناك وردية نشطة، سيُطلب منك بدء واحدة
3. **عدّ النقد** في الصندوق
4. أدخل **مبلغ النقد الافتتاحي**
5. اضغط **"بدء الوردية"**!

النظام سيتتبع جميع معاملاتك حتى تغلق الوردية. يمكن أن تكون وردية واحدة فقط نشطة في كل مرة.`,
    category: 'shifts',
    relatedTopics: ['end-shift', 'cash-management']
  },
  {
    id: 'end-shift',
    keywords: ['end shift', 'close shift', 'z-report', 'cash out', 'finish shift', 'clock out', 'إنهاء وردية', 'إغلاق وردية', 'تقرير زد', 'نهاية الوردية', 'قفل الوردية'],
    question: 'How do I end my shift and print a Z-Report?',
    questionAr: 'كيف أنهي الوردية وأطبع تقرير Z؟',
    answer: `Here's how to properly close your shift:

1. Go to the **Dashboard**
2. Tap **"End Shift"**
3. Review your **Shift Summary** (total sales, cash/card sales, PAY-IN/PAY-OUT)
4. **Count the physical cash** in your drawer
5. Enter the **counted amount**
6. The system shows any **discrepancy** (over/short)
7. Tap **"Close Shift"** to finalize

You'll be prompted to print the **Z-Report** - your official shift summary receipt!`,
    answerAr: `إليك طريقة إغلاق الوردية:

1. اذهب إلى **لوحة التحكم**
2. اضغط **"إنهاء الوردية"**
3. راجع **ملخص الوردية** (إجمالي المبيعات، نقد/بطاقة)
4. **عدّ النقد الفعلي** في الصندوق
5. أدخل **المبلغ المحسوب**
6. النظام يعرض أي **فرق** (زيادة/نقص)
7. اضغط **"إغلاق الوردية"**

سيُطلب منك طباعة **تقرير Z** - ملخص الوردية الرسمي!`,
    category: 'shifts',
    relatedTopics: ['start-shift', 'reports']
  },
  {
    id: 'cash-management',
    keywords: ['cash in', 'cash out', 'PAY-IN', 'PAY-OUT', 'petty cash', 'add cash', 'remove cash', 'إدخال نقد', 'سحب نقد', 'إدارة النقد', 'صندوق النقد', 'نقد'],
    question: 'How do I manage cash in/out during my shift?',
    questionAr: 'كيف أدير النقد أثناء الوردية؟',
    answer: `You can easily track cash movements that aren't from sales:

**Cash In (PAY-IN):**
- Used when adding cash to the drawer
- Tap **"Cash In"** on the Dashboard
- Enter the amount and reason

**Cash Out (PAY-OUT):**
- Used when removing cash
- Tap **"Cash Out"** on the Dashboard
- Enter the amount and reason

All cash movements are recorded and included in your shift summary.`,
    answerAr: `يمكنك تتبع حركات النقد بسهولة:

**إدخال نقد:** لإضافة نقد للصندوق - اضغط "إدخال نقد" وأدخل المبلغ والسبب
**سحب نقد:** لسحب نقد من الصندوق - اضغط "سحب نقد" وأدخل المبلغ والسبب

جميع حركات النقد تُسجل وتُضمن في ملخص الوردية.`,
    category: 'shifts',
    relatedTopics: ['end-shift']
  },

  // ========== PRODUCTS ==========
  {
    id: 'add-product',
    keywords: ['add product', 'new product', 'create product', 'product', 'item', 'menu item', 'add item', 'إضافة منتج', 'منتج جديد', 'إنشاء منتج', 'منتج', 'صنف', 'عنصر', 'اضافة منتج'],
    question: 'How do I add a new product?',
    questionAr: 'كيف أضيف منتج جديد؟',
    answer: `Adding products is easy! Here's how:

1. Go to **Dashboard > Products**
2. Click **"Add Product"** or **"New Item"**
3. Fill in the details:
   - **Product Name** - what customers see
   - **Price** - selling price
   - **Category** - for organization
   - **Description** - optional details
   - **Cost Price** - for profit tracking
   - **SKU/Barcode** - for scanning (optional)
   - **Image** - tap the camera icon to upload
4. Toggle **"Track Stock"** if you want inventory tracking
5. Click **"Save"**

Your product is now ready to sell!`,
    answerAr: `إضافة المنتجات سهلة! إليك الطريقة:

1. اذهب إلى **لوحة التحكم > المنتجات**
2. اضغط **"إضافة منتج"**
3. أكمل التفاصيل:
   - **اسم المنتج** - ما يراه العملاء
   - **السعر** - سعر البيع
   - **التصنيف** - للتنظيم
   - **سعر التكلفة** - لتتبع الأرباح
   - **الباركود** - للمسح (اختياري)
   - **الصورة** - لرفع صورة المنتج
4. فعّل **"تتبع المخزون"** إذا أردت
5. اضغط **"حفظ"**

منتجك جاهز للبيع الآن! 🎉`,
    category: 'products',
    navigationPath: '/dashboard/:location/products',
    relatedTopics: ['categories', 'inventory', 'addons']
  },
  {
    id: 'categories',
    keywords: ['category', 'categories', 'organize', 'group products', 'product groups', 'menu structure', 'تصنيف', 'تصنيفات', 'تنظيم', 'تجميع المنتجات', 'فئة', 'فئات'],
    question: 'How do I organize products into categories?',
    questionAr: 'كيف أنظم المنتجات في تصنيفات؟',
    answer: `Categories help organize your menu and make it easier for staff to find items!

**Creating Categories:**
1. Go to **Dashboard > Categories**
2. Click **"Add Category"**
3. Choose an **icon** and enter a **name**
4. Save!

**Tips:**
- Categories appear on your POS sales screen for quick filtering
- You can drag and drop to reorder categories
- A category can't be deleted if it has products - reassign them first`,
    answerAr: `التصنيفات تساعد في تنظيم القائمة وتسهل على الموظفين إيجاد الأصناف!

**إنشاء تصنيف:**
1. اذهب إلى **لوحة التحكم > التصنيفات**
2. اضغط **"إضافة تصنيف"**
3. اختر **أيقونة** وأدخل **الاسم**
4. احفظ!

التصنيفات تظهر على شاشة البيع للفلترة السريعة. يمكنك سحب وإفلات لإعادة الترتيب.`,
    category: 'products',
    navigationPath: '/dashboard/:location/categories',
    relatedTopics: ['add-product']
  },
  {
    id: 'inventory',
    keywords: ['inventory', 'stock', 'track stock', 'low stock', 'out of stock', 'quantity', 'stock levels', 'مخزون', 'تتبع المخزون', 'مخزون منخفض', 'نفاد المخزون', 'كمية', 'جرد'],
    question: 'How do I track inventory?',
    questionAr: 'كيف أتتبع المخزون؟',
    answer: `PayMint makes inventory tracking automatic!

**Enabling Stock Tracking:**
1. Go to **Products** and edit a product
2. Toggle **"Track Stock"** ON
3. Set your **initial quantity**
4. Optionally set a **low stock threshold**
5. Save

**How It Works:**
- Stock **automatically decreases** when items sell
- You get **alerts** when stock is low
- Option to prevent selling out-of-stock items

**Updating Stock:**
Go to **Settings > Stock Management**, find the product, and adjust the quantity.`,
    answerAr: `بيمنت يجعل تتبع المخزون تلقائياً!

**تفعيل تتبع المخزون:**
1. اذهب إلى **المنتجات** وعدّل المنتج
2. فعّل **"تتبع المخزون"**
3. حدد **الكمية الأولية**
4. حدد **حد المخزون المنخفض** (اختياري)

**كيف يعمل:**
- المخزون **ينقص تلقائياً** عند البيع
- تحصل على **تنبيهات** عند انخفاض المخزون
- خيار منع بيع الأصناف المنتهية

لتعديل المخزون: اذهب إلى **الإعدادات > إدارة المخزون**.`,
    category: 'products',
    navigationPath: '/dashboard/:location/products',
    relatedTopics: ['materials-recipes']
  },
  {
    id: 'addons',
    keywords: ['addon', 'add-on', 'modifier', 'extra', 'customization', 'topping', 'attribute', 'size', 'إضافات', 'تعديل', 'تخصيص', 'حجم', 'إضافة على المنتج', 'اضافات'],
    question: 'How do I set up product add-ons/modifiers?',
    questionAr: 'كيف أعد إضافات المنتج؟',
    answer: `Add-ons let customers customize their orders (size, toppings, milk type, etc.)!

**Creating Add-on Groups:**
1. Go to **Dashboard > Add-ons**
2. Click **"Add Group"**
3. Enter a **name** (e.g., "Milk Type", "Size")
4. Configure: Required or Multi-Select
5. Add **options** with prices
6. Assign to **products**
7. Save`,
    answerAr: `الإضافات تسمح للعملاء بتخصيص طلباتهم (الحجم، الإضافات، نوع الحليب، إلخ)!

**إنشاء مجموعة إضافات:**
1. اذهب إلى **لوحة التحكم > الإضافات**
2. اضغط **"إضافة مجموعة"**
3. أدخل **الاسم** (مثل "نوع الحليب"، "الحجم")
4. حدد: إلزامية أو اختيار متعدد
5. أضف **الخيارات** مع الأسعار
6. اربطها **بالمنتجات**
7. احفظ`,
    category: 'products',
    navigationPath: '/dashboard/:location/addons'
  },
  {
    id: 'materials-recipes',
    keywords: ['materials', 'recipes', 'ingredients', 'raw materials', 'recipe management', 'cost', 'مواد', 'وصفات', 'مكونات', 'مواد خام', 'تكلفة', 'وصفة'],
    question: 'How do I manage materials and recipes?',
    questionAr: 'كيف أدير المواد والوصفات؟',
    answer: `Materials and Recipes give you ingredient-level control!

**Materials** (Raw Ingredients):
- Add items like flour, sugar, coffee beans, milk
- Track quantities and units (kg, liters, etc.)

**Recipes:**
- Create recipes that use materials
- Link recipes to products
- When products sell, materials auto-deduct!

Go to **Dashboard > Materials** and **Dashboard > Recipes** to get started!`,
    answerAr: `المواد والوصفات تعطيك تحكماً على مستوى المكونات!

**المواد** (المكونات الخام): أضف أصنافاً مثل الطحين والسكر والحليب، وتتبع الكميات والوحدات.

**الوصفات:** أنشئ وصفات تستخدم المواد واربطها بالمنتجات. عند البيع، المواد تُخصم تلقائياً!

اذهب إلى **لوحة التحكم > المواد** و**لوحة التحكم > الوصفات** للبدء!`,
    category: 'products',
    navigationPath: '/dashboard/:location/materials'
  },

  // ========== ORDERS & SALES ==========
  {
    id: 'process-sale',
    keywords: ['sale', 'sell', 'order', 'checkout', 'process order', 'make sale', 'new order', 'بيع', 'طلب', 'دفع', 'معالجة طلب', 'عملية بيع', 'طلب جديد', 'كاشير'],
    question: 'How do I process a sale?',
    questionAr: 'كيف أعالج عملية بيع؟',
    answer: `Processing a sale is straightforward!

1. Navigate to the **Sales Screen**
2. Select a **category** from the sidebar
3. **Tap products** to add them to the order
4. Review the **order summary**
5. Tap **"Checkout"** when ready
6. Select payment method (**Cash** or **Card**)
7. Complete the sale!`,
    answerAr: `معالجة البيع بسيطة!

1. اذهب إلى **شاشة البيع**
2. اختر **تصنيف** من القائمة الجانبية
3. **اضغط على المنتجات** لإضافتها للطلب
4. راجع **ملخص الطلب**
5. اضغط **"الدفع"** عندما تكون جاهزاً
6. اختر طريقة الدفع (**نقد** أو **بطاقة**)
7. أكمل عملية البيع!`,
    category: 'orders',
    relatedTopics: ['split-payment', 'discounts', 'refund']
  },
  {
    id: 'split-payment',
    keywords: ['split payment', 'split bill', 'multiple payments', 'share bill', 'pay separately', 'تقسيم الدفع', 'دفع مشترك', 'دفعات متعددة', 'تقسيم الفاتورة'],
    question: 'How do I handle split payments?',
    questionAr: 'كيف أتعامل مع الدفع المقسم؟',
    answer: `PayMint makes split payments easy!

1. During checkout, tap **"Split Payment"**
2. Choose split type: **By Amount** or **By Item**
3. **Process each payment** separately
4. Complete when all payments collected!`,
    answerAr: `بيمنت يجعل تقسيم الدفع سهلاً!

1. أثناء الدفع، اضغط **"تقسيم الدفع"**
2. اختر نوع التقسيم: **حسب المبلغ** أو **حسب الصنف**
3. **عالج كل دفعة** على حدة
4. أكمل عند تحصيل جميع الدفعات!`,
    category: 'payments',
    relatedTopics: ['process-sale']
  },
  {
    id: 'view-orders',
    keywords: ['orders', 'view orders', 'order history', 'transactions', 'sales history', 'find order', 'الطلبات', 'عرض الطلبات', 'سجل الطلبات', 'المعاملات', 'تاريخ المبيعات'],
    question: 'How do I view my orders?',
    questionAr: 'كيف أعرض طلباتي؟',
    answer: `You can view all orders in the Reports section!

1. Go to **Dashboard > Orders**
2. You'll see all orders with number, status, items, total, and payment method
3. **Search** by order number, **filter** by date, payment method, employee, or status
4. Click any order for full details`,
    answerAr: `يمكنك عرض جميع الطلبات في قسم التقارير!

1. اذهب إلى **لوحة التحكم > الطلبات**
2. سترى جميع الطلبات مع الرقم والحالة والأصناف والمجموع وطريقة الدفع
3. **ابحث** برقم الطلب، **فلتر** حسب التاريخ أو طريقة الدفع أو الموظف
4. اضغط على أي طلب لعرض التفاصيل الكاملة`,
    category: 'orders',
    navigationPath: '/dashboard/:location/orders'
  },
  {
    id: 'hold-order',
    keywords: ['hold order', 'save order', 'hold', 'resume order', 'later', 'pending order', 'حجز طلب', 'حفظ طلب', 'تعليق', 'استئناف طلب', 'طلب معلق'],
    question: 'How do I hold an order for later?',
    questionAr: 'كيف أحفظ طلب لوقت لاحق؟',
    answer: `You can save orders to complete later!

**To Hold:** Tap the **"Hold"** button, enter a nickname, and save.
**To Resume:** Go to Notifications, find the held order, and tap to resume.

The order syncs to the server so all staff can see it!`,
    answerAr: `يمكنك حفظ الطلبات لإكمالها لاحقاً!

**للحفظ:** اضغط زر **"تعليق"**، أدخل اسماً مميزاً، واحفظ.
**للاستئناف:** اذهب للإشعارات، ابحث عن الطلب المعلق، واضغط لاستئنافه.

الطلب يُزامن مع الخادم ليتمكن جميع الموظفين من رؤيته!`,
    category: 'orders',
    relatedTopics: ['process-sale']
  },
  {
    id: 'refund',
    keywords: ['refund', 'return', 'cancel order', 'money back', 'void', 'partial refund', 'استرداد', 'إرجاع', 'إلغاء طلب', 'استرجاع المال', 'استرداد جزئي'],
    question: 'How do I process a refund?',
    questionAr: 'كيف أعمل استرداد؟',
    answer: `Here's how to handle refunds:

**Full Refund:**
1. Go to **Reports > Orders**, find the order
2. Tap **"Refund"**, enter a reason, confirm

**Partial Refund:**
1. Find the order, tap **"Partial Refund"**
2. Select items to refund, enter reason, confirm

Admin authorization may be required. All refunds are logged.`,
    answerAr: `إليك طريقة معالجة الاسترداد:

**استرداد كامل:**
1. اذهب إلى **التقارير > الطلبات**، ابحث عن الطلب
2. اضغط **"استرداد"**، أدخل السبب، وأكد

**استرداد جزئي:**
1. ابحث عن الطلب، اضغط **"استرداد جزئي"**
2. اختر الأصناف المراد استردادها، أدخل السبب، وأكد

قد يتطلب تصريح المسؤول. جميع الاستردادات تُسجل في سجل النشاط.`,
    category: 'orders',
    navigationPath: '/dashboard/:location/orders',
    relatedTopics: ['view-orders']
  },

  // ========== DISCOUNTS & LOYALTY ==========
  {
    id: 'discounts',
    keywords: ['discount', 'coupon', 'promo', 'promotion', 'sale', 'offer', 'percentage off', 'apply discount', 'خصم', 'كوبون', 'عرض', 'تخفيض', 'خصومات', 'تطبيق خصم'],
    question: 'How do I create and apply discounts?',
    questionAr: 'كيف أنشئ وأطبق الخصومات؟',
    answer: `Discounts can be applied at checkout!

**Creating:** Go to **Dashboard > Discounts**, click "Add Discount", choose type (Percentage or Fixed Amount), set conditions, save.

**Applying:** During sale, tap "Discount", select from available discounts, tap "Apply".

You can also apply item-level discounts!`,
    answerAr: `يمكن تطبيق الخصومات عند الدفع!

**الإنشاء:** اذهب إلى **لوحة التحكم > الخصومات**، اضغط "إضافة خصم"، اختر النوع (نسبة أو مبلغ ثابت)، حدد الشروط، واحفظ.

**التطبيق:** أثناء البيع، اضغط "خصم"، اختر من الخصومات المتاحة، واضغط "تطبيق".

يمكنك أيضاً تطبيق خصم على صنف محدد!`,
    category: 'feature',
    navigationPath: '/dashboard/:location/discounts'
  },
  {
    id: 'loyalty',
    keywords: ['loyalty', 'rewards', 'points', 'loyalty program', 'customer rewards', 'enroll customer', 'ولاء', 'مكافآت', 'نقاط', 'برنامج ولاء', 'نقاط العملاء', 'مكافأة'],
    question: 'How does the loyalty program work?',
    questionAr: 'كيف يعمل برنامج الولاء؟',
    answer: `PayMint has a built-in loyalty program!

**Setup:** Go to Dashboard > Loyalty, enable, set earning rules and rewards.
**Enroll:** Tap "Loyalty" on sales screen, add new customer with name and phone.
**Redeem:** During checkout, tap "Loyalty", search customer, select reward to redeem.

Points are automatically earned on each purchase!`,
    answerAr: `بيمنت يحتوي على برنامج ولاء مدمج!

**الإعداد:** اذهب إلى لوحة التحكم > الولاء، فعّله، حدد قواعد الكسب والمكافآت.
**تسجيل العميل:** اضغط "الولاء" على شاشة البيع، أضف عميلاً جديداً بالاسم والهاتف.
**الاستبدال:** أثناء الدفع، اضغط "الولاء"، ابحث عن العميل، اختر مكافأة للاستبدال.

النقاط تُكتسب تلقائياً مع كل عملية شراء! 🎁`,
    category: 'loyalty',
    navigationPath: '/dashboard/:location/loyalty'
  },

  // ========== STAFF MANAGEMENT ==========
  {
    id: 'add-staff',
    keywords: ['staff', 'employee', 'add employee', 'team', 'worker', 'hire', 'new staff', 'موظف', 'إضافة موظف', 'فريق', 'موظف جديد', 'عامل', 'موظفين'],
    question: 'How do I add staff members?',
    questionAr: 'كيف أضيف موظفين؟',
    answer: `Here's how to add new team members:

1. Go to **Dashboard > Staff**
2. Click **"Add Employee"**
3. Fill in: Name, Email, 4-digit PIN, Role (Admin/User)
4. Set **permissions** (for User role)
5. Save!

The employee will receive an email invitation.`,
    answerAr: `إليك طريقة إضافة موظفين جدد:

1. اذهب إلى **لوحة التحكم > الموظفين**
2. اضغط **"إضافة موظف"**
3. أكمل: الاسم، البريد، رقم PIN من 4 أرقام، الدور (مسؤول/مستخدم)
4. حدد **الصلاحيات** (لدور المستخدم)
5. احفظ!

الموظف سيتلقى دعوة بالبريد الإلكتروني.`,
    category: 'staff',
    navigationPath: '/dashboard/:location/staff',
    relatedTopics: ['roles-permissions']
  },
  {
    id: 'roles-permissions',
    keywords: ['roles', 'permissions', 'access', 'custom role', 'restrict', 'admin', 'user role', 'أدوار', 'صلاحيات', 'وصول', 'دور مخصص', 'تقييد', 'مسؤول'],
    question: 'How do I set up roles and permissions?',
    questionAr: 'كيف أعد الأدوار والصلاحيات؟',
    answer: `Roles control what staff members can do!

**Default:** Admin (full access) and User (limited).
**Custom:** Go to Dashboard > Roles, click "Add Role", name it, select permissions, save.
**Assign:** Edit an employee and select their role.`,
    answerAr: `الأدوار تتحكم بما يمكن للموظفين فعله!

**الافتراضية:** مسؤول (وصول كامل) ومستخدم (محدود).
**مخصصة:** اذهب إلى لوحة التحكم > الأدوار، اضغط "إضافة دور"، سمّه، اختر الصلاحيات، واحفظ.
**التعيين:** عدّل الموظف واختر دوره.`,
    category: 'staff',
    navigationPath: '/dashboard/:location/roles'
  },
  {
    id: 'deactivate-employee',
    keywords: ['deactivate employee', 'remove employee', 'fire', 'terminate', 'disable access', 'تعطيل موظف', 'إزالة موظف', 'إنهاء خدمة', 'إلغاء وصول'],
    question: 'How do I deactivate an employee?',
    questionAr: 'كيف أعطل حساب موظف؟',
    answer: `To remove access: Go to **Dashboard > Staff**, find the employee, toggle **"Active"** to OFF, confirm.

Their data is preserved but they can no longer log in. Can be reactivated later.`,
    answerAr: `لإزالة الوصول: اذهب إلى **لوحة التحكم > الموظفين**، ابحث عن الموظف، أوقف مفتاح **"نشط"**، وأكد.

بياناتهم محفوظة لكن لن يتمكنوا من الدخول. يمكن إعادة تفعيلهم لاحقاً.`,
    category: 'staff',
    navigationPath: '/dashboard/:location/staff'
  },

  // ========== REPORTS ==========
  {
    id: 'reports',
    keywords: ['report', 'reports', 'analytics', 'data', 'statistics', 'insights', 'sales report', 'تقرير', 'تقارير', 'تحليلات', 'بيانات', 'إحصائيات', 'تقرير مبيعات'],
    question: 'What reports are available?',
    questionAr: 'ما التقارير المتاحة؟',
    answer: `PayMint offers comprehensive reporting!

**Types:** General Reports, Item Reports, Order History, Staff Reports, Shift Reports, Peak Hours, Discount Reports, Tax Reports.

**Filtering:** By date range, employee, payment method, order status.

**Export:** PDF download, email, or print.

Go to **Dashboard > Reports** to explore!`,
    answerAr: `بيمنت يقدم تقارير شاملة!

**الأنواع:** تقارير عامة، تقارير الأصناف، سجل الطلبات، تقارير الموظفين، تقارير الورديات، ساعات الذروة، تقارير الخصومات، تقارير الضرائب.

**الفلترة:** حسب نطاق التاريخ، الموظف، طريقة الدفع، حالة الطلب.

**التصدير:** تحميل PDF، بريد إلكتروني، أو طباعة.

اذهب إلى **لوحة التحكم > التقارير** لاستكشافها!`,
    category: 'reports',
    navigationPath: '/dashboard/:location/reports'
  },
  {
    id: 'export-reports',
    keywords: ['export', 'pdf', 'download report', 'email report', 'print report', 'تصدير', 'تحميل تقرير', 'طباعة تقرير', 'بي دي إف'],
    question: 'How do I export or print reports?',
    questionAr: 'كيف أصدر أو أطبع التقارير؟',
    answer: `Export as **PDF**, **email** it, or **print** it directly from any report page. All exports include the current filters applied.`,
    answerAr: `صدّرها كـ **PDF**، أرسلها **بالبريد**، أو **اطبعها** مباشرة من أي صفحة تقرير. جميع التصديرات تتضمن الفلاتر المطبقة.`,
    category: 'reports',
    navigationPath: '/dashboard/:location/reports'
  },

  // ========== SETTINGS ==========
  {
    id: 'settings',
    keywords: ['settings', 'configure', 'setup', 'preferences', 'options', 'customize', 'إعدادات', 'تهيئة', 'تفضيلات', 'خيارات', 'تخصيص'],
    question: 'Where can I find settings?',
    questionAr: 'أين أجد الإعدادات؟',
    answer: `Settings are organized in a few places:

**Location Settings:** Business name, logo, receipt, tax, hours, theme, dark mode.
**Owner Account:** Profile, password, notifications.
**Owner Billing:** Subscription, payment method, invoices.
**POS App:** Printer, language, display.`,
    answerAr: `الإعدادات موجودة في عدة أماكن:

**إعدادات الموقع:** اسم العمل، الشعار، الإيصال، الضريبة، ساعات العمل، السمة، الوضع الداكن.
**حساب المالك:** الملف الشخصي، كلمة المرور، الإشعارات.
**فوترة المالك:** الاشتراك، طريقة الدفع، الفواتير.
**تطبيق نقاط البيع:** الطابعة، اللغة، العرض.`,
    category: 'settings',
    navigationPath: '/dashboard/:location/settings'
  },
  {
    id: 'theme',
    keywords: ['theme', 'color', 'dark mode', 'appearance', 'customize look', 'سمة', 'لون', 'الوضع الداكن', 'المظهر', 'تخصيص الشكل'],
    question: 'How do I change the theme or enable dark mode?',
    questionAr: 'كيف أغير السمة أو أفعّل الوضع الداكن؟',
    answer: `Go to **Settings > Your Restaurant**, find "Theme" to change color (Green, Yellow, Blue), or toggle "Dark Mode" ON.`,
    answerAr: `اذهب إلى **الإعدادات > مطعمك**، ابحث عن "السمة" لتغيير اللون (أخضر، أصفر، أزرق)، أو فعّل "الوضع الداكن".`,
    category: 'settings',
    navigationPath: '/dashboard/:location/settings'
  },
  {
    id: 'receipt',
    keywords: ['receipt', 'receipt settings', 'customize receipt', 'farewell message', 'logo on receipt', 'إيصال', 'إعدادات الإيصال', 'تخصيص الإيصال', 'شعار الإيصال'],
    question: 'How do I customize receipts?',
    questionAr: 'كيف أخصص الإيصالات؟',
    answer: `Go to **Settings > Your Restaurant** to customize: Restaurant Name, Logo, Farewell Message, and Tax Display.`,
    answerAr: `اذهب إلى **الإعدادات > مطعمك** لتخصيص: اسم المطعم، الشعار، رسالة الوداع، وعرض الضريبة.`,
    category: 'settings',
    relatedTopics: ['printer']
  },
  {
    id: 'establishments',
    keywords: ['establishment', 'location', 'store', 'branch', 'multiple locations', 'add store', 'موقع', 'فرع', 'متجر', 'مواقع متعددة', 'إضافة فرع', 'منشأة'],
    question: 'How do I manage multiple locations?',
    questionAr: 'كيف أدير مواقع متعددة؟',
    answer: `Go to **Owner Portal** to see all establishments. Add new locations with the onboarding wizard. Group locations under **Brands** for unified management.`,
    answerAr: `اذهب إلى **بوابة المالك** لرؤية جميع المنشآت. أضف مواقع جديدة بمعالج الإعداد. جمّع المواقع تحت **العلامات التجارية** لإدارة موحدة.`,
    category: 'feature',
    navigationPath: '/owner/establishments'
  },

  // ========== HARDWARE ==========
  {
    id: 'printer',
    keywords: ['printer', 'receipt printer', 'print', 'connect printer', 'printer not working', 'طابعة', 'طابعة إيصالات', 'طباعة', 'توصيل طابعة'],
    question: 'How do I set up a receipt printer?',
    questionAr: 'كيف أعد طابعة الإيصالات؟',
    answer: `Go to **Settings > Your Restaurant > Printer Configuration**. Select type (Bluetooth, Wi-Fi, USB), tap "Search for Printers", select yours, and print a test receipt.

Supports: Epson TM series, Star TSP series, Bluetooth thermal printers.`,
    answerAr: `اذهب إلى **الإعدادات > مطعمك > إعداد الطابعة**. اختر النوع (بلوتوث، واي فاي، USB)، اضغط "البحث عن طابعات"، اختر طابعتك، واطبع إيصال تجريبي.

يدعم: سلسلة Epson TM، سلسلة Star TSP، طابعات حرارية بلوتوث.`,
    category: 'technical',
    relatedTopics: ['printer-issues']
  },
  {
    id: 'barcode-scanner',
    keywords: ['barcode', 'scanner', 'scan', 'barcode scanner', 'باركود', 'ماسح', 'مسح', 'ماسح باركود'],
    question: 'How do I set up a barcode scanner?',
    questionAr: 'كيف أعد ماسح الباركود؟',
    answer: `Enable Bluetooth, pair your scanner, and it works automatically! On the Sales Screen, just scan any barcode and the product adds to the order.`,
    answerAr: `فعّل البلوتوث، اقرن الماسح، وسيعمل تلقائياً! على شاشة البيع، امسح أي باركود والمنتج يُضاف للطلب.`,
    category: 'technical'
  },

  // ========== TROUBLESHOOTING ==========
  {
    id: 'connection-issues',
    keywords: ['connection', 'offline', 'no internet', 'connection failed', 'server error', 'not connecting', 'اتصال', 'غير متصل', 'لا يوجد إنترنت', 'فشل الاتصال', 'خطأ في الخادم'],
    question: "The app says 'Connection Failed'. What do I do?",
    questionAr: 'التطبيق يقول "فشل الاتصال". ماذا أفعل؟',
    answer: `Quick fixes: Check Wi-Fi, restart the app, restart router. Still not working? Clear app cache, close other apps, try mobile data.

**Offline Mode:** PayMint can work offline for basic cash sales! Data syncs when you reconnect.`,
    answerAr: `حلول سريعة: تحقق من الواي فاي، أعد تشغيل التطبيق، أعد تشغيل الراوتر. لا يزال لا يعمل؟ امسح ذاكرة التطبيق المؤقتة، أغلق التطبيقات الأخرى، جرب بيانات الجوال.

**وضع عدم الاتصال:** بيمنت يعمل بدون إنترنت للمبيعات النقدية الأساسية! البيانات تتزامن عند الاتصال مجدداً.`,
    category: 'troubleshooting'
  },
  {
    id: 'printer-issues',
    keywords: ['printer not found', 'printer not working', 'cant print', 'receipt not printing', 'print error', 'الطابعة لا تعمل', 'لا تطبع', 'مشكلة طباعة', 'خطأ في الطابعة'],
    question: 'My printer is not working. How do I fix it?',
    questionAr: 'الطابعة لا تعمل. كيف أصلحها؟',
    answer: `Check: printer is ON, Bluetooth/Wi-Fi enabled, printer in range, paper loaded. Go to Settings > Printer, search and reconnect. Print a test receipt.`,
    answerAr: `تحقق من: الطابعة مشغلة، البلوتوث/الواي فاي مفعل، الطابعة في النطاق، الورق محمّل. اذهب إلى الإعدادات > الطابعة، ابحث وأعد الاتصال. اطبع إيصال تجريبي.`,
    category: 'troubleshooting'
  },
  {
    id: 'shift-issues',
    keywords: ['shift already active', 'cant start shift', 'another shift', 'shift conflict', 'وردية نشطة', 'لا أستطيع بدء وردية', 'تعارض ورديات'],
    question: "It says 'Shift Already Active'. What should I do?",
    questionAr: 'يقول "الوردية نشطة بالفعل". ماذا أفعل؟',
    answer: `Another user has an open shift. Contact them to close it, or ask an admin to force-close. Only one shift can be active at a time.`,
    answerAr: `مستخدم آخر لديه وردية مفتوحة. تواصل معه لإغلاقها، أو اطلب من مسؤول إغلاقها إجبارياً. وردية واحدة فقط يمكن أن تكون نشطة في كل مرة.`,
    category: 'troubleshooting'
  },
  {
    id: 'payment-issues',
    keywords: ['payment failed', 'card declined', 'card not working', 'payment error', 'فشل الدفع', 'بطاقة مرفوضة', 'مشكلة في الدفع', 'خطأ في البطاقة'],
    question: 'A card payment failed. What do I do?',
    questionAr: 'فشل الدفع بالبطاقة. ماذا أفعل؟',
    answer: `Check terminal is connected and powered. Ask customer to try again or use a different card. If card system is down, offer cash payment.`,
    answerAr: `تحقق أن الجهاز متصل ومشغل. اطلب من العميل المحاولة مجدداً أو استخدام بطاقة أخرى. إذا نظام البطاقات معطل، اعرض الدفع نقداً.`,
    category: 'troubleshooting'
  },
  {
    id: 'session-expired',
    keywords: ['session expired', 'logged out', 'login again', 'session timeout', 'انتهت الجلسة', 'تسجيل خروج تلقائي', 'مهلة الجلسة'],
    question: 'I got logged out / session expired. Why?',
    questionAr: 'تم تسجيل خروجي / انتهت الجلسة. لماذا؟',
    answer: `Sessions expire for security (inactivity, network issues). Just log back in. Enable "Keep me logged in" on trusted devices to prevent this.`,
    answerAr: `الجلسات تنتهي للأمان (عدم نشاط، مشاكل شبكة). سجل الدخول مجدداً. فعّل "تذكرني" على الأجهزة الموثوقة لمنع ذلك.`,
    category: 'troubleshooting'
  },

  // ========== BILLING ==========
  {
    id: 'billing',
    keywords: ['billing', 'subscription', 'plan', 'pricing', 'invoice', 'payment', 'yearly', 'annual', 'monthly', 'location', 'branch', 'فوترة', 'اشتراك', 'خطة', 'أسعار', 'فاتورة', 'دفع', 'سنوي', 'شهري', 'فرع'],
    question: 'How does billing work?',
    questionAr: 'كيف تعمل الفوترة؟',
    answer: `**Trial:** 7-day free trial with full access.

**Monthly Plan:** $20/month for your first location with full access to all features.

**Yearly Plan:** $210/year (instead of $240) — save $30! You can switch between monthly and yearly anytime.

**Additional Locations:** Each extra location after the first is $17/month or $180/year (instead of $204). That's a discounted rate for multi-branch businesses!

**Manage:** Go to **Owner > Billing** to view plans, switch billing cycles, update payment methods, and download invoices.`,
    answerAr: `**التجربة:** تجربة مجانية 7 أيام مع وصول كامل.

**الخطة الشهرية:** 20$/شهر للموقع الأول مع وصول كامل لجميع الميزات.

**الخطة السنوية:** 210$/سنة (بدلاً من 240$) — وفّر 30$! يمكنك التبديل بين الشهري والسنوي في أي وقت.

**المواقع الإضافية:** كل موقع إضافي بعد الأول بـ 17$/شهر أو 180$/سنة (بدلاً من 204$). سعر مخفض للأعمال متعددة الفروع!

**الإدارة:** اذهب إلى **المالك > الفوترة** لعرض الخطط، تبديل دورة الفوترة، تحديث طرق الدفع، وتحميل الفواتير.`,
    category: 'billing',
    navigationPath: '/owner/billing'
  },

  // ========== MISC ==========
  {
    id: 'contact-support',
    keywords: ['support', 'help', 'contact', 'customer service', 'issue', 'problem', 'email support', 'دعم', 'مساعدة', 'تواصل', 'خدمة عملاء', 'مشكلة'],
    question: 'How do I contact support?',
    questionAr: 'كيف أتواصل مع الدعم؟',
    answer: `Email us at **support@PayMint.io**. Include: error message, steps taken, device info, screenshots. We respond within 24 hours!`,
    answerAr: `راسلنا على **support@PayMint.io**. أرفق: رسالة الخطأ، الخطوات المتخذة، معلومات الجهاز، لقطات شاشة. نرد خلال 24 ساعة!`,
    category: 'technical'
  },
  {
    id: 'activity-logs',
    keywords: ['activity', 'logs', 'audit', 'history', 'changes', 'who did what', 'audit log', 'سجل النشاط', 'سجلات', 'تدقيق', 'تاريخ التغييرات'],
    question: 'How do I view activity logs?',
    questionAr: 'كيف أعرض سجلات النشاط؟',
    answer: `Go to **Dashboard > Activity Logs** (Admin only). Track: product changes, employee actions, orders, settings changes, cash operations. Filter by date, user, or action type.`,
    answerAr: `اذهب إلى **لوحة التحكم > سجل النشاط** (للمسؤولين فقط). تتبع: تغييرات المنتجات، إجراءات الموظفين، الطلبات، تغييرات الإعدادات، عمليات النقد. فلتر حسب التاريخ أو المستخدم أو نوع الإجراء.`,
    category: 'technical',
    navigationPath: '/dashboard/:location/activity-logs'
  },
  {
    id: 'language',
    keywords: ['language', 'arabic', 'english', 'rtl', 'translate', 'change language', 'لغة', 'عربي', 'إنجليزي', 'ترجمة', 'تغيير اللغة'],
    question: 'How do I change the language?',
    questionAr: 'كيف أغير اللغة؟',
    answer: `Go to **Settings > Language**, select English or Arabic. The entire interface updates including RTL layout support!`,
    answerAr: `اذهب إلى **الإعدادات > اللغة**، اختر العربية أو الإنجليزية. الواجهة بالكامل تتحدث بما في ذلك دعم الاتجاه من اليمين لليسار!`,
    category: 'settings'
  },
  {
    id: 'security',
    keywords: ['security', 'pin', 'password security', 'safe', 'protect', 'أمان', 'رقم سري', 'حماية', 'أمن الحساب'],
    question: 'What are the security best practices?',
    questionAr: 'ما أفضل ممارسات الأمان؟',
    answer: `Never share your PIN. Log out when leaving POS unattended. Report suspicious activity. Change password if compromised. Close shifts before leaving. Admins: review activity logs regularly.`,
    answerAr: `لا تشارك رقم PIN الخاص بك. سجل الخروج عند ترك نقاط البيع. أبلغ عن أي نشاط مشبوه. غيّر كلمة المرور إذا تم اختراقها. أغلق الوردية قبل المغادرة. المسؤولون: راجعوا سجلات النشاط بانتظام.`,
    category: 'account'
  }
];

// Friendly greeting responses - varied and warm
export const GREETINGS = [
  "Hey there! 👋 I'm Minto, your PayMint assistant. What can I help you with today?",
  "Hi! Welcome! I'm Minto, here to help you get the most out of PayMint. What's on your mind?",
  "Hello! 👋 Great to see you! I'm Minto - ask me anything about PayMint!",
  "Hey! I'm Minto, your friendly PayMint guide. How can I make your day easier?",
  "Hi there! 😊 I'm Minto. Whether it's products, orders, or settings - I've got you covered!",
];

// Arabic greeting responses
export const GREETINGS_AR = [
  "أهلاً! 👋 أنا مينتو، مساعد بيمنت. كيف يمكنني مساعدتك اليوم؟",
  "مرحباً! أهلاً وسهلاً! أنا مينتو، هنا لمساعدتك في كل ما يخص بيمنت. ماذا تحتاج؟",
  "مرحباً! 👋 سعيد برؤيتك! أنا مينتو - اسألني أي شيء عن بيمنت!",
  "أهلاً! أنا مينتو، دليلك في بيمنت. كيف أستطيع مساعدتك؟",
  "مرحباً! 😊 أنا مينتو. سواء كان عن المنتجات أو الطلبات أو الإعدادات - أنا جاهز!",
];

// Fallback responses when no match - encouraging and helpful
export const FALLBACK_RESPONSES = [
  "Hmm, I'm not quite sure about that one! Could you try rephrasing? Or ask me about things like products, orders, staff, reports, or settings - I know a lot about those! 😊",
  "That's a good question! I don't have specific info on that, but I'd love to help with something else. What about adding products, processing sales, or managing your team?",
  "I couldn't find an exact answer for that. Try asking things like 'How do I add a product?' or 'How do I process a refund?' - I'm great with those!",
  "Interesting question! I might need more context. Could you be more specific? In the meantime, feel free to ask about any PayMint features!",
  "I'm still learning! 🤓 I don't have info on that specific topic, but I can help with sales, inventory, reports, staff management, and more!",
];

// Arabic fallback responses
export const FALLBACK_RESPONSES_AR = [
  "عذراً، لم أفهم سؤالك تماماً! هل يمكنك إعادة صياغته؟ أو اسألني عن المنتجات أو الطلبات أو الموظفين أو التقارير أو الإعدادات 😊",
  "سؤال جيد! لا أملك معلومات محددة عن هذا، لكن يسعدني مساعدتك في شيء آخر. ماذا عن إضافة المنتجات أو معالجة المبيعات أو إدارة الفريق؟",
  "لم أجد إجابة دقيقة لهذا السؤال. جرب أسئلة مثل 'كيف أضيف منتج؟' أو 'كيف أعمل استرداد؟'",
  "سؤال مثير! قد أحتاج مزيداً من التفاصيل. هل يمكنك أن تكون أكثر تحديداً؟",
  "ما زلت أتعلم! 🤓 لا أملك معلومات عن هذا الموضوع تحديداً، لكن يمكنني مساعدتك في المبيعات والمخزون والتقارير وإدارة الموظفين والمزيد!",
];

// Thinking/processing phrases
export const THINKING_PHRASES = [
  "Let me think about that...",
  "Great question! Let me find that for you...",
  "One moment...",
  "Looking that up...",
];

// Closing/goodbye phrases
export const GOODBYE_PHRASES = [
  "Bye! Come back anytime you need help! 👋",
  "See you later! Good luck with your business! 💚",
  "Take care! I'm always here if you need me!",
  "Goodbye! Have a great day! 🌟",
];

// Quick action suggestions based on common intents
export const QUICK_ACTIONS = [
  { label: 'Add a product', icon: 'package', query: 'How do I add a product?' },
  { label: 'Process a sale', icon: 'shopping-cart', query: 'How do I process a sale?' },
  { label: 'View reports', icon: 'bar-chart', query: 'What reports are available?' },
  { label: 'Manage staff', icon: 'users', query: 'How do I add staff?' },
  { label: 'Start shift', icon: 'clock', query: 'How do I start a shift?' },
  { label: 'Settings', icon: 'settings', query: 'Where are the settings?' },
];


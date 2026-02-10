/**
 * Paymint AI Chatbot Knowledge Base
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
    keywords: ['start', 'begin', 'new', 'first', 'getting started', 'how to use', 'introduction', 'hello', 'hi', 'help'],
    question: 'How do I get started with Paymint?',
    answer: `Great question! Getting started with Paymint is easy. Here's what you need to do:

1. **Sign Up** - Create your account on our website
2. **Verify Email** - Check your inbox and click the verification link
3. **Complete Onboarding** - Set up your first establishment with business details
4. **Add Products** - Create your menu items and categories
5. **Start Selling** - You're ready to process your first order!

The whole process takes just a few minutes. What would you like help with first?`,
    category: 'getting-started',
    navigationPath: '/signup',
    relatedTopics: ['signup', 'onboarding', 'products']
  },
  {
    id: 'what-is-paymint',
    keywords: ['what is paymint', 'about paymint', 'paymint features', 'what does paymint do', 'explain paymint'],
    question: 'What is Paymint?',
    answer: `Paymint is a comprehensive Point of Sale (POS) system designed for restaurants, cafes, and retail establishments!

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
    category: 'getting-started',
    relatedTopics: ['features', 'pricing']
  },
  {
    id: 'signup',
    keywords: ['sign up', 'signup', 'register', 'create account', 'new account', 'join'],
    question: 'How do I create a Paymint account?',
    answer: `Creating your Paymint account is quick and easy!

1. Click **"Sign Up"** or visit the signup page
2. Enter your **email address** and create a strong password
3. Fill in your **business details** (name, phone)
4. Click **"Sign Up"** to create your account
5. Check your email and click the **verification link**

Once verified, you'll go through our onboarding wizard to set up your first establishment. New users get a **7-day free trial** with full access to all features!`,
    category: 'getting-started',
    navigationPath: '/signup'
  },
  {
    id: 'login',
    keywords: ['login', 'log in', 'sign in', 'signin', 'access', 'enter', 'cant log in'],
    question: 'How do I log in to my account?',
    answer: `There are two ways to log in:

**Option 1: Web Dashboard**
1. Go to the login page
2. Enter your email and password
3. Click "Log In"

**Option 2: POS App (for staff)**
1. Select your profile from the staff list
2. Enter your 4-digit PIN
3. You're in!

💡 **Tip:** Use "Keep me logged in" for faster access on trusted devices.

Forgot your password? No worries - just click "Forgot Password" and we'll send you a reset link!`,
    category: 'account',
    navigationPath: '/login'
  },
  {
    id: 'forgot-password',
    keywords: ['forgot password', 'reset password', 'password recovery', 'cant login', 'lost password', 'change password'],
    question: 'I forgot my password. How can I reset it?',
    answer: `No worries, it happens to the best of us! Here's how to reset your password:

1. Go to the **login page**
2. Click **"Forgot Password"**
3. Enter your registered **email address**
4. Check your inbox for the **reset link** (check spam too!)
5. Click the link and create a **new password**

⏰ The reset link expires in **24 hours** for security.

If you're on the POS app, an admin can authorize a password reset for you.`,
    category: 'account',
    navigationPath: '/forgot-password'
  },
  {
    id: 'onboarding',
    keywords: ['onboarding', 'setup', 'first time', 'new establishment', 'create store', 'add location'],
    question: 'How does the onboarding process work?',
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
- Create the primary administrator account

💡 **Pro Tip:** You can duplicate settings from an existing establishment to speed things up!`,
    category: 'getting-started',
    navigationPath: '/onboarding'
  },

  // ========== SHIFTS ==========
  {
    id: 'start-shift',
    keywords: ['start shift', 'begin shift', 'open shift', 'clock in', 'opening cash', 'new shift'],
    question: 'How do I start a shift?',
    answer: `Starting your shift is simple!

1. **Log in** to the POS app
2. If no shift is active, you'll be prompted to start one
3. **Count the cash** in your drawer
4. Enter the **opening cash amount**
5. Tap **"Start Shift"** to begin!

The system will track all your transactions until you close the shift. Only one shift can be active at a time - if someone else's shift is open, you'll see a notification.`,
    category: 'shifts',
    relatedTopics: ['end-shift', 'cash-management']
  },
  {
    id: 'end-shift',
    keywords: ['end shift', 'close shift', 'z-report', 'cash out', 'finish shift', 'clock out'],
    question: 'How do I end my shift and print a Z-Report?',
    answer: `Here's how to properly close your shift:

1. Go to the **Dashboard**
2. Tap **"End Shift"**
3. Review your **Shift Summary**:
   - Total sales, cash sales, card sales
   - Pay in/out transactions
   - Expected cash amount
4. **Count the physical cash** in your drawer
5. Enter the **counted amount**
6. The system shows any **discrepancy** (over/short)
7. Tap **"Close Shift"** to finalize

📄 You'll be prompted to print the **Z-Report** - this is your official shift summary receipt!

⚠️ **Important:** Any cash discrepancies are logged and reported to owners.`,
    category: 'shifts',
    relatedTopics: ['start-shift', 'reports']
  },
  {
    id: 'cash-management',
    keywords: ['cash in', 'cash out', 'pay in', 'pay out', 'petty cash', 'add cash', 'remove cash'],
    question: 'How do I manage cash in/out during my shift?',
    answer: `You can easily track cash movements that aren't from sales:

**Cash In (Pay In):**
- Used when adding cash to the drawer (e.g., starting float, bank change)
- Tap **"Cash In"** on the Dashboard
- Enter the amount and reason
- Confirms the addition

**Cash Out (Pay Out):**
- Used when removing cash (e.g., vendor payment, deposit run)
- Tap **"Cash Out"** on the Dashboard
- Enter the amount and reason
- Confirms the removal

All cash movements are recorded and included in your shift summary. This helps with accurate reconciliation!`,
    category: 'shifts',
    relatedTopics: ['end-shift']
  },

  // ========== PRODUCTS ==========
  {
    id: 'add-product',
    keywords: ['add product', 'new product', 'create product', 'product', 'item', 'menu item', 'add item'],
    question: 'How do I add a new product?',
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

Your product is now ready to sell! 🎉`,
    category: 'products',
    navigationPath: '/dashboard/:location/products',
    relatedTopics: ['categories', 'inventory', 'addons']
  },
  {
    id: 'categories',
    keywords: ['category', 'categories', 'organize', 'group products', 'product groups', 'menu structure'],
    question: 'How do I organize products into categories?',
    answer: `Categories help organize your menu and make it easier for staff to find items!

**Creating Categories:**
1. Go to **Dashboard > Categories**
2. Click **"Add Category"**
3. Choose an **icon** and enter a **name**
4. Save!

**Assigning Products:**
- When adding/editing products, select the category from the dropdown

**Tips:**
- Categories appear on your POS sales screen for quick filtering
- You can drag and drop to reorder categories
- A category can't be deleted if it has products - reassign them first

Popular setups: "Hot Drinks", "Cold Drinks", "Food", "Desserts", "Specials"`,
    category: 'products',
    navigationPath: '/dashboard/:location/categories',
    relatedTopics: ['add-product']
  },
  {
    id: 'inventory',
    keywords: ['inventory', 'stock', 'track stock', 'low stock', 'out of stock', 'quantity', 'stock levels'],
    question: 'How do I track inventory?',
    answer: `Paymint makes inventory tracking automatic!

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
1. Go to **Settings > Stock Management**
2. Find the product
3. Adjust the quantity (+/- or enter new count)
4. Add a reason for the adjustment (recommended)
5. Save

💡 **Tip:** Regularly check stock reports to plan restocking!`,
    category: 'products',
    navigationPath: '/dashboard/:location/products',
    relatedTopics: ['materials-recipes']
  },
  {
    id: 'addons',
    keywords: ['addon', 'add-on', 'modifier', 'extra', 'customization', 'topping', 'attribute', 'size'],
    question: 'How do I set up product add-ons/modifiers?',
    answer: `Add-ons let customers customize their orders (size, toppings, milk type, etc.)!

**Creating Add-on Groups:**
1. Go to **Dashboard > Add-ons**
2. Click **"Add Group"**
3. Enter a **name** (e.g., "Milk Type", "Size")
4. Configure settings:
   - **Required** - customer must select one
   - **Multi-Select** - allow multiple choices
5. Add **options** with prices (e.g., "Oat Milk +$0.50")
6. Assign to **products** that use this group
7. Save

**How It Works:**
When staff tap a product with add-ons, a modal appears to select the options. The add-on prices are added to the total.

Great for: sizes, milk alternatives, toppings, cooking preferences, sides!`,
    category: 'products',
    navigationPath: '/dashboard/:location/addons'
  },
  {
    id: 'materials-recipes',
    keywords: ['materials', 'recipes', 'ingredients', 'raw materials', 'recipe management', 'cost'],
    question: 'How do I manage materials and recipes?',
    answer: `Materials and Recipes give you ingredient-level control!

**Materials** (Raw Ingredients):
- Add items like flour, sugar, coffee beans, milk
- Track quantities and units (kg, liters, etc.)
- Set reorder points for alerts

**Recipes:**
- Create recipes that use materials (e.g., "Latte" uses 200ml milk, 2 shots espresso)
- Link recipes to products
- When products sell, materials auto-deduct!

**Benefits:**
✓ Precise cost tracking per item
✓ Accurate inventory at ingredient level
✓ Better purchasing decisions
✓ Reduce waste

Go to **Dashboard > Materials** and **Dashboard > Recipes** to get started!`,
    category: 'products',
    navigationPath: '/dashboard/:location/materials'
  },

  // ========== ORDERS & SALES ==========
  {
    id: 'process-sale',
    keywords: ['sale', 'sell', 'order', 'checkout', 'process order', 'make sale', 'new order'],
    question: 'How do I process a sale?',
    answer: `Processing a sale is straightforward!

**Step-by-Step:**
1. Navigate to the **Sales Screen**
2. Select a **category** from the sidebar
3. **Tap products** to add them to the order
4. Review the **order summary** on the right
5. Tap **"Checkout"** when ready

**For Cash Payment:**
- Select "Cash"
- Enter the amount tendered
- System calculates change
- Complete the sale!

**For Card Payment:**
- Select "Card"
- Choose card type (Visa, MC, Amex)
- Process on your card terminal
- Complete when approved!

💡 **Tips:**
- Tap items to add notes ("no ice", "extra hot")
- Use add-ons for customizations
- Hold orders to save for later!`,
    category: 'orders',
    relatedTopics: ['split-payment', 'discounts', 'refund']
  },
  {
    id: 'split-payment',
    keywords: ['split payment', 'split bill', 'multiple payments', 'share bill', 'pay separately'],
    question: 'How do I handle split payments?',
    answer: `Paymint makes split payments easy!

**How to Split:**
1. During checkout, tap **"Split Payment"**
2. Choose your split type:
   - **By Amount** - enter custom amounts for each method
   - **By Item** - drag items to separate payments
3. **Process each payment** separately
4. Complete when all payments collected!

**Example:**
Customer wants to pay $30 on card, rest in cash:
1. Split Payment > By Amount
2. Enter $30 for Card
3. Process card payment
4. Remaining balance shows for Cash
5. Collect cash and complete!

Works great for groups and couples paying separately!`,
    category: 'payments',
    relatedTopics: ['process-sale']
  },
  {
    id: 'view-orders',
    keywords: ['orders', 'view orders', 'order history', 'transactions', 'sales history', 'find order'],
    question: 'How do I view my orders?',
    answer: `You can view all orders in the Reports section!

**Finding Orders:**
1. Go to **Dashboard > Orders** (or Reports > Orders tab)
2. You'll see all orders with:
   - Order number and status
   - Items ordered
   - Total amount
   - Payment method
   - Timestamp

**Searching & Filtering:**
- Search by order number
- Filter by date range
- Filter by payment method
- Filter by employee
- Filter by status (completed, refunded)

**Order Details:**
Click any order to see full details including:
- All items with add-ons and notes
- Payment breakdown
- Discount applied
- Customer info (if loyalty used)`,
    category: 'orders',
    navigationPath: '/dashboard/:location/orders'
  },
  {
    id: 'hold-order',
    keywords: ['hold order', 'save order', 'hold', 'resume order', 'later', 'pending order'],
    question: 'How do I hold an order for later?',
    answer: `You can save orders to complete later!

**To Hold an Order:**
1. With items in your order, tap the **"Hold"** button (pause icon)
2. Enter a **nickname** (e.g., "John - Table 5")
3. Tap **"Hold Order"** to save

The order syncs to the server so all staff can see it!

**To Resume:**
1. Go to the **Notifications Screen**
2. Find your held order in the list
3. Tap to **resume**
4. Continue processing as normal!

Great for: dine-in customers, orders being prepared, waiting for more items!`,
    category: 'orders',
    relatedTopics: ['process-sale']
  },
  {
    id: 'refund',
    keywords: ['refund', 'return', 'cancel order', 'money back', 'void', 'partial refund'],
    question: 'How do I process a refund?',
    answer: `Here's how to handle refunds:

**Full Refund:**
1. Go to **Reports > Orders**
2. Find and tap the order
3. Tap **"Refund"**
4. Enter a **reason** (required)
5. Admin may need to authorize
6. Confirm to process!

**Partial Refund:**
1. Follow steps 1-2 above
2. Tap **"Partial Refund"**
3. Select the **items** to refund
4. Enter reason and confirm

**Admin Authorization:**
Some establishments require admin approval:
1. An admin selection modal appears
2. Admin enters their PIN
3. Refund proceeds

⚠️ All refunds are logged in the Activity Log for audit purposes.`,
    category: 'orders',
    navigationPath: '/dashboard/:location/orders',
    relatedTopics: ['view-orders']
  },

  // ========== DISCOUNTS & LOYALTY ==========
  {
    id: 'discounts',
    keywords: ['discount', 'coupon', 'promo', 'promotion', 'sale', 'offer', 'percentage off', 'apply discount'],
    question: 'How do I create and apply discounts?',
    answer: `Discounts can be applied at checkout!

**Creating Discounts:**
1. Go to **Dashboard > Discounts**
2. Click **"Add Discount"**
3. Choose type:
   - **Percentage** (e.g., 10% off)
   - **Fixed Amount** (e.g., $5 off)
4. Set conditions (min purchase, specific items, dates)
5. Create a promo code (optional)
6. Save and activate!

**Applying During Sale:**
1. With items in order, tap **"Discount"**
2. Select from available discounts
3. Tap **"Apply"**

**Item-Level Discount:**
1. Tap an item in the order
2. Select "Apply Discount"
3. Choose discount for that item only!`,
    category: 'feature',
    navigationPath: '/dashboard/:location/discounts'
  },
  {
    id: 'loyalty',
    keywords: ['loyalty', 'rewards', 'points', 'loyalty program', 'customer rewards', 'enroll customer'],
    question: 'How does the loyalty program work?',
    answer: `Paymint has a built-in loyalty program to reward your customers!

**Setting Up:**
1. Go to **Dashboard > Loyalty**
2. Enable the program
3. Set earning rules (e.g., 1 point per $1 spent)
4. Create rewards (e.g., 100 points = $10 off)
5. Set up tiers if desired

**Enrolling Customers:**
1. Tap **"Loyalty"** on the sales screen
2. Tap **"New Customer"**
3. Enter name and phone number
4. Register!

**Using Points:**
1. Tap **"Loyalty"** during checkout
2. Search for the customer
3. View their points balance
4. Select a reward to redeem
5. Apply to the order!

Points are automatically earned on each purchase! 🎁`,
    category: 'loyalty',
    navigationPath: '/dashboard/:location/loyalty'
  },

  // ========== STAFF MANAGEMENT ==========
  {
    id: 'add-staff',
    keywords: ['staff', 'employee', 'add employee', 'team', 'worker', 'hire', 'new staff'],
    question: 'How do I add staff members?',
    answer: `Here's how to add new team members:

1. Go to **Dashboard > Staff**
2. Click **"Add Employee"**
3. Fill in the details:
   - **Name** - employee's full name
   - **Email** - for login and notifications
   - **PIN** - 4-digit code for quick POS login
   - **Role** - Admin or User
4. Set **permissions** (for User role)
5. Save!

The employee will receive an email invitation to set up their account.

**Quick Access:**
Employees can log in via:
- Staff selection screen + PIN
- Traditional username/password`,
    category: 'staff',
    navigationPath: '/dashboard/:location/staff',
    relatedTopics: ['roles-permissions']
  },
  {
    id: 'roles-permissions',
    keywords: ['roles', 'permissions', 'access', 'custom role', 'restrict', 'admin', 'user role'],
    question: 'How do I set up roles and permissions?',
    answer: `Roles control what staff members can do!

**Default Roles:**
- **Admin** - Full access to everything
- **User** - Limited based on permissions

**Creating Custom Roles:**
1. Go to **Dashboard > Roles**
2. Click **"Add Role"**
3. Name your role (e.g., "Shift Manager")
4. Select permissions:
   - Dashboard access
   - Reports access
   - Settings access
   - Inventory management
   - Employee management
   - Process refunds
   - And more!
5. Save the role

**Assigning Roles:**
Edit an employee and select their role from the dropdown.

💡 **Tip:** Owner-level roles can be created at **Owner Portal > Roles** for organization-wide access!`,
    category: 'staff',
    navigationPath: '/dashboard/:location/roles'
  },
  {
    id: 'deactivate-employee',
    keywords: ['deactivate employee', 'remove employee', 'fire', 'terminate', 'disable access'],
    question: 'How do I deactivate an employee?',
    answer: `To remove access for an employee:

1. Go to **Dashboard > Staff**
2. Find and tap the employee
3. Toggle **"Active"** switch to OFF
4. Confirm the deactivation

**What Happens:**
- The employee can no longer log in
- Their historical data is preserved
- They disappear from the active staff list
- Can be reactivated later if needed

⚠️ **Note:** You cannot delete employees entirely - this preserves audit trails and historical records.`,
    category: 'staff',
    navigationPath: '/dashboard/:location/staff'
  },

  // ========== REPORTS ==========
  {
    id: 'reports',
    keywords: ['report', 'reports', 'analytics', 'data', 'statistics', 'insights', 'sales report'],
    question: 'What reports are available?',
    answer: `Paymint offers comprehensive reporting!

**Report Types:**
- **General Reports** - Overall sales summaries and financial metrics
- **Item Reports** - Product performance analysis (best/worst sellers)
- **Order History** - Searchable list of all transactions
- **Staff Reports** - Employee performance metrics
- **Shift Reports** - Shift summaries and cash handling
- **Peak Hours** - Identify your busiest times
- **Discount Reports** - Usage and impact
- **Tax Reports** - Tax collected by category

**Filtering:**
- Date range (today, 7 days, 30 days, custom)
- By employee
- By payment method
- By order status

**Export Options:**
- PDF download
- Email directly
- Print reports

Go to **Dashboard > Reports** to explore!`,
    category: 'reports',
    navigationPath: '/dashboard/:location/reports'
  },
  {
    id: 'export-reports',
    keywords: ['export', 'pdf', 'download report', 'email report', 'print report'],
    question: 'How do I export or print reports?',
    answer: `You can export reports in multiple ways!

**Export as PDF:**
1. Open the desired report
2. Click **"Export PDF"**
3. Choose where to save

**Email Report:**
1. Open the report
2. Click **"Email"**
3. Enter recipient email
4. Send!

**Print Report:**
1. Open the report
2. Click **"Print"**
3. Select your printer
4. Print!

All exports include the current filters applied, so you get exactly the data you need.`,
    category: 'reports',
    navigationPath: '/dashboard/:location/reports'
  },

  // ========== SETTINGS ==========
  {
    id: 'settings',
    keywords: ['settings', 'configure', 'setup', 'preferences', 'options', 'customize'],
    question: 'Where can I find settings?',
    answer: `Settings are organized in a few places:

**Location Settings** (/dashboard/[location]/settings):
- Business name, logo, address
- Receipt customization
- Tax rate configuration
- Working hours
- Theme colors
- Dark mode toggle

**Owner Account** (/owner/account):
- Personal profile info
- Password & security
- Notification preferences

**Owner Billing** (/owner/billing):
- Subscription management
- Payment method
- Invoices

**POS App Settings:**
- Printer configuration
- Language (English/Arabic)
- Display preferences`,
    category: 'settings',
    navigationPath: '/dashboard/:location/settings'
  },
  {
    id: 'theme',
    keywords: ['theme', 'color', 'dark mode', 'appearance', 'customize look'],
    question: 'How do I change the theme or enable dark mode?',
    answer: `Customize the look and feel!

**Changing Theme Color:**
1. Go to **Settings > Your Restaurant**
2. Find the **"Theme"** section
3. Select a color:
   - 🟢 Green (Default)
   - 🟡 Yellow
   - 🔵 Blue
4. Changes apply immediately!

**Dark Mode:**
1. Go to **Settings > Your Restaurant**
2. Toggle **"Dark Mode"** ON
3. Great for low-light environments!

Both work on the POS app and web dashboard.`,
    category: 'settings',
    navigationPath: '/dashboard/:location/settings'
  },
  {
    id: 'receipt',
    keywords: ['receipt', 'receipt settings', 'customize receipt', 'farewell message', 'logo on receipt'],
    question: 'How do I customize receipts?',
    answer: `Customize what appears on your receipts!

**Receipt Settings:**
1. Go to **Settings > Your Restaurant**
2. You can customize:
   - **Restaurant Name** - displayed at top
   - **Logo** - your brand image
   - **Farewell Message** - custom thank you message
   - **Tax Display** - shows percentage (e.g., "Tax (16%)")

**What's on a Receipt:**
- Restaurant name and logo
- Date and time
- Order number
- Items with prices
- Add-ons and modifications
- Subtotal and tax
- Discounts applied
- Total amount
- Payment method
- Change given (for cash)
- Cashier name
- Your farewell message!`,
    category: 'settings',
    relatedTopics: ['printer']
  },
  {
    id: 'establishments',
    keywords: ['establishment', 'location', 'store', 'branch', 'multiple locations', 'add store'],
    question: 'How do I manage multiple locations?',
    answer: `Paymint supports multi-location management!

**Owner Portal Overview:**
1. Go to **Owner Portal** (/owner)
2. See all establishments at a glance
3. KPI cards show: Total stores, Active nodes, Trials

**Managing Locations:**
- Click any establishment to enter its dashboard
- Add new locations with the onboarding wizard
- Filter by status (Active, Trial, Canceled)
- Search by name or ID

**Brands:**
- Group locations under brands
- Unified branding and settings
- Consolidated reporting

**Switching Locations:**
Use the location selector to switch between your stores - each has its own dashboard and data.`,
    category: 'feature',
    navigationPath: '/owner/establishments'
  },

  // ========== HARDWARE ==========
  {
    id: 'printer',
    keywords: ['printer', 'receipt printer', 'print', 'connect printer', 'printer not working'],
    question: 'How do I set up a receipt printer?',
    answer: `Here's how to connect your printer:

**Setup:**
1. Go to **Settings > Your Restaurant**
2. Scroll to **Printer Configuration**
3. Select printer type: Bluetooth, Wi-Fi, or USB
4. Tap **"Search for Printers"**
5. Select your printer from the list
6. Print a **test receipt** to verify!

**Supported Printers:**
- Epson TM series
- Star TSP series
- Bluetooth thermal printers

**Troubleshooting:**
- Make sure printer is powered ON
- Check Bluetooth/Wi-Fi is enabled
- Ensure printer is in range
- Check paper is loaded correctly

Need more help? See our troubleshooting section!`,
    category: 'technical',
    relatedTopics: ['printer-issues']
  },
  {
    id: 'barcode-scanner',
    keywords: ['barcode', 'scanner', 'scan', 'barcode scanner'],
    question: 'How do I set up a barcode scanner?',
    answer: `Barcode scanners make checkout faster!

**Bluetooth Scanner Setup:**
1. Enable **Bluetooth** on your POS device
2. Put your scanner in **pairing mode**
3. Select the scanner from Bluetooth devices
4. Once paired, it works automatically!

**Using the Scanner:**
- On the Sales Screen, just scan any barcode
- The product automatically adds to the order
- Works with products that have SKU/barcode set

**Tip:** Set barcodes when adding products:
1. Edit product
2. Enter SKU/Barcode field
3. Save

You can also use the device camera for barcode scanning!`,
    category: 'technical'
  },

  // ========== TROUBLESHOOTING ==========
  {
    id: 'connection-issues',
    keywords: ['connection', 'offline', 'no internet', 'connection failed', 'server error', 'not connecting'],
    question: "The app says 'Connection Failed'. What do I do?",
    answer: `Let's fix that connection issue!

**Quick Fixes:**
1. Check your device is connected to **Wi-Fi**
2. Try loading a website to verify internet works
3. **Restart the Paymint app**
4. Restart your **Wi-Fi router** if needed

**Still not working?**
- Clear app cache: Settings > Apps > Paymint > Clear Cache
- Close other apps to free up resources
- Make sure you have sufficient storage
- Try switching between Wi-Fi and mobile data

**Offline Mode:**
Paymint can work offline for basic cash sales! Data syncs when you reconnect.

If the issue persists, contact our support team at **support@paymint.io**`,
    category: 'troubleshooting'
  },
  {
    id: 'printer-issues',
    keywords: ['printer not found', 'printer not working', 'cant print', 'receipt not printing', 'print error'],
    question: 'My printer is not working. How do I fix it?',
    answer: `Let's troubleshoot your printer!

**Printer Not Connecting:**
1. Verify printer is **powered ON**
2. Check Bluetooth/Wi-Fi is enabled on both devices
3. Ensure printer is **within range**
4. Go to Settings > Printer
5. Tap **"Search for Printers"**
6. Select and test

**Receipt Not Printing:**
1. Check printer has **paper loaded**
2. Verify printer is selected in settings
3. Print a **test receipt** from settings
4. Restart printer if needed

**Print Quality Issues:**
1. Check paper is loaded correctly (thermal side toward print head)
2. Clean the print head
3. Replace the paper roll if faded

Still stuck? Contact **support@paymint.io**!`,
    category: 'troubleshooting'
  },
  {
    id: 'shift-issues',
    keywords: ['shift already active', 'cant start shift', 'another shift', 'shift conflict'],
    question: "It says 'Shift Already Active'. What should I do?",
    answer: `This means another user has an open shift!

**Solutions:**
1. **Contact the active user** and ask them to close their shift
2. If they're unavailable, ask an **admin to force-close** the shift
3. Check the Dashboard to see who has the active shift

**Why This Happens:**
- Only one shift can be active at a time
- The previous user may have forgotten to close their shift
- Ensures accurate cash reconciliation

**Prevention:**
- Always close your shift before leaving
- Use the "End Shift" button on the Dashboard
- Count your cash and complete the Z-Report`,
    category: 'troubleshooting'
  },
  {
    id: 'payment-issues',
    keywords: ['payment failed', 'card declined', 'card not working', 'payment error'],
    question: 'A card payment failed. What do I do?',
    answer: `Here's how to handle payment issues:

**Card Payment Failed:**
1. Verify card terminal is **connected and powered**
2. Check the terminal has **network connection**
3. Ask customer to **try again**
4. Try a **different card** if available
5. If card system is down, offer **cash payment** (with consent)

**Split Payment Issues:**
1. Verify all amounts are **entered correctly**
2. Ensure split amounts **equal the order total**
3. Cancel and restart if needed

**Common Causes:**
- Insufficient funds
- Card expired
- Terminal connection issue
- Card reader dirty

💡 **Tip:** Keep the card terminal connection checked regularly!`,
    category: 'troubleshooting'
  },
  {
    id: 'session-expired',
    keywords: ['session expired', 'logged out', 'login again', 'session timeout'],
    question: 'I got logged out / session expired. Why?',
    answer: `Sessions expire for security!

**Why It Happens:**
- Long period of inactivity
- Security timeout settings
- Network interruption

**What To Do:**
Simply **log back in** with your credentials!

**To Prevent:**
- Enable "Keep me logged in" on trusted devices
- Stay active in the app
- Ensure stable internet connection

If you're getting logged out frequently, check your network connection or contact support.`,
    category: 'troubleshooting'
  },

  // ========== BILLING ==========
  {
    id: 'billing',
    keywords: ['billing', 'subscription', 'plan', 'pricing', 'invoice', 'payment'],
    question: 'How does billing work?',
    answer: `Here's how Paymint billing works:

**Trial Period:**
- New users get a **7-day free trial**
- Full access to all features
- No credit card required to start

**Subscription:**
- Monthly billing after trial
- Secure payment via saved card
- View and manage at **Owner > Billing**

**What You Can Do:**
- View current plan
- Upgrade or downgrade
- See payment history
- Download invoices
- Update payment method

**Multiple Locations:**
Each establishment has its own subscription. Adding new locations is easy through the onboarding wizard!

Questions about billing? Contact **support@paymint.io**`,
    category: 'billing',
    navigationPath: '/owner/billing'
  },

  // ========== MISC ==========
  {
    id: 'contact-support',
    keywords: ['support', 'help', 'contact', 'customer service', 'issue', 'problem', 'email support'],
    question: 'How do I contact support?',
    answer: `We're here to help! 💚

**Contact Us:**
📧 **Email:** support@paymint.io

**When Contacting Support, Include:**
- Exact error message (if any)
- Steps that caused the issue
- Device model and OS version
- Time the issue occurred
- Screenshots if possible

**In-App Support:**
Settings > About Us > Contact Support

**Response Time:**
We aim to respond within 24 hours. For urgent issues, include "URGENT" in your subject line!`,
    category: 'technical'
  },
  {
    id: 'activity-logs',
    keywords: ['activity', 'logs', 'audit', 'history', 'changes', 'who did what', 'audit log'],
    question: 'How do I view activity logs?',
    answer: `Activity logs track everything that happens!

**Accessing Logs:**
Go to **Dashboard > Activity Logs** (Admin only)

**What's Tracked:**
- Product changes (added, edited, deleted)
- Employee actions (login, logout, permission changes)
- Order activities (sales, refunds, voids)
- Settings changes
- Cash operations (pay in/out, shifts)

**Filtering:**
- Select date range
- Filter by user
- Filter by action type

**Export:**
Export to PDF for record-keeping and audits!

Great for security, accountability, and troubleshooting!`,
    category: 'technical',
    navigationPath: '/dashboard/:location/activity-logs'
  },
  {
    id: 'language',
    keywords: ['language', 'arabic', 'english', 'rtl', 'translate', 'change language'],
    question: 'How do I change the language?',
    answer: `Paymint supports multiple languages!

**Available Languages:**
- English
- Arabic (includes RTL layout support)

**To Change:**
1. Go to **Settings > Language**
2. Select your preferred language
3. Restart the app if prompted

The entire interface will update to your chosen language, including all menus, buttons, and messages!`,
    category: 'settings'
  },
  {
    id: 'security',
    keywords: ['security', 'pin', 'password security', 'safe', 'protect'],
    question: 'What are the security best practices?',
    answer: `Keep your account secure with these tips!

**Best Practices:**
1. **Never share your PIN** with other employees
2. **Log out** when leaving the POS unattended
3. **Report suspicious activity** to management immediately
4. **Change password** if you suspect it's compromised
5. **Close your shift** before leaving for the day
6. **Count cash carefully** during reconciliation

**For Admins:**
- Regularly review activity logs
- Use role-based permissions
- Deactivate former employees promptly
- Keep software updated

Your security is our priority! 🔒`,
    category: 'account'
  }
];

// Friendly greeting responses - varied and warm
export const GREETINGS = [
  "Hey there! 👋 I'm Minto, your Paymint assistant. What can I help you with today?",
  "Hi! Welcome! I'm Minto, here to help you get the most out of Paymint. What's on your mind?",
  "Hello! 👋 Great to see you! I'm Minto - ask me anything about Paymint!",
  "Hey! I'm Minto, your friendly Paymint guide. How can I make your day easier?",
  "Hi there! 😊 I'm Minto. Whether it's products, orders, or settings - I've got you covered!",
];

// Fallback responses when no match - encouraging and helpful
export const FALLBACK_RESPONSES = [
  "Hmm, I'm not quite sure about that one! Could you try rephrasing? Or ask me about things like products, orders, staff, reports, or settings - I know a lot about those! 😊",
  "That's a good question! I don't have specific info on that, but I'd love to help with something else. What about adding products, processing sales, or managing your team?",
  "I couldn't find an exact answer for that. Try asking things like 'How do I add a product?' or 'How do I process a refund?' - I'm great with those!",
  "Interesting question! I might need more context. Could you be more specific? In the meantime, feel free to ask about any Paymint features!",
  "I'm still learning! 🤓 I don't have info on that specific topic, but I can help with sales, inventory, reports, staff management, and more!",
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

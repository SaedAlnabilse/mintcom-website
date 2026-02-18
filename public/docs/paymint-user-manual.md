# Paymint POS System
## User Manual

**Version:** 6.0  
**Target Audience:** Cashiers, Store Managers, and System Administrators  
**Last Updated:** January 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [The Dashboard](#3-the-dashboard)
4. [Daily Operations](#4-daily-operations)
   - 4.1 Processing a Sale (Cash/Card)
   - 4.2 Applying Discounts & Coupons
   - 4.3 Handling Returns & Refunds
   - 4.4 Managing Inventory (Adding/Editing Products)
5. [Admin Functions](#5-admin-functions)
6. [Troubleshooting](#6-troubleshooting)
7. [Appendix](#7-appendix)

---

## 1. Introduction

### What is Paymint?

Paymint is a comprehensive Point of Sale (POS) system designed specifically for restaurants, cafes, and retail establishments. It streamlines your daily operations by providing an intuitive interface for processing sales, managing inventory, tracking employee performance, and generating detailed business reports.

### Key Features

| Feature | Description |
|---------|-------------|
| **Multi-Tenant Support** | Connect multiple devices to a single restaurant account |
| **Real-Time Sales Tracking** | Monitor sales, orders, and revenue as they happen |
| **Shift Management** | Track employee shifts with automatic cash reconciliation |
| **Inventory Control** | Real-time stock deduction and low-stock alerts |
| **Loyalty Program** | Built-in customer rewards and points system |
| **Multi-Language Support** | Full English and Arabic (RTL) interface support |
| **Comprehensive Reports** | Detailed analytics with PDF export capability |
| **Split Payments** | Handle complex payment scenarios with ease |

### System Requirements

- **Device:** Android tablet or iPad (10" or larger recommended)
- **Internet:** Stable Wi-Fi connection required
- **Peripherals:** Compatible receipt printer, barcode scanner (optional)

---

## 2. Getting Started

### 2.1 Connecting to Your Restaurant

Before using the POS, you must first connect the app to your restaurant account.

*[Insert Screenshot of Connect Restaurant Screen]*

1. **Launch** the Paymint app on your device.
2. **Enter Restaurant ID** in the designated field (e.g., `cafe-aroma`).
3. **Enter Restaurant Password** provided by your administrator.
4. **Tap "Connect Restaurant"** to verify and establish connection.

> **Note:** Once connected, the app remembers your restaurant and proceeds directly to the login screen on subsequent launches.

### 2.2 Logging In

Paymint offers two login methods:

#### Option A: Staff Selection (Recommended)

*[Insert Screenshot of Who's Working Screen]*

1. **Select Your Profile** from the list of staff members displayed on screen.
2. **Enter Your 4-Digit PIN** using the on-screen keypad.
3. **Wait for Verification** - the system will log you in automatically.

#### Option B: Traditional Login

*[Insert Screenshot of Login Screen]*

1. **Enter Username** in the username field.
2. **Enter Password** in the password field.
3. **Tap "Log In"** to access the system.

### 2.3 Starting Your Shift

After logging in, you will be prompted to manage your shift:

| Scenario | Action Required |
|----------|-----------------|
| No active shift | Start a new shift by entering the opening cash amount |
| Your shift is active | Choose to resume your existing shift |
| Another user's shift is active | System will display a conflict notification |

**To Start a New Shift:**

1. **Tap "Start Shift"** when prompted.
2. **Enter Opening Cash Amount** - count the cash in your drawer.
3. **Confirm** the amount to begin your shift.

*[Insert Screenshot of Start Shift Modal]*

### 2.4 Hardware Setup

#### Receipt Printer Setup

1. Navigate to **Settings > Your Restaurant**.
2. Scroll to **Printer Configuration**.
3. **Select Printer Type** (Bluetooth, Wi-Fi, or USB).
4. **Tap "Search for Printers"** to discover available devices.
5. **Select Your Printer** from the list.
6. **Print Test Receipt** to verify connection.

#### Barcode Scanner Setup

1. Enable Bluetooth on your POS device.
2. Put your barcode scanner in pairing mode.
3. Select the scanner from the Bluetooth devices list.
4. Once paired, the scanner will work automatically with the Sales Screen.

### 2.5 Password Recovery

If you forget your password:

1. **Tap "Forgot Password?"** on the login screen.
2. An **Administrator Authorization** modal will appear.
3. Request an admin to authorize the reset.
4. Enter the **One-Time Password (OTP)** sent to you.
5. Create a **New Password** and confirm.

---

## 3. The Dashboard

The Dashboard is your command center, providing a real-time overview of your business performance.

*[Insert Screenshot of Dashboard Screen]*

### 3.1 Main Screen Layout

```
+------------------------------------------------------------------+
|  HEADER: Restaurant Name  |  Date/Time  |  User: [Name]          |
+------------------------------------------------------------------+
|                                                                   |
|  +-------------------+  +-------------------+  +----------------+ |
|  |   Total Sales       |  |  NUMBER OF        |  |  CASH SALES    | |
|  |   $1,234.50       |  |  ORDERS: 47       |  |  $567.00       | |
|  +-------------------+  +-------------------+  +----------------+ |
|                                                                   |
|  +-------------------+  +-------------------+  +----------------+ |
|  |   CARD SALES      |  |  OTHER PAYMENTS   |  |  PAY-IN/PAY-OUT    | |
|  |   $567.50         |  |  $100.00          |  |  +$50 / -$25   | |
|  +-------------------+  +-------------------+  +----------------+ |
|                                                                   |
|  +------------------------------------------------------+        |
|  |           SALES TREND CHART (Hourly)                 |        |
|  |   [Visual bar chart showing sales throughout day]    |        |
|  +------------------------------------------------------+        |
|                                                                   |
|  +-------------------+  +-------------------+                     |
|  |   SHIFT ACTIONS   |  |  CASH IN/OUT      |                     |
|  |   [End Shift]     |  |  [Add Cash]       |                     |
|  +-------------------+  +-------------------+                     |
+------------------------------------------------------------------+
```

### 3.2 Key Metrics Explained

| Metric | Description |
|--------|-------------|
| **Total Sales** | Total revenue after discounts and refunds |
| **Number of Orders** | Count of completed transactions during current shift |
| **Cash Sales** | Revenue collected via cash payments |
| **Card Sales** | Revenue from credit/debit card transactions |
| **Other Payments** | Revenue from third-party services (Talabat, Careem, etc.) |
| **PAY-IN/PAY-OUT** | Summary of petty cash movements |
| **Total Hours Worked** | Cumulative hours worked during current shift |
| **Cash Discrepancy** | Any surplus or deficit detected during reconciliation |

### 3.3 Dashboard Actions

**Refreshing Data:**
- **Pull down** on the screen to refresh all metrics instantly.

**Cash Management:**
- **Tap "Cash In"** to record cash added to the drawer.
- **Tap "Cash Out"** to record cash removed from the drawer.

**Viewing Sales Trend:**
- The chart displays hourly sales performance.
- Helps identify peak selling times for staffing decisions.

---

## 4. Daily Operations

### 4.1 Processing a Sale (Cash/Card)

*[Insert Screenshot of Sales Screen]*

#### Step-by-Step: Processing a Basic Sale

1. **Navigate to Sales Screen** using the bottom navigation bar.
2. **Select Category** from the left sidebar or top category bar.
3. **Tap Products** to add them to the order.
4. **Review Order Summary** in the right panel.
5. **Tap "Checkout"** when the order is complete.

*[Insert Screenshot of Checkout Screen]*

#### Accepting Cash Payment

1. Complete steps 1-5 above.
2. **Select "Cash"** as the payment method.
3. **Enter Amount Tendered** using the on-screen keypad.
4. System calculates and displays **Change Due**.
5. **Tap "Complete Sale"** to finalize.
6. **Give Change** to customer and hand over receipt.

#### Accepting Card Payment

1. Complete steps 1-5 above.
2. **Select "Card"** as the payment method.
3. **Choose Card Type** (Visa, Mastercard, American Express, etc.).
4. Process payment on your card terminal.
5. **Tap "Complete Sale"** once card transaction is approved.

#### Adding Notes to Items

1. After adding an item, **tap the item** in the order summary.
2. **Tap "Add Note"** or the pencil icon.
3. **Enter Special Instructions** (e.g., "No ice", "Extra spicy").
4. **Tap "Save"** to attach the note.

> **Tip:** Items with notes display a visible indicator to ensure kitchen staff don't miss customizations.

#### Using Add-ons/Modifiers

*[Insert Screenshot of Add-on Modal]*

1. **Tap a product** that has available add-ons.
2. The **Add-on Modal** appears automatically.
3. **Select Required Options** (e.g., size, milk type).
4. **Select Optional Add-ons** (e.g., extra shot, whipped cream).
5. **Tap "Add to Order"** to include the customized item.

#### Split Payment

For customers paying with multiple methods:

1. During checkout, **tap "Split Payment"**.
2. **Choose Split Type:**
   - **Split by Amount:** Enter custom amounts for each payment method
   - **Split by Item:** Drag and drop items to separate payments
3. **Process Each Payment** separately.
4. **Complete Sale** when all payments are collected.

*[Insert Screenshot of Split Payment Modal]*

#### Holding an Order

To save an order for later:

1. **Tap the "Hold" button** (pause icon) in the order panel.
2. **Enter a Nickname** for the order (e.g., "John - Table 5").
3. **Tap "Hold Order"** to save.
4. The order syncs to the server and is visible to all staff members.

**To Resume a Held Order:**

1. Navigate to **Notifications Screen**.
2. Find the held order in the list.
3. **Tap to Resume** the order.
4. Continue processing as normal.

---

### 4.2 Applying Discounts & Coupons

*[Insert Screenshot of Discount Selection]*

#### Applying a Preset Discount

1. With items in your order, **tap "Discount"** in the order panel.
2. **Select Discount Type** from available options:
   - Percentage discounts (e.g., 10% off)
   - Fixed amount discounts (e.g., $5 off)
   - Special promotions
3. **Tap "Apply"** to add the discount.
4. The **discount is reflected** in the order total.

#### Applying Item-Level Discount

1. **Tap an item** in the order summary.
2. **Select "Apply Discount"** from the item menu.
3. **Choose Discount** to apply to that specific item only.
4. **Confirm** the discount application.

#### Using the Loyalty Program

*[Insert Screenshot of Loyalty Modal]*

**Enrolling a New Customer:**

1. **Tap "Loyalty"** button on the Sales Screen.
2. **Tap "New Customer"**.
3. **Enter Customer Name** and **Phone Number**.
4. **Tap "Register"** to create the account.

**Applying Loyalty Points:**

1. **Tap "Loyalty"** button.
2. **Search** for the customer by name or phone.
3. **Select Customer** from search results.
4. View available **Points Balance** and **Rewards**.
5. **Select Reward** to redeem (if eligible).
6. **Tap "Apply"** to use points toward purchase.

> **Note:** Points are automatically earned on each purchase and tracked in the customer's profile.

---

### 4.3 Handling Returns & Refunds

*[Insert Screenshot of Reports Screen - Order History]*

#### Processing a Full Refund

1. Navigate to **Reports** using the bottom navigation.
2. Select the **"Orders"** tab to view order history.
3. **Search** for the order using:
   - Order number
   - Date/time filters
   - Customer name (if loyalty was used)
4. **Tap the Order** to view details.
5. **Tap "Refund"** button.
6. **Enter Refund Reason** (required field).
7. **Request Admin Authorization** if required by your settings.
8. **Confirm Refund** to process.

*[Insert Screenshot of Refund Modal]*

#### Processing a Partial Refund

1. Follow steps 1-4 above.
2. **Tap "Partial Refund"** option.
3. **Select Items** to be refunded.
4. **Enter Reason** for the partial refund.
5. **Confirm** to process the partial amount.

#### Refund Authorization

Depending on your establishment's settings, refunds may require admin approval:

1. When prompted, an **Admin Selection Modal** appears.
2. **Select an Administrator** from the list.
3. Admin must **enter their PIN** to authorize.
4. Once authorized, refund processes automatically.

> **Important:** All refunds are logged in the Activity Log for audit purposes.

---

### 4.4 Managing Inventory (Adding/Editing Products)

Access inventory management through **Settings > Product Management**.

*[Insert Screenshot of Product Management Screen]*

#### Adding a New Product

1. Navigate to **Settings > Product Management**.
2. **Tap "Add Item"** button (+ icon).
3. Complete the product form:

| Field | Description |
|-------|-------------|
| **Product Name** | Display name shown on Sales Screen |
| **Price** | Selling price in your currency |
| **Description** | Optional product description |
| **Category** | Assign to existing or new category |
| **Cost Price** | Purchase cost for profit calculations |
| **SKU/Barcode** | Optional identifier for scanning |
| **Product Image** | Upload photo (tap camera icon) |

4. **Enable Stock Tracking** (toggle) if tracking inventory levels.
5. **Set Initial Stock** quantity if tracking is enabled.
6. **Tap "Save"** to create the product.

*[Insert Screenshot of Add Item Form]*

#### Editing an Existing Product

1. Navigate to **Settings > Product Management**.
2. **Find the Product** using search or scrolling.
3. **Tap the Product** to open edit mode.
4. **Modify Fields** as needed.
5. **Tap "Save"** to apply changes.

#### Managing Product Categories

1. Navigate to **Settings > Product Management**.
2. **Tap "Categories"** tab.
3. To add: **Tap "Add Category"** and enter name.
4. To edit: **Tap existing category** and modify.
5. To reorder: **Drag and drop** categories.

#### Managing Add-ons (Attributes)

Navigate to **Settings > Add-Ons (Attributes)**.

*[Insert Screenshot of Attributes Screen]*

1. **Tap "Add Group"** to create a new add-on group.
2. **Enter Group Name** (e.g., "Milk Type", "Size").
3. **Configure Settings:**
   - **Required:** Customer must select an option
   - **Multi-Select:** Allow multiple selections
4. **Add Options** within the group (e.g., "Oat Milk +$0.50").
5. **Assign to Products** that should use this add-on group.
6. **Tap "Save"** to apply.

#### Updating Stock Levels

Navigate to **Settings > Stock Management**.

*[Insert Screenshot of Stock Management Screen]*

1. **Find the Product** using search or scrolling.
2. **Tap the Product** to open stock editor.
3. **Adjust Quantity:**
   - Enter new stock count, OR
   - Use +/- buttons to increment/decrement
4. **Enter Reason** for adjustment (optional but recommended).
5. **Tap "Save"** to update inventory.

> **Tip:** Stock is automatically deducted when items are sold. Low-stock alerts appear when quantities fall below thresholds.

---

## 5. Admin Functions

### 5.1 Accessing Reports

Navigate to **Reports** using the bottom navigation bar.

*[Insert Screenshot of Reports Screen]*

#### Available Report Types

| Report Tab | Description |
|------------|-------------|
| **General Reports** | Overall sales summaries and financial metrics |
| **Item Reports** | Individual product performance analysis |
| **Order History** | Searchable list of all transactions |

#### Filtering Reports

1. **Tap the Filter Icon** to open filter options.
2. **Select Date Range:**
   - Today
   - Last 7 Days
   - Last 30 Days
   - This Month
   - Custom Range
3. **Apply Additional Filters:**
   - Employee
   - Payment Method
   - Card Type
   - Order Status (Completed/Refunded)
   - Discount Used
4. **Tap "Apply"** to filter results.

*[Insert Screenshot of Report Filters]*

#### Peak Hours Analysis

The **Peak Hours Chart** shows order volume by hour:

1. Navigate to Reports.
2. View the hourly bar chart.
3. Identify your busiest times for staffing optimization.

#### Top Selling Items

1. Navigate to Reports.
2. View **"Top Selling Items"** section.
3. Toggle between **Today**, **Week**, or **Month** views.
4. Use insights for inventory planning and menu optimization.

#### Exporting Reports

**To Export as PDF:**

1. Open the desired report.
2. **Tap "Export PDF"** button.
3. Choose save location or share directly.

**To Email Report:**

1. Open the desired report.
2. **Tap "Email"** button.
3. Enter recipient email address.
4. **Tap "Send"** to deliver report.

**To Print Report:**

1. Open the desired report.
2. **Tap "Print"** button.
3. Select your connected printer.
4. **Confirm** to print.

---

### 5.2 Managing Employee Permissions

Navigate to **Settings > Employee Management** (Admin Only).

*[Insert Screenshot of Employee Management Screen]*

#### Adding a New Employee

1. **Tap "Add Employee"** button.
2. Complete the employee form:

| Field | Description |
|-------|-------------|
| **Name** | Employee's full name |
| **Email** | Login email address |
| **PIN** | 4-digit PIN for quick login |
| **Role** | Admin or User |

3. **Assign Permissions** (for User role):
   - Dashboard access
   - Reports access
   - Settings access
   - Inventory management
   - Employee management
4. **Tap "Save"** to create the account.

#### Editing Employee Permissions

1. **Find the Employee** in the list.
2. **Tap** to open their profile.
3. **Modify Permissions** as needed.
4. **Tap "Save"** to apply changes.

#### Deactivating an Employee

1. **Find the Employee** in the list.
2. **Tap** to open their profile.
3. **Toggle "Active"** switch to OFF.
4. **Confirm** the deactivation.

> **Note:** Deactivated employees cannot log in but their historical data is preserved.

---

### 5.3 Closing the Shift (Z-Report)

The Z-Report summarizes all transactions for the shift and reconciles the cash drawer.

*[Insert Screenshot of End Shift Modal]*

#### Step-by-Step: Ending Your Shift

1. Navigate to **Dashboard**.
2. **Tap "End Shift"** button.
3. The **Shift Summary** appears displaying:
   - Total Sales
   - Cash Sales
   - Card Sales
   - Other Payments
   - Expected Cash in Drawer
   - PAY-IN/PAY-OUT transactions
4. **Count Physical Cash** in your drawer.
5. **Enter Counted Amount** in the field.
6. System calculates any **Discrepancy** (surplus or deficit).
7. **Tap "Close Shift"** to finalize.

#### Understanding Cash Discrepancy

| Scenario | Meaning | Action |
|----------|---------|--------|
| **Surplus** | More cash than expected | Investigate source of extra funds |
| **Deficit** | Less cash than expected | Report to manager immediately |
| **Balanced** | Cash matches expected amount | Shift closes normally |

> **Important:** Cash discrepancies are logged and reported to owners via the Paymint Backoffice app.

#### Printing the Z-Report

After closing your shift:

1. A prompt appears to **print the Z-Report**.
2. **Tap "Print"** to generate the receipt.
3. The report includes:
   - Shift start/end times
   - Total transactions
   - Payment breakdown
   - Cash reconciliation details
   - Operator name

---

### 5.4 Activity Log

Navigate to **Settings > Activity Log** (Admin Only).

*[Insert Screenshot of Activity Log Screen]*

The Activity Log tracks all system actions:

| Activity Type | Examples |
|---------------|----------|
| **Product Changes** | Items added, edited, or deleted |
| **Employee Actions** | Login, logout, permission changes |
| **Order Activities** | Sales, refunds, voids |
| **Settings Changes** | Configuration modifications |
| **Cash Operations** | PAY-IN, PAY-OUT, shift closures |

#### Filtering the Activity Log

1. **Select Date Range** to narrow results.
2. **Filter by User** to see specific employee actions.
3. **Filter by Type** to see specific action categories.
4. **Export to PDF** for record-keeping.

---

### 5.5 Restaurant Settings

Navigate to **Settings > Your Restaurant**.

*[Insert Screenshot of Your Restaurant Screen]*

#### Customization Options

| Setting | Description |
|---------|-------------|
| **Restaurant Name** | Displayed on receipts and app header |
| **Logo** | Brand image for receipts and interface |
| **Theme Color** | Choose Green, Yellow, or Blue |
| **Dark Mode** | High-contrast mode for low-light environments |
| **Working Hours** | Set operating hours |
| **Farewell Message** | Custom message on receipts |
| **Currency** | Set local currency symbol |
| **Tax Rate** | Configure default tax percentage |

#### Changing Theme

1. Navigate to **Settings > Your Restaurant**.
2. Find **"Theme"** section.
3. **Select Color Theme:**
   - Green (Default)
   - Yellow
   - Blue
4. Changes apply immediately.

#### Language Settings

1. Navigate to **Settings > Language**.
2. **Select Language:**
   - English
   - Arabic (includes RTL layout support)
3. **Restart App** if prompted for full effect.

---

## 6. Troubleshooting

### 6.1 Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| **"Connection Failed"** | No internet or server unavailable | Check Wi-Fi connection; try again in a few minutes |
| **"Invalid Credentials"** | Incorrect username or password | Verify login details; use "Forgot Password" if needed |
| **"Session Expired"** | Login session timed out | Log in again with your credentials |
| **"Printer Not Found"** | Printer disconnected or off | Check printer power and connection; re-pair if needed |
| **"Shift Already Active"** | Another user has an open shift | Contact the active user to close their shift, or request admin override |
| **"Insufficient Stock"** | Item quantity is zero | Update stock levels before selling |
| **"Payment Processing Failed"** | Card terminal issue | Retry transaction; check card terminal connection |
| **"Admin Authorization Required"** | Action requires admin approval | Request an administrator to authorize |

### 6.2 Printer Issues

**Printer Not Connecting:**

1. Verify printer is powered ON.
2. Check Bluetooth/Wi-Fi is enabled on both devices.
3. Ensure printer is within range.
4. Navigate to **Settings > Your Restaurant > Printer**.
5. **Tap "Search for Printers"** to rediscover.
6. Select printer and test connection.

**Receipt Not Printing:**

1. Check printer has paper loaded.
2. Verify printer is selected in settings.
3. **Print Test Receipt** from settings to verify.
4. Restart printer if issue persists.

**Print Quality Issues:**

1. Check paper is loaded correctly (thermal side facing print head).
2. Clean print head with appropriate cleaning card.
3. Replace paper roll if faded or wrinkled.

### 6.3 Connection Issues

**"Server Connection Failed":**

1. Check device is connected to Wi-Fi.
2. Verify internet is working (try loading a website).
3. Restart the Paymint app.
4. Restart your Wi-Fi router if needed.
5. Contact support if issue persists.

**Slow Performance:**

1. Close unused apps running in background.
2. Clear Paymint app cache (Settings > Apps > Paymint > Clear Cache).
3. Restart the device.
4. Ensure sufficient device storage available.

### 6.4 Payment Issues

**Card Payment Failed:**

1. Verify card terminal is connected and powered.
2. Ask customer to retry with a different card.
3. Check card terminal has network connection.
4. Process as cash payment if card system is down (with customer consent).

**Split Payment Calculation Error:**

1. Verify all amounts are entered correctly.
2. Ensure total of split amounts equals order total.
3. Cancel and restart split payment if needed.

### 6.5 Shift Issues

**Cannot Start Shift:**

1. Check if another user has an active shift.
2. Contact the active user to end their shift.
3. If user is unavailable, request admin to force-close the shift.

**Shift Data Not Showing:**

1. **Pull down to refresh** the Dashboard.
2. Verify you are logged into the correct account.
3. Check shift is actually started (not just logged in).

### 6.6 Contacting Support

If issues persist after troubleshooting:

1. Navigate to **Settings > About Us > Contact Support**.
2. Describe the issue in detail.
3. Include:
   - Error message (exact text)
   - Steps that caused the error
   - Device model and OS version
   - Time the issue occurred
4. Submit the support request.

**Support Contact:**
- Email: support@paymint.io
- In-App: Settings > Contact Support

---

## 7. Appendix

### 7.1 Keyboard Shortcuts (Tablet with Keyboard)

| Shortcut | Action |
|----------|--------|
| **Enter** | Confirm dialog/Complete action |
| **Escape** | Cancel/Close modal |
| **Tab** | Navigate between fields |

### 7.2 Glossary

| Term | Definition |
|------|------------|
| **Shift** | A work session from clock-in to cash-out |
| **Z-Report** | End-of-shift summary with cash reconciliation |
| **PAY-IN** | Cash added to drawer (not from sales) |
| **PAY-OUT** | Cash removed from drawer (not refunds) |
| **Held Order** | Saved order to be completed later |
| **Add-on** | Product modifier or customization option |
| **Loyalty Points** | Customer rewards earned from purchases |
| **Discrepancy** | Difference between expected and actual cash |
| **SKU** | Stock Keeping Unit - unique product identifier |
| **RTL** | Right-to-Left (Arabic language layout) |

### 7.3 Receipt Information

Standard receipts include:

- Restaurant name and logo
- Date and time
- Order number
- Items with prices
- Add-ons and modifications
- Subtotal
- Tax amount (with percentage displayed, e.g., "Tax (16%)")
- Discounts applied
- Total amount
- Payment method
- Change given (for cash)
- Cashier name
- Farewell message

### 7.4 Security Best Practices

1. **Never share your PIN** with other employees.
2. **Log out** when leaving the POS unattended.
3. **Report suspicious activity** to management immediately.
4. **Change password** if you suspect it's been compromised.
5. **Close your shift** before leaving for the day.
6. **Count cash carefully** during shift reconciliation.

---

## Document Information

| Field | Value |
|-------|-------|
| **Document Version** | 6.0 |
| **Product Version** | Paymint 5.0.0 |
| **License** | Paymint Enterprise |
| **Last Updated** | January 2026 |

---

*This manual is intended for authorized Paymint users. For additional support, please contact your system administrator or Paymint support team.*

*Generated for Paymint Inc.*




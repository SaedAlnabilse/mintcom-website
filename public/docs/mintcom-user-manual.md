# Mintcom User Manual

**Version:** 8.0  
**Last Updated:** May 17, 2026  
**Audience:** Account owners, brand administrators, location managers, supervisors, cashiers, and support users

## Table of Contents

1. What Mintcom Is
2. System Areas and User Roles
3. First-Time Setup
4. Product Categories and Menu Structure
5. Products, Add-ons, and Recipe Operations
6. Daily POS Workflow
7. Orders, Refunds, and Cash Control
8. Payment Methods and Billing
9. Staff, Roles, and Permissions
10. Reports, Exports, and Activity Logs
11. Owner and Brand Portals
12. Hardware, Apps, and Device Requirements
13. Offline Mode and Sync
14. Support, Security, and Troubleshooting
15. Launch Checklist

## 1. What Mintcom Is

Mintcom is a cloud POS and business management system for restaurants, cafes, bakeries, retail shops, kiosks, and multi-location operators.

Mintcom helps you:

- Process sales from the POS app
- Manage products, categories, add-ons, recipes, stock, and preparation workflows
- Track shifts, pay-in/pay-out records, refunds, discounts, and cash discrepancies
- Add employees and control access with roles and permissions
- Manage customers, loyalty, rewards, and discounts
- Review sales, payments, taxes, staff, items, categories, shifts, receipts, and activity logs
- Operate multiple establishments and brands from owner and brand portals
- Use English or Arabic, including right-to-left layout support for Arabic

## 2. System Areas and User Roles

Mintcom is organized into separate areas so each user works in the correct context.

### Public site and authentication

Use the public site to learn about Mintcom, create an account, sign in, reset a password, read legal pages, and open the support center.

### Onboarding

Use onboarding when creating a brand-new first location. Onboarding collects business details, subscription details, location credentials, and the first administrator profile.

### Location Dashboard

Use the location dashboard for daily back-office work for one establishment. The dashboard includes:

- Main dashboard
- Sales and reporting
- Orders
- Categories, products, add-ons, and recipe operations
- Payment methods
- Staff and roles
- Discounts, loyalty, and customers
- Settings
- Activity logs

### Owner Portal

Use the owner portal for account-level control:

- Overview
- Establishments
- Brands
- Employees
- Global roles
- Billing
- Account management

### Brand Portal

Use the brand portal for brand-level operations:

- Brand overview
- Brand locations
- Brand team

### POS app

Use the POS app on the store device for checkout, shifts, receipts, held orders, and daily sales.

## 3. First-Time Setup

Use onboarding only when creating a new first location.

Steps:

1. Create a Mintcom account.
2. Verify your email address.
3. Complete onboarding.
4. Enter the business name, business type, address, contact details, and currency.
5. Link subscription billing when requested.
6. Create the location login ID and password used by the POS app.
7. Create or confirm the first administrator profile.
8. Add categories, products, payment methods, tax settings, receipt settings, and staff.
9. Download and connect the POS app when the Android or iOS download link is configured for your deployment.
10. Run a test sale, test refund, and test receipt before live trading.

If you already have a brand or account and only need another branch, use Owner Portal > Establishments or Owner Portal > Brands instead of repeating first-time onboarding.

## 4. Product Categories and Menu Structure

Categories are the main structure for your POS menu. They help cashiers find products quickly and keep reports readable.

### Where to manage categories

Open Location Dashboard > Categories. The user must have inventory management permission to manage categories.

### What a category contains

Each category can include:

- Name
- Icon
- Sort order
- Active or inactive status
- Connected products

### Creating categories

1. Open Location Dashboard > Categories.
2. Select New Category.
3. Enter a clear name.
4. Choose an icon.
5. Set a sort order when you want manual ordering.
6. Save.

Recommended category names are short and operational:

- Hot Drinks
- Cold Drinks
- Bakery
- Breakfast
- Meals
- Desserts
- Retail Items
- Services
- Combos

### Bulk category import

The Categories page supports CSV import with a required Name column and a maximum of 200 rows. During import, Mintcom checks for duplicate category names and can suggest icons from names such as coffee, drink, cake, pizza, burger, fish, salad, retail, combo, gift, or featured.

### Category status and reactivation

Categories can be active or inactive. Use the status filter to view active, inactive, or all categories.

If you archive a category, it is removed from normal POS category selection. Categories cannot be reactivated; create a new category when you need that menu grouping again. Historical reports keep the archived category visible as `[Deleted]`.

### Archive, delete, and historical protection

Mintcom protects historical reports and receipts.

- A category with active products cannot be archived until those products are moved or archived.
- A category used in historical records may be archived instead of permanently deleted.
- A category with no products and no protected history may be deleted permanently.
- Historical receipts and reports keep their original category snapshots.

### Best practices

- Create categories before adding many products.
- Keep names consistent across locations.
- Avoid duplicate categories with slightly different spelling.
- Do not create one category for every product.
- Use categories for how staff search during checkout, not only for accounting.
- Review inactive categories before launching seasonal menus.

## 5. Products, Add-ons, and Recipe Operations

### Products

Products are sellable items shown in the POS.

Recommended product fields:

- Product name
- Price
- Category
- Image
- Tax behavior
- Stock tracking
- Recipe or preparation details
- Add-ons or modifiers

Create products from Location Dashboard > Products.

### Add-ons and modifiers

Use add-ons for options such as:

- Size
- Milk type
- Toppings
- Extras
- Preparation choices

Create add-on groups from Location Dashboard > Add-ons, then attach the group to the products that should show those choices.

### Recipe operations and stock

Use recipe operations when products consume ingredients, batches, or prepared components.

Recipe operations can help you:

- Track raw materials
- Build sub-recipes and final recipes
- Connect ingredients to sellable products
- Review low-stock conditions
- Keep stock behavior aligned with sales

Best practice:

- Create materials before recipes.
- Use consistent units.
- Test one sale and confirm expected stock behavior.
- Review recipe costs when supplier prices change.

## 6. Daily POS Workflow

### Start a shift

1. Sign in to the POS app.
2. Start a new shift if no shift is active.
3. Count opening cash.
4. Enter the opening amount.
5. Confirm the shift start.

Only one shift should be active for the same register workflow at a time.

### Process a sale

1. Select products from the POS menu.
2. Choose add-ons or modifiers when required.
3. Adjust quantities, notes, discounts, or tax if your role allows it.
4. Select checkout.
5. Choose the payment method.
6. Complete the sale.
7. Print or send the receipt.

### Hold and resume orders

Use held orders when a customer needs more time, an order is delayed, or a table or pickup workflow should continue later. Held order access depends on permissions.

### Close a shift

1. Review shift sales and payment totals.
2. Record pay-in and pay-out activity accurately.
3. Count closing cash.
4. Enter the counted amount.
5. Review any cash discrepancy.
6. Close the shift and keep the Z-report where required.

## 7. Orders, Refunds, and Cash Control

Use Location Dashboard > Orders to review completed transactions.

You can search and filter orders by fields such as date, status, staff member, and payment method.

### Refunds and voids

1. Open the order.
2. Review the order details.
3. Select Refund or Void when available.
4. Enter a clear reason.
5. Confirm the action.

Refunds and receipt cancellation require permissions. If the button is missing or disabled, ask an owner or manager to review your role.

### Cash control

Use pay-in and pay-out for non-sales cash movement. Do not use refunds to hide cash differences. Close the shift with the real counted cash and review discrepancies in reports.

## 8. Payment Methods and Billing

Mintcom has two different payment concepts.

### Store payment methods

Store payment methods are used at checkout by cashiers. Configure them from Location Dashboard > Payment Methods.

Common methods:

- Cash
- Card
- Card types such as Visa, Mastercard, and American Express
- Delivery platforms
- Wallets
- Vouchers
- Bank transfer or custom local methods

Keep method names short and consistent because they appear in orders, receipts, filters, and reports.

### Subscription billing

Subscription billing pays for Mintcom service access. Manage it from Owner Portal > Billing.

Current pricing:

- First location: 20 USD/month or 210 USD/year
- Additional locations: 17 USD/month or 180 USD/year
- New accounts include a 14-day trial when enabled by the billing flow

Billing actions may include:

- Add or update billing card
- Set default card
- Review billing status
- View invoices
- Switch monthly or yearly billing when available
- Resume or cancel subscription when allowed

Never send full card numbers through support tickets or chat.

## 9. Staff, Roles, and Permissions

Use staff and roles to control who can access each part of the system.

### Staff

Location staff are managed from Location Dashboard > Staff. Owner-level employees are managed from Owner Portal > Employees. Brand-level team access is managed from Brand Portal > Team.

### Roles and permissions

Mintcom supports role-based access control.

POS permissions can include:

- Process sales
- Open drawer
- Apply discounts
- Refund orders
- Reprint receipts
- Manage held orders
- Use loyalty
- Pay-in/pay-out
- View current dashboard analytics

Back-office permissions can include:

- View reports
- Manage inventory, products, categories, add-ons, and recipes
- Manage payment methods
- Manage employees and roles
- Manage discounts, loyalty, and customers
- Manage settings
- View activity logs
- Manage billing
- Export data

Security rules:

- Do not share owner credentials.
- Do not share staff PINs.
- Remove access immediately when someone leaves.
- Grant the smallest set of permissions needed for the job.
- Review roles after promotions, staff changes, or new branch launches.

## 10. Reports, Exports, and Activity Logs

Reports are available from Location Dashboard > Reports.

Report areas include:

- Sales summary
- Sales by item
- Sales by add-on or modifier
- Sales by staff
- Shifts
- Cash discrepancy
- Payments
- Discounts
- Taxes
- Receipts and order history

Use filters carefully. Date range, employee, payment method, and shift filters change the result.

### Activity logs

Use Location Dashboard > Activity Logs to audit sensitive changes such as product edits, employee actions, order activity, setting changes, and cash operations.

Activity logs are especially important after:

- Refunds
- Discount changes
- Role changes
- Product, category, or payment method changes
- Receipt or tax setting updates

## 11. Owner and Brand Portals

### Owner Portal

Use the owner portal when managing the account instead of one location.

Owner Portal includes:

- Overview
- Establishments
- Brands
- Employees
- Global roles
- Billing
- Account management

Use this portal to add locations, manage brands, control owner-level users, update billing, and review account access.

### Brand Portal

Use the brand portal for grouped locations under one brand.

Brand Portal includes:

- Brand overview
- Brand locations
- Brand team

Use this portal to compare brand location performance and manage brand-wide team access.

## 12. Hardware, Apps, and Device Requirements

Mintcom is designed for standard business devices rather than proprietary locked hardware.

Supported setup areas include:

- Modern browser for the web dashboard
- Android or iOS POS app when download links are configured
- Thermal receipt printers through compatible setup paths
- Barcode scanners that work like keyboard input
- Cash drawers depending on printer or hardware connection
- Compatible payment terminals depending on your payment provider

Recommended device practices:

- Keep tablets and browsers updated.
- Use stable Wi-Fi for POS devices and printers.
- Keep POS devices powered during shifts.
- Test receipt printing before live service.
- Enable cookies and session storage for the web dashboard.

## 13. Offline Mode and Sync

Mintcom can tolerate connectivity problems in POS operations, but offline behavior depends on the app workflow and the action being performed.

Offline mode is intended for:

- Temporary internet drops
- Basic sales where supported by the POS app
- Local order saving until connection returns
- Background sync after reconnection

Actions that usually need internet:

- Web dashboard login
- Billing
- Reports
- Support tickets
- Owner portal and brand portal data
- Loading fresh products, staff, settings, and historical orders

Offline best practices:

- Keep the POS app open until syncing finishes.
- Do not uninstall the app or clear data while orders are pending.
- Reconnect before closing the day when possible.
- Review orders and reports after sync to confirm totals.

## 14. Support, Security, and Troubleshooting

Support email: `info@mintcompos.com`

Security reports: `admin@mintcompos.com`

Privacy requests: `info@mintcompos.com`

Terms questions: `info@mintcompos.com`

Help center: `https://mintcompos.com/support`

When contacting support, include:

- Account or location name
- The page or app screen where the issue happened
- The exact error message
- Steps already tried
- Screenshot or short recording
- Device model
- Browser or app version
- Whether the issue affects one user, one device, or everyone

### Common troubleshooting

Connection failed:

- Check Wi-Fi or network access.
- Try another trusted network.
- Restart the POS app or refresh the dashboard.
- Keep the app open if offline sales need to sync.

Printer not working:

- Confirm power, paper, and cover.
- Confirm network, USB, or Bluetooth connection.
- Reconnect the printer in settings.
- Print a test receipt.
- Send support the printer model and connection type.

Session expired:

- Sign in again.
- Avoid private browsing if it blocks required storage.
- Reset the password if you suspect unauthorized access.

Permission denied:

- Ask an owner to review your role.
- Confirm you are in the correct location.
- Check whether the action is owner-level, brand-level, or location-level.

Subscription required:

- Open Owner Portal > Billing.
- Review status, saved card, invoices, and next billing date.
- Update the default card if needed.

## 15. Launch Checklist

Before live use, confirm:

- Email is verified.
- First location is created.
- Currency is correct.
- Tax settings are correct.
- Receipt details and logo are correct.
- Categories are clean and active.
- Products are assigned to the correct categories.
- Add-ons and modifiers are attached to the correct products.
- Recipe and stock tracking are tested where used.
- Store payment methods are configured.
- Billing card and trial status are reviewed.
- Staff accounts and roles are tested.
- Printer and receipt output are tested.
- One test sale is completed.
- One test refund is completed.
- One shift open and close cycle is tested.
- Reports show the expected sale, payment, refund, and shift data.
- Offline sync behavior is understood by the team.

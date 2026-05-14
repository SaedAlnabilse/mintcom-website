# Backend Usage Map

Static analysis date: 2026-05-02

## Scope

- Source: `src/**` in the website/backoffice repo.
- Basis: static code tracing of `api.get/post/put/patch/delete(...)`, route wiring, and component field reads.
- Important runtime caveat: HAR capture for authenticated dashboard/report/order/settings flows could not be completed in this workspace because there is no running backend on `http://localhost:3000` and no reusable authenticated test session in the repo.

## Highest-Cost Production Endpoints

| Method | Path | Page / feature | Trigger | Label | Notes |
|---|---|---|---|---|---|
| GET | `/dashboard/live-shift` | Dashboard, Orders | Page load, hourly refresh, realtime follow-up | Shared by both | Called repeatedly on dashboard and orders. |
| GET | `/dashboard/last-shift-snapshot` | Dashboard previous shift, Orders shift filters | Page load / view mode change | Shared by both | Only used when previous-shift logic is active. |
| GET | `/reports/historical-summary` | Dashboard cards, Reports sales/payments/taxes, Orders KPI | Page load, filter change, hourly refresh | Shared by both | Dashboard calls it twice on initial load. |
| GET | `/reports/top-selling-items` | Dashboard top products | Page load, hourly refresh | Shared by both | Dashboard only. |
| GET | `/reports/peak-hours` | Dashboard peak chart, Reports peak-hours | Page load, filter change, hourly refresh | Shared by both | Timezone param passed from browser. |
| GET | `/reports/category-report` | Dashboard category breakdown, Reports item-category tab | Page load, filter change | Shared by both | Dashboard uses it as a fallback source for category cards. |
| GET | `/reports/item-report` | Reports items tab, category breakdown modal | Filter change, modal open | Shared by both | UI expects full `breakdown` array. |
| GET | `/reports/shifts` | Reports staff-sales, shifts, cash discrepancy, employee shift picker | Page load, employee change, date change | Shared by both | Same endpoint reused with `limit=20`, `50`, `100`. |
| GET | `/reports/orders-history` | Orders history, Receipts report | Page load, page change, search, filter change | Shared by both | Main paginated history endpoint. |
| GET | `/reports/available-payment-methods` | Orders filter options | Page load | Shared by both | One-time helper request. |
| GET | `/reports/pay-in-pay-out` | Dashboard/Reports pay-in/pay-out modal | Modal open, date/filter change | Shared by both | Modal hardcodes `limit=100`. |
| GET | `/reports/employees` | Reports employee filter | Page load | Shared by both | Loads employee select options. |
| GET | `/reports/discounts` | Reports discounts | Page load, filter change | Shared by both | Discount-specific summary source. |
| GET | `/api/held-orders` | Orders held strip, Receipts held view | Page load, realtime refresh, status filter | Shared by both | UI assumes full array. |
| GET | `/activity-log` | Activity history page | Page load, search, action filter, date filter, page change | Website only | Already server paginated. |
| GET | `/api/users` | Staff / employees page | Page load | Website only | UI then filters, sorts, paginates client-side. |
| GET | `/app-settings` | Settings page, CurrencyContext poller, Loyalty save flow, product form, receipt settings | Page load, save follow-up, 30s background poll | Shared by both | Biggest hidden background cost outside reports. |
| GET | `/app-settings/payment-methods` | Payment methods page | Page load | Shared by both | Full array expected. |
| GET | `/card-types` | Card types page | Page load | Shared by both | Full array expected. |
| GET | `/app-settings/discounts` | Staff page, Discounts page, custom-role modal | Page load | Shared by both | Full array expected. |

## Automatic And Repeated Requests

| Endpoint | Automatic behavior | Interval / trigger | Background? | Duplicate triggers? |
|---|---|---|---|---|
| `/app-settings` | Currency sync in `CurrencyContext` | Every 30 seconds while authenticated with an establishment | Yes | Yes. Also called by Settings, Loyalty, ProductForm, save refresh. |
| `/dashboard/live-shift` | Dashboard refresh | Hourly timer + realtime events + page load | Yes | Yes. Dashboard and Orders both call it. |
| `/reports/historical-summary` | Dashboard analytics refresh | Hourly timer + realtime events + page load | Yes | Yes. Dashboard calls it twice on the same load window. |
| `/reports/top-selling-items` | Dashboard analytics refresh | Hourly timer + realtime events + page load | Yes | Dashboard only |
| `/reports/peak-hours` | Dashboard analytics refresh | Hourly timer + realtime events + page load | Yes | Dashboard and Reports |
| `/reports/category-report` | Dashboard analytics refresh | Hourly timer + realtime events + page load | Yes | Dashboard and Reports |
| `/reports/orders-history` | Orders table refresh | Realtime events, search debounce, page/filter/date changes | Mixed | Yes. Orders page may call both totals and table variants together. |
| `/api/held-orders` | Orders held strip refresh | Realtime held-order events + page/filter changes | Mixed | Yes. Orders and Receipts both use it. |
| WebSocket `/realtime` | Live updates | Persistent socket | Yes | Shared listener model across dashboard, orders, settings. |

## Exact Response Field Usage

### Dashboard

`GET /reports/historical-summary`

- Read:
  - `totalRevenue`
  - `totalOrders`
  - `averageOrderValue`
  - `completedOrders`
  - `activeEmployees`
  - `taxCollected`
  - `totalRefunds`
  - `grossProfit`
  - `totalPayIn`
  - `totalPayOut`
  - `paymentMethodBreakdown`
  - `categoryBreakdown`
  - `dailyBreakdown`
  - `pendingOrders` from the second dashboard call only
- Unused by dashboard code:
  - Any other summary fields not listed above

`GET /reports/top-selling-items`

- Read:
  - per row: `itemName` or `name`
  - `quantity` or `orders` or `count`
  - `revenue` or `totalSales` or `value`
- Unused:
  - any extra fields on each item

`GET /reports/peak-hours`

- Read:
  - per row: `hour`
  - `total`
  - `count`

`GET /reports/category-report`

- Read:
  - `breakdown[]`
  - per row: `name` or `itemName`
  - `value` or `revenue` or `totalSales`
  - `count` or `quantity` or `orders`

`GET /dashboard/live-shift`

- Read:
  - `shiftStatus`
  - `activeShift.startTime`
  - `activeShift.employee.firstName`
  - `activeShift.employee.lastName`
  - `activeShift.employee.username`
  - `netSales`
  - `numberOfOrders`
  - `cashSales`
  - `cardSales`
  - `otherPayments`
  - `payIn`
  - `payOut`
  - `totalTimeWorked`

`GET /dashboard/last-shift-snapshot`

- Read:
  - `startTime`
  - `timestamp`

### Reports

`GET /reports/historical-summary`

- Read in reports:
  - `totalRevenue`
  - `totalOrders`
  - `paymentMethodBreakdown[].name`
  - `paymentMethodBreakdown[].value`
  - `cardTypeBreakdown[].name`
  - `cardTypeBreakdown[].value`
  - `otherPaymentBreakdown[].name`
  - `otherPaymentBreakdown[].value`
  - `dailyBreakdown[].date`
  - `dailyBreakdown[].revenue`
  - `dailyBreakdown[].count`

`GET /reports/discounts`

- Read:
  - `totalDiscountGiven`
  - `reports[].name`
  - `reports[].count`
  - `reports[].totalAmount`

`GET /reports/item-report`, `/reports/category-report`, `/reports/modifier-report`, `/reports/attribute-report`

- Read:
  - `breakdown[]`
  - per row: `id` or `categoryId` when category drilldown is needed
  - `itemName` or `name`
  - `quantity`
  - `totalSales` or `revenue`

`GET /reports/shifts`

- Read:
  - `id`
  - `startTime`
  - `endTime`
  - `status`
  - `user.username`
  - `openingBalance`
  - `totalSales`
  - `closingBalance`
  - `discrepancy`
  - `variance`
  - `orderCount`
  - `totalDiscounts`
  - `totalRefunds`

`GET /reports/employees`

- Read:
  - `id`
  - `name`

`GET /reports/pay-in-pay-out`

- Read:
  - `entries[]`
  - per row: `id`
  - `type`
  - `amount`
  - `reason`
  - `note`
  - `createdAt`
  - `userName`

### Orders History

`GET /reports/orders-history`

- Read:
  - envelope: `orders`, `totalOrders` or `total`, `totalPages`
  - per order:
    - `id`
    - `orderNumber`
    - `total`
    - `subtotal`
    - `tax`
    - `discount`
    - `paymentMethod`
    - `cardType`
    - `otherPaymentMethod`
    - `paymentStatus`
    - `orderType`
    - `isTaxChanged`
    - `createdAt`
    - `items[].id`
    - `items[].name`
    - `items[].quantity`
    - `items[].price` or `basePrice`
    - `items[].total` or `finalPrice`
    - `customer.name`
    - `customer.phone`
    - `user.username`
    - `employeeName`
    - `refundedByName`
    - `refundReason` or `reason` or `refund_reason`
    - `note`
    - `status`

`GET /api/orders/by-number/:search`

- Read:
  - same order fields as above

### Activity History

`GET /activity-log`

- Read:
  - envelope: `logs`, `totalPages`, `total`
  - per log:
    - `id`
    - `performedBy.username`
    - `performedBy.name`
    - `performedBy.firstName`
    - `performedBy.lastName`
    - `action`
    - `description`
    - `metadata`
    - `ipAddress`
    - `timestamp`

### Employees

`GET /api/users`

- Read:
  - `id`
  - `name`
  - `username`
  - `email`
  - `role`
  - `phone`
  - `isActive`
  - `isClockedIn`
  - `createdAt`
  - `permissions`
  - `allowedDiscounts`
  - `customRoleId`

### Held Orders

`GET /api/held-orders`

- Read:
  - `id`
  - `nickname`
  - `pinnedAt`
  - `heldBy.username`
  - `orderData.total`
  - `orderData.subtotal`
  - `orderData.tax`
  - `orderData.discount.amount`
  - `orderData.note`
  - `orderData.items[].itemId`
  - `orderData.items[].name`
  - `orderData.items[].quantity`
  - `orderData.items[].basePrice`
  - `orderData.items[].finalPrice`

### Notifications

- No website API endpoint for notifications was found in this repo.
- The app uses toast notifications and websocket events, but not a REST notifications feed.

### App Settings

`GET /app-settings`

- Read:
  - `id`
  - `loginId`
  - `restaurantName`
  - `restaurantDescription`
  - `restaurantAddress`
  - `email`
  - `logo`
  - `receiptLogo`
  - `taxRate`
  - `taxIdNumber`
  - `currency`
  - `showLogoOnReceipt`
  - `receiptHeader`
  - `farewellMessage`
  - `showRestaurantName`
  - `showDescription`
  - `showAddress`
  - `showTaxId`
  - `showFarewellMessage`
  - `holdOrderTableCount`
  - `openingTime`
  - `closingTime`
  - `operatingSchedule`
- UI-derived fallback only:
  - if `operatingSchedule` is missing, frontend synthesizes it from `openingTime` and `closingTime`

### Payment Methods

`GET /app-settings/payment-methods`

- Read:
  - `id`
  - `name`
  - `logo` (legacy alias)
  - `imageUrl`
  - `imageKey`
  - `isActive`
  - `isDefault`

### Card Types

`GET /card-types`

- Read:
  - `id`
  - `name`
  - `imageUrl`
  - `imageKey`
  - `logo` (legacy alias)

## Required vs Legacy

### Still Required

- `/reports/historical-summary`
- `/reports/orders-history`
- `/reports/shifts`
- `/reports/peak-hours`
- `/reports/item-report`
- `/reports/category-report`
- `/reports/pay-in-pay-out`
- `/reports/employees`
- `/dashboard/live-shift`
- `/dashboard/last-shift-snapshot`
- `/api/held-orders`
- `/activity-log`
- `/app-settings`
- `/app-settings/payment-methods`
- `/card-types`
- `/api/users`

### Legacy / Duplicate / Alias Signals

- `payment method image fields`
  - Frontend still reads both `imageUrl` and legacy alias `logo`.
- `refund reason fields`
  - Frontend reads `refundReason`, `reason`, and `refund_reason`.
- `payment method routes`
  - Two website upload endpoints are implied by usage: `/payment-methods/upload-image` and `/card-types/upload-image`.
  - They are website-only helpers.
- `employee routes`
  - Dashboard uses `/api/users`.
  - Owner / brand flows use `/api/accounts/employees` and `/api/accounts/all-employees`.
  - These are not drop-in aliases in the UI today; they back different screens, but they are overlapping concepts.
- `historical summary duplication`
  - Dashboard issues two calls to `/reports/historical-summary` on one load window, one for the selected range and one for last-24h pending orders.
- `support/*`, onboarding-only creation routes, and public auth routes`
  - Present in production code, but not part of the dashboard/report cost center.

### Website Only

- `/activity-log`
- `/api/users`
- `/payment-methods/upload-image`
- `/card-types/upload-image`
- `/api/support/**`

### Shared By Both

- `/reports/**`
- `/dashboard/live-shift`
- `/dashboard/last-shift-snapshot`
- `/app-settings`
- `/app-settings/payment-methods`
- `/card-types`
- `/api/held-orders`

### POS Only

- No REST endpoint in this repo is labeled POS-only from frontend usage alone.
- The websocket event stream is clearly shared with POS-originated data.

## Pagination Behavior

| UI area | Endpoint(s) | Current page size | Server pagination support | UI assumption |
|---|---|---:|---|---|
| Orders history | `/reports/orders-history` | 10 on Orders page, 20 on Receipts report | Yes | Uses server totals and pages |
| Activity log | `/activity-log` | 10 | Yes | Uses server totals and pages |
| Reports shifts | `/reports/shifts` | Fetch limits 20, 50, 100 depending on report | No real UI server paging | UI paginates fetched arrays client-side |
| Reports item/category/modifier/attribute | `/reports/*-report` | 10 client-side | Not used | UI assumes full `breakdown[]` array |
| Held orders | `/api/held-orders` | 10 client-side when shown in main table | No | UI assumes full array |
| Notifications | none | n/a | n/a | no feed endpoint |
| Employees list | `/api/users` | 10 client-side | Not used | UI assumes full array |

## Slow Pages / Actions

### Dashboard load

- Calls:
  - `/dashboard/live-shift`
  - `/reports/historical-summary` x2
  - `/reports/top-selling-items`
  - `/reports/peak-hours`
  - `/reports/category-report`
  - sometimes `/dashboard/last-shift-snapshot`
- Why slow:
  - multiple summary/report endpoints on first paint
  - duplicate historical-summary call
  - automatic hourly refresh and realtime-triggered reloads

### Reports with filters

- Calls vary by active report:
  - sales/payments/taxes: `/reports/historical-summary`
  - discounts: `/reports/discounts`
  - items/categories/modifiers/attributes: `/reports/*-report`
  - peak-hours: `/reports/peak-hours`
  - staff-sales/shifts/cash discrepancy: `/reports/shifts`
  - employee dropdown: `/reports/employees`
  - employee-specific shift dropdown: `/reports/shifts?employeeId=...&limit=50`
- Why slow:
  - large full-array report payloads
  - same shifts endpoint reused for several views with different limits

### Orders history search / filters

- Calls:
  - `/api/held-orders`
  - `/reports/orders-history` for table
  - `/reports/orders-history` again for total count when filtering/searching
  - `/reports/historical-summary` for KPI strip
  - `/reports/available-payment-methods` on load
  - `/dashboard/live-shift` and `/dashboard/last-shift-snapshot` for shift filters

### Employee screens

- Calls:
  - `/api/users`
  - `/app-settings/discounts`
- Why slow:
  - full employee array fetch, then all sorting/filtering/pagination on the client

### Settings pages

- Calls:
  - `/app-settings`
  - `/files/upload` for logo changes
  - `/app-settings/tax-rate` for tax-only update
  - deletion-status endpoints
  - background `/app-settings` poll every 30s from currency context

## Safe Backend Changes

### Safe

- smaller DTOs for reports, as long as the fields listed in this document remain
- stricter default limits on routes where the UI already passes `page` and `limit`
  - `/reports/orders-history`
  - `/activity-log`
- removing duplicate route aliases after keeping one canonical field name
  - `logo` vs `imageUrl`
  - `refundReason` vs `reason` vs `refund_reason`

### Conditionally Safe

- cursor/page pagination for reports
  - safe only after frontend changes on item/category/modifier/attribute/shifts views
- smaller `/app-settings` DTO
  - safe if it still includes all fields listed above for settings and currency sync
- stricter default report limits
  - risky today for `/reports/shifts`, `/reports/item-report`, `/reports/category-report`, `/reports/modifier-report`, `/reports/attribute-report`, `/api/users`, `/api/held-orders` because those screens expect full arrays

### Not Safe Today Without Frontend Work

- removing `imageUrl` or `logo` without preserving one canonical image field everywhere
- removing fallback refund reason fields without normalizing response shape first
- paginating `/api/users`
- paginating `/api/held-orders`
- paginating report `breakdown[]` endpoints without updating the UI

## HAR / Network Capture Status

- Requested flows:
  - dashboard load
  - opening reports
  - changing report filters
  - orders history
  - notifications
  - settings pages
- Status:
  - Not captured in this workspace.
- Blockers:
  - no backend running on `http://localhost:3000`
  - no committed authenticated session or test credentials in the repo
  - no notifications REST endpoint exists in the codebase to capture

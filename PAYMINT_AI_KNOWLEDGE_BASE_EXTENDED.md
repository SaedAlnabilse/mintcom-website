# Paymint AI Knowledge Base (Extended)

This document is the **definitive source of truth** for the Paymint AI Chatbot. It contains deep technical details, feature specifications, data models, and operational logic derived from the codebase and test suites.

---

## 1. System Architecture & Configuration

### 1.1 Tech Stack
- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Framer Motion (for animations)
- **State Management:** React Context (Auth, Theme)
- **Routing:** React Router DOM (Lazy loading enabled)
- **Testing:** Vitest (Unit), Playwright (E2E)
- **Icons:** Lucide React
- **Build Tool:** Vite (optimized for HMR)

### 1.2 Application Structure
- **Entry Point:** `src/main.tsx` -> `src/App.tsx`
- **Routing Strategy:**
    - **Public Routes:** Landing, Login, Signup, Demo.
    - **Protected Routes:** Requires Authentication (`ProtectedRoute` wrapper).
    - **Establishment Context:** Requires an active establishment selection (`EstablishmentRequiredRoute` wrapper).
    - **Portals:**
        - **Backoffice Portal:** `/owner` (Multi-establishment management, billing).
        - **Brand Portal:** `/brand` (Multi-location brand management).
        - **Dashboard (POS):** `/dashboard` (Daily operations).

### 1.3 API Configuration (`src/config/api.ts`)
- **Base URL:** Dynamic (empty string for dev proxy, full URL for prod).
- **Authentication:** HttpOnly cookies for security.
- **Interceptors:**
    - **Request:** Automatically injects `X-Establishment-Id` header from `sessionStorage` for multi-tab support.
    - **Response:** Global error handling (401 redirects to login).
- **Global Loading:** Tracks active requests to show/hide global loading spinner.

---

## 2. Authentication & Authorization

### 2.1 User Roles & Permissions (`AuthContext.tsx`, `demo-data.ts`)
The system uses a flexible Role-Based Access Control (RBAC) system.

**Standard Roles:**
- **OWNER:** Full access to everything, billing, and subscription.
- **MANAGER:** Store-level administration.
- **CASHIER:** POS operations.
- **USER:** Basic access (usually restricted).

**Custom Roles (Granular Permissions):**
- **Permissions List:**
    - `accept_payments`: Process sales.
    - `apply_discounts`: Add discounts to orders.
    - `refunds`: Process returns.
    - `void_items`: Remove items from active orders.
    - `open_cash_drawer`: Open drawer without sale.
    - `view_all_receipts`: Access full order history.
    - `manage_items`: CRUD products.
    - `view_reports`: Access analytics.
    - `manage_employees`: Add/Edit staff.
    - `view_item_cost`: See profit margins.

**Authentication Flow:**
1. **Login:** Email/Password -> Server sets HttpOnly Cookie -> Returns Account Data.
2. **Context:** `AuthContext` stores user profile and list of accessible establishments.
3. **Establishment Selection:** User picks a location -> ID stored in `sessionStorage`.
4. **Logout:** Calls API to clear cookie -> Hard reload to `/login`.

---

## 3. Data Models & Entities

### 3.1 Products & Inventory
- **Hierarchy:** Category -> Product -> Variants/Attributes.
- **Attributes:**
    - **Single Select:** E.g., "Size" (Small, Medium, Large), "Milk Type".
    - **Multi Select:** E.g., "Add-ons" (Extra Shot, Syrup).
    - **Pricing:** Attributes can add to the base price.
- **Stock Tracking:** Optional per product.
- **Raw Materials (Advanced Inventory):**
    - Tracks ingredients (e.g., "Coffee Beans", "Milk", "Flour").
    - **Recipes:** Links Products to Raw Materials (e.g., 1 Latte = 18g Espresso Blend + 250ml Milk).
    - **Auto-Deduction:** Selling a product deducts the raw materials.

### 3.2 Orders
- **Statuses:** Completed, Refunded, Held.
- **Structure:**
    - Order ID, Date, Staff Member, Customer (optional).
    - Line Items: Product, Quantity, Modifiers, Notes, Discounts.
    - Payment: Method (Cash, Card, etc.), Split Payment details.
- **Discounts:** Can be percentage-based or fixed amount. Can be strictly "Admin Only".

### 3.3 Customers (CRM)
- **Tiers:** VIP, Gold, Silver, Bronze, New.
- **Metrics:** Total Visits, Total Spent.
- **Data:** Name, Phone, Email.

### 3.4 Establishments
- **Types:** Cafe, Restaurant, Retail.
- **Settings:** Currency, Tax Rate, Receipt configuration (Logo, Footer).

---

## 4. Key Modules & Features

### 4.1 Dashboard (POS)
- **Route:** `/dashboard`
- **Modules:**
    - **Sales:** Visual grid, category filters, cart management.
    - **Orders:** History, search, refunds.
    - **Reports:** Sales summary, item performance, labor cost.
    - **Settings:** Printer setup, tax rules.
    - **Staff:** Shift management (Clock In/Out), cash reconciliation.

### 4.2 Backoffice Portal
- **Route:** `/owner`
- **Purpose:** High-level management for business owners.
- **Features:**
    - **Overview:** Aggregated stats across all locations.
    - **Billing:** Subscription management, invoice history.
    - **Merge:** Tools for merging duplicate accounts/data.
    - **Brand Management:** Grouping locations under brands.

### 4.3 Brand Portal
- **Route:** `/brand/:brandId`
- **Purpose:** Managing specific brands within an ownership account.
- **Features:** Location management, brand-wide team settings.

---

## 5. Testing & Quality Assurance (`TEST_SUITE.md`)

### 5.1 Validated Scenarios (Happy Path)
- **Auth:** Login, Signup, Reset Password, Email Verify.
- **POS:** Sales, Split Payments, Discounts, Refunds.
- **Inventory:** Product CRUD, Stock updates, Image upload.
- **Reports:** Date filtering, PDF export.

### 5.2 Edge Cases Handled
- **Network:** Graceful handling of timeouts and offline states.
- **Concurrency:** Multiple tabs/devices handled via `sessionStorage` isolation.
- **Input:** XSS sanitization (e.g., script tags in product names).
- **Limits:** Max price values, empty search queries.

### 5.3 Security Validations
- **Access Control:** Users cannot access Admin APIs.
- **Data Isolation:** Cross-tenant access is strictly blocked (IDOR protection).
- **Session:** Auto-expiry and secure cookie handling.

---

## 6. Hardware & Integration Details

### 6.1 Supported Hardware
- **Tablets:** iPad (10th Gen+), Samsung Galaxy Tab A8+, Lenovo Tab M10+.
- **Printers:** ESC/POS Thermal Printers (Epson TM-T20III, Star Micronics TSP143, Munbyn).
- **Scanners:** Standard Bluetooth/USB barcode scanners.

### 6.2 Widget Integration
- **Code:** `<script src="https://sa3d100-paymint-test.hf.space/widget.js"></script>`
- **Placement:** Before closing `</body>` tag.
- **Function:** Embeds a subset of Paymint functionality into external sites.

---

## 7. Support & Troubleshooting

### 7.1 Common Issues
- **"Session Expired":** Caused by cookie timeout. Solution: Re-login.
- **"Printer Not Found":** Bluetooth permission missing or device sleeping.
- **"Sync Failed":** Network interruption. Data queues for retry.

### 7.2 Resources
- **Manual:** `public/docs/paymint-user-manual.md` (PDF available).
- **Contact:** support@paymint.io or in-app "Contact Support".

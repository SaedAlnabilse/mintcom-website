# Paymint Project Documentation (The Product Bible)

**Version:** 2.0  
**Last Updated:** January 2026  
**Status:** Production Ready

---

## 1. Executive Summary

Paymint is a state-of-the-art, cloud-native Point of Sale (POS) and business management platform designed for the modern hospitality and retail sectors. Unlike legacy systems that are clunky and hardware-dependent, Paymint offers a "software-first" approach—running seamlessly on standard consumer tablets (iPad/Android) while providing enterprise-grade power.

It unifies **Sales**, **Inventory**, **Staff Management**, **Customer Loyalty**, and **Multi-Location Analytics** into a single, intuitive dashboard.

---

## 2. Product Vision & Scope

### 2.1 Target Audience
*   **Restaurants & Cafes:** Handling complex menus, modifiers (add-ons), recipes, and table service.
*   **Retail Stores:** Managing SKU-heavy inventory, barcodes, and quick checkout.
*   **Franchises:** Managing multiple locations and brands from a master HQ portal.

### 2.2 Core Value Proposition
1.  **Simplicity:** Zero training time for cashiers due to a consumer-grade UX.
2.  **Flexibility:** Works on any device; no proprietary hardware lock-in.
3.  **Intelligence:** Real-time data sync and actionable insights (Peak hours, Low stock).
4.  **Resilience:** Offline-tolerant architecture (continues working if Wi-Fi drops).

---

## 3. System Architecture

### 3.1 Technology Stack
*   **Frontend Framework:** React 19 + TypeScript
*   **Build Tool:** Vite (High-performance HMR)
*   **State Management:** React Context API (Auth, Theme)
*   **Styling:** Tailwind CSS (Utility-first) + Framer Motion (Animations)
*   **Routing:** React Router DOM (with Lazy Loading)
*   **Testing:** Vitest (Unit), Playwright (E2E)

### 3.2 Application Structure
The application is divided into distinct "Portals" to manage complexity:

1.  **Public Portal:** Landing page, Authentication, Demo.
2.  **Onboarding Portal:** Wizard for new account setup.
3.  **Backoffice Portal (`/owner`):** HQ view. Aggregated billing, global staff, multi-brand management.
4.  **Establishment Dashboard (`/dashboard`):** The daily operating OS. POS, Local Inventory, Shift reporting.

### 3.3 API & Security
*   **Authentication:** HttpOnly Secure Cookies.
*   **Context Isolation:** `X-Establishment-Id` header injected via Interceptors to ensure data strictness between locations.
*   **RBAC:** Granular Role-Based Access Control (Owner > Manager > Cashier > User).

---

## 4. Feature Specifications

### 4.1 Point of Sale (POS)
*   **Visual Interface:** Category-based grid or list view.
*   **Order Cart:**
    *   **Modifiers:** Mandatory (e.g., "Steak Temp") and Optional (e.g., "Extra Cheese").
    *   **Notes:** Free text for special requests.
    *   **Discounts:** Preset (%) or Fixed ($).
*   **Payments:**
    *   **Split Payments:** By Amount (50/50) or By Item (You pay for the burger, I pay for the fries).
    *   **Methods:** Cash, Card, Third-party (UberEats/DoorDash integration hooks).
*   **Workflow:** Hold Order (Park), Retrieve Order, Refund (Partial/Full).

### 4.2 Inventory Management 2.0
*   **Product Hierarchy:** Category -> Product -> Variants.
*   **Raw Materials:** Tracks "flour," "coffee beans," "eggs" separate from sellable items.
*   **Recipes:** Links Products to Raw Materials. Selling a "Croissant" auto-deducts "50g Flour" + "20g Butter".
*   **Stock Control:** Low-stock alerts, manual adjustments (spoilage/waste logging).

### 4.3 Staff & Labor
*   **Time Clock:** Employees clock in/out directly on the POS.
*   **Cash Reconciliation:** "Z-Report" at end of shift.
    *   Enter Opening Cash -> Sales occur -> Enter Closing Cash.
    *   System calculates **Discrepancy** (Surplus/Shortage) and alerts owners.
*   **Permissions:** Custom roles (e.g., "Head Barista" can refund, "Trainee" cannot).

### 4.4 Customer CRM & Loyalty
*   **Profiles:** Track name, contact, total spend, and visit count.
*   **Tiers:** Auto-assign VIP/Gold statuses based on spend.
*   **Points:** Earn points per dollar; Redeem for discounts.

---

## 5. User Experience (Screens & Popups)

### 5.1 Sitemap (Key Screens)
*   **`/dashboard`**: Main POS view.
*   **`/dashboard/orders`**: Transaction history.
*   **`/dashboard/products`**: Item editor.
*   **`/dashboard/reports`**: Analytics suite.
*   **`/dashboard/settings`**: Hardware/Tax config.
*   **`/owner` (Backoffice Portal)**: Multi-location HQ.

### 5.2 Critical Popups (Modals)
*   **`ProductFormModal`**: The heart of inventory. Upload images, set prices, link recipes.
*   **`OrderDetailModal`**: Deep dive into a past receipt.
*   **`ShiftClosureModal`**: The "End of Day" wizard for counting cash.
*   **`AddPaymentMethodModal`**: Secure credit card entry.

---

## 6. Data Logic & Models

### 6.1 Entities
*   **Account:** The master billing entity.
*   **Establishment:** A physical store location.
*   **Brand:** A grouping of Establishments (e.g., "Joe's Pizza" chain).
*   **User:** A staff member (linked to one or many establishments).

### 6.2 Operations Logic
*   **Offline Mode:** Data is queued locally in IndexedDB/LocalStorage and synced when connection restores.
*   **Multi-Tab Support:** Uses `sessionStorage` for establishment ID, allowing a user to manage Store A in Tab 1 and Store B in Tab 2 simultaneously without data collision.

---

## 7. Operations & Hardware

### 7.1 Hardware Compatibility
*   **Tablets:** Any modern browser-capable tablet (iPad, Android).
*   **Printers:** ESC/POS Thermal Printers (Epson, Star Micronics) via network/bluetooth.
*   **Scanners:** HID-mode barcode scanners (act as keyboard input).

### 7.2 Widget Integration
External websites can embed Paymint features (e.g., online ordering) via:
```html
<script src="https://sa3d100-paymint-test.hf.space/widget.js"></script>
```

---

## 8. QA & Testing Standards

### 8.1 Happy Path Testing
*   **Auth:** Login -> Dashboard -> Logout.
*   **Sales:** Add Item -> Modifier -> Checkout -> Receipt.
*   **Inventory:** Create Item -> Sell Item -> Check Stock Deduction.

### 8.2 Security Testing
*   **IDOR:** Verify User A cannot access Store B's API data.
*   **XSS:** Ensure product names/notes sanitize script tags.
*   **Role Enforcement:** Verify "Cashier" cannot access "Settings".

---

## 9. Support Resources

*   **User Manual:** See `public/docs/paymint-user-manual.md`.
*   **Admin Contact:** `support@paymint.io`.
*   **Emergency:** In-app "Contact Support" triggers high-priority ticket.

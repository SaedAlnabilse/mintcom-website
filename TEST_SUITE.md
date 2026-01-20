# Paymint Cloud POS - Comprehensive Test Suite

**Project:** Paymint Cloud POS (Web Back-Office)  
**Version:** 1.0  
**Date:** January 2026  
**Prepared By:** QA Engineering Team

---

## Executive Summary

This test suite provides comprehensive coverage for the Paymint Cloud POS web application, including:
- **Authentication & Authorization** (Login, Sign Up, Password Recovery)
- **Dashboard & Reports** (Sales metrics, charts, exports)
- **Product Management** (CRUD operations, categories, add-ons)
- **Order Management** (History, search, refunds)
- **Staff Management** (Employees, permissions, roles)
- **Settings & Configuration** (Payment methods, discounts, billing)

---

## Table of Contents

1. [Functional Testing (Happy Path)](#1-functional-testing-happy-path)
2. [Negative Testing (Error Handling)](#2-negative-testing-error-handling)
3. [Edge Cases](#3-edge-cases)
4. [UI/UX & Responsiveness](#4-uiux--responsiveness)
5. [Security Testing](#5-security-testing)

---

## 1. Functional Testing (Happy Path)

### 1.1 Authentication Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| AUTH-001 | Login | Successful login with valid credentials | 1. Navigate to `/login` 2. Enter valid email 3. Enter valid password 4. Click "Sign In" | User is redirected to `/owner` dashboard with success toast "Welcome back!" |
| AUTH-002 | Login | Remember me functionality | 1. Login with "Remember me" checked 2. Close browser 3. Reopen and navigate to app | User session is persisted; no re-login required |
| AUTH-003 | Login | Password visibility toggle | 1. Enter password 2. Click eye icon | Password toggles between hidden (dots) and visible (plain text) |
| AUTH-004 | Sign Up | Successful account registration | 1. Navigate to `/signup` 2. Enter first name, last name 3. Enter valid email 4. Enter valid phone 5. Enter password meeting requirements 6. Confirm password 7. Submit | Success screen shown with "Check Your Email" message; verification email sent |
| AUTH-005 | Sign Up | Password strength validation visual feedback | 1. Start typing password 2. Observe validation indicators | Real-time feedback for: 8+ chars, uppercase, lowercase, number requirements |
| AUTH-006 | Forgot Password | Request password reset | 1. Click "Forgot password?" on login 2. Enter registered email 3. Submit | Success message shown; reset email sent to user |
| AUTH-007 | Reset Password | Complete password reset flow | 1. Click link in reset email 2. Enter new password 3. Confirm new password 4. Submit | Password updated; redirected to login with success message |
| AUTH-008 | Email Verification | Verify email from link | 1. Register new account 2. Click verification link in email | Email verified; account activated; can proceed to login |
| AUTH-009 | Logout | Successful logout | 1. Click user avatar/menu 2. Click "Logout" | Session terminated; redirected to login page |
| AUTH-010 | Session | Auto-redirect authenticated user | 1. Login successfully 2. Manually navigate to `/login` | User redirected to dashboard (not shown login page) |

### 1.2 Onboarding Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| ONB-001 | Onboarding | Complete onboarding for new user | 1. Login as new user with no establishments 2. Complete onboarding wizard steps 3. Submit | Establishment created; redirected to dashboard |
| ONB-002 | Onboarding | Skip optional onboarding steps | 1. Start onboarding 2. Fill required fields only 3. Skip optional fields 4. Submit | Onboarding completes successfully with minimal data |

### 1.3 Dashboard Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| DASH-001 | Dashboard | View main dashboard metrics | 1. Login 2. Navigate to dashboard | Dashboard displays: Net Sales, Orders, Cash/Card breakdown, charts |
| DASH-002 | Dashboard | Refresh dashboard data | 1. On dashboard 2. Click refresh icon | Data reloads; loading spinner shown during fetch |
| DASH-003 | Dashboard | Switch establishment context | 1. Click establishment selector 2. Choose different establishment | Dashboard data updates to show selected establishment metrics |

### 1.4 Reports Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| RPT-001 | Reports | View sales summary report | 1. Navigate to Reports 2. Select "Sales" tab 3. Select date range | Sales summary displayed with totals, charts, breakdowns |
| RPT-002 | Reports | View top-selling items | 1. Navigate to Reports 2. Select "Top Items" tab | Bar chart and list of top-selling products displayed |
| RPT-003 | Reports | View peak hours analysis | 1. Navigate to Reports 2. Select "Peak Hours" tab | Hourly distribution chart showing order volume |
| RPT-004 | Reports | View shift reports | 1. Navigate to Reports 2. Select "Shifts" tab | List of shifts with employee, times, totals, discrepancies |
| RPT-005 | Reports | Quick date range selection | 1. On Reports page 2. Click "Today" / "This Week" / "This Month" / "Last 30 Days" | Date range updates; report refreshes with new data |
| RPT-006 | Reports | Custom date range filter | 1. On Reports page 2. Select custom start date 3. Select custom end date | Report filters to exact date range specified |
| RPT-007 | Reports | Export report to CSV | 1. Generate a report 2. Click "Export" button | CSV file downloads with report data |
| RPT-008 | Reports | Filter by category | 1. On Top Items report 2. Select category filter | Results filtered to selected category only |
| RPT-009 | Reports | Pay In/Pay Out log modal | 1. On Reports 2. Click Pay In/Pay Out summary | Modal opens showing detailed cash movement log |

### 1.5 Orders Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| ORD-001 | Orders | View order history list | 1. Navigate to Orders page | Paginated list of orders with order#, total, status, date |
| ORD-002 | Orders | Search order by number | 1. Enter order number in search 2. Press Enter or click search | Matching order displayed; "Order not found" if no match |
| ORD-003 | Orders | Filter orders by status | 1. Select status filter (Completed/Refunded/All) | Orders list filtered to selected status |
| ORD-004 | Orders | Filter orders by date range | 1. Select start date 2. Select end date | Orders filtered to date range |
| ORD-005 | Orders | View order details | 1. Click on any order row | Order detail modal opens showing items, totals, payment info |
| ORD-006 | Orders | View held orders | 1. Filter by status "HELD" | List of held orders displayed with nickname, items, held by |
| ORD-007 | Orders | Process refund | 1. Open order details 2. Click "Refund" 3. Enter reason 4. Confirm | Order status changes to "Refunded"; confirmation shown |
| ORD-008 | Orders | Pagination navigation | 1. View orders list 2. Click next/previous page | Page changes; correct orders displayed per page |

### 1.6 Products Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| PROD-001 | Products | View products list | 1. Navigate to Products page | List/Grid of products with name, price, category, stock, status |
| PROD-002 | Products | Toggle list/grid view | 1. Click list/grid toggle icons | View switches between list table and grid cards |
| PROD-003 | Products | Search products | 1. Enter product name in search | Products filtered to matching results |
| PROD-004 | Products | Filter by category | 1. Select category from dropdown | Only products in selected category shown |
| PROD-005 | Products | Add new product | 1. Click "Add Product" 2. Fill name, price, category 3. Upload image (optional) 4. Click Save | Product created; appears in list; success toast shown |
| PROD-006 | Products | Edit existing product | 1. Click edit icon on product 2. Modify fields 3. Save | Product updated; changes reflected in list |
| PROD-007 | Products | Delete product | 1. Click delete icon 2. Confirm in modal | Product removed from list; success toast |
| PROD-008 | Products | Enable/disable stock tracking | 1. Edit product 2. Toggle "Track Stock" 3. Set stock quantity 4. Save | Stock tracking enabled; quantity displayed |
| PROD-009 | Products | Export products to CSV | 1. Click "Export" button | CSV file with product catalog downloaded |
| PROD-010 | Products | Upload product image | 1. In product form 2. Click image upload area 3. Select image file | Image preview shown; saved with product |

### 1.7 Categories Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| CAT-001 | Categories | View categories list | 1. Navigate to Categories page | List of categories with name, product count |
| CAT-002 | Categories | Create new category | 1. Click "Add Category" 2. Enter name 3. Save | Category created; appears in list |
| CAT-003 | Categories | Edit category | 1. Click edit on category 2. Modify name 3. Save | Category name updated |
| CAT-004 | Categories | Delete category | 1. Click delete 2. Confirm | Category removed (if no products assigned) |
| CAT-005 | Categories | Navigate to category products | 1. Click on category 2. View products | Redirected to Products page filtered by category |

### 1.8 Staff Management Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| STAFF-001 | Staff | View staff list | 1. Navigate to Staff/Team page | List of employees with name, role, status, contact |
| STAFF-002 | Staff | Add new employee | 1. Click "Add Employee" 2. Fill name, email, username 3. Assign role 4. Set permissions 5. Save | Employee created; appears in list |
| STAFF-003 | Staff | Edit employee | 1. Click edit on employee 2. Modify fields 3. Save | Employee updated |
| STAFF-004 | Staff | Delete/deactivate employee | 1. Click delete/deactivate 2. Confirm | Employee deactivated or removed |
| STAFF-005 | Staff | Filter by role | 1. Select role filter (Admin/User/All) | Staff list filtered by role |
| STAFF-006 | Staff | Search staff | 1. Enter name/email in search | Matching staff displayed |
| STAFF-007 | Staff | Reset employee PIN | 1. Click more options 2. Select "Reset PIN" 3. Confirm | PIN reset; employee can set new PIN on next login |
| STAFF-008 | Staff | Assign permissions | 1. Edit employee 2. Check/uncheck permission boxes 3. Save | Permissions updated for employee |
| STAFF-009 | Staff | Export staff to CSV | 1. Click "Export" | CSV with staff data downloaded |

### 1.9 Settings Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| SET-001 | Settings | View settings page | 1. Navigate to Settings | Settings categories displayed |
| SET-002 | Settings | Update establishment info | 1. Go to Settings 2. Update name/logo/info 3. Save | Changes saved; success message |
| SET-003 | Discounts | Create discount | 1. Go to Discounts 2. Click Add 3. Enter name, percentage 4. Save | Discount created |
| SET-004 | Discounts | Edit discount | 1. Click edit on discount 2. Modify 3. Save | Discount updated |
| SET-005 | Discounts | Delete discount | 1. Click delete 2. Confirm | Discount removed |
| SET-006 | Payment Methods | Add payment method | 1. Go to Payment Methods 2. Add new method | Payment method added |
| SET-007 | Add-ons | Create add-on group | 1. Go to Add-ons 2. Create group with options | Add-on group created |
| SET-008 | Add-ons | Assign add-on to product | 1. Edit product 2. Select add-on groups 3. Save | Product uses selected add-ons |

### 1.10 Billing Module

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| BILL-001 | Billing | View billing overview | 1. Navigate to Billing page | Current plan, usage, invoices displayed |
| BILL-002 | Billing | View invoice history | 1. On Billing 2. View past invoices | List of invoices with dates, amounts, status |
| BILL-003 | Billing | Download invoice | 1. Click download on invoice | PDF invoice downloaded |

---

## 2. Negative Testing (Error Handling)

### 2.1 Authentication Errors

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| NEG-AUTH-001 | Login | Invalid email format | 1. Enter "notanemail" in email field 2. Submit | Validation error: "Please enter a valid email" |
| NEG-AUTH-002 | Login | Empty email field | 1. Leave email empty 2. Enter password 3. Submit | Validation error on email field |
| NEG-AUTH-003 | Login | Empty password field | 1. Enter email 2. Leave password empty 3. Submit | Validation error: "Password is required" |
| NEG-AUTH-004 | Login | Wrong password | 1. Enter valid email 2. Enter incorrect password 3. Submit | Error toast: "Login failed" or "Invalid credentials" |
| NEG-AUTH-005 | Login | Non-existent user | 1. Enter unregistered email 2. Enter any password 3. Submit | Error: "User not found" or generic login failed |
| NEG-AUTH-006 | Login | Inactive account | 1. Login with deactivated account | Error: "Account is inactive" |
| NEG-AUTH-007 | Sign Up | Email already registered | 1. Register with existing email | Error: "Email already in use" |
| NEG-AUTH-008 | Sign Up | Password too short | 1. Enter password < 8 characters | Error: "Password must be at least 8 characters" |
| NEG-AUTH-009 | Sign Up | Password missing uppercase | 1. Enter password without uppercase | Error: "Password must contain at least one uppercase letter" |
| NEG-AUTH-010 | Sign Up | Password missing number | 1. Enter password without digits | Error: "Password must contain at least one number" |
| NEG-AUTH-011 | Sign Up | Passwords don't match | 1. Enter different values in password and confirm password | Error: "Passwords do not match" |
| NEG-AUTH-012 | Sign Up | Invalid phone number | 1. Enter phone < 5 characters | Error: "Please enter a valid phone number" |
| NEG-AUTH-013 | Sign Up | First name too short | 1. Enter single character first name | Error: "First name must be at least 2 characters" |
| NEG-AUTH-014 | Forgot Password | Non-existent email | 1. Enter unregistered email in forgot password | Error or generic message (security consideration) |

### 2.2 Product Management Errors

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| NEG-PROD-001 | Products | Create product without name | 1. Open add product form 2. Leave name empty 3. Submit | Validation error on name field |
| NEG-PROD-002 | Products | Create product without price | 1. Fill name 2. Leave price empty 3. Submit | Validation error: "Price is required" |
| NEG-PROD-003 | Products | Enter negative price | 1. Enter -10 in price field | Validation error or auto-correct to positive |
| NEG-PROD-004 | Products | Enter text in price field | 1. Type "abc" in price field | Input rejected or validation error |
| NEG-PROD-005 | Products | Create product without category | 1. Fill product details 2. Don't select category 3. Submit | Warning: "Create a category first" or validation error |
| NEG-PROD-006 | Products | Enter negative stock | 1. Enable stock tracking 2. Enter -5 in stock field | Validation error or blocked if negative stock not allowed |
| NEG-PROD-007 | Products | Upload invalid image format | 1. Try to upload .exe or .pdf as product image | Error: "Invalid file type" or rejection |
| NEG-PROD-008 | Products | Upload oversized image | 1. Try to upload image > max size limit | Error: "File too large" |
| NEG-PROD-009 | Products | Duplicate barcode | 1. Create product with barcode "123" 2. Create another with same barcode | Error: "Barcode already exists" |

### 2.3 Staff Management Errors

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| NEG-STAFF-001 | Staff | Create employee without name | 1. Leave name empty 2. Submit | Validation error |
| NEG-STAFF-002 | Staff | Create employee with invalid email | 1. Enter "bademail" 2. Submit | Validation error: "Invalid email" |
| NEG-STAFF-003 | Staff | Create employee with duplicate username | 1. Use existing username | Error: "Username already taken" |
| NEG-STAFF-004 | Staff | Create employee with duplicate email | 1. Use existing email | Error: "Email already in use" |
| NEG-STAFF-005 | Staff | Delete last admin | 1. Try to delete only admin account | Error: "Cannot delete the last admin" |

### 2.4 Order & Report Errors

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| NEG-ORD-001 | Orders | Search non-existent order | 1. Search for order "99999999" | Message: "Order not found" |
| NEG-ORD-002 | Orders | Refund already refunded order | 1. Try to refund an order with status "Refunded" | Error: "Order already refunded" or button disabled |
| NEG-ORD-003 | Orders | Refund without reason | 1. Click refund 2. Leave reason empty 3. Confirm | Validation: "Reason is required" |
| NEG-ORD-004 | Reports | Invalid date range | 1. Set end date before start date | Error or auto-correction; no data shown |

### 2.5 Category Errors

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| NEG-CAT-001 | Categories | Create category without name | 1. Leave name empty 2. Submit | Validation error |
| NEG-CAT-002 | Categories | Delete category with products | 1. Try to delete category that has products | Error: "Cannot delete category with products" or confirmation required |
| NEG-CAT-003 | Categories | Duplicate category name | 1. Create category with existing name | Error: "Category already exists" |

---

## 3. Edge Cases

### 3.1 Network & Connectivity

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| EDGE-001 | Network | Internet disconnects during form submission | 1. Start submitting form 2. Disable internet mid-request | Error toast: "Network error" or retry option shown |
| EDGE-002 | Network | Slow network response | 1. Throttle network to slow 3G 2. Perform any action | Loading indicators shown; no duplicate submissions |
| EDGE-003 | Network | API timeout | 1. Trigger long-running API call 2. Wait for timeout | Graceful timeout error; user can retry |
| EDGE-004 | Network | Offline mode access | 1. Go offline 2. Try to navigate app | Error message indicating offline status |

### 3.2 Session & Authentication

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| EDGE-005 | Session | Session expires during use | 1. Login 2. Wait for session to expire 3. Try to perform action | Redirected to login; message: "Session expired" |
| EDGE-006 | Session | Multiple tabs with different establishments | 1. Open app in Tab A with Establishment 1 2. Open Tab B, switch to Establishment 2 3. Perform action in Tab A | Actions should use correct establishment context or warn user |
| EDGE-007 | Session | Concurrent login from different device | 1. Login on Device A 2. Login same account on Device B | Either both sessions work, or one is invalidated (based on policy) |
| EDGE-008 | Session | Token refresh during operation | 1. Perform action right as token expires | Token should auto-refresh; action completes without user intervention |

### 3.3 Data Boundaries

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| EDGE-009 | Products | Maximum product name length | 1. Enter 255+ characters in product name | Truncation, validation error, or graceful handling |
| EDGE-010 | Products | Maximum price value | 1. Enter extremely large price (e.g., 9999999999) | Validation or system handles large number correctly |
| EDGE-011 | Products | Zero price | 1. Enter 0 as price | Allowed (free item) or validation based on business rules |
| EDGE-012 | Products | Decimal precision | 1. Enter price with many decimals (e.g., 10.12345) | Rounded to 2-3 decimal places |
| EDGE-013 | Search | Empty search query | 1. Submit search with empty/whitespace query | All results shown or "Enter search term" message |
| EDGE-014 | Search | Special characters in search | 1. Search for "<script>alert('x')</script>" | No XSS execution; results show no match or sanitized |
| EDGE-015 | Pagination | Navigate beyond last page | 1. Modify URL to page=999 | Redirect to last valid page or empty state message |
| EDGE-016 | Pagination | Zero or negative page number | 1. Modify URL to page=0 or page=-1 | Redirect to page 1 or error handling |

### 3.4 Concurrent Operations

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| EDGE-017 | Products | Edit same product from two browsers | 1. Open product edit in Browser A and B 2. Save in A 3. Save in B | Last save wins or conflict warning shown |
| EDGE-018 | Orders | Refund same order simultaneously | 1. Open order in two tabs 2. Click refund in both | Only one refund processes; second fails with error |
| EDGE-019 | Staff | Delete employee while they're logged in | 1. Delete user from admin panel 2. User tries action | User session invalidated; logged out |

### 3.5 Empty States

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| EDGE-020 | Products | View products when none exist | 1. New establishment 2. Navigate to Products | Empty state: "No products yet" with "Add Product" CTA |
| EDGE-021 | Orders | View orders when none exist | 1. New establishment 2. Navigate to Orders | Empty state: "No orders yet" |
| EDGE-022 | Staff | View staff when only self | 1. Navigate to Staff as only user | Self shown in list; can't delete self |
| EDGE-023 | Reports | View reports with no data | 1. New establishment 2. View Reports | Empty charts; "No data for selected period" message |

---

## 4. UI/UX & Responsiveness

### 4.1 Responsive Design

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| UI-001 | Mobile | Dashboard on mobile (375px) | 1. Open dashboard on iPhone SE viewport | Layout adapts: stacked cards, hamburger menu, readable text |
| UI-002 | Mobile | Products list on mobile | 1. Open products on mobile | List/card view adapts; no horizontal scroll |
| UI-003 | Mobile | Forms on mobile | 1. Open product form on mobile | Form inputs full-width; keyboard doesn't obscure inputs |
| UI-004 | Mobile | Modals on mobile | 1. Open any modal on mobile | Modal fits screen; scrollable if content exceeds |
| UI-005 | Tablet | Dashboard on tablet (768px) | 1. Open on iPad viewport | Layout uses tablet breakpoint; 2-column grids |
| UI-006 | Desktop | Dashboard on desktop (1440px) | 1. Open on large desktop | Full layout displayed; sidebars visible |
| UI-007 | Desktop | Ultra-wide monitor (2560px) | 1. Open on ultra-wide | Content centered or max-width applied; no stretching |

### 4.2 Browser Compatibility

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| UI-008 | Chrome | Full workflow test | 1. Run all happy path tests in Chrome latest | All features work correctly |
| UI-009 | Firefox | Full workflow test | 1. Run all happy path tests in Firefox latest | All features work correctly |
| UI-010 | Safari | Full workflow test | 1. Run all happy path tests in Safari latest | All features work correctly |
| UI-011 | Edge | Full workflow test | 1. Run all happy path tests in Edge latest | All features work correctly |
| UI-012 | Mobile Safari | Login and basic navigation | 1. Test on iOS Safari | Touch interactions work; no rendering issues |
| UI-013 | Chrome Mobile | Login and basic navigation | 1. Test on Android Chrome | Touch interactions work; no rendering issues |

### 4.3 Theme & Accessibility

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| UI-014 | Dark Mode | Toggle dark mode | 1. Click theme toggle | UI switches to dark theme; all elements readable |
| UI-015 | Dark Mode | Persist theme preference | 1. Set dark mode 2. Refresh page | Theme preference persisted |
| UI-016 | Accessibility | Keyboard navigation | 1. Use Tab to navigate form 2. Use Enter to submit | All interactive elements focusable; focus indicators visible |
| UI-017 | Accessibility | Screen reader labels | 1. Use screen reader on forms | Form inputs have proper labels; buttons announced correctly |
| UI-018 | Accessibility | Color contrast | 1. Audit with accessibility tool | Text meets WCAG AA contrast ratios |
| UI-019 | Accessibility | Focus management in modals | 1. Open modal | Focus moves to modal; Tab cycles within modal |

### 4.4 Visual Elements

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| UI-020 | Loading | Loading states displayed | 1. Trigger any data fetch | Spinner/skeleton shown during load |
| UI-021 | Toast | Success toast display | 1. Complete successful action | Green success toast appears; auto-dismisses |
| UI-022 | Toast | Error toast display | 1. Trigger error | Red error toast appears with message |
| UI-023 | Animations | Page transitions | 1. Navigate between pages | Smooth fade/slide animations (Framer Motion) |
| UI-024 | Charts | Chart interactivity | 1. Hover over chart elements | Tooltips appear with data values |
| UI-025 | Tables | Table sorting | 1. Click sortable column header | Table sorts by column; indicator shown |

---

## 5. Security Testing

### 5.1 Authentication Security

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| SEC-001 | Auth | Access protected page without login | 1. Clear session 2. Navigate to `/dashboard` directly | Redirected to `/login` |
| SEC-002 | Auth | Access admin page as regular user | 1. Login as USER role 2. Navigate to admin-only page | Access denied or page not shown in navigation |
| SEC-003 | Auth | Brute force protection | 1. Attempt login with wrong password 10+ times | Account locked or rate limiting applied |
| SEC-004 | Auth | Token in URL | 1. Check URLs for sensitive tokens | No tokens in URL; tokens only in headers/cookies |
| SEC-005 | Auth | Logout clears session | 1. Logout 2. Use browser back button | Cannot access protected pages; session fully cleared |
| SEC-006 | Auth | Password not exposed | 1. Inspect network requests | Password sent but never returned in responses |

### 5.2 Input Validation & Injection

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| SEC-007 | XSS | Script injection in product name | 1. Create product named `<script>alert('XSS')</script>` | Script not executed; text escaped/sanitized |
| SEC-008 | XSS | Script injection in search | 1. Search for `<img src=x onerror=alert(1)>` | No alert; input sanitized |
| SEC-009 | XSS | Script in user name | 1. Register with name `<script>` | Text displayed safely; no execution |
| SEC-010 | SQL Injection | SQL in search field | 1. Search for `' OR '1'='1` | Returns empty or normal search results; no DB error |
| SEC-011 | SQL Injection | SQL in login | 1. Enter `admin'--` as username | Login fails normally; no bypass |
| SEC-012 | NoSQL Injection | NoSQL operators in input | 1. Enter `{"$gt": ""}` in search | No database manipulation; treated as text |

### 5.3 Authorization & Access Control

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| SEC-013 | IDOR | Access another establishment's data | 1. Login to Establishment A 2. Try API call with Establishment B's ID | 403 Forbidden or data not returned |
| SEC-014 | IDOR | View another user's orders | 1. Modify order ID in API call | Only own establishment's orders accessible |
| SEC-015 | Privilege Escalation | User tries admin API endpoints | 1. Login as USER 2. Call admin-only API | 403 Forbidden |
| SEC-016 | Privilege Escalation | Modify own role via API | 1. Try to update own role to ADMIN via API | Request rejected; role can only be changed by admin |

### 5.4 Data Protection

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| SEC-017 | HTTPS | All traffic encrypted | 1. Monitor network traffic | All requests use HTTPS; no HTTP leakage |
| SEC-018 | Sensitive Data | Credit card info not logged | 1. Review console/network logs | No sensitive payment data in logs |
| SEC-019 | Cookies | Cookie security flags | 1. Inspect authentication cookies | HttpOnly, Secure, SameSite flags set |
| SEC-020 | CORS | Cross-origin requests | 1. Try API call from unauthorized origin | CORS policy blocks request |

### 5.5 File Upload Security

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| SEC-021 | Upload | Upload executable file | 1. Try to upload .exe as product image | File rejected; only allowed image types accepted |
| SEC-022 | Upload | Upload file with misleading extension | 1. Rename .exe to .jpg 2. Try to upload | Server validates actual file type; rejects if invalid |
| SEC-023 | Upload | Path traversal in filename | 1. Upload file named `../../../etc/passwd.jpg` | Filename sanitized; no path traversal |

### 5.6 Session Security

| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| SEC-024 | Session | Session fixation | 1. Get session ID before login 2. Login 3. Check session ID | Session ID regenerated after login |
| SEC-025 | Session | Session timeout | 1. Login 2. Leave inactive for timeout period 3. Try action | Session expired; must re-authenticate |
| SEC-026 | Session | Concurrent session limit | 1. Login on multiple devices (if policy enforced) | Based on policy: allowed or previous session terminated |

---

## Test Environment Requirements

### Browsers to Test
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Chrome Mobile (Android)
- Safari Mobile (iOS)

### Screen Resolutions
- Mobile: 375x667 (iPhone SE), 390x844 (iPhone 12)
- Tablet: 768x1024 (iPad)
- Desktop: 1280x720, 1920x1080
- Large: 2560x1440

### Test Data Requirements
- Multiple user accounts (Admin, User roles)
- Multiple establishments
- Products with and without images
- Products with and without stock tracking
- Orders in various states (Completed, Refunded, Held)
- Historical data for reports

---

## Automation Recommendations

### Recommended Testing Frameworks
- **E2E Testing:** Playwright (already configured in project)
- **Unit Testing:** Vitest (already configured)
- **API Testing:** Playwright API or Postman/Newman
- **Accessibility:** axe-core integration

### Priority for Automation
1. **High:** AUTH-001 to AUTH-010 (Login/Logout flows)
2. **High:** PROD-005 to PROD-007 (Product CRUD)
3. **High:** SEC-001 to SEC-006 (Authentication security)
4. **Medium:** ORD-001 to ORD-008 (Order management)
5. **Medium:** All negative tests for forms
6. **Low:** UI responsiveness (visual regression)

---

## Appendix: Test Case Template

```markdown
| Test ID | Category | Scenario | Steps to Reproduce | Expected Result |
|:--------|:---------|:---------|:-------------------|:----------------|
| [ID] | [Category] | [Brief scenario description] | 1. Step 1 2. Step 2 3. Step 3 | [Expected outcome] |
```

---

**Document Version:** 1.0  
**Total Test Cases:** 150+  
**Last Updated:** January 2026

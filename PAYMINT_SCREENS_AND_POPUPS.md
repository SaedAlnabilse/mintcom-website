# PayMint Screens & Popups Reference

This document lists all the application screens (pages) and interactive popups (modals) within the PayMint ecosystem.

## 1. Screens (Pages)

### Public & Authentication
| Route | Page Name | Description |
| :--- | :--- | :--- |
| `/` | **Landing Page** | Marketing homepage with features, pricing, and contact. |
| `/demo` | **Demo Page** | Interactive showcase of the system. |
| `/login` | **Login Page** | User authentication entry point. |
| `/signup` | **Sign Up Page** | New account registration. |
| `/verify-email` | **Verify Email** | Email verification landing screen. |
| `/forgot-password` | **Forgot Password** | Request password reset link. |
| `/reset-password` | **Reset Password** | Set new password screen. |

### Onboarding
| Route | Page Name | Description |
| :--- | :--- | :--- |
| `/onboarding` | **Onboarding Wizard** | Initial setup for new accounts. |
| `/select-establishment` | **Select Establishment** | Context switcher for multi-location users. |

### Backoffice Portal (Account Level)
*Route Prefix: `/owner`*

| Page Name | Description |
| :--- | :--- |
| **Overview** | Aggregated statistics across all businesses. |
| **Establishments** | Manage all restaurant/retail locations. |
| **Brands** | Group locations into brands. |
| **Roles** | Define account-level access roles. |
| **Employees** | Manage staff across the organization. |
| **Billing** | Subscription and invoice management. |
| **Merge Accounts** | Tools to merge duplicate data/accounts. |
| **Account Management** | Personal profile and security settings. |

### Brand Portal (Brand Level)
*Route Prefix: `/brand/:brandId`*

| Page Name | Description |
| :--- | :--- |
| **Dashboard** | Brand-specific performance overview. |
| **Locations** | Manage physical locations for this brand. |
| **Team** | Manage brand-level staff. |

### Establishment Dashboard (POS & Operations)
*Route Prefix: `/dashboard`*

| Page Name | Description |
| :--- | :--- |
| **Dashboard** | Main POS view, real-time sales metrics. |
| **Orders** | Order history, search, and status management. |
| **Products** | Inventory management (Items). |
| **Categories** | Product categorization. |
| **Staff** | Shift management and permissions. |
| **Customers** | CRM and loyalty program. |
| **Reports** | Sales, inventory, and labor analytics. |
| **Discounts** | Manage promotional rules. |
| **Payment Methods** | Configure accepted payment types. |
| **Settings** | Store configuration (Tax, Printers, etc.). |
| **Activity Log** | Audit trail of all actions. |
| **Add-ons** | Manage product modifiers (Attributes). |
| **Materials** | Raw material inventory tracking. |
| **Recipes** | Link products to raw materials. |
| **Establishments** | Switch or manage current establishment settings. |
| **Billing** | Establishment-specific billing. |
| **Admin Users** | Manage high-level admins. |
| **Custom Roles** | Define granular permissions for staff. |

---

## 2. Popups & Modals

### System & Security
| Component | Description |
| :--- | :--- |
| **ConfirmModal** | Generic confirmation dialog (e.g., "Delete this item?"). |
| **LoginOverlay** | Overlay shown during authentication actions. |
| **LogoutOverlay** | Overlay shown while securely logging out. |
| **SecurityVerificationModal** | Verifies identity (PIN/Password) for sensitive actions. |
| **PasswordResetOtpModal** | Input for OTP during password reset flows. |
| **EstablishmentDeletionWizard** | Multi-step safety check for deleting a location. |

### Data Entry & Forms
| Component | Description |
| :--- | :--- |
| **ProductFormModal** | **(Crucial)** Full product editor (Name, Price, Stock, Image). |
| **EmployeeFormModal** | Add/Edit staff members and assign roles. |
| **CategoryFormModal** | Create/Edit product categories. |
| **DiscountFormModal** | Configure discount rules (%, Fixed, Admin-only). |
| **AttributeFormModal** | Manage add-on groups (Sizes, Colors, Toppings). |
| **RewardFormModal** | Configure loyalty program rewards. |
| **CustomRoleFormModal** | Create specific permission sets for custom roles. |
| **AddPaymentMethodModal** | Secure entry for new payment methods. |

### Operational Views
| Component | Description |
| :--- | :--- |
| **OrderDetailModal** | Detailed view of a transaction (Items, Splits, Timestamps). |
| **PayInPayOutLogModal** | detailed log of petty cash movements (found in Reports). |

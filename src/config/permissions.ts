/**
 * Centralized Permission Configuration
 *
 * This file defines all permissions used across the application.
 * Keep this in sync with the backend permission definitions.
 */

/**
 * Map of route paths to required permissions.
 * User needs at least ONE of the listed permissions to access the route.
 * Multiple permissions are listed for backward compatibility with legacy permission names.
 */
export const REQUIRED_PERMISSIONS: Record<string, string[]> = {
  // Reports
  'reports/sales': ['view_reports', 'reports'],
  'reports/items': ['view_reports', 'reports'],
  'reports/staff-sales': ['view_reports', 'reports'],
  'reports/payments': ['view_reports', 'reports'],
  'reports/modifiers': ['view_reports', 'reports'],
  'reports/discounts': ['view_reports', 'reports'],
  'reports/taxes': ['view_reports', 'reports'],
  'reports/shifts': ['view_reports', 'reports'],
  'reports/cash-discrepancy': ['view_reports', 'reports'],

  // Orders
  'orders': ['view_orders', 'view_reports', 'reports'],

  // Inventory
  'categories': ['manage_inventory', 'items'],
  'products': ['manage_inventory', 'items'],
  'addons': ['manage_inventory', 'items'],
  'materials': ['manage_inventory', 'items'],
  'recipes': ['manage_inventory', 'items'],

  // Sales
  'payment-methods': ['manage_payment_methods', 'manage_settings', 'settings'],

  // People
  'staff': ['manage_employees', 'employees'],
  'roles': ['manage_employees', 'employees'],
  'admin-users': ['manage_employees', 'employees'],

  // Discounts & Loyalty
  'discounts': ['manage_discounts', 'manage_settings', 'settings', 'discounts'],
  'loyalty': ['manage_settings', 'settings'],
  'customers': ['manage_customers', 'manage_employees', 'employees'],

  // Settings & Admin
  'settings': ['manage_settings', 'settings'],
  'activity-logs': ['view_activity_logs', 'view_reports', 'reports'],
  'billing': ['manage_billing'],
  'establishments': ['manage_settings', 'settings'],
};

/**
 * POS Permissions - Used in the POS app
 */
export const POS_PERMISSIONS = [
  { id: 'pos', label: 'POS System', description: 'Access to sales screen' },
  { id: 'dashboard', label: 'Dashboard', description: 'View sales summary & analytics' },
  { id: 'reports', label: 'Reports', description: 'View sales reports' },
  { id: 'settings', label: 'Settings', description: 'App configuration' },
  { id: 'inventory', label: 'Inventory', description: 'Manage stock' },
  { id: 'refunds', label: 'Refunds', description: 'Process refunds' },
  { id: 'discounts', label: 'Discounts', description: 'Apply discounts' },
  { id: 'employees', label: 'Manage Employees', description: 'Add/Edit users' },
] as const;

/**
 * Backoffice Permissions - Used in the website dashboard
 */
export const BACKOFFICE_PERMISSIONS = [
  { id: 'view_reports', label: 'View sales reports', description: 'Access dashboard and analytics' },
  { id: 'view_orders', label: 'View orders', description: 'View order history' },
  { id: 'manage_inventory', label: 'Manage items', description: 'Create and edit products and inventory' },
  { id: 'view_cost', label: 'View cost of items', description: 'See profit margins and costs' },
  { id: 'manage_employees', label: 'Manage employees', description: 'Add/edit staff and roles' },
  { id: 'manage_customers', label: 'Manage customers', description: 'View and edit customer database' },
  { id: 'manage_discounts', label: 'Manage discounts', description: 'Create and edit discounts' },
  { id: 'manage_payment_methods', label: 'Manage payment methods', description: 'Configure payment options' },
  { id: 'manage_settings', label: 'Manage feature settings', description: 'General store configuration' },
  { id: 'view_activity_logs', label: 'View activity logs', description: 'See system activity' },
  { id: 'manage_billing', label: 'Manage billing', description: 'View and manage subscription' },
] as const;

/**
 * Check if a user has at least one of the required permissions
 */
export function hasPermission(
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;

  const userPermsSet = new Set(userPermissions);
  return requiredPermissions.some(p => userPermsSet.has(p));
}

/**
 * Check if a user has access to a specific route
 */
export function hasRouteAccess(
  userPermissions: string[] | undefined,
  routePath: string
): boolean {
  const required = REQUIRED_PERMISSIONS[routePath];
  if (!required) return true; // No permissions required for this route
  return hasPermission(userPermissions, required);
}

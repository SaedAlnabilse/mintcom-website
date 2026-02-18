/**
 * Centralized Permission Configuration
 *
 * This file defines all permissions used across the application.
 * Uses the canonical permission spec from the backend.
 * Legacy aliases are included in route maps for backward compatibility
 * with old tokens that haven't been re-issued yet.
 */

// ─── Legacy Alias Map (client-side copy for normalization) ───────────
// This mirrors the backend LEGACY_ALIAS_MAP for client-side normalization.
export const LEGACY_ALIAS_MAP: Record<string, string> = {
  reports: 'view_reports',
  view_shift_reports: 'view_shift_reports',
  shift_reports: 'view_shift_reports',
  items: 'manage_inventory',
  inventory: 'manage_inventory',
  manage_items: 'manage_inventory',
  manage_products: 'manage_inventory',
  manage_categories: 'manage_inventory',
  view_cost: 'view_cost',
  view_costs: 'view_cost',
  view_item_cost: 'view_cost',
  employees: 'manage_employees',
  manage_staff: 'manage_employees',
  settings: 'manage_settings',
  manage_taxes: 'change_taxes',
  manage_devices: 'manage_settings',
  manage_loyalty: 'manage_settings',
  manage_loyalty_program: 'manage_loyalty_program',
  manage_taxes_backoffice: 'manage_taxes_backoffice',
  manage_kitchen_printers: 'manage_kitchen_printers',
  manage_printers: 'manage_kitchen_printers',
  kitchen_printers: 'manage_kitchen_printers',
  manage_pos_devices: 'manage_pos_devices',
  pos_devices: 'manage_pos_devices',
  manage_payment_types: 'manage_payment_methods',
  refund_orders: 'refunds',
  void_orders: 'void_items',
  view_dashboard: 'dashboard',
  apply_discounts: 'discounts',
  create_orders: 'pos',
  accept_payments: 'pos',
  view_all_receipts: 'view_orders',
  cancel_receipts: 'cancel_receipts',
  cancel_receipt: 'cancel_receipts',
  manage_open_tickets: 'manage_open_tickets',
  open_cash_drawer: 'open_cash_drawer',
  reprint_receipts: 'reprint_receipts',
  change_taxes: 'change_taxes',
  live_chat: 'live_chat',
  live_chat_support: 'live_chat',
};

/**
 * Map of route paths to required permissions.
 * User needs at least ONE of the listed permissions to access the route.
 * Multiple permissions are listed for backward compatibility with legacy permission names.
 */
export const REQUIRED_PERMISSIONS: Record<string, string[]> = {
  // Reports — only canonical names needed; hasPermission normalizes legacy aliases
  'reports/sales': ['view_reports'],
  'reports/items': ['view_reports'],
  'reports/staff-sales': ['view_reports'],
  'reports/payments': ['view_reports'],
  'reports/modifiers': ['view_reports'],
  'reports/discounts': ['view_reports'],
  'reports/taxes': ['view_reports'],
  'reports/shifts': ['view_shift_reports', 'view_reports'],
  'reports/cash-discrepancy': ['view_reports'],

  // Orders
  'orders': ['view_orders', 'cancel_receipts'],

  // Inventory
  'categories': ['manage_inventory'],
  'products': ['manage_inventory'],
  'addons': ['manage_inventory'],
  'materials': ['manage_inventory'],
  'recipes': ['manage_inventory'],

  // Sales
  'payment-methods': ['manage_payment_methods'],

  // People
  'staff': ['manage_employees'],
  'roles': ['manage_employees'],
  'admin-users': ['manage_employees'],

  // Discounts & Loyalty
  'discounts': ['manage_discounts'],
  'loyalty': ['manage_loyalty_program', 'manage_settings'],
  'customers': ['manage_customers'],

  // Settings & Admin
  'settings': ['manage_settings', 'manage_taxes_backoffice', 'manage_kitchen_printers', 'manage_pos_devices'],
  'activity-logs': ['view_activity_logs'],
  'billing': ['manage_billing'],
  'establishments': ['manage_settings'],
};

/**
 * POS Permissions - Used when displaying permission toggles for POS access.
 * Uses canonical permission IDs.
 */
export const POS_PERMISSIONS = [
  { id: 'pos', label: 'POS System', description: 'Access to sales screen' },
  { id: 'dashboard', label: 'Dashboard', description: 'View sales summary & analytics' },
  { id: 'view_reports', label: 'Reports', description: 'View sales reports' },
  { id: 'view_orders', label: 'View Orders', description: 'View order history' },
  { id: 'view_shift_reports', label: 'Shift Reports', description: 'View shift-level reports' },
  { id: 'void_items', label: 'Void Items', description: 'Void items from active orders' },
  { id: 'refunds', label: 'Refunds', description: 'Process refunds' },
  { id: 'discounts', label: 'Discounts', description: 'Apply discounts at POS' },
  { id: 'manage_open_tickets', label: 'Manage Open Tickets', description: 'View and manage all open/held tickets' },
  { id: 'open_cash_drawer', label: 'Open Cash Drawer', description: 'Open drawer without making a sale' },
  { id: 'reprint_receipts', label: 'Reprint Receipts', description: 'Reprint and resend receipts' },
  { id: 'change_taxes', label: 'Change Taxes', description: 'Change tax rate in sales workflow' },
  { id: 'view_cost', label: 'View Costs', description: 'View item costs and margins' },
  { id: 'live_chat', label: 'Live Chat Support', description: 'Access live support chat' },
] as const;

/**
 * Backoffice Permissions - Used in the website dashboard.
 * Uses canonical permission IDs.
 */
export const BACKOFFICE_PERMISSIONS = [
  { id: 'view_reports', label: 'View Sales Reports', description: 'Access dashboard and analytics' },
  { id: 'view_orders', label: 'View Orders', description: 'View order history and receipts' },
  { id: 'cancel_receipts', label: 'Cancel Receipts', description: 'Cancel or refund completed receipts' },
  { id: 'manage_inventory', label: 'Manage Items and Inventory', description: 'Create and edit products, categories, and stock' },
  { id: 'view_cost', label: 'View Cost', description: 'View product cost and margin fields' },
  { id: 'manage_customers', label: 'Manage Customers', description: 'View and edit customer database' },
  { id: 'manage_employees', label: 'Manage Employees', description: 'Add/edit staff and roles' },
  { id: 'manage_discounts', label: 'Manage Discounts', description: 'Create and edit discount definitions' },
  { id: 'manage_settings', label: 'Edit General Settings', description: 'General store configuration and profile settings' },
  { id: 'manage_billing', label: 'Manage Billing', description: 'View and manage subscription & billing' },
  { id: 'manage_payment_methods', label: 'Manage Payment Types', description: 'Configure payment options' },
  { id: 'manage_loyalty_program', label: 'Manage Loyalty Program', description: 'Configure loyalty earning and rewards rules' },
  { id: 'manage_taxes_backoffice', label: 'Manage Taxes', description: 'Update tax settings from back office' },
  { id: 'manage_kitchen_printers', label: 'Manage Kitchen Printers', description: 'Configure kitchen printer settings and routing' },
  { id: 'manage_pos_devices', label: 'Manage POS Devices', description: 'Manage registers and connected POS devices' },
  { id: 'live_chat', label: 'Access Live Chat Support', description: 'Access in-app support chat' },
  { id: 'view_activity_logs', label: 'View Activity Logs', description: 'See system activity' },
] as const;

/**
 * Normalize a permission array: resolve legacy aliases → canonical names.
 */
export function normalizePermission(permission: string): string {
  const lower = permission.trim().toLowerCase();
  if (lower === '*' || lower === 'all') return '*';
  return LEGACY_ALIAS_MAP[lower] || lower;
}

export function normalizePermissions(permissions: string[]): string[] {
  const result = new Set<string>();
  for (const perm of permissions) {
    result.add(normalizePermission(perm));
  }
  return Array.from(result);
}

/**
 * Check if a user has at least one of the required permissions.
 * Normalizes both sides through the legacy alias map.
 */
export function hasPermission(
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;

  // Wildcard check
  if (userPermissions.includes('*') || userPermissions.includes('ALL')) return true;

  const userNormalized = new Set(normalizePermissions(userPermissions));
  const requiredNormalized = normalizePermissions(requiredPermissions);

  return requiredNormalized.some(p => userNormalized.has(p));
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

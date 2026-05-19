/**
 * Centralized permission configuration for backoffice routing + UI checks.
 * Keep LEGACY_ALIAS_MAP aligned with backend permissions.constants.ts.
 */

export const LEGACY_ALIAS_MAP: Record<string, string> = {
  // Reports
  reports: 'view_reports',
  shift_reports: 'view_shift_reports',
  view_previous_shift_analytics: 'view_shift_reports',

  // Inventory
  items: 'manage_inventory',
  inventory: 'manage_inventory',
  manage_items: 'manage_inventory',
  manage_products: 'manage_inventory',
  manage_categories: 'manage_inventory',
  view_costs: 'view_cost',
  view_item_cost: 'view_cost',

  // Employees
  employees: 'manage_employees',
  manage_staff: 'manage_employees',

  // Settings
  settings: 'manage_settings',
  manage_taxes: 'change_taxes',
  manage_service_charge: 'manage_service_charge',
  manage_devices: 'manage_settings',
  manage_loyalty: 'manage_settings',
  manage_loyalty_program: 'manage_loyalty_program',
  manage_printers: 'manage_kitchen_printers',
  kitchen_printers: 'manage_kitchen_printers',
  manage_pos_devices: 'manage_pos_devices',
  pos_devices: 'manage_pos_devices',
  manage_payment_types: 'manage_payment_methods',

  // Discounts (POS)
  apply_discounts: 'discounts',

  // Refunds / Orders / POS
  refund_orders: 'refunds',
  void_orders: 'void_items',
  view_dashboard: 'dashboard',
  create_orders: 'pos',
  accept_payments: 'pos',
  view_all_receipts: 'view_orders',
  cancel_receipts: 'cancel_receipts',
  manage_open_tickets: 'manage_open_tickets',
  open_cash_drawer: 'open_cash_drawer',
  open_drawer: 'open_cash_drawer',
  reprint_receipts: 'reprint_receipts',
  change_taxes: 'change_taxes',
  change_service_charge: 'change_service_charge',
  live_chat: 'live_chat',
  pay_in_pay_out: 'pay_in_pay_out',
  restock_items: 'restock_items',
  loyalty_system_access: 'loyalty_system_access',
  delete_establishment: 'delete_establishment',
};

/**
 * Map of route paths to required permissions.
 * User needs at least ONE of the listed permissions to access the route.
 */
export const REQUIRED_PERMISSIONS: Record<string, string[]> = {
  // Reports
  'reports': ['view_reports'],
  'reports/sales': ['view_reports'],
  'reports/items': ['view_reports'],
  'reports/staff-sales': ['view_reports'],
  'reports/payments': ['view_reports'],
  'reports/modifiers': ['view_reports'],
  'reports/discounts': ['view_reports'],
  'reports/taxes': ['view_reports'],
  'reports/receipts': ['view_reports'],
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

  // Discounts / Loyalty / Customers
  'discounts': ['manage_discounts'],
  'loyalty': ['manage_loyalty_program', 'manage_discounts'],
  'customers': ['manage_customers', 'manage_discounts'],

  // Settings & Admin
  'settings': ['manage_settings', 'manage_taxes_backoffice', 'manage_kitchen_printers', 'manage_pos_devices'],
  'activity-logs': [
    'view_activity_logs',
    'manage_settings',
    'manage_establishment_profile',
    'manage_tax_currency',
    'manage_receipt_settings',
  ],
  'billing': ['manage_billing'],
  'establishments': ['manage_settings'],
};

export const POS_PERMISSIONS = [
  { id: 'open_cash_drawer', label: 'Open Drawer Without Making Sale', description: '' },
  { id: 'change_taxes', label: 'Change Tax Rate in Order', description: '' },
  { id: 'change_service_charge', label: 'Change Service Charge in Order', description: '' },
  { id: 'pay_in_pay_out', label: 'Pay-In/Pay-Out (Non-Sales Transactions)', description: '' },
  { id: 'dashboard', label: 'View Current Analytics in Dashboard', description: '' },
  { id: 'view_shift_reports', label: 'View Previous Shift Analytics in Dashboard', description: '' },
  { id: 'restock_items', label: 'Restock Items', description: 'Quick access to restock products without accessing Backoffice' },
  { id: 'manage_open_tickets', label: 'Manage Previous Held Orders', description: '' },
  { id: 'refunds', label: 'Make Refunds', description: '' },
  { id: 'discounts', label: 'Apply Discounts', description: '' },
  { id: 'loyalty_system_access', label: 'Loyalty System Access', description: '' },
  { id: 'reprint_receipts', label: 'Reprint Receipt or Send', description: '' },
  { id: 'live_chat', label: 'Access Support Portal', description: '' },
] as const;

export const BACKOFFICE_PERMISSIONS = [
  { id: 'view_reports', label: 'Access Full Report', description: 'Access detailed sales analytics, peak hours, and financial summaries' },
  { id: 'cancel_receipts', label: 'Make Refunds', description: 'Authorize order refunds and receipt cancellations from the back office' },
  { id: 'manage_inventory', label: 'Manage Recipe Operations', description: 'Manage products, categories, stock tracking, and production recipes' },
  { id: 'manage_payment_methods', label: 'Manage Payment Methods', description: '' },
  { id: 'manage_employees', label: 'Manage Employees', description: '' },
  { id: 'manage_discounts', label: 'Discounts, Loyalty and Customers', description: '' },
  { id: 'manage_settings', label: 'Change Establishment Settings', description: '' },
  { id: 'manage_establishment_profile', label: 'Location Profile', description: '' },
  { id: 'manage_tax_currency', label: 'Tax and Currency', description: '' },
  { id: 'manage_service_charge', label: 'Service Charge', description: '' },
  { id: 'manage_receipt_settings', label: 'Receipts', description: '' },
  { id: 'delete_establishment', label: 'Delete Location', description: '' },
  { id: 'export_data', label: 'Allow Data Export', description: 'Export business data into CSV or PDF formats for external analysis' },
] as const;

/**
 * Normalize a permission string using the legacy alias map.
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
 * Check whether a user has at least one of the required permissions.
 */
export function hasPermission(
  userPermissions: string[] | undefined,
  requiredPermissions: string[]
): boolean {
  if (!requiredPermissions || requiredPermissions.length === 0) return true;
  if (!userPermissions || userPermissions.length === 0) return false;

  if (userPermissions.includes('*') || userPermissions.includes('ALL')) return true;

  const userNormalized = new Set(normalizePermissions(userPermissions));
  const requiredNormalized = normalizePermissions(requiredPermissions);

  return requiredNormalized.some((p) => userNormalized.has(p));
}

/**
 * Check route access based on REQUIRED_PERMISSIONS.
 */
export function hasRouteAccess(
  userPermissions: string[] | undefined,
  routePath: string
): boolean {
  const required = REQUIRED_PERMISSIONS[routePath];
  if (!required) return true;
  return hasPermission(userPermissions, required);
}

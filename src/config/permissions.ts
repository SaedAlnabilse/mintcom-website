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
  { id: 'open_cash_drawer', label: 'Open Drawer', description: 'Open drawer without making a sale' },
  { id: 'change_taxes', label: 'Change Tax Rate In Order', description: 'Change tax rate in the current order' },
  { id: 'pay_in_pay_out', label: 'Pay In Pay Out', description: 'Record pay in and pay out entries' },
  { id: 'dashboard', label: 'View Current Analytics In Dashboard', description: 'View current analytics in dashboard' },
  { id: 'view_shift_reports', label: 'View Previous Shift Analytics In Dashboard', description: 'View previous shift analytics in dashboard' },
  { id: 'restock_items', label: 'Restock Items', description: 'Restock items from POS' },
  { id: 'manage_open_tickets', label: 'Manage Previous Hold Orders', description: 'Manage previous hold orders' },
  { id: 'refunds', label: 'Refunds', description: 'Process refunds on completed orders' },
  { id: 'discounts', label: 'Discounts', description: 'Apply discounts at POS' },
  { id: 'loyalty_system_access', label: 'Loyalty System Access', description: 'Access loyalty system features' },
  { id: 'reprint_receipts', label: 'Reprint Receipt Or Send', description: 'Reprint or send receipts' },
  { id: 'live_chat', label: 'Access Support Portal', description: 'Access support portal' },
] as const;

export const BACKOFFICE_PERMISSIONS = [
  { id: 'view_reports', label: 'Full Sales Reports', description: 'Access detailed sales analytics, peak hours, and financial summaries' },
  { id: 'cancel_receipts', label: 'Refund Orders', description: 'Authorize order refunds and receipt cancellations from the back office' },
  { id: 'manage_inventory', label: 'Inventory', description: 'Manage products, categories, stock tracking, and production recipes' },
  { id: 'manage_payment_methods', label: 'Payment Methods', description: 'Configure accepted payment types like Cash, Card, and digital methods' },
  { id: 'manage_employees', label: 'Manage Employees', description: 'Create and manage staff accounts and their access permissions' },
  { id: 'manage_discounts', label: 'Discounts, Loyalty & Customers', description: 'Manage promotional discounts, loyalty points, rewards, and the customer database' },
  { id: 'manage_loyalty_program', label: 'Loyalty Program', description: 'Configure loyalty points and rewards rules' },
  { id: 'manage_settings', label: 'Store Settings', description: 'Control general store configurations and establishment settings' },
  { id: 'manage_establishment_profile', label: 'Location Profile', description: 'Update store branding, address, and contact details' },
  { id: 'manage_tax_currency', label: 'Tax & Currency', description: 'Set up regional tax rates and currency display options' },
  { id: 'manage_receipt_settings', label: 'Receipts', description: 'Customize receipt layout, logo, and printed messages' },
  { id: 'delete_establishment', label: 'Delete Location', description: 'Permit the permanent removal of this establishment from the system' },
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

export interface Account {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  emailVerified: boolean;
  trialUsed: boolean;
  trialEndDate?: string;
  establishmentLoginId?: string; // Account-level Owner POS ID
  defaultPaymentMethod?: string; // Last 4 digits of saved card (e.g., "4242")
  defaultCardId?: string; // ID of the default saved card
  deletionRequestedAt?: string | null; // ISO date string if deletion is pending
  deletionScheduledFor?: string | null; // Authoritative end of the restoration window
  authProvider?: 'password' | 'google' | 'apple';
  permissions?: string[]; // Admin permissions
  isSecondaryAdmin?: boolean; // Flag for secondary admin users
  hasPassword?: boolean; // Whether the user has a local password
}

export interface Establishment {
  id: string;
  name: string;
  type: string;
  country?: string;
  currency: string;
  timezone?: string;
  subscriptionStatus: string;
  createdAt?: string;
  establishmentLoginId?: string;
  address?: string;
  phone?: string;
  trialEndDate?: string;
  employeeCount?: number;
  isActive?: boolean;
  deletionRequestedAt?: string | null;
  deletionScheduledFor?: string | null;
  deletionExportSentTo?: string | null;
  accessLockedAt?: string | null;
  accessLockReason?: string | null;
}

export interface StaffMember {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username: string;
  role: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  permissions?: string[];
  allowedDiscounts?: string[];
  establishmentIds?: string[];
  customRoleId?: string;
  // Platform access control
  posAccess?: boolean;
  backofficeAccess?: boolean;
  backofficePermissions?: string[];
}

export interface CustomRole {
  id: string;
  name: string;
  role?: string; // Sometimes used interchangeably with baseRole
  baseRole?: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'USER';
  permissions: string[];
  allowedDiscounts: string[];
  allDiscounts?: boolean; // Optional flag
  // Access Control
  posAccess: boolean;
  backofficeAccess: boolean;
  backofficePermissions: string[];
  // Source tracking
  establishmentId?: string;
  establishmentName?: string;
  isGlobal?: boolean;
}

export interface Discount {
  id: string;
  name: string;
  percentage: number;
  adminOnly: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  // Add other common user fields
}

// Add generic Report Data types to replace 'any' in reports
export interface SalesReportData {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  salesByDate: { date: string; amount: number }[];
}

export interface ReportData {
    [key: string]: any; // flexible for now, but better than 'any' everywhere
}

export interface ShiftOption {
  label: string;
  value: string;
  startTime: string;
  endTime?: string | null;
  totalSales: number;
  orderCount: number;
  totalDiscounts: number;
  totalRefunds: number;
  variance: number;
}

export interface SalesSummary {
  totalRevenue: number;
  taxCollected: number;
  serviceChargeCollected?: number;
  serviceChargeRefunded?: number;
  netServiceChargeCollected?: number;
  serviceChargeOrderCount?: number;
  averageServiceChargePerOrder?: number;
  netSalesBeforeTaxAndServiceCharge?: number;
  grossSalesIncludingTaxAndCharges?: number;
  grossProfit: number;
  totalCost?: number;
  totalOrders: number;
  averageOrderValue?: number;
  totalRefunds: number;
  refundOrderCount?: number;
  /**
   * Gross sales with tax removed (service charge still included) — the
   * "Total Sales (excl. tax)" figure reports and exports print beside Tax.
   * Distinct from `netSalesBeforeTaxAndServiceCharge`, which also strips
   * the service charge.
   */
  totalSalesExcludingTax?: number;
  totalHoursWorked: number;
  totalPayIn: number;
  totalPayOut: number;
  dailyBreakdown: Array<{
    date: string;
    /** Gross revenue for the bucket (tax and service charge included). */
    revenue: number;
    /** Tax collected in the bucket. */
    tax?: number;
    /** `revenue` with tax removed — the "excl. tax" figure exports print. */
    netRevenue?: number;
    count: number;
    refunds?: number;
    refundCount?: number;
  }>;
  /**
   * Bucket size of `dailyBreakdown`: hourly for a day or less, daily up to a
   * quarter, monthly beyond that. Month buckets are keyed by the first of the
   * month, so labels must consult this rather than assume a calendar day.
   */
  granularity?: 'hour' | 'day' | 'month';
  paymentMethodBreakdown: Array<{
    name: string;
    value: number;
    /** Orders that used this method (an order can touch several on a split). */
    count?: number;
  }>;
  discountBreakdown: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  cardTypeBreakdown?: Array<{
    name: string;
    value: number;
    count?: number;
  }>;
  otherPaymentBreakdown?: Array<{
    name: string;
    value: number;
    count?: number;
  }>;
  currentTaxRate?: number;
  currentTaxRatePercent?: number;
  currentTaxRateLabel?: string;
  taxBreakdown?: Array<{
    name: string;
    taxName?: string;
    taxType?: string;
    taxTypeLabel?: string;
    description?: string;
    rate: number;
    rateLabel?: string;
    isChanged?: boolean;
    isCurrent?: boolean;
    isPrevious?: boolean;
    taxableAmount: number;
    collected: number;
    taxAmount?: number;
    transactions: number;
    orderCount?: number;
    refundCount?: number;
    netTransactions?: number;
  }>;
  taxExemptSales?: number;
  totalDiscountGiven?: number;
  totalDiscounts?: number;
  totalDiscountCount?: number;
}

export interface PeakHour {
  hour: number | string;
  total: number;
  /** Tax inside `total`; `netTotal` is `total` with it removed. */
  tax?: number;
  netTotal?: number;
  count: number;
}

export interface Shift {
  id: string;
  startTime: string;
  endTime?: string | null;
  totalSales: number;
  /** Tax inside `totalSales`; `netSales` is `totalSales` with it removed. */
  totalTax?: number;
  netSales?: number;
  orderCount: number;
  totalDiscounts: number;
  totalRefunds: number;
  discrepancy: number;
  variance?: number;
  openingBalance: number;
  closingBalance?: number | null;
  // Cash reconciliation figures from /reports/shifts. expectedBalance is what
  // the drawer should hold (opening + cash sales + pay-in - pay-out); the rest
  // let the UI recompute it if an older payload omits it.
  cashSales?: number;
  cardSales?: number;
  totalPayIn?: number;
  totalPayOut?: number;
  expectedBalance?: number;
  expectedCash?: number;
  // autoClose = the POS closed this drawer itself, so closingBalance was set
  // to expectedBalance and its 0.00 variance is not a real count.
  autoClose?: boolean;
  manualCashOut?: boolean;
  closeReason?: string | null;
  status: 'OPEN' | 'CLOSED';
  user?: {
    username: string;
  };
}

export interface ItemReportBreakdown {
  id?: string;
  categoryId?: string;
  itemName?: string;
  name?: string;
  quantity: number;
  totalSales?: number;
  /** Line-level tax for the row; `totalSales` is net of it. */
  totalTax?: number;
  totalSalesWithTax?: number;
  totalRefunds?: number;
  refundQuantity?: number;
  revenue?: number;
  [key: string]: string | number | boolean | string[] | null | undefined; // Allow backend lifecycle metadata
}

export interface ItemReportData {
  breakdown: ItemReportBreakdown[];
}

export interface ShiftInfo {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
  };
  startTime: string;
  endTime?: string;
  autoClose?: boolean;
}

export interface ShiftStatus {
  shiftStatus: 'ACTIVE' | 'LAST_SHIFT' | 'NO_SHIFT';
  activeShift: ShiftInfo | null;
  netSales: number;
  numberOfOrders: number;
  cashSales: number;
  cardSales: number;
  otherPayments: number;
  payIn: number;
  payOut: number;
  totalTimeWorked: string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  pendingOrders: number;
  completedOrders: number;
  activeEmployees: number;
  taxCollected: number;
  serviceChargeCollected?: number;
  serviceChargeRefunded?: number;
  netServiceChargeCollected?: number;
  serviceChargeOrderCount?: number;
  averageServiceChargePerOrder?: number;
  netSalesBeforeTaxAndServiceCharge?: number;
  grossSalesIncludingTaxAndCharges?: number;
  totalRefunds: number;
  grossProfit: number;
  totalPayIn: number;
  totalPayOut: number;
  /** `count` = orders that used the method (a split order touches several). */
  paymentMethodBreakdown: { name: string; value: number; count?: number }[];
  cardTypeBreakdown?: { name: string; value: number; count?: number }[];
  otherPaymentBreakdown?: { name: string; value: number; count?: number }[];
  categoryBreakdown: { name: string; value: number; count?: number }[];
  dailyBreakdown: { date: string; revenue: number; tax?: number; netRevenue?: number; count?: number }[];
}

export interface TopProduct {
  name: string;
  orders: number;
  revenue: number;
}

export interface PreviousShiftSnapshot {
  user: string;
  startTime: string;
  timestamp: string;
  netSales: number;
  numberOfOrders: number;
  cashSales: number;
  cardSales: number;
  otherPayments: number;
  payIn: number;
  payOut: number;
  drawerAmount: number;
  openingBalance: number;
  closingBalance: number;
  discrepancy: number;
  totalTimeWorked: string;
}

export interface TopSellingItem {
  itemName?: string;
  name?: string;
  quantity: number;
  revenue: number;
}

export interface ItemPriceHistory {
  id: string;
  itemId?: string;
  subAttributeId?: string;
  attributeId?: string;
  type: 'ITEM' | 'ADDON';
  name: string;
  establishmentId?: string;
  itemNameSnapshot?: string;
  field?: 'price' | 'cost' | 'name' | 'image' | 'category';
  oldPrice?: number | null;
  newPrice?: number | null;
  oldValue?: number | string | null;
  newValue?: number | string | null;
  oldImage?: string | null;
  newImage?: string | null;
  changedById?: string;
  changedByName?: string | null;
  sourceApp?: string | null;
  changeGroupId?: string | null;
  reason?: string;
  createdAt: string;
  inSelectedRange?: boolean;
}

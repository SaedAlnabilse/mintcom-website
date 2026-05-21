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
  establishmentLoginId?: string; // Account-level Owner Pos Id
  defaultPaymentMethod?: string; // Last 4 digits of saved card (e.g., "4242")
  defaultCardId?: string; // ID of the default saved card
  deletionRequestedAt?: string; // ISO date string if deletion is pending
  permissions?: string[]; // Admin permissions
  isSecondaryAdmin?: boolean; // Flag for secondary admin users
  hasPassword?: boolean; // Whether the user has a local password
}

export interface Establishment {
  id: string;
  name: string;
  type: string;
  currency: string;
  subscriptionStatus: string;
  createdAt?: string;
  establishmentLoginId?: string;
  address?: string;
  phone?: string;
  trialEndDate?: string;
  employeeCount?: number;
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
  totalOrders: number;
  totalRefunds: number;
  totalHoursWorked: number;
  totalPayIn: number;
  totalPayOut: number;
  dailyBreakdown: Array<{
    date: string;
    revenue: number;
    count: number;
  }>;
  paymentMethodBreakdown: Array<{
    name: string;
    value: number;
  }>;
  discountBreakdown: Array<{
    name: string;
    count: number;
    value: number;
  }>;
  cardTypeBreakdown?: Array<{
    name: string;
    value: number;
  }>;
  otherPaymentBreakdown?: Array<{
    name: string;
    value: number;
  }>;
  taxBreakdown?: Array<{
    name: string;
    rate: number;
    taxableAmount: number;
    collected: number;
    transactions: number;
  }>;
  taxExemptSales?: number;
  totalDiscountGiven?: number;
  totalDiscounts?: number;
  totalDiscountCount?: number;
}

export interface PeakHour {
  hour: number | string;
  total: number;
  count: number;
}

export interface Shift {
  id: string;
  startTime: string;
  endTime?: string | null;
  totalSales: number;
  orderCount: number;
  totalDiscounts: number;
  totalRefunds: number;
  discrepancy: number;
  variance?: number;
  openingBalance: number;
  closingBalance?: number | null;
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
  totalRefunds: number;
  grossProfit: number;
  totalPayIn: number;
  totalPayOut: number;
  paymentMethodBreakdown: { name: string; value: number }[];
  categoryBreakdown: { name: string; value: number; count?: number }[];
  dailyBreakdown: { date: string; revenue: number }[];
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
  type: 'ITEM' | 'ADDON';
  name: string;
  establishmentId?: string;
  itemNameSnapshot?: string;
  field?: 'price' | 'name' | 'image';
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


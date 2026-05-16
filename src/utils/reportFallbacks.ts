import type { DashboardStats, ItemReportData, PeakHour, SalesSummary, Shift } from '../types';

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const firstPresent = (...values: unknown[]) =>
  values.find((value) => value !== undefined && value !== null);

const toArray = <T = any>(value: unknown): T[] => (Array.isArray(value) ? value.filter(Boolean) as T[] : []);

export const emptySalesSummary = (): SalesSummary => ({
  totalRevenue: 0,
  taxCollected: 0,
  grossProfit: 0,
  totalOrders: 0,
  totalRefunds: 0,
  totalHoursWorked: 0,
  totalPayIn: 0,
  totalPayOut: 0,
  dailyBreakdown: [],
  paymentMethodBreakdown: [],
  discountBreakdown: [],
  cardTypeBreakdown: [],
  otherPaymentBreakdown: [],
  taxBreakdown: [],
  taxExemptSales: 0,
  totalDiscountGiven: 0,
  totalDiscounts: 0,
  totalDiscountCount: 0,
});

export const normalizeSalesSummary = (payload: any): SalesSummary => {
  const base = emptySalesSummary();
  const source = payload && typeof payload === 'object' ? payload : {};

  return {
    ...base,
    ...source,
    totalRevenue: toNumber(firstPresent(source.totalRevenue, source.totalNetSales, source.netSales, source.totalSales, source.grossSales)),
    taxCollected: toNumber(firstPresent(source.taxCollected, source.totalTaxCollected, source.totalTax)),
    grossProfit: toNumber(source.grossProfit),
    totalOrders: toNumber(source.totalOrders),
    totalRefunds: toNumber(source.totalRefunds),
    totalHoursWorked: toNumber(source.totalHoursWorked),
    totalPayIn: toNumber(source.totalPayIn),
    totalPayOut: toNumber(source.totalPayOut),
    dailyBreakdown: toArray(source.dailyBreakdown).map((row: any) => ({
      date: String(row?.date || ''),
      revenue: toNumber(firstPresent(row?.revenue, row?.sales, row?.total, row?.amount)),
      count: toNumber(firstPresent(row?.count, row?.orders, row?.transactions)),
    })),
    paymentMethodBreakdown: toArray(source.paymentMethodBreakdown).map((row: any) => ({
      name: String(row?.name || row?.method || 'Unknown'),
      value: toNumber(firstPresent(row?.value, row?.amount, row?.total)),
    })),
    discountBreakdown: toArray(source.discountBreakdown).map((row: any) => ({
      name: String(row?.name || row?.discountName || 'Unknown'),
      count: toNumber(row?.count),
      value: toNumber(firstPresent(row?.value, row?.amount, row?.totalAmount)),
    })),
    cardTypeBreakdown: toArray(source.cardTypeBreakdown),
    otherPaymentBreakdown: toArray(source.otherPaymentBreakdown),
    taxBreakdown: toArray(source.taxBreakdown),
    taxExemptSales: toNumber(source.taxExemptSales),
    totalDiscountGiven: toNumber(source.totalDiscountGiven),
    totalDiscounts: toNumber(source.totalDiscounts),
    totalDiscountCount: toNumber(source.totalDiscountCount),
  };
};

export const emptyDashboardStats = (): DashboardStats => ({
  totalRevenue: 0,
  totalOrders: 0,
  averageOrderValue: 0,
  pendingOrders: 0,
  completedOrders: 0,
  activeEmployees: 0,
  taxCollected: 0,
  totalRefunds: 0,
  grossProfit: 0,
  totalPayIn: 0,
  totalPayOut: 0,
  paymentMethodBreakdown: [],
  categoryBreakdown: [],
  dailyBreakdown: [],
});

export const normalizeDashboardStats = (payload: any, overrides: Partial<DashboardStats> = {}): DashboardStats => {
  const source = payload && typeof payload === 'object' ? payload : {};

  return {
    ...emptyDashboardStats(),
    totalRevenue: toNumber(firstPresent(source.totalRevenue, source.totalNetSales, source.netSales, source.totalSales, source.grossSales)),
    totalOrders: toNumber(source.totalOrders),
    averageOrderValue: toNumber(source.averageOrderValue),
    pendingOrders: toNumber(source.pendingOrders),
    completedOrders: toNumber(firstPresent(source.completedOrders, source.totalOrders)),
    activeEmployees: toNumber(source.activeEmployees),
    taxCollected: toNumber(firstPresent(source.taxCollected, source.totalTaxCollected, source.totalTax)),
    totalRefunds: toNumber(source.totalRefunds),
    grossProfit: toNumber(source.grossProfit),
    totalPayIn: toNumber(source.totalPayIn),
    totalPayOut: toNumber(source.totalPayOut),
    paymentMethodBreakdown: toArray(source.paymentMethodBreakdown),
    categoryBreakdown: toArray(source.categoryBreakdown),
    dailyBreakdown: toArray(source.dailyBreakdown),
    ...overrides,
  };
};

export const emptyItemReportData = (): ItemReportData => ({ breakdown: [] });

export const normalizeItemReportData = (payload: any): ItemReportData => {
  const source = payload && typeof payload === 'object' ? payload : {};
  return {
    ...source,
    breakdown: toArray(source.breakdown),
  };
};

export const normalizePeakHours = (payload: unknown): PeakHour[] =>
  toArray(payload).map((row: any) => ({
    hour: row?.hour ?? 0,
    total: toNumber(row?.total),
    count: toNumber(row?.count),
  }));

export const normalizeShifts = (payload: unknown): Shift[] => toArray(payload);

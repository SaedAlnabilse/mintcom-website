import type { DashboardStats, ItemReportData, PeakHour, SalesSummary, Shift } from '../types';

const toNumber = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const firstPresent = (...values: unknown[]) =>
  values.find((value) => value !== undefined && value !== null);

const toArray = <T = any>(value: unknown): T[] => (Array.isArray(value) ? value.filter(Boolean) as T[] : []);

export const normalizePaymentMethodBreakdown = (value: unknown): { name: string; value: number; count: number }[] => {
  const requiredMethods = ['CASH', 'CARD', 'OTHER'];
  const totals = new Map<string, number>(requiredMethods.map((method) => [method, 0]));
  const counts = new Map<string, number>(requiredMethods.map((method) => [method, 0]));
  const extraMethods: string[] = [];

  toArray(value).forEach((row: any) => {
    const method = String(firstPresent(row?.name, row?.method, 'Unknown')).toUpperCase();
    const amount = toNumber(firstPresent(row?.value, row?.amount, row?.total));
    const count = toNumber(firstPresent(row?.count, row?.orders, row?.transactions));

    if (!totals.has(method)) {
      totals.set(method, 0);
      counts.set(method, 0);
      extraMethods.push(method);
    }

    totals.set(method, (totals.get(method) || 0) + amount);
    counts.set(method, (counts.get(method) || 0) + count);
  });

  return [...requiredMethods, ...extraMethods].map((method) => ({
    name: method,
    value: totals.get(method) || 0,
    count: counts.get(method) || 0,
  }));
};

export const emptySalesSummary = (): SalesSummary => ({
  totalRevenue: 0,
  taxCollected: 0,
  serviceChargeCollected: 0,
  serviceChargeRefunded: 0,
  netServiceChargeCollected: 0,
  serviceChargeOrderCount: 0,
  averageServiceChargePerOrder: 0,
  netSalesBeforeTaxAndServiceCharge: 0,
  grossSalesIncludingTaxAndCharges: 0,
  grossProfit: 0,
  totalOrders: 0,
  totalRefunds: 0,
  totalHoursWorked: 0,
  totalPayIn: 0,
  totalPayOut: 0,
  dailyBreakdown: [],
  granularity: 'day',
  paymentMethodBreakdown: normalizePaymentMethodBreakdown([]),
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
  const totalRevenue = toNumber(firstPresent(source.totalRevenue, source.totalNetSales, source.totalSales, source.grossSales));
  const taxCollected = toNumber(firstPresent(source.taxCollected, source.totalTaxCollected, source.totalTax));

  return {
    ...base,
    ...source,
    totalRevenue,
    taxCollected,
    serviceChargeCollected: toNumber(source.serviceChargeCollected),
    serviceChargeRefunded: toNumber(source.serviceChargeRefunded),
    netServiceChargeCollected: toNumber(firstPresent(source.netServiceChargeCollected, source.netOtherChargesCollected, source.serviceChargeCollected)),
    serviceChargeOrderCount: toNumber(source.serviceChargeOrderCount),
    averageServiceChargePerOrder: toNumber(source.averageServiceChargePerOrder),
    netSalesBeforeTaxAndServiceCharge: toNumber(firstPresent(source.baseSales, source.netSalesBeforeTaxAndServiceCharge)),
    grossSalesIncludingTaxAndCharges: toNumber(firstPresent(source.grossSalesIncludingTaxAndCharges, source.totalRevenue)),
    grossProfit: toNumber(source.grossProfit),
    totalOrders: toNumber(source.totalOrders),
    totalRefunds: toNumber(source.totalRefunds),
    totalHoursWorked: toNumber(source.totalHoursWorked),
    totalPayIn: toNumber(source.totalPayIn),
    totalPayOut: toNumber(source.totalPayOut),
    dailyBreakdown: toArray(source.dailyBreakdown).map((row: any) => {
      const revenue = toNumber(firstPresent(row?.revenue, row?.sales, row?.total, row?.amount));
      const tax = toNumber(firstPresent(row?.tax, row?.taxCollected));
      return {
        date: String(row?.date || ''),
        revenue,
        tax,
        // Older API builds send revenue only; deriving net here keeps the
        // exports' "excl. tax" column honest instead of blank.
        netRevenue: toNumber(firstPresent(row?.netRevenue, revenue - tax)),
        count: toNumber(firstPresent(row?.count, row?.orders, row?.transactions)),
        refunds: toNumber(row?.refunds),
        refundCount: toNumber(row?.refundCount),
      };
    }),
    // Older API builds omit this; infer hourly from the key shape so the
    // labels stay right, otherwise fall back to daily as before.
    granularity:
      source.granularity === 'hour' || source.granularity === 'day' || source.granularity === 'month'
        ? source.granularity
        : toArray(source.dailyBreakdown).some((row: any) => String(row?.date || '').includes(':'))
          ? 'hour'
          : 'day',
    paymentMethodBreakdown: normalizePaymentMethodBreakdown(source.paymentMethodBreakdown),
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
  serviceChargeCollected: 0,
  serviceChargeRefunded: 0,
  netServiceChargeCollected: 0,
  serviceChargeOrderCount: 0,
  averageServiceChargePerOrder: 0,
  netSalesBeforeTaxAndServiceCharge: 0,
  grossSalesIncludingTaxAndCharges: 0,
  totalRefunds: 0,
  grossProfit: 0,
  totalPayIn: 0,
  totalPayOut: 0,
  paymentMethodBreakdown: normalizePaymentMethodBreakdown([]),
  categoryBreakdown: [],
  dailyBreakdown: [],
});

export const normalizeDashboardStats = (payload: any, overrides: Partial<DashboardStats> = {}): DashboardStats => {
  const source = payload && typeof payload === 'object' ? payload : {};
  const baseSalesValue = firstPresent((source as any).baseSales, source.netSalesBeforeTaxAndServiceCharge);
  const netSalesValue = firstPresent((source as any).netSales);

  return {
    ...emptyDashboardStats(),
    totalRevenue: toNumber(firstPresent(source.totalRevenue, source.totalNetSales, source.totalSales, source.grossSales)),
    totalOrders: toNumber(source.totalOrders),
    averageOrderValue: toNumber(source.averageOrderValue),
    pendingOrders: toNumber(source.pendingOrders),
    completedOrders: toNumber(firstPresent(source.completedOrders, source.totalOrders)),
    activeEmployees: toNumber(source.activeEmployees),
    taxCollected: toNumber(firstPresent(source.taxCollected, source.totalTaxCollected, source.totalTax)),
    serviceChargeCollected: toNumber(source.serviceChargeCollected),
    serviceChargeRefunded: toNumber(source.serviceChargeRefunded),
    netServiceChargeCollected: toNumber(firstPresent(source.netServiceChargeCollected, source.serviceChargeCollected)),
    serviceChargeOrderCount: toNumber(source.serviceChargeOrderCount),
    averageServiceChargePerOrder: toNumber(source.averageServiceChargePerOrder),
    netSalesBeforeTaxAndServiceCharge:
      baseSalesValue === undefined ? undefined : toNumber(baseSalesValue),
    ...( {
      netSales: netSalesValue === undefined ? undefined : toNumber(netSalesValue),
      baseSales: baseSalesValue === undefined ? undefined : toNumber(baseSalesValue),
    } as Partial<DashboardStats>),
    grossSalesIncludingTaxAndCharges: toNumber(firstPresent(source.grossSalesIncludingTaxAndCharges, source.totalRevenue)),
    totalRefunds: toNumber(source.totalRefunds),
    grossProfit: toNumber(source.grossProfit),
    totalPayIn: toNumber(source.totalPayIn),
    totalPayOut: toNumber(source.totalPayOut),
    paymentMethodBreakdown: normalizePaymentMethodBreakdown(source.paymentMethodBreakdown),
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
  toArray(payload).map((row: any) => {
    const total = toNumber(row?.total);
    const tax = toNumber(row?.tax);
    return {
      hour: row?.hour ?? 0,
      total,
      tax,
      netTotal: toNumber(firstPresent(row?.netTotal, total - tax)),
      count: toNumber(row?.count),
    };
  });

export const normalizeShifts = (payload: unknown): Shift[] => toArray(payload);

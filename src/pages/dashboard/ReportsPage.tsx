import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { endOfDay, startOfDay, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, Clock, ShoppingBag,
  CreditCard, Percent, Scale,
  Users, PlusCircle, FileText
} from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { useCurrency } from '../../context/CurrencyContext';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../utils/dateLocale';
import { useAuth } from '../../context/AuthContext';
import { checkPermission, usePermissionGuard } from '../../hooks/usePermissionGuard';

import { ReceiptsReport } from '../../components/dashboard/reports/ReceiptsReport';
import { BusyOverlay } from '../../components/BusyOverlay';
import { SingleSelect } from '../../components/SingleSelect';
import { ExportMenu } from '../../components/ExportMenu';
import { exportTable, exportSections } from '../../utils/export';
import type { ExportFormat, ExportColumn, ExportMeta, ExportSection } from '../../utils/export';
import { DateRangePicker } from '../../components/DateRangePicker';
import { CustomTimePicker } from '../../components/CustomTimePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import type { SalesSummary, Shift, ItemReportData, PeakHour, ShiftOption } from '../../types';
import {
  emptyItemReportData,
  emptySalesSummary,
  normalizeItemReportData,
  normalizePeakHours,
  normalizeSalesSummary,
  normalizeShifts,
} from '../../utils/reportFallbacks';

// View Components
import { SalesView } from '../../components/dashboard/reports/views/SalesView';
import { ItemsView } from '../../components/dashboard/reports/views/ItemsView';
import { StaffView } from '../../components/dashboard/reports/views/StaffView';
import { ShiftsView } from '../../components/dashboard/reports/views/ShiftsView';
import { clampNowToRangeEnd, formatDurationMs, getShiftDurationMs, hoursToMs } from '../../utils/shiftDuration';
import { PeakHoursView } from '../../components/dashboard/reports/views/PeakHoursView';
import { PaymentsView } from '../../components/dashboard/reports/views/PaymentsView';
import { DiscountsView } from '../../components/dashboard/reports/views/DiscountsView';
import { TaxesView } from '../../components/dashboard/reports/views/TaxesView';
import { CashDiscrepancyView } from '../../components/dashboard/reports/views/CashDiscrepancyView';
import { PayInPayOutLogModal } from '../../components/dashboard/reports/PayInPayOutLogModal';
import { formatInputPlaceholder } from '../../utils/textCase';
import { bucketHasActivity, formatBucketLabel } from '../../utils/reportBuckets';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';

type ReportType = 'sales' | 'top-items' | 'top-categories' | 'top-modifiers' | 'peak-hours' | 'shifts' | 'staff-sales' | 'payments' | 'discounts' | 'taxes' | 'receipts' | 'cash-discrepancy';

interface EmployeeOption {
  label: string;
  value: string;
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { account, currentEstablishment } = useAuth();
  const { currencySymbol } = useCurrency();
  usePermissionGuard(['view_reports']);
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });

  const canExport = useMemo(() => checkPermission(account, ['export_data']), [account]);

  const browserTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const locationSlug = params.locationSlug || params.slug;

  // Date & Time State
  const [startDate, setStartDate] = useState(formatDateForInput(startOfDay(new Date())));
  const [endDate, setEndDate] = useState(formatDateForInput(endOfDay(new Date())));
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');

  // Report State
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [itemReportTab, setItemReportTab] = useState<'items' | 'categories' | 'modifiers' | 'attributes'>('items');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPayInOutModal, setShowPayInOutModal] = useState(false);

  // Advanced Filtering
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeShifts, setEmployeeShifts] = useState<ShiftOption[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Tooltip State for Pills
  const [hoveredReportId, setHoveredReportId] = useState<string | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0 });
  const tabContainerRef = useRef<HTMLDivElement>(null);

  const handlePillMouseEnter = (e: React.MouseEvent, id: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipCoords({
      top: rect.top - 12,
      left: rect.left + rect.width / 2
    });
    setHoveredReportId(id);
  };

  // Keep active tab visible in the scrollable tab bar
  useEffect(() => {
    if (tabContainerRef.current) {
      const selectedEl = tabContainerRef.current.querySelector<HTMLElement>('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [reportType, itemReportTab]);

  const localizedDateOptions = useMemo(() =>
    DATE_PERIOD_OPTIONS.map(opt => ({
      ...opt,
      label: t(`common.datePeriods.${opt.value}`)
    })), [t]);

  // Sync Report Type from URL
  useEffect(() => {
    const path = location.pathname;
    const parts = path.split('/');
    const reportIndex = parts.indexOf('reports');

    if (reportIndex !== -1 && parts[reportIndex + 1]) {
      const type = parts[reportIndex + 1];

      if (['items', 'categories', 'modifiers', 'attributes'].includes(type) || type === 'items-categories' || type === 'addons') {
        setReportType('top-items');
        if (type === 'items') setItemReportTab('items');
        else if (type === 'categories') setItemReportTab('categories');
        else if (type === 'modifiers') setItemReportTab('modifiers');
        else if (type === 'attributes') setItemReportTab('attributes');
        else if (type === 'items-categories') setItemReportTab('items');
        else if (type === 'addons') setItemReportTab('modifiers');
      } else {
        const validTypes: ReportType[] = ['sales', 'top-items', 'peak-hours', 'shifts', 'staff-sales', 'payments', 'discounts', 'taxes', 'receipts', 'cash-discrepancy'];
        if (validTypes.includes(type as ReportType)) {
          setReportType(type as ReportType);
        }
      }
    } else if (reportIndex !== -1) {
      navigate(`/dashboard/${locationSlug}/reports/sales`, { replace: true });
    }
  }, [location, locationSlug, navigate]);

  // Handle PayInOut redirect state
  useEffect(() => {
    if (location.state && (location.state as any).showPayInOut) {
      setShowPayInOutModal(true);
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const effectiveDateRange = useMemo(() => {
    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (selectedShiftId) {
      const shift = employeeShifts.find(s => s.value === selectedShiftId);
      if (shift) {
        // An open shift has no end yet. Bounding it with `new Date()` would
        // freeze the window at the moment this memo last ran, so every order
        // taken after that silently dropped out of the totals; the report
        // window's own end keeps a live shift complete without drifting.
        return {
          start: shift.startTime,
          end: shift.endTime || new Date(Math.max(end.getTime(), Date.now())).toISOString(),
        };
      }
    }

    return { start: start.toISOString(), end: end.toISOString() };
  }, [selectedShiftId, employeeShifts, startDate, endDate, startTime, endTime]);

  const [salesData, setSalesData] = useState<SalesSummary>(emptySalesSummary);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [itemReportData, setItemReportData] = useState<ItemReportData>(emptyItemReportData);

  // Filter State - (Simplified version, complex filters removed as unused)

  useEffect(() => {
    if (!currentEstablishment?.id) {
      setEmployees([]);
      return;
    }

    fetchEmployees();
  }, [currentEstablishment?.id]);

  const fetchEmployees = async () => {
    try {
      if (!currentEstablishment?.id) {
        return;
      }

      const res = await api.get('/api/users');
      setEmployees((res.data || []).map((u: any) => ({ label: u.name || u.username, value: u.id })));
    } catch (error: any) {
      console.error('[Reports] Failed to load employees', error?.response?.status, error?.response?.data || error);
    }
  };

  useEffect(() => {
    const fetchEmployeeShifts = async () => {
      if (!currentEstablishment?.id || !selectedEmployeeId) {
        setEmployeeShifts([]);
        setSelectedShiftId(null);
        return;
      }
      try {
        // Whole local days on purpose: the picker must keep every shift in the
        // range selectable even when a time-of-day filter is narrower. Parse as
        // local (`T00:00`) — `new Date('yyyy-MM-dd')` is UTC midnight, which
        // shifts the day by one behind UTC.
        const res = await api.get('/reports/shifts', {
          params: {
            employeeId: selectedEmployeeId,
            startDate: startOfDay(new Date(`${startDate}T00:00`)).toISOString(),
            endDate: endOfDay(new Date(`${endDate}T00:00`)).toISOString(),
          }
        });
        const sortedShifts = (res.data || []).sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        setEmployeeShifts(sortedShifts.map((s: any) => ({
          label: `${format(new Date(s.startTime), 'MMM d, HH:mm', { locale: getDateLocale(t('common.locale')) })} - ${s.endTime ? format(new Date(s.endTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) }) : t('dashboard.shiftStatus.activeOnly')}`,
          value: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          totalSales: s.totalSales || 0,
          orderCount: s.orderCount || 0,
          totalDiscounts: s.totalDiscounts || 0,
          totalRefunds: s.totalRefunds || 0,
          variance: s.variance || s.discrepancy || 0,
        })) || []);
      } catch (error: any) {
        console.error('[Reports] Failed to load employee shifts', error?.response?.status, error?.response?.data || error);
      }
    };
    fetchEmployeeShifts();
  }, [currentEstablishment?.id, selectedEmployeeId, startDate, endDate]);

  const [isFetching, setIsFetching] = useState(false);
  const prevReportType = useRef<ReportType>(reportType);
  // Monotonic id so only the most recent request is allowed to write state.
  // Prevents out-of-order responses (from fast tab switching) overwriting the
  // currently selected report with stale data.
  const fetchSeq = useRef(0);

  useEffect(() => {
    if (!currentEstablishment?.id) {
      return;
    }

    // Any change to the report type / sub-tab / filters triggers a fresh fetch.
    // While that request is in flight the whole reports area is muted and
    // blocked (see `busy` overlay below), so a hard loading state on the major
    // report-type switch is enough to swap the view cleanly.
    const isMajorSwitch = prevReportType.current !== reportType;
    if (isMajorSwitch) {
      setIsLoading(true);
    }

    fetchReportData();
    prevReportType.current = reportType;
  }, [reportType, startDate, endDate, startTime, endTime, selectedEmployeeId, selectedShiftId, itemReportTab, currentEstablishment?.id]);

  const fetchReportData = async (silent = false) => {
    // Claim this request id. Any response from an older request is ignored.
    const seq = ++fetchSeq.current;
    const isStale = () => seq !== fetchSeq.current;

    try {
      if (!currentEstablishment?.id) {
        return;
      }

      if (!silent) {
        setIsFetching(true);
      }

      const commonParams: Record<string, string> = {
        startDate: effectiveDateRange.start,
        endDate: effectiveDateRange.end,
      };

      if (selectedEmployeeId) {
        commonParams.employeeId = selectedEmployeeId;
      }

      // Shift-based reports resolve the selection by id. Order-based reports
      // can't — orders carry no shift reference — so for those the shift stays
      // expressed as the date window in `effectiveDateRange`.
      const shiftScopedParams: Record<string, string> = selectedShiftId
        ? { ...commonParams, shiftId: selectedShiftId }
        : commonParams;

      switch (reportType) {
        case 'sales':
        case 'payments':
        case 'taxes': {
          const salesRes = await api.get('/reports/historical-summary', { params: { ...commonParams, timezone: browserTimeZone } });
          if (isStale()) return;
          setSalesData(normalizeSalesSummary(salesRes.data));
          break;
        }
        case 'discounts': {
          const discountRes = await api.get('/reports/discounts', { params: commonParams });
          if (isStale()) return;
          const rawReports = discountRes.data?.reports;
          const discountReports = Array.isArray(rawReports) ? rawReports.filter((r: any) => r) : [];

          setSalesData(normalizeSalesSummary({
            totalDiscounts: discountRes.data?.totalDiscountGiven || 0,
            totalDiscountCount: (Array.isArray(discountReports) ? discountReports : []).reduce((acc: number, curr: any) => acc + (curr.count || 0), 0),
            discountBreakdown: (Array.isArray(discountReports) ? discountReports : []).map((r: any) => ({
                name: r.name || 'Unknown',
                count: r.count || 0,
                value: r.totalAmount || 0
              }))
          }));
          break;
        }
        case 'top-items': {
          let endpoint = '/reports/item-report';
          if (itemReportTab === 'categories') {
            endpoint = '/reports/category-report';
          } else if (itemReportTab === 'modifiers') {
            endpoint = '/reports/modifier-report';
          } else if (itemReportTab === 'attributes') {
            endpoint = '/reports/attribute-report';
          }

          const itemRes = await api.get(endpoint, {
            params: commonParams,
          });
          if (isStale()) return;
          setItemReportData(normalizeItemReportData(itemRes.data));
          break;
        }
        case 'peak-hours': {
          const peakRes = await api.get('/reports/peak-hours', { params: { ...commonParams, timezone: browserTimeZone } });
          if (isStale()) return;
          setPeakHours(normalizePeakHours(peakRes.data));
          break;
        }
        case 'staff-sales': {
          const staffSalesRes = await api.get('/reports/shifts', { params: { ...shiftScopedParams, limit: 50 } });
          if (isStale()) return;
          setShifts(normalizeShifts(staffSalesRes.data));
          break;
        }
        case 'shifts': {
          const shiftsRes = await api.get('/reports/shifts', { params: { ...shiftScopedParams, limit: 100 } });
          if (isStale()) return;
          setShifts(normalizeShifts(shiftsRes.data));
          break;
        }
        case 'cash-discrepancy': {
          const shiftsRes = await api.get('/reports/shifts', { params: { ...shiftScopedParams, limit: 100 } });
          if (isStale()) return;
          setShifts(normalizeShifts(shiftsRes.data));
          break;
        }
      }
    } catch (error: any) {
      // A superseded request failing must not clobber the current view.
      if (isStale()) return;
      console.error('[Reports] Failed to load report data', {
        reportType,
        establishmentId: currentEstablishment?.id,
        status: error?.response?.status,
        data: error?.response?.data,
      });
      if (reportType === 'sales' || reportType === 'payments' || reportType === 'discounts' || reportType === 'taxes') {
        setSalesData(emptySalesSummary());
      }
      if (reportType === 'top-items') {
        setItemReportData(emptyItemReportData());
      }
      if (reportType === 'peak-hours') {
        setPeakHours([]);
      }
      if (reportType === 'staff-sales' || reportType === 'shifts' || reportType === 'cash-discrepancy') {
        setShifts([]);
      }
      toast.error(t('dashboard.messages.loadFailed'));
    } finally {
      // Only the latest request clears the loading/fetching flags, so the UI
      // stays muted until the response the user is actually waiting for lands.
      if (!isStale()) {
        setIsLoading(false);
        if (!silent) {
          setIsFetching(false);
        }
      }
    }
  };

  useEffect(() => {
    const reportEvents = new Set<string>([
      DataChangeEventTypes.ORDER_CREATED,
      DataChangeEventTypes.ORDER_UPDATED,
      DataChangeEventTypes.ORDER_REFUNDED,
      DataChangeEventTypes.ITEM_CREATED,
      DataChangeEventTypes.ITEM_UPDATED,
      DataChangeEventTypes.ITEM_DELETED,
      DataChangeEventTypes.ITEM_STOCK_CHANGED,
      DataChangeEventTypes.CATEGORY_CREATED,
      DataChangeEventTypes.CATEGORY_UPDATED,
      DataChangeEventTypes.CATEGORY_DELETED,
      DataChangeEventTypes.CUSTOMER_CREATED,
      DataChangeEventTypes.CUSTOMER_UPDATED,
      DataChangeEventTypes.CUSTOMER_DELETED,
      DataChangeEventTypes.STAFF_CREATED,
      DataChangeEventTypes.STAFF_UPDATED,
      DataChangeEventTypes.STAFF_DELETED,
      DataChangeEventTypes.SHIFT_STARTED,
      DataChangeEventTypes.SHIFT_ENDED,
      DataChangeEventTypes.SETTINGS_UPDATED,
    ]);

    const unsubscribe = onRefresh((eventType) => {
      if (!reportEvents.has(eventType)) {
        return;
      }

      if (
        eventType === DataChangeEventTypes.STAFF_CREATED ||
        eventType === DataChangeEventTypes.STAFF_UPDATED ||
        eventType === DataChangeEventTypes.STAFF_DELETED
      ) {
        fetchEmployees();
      }

      // Background refresh: update data without muting/blocking the UI.
      fetchReportData(true);
    });

    return unsubscribe;
  }, [
    onRefresh,
    currentEstablishment?.id,
    reportType,
    effectiveDateRange.start,
    effectiveDateRange.end,
    selectedEmployeeId,
    selectedShiftId,
    itemReportTab,
  ]);

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
    setSelectedShiftId(null);
    const { start, end } = calculateDateRange(range as DatePeriod);
    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
    setStartTime('00:00');
    setEndTime('23:59');
  };

  const localeTag = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
  const money = (n: number) => (Number(n) || 0).toLocaleString(localeTag, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num = (n: number) => (Number(n) || 0).toLocaleString(localeTag);

  // Human-readable title for the current report selection.
  const reportTitle = (): string => {
    switch (reportType) {
      case 'sales': return t('dashboard.menu.salesSummary');
      case 'top-items':
        if (itemReportTab === 'categories') return t('dashboard.menu.salesByItems');
        if (itemReportTab === 'modifiers' || itemReportTab === 'attributes') return t('dashboard.menu.salesByAddons');
        return t('dashboard.menu.salesByItems');
      case 'staff-sales': return t('dashboard.menu.salesByStaff');
      case 'shifts': return t('dashboard.menu.shiftsReports');
      case 'cash-discrepancy': return t('dashboard.menu.cashGapReports');
      case 'peak-hours': return t('orders.reports.peakHours.title', { defaultValue: 'Busy Times' });
      case 'payments': return t('dashboard.menu.paymentsReports');
      case 'discounts': return t('dashboard.menu.discountReports');
      case 'taxes': return t('reports.taxes', { defaultValue: 'Taxes Report' });
      default: return t('dashboard.menu.salesAndReporting');
    }
  };

  const buildMeta = (): ExportMeta => {
    const fmt = (iso: string) => {
      try { return new Date(iso).toLocaleString(localeTag); } catch { return iso; }
    };
    const meta: ExportMeta = [
      { label: t('orders.exportFields.date'), value: `${fmt(effectiveDateRange.start)} — ${fmt(effectiveDateRange.end)}` },
    ];
    if (currentEstablishment?.name) {
      meta.push({ label: t('common.location'), value: currentEstablishment.name });
    }
    if (selectedEmployeeId) {
      const emp = employees.find(e => e.value === selectedEmployeeId);
      if (emp) meta.push({ label: t('orders.table.staff'), value: emp.label });
    }
    return meta;
  };

  // Map the current shift list into export rows (shared by staff-sales / shifts / cash-discrepancy).
  const shiftRows = () => shifts.map(s => {
    const start = new Date(s.startTime);
    // Open shifts stop at the end of the reported window, exactly as the Staff
    // and Shifts tables do — otherwise an export of last week's report counts
    // every hour since for a drawer nobody ever closed.
    const openShiftCutoff = clampNowToRangeEnd(Date.now(), effectiveDateRange.end);
    const end = s.endTime ? new Date(s.endTime) : new Date(openShiftCutoff);
    const durationMs = getShiftDurationMs(s.startTime, s.endTime, openShiftCutoff) ?? 0;
    const hoursWorked = (durationMs / (1000 * 60 * 60)).toLocaleString(localeTag, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    // Decimal hours round a short shift down to "0.0"; ship the readable
    // h/m duration alongside it so exports match what the table shows.
    const duration = formatDurationMs(t, durationMs);
    const variance = s.discrepancy ?? s.variance ?? 0;
    // A drawer the POS closed by itself was balanced to the expected amount,
    // so its 0.00 is not a verified count. Never export it as one.
    const counted = !s.autoClose;
    const cashOverShort = !s.endTime
      ? t('dashboard.shiftStatus.live')
      : !counted
        ? t('orders.reports.cashGap.notVerified', { defaultValue: 'Unverified' })
        : (variance > 0.001 ? `+${money(variance)} ${t('dashboard.stats.over')}` : variance < -0.001 ? `${money(variance)} ${t('dashboard.stats.short')}` : money(0));
    return {
      username: s.user?.username || t('common.pos'),
      period: `${start.toLocaleString(localeTag)} - ${s.endTime ? end.toLocaleString(localeTag) : t('dashboard.shiftStatus.live')}`,
      hoursWorked,
      duration,
      opening: money(s.openingBalance),
      sales: money(s.totalSales),
      // `totalSales` is tendered (tax included); the API sends the tax that
      // sits inside it so the export can show the pre-tax figure too.
      tax: money(s.totalTax ?? 0),
      netSales: money(s.netSales ?? (Number(s.totalSales || 0) - Number(s.totalTax || 0))),
      orders: num(s.orderCount),
      refunds: money(s.totalRefunds),
      cashSales: money(Number(s.cashSales || 0)),
      expected: money(
        s.expectedBalance ??
        s.expectedCash ??
        (Number(s.openingBalance || 0) + Number(s.cashSales || 0) + Number(s.totalPayIn || 0) - Number(s.totalPayOut || 0)),
      ),
      closing: !counted
        ? t('orders.reports.cashGap.neverCounted', { defaultValue: 'Not counted' })
        : s.closingBalance !== null && s.closingBalance !== undefined
          ? money(s.closingBalance)
          : t('dashboard.shiftStatus.live'),
      payIn: money(Number(s.totalPayIn || 0)),
      payOut: money(Number(s.totalPayOut || 0)),
      salesPerHour: durationMs >= 5 * 60 * 1000
        ? money(Number(s.totalSales || 0) / (durationMs / 3_600_000))
        : '-',
      countType: !s.endTime
        ? t('dashboard.shiftStatus.live')
        : counted
          ? t('orders.reports.shifts.manualClose')
          : t('orders.reports.shifts.autoClosed'),
      closeReason: s.closeReason
        ? t(`orders.reports.cashGap.closeReasons.${s.closeReason}`, {
          defaultValue: String(s.closeReason).replace(/_/g, ' ').toLowerCase(),
        })
        : '',
      cashOverShort,
      status: s.status,
    };
  });

  // Shared column labels so every export names the same figure identically.
  const grossLabel = `${t('orders.reports.export.salesInclTax')} (${currencySymbol})`;
  const netLabel = `${t('orders.reports.export.salesExclTax')} (${currencySymbol})`;
  const taxLabel = `${t('orders.reports.sales.totalTax')} (${currencySymbol})`;
  const ordersLabel = t('orders.reports.sales.numOrders');

  /** A metric/value pair for the summary section that heads every export. */
  type SummaryRow = { metric: string; value: string };
  const summaryColumns: ExportColumn[] = [
    { key: 'metric', label: t('orders.reports.export.metric') },
    { key: 'value', label: t('orders.reports.export.value') },
  ];
  const metric = (label: string, value: string): SummaryRow => ({ metric: label, value });
  const moneyMetric = (label: string, value: number) => metric(`${label} (${currencySymbol})`, money(value));
  const percentMetric = (label: string, ratio: number) =>
    metric(label, `${(ratio * 100).toLocaleString(localeTag, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`);

  /**
   * The sales/payments/taxes tabs all read the same historical summary, so they
   * share one rich header block: gross, tax, net, profit, orders and cash
   * movements. Exports used to carry none of this.
   */
  const salesSummaryRows = (): SummaryRow[] => {
    const gross = salesData.totalRevenue ?? 0;
    const tax = salesData.taxCollected ?? 0;
    const serviceCharge = salesData.netServiceChargeCollected ?? salesData.serviceChargeCollected ?? 0;
    const exclTax = salesData.totalSalesExcludingTax ?? (gross - tax);
    const net = salesData.netSalesBeforeTaxAndServiceCharge ?? (gross - tax - serviceCharge);
    const orders = salesData.totalOrders ?? 0;
    const profit = salesData.grossProfit ?? 0;
    const avgOrder = salesData.averageOrderValue ?? (orders > 0 ? gross / orders : 0);

    const rows: SummaryRow[] = [
      moneyMetric(t('orders.reports.export.salesInclTax'), gross),
      moneyMetric(t('orders.reports.export.salesExclTax'), exclTax),
      moneyMetric(t('orders.reports.sales.totalTax'), tax),
      moneyMetric(t('orders.reports.sales.serviceCharge', { defaultValue: 'Service Charge' }), serviceCharge),
      moneyMetric(t('orders.reports.sales.netSales'), net),
      moneyMetric(t('orders.reports.sales.profit'), profit),
      metric(ordersLabel, num(orders)),
      moneyMetric(t('orders.reports.export.averageOrderValue'), avgOrder),
      moneyMetric(t('orders.reports.sales.refunds'), salesData.totalRefunds ?? 0),
    ];

    if (salesData.refundOrderCount !== undefined) {
      rows.push(metric(t('orders.reports.export.refundedOrders'), num(salesData.refundOrderCount)));
    }
    if (salesData.totalCost !== undefined) {
      rows.push(moneyMetric(t('orders.reports.export.cost'), salesData.totalCost));
    }
    // Margin is only meaningful against a non-zero net; a 0/0 "0.0%" reads as
    // a real loss-making figure rather than "nothing sold".
    if (net > 0) {
      rows.push(percentMetric(t('orders.reports.export.profitMargin'), profit / net));
    }
    rows.push(
      moneyMetric(t('orders.reports.sales.payIn'), salesData.totalPayIn ?? 0),
      moneyMetric(t('orders.reports.sales.payOut'), salesData.totalPayOut ?? 0),
      // Same duration shape as the screen it was exported from.
      metric(
          t('orders.reports.sales.hours'),
          formatDurationMs(t, hoursToMs(salesData.totalHoursWorked ?? 0)),
      ),
    );
    return rows;
  };

  /**
   * Header block for the shift-based reports. `predicate` narrows it to the
   * same rows the table shows (cash reconciliation only lists closed drawers).
   */
  const shiftsSummaryRows = (predicate: (shift: Shift) => boolean = () => true): SummaryRow[] => {
    const rows = shifts.filter(predicate);
    const gross = rows.reduce((sum, s) => sum + Number(s.totalSales || 0), 0);
    const tax = rows.reduce((sum, s) => sum + Number(s.totalTax || 0), 0);
    const orders = rows.reduce((sum, s) => sum + Number(s.orderCount || 0), 0);
    // Auto-closed drawers were balanced to the expected amount, so their 0.00
    // is not a verified count and must not dilute the over/short total.
    const counted = rows.filter(s => s.endTime && !s.autoClose);
    const variance = counted.reduce((sum, s) => sum + Number(s.discrepancy ?? s.variance ?? 0), 0);

    return [
      metric(t('orders.reports.export.shiftCount'), num(rows.length)),
      metric(t('orders.reports.export.staffCount'), num(new Set(rows.map(s => s.user?.username || '')).size)),
      metric(ordersLabel, num(orders)),
      moneyMetric(t('orders.reports.export.salesExclTax'), gross - tax),
      moneyMetric(t('orders.reports.sales.totalTax'), tax),
      moneyMetric(t('orders.reports.export.salesInclTax'), gross),
      moneyMetric(t('orders.reports.shifts.cashSales', { defaultValue: 'Cash Sales' }), rows.reduce((sum, s) => sum + Number(s.cashSales || 0), 0)),
      moneyMetric(t('orders.reports.sales.refunds'), rows.reduce((sum, s) => sum + Number(s.totalRefunds || 0), 0)),
      moneyMetric(t('orders.reports.sales.payIn'), rows.reduce((sum, s) => sum + Number(s.totalPayIn || 0), 0)),
      moneyMetric(t('orders.reports.sales.payOut'), rows.reduce((sum, s) => sum + Number(s.totalPayOut || 0), 0)),
      moneyMetric(`${t('orders.reports.shifts.variance')} (${t('orders.reports.cashGap.counted', { defaultValue: 'Counted' })})`, variance),
    ];
  };

  // Resolve the columns + rows (+ summary metrics) for the active report.
  const buildReport = (): {
    columns: ExportColumn[];
    rows: any[];
    summary?: SummaryRow[];
    sections?: ExportSection[];
  } => {
    switch (reportType) {
      case 'sales': {
        return {
          summary: salesSummaryRows(),
          columns: [
            {
              key: 'date',
              label:
                salesData.granularity === 'month'
                  ? t('orders.reports.export.month')
                  : t('orders.exportFields.date'),
            },
            { key: 'count', label: ordersLabel },
            { key: 'netRevenue', label: netLabel },
            { key: 'tax', label: taxLabel },
            { key: 'revenue', label: grossLabel },
          ],
          rows: (salesData?.dailyBreakdown || []).filter(bucketHasActivity).map(d => {
            const tax = d.tax ?? 0;
            return {
              // Long ranges come back rolled up per month (keyed by the 1st),
              // so print "Jul 2026" rather than a day that means nothing.
              date: formatBucketLabel(d.date, salesData.granularity, localeTag),
              count: num(d.count),
              netRevenue: money(d.netRevenue ?? (d.revenue - tax)),
              tax: money(tax),
              revenue: money(d.revenue),
            };
          }),
        };
      }
      case 'payments': {
        // Tax can't be split across payment methods (one taxed order can be
        // settled by several tenders), so the tax figures stay in the summary.
        return {
          summary: salesSummaryRows(),
          columns: [
            { key: 'name', label: t('orders.exportFields.paymentMethod') },
            { key: 'count', label: ordersLabel },
            { key: 'value', label: `${t('dashboard.stats.revenue')} (${currencySymbol})` },
          ],
          rows: (salesData?.paymentMethodBreakdown || []).map(p => ({
            name: p.name,
            count: num(p.count ?? 0),
            value: money(p.value),
          })),
        };
      }
      case 'taxes': {
        return {
          summary: salesSummaryRows(),
          columns: [
            { key: 'name', label: t('orders.reports.taxes.tax') },
            { key: 'rate', label: t('orders.reports.taxes.rate') },
            { key: 'taxable', label: `${t('orders.reports.taxes.taxable')} (${currencySymbol})` },
            { key: 'collected', label: `${t('orders.reports.taxes.totalTax')} (${currencySymbol})` },
            { key: 'transactions', label: t('orders.reports.taxes.txns') },
            { key: 'refunds', label: t('orders.reports.taxes.refunds', { defaultValue: 'Refunds' }) },
          ],
          rows: (salesData?.taxBreakdown || []).map(tx => ({
            name: tx.name || tx.taxName || t('orders.reports.taxes.tax'),
            rate: tx.rateLabel || `${num(tx.rate)}%`,
            taxable: money(tx.taxableAmount),
            collected: money(tx.collected ?? tx.taxAmount ?? 0),
            transactions: num(tx.transactions ?? tx.orderCount ?? 0),
            refunds: num(tx.refundCount ?? 0),
          })),
        };
      }
      case 'discounts': {
        const breakdown = salesData?.discountBreakdown || [];
        return {
          summary: [
            metric(t('orders.reports.export.discountCount'), num(breakdown.length)),
            metric(ordersLabel, num(breakdown.reduce((sum, d) => sum + (d.count || 0), 0))),
            moneyMetric(
              t('orders.reports.shifts.variance', { defaultValue: 'Amount' }),
              breakdown.reduce((sum, d) => sum + (d.value || 0), 0),
            ),
          ],
          columns: [
            { key: 'name', label: t('dashboard.menu.discountReports') },
            { key: 'count', label: ordersLabel },
            { key: 'value', label: `${t('orders.reports.shifts.variance', { defaultValue: 'Amount' })} (${currencySymbol})` },
          ],
          rows: breakdown.map(d => ({ name: d.name, count: num(d.count), value: money(d.value) })),
        };
      }
      case 'top-items': {
        const nameLabel = itemReportTab === 'categories'
          ? t('dashboard.menu.salesByItems')
          : itemReportTab === 'modifiers' || itemReportTab === 'attributes'
            ? t('dashboard.menu.salesByAddons')
            : t('orders.table.order');
        const breakdown = itemReportData?.breakdown || [];
        // `totalSales` on a line is already net of tax (tax is applied on top
        // of the line price), so the tax column comes from the line snapshots.
        const rows = breakdown.map(it => {
          const net = Number(it.totalSales ?? it.revenue ?? 0);
          const tax = Number(it.totalTax ?? 0);
          return {
            name: it.itemName || it.name || t('common.unknown'),
            quantity: num(it.quantity),
            totalSales: money(net),
            tax: money(tax),
            totalWithTax: money(it.totalSalesWithTax ?? (net + tax)),
            _net: net,
            _tax: tax,
            _quantity: Number(it.quantity) || 0,
          };
        });
        return {
          summary: [
            metric(t('orders.reports.export.itemCount'), num(rows.length)),
            metric(t('orders.reports.items.unitsSold'), num(rows.reduce((s, r) => s + r._quantity, 0))),
            moneyMetric(t('orders.reports.export.salesExclTax'), rows.reduce((s, r) => s + r._net, 0)),
            moneyMetric(t('orders.reports.sales.totalTax'), rows.reduce((s, r) => s + r._tax, 0)),
            moneyMetric(t('orders.reports.export.salesInclTax'), rows.reduce((s, r) => s + r._net + r._tax, 0)),
          ],
          columns: [
            { key: 'name', label: nameLabel },
            { key: 'quantity', label: t('orders.reports.items.unitsSold') },
            { key: 'totalSales', label: netLabel },
            { key: 'tax', label: taxLabel },
            { key: 'totalWithTax', label: grossLabel },
          ],
          rows,
        };
      }
      case 'peak-hours': {
        const hours = peakHours || [];
        const totalGross = hours.reduce((s, p) => s + (p.total || 0), 0);
        const totalTax = hours.reduce((s, p) => s + (p.tax || 0), 0);
        const busiest = hours.reduce<PeakHour | null>((best, p) => (!best || p.count > best.count ? p : best), null);
        return {
          summary: [
            metric(ordersLabel, num(hours.reduce((s, p) => s + (p.count || 0), 0))),
            moneyMetric(t('orders.reports.export.salesExclTax'), totalGross - totalTax),
            moneyMetric(t('orders.reports.sales.totalTax'), totalTax),
            moneyMetric(t('orders.reports.export.salesInclTax'), totalGross),
            metric(
              t('orders.reports.peakHours.busiestHour'),
              busiest && busiest.count > 0 ? `${busiest.hour} (${num(busiest.count)})` : '—',
            ),
          ],
          columns: [
            { key: 'hour', label: t('orders.reports.sales.hours') },
            { key: 'count', label: ordersLabel },
            { key: 'netTotal', label: netLabel },
            { key: 'tax', label: taxLabel },
            { key: 'total', label: grossLabel },
          ],
          rows: hours.filter(bucketHasActivity).map(p => {
            const tax = p.tax ?? 0;
            return {
              hour: p.hour,
              count: num(p.count),
              netTotal: money(p.netTotal ?? (p.total - tax)),
              tax: money(tax),
              total: money(p.total),
            };
          }),
        };
      }
      // Shifts export mirrors the on-screen report: work session + trading.
      // The drawer reconciliation columns belong to cash-discrepancy below.
      case 'staff-sales':
      case 'shifts': {
        return {
          summary: shiftsSummaryRows(),
          columns: [
            { key: 'username', label: t('orders.table.staff') },
            { key: 'period', label: t('orders.reports.shifts.time') },
            { key: 'hoursWorked', label: t('orders.reports.sales.hours') },
            { key: 'duration', label: t('orders.reports.shifts.duration', { defaultValue: 'Duration' }) },
            { key: 'orders', label: ordersLabel },
            { key: 'netSales', label: netLabel },
            { key: 'tax', label: taxLabel },
            { key: 'sales', label: grossLabel },
            { key: 'cashSales', label: `${t('orders.reports.shifts.cashSales', { defaultValue: 'Cash Sales' })} (${currencySymbol})` },
            { key: 'refunds', label: `${t('orders.reports.sales.refunds')} (${currencySymbol})` },
            { key: 'salesPerHour', label: `${t('orders.reports.shifts.salesPerHour', { defaultValue: 'Sales per Hour' })} (${currencySymbol})` },
            { key: 'countType', label: t('orders.reports.shifts.status') },
          ],
          rows: shiftRows(),
        };
      }
      case 'cash-discrepancy': {
        return {
          summary: shiftsSummaryRows(shift => shift.status === 'CLOSED'),
          columns: [
            { key: 'username', label: t('orders.table.staff') },
            { key: 'period', label: t('orders.reports.shifts.time') },
            { key: 'opening', label: `${t('orders.reports.shifts.opening')} (${currencySymbol})` },
            { key: 'cashSales', label: `${t('orders.reports.shifts.cashSales', { defaultValue: 'Cash Sales' })} (${currencySymbol})` },
            { key: 'payIn', label: `${t('orders.reports.sales.payIn')} (${currencySymbol})` },
            { key: 'payOut', label: `${t('orders.reports.sales.payOut')} (${currencySymbol})` },
            { key: 'expected', label: `${t('orders.reports.shifts.expectedCash', { defaultValue: 'Expected Cash' })} (${currencySymbol})` },
            { key: 'closing', label: `${t('orders.reports.cashGap.counted', { defaultValue: 'Counted' })} (${currencySymbol})` },
            { key: 'cashOverShort', label: t('orders.reports.shifts.variance') },
            { key: 'countType', label: t('orders.reports.cashGap.countType', { defaultValue: 'Count' }) },
            { key: 'closeReason', label: t('orders.reports.cashGap.closeReason', { defaultValue: 'Close Reason' }) },
          ],
          // Only closed shifts can be reconciled; an open drawer has no count.
          rows: shiftRows().filter(row => row.status === 'CLOSED'),
        };
      }
      default:
        return { columns: [], rows: [] };
    }
  };

  const handleExport = (format: ExportFormat) => {
    const { columns, rows, sections, summary } = buildReport();
    const title = reportTitle();
    const meta = buildMeta();
    const filename = `report_${reportType}${reportType === 'top-items' ? `_${itemReportTab}` : ''}`;

    if (!rows || rows.length === 0) {
      toast.error(t('dashboard.messages.noData', { defaultValue: 'No data to export' }));
      return;
    }

    if (sections && sections.length) {
      return exportSections(format, { filename, title, meta, sections });
    }

    // Every export leads with a summary block of the report's headline figures,
    // then the detail table.
    if (summary && summary.length) {
      return exportSections(format, {
        filename,
        title,
        meta,
        sections: [
          {
            name: t('dashboard.menu.salesSummary'),
            columns: summaryColumns,
            rows: summary,
          },
          { name: title, columns, rows },
        ],
      });
    }

    return exportTable(format, { filename, title, meta, columns, rows });
  };

  // Any in-flight (non-silent) request mutes and blocks the entire reports UI.
  const busy = isLoading || isFetching;

  return (
    <div className="relative space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'} aria-busy={busy}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('dashboard.menu.salesAndReporting')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('dashboard.trackingPerformance')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-sans border border-mintcom-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
        </div>

        <div className="flex items-center gap-3">
          {canExport && (
            <ExportMenu onExport={handleExport} />
          )}
        </div>
      </div>

      {/* Dynamic Filter Strip */}
      <div className="space-y-2">
        {/* Report Type Selector - Improved Pills */}
        <div ref={tabContainerRef} className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          {[
            { id: 'sales', label: t('dashboard.menu.salesSummary'), icon: TrendingUp },
            { id: 'items-categories', label: t('dashboard.menu.salesByItems'), icon: ShoppingBag },
            { id: 'addons', label: t('dashboard.menu.salesByAddons'), icon: PlusCircle },
            { id: 'staff-sales', label: t('dashboard.menu.salesByStaff'), icon: Users },
            { id: 'shifts', label: t('dashboard.menu.shiftsReports'), icon: Clock },
            { id: 'cash-discrepancy', label: t('dashboard.menu.cashGapReports'), icon: Scale },
            { id: 'peak-hours', label: t('orders.reports.peakHours.title', { defaultValue: 'Busy Times' }), icon: Clock },
            { id: 'payments', label: t('dashboard.menu.paymentsReports'), icon: CreditCard },
            { id: 'discounts', label: t('dashboard.menu.discountReports'), icon: Percent },
            { id: 'taxes', label: t('reports.taxes', { defaultValue: 'Taxes Report' }), icon: FileText },
          ].map((type) => {
            const isSelected = type.id === 'items-categories'
              ? (reportType === 'top-items' && (itemReportTab === 'items' || itemReportTab === 'categories'))
              : type.id === 'addons'
                ? (reportType === 'top-items' && (itemReportTab === 'modifiers' || itemReportTab === 'attributes'))
                : reportType === type.id;

            return (
              <button
                key={type.id}
                type="button"
                data-selected={isSelected}
                onMouseEnter={(e) => handlePillMouseEnter(e, type.id)}
                onMouseLeave={() => setHoveredReportId(null)}
                onClick={() => {
                  // Navigate to the appropriate route so sidebar stays in sync
                  if (type.id === 'items-categories') {
                    setItemReportTab('items');
                    navigate(`/dashboard/${locationSlug}/reports/items`);
                  } else if (type.id === 'addons') {
                    setItemReportTab('modifiers');
                    navigate(`/dashboard/${locationSlug}/reports/modifiers`);
                  } else {
                    navigate(`/dashboard/${locationSlug}/reports/${type.id}`);
                  }
                }}
                className={`relative shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl transition-all duration-150 text-xs sm:text-sm font-bold whitespace-nowrap border shadow-sm ${isSelected
                  ? 'bg-[#7dc6a2] text-black border-[#7dc6a2] shadow-mintcom-green/20'
                  : 'bg-white dark:bg-[#1E293B] text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 border-gray-200 dark:border-white/[0.08] hover:border-gray-300 dark:hover:border-white/20'
                  }`}
              >
                <type.icon size={15} className={`shrink-0 ${isSelected ? 'text-black' : 'text-gray-400 dark:text-gray-400'}`} />
                <span className="relative z-10">{type.label}</span>
              </button>
            );
          })}
        </div>

        {/* Portal for Pill Tooltips */}
        {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
            {hoveredReportId && (
              <div
                className="fixed z-[9999] pointer-events-none"
                style={{
                  top: tooltipCoords.top,
                  left: tooltipCoords.left,
                  transform: 'translate(-50%, -100%)'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-bold text-center rounded-lg shadow-2xl whitespace-nowrap relative"
                >
                  {[
                    { id: 'sales', label: t('dashboard.menu.salesSummary') },
                    { id: 'items-categories', label: t('dashboard.menu.salesByItems') },
                    { id: 'addons', label: t('dashboard.menu.salesByAddons') },
                    { id: 'staff-sales', label: t('dashboard.menu.salesByStaff') },
                    { id: 'shifts', label: t('dashboard.menu.shiftsReports') },
                    { id: 'cash-discrepancy', label: t('dashboard.menu.cashGapReports') },
                    { id: 'peak-hours', label: t('orders.reports.peakHours.title', { defaultValue: 'Busy Times' }) },
                    { id: 'payments', label: t('dashboard.menu.paymentsReports') },
                    { id: 'discounts', label: t('dashboard.menu.discountReports') },
                    { id: 'taxes', label: t('reports.taxes', { defaultValue: 'Taxes Report' }) },
                  ].find(r => r.id === hoveredReportId)?.label}
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900 dark:border-t-white"></div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
        {/* Unified Filter Dashboard */}

        {/* Unified Filter Control Deck */}
        <div className="bg-white dark:bg-[#1E293B] rounded-[20px] border border-gray-100 dark:border-white/[0.05] p-2">
          {/* Single Row Layout - wraps on smaller screens */}
          <div className="flex flex-wrap items-stretch gap-2">

            {/* Quick Period Dropdown */}
            <div className="w-full xs:w-auto xs:flex-1 sm:flex-none sm:w-[130px] md:w-[150px]">
              <SingleSelect
                value={selectedDateRange === 'custom' ? null : selectedDateRange}
                onChange={(val) => setQuickDate(val || 'today')}
                options={localizedDateOptions}
                showAllOption={false}
                searchable={false}
                placeholder={formatInputPlaceholder(t('owner.overview.selectPeriod'), t('common.locale'))}
                className="w-full h-full"
                buttonClassName={`!h-12 !rounded-xl !px-4 !text-xs sm:!text-sm !font-bold border transition-all ${selectedDateRange !== 'custom'
                  ? '!bg-mintcom-green/5 !border-mintcom-green !text-mintcom-green'
                  : '!bg-white dark:!bg-[#1E293B] !border-gray-200 dark:!border-white/10 hover:!bg-gray-50 dark:hover:!bg-white/10'
                  }`}
              />
            </div>

            {/* Date Range Picker */}
            <div className="flex-none min-w-[180px] sm:min-w-[220px] relative z-[60]">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onRangeChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                  setSelectedDateRange('custom');
                  setSelectedShiftId(null);
                }}
                onClear={() => setQuickDate('today')}
                isActive={selectedDateRange === 'custom'}
                align="left"
              />
            </div>

            {/* Time Range Group */}
            {(() => {
              const isTimeFiltered = startTime !== '00:00' || endTime !== '23:59';
              return (
                <div className={`flex-none w-auto min-w-[155px] sm:min-w-[180px] relative z-[55]`}>
                  <div className={`flex flex-col justify-center px-3 h-12 rounded-xl border transition-all shadow-sm ${isTimeFiltered
                    ? 'bg-mintcom-green/5 border-mintcom-green'
                    : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/10 hover:border-mintcom-green/50'
                    }`}>
                    <div className="flex items-center gap-2 justify-between relative">
                      <CustomTimePicker
                        value={startTime}
                        onChange={(val) => { setStartTime(val); setSelectedShiftId(null); }}
                        className="w-[85px] sm:w-[95px]"
                        showIcon={true}
                        isActive={isTimeFiltered}
                      />
                      <span className={`text-xs font-bold transition-colors flex-shrink-0 ${isTimeFiltered ? "text-[#7dc6a2]/50" : "text-gray-300 dark:text-white/10"}`}>-</span>
                      <CustomTimePicker
                        value={endTime}
                        onChange={(val) => { setEndTime(val); setSelectedShiftId(null); }}
                        className="w-[85px] sm:w-[95px]"
                        showIcon={true}
                        isActive={isTimeFiltered}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Vertical Divider (visible on larger screens) */}
            <div className="hidden xl:block w-px self-stretch bg-gray-100 dark:bg-white/10 my-1" />

            {/* Staff Dropdown */}
            <div className="flex-1 min-w-[120px] sm:min-w-[150px] relative z-50">
              <SingleSelect
                value={selectedEmployeeId}
                onChange={(val) => {
                  setSelectedEmployeeId(val);
                  setSelectedShiftId(null);
                }}
                options={employees}
                placeholder={formatInputPlaceholder(t('common.allStaff'), t('common.locale'))}
                className="w-full h-full"
                buttonClassName={`!h-12 !rounded-xl !px-4 !text-xs sm:!text-sm !font-bold border transition-all ${selectedEmployeeId
                  ? '!bg-mintcom-green/5 !border-mintcom-green !text-mintcom-green'
                  : '!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10'
                  }`}
              />
            </div>

            {/* Shift Dropdown */}
            <div className={`flex-1 min-w-[120px] sm:min-w-[150px] relative z-40 ${!selectedEmployeeId ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
              <SingleSelect
                value={selectedShiftId}
                onChange={setSelectedShiftId}
                options={employeeShifts}
                placeholder={formatInputPlaceholder(t('common.selectShift'), t('common.locale'))}
                searchable={false}
                className="w-full h-full"
                buttonClassName={`!h-12 !rounded-xl !px-4 !text-xs sm:!text-sm !font-bold border transition-all ${selectedShiftId
                  ? '!bg-mintcom-green/5 !border-mintcom-green !text-mintcom-green'
                  : '!bg-gray-50 dark:!bg-white/5 !border-transparent hover:!bg-gray-100 dark:hover:!bg-white/10'
                  }`}
              />
            </div>

          </div>
        </div>
      </div>

      {/* Content. The busy overlay (below) mutes/blocks this area while a
          request is in flight; on a major report-type switch we hide the old
          view to avoid showing the previous report's data under the overlay. */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <div className="py-32" aria-hidden="true" />
        ) : (
          <motion.div key={reportType} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

            {reportType === 'sales' && (
              <SalesView
                salesData={salesData}
                selectedDateRange={selectedDateRange}
                setShowPayInOutModal={setShowPayInOutModal}
              />
            )}

            {reportType === 'top-items' && (
              <ItemsView
                itemReportData={itemReportData}
                itemReportTab={itemReportTab}
                setItemReportTab={setItemReportTab}
                itemSearchQuery={itemSearchQuery}
                setItemSearchQuery={setItemSearchQuery}
                isFetching={isFetching}
                startDate={effectiveDateRange.start}
                endDate={effectiveDateRange.end}
                selectedEmployeeId={selectedEmployeeId}
              />
            )}

            {reportType === 'staff-sales' && (
              <StaffView
                shifts={shifts}
                selectedEmployeeId={selectedEmployeeId}
                employees={employees}
                rangeEnd={effectiveDateRange.end}
              />
            )}

            {reportType === 'shifts' && (
              <ShiftsView shifts={shifts} rangeEnd={effectiveDateRange.end} />
            )}

            {reportType === 'cash-discrepancy' && (
              <CashDiscrepancyView shifts={shifts} />
            )}

            {reportType === 'receipts' && (
              <ReceiptsReport
                startDate={effectiveDateRange.start}
                endDate={effectiveDateRange.end}
                employeeId={selectedEmployeeId}
              />
            )}

            {reportType === 'peak-hours' && (
              <PeakHoursView peakHours={peakHours} />
            )}

            {reportType === 'payments' && (
              <PaymentsView
                salesData={salesData}
                effectiveDateRange={effectiveDateRange}
                selectedDateRange={selectedDateRange}
              />
            )}

            {reportType === 'discounts' && (
              <DiscountsView salesData={salesData} isFetching={isFetching} />
            )}

            {reportType === 'taxes' && (
              <TaxesView salesData={salesData} />
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Global busy overlay: full-screen blocker while any non-silent report
          request is in flight — see BusyOverlay for the rationale. */}
      <BusyOverlay visible={busy} />

      <PayInPayOutLogModal
        isOpen={showPayInOutModal}
        onClose={() => setShowPayInOutModal(false)}
        startDate={effectiveDateRange.start}
        endDate={effectiveDateRange.end}
        employeeId={selectedEmployeeId}
      />
    </div>
  );
}

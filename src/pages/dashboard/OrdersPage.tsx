import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../utils/dateLocale';

import {
  ShoppingCart,
  Clock,
  ChevronRight,
  MoreVertical,
  PlayCircle,
  History,
  Eye,
  Undo2,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { biIcon } from '../../components/ui/BiIcon';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { OrderRefundModal } from '../../components/OrderRefundModal';
import { exportTable } from '../../utils/export';
import type { ExportFormat } from '../../utils/export';
import { ExportMenu } from '../../components/ExportMenu';
import { toast } from 'react-hot-toast';
import { DateRangePicker } from '../../components/DateRangePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { SearchInput, SelectInput, Pagination } from '../../components/ui';
import { StatValue } from '../../components/ui/StatValue';
import { SingleSelect } from '../../components/SingleSelect';
import { BusyOverlay } from '../../components/BusyOverlay';
import { checkPermission, usePermissionGuard } from '../../hooks/usePermissionGuard';
import { PortalDropdown } from '../../components/PortalDropdown';
import { formatInputPlaceholder } from '../../utils/textCase';
import { formatPaymentBrandName } from '../../utils/paymentCard';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface Order {
  id: string;
  orderNumber: number;
  invoiceNumber?: string | null;
  documentType?: 'INVOICE' | 'CREDIT_NOTE';
  total: number;
  subtotal: number;
  tax: number;
  serviceChargeAmount?: number;
  serviceChargeName?: string;
  serviceChargeNameSnapshot?: string;
  serviceChargeType?: 'PERCENTAGE' | 'FIXED';
  serviceChargeValue?: number;
  serviceChargeTaxable?: boolean;
  isServiceChargeChanged?: boolean;
  serviceChargeReason?: string;
  discount: number;
  paymentMethod: string;
  cardType?: string;
  otherPaymentMethod?: string;
  paymentStatus: string;
  orderType?: 'PAID' | 'PAID_TAX_CHANGED' | 'REFUNDED';
  isTaxChanged?: boolean;
  createdAt: string;
  items: OrderItem[];
  customer?: {
    name: string;
    phone: string;
  };
  user?: {
    username: string;
  };
  employeeName?: string;
  refundedByName?: string;
  refundReason?: string;
  note?: string;
  status: string;
  refundOrders?: Array<{ items?: OrderItem[] }>;
  tenders?: Array<{
    method: string;
    label: string;
    amount: number;
    tendered?: number;
    change?: number;
    isRefund?: boolean;
    cardType?: string;
    otherPaymentMethod?: string;
  }>;
  refundTenders?: Array<{
    method: string;
    label: string;
    amount: number;
    isRefund?: boolean;
    cardType?: string;
    otherPaymentMethod?: string;
  }>;
}

interface OrderItem {
  id: string;
  orderItemId?: string;
  itemId?: string;
  name: string;
  quantity: number;
  price: number;
  basePrice?: number;
  finalPrice?: number;
  total: number;
  refundedFromOrderItemId?: string | null;
  trackStock?: boolean;
  item?: { id?: string; trackStock?: boolean };
  chosenAttributes?: any[];
  selectedAttributes?: any[];
}

interface ShiftInfo {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    username: string;
  };
  startTime: string;
  endTime?: string;
}

interface ShiftStatus {
  shiftStatus: 'ACTIVE' | 'LAST_SHIFT' | 'NO_SHIFT';
  activeShift: ShiftInfo | null;
}

interface EmployeeOption {
  label: string;
  value: string;
}

interface EmployeeShiftOption {
  label: string;
  value: string;
  startTime: string;
  endTime: string | null;
}

// Orders per page — kept in sync with the backoffice Orders screen.
const PAGE_SIZE = 15;

import { formatPaymentBreakdown } from '../../utils/paymentBreakdownFormat';
import {
  formatInEstablishmentTimezone,
  useEstablishmentTimeZone,
} from '../../utils/establishmentTime';
export { formatPaymentBreakdown };

export function OrdersPage() {
  const { t } = useTranslation();
  usePermissionGuard();
  const { currencySymbol } = useCurrency();
  const { account, currentEstablishment } = useAuth();
  const useEstablishmentTimeZoneValue = useEstablishmentTimeZone();
  const location = useLocation();
  const canUsePosFeatures = useMemo(
    () => checkPermission(account, ['pos']),
    [account],
  );
  const canUseShiftFeatures = useMemo(
    () => checkPermission(account, ['dashboard', 'pos']),
    [account],
  );
  const canCancelReceipts = useMemo(
    () => checkPermission(account, ['cancel_receipts', 'refunds']),
    [account],
  );
  const canRestockRefundItems = useMemo(
    () => checkPermission(account, ['restock_items', 'manage_inventory']),
    [account],
  );
  const canExport = useMemo(
    () => checkPermission(account, ['export_data']),
    [account],
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [heldOrders, setHeldOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [, setOverallTotalCount] = useState(0);
  const [completedOrderCount, setCompletedOrderCount] = useState(0);
  const [completedOrderRevenue, setCompletedOrderRevenue] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedRefundOrder, setSelectedRefundOrder] = useState<Order | null>(null);
  const [orderDetailLoadingId, setOrderDetailLoadingId] = useState<string | null>(null);
  const [refundLoadingId, setRefundLoadingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    return location.state?.statusFilter || 'all';
  });
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [serviceChargeFilter, setServiceChargeFilter] = useState('all');
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeShifts, setEmployeeShifts] = useState<EmployeeShiftOption[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // Helper function to format payment method display
  const formatPaymentMethod = (order: Order): string => {
    if (order.tenders && order.tenders.length > 1) {
      return t('orders.payment.splitCount', {
        count: order.tenders.length,
        defaultValue: `Split (${order.tenders.length})`,
      });
    }
    if (order.paymentMethod === 'CARD' && order.cardType) {
      return t('orders.payment.cardWithBrand', { brand: formatPaymentBrandName(order.cardType) });
    }
    if (order.paymentMethod === 'OTHER' && order.otherPaymentMethod) {
      return formatPaymentBrandName(order.otherPaymentMethod);
    }
    if (order.paymentMethod === 'CASH') {
      return t('orders.payment.cash');
    }
    // Format enum values / brands nicely (Visa, Mastercard, …)
    return formatPaymentBrandName(order.paymentMethod);
  };

  const [startDate, setStartDate] = useState(() => {
    if (location.state?.startDate) {
      return new Date(location.state.startDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    if (location.state?.endDate) {
      return new Date(location.state.endDate).toISOString().split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });

  const [selectedDateRange, setSelectedDateRange] = useState<string>(() => {
    return location.state?.selectedDateRange || 'today';
  });
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning';
    confirmText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const ordersListRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);
  const actionMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const fetchRequestIdRef = useRef(0);
  const activeNonSilentRequestsRef = useRef(0);
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const HELD_ORDERS_PREVIEW_COUNT = 4;
  const selectedEmployeeName = useMemo(
    () => employees.find((employee) => employee.value === selectedEmployeeId)?.label || null,
    [employees, selectedEmployeeId],
  );
  const selectedEmployeeShift = useMemo(
    () => employeeShifts.find((shift) => shift.value === selectedShiftId) || null,
    [employeeShifts, selectedShiftId],
  );
  const hasOrderSearch = searchQuery.trim().length > 0;
  const hasOrderFilters =
    statusFilter !== 'all' ||
    paymentFilter !== 'all' ||
    serviceChargeFilter !== 'all' ||
    selectedDateRange !== 'all' ||
    Boolean(selectedEmployeeId) ||
    Boolean(selectedShiftId);
  // dateRangeBypassed comes from the server (single source of truth) —
  // never re-derive the receipt rule client-side (would drift from backend)
  const [dateRangeBypassed, setDateRangeBypassed] = useState(false);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = useMemo(() => {
    const nextOrders = [...orders];
    if (!sortConfig) return nextOrders;

    nextOrders.sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Order];
      let bValue: any = b[sortConfig.key as keyof Order];

      // Handle nested properties
      if (sortConfig.key === 'customer') {
        aValue = a.customer?.name || t('orders.table.walkIn');
        bValue = b.customer?.name || t('orders.table.walkIn');
      } else if (sortConfig.key === 'staff') {
        aValue = a.user?.username || '';
        bValue = b.user?.username || '';
      } else if (sortConfig.key === 'date') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else if (sortConfig.key === 'status') {
        aValue = a.paymentStatus || a.status || '';
        bValue = b.paymentStatus || b.status || '';
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return nextOrders;
  }, [orders, sortConfig, t]);

  // Shift status for shift-based filtering
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
  const [lastShiftSnapshot, setLastShiftSnapshot] = useState<{ startTime: string; timestamp: string } | null>(null);
  const [totalHeldCount, setTotalHeldCount] = useState(0);

  // Check shift status function (can be called manually)
  const checkShiftStatus = useCallback(async (showToast = false) => {
    if (!canUseShiftFeatures) {
      setShiftStatus(null);
      setLastShiftSnapshot(null);
      return;
    }

    try {
      // Fetch shift status
      const res = await api.get('/dashboard/live-shift');
      setShiftStatus(res.data);

      if (showToast) {
        if (res.data?.shiftStatus === 'ACTIVE') {
          const localeTag = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
          const time = res.data.activeShift?.startTime ? formatInEstablishmentTimezone(res.data.activeShift.startTime, localeTag, { hour: 'numeric', minute: '2-digit' }, currentEstablishment) : '';
          toast.success(t('orders.messages.shiftFound', { time: time ? ` (${time})` : '' }));
        } else {
          toast.error(t('orders.messages.noShiftFound'));
        }
      }

      // Always try to fetch last shift snapshot (for previous shift option)
      try {
        const snapshotRes = await api.get('/dashboard/last-shift-snapshot');
        if (snapshotRes.data) {
          setLastShiftSnapshot(snapshotRes.data);
        }
      } catch {
        // Ignore
      }
    } catch (err: any) {
      console.error('Failed to fetch shift status:', err);
      if (showToast) {
        const errorMessage = err.response?.data?.message || err.message || t('orders.messages.checkShiftFailed');
        toast.error(errorMessage);
      }
    }
  }, [canUseShiftFeatures, t, currentEstablishment?.timezone]);

  // Fetch shift status on mount or establishment change
  useEffect(() => {
    if (currentEstablishment?.id && canUseShiftFeatures) {
      checkShiftStatus(false);
    }
  }, [currentEstablishment?.id, canUseShiftFeatures, checkShiftStatus]);

  useEffect(() => {
    if (!currentEstablishment?.id) {
      setEmployees([]);
      setSelectedEmployeeId(null);
      setEmployeeShifts([]);
      setSelectedShiftId(null);
      return;
    }

    let cancelled = false;

    const fetchEmployees = async () => {
      try {
        const res = await api.get('/reports/employees');
        if (cancelled) return;

        const options = Array.isArray(res.data)
          ? res.data
            .map((employee: any) => ({
              label: String(employee?.name || employee?.username || '').trim(),
              value: String(employee?.id || ''),
            }))
            .filter((employee: EmployeeOption) => employee.label && employee.value)
          : [];

        setEmployees(options);
      } catch (err: any) {
        console.error('[Orders] Failed to load employees', err?.response?.status, err?.response?.data || err);
      }
    };

    fetchEmployees();

    return () => {
      cancelled = true;
    };
  }, [currentEstablishment?.id]);

  useEffect(() => {
    if (!currentEstablishment?.id || !selectedEmployeeId) {
      setEmployeeShifts([]);
      setSelectedShiftId(null);
      return;
    }

    let cancelled = false;

    const fetchEmployeeShifts = async () => {
      try {
        const res = await api.get('/reports/shifts', {
          params: {
            employeeId: selectedEmployeeId,
            startDate: startOfDay(new Date(startDate)).toISOString(),
            endDate: endOfDay(new Date(endDate)).toISOString(),
          },
        });

        if (cancelled) return;

        const shifts = Array.isArray(res.data) ? res.data : [];
        const sortedShifts = shifts
          .slice()
          .sort((a: any, b: any) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        setEmployeeShifts(sortedShifts.map((shift: any) => ({
          label: `${format(new Date(shift.startTime), 'MMM d, HH:mm', { locale: getDateLocale(t('common.locale')) })} - ${shift.endTime ? format(new Date(shift.endTime), 'HH:mm', { locale: getDateLocale(t('common.locale')) }) : t('dashboard.shiftStatus.activeOnly', { defaultValue: 'Active Shift' })}`,
          value: String(shift.id),
          startTime: shift.startTime,
          endTime: shift.endTime || null,
        })));
      } catch (err: any) {
        console.error('[Orders] Failed to load employee shifts', err?.response?.status, err?.response?.data || err);
        if (!cancelled) {
          setEmployeeShifts([]);
          setSelectedShiftId(null);
        }
      }
    };

    fetchEmployeeShifts();

    return () => {
      cancelled = true;
    };
  }, [currentEstablishment?.id, selectedEmployeeId, startDate, endDate, t]);

  // Normalize shift range for users without shift access
  useEffect(() => {
    if (
      !canUseShiftFeatures &&
      (selectedDateRange === 'current_shift' || selectedDateRange === 'previous_shift')
    ) {
      const { start, end } = calculateDateRange('today');
      setSelectedDateRange('today');
      setStartDate(formatDateForInput(start));
      setEndDate(formatDateForInput(end));
      setPage(1);
    }
  }, [canUseShiftFeatures, selectedDateRange]);

  // Use dynamic payment options to match real data
  const [paymentOptions, setPaymentOptions] = useState<{ label: string; value: string; group?: string }[]>([]);

  useEffect(() => {
    const fetchPaymentOptions = async () => {
      try {
        // Fetch available payment methods from orders
        const res = await api.get('/reports/available-payment-methods').catch(() => ({ data: null }));

        const options: { label: string; value: string; group?: string }[] = [];

        if (res.data) {
          const { paymentMethods, cardTypes, otherMethods } = res.data;

          // Add main payment methods
          if (paymentMethods.includes('CASH')) {
            options.push({ label: t('orders.payment.cash'), value: 'CASH', group: t('orders.payment.all') });
          }

          // Add card options
          if (paymentMethods.includes('CARD')) {
            // Add "All Cards" option first
            options.push({ label: t('orders.payment.allCards'), value: 'CARD', group: t('orders.payment.allCards') });

            // Add individual card types
            if (cardTypes && cardTypes.length > 0) {
              cardTypes.forEach((cardType: string) => {
                options.push({
                  label: formatPaymentBrandName(cardType),
                  value: `CARD_TYPE:${cardType}`,
                  group: t('orders.payment.allCards')
                });
              });
            }
          }

          // Add other payment methods
          if (paymentMethods.includes('OTHER') && otherMethods && otherMethods.length > 0) {
            // Add "All Other" option first
            options.push({ label: t('orders.payment.allOther'), value: 'OTHER', group: t('orders.payment.allOther') });

            otherMethods.forEach((method: string) => {
              options.push({
                label: formatPaymentBrandName(method),
                value: `OTHER_METHOD:${method}`,
                group: t('orders.payment.allOther')
              });
            });
          }

          // Add other main payment methods from enum
          const otherEnumMethods = ['TALABAT', 'CAREEM', 'APPLE_PAY', 'ZAIN_CASH'];
          otherEnumMethods.forEach(method => {
            if (paymentMethods.includes(method)) {
              const displayName = method.replace('_', ' ').split(' ')
                .map(w => w.charAt(0) + w.slice(1).toLowerCase())
                .join(' ');

              options.push({
                label: displayName,
                value: method,
                group: t('orders.payment.deliveryApps')
              });
            }
          });
        }

        // If no options from endpoint, fallback to defaults
        if (options.length === 0) {
          options.push(
            { label: t('orders.payment.cash'), value: 'CASH', group: t('owner.overview.total') },
            { label: t('orders.payment.allCards'), value: 'CARD', group: t('orders.payment.allCards') },
            { label: t('orders.payment.allOther'), value: 'OTHER', group: t('orders.payment.allOther') },
          );
        }

        setPaymentOptions(options);
      } catch (err) {
        console.error('Failed to fetch payment options', err);
        // Fallback options
        setPaymentOptions([
          { label: t('orders.payment.cash'), value: 'CASH', group: t('owner.overview.total') },
          { label: t('orders.payment.allCards'), value: 'CARD', group: t('orders.payment.allCards') },
          { label: t('orders.payment.allOther'), value: 'OTHER', group: t('orders.payment.allOther') },
        ]);
      }
    };

    fetchPaymentOptions();
  }, []);

  // Debounce free-text search to avoid firing a request on every keystroke.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

  // Sync date range when selectedDateRange changes (for non-custom, non-shift ranges)
  useEffect(() => {
    // Only sync for standard date ranges (not custom or shift-based)
    if (selectedDateRange &&
      selectedDateRange !== 'custom' &&
      selectedDateRange !== 'current_shift' &&
      selectedDateRange !== 'previous_shift' &&
      selectedDateRange !== 'all') {
      const { start, end } = calculateDateRange(selectedDateRange as DatePeriod);
      const newStartDate = formatDateForInput(start);
      const newEndDate = formatDateForInput(end);

      // Only update if dates actually changed to avoid infinite loops
      if (newStartDate !== startDate || newEndDate !== endDate) {
        setStartDate(newStartDate);
        setEndDate(newEndDate);
      }
    }
  }, [selectedDateRange, startDate, endDate]);

  const activeShiftStartTime =
    selectedDateRange === 'current_shift' ? shiftStatus?.activeShift?.startTime : null;
  const previousShiftStartTime =
    selectedDateRange === 'previous_shift' ? lastShiftSnapshot?.startTime : null;
  const previousShiftEndTime =
    selectedDateRange === 'previous_shift' ? lastShiftSnapshot?.timestamp : null;

  // Memoize fetchOrders to prevent stale closures. `silent` skips the blocking
  // loading state — used for realtime background refreshes so the busy overlay
  // doesn't flash on every incoming order event.
  const fetchOrders = useCallback(async (silent = false) => {
    const requestId = ++fetchRequestIdRef.current;
    if (!silent) {
      activeNonSilentRequestsRef.current += 1;
      setIsLoading(true);
    }

    try {
      const effectiveStatusFilter =
        !canUsePosFeatures && statusFilter === 'HELD' ? 'all' : statusFilter;

      // Handle shift-based date ranges
      let start: Date;
      let end: Date;

      if (selectedEmployeeShift) {
        start = new Date(selectedEmployeeShift.startTime);
        end = selectedEmployeeShift.endTime ? new Date(selectedEmployeeShift.endTime) : new Date();
      } else if (selectedDateRange === 'current_shift' && activeShiftStartTime) {
        // Current shift data
        start = new Date(activeShiftStartTime);
        end = new Date();
      } else if (selectedDateRange === 'previous_shift' && previousShiftStartTime && previousShiftEndTime) {
        // Previous shift data
        start = new Date(previousShiftStartTime);
        end = new Date(previousShiftEndTime);
      } else if (selectedDateRange === 'last_24_hours') {
        // Rolling last 24 hours
        end = new Date();
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
      } else if (selectedDateRange === 'all') {
        // All time - use a very early date
        start = new Date(0);
        end = new Date(8640000000000000); // Far future
      } else {
        // Regular date-based filtering
        start = startOfDay(new Date(startDate));
        end = endOfDay(new Date(endDate));
      }

      const needsOverallTotalsRequest =
        effectiveStatusFilter !== 'all' ||
        paymentFilter !== 'all' ||
        !!selectedEmployeeId ||
        !!debouncedSearchQuery;

      // 1. Held orders data (needed for KPI + held section)
      const heldPromise = api
        .get('/api/held-orders')
        .catch((e) => {
          console.error('Failed held orders', e);
          return { data: [] };
        });

      // 2. Overall Total (only needed when filtered/searching)
      const overallParams = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
        limit: 1,
        page: 1
      };
      const overallPromise = needsOverallTotalsRequest
        ? api
          .get('/reports/orders-history', { params: overallParams })
          .catch((e) => {
            console.error('Failed total count', e);
            return { data: { totalOrders: 0 } };
          })
        : Promise.resolve(null);

      // 2b. Fetch server-side summary for KPI (only completed/paid orders)
      const summaryPromise = api
        .get('/reports/historical-summary', {
          params: {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
            timezone: useEstablishmentTimeZoneValue,
            ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
          },
        })
        .catch((e) => {
          console.error('Failed summary for KPI', e);
          return { data: { totalRevenue: 0, taxCollected: 0, totalOrders: 0 } };
        });


      // 3. Main Data (Held or Regular)
      const mapHeldOrder = (h: Record<string, any>) => ({
        id: h.id,
        orderNumber: h.nickname,
        total: h.orderData?.total || 0,
        subtotal: h.orderData?.subtotal || 0,
        tax: h.orderData?.tax || 0,
        serviceChargeAmount: h.orderData?.serviceChargeAmount || 0,
        serviceChargeName: h.orderData?.serviceChargeName,
        serviceChargeType: h.orderData?.serviceChargeType,
        serviceChargeValue: h.orderData?.serviceChargeValue,
        serviceChargeTaxable: h.orderData?.serviceChargeTaxable,
        isServiceChargeChanged: h.orderData?.isServiceChargeChanged,
        serviceChargeReason: h.orderData?.serviceChargeReason,
        discount: h.orderData?.discount?.amount || 0,
        paymentMethod: t('common.none'),
        paymentStatus: 'HELD',
        status: 'HELD',
        createdAt: h.pinnedAt,
        items: (h.orderData?.items || []).map((item: Record<string, any>) => ({
          id: item.itemId,
          name: item.name,
          quantity: item.quantity,
          price: item.basePrice,
          total: item.finalPrice,
        })),
        user: {
          username: h.heldBy?.username || t('common.notAvailable'),
        },
        note: h.orderData?.note,
      });

      let mainPromise: Promise<any>;
      if (effectiveStatusFilter === 'HELD') {
        // If filtering by held, we don't need regular orders
        mainPromise = Promise.resolve(null);
      } else {
        // Calculate params for regular orders
        const params: Record<string, any> = {
          page: page,
          limit: PAGE_SIZE,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          ...(selectedEmployeeId ? { employeeId: selectedEmployeeId } : {}),
        };

        if (effectiveStatusFilter !== 'all') {
          params.status = effectiveStatusFilter;
        }

        if (paymentFilter !== 'all') {
          if (paymentFilter.startsWith('CARD_TYPE:')) {
            params.paymentMethod = 'CARD';
            params.cardType = paymentFilter.replace('CARD_TYPE:', '');
          } else if (paymentFilter.startsWith('OTHER_METHOD:')) {
            params.paymentMethod = 'OTHER';
            params.otherPaymentMethod = paymentFilter.replace('OTHER_METHOD:', '');
          } else {
            params.paymentMethod = paymentFilter;
          }
        }

        if (serviceChargeFilter !== 'all') {
          params.serviceCharge = serviceChargeFilter;
        }

        if (debouncedSearchQuery) {
          params.search = debouncedSearchQuery;
        }

        mainPromise = api.get('/reports/orders-history', { params });
      }

      // Execute all requests in parallel
      const [heldRes, overallRes, mainRes, summaryRes] = await Promise.all([heldPromise, overallPromise, mainPromise, summaryPromise]);

      // Ignore stale responses when a newer request is already in flight.
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }
      // Process Held Orders - always show ALL held orders regardless of filters
      let heldOrdersList: Order[] = [];
      let heldCount = 0;

      if (heldRes?.data && Array.isArray(heldRes.data)) {
        heldOrdersList = heldRes.data.map(mapHeldOrder);
        heldOrdersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        heldCount = heldOrdersList.length;
        setTotalHeldCount(heldCount);
        setHeldOrders(heldOrdersList);
      } else {
        setHeldOrders([]);
        setTotalHeldCount(0);
      }

      // Process Overall Total (for KPI)
      const fallbackMainTotal =
        (mainRes?.data?.totalOrders || mainRes?.data?.total || 0) ||
        (Array.isArray(mainRes?.data?.orders)
          ? mainRes.data.orders.length
          : Array.isArray(mainRes?.data)
            ? mainRes.data.length
            : 0);
      const regularTotalForPeriod = needsOverallTotalsRequest
        ? (overallRes?.data?.totalOrders || overallRes?.data?.total || 0)
        : fallbackMainTotal;
      setOverallTotalCount(Number(regularTotalForPeriod) + heldCount);

      // Process server-side summary for KPI revenue (only completed/paid orders)
      const kpiSummary = summaryRes?.data || {};
      const serverTotalRevenue = Number(kpiSummary.totalRevenue || 0);
      setCompletedOrderRevenue(serverTotalRevenue);
      setCompletedOrderCount(Number(kpiSummary.totalOrders || regularTotalForPeriod || 0));

      // Process Main Display Data
      if (effectiveStatusFilter === 'HELD') {
        // Show Held Orders
        const total = heldOrdersList.length;
        setTotalCount(total);
        setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);
        const startIndex = (page - 1) * PAGE_SIZE;
        setOrders((Array.isArray(heldOrdersList) ? heldOrdersList : []).slice(startIndex, startIndex + PAGE_SIZE));
      } else {
        // Show Regular Orders (possibly mixed with held if page 1)
        const responseData: {
          orders?: Order[];
          totalOrders?: number;
          total?: number;
          totalPages?: number;
          dateRangeBypassed?: boolean;
        } = mainRes?.data || {};
        const fetchedOrders = Array.isArray(responseData.orders) ? responseData.orders : (Array.isArray(responseData) ? responseData : []);
        const totalOrders = responseData.totalOrders || responseData.total || fetchedOrders.length;
        const serverTotalPages = responseData.totalPages || Math.ceil(totalOrders / PAGE_SIZE) || 1;
        // Server flag: receipt-ID search bypassed the date range (single source of truth)
        setDateRangeBypassed(Boolean(responseData.dateRangeBypassed));

        // Held orders are always shown in their own dedicated section above,
        // so we no longer mix them into the main orders table.

        if (Array.isArray(mainRes?.data)) {
          // Fallback for array response
          const total = fetchedOrders.length;
          setTotalCount(total);
          setTotalPages(Math.ceil(total / PAGE_SIZE) || 1);
          const startIndex = (page - 1) * PAGE_SIZE;
          setOrders(fetchedOrders.slice(startIndex, startIndex + PAGE_SIZE));
        } else {
          setTotalCount(totalOrders);
          setTotalPages(serverTotalPages);
          setOrders(fetchedOrders);
        }
      }

      setError('');
    } catch (err) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }
      console.error('Orders fetch error:', err);
      setError((err as ApiError).response?.data?.message || t('orders.messages.loadFailed'));
    } finally {
      if (!silent) {
        activeNonSilentRequestsRef.current = Math.max(0, activeNonSilentRequestsRef.current - 1);
      }
      if (activeNonSilentRequestsRef.current === 0 || requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    page,
    statusFilter,
    paymentFilter,
    serviceChargeFilter,
    startDate,
    endDate,
    selectedDateRange,
    debouncedSearchQuery,
    canUsePosFeatures,
    activeShiftStartTime,
    previousShiftStartTime,
    previousShiftEndTime,
    selectedEmployeeId,
    selectedEmployeeShift,
    t,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-scroll to the top of the list when filters change or the page changes,
  // so each new page starts from the top (matches the backoffice behavior).
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (ordersListRef.current) {
      ordersListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [statusFilter, paymentFilter, page]);

  useEffect(() => {
    if (activeActionMenu) {
      setTimeout(() => {
        const row = document.querySelector(`[data-order-id="${activeActionMenu}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 50);
    }
  }, [activeActionMenu]);

  // Close action menu when clicking outside or scrolling
  useEffect(() => {
    if (!activeActionMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-action-menu]')) {
        setActiveActionMenu(null);
      }
    };

    const handleScroll = () => {
      setActiveActionMenu(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeActionMenu]);



  // Real-time updates authenticate with the HttpOnly session cookie.
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });
  const scheduleOrdersRefresh = useCallback((delayMs = 120) => {
    if (realtimeRefreshTimeoutRef.current) {
      window.clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
      // Background refresh: don't block the UI for realtime events.
      fetchOrders(true);
    }, delayMs);
  }, [fetchOrders]);

  useEffect(() => {
    return () => {
      if (realtimeRefreshTimeoutRef.current) {
        window.clearTimeout(realtimeRefreshTimeoutRef.current);
        realtimeRefreshTimeoutRef.current = null;
      }
    };
  }, []);

  // Listen for real-time order events
  useEffect(() => {
    const unsubscribe = onRefresh((eventType) => {
      if (eventType === DataChangeEventTypes.ORDER_CREATED ||
        eventType === DataChangeEventTypes.ORDER_REFUNDED ||
        eventType === DataChangeEventTypes.ORDER_UPDATED) {
        // Coalesce bursts of events into one refresh.
        scheduleOrdersRefresh(80);
      }

      // Refresh when held order events occur
      if (eventType === DataChangeEventTypes.HELD_ORDER_CREATED ||
        eventType === DataChangeEventTypes.HELD_ORDER_DELETED) {
        // Refresh if the current view can show held orders.
        if (statusFilter === 'HELD' || statusFilter === 'all') {
          scheduleOrdersRefresh(80);
        }
      }

      // Refresh shift status when shift events occur
      if (eventType === DataChangeEventTypes.SHIFT_STARTED ||
        eventType === DataChangeEventTypes.SHIFT_ENDED) {
        checkShiftStatus(false);
      }
    });

    return unsubscribe;
  }, [onRefresh, statusFilter, scheduleOrdersRefresh, checkShiftStatus]);

  const searchOrder = useCallback(() => {
    setDebouncedSearchQuery(searchQuery.trim());
    setPage(1);
  }, [searchQuery]);



  const formatDate = (dateString: string) => {
    const localeTag = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
    return formatInEstablishmentTimezone(dateString, localeTag, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }, currentEstablishment);
  };

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
    setSelectedShiftId(null);
    setPage(1);

    // For shift-based ranges, don't update the date inputs
    if (range === 'current_shift' || range === 'previous_shift') {
      if (range === 'current_shift' && shiftStatus?.activeShift) {
        setStartDate(formatDateForInput(new Date(shiftStatus.activeShift.startTime)));
        setEndDate(formatDateForInput(new Date()));
      } else if (range === 'previous_shift' && lastShiftSnapshot) {
        setStartDate(formatDateForInput(new Date(lastShiftSnapshot.startTime)));
        setEndDate(formatDateForInput(new Date(lastShiftSnapshot.timestamp)));
      }
      return;
    }

    const { start, end } = calculateDateRange(range as DatePeriod);
    setStartDate(formatDateForInput(start));
    setEndDate(formatDateForInput(end));
  };

  // Build dynamic date range options based on shift status
  const getDateRangeOptions = () => {
    const options: { label: string; value: string; icon?: React.ReactNode; subtitle?: string }[] = [];

    // Add all standard date period options
    options.push({
      label: t('dashboard.viewMode.last24Hours'),
      value: 'last_24_hours'
    });

    options.push(...DATE_PERIOD_OPTIONS.map(opt => ({
      ...opt,
      label: t(`common.datePeriods.${opt.value}`)
    })));

    // Add All Time option
    options.push({ label: t('common.datePeriods.all'), value: 'all' });

    return options;
  };

  const loadOrderDetails = useCallback(async (order: Order): Promise<Order> => {
    if (order.paymentStatus === 'HELD' || order.status === 'HELD') {
      return order;
    }

    try {
      const response = await api.get(`/reports/orders/${order.id}`);
      const detail = response.data || {};
      return {
        ...order,
        ...detail,
        paymentStatus: detail.paymentStatus || detail.status || order.paymentStatus,
        items: Array.isArray(detail.items) ? detail.items : order.items,
        refundOrders: Array.isArray(detail.refundOrders) ? detail.refundOrders : order.refundOrders,
      };
    } catch (err) {
      console.warn('Failed to load order details before opening refund modal:', err);
      return order;
    }
  }, []);

  const openOrderDetails = useCallback(async (order: Order) => {
    setActiveActionMenu(null);
    setOrderDetailLoadingId(order.id);

    try {
      const detailedOrder = await loadOrderDetails(order);
      setSelectedOrder(detailedOrder);
    } finally {
      setOrderDetailLoadingId(current => (current === order.id ? null : current));
    }
  }, [loadOrderDetails]);

  const handleRefund = useCallback(async (order: Order) => {
    if (!canCancelReceipts) {
      toast.error(t('orders.messages.noRefundPermission'));
      return;
    }

    setActiveActionMenu(null);
    setRefundLoadingId(order.id);

    try {
      const detailedOrder = await loadOrderDetails(order);
      setSelectedRefundOrder(detailedOrder);
    } finally {
      setRefundLoadingId(current => (current === order.id ? null : current));
    }
  }, [canCancelReceipts, loadOrderDetails, t]);

  const handleRefundSuccess = useCallback(async (_updatedOrder?: any) => {
    // Silently refresh the orders table so BusyOverlay doesn't block the user
    void fetchOrders(true);

    // If order detail modal is currently open, refresh its data too
    if (selectedOrder) {
      try {
        const refreshed = await loadOrderDetails(selectedOrder);
        setSelectedOrder(refreshed);
      } catch (err) {
        console.warn('Failed to refresh order details after refund:', err);
      }
    }
  }, [fetchOrders, selectedOrder, loadOrderDetails]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20';
      case 'PENDING':
      case 'HELD':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const isRefundableOrder = (order: Order): boolean =>
    order.paymentStatus === 'COMPLETED' ||
    order.status === 'COMPLETED' ||
    order.status === 'PARTIALLY_REFUNDED';

  const isPaidTaxChanged = (order: Order): boolean =>
    (order.orderType === 'PAID_TAX_CHANGED' || !!order.isTaxChanged) &&
    (order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED');

  const getOrderStatusLabel = (order: Order): string => {
    if (isPaidTaxChanged(order)) {
      return t('orders.status.paidTaxChanged');
    }
    const rawStatus = (order.paymentStatus || order.status || 'PENDING').toLowerCase();
    const statusKey = rawStatus === 'pending' || rawStatus === 'held' ? 'onHold' : rawStatus;
    return t(`orders.status.${statusKey}` as any);
  };

  const handleExport = (format: ExportFormat) => {
    const exportData = orders.map(o => ({
      invoiceNumber: (o as any).invoiceNumber ?? o.orderNumber,
      orderNumber: o.orderNumber,
      date: formatDate(o.createdAt),
      customer: o.customer?.name || t('orders.table.walkIn'),
      total: o.total,
      serviceChargeAmount: o.serviceChargeAmount || 0,
      status: o.paymentStatus || o.status,
      paymentMethod: o.paymentMethod,
      paymentBreakdown: formatPaymentBreakdown(o),
    }));

    if (exportData.length === 0) {
      toast.error(t('dashboard.messages.noData', { defaultValue: 'No data to export' }));
      return;
    }

    return exportTable(format, {
      filename: 'orders_history',
      title: t('orders.title'),
      meta: currentEstablishment?.name ? [{ label: t('common.location'), value: currentEstablishment.name }] : undefined,
      columns: [
        { key: 'invoiceNumber', label: t('orders.exportFields.invoiceNumber', { defaultValue: 'Invoice' }) },
        { key: 'orderNumber', label: t('orders.exportFields.orderNumber') },
        { key: 'date', label: t('orders.exportFields.date') },
        { key: 'customer', label: t('orders.exportFields.customer') },
        { key: 'total', label: t('orders.exportFields.total', { currency: currencySymbol }) },
        { key: 'serviceChargeAmount', label: t('orders.exportFields.serviceCharge', { defaultValue: 'Service Charge' }) },
        { key: 'status', label: t('orders.exportFields.status') },
        { key: 'paymentMethod', label: t('orders.exportFields.paymentMethod') },
        { key: 'paymentBreakdown', label: t('orders.exportFields.paymentBreakdown', { defaultValue: 'Payment Breakdown' }) },
      ],
      rows: exportData,
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-24 sm:pb-10">
      {/* Full-screen blocker while a user-triggered load (filters, search,
          pagination, date range) is in flight — realtime refreshes stay silent. */}
      <BusyOverlay visible={isLoading} />
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('orders.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            <span>{t('orders.subtitle')}</span>
            {currentEstablishment?.name && (
              <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-sans border border-mintcom-green/20">
                {currentEstablishment.name}
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shift Selector */}
          {canUseShiftFeatures && (shiftStatus?.shiftStatus === 'ACTIVE' || lastShiftSnapshot) && (
            <div className="w-[200px]">
              <SingleSelect
                value={['current_shift', 'previous_shift'].includes(selectedDateRange) ? selectedDateRange : null}
                onChange={(val) => {
                  if (val) {
                    setQuickDate(val);
                  } else {
                    setQuickDate('today');
                  }
                }}
                options={[
                  ...(shiftStatus?.shiftStatus === 'ACTIVE' ? [{
                    label: t('dashboard.viewMode.currentShift'),
                    value: 'current_shift',
                    icon: <PlayCircle size={18} className="text-mintcom-green" />,
                    subtitle: shiftStatus?.activeShift?.startTime ? t('dashboard.shiftStatus.started', { time: format(new Date(shiftStatus.activeShift.startTime), 'h:mm a') }) : t('dashboard.shiftStatus.live')
                  }] : []),
                  ...(lastShiftSnapshot ? [{
                    label: t('dashboard.viewMode.previousShift'),
                    value: 'previous_shift',
                    icon: <History size={18} />,
                    subtitle: t('dashboard.shiftStatus.lastCompleted')
                  }] : [])
                ]}
                placeholder={formatInputPlaceholder(t('orders.checkShift'), t('common.locale'))}
                showAllOption={false}
                searchable={false}
                buttonClassName="!bg-white dark:!bg-white/5 !text-gray-900 dark:!text-white !border-gray-200 dark:!border-white/10 hover:!bg-gray-50 dark:hover:!bg-white/10 !h-auto !py-2.5 sm:!py-3 !rounded-xl"
              />
            </div>
          )}

          {canExport && (
            <ExportMenu onExport={handleExport} />
          )}
        </div>
      </div>

      {/* Unified Filter Control Deck */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-[24px] border border-gray-200 dark:border-white/5 p-2 shadow-sm">
        {/* Even responsive grid so controls align in tidy rows/columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 items-stretch [&>*]:min-w-0">

          {/* Search Bar - full width on mobile */}
          <div className="col-span-2 sm:col-span-1">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => { setSearchQuery(''); setDebouncedSearchQuery(''); setPage(1); }}
              onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
              placeholder={formatInputPlaceholder(t('orders.searchPlaceholder', { defaultValue: 'Search by receipt INV-… / order # / customer…' }), t('common.locale'))}
              className="w-full h-full"
            />
          </div>

          {/* Quick Date Select */}
          <div className="relative z-[70]">
            <SelectInput
              value={selectedDateRange === 'custom' ? null : selectedDateRange}
              onChange={(val) => setQuickDate(val || 'today')}
              options={getDateRangeOptions()}
              showAllOption={false}
              searchable={false}
              placeholder={formatInputPlaceholder(t('orders.period') || 'Period', t('common.locale'))}
              className="w-full h-full"
            />
          </div>

          {/* Date Range Group - hidden on mobile, show on desktop */}
          <div className="hidden sm:block relative z-[60]">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setSelectedDateRange('custom');
                setSelectedShiftId(null);
                setPage(1);
              }}
              onClear={() => setQuickDate('today')}
              isActive={selectedDateRange === 'custom'}
              align="center"
            />
          </div>

          {/* Status Select */}
          <div className="relative z-[50]">
            <SelectInput
              value={statusFilter === 'all' ? null : statusFilter}
              onChange={(val) => {
                setStatusFilter(val || 'all');
                setPage(1);
                if (val === 'HELD') {
                  setPaymentFilter('all');
                  setServiceChargeFilter('all');
                }
              }}
              options={[
                { label: t('orders.status.completed'), value: 'COMPLETED' },
                { label: t('orders.status.paidTaxChanged'), value: 'PAID_TAX_CHANGED' },
                { label: t('orders.status.onHold'), value: 'HELD' },
                { label: t('orders.status.refunded'), value: 'REFUNDED' },
              ]}
              showAllOption={true}
              allOptionLabel={t('orders.status.all')}
              searchable={false}
              placeholder={formatInputPlaceholder(t('orders.table.status') || 'Status', t('common.locale'))}
              className="w-full h-full"
            />
          </div>

          {/* Payment Method Select */}
          <div className="relative z-[40]">
            <SelectInput
              value={paymentFilter === 'all' ? null : paymentFilter}
              onChange={(val) => { setPaymentFilter(val || 'all'); setPage(1); }}
              disabled={statusFilter === 'HELD'}
              placeholder={formatInputPlaceholder(t('orders.table.payment') || 'Payment', t('common.locale'))}
              options={paymentOptions}
              showAllOption={true}
              allOptionLabel={t('orders.payment.all')}
              searchable={false}
              className="w-full h-full"
            />
          </div>

          <div className="relative z-[30]">
            <SelectInput
              value={serviceChargeFilter === 'all' ? null : serviceChargeFilter}
              onChange={(val) => { setServiceChargeFilter(val || 'all'); setPage(1); }}
              disabled={statusFilter === 'HELD'}
              placeholder={formatInputPlaceholder(t('orders.filters.serviceCharge', { defaultValue: 'Service Charge' }), t('common.locale'))}
              options={[
                { label: t('orders.filters.serviceChargeApplied', { defaultValue: 'Applied' }), value: 'applied' },
                { label: t('orders.filters.serviceChargeNotApplied', { defaultValue: 'Not applied' }), value: 'not_applied' },
                { label: t('orders.filters.serviceChargeChanged', { defaultValue: 'Changed/removed' }), value: 'changed' },
              ]}
              showAllOption={true}
              allOptionLabel={t('orders.filters.serviceChargeAll', { defaultValue: 'All orders' })}
              searchable={false}
              className="w-full h-full"
            />
          </div>

          <div className="relative z-[20]">
            <SingleSelect
              value={selectedEmployeeId}
              onChange={(val) => {
                setSelectedEmployeeId(val);
                setSelectedShiftId(null);
                setPage(1);
              }}
              options={employees}
              placeholder={formatInputPlaceholder(t('common.allStaff', { defaultValue: 'All Staff' }), t('common.locale'))}
              allOptionLabel={t('common.allStaff', { defaultValue: 'All Staff' })}
              showAllOption={true}
              className="w-full h-full"
              buttonClassName={`!h-full !min-h-[48px] !rounded-xl !px-4 !text-xs sm:!text-sm !font-bold border transition-all ${selectedEmployeeId
                ? '!bg-mintcom-green/5 !border-mintcom-green !text-mintcom-green'
                : '!bg-white dark:!bg-[#1E293B] !border-gray-200 dark:!border-white/10 hover:!bg-gray-50 dark:hover:!bg-white/10'
                }`}
            />
          </div>

          <div className={`relative z-[10] ${!selectedEmployeeId ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
            <SingleSelect
              value={selectedShiftId}
              onChange={(val) => {
                setSelectedShiftId(val);
                setPage(1);
              }}
              options={employeeShifts}
              placeholder={formatInputPlaceholder(t('common.selectShift', { defaultValue: 'Select Shift' }), t('common.locale'))}
              allOptionLabel={t('common.allShifts', { defaultValue: 'All Shifts' })}
              showAllOption={true}
              disabled={!selectedEmployeeId}
              searchable={false}
              className="w-full h-full"
              buttonClassName={`!h-full !min-h-[48px] !rounded-xl !px-4 !text-xs sm:!text-sm !font-bold border transition-all ${selectedShiftId
                ? '!bg-mintcom-green/5 !border-mintcom-green !text-mintcom-green'
                : '!bg-white dark:!bg-[#1E293B] !border-gray-200 dark:!border-white/10 hover:!bg-gray-50 dark:hover:!bg-white/10'
                }`}
            />
          </div>

        </div>
      </div>

      {/* Shift Info Bar - shows when viewing shift data */}
      {(selectedDateRange === 'current_shift' || selectedDateRange === 'previous_shift') && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-mintcom-green">
              {selectedDateRange === 'current_shift' ? <PlayCircle size={16} /> : <History size={16} />}
            </span>
            <div>
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                {selectedDateRange === 'current_shift' && shiftStatus?.activeShift && (
                  <>{t('dashboard.viewMode.showingSince', { date: format(new Date(shiftStatus.activeShift.startTime), 'MMM d, h:mm a') })}</>
                )}
                {selectedDateRange === 'previous_shift' && lastShiftSnapshot && (
                  <>{t('dashboard.viewMode.showingLastShift')}</>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {(selectedEmployeeName || selectedEmployeeShift) && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-mintcom-green/5 dark:bg-mintcom-green/10 border border-mintcom-green/15">
          <span className="text-xs font-black tracking-widest uppercase text-mintcom-green">
            {t('common.activeFilters', { defaultValue: 'Active filters' })}
          </span>
          {selectedEmployeeName && (
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-mintcom-green/15 text-xs font-bold text-gray-700 dark:text-gray-200">
              {t('common.staff', { defaultValue: 'Staff' })}: {selectedEmployeeName}
            </span>
          )}
          {selectedEmployeeShift && (
            <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-mintcom-green/15 text-xs font-bold text-gray-700 dark:text-gray-200">
              {t('common.shift', { defaultValue: 'Shift' })}: {selectedEmployeeShift.label}
            </span>
          )}
        </div>
      )}

      {dateRangeBypassed && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/15">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {t('orders.receiptOutsidePeriod', {
              defaultValue: 'Receipt search ignores the selected period — result may be from outside it.',
            })}
          </span>
        </div>
      )}

      <div className="flex overflow-x-auto scrollbar-none gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible pb-2 sm:pb-0">
        {[
          {
            label: t('orders.kpi.totalAmount'),
            value: completedOrderRevenue,
            isCurrency: true,
            sub: t('dashboard.stats.completedOrders', { defaultValue: 'Completed orders' }),
            icon: biIcon('bi-wallet2'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: undefined,
            active: false
          },
          {
            label: t('orders.kpi.totalOrders'),
            value: completedOrderCount,
            isCurrency: false,
            sub: t('dashboard.stats.completedOrders', { defaultValue: 'Completed orders' }),
            icon: biIcon('bi-receipt-cutoff'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: () => { setStatusFilter('all'); setPage(1); },
            active: statusFilter === 'all'
          },
          {
            label: t('orders.kpi.onHold'),
            value: totalHeldCount,
            isCurrency: false,
            icon: biIcon('bi-pause-circle'),
            color: 'text-mintcom-green',
            bg: 'bg-mintcom-green/10',
            onClick: () => { setStatusFilter('HELD'); setPaymentFilter('all'); setPage(1); },
            active: statusFilter === 'HELD'
          },
        ].map((stat, i) => (
          <div
            key={i}
            onClick={stat.onClick}
            className={`group relative p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#1E293B] border transition-all duration-300 overflow-hidden min-w-[140px] sm:min-w-0 flex-shrink-0 sm:flex-shrink
              ${stat.onClick ? 'cursor-pointer' : 'cursor-default'}
              ${stat.active
                ? 'border-mintcom-green ring-1 ring-mintcom-green/30 bg-mintcom-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-mintcom-green/30'}`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg} ${stat.active ? 'opacity-20' : 'group-hover:opacity-10'}`} />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="dashboard-stat-title mb-1 truncate">{stat.label}</p>
                <StatValue
                  value={stat.value}
                  currency={stat.isCurrency ? currencySymbol : null}
                  isInteger={!stat.isCurrency}
                  className="text-2xl"
                />
                {stat.sub && (
                  <p className="sentence-case-text text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 truncate">{stat.sub}</p>
                )}
              </div>
            </div>

            {/* Active Indicator Dot */}
            {stat.active && (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
            )}

            {/* Clickable Indicator Icon */}
            {stat.onClick && !stat.active && (
              <div className="absolute top-3 right-3 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300 transition-colors">
                <ExternalLink size={16} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Held Orders Section — preview only; full list via View More */}
      {heldOrders.length > 0 && statusFilter !== 'HELD' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Clock size={16} className="text-orange-500" />
              {t('orders.status.onHold')} ({heldOrders.length})
            </h2>
            {heldOrders.length > HELD_ORDERS_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('HELD');
                  setPaymentFilter('all');
                  setPage(1);
                }}
                className="text-sm font-bold text-mintcom-green hover:underline"
              >
                {t('common.viewMore')}
              </button>
            )}
          </div>

          {/* Equal-width cards fill the row (up to 4); no horizontal scroll/arrows */}
          <div className="flex flex-col md:flex-row gap-4">
            {heldOrders.slice(0, HELD_ORDERS_PREVIEW_COUNT).map((order) => (
              <div
                key={order.id}
                onClick={() => {
                  void openOrderDetails(order);
                }}
                className="group flex-1 min-w-0 w-full bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-orange-200 dark:border-orange-500/20 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 dark:text-white text-sm">{order.invoiceNumber ?? `#${order.orderNumber}`}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {order.customer?.name && (
                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                        {order.customer.name}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="dashboard-card-meta">{order.items.length} {t('hero.items')}</span>
                      <StatValue value={order.total} currency={currencySymbol} className="text-2xl" />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 capitalize">
                      {t('orders.table.staff')}: {order.user?.username}
                    </span>
                    <ChevronRight size={14} className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders List Container */}
      <div
        ref={ordersListRef}
        aria-busy={Boolean(orderDetailLoadingId || refundLoadingId)}
        className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[250px] lg:min-h-[350px]"
      >

        {/* Loading State */}
        {isLoading && orders.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-mintcom-green/10 border-t-mintcom-green rounded-full animate-spin mb-4" />
              <p className="text-xs font-black text-gray-400">{t('orders.messages.loading')}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && orders.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
                <ShoppingCart className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="dashboard-card-value mb-2">
                {hasOrderSearch
                  ? t('common.noResults')
                  : hasOrderFilters
                    ? t('common.noFilteredResults')
                    : t('orders.messages.noOrders')}
              </h3>
              {(hasOrderSearch || hasOrderFilters) && (
                <p className="text-sm font-bold text-gray-500">
                  {hasOrderSearch
                    ? t('common.noMatchingResults', {
                      entity: 'orders',
                      query: searchQuery.trim(),
                      defaultValue: 'No {{entity}} matching "{{query}}"',
                    })
                    : t('common.noFilteredResultsDesc')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Mobile Card View (visible on small screens) */}
        {sortedOrders.length > 0 && (
          <div className="md:hidden divide-y divide-gray-100 dark:divide-white/5">
            {sortedOrders.map((order) => (
              <div
                key={order.id}
                data-order-id={order.id}
                onClick={() => void openOrderDetails(order)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer active:bg-gray-100 dark:active:bg-white/[0.04]"
              >
                {/* Card Header: Order # and Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
                      <ShoppingCart size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{order.invoiceNumber ?? `#${order.orderNumber}`}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                    {getOrderStatusLabel(order)}
                  </span>
                </div>

                {/* Card Body: Customer and Amount */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-300 text-sm truncate">
                      {order.customer?.name || t('orders.table.walkIn')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.user?.username ? `${t('orders.table.staff')}: ${order.user.username}` : t('common.pos')} &bull; {formatPaymentMethod(order)}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <StatValue value={order.total} currency={currencySymbol} className="text-lg" containerClassName="justify-end" />
                  </div>
                </div>

                {/* Card Footer: Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      void openOrderDetails(order);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Eye size={14} />
                    {t('orders.actions.viewDetails')}
                  </button>

                  {isRefundableOrder(order) && (
                    <div className="flex flex-col items-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canCancelReceipts) return;
                          void handleRefund(order);
                        }}
                        disabled={!canCancelReceipts || refundLoadingId === order.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${canCancelReceipts
                          ? 'text-mintcom-red hover:bg-mintcom-red/10'
                          : 'text-gray-400 bg-gray-100 dark:bg-white/5 cursor-not-allowed'
                          }`}
                      >
                        <Undo2 size={14} />
                        {t('orders.actions.refund')}
                      </button>
                      {!canCancelReceipts && (
                        <p className="mt-1 text-[11px] font-semibold text-red-600">
                          {t('orders.messages.noRefundPermission')}
                        </p>
                      )}
                    </div>
                  )}

                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desktop Table View (hidden on small screens) */}
        {orders.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-white/[0.02]">
                <tr className="border-b border-gray-200 dark:border-white/5">
                  <th
                    className={`px-6 py-4 text-start label-strong font-sans whitespace-nowrap cursor-pointer select-none transition-colors group ${sortConfig?.key === 'date' ? 'text-mintcom-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      {t('orders.table.order')}
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'date' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-start label-strong font-sans whitespace-nowrap cursor-pointer select-none transition-colors group ${sortConfig?.key === 'customer' ? 'text-mintcom-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('customer')}
                  >
                    <div className="flex items-center gap-2">
                      {t('orders.table.customer')}
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'customer' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-end label-strong font-sans whitespace-nowrap cursor-pointer select-none transition-colors group ${sortConfig?.key === 'total' ? 'text-mintcom-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('total')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {t('orders.table.amount')}
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'total' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-end label-strong font-sans whitespace-nowrap cursor-pointer select-none transition-colors group ${sortConfig?.key === 'status' ? 'text-mintcom-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {t('orders.table.status')}
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'status' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-end dashboard-card-label whitespace-nowrap">{t('orders.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sortedOrders.map((order) => (
                  <tr
                    key={order.id}
                    data-order-id={order.id}
                    onClick={() => void openOrderDetails(order)}
                    className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer"
                  >
                    <td className="px-6 py-4 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-mintcom-green transition-colors shrink-0">
                          <ShoppingCart size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">{order.invoiceNumber ?? `#${order.orderNumber}`}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-start">
                      <p className="font-bold text-gray-800 dark:text-gray-300 text-sm">{order.customer?.name || t('orders.table.walkIn')}</p>
                      <p className="text-xs text-gray-500">{order.user?.username ? `${t('orders.table.staff')}: ${order.user.username}` : t('common.pos')}</p>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <StatValue value={order.total} currency={currencySymbol} className="text-base" containerClassName="justify-end w-full" />
                      <p className="text-xs text-gray-500 font-bold tracking-wider">{formatPaymentMethod(order)}</p>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex justify-end">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                          {getOrderStatusLabel(order)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 relative">
                        <div className="relative" data-action-menu>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              actionMenuTriggerRef.current = e.currentTarget;
                              setActiveActionMenu(activeActionMenu === order.id ? null : order.id);
                            }}
                            aria-label={t('common.orderActions')}
                            aria-expanded={activeActionMenu === order.id}
                            className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${activeActionMenu === order.id
                              ? 'text-mintcom-green bg-gray-100 dark:bg-white/5'
                              : 'text-gray-400 hover:text-mintcom-green hover:bg-gray-100 dark:hover:bg-white/5'
                              }`}
                          >
                            <MoreVertical size={18} />
                          </button>

                          <PortalDropdown
                            isOpen={activeActionMenu === order.id}
                            onClose={() => setActiveActionMenu(null)}
                            triggerRef={actionMenuTriggerRef}
                            align={t('common.locale') === 'ar' ? 'left' : 'right'}
                            className="py-1"
                          >
                            <div className="p-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void openOrderDetails(order);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                              >
                                <Eye size={14} />
                                {t('orders.actions.viewDetails')}
                              </button>

                              {isRefundableOrder(order) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canCancelReceipts) return;
                                    void handleRefund(order);
                                    setActiveActionMenu(null);
                                  }}
                                  disabled={!canCancelReceipts || refundLoadingId === order.id}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${canCancelReceipts
                                    ? 'text-mintcom-red hover:bg-mintcom-red/10'
                                    : 'text-gray-400 bg-gray-100 dark:bg-white/5 cursor-not-allowed'
                                    }`}
                                >
                                  <Undo2 size={14} />
                                  {refundLoadingId === order.id ? t('common.loading') : t('orders.actions.refundOrder')}
                                </button>
                              )}
                              {!canCancelReceipts && isRefundableOrder(order) && (
                                <p className="px-3 py-1 text-[11px] font-semibold text-red-600">
                                  {t('orders.messages.noRefundPermission')}
                                </p>
                              )}
                            </div>
                          </PortalDropdown>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-400 group-hover:text-mintcom-green group-hover:border-mintcom-green/30 transition-all">
                          <ChevronRight size={14} />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalCount}
          itemsPerPage={PAGE_SIZE}
          variant="footer"
        />
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={{ ...selectedOrder, orderNumber: String(selectedOrder.orderNumber) }}
          onClose={() => setSelectedOrder(null)}
          onRefundSuccess={handleRefundSuccess}
          canRefund={canCancelReceipts}
          canRestock={canRestockRefundItems}
        />
      )}

      {selectedRefundOrder && (
        <OrderRefundModal
          order={{ ...selectedRefundOrder, orderNumber: String(selectedRefundOrder.orderNumber) } as any}
          isOpen={Boolean(selectedRefundOrder)}
          onClose={() => setSelectedRefundOrder(null)}
          onRefundSuccess={handleRefundSuccess}
          canRefund={canCancelReceipts}
          canRestock={canRestockRefundItems}
        />
      )}

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel}
      />

    </div>
  );
}

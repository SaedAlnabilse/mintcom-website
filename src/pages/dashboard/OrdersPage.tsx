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
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  MoreVertical,
  PlayCircle,
  History,
  Eye,
  Undo2,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { exportToCSV } from '../../utils/export';
import { toast } from 'react-hot-toast';
import { DateRangePicker } from '../../components/DateRangePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { SearchInput, SelectInput, Pagination } from '../../components/ui';
import { SingleSelect } from '../../components/SingleSelect';
import { checkPermission, usePermissionGuard } from '../../hooks/usePermissionGuard';
import { PortalDropdown } from '../../components/PortalDropdown';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  subtotal: number;
  tax: number;
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
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
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

export function OrdersPage() {
  const { t } = useTranslation();
  usePermissionGuard();
  const { formatAmount, currencySymbol } = useCurrency();
  const { account, currentEstablishment } = useAuth();
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    return location.state?.statusFilter || 'all';
  });
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Helper function to format payment method display
  const formatPaymentMethod = (order: Order): string => {
    if (order.paymentMethod === 'CARD' && order.cardType) {
      return t('orders.payment.cardWithBrand', { brand: order.cardType });
    }
    if (order.paymentMethod === 'OTHER' && order.otherPaymentMethod) {
      return order.otherPaymentMethod;
    }
    if (order.paymentMethod === 'CASH') {
      return t('orders.payment.cash');
    }
    // Format enum values nicely
    return order.paymentMethod
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
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
  const [isRefundReasonModalOpen, setIsRefundReasonModalOpen] = useState(false);
  const [refundTargetOrder, setRefundTargetOrder] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundReasonError, setRefundReasonError] = useState('');
  const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const ordersListRef = useRef<HTMLDivElement | null>(null);
  const isInitialMount = useRef(true);
  const heldOrdersScrollRef = useRef<HTMLDivElement | null>(null);
  const lastHeldArrowClickRef = useRef(0);
  const actionMenuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const fetchRequestIdRef = useRef(0);
  const realtimeRefreshTimeoutRef = useRef<number | null>(null);
  const [canScrollHeldLeft, setCanScrollHeldLeft] = useState(false);
  const [canScrollHeldRight, setCanScrollHeldRight] = useState(false);

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

  const updateHeldOrdersScrollIndicators = useCallback(() => {
    const el = heldOrdersScrollRef.current;
    if (!el) {
      setCanScrollHeldLeft(false);
      setCanScrollHeldRight(false);
      return;
    }

    const hasLeft = el.scrollLeft > 2;
    const hasRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setCanScrollHeldLeft(hasLeft);
    setCanScrollHeldRight(hasRight);
  }, []);

  const scrollHeldOrders = useCallback((direction: 'left' | 'right') => {
    const el = heldOrdersScrollRef.current;
    if (!el) return;
    lastHeldArrowClickRef.current = Date.now();
    const amount = Math.max(280, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
  }, []);

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
          const dateLocale = getDateLocale(t('common.locale'));
          const time = res.data.activeShift?.startTime ? format(new Date(res.data.activeShift.startTime), 'h:mm a', { locale: dateLocale }) : '';
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
  }, [canUseShiftFeatures, t]);

  // Fetch shift status on mount or establishment change
  useEffect(() => {
    if (currentEstablishment?.id && canUseShiftFeatures) {
      checkShiftStatus(false);
    }
  }, [currentEstablishment?.id, canUseShiftFeatures, checkShiftStatus]);

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
                  label: cardType,
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
                label: method,
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

  useEffect(() => {
    updateHeldOrdersScrollIndicators();
    const onResize = () => updateHeldOrdersScrollIndicators();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [updateHeldOrdersScrollIndicators, heldOrders.length, statusFilter]);

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

  // Memoize fetchOrders to prevent stale closures
  const fetchOrders = useCallback(async () => {
    const requestId = ++fetchRequestIdRef.current;

    try {
      setIsLoading(true);
      const effectiveStatusFilter =
        !canUsePosFeatures && statusFilter === 'HELD' ? 'all' : statusFilter;

      // Handle shift-based date ranges
      let start: Date;
      let end: Date;

      if (selectedDateRange === 'current_shift' && activeShiftStartTime) {
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
          limit: 10, // Default limit
          startDate: start.toISOString(),
          endDate: end.toISOString()
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
      const serverTotalRevenue = Number(kpiSummary.totalRevenue || 0) + Number(kpiSummary.taxCollected || 0);
      setCompletedOrderRevenue(serverTotalRevenue);
      setCompletedOrderCount(Number(kpiSummary.totalOrders || regularTotalForPeriod || 0));

      // Process Main Display Data
      if (effectiveStatusFilter === 'HELD') {
        // Show Held Orders
        const total = heldOrdersList.length;
        setTotalCount(total);
        setTotalPages(Math.ceil(total / 10) || 1);
        const startIndex = (page - 1) * 10;
        setOrders((Array.isArray(heldOrdersList) ? heldOrdersList : []).slice(startIndex, startIndex + 10));
      } else {
        // Show Regular Orders (possibly mixed with held if page 1)
        const responseData = mainRes?.data || {};
        const fetchedOrders = Array.isArray(responseData.orders) ? responseData.orders : (Array.isArray(responseData) ? responseData : []);
        const totalOrders = responseData.totalOrders || responseData.total || fetchedOrders.length;
        const serverTotalPages = responseData.totalPages || Math.ceil(totalOrders / 10) || 1;

        // Held orders are always shown in their own dedicated section above,
        // so we no longer mix them into the main orders table.

        if (Array.isArray(mainRes?.data)) {
          // Fallback for array response
          const total = fetchedOrders.length;
          setTotalCount(total);
          setTotalPages(Math.ceil(total / 10) || 1);
          const startIndex = (page - 1) * 10;
          setOrders(fetchedOrders.slice(startIndex, startIndex + 10));
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
      if (requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    page,
    statusFilter,
    paymentFilter,
    startDate,
    endDate,
    selectedDateRange,
    debouncedSearchQuery,
    canUsePosFeatures,
    activeShiftStartTime,
    previousShiftStartTime,
    previousShiftEndTime,
    t,
  ]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-scroll to list when filters change
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (ordersListRef.current) {
      ordersListRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [statusFilter, paymentFilter]);

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



  // Real-time updates - pass auth token for proper WebSocket authentication
  const accessToken = localStorage.getItem('accessToken');
  const { onRefresh } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
    authToken: accessToken || undefined,
  });
  const scheduleOrdersRefresh = useCallback((delayMs = 120) => {
    if (realtimeRefreshTimeoutRef.current) {
      window.clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = window.setTimeout(() => {
      fetchOrders();
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
    const date = new Date(dateString);
    if (t('common.locale') === 'ar') {
      return format(date, 'MMM d, HH:mm', { locale: getDateLocale(t('common.locale')) });
    }
    return format(date, 'MMM d, HH:mm');
  };

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
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

  const handleRefund = (order: Order) => {
    if (!canCancelReceipts) {
      toast.error(t('orders.messages.refundFailed'));
      return;
    }

    setRefundTargetOrder(order);
    setRefundReason('');
    setRefundReasonError('');
    setIsRefundReasonModalOpen(true);
  };

  const submitRefundWithReason = async () => {
    if (!refundTargetOrder) return;
    const trimmedReason = refundReason.trim();
    if (!trimmedReason) {
      setRefundReasonError('Refund reason is required');
      return;
    }

    try {
      setIsRefundSubmitting(true);
      await api.post(`/api/orders/${refundTargetOrder.id}/refund`, {
        reason: trimmedReason,
        refundReason: trimmedReason,
      });
      toast.success(t('orders.messages.refundSuccess'));
      setIsRefundReasonModalOpen(false);
      setRefundTargetOrder(null);
      setRefundReason('');
      setRefundReasonError('');
      fetchOrders();
    } catch (err) {
      toast.error((err as ApiError).response?.data?.message || t('orders.messages.refundFailed'));
    } finally {
      setIsRefundSubmitting(false);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-paymint-green/10 text-paymint-green border-paymint-green/20';
      case 'PENDING':
      case 'HELD':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'REFUNDED':
        return 'bg-paymint-red/10 text-paymint-red border-paymint-red/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

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

  const handleExport = () => {
    const exportData = orders.map(o => ({
      orderNumber: o.orderNumber,
      date: formatDate(o.createdAt),
      customer: o.customer?.name || t('orders.table.walkIn'),
      total: o.total,
      status: o.paymentStatus || o.status,
      paymentMethod: o.paymentMethod
    }));

    exportToCSV(exportData, 'orders_history', {
      orderNumber: t('orders.exportFields.orderNumber'),
      date: t('orders.exportFields.date'),
      customer: t('orders.exportFields.customer'),
      total: t('orders.exportFields.total', { currency: currencySymbol }),
      status: t('orders.exportFields.status'),
      paymentMethod: t('orders.exportFields.paymentMethod')
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('orders.title')}</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
            <span>{t('orders.subtitle')}</span>
            {currentEstablishment?.name && (
              <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
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
                    icon: <PlayCircle size={18} className="text-paymint-green" />,
                    subtitle: shiftStatus?.activeShift?.startTime ? t('dashboard.shiftStatus.started', { time: format(new Date(shiftStatus.activeShift.startTime), 'h:mm a') }) : t('dashboard.shiftStatus.live')
                  }] : []),
                  ...(lastShiftSnapshot ? [{
                    label: t('dashboard.viewMode.previousShift'),
                    value: 'previous_shift',
                    icon: <History size={18} />,
                    subtitle: t('dashboard.shiftStatus.lastCompleted')
                  }] : [])
                ]}
                placeholder={t('orders.checkShift')}
                showAllOption={false}
                buttonClassName="!bg-white dark:!bg-white/5 !text-gray-900 dark:!text-white !border-gray-200 dark:!border-white/10 hover:!bg-gray-50 dark:hover:!bg-white/10 !h-auto !py-2.5 sm:!py-3 !rounded-xl"
              />
            </div>
          )}

          {canExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all touch-target"
            >
              <Download size={18} />
              <span className="hidden xs:inline">{t('orders.export')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Unified Filter Control Deck */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-[24px] border border-gray-100 dark:border-white/5 p-2 shadow-sm">
        {/* Mobile: Stack vertically, Desktop: Flex wrap */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-2">

          {/* Search Bar - full width on mobile */}
          <div className="w-full sm:flex-1 sm:min-w-[200px] lg:w-64 lg:flex-none">
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => { setSearchQuery(''); setDebouncedSearchQuery(''); setPage(1); }}
              onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
              placeholder={t('orders.searchPlaceholder')}
              className="w-full h-full"
            />
          </div>

          {/* Quick Date Select - half width on mobile */}
          <div className="flex-1 sm:flex-none sm:w-44 relative z-[70]">
            <SelectInput
              value={selectedDateRange === 'custom' ? null : selectedDateRange}
              onChange={(val) => setQuickDate(val || 'today')}
              options={getDateRangeOptions()}
              showAllOption={false}
              placeholder={t('orders.period') || 'Period'}
              className="w-full h-full"
            />
          </div>

          {/* Date Range Group - hidden on mobile, show on desktop */}
          <div className="hidden sm:block flex-none min-w-[180px] sm:min-w-[220px] relative z-[60]">
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onRangeChange={(start, end) => {
                setStartDate(start);
                setEndDate(end);
                setSelectedDateRange('custom');
                setPage(1);
              }}
              onClear={() => setQuickDate('today')}
              isActive={selectedDateRange === 'custom'}
              align="center"
            />
          </div>

          {/* Vertical Divider - desktop only */}
          <div className="hidden 2xl:block w-px self-stretch bg-gray-100 dark:bg-white/10 my-1" />

          {/* Status & Payment filters - side by side on mobile */}
          <div className="flex gap-2 w-full sm:w-auto sm:flex-1 sm:min-w-[300px]">
            {/* Status Select */}
            <div className="flex-1 relative z-[50]">
              <SelectInput
                value={statusFilter === 'all' ? null : statusFilter}
                onChange={(val) => {
                  setStatusFilter(val || 'all');
                  setPage(1);
                  if (val === 'HELD') {
                    setPaymentFilter('all');
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
                placeholder={t('orders.table.status') || 'Status'}
                className="w-full h-full"
              />
            </div>

            {/* Payment Method Select */}
            <div className="flex-1 relative z-[40]">
              <SelectInput
                value={paymentFilter === 'all' ? null : paymentFilter}
                onChange={(val) => { setPaymentFilter(val || 'all'); setPage(1); }}
                disabled={statusFilter === 'HELD'}
                placeholder={t('orders.table.payment') || 'Payment'}
                options={paymentOptions}
                showAllOption={true}
                allOptionLabel={t('orders.payment.all')}
                className="w-full h-full"
              />
            </div>
          </div>

        </div>
      </div>

      {/* Shift Info Bar - shows when viewing shift data */}
      {(selectedDateRange === 'current_shift' || selectedDateRange === 'previous_shift') && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <span className="text-paymint-green">
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

      <div className="flex overflow-x-auto scrollbar-none gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible pb-2 sm:pb-0">
        {[
          {
            label: t('orders.kpi.totalAmount'),
            value: formatAmount(
              statusFilter === 'HELD'
                ? heldOrders.reduce((acc, o) => acc + (o.total || 0), 0)
                : completedOrderRevenue
            ),
            sub: statusFilter === 'HELD'
              ? t('orders.status.onHold')
              : t('dashboard.stats.completedOrders', { defaultValue: 'Completed orders' }),
            icon: TrendingUp,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            onClick: undefined,
            active: false
          },
          {
            label: t('orders.kpi.totalOrders'),
            value: (
              statusFilter === 'HELD'
                ? totalHeldCount
                : completedOrderCount
            ).toLocaleString(t('common.locale')),
            sub: statusFilter === 'HELD'
              ? t('orders.status.onHold')
              : t('dashboard.stats.completedOrders', { defaultValue: 'Completed orders' }),
            icon: ShoppingCart,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            onClick: () => { setStatusFilter('all'); setPage(1); },
            active: statusFilter === 'all'
          },
          {
            label: t('orders.kpi.onHold'),
            value: totalHeldCount.toLocaleString(t('common.locale')),
            icon: Clock,
            color: 'text-orange-500',
            bg: 'bg-orange-500/10',
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
                ? 'border-paymint-green ring-1 ring-paymint-green/30 bg-paymint-green/[0.02]'
                : 'border-gray-200 dark:border-white/[0.03] hover:border-paymint-green/30'}`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg} ${stat.active ? 'opacity-20' : 'group-hover:opacity-10'}`} />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide mb-1 capitalize truncate">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">{stat.value}</p>
                {stat.sub && (
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 capitalize truncate">{stat.sub}</p>
                )}
              </div>
            </div>

            {/* Active Indicator Dot */}
            {stat.active && (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-paymint-green animate-pulse" />
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

      {/* Held Orders Section */}
      {heldOrders.length > 0 && statusFilter !== 'HELD' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Clock size={16} className="text-orange-500" />
              {t('orders.status.onHold')} ({heldOrders.length})
            </h2>
          </div>

          <div className="relative">
            {canScrollHeldLeft && (
              <div
                className="absolute left-0 top-0 bottom-2 z-30 w-14 bg-gradient-to-r from-white dark:from-[#111827] to-transparent flex items-center justify-start pl-1"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollHeldOrders('left');
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="h-9 w-9 rounded-[12px] border border-orange-200/70 dark:border-orange-500/30 bg-white/90 dark:bg-[#1f2937]/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/50 text-orange-500 transition-all flex items-center justify-center"
                  aria-label="Scroll held orders left"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            )}
            {canScrollHeldRight && (
              <div
                className="absolute right-0 top-0 bottom-2 z-30 w-14 bg-gradient-to-l from-white dark:from-[#111827] to-transparent flex items-center justify-end pr-1"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollHeldOrders('right');
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="h-9 w-9 rounded-[12px] border border-orange-200/70 dark:border-orange-500/30 bg-white/90 dark:bg-[#1f2937]/90 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-orange-300 dark:hover:border-orange-500/50 text-orange-500 transition-all flex items-center justify-center"
                  aria-label="Scroll held orders right"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <div
              ref={heldOrdersScrollRef}
              onScroll={updateHeldOrdersScrollIndicators}
              className="flex flex-nowrap gap-4 overflow-x-auto scrollbar-none pb-2"
            >
              {heldOrders.slice(0, 3).map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    if (Date.now() - lastHeldArrowClickRef.current < 450) return;
                    setSelectedOrder(order);
                  }}
                  className="group flex-none basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-orange-200 dark:border-orange-500/20 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />

                  <div className="relative z-10 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                          <Clock size={18} />
                        </div>
                        <div>
                          <p className="font-black text-gray-900 dark:text-white text-sm">#{order.orderNumber}</p>
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
                        <span className="dashboard-card-value">{formatAmount(order.total)}</span>
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

              {heldOrders.length > 3 && (
                <div
                  onClick={() => {
                    setStatusFilter('HELD');
                    setPaymentFilter('all');
                    setPage(1);
                  }}
                  className="group flex-none basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4 bg-white dark:bg-[#1E293B] p-5 rounded-2xl border border-dashed border-orange-300 dark:border-orange-500/30 shadow-sm hover:shadow-md hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer relative overflow-hidden flex flex-col items-center justify-center min-h-[140px]"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-400 group-hover:text-orange-500 group-hover:bg-orange-500/20 transition-colors mb-3">
                    <ChevronRight size={24} />
                  </div>
                  <p className="font-bold text-gray-600 dark:text-gray-300 group-hover:text-orange-500 transition-colors">
                    {t('common.more')} ({heldOrders.length - 3})
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Orders List Container */}
      <div 
        ref={ordersListRef}
        className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[250px] lg:min-h-[350px]"
      >

        {/* Loading State */}
        {isLoading && orders.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
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
                {searchQuery.trim() ? t('common.noResults') : t('orders.messages.noOrders')}
              </h3>
              {searchQuery.trim() && (
                <p className="text-sm font-bold text-gray-500">
                  {t('common.noMatchingResults', {
                    entity: 'orders',
                    query: searchQuery.trim(),
                    defaultValue: 'No {{entity}} matching "{{query}}"',
                  })}
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
                onClick={() => setSelectedOrder(order)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer active:bg-gray-100 dark:active:bg-white/[0.04]"
              >
                {/* Card Header: Order # and Status */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500">
                      <ShoppingCart size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">#{order.orderNumber}</p>
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
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{formatAmount(order.total)}</p>
                  </div>
                </div>

                {/* Card Footer: Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    <Eye size={14} />
                    {t('orders.actions.viewDetails')}
                  </button>

                  {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                    <div className="flex flex-col items-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!canCancelReceipts) return;
                          handleRefund(order);
                        }}
                        disabled={!canCancelReceipts}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${canCancelReceipts
                          ? 'text-paymint-red hover:bg-paymint-red/10'
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
                    className={`px-6 py-4 text-left text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'date' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      {t('orders.table.order')}
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'date' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'customer' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('customer')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {t('orders.table.customer')}
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'customer' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'total' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('total')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {t('orders.table.amount')}
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'total' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-center text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'status' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('status')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {t('orders.table.status')}
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'status' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center dashboard-card-label">{t('orders.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {sortedOrders.map((order) => (
                  <tr
                    key={order.id}
                    data-order-id={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-paymint-green transition-colors">
                          <ShoppingCart size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white text-sm">#{order.orderNumber}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-bold text-gray-800 dark:text-gray-300 text-sm">{order.customer?.name || t('orders.table.walkIn')}</p>
                      <p className="text-xs text-gray-500">{order.user?.username ? `${t('orders.table.staff')}: ${order.user.username}` : t('common.pos')}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-bold text-gray-900 dark:text-white">{formatAmount(order.total)}</p>
                      <p className="text-xs text-gray-500 font-bold tracking-wider">{formatPaymentMethod(order)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                        {getOrderStatusLabel(order)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2 relative">
                        <div className="relative" data-action-menu>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              actionMenuTriggerRef.current = e.currentTarget;
                              setActiveActionMenu(activeActionMenu === order.id ? null : order.id);
                            }}
                            aria-label="Order actions"
                            aria-expanded={activeActionMenu === order.id}
                            className={`p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-colors ${activeActionMenu === order.id
                              ? 'text-paymint-green bg-gray-100 dark:bg-white/5'
                              : 'text-gray-400 hover:text-paymint-green hover:bg-gray-100 dark:hover:bg-white/5'
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
                                  setSelectedOrder(order);
                                  setActiveActionMenu(null);
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                              >
                                <Eye size={14} />
                                {t('orders.actions.viewDetails')}
                              </button>

                              {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!canCancelReceipts) return;
                                    handleRefund(order);
                                    setActiveActionMenu(null);
                                  }}
                                  disabled={!canCancelReceipts}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-colors ${canCancelReceipts
                                    ? 'text-paymint-red hover:bg-paymint-red/10'
                                    : 'text-gray-400 bg-gray-100 dark:bg-white/5 cursor-not-allowed'
                                    }`}
                                >
                                  <Undo2 size={14} />
                                  {t('orders.actions.refundOrder')}
                                </button>
                              )}
                              {!canCancelReceipts && (order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                                <p className="px-3 py-1 text-[11px] font-semibold text-red-600">
                                  {t('orders.messages.noRefundPermission')}
                                </p>
                              )}
                            </div>
                          </PortalDropdown>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center text-gray-400 group-hover:text-paymint-green group-hover:border-paymint-green/30 transition-all">
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
          itemsPerPage={10}
          variant="footer"
        />
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefundSuccess={fetchOrders}
          canRefund={canCancelReceipts}
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

      {isRefundReasonModalOpen && (
        <div className="fixed inset-0 z-[10000] popup-surface flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 p-5 sm:p-6 shadow-2xl"
            dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
          >
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t('orders.messages.refundConfirmTitle')}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t('orders.messages.refundConfirmMessage')}
            </p>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                Refund reason
              </label>
              <textarea maxLength={2000}
                value={refundReason}
                onChange={(e) => {
                  setRefundReason(e.target.value);
                  if (refundReasonError && e.target.value.trim()) {
                    setRefundReasonError('');
                  }
                }}
                placeholder="Enter refund reason"
                rows={4}
                className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-[#0F172A] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-paymint-green/40"
              />
              {refundReasonError && (
                <p className="mt-2 text-sm text-red-600">{refundReasonError}</p>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  if (isRefundSubmitting) return;
                  setIsRefundReasonModalOpen(false);
                  setRefundTargetOrder(null);
                  setRefundReason('');
                  setRefundReasonError('');
                }}
                className="flex-1 rounded-xl border border-gray-300 dark:border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submitRefundWithReason}
                disabled={isRefundSubmitting}
                className="flex-1 rounded-xl bg-paymint-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-paymint-red/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRefundSubmitting ? t('common.loading') : t('orders.actions.refund')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






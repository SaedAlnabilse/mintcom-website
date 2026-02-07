import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { startOfDay, endOfDay, format } from 'date-fns';
import { useCurrency } from '../../context/CurrencyContext';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';

import {
  ShoppingCart,
  Clock,
  ChevronRight,
  TrendingUp,
  Download,
  MoreVertical,
  PlayCircle,
  History,
  Eye,
  Undo2,
  ArrowUpDown
} from 'lucide-react';
import api from '../../config/api';
import { ConfirmModal } from '../../components/ConfirmModal';
import { OrderDetailModal } from '../../components/OrderDetailModal';
import { exportToCSV } from '../../utils/export';
import { toast } from 'react-hot-toast';
import { CustomDatePicker } from '../../components/CustomDatePicker';
import { DATE_PERIOD_OPTIONS, calculateDateRange, formatDateForInput } from '../../utils/datePeriods';
import type { DatePeriod } from '../../utils/datePeriods';
import { SearchInput, SelectInput, Pagination } from '../../components/ui';
import { SingleSelect } from '../../components/SingleSelect';

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
  const { formatAmount, currencySymbol } = useCurrency();
  const { currentEstablishment } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [overallTotalCount, setOverallTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => {
    return location.state?.statusFilter || 'all';
  });
  const [paymentFilter, setPaymentFilter] = useState('all');

  // Helper function to format payment method display
  const formatPaymentMethod = (order: Order): string => {
    if (order.paymentMethod === 'CARD' && order.cardType) {
      return `Card (${order.cardType})`;
    }
    if (order.paymentMethod === 'OTHER' && order.otherPaymentMethod) {
      return order.otherPaymentMethod;
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

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aValue: any = a[sortConfig.key as keyof Order];
    let bValue: any = b[sortConfig.key as keyof Order];

    // Handle nested properties
    if (sortConfig.key === 'customer') {
      aValue = a.customer?.name || 'Walk-in Customer';
      bValue = b.customer?.name || 'Walk-in Customer';
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

  // Shift status for shift-based filtering
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
  const [lastShiftSnapshot, setLastShiftSnapshot] = useState<{ startTime: string; timestamp: string } | null>(null);
  const [totalHeldCount, setTotalHeldCount] = useState(0);

  // Check shift status function (can be called manually)
  const checkShiftStatus = useCallback(async (showToast = false) => {
    try {
      // Fetch shift status
      const res = await api.get('/dashboard/live-shift');
      console.log('Shift status:', res.data);
      setShiftStatus(res.data);

      if (showToast) {
        if (res.data?.shiftStatus === 'ACTIVE') {
          const time = res.data.activeShift?.startTime ? format(new Date(res.data.activeShift.startTime), 'h:mm a') : '';
          toast.success(`Active Shift Found${time ? ` (${time})` : ''}`);
        } else {
          toast.error('No Active Shift Found');
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
        const errorMessage = err.response?.data?.message || err.message || 'Failed to check shift status';
        toast.error(errorMessage);
      }
    }
  }, []);

  // Fetch shift status on mount or establishment change
  useEffect(() => {
    if (currentEstablishment?.id) {
      checkShiftStatus(false);
    }
  }, [currentEstablishment?.id, checkShiftStatus]);

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
            options.push({ label: 'Cash', value: 'CASH', group: 'Main' });
          }

          // Add card options
          if (paymentMethods.includes('CARD')) {
            // Add "All Cards" option first
            options.push({ label: 'All Cards', value: 'CARD', group: 'Cards' });

            // Add individual card types
            if (cardTypes && cardTypes.length > 0) {
              cardTypes.forEach((cardType: string) => {
                options.push({
                  label: cardType,
                  value: `CARD_TYPE:${cardType}`,
                  group: 'Cards'
                });
              });
            }
          }

          // Add other payment methods
          if (paymentMethods.includes('OTHER') && otherMethods && otherMethods.length > 0) {
            // Add "All Other" option first
            options.push({ label: 'All Other', value: 'OTHER', group: 'Other Payments' });

            otherMethods.forEach((method: string) => {
              options.push({
                label: method,
                value: `OTHER_METHOD:${method}`,
                group: 'Other Payments'
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
                group: 'Delivery Apps'
              });
            }
          });
        }

        // If no options from endpoint, fallback to defaults
        if (options.length === 0) {
          options.push(
            { label: 'Cash', value: 'CASH', group: 'Main' },
            { label: 'All Cards', value: 'CARD', group: 'Cards' },
            { label: 'All Other', value: 'OTHER', group: 'Other Payments' },
          );
        }

        setPaymentOptions(options);
      } catch (err) {
        console.error('Failed to fetch payment options', err);
        // Fallback options
        setPaymentOptions([
          { label: 'Cash', value: 'CASH', group: 'Main' },
          { label: 'All Cards', value: 'CARD', group: 'Cards' },
          { label: 'All Other', value: 'OTHER', group: 'Other Payments' },
        ]);
      }
    };

    fetchPaymentOptions();
  }, []);

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

  // Memoize fetchOrders to prevent stale closures
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      // Handle shift-based date ranges
      let start: Date;
      let end: Date;

      if (selectedDateRange === 'current_shift' && shiftStatus?.activeShift) {
        // Current shift data
        start = new Date(shiftStatus.activeShift.startTime);
        end = new Date();
      } else if (selectedDateRange === 'previous_shift' && lastShiftSnapshot) {
        // Previous shift data
        start = new Date(lastShiftSnapshot.startTime);
        end = new Date(lastShiftSnapshot.timestamp);
      } else if (selectedDateRange === 'all') {
        // All time - use a very early date
        start = new Date(0);
        end = new Date(8640000000000000); // Far future
      } else {
        // Regular date-based filtering
        start = startOfDay(new Date(startDate));
        end = endOfDay(new Date(endDate));
      }

      // Prepare parallel requests
      const promises: Promise<any>[] = [];

      // 1. Held orders count (always needed for KPI)
      promises.push(api.get('/api/held-orders').catch(e => { console.error('Failed held orders', e); return { data: [] }; }));

      // 2. Overall Total (always needed for KPI)
      const overallParams = {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 1,
        page: 1
      };
      promises.push(api.get('/reports/orders-history', { params: overallParams }).catch(e => { console.error('Failed total count', e); return { data: { totalOrders: 0 } }; }));

      // 3. Main Data (Held or Regular)
      const mapHeldOrder = (h: Record<string, any>) => ({
        id: h.id,
        orderNumber: h.nickname,
        total: h.orderData?.total || 0,
        subtotal: h.orderData?.subtotal || 0,
        tax: h.orderData?.tax || 0,
        discount: h.orderData?.discount?.amount || 0,
        paymentMethod: 'N/a',
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
          username: h.heldBy?.username || 'Unknown',
        },
        note: h.orderData?.note,
      });

      if (statusFilter === 'HELD') {
        // If filtering by held, we don't need regular orders
        promises.push(Promise.resolve(null)); 
      } else {
        // Calculate params for regular orders
        const params: Record<string, any> = {
          page: page,
          limit: 10, // Default limit
          startDate: start.toISOString(),
          endDate: end.toISOString()
        };

        if (statusFilter !== 'all') {
          params.status = statusFilter;
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

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }
        
        promises.push(api.get('/reports/orders-history', { params }));
      }

      // Execute all requests in parallel
      const [heldRes, overallRes, mainRes] = await Promise.all(promises);

      // Process Held Orders (for KPI and potentially for list)
      let heldOrdersList: Order[] = [];
      let filteredHeldCount = 0;
      
      if (heldRes?.data) {
        heldOrdersList = heldRes.data
          .map(mapHeldOrder)
          .filter((h: Record<string, any>) => {
            const hDate = new Date(h.createdAt);
            return hDate >= start && hDate <= end;
          });
        filteredHeldCount = heldOrdersList.length;
        setTotalHeldCount(filteredHeldCount);
      }

      // Process Overall Total (for KPI)
      const regularTotalForPeriod = overallRes?.data?.totalOrders || overallRes?.data?.total || 0;
      setOverallTotalCount(regularTotalForPeriod + filteredHeldCount);

      // Process Main Display Data
      if (statusFilter === 'HELD') {
        // Show Held Orders
        const total = heldOrdersList.length;
        setTotalCount(total);
        setTotalPages(Math.ceil(total / 10) || 1);
        const startIndex = (page - 1) * 10;
        setOrders(heldOrdersList.slice(startIndex, startIndex + 10));
      } else {
        // Show Regular Orders (possibly mixed with held if page 1)
        const responseData = mainRes?.data || {};
        let fetchedOrders = responseData.orders || responseData || [];
        let totalOrders = responseData.totalOrders || responseData.total || fetchedOrders.length;
        let serverTotalPages = responseData.totalPages || Math.ceil(totalOrders / 10) || 1;

        // Mix held orders at the beginning of page 1 if showing 'all' status
        if (page === 1 && filteredHeldCount > 0 && statusFilter === 'all' && paymentFilter === 'all' && !searchQuery) {
           const combined = [...heldOrdersList, ...fetchedOrders];
           combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
           fetchedOrders = combined;
           
           if (fetchedOrders.length > 10) {
             fetchedOrders = fetchedOrders.slice(0, 10);
           }
           totalOrders += filteredHeldCount;
           serverTotalPages = Math.ceil(totalOrders / 10) || 1;
        }

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
      console.error('Orders fetch error:', err);
      setError((err as ApiError).response?.data?.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, paymentFilter, startDate, endDate, selectedDateRange, searchQuery, shiftStatus, lastShiftSnapshot]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  // Listen for real-time order events
  useEffect(() => {
    console.log('[Orders] 📡 Registering real-time event listener');
    const unsubscribe = onRefresh((eventType) => {
      console.log('[Orders] 📥 Received real-time event:', eventType);
      if (eventType === DataChangeEventTypes.ORDER_CREATED ||
          eventType === DataChangeEventTypes.ORDER_REFUNDED ||
          eventType === DataChangeEventTypes.ORDER_UPDATED) {
        // Trigger immediate refresh
        fetchOrders();
      }

      // Refresh when held order events occur
      if (eventType === DataChangeEventTypes.HELD_ORDER_CREATED ||
          eventType === DataChangeEventTypes.HELD_ORDER_DELETED) {
        // Always refresh if viewing held orders
        if (statusFilter === 'HELD') {
          fetchOrders();
        }
      }

      // Refresh shift status when shift events occur
      if (eventType === DataChangeEventTypes.SHIFT_STARTED ||
          eventType === DataChangeEventTypes.SHIFT_ENDED) {
        // Refetch shift status
        api.get('/dashboard/live-shift').then(res => {
          setShiftStatus(res.data);
          // Also refresh orders if filtering by current shift
          fetchOrders();
        }).catch(console.error);
      }
    });

    return unsubscribe;
  }, [onRefresh, fetchOrders, statusFilter]); // Added missing dependencies

  const searchOrder = useCallback(async () => {
    if (!searchQuery.trim()) {
      fetchOrders();
      return;
    }

    // Reset to page 1 when searching
    setPage(1);
    
    // Use the main fetchOrders which now supports search param
    fetchOrders();
  }, [searchQuery, fetchOrders]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const setQuickDate = (range: string) => {
    setSelectedDateRange(range);
    setPage(1);

    // For shift-based ranges, don't update the date inputs
    if (range === 'current_shift' || range === 'previous_shift') {
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
    options.push(...DATE_PERIOD_OPTIONS);

    // Add All Time option
    options.push({ label: 'All Time', value: 'all' });

    return options;
  };

  const handleRefund = (order: Order) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Refund Order',
      message: 'Are you sure you want to refund this order? This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        try {
          await api.post(`/api/orders/${order.id}/refund`, {
            reason: 'Refunded via web dashboard',
          });
          toast.success('Order refunded');
          fetchOrders(); // Refresh the list
          setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
          toast.error((err as ApiError).response?.data?.message || 'Failed to process refund');
        }
      }
    });
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

  const getStatusLabel = (status: string) => {
    if (status === 'PENDING' || status === 'HELD') return 'On Hold';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const handleExport = () => {
    const exportData = orders.map(o => ({
      orderNumber: o.orderNumber,
      date: formatDate(o.createdAt),
      customer: o.customer?.name || 'Walk-in',
      total: o.total,
      status: o.paymentStatus || o.status,
      paymentMethod: o.paymentMethod
    }));

    exportToCSV(exportData, 'orders_history', {
      orderNumber: 'Order #',
      date: 'Date',
      customer: 'Customer',
      total: `Total (${currencySymbol})`,
      status: 'Status',
      paymentMethod: 'Payment Method'
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <span className="px-2.5 sm:px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
              Sales
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">View Customer Orders</h1>
          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
            Manage orders
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Shift Selector */}
          {(shiftStatus?.shiftStatus === 'ACTIVE' || lastShiftSnapshot) && (
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
                       label: 'Current Shift',
                       value: 'current_shift',
                       icon: <PlayCircle size={18} className="text-paymint-green" />,
                       subtitle: shiftStatus?.activeShift?.startTime ? `Started ${format(new Date(shiftStatus.activeShift.startTime), 'h:mm a')}` : 'Active now'
                   }] : []),
                   ...(lastShiftSnapshot ? [{
                       label: 'Previous Shift',
                       value: 'previous_shift',
                       icon: <History size={18} />,
                       subtitle: 'Last completed shift'
                   }] : [])
                ]}
                placeholder="Check Shift"
                showAllOption={false}
                buttonClassName="!bg-white dark:!bg-white/5 !text-gray-900 dark:!text-white !border-gray-200 dark:!border-white/10 hover:!bg-gray-50 dark:hover:!bg-white/10 !h-auto !py-2.5 sm:!py-3"
              />
            </div>
          )}
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all touch-target"
          >
            <Download size={18} />
            <span className="hidden xs:inline">Export to CSV</span>
          </button>
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
              onClear={() => { setSearchQuery(''); fetchOrders(); }}
              onKeyPress={(e) => e.key === 'Enter' && searchOrder()}
              placeholder="Search orders..."
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
              placeholder="Period"
              className="w-full h-full"
            />
          </div>

          {/* Date Range Group - hidden on mobile, show on desktop */}
          <div className="hidden sm:block flex-none w-auto min-w-[170px] relative z-[60]">
            {(() => {
              const isDateFiltered = selectedDateRange === 'custom';
              return (
                <div className={`flex flex-col justify-center px-4 py-1.5 rounded-xl border h-full transition-all ${isDateFiltered ? 'bg-paymint-green/5 border-paymint-green ring-2 ring-paymint-green shadow-lg shadow-paymint-green/10' : 'bg-gray-50 dark:bg-white/5 border-transparent'}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[9px] font-black tracking-wider transition-colors ${isDateFiltered ? "text-[#7CC39F]" : "text-gray-400"}`}>Date Range</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CustomDatePicker
                      value={startDate}
                      onChange={(val) => { setStartDate(val); setSelectedDateRange('custom'); setPage(1); }}
                      className="w-[90px]"
                      maxDate={endDate}
                      showIcon={true}
                    />
                    <span className={`text-xs font-light transition-colors flex-shrink-0 ${isDateFiltered ? "text-[#7CC39F]/50" : "text-gray-300 dark:text-white/20"}`}>→</span>
                    <CustomDatePicker
                      value={endDate}
                      onChange={(val) => { setEndDate(val); setSelectedDateRange('custom'); setPage(1); }}
                      className="w-[90px]"
                      minDate={startDate}
                      showIcon={true}
                    />
                  </div>
                </div>
              );
            })()}
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
                  { label: 'Completed', value: 'COMPLETED' },
                  { label: 'On Hold', value: 'HELD' },
                  { label: 'Refunded', value: 'REFUNDED' },
                ]}
                showAllOption={true}
                allOptionLabel="All Status"
                placeholder="Status"
                className="w-full h-full"
              />
            </div>

            {/* Payment Method Select */}
            <div className="flex-1 relative z-[40]">
              <SelectInput
                value={paymentFilter === 'all' ? null : paymentFilter}
                onChange={(val) => { setPaymentFilter(val || 'all'); setPage(1); }}
                disabled={statusFilter === 'HELD'}
                placeholder="Payment"
                options={paymentOptions}
                showAllOption={true}
                allOptionLabel="All Payments"
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
                  <>Showing orders since {format(new Date(shiftStatus.activeShift.startTime), 'MMM d, h:mm a')}</>
                )}
                {selectedDateRange === 'previous_shift' && lastShiftSnapshot && (
                  <>Showing orders from {format(new Date(lastShiftSnapshot.startTime), 'MMM d, h:mm a')} to {format(new Date(lastShiftSnapshot.timestamp), 'h:mm a')}</>
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Kpi Strip - horizontal scroll on mobile */}
      <div className="flex overflow-x-auto scrollbar-none gap-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-visible pb-2 sm:pb-0">
        {[
          {
            label: 'Total Sales',
            value: formatAmount(orders.reduce((acc, o) => acc + (o.total || 0), 0)),
            icon: TrendingUp,
            color: 'text-paymint-green',
            bg: 'bg-paymint-green/10',
            onClick: undefined,
            active: false
          },
          {
            label: 'Total Orders',
            value: overallTotalCount,
            icon: ShoppingCart,
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            onClick: () => { setStatusFilter('all'); setPage(1); },
            active: statusFilter === 'all'
          },
          {
            label: 'On Hold',
            value: totalHeldCount,
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
                : 'border-gray-200 dark:border-white/5 hover:border-paymint-green/30'}`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg} ${stat.active ? 'opacity-20' : 'group-hover:opacity-10'}`} />
            <div className="relative z-10 flex items-center gap-3 sm:gap-4">
              <div className={`p-2.5 sm:p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon size={18} className="sm:w-5 sm:h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-500 dark:text-gray-400 tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
            
            {/* Active Indicator Dot */}
            {stat.active && (
              <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-paymint-green animate-pulse" />
            )}
          </div>
        ))}
      </div>

      {/* Orders List Container */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden shadow-sm flex flex-col min-h-[250px] lg:min-h-[350px]">

        {/* Loading State */}
        {isLoading && orders.length === 0 && (
          <div className="py-20 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-paymint-green/10 border-t-paymint-green rounded-full animate-spin mb-4" />
              <p className="text-xs font-black text-gray-400">Loading Orders...</p>
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
              <p className="text-xl font-bold text-gray-900 dark:text-white">No orders found</p>
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
                      {getStatusLabel(order.paymentStatus || order.status || 'PENDING')}
                    </span>
                  </div>

                  {/* Card Body: Customer and Amount */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 dark:text-gray-300 text-sm truncate">
                        {order.customer?.name || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.user?.username ? `Staff: ${order.user.username}` : 'Pos'} • {formatPaymentMethod(order)}
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
                      View Details
                    </button>

                    {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRefund(order);
                        }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-paymint-red hover:bg-paymint-red/10 transition-colors"
                      >
                        <Undo2 size={14} />
                        Refund
                      </button>
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
                      Order
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'date' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'customer' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('customer')}
                  >
                     <div className="flex items-center gap-2">
                      Customer
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'customer' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                    className={`px-6 py-4 text-left text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'total' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    onClick={() => requestSort('total')}
                  >
                     <div className="flex items-center gap-2">
                      Amount
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'total' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th
                     className={`px-6 py-4 text-left text-xs font-black tracking-widest cursor-pointer select-none transition-colors group ${sortConfig?.key === 'status' ? 'text-paymint-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                     onClick={() => requestSort('status')}
                  >
                     <div className="flex items-center gap-2">
                      Status
                      <ArrowUpDown size={14} className={`transition-all ${sortConfig?.key === 'status' ? 'opacity-100 scale-110' : 'opacity-20 group-hover:opacity-100'}`} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-black text-gray-400 tracking-widest">Actions</th>
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
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 dark:text-gray-300 text-sm">{order.customer?.name || 'Walk-in Customer'}</p>
                        <p className="text-xs text-gray-500">{order.user?.username ? `Staff: ${order.user.username}` : 'Pos'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900 dark:text-white">{formatAmount(order.total)}</p>
                        <p className="text-xs text-gray-500 font-bold tracking-wider">{formatPaymentMethod(order)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black tracking-wide border ${getStatusStyle(order.paymentStatus || order.status || 'PENDING')}`}>
                          {getStatusLabel(order.paymentStatus || order.status || 'PENDING')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          <div className="relative" data-action-menu>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenu(activeActionMenu === order.id ? null : order.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${activeActionMenu === order.id
                                ? 'text-paymint-green bg-gray-100 dark:bg-white/5'
                                : 'text-gray-400 hover:text-paymint-green hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                            >
                              <MoreVertical size={16} />
                            </button>

                              {activeActionMenu === order.id && (
                                <div
                                  className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
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
                                      View Details
                                    </button>

                                    {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRefund(order);
                                          setActiveActionMenu(null);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold text-paymint-red hover:bg-paymint-red/10 transition-colors"
                                      >
                                        <Undo2 size={14} />
                                        Refund Order
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
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
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={totalCount}
        itemsPerPage={10}
        className="mt-6"
      />

        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onRefundSuccess={fetchOrders}
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

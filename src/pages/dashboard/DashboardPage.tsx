import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  FileBarChart,
  Calendar,
  PlayCircle,
  History,
  Timer,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subHours } from 'date-fns';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';
import { useRealtime } from '../../hooks/useRealtime';
import { DataChangeEventTypes } from '../../services/realtimeService';
import { useTranslation } from 'react-i18next';
import { getDateLocale } from '../../utils/dateLocale';
import { hasPermission } from '../../config/permissions';

import type { 
  PeakHour, 
  ShiftStatus,
  DashboardStats,
  TopProduct,
  PreviousShiftSnapshot,
  TopSellingItem
} from '../../types';

// Sub-components
import { TourGuide } from '../../components/TourGuide';
import { SetupGuideWelcomeModal } from '../../components/dashboard/SetupGuideWelcomeModal';
import { DashboardStatsCards } from '../../components/dashboard/overview/DashboardStatsCards';
import { RevenueChart } from '../../components/dashboard/overview/RevenueChart';
import { PaymentMethodsBreakdown } from '../../components/dashboard/overview/PaymentMethodsBreakdown';
import { TopSellingProducts } from '../../components/dashboard/overview/TopSellingProducts';
import { PeakHoursChart } from '../../components/dashboard/overview/PeakHoursChart';
import { PayInPayOutLogModal } from '../../components/dashboard/reports/PayInPayOutLogModal';
import { CenteredOverlay, SectionLoader } from '../../components/LoadingState';
import { BusyOverlay } from '../../components/BusyOverlay';
import { ExportMenu } from '../../components/ExportMenu';
import { exportSections } from '../../utils/export';
import type { ExportFormat, ExportSection, ExportMeta } from '../../utils/export';
import { useCurrency } from '../../context/CurrencyContext';
import {
  emptyDashboardStats,
  normalizeDashboardStats,
  normalizePeakHours,
} from '../../utils/reportFallbacks';
import {
  formatInEstablishmentTimezone,
  useEstablishmentTimeZone,
} from '../../utils/establishmentTime';
import type { SetupGuideController } from '../../hooks/useSetupGuideFirstRun';

// View mode types
type ViewMode = 'current_shift' | 'previous_shift' | 'last_24_hours';

// Auto-refresh interval: 1 hour in milliseconds
const AUTO_REFRESH_INTERVAL = 60 * 60 * 1000;

export const DashboardPage = () => {
  const { t } = useTranslation();
  const isRTL = t('common.locale') === 'ar';
  const { currencySymbol } = useCurrency();
  const { locationSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentEstablishment, account } = useAuth();
  const { setupGuide } = useOutletContext<{
    setupGuide: SetupGuideController;
  }>();
  const accountRole = ((account as { role?: string } | null)?.role || '')
    .toString()
    .toUpperCase();
  const isPrivilegedAccount =
    accountRole === 'ACCOUNT_OWNER' || accountRole === 'OWNER' || accountRole === 'ADMIN';
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHour[]>([]);

  // Shift and view mode state
  const [shiftStatus, setShiftStatus] = useState<ShiftStatus | null>(null);
  const [previousShiftSnapshot, setPreviousShiftSnapshot] = useState<PreviousShiftSnapshot | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('last_24_hours');
  const [isViewModeOpen, setIsViewModeOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeDateRange, setActiveDateRange] = useState<{ start: string; end: string }>(() => {
    const now = new Date();
    return {
      start: subHours(now, 24).toISOString(),
      end: now.toISOString(),
    };
  });
  
  // Modals
  const [showPayInOutModal, setShowPayInOutModal] = useState(false);
  const [showTasksTour, setShowTasksTour] = useState(false);
  const setupReplayRequestRef = useRef<string | null>(null);
  const isSetupLaunchRequest = searchParams.get('setup') === '1' || searchParams.get('welcome') === '1';
  const clearSetupLaunchParams = useCallback(() => {
    if (!isSetupLaunchRequest) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('setup');
    nextParams.delete('welcome');
    const nextSearch = nextParams.toString();
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true },
    );
  }, [isSetupLaunchRequest, location.pathname, navigate, searchParams]);

  useEffect(() => {
    if (!isSetupLaunchRequest || !currentEstablishment?.id) {
      setupReplayRequestRef.current = null;
      return;
    }

    const replayKey = `${currentEstablishment.id}:${location.search}`;
    if (setupReplayRequestRef.current === replayKey) return;
    setupReplayRequestRef.current = replayKey;

    // Query-param launch is still server-authorized. The normal state -> claim
    // flow remains active in parallel so a new location records its first run.
    void setupGuide.replay();
    // Consume the one-shot URL immediately. Waiting for the request would let
    // a slow response navigate the user back here after they had already left.
    clearSetupLaunchParams();
  }, [
    clearSetupLaunchParams,
    currentEstablishment?.id,
    isSetupLaunchRequest,
    location.search,
    setupGuide.replay,
  ]);

  const waitForTasksGuideTargets = useCallback(async () => {
    const timeoutAt = Date.now() + 5000;

    while (Date.now() < timeoutAt) {
      const firstTarget = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[data-tour-id="tasks-setup-overview"]',
        ),
      ).find((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 2 && rect.height > 2;
      });

      if (firstTarget) {
        setShowTasksTour(true);
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
  }, []);

  const handleStartTasks = () => {
    window.dispatchEvent(new Event('mintcom-open-tasks'));
    void waitForTasksGuideTargets();
  };

  const handleCloseSetupTour = () => {
    setShowTasksTour(false);
    void setupGuide.reportProgress('DISMISSED');
  };

  const handleCompleteSetupTour = () => {
    setShowTasksTour(false);
    void setupGuide.reportProgress('COMPLETED');
  };

  const fallbackShiftStatus: ShiftStatus = useMemo(
    () => ({
      shiftStatus: 'NO_SHIFT',
      activeShift: null,
      netSales: 0,
      numberOfOrders: 0,
      cashSales: 0,
      cardSales: 0,
      otherPayments: 0,
      payIn: 0,
      payOut: 0,
      totalTimeWorked: '0 minutes',
    }),
    [],
  );

  const canViewDashboardAnalytics = useMemo(
    () =>
      isPrivilegedAccount ||
      hasPermission(account?.permissions, ['dashboard', 'view_orders', 'view_reports']),
    [account?.permissions, isPrivilegedAccount],
  );
  const canOpenReportsPage = useMemo(
    () => isPrivilegedAccount || hasPermission(account?.permissions, ['view_reports']),
    [account?.permissions, isPrivilegedAccount],
  );

  const establishmentTimeZone = useEstablishmentTimeZone();

  // Ref for click outside handling
  const viewModeRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewModeRef.current && !viewModeRef.current.contains(event.target as Node)) {
        setIsViewModeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch shift status from backend
  const fetchShiftStatus = useCallback(async () => {
    try {
      const response = await api.get('/dashboard/live-shift');
      setShiftStatus(response.data);

      // Auto-select view mode based on shift status
      if (response.data.shiftStatus === 'ACTIVE') {
        // If there's an active shift, default to current shift view
        setViewMode('current_shift');
      } else if (response.data.shiftStatus === 'LAST_SHIFT') {
        // If there's a last shift, default to 24 hours view
        setViewMode('last_24_hours');
      } else {
        // No shifts, show 24 hours data
        setViewMode('last_24_hours');
      }
    } catch (error) {
      console.error('Failed to fetch shift status:', error);
      setShiftStatus(fallbackShiftStatus);
    }
  }, [fallbackShiftStatus]);

  // Refresh shift status without changing view mode (for real-time updates)
  const refreshShiftStatus = useCallback(async () => {
    try {
      console.log('[Dashboard] Refreshing shift status due to real-time event');
      const response = await api.get('/dashboard/live-shift');
      setShiftStatus(response.data);
      // Don't auto-select view mode here - preserve user's selection
    } catch (error) {
      console.error('Failed to refresh shift status:', error);
    }
  }, []);

  // Fetch dashboard data based on view mode. `silent` skips the blocking
  // loading state — used for background refreshes (realtime events, hourly
  // auto-refresh) so the user isn't interrupted by the busy overlay.
  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);

      let start: string;
      let end: string;

      if (viewMode === 'last_24_hours') {
        // Last 24 hours from now
        const now = new Date();
        start = subHours(now, 24).toISOString();
        end = now.toISOString();
      } else if (viewMode === 'current_shift' && shiftStatus?.activeShift) {
        // Current shift data
        start = new Date(shiftStatus.activeShift.startTime).toISOString();
        end = new Date().toISOString();
      } else if (viewMode === 'previous_shift' && shiftStatus?.shiftStatus !== 'NO_SHIFT') {
        // Previous shift - fetch last shift snapshot
        const snapshotRes = await api.get('/dashboard/last-shift-snapshot').catch(() => ({ data: null }));
        if (snapshotRes.data) {
          setPreviousShiftSnapshot(snapshotRes.data);
          start = new Date(snapshotRes.data.startTime).toISOString();
          end = new Date(snapshotRes.data.timestamp).toISOString();
        } else {
          setPreviousShiftSnapshot(null);
          // Fallback to last 24 hours
          const now = new Date();
          start = subHours(now, 24).toISOString();
          end = now.toISOString();
        }
      } else {
        // Default to last 24 hours
        const now = new Date();
        start = subHours(now, 24).toISOString();
        end = now.toISOString();
      }

      setLastRefresh(new Date());
      setActiveDateRange({ start, end });

      if (!canViewDashboardAnalytics) {
        setStats(emptyDashboardStats());
        setTopProducts([]);
        setPeakHours([]);
        return;
      }

      // Track if any API call failed
      let hasError = false;

      // On Hold KPI must use HeldOrder count (same source as Orders page), not
      // historical-summary.pendingOrders — that field is never populated by the API.
      const [summaryRes, topItemsRes, peakRes, categoryRes, heldOrdersCountRes] = await Promise.all([
        api.get('/reports/historical-summary', { params: { startDate: start, endDate: end, timezone: establishmentTimeZone } }).catch((err) => { hasError = true; console.error('Summary API error:', err); return { data: null }; }),
        api.get('/reports/top-selling-items', { params: { startDate: start, endDate: end, limit: 5 } }).catch((err) => { hasError = true; console.error('Top items API error:', err); return { data: [] }; }),
        api.get('/reports/peak-hours', { params: { startDate: start, endDate: end, timezone: establishmentTimeZone } }).catch((err) => { hasError = true; console.error('Peak hours API error:', err); return { data: [] }; }),
        api.get('/reports/category-report', { params: { startDate: start, endDate: end } }).catch((err) => { hasError = true; console.error('Category API error:', err); return { data: { breakdown: [] } }; }),
        api.get('/api/held-orders/count').catch((err) => { hasError = true; console.error('Held orders count API error:', err); return { data: { count: 0 } }; })
      ]);

      // Show warning if any API failed
      if (hasError && summaryRes.data === null) {
        console.warn('Some dashboard data could not be loaded');
      }

      // Process stats. Successful empty/null payloads are normalized to zero-state data.
      const summaryData = normalizeDashboardStats(summaryRes.data);
      const heldOrdersCount = Number(heldOrdersCountRes.data?.count) || 0;
      const categoryData = Array.isArray(categoryRes.data?.breakdown) ? categoryRes.data.breakdown : [];
      
      // Process categories specifically from the robust report endpoint
      const processedCategories = categoryData.map((cat: any) => ({
          name: cat.name || cat.itemName || t('common.unknown'),
          value: cat.value || cat.revenue || cat.totalSales || 0,
          count: cat.count || cat.quantity || cat.orders || 0
      })).sort((a: any, b: any) => b.value - a.value);

      setStats(normalizeDashboardStats(summaryData, {
        totalRevenue: summaryData.totalRevenue,
        totalOrders: summaryData.totalOrders,
        averageOrderValue: summaryData.averageOrderValue,
        pendingOrders: heldOrdersCount,
        completedOrders: summaryData.completedOrders || summaryData.totalOrders,
        activeEmployees: summaryData.activeEmployees,
        taxCollected: summaryData.taxCollected,
        totalRefunds: summaryData.totalRefunds,
        grossProfit: summaryData.grossProfit,
        totalPayIn: summaryData.totalPayIn,
        totalPayOut: summaryData.totalPayOut,
        paymentMethodBreakdown: summaryData.paymentMethodBreakdown,
        cardTypeBreakdown: summaryData.cardTypeBreakdown,
        otherPaymentBreakdown: summaryData.otherPaymentBreakdown,
        categoryBreakdown: processedCategories.length > 0 ? processedCategories : (summaryData.categoryBreakdown || []),
        dailyBreakdown: summaryData.dailyBreakdown,
      }));

      // Process top products
      const topItems = (Array.isArray(topItemsRes.data) ? topItemsRes.data : []) as TopSellingItem[];
      setTopProducts(topItems.map((item: any) => ({
        name: item.itemName || item.name || t('common.unknown'),
        orders: item.quantity || item.orders || item.count || 0,
        revenue: item.revenue || item.totalSales || item.value || 0,
      })));

      // Process peak hours
      setPeakHours(normalizePeakHours(peakRes.data));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setStats(emptyDashboardStats());
      setTopProducts([]);
      setPeakHours([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [establishmentTimeZone, canViewDashboardAnalytics, t, viewMode, shiftStatus]);

  // Initial load: fetch shift status first
  useEffect(() => {
    fetchShiftStatus();
  }, [currentEstablishment?.id, fetchShiftStatus]);

  // Fetch dashboard data when view mode or shift status changes. Only a real
  // view-mode switch (or the first load) blocks the UI — shiftStatus identity
  // changes from background refreshes refetch silently.
  const prevViewModeRef = useRef<ViewMode | null>(null);
  useEffect(() => {
    if (shiftStatus !== null) {
      const isUserSwitch = prevViewModeRef.current !== viewMode;
      fetchDashboardData(!isUserSwitch);
      prevViewModeRef.current = viewMode;
    }
  }, [viewMode, shiftStatus, fetchDashboardData]);

  // Auto-refresh every hour for 24-hour data (background, non-blocking)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShiftStatus();
      fetchDashboardData(true);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchShiftStatus, fetchDashboardData]);

  // Real-time updates authenticate with the HttpOnly session cookie.
  const { onRefresh, isConnected, status } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
  });

  // Log connection status changes
  useEffect(() => {
    console.log('[Dashboard] 📡 Real-time connection status:', status, 'isConnected:', isConnected);
  }, [status, isConnected]);

  // Use refs to avoid re-subscribing when fetch functions change
  const refreshShiftStatusRef = useRef(refreshShiftStatus);
  const fetchDashboardDataRef = useRef(fetchDashboardData);

  useEffect(() => {
    refreshShiftStatusRef.current = refreshShiftStatus;
  }, [refreshShiftStatus]);

  useEffect(() => {
    fetchDashboardDataRef.current = fetchDashboardData;
  }, [fetchDashboardData]);

  // Listen for real-time events and refresh data
  // Use stable callback that references latest functions via refs
  useEffect(() => {
    console.log('[Dashboard] 📡 Registering real-time event listener');
    const unsubscribe = onRefresh((eventType) => {
      console.log('[Dashboard] 📥 Received real-time event:', eventType);
      // Refresh data when orders are created or updated
      if (eventType === DataChangeEventTypes.ORDER_CREATED ||
          eventType === DataChangeEventTypes.ORDER_UPDATED ||
          eventType === DataChangeEventTypes.ORDER_REFUNDED ||
          eventType === DataChangeEventTypes.CUSTOMER_CREATED ||
          eventType === DataChangeEventTypes.CUSTOMER_UPDATED ||
          eventType === DataChangeEventTypes.CUSTOMER_DELETED ||
          eventType === DataChangeEventTypes.STAFF_CREATED ||
          eventType === DataChangeEventTypes.STAFF_UPDATED ||
          eventType === DataChangeEventTypes.STAFF_DELETED ||
          eventType === DataChangeEventTypes.SETTINGS_UPDATED ||
          eventType === DataChangeEventTypes.HELD_ORDER_CREATED ||
          eventType === DataChangeEventTypes.HELD_ORDER_UPDATED ||
          eventType === DataChangeEventTypes.HELD_ORDER_DELETED) {
        refreshShiftStatusRef.current();
        // Background refresh: don't block the UI for realtime events.
        fetchDashboardDataRef.current(true);
      }
      // Special handling for shift events - auto-switch to current shift view when shift starts
      if (eventType === DataChangeEventTypes.SHIFT_STARTED) {
        console.log('[Dashboard] 🟢 Shift started - refreshing and switching to current shift view');
        refreshShiftStatusRef.current().then(() => {
          setViewMode('current_shift');
        });
      }
      if (eventType === DataChangeEventTypes.SHIFT_ENDED) {
        console.log('[Dashboard] 🔴 Shift ended - refreshing and switching to 24h view');
        refreshShiftStatusRef.current().then(() => {
          setViewMode('last_24_hours');
        });
      }
    });

    return unsubscribe;
  }, [onRefresh]); // Only depend on onRefresh, not on the fetch functions

  // Get available view modes based on shift status
  const getAvailableViewModes = (): { mode: ViewMode; label: string; icon: React.ReactNode; description: string }[] => {
    const modes: { mode: ViewMode; label: string; icon: React.ReactNode; description: string }[] = [];

    if (shiftStatus?.shiftStatus === 'ACTIVE') {
      modes.push({
        mode: 'current_shift',
        label: t('dashboard.viewMode.currentShift'),
        icon: <PlayCircle size={16} />,
        description: t('dashboard.shiftStatus.started', { time: shiftStatus.activeShift ? format(new Date(shiftStatus.activeShift.startTime), 'h:mm a', { locale: getDateLocale(t('common.locale')) }) : '' })
      });
    }

    if (shiftStatus?.shiftStatus === 'ACTIVE' || shiftStatus?.shiftStatus === 'LAST_SHIFT') {
      modes.push({
        mode: 'previous_shift',
        label: t('dashboard.viewMode.previousShift'),
        icon: <History size={16} />,
        description: t('dashboard.shiftStatus.lastCompleted')
      });
    }

    modes.push({
      mode: 'last_24_hours',
      label: t('dashboard.viewMode.last24Hours'),
      icon: <Timer size={16} />,
      description: t('dashboard.shiftStatus.rolling24h')
    });

    return modes;
  };

  const formatDate = () => {
    return new Date().toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greetings.morning');
    if (hour < 18) return t('dashboard.greetings.afternoon');
    return t('dashboard.greetings.evening');
  };

  // Get current view mode info
  const currentViewModeInfo = getAvailableViewModes().find(m => m.mode === viewMode);

  // Format shift employee name
  const getShiftEmployeeName = () => {
    if (!shiftStatus?.activeShift?.employee) return t('common.pos');
    const emp = shiftStatus.activeShift.employee;
    return `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username;
  };

  // Export the current overview, reflecting the active view-mode filter.
  const handleExportOverview = (format: ExportFormat) => {
    const localeTag = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
    const money = (n: number) => (Number(n) || 0).toLocaleString(localeTag, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const numFmt = (n: number) => (Number(n) || 0).toLocaleString(localeTag);
    const fmtDate = (iso: string) => formatInEstablishmentTimezone(iso, localeTag, undefined, currentEstablishment);

    const cur = (label: string) => `${label} (${currencySymbol})`;
    const title = `${t('dashboard.menu.salesAndReporting')} — ${currentViewModeInfo?.label || ''}`.trim();

    const meta: ExportMeta = [
      { label: t('orders.exportFields.date'), value: `${fmtDate(activeDateRange.start)} — ${fmtDate(activeDateRange.end)}` },
    ];
    if (currentEstablishment?.name) meta.push({ label: t('common.location'), value: currentEstablishment.name });
    if (currentViewModeInfo?.label) meta.push({ label: t('dashboard.viewMode.last24Hours'), value: currentViewModeInfo.label });

    const sections: ExportSection[] = [];

    // KPI summary as label/value rows.
    if (stats) {
      sections.push({
        name: t('dashboard.menu.salesSummary'),
        columns: [
          { key: 'metric', label: t('common.name', { defaultValue: 'Metric' }) },
          { key: 'value', label: t('orders.reports.shifts.variance', { defaultValue: 'Value' }) },
        ],
        rows: [
          { metric: cur(t('orders.reports.export.salesInclTax')), value: money(stats.totalRevenue) },
          { metric: cur(t('orders.reports.export.salesExclTax')), value: money((stats.totalRevenue || 0) - (stats.taxCollected || 0)) },
          { metric: cur(t('dashboard.stats.tax', { defaultValue: 'Tax Collected' })), value: money(stats.taxCollected) },
          { metric: cur(t('orders.reports.sales.serviceCharge')), value: money(stats.netServiceChargeCollected ?? stats.serviceChargeCollected ?? 0) },
          { metric: cur(t('orders.reports.sales.netSales')), value: money(stats.netSalesBeforeTaxAndServiceCharge ?? ((stats.totalRevenue || 0) - (stats.taxCollected || 0) - (stats.netServiceChargeCollected ?? stats.serviceChargeCollected ?? 0))) },
          { metric: t('dashboard.stats.orders', { defaultValue: 'Orders' }), value: numFmt(stats.totalOrders) },
          { metric: cur(t('orders.reports.export.averageOrderValue')), value: money(stats.averageOrderValue) },
          { metric: cur(t('dashboard.stats.grossProfit', { defaultValue: 'Gross Profit' })), value: money(stats.grossProfit) },
          { metric: cur(t('dashboard.stats.refunds', { defaultValue: 'Refunds' })), value: money(stats.totalRefunds) },
          { metric: cur(t('dashboard.stats.payIn', { defaultValue: 'Pay In' })), value: money(stats.totalPayIn) },
          { metric: cur(t('dashboard.stats.payOut', { defaultValue: 'Pay Out' })), value: money(stats.totalPayOut) },
        ],
      });
    }

    if (stats?.paymentMethodBreakdown?.length) {
      sections.push({
        name: t('dashboard.menu.paymentsReports'),
        columns: [
          { key: 'name', label: t('orders.exportFields.paymentMethod') },
          { key: 'count', label: t('orders.reports.sales.numOrders') },
          { key: 'value', label: cur(t('dashboard.stats.revenue')) },
        ],
        rows: stats.paymentMethodBreakdown.map(p => ({ name: p.name, count: numFmt(p.count || 0), value: money(p.value) })),
      });
    }

    if (topProducts?.length) {
      sections.push({
        name: t('dashboard.menu.salesByItems'),
        columns: [
          { key: 'name', label: t('orders.table.order') },
          { key: 'orders', label: t('orders.reports.items.unitsSold') },
          { key: 'revenue', label: cur(t('orders.reports.items.grossRevenue')) },
        ],
        rows: topProducts.map(p => ({ name: p.name, orders: numFmt(p.orders), revenue: money(p.revenue) })),
      });
    }

    if (stats?.categoryBreakdown?.length) {
      sections.push({
        name: t('dashboard.menu.salesByItems'),
        columns: [
          { key: 'name', label: t('categories.title', { defaultValue: 'Categories' }) },
          { key: 'value', label: cur(t('dashboard.stats.revenue')) },
          { key: 'count', label: t('orders.exportFields.orderNumber') },
        ],
        rows: stats.categoryBreakdown.map(c => ({ name: c.name, value: money(c.value), count: numFmt(c.count || 0) })),
      });
    }

    if (peakHours?.length) {
      sections.push({
        name: t('dashboard.stats.peakHours'),
        columns: [
          { key: 'hour', label: t('orders.reports.sales.hours') },
          { key: 'count', label: t('orders.reports.sales.numOrders') },
          { key: 'netTotal', label: cur(t('orders.reports.export.salesExclTax')) },
          { key: 'tax', label: cur(t('orders.reports.sales.totalTax')) },
          { key: 'total', label: cur(t('orders.reports.export.salesInclTax')) },
        ],
        // Drop the hours the venue was closed — the API returns all 24 so the
        // chart has a full axis, but a table of zeros helps nobody.
        rows: peakHours
          .filter(p => (p.count || 0) !== 0 || Math.abs(p.total || 0) >= 0.005)
          .map(p => ({
          hour: p.hour,
          count: numFmt(p.count),
          netTotal: money(p.netTotal ?? (p.total - (p.tax ?? 0))),
          tax: money(p.tax ?? 0),
          total: money(p.total),
        })),
      });
    }

    if (sections.length === 0) {
      return;
    }

    return exportSections(format, { filename: `dashboard_overview_${viewMode}`, title, meta, sections });
  };

  return (
    <>
      {/* Full-screen blocker while a user-triggered load (view-mode switch)
          is in flight — background/realtime refreshes stay silent. */}
      <BusyOverlay visible={isLoading && !!stats} message={t('dashboard.processing')} />
      <AnimatePresence mode="wait">
        {isLoading && !stats ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CenteredOverlay>
              <SectionLoader message={t('dashboard.loading')} minHeightClassName="" />
            </CenteredOverlay>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6 sm:space-y-8 pb-24 sm:pb-10 font-sans"
            dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              {/* Top row: Status and greeting */}
              <div>
                <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                  {/* Real Shift Status Badge */}
                  <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold tracking-wide border ${shiftStatus?.shiftStatus === 'ACTIVE'
                    ? 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20'
                    : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                    }`}>
                    {shiftStatus?.shiftStatus === 'ACTIVE'
                      ? t('dashboard.shiftStatus.active', { name: getShiftEmployeeName() })
                      : t('dashboard.shiftStatus.none')}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{getGreeting()}</h1>
                <div className="flex items-center gap-2 sm:gap-3 mt-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base flex-wrap">
                  <Calendar size={14} className="sm:w-4 sm:h-4" />
                  <span>{formatDate()}</span>
                  {currentEstablishment?.name && (
                      <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20 hidden sm:block" />
                          <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-sans border border-mintcom-green/20">
                              {currentEstablishment.name}
                          </span>
                      </>
                  )}
                </div>
              </div>

              {/* Action buttons - stack on mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* View Mode Selector */}
                <div id="tour-view-mode" className="relative flex-1 sm:flex-none" ref={viewModeRef}>
                  <button
                    onClick={() => setIsViewModeOpen(!isViewModeOpen)}
                    className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-[color,background-color,border-color,box-shadow,ring] min-w-[180px] ${isViewModeOpen ? 'ring-[3px] ring-mintcom-green/10 border-mintcom-green bg-gray-50' : ''}`}
                  >
                    {currentViewModeInfo?.icon}
                    <span className="flex-1 text-left">{currentViewModeInfo?.label}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isViewModeOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {isViewModeOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden z-50"
                      >
                        {getAvailableViewModes().map((mode) => (
                          <button
                            key={mode.mode}
                            onClick={() => {
                              setViewMode(mode.mode);
                              setIsViewModeOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${viewMode === mode.mode ? 'bg-mintcom-green/10' : ''
                              }`}
                          >
                            <span className={viewMode === mode.mode ? 'text-mintcom-green' : 'text-gray-400'}>{mode.icon}</span>
                            <div className="flex-1 text-left">
                              <p className={`text-sm font-bold ${viewMode === mode.mode ? 'text-mintcom-green' : 'text-gray-900 dark:text-white'}`}>
                                {mode.label}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{mode.description}</p>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Action buttons row */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {canViewDashboardAnalytics && (
                    <ExportMenu onExport={handleExportOverview} className="flex-1 sm:flex-none justify-center" />
                  )}
                  {canOpenReportsPage && (
                    <button
                      onClick={() => navigate(`/dashboard/${locationSlug}/reports/sales`)}
                      className="flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all touch-target"
                    >
                      <FileBarChart size={18} className="text-mintcom-green" />
                      <span className="hidden xs:inline">{t('dashboard.menu.salesAndReporting')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* View Mode Info Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm shadow-gray-200/70 dark:shadow-black/20 ring-1 ring-gray-200/60 dark:ring-white/5">
              <div className="flex items-center gap-3">
                {currentViewModeInfo?.icon && (
                  <span className="text-mintcom-green">{currentViewModeInfo.icon}</span>
                )}
                <div>
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                    {viewMode === 'current_shift' && shiftStatus?.activeShift && (
                      <>{t('dashboard.viewMode.showingSince', { date: format(new Date(shiftStatus.activeShift.startTime), 'MMM d, h:mm a', { locale: getDateLocale(t('common.locale')) }) })}</>
                    )}
                    {viewMode === 'previous_shift' && t('dashboard.viewMode.showingLastShift')}
                    {viewMode === 'last_24_hours' && t('dashboard.viewMode.showingLast24h')}
                  </span>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wide">
                {t('dashboard.lastUpdated')} {format(lastRefresh, 'h:mm a', { locale: getDateLocale(t('common.locale')) })}
              </span>
            </div>

            {!canViewDashboardAnalytics && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
                {t('dashboard.permissions.analyticsRequired', {
                  defaultValue: 'You do not have permission to load dashboard analytics.',
                })}
              </div>
            )}

            {/* Components Grid */}
            <DashboardStatsCards 
              stats={stats} 
              viewMode={viewMode} 
              previousShiftSnapshot={previousShiftSnapshot}
              setShowPayInOutModal={setShowPayInOutModal}
            />

            <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 sm:gap-6">
              <RevenueChart 
                dailyBreakdown={stats?.dailyBreakdown || []}
                viewMode={viewMode}
                selectedDateRange={viewMode === 'last_24_hours' ? 'today' : 'custom'} 
              />
              <PaymentMethodsBreakdown 
                paymentMethodBreakdown={stats?.paymentMethodBreakdown || []}
                cardTypeBreakdown={stats?.cardTypeBreakdown || []}
                otherPaymentBreakdown={stats?.otherPaymentBreakdown || []}
                viewMode={viewMode}
              />
            </div>

            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 sm:gap-6">
              <TopSellingProducts 
                topProducts={topProducts}
                categoryBreakdown={stats?.categoryBreakdown || []}
                viewMode={viewMode}
                canViewReports={canOpenReportsPage}
              />
              <PeakHoursChart 
                peakHours={peakHours} 
              />
            </div>

            <PayInPayOutLogModal
              isOpen={showPayInOutModal}
              onClose={() => setShowPayInOutModal(false)}
              startDate={activeDateRange.start}
              endDate={activeDateRange.end}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <SetupGuideWelcomeModal
        isOpen={setupGuide.isOpen}
        onClose={setupGuide.close}
        onStart={handleStartTasks}
        establishmentName={currentEstablishment?.name}
      />

      <TourGuide
        isOpen={showTasksTour}
        onClose={handleCloseSetupTour}
        onComplete={handleCompleteSetupTour}
        steps={[
          {
            targetId: 'tasks-setup-overview',
            title: t('dashboard.tour.tasks.title'),
            description: t('dashboard.tour.tasks.desc'),
            position: isRTL ? 'right' : 'left'
          },
          {
            targetId: 'task-item-location-profile',
            title: t('dashboard.tour.taskItem.title'),
            description: t('dashboard.tour.taskItem.desc'),
            position: isRTL ? 'right' : 'left'
          }
        ]}
      />
    </>
  );
};

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileBarChart,
  Calendar,
  PlayCircle,
  History,
  Timer,
  ChevronDown,
  PartyPopper,
  X
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
import { DashboardStatsCards } from '../../components/dashboard/overview/DashboardStatsCards';
import { RevenueChart } from '../../components/dashboard/overview/RevenueChart';
import { PaymentMethodsBreakdown } from '../../components/dashboard/overview/PaymentMethodsBreakdown';
import { TopSellingProducts } from '../../components/dashboard/overview/TopSellingProducts';
import { PeakHoursChart } from '../../components/dashboard/overview/PeakHoursChart';
import { PayInPayOutLogModal } from '../../components/dashboard/reports/PayInPayOutLogModal';

// View mode types
type ViewMode = 'current_shift' | 'previous_shift' | 'last_24_hours';

// Auto-refresh interval: 1 hour in milliseconds
const AUTO_REFRESH_INTERVAL = 60 * 60 * 1000;

export const DashboardPage = () => {
  const { t } = useTranslation();
  const isRTL = t('common.locale') === 'ar';
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const { currentEstablishment, account } = useAuth();
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
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [showTasksTour, setShowTasksTour] = useState(false);

  // Check if first visit to this location's dashboard
  useEffect(() => {
    if (locationSlug) {
      const visitedKey = `paymint.dashboard.visited.${locationSlug}`;
      if (!localStorage.getItem(visitedKey)) {
        setShowWelcomePopup(true);
        localStorage.setItem(visitedKey, 'true');
      }
    }
  }, [locationSlug]);

  const handleStartTasks = () => {
    setShowWelcomePopup(false);
    window.dispatchEvent(new Event('paymint-open-tasks'));
    setTimeout(() => {
      setShowTasksTour(true);
    }, 500);
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

  const browserTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

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

  // Fetch dashboard data based on view mode
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

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
        setStats({
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
        setTopProducts([]);
        setPeakHours([]);
        return;
      }

      // Track if any API call failed
      let hasError = false;
      const nowForPendingOrders = new Date();
      const pendingOrdersStart = subHours(nowForPendingOrders, 24).toISOString();
      const pendingOrdersEnd = nowForPendingOrders.toISOString();

      const [summaryRes, topItemsRes, peakRes, categoryRes, pendingOrdersRes] = await Promise.all([
        api.get('/reports/historical-summary', { params: { startDate: start, endDate: end } }).catch((err) => { hasError = true; console.error('Summary API error:', err); return { data: null }; }),
        api.get('/reports/top-selling-items', { params: { startDate: start, endDate: end, limit: 5 } }).catch((err) => { hasError = true; console.error('Top items API error:', err); return { data: [] }; }),
        api.get('/reports/peak-hours', { params: { startDate: start, endDate: end, timezone: browserTimeZone } }).catch((err) => { hasError = true; console.error('Peak hours API error:', err); return { data: [] }; }),
        api.get('/reports/category-report', { params: { startDate: start, endDate: end } }).catch((err) => { hasError = true; console.error('Category API error:', err); return { data: { breakdown: [] } }; }),
        api.get('/reports/historical-summary', { params: { startDate: pendingOrdersStart, endDate: pendingOrdersEnd } }).catch((err) => { hasError = true; console.error('Pending orders API error:', err); return { data: null }; })
      ]);

      // Show warning if any API failed
      if (hasError && summaryRes.data === null) {
        console.warn('Some dashboard data could not be loaded');
      }

      // Process stats
      const summaryData = summaryRes.data || {};
      const pendingOrdersData = pendingOrdersRes.data || {};
      const pendingOrdersLast24Hours = Number(pendingOrdersData.pendingOrders) || 0;
      const categoryData = Array.isArray(categoryRes.data?.breakdown) ? categoryRes.data.breakdown : [];
      
      // Process categories specifically from the robust report endpoint
      const processedCategories = categoryData.map((cat: any) => ({
          name: cat.name || cat.itemName || t('common.unknown'),
          value: cat.value || cat.revenue || cat.totalSales || 0,
          count: cat.count || cat.quantity || cat.orders || 0
      })).sort((a: any, b: any) => b.value - a.value);

      setStats({
        totalRevenue: summaryData.totalRevenue || 0,
        totalOrders: summaryData.totalOrders || 0,
        averageOrderValue: summaryData.averageOrderValue || 0,
        pendingOrders: pendingOrdersLast24Hours,
        completedOrders: summaryData.completedOrders || summaryData.totalOrders || 0,
        activeEmployees: summaryData.activeEmployees || 0,
        taxCollected: summaryData.taxCollected || 0,
        totalRefunds: summaryData.totalRefunds || 0,
        grossProfit: summaryData.grossProfit || 0,
        totalPayIn: summaryData.totalPayIn || 0,
        totalPayOut: summaryData.totalPayOut || 0,
        paymentMethodBreakdown: summaryData.paymentMethodBreakdown || [],
        categoryBreakdown: processedCategories.length > 0 ? processedCategories : (summaryData.categoryBreakdown || []),
        dailyBreakdown: summaryData.dailyBreakdown || []
      });

      // Process top products
      const topItems = (Array.isArray(topItemsRes.data) ? topItemsRes.data : []) as TopSellingItem[];
      setTopProducts(topItems.map((item: any) => ({
        name: item.itemName || item.name || t('common.unknown'),
        orders: item.quantity || item.orders || item.count || 0,
        revenue: item.revenue || item.totalSales || item.value || 0,
      })));

      // Process peak hours
      setPeakHours(Array.isArray(peakRes.data) ? peakRes.data : []);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [browserTimeZone, canViewDashboardAnalytics, t, viewMode, shiftStatus]);

  // Initial load: fetch shift status first
  useEffect(() => {
    fetchShiftStatus();
  }, [currentEstablishment?.id, fetchShiftStatus]);

  // Fetch dashboard data when view mode or shift status changes
  useEffect(() => {
    if (shiftStatus !== null) {
      fetchDashboardData();
    }
  }, [viewMode, shiftStatus, fetchDashboardData]);

  // Auto-refresh every hour for 24-hour data
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShiftStatus();
      fetchDashboardData();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchShiftStatus, fetchDashboardData]);

  // Real-time updates - pass auth token for proper WebSocket authentication
  const accessToken = localStorage.getItem('accessToken');
  const { onRefresh, isConnected, status } = useRealtime({
    establishmentId: currentEstablishment?.id || null,
    authToken: accessToken || undefined,
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
          eventType === DataChangeEventTypes.HELD_ORDER_CREATED ||
          eventType === DataChangeEventTypes.HELD_ORDER_UPDATED ||
          eventType === DataChangeEventTypes.HELD_ORDER_DELETED) {
        refreshShiftStatusRef.current();
        fetchDashboardDataRef.current();
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

  return (
    <AnimatePresence mode="wait">
      {isLoading && !stats ? (
        <motion.div
          key="loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] space-y-6"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-paymint-green/20 rounded-full" />
            <div className="w-16 h-16 border-4 border-paymint-green border-t-transparent rounded-full animate-spin absolute inset-0" />
          </div>
          <p className="text-xs font-black text-gray-400 tracking-widest">{t('dashboard.loading')}</p>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-24 sm:pb-10 font-sans"
          dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            {/* Top row: Status and greeting */}
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                {/* Real Shift Status Badge */}
                <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold tracking-wide border ${shiftStatus?.shiftStatus === 'ACTIVE'
                  ? 'bg-paymint-green/10 text-paymint-green border-paymint-green/20'
                  : 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
                  }`}>
                  {shiftStatus?.shiftStatus === 'ACTIVE'
                    ? t('dashboard.shiftStatus.active', { name: getShiftEmployeeName() })
                    : t('dashboard.shiftStatus.none')}
                </span>

                {/* Live indicator for active shift */}
                {shiftStatus?.shiftStatus === 'ACTIVE' && (
                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
                    </div>
                    <span className="text-xs font-bold text-paymint-green tracking-widest">{t('dashboard.shiftStatus.live')}</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">{getGreeting()}</h1>
              <div className="flex items-center gap-2 sm:gap-3 mt-2 text-gray-500 dark:text-gray-400 text-sm sm:text-base flex-wrap">
                <Calendar size={14} className="sm:w-4 sm:h-4" />
                <span>{formatDate()}</span>
                {currentEstablishment?.name && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20 hidden sm:block" />
                        <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
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
                  className={`w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-[color,background-color,border-color,box-shadow,ring] min-w-[180px] ${isViewModeOpen ? 'ring-[3px] ring-paymint-green/10 border-paymint-green bg-gray-50' : ''}`}
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
                      className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0B1120] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden z-50"
                    >
                      {getAvailableViewModes().map((mode) => (
                        <button
                          key={mode.mode}
                          onClick={() => {
                            setViewMode(mode.mode);
                            setIsViewModeOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${viewMode === mode.mode ? 'bg-paymint-green/10' : ''
                            }`}
                        >
                          <span className={viewMode === mode.mode ? 'text-paymint-green' : 'text-gray-400'}>{mode.icon}</span>
                          <div className="flex-1 text-left">
                            <p className={`text-sm font-bold ${viewMode === mode.mode ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>
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

                {canOpenReportsPage && (
                  <button
                    onClick={() => navigate(`/dashboard/${locationSlug}/reports`)}
                    className="flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white font-bold text-sm border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all touch-target"
                  >
                    <FileBarChart size={18} className="text-paymint-green" />
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
                <span className="text-paymint-green">{currentViewModeInfo.icon}</span>
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

          {/* Welcome Popup */}
          <AnimatePresence>
            {showWelcomePopup && (
              <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowWelcomePopup(false)}
                  className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="relative w-full max-w-sm bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden"
                >
                  <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-[#7CC39F]/10 flex items-center justify-center">
                      <PartyPopper size={32} className="text-[#7CC39F]" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {t('common.congratulations')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                      {t('dashboard.welcome.message', {
                        location: currentEstablishment?.name || 'this location'
                      })}
                    </p>

                    <button
                      onClick={handleStartTasks}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-[#7CC39F] to-[#5BA882] hover:brightness-105 text-white font-bold rounded-xl shadow-lg shadow-[#7CC39F]/30 transition-all active:scale-[0.98]"
                    >
                      {t('dashboard.welcome.startGuide')}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setShowWelcomePopup(false)}
                    className="absolute top-4 right-4 rtl:left-4 rtl:right-auto p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <TourGuide
            isOpen={showTasksTour}
            onClose={() => setShowTasksTour(false)}
            onComplete={() => setShowTasksTour(false)}
            steps={[
              {
                targetId: 'tasks-widget-panel',
                title: t('dashboard.tour.tasks.title'),
                description: t('dashboard.tour.tasks.desc'),
                position: isRTL ? 'right' : 'left'
              },
              {
                targetId: 'widget-task-item-location-profile',
                title: t('dashboard.tour.taskItem.title'),
                description: t('dashboard.tour.taskItem.desc'),
                position: isRTL ? 'right' : 'left'
              }
            ]}
          />

        </motion.div>
      )}
    </AnimatePresence>
  );
};


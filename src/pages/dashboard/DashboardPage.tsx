import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { useTheme } from '../../context/ThemeContext';
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
import { SectionLoader } from '../../components/LoadingState';
import {
  emptyDashboardStats,
  normalizeDashboardStats,
  normalizePeakHours,
} from '../../utils/reportFallbacks';

// View mode types
type ViewMode = 'current_shift' | 'previous_shift' | 'last_24_hours';

// Auto-refresh interval: 1 hour in milliseconds
const AUTO_REFRESH_INTERVAL = 60 * 60 * 1000;
const NEW_LOCATION_WELCOME_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const DASHBOARD_SETUP_STORAGE_VERSION = 'v6';
const DASHBOARD_WELCOME_SEEN_STORAGE_VERSION = 'v1';
const DASHBOARD_WELCOME_OVERLAY_ID = 'mintcom-dashboard-welcome-popup';
const DASHBOARD_SETUP_DISMISSED_COMPAT_VERSIONS = ['v3', 'v4', 'v5', 'v6'] as const;

const getBrowserStorage = (type: 'localStorage' | 'sessionStorage'): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window[type];
  } catch {
    return null;
  }
};

const readStorageFlag = (storage: Storage | null, key: string) => {
  try {
    return storage?.getItem(key) === 'true';
  } catch {
    return false;
  }
};

const writeStorageFlag = (storage: Storage | null, key: string) => {
  try {
    storage?.setItem(key, 'true');
  } catch {
    // Storage can be unavailable in strict privacy modes; the in-memory guard still prevents repeats in this tab.
  }
};

const removeStorageItem = (storage: Storage | null, key: string) => {
  try {
    storage?.removeItem(key);
  } catch {
    // Ignore unavailable storage.
  }
};

const welcomeSeenKey = (scope: string, locationKey: string) =>
  `mintcom.dashboard.welcome.seen.${DASHBOARD_WELCOME_SEEN_STORAGE_VERSION}.${scope}${locationKey}`;

const setupDismissedKey = (version: string, scope: string, locationKey: string) =>
  `mintcom.dashboard.setup.dismissed.${version}.${scope}${locationKey}`;

const setupSessionDismissedKey = (version: string, scope: string, locationKey: string) =>
  `mintcom.dashboard.setup.session.dismissed.${version}.${scope}${locationKey}`;

export const DashboardPage = () => {
  const { t } = useTranslation();
  const isRTL = t('common.locale') === 'ar';
  const { resolvedTheme } = useTheme();
  const { locationSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const welcomeHandledRef = useRef<string | null>(null);
  const scopedStoragePrefix = `${account?.id || 'anonymous'}.`;
  const primaryLocationKey = useMemo(
    () => currentEstablishment?.id || currentEstablishment?.establishmentLoginId || locationSlug || null,
    [currentEstablishment?.establishmentLoginId, currentEstablishment?.id, locationSlug],
  );
  const locationStorageKeys = useMemo(
    () =>
      Array.from(
        new Set(
          [locationSlug, currentEstablishment?.establishmentLoginId, currentEstablishment?.id].filter(
            Boolean,
          ) as string[],
        ),
      ),
    [currentEstablishment?.establishmentLoginId, currentEstablishment?.id, locationSlug],
  );
  const dashboardSetupKey = currentEstablishment?.id || currentEstablishment?.establishmentLoginId || locationSlug || null;
  const isSetupLaunchRequest = searchParams.get('setup') === '1' || searchParams.get('welcome') === '1';
  const hasSeenWelcomeForLocation = useCallback(() => {
    const local = getBrowserStorage('localStorage');
    const session = getBrowserStorage('sessionStorage');

    return locationStorageKeys.some((key) => {
      const hasVersionedDismissal = DASHBOARD_SETUP_DISMISSED_COMPAT_VERSIONS.some(
        (version) =>
          readStorageFlag(local, setupDismissedKey(version, scopedStoragePrefix, key)) ||
          readStorageFlag(session, setupSessionDismissedKey(version, scopedStoragePrefix, key)),
      );

      return (
        readStorageFlag(local, welcomeSeenKey(scopedStoragePrefix, key)) ||
        readStorageFlag(local, `mintcom.dashboard.visited.${key}`) ||
        readStorageFlag(local, `mintcom.dashboard.setup.dismissed.${key}`) ||
        hasVersionedDismissal
      );
    });
  }, [locationStorageKeys, scopedStoragePrefix]);
  const markWelcomeSeenForLocation = useCallback(() => {
    if (!primaryLocationKey || locationStorageKeys.length === 0) {
      return;
    }

    const local = getBrowserStorage('localStorage');
    const session = getBrowserStorage('sessionStorage');

    writeStorageFlag(
      session,
      setupSessionDismissedKey(DASHBOARD_SETUP_STORAGE_VERSION, scopedStoragePrefix, primaryLocationKey),
    );

    locationStorageKeys.forEach((key) => {
      writeStorageFlag(local, welcomeSeenKey(scopedStoragePrefix, key));
      writeStorageFlag(local, setupDismissedKey(DASHBOARD_SETUP_STORAGE_VERSION, scopedStoragePrefix, key));
      writeStorageFlag(local, `mintcom.dashboard.visited.${key}`);
      removeStorageItem(local, `mintcom.dashboard.welcome.pending.${key}`);
    });
  }, [locationStorageKeys, primaryLocationKey, scopedStoragePrefix]);
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
  const isRecentlyCreatedLocation = useMemo(() => {
    if (!currentEstablishment?.createdAt) {
      return false;
    }

    const createdAtMs = Date.parse(currentEstablishment.createdAt);
    if (!Number.isFinite(createdAtMs)) {
      return false;
    }

    const ageMs = Date.now() - createdAtMs;
    return ageMs >= 0 && ageMs <= NEW_LOCATION_WELCOME_WINDOW_MS;
  }, [currentEstablishment?.createdAt]);

  // Check if setup welcome should open for this dashboard tab.
  useEffect(() => {
    if (!dashboardSetupKey || !primaryLocationKey || locationStorageKeys.length === 0) {
      return;
    }

    if (showWelcomePopup || welcomeHandledRef.current === primaryLocationKey) {
      return;
    }

    const local = getBrowserStorage('localStorage');
    const hasPendingWelcome = locationStorageKeys.some((key) =>
      readStorageFlag(local, `mintcom.dashboard.welcome.pending.${key}`),
    );
    const hasSeenWelcome = hasSeenWelcomeForLocation();
    const shouldShowWelcome = !hasSeenWelcome;

    const debugState = {
      version: DASHBOARD_SETUP_STORAGE_VERSION,
      welcomeSeenVersion: DASHBOARD_WELCOME_SEEN_STORAGE_VERSION,
      pathname: location.pathname,
      accountId: account?.id || null,
      currentEstablishmentId: currentEstablishment?.id || null,
      currentEstablishmentLoginId: currentEstablishment?.establishmentLoginId || null,
      locationSlug: locationSlug || null,
      locationKeys: locationStorageKeys,
      primaryLocationKey,
      hasPendingWelcome,
      hasSeenWelcome,
      isRecentlyCreatedLocation,
      isSetupLaunchRequest,
      isLoading,
      shouldShowWelcome,
      showWelcomePopup,
    };

    (window as any).__mintcomSetupDebug = debugState;
    (window as any).__mintcomShowSetupPopup = () => {
      welcomeHandledRef.current = null;
      markWelcomeSeenForLocation();
      setShowWelcomePopup(true);
    };

    welcomeHandledRef.current = primaryLocationKey;

    if (shouldShowWelcome) {
      markWelcomeSeenForLocation();
      setShowWelcomePopup(true);
      return;
    }

    if (hasPendingWelcome) {
      markWelcomeSeenForLocation();
    }

    if (isSetupLaunchRequest) {
      clearSetupLaunchParams();
    }
  }, [
    dashboardSetupKey,
    account?.id,
    clearSetupLaunchParams,
    currentEstablishment?.establishmentLoginId,
    currentEstablishment?.id,
    hasSeenWelcomeForLocation,
    isLoading,
    isRecentlyCreatedLocation,
    isSetupLaunchRequest,
    location.pathname,
    locationSlug,
    locationStorageKeys,
    markWelcomeSeenForLocation,
    primaryLocationKey,
    scopedStoragePrefix,
    showWelcomePopup,
  ]);

  useEffect(() => {
    if (!showWelcomePopup) {
      return;
    }

    document.body.classList.remove('app-loading');
    console.log('[Mintcom Setup Debug] showWelcomePopup state is true');
    const timer = window.setTimeout(() => {
      console.log('[Mintcom Setup Debug] popup DOM render check', {
        exists: Boolean(document.getElementById('mintcom-dashboard-welcome-popup')),
        bodyClass: document.body.className,
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [showWelcomePopup]);

  useEffect(() => {
    if (!showWelcomePopup) {
      document.getElementById(DASHBOARD_WELCOME_OVERLAY_ID)?.remove();
      return;
    }

    document.getElementById(DASHBOARD_WELCOME_OVERLAY_ID)?.remove();
    document.body.classList.remove('app-loading');

    const isDark = resolvedTheme === 'dark';
    const palette = isDark
      ? {
          overlayBg: 'rgba(0, 0, 0, 0.72)',
          cardBg: '#0F172A',
          cardBorder: '1px solid rgba(255, 255, 255, 0.12)',
          cardShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
          titleColor: '#fff',
          messageColor: '#CBD5E1',
          iconBg: 'rgba(124, 195, 159, 0.14)',
          closeBg: 'rgba(255, 255, 255, 0.08)',
          closeColor: '#CBD5E1',
        }
      : {
          overlayBg: 'rgba(15, 23, 42, 0.45)',
          cardBg: '#FFFFFF',
          cardBorder: '1px solid rgba(15, 23, 42, 0.08)',
          cardShadow: '0 24px 80px rgba(15, 23, 42, 0.18)',
          titleColor: '#0F172A',
          messageColor: '#475569',
          iconBg: 'rgba(124, 195, 159, 0.18)',
          closeBg: 'rgba(15, 23, 42, 0.06)',
          closeColor: '#475569',
        };

    const overlay = document.createElement('div');
    overlay.id = DASHBOARD_WELCOME_OVERLAY_ID;
    overlay.dir = isRTL ? 'rtl' : 'ltr';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '2147483647';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '16px';
    overlay.style.background = palette.overlayBg;
    overlay.style.backdropFilter = 'blur(6px)';
    overlay.style.pointerEvents = 'auto';

    const card = document.createElement('div');
    card.style.width = '100%';
    card.style.maxWidth = '384px';
    card.style.borderRadius = '32px';
    card.style.border = palette.cardBorder;
    card.style.background = palette.cardBg;
    card.style.color = palette.titleColor;
    card.style.boxShadow = palette.cardShadow;
    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    card.style.fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

    const content = document.createElement('div');
    content.style.padding = '32px 24px';
    content.style.display = 'flex';
    content.style.flexDirection = 'column';
    content.style.alignItems = 'center';
    content.style.textAlign = 'center';

    const icon = document.createElement('div');
    icon.style.width = '64px';
    icon.style.height = '64px';
    icon.style.borderRadius = '999px';
    icon.style.display = 'flex';
    icon.style.alignItems = 'center';
    icon.style.justifyContent = 'center';
    icon.style.marginBottom = '16px';
    icon.style.fontSize = '30px';
    icon.style.fontWeight = '800';
    icon.style.color = '#7dc6a2';
    icon.style.background = palette.iconBg;
    icon.innerHTML = `
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#7dc6a2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M5.8 11.3 2 22l10.7-3.79" />
        <path d="M4 3h.01" />
        <path d="M22 8h.01" />
        <path d="M15 2h.01" />
        <path d="M22 20h.01" />
        <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
        <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11-.11.7-.72 1.22-1.43 1.22H17" />
        <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.91 9 5.52 9 6.23V7" />
        <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />
      </svg>
    `;

    const title = document.createElement('h3');
    title.style.margin = '0 0 8px';
    title.style.fontSize = '24px';
    title.style.fontWeight = '800';
    title.style.color = palette.titleColor;
    title.style.display = 'flex';
    title.style.alignItems = 'center';
    title.style.justifyContent = 'center';
    title.style.gap = '8px';
    const titleText = document.createElement('span');
    titleText.textContent = t('common.congratulations');
    const titleIcon = document.createElement('span');
    titleIcon.textContent = '🎉';
    titleIcon.setAttribute('aria-hidden', 'true');
    title.append(titleText, titleIcon);

    const message = document.createElement('p');
    message.textContent = t('dashboard.welcome.message', {
      location: currentEstablishment?.name || 'this location',
    });
    message.style.margin = '0 0 24px';
    message.style.color = palette.messageColor;
    message.style.lineHeight = '1.6';
    message.style.fontSize = '14px';

    const startButton = document.createElement('button');
    startButton.type = 'button';
    startButton.textContent = t('dashboard.welcome.startGuide');
    startButton.style.width = '100%';
    startButton.style.border = '0';
    startButton.style.borderRadius = '14px';
    startButton.style.padding = '14px 16px';
    startButton.style.background = '#7dc6a2';
    startButton.style.color = '#07110B';
    startButton.style.fontWeight = '800';
    startButton.style.cursor = 'pointer';
    startButton.style.boxShadow = '0 16px 36px rgba(124, 195, 159, 0.28)';

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = 'x';
    closeButton.setAttribute('aria-label', t('common.close'));
    closeButton.style.position = 'absolute';
    closeButton.style.top = '14px';
    closeButton.style.right = isRTL ? 'auto' : '14px';
    closeButton.style.left = isRTL ? '14px' : 'auto';
    closeButton.style.width = '34px';
    closeButton.style.height = '34px';
    closeButton.style.border = '0';
    closeButton.style.borderRadius = '999px';
    closeButton.style.background = palette.closeBg;
    closeButton.style.color = palette.closeColor;
    closeButton.style.fontSize = '18px';
    closeButton.style.lineHeight = '1';
    closeButton.style.cursor = 'pointer';

    content.append(icon, title, message, startButton);
    card.append(content, closeButton);
    overlay.append(card);
    document.body.append(overlay);

    console.log('[Mintcom Setup Debug] imperative overlay appended', {
      exists: Boolean(document.getElementById(DASHBOARD_WELCOME_OVERLAY_ID)),
    });

    const close = () => handleCloseWelcome();
    const start = () => handleStartTasks();

    overlay.addEventListener('click', close);
    card.addEventListener('click', (event) => event.stopPropagation());
    closeButton.addEventListener('click', close);
    startButton.addEventListener('click', start);

    return () => {
      overlay.removeEventListener('click', close);
      closeButton.removeEventListener('click', close);
      startButton.removeEventListener('click', start);
      overlay.remove();
    };
  }, [
    currentEstablishment?.name,
    isRTL,
    resolvedTheme,
    showWelcomePopup,
    t,
  ]);

  const handleCloseWelcome = useCallback(() => {
    welcomeHandledRef.current = primaryLocationKey;
    setShowWelcomePopup(false);
    markWelcomeSeenForLocation();
    clearSetupLaunchParams();
  }, [
    clearSetupLaunchParams,
    markWelcomeSeenForLocation,
    primaryLocationKey,
  ]);

  const waitForTasksGuideTargets = useCallback(async () => {
    const timeoutAt = Date.now() + 5000;

    while (Date.now() < timeoutAt) {
      const firstTask =
        document.getElementById('task-item-location-profile') ||
        document.getElementById('widget-task-item-location-profile');

      if (firstTask) {
        setShowTasksTour(true);
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }

    setShowTasksTour(true);
  }, []);

  const handleStartTasks = () => {
    handleCloseWelcome();
    window.dispatchEvent(new Event('mintcom-open-tasks'));
    void waitForTasksGuideTargets();
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
        setStats(emptyDashboardStats());
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

      // Process stats. Successful empty/null payloads are normalized to zero-state data.
      const summaryData = normalizeDashboardStats(summaryRes.data);
      const pendingOrdersData = normalizeDashboardStats(pendingOrdersRes.data);
      const pendingOrdersLast24Hours = Number(pendingOrdersData.pendingOrders) || 0;
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
        pendingOrders: pendingOrdersLast24Hours,
        completedOrders: summaryData.completedOrders || summaryData.totalOrders,
        activeEmployees: summaryData.activeEmployees,
        taxCollected: summaryData.taxCollected,
        totalRefunds: summaryData.totalRefunds,
        grossProfit: summaryData.grossProfit,
        totalPayIn: summaryData.totalPayIn,
        totalPayOut: summaryData.totalPayOut,
        paymentMethodBreakdown: summaryData.paymentMethodBreakdown,
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
    <>
      <AnimatePresence mode="wait">
        {isLoading && !stats ? (
          <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SectionLoader message={t('dashboard.loading')} />
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
                          <span className="px-2.5 py-0.5 rounded-lg bg-mintcom-green/10 text-mintcom-green label-strong font-outfit border border-mintcom-green/20">
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

      <TourGuide
        isOpen={showTasksTour}
        onClose={() => setShowTasksTour(false)}
        onComplete={() => setShowTasksTour(false)}
        steps={[
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



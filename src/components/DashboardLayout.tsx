import { MobileAppModal } from './MobileAppModal';
import { ANDROID_DOWNLOAD_URL, IOS_DOWNLOAD_URL } from '../config/downloads';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { NavLink, Outlet, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../hooks/useRealtime';
import { ThemeToggle } from './ThemeToggle';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
import { BottomNavigation } from './mobile/BottomNavigation';
import { AlertsBell } from './notifications/AlertsBell';
import { SidebarPreferencesHelpMenu } from './layout/SidebarPreferencesHelpMenu';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,

  MapPin,
  ShoppingCart,
  Package,
  Users,
  FileBarChart,
  Percent,
  CreditCard,
  Sliders,
  Settings,
  Shield,
  History,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Smartphone,
  Heart,
  Award,
  Scale,
  ArrowLeft,
  PlusCircle,
  ShoppingBag,
  Clock,
  FileText,
  Boxes,
  Store,
  Receipt,
  ShieldCheck,
  MonitorSmartphone,
  BookOpen,
  Trash2
} from 'lucide-react';

// Mintcom Logo imports
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';
import MintcomLeafIcon from '../assets/small-logo.svg';
import { ConfirmModal } from './ConfirmModal';
import { getBusinessTypeIcon } from '../utils/businessTypeIcons';
import { RealtimeStatusIndicator } from './RealtimeStatusIndicator';
import { CenteredOverlay, SectionLoader } from './LoadingState';
import toast from 'react-hot-toast';
import realtimeService from '../services/realtimeService';
import {
  DASHBOARD_SESSION_KICKED_CODE,
  dashboardSessionService,
  decrementDashboardTabCount,
  getDashboardClientId,
  getDashboardSessionErrorMessage,
  incrementDashboardTabCount,
  isDashboardSessionConflict,
  isDashboardSessionEnded,
  type DashboardSession,
  type DashboardSessionConflict,
  type DashboardSessionKickPayload,
} from '../services/dashboardSessionService';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

interface MenuGroup {
  label: string;
  icon: React.ElementType;
  items: MenuItem[];
}

type MenuItemOrGroup = MenuItem | MenuGroup;

const isMenuGroup = (item: MenuItemOrGroup): item is MenuGroup => {
  return 'items' in item;
};

// ... imports

// ... (keep generic interface definitions)

import { REQUIRED_PERMISSIONS, hasPermission as checkPerms } from '../config/permissions';
import { useSetupGuideFirstRun } from '../hooks/useSetupGuideFirstRun';

const SIDEBAR_STATE_KEY = 'dashboard_sidebar_expanded';

export function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { account, currentEstablishment, establishments, logout } = useAuth();
  // Switching locations only makes sense when there is more than one to move
  // between. A single-location user (owner or employee) has nothing to switch to.
  const canSwitchLocation = (establishments?.length || 0) > 1;
  // The owner portal is available to the account owner regardless of how many
  // locations they have. Secondary admins do not have access to that portal.
  const canAccessOwnerPortal = Boolean(account && !account.isSecondaryAdmin);
  // With several locations the card already shows "Switch Location", so the
  // owner portal shortcut is only surfaced for single location accounts.
  const showOwnerPortalLink = canAccessOwnerPortal && !canSwitchLocation;
  const navigate = useNavigate();
  const location = useLocation();
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const dashboardLocations = useMemo(
    () => currentEstablishment ? [{
      id: currentEstablishment.id,
      name: currentEstablishment.name,
      slug: locationSlug,
      currency: currentEstablishment.currency,
    }] : [],
    [currentEstablishment, locationSlug],
  );

  const [mobileAppModalOpen, setMobileAppModalOpen] = useState(false);

  // Deep-link support: the "Get the app" CTA in the welcome email points here
  // with ?getApp=1 so it opens the cashier-app download modal right away. We
  // strip the param afterwards so a refresh doesn't keep re-opening it.
  useEffect(() => {
    if (searchParams.get('getApp') === '1') {
      setMobileAppModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('getApp');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Setup-guide "Install POS" task dispatches this to open the same download modal.
  useEffect(() => {
    const openMobileApp = () => setMobileAppModalOpen(true);
    window.addEventListener('mintcom-open-mobile-app', openMobileApp);
    return () => window.removeEventListener('mintcom-open-mobile-app', openMobileApp);
  }, []);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  const [dashboardSession, setDashboardSession] = useState<DashboardSession | null>(null);
  const [sessionConflict, setSessionConflict] = useState<DashboardSessionConflict | null>(null);
  const [isTakingOverDashboard, setIsTakingOverDashboard] = useState(false);
  const dashboardSessionRef = useRef<DashboardSession | null>(null);
  const forcedLogoutRef = useRef(false);
  const takeoverInFlightRef = useRef(false);
  const normalizedDashboardPath = location.pathname.replace(/\/+$/, '');
  const dashboardOverviewPath = locationSlug
    ? `/dashboard/${locationSlug}`
    : '';
  const isDashboardOverview =
    Boolean(dashboardOverviewPath) &&
    normalizedDashboardPath === dashboardOverviewPath;
  const hasCurrentDashboardSession =
    dashboardSession?.establishmentId === currentEstablishment?.id;
  const setupGuide = useSetupGuideFirstRun(currentEstablishment?.id, {
    // A claim records the guide as shown, so wait until the dashboard seat has
    // been acquired and the overview can actually render the granted modal.
    offerFirstRun:
      isDashboardOverview &&
      hasCurrentDashboardSession &&
      !sessionConflict,
    replayScopeKey: normalizedDashboardPath,
  });

  useRealtime({
    establishmentId: currentEstablishment?.id || null,
    enabled: Boolean(account && currentEstablishment?.id),
  });

  useEffect(() => {
    document.body.classList.add('dashboard-font-unified');
    return () => {
      document.body.classList.remove('dashboard-font-unified');
    };
  }, []);

  const getRelativePathFromUrl = useCallback((pathname: string): string => {
    // /dashboard/:slug/rest -> rest
    const parts = pathname.split('/');
    // parts[0] = '', [1] = 'dashboard', [2] = slug, [3...] = rest
    if (parts.length <= 3) return '.'; // pointing to root
    return parts.slice(3).join('/');
  }, []);

  const hasAccess = useCallback((path: string) => {
    if (path === '.') return true; // root
    if (!account?.isSecondaryAdmin) return true; // owners bypass checks

    const required = REQUIRED_PERMISSIONS[path];
    if (!required || required.length === 0) return true;

    return checkPerms(account.permissions, required);
  }, [account?.isSecondaryAdmin, account?.permissions]);

  const forceDashboardLogout = useCallback(async (message?: string) => {
    if (forcedLogoutRef.current) return;
    forcedLogoutRef.current = true;
    toast.error(
      message ||
        'You were signed out because this location dashboard was opened somewhere else.',
      { duration: 5000 },
    );
    await logout();
  }, [logout]);

  const closeDashboardConflict = useCallback(() => {
    if (takeoverInFlightRef.current) return;
    setSessionConflict(null);
    navigate('/select-establishment', { replace: true });
  }, [navigate]);

  const handleTakeOverDashboard = useCallback(async () => {
    if (!sessionConflict || !currentEstablishment?.id) return;

    takeoverInFlightRef.current = true;
    setIsTakingOverDashboard(true);
    try {
      await dashboardSessionService.kick(
        currentEstablishment.id,
        sessionConflict.activeSession.id,
      );
      const result = await dashboardSessionService.enter(currentEstablishment.id);
      dashboardSessionRef.current = result.session;
      setDashboardSession(result.session);
      setSessionConflict(null);
      toast.success(t('dashboard.session.controlGranted'));
    } catch (error: any) {
      if (isDashboardSessionConflict(error)) {
        setSessionConflict(error.response.data);
      } else if (isDashboardSessionEnded(error)) {
        await forceDashboardLogout(getDashboardSessionErrorMessage(error));
      } else {
        toast.error(getDashboardSessionErrorMessage(error));
      }
    } finally {
      takeoverInFlightRef.current = false;
      setIsTakingOverDashboard(false);
    }
  }, [currentEstablishment?.id, forceDashboardLogout, sessionConflict]);

  useEffect(() => {
    let cancelled = false;
    const establishmentId = currentEstablishment?.id;

    setDashboardSession(null);
    setSessionConflict(null);
    dashboardSessionRef.current = null;

    if (!account || !establishmentId) {
      return;
    }

    incrementDashboardTabCount(establishmentId);

    const enterDashboard = async () => {
      try {
        const result = await dashboardSessionService.enter(establishmentId);
        if (cancelled) return;
        dashboardSessionRef.current = result.session;
        setDashboardSession(result.session);
      } catch (error: any) {
        if (cancelled) return;
        if (isDashboardSessionConflict(error)) {
          setSessionConflict(error.response.data);
          return;
        }
        if (isDashboardSessionEnded(error)) {
          await forceDashboardLogout(getDashboardSessionErrorMessage(error));
          return;
        }
        toast.error(getDashboardSessionErrorMessage(error));
        navigate('/select-establishment', { replace: true });
      }
    };

    enterDashboard();

    return () => {
      cancelled = true;
      const sessionId = dashboardSessionRef.current?.id;
      dashboardSessionRef.current = null;
      if (establishmentId) {
        const remaining = decrementDashboardTabCount(establishmentId);
        if (sessionId && remaining === 0) {
          dashboardSessionService.leave(sessionId, establishmentId).catch(() => undefined);
        }
      }
    };
  }, [account?.id, currentEstablishment?.id, forceDashboardLogout, navigate]);

  useEffect(() => {
    const sessionId = dashboardSession?.id;
    const establishmentId = currentEstablishment?.id;
    if (!sessionId || !establishmentId || dashboardSession?.establishmentId !== establishmentId) return;

    let heartbeatInFlight = false;

    const runHeartbeat = async () => {
      if (heartbeatInFlight) return;
      heartbeatInFlight = true;
      try {
        const result = await dashboardSessionService.heartbeat(sessionId, establishmentId);
        dashboardSessionRef.current = result.session;
        setDashboardSession(result.session);
      } catch (error: any) {
        if (!isDashboardSessionEnded(error)) return;

        // Only an explicit takeover by someone else warrants a logout.
        if (error?.response?.data?.code === DASHBOARD_SESSION_KICKED_CODE) {
          await forceDashboardLogout(getDashboardSessionErrorMessage(error));
          return;
        }

        // The seat merely EXPIRED (laptop sleep, throttled background tab,
        // brief offline period). Nobody took it over — re-claim it silently
        // instead of logging the user out "from nowhere".
        if (!establishmentId) return;
        try {
          const result = await dashboardSessionService.enter(establishmentId);
          dashboardSessionRef.current = result.session;
          setDashboardSession(result.session);
        } catch (reenterError: any) {
          if (isDashboardSessionConflict(reenterError)) {
            // Someone claimed the seat while we were away: show the normal
            // takeover dialog instead of nuking the whole login.
            dashboardSessionRef.current = null;
            setDashboardSession(null);
            setSessionConflict(reenterError.response.data);
          } else if (isDashboardSessionEnded(reenterError)) {
            await forceDashboardLogout(
              getDashboardSessionErrorMessage(reenterError),
            );
          }
          // Transient errors (network blips): keep the interval running and
          // retry on the next tick.
        }
      } finally {
        heartbeatInFlight = false;
      }
    };

    const intervalId = window.setInterval(runHeartbeat, 25_000);

    // After waking from sleep or returning to a throttled background tab,
    // refresh the seat immediately rather than waiting for the next tick.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void runHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [
    dashboardSession?.id,
    dashboardSession?.establishmentId,
    currentEstablishment?.id,
    forceDashboardLogout,
  ]);

  useEffect(() => {
    const establishmentId = currentEstablishment?.id;
    const unsubscribe = realtimeService.onRaw<DashboardSessionKickPayload>(
      'dashboard-session:kicked',
      payload => {
        const activeSession = dashboardSessionRef.current;
        if (!activeSession) return;

        if (
          payload.sessionId === activeSession.id ||
          payload.clientId === getDashboardClientId(establishmentId)
        ) {
          void forceDashboardLogout(payload.message);
        }
      },
    );

    return unsubscribe;
  }, [currentEstablishment?.id, forceDashboardLogout]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeSession = dashboardSessionRef.current;
      if (!activeSession) return;

      const remaining = decrementDashboardTabCount(activeSession.establishmentId);
      if (remaining === 0) {
        const body = JSON.stringify({
          sessionId: activeSession.id,
          clientId: getDashboardClientId(activeSession.establishmentId),
        });
        const payload = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon?.('/api/dashboard-sessions/leave', payload);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Filter menu based on permissions
  const filteredMenu = useMemo(() => {
    // Translate menu structure dynamically
    const translatedMenuStructure: MenuItemOrGroup[] = [
      { path: '.', label: t('dashboard.menu.dashboard'), icon: LayoutDashboard },
      {
        label: t('dashboard.menu.salesAndReporting'),
        icon: FileBarChart,
        items: [
          { path: 'reports/sales', label: t('dashboard.menu.salesSummary'), icon: FileBarChart },
          { path: 'reports/items', label: t('dashboard.menu.salesByItems'), icon: ShoppingBag },
          { path: 'reports/modifiers', label: t('dashboard.menu.salesByAddons'), icon: PlusCircle },
          { path: 'reports/staff-sales', label: t('dashboard.menu.salesByStaff'), icon: Users },
          { path: 'reports/shifts', label: t('dashboard.menu.shiftsReports'), icon: FileBarChart },
          { path: 'reports/cash-discrepancy', label: t('dashboard.menu.cashGapReports'), icon: Scale },
          { path: 'reports/peak-hours', label: t('orders.reports.peakHours.title', { defaultValue: 'Busy Times' }), icon: Clock },
          { path: 'reports/payments', label: t('dashboard.menu.paymentsReports'), icon: CreditCard },
          { path: 'reports/discounts', label: t('dashboard.menu.discountReports'), icon: Percent },
          { path: 'reports/taxes', label: t('reports.taxes', { defaultValue: 'Taxes Report' }), icon: FileText },
        ],
      },
      { path: 'orders', label: t('dashboard.menu.viewCustomerOrders'), icon: ShoppingCart },
      {
        label: t('dashboard.menu.itemsMenu'),
        icon: Package,
        items: [
          { path: 'categories', label: t('dashboard.menu.categories'), icon: LayoutDashboard },
          { path: 'products', label: t('dashboard.menu.products'), icon: Package },
          { path: 'addons', label: t('dashboard.menu.addons'), icon: PlusCircle },
          { path: 'stock', label: t('dashboard.menu.stockManagement', { defaultValue: 'Stock & Availability' }), icon: Boxes },
          { path: 'inventory', label: t('dashboard.menu.inventory'), icon: Package },
        ],
      },
      { path: 'payment-methods', label: t('dashboard.menu.paymentMethods'), icon: CreditCard },
      {
        label: t('dashboard.menu.teamManagement'),
        icon: Users,
        items: [
          { path: 'staff', label: t('dashboard.menu.team'), icon: Users },
          { path: 'roles', label: t('dashboard.menu.roles'), icon: Shield },
        ],
      },
      {
        label: t('dashboard.menu.discountsAndLoyalty'),
        icon: Heart,
        items: [
          { path: 'discounts', label: t('dashboard.menu.discounts'), icon: Percent },
          { path: 'loyalty', label: t('dashboard.menu.loyalty'), icon: Award },
          { path: 'customers', label: t('dashboard.menu.customers'), icon: Users },
        ],
      },
      {
        label: t('dashboard.menu.settings'),
        icon: Settings,
        items: [
          { path: 'settings', label: t('dashboard.menu.overview', { defaultValue: 'Overview' }), icon: Sliders },
          { path: 'settings/profile', label: t('settings.tabs.profile', { defaultValue: 'Profile' }), icon: Store },
          { path: 'settings/sales', label: t('settings.tabs.sales', { defaultValue: 'Sales Setup' }), icon: CreditCard },
          { path: 'settings/pos', label: t('settings.tabs.pos', { defaultValue: 'POS & Shifts' }), icon: MonitorSmartphone },
          { path: 'settings/receipts', label: t('settings.tabs.receipts', { defaultValue: 'Receipts' }), icon: Receipt },
          { path: 'settings/fiscal', label: t('settings.tabs.tax', { defaultValue: 'E-Invoicing' }), icon: ShieldCheck },
          { path: 'settings/accounting', label: t('settings.tabs.accounting', { defaultValue: 'Accounting & VAT' }), icon: BookOpen },
          { path: 'settings/danger', label: t('settings.tabs.danger', { defaultValue: 'Delete Location' }), icon: Trash2 },
        ],
      },
      { path: 'activity-logs', label: t('dashboard.menu.activityLog'), icon: History },
    ];

    if (!account) return [];

    return translatedMenuStructure.map(item => {
      if (isMenuGroup(item)) {
        const visibleItems = item.items.filter(subItem => hasAccess(subItem.path));
        if (visibleItems.length > 0) {
          return { ...item, items: visibleItems };
        }
        return null;
      }
      return hasAccess(item.path) ? item : null;
    }).filter((item): item is MenuItemOrGroup => item !== null);
  }, [account, hasAccess, t]);

  const mobileBottomNavItems = useMemo(() => {
    const items = [
      { path: '.', label: t('dashboard.menu.dashboard'), icon: LayoutDashboard, exact: true },
      { path: 'orders', label: t('dashboard.menu.orders'), icon: ShoppingCart },
      { path: 'products', label: t('dashboard.menu.products'), icon: Package },
    ];

    const visible = items.filter((item) => hasAccess(item.path));
    return visible.length > 0 ? visible : [items[0]];
  }, [hasAccess, t]);


  // ... (keep useEffects, but updated dependencies if needed)

  const isGroupActive = (items: MenuItem[]) => {
    // Check if any item's path corresponds to current location
    // Using endWith or careful construction
    const currentRelative = getRelativePathFromUrl(location.pathname);
    return items.some((item) => {
      if (item.path === '.') return currentRelative === '.';
      return currentRelative.startsWith(item.path);
    });
  };

  useEffect(() => {
    if (!account?.isSecondaryAdmin) return;

    const currentRelative = getRelativePathFromUrl(location.pathname);
    if (currentRelative === '.') return;
    if (hasAccess(currentRelative)) return;

    const segments = location.pathname.split('/');
    const locationSlug = segments[2];
    const fallbackPath = locationSlug ? `/dashboard/${locationSlug}` : '/select-establishment';
    navigate(fallbackPath, { replace: true });
  }, [account?.isSecondaryAdmin, getRelativePathFromUrl, hasAccess, location.pathname, navigate]);


  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setTimeout(() => setMobileMenuOpen(false), 0);
  }, [location.pathname]);

  // Collapse all groups when sidebar is closed
  useEffect(() => {
    if (!sidebarOpen) {
      setTimeout(() => setExpandedGroup(null), 0);
    }
  }, [sidebarOpen]);

  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = () => { logout(); };

  const sidebarNavRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const prevSidebarOpen = useRef(sidebarOpen);
  const sidebarRef = useRef<HTMLElement>(null);
  const collapsedNavHideTimeoutRef = useRef<number | null>(null);
  // The nav scrollbar is intentionally hidden, so when the list overflows we
  // show a fade at the cut-off edge as the "there is more below" cue.
  const [navOverflows, setNavOverflows] = useState(false);
  const updateNavOverflow = useCallback(() => {
    const el = sidebarNavRef.current;
    if (!el) return;
    setNavOverflows(el.scrollHeight > el.clientHeight + 4);
  }, []);
  const [collapsedNavOverlay, setCollapsedNavOverlay] = useState<{
    type: 'group' | 'item';
    label: string;
    items?: MenuItem[];
    /** Viewport-fixed coords so the flyout is never clipped by sidebar overflow */
    top: number;
    left?: number;
    right?: number;
    maxHeight: number;
  } | null>(null);

  const clearCollapsedNavOverlayHide = useCallback(() => {
    if (collapsedNavHideTimeoutRef.current !== null) {
      window.clearTimeout(collapsedNavHideTimeoutRef.current);
      collapsedNavHideTimeoutRef.current = null;
    }
  }, []);

  const hideCollapsedNavOverlay = useCallback(() => {
    clearCollapsedNavOverlayHide();
    setCollapsedNavOverlay(null);
  }, [clearCollapsedNavOverlayHide]);

  const scheduleHideCollapsedNavOverlay = useCallback(() => {
    clearCollapsedNavOverlayHide();
    collapsedNavHideTimeoutRef.current = window.setTimeout(() => {
      setCollapsedNavOverlay(null);
      collapsedNavHideTimeoutRef.current = null;
    }, 120);
  }, [clearCollapsedNavOverlayHide]);

  const showCollapsedNavOverlay = useCallback((target: HTMLElement, overlay: { type: "group" | "item"; label: string; items?: MenuItem[] }) => {
    if (sidebarOpen) {
      return;
    }

    clearCollapsedNavOverlayHide();

    const itemRect = target.getBoundingClientRect();
    const overlayGap = 10;
    const edgePad = 12;
    // Estimate group panel height so we can keep it fully on-screen.
    // header ~36px + each item ~40px + padding
    const itemCount = overlay.items?.length ?? 0;
    const estimatedHeight =
      overlay.type === 'group'
        ? Math.min(window.innerHeight - edgePad * 2, 36 + itemCount * 40 + 16)
        : 36;
    const preferredTop = itemRect.top + itemRect.height / 2 - estimatedHeight / 2;
    const maxTop = window.innerHeight - edgePad - estimatedHeight;
    const clampedTop = Math.max(edgePad, Math.min(preferredTop, maxTop));
    const maxHeight = Math.max(120, window.innerHeight - clampedTop - edgePad);

    setCollapsedNavOverlay({
      ...overlay,
      top: clampedTop,
      left: isRTL ? undefined : itemRect.right + overlayGap,
      right: isRTL ? window.innerWidth - itemRect.left + overlayGap : undefined,
      maxHeight,
    });
  }, [clearCollapsedNavOverlayHide, isRTL, sidebarOpen]);

  useEffect(() => () => {
    clearCollapsedNavOverlayHide();
  }, [clearCollapsedNavOverlayHide]);

  useEffect(() => {
    hideCollapsedNavOverlay();
  }, [hideCollapsedNavOverlay, location.pathname, sidebarOpen]);

  // Scroll to top on route change
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  // 1. Auto-expand group when location changes OR sidebar opens
  useEffect(() => {
    if (sidebarOpen) {
      const currentGroup = filteredMenu.find(
        (item) => isMenuGroup(item) && isGroupActive(item.items)
      ) as MenuGroup | undefined;

      if (currentGroup && expandedGroup !== currentGroup.label) {
        setTimeout(() => setExpandedGroup(currentGroup.label), 0);
      }
    }
  }, [location.pathname, sidebarOpen, filteredMenu]);

  // 2. Handle scroll ONLY when the sidebar actually opens
  useEffect(() => {
    if (sidebarOpen && !prevSidebarOpen.current) {
      const scrollTimer = setTimeout(() => {
        const activeElement = sidebarNavRef.current?.querySelector('.active-menu-item');
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 400); // Wait for width expansion to complete
      return () => clearTimeout(scrollTimer);
    }
    prevSidebarOpen.current = sidebarOpen;
  }, [sidebarOpen]);

  // 3. Auto-scroll when a group is expanded to ensure sub-items are visible
  useEffect(() => {
    if (expandedGroup && sidebarOpen) {
      const scrollTimer = setTimeout(() => {
        const groupElement = sidebarNavRef.current?.querySelector(`[data-group="${expandedGroup}"]`);
        if (groupElement) {
          // If the group is near the bottom, scroll it so the items are visible
          groupElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300); // Wait for the expansion animation to start
      return () => clearTimeout(scrollTimer);
    }
  }, [expandedGroup, sidebarOpen]);

  const toggleGroup = (label: string) => {
    setExpandedGroup(prev => prev === label ? null : label);
  };

  // Re-check nav overflow whenever its content or size can change
  useEffect(() => {
    updateNavOverflow();
  }, [updateNavOverflow, sidebarOpen, filteredMenu, expandedGroup, i18n.language, location.pathname]);

  useEffect(() => {
    window.addEventListener('resize', updateNavOverflow);
    return () => window.removeEventListener('resize', updateNavOverflow);
  }, [updateNavOverflow]);

  const handleSetupGuideReplay = useCallback(async () => {
    const allowed = await setupGuide.replay();
    if (!allowed) return false;

    if (!isDashboardOverview && locationSlug) {
      navigate(`/dashboard/${locationSlug}`);
    }
    return true;
  }, [isDashboardOverview, locationSlug, navigate, setupGuide.replay]);

  const openHelpCenter = useCallback(() => {
    navigate('/support');
  }, [navigate]);

  const isDashboardContentLocked = Boolean(
    currentEstablishment?.id && (!hasCurrentDashboardSession || sessionConflict),
  );
  const conflictActorName =
    sessionConflict?.activeSession?.displayName ||
    sessionConflict?.activeSession?.actorName ||
    t('common.someone', { defaultValue: 'Someone' });
  const isAnotherOwnerDeviceConflict = conflictActorName === 'another device';
  const conflictMessage = sessionConflict
    ? `${conflictActorName} is currently inside ${currentEstablishment?.name || 'this location'} dashboard.`
    : '';

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className="h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden transition-colors duration-500"
    >
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{
          width: sidebarOpen ? 300 : 100,
          transition: { duration: 0.4, type: "spring", damping: 25, stiffness: 200 }
        }}
        className={`
          relative z-[100] flex flex-col h-screen py-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-lg group/sidebar
          ${mobileMenuOpen ? 'fixed left-0 top-0 w-[280px]' : 'hidden lg:flex'}
        `}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-6 mb-2 relative shrink-0">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center cursor-pointer group"
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={16} className="text-gray-400 mr-2 group-hover:-translate-x-1 transition-transform" />
                <img
                  src={MintcomLogoGreen}
                  alt={t('brand.name')}
                  width={160}
                  height={40}
                  loading="eager"
                  decoding="async"
                  className="h-10 w-auto object-contain dark:hidden transition-transform"
                />
                <img
                  src={MintcomLogoWhite}
                  alt={t('brand.name')}
                  width={160}
                  height={40}
                  loading="eager"
                  decoding="async"
                  className="h-10 w-auto object-contain hidden dark:block transition-transform"
                />
                <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900/90 text-white text-xs px-2 py-1 rounded">
                  {t('nav.home', 'Home')}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto"
              >
                <button
                  className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer bg-gradient-to-br from-mintcom-green/20 to-mintcom-green/5 border border-mintcom-green/20 hover:border-mintcom-green/40 text-mintcom-green transition-all group relative"
                  onClick={() => setSidebarOpen(true)}
                >
                  <img src={MintcomLeafIcon} width={32} height={32} className="w-8 h-8 object-contain transition-all duration-300 opacity-100 rotate-0 group-hover/sidebar:opacity-0 group-hover/sidebar:rotate-90 absolute" alt={t('brand.name').charAt(0)} loading="eager" decoding="async" />
                  <PanelLeft
                    size={24}
                    className="transition-all duration-300 opacity-0 -rotate-90 group-hover/sidebar:opacity-100 group-hover/sidebar:rotate-0 absolute text-gray-500 dark:text-gray-400 group-hover/sidebar:text-gray-900 dark:group-hover/sidebar:text-white"
                  />
                  <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                    {t('dashboard.menu.openSidebar')}
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl text-gray-400 hover:text-mintcom-green hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              <PanelLeftClose size={20} />
            </button>
          )}
        </div>

        {/* Current Establishment Card */}
        {sidebarOpen ? (
          <div className="px-2 pb-2 pt-0">
            <div
              className={`p-3.5 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm relative overflow-hidden group transition-all duration-300 ${canSwitchLocation ? 'cursor-pointer hover:border-mintcom-green/30' : ''}`}
              onClick={canSwitchLocation ? () => navigate('/select-establishment') : undefined}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/5 dark:bg-mintcom-green/10 rounded-full blur-3xl pointer-events-none transition-transform duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const Icon = getBusinessTypeIcon(currentEstablishment?.type || '');
                      return <Icon size={18} className="text-mintcom-green" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="label-strong font-sans text-mintcom-green mb-0.5">{t('dashboard.menu.activeLocation')}</p>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-[1.2] font-sans truncate">
                      {currentEstablishment?.name || t('common.loading')}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <RealtimeStatusIndicator />
                  </div>
                  <div className="flex items-center gap-2">
                    {showOwnerPortalLink && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate('/owner');
                        }}
                        className="rounded-lg px-2 py-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                      >
                        {t('dashboard.menu.backToOwnerPortal')}
                      </button>
                    )}
                    {canSwitchLocation && (
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-400 tracking-widest group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                        {t('dashboard.menu.switchLocation')} <ChevronRight size={10} className={`mt-0.5 ${t('common.locale') === 'ar' ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : canSwitchLocation ? (
          <div className="px-2 flex flex-col items-center gap-4 mb-1.5">

            <button
              onClick={() => navigate('/select-establishment')}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all group relative"
            >
              <MapPin size={24} />
              <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                {t('dashboard.menu.switchLocation')}
              </div>
            </button>
          </div>
        ) : null}

        {/* Navigation */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <nav
            ref={sidebarNavRef}
            className="flex-1 min-h-0 overflow-y-auto overflow-x-visible px-3 space-y-1.5 scrollbar-none pb-4 relative z-10"
            onScroll={() => {
              hideCollapsedNavOverlay();
              updateNavOverflow();
            }}
          >
          {sidebarOpen && (
            <p className="px-3 py-2 text-xs font-semibold text-gray-500 tracking-normal">{t('dashboard.menu.mainMenu')}</p>
          )}

          {filteredMenu.map((item, index) => {
            if (isMenuGroup(item)) {
              const isExpanded = expandedGroup === item.label;
              const isActive = isGroupActive(item.items);
              const Icon = item.icon;


              return (
                <div key={index} className="mb-1">
                  <button
                    data-group={item.label}
                    onClick={() => sidebarOpen && toggleGroup(item.label)}
                    onMouseEnter={(event) => !sidebarOpen && showCollapsedNavOverlay(event.currentTarget, { type: "group", label: item.label, items: item.items })}
                    onMouseLeave={() => !sidebarOpen && scheduleHideCollapsedNavOverlay()}
                    onFocus={(event) => !sidebarOpen && showCollapsedNavOverlay(event.currentTarget, { type: "group", label: item.label, items: item.items })}
                    onBlur={() => !sidebarOpen && scheduleHideCollapsedNavOverlay()}
                    aria-label={!sidebarOpen ? item.label : undefined}
                    className={`
                      flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group relative
                      ${sidebarOpen ? 'w-full' : ''}
                      ${isActive
                        ? (!sidebarOpen ? 'bg-mintcom-green text-black shadow-lg shadow-mintcom-green/20' : 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white')
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                      ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto' : ''}
                    `}
                  >
                    <Icon size={!sidebarOpen ? 24 : 20} className={isActive && !sidebarOpen ? 'text-black' : (isActive ? 'text-mintcom-green' : '')} />

                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-sm font-semibold tracking-normal">{item.label}</span>
                        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-90" : (isRTL ? "rotate-180" : "")}`} />
                      </>
                    )}
                  </button>

                  <AnimatePresence>
                    {isExpanded && sidebarOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="ml-5 pl-4 border-l-2 border-gray-100 dark:border-white/5 space-y-1 my-1">
                          {item.items.map((subItem) => (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path}
                              end={subItem.path === 'settings'}
                              onClick={() => setSidebarOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                  ? 'bg-mintcom-green text-black shadow-md shadow-mintcom-green/20 active-menu-item'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? 'bg-black' : 'bg-gray-300 dark:bg-gray-600'
                                    }`} />
                                  <span>{subItem.label}</span>
                                  {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-black" />
                                  )}
                                </>
                              )}
                            </NavLink>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            } else {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  onClick={() => {
                    setSidebarOpen(false);
                    hideCollapsedNavOverlay();
                  }}
                  onMouseEnter={(event) => !sidebarOpen && showCollapsedNavOverlay(event.currentTarget, { type: "item", label: item.label })}
                  onMouseLeave={() => !sidebarOpen && scheduleHideCollapsedNavOverlay()}
                  onFocus={(event) => !sidebarOpen && showCollapsedNavOverlay(event.currentTarget, { type: "item", label: item.label })}
                  onBlur={() => !sidebarOpen && scheduleHideCollapsedNavOverlay()}
                  aria-label={!sidebarOpen ? item.label : undefined}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? 'bg-mintcom-green text-black font-semibold shadow-lg shadow-mintcom-green/20 active-menu-item'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                    ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto' : ''}`
                  }
                >
                  <Icon size={!sidebarOpen ? 24 : 20} />

                  {sidebarOpen && (
                    <span className="text-sm font-semibold tracking-normal">{item.label}</span>
                  )}
                </NavLink>
              );
            }
          })}
          </nav>

          {navOverflows && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-[#1E293B] dark:via-[#1E293B]/80"
            />
          )}
        </div>

        {!sidebarOpen &&
          collapsedNavOverlay &&
          createPortal(
            <div
              className="pointer-events-auto fixed z-[9999]"
              style={{
                top: collapsedNavOverlay.top,
                left: collapsedNavOverlay.left,
                right: collapsedNavOverlay.right,
              }}
              onMouseEnter={clearCollapsedNavOverlayHide}
              onMouseLeave={scheduleHideCollapsedNavOverlay}
            >
              {collapsedNavOverlay.type === 'group' ? (
                <div
                  className="min-w-[220px] max-w-[min(280px,calc(100vw-1.5rem))] overflow-y-auto overscroll-contain bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10"
                  style={{ maxHeight: collapsedNavOverlay.maxHeight }}
                >
                  <div className="sticky top-0 z-10 px-4 py-2.5 border-b border-gray-100 dark:border-white/5 bg-gray-50/95 dark:bg-[#0D0D0D]/95 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-mintcom-green tracking-normal">
                      {collapsedNavOverlay.label}
                    </p>
                  </div>
                  <div className="px-2 py-2 space-y-0.5">
                    {collapsedNavOverlay.items?.map((subItem) => (
                      <NavLink
                        key={subItem.path}
                        to={subItem.path}
                        end={subItem.path === 'settings'}
                        onClick={() => {
                          setSidebarOpen(false);
                          hideCollapsedNavOverlay();
                        }}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                            isActive
                              ? 'bg-mintcom-green text-black shadow-md shadow-mintcom-green/20 active-menu-item'
                              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span
                              className={`w-1.5 h-1.5 shrink-0 rounded-full transition-colors ${
                                isActive ? 'bg-black' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                            <span className="truncate">{subItem.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pointer-events-none px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg whitespace-nowrap border border-white/10 shadow-xl">
                  {collapsedNavOverlay.label}
                </div>
              )}
            </div>,
            document.body,
          )}

        {/* Footer — match OwnerLayout: expanded list, collapsed icon column */}
        <div className="p-3 border-t border-gray-100 dark:border-white/5 relative shrink-0 mt-auto">
          {sidebarOpen ? (
            <div className="space-y-1">
              <div className="flex items-center gap-3 p-3 mb-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mintcom-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm text-black font-bold text-xs">
                  {account?.firstName?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {account?.firstName} {account?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{account?.email || t('staff.roles.manager')}</p>
                </div>
              </div>

              {hasAccess('notifications') && (
                <div className="flex items-center justify-between gap-3 px-3 py-1">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                    {t('notifications.menu.title')}
                  </span>
                  <AlertsBell
                    scope="location"
                    establishmentId={currentEstablishment?.id}
                    locations={dashboardLocations}
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileAppModalOpen(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
              >
                <Smartphone size={16} className="text-gray-400" />
                <span>{t('dashboard.menu.getMobileApp')}</span>
              </button>

              <SidebarPreferencesHelpMenu
                canReplay={setupGuide.canReplay}
                onReplay={handleSetupGuideReplay}
                onOpenHelpCenter={openHelpCenter}
              />

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all text-left"
              >
                <LogOut size={20} />
                <span>{t('dashboard.menu.logout')}</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {hasAccess('notifications') && (
                <AlertsBell
                  scope="location"
                  establishmentId={currentEstablishment?.id}
                  locations={dashboardLocations}
                />
              )}
              <button
                type="button"
                onClick={() => setMobileAppModalOpen(true)}
                className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all relative group"
              >
                <Smartphone size={24} />
                <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                  {t('dashboard.menu.getMobileApp')}
                </div>
              </button>

              <SidebarPreferencesHelpMenu
                compact
                canReplay={setupGuide.canReplay}
                onReplay={handleSetupGuideReplay}
                onOpenHelpCenter={openHelpCenter}
              />

              <button
                type="button"
                onClick={handleLogout}
                className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all relative group"
              >
                <LogOut size={24} />
                <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                  {t('dashboard.menu.logout')}
                </div>
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col overflow-hidden"
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      >
        <DeletionRestorationBanner />
        {/* Top Bar (Mobile) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1E293B] border-b border-gray-200 dark:border-white/5">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <Menu size={24} className="text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex items-center gap-2">
            <img src={MintcomLeafIcon} className="w-8 h-8 object-contain" alt={t('brand.name').charAt(0)} />
            <span className="font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</span>
          </div>

          <div className="flex items-center gap-2">
            {hasAccess('notifications') && (
              <AlertsBell
                scope="location"
                establishmentId={currentEstablishment?.id}
                locations={dashboardLocations}
              />
            )}
            <ThemeToggle />
          </div>
        </div>

        {/* Content Landscape */}
        <main
          data-setup-guide-focus-fallback
          tabIndex={-1}
          className="flex-1 relative bg-gray-50 dark:bg-mintcom-dark overflow-hidden flex flex-col"
        >
          <div ref={mainContentRef} className="flex-1 overflow-y-auto relative z-10 custom-scrollbar p-4 lg:px-10 lg:pt-8 lg:pb-6 pb-24 w-full">
            {isDashboardContentLocked ? (
              <CenteredOverlay>
                {sessionConflict ? (
                  <div className="w-full max-w-sm text-center pointer-events-auto">
                    <div className="mx-auto mb-5 h-12 w-12 rounded-2xl bg-mintcom-green/10 border border-mintcom-green/20 flex items-center justify-center">
                      <Shield size={24} className="text-mintcom-green" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 dark:text-white">
                      {t('dashboard.session.inUseTitle', { defaultValue: 'Dashboard in use' })}
                    </h2>
                    <p className="mt-2 text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                      {conflictMessage}
                    </p>
                  </div>
                ) : (
                  <SectionLoader
                    message={t('dashboard.session.securingTitle', { defaultValue: 'Securing Dashboard' })}
                    minHeightClassName=""
                  />
                )}
              </CenteredOverlay>
            ) : (
              <Outlet context={{ sidebarOpen, setupGuide }} />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-2xl z-[100] flex flex-col lg:hidden"
          >
            {/* Close Button */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <img src={MintcomLeafIcon} className="w-8 h-8 object-contain" alt={t('brand.name').charAt(0)} />
                <span className="font-bold text-gray-900 dark:text-white">{t('brand.name')}</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto mt-4">
              {filteredMenu.map((item, index) => {
                if (isMenuGroup(item)) {
                  // Simplified mobile menu for groups: just list items
                  return (
                    <div key={index} className="mb-2">
                      <p className="px-3 py-2 text-xs font-semibold text-gray-500 tracking-normal">{item.label}</p>
                      <div className="pl-2 space-y-1">
                        {item.items.map((subItem) => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            end={subItem.path === 'settings'}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? 'bg-mintcom-green text-black font-bold shadow-md shadow-mintcom-green/20'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-black' : 'bg-current opacity-50'}`} />
                                <span>{subItem.label}</span>
                              </>
                            )}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  );
                } else {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 p-3.5 rounded-xl transition-all ${isActive
                          ? 'bg-mintcom-green text-black font-semibold shadow-lg shadow-mintcom-green/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon size={20} />
                      <span className="text-sm font-semibold tracking-normal">{item.label}</span>
                    </NavLink>
                  );
                }
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-white/5">
              {showOwnerPortalLink && (
                <button
                  type="button"
                  onClick={() => {
                    navigate('/owner');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2.5 mb-3 rounded-xl text-sm font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all text-left rtl:text-right"
                >
                  {t('dashboard.menu.backToOwnerPortal')}
                </button>
              )}
              <div className="mb-3">
                <SidebarPreferencesHelpMenu
                  canReplay={setupGuide.canReplay}
                  onReplay={handleSetupGuideReplay}
                  onOpenHelpCenter={openHelpCenter}
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mintcom-green to-emerald-600 flex items-center justify-center">
                  <span className="text-black font-bold">{account?.firstName?.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{account?.firstName}</p>
                  <p className="text-xs text-gray-500">{t('owner.staff.standardUsers')}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation
        onMenuClick={() => setMobileMenuOpen(true)}
        onMobileAppClick={() => setMobileAppModalOpen(true)}
        items={mobileBottomNavItems}
      />

      <ConfirmModal
        isOpen={!!sessionConflict}
        onClose={sessionConflict?.canKick ? closeDashboardConflict : () => void forceDashboardLogout(conflictMessage)}
        onConfirm={
          sessionConflict?.canKick
            ? handleTakeOverDashboard
            : () => void forceDashboardLogout(conflictMessage)
        }
        title={
          sessionConflict?.canKick
            ? isAnotherOwnerDeviceConflict
              ? t('dashboard.session.ownerDeviceConflictTitle', { defaultValue: 'Another device is inside' })
              : t('dashboard.session.ownerConflictTitle', { defaultValue: 'Someone is inside' })
            : t('dashboard.session.inUseTitle', { defaultValue: 'Dashboard in use' })
        }
        message={
          sessionConflict?.canKick
            ? `${conflictMessage} You can kick them out and continue here.`
            : `${conflictMessage} Please sign out here or ask them to exit first.`
        }
        confirmText={
          sessionConflict?.canKick
            ? isTakingOverDashboard
              ? t('common.loading', { defaultValue: 'Working...' })
              : t('dashboard.session.kickAndEnter', { defaultValue: 'Kick out and enter' })
            : t('dashboard.menu.logout')
        }
        cancelText={t('common.cancel')}
        type={sessionConflict?.canKick ? 'warning' : 'danger'}
        showCancel={!!sessionConflict?.canKick}
      />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        message={t('common.confirmLogout')}
        confirmText={t('dashboard.menu.logout')}
        cancelText={t('common.cancel')}
        type="danger"
      />
      <MobileAppModal
        isOpen={mobileAppModalOpen}
        onClose={() => setMobileAppModalOpen(false)}
        androidUrl={ANDROID_DOWNLOAD_URL}
        iosUrl={IOS_DOWNLOAD_URL}
        appType="pos"
      />
    </div>
  );
}

import { MobileAppModal } from './MobileAppModal';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
import { BottomNavigation } from './mobile/BottomNavigation';
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
  Settings,
  Sliders,
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
  ShoppingBag
} from 'lucide-react';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';
import PaymintLeafIcon from '../assets/small-logo.svg';
import { ConfirmModal } from './ConfirmModal';
import { getBusinessTypeIcon } from '../utils/businessTypeIcons';
import { RealtimeStatusIndicator } from './RealtimeStatusIndicator';

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

const SIDEBAR_STATE_KEY = 'dashboard_sidebar_expanded';

export function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { account, currentEstablishment, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileAppModalOpen, setMobileAppModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

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
          { path: 'reports/payments', label: t('dashboard.menu.paymentsReports'), icon: CreditCard },
          { path: 'reports/discounts', label: t('dashboard.menu.discountReports'), icon: Percent },
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
        label: t('dashboard.menu.system'),
        icon: Sliders,
        items: [
          { path: 'settings', label: t('dashboard.menu.establishmentSettings'), icon: Sliders },
          { path: 'activity-logs', label: t('dashboard.menu.activityLog'), icon: History },        ],
      },
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
  const [collapsedNavOverlay, setCollapsedNavOverlay] = useState<{ type: 'group' | 'item'; label: string; items?: MenuItem[]; top: number; offset: number } | null>(null);

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
    if (sidebarOpen || !sidebarRef.current) {
      return;
    }

    clearCollapsedNavOverlayHide();

    const itemRect = target.getBoundingClientRect();
    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const overlayGap = 10;

    setCollapsedNavOverlay({
      ...overlay,
      top: itemRect.top - sidebarRect.top + (itemRect.height / 2),
      offset: isRTL
        ? (sidebarRect.right - itemRect.left) + overlayGap
        : (itemRect.right - sidebarRect.left) + overlayGap,
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
                  src={PaymintLogoGreen}
                  alt={t('brand.name')}
                  width={160}
                  height={40}
                  loading="eager"
                  decoding="async"
                  className="h-10 w-auto object-contain dark:hidden transition-transform"
                />
                <img
                  src={PaymintLogoWhite}
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
                  className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 hover:border-paymint-green/40 text-paymint-green transition-all group relative"
                  onClick={() => setSidebarOpen(true)}
                >
                  <img src={PaymintLeafIcon} width={32} height={32} className="w-8 h-8 object-contain transition-all duration-300 opacity-100 rotate-0 group-hover/sidebar:opacity-0 group-hover/sidebar:rotate-90 absolute" alt={t('brand.name').charAt(0)} loading="eager" decoding="async" />
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
              className="p-2 rounded-xl text-gray-400 hover:text-paymint-green hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              <PanelLeftClose size={20} />
            </button>
          )}
        </div>

        {/* Current Establishment Card */}
        {sidebarOpen ? (
          <div className="px-2 pb-2 pt-0">
            <div
              className="p-3.5 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm relative overflow-hidden group cursor-pointer transition-all duration-300 hover:border-paymint-green/30"
              onClick={() => navigate('/select-establishment')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 dark:bg-paymint-green/10 rounded-full blur-3xl pointer-events-none transition-transform duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const Icon = getBusinessTypeIcon(currentEstablishment?.type || '');
                      return <Icon size={18} className="text-paymint-green" />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="label-strong font-outfit text-paymint-green mb-0.5">{t('dashboard.menu.activeLocation')}</p>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-[1.2] font-sans truncate">
                      {currentEstablishment?.name || t('common.loading')}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <RealtimeStatusIndicator />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-gray-400 tracking-widest group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {t('dashboard.menu.switchLocation')} <ChevronRight size={10} className={`mt-0.5 ${t('common.locale') === 'ar' ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
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
        )}

        {/* Navigation */}
        <nav
          ref={sidebarNavRef}
          className="flex-1 min-h-0 overflow-y-auto overflow-x-visible px-3 space-y-1.5 scrollbar-none pb-4 relative z-10"
          onScroll={hideCollapsedNavOverlay}
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
                        ? (!sidebarOpen ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20' : 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white')
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                      ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto' : ''}
                    `}
                  >
                    <Icon size={!sidebarOpen ? 24 : 20} className={isActive && !sidebarOpen ? 'text-black' : (isActive ? 'text-paymint-green' : '')} />

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
                              onClick={() => setSidebarOpen(false)}
                              className={({ isActive }) =>
                                `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                  ? 'bg-paymint-green text-black shadow-md shadow-paymint-green/20 active-menu-item'
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
                      ? 'bg-paymint-green text-black font-semibold shadow-lg shadow-paymint-green/20 active-menu-item'
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

        {!sidebarOpen && collapsedNavOverlay && (
          <div
            className="absolute top-0 -translate-y-1/2 z-[100]"
            style={{
              top: collapsedNavOverlay.top,
              left: isRTL ? undefined : collapsedNavOverlay.offset,
              right: isRTL ? collapsedNavOverlay.offset : undefined,
            }}
          >
            {collapsedNavOverlay.type === "group" ? (
              <div
                className="min-w-[200px] max-h-[420px] overflow-y-auto bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl"
                onMouseEnter={clearCollapsedNavOverlayHide}
                onMouseLeave={scheduleHideCollapsedNavOverlay}
              >
                <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                  <p className="text-xs font-semibold text-paymint-green tracking-normal">{collapsedNavOverlay.label}</p>
                </div>
                <div className="px-2 py-2 space-y-1">
                  {collapsedNavOverlay.items?.map((subItem) => (
                    <NavLink
                      key={subItem.path}
                      to={subItem.path}
                      onClick={() => {
                        setSidebarOpen(false);
                        hideCollapsedNavOverlay();
                      }}
                      className={({ isActive }) =>
                        `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                          ? 'bg-paymint-green text-black shadow-md shadow-paymint-green/20 active-menu-item'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isActive ? "bg-black" : "bg-gray-300 dark:bg-gray-600"}`} />
                          <span>{subItem.label}</span>
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
          </div>
        )}

        {/* Mobile App Download - With QR Code Popup */}
        {sidebarOpen && (
          <div className="px-3 mt-auto mb-2 shrink-0">
            <button onClick={() => setMobileAppModalOpen(true)} className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
              <Smartphone size={16} className="text-gray-400" />
              <span className="text-sm font-bold">{t('dashboard.menu.getMobileApp')}</span>
            </button>
          </div>
        )}


        {/* Footer User Profile */}
        <div className="p-3 border-t border-gray-100 dark:border-white/5 relative shrink-0">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-paymint-green/20 outline outline-2 outline-white dark:outline-black">
                <span className="text-black font-bold text-xs">
                  {account?.firstName?.charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {account?.firstName} {account?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{t('staff.roles.manager')}</p>
              </div>

              {/* Actions: Theme & Logout */}
              <div className="flex items-center gap-1">
                <ThemeToggle dropdownDirection="up" className="w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white" />
                <button
                  onClick={handleLogout}
                  className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
                  title={t('dashboard.menu.logout')}
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              {/* Settings Circle */}
              <button
                onClick={() => setSettingsMenuOpen(!settingsMenuOpen)}
                className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all relative group ${settingsMenuOpen
                  ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                  }`}
              >
                <Settings size={24} />
                {/* Tooltip */}
                <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
                  {t('dashboard.menu.settings')}
                </div>
              </button>

              {/* Popover Menu */}
              <AnimatePresence>
                {settingsMenuOpen && (
                  <>
                    {/* Backdrop to close */}
                    <div
                      className="fixed inset-0 z-[95]"
                      onClick={() => setSettingsMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: 20 }}
                      className="absolute left-full rtl:left-auto rtl:right-full bottom-10 ml-4 rtl:ml-0 rtl:mr-4 w-64 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-[12px] shadow-2xl z-[100] p-2"
                    >
                      {/* Header */}
                      <div className="flex items-center gap-3 p-3 mb-2 bg-gray-50 dark:bg-white/5 rounded-[12px]">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm text-black font-bold text-xs">
                          {account?.firstName?.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {account?.firstName} {account?.lastName}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{account?.email}</p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setSettingsMenuOpen(false);
                            setMobileAppModalOpen(true);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                        >
                          <Smartphone size={18} />
                          <span>{t('dashboard.menu.getMobileApp')}</span>
                        </button>

                        <div className="relative">
                          <LanguageSwitcher
                            label={t('common.aria.changeLanguage')}
                            dropdownDirection="right"
                            className="w-full"
                            buttonClassName="w-full justify-start gap-3 px-3 !py-2.5 rounded-[12px] text-sm font-medium text-gray-600 dark:text-gray-400 hover:!bg-gray-50 dark:hover:!bg-white/5 hover:!text-gray-900 dark:hover:!text-white transition-all text-left !bg-transparent dark:!bg-transparent !border-transparent"
                          />
                        </div>

                        {/* Theme Item - We wrap accessibility of ThemeToggle or recreate it visually */}
                        <div className="relative">
                          <ThemeToggle
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                            showLabel={true}
                            dropdownDirection="right"
                            iconSize={18}
                          />
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                        >
                          <LogOut size={18} />
                          <span>{t('dashboard.menu.logout')}</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
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
            <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt={t('brand.name').charAt(0)} />
            <span className="font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</span>
          </div>

          <ThemeToggle />
        </div>

        {/* Content Landscape */}
        <main className="flex-1 relative bg-gray-50 dark:bg-paymint-dark overflow-hidden">
          <div ref={mainContentRef} className="h-full overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
            <div className="p-4 md:p-6 lg:p-8 pb-24 max-w-[1920px] mx-auto">
              <Outlet context={{ sidebarOpen }} />
            </div>
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
                <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt={t('brand.name').charAt(0)} />
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
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? 'bg-paymint-green text-black font-bold shadow-md shadow-paymint-green/20'
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
                          ? 'bg-paymint-green text-black font-semibold shadow-lg shadow-paymint-green/20'
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center">
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
        items={mobileBottomNavItems}
      />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title={t('common.confirmLogoutTitle')}
        message={t('common.confirmLogout')}
        confirmText={t('dashboard.menu.logout')}
        cancelText={t('common.cancel')}
        type="danger"
      />



      <MobileAppModal isOpen={mobileAppModalOpen} onClose={() => setMobileAppModalOpen(false)} />
    </div>
  );
}


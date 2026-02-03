import { useState, useEffect, useRef, useMemo } from 'react';
import { AppStrings } from '../constants/AppStrings';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
import { BottomNavigation } from './mobile/BottomNavigation';
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
  Award
} from 'lucide-react';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.png';
import PaymintLogoWhite from '../assets/white-green-full-logo.png';
import PaymintLeafIcon from '../assets/small-logo.png';
import { ConfirmModal } from './ConfirmModal';
import { getBusinessTypeIcon } from '../utils/businessTypeIcons';

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

// Relative paths (no leading slash, except for sub-routes which are just 'path/to')
const menuStructure: MenuItemOrGroup[] = [
  { path: '.', label: 'Dashboard', icon: LayoutDashboard }, // . for index
  {
    label: 'Sales and Reporting',
    icon: FileBarChart,
    items: [
      { path: 'reports/sales', label: 'Sales Summary', icon: FileBarChart },
      { path: 'reports/items', label: 'Sales by Items', icon: Package },
      { path: 'reports/modifiers', label: 'Sales by Add-Ons', icon: Package },
      { path: 'reports/staff-sales', label: 'Sales by Staff', icon: Users },
      { path: 'reports/shifts', label: 'Shifts Reports', icon: FileBarChart },
      { path: 'reports/payments', label: 'Payments Reports', icon: CreditCard },
      { path: 'reports/discounts', label: 'Discount Reports', icon: Percent },
    ],
  },
  { path: 'orders', label: 'View Customer Orders', icon: ShoppingCart },
  {
    label: "Item's Menu",
    icon: Package,
    items: [
      { path: 'categories', label: 'Categories', icon: LayoutDashboard },
      { path: 'products', label: 'Products', icon: Package },
      { path: 'addons', label: 'Add-Ons', icon: Package },
      { path: 'materials', label: 'Ingredients', icon: Package },
      { path: 'recipes', label: 'Recipes', icon: FileBarChart },
    ],
  },
  { path: 'payment-methods', label: 'Payment Methods', icon: CreditCard },
  {
    label: 'Team Management',
    icon: Users,
    items: [
      { path: 'staff', label: 'Team', icon: Users },
      { path: 'roles', label: 'Roles', icon: Shield },
    ],
  },
  {
    label: 'Discounts and Loyalty',
    icon: Heart,
    items: [
      { path: 'discounts', label: 'Discounts', icon: Percent },
      { path: 'loyalty', label: 'Loyalty', icon: Award },
      { path: 'customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'System',
    icon: Sliders,
    items: [
      { path: 'settings', label: 'Settings', icon: Sliders },
      { path: 'activity-logs', label: 'System Logs', icon: History },
    ],
  },
];

const REQUIRED_PERMISSIONS: Record<string, string[]> = {
  // Reports
  'reports/sales': ['view_reports', 'reports'],
  'reports/items': ['view_reports', 'reports'],
  'reports/categories': ['view_reports', 'reports'],
  'reports/staff-sales': ['view_reports', 'reports'],
  'reports/payments': ['view_reports', 'reports'],
  'reports/modifiers': ['view_reports', 'reports'],
  'reports/discounts': ['view_reports', 'reports'],
  'reports/taxes': ['view_reports', 'reports'],
  'reports/shifts': ['view_reports', 'reports'],

  // Orders
  'orders': ['view_orders'],

  // Inventory
  'categories': ['manage_inventory', 'items'],
  'products': ['manage_inventory', 'items'],
  'addons': ['manage_inventory', 'items'],
  'materials': ['manage_inventory', 'items'],
  'recipes': ['manage_inventory', 'items'],

  // Sales
  'payment-methods': ['manage_payment_methods', 'manage_settings', 'settings'],

  // People
  'staff': ['manage_employees', 'employees'],
  'roles': ['manage_employees', 'employees'],

  // Discounts
  'discounts': ['manage_discounts', 'manage_settings', 'settings'],
  'loyalty': ['manage_settings', 'settings'],
  'customers': ['manage_customers', 'manage_employees', 'employees'],

  // Settings
  'settings': ['manage_settings', 'settings'],
  'activity-logs': ['view_activity_logs', 'view_reports', 'reports'],
};

const SIDEBAR_STATE_KEY = 'dashboard_sidebar_expanded';

export function DashboardLayout() {
  const { account, currentEstablishment, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);

  const getRelativePathFromUrl = (pathname: string): string => {
    // /dashboard/:slug/rest -> rest
    const parts = pathname.split('/');
    // parts[0] = '', [1] = 'dashboard', [2] = slug, [3...] = rest
    if (parts.length <= 3) return '.'; // pointing to root
    return parts.slice(3).join('/');
  };

  // Filter menu based on permissions
  const filteredMenu = useMemo(() => {
    if (!account) return [];
    if (!account.isSecondaryAdmin) return menuStructure;

    const userPerms = new Set(account.permissions || []);

    const hasAccess = (path: string) => {
      if (path === '.') return true; // root

      const required = REQUIRED_PERMISSIONS[path];
      if (!required) return true;

      return required.some(p => userPerms.has(p));
    };

    return menuStructure.map(item => {
      if (isMenuGroup(item)) {
        const visibleItems = item.items.filter(subItem => hasAccess(subItem.path));
        if (visibleItems.length > 0) {
          return { ...item, items: visibleItems };
        }
        return null;
      }
      return hasAccess(item.path) ? item : null;
    }).filter((item): item is MenuItemOrGroup => item !== null);
  }, [account]);


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
    localStorage.setItem(SIDEBAR_STATE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Collapse all groups when sidebar is closed
  useEffect(() => {
    if (!sidebarOpen) {
      setExpandedGroup(null);
    }
  }, [sidebarOpen]);

  const handleLogout = () => setIsLogoutModalOpen(true);
  const confirmLogout = () => { logout(); };

  const sidebarNavRef = useRef<HTMLElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const prevSidebarOpen = useRef(sidebarOpen);

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
        setExpandedGroup(currentGroup.label);
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

  const CurrentEstIcon = getBusinessTypeIcon(currentEstablishment?.type || '');

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden transition-colors duration-500">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 300 : 100,
          transition: { duration: 0.4, type: "spring", damping: 25, stiffness: 200 }
        }}
        className={`
          relative z-50 flex flex-col h-screen py-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-lg group/sidebar
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
                onClick={() => navigate('.')}
              >
                <img
                  src={PaymintLogoGreen}
                  alt="PayMint"
                  className="h-10 w-auto object-contain dark:hidden transition-transform"
                />
                <img
                  src={PaymintLogoWhite}
                  alt="PayMint"
                  className="h-10 w-auto object-contain hidden dark:block transition-transform"
                />
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
                  <img src={PaymintLeafIcon} className="w-6 h-6 object-contain transition-all duration-300 opacity-100 rotate-0 group-hover/sidebar:opacity-0 group-hover/sidebar:rotate-90 absolute" alt="P" />
                  <PanelLeft
                    size={24}
                    className="transition-all duration-300 opacity-0 -rotate-90 group-hover/sidebar:opacity-100 group-hover/sidebar:rotate-0 absolute text-gray-500 dark:text-gray-400 group-hover/sidebar:text-gray-900 dark:group-hover/sidebar:text-white"
                  />
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                    Open sidebar
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
                    <CurrentEstIcon size={18} className="text-paymint-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-paymint-green tracking-widest mb-0.5">{AppStrings.STATUS.ACTIVE} Location</p>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-[1.2] font-sans truncate">
                      {currentEstablishment?.name || AppStrings.COMMON.LOADING}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-xs font-black text-gray-400 tracking-widest">{AppStrings.STATUS.ONLINE}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-black text-gray-400 tracking-widest group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Switch Location <ChevronRight size={10} className="mt-0.5" />
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
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                Switch Location
              </div>
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav
          ref={sidebarNavRef}
          className={`flex-1 px-3 space-y-1.5 scrollbar-none pb-4 ${sidebarOpen ? 'overflow-y-auto' : 'overflow-visible'}`}
        >
          {sidebarOpen && (
            <p className="px-3 py-2 text-xs font-black text-gray-400 tracking-widest">Main Menu</p>
          )}

          {filteredMenu.map((item, index) => {
            if (isMenuGroup(item)) {
              const isExpanded = expandedGroup === item.label;
              const isActive = isGroupActive(item.items);
              const Icon = item.icon;
              const isBottomItem = ['Team Management', 'Discounts and Loyalty', 'System'].includes(item.label);

              return (
                <div key={index} className="mb-1">
                  <button
                    data-group={item.label}
                    onClick={() => sidebarOpen && toggleGroup(item.label)}
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
                        <span className="flex-1 text-left text-sm font-bold">{item.label}</span>
                        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </>
                    )}

                    {!sidebarOpen && (
                      <div className={`absolute left-[calc(100%+8px)] ${isBottomItem ? 'bottom-0' : 'top-0'} opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] pointer-events-none group-hover:pointer-events-auto translate-x-1 group-hover:translate-x-0`}>
                        <div className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] py-2">
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 mb-1 bg-gray-50/50 dark:bg-white/[0.02]">
                            <p className="text-xs font-black text-paymint-green tracking-widest">{item.label}</p>
                          </div>
                          <div className="px-2 space-y-1">
                            {item.items.map((subItem) => (
                              <NavLink
                                key={subItem.path}
                                to={subItem.path}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                                    ? 'bg-paymint-green text-black shadow-md shadow-paymint-green/20 active-menu-item'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                  }`
                                }
                              >
                                <span>{subItem.label}</span>
                              </NavLink>
                            ))}
                          </div>
                        </div>
                        {/* Bridge hitbox to allow mouse movement to the popover */}
                        <div className={`absolute -left-4 w-4 bg-transparent ${isBottomItem ? 'bottom-0 h-full' : 'top-0 bottom-0'}`} />
                      </div>
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
                                `flex items-center gap-3 p-3.5 rounded-xl text-sm font-bold transition-all ${isActive
                                  ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20 active-menu-item'
                                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5'
                                }`
                              }
                            >
                              <span>{subItem.label}</span>
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
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? 'bg-paymint-green text-black font-bold shadow-lg shadow-paymint-green/20 active-menu-item'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                    ${!sidebarOpen ? 'justify-center w-12 h-12 mx-auto' : ''}`
                  }
                >
                  <Icon size={!sidebarOpen ? 24 : 20} />

                  {sidebarOpen && (
                    <span className="text-sm font-bold">{item.label}</span>
                  )}

                  {!sidebarOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[70] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            }
          })}
        </nav>

        {/* Mobile App Download - With QR Code Popup */}
        {sidebarOpen && (
          <div className="px-3 mt-auto mb-2">
            <div className="relative group">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                <Smartphone size={16} className="text-gray-400" />
                <span className="text-sm font-bold">Mobile App</span>
              </button>

              {/* QR Code Popup */}
              <div className="absolute left-full bottom-0 ml-3 bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-[70] translate-x-2 group-hover:translate-x-0 w-[200px]">
                {/* QR Code Container */}
                <div className="bg-white rounded-xl p-3 mb-4 shadow-inner">
                  {/* Fake QR Code Pattern */}
                  <div className="w-full aspect-square bg-white relative overflow-hidden rounded-lg">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {/* QR code pattern - simplified fake version */}
                      <rect width="100" height="100" fill="white" />
                      {/* Corner squares */}
                      <rect x="5" y="5" width="25" height="25" fill="black" />
                      <rect x="8" y="8" width="19" height="19" fill="white" />
                      <rect x="11" y="11" width="13" height="13" fill="black" />

                      <rect x="70" y="5" width="25" height="25" fill="black" />
                      <rect x="73" y="8" width="19" height="19" fill="white" />
                      <rect x="76" y="11" width="13" height="13" fill="black" />

                      <rect x="5" y="70" width="25" height="25" fill="black" />
                      <rect x="8" y="73" width="19" height="19" fill="white" />
                      <rect x="11" y="76" width="13" height="13" fill="black" />

                      {/* Random pattern blocks */}
                      <rect x="35" y="5" width="5" height="5" fill="black" />
                      <rect x="45" y="5" width="5" height="5" fill="black" />
                      <rect x="55" y="5" width="5" height="5" fill="black" />
                      <rect x="35" y="15" width="5" height="5" fill="black" />
                      <rect x="50" y="15" width="5" height="5" fill="black" />
                      <rect x="60" y="15" width="5" height="5" fill="black" />
                      <rect x="40" y="25" width="5" height="5" fill="black" />
                      <rect x="55" y="25" width="5" height="5" fill="black" />

                      <rect x="5" y="35" width="5" height="5" fill="black" />
                      <rect x="15" y="35" width="5" height="5" fill="black" />
                      <rect x="25" y="35" width="5" height="5" fill="black" />
                      <rect x="5" y="45" width="5" height="5" fill="black" />
                      <rect x="20" y="45" width="5" height="5" fill="black" />
                      <rect x="5" y="55" width="5" height="5" fill="black" />
                      <rect x="15" y="55" width="5" height="5" fill="black" />
                      <rect x="25" y="55" width="5" height="5" fill="black" />

                      <rect x="35" y="35" width="30" height="30" fill="black" />
                      <rect x="40" y="40" width="20" height="20" fill="white" />
                      <rect x="45" y="45" width="10" height="10" fill="black" />

                      <rect x="70" y="35" width="5" height="5" fill="black" />
                      <rect x="80" y="35" width="5" height="5" fill="black" />
                      <rect x="90" y="35" width="5" height="5" fill="black" />
                      <rect x="75" y="45" width="5" height="5" fill="black" />
                      <rect x="85" y="45" width="5" height="5" fill="black" />
                      <rect x="70" y="55" width="5" height="5" fill="black" />
                      <rect x="80" y="55" width="5" height="5" fill="black" />

                      <rect x="35" y="70" width="5" height="5" fill="black" />
                      <rect x="45" y="70" width="5" height="5" fill="black" />
                      <rect x="55" y="70" width="5" height="5" fill="black" />
                      <rect x="70" y="70" width="5" height="5" fill="black" />
                      <rect x="80" y="70" width="5" height="5" fill="black" />
                      <rect x="90" y="70" width="5" height="5" fill="black" />
                      <rect x="40" y="80" width="5" height="5" fill="black" />
                      <rect x="50" y="80" width="5" height="5" fill="black" />
                      <rect x="75" y="80" width="5" height="5" fill="black" />
                      <rect x="85" y="80" width="5" height="5" fill="black" />
                      <rect x="35" y="90" width="5" height="5" fill="black" />
                      <rect x="55" y="90" width="5" height="5" fill="black" />
                      <rect x="70" y="90" width="5" height="5" fill="black" />
                      <rect x="90" y="90" width="5" height="5" fill="black" />
                    </svg>
                    {/* Center logo placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <img src={PaymintLeafIcon} alt="P" className="w-5 h-5 object-contain" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text */}
                <p className="text-center text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  Scan to download<br />
                  <span className="text-paymint-green">Paymint App</span>
                </p>
              </div>
            </div>
          </div>
        )}


        {/* Footer User Profile */}
        <div className="p-3 border-t border-gray-100 dark:border-white/5 relative">
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
                <p className="text-xs text-gray-500 truncate">Manager</p>
              </div>

              {/* Actions: Theme & Logout */}
              <div className="flex items-center gap-1">
                <ThemeToggle dropdownDirection="up" className="w-12 h-12 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white" />
                <button
                  onClick={handleLogout}
                  className="w-12 h-12 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
                  title="Sign Out"
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
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900/90 backdrop-blur-md text-white text-xs font-black tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 group-hover:translate-x-0">
                  Settings
                </div>
              </button>

              {/* Popover Menu */}
              <AnimatePresence>
                {settingsMenuOpen && (
                  <>
                    {/* Backdrop to close */}
                    <div
                      className="fixed inset-0 z-[60]"
                      onClick={() => setSettingsMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, x: 20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: 20 }}
                      className="absolute left-full bottom-0 ml-4 w-64 bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-[70] p-2"
                    >
                      {/* Header */}
                      <div className="flex items-center gap-3 p-3 mb-2 bg-gray-50 dark:bg-white/5 rounded-xl">
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
                        <div className="relative group">
                          <button
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                          >
                            <Smartphone size={18} />
                            <span>Get Mobile App</span>
                          </button>
                          {/* QR Code Popup */}
                          <div className="absolute left-full bottom-0 ml-2 bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 border border-gray-200 dark:border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-[80] translate-x-2 group-hover:translate-x-0 w-[200px]">
                            {/* QR Code Container */}
                            <div className="bg-white rounded-xl p-3 mb-4 shadow-inner">
                              {/* Fake QR Code Pattern */}
                              <div className="w-full aspect-square bg-white relative overflow-hidden rounded-lg">
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                  <rect width="100" height="100" fill="white" />
                                  <rect x="5" y="5" width="25" height="25" fill="black" />
                                  <rect x="8" y="8" width="19" height="19" fill="white" />
                                  <rect x="11" y="11" width="13" height="13" fill="black" />
                                  <rect x="70" y="5" width="25" height="25" fill="black" />
                                  <rect x="73" y="8" width="19" height="19" fill="white" />
                                  <rect x="76" y="11" width="13" height="13" fill="black" />
                                  <rect x="5" y="70" width="25" height="25" fill="black" />
                                  <rect x="8" y="73" width="19" height="19" fill="white" />
                                  <rect x="11" y="76" width="13" height="13" fill="black" />
                                  <rect x="35" y="5" width="5" height="5" fill="black" />
                                  <rect x="45" y="5" width="5" height="5" fill="black" />
                                  <rect x="55" y="5" width="5" height="5" fill="black" />
                                  <rect x="35" y="15" width="5" height="5" fill="black" />
                                  <rect x="50" y="15" width="5" height="5" fill="black" />
                                  <rect x="60" y="15" width="5" height="5" fill="black" />
                                  <rect x="40" y="25" width="5" height="5" fill="black" />
                                  <rect x="55" y="25" width="5" height="5" fill="black" />
                                  <rect x="5" y="35" width="5" height="5" fill="black" />
                                  <rect x="15" y="35" width="5" height="5" fill="black" />
                                  <rect x="25" y="35" width="5" height="5" fill="black" />
                                  <rect x="5" y="45" width="5" height="5" fill="black" />
                                  <rect x="20" y="45" width="5" height="5" fill="black" />
                                  <rect x="5" y="55" width="5" height="5" fill="black" />
                                  <rect x="15" y="55" width="5" height="5" fill="black" />
                                  <rect x="25" y="55" width="5" height="5" fill="black" />
                                  <rect x="35" y="35" width="30" height="30" fill="black" />
                                  <rect x="40" y="40" width="20" height="20" fill="white" />
                                  <rect x="45" y="45" width="10" height="10" fill="black" />
                                  <rect x="70" y="35" width="5" height="5" fill="black" />
                                  <rect x="80" y="35" width="5" height="5" fill="black" />
                                  <rect x="90" y="35" width="5" height="5" fill="black" />
                                  <rect x="75" y="45" width="5" height="5" fill="black" />
                                  <rect x="85" y="45" width="5" height="5" fill="black" />
                                  <rect x="70" y="55" width="5" height="5" fill="black" />
                                  <rect x="80" y="55" width="5" height="5" fill="black" />
                                  <rect x="35" y="70" width="5" height="5" fill="black" />
                                  <rect x="45" y="70" width="5" height="5" fill="black" />
                                  <rect x="55" y="70" width="5" height="5" fill="black" />
                                  <rect x="70" y="70" width="5" height="5" fill="black" />
                                  <rect x="80" y="70" width="5" height="5" fill="black" />
                                  <rect x="90" y="70" width="5" height="5" fill="black" />
                                  <rect x="40" y="80" width="5" height="5" fill="black" />
                                  <rect x="50" y="80" width="5" height="5" fill="black" />
                                  <rect x="75" y="80" width="5" height="5" fill="black" />
                                  <rect x="85" y="80" width="5" height="5" fill="black" />
                                  <rect x="35" y="90" width="5" height="5" fill="black" />
                                  <rect x="55" y="90" width="5" height="5" fill="black" />
                                  <rect x="70" y="90" width="5" height="5" fill="black" />
                                  <rect x="90" y="90" width="5" height="5" fill="black" />
                                </svg>
                                {/* Center logo placeholder */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                    {/* Note: I need to ensure PaymintLeafIcon is available or imported. It is used elsewhere I presume. */}
                                    <img src={PaymintLeafIcon} alt="P" className="w-5 h-5 object-contain" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Text */}
                            <p className="text-center text-sm font-bold text-gray-900 dark:text-white leading-tight">
                              Scan to download<br />
                              <span className="text-paymint-green">Paymint App</span>
                            </p>
                          </div>
                        </div>

                        {/* Theme Item - We wrap accessibility of ThemeToggle or recreate it visually */}
                        <div className="relative">
                          <ThemeToggle
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all text-left"
                            showLabel={true}
                            dropdownDirection="right"
                            iconSize={18}
                          />
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all text-left"
                        >
                          <LogOut size={18} />
                          <span>Sign Out</span>
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
            <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt="P" />
            <span className="font-bold text-gray-900 dark:text-white">Dashboard</span>
          </div>

          <ThemeToggle />
        </div>

        {/* Content Landscape */}
        <main className="flex-1 relative bg-gray-50 dark:bg-[#050505] overflow-hidden">
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
            className="fixed left-0 top-0 h-screen w-[280px] bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-2xl z-50 flex flex-col lg:hidden"
          >
            {/* Close Button */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3">
                <img src={PaymintLeafIcon} className="w-8 h-8 object-contain" alt="P" />
                <span className="font-bold text-gray-900 dark:text-white">Paymint</span>
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
              {menuStructure.map((item, index) => {
                if (isMenuGroup(item)) {
                  // Simplified mobile menu for groups: just list items
                  return (
                    <div key={index} className="mb-2">
                      <p className="px-3 py-2 text-xs font-black text-gray-400 tracking-widest">{item.label}</p>
                      <div className="pl-2 space-y-1">
                        {item.items.map((subItem) => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all ${isActive
                                ? 'bg-paymint-green/10 text-paymint-green font-bold'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                              }`
                            }
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50" />
                            <span>{subItem.label}</span>
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
                          ? 'bg-paymint-green text-black font-bold shadow-lg shadow-paymint-green/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon size={20} />
                      <span className="text-sm font-bold">{item.label}</span>
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
                  <p className="text-xs text-gray-500">Manager</p>
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
      <BottomNavigation onMenuClick={() => setMobileMenuOpen(true)} />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title={AppStrings.AUTH.LOGOUT.TITLE}
        message={AppStrings.AUTH.LOGOUT.MESSAGE}
        confirmText={AppStrings.NAVIGATION.LOGOUT}
        cancelText={AppStrings.COMMON.CANCEL}
        type="danger"
      />
    </div>
  );
}

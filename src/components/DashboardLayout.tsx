import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { DeletionRestorationBanner } from './DeletionRestorationBanner';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileBarChart,
  Percent,
  CreditCard,
  Settings,
  Shield,
  History,
  Store,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  Menu,
  X,
  Smartphone,
  Apple,
  Play,
  Clock
} from 'lucide-react';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.png';
import PaymintLogoWhite from '../assets/white-green-full-logo.png';
import PaymintLeafIcon from '../assets/small-logo.png';
import { ConfirmModal } from './ConfirmModal';

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

const menuStructure: MenuItemOrGroup[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  {
    label: 'Reports',
    icon: FileBarChart,
    items: [
      { path: '/dashboard/reports/sales', label: 'Sales Summary', icon: FileBarChart },
      { path: '/dashboard/reports/items', label: 'Item Sales', icon: Package },
      { path: '/dashboard/reports/categories', label: 'Category Sales', icon: LayoutDashboard },
      { path: '/dashboard/reports/employees', label: 'Staff Sales', icon: Users },
      { path: '/dashboard/reports/payments', label: 'Payment Sales', icon: CreditCard },
      { path: '/dashboard/reports/receipts', label: 'Receipts', icon: History },
      { path: '/dashboard/reports/modifiers', label: 'Add-on Sales', icon: Package },
      { path: '/dashboard/reports/discounts', label: 'Discounts', icon: Percent },
      { path: '/dashboard/reports/taxes', label: 'Taxes', icon: Percent },
      { path: '/dashboard/reports/shifts', label: 'Shifts', icon: Clock },
    ],
  },
  { path: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  {
    label: 'Menu',
    icon: Package,
    items: [
      { path: '/dashboard/categories', label: 'Categories', icon: LayoutDashboard },
      { path: '/dashboard/products', label: 'Products', icon: Package },
      { path: '/dashboard/addons', label: 'Add-Ons', icon: Package },
      { path: '/dashboard/materials', label: 'Ingredients', icon: Package },
      { path: '/dashboard/recipes', label: 'Recipes', icon: FileBarChart },
    ],
  },
  {
    label: 'Sales',
    icon: Percent,
    items: [
      { path: '/dashboard/discounts', label: 'Discounts', icon: Percent },
      { path: '/dashboard/payment-methods', label: 'Payment Methods', icon: CreditCard },
    ],
  },
  {
    label: 'People',
    icon: Users,
    items: [
      { path: '/dashboard/staff', label: 'Team', icon: Users },
      { path: '/dashboard/roles', label: 'Roles', icon: Shield },
      { path: '/dashboard/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    items: [
      { path: '/dashboard/settings', label: 'Settings', icon: Settings },
      { path: '/dashboard/activity-logs', label: 'System Logs', icon: History },
    ],
  },
];

// Define permission requirements for each path
const REQUIRED_PERMISSIONS: Record<string, string[]> = {
  // Reports
  '/dashboard/reports/sales': ['view_reports', 'reports'],
  '/dashboard/reports/items': ['view_reports', 'reports'],
  '/dashboard/reports/categories': ['view_reports', 'reports'],
  '/dashboard/reports/employees': ['view_reports', 'reports'],
  '/dashboard/reports/payments': ['view_reports', 'reports'],
  '/dashboard/reports/modifiers': ['view_reports', 'reports'],
  '/dashboard/reports/discounts': ['view_reports', 'reports'],
  '/dashboard/reports/taxes': ['view_reports', 'reports'],
  '/dashboard/reports/shifts': ['view_reports', 'reports'],

  // Orders
  '/dashboard/orders': ['view_orders'], // Strictly requires view_orders

  // Inventory
  '/dashboard/categories': ['manage_inventory', 'items'],
  '/dashboard/products': ['manage_inventory', 'items'],
  '/dashboard/addons': ['manage_inventory', 'items'],
  '/dashboard/materials': ['manage_inventory', 'items'],
  '/dashboard/recipes': ['manage_inventory', 'items'],

  // Sales & Growth
  '/dashboard/discounts': ['manage_discounts', 'manage_settings', 'settings'],
  '/dashboard/payment-methods': ['manage_payment_methods', 'manage_settings', 'settings'],

  // Community
  '/dashboard/staff': ['manage_employees', 'employees'],
  '/dashboard/roles': ['manage_employees', 'employees'],
  '/dashboard/customers': ['manage_customers', 'manage_employees', 'employees'],

  // Settings
  '/dashboard/settings': ['manage_settings', 'settings'],
  '/dashboard/activity-logs': ['view_activity_logs', 'view_reports', 'reports'], // Specific or fallback to reports
};

const SIDEBAR_STATE_KEY = 'dashboard_sidebar_expanded';

export function DashboardLayout() {
  const { account, currentEstablishment, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    return saved !== null ? saved === 'true' : false;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Filter menu based on permissions
  const filteredMenu = useMemo(() => {
    if (!account) return [];
    // If user is owner or not marked as secondary admin, show everything
    if (!account.isSecondaryAdmin) return menuStructure;

    const userPerms = new Set(account.permissions || []);

    const hasAccess = (path: string) => {
      // Root dashboard always accessible if logged in
      if (path === '/dashboard') return true;

      const required = REQUIRED_PERMISSIONS[path];
      // If no specific permission required, default to accessible (or restricted, depending on policy)
      // For safety, if not listed, assume it's public/common unless we want strict whitelist
      if (!required) return true;

      // Check if user has ANY of the required permissions (OR logic)
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
  const prevSidebarOpen = useRef(sidebarOpen);

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

  const isGroupActive = (items: MenuItem[]) => {
    return items.some((item) => location.pathname === item.path);
  };

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
          relative z-50 flex flex-col h-screen p-4 bg-white dark:bg-[#1E293B] border-r border-gray-200 dark:border-white/5 shadow-lg
          ${mobileMenuOpen ? 'fixed left-0 top-0 w-[280px]' : 'hidden lg:flex'}
        `}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-2 mb-2 relative shrink-0">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                <img src={PaymintLogoGreen} className="h-10 w-auto dark:hidden" alt="PayMint" />
                <img src={PaymintLogoWhite} className="h-10 w-auto hidden dark:block" alt="PayMint" />
              </motion.div>
            ) : (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="mx-auto"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 hover:border-paymint-green/40 transition-all hover:scale-105 group relative"
                  onClick={() => setSidebarOpen(true)}
                >
                  <img src={PaymintLeafIcon} className="w-7 h-7 object-contain scale-110" alt="P" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              <PanelLeftClose size={18} />
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
              <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 dark:bg-paymint-green/10 rounded-full blur-3xl pointer-events-none group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2.5">
                  <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center flex-shrink-0">
                    <Store size={18} className="text-paymint-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold text-paymint-green tracking-[0.15em] mb-0.5">Active Location</p>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-[1.2] font-sans truncate">
                      {currentEstablishment?.name || 'Loading...'}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] dark:shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">Online</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Switch <ChevronRight size={10} className="mt-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-2 py-4 flex justify-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center hover:bg-paymint-green/10 hover:text-paymint-green transition-all"
              title={currentEstablishment?.name}
            >
              <Store size={20} />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav
          ref={sidebarNavRef}
          className={`flex-1 px-3 space-y-1.5 scrollbar-none pb-4 ${sidebarOpen ? 'overflow-y-auto' : 'overflow-visible'}`}
        >
          {sidebarOpen && (
            <p className="px-3 py-2 text-[10px] font-bold text-gray-400 tracking-widest">Main Menu</p>
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
                    className={`
                      w-full flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group relative
                      ${isActive
                        ? (!sidebarOpen ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20' : 'bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white')
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                      ${!sidebarOpen ? 'justify-center' : ''}
                    `}
                  >
                    <Icon size={20} className={isActive && !sidebarOpen ? 'text-black' : (isActive ? 'text-paymint-green' : '')} />

                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-sm font-bold">{item.label}</span>
                        <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                      </>
                    )}

                    {!sidebarOpen && (
                      <div className="absolute left-[calc(100%+8px)] top-0 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] pointer-events-none group-hover:pointer-events-auto translate-x-1 group-hover:translate-x-0">
                        <div className="bg-white dark:bg-[#0D0D0D] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[200px] py-2">
                          <div className="px-4 py-2 border-b border-gray-100 dark:border-white/5 mb-1 bg-gray-50/50 dark:bg-white/[0.02]">
                            <p className="text-[9px] font-black text-paymint-green tracking-[0.2em]">{item.label}</p>
                          </div>
                          <div className="px-2 space-y-1">
                            {item.items.map((subItem) => (
                              <NavLink
                                key={subItem.path}
                                to={subItem.path}
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
                        <div className="absolute -left-4 top-0 bottom-0 w-4 bg-transparent" />
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
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? 'bg-paymint-green text-black font-bold shadow-lg shadow-paymint-green/20 active-menu-item'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'}
                    ${!sidebarOpen ? 'justify-center' : ''}`
                  }
                >
                  <Icon size={20} />

                  {sidebarOpen && (
                    <span className="text-sm font-bold">{item.label}</span>
                  )}

                  {!sidebarOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-2 bg-gray-900 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-xl">
                      <p className="text-xs font-bold">{item.label}</p>
                    </div>
                  )}
                </NavLink>
              );
            }
          })}
        </nav>

        {/* Pos App Download */}
        {/* Pos App Download - Compact */}
        <div className="px-3 mt-auto mb-2">
          {sidebarOpen ? (
            <div className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl p-2.5 flex items-center justify-between group">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
                  <Smartphone size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-900 dark:text-white leading-none mb-0.5">POS App</span>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 leading-none">Download</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 dark:bg-white/10 text-white hover:bg-gray-800 dark:hover:bg-white/20 transition-all border border-gray-800 dark:border-white/5" title="Get it on Google Play">
                  <Play size={10} fill="currentColor" />
                </button>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-900 dark:bg-white/10 text-white hover:bg-gray-800 dark:hover:bg-white/20 transition-all border border-gray-800 dark:border-white/5" title="Download on the App Store">
                  <Apple size={12} fill="currentColor" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group flex justify-center">
              <button
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 border border-orange-200 dark:border-orange-500/20 shadow-sm hover:scale-105 transition-all"
              >
                <Smartphone size={18} />
              </button>
              {/* Compact Popover */}
              <div className="absolute left-full bottom-0 ml-3 bg-gray-900/95 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto z-[70] translate-x-1 group-hover:translate-x-0 w-max">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-xs whitespace-nowrap">POS App</span>
                  <div className="h-4 w-px bg-white/20" />
                  <div className="flex gap-2">
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-white text-black hover:opacity-90">
                      <Play size={10} fill="currentColor" />
                    </button>
                    <button className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20">
                      <Apple size={12} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer User Profile */}
        <div className="p-3 border-t border-gray-100 dark:border-white/5">
          <div className={`flex items-center gap-3 ${!sidebarOpen ? 'flex-col' : ''}`}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-paymint-green to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-paymint-green/20 outline outline-2 outline-white dark:outline-black">
              <span className="text-black font-bold text-xs">
                {account?.firstName?.charAt(0).toUpperCase()}
              </span>
            </div>

            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {account?.firstName} {account?.lastName}
                </p>
                <p className="text-[10px] text-gray-500 truncate">Manager</p>
              </div>
            )}

            {/* Actions: Theme & Logout */}
            <div className={`flex items-center gap-1 ${!sidebarOpen ? 'flex-col gap-2 mt-1' : ''}`}>
              {sidebarOpen ? (
                <div className="flex items-center gap-1">
                  <ThemeToggle dropdownDirection="up" />
                  <button
                    onClick={handleLogout}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
                    title="Sign Out"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative group">
                    <ThemeToggle dropdownDirection="up" />
                  </div>
                  <div className="relative group">
                    <button
                      onClick={handleLogout}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all"
                    >
                      <LogOut size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
          <div className="h-full overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
            <div className="p-4 md:p-6 lg:p-8 max-w-[1920px] mx-auto">
              <Outlet />
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
                      <p className="px-3 py-2 text-xs font-bold text-gray-400 tracking-widest">{item.label}</p>
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

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}

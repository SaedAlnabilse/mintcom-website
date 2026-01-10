import { useState, useRef } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileBarChart,
  Percent,
  CreditCard,
  Settings,
  History,
  Store,
  LogOut,
  ChevronRight,
  Zap,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';

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
  { path: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  {
    label: 'Inventory',
    icon: Package,
    items: [
      { path: '/dashboard/products', label: 'Products', icon: Package },
      { path: '/dashboard/categories', label: 'Categories', icon: LayoutDashboard },
      { path: '/dashboard/addons', label: 'Add-ons', icon: Package },
      { path: '/dashboard/materials', label: 'Materials', icon: Package },
      { path: '/dashboard/recipes', label: 'Recipes', icon: FileBarChart },
    ],
  },
  { path: '/dashboard/reports', label: 'Reports', icon: FileBarChart },
  {
    label: 'Sales & Growth',
    icon: Percent,
    items: [
      { path: '/dashboard/discounts', label: 'Discounts', icon: Percent },
      { path: '/dashboard/payment-methods', label: 'Payment Methods', icon: CreditCard },
    ],
  },
  {
    label: 'Community',
    icon: Users,
    items: [
      { path: '/dashboard/staff', label: 'Team', icon: Users },
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

export function DashboardLayout() {
  const { account, currentEstablishment, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Inventory', 'Sales & Growth']));
  const [activePopupGroup, setActivePopupGroup] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number }>({ top: 0 });
  const navRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleGroup = (label: string, e: React.MouseEvent) => {
    if (!sidebarOpen) {
      // Get the position of the clicked button
      const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPopupPosition({ top: buttonRect.top });
      setActivePopupGroup(activePopupGroup === label ? null : label);
      return;
    }

    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
        setTimeout(() => {
          const target = e.currentTarget as HTMLElement;
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return newSet;
    });
  };

  const isGroupActive = (items: MenuItem[]) => {
    return items.some((item) => location.pathname === item.path);
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-[#050505] text-gray-900 dark:text-gray-100 font-sans flex overflow-hidden selection:bg-paymint-green selection:text-black transition-colors duration-500">
      {/* Sidebar Container - HIGHER Z-INDEX */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 300 : 100,
          transition: { duration: 0.4, type: "spring", damping: 25, stiffness: 200 }
        }}
        className="relative z-[60] flex flex-col h-screen p-4 bg-cream-50 dark:bg-[#0A0A0A] border-r border-cream-300 dark:border-white/[0.05] transition-colors duration-500"
      >
        {/* Sidebar Glow Decor */}
        <div className="absolute top-0 right-0 w-px h-full bg-gradient-to-b from-transparent via-paymint-green/20 to-transparent opacity-50" />

        {/* Brand Header & Toggle */}
        <div className="h-20 flex items-center justify-between px-2 mb-6 relative shrink-0">
          <AnimatePresence mode="wait">
            {sidebarOpen ? (
              <motion.div
                key="logo-full"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigate('/dashboard')}
              >
                <div className="w-10 h-10 bg-paymint-green rounded-[1rem] flex items-center justify-center shadow-lg shadow-paymint-green/20 transform hover:rotate-6 transition-transform">
                  <Zap size={20} className="text-black" fill="currentColor" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">PayMint</span>
                  <span className="text-[10px] font-black text-paymint-green uppercase tracking-[0.2em] mt-1">Enterprise</span>
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
                <div className="w-12 h-12 bg-paymint-green rounded-2xl flex items-center justify-center shadow-lg shadow-paymint-green/20 cursor-pointer" onClick={() => setSidebarOpen(true)}>
                  <Zap size={24} className="text-black" fill="currentColor" />
                </div>
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

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-12 h-12 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-cream-200 dark:bg-white/[0.03] text-gray-600 dark:text-gray-400 hover:text-paymint-green transition-all border border-cream-400 dark:border-white/[0.05] hover:border-paymint-green/30"
          >
            <PanelLeft size={20} />
          </button>
        )}

        {/* Current Location Display - Clickable to switch */}
        <div className={`px-2 mb-8 ${!sidebarOpen ? 'flex justify-center' : ''}`}>
          <button
            onClick={() => navigate('/select-establishment')}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-cream-100 dark:bg-[#111111] border border-cream-300 dark:border-white/[0.05] hover:border-paymint-green/50 hover:bg-gradient-to-r hover:from-paymint-green/5 hover:to-transparent transition-all duration-300 group cursor-pointer ${!sidebarOpen ? 'w-14 h-14 justify-center' : ''}`}
          >
            <div className="w-10 h-10 rounded-xl bg-cream-50 dark:bg-black flex items-center justify-center border border-cream-300 dark:border-white/[0.1] shadow-sm shrink-0 group-hover:scale-110 group-hover:border-paymint-green/30 transition-all">
              <Store size={18} className="text-paymint-green" />
            </div>
            {sidebarOpen && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-0.5 group-hover:text-paymint-green transition-colors">Location</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-tight" title={currentEstablishment?.name}>{currentEstablishment?.name}</p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-1 bg-paymint-green/10 px-2 py-1 rounded-lg">
                  <ChevronRight size={14} className="text-paymint-green" />
                  <span className="text-[10px] font-black text-paymint-green uppercase tracking-wider">Switch</span>
                </div>
              </>
            )}
            {!sidebarOpen && (
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[70] whitespace-nowrap">
                {currentEstablishment?.name || 'Switch Location'}
              </div>
            )}
          </button>
        </div>

        {/* Navigation Section */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-none scroll-smooth"
          style={{ position: 'relative', zIndex: 1 }}
        >
          {menuStructure.map((item, index) => {
            if (isMenuGroup(item)) {
              const isExpanded = expandedGroups.has(item.label);
              const isActive = isGroupActive(item.items);
              const Icon = item.icon;

              return (
                <div
                  key={index}
                  className="mb-2 relative"
                >
                  <button
                    onClick={(e) => {
                      if (!sidebarOpen) {
                        // When collapsed, capture position and toggle the popup
                        const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        setPopupPosition({ top: buttonRect.top });
                        setActivePopupGroup(activePopupGroup === item.label ? null : item.label);
                      } else {
                        toggleGroup(item.label, e);
                      }
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${isActive
                      ? 'bg-paymint-green/5 text-gray-900 dark:text-white'
                      : 'text-gray-500 hover:text-paymint-green'
                      } ${!sidebarOpen ? 'justify-center' : ''}`}
                  >
                    <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-paymint-green text-black' : 'bg-cream-200 dark:bg-[#111111] text-gray-600 dark:text-gray-400 border border-cream-400 dark:border-transparent group-hover:scale-110 group-hover:border-paymint-green/30'
                      }`}>
                      <Icon size={18} />
                    </div>

                    {sidebarOpen && (
                      <>
                        <span className="flex-1 text-left text-xs font-black uppercase tracking-[0.1em]">{item.label}</span>
                        <ChevronRight size={14} className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </>
                    )}

                    {!sidebarOpen && (
                      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[70] whitespace-nowrap">
                        {item.label}
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
                        <div className="ml-6 pl-4 border-l-2 border-cream-300 dark:border-white/[0.05] space-y-1 my-2">
                          {item.items.map((subItem) => (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path}
                              end={subItem.path === '/dashboard'}
                              className={({ isActive }) =>
                                `flex items-center gap-3 p-2.5 rounded-xl text-sm font-bold transition-all relative ${isActive
                                  ? 'text-paymint-green'
                                  : 'text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                                }`
                              }
                            >
                              {({ isActive }) => (
                                <>
                                  {isActive && (
                                    <motion.div
                                      layoutId="activeSub"
                                      className="absolute left-[-18px] w-1 h-4 bg-paymint-green rounded-full shadow-[0_0_10px_#7CC39F]"
                                    />
                                  )}
                                  <span>{subItem.label}</span>
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
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `relative w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${isActive
                      ? 'bg-paymint-green text-black font-black'
                      : 'text-gray-500 hover:text-paymint-green'
                    } ${!sidebarOpen ? 'justify-center' : ''}`
                  }
                >
                  <div className={`p-2 rounded-xl transition-all ${location.pathname === item.path ? 'bg-black/10' : 'bg-cream-200 dark:bg-[#111111] text-gray-600 dark:text-gray-400 border border-cream-400 dark:border-transparent group-hover:scale-110 group-hover:border-paymint-green/30'
                    }`}>
                    <Icon size={18} />
                  </div>

                  {sidebarOpen && (
                    <span className="flex-1 text-left text-xs font-black uppercase tracking-[0.1em]">{item.label}</span>
                  )}

                  {!sidebarOpen && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[70] whitespace-nowrap">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              );
            }
          })}
        </nav>

        {/* Collapsed Sidebar Popups - Rendered outside nav to avoid overflow clipping */}
        <AnimatePresence>
          {!sidebarOpen && activePopupGroup && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0"
                style={{ zIndex: 9998 }}
                onClick={() => setActivePopupGroup(null)}
              />
              {menuStructure.map((item) => {
                if (isMenuGroup(item) && activePopupGroup === item.label) {
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      style={{
                        position: 'fixed',
                        left: 105,
                        top: popupPosition.top,
                        zIndex: 9999
                      }}
                      className="w-56 bg-cream-50 dark:bg-[#111111] border border-cream-300 dark:border-white/[0.1] rounded-[1.5rem] shadow-2xl overflow-hidden py-3"
                    >
                      <div className="px-4 pb-2 mb-2 border-b border-cream-300 dark:border-white/[0.05]">
                        <p className="text-[10px] font-black text-paymint-green uppercase tracking-[0.2em]">{item.label}</p>
                      </div>
                      <div className="px-2 space-y-1">
                        {item.items.map((subItem) => (
                          <NavLink
                            key={subItem.path}
                            to={subItem.path}
                            onClick={() => setActivePopupGroup(null)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                                ? 'bg-paymint-green text-black'
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white'
                              }`
                            }
                          >
                            <span>{subItem.label}</span>
                          </NavLink>
                        ))}
                      </div>
                    </motion.div>
                  );
                }
                return null;
              })}
            </>
          )}
        </AnimatePresence>

        {/* Action Center Footer */}
        <div className="p-2 mt-auto" style={{ position: 'relative', zIndex: 1 }}>
          <div className="bg-cream-100 dark:bg-[#111111] border border-cream-300 dark:border-white/[0.05] rounded-[2rem] p-3 space-y-4 shadow-inner">
            <div className={`flex items-center gap-3 ${!sidebarOpen ? 'justify-center flex-col relative group' : ''}`}>
              <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center border border-white/[0.1] shadow-xl shrink-0 group hover:scale-105 transition-transform cursor-pointer overflow-hidden relative">
                <span className="text-white font-black text-lg">{account?.firstName?.charAt(0).toUpperCase()}</span>
                <div className="absolute inset-0 bg-paymint-green opacity-0 group-hover:opacity-20 transition-opacity" />
              </div>

              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 dark:text-white truncate uppercase tracking-tight">
                    {account?.firstName} {account?.lastName}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-paymint-green animate-pulse" />
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin Access</span>
                  </div>
                </div>
              )}

              {!sidebarOpen && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[70] whitespace-nowrap">
                  {account?.firstName} {account?.lastName}
                </div>
              )}
            </div>

            {sidebarOpen && (
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1">
                  <ThemeToggle dropdownDirection="up" />
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl bg-paymint-red/10 text-paymint-red hover:bg-paymint-red hover:text-white transition-all shadow-sm"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}

            {!sidebarOpen && (
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <ThemeToggle dropdownDirection="up" />
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[70] whitespace-nowrap">
                    Theme
                  </div>
                </div>
                <div className="relative group">
                  <button onClick={handleLogout} className="p-3 rounded-2xl bg-paymint-red/10 text-paymint-red hover:bg-paymint-red hover:text-white transition-all">
                    <LogOut size={20} />
                  </button>
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[70] whitespace-nowrap">
                    Logout
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content Viewport */}
      <main className="flex-1 relative overflow-hidden bg-cream-100 dark:bg-[#050505] transition-colors duration-500">
        <div className="h-full overflow-y-auto custom-scrollbar relative z-10 p-4 lg:p-8">
          <Outlet />
        </div>
      </main>

    </div>
  );
}
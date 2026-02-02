import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

interface BottomNavigationProps {
  onMenuClick: () => void;
  items?: BottomNavItem[];
}

const defaultItems: BottomNavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/dashboard/orders', label: 'Orders', icon: ShoppingCart },
  { path: '/dashboard/products', label: 'Products', icon: Package },
];

export function BottomNavigation({ onMenuClick, items = defaultItems }: BottomNavigationProps) {
  const location = useLocation();

  // Check if current path matches
  const isActive = (item: BottomNavItem) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-paymint-surface border-t border-gray-200 dark:border-white/10 pb-safe">
      <nav className="flex items-center justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className="relative flex flex-col items-center justify-center flex-1 h-full touch-target"
            >
              <div className="relative">
                {active && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 bg-paymint-green/10 rounded-xl"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
                <Icon
                  size={22}
                  className={`relative z-10 transition-colors ${
                    active ? 'text-paymint-green' : 'text-gray-400'
                  }`}
                />
              </div>
              <span
                className={`mt-1 text-xs font-bold transition-colors ${
                  active ? 'text-paymint-green' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}

        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center flex-1 h-full touch-target"
        >
          <Menu size={22} className="text-gray-400" />
          <span className="mt-1 text-xs font-bold text-gray-400">More</span>
        </button>
      </nav>
    </div>
  );
}

import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Menu, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

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

export function BottomNavigation({ onMenuClick, items }: BottomNavigationProps) {
  const { t } = useTranslation();

  const defaultItems: BottomNavItem[] = [
    { path: '.', label: t('dashboard.menu.dashboard'), icon: LayoutDashboard, exact: true },
    { path: 'orders', label: t('dashboard.menu.orders'), icon: ShoppingCart },
    { path: 'products', label: t('dashboard.menu.products'), icon: Package },
  ];

  const displayItems = items || defaultItems;

  return (
    <div
      dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-paymint-surface border-t border-gray-200 dark:border-white/10 pb-safe"
    >
      <nav className="flex items-center justify-around h-16">
        {displayItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className="relative flex flex-col items-center justify-center flex-1 h-full touch-target"
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    {isActive && (
                      <motion.div
                        layoutId="bottomNavIndicator"
                        className="absolute -inset-2 bg-paymint-green/10 rounded-xl"
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                      />
                    )}
                    <Icon
                      size={22}
                      className={`relative z-10 transition-colors ${isActive ? 'text-paymint-green' : 'text-gray-400'
                        }`}
                    />
                  </div>
                  <span
                    className={`mt-1 text-xs font-black tracking-widest transition-colors ${isActive ? 'text-paymint-green' : 'text-gray-400'
                      }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Mobile App Link */}
        <a
          href="#"
          aria-label={t('dashboard.menu.getMobileApp')}
          className="flex flex-col items-center justify-center flex-1 h-full touch-target text-gray-400 hover:text-paymint-green transition-colors"
        >
          <Smartphone size={22} />
          <span className="mt-1 text-xs font-black tracking-widest text-gray-400">{t('common.app')}</span>
        </a>


        {/* Menu button */}
        <button
          onClick={onMenuClick}
          aria-label={t('common.more')}
          className="flex flex-col items-center justify-center flex-1 h-full touch-target"
        >
          <Menu size={22} className="text-gray-400" />
          <span className="mt-1 text-xs font-black tracking-widest text-gray-400">{t('common.more')}</span>
        </button>
      </nav>
    </div>
  );
}

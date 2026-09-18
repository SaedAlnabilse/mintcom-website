import React, { useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, LogOut, type LucideIcon } from 'lucide-react';
import { SidebarPreferencesHelpMenu } from './SidebarPreferencesHelpMenu';
import { ModalCloseButton } from '../ui';
import { useScrollLock } from '../../hooks/useScrollLock';
import MintcomLogoGreen from '../../assets/green-full-logo.svg';
import MintcomLogoWhite from '../../assets/white-green-full-logo.svg';
import type { Account } from '../../types';
import { activeRowClass, inactiveMobileRowClass, avatarClass, userCardClass, userNameClass, userEmailClass } from '../ui/sharedStyles';

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

export interface MobileNavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  account: Account | null;
  scope: 'owner' | 'brand';
  onLogout: () => void;
}

export const MobileNavigationDrawer: React.FC<MobileNavigationDrawerProps> = ({
  isOpen,
  onClose,
  menuItems,
  account,
  scope,
  onLogout,
}) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const isRtl = t('common.locale') === 'ar';
  const slideFrom = isRtl ? '100%' : '-100%';

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] lg:hidden"
          />
          <motion.aside
            initial={{ x: slideFrom }}
            animate={{ x: 0 }}
            exit={{ x: slideFrom }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            role="dialog"
            aria-modal="true"
            aria-label={t('common.aria.mobileNav', { defaultValue: 'Menu' })}
            className="fixed inset-y-0 start-0 rtl:start-auto rtl:end-0 w-[85vw] max-w-[300px] min-w-[260px] bg-white dark:bg-[#1E293B] border-e rtl:border-e-0 rtl:border-s border-gray-200 dark:border-white/5 z-[100] flex flex-col lg:hidden pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
          {/* Mobile Header */}
          <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center min-w-0">
              <img
                src={MintcomLogoGreen}
                alt={t('brand.name')}
                width={120}
                height={30}
                className="h-8 w-auto max-w-[140px] object-contain dark:hidden"
              />
              <img
                src={MintcomLogoWhite}
                alt={t('brand.name')}
                width={120}
                height={30}
                className="h-8 w-auto max-w-[140px] object-contain hidden dark:block"
              />
            </div>
            <ModalCloseButton
              onClose={onClose}
              label={t('common.close', { defaultValue: 'Close menu' })}
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain custom-scrollbar">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/owner' && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200
                    ${isActive ? activeRowClass : inactiveMobileRowClass}
                  `}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-sm font-semibold tracking-normal">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-white/5 shrink-0">
            <div className="mb-3">
              <SidebarPreferencesHelpMenu onOpenHelpCenter={() => navigate('/support')} />
            </div>

            <button
              onClick={onLogout}
              aria-label={t('dashboard.menu.logout', { defaultValue: 'Log out' })}
              className="w-full flex items-center gap-3 px-3 min-h-[44px] rounded-lg text-sm font-semibold text-stone-600 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
              <span>{t('dashboard.menu.logout', { defaultValue: 'Log out' })}</span>
            </button>
          </div>
        </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileNavigationDrawer;

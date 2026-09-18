import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LogOut, Smartphone } from 'lucide-react';
import { SidebarPreferencesHelpMenu } from './SidebarPreferencesHelpMenu';
import { AlertsBell, type AlertsBellLocation } from '../notifications/AlertsBell';

export interface SidebarUserProfileFooterProps {
  sidebarOpen: boolean;
  scope: 'owner' | 'brand';
  locations: readonly AlertsBellLocation[];
  establishmentIds?: string[];
  onOpenMobileAppModal: () => void;
  onLogout: () => void;
}

export const SidebarUserProfileFooter: React.FC<SidebarUserProfileFooterProps> = ({
  sidebarOpen,
  scope,
  locations,
  establishmentIds,
  onOpenMobileAppModal,
  onLogout,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="p-3 border-t border-stone-100 dark:border-zinc-800 relative shrink-0">
      {sidebarOpen ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 px-3 py-1">
            <span className="text-sm font-bold text-stone-500 dark:text-zinc-400">
              {t('notifications.menu.title')}
            </span>
            <AlertsBell scope={scope} locations={locations} establishmentIds={establishmentIds} />
          </div>

          {/* Menu Items */}
          <button
            onClick={onOpenMobileAppModal}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-100 transition-all text-left"
          >
            <Smartphone size={16} className="text-stone-400" />
            <span>{t('owner.menu.getMobileApp')}</span>
          </button>

          <SidebarPreferencesHelpMenu onOpenHelpCenter={() => navigate('/support')} />

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-stone-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all text-left"
          >
            <LogOut size={20} />
            <span>{t('dashboard.menu.logout')}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <AlertsBell scope={scope} locations={locations} establishmentIds={establishmentIds} />

          <button
            onClick={onOpenMobileAppModal}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-100 transition-all relative group"
          >
            <Smartphone size={24} />
            <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-stone-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
              {t('owner.menu.getMobileApp')}
            </div>
          </button>

          <SidebarPreferencesHelpMenu compact onOpenHelpCenter={() => navigate('/support')} />

          <button
            onClick={onLogout}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-stone-500 dark:text-zinc-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all relative group"
          >
            <LogOut size={24} />
            <div className="absolute left-full rtl:left-auto rtl:right-full top-1/2 -translate-y-1/2 ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5 bg-stone-900/90 backdrop-blur-md text-white text-xs font-sans font-medium tracking-normal rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-[80] whitespace-nowrap border border-white/10 shadow-xl translate-x-1 rtl:-translate-x-1 group-hover:translate-x-0">
              {t('dashboard.menu.logout')}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default SidebarUserProfileFooter;

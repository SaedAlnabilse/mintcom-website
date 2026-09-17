import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, LogOut, ChevronRight, Loader2, Crown, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Establishment } from '../types';
import {
  buildLocationDeletionRecoveryPath,
  getEstablishmentSlug,
  isManualEstablishmentDeletionPending,
} from '../utils/deletionRecovery';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { Badge, SearchInput } from '../components/ui';

// Mintcom Logo imports
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';

import { ConfirmModal } from '../components/ConfirmModal';

export function SelectEstablishmentPage() {
  const { t } = useTranslation();
  const { establishments, setCurrentEstablishment, logout, account } = useAuth();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedName, setSelectedName] = useState('');
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-redirect if non-owner has only one establishment
  useEffect(() => {
    // Only auto-redirect if we have exactly one establishment and it's a secondary admin
    if (account?.isSecondaryAdmin && establishments.length === 1) {
      const est = establishments[0];
      
      // We don't show the full switching overlay for auto-redirects 
      // to avoid race conditions with the Resolver component
      setCurrentEstablishment(est);
      const slug = getEstablishmentSlug(est);

      navigate(
        isManualEstablishmentDeletionPending(est)
          ? buildLocationDeletionRecoveryPath(slug)
          : `/dashboard/${encodeURIComponent(slug)}`,
        { replace: true },
      );
    }
  }, [account, establishments, navigate, setCurrentEstablishment]);

  const handleSelect = (est: Establishment) => {
    // Manual selection DOES show the overlay
    setSelectedName(est.name);
    setIsSwitching(true);

    // Snappy transition then navigate
    setTimeout(() => {
      setCurrentEstablishment(est);
      toast.success(t('establishments.activeToast', { name: est.name }));
      const slug = getEstablishmentSlug(est);
      navigate(
        isManualEstablishmentDeletionPending(est)
          ? buildLocationDeletionRecoveryPath(slug)
          : `/dashboard/${encodeURIComponent(slug)}`,
      );
    }, 250);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredEstablishments = establishments.filter((est) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      est.name.toLowerCase().includes(q) ||
      est.currency?.toLowerCase().includes(q) ||
      est.type?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="dashboard-font-unified min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col transition-colors duration-500 relative overflow-hidden" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Remove glass glows, use solid background colors */}

      {/* Header — logo alone on the brand side, user actions clustered right */}
      <div className="p-4 sm:p-8 flex justify-between items-center gap-3 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src={MintcomLogoGreen}
            alt="Mintcom"
            className="h-10 w-auto object-contain dark:hidden"
          />
          <img
            src={MintcomLogoWhite}
            alt="Mintcom"
            className="h-10 w-auto object-contain hidden dark:block"
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Owner Portal — owner-only. Employees / secondary admins are
              not the account owner, so they never see this shortcut. */}
          {!account?.isSecondaryAdmin && (
            <button
              onClick={() => navigate('/owner')}
              title={t('onboarding.step5.ownerPortal')}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 font-sans font-bold text-xs text-amber-700 dark:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/20 active:scale-95 transition-all duration-300"
            >
              <Crown size={16} />
              <span className="hidden sm:inline">{t('onboarding.step5.ownerPortal')}</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-[#D55263] text-white shadow-lg shadow-red-500/20 active:scale-95 transition-all duration-300 font-sans font-bold text-xs px-6 py-2.5 rounded-xl border border-transparent hover:bg-[#C44253] hover:scale-105"
          >
            <LogOut size={16} />
            {t('common.logout')}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-4xl w-full text-center mb-10 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-magilio text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              {t('onboarding.selectLocation', { defaultValue: 'Select Establishment' })}
            </h1>
            <p className="text-sm sm:text-base font-sans text-gray-500 dark:text-gray-400">
              {t('establishments.chooseLocationWorkflow', { defaultValue: 'Choose an establishment to continue your workflow' })}
            </p>
          </motion.div>

          {establishments.length > 1 && (
            <div className="mt-6 max-w-sm mx-auto">
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
                placeholder={t('establishments.searchPlaceholder', { defaultValue: 'Search establishments...' })}
              />
            </div>
          )}
        </div>

        {filteredEstablishments.length === 0 && searchQuery ? (
          <div className="w-full max-w-md mx-auto text-center py-12 px-6 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              {t('establishments.noLocations', { defaultValue: 'No Establishments Found' })}
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-mintcom-green hover:underline"
            >
              {t('common.clearSearch', { defaultValue: 'Clear search' })}
            </button>
          </div>
        ) : (
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-center">
              {filteredEstablishments.map((est, index) => (
                <motion.div
                  key={est.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.04 }}
                  onMouseEnter={() => setHoveredId(est.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleSelect(est)}
                  className="group relative bg-white dark:bg-[#1E293B] rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/10 p-6 sm:p-7 cursor-pointer hover:border-mintcom-green dark:hover:border-mintcom-green shadow-sm hover:shadow-md transition-all flex flex-col justify-between items-center text-center min-h-[260px] sm:min-h-[280px] h-full"
                >
                  <div className="w-full flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-gray-100 dark:border-white/5 transition-all group-hover:scale-105 group-hover:bg-mintcom-green/10">
                      <Store size={28} className="text-gray-400 group-hover:text-mintcom-green transition-colors" />
                    </div>

                    <h3 className="font-sans text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-3 px-2 leading-tight text-center tracking-normal line-clamp-2" dir="auto">
                      {est.name}
                    </h3>

                    <div className="flex items-center gap-1.5 mb-4 flex-wrap justify-center">
                      {est.currency && (
                        <Badge tone="gray">
                          {est.currency.toUpperCase()}
                        </Badge>
                      )}
                      {est.type && (
                        <Badge tone="gray">
                          {t(`establishments.types.${est.type.toLowerCase()}`, { defaultValue: est.type })}
                        </Badge>
                      )}
                      {isManualEstablishmentDeletionPending(est) ? (
                        <Badge tone="red">
                          <AlertTriangle size={11} />
                          {t('settings.danger.pendingDeletion', { defaultValue: 'PENDING DELETION' })}
                        </Badge>
                      ) : (
                        <Badge
                          tone={
                            est.subscriptionStatus.toLowerCase() === 'active'
                              ? 'green'
                              : est.subscriptionStatus.toLowerCase() === 'trial'
                              ? 'blue'
                              : 'gray'
                          }
                        >
                          {t(`common.status.${est.subscriptionStatus.toLowerCase()}`, { defaultValue: est.subscriptionStatus }).toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 text-xs sm:text-sm font-sans font-bold transition-all pt-2 ${hoveredId === est.id ? 'text-mintcom-green' : 'text-gray-400'}`}>
                    {isManualEstablishmentDeletionPending(est)
                      ? t('account.restoreAction', { defaultValue: 'Restore' })
                      : t('dashboard.menu.overview').charAt(0).toUpperCase() + t('dashboard.menu.overview').slice(1).toLowerCase()}
                    <ChevronRight size={14} className="rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </div>
                </motion.div>
              ))}

              {/* Add New - Solid Design - Only show for owners */}
              {!account?.isSecondaryAdmin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: filteredEstablishments.length * 0.04 }}
                  onClick={() => navigate('/onboarding')}
                  className="bg-gray-50/50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-6 sm:p-7 cursor-pointer hover:border-mintcom-green hover:bg-white dark:hover:bg-white/[0.04] transition-all flex flex-col items-center justify-center group min-h-[260px] sm:min-h-[280px] h-full text-center"
                >
                  <div className="w-14 h-14 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center mb-3 border border-gray-200/80 dark:border-white/10 group-hover:border-mintcom-green group-hover:bg-mintcom-green/10 transition-all">
                    <Plus size={24} className="text-gray-400 group-hover:text-mintcom-green transition-colors" />
                  </div>
                  <h3 className="font-sans text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-1">
                    {t('establishments.addLocation')}
                  </h3>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-8 text-center relative z-10">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-sans">
          Mintcom
        </p>
      </div>

      {/* Real-time Switching Overlay */}
      <AnimatePresence>
        {isSwitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white dark:bg-[#050505] flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-20 h-20 bg-mintcom-green/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                <Loader2 size={40} className="text-mintcom-green animate-spin" />
                <div className="absolute inset-0 bg-mintcom-green/20 rounded-[2.5rem] animate-ping" />
              </div>
              <h2 className="font-magilio text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white tracking-tight">{t('common.loading')}</h2>
              <p className="text-xs font-sans font-bold text-mintcom-green tracking-normal mt-2" dir="auto">{selectedName}</p>

              <div className="mt-12 w-48 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="h-full bg-mintcom-green shadow-[0_0_15px_#7dc6a2]"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        message={t('common.confirmLogout')}
        confirmText={t('common.logout')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  );
}

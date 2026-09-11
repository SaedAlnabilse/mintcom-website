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

    // Simulate a transition then navigate
    setTimeout(() => {
      setCurrentEstablishment(est);
      toast.success(t('establishments.activeToast', { name: est.name }));
      const slug = getEstablishmentSlug(est);
      navigate(
        isManualEstablishmentDeletionPending(est)
          ? buildLocationDeletionRecoveryPath(slug)
          : `/dashboard/${encodeURIComponent(slug)}`,
      );
    }, 800);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-font-unified min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col transition-colors duration-500 relative overflow-hidden" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Remove glass glows, use solid background colors */}

      {/* Header — logo alone on the brand side, user actions clustered right */}
      <div className="p-8 flex justify-between items-center relative z-10">
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
        <div className="max-w-4xl w-full text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-magilio text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              {t('onboarding.selectLocation', { defaultValue: 'Select Location' })}
            </h1>
            <p className="text-sm sm:text-base font-sans text-gray-500 dark:text-gray-400 mt-2">
              {t('establishments.chooseLocationWorkflow', { defaultValue: 'Choose a location to continue your workflow' })}
            </p>
          </motion.div>
        </div>

        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 justify-center">
            {establishments.map((est, index) => (
              <motion.div
                key={est.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onMouseEnter={() => setHoveredId(est.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(est)}
                className="group relative bg-white dark:bg-[#1E293B] rounded-[2rem] sm:rounded-[2.5rem] border-2 border-gray-100 dark:border-white/[0.05] p-7 sm:p-8 cursor-pointer hover:border-mintcom-green shadow-xl shadow-gray-200/50 dark:shadow-none transition-all flex flex-col justify-between items-center text-center min-h-[300px] sm:min-h-[320px] h-full"
              >
                <div className="w-full flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-white/[0.03] rounded-[1.5rem] flex items-center justify-center mb-5 border border-gray-100 dark:border-white/5 transition-transform duration-500 group-hover:scale-110 group-hover:bg-mintcom-green/10">
                    <Store size={32} className="text-gray-400 group-hover:text-mintcom-green transition-colors" />
                  </div>

                  <h3 className="font-barlow text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 px-2 leading-tight text-center tracking-normal line-clamp-2" dir="auto">
                    {est.name}
                  </h3>

                  <div className="flex items-center gap-2 mb-6 flex-wrap justify-center">
                    <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-sans font-bold text-gray-500">
                      {est.currency?.toUpperCase()}
                    </span>
                    {isManualEstablishmentDeletionPending(est) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-50 text-[10px] font-sans font-bold text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20">
                        <AlertTriangle size={11} />
                        {t('settings.danger.pendingDeletion', { defaultValue: 'PENDING DELETION' })}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-mintcom-green/10 text-[10px] font-sans font-bold text-mintcom-green border border-mintcom-green/20">
                        {t(`common.status.${est.subscriptionStatus.toLowerCase()}`, { defaultValue: est.subscriptionStatus }).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className={`flex items-center gap-2 text-[13.5px] font-sans font-bold transition-all pt-2 ${hoveredId === est.id ? 'text-mintcom-green' : 'text-gray-400'}`}>
                  {isManualEstablishmentDeletionPending(est)
                    ? t('account.restoreAction', { defaultValue: 'Restore' })
                    : t('dashboard.menu.overview').charAt(0).toUpperCase() + t('dashboard.menu.overview').slice(1).toLowerCase()}
                  <ChevronRight size={14} className={t('common.locale') === 'ar' ? 'rotate-180' : ''} />
                </div>
              </motion.div>
            ))}

            {/* Add New - Solid Design - Only show for owners */}
            {!account?.isSecondaryAdmin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: establishments.length * 0.05 }}
                onClick={() => navigate('/onboarding')}
                className="bg-gray-100/50 dark:bg-white/[0.02] border-2 border-dashed border-gray-300 dark:border-white/[0.1] rounded-[2rem] sm:rounded-[2.5rem] p-7 sm:p-8 cursor-pointer hover:border-mintcom-green hover:bg-white dark:hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center group min-h-[300px] sm:min-h-[320px] h-full text-center"
              >
                <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10 group-hover:bg-mintcom-green/10 group-hover:border-mintcom-green transition-all">
                  <Plus size={28} className="text-gray-400 group-hover:text-mintcom-green transition-colors" />
                </div>
                <h3 className="font-barlow text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {t('establishments.addLocation')}
                </h3>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-12 text-center relative z-10">
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
                  transition={{ duration: 0.8, ease: "easeInOut" }}
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

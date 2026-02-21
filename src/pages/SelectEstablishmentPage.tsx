import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, LogOut, ChevronRight, CheckCircle2, Loader2, Crown, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';



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
      const slug = est.establishmentLoginId && est.establishmentLoginId.trim().length > 0
        ? est.establishmentLoginId
        : est.id;
      
      navigate(`/dashboard/${slug}`, { replace: true });
    }
  }, [account, establishments, navigate, setCurrentEstablishment]);

  const handleSelect = (est: any) => {
    // Manual selection DOES show the overlay
    setSelectedName(est.name);
    setIsSwitching(true);

    // Simulate a transition then navigate
    setTimeout(() => {
      setCurrentEstablishment(est);
      toast.success(t('establishments.activeToast', { name: est.name }));
      const slug = est.establishmentLoginId && est.establishmentLoginId.trim().length > 0
        ? est.establishmentLoginId
        : est.id;
      navigate(`/dashboard/${slug}`);
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col transition-colors duration-500 relative overflow-hidden" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Remove glass glows, use solid background colors */}

      {/* Header */}
      <div className="p-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
          {/* Owner Portal Button */}
          <button
            onClick={() => navigate('/owner')}
            className="group flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 hover:border-amber-500/40 hover:from-amber-500/20 hover:to-yellow-500/20 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20 transition-transform">
              <Crown size={18} className="text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-black text-gray-400 tracking-widest">{t('onboarding.step5.ownerPortal')}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{account?.firstName} {account?.lastName}</p>
            </div>
            <ArrowLeft size={16} className={`text-amber-500 group-hover:${t('common.locale') === 'ar' ? 'translate-x-1' : '-translate-x-1'} transition-transform hidden sm:block`} />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={PaymintLogoGreen}
              alt="PayMint"
              className="h-10 w-auto object-contain dark:hidden"
            />
            <img
              src={PaymintLogoWhite}
              alt="PayMint"
              className="h-10 w-auto object-contain hidden dark:block"
            />
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-paymint-red transition-all font-black text-xs tracking-widest px-4 py-2 rounded-xl hover:bg-paymint-red/5"
        >
          <LogOut size={16} />
          {t('common.logout')}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-4xl w-full text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
              {t('onboarding.select')} <span className="text-paymint-green underline decoration-paymint-green/30">{t('onboarding.location')}</span>
            </h1>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('establishments.subtitle')}</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl w-full">
          {establishments.map((est, index) => (
            <motion.div
              key={est.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setHoveredId(est.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleSelect(est)}
              className="group relative bg-white dark:bg-[#1E293B] rounded-[2.5rem] border-2 border-gray-100 dark:border-white/[0.05] p-8 cursor-pointer hover:border-paymint-green shadow-xl shadow-gray-200/50 dark:shadow-none transition-all flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-gray-50 dark:bg-white/[0.03] rounded-[1.5rem] flex items-center justify-center mb-6 border border-gray-100 dark:border-white/5 transition-transform duration-500 group-hover:scale-110 group-hover:bg-paymint-green/10">
                <Store size={32} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
              </div>

              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 px-2 leading-tight text-center">{est.name}</h3>

              <div className="flex items-center gap-2.5 mb-8">
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-black tracking-widest text-gray-500">
                  {est.currency?.toUpperCase()}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-paymint-green/10 text-[10px] font-black tracking-widest text-paymint-green border border-paymint-green/20">
                  {t(`owner.billing.${est.subscriptionStatus.toLowerCase()}`, { defaultValue: est.subscriptionStatus })}
                </span>
              </div>

              <div className={`flex items-center gap-2 text-xs font-black tracking-widest transition-all ${hoveredId === est.id ? 'text-paymint-green' : 'text-gray-400'}`}>
                {t('dashboard.menu.overview').toUpperCase()}
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
              className="bg-gray-100/50 dark:bg-white/[0.02] border-2 border-dashed border-gray-300 dark:border-white/[0.1] rounded-[2.5rem] p-8 cursor-pointer hover:border-paymint-green hover:bg-white dark:hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center group min-h-[280px]"
            >
              <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/10 group-hover:bg-paymint-green/10 group-hover:border-paymint-green transition-all">
                <Plus size={28} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{t('establishments.addLocation')}</h3>
              <p className="text-xs font-black text-gray-500 tracking-widest">{t('onboarding.step1.businessTypes.other')}</p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-12 text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-white/5 text-gray-400 text-xs font-black tracking-widest shadow-sm">
          <CheckCircle2 size={14} className="text-paymint-green" />
          Paymint v2.0
        </div>
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
              <div className="w-20 h-20 bg-paymint-green/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
                <Loader2 size={40} className="text-paymint-green animate-spin" />
                <div className="absolute inset-0 bg-paymint-green/20 rounded-[2.5rem] animate-ping" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('common.loading')}</h2>
              <p className="text-xs font-black text-paymint-green tracking-widest mt-2">{selectedName}</p>

              <div className="mt-12 w-48 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '0%' }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="h-full bg-paymint-green shadow-[0_0_15px_#7CC39F]"
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
        title={t('common.confirmLogoutTitle')}
        message={t('common.confirmLogout')}
        confirmText={t('common.logout')}
        cancelText={t('common.cancel')}
        type="danger"
      />
    </div>
  );
}

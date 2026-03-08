import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Plus,
  MoreVertical,
  DollarSign,
  CheckCircle,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ConfirmModal';
import { SearchInput, Pagination } from '../../components/ui';
import { useTranslation } from 'react-i18next';

interface Establishment {
  id: string;
  name: string;
  type: string;
  currency: string;
  address?: string;
  subscriptionStatus: string;
  trialEndDate?: string;
  employeeCount?: number;
}

export function EstablishmentsPage() {
  const { t } = useTranslation();
  const { locationSlug } = useParams();
  const navigate = useNavigate();
  const { establishments, currentEstablishment, setCurrentEstablishment } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'success' | 'warning' | 'info';
    confirmText?: string;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-paymint-green bg-paymint-green/10 border-paymint-green/20';
      case 'trial':
      case 'trialing':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'past_due':
        return 'text-paymint-red bg-paymint-red/10 border-paymint-red/20';
      case 'canceled':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-100 dark:border-white/5';
    }
  };

  const handleSelectEstablishment = (est: Establishment) => {
    if (est.id === currentEstablishment?.id) return;

    setIsSwitching(true);
    setSelectedName(est.name);

    setTimeout(() => {
      setCurrentEstablishment(est);
      toast.success(t('establishments.activeToast', { name: est.name }));
      setIsSwitching(false);
    }, 800);
  };

  const filteredEstablishments = useMemo(() => {
    return (Array.isArray(establishments) ? establishments : []).filter(est =>
      est.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (est.type || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [establishments, searchQuery]);

  const totalPages = Math.ceil((Array.isArray(filteredEstablishments) ? filteredEstablishments : []).length / ITEMS_PER_PAGE);

  const paginatedEstablishments = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return (Array.isArray(filteredEstablishments) ? filteredEstablishments : []).slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEstablishments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-16" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] p-8 border border-gray-200 dark:border-white/5 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-sm">
              <Store size={28} className="text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-1">
                <div className="flex items-center gap-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
                  </div>
                  <span className="text-xs font-bold text-paymint-green tracking-widest">{t('dashboard.shiftStatus.live')}</span>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-outfit font-bold text-gray-900 dark:text-white tracking-tight">{t('establishments.title')}</h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2 flex-wrap">
                        <span>{t('establishments.subtitle')}</span>
                        {currentEstablishment?.name && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                                {currentEstablishment.name}
                            </span>
                        )}
                    </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
            >
              <Plus size={18} />
              <span>{t('establishments.addLocation')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 sm:max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={t('establishments.searchPlaceholder')}
          />
        </div>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {paginatedEstablishments.map((est) => (
          <motion.div
            layout
            key={est.id}
            className={`group relative bg-white dark:bg-[#1E293B] rounded-2xl p-8 border-2 transition-all duration-300 overflow-hidden shadow-sm ${currentEstablishment?.id === est.id
              ? 'border-paymint-green ring-4 ring-paymint-green/5'
              : 'border-gray-100 dark:border-white/5 hover:shadow-xl'
              }`}
          >
            {/* Background Effects */}
            <div className={`absolute top-0 ${t('common.locale') === 'ar' ? 'left-0' : 'right-0'} w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${currentEstablishment?.id === est.id ? 'bg-paymint-green/10 opacity-100' : 'bg-paymint-green/5'
              }`} />

            {/* Card Header */}
            <div className="relative z-10 flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 ${currentEstablishment?.id === est.id ? 'bg-paymint-green text-black border-paymint-green shadow-lg shadow-paymint-green/20' : 'bg-gray-50 dark:bg-white/[0.03] text-gray-400 border-gray-100 dark:border-white/10'
                  }`}>
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight group-hover:text-paymint-green transition-colors">{est.name}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 text-xs font-black tracking-[0.2em] rounded-md mt-2 border transition-colors ${getStatusColor(est.subscriptionStatus)}`}>
                    {t(`owner.billing.${est.subscriptionStatus.toLowerCase()}`, { defaultValue: est.subscriptionStatus })}
                  </span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === est.id ? null : est.id)}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all text-gray-400 border border-transparent hover:border-gray-200 dark:hover:border-white/10 shadow-sm"
                >
                  <MoreVertical size={18} />
                </button>
                <AnimatePresence>
                  {openMenuId === est.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={`absolute ${t('common.locale') === 'ar' ? 'left-0' : 'right-0'} mt-3 w-56 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.1] rounded-2xl z-50 overflow-hidden py-2 shadow-2xl`}
                    >
                      <button onClick={() => { handleSelectEstablishment(est); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-xs font-black text-gray-700 dark:text-gray-300 hover:bg-paymint-green hover:text-black transition-all flex items-center gap-3 tracking-widest">
                        <CheckCircle size={14} /> {t('establishments.switch')}
                      </button>
                      <button onClick={() => { navigate(`/dashboard/${locationSlug}/settings`); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-xs font-black text-gray-700 dark:text-gray-300 hover:bg-paymint-green/10 transition-all tracking-widest">{t('dashboard.menu.settings')}</button>
                      <button onClick={() => { navigate(`/dashboard/${locationSlug}/staff`); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-xs font-black text-gray-700 dark:text-gray-300 hover:bg-paymint-green/10 transition-all tracking-widest">{t('dashboard.menu.team')}</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Details List */}
            <div className="relative z-10 space-y-3 mb-8 px-1">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-xs font-black tracking-widest">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10">
                  <DollarSign size={14} className="text-paymint-green" />
                </div>
                <span>{t('establishments.details.currency')}: {est.currency?.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 text-xs font-black tracking-widest">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/5 flex items-center justify-center border border-gray-100 dark:border-white/10">
                  <ShieldCheck size={14} className="text-blue-500" />
                </div>
                <span className="truncate">{t(`establishments.types.${est.type.toLowerCase()}`, { defaultValue: est.type.replace('_', ' ') })}</span>
              </div>
            </div>

            {/* Action Button */}
            <div className="relative z-10">
              {currentEstablishment?.id === est.id ? (
                <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-paymint-green text-black shadow-lg shadow-paymint-green/20">
                  <CheckCircle size={18} strokeWidth={3} />
                  <span className="font-black text-xs tracking-[0.2em]">{t('establishments.currentLocation')}</span>
                </div>
              ) : (
                <button
                  onClick={() => handleSelectEstablishment(est)}
                  className="w-full py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-xl hover:scale-[1.02] transition-all active:scale-95 text-xs tracking-[0.2em] shadow-md"
                >
                  {t('establishments.switch')}
                </button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Add New Establishment Card */}
        <motion.button
          onClick={() => navigate('/onboarding')}
          className="bg-white dark:bg-[#1E293B] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center gap-8 hover:border-paymint-green dark:hover:border-paymint-green hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-all min-h-[250px] lg:min-h-[350px] group shadow-sm"
        >
          <div className="w-24 h-24 bg-gray-50 dark:bg-white/[0.03] rounded-full flex items-center justify-center border border-gray-200 dark:border-white/5 group-hover:scale-110 transition-transform duration-500 shadow-sm">
            <Plus size={40} className="text-gray-300 group-hover:text-paymint-green transition-colors" />
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('establishments.addLocation')}</h3>
            <p className="text-xs font-black text-gray-400 tracking-widest max-w-[200px]">{t('establishments.details.create')}</p>
          </div>
        </motion.button>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* Switcher Overlay - Truly Global (Portal equivalent) */}
      <AnimatePresence>
        {isSwitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white dark:bg-[#050505] flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 bg-paymint-green/10 rounded-2xl flex items-center justify-center mb-8 relative">
              <Loader2 size={40} className="text-paymint-green animate-spin" />
              <div className="absolute inset-0 bg-paymint-green/20 rounded-2xl animate-ping" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('establishments.opening')}</h2>
            <p className="text-paymint-green font-bold tracking-normal text-sm mt-4">{selectedName}</p>

            <div className="mt-12 w-48 h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '0%' }}
                transition={{ duration: 0.8 }}
                className="h-full bg-paymint-green"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        confirmText={confirmConfig.confirmText}
        showCancel={confirmConfig.showCancel}
      />
    </div>
  );
}



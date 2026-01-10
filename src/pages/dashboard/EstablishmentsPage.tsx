import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface Establishment {
  id: string;
  name: string;
  type: string;
  currency: string;
  address?: string;
  phone?: string;
  subscriptionStatus: string;
  trialEndDate?: string;
  employeeCount?: number;
}

export function EstablishmentsPage() {
  const navigate = useNavigate();
  const { establishments, currentEstablishment, setCurrentEstablishment } = useAuth();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-paymint-green bg-paymint-green/10 border-paymint-green/20';
      case 'trial':
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'past_due':
        return 'text-paymint-red bg-paymint-red/10 border-paymint-red/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-100 dark:border-white/5';
    }
  };

  const handleSelectEstablishment = (est: Establishment) => {
    if (est.id === currentEstablishment?.id) return;

    setIsSwitching(true);
    setSelectedName(est.name);

    setTimeout(() => {
      setCurrentEstablishment(est as any);
      toast.success(`Active: ${est.name}`);
      setIsSwitching(false);
    }, 800);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      {/* Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cream-50 via-cream-100 to-cream-50 dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-cream-300 dark:border-white/5 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
              <Store size={28} className="text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Establishments Registry</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Multi-location enterprise asset management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/onboarding')}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-paymint-green/30"
            >
              <Plus size={18} />
              <span>Add Establishment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Establishments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {establishments.map((est) => (
          <motion.div
            key={est.id}
            layout
            className={`bg-cream-50 dark:bg-[#0A0A0A] rounded-[2.5rem] p-10 border-2 transition-all group relative ${currentEstablishment?.id === est.id
              ? 'border-paymint-green shadow-xl shadow-paymint-green/5'
              : 'border-cream-200 dark:border-white/[0.05] hover:border-cream-300 dark:hover:border-white/10'
              }`}
          >
            {/* Card Header */}
            <div className="flex items-start justify-between mb-10">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center border transition-all duration-500 group-hover:scale-110 ${currentEstablishment?.id === est.id ? 'bg-paymint-green text-black border-paymint-green' : 'bg-cream-100 dark:bg-white/[0.03] text-gray-400 border-cream-200 dark:border-white/5'
                  }`}>
                  <Store size={28} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-tight">{est.name}</h3>
                  <span className={`inline-flex items-center px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg mt-2 border ${getStatusColor(est.subscriptionStatus)}`}>
                    {est.subscriptionStatus}
                  </span>
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpenMenuId(openMenuId === est.id ? null : est.id)}
                  className="p-2.5 hover:bg-cream-200 dark:hover:bg-white/5 rounded-xl transition-all text-gray-400"
                >
                  <MoreVertical size={20} />
                </button>
                <AnimatePresence>
                  {openMenuId === est.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-56 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.1] rounded-2xl shadow-2xl z-50 overflow-hidden py-2"
                    >
                      <button onClick={() => { handleSelectEstablishment(est); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-sm font-black text-gray-700 dark:text-gray-300 hover:bg-paymint-green hover:text-black transition-all flex items-center gap-3">
                        <CheckCircle size={16} /> Switch Identity
                      </button>
                      <button onClick={() => { navigate('/dashboard/settings'); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-cream-100 dark:hover:bg-white/5 transition-all">Settings</button>
                      <button onClick={() => { navigate('/dashboard/staff'); setOpenMenuId(null); }} className="w-full text-left px-5 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-cream-100 dark:hover:bg-white/5 transition-all">Team Access</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-4 mb-10">
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">
                <div className="w-10 h-10 rounded-xl bg-cream-100 dark:bg-white/[0.03] flex items-center justify-center border border-cream-200 dark:border-white/5">
                  <DollarSign size={16} className="text-paymint-green" />
                </div>
                <span>Currency: {est.currency}</span>
              </div>
              <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">
                <div className="w-10 h-10 rounded-xl bg-cream-100 dark:bg-white/[0.03] flex items-center justify-center border border-cream-200 dark:border-white/5">
                  <ShieldCheck size={16} className="text-blue-500" />
                </div>
                <span className="truncate">{est.type.replace('_', ' ')} Registry</span>
              </div>
            </div>

            {/* Action Button */}
            {currentEstablishment?.id === est.id ? (
              <div className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-paymint-green/10 text-paymint-green border border-paymint-green/20 shadow-inner">
                <CheckCircle size={18} />
                <span className="font-black text-xs uppercase tracking-widest">Selected Active Node</span>
              </div>
            ) : (
              <button
                onClick={() => handleSelectEstablishment(est)}
                className="w-full py-4 px-6 bg-gray-900 dark:bg-white text-white dark:text-black font-black rounded-2xl hover:scale-[1.02] transition-all shadow-xl shadow-black/5 active:scale-95 text-xs uppercase tracking-[0.2em]"
              >
                Initialize Switch
              </button>
            )}
          </motion.div>
        ))}

        {/* Add New Establishment Card */}
        <motion.button
          onClick={() => navigate('/onboarding')}
          className="bg-cream-50 dark:bg-[#0A0A0A] border-2 border-dashed border-cream-300 dark:border-white/10 rounded-[2.5rem] p-10 flex flex-col items-center justify-center gap-8 hover:border-paymint-green dark:hover:border-paymint-green hover:bg-cream-100 dark:hover:bg-white/[0.02] transition-all min-h-[400px] group shadow-sm hover:shadow-2xl"
        >
          <div className="w-24 h-24 bg-cream-100 dark:bg-white/[0.03] rounded-full flex items-center justify-center border border-cream-200 dark:border-white/5 group-hover:scale-110 transition-transform duration-500">
            <Plus size={40} className="text-gray-300 group-hover:text-paymint-green transition-colors" />
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Expand Node</h3>
            <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px] leading-loose">Deploy New Enterprise Location Profile</p>
          </div>
        </motion.button>
      </div>

      {/* Switcher Overlay - Truly Global (Portal equivalent) */}
      <AnimatePresence>
        {isSwitching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-white dark:bg-[#050505] flex flex-col items-center justify-center"
          >
            <div className="w-20 h-20 bg-paymint-green/10 rounded-[2.5rem] flex items-center justify-center mb-8 relative">
              <Loader2 size={40} className="text-paymint-green animate-spin" />
              <div className="absolute inset-0 bg-paymint-green/20 rounded-[2.5rem] animate-ping" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">Syncing Node</h2>
            <p className="text-paymint-green font-black uppercase tracking-[0.3em] text-sm mt-4">{selectedName}</p>

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
    </div>
  );
}

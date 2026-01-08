import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Plus, LogOut, ChevronRight, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function SelectEstablishmentPage() {
  const { establishments, setCurrentEstablishment, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  const handleSelect = (est: any) => {
    setIsSwitching(true);
    setSelectedName(est.name);
    
    // Simulate a "Real" backend switch transition
    setTimeout(() => {
      setCurrentEstablishment(est);
      toast.success(`Active Location: ${est.name}`);
      navigate('/dashboard');
    }, 800);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex flex-col transition-colors duration-500 relative overflow-hidden">
      {/* Remove glass glows, use solid background colors */}
      
      {/* Header */}
      <div className="p-8 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-paymint-green rounded-xl flex items-center justify-center shadow-lg shadow-paymint-green/20">
            <Zap size={20} className="text-black" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">PayMint</span>
            <span className="text-[10px] font-black text-paymint-green uppercase tracking-[0.2em] mt-1">Enterprise</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-gray-400 hover:text-paymint-red transition-all font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl hover:bg-paymint-red/5"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <div className="max-w-4xl w-full text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
              Select <span className="text-paymint-green underline decoration-paymint-green/30">Location</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg font-bold uppercase tracking-widest text-sm">Active Establishment Registry</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full">
          {establishments.map((est, index) => (
            <motion.div
              key={est.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setHoveredId(est.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleSelect(est)}
              className="group relative bg-white dark:bg-[#0A0A0A] rounded-[3rem] border-2 border-gray-100 dark:border-white/[0.05] p-10 cursor-pointer hover:border-paymint-green shadow-xl shadow-gray-200/50 dark:shadow-none transition-all flex flex-col items-center text-center"
            >
              <div className="w-24 h-24 bg-gray-50 dark:bg-white/[0.03] rounded-[2rem] flex items-center justify-center mb-8 border border-gray-100 dark:border-white/5 transition-transform duration-500 group-hover:scale-110 group-hover:bg-paymint-green/10">
                <Store size={40} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 truncate w-full">{est.name}</h3>
              
              <div className="flex items-center gap-3 mb-10">
                <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-500">
                  {est.currency}
                </span>
                <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-[10px] font-black uppercase tracking-[0.15em] text-paymint-green border border-paymint-green/20">
                  {est.subscriptionStatus}
                </span>
              </div>

              <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] transition-all ${hoveredId === est.id ? 'text-paymint-green' : 'text-gray-400'}`}>
                Enter Command Center
                <ChevronRight size={16} />
              </div>
            </motion.div>
          ))}

          {/* Add New - Solid Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: establishments.length * 0.05 }}
            onClick={() => navigate('/onboarding')}
            className="bg-gray-100/50 dark:bg-white/[0.02] border-2 border-dashed border-gray-300 dark:border-white/[0.1] rounded-[3rem] p-10 cursor-pointer hover:border-paymint-green hover:bg-white dark:hover:bg-white/[0.05] transition-all flex flex-col items-center justify-center group min-h-[350px]"
          >
            <div className="w-20 h-20 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-gray-200 dark:border-white/10 group-hover:bg-paymint-green/10 group-hover:border-paymint-green transition-all">
              <Plus size={36} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Expansion</h3>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Register New Asset</p>
          </motion.div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-12 text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
          <CheckCircle2 size={14} className="text-paymint-green" />
          PayMint Enterprise Protocol v2.0
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
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Initializing</h2>
              <p className="text-paymint-green font-black uppercase tracking-[0.3em] text-sm mt-2">{selectedName}</p>
              
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
    </div>
  );
}

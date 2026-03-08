import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Ticket,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Smartphone,
  Sparkles,
  LayoutDashboard,
  Headset,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import PaymintLeafIcon from '../../assets/small-logo.svg';
import api from '../../config/api';
import { loadTickets } from '../support/TicketsPage';

function timeAgo(iso: string): string {
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

export const PortalPage = () => {
  const { t } = useTranslation();
  const { account } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoadingTickets(true);
      try {
        const res = await api.get('/api/support/tickets/mine');
        const apiTickets = (res.data || []).map((t: any) => ({
          id: t.id as string,
          subject: t.subject as string,
          status: (t.status as string || 'open').replace(/_/g, '_'),
          updatedAt: t.updatedAt as string,
        }));
        setTickets(apiTickets.slice(0, 3));
      } catch {
        const fallback = loadTickets();
        setTickets(fallback.slice(0, 3));
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchTickets();
  }, []);

  const statusConfig: Record<string, any> = {
    open: { label: t('portal.status.open'), color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: AlertCircle },
    in_progress: { label: t('portal.status.inProgress'), color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: Loader2 },
    resolved: { label: t('portal.status.resolved'), color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', icon: CheckCircle2 },
    closed: { label: t('portal.status.closed', 'Closed'), color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-500/20', icon: CheckCircle2 }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">

          {/* Header card */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-gray-100 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 p-8 md:p-12 shadow-xl"
            >
              {/* Ambient glow */}
              <div className="absolute top-0 right-0 w-[480px] h-[480px] bg-paymint-green/20 blur-[130px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-paymint-green/10 blur-[100px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/3" />

              {/* User greeting */}
              <div className="relative z-10 flex items-center gap-6 mb-10">
                <div className="relative shrink-0">
                  <div className="absolute inset-0 bg-paymint-green blur-lg opacity-25 rounded-[12px]" />
                  <div className="relative w-20 h-20 bg-white dark:bg-gray-800 border-2 border-paymint-green/30 dark:border-paymint-green/50 rounded-[12px] flex items-center justify-center overflow-hidden">
                    <img
                      src={PaymintLeafIcon}
                      className="w-12 h-12 object-contain"
                      alt="Paymint"
                    />
                  </div>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-[10px] font-black tracking-widest uppercase text-gray-700 dark:text-white mb-2 font-outfit shadow-sm">
                    <Sparkles size={12} className="text-paymint-green" />
                    {t('common.welcome')} Back
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight font-outfit">
                    {t('portal.welcomeUser', { name: account?.firstName || 'User' })}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 mt-1.5 text-lg font-medium font-outfit">
                    {account?.email || ''}
                  </p>
                </div>
              </div>

              {/* Action section */}
              <div className="relative z-10 flex flex-col gap-3.5">
                {/* Primary: Go to Dashboard */}
                <Link
                  to="/owner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl bg-paymint-green px-8 py-7 flex items-center justify-between shadow-lg shadow-paymint-green/25 hover:brightness-110 transition-all duration-300 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-black/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-black/20 transition-colors">
                      <LayoutDashboard size={32} className="text-black" />
                    </div>
                    <div>
                      <p className="text-black font-black text-3xl leading-none font-outfit tracking-tight">
                        {t('portal.goToDashboard', 'Go to Dashboard')}
                      </p>
                      <p className="text-black/60 text-base font-semibold mt-2 font-outfit tracking-tight">
                        Manage your establishments, team, and settings
                      </p>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-black/10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-black/20 transition-colors ml-4 shadow-sm">
                    <ArrowRight size={24} className="text-black group-hover:translate-x-1.5 transition-all duration-300" />
                  </div>
                </Link>

                {/* Secondary: Support */}
                <Link
                  to="/support"
                  className="group flex items-center gap-4 px-7 py-5 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/[0.08] transition-all duration-300"
                >
                  <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <Headset size={20} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 dark:text-gray-200 text-base font-outfit uppercase tracking-wider text-[11px]">
                      {t('nav.support', 'Support')} & Assistance
                    </p>
                    <p className="text-sm text-gray-400 mt-1 font-outfit font-medium">
                      Get help, view tickets, and access resources
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Bottom section: Tickets + Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {/* Recent Tickets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[2rem] overflow-hidden shadow-sm"
              >
                <div className="p-8 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <h2 className="text-xl font-bold font-outfit tracking-tight">{t('portal.recentTickets.title')}</h2>
                  <Link
                    to="/support/tickets"
                    className="text-sm font-bold text-paymint-green hover:underline flex items-center gap-1.5 font-outfit"
                  >
                    {t('portal.recentTickets.viewAll')} <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/10">
                  {loadingTickets ? (
                    <div className="p-12 text-center">
                      <Loader2 size={28} className="animate-spin mx-auto mb-4 text-paymint-green" />
                      <p className="text-gray-500 font-outfit font-medium">Fetching your requests...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-14 h-14 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Ticket size={28} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-outfit font-medium">{t('portal.recentTickets.noTickets')}</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const status = statusConfig[ticket.status] || statusConfig.open;
                      const StatusIcon = status.icon;
                      return (
                        <Link
                          key={ticket.id}
                          to={`/support/tickets/${ticket.id}`}
                          className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                              <Ticket size={22} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors font-outfit text-base">
                                {ticket.subject}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-400 font-outfit font-medium mt-1">
                                <span className="uppercase tracking-widest text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">#{ticket.id.slice(-6)}</span>
                                <span className="text-gray-300 dark:text-gray-600">·</span>
                                <span>{timeAgo(ticket.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-[11px] font-bold ${status.bg} ${status.color} font-outfit shadow-sm`}>
                              <StatusIcon size={14} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                              {status.label}
                            </span>
                            <ChevronRight size={20} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>

                <div className="p-6 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/10">
                  <Link
                    to="/support/tickets/new"
                    className="inline-flex items-center gap-2.5 text-sm font-bold text-paymint-green hover:underline font-outfit"
                  >
                    <Ticket size={18} />
                    {t('portal.recentTickets.submitNew')}
                  </Link>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Mobile App */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 rounded-[2rem] p-8 shadow-sm"
              >
                <div className="flex items-center gap-3.5 mb-5">
                  <Smartphone size={24} className="text-paymint-green" />
                  <h3 className="font-bold font-outfit tracking-tight text-lg">{t('portal.mobileApp.title')}</h3>
                </div>
                <p className="text-base text-gray-600 dark:text-gray-400 mb-6 font-outfit font-medium leading-relaxed">
                  {t('portal.mobileApp.description', 'Manage your business on the go with our mobile app.')}
                </p>
                <div className="flex flex-col gap-3">
                  <a href="#" className="w-full py-3.5 bg-black text-white rounded-2xl text-[13px] font-bold text-center hover:bg-gray-900 transition-all font-outfit tracking-wider shadow-md active:scale-95">
                    {t('portal.mobileApp.appStore')}
                  </a>
                  <a href="#" className="w-full py-3.5 bg-black text-white rounded-2xl text-[13px] font-bold text-center hover:bg-gray-900 transition-all font-outfit tracking-wider shadow-md active:scale-95">
                    {t('portal.mobileApp.playStore')}
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer minimal={true} />
    </div>
  );
};

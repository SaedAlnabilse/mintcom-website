import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  User,
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
  Users
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
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
          {/* Creative Header & Launchpad */}
          <div className="mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-[2.5rem] bg-gray-100 dark:bg-[#0a0a0a] border border-gray-200 dark:border-gray-800 p-8 md:p-14 shadow-xl"
            >
              {/* Decorative Background Elements */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-paymint-green/20 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-paymint-green/10 blur-[100px] rounded-full pointer-events-none translate-y-1/2 -translate-x-1/3" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-paymint-green blur-md opacity-20 dark:opacity-40 rounded-full" />
                    <div className="relative w-24 h-24 bg-white dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border-2 border-paymint-green/30 dark:border-paymint-green/50 rounded-full flex items-center justify-center overflow-hidden">
                      {account?.avatar ? (
                        <img src={account.avatar} className="w-full h-full object-cover" alt="User Avatar" />
                      ) : (
                        <User size={40} className="text-paymint-green" />
                      )}
                    </div>
                  </div>
                  <div>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/20 text-gray-700 dark:text-white text-[10px] font-black tracking-widest uppercase mb-3"
                    >
                      <Sparkles size={12} className="text-paymint-green" />
                      {t('common.welcome')} Back
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                      {t('portal.welcomeUser', { name: account?.firstName || 'User' })}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-lg">
                      {account?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* Massive Action Cards inside the header for immediate navigation */}
              <div className="relative z-10 mt-12 flex flex-col gap-6">
                {/* 1. Go to Dashboard (Prominent) */}
                <Link
                  to="/owner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-3xl p-8 md:p-12 transition-all duration-300 backdrop-blur-sm shadow-xl flex flex-col items-center text-center justify-center"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-paymint-green/10 rounded-full blur-3xl group-hover:bg-paymint-green/20 transition-colors pointer-events-none" />

                  <div className="relative w-16 h-16 bg-paymint-green/10 dark:bg-paymint-green/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-paymint-green/30 group-hover:scale-110 transition-transform">
                    <LayoutDashboard size={32} className="text-paymint-green" />
                  </div>
                  <h3 className="relative text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">{t('portal.goToDashboard', 'Go to Dashboard')}</h3>
                  <p className="relative text-lg text-gray-500 dark:text-gray-400 font-medium">Manage your establishments, team, and settings</p>
                </Link>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Support */}
                  <Link
                    to="/support"
                    className="group relative overflow-hidden bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-3xl p-8 transition-all duration-300 backdrop-blur-sm shadow-xl"
                  >
                    <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-paymint-green/10 rounded-full blur-2xl group-hover:bg-paymint-green/20 transition-colors" />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="w-14 h-14 bg-paymint-green/10 dark:bg-paymint-green/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-paymint-green/30 group-hover:scale-110 transition-transform">
                          <Headset size={28} className="text-paymint-green" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('nav.support', 'Support')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Get help, view tickets, and access resources</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-paymint-green group-hover:text-black text-gray-900 dark:text-white transition-all transform group-hover:translate-x-2">
                        <ArrowRight size={24} />
                      </div>
                    </div>
                  </Link>

                  {/* Community */}
                  <Link
                    to="https://community.paymint.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-3xl p-8 transition-all duration-300 backdrop-blur-sm shadow-xl"
                  >
                    <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-paymint-green/10 rounded-full blur-2xl group-hover:bg-paymint-green/20 transition-colors" />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="w-14 h-14 bg-paymint-green/10 dark:bg-paymint-green/20 rounded-2xl flex items-center justify-center mb-6 ring-1 ring-paymint-green/30 group-hover:scale-110 transition-transform">
                          <Users size={28} className="text-paymint-green" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">{t('nav.community', 'Community')}</h3>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Join the discussion with other users</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-paymint-green group-hover:text-black text-gray-900 dark:text-white transition-all transform group-hover:translate-x-2">
                        <ArrowRight size={24} />
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">

              {/* Recent Tickets */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <h2 className="text-lg font-bold">{t('portal.recentTickets.title')}</h2>
                  <Link
                    to="/support/tickets"
                    className="text-sm font-bold text-paymint-green hover:underline flex items-center gap-1"
                  >
                    {t('portal.recentTickets.viewAll')} <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                  {loadingTickets ? (
                    <div className="p-8 text-center">
                      <Loader2 size={24} className="animate-spin mx-auto mb-3 text-paymint-green" />
                      <p className="text-gray-500">Loading tickets...</p>
                    </div>
                  ) : tickets.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Ticket size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500">{t('portal.recentTickets.noTickets')}</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const status = statusConfig[ticket.status] || statusConfig.open;
                      const StatusIcon = status.icon;

                      return (
                        <Link
                          key={ticket.id}
                          to={`/support/tickets/${ticket.id}`}
                          className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center">
                              <Ticket size={18} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="font-bold group-hover:text-paymint-green transition-colors">
                                {ticket.subject}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <span>{ticket.id}</span>
                                <span>·</span>
                                <span>{timeAgo(ticket.updatedAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${status.bg} ${status.color}`}>
                              <StatusIcon size={12} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                              {status.label}
                            </span>
                            <ChevronRight size={18} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/10">
                  <Link
                    to="/support/tickets/new"
                    className="inline-flex items-center gap-2 text-sm font-bold text-paymint-green hover:underline"
                  >
                    <Ticket size={16} />
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
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone size={24} className="text-paymint-green" />
                  <h3 className="font-bold">{t('portal.mobileApp.title')}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('portal.mobileApp.description')}
                </p>
                <div className="flex gap-2">
                  <a href="#" className="flex-1 py-2 bg-black text-white rounded-lg text-xs font-bold text-center hover:opacity-90 transition-all">
                    {t('portal.mobileApp.appStore')}
                  </a>
                  <a href="#" className="flex-1 py-2 bg-black text-white rounded-lg text-xs font-bold text-center hover:opacity-90 transition-all">
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


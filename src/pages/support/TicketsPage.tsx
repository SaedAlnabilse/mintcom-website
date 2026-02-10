import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Inbox,
  Calendar,
  Tag
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Ticket {
  id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  lastMessage: string;
  unreadReplies: number;
}

// Mock data
const mockTickets: Ticket[] = [
  {
    id: 'TKT-001',
    subject: 'Receipt printer not connecting via Bluetooth',
    category: 'Technical',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2025-02-08',
    updatedAt: '2025-02-09',
    lastMessage: 'Our team is looking into this issue. Can you try restarting the printer?',
    unreadReplies: 1
  },
  {
    id: 'TKT-002',
    subject: 'Question about upgrading subscription plan',
    category: 'Billing',
    status: 'open',
    priority: 'medium',
    createdAt: '2025-02-07',
    updatedAt: '2025-02-07',
    lastMessage: 'I would like to upgrade from Basic to Pro plan...',
    unreadReplies: 0
  },
  {
    id: 'TKT-003',
    subject: 'How to export sales data to Excel?',
    category: 'Features',
    status: 'resolved',
    priority: 'low',
    createdAt: '2025-02-05',
    updatedAt: '2025-02-06',
    lastMessage: 'Thank you! The export feature worked perfectly.',
    unreadReplies: 0
  },
  {
    id: 'TKT-004',
    subject: 'App crashes when adding new menu item',
    category: 'Technical',
    status: 'open',
    priority: 'urgent',
    createdAt: '2025-02-09',
    updatedAt: '2025-02-09',
    lastMessage: 'The app keeps crashing whenever I try to add a new item...',
    unreadReplies: 0
  }
];

export const TicketsPage = () => {
  const { t } = useTranslation(['support', 'common']);
  const [tickets] = useState<Ticket[]>(mockTickets);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    open: { label: t('support.tickets.status.open'), color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: Inbox },
    in_progress: { label: t('support.tickets.status.inProgress'), color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: Loader2 },
    resolved: { label: t('support.tickets.status.resolved'), color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', icon: CheckCircle2 },
    closed: { label: t('support.tickets.status.closed'), color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-500/20', icon: CheckCircle2 }
  };

  const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string }> = {
    low: { label: t('support.tickets.priority.low'), color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-500/20' },
    medium: { label: t('support.tickets.priority.medium'), color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20' },
    high: { label: t('support.tickets.priority.high'), color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-500/20' },
    urgent: { label: t('support.tickets.priority.urgent'), color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20' }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  to="/support"
                  className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="text-3xl font-black tracking-tight">{t('support.tickets.myTickets')}</h1>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium ml-11">
                {t('support.tickets.subtitle')}
              </p>
            </div>

            <Link
              to="/support/tickets/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-paymint-green/20"
            >
              <Plus size={18} />
              {t('support.tickets.new')}
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Inbox size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.open}</p>
                  <p className="text-sm font-medium text-gray-500">{t('support.tickets.stats.open')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Clock size={24} className="text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.inProgress}</p>
                  <p className="text-sm font-medium text-gray-500">{t('support.tickets.stats.inProgress')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-black">{stats.resolved}</p>
                  <p className="text-sm font-medium text-gray-500">{t('support.tickets.stats.resolved')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('support.tickets.searchPlaceholder')}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
                  showFilters
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                }`}
              >
                <Filter size={18} />
                {t('common.filters')}
              </button>
            </div>

            {/* Filter Options */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/10">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{t('support.tickets.statusLabel')}</p>
                    <div className="flex flex-wrap gap-2">
                      {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                            statusFilter === status
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                          }`}
                        >
                          {status === 'all' ? t('common.all') : statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Tickets List */}
          <div className="space-y-4">
            {filteredTickets.length === 0 ? (
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Inbox size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{t('support.tickets.notFound')}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {searchQuery ? t('support.tickets.notFoundSearch') : t('support.tickets.noTicketsYet')}
                </p>
                <Link
                  to="/support/tickets/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  <Plus size={18} />
                  {t('support.tickets.createFirst')}
                </Link>
              </div>
            ) : (
              filteredTickets.map((ticket, index) => {
                const status = statusConfig[ticket.status];
                const priority = priorityConfig[ticket.priority];
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/support/tickets/${ticket.id}`}
                      className="block bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:border-paymint-green/30 hover:shadow-lg transition-all group"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-bold text-gray-400">{ticket.id}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${status.bg} ${status.color}`}>
                              <StatusIcon size={12} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                              {status.label}
                            </span>
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${priority.bg} ${priority.color}`}>
                              {priority.label}
                            </span>
                            {ticket.unreadReplies > 0 && (
                              <span className="px-2 py-1 bg-paymint-green text-black rounded-md text-xs font-bold">
                                {ticket.unreadReplies} {t('support.tickets.newLabel')}
                              </span>
                            )}
                          </div>

                          <h3 className="text-lg font-bold group-hover:text-paymint-green transition-colors mb-2">
                            {ticket.subject}
                          </h3>

                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {ticket.lastMessage}
                          </p>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                              <Tag size={12} />
                              {ticket.category}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                              <Calendar size={12} />
                              {t('support.tickets.updated')} {ticket.updatedAt}
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

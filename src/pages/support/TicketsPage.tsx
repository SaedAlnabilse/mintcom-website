import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
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
  Tag,
  XCircle,
  BarChart3,
  RefreshCw,
  X
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import { SurfaceLoader } from '../../components/LoadingState';
import { formatInputPlaceholder } from '../../utils/textCase';

// ─── Types ──────────────────────────────────────────────────────────────────────────────────────────────────────
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TicketMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: { name: string; size: string; type: string; url?: string }[];
}

export interface Ticket {
  id: string;
  ticketNumber?: string;
  subject: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  description: string;
  messages: TicketMessage[];
  unreadReplies: number;
  lastMessage?: {
    content: string;
    senderType: 'user' | 'support';
    createdAt: string;
  } | null;
  needsCustomerReply?: boolean;
}

// ─── Storage helpers (fallback) ─────────────────────────────────────────────────────────────────────────────────────
const TICKETS_STORAGE_KEY = 'mintcom_support_tickets';

export function loadTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(TICKETS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Ticket[];
  } catch {
    return [];
  }
}

export function saveTickets(tickets: Ticket[]) {
  localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(tickets));
}

export function getTicketById(id: string): Ticket | undefined {
  return loadTickets().find((t) => t.id === id);
}

export function updateTicket(updated: Ticket) {
  const all = loadTickets();
  const idx = all.findIndex((t) => t.id === updated.id);
  if (idx >= 0) {
    all[idx] = updated;
    saveTickets(all);
  }
}

export function addTicket(ticket: Ticket) {
  const all = loadTickets();
  all.unshift(ticket);
  saveTickets(all);
}

// ─── Format helpers ────────────────────────────────────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

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
    return formatDate(iso);
  } catch {
    return iso;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────────────────────────────────────────────
export const TicketsPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Load tickets from API, fallback to localStorage
  useEffect(() => {
    const fetchTickets = async () => {
      setLoadingTickets(true);
      try {
        const res = await api.get('/api/support/tickets/mine');
        // Map API response to local Ticket shape
        const apiTickets: Ticket[] = (res.data || []).map((t: Record<string, unknown>) => ({
          id: t.id as string,
          ticketNumber: t.ticketNumber as string,
          subject: t.subject as string,
          category: t.category as string,
          status: (t.status as string || 'open').replace(/_/g, '_') as TicketStatus,
          priority: t.priority as TicketPriority,
          createdAt: t.createdAt as string,
          updatedAt: t.updatedAt as string,
          description: '',
          messages: [],
          unreadReplies: t.needsCustomerReply ? 1 : 0,
          lastMessage: t.lastMessage as Ticket['lastMessage'],
          needsCustomerReply: Boolean(t.needsCustomerReply),
        }));
        setTickets(apiTickets);
      } catch {
        // Fallback to localStorage
        setTickets(loadTickets());
      } finally {
        setLoadingTickets(false);
      }
    };

    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated]);

  const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType; dotColor: string }> = useMemo(() => ({
    open: { label: t('support.tickets.status.open'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15', icon: Inbox, dotColor: 'bg-blue-500' },
    in_progress: { label: t('support.tickets.status.inProgress'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/15', icon: Loader2, dotColor: 'bg-amber-500' },
    resolved: { label: t('support.tickets.status.resolved'), color: 'text-mintcom-green dark:text-mintcom-green', bg: 'bg-mintcom-green/10 dark:bg-mintcom-green/', icon: CheckCircle2, dotColor: 'bg-mintcom-green' },
    closed: { label: t('support.tickets.status.closed'), color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/15', icon: XCircle, dotColor: 'bg-gray-400' }
  }), [t]);

  const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string; weight: number }> = useMemo(() => ({
    low: { label: t('support.tickets.priority.low'), color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/15', weight: 1 },
    medium: { label: t('support.tickets.priority.medium'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15', weight: 2 },
    high: { label: t('support.tickets.priority.high'), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/15', weight: 3 },
    urgent: { label: t('support.tickets.priority.urgent'), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/15', weight: 4 }
  }), [t]);

  // Filtered + sorted tickets
  const filteredTickets = useMemo(() => {
    const result = tickets.filter((ticket) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        ticket.subject.toLowerCase().includes(q) ||
        ticket.id.toLowerCase().includes(q) ||
        (ticket.ticketNumber || '').toLowerCase().includes(q) ||
        (ticket.lastMessage?.content || '').toLowerCase().includes(q) ||
        ticket.description.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      // priority – higher weight first
      return priorityConfig[b.priority].weight - priorityConfig[a.priority].weight;
    });

    return result;
  }, [tickets, searchQuery, statusFilter, priorityFilter, sortBy, priorityConfig]);

  // Stats
  const stats = useMemo(
    () => ({
      total: tickets.length,
      open: tickets.filter((t) => t.status === 'open').length,
      inProgress: tickets.filter((t) => t.status === 'in_progress').length,
      resolved: tickets.filter((t) => t.status === 'resolved').length,
      closed: tickets.filter((t) => t.status === 'closed').length,
    }),
    [tickets]
  );

  const activeFilters = (statusFilter !== 'all' ? 1 : 0) + (priorityFilter !== 'all' ? 1 : 0);

  // ─── Auth guard ──────────────────────────────────────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
            <SurfaceLoader message={t('common.loading')} className="max-w-4xl mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/support/tickets' }} />;
  }

  // ─── Render ──────────────────────────────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto max-w-6xl px-6 md:px-10">
          {/* ──── Header ──── */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  to="/support"
                  className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <h1 className="font-magilio text-3xl font-black tracking-tight">{t('support.tickets.myTickets')}</h1>
              </div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors ml-11">
                {t('support.tickets.subtitle')}
              </p>
            </div>

            <Link
              to="/support/tickets/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mintcom-green font-bold text-black shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all hover:shadow-[0_8px_24px_-6px_rgba(124,195,159,0.6)]"
            >
              <Plus size={18} />
              {t('support.tickets.new')}
            </Link>
          </div>

          {/* ──── Stats Cards ──── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { key: 'open' as const, icon: Inbox, value: stats.open, label: t('support.tickets.stats.open'), iconColor: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-500/10' },
              { key: 'inProgress' as const, icon: Clock, value: stats.inProgress, label: t('support.tickets.stats.inProgress'), iconColor: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-500/10' },
              { key: 'resolved' as const, icon: CheckCircle2, value: stats.resolved, label: t('support.tickets.stats.resolved'), iconColor: 'text-mintcom-green', bgColor: 'bg-mintcom-green/10 dark:bg-mintcom-green/' },
              { key: 'total' as const, icon: BarChart3, value: stats.total, label: t('support.tickets.stats.total'), iconColor: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-500/10' },
            ].map((stat) => (
              <motion.div
                key={stat.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-5 hover:border-gray-200 dark:hover:border-white/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <stat.icon size={20} className={stat.iconColor} />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none">{stat.value}</p>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors mt-0.5">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ──── Search + Filters bar ──── */}
          <div className="rounded-3xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input maxLength={255}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={formatInputPlaceholder(t('support.tickets.searchPlaceholder'), t('common.locale'))}
                  className="w-full pl-12 pr-11 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-mintcom-green/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('common.clearSearch', 'Clear search')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  >
                    <X size={12} strokeWidth={2.75} />
                  </button>
                )}
              </div>

              {/* Sort dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 appearance-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Highest Priority</option>
              </select>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`relative inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all ${showFilters || activeFilters > 0
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                  : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                  }`}
              >
                <Filter size={18} />
                {t('common.filters')}
                {activeFilters > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-mintcom-green text-black text-xs font-black rounded-full flex items-center justify-center">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>

            {/* Filters panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 border-t border-gray-100 dark:border-white/10 space-y-4">
                    {/* Status filter */}
                    <div>
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors mb-3 uppercase">
                        {t('support.tickets.statusLabel')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${statusFilter === status
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                              }`}
                          >
                            {status === 'all' ? t('common.all') : statusConfig[status].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Priority filter */}
                    <div>
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors mb-3 uppercase">
                        {t('support.tickets.priorityLabel')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(['all', 'low', 'medium', 'high', 'urgent'] as const).map((pri) => (
                          <button
                            key={pri}
                            onClick={() => setPriorityFilter(pri)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${priorityFilter === pri
                              ? 'bg-gray-900 dark:bg-white text-white dark:text-black'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
                              }`}
                          >
                            {pri === 'all' ? t('common.all') : priorityConfig[pri].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Clear all filters */}
                    {activeFilters > 0 && (
                      <button
                        onClick={() => {
                          setStatusFilter('all');
                          setPriorityFilter('all');
                        }}
                        className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
                      >
                        <XCircle size={14} />
                        Clear all filters
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ──── Tickets List ──── */}
          <div className="space-y-3">
            {loadingTickets ? (
              <SurfaceLoader
                message={t('support.tickets.loading', { defaultValue: 'Loading tickets...' })}
                paddingClassName="p-16"
              />
            ) : filteredTickets.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-16 text-center"
              >
                <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Inbox size={36} className="text-gray-400" />
                </div>
                <h3 className="font-barlow text-xl font-bold mb-2">{searchQuery.trim() ? t('common.noResults') : t('support.tickets.notFound')}</h3>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors mb-8 max-w-sm mx-auto">
                  {searchQuery.trim()
                    ? t('common.noMatchingResults', {
                        entity: 'tickets',
                        query: searchQuery.trim(),
                        defaultValue: 'No {{entity}} matching "{{query}}"',
                      })
                    : searchQuery || activeFilters > 0
                      ? t('support.tickets.notFoundSearch')
                      : t('support.tickets.noTicketsYet')}
                </p>
                {searchQuery || activeFilters > 0 ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setPriorityFilter('all');
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/10 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                  >
                    <RefreshCw size={18} />
                    Clear filters
                  </button>
                ) : (
                  <Link
                    to="/support/tickets/new"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mintcom-green font-bold text-black shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all hover:shadow-[0_8px_24px_-6px_rgba(124,195,159,0.6)]"
                  >
                    <Plus size={18} />
                    {t('support.tickets.createFirst')}
                  </Link>
                )}
              </motion.div>
            ) : (
              <>
                {/* Results count */}
                <div className="flex items-center justify-between px-1 mb-1">
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">
                    {filteredTickets.length} {filteredTickets.length === 1 ? 'ticket' : 'tickets'}
                    {searchQuery && ` matching "${searchQuery}"`}
                  </p>
                </div>

                {filteredTickets.map((ticket, index) => {
                  const status = statusConfig[ticket.status];
                  const priority = priorityConfig[ticket.priority];
                  const StatusIcon = status.icon;
                  const lastMsg = ticket.lastMessage || (ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1] : null);

                  return (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.04, 0.4) }}
                    >
                      <Link
                        to={`/support/tickets/${ticket.id}`}
                        className="block rounded-3xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-5 md:p-6 hover:border-mintcom-green/30 hover:shadow-lg hover:shadow-mintcom-green/5 transition-all group"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            {/* Top row: id + badges */}
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-xs font-bold text-gray-400 font-mono">{ticket.ticketNumber || ticket.id}</span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${status.bg} ${status.color}`}>
                                <StatusIcon size={12} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                                {status.label}
                              </span>
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${priority.bg} ${priority.color}`}>
                                {priority.label}
                              </span>
                              {ticket.unreadReplies > 0 && (
                                <span className="px-2 py-1 bg-mintcom-green text-black rounded-lg text-xs font-bold animate-pulse">
                                  {t('support.tickets.newLabel')}
                                </span>
                              )}
                            </div>

                            {/* Subject */}
                            <h3 className="font-barlow text-base md:text-lg font-bold group-hover:text-mintcom-green transition-colors mb-1.5 truncate">
                              {ticket.subject}
                            </h3>

                            {/* Last message preview */}
                            <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors line-clamp-1">
                              {lastMsg
                                ? `${'senderType' in lastMsg ? (lastMsg.senderType === 'support' ? 'Support' : 'You') : (lastMsg.sender === 'support' ? 'Support' : 'You')}: ${lastMsg.content}`
                                : ticket.description}
                            </p>
                          </div>

                          {/* Right side: meta */}
                          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
                            <div className="text-right hidden md:block">
                              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors mb-1 justify-end">
                                <Tag size={12} />
                                <span className="capitalize">{ticket.category}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors justify-end">
                                <Calendar size={12} />
                                {timeAgo(ticket.updatedAt)}
                              </div>
                            </div>

                            {/* Mobile meta */}
                            <div className="flex items-center gap-3 md:hidden text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">
                              <span className="capitalize">{ticket.category}</span>
                              <span>·</span>
                              <span>{timeAgo(ticket.updatedAt)}</span>
                            </div>

                            <ChevronRight
                              size={20}
                              className="text-gray-400 group-hover:text-mintcom-green group-hover:translate-x-1 transition-all hidden md:block"
                            />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};


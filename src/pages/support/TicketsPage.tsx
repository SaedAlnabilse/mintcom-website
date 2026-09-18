import { useState, useEffect, useMemo, useCallback } from 'react';
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

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Storage helpers (fallback) ───────────────────────────────────────────────
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

// ─── Format helpers ───────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
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
  const [loadError, setLoadError] = useState(false);

  // Load tickets from the support API. We deliberately do NOT silently fall back
  // to browser-local storage here: showing stale, browser-only data as if it were
  // the real ticket list would mislead the customer. On failure we surface an
  // explicit error with a retry instead.
  const fetchTickets = useCallback(async () => {
    setLoadingTickets(true);
    setLoadError(false);
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
      setTickets([]);
      setLoadError(true);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [isAuthenticated, fetchTickets]);

  const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType; dotColor: string }> = useMemo(() => ({
    open: { label: t('support.tickets.status.open'), color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-500/10', icon: Inbox, dotColor: 'bg-blue-500' },
    in_progress: { label: t('support.tickets.status.inProgress'), color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Loader2, dotColor: 'bg-amber-500' },
    resolved: { label: t('support.tickets.status.resolved'), color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle2, dotColor: 'bg-emerald-500' },
    closed: { label: t('support.tickets.status.closed'), color: 'text-stone-500 dark:text-zinc-400', bg: 'bg-stone-100 dark:bg-zinc-800', icon: XCircle, dotColor: 'bg-stone-400' }
  }), [t]);

  const priorityConfig: Record<TicketPriority, { label: string; color: string; bg: string; weight: number }> = useMemo(() => ({
    low: { label: t('support.tickets.priority.low'), color: 'text-stone-500 dark:text-zinc-400', bg: 'bg-stone-100 dark:bg-zinc-800', weight: 1 },
    medium: { label: t('support.tickets.priority.medium'), color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-500/10', weight: 2 },
    high: { label: t('support.tickets.priority.high'), color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-50 dark:bg-orange-500/10', weight: 3 },
    urgent: { label: t('support.tickets.priority.urgent'), color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-500/10', weight: 4 }
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
  const hasTicketSearch = searchQuery.trim().length > 0;

  // ─── Auth guard ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Navbar hideCommercialLinks />
        <main className="mx-auto w-full max-w-4xl px-6 pb-20 pt-28">
          <SurfaceLoader message={t('common.loading')} />
        </main>
        <Footer hideCommercialLinks />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: '/support/tickets' }} />;
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar hideCommercialLinks />

      <main className="mx-auto w-full max-w-4xl px-6 pb-20 pt-28">
        {/* ──── Header ──── */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link to="/support" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100">
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
              {t('support.articles.backToHelp')}
            </Link>
            <h1 className="font-magilio mt-4 text-3xl font-bold tracking-tight md:text-4xl">{t('support.tickets.myTickets')}</h1>
            <p className="mt-2 text-[15px] text-stone-500 dark:text-zinc-400">
              {t('support.tickets.subtitle')}
            </p>
          </div>
          <Link
            to="/support/tickets/new"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
          >
            <Plus size={16} strokeWidth={2.5} />
            {t('support.tickets.new')}
          </Link>
        </div>

        {/* ──── Stats strip ──── */}
        <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Inbox, value: stats.open, label: t('support.tickets.stats.open') },
            { icon: Clock, value: stats.inProgress, label: t('support.tickets.stats.inProgress') },
            { icon: CheckCircle2, value: stats.resolved, label: t('support.tickets.stats.resolved') },
            { icon: BarChart3, value: stats.total, label: t('support.tickets.stats.total') },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-white px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <dt className="flex items-center gap-1.5 text-[13px] font-medium text-stone-500 dark:text-zinc-400">
                <Icon size={13} /> {label}
              </dt>
              <dd className="font-magilio mt-0.5 text-2xl font-bold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>

        {/* ──── Search + filters ──── */}
        <div className="mb-5 rounded-2xl border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-col gap-2.5 md:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
              <input maxLength={255}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={formatInputPlaceholder(t('support.tickets.searchPlaceholder'), t('common.locale'))}
                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pe-10 ps-10 text-sm transition-colors placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('common.clearSearch', 'Clear search')}
                  className="absolute end-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>

            <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-3.5 py-2.5 text-sm font-semibold text-stone-600 dark:border-zinc-700 dark:text-zinc-300">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'priority')}
                className="cursor-pointer bg-transparent font-semibold focus:outline-none"
                aria-label={t('common.sort.newestFirst')}
              >
                <option value="newest">{t('common.sort.newestFirst')}</option>
                <option value="oldest">{t('common.sort.oldestFirst')}</option>
                <option value="priority">{t('common.sort.highestPriority')}</option>
              </select>
            </label>

            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className={`relative inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                showFilters || activeFilters > 0
                  ? 'border-stone-900 bg-stone-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                  : 'border-stone-200 text-stone-600 hover:border-stone-300 dark:border-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Filter size={15} />
              {t('common.filters')}
              {activeFilters > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mintcom-green text-[11px] font-bold text-black">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-4 border-t border-stone-200 pt-4 dark:border-zinc-800">
                  <div>
                    <p className="mb-2 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">
                      {t('support.tickets.statusLabel')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(['all', 'open', 'in_progress', 'resolved', 'closed'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          aria-pressed={statusFilter === status}
                          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${statusFilter === status
                            ? 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                          {status === 'all' ? t('common.all') : statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">
                      {t('support.tickets.priorityLabel')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {(['all', 'low', 'medium', 'high', 'urgent'] as const).map((pri) => (
                        <button
                          key={pri}
                          onClick={() => setPriorityFilter(pri)}
                          aria-pressed={priorityFilter === pri}
                          className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${priorityFilter === pri
                            ? 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                            : 'text-stone-500 hover:bg-stone-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                          {pri === 'all' ? t('common.all') : priorityConfig[pri].label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {activeFilters > 0 && (
                    <button
                      onClick={() => {
                        setStatusFilter('all');
                        setPriorityFilter('all');
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:underline dark:text-red-400"
                    >
                      <XCircle size={14} />
                      {t('support.tickets.clearAllFilters')}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ──── Tickets List ──── */}
        <div>
          {loadingTickets ? (
            <SurfaceLoader
              message={t('support.tickets.loading', { defaultValue: 'Loading tickets...' })}
              paddingClassName="p-16"
            />
          ) : loadError ? (
            <div className="rounded-2xl border border-red-200 bg-white p-14 text-center dark:border-red-900/50 dark:bg-zinc-900/60">
              <h3 className="font-barlow text-lg font-bold">
                {t('support.tickets.loadListErrorTitle', { defaultValue: "Couldn't load your tickets" })}
              </h3>
              <p className="mx-auto mb-6 mt-1 max-w-sm text-sm text-stone-500 dark:text-zinc-400">
                {t('support.tickets.loadErrorDesc', {
                  defaultValue:
                    'We were unable to reach the support service. Please check your connection and try again.',
                })}
              </p>
              <button
                onClick={() => fetchTickets()}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-stone-300 dark:border-zinc-700"
              >
                <RefreshCw size={15} />
                {t('common.retry', { defaultValue: 'Try again' })}
              </button>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-14 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 dark:bg-zinc-800">
                <Inbox size={22} className="text-stone-400" />
              </span>
              <h3 className="font-barlow text-lg font-bold">
                {hasTicketSearch
                  ? t('common.noResults')
                  : activeFilters > 0
                    ? t('common.noFilteredResults')
                    : t('support.tickets.notFound')}
              </h3>
              <p className="mx-auto mb-6 mt-1 max-w-sm text-sm text-stone-500 dark:text-zinc-400">
                {hasTicketSearch
                  ? t('common.noMatchingResults', {
                      entity: 'tickets',
                      query: searchQuery.trim(),
                      defaultValue: 'No {{entity}} matching "{{query}}"',
                    })
                  : activeFilters > 0
                    ? t('common.noFilteredResultsDesc')
                    : t('support.tickets.noTicketsYet')}
              </p>
              {searchQuery || activeFilters > 0 ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPriorityFilter('all');
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-stone-300 dark:border-zinc-700"
                >
                  <RefreshCw size={15} />
                  {t('support.tickets.clearFilters')}
                </button>
              ) : (
                <Link
                  to="/support/tickets/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  {t('support.tickets.createFirst')}
                </Link>
              )}
            </div>
          ) : (
            <>
              <p className="mb-2 px-1 text-[13px] tabular-nums text-stone-500 dark:text-zinc-400">
                {t('support.tickets.resultCount', { count: filteredTickets.length })}
                {searchQuery && ` — “${searchQuery.trim()}”`}
              </p>

              <ol className="space-y-2.5">
                {filteredTickets.map((ticket) => {
                  const status = statusConfig[ticket.status];
                  const priority = priorityConfig[ticket.priority];
                  const StatusIcon = status.icon;
                  const lastMsg = ticket.lastMessage || (ticket.messages.length > 0 ? ticket.messages[ticket.messages.length - 1] : null);

                  return (
                    <li key={ticket.id}>
                      <Link
                        to={`/support/tickets/${ticket.id}`}
                        className="group block rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                              <span className="font-mono text-xs text-stone-400">{ticket.ticketNumber || ticket.id}</span>
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${status.bg} ${status.color}`}>
                                <StatusIcon size={12} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                                {status.label}
                              </span>
                              <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${priority.bg} ${priority.color}`}>
                                {priority.label}
                              </span>
                              {ticket.unreadReplies > 0 && (
                                <span className="rounded-md bg-mintcom-green px-2 py-0.5 text-xs font-bold text-black">
                                  {t('support.tickets.newLabel')}
                                </span>
                              )}
                            </div>

                            <h3 className="font-barlow truncate text-[17px] font-bold tracking-tight group-hover:underline group-hover:decoration-mintcom-green group-hover:decoration-2 group-hover:underline-offset-4">
                              {ticket.subject}
                            </h3>

                            <p className="mt-0.5 truncate text-sm text-stone-500 dark:text-zinc-400">
                              {lastMsg
                                ? `${'senderType' in lastMsg ? (lastMsg.senderType === 'support' ? 'Support' : 'You') : (lastMsg.sender === 'support' ? 'Support' : 'You')}: ${lastMsg.content}`
                                : ticket.description}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-center gap-4 text-[13px] text-stone-400">
                            <span className="hidden items-center gap-1.5 md:inline-flex">
                              <Tag size={12} />
                              <span className="capitalize">{ticket.category}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Calendar size={12} />
                              {timeAgo(ticket.updatedAt)}
                            </span>
                            <ChevronRight
                              size={17}
                              className="text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-500"
                            />
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      </main>

      <Footer hideCommercialLinks />
    </div>
  );
};

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Inbox,
  MessageSquare,
  RefreshCw,
  Search,
  Shield,
  Star,
  Tag,
  TimerReset,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { FullScreenLoader, SurfaceLoader } from '../../components/LoadingState';
import { formatInputPlaceholder } from '../../utils/textCase';
import { isSupportAdminEmail } from '../../config/support';

interface AdminTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  requesterName: string | null;
  requesterEmail: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: {
    content: string;
    senderType: string;
    createdAt: string;
  } | null;
}

interface Stats {
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  total: number;
}

type QueueKey = 'all' | 'needs_reply' | 'urgent' | 'stale' | 'open' | 'in_progress' | 'resolved';

const statusConfig = {
  open: { label: 'Open', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15', icon: Inbox },
  in_progress: { label: 'In progress', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/15', icon: Clock },
  resolved: { label: 'Resolved', color: 'text-paymint-green', bg: 'bg-paymint-green/10', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-white/10', icon: XCircle },
};

const priorityConfig = {
  low: { label: 'Low', dot: 'bg-gray-400', color: 'text-gray-500', weight: 1, slaHours: 48 },
  medium: { label: 'Medium', dot: 'bg-blue-500', color: 'text-blue-600 dark:text-blue-400', weight: 2, slaHours: 24 },
  high: { label: 'High', dot: 'bg-orange-500', color: 'text-orange-600 dark:text-orange-400', weight: 3, slaHours: 8 },
  urgent: { label: 'Urgent', dot: 'bg-red-500', color: 'text-red-600 dark:text-red-400', weight: 4, slaHours: 2 },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function hoursSince(dateStr: string): number {
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / 36e5);
}

function normalizeStatus(status: string) {
  return status.toLowerCase().replace('-', '_');
}

function getPriority(ticket: AdminTicket) {
  return priorityConfig[ticket.priority as keyof typeof priorityConfig] || priorityConfig.medium;
}

function getLastCustomerActivity(ticket: AdminTicket) {
  return ticket.lastMessage?.senderType === 'user' ? ticket.lastMessage.createdAt : ticket.createdAt;
}

function needsSupportReply(ticket: AdminTicket) {
  const status = normalizeStatus(ticket.status);
  return status !== 'closed' && status !== 'resolved' && ticket.lastMessage?.senderType !== 'support';
}

function isStale(ticket: AdminTicket) {
  if (!needsSupportReply(ticket)) return false;
  const priority = getPriority(ticket);
  return hoursSince(getLastCustomerActivity(ticket)) >= priority.slaHours;
}

function getSlaLabel(ticket: AdminTicket) {
  if (!needsSupportReply(ticket)) return { label: 'Waiting on customer', tone: 'text-gray-500' };

  const priority = getPriority(ticket);
  const remaining = priority.slaHours - hoursSince(getLastCustomerActivity(ticket));

  if (remaining <= 0) return { label: 'SLA overdue', tone: 'text-red-600 dark:text-red-400' };
  if (remaining <= 2) return { label: `${Math.ceil(remaining)}h left`, tone: 'text-orange-600 dark:text-orange-400' };
  return { label: `${Math.ceil(remaining)}h left`, tone: 'text-gray-500 dark:text-gray-400' };
}

export const SupportAdminPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, account } = useAuth();

  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [queue, setQueue] = useState<QueueKey>('needs_reply');
  const [showFilters, setShowFilters] = useState(false);

  const isSupportTeam = isSupportAdminEmail(account?.email);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const [ticketsRes, statsRes] = await Promise.all([
        api.get('/api/support/admin/tickets', {
          params: {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            search: searchQuery.trim() || undefined,
          },
        }),
        api.get('/api/support/admin/tickets/stats'),
      ]);
      setTickets(ticketsRes.data || []);
      setStats(statsRes.data || { open: 0, inProgress: 0, resolved: 0, closed: 0, total: 0 });
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, searchQuery, statusFilter]);

  useEffect(() => {
    if (isAuthenticated && isSupportTeam) {
      fetchTickets();
    }
  }, [fetchTickets, isAuthenticated, isSupportTeam]);

  const deskStats = useMemo(() => {
    const needsReply = tickets.filter(needsSupportReply).length;
    const urgent = tickets.filter((ticket) => ticket.priority === 'urgent' && normalizeStatus(ticket.status) !== 'closed').length;
    const stale = tickets.filter(isStale).length;
    const active = tickets.filter((ticket) => !['resolved', 'closed'].includes(normalizeStatus(ticket.status))).length;

    return { needsReply, urgent, stale, active };
  }, [tickets]);

  const queueItems = useMemo(() => ([
    { key: 'needs_reply' as const, label: 'Needs reply', count: deskStats.needsReply, icon: AlertTriangle },
    { key: 'urgent' as const, label: 'Urgent', count: deskStats.urgent, icon: TimerReset },
    { key: 'stale' as const, label: 'SLA overdue', count: deskStats.stale, icon: Clock },
    { key: 'open' as const, label: 'Open', count: stats.open, icon: Inbox },
    { key: 'in_progress' as const, label: 'In progress', count: stats.inProgress, icon: MessageSquare },
    { key: 'resolved' as const, label: 'Resolved', count: stats.resolved, icon: CheckCircle2 },
    { key: 'all' as const, label: 'All tickets', count: stats.total, icon: BarChart3 },
  ]), [deskStats.needsReply, deskStats.stale, deskStats.urgent, stats.inProgress, stats.open, stats.resolved, stats.total]);

  const filteredTickets = useMemo(() => {
    const filtered = tickets.filter((ticket) => {
      const status = normalizeStatus(ticket.status);
      if (queue === 'needs_reply' && !needsSupportReply(ticket)) return false;
      if (queue === 'urgent' && !(ticket.priority === 'urgent' && status !== 'closed')) return false;
      if (queue === 'stale' && !isStale(ticket)) return false;
      if (queue === 'open' && status !== 'open') return false;
      if (queue === 'in_progress' && status !== 'in_progress') return false;
      if (queue === 'resolved' && status !== 'resolved') return false;
      return true;
    });

    return filtered.sort((a, b) => {
      const aNeedsReply = needsSupportReply(a) ? 1 : 0;
      const bNeedsReply = needsSupportReply(b) ? 1 : 0;
      if (aNeedsReply !== bNeedsReply) return bNeedsReply - aNeedsReply;

      const priorityDiff = getPriority(b).weight - getPriority(a).weight;
      if (priorityDiff !== 0) return priorityDiff;

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [queue, tickets]);

  if (authLoading) {
    return <FullScreenLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: '/support/admin' }} replace />;
  }

  if (!isSupportTeam) {
    return <Navigate to="/support" replace />;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-28 pb-16 dark:bg-[#0a0a0a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-paymint-green/25 bg-paymint-green/10 px-3 py-1.5 text-xs font-bold text-paymint-green">
                <Shield size={14} />
                Support admin: {account?.email}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                Support Desk
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-gray-500 dark:text-gray-400">
                Triage customer tickets, keep urgent requests visible, and reply as Paymint Support.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={fetchTickets}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
              <button
                onClick={() => navigate('/support/admin/feedback')}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-paymint-green px-4 py-3 text-sm font-black text-black transition-opacity hover:opacity-90"
              >
                <Star size={16} />
                Feedback
              </button>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Active', value: deskStats.active, icon: Inbox, tone: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
              { label: 'Needs reply', value: deskStats.needsReply, icon: AlertTriangle, tone: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
              { label: 'SLA overdue', value: deskStats.stale, icon: TimerReset, tone: 'text-red-500', bg: 'bg-red-50 dark:bg-red-500/10' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, tone: 'text-paymint-green', bg: 'bg-paymint-green/10' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
                    <item.icon size={20} className={item.tone} />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none text-gray-900 dark:text-white">{item.value}</p>
                    <p className="mt-1 text-sm font-bold text-gray-500 dark:text-gray-400">{item.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <aside className="space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-3 dark:border-white/10 dark:bg-white/[0.03]">
                {queueItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setQueue(item.key)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors ${
                      queue === item.key
                        ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5'
                    }`}
                  >
                    <span className="flex items-center gap-2 text-sm font-bold">
                      <item.icon size={16} />
                      {item.label}
                    </span>
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-black ${queue === item.key ? 'bg-white/15 dark:bg-black/10' : 'bg-gray-100 dark:bg-white/10'}`}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <h2 className="mb-3 text-sm font-black text-gray-900 dark:text-white">Triage rules</h2>
                <div className="space-y-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <p>Urgent tickets target a 2 hour first response.</p>
                  <p>High priority tickets target 8 hours.</p>
                  <p>Resolved tickets can still be reopened from the conversation page.</p>
                </div>
              </div>
            </aside>

            <section>
              <div className="mb-4 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      maxLength={255}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') fetchTickets();
                      }}
                      placeholder={formatInputPlaceholder('Search ticket number, subject, email, or customer...', t('common.locale'))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-11 text-sm font-bold text-gray-700 outline-none transition-colors focus:border-paymint-green/50 focus:ring-2 focus:ring-paymint-green/20 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFilters((value) => !value)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
                  >
                    <Filter size={18} />
                    Filters
                  </button>
                  <button
                    onClick={fetchTickets}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-paymint-green px-5 py-3 text-sm font-black text-black transition-opacity hover:opacity-90"
                  >
                    Apply
                  </button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 grid gap-4 border-t border-gray-100 pt-4 dark:border-white/10 md:grid-cols-2">
                        <FilterGroup
                          label="Status"
                          value={statusFilter}
                          options={['all', 'open', 'in_progress', 'resolved', 'closed']}
                          onChange={setStatusFilter}
                        />
                        <FilterGroup
                          label="Priority"
                          value={priorityFilter}
                          options={['all', 'low', 'medium', 'high', 'urgent']}
                          onChange={setPriorityFilter}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {loading ? (
                <SurfaceLoader message="Loading support queue..." paddingClassName="py-16" />
              ) : filteredTickets.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center dark:border-white/10 dark:bg-white/[0.03]">
                  <Inbox className="mx-auto mb-4 h-14 w-14 text-gray-300 dark:text-gray-600" />
                  <h3 className="mb-2 text-lg font-black text-gray-900 dark:text-white">No tickets in this queue</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Try a different queue or clear filters.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 text-sm font-bold text-gray-500 dark:text-gray-400">
                    <span>{filteredTickets.length} ticket{filteredTickets.length === 1 ? '' : 's'}</span>
                    <span>Sorted by reply need, priority, and last update</span>
                  </div>
                  {filteredTickets.map((ticket, index) => (
                    <TicketRow
                      key={ticket.id}
                      ticket={ticket}
                      index={index}
                      onOpen={() => navigate(`/support/admin/${ticket.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

function FilterGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-black uppercase tracking-wider text-gray-400">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
              value === option
                ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15'
            }`}
          >
            {option.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}

function TicketRow({ ticket, index, onOpen }: { ticket: AdminTicket; index: number; onOpen: () => void }) {
  const status = statusConfig[normalizeStatus(ticket.status) as keyof typeof statusConfig] || statusConfig.open;
  const priority = getPriority(ticket);
  const StatusIcon = status.icon;
  const sla = getSlaLabel(ticket);
  const waitingForSupport = needsSupportReply(ticket);

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.025, 0.25) }}
      className={`block w-full rounded-2xl border bg-white p-5 text-left transition-all hover:border-paymint-green/40 hover:shadow-lg hover:shadow-paymint-green/5 dark:bg-white/[0.03] ${
        waitingForSupport
          ? 'border-amber-300 dark:border-amber-500/40'
          : 'border-gray-100 dark:border-white/10'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-black text-gray-400">{ticket.ticketNumber}</span>
            {waitingForSupport && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                <AlertTriangle size={12} />
                Needs reply
              </span>
            )}
            <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black ${status.bg} ${status.color}`}>
              <StatusIcon size={12} />
              {status.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 text-[11px] font-black ${priority.color}`}>
              <span className={`h-2 w-2 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-black ${sla.tone}`}>
              <TimerReset size={12} />
              {sla.label}
            </span>
          </div>

          <h3 className="truncate text-base font-black text-gray-900 dark:text-white">{ticket.subject}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <UserRound size={13} />
              {ticket.requesterName || 'Customer'}
            </span>
            {ticket.requesterEmail && <span>{ticket.requesterEmail}</span>}
            <span className="inline-flex items-center gap-1">
              <Tag size={13} />
              {ticket.category}
            </span>
            <span>{timeAgo(ticket.updatedAt)}</span>
          </div>

          {ticket.lastMessage && (
            <p className="mt-3 line-clamp-2 text-sm font-medium text-gray-600 dark:text-gray-300">
              <span className="font-black">
                {ticket.lastMessage.senderType === 'support' ? 'Support: ' : 'Customer: '}
              </span>
              {ticket.lastMessage.content}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 lg:flex-col lg:items-end">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-gray-100 px-3 py-2 text-xs font-black text-gray-600 dark:bg-white/10 dark:text-gray-300">
            <MessageSquare size={14} />
            {ticket.messageCount}
          </span>
          <ChevronRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-paymint-green" />
        </div>
      </div>
    </motion.button>
  );
}

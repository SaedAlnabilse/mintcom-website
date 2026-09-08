import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  AlertCircle,
  User,
  Headphones,
  Tag,
  Loader2,
  Download,
  Image as ImageIcon,
  XCircle,

  Copy,
  Check,
  Inbox,
  MessageSquare,
  Paperclip,
  X
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../config/api';
import { SurfaceLoader } from '../../components/LoadingState';
import { formatInputPlaceholder } from '../../utils/textCase';
import {
  type Ticket,
  type TicketStatus,
  type TicketMessage,
} from './TicketsPage';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) + ' at ' + d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return iso;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────
export const TicketDetailPage = () => {
  const { t } = useTranslation();
  const { ticketId } = useParams<{ ticketId: string }>();

  const { isAuthenticated, isLoading, account } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [copiedId, setCopiedId] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load ticket from the support API. A 404 means the ticket genuinely does not
  // exist; any other failure is a transient/load error that we surface with a
  // retry rather than substituting unreliable browser-local data.
  const fetchTicket = useCallback(async () => {
    if (!ticketId) return;
    setLoadingDetail(true);
    setNotFound(false);
    setLoadError(false);
    try {
      const res = await api.get(`/api/support/tickets/${ticketId}`);
      const data = res.data;
      // Map API response to local Ticket shape
      const mapped: Ticket = {
        id: data.id,
        subject: data.subject,
        category: data.category,
        status: data.status as TicketStatus,
        priority: data.priority,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        description: data.description,
        messages: (data.messages || []).map((m: Record<string, unknown>) => {
          // Parse attachments from API (stored as JSON)
          const rawAtts = (m.attachments as Array<{ name?: string; url?: string; sizeBytes?: number; type?: string }>) || [];
          const parsedAtts = Array.isArray(rawAtts) ? rawAtts.map((a) => ({
            name: a.name || 'file',
            url: a.url || '',
            size: a.sizeBytes ? (a.sizeBytes > 1024 * 1024 ? `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(a.sizeBytes / 1024)} KB`) : '',
            type: a.type || 'file',
          })) : [];
          return {
            id: m.id as string,
            sender: (m.senderType as string) === 'support' ? 'support' : 'user',
            senderName: m.senderName as string,
            content: m.content as string,
            timestamp: m.createdAt as string,
            attachments: parsedAtts,
          } as TicketMessage;
        }),
        unreadReplies: 0,
      };
      setTicket(mapped);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setNotFound(true);
      } else {
        setLoadError(true);
      }
    } finally {
      setLoadingDetail(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Real-time live updates: background polling every 8s while tab is visible and ticket is open
  useEffect(() => {
    if (!ticketId || !ticket || ticket.status === 'closed') return;

    const interval = setInterval(async () => {
      if (document.hidden) return;
      try {
        const res = await api.get(`/api/support/tickets/${ticketId}`);
        const data = res.data;
        if (data && Array.isArray(data.messages)) {
          setTicket((prev) => {
            if (!prev) return prev;
            if (data.messages.length > prev.messages.length || data.status !== prev.status) {
              const mappedMessages = data.messages.map((m: Record<string, unknown>) => {
                const rawAtts = (m.attachments as Array<{ name?: string; url?: string; sizeBytes?: number; type?: string }>) || [];
                const parsedAtts = Array.isArray(rawAtts) ? rawAtts.map((a) => ({
                  name: a.name || 'file',
                  url: a.url || '',
                  size: a.sizeBytes ? (a.sizeBytes > 1024 * 1024 ? `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(a.sizeBytes / 1024)} KB`) : '',
                  type: a.type || 'file',
                })) : [];
                return {
                  id: m.id as string,
                  sender: (m.senderType as string) === 'support' ? 'support' : 'user',
                  senderName: m.senderName as string,
                  content: m.content as string,
                  timestamp: m.createdAt as string,
                  attachments: parsedAtts,
                } as TicketMessage;
              });
              return {
                ...prev,
                status: data.status as TicketStatus,
                messages: mappedMessages,
                updatedAt: data.updatedAt,
              };
            }
            return prev;
          });
        }
      } catch {
        // Silent background polling catch
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [ticketId, ticket?.status, ticket?.messages.length]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages.length]);

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    const valid = selected.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (replyFiles.length + valid.length > 5) {
      toast.error('Maximum 5 attachments allowed per reply');
      return;
    }

    setReplyFiles((prev) => [...prev, ...valid]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeReplyFile = (index: number) => {
    setReplyFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && replyFiles.length === 0) || !ticket) return;

    setIsSending(true);

    try {
      let uploadedAttachments: Array<{
        name: string;
        url: string;
        storageKey?: string;
        sizeBytes?: number;
        type?: string;
      }> = [];

      if (replyFiles.length > 0) {
        const formData = new FormData();
        replyFiles.forEach((file) => formData.append('files', file));

        const uploadRes = await api.post('/api/support/tickets/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        uploadedAttachments = uploadRes.data?.attachments || [];
      }

      // Send via API
      const res = await api.post(`/api/support/tickets/${ticket.id}/messages`, {
        content: newMessage.trim() || undefined,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined,
      });

      const apiMessage = res.data.message;
      const rawAtts = (apiMessage.attachments as Array<{ name?: string; url?: string; sizeBytes?: number; type?: string }>) || [];
      const parsedAtts = Array.isArray(rawAtts) ? rawAtts.map((a) => ({
        name: a.name || 'file',
        url: a.url || '',
        size: a.sizeBytes ? (a.sizeBytes > 1024 * 1024 ? `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(a.sizeBytes / 1024)} KB`) : '',
        type: a.type || 'file',
      })) : [];

      const msg: TicketMessage = {
        id: apiMessage.id,
        sender: 'user',
        senderName: apiMessage.senderName || (account?.firstName ? `${account.firstName} ${account.lastName || ''}`.trim() : 'You'),
        content: apiMessage.content,
        timestamp: apiMessage.createdAt,
        attachments: parsedAtts,
      };

      const updated: Ticket = {
        ...ticket,
        messages: [...ticket.messages, msg],
        updatedAt: new Date().toISOString(),
        status: ticket.status === 'resolved' || ticket.status === 'closed' ? 'open' : ticket.status,
      };

      setTicket(updated);
      setNewMessage('');
      setReplyFiles([]);
      toast.success(t('support.tickets.replySent', { defaultValue: 'Reply sent' }));
    } catch {
      // The reply did NOT reach support. Never report success or silently store
      // it in the browser — keep the draft in the box so the user can retry.
      toast.error(
        t('support.tickets.replyError', {
          defaultValue: "Your reply couldn't be sent. Please try again.",
        })
      );
    } finally {
      setIsSending(false);
    }
  };



  const handleCopyId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Users can only mark as resolved or reopen — not change to other statuses
  const handleChangeStatus = async (newStatus: TicketStatus) => {
    if (!ticket) return;
    try {
      await api.patch(`/api/support/tickets/${ticket.id}/status`, {
        status: newStatus.toUpperCase(),
      });
    } catch {
      // Only reflect the change locally once the server has confirmed it.
      toast.error(
        t('support.tickets.statusError', {
          defaultValue: "Couldn't update the ticket. Please try again.",
        })
      );
      return;
    }
    const updated = { ...ticket, status: newStatus, updatedAt: new Date().toISOString() };
    setTicket(updated);
    toast.success(
      newStatus === 'resolved'
        ? t('support.tickets.markResolved')
        : t('support.tickets.reopened', { defaultValue: 'Ticket reopened' })
    );
  };

  // ─── Status configs ──────────────────────────────────────────────────────
  const statusConfig: Record<TicketStatus, { label: string; color: string; bg: string; icon: React.ElementType; dotColor: string }> = {
    open: { label: t('support.tickets.status.open'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15', icon: AlertCircle, dotColor: 'bg-blue-500' },
    in_progress: { label: t('support.tickets.status.inProgress'), color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/15', icon: Loader2, dotColor: 'bg-amber-500' },
    resolved: { label: t('support.tickets.status.resolved'), color: 'text-mintcom-green dark:text-mintcom-green', bg: 'bg-mintcom-green/10 dark:bg-mintcom-green/', icon: CheckCircle2, dotColor: 'bg-mintcom-green' },
    closed: { label: t('support.tickets.status.closed'), color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/15', icon: XCircle, dotColor: 'bg-gray-400' },
  };

  const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
    low: { label: t('support.tickets.priority.low'), color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-500/15' },
    medium: { label: t('support.tickets.priority.medium'), color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/15' },
    high: { label: t('support.tickets.priority.high'), color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/15' },
    urgent: { label: t('support.tickets.priority.urgent'), color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/15' },
  };

  // ─── Auth guard ────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="w-full px-6 md:px-10 lg:px-16">
            <SurfaceLoader message={t('common.loading')} className="max-w-4xl mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `/support/tickets/${ticketId}` }} />;
  }

  // ─── Loading ticket ────────────────────────────────────────────────────────
  if (loadingDetail) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="w-full px-6 md:px-10 lg:px-16">
            <SurfaceLoader
              message={t('support.tickets.loadingDetail', { defaultValue: 'Loading ticket...' })}
              className="max-w-4xl mx-auto"
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Load error (transient) ──────────────────────────────────────────────────
  if (loadError && !ticket) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="w-full px-6 md:px-10 lg:px-16">
            <div className="max-w-4xl mx-auto rounded-3xl border border-red-100 bg-white dark:border-red-500/20 dark:bg-white/[0.03] p-16 text-center">
              <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={36} className="text-red-500" />
              </div>
              <h3 className="font-barlow text-xl font-bold mb-2">
                {t('support.tickets.loadErrorTitle', { defaultValue: "Couldn't load this ticket" })}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                {t('support.tickets.loadErrorDesc', {
                  defaultValue:
                    'We were unable to reach the support service. Please check your connection and try again.',
                })}
              </p>
              <button
                onClick={() => fetchTicket()}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mintcom-green font-bold text-black shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all hover:shadow-[0_8px_24px_-6px_rgba(124,195,159,0.6)]"
              >
                <Loader2 size={18} />
                {t('common.retry', { defaultValue: 'Try again' })}
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ─── Not found ─────────────────────────────────────────────────────────────
  if (notFound || !ticket) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="w-full px-6 md:px-10 lg:px-16">
            <div className="max-w-4xl mx-auto rounded-3xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Inbox size={36} className="text-gray-400" />
              </div>
              <h3 className="font-barlow text-xl font-bold mb-2">{t('support.tickets.notFound')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">
                Ticket <span className="font-mono font-bold">{ticketId}</span> was not found.
              </p>
              <Link
                to="/support/tickets"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mintcom-green font-bold text-black shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all hover:shadow-[0_8px_24px_-6px_rgba(124,195,159,0.6)]"
              >
                <ArrowLeft size={18} />
                Back to Tickets
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
  const StatusIcon = status.icon;
  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="w-full px-6 md:px-10 lg:px-16">
          {/* ──── Header ──── */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Link
                to="/support/tickets"
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <button
                onClick={handleCopyId}
                className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors font-mono"
              >
                {ticket.id}
                {copiedId ? <Check size={14} className="text-mintcom-green" /> : <Copy size={14} />}
              </button>
            </div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="font-magilio text-2xl md:text-3xl font-black tracking-tight mb-3">
                  {ticket.subject}
                </h1>
                <div className="flex flex-wrap items-center gap-2">
                  {/* Status badge */}
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${status.bg} ${status.color}`}>
                    <StatusIcon size={14} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                    {status.label}
                  </span>
                  {/* Priority badge */}
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${priority.bg} ${priority.color}`}>
                    {priority.label} {t('support.tickets.priorityLabel')}
                  </span>
                  {/* Category */}
                  <span className="flex items-center gap-1 text-sm font-medium text-gray-500 capitalize">
                    <Tag size={14} />
                    {ticket.category}
                  </span>
                </div>
              </div>

              {/* Status change is admin-only — customers use "Mark as Resolved" below */}
            </div>
          </div>

          {/* ──── Info card ──── */}
          <div className="rounded-3xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('support.tickets.created')}</p>
                <p className="font-bold text-sm">{formatTimestamp(ticket.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('support.tickets.lastUpdated')}</p>
                <p className="font-bold text-sm">{formatTimestamp(ticket.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('common.category')}</p>
                <p className="font-bold text-sm capitalize">{ticket.category}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Messages</p>
                <p className="font-bold text-sm flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-gray-400" />
                  {ticket.messages.length}
                </p>
              </div>
            </div>
          </div>

          {/* ──── Conversation ──── */}
          <div className="rounded-3xl border border-gray-100 bg-white dark:border-white/10 dark:bg-white/[0.03] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <h2 className="font-barlow font-bold flex items-center gap-2">
                <MessageSquare size={18} className="text-gray-400" />
                {t('support.tickets.conversation')}
              </h2>
              <span className="text-xs font-bold text-gray-400">
                {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Messages list */}
            <div className="p-6 space-y-5 max-h-[600px] overflow-y-auto">
              {ticket.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.08, 0.5) }}
                  className="flex gap-3 md:gap-4"
                >
                  {/* Avatar */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === 'user'
                      ? 'bg-gray-200 dark:bg-white/10'
                      : 'bg-mintcom-green/20'
                      }`}
                  >
                    {message.sender === 'user' ? (
                      <User size={18} className="text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Headphones size={18} className="text-mintcom-green" />
                    )}
                  </div>

                  {/* Bubble */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-bold text-sm">
                        {message.sender === 'support'
                          ? message.senderName.replace(/\\s*\\(Mintcom Support\\)\\s*$/i, '')
                          : message.senderName}
                      </span>
                      <span className="text-xs text-gray-400">{formatTimestamp(message.timestamp)}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl ${message.sender === 'user'
                        ? 'bg-gray-50 dark:bg-white/5'
                        : 'bg-mintcom-green/5 border border-mintcom-green/10'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10">
                          <p className="text-xs font-bold text-gray-400 mb-2">{t('support.tickets.attachments')}</p>
                          <div className="flex flex-wrap gap-2">
                            {message.attachments.map((att, i) => {
                              const isImage = att.type === 'image' || att.type?.startsWith('image/');
                              const fileUrl = att.url || '#';
                              return (
                                <a
                                  key={i}
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={!isImage ? att.name : undefined}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium hover:border-mintcom-green/30 transition-colors"
                                >
                                  {isImage ? <ImageIcon size={14} /> : <Download size={14} />}
                                  <span className="truncate max-w-[150px]">{att.name}</span>
                                  {att.size && <span className="text-gray-400">({att.size})</span>}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* ──── Reply form ──── */}
            <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              {isClosed ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                    This ticket is <span className="font-bold">{status.label.toLowerCase()}</span>. Want to reopen it?
                  </p>
                  <button
                    onClick={() => handleChangeStatus('open')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-mintcom-green font-bold text-black shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all hover:shadow-[0_8px_24px_-6px_rgba(124,195,159,0.6)] text-sm"
                  >
                    Reopen Ticket
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendMessage}>
                  <div className="mb-4">
                    <textarea maxLength={2000}
                      ref={textareaRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={formatInputPlaceholder(t('support.tickets.replyPlaceholder'), t('common.locale'))}
                      rows={4}
                      className="w-full p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-400 mt-1.5">{t('support.tickets.sendShortcutHint')}</p>
                  </div>

                  {/* Attachment chips */}
                  {replyFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {replyFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-xs font-medium text-gray-700 dark:text-gray-300"
                        >
                          <Paperclip size={13} className="text-gray-400" />
                          <span className="max-w-[150px] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeReplyFile(idx)}
                            className="hover:text-red-500 transition-colors ml-1 p-0.5 rounded"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
                        title="Attach files (max 5, 10MB each)"
                      >
                        <Paperclip size={15} />
                        <span>{t('support.tickets.attach', { defaultValue: 'Attach File' })}</span>
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={(!newMessage.trim() && replyFiles.length === 0) || isSending}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mintcom-green font-bold text-black shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all hover:shadow-[0_8px_24px_-6px_rgba(124,195,159,0.6)] disabled:opacity-50 shadow-lg shadow-mintcom-green/20"
                    >
                      {isSending ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                      {t('support.tickets.sendReply')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* ──── Resolve hint ──── */}
          {!isClosed && ticket.messages.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl"
            >
              <p className="text-sm text-blue-700 dark:text-blue-400">
                <span className="font-bold">{t('support.tickets.resolvedQuestion')}</span>{' '}
                <button
                  onClick={() => handleChangeStatus('resolved')}
                  className="underline hover:no-underline font-bold"
                >
                  {t('support.tickets.markResolved')}
                </button>
              </p>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

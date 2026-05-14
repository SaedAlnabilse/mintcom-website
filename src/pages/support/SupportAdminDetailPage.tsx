import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Send,
    CheckCircle2,
    Inbox,
    Clock,
    XCircle,
    User,
    Headphones,
    Loader2,
    ChevronDown,
    Copy,
    Check,
    Shield,
    Tag,
    Mail,
    MessageSquare,
    Download,
    Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import api from '../../config/api';
import toast from 'react-hot-toast';
import { FullScreenLoader, SectionLoader } from '../../components/LoadingState';
import { formatInputPlaceholder } from '../../utils/textCase';
import { isSupportAdminEmail } from '../../config/support';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    senderType: string;
    senderName: string;
    senderEmail: string | null;
    content: string;
    createdAt: string;
    attachments?: { name: string; url?: string; sizeBytes?: number; type?: string }[];
}

interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    requesterName: string | null;
    requesterEmail: string | null;
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
    closedAt: string | null;
    messages: Message[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof Inbox }> = {
    open: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: Inbox },
    in_progress: { label: 'In Progress', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: Clock },
    resolved: { label: 'Resolved', color: 'text-paymint-green', bg: 'bg-paymint-green/10 dark:bg-paymint-green/', icon: CheckCircle2 },
    closed: { label: 'Closed', color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-gray-800', icon: XCircle },
};

const priorityConfig: Record<string, { label: string; dot: string }> = {
    low: { label: 'Low', dot: 'bg-gray-400' },
    medium: { label: 'Medium', dot: 'bg-blue-500' },
    high: { label: 'High', dot: 'bg-orange-500' },
    urgent: { label: 'Urgent', dot: 'bg-red-500' },
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// ─── Component ───────────────────────────────────────────────────────────────

export const SupportAdminDetailPage = () => {
    const { t } = useTranslation();
    const { ticketId } = useParams<{ ticketId: string }>();
    const { isAuthenticated, isLoading: authLoading, account } = useAuth();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [sending, setSending] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);
    const [copied, setCopied] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isSupportTeam = isSupportAdminEmail(account?.email);

    // Fetch ticket data
    const fetchTicket = useCallback(async () => {
        if (!ticketId) return;
        try {
            const res = await api.get(`/api/support/admin/tickets/${ticketId}`);
            setTicket(res.data);
        } catch {
            setNotFound(true);
        } finally {
            setLoading(false);
        }
    }, [ticketId]);

    useEffect(() => {
        if (isAuthenticated && isSupportTeam) {
            fetchTicket();
        }
    }, [isAuthenticated, isSupportTeam, fetchTicket]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (ticket?.messages) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [ticket?.messages]);

    // Send reply
    const handleSendReply = async () => {
        if (!replyText.trim() || !ticket) return;
        setSending(true);
        try {
            const res = await api.post(`/api/support/admin/tickets/${ticket.id}/messages`, {
                content: replyText.trim(),
            });
            // Add the new message to the conversation
            setTicket((prev) =>
                prev
                    ? {
                        ...prev,
                        messages: [...prev.messages, res.data.message],
                        status: prev.status === 'open' ? 'in_progress' : prev.status,
                    }
                    : prev,
            );
            setReplyText('');
            toast.success('Reply sent! Customer has been notified by email.');
        } catch {
            toast.error('Failed to send reply');
        } finally {
            setSending(false);
        }
    };

    // Change status
    const handleChangeStatus = async (newStatus: string) => {
        if (!ticket) return;
        setShowStatusMenu(false);
        try {
            await api.patch(`/api/support/admin/tickets/${ticket.id}/status`, {
                status: newStatus.toUpperCase(),
            });
            setTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
            toast.success(`Status changed to ${statusConfig[newStatus]?.label || newStatus}`);
        } catch {
            toast.error('Failed to change status');
        }
    };

    // Copy ticket number
    const handleCopy = () => {
        if (!ticket) return;
        navigator.clipboard.writeText(ticket.ticketNumber);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // ─── Guards ──────────────────────────────────────────────────────────────────

    if (authLoading) {
        return <FullScreenLoader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: `/support/admin/${ticketId}` }} replace />;
    }

    if (!isSupportTeam) {
        return <Navigate to="/support" replace />;
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <SectionLoader
                    message={t('support.admin.loading', { defaultValue: 'Loading ticket...' })}
                    className="bg-gray-50 dark:bg-[#0a0a0a] pt-24"
                    minHeightClassName="min-h-screen"
                />
            </>
        );
    }

    if (notFound || !ticket) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] pt-24">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ticket Not Found</h1>
                        <Link to="/support/admin" className="text-paymint-green font-bold hover:underline">
                            ← Back to Admin Portal
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const currentStatus = statusConfig[ticket.status] || statusConfig.open;
    const currentPriority = priorityConfig[ticket.priority] || priorityConfig.medium;
    const StatusIcon = currentStatus.icon;

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] pt-28 pb-16">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">

                    {/* ── Back + Header ──────────────────────────────────────────── */}
                    <Link
                        to="/support/admin"
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-paymint-green transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Admin Portal
                    </Link>

                    {/* ── Ticket Info Card ────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl p-5 mb-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <button
                                        onClick={handleCopy}
                                        className="text-xs font-mono font-bold text-gray-400 hover:text-paymint-green flex items-center gap-1 transition-colors"
                                    >
                                        {ticket.ticketNumber}
                                        {copied ? <Check className="w-3 h-3 text-paymint-green" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${currentStatus.bg} ${currentStatus.color}`}>
                                        <StatusIcon className="w-3 h-3" />
                                        {currentStatus.label}
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold">
                                        <span className={`w-2 h-2 rounded-full ${currentPriority.dot}`} />
                                        {currentPriority.label}
                                    </span>
                                </div>
                                <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{ticket.subject}</h1>
                                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{ticket.category}</span>
                                    <span>•</span>
                                    <span>{formatDate(ticket.createdAt)}</span>
                                </div>
                            </div>

                            {/* Status changer */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/10 rounded-xl hover:bg-gray-200 dark:hover:bg-white/15 transition-all"
                                >
                                    Change Status
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                <AnimatePresence>
                                    {showStatusMenu && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-10 py-1 w-44"
                                        >
                                            {(['open', 'in_progress', 'resolved', 'closed'] as const).map((s) => {
                                                const cfg = statusConfig[s];
                                                return (
                                                    <button
                                                        key={s}
                                                        onClick={() => handleChangeStatus(s)}
                                                        disabled={ticket.status === s}
                                                        className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${ticket.status === s
                                                            ? 'bg-gray-50 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                                                            : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        <cfg.icon className={`w-3 h-3 ${cfg.color}`} />
                                                        {cfg.label}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Requester Info */}
                        <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-xs">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white">{ticket.requesterName || 'Customer'}</p>
                                {ticket.requesterEmail && (
                                    <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Mail className="w-3 h-3" />{ticket.requesterEmail}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Messages ───────────────────────────────────────────────── */}
                    <div className="bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                                Conversation ({ticket.messages.length} messages)
                            </h2>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
                            {ticket.messages.map((msg) => {
                                const isSupport = msg.senderType === 'support';
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`flex gap-3 ${isSupport ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isSupport
                                            ? 'bg-paymint-green/10'
                                            : 'bg-blue-50 dark:bg-blue-900/20'
                                            }`}>
                                            {isSupport ? (
                                                <Headphones className="w-4 h-4 text-paymint-green" />
                                            ) : (
                                                <User className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                        <div className={`flex-1 max-w-[80%] ${isSupport ? 'text-right' : ''}`}>
                                            <div className={`inline-block text-left rounded-xl p-3 ${isSupport
                                                ? 'bg-paymint-green/10 dark:bg-paymint-green/5 border border-paymint-green/20'
                                                : 'bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5'
                                                }`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-xs font-bold ${isSupport ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>
                                                        {msg.senderName}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">{formatDate(msg.createdAt)}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{msg.content}</p>
                                                {/* Attachments */}
                                                {msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                                                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10">
                                                        <p className="text-[10px] font-bold text-gray-400 mb-1">Attachments</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {msg.attachments.map((att, i) => {
                                                                const isImage = att.type?.startsWith('image/');
                                                                const fileUrl = att.url || '#';
                                                                const sizeStr = att.sizeBytes ? (att.sizeBytes > 1024 * 1024 ? `${(att.sizeBytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(att.sizeBytes / 1024)} KB`) : '';
                                                                return (
                                                                    <a
                                                                        key={i}
                                                                        href={fileUrl}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        download={!isImage ? att.name : undefined}
                                                                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-medium hover:border-paymint-green/30 transition-colors"
                                                                    >
                                                                        {isImage ? <ImageIcon size={12} /> : <Download size={12} />}
                                                                        <span className="truncate max-w-[120px]">{att.name}</span>
                                                                        {sizeStr && <span className="text-gray-400">({sizeStr})</span>}
                                                                    </a>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Reply box */}
                        {ticket.status !== 'closed' ? (
                            <div className="border-t border-gray-100 dark:border-white/5 p-4">
                                <div className="flex items-center gap-2 mb-3 text-xs text-paymint-green font-bold">
                                    <Shield className="w-3 h-3" />
                                    Replying as Paymint Support
                                </div>
                                <div className="flex gap-3">
                                    <textarea maxLength={2000}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder={formatInputPlaceholder("Type your support reply...", t('common.locale'))}
                                        rows={3}
                                        className="flex-1 resize-none bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/30"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                                handleSendReply();
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={!replyText.trim() || sending}
                                        className="self-end px-4 py-3 bg-paymint-green text-black font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Send
                                    </button>
                                </div>
                                <p className="mt-2 text-[10px] text-gray-400">Ctrl+Enter to send. Customer will be notified by email.</p>
                            </div>
                        ) : (
                            <div className="border-t border-gray-100 dark:border-white/5 p-4 text-center">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    This ticket is closed.{' '}
                                    <button
                                        onClick={() => handleChangeStatus('open')}
                                        className="text-paymint-green font-bold hover:underline"
                                    >
                                        Reopen it
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};


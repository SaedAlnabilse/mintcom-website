import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Send,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  User,
  Headphones,
  MoreVertical,
  Tag,
  Loader2,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: { name: string; size: string; type: string }[];
}

export const TicketDetailPage = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { ticketId: _ticketId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Mock ticket data
  const mockTicket = {
    id: 'TKT-001',
    subject: t('support.tickets.mock.subject1'),
    category: t('support.categories.technical'),
    status: 'in_progress' as 'open' | 'in_progress' | 'resolved' | 'closed',
    priority: 'high' as const,
    createdAt: '2025-02-08 at 10:30 AM',
    updatedAt: '2025-02-09 at 2:15 PM',
    description: t('support.tickets.mock.desc1'),
    messages: [
      {
        id: '1',
        sender: 'user' as const,
        senderName: t('support.tickets.you'),
        content: t('support.tickets.mock.desc1'),
        timestamp: 'Feb 8, 2025 at 10:30 AM',
        attachments: [
          { name: 'bluetooth_error.png', size: '245 KB', type: 'image' }
        ]
      },
      {
        id: '2',
        sender: 'support' as const,
        senderName: t('support.tickets.sarah'),
        content: t('support.tickets.mock.reply1'),
        timestamp: 'Feb 8, 2025 at 11:45 AM'
      },
      {
        id: '3',
        sender: 'user' as const,
        senderName: t('support.tickets.you'),
        content: t('support.tickets.mock.reply2'),
        timestamp: 'Feb 8, 2025 at 3:20 PM'
      },
      {
        id: '4',
        sender: 'support' as const,
        senderName: t('support.tickets.sarah'),
        content: t('support.tickets.mock.reply3'),
        timestamp: 'Feb 9, 2025 at 2:15 PM'
      }
    ] as Message[]
  };

  const statusConfig = {
    open: { label: t('support.tickets.status.open'), color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: AlertCircle },
    in_progress: { label: t('support.tickets.status.inProgress'), color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: Loader2 },
    resolved: { label: t('support.tickets.status.resolved'), color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', icon: CheckCircle2 },
    closed: { label: t('support.tickets.status.closed'), color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-500/20', icon: CheckCircle2 }
  };

  const priorityConfig = {
    low: { label: t('support.tickets.priority.low'), color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-500/20' },
    medium: { label: t('support.tickets.priority.medium'), color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20' },
    high: { label: t('support.tickets.priority.high'), color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-500/20' },
    urgent: { label: t('support.tickets.priority.urgent'), color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20' }
  };

  const ticket = mockTicket; // In real app, fetch based on ticketId
  const status = statusConfig[ticket.status];
  const priority = priorityConfig[ticket.priority];
  const StatusIcon = status.icon;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSending(false);
    setNewMessage('');
    // In real app, add message to list and refresh
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <Link
                  to="/support/tickets"
                  className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </Link>
                <span className="text-sm font-bold text-gray-400">{ticket.id}</span>
              </div>

              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                    {ticket.subject}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold ${status.bg} ${status.color}`}>
                      <StatusIcon size={14} className={ticket.status === 'in_progress' ? 'animate-spin' : ''} />
                      {status.label}
                    </span>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${priority.bg} ${priority.color}`}>
                      {priority.label} {t('support.tickets.priorityLabel')}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-medium text-gray-500">
                      <Tag size={14} />
                      {ticket.category}
                    </span>
                  </div>
                </div>

                <button className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Ticket Info Card */}
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('support.tickets.created')}</p>
                  <p className="font-bold text-sm">{ticket.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('support.tickets.lastUpdated')}</p>
                  <p className="font-bold text-sm">{ticket.updatedAt}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('common.category')}</p>
                  <p className="font-bold text-sm">{ticket.category}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('support.tickets.id')}</p>
                  <p className="font-bold text-sm font-mono">{ticket.id}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden">
              {/* Messages Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h2 className="font-bold">{t('support.tickets.conversation')}</h2>
              </div>

              {/* Messages List */}
              <div className="p-6 space-y-6 max-h-[500px] overflow-y-auto">
                {ticket.messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex gap-4 ${message.sender === 'user' ? '' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user'
                        ? 'bg-gray-200 dark:bg-white/10'
                        : 'bg-paymint-green/20'
                    }`}>
                      {message.sender === 'user' ? (
                        <User size={18} className="text-gray-600 dark:text-gray-400" />
                      ) : (
                        <Headphones size={18} className="text-paymint-green" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold">{message.senderName}</span>
                        <span className="text-xs text-gray-400">{message.timestamp}</span>
                      </div>

                      <div className={`p-4 rounded-2xl ${
                        message.sender === 'user'
                          ? 'bg-gray-50 dark:bg-white/5'
                          : 'bg-paymint-green/5 border border-paymint-green/10'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                            <p className="text-xs font-bold text-gray-400 mb-2">{t('support.tickets.attachments')}</p>
                            <div className="flex flex-wrap gap-2">
                              {message.attachments.map((attachment, i) => (
                                <a
                                  key={i}
                                  href="#"
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-medium hover:border-paymint-green/30 transition-colors"
                                >
                                  {attachment.type === 'image' ? <ImageIcon size={14} /> : <Download size={14} />}
                                  <span>{attachment.name}</span>
                                  <span className="text-gray-400">({attachment.size})</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Reply Form */}
              <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]">
                <form onSubmit={handleSendMessage}>
                  <div className="mb-4">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={t('support.tickets.replyPlaceholder')}
                      rows={4}
                      className="w-full p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
                    >
                      <Paperclip size={18} />
                      {t('support.tickets.attachFile')}
                    </button>

                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50"
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
              </div>
            </div>

            {/* Quick Actions */}
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <span className="font-bold">{t('support.tickets.resolvedQuestion')}</span>{' '}
                  <button className="underline hover:no-underline">{t('support.tickets.markResolved')}</button> {t('support.tickets.toClose')}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

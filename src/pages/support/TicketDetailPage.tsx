import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

interface Message {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: { name: string; size: string; type: string }[];
}

// Mock ticket data
const mockTicket = {
  id: 'TKT-001',
  subject: 'Receipt printer not connecting via Bluetooth',
  category: 'Technical',
  status: 'in_progress' as 'open' | 'in_progress' | 'resolved' | 'closed',
  priority: 'high' as const,
  createdAt: '2025-02-08 at 10:30 AM',
  updatedAt: '2025-02-09 at 2:15 PM',
  description: 'I recently purchased a Munbyn thermal printer and I\'m having trouble connecting it to my Samsung tablet via Bluetooth. The printer shows up in my Bluetooth settings but when I try to pair it, it fails after a few seconds. I\'ve tried restarting both devices multiple times.',
  messages: [
    {
      id: '1',
      sender: 'user' as const,
      senderName: 'You',
      content: 'I recently purchased a Munbyn thermal printer and I\'m having trouble connecting it to my Samsung tablet via Bluetooth. The printer shows up in my Bluetooth settings but when I try to pair it, it fails after a few seconds. I\'ve tried restarting both devices multiple times.',
      timestamp: 'Feb 8, 2025 at 10:30 AM',
      attachments: [
        { name: 'bluetooth_error.png', size: '245 KB', type: 'image' }
      ]
    },
    {
      id: '2',
      sender: 'support' as const,
      senderName: 'Sarah from Support',
      content: 'Hi there! Thank you for reaching out. I understand how frustrating connection issues can be. Let me help you troubleshoot this.\n\nFirst, could you try the following:\n1. Turn off Bluetooth on your tablet\n2. Power off the printer completely\n3. Wait 30 seconds\n4. Turn on the printer first, then enable Bluetooth on your tablet\n5. Try pairing again\n\nAlso, can you confirm which Paymint app version you\'re using? You can find this in Settings > About.',
      timestamp: 'Feb 8, 2025 at 11:45 AM'
    },
    {
      id: '3',
      sender: 'user' as const,
      senderName: 'You',
      content: 'I tried those steps but still getting the same error. I\'m using Paymint version 2.4.1. The printer model is Munbyn ITPP047.',
      timestamp: 'Feb 8, 2025 at 3:20 PM'
    },
    {
      id: '4',
      sender: 'support' as const,
      senderName: 'Sarah from Support',
      content: 'Thank you for that information! The ITPP047 model sometimes requires a specific pairing sequence. Our team is looking into this and we\'ll get back to you with a solution shortly. In the meantime, could you check if there\'s a firmware update available for your printer?',
      timestamp: 'Feb 9, 2025 at 2:15 PM'
    }
  ] as Message[]
};

const statusConfig = {
  open: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: Loader2 },
  resolved: { label: 'Resolved', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-500/20', icon: CheckCircle2 }
};

const priorityConfig = {
  low: { label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-500/20' },
  medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20' },
  high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-500/20' },
  urgent: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-500/20' }
};

export const TicketDetailPage = () => {
  const { ticketId: _ticketId } = useParams();
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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
                      {priority.label} Priority
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
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Created</p>
                  <p className="font-bold text-sm">{ticket.createdAt}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Last Updated</p>
                  <p className="font-bold text-sm">{ticket.updatedAt}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Category</p>
                  <p className="font-bold text-sm">{ticket.category}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ticket ID</p>
                  <p className="font-bold text-sm font-mono">{ticket.id}</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden">
              {/* Messages Header */}
              <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
                <h2 className="font-bold">Conversation</h2>
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
                            <p className="text-xs font-bold text-gray-400 mb-2">Attachments</p>
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
                      placeholder="Type your reply..."
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
                      Attach file
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
                      Send Reply
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Quick Actions */}
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <span className="font-bold">Issue resolved?</span>{' '}
                  <button className="underline hover:no-underline">Mark this ticket as resolved</button> to close it.
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

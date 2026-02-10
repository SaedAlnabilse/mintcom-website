import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  User,
  Building2,
  CreditCard,
  Ticket,
  Bell,
  ChevronRight,
  ArrowRight,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  BookOpen,
  Shield,
  Smartphone
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

// Mock user data
const mockUser = {
  name: 'John Doe',
  email: 'john@acmecafe.com',
  avatar: null,
  plan: 'Pro',
  planStatus: 'active',
  memberSince: 'January 2024',
  establishments: 3,
  employees: 12
};

const mockAnnouncements = [
  {
    id: 1,
    title: 'New Feature: Dark Mode for POS App',
    description: 'We\'ve added dark mode to the POS tablet app based on your feedback!',
    date: 'Feb 8, 2025',
    type: 'feature'
  },
  {
    id: 2,
    title: 'Scheduled Maintenance: Feb 15',
    description: 'Brief maintenance window from 2-4 AM EST. Service may be intermittent.',
    date: 'Feb 5, 2025',
    type: 'maintenance'
  },
  {
    id: 3,
    title: 'Pro Plan Price Update',
    description: 'Starting March 1st, Pro plan pricing will be updated. Existing customers locked in.',
    date: 'Feb 1, 2025',
    type: 'billing'
  }
];

const mockTickets = [
  {
    id: 'TKT-001',
    subject: 'Receipt printer not connecting',
    status: 'in_progress',
    updatedAt: '2 hours ago'
  },
  {
    id: 'TKT-002',
    subject: 'Question about upgrading plan',
    status: 'open',
    updatedAt: '1 day ago'
  }
];

export const PortalPage = () => {
  const { t } = useTranslation();
  const [user] = useState(mockUser);
  const [announcements] = useState(mockAnnouncements);
  const [tickets] = useState(mockTickets);

  const quickActions = [
    { label: t('portal.quickActions.downloadInvoice'), icon: Download, href: '#' },
    { label: t('portal.quickActions.updatePayment'), icon: CreditCard, href: '#' },
    { label: t('portal.quickActions.manageTeam'), icon: User, href: '/owner/employees' },
    { label: t('portal.quickActions.securitySettings'), icon: Shield, href: '#' }
  ];

  const resources = [
    { label: t('portal.resources.helpCenter'), icon: HelpCircle, href: '/support', description: t('portal.resources.helpCenterDesc') },
    { label: t('portal.resources.community'), icon: MessageSquare, href: '/community', description: t('portal.resources.communityDesc') },
    { label: t('portal.resources.featureIdeas'), icon: Lightbulb, href: '/community/ideas', description: t('portal.resources.featureIdeasDesc') },
    { label: t('portal.resources.guides'), icon: BookOpen, href: '/community/guides', description: t('portal.resources.guidesDesc') }
  ];

  const statusConfig = {
    open: { label: t('portal.status.open'), color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-500/20', icon: AlertCircle },
    in_progress: { label: t('portal.status.inProgress'), color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-500/20', icon: Loader2 },
    resolved: { label: t('portal.status.resolved'), color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-500/20', icon: CheckCircle2 }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          {/* Header */}
          <div className="mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-paymint-green/20 rounded-2xl flex items-center justify-center">
                  <User size={32} className="text-paymint-green" />
                </div>
                <div>
                  <h1 className="text-3xl font-black tracking-tight">{t('portal.welcomeUser', { name: user.name.split(' ')[0] })}</h1>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
                    {user.email} · {user.plan} {t('portal.overview.plan')}
                  </p>
                </div>
              </div>

              <Link
                to="/owner"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl font-bold hover:opacity-90 transition-all"
              >
                <Building2 size={18} />
                {t('portal.goToDashboard')}
              </Link>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Account Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-white/10">
                  <h2 className="text-lg font-bold">{t('portal.overview.title')}</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('portal.overview.plan')}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black">{user.plan}</span>
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-500/20 text-green-600 rounded text-xs font-bold">{t('common.active')}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('portal.overview.establishments')}</p>
                      <p className="text-xl font-black">{user.establishments}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('portal.overview.teamMembers')}</p>
                      <p className="text-xl font-black">{user.employees}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{t('portal.overview.memberSince')}</p>
                      <p className="text-xl font-black">{user.memberSince}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/10">
                    <div className="flex flex-wrap gap-3">
                      {quickActions.map((action) => (
                        <a
                          key={action.label}
                          href={action.href}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                        >
                          <action.icon size={16} />
                          {action.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

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
                  {tickets.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Ticket size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-500">{t('portal.recentTickets.noTickets')}</p>
                    </div>
                  ) : (
                    tickets.map((ticket) => {
                      const status = statusConfig[ticket.status as keyof typeof statusConfig];
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
                                <span>{ticket.updatedAt}</span>
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

              {/* Announcements */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className="text-paymint-green" />
                    <h2 className="text-lg font-bold">{t('portal.announcements.title')}</h2>
                  </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/10">
                  {announcements.map((announcement) => (
                    <div key={announcement.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          announcement.type === 'feature' ? 'bg-paymint-green/20 text-paymint-green' :
                          announcement.type === 'maintenance' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600' :
                          'bg-blue-100 dark:bg-blue-500/20 text-blue-600'
                        }`}>
                          {announcement.type === 'feature' ? <TrendingUp size={18} /> :
                           announcement.type === 'maintenance' ? <Clock size={18} /> :
                           <CreditCard size={18} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold mb-1">{announcement.title}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            {announcement.description}
                          </p>
                          <span className="text-xs font-medium text-gray-400">{announcement.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Subscription Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white/10 dark:to-white/5 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold">{t('portal.plan.title')}</h3>
                  <span className="px-2 py-1 bg-paymint-green text-black rounded-md text-xs font-bold">
                    {user.plan}
                  </span>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('portal.plan.nextBilling')}</span>
                    <span className="font-bold">Mar 1, 2025</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('portal.plan.amount')}</span>
                    <span className="font-bold">$49/month</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    to="/owner/billing"
                    className="block w-full py-3 bg-white text-black rounded-xl font-bold text-center text-sm hover:opacity-90 transition-all"
                  >
                    {t('portal.plan.manage')}
                  </Link>
                  <button className="w-full py-3 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all">
                    {t('portal.plan.upgrade')}
                  </button>
                </div>
              </motion.div>

              {/* Resources */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6"
              >
                <h3 className="font-bold mb-4">{t('portal.resources.title')}</h3>
                <div className="space-y-3">
                  {resources.map((resource) => (
                    <Link
                      key={resource.label}
                      to={resource.href}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-paymint-green/10 rounded-lg flex items-center justify-center">
                        <resource.icon size={18} className="text-paymint-green" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm group-hover:text-paymint-green transition-colors">
                          {resource.label}
                        </p>
                        <p className="text-xs text-gray-500">{resource.description}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Mobile App */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-br from-paymint-green/20 to-blue-500/10 border border-paymint-green/20 rounded-2xl p-6"
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

      <Footer />
    </div>
  );
};


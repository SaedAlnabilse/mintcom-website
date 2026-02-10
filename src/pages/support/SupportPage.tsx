import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Search,
  Ticket,
  BookOpen,
  MessageCircle,
  HelpCircle,
  CreditCard,
  Settings,
  Zap,
  ChevronRight,
  ArrowRight,
  Clock,
  Eye
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export const SupportPage = () => {
  const { t } = useTranslation(['support', 'common']);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      id: 'getting-started',
      icon: Zap,
      title: t('support.categories.gettingStarted'),
      description: t('support.categories.gettingStartedDesc'),
      articles: 8,
      color: 'bg-blue-500'
    },
    {
      id: 'billing',
      icon: CreditCard,
      title: t('support.categories.billing'),
      description: t('support.categories.billingDesc'),
      articles: 8,
      color: 'bg-purple-500'
    },
    {
      id: 'technical',
      icon: Settings,
      title: t('support.categories.technical'),
      description: t('support.categories.technicalDesc'),
      articles: 10,
      color: 'bg-orange-500'
    },
    {
      id: 'features',
      icon: BookOpen,
      title: t('support.categories.features'),
      description: t('support.categories.featuresDesc'),
      articles: 10,
      color: 'bg-paymint-green'
    }
  ];

  const popularArticles = [
    { id: 'tc-1', title: t('support.popularArticles.printer'), category: t('support.categories.technical'), categoryId: 'technical', views: '5.6k', readTime: '8 min' },
    { id: 'gs-1', title: t('support.popularArticles.account'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', views: '8.2k', readTime: '5 min' },
    { id: 'ft-1', title: t('support.popularArticles.reports'), category: t('support.categories.features'), categoryId: 'features', views: '6.2k', readTime: '12 min' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', views: '6.5k', readTime: '8 min' },
    { id: 'bl-2', title: t('support.popularArticles.payment'), category: t('support.categories.billing'), categoryId: 'billing', views: '3.8k', readTime: '3 min' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#050505] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-paymint-green/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-paymint-green/10 border border-paymint-green/20 rounded-full text-paymint-green text-sm font-bold mb-6">
              <HelpCircle size={16} />
              {t('support.hero.badge')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              {t('support.hero.titlePart1')} <span className="text-paymint-green">{t('support.hero.titleHighlight')}</span> {t('support.hero.titlePart2')}
            </h1>

            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-xl mx-auto">
              {t('support.hero.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('support.hero.searchPlaceholder')}
                className="w-full pl-16 pr-6 py-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/50 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all"
              />
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link
                to="/support/tickets/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl text-sm font-bold hover:opacity-90 transition-all"
              >
                <Ticket size={16} />
                {t('support.quickLinks.submitTicket')}
              </Link>
              <Link
                to="/community"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
              >
                <MessageCircle size={16} />
                {t('support.quickLinks.community')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">{t('support.categories.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('support.categories.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/support/category/${category.id}`}
                  className="block p-6 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl hover:border-paymint-green/30 hover:shadow-xl hover:shadow-paymint-green/5 transition-all group h-full"
                >
                  <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    <category.icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold mb-2 group-hover:text-paymint-green transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400">{category.articles} {t('support.articles.count')}</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 bg-gray-50 dark:bg-white/[0.02]">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black tracking-tight">{t('support.articles.popular')}</h2>
              <Link
                to="/support/articles"
                className="text-sm font-bold text-paymint-green hover:underline flex items-center gap-1"
              >
                {t('support.articles.viewAll')} <ArrowRight size={14} />
              </Link>
            </div>

            <div className="space-y-3">
              {popularArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={`/support/article/${article.id}`}
                    className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:border-paymint-green/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-lg flex items-center justify-center">
                        <BookOpen size={18} className="text-gray-500" />
                      </div>
                      <div>
                        <h4 className="font-bold group-hover:text-paymint-green transition-colors">
                          {article.title}
                        </h4>
                        <span className="text-xs font-medium text-gray-400">{article.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-3 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {article.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {article.views}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white/10 dark:to-white/5 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/20 rounded-full blur-[80px]" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 rounded-full blur-[60px]" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
                  {t('support.cta.title')}
                </h2>
                <p className="text-gray-400 font-medium mb-8 max-w-lg mx-auto">
                  {t('support.cta.subtitle')}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    to="/support/tickets/new"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-paymint-green text-black rounded-xl font-bold hover:opacity-90 transition-all shadow-lg shadow-paymint-green/20"
                  >
                    <Ticket size={18} />
                    {t('support.quickLinks.submitTicket')}
                  </Link>
                  <Link
                    to="/support/tickets"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10"
                  >
                    {t('support.tickets.myTickets')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Ticket,
  BookOpen,
  HelpCircle,
  CreditCard,
  Settings,
  Zap,
  ChevronRight,
  ArrowRight,
  Clock,
  Eye,
  FileText,
  Download,
  X
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export const SupportPage = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // All articles for the search functionality
  const allArticles = [
    // Getting Started
    { id: 'gs-1', title: t('support.popularArticles.account'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-3', title: t('support.articles.gs3'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-4', title: t('support.articles.gs4'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-5', title: t('support.articles.gs5'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-6', title: t('support.articles.gs6'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    // Billing
    { id: 'bl-1', title: t('support.articles.bl1'), category: t('support.categories.billing'), categoryId: 'billing' },
    { id: 'bl-2', title: t('support.popularArticles.payment'), category: t('support.categories.billing'), categoryId: 'billing' },
    { id: 'bl-3', title: t('support.articles.bl3'), category: t('support.categories.billing'), categoryId: 'billing' },
    { id: 'bl-4', title: t('support.articles.bl4'), category: t('support.categories.billing'), categoryId: 'billing' },
    // Technical
    { id: 'tc-1', title: t('support.popularArticles.printer'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'tc-2', title: t('support.articles.tc2'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'tc-3', title: t('support.articles.tc3'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'tc-4', title: t('support.articles.tc4'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'tc-5', title: t('support.articles.tc5'), category: t('support.categories.technical'), categoryId: 'technical' },
    // Features
    { id: 'ft-1', title: t('support.popularArticles.reports'), category: t('support.categories.features'), categoryId: 'features' },
    { id: 'ft-2', title: t('support.articles.ft2'), category: t('support.categories.features'), categoryId: 'features' },
    { id: 'ft-3', title: t('support.articles.ft3'), category: t('support.categories.features'), categoryId: 'features' },
    { id: 'ft-4', title: t('support.articles.ft4'), category: t('support.categories.features'), categoryId: 'features' },
    { id: 'ft-5', title: t('support.articles.ft5'), category: t('support.categories.features'), categoryId: 'features' },
  ];

  const searchResults = searchQuery.trim() === ''
    ? []
    : allArticles
        .filter(article =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5); // Limit to top 5 matches

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
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#050505] relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-paymint-green/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-paymint-green/10 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-8 md:px-16 lg:px-24 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-paymint-green/10 border border-paymint-green/20 rounded-[12px] text-paymint-green text-sm font-bold mb-6">
              <HelpCircle size={16} />
              {t('support.hero.badge')}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6">
              {t('support.hero.titlePart1')} <span className="text-paymint-green">{t('support.hero.titleHighlight')}</span> {t('support.hero.titlePart2')}
            </h1>

            <p className="text-lg text-gray-500 dark:text-gray-400 font-medium mb-10 max-w-xl mx-auto">
              {t('support.hero.subtitle')}
            </p>

            {/* Search Bar with Dropdown */}
            <div className="relative max-w-2xl mx-auto" ref={searchContainerRef}>
              <Search className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-paymint-green' : 'text-gray-400'}`} size={22} />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('support.hero.searchPlaceholder')}
                className="w-full pl-16 pr-14 py-5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-lg font-medium focus:outline-none focus:ring-2 focus:ring-paymint-green/50 shadow-xl shadow-gray-200/50 dark:shadow-none transition-all"
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
              
              {/* Search Suggestions Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.trim() !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 text-left"
                  >
                    {searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((article) => (
                          <Link
                            key={article.id}
                            to={`/support/article/${article.id}`}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                            onClick={() => setIsSearchFocused(false)}
                          >
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-paymint-green/10 text-paymint-green group-hover:scale-110 transition-transform">
                              <BookOpen size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-paymint-green transition-colors">
                                {article.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {article.category}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-10 text-center">
                        <Search className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={32} />
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                          {t('common.noMatchingResults', { entity: 'articles', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' })}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
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
                to="/support/tickets"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-white/20 transition-all"
              >
                {t('support.tickets.myTickets')}
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
                    <span className="text-xs font-bold text-gray-400">{t('support.articles.count', { count: category.articles })}</span>
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* User Manual Download Section */}
      <section className="py-12">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="bg-paymint-green/5 dark:bg-paymint-green/10 border border-paymint-green/20 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-paymint-green/20 rounded-lg text-paymint-green text-xs font-bold mb-4 uppercase tracking-wider">
                  <FileText size={14} />
                  {t('support.manual.subtitle')}
                </div>
                <h2 className="text-3xl md:text-4xl font-black mb-4">
                  {t('support.manual.title')}
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 font-medium mb-8 max-w-2xl">
                  {t('support.manual.description')}
                </p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-gray-500 font-bold">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                    PDF
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                    {t('support.manual.fileSize')}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                    {t('support.manual.updated')}
                  </span>
                </div>
              </div>

              <div className="shrink-0">
                <a
                  href="/docs/paymint-user-manual.pdf"
                  download
                  className="inline-flex items-center gap-3 px-8 py-5 bg-paymint-green text-white rounded-2xl text-lg font-black shadow-lg shadow-paymint-green/25 hover:shadow-xl hover:shadow-paymint-green/40 hover:-translate-y-1 transition-all"
                >
                  <Download size={24} />
                  {t('support.manual.downloadButton')}
                </a>
              </div>
            </div>
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

      <Footer />
    </div>
  );
};

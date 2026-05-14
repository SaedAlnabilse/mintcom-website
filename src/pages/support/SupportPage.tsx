import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Ticket, BookOpen, HelpCircle, CreditCard,
  Settings, Zap, ChevronRight, ArrowRight, Clock,
  Eye, FileText, Download, X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { formatInputPlaceholder } from '../../utils/textCase';

export const SupportPage = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
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
    { id: 'getting-started', icon: Zap, title: t('support.categories.gettingStarted'), description: t('support.categories.gettingStartedDesc'), articles: 8, color: 'bg-blue-500' },
    { id: 'billing', icon: CreditCard, title: t('support.categories.billing'), description: t('support.categories.billingDesc'), articles: 8, color: 'bg-purple-500' },
    { id: 'technical', icon: Settings, title: t('support.categories.technical'), description: t('support.categories.technicalDesc'), articles: 10, color: 'bg-orange-500' },
    { id: 'features', icon: BookOpen, title: t('support.categories.features'), description: t('support.categories.featuresDesc'), articles: 10, color: 'bg-paymint-green' },
  ];

  const allArticles = [
    { id: 'gs-1', title: t('support.popularArticles.account'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-3', title: t('support.articles.gs3'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-4', title: t('support.articles.gs4'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-5', title: t('support.articles.gs5'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-6', title: t('support.articles.gs6'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'bl-1', title: t('support.articles.bl1'), category: t('support.categories.billing'), categoryId: 'billing' },
    { id: 'bl-2', title: t('support.popularArticles.payment'), category: t('support.categories.billing'), categoryId: 'billing' },
    { id: 'bl-3', title: t('support.articles.bl3'), category: t('support.categories.billing'), categoryId: 'billing' },
    { id: 'bl-4', title: t('support.articles.bl4'), category: t('support.categories.billing'), categoryId: 'billing' },
    { id: 'tc-1', title: t('support.popularArticles.printer'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'tc-2', title: t('support.articles.tc2'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'tc-3', title: t('support.articles.tc3'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'tc-4', title: t('support.articles.tc4'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'tc-5', title: t('support.articles.tc5'), category: t('support.categories.technical'), categoryId: 'technical' },
    { id: 'ft-1', title: t('support.popularArticles.reports'), category: t('support.categories.features'), categoryId: 'features' },
    { id: 'ft-2', title: t('support.articles.ft2'), category: t('support.categories.features'), categoryId: 'features' },
    { id: 'ft-3', title: t('support.articles.ft3'), category: t('support.categories.features'), categoryId: 'features' },
    { id: 'ft-4', title: t('support.articles.ft4'), category: t('support.categories.features'), categoryId: 'features' },
    { id: 'ft-5', title: t('support.articles.ft5'), category: t('support.categories.features'), categoryId: 'features' },
  ];

  const searchResults = searchQuery.trim() === ''
    ? []
    : allArticles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  const popularArticles = [
    { id: 'tc-1', title: t('support.popularArticles.printer'), category: t('support.categories.technical'), categoryId: 'technical', views: '5.6k', readTime: '8 min' },
    { id: 'gs-1', title: t('support.popularArticles.account'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', views: '8.2k', readTime: '5 min' },
    { id: 'ft-1', title: t('support.popularArticles.reports'), category: t('support.categories.features'), categoryId: 'features', views: '6.2k', readTime: '12 min' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', views: '6.5k', readTime: '8 min' },
    { id: 'bl-2', title: t('support.popularArticles.payment'), category: t('support.categories.billing'), categoryId: 'billing', views: '3.8k', readTime: '3 min' },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white"
    >
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pb-24 pt-32 lg:pb-32">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-paymint-green/10 blur-[140px]"
          />
          <div className="absolute bottom-0 right-[10%] h-[300px] w-[300px] rounded-full bg-emerald-400/5 blur-[100px]" />
          {/* Faint grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
            style={{
              backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              color: '#7CC39F',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />
        </div>

        <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-3xl text-center"
          >
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-paymint-green/25 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paymint-green shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(124,195,159,0.5)] backdrop-blur-xl dark:bg-white/5">
              <HelpCircle size={12} />
              <span>{t('support.hero.badge')}</span>
            </div>

            <h1 className="font-magilio text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-[72px]">
              {t('support.hero.titlePart1')}{' '}
              <span className="bg-gradient-to-r from-paymint-green via-emerald-400 to-paymint-green bg-clip-text text-transparent">
                {t('support.hero.titleHighlight')}
              </span>{' '}
              {t('support.hero.titlePart2')}
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl">
              {t('support.hero.subtitle')}
            </p>

            {/* Search bar */}
            <div className="relative mx-auto mt-10 max-w-2xl" ref={searchContainerRef}>
              <Search
                size={20}
                className={`absolute start-5 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-paymint-green' : 'text-gray-400'}`}
              />
              <input
                maxLength={255}
                type="text"
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={formatInputPlaceholder(t('support.hero.searchPlaceholder'), t('common.locale'))}
                className="w-full rounded-2xl border border-gray-200/80 bg-white/90 py-5 pe-14 ps-14 text-base font-medium shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all focus:border-paymint-green/40 focus:outline-none focus:ring-2 focus:ring-paymint-green/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('common.clearSearch', 'Clear search')}
                  className="absolute end-4 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:text-gray-200"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              )}

              {/* Search dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.trim() !== '' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 text-left shadow-[0_8px_30px_-8px_rgba(0,0,0,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#0e0e0e]"
                  >
                    {searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((article) => (
                          <Link
                            key={article.id}
                            to={`/support/article/${article.id}`}
                            className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                            onClick={() => setIsSearchFocused(false)}
                          >
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-paymint-green/10 text-paymint-green transition-transform group-hover:scale-110">
                              <BookOpen size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-bold text-gray-900 transition-colors group-hover:text-paymint-green dark:text-white">
                                {article.title}
                              </p>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{article.category}</p>
                            </div>
                            <ChevronRight size={15} className="flex-shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-paymint-green dark:text-gray-600" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-10 text-center">
                        <Search className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={28} />
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {t('common.noMatchingResults', { entity: 'articles', query: searchQuery.trim(), defaultValue: 'No articles matching "{{query}}"' })}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick action pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/support/tickets/new"
                className="group inline-flex items-center gap-2 rounded-xl bg-paymint-green px-5 py-2.5 text-sm font-bold text-black shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all hover:shadow-[0_8px_24px_-6px_rgba(124,195,159,0.6)]"
              >
                <Ticket size={15} />
                {t('support.quickLinks.submitTicket')}
              </Link>
              <Link
                to="/support/tickets"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-5 py-2.5 text-sm font-bold text-gray-900 backdrop-blur transition-colors hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                {t('support.tickets.myTickets')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
          <motion.header
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <h2 className="font-magilio text-4xl font-bold tracking-tight text-gray-900 dark:text-white md:text-5xl">
              {t('support.categories.title')}
            </h2>
            <p className="mt-4 text-lg font-light text-gray-600 dark:text-gray-400">
              {t('support.categories.subtitle')}
            </p>
          </motion.header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
              >
                <Link
                  to={`/support/category/${category.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] transition-all duration-500 hover:border-paymint-green/30 hover:shadow-[0_10px_30px_-10px_rgba(124,195,159,0.2)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
                >
                  {/* Icon */}
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${category.color} text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.2)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.3)]`}>
                    <category.icon size={24} />
                  </div>

                  <h3 className="mb-2 text-xl font-bold tracking-tight text-gray-900 transition-colors group-hover:text-paymint-green dark:text-white">
                    {category.title}
                  </h3>
                  <p className="flex-1 text-sm font-light leading-relaxed text-gray-500 dark:text-gray-400">
                    {category.description}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {t('support.articles.count', { count: category.articles })}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all group-hover:bg-paymint-green group-hover:text-black dark:bg-white/5 dark:group-hover:bg-paymint-green">
                      <ChevronRight size={15} className={`transition-transform group-hover:translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── User Manual ── */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-paymint-green/20 bg-gradient-to-br from-paymint-green/8 via-white to-white p-8 dark:from-paymint-green/10 dark:via-transparent dark:to-transparent md:p-12"
          >
            {/* Decorative glow */}
            <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-paymint-green/15 blur-3xl" />

            <div className="relative flex flex-col items-center justify-between gap-10 lg:flex-row">
              <div className="flex-1 text-center lg:text-start">
                <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-paymint-green/25 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paymint-green backdrop-blur-xl dark:bg-white/5">
                  <FileText size={12} />
                  {t('support.manual.subtitle')}
                </div>
                <h2 className="font-magilio text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                  {t('support.manual.title')}
                </h2>
                <p className="mt-4 max-w-xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400">
                  {t('support.manual.description')}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                  {['PDF', t('support.manual.fileSize'), t('support.manual.updated')].map((tag, i) => (
                    <span key={i} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href="/docs/paymint-user-manual.pdf"
                download
                className="group inline-flex items-center gap-3 rounded-2xl bg-paymint-green px-8 py-5 text-base font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-all hover:shadow-[0_12px_32px_-8px_rgba(124,195,159,0.7)] hover:-translate-y-1"
              >
                <Download size={20} />
                {t('support.manual.downloadButton')}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Popular Articles ── */}
      <section className="py-24 lg:py-32">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="font-magilio text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                {t('support.articles.popular')}
              </h2>
              <Link
                to="/support/articles"
                className="group inline-flex items-center gap-1.5 text-sm font-bold text-paymint-green hover:underline"
              >
                {t('support.articles.viewAll')}
                <ArrowRight size={14} className={`transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
              </Link>
            </div>

            <div className="space-y-3">
              {popularArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    to={`/support/article/${article.id}`}
                    className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-paymint-green/30 hover:shadow-[0_6px_20px_-8px_rgba(124,195,159,0.2)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-all group-hover:bg-paymint-green/10 dark:bg-white/5">
                        <BookOpen size={17} className="text-gray-500 transition-colors group-hover:text-paymint-green dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 transition-colors group-hover:text-paymint-green dark:text-white">
                          {article.title}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{article.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden items-center gap-4 text-xs font-medium text-gray-400 dark:text-gray-500 md:flex">
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} /> {article.readTime}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Eye size={12} /> {article.views}
                        </span>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all group-hover:bg-paymint-green group-hover:text-black dark:bg-white/5 dark:group-hover:bg-paymint-green">
                        <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                      </span>
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

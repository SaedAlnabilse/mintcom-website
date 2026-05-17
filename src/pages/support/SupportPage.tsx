import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Ticket, BookOpen, HelpCircle, CreditCard,
  Settings, Zap, ChevronRight, ArrowRight, Clock,
  Eye, FileText, Download, X, Sparkles, MessageSquare,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { formatInputPlaceholder } from '../../utils/textCase';

/* ─── tiny helpers ─────────────────────────────────────────────────────── */
const categoryAccent: Record<string, { border: string; glow: string; iconBg: string; dot: string }> = {
  'getting-started': {
    border: 'border-blue-400/40 hover:border-blue-400/70',
    glow: 'group-hover:shadow-[0_12px_40px_-12px_rgba(96,165,250,0.35)]',
    iconBg: 'bg-blue-500',
    dot: 'bg-blue-400',
  },
  billing: {
    border: 'border-purple-400/40 hover:border-purple-400/70',
    glow: 'group-hover:shadow-[0_12px_40px_-12px_rgba(167,139,250,0.35)]',
    iconBg: 'bg-purple-500',
    dot: 'bg-purple-400',
  },
  technical: {
    border: 'border-orange-400/40 hover:border-orange-400/70',
    glow: 'group-hover:shadow-[0_12px_40px_-12px_rgba(251,146,60,0.35)]',
    iconBg: 'bg-orange-500',
    dot: 'bg-orange-400',
  },
  features: {
    border: 'border-mintcom-green/40 hover:border-mintcom-green/70',
    glow: 'group-hover:shadow-[0_12px_40px_-12px_rgba(125,198,162,0.35)]',
    iconBg: 'bg-mintcom-green',
    dot: 'bg-mintcom-green',
  },
};

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
    { id: 'getting-started', icon: Zap,      title: t('support.categories.gettingStarted'), description: t('support.categories.gettingStartedDesc'), articles: 8  },
    { id: 'billing',         icon: CreditCard,title: t('support.categories.billing'),        description: t('support.categories.billingDesc'),        articles: 8  },
    { id: 'technical',       icon: Settings,  title: t('support.categories.technical'),      description: t('support.categories.technicalDesc'),      articles: 10 },
    { id: 'features',        icon: BookOpen,  title: t('support.categories.features'),       description: t('support.categories.featuresDesc'),       articles: 10 },
  ];

  const allArticles = [
    { id: 'gs-1', title: t('support.popularArticles.account'),      category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'),category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-3', title: t('support.articles.gs3'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-4', title: t('support.articles.gs4'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-5', title: t('support.articles.gs5'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-6', title: t('support.articles.gs6'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'bl-1', title: t('support.articles.bl1'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-2', title: t('support.popularArticles.payment'),      category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-3', title: t('support.articles.bl3'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-4', title: t('support.articles.bl4'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'tc-1', title: t('support.popularArticles.printer'),      category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-2', title: t('support.articles.tc2'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-3', title: t('support.articles.tc3'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-4', title: t('support.articles.tc4'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-5', title: t('support.articles.tc5'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'ft-1', title: t('support.popularArticles.reports'),      category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-2', title: t('support.articles.ft2'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-3', title: t('support.articles.ft3'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-4', title: t('support.articles.ft4'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-5', title: t('support.articles.ft5'),                 category: t('support.categories.features'),       categoryId: 'features' },
  ];

  const searchResults = searchQuery.trim() === ''
    ? []
    : allArticles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  const popularArticles = [
    { id: 'tc-1', title: t('support.popularArticles.printer'),      category: t('support.categories.technical'),      categoryId: 'technical',       views: '5.6k', readTime: '8 min'  },
    { id: 'gs-1', title: t('support.popularArticles.account'),      category: t('support.categories.gettingStarted'), categoryId: 'getting-started', views: '8.2k', readTime: '5 min'  },
    { id: 'ft-1', title: t('support.popularArticles.reports'),      category: t('support.categories.features'),       categoryId: 'features',        views: '6.2k', readTime: '12 min' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'),category: t('support.categories.gettingStarted'), categoryId: 'getting-started', views: '6.5k', readTime: '8 min'  },
    { id: 'bl-2', title: t('support.popularArticles.payment'),      category: t('support.categories.billing'),        categoryId: 'billing',         views: '3.8k', readTime: '3 min'  },
  ];

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════
          HERO — full-width split: left copy + right floating card stack
         ══════════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-0">

        {/* Background layer */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* large green orb top-left */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 -top-40 h-[700px] w-[700px] rounded-full bg-mintcom-green/15 blur-[160px]"
          />
          {/* small accent orb bottom-right */}
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-blue-400/8 blur-[120px]" />
          {/* dot-grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.035] dark:opacity-[0.055]"
            style={{
              backgroundImage: 'radial-gradient(circle, #7dc6a2 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)',
            }}
          />
        </div>

        <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px]">

            {/* ── Left: copy ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
              className="pb-16 lg:pb-24"
            >
              {/* eyebrow */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-mintcom-green/30 bg-mintcom-green/8 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-mintcom-green dark:bg-mintcom-green/10">
                <Sparkles size={11} />
                {t('support.hero.badge')}
              </div>

              <h1 className="font-magilio text-5xl font-bold leading-[1.04] tracking-tight md:text-6xl lg:text-[68px]">
                {t('support.hero.titlePart1')}{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-mintcom-green via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                    {t('support.hero.titleHighlight')}
                  </span>
                  {/* underline squiggle */}
                  <svg aria-hidden className="absolute -bottom-1 start-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none">
                    <path d="M0 6 Q50 0 100 5 Q150 10 200 4" stroke="#7dc6a2" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6"/>
                  </svg>
                </span>{' '}
                {t('support.hero.titlePart2')}
              </h1>

              <p className="mt-5 max-w-lg text-lg font-light leading-relaxed text-gray-500 dark:text-gray-400">
                {t('support.hero.subtitle')}
              </p>

              {/* Search */}
              <div className="relative mt-8 max-w-xl" ref={searchContainerRef}>
                {/* icon — always visible, sits inside the input */}
                <div className="pointer-events-none absolute start-0 top-0 flex h-full w-12 items-center justify-center">
                  <Search size={17} className={`transition-colors ${isSearchFocused ? 'text-mintcom-green' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <input
                  maxLength={255}
                  type="text"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={formatInputPlaceholder(t('support.hero.searchPlaceholder'), t('common.locale'))}
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pe-12 ps-11 text-sm font-medium shadow-sm transition-all focus:border-mintcom-green/50 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} aria-label={t('common.clearSearch', 'Clear search')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15">
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
                <AnimatePresence>
                  {isSearchFocused && searchQuery.trim() !== '' && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-gray-200 bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-[#1c1c1c]"
                    >
                      {searchResults.length > 0 ? (
                        <div className="py-2">
                          {searchResults.map((article) => (
                            <Link key={article.id} to={`/support/article/${article.id}`}
                              className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                              onClick={() => setIsSearchFocused(false)}>
                              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                                <BookOpen size={14} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-gray-900 group-hover:text-mintcom-green dark:text-white">{article.title}</p>
                                <p className="text-xs text-gray-400">{article.category}</p>
                              </div>
                              <ChevronRight size={14} className="flex-shrink-0 text-gray-300 group-hover:text-mintcom-green" />
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <div className="px-5 py-8 text-center">
                          <Search className="mx-auto mb-2 text-gray-300 dark:text-gray-600" size={24} />
                          <p className="text-sm text-gray-400">
                            {t('common.noMatchingResults', { entity: 'articles', query: searchQuery.trim(), defaultValue: 'No articles matching "{{query}}"' })}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CTA row */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link to="/support/tickets/new"
                  className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-5 py-2.5 text-sm font-bold text-black shadow-[0_4px_20px_-4px_rgba(125,198,162,0.55)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-4px_rgba(125,198,162,0.65)]">
                  <Ticket size={15} />
                  {t('support.quickLinks.submitTicket')}
                </Link>
                <Link to="/support/tickets"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <MessageSquare size={15} />
                  {t('support.tickets.myTickets')}
                </Link>
              </div>
            </motion.div>

            {/* ── Right: floating stat cards ── */}
            <motion.div
              initial={{ opacity: 0, x: isRtl ? -30 : 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              {/* tall card */}
              <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.1)] dark:border-white/8 dark:bg-white/[0.04]">
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Help Topics</span>
                  <span className="rounded-full bg-mintcom-green/10 px-2.5 py-0.5 text-[11px] font-bold text-mintcom-green">4 categories</span>
                </div>
                <div className="space-y-3">
                  {categories.map((cat, i) => {
                    const acc = categoryAccent[cat.id];
                    return (
                      <motion.div key={cat.id}
                        initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex items-center gap-3 rounded-2xl border bg-gray-50/60 p-3.5 dark:bg-white/[0.03] ${acc.border}`}>
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${acc.iconBg} text-white`}>
                          <cat.icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{cat.title}</p>
                          <p className="text-xs text-gray-400">{t('support.articles.count', { count: cat.articles })}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300" />
                      </motion.div>
                    );
                  })}
                </div>
                {/* bottom strip */}
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-mintcom-green/8 p-3 dark:bg-mintcom-green/10">
                  <HelpCircle size={15} className="text-mintcom-green" />
                  <p className="text-xs font-medium text-mintcom-green">36+ articles ready to help</p>
                </div>
              </div>
              {/* decorative floating pill */}
              <motion.div
                animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-5 -start-8 flex items-center gap-2 rounded-2xl border border-gray-100 bg-white px-4 py-2.5 shadow-lg dark:border-white/10 dark:bg-[#111]">
                <div className="h-2 w-2 rounded-full bg-mintcom-green" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Avg. reply in 2h</span>
              </motion.div>
            </motion.div>

          </div>
        </div>

        {/* wave divider */}
        <div className="relative -mb-px mt-0 h-16 w-full overflow-hidden">
          <svg viewBox="0 0 1440 64" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0 32 Q360 0 720 32 Q1080 64 1440 32 L1440 64 L0 64 Z" className="fill-gray-50 dark:fill-[#0a0a0a]" />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CATEGORIES — large horizontal cards with progress bar
         ══════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-16 dark:bg-[#0a0a0a]">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">

          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mb-10 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.2em] text-mintcom-green">{t('support.categories.subtitle')}</p>
              <h2 className="font-magilio text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                {t('support.categories.title')}
              </h2>
            </div>
            <Link to="/support/articles" className="group inline-flex items-center gap-1.5 text-sm font-bold text-mintcom-green hover:underline">
              {t('support.articles.viewAll')}
              <ArrowRight size={14} className={`transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
            </Link>
          </motion.div>

          {/* top row: 2 wide cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
            {categories.slice(0, 2).map((category, index) => {
              const acc = categoryAccent[category.id];
              const maxArticles = 10;
              const pct = Math.round((category.articles / maxArticles) * 100);
              return (
                <motion.div key={category.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3 }}>
                  <Link to={`/support/category/${category.id}`}
                    className={`group relative flex h-full items-center gap-6 overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 dark:bg-white/[0.03] ${acc.border} ${acc.glow} shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none`}>
                    {/* left color strip */}
                    <div className={`absolute inset-y-0 start-0 w-1 ${acc.iconBg} rounded-full opacity-60 transition-opacity group-hover:opacity-100`} />
                    {/* icon */}
                    <div className={`ms-2 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${acc.iconBg} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}>
                      <category.icon size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-barlow text-lg font-bold tracking-tight text-gray-900 transition-colors group-hover:text-mintcom-green dark:text-white">
                        {category.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{category.description}</p>
                      {/* progress bar */}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <motion.div
                            initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className={`h-full rounded-full ${acc.iconBg}`}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-400">{category.articles} articles</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className={`flex-shrink-0 text-gray-300 transition-all group-hover:text-mintcom-green group-hover:translate-x-1 ${isRtl ? 'rotate-180' : ''}`} />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* bottom row: 2 wide cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {categories.slice(2).map((category, index) => {
              const acc = categoryAccent[category.id];
              const maxArticles = 10;
              const pct = Math.round((category.articles / maxArticles) * 100);
              return (
                <motion.div key={category.id}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: (index + 2) * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -3 }}>
                  <Link to={`/support/category/${category.id}`}
                    className={`group relative flex h-full items-center gap-6 overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-300 dark:bg-white/[0.03] ${acc.border} ${acc.glow} shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-none`}>
                    <div className={`absolute inset-y-0 start-0 w-1 ${acc.iconBg} rounded-full opacity-60 transition-opacity group-hover:opacity-100`} />
                    <div className={`ms-2 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${acc.iconBg} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}>
                      <category.icon size={26} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-barlow text-lg font-bold tracking-tight text-gray-900 transition-colors group-hover:text-mintcom-green dark:text-white">
                        {category.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{category.description}</p>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                          <motion.div
                            initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }}
                            transition={{ delay: 0.3 + (index + 2) * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            className={`h-full rounded-full ${acc.iconBg}`}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-400">{category.articles} articles</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className={`flex-shrink-0 text-gray-300 transition-all group-hover:text-mintcom-green group-hover:translate-x-1 ${isRtl ? 'rotate-180' : ''}`} />
                  </Link>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          POPULAR ARTICLES + MANUAL — two-column layout
         ══════════════════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">

            {/* ── Articles list ── */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-magilio text-2xl font-bold tracking-tight text-gray-900 dark:text-white md:text-3xl">
                  {t('support.articles.popular')}
                </h2>
                <Link to="/support/articles"
                  className="group inline-flex items-center gap-1.5 text-sm font-bold text-mintcom-green hover:underline">
                  {t('support.articles.viewAll')}
                  <ArrowRight size={13} className={`transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                </Link>
              </div>

              {/* featured first article */}
              {popularArticles[0] && (() => {
                const article = popularArticles[0];
                const acc = categoryAccent[article.categoryId];
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="mb-3">
                    <Link to={`/support/article/${article.id}`}
                      className={`group relative flex items-center gap-5 overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:shadow-[0_8px_30px_-10px_rgba(125,198,162,0.3)] dark:bg-white/[0.03] ${acc.border} dark:border-white/8`}>
                      {/* accent bg blob */}
                      <div className={`pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full ${acc.iconBg} opacity-[0.06] blur-2xl transition-opacity group-hover:opacity-[0.12]`} />
                      <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${acc.iconBg} text-white shadow-md transition-transform group-hover:scale-105`}>
                        <BookOpen size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white ${acc.iconBg}`}>{article.category}</span>
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Most Popular</span>
                        </div>
                        <p className="text-base font-bold text-gray-900 transition-colors group-hover:text-mintcom-green dark:text-white">
                          {article.title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                          <span className="flex items-center gap-1"><Eye size={11} /> {article.views}</span>
                        </div>
                      </div>
                      <ChevronRight size={16} className={`flex-shrink-0 text-gray-300 transition-all group-hover:text-mintcom-green group-hover:translate-x-1 ${isRtl ? 'rotate-180' : ''}`} />
                    </Link>
                  </motion.div>
                );
              })()}

              {/* remaining articles as compact rows */}
              <div className="space-y-2">
                {popularArticles.slice(1).map((article, index) => {
                  const acc = categoryAccent[article.categoryId];
                  return (
                    <motion.div key={article.id}
                      initial={{ opacity: 0, x: isRtl ? 12 : -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      transition={{ delay: index * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                      <Link to={`/support/article/${article.id}`}
                        className="group flex items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3.5 transition-all duration-300 hover:border-mintcom-green/20 hover:shadow-[0_4px_16px_-6px_rgba(125,198,162,0.2)] dark:border-white/8 dark:bg-white/[0.025]">
                        {/* colored index dot */}
                        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${acc.iconBg} text-white text-[11px] font-black`}>
                          {index + 2}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-mintcom-green dark:text-white truncate">
                            {article.title}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${acc.dot}`} />
                            <span className="text-xs text-gray-400">{article.category}</span>
                          </div>
                        </div>
                        <div className="hidden items-center gap-3 text-xs text-gray-400 sm:flex">
                          <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                          <span className="flex items-center gap-1"><Eye size={11} /> {article.views}</span>
                        </div>
                        <ChevronRight size={14} className={`flex-shrink-0 text-gray-300 transition-all group-hover:text-mintcom-green ${isRtl ? 'rotate-180' : ''}`} />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* ── User Manual card ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <div className="sticky top-24 overflow-hidden rounded-3xl border border-mintcom-green/20 bg-gradient-to-b from-mintcom-green/10 to-mintcom-green/4 p-7 dark:from-mintcom-green/12 dark:to-mintcom-green/3">
                {/* decorative circles */}
                <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-mintcom-green/20 blur-2xl" />
                <div aria-hidden className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />

                <div className="relative">
                  <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-mintcom-green/30 bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-mintcom-green dark:bg-white/5">
                    <FileText size={10} />
                    {t('support.manual.subtitle')}
                  </div>

                  {/* big PDF icon */}
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-mintcom-green text-black shadow-[0_8px_24px_-8px_rgba(125,198,162,0.6)]">
                    <FileText size={28} />
                  </div>

                  <h3 className="font-magilio text-xl font-bold tracking-tight text-gray-900 dark:text-white md:text-2xl">
                    {t('support.manual.title')}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                    {t('support.manual.description')}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {['PDF', t('support.manual.fileSize'), t('support.manual.updated')].map((tag, i) => (
                      <span key={i} className="rounded-lg border border-mintcom-green/20 bg-white/70 px-2.5 py-1 text-[11px] font-bold text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <a href="/docs/mintcom-user-manual.pdf" download
                    className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-mintcom-green py-3.5 text-sm font-bold text-black shadow-[0_4px_20px_-4px_rgba(125,198,162,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-4px_rgba(125,198,162,0.65)]">
                    <Download size={16} />
                    {t('support.manual.downloadButton')}
                  </a>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

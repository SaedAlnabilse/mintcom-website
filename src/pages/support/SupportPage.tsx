import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Ticket, ChevronRight, ArrowRight, ArrowUpRight,
  Clock, Eye, Download, X, MessageSquare,
  Zap, CreditCard, Wrench, BookOpen, FileText,
  type LucideIcon,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { useAuth } from '../../context/AuthContext';
import { formatInputPlaceholder } from '../../utils/textCase';
import { getArticleViews, getArticleViewsNumber, useSupportArticleMetrics } from '../../hooks/useSupportArticleMetrics';
import { getLocalizedManual } from '../../utils/localizedDocs';

/* ─── category index (single neutral treatment, no rainbow accents) ─── */
const CATEGORY_META: { id: string; icon: LucideIcon }[] = [
  { id: 'getting-started', icon: Zap },
  { id: 'billing', icon: CreditCard },
  { id: 'technical', icon: Wrench },
  { id: 'features', icon: BookOpen },
];

export const SupportPage = () => {
  const { t, i18n } = useTranslation();
  const userManualDoc = getLocalizedManual('user', i18n.language);
  const navigate = useNavigate();
  const isRtl = t('common.locale') === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState('/support/tickets/new');
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated } = useAuth();

  const handleSubmitTicket = () => {
    if (isAuthenticated) {
      navigate('/support/tickets/new');
    } else {
      setLoginRedirectTo('/support/tickets/new');
      setShowLoginModal(true);
    }
  };

  const handleMyTickets = () => {
    if (isAuthenticated) {
      navigate('/support/tickets');
    } else {
      setLoginRedirectTo('/support/tickets');
      setShowLoginModal(true);
    }
  };

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
    { id: 'getting-started', icon: CATEGORY_META[0].icon, title: t('support.categories.gettingStarted'), description: t('support.categories.gettingStartedDesc'), articles: 11 },
    { id: 'billing',         icon: CATEGORY_META[1].icon, title: t('support.categories.billing'),        description: t('support.categories.billingDesc'),        articles: 11 },
    { id: 'technical',       icon: CATEGORY_META[2].icon, title: t('support.categories.technical'),      description: t('support.categories.technicalDesc'),      articles: 13 },
    { id: 'features',        icon: CATEGORY_META[3].icon, title: t('support.categories.features'),       description: t('support.categories.featuresDesc'),       articles: 13 },
  ];
  const totalArticles = categories.reduce((sum, c) => sum + c.articles, 0);

  const allArticles = [
    { id: 'gs-1', title: t('support.popularArticles.account'),      category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'),category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-3', title: t('support.articles.gs3'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-4', title: t('support.articles.gs4'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-5', title: t('support.articles.gs5'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-6', title: t('support.articles.gs6'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-7', title: t('support.articles.gs7'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-8', title: t('support.articles.gs8'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-9', title: t('support.articles.gs9'),                 category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-10', title: t('support.articles.gs10'),               category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'gs-11', title: t('support.articles.gs11'),               category: t('support.categories.gettingStarted'), categoryId: 'getting-started' },
    { id: 'bl-1', title: t('support.articles.bl1'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-2', title: t('support.popularArticles.payment'),      category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-3', title: t('support.articles.bl3'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-4', title: t('support.articles.bl4'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-5', title: t('support.articles.bl5'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-6', title: t('support.articles.bl6'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-7', title: t('support.articles.bl7'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-8', title: t('support.articles.bl8'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-9', title: t('support.articles.bl9'),                 category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-10', title: t('support.articles.bl10'),               category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'bl-11', title: t('support.articles.bl11'),               category: t('support.categories.billing'),        categoryId: 'billing' },
    { id: 'tc-1', title: t('support.popularArticles.printer'),      category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-2', title: t('support.articles.tc2'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-3', title: t('support.articles.tc3'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-4', title: t('support.articles.tc4'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-5', title: t('support.articles.tc5'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-6', title: t('support.articles.tc6'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-7', title: t('support.articles.tc7'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-8', title: t('support.articles.tc8'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-9', title: t('support.articles.tc9'),                 category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-10', title: t('support.articles.tc10'),               category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-11', title: t('support.articles.tc11'),               category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-12', title: t('support.articles.tc12'),               category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'tc-13', title: t('support.articles.tc13'),               category: t('support.categories.technical'),      categoryId: 'technical' },
    { id: 'ft-1', title: t('support.popularArticles.reports'),      category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-2', title: t('support.articles.ft2'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-3', title: t('support.articles.ft3'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-4', title: t('support.articles.ft4'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-5', title: t('support.articles.ft5'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-6', title: t('support.articles.ft6'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-7', title: t('support.articles.ft7'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-8', title: t('support.articles.ft8'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-9', title: t('support.articles.ft9'),                 category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-10', title: t('support.articles.ft10'),               category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-11', title: t('support.articles.ft11'),               category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-12', title: t('support.articles.ft12'),               category: t('support.categories.features'),       categoryId: 'features' },
    { id: 'ft-13', title: t('support.articles.ft13'),               category: t('support.categories.features'),       categoryId: 'features' },
  ];

  const searchResults = searchQuery.trim() === ''
    ? []
    : allArticles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);

  const popularArticleSeeds = [
    { id: 'tc-1', title: t('support.popularArticles.printer'),      category: t('support.categories.technical'),      categoryId: 'technical',       views: '5.6k', readTime: '8 min'  },
    { id: 'gs-1', title: t('support.popularArticles.account'),      category: t('support.categories.gettingStarted'), categoryId: 'getting-started', views: '8.2k', readTime: '5 min'  },
    { id: 'ft-1', title: t('support.popularArticles.reports'),      category: t('support.categories.features'),       categoryId: 'features',        views: '6.2k', readTime: '12 min' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'),category: t('support.categories.gettingStarted'), categoryId: 'getting-started', views: '6.5k', readTime: '8 min'  },
    { id: 'bl-2', title: t('support.popularArticles.payment'),      category: t('support.categories.billing'),        categoryId: 'billing',         views: '3.8k', readTime: '3 min'  },
  ];
  const { metrics } = useSupportArticleMetrics(popularArticleSeeds.map((article) => article.id));
  const popularArticles = [...popularArticleSeeds].sort(
    (a, b) => getArticleViewsNumber(metrics, b.id, b.views) - getArticleViewsNumber(metrics, a.id, a.views),
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar hideCommercialLinks />

      {/* ── Header: compact, centered, no decoration ── */}
      <header className="mx-auto w-full max-w-3xl px-6 pb-12 pt-28 text-center md:pt-32">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <p className="mb-3 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">
            {t('support.hero.badge')}
          </p>
          <h1 className="font-magilio text-4xl font-bold tracking-tight md:text-5xl">
            {t('support.hero.titlePart1')}{' '}
            <span className="text-mintcom-green">{t('support.hero.titleHighlight')}</span>{' '}
            {t('support.hero.titlePart2')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">
            {t('support.hero.subtitle')}
          </p>
        </motion.div>

        {/* Search */}
        <div className="relative mx-auto mt-8 max-w-xl text-start" ref={searchContainerRef}>
          <div className="pointer-events-none absolute start-0 top-0 flex h-full w-12 items-center justify-center">
            <Search size={17} className={isSearchFocused ? 'text-mintcom-green' : 'text-stone-400'} />
          </div>
          <input
            maxLength={255}
            type="text"
            value={searchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={formatInputPlaceholder(t('support.hero.searchPlaceholder'), t('common.locale'))}
            className="w-full rounded-xl border border-stone-200 bg-white py-3.5 pe-12 ps-11 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label={t('common.clearSearch', 'Clear search')}
              className="absolute end-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800">
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
          <AnimatePresence>
            {isSearchFocused && searchQuery.trim() !== '' && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-[0_12px_32px_-12px_rgba(0,0,0,0.18)] dark:border-zinc-800 dark:bg-zinc-900"
              >
                {searchResults.length > 0 ? (
                  <div className="py-1.5">
                    {searchResults.map((article) => (
                      <Link key={article.id} to={`/support/article/${article.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-zinc-800/60"
                        onClick={() => setIsSearchFocused(false)}>
                        <FileText size={15} className="shrink-0 text-stone-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{article.title}</span>
                          <span className="block text-xs text-stone-400">{article.category}</span>
                        </span>
                        <ChevronRight size={14} className={`shrink-0 text-stone-300 ${isRtl ? 'rotate-180' : ''}`} />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="px-5 py-7 text-center text-sm text-stone-400">
                    {t('common.noMatchingResults', { entity: 'articles', query: searchQuery.trim(), defaultValue: 'No articles matching "{{query}}"' })}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ticket actions */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button onClick={handleSubmitTicket}
            className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110">
            <Ticket size={15} />
            {t('support.quickLinks.submitTicket')}
          </button>
          <button onClick={handleMyTickets}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
            <MessageSquare size={15} />
            {t('support.tickets.myTickets')}
          </button>
        </div>
      </header>

      {/* ── Categories ── */}
      <section className="mx-auto w-full max-w-5xl px-6 pb-4">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">{t('support.categories.subtitle')}</p>
            <h2 className="font-magilio text-2xl font-bold tracking-tight md:text-3xl">
              {t('support.categories.title')}
            </h2>
          </div>
          <Link to="/support/articles" className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100">
            {t('support.articles.viewAll')}
            <ArrowRight size={14} className={`transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {categories.map((category) => (
            <Link key={category.id} to={`/support/category/${category.id}`}
              className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                <category.icon size={19} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-barlow text-[17px] font-bold tracking-tight">{category.title}</span>
                  <span className="shrink-0 text-xs tabular-nums text-stone-400">
                    {t('support.articles.count', { count: category.articles })}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-stone-500 line-clamp-2 dark:text-zinc-400">
                  {category.description}
                </span>
              </span>
              <ArrowUpRight size={16} className={`mt-1 shrink-0 text-stone-300 transition-all group-hover:text-mintcom-green ${isRtl ? '-scale-x-100' : ''}`} />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Popular + manual ── */}
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <div className="mb-2 flex items-end justify-between gap-4">
              <h2 className="font-magilio text-2xl font-bold tracking-tight md:text-3xl">
                {t('support.articles.popular')}
              </h2>
              <Link to="/support/articles"
                className="group inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                {t('support.articles.viewAll')}
                <ArrowRight size={14} className={`transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
              </Link>
            </div>

            <ol className="divide-y divide-stone-200 dark:divide-zinc-800">
              {popularArticles.map((article, index) => (
                <li key={article.id}>
                  <Link to={`/support/article/${article.id}`} className="group flex items-baseline gap-4 py-4">
                    <span className="font-magilio text-sm font-bold tabular-nums text-stone-300 dark:text-zinc-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold group-hover:underline group-hover:decoration-mintcom-green group-hover:decoration-2 group-hover:underline-offset-4">
                        {article.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-400">
                        <span>{article.category}</span>
                        <span className="inline-flex items-center gap-1"><Clock size={11} />{article.readTime}</span>
                        <span className="inline-flex items-center gap-1"><Eye size={11} />{getArticleViews(metrics, article.id, article.views)}</span>
                      </span>
                    </span>
                    <ChevronRight size={15} className={`shrink-0 self-center text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-500 ${isRtl ? 'rotate-180' : ''}`} />
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          {/* Manual */}
          <aside className="h-fit rounded-2xl border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 lg:sticky lg:top-24">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
              <FileText size={19} strokeWidth={1.75} />
            </span>
            <p className="mt-4 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">{t('support.manual.subtitle')}</p>
            <h3 className="mt-1 font-magilio text-xl font-bold tracking-tight">
              {t('support.manual.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
              {t('support.manual.description')}
            </p>
            <p className="mt-3 text-xs tabular-nums text-stone-400">
              PDF · {t('support.manual.fileSize')} · {t('support.manual.updated')}
            </p>
            <a href={userManualDoc.path} download={userManualDoc.filename}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110">
              <Download size={15} />
              {t('support.manual.downloadButton')}
            </a>
          </aside>
        </div>

        {/* Quiet footer line: total coverage, computed not hardcoded */}
        <p className="mt-10 border-t border-stone-200 pt-5 text-center text-[13px] tabular-nums text-stone-400 dark:border-zinc-800 dark:text-zinc-500">
          {t('support.articles.count', { count: totalArticles })}
        </p>
      </section>

      <Footer hideCommercialLinks />
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} redirectTo={loginRedirectTo} />
    </div>
  );
};

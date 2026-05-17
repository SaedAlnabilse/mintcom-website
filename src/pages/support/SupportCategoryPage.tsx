import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, BookOpen, Clock, ChevronRight,
  Zap, CreditCard, Settings, HelpCircle, Star, Eye, X, Ticket,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { useAuth } from '../../context/AuthContext';

const accentMap: Record<string, { bg: string; light: string; border: string; text: string; glow: string }> = {
  'getting-started': { bg: 'bg-blue-500',    light: 'bg-blue-50 dark:bg-blue-500/10',    border: 'border-blue-200 dark:border-blue-500/20',   text: 'text-blue-600 dark:text-blue-400',   glow: 'rgba(96,165,250,0.25)'  },
  billing:           { bg: 'bg-purple-500',  light: 'bg-purple-50 dark:bg-purple-500/10',border: 'border-purple-200 dark:border-purple-500/20',text: 'text-purple-600 dark:text-purple-400',glow: 'rgba(167,139,250,0.25)' },
  technical:         { bg: 'bg-orange-500',  light: 'bg-orange-50 dark:bg-orange-500/10',border: 'border-orange-200 dark:border-orange-500/20',text: 'text-orange-600 dark:text-orange-400',glow: 'rgba(251,146,60,0.25)'  },
  features:          { bg: 'bg-mintcom-green',light: 'bg-mintcom-green/8 dark:bg-mintcom-green/10',border: 'border-mintcom-green/25 dark:border-mintcom-green/20',text: 'text-mintcom-green',glow: 'rgba(125,198,162,0.25)' },
};

export const SupportCategoryPage = () => {
  const { t } = useTranslation();
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const isRtl = t('common.locale') === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSubmitTicket = () => {
    if (isAuthenticated) {
      navigate('/support/tickets/new');
    } else {
      setShowLoginModal(true);
    }
  };

  const categoryConfig: Record<string, { title: string; description: string; icon: React.ElementType; color: string; bgColor: string }> = {
    'getting-started': { title: t('support.categories.gettingStarted'), description: t('support.categories.gettingStartedDesc'), icon: Zap,       color: 'text-blue-600',        bgColor: 'bg-blue-500'       },
    billing:           { title: t('support.categories.billing'),        description: t('support.categories.billingDesc'),        icon: CreditCard, color: 'text-purple-600',      bgColor: 'bg-purple-500'     },
    technical:         { title: t('support.categories.technical'),      description: t('support.categories.technicalDesc'),      icon: Settings,   color: 'text-orange-600',      bgColor: 'bg-orange-500'     },
    features:          { title: t('support.categories.features'),       description: t('support.categories.featuresDesc'),       icon: BookOpen,   color: 'text-mintcom-green',   bgColor: 'bg-mintcom-green'  },
  };

  const articlesByCategory: Record<string, Array<{ id: string; title: string; excerpt: string; readTime: string; views: string; featured?: boolean }>> = {
    'getting-started': [
      { id: 'gs-1', title: t('support.popularArticles.account'),      excerpt: t('support.articles.gs1_excerpt'), readTime: '5 min',  views: '8.2k', featured: true },
      { id: 'gs-2', title: t('support.popularArticles.establishment'),excerpt: t('support.articles.gs2_excerpt'), readTime: '8 min',  views: '6.5k', featured: true },
      { id: 'gs-3', title: t('support.articles.gs3'),                 excerpt: t('support.articles.gs3_excerpt'), readTime: '10 min', views: '5.8k' },
      { id: 'gs-4', title: t('support.articles.gs4'),                 excerpt: t('support.articles.gs4_excerpt'), readTime: '6 min',  views: '4.2k' },
      { id: 'gs-5', title: t('support.articles.gs5'),                 excerpt: t('support.articles.gs5_excerpt'), readTime: '7 min',  views: '3.9k' },
      { id: 'gs-6', title: t('support.articles.gs6'),                 excerpt: t('support.articles.gs6_excerpt'), readTime: '5 min',  views: '3.5k' },
      { id: 'gs-7', title: t('support.articles.gs7'),                 excerpt: t('support.articles.gs7_excerpt'), readTime: '8 min',  views: '3.1k' },
      { id: 'gs-8', title: t('support.articles.gs8'),                 excerpt: t('support.articles.gs8_excerpt'), readTime: '4 min',  views: '2.8k' },
    ],
    billing: [
      { id: 'bl-1', title: t('support.articles.bl1'),            excerpt: t('support.articles.bl1_excerpt'), readTime: '6 min', views: '4.5k', featured: true },
      { id: 'bl-2', title: t('support.popularArticles.payment'), excerpt: t('support.articles.bl2_excerpt'), readTime: '3 min', views: '3.8k', featured: true },
      { id: 'bl-3', title: t('support.articles.bl3'),            excerpt: t('support.articles.bl3_excerpt'), readTime: '4 min', views: '3.2k' },
      { id: 'bl-4', title: t('support.articles.bl4'),            excerpt: t('support.articles.bl4_excerpt'), readTime: '5 min', views: '2.9k' },
      { id: 'bl-5', title: t('support.articles.bl5'),            excerpt: t('support.articles.bl5_excerpt'), readTime: '4 min', views: '2.1k' },
      { id: 'bl-6', title: t('support.articles.bl6'),            excerpt: t('support.articles.bl6_excerpt'), readTime: '3 min', views: '1.8k' },
      { id: 'bl-7', title: t('support.articles.bl7'),            excerpt: t('support.articles.bl7_excerpt'), readTime: '5 min', views: '1.5k' },
      { id: 'bl-8', title: t('support.articles.bl8'),            excerpt: t('support.articles.bl8_excerpt'), readTime: '4 min', views: '1.2k' },
    ],
    technical: [
      { id: 'tc-1',  title: t('support.popularArticles.printer'), excerpt: t('support.articles.tc1_excerpt'),  readTime: '8 min',  views: '5.6k', featured: true },
      { id: 'tc-2',  title: t('support.articles.tc2'),            excerpt: t('support.articles.tc2_excerpt'),  readTime: '6 min',  views: '4.8k', featured: true },
      { id: 'tc-3',  title: t('support.articles.tc3'),            excerpt: t('support.articles.tc3_excerpt'),  readTime: '7 min',  views: '4.2k' },
      { id: 'tc-4',  title: t('support.articles.tc4'),            excerpt: t('support.articles.tc4_excerpt'),  readTime: '5 min',  views: '3.8k' },
      { id: 'tc-5',  title: t('support.articles.tc5'),            excerpt: t('support.articles.tc5_excerpt'),  readTime: '6 min',  views: '3.2k' },
      { id: 'tc-6',  title: t('support.articles.tc6'),            excerpt: t('support.articles.tc6_excerpt'),  readTime: '7 min',  views: '2.9k' },
      { id: 'tc-7',  title: t('support.articles.tc7'),            excerpt: t('support.articles.tc7_excerpt'),  readTime: '8 min',  views: '2.5k' },
      { id: 'tc-8',  title: t('support.articles.tc8'),            excerpt: t('support.articles.tc8_excerpt'),  readTime: '4 min',  views: '2.1k' },
      { id: 'tc-9',  title: t('support.articles.tc9'),            excerpt: t('support.articles.tc9_excerpt'),  readTime: '5 min',  views: '1.9k' },
      { id: 'tc-10', title: t('support.articles.tc10'),           excerpt: t('support.articles.tc10_excerpt'), readTime: '10 min', views: '1.6k' },
    ],
    features: [
      { id: 'ft-1',  title: t('support.popularArticles.reports'), excerpt: t('support.articles.ft1_excerpt'),  readTime: '12 min', views: '6.2k', featured: true },
      { id: 'ft-2',  title: t('support.articles.ft2'),            excerpt: t('support.articles.ft2_excerpt'),  readTime: '10 min', views: '5.4k', featured: true },
      { id: 'ft-3',  title: t('support.articles.ft3'),            excerpt: t('support.articles.ft3_excerpt'),  readTime: '8 min',  views: '4.8k' },
      { id: 'ft-4',  title: t('support.articles.ft4'),            excerpt: t('support.articles.ft4_excerpt'),  readTime: '15 min', views: '4.2k' },
      { id: 'ft-5',  title: t('support.articles.ft5'),            excerpt: t('support.articles.ft5_excerpt'),  readTime: '10 min', views: '3.8k' },
      { id: 'ft-6',  title: t('support.articles.ft6'),            excerpt: t('support.articles.ft6_excerpt'),  readTime: '7 min',  views: '3.2k' },
      { id: 'ft-7',  title: t('support.articles.ft7'),            excerpt: t('support.articles.ft7_excerpt'),  readTime: '12 min', views: '2.9k' },
      { id: 'ft-8',  title: t('support.articles.ft8'),            excerpt: t('support.articles.ft8_excerpt'),  readTime: '6 min',  views: '2.5k' },
      { id: 'ft-9',  title: t('support.articles.ft9'),            excerpt: t('support.articles.ft9_excerpt'),  readTime: '8 min',  views: '2.2k' },
      { id: 'ft-10', title: t('support.articles.ft10'),           excerpt: t('support.articles.ft10_excerpt'), readTime: '5 min',  views: '1.9k' },
    ],
  };

  const category  = categoryId ? categoryConfig[categoryId]      : null;
  const acc       = categoryId ? accentMap[categoryId]            : null;
  const articles  = categoryId ? articlesByCategory[categoryId] || [] : [];
  const filtered  = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const featured  = filtered.filter(a => a.featured);
  const regular   = filtered.filter(a => !a.featured);

  if (!category || !acc) {
    return (
      <div className="min-h-screen bg-white font-sans dark:bg-[#050505]">
        <Navbar />
        <main className="pt-32 pb-24 text-center">
          <h1 className="font-magilio mb-4 text-3xl font-bold">{t('support.categories.notFound')}</h1>
          <Link to="/support" className="font-bold text-mintcom-green hover:underline">← {t('support.articles.backToHelp')}</Link>
        </main>
        <Footer />
      </div>
    );
  }

  const CategoryIcon = category.icon;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
      <Navbar />

      {/* ── Hero header ── */}
      <section className="relative overflow-hidden pt-24 pb-0">
        {/* ambient glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className={`absolute -top-32 start-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full ${acc.bg} opacity-[0.08] blur-[120px]`} />
        </div>

        <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
          {/* back link */}
          <motion.div initial={{ opacity: 0, x: isRtl ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link to="/support"
              className="group mb-8 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:text-white">
              <ArrowLeft size={14} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
              {t('support.articles.backToHelp')}
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="pb-12">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
              {/* icon */}
              <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-3xl ${acc.bg} text-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.2)]`}>
                <CategoryIcon size={36} />
              </div>
              <div className="flex-1">
                <p className={`mb-1 text-[11px] font-bold uppercase tracking-[0.2em] ${acc.text}`}>
                  {t('support.categories.subtitle')}
                </p>
                <h1 className="font-magilio text-4xl font-bold tracking-tight md:text-5xl">{category.title}</h1>
                <p className="mt-2 text-base font-light text-gray-500 dark:text-gray-400">{category.description}</p>
              </div>
              {/* stats pills */}
              <div className="flex flex-wrap gap-3 sm:flex-col sm:items-end">
                <div className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 ${acc.light} ${acc.border}`}>
                  <BookOpen size={14} className={acc.text} />
                  <span className={`text-sm font-bold ${acc.text}`}>{articles.length} {t('support.articles.allTitle')}</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <Star size={14} className="text-amber-500" />
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{featured.length} {t('support.articles.featuredTitle')}</span>
                </div>
              </div>
            </div>

            {/* search */}
            <div className="relative mt-8 max-w-lg">
              <div className="pointer-events-none absolute start-0 top-0 flex h-full w-11 items-center justify-center">
                <Search size={16} className="text-gray-400" />
              </div>
              <input maxLength={255} type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('support.categories.searchInCategory', { category: category.title })}
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pe-10 ps-10 text-sm font-medium shadow-sm transition-all focus:border-mintcom-green/40 focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-gray-500"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="absolute end-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200 dark:bg-white/10">
                  <X size={11} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* wave */}
        <div className="relative -mb-px h-12 w-full">
          <svg viewBox="0 0 1440 48" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0 24 Q360 0 720 24 Q1080 48 1440 24 L1440 48 L0 48 Z" className="fill-gray-50 dark:fill-[#0a0a0a]" />
          </svg>
        </div>
      </section>

      {/* ── Content ── */}
      <main className="bg-gray-50 pb-24 dark:bg-[#0a0a0a]">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">

          {/* Featured articles — 2-col cards */}
          {featured.length > 0 && !searchQuery && (
            <div className="pt-10 pb-8">
              <div className="mb-5 flex items-center gap-2">
                <Star size={15} className="text-amber-400" />
                <h2 className="font-magilio text-xl font-bold">{t('support.articles.featuredTitle')}</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {featured.map((article, i) => (
                  <motion.div key={article.id}
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ y: -3 }}>
                    <Link to={`/support/article/${article.id}`}
                      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 dark:bg-white/[0.03] ${acc.border}`}
                      style={{ '--glow-color': acc.glow } as React.CSSProperties}>
                      {/* top accent */}
                      <div className={`absolute inset-x-0 top-0 h-0.5 ${acc.bg} opacity-0 transition-opacity group-hover:opacity-100`} />
                      <div className="mb-4 flex items-start gap-4">
                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${acc.light} ${acc.border} border`}>
                          <BookOpen size={18} className={acc.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-barlow text-base font-bold leading-snug tracking-tight transition-colors group-hover:${acc.text}`}>
                            {article.title}
                          </h3>
                        </div>
                      </div>
                      <p className="flex-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">{article.excerpt}</p>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                          <span className="flex items-center gap-1"><Eye size={11} /> {article.views}</span>
                        </div>
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${acc.light} ${acc.text} transition-transform group-hover:translate-x-0.5`}>
                          <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All / search results */}
          <div className={featured.length > 0 && !searchQuery ? 'pt-2 pb-4' : 'pt-10 pb-4'}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-magilio text-xl font-bold">
                {searchQuery
                  ? t('support.articles.searchResultCount', { count: filtered.length })
                  : t('support.articles.allTitle')}
              </h2>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className={`text-sm font-bold ${acc.text} hover:underline`}>
                  {t('support.articles.clearSearch')}
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-16 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/10">
                  <HelpCircle size={24} className="text-gray-400" />
                </div>
                <h3 className="font-barlow mb-2 text-lg font-bold">{t('common.noResults')}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('common.noMatchingResults', { entity: 'articles', query: searchQuery, defaultValue: 'No articles matching "{{query}}"' })}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(searchQuery ? filtered : regular).map((article, i) => (
                  <motion.div key={article.id}
                    initial={{ opacity: 0, x: isRtl ? 12 : -12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                    <Link to={`/support/article/${article.id}`}
                      className={`group flex items-center gap-4 rounded-xl border bg-white px-5 py-4 transition-all duration-300 dark:bg-white/[0.025] border-gray-100 dark:border-white/8 hover:border-opacity-60 hover:shadow-sm dark:hover:border-white/15`}>
                      <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${acc.light} transition-transform group-hover:scale-105`}>
                        <BookOpen size={15} className={acc.text} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold text-gray-900 transition-colors group-hover:${acc.text} dark:text-white truncate`}>
                          {article.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">{article.excerpt}</p>
                      </div>
                      <div className="hidden items-center gap-3 text-xs text-gray-400 sm:flex">
                        <span className="flex items-center gap-1"><Clock size={11} /> {article.readTime}</span>
                        <span className="flex items-center gap-1"><Eye size={11} /> {article.views}</span>
                      </div>
                      <ChevronRight size={14} className={`flex-shrink-0 text-gray-300 transition-all group-hover:${acc.text} ${isRtl ? 'rotate-180' : ''}`} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="mt-10 overflow-hidden rounded-2xl border border-mintcom-green/20 bg-gradient-to-br from-mintcom-green/8 via-white to-white p-7 dark:from-mintcom-green/10 dark:via-transparent dark:to-transparent">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-barlow text-xl font-bold">{t('support.cta.stillNeedHelp')}</h3>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t('support.cta.stillNeedHelpDesc')}</p>
              </div>
              <button onClick={handleSubmitTicket}
                className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-5 py-2.5 text-sm font-bold text-black shadow-[0_4px_16px_-4px_rgba(125,198,162,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-4px_rgba(125,198,162,0.6)] whitespace-nowrap">
                <Ticket size={15} />
                {t('support.quickLinks.submitTicket')}
              </button>
            </div>
          </div>

        </div>
      </main>
      <Footer />
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

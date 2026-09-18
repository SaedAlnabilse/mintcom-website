import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Search, Clock, ChevronRight,
  Eye, X, Ticket, Star,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { useAuth } from '../../context/AuthContext';
import { getArticleViews, useSupportArticleMetrics } from '../../hooks/useSupportArticleMetrics';

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

  const categoryConfig: Record<string, { title: string; description: string }> = {
    'getting-started': { title: t('support.categories.gettingStarted'), description: t('support.categories.gettingStartedDesc') },
    billing:           { title: t('support.categories.billing'),        description: t('support.categories.billingDesc')        },
    technical:         { title: t('support.categories.technical'),      description: t('support.categories.technicalDesc')      },
    features:          { title: t('support.categories.features'),       description: t('support.categories.featuresDesc')       },
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
      { id: 'gs-9', title: t('support.articles.gs9'),                 excerpt: t('support.articles.gs9_excerpt'), readTime: '5 min',  views: '2.4k' },
      { id: 'gs-10', title: t('support.articles.gs10'),               excerpt: t('support.articles.gs10_excerpt'), readTime: '6 min', views: '2.0k' },
      { id: 'gs-11', title: t('support.articles.gs11'),               excerpt: t('support.articles.gs11_excerpt'), readTime: '7 min', views: '1.8k' },
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
      { id: 'bl-9', title: t('support.articles.bl9'),            excerpt: t('support.articles.bl9_excerpt'), readTime: '4 min', views: '1.1k' },
      { id: 'bl-10', title: t('support.articles.bl10'),          excerpt: t('support.articles.bl10_excerpt'), readTime: '5 min', views: '0.9k' },
      { id: 'bl-11', title: t('support.articles.bl11'),          excerpt: t('support.articles.bl11_excerpt'), readTime: '4 min', views: '0.8k' },
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
      { id: 'tc-11', title: t('support.articles.tc11'),           excerpt: t('support.articles.tc11_excerpt'), readTime: '6 min',  views: '1.4k' },
      { id: 'tc-12', title: t('support.articles.tc12'),           excerpt: t('support.articles.tc12_excerpt'), readTime: '5 min',  views: '1.2k' },
      { id: 'tc-13', title: t('support.articles.tc13'),           excerpt: t('support.articles.tc13_excerpt'), readTime: '4 min',  views: '1.0k' },
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
      { id: 'ft-11', title: t('support.articles.ft11'),           excerpt: t('support.articles.ft11_excerpt'), readTime: '5 min',  views: '1.7k' },
      { id: 'ft-12', title: t('support.articles.ft12'),           excerpt: t('support.articles.ft12_excerpt'), readTime: '5 min',  views: '1.5k' },
      { id: 'ft-13', title: t('support.articles.ft13'),           excerpt: t('support.articles.ft13_excerpt'), readTime: '7 min',  views: '1.3k' },
    ],
  };

  const category  = categoryId ? categoryConfig[categoryId]      : null;
  const articles  = categoryId ? articlesByCategory[categoryId] || [] : [];
  const { metrics } = useSupportArticleMetrics(articles.map((article) => article.id));
  const filtered  = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const featured  = filtered.filter(a => a.featured);
  const regular   = filtered.filter(a => !a.featured);

  if (!category) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Navbar hideCommercialLinks />
        <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-32 text-center">
          <h1 className="font-magilio mb-4 text-3xl font-bold">{t('support.categories.notFound')}</h1>
          <Link to="/support" className="text-sm font-semibold text-mintcom-greenInk dark:text-mintcom-green hover:underline">
            {t('support.articles.backToHelp')}
          </Link>
        </main>
        <Footer hideCommercialLinks />
      </div>
    );
  }

  const renderRow = (article: (typeof articles)[number], index: number) => (
    <li key={article.id}>
      <Link to={`/support/article/${article.id}`} className="group flex items-baseline gap-4 py-4">
        <span className="font-magilio text-sm font-bold tabular-nums text-stone-300 dark:text-zinc-600">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="truncate text-[15px] font-semibold group-hover:underline group-hover:decoration-mintcom-green group-hover:decoration-2 group-hover:underline-offset-4">
              {article.title}
            </span>
            {article.featured && !searchQuery && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400">
                <Star size={10} /> {t('support.articles.featuredTitle')}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-sm text-stone-500 dark:text-zinc-400">{article.excerpt}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-stone-400">
            <span className="inline-flex items-center gap-1"><Clock size={11} />{article.readTime}</span>
            <span className="inline-flex items-center gap-1"><Eye size={11} />{getArticleViews(metrics, article.id, article.views)}</span>
          </span>
        </span>
        <ChevronRight size={15} className={`shrink-0 self-center text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-500 ${isRtl ? 'rotate-180' : ''}`} />
      </Link>
    </li>
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar hideCommercialLinks />

      <main className="mx-auto w-full max-w-3xl px-6 pb-20 pt-28">
        <Link to="/support" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          <ArrowLeft size={15} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
          {t('support.articles.backToHelp')}
        </Link>

        <p className="mb-2 mt-8 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">
          {t('support.articles.count', { count: articles.length })}
        </p>
        <h1 className="font-magilio text-4xl font-bold tracking-tight md:text-5xl">{category.title}</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">{category.description}</p>

        <div className="relative mt-7">
          <div className="pointer-events-none absolute start-0 top-0 flex h-full w-11 items-center justify-center">
            <Search size={16} className="text-stone-400" />
          </div>
          <input maxLength={255} type="text" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('support.categories.searchInCategory', { category: category.title })}
            className="w-full rounded-xl border border-stone-200 bg-white py-3 pe-10 ps-10 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')}
              aria-label={t('common.clearSearch', 'Clear search')}
              className="absolute end-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800">
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <h3 className="font-barlow text-lg font-bold">{t('common.noResults')}</h3>
            <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">
              {t('common.noMatchingResults', { entity: 'articles', query: searchQuery, defaultValue: 'No articles matching "{{query}}"' })}
            </p>
            <button onClick={() => setSearchQuery('')} className="mt-4 text-sm font-semibold text-mintcom-greenInk dark:text-mintcom-green hover:underline">
              {t('support.articles.clearSearch')}
            </button>
          </div>
        ) : (
          <>
            {featured.length > 0 && !searchQuery && (
              <>
                <h2 className="font-magilio mb-1 mt-10 text-xl font-bold tracking-tight">{t('support.articles.featuredTitle')}</h2>
                <ol className="divide-y divide-stone-200 dark:divide-zinc-800">
                  {featured.map(renderRow)}
                </ol>
              </>
            )}
            <h2 className="font-magilio mb-1 mt-10 text-xl font-bold tracking-tight">
              {searchQuery
                ? t('support.articles.searchResultCount', { count: filtered.length })
                : t('support.articles.allTitle')}
            </h2>
            <ol className="divide-y divide-stone-200 dark:divide-zinc-800">
              {(searchQuery ? filtered : regular).map(renderRow)}
            </ol>
          </>
        )}

        <div className="mt-12 rounded-2xl border border-stone-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h3 className="font-barlow text-lg font-bold tracking-tight">{t('support.cta.stillNeedHelp')}</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-zinc-400">{t('support.cta.stillNeedHelpDesc')}</p>
          <button onClick={handleSubmitTicket}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110">
            <Ticket size={15} />
            {t('support.quickLinks.submitTicket')}
          </button>
        </div>
      </main>

      <Footer hideCommercialLinks />
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

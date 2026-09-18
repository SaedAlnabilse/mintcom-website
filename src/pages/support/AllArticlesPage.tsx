import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Search, BookOpen, Clock, Eye, ChevronRight,
  Zap, CreditCard, Settings, X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { formatInputPlaceholder } from '../../utils/textCase';
import { getArticleViews, getArticleViewsNumber, useSupportArticleMetrics } from '../../hooks/useSupportArticleMetrics';

export const AllArticlesPage = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'views' | 'recent'>('views');

  const allArticles = [
    { id: 'gs-1', title: t('support.popularArticles.account'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '5 min', views: '8.2k' },
    { id: 'gs-2', title: t('support.popularArticles.establishment'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '8 min', views: '6.5k' },
    { id: 'gs-3', title: t('support.articles.gs3'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '10 min', views: '5.8k' },
    { id: 'gs-4', title: t('support.articles.gs4'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '6 min', views: '4.2k' },
    { id: 'gs-5', title: t('support.articles.gs5'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '7 min', views: '3.9k' },
    { id: 'gs-6', title: t('support.articles.gs6'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '5 min', views: '3.5k' },
    { id: 'gs-7', title: t('support.articles.gs7'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '8 min', views: '3.1k' },
    { id: 'gs-8', title: t('support.articles.gs8'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '4 min', views: '2.8k' },
    { id: 'gs-9', title: t('support.articles.gs9'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '5 min', views: '2.4k' },
    { id: 'gs-10', title: t('support.articles.gs10'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '6 min', views: '2.0k' },
    { id: 'gs-11', title: t('support.articles.gs11'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '7 min', views: '1.8k' },
    { id: 'bl-1', title: t('support.articles.bl1'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '6 min', views: '4.5k' },
    { id: 'bl-2', title: t('support.popularArticles.payment'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '3 min', views: '3.8k' },
    { id: 'bl-3', title: t('support.articles.bl3'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '4 min', views: '3.2k' },
    { id: 'bl-4', title: t('support.articles.bl4'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '5 min', views: '2.9k' },
    { id: 'bl-5', title: t('support.articles.bl5'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '4 min', views: '2.1k' },
    { id: 'bl-6', title: t('support.articles.bl6'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '3 min', views: '1.8k' },
    { id: 'bl-7', title: t('support.articles.bl7'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '5 min', views: '1.5k' },
    { id: 'bl-8', title: t('support.articles.bl8'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '4 min', views: '1.2k' },
    { id: 'bl-9', title: t('support.articles.bl9'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '4 min', views: '1.1k' },
    { id: 'bl-10', title: t('support.articles.bl10'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '5 min', views: '0.9k' },
    { id: 'bl-11', title: t('support.articles.bl11'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '4 min', views: '0.8k' },
    { id: 'tc-1', title: t('support.popularArticles.printer'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '8 min', views: '5.6k' },
    { id: 'tc-2', title: t('support.articles.tc2'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '6 min', views: '4.8k' },
    { id: 'tc-3', title: t('support.articles.tc3'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '7 min', views: '4.2k' },
    { id: 'tc-4', title: t('support.articles.tc4'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '5 min', views: '3.8k' },
    { id: 'tc-5', title: t('support.articles.tc5'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '6 min', views: '3.2k' },
    { id: 'tc-6', title: t('support.articles.tc6'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '7 min', views: '2.9k' },
    { id: 'tc-7', title: t('support.articles.tc7'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '8 min', views: '2.5k' },
    { id: 'tc-8', title: t('support.articles.tc8'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '4 min', views: '2.1k' },
    { id: 'tc-9', title: t('support.articles.tc9'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '5 min', views: '1.9k' },
    { id: 'tc-10', title: t('support.articles.tc10'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '10 min', views: '1.6k' },
    { id: 'tc-11', title: t('support.articles.tc11'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '6 min', views: '1.4k' },
    { id: 'tc-12', title: t('support.articles.tc12'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '5 min', views: '1.2k' },
    { id: 'tc-13', title: t('support.articles.tc13'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '4 min', views: '1.0k' },
    { id: 'ft-1', title: t('support.popularArticles.reports'), category: t('support.categories.features'), categoryId: 'features', readTime: '12 min', views: '6.2k' },
    { id: 'ft-2', title: t('support.articles.ft2'), category: t('support.categories.features'), categoryId: 'features', readTime: '10 min', views: '5.4k' },
    { id: 'ft-3', title: t('support.articles.ft3'), category: t('support.categories.features'), categoryId: 'features', readTime: '8 min', views: '4.8k' },
    { id: 'ft-4', title: t('support.articles.ft4'), category: t('support.categories.features'), categoryId: 'features', readTime: '15 min', views: '4.2k' },
    { id: 'ft-5', title: t('support.articles.ft5'), category: t('support.categories.features'), categoryId: 'features', readTime: '10 min', views: '3.8k' },
    { id: 'ft-6', title: t('support.articles.ft6'), category: t('support.categories.features'), categoryId: 'features', readTime: '7 min', views: '3.2k' },
    { id: 'ft-7', title: t('support.articles.ft7'), category: t('support.categories.features'), categoryId: 'features', readTime: '12 min', views: '2.9k' },
    { id: 'ft-8', title: t('support.articles.ft8'), category: t('support.categories.features'), categoryId: 'features', readTime: '6 min', views: '2.5k' },
    { id: 'ft-9', title: t('support.articles.ft9'), category: t('support.categories.features'), categoryId: 'features', readTime: '8 min', views: '2.2k' },
    { id: 'ft-10', title: t('support.articles.ft10'), category: t('support.categories.features'), categoryId: 'features', readTime: '5 min', views: '1.9k' },
    { id: 'ft-11', title: t('support.articles.ft11'), category: t('support.categories.features'), categoryId: 'features', readTime: '5 min', views: '1.7k' },
    { id: 'ft-12', title: t('support.articles.ft12'), category: t('support.categories.features'), categoryId: 'features', readTime: '5 min', views: '1.5k' },
    { id: 'ft-13', title: t('support.articles.ft13'), category: t('support.categories.features'), categoryId: 'features', readTime: '7 min', views: '1.3k' },
  ];
  const { metrics } = useSupportArticleMetrics(allArticles.map((article) => article.id));

  const categories = [
    { id: 'all', label: t('support.categories.all'), icon: BookOpen },
    { id: 'getting-started', label: t('support.categories.gettingStarted'), icon: Zap },
    { id: 'billing', label: t('support.categories.billing'), icon: CreditCard },
    { id: 'technical', label: t('support.categories.technical'), icon: Settings },
    { id: 'features', label: t('support.categories.features'), icon: BookOpen },
  ];

  const filteredArticles = allArticles
    .filter(a => {
      const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || a.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) =>
      sortBy === 'views'
        ? getArticleViewsNumber(metrics, b.id, b.views) - getArticleViewsNumber(metrics, a.id, a.views)
        : 0
    );
  const hasArticleSearch = searchQuery.trim().length > 0;
  const hasArticleCategoryFilter = selectedCategory !== 'all';

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar hideCommercialLinks />
      <main className="mx-auto w-full max-w-5xl px-6 pb-20 pt-28">
        <Link to="/support" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100">
          <ArrowLeft size={15} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
          {t('support.articles.backToHelp')}
        </Link>

        <h1 className="font-magilio mt-6 text-4xl font-bold tracking-tight md:text-5xl">{t('support.articles.allTitle')}</h1>
        <p className="mt-3 text-[15px] text-stone-500 dark:text-zinc-400">
          {t('support.articles.allSubtitle', { count: allArticles.length })}
        </p>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row">
          {/* Category nav */}
          <nav aria-label={t('support.categories.sidebarTitle')} className="shrink-0 lg:w-56">
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible lg:pb-0">
              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    aria-current={active ? 'true' : undefined}
                    className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-stone-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                        : 'text-stone-500 hover:bg-stone-200/60 hover:text-stone-800 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100'
                    }`}
                  >
                    <cat.icon size={15} />
                    <span className="whitespace-nowrap">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* List */}
          <div className="min-w-0 flex-1">
            <div className="mb-4 flex flex-col gap-2.5 sm:flex-row">
              <div className="relative flex-1">
                <Search size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input maxLength={255}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={formatInputPlaceholder(t('common.searchArticles'), t('common.locale'))}
                  className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pe-10 ps-10 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors placeholder:text-stone-400 focus:border-mintcom-green focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:placeholder:text-zinc-500"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} aria-label={t('common.clearSearch', 'Clear search')}
                    className="absolute end-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 dark:hover:bg-zinc-800">
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              <label className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-stone-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
                <span className="text-stone-400">{t('support.articles.sortBy')}</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'views' | 'recent')}
                  className="cursor-pointer bg-transparent font-semibold focus:outline-none"
                >
                  <option value="views">{t('support.articles.sortPopular')}</option>
                  <option value="recent">{t('support.articles.sortRecent')}</option>
                </select>
              </label>
            </div>

            <p className="mb-1 text-[13px] text-stone-500 dark:text-zinc-400">
              {t('support.articles.showing', { count: filteredArticles.length })}
            </p>

            {filteredArticles.length === 0 ? (
              <div className="py-14 text-center">
                <h3 className="font-barlow text-lg font-bold">
                  {hasArticleSearch ? t('common.noResults') : hasArticleCategoryFilter ? t('common.noFilteredResults') : t('common.noResults')}
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500 dark:text-zinc-400">
                  {hasArticleSearch
                    ? t('common.noMatchingResults', { entity: 'articles', query: searchQuery.trim(), defaultValue: 'No articles matching "{{query}}"' })
                    : hasArticleCategoryFilter
                      ? t('common.noFilteredResultsDesc')
                      : t('support.articles.emptySubtitle', { defaultValue: 'No articles are available yet.' })}
                </p>
                <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="mt-4 text-sm font-semibold text-mintcom-greenInk dark:text-mintcom-green hover:underline">
                  {t('support.articles.clearFilters')}
                </button>
              </div>
            ) : (
              <ol className="divide-y divide-stone-200 dark:divide-zinc-800">
                {filteredArticles.map((article) => (
                  <li key={article.id}>
                    <Link to={`/support/article/${article.id}`} className="group flex items-baseline gap-3 py-4">
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
            )}
          </div>
        </div>
      </main>
      <Footer hideCommercialLinks />
    </div>
  );
};

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, BookOpen, Clock, Eye, ChevronRight,
  Zap, CreditCard, Settings, Filter, X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { formatInputPlaceholder } from '../../utils/textCase';

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
    { id: 'bl-1', title: t('support.articles.bl1'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '6 min', views: '4.5k' },
    { id: 'bl-2', title: t('support.popularArticles.payment'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '3 min', views: '3.8k' },
    { id: 'bl-3', title: t('support.articles.bl3'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '4 min', views: '3.2k' },
    { id: 'bl-4', title: t('support.articles.bl4'), category: t('support.categories.billing'), categoryId: 'billing', readTime: '5 min', views: '2.9k' },
    { id: 'tc-1', title: t('support.popularArticles.printer'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '8 min', views: '5.6k' },
    { id: 'tc-2', title: t('support.articles.tc2'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '6 min', views: '4.8k' },
    { id: 'tc-3', title: t('support.articles.tc3'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '7 min', views: '4.2k' },
    { id: 'tc-4', title: t('support.articles.tc4'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '5 min', views: '3.8k' },
    { id: 'tc-5', title: t('support.articles.tc5'), category: t('support.categories.technical'), categoryId: 'technical', readTime: '6 min', views: '3.2k' },
    { id: 'ft-1', title: t('support.popularArticles.reports'), category: t('support.categories.features'), categoryId: 'features', readTime: '12 min', views: '6.2k' },
    { id: 'ft-2', title: t('support.articles.ft2'), category: t('support.categories.features'), categoryId: 'features', readTime: '10 min', views: '5.4k' },
    { id: 'ft-3', title: t('support.articles.ft3'), category: t('support.categories.features'), categoryId: 'features', readTime: '8 min', views: '4.8k' },
    { id: 'ft-4', title: t('support.articles.ft4'), category: t('support.categories.features'), categoryId: 'features', readTime: '15 min', views: '4.2k' },
    { id: 'ft-5', title: t('support.articles.ft5'), category: t('support.categories.features'), categoryId: 'features', readTime: '10 min', views: '3.8k' },
  ];

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
    .sort((a, b) => sortBy === 'views' ? parseFloat(b.views) - parseFloat(a.views) : 0);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
            <Link to="/support" className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <ArrowLeft size={15} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
              {t('support.articles.backToHelp')}
            </Link>
            <h1 className="font-magilio mt-4 text-4xl font-bold tracking-tight md:text-5xl">{t('support.articles.allTitle')}</h1>
            <p className="mt-3 text-lg font-light text-gray-500 dark:text-gray-400">
              {t('support.articles.allSubtitle', { count: allArticles.length })}
            </p>
          </motion.div>

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Sidebar */}
            <div className="flex-shrink-0 lg:w-60">
              <div className="sticky top-28 overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
                <p className="mb-3 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  {t('support.categories.sidebarTitle')}
                </p>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                        selectedCategory === cat.id
                          ? 'bg-mintcom-green text-black'
                          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10'
                      }`}
                    >
                      <cat.icon size={15} />
                      <span className="text-start">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main */}
            <div className="flex-1">
              {/* Search + sort bar */}
              <div className="mb-6 overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
                <div className="flex flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input maxLength={255}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={formatInputPlaceholder(t('common.searchArticles'), t('common.locale'))}
                      className="w-full rounded-2xl border border-gray-200/80 bg-gray-50/70 py-3 pe-11 ps-11 text-sm transition-all focus:border-mintcom-green/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
                    />
                    {searchQuery && (
                      <button type="button" onClick={() => setSearchQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                        <X size={12} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setSortBy(sortBy === 'views' ? 'recent' : 'views')}
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-gray-50/70 px-4 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10"
                  >
                    <Filter size={15} />
                    {t('support.articles.sortBy')}: {sortBy === 'views' ? t('support.articles.sortPopular') : t('support.articles.sortRecent')}
                  </button>
                </div>
              </div>

              <p className="mb-4 px-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                {t('support.articles.showing', { count: filteredArticles.length })}
              </p>

              <div className="space-y-3">
                {filteredArticles.map((article, index) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                    <Link to={`/support/article/${article.id}`} className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-mintcom-green/30 hover:shadow-[0_6px_20px_-8px_rgba(124,195,159,0.2)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 transition-all group-hover:bg-mintcom-green/20">
                          <BookOpen size={17} className="text-mintcom-green" />
                        </div>
                        <div>
                          <p className="font-bold transition-colors group-hover:text-mintcom-green">{article.title}</p>
                          <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{article.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden items-center gap-4 text-xs font-medium text-gray-400 md:flex">
                          <span className="flex items-center gap-1.5"><Clock size={12} /> {article.readTime}</span>
                          <span className="flex items-center gap-1.5"><Eye size={12} /> {article.views}</span>
                        </div>
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all group-hover:bg-mintcom-green group-hover:text-black dark:bg-white/5 dark:group-hover:bg-mintcom-green">
                          <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                ))}

                {filteredArticles.length === 0 && (
                  <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center dark:border-white/10 dark:bg-white/[0.03]">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/10">
                      <BookOpen size={28} className="text-gray-400" />
                    </div>
                    <h3 className="font-magilio mb-2 text-xl font-bold">{t('common.noResults')}</h3>
                    <p className="mb-6 text-sm font-light text-gray-500 dark:text-gray-400">
                      {t('common.noMatchingResults', { entity: 'articles', query: searchQuery.trim(), defaultValue: 'No articles matching "{{query}}"' })}
                    </p>
                    <button onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }} className="font-bold text-mintcom-green hover:underline">
                      {t('support.articles.clearFilters')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

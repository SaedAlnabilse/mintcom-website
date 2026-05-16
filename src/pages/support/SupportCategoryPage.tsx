import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, BookOpen, Clock, ChevronRight,
  Zap, CreditCard, Settings, HelpCircle, Star, Eye, X,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export const SupportCategoryPage = () => {
  const { t } = useTranslation();
  const { categoryId } = useParams<{ categoryId: string }>();
  const isRtl = t('common.locale') === 'ar';
  const [searchQuery, setSearchQuery] = useState('');

  const categoryConfig: Record<string, { title: string; description: string; icon: React.ElementType; color: string; bgColor: string }> = {
    'getting-started': { title: t('support.categories.gettingStarted'), description: t('support.categories.gettingStartedDesc'), icon: Zap, color: 'text-blue-600', bgColor: 'bg-blue-500' },
    'billing': { title: t('support.categories.billing'), description: t('support.categories.billingDesc'), icon: CreditCard, color: 'text-purple-600', bgColor: 'bg-purple-500' },
    'technical': { title: t('support.categories.technical'), description: t('support.categories.technicalDesc'), icon: Settings, color: 'text-orange-600', bgColor: 'bg-orange-500' },
    'features': { title: t('support.categories.features'), description: t('support.categories.featuresDesc'), icon: BookOpen, color: 'text-paymint-green', bgColor: 'bg-paymint-green' },
  };

  const articlesByCategory: Record<string, Array<{ id: string; title: string; excerpt: string; readTime: string; views: string; featured?: boolean }>> = {
    'getting-started': [
      { id: 'gs-1', title: t('support.popularArticles.account'), excerpt: t('support.articles.gs1_excerpt'), readTime: '5 min', views: '8.2k', featured: true },
      { id: 'gs-2', title: t('support.popularArticles.establishment'), excerpt: t('support.articles.gs2_excerpt'), readTime: '8 min', views: '6.5k', featured: true },
      { id: 'gs-3', title: t('support.articles.gs3'), excerpt: t('support.articles.gs3_excerpt'), readTime: '10 min', views: '5.8k' },
      { id: 'gs-4', title: t('support.articles.gs4'), excerpt: t('support.articles.gs4_excerpt'), readTime: '6 min', views: '4.2k' },
      { id: 'gs-5', title: t('support.articles.gs5'), excerpt: t('support.articles.gs5_excerpt'), readTime: '7 min', views: '3.9k' },
      { id: 'gs-6', title: t('support.articles.gs6'), excerpt: t('support.articles.gs6_excerpt'), readTime: '5 min', views: '3.5k' },
      { id: 'gs-7', title: t('support.articles.gs7'), excerpt: t('support.articles.gs7_excerpt'), readTime: '8 min', views: '3.1k' },
      { id: 'gs-8', title: t('support.articles.gs8'), excerpt: t('support.articles.gs8_excerpt'), readTime: '4 min', views: '2.8k' },
    ],
    'billing': [
      { id: 'bl-1', title: t('support.articles.bl1'), excerpt: t('support.articles.bl1_excerpt'), readTime: '6 min', views: '4.5k', featured: true },
      { id: 'bl-2', title: t('support.popularArticles.payment'), excerpt: t('support.articles.bl2_excerpt'), readTime: '3 min', views: '3.8k', featured: true },
      { id: 'bl-3', title: t('support.articles.bl3'), excerpt: t('support.articles.bl3_excerpt'), readTime: '4 min', views: '3.2k' },
      { id: 'bl-4', title: t('support.articles.bl4'), excerpt: t('support.articles.bl4_excerpt'), readTime: '5 min', views: '2.9k' },
      { id: 'bl-5', title: t('support.articles.bl5'), excerpt: t('support.articles.bl5_excerpt'), readTime: '4 min', views: '2.1k' },
      { id: 'bl-6', title: t('support.articles.bl6'), excerpt: t('support.articles.bl6_excerpt'), readTime: '3 min', views: '1.8k' },
      { id: 'bl-7', title: t('support.articles.bl7'), excerpt: t('support.articles.bl7_excerpt'), readTime: '5 min', views: '1.5k' },
      { id: 'bl-8', title: t('support.articles.bl8'), excerpt: t('support.articles.bl8_excerpt'), readTime: '4 min', views: '1.2k' },
    ],
    'technical': [
      { id: 'tc-1', title: t('support.popularArticles.printer'), excerpt: t('support.articles.tc1_excerpt'), readTime: '8 min', views: '5.6k', featured: true },
      { id: 'tc-2', title: t('support.articles.tc2'), excerpt: t('support.articles.tc2_excerpt'), readTime: '6 min', views: '4.8k', featured: true },
      { id: 'tc-3', title: t('support.articles.tc3'), excerpt: t('support.articles.tc3_excerpt'), readTime: '7 min', views: '4.2k' },
      { id: 'tc-4', title: t('support.articles.tc4'), excerpt: t('support.articles.tc4_excerpt'), readTime: '5 min', views: '3.8k' },
      { id: 'tc-5', title: t('support.articles.tc5'), excerpt: t('support.articles.tc5_excerpt'), readTime: '6 min', views: '3.2k' },
      { id: 'tc-6', title: t('support.articles.tc6'), excerpt: t('support.articles.tc6_excerpt'), readTime: '7 min', views: '2.9k' },
      { id: 'tc-7', title: t('support.articles.tc7'), excerpt: t('support.articles.tc7_excerpt'), readTime: '8 min', views: '2.5k' },
      { id: 'tc-8', title: t('support.articles.tc8'), excerpt: t('support.articles.tc8_excerpt'), readTime: '4 min', views: '2.1k' },
      { id: 'tc-9', title: t('support.articles.tc9'), excerpt: t('support.articles.tc9_excerpt'), readTime: '5 min', views: '1.9k' },
      { id: 'tc-10', title: t('support.articles.tc10'), excerpt: t('support.articles.tc10_excerpt'), readTime: '10 min', views: '1.6k' },
    ],
    'features': [
      { id: 'ft-1', title: t('support.popularArticles.reports'), excerpt: t('support.articles.ft1_excerpt'), readTime: '12 min', views: '6.2k', featured: true },
      { id: 'ft-2', title: t('support.articles.ft2'), excerpt: t('support.articles.ft2_excerpt'), readTime: '10 min', views: '5.4k', featured: true },
      { id: 'ft-3', title: t('support.articles.ft3'), excerpt: t('support.articles.ft3_excerpt'), readTime: '8 min', views: '4.8k' },
      { id: 'ft-4', title: t('support.articles.ft4'), excerpt: t('support.articles.ft4_excerpt'), readTime: '15 min', views: '4.2k' },
      { id: 'ft-5', title: t('support.articles.ft5'), excerpt: t('support.articles.ft5_excerpt'), readTime: '10 min', views: '3.8k' },
      { id: 'ft-6', title: t('support.articles.ft6'), excerpt: t('support.articles.ft6_excerpt'), readTime: '7 min', views: '3.2k' },
      { id: 'ft-7', title: t('support.articles.ft7'), excerpt: t('support.articles.ft7_excerpt'), readTime: '12 min', views: '2.9k' },
      { id: 'ft-8', title: t('support.articles.ft8'), excerpt: t('support.articles.ft8_excerpt'), readTime: '6 min', views: '2.5k' },
      { id: 'ft-9', title: t('support.articles.ft9'), excerpt: t('support.articles.ft9_excerpt'), readTime: '8 min', views: '2.2k' },
      { id: 'ft-10', title: t('support.articles.ft10'), excerpt: t('support.articles.ft10_excerpt'), readTime: '5 min', views: '1.9k' },
    ],
  };

  const category = categoryId ? categoryConfig[categoryId] : null;
  const articles = categoryId ? articlesByCategory[categoryId] || [] : [];
  const filteredArticles = articles.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const featuredArticles = filteredArticles.filter(a => a.featured);
  const regularArticles = filteredArticles.filter(a => !a.featured);

  if (!category) {
    return (
      <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
        <Navbar />
        <main className="pt-32 pb-24">
          <div className="container mx-auto max-w-[1280px] px-6 text-center md:px-10">
            <h1 className="font-magilio mb-4 text-3xl font-bold">{t('support.categories.notFound')}</h1>
            <p className="mb-8 text-gray-500">{t('support.categories.notFoundDesc')}</p>
            <Link to="/support" className="font-bold text-paymint-green hover:underline">← {t('support.articles.backToHelp')}</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const CategoryIcon = category.icon;

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
      <Navbar />
      <main className="pt-32 pb-24">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-12">
            <Link to="/support" className="group mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              <ArrowLeft size={15} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
              {t('support.articles.backToHelp')}
            </Link>
            <div className="flex items-center gap-5 mt-4">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${category.bgColor} text-white shadow-[0_8px_20px_-8px_rgba(0,0,0,0.2)]`}>
                <CategoryIcon size={28} />
              </div>
              <div>
                <h1 className="font-magilio text-3xl font-bold tracking-tight md:text-4xl">{category.title}</h1>
                <p className="mt-1 text-base font-light text-gray-500 dark:text-gray-400">{category.description}</p>
              </div>
            </div>
          </motion.div>

          {/* Search */}
          <div className="relative mb-10 max-w-xl">
            <Search size={16} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input maxLength={255}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('support.categories.searchInCategory', { category: category.title })}
              className="w-full rounded-2xl border border-gray-200/80 bg-gray-50/70 py-3.5 pe-11 ps-11 text-sm transition-all focus:border-paymint-green/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-paymint-green/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:bg-white/10"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
                <X size={12} strokeWidth={2.5} />
              </button>
            )}
          </div>

          {/* Featured articles */}
          {featuredArticles.length > 0 && (
            <div className="mb-10">
              <h2 className="font-magilio mb-5 flex items-center gap-2 text-lg font-bold">
                <Star size={16} className="text-amber-400" />
                {t('support.articles.featuredTitle')}
              </h2>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {featuredArticles.map((article, index) => (
                  <motion.div key={article.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
                    <Link to={`/support/article/${article.id}`} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-7 shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] transition-all duration-300 hover:border-paymint-green/30 hover:shadow-[0_8px_24px_-8px_rgba(124,195,159,0.2)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
                      <div className="mb-4 flex items-start gap-4">
                        <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${category.bgColor}/10`}>
                          <BookOpen size={20} className={category.color} />
                        </div>
                        <h3 className="font-magilio text-lg font-bold leading-tight tracking-tight transition-colors group-hover:text-paymint-green">{article.title}</h3>
                      </div>
                      <p className="flex-1 text-sm font-light leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">{article.excerpt}</p>
                      <div className="mt-4 flex items-center gap-4 text-xs font-medium text-gray-400">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {article.readTime}</span>
                        <span className="flex items-center gap-1.5"><Eye size={12} /> {article.views} {t('support.articles.views')}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All articles */}
          <div>
            <h2 className="font-magilio mb-5 text-lg font-bold">
              {searchQuery ? t('support.articles.searchResultCount', { count: filteredArticles.length }) : t('support.articles.allTitle')}
            </h2>
            <div className="space-y-3">
              {regularArticles.map((article, index) => (
                <motion.div key={article.id} initial={{ opacity: 0, x: isRtl ? 16 : -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}>
                  <Link to={`/support/article/${article.id}`} className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-paymint-green/30 hover:shadow-[0_6px_20px_-8px_rgba(124,195,159,0.2)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gray-100 transition-all group-hover:bg-paymint-green/10 dark:bg-white/5">
                        <BookOpen size={17} className="text-gray-500 transition-colors group-hover:text-paymint-green dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-bold transition-colors group-hover:text-paymint-green">{article.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs font-light text-gray-500 dark:text-gray-400">{article.excerpt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden items-center gap-4 text-xs font-medium text-gray-400 md:flex">
                        <span className="flex items-center gap-1.5"><Clock size={12} /> {article.readTime}</span>
                        <span className="flex items-center gap-1.5"><Eye size={12} /> {article.views}</span>
                      </div>
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-all group-hover:bg-paymint-green group-hover:text-black dark:bg-white/5 dark:group-hover:bg-paymint-green">
                        <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="rounded-3xl border border-gray-100 bg-white p-16 text-center dark:border-white/10 dark:bg-white/[0.03]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/10">
                  <HelpCircle size={28} className="text-gray-400" />
                </div>
                <h3 className="font-magilio mb-2 text-xl font-bold">{searchQuery.trim() ? t('common.noResults') : t('support.articles.notFound')}</h3>
                <p className="mb-6 text-sm font-light text-gray-500 dark:text-gray-400">
                  {searchQuery.trim() ? t('common.noMatchingResults', { entity: 'articles', query: searchQuery.trim(), defaultValue: 'No articles matching "{{query}}"' }) : t('support.articles.notFoundDesc')}
                </p>
                <button onClick={() => setSearchQuery('')} className="font-bold text-paymint-green hover:underline">{t('support.articles.clearSearch')}</button>
              </div>
            )}
          </div>

          {/* Help CTA */}
          <div className="mt-12 overflow-hidden rounded-3xl border border-paymint-green/20 bg-gradient-to-br from-paymint-green/5 via-white to-white p-8 dark:from-paymint-green/10 dark:via-transparent dark:to-transparent">
            <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-center">
              <div>
                <h3 className="font-magilio text-2xl font-bold text-gray-900 dark:text-white">{t('support.cta.stillNeedHelp')}</h3>
                <p className="mt-1 text-sm font-light text-gray-500 dark:text-gray-400">{t('support.cta.stillNeedHelpDesc')}</p>
              </div>
              <Link to="/support/tickets/new" className="inline-flex items-center gap-2 rounded-xl bg-paymint-green px-6 py-3 font-bold text-black shadow-[0_4px_16px_-4px_rgba(124,195,159,0.5)] transition-all hover:shadow-[0_8px_24px_-6px_rgba(124,195,159,0.6)] whitespace-nowrap">
                {t('support.quickLinks.submitTicket')}
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

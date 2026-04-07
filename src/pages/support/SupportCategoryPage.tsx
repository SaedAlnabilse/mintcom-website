import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  BookOpen,
  Clock,
  ChevronRight,
  Zap,
  CreditCard,
  Settings,
  HelpCircle,
  Star,
  Eye,
  X
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export const SupportCategoryPage = () => {
  const { t } = useTranslation();
  const { categoryId } = useParams<{ categoryId: string }>();
  const [searchQuery, setSearchQuery] = useState('');

  // Category configuration
  const categoryConfig: Record<string, {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
  }> = {
    'getting-started': {
      title: t('support.categories.gettingStarted'),
      description: t('support.categories.gettingStartedDesc'),
      icon: Zap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500'
    },
    'billing': {
      title: t('support.categories.billing'),
      description: t('support.categories.billingDesc'),
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500'
    },
    'technical': {
      title: t('support.categories.technical'),
      description: t('support.categories.technicalDesc'),
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-500'
    },
    'features': {
      title: t('support.categories.features'),
      description: t('support.categories.featuresDesc'),
      icon: BookOpen,
      color: 'text-paymint-green',
      bgColor: 'bg-paymint-green'
    }
  };

  // Articles data by category
  const articlesByCategory: Record<string, Array<{
    id: string;
    title: string;
    excerpt: string;
    readTime: string;
    views: string;
    featured?: boolean;
  }>> = {
    'getting-started': [
      {
        id: 'gs-1',
        title: t('support.popularArticles.account'),
        excerpt: t('support.articles.gs1_excerpt'),
        readTime: '5 min',
        views: '8.2k',
        featured: true
      },
      {
        id: 'gs-2',
        title: t('support.popularArticles.establishment'),
        excerpt: t('support.articles.gs2_excerpt'),
        readTime: '8 min',
        views: '6.5k',
        featured: true
      },
      {
        id: 'gs-3',
        title: t('support.articles.gs3'),
        excerpt: t('support.articles.gs3_excerpt'),
        readTime: '10 min',
        views: '5.8k'
      },
      {
        id: 'gs-4',
        title: t('support.articles.gs4'),
        excerpt: t('support.articles.gs4_excerpt'),
        readTime: '6 min',
        views: '4.2k'
      },
      {
        id: 'gs-5',
        title: t('support.articles.gs5'),
        excerpt: t('support.articles.gs5_excerpt'),
        readTime: '7 min',
        views: '3.9k'
      },
      {
        id: 'gs-6',
        title: t('support.articles.gs6'),
        excerpt: t('support.articles.gs6_excerpt'),
        readTime: '5 min',
        views: '3.5k'
      },
      {
        id: 'gs-7',
        title: t('support.articles.gs7'),
        excerpt: t('support.articles.gs7_excerpt'),
        readTime: '8 min',
        views: '3.1k'
      },
      {
        id: 'gs-8',
        title: t('support.articles.gs8'),
        excerpt: t('support.articles.gs8_excerpt'),
        readTime: '4 min',
        views: '2.8k'
      }
    ],
    'billing': [
      {
        id: 'bl-1',
        title: t('support.articles.bl1'),
        excerpt: t('support.articles.bl1_excerpt'),
        readTime: '6 min',
        views: '4.5k',
        featured: true
      },
      {
        id: 'bl-2',
        title: t('support.popularArticles.payment'),
        excerpt: t('support.articles.bl2_excerpt'),
        readTime: '3 min',
        views: '3.8k',
        featured: true
      },
      {
        id: 'bl-3',
        title: t('support.articles.bl3'),
        excerpt: t('support.articles.bl3_excerpt'),
        readTime: '4 min',
        views: '3.2k'
      },
      {
        id: 'bl-4',
        title: t('support.articles.bl4'),
        excerpt: t('support.articles.bl4_excerpt'),
        readTime: '5 min',
        views: '2.9k'
      },
      {
        id: 'bl-5',
        title: t('support.articles.bl5'),
        excerpt: t('support.articles.bl5_excerpt'),
        readTime: '4 min',
        views: '2.1k'
      },
      {
        id: 'bl-6',
        title: t('support.articles.bl6'),
        excerpt: t('support.articles.bl6_excerpt'),
        readTime: '3 min',
        views: '1.8k'
      },
      {
        id: 'bl-7',
        title: t('support.articles.bl7'),
        excerpt: t('support.articles.bl7_excerpt'),
        readTime: '5 min',
        views: '1.5k'
      },
      {
        id: 'bl-8',
        title: t('support.articles.bl8'),
        excerpt: t('support.articles.bl8_excerpt'),
        readTime: '4 min',
        views: '1.2k'
      }
    ],
    'technical': [
      {
        id: 'tc-1',
        title: t('support.popularArticles.printer'),
        excerpt: t('support.articles.tc1_excerpt'),
        readTime: '8 min',
        views: '5.6k',
        featured: true
      },
      {
        id: 'tc-2',
        title: t('support.articles.tc2'),
        excerpt: t('support.articles.tc2_excerpt'),
        readTime: '6 min',
        views: '4.8k',
        featured: true
      },
      {
        id: 'tc-3',
        title: t('support.articles.tc3'),
        excerpt: t('support.articles.tc3_excerpt'),
        readTime: '7 min',
        views: '4.2k'
      },
      {
        id: 'tc-4',
        title: t('support.articles.tc4'),
        excerpt: t('support.articles.tc4_excerpt'),
        readTime: '5 min',
        views: '3.8k'
      },
      {
        id: 'tc-5',
        title: t('support.articles.tc5'),
        excerpt: t('support.articles.tc5_excerpt'),
        readTime: '6 min',
        views: '3.2k'
      },
      {
        id: 'tc-6',
        title: t('support.articles.tc6'),
        excerpt: t('support.articles.tc6_excerpt'),
        readTime: '7 min',
        views: '2.9k'
      },
      {
        id: 'tc-7',
        title: t('support.articles.tc7'),
        excerpt: t('support.articles.tc7_excerpt'),
        readTime: '8 min',
        views: '2.5k'
      },
      {
        id: 'tc-8',
        title: t('support.articles.tc8'),
        excerpt: t('support.articles.tc8_excerpt'),
        readTime: '4 min',
        views: '2.1k'
      },
      {
        id: 'tc-9',
        title: t('support.articles.tc9'),
        excerpt: t('support.articles.tc9_excerpt'),
        readTime: '5 min',
        views: '1.9k'
      },
      {
        id: 'tc-10',
        title: t('support.articles.tc10'),
        excerpt: t('support.articles.tc10_excerpt'),
        readTime: '10 min',
        views: '1.6k'
      }
    ],
    'features': [
      {
        id: 'ft-1',
        title: t('support.popularArticles.reports'),
        excerpt: t('support.articles.ft1_excerpt'),
        readTime: '12 min',
        views: '6.2k',
        featured: true
      },
      {
        id: 'ft-2',
        title: t('support.articles.ft2'),
        excerpt: t('support.articles.ft2_excerpt'),
        readTime: '10 min',
        views: '5.4k',
        featured: true
      },
      {
        id: 'ft-3',
        title: t('support.articles.ft3'),
        excerpt: t('support.articles.ft3_excerpt'),
        readTime: '8 min',
        views: '4.8k'
      },
      {
        id: 'ft-4',
        title: t('support.articles.ft4'),
        excerpt: t('support.articles.ft4_excerpt'),
        readTime: '15 min',
        views: '4.2k'
      },
      {
        id: 'ft-5',
        title: t('support.articles.ft5'),
        excerpt: t('support.articles.ft5_excerpt'),
        readTime: '10 min',
        views: '3.8k'
      },
      {
        id: 'ft-6',
        title: t('support.articles.ft6'),
        excerpt: t('support.articles.ft6_excerpt'),
        readTime: '7 min',
        views: '3.2k'
      },
      {
        id: 'ft-7',
        title: t('support.articles.ft7'),
        excerpt: t('support.articles.ft7_excerpt'),
        readTime: '12 min',
        views: '2.9k'
      },
      {
        id: 'ft-8',
        title: t('support.articles.ft8'),
        excerpt: t('support.articles.ft8_excerpt'),
        readTime: '6 min',
        views: '2.5k'
      },
      {
        id: 'ft-9',
        title: t('support.articles.ft9'),
        excerpt: t('support.articles.ft9_excerpt'),
        readTime: '8 min',
        views: '2.2k'
      },
      {
        id: 'ft-10',
        title: t('support.articles.ft10'),
        excerpt: t('support.articles.ft10_excerpt'),
        readTime: '5 min',
        views: '1.9k'
      }
    ]
  };

  const category = categoryId ? categoryConfig[categoryId] : null;
  const articles = categoryId ? articlesByCategory[categoryId] || [] : [];

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featuredArticles = filteredArticles.filter(a => a.featured);
  const regularArticles = filteredArticles.filter(a => !a.featured);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-8 md:px-16 lg:px-24 text-center">
            <h1 className="text-3xl font-black mb-4">{t('support.categories.notFound')}</h1>
            <p className="text-gray-500 mb-8">{t('support.categories.notFoundDesc')}</p>
            <Link to="/support" className="text-paymint-green font-bold hover:underline">
              ← {t('support.articles.backToHelp')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const CategoryIcon = category.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Link
                to="/support"
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </Link>
              <div className={`w-12 h-12 ${category.bgColor} rounded-xl flex items-center justify-center text-white`}>
                <CategoryIcon size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight">{category.title}</h1>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">{category.description}</p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-xl mb-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('support.categories.searchInCategory', { category: category.title })}
              className="w-full pl-12 pr-11 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-paymint-green/50"
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
          </div>

          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Star size={18} className="text-yellow-500" />
                {t('support.articles.featuredTitle')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      to={`/support/article/${article.id}`}
                      className="block bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 hover:border-paymint-green/30 hover:shadow-lg transition-all group h-full"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${category.bgColor}/10 rounded-xl flex items-center justify-center flex-shrink-0`}>
                          <BookOpen size={20} className={category.color} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2 group-hover:text-paymint-green transition-colors">
                            {article.title}
                          </h3>
                          <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors mb-3">
                            {article.excerpt}
                          </p>
                          <div className="flex items-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {article.readTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={12} /> {article.views} {t('support.articles.views')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* All Articles */}
          <div>
            <h2 className="text-lg font-bold mb-4">
              {searchQuery ? t('support.articles.searchResultCount', { count: filteredArticles.length }) : t('support.articles.allTitle')}
            </h2>
            <div className="space-y-3">
              {regularArticles.map((article, index) => (
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
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors line-clamp-1">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden md:flex items-center gap-4 text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {article.readTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye size={12} /> {article.views}
                        </span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 group-hover:text-paymint-green group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {filteredArticles.length === 0 && (
              <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <HelpCircle size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{searchQuery.trim() ? t('common.noResults') : t('support.articles.notFound')}</h3>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors mb-6">
                  {searchQuery.trim() ? t('common.noMatchingResults', { entity: 'articles', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('support.articles.notFoundDesc')}
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-paymint-green font-bold hover:underline"
                >
                  {t('support.articles.clearSearch')}
                </button>
              </div>
            )}
          </div>

          {/* Help CTA */}
          <div className="mt-12 p-6 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{t('support.cta.stillNeedHelp')}</h3>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 transition-colors">{t('support.cta.stillNeedHelpDesc')}</p>
              </div>
              <Link
                to="/support/tickets/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-paymint-green text-black rounded-xl font-bold hover:shadow-lg hover:shadow-paymint-green/20 transition-all whitespace-nowrap"
              >
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

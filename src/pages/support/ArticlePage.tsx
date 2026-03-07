import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Printer,
  BookOpen,
  ChevronRight,
  MessageSquare,
  CheckCircle2
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';

export const ArticlePage = () => {
  const { t } = useTranslation();
  const { articleId } = useParams<{ articleId: string }>();
  const [helpful, setHelpful] = useState<'yes' | 'no' | null>(null);

  // All articles data
  const allArticles: Record<string, {
    id: string;
    title: string;
    category: string;
    categoryId: string;
    readTime: string;
    views: string;
    lastUpdated: string;
    content: string[];
    relatedArticles: string[];
  }> = {
    'gs-1': {
      id: 'gs-1',
      title: t('support.popularArticles.account'),
      category: t('support.categories.gettingStarted'),
      categoryId: 'getting-started',
      readTime: '5 min',
      views: '8.2k',
      lastUpdated: 'January 15, 2025',
      content: [
        `## ${t('support.articles.gs1.h1')}`,
        t('support.articles.gs1.p1'),
        `### ${t('support.articles.gs1.h2')}`,
        t('support.articles.gs1.p2'),
        `### ${t('support.articles.gs1.h3')}`,
        t('support.articles.gs1.p3'),
        `### ${t('support.articles.gs1.h4')}`,
        t('support.articles.gs1.p4'),
        `- **${t('support.articles.gs1.li1_label')}**: ${t('support.articles.gs1.li1_desc')}`,
        `- **${t('support.articles.gs1.li2_label')}**: ${t('support.articles.gs1.li2_desc')}`,
        `- **${t('support.articles.gs1.li3_label')}**: ${t('support.articles.gs1.li3_desc')}`,
        `- **${t('support.articles.gs1.li4_label')}**: ${t('support.articles.gs1.li4_desc')}`,
        `### ${t('support.articles.gs1.h5')}`,
        t('support.articles.gs1.p5'),
        `### ${t('support.articles.gs1.h6')}`,
        t('support.articles.gs1.p6'),
        `### ${t('support.articles.gs1.h7')}`,
        t('support.articles.gs1.p7')
      ],
      relatedArticles: ['gs-2', 'gs-3', 'gs-4']
    },
    'gs-2': {
      id: 'gs-2',
      title: t('support.popularArticles.establishment'),
      category: t('support.categories.gettingStarted'),
      categoryId: 'getting-started',
      readTime: '8 min',
      views: '6.5k',
      lastUpdated: 'January 20, 2025',
      content: [
        `## ${t('support.articles.gs2.h1')}`,
        t('support.articles.gs2.p1'),
        `### ${t('support.articles.gs2.h2')}`,
        t('support.articles.gs2.p2'),
        `- **${t('support.articles.gs2.li1_label')}**: ${t('support.articles.gs2.li1_desc')}`,
        `- **${t('support.articles.gs2.li2_label')}**: ${t('support.articles.gs2.li2_desc')}`,
        `- **${t('support.articles.gs2.li3_label')}**: ${t('support.articles.gs2.li3_desc')}`,
        `- **${t('support.articles.gs2.li4_label')}**: ${t('support.articles.gs2.li4_desc')}`,
        `### ${t('support.articles.gs2.h3')}`,
        t('support.articles.gs2.p3'),
        `- ${t('support.articles.gs2.li5')}`,
        `- ${t('support.articles.gs2.li6')}`,
        `- ${t('support.articles.gs2.li7')}`,
        `### ${t('support.articles.gs2.h4')}`,
        t('support.articles.gs2.p4'),
        `- **${t('support.articles.gs2.li8_label')}**: ${t('support.articles.gs2.li8_desc')}`,
        `- **${t('support.articles.gs2.li9_label')}**: ${t('support.articles.gs2.li9_desc')}`,
        `- **${t('support.articles.gs2.li10_label')}**: ${t('support.articles.gs2.li10_desc')}`,
        `### ${t('support.articles.gs2.h5')}`,
        t('support.articles.gs2.p5'),
        `- ${t('support.articles.gs2.li11')}`,
        `- ${t('support.articles.gs2.li12')}`,
        `- ${t('support.articles.gs2.li13')}`,
        `- ${t('support.articles.gs2.li14')}`,
        `### ${t('support.articles.gs2.h6')}`,
        t('support.articles.gs2.p6'),
        `- ${t('support.articles.gs2.li15')}`,
        `- ${t('support.articles.gs2.li16')}`,
        `- ${t('support.articles.gs2.li17')}`,
        `- ${t('support.articles.gs2.li18')}`
      ],
      relatedArticles: ['gs-1', 'gs-5', 'ft-8']
    },
    'tc-1': {
      id: 'tc-1',
      title: t('support.popularArticles.printer'),
      category: t('support.categories.technical'),
      categoryId: 'technical',
      readTime: '8 min',
      views: '5.6k',
      lastUpdated: 'February 1, 2025',
      content: [
        `## ${t('support.articles.tc1.h1')}`,
        t('support.articles.tc1.p1'),
        `### ${t('support.articles.tc1.h2')}`,
        t('support.articles.tc1.p2'),
        `- ${t('support.articles.tc1.li1')}`,
        `- ${t('support.articles.tc1.li2')}`,
        `- ${t('support.articles.tc1.li3')}`,
        `- ${t('support.articles.tc1.li4')}`,
        `### ${t('support.articles.tc1.h3')}`,
        t('support.articles.tc1.p3'),
        `- ${t('support.articles.tc1.li5')}`,
        `- ${t('support.articles.tc1.li6')}`,
        `- ${t('support.articles.tc1.li7')}`,
        `### ${t('support.articles.tc1.h4')}`,
        `**${t('support.articles.tc1.step1_label')}**`,
        t('support.articles.tc1.step1_desc'),
        `**${t('support.articles.tc1.step2_label')}**`,
        t('support.articles.tc1.step2_desc'),
        `**${t('support.articles.tc1.step3_label')}**`,
        t('support.articles.tc1.step3_desc'),
        `**${t('support.articles.tc1.step4_label')}**`,
        t('support.articles.tc1.step4_desc'),
        `**${t('support.articles.tc1.step5_label')}**`,
        t('support.articles.tc1.step5_desc'),
        `### ${t('support.articles.tc1.h5')}`,
        `**${t('support.articles.tc1.q1')}**`,
        `- ${t('support.articles.tc1.a1_1')}`,
        `- ${t('support.articles.tc1.a1_2')}`,
        `- ${t('support.articles.tc1.a1_3')}`,
        `**${t('support.articles.tc1.q2')}**`,
        `- ${t('support.articles.tc1.a2_1')}`,
        `- ${t('support.articles.tc1.a2_2')}`,
        `**${t('support.articles.tc1.q3')}**`,
        `- ${t('support.articles.tc1.a3_1')}`,
        `- ${t('support.articles.tc1.a3_2')}`,
        `- ${t('support.articles.tc1.a3_3')}`
      ],
      relatedArticles: ['tc-5', 'tc-6', 'gs-5']
    },
    'ft-1': {
      id: 'ft-1',
      title: t('support.popularArticles.reports'),
      category: t('support.categories.features'),
      categoryId: 'features',
      readTime: '12 min',
      views: '6.2k',
      lastUpdated: 'January 28, 2025',
      content: [
        `## ${t('support.articles.ft1.h1')}`,
        t('support.articles.ft1.p1'),
        `### ${t('support.articles.ft1.h2')}`,
        t('support.articles.ft1.p2'),
        `### ${t('support.articles.ft1.h3')}`,
        t('support.articles.ft1.p3'),
        `- **${t('support.articles.ft1.li1_label')}**: ${t('support.articles.ft1.li1_desc')}`,
        `- **${t('support.articles.ft1.li2_label')}**: ${t('support.articles.ft1.li2_desc')}`,
        `- **${t('support.articles.ft1.li3_label')}**: ${t('support.articles.ft1.li3_desc')}`,
        `- **${t('support.articles.ft1.li4_label')}**: ${t('support.articles.ft1.li4_desc')}`,
        `### ${t('support.articles.ft1.h4')}`,
        t('support.articles.ft1.p4'),
        `- ${t('support.articles.ft1.li5')}`,
        `- ${t('support.articles.ft1.li6')}`,
        `- ${t('support.articles.ft1.li7')}`,
        `- ${t('support.articles.ft1.li8')}`,
        `### ${t('support.articles.ft1.h5')}`,
        `**${t('support.articles.ft1.type1_label')}**`,
        t('support.articles.ft1.type1_desc'),
        `**${t('support.articles.ft1.type2_label')}**`,
        t('support.articles.ft1.type2_desc'),
        `**${t('support.articles.ft1.type3_label')}**`,
        t('support.articles.ft1.type3_desc'),
        `**${t('support.articles.ft1.type4_label')}**`,
        t('support.articles.ft1.type4_desc'),
        `**${t('support.articles.ft1.type5_label')}**`,
        t('support.articles.ft1.type5_desc'),
        `**${t('support.articles.ft1.type6_label')}**`,
        t('support.articles.ft1.type6_desc'),
        `### ${t('support.articles.ft1.h6')}`,
        t('support.articles.ft1.p5'),
        `- ${t('support.articles.ft1.li9')}`,
        `- ${t('support.articles.ft1.li10')}`,
        `- ${t('support.articles.ft1.li11')}`,
        t('support.articles.ft1.p6'),
        `### ${t('support.articles.ft1.h7')}`,
        `- ${t('support.articles.ft1.li12')}`,
        `- ${t('support.articles.ft1.li13')}`,
        `- ${t('support.articles.ft1.li14')}`,
        `- ${t('support.articles.ft1.li15')}`
      ],
      relatedArticles: ['ft-10', 'ft-4', 'ft-5']
    },
    'bl-2': {
      id: 'bl-2',
      title: t('support.popularArticles.payment'),
      category: t('support.categories.billing'),
      categoryId: 'billing',
      readTime: '3 min',
      views: '3.8k',
      lastUpdated: 'February 5, 2025',
      content: [
        `## ${t('support.articles.bl2.h1')}`,
        t('support.articles.bl2.p1'),
        `### ${t('support.articles.bl2.h2')}`,
        `1. ${t('support.articles.bl2.li1')}`,
        `2. ${t('support.articles.bl2.li2')}`,
        `3. ${t('support.articles.bl2.li3')}`,
        `### ${t('support.articles.bl2.h3')}`,
        `1. ${t('support.articles.bl2.li4')}`,
        `2. ${t('support.articles.bl2.li5')}`,
        `- ${t('support.articles.bl2.li6')}`,
        `- ${t('support.articles.bl2.li7')}`,
        `- ${t('support.articles.bl2.li8')}`,
        `- ${t('support.articles.bl2.li9')}`,
        `3. ${t('support.articles.bl2.li10')}`,
        `### ${t('support.articles.bl2.h4')}`,
        t('support.articles.bl2.p2'),
        `1. ${t('support.articles.bl2.li11')}`,
        `2. ${t('support.articles.bl2.li12')}`,
        `3. ${t('support.articles.bl2.li13')}`,
        `### ${t('support.articles.bl2.h5')}`,
        `1. ${t('support.articles.bl2.li14')}`,
        `2. ${t('support.articles.bl2.li15')}`,
        `3. ${t('support.articles.bl2.li16')}`,
        `**${t('support.articles.bl2.note_label')}**: ${t('support.articles.bl2.note_desc')}`,
        `### ${t('support.articles.bl2.h6')}`,
        t('support.articles.bl2.p3'),
        `1. ${t('support.articles.bl2.li17')}`,
        `2. ${t('support.articles.bl2.li18')}`,
        `3. ${t('support.articles.bl2.li19')}`,
        `4. ${t('support.articles.bl2.li20')}`,
        `5. ${t('support.articles.bl2.li21')}`
      ],
      relatedArticles: ['bl-1', 'bl-3', 'bl-7']
    }
  };

  // Add more basic article stubs for all the article IDs we reference
  const articleStubs = [
    'gs-3', 'gs-4', 'gs-5', 'gs-6', 'gs-7', 'gs-8',
    'bl-1', 'bl-3', 'bl-4', 'bl-5', 'bl-6', 'bl-7', 'bl-8',
    'tc-2', 'tc-3', 'tc-4', 'tc-5', 'tc-6', 'tc-7', 'tc-8', 'tc-9', 'tc-10',
    'ft-2', 'ft-3', 'ft-4', 'ft-5', 'ft-6', 'ft-7', 'ft-8', 'ft-9', 'ft-10'
  ];

  // Generate stub articles for any not fully defined
  articleStubs.forEach(id => {
    if (!allArticles[id]) {
      const prefix = id.split('-')[0];
      const categoryMap: Record<string, { name: string; id: string }> = {
        'gs': { name: t('support.categories.gettingStarted'), id: 'getting-started' },
        'bl': { name: t('support.categories.billing'), id: 'billing' },
        'tc': { name: t('support.categories.technical'), id: 'technical' },
        'ft': { name: t('support.categories.features'), id: 'features' }
      };
      const cat = categoryMap[prefix];
      const articleKey = id.replace('-', '');
      const translatedTitle = t(`support.articles.${articleKey}`, { defaultValue: '' });
      const translatedExcerpt = t(`support.articles.${articleKey}_excerpt`, { defaultValue: '' });
      
      const realTitle = translatedTitle || `${t('support.articles.stubTitle')} ${id}`;
      
      allArticles[id] = {
        id,
        title: realTitle,
        category: cat.name,
        categoryId: cat.id,
        readTime: '4 min',
        views: `${(Math.random() * 5 + 1).toFixed(1)}k`,
        lastUpdated: 'February 2025',
        content: [
          `## ${t('support.genericArticle.overview')}`,
          translatedExcerpt || t('support.genericArticle.p1'),
          t('support.genericArticle.p2'),
          `### ${t('support.genericArticle.stepsTitle')}`,
          t('support.genericArticle.stepsDesc'),
          `- **${t('support.genericArticle.step1Label')}**: ${t('support.genericArticle.step1Desc')}`,
          `- **${t('support.genericArticle.step2Label')}**: ${t('support.genericArticle.step2Desc')}`,
          `- **${t('support.genericArticle.step3Label')}**: ${t('support.genericArticle.step3Desc')}`,
          `### ${t('support.genericArticle.bestPracticesTitle')}`,
          t('support.genericArticle.bestPracticesDesc'),
          `### ${t('support.genericArticle.faqTitle')}`,
          `**${t('support.genericArticle.q1')}**`,
          t('support.genericArticle.a1'),
          `**${t('support.genericArticle.q2')}**`,
          t('support.genericArticle.a2')
        ],
        relatedArticles: []
      };
    }
  });

  const article = articleId ? allArticles[articleId] : null;

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
        <Navbar />
        <main className="pt-28 pb-20">
          <div className="container mx-auto px-8 md:px-16 lg:px-24 text-center">
            <h1 className="text-3xl font-black mb-4">{t('support.articles.notFound')}</h1>
            <p className="text-gray-500 mb-8">{t('support.articles.notFoundDescDetail')}</p>
            <Link to="/support" className="text-paymint-green font-bold hover:underline">
              ← {t('support.articles.backToHelp')}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const relatedArticleData = article.relatedArticles
    .map(id => allArticles[id])
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] font-sans text-gray-900 dark:text-white">
      <Navbar />

      <main className="pt-28 pb-20">
        <div className="container mx-auto px-8 md:px-16 lg:px-24">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
              <Link to="/support" className="hover:text-paymint-green transition-colors">
                {t('support.hero.badge')}
              </Link>
              <ChevronRight size={14} />
              <Link to={`/support/category/${article.categoryId}`} className="hover:text-paymint-green transition-colors">
                {article.category}
              </Link>
              <ChevronRight size={14} />
              <span className="text-gray-400 truncate">{article.title}</span>
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Link
                to={`/support/category/${article.categoryId}`}
                className="inline-flex items-center gap-2 text-sm font-bold text-paymint-green hover:underline mb-4"
              >
                <ArrowLeft size={16} />
                {t('support.articles.backTo')} {article.category}
              </Link>

              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {article.readTime} {t('support.articles.read')}
                </span>
                <span className="flex items-center gap-1">
                  <Eye size={14} />
                  {article.views} {t('support.articles.views')}
                </span>
                <span>
                  {t('support.articles.updated')} {article.lastUpdated}
                </span>
              </div>
            </motion.div>

            {/* Article Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-8 md:p-12 mb-8"
            >
              <div className="prose prose-lg dark:prose-invert max-w-none">
                {article.content.map((paragraph, index) => {
                  if (paragraph.startsWith('## ')) {
                    return (
                      <h2 key={index} className="text-2xl font-black mt-8 mb-4 first:mt-0">
                        {paragraph.replace('## ', '')}
                      </h2>
                    );
                  }
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h3 key={index} className="text-xl font-bold mt-6 mb-3">
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                    return (
                      <p key={index} className="font-bold my-4">
                        {paragraph.replace(/\*\*/g, '')}
                      </p>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <ul key={index} className="list-disc list-inside my-2 ml-4">
                        <li>{paragraph.replace('- ', '')}</li>
                      </ul>
                    );
                  }
                  return (
                    <p key={index} className="my-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </motion.div>

            {/* Helpful? */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 mb-8"
            >
              {helpful === null ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <p className="font-bold">{t('support.articles.helpfulQuestion')}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setHelpful('yes')}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg font-bold hover:bg-green-200 dark:hover:bg-green-500/30 transition-colors"
                    >
                      <ThumbsUp size={16} />
                      {t('support.articles.helpfulYes')}
                    </button>
                    <button
                      onClick={() => setHelpful('no')}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                    >
                      <ThumbsDown size={16} />
                      {t('support.articles.helpfulNo')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-paymint-green">
                  <CheckCircle2 size={20} />
                  <p className="font-bold">
                    {helpful === 'yes'
                      ? t('support.articles.feedbackThanks')
                      : t('support.articles.feedbackSorry')}
                  </p>
                </div>
              )}
            </motion.div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 mb-12">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                <Share2 size={16} />
                {t('common.share')}
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                <Printer size={16} />
                {t('common.print')}
              </button>
              <Link
                to="/support/tickets/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
              >
                <MessageSquare size={16} />
                {t('support.quickLinks.submitTicket')}
              </Link>
            </div>

            {/* Related Articles */}
            {relatedArticleData.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-4">{t('support.articles.related')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedArticleData.map((related, index) => (
                    <motion.div
                      key={related.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                    >
                      <Link
                        to={`/support/article/${related.id}`}
                        className="block p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:border-paymint-green/30 transition-all group h-full"
                      >
                        <div className="w-10 h-10 bg-paymint-green/10 rounded-lg flex items-center justify-center mb-3">
                          <BookOpen size={18} className="text-paymint-green" />
                        </div>
                        <h4 className="font-bold mb-2 group-hover:text-paymint-green transition-colors line-clamp-2">
                          {related.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock size={12} />
                          {related.readTime}
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

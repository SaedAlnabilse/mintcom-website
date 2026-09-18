import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Clock, Eye, ThumbsUp, ThumbsDown, Share2,
  Printer, ChevronRight, MessageSquare, CheckCircle2,
  Calendar, BookOpen,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { getArticleViews, useSupportArticleMetrics } from '../../hooks/useSupportArticleMetrics';
import { getLocalizedSupportArticleContent, SUPPORT_ARTICLE_RELATED } from '../../data/supportArticleContent';

/* ── render a single content line ── */
function ContentLine({ line, index }: { line: string; index: number }) {
  if (line.startsWith('## ')) {
    return <h2 key={index} className="font-barlow mb-4 mt-10 text-2xl font-bold tracking-tight text-stone-900 first:mt-0 dark:text-zinc-100">{line.slice(3)}</h2>;
  }
  if (line.startsWith('### ')) {
    return <h3 key={index} className="font-barlow mb-3 mt-7 text-lg font-bold text-stone-900 dark:text-zinc-100">{line.slice(4)}</h3>;
  }
  if (/^\d+\.\s/.test(line)) {
    const num = line.match(/^(\d+)\.\s(.*)/)!;
    return (
      <div key={index} className="my-1.5 flex items-start gap-3">
        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mintcom-green" />
        <span className="text-[15px] leading-relaxed text-stone-600 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: num[2].replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }
  if (line.startsWith('- ')) {
    return (
      <div key={index} className="my-1.5 flex items-start gap-3">
        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mintcom-green" />
        <span className="text-[15px] leading-relaxed text-stone-600 dark:text-zinc-300" dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }
  if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
    return <p key={index} className="mb-2 mt-5 text-[15px] font-bold text-stone-800 dark:text-zinc-200">{line.slice(2, -2)}</p>;
  }
  if (line.trim() === '') return <div key={index} className="h-2" />;
  return (
    <p key={index} className="my-3 text-[15px] leading-relaxed text-stone-600 dark:text-zinc-300"
      dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
  );
}

export const ArticlePage = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage || i18n.language || 'en';
  const { articleId } = useParams<{ articleId: string }>();
  const navigate = useNavigate();
  const isRtl = t('common.locale') === 'ar';
  const [helpful, setHelpful] = useState<'yes' | 'no' | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleShare = async () => {
    const url  = window.location.href;
    const title = article?.title ?? 'Help Article';
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('common.linkCopied', 'Link copied to clipboard'));
    }
  };

  const handleSubmitTicket = () => {
    if (isAuthenticated) {
      navigate('/support/tickets/new');
    } else {
      setShowLoginModal(true);
    }
  };

  const allArticles = useMemo(() => {
    const articleStats: Record<string, { readTime: string; views: string }> = {
      'gs-1': { readTime: '5 min', views: '8.2k' },
      'gs-2': { readTime: '8 min', views: '6.5k' },
      'gs-3': { readTime: '10 min', views: '5.8k' },
      'gs-4': { readTime: '6 min', views: '4.2k' },
      'gs-5': { readTime: '7 min', views: '3.9k' },
      'gs-6': { readTime: '5 min', views: '3.5k' },
      'gs-7': { readTime: '8 min', views: '3.1k' },
      'gs-8': { readTime: '4 min', views: '2.8k' },
      'gs-9': { readTime: '5 min', views: '2.4k' },
      'gs-10': { readTime: '6 min', views: '2.0k' },
      'gs-11': { readTime: '7 min', views: '1.8k' },
      'bl-1': { readTime: '6 min', views: '4.5k' },
      'bl-2': { readTime: '3 min', views: '3.8k' },
      'bl-3': { readTime: '4 min', views: '3.2k' },
      'bl-4': { readTime: '5 min', views: '2.9k' },
      'bl-5': { readTime: '4 min', views: '2.1k' },
      'bl-6': { readTime: '3 min', views: '1.8k' },
      'bl-7': { readTime: '5 min', views: '1.5k' },
      'bl-8': { readTime: '4 min', views: '1.2k' },
      'bl-9': { readTime: '4 min', views: '1.1k' },
      'bl-10': { readTime: '5 min', views: '0.9k' },
      'bl-11': { readTime: '4 min', views: '0.8k' },
      'tc-1': { readTime: '8 min', views: '5.6k' },
      'tc-2': { readTime: '6 min', views: '4.8k' },
      'tc-3': { readTime: '7 min', views: '4.2k' },
      'tc-4': { readTime: '5 min', views: '3.8k' },
      'tc-5': { readTime: '6 min', views: '3.2k' },
      'tc-6': { readTime: '7 min', views: '2.9k' },
      'tc-7': { readTime: '8 min', views: '2.5k' },
      'tc-8': { readTime: '4 min', views: '2.1k' },
      'tc-9': { readTime: '5 min', views: '1.9k' },
      'tc-10': { readTime: '10 min', views: '1.6k' },
      'tc-11': { readTime: '6 min', views: '1.4k' },
      'tc-12': { readTime: '5 min', views: '1.2k' },
      'tc-13': { readTime: '4 min', views: '1.0k' },
      'ft-1': { readTime: '12 min', views: '6.2k' },
      'ft-2': { readTime: '10 min', views: '5.4k' },
      'ft-3': { readTime: '8 min', views: '4.8k' },
      'ft-4': { readTime: '15 min', views: '4.2k' },
      'ft-5': { readTime: '10 min', views: '3.8k' },
      'ft-6': { readTime: '7 min', views: '3.2k' },
      'ft-7': { readTime: '12 min', views: '2.9k' },
      'ft-8': { readTime: '6 min', views: '2.5k' },
      'ft-9': { readTime: '8 min', views: '2.2k' },
      'ft-10': { readTime: '5 min', views: '1.9k' },
      'ft-11': { readTime: '5 min', views: '1.7k' },
      'ft-12': { readTime: '5 min', views: '1.5k' },
      'ft-13': { readTime: '7 min', views: '1.3k' },
    };

    const titleKeyById: Record<string, string> = {
      'gs-1': 'support.popularArticles.account',
      'gs-2': 'support.popularArticles.establishment',
      'bl-2': 'support.popularArticles.payment',
      'tc-1': 'support.popularArticles.printer',
      'ft-1': 'support.popularArticles.reports',
    };

    const catMap: Record<string, { name: string; id: string }> = {
      gs: { name: t('support.categories.gettingStarted'), id: 'getting-started' },
      bl: { name: t('support.categories.billing'),        id: 'billing'         },
      tc: { name: t('support.categories.technical'),      id: 'technical'       },
      ft: { name: t('support.categories.features'),       id: 'features'        },
    };

    const fallbackContent = (excerpt: string) => [
      `## ${t('support.genericArticle.overview')}`,
      excerpt || t('support.genericArticle.p1'),
      t('support.genericArticle.p2'),
      `### ${t('support.genericArticle.stepsTitle')}`,
      t('support.genericArticle.stepsDesc'),
      `- **${t('support.genericArticle.step1Label')}**: ${t('support.genericArticle.step1Desc')}`,
      `- **${t('support.genericArticle.step2Label')}**: ${t('support.genericArticle.step2Desc')}`,
      `- **${t('support.genericArticle.step3Label')}**: ${t('support.genericArticle.step3Desc')}`,
    ];

    const articles: Record<string, {
      id: string; title: string; category: string; categoryId: string;
      readTime: string; views: string; lastUpdated: string;
      content: string[]; relatedArticles: string[];
    }> = {};

    Object.entries(articleStats).forEach(([id, stats]) => {
      const prefix = id.split('-')[0];
      const cat = catMap[prefix];
      const key = id.replace('-', '');
      const title = t(titleKeyById[id] ?? `support.articles.${key}`, { defaultValue: `Article ${id}` });
      const excerpt = t(`support.articles.${key}_excerpt`, { defaultValue: '' });

      articles[id] = {
        id,
        title,
        category: cat.name,
        categoryId: cat.id,
        readTime: stats.readTime,
        views: stats.views,
        lastUpdated: 'May 2026',
        content: [...(getLocalizedSupportArticleContent(currentLanguage, id) ?? fallbackContent(excerpt))],
        relatedArticles: [...(SUPPORT_ARTICLE_RELATED[id] ?? [])],
      };
    });

    return articles;
  }, [t, currentLanguage]);

  const article = articleId ? allArticles[articleId] : null;
  const related = article ? article.relatedArticles.map(id => allArticles[id]).filter(Boolean) : [];
  const { metrics, recordView, submitFeedback } = useSupportArticleMetrics(Object.keys(allArticles));
  const displayedViews = article ? getArticleViews(metrics, article.id, article.views) : '';

  useEffect(() => {
    if (article?.id) {
      recordView(article.id);
    }
  }, [article?.id, recordView]);

  const handleHelpfulVote = async (vote: 'yes' | 'no') => {
    if (!article) return;

    try {
      await submitFeedback(article.id, vote === 'yes' ? 'useful' : 'not_useful');
      setHelpful(vote);
    } catch {
      toast.error(t('support.articles.feedbackFailed', 'Could not save feedback. Please try again.'));
    }
  };

  if (!article) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
        <Navbar hideCommercialLinks />
        <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-32 text-center">
          <h1 className="font-magilio mb-4 text-3xl font-bold">{t('support.articles.notFound')}</h1>
          <Link to="/support" className="text-sm font-semibold text-mintcom-greenInk dark:text-mintcom-green hover:underline">{t('support.articles.backToHelp')}</Link>
        </main>
        <Footer hideCommercialLinks />
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-cream-100 font-sans text-stone-900 dark:bg-zinc-950 dark:text-zinc-100">
      <Navbar hideCommercialLinks />

      {/* ── Header ── */}
      <header className="border-b border-stone-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-5xl px-6 pb-10 pt-28">
          <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-stone-400">
            <Link to="/support" className="hover:text-stone-700 dark:hover:text-zinc-200">{t('support.hero.badge')}</Link>
            <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
            <Link to={`/support/category/${article.categoryId}`} className="hover:text-stone-700 dark:hover:text-zinc-200">{article.category}</Link>
            <ChevronRight size={12} className={isRtl ? 'rotate-180' : ''} />
            <span className="max-w-[220px] truncate text-stone-500 dark:text-zinc-500">{article.title}</span>
          </nav>

          <h1 className="font-magilio max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-[42px] md:leading-[1.15]">
            {article.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-stone-500 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1.5"><Clock size={13} /> {article.readTime} {t('support.articles.read')}</span>
            <span className="inline-flex items-center gap-1.5"><Eye size={13} /> {displayedViews} {t('support.articles.views')}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> {t('support.articles.updated')} {article.lastUpdated}</span>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_300px]">

          <div className="min-w-0">
            <article className="rounded-2xl border border-stone-200 bg-white p-7 dark:border-zinc-800 dark:bg-zinc-900/60 md:p-10">
              {article.content.map((line, i) => <ContentLine key={i} line={line} index={i} />)}
            </article>

            {/* Feedback */}
            <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              {helpful === null ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-[15px] font-semibold">{t('support.articles.helpfulQuestion')}</p>
                  <div className="flex gap-2">
                    <button onClick={() => handleHelpfulVote('yes')}
                      className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold transition-colors hover:border-mintcom-green hover:text-mintcom-green dark:border-zinc-700">
                      <ThumbsUp size={15} /> {t('support.articles.helpfulYes')}
                    </button>
                    <button onClick={() => handleHelpfulVote('no')}
                      className="inline-flex items-center gap-2 rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-700 dark:border-zinc-700 dark:text-zinc-400">
                      <ThumbsDown size={15} /> {t('support.articles.helpfulNo')}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="flex items-center gap-2 text-[15px] font-semibold text-mintcom-greenInk dark:text-mintcom-green">
                  <CheckCircle2 size={17} />
                  {helpful === 'yes' ? t('support.articles.feedbackThanks') : t('support.articles.feedbackSorry')}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { icon: Share2,  label: t('common.share'), action: handleShare },
                { icon: Printer, label: t('common.print'), action: () => window.print() },
              ].map(({ icon: Icon, label, action }) => (
                <button key={label} onClick={action}
                  className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-300">
                  <Icon size={14} /> {label}
                </button>
              ))}
              <button onClick={handleSubmitTicket}
                className="inline-flex items-center gap-2 rounded-xl bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110">
                <MessageSquare size={14} /> {t('support.quickLinks.submitTicket')}
              </button>
            </div>

            {/* Related */}
            {related.length > 0 && (
              <div className="mt-10">
                <h2 className="font-magilio mb-1 text-xl font-bold tracking-tight">{t('support.articles.related')}</h2>
                <div className="divide-y divide-stone-200 dark:divide-zinc-800">
                  {related.map((rel) => (
                    <Link key={rel.id} to={`/support/article/${rel.id}`} className="group flex items-center gap-3 py-3.5">
                      <BookOpen size={15} className="shrink-0 text-stone-400" />
                      <span className="min-w-0 flex-1 truncate text-[15px] font-semibold group-hover:underline group-hover:decoration-mintcom-green group-hover:decoration-2 group-hover:underline-offset-4">
                        {rel.title}
                      </span>
                      <span className="hidden shrink-0 items-center gap-1 text-xs text-stone-400 sm:inline-flex">
                        <Clock size={11} /> {rel.readTime}
                      </span>
                      <ChevronRight size={15} className={`shrink-0 text-stone-300 group-hover:text-stone-500 ${isRtl ? 'rotate-180' : ''}`} />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden h-fit lg:sticky lg:top-24 lg:block">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-[13px] font-semibold text-stone-500 dark:text-zinc-400">{article.category}</p>
              <h3 className="font-barlow mt-1 text-[15px] font-bold leading-snug">{article.title}</h3>
              <dl className="mt-4 space-y-2.5 border-t border-stone-200 pt-4 text-xs dark:border-zinc-800">
                {[
                  { icon: Clock,    label: t('support.articles.read'),    value: article.readTime    },
                  { icon: Eye,      label: t('support.articles.views'),   value: displayedViews      },
                  { icon: Calendar, label: t('support.articles.updated'), value: article.lastUpdated },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-stone-400"><Icon size={12} /> {label}</dt>
                    <dd className="font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-3 rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              <p className="text-[15px] font-bold">{t('support.cta.stillNeedHelp')}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-stone-500 dark:text-zinc-400">{t('support.cta.stillNeedHelpDesc')}</p>
              <button onClick={handleSubmitTicket}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110">
                <MessageSquare size={14} />
                {t('support.quickLinks.submitTicket')}
              </button>
            </div>
          </aside>

        </div>
      </main>

      <Footer hideCommercialLinks />
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

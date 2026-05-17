import { useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, Eye, ThumbsUp, ThumbsDown, Share2,
  Printer, BookOpen, ChevronRight, MessageSquare, CheckCircle2,
  Zap, CreditCard, Settings, Calendar,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const catAccent: Record<string, { bg: string; light: string; border: string; text: string }> = {
  'getting-started': { bg: 'bg-blue-500',     light: 'bg-blue-50 dark:bg-blue-500/10',     border: 'border-blue-200 dark:border-blue-500/20',    text: 'text-blue-600 dark:text-blue-400'    },
  billing:           { bg: 'bg-purple-500',   light: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
  technical:         { bg: 'bg-orange-500',   light: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-200 dark:border-orange-500/20', text: 'text-orange-600 dark:text-orange-400' },
  features:          { bg: 'bg-mintcom-green',light: 'bg-mintcom-green/8 dark:bg-mintcom-green/10',border: 'border-mintcom-green/25',text: 'text-mintcom-green' },
};

const catIcon: Record<string, React.ElementType> = {
  'getting-started': Zap,
  billing:           CreditCard,
  technical:         Settings,
  features:          BookOpen,
};

/* ── render a single content line ── */
function ContentLine({ line, index }: { line: string; index: number }) {
  if (line.startsWith('## ')) {
    return <h2 key={index} className="font-barlow mt-10 mb-4 text-2xl font-black tracking-tight text-gray-900 first:mt-0 dark:text-white">{line.slice(3)}</h2>;
  }
  if (line.startsWith('### ')) {
    return <h3 key={index} className="font-barlow mt-7 mb-3 text-lg font-bold text-gray-900 dark:text-white">{line.slice(4)}</h3>;
  }
  if (/^\d+\.\s/.test(line)) {
    const num = line.match(/^(\d+)\.\s(.*)/)!;
    return (
      <div key={index} className="my-1.5 flex items-start gap-3">
        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mintcom-green" />
        <span className="text-sm leading-relaxed text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: num[2].replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }
  if (line.startsWith('- ')) {
    return (
      <div key={index} className="my-1.5 flex items-start gap-3">
        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-mintcom-green" />
        <span className="text-sm leading-relaxed text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: line.slice(2).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
      </div>
    );
  }
  if (line.startsWith('**') && line.endsWith('**') && !line.slice(2, -2).includes('**')) {
    return <p key={index} className="mt-5 mb-2 text-sm font-bold text-gray-800 dark:text-gray-200">{line.slice(2, -2)}</p>;
  }
  if (line.trim() === '') return <div key={index} className="h-2" />;
  return (
    <p key={index} className="my-3 text-sm leading-relaxed text-gray-600 dark:text-gray-300"
      dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
  );
}

export const ArticlePage = () => {
  const { t } = useTranslation();
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
    const articles: Record<string, {
      id: string; title: string; category: string; categoryId: string;
      readTime: string; views: string; lastUpdated: string;
      content: string[]; relatedArticles: string[];
    }> = {
      'gs-1': { id: 'gs-1', title: t('support.popularArticles.account'),      category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '5 min',  views: '8.2k', lastUpdated: 'May 2026',
        content: [`## ${t('support.articles.gs1.h1')}`,t('support.articles.gs1.p1'),`### ${t('support.articles.gs1.h2')}`,t('support.articles.gs1.p2'),`### ${t('support.articles.gs1.h3')}`,t('support.articles.gs1.p3'),`### ${t('support.articles.gs1.h4')}`,t('support.articles.gs1.p4'),`- **${t('support.articles.gs1.li1_label')}**: ${t('support.articles.gs1.li1_desc')}`,`- **${t('support.articles.gs1.li2_label')}**: ${t('support.articles.gs1.li2_desc')}`,`- **${t('support.articles.gs1.li3_label')}**: ${t('support.articles.gs1.li3_desc')}`,`- **${t('support.articles.gs1.li4_label')}**: ${t('support.articles.gs1.li4_desc')}`,`### ${t('support.articles.gs1.h5')}`,t('support.articles.gs1.p5'),`### ${t('support.articles.gs1.h6')}`,t('support.articles.gs1.p6'),`### ${t('support.articles.gs1.h7')}`,t('support.articles.gs1.p7')],
        relatedArticles: ['gs-2','gs-3','gs-4'] },
      'gs-2': { id: 'gs-2', title: t('support.popularArticles.establishment'), category: t('support.categories.gettingStarted'), categoryId: 'getting-started', readTime: '8 min',  views: '6.5k', lastUpdated: 'May 2026',
        content: [`## ${t('support.articles.gs2.h1')}`,t('support.articles.gs2.p1'),`### ${t('support.articles.gs2.h2')}`,t('support.articles.gs2.p2'),`- **${t('support.articles.gs2.li1_label')}**: ${t('support.articles.gs2.li1_desc')}`,`- **${t('support.articles.gs2.li2_label')}**: ${t('support.articles.gs2.li2_desc')}`,`- **${t('support.articles.gs2.li3_label')}**: ${t('support.articles.gs2.li3_desc')}`,`- **${t('support.articles.gs2.li4_label')}**: ${t('support.articles.gs2.li4_desc')}`,`### ${t('support.articles.gs2.h3')}`,t('support.articles.gs2.p3'),`- ${t('support.articles.gs2.li5')}`,`- ${t('support.articles.gs2.li6')}`,`- ${t('support.articles.gs2.li7')}`,`### ${t('support.articles.gs2.h4')}`,t('support.articles.gs2.p4'),`- **${t('support.articles.gs2.li8_label')}**: ${t('support.articles.gs2.li8_desc')}`,`- **${t('support.articles.gs2.li9_label')}**: ${t('support.articles.gs2.li9_desc')}`,`- **${t('support.articles.gs2.li10_label')}**: ${t('support.articles.gs2.li10_desc')}`,`### ${t('support.articles.gs2.h5')}`,t('support.articles.gs2.p5'),`- ${t('support.articles.gs2.li11')}`,`- ${t('support.articles.gs2.li12')}`,`- ${t('support.articles.gs2.li13')}`,`- ${t('support.articles.gs2.li14')}`,`### ${t('support.articles.gs2.h6')}`,t('support.articles.gs2.p6'),`- ${t('support.articles.gs2.li15')}`,`- ${t('support.articles.gs2.li16')}`,`- ${t('support.articles.gs2.li17')}`,`- ${t('support.articles.gs2.li18')}`],
        relatedArticles: ['gs-1','gs-5','ft-8'] },
      'tc-1': { id: 'tc-1', title: t('support.popularArticles.printer'),       category: t('support.categories.technical'),      categoryId: 'technical',       readTime: '8 min',  views: '5.6k', lastUpdated: 'May 2026',
        content: [`## ${t('support.articles.tc1.h1')}`,t('support.articles.tc1.p1'),`### ${t('support.articles.tc1.h2')}`,t('support.articles.tc1.p2'),`- ${t('support.articles.tc1.li1')}`,`- ${t('support.articles.tc1.li2')}`,`- ${t('support.articles.tc1.li3')}`,`- ${t('support.articles.tc1.li4')}`,`### ${t('support.articles.tc1.h3')}`,t('support.articles.tc1.p3'),`- ${t('support.articles.tc1.li5')}`,`- ${t('support.articles.tc1.li6')}`,`- ${t('support.articles.tc1.li7')}`,`### ${t('support.articles.tc1.h4')}`,`**${t('support.articles.tc1.step1_label')}**`,t('support.articles.tc1.step1_desc'),`**${t('support.articles.tc1.step2_label')}**`,t('support.articles.tc1.step2_desc'),`**${t('support.articles.tc1.step3_label')}**`,t('support.articles.tc1.step3_desc'),`**${t('support.articles.tc1.step4_label')}**`,t('support.articles.tc1.step4_desc'),`**${t('support.articles.tc1.step5_label')}**`,t('support.articles.tc1.step5_desc'),`### ${t('support.articles.tc1.h5')}`,`**${t('support.articles.tc1.q1')}**`,`- ${t('support.articles.tc1.a1_1')}`,`- ${t('support.articles.tc1.a1_2')}`,`- ${t('support.articles.tc1.a1_3')}`,`**${t('support.articles.tc1.q2')}**`,`- ${t('support.articles.tc1.a2_1')}`,`- ${t('support.articles.tc1.a2_2')}`,`**${t('support.articles.tc1.q3')}**`,`- ${t('support.articles.tc1.a3_1')}`,`- ${t('support.articles.tc1.a3_2')}`,`- ${t('support.articles.tc1.a3_3')}`],
        relatedArticles: ['tc-5','tc-6','gs-5'] },
      'ft-1': { id: 'ft-1', title: t('support.popularArticles.reports'),        category: t('support.categories.features'),       categoryId: 'features',        readTime: '12 min', views: '6.2k', lastUpdated: 'May 2026',
        content: [`## ${t('support.articles.ft1.h1')}`,t('support.articles.ft1.p1'),`### ${t('support.articles.ft1.h2')}`,t('support.articles.ft1.p2'),`### ${t('support.articles.ft1.h3')}`,t('support.articles.ft1.p3'),`- **${t('support.articles.ft1.li1_label')}**: ${t('support.articles.ft1.li1_desc')}`,`- **${t('support.articles.ft1.li2_label')}**: ${t('support.articles.ft1.li2_desc')}`,`- **${t('support.articles.ft1.li3_label')}**: ${t('support.articles.ft1.li3_desc')}`,`- **${t('support.articles.ft1.li4_label')}**: ${t('support.articles.ft1.li4_desc')}`,`### ${t('support.articles.ft1.h4')}`,t('support.articles.ft1.p4'),`- ${t('support.articles.ft1.li5')}`,`- ${t('support.articles.ft1.li6')}`,`- ${t('support.articles.ft1.li7')}`,`- ${t('support.articles.ft1.li8')}`,`### ${t('support.articles.ft1.h5')}`,`**${t('support.articles.ft1.type1_label')}**`,t('support.articles.ft1.type1_desc'),`**${t('support.articles.ft1.type2_label')}**`,t('support.articles.ft1.type2_desc'),`**${t('support.articles.ft1.type3_label')}**`,t('support.articles.ft1.type3_desc'),`**${t('support.articles.ft1.type4_label')}**`,t('support.articles.ft1.type4_desc'),`**${t('support.articles.ft1.type5_label')}**`,t('support.articles.ft1.type5_desc'),`**${t('support.articles.ft1.type6_label')}**`,t('support.articles.ft1.type6_desc'),`### ${t('support.articles.ft1.h6')}`,t('support.articles.ft1.p5'),`- ${t('support.articles.ft1.li9')}`,`- ${t('support.articles.ft1.li10')}`,`- ${t('support.articles.ft1.li11')}`,t('support.articles.ft1.p6'),`### ${t('support.articles.ft1.h7')}`,`- ${t('support.articles.ft1.li12')}`,`- ${t('support.articles.ft1.li13')}`,`- ${t('support.articles.ft1.li14')}`,`- ${t('support.articles.ft1.li15')}`],
        relatedArticles: ['ft-10','ft-4','ft-5'] },
      'bl-2': { id: 'bl-2', title: t('support.popularArticles.payment'),        category: t('support.categories.billing'),        categoryId: 'billing',         readTime: '3 min',  views: '3.8k', lastUpdated: 'May 2026',
        content: [`## ${t('support.articles.bl2.h1')}`,t('support.articles.bl2.p1'),`### ${t('support.articles.bl2.h2')}`,`1. ${t('support.articles.bl2.li1')}`,`2. ${t('support.articles.bl2.li2')}`,`3. ${t('support.articles.bl2.li3')}`,`### ${t('support.articles.bl2.h3')}`,`1. ${t('support.articles.bl2.li4')}`,`2. ${t('support.articles.bl2.li5')}`,`- ${t('support.articles.bl2.li6')}`,`- ${t('support.articles.bl2.li7')}`,`- ${t('support.articles.bl2.li8')}`,`- ${t('support.articles.bl2.li9')}`,`3. ${t('support.articles.bl2.li10')}`,`### ${t('support.articles.bl2.h4')}`,t('support.articles.bl2.p2'),`1. ${t('support.articles.bl2.li11')}`,`2. ${t('support.articles.bl2.li12')}`,`3. ${t('support.articles.bl2.li13')}`,`### ${t('support.articles.bl2.h5')}`,`1. ${t('support.articles.bl2.li14')}`,`2. ${t('support.articles.bl2.li15')}`,`3. ${t('support.articles.bl2.li16')}`,`**${t('support.articles.bl2.note_label')}**: ${t('support.articles.bl2.note_desc')}`,`### ${t('support.articles.bl2.h6')}`,t('support.articles.bl2.p3'),`1. ${t('support.articles.bl2.li17')}`,`2. ${t('support.articles.bl2.li18')}`,`3. ${t('support.articles.bl2.li19')}`,`4. ${t('support.articles.bl2.li20')}`,`5. ${t('support.articles.bl2.li21')}`],
        relatedArticles: ['bl-1','bl-3','bl-7'] },
    };

    const stubs = ['gs-3','gs-4','gs-5','gs-6','gs-7','gs-8','bl-1','bl-3','bl-4','bl-5','bl-6','bl-7','bl-8','tc-2','tc-3','tc-4','tc-5','tc-6','tc-7','tc-8','tc-9','tc-10','ft-2','ft-3','ft-4','ft-5','ft-6','ft-7','ft-8','ft-9','ft-10'];
    const catMap: Record<string, { name: string; id: string }> = {
      gs: { name: t('support.categories.gettingStarted'), id: 'getting-started' },
      bl: { name: t('support.categories.billing'),        id: 'billing'         },
      tc: { name: t('support.categories.technical'),      id: 'technical'       },
      ft: { name: t('support.categories.features'),       id: 'features'        },
    };
    stubs.forEach(id => {
      if (!articles[id]) {
        const prefix = id.split('-')[0];
        const cat = catMap[prefix];
        const key = id.replace('-', '');
        const title   = t(`support.articles.${key}`,         { defaultValue: `Article ${id}` });
        const excerpt = t(`support.articles.${key}_excerpt`,  { defaultValue: '' });
        const seed = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        articles[id] = {
          id, title, category: cat.name, categoryId: cat.id,
          readTime: '4 min', views: `${((seed % 50) / 10 + 1).toFixed(1)}k`, lastUpdated: 'May 2026',
          content: [`## ${t('support.genericArticle.overview')}`, excerpt || t('support.genericArticle.p1'), t('support.genericArticle.p2'), `### ${t('support.genericArticle.stepsTitle')}`, t('support.genericArticle.stepsDesc'), `- **${t('support.genericArticle.step1Label')}**: ${t('support.genericArticle.step1Desc')}`, `- **${t('support.genericArticle.step2Label')}**: ${t('support.genericArticle.step2Desc')}`, `- **${t('support.genericArticle.step3Label')}**: ${t('support.genericArticle.step3Desc')}`, `### ${t('support.genericArticle.bestPracticesTitle')}`, t('support.genericArticle.bestPracticesDesc'), `### ${t('support.genericArticle.faqTitle')}`, `**${t('support.genericArticle.q1')}**`, t('support.genericArticle.a1'), `**${t('support.genericArticle.q2')}**`, t('support.genericArticle.a2')],
          relatedArticles: [],
        };
      }
    });
    return articles;
  }, [t]);

  const article = articleId ? allArticles[articleId] : null;
  const acc     = article ? catAccent[article.categoryId]  : null;
  const CatIcon = article ? catIcon[article.categoryId]    : BookOpen;
  const related = article ? article.relatedArticles.map(id => allArticles[id]).filter(Boolean) : [];

  if (!article || !acc) {
    return (
      <div className="min-h-screen bg-white font-sans dark:bg-[#050505]">
        <Navbar />
        <main className="pt-32 pb-24 text-center">
          <h1 className="font-magilio mb-4 text-3xl font-bold">{t('support.articles.notFound')}</h1>
          <Link to="/support" className="font-bold text-mintcom-green hover:underline">← {t('support.articles.backToHelp')}</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#050505] dark:text-white">
      <Navbar />

      {/* ── Article header — clean neutral ── */}
      <div className="border-b border-gray-100 bg-white pt-20 dark:border-white/8 dark:bg-[#0d0d0d]">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10 pb-10 pt-8">
          {/* breadcrumb */}
          <div className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500">
            <Link to="/support" className="hover:text-mintcom-green transition-colors">{t('support.hero.badge')}</Link>
            <ChevronRight size={12} />
            <Link to={`/support/category/${article.categoryId}`} className="hover:text-mintcom-green transition-colors">{article.category}</Link>
            <ChevronRight size={12} />
            <span className="truncate max-w-[200px] text-gray-300 dark:text-gray-600">{article.title}</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <Link to={`/support/category/${article.categoryId}`}
              className="group mb-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-600 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10">
              <ArrowLeft size={13} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
              {t('support.articles.backTo')} {article.category}
            </Link>

            <h1 className="font-magilio text-3xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-4xl lg:text-[48px]">
              {article.title}
            </h1>

            {/* meta row */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1.5"><Clock size={13} /> {article.readTime} {t('support.articles.read')}</span>
              <span className="flex items-center gap-1.5"><Eye size={13} /> {article.views} {t('support.articles.views')}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {t('support.articles.updated')} {article.lastUpdated}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Body: article + sidebar ── */}
      <main className="bg-gray-50 pb-24 dark:bg-[#0a0a0a]">
        <div className="container mx-auto max-w-[1280px] px-6 md:px-10">
          <div className="grid gap-8 pt-10 lg:grid-cols-[1fr_280px] xl:grid-cols-[1fr_300px]">

            {/* ── Article content ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
              <div className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm dark:border-white/8 dark:bg-white/[0.03] md:p-10">
                {article.content.map((line, i) => <ContentLine key={i} line={line} index={i} />)}
              </div>

              {/* Helpful feedback */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="mt-4 rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/8 dark:bg-white/[0.03]">
                {helpful === null ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-gray-900 dark:text-white">{t('support.articles.helpfulQuestion')}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setHelpful('yes')}
                        className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green/10 px-5 py-2 text-sm font-bold text-mintcom-green transition-colors hover:bg-mintcom-green/20">
                        <ThumbsUp size={15} /> {t('support.articles.helpfulYes')}
                      </button>
                      <button onClick={() => setHelpful('no')}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15">
                        <ThumbsDown size={15} /> {t('support.articles.helpfulNo')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-mintcom-green">
                    <CheckCircle2 size={18} />
                    <p className="font-semibold">{helpful === 'yes' ? t('support.articles.feedbackThanks') : t('support.articles.feedbackSorry')}</p>
                  </div>
                )}
              </motion.div>

              {/* Action buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { icon: Share2,  label: t('common.share'), action: handleShare },
                  { icon: Printer, label: t('common.print'), action: () => window.print() },
                ].map(({ icon: Icon, label, action }) => (
                  <button key={label} onClick={action}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10">
                    <Icon size={14} /> {label}
                  </button>
                ))}
                <button onClick={handleSubmitTicket}
                  className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-4 py-2 text-sm font-bold text-black shadow-sm transition-all hover:-translate-y-0.5">
                  <MessageSquare size={14} /> {t('support.quickLinks.submitTicket')}
                </button>
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-magilio mb-4 text-xl font-bold">{t('support.articles.related')}</h2>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {related.map((rel, i) => {
                      const relAcc = catAccent[rel.categoryId];
                      return (
                        <motion.div key={rel.id}
                          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.35 + i * 0.08 }}>
                          <Link to={`/support/article/${rel.id}`}
                            className={`group flex h-full flex-col rounded-2xl border bg-white p-4 transition-all hover:shadow-sm dark:bg-white/[0.03] ${relAcc.border}`}>
                            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${relAcc.light}`}>
                              <BookOpen size={15} className={relAcc.text} />
                            </div>
                            <p className={`flex-1 text-sm font-semibold text-gray-900 transition-colors group-hover:${relAcc.text} dark:text-white line-clamp-2`}>
                              {rel.title}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                              <Clock size={11} /> {rel.readTime}
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ── Sidebar ── */}
            <motion.aside initial={{ opacity: 0, x: isRtl ? -16 : 16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block">
              <div className="sticky top-24 space-y-4">

                {/* Article info card */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/8 dark:bg-white/[0.03]">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${acc.bg} text-white shadow-sm`}>
                    <CatIcon size={22} />
                  </div>
                  <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.18em] ${acc.text}`}>{article.category}</p>
                  <h3 className="font-barlow text-sm font-bold leading-snug text-gray-900 dark:text-white">{article.title}</h3>
                  <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4 dark:border-white/8">
                    {[
                      { icon: Clock,    label: t('support.articles.read'),    value: article.readTime    },
                      { icon: Eye,      label: t('support.articles.views'),   value: article.views       },
                      { icon: Calendar, label: t('support.articles.updated'), value: article.lastUpdated },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-gray-400"><Icon size={12} /> {label}</span>
                        <span className="font-semibold text-gray-700 dark:text-gray-300">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Need help CTA */}
                <div className="overflow-hidden rounded-2xl border border-mintcom-green/20 bg-gradient-to-b from-mintcom-green/10 to-mintcom-green/3 p-5 dark:from-mintcom-green/12 dark:to-mintcom-green/3">
                  <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-mintcom-green/20 blur-2xl" />
                  <p className="mb-1 text-sm font-bold text-gray-900 dark:text-white">{t('support.cta.stillNeedHelp')}</p>
                  <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">{t('support.cta.stillNeedHelpDesc')}</p>
                  <button onClick={handleSubmitTicket}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green py-2.5 text-sm font-bold text-black shadow-sm transition-all hover:-translate-y-0.5">
                    <MessageSquare size={14} />
                    {t('support.quickLinks.submitTicket')}
                  </button>
                </div>

              </div>
            </motion.aside>

          </div>
        </div>
      </main>
      <Footer />
      <LoginRequiredModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

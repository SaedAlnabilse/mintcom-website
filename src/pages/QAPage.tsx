import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, MessageCircle, CreditCard, Wrench, Settings, HelpCircle, ChevronRight,
  X, Package, ClipboardList, Users
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FAQ_DATA } from '../data/faq';
import type { FAQItem } from '../data/faq';
import { formatInputPlaceholder } from '../utils/textCase';

const getLocalizedFaqText = (item: FAQItem, language: string) => {
    const useArabic = language.toLowerCase().startsWith('ar');
    return {
        question: useArabic && item.questionAr ? item.questionAr : item.question,
        answer: useArabic && item.answerAr ? item.answerAr : item.answer,
    };
};

export const QAPage = () => {
    const { t, i18n } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const isArabic = (i18n.language || '').toLowerCase().startsWith('ar');
    const isRTL = isArabic || t('common.locale') === 'ar';

    const categories = useMemo(() => [
        { id: 'All', label: t('support.qa.categories.all', { defaultValue: 'All Questions' }), icon: HelpCircle },
        { id: 'general', label: t('support.qa.categories.general', { defaultValue: 'General Support' }), icon: MessageCircle },
        { id: 'products', label: t('support.qa.categories.products', { defaultValue: 'Product Management' }), icon: Package },
        { id: 'orders', label: t('support.qa.categories.orders', { defaultValue: 'Sales and Orders' }), icon: ClipboardList },
        { id: 'staff', label: t('support.qa.categories.staff', { defaultValue: 'Team and Staff' }), icon: Users },
        { id: 'billing', label: t('support.qa.categories.payments', { defaultValue: 'Billing and Plans' }), icon: CreditCard },
        { id: 'technical', label: t('support.qa.categories.technical', { defaultValue: 'Technical Support' }), icon: Wrench },
        { id: 'account', label: t('support.qa.categories.account', { defaultValue: 'Account Settings' }), icon: Settings },
    ], [t]);

    const filteredQA = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return FAQ_DATA.filter((item) => {
            const { question, answer } = getLocalizedFaqText(item, i18n.language || 'en');
            const matchesSearch =
                !query ||
                question.toLowerCase().includes(query) ||
                answer.toLowerCase().includes(query) ||
                // Always allow matching against the alternate language so bilingual search works
                item.question.toLowerCase().includes(query) ||
                item.answer.toLowerCase().includes(query) ||
                Boolean(item.questionAr?.includes(searchQuery.trim())) ||
                Boolean(item.answerAr?.includes(searchQuery.trim()));
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory, i18n.language]);

    const hasSearch = searchQuery.trim().length > 0;
    const hasTopicFilter = activeCategory !== 'All';
    const questionsEntity = t('support.qa.entityQuestions', {
        defaultValue: isArabic ? 'أسئلة' : 'questions',
    });

    // FAQPage structured data for rich results. Uses the canonical English
    // Q&A (Google requires the visible page text to match the markup, and the
    // default locale is English) so localized answers can't drift from schema.
    const faqJsonLd = useMemo(() => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_DATA.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    }), []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>{t('metadata.qa.title')}</title>
                <meta name="description" content={t('metadata.qa.description')} />
                <meta property="og:title" content={t('metadata.qa.title')} />
                <meta property="og:description" content={t('metadata.qa.description')} />
                <script type="application/ld+json">{faqJsonLd}</script>
            </Helmet>
            <Navbar hideCommercialLinks />

            {/* Header Section */}
            <div className="bg-white dark:bg-[#1E293B] pt-32 pb-16 px-6 border-b border-gray-200 dark:border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6 tracking-tight"
                    >
                        {t('support.qa.title', { defaultValue: 'How Can We Help You?' })}
                    </motion.h1>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="relative max-w-2xl mx-auto"
                    >
                        <input maxLength={255}
                            type="text"
                            placeholder={formatInputPlaceholder(
                                t('support.qa.search_placeholder', { defaultValue: 'Search for answers...' }),
                                t('common.locale'),
                            )}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full ${isRTL ? 'pr-12 pl-11' : 'pl-12 pr-11'} py-4 bg-gray-100 dark:bg-black/20 border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all`}
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label={t('common.clearSearch', { defaultValue: 'Clear search' })}
                            className={`absolute ${isRTL ? 'left-2.5' : 'right-2.5'} top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors`}
                          >
                            <X size={12} strokeWidth={2.75} />
                          </button>
                        )}
                        <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5`} />
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Topics */}
                    <div className="lg:col-span-1 space-y-1">
                        <p className="label-strong font-sans mb-4 px-2 uppercase">
                            {t('support.qa.topics', { defaultValue: 'Help Topics' })}
                        </p>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group ${
                                    activeCategory === cat.id
                                    ? 'bg-mintcom-green/10 text-mintcom-green'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {activeCategory === cat.id && (
                                  <motion.div 
                                    layoutId="active-indicator"
                                    className={`absolute inset-y-0 ${isRTL ? 'right-0' : 'left-0'} w-1 bg-mintcom-green rounded-full`}
                                  />
                                )}
                                <cat.icon size={18} className={activeCategory === cat.id ? 'text-mintcom-green' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'} />
                                {cat.label}
                                {activeCategory === cat.id && <ChevronRight size={16} className={isRTL ? 'mr-auto rotate-180' : 'ml-auto'} />}
                            </button>
                        ))}
                    </div>

                    {/* Q&A List */}
                    <div className="lg:col-span-3">
                        <AnimatePresence mode='wait'>
                            {filteredQA.length > 0 ? (
                                <motion.div 
                                    key="list"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="space-y-4"
                                >
                                    {filteredQA.map((item) => {
                                        const { question, answer } = getLocalizedFaqText(item, i18n.language || 'en');
                                        return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all hover:border-mintcom-green/30"
                                        >
                                            <button
                                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                className={`w-full flex items-start justify-between p-6 ${isRTL ? 'text-right' : 'text-left'}`}
                                            >
                                                <div className={`flex-1 ${isRTL ? 'pl-8' : 'pr-8'}`}>
                                                    <h3 className={`font-barlow text-base font-medium transition-colors ${expandedId === item.id ? 'text-mintcom-green' : 'text-gray-900 dark:text-white'}`}>
                                                        {question}
                                                    </h3>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    expandedId === item.id 
                                                    ? 'bg-mintcom-green text-black rotate-180' 
                                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                                                }`}>
                                                    {expandedId === item.id ? <Minus size={18} /> : <Plus size={18} />}
                                                </div>
                                            </button>
                                            
                                            <AnimatePresence>
                                                {expandedId === item.id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <div className="px-6 pb-6 pt-0">
                                                            <div className="h-px w-full bg-gray-100 dark:bg-white/5 mb-4" />
                                                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                                {answer}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                        );
                                    })}
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="font-barlow text-base font-semibold text-gray-900 dark:text-white mb-2">
                                        {hasTopicFilter && !hasSearch ? t('common.noFilteredResults') : t('support.qa.empty_title', { defaultValue: 'No Results Found' })}
                                    </h3>
                                    <p className="text-xs font-medium text-gray-500">
                                        {hasSearch
                                            ? t('common.noMatchingResults', {
                                                entity: questionsEntity,
                                                query: searchQuery.trim(),
                                                defaultValue: 'No {{entity}} matching "{{query}}"',
                                              })
                                            : hasTopicFilter
                                                ? t('common.noFilteredResultsDesc')
                                                : t('support.qa.empty_subtitle', { defaultValue: 'Try adjusting your search or topic filter.' })}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <Footer hideCommercialLinks />
        </div>
    );
};

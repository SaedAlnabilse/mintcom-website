import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, MessageCircle, CreditCard, Wrench, Settings, HelpCircle, ChevronRight,
  X, Package, ClipboardList, Users
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { FAQ_DATA } from '../data/faq';

export const QAPage = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const categories = [
        { id: 'All', label: t('support.qa.categories.all', 'All Questions'), icon: HelpCircle },
        { id: 'general', label: t('support.qa.categories.general', 'General Support'), icon: MessageCircle },
        { id: 'products', label: t('support.qa.categories.products', 'Product Management'), icon: Package },
        { id: 'orders', label: t('support.qa.categories.orders', 'Sales And Orders'), icon: ClipboardList },
        { id: 'staff', label: t('support.qa.categories.staff', 'Team And Staff'), icon: Users },
        { id: 'billing', label: t('support.qa.categories.payments', 'Billing And Plans'), icon: CreditCard },
        { id: 'technical', label: t('support.qa.categories.technical', 'Technical Support'), icon: Wrench },
        { id: 'account', label: t('support.qa.categories.account', 'Account Settings'), icon: Settings },
    ];

    const filteredQA = FAQ_DATA.filter(item => {
        const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            <Helmet>
                <title>{t('metadata.qa.title')}</title>
                <meta name="description" content={t('metadata.qa.description')} />
                <meta property="og:title" content={t('metadata.qa.title')} />
                <meta property="og:description" content={t('metadata.qa.description')} />
            </Helmet>
            <Navbar />

            {/* Header Section */}
            <div className="bg-white dark:bg-[#1E293B] pt-32 pb-16 px-6 border-b border-gray-200 dark:border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-6 tracking-tight"
                    >
                        {t('support.qa.title', 'How Can We Help You?')}
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
                            placeholder={t('support.qa.search_placeholder', 'Search For Answers...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-11 py-4 bg-gray-100 dark:bg-black/20 border-gray-200 dark:border-white/10 rounded-2xl text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all"
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
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Topics */}
                    <div className="lg:col-span-1 space-y-1">
                        <p className="text-xs font-black text-gray-400 tracking-widest mb-4 px-2 uppercase">
                            {t('support.qa.topics', 'Help Topics')}
                        </p>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group ${
                                    activeCategory === cat.id
                                    ? 'bg-paymint-green/10 text-paymint-green'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {activeCategory === cat.id && (
                                  <motion.div 
                                    layoutId="active-indicator"
                                    className={`absolute inset-y-0 ${t('common.locale') === 'ar' ? 'right-0' : 'left-0'} w-1 bg-paymint-green rounded-full`}
                                  />
                                )}
                                <cat.icon size={18} className={activeCategory === cat.id ? 'text-paymint-green' : 'text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white'} />
                                {cat.label}
                                {activeCategory === cat.id && <ChevronRight size={16} className={t('common.locale') === 'ar' ? 'mr-auto rotate-180' : 'ml-auto'} />}
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
                                    {filteredQA.map((item) => (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all hover:border-paymint-green/30"
                                        >
                                            <button
                                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                className="w-full flex items-start justify-between p-6 text-left"
                                            >
                                                <div className="flex-1 pr-8">
                                                    <h3 className={`text-base font-medium transition-colors ${expandedId === item.id ? 'text-paymint-green' : 'text-gray-900 dark:text-white'}`}>
                                                        {item.question}
                                                    </h3>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    expandedId === item.id 
                                                    ? 'bg-paymint-green text-black rotate-180' 
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
                                                                {item.answer}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
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
                                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                                        {t('support.qa.empty_title', 'No Results Found')}
                                    </h3>
                                    <p className="text-xs font-medium text-gray-500">
                                        {searchQuery.trim() ? t('common.noMatchingResults', { entity: 'questions', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('support.qa.empty_subtitle', 'Try adjusting your search or topic filter.')}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

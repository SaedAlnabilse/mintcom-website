import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, MessageCircle, CreditCard, Shield, Settings, HelpCircle, ChevronRight,
  X
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

interface QAItem {
    id: string;
    question: string;
    answer: string;
    category: string;
}

export const QAPage = () => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const categories = [
        { id: 'All', label: t('support.qa.categories.all', 'All Questions'), icon: HelpCircle },
        { id: 'General', label: t('support.qa.categories.general', 'General'), icon: MessageCircle },
        { id: 'Payments', label: t('support.qa.categories.payments', 'Payments'), icon: CreditCard },
        { id: 'Security', label: t('support.qa.categories.security', 'Security'), icon: Shield },
        { id: 'Account', label: t('support.qa.categories.account', 'Account'), icon: Settings },
    ];

    const qaData: QAItem[] = [
        {
            id: '1',
            category: 'General',
            question: t('support.qa.q1.question', 'What is PayMint?'),
            answer: t('support.qa.q1.answer', 'PayMint is a comprehensive digital payment solution designed to help businesses of all sizes accept payments, manage finances, and grow. We offer a suite of tools including a payment gateway, point-of-sale systems, and detailed analytics.')
        },
        {
            id: '2',
            category: 'General',
            question: t('support.qa.q2.question', 'Is PayMint available in my country?'),
            answer: t('support.qa.q2.answer', 'PayMint is currently available in over 30 countries across North America, Europe, and Asia. We are rapidly expanding to new regions. Please check our supported countries list on our pricing page for the most up-to-date information.')
        },
        {
            id: '3',
            category: 'Payments',
            question: t('support.qa.q3.question', 'What payment methods can I accept?'),
            answer: t('support.qa.q3.answer', 'With PayMint, you can accept all major credit and debit cards (Visa, Mastercard, Amex), digital wallets (Apple Pay, Google Pay), and local payment methods specific to your region.')
        },
        {
            id: '4',
            category: 'Payments',
            question: t('support.qa.q4.question', 'How long do payouts take?'),
            answer: t('support.qa.q4.answer', 'Standard payouts are processed daily and typically arrive in your bank account within 2 business days. We also offer an Instant Payout feature for eligible merchants, allowing you to access your funds in minutes for a small fee.')
        },
        {
            id: '5',
            category: 'Security',
            question: t('support.qa.q5.question', 'Is PayMint secure?'),
            answer: t('support.qa.q5.answer', 'Yes, security is our top priority. We are PCI DSS Level 1 compliant, which is the highest standard of payment security. All data is encrypted using advanced encryption standards (AES-256), and we employ 24/7 fraud monitoring.')
        },
        {
            id: '6',
            category: 'Account',
            question: t('support.qa.q6.question', 'How do I reset my password?'),
            answer: t('support.qa.q6.answer', 'You can reset your password by clicking on the "Forgot Password" link on the login page. Follow the instructions sent to your registered email address to create a new password. If you are logged in, you can change it from your Account Settings.')
        },
        {
            id: '7',
            category: 'Account',
            question: t('support.qa.q7.question', 'Can I add multiple users to my account?'),
            answer: t('support.qa.q7.answer', 'Yes! Our Team Management feature allows you to add multiple users with different roles and permissions (e.g., Admin, Manager, Cashier). You can manage these settings from the "Team" section in your dashboard.')
        },
        {
            id: '8',
            category: 'Payments',
            question: t('support.qa.q8.question', 'Are there any hidden fees?'),
            answer: t('support.qa.q8.answer', 'No, we believe in complete transparency. Our pricing model is simple: a small percentage per transaction plus a fixed fee. There are no setup fees, monthly fees, or hidden charges for our standard plan.')
        }
    ];

    const filteredQA = qaData.filter(item => {
        const matchesSearch = item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              item.answer.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0F172A] text-gray-900 dark:text-white font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            <Navbar />

            {/* Header Section */}
            <div className="bg-white dark:bg-[#1E293B] pt-32 pb-16 px-6 border-b border-gray-200 dark:border-white/5">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight"
                    >
                        {t('support.qa.title', 'How can we help you?')}
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
                            placeholder={t('support.qa.search_placeholder', 'Search for questions...')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-11 py-4 bg-gray-100 dark:bg-black/20 border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none transition-all shadow-sm"
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
                    {/* Sidebar Categories */}
                    <div className="lg:col-span-1 space-y-2">
                        <p className="text-xs font-black text-gray-400 tracking-widest mb-4 px-2">
                            {t('community.labels.categories', 'Categories')}
                        </p>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                                    activeCategory === cat.id
                                    ? 'bg-PayMint-green text-black shadow-lg shadow-PayMint-green/20'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <cat.icon size={18} />
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
                                            className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all hover:border-PayMint-green/30"
                                        >
                                            <button
                                                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                className="w-full flex items-start justify-between p-6 text-left"
                                            >
                                                <div className="flex-1 pr-8">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <h3 className={`text-base font-bold transition-colors ${expandedId === item.id ? 'text-PayMint-green' : 'text-gray-900 dark:text-white'}`}>
                                                        {item.question}
                                                    </h3>
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    expandedId === item.id 
                                                    ? 'bg-PayMint-green text-black rotate-180' 
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
                                                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 leading-relaxed">
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
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                                        {t('support.qa.empty_title', 'No results found')}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500">
                                        {searchQuery.trim() ? t('common.noMatchingResults', { entity: 'questions', query: searchQuery.trim(), defaultValue: 'No {{entity}} matching "{{query}}"' }) : t('support.qa.empty_subtitle', 'Try adjusting your search or category filter.')}
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


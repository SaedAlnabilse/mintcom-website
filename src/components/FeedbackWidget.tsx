import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Star, CheckCircle2, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

export const FeedbackWidget = () => {
    const { t } = useTranslation();
    const { account } = useAuth();
    const location = useLocation();
    const isRTL = t('common.locale') === 'ar';
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState('general');
    const [area, setArea] = useState('checkout');
    const [comment, setComment] = useState('');
    const [contactConsent, setContactConsent] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const categoryOptions = [
        { value: 'general', label: t('feedback.categories.general') },
        { value: 'bug', label: t('feedback.categories.bug') },
        { value: 'feature', label: t('feedback.categories.feature') },
        { value: 'usability', label: t('feedback.categories.usability') },
        { value: 'performance', label: t('feedback.categories.performance') },
        { value: 'pricing', label: t('feedback.categories.pricing') },
        { value: 'support', label: t('feedback.categories.support') },
    ];

    const areaOptions = [
        { value: 'checkout', label: t('feedback.areas.checkout') },
        { value: 'products', label: t('feedback.areas.products') },
        { value: 'inventory', label: t('feedback.areas.inventory') },
        { value: 'reports', label: t('feedback.areas.reports') },
        { value: 'staff', label: t('feedback.areas.staff') },
        { value: 'settings', label: t('feedback.areas.settings') },
        { value: 'billing', label: t('feedback.areas.billing') },
        { value: 'support', label: t('feedback.areas.support') },
        { value: 'general', label: t('feedback.areas.general') },
    ];

    // Only show on dashboard, owner, or brand routes
    const isAppRoute = location.pathname.startsWith('/dashboard') || 
                       location.pathname.startsWith('/owner') || 
                       location.pathname.startsWith('/brand');

    useEffect(() => {
        if (!account) {
            setIsVisible(false);
            return;
        }

        const checkVisibility = () => {
            const storageKey = `feedback_last_submitted_${account.email}`;
            const lastFeedbackDate = localStorage.getItem(storageKey);
            
            if (lastFeedbackDate) {
                const lastDate = new Date(lastFeedbackDate);
                const now = new Date();
                const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;
                
                if (now.getTime() - lastDate.getTime() < oneWeekInMs) {
                    setIsVisible(false);
                    return;
                }
            }
            setIsVisible(true);
        };

        checkVisibility();
    }, [account]);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-feedback', handleOpen);
        return () => window.removeEventListener('open-feedback', handleOpen);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating || !comment.trim()) return;
        setIsSubmitting(true);

        try {
            let selectedEstablishmentId: string | undefined;
            try {
                const currentEstablishment = sessionStorage.getItem('currentEstablishment');
                selectedEstablishmentId = currentEstablishment ? JSON.parse(currentEstablishment)?.id : undefined;
            } catch {
                selectedEstablishmentId = undefined;
            }

            await api.post('/contact/feedback', {
                rating,
                category,
                area,
                comment: comment.trim(),
                pageUrl: window.location.href,
                route: location.pathname,
                locale: t('common.locale'),
                selectedEstablishmentId,
                contactConsent,
                userName: account
                    ? `${account.firstName || ''} ${account.lastName || ''}`.trim() || account.email
                    : undefined,
                userEmail: account?.email,
            });

            setIsSubmitted(true);
            
            // Save submission date to localStorage
            if (account?.email) {
                localStorage.setItem(`feedback_last_submitted_${account.email}`, new Date().toISOString());
            }

            toast.success(t('feedback.thanks'));

            // Reset and close after a delay
            setTimeout(() => {
                setIsOpen(false);
                // After modal closes, hide the tab entirely
                setTimeout(() => {
                    setIsVisible(false);
                    setIsSubmitted(false);
                    setRating(0);
                    setCategory('general');
                    setArea('checkout');
                    setComment('');
                    setContactConsent(true);
                }, 300);
            }, 3000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            toast.error(t('errors.unexpected.message'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAppRoute || (!isVisible && !isOpen)) return null;

    return (
        <>
            {/* 1. Vertical Feedback Tab (Side Sticky) */}
            <AnimatePresence>
                {!isOpen && isVisible && (
                    <motion.button
                        initial={{ x: isRTL ? -50 : 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: isRTL ? -100 : 100, opacity: 0 }}
                        onClick={() => setIsOpen(true)}
                        style={{ opacity: 1 }}
                        className={`fixed ${isRTL ? 'left-0 border-y border-r rounded-r-2xl' : 'right-0 border-y border-l rounded-l-2xl'} top-[40%] -translate-y-1/2 z-[9999] !bg-white dark:!bg-[#0F172A] !bg-opacity-100 !opacity-100 border-gray-200 dark:border-white/10 py-4 px-2 shadow-2xl hover:bg-gray-50 dark:hover:!bg-[#334155] transition-all flex flex-col items-center gap-3 group ring-1 ring-black/5`}
                    >
                        <MessageSquare size={18} className="text-mintcom-green group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-100 [writing-mode:vertical-rl] rotate-180">{t('feedback.tab')}</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 2. Feedback Side Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-[9999]" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ x: isRTL ? '-100%' : '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: isRTL ? '-100%' : '100%', opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            dir={isRTL ? 'rtl' : 'ltr'}
                            className={`fixed ${isRTL ? 'left-0 border-r shadow-[10px_0_30px_rgba(0,0,0,0.1)]' : 'right-0 border-l shadow-[-10px_0_30px_rgba(0,0,0,0.1)]'} top-0 h-full w-[350px] bg-white dark:bg-[#0F172A] border-gray-200 dark:border-white/10 z-[10000] flex flex-col`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Drawer Header */}
                            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('feedback.title')}</h3>
                                    <p className="text-xs font-bold text-gray-500 mt-1">{t('feedback.subtitle')}</p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 bg-gray-100 dark:bg-[#1E293B] rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                                {isSubmitted ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                                        <div className="w-16 h-16 bg-mintcom-green/10 text-mintcom-green rounded-2xl flex items-center justify-center shadow-inner">
                                            <CheckCircle2 size={32} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{t('feedback.sent')}</h4>
                                            <p className="text-xs font-bold text-gray-500 mt-2 leading-relaxed max-w-[200px] mx-auto">
                                                {t('feedback.thanks')}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-sans font-normal text-gray-500 mb-3">{formatInputLabel(t('feedback.rateExperience'), t('common.locale'))}</label>
                                            <div className="flex justify-start gap-2.5">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => setRating(s)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${rating >= s
                                                                ? 'bg-mintcom-green text-black shadow-md shadow-mintcom-green/20'
                                                                : 'bg-gray-50 dark:bg-[#1E293B] text-gray-300 hover:bg-gray-100 dark:hover:bg-[#334155]'
                                                            }`}
                                                    >
                                                        <Star size={16} fill={rating >= s ? "currentColor" : "none"} strokeWidth={2.5} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className="block text-xs font-sans font-normal text-gray-500 mb-3">{formatInputLabel(t('feedback.category'), t('common.locale'))}</label>
                                                <div className="relative">
                                                    <select
                                                        value={category}
                                                        onChange={(e) => setCategory(e.target.value)}
                                                        className={`w-full ${isRTL ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-sans font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 appearance-none transition-all`}
                                                    >
                                                        {categoryOptions.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className={`absolute inset-y-0 ${isRTL ? 'left-4' : 'right-4'} flex items-center pointer-events-none text-gray-500 dark:text-gray-400`}>
                                                        <ChevronDown size={18} />
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-sans font-normal text-gray-500 mb-3">{formatInputLabel(t('feedback.area'), t('common.locale'))}</label>
                                                <div className="relative">
                                                    <select
                                                        value={area}
                                                        onChange={(e) => setArea(e.target.value)}
                                                        className={`w-full ${isRTL ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-sans font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 appearance-none transition-all`}
                                                    >
                                                        {areaOptions.map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className={`absolute inset-y-0 ${isRTL ? 'left-4' : 'right-4'} flex items-center pointer-events-none text-gray-500 dark:text-gray-400`}>
                                                        <ChevronDown size={18} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-sans font-normal text-gray-500 mb-3">{formatInputLabel(t('feedback.comments'), t('common.locale'))}</label>
                                            <textarea maxLength={2000}
                                                required
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                rows={6}
                                                className="w-full px-4 py-4 bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-sans font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all resize-none placeholder:text-gray-400 placeholder:font-sans placeholder:font-bold"
                                                placeholder={formatInputPlaceholder(t('feedback.placeholder'), t('common.locale'))}
                                            />
                                        </div>

                                        <label className="flex items-start gap-3 rounded-2xl bg-gray-50 px-4 py-3 text-xs font-bold text-gray-600 dark:bg-[#1E293B] dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={contactConsent}
                                                onChange={(e) => setContactConsent(e.target.checked)}
                                                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green"
                                            />
                                            <span>{t('feedback.contactConsent')}</span>
                                        </label>

                                        <button
                                            type="submit"
                                            disabled={!rating || !comment || isSubmitting}
                                            className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-sans font-bold text-sm shadow-lg hover:opacity-90 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            {isSubmitting ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                    <span>{t('feedback.sending')}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <Send size={14} />
                                                    {t('feedback.send')}
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

        </>
    );
};


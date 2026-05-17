import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BILLING_CYCLES, getMintcomPrice, MINTCOM_PRICING } from '../config/pricing';

export const PricingDownload = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [isYearly, setIsYearly] = useState(MINTCOM_PRICING.defaultBillingCycle === BILLING_CYCLES.YEARLY);

    const currentBillingCycle = isYearly ? BILLING_CYCLES.YEARLY : BILLING_CYCLES.MONTHLY;
    const currentPrice = getMintcomPrice(currentBillingCycle);
    const currentPeriod = isYearly ? t('landing.pricing.perYear') : t('landing.pricing.perMonth');
    const currentAdditionalPrice = getMintcomPrice(currentBillingCycle, true);

    const features = [
        t('landing.pricing.features.pos'),
        t('landing.pricing.features.dashboard'),
        t('landing.pricing.features.unlimitedStaff'),
        t('landing.pricing.features.adminApp'),
        t('landing.pricing.features.support'),
        t('landing.pricing.features.reports'),
        t('landing.pricing.features.aiSystem')
    ];

    const [showAlreadySignedIn, setShowAlreadySignedIn] = useState(false);

    const handleCtaAction = () => {
        if (isAuthenticated) {
            setShowAlreadySignedIn(true);
        } else {
            window.open('/signup', '_blank');
        }
    };

    return (
        <section id="pricing" className="py-24 lg:py-32 bg-white dark:bg-[#0f0f0f] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mintcom-green/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-mintcom-green/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-6 md:px-10 lg:px-16 max-w-[1280px] relative z-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10 lg:mb-12"
                >
                    <h2 className="text-5xl lg:text-7xl font-bold font-magilio text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
                        {t('landing.pricing.title')}
                    </h2>
                    <p className="mb-10 max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl mx-auto">
                        {t('landing.pricing.subtitle')}
                    </p>
                </motion.div>

                <div className="flex flex-col items-center justify-center max-w-6xl mx-auto">
                    {/* Pricing Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full"
                    >
                        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-100 dark:border-white/5 rounded-[3rem] p-10 lg:p-16 shadow-2xl shadow-mintcom-green/5 dark:shadow-none relative overflow-hidden group">
                            <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-12 lg:gap-20">
                                
                                {/* Left Side: Pricing & CTA */}
                                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
                                    <div className="w-full">
                                        <span className="text-mintcom-green font-black tracking-[0.2em] text-xs uppercase mb-4 block">
                                            {t('landing.pricing.fullAccess')}
                                        </span>
                                        <h3 className="font-barlow text-4xl font-bold text-gray-900 dark:text-white mb-10 transition-colors duration-300">
                                            {isYearly ? t('landing.pricing.yearlyPlan') : t('landing.pricing.monthlyPlan')}
                                        </h3>

                                        {/* Billing Toggle — clickable buttons */}
                                        <div className="flex items-center gap-3 mb-12">
                                            <button
                                                onClick={() => setIsYearly(false)}
                                                className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200 active:scale-95 ${!isYearly
                                                    ? 'bg-mintcom-green text-black shadow-lg shadow-mintcom-green/20'
                                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                            >
                                                {t('landing.pricing.monthly')}
                                            </button>
                                            <button
                                                onClick={() => setIsYearly(true)}
                                                className={`px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all duration-200 active:scale-95 flex items-center gap-2 ${isYearly
                                                    ? 'bg-mintcom-green text-black shadow-lg shadow-mintcom-green/20'
                                                    : 'bg-gray-100 dark:bg-white/5 text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-gray-300'
                                                }`}
                                            >
                                                {t('landing.pricing.yearly')}
                                                <span className={`text-[9px] font-black tracking-wider px-2 py-0.5 rounded-xl transition-colors duration-200 ${isYearly ? 'bg-black text-mintcom-green' : 'bg-mintcom-green/20 text-mintcom-green'}`}>
                                                    {t('landing.pricing.save')}
                                                </span>
                                            </button>
                                        </div>

                                        <div className="mb-12 relative">
                                            <div className="flex items-baseline justify-center lg:justify-start gap-2 mb-2">
                                                <span className="text-7xl lg:text-8xl font-bold text-gray-900 dark:text-white tracking-tighter transition-all duration-300">
                                                    {currentPrice}<span className="text-4xl lg:text-5xl ml-1">USD</span>
                                                </span>
                                                <span className="text-gray-400 font-medium text-2xl uppercase tracking-widest">
                                                    {currentPeriod}
                                                </span>
                                            </div>
                                            <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                                                {isYearly ? t('landing.pricing.billedAnnually') : t('landing.pricing.noCommitment')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full mt-auto space-y-8">
                                        <button
                                            onClick={handleCtaAction}
                                            className="w-full bg-mintcom-green text-black py-6 rounded-2xl font-black text-xl transition-all hover:bg-mintcom-green/90 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-mintcom-green/20 flex items-center justify-center gap-4 group/btn"
                                        >
                                            {t('landing.pricing.getStarted', 'Get Started')}
                                            <ArrowRight size={24} className={`transition-transform duration-300 group-hover/btn:translate-x-1.5 ${t('common.locale') === 'ar' && 'rotate-180 group-hover/btn:-translate-x-1.5'}`} />
                                        </button>

                                        {/* Additional Locations Hint */}
                                        <div className="mt-8 p-4 rounded-2xl bg-mintcom-green/10 border border-mintcom-green/20 flex items-center justify-center lg:justify-start gap-3 group/discount transition-all duration-300 hover:bg-mintcom-green/15">
                                            <div className="w-8 h-8 rounded-full bg-mintcom-green/20 flex items-center justify-center flex-shrink-0 group-hover/discount:scale-110 transition-transform">
                                                <Tag size={16} className="text-mintcom-green" />
                                            </div>
                                            <span className="text-gray-700 dark:text-gray-300 text-sm font-semibold tracking-wide">
                                                <Trans 
                                                    i18nKey="landing.pricing.additionalDiscount"
                                                    defaults="Additional locations receive a <1>DISCOUNT</1> for "
                                                    components={{ 1: <span className="font-black text-gray-900 dark:text-white uppercase" /> }}
                                                />
                                                <span className="text-gray-900 dark:text-white font-black">{currentAdditionalPrice} USD {currentPeriod}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Vertical Divider */}
                                <div className="hidden lg:block w-px bg-gray-100 dark:bg-white/10 self-stretch" />
                                <div className="block lg:hidden h-px bg-gray-100 dark:bg-white/10 w-full" />

                                {/* Right Side: Features */}
                                <div className="flex-1 w-full">
                                    <div className="mb-10">
                                        <h4 className="font-barlow text-gray-900 dark:text-white font-bold text-2xl mb-2">
                                            {t('landing.pricing.includedTitle', 'Everything you need')}
                                        </h4>
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                                            {t('landing.pricing.includedDesc', 'All features included in a single plan.')}
                                        </p>
                                    </div>
                                    
                                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-6 gap-x-8">
                                        {features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-5 text-gray-700 dark:text-gray-300 font-semibold text-lg hover:text-gray-900 dark:hover:text-white transition-colors group/item">
                                                <div className="w-6 h-6 rounded-lg bg-mintcom-green/10 flex items-center justify-center flex-shrink-0 group-hover/item:bg-mintcom-green/20 transition-colors">
                                                    <Check size={16} className="text-mintcom-green stroke-[4px]" />
                                                </div>
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-12 p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                                            {t('landing.pricing.setupFee', 'No setup fees or hidden charges. Cancel anytime.')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Already Signed In Modal */}
            <AnimatePresence>
                {showAlreadySignedIn && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAlreadySignedIn(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-colors"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#1a1a1a] w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/5 p-12 text-center"
                        >
                            <div className="w-20 h-20 bg-mintcom-green/10 rounded-full flex items-center justify-center mx-auto mb-8">
                                <Check size={40} className="text-mintcom-green stroke-[3px]" />
                            </div>
                            <h3 className="font-barlow text-2xl font-bold text-gray-900 dark:text-white mb-4">
                                {t('landing.pricing.alreadySignedIn', 'You are already signed in')}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                                {t('landing.pricing.alreadySignedInDesc', 'You can continue to your Dashboard to manage your business.')}
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => navigate('/owner')}
                                    className="w-full bg-mintcom-green text-black py-4 rounded-xl font-black text-lg transition-all hover:bg-mintcom-green/90 shadow-lg shadow-mintcom-green/20"
                                >
                                    {t('landing.pricing.goToDashboard', 'Go to Dashboard')}
                                </button>
                                <button
                                    onClick={() => setShowAlreadySignedIn(false)}
                                    className="w-full bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white py-4 rounded-xl font-bold transition-all hover:bg-gray-200 dark:hover:bg-white/10"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};


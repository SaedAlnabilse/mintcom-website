import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BILLING_CYCLES, MINTCOM_PRICING, getMintcomDiscountPercent, getMintcomEffectiveMonthlyPrice } from '../config/pricing';
import { ONBOARDING_START_PATH } from '../utils/onboardingLaunch';

const SplitPricingText = ({ text, highlightColor = "text-mintcom-green", baseColor = "text-gray-900 dark:text-white" }: { text: string; highlightColor?: string; baseColor?: string }) => {
  return (
    <>
      {text.split(' ').map((word, i) => {
        const lowerWord = word.toLowerCase();
        const shouldHighlight = lowerWord.includes('started') || 
                                lowerWord.includes('now') || 
                                lowerWord.includes('الآن') || 
                                lowerWord.includes('aha') || 
                                lowerWord.includes('الـ');
        return (
          <span
            key={i}
            className={shouldHighlight ? highlightColor : baseColor}
          >
            {word}{' '}
          </span>
        );
      })}
    </>
  );
};

export const PricingDownload = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { isAuthenticated, needsOnboarding } = useAuth();
    const [isYearly, setIsYearly] = useState(MINTCOM_PRICING.defaultBillingCycle === BILLING_CYCLES.YEARLY);

    const monthlyPrice = MINTCOM_PRICING.primary.monthly;
    const yearlyPrice = MINTCOM_PRICING.primary.yearly;
    const discountPercent = getMintcomDiscountPercent();
    const effectiveMonthlyPrice = getMintcomEffectiveMonthlyPrice();
    const currency = MINTCOM_PRICING.currency;

    const features = [
        t('landing.pricing.features.pos'),
        t('landing.pricing.features.dashboard'),
        t('landing.pricing.features.unlimitedStaff'),
        t('landing.pricing.features.adminApp'),
        t('landing.pricing.features.support'),
        t('landing.pricing.features.reports'),
        t('landing.pricing.features.aiSystem'),
        t('landing.pricing.features.inventory')
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

            <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8 relative z-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-10 lg:mb-12"
                >
                    <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold font-magilio text-gray-900 dark:text-white mb-6 leading-tight tracking-tight">
                        <SplitPricingText text={t('landing.pricing.title')} highlightColor="text-mintcom-green" baseColor="text-gray-900 dark:text-white" />
                    </h2>
                    <p className="mb-10 max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl mx-auto">
                        <SplitPricingText text={t('landing.pricing.subtitle')} highlightColor="text-mintcom-green" baseColor="text-gray-600 dark:text-gray-400" />
                    </p>
                </motion.div>

                <div className="flex flex-col items-center justify-center w-full mx-auto">
                    {/* Pricing Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full"
                    >
                        <div className="relative overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-[0_8px_30px_-6px_rgba(0,0,0,0.06),0_4px_12px_-4px_rgba(0,0,0,0.04)] group sm:rounded-[2.5rem] sm:p-8 lg:p-10 dark:border-white/5 dark:bg-[#1a1a1a] dark:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.35)]">
                            <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-12">
                                
                                {/* Left Side: Pricing & CTA */}
                                <div className="flex flex-1 flex-col items-center text-center lg:items-start lg:text-left justify-center w-full">
                                    <div className="w-full">
                                        <span className="mb-2.5 block text-xs font-black uppercase tracking-[0.2em] text-mintcom-green">
                                            {t('landing.pricing.fullAccess')}
                                        </span>
                                        <h3 className="mb-6 font-barlow text-3xl font-bold text-gray-900 transition-colors duration-300 dark:text-white sm:text-4xl">
                                            {isYearly ? t('landing.pricing.yearlyPlan') : t('landing.pricing.monthlyPlan')}
                                        </h3>

                                        {/* Billing Toggle — Claude-style segmented pill */}
                                        <div className="mb-6 flex flex-wrap items-center sm:mb-7">
                                            <div className="inline-flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsYearly(false)}
                                                    className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${!isYearly
                                                        ? 'bg-mintcom-green text-black shadow-md shadow-mintcom-green/20'
                                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                                    }`}
                                                >
                                                    {t('landing.pricing.monthly')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsYearly(true)}
                                                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all duration-200 ${isYearly
                                                        ? 'bg-mintcom-green text-black shadow-md shadow-mintcom-green/20'
                                                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                                    }`}
                                                >
                                                    <span>{t('landing.pricing.yearly')}</span>
                                                    {discountPercent > 0 && (
                                                        <span className={`text-xs font-black tracking-tight ${isYearly ? 'text-black/80' : 'text-mintcom-green'}`}>
                                                            · {t('landing.pricing.savePercent', { percent: discountPercent, defaultValue: `Save ${discountPercent}%` })}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative mb-6 sm:mb-7">
                                            <div className="mb-1.5 flex items-baseline justify-center gap-3 lg:justify-start">
                                                <span className="text-5xl font-bold tracking-tighter text-gray-900 transition-all duration-300 dark:text-white sm:text-6xl lg:text-7xl">
                                                    ${isYearly ? effectiveMonthlyPrice : monthlyPrice}
                                                </span>
                                                <div className="flex flex-col text-left rtl:text-right">
                                                    <span className="text-sm sm:text-base font-bold text-gray-700 dark:text-gray-200">
                                                        USD / {t('common.month', { defaultValue: 'month' })}
                                                    </span>
                                                    <span className="text-xs sm:text-sm font-medium text-gray-400 dark:text-gray-400">
                                                        {isYearly
                                                            ? `$${yearlyPrice} USD ${t('landing.pricing.billedAnnually', { defaultValue: 'Billed annually.' })}`
                                                            : t('landing.pricing.noCommitment', { defaultValue: 'Billed monthly.' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CTA Button directly aligned under price */}
                                        <div className="w-full">
                                            <button
                                                onClick={handleCtaAction}
                                                className="group/btn flex w-full items-center justify-center gap-2.5 rounded-xl bg-mintcom-green py-3.5 text-base font-semibold tracking-tight text-gray-900 shadow-[0_8px_28px_-8px_rgba(125,198,162,0.55)] transition-all hover:bg-mintcom-green/90 hover:shadow-[0_12px_32px_-8px_rgba(125,198,162,0.65)] active:scale-[0.98] sm:py-4 sm:text-[17px]"
                                            >
                                                <span className="font-semibold">{t('landing.pricing.getStarted', 'Get Started')}</span>
                                                <ArrowRight size={18} strokeWidth={2} className={`opacity-80 transition-transform duration-300 group-hover/btn:translate-x-1.5 ${t('common.locale') === 'ar' && 'rotate-180 group-hover/btn:-translate-x-1.5'}`} />
                                            </button>
                                            <p className="mt-3 text-center text-xs font-medium text-gray-400 dark:text-gray-500 lg:text-left rtl:lg:text-right">
                                                {t('pages.pricing.trialNote', { defaultValue: 'Start with a 14-day free trial. Cancel anytime.' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Vertical Divider */}
                                <div className="hidden w-px self-stretch bg-gray-100 dark:bg-white/10 lg:block" />
                                <div className="block h-px w-full bg-gray-100 dark:bg-white/10 lg:hidden" />

                                {/* Right Side: Features */}
                                <div className="w-full flex-1">
                                    <div className="mb-6">
                                        <h4 className="mb-1.5 font-barlow text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                                            {t('landing.pricing.includedTitle', 'Everything you need')}
                                        </h4>
                                        <p className="font-medium text-gray-500 dark:text-gray-400">
                                            {t('landing.pricing.includedDesc', 'All features included in a single plan.')}
                                        </p>
                                    </div>
                                    
                                    <ul className="grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2">
                                        {features.map((feature, i) => (
                                            <li key={i} className="group/item flex items-start gap-3.5 text-base font-semibold text-gray-700 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white sm:text-[17px]">
                                                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-mintcom-green/10 transition-colors group-hover/item:bg-mintcom-green/20">
                                                    <Check size={15} className="stroke-[4px] text-mintcom-green" />
                                                </div>
                                                <span className="leading-snug">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-7 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/5 dark:bg-white/5">
                                        <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
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
                                {needsOnboarding
                                    ? t('landing.pricing.alreadySignedInOnboardingDesc', {
                                        defaultValue:
                                          'Finish setting up your first location, then your dashboard will be ready.',
                                      })
                                    : t('landing.pricing.alreadySignedInDesc', 'You can continue to your Dashboard to manage your business.')}
                            </p>

                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        if (needsOnboarding) {
                                            window.open(ONBOARDING_START_PATH, '_blank', 'noopener,noreferrer');
                                            setShowAlreadySignedIn(false);
                                            return;
                                        }
                                        navigate('/owner');
                                    }}
                                    className="w-full bg-mintcom-green text-black py-4 rounded-xl font-black text-lg transition-all hover:bg-mintcom-green/90 shadow-lg shadow-mintcom-green/20"
                                >
                                    {needsOnboarding
                                        ? t('nav.continueOnboarding', { defaultValue: 'Continue Onboarding' })
                                        : t('landing.pricing.goToDashboard', 'Go to Dashboard')}
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


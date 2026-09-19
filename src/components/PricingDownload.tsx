import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModalCloseButton } from './ui';
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
        t('landing.pricing.features.inventory'),
        t('landing.pricing.features.adminApp'),
        t('landing.pricing.features.support'),
        t('landing.pricing.features.reports'),
        t('landing.pricing.features.aiSystem'),
        t('landing.pricing.includedTitle')
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
        <section id="pricing" className="bg-cream-100 dark:bg-zinc-950">
            <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45 }}
                    className="mb-6 text-start sm:mb-8"
                >
                    <p className="mb-3 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">
                        {t('landing.pricing.fullAccess')}
                    </p>
                    <h2 className="font-magilio text-5xl font-bold tracking-tight sm:text-6xl">
                        {t('landing.pricing.title')}
                    </h2>
                    <p className="mt-3 max-w-2xl text-base leading-relaxed text-stone-500 dark:text-zinc-400 sm:text-[17px]">
                        {t('landing.pricing.subtitle')}
                    </p>
                </motion.div>

                <div className="flex flex-col items-center justify-center w-full mx-auto">
                    {/* Pricing Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.45 }}
                        className="w-full"
                    >
                        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-7 shadow-[0_32px_80px_-32px_rgba(0,0,0,0.3)] sm:p-10 lg:p-12 dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-[0_32px_80px_-32px_rgba(0,0,0,0.8)]">
                            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[80%] -translate-x-1/2 rounded-full bg-mintcom-green/10 blur-3xl dark:bg-mintcom-green/10" aria-hidden />
                            <div className="relative flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
                                
                                {/* Left Side: Pricing & CTA */}
                                <div className="flex flex-1 flex-col justify-center w-full">
                                    <div className="w-full">
                                        <p className="mb-3 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">
                                            {t('landing.pricing.fullAccess')}
                                        </p>
                                        <h3 className="mb-5 font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 sm:text-[28px]">
                                            {isYearly ? t('landing.pricing.yearlyPlan') : t('landing.pricing.monthlyPlan')}
                                        </h3>

                                        {/* Billing Toggle — quiet segmented control */}
                                        <div className="mb-7 flex flex-wrap items-center">
                                            <div className="inline-flex items-center rounded-2xl border border-stone-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-transparent">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsYearly(false)}
                                                    className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${!isYearly
                                                        ? 'bg-stone-900 text-white dark:bg-mintcom-green dark:text-black'
                                                        : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                                    }`}
                                                >
                                                    {t('landing.pricing.monthly')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsYearly(true)}
                                                    className={`flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${isYearly
                                                        ? 'bg-stone-900 text-white dark:bg-mintcom-green dark:text-black'
                                                        : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                                                    }`}
                                                >
                                                    <span>{t('landing.pricing.yearly')}</span>
                                                    {discountPercent > 0 && (
                                                        <span className={`text-xs font-semibold tabular-nums ${isYearly ? 'opacity-80' : 'text-stone-400'}`}>
                                                            · {t('landing.pricing.savePercent', { percent: discountPercent, defaultValue: `Save ${discountPercent}%` })}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="relative mb-7">
                                            <div className="mb-1.5 flex items-baseline gap-4">
                                                <span className="font-magilio text-6xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 sm:text-7xl">
                                                    ${isYearly ? effectiveMonthlyPrice : monthlyPrice}
                                                </span>
                                                <div className="flex flex-col text-left rtl:text-right">
                                                    <span className="text-base font-semibold text-stone-700 dark:text-zinc-200">
                                                        USD / {t('common.month', { defaultValue: 'month' })}
                                                    </span>
                                                    <span className="text-sm text-stone-400 dark:text-zinc-500">
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
                                                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 py-4 text-base font-semibold text-white shadow-lg transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                                            >
                                                <span>{t('landing.pricing.getStarted', 'Get Started')}</span>
                                                <ArrowRight size={18} className={`shrink-0 ${t('common.locale') === 'ar' ? 'rotate-180' : ''}`} />
                                            </button>
                                            <p className="mt-4 text-sm text-stone-400 dark:text-zinc-500">
                                                {t('pages.pricing.trialNote', { defaultValue: 'Start with a 14-day free trial. Cancel anytime.' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="hidden w-px self-stretch bg-stone-200 dark:bg-zinc-800 lg:block" />
                                <div className="block h-px w-full bg-stone-200 dark:bg-zinc-800 lg:hidden" />

                                {/* Right Side: Features */}
                                <div className="w-full flex-1">
                                    <div className="mb-6">
                                        <h4 className="mb-2 font-barlow text-xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 sm:text-2xl">
                                            {t('landing.pricing.features.unlimitedStaff', 'Multiple staff accounts')}
                                        </h4>
                                        <p className="text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">
                                            {t('landing.pricing.includedDesc', 'All features included in a single plan.')}
                                        </p>
                                    </div>

                                    <ul className="grid grid-cols-1 gap-x-8 gap-y-3.5 sm:grid-cols-2">
                                        {features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2.5 text-[15px] font-medium text-stone-700 dark:text-zinc-200">
                                                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-mintcom-green" />
                                                <span className="leading-snug">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-transparent">
                                        <p className="text-sm leading-relaxed text-stone-500 dark:text-zinc-400">
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
                            className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/5 p-12 text-center"
                        >
                            <ModalCloseButton onClose={() => setShowAlreadySignedIn(false)} autoPositionAbsolute />
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
                                    className="w-full bg-mintcom-green text-black py-4 rounded-lg font-black text-lg transition-colors hover:bg-mintcom-green/90"
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


import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SplitText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => {
        const isPaymint = word.toLowerCase().includes('paymint');
        return (
          <span 
            key={i} 
            className={isPaymint ? 'text-paymint-green' : (i % 2 === 0 ? 'text-gray-900 dark:text-white' : 'text-paymint-green')}
          >
            {word}{' '}
          </span>
        );
      })}
    </span>
  );
};

export const PricingDownload = () => {
    const { t } = useTranslation();
    const [showDetails, setShowDetails] = useState(false);
    const [isYearly, setIsYearly] = useState(false);

    // Pricing constants
    const MONTHLY_PRICE = 20;
    const YEARLY_PRICE = 210;

    const currentPrice = isYearly ? YEARLY_PRICE : MONTHLY_PRICE;
    const currentPeriod = isYearly ? '/YEAR' : '/MONTH';
    const yearlySavings = (MONTHLY_PRICE * 12) - YEARLY_PRICE; // $30

    const plan = {
        name: t('landing.pricing.monthlyPlan'),
        price: (20).toLocaleString(t('common.locale'), { style: 'currency', currency: 'JOD', minimumFractionDigits: 0 }),
        period: t('landing.pricing.perMonth'),
        description: t('landing.pricing.planDescription'),
        features: [
            t('landing.pricing.features.pos'),
            t('landing.pricing.features.dashboard'),
            t('landing.pricing.features.unlimitedStaff'),
            t('landing.pricing.features.adminApp'),
            t('landing.pricing.features.support'),
            t('landing.pricing.features.reports')
        ],
        detailedFeatures: [
            t('landing.pricing.features.pointOfSale'),
            t('landing.pricing.features.inventory'),
            t('landing.pricing.features.staffManagement'),
            t('landing.pricing.features.advancedReporting'),
            t('landing.pricing.features.production')
        ],
        cta: t('landing.pricing.startFreeTrial'),
    };

    return (
        <section id="pricing" className="py-24 lg:py-32 bg-gray-50 dark:bg-[#080808] relative overflow-hidden transition-colors duration-500">
            {/* Dynamic Background Elements */}
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] -z-10" />

            <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
                {/* Header Section */}
                <div className="text-center mb-16 lg:mb-20">
                    <h2 className="text-4xl lg:text-6xl font-bold font-magilio mb-6 tracking-tighter leading-[1.3]">
                        <SplitText text={t('landing.pricing.title')} />
                    </h2>
                    <p className="text-2xl lg:text-3xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto font-black leading-tight mb-10">
                        {t('common.locale') === 'ar' ? (
                            <>لحظة <span className="text-paymint-green">"aha"</span> الخاصة بك على بعد دقائق فقط.</>
                        ) : (
                            <>Your <span className="text-paymint-green">"aha"</span> moment is just minutes away.</>
                        )}
                    </p>

                    {/* Billing Toggle */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-1.5 shadow-sm"
                    >
                        <button
                            onClick={() => setIsYearly(false)}
                            className={`px-6 py-3 rounded-xl text-sm font-black tracking-wider transition-all duration-300 ${!isYearly
                                    ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            MONTHLY
                        </button>
                        <button
                            onClick={() => setIsYearly(true)}
                            className={`px-6 py-3 rounded-xl text-sm font-black tracking-wider transition-all duration-300 relative ${isYearly
                                    ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            YEARLY
                            <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${isYearly
                                    ? 'bg-black text-paymint-green'
                                    : 'bg-paymint-green text-black'
                                } shadow-lg`}>
                                SAVE
                            </span>
                        </button>
                    </motion.div>
                </div>

                <div className="flex flex-col items-center justify-center">

                    {/* Premium Pricing Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="w-full lg:w-[480px] flex-shrink-0"
                    >
                        <div className="relative group h-full">
                            {/* Animated Glow Backdrop */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-paymint-green via-emerald-400 to-blue-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>

                            <div className="relative h-full bg-white dark:bg-[#0c0c0c] border border-gray-100 dark:border-white/10 rounded-[2.5rem] p-8 lg:p-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-none transition-all duration-500 group-hover:translate-y-[-8px] flex flex-col">

                                {/* Plan Identity */}
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="text-paymint-green text-xs font-black uppercase tracking-widest mb-1 italic">FULL ACCESS</div>
                                        <h3 className="text-2xl font-bold font-magilio text-gray-900 dark:text-white tracking-tight">
                                            {isYearly ? 'Yearly' : 'Monthly'} Plan
                                        </h3>
                                    </div>
                                </div>

                                {/* Price Large Display */}
                                <div className="mb-8">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={isYearly ? 'yearly' : 'monthly'}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.3 }}
                                            className="flex items-baseline gap-2"
                                        >
                                            <span className="text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tighter transition-all group-hover:text-paymint-green">
                                                ${currentPrice}
                                            </span>
                                            <span className="text-gray-400 dark:text-gray-500 font-black text-xl lg:text-2xl uppercase tracking-tighter">
                                                {currentPeriod}
                                            </span>
                                        </motion.div>
                                    </AnimatePresence>

                                    {isYearly && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-3 flex items-center gap-3"
                                        >
                                            <span className="text-sm font-bold text-gray-400 line-through">${MONTHLY_PRICE * 12}/yr</span>
                                            <span className="px-3 py-1 rounded-full bg-paymint-green/10 text-paymint-green text-xs font-black tracking-wider border border-paymint-green/20 flex items-center gap-1.5">
                                                <Sparkles size={12} />
                                                SAVE ${yearlySavings}
                                            </span>
                                        </motion.div>
                                    )}

                                    <p className="text-gray-500 dark:text-gray-400 mt-3 text-sm font-bold leading-relaxed italic">
                                        {isYearly ? 'Billed annually.' : 'No commitment.'}
                                    </p>
                                </div>

                                {/* Feature List */}
                                <div className="space-y-5 mb-10 flex-1">
                                    {[
                                        { label: t('landing.pricing.features.pos') },
                                        { label: t('landing.pricing.features.dashboard') },
                                        { label: t('landing.pricing.features.unlimitedStaff') },
                                        { label: t('landing.pricing.features.adminApp') },
                                        { label: t('landing.pricing.features.support') },
                                        { label: t('landing.pricing.features.reports') }
                                    ].map((f, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-4"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-paymint-green/10 flex items-center justify-center flex-shrink-0 group-hover:bg-paymint-green transition-colors duration-500">
                                                <Check size={14} className="text-paymint-green group-hover:text-black stroke-[4px] transition-colors duration-500" />
                                            </div>
                                            <div className="text-sm font-black text-gray-900 dark:text-gray-100">{f.label}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <div className="space-y-4">
                                    <button
                                        onClick={() => window.open('/signup', '_blank')}
                                        className="w-full py-6 bg-paymint-green text-black rounded-[1.5rem] font-black text-xl shadow-[0_20px_40px_-12px_rgba(0,186,124,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
                                        <span className="relative z-10">{plan.cta}</span>
                                        <ArrowRight size={22} className="relative z-10 transition-transform group-hover/btn:translate-x-2" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Plan Details Modal */}
            <AnimatePresence>
                {showDetails && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDetails(false)}
                            className="absolute inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-xl"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/5"
                        >
                            <div className="p-10">
                                <div className="text-center mb-10">
                                    <div className="inline-block bg-paymint-green/20 text-paymint-green px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase mb-4">
                                        Detailed View
                                    </div>
                                    <h2 className="text-4xl font-bold font-magilio text-gray-900 dark:text-white mb-4 tracking-tighter">{plan.name}</h2>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-5xl font-black text-paymint-green">{plan.price}</span>
                                        <span className="text-gray-500 font-bold">{plan.period}</span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-8 mb-10 border border-gray-100 dark:border-white/5">
                                    <h4 className="font-bold font-magilio text-gray-900 dark:text-white mb-6 text-xs uppercase tracking-[0.2em]">{t('pricing.whatsIncluded')}</h4>
                                    <ul className="grid grid-cols-1 gap-4">
                                        {[...plan.features, ...plan.detailedFeatures].map((feature, i) => (
                                            <li key={i} className="flex items-start gap-4 text-gray-700 dark:text-gray-300">
                                                <Check size={18} className="text-paymint-green mt-0.5 flex-shrink-0 stroke-[3px]" />
                                                <span className="text-sm font-bold">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => {
                                        window.open('/signup', '_blank');
                                        setShowDetails(false);
                                    }}
                                    className="w-full bg-paymint-green text-black py-5 rounded-2xl font-black text-lg transition-transform active:scale-95 shadow-xl shadow-paymint-green/20"
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </section>
    );
};

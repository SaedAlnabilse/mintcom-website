import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Pricing = () => {
  const { t } = useTranslation();
  const [isYearly, setIsYearly] = useState(false);

  // Pricing constants
  const MONTHLY_PRICE = 20;
  const YEARLY_PRICE = 210;
  const MONTHLY_ADDITIONAL = 17;
  const YEARLY_ADDITIONAL = 180;

  const currentPrice = isYearly ? YEARLY_PRICE : MONTHLY_PRICE;
  const currentPeriod = isYearly ? t('landing.pricing.perYear') || '/year' : t('landing.pricing.perMonth');
  const currentAdditionalPrice = isYearly ? YEARLY_ADDITIONAL : MONTHLY_ADDITIONAL;
  const yearlySavings = (MONTHLY_PRICE * 12) - YEARLY_PRICE;
  const yearlyAdditionalSavings = (MONTHLY_ADDITIONAL * 12) - YEARLY_ADDITIONAL;

  const plans = [
    {
      name: isYearly ? (t('landing.pricing.yearlyPlan') || 'Yearly Plan') : t('landing.pricing.monthlyPlan'),
      price: currentPrice.toLocaleString(t('common.locale'), { style: 'currency', currency: 'JOD', minimumFractionDigits: 0 }),
      period: currentPeriod,
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
      notIncluded: null,
      cta: t('landing.pricing.startFreeTrial'),
      highlight: true,
      type: "standard"
    }
  ];

  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const handlePlanAction = (plan: typeof plans[0]) => {
    if (plan.type === 'custom') {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        contactSection.scrollIntoView({ behavior: 'smooth' });
      }
      setSelectedPlan(null);
    } else {
      window.open('/signup', '_blank');
    }
  };

  return (
    <section id="pricing" className="py-24 lg:py-32 bg-gray-50 dark:bg-[#0f0f0f] relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-paymint-green/5 rounded-full blur-[150px] -z-10" />

      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-12"
        >
          <h2 className="text-5xl lg:text-7xl font-bold font-magilio text-gray-900 dark:text-white mb-5 leading-[1.1] rtl:leading-tight tracking-tight">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto font-light mb-8">
            {t('landing.pricing.subtitle')}
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-1.5 shadow-sm">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 ${!isYearly
                ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 relative ${isYearly
                ? 'bg-paymint-green text-black shadow-lg shadow-paymint-green/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Yearly
              <span className={`absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black tracking-wider ${isYearly ? 'bg-black text-paymint-green' : 'bg-paymint-green text-black'
                } shadow`}>
                SAVE
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 max-w-4xl mx-auto">
          {/* Main Plan Card */}
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-3xl p-8 border relative flex flex-col transition-all duration-300 ${plan.highlight
                ? 'border-paymint-green bg-white dark:bg-[#1a1a1a] shadow-2xl shadow-paymint-green/10 dark:shadow-none'
                : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] hover:border-paymint-green/30 shadow-lg shadow-gray-200/50 dark:shadow-none'
                }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-paymint-green text-black px-6 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-paymint-green/20">
                  {t('landing.pricing.popular')}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm h-10">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">${currentPrice}</span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{plan.period}</span>
                </div>

                {isYearly && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-400 line-through">${MONTHLY_PRICE * 12}/yr</span>
                    <span className="px-2 py-0.5 rounded-full bg-paymint-green/10 text-paymint-green text-xs font-bold border border-paymint-green/20 flex items-center gap-1">
                      <Sparkles size={10} />
                      Save ${yearlySavings}
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                    <div className="mt-0.5 w-5 h-5 rounded-full bg-paymint-green/10 dark:bg-paymint-green/20 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-paymint-green" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePlanAction(plan)}
                className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group ${plan.highlight
                  ? 'bg-paymint-green text-black hover:bg-paymint-green/90 shadow-lg shadow-paymint-green/20'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
              >
                {plan.cta}
                <ArrowRight size={18} className={`transition-transform ${t('common.locale') === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </button>

              <button
                onClick={() => setSelectedPlan(plan)}
                className="mt-4 text-sm text-gray-500 hover:text-paymint-green transition-colors text-center font-medium"
              >
                {t('pricing.viewDetails')}
              </button>
            </div>
          ))}

          {/* Additional Location Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="rounded-3xl p-8 border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151515] hover:border-blue-500/30 shadow-lg shadow-gray-200/50 dark:shadow-none relative flex flex-col transition-all duration-300"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 whitespace-nowrap">
              Multi-Branch
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <MapPin size={20} className="text-blue-500" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Additional Locations</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm h-10">Each extra location after your first one</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold text-gray-900 dark:text-white tracking-tight">${currentAdditionalPrice}</span>
                <span className="text-gray-500 dark:text-gray-400 font-medium">{isYearly ? '/year' : '/month'}</span>
              </div>

              {isYearly && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-400 line-through">${MONTHLY_ADDITIONAL * 12}/yr</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20 flex items-center gap-1">
                    <Sparkles size={10} />
                    Save ${yearlyAdditionalSavings}
                  </span>
                </div>
              )}

              {!isYearly && (
                <div className="mt-2">
                  <span className="text-xs text-gray-400">Instead of <span className="line-through">${MONTHLY_PRICE}/mo</span></span>
                </div>
              )}
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                "Same full access as your primary location",
                "Centralized dashboard management",
                "Separate staff & inventory per branch",
                "All reports combined or filtered"
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                  <div className="mt-0.5 w-5 h-5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Check size={12} className="text-blue-500" />
                  </div>
                  {feature}
                </li>
              ))}
            </ul>

            <button
              onClick={() => window.open('/signup', '_blank')}
              className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
            >
              Add Location
              <ArrowRight size={18} className={`transition-transform ${t('common.locale') === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Plan Details Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPlan(null)}
              className="absolute inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-md transition-colors"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#1a1a1a] w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/5 transition-colors duration-300"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-transparent">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('pricing.planDetails')}</h3>
                <button
                  onClick={() => setSelectedPlan(null)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X size={20} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white" />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="text-center mb-8">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{selectedPlan.name}</h2>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-4xl font-bold text-paymint-green">${currentPrice}</span>
                    <span className="text-gray-500 dark:text-gray-400">{currentPeriod}</span>
                  </div>
                  {isYearly && (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm text-gray-400 line-through">${MONTHLY_PRICE * 12}/yr</span>
                      <span className="px-2 py-0.5 rounded-full bg-paymint-green/10 text-paymint-green text-xs font-bold">Save ${yearlySavings}</span>
                    </div>
                  )}
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{selectedPlan.description}</p>
                </div>

                <div className="bg-gray-50 dark:bg-black/20 rounded-2xl p-6 mb-6 border border-gray-100 dark:border-transparent transition-colors">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-4 text-sm tracking-wider">{t('pricing.whatsIncluded')}</h4>
                  <ul className="space-y-3">
                    {[...selectedPlan.features, ...(selectedPlan.detailedFeatures || [])].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                        <Check size={16} className="text-paymint-green mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Additional location pricing in modal */}
                <div className="bg-blue-50 dark:bg-blue-500/5 rounded-2xl p-6 mb-6 border border-blue-100 dark:border-blue-500/10 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin size={16} className="text-blue-500" />
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm tracking-wider">Additional Locations</h4>
                  </div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-2xl font-bold text-blue-500">${currentAdditionalPrice}</span>
                    <span className="text-gray-500 text-sm">{isYearly ? '/year each' : '/month each'}</span>
                  </div>
                  {isYearly && (
                    <span className="text-xs text-blue-500 font-bold">Save ${yearlyAdditionalSavings}/yr per location</span>
                  )}
                  {!isYearly && (
                    <span className="text-xs text-gray-400">Instead of $20/mo — discounted for multi-branch</span>
                  )}
                </div>

                <button
                  onClick={() => handlePlanAction(selectedPlan)}
                  className="w-full bg-paymint-green text-black py-4 rounded-xl font-bold transition-all"
                >
                  {selectedPlan.cta}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

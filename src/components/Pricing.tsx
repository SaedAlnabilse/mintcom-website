import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export const Pricing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  // Pricing constants
  const MONTHLY_PRICE = 20;
  const YEARLY_PRICE = 210;
  const MONTHLY_ADDITIONAL = 17;
  const YEARLY_ADDITIONAL = 180;

  const currentPrice = isYearly ? YEARLY_PRICE : MONTHLY_PRICE;
  const currentAdditionalPrice = isYearly ? YEARLY_ADDITIONAL : MONTHLY_ADDITIONAL;

  const features = [
    t('landing.pricing.features.pos'),
    t('landing.pricing.features.dashboard'),
    t('landing.pricing.features.unlimitedStaff'),
    t('landing.pricing.features.adminApp'),
    t('landing.pricing.features.support'),
    t('landing.pricing.features.reports')
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
    <section id="pricing" className="py-24 lg:py-32 bg-white dark:bg-[#050505] relative overflow-hidden transition-colors duration-500">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-7xl pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#d4ff33]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#d4ff33]/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl relative z-10" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 lg:mb-20"
        >
          <h2 className="text-6xl lg:text-8xl font-bold font-magilio text-gray-900 dark:text-white mb-8 leading-tight tracking-tight">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-xl lg:text-3xl text-[#d4ff33] font-medium max-w-2xl mx-auto brightness-90">
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
            <div className="bg-[#0f0f0f] border border-white/5 rounded-[3rem] p-10 lg:p-16 shadow-2xl relative overflow-hidden group">
              <div className="flex flex-col lg:flex-row items-center lg:items-stretch gap-12 lg:gap-20">
                
                {/* Left Side: Pricing & CTA */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
                  <div className="w-full">
                    {/* Billing Toggle */}
                    <div className="bg-white/5 p-1 rounded-full flex items-center mb-12 w-fit mx-auto lg:mx-0 relative border border-white/5">
                      <button
                        onClick={() => setIsYearly(false)}
                        className={`px-8 py-3 text-sm font-bold rounded-full transition-all duration-300 z-10 ${
                          !isYearly ? 'bg-[#d4ff33] text-black' : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        {t('landing.pricing.monthly').toUpperCase()}
                      </button>
                      <button
                        onClick={() => setIsYearly(true)}
                        className={`px-8 py-3 text-sm font-bold rounded-full transition-all duration-300 z-10 flex items-center gap-2 ${
                          isYearly ? 'bg-[#d4ff33] text-black' : 'text-gray-500 hover:text-white'
                        }`}
                      >
                        {t('landing.pricing.yearly').toUpperCase()}
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider ${
                          isYearly ? 'bg-black/20 text-black' : 'bg-black text-[#d4ff33]'
                        }`}>
                          {t('landing.pricing.save').toUpperCase()}
                        </span>
                      </button>
                    </div>

                    <div className="mb-12 relative">
                      <div className="flex items-start justify-center lg:justify-start gap-1 mb-1">
                        <span className="text-3xl font-bold text-[#d4ff33] mt-2">$</span>
                        <span className="text-8xl sm:text-9xl lg:text-[10rem] leading-[0.8] font-black text-white tracking-tighter">
                          {currentPrice}
                        </span>
                        <div className="flex flex-col ml-4 mt-2 text-left">
                          <span className="text-gray-500 font-bold text-xl uppercase tracking-widest">
                            /{isYearly ? 'YEAR' : 'MONTH'}
                          </span>
                          <span className="text-gray-600 italic text-sm font-medium mt-1">
                            {isYearly ? t('landing.pricing.billedAnnually') : t('landing.pricing.noCommitment')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full mt-auto space-y-8">
                    <button
                      onClick={handleCtaAction}
                      className="w-full bg-[#d4ff33] text-black py-6 rounded-2xl font-black text-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-[#d4ff33]/20 flex items-center justify-center gap-4 group/btn uppercase tracking-tight"
                    >
                      {t('landing.pricing.getStarted', 'Get Started')}
                      <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center group-hover/btn:translate-x-1 transition-transform">
                        <ArrowRight size={20} className={t('common.locale') === 'ar' ? 'rotate-180' : ''} />
                      </div>
                    </button>

                    {/* Lower Section for Additional Locations */}
                    <div className="pt-8 border-t border-white/5 flex items-center justify-center lg:justify-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#d4ff33] animate-pulse shadow-[0_0_10px_#d4ff33]" />
                      <span className="text-gray-400 font-bold text-base tracking-wide">
                        {t('landing.pricing.additionalLocations', 'Additional Locations')}: <span className="text-[#d4ff33]">${currentAdditionalPrice}/month</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vertical Divider */}
                <div className="hidden lg:block w-px bg-white/10 self-stretch" />
                <div className="block lg:hidden h-px bg-white/10 w-full" />

                {/* Right Side: Features */}
                <div className="flex-1 w-full">
                  <div className="mb-10">
                    <h4 className="text-white font-bold text-2xl mb-2">
                      {t('landing.pricing.includedTitle', 'Everything you need')}
                    </h4>
                    <p className="text-gray-500 font-medium">
                      {t('landing.pricing.includedDesc', 'All features included in a single plan.')}
                    </p>
                  </div>
                  
                  <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-y-6 gap-x-8">
                    {features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-5 text-gray-300 font-semibold text-lg hover:text-white transition-colors group/item">
                        <div className="w-6 h-6 rounded-lg bg-[#d4ff33]/10 border border-[#d4ff33]/20 flex items-center justify-center flex-shrink-0 group-hover/item:bg-[#d4ff33]/20 transition-colors">
                          <Check size={16} className="text-[#d4ff33] stroke-[4px]" />
                        </div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-12 p-6 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-gray-400 text-sm leading-relaxed">
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
              <div className="w-20 h-20 bg-paymint-green/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Check size={40} className="text-paymint-green stroke-[3px]" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {t('landing.pricing.alreadySignedIn', 'You are already signed in')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-10 leading-relaxed font-medium">
                {t('landing.pricing.alreadySignedInDesc', 'You can continue to your Dashboard to manage your business.')}
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/owner')}
                  className="w-full bg-paymint-green text-black py-4 rounded-xl font-black text-lg transition-all hover:bg-paymint-green/90 shadow-lg shadow-paymint-green/20"
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

import { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Tag, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* -----------------------------------------------------------
   PricingDownload — Apple "single product page" pricing
   - Centered headline + animated "aha" pull-quote
   - Clean segmented control toggle (Monthly / Yearly)
   - Oversized price numerals with USD lockup
   - Two-column card: price + CTA on the left, included list on the right
   - Subtle floating glow + gradient frame around the pricing card
----------------------------------------------------------- */

export const PricingDownload = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isRtl = t('common.locale') === 'ar';
  const [isYearly, setIsYearly] = useState(false);

  const MONTHLY_PRICE = 20;
  const YEARLY_PRICE = 210;
  const MONTHLY_ADDITIONAL = 17;
  const YEARLY_ADDITIONAL = 180;

  const currentPrice = isYearly ? YEARLY_PRICE : MONTHLY_PRICE;
  const currentPeriod = isYearly
    ? t('landing.pricing.perYear')
    : t('landing.pricing.perMonth');
  const currentAdditionalPrice = isYearly ? YEARLY_ADDITIONAL : MONTHLY_ADDITIONAL;

  const features = [
    t('landing.pricing.features.pos'),
    t('landing.pricing.features.dashboard'),
    t('landing.pricing.features.unlimitedStaff'),
    t('landing.pricing.features.adminApp'),
    t('landing.pricing.features.support'),
    t('landing.pricing.features.reports'),
  ];

  const [showAlreadySignedIn, setShowAlreadySignedIn] = useState(false);

  const handleCtaAction = () => {
    if (isAuthenticated) setShowAlreadySignedIn(true);
    else window.open('/signup', '_blank');
  };

  return (
    <section
      id="pricing"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative overflow-hidden bg-white py-24 dark:bg-[#050505] lg:py-32"
    >
      {/* Background ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-paymint-green/10 blur-[140px]"
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '64px 64px',
            color: '#7CC39F',
            maskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
        {/* ---------- Header ---------- */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mx-auto mb-14 max-w-3xl text-center lg:mb-20"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-paymint-green/25 bg-white/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paymint-green shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(124,195,159,0.5)] backdrop-blur-xl dark:bg-white/5">
            <Wallet size={12} />
            <span>{t('landing.pricing.fullAccess')}</span>
          </div>

          <h2 className="font-magilio text-5xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white md:text-6xl lg:text-[72px]">
            {t('landing.pricing.title')}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl">
            {isRtl ? (
              <>
                لحظة <span className="font-semibold text-paymint-green">"aha"</span> الخاصة بك على بعد دقائق فقط.
              </>
            ) : (
              <>
                Your <span className="font-semibold text-paymint-green">"aha"</span> moment is just minutes away.
              </>
            )}
          </p>
        </motion.header>

        {/* ---------- Pricing card ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto max-w-5xl"
        >
          {/* Gradient halo border */}
          <div
            aria-hidden
            className="absolute -inset-px -z-10 rounded-[2.5rem] bg-gradient-to-tr from-paymint-green/40 via-transparent to-paymint-green/40 opacity-60 blur-2xl"
          />

          <div className="relative overflow-hidden rounded-[2.5rem] border border-gray-200/70 bg-white/90 p-8 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.08)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.03] dark:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.4)] md:p-12 lg:p-16">
            {/* Decorative corner glow */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-paymint-green/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
            />

            <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
              {/* ===== Left: Price + CTA ===== */}
              <div className="flex flex-col lg:border-r lg:border-gray-200/70 lg:pr-16 dark:lg:border-white/10">
                {/* Plan name */}
                <h3 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                  {isYearly
                    ? t('landing.pricing.yearlyPlan')
                    : t('landing.pricing.monthlyPlan')}
                </h3>

                {/* Segmented control */}
                <div className="relative mt-8 flex w-full items-center rounded-full border border-gray-200/80 bg-gray-100/80 p-1 backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <button
                    onClick={() => setIsYearly(false)}
                    className={`relative z-10 flex-1 rounded-full py-2.5 text-sm font-bold transition-colors duration-300 ${
                      !isYearly
                        ? 'text-black'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {t('landing.pricing.monthly')}
                  </button>
                  <button
                    onClick={() => setIsYearly(true)}
                    className={`relative z-10 flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition-colors duration-300 ${
                      isYearly
                        ? 'text-black'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {t('landing.pricing.yearly')}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black tracking-wider transition-all ${
                        isYearly
                          ? 'bg-black text-paymint-green'
                          : 'bg-paymint-green text-black'
                      }`}
                    >
                      {t('landing.pricing.save')}
                    </span>
                  </button>

                  {/* Sliding indicator */}
                  <motion.div
                    layout
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    style={{
                      transform: isRtl
                        ? isYearly
                          ? 'translateX(0%)'
                          : 'translateX(100%)'
                        : isYearly
                        ? 'translateX(100%)'
                        : 'translateX(0%)',
                    }}
                    className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-paymint-green shadow-lg shadow-paymint-green/40 transition-transform duration-300 ease-out"
                  />
                </div>

                {/* Price block */}
                <div className="mt-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isYearly ? 'yearly' : 'monthly'}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="flex items-baseline gap-2"
                    >
                      <span className="font-magilio text-6xl font-bold tracking-tighter text-gray-900 dark:text-white md:text-7xl lg:text-8xl">
                        {currentPrice}
                      </span>
                      <span className="font-magilio text-3xl font-bold text-gray-900 dark:text-white md:text-4xl">
                        USD
                      </span>
                      <span className="ml-1 text-base font-bold uppercase tracking-[0.15em] text-gray-400">
                        {currentPeriod}
                      </span>
                    </motion.div>
                  </AnimatePresence>

                  <p className="mt-3 text-sm italic text-gray-500 dark:text-gray-400">
                    {isYearly
                      ? t('landing.pricing.billedAnnually')
                      : t('landing.pricing.noCommitment')}
                  </p>
                </div>

                {/* CTA */}
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCtaAction}
                  className="group relative mt-10 inline-flex h-16 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-paymint-green text-lg font-black text-black shadow-[0_15px_40px_-12px_rgba(124,195,159,0.7)] transition-shadow hover:shadow-[0_20px_50px_-12px_rgba(124,195,159,0.8)]"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <span className="relative">
                    {t('landing.pricing.getStarted', 'Get Started')}
                  </span>
                  <ArrowRight
                    size={20}
                    className={`relative transition-transform ${
                      isRtl
                        ? 'rotate-180 group-hover:-translate-x-1'
                        : 'group-hover:translate-x-1'
                    }`}
                  />
                </motion.button>

                {/* Additional locations hint */}
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-paymint-green/20 bg-paymint-green/5 p-4">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-paymint-green/15 ring-1 ring-paymint-green/30">
                    <Tag size={14} className="text-paymint-green" />
                  </span>
                  <div className="text-sm font-semibold leading-relaxed text-gray-700 dark:text-gray-200">
                    <Trans
                      i18nKey="landing.pricing.additionalDiscount"
                      defaults="Additional locations receive a <1>DISCOUNT</1> for "
                      components={{
                        1: (
                          <span className="font-black uppercase text-gray-900 dark:text-white" />
                        ),
                      }}
                    />
                    <span className="whitespace-nowrap font-black text-gray-900 dark:text-white">
                      {currentAdditionalPrice} USD{currentPeriod}
                    </span>
                  </div>
                </div>
              </div>

              {/* ===== Right: Included features ===== */}
              <div className="flex flex-col">
                <div className="mb-8">
                  <h4 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {t('landing.pricing.includedTitle', 'Everything you need')}
                  </h4>
                  <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t(
                      'landing.pricing.includedDesc',
                      'All features included in a single plan.'
                    )}
                  </p>
                </div>

                <ul className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 lg:grid-cols-1">
                  {features.map((feature, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05, duration: 0.4 }}
                      className="group flex items-center gap-4"
                    >
                      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-paymint-green/15 ring-1 ring-paymint-green/25 transition-all group-hover:bg-paymint-green group-hover:ring-paymint-green/40">
                        <Check
                          size={14}
                          strokeWidth={4}
                          className="text-paymint-green transition-colors group-hover:text-black"
                        />
                      </span>
                      <span className="text-base font-semibold text-gray-700 dark:text-gray-200">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-auto">
                  <div className="mt-10 rounded-2xl border border-gray-100 bg-gray-50/70 p-5 dark:border-white/10 dark:bg-white/[0.03]">
                    <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                      {t(
                        'landing.pricing.setupFee',
                        'No setup fees or hidden charges. Cancel anytime.'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Already-signed-in modal */}
      <AnimatePresence>
        {showAlreadySignedIn && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAlreadySignedIn(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-sm overflow-hidden rounded-3xl border border-gray-100 bg-white p-12 text-center shadow-2xl dark:border-white/10 dark:bg-[#1a1a1a]"
            >
              <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-paymint-green/10">
                <Check size={40} strokeWidth={3} className="text-paymint-green" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                {t(
                  'landing.pricing.alreadySignedIn',
                  'You are already signed in'
                )}
              </h3>
              <p className="mb-10 font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                {t(
                  'landing.pricing.alreadySignedInDesc',
                  'You can continue to your Dashboard to manage your business.'
                )}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/owner')}
                  className="w-full rounded-2xl bg-paymint-green py-4 text-lg font-black text-black shadow-lg shadow-paymint-green/30 transition-all hover:bg-paymint-green/90"
                >
                  {t('landing.pricing.goToDashboard', 'Go to Dashboard')}
                </button>
                <button
                  onClick={() => setShowAlreadySignedIn(false)}
                  className="w-full rounded-2xl bg-gray-100 py-4 font-bold text-gray-900 transition-all hover:bg-gray-200 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
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

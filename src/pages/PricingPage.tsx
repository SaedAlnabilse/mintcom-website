import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Check, ArrowRight, ChevronDown } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { BILLING_CYCLES, MINTCOM_PRICING, getMintcomDiscountPercent, getMintcomEffectiveMonthlyPrice } from '../config/pricing';

const INCLUDED_KEYS = [
  'pages.pricing.included.pos',
  'pages.pricing.included.dashboard',
  'pages.pricing.included.staff',
  'pages.pricing.included.reports',
  'pages.pricing.included.loyalty',
  'pages.pricing.included.multi',
  'pages.pricing.included.mobile',
  'pages.pricing.included.ai',
  'pages.pricing.included.support',
  'pages.pricing.included.updates',
] as const;

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;

export const PricingPage = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
  const [yearly, setYearly] = useState(MINTCOM_PRICING.defaultBillingCycle === BILLING_CYCLES.YEARLY);
  const [openFaq, setOpenFaq] = useState<string | null>('q1');

  const monthlyPrice = MINTCOM_PRICING.primary.monthly;
  const yearlyPrice = MINTCOM_PRICING.primary.yearly;
  const discountPercent = getMintcomDiscountPercent();
  const effectiveMonthlyPrice = getMintcomEffectiveMonthlyPrice();
  const currency = MINTCOM_PRICING.currency;

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-white font-sans text-gray-900 dark:bg-[#0F172A] dark:text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Helmet>
        <title>{t('metadata.pricingPage.title')}</title>
        <meta name="description" content={t('metadata.pricingPage.description')} />
      </Helmet>
      <Navbar />

      <section className="relative overflow-hidden px-6 pb-12 pt-32">
        <div className="pointer-events-none absolute right-0 top-0 h-[420px] w-[420px] -translate-y-1/3 translate-x-1/3 rounded-full bg-mintcom-green/10 blur-[100px]" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-mintcom-green">{t('pages.pricing.badge')}</p>
            <h1 className="mb-4 font-magilio text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">{t('pages.pricing.title')}</h1>
            <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-base">
              {t('pages.pricing.subtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto w-full">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <div className="inline-flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`rounded-xl px-5 py-2 text-xs sm:text-sm font-bold transition ${
                  !yearly ? 'bg-mintcom-green text-black shadow-md shadow-mintcom-green/20' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {t('landing.pricing.monthly')}
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs sm:text-sm font-bold transition ${
                  yearly ? 'bg-mintcom-green text-black shadow-md shadow-mintcom-green/20' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                <span>{t('landing.pricing.yearly')}</span>
                {discountPercent > 0 && (
                  <span className={`text-xs font-black tracking-tight ${yearly ? 'text-black/80' : 'text-mintcom-green'}`}>
                    · {t('landing.pricing.savePercent', { percent: discountPercent, defaultValue: `Save ${discountPercent}%` })}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-[2rem] border border-mintcom-green/30 bg-white p-8 shadow-xl shadow-mintcom-green/10 dark:bg-[#0F172A] lg:col-span-2"
            >
              <p className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-mintcom-green">{t('landing.pricing.fullAccess')}</p>
              <h2 className="mb-6 font-barlow text-2xl font-bold">{yearly ? t('landing.pricing.yearlyPlan') : t('landing.pricing.monthlyPlan')}</h2>
              <div className="mb-2 flex items-baseline gap-3">
                <span className="font-magilio text-5xl font-bold text-gray-900 dark:text-white sm:text-6xl">
                  ${yearly ? effectiveMonthlyPrice : monthlyPrice}
                </span>
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                    USD / {t('common.month', { defaultValue: 'month' })}
                  </span>
                  <span className="text-xs font-medium text-gray-400 dark:text-gray-400">
                    {yearly
                      ? `$${yearlyPrice} USD ${t('landing.pricing.billedAnnually', { defaultValue: 'billed annually' })}`
                      : t('landing.pricing.noCommitment', { defaultValue: 'Billed monthly' })}
                  </span>
                </div>
              </div>
              <p className="mb-8 text-xs font-medium text-gray-500">
                {t('pages.pricing.perLocation')}
              </p>
              <Link
                to="/signup"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-mintcom-green/25"
              >
                {t('nav.getStarted')}
                <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />
              </Link>
              <p className="mt-4 text-center text-xs font-medium text-gray-500">{t('pages.pricing.trialNote')}</p>
            </motion.div>

            <div className="rounded-[2rem] border border-gray-100 bg-gray-50 p-8 dark:border-white/5 dark:bg-[#1E293B]/40 lg:col-span-3">
              <h3 className="mb-6 font-barlow text-lg font-bold">{t('pages.pricing.includedTitle')}</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {INCLUDED_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mintcom-green/15">
                      <Check size={12} className="text-mintcom-green" />
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-sm font-medium text-gray-500 dark:text-gray-400">{t('pages.pricing.noHardware')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-6 py-20 dark:bg-[#1E293B]/50">
        <div className="mx-auto w-full">
          <h2 className="mb-8 text-center font-magilio text-2xl font-bold sm:text-3xl">{t('pages.pricing.faqTitle')}</h2>
          <div className="space-y-3">
            {FAQ_KEYS.map((id) => {
              const open = openFaq === id;
              return (
                <div key={id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-white/5 dark:bg-[#0F172A]">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start"
                  >
                    <span className="font-barlow text-sm font-bold text-gray-900 dark:text-white">{t(`pages.pricing.faq.${id}.q`)}</span>
                    <ChevronDown size={18} className={`shrink-0 text-mintcom-green transition ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <p className="border-t border-gray-50 px-5 pb-5 pt-3 text-sm font-medium leading-relaxed text-gray-500 dark:border-white/5 dark:text-gray-400">
                      {t(`pages.pricing.faq.${id}.a`)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

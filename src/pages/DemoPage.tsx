import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  Store, CreditCard, Users, BarChart3, ChefHat, Building2,
  Sparkles, LayoutDashboard, Smartphone, Heart, Zap, ShieldCheck, BadgeCheck,
  Check, ArrowRight, ArrowUpRight, Mail, Send, Instagram, Youtube,
  HelpCircle, BookOpen, Ticket, ChevronRight,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import toast from 'react-hot-toast';
import {
  BILLING_CYCLES, MINTCOM_PRICING, getMintcomDiscountPercent, getMintcomEffectiveMonthlyPrice,
} from '../config/pricing';
import heroImage from '../assets/mintcom-pos-hero.png';
import heroImageWebp from '../assets/mintcom-pos-hero.webp';

/** Strip em/en/double dashes from translated copy — words stay, dashes go. */
const clean = (s: string) =>
  s.replace(/\s*--[ \s]*/g, ', ').replace(/\s*[—–]\s*/g, ', ');

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-mintcom-green focus:outline-none dark:border-white/10 dark:bg-white/5 dark:text-white';

/** Small uppercase kicker with section number, e.g. "01 — Why Mintcom". */
function Kicker({ no, text }: { no: string; text: string }) {
  return (
    <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-mintcom-green">
      <span className="text-gray-300 dark:text-gray-600">{no}</span>
      <span aria-hidden className="h-px w-8 bg-mintcom-green/40" />
      <span>{text}</span>
    </p>
  );
}

export const DemoPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isRtl = t('common.locale') === 'ar';
  const [isYearly, setIsYearly] = useState(MINTCOM_PRICING.defaultBillingCycle === BILLING_CYCLES.YEARLY);
  const [showAllHardware, setShowAllHardware] = useState(false);
  const [showAlreadySignedIn, setShowAlreadySignedIn] = useState(false);
  const [activeScope, setActiveScope] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', businessName: '', email: '', message: '' });

  const monthlyPrice = MINTCOM_PRICING.primary.monthly;
  const yearlyPrice = MINTCOM_PRICING.primary.yearly;
  const discountPercent = getMintcomDiscountPercent();
  const effectiveMonthlyPrice = getMintcomEffectiveMonthlyPrice();

  const handlePricingCta = () => {
    if (isAuthenticated) setShowAlreadySignedIn(true);
    else window.open('/signup', '_blank');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/contact', formData);
      setIsSuccess(true);
      setFormData({ fullName: '', businessName: '', email: '', message: '' });
      toast.success(t('landing.contact.messageSentSuccess'));
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || t('landing.contact.messageSentError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const whyRows = [
    { icon: BadgeCheck, title: t('landing.features.cards.complete.title'), description: t('landing.features.cards.complete.description') },
    { icon: Users, title: t('landing.features.cards.realUsers.title'), description: t('landing.features.cards.realUsers.description') },
    { icon: ShieldCheck, title: t('landing.features.cards.security.title'), description: t('landing.features.cards.security.description') },
    { icon: Building2, title: t('landing.features.cards.multiBranch.title'), description: t('landing.features.cards.multiBranch.description') },
  ];

  const workflowKeys = [
    'pointOfSale', 'salesControl', 'staffManagement', 'advancedReporting',
    'production', 'aiSystem', 'multiBranch', 'simpleUI',
    'mobileApp', 'loyalty', 'fastOnboarding', 'secure',
  ] as const;
  const workflowIcons = [Store, CreditCard, Users, BarChart3, ChefHat, Sparkles, Building2, LayoutDashboard, Smartphone, Heart, Zap, ShieldCheck];

  const scopes = [
    { tab: t('landing.cloudControl.scope.global'), title: t('landing.cloudControl.owner.title'), description: t('landing.cloudControl.owner.description') },
    { tab: t('landing.cloudControl.scope.brand'), title: t('landing.cloudControl.brand.title'), description: t('landing.cloudControl.brand.description') },
    { tab: t('landing.cloudControl.scope.location'), title: t('landing.cloudControl.location.title'), description: t('landing.cloudControl.location.description') },
  ];

  const pricingFeatures = [
    t('landing.pricing.features.pos'), t('landing.pricing.features.dashboard'),
    t('landing.pricing.features.unlimitedStaff'), t('landing.pricing.features.adminApp'),
    t('landing.pricing.features.support'), t('landing.pricing.features.reports'),
    t('landing.pricing.features.offlineSync'), t('landing.pricing.features.inventory'),
  ];

  const hardwareProducts = [
    'bixolon', 'citizen', 'epson', 'epsonM30', 'star', 'starMC', 'starMC2', 'starTSP654',
    'munbyn', 'ipad', 'ipadAir', 'ipadPro', 'samsungTab', 'samsungTabS9FE', 'surfaceGo', 'lenovo',
  ];
  const visibleHardware = showAllHardware ? hardwareProducts : hardwareProducts.slice(0, 6);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-[#0f0f0f] dark:text-white" dir={isRtl ? 'rtl' : 'ltr'}>
      <Helmet>
        <title>{t('metadata.home.title')}</title>
        <meta name="description" content={t('metadata.home.description')} />
      </Helmet>
      <Navbar />

      <main className="pt-16">
        {/* ===== 00 · Hero ===== */}
        <section className="border-b border-gray-200 dark:border-white/10">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div>
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-mintcom-green">{t('landing.hero.badge')}</p>
              <h1 className="mb-6 font-magilio text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
                <span className="block">{t('landing.hero.title1')}</span>
                <span className="block">{t('landing.hero.title2')}</span>
                <span className="block text-mintcom-green">{t('landing.hero.title3')}</span>
              </h1>
              <p className="mb-8 max-w-md text-lg leading-relaxed text-gray-600 dark:text-gray-400">
                {clean(t('landing.hero.description'))}
              </p>
              <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                <button
                  onClick={() => { if (isAuthenticated) navigate('/owner'); else window.open('/signup', '_blank'); }}
                  className="group inline-flex items-center gap-2 rounded-lg bg-mintcom-green px-6 py-3 text-[15px] font-bold text-black hover:bg-mintcom-green/90"
                >
                  {t('landing.hero.cta')}
                  <ArrowRight size={16} className={`transition-transform group-hover:translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={() => window.open('/try-pos', '_blank')}
                  className="group inline-flex items-center gap-1 text-[15px] font-bold text-gray-900 underline decoration-mintcom-green decoration-2 underline-offset-4 hover:text-mintcom-green dark:text-white"
                >
                  {t('landing.hero.tryDesktop')}
                  <ArrowUpRight size={15} />
                </button>
              </div>
              <p className="text-[13px] text-gray-500">{t('pages.pricing.trialNote', { defaultValue: 'Start with a 14-day free trial. Cancel anytime.' })}</p>
            </div>
            <div>
              <picture className="block h-auto w-full">
                <source srcSet={heroImageWebp} type="image/webp" />
                <img src={heroImage} alt={t('landing.hero.alt', 'Mintcom All-in-One POS System')} className="h-auto w-full object-contain" decoding="async" draggable={false} />
              </picture>
            </div>
          </div>
        </section>

        {/* ===== 01 · Why Mintcom — numbered rows ===== */}
        <section id="why-mintcom" className="border-b border-gray-200 dark:border-white/10">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[300px,1fr] lg:px-8 lg:py-24">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Kicker no="01" text={t('landing.features.badge')} />
              <h2 className="mb-4 font-magilio text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.features.title')} <span className="text-mintcom-green">{t('landing.features.titleHighlight')}</span>
              </h2>
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">{clean(t('landing.features.subtitle'))}</p>
            </div>
            <div className="divide-y divide-gray-200 border-y border-gray-200 dark:divide-white/10 dark:border-white/10">
              {whyRows.map((row, i) => (
                <div key={row.title} className="flex gap-5 py-7 first:pt-7">
                  <span className="w-8 shrink-0 font-magilio text-lg font-bold text-gray-300 dark:text-gray-600">0{i + 1}</span>
                  <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mintcom-green/10 text-mintcom-green">
                    <row.icon size={18} />
                  </span>
                  <div>
                    <h3 className="mb-1.5 text-lg font-bold">{row.title}</h3>
                    <p className="max-w-xl text-[15px] leading-relaxed text-gray-600 dark:text-gray-400">{clean(row.description)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== 02 · Features — sticky heading + compact list ===== */}
        <section id="features" className="border-b border-gray-200 dark:border-white/10">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[300px,1fr] lg:px-8 lg:py-24">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Kicker no="02" text={t('landing.workflow.badge')} />
              <h2 className="mb-4 font-magilio text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.workflow.title')} <span className="text-mintcom-green">{t('landing.workflow.titleHighlight', { price: monthlyPrice, currency: '' })}</span>
              </h2>
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">{clean(t('landing.workflow.subtitle'))}</p>
            </div>
            <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {workflowKeys.map((key, i) => {
                const Icon = workflowIcons[i];
                return (
                  <li key={key} className="flex gap-4 border-b border-gray-200 py-5 dark:border-white/10">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-mintcom-green dark:border-white/10">
                      <Icon size={17} />
                    </span>
                    <div>
                      <h3 className="mb-1 text-[15px] font-bold">{t(`landing.workflow.${key}.title`)}</h3>
                      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{clean(t(`landing.workflow.${key}.description`))}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* ===== 03 · Cloud control — tabs ===== */}
        <section id="cloud-control" className="border-b border-gray-200 dark:border-white/10">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
            <Kicker no="03" text={t('landing.cloudControl.badge')} />
            <h2 className="mb-4 max-w-2xl font-magilio text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.cloudControl.title', 'In-Sync Cloud Control')} <span className="text-mintcom-green">{t('landing.cloudControl.titleHighlight')}</span>
            </h2>
            <p className="mb-10 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400">{clean(t('landing.cloudControl.subtitle'))}</p>
            <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-0 dark:border-white/10">
              {scopes.map((scope, i) => (
                <button
                  key={scope.tab}
                  onClick={() => setActiveScope(i)}
                  className={`-mb-px border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
                    activeScope === i
                      ? 'border-mintcom-green text-gray-900 dark:text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {scope.tab}
                </button>
              ))}
            </div>
            <div className="max-w-3xl py-4">
              <h3 className="mb-2 text-xl font-bold">{scopes[activeScope].title}</h3>
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">{clean(scopes[activeScope].description)}</p>
            </div>
          </div>
        </section>

        {/* ===== 04 · Admin app — checklist panel ===== */}
        <section id="admin" className="border-b border-gray-200 dark:border-white/10">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-start gap-10 px-5 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
            <div>
              <Kicker no="04" text={t('landing.admin.badge')} />
              <h2 className="mb-4 font-magilio text-3xl font-bold tracking-tight sm:text-4xl">
                {t('landing.admin.title1')} {t('landing.admin.title2')} <span className="text-mintcom-green">{t('landing.admin.title3')}</span>
              </h2>
              <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">{clean(t('landing.admin.description'))}</p>
            </div>
            <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 dark:divide-white/10 dark:border-white/10">
              {[t('landing.admin.liveReports'), t('landing.admin.shiftAlerts'), t('landing.admin.stockAlerts')].map((item) => (
                <li key={item} className="flex items-start gap-3 p-5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mintcom-green text-black">
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <p className="text-[15px] font-semibold leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== 05 · Pricing ===== */}
        <section id="pricing" className="border-b border-gray-200 dark:border-white/10">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
            <Kicker no="05" text={t('landing.pricing.fullAccess')} />
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <h2 className="font-magilio text-3xl font-bold tracking-tight sm:text-4xl">{t('landing.pricing.title')}</h2>
              <div className="inline-flex rounded-lg border border-gray-200 p-1 dark:border-white/10">
                <button type="button" onClick={() => setIsYearly(false)} className={`rounded-md px-4 py-2 text-sm font-bold ${!isYearly ? 'bg-mintcom-green text-black' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t('landing.pricing.monthly')}
                </button>
                <button type="button" onClick={() => setIsYearly(true)} className={`rounded-md px-4 py-2 text-sm font-bold ${isYearly ? 'bg-mintcom-green text-black' : 'text-gray-500 dark:text-gray-400'}`}>
                  {t('landing.pricing.yearly')}
                  {discountPercent > 0 && <span className="ms-1 text-xs">· {t('landing.pricing.savePercent', { percent: discountPercent, defaultValue: `Save ${discountPercent}%` })}</span>}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <div>
                <h3 className="mb-2 font-magilio text-2xl font-bold">{isYearly ? t('landing.pricing.yearlyPlan') : t('landing.pricing.monthlyPlan')}</h3>
                <p className="mb-6 text-[15px] text-gray-600 dark:text-gray-400">{clean(t('landing.pricing.subtitle'))}</p>
                <p className="mb-6 text-6xl font-bold tracking-tighter">
                  ${isYearly ? effectiveMonthlyPrice : monthlyPrice}
                  <span className="ms-2 align-middle text-sm font-bold text-gray-500">USD / {t('common.month', { defaultValue: 'month' })}</span>
                </p>
                <p className="mb-6 text-sm text-gray-500">
                  {isYearly ? `$${yearlyPrice} USD ${t('landing.pricing.billedAnnually', { defaultValue: 'Billed annually.' })}` : t('landing.pricing.noCommitment', { defaultValue: 'Billed monthly.' })}
                </p>
                {showAlreadySignedIn ? (
                  <div className="rounded-lg border border-gray-200 p-4 dark:border-white/10">
                    <p className="text-sm font-bold">{t('landing.pricing.alreadySignedIn', 'You are already signed in')}</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t('landing.pricing.alreadySignedInDesc', 'You can continue to your Dashboard to manage your business.')}</p>
                    <Link to="/owner" className="mt-3 inline-block rounded-lg bg-mintcom-green px-5 py-2.5 text-sm font-bold text-black hover:bg-mintcom-green/90">
                      {t('landing.pricing.goToDashboard', 'Go to Dashboard')}
                    </Link>
                  </div>
                ) : (
                  <>
                    <button onClick={handlePricingCta} className="flex items-center gap-2 rounded-lg bg-mintcom-green px-6 py-3.5 text-base font-semibold text-black hover:bg-mintcom-green/90">
                      {t('landing.pricing.getStarted', 'Get Started')}
                      <ArrowRight size={18} className={isRtl ? 'rotate-180' : ''} />
                    </button>
                    <p className="mt-3 text-xs text-gray-500">{t('pages.pricing.trialNote', { defaultValue: 'Start with a 14-day free trial. Cancel anytime.' })}</p>
                  </>
                )}
              </div>
              <div>
                <h4 className="mb-1 text-lg font-bold">{t('landing.pricing.includedTitle', 'Everything you need')}</h4>
                <p className="mb-5 text-sm text-gray-600 dark:text-gray-400">{t('landing.pricing.includedDesc', 'All features included in a single plan.')}</p>
                <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  {pricingFeatures.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 border-b border-gray-200 py-3 text-sm font-semibold dark:border-white/10">
                      <Check size={15} strokeWidth={3} className="mt-0.5 shrink-0 text-mintcom-green" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm text-gray-600 dark:text-gray-400">{t('landing.pricing.setupFee', 'No setup fees or hidden charges. Cancel anytime.')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 06 · Hardware — compatibility list ===== */}
        <section id="hardware" className="border-b border-gray-200 dark:border-white/10">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[300px,1fr] lg:px-8 lg:py-24">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Kicker no="06" text={t('landing.hardware.title')} />
              <h2 className="mb-4 font-magilio text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="text-mintcom-green">{t('landing.hardware.titleHighlight')}</span>
              </h2>
              <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">{clean(t('landing.hardware.subtitle'))}</p>
              <button onClick={() => setShowAllHardware((v) => !v)} className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold hover:border-mintcom-green dark:border-white/15">
                {t('landing.hardware.viewAllOptions')}
              </button>
            </div>
            <div>
              <dl className="divide-y divide-gray-200 border-y border-gray-200 dark:divide-white/10 dark:border-white/10">
                {visibleHardware.map((id) => (
                  <div key={id} className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-[220px,1fr] sm:gap-6">
                    <dt className="text-sm font-bold">{t(`landing.hardware.products.${id}.name`)}</dt>
                    <dd className="text-sm text-gray-600 dark:text-gray-400">{t(`landing.hardware.products.${id}.specs`)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="mb-1 text-base font-bold">{t('landing.hardware.printers.name')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{clean(t('landing.hardware.printers.description'))}</p>
                  <p className="mt-1 text-xs text-gray-500">{t('common.tip')}: {t('landing.hardware.printers.note')}</p>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={16} strokeWidth={3} className="mt-0.5 shrink-0 text-mintcom-green" />
                  <span>
                    <h3 className="mb-1 text-base font-bold">{t('landing.hardware.alreadyHave')}</h3>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{clean(t('landing.hardware.alreadyHaveDesc'))}</p>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== 07 · Contact ===== */}
        <section id="contact" className="border-b border-gray-200 dark:border-white/10">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[300px,1fr] lg:px-8 lg:py-24">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Kicker no="07" text={t('landing.contact.title')} />
              <h2 className="mb-4 font-magilio text-3xl font-bold tracking-tight sm:text-4xl">
                <span>{t('landing.contact.titleHighlight')}</span>
              </h2>
              <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-400">{clean(t('landing.contact.subtitle'))}</p>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10">
                  <Mail size={18} className="text-mintcom-green" />
                </span>
                <div>
                  <a href="mailto:info@mintcompos.com" dir="ltr" className="block text-sm font-bold hover:text-mintcom-green">info@mintcompos.com</a>
                  <p className="text-xs text-gray-500">{t('landing.contact.responseTime')}</p>
                </div>
              </div>
            </div>
            <div>
              {isSuccess ? (
                <div className="rounded-xl border border-gray-200 p-8 text-center dark:border-white/10">
                  <p className="mb-2 text-lg font-bold">{t('landing.contact.success')}</p>
                  <button onClick={() => setIsSuccess(false)} className="mt-4 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-bold hover:border-mintcom-green dark:border-white/15">
                    {t('landing.contact.sendAnother')}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <input name="fullName" value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} required placeholder={t('landing.contact.placeholder.name')} aria-label={t('landing.contact.fullName')} className={inputCls} />
                  <input name="businessName" value={formData.businessName} onChange={(e) => setFormData((p) => ({ ...p, businessName: e.target.value }))} placeholder={t('landing.contact.placeholder.business')} aria-label={t('landing.contact.businessName')} className={inputCls} />
                  <input name="email" type="email" value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} required placeholder={t('landing.contact.placeholder.email')} aria-label={t('landing.contact.emailAddress')} className={`${inputCls} sm:col-span-2`} />
                  <textarea name="message" value={formData.message} onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))} required rows={5} placeholder={t('landing.contact.placeholder.message')} aria-label={t('landing.contact.yourMessage')} className={`${inputCls} resize-none sm:col-span-2`} />
                  <p className="text-xs text-gray-500 sm:col-span-2">
                    {t('landing.contact.termsAgree')} <Link to="/legal/privacy" className="underline hover:text-mintcom-green">{t('landing.contact.privacyPolicy')}</Link> {t('common.and')} <Link to="/legal/terms" className="underline hover:text-mintcom-green">{t('landing.contact.termsOfService')}</Link>
                  </p>
                  <div className="sm:col-span-2">
                    <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-lg bg-mintcom-green px-8 py-3.5 text-base font-semibold text-black hover:bg-mintcom-green/90 disabled:opacity-50">
                      <Send size={16} />
                      {t('landing.contact.sendMessage')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-10 px-5 py-12 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="col-span-2 lg:col-span-4">
            <Logo size="lg" />
            <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">{t('brand.description')}</p>
            <div className="mt-4 flex gap-2.5">
              <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-mintcom-green hover:text-mintcom-green dark:border-white/10">
                <Instagram size={16} />
              </a>
              <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:border-mintcom-green hover:text-mintcom-green dark:border-white/10">
                <Youtube size={16} />
              </a>
            </div>
            <a href="mailto:info@mintcompos.com" className="mt-4 flex items-center gap-2 text-[13px] text-gray-500 hover:text-mintcom-green dark:text-gray-400">
              <Mail size={13} className="shrink-0 text-mintcom-green" />
              <span dir="ltr">info@mintcompos.com</span>
            </a>
          </div>
          <div className="lg:col-span-2">
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em]">{t('footer.product')}</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li><Link to="/#features" className="text-gray-500 hover:text-mintcom-green dark:text-gray-400">{t('nav.features')}</Link></li>
              <li><Link to="/#pricing" className="text-gray-500 hover:text-mintcom-green dark:text-gray-400">{t('nav.pricing')}</Link></li>
              <li><Link to="/support" className="text-gray-500 hover:text-mintcom-green dark:text-gray-400">{t('nav.support')}</Link></li>
            </ul>
          </div>
          <div className="lg:col-span-2">
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em]">{t('footer.company')}</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li><Link to="/about" className="text-gray-500 hover:text-mintcom-green dark:text-gray-400">{t('footer.aboutUs')}</Link></li>
              <li><Link to="/#contact" className="text-gray-500 hover:text-mintcom-green dark:text-gray-400">{t('contact.title')}</Link></li>
            </ul>
            <h4 className="mb-4 mt-8 text-[11px] font-semibold uppercase tracking-[0.15em]">{t('footer.legal', { defaultValue: 'Legal' })}</h4>
            <ul className="space-y-2.5 text-[13px]">
              <li><Link to="/legal/privacy" className="text-gray-500 hover:text-mintcom-green dark:text-gray-400">{t('footer.privacyPolicy')}</Link></li>
              <li><Link to="/legal/terms" className="text-gray-500 hover:text-mintcom-green dark:text-gray-400">{t('footer.termsOfService')}</Link></li>
            </ul>
          </div>
          <div className="col-span-2 lg:col-span-4">
            <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.15em]">{t('footer.resources')}</h4>
            <Link to="/support" className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mintcom-green/10 text-mintcom-green">
                <HelpCircle size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t('footer.helpCenter')}</span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{t('footer.helpCenterDesc')}</span>
              </span>
              <ChevronRight size={16} className={`shrink-0 text-gray-300 ${isRtl ? 'rotate-180' : ''}`} />
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Link to="/support/articles" className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-600 hover:border-mintcom-green/40 hover:text-mintcom-green dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300">
                <BookOpen size={13} />
                <span>{t('footer.browseArticles')}</span>
              </Link>
              <Link to="/support/tickets/new" className="inline-flex items-center justify-center gap-2 rounded-lg bg-mintcom-green px-4 py-2.5 text-xs font-semibold text-black hover:bg-mintcom-green/90">
                <Ticket size={13} />
                <span>{t('footer.submitTicket')}</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200/70 dark:border-white/5">
          <div className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-6 lg:px-8">
            <p className="text-center text-xs text-gray-400 sm:text-start">{t('brand.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

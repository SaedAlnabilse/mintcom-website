import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Clock, Globe, BarChart3, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

export function CookiePolicyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#1E293B] font-sans text-gray-900 dark:text-white pb-20" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <Helmet>
        <title>{t('metadata.cookiePolicy.title')}</title>
        <meta name="description" content={t('metadata.cookiePolicy.description')} />
        <meta property="og:title" content={t('metadata.cookiePolicy.title')} />
        <meta property="og:description" content={t('metadata.cookiePolicy.description')} />
      </Helmet>
      {/* Header / Hero */}
      <div className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 text-paymint-green mb-4">
              <Shield size={24} />
              <span className="label-strong font-outfit uppercase">{t('legal.cookies.legalCenter')}</span>
            </div>
            <h1 className="font-magilio text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
              {t('legal.cookies.title')}
            </h1>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
              {t('legal.cookies.subtitle')}
            </p>
            <div className="flex items-center gap-4 text-xs font-bold text-gray-500 pt-4">
              <span className="flex items-center gap-2">
                <Clock size={16} />
                {t('legal.cookies.lastUpdated')}: {new Date('2026-02-02').toLocaleDateString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-[250px_1fr] gap-12">
        {/* Sidebar Navigation (Sticky) */}
        <aside className="hidden md:block">
          <div className="sticky top-24 space-y-1">
            {[
              { id: 'what-are-cookies', label: t('legal.cookies.sections.whatAre') },
              { id: 'why-use', label: t('legal.cookies.sections.whyUse') },
              { id: 'types-of-cookies', label: t('legal.cookies.sections.types') },
              { id: 'third-party', label: t('legal.cookies.sections.thirdParty') },
              { id: 'control', label: t('legal.cookies.sections.control') },
              { id: 'updates', label: t('legal.cookies.sections.updates') },
            ].map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="block py-2 px-4 rounded-lg text-xs font-bold text-gray-500 hover:text-paymint-green hover:bg-paymint-green/5 transition-all"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-8">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-gray-900 dark:bg-white text-white dark:text-black rounded-xl label-strong font-outfit shadow-lg hover:opacity-90 transition-all"
              >
                {t('legal.cookies.backToHome')}
              </button>
            </div>
          </div>
        </aside>

        {/* Article Content */}
        <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-paymint-green">

          <section id="what-are-cookies" className="scroll-mt-28">
            <h2>{t('legal.cookies.sections.whatAre')}</h2>
            <p>
              {t('legal.cookies.content.whatAre_1')}
            </p>
            <p>
              {t('legal.cookies.content.whatAre_2')}
            </p>
          </section>

          <section id="why-use" className="scroll-mt-28 pt-8">
            <h2>{t('legal.cookies.sections.whyUse')}</h2>
            <p>
              {t('legal.cookies.content.whyUse_1')}
            </p>
          </section>

          <section id="types-of-cookies" className="scroll-mt-28 pt-8">
            <h2>{t('legal.cookies.sections.types')}</h2>

            <div className="not-prose grid gap-6 mt-6 mb-8">
              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-paymint-green/10 dark:bg-paymint-green/ text-paymint-green rounded-lg">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-magilio text-base font-bold text-gray-900 dark:text-white m-0">{t('legal.cookies.cards.essential')}</h3>
                </div>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  {t('legal.cookies.cards.essentialDesc')}
                </p>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                    <BarChart3 size={20} />
                  </div>
                  <h3 className="font-magilio text-base font-bold text-gray-900 dark:text-white m-0">{t('legal.cookies.cards.analytics')}</h3>
                </div>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  {t('legal.cookies.cards.analyticsDesc')}
                </p>
              </div>

              <div className="p-6 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3 mb-3 text-gray-900 dark:text-white">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                    <Globe size={20} />
                  </div>
                  <h3 className="font-magilio text-base font-bold text-gray-900 dark:text-white m-0">{t('legal.cookies.cards.advertising')}</h3>
                </div>
                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                  {t('legal.cookies.cards.advertisingDesc')}
                </p>
              </div>
            </div>
          </section>

          <section id="third-party" className="scroll-mt-28 pt-8">
            <h2>{t('legal.cookies.sections.thirdParty')}</h2>
            <p>
              {t('legal.cookies.content.thirdParty_1')}
            </p>
            <ul className="list-disc pr-5 pl-5 space-y-2">
              <li><strong>{t('legal.cookies.content.ga')}</strong> {t('legal.cookies.content.gaDesc')}</li>
              <li><strong>{t('legal.cookies.content.fb')}</strong> {t('legal.cookies.content.fbDesc')}</li>
            </ul>
          </section>

          <section id="control" className="scroll-mt-28 pt-8">
            <h2>{t('legal.cookies.sections.control')}</h2>
            <p>
              {t('legal.cookies.content.control_1')}
            </p>
            <div className="bg-paymint-green/10 border border-paymint-green/20 rounded-xl p-6 my-6">
              <h4 className="font-magilio text-paymint-green font-bold text-base mb-2 not-prose">{t('legal.cookies.preferenceCenterTitle')}</h4>
              <p className="text-gray-700 dark:text-gray-300 text-xs font-bold mb-4">
                {t('legal.cookies.preferenceCenterSubtitle')}
              </p>
              <button
                onClick={() => {
                   window.dispatchEvent(new Event('open-cookie-preferences'));
                }}
                className="px-6 py-2.5 bg-paymint-green text-black label-strong font-outfit rounded-lg hover:bg-[#68B390] transition-colors shadow-sm"
              >
                {t('legal.cookies.openSettings')}
              </button>
            </div>
            <p>
              {t('legal.cookies.content.control_2')}
            </p>
          </section>

          <section id="updates" className="scroll-mt-28 pt-8">
            <h2>{t('legal.cookies.sections.updates')}</h2>
            <p>
              {t('legal.cookies.content.updates_1')}
            </p>
            <p>
              {t('legal.cookies.content.updates_2')}
            </p>
          </section>

          <section className="scroll-mt-28 pt-8 border-t border-gray-200 dark:border-white/10 mt-12">
            <h3>{t('legal.cookies.questions')}</h3>
            <p>
              {t('legal.cookies.content.questionsDesc')} <a href="mailto:privacy@paymintpos.net" className="text-paymint-green hover:underline">privacy@paymintpos.net</a>.
            </p>
          </section>

        </article>
      </div>
    </div>
  );
}


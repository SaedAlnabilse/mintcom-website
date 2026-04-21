import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { WorkflowSupport } from '../components/WorkflowSupport';
import { AdminControl } from '../components/AdminControl';
import { Hardware } from '../components/Hardware';
import { PricingDownload } from '../components/PricingDownload';
import { Contact } from '../components/Contact';
import { Footer } from '../components/Footer';

export const LandingPage = () => {
  const { t } = useTranslation();
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-paymint-dark font-sans text-gray-900 dark:text-paymint-light selection:bg-paymint-green selection:text-black" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <Helmet>
        <title>{t('metadata.home.title')}</title>
        <meta name="description" content={t('metadata.home.description')} />
        <meta property="og:title" content={t('metadata.home.title')} />
        <meta property="og:description" content={t('metadata.home.description')} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      <Navbar />
      <main>
        <Hero isVideoOpen={isVideoOpen} setIsVideoOpen={setIsVideoOpen} />
        <Features />
        <WorkflowSupport />
        <AdminControl />
        <PricingDownload />
        <Hardware />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}





import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { WorkflowSupport } from '../components/WorkflowSupport';
import { AdminControl } from '../components/AdminControl';
import { Hardware } from '../components/Hardware';
import { Pricing } from '../components/Pricing';

import { Contact } from '../components/Contact';
import { DownloadApp } from '../components/DownloadApp';
import { Footer } from '../components/Footer';

export const LandingPage = () => {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-paymint-dark font-sans text-gray-900 dark:text-paymint-light selection:bg-paymint-green selection:text-black">
      <Navbar />
      <main>
        <Hero isVideoOpen={isVideoOpen} setIsVideoOpen={setIsVideoOpen} />
        <Features />
        <WorkflowSupport />
        <AdminControl />
        <Hardware />
        <Pricing />
        <DownloadApp />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}




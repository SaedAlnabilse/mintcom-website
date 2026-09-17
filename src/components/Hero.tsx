import { SplitText } from "./landing/SplitText";
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ArrowUpRight } from 'lucide-react';
import { ModalCloseButton } from './ui';
import { useAuth } from '../context/AuthContext';
import { DEMO_VIDEO_POSTER_URL, HERO_VIDEO_URL, isNativeVideoUrl } from '../config/downloads';
import heroImage from '../assets/mintcom-pos-hero.png';
import heroImageWebp from '../assets/mintcom-pos-hero.webp';
import { ONBOARDING_START_PATH } from '../utils/onboardingLaunch';



export const Hero = ({ isVideoOpen, setIsVideoOpen }: { isVideoOpen: boolean; setIsVideoOpen: (open: boolean) => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, needsOnboarding } = useAuth();

  const handleCtaClick = () => {
    if (isAuthenticated && needsOnboarding) {
      window.open(ONBOARDING_START_PATH, '_blank', 'noopener,noreferrer');
      return;
    }
    if (isAuthenticated) {
      navigate('/owner');
      return;
    }
    window.open('/signup', '_blank');
  };

  return (
    <section className="relative overflow-hidden bg-white pb-12 pt-24 dark:bg-[#0f0f0f] sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-12 xl:gap-16">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full min-w-0 shrink-0 text-start lg:w-[45%] xl:w-[42%]"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mb-5 sm:mb-8"
            >
              <span className="text-[13px] font-bold uppercase leading-snug tracking-[0.12em] text-mintcom-green">
                {t('landing.hero.badge')}
              </span>
            </motion.div>

            <h1 className="mb-5 font-magilio text-3xl font-bold leading-tight tracking-tight sm:mb-6 sm:text-4xl lg:text-5xl xl:text-6xl">
              <span className="block leading-[1.15] rtl:leading-[1.25]"><SplitText text={t('landing.hero.title1')} /></span>
              <span className="block leading-[1.15] rtl:leading-[1.25]"><SplitText text={t('landing.hero.title2')} /></span>
              <span className="block leading-[1.15] rtl:leading-[1.25]"><SplitText text={t('landing.hero.title3')} /></span>
            </h1>

            <p className="mb-6 max-w-md text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:mb-8 sm:text-lg md:text-xl lg:max-w-none" dangerouslySetInnerHTML={{ __html: t('landing.hero.description').replace('360° POS solution', '<strong class="text-gray-900 dark:text-white">360° POS solution</strong>') }} />

            <div className="flex w-full flex-col items-start justify-start gap-4">
              <div className="flex w-full flex-col items-stretch gap-2.5 sm:w-auto sm:flex-row sm:items-center sm:gap-6">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCtaClick}
                  className="group inline-flex items-center justify-center gap-2 rounded-lg bg-mintcom-green px-6 py-3 text-center text-[15px] font-bold leading-snug text-black transition-colors hover:bg-mintcom-green/90 sm:whitespace-nowrap"
                >
                  <span>
                    {isAuthenticated
                      ? needsOnboarding
                        ? t('nav.continueOnboarding', { defaultValue: 'Continue Onboarding' })
                        : t('nav.dashboard', 'Go to Dashboard')
                      : t('landing.hero.cta')}
                  </span>
                  <ArrowRight size={16} className={`shrink-0 transition-transform ${t('common.locale') === 'ar' ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => window.open('/try-pos', '_blank')}
                  className="group inline-flex items-center justify-center gap-1 py-3 text-[15px] font-bold text-gray-900 underline decoration-mintcom-green decoration-2 underline-offset-4 transition-colors hover:text-mintcom-green dark:text-white sm:whitespace-nowrap"
                >
                  <span>{t('landing.hero.tryDesktop')}</span>
                  <ArrowUpRight size={15} className="shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </motion.button>
              </div>
              <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
                {t('pages.pricing.trialNote', { defaultValue: 'Start with a 14-day free trial. Cancel anytime.' })}
              </p>
            </div>

              {/* Temporarily hidden — re-enable when a dedicated hero video CTA is needed
              {HERO_VIDEO_URL && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsVideoOpen(true)}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-100 px-6 py-3.5 text-base font-bold text-gray-900 transition-colors hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:px-8 sm:py-4 sm:text-lg sm:w-72 whitespace-nowrap"
                >
                  <Play size={20} fill="currentColor" className="text-mintcom-green" />
                  {t('landing.hero.watchVideo')}
                </motion.button>
              )}
              */}


          </motion.div>

          {/* Visual — product photo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative mt-2 flex w-full min-w-0 flex-1 justify-center sm:mt-8 lg:mt-16 lg:justify-end"
          >
            <div className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[620px] xl:max-w-[760px]">
              <picture className="relative z-10 block h-auto w-full">
                <source srcSet={heroImageWebp} type="image/webp" />
                <img
                  src={heroImage}
                  alt={t('landing.hero.alt', 'Mintcom All-in-One POS System')}
                  className="h-auto w-full object-contain"
                  width={1350}
                  height={1250}
                  decoding="async"
                  fetchPriority="high"
                  draggable={false}
                />
              </picture>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && HERO_VIDEO_URL && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsVideoOpen(false)}
          >
            <ModalCloseButton
              onClose={() => setIsVideoOpen(false)}
              autoPositionAbsolute
              className="top-6 end-6 !bg-white/10 !border-white/20 !text-white hover:!text-white hover:!bg-white/20"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-6xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              {isNativeVideoUrl(HERO_VIDEO_URL) ? (
                <video
                  src={HERO_VIDEO_URL}
                  poster={DEMO_VIDEO_POSTER_URL}
                  className="h-full w-full bg-black object-contain"
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  title={t('landing.hero.watchVideo')}
                />
              ) : (
                <iframe
                  src={HERO_VIDEO_URL}
                  title={t('landing.hero.watchVideo')}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

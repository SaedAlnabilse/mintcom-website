import { SplitText } from "./landing/SplitText";
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Play, X, ArrowRight, Store } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEMO_VIDEO_POSTER_URL, HERO_VIDEO_URL, isNativeVideoUrl } from '../config/downloads';
import heroImage from '../assets/mintcom-pos-hero.png';
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
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-mintcom-green/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-mintcom-green/10 rounded-full blur-[100px]"
        />
      </div>

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
              className="mb-5 inline-flex max-w-full items-center gap-2.5 sm:mb-8"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-mintcom-green shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:border-white/10 dark:shadow-none">
                <Store size={14} strokeWidth={2.4} className="text-black" />
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-black/15 dark:bg-white/20" />
              <span className="min-w-0 text-[13px] font-semibold leading-snug tracking-wider text-gray-900 dark:text-white/85 md:text-sm">
                {t('landing.hero.badge')}
              </span>
            </motion.div>

            <h1 className="mb-5 font-magilio text-3xl font-bold leading-tight tracking-tight sm:mb-6 sm:text-4xl lg:text-5xl xl:text-6xl">
              <span className="block leading-[1.15] rtl:leading-[1.25]"><SplitText text={t('landing.hero.title1')} /></span>
              <span className="block leading-[1.15] rtl:leading-[1.25]"><SplitText text={t('landing.hero.title2')} /></span>
              <span className="block leading-[1.15] rtl:leading-[1.25]"><SplitText text={t('landing.hero.title3')} /></span>
            </h1>

            <p className="mb-6 max-w-md text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:mb-8 sm:text-lg md:text-xl lg:max-w-none" dangerouslySetInnerHTML={{ __html: t('landing.hero.description').replace('360° POS solution', '<strong class="text-gray-900 dark:text-white">360° POS solution</strong>') }} />

            <div className="flex w-full flex-col items-stretch justify-start gap-2.5 sm:flex-row sm:flex-nowrap sm:gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open('/try-pos', '_blank')}
                className="group flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-mintcom-green/40 bg-mintcom-green/10 px-4 py-3 text-center text-[15px] font-bold leading-snug text-gray-900 transition-colors hover:border-mintcom-green hover:bg-mintcom-green/15 dark:text-white sm:px-4 sm:py-3.5 sm:text-base md:px-5 md:text-[17px] sm:whitespace-nowrap"
              >
                <Play size={15} fill="currentColor" className="shrink-0 text-mintcom-green sm:h-[18px] sm:w-[18px]" />
                <span className="min-w-0">{t('landing.hero.tryDesktop')}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCtaClick}
                className="group flex min-h-12 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-mintcom-green px-4 py-3 text-center text-[15px] font-bold leading-snug text-black transition-all sm:px-4 sm:py-3.5 sm:text-base md:px-5 md:text-[17px] sm:whitespace-nowrap"
              >
                <span className="min-w-0">
                  {isAuthenticated
                    ? needsOnboarding
                      ? t('nav.continueOnboarding', { defaultValue: 'Continue Onboarding' })
                      : t('nav.dashboard', 'Go to Dashboard')
                    : t('landing.hero.cta')}
                </span>
                <ArrowRight size={17} className={`shrink-0 transition-transform sm:h-5 sm:w-5 ${t('common.locale') === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </motion.button>

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
            </div>


          </motion.div>

          {/* Visual — product photo */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="relative mt-2 flex w-full min-w-0 flex-1 justify-center sm:mt-8 lg:mt-16 lg:justify-end"
          >
            <motion.div
              className="relative w-full max-w-[340px] sm:max-w-[420px] md:max-w-[500px] lg:max-w-[620px] xl:max-w-[760px]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            >
              <img
                src={heroImage}
                alt={t('landing.hero.alt', 'Mintcom All-in-One POS System')}
                className="relative z-10 h-auto w-full object-contain drop-shadow-2xl"
                width={1350}
                height={1250}
                decoding="async"
                fetchPriority="high"
                draggable={false}
              />
            </motion.div>
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
            <button
              onClick={() => setIsVideoOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <X size={32} />
            </button>

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

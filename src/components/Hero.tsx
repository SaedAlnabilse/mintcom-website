import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Play, X, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SplitText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => {
        const isMintcom = word.toLowerCase().includes('mintcom');
        return (
          <span
            key={i}
            className={isMintcom ? 'text-mintcom-green' : (i % 2 === 0 ? 'text-gray-900 dark:text-white' : 'text-mintcom-green')}
          >
            {word}{' '}
          </span>
        );
      })}
    </span>
  );
};

export const Hero = ({ isVideoOpen, setIsVideoOpen }: { isVideoOpen: boolean; setIsVideoOpen: (open: boolean) => void }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate('/owner');
    } else {
      window.open('/signup', '_blank');
    }
  };

  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden bg-white dark:bg-[#0f0f0f]" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
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

      <div className="mx-auto w-[95%] max-w-[1200px] px-5 md:px-7 relative z-10">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:gap-16">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full min-w-0 flex-1 text-start"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="group relative mb-8 inline-flex max-w-full items-center gap-2.5 rounded-[12px] border border-mintcom-green/20 bg-mintcom-green/5 px-3 py-1.5 text-xs font-bold text-mintcom-green shadow-[0_0_15px_rgba(124,195,159,0.05)] backdrop-blur-md transition-all duration-300 hover:border-mintcom-green/40 dark:bg-mintcom-green/10 xs:px-3.5"
            >
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-mintcom-green/20 text-mintcom-green overflow-hidden">
                <Zap size={11} fill="currentColor" className="relative z-10" />
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-mintcom-green/30"
                />
              </div>
              <span className="min-w-0 leading-none text-[10px] uppercase tracking-widest md:text-[11px]">
                {t('landing.hero.badge')}
              </span>
            </motion.div>

            <h1 className="mb-8 font-magilio text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              <span className="block leading-[1.1] rtl:leading-[1.2]"><SplitText text={t('landing.hero.title1')} /></span>
              <span className="block leading-[1.1] rtl:leading-[1.2]"><SplitText text={t('landing.hero.title2')} /></span>
              <span className="block leading-[1.1] rtl:leading-[1.2]"><SplitText text={t('landing.hero.title3')} /></span>
            </h1>

            <p className="mb-10 max-w-2xl text-xl font-light leading-relaxed text-gray-600 dark:text-gray-400">
              {t('landing.hero.description')}
            </p>

            <div className="flex w-full flex-col justify-start gap-4 sm:w-auto sm:flex-row">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCtaClick}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green px-8 py-4 text-lg font-bold text-black transition-all sm:w-auto"
              >
                {isAuthenticated ? t('nav.dashboard', 'Go to Dashboard') : t('landing.hero.cta')}
                <ArrowRight size={20} className={`transition-transform ${t('common.locale') === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVideoOpen(true)}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-100 px-8 py-4 text-lg font-bold text-gray-900 transition-colors hover:bg-gray-200 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:w-auto"
              >
                <Play size={20} fill="currentColor" className="text-mintcom-green" />
                {t('landing.hero.watchVideo')}
              </motion.button>
            </div>


          </motion.div>

          {/* Visual Content / Hardware Mockups */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="perspective-1000 relative mt-12 w-full max-w-[700px] flex-1 lg:mt-0 lg:max-w-[800px] lg:-translate-x-20 xl:max-w-[900px] xl:-translate-x-28"
          >
            <div className="relative w-full aspect-square sm:aspect-[4/3] flex items-center justify-center">
              
              {/* Decorative Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-mintcom-green/20 via-transparent to-mintcom-green/5 rounded-full blur-3xl -z-20" />

              {/* Generated Mintcom POS System Image - mix-blend-multiply removes white bg in all modes */}
              <motion.div
                className="relative w-full max-w-[1100px] origin-center sm:w-[118%] lg:w-[140%] lg:origin-left"
                style={{ isolation: 'auto' }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="bg-transparent rounded-2xl overflow-hidden">
                  <img 
                    src="/mintcom-pos-hero.png" 
                    alt="Mintcom All-in-One POS System" 
                    className="w-full h-auto object-contain"
                  />
                </div>
              </motion.div>

            </div>
          </motion.div>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {isVideoOpen && (
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
              <iframe
                src=""
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

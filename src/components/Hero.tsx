import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Play, X, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SplitText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => {
        const isPaymint = word.toLowerCase().includes('paymint');
        return (
          <span
            key={i}
            className={isPaymint ? 'text-paymint-green' : (i % 2 === 0 ? 'text-gray-900 dark:text-white' : 'text-paymint-green')}
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
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-20 overflow-hidden bg-white dark:bg-[#050505]" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
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
          className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-paymint-green/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-paymint-green/10 rounded-full blur-[100px]"
        />
      </div>

      <div className="container mx-auto px-6 md:px-10 max-w-[1280px] relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex-1 text-center lg:text-start"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-xl border border-paymint-green/25 bg-white/60 dark:bg-white/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paymint-green shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(124,195,159,0.5)] backdrop-blur-xl mb-6"
            >
              <Zap size={12} fill="currentColor" />
              <span>
                {t('landing.hero.badge')}
              </span>
            </motion.div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold font-magilio mb-8 leading-[1.1] rtl:leading-[1.2] tracking-tight">
              <SplitText text={t('landing.hero.title1')} /> <br />
              <SplitText text={t('landing.hero.title2')} /> <br />
              <SplitText text={t('landing.hero.title3')} />
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light">
              {t('landing.hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCtaClick}
                className="bg-paymint-green text-black px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 group"
              >
                {isAuthenticated ? t('nav.dashboard', 'Go to Dashboard') : t('landing.hero.cta')}
                <ArrowRight size={20} className={`transition-transform ${t('common.locale') === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsVideoOpen(true)}
                className="bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
              >
                <Play size={20} fill="currentColor" className="text-paymint-green" />
                {t('landing.hero.watchVideo')}
              </motion.button>
            </div>


          </motion.div>

          {/* Visual Content / Hardware Mockups */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="flex-1 w-full max-w-[700px] lg:max-w-[800px] xl:max-w-[900px] relative mt-16 lg:mt-0 perspective-1000 lg:-translate-x-20 xl:-translate-x-28"
          >
            <div className="relative w-full aspect-square sm:aspect-[4/3] flex items-center justify-center">
              
              {/* Decorative Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-paymint-green/20 via-transparent to-paymint-green/5 rounded-full blur-3xl -z-20" />

              {/* Generated PayMint POS System Image - mix-blend-multiply removes white bg in all modes */}
              <motion.div
                className="relative w-[140%] sm:w-[135%] max-w-[1100px] scale-110 origin-center lg:origin-left"
                style={{ isolation: 'auto' }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="bg-transparent rounded-2xl overflow-hidden">
                  <img 
                    src="/paymint-pos-hero.png" 
                    alt="PayMint All-in-One POS System" 
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
                src="https://player.vimeo.com/video/1158972798?h=234e7f9175&autoplay=1&title=0&byline=0&portrait=0"
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





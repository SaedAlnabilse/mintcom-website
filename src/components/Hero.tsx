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

      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl relative z-10">
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
              className="inline-flex items-center gap-2 rtl:gap-3 px-4 py-2 rounded-[12px] bg-paymint-green/10 text-paymint-green font-medium text-sm mb-8 border border-paymint-green/20"
            >
              <Zap size={14} fill="currentColor" />
              <span>{t('landing.hero.badge')}</span>
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
            className="flex-1 w-full max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] relative mt-12 lg:mt-0 perspective-1000 lg:-translate-x-12 xl:-translate-x-16"
          >
            <div className="relative w-full aspect-square sm:aspect-[4/3] flex items-center justify-center">
              
              {/* Decorative Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-paymint-green/20 via-transparent to-paymint-green/5 rounded-full blur-3xl -z-20" />

              {/* Main POS Terminal / Desktop (Back/Center) */}
              <motion.div 
                className="absolute z-10 w-[85%] max-w-[600px] top-[5%] left-[50%] -translate-x-1/2 drop-shadow-2xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              >
                {/* Terminal Stand */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-gradient-to-b from-gray-300 to-gray-400 dark:from-gray-800 dark:to-gray-900 rounded-b-3xl -z-10 shadow-xl border-x border-b border-gray-200 dark:border-gray-700">
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-56 h-4 bg-black/20 dark:bg-black/50 rounded-full blur-md translate-y-3" />
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-2 bg-gray-400 dark:bg-gray-700 rounded-full" />
                </div>
                {/* Terminal Screen */}
                <div className="w-full bg-white dark:bg-gray-900 rounded-2xl p-2 sm:p-3 border-[3px] border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden relative">
                   <div className="w-full aspect-[16/10] bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden relative border border-gray-200 dark:border-gray-800">
                      <img src="/sales-dashboard.png" alt="PayMint Dashboard" className="w-full h-full object-cover object-left-top opacity-95" />
                      {/* Glass Reflection */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                   </div>
                </div>
              </motion.div>

              {/* Customer Facing Display (Tablet - Front Left) */}
              <motion.div 
                className="absolute z-20 w-[50%] max-w-[320px] bottom-[10%] left-[2%] drop-shadow-2xl"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="w-full bg-gray-800 dark:bg-black rounded-3xl p-2 sm:p-2.5 border-4 border-gray-700 dark:border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden transform -rotate-3 transition-transform hover:rotate-0 duration-500">
                   <div className="w-full aspect-[4/3] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden relative">
                      <img src="/admin-dashboard.png" alt="Customer Display" className="w-full h-full object-cover object-right-bottom scale-125 origin-bottom-right opacity-95" />
                      <div className="absolute inset-0 bg-black/5 pointer-events-none" />
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-black/50 border border-white/10" />
                   </div>
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




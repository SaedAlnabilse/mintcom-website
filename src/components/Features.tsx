import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Zap, Settings, Store, Play } from 'lucide-react';

export const Features = () => {
  const { t } = useTranslation();
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <Store className="w-6 h-6 text-white" />,
      title: t('features.feature1.title'),
      description: t('features.feature1.description')
    },
    {
      icon: <Zap className="w-6 h-6 text-white" />,
      title: t('features.feature2.title'),
      description: t('features.feature2.description')
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-white" />,
      title: t('features.feature3.title'),
      description: t('features.feature3.description')
    },
    {
      icon: <Settings className="w-6 h-6 text-white" />,
      title: t('features.feature4.title'),
      description: t('features.feature4.description')
    }
  ];

  // Lazy load video when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVideoLoaded) {
            setIsVideoVisible(true);
            setIsVideoLoaded(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0 }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [isVideoLoaded]);

  return (
    <section id="features" className="py-20 lg:py-28 bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-paymint-green/3 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-paymint-green/10 border border-paymint-green/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-paymint-green" />
            <span className="text-paymint-green text-xs font-bold uppercase tracking-wider">{t('features.badge')}</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold font-sans text-gray-900 dark:text-white mb-5 tracking-tight leading-[1.1]">
            {t('features.title')} <span className="text-paymint-green">{t('features.titleHighlight')}</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
        </motion.div>

        {/* Video + Features Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* Video Card - Spans 7 columns */}
          <motion.div
            ref={videoRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-7"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 aspect-video bg-gray-900 group h-full min-h-[320px]">
              {isVideoVisible ? (
                <iframe
                  src="https://player.vimeo.com/video/1158972798?h=234e7f9175&autoplay=1&background=1&muted=1&loop=1"
                  className="w-full h-full scale-105 group-hover:scale-100 transition-transform duration-700"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  style={{ pointerEvents: 'none' }}
                  loading="lazy"
                  title="PayMint Demo Video"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-paymint-green/20 flex items-center justify-center mx-auto mb-4">
                      <Play className="w-8 h-8 text-paymint-green" fill="currentColor" />
                    </div>
                    <p className="text-white/60 text-sm">Loading video...</p>
                  </div>
                </div>
              )}

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />

              <div className="absolute bottom-6 left-6 right-6 text-white z-10 pointer-events-none">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 mb-3">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/90">{t('features.liveDemo')}</span>
                    </div>
                    <h4 className="font-bold text-xl lg:text-2xl mb-1 tracking-tight">{t('features.seeInAction')}</h4>
                    <p className="text-sm text-white/70">{t('features.seamlessSync')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature Cards Grid - Spans 5 columns */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="flex flex-col p-5 rounded-2xl bg-white dark:bg-[#151515] border border-gray-100 dark:border-white/5 hover:border-paymint-green/30 hover:shadow-lg hover:shadow-paymint-green/5 transition-all duration-300 group h-full"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/15 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-paymint-green transition-colors leading-tight">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

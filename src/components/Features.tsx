import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Zap, Settings, Store, Play, Sparkles } from 'lucide-react';

const FeatureCard = ({ feature, index, t }: { feature: any, index: number, t: any }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = feature.description as string;
  const shouldTruncate = description.length > 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="flex flex-col p-8 rounded-xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 hover:border-mintcom-green/30 shadow-xl shadow-gray-200/20 dark:shadow-none hover:shadow-2xl hover:shadow-mintcom-green/10 transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-mintcom-green/10 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:bg-mintcom-green group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
        <div className="text-mintcom-green group-hover:text-white transition-colors duration-500">
          {feature.icon}
        </div>
      </div>

      <h3 className="font-barlow text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-mintcom-green transition-colors leading-snug tracking-tight">
        {feature.title}
      </h3>

      <div className="flex-1 flex flex-col justify-between">
        <div className="relative">
          <p className={`font-barlow text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium transition-all duration-300 ${!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}`}>
            {description}
          </p>
        </div>

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 text-sm font-bold font-barlow text-mintcom-green hover:text-mintcom-green/80 self-start transition-colors focus:outline-none"
          >
            {isExpanded ? t('landing.features.readLess', 'Read less') : t('landing.features.readMore', 'Read more')}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export const Features = () => {
  const { t } = useTranslation();
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  const features = [
    {
      icon: <Store className="w-6 h-6" />,
      title: t('landing.features.cards.complete.title'),
      description: t('landing.features.cards.complete.description')
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('landing.features.cards.realUsers.title'),
      description: t('landing.features.cards.realUsers.description')
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: t('landing.features.cards.security.title'),
      description: t('landing.features.cards.security.description')
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: t('landing.features.cards.multiBranch.title'),
      description: t('landing.features.cards.multiBranch.description')
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
    <section id="features" className="py-16 lg:py-20 bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden relative" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-mintcom-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-mintcom-green/3 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 md:px-10 lg:px-16 max-w-[1280px]">

        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[12px] bg-mintcom-green/5 dark:bg-mintcom-green/10 text-mintcom-green font-bold text-xs mb-8 border border-mintcom-green/20 backdrop-blur-md shadow-[0_0_15px_rgba(124,195,159,0.05)] hover:border-mintcom-green/40 transition-all duration-300 mx-auto"
          >
            <div className="relative flex items-center justify-center w-5 h-5 rounded-[6px] bg-mintcom-green/20 text-mintcom-green overflow-hidden">
              <Sparkles size={11} className="relative z-10" />
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-mintcom-green/30"
              />
            </div>
            <span className="tracking-widest uppercase text-[10px] md:text-[11px] leading-none">
              {t('landing.features.badge')}
            </span>
          </motion.div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.2] rtl:leading-[1.3] tracking-tight">
            <span className="text-gray-900 dark:text-white">{t('landing.features.title')}</span>{' '}
            <span className="text-mintcom-green">{t('landing.features.titleHighlight')}</span>
          </h2>
          <p className="mb-10 max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        {/* Redesigned Layout: Cards First, then Video */}
        <div className="flex flex-col gap-16 lg:gap-24">

          {/* Feature Cards Grid - Spans full width 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} t={t} />
            ))}
          </div>

          {/* Video Section */}
          <motion.div
            ref={videoRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="w-full max-w-7xl mx-auto"
          >
            <div className="relative rounded-xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-white/10 aspect-video bg-gray-900 group">
              {isVideoVisible ? (
                <iframe
                  src=""
                  className="w-full h-full scale-[1.02] group-hover:scale-100 transition-transform duration-1000"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  style={{ pointerEvents: 'none' }}
                  loading="lazy"
                  title={t('landing.features.videoTitle')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-900">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-mintcom-green/20 flex items-center justify-center mx-auto mb-6">
                      <Play className="w-10 h-10 text-mintcom-green" fill="currentColor" />
                    </div>
                    <p className="text-white/60 text-sm font-bold uppercase tracking-widest">{t('common.loadingVideo')}</p>
                  </div>
                </div>
              )}

              {/* Overlay Content */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

              <div className="absolute bottom-8 left-8 right-8 md:bottom-12 md:left-12 text-white z-10 pointer-events-none">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 mb-4 shadow-lg">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mintcom-green opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-mintcom-green"></span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">{t('landing.features.liveDemo')}</span>
                    </div>
                    <h4 className="font-bold font-barlow text-3xl md:text-5xl mb-2 tracking-tighter">{t('landing.features.seeInAction')}</h4>
                    <p className="text-base md:text-lg text-white/70 font-medium">{t('landing.features.seamlessSync')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

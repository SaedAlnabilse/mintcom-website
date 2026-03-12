import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Zap, Settings, Store, Play } from 'lucide-react';

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
      className="flex flex-col p-8 rounded-xl bg-white dark:bg-[#121212] border border-gray-100 dark:border-white/5 hover:border-paymint-green/30 shadow-xl shadow-gray-200/20 dark:shadow-none hover:shadow-2xl hover:shadow-paymint-green/10 transition-all duration-500 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-paymint-green/10 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:bg-paymint-green group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
        <div className="text-paymint-green group-hover:text-white transition-colors duration-500">
          {feature.icon}
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-paymint-green transition-colors leading-tight tracking-tight">
        {feature.title}
      </h3>

      <div className="flex-1 flex flex-col justify-between">
        <div className="relative">
          <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium transition-all duration-300 ${!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}`}>
            {description}
          </p>
        </div>

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 text-sm font-bold text-paymint-green hover:text-paymint-green/80 self-start transition-colors focus:outline-none"
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-[12px] bg-paymint-green/10 border border-paymint-green/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-paymint-green" />
            <span className="text-paymint-green text-xs font-bold uppercase tracking-wider">{t('landing.features.badge')}</span>
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.2] rtl:leading-[1.3] tracking-tight">
            <SplitText text={t('landing.features.title') + ' ' + t('landing.features.titleHighlight')} />
          </h2>
          <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto font-light">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        {/* Redesigned Layout: Cards First, then Video or vice-versa */}
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
            className="w-full max-w-5xl mx-auto"
          >
            <div className="relative rounded-xl overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-gray-200 dark:border-white/10 aspect-video bg-gray-900 group">
              {isVideoVisible ? (
                <iframe
                  src="https://player.vimeo.com/video/1158972798?h=234e7f9175&autoplay=1&background=1&muted=1&loop=1"
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
                    <div className="w-20 h-20 rounded-full bg-paymint-green/20 flex items-center justify-center mx-auto mb-6">
                      <Play className="w-10 h-10 text-paymint-green" fill="currentColor" />
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
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">{t('landing.features.liveDemo')}</span>
                    </div>
                    <h4 className="font-bold font-magilio text-3xl md:text-5xl mb-2 tracking-tighter">{t('landing.features.seeInAction')}</h4>
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

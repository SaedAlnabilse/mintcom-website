import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Zap,
  Settings,
  Store,
  Play,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

/* -----------------------------------------------------------
   Features — Apple-style "bento" canvas
   - Centered eyebrow + oversized headline
   - Cinematic showcase video as the marquee piece
   - Asymmetric bento grid for the four feature cards
   - Subtle parallax + reveal motion
----------------------------------------------------------- */

type FeatureItem = {
  icon: React.ReactNode;
  title: string;
  description: string;
  tone: 'default' | 'accent';
};

const FeatureCard = ({
  feature,
  index,
  t,
}: {
  feature: FeatureItem;
  index: number;
  t: any;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const description = feature.description;
  const shouldTruncate = description.length > 120;
  const isAccent = feature.tone === 'accent';

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className={`group relative flex flex-col overflow-hidden rounded-3xl p-8 lg:p-10 ${
        isAccent
          ? 'bg-gradient-to-br from-paymint-green/15 via-paymint-green/5 to-transparent border border-paymint-green/25 dark:from-paymint-green/20 dark:via-paymint-green/8'
          : 'bg-white border border-gray-100 dark:bg-white/[0.03] dark:border-white/10'
      } shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] dark:shadow-none transition-all duration-500 hover:border-paymint-green/40 hover:shadow-[0_10px_30px_-10px_rgba(124,195,159,0.2)]`}
    >
      {/* Decorative glow that follows hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-paymint-green/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
      />

      {/* Icon tile */}
      <div className="relative mb-7 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-paymint-green/10 ring-1 ring-paymint-green/25 backdrop-blur-sm transition-all duration-500 group-hover:bg-paymint-green group-hover:ring-paymint-green/60 group-hover:shadow-[0_10px_30px_-8px_rgba(124,195,159,0.6)]">
        <div className="text-paymint-green transition-colors duration-500 group-hover:text-black">
          {feature.icon}
        </div>
      </div>

      <h3 className="font-magilio mb-4 text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">
        {feature.title}
      </h3>

      <div className="flex-1 flex flex-col justify-between">
        <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium transition-all duration-300 ${!isExpanded && shouldTruncate ? 'line-clamp-4' : ''}`}>
          {description}
        </p>

        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-paymint-green hover:text-paymint-green/80 self-start transition-colors focus:outline-none"
          >
            {isExpanded
              ? t('landing.features.readLess', 'Read less')
              : t('landing.features.readMore', 'Read more')}
            <ArrowUpRight
              size={14}
              className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>
    </motion.article>
  );
};

export const Features = () => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);
  const isRtl = t('common.locale') === 'ar';

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);

  const features: FeatureItem[] = [
    {
      icon: <Store className="h-7 w-7" />,
      title: t('landing.features.cards.complete.title'),
      description: t('landing.features.cards.complete.description'),
      tone: 'accent',
    },
    {
      icon: <Zap className="h-7 w-7" />,
      title: t('landing.features.cards.realUsers.title'),
      description: t('landing.features.cards.realUsers.description'),
      tone: 'default',
    },
    {
      icon: <ShieldCheck className="h-7 w-7" />,
      title: t('landing.features.cards.security.title'),
      description: t('landing.features.cards.security.description'),
      tone: 'default',
    },
    {
      icon: <Settings className="h-7 w-7" />,
      title: t('landing.features.cards.multiBranch.title'),
      description: t('landing.features.cards.multiBranch.description'),
      tone: 'accent',
    },
  ];

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
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isVideoLoaded]);

  return (
    <section
      id="features"
      ref={sectionRef}
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white py-24 dark:from-[#050505] dark:via-[#0a0a0a] dark:to-[#050505] lg:py-32"
    >
      {/* Background ambient blobs */}
      <motion.div
        aria-hidden
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 right-[-10%] h-[600px] w-[600px] rounded-full bg-paymint-green/8 blur-[140px]" />
        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-paymint-green/5 blur-[120px]" />
      </motion.div>

      <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-14 max-w-3xl text-center lg:mb-20"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-paymint-green/25 bg-white/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paymint-green shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(124,195,159,0.5)] backdrop-blur-xl dark:bg-white/5">
            <Sparkles size={12} />
            <span>{t('landing.features.badge')}</span>
          </div>

          <h2 className="font-magilio text-5xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white md:text-6xl lg:text-[72px]">
            {t('landing.features.title')}{' '}
            <span className="bg-gradient-to-r from-paymint-green via-emerald-400 to-paymint-green bg-clip-text text-transparent">
              {t('landing.features.titleHighlight')}
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl">
            {t('landing.features.subtitle')}
          </p>
        </motion.header>

        {/* Showcase video — Apple-style cinematic frame */}
        <motion.div
          ref={videoRef}
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mb-20 w-full max-w-6xl lg:mb-24"
        >
          {/* Halo */}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 scale-[0.95] rounded-[2.5rem] bg-gradient-to-tr from-paymint-green/30 via-transparent to-paymint-green/10 blur-3xl"
          />

          <div className="group relative aspect-video overflow-hidden rounded-[2rem] border border-gray-200/80 bg-gray-900 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.18)] dark:border-white/10 dark:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.5)]">
            {isVideoVisible ? (
              <iframe
                src="https://player.vimeo.com/video/1158972798?h=234e7f9175&autoplay=1&background=1&muted=1&loop=1"
                className="absolute inset-0 h-full w-full scale-[1.04] transition-transform duration-1000 group-hover:scale-100"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ pointerEvents: 'none' }}
                loading="lazy"
                title={t('landing.features.videoTitle')}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-paymint-green/20">
                    <Play className="h-10 w-10 text-paymint-green" fill="currentColor" />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                    {t('common.loadingVideo')}
                  </p>
                </div>
              </div>
            )}

            {/* Subtle vignette */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
            />

            {/* Corner watermark / live indicator */}
            <div className="pointer-events-none absolute left-6 top-6 z-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-paymint-green opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-paymint-green" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                {t('landing.features.liveDemo')}
              </span>
            </div>

            {/* Bottom caption */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-8 md:p-12">
              <h3 className="font-magilio text-3xl font-bold tracking-tight text-white md:text-5xl">
                {t('landing.features.seeInAction')}
              </h3>
              <p className="mt-2 max-w-xl text-base font-light text-white/75 md:text-lg">
                {t('landing.features.seamlessSync')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bento Feature Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
};

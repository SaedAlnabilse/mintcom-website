import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type PanInfo, type Variants } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Zap, Settings, Store, Play, Sparkles, ChevronLeft, ChevronRight, X } from 'lucide-react';

type Feature = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

const FeatureCard = ({
  feature,
  index,
  t,
  onOpen,
}: {
  feature: Feature;
  index: number;
  t: any;
  onOpen: (index: number) => void;
}) => {
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
        <p className="font-barlow text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium line-clamp-4">
          {feature.description}
        </p>

        <button
          type="button"
          onClick={() => onOpen(index)}
          className="mt-4 text-sm font-bold font-barlow text-mintcom-green hover:text-mintcom-green/80 self-start transition-colors focus:outline-none"
        >
          {t('landing.features.readMore', 'Read more')}
        </button>
      </div>
    </motion.div>
  );
};

// Slide variants for the inner content panel.
// `direction` is 1 when going to next, -1 when going to previous.
// We tilt slightly on the y-axis to give a card-flip feel without being gimmicky.
const slideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction * 80,
    opacity: 0,
    scale: 0.96,
    rotateY: direction * 8,
    filter: 'blur(8px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotateY: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: (direction: number) => ({
    x: direction * -80,
    opacity: 0,
    scale: 0.96,
    rotateY: direction * -8,
    filter: 'blur(8px)',
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 1, 1],
    },
  }),
};

const FeatureModal = ({
  features,
  activeIndex,
  direction,
  onClose,
  onPrev,
  onNext,
  onJumpTo,
  t,
  isRtl,
}: {
  features: Feature[];
  activeIndex: number;
  direction: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpTo: (i: number) => void;
  t: any;
  isRtl: boolean;
}) => {
  const feature = features[activeIndex];
  if (!feature) return null;

  const handleDragEnd = (_e: unknown, info: PanInfo) => {
    const threshold = 80;
    if (info.offset.x < -threshold) {
      if (isRtl) {
        onPrev();
      } else {
        onNext();
      }
    } else if (info.offset.x > threshold) {
      if (isRtl) {
        onNext();
      } else {
        onPrev();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal shell — stays mounted while paginating */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 24 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_-16px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#161616]"
        dir={isRtl ? 'rtl' : 'ltr'}
        style={{ perspective: 1200 }}
      >
        {/* ambient glow that pulses on each step */}
        <motion.div
          key={`glow-${activeIndex}`}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: [0, 0.55, 0], scale: [0.4, 1.4, 1.6] }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="pointer-events-none absolute -top-24 left-1/2 -z-0 h-64 w-64 -translate-x-1/2 rounded-full bg-mintcom-green/30 blur-3xl"
        />

        {/* sweep highlight that crosses the card on each step */}
        <motion.div
          key={`sweep-${activeIndex}`}
          initial={{ x: direction * -120 + '%', opacity: 0 }}
          animate={{ x: direction * 120 + '%', opacity: [0, 0.45, 0] }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-mintcom-green/15 to-transparent"
        />

        {/* close */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('common.close', 'Close')}
          className="absolute end-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        {/* counter pill */}
        <div className="absolute start-4 top-4 z-30 flex items-center gap-1 rounded-full bg-mintcom-green/10 px-3 py-1 text-xs font-bold text-mintcom-green">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.span
              key={`count-${activeIndex}`}
              custom={direction}
              initial={{ y: direction * 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: direction * -12, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="tabular-nums"
            >
              {activeIndex + 1}
            </motion.span>
          </AnimatePresence>
          <span className="opacity-50">/</span>
          <span className="tabular-nums opacity-70">{features.length}</span>
        </div>

        {/* sliding content area — drag enabled */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={handleDragEnd}
              className="relative z-10 cursor-grab p-8 pt-14 md:p-10 md:pt-16 active:cursor-grabbing"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* icon */}
              <motion.div
                initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ delay: 0.05, duration: 0.5, type: 'spring', stiffness: 220, damping: 18 }}
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-mintcom-green/10 dark:bg-white/5 text-mintcom-green"
              >
                <div className="scale-125">{feature.icon}</div>
              </motion.div>

              {/* title */}
              <motion.h3
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.12, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="font-barlow text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight leading-snug"
              >
                {feature.title}
              </motion.h3>

              {/* description */}
              <motion.p
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="mt-4 font-barlow text-base md:text-[17px] text-gray-600 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-line"
              >
                {feature.description}
              </motion.p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* footer / nav */}
        <div className="relative z-10 mx-8 flex items-center justify-between gap-4 border-t border-gray-100 dark:border-white/10 py-5 md:mx-10">
          <button
            type="button"
            onClick={onPrev}
            aria-label={t('common.previous', 'Previous')}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            <span className="hidden sm:inline">{t('common.previous', 'Previous')}</span>
          </button>

          {/* dots */}
          <div className="flex items-center gap-2">
            {features.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onJumpTo(i)}
                aria-label={`Go to ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex ? 'w-6 bg-mintcom-green' : 'w-2 bg-gray-300 hover:bg-gray-400 dark:bg-white/15 dark:hover:bg-white/25'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNext}
            aria-label={t('common.next', 'Next')}
            className="flex items-center gap-2 rounded-xl bg-mintcom-green px-4 py-2.5 text-sm font-bold text-black shadow-[0_4px_20px_-4px_rgba(125,198,162,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-4px_rgba(125,198,162,0.65)]"
          >
            <span className="hidden sm:inline">{t('common.next', 'Next')}</span>
            {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export const WhyChooseUs = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const videoRef = useRef<HTMLDivElement>(null);

  const features: Feature[] = [
    {
      icon: <Store className="w-6 h-6" />,
      title: t('landing.features.cards.complete.title'),
      description: t('landing.features.cards.complete.description'),
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: t('landing.features.cards.realUsers.title'),
      description: t('landing.features.cards.realUsers.description'),
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: t('landing.features.cards.security.title'),
      description: t('landing.features.cards.security.description'),
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: t('landing.features.cards.multiBranch.title'),
      description: t('landing.features.cards.multiBranch.description'),
    },
  ];

  const handleOpen = useCallback((index: number) => {
    setDirection(1);
    setActiveCard(index);
  }, []);
  const handleClose = useCallback(() => setActiveCard(null), []);
  const handlePrev = useCallback(() => {
    setDirection(-1);
    setActiveCard((i) => (i === null ? null : (i - 1 + features.length) % features.length));
  }, [features.length]);
  const handleNext = useCallback(() => {
    setDirection(1);
    setActiveCard((i) => (i === null ? null : (i + 1) % features.length));
  }, [features.length]);
  const handleJumpTo = useCallback(
    (target: number) => {
      setActiveCard((i) => {
        if (i === null) return target;
        setDirection(target > i ? 1 : -1);
        return target;
      });
    },
    []
  );

  // Keyboard navigation while modal is open
  useEffect(() => {
    if (activeCard === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      else if (e.key === 'ArrowRight') (isRtl ? handlePrev : handleNext)();
      else if (e.key === 'ArrowLeft') (isRtl ? handleNext : handlePrev)();
    };
    window.addEventListener('keydown', onKey);

    // lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // hide the floating chat widget while the popup is open
    window.dispatchEvent(new CustomEvent('mintcom-chat-widget-hide'));

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.dispatchEvent(new CustomEvent('mintcom-chat-widget-show'));
    };
  }, [activeCard, handleClose, handleNext, handlePrev, isRtl]);

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
    <section
      id="why-mintcom"
      className="py-16 lg:py-20 bg-gray-50 dark:bg-[#0f0f0f] overflow-hidden relative"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
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
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-mintcom-green/30"
              />
            </div>
            <span className="tracking-widest uppercase text-[10px] md:text-[11px] leading-none">
              {t('landing.features.badge')}
            </span>
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-magilio mb-6 leading-tight tracking-tight">
            <span className="text-gray-900 dark:text-white">{t('landing.features.title')}</span>{' '}
            <span className="text-mintcom-green">{t('landing.features.titleHighlight')}</span>
          </h2>
          <p className="mb-10 max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl mx-auto">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        {/* Cards & Video */}
        <div className="flex flex-col gap-16 lg:gap-24">
          {/* Pillar Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} t={t} onOpen={handleOpen} />
            ))}
          </div>

          {/* Video Section */}
          <motion.div
            ref={videoRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
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
                    <h4 className="font-bold font-barlow text-2xl xs:text-3xl md:text-5xl mb-2 tracking-tighter text-white">{t('landing.features.seeInAction')}</h4>
                    <p className="text-base md:text-lg text-white/70 font-medium">{t('landing.features.seamlessSync')}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Read more popup */}
      <AnimatePresence>
        {activeCard !== null && (
          <FeatureModal
            features={features}
            activeIndex={activeCard}
            direction={direction}
            onClose={handleClose}
            onPrev={handlePrev}
            onNext={handleNext}
            onJumpTo={handleJumpTo}
            t={t}
            isRtl={isRtl}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

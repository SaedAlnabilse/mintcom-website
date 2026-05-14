import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tablet,
  Printer,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Monitor,
} from 'lucide-react';
import { formatCurrencyCode } from '../utils/currency';
import { useScrollLock } from '../hooks/useScrollLock';

/* -----------------------------------------------------------
   Hardware — Apple Store-style product showcase
   - Two huge category cards with icon, glow, and CTA pill
   - Quick-peek list of recommended items inside each card
   - Modal with Apple-style product list (links + specs)
----------------------------------------------------------- */

export const Hardware = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
  const [showModal, setShowModal] = useState(false);
  const [showTopIndicator, setShowTopIndicator] = useState(false);
  const [showBottomIndicator, setShowBottomIndicator] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useScrollLock(showModal);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setShowTopIndicator(scrollTop > 20);
    setShowBottomIndicator(scrollTop + clientHeight < scrollHeight - 20);
  }, []);

  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(checkScroll, 300);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [showModal, checkScroll]);

  const handleScroll = () => checkScroll();

  const formatUsdPrice = (amount: number) =>
    formatCurrencyCode(amount, 'USD', t('common.locale'), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const hardwareItems = [
    {
      id: 'tablets',
      name: t('landing.hardware.tablets.name'),
      icon: Tablet,
      description: t('landing.hardware.tablets.description'),
      products: [
        {
          name: t('landing.hardware.products.samsungTab.name'),
          specs: t('landing.hardware.products.samsungTab.specs'),
          price: formatUsdPrice(180),
          link: 'https://www.amazon.com/s?k=samsung+galaxy+tab+a8',
        },
        {
          name: t('landing.hardware.products.ipad.name'),
          specs: t('landing.hardware.products.ipad.specs'),
          price: formatUsdPrice(350),
          link: 'https://www.amazon.com/s?k=ipad+10th+generation',
        },
        {
          name: t('landing.hardware.products.lenovo.name'),
          specs: t('landing.hardware.products.lenovo.specs'),
          price: formatUsdPrice(150),
          link: 'https://www.amazon.com/s?k=lenovo+tab+m10+plus',
        },
        {
          name: t('landing.hardware.products.ipadAir.name'),
          specs: t('landing.hardware.products.ipadAir.specs'),
          price: formatUsdPrice(599),
          link: 'https://www.amazon.com/s?k=ipad+air+m2',
        },
        {
          name: t('landing.hardware.products.ipadPro.name'),
          specs: t('landing.hardware.products.ipadPro.specs'),
          price: formatUsdPrice(999),
          link: 'https://www.amazon.com/s?k=ipad+pro+m4',
        },
        {
          name: t('landing.hardware.products.samsungTabS9FE.name'),
          specs: t('landing.hardware.products.samsungTabS9FE.specs'),
          price: formatUsdPrice(350),
          link: 'https://www.amazon.com/s?k=samsung+galaxy+tab+s9+fe',
        },
        {
          name: t('landing.hardware.products.surfaceGo.name'),
          specs: t('landing.hardware.products.surfaceGo.specs'),
          price: formatUsdPrice(550),
          link: 'https://www.amazon.com/s?k=microsoft+surface+go+4',
        },
      ],
      note: t('landing.hardware.tablets.note'),
    },
    {
      id: 'printers',
      name: t('landing.hardware.printers.name'),
      icon: Printer,
      description: t('landing.hardware.printers.description'),
      products: [
        {
          name: t('landing.hardware.products.munbyn.name'),
          specs: t('landing.hardware.products.munbyn.specs'),
          price: formatUsdPrice(100),
          link: 'https://www.amazon.com/s?k=munbyn+thermal+receipt+printer+80mm',
        },
        {
          name: t('landing.hardware.products.epson.name'),
          specs: t('landing.hardware.products.epson.specs'),
          price: formatUsdPrice(180),
          link: 'https://www.amazon.com/s?k=epson+tm-t20iii',
        },
        {
          name: t('landing.hardware.products.star.name'),
          specs: t('landing.hardware.products.star.specs'),
          price: formatUsdPrice(250),
          link: 'https://www.amazon.com/s?k=star+micronics+tsp143',
        },
        {
          name: t('landing.hardware.products.epsonM30.name'),
          specs: t('landing.hardware.products.epsonM30.specs'),
          price: formatUsdPrice(280),
          link: 'https://www.amazon.com/s?k=epson+tm-m30ii',
        },
        {
          name: t('landing.hardware.products.starMC.name'),
          specs: t('landing.hardware.products.starMC.specs'),
          price: formatUsdPrice(320),
          link: 'https://www.amazon.com/s?k=star+micronics+mc-print3',
        },
        {
          name: t('landing.hardware.products.starTSP654.name'),
          specs: t('landing.hardware.products.starTSP654.specs'),
          price: formatUsdPrice(240),
          link: 'https://www.amazon.com/s?k=star+micronics+tsp654ii',
        },
        {
          name: t('landing.hardware.products.bixolon.name'),
          specs: t('landing.hardware.products.bixolon.specs'),
          price: formatUsdPrice(220),
          link: 'https://www.amazon.com/s?k=bixolon+srp-350plusiii',
        },
        {
          name: t('landing.hardware.products.citizen.name'),
          specs: t('landing.hardware.products.citizen.specs'),
          price: formatUsdPrice(190),
          link: 'https://www.amazon.com/s?k=citizen+ct-e351',
        },
        {
          name: t('landing.hardware.products.starMC2.name'),
          specs: t('landing.hardware.products.starMC2.specs'),
          price: formatUsdPrice(260),
          link: 'https://www.amazon.com/s?k=star+micronics+mc-print2',
        },
      ],
      note: t('landing.hardware.printers.note'),
    },
  ];

  const [selectedHardware, setSelectedHardware] = useState(hardwareItems[0]);

  return (
    <>
      <section
        id="hardware"
        dir={isRtl ? 'rtl' : 'ltr'}
        className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white py-24 dark:from-[#050505] dark:via-[#0a0a0a] dark:to-[#050505] lg:py-32"
      >
        {/* Background ambient */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-[5%] h-[420px] w-[420px] rounded-full bg-paymint-green/8 blur-[120px]" />
          <div className="absolute -bottom-10 left-[5%] h-[420px] w-[420px] rounded-full bg-emerald-400/5 blur-[120px]" />
        </div>

        <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto mb-14 max-w-3xl text-center lg:mb-20"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-paymint-green/25 bg-white/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-paymint-green shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(124,195,159,0.5)] backdrop-blur-xl dark:bg-white/5">
              <Monitor size={12} />
              <span>{t('landing.hardware.terminals')}</span>
            </div>

            <h2 className="font-magilio text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-[72px]">
              <span className="text-gray-900 dark:text-white">
                {t('landing.hardware.title')}{' '}
              </span>
              <span className="bg-gradient-to-r from-paymint-green via-emerald-400 to-paymint-green bg-clip-text text-transparent">
                {t('landing.hardware.titleHighlight')}
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl">
              {t('landing.hardware.subtitle')}
            </p>
          </motion.header>

          {/* Hardware category cards */}
          <div className="mb-12 grid gap-6 md:grid-cols-2">
            {hardwareItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.7,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/90 p-8 shadow-[0_8px_20px_-8px_rgba(0,0,0,0.06)] backdrop-blur-xl transition-all duration-500 hover:border-paymint-green/40 hover:shadow-[0_12px_30px_-10px_rgba(124,195,159,0.15)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none lg:p-10"
              >
                {/* Decorative corner glow */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-paymint-green/15 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                />

                <div className="relative flex items-start gap-5">
                  {/* Big icon tile */}
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-paymint-green/15 to-paymint-green/5 ring-1 ring-paymint-green/25 transition-all duration-500 group-hover:from-paymint-green group-hover:to-emerald-400 group-hover:ring-paymint-green/60 group-hover:shadow-[0_10px_30px_-8px_rgba(124,195,159,0.6)]">
                    <item.icon
                      size={28}
                      className="text-paymint-green transition-colors duration-500 group-hover:text-black"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {item.name}
                    </h3>
                    <p className="mt-1 text-sm font-light text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Quick product peek */}
                <ul className="relative mt-6 space-y-2">
                  {item.products.slice(0, 3).map((product, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 p-3 transition-colors hover:border-paymint-green/20 hover:bg-paymint-green/5 dark:border-white/5 dark:bg-white/[0.03]"
                    >
                      <CheckCircle2
                        size={16}
                        className="flex-shrink-0 text-paymint-green"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {product.name}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                        {product.price}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => {
                    setSelectedHardware(item);
                    setShowModal(true);
                  }}
                  className="group/btn relative mt-6 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-900 transition-all hover:border-paymint-green hover:bg-paymint-green hover:text-black dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <span>{t('landing.hardware.viewAllOptions')}</span>
                  <ArrowRight
                    size={15}
                    className={`transition-transform ${
                      isRtl
                        ? 'rotate-180 group-hover/btn:-translate-x-1'
                        : 'group-hover/btn:translate-x-1'
                    }`}
                  />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Already-have-hardware tip card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl rounded-3xl border border-gray-200/70 bg-white/70 p-6 text-center backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03]"
          >
            <p className="text-base font-medium text-gray-600 dark:text-gray-300">
              <span className="font-bold text-paymint-green">
                {t('landing.hardware.alreadyHave')}
              </span>{' '}
              <span className="text-gray-500 dark:text-gray-400">
                {t('landing.hardware.alreadyHaveDesc')}
              </span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Hardware modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-paymint-green/10 via-transparent to-transparent p-6 dark:border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-paymint-green shadow-lg shadow-paymint-green/30">
                    <selectedHardware.icon size={22} className="text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {selectedHardware.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedHardware.description}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-xl p-2 transition-colors hover:bg-gray-100 dark:hover:bg-white/10"
                  aria-label="Close"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Scroll content */}
              <div className="relative min-h-0 flex-1">
                <AnimatePresence>
                  {showTopIndicator && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex h-12 items-start justify-center bg-gradient-to-b from-white to-transparent pt-2 dark:from-[#0e0e0e]"
                    >
                      <ChevronUp size={18} className="animate-bounce text-paymint-green" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="custom-scrollbar max-h-[60vh] overflow-y-auto overscroll-contain p-6"
                >
                  <div className="space-y-2">
                    {selectedHardware.products.map((product, idx) => (
                      <a
                        key={idx}
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-transparent bg-gray-50/70 p-4 transition-all hover:border-paymint-green/30 hover:bg-paymint-green/5 dark:bg-white/[0.03]"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-paymint-green/10 ring-1 ring-paymint-green/20 transition-all group-hover:bg-paymint-green group-hover:ring-paymint-green/50">
                            <CheckCircle2
                              size={18}
                              className="text-paymint-green transition-colors group-hover:text-black"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-900 transition-colors group-hover:text-paymint-green dark:text-white">
                              {product.name}
                            </p>
                            <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                              {product.specs}
                            </p>
                          </div>
                        </div>
                        <span className="hidden text-sm font-bold text-gray-700 dark:text-gray-300 sm:inline">
                          {product.price}
                        </span>
                      </a>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-center dark:border-blue-500/20 dark:bg-blue-500/10">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-bold">💡 {t('common.tip')}:</span>{' '}
                      {selectedHardware.note}
                    </p>
                  </div>
                </div>

                <AnimatePresence>
                  {showBottomIndicator && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 flex h-12 items-end justify-center bg-gradient-to-t from-white to-transparent pb-2 dark:from-[#0e0e0e]"
                    >
                      <ChevronDown
                        size={18}
                        className="animate-bounce text-paymint-green"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

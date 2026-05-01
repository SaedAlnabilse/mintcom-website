import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Tablet, Printer, X, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrencyCode } from '../utils/currency';
import { useScrollLock } from '../hooks/useScrollLock';

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

export const Hardware = () => {
  const { t } = useTranslation();
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
      // Small delay to allow modal animation to complete and DOM to be ready
      const timer = setTimeout(checkScroll, 300);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [showModal, checkScroll]);

  const handleScroll = () => {
    checkScroll();
  };

  const formatUsdPrice = (amount: number) => formatCurrencyCode(amount, 'USD', t('common.locale'), {
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
          link: 'https://www.amazon.com/s?k=samsung+galaxy+tab+a8'
        },
        {
          name: t('landing.hardware.products.ipad.name'),
          specs: t('landing.hardware.products.ipad.specs'),
          price: formatUsdPrice(350),
          link: 'https://www.amazon.com/s?k=ipad+10th+generation'
        },
        {
          name: t('landing.hardware.products.lenovo.name'),
          specs: t('landing.hardware.products.lenovo.specs'),
          price: formatUsdPrice(150),
          link: 'https://www.amazon.com/s?k=lenovo+tab+m10+plus'
        },
        {
          name: t('landing.hardware.products.ipadAir.name'),
          specs: t('landing.hardware.products.ipadAir.specs'),
          price: formatUsdPrice(599),
          link: 'https://www.amazon.com/s?k=ipad+air+m2'
        },
        {
          name: t('landing.hardware.products.ipadPro.name'),
          specs: t('landing.hardware.products.ipadPro.specs'),
          price: formatUsdPrice(999),
          link: 'https://www.amazon.com/s?k=ipad+pro+m4'
        },
        {
          name: t('landing.hardware.products.samsungTabS9FE.name'),
          specs: t('landing.hardware.products.samsungTabS9FE.specs'),
          price: formatUsdPrice(350),
          link: 'https://www.amazon.com/s?k=samsung+galaxy+tab+s9+fe'
        },
        {
          name: t('landing.hardware.products.surfaceGo.name'),
          specs: t('landing.hardware.products.surfaceGo.specs'),
          price: formatUsdPrice(550),
          link: 'https://www.amazon.com/s?k=microsoft+surface+go+4'
        }
      ],
      note: t('landing.hardware.tablets.note')
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
          link: 'https://www.amazon.com/s?k=munbyn+thermal+receipt+printer+80mm'
        },
        {
          name: t('landing.hardware.products.epson.name'),
          specs: t('landing.hardware.products.epson.specs'),
          price: formatUsdPrice(180),
          link: 'https://www.amazon.com/s?k=epson+tm-t20iii'
        },
        {
          name: t('landing.hardware.products.star.name'),
          specs: t('landing.hardware.products.star.specs'),
          price: formatUsdPrice(250),
          link: 'https://www.amazon.com/s?k=star+micronics+tsp143'
        },
        {
          name: t('landing.hardware.products.epsonM30.name'),
          specs: t('landing.hardware.products.epsonM30.specs'),
          price: formatUsdPrice(280),
          link: 'https://www.amazon.com/s?k=epson+tm-m30ii'
        },
        {
          name: t('landing.hardware.products.starMC.name'),
          specs: t('landing.hardware.products.starMC.specs'),
          price: formatUsdPrice(320),
          link: 'https://www.amazon.com/s?k=star+micronics+mc-print3'
        },
        {
          name: t('landing.hardware.products.starTSP654.name'),
          specs: t('landing.hardware.products.starTSP654.specs'),
          price: formatUsdPrice(240),
          link: 'https://www.amazon.com/s?k=star+micronics+tsp654ii'
        },
        {
          name: t('landing.hardware.products.bixolon.name'),
          specs: t('landing.hardware.products.bixolon.specs'),
          price: formatUsdPrice(220),
          link: 'https://www.amazon.com/s?k=bixolon+srp-350plusiii'
        },
        {
          name: t('landing.hardware.products.citizen.name'),
          specs: t('landing.hardware.products.citizen.specs'),
          price: formatUsdPrice(190),
          link: 'https://www.amazon.com/s?k=citizen+ct-e351'
        },
        {
          name: t('landing.hardware.products.starMC2.name'),
          specs: t('landing.hardware.products.starMC2.specs'),
          price: formatUsdPrice(260),
          link: 'https://www.amazon.com/s?k=star+micronics+mc-print2'
        }
      ],
      note: t('landing.hardware.printers.note')
    }
  ];

  const [selectedHardware, setSelectedHardware] = useState(hardwareItems[0]);


  return (
    <>
      <section id="hardware" className="py-16 lg:py-20 bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />

        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.2] rtl:leading-[1.3] tracking-tight">
              <SplitText text={t('landing.hardware.title') + ' ' + t('landing.hardware.titleHighlight')} />
            </h2>
            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto font-light">
              {t('landing.hardware.subtitle')}
            </p>
          </motion.div>

          {/* Hardware Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {hardwareItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-white/5 rounded-xl p-8 border border-gray-200 dark:border-white/10 hover:border-paymint-green/30 transition-all shadow-lg shadow-gray-200/50 dark:shadow-none"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-paymint-green/10 dark:bg-paymint-green/20 flex items-center justify-center">
                    <item.icon size={28} className="text-paymint-green" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{item.description}</p>
                  </div>
                </div>

                {/* Quick Product List */}
                <div className="space-y-3 mb-6">
                  {item.products.slice(0, 2).map((product, idx) => (
                    <div key={idx} className="flex items-center p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-paymint-green" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                   onClick={() => {
                    setSelectedHardware(item);
                    setShowModal(true);
                  }}
                  className="w-full py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-bold rounded-xl hover:bg-paymint-green hover:text-black transition-all"
                >
                  {t('landing.hardware.viewAllOptions')}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Tip */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-gray-500 dark:text-gray-400">
              💡 <span className="font-medium">{t('landing.hardware.alreadyHave')}</span> {t('landing.hardware.alreadyHaveDesc')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Hardware Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-100 dark:border-white/5 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-paymint-green flex items-center justify-center">
                    <selectedHardware.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedHardware.name}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">{selectedHardware.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              {/* Content Container */}
              <div className="relative flex-1 min-h-0">
                {/* Top Shadow/Indicator */}
                <AnimatePresence>
                  {showTopIndicator && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white dark:from-[#1a1a1a] to-transparent z-10 pointer-events-none flex items-start justify-center pt-2"
                    >
                      <ChevronUp size={20} className="text-paymint-green animate-bounce" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div
                  ref={scrollRef}
                  onScroll={handleScroll}
                  className="p-6 overflow-y-auto overscroll-contain max-h-[60vh] custom-scrollbar"
                >
                  {/* Products List */}
                  <div className="space-y-3 mb-6">
                    {selectedHardware.products.map((product, idx) => (
                      <a
                        key={idx}
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group border border-transparent hover:border-paymint-green/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-paymint-green/10 dark:bg-paymint-green/20 flex items-center justify-center group-hover:bg-paymint-green transition-colors">
                            <CheckCircle2 size={18} className="text-paymint-green group-hover:text-white transition-colors" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-paymint-green transition-colors">{product.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{product.specs}</p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>

                  {/* Note */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20">
                    <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                      <span className="font-bold">💡 {t('common.tip')}:</span> {selectedHardware.note}
                    </p>
                  </div>
                </div>

                {/* Bottom Shadow/Indicator */}
                <AnimatePresence>
                  {showBottomIndicator && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-[#1a1a1a] to-transparent z-10 pointer-events-none flex items-end justify-center pb-2"
                    >
                      <ChevronDown size={20} className="text-paymint-green animate-bounce" />
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


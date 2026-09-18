import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Tablet, Printer, CheckCircle2 } from 'lucide-react';
import { ModalCloseButton } from './ui';



export const Hardware = () => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

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
          price: (180).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=samsung+galaxy+tab+a8'
        },
        {
          name: t('landing.hardware.products.ipad.name'),
          specs: t('landing.hardware.products.ipad.specs'),
          price: (350).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=ipad+10th+generation'
        },
        {
          name: t('landing.hardware.products.lenovo.name'),
          specs: t('landing.hardware.products.lenovo.specs'),
          price: (150).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=lenovo+tab+m10+plus'
        },
        {
          name: t('landing.hardware.products.ipadAir.name'),
          specs: t('landing.hardware.products.ipadAir.specs'),
          price: (599).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=ipad+air+m2'
        },
        {
          name: t('landing.hardware.products.ipadPro.name'),
          specs: t('landing.hardware.products.ipadPro.specs'),
          price: (999).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=ipad+pro+m4'
        },
        {
          name: t('landing.hardware.products.samsungTabS9FE.name'),
          specs: t('landing.hardware.products.samsungTabS9FE.specs'),
          price: (350).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=samsung+galaxy+tab+s9+fe'
        },
        {
          name: t('landing.hardware.products.surfaceGo.name'),
          specs: t('landing.hardware.products.surfaceGo.specs'),
          price: (550).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
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
          price: (100).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=munbyn+thermal+receipt+printer+80mm'
        },
        {
          name: t('landing.hardware.products.epson.name'),
          specs: t('landing.hardware.products.epson.specs'),
          price: (180).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=epson+tm-t20iii'
        },
        {
          name: t('landing.hardware.products.star.name'),
          specs: t('landing.hardware.products.star.specs'),
          price: (250).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=star+micronics+tsp143'
        },
        {
          name: t('landing.hardware.products.epsonM30.name'),
          specs: t('landing.hardware.products.epsonM30.specs'),
          price: (280).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=epson+tm-m30ii'
        },
        {
          name: t('landing.hardware.products.starMC.name'),
          specs: t('landing.hardware.products.starMC.specs'),
          price: (320).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=star+micronics+mc-print3'
        },
        {
          name: t('landing.hardware.products.starTSP654.name'),
          specs: t('landing.hardware.products.starTSP654.specs'),
          price: (240).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=star+micronics+tsp654ii'
        },
        {
          name: t('landing.hardware.products.bixolon.name'),
          specs: t('landing.hardware.products.bixolon.specs'),
          price: (220).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=bixolon+srp-350plusiii'
        },
        {
          name: t('landing.hardware.products.citizen.name'),
          specs: t('landing.hardware.products.citizen.specs'),
          price: (190).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=citizen+ct-e351'
        },
        {
          name: t('landing.hardware.products.starMC2.name'),
          specs: t('landing.hardware.products.starMC2.specs'),
          price: (260).toLocaleString(t('common.locale'), { minimumFractionDigits: 0 }) + ' USD',
          link: 'https://www.amazon.com/s?k=star+micronics+mc-print2'
        }
      ],
      note: t('landing.hardware.printers.note')
    }
  ];

  const [selectedHardware, setSelectedHardware] = useState(hardwareItems[0]);


  return (
    <>
      <section id="hardware" className="bg-cream-100 dark:bg-zinc-950">
        <div className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="mb-5 text-start"
          >
            <p className="mb-1 text-[13px] font-semibold text-stone-500 dark:text-zinc-400">
              {t('landing.hardware.badge')}
            </p>
            <h2 className="font-magilio text-4xl font-bold tracking-tight sm:text-5xl">
              {t('landing.hardware.title')}{' '}
              <span className="text-mintcom-green">{t('landing.hardware.titleHighlight')}</span>
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">
              {t('landing.hardware.subtitle')}
            </p>
          </motion.div>

          {/* Hardware Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {hardwareItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="group flex items-start gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                  <item.icon size={19} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100">{item.name}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-stone-500 line-clamp-2 dark:text-zinc-400">{item.description}</span>
                  <button
                    onClick={() => {
                      setSelectedHardware(item);
                      setShowModal(true);
                    }}
                    className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-stone-500 transition-colors group-hover:text-stone-900 dark:text-zinc-400 dark:group-hover:text-zinc-100"
                  >
                    {t('landing.hardware.viewAllOptions')}
                  </button>
                </span>
              </motion.div>
            ))}
          </div>

          {/* Quiet footer line */}
          <p className="mt-10 border-t border-stone-200 pt-5 text-center text-[13px] text-stone-400 dark:border-zinc-800 dark:text-zinc-500">
            {t('landing.hardware.alreadyHave')} {t('landing.hardware.alreadyHaveDesc')}
          </p>
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
              className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-100 dark:border-white/5 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-gray-50 dark:bg-black/20 border-b border-gray-100 dark:border-white/5 p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-mintcom-green flex items-center justify-center">
                    <selectedHardware.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-barlow text-xl font-bold text-gray-900 dark:text-white">{selectedHardware.name}</h3>
                    <p className="font-barlow text-gray-500 dark:text-gray-400 text-sm">{selectedHardware.description}</p>
                  </div>
                </div>
                <ModalCloseButton onClose={() => setShowModal(false)} />
              </div>

              {/* Content */}
              <div className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(85vh - 100px)' }}>
                {/* Scrollable Products List */}
                <div className="relative flex-1 overflow-hidden">
                  <div className="p-6 pb-2 overflow-y-auto max-h-[50vh] scroll-smooth hardware-scroll">
                    <div className="space-y-3">
                      {selectedHardware.products.map((product, idx) => (
                        <a
                          key={idx}
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group border border-transparent hover:border-mintcom-green/30"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 dark:bg-mintcom-green/20 flex items-center justify-center group-hover:bg-mintcom-green transition-colors">
                              <CheckCircle2 size={18} className="text-mintcom-green group-hover:text-white transition-colors" />
                            </div>
                            <div>
                              <p className="font-barlow font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors">{product.name}</p>
                              <p className="font-barlow text-sm text-gray-500 dark:text-gray-400">{product.specs}</p>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                  {/* Scroll fade indicator */}
                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-[#1a1a1a] to-transparent" />
                </div>

                {/* Sticky Tip */}
                <div className="sticky bottom-0 p-4 mx-6 mb-4 mt-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 shadow-sm">
                  <p className="text-sm text-blue-700 dark:text-blue-400 text-center">
                    <span className="font-bold">💡 {t('common.tip')}:</span> {selectedHardware.note}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};


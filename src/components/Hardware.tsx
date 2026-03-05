import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Tablet, Printer, X, CheckCircle2, ExternalLink } from 'lucide-react';

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
          price: (180).toLocaleString(t('common.locale'), { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }),
          link: 'https://www.amazon.com/s?k=samsung+galaxy+tab+a8'
        },
        {
          name: t('landing.hardware.products.ipad.name'),
          specs: t('landing.hardware.products.ipad.specs'),
          price: (350).toLocaleString(t('common.locale'), { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }),
          link: 'https://www.amazon.com/s?k=ipad+10th+generation'
        },
        {
          name: t('landing.hardware.products.lenovo.name'),
          specs: t('landing.hardware.products.lenovo.specs'),
          price: (150).toLocaleString(t('common.locale'), { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }),
          link: 'https://www.amazon.com/s?k=lenovo+tab+m10+plus'
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
          price: (100).toLocaleString(t('common.locale'), { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }),
          link: 'https://www.amazon.com/s?k=munbyn+thermal+receipt+printer+80mm'
        },
        {
          name: t('landing.hardware.products.epson.name'),
          specs: t('landing.hardware.products.epson.specs'),
          price: (180).toLocaleString(t('common.locale'), { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }),
          link: 'https://www.amazon.com/s?k=epson+tm-t20iii'
        },
        {
          name: t('landing.hardware.products.star.name'),
          specs: t('landing.hardware.products.star.specs'),
          price: (250).toLocaleString(t('common.locale'), { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }),
          link: 'https://www.amazon.com/s?k=star+micronics+tsp143'
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
                className="bg-white dark:bg-white/5 rounded-3xl p-8 border border-gray-200 dark:border-white/10 hover:border-paymint-green/30 transition-all shadow-lg shadow-gray-200/50 dark:shadow-none"
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
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-black/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 size={16} className="text-paymint-green" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
                      </div>
                      <span className="text-sm font-bold text-paymint-green">{product.price}</span>
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
              className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-gray-100 dark:border-white/5 max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
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

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                  {hardwareItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedHardware(item)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${selectedHardware.id === item.id
                        ? 'bg-paymint-green text-black'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                    >
                      <item.icon size={16} />
                      {item.name}
                    </button>
                  ))}
                </div>

                {/* Products List */}
                <div className="space-y-3 mb-6">
                  {selectedHardware.products.map((product, idx) => (
                    <a
                      key={idx}
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group border border-transparent hover:border-paymint-green/30"
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
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-bold text-paymint-green">{product.price}</p>
                          <p className="text-xs text-gray-400">Amazon</p>
                        </div>
                        <ExternalLink size={16} className="text-gray-400 group-hover:text-paymint-green transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>

                {/* Note */}
                <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-200 dark:border-blue-500/20">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
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

import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Download, Smartphone, CheckCircle2, Apple, Tablet } from 'lucide-react';

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

export const DownloadApp = () => {
  const { t } = useTranslation();

  return (
    <section id="download" className="py-24 lg:py-32 bg-white dark:bg-[#0f0f0f] relative overflow-hidden" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Decor */}
      <div className="absolute top-1/2 right-[-10%] w-[600px] h-[600px] bg-paymint-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-8 md:px-16 lg:px-24 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">

          {/* Left Side: Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[12px] bg-paymint-green/5 dark:bg-paymint-green/10 text-paymint-green font-bold text-xs mb-8 border border-paymint-green/20 backdrop-blur-md shadow-[0_0_15px_rgba(124,195,159,0.05)] hover:border-paymint-green/40 transition-all duration-300"
            >
              <div className="relative flex items-center justify-center w-5 h-5 rounded-[6px] bg-paymint-green/20 text-paymint-green overflow-hidden">
                <Smartphone size={11} className="relative z-10" />
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-paymint-green/30"
                />
              </div>
              <span className="tracking-widest uppercase text-[10px] md:text-[11px] leading-none">
                {t('landing.download.badge')}
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.2] rtl:leading-[1.3] tracking-tight">
              <SplitText text={t('landing.download.title') + ' ' + t('landing.download.titleHighlight')} />
            </h2>

            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed font-light">
              {t('landing.download.description')}
            </p>

            <div className="flex flex-col gap-4 mb-10">
              {[
                t('landing.download.universal'),
                t('landing.download.offline'),
                t('landing.download.instantSync'),
                t('landing.download.platforms')
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={20} className="text-paymint-green flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={import.meta.env.VITE_ANDROID_DOWNLOAD_URL || '/downloads/paymint-android.apk'}
                download
                className="flex items-center justify-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 py-4 px-8 rounded-xl transition-all shadow-xl group"
              >
                <Download className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs font-medium opacity-80">{t('landing.download.downloadFor')}</div>
                  <div className="text-lg font-bold leading-none">{t('landing.download.android')}</div>
                </div>
              </a>

              <div
                className="flex items-center justify-center gap-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-500 py-4 px-8 rounded-xl cursor-not-allowed"
              >
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs font-medium opacity-80">{t('landing.download.ios')}</div>
                  <div className="text-lg font-bold leading-none">Coming Soon</div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 italic">
              {t('landing.download.requirements')}
            </p>
          </motion.div>

          {/* Right Side: Visuals */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full lg:w-1/2 relative h-[600px] flex items-center justify-center"
          >
            {/* iPad Dashboard Mockup */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-0 top-[10%] w-[85%] overflow-hidden z-10 hidden md:block"
            >
              <img src="/ipad-dashboard-new.png" alt="Dashboard" className="w-full h-auto" />
            </motion.div>

            {/* iPad Sales Mockup */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute left-0 bottom-[10%] w-[75%] overflow-hidden z-20 hidden md:block drop-shadow-[0_30px_60px_rgba(0,0,0,0.3)]"
            >
              <img src="/ipad-sales-new.png" alt="Sales" className="w-full h-auto" />
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, 15, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-20 left-0 bg-white dark:bg-[#252525] p-4 rounded-2xl shadow-xl z-30 flex items-center gap-3 border border-gray-100 dark:border-white/5"
            >
              <div className="bg-paymint-green/20 p-2 rounded-lg text-paymint-green">
                <Tablet size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('landing.download.order')} #1024</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('landing.download.completed')}</p>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};



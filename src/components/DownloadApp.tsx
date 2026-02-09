import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Download, Smartphone, CheckCircle2, Apple, Tablet } from 'lucide-react';

export const DownloadApp = () => {
  const { t } = useTranslation();

  return (
    <section id="download" className="py-24 lg:py-32 bg-white dark:bg-[#0f0f0f] relative overflow-hidden">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paymint-green/10 text-paymint-green font-medium text-sm mb-6 border border-paymint-green/20">
              <Smartphone size={16} />
              <span>{t('download.badge')}</span>
            </div>

            <h2 className="text-4xl lg:text-5xl font-bold font-sans text-gray-900 dark:text-white mb-6 tracking-tight leading-tight">
              {t('download.title')} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-paymint-green to-emerald-400">{t('download.titleHighlight')}</span>
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              {t('download.description')}
            </p>

            <div className="flex flex-col gap-4 mb-10">
              {[
                t('download.universal'),
                t('download.offline'),
                t('download.instantSync'),
                t('download.platforms')
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 size={20} className="text-paymint-green flex-shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#" // TODO: Replace with your hosted APK URL (e.g., from R2 or S3)
                onClick={() => alert("Please update the Apk link in src/components/DownloadApp.tsx")}
                className="flex items-center justify-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 py-4 px-8 rounded-xl transition-all shadow-xl group"
              >
                <Download className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs font-medium opacity-80">{t('download.downloadFor')}</div>
                  <div className="text-lg font-bold leading-none">{t('download.android')}</div>
                </div>
              </a>

              <div className="flex items-center justify-center gap-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-400 dark:text-gray-500 py-4 px-8 rounded-xl cursor-not-allowed opacity-80">
                <Apple className="w-6 h-6" />
                <div className="text-left">
                  <div className="text-xs font-medium opacity-80">{t('download.comingSoon')}</div>
                  <div className="text-lg font-bold leading-none">{t('download.appStore')}</div>
                </div>
              </div>
            </div>

            <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 italic">
              {t('download.requirements')}
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
            {/* Tablet Mockup */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-[80%] aspect-[4/3] bg-gray-900 rounded-[2rem] border-[12px] border-gray-800 shadow-2xl overflow-hidden z-10 hidden md:block"
            >
              {/* Screen Content */}
              <div className="w-full h-full bg-[#1a1a1a] p-6 relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-gray-800 rounded-b-xl" />

                {/* Mock UI: Pos Grid */}
                <div className="grid grid-cols-3 gap-4 h-full mt-4">
                  <div className="col-span-2 grid grid-cols-3 gap-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                      <div key={i} className="bg-gray-800/50 rounded-xl animate-pulse" />
                    ))}
                  </div>
                  <div className="bg-gray-800/30 rounded-xl p-4 flex flex-col">
                    <div className="h-4 w-20 bg-gray-700 rounded mb-4" />
                    <div className="space-y-2 flex-1">
                      <div className="h-8 w-full bg-gray-700/50 rounded" />
                      <div className="h-8 w-full bg-gray-700/50 rounded" />
                    </div>
                    <div className="h-12 w-full bg-paymint-green rounded-lg mt-auto" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Phone Mockup */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute left-4 md:left-10 bottom-0 md:bottom-10 w-[280px] h-[550px] bg-black rounded-[3rem] border-[8px] border-gray-800 shadow-2xl overflow-hidden z-20"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-30" />

              {/* Mock UI: Mobile Dashboard */}
              <div className="w-full h-full bg-[#151515] p-6 pt-12 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="w-8 h-8 bg-gray-800 rounded-full" />
                  <div className="w-8 h-8 bg-gray-800 rounded-full" />
                </div>

                <div className="bg-gradient-to-br from-paymint-green/20 to-transparent p-6 rounded-2xl border border-paymint-green/10">
                  <div className="text-gray-400 text-xs mb-1">{t('download.totalSales')}</div>
                  <div className="text-white text-2xl font-bold">$1,240.50</div>
                </div>

                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl">
                      <div className="w-10 h-10 bg-gray-800 rounded-lg" />
                      <div className="flex-1">
                        <div className="w-20 h-2 bg-gray-700 rounded mb-1" />
                        <div className="w-12 h-2 bg-gray-800 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('download.order')} #1024</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{t('download.completed')}</p>
              </div>
            </motion.div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};




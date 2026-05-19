import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Laptop, BarChart2, ShoppingCart, Users, TrendingUp, Bell, User, Package } from 'lucide-react';
import AppStoreBadge from '../assets/app-store-badge.svg';
import GooglePlayBadge from '../assets/google-play-badge.svg';

const SplitText = ({ text, className = "" }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => {
        const isMintcom = word.toLowerCase().includes('mintcom');
        return (
          <span
            key={i}
            className={isMintcom ? 'text-mintcom-green' : (i % 2 === 0 ? 'text-gray-900 dark:text-white' : 'text-mintcom-green')}
          >
            {word}{' '}
          </span>
        );
      })}
    </span>
  );
};

export const AdminControl = () => {
  const { t } = useTranslation();

  return (
    <section id="admin" className="py-16 lg:py-20 bg-white dark:bg-[#0f0f0f] overflow-x-clip relative" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Decor */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 md:px-10 lg:px-16 max-w-[1280px]">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left Side: Animated Mobile App Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative flex justify-center items-start pt-8 sm:pt-4 lg:pt-0 lg:items-center h-[420px] sm:h-[520px] lg:h-[600px] lg:justify-start"
          >
            {/* iPhone Frame Mockup (Left/Back) */}
            <div className="absolute top-4 sm:top-0 left-1/2 -translate-x-[75%] sm:-translate-x-[70%] lg:left-[2%] lg:translate-x-0 w-[220px] h-[480px] sm:w-[280px] sm:h-[600px] lg:w-[300px] lg:h-[640px] bg-[#0a0a0a] rounded-[28px] border-[7px] border-gray-800 shadow-2xl overflow-hidden ring-1 ring-white/10 z-10 transform -rotate-6 opacity-80 scale-[0.68] sm:scale-[0.78] origin-top">
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 rounded-b-xl z-30" />

              {/* App UI Container */}
              <div className="w-full h-full pt-10 pb-4 px-3 flex flex-col gap-3 relative z-10 bg-gradient-to-b from-gray-900 to-[#0a0a0a]">

                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-[9px] font-medium mb-0.5">Good morning,</p>
                    <p className="text-white font-bold text-xs">Business Owner</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-mintcom-green/10 border border-mintcom-green/20 flex items-center justify-center">
                    <User size={12} className="text-mintcom-green" />
                  </div>
                </div>

                {/* Primary Stat Card */}
                <div className="bg-gradient-to-br from-mintcom-green/20 to-mintcom-green/5 border border-mintcom-green/20 rounded-xl p-3 shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-mintcom-green/20 flex items-center justify-center">
                        <BarChart2 size={10} className="text-mintcom-green" />
                      </div>
                      <span className="text-white/90 text-[10px] font-semibold">{t('landing.admin.dailyRevenue')}</span>
                    </div>
                  </div>
                  <div className="text-white font-black text-xl tracking-tight relative z-10">
                    {(2450).toLocaleString(t('common.locale'), { style: 'currency', currency: 'JOD', minimumFractionDigits: 0 })}
                  </div>
                </div>

                {/* Secondary Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShoppingCart size={10} className="text-blue-400" />
                      <span className="text-gray-400 text-[8px] font-medium uppercase tracking-wider">Orders</span>
                    </div>
                    <div className="text-white font-bold text-sm">142</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2.5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Users size={10} className="text-amber-400" />
                      <span className="text-gray-400 text-[8px] font-medium uppercase tracking-wider">Staff</span>
                    </div>
                    <div className="text-white font-bold text-sm">8 / 12</div>
                  </div>
                </div>

                {/* Animated Chart Mockup */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex-1 flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-center mb-2 relative z-10">
                    <span className="text-gray-400 text-[8px] font-medium uppercase tracking-wider">Sales Activity</span>
                  </div>
                  <div className="flex-1 flex items-end justify-between gap-1 pb-1 relative z-10">
                    {[35, 45, 25, 60, 40, 75, 50, 85, 65, 95].map((h, i) => (
                      <div key={i} style={{ height: `${h}%` }} className="w-full bg-gradient-to-t from-mintcom-green/50 to-mintcom-green rounded-t-sm" />
                    ))}
                  </div>
                </div>

              </div>
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 bg-mintcom-green/20 rounded-full blur-[40px] pointer-events-none z-0" />
            </div>

            {/* Android Frame Mockup (Right/Front) */}
            <div className="absolute top-4 sm:top-0 left-1/2 -translate-x-[35%] sm:-translate-x-[30%] lg:left-[32%] lg:translate-x-0 w-[240px] h-[500px] sm:w-[300px] sm:h-[620px] lg:w-[330px] lg:h-[680px] bg-[#0a0a0a] rounded-[30px] border-[7px] border-gray-800 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10 z-20 transform rotate-3 scale-[0.68] sm:scale-[0.78] origin-top">
              {/* Android Hole Punch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-black border border-gray-800 rounded-full z-30 shadow-inner" />

              {/* App UI Container */}
              <div className="w-full h-full pt-10 pb-5 px-4 flex flex-col gap-3.5 relative z-10 bg-gradient-to-b from-[#0a0a0a] to-gray-900">

                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-[10px] font-medium mb-0.5">Welcome back,</p>
                    <p className="text-white font-bold text-xs">Admin Dashboard</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-mintcom-green/10 border border-mintcom-green/20 flex items-center justify-center">
                    <User size={14} className="text-mintcom-green" />
                  </div>
                </div>

                {/* Primary Stat Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="bg-gradient-to-br from-mintcom-green/20 to-mintcom-green/5 border border-mintcom-green/20 rounded-xl p-4 shadow-lg shadow-mintcom-green/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-mintcom-green/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-mintcom-green/20 flex items-center justify-center">
                        <BarChart2 size={12} className="text-mintcom-green" />
                      </div>
                      <span className="text-white/90 text-[11px] font-semibold">{t('landing.admin.dailyRevenue')}</span>
                    </div>
                    <span className="text-mintcom-green text-[9px] font-bold bg-mintcom-green/10 border border-mintcom-green/20 px-2 py-0.5 rounded-full">+14.2%</span>
                  </div>
                  <div className="text-white font-black text-2xl tracking-tight relative z-10">
                    {(2450).toLocaleString(t('common.locale'), { style: 'currency', currency: 'JOD', minimumFractionDigits: 0 })}
                  </div>
                </motion.div>

                {/* Recent Alerts List (Takes up remaining space) */}
                <div className="flex flex-col gap-2.5 mt-2 flex-1">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Bell size={12} className="text-red-400" />
                    </div>
                    <div>
                      <div className="text-white/90 text-[10px] font-semibold mb-0.5">{t('landing.admin.stockAlerts')}</div>
                      <div className="text-gray-400 text-[9px]">Espresso Beans <span className="text-red-400 ml-1 font-medium">-3 kg remaining</span></div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={12} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white/90 text-[10px] font-semibold mb-0.5">{t('landing.admin.shiftAlerts')}</div>
                      <div className="text-gray-400 text-[9px]">Cashier Sara <span className="text-blue-400 ml-1 font-medium">clocked out 4:00 PM</span></div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-mintcom-green/10 border border-mintcom-green/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={12} className="text-mintcom-green" />
                    </div>
                    <div>
                      <div className="text-white/90 text-[10px] font-semibold mb-0.5">Order Completed</div>
                      <div className="text-gray-400 text-[9px]">Order #1042 <span className="text-mintcom-green ml-1 font-medium">JOD 24.00</span></div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                      <Users size={12} className="text-amber-400" />
                    </div>
                    <div>
                      <div className="text-white/90 text-[10px] font-semibold mb-0.5">Shift Started</div>
                      <div className="text-gray-400 text-[9px]">Ahmad clocked in <span className="text-amber-400 ml-1 font-medium">9:00 AM</span></div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <BarChart2 size={12} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white/90 text-[10px] font-semibold mb-0.5">{t('landing.admin.liveReports')}</div>
                      <div className="text-gray-400 text-[9px]">Today's revenue <span className="text-purple-400 ml-1 font-medium">JOD 2,450</span></div>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <Package size={12} className="text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-white/90 text-[10px] font-semibold mb-0.5">Stock Restocked</div>
                      <div className="text-gray-400 text-[9px]">Whole Milk <span className="text-cyan-400 ml-1 font-medium">+20 L added</span></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-mintcom-green/20 rounded-full blur-[60px] pointer-events-none z-0" />
            </div>

            {/* Decorative Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] lg:w-[480px] lg:h-[480px] border border-mintcom-green/20 rounded-full -z-10 animate-[spin_20s_linear_infinite]" />
          </motion.div>

          {/* Right Side: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
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
              className="group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[12px] bg-mintcom-green/5 dark:bg-mintcom-green/10 text-mintcom-green font-bold text-xs mb-8 border border-mintcom-green/20 backdrop-blur-md shadow-[0_0_15px_rgba(124,195,159,0.05)] hover:border-mintcom-green/40 transition-all duration-300"
            >
              <div className="relative flex items-center justify-center w-5 h-5 rounded-[6px] bg-mintcom-green/20 text-mintcom-green overflow-hidden">
                <Laptop size={11} className="relative z-10" />
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-mintcom-green/30"
                />
              </div>
              <span className="tracking-widest uppercase text-[10px] md:text-[11px] leading-none">
                {t('landing.admin.badge')}
              </span>
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-magilio mb-6 leading-tight tracking-tight">
              <span className="block leading-[1.1] rtl:leading-[1.2]"><SplitText text={t('landing.admin.title1')} /></span>
              <span className="block leading-[1.1] rtl:leading-[1.2]"><SplitText text={t('landing.admin.title2')} /></span>
              <span className="block leading-[1.1] rtl:leading-[1.2]">
                {(() => {
                  const words = t('landing.admin.title3').split(' ');
                  return words.map((word, i) => (
                    <span
                      key={i}
                      className={i === 0 ? 'text-gray-900 dark:text-white' : 'text-mintcom-green'}
                    >
                      {word}{i < words.length - 1 ? ' ' : ''}
                    </span>
                  ));
                })()}
              </span>
            </h2>


            <p className="mb-10 max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl">
              {t('landing.admin.description')}
            </p>

            <ul className="space-y-4 font-medium">
              {[
                { label: t('landing.admin.shiftAlerts'), icon: Bell },
                { label: t('landing.admin.stockAlerts'), icon: Package },
                { label: t('landing.admin.liveReports'), icon: BarChart2 }
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 text-gray-700 dark:text-gray-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 border border-mintcom-green/20 flex items-center justify-center transition-all duration-300 group-hover:bg-mintcom-green/20 group-hover:scale-110 flex-shrink-0">
                    <item.icon size={18} className="text-mintcom-green" />
                  </div>
                  <span className="text-lg tracking-tight">{item.label}</span>
                </li>
              ))}
            </ul>

            {/* App Store / Play Store Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 sm:mt-10 flex flex-col items-center sm:items-start gap-3 w-fit mx-auto sm:mx-0"
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {t('landing.admin.installBackofficeApp')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://apps.apple.com/app/Mintcom-owner/id0000000001"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('landing.admin.downloadOnAppStore')}
                  className="block transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/60 rounded-[11px]"
                >
                  <img
                    src={AppStoreBadge}
                    alt={t('landing.admin.downloadOnAppStore')}
                    className="block h-[52px] w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.Mintcom.owner"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('landing.admin.getItOnGooglePlay')}
                  className="block transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/60 rounded-[11px]"
                >
                  <img
                    src={GooglePlayBadge}
                    alt={t('landing.admin.getItOnGooglePlay')}
                    className="block h-[52px] w-auto object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};


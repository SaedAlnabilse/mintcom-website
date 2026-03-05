import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Smartphone, Laptop, BarChart2, ShoppingCart, Users, TrendingUp, Bell, User } from 'lucide-react';
import WhiteLogo from '../assets/white-green-full-logo.svg';
import GreenLogo from '../assets/green-full-logo.svg';

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

export const AdminControl = () => {
  const { t } = useTranslation();

  return (
    <section id="admin" className="py-16 lg:py-20 bg-white dark:bg-[#0f0f0f] overflow-hidden relative" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background Decor */}
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left Side: Animated Mobile App Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2 relative flex justify-center items-center h-[500px] lg:justify-start"
          >
            {/* iPhone Frame Mockup (Left/Back) */}
            <div className="absolute left-[10%] lg:left-[5%] w-[220px] h-[460px] bg-[#0a0a0a] rounded-[2.5rem] border-[6px] border-gray-800 shadow-2xl overflow-hidden ring-1 ring-white/10 group z-10 transform -rotate-6 scale-95 opacity-80 hover:rotate-0 hover:scale-100 hover:z-30 hover:opacity-100 transition-all duration-500">
              {/* iPhone Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 rounded-b-2xl z-30" />

              {/* App UI Container */}
              <div className="w-full h-full pt-10 pb-4 px-3 flex flex-col gap-3 relative z-10 bg-gradient-to-b from-gray-900 to-[#0a0a0a]">

                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-gray-400 text-[9px] font-medium mb-0.5">Good morning,</p>
                    <p className="text-white font-bold text-xs">Business Owner</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-paymint-green/10 border border-paymint-green/20 flex items-center justify-center">
                    <User size={12} className="text-paymint-green" />
                  </div>
                </div>

                {/* Primary Stat Card */}
                <div className="bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 rounded-xl p-3 shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-paymint-green/20 flex items-center justify-center">
                        <BarChart2 size={10} className="text-paymint-green" />
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
                      <div key={i} style={{ height: `${h}%` }} className="w-full bg-gradient-to-t from-paymint-green/50 to-paymint-green rounded-t-sm" />
                    ))}
                  </div>
                </div>

              </div>
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 bg-paymint-green/20 rounded-full blur-[40px] pointer-events-none z-0" />
            </div>

            {/* Android Frame Mockup (Right/Front) */}
            <div className="absolute left-[35%] lg:left-[45%] w-[240px] h-[480px] bg-[#0a0a0a] rounded-[2rem] border-[6px] border-gray-800 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/10 group z-20 transform rotate-3 hover:-translate-y-2 transition-all duration-500">
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
                  <div className="w-8 h-8 rounded-full bg-paymint-green/10 border border-paymint-green/20 flex items-center justify-center">
                    <User size={14} className="text-paymint-green" />
                  </div>
                </div>

                {/* Primary Stat Card */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="bg-gradient-to-br from-paymint-green/20 to-paymint-green/5 border border-paymint-green/20 rounded-2xl p-4 shadow-lg shadow-paymint-green/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-paymint-green/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-paymint-green/20 flex items-center justify-center">
                        <BarChart2 size={12} className="text-paymint-green" />
                      </div>
                      <span className="text-white/90 text-[11px] font-semibold">{t('landing.admin.dailyRevenue')}</span>
                    </div>
                    <span className="text-paymint-green text-[9px] font-bold bg-paymint-green/10 border border-paymint-green/20 px-2 py-0.5 rounded-full">+14.2%</span>
                  </div>
                  <div className="text-white font-black text-2xl tracking-tight relative z-10">
                    {(2450).toLocaleString(t('common.locale'), { style: 'currency', currency: 'JOD', minimumFractionDigits: 0 })}
                  </div>
                </motion.div>

                {/* Recent Alerts List (Takes up remaining space) */}
                <div className="flex flex-col gap-2.5 mt-2 flex-1">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <Bell size={12} className="text-red-400" />
                    </div>
                    <div>
                      <div className="text-white/90 text-[10px] font-semibold mb-0.5">{t('landing.admin.stockAlerts')}</div>
                      <div className="text-gray-400 text-[9px]">Coffee Beans <span className="text-red-400 ml-1 font-medium">-5 kg</span></div>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp size={12} className="text-blue-400" />
                    </div>
                    <div>
                      <div className="text-white/90 text-[10px] font-semibold mb-0.5">{t('landing.admin.shiftAlerts')}</div>
                      <div className="text-gray-400 text-[9px]">Sarah left at 4:00 PM</div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-48 h-48 bg-paymint-green/20 rounded-full blur-[60px] pointer-events-none z-0" />
            </div>

            {/* Decorative Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-paymint-green/20 rounded-full -z-10 animate-[spin_20s_linear_infinite]" />
          </motion.div>

          {/* Right Side: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2"
          >
            <div className="flex items-center gap-3 mb-6">
              <span className="p-2 bg-paymint-green/10 rounded-lg">
                <Laptop size={20} className="text-paymint-green" />
              </span>
              <span className="text-paymint-green font-bold tracking-wide text-sm">{t('landing.admin.badge')}</span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.2] rtl:leading-[1.3] tracking-tight">
              <SplitText text={t('landing.admin.title1')} /> <br />
              <SplitText text={t('landing.admin.title2')} /> <br />
              <SplitText text={t('landing.admin.title3')} />
            </h2>

            {/* Logo Lockup */}
            <div className="flex items-center gap-6 mb-8 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 w-fit">
              <img src={WhiteLogo} alt={t('common.logoAlt')} width={128} height={32} className="h-8 w-auto object-contain hidden dark:block" loading="lazy" decoding="async" />
              <img src={GreenLogo} alt={t('common.logoAlt')} width={128} height={32} className="h-8 w-auto object-contain block dark:hidden" loading="lazy" decoding="async" />
              <div className="h-8 w-px bg-gray-300 dark:bg-white/20"></div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                <Smartphone size={16} />
                <span>{t('landing.admin.adminApp')}</span>
              </div>
            </div>

            <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              {t('landing.admin.description')}
            </p>

            <ul className="space-y-4">
              {[
                t('landing.admin.shiftAlerts'),
                t('landing.admin.stockAlerts'),
                t('landing.admin.liveReports')
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + (i * 0.1) }}
                  className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
                >
                  <div className="w-6 h-6 rounded-full bg-paymint-green/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-paymint-green" />
                  </div>
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

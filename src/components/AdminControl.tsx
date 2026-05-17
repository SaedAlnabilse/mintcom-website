import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Smartphone,
  Laptop,
  BarChart2,
  ShoppingCart,
  Users,
  TrendingUp,
  Bell,
  User,
  Check,
  Sparkles,
  Activity,
} from 'lucide-react';
import WhiteLogo from '../assets/white-green-full-logo.svg';
import GreenLogo from '../assets/green-full-logo.svg';
import { formatCurrencyCode } from '../utils/currency';

/* -----------------------------------------------------------
   AdminControl — Apple "device showcase"
   - Two device frames floating in 3D with depth
   - Live notification cards that slide in alongside the devices
   - Glass logo lockup + animated checklist
----------------------------------------------------------- */

const FloatingNotification = ({
  icon: Icon,
  iconBg,
  title,
  body,
  delay,
  position,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconBg: string;
  title: string;
  body: string;
  delay: number;
  position: string;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20, scale: 0.9 }}
    whileInView={{ opacity: 1, x: 0, scale: 1 }}
    viewport={{ once: true, margin: '-100px' }}
    transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className={`absolute z-30 hidden md:flex ${position}`}
  >
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, ease: 'easeInOut' }}
      className="flex w-[260px] items-start gap-3 rounded-2xl border border-white/60 bg-white/85 p-3.5 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.06] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]"
    >
      <span
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}
      >
        <Icon size={16} className="text-white" />
      </span>
      <div className="min-w-0 flex-1 leading-tight">
        <div className="text-[12px] font-bold text-gray-900 dark:text-white">
          {title}
        </div>
        <div className="mt-0.5 truncate text-[11px] font-medium text-gray-500 dark:text-gray-400">
          {body}
        </div>
      </div>
      <span className="text-[10px] font-bold text-mintcom-green">now</span>
    </motion.div>
  </motion.div>
);

export const AdminControl = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';

  return (
    <section
      id="admin"
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative overflow-hidden bg-gradient-to-b from-white via-gray-50 to-white py-24 dark:from-[#050505] dark:via-[#0a0a0a] dark:to-[#050505] lg:py-32"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 left-[5%] h-[420px] w-[420px] rounded-full bg-mintcom-green/8 blur-[120px]" />
        <div className="absolute -bottom-20 right-[10%] h-[420px] w-[420px] rounded-full bg-emerald-400/8 blur-[120px]" />
      </div>

      <div className="container relative z-10 mx-auto max-w-[1280px] px-6 md:px-10">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-12">
          {/* =================== Phone stage =================== */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-2 flex h-[540px] items-center justify-center lg:order-1 lg:col-span-6 lg:h-[620px]"
            style={{ perspective: 1400 }}
          >
            {/* Halo */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -z-10 h-[80%] w-[80%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-mintcom-green/30 via-transparent to-mintcom-green/10 blur-3xl"
            />

            {/* Decorative orbit ring */}
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-mintcom-green/15"
            />
            <motion.div
              aria-hidden
              animate={{ rotate: 360 }}
              transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
              className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-mintcom-green/10"
            />

            {/* iPhone Frame (Back) */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.8 }}
              whileHover={{ rotate: 0, scale: 1.02, zIndex: 30 }}
              className="absolute left-[15%] top-[5%] z-10 h-[440px] w-[210px] -rotate-[8deg] overflow-hidden rounded-[2.2rem] border-[5px] border-gray-800 bg-[#0a0a0a] shadow-[0_15px_30px_-10px_rgba(0,0,0,0.4)] ring-1 ring-white/10 transition-transform duration-500 sm:left-[18%] lg:left-[12%]"
              style={{ transform: 'translateZ(20px) rotate(-8deg)' }}
            >
              <div className="absolute left-1/2 top-0 z-30 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-gray-800" />
              <div className="relative z-10 flex h-full w-full flex-col gap-2.5 bg-gradient-to-b from-gray-900 to-[#0a0a0a] px-3 pb-4 pt-9">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-0.5 text-[8px] font-medium text-gray-400">Good morning,</p>
                    <p className="text-[11px] font-bold text-white">Owner</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-mintcom-green/20 bg-mintcom-green/10">
                    <User size={11} className="text-mintcom-green" />
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-mintcom-green/20 bg-gradient-to-br from-mintcom-green/20 to-mintcom-green/5 p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <BarChart2 size={9} className="text-mintcom-green" />
                    <span className="text-[9px] font-semibold text-white/90">
                      {t('landing.admin.dailyRevenue')}
                    </span>
                  </div>
                  <div className="text-lg font-black tracking-tight text-white">
                    {formatCurrencyCode(2450, 'JOD', t('common.locale'), {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <ShoppingCart size={9} className="mb-1 text-blue-400" />
                    <div className="text-[8px] font-medium uppercase tracking-wider text-gray-400">
                      Orders
                    </div>
                    <div className="text-sm font-bold text-white">142</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                    <Users size={9} className="mb-1 text-amber-400" />
                    <div className="text-[8px] font-medium uppercase tracking-wider text-gray-400">
                      Staff
                    </div>
                    <div className="text-sm font-bold text-white">8/12</div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="mb-2 text-[8px] font-medium uppercase tracking-wider text-gray-400">
                    Sales activity
                  </span>
                  <div className="flex flex-1 items-end justify-between gap-1">
                    {[35, 45, 25, 60, 40, 75, 50, 85, 65, 95].map((h, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.05, duration: 0.6 }}
                        className="w-full rounded-t-sm bg-gradient-to-t from-mintcom-green/40 to-mintcom-green"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Android Frame (Front) */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25, duration: 0.8 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="absolute right-[10%] top-[8%] z-20 h-[460px] w-[230px] rotate-[5deg] overflow-hidden rounded-[2.4rem] border-[5px] border-gray-800 bg-[#0a0a0a] shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-transform duration-500 sm:right-[18%] lg:right-[12%]"
              style={{ transform: 'translateZ(60px) rotate(5deg)' }}
            >
              <div className="absolute left-1/2 top-2 z-30 h-3 w-3 -translate-x-1/2 rounded-full border border-gray-800 bg-black" />
              <div className="relative z-10 flex h-full w-full flex-col gap-3 bg-gradient-to-b from-[#0a0a0a] to-gray-900 px-4 pb-5 pt-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="mb-0.5 text-[10px] font-medium text-gray-400">Welcome back,</p>
                    <p className="text-xs font-bold text-white">Admin Dashboard</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-mintcom-green/20 bg-mintcom-green/10">
                    <User size={14} className="text-mintcom-green" />
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-mintcom-green/20 bg-gradient-to-br from-mintcom-green/20 to-mintcom-green/5 p-4">
                  <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-mintcom-green/20 blur-2xl" />
                  <div className="relative z-10 mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <BarChart2 size={12} className="text-mintcom-green" />
                      <span className="text-[11px] font-semibold text-white/90">
                        {t('landing.admin.dailyRevenue')}
                      </span>
                    </div>
                    <span className="rounded-full border border-mintcom-green/20 bg-mintcom-green/10 px-2 py-0.5 text-[9px] font-bold text-mintcom-green">
                      +14.2%
                    </span>
                  </div>
                  <div className="relative z-10 text-2xl font-black tracking-tight text-white">
                    {formatCurrencyCode(2450, 'JOD', t('common.locale'), {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </div>
                </div>

                <div className="mt-1 flex flex-1 flex-col gap-2.5">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                      <Bell size={12} className="text-red-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-white/90">
                        {t('landing.admin.stockAlerts')}
                      </div>
                      <div className="text-[9px] text-gray-400">
                        Coffee Beans <span className="font-medium text-red-400">-5kg</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10">
                      <TrendingUp size={12} className="text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-white/90">
                        {t('landing.admin.shiftAlerts')}
                      </div>
                      <div className="text-[9px] text-gray-400">Sarah left at 4:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating live alert cards */}
            <FloatingNotification
              icon={Activity}
              iconBg="bg-gradient-to-br from-mintcom-green to-emerald-500"
              title={t('landing.admin.shiftAlerts')}
              body={t('landing.admin.alerts.shiftStarted', {
                location: 'Downtown',
                defaultValue: 'Shift started at Downtown',
              })}
              delay={0.4}
              position="left-2 top-[6%] lg:left-[-6%]"
            />
            <FloatingNotification
              icon={Sparkles}
              iconBg="bg-gradient-to-br from-blue-500 to-indigo-500"
              title={t('landing.admin.alerts.newOrder', {
                id: '1284',
                defaultValue: 'New order #1284',
              })}
              body={t('landing.admin.liveReports')}
              delay={0.55}
              position="right-2 bottom-[10%] lg:right-[-8%]"
            />
          </motion.div>

          {/* =================== Content =================== */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="order-1 lg:order-2 lg:col-span-6"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-mintcom-green/25 bg-white/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-mintcom-green shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(124,195,159,0.5)] backdrop-blur-xl dark:bg-white/5">
              <Laptop size={12} />
              <span>{t('landing.admin.badge')}</span>
            </div>

            <h2 className="font-magilio text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl lg:text-[64px] lg:leading-[1.02]">
              <span className="block text-gray-900 dark:text-white">
                {t('landing.admin.title1')}
              </span>
              <span className="block text-gray-900 dark:text-white">
                {t('landing.admin.title2')}
              </span>
              <span className="block bg-gradient-to-r from-mintcom-green via-emerald-400 to-mintcom-green bg-clip-text text-transparent">
                {t('landing.admin.title3')}
              </span>
            </h2>

            {/* Logo lockup */}
            <div className="mt-8 inline-flex items-center gap-5 rounded-2xl border border-gray-200 bg-white/70 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <img
                src={WhiteLogo}
                alt={t('common.logoAlt')}
                width={128}
                height={32}
                className="hidden h-8 w-auto object-contain dark:block"
                loading="lazy"
                decoding="async"
              />
              <img
                src={GreenLogo}
                alt={t('common.logoAlt')}
                width={128}
                height={32}
                className="block h-8 w-auto object-contain dark:hidden"
                loading="lazy"
                decoding="async"
              />
              <div className="h-8 w-px bg-gray-200 dark:bg-white/15" />
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                <Smartphone size={16} className="text-mintcom-green" />
                <span>{t('landing.admin.adminApp')}</span>
              </div>
            </div>

            <p className="mt-6 max-w-xl text-lg font-light leading-relaxed text-gray-600 dark:text-gray-400 md:text-xl">
              {t('landing.admin.description')}
            </p>

            {/* Bullet list with animated checks */}
            <ul className="mt-8 space-y-3">
              {[
                t('landing.admin.shiftAlerts'),
                t('landing.admin.stockAlerts'),
                t('landing.admin.liveReports'),
              ].map((label, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
                  className="group flex items-center gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-mintcom-green/20 hover:bg-mintcom-green/5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mintcom-green/15 ring-1 ring-mintcom-green/30 transition-all group-hover:bg-mintcom-green group-hover:ring-mintcom-green/50">
                    <Check
                      size={16}
                      strokeWidth={3}
                      className="text-mintcom-green transition-colors group-hover:text-black"
                    />
                  </span>
                  <span className="text-base font-semibold tracking-tight text-gray-800 dark:text-gray-100 md:text-lg">
                    {label}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

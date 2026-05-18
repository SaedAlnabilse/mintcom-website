import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Cloud,
  Crown,
  Tags,
  Building2,
  ShoppingCart,
  Users,
  BarChart2,
  TrendingUp,
  Settings,
} from 'lucide-react';
import AppStoreBadge from '../assets/App_Store_(iOS)-Badge-Logo.wine.svg';
import GooglePlayBadge from '../assets/Google_Play-Badge-Logo.wine.svg';

const SplitText = ({ text, className = '' }: { text: string; className?: string }) => {
  return (
    <span className={className}>
      {text.split(' ').map((word, i) => {
        const isMintcom = word.toLowerCase().includes('mintcom');
        return (
          <span
            key={i}
            className={
              isMintcom
                ? 'text-mintcom-green'
                : i % 2 === 0
                ? 'text-gray-900 dark:text-white'
                : 'text-mintcom-green'
            }
          >
            {word}{' '}
          </span>
        );
      })}
    </span>
  );
};

const DashboardCard = ({
  icon: Icon,
  title,
  description,
  index,
}: {
  icon: any;
  title: string;
  description: string;
  index: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay: index * 0.1, duration: 0.6 }}
    whileHover={{ y: -6, scale: 1.02 }}
    className="group relative flex flex-col h-full p-7 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#121212] hover:border-mintcom-green/40 hover:shadow-2xl hover:shadow-mintcom-green/10 shadow-lg shadow-gray-200/30 dark:shadow-none transition-all duration-500 overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

    <div className="flex items-center gap-4 mb-5 relative z-10">
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-mintcom-green/10 dark:bg-mintcom-green/15 flex items-center justify-center group-hover:bg-mintcom-green group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
        <Icon size={24} className="text-mintcom-green group-hover:text-white transition-colors duration-500" />
      </div>
      <h3 className="font-barlow text-xl font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors leading-tight tracking-tight">
        {title}
      </h3>
    </div>

    <p className="font-barlow text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium relative z-10">
      {description}
    </p>
  </motion.div>
);

// Stylised SVG-driven mockup of a laptop and tablet showing Mintcom dashboards.
// Pure CSS/SVG so it stays crisp at any size and never 404s.
const DeviceMockup = ({ t }: { t: any }) => {
  const isRtl = t('common.locale') === 'ar';
  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[420px] lg:min-h-[520px]">
      {/* Decorative background glow */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[80%] h-[80%] bg-mintcom-green/10 rounded-full blur-[100px]" />
      </div>

      {/* LAPTOP */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative w-[88%] max-w-[640px]"
      >
        {/* Laptop screen */}
        <div className="relative rounded-t-2xl bg-[#0a0a0a] border-[10px] border-gray-800 ring-1 ring-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] overflow-hidden aspect-[16/10]">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 h-7 bg-[#0d0d0d] border-b border-white/5 flex items-center px-3 gap-1.5 z-10">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-mintcom-green/70" />
            <div className="ml-3 px-2.5 py-0.5 rounded-md bg-white/5 text-[9px] text-white/50 font-mono tracking-widest">
              dashboard.mintcom.app
            </div>
          </div>

          {/* Dashboard UI */}
          <div className="w-full h-full pt-7 px-3 pb-3 bg-gradient-to-b from-[#0a0a0a] to-gray-900 flex gap-3">
            {/* Sidebar */}
            <div className="w-[18%] hidden sm:flex flex-col gap-1.5 pt-1">
              {[Crown, Building2, BarChart2, Users, Settings].map((Ic, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 px-1.5 py-1.5 rounded-md text-[8px] font-semibold ${
                    i === 0 ? 'bg-mintcom-green/15 text-mintcom-green' : 'text-white/40'
                  }`}
                >
                  <Ic size={9} />
                  <span className="hidden md:inline truncate">
                    {['Owner', 'Brand', 'Reports', 'Team', 'Settings'][i]}
                  </span>
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col gap-2">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[7px] text-white/40 uppercase tracking-widest">Owner Dashboard</p>
                  <p className="text-white font-bold text-[10px]">Performance Overview</p>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-mintcom-green/10 border border-mintcom-green/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-mintcom-green animate-pulse" />
                  <span className="text-[7px] text-mintcom-green font-bold uppercase tracking-wider">Live</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Revenue', value: '$24.8K', up: '+12.4%' },
                  { label: 'Orders', value: '1,402', up: '+8.1%' },
                  { label: 'Locations', value: '6', up: '+2' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-md p-1.5 flex flex-col"
                  >
                    <span className="text-[7px] text-white/40 uppercase tracking-wider">{s.label}</span>
                    <span className="text-white font-black text-[10px] tracking-tight">{s.value}</span>
                    <span className="text-mintcom-green text-[7px] font-bold">{s.up}</span>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="flex-1 bg-white/5 border border-white/10 rounded-md p-2 flex flex-col">
                <span className="text-[7px] text-white/40 uppercase tracking-wider mb-1">Sales Trend</span>
                <div className="flex-1 flex items-end gap-1">
                  {[35, 50, 38, 65, 48, 72, 55, 88, 62, 95, 78, 90].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 bg-gradient-to-t from-mintcom-green/40 to-mintcom-green rounded-t-[2px]"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop base */}
        <div className="relative h-3 w-full">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[10px] w-[108%] h-3 bg-gradient-to-b from-gray-700 to-gray-900 rounded-b-[20px] shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6)]" />
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[16%] h-1.5 bg-gray-950 rounded-b-md" />
        </div>
      </motion.div>

      {/* TABLET — overlaid on laptop, tilted */}
      <motion.div
        initial={{ opacity: 0, x: isRtl ? -50 : 50, rotate: isRtl ? 8 : -8 }}
        whileInView={{ opacity: 1, x: 0, rotate: isRtl ? 8 : -8 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className={`absolute bottom-[2%] ${
          isRtl ? 'left-[2%] sm:left-[6%]' : 'right-[2%] sm:right-[6%]'
        } w-[36%] max-w-[200px] sm:max-w-[230px] z-20`}
      >
        <div className="rounded-[18px] bg-[#0a0a0a] border-[6px] border-gray-800 ring-1 ring-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.6)] overflow-hidden aspect-[3/4]">
          <div className="w-full h-full p-2 flex flex-col gap-1.5 bg-gradient-to-b from-gray-900 to-[#0a0a0a]">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[6px] text-white/40 uppercase tracking-widest">Location</p>
                <p className="text-white font-bold text-[8px]">Today</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-mintcom-green/20 flex items-center justify-center">
                <Cloud size={6} className="text-mintcom-green" />
              </div>
            </div>

            {/* Hero stat */}
            <div className="bg-gradient-to-br from-mintcom-green/25 to-mintcom-green/5 border border-mintcom-green/25 rounded-md p-1.5">
              <p className="text-[6px] text-white/70 font-semibold mb-0.5">Daily Revenue</p>
              <p className="text-white font-black text-[12px] tracking-tight">JOD 2,450</p>
            </div>

            {/* List items */}
            <div className="flex-1 flex flex-col gap-1">
              {[
                { Ic: ShoppingCart, label: 'Orders', val: '142' },
                { Ic: Users, label: 'Staff', val: '8 / 12' },
                { Ic: Tags, label: 'Discounts', val: '12' },
                { Ic: TrendingUp, label: 'Profit', val: '+18%' },
              ].map((row, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-sm px-1.5 py-1"
                >
                  <div className="flex items-center gap-1">
                    <row.Ic size={7} className="text-mintcom-green" />
                    <span className="text-[6px] text-white/70 font-medium">{row.label}</span>
                  </div>
                  <span className="text-white font-bold text-[7px]">{row.val}</span>
                </div>
              ))}
            </div>

            {/* Mini chart */}
            <div className="bg-white/5 border border-white/10 rounded-sm p-1 flex items-end gap-0.5 h-7">
              {[30, 55, 42, 70, 50, 88, 65].map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 bg-gradient-to-t from-mintcom-green/40 to-mintcom-green rounded-t-[1px]"
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const CloudControl = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';

  const dashboards = [
    {
      icon: Crown,
      title: t('landing.cloudControl.owner.title'),
      description: t('landing.cloudControl.owner.description'),
    },
    {
      icon: Tags,
      title: t('landing.cloudControl.brand.title'),
      description: t('landing.cloudControl.brand.description'),
    },
    {
      icon: Building2,
      title: t('landing.cloudControl.location.title'),
      description: t('landing.cloudControl.location.description'),
    },
  ];

  return (
    <section
      id="cloud-control"
      className="py-16 lg:py-24 bg-gray-50 dark:bg-[#0f0f0f] relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mintcom-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-mintcom-green/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6 md:px-10 lg:px-16 max-w-[1280px]">
        {/* Top Section: Header + Devices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 lg:mb-20">
          {/* Left: Heading */}
          <motion.div
            initial={{ opacity: 0, x: isRtl ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group relative inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-[12px] bg-mintcom-green/5 dark:bg-mintcom-green/10 text-mintcom-green font-bold text-xs mb-8 border border-mintcom-green/20 backdrop-blur-md shadow-[0_0_15px_rgba(124,195,159,0.05)] hover:border-mintcom-green/40 transition-all duration-300"
            >
              <div className="relative flex items-center justify-center w-5 h-5 rounded-[6px] bg-mintcom-green/20 text-mintcom-green overflow-hidden">
                <Cloud size={11} className="relative z-10" />
                <motion.div
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute inset-0 bg-mintcom-green/30"
                />
              </div>
              <span className="tracking-widest uppercase text-[10px] md:text-[11px] leading-none">
                {t('landing.cloudControl.badge')}
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-magilio mb-6 leading-[1.15] rtl:leading-[1.3] tracking-tight">
              <SplitText text={t('landing.cloudControl.title')} />
              <span className="block text-mintcom-green mt-2">
                {t('landing.cloudControl.titleHighlight')}
              </span>
            </h2>
            <p className="max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl">
              {t('landing.cloudControl.subtitle')}
            </p>

            {/* Download CTA — compact, matching AdminControl style */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-10 flex flex-col gap-3"
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {t('landing.admin.installApp')}
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
                    className="block h-[54px] w-[180px] object-fill rounded-[11px]"
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
                    className="block h-[54px] w-[180px] object-fill rounded-[11px]"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Laptop + Tablet visual */}
          <motion.div
            initial={{ opacity: 0, x: isRtl ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <DeviceMockup t={t} />
          </motion.div>
        </div>

        {/* Three Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashboards.map((d, i) => (
            <DashboardCard
              key={i}
              icon={d.icon}
              title={d.title}
              description={d.description}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

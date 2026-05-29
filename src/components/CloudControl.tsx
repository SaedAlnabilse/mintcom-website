import { useRef } from 'react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
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
import AppStoreBadge from '../assets/app-store-badge.svg';
import GooglePlayBadge from '../assets/google-play-badge.svg';
import { OWNER_ANDROID_DOWNLOAD_URL, OWNER_IOS_DOWNLOAD_URL } from '../config/downloads';

// ---------------------------------------------------------------------------
// Mini "scope" preview — accurate miniaturised dashboard for each scope.
// Each one mirrors what that scope actually manages in Mintcom.
// ---------------------------------------------------------------------------

// Tiny browser-window chrome shared by all three previews
const Chrome = ({ url, label }: { url: string; label: string }) => (
  <div className="absolute top-0 left-0 right-0 h-[14px] bg-gray-100 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex items-center px-1.5 gap-1 z-10">
    <span className="w-1.5 h-1.5 rounded-full bg-red-400/70" />
    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
    <span className="w-1.5 h-1.5 rounded-full bg-mintcom-green/70" />
    <div className="ml-auto px-1.5 py-[1px] rounded-sm bg-white dark:bg-black/40 text-[7px] font-mono text-gray-500 leading-none truncate max-w-[80%]">
      <span className="text-mintcom-green">●</span> {url}
    </div>
    <span className="sr-only">{label}</span>
  </div>
);

// Owner — total revenue + per-brand breakdown + active billing
const OwnerScopePreview = ({ t }: { t: any }) => {
  const brands = [
    { name: t('landing.cloudControl.scope.preview.brandA', 'Cafe Delight'), val: 58420, change: 12.4, locs: 6 },
    { name: t('landing.cloudControl.scope.preview.brandB', 'Urban Eats'), val: 42180, change: 8.1, locs: 4 },
    { name: t('landing.cloudControl.scope.preview.brandC', 'Pizza Yard'), val: 47650, change: 4.6, locs: 3 },
  ];
  const total = brands.reduce((s, b) => s + b.val, 0);
  return (
    <>
      <Chrome url="dashboard.mintcom.app/owner" label="Owner" />
      <div className="h-full flex gap-1.5">
        {/* Hero KPI */}
        <div className="flex-shrink-0 w-[42%] rounded-md bg-gradient-to-br from-mintcom-green/15 to-mintcom-green/5 border border-mintcom-green/25 px-1.5 py-1 flex flex-col justify-center">
          <div className="text-[7px] uppercase tracking-widest text-gray-500 leading-none">
            {t('landing.cloudControl.scope.preview.totalRevenue', 'Total revenue')}
          </div>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-[12px] font-mono font-black text-gray-900 dark:text-white leading-tight mt-0.5"
          >
            ${(total / 1000).toFixed(1)}K
          </motion.div>
          <div className="flex items-center gap-0.5 text-[7px] font-bold text-mintcom-green leading-none mt-0.5">
            <TrendingUp size={6} /> +9.2%
          </div>
          <div className="mt-0.5 px-1 py-[1px] rounded-sm bg-mintcom-green/15 self-start text-[6px] font-bold uppercase tracking-widest text-mintcom-green">
            {t('landing.cloudControl.scope.preview.billingActive', 'Billing · Active')}
          </div>
        </div>

        {/* Brand rows */}
        <div className="flex-1 flex flex-col gap-[3px] min-w-0">
          {brands.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 6 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-center justify-between gap-1 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-1 py-[2px]"
            >
              <div className="flex items-center gap-1 min-w-0">
                <Tags size={6} className="text-mintcom-green flex-shrink-0" />
                <span className="text-[7px] font-bold text-gray-800 dark:text-gray-200 truncate">{b.name}</span>
                <span className="text-[6px] font-mono text-gray-400 flex-shrink-0">·{b.locs}</span>
              </div>
              <span className="text-[7px] font-mono text-mintcom-green font-bold flex-shrink-0">+{b.change}%</span>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

// Brand — brand header + locations grid + staff role split
const BrandScopePreview = ({ t }: { t: any }) => {
  const locations = [
    { name: t('landing.cloudControl.scope.preview.locDowntown', 'Downtown'), online: true },
    { name: t('landing.cloudControl.scope.preview.locMall', 'Mall'), online: true },
    { name: t('landing.cloudControl.scope.preview.locAirport', 'Airport'), online: true },
    { name: t('landing.cloudControl.scope.preview.locWest', 'West Side'), online: false },
  ];
  const roles = [
    { label: 'M', pct: 18, name: t('landing.cloudControl.scope.preview.roleManager', 'Manager') },
    { label: 'C', pct: 38, name: t('landing.cloudControl.scope.preview.roleCashier', 'Cashier') },
    { label: 'B', pct: 28, name: t('landing.cloudControl.scope.preview.roleBarista', 'Barista') },
    { label: 'S', pct: 16, name: t('landing.cloudControl.scope.preview.roleStaff', 'Staff') },
  ];
  return (
    <>
      <Chrome url="dashboard.mintcom.app/brand" label="Brand" />
      <div className="h-full flex flex-col gap-1">
        {/* Brand header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 min-w-0">
            <div className="w-3 h-3 rounded-sm bg-mintcom-green flex items-center justify-center flex-shrink-0">
              <Tags size={6} className="text-white" />
            </div>
            <span className="text-[8px] font-bold text-gray-900 dark:text-white truncate">
              {t('landing.cloudControl.scope.preview.brandA', 'Cafe Delight')}
            </span>
          </div>
          <span className="text-[6px] font-mono uppercase tracking-widest text-mintcom-green flex items-center gap-0.5 flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-mintcom-green animate-pulse" />
            3/4
          </span>
        </div>

        {/* Locations grid */}
        <div className="grid grid-cols-2 gap-[3px]">
          {locations.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.06 }}
              className="flex items-center gap-1 rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-1 py-[2px]"
            >
              <span
                className={`w-1 h-1 rounded-full flex-shrink-0 ${
                  l.online ? 'bg-mintcom-green' : 'bg-gray-400'
                }`}
              />
              <Building2 size={6} className="text-gray-400 flex-shrink-0" />
              <span className="text-[7px] font-bold text-gray-700 dark:text-gray-300 truncate">
                {l.name}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Roles distribution bar */}
        <div className="mt-auto">
          <div className="text-[6px] uppercase tracking-widest text-gray-500 leading-none mb-0.5 flex items-center gap-0.5">
            <Users size={6} />
            {t('landing.cloudControl.scope.preview.rolesAcrossLocations', 'Roles across locations')}
          </div>
          <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-200 dark:bg-white/10">
            {roles.map((r, i) => (
              <motion.div
                key={i}
                initial={{ width: 0 }}
                whileInView={{ width: `${r.pct}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                title={`${r.name} ${r.pct}%`}
                className={
                  i === 0
                    ? 'bg-mintcom-green'
                    : i === 1
                    ? 'bg-mintcom-greenLight'
                    : i === 2
                    ? 'bg-mintcom-green/60'
                    : 'bg-mintcom-green/30'
                }
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// Location — today KPIs + live order ticker
const LocationScopePreview = ({ t }: { t: any }) => {
  const kpis = [
    { label: t('landing.cloudControl.scope.preview.orders', 'Orders'), val: '142' },
    { label: t('landing.cloudControl.scope.preview.revenue', 'Revenue'), val: '$2.4K' },
    { label: t('landing.cloudControl.scope.preview.aov', 'AOV'), val: '$16.9' },
  ];
  const orders = [
    { id: '#4218', amt: '$24.50', method: 'Card' },
    { id: '#4217', amt: '$8.75', method: 'Cash' },
    { id: '#4216', amt: '$32.00', method: 'Mobile' },
  ];
  return (
    <>
      <Chrome url="dashboard.mintcom.app/location" label="Location" />
      <div className="h-full flex flex-col gap-1">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-1">
          {kpis.map((k, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 3 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="rounded-sm bg-gradient-to-br from-mintcom-green/10 to-transparent border border-mintcom-green/20 px-1 py-[2px] flex flex-col items-start"
            >
              <span className="text-[6px] uppercase tracking-widest text-gray-500 leading-none">{k.label}</span>
              <span className="text-[9px] font-mono font-black text-mintcom-green leading-tight mt-[1px]">{k.val}</span>
            </motion.div>
          ))}
        </div>

        {/* Live order ticker */}
        <div className="flex-1 flex flex-col gap-[2px]">
          <div className="text-[6px] uppercase tracking-widest text-gray-500 leading-none flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-mintcom-green animate-pulse" />
            {t('landing.cloudControl.scope.preview.liveOrders', 'Live orders')}
          </div>
          {orders.map((o, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.08 }}
              className="flex items-center justify-between rounded-sm bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-1 py-[2px]"
            >
              <div className="flex items-center gap-1">
                <ShoppingCart size={6} className="text-mintcom-green" />
                <span className="text-[7px] font-mono text-gray-600 dark:text-gray-400">{o.id}</span>
                <span className="text-[6px] font-bold uppercase tracking-widest text-gray-400">{o.method}</span>
              </div>
              <span className="text-[7px] font-mono font-bold text-gray-800 dark:text-gray-200">{o.amt}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </>
  );
};

const ScopePreview = ({ scope, t }: { scope: 'owner' | 'brand' | 'location'; t: any }) => {
  if (scope === 'owner') return <OwnerScopePreview t={t} />;
  if (scope === 'brand') return <BrandScopePreview t={t} />;
  return <LocationScopePreview t={t} />;
};

const DashboardCard = ({
  icon: Icon,
  title,
  description,
  index,
  scope,
  scopeLabel,
  t,
}: {
  icon: any;
  title: string;
  description: string;
  index: number;
  scope: 'owner' | 'brand' | 'location';
  scopeLabel: string;
  t: any;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), {
    stiffness: 200,
    damping: 20,
  });

  const spotlightX = useTransform(mouseX, [-0.5, 0.5], ['0%', '100%']);
  const spotlightY = useTransform(mouseY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Scope rank dots — visual hierarchy: Owner = 3, Brand = 2, Location = 1
  const rank = scope === 'owner' ? 3 : scope === 'brand' ? 2 : 1;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', perspective: 1000 }}
      className="group relative h-full"
    >
      {/* Outer glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-mintcom-green/0 via-mintcom-green/0 to-mintcom-green/0 group-hover:from-mintcom-green/30 group-hover:via-mintcom-green/10 group-hover:to-transparent transition-all duration-500 blur-sm pointer-events-none" />

      <div className="relative flex flex-col h-full p-7 rounded-2xl border border-gray-100 dark:border-white/5 bg-white dark:bg-[#121212] group-hover:border-mintcom-green/40 group-hover:shadow-2xl group-hover:shadow-mintcom-green/10 shadow-lg shadow-gray-200/30 dark:shadow-none transition-all duration-500 overflow-hidden">
        {/* Mouse-tracked spotlight */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: useTransform(
              [spotlightX, spotlightY] as unknown as MotionValue<number>[],
              ([x, y]: any) =>
                `radial-gradient(280px circle at ${x} ${y}, rgba(125,198,162,0.18), transparent 60%)`
            ),
          }}
        />

        {/* Scope rank chips top-right (3 dots = Owner, 2 = Brand, 1 = Location) */}
        <div className="absolute top-4 end-4 flex items-center gap-1 z-10" style={{ transform: 'translateZ(40px)' }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                i < rank ? 'bg-mintcom-green' : 'bg-gray-300 dark:bg-white/15'
              }`}
            />
          ))}
        </div>

        {/* Header: icon + scope label */}
        <div
          className="relative z-10 flex items-center gap-4 mb-5"
          style={{ transform: 'translateZ(30px)' }}
        >
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-mintcom-green/10 dark:bg-mintcom-green/15 flex items-center justify-center group-hover:bg-mintcom-green group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
            <Icon size={24} className="text-mintcom-green group-hover:text-white transition-colors duration-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500 mb-0.5 leading-none">
              {scopeLabel}
            </div>
            <h3 className="font-barlow text-xl font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors leading-tight tracking-tight">
              {title}
            </h3>
          </div>
        </div>

        {/* Mini scope preview */}
        <div
          className="relative z-10 mb-5 h-[88px] rounded-xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 overflow-hidden p-2 pt-[18px] shadow-inner"
          style={{ transform: 'translateZ(20px)' }}
        >
          <ScopePreview scope={scope} t={t} />
        </div>

        {/* Description */}
        <p
          className="relative z-10 font-barlow text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium"
          style={{ transform: 'translateZ(10px)' }}
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
};

// Stylised SVG-driven mockup of a laptop and tablet showing Mintcom dashboards.
// Pure CSS/SVG so it stays crisp at any size and never 404s.
const DeviceMockup = ({ t }: { t: any }) => {
  const isRtl = t('common.locale') === 'ar';
  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[320px] sm:min-h-[420px] lg:min-h-[520px]">
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
  const hasOwnerAndroidDownload = Boolean(OWNER_ANDROID_DOWNLOAD_URL);
  const hasOwnerIosDownload = Boolean(OWNER_IOS_DOWNLOAD_URL);
  const isRtl = t('common.locale') === 'ar';

  const dashboards = [
    {
      icon: Crown,
      title: t('landing.cloudControl.owner.title'),
      description: t('landing.cloudControl.owner.description'),
      scope: 'owner' as const,
      scopeLabel: t('landing.cloudControl.scope.global', 'Global scope'),
    },
    {
      icon: Tags,
      title: t('landing.cloudControl.brand.title'),
      description: t('landing.cloudControl.brand.description'),
      scope: 'brand' as const,
      scopeLabel: t('landing.cloudControl.scope.brand', 'Brand scope'),
    },
    {
      icon: Building2,
      title: t('landing.cloudControl.location.title'),
      description: t('landing.cloudControl.location.description'),
      scope: 'location' as const,
      scopeLabel: t('landing.cloudControl.scope.location', 'Location scope'),
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

            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-bold font-magilio mb-6 leading-tight tracking-tight">
              <span className="text-gray-900 dark:text-white">In-Sync </span>
              <span className="text-mintcom-green">Cloud Control</span>
              <span className="block text-gray-900 dark:text-white mt-2">
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
              className="mt-8 sm:mt-10 flex flex-col items-center sm:items-start gap-3 w-fit mx-auto sm:mx-0"
            >
              <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {t('landing.admin.installApp')}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {hasOwnerIosDownload ? (
                  <a
                    href={OWNER_IOS_DOWNLOAD_URL}
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
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label="Owner iOS app download coming soon"
                    className="block opacity-50 cursor-not-allowed rounded-[11px]"
                  >
                    <img
                      src={AppStoreBadge}
                      alt={t('landing.admin.downloadOnAppStore')}
                      className="block h-[52px] w-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                )}
                {hasOwnerAndroidDownload ? (
                  <a
                    href={OWNER_ANDROID_DOWNLOAD_URL}
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
                ) : (
                  <button
                    type="button"
                    disabled
                    aria-label="Owner Android app download coming soon"
                    className="block opacity-50 cursor-not-allowed rounded-[11px]"
                  >
                    <img
                      src={GooglePlayBadge}
                      alt={t('landing.admin.getItOnGooglePlay')}
                      className="block h-[52px] w-auto object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                )}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {dashboards.map((d, i) => (
            <DashboardCard
              key={i}
              icon={d.icon}
              title={d.title}
              description={d.description}
              index={i}
              scope={d.scope}
              scopeLabel={d.scopeLabel}
              t={t}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

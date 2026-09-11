import { SplitText } from "./landing/SplitText";
import { SectionCarouselFooter } from "./landing/SectionCarouselFooter";
import { AppDownloadBadgeGroup } from "./landing/AppDownloadBadgeGroup";
import { useModalKeyboardGuard } from '../hooks/useModalKeyboardGuard';
import { useCallback, useState } from 'react';
import {
  AnimatePresence,
  motion,
  type Variants,
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
  X,
  ArrowUpRight,
  LayoutDashboard,
  Store,
  Shield,
  CreditCard,
  KeyRound,
  DollarSign,
  Wallet,
  Calendar,
  Menu,
  Bell,
  PlayCircle,
  RefreshCw,
  Download,
  Home,
  Package,
  ShoppingBag,
  Activity,
  CornerDownLeft,
  ChevronDown,
  Receipt,
  Percent,
  TrendingDown,
  Award,
  Target,
  Timer,
  LogOut,
  Moon,
  Smartphone,
  FileBarChart,
  Heart,
  Sliders,
  Settings,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import MintcomLeafIcon from '../assets/small-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';
import MintcomLogoDark from '../assets/green-full-logo.svg';
import { OWNER_ANDROID_DOWNLOAD_URL, OWNER_IOS_DOWNLOAD_URL } from '../config/downloads';
import { useTheme } from '../context/ThemeContext';

type ScopeId = 'owner' | 'brand' | 'location';

type ScopeDashboard = {
  icon: typeof Crown;
  title: string;
  description: string;
  scope: ScopeId;
  scopeLabel: string;
  highlights: string[];
};

const scopeSlideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction * 72,
    opacity: 0,
    scale: 0.96,
    filter: 'blur(6px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction: number) => ({
    x: direction * -72,
    opacity: 0,
    scale: 0.96,
    filter: 'blur(6px)',
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] },
  }),
};




// ---------------------------------------------------------------------------
// Real product scope previews — OwnerOverview / BrandDashboard / Location Dashboard
// Static (select-text), Why-card fidelity. size: lg for modal, sm for device frames.
// ---------------------------------------------------------------------------

type PreviewSize = 'sm' | 'lg';

type RailItem = { id: string; Icon: LucideIcon };
/** Owner/Brand: EN · phone · theme · logout. Location: settings gear only. */
type RailFooter = 'owner' | 'location';

/**
 * Collapsed portal rail — same chrome as OwnerLayout / BrandLayout / DashboardLayout
 * (leaf · nav · footer). Scaled to fit the modal preview height.
 */
const PortalRail = ({
  items,
  active,
  lg,
  footer = 'owner',
  showSwitchLocation,
}: {
  items: readonly RailItem[];
  active: string;
  lg: boolean;
  footer?: RailFooter;
  /** DashboardLayout: MapPin switch-location above nav when multi-site */
  showSwitchLocation?: boolean;
}) => {
  const w = lg ? 'w-[68px]' : 'w-8';
  const iconBox = lg ? 'h-8 w-8' : 'h-4 w-4';
  const iconSize = lg ? 16 : 10;
  const leafBox = lg ? 'h-9 w-9' : 'h-5 w-5';
  const leafImg = lg ? 'h-5 w-5' : 'h-3 w-3';

  return (
    <aside
      className={`relative flex h-full shrink-0 flex-col border-e border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface ${w} ${
        lg ? 'py-2.5' : 'py-1'
      }`}
    >
      <div className="pointer-events-none absolute end-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-mintcom-green/25 to-transparent opacity-60" />

      <div className={`flex shrink-0 items-center justify-center ${lg ? 'mb-1.5 px-2' : 'mb-0.5 px-0.5'}`}>
        <span
          className={`flex items-center justify-center rounded-xl border border-mintcom-green/20 bg-gradient-to-br from-mintcom-green/20 to-mintcom-green/5 ${leafBox}`}
        >
          <img
            src={MintcomLeafIcon}
            alt=""
            className={`${leafImg} object-contain`}
            draggable={false}
          />
        </span>
      </div>

      {showSwitchLocation && (
        <div className={`flex shrink-0 justify-center ${lg ? 'mb-1 px-2' : 'mb-0.5 px-0.5'}`}>
          <span
            className={`flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 ${iconBox}`}
          >
            <MapPin size={iconSize} strokeWidth={2} />
          </span>
        </div>
      )}

      <div
        className={`relative z-10 flex min-h-0 flex-1 flex-col items-center justify-evenly overflow-hidden ${
          lg ? 'px-2' : 'px-0.5'
        }`}
      >
        {items.map(({ id, Icon }) => {
          const on = id === active;
          return (
            <span
              key={id}
              className={`flex shrink-0 items-center justify-center rounded-xl transition-all ${iconBox} ${
                on
                  ? 'bg-mintcom-green font-semibold text-black shadow-md shadow-mintcom-green/25'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon size={iconSize} strokeWidth={on ? 2.25 : 2} />
            </span>
          );
        })}
      </div>

      {/* Footer — matches real collapsed portal footers */}
      <div
        className={`flex shrink-0 flex-col items-center border-t border-gray-100 dark:border-white/10 ${
          lg ? 'mt-1 gap-1 px-2 pt-2' : 'gap-0.5 px-0.5 pt-0.5'
        }`}
      >
        {footer === 'location' ? (
          /* DashboardLayout collapsed: single Settings control (opens popover in real app) */
          <span
            className={`flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 ${iconBox}`}
          >
            <Settings size={iconSize} strokeWidth={2} />
          </span>
        ) : (
          /* OwnerLayout / BrandLayout collapsed: EN · mobile · theme · logout */
          <>
            <span
              className={`flex items-center justify-center rounded-xl font-black tracking-wider text-gray-600 dark:text-gray-300 ${iconBox} ${
                lg ? 'text-[10px]' : 'text-[6px]'
              }`}
            >
              EN
            </span>
            <span
              className={`flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 ${iconBox}`}
            >
              <Smartphone size={iconSize} strokeWidth={2} />
            </span>
            <span
              className={`flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 ${iconBox}`}
            >
              <Moon size={iconSize} strokeWidth={2} />
            </span>
            <span
              className={`flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 ${iconBox}`}
            >
              <LogOut size={iconSize} strokeWidth={2} />
            </span>
          </>
        )}
      </div>
    </aside>
  );
};

/** OwnerLayout collapsed menu order */
const OwnerRail = ({ active = 'overview', lg }: { active?: string; lg: boolean }) => (
  <PortalRail
    lg={lg}
    active={active}
    footer="owner"
    items={[
      { id: 'overview', Icon: LayoutDashboard },
      { id: 'locations', Icon: Store },
      { id: 'brands', Icon: Building2 },
      { id: 'employees', Icon: Users },
      { id: 'roles', Icon: Shield },
      { id: 'billing', Icon: CreditCard },
      { id: 'account', Icon: KeyRound },
    ]}
  />
);

/** BrandLayout collapsed menu: Overview · Locations · Team */
const BrandRail = ({ active = 'overview', lg }: { active?: string; lg: boolean }) => (
  <PortalRail
    lg={lg}
    active={active}
    footer="owner"
    items={[
      { id: 'overview', Icon: LayoutDashboard },
      { id: 'locations', Icon: Store },
      { id: 'team', Icon: Users },
    ]}
  />
);

/**
 * Exact DashboardLayout collapsed top-level nav (sidebarOpen=false):
 * Dashboard · Sales & Reporting · Orders · Items · Payments · Team · Loyalty · System
 * Footer: Settings gear only (not the owner 4-icon stack)
 */
const LocationRail = ({ active = 'dashboard', lg }: { active?: string; lg: boolean }) => (
  <PortalRail
    lg={lg}
    active={active}
    footer="location"
    showSwitchLocation
    items={[
      { id: 'dashboard', Icon: LayoutDashboard },
      { id: 'reports', Icon: FileBarChart },
      { id: 'orders', Icon: ShoppingCart },
      { id: 'items', Icon: Package },
      { id: 'payments', Icon: CreditCard },
      { id: 'team', Icon: Users },
      { id: 'loyalty', Icon: Heart },
      { id: 'system', Icon: Sliders },
    ]}
  />
);

/** Real dashboard stat tile — mirrors DashboardStatsCards / OwnerOverview KPI cards */
function RealStatTile({
  label,
  value,
  sub,
  Icon,
  lg,
  change,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: typeof Wallet;
  lg: boolean;
  change?: number | null;
}) {
  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface ${
        lg ? 'p-3' : 'rounded-xl p-1.5'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <span
          className={`flex items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green ${
            lg ? 'h-9 w-9' : 'h-5 w-5'
          }`}
        >
          <Icon size={lg ? 17 : 10} strokeWidth={2.15} />
        </span>
        {change != null && lg && (
          <span
            className={`inline-flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
              change >= 0
                ? 'bg-mintcom-green/10 text-mintcom-green'
                : 'bg-red-50 text-red-500 dark:bg-red-500/10'
            }`}
          >
            {change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {change >= 0 ? '+' : ''}
            {change}%
          </span>
        )}
      </div>
      <p className={`mt-2 font-medium text-gray-500 dark:text-gray-400 ${lg ? 'text-[11px]' : 'text-[6px]'}`}>
        {label}
      </p>
      <p
        className={`mt-0.5 font-sans font-black tabular-nums leading-tight text-gray-900 dark:text-white ${
          lg ? 'text-[18px]' : 'text-[10px]'
        }`}
      >
        {value}
      </p>
      {sub && lg && (
        <p className="mt-0.5 truncate text-[10px] font-medium text-gray-400">{sub}</p>
      )}
    </div>
  );
}

// Owner — real OwnerOverviewPage layout
const OwnerScopePreview = ({ t, size = 'sm' }: { t: any; size?: PreviewSize }) => {
  const lg = size === 'lg';
  const kpis = [
    { label: t('owner.overview.activeLocations', 'Active locations'), val: '13', sub: t('landing.cloudControl.scope.preview.acrossPortfolio', 'Across portfolio'), Icon: Store },
    { label: t('owner.overview.totalBrands', 'Total brands'), val: '3', sub: t('landing.cloudControl.scope.preview.activeBrands', 'Active brands'), Icon: Building2 },
    { label: t('owner.overview.totalStaff', 'Total staff'), val: '48', sub: t('landing.cloudControl.scope.preview.allLocations', 'All locations'), Icon: Users },
    { label: t('owner.overview.netSales', 'Net sales'), val: lg ? '128,420' : '128K', sub: t('owner.overview.netSalesSub', 'Excl. tax & charges'), Icon: DollarSign },
    { label: t('owner.overview.totalSales', 'Total sales'), val: lg ? '148,250' : '148K', sub: t('owner.overview.totalSalesSub', 'Incl. tax & charges'), Icon: Wallet },
    { label: t('owner.overview.totalProfit', 'Total profit'), val: lg ? '41,680' : '42K', sub: t('landing.cloudControl.scope.preview.thisWeek', 'This week'), Icon: TrendingUp },
  ];

  return (
    <div
      role="img"
      aria-label={t('landing.cloudControl.scope.preview.owner', 'Owner overview')}
      className="flex h-full w-full cursor-text select-text overflow-hidden bg-gray-50 font-sans dark:bg-mintcom-dark"
    >
      <OwnerRail active="overview" lg={lg} />
      <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${lg ? 'gap-2.5 p-3' : 'gap-1 p-1.5'}`}>
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={`font-sans font-bold tracking-tight text-gray-900 dark:text-white ${lg ? 'text-[17px]' : 'text-[10px]'}`}>
              {t('owner.overview.title', 'Overview')}
            </p>
            {lg && (
              <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                {t('landing.cloudControl.scope.preview.portfolio', 'Portfolio performance')}
              </p>
            )}
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 dark:border-white/10 dark:bg-mintcom-surface dark:text-gray-200 ${
              lg ? 'px-2.5 py-1.5 text-[11px]' : 'px-1.5 py-0.5 text-[7px]'
            }`}
          >
            <Calendar size={lg ? 12 : 8} className="text-mintcom-green" />
            {t('landing.cloudControl.scope.preview.thisWeek', 'This week')}
            <ChevronDown size={lg ? 12 : 8} className="text-gray-400" />
          </span>
        </div>

        <div className={`grid min-h-0 flex-1 grid-cols-3 content-stretch ${lg ? 'gap-2.5' : 'gap-1'}`}>
          {kpis.slice(0, lg ? 6 : 3).map((k) => (
            <RealStatTile key={k.label} label={k.label} value={k.val} sub={k.sub} Icon={k.Icon} lg={lg} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Brand — real BrandDashboardPage KPIs + ranked locations
const BrandScopePreview = ({ t, size = 'sm' }: { t: any; size?: PreviewSize }) => {
  const lg = size === 'lg';
  const stats = [
    { label: t('brand.dashboard.totalRevenue', 'Total revenue'), val: lg ? '53,320' : '53K', Icon: DollarSign },
    { label: t('brand.dashboard.totalOrders', 'Total orders'), val: '1,370', Icon: ShoppingBag },
    { label: t('brand.dashboard.avgOrderValue', 'Avg order'), val: lg ? '38.90' : '$39', Icon: Target },
    { label: t('brand.dashboard.teamSize', 'Team size'), val: '24', Icon: Users },
  ];
  const locations = [
    { name: t('landing.cloudControl.scope.preview.locDowntown', 'Downtown'), rev: '18,240', orders: 486, staff: 8, growth: 12.4 },
    { name: t('landing.cloudControl.scope.preview.locMall', 'Mall Branch'), rev: '14,620', orders: 372, staff: 6, growth: 8.1 },
    { name: t('landing.cloudControl.scope.preview.locAirport', 'Airport Kiosk'), rev: '11,080', orders: 298, staff: 5, growth: 4.2 },
    { name: t('landing.cloudControl.scope.preview.locWest', 'West Side'), rev: '9,380', orders: 214, staff: 5, growth: -1.8 },
  ];

  return (
    <div
      role="img"
      aria-label={t('landing.cloudControl.scope.preview.brand', 'Brand dashboard')}
      className="flex h-full w-full cursor-text select-text overflow-hidden bg-gray-50 font-sans dark:bg-mintcom-dark"
    >
      <BrandRail active="overview" lg={lg} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className={`flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface ${
            lg ? 'px-3.5 py-2.5' : 'px-1.5 py-1'
          }`}
        >
          <div className="min-w-0">
            <p className={`truncate font-sans font-bold text-gray-900 dark:text-white ${lg ? 'text-[16px]' : 'text-[9px]'}`}>
              {t('landing.cloudControl.scope.preview.brandA', 'Cafe Delight')}
            </p>
            {lg && (
              <p className="text-[11px] font-medium text-gray-500">
                {t('brand.dashboard.rankedByRevenue', 'Ranked by revenue')} · 4 {t('common.locations', 'locations')}
              </p>
            )}
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-gray-200 bg-white font-bold text-gray-700 dark:border-white/10 dark:bg-white/5 ${
              lg ? 'px-2.5 py-1.5 text-[11px]' : 'px-1 py-0.5 text-[7px]'
            }`}
          >
            <Calendar size={lg ? 12 : 8} className="text-mintcom-green" />
            {t('landing.cloudControl.scope.preview.thisWeek', 'This week')}
          </span>
        </div>

        <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${lg ? 'gap-2.5 p-3' : 'gap-1 p-1.5'}`}>
          <div className={`grid shrink-0 grid-cols-2 ${lg ? 'gap-2 sm:grid-cols-4' : 'grid-cols-4 gap-1'}`}>
            {stats.map((s) => (
              <RealStatTile
                key={s.label}
                label={s.label}
                value={s.val}
                Icon={s.Icon}
                lg={lg}
              />
            ))}
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface">
            <div className={`flex shrink-0 items-center justify-between border-b border-gray-100 dark:border-white/5 ${lg ? 'px-3 py-2.5' : 'px-1.5 py-1'}`}>
              <div>
                <p className={`font-bold text-gray-900 dark:text-white ${lg ? 'text-[13px]' : 'text-[8px]'}`}>
                  {t('brand.dashboard.locationPerformance', 'Location performance')}
                </p>
                {lg && (
                  <p className="text-[10px] font-medium text-gray-500">
                    {t('brand.dashboard.rankedByRevenue', 'Ranked by revenue')}
                  </p>
                )}
              </div>
              {lg && (
                <span className="text-[11px] font-bold text-mintcom-green">
                  {t('brand.dashboard.viewAll', 'View all')}
                </span>
              )}
            </div>
            <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-hidden dark:divide-white/5">
              {locations.slice(0, lg ? 4 : 3).map((l, i) => (
                <div
                  key={l.name}
                  className={`flex h-[25%] min-h-0 items-center gap-2.5 ${lg ? 'px-3' : 'px-1.5'}`}
                >
                  <span
                    className={`flex shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${
                      i === 0
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                        : i === 1
                          ? 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300'
                          : i === 2
                            ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/20'
                            : 'bg-gray-100 text-gray-500 dark:bg-white/5'
                    } ${lg ? 'h-8 w-8' : 'h-4 w-4'}`}
                  >
                    {i === 0 && lg ? <Award size={14} /> : `#${i + 1}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-bold text-gray-900 dark:text-white ${lg ? 'text-[12px]' : 'text-[8px]'}`}>
                      {l.name}
                    </p>
                    {lg && (
                      <p className="flex items-center gap-2 text-[10px] font-medium text-gray-500">
                        <span className="inline-flex items-center gap-0.5">
                          <ShoppingBag size={10} /> {l.orders}
                        </span>
                        <span className="inline-flex items-center gap-0.5">
                          <Users size={10} /> {l.staff}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-end">
                    <p className={`font-sans font-black tabular-nums text-gray-900 dark:text-white ${lg ? 'text-[12px]' : 'text-[8px]'}`}>
                      {l.rev}
                    </p>
                    <p
                      className={`font-bold ${l.growth >= 0 ? 'text-mintcom-green' : 'text-red-500'} ${
                        lg ? 'text-[10px]' : 'text-[6px]'
                      }`}
                    >
                      {l.growth >= 0 ? '+' : ''}
                      {l.growth}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Location — real location DashboardPage (stats + top products / orders)
const LocationScopePreview = ({ t, size = 'sm' }: { t: any; size?: PreviewSize }) => {
  const lg = size === 'lg';
  const kpis = [
    {
      label: t('dashboard.stats.totalSales', 'Total sales'),
      val: lg ? '2,418.50' : '2.4K',
      sub: t('dashboard.stats.includingTaxServiceCharge', 'Incl. tax & service'),
      Icon: Wallet,
    },
    {
      label: t('dashboard.stats.netSales', 'Net sales'),
      val: lg ? '2,104.20' : '2.1K',
      sub: t('dashboard.stats.excludingTaxServiceCharge', 'Excl. tax & service'),
      Icon: DollarSign,
    },
    {
      label: t('dashboard.stats.profit', 'Profit'),
      val: lg ? '684.00' : '684',
      sub: t('dashboard.stats.netSalesCosts', 'Net − costs'),
      Icon: TrendingUp,
    },
    {
      label: t('dashboard.stats.totalOrders', 'Orders'),
      val: '142',
      sub: t('dashboard.stats.thisShift', 'This shift'),
      Icon: Receipt,
    },
    {
      label: t('dashboard.stats.avgOrder', 'Avg order'),
      val: lg ? '16.90' : '$17',
      sub: t('dashboard.stats.averageValue', 'Average value'),
      Icon: Target,
    },
    {
      label: t('dashboard.stats.tax', 'Tax'),
      val: lg ? '241.80' : '242',
      sub: t('dashboard.stats.totalTax', 'Total tax'),
      Icon: Percent,
    },
  ];

  return (
    <div
      role="img"
      aria-label={t('landing.cloudControl.scope.preview.location', 'Location dashboard')}
      className="flex h-full w-full cursor-text select-text overflow-hidden bg-gray-50 font-sans dark:bg-mintcom-dark"
    >
      <LocationRail active="dashboard" lg={lg} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Real dashboard page header */}
        <div
          className={`flex shrink-0 items-center justify-between gap-2 border-b border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface ${
            lg ? 'px-3 py-2.5' : 'px-1.5 py-1'
          }`}
        >
          <div className="min-w-0">
            <p className={`truncate font-sans font-bold text-gray-900 dark:text-white ${lg ? 'text-[15px]' : 'text-[9px]'}`}>
              {t('landing.cloudControl.scope.preview.locDowntown', 'Downtown')}
            </p>
            {lg && (
              <p className="text-[10px] font-medium text-gray-500">
                Cafe Delight · {t('dashboard.viewMode.showingSince', 'Shift since 8:00 AM')}
              </p>
            )}
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-mintcom-green/30 bg-mintcom-green/10 font-bold text-mintcom-green ${
              lg ? 'px-2.5 py-1.5 text-[11px]' : 'px-1.5 py-0.5 text-[7px]'
            }`}
          >
            <Timer size={lg ? 12 : 8} />
            {t('dashboard.viewMode.currentShift', 'Current shift')}
            <ChevronDown size={lg ? 12 : 8} />
          </span>
        </div>

        <div className={`flex min-h-0 flex-1 flex-col overflow-hidden ${lg ? 'gap-2 p-2.5' : 'gap-1 p-1.5'}`}>
          {lg && (
            <span className="w-fit shrink-0 rounded-lg border border-mintcom-green/20 bg-mintcom-green/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-mintcom-green">
              {t('dashboard.stats.overview', 'Overview')}
            </span>
          )}

          <div className={`grid min-h-0 flex-1 grid-cols-3 content-stretch ${lg ? 'gap-2.5' : 'gap-1'}`}>
            {kpis.slice(0, lg ? 6 : 3).map((k) => (
              <RealStatTile key={k.label} label={k.label} value={k.val} sub={k.sub} Icon={k.Icon} lg={lg} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ScopePreview = ({
  scope,
  t,
  size = 'sm',
}: {
  scope: ScopeId;
  t: any;
  size?: PreviewSize;
}) => {
  if (scope === 'owner') return <OwnerScopePreview t={t} size={size} />;
  if (scope === 'brand') return <BrandScopePreview t={t} size={size} />;
  return <LocationScopePreview t={t} size={size} />;
};

/**
 * Same chrome as Features WorkflowFeatureCard / Why FeatureCard:
 * icon + title, description, Learn more — opens scope modal.
 */
const DashboardCard = ({
  dashboard,
  index,
  t,
  onOpen,
}: {
  dashboard: ScopeDashboard;
  index: number;
  t: (...args: any[]) => any;
  onOpen: (index: number) => void;
}) => {
  const Icon = dashboard.icon;

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={dashboard.title}
      onClick={() => onOpen(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(index);
        }
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: (index % 3) * 0.08, duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="group relative flex h-full min-h-[248px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-transparent bg-white p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)] transition-all duration-500 hover:border-mintcom-green/25 hover:shadow-[0_16px_40px_-14px_rgba(124,195,159,0.28)] focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-mintcom-green/30 active:outline-none active:ring-0 dark:border-transparent dark:bg-[#121212] dark:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] dark:hover:border-mintcom-green/20"
    >
      <div className="relative z-10 mb-4 flex min-h-[56px] items-center gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 shadow-inner transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-mintcom-green dark:bg-mintcom-green/15">
          <Icon
            size={22}
            className="text-mintcom-green transition-colors duration-500 group-hover:text-white"
          />
        </div>
        <h3 className="line-clamp-2 flex min-h-[2.5rem] items-center font-sans text-base font-bold leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-mintcom-green dark:text-white">
          {dashboard.title}
        </h3>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col justify-between">
        <p className="line-clamp-3 min-h-[3.75rem] font-sans text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400">
          {dashboard.description}
        </p>

        <div className="mt-3">
          <div className="mb-3 h-px w-full bg-gray-200 dark:bg-white/10" />
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-bold tracking-wide text-mintcom-green transition-colors group-hover:text-mintcom-green/80">
            {t('landing.features.readMore', 'Learn more')}
            <ArrowUpRight
              size={11}
              className="text-mintcom-green opacity-0 transition-opacity group-hover:opacity-100"
            />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Scope modal — same shell as Features / Why modals for site-wide consistency:
 * counter · close · title + copy + dots · product preview · prev / dots / next.
 */
const ScopeDashboardModal = ({
  dashboards,
  activeIndex,
  direction,
  onClose,
  onPrev,
  onNext,
  onJumpTo,
  t,
  isRtl,
}: {
  dashboards: ScopeDashboard[];
  activeIndex: number;
  direction: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpTo: (i: number) => void;
  t: (...args: any[]) => any;
  isRtl: boolean;
}) => {
  const item = dashboards[activeIndex];
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_-16px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-mintcom-dark"
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={String(t('common.close', 'Close'))}
          className="absolute end-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div className="absolute start-4 top-4 z-30 flex items-center gap-1 px-1 py-1 text-xs font-bold text-mintcom-green">
          <span className="tabular-nums">{activeIndex + 1}</span>
          <span className="opacity-50">/</span>
          <span className="tabular-nums opacity-70">{dashboards.length}</span>
        </div>

        <div className="relative min-h-0 overflow-x-hidden overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={scopeSlideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative z-10 p-5 pt-12 will-change-transform sm:p-6 sm:pt-12 md:p-8 md:pt-14"
            >
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.78fr)_minmax(340px,1.22fr)] lg:gap-8 xl:grid-cols-[minmax(0,0.72fr)_minmax(380px,1.28fr)]">
                {/* Story — Features modal language */}
                <div className="order-2 min-w-0 lg:order-1">
                  <h3 className="line-clamp-2 font-sans text-2xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white md:text-3xl lg:text-[2rem]">
                    {item.title}
                  </h3>
                  <p className="mt-3 line-clamp-5 max-w-md font-sans text-[15px] font-medium leading-relaxed text-gray-600 dark:text-gray-300 md:text-base">
                    {item.description}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {item.highlights.map((line) => (
                      <li
                        key={line}
                        className="flex items-start gap-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mintcom-green" />
                        <span className="line-clamp-2">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Product preview — same frame as Why feature shots */}
                <div className="order-1 w-full min-w-0 lg:order-2">
                  <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-lg shadow-black/10 dark:border-white/10 dark:bg-mintcom-dark dark:shadow-black/40">
                    <div className="h-[min(52vh,380px)] w-full overflow-hidden sm:h-[420px] md:h-[440px]">
                      <ScopePreview scope={item.scope} t={t} size="lg" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <SectionCarouselFooter
          totalCount={dashboards.length}
          activeIndex={activeIndex}
          onPrev={onPrev}
          onNext={onNext}
          onJumpTo={onJumpTo}
          isRtl={isRtl}
          prevLabel={String(t("common.previous", "Previous"))}
          nextLabel={String(t("common.next", "Next"))}
        />
      </motion.div>
    </div>
  );
};

/**
 * MacBook mockup — Owner Portal screen matching real OwnerLayout + OwnerOverviewPage
 * (dark mode): sidebar nav, KPI cards, net sales trend.
 */
const DeviceMockup = ({ t }: { t: any }) => {
  const isRtl = t('common.locale') === 'ar';
  const locale = t('common.locale') === 'ar' ? 'ar-EG' : 'en-US';
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';

  // 1. MacBook theme colors
  const MAC_BG = isDarkMode ? '#050505' : '#F8FAFC';
  const MAC_SIDEBAR_BG = isDarkMode ? '#1E293B' : '#FFFFFF';
  const MAC_CARD_BG = isDarkMode ? '#1E293B' : '#FFFFFF';
  const MAC_CARD_BORDER = isDarkMode ? 'border-white/[0.05]' : 'border-gray-200';
  const MAC_TEXT = isDarkMode ? 'text-white' : 'text-gray-900';
  const MAC_SUB = isDarkMode ? 'text-gray-400' : 'text-slate-600';
  const MAC_BORDER = isDarkMode ? 'border-white/[0.05]' : 'border-gray-200';

  // 2. iPhone theme colors
  const PH_BG = isDarkMode ? '#1F1D2B' : '#F8FAFC';
  const PH_CARD_BG = isDarkMode ? '#252836' : '#FFFFFF';
  const PH_TEXT = isDarkMode ? 'text-white' : 'text-gray-900';
  const PH_BORDER = isDarkMode ? '#3A3A4A' : '#E2E8F0';

  const sidebarItems = [
    { icon: LayoutDashboard, label: t('owner.menu.overview', 'Overview'), active: true },
    { icon: Store, label: t('owner.menu.locations', 'Locations'), active: false },
    { icon: Building2, label: t('owner.menu.brands', 'Brands'), active: false },
    { icon: Users, label: t('owner.menu.employees', 'Employees'), active: false },
    { icon: Shield, label: t('owner.menu.globalRoles', 'Global Roles'), active: false },
    { icon: CreditCard, label: t('owner.menu.billing', 'Billing'), active: false },
    { icon: KeyRound, label: t('owner.menu.accountManagement', 'Account'), active: false },
  ];

  const kpis = [
    {
      label: t('owner.overview.netSales', 'Net Sales'),
      value: (21450).toLocaleString(locale, { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }),
      sub: t('owner.overview.netSalesSub', 'Excludes tax and other charges'),
      icon: DollarSign,
      iconColor: 'text-mintcom-green',
      iconBg: 'bg-mintcom-green/10',
    },
    {
      label: t('owner.overview.totalSales', 'Total Sales'),
      value: (24800).toLocaleString(locale, { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }),
      sub: t('owner.overview.totalSalesSub', 'Includes tax and other charges'),
      icon: Wallet,
      iconColor: 'text-mintcom-green',
      iconBg: 'bg-mintcom-green/10',
    },
    {
      label: t('owner.overview.totalProfit', 'Total Profit'),
      value: (8120).toLocaleString(locale, { style: 'currency', currency: 'JOD', maximumFractionDigits: 0 }),
      sub: null as string | null,
      icon: TrendingUp,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: t('owner.overview.activeLocations', 'Active Locations'),
      value: '6',
      sub: null as string | null,
      icon: Store,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: t('owner.overview.totalBrands', 'Total Brands'),
      value: '3',
      sub: null as string | null,
      icon: Building2,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-500/10',
    },
    {
      label: t('owner.overview.totalStaff', 'Total Staff'),
      value: '42',
      sub: null as string | null,
      icon: Users,
      iconColor: 'text-pink-400',
      iconBg: 'bg-pink-500/10',
    },
  ];

  const chartHeights = [38, 52, 44, 68, 55, 78, 62, 90, 70, 85, 74, 92];

  return (
    <div className="relative w-full h-full flex items-center justify-center min-h-[320px] sm:min-h-[420px] lg:min-h-[520px] select-none">
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="w-[80%] h-[80%] bg-mintcom-green/10 rounded-full blur-[100px]" />
      </div>

      {/* ── MacBook ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative w-[92%] max-w-[680px]"
      >
        {/* Lid / screen bezel — real MacBook Pro style (notch, no browser chrome) */}
        <div
          className="relative rounded-t-[16px] border-[9px] border-[#1c1c1e] ring-1 ring-white/10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.65)] overflow-hidden aspect-[16/10]"
          style={{
            background: '#0a0a0a',
            boxShadow:
              '0 30px 60px -20px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Display notch (MacBook Pro style) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <div
              className="relative h-[14px] sm:h-[16px] w-[88px] sm:w-[108px] bg-black rounded-b-[10px] flex items-center justify-center"
              style={{
                boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {/* Camera module */}
              <div
                className="w-[7px] h-[7px] sm:w-[8px] sm:h-[8px] rounded-full relative"
                style={{
                  background:
                    'radial-gradient(circle at 35% 35%, #1a2744 0%, #0a1020 50%, #050508 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(80,120,200,0.18)',
                }}
              >
                <div className="absolute top-[1.5px] left-[1.5px] w-[1.5px] h-[1.5px] rounded-full bg-sky-300/25" />
              </div>
            </div>
          </div>

          {/* Thin top bezel strip (screen edge under notch) */}
          <div className="absolute top-0 inset-x-0 h-[3px] bg-black z-20 pointer-events-none" />

          {/* Owner portal UI — full-bleed under notch */}
          <div className="w-full h-full flex transition-colors duration-300" style={{ backgroundColor: MAC_BG }}>
            {/* ── Real OwnerLayout sidebar ── */}
            <div className={`hidden sm:flex w-[22%] min-w-0 flex-col border-r ${MAC_BORDER} py-2 px-1.5 relative transition-colors duration-300`} style={{ backgroundColor: MAC_SIDEBAR_BG }}>
              <div className="absolute top-0 end-0 w-px h-full bg-gradient-to-b from-transparent via-mintcom-green/20 to-transparent opacity-50 pointer-events-none" />

              {/* Brand header */}
              <div className="flex items-center gap-1.5 px-1.5 h-8 mb-1 shrink-0">
                <img
                  src={isDarkMode ? MintcomLogoWhite : MintcomLogoDark}
                  alt="Mintcom"
                  className="h-4 w-auto object-contain max-w-[88%]"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              <p className={`px-1.5 py-1 text-[7px] font-semibold tracking-wide mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                {t('owner.menu.mainMenu', 'Main Menu')}
              </p>

              <div className="flex-1 min-h-0 flex flex-col gap-0.5 overflow-hidden">
                {sidebarItems.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-1.5 px-1.5 py-[5px] rounded-lg text-[8px] font-semibold transition-colors ${
                      item.active
                        ? 'bg-mintcom-green text-black shadow-sm shadow-mintcom-green/25'
                        : isDarkMode ? 'text-gray-400' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon size={10} className="shrink-0" strokeWidth={2.25} />
                    <span className="truncate leading-none">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Account chip at bottom of sidebar */}
              <div className={`mt-auto pt-1.5 border-t ${MAC_BORDER} px-1`}>
                <div className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 ${isDarkMode ? 'bg-white/[0.04]' : 'bg-slate-100'}`}>
                  <div className="w-5 h-5 rounded-md bg-mintcom-green/15 border border-mintcom-green/25 flex items-center justify-center shrink-0">
                    <img src={MintcomLeafIcon} alt="" className="w-3 h-3 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-[7px] font-bold truncate ${MAC_TEXT}`}>
                      {t('landing.admin.mockup.businessOwner', 'Business Owner')}
                    </p>
                    <p className={`text-[6px] truncate ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>owner@mintcom.app</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Owner Overview main ── */}
            <div className="flex-1 min-w-0 flex flex-col overflow-hidden px-2.5 py-2 gap-1.5 transition-colors duration-300" style={{ backgroundColor: MAC_BG }}>
              {/* Page header + period filter */}
              <div className="flex items-start justify-between gap-2 shrink-0">
                <div className="min-w-0">
                  <h2 className={`text-[11px] sm:text-[12px] font-bold tracking-tight leading-tight truncate ${MAC_TEXT}`}>
                    {t('owner.overview.title', 'Business Overview')}
                  </h2>
                  <p className={`text-[7px] mt-0.5 truncate ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                    {t('owner.overview.subtitle', {
                      count: 6,
                      brands: 3,
                      defaultValue: '6 locations · 3 brands',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0 rounded-xl border border-mintcom-green/40 bg-mintcom-green/10 px-1.5 py-1 shadow-sm shadow-mintcom-green/10">
                  <Calendar size={8} className="text-mintcom-green" />
                  <span className="text-[7px] font-bold text-mintcom-green">
                    {t('common.datePeriods.this_week', 'This Week')}
                  </span>
                </div>
              </div>

              {/* KPI grid — 6 cards like real overview */}
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5 shrink-0">
                {kpis.map((kpi) => (
                  <div
                    key={kpi.label}
                    className={`rounded-lg border ${MAC_CARD_BORDER} p-1.5 sm:p-2 relative overflow-hidden transition-colors duration-300`}
                    style={{ backgroundColor: MAC_CARD_BG }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md ${kpi.iconBg} ${kpi.iconColor} flex items-center justify-center`}
                      >
                        <kpi.icon size={10} strokeWidth={2.25} />
                      </div>
                    </div>
                    <p className={`text-[6px] sm:text-[7px] font-semibold leading-tight mb-0.5 truncate ${MAC_SUB}`}>
                      {kpi.label}
                    </p>
                    <p className={`text-[9px] sm:text-[11px] font-black tracking-tight leading-none tabular-nums ${MAC_TEXT}`}>
                      {kpi.value}
                    </p>
                    {kpi.sub && (
                      <p className="text-[5px] sm:text-[6px] text-gray-500 mt-0.5 truncate hidden sm:block">
                        {kpi.sub}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Net Sales Trend chart card */}
              <div className={`flex-1 min-h-0 rounded-lg border ${MAC_BORDER} p-2 flex flex-col transition-colors duration-300`} style={{ backgroundColor: MAC_CARD_BG }}>
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                  <div className="min-w-0">
                    <p className={`text-[9px] font-bold tracking-tight truncate ${MAC_TEXT}`}>
                      {t('owner.overview.netSalesTrend', 'Net Sales Trend')}
                    </p>
                    <p className={`text-[6px] truncate ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                      {t('owner.overview.consolidatedPerf', 'Consolidated Performance Across Locations')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-mintcom-green" />
                    <span className="text-[6px] font-medium text-gray-500">
                      {t('owner.overview.netSales', 'Net Sales')} (JOD)
                    </span>
                  </div>
                </div>

                {/* Area-style chart mock (matches green trend) */}
                <div className="flex-1 min-h-0 relative flex items-end">
                  {/* Soft area fill behind bars */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-[70%] opacity-30 pointer-events-none"
                    style={{
                      background:
                        'linear-gradient(to top, rgba(125,198,162,0.35) 0%, transparent 100%)',
                      clipPath:
                        'polygon(0% 70%, 8% 55%, 16% 62%, 25% 35%, 33% 48%, 42% 22%, 50% 40%, 58% 8%, 66% 28%, 75% 12%, 83% 24%, 92% 5%, 100% 18%, 100% 100%, 0% 100%)',
                    }}
                  />
                  <div className="relative w-full h-full flex items-end gap-[3px] px-0.5">
                    {chartHeights.map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-[2px] bg-gradient-to-t from-mintcom-green/50 to-mintcom-green"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* X-axis ticks */}
                <div className="flex justify-between mt-1 px-0.5 shrink-0">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                    <span key={d} className="text-[5px] font-medium text-gray-600">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MacBook base / chin */}
        <div className="relative h-3 w-full">
          <div className="absolute left-1/2 -translate-x-1/2 -top-[10px] w-[108%] h-3 bg-gradient-to-b from-[#3a3a3c] via-[#2c2c2e] to-[#1c1c1e] rounded-b-[18px] shadow-[0_15px_30px_-10px_rgba(0,0,0,0.6)]" />
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[14%] h-1 bg-[#0a0a0a] rounded-b-sm" />
        </div>
      </motion.div>

      {/* ── iPhone — Admin Portal location dashboard ── */}
      <motion.div
        initial={{ opacity: 0, x: isRtl ? -50 : 50, rotate: isRtl ? 10 : -10 }}
        whileInView={{ opacity: 1, x: 0, rotate: isRtl ? 10 : -10 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, delay: 0.2 }}
        className={`absolute bottom-[-2%] sm:bottom-[0%] ${
          isRtl ? 'left-[0%] sm:left-[4%]' : 'right-[0%] sm:right-[4%]'
        } w-[34%] max-w-[168px] sm:max-w-[196px] z-20`}
      >
        {/* Titanium chassis */}
        <div
          className="relative w-full aspect-[9/19.5] rounded-[36px] p-[2px]"
          style={{
            background:
              'linear-gradient(145deg, #6b6b70 0%, #2a2a2e 18%, #8e8e93 38%, #1c1c1e 55%, #5a5a5f 78%, #3a3a3c 100%)',
            boxShadow:
              '0 28px 50px -12px rgba(0,0,0,0.7), 0 12px 24px -8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <div
            className="relative w-full h-full rounded-[34px] p-[8px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #1a1a1c 0%, #0a0a0b 100%)',
            }}
          >
            {/* Side rails */}
            <div className="absolute -left-[2.5px] top-[18%] w-[2.5px] h-[16px] rounded-l-sm bg-[#3a3a3c] z-40" />
            <div className="absolute -left-[2.5px] top-[26%] w-[2.5px] h-[28px] rounded-l-sm bg-[#3a3a3c] z-40" />
            <div className="absolute -left-[2.5px] top-[36%] w-[2.5px] h-[28px] rounded-l-sm bg-[#3a3a3c] z-40" />
            <div className="absolute -right-[2.5px] top-[28%] w-[2.5px] h-[44px] rounded-r-sm bg-[#3a3a3c] z-40" />

            {/* Screen */}
            <div
              className="relative w-full h-full rounded-[26px] overflow-hidden flex flex-col transition-colors duration-300"
              style={{ background: PH_BG }}
            >
              {/* Status + Dynamic Island over green header */}
              <div className="absolute top-0 inset-x-0 h-[22px] z-30 pointer-events-none flex items-end justify-between px-3.5 pb-0.5">
                <span className="text-[7px] font-semibold text-white">9:41</span>
                <div className="flex items-center gap-0.5">
                  <div className="flex items-end gap-px h-1.5">
                    {[2, 3, 4, 5].map((h) => (
                      <div key={h} className="w-[1.5px] rounded-sm bg-white" style={{ height: h }} />
                    ))}
                  </div>
                  <div className="w-[12px] h-[6px] rounded-[1.5px] border border-white relative ml-0.5">
                    <div className="absolute inset-[1px] right-[2px] rounded-[0.5px] bg-white" />
                  </div>
                </div>
              </div>
              <div
                className="absolute left-1/2 top-[5px] -translate-x-1/2 h-[16px] w-[62px] rounded-full z-40 pointer-events-none flex items-center justify-end pr-1.5"
                style={{ background: '#000' }}
              >
                <div
                  className="w-[7px] h-[7px] rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 35% 35%, #1a2744 0%, #0a0f1a 55%, #000 100%)',
                  }}
                />
              </div>

              {/* Green header (OwnerScreenHeader — Dashboard) */}
              <div className="flex-shrink-0 pt-[22px]" style={{ backgroundColor: '#7dc6a2' }}>
                <div className="flex items-center justify-between px-2 h-8">
                  <Menu size={11} className="text-white" strokeWidth={2.25} />
                  <span className="text-white font-bold text-[10px] tracking-tight">
                    {t('menu.dashboard', 'Dashboard')}
                  </span>
                  <div className="relative">
                    <Bell size={11} className="text-white" strokeWidth={2.25} />
                    <span className="absolute -top-0.5 -right-0.5 min-w-[9px] h-[9px] rounded-full bg-[#D55263] border border-[#7dc6a2] text-[5px] font-black text-white flex items-center justify-center px-0.5">
                      7
                    </span>
                  </div>
                </div>
              </div>

              {/* Scrollable dashboard body */}
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {/* Hero pills (OwnerScreenHero) */}
                <div className="px-1.5 pt-1.5 pb-1 transition-colors duration-300" style={{ backgroundColor: PH_BG }}>
                  <div
                    className="flex rounded-lg border px-1 py-1.5 transition-colors duration-300"
                    style={{ backgroundColor: PH_CARD_BG, borderColor: PH_BORDER }}
                  >
                    <div className="flex-1 flex flex-col items-center justify-center px-0.5">
                      <div className="flex items-center gap-0.5 mb-0.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                          <PlayCircle size={7} className="text-emerald-400" />
                        </div>
                      </div>
                      <span className={`text-[5.5px] font-extrabold text-center leading-tight transition-colors duration-300 ${PH_TEXT}`}>
                        {t('dashboard.shiftStatus.activeOnly', 'Active Shift')}
                      </span>
                      <span className="text-[5px] font-bold text-emerald-400/90 truncate max-w-full">
                        Sara
                      </span>
                    </div>
                    <div className="w-px self-stretch my-0.5 transition-colors duration-300" style={{ backgroundColor: PH_BORDER }} />
                    <div className="flex-1 flex flex-col items-center justify-center px-0.5">
                      <div className="flex items-center gap-0.5 mb-0.5">
                        <div className="w-3.5 h-3.5 rounded-full bg-mintcom-green/15 flex items-center justify-center">
                          <RefreshCw size={7} className="text-mintcom-green" />
                        </div>
                        <span className={`text-[9px] font-black tracking-tight tabular-nums transition-colors duration-300 ${PH_TEXT}`}>9:41</span>
                      </div>
                      <span className="text-[5px] font-extrabold uppercase tracking-wide text-gray-500">
                        {t('dashboard.lastUpdated', 'Last updated')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 px-1.5 flex flex-col gap-1 overflow-hidden">
                  {/* View Mode selector — matches admin portal ViewModeSelector card */}
                  <div
                    className="flex items-center gap-1.5 rounded-lg border px-1.5 py-1.5 transition-colors duration-300"
                    style={{ backgroundColor: PH_CARD_BG, borderColor: PH_BORDER }}
                  >
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'rgba(125,198,162,0.2)' }}
                    >
                      <PlayCircle size={10} className="text-mintcom-green" strokeWidth={2.25} />
                    </div>
                    <span className="text-[6.5px] font-semibold text-slate-400 shrink-0">
                      {t('dashboard.viewMode.selectView', 'View Mode')}
                    </span>
                    <div className="flex-1" />
                    <span className="text-[7px] font-bold text-mintcom-green truncate max-w-[42%]">
                      {t('dashboard.viewMode.currentShift', 'Current Shift')}
                    </span>
                    <ChevronDown size={10} className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} shrink-0`} strokeWidth={2.5} />
                  </div>

                  {/* Info bar */}
                  <div
                    className="flex items-center justify-between rounded-md border px-1.5 py-1 transition-colors duration-300"
                    style={{ backgroundColor: isDarkMode ? '#1A1F2E' : '#F1F5F9', borderColor: PH_BORDER }}
                  >
                    <div className="flex items-center gap-1 min-w-0">
                      <PlayCircle size={8} className="text-mintcom-green shrink-0" />
                      <span className={`text-[6px] font-semibold truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {t('dashboard.viewMode.showingSince', {
                          date: '8:00 AM',
                          defaultValue: 'Since 8:00 AM',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[5px] text-gray-500">9:41 AM</span>
                      <div
                        className="w-4 h-4 rounded-md border flex items-center justify-center transition-colors duration-300"
                        style={{ backgroundColor: isDarkMode ? '#252A3A' : '#FFFFFF', borderColor: PH_BORDER }}
                      >
                        <Download size={7} className="text-mintcom-green" />
                      </div>
                    </div>
                  </div>

                  {/* Section: Overview KPIs */}
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-mintcom-green" />
                    <span className={`text-[6px] font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('dashboard.stats.overview', 'Overview')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {[
                      {
                        label: t('dashboard.stats.netSales', 'Net Sales'),
                        value: '2,180 JOD',
                        sub: t('dashboard.stats.excludingTaxServiceCharge', 'Excludes tax & charges'),
                        featured: true,
                        Icon: TrendingUp,
                      },
                      {
                        label: t('dashboard.stats.totalSales', 'Total Sales'),
                        value: '2,450 JOD',
                        sub: t('dashboard.stats.includingTaxServiceCharge', 'Includes tax & charges'),
                        featured: false,
                        Icon: CreditCard,
                      },
                      {
                        label: t('dashboard.stats.totalOrders', 'Orders'),
                        value: '142',
                        sub: t('dashboard.stats.completedOrders', 'Completed orders'),
                        featured: false,
                        Icon: ShoppingBag,
                      },
                      {
                        label: t('dashboard.stats.profit', 'Profit'),
                        value: '812 JOD',
                        sub: t('dashboard.stats.netSalesCosts', 'Net Sales - Costs'),
                        featured: false,
                        Icon: Activity,
                      },
                      {
                        label: t('dashboard.stats.avgOrder', 'Avg Order'),
                        value: '17.3 JOD',
                        sub: t('dashboard.stats.avgOrderValue', 'Avg. Order Value'),
                        featured: false,
                        Icon: DollarSign,
                      },
                      {
                        label: t('dashboard.stats.refunds', 'Refunds'),
                        value: '24 JOD',
                        sub: t('dashboard.stats.thisShift', 'This Shift'),
                        featured: false,
                        Icon: CornerDownLeft,
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="rounded-md p-1.5 border transition-colors duration-300"
                        style={{
                          backgroundColor: card.featured
                            ? 'rgba(125,198,162,0.07)'
                            : PH_CARD_BG,
                          borderColor: card.featured ? '#7dc6a2' : PH_BORDER,
                          borderWidth: card.featured ? 1.5 : 1,
                          boxShadow: card.featured
                            ? '0 0 10px rgba(125,198,162,0.25)'
                            : undefined,
                        }}
                      >
                        <p className={`text-[5.5px] font-bold truncate mb-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {card.label}
                        </p>
                        <p className={`text-[8px] font-black tabular-nums leading-none transition-colors duration-300 ${PH_TEXT}`}>
                          {card.value}
                        </p>
                        <p className="text-[5px] text-gray-500 mt-0.5 truncate">{card.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Sales Trends mini chart */}
                  <div className="flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-mintcom-green" />
                    <span className={`text-[6px] font-extrabold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {t('owner.overview.salesTrends', 'Sales Trends')}
                    </span>
                  </div>
                  <div
                    className="rounded-md border p-1.5 flex-1 min-h-[36px] flex flex-col transition-colors duration-300"
                    style={{ backgroundColor: PH_CARD_BG, borderColor: PH_BORDER }}
                  >
                    <div className="flex-1 flex items-end gap-0.5">
                      {[40, 55, 42, 70, 58, 85, 62, 92, 74, 88].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-t-[1px] bg-gradient-to-t from-mintcom-green/45 to-mintcom-green"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom nav (dashboard mode) */}
              <div
                className="flex-shrink-0 flex items-center justify-around border-t px-0.5 pt-1 pb-2 transition-colors duration-300"
                style={{ backgroundColor: PH_BG, borderColor: PH_BORDER }}
              >
                {[
                  { Icon: Home, label: t('dashboard.menu.dashboard', 'Home'), active: true },
                  { Icon: BarChart2, label: t('dashboard.menu.reports', 'Reports'), active: false },
                  { Icon: ShoppingBag, label: t('dashboard.menu.orders', 'Orders'), active: false },
                  { Icon: Package, label: t('dashboard.menu.products', 'Products'), active: false },
                ].map((tab) => (
                  <div key={tab.label} className="flex flex-col items-center gap-0.5 flex-1">
                    <tab.Icon
                      size={10}
                      className={tab.active ? 'text-mintcom-green' : isDarkMode ? 'text-gray-500' : 'text-slate-400'}
                      strokeWidth={2.25}
                    />
                    <span
                      className={`text-[5px] font-bold transition-colors duration-300 ${
                        tab.active ? 'text-mintcom-green' : isDarkMode ? 'text-gray-500' : 'text-slate-400'
                      }`}
                    >
                      {tab.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Home indicator */}
              <div className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-[72px] h-[3px] rounded-full z-30 ${isDarkMode ? 'bg-white/30' : 'bg-black/20'}`} />
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

  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [direction, setDirection] = useState(0);

  const dashboards: ScopeDashboard[] = [
    {
      icon: Crown,
      title: t('landing.cloudControl.owner.title'),
      description: t('landing.cloudControl.owner.description'),
      scope: 'owner',
      scopeLabel: t('landing.cloudControl.scope.global', 'Global scope'),
      // Plain strings — t('…h1') hits parseMissingKeyHandler and shows "H1"
      highlights: isRtl
        ? [
            'اطلع على إيرادات كل علامة تجارية في مكان واحد',
            'تتبع حالة الفوترة عبر النشاط بالكامل',
            'انتقل من إجمالي المحفظة إلى أداء كل علامة',
          ]
        : [
            'See every brand’s revenue in one place',
            'Track billing status across the business',
            'Drill from portfolio totals to brand performance',
          ],
    },
    {
      icon: Tags,
      title: t('landing.cloudControl.brand.title'),
      description: t('landing.cloudControl.brand.description'),
      scope: 'brand',
      scopeLabel: t('landing.cloudControl.scope.brand', 'Brand scope'),
      highlights: isRtl
        ? [
            'إدارة كل المواقع تحت علامة تجارية واحدة',
            'تعيين أدوار تنتقل عبر المواقع',
            'تقارير ورؤى موحّدة على مستوى العلامة',
          ]
        : [
            'Manage all locations under one brand',
            'Assign roles that travel across sites',
            'Consolidated brand reporting & insights',
          ],
    },
    {
      icon: Building2,
      title: t('landing.cloudControl.location.title'),
      description: t('landing.cloudControl.location.description'),
      scope: 'location',
      scopeLabel: t('landing.cloudControl.scope.location', 'Location scope'),
      highlights: isRtl
        ? [
            'طلبات حية وإيرادات ومتوسط طلب لليوم',
            'الموظفون والمنتجات والمدفوعات لكل موقع',
            'واجهة تشغيل موحّدة لفريق الصالة',
          ]
        : [
            'Live orders, revenue & AOV for the day',
            'Staff, products & payments per site',
            'One streamlined ops view for the floor',
          ],
    },
  ];

  const handleOpen = useCallback((index: number) => {
    setDirection(0);
    setActiveCard(index);
  }, []);

  const handleClose = useCallback(() => setActiveCard(null), []);

  const handlePrev = useCallback(() => {
    setDirection(isRtl ? 1 : -1);
    setActiveCard((i) => {
      if (i === null) return 0;
      return (i - 1 + dashboards.length) % dashboards.length;
    });
  }, [dashboards.length, isRtl]);

  const handleNext = useCallback(() => {
    setDirection(isRtl ? -1 : 1);
    setActiveCard((i) => {
      if (i === null) return 0;
      return (i + 1) % dashboards.length;
    });
  }, [dashboards.length, isRtl]);

  const handleJumpTo = useCallback(
    (i: number) => {
      setDirection(() => {
        if (activeCard === null) return 0;
        return i > activeCard ? 1 : -1;
      });
      setActiveCard(i);
    },
    [activeCard],
  );

  useModalKeyboardGuard({
    isOpen: activeCard !== null,
    onClose: handleClose,
    onNext: handleNext,
    onPrev: handlePrev,
    isRtl,
    hideChatWidget: false,
  });

  return (
    <section
      id="cloud-control"
      className="py-16 lg:py-24 bg-gray-50 dark:bg-[#0f0f0f] relative overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-mintcom-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-mintcom-green/5 rounded-full blur-[100px] -z-10" />

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
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
              className="mb-8 inline-flex max-w-full items-center gap-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-mintcom-green shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:border-white/10 dark:shadow-none">
                <Cloud size={14} strokeWidth={2.4} className="text-black" />
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-black/15 dark:bg-white/20" />
              <span className="min-w-0 text-[13px] font-semibold leading-snug tracking-widest uppercase text-gray-900 dark:text-white/85 md:text-sm">
                {t('landing.cloudControl.badge')}
              </span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold font-magilio mb-6 leading-tight tracking-tight">
              <SplitText text={t('landing.cloudControl.title', 'In-Sync Cloud Control')} />
              <span className="block text-gray-900 dark:text-white mt-2">
                {t('landing.cloudControl.titleHighlight')}
              </span>
            </h2>
            <p className="max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl">
              {t('landing.cloudControl.subtitle')}
            </p>

            {/* Download CTA — compact, matching AdminControl style */}
            <AppDownloadBadgeGroup
              label={t("landing.admin.installApp")}
              hasIosDownload={hasOwnerIosDownload}
              hasAndroidDownload={hasOwnerAndroidDownload}
              iosAriaLabel={t("landing.admin.downloadOnAppStore")}
              androidAriaLabel={t("landing.admin.getItOnGooglePlay")}
              iosComingSoonLabel={t(
                "landing.cloudControl.scope.preview.ownerIosDownloadComingSoon",
                "Owner iOS app download coming soon",
              )}
              androidComingSoonLabel={t(
                "landing.cloudControl.scope.preview.ownerAndroidDownloadComingSoon",
                "Owner Android app download coming soon",
              )}
            />
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

        {/* Three scope cards — text first; click opens creative modal */}
        <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3 md:gap-6">
          {dashboards.map((d, i) => (
            <DashboardCard
              key={d.scope}
              dashboard={d}
              index={i}
              t={t}
              onOpen={handleOpen}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeCard !== null && (
          <ScopeDashboardModal
            dashboards={dashboards}
            activeIndex={activeCard}
            direction={direction}
            onClose={handleClose}
            onPrev={handlePrev}
            onNext={handleNext}
            onJumpTo={handleJumpTo}
            t={t}
            isRtl={isRtl}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

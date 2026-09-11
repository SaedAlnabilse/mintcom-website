import { AppDownloadBadgeGroup } from './landing/AppDownloadBadgeGroup';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Laptop,
  Bell,
  Menu,
  Search,
  AlertTriangle,
  Package,
  RotateCcw,
  Plus,
  LayoutGrid,
  Home,
  MapPin,
  Briefcase,
  KeyRound,
  AlertOctagon,
  TrendingUp,
  Coffee,
  Store,
  Users,
  ChevronRight,
  ChevronDown,
  Calendar,
  Clock,
  CreditCard,
  Activity,
  ShoppingBag,
  Smartphone,
  CornerUpLeft,
  ExternalLink,
  MoreHorizontal,
  Zap,
  Link2,
  SlidersHorizontal,
} from 'lucide-react';
import { OWNER_ANDROID_DOWNLOAD_URL, OWNER_IOS_DOWNLOAD_URL } from '../config/downloads';
import { useTheme } from '../context/ThemeContext';

/** Brand tokens mirrored from mintcom-admin-portal owner screens */
const G1 = '#7dc6a2';
const G2 = '#5aab85';
const G3 = '#3d8f6b';
const SHORTAGE = '#D55263';
const OVERAGE = '#F59E0B';
const WARNING = '#D0A62A';
const STOCK = '#4F46E5';

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

type MockTone = 'shortage' | 'overage' | 'critical' | 'stock' | 'refund';

type MockAlert = {
  id: string;
  title: string;
  description: string;
  pill: string;
  location: string;
  time: string;
  tone: MockTone;
  unread?: boolean;
};

const toneStyle = {
  shortage: { color: SHORTAGE, bg: '#D5526312', Icon: AlertTriangle },
  overage: { color: OVERAGE, bg: '#F59E0B12', Icon: Plus },
  critical: { color: SHORTAGE, bg: '#D5526312', Icon: AlertOctagon },
  stock: { color: STOCK, bg: '#4F46E512', Icon: Package },
  refund: { color: WARNING, bg: '#D0A62A12', Icon: RotateCcw },
} as const;

type OwnerNavKey = 'home' | 'locations' | 'brands' | 'account' | 'notifications';

/** Theme tokens aligned with mintcom-admin-portal useDarkMode / owner screens */
function useMockPalette() {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark';
  return {
    isDarkMode,
    // OwnerOverview uses #f8f9fa / #13111E
    BG: isDarkMode ? '#13111E' : '#f8f9fa',
    CARD: isDarkMode ? '#252836' : '#FFFFFF',
    BORDER: isDarkMode ? '#2D2B3A' : '#EEF1EF',
    TEXT: isDarkMode ? '#F8FAFC' : '#1F1D2B',
    TEXT_MAIN: isDarkMode ? '#F8FAFC' : '#1E293B',
    SUB: isDarkMode ? '#737182' : '#828287',
    SEARCH_BG: isDarkMode ? '#2D3039' : '#F1F5F9',
    TAB_BG: isDarkMode ? 'rgba(0,0,0,0.25)' : '#F1F5F9',
    FILTER_LABEL: isDarkMode ? '#7a9e93' : '#4d7c6e',
    MARK_READ: isDarkMode ? G1 : '#3d8f68',
    NAV_SHELL: isDarkMode ? '#13111E' : '#EFEFF4',
    NAV_BG: isDarkMode ? '#252836' : '#FFFFFF',
    NAV_IDLE: isDarkMode ? '#737182' : '#828287',
    HOME_PILL: isDarkMode ? 'rgba(255,255,255,0.88)' : 'rgba(15,23,42,0.88)',
    SURFACE: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    ICON_BG: isDarkMode ? '#163126' : '#E8F7F0',
    LIST_BORDER: isDarkMode ? '#2D2B3A' : '#E5E5E5',
  };
}

/** Shared green owner header */
const OwnerHeader = ({
  title,
  statusPad = 0,
  showBell = false,
  bellCount = 0,
  compact = false,
}: {
  title: string;
  statusPad?: number;
  showBell?: boolean;
  bellCount?: number;
  compact?: boolean;
}) => (
  <div className="flex-shrink-0" style={{ backgroundColor: G1, paddingTop: statusPad }}>
    <div className="flex items-center justify-between px-3 h-11">
      <div className="w-8 h-8 flex items-center justify-center">
        <Menu size={compact ? 14 : 16} className="text-white" strokeWidth={2.25} />
      </div>
      <span className="text-white font-bold text-[13px] tracking-tight flex-1 text-center px-2">
        {title}
      </span>
      <div className="w-8 h-8 flex items-center justify-center relative">
        {showBell ? (
          <>
            <Bell size={compact ? 14 : 16} className="text-white" strokeWidth={2.25} />
            {bellCount > 0 && (
              <span
                className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-[8px] font-black text-white border-[1.5px]"
                style={{ backgroundColor: SHORTAGE, borderColor: G1 }}
              >
                {bellCount}
              </span>
            )}
          </>
        ) : (
          <span className="w-4" />
        )}
      </div>
    </div>
  </div>
);

/**
 * Shared owner bottom navigation — mirrors BottomNav.tsx owner mode
 * (Home / Locations / Brands / Account with green active state).
 */
const OwnerBottomNav = ({
  active,
  compact = false,
}: {
  active: OwnerNavKey;
  compact?: boolean;
}) => {
  const { t } = useTranslation();
  const p = useMockPalette();
  const navItems = [
    { key: 'home' as const, icon: Home, label: t('landing.admin.mockup.navHome') },
    { key: 'locations' as const, icon: MapPin, label: t('landing.admin.mockup.navLocations') },
    { key: 'brands' as const, icon: Briefcase, label: t('landing.admin.mockup.navBrands') },
    { key: 'account' as const, icon: KeyRound, label: t('landing.admin.mockup.navAccount') },
  ];

  return (
    <div
      className="relative z-20 flex-shrink-0 pt-1.5 px-2"
      style={{ backgroundColor: p.NAV_SHELL }}
    >
      <div
        className="flex items-center justify-around rounded-2xl border px-0.5"
        style={{
          backgroundColor: p.NAV_BG,
          borderColor: p.BORDER,
          height: compact ? 48 : 52,
        }}
      >
        {navItems.map((item) => {
          const isActive = item.key === active;
          return (
            <div key={item.key} className="flex flex-1 flex-col items-center justify-center gap-0.5">
              <item.icon
                size={compact ? 14 : 15}
                style={{ color: isActive ? G1 : p.NAV_IDLE }}
                strokeWidth={isActive ? 2.4 : 2.1}
              />
              <span
                className="text-[7px] font-bold leading-none"
                style={{ color: isActive ? G1 : p.NAV_IDLE }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center pb-1.5 pt-1">
        <span
          className="h-[4px] w-[100px] rounded-full"
          style={{ backgroundColor: p.HOME_PILL }}
          aria-hidden
        />
      </div>
    </div>
  );
};

/**
 * Pixel-faithful recreation of AdminPortalAlertsView (owner scope)
 */
const NotificationsScreenMock = ({
  compact = false,
  activeTab = 'all',
  statusPad = 0,
}: {
  compact?: boolean;
  activeTab?: 'all' | 'cash' | 'stock' | 'refunds';
  statusPad?: number;
}) => {
  const { t } = useTranslation();
  const p = useMockPalette();

  const alerts: MockAlert[] = [
    {
      id: '1',
      title: t('landing.admin.mockup.shortageSara'),
      description: t('landing.admin.mockup.shortageDesc'),
      pill: t('landing.admin.mockup.shortagePill'),
      location: t('landing.admin.mockup.downtownCafe'),
      time: t('landing.admin.mockup.time12m'),
      tone: 'shortage',
      unread: true,
    },
    {
      id: '2',
      title: t('landing.admin.mockup.criticalStock'),
      description: t('landing.admin.mockup.criticalStockDesc'),
      pill: t('landing.admin.mockup.criticalStockPill'),
      location: t('landing.admin.mockup.downtownCafe'),
      time: t('landing.admin.mockup.time1h'),
      tone: 'critical',
      unread: true,
    },
    {
      id: '3',
      title: t('landing.admin.mockup.refundTitle'),
      description: t('landing.admin.mockup.refundDesc'),
      pill: t('landing.admin.mockup.refundPill'),
      location: t('landing.admin.mockup.mallBranch'),
      time: t('landing.admin.mockup.time2h'),
      tone: 'refund',
      unread: true,
    },
    {
      id: '4',
      title: t('landing.admin.mockup.lowStock'),
      description: t('landing.admin.mockup.lowStockDesc'),
      pill: t('landing.admin.mockup.lowStockPill'),
      location: t('landing.admin.mockup.downtownCafe'),
      time: t('landing.admin.mockup.time3h'),
      tone: 'stock',
      unread: false,
    },
    {
      id: '5',
      title: t('landing.admin.mockup.overageTitle'),
      description: t('landing.admin.mockup.overageDesc'),
      pill: t('landing.admin.mockup.overagePill'),
      location: t('landing.admin.mockup.mallBranch'),
      time: t('landing.admin.mockup.time4h'),
      tone: 'overage',
      unread: false,
    },
    {
      id: '6',
      title: t('landing.admin.mockup.overageNoor', 'Overage - Noor'),
      description: t('landing.admin.mockup.overageNoorDesc', 'Expected JOD 150.00 - Counted JOD 153.00'),
      pill: t('landing.admin.mockup.overageNoorPill', '+JOD 3.00'),
      location: t('landing.admin.mockup.airportBranch', 'Airport Branch'),
      time: t('landing.admin.mockup.time5h', '5h ago'),
      tone: 'overage',
      unread: false,
    },
    {
      id: '7',
      title: t('landing.admin.mockup.lowStockEspresso', 'Low stock'),
      description: t('landing.admin.mockup.lowStockEspressoDesc', 'Espresso beans have 2 kg remaining'),
      pill: t('landing.admin.mockup.lowStockEspressoPill', '2 kg left'),
      location: t('landing.admin.mockup.airportBranch', 'Airport Branch'),
      time: t('landing.admin.mockup.time6h', '6h ago'),
      tone: 'stock',
      unread: false,
    },
    {
      id: '8',
      title: t('landing.admin.mockup.lowStockChocolate', 'Low stock'),
      description: t('landing.admin.mockup.lowStockChocolateDesc', 'Chocolate syrup has 1 L remaining'),
      pill: t('landing.admin.mockup.lowStockChocolatePill', '1 L left'),
      location: t('landing.admin.mockup.downtownCafe'),
      time: t('landing.admin.mockup.time7h', '7h ago'),
      tone: 'stock',
      unread: false,
    },
  ];

  const visibleAlerts =
    activeTab === 'all'
      ? alerts
      : activeTab === 'cash'
        ? alerts.filter((a) => a.tone === 'shortage' || a.tone === 'overage')
        : activeTab === 'stock'
          ? alerts.filter((a) => a.tone === 'critical' || a.tone === 'stock')
          : alerts.filter((a) => a.tone === 'refund');

  const displayAlerts = compact ? visibleAlerts.slice(0, 3) : visibleAlerts.slice(0, 4);

  const tabs: { id: typeof activeTab; label: string; count: number }[] = [
    { id: 'all', label: t('landing.admin.mockup.tabAll'), count: 8 },
    { id: 'cash', label: t('landing.admin.mockup.tabCash'), count: 3 },
    { id: 'stock', label: t('landing.admin.mockup.tabStock'), count: 4 },
    { id: 'refunds', label: t('landing.admin.mockup.tabRefunds'), count: 1 },
  ];

  const stats = [
    { value: '1', label: t('landing.admin.mockup.shortages') },
    { value: '2', label: t('landing.admin.mockup.overages') },
    { value: '4', label: t('landing.admin.mockup.stockStat') },
    { value: '1', label: t('landing.admin.mockup.updates') },
  ];

  return (
    <div
      className="w-full h-full flex flex-col relative z-10 transition-colors duration-300"
      style={{ backgroundColor: p.BG }}
    >
      <OwnerHeader
        title={t('landing.admin.mockup.notificationsTitle')}
        statusPad={statusPad}
        showBell
        bellCount={7}
        compact={compact}
      />

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="px-3 pt-2 mb-2">
          <div
            className="flex items-stretch rounded-xl border px-1 py-2.5"
            style={{ backgroundColor: p.CARD, borderColor: p.BORDER }}
          >
            {stats.map((s, i) => (
              <div key={s.label} className="flex flex-1 items-center">
                {i > 0 && (
                  <div className="w-px h-7 self-center opacity-80" style={{ backgroundColor: p.BORDER }} />
                )}
                <div className="flex-1 flex flex-col items-center justify-center px-0.5">
                  <span className="font-black text-[15px] leading-none tracking-tight" style={{ color: p.TEXT }}>
                    {s.value}
                  </span>
                  <span
                    className="text-[7px] font-extrabold uppercase tracking-wider mt-1 leading-none text-center"
                    style={{ color: p.SUB }}
                  >
                    {s.label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-3 flex flex-col gap-1.5 flex-1 min-h-0">
          <div
            className="flex items-center gap-2 rounded-xl px-2.5 py-2 border"
            style={{ backgroundColor: p.SEARCH_BG, borderColor: p.BORDER }}
          >
            <Search size={12} style={{ color: p.SUB }} />
            <span className="text-[10px] font-semibold" style={{ color: p.SUB }}>
              {t('landing.admin.mockup.searchPlaceholder')}
            </span>
          </div>

          <div className="flex rounded-xl p-0.5" style={{ backgroundColor: p.TAB_BG }}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <div key={tab.id} className="flex-1 py-1.5 rounded-lg flex items-center justify-center">
                  <span
                    className={`text-[8px] leading-none whitespace-nowrap ${isActive ? 'font-black' : 'font-bold'}`}
                    style={{ color: isActive ? p.MARK_READ : p.SUB }}
                  >
                    {tab.label} {tab.count}
                  </span>
                </div>
              );
            })}
          </div>

          {!compact && (
            <>
              <span
                className="text-[8px] font-black uppercase tracking-widest mt-0.5"
                style={{ color: p.FILTER_LABEL }}
              >
                {t('landing.admin.mockup.filterByLocation')}
              </span>
              <div
                className="flex items-center justify-between rounded-xl px-2 py-1.5 border-[1.5px]"
                style={{ backgroundColor: G1, borderColor: G1 }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  >
                    <LayoutGrid size={12} className="text-white" />
                  </div>
                  <span className="text-[11px] font-black text-white">
                    {t('landing.admin.mockup.allLocations')}
                  </span>
                </div>
                <span
                  className="min-w-[20px] h-5 px-1.5 rounded-xl flex items-center justify-center text-[9px] font-black text-white"
                  style={{ backgroundColor: '#D0C962' }}
                >
                  7
                </span>
              </div>
            </>
          )}

          <div className="flex justify-end">
            <span className="text-[9px] font-black" style={{ color: p.MARK_READ }}>
              {t('landing.admin.mockup.markAllRead')}
            </span>
          </div>

          <div className="flex items-center gap-2 px-0.5 mb-0.5">
            <span className="text-[8px] font-black uppercase tracking-[0.12em]" style={{ color: p.SUB }}>
              {t('landing.admin.mockup.today')}
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: p.BORDER }} />
            <span className="text-[8px] font-bold" style={{ color: p.SUB }}>
              {displayAlerts.length} {t('landing.admin.mockup.alertsLabel')}
            </span>
          </div>

          <div
            className="rounded-xl border overflow-hidden flex-1 min-h-0"
            style={{ backgroundColor: p.CARD, borderColor: p.BORDER }}
          >
            {displayAlerts.map((alert, index) => {
              const tone = toneStyle[alert.tone];
              const Icon = tone.Icon;
              const isLast = index === displayAlerts.length - 1;
              return (
                <div
                  key={alert.id}
                  className="relative flex gap-2.5 px-2.5 py-2.5"
                  style={{ borderBottom: isLast ? 'none' : `1px solid ${p.BORDER}` }}
                >
                  {alert.unread && (
                    <div
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r"
                      style={{ backgroundColor: tone.color }}
                    />
                  )}
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: tone.bg }}
                  >
                    <Icon size={14} style={{ color: tone.color }} strokeWidth={2.25} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1.5 mb-0.5">
                      <span className="text-[10px] font-black leading-tight truncate" style={{ color: p.TEXT }}>
                        {alert.title}
                      </span>
                      <span className="text-[8px] font-bold flex-shrink-0 mt-0.5" style={{ color: p.SUB }}>
                        {alert.time}
                      </span>
                    </div>
                    <p className="text-[9px] font-semibold leading-snug mb-1.5 line-clamp-2" style={{ color: p.SUB }}>
                      {alert.description}
                    </p>
                    <div className="flex items-center justify-between gap-1.5">
                      <span
                        className="text-[8px] font-black px-1.5 py-0.5 rounded-full"
                        style={{ backgroundColor: tone.bg, color: tone.color }}
                      >
                        {alert.pill}
                      </span>
                      <span className="text-[8px] font-bold truncate" style={{ color: p.FILTER_LABEL }}>
                        {alert.location}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <OwnerBottomNav active="home" compact={compact} />
    </div>
  );
};

/**
 * Owner Overview — structure/layout mirrored from OwnerOverviewScreen.tsx
 * (hero pills → period/time filter → master total sales → metric grid → quick management)
 */
const OverviewScreenMock = ({ statusPad = 0, compact = false }: { statusPad?: number; compact?: boolean }) => {
  const { t } = useTranslation();
  const p = useMockPalette();

  const heroPills = [
    { value: '3', label: t('landing.admin.mockup.navLocations'), icon: MapPin, color: G1 },
    {
      value: '2',
      label: t('landing.admin.mockup.navBrands'),
      icon: Briefcase,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.12)',
    },
    {
      value: '12',
      label: t('landing.admin.mockup.staff'),
      icon: Users,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.12)',
    },
  ];

  const metrics = [
    {
      label: t('landing.admin.mockup.totalProfit', 'Total Profit'),
      value: '1,840',
      currency: 'JOD',
      icon: TrendingUp,
      color: G1,
      bg: 'rgba(125,198,162,0.12)',
    },
    {
      label: t('landing.admin.mockup.orders'),
      value: '148',
      icon: ShoppingBag,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.12)',
    },
    {
      label: t('landing.admin.mockup.refundsLabel', 'Refunds'),
      value: '48',
      currency: 'JOD',
      icon: CornerUpLeft,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.12)',
    },
    {
      label: t('landing.admin.mockup.avgOrder', 'Avg. Order'),
      value: '16.55',
      currency: 'JOD',
      icon: Activity,
      color: '#8B5CF6',
      bg: 'rgba(139,92,246,0.12)',
    },
  ];

  return (
    <div className="w-full h-full flex flex-col relative z-10" style={{ backgroundColor: p.BG }}>
      <OwnerHeader
        title={t('landing.admin.mockup.screenOverview', 'Overview')}
        statusPad={statusPad}
        showBell
        bellCount={7}
        compact={compact}
      />

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-2.5 pt-2 gap-1.5">
        {/* OwnerScreenHero — unified stats pills (Locations / Brands / Staff) */}
        <div
          className="flex-shrink-0 flex items-stretch rounded-2xl border px-1 py-2"
          style={{ backgroundColor: p.CARD, borderColor: p.BORDER }}
        >
          {heroPills.map((pill, i) => (
            <div key={pill.label} className="flex flex-1 items-center">
              {i > 0 && (
                <div className="w-px h-8 self-center" style={{ backgroundColor: p.BORDER }} />
              )}
              <div className="flex-1 flex flex-col items-center gap-1 px-0.5">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: pill.bg || 'rgba(125,198,162,0.12)' }}
                >
                  <pill.icon size={12} style={{ color: pill.color }} strokeWidth={2.3} />
                </div>
                <span className="font-black text-[13px] leading-none" style={{ color: p.TEXT }}>
                  {pill.value}
                </span>
                <span
                  className="text-[6.5px] font-extrabold uppercase tracking-wide leading-none text-center"
                  style={{ color: p.SUB }}
                >
                  {pill.label}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/*
          Filter panel — exact OwnerOverviewScreen structure (period + time rows),
          scaled to fit the phone mock without clipping.
        */}
        <div
          className="relative z-10 flex-shrink-0 rounded-[14px] border overflow-hidden"
          style={{
            backgroundColor: p.CARD,
            borderColor: p.BORDER,
            boxShadow: p.isDarkMode
              ? '0 6px 16px -10px rgba(0,0,0,0.5)'
              : '0 6px 14px -10px rgba(15,23,42,0.1)',
          }}
        >
          {/* Period row */}
          <div className="flex items-center gap-2 px-2.5 py-[9px]">
            <div
              className="w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(125,198,162,0.12)' }}
            >
              <Calendar size={13} style={{ color: G1 }} strokeWidth={2.25} />
            </div>
            <span
              className="text-[9px] font-semibold leading-none min-w-0 truncate"
              style={{ color: p.SUB }}
            >
              {t('landing.admin.mockup.selectPeriod', 'Select Period')}
            </span>
            <span className="flex-1" />
            <span className="text-[10px] font-black leading-none flex-shrink-0" style={{ color: G1 }}>
              {t('landing.admin.mockup.today')}
            </span>
            <ChevronDown
              size={13}
              className="flex-shrink-0"
              style={{ color: p.isDarkMode ? '#4A4856' : '#CBD5E1' }}
              strokeWidth={2.25}
            />
          </div>

          <div className="h-px mx-2.5" style={{ backgroundColor: p.BORDER }} />

          {/* Time range row */}
          <div className="flex items-center gap-2 px-2.5 py-[9px]">
            <div
              className="w-7 h-7 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: 'rgba(125,198,162,0.12)' }}
            >
              <Clock size={13} style={{ color: G1 }} strokeWidth={2.25} />
            </div>
            <span
              className="text-[9px] font-semibold leading-none min-w-0 truncate"
              style={{ color: p.SUB }}
            >
              {t('landing.admin.mockup.selectTimeRange', 'Select Time Range')}
            </span>
            <span className="flex-1" />
            <span
              className="text-[10px] font-black leading-none flex-shrink-0"
              style={{ color: p.TEXT }}
            >
              {t('landing.admin.mockup.allDay', 'All day')}
            </span>
            <ChevronDown
              size={13}
              className="flex-shrink-0"
              style={{ color: p.isDarkMode ? '#4A4856' : '#CBD5E1' }}
              strokeWidth={2.25}
            />
          </div>
        </div>

        {/* MASTER NET SALES CARD — green feature card from OwnerOverviewScreen */}
        <div
          className="flex-shrink-0 rounded-[14px] p-2.5 relative overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${G1} 0%, ${G2} 50%, ${G3} 100%)`,
          }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <CreditCard size={14} className="text-white" strokeWidth={2.2} />
            </div>
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-70" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              <span className="text-[7px] font-black text-white tracking-wide">
                {t('landing.admin.mockup.live', 'LIVE')}
              </span>
            </div>
          </div>
          <p className="text-[7px] font-extrabold tracking-[0.12em] text-white/85 uppercase mb-0.5">
            {t('landing.admin.mockup.totalSales', 'Total Sales')}
          </p>
          <p className="text-[20px] font-black text-white leading-none tracking-tight">
            2,450 <span className="text-[12px] font-bold text-white/80">JOD</span>
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <Activity size={9} className="text-white" />
            <span className="text-[6.5px] font-bold text-white/90 tracking-wide uppercase">
              {t('landing.admin.mockup.includesTax', 'Includes tax and other charges')}
            </span>
          </div>
        </div>

        {/* Metric grid — Total Profit / Orders / Refunds / Avg Order */}
        <div className="grid grid-cols-2 gap-1.5 flex-shrink-0">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-[12px] border px-2 py-1.5"
              style={{ backgroundColor: p.CARD, borderColor: p.BORDER }}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center mb-1"
                style={{ backgroundColor: m.bg }}
              >
                <m.icon size={11} style={{ color: m.color }} strokeWidth={2.3} />
              </div>
              <div className="text-[10px] font-black leading-none tracking-tight" style={{ color: p.TEXT }}>
                {m.value}
                {m.currency ? (
                  <span className="text-[7px] font-bold ml-0.5" style={{ color: p.SUB }}>
                    {m.currency}
                  </span>
                ) : null}
              </div>
              <div className="text-[6.5px] font-bold mt-0.5 truncate" style={{ color: p.SUB }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick management row — peeks if space allows */}
        {!compact && (
          <div
            className="rounded-[12px] border px-2 py-1.5 flex items-center gap-2 flex-shrink-0 min-h-0"
            style={{
              backgroundColor: p.isDarkMode ? '#252836' : '#FAFAFA',
              borderColor: p.isDarkMode ? '#2D2B3A' : '#EBEBEB',
            }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#EEF2FF' }}
            >
              <Users size={12} style={{ color: '#4F46E5' }} strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[8px] font-black truncate" style={{ color: p.TEXT_MAIN }}>
                {t('landing.admin.mockup.staffManagement', 'Staff Management')}
              </p>
              <p className="text-[7px] font-semibold" style={{ color: p.SUB }}>
                12 {t('landing.admin.mockup.staff')}
              </p>
            </div>
            <ChevronRight size={12} style={{ color: p.isDarkMode ? '#4A4856' : '#D1D5DB' }} />
          </div>
        )}
      </div>

      <OwnerBottomNav active="home" compact={compact} />
    </div>
  );
};

/**
 * Locations — structure mirrored from EstablishmentsScreen.tsx
 * (hero pills → search + more → status/type filters → list card rows)
 */
const LocationsScreenMock = ({ statusPad = 0, compact = false }: { statusPad?: number; compact?: boolean }) => {
  const { t } = useTranslation();
  const p = useMockPalette();

  const locations = [
    {
      name: t('landing.admin.mockup.downtownCafe'),
      type: t('landing.admin.mockup.typeCafe', 'Café'),
      currency: 'JOD',
      active: true,
      icon: Coffee,
    },
    {
      name: t('landing.admin.mockup.mallBranch'),
      type: t('landing.admin.mockup.typeRestaurant', 'Restaurant'),
      currency: 'JOD',
      active: true,
      icon: Store,
    },
    {
      name: t('landing.admin.mockup.airportBranch', 'Airport Branch'),
      type: t('landing.admin.mockup.typeCafe', 'Café'),
      currency: 'JOD',
      active: true,
      icon: Coffee,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col relative z-10" style={{ backgroundColor: p.BG }}>
      <OwnerHeader
        title={t('landing.admin.mockup.navLocations')}
        statusPad={statusPad}
        showBell
        bellCount={7}
        compact={compact}
      />

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-2.5 pt-2 gap-2">
        {/* OwnerScreenHero pills: Locations + Active */}
        <div
          className="flex items-stretch rounded-2xl border px-1 py-2.5"
          style={{ backgroundColor: p.CARD, borderColor: p.BORDER }}
        >
          {[
            {
              v: '3',
              l: t('landing.admin.mockup.navLocations'),
              icon: MapPin,
              color: G1,
              bg: 'rgba(125,198,162,0.12)',
            },
            {
              v: '3',
              l: t('landing.admin.mockup.statusActive', 'Active'),
              icon: Zap,
              color: G1,
              bg: 'rgba(125,198,162,0.12)',
            },
          ].map((s, i) => (
            <div key={s.l} className="flex flex-1 items-center">
              {i > 0 && <div className="w-px h-8 self-center" style={{ backgroundColor: p.BORDER }} />}
              <div className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: s.bg }}
                >
                  <s.icon size={12} style={{ color: s.color }} strokeWidth={2.3} />
                </div>
                <span className="font-black text-[13px] leading-none" style={{ color: p.TEXT }}>
                  {s.v}
                </span>
                <span className="text-[6.5px] font-extrabold uppercase tracking-wide" style={{ color: p.SUB }}>
                  {s.l}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Search row + more button (EstablishmentsScreen) */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex-1 flex items-center gap-2 rounded-xl px-2.5 py-2 border"
            style={{ backgroundColor: p.CARD, borderColor: p.LIST_BORDER }}
          >
            <Search size={12} style={{ color: p.SUB }} />
            <span className="text-[10px] font-semibold" style={{ color: p.SUB }}>
              {t('landing.admin.mockup.searchLocationsCount', 'Search 3 locations...')}
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: p.CARD, borderColor: p.LIST_BORDER }}
          >
            <MoreHorizontal size={16} style={{ color: G1 }} strokeWidth={2.2} />
          </div>
        </div>

        {/* ScreenFilterBar — Status + Type */}
        <div className="flex gap-1.5">
          {[
            {
              icon: SlidersHorizontal,
              label: t('landing.admin.mockup.filterStatus', 'Status'),
            },
            {
              icon: Briefcase,
              label: t('landing.admin.mockup.filterType', 'Type'),
            },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-1 rounded-full border px-2.5 py-1.5"
              style={{ backgroundColor: p.CARD, borderColor: p.LIST_BORDER }}
            >
              <f.icon size={10} style={{ color: G1 }} strokeWidth={2.2} />
              <span className="text-[8px] font-bold" style={{ color: p.TEXT }}>
                {f.label}
              </span>
              <ChevronDown size={10} style={{ color: p.SUB }} />
            </div>
          ))}
        </div>

        {/* Single list card with divider rows (EstablishmentRow) */}
        <div
          className="rounded-2xl border overflow-hidden flex-1 min-h-0"
          style={{ backgroundColor: p.CARD, borderColor: p.LIST_BORDER }}
        >
          {locations.map((loc, index) => (
            <div
              key={loc.name}
              className="flex items-center gap-2.5 px-2.5 py-2.5"
              style={{
                borderBottom:
                  index < locations.length - 1 ? `1px solid ${p.LIST_BORDER}` : 'none',
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: p.ICON_BG }}
              >
                <loc.icon size={15} style={{ color: '#1D7A52' }} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black truncate" style={{ color: p.TEXT }}>
                  {loc.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[8px] font-semibold" style={{ color: p.SUB }}>
                    {loc.type}
                  </span>
                  <span
                    className="text-[7px] font-black px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: p.isDarkMode ? '#29313B' : '#F1F0F0',
                      color: p.isDarkMode ? '#D0D7DE' : '#666666',
                    }}
                  >
                    {loc.currency}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: loc.active ? '#3A9E72' : '#DDDDDD' }}
                />
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: p.SURFACE }}
                >
                  <ExternalLink size={12} style={{ color: G1 }} strokeWidth={2.2} />
                </div>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: p.SURFACE }}
                >
                  <MoreHorizontal size={12} style={{ color: p.SUB }} strokeWidth={2.2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <OwnerBottomNav active="locations" compact={compact} />
    </div>
  );
};

/**
 * Brands — structure mirrored from BrandsScreen.tsx
 * (hero pills → search + more → sort filter → brand list rows)
 */
const BrandsScreenMock = ({ statusPad = 0, compact = false }: { statusPad?: number; compact?: boolean }) => {
  const { t } = useTranslation();
  const p = useMockPalette();

  const brands = [
    {
      name: t('landing.admin.mockup.brandMintCafe', 'Mint Café Group'),
      locations: 2,
    },
    {
      name: t('landing.admin.mockup.brandAirportEats', 'Airport Eats'),
      locations: 1,
    },
  ];

  return (
    <div className="w-full h-full flex flex-col relative z-10" style={{ backgroundColor: p.BG }}>
      <OwnerHeader
        title={t('landing.admin.mockup.navBrands')}
        statusPad={statusPad}
        showBell
        bellCount={7}
        compact={compact}
      />

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col px-2.5 pt-2 gap-2">
        {/* Hero: Brands + linked Locations */}
        <div
          className="flex items-stretch rounded-2xl border px-1 py-2.5"
          style={{ backgroundColor: p.CARD, borderColor: p.BORDER }}
        >
          {[
            {
              v: '2',
              l: t('landing.admin.mockup.navBrands'),
              icon: Briefcase,
              color: G1,
              bg: 'rgba(125,198,162,0.12)',
            },
            {
              v: '3',
              l: t('landing.admin.mockup.navLocations'),
              icon: Link2,
              color: '#8B5CF6',
              bg: 'rgba(139,92,246,0.12)',
            },
          ].map((s, i) => (
            <div key={s.l} className="flex flex-1 items-center">
              {i > 0 && <div className="w-px h-8 self-center" style={{ backgroundColor: p.BORDER }} />}
              <div className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: s.bg }}
                >
                  <s.icon size={12} style={{ color: s.color }} strokeWidth={2.3} />
                </div>
                <span className="font-black text-[13px] leading-none" style={{ color: p.TEXT }}>
                  {s.v}
                </span>
                <span className="text-[6.5px] font-extrabold uppercase tracking-wide" style={{ color: p.SUB }}>
                  {s.l}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <div
            className="flex-1 flex items-center gap-2 rounded-xl px-2.5 py-2 border"
            style={{ backgroundColor: p.CARD, borderColor: p.LIST_BORDER }}
          >
            <Search size={12} style={{ color: p.SUB }} />
            <span className="text-[10px] font-semibold" style={{ color: p.SUB }}>
              {t('landing.admin.mockup.searchBrands', 'Search brands')}
            </span>
          </div>
          <div
            className="w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: p.CARD, borderColor: p.LIST_BORDER }}
          >
            <MoreHorizontal size={16} style={{ color: G1 }} strokeWidth={2.2} />
          </div>
        </div>

        <div className="flex gap-1.5">
          <div
            className="flex items-center gap-1 rounded-full border px-2.5 py-1.5"
            style={{ backgroundColor: p.CARD, borderColor: p.LIST_BORDER }}
          >
            <Activity size={10} style={{ color: G1 }} strokeWidth={2.2} />
            <span className="text-[8px] font-bold" style={{ color: p.TEXT }}>
              {t('landing.admin.mockup.sortBy', 'Sort')}
            </span>
            <ChevronDown size={10} style={{ color: p.SUB }} />
          </div>
        </div>

        {/* Brand list card — briefcase avatar + locations_count + RowActionButtons */}
        <div
          className="rounded-2xl border overflow-hidden flex-1 min-h-0"
          style={{ backgroundColor: p.CARD, borderColor: p.LIST_BORDER }}
        >
          {brands.map((b, index) => (
            <div
              key={b.name}
              className="flex items-center gap-2.5 px-2.5 py-3"
              style={{
                borderBottom: index < brands.length - 1 ? `1px solid ${p.LIST_BORDER}` : 'none',
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: p.isDarkMode ? p.SURFACE : 'rgba(125,198,162,0.08)',
                }}
              >
                <Briefcase size={16} style={{ color: G1 }} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black truncate" style={{ color: p.TEXT }}>
                  {b.name}
                </p>
                <p className="text-[8px] font-semibold mt-0.5" style={{ color: p.SUB }}>
                  {t('landing.admin.mockup.locationsCount', {
                    count: b.locations,
                    defaultValue: `${b.locations} locations`,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: p.SURFACE }}
                >
                  <ExternalLink size={12} style={{ color: G1 }} strokeWidth={2.2} />
                </div>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: p.SURFACE }}
                >
                  <MoreHorizontal size={12} style={{ color: p.SUB }} strokeWidth={2.2} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <OwnerBottomNav active="brands" compact={compact} />
    </div>
  );
};

/**
 * Premium iPhone chassis
 */
const IPhoneFrame = ({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div className={className} style={style}>
    <div
      className="relative w-full h-full rounded-[44px] p-[2px]"
      style={{
        background:
          'linear-gradient(145deg, #6b6b70 0%, #2a2a2e 18%, #8e8e93 38%, #1c1c1e 55%, #5a5a5f 78%, #3a3a3c 100%)',
        boxShadow:
          '0 30px 60px -12px rgba(0,0,0,0.65), 0 12px 24px -8px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.22)',
      }}
    >
      <div
        className="relative w-full h-full rounded-[42px] p-[10px] overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1a1a1c 0%, #0a0a0b 50%, #111113 100%)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="absolute -left-[3px] top-[18%] w-[3px] h-[22px] rounded-l-sm z-40"
          style={{ background: 'linear-gradient(90deg, #4a4a4e, #2c2c2e)' }}
        />
        <div
          className="absolute -left-[3px] top-[26%] w-[3px] h-[36px] rounded-l-sm z-40"
          style={{ background: 'linear-gradient(90deg, #4a4a4e, #2c2c2e)' }}
        />
        <div
          className="absolute -left-[3px] top-[36%] w-[3px] h-[36px] rounded-l-sm z-40"
          style={{ background: 'linear-gradient(90deg, #4a4a4e, #2c2c2e)' }}
        />
        <div
          className="absolute -right-[3px] top-[28%] w-[3px] h-[56px] rounded-r-sm z-40"
          style={{ background: 'linear-gradient(270deg, #4a4a4e, #2c2c2e)' }}
        />

        <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-white dark:bg-[#1f1d2b]">
          <div className="absolute inset-0 flex flex-col overflow-hidden">
            <div className="absolute top-0 inset-x-0 z-30 flex h-[28px] items-end justify-between px-5 pb-0.5 pointer-events-none">
              <span className="text-[10px] font-semibold tracking-tight text-white">9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex items-end gap-[1.5px] h-2.5">
                  {[3, 5, 7, 9].map((h) => (
                    <div key={h} className="w-[2.5px] rounded-[0.5px] bg-white" style={{ height: h }} />
                  ))}
                </div>
                <svg width="14" height="10" viewBox="0 0 14 10" className="ml-0.5">
                  <path
                    d="M1 6.5c1.8-2 4.2-3 6.5-3s4.7 1 6.5 3"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M3.2 8c1.2-1.2 2.6-1.8 4.3-1.8S10.6 6.8 11.8 8"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                  <circle cx="7.5" cy="9" r="0.9" fill="white" />
                </svg>
                <div className="ml-0.5 w-[18px] h-[9px] rounded-[2.5px] border border-white relative">
                  <div className="absolute inset-[1.5px] right-[3px] rounded-[1px] bg-white" />
                  <div className="absolute -right-[2.5px] top-1/2 -translate-y-1/2 w-[1.5px] h-[4px] rounded-r-sm bg-white/70" />
                </div>
              </div>
            </div>

            <div
              className="absolute left-1/2 top-[7px] -translate-x-1/2 h-[22px] w-[90px] rounded-full flex items-center justify-end pr-2.5 z-40 pointer-events-none"
              style={{ background: '#000' }}
            >
              <div
                className="w-[10px] h-[10px] rounded-full relative"
                style={{
                  background: 'radial-gradient(circle at 35% 35%, #1a2744 0%, #0a0f1a 55%, #000 100%)',
                }}
              >
                <div className="absolute top-[2px] left-[2px] w-[2.5px] h-[2.5px] rounded-full bg-white/25" />
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
);



/* ─── Screen showcase config ─── */

type ScreenId = 'overview' | 'locations' | 'brands' | 'notifications';

const SCREENS: { id: ScreenId; labelKey: string; labelFallback: string }[] = [
  { id: 'overview', labelKey: 'landing.admin.mockup.screenOverview', labelFallback: 'Overview' },
  { id: 'locations', labelKey: 'landing.admin.mockup.screenLocations', labelFallback: 'Locations' },
  { id: 'brands', labelKey: 'landing.admin.mockup.screenBrands', labelFallback: 'Brands' },
  { id: 'notifications', labelKey: 'landing.admin.mockup.screenAlerts', labelFallback: 'Alerts' },
];

function renderOwnerScreen(id: ScreenId) {
  const statusPad = 28;
  switch (id) {
    case 'overview':
      return <OverviewScreenMock statusPad={statusPad} />;
    case 'locations':
      return <LocationsScreenMock statusPad={statusPad} />;
    case 'brands':
      return <BrandsScreenMock statusPad={statusPad} />;
    case 'notifications':
    default:
      return (
        <NotificationsScreenMock
          activeTab="all"
          statusPad={statusPad}
        />
      );
  }
}

export const AdminControl = () => {
  const { t } = useTranslation();
  const hasOwnerAndroidDownload = Boolean(OWNER_ANDROID_DOWNLOAD_URL);
  const hasOwnerIosDownload = Boolean(OWNER_IOS_DOWNLOAD_URL);

  const [hasStarted, setHasStarted] = useState(false);
  const [screenIndex, setScreenIndex] = useState(0);
  const startedRef = useRef(false);
  const userPausedRef = useRef(false);

  const advance = useCallback(() => {
    if (userPausedRef.current) return;
    setScreenIndex((i) => (i + 1) % SCREENS.length);
  }, []);

  // Autoplay is independent of scroll direction — starts once when section is first seen
  useEffect(() => {
    if (!hasStarted) return;
    const interval = setInterval(advance, 6000);
    return () => clearInterval(interval);
  }, [hasStarted, advance]);

  const currentScreen = SCREENS[screenIndex];

  const phoneShellClass =
    'w-[230px] h-[470px] sm:w-[290px] sm:h-[590px] lg:w-[310px] lg:h-[640px]';

  return (
    <section
      id="admin"
      className="py-16 lg:py-20 bg-white dark:bg-[#0f0f0f] overflow-x-clip relative"
      dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-16">
          {/* Phones showcase — animation is timer-based, not scroll-linked */}
          <div
            className="w-full lg:w-1/2 relative flex flex-col items-center select-none"
            onMouseEnter={() => {
              userPausedRef.current = true;
            }}
            onMouseLeave={() => {
              userPausedRef.current = false;
            }}
          >
            {/* Kick off autoplay once when phones enter the viewport; never resets on scroll-up */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              onViewportEnter={() => {
                if (!startedRef.current) {
                  startedRef.current = true;
                  setHasStarted(true);
                }
              }}
              viewport={{ once: true, amount: 0.25 }}
            />

            {/* Phone stage — fixed height */}
            <div className="relative w-full flex justify-center items-start h-[440px] sm:h-[560px] lg:h-[620px]">
              {/* Soft orbital ring */}
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] lg:w-[500px] lg:h-[500px] border border-mintcom-green/20 rounded-full -z-10"
                animate={{ rotate: 360 }}
                transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] lg:w-[360px] lg:h-[360px] border border-mintcom-green/10 rounded-full -z-10"
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />

              {/* Single phone */}
              <div
                className={`relative z-20 ${phoneShellClass}`}
                style={{ perspective: 1400 }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentScreen.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0, x: t('common.locale') === 'ar' ? 30 : -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: t('common.locale') === 'ar' ? -30 : 30 }}
                    transition={{
                      duration: 0.5,
                      ease: 'easeInOut',
                    }}
                  >
                    <IPhoneFrame className="w-full h-full">
                      {renderOwnerScreen(currentScreen.id)}
                    </IPhoneFrame>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>


          </div>

          {/* Right Side: Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-1/2"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-8 inline-flex max-w-full items-center gap-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-mintcom-green shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:border-white/10 dark:shadow-none">
                <Smartphone size={14} strokeWidth={2.4} className="text-black" />
              </span>
              <span aria-hidden="true" className="h-4 w-px bg-black/15 dark:bg-white/20" />
              <span className="min-w-0 text-[13px] font-semibold leading-snug tracking-widest uppercase text-gray-900 dark:text-white/85 md:text-sm">
                {t('landing.admin.badge')}
              </span>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold font-magilio mb-6 leading-tight tracking-tight">
              <span className="block leading-[1.1] rtl:leading-[1.2]">
                <SplitText text={t('landing.admin.title1')} />
              </span>
              <span className="block leading-[1.1] rtl:leading-[1.2]">
                <SplitText text={t('landing.admin.title2')} />
              </span>
              <span className="block leading-[1.1] rtl:leading-[1.2]">
                {(() => {
                  const words = t('landing.admin.title3').split(' ');
                  return words.map((word, i) => (
                    <span
                      key={i}
                      className={i === 0 ? 'text-gray-900 dark:text-white' : 'text-mintcom-green'}
                    >
                      {word}
                      {i < words.length - 1 ? ' ' : ''}
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
                { label: t('landing.admin.liveReports'), icon: AlertTriangle },
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-4 text-gray-700 dark:text-gray-300 group">
                  <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 border border-mintcom-green/20 flex items-center justify-center transition-all duration-300 group-hover:bg-mintcom-green/20 group-hover:scale-110 flex-shrink-0">
                    <item.icon size={18} className="text-mintcom-green" />
                  </div>
                  <span className="text-lg tracking-tight">{item.label}</span>
                </li>
              ))}
            </ul>

            <AppDownloadBadgeGroup
              label={t("landing.admin.installBackofficeApp")}
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
        </div>
      </div>
    </section>
  );
};

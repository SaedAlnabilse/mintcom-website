/**
 * Static try-pos / real Mintcom UI screenshots for Features modals.
 * Layouts are mirrored from FullPosPlayground + pos-demo screens (new version).
 * All use the same 900×560 design size + scale-to-fit for consistent popup size.
 */
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import {
  Home,
  User,
  Users,
  PieChart,
  Bell,
  Headphones,
  Settings,
  Menu,
  LogOut,
  Search,
  Plus,
  Pencil,
  Trash2,
  CreditCard,
  Banknote,
  Printer,
  Calendar,
  Clock,
  ChevronDown,
  Check,
  Gift,
  TrendingUp,
  Shield,
  Info,
  Package,
  BookOpen,
  Building2,
  MapPin,
  Lock,
  Zap,
  Heart,
  AlertTriangle,
  AlertOctagon,
  RotateCcw,
  Smartphone,
  X,
  List,
  Hash,
  Percent,
  Box,
  Grid3X3,
  Tag,
  Wrench,
  Globe,
  Undo2,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  SlidersHorizontal,
  ChevronRight,
  ArrowUpDown,
  Layers,
  Archive,
  Link2,
  Store,
  MoreVertical,
  ExternalLink,
  Coffee,
  LayoutDashboard,
  KeyRound,
  Moon,
  MessageCircle,
  Send,
  Repeat2,
  Star,
  Eye,
  ScanFace,
  CircleCheck,
} from 'lucide-react';
import { Logo } from './Logo';
import { FeaturePosScreenshot } from './FeaturePosScreenshot';
import {
  PosCashIcon,
  PosCardIcon,
  PosOtherReceiptIcon,
} from './pos-demo/posPaymentIcons';
import MintcomLeafIcon from '../assets/small-logo.svg';

export const DESIGN_W = 900;
/** Shared canvas height for every feature preview (taller so dense UIs fit consistently). */
export const DESIGN_H = 600;
const DEFAULT_IMG = '/default_product.png?v=pos-box';

function PreviewSegment({
  options,
}: {
  options: { label: string; icon: ReactNode; on?: boolean; count?: number }[];
}) {
  return (
    <div className="relative flex shrink-0 rounded-xl bg-[#E8E8E8] p-1 dark:bg-white/10">
      {options.map((option) => (
        <span
          key={option.label}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[12px] font-semibold sm:text-[13px] ${
            option.on ? 'bg-mintcom-green text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <span className={`shrink-0 ${option.on ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
            {option.icon}
          </span>
          <span className="truncate">{option.label}</span>
          {typeof option.count === 'number' && (
            <span
              className={`rounded-xl px-1.5 py-px text-[10px] font-bold tabular-nums ${
                option.on
                  ? 'bg-white/30 text-white'
                  : 'bg-[#E5E7EB] text-gray-500 dark:bg-white/10 dark:text-gray-400'
              }`}
            >
              {option.count}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

function PreviewBold({ children }: { children: ReactNode }) {
  return <span className="font-bold text-gray-900 dark:text-white">{children}</span>;
}

/* ─── Shared frame ──────────────────────────────────────────────────────── */

export function FeatureShotFrame({
  title,
  children,
  side,
  fill,
  bg = '#f6f3ec',
}: {
  title: string;
  children: ReactNode;
  side?: boolean;
  /** Fill a fixed-height parent (Why Mintcom). Scale + center to fit the box. */
  fill?: boolean;
  /** Light-mode canvas color; dark mode always uses mintcom-dark */
  bg?: string;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;

      if (fill) {
        // Pure contain + center. Parent Why frame is locked to 3:2 (same as
        // DESIGN_W×DESIGN_H) so this paints edge-to-edge with zero crop.
        const next = Math.min(w / DESIGN_W, h / DESIGN_H);
        const ox = (w - DESIGN_W * next) / 2;
        const oy = (h - DESIGN_H * next) / 2;
        setScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next));
        setOffset((prev) =>
          Math.abs(prev.x - ox) < 0.5 && Math.abs(prev.y - oy) < 0.5
            ? prev
            : { x: ox, y: oy },
        );
      } else {
        const next = Math.min(1, w / DESIGN_W, h / DESIGN_H);
        setScale((prev) => (Math.abs(prev - next) < 0.002 ? prev : next));
        setOffset({ x: 0, y: 0 });
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fill]);

  const lightBg = bg === 'transparent' ? 'transparent' : bg;
  // When fill: outer chrome is the Why-style frame parent — no second border card
  const outer = fill
    ? 'h-full w-full select-text font-sans'
    : `${side ? 'mt-0 w-full' : 'mt-5'} select-text font-sans`;
  const card = fill
    ? 'relative h-full w-full overflow-hidden'
    : `relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white dark:border-white/10 dark:bg-mintcom-dark ${
        side ? 'shadow-lg shadow-black/10 dark:shadow-black/40' : 'shadow-inner'
      }`;

  return (
    <div role="img" aria-label={title} className={outer}>
      <div className={card}>
        <div
          ref={shellRef}
          className={`relative overflow-hidden dark:bg-mintcom-dark ${
            fill ? 'h-full w-full' : 'w-full'
          } ${lightBg === 'transparent' ? 'bg-transparent' : ''}`}
          style={{
            ...(fill ? {} : { height: DESIGN_H * scale }),
            ...(lightBg !== 'transparent' ? { backgroundColor: lightBg } : {}),
          }}
        >
          {/* Dark mode paint — overrides inline light canvas bg */}
          <div className="pointer-events-none absolute inset-0 hidden bg-mintcom-dark dark:block" />
          <div
            className="absolute z-[1] origin-top-left"
            style={{
              left: offset.x,
              top: offset.y,
              width: DESIGN_W,
              height: DESIGN_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Exact try-pos side rail (FullPosPlayground NAV_ITEMS) */
function PosRail({ active }: { active: string }) {
  const items = [
    { id: 'sales', icon: Home },
    { id: 'dashboard', icon: User },
    { id: 'reports', icon: PieChart },
    { id: 'notifications', icon: Bell },
    { id: 'support', icon: Headphones },
    { id: 'settings', icon: Settings },
  ] as const;
  return (
    <nav
      className="flex h-full w-[64px] shrink-0 flex-col items-center py-3"
      style={{ backgroundColor: '#1F1D2B' }}
    >
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl">
        <Logo variant="icon" size="sm" className="pointer-events-none" />
      </div>
      <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl text-white/80">
        <Menu size={20} />
      </div>
      <div className="flex flex-1 flex-col items-center gap-1">
        {items.map(({ id, icon: Icon }) => {
          const on = id === active;
          return (
            <span
              key={id}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl text-white"
              style={on ? { backgroundColor: '#7dc6a2' } : undefined}
            >
              <Icon size={20} strokeWidth={1.75} className={on ? 'text-white' : 'text-white/65'} />
              {id === 'notifications' && (
                <span className="absolute -end-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#E85D6A] px-0.5 text-[9px] font-bold text-white">
                  2
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="mt-auto flex h-11 w-11 items-center justify-center rounded-xl text-white/65">
        <LogOut size={20} strokeWidth={1.75} />
      </span>
    </nav>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        on ? 'bg-mintcom-green' : 'bg-gray-300 dark:bg-mintcom-tertiary'
      }`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow transition-transform ${
          on ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </span>
  );
}

/**
 * Try-pos Settings is exactly TWO cards (no dark POS rail inside the page):
 * left = icon+label nav (green active pill) · right = content panel.
 * Mirrors PosDemoSettings.tsx tablet layout.
 */
const SETTINGS_NAV = [
  { id: 'business', label: 'Main Settings', icon: Building2 },
  { id: 'sales', label: 'Payment Processes', icon: Percent },
  { id: 'products', label: 'Product Management', icon: Box },
  { id: 'categories', label: 'Categories', icon: Grid3X3 },
  { id: 'stock', label: 'Stock Management', icon: Package },
  { id: 'addons', label: 'Attributes', icon: Tag },
  { id: 'manufacturing', label: 'Recipe Operations', icon: Wrench },
  { id: 'activity', label: 'Activity Log', icon: Clock },
  { id: 'language', label: 'Language', icon: Globe },
  { id: 'about', label: 'About Us', icon: Info },
] as const;

function SettingsShell({
  active,
  title,
  sub,
  children,
  showFooter = true,
}: {
  active: string;
  title: string;
  sub: string;
  children: ReactNode;
  showFooter?: boolean;
}) {
  return (
    // font-sans — site CSS forces Magilio on h1/h2; try-pos Settings uses Inter
    // Dark tokens match PosDemoSettings: canvas mintcom-dark, panels surface, cards surface
    <div
      className="flex h-full w-full flex-col overflow-hidden bg-white p-3.5 font-sans dark:bg-mintcom-dark"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      {/* Use p not h1 — matches PosDemoSettings title typography */}
      <p className="mb-3 shrink-0 text-[22px] font-bold tracking-[-0.02em] text-gray-900 dark:text-white">
        Settings
      </p>

      {/* Two separate cards — sidebar + content (must stay visually distinct in dark) */}
      <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
        {/* Left card — green active pill, icon + label only */}
        <aside className="flex w-[220px] shrink-0 flex-col overflow-hidden rounded-xl border border-transparent bg-gray-100 p-2 dark:border-white/10 dark:bg-mintcom-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex flex-col gap-1.5 overflow-hidden py-0.5">
            {SETTINGS_NAV.map((item) => {
              const on = item.id === active;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 ${
                    on
                      ? 'bg-mintcom-green text-white shadow-md shadow-mintcom-green/25'
                      : 'text-gray-900 dark:text-gray-300'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate text-[13px] font-semibold">{item.label}</span>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Right card — content (POS light: #F3F4F6 · dark: elevated surface, separate from nav) */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-transparent bg-[#F3F4F6] dark:border-white/10 dark:bg-mintcom-surface dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="shrink-0 border-b border-gray-200 px-4 py-3.5 dark:border-white/10">
            <p className="text-[17px] font-semibold tracking-normal text-gray-900 dark:text-white">{title}</p>
            <p className="mt-0.5 text-[13px] font-normal text-gray-500 dark:text-gray-400">{sub}</p>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-3.5">{children}</div>
          {showFooter && (
            <div className="flex shrink-0 gap-3 border-t border-gray-200 px-4 py-3 dark:border-white/10">
              <span className="flex flex-1 items-center justify-center rounded-xl bg-gray-200/80 py-3 text-[13px] font-semibold text-gray-500 dark:bg-white/10 dark:text-gray-300">
                Discard Changes
              </span>
              <span className="flex flex-1 items-center justify-center rounded-xl bg-mintcom-green py-3 text-[13px] font-black text-white shadow-sm shadow-mintcom-green/25">
                Save Changes
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Sales Control = Payment Processes (PosDemoSettings sales tab) ─────── */

function SalesControlShot() {
  return (
    <SettingsShell
      active="sales"
      title="Payment Processes"
      sub="Configure how payments are accepted, processed, and recorded"
    >
      <div className="flex h-full gap-3 overflow-hidden">
        <div className="min-w-0 flex-1 space-y-2.5 overflow-hidden">
          {/* Cash — always required */}
          <div className="rounded-xl border border-gray-300 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-mintcom-dark dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                  <Banknote size={20} />
                </span>
                <div>
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">Cash</p>
                  <p className="text-[11px] text-gray-500">Always available at checkout</p>
                </div>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                Required
              </span>
            </div>
          </div>

          {/* Card Types group */}
          <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-dark dark:shadow-none">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-4 py-3">
              <div>
                <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Card Types</p>
                <p className="text-[11px] text-gray-400">Choose what type of card payments you accept</p>
              </div>
              <ChevronDown size={18} className="text-gray-400" />
            </div>
            {[
              { name: 'Visa', on: true },
              { name: 'Mastercard', on: true },
              { name: 'Amex', on: false },
            ].map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-3 border-b border-gray-50 px-4 py-2.5 last:border-0 dark:border-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                  <CreditCard size={18} />
                </span>
                <span className="flex-1 text-[13px] font-bold text-gray-900 dark:text-white">{c.name}</span>
                <Pencil size={15} className="text-mintcom-green" />
                <Trash2 size={15} className="text-[#D55263]" />
              </div>
            ))}
            <div className="px-4 py-2.5">
              <span className="text-[12px] font-bold text-mintcom-green">+ Add Card Type</span>
            </div>
          </div>

          {/* Other methods */}
          <div className="overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-dark dark:shadow-none">
            <div className="border-b border-gray-100 dark:border-white/10 px-4 py-3">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Other Payment Methods</p>
              <p className="text-[11px] text-gray-400">Digital wallets or delivery apps</p>
            </div>
            {[
              { name: 'CliQ', on: true },
              { name: 'Talabat', on: false },
            ].map((p) => (
              <div
                key={p.name}
                className="flex items-center gap-3 border-b border-gray-50 px-4 py-2.5 last:border-0 dark:border-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                  <WalletIcon />
                </span>
                <span className="flex-1 text-[13px] font-bold text-gray-900 dark:text-white">{p.name}</span>
                <Toggle on={p.on} />
              </div>
            ))}
            <div className="px-4 py-2.5">
              <span className="text-[12px] font-bold text-mintcom-green">+ Add Other Payment Method</span>
            </div>
          </div>
        </div>

        <div className="w-[280px] shrink-0 space-y-2.5 overflow-hidden">
          {/* Tax */}
          <div className="rounded-xl border border-gray-300 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-mintcom-dark dark:shadow-none">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Tax</p>
              <Toggle on />
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Rate</p>
            <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
              <span className="flex h-10 w-10 items-center justify-center bg-mintcom-green/10 text-sm font-extrabold text-mintcom-green">
                %
              </span>
              <span className="px-3 text-[14px] font-bold text-gray-900 dark:text-white">8.00</span>
            </div>
          </div>

          {/* Service charge */}
          <div className="rounded-xl border border-gray-300 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-mintcom-dark dark:shadow-none">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Service Charge</p>
              <Toggle on />
            </div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">Charge name</p>
            <div className="mb-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-[13px] font-bold text-gray-900 dark:text-white">
              Service Charge
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <span className="flex items-center justify-center gap-1 rounded-xl bg-mintcom-green py-2 text-[12px] font-bold text-white">
                % Percentage <Check size={12} />
              </span>
              <span className="flex items-center justify-center rounded-xl border border-gray-200 py-2 text-[12px] font-bold text-gray-500 dark:border-white/10 dark:text-gray-400">
                $ Fixed
              </span>
            </div>
            <div className="mt-2 flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
              <span className="flex h-9 w-9 items-center justify-center bg-mintcom-green/10 text-sm font-extrabold text-mintcom-green">
                %
              </span>
              <span className="px-3 text-[13px] font-bold text-gray-900 dark:text-white">5.00</span>
            </div>
          </div>

          {/* Loyalty snippet */}
          <div className="rounded-xl border border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-dark dark:shadow-none">
            <div className="flex items-center justify-between px-3.5 py-3">
              <span className="text-[14px] font-semibold text-gray-900 dark:text-white">Loyalty Program</span>
              <Toggle on />
            </div>
            <div className="border-t border-gray-100 dark:border-white/10 px-3.5 py-2.5">
              <p className="mb-1.5 flex items-center gap-1 text-[11px] font-black uppercase tracking-wide text-mintcom-green">
                <TrendingUp size={13} /> Earning Rule
              </p>
              <p className="text-[12px] font-semibold text-gray-600 dark:text-gray-300">
                For every <span className="text-mintcom-green">$1</span> → customer earns{' '}
                <span className="text-mintcom-green">10 PTS</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}

function WalletIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

/* ─── Staff = Main Settings focused on Employees table ──────────────────── */

function StaffShot() {
  const employees = [
    { name: 'Cafe Delight', username: 'owner', role: 'Owner', owner: true },
    { name: 'Sara Hassan', username: 'sara', role: 'Cashier', owner: false },
    { name: 'Omar Ali', username: 'omar', role: 'Barista', owner: false },
    { name: 'Maya Nour', username: 'maya', role: 'Manager', owner: false },
  ];
  return (
    <SettingsShell
      active="business"
      title="Main Settings"
      sub="Manage details for Cafe Delight"
    >
      <div className="mx-auto flex h-full max-w-2xl flex-col overflow-hidden font-sans">
        {/* Employees — primary content for Staff Management card */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <p className="mb-2.5 px-1 text-lg font-black text-gray-900 dark:text-white">Employees (4)</p>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-dark dark:shadow-none">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
              <span className="flex-1 text-[13px] font-bold text-gray-900 dark:text-white">Employee Name</span>
              <span className="flex-1 text-[13px] font-bold text-gray-900 dark:text-white">Username</span>
              <span className="w-24 text-[13px] font-bold text-gray-900 dark:text-white">Role</span>
              <div className="w-24 text-end">
                <span className="inline-flex items-center gap-1 rounded-xl bg-mintcom-green px-3 py-1.5 text-[12px] font-black text-white shadow-sm shadow-mintcom-green/25">
                  <span className="text-sm leading-none">+</span> Add
                </span>
              </div>
            </div>
            {employees.map((e) => (
              <div
                key={e.username}
                className={`flex items-center gap-2 border-b border-gray-50 px-4 py-3 last:border-0 dark:border-white/5 ${
                  e.owner ? 'bg-[#FFFBEB] dark:bg-amber-500/10' : ''
                }`}
              >
                <span className="flex-1 truncate text-[13px] font-medium text-gray-900 dark:text-white">{e.name}</span>
                <span className="flex-1 truncate text-[13px] text-gray-500 dark:text-gray-400">{e.username}</span>
                <span
                  className={`w-24 text-[13px] ${
                    e.owner
                      ? 'font-bold text-amber-700 dark:text-amber-300'
                      : 'font-semibold text-mintcom-green'
                  }`}
                >
                  {e.role}
                </span>
                <div className="flex w-24 items-center justify-end gap-1">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl text-mintcom-green">
                    <Pencil size={16} />
                  </span>
                  {e.owner ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-amber-700 dark:text-amber-300">
                      <Shield size={16} />
                    </span>
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl text-[#D55263]">
                      <Trash2 size={16} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}

/* ─── Reports = PosDemoReports ──────────────────────────────────────────── */

/** Currency like PosDemoReports money() */
const reportMoney = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/** Stat card — mirrors PosDemoReports StatCard (icon 42×42, title 11/500, value 15/700) */
function ReportStatCard({
  label,
  hint,
  value,
  icon,
  primary,
  chevron,
}: {
  label: string;
  hint?: string;
  value: string;
  icon: ReactNode;
  primary?: boolean;
  chevron?: boolean;
}) {
  return (
    <div
      className={`relative flex min-h-[68px] min-w-0 items-center gap-2.5 rounded-xl border p-2.5 text-start ${
        primary
          ? 'border-transparent bg-mintcom-green text-white shadow-sm shadow-mintcom-green/20'
          : 'border-gray-200/90 bg-white dark:bg-mintcom-surface'
      }`}
    >
      <span
        className={`absolute end-2 top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full ${
          primary ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-400'
        }`}
      >
        <Info size={11} />
      </span>
      <span
        className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl ${
          primary ? 'bg-white text-mintcom-green' : 'bg-mintcom-green text-white'
        }`}
      >
        {icon}
      </span>
      <div className={`min-w-0 flex-1 pe-4 ${chevron ? 'pe-5' : ''}`}>
        <p
          className={`text-[11px] font-medium leading-snug ${
            primary ? '!text-white' : 'text-gray-500'
          }`}
        >
          {label}
        </p>
        {hint && (
          <p className={`text-[8px] font-medium leading-snug ${primary ? '!text-white/85' : 'text-gray-400'}`}>
            {hint}
          </p>
        )}
        <p
          className={`mt-0.5 text-[14px] font-bold tabular-nums leading-tight ${
            primary ? '!text-white' : 'text-gray-900 dark:text-white'
          }`}
        >
          {value}
        </p>
      </div>
      {chevron && (
        <ChevronRight
          size={16}
          className={`mb-0.5 shrink-0 self-end ${primary ? '!text-white' : 'text-gray-400'}`}
        />
      )}
    </div>
  );
}

/**
 * Advanced Reporting — mirrors current try-pos PosDemoReports General Report:
 * header (title + print) · filters (period/date/time/employee) · tabs · 8 cards · lists
 */
function ReportingShot() {
  return (
    <div
      className="flex h-full w-full overflow-hidden font-sans"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      <PosRail active="reports" />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-100 dark:bg-mintcom-dark p-3">
        {/* Header — Reporting + Print only (employee moved to filter row) */}
        <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
          <p className="text-[18px] font-bold tracking-[-0.02em] text-gray-900 dark:text-white">Reporting</p>
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green text-white shadow-sm shadow-mintcom-green/30">
            <Printer size={16} />
          </span>
        </div>

        {/* Filters: Period | Date range | Time range | Employee */}
        <div className="mb-2 flex shrink-0 flex-wrap items-end gap-2">
          <div className="w-[120px] shrink-0">
            <p className="mb-0.5 text-[10px] font-medium text-gray-400">Period</p>
            <span className="flex h-9 items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface px-2.5 text-[11px] font-semibold text-gray-900 dark:text-white">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Calendar size={14} className="shrink-0 text-mintcom-green" />
                <span className="truncate">Last 7 days</span>
              </span>
              <ChevronDown size={13} className="shrink-0 text-gray-400" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 text-[10px] font-medium text-gray-400">Date range</p>
            <span className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface px-2.5 text-[11px] font-semibold text-gray-900 dark:text-white">
              <Calendar size={13} className="shrink-0 text-mintcom-green" />
              <span className="truncate">8 Jul 2026 - 14 Jul 2026</span>
            </span>
          </div>
          <div className="min-w-[140px] flex-1">
            <p className="mb-0.5 text-[10px] font-medium text-gray-400">Time range</p>
            <span className="flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface px-2.5 text-[11px] font-semibold text-gray-900 dark:text-white">
              <Clock size={13} className="shrink-0 text-mintcom-green" />
              <span className="truncate">12:00 AM - 11:59 PM</span>
            </span>
          </div>
          <div className="min-w-[150px] flex-1">
            <p className="mb-0.5 text-[10px] font-medium text-gray-400">Employee</p>
            <div className="relative">
              <span className="flex h-9 w-full items-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface py-2 ps-8 pe-7 text-[12px] font-semibold text-gray-900 dark:text-white">
                All Employees
              </span>
              <User
                size={14}
                className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-mintcom-green"
              />
              <ChevronDown
                size={13}
                className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Tabs — full-width underline like POS */}
        <div className="relative mb-2 flex shrink-0 border-b border-gray-200 dark:border-white/10">
          {['General Report', 'Item Report'].map((t, i) => (
            <span
              key={t}
              className={`relative flex-1 py-2 text-center text-[12px] font-semibold ${
                i === 0 ? 'text-mintcom-green' : 'text-gray-500'
              }`}
            >
              {t}
              {i === 0 && (
                <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-t-full bg-mintcom-green" />
              )}
            </span>
          ))}
        </div>

        {/* 8 SalesSummaryCards — Net, Card, Cash, Refunds, Other, Hours, Orders, Pay-in/out */}
        <div className="mb-2 grid shrink-0 grid-cols-4 gap-2">
          <ReportStatCard
            primary
            chevron
            label="Net Sales"
            hint="Excludes tax & service/other charges"
            value={reportMoney(4462.96)}
            icon={<TrendingUp size={18} strokeWidth={2.25} />}
          />
          <ReportStatCard
            chevron
            label="Card Sales"
            value={reportMoney(2910)}
            icon={<CreditCard size={16} />}
          />
          <ReportStatCard label="Cash Sales" value={reportMoney(1540)} icon={<Banknote size={16} />} />
          <ReportStatCard
            label="Refunds"
            value={reportMoney(-48.5)}
            icon={<Undo2 size={15} />}
          />
          <ReportStatCard
            chevron
            label="Other Payments"
            value={reportMoney(370)}
            icon={<Receipt size={15} />}
          />
          <ReportStatCard
            chevron
            label="Total Hours Worked"
            value="32h 15m"
            icon={<Clock size={15} />}
          />
          <ReportStatCard label="Total Orders" value="318" icon={<Receipt size={15} />} />
          <ReportStatCard
            chevron
            label="PAY-IN/PAY-OUT"
            value="Non-sales transactions"
            icon={
              <span className="flex flex-col items-center leading-none">
                <ArrowDownLeft size={11} strokeWidth={2.5} />
                <ArrowUpRight size={11} strokeWidth={2.5} className="-mt-0.5" />
              </span>
            }
          />
        </div>

        {/* Orders & Receipts | Top 3 Selling Items */}
        <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_1fr] gap-2.5 overflow-hidden">
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface shadow-sm">
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-gray-200 dark:border-white/10 px-3">
              <p className="text-[14px] font-semibold text-gray-900 dark:text-white">Orders & Receipts</p>
              <span className="inline-flex items-center gap-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface px-2 py-1 text-[10px] font-semibold text-gray-500">
                <SlidersHorizontal size={12} />
                Filters
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              {[
                {
                  no: '#1001',
                  pay: 'Card · Visa',
                  emp: 'Sara Hassan',
                  total: reportMoney(14.04),
                  status: 'Completed',
                },
                {
                  no: '#1002',
                  pay: 'Cash',
                  emp: 'Omar Ali',
                  total: reportMoney(3.78),
                  status: 'Completed',
                },
                {
                  no: '#1003',
                  pay: 'CliQ',
                  emp: 'Maya Nour',
                  total: reportMoney(15.12),
                  status: 'Completed',
                },
                {
                  no: '#1009',
                  pay: 'Card · Visa',
                  emp: 'Sara Hassan',
                  total: reportMoney(-4.86),
                  status: 'Refunded',
                },
              ].map((o) => (
                <div
                  key={o.no}
                  className="flex items-center gap-2 border-b border-gray-100 dark:border-white/10 px-3 py-2 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-bold text-gray-900 dark:text-white">{o.no}</p>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                          o.status === 'Refunded'
                            ? 'bg-red-50 text-[#D55263]'
                            : 'bg-mintcom-green/12 text-mintcom-green'
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="truncate text-[10px] text-gray-400">
                      {o.pay} · {o.emp}
                    </p>
                  </div>
                  <span
                    className={`text-[12px] font-bold tabular-nums ${
                      o.status === 'Refunded' ? 'text-[#D55263]' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {o.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface shadow-sm">
            <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-gray-200 dark:border-white/10 px-3">
              <p className="min-w-0 truncate text-[14px] font-semibold text-gray-900 dark:text-white">
                Top 3 Selling Items
              </p>
              <span className="inline-flex h-7 shrink-0 items-center gap-1 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface py-0.5 ps-1.5 pe-1 text-[10px] font-semibold text-gray-900 dark:text-white">
                <Calendar size={12} className="text-mintcom-green" />
                This Week
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-mintcom-green/10 text-mintcom-green">
                  <ChevronDown size={10} />
                </span>
              </span>
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-between p-2.5">
              {[
                { name: 'Latte', qty: 142, rev: 639 },
                { name: 'Croissant', qty: 98, rev: 392 },
                { name: 'Espresso', qty: 86, rev: 301 },
              ].map((item, i) => (
                <div
                  key={item.name}
                  className="flex min-h-0 flex-1 items-center gap-2 border-b border-gray-100 dark:border-white/10 px-1 last:border-0"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-[#F8FAF9] dark:border-white/10 dark:bg-[#F3F4F6]">
                    <img src={DEFAULT_IMG} alt="" className="h-7 w-7 object-contain" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-semibold text-gray-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-gray-400">{item.qty} sold</p>
                  </div>
                  <p className="text-[12px] font-semibold tabular-nums text-mintcom-green">
                    {reportMoney(item.rev)}
                  </p>
                  <span className="text-[10px] font-bold text-gray-400">#{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Recipe & Cost Management — mirrors try-pos DemoManufacturingPanel
 * inside Settings → Recipe Operations (Raw Materials inventory, default).
 */
function ProductionShot() {
  /** POS money: "18.00 USD" */
  const mfgMoney = (n: number) => `${n.toFixed(2)} USD`;

  const materials = [
    {
      name: 'Espresso beans',
      unit: 'kg',
      qty: 4.2,
      cost: 18,
      status: 'ok' as const,
      active: true,
    },
    {
      name: 'Whole milk',
      unit: 'L',
      qty: 12,
      cost: 1.2,
      status: 'ok' as const,
      active: true,
    },
    {
      name: 'Oat milk',
      unit: 'L',
      qty: 1.5,
      cost: 2.4,
      status: 'low' as const,
      active: true,
    },
    {
      name: 'Flour',
      unit: 'kg',
      qty: 8,
      cost: 1.1,
      status: 'ok' as const,
      active: true,
    },
  ] as const;

  return (
    <SettingsShell
      active="manufacturing"
      title="Recipe Operations"
      sub="View and update recipes and ingredients"
    >
      <div className="flex h-full min-h-0 w-full flex-col gap-2.5 overflow-hidden font-sans">
        {/* Unified 3-Pillar Tabs */}
        <PreviewSegment
          options={[
            { label: 'Raw Materials', icon: <Box size={14} />, on: true, count: 11 },
            { label: 'Prepared Items', icon: <Layers size={14} />, count: 2 },
            { label: 'Product Recipes', icon: <BookOpen size={14} />, count: 4 },
          ]}
        />

        {/* Toolbar: Search + Filter Pills + Action Button */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <div className="w-full rounded-xl border border-[#E5E7EB] bg-white py-1.5 pl-8 pr-3 text-[12px] text-gray-400 dark:border-white/10 dark:bg-mintcom-surface">
                Search materials...
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 rounded-xl bg-mintcom-green px-2.5 py-1.5 text-[12px] font-semibold text-white shadow-sm">
              <Plus size={14} strokeWidth={2.5} /> Add Material
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="rounded-[12px] bg-mintcom-green px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
              All (11)
            </span>
            <span className="rounded-[12px] bg-[#F59E0B]/20 px-2.5 py-1 text-[11px] font-semibold text-[#D97706]">
              Low Stock (2)
            </span>
            <span className="rounded-[12px] bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600 dark:bg-white/10 dark:text-gray-300">
              Optimal (9)
            </span>
          </div>
        </div>

        {/* Material card grid — POS Shell cards */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full grid-cols-2 gap-3 content-start">
            {materials.map((m) => (
              <div
                key={m.name}
                className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-white/10 dark:bg-mintcom-dark dark:shadow-none"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-[13px] font-semibold leading-snug text-gray-900 dark:text-white sm:text-sm">
                        {m.name}
                      </p>
                      <span className="rounded-xl bg-[#7dc6a2]/20 px-1.5 py-[2px] text-[9px] font-extrabold leading-none text-[#5fa888]">
                        Active
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Unit: {m.unit}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#7dc6a2]/20 text-[#5fa888]">
                      <Pencil size={13} />
                    </span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F59E0B]/20 text-[#D97706]">
                      <Archive size={13} />
                    </span>
                  </div>
                </div>

                {/* Stock + cost */}
                <div className="flex items-start justify-between gap-2 border-t border-[#E5E7EB] px-3 pb-2 pt-2 dark:border-white/10 sm:px-4 sm:pb-2.5 sm:pt-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="mb-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">Current Stock</p>
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={`text-[14px] font-bold tabular-nums leading-tight sm:text-base ${
                          m.status === 'low' ? 'text-[#F59E0B]' : 'text-gray-900 dark:text-white'
                        }`}
                      >
                        {m.qty.toFixed(2)} {m.unit}
                      </span>
                      {m.status === 'low' && (
                        <span className="rounded-xl bg-[#F59E0B]/20 px-1.5 py-0.5 text-[9px] font-semibold text-[#D97706]">
                          Low
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="mb-0.5 text-[10px] font-semibold text-gray-500 dark:text-gray-400">Cost / Unit</p>
                    <p className="text-[12px] font-semibold tabular-nums text-gray-900 dark:text-white sm:text-sm">
                      {mfgMoney(m.cost)}
                    </p>
                  </div>
                </div>

                {/* Restock CTA */}
                <span className="mx-3 mb-2.5 mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-mintcom-green py-1.5 text-[12px] font-semibold text-white shadow-sm">
                  <Plus size={14} /> Restock
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}

/**
 * AI-Empowered System — admin portal AI Assistant (AIAssistantModal)
 * framed in an iPhone. Layout is tuned so chat text never clips mid-word.
 */
function AiShot() {
  const chips = ['Top sellers', 'Last week', 'Staff', 'Stock'];

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden font-sans"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      {/* Soft studio backdrop — light in light mode, product dark in dark mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5ef] via-[#f4f7f5] to-[#dfece6] dark:from-mintcom-dark dark:via-[#0c1525] dark:to-mintcom-dark" />
      <div className="absolute -left-12 top-10 h-52 w-52 rounded-full bg-mintcom-green/25 blur-3xl dark:bg-mintcom-green/15" />
      <div className="absolute -right-8 bottom-6 h-56 w-56 rounded-full bg-[#7dc6a2]/20 blur-3xl dark:bg-mintcom-green/10" />

      <div className="relative z-10 flex items-center gap-8 pe-2">
        {/* iPhone 15-style frame */}
        <div
          className="relative shrink-0 overflow-hidden rounded-[42px] border-[7px] border-[#1a1a1e] bg-[#1a1a1e] shadow-[0_30px_70px_-16px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
          style={{ width: 274, height: 560 }}
        >
          {/* Side buttons (decorative) */}
          <span className="absolute -start-[9px] top-[100px] h-7 w-[3px] rounded-s-sm bg-[#2a2a30]" />
          <span className="absolute -start-[9px] top-[140px] h-12 w-[3px] rounded-s-sm bg-[#2a2a30]" />
          <span className="absolute -start-[9px] top-[200px] h-12 w-[3px] rounded-s-sm bg-[#2a2a30]" />
          <span className="absolute -end-[9px] top-[160px] h-16 w-[3px] rounded-e-sm bg-[#2a2a30]" />

          {/* Screen */}
          <div className="flex h-full flex-col overflow-hidden rounded-[35px] bg-white dark:bg-mintcom-surface">
            {/* Status bar + Dynamic Island */}
            <div className="relative z-20 flex shrink-0 items-center justify-between px-5 pb-1 pt-3">
              <span className="w-12 text-[11px] font-semibold tracking-tight text-gray-900 dark:text-white">
                9:41
              </span>
              <div className="absolute left-1/2 top-2 h-[26px] w-[96px] -translate-x-1/2 rounded-full bg-black shadow-inner" />
              <div className="flex w-14 items-center justify-end gap-[3px] text-gray-900 dark:text-white">
                {/* Signal */}
                <svg width="15" height="10" viewBox="0 0 15 10" fill="currentColor" aria-hidden>
                  <rect x="0" y="6" width="2.5" height="4" rx="0.6" />
                  <rect x="4" y="4" width="2.5" height="6" rx="0.6" />
                  <rect x="8" y="2" width="2.5" height="8" rx="0.6" />
                  <rect x="12" y="0" width="2.5" height="10" rx="0.6" opacity="0.35" />
                </svg>
                {/* Wifi */}
                <svg width="13" height="10" viewBox="0 0 13 10" fill="none" aria-hidden>
                  <path
                    d="M6.5 8.6a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
                    fill="currentColor"
                  />
                  <path
                    d="M3.2 6.2a4.8 4.8 0 0 1 6.6 0"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                  <path
                    d="M1 3.8a7.5 7.5 0 0 1 11 0"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    opacity="0.55"
                  />
                </svg>
                {/* Battery */}
                <svg width="22" height="11" viewBox="0 0 22 11" fill="none" aria-hidden>
                  <rect
                    x="0.6"
                    y="0.6"
                    width="18"
                    height="9.8"
                    rx="2.2"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  />
                  <rect x="2.2" y="2.2" width="13.5" height="6.6" rx="1.2" fill="currentColor" />
                  <path
                    d="M19.5 3.5v4A1.5 1.5 0 0 0 21 6V5a1.5 1.5 0 0 0-1.5-1.5Z"
                    fill="currentColor"
                    opacity="0.45"
                  />
                </svg>
              </div>
            </div>

            {/* Assistant UI */}
            <div className="flex min-h-0 flex-1 flex-col bg-white dark:bg-mintcom-surface">
              {/* Header */}
              <div className="flex shrink-0 items-center gap-2 border-b border-gray-100 dark:border-white/10 px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                  <MessageCircle size={16} strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                    AI Assistant
                  </p>
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-md bg-mintcom-green/12 px-1.5 py-px text-[10px] font-bold text-mintcom-green">
                    <MapPin size={9} strokeWidth={2.5} />
                    Cafe Delight
                    <Repeat2 size={9} strokeWidth={2.5} />
                  </span>
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
                  <Trash2 size={14} />
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300">
                  <X size={14} />
                </span>
              </div>

              {/*
                Chat mirrors real AIMessageBubble + persona rules:
                warm short prose, **bold** figures, "- " bullets, money as "1284.50 USD".
              */}
              <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden bg-white px-3 py-3 dark:bg-mintcom-dark">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-md bg-mintcom-green px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm shadow-mintcom-green/25">
                    Morning briefing
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <span className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mintcom-green/20">
                    <span className="h-2 w-2 rounded-full bg-mintcom-green" />
                  </span>
                  <div className="min-w-0 max-w-[88%] rounded-2xl rounded-bl-md border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface px-3.5 py-2.5 shadow-sm">
                    <p className="text-[12px] font-medium leading-[17px] text-gray-900 dark:text-white">
                      Good morning! Here&apos;s how <PreviewBold>Cafe Delight</PreviewBold> is doing so far today:
                    </p>
                    <div className="mt-1.5 space-y-0.5 text-[12px] font-medium leading-[17px] text-gray-900 dark:text-white">
                      <p className="flex gap-1.5">
                        <span className="shrink-0 w-2.5">-</span>
                        <span>
                          Net sales: <PreviewBold>1284.50 USD</PreviewBold> (42 orders)
                        </span>
                      </p>
                      <p className="flex gap-1.5">
                        <span className="shrink-0 w-2.5">-</span>
                        <span>
                          Top seller: <PreviewBold>Latte</PreviewBold>, 48 sold
                        </span>
                      </p>
                      <p className="flex gap-1.5">
                        <span className="shrink-0 w-2.5">-</span>
                        <span>
                          Peak window: <PreviewBold>9–11 AM</PreviewBold>
                        </span>
                      </p>
                    </div>
                    <p className="mt-1.5 text-[12px] font-medium leading-[17px] text-gray-900 dark:text-white">
                      Strong start, keep the rush covered!
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-md bg-mintcom-green px-3.5 py-2 text-[12px] font-semibold text-white shadow-sm shadow-mintcom-green/25">
                    Anything low on stock?
                  </div>
                </div>

                <div className="flex items-end gap-2">
                  <span className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mintcom-green/20">
                    <span className="h-2 w-2 rounded-full bg-mintcom-green" />
                  </span>
                  <div className="min-w-0 max-w-[88%] rounded-2xl rounded-bl-md border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface px-3.5 py-2.5 shadow-sm">
                    <p className="text-[12px] font-medium leading-[17px] text-gray-900 dark:text-white">
                      <PreviewBold>Oat milk</PreviewBold> is running low, with only <PreviewBold>1.5 L</PreviewBold> left
                      (threshold <PreviewBold>3 L</PreviewBold>). Worth restocking before the
                      afternoon rush.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chips — single row, short labels so nothing wraps */}
              <div className="flex shrink-0 gap-1.5 overflow-hidden px-3 pb-2">
                {chips.map((c, i) => (
                  <span
                    key={c}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                      i === 0
                        ? 'border-mintcom-green/50 bg-mintcom-green/15 text-mintcom-green'
                        : 'border-mintcom-green/35 bg-mintcom-green/8 text-mintcom-green'
                    }`}
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-gray-100 bg-white px-3 pb-2 pt-2 dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-[#F0F2F5] py-1 pe-1 ps-3.5 dark:border-white/10 dark:bg-white/5">
                  <span className="min-w-0 flex-1 truncate py-1.5 text-[12px] font-medium text-gray-400">
                    Ask about your business…
                  </span>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mintcom-green text-white shadow-sm shadow-mintcom-green/30">
                    <Send size={13} className="ms-px" />
                  </span>
                </div>
                {/* Home indicator */}
                {/* iOS home indicator */}
                <div className="flex items-center justify-center pb-1.5 pt-2">
                  <span
                    className="h-[5px] w-[112px] rounded-full bg-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.18)] dark:bg-white/90 dark:shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side story cards */}
        <div className="flex w-[270px] flex-col gap-3">
          <div className="rounded-2xl border border-white/90 bg-white/95 p-4 shadow-lg shadow-black/5 backdrop-blur dark:border-white/10 dark:bg-mintcom-surface dark:shadow-black/40">
            <div className="mb-2 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                <MessageCircle size={18} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-gray-900 dark:text-white">Admin AI agent</p>
                <p className="text-[11px] font-semibold text-mintcom-green">Same as the mobile app</p>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
              Sales, stock, and staffing answers, scoped to one location or your whole brand.
            </p>
          </div>

          <div className="rounded-2xl border border-white/90 bg-white/95 p-4 shadow-lg shadow-black/5 dark:border-white/10 dark:bg-mintcom-surface dark:shadow-black/40">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Try asking
            </p>
            <div className="flex flex-col gap-1.5">
              {['Morning briefing', 'Revenue last 3 months', 'Compare my locations'].map((q) => (
                <span
                  key={q}
                  className="inline-flex items-center gap-2 rounded-xl border border-mintcom-green/25 bg-mintcom-green/[0.07] px-3 py-2 text-[12px] font-semibold text-mintcom-green dark:border-mintcom-green/30 dark:bg-mintcom-green/10"
                >
                  <Zap size={13} className="shrink-0" />
                  {q}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-mintcom-green/20 bg-gradient-to-br from-mintcom-green/15 to-mintcom-green/5 p-4 dark:border-mintcom-green/25 dark:from-mintcom-green/20 dark:to-mintcom-green/5">
            <div className="flex items-center gap-2 text-[12px] font-bold text-mintcom-green">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mintcom-green opacity-45" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mintcom-green" />
              </span>
              Live on iOS & Android
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-gray-900 dark:text-white/90">
              Open the assistant from any screen in the admin portal.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Multi-Branch Management — Owner Brands screen, cleaned for the 3:2 Features
 * frame: slim rail (no cramped side banner), stats + brand cards fill cleanly.
 */
function BranchShot() {
  const brands = [
    {
      name: 'Cafe Delight',
      loginId: 'cafe-delight',
      created: 'Mar 12, 2025',
      locations: [
        { name: 'Downtown', type: 'cafe' },
        { name: 'Mall Branch', type: 'cafe' },
        { name: 'Airport Kiosk', type: 'retail' },
      ],
      featured: true,
    },
    {
      name: 'Green Bowl Co.',
      loginId: 'green-bowl',
      created: 'Jan 8, 2026',
      locations: [
        { name: 'University', type: 'cafe' },
        { name: 'Riverside', type: 'cafe' },
        { name: 'Harbor', type: 'cafe' },
      ],
      featured: false,
    },
    {
      name: 'Artisan Bakery',
      loginId: 'artisan-bakery',
      created: 'Jun 3, 2025',
      locations: [
        { name: 'Main Street', type: 'cafe' },
        { name: 'Central Plaza', type: 'retail' },
        { name: 'West End', type: 'cafe' },
      ],
      featured: false,
    },
    {
      name: 'Urban Kitchen',
      loginId: 'urban-kitchen',
      created: 'Sep 21, 2025',
      locations: [
        { name: 'North Point', type: 'cafe' },
        { name: 'City Center', type: 'retail' },
        { name: 'East Village', type: 'cafe' },
      ],
      featured: false,
    },
  ] as const;

  const activeBrands = brands.length; // 4
  const linkedCount = brands.reduce((s, b) => s + b.locations.length, 0); // 12
  const availableLocations = 2; // unlinked locations ready to join a brand

  return (
    <div
      className="flex h-full w-full overflow-hidden font-sans"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      {/*
        Owner portal collapsed rail — same chrome as MINTCOM DASHBOARDS
        Owner Dashboard (CloudControl OwnerRail / PortalRail).
      */}
      <aside className="relative flex h-full w-[68px] shrink-0 flex-col border-e border-gray-200 bg-white py-2.5 dark:border-white/10 dark:bg-mintcom-surface">
        <div className="pointer-events-none absolute end-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-mintcom-green/25 to-transparent opacity-60" />

        {/* Leaf logo */}
        <div className="mb-1.5 flex shrink-0 items-center justify-center px-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-mintcom-green/20 bg-gradient-to-br from-mintcom-green/20 to-mintcom-green/5">
            <img
              src={MintcomLeafIcon}
              alt=""
              className="h-5 w-5 object-contain"
              draggable={false}
            />
          </span>
        </div>

        {/* Nav — OwnerLayout order; Brands (Building2) active */}
        <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-evenly overflow-hidden px-2">
          {(
            [
              { id: 'overview', Icon: LayoutDashboard, on: false },
              { id: 'locations', Icon: Store, on: false },
              { id: 'brands', Icon: Building2, on: true },
              { id: 'employees', Icon: Users, on: false },
              { id: 'roles', Icon: Shield, on: false },
              { id: 'billing', Icon: CreditCard, on: false },
              { id: 'account', Icon: KeyRound, on: false },
            ] as const
          ).map(({ id, Icon, on }) => (
            <span
              key={id}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                on
                  ? 'bg-mintcom-green font-semibold text-black shadow-md shadow-mintcom-green/25'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon size={16} strokeWidth={on ? 2.25 : 2} />
            </span>
          ))}
        </div>

        {/* Footer — EN · mobile · theme · logout (matches Owner Dashboard card) */}
        <div className="mt-1 flex shrink-0 flex-col items-center gap-1 border-t border-gray-100 px-2 pt-2 dark:border-white/10">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-black tracking-wider text-gray-600 dark:text-gray-300">
            EN
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 dark:text-gray-400">
            <Smartphone size={16} strokeWidth={2} />
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 dark:text-gray-400">
            <Moon size={16} strokeWidth={2} />
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 dark:text-gray-400">
            <LogOut size={16} strokeWidth={2} />
          </span>
        </div>
      </aside>

      {/* Brands page content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-mintcom-dark">
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2.5 pt-3.5">
          <div className="min-w-0">
            <p className="text-[18px] font-bold tracking-tight text-gray-900 dark:text-white">
              Brands
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-gray-500">
              Group locations under one brand dashboard
            </p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-mintcom-green px-3.5 py-2 text-[12px] font-bold text-black shadow-sm shadow-mintcom-green/25">
            <Plus size={15} strokeWidth={2.5} /> Create Brand
          </span>
        </div>

        <div className="grid shrink-0 grid-cols-3 gap-2 px-3.5 pb-2">
          {(
            [
              {
                label: 'Active brands',
                value: String(activeBrands),
                Icon: Building2,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                label: 'Linked locations',
                value: String(linkedCount),
                Icon: Link2,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
              },
              {
                label: 'Available locations',
                value: String(availableLocations),
                Icon: Store,
                color: 'text-orange-500',
                bg: 'bg-orange-500/10',
              },
            ] as const
          ).map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2.5 py-2 shadow-sm dark:border-white/10 dark:bg-mintcom-surface"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.bg} ${s.color}`}
              >
                <s.Icon size={15} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[9px] font-medium text-gray-500">{s.label}</p>
                <p className="text-[15px] font-bold leading-none tracking-tight text-gray-900 dark:text-white">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-3.5 mb-2 flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm dark:border-white/10 dark:bg-mintcom-surface">
          <div className="relative min-w-0 flex-1">
            <Search
              size={13}
              className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <span className="flex h-8 w-full items-center rounded-lg border border-gray-200 bg-gray-50 ps-8 pe-2 text-[10px] font-medium text-gray-400 dark:border-white/10 dark:bg-white/5">
              Search brands by name or login ID…
            </span>
          </div>
          <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 text-[10px] font-semibold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
            Sort by name
            <ChevronDown size={12} className="text-gray-400" />
          </span>
        </div>

        {/* 2×2 brand grid — 4 brands × 3 locations each fills the frame */}
        <div className="min-h-0 flex-1 overflow-hidden px-3.5 pb-3">
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-2">
            {brands.map((brand) => (
              <div
                key={brand.name}
                className={`relative flex min-h-0 flex-col overflow-hidden rounded-xl border bg-white p-2.5 shadow-sm dark:bg-mintcom-surface ${
                  brand.featured
                    ? 'border-mintcom-green bg-mintcom-green/[0.02]'
                    : 'border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="pointer-events-none absolute -end-4 -top-4 h-14 w-14 rounded-full bg-blue-500/10 blur-xl" />

                <div className="relative z-10 flex min-h-0 flex-1 flex-col">
                  <div className="mb-1.5 flex items-start justify-between gap-1.5">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <Building2 size={15} className="text-blue-500" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                          {brand.name}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          <span className="rounded bg-mintcom-green/10 px-1 py-px text-[8px] font-bold text-mintcom-green">
                            Active
                          </span>
                          <span className="text-[9px] font-medium text-gray-500">
                            {brand.locations.length} locations
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center text-gray-400">
                      <MoreVertical size={12} />
                    </span>
                  </div>

                  <div className="mb-1.5 grid grid-cols-2 gap-1">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-1.5 py-1 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-px flex items-center gap-0.5">
                        <Hash size={9} className="text-blue-500" />
                        <span className="text-[7px] font-semibold uppercase tracking-wide text-gray-400">
                          Login ID
                        </span>
                      </div>
                      <p className="truncate font-mono text-[10px] font-bold text-gray-900 dark:text-white">
                        {brand.loginId}
                      </p>
                    </div>
                    <div className="rounded-lg border border-gray-100 bg-gray-50 px-1.5 py-1 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-px flex items-center gap-0.5">
                        <Calendar size={9} className="text-blue-500" />
                        <span className="text-[7px] font-semibold uppercase tracking-wide text-gray-400">
                          Created
                        </span>
                      </div>
                      <p className="truncate text-[10px] font-bold text-gray-900 dark:text-white">
                        {brand.created}
                      </p>
                    </div>
                  </div>

                  <div className="mb-1.5 min-h-0 flex-1">
                    <p className="mb-0.5 text-[7px] font-semibold uppercase tracking-wide text-gray-400">
                      Locations
                    </p>
                    <div className="flex flex-wrap gap-0.5">
                      {brand.locations.map((loc) => (
                        <span
                          key={loc.name}
                          className="inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 dark:border-white/10 dark:bg-mintcom-surface"
                        >
                          {loc.type === 'retail' ? (
                            <Store size={9} className="text-gray-400" />
                          ) : (
                            <Coffee size={9} className="text-gray-400" />
                          )}
                          <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300">
                            {loc.name}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto border-t border-gray-100 pt-1.5 dark:border-white/10">
                    <span className="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-[10px] font-bold text-gray-700 dark:border-white/10 dark:bg-white/5 dark:text-gray-200">
                      <ExternalLink size={11} />
                      Open brand dashboard
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simple & Easy Interface — mirrors try-pos DemoDashboardScreen:
 * ShiftManagementCard · Net/Cash/Card · Orders/Pay-in-out/Other/Hours · Sales Overview chart
 */
function SimpleUiShot() {
  /** Demo last-shift snapshot when closed (matches DemoDashboardScreen display*) */
  const displayNet = 1397;
  const displayCash = 465;
  const displayCard = 765;
  const displayOther = 167;
  const displayPayIn = 85;
  const displayPayOut = 40;
  const displayOrders = 42;
  const displayHours = '8h';

  const netPts = [80, 140, 220, 310, 420, 540, 680, 820, 980, 1120, 1260, 1397];
  const cashPts = [30, 55, 90, 120, 160, 200, 250, 300, 350, 400, 430, 465];
  const cardPts = [40, 70, 110, 160, 220, 280, 350, 420, 500, 580, 680, 765];
  const otherPts = [10, 15, 20, 30, 40, 55, 70, 90, 110, 130, 150, 167];
  const maxY = 1500;
  /** POS-style 5 ticks (top → bottom), same as DemoSalesTrendChart */
  const yTicks = [1500, 1125, 750, 375, 0];

  const toPoly = (pts: number[]) =>
    pts
      .map((v, i) => {
        const x = (i / (pts.length - 1)) * 100;
        const y = 100 - (v / maxY) * 100;
        return `${x},${y}`;
      })
      .join(' ');

  const cardShell =
    'rounded-xl border border-[#D3D6DE] bg-[#E8E8E8] dark:border-white/10 dark:bg-mintcom-surface dark:shadow-none';

  return (
    <div
      className="flex h-full w-full overflow-hidden font-sans"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      <PosRail active="dashboard" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 overflow-hidden bg-gray-100 dark:bg-mintcom-dark p-3">
        {/* Shift management card — open shift state */}
        <div className="shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-mintcom-surface shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3 p-3 sm:p-3.5">
            <div className="min-w-0">
              <p className="text-sm font-black text-gray-900 dark:text-white sm:text-base">
                You&apos;re Doing Great, Sam Cashier
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Tuesday, 14 Jul 2026</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-xl border-[1.5px] border-mintcom-green bg-white dark:bg-mintcom-surface px-3.5 py-2 text-[12px] font-bold text-mintcom-green">
                <List size={16} /> Today's Orders
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#D55263] px-3.5 py-2 text-[12px] font-bold text-white">
                <LogOut size={16} /> Close Shift
              </span>
            </div>
          </div>
          {/* Always white on green — never black/gray on mint */}
          <div className="mx-3 mb-3 rounded-xl bg-mintcom-green px-3.5 py-3 text-white shadow-sm sm:mx-3.5 sm:px-4">
            <p className="text-[15px] font-semibold leading-tight !text-white sm:text-[16px]">
              Current shift of Sam Cashier
            </p>
            <p className="mt-1 text-[12px] font-medium !text-white sm:text-[13px]">
              Shift started Tuesday 7/14/26 - 09:12 AM
            </p>
          </div>
        </div>

        {/* Metric grid — left 1/3 Net/Cash/Card · right 2/3 tiles + chart */}
        <div className="flex min-h-0 flex-1 gap-3 overflow-hidden">
          {/* LEFT */}
          <div className="flex w-[30%] min-w-0 shrink-0 flex-col gap-3">
            {/* Net Sales primary — white text only on green */}
            <div className="flex min-h-0 flex-1 flex-col gap-3 rounded-xl bg-mintcom-green p-3.5 !text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-mintcom-surface text-mintcom-green">
                  <TrendingUp size={22} strokeWidth={2.25} />
                </span>
                <div className="min-w-0 text-start">
                  <p className="text-[15px] font-semibold leading-tight !text-white">Net Sales</p>
                  <p className="mt-0.5 text-[11px] font-normal !text-white/90">
                    Excludes tax and other charges
                  </p>
                </div>
              </div>
              <p className="flex flex-1 items-center justify-center text-center text-[24px] font-extrabold tabular-nums tracking-tight !text-white sm:text-[28px]">
                {reportMoney(displayNet)}
              </p>
            </div>

            {/* Cash Sales — MetricSalesCard + PosCashIcon */}
            <div className={`flex min-h-0 flex-1 flex-col gap-3 p-3.5 ${cardShell}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white">
                  <PosCashIcon size={22} className="text-white" />
                </span>
                <div className="min-w-0 text-start">
                  <p className="text-[13px] font-medium text-[#737182] dark:text-gray-300">Cash Sales</p>
                  <p className="mt-0.5 text-[11px] font-normal text-[#828287] dark:text-gray-400">
                    Excludes tax and other charges
                  </p>
                </div>
              </div>
              <p className="flex flex-1 items-center justify-center text-center text-[22px] font-bold tabular-nums tracking-normal text-gray-900 dark:text-white sm:text-[26px]">
                {reportMoney(displayCash)}
              </p>
            </div>

            {/* Card Sales */}
            <div className={`flex min-h-0 flex-1 flex-col gap-3 p-3.5 ${cardShell}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white">
                  <PosCardIcon size={22} className="text-white" />
                </span>
                <div className="min-w-0 text-start">
                  <p className="text-[13px] font-medium text-[#737182] dark:text-gray-300">Card Sales</p>
                  <p className="mt-0.5 text-[11px] font-normal text-[#828287] dark:text-gray-400">
                    Excludes tax and other charges
                  </p>
                </div>
              </div>
              <p className="flex flex-1 items-center justify-center text-center text-[22px] font-bold tabular-nums tracking-normal text-gray-900 dark:text-white sm:text-[26px]">
                {reportMoney(displayCard)}
              </p>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="grid shrink-0 grid-cols-2 gap-3">
              <div className={`relative flex min-h-[80px] items-center gap-3 p-3 ${cardShell}`}>
                <span className="absolute end-2 top-2 text-[#9CA3AF] dark:text-gray-500">
                  <Info size={14} />
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white">
                  <Receipt size={20} />
                </span>
                <div className="min-w-0 flex-1 pe-4 text-start">
                  <p className="truncate text-[11px] font-medium text-[#737182] dark:text-gray-300">Number of Orders</p>
                  <p className="mt-0.5 truncate text-[15px] font-bold tabular-nums text-gray-900 dark:text-white">
                    {displayOrders}
                  </p>
                </div>
              </div>

              <div className={`flex min-h-[80px] items-center gap-3 p-3 ${cardShell}`}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white">
                  <ArrowUpDown size={20} />
                </span>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#737182] dark:text-gray-300">
                      PAY-IN
                    </span>
                    <span className="text-[13px] font-bold tabular-nums text-mintcom-green">
                      {reportMoney(displayPayIn)}
                    </span>
                  </div>
                  <div className="h-px bg-[#D3D6DE] dark:bg-white/10" />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[#737182] dark:text-gray-300">
                      PAY-OUT
                    </span>
                    <span className="text-[13px] font-bold tabular-nums text-[#D55263]">
                      {reportMoney(displayPayOut)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-3">
              <div className={`relative flex min-h-[80px] items-center gap-3 p-3 ${cardShell}`}>
                <span className="absolute end-2 top-2 text-[#9CA3AF] dark:text-gray-500">
                  <Info size={14} />
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white">
                  <PosOtherReceiptIcon size={22} className="text-white" />
                </span>
                <div className="min-w-0 flex-1 pe-4 text-start">
                  <p className="truncate text-[11px] font-medium text-[#737182] dark:text-gray-300">
                    Other Payment Methods
                  </p>
                  <p className="mt-0.5 truncate text-[15px] font-bold tabular-nums text-gray-900 dark:text-white">
                    {reportMoney(displayOther)}
                  </p>
                </div>
              </div>
              <div className={`relative flex min-h-[80px] items-center gap-3 p-3 ${cardShell}`}>
                <span className="absolute end-2 top-2 text-[#9CA3AF] dark:text-gray-500">
                  <Info size={14} />
                </span>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white">
                  <Clock size={20} />
                </span>
                <div className="min-w-0 flex-1 pe-4 text-start">
                  <p className="truncate text-[11px] font-medium text-[#737182] dark:text-gray-300">Total Hours Worked</p>
                  <p className="mt-0.5 truncate text-[15px] font-bold tabular-nums text-gray-900 dark:text-white">
                    {displayHours}
                  </p>
                </div>
              </div>
            </div>

            {/* Sales Overview — DemoSalesTrendChart shell */}
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#D3D6DE] bg-[#E8E8E8] p-3 dark:border-white/10 dark:bg-mintcom-surface">
              <div className="mb-2 flex shrink-0 items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white">Sales Overview</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-mintcom-green px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                    Live
                  </span>
                </div>
                <span className="inline-flex max-w-[160px] items-center gap-1.5 rounded-xl border border-[#D3D6DE] bg-[#E8E8E8] px-2.5 py-1.5 text-[11px] font-semibold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                  Active shift
                  <span className="rounded-xl bg-mintcom-green px-1 py-0.5 text-[8px] font-black text-white">
                    LIVE
                  </span>
                  <ChevronDown size={12} className="text-gray-500" />
                </span>
              </div>

              <div className="mb-1.5 flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[10px] font-semibold">
                {(
                  [
                    { c: '#7dc6a2', l: 'Net sales' },
                    { c: '#A8B8BF', l: 'Cash' },
                    { c: '#737182', l: 'Card' },
                    { c: '#D8A85B', l: 'Other' },
                  ] as const
                ).map((s) => (
                  <span key={s.l} className="inline-flex items-center gap-1.5 text-[#737182] dark:text-gray-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: s.c }} />
                    {s.l}
                  </span>
                ))}
              </div>

              {/* Chart body — Y-axis + plot (mirrors DemoSalesTrendChart) */}
              <div className="relative flex min-h-0 flex-1 gap-1">
                {/* Y-axis ticks + "Sales" title under 0 */}
                <div className="flex w-9 shrink-0 flex-col">
                  <div className="relative min-h-0 flex-1">
                    {yTicks.map((t, idx) => (
                      <span
                        key={`y-${t}`}
                        className="absolute end-0 -translate-y-1/2 pe-1 text-[9px] font-medium tabular-nums leading-none text-gray-500 dark:text-gray-400"
                        style={{ top: `${(idx / (yTicks.length - 1)) * 100}%` }}
                      >
                        {t >= 1000 ? `${(t / 1000).toFixed(t % 1000 === 0 ? 0 : 1)}k` : t}
                      </span>
                    ))}
                  </div>
                  <span className="h-4 shrink-0 pe-1 pt-0.5 text-end text-[9px] font-medium leading-none text-gray-500 dark:text-gray-400">
                    Sales
                  </span>
                </div>

                <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                  <div className="relative min-h-0 flex-1">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                      {/* Dashed horizontal grid like POS */}
                      {[0, 25, 50, 75, 100].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="100"
                          y2={y}
                          stroke="#C5C9D3"
                          strokeWidth="0.6"
                          strokeDasharray="2 2"
                          vectorEffect="non-scaling-stroke"
                        />
                      ))}
                      <polyline
                        fill="none"
                        stroke="#D8A85B"
                        strokeWidth="1.1"
                        vectorEffect="non-scaling-stroke"
                        points={toPoly(otherPts)}
                      />
                      <polyline
                        fill="none"
                        stroke="#A8B8BF"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                        points={toPoly(cashPts)}
                      />
                      <polyline
                        fill="none"
                        stroke="#737182"
                        strokeWidth="1.2"
                        vectorEffect="non-scaling-stroke"
                        points={toPoly(cardPts)}
                      />
                      <polyline
                        fill="none"
                        stroke="#7dc6a2"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        points={toPoly(netPts)}
                      />
                    </svg>
                  </div>
                  <div className="mt-0.5 flex h-4 shrink-0 justify-between text-[9px] font-semibold text-[#737182]">
                    <span>9:00 AM</span>
                    <span>11:00 AM</span>
                    <span>1:00 PM</span>
                    <span>3:00 PM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Fast Staff Onboarding — dashboard Staff page with the real
 * EmployeeFormModal layout (StaffPage → “New Employee” popup).
 */
function OnboardShot() {
  const team = [
    { name: 'Sara Hassan', user: 'sara', role: 'Cashier', active: true },
    { name: 'Omar Ali', user: 'omar', role: 'Barista', active: true },
    { name: 'Maya Nour', user: 'maya', role: 'Manager', active: false },
  ] as const;

  const field = (
    label: string,
    value: string,
    opts?: { required?: boolean; optional?: boolean; trailing?: ReactNode },
  ) => (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1 text-[13px] font-normal tracking-tight text-gray-900 dark:text-gray-200">
        {label}
        {opts?.required && <span className="text-[#D55263]">*</span>}
        {opts?.optional && (
          <span className="text-gray-400 dark:text-gray-500"> (Optional)</span>
        )}
      </p>
      <div className="relative flex h-11 items-center rounded-xl border border-gray-200 bg-gray-50 px-4 text-[13px] font-bold text-gray-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
        <span className="min-w-0 flex-1 truncate">{value}</span>
        {opts?.trailing}
      </div>
    </div>
  );

  return (
    <div
      className="relative flex h-full w-full overflow-hidden font-sans"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      {/* Dashboard Staff page (StaffPage) behind the popup */}
      <div className="absolute inset-0 bg-gray-50 p-4 dark:bg-mintcom-dark">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[22px] font-bold tracking-tight text-gray-900 dark:text-white">Staff</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-gray-500 dark:text-gray-400">
              <span>Manage your team</span>
              <span className="rounded-lg border border-mintcom-green/20 bg-mintcom-green/10 px-2.5 py-0.5 text-[11px] font-bold text-mintcom-green">
                Cafe Delight
              </span>
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-xl bg-mintcom-green px-4 py-2.5 text-[13px] font-bold text-black shadow-sm">
            <Plus size={16} /> Add Staff Member
          </span>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-2.5">
          {(
            [
              { label: 'Total users', value: '4', color: 'text-blue-500', bg: 'bg-blue-500/10', Icon: Users },
              { label: 'Active now', value: '2', color: 'text-mintcom-green', bg: 'bg-mintcom-green/15', Icon: User },
              { label: 'Admins', value: '1', color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-500/10', Icon: Shield },
              { label: 'Standard users', value: '3', color: 'text-orange-500', bg: 'bg-orange-500/10', Icon: Star },
            ] as const
          ).map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-mintcom-surface dark:shadow-none">
              <span className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${s.bg} ${s.color}`}>
                <s.Icon size={16} />
              </span>
              <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-[20px] font-bold tabular-nums text-gray-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-surface dark:shadow-none">
          <div className="grid grid-cols-[1.4fr_1fr_0.9fr_0.7fr] gap-2 border-b border-gray-100 px-4 py-3 text-[11px] font-bold text-gray-500 dark:border-white/10 dark:text-gray-400">
            <span>Employee</span>
            <span>Username</span>
            <span>Role</span>
            <span>Status</span>
          </div>
          {team.map((m) => (
            <div
              key={m.user}
              className="grid grid-cols-[1.4fr_1fr_0.9fr_0.7fr] items-center gap-2 border-b border-gray-50 px-4 py-3 last:border-0 dark:border-white/5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-[11px] font-bold text-mintcom-green">
                  {m.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </span>
                <span className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">{m.name}</span>
              </div>
              <span className="truncate text-[12px] text-gray-500 dark:text-gray-400">{m.user}</span>
              <span className="w-fit rounded-lg border border-mintcom-green/20 bg-mintcom-green/10 px-2 py-0.5 text-[10px] font-bold text-mintcom-green">
                {m.role}
              </span>
              <span className={`text-[12px] font-bold ${m.active ? 'text-mintcom-green' : 'text-gray-400'}`}>
                {m.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Real EmployeeFormModal chrome (dashboard Staff → New Employee) */}
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm dark:bg-black/55">
        {/* font-sans = Inter like .popup-surface (global h2 would force Magilio) */}
        <div className="flex h-full max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white font-sans shadow-2xl dark:border-white/10 dark:bg-mintcom-surface dark:shadow-black/50">
          {/* Header — matches EmployeeFormModal h2: text-xl font-bold tracking-tight */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-white/10 sm:px-8 sm:py-5">
            <p className="font-sans text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              New Employee
            </p>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 dark:text-gray-300">
              <X size={20} />
            </span>
          </div>

          {/* Scrollable body — same field order as EmployeeFormModal */}
          <div className="min-h-0 flex-1 space-y-4 overflow-hidden px-6 py-4 sm:px-8">
            {field('Name', 'Layla Karim', { optional: true })}

            {field('Role', 'Cashier', {
              required: true,
              trailing: <ChevronDown size={16} className="text-gray-400" />,
            })}

            {/* Location disclaimer (dashboard has no establishments prop) */}
            <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5 dark:border-white/10 dark:bg-white/5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mintcom-green/10 text-mintcom-green">
                <MapPin size={16} />
              </span>
              <p className="text-[11px] font-bold leading-relaxed text-gray-500 dark:text-gray-300">
                This employee is added to the current location only. Use the{' '}
                <span className="text-mintcom-green">Owner portal</span> to assign staff across
                multiple locations.
              </p>
            </div>

            {field('Email', 'layla@cafedelight.com', { optional: true })}
            {field('Username', 'layla', { required: true })}
            {field('Phone', '+1 555 0142', { optional: true })}

            <div className="space-y-4 border-t border-gray-100 pt-3 dark:border-white/10">
              {field('Password', '••••••••', {
                required: true,
                trailing: <Eye size={18} className="text-gray-500 dark:text-gray-400" />,
              })}
              <p className="-mt-2 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                At least 8 characters with uppercase, lowercase, and a number.
              </p>
              {field('Confirm Password', '••••••••', {
                required: true,
                trailing: <Eye size={18} className="text-gray-500 dark:text-gray-400" />,
              })}
            </div>
          </div>

          {/* Footer — Cancel + ADD */}
          <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 bg-white px-6 py-4 dark:border-white/10 dark:bg-mintcom-surface sm:gap-4 sm:px-8">
            <span className="flex h-12 flex-1 items-center justify-center rounded-xl border border-gray-200 text-xs font-black tracking-widest text-gray-600 dark:border-white/10 dark:text-gray-300">
              CANCEL
            </span>
            <span className="flex h-12 flex-1 items-center justify-center rounded-xl bg-mintcom-green text-xs font-black tracking-widest text-black shadow-lg shadow-mintcom-green/20">
              ADD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Secure & Reliable — real Admin Portal App Lock
 * (shown when leaving the app and returning: Face ID + password fallback).
 * Layout mirrors AppLockOverlay + auth.login Face ID strings from the portal.
 */
function SecureShot() {
  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden font-sans"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      {/* Soft stage */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#E8F0EC] via-[#F2F6F4] to-[#F8FAF9] dark:from-mintcom-dark dark:via-[#0c1525] dark:to-mintcom-dark" />
      <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-mintcom-green/20 blur-3xl dark:bg-mintcom-green/10" />

      <div className="relative z-10 flex items-center gap-8 px-8">
        {/* ── Hero phone: App Lock (leave app → return) ── */}
        <div className="relative shrink-0" style={{ width: 286, height: 568 }}>
          {/* Soft phone shadow plate */}
          <div
            className="absolute -inset-x-6 -bottom-4 top-10 rounded-[48px] bg-mintcom-green/15 blur-2xl dark:bg-mintcom-green/10"
            aria-hidden
          />
          <div className="absolute inset-0 overflow-hidden rounded-[42px] border-[7px] border-[#1a1a1e] bg-[#1a1a1e] shadow-[0_36px_72px_-16px_rgba(0,0,0,0.55)]">
            <span className="absolute -start-[9px] top-[108px] h-7 w-[3px] rounded-s-sm bg-[#2a2a30]" />
            <span className="absolute -start-[9px] top-[148px] h-12 w-[3px] rounded-s-sm bg-[#2a2a30]" />
            <span className="absolute -start-[9px] top-[210px] h-12 w-[3px] rounded-s-sm bg-[#2a2a30]" />
            <span className="absolute -end-[9px] top-[168px] h-16 w-[3px] rounded-e-sm bg-[#2a2a30]" />

            {/* Pure white lock canvas — matches real resume lock UI */}
            <div className="flex h-full flex-col overflow-hidden rounded-[35px] bg-white dark:bg-[#12141A]">
              {/* Status bar */}
              <div className="relative flex shrink-0 items-center justify-between px-5 pb-0.5 pt-3 text-gray-900 dark:text-white">
                <span className="w-12 text-[11px] font-semibold tracking-tight">9:41</span>
                <div className="absolute left-1/2 top-[7px] h-[24px] w-[96px] -translate-x-1/2 rounded-full bg-black" />
                <div className="flex w-14 items-center justify-end gap-[3px] opacity-90">
                  <span className="h-[6px] w-[7px] rounded-[1px] bg-gray-900 dark:bg-white" />
                  <span className="h-[8px] w-[7px] rounded-[1px] bg-gray-900 dark:bg-white" />
                  <span className="h-[10px] w-[7px] rounded-[1px] bg-gray-900 dark:bg-white" />
                  <span className="ms-0.5 h-[10px] w-[18px] rounded-[3px] border border-gray-900 dark:border-white">
                    <span className="m-[1.5px] block h-[calc(100%-3px)] w-[72%] rounded-[1px] bg-gray-900 dark:bg-white" />
                  </span>
                </div>
              </div>

              {/* Sheet grabber (modal sheet feel) */}
              <div className="flex shrink-0 justify-center pt-2.5 pb-1">
                <span className="h-[4px] w-10 rounded-full bg-gray-200 dark:bg-white/15" />
              </div>

              {/* Lock content */}
              <div className="flex min-h-0 flex-1 flex-col px-6 pb-3 pt-5">
                <div className="flex flex-col items-center text-center">
                  <p className="text-[14px] font-semibold text-gray-400 dark:text-gray-400">
                    Welcome back
                  </p>
                  <p className="mt-1 text-[26px] font-black leading-none tracking-tight text-[#0F172A] dark:text-white">
                    Sara Hassan
                  </p>
                </div>

                {/* Face ID card — portal biometricPrompt / scanFace copy */}
                <div className="mt-7 flex w-full flex-col items-center rounded-[22px] border border-gray-100 bg-[#FBFCFD] px-5 py-8 shadow-[0_1px_0_rgba(15,23,42,0.03),0_12px_32px_-18px_rgba(15,23,42,0.18)] dark:border-white/10 dark:bg-white/[0.04]">
                  <span className="mb-5 flex h-[64px] w-[64px] items-center justify-center text-mintcom-green">
                    <ScanFace size={48} strokeWidth={1.35} className="text-mintcom-green" />
                  </span>
                  <p className="text-center text-[17px] font-black leading-snug tracking-tight text-[#0F172A] dark:text-white">
                    Enter app using Face
                    <br />
                    ID
                  </p>
                  <p className="mt-2.5 text-center text-[13px] font-medium leading-snug text-gray-400 dark:text-gray-400">
                    Scan your face to continue.
                  </p>
                </div>

                {/* Password fallback + Log In */}
                <div className="mt-auto w-full space-y-3.5 pt-6">
                  <div className="flex h-[50px] items-center rounded-2xl border border-gray-100 bg-[#F7F8FA] px-4 dark:border-white/10 dark:bg-white/[0.05]">
                    <Lock size={16} className="me-3 shrink-0 text-mintcom-green" strokeWidth={2.1} />
                    <span className="flex-1 text-[15px] font-bold tracking-[0.28em] text-gray-300 dark:text-gray-500">
                      ••••••••
                    </span>
                    <Eye size={16} className="shrink-0 text-gray-300 dark:text-gray-500" strokeWidth={2} />
                  </div>
                  <span className="flex h-[50px] w-full items-center justify-center rounded-2xl bg-mintcom-green text-[16px] font-bold !text-white shadow-[0_10px_24px_-8px_rgba(125,198,162,0.55)]">
                    Log In
                  </span>
                </div>
              </div>

              {/* Home indicator */}
              <div className="flex shrink-0 justify-center bg-white pb-2.5 pt-1 dark:bg-[#12141A]">
                <span
                  className="h-[5px] w-[118px] rounded-full bg-gray-900/90 dark:bg-white/90"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Side copy: what this screen is ── */}
        <div className="flex w-[min(320px,100%)] flex-col gap-3.5">
          <div className="rounded-2xl border border-gray-200/90 bg-white/90 p-4 shadow-lg shadow-black/5 backdrop-blur-sm dark:border-white/10 dark:bg-mintcom-surface/95 dark:shadow-black/40">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                <Lock size={18} strokeWidth={2.25} />
              </span>
              <div>
                <p className="text-[15px] font-black tracking-tight text-gray-900 dark:text-white">
                  App Lock
                </p>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                  When you leave &amp; return
                </p>
              </div>
            </div>
            <p className="text-[12px] font-medium leading-relaxed text-gray-600 dark:text-gray-300">
              The moment Mintcom goes to the background, the session locks. Come back and unlock with Face ID, or use your password.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-md shadow-black/5 dark:border-white/10 dark:bg-mintcom-surface">
            <div className="flex items-center justify-between bg-mintcom-green px-3.5 py-2.5 text-white">
              <Menu size={15} strokeWidth={2.25} />
              <p className="text-[12px] font-bold tracking-tight">App Settings</p>
              <Bell size={14} strokeWidth={2.25} className="opacity-90" />
            </div>
            <div className="space-y-0 p-2">
              <div className="flex items-center gap-2.5 rounded-xl px-2 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/12 text-mintcom-green">
                  <ScanFace size={16} strokeWidth={2} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-extrabold text-gray-900 dark:text-white">Face ID</p>
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    Biometric unlock on resume
                  </p>
                </div>
                <span className="relative h-5 w-9 shrink-0 rounded-full bg-mintcom-green">
                  <span className="absolute end-[2px] top-[2px] h-4 w-4 rounded-full bg-white shadow-sm" />
                </span>
              </div>
              <div className="mx-2 h-px bg-gray-100 dark:bg-white/10" />
              <div className="flex items-center gap-2.5 rounded-xl px-2 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/12 text-mintcom-green">
                  <Smartphone size={16} strokeWidth={2.25} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-extrabold text-gray-900 dark:text-white">
                    Auto-lock when closed
                  </p>
                  <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                    Always on for security
                  </p>
                </div>
                <CircleCheck size={18} className="shrink-0 text-mintcom-green" strokeWidth={2.25} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-mintcom-green/25 bg-gradient-to-br from-mintcom-green/15 to-mintcom-green/5 px-3.5 py-3">
            <div className="flex items-center gap-2 text-[11px] font-bold text-mintcom-green">
              <CircleCheck size={13} strokeWidth={2.5} />
              Face ID on · Auto-lock on
            </div>
            <p className="mt-1 text-[11px] font-medium leading-snug text-gray-800 dark:text-white/90">
              Background the app → lock screen. Unlock with Face ID or password.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Loyalty modal (FullPosPlayground LoyaltyModal FOUND state) ────────── */

function LoyaltyShot() {
  return (
    <div className="flex h-full w-full overflow-hidden" style={{ width: DESIGN_W, height: DESIGN_H }}>
      <PosRail active="sales" />
      <div className="relative flex min-w-0 flex-1 overflow-hidden bg-[#f6f3ec] dark:bg-mintcom-dark">
        {/* Dimmed sales grid behind */}
        <div className="flex min-w-0 flex-1 flex-col opacity-35">
          <div className="border-b border-gray-100 dark:border-white/10 bg-white dark:bg-mintcom-surface px-4 py-3">
            <p className="text-[13px] font-bold text-gray-500">Sales · Order #41</p>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 p-3">
            {['Espresso', 'Latte', 'Croissant', 'Muffin', 'Cookie', 'Tea'].map((n) => (
              <div key={n} className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-mintcom-surface p-2">
                <div className="mb-1 flex h-12 items-center justify-center rounded-lg bg-[#F8FAF9] dark:bg-[#F3F4F6]">
                  <img src={DEFAULT_IMG} alt="" className="h-10 w-10 object-contain" />
                </div>
                <p className="text-[11px] font-bold">{n}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4">
          <div className="flex h-full max-h-[500px] w-[380px] flex-col overflow-hidden rounded-xl bg-white dark:bg-mintcom-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Heart size={18} className="text-mintcom-green" />
                <p className="text-[15px] font-bold text-gray-900 dark:text-white">Loyalty</p>
              </div>
              <X size={18} className="text-gray-400" />
            </div>
            {/* Tabs like real modal */}
            <div className="flex border-b border-gray-100 dark:border-white/10">
              {[
                { label: 'Search', icon: Search },
                { label: 'Scan QR', icon: Hash },
                { label: 'New Customer', icon: User },
              ].map((t, i) => (
                <span
                  key={t.label}
                  className={`flex flex-1 items-center justify-center gap-1 py-2.5 text-[11px] font-bold ${
                    i === 0 ? 'border-b-2 border-mintcom-green text-mintcom-green' : 'text-gray-400'
                  }`}
                >
                  <t.icon size={13} />
                  {t.label}
                </span>
              ))}
            </div>
            <div className="border-b border-gray-50 px-4 py-3.5 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mintcom-green text-[14px] font-bold text-white">
                  NA
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold text-gray-900 dark:text-white">Nora Alami</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-400">+1 555 0142 · Gold</p>
                </div>
                <div className="text-end">
                  <p className="text-[20px] font-extrabold tabular-nums text-mintcom-green">1,240</p>
                  <p className="text-[10px] font-bold uppercase text-gray-400">points</p>
                </div>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-2 overflow-hidden p-3.5">
              <p className="text-[11px] font-black uppercase tracking-wide text-mintcom-green">
                <Gift size={12} className="me-1 inline" />
                Rewards
              </p>
              {[
                { name: 'Free coffee', pts: 100, type: 'Free Item' },
                { name: '10% off order', pts: 250, type: '10% off' },
              ].map((r) => (
                <div
                  key={r.name}
                  className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#fafaf9] px-3 py-2.5 dark:border-white/10 dark:bg-mintcom-dark"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                    <Gift size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-gray-900 dark:text-white">{r.name}</p>
                    <p className="text-[11px] text-gray-400">
                      {r.type} · {r.pts} points
                    </p>
                  </div>
                  <span className="rounded-lg bg-mintcom-green px-2.5 py-1.5 text-[11px] font-bold text-white">
                    Apply
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-white/10 px-4 py-3">
              <span className="flex w-full items-center justify-center rounded-xl bg-mintcom-green py-3 text-[13px] font-bold text-white">
                Attach to order
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile App & Real-Time Notifications —
 * Admin portal Owner Notifications feed (AdminPortalAlertsView) + iOS push banner.
 */
function MobileShot() {
  // Tone colors match AdminPortalAlertsView (SHORTAGE / STOCK / WARNING)
  const SHORTAGE = '#D55263';
  const STOCK = '#4F46E5';
  const WARNING = '#D0A62A';

  const alerts = [
    {
      title: 'Shortage - Sara',
      desc: 'Expected $420.00 - Counted $395.50',
      pill: '-$24.50',
      loc: 'Downtown',
      time: 'Just now',
      color: SHORTAGE,
      bg: '#D5526312',
      Icon: AlertTriangle,
      unread: true,
    },
    {
      title: 'Low stock',
      desc: 'Espresso beans has 4 units remaining',
      pill: '4 left',
      loc: 'Mall Branch',
      time: '12m ago',
      color: STOCK,
      bg: '#4F46E512',
      Icon: Package,
      unread: true,
    },
    {
      title: 'Refund',
      desc: 'Order #4218 refunded by Omar',
      pill: 'Refund',
      loc: 'Downtown',
      time: '1h ago',
      color: WARNING,
      bg: '#D0A62A12',
      Icon: RotateCcw,
      unread: false,
    },
    {
      title: 'Critical stock',
      desc: 'Whole milk has 1 L remaining',
      pill: '1 left',
      loc: 'Downtown',
      time: '3h ago',
      color: SHORTAGE,
      bg: '#D5526312',
      Icon: AlertOctagon,
      unread: false,
    },
  ] as const;

  const tabs = [
    { id: 'all', label: 'All', count: 12 },
    { id: 'cash', label: 'Cash', count: 3 },
    { id: 'stock', label: 'Stock', count: 5 },
    { id: 'refunds', label: 'Refunds', count: 2 },
  ] as const;

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden font-sans"
      style={{ width: DESIGN_W, height: DESIGN_H }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#e8f5ef] via-[#f4f7f5] to-[#dfece6] dark:from-mintcom-dark dark:via-[#0c1525] dark:to-mintcom-dark" />
      <div className="absolute -left-10 top-12 h-48 w-48 rounded-full bg-mintcom-green/25 blur-3xl dark:bg-mintcom-green/15" />
      <div className="absolute -right-8 bottom-8 h-52 w-52 rounded-full bg-[#7dc6a2]/20 blur-3xl dark:bg-mintcom-green/10" />

      <div className="relative z-10 flex items-center gap-9">
        {/* Phone + floating lock-screen push */}
        <div className="relative" style={{ width: 286, height: 560 }}>
          {/*
            iOS-style push banner — sits above the phone so it reads as a
            real system notification (AdminPortalAlertsView cash shortage).
          */}
          <div className="absolute -top-1 left-1/2 z-40 w-[268px] -translate-x-1/2">
            {/* iOS push — light glass in light mode, solid product surface in dark (must beat bg-white/90) */}
            <div className="rounded-[20px] border border-black/5 bg-white/95 p-2.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.35)] backdrop-blur-xl dark:border-white/12 dark:!bg-mintcom-surface dark:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)] dark:backdrop-blur-none">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-mintcom-green shadow-sm">
                  <img
                    src={MintcomLeafIcon}
                    alt=""
                    className="h-6 w-6 object-contain brightness-0 invert"
                    draggable={false}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:!text-gray-400">
                      Mintcom
                    </p>
                    <p className="text-[10px] font-semibold text-gray-400 dark:!text-gray-500">now</p>
                  </div>
                  <p className="mt-0.5 text-[13px] font-bold leading-tight text-gray-900 dark:!text-white">
                    Shortage - Sara
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-gray-600 dark:!text-gray-300">
                    Expected $420.00 - Counted $395.50 · Downtown
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* iPhone frame */}
          <div className="absolute inset-x-0 bottom-0 top-7 overflow-hidden rounded-[40px] border-[7px] border-[#1a1a1e] bg-[#1a1a1e] shadow-[0_30px_70px_-16px_rgba(0,0,0,0.5)]">
            <span className="absolute -start-[9px] top-[110px] h-7 w-[3px] rounded-s-sm bg-[#2a2a30]" />
            <span className="absolute -start-[9px] top-[150px] h-12 w-[3px] rounded-s-sm bg-[#2a2a30]" />
            <span className="absolute -end-[9px] top-[170px] h-16 w-[3px] rounded-e-sm bg-[#2a2a30]" />

            <div className="flex h-full flex-col overflow-hidden rounded-[33px] bg-[#F5F7F6] dark:bg-mintcom-dark">
              {/* Status + Dynamic Island */}
              <div className="relative flex shrink-0 items-center justify-between bg-mintcom-green px-5 pb-1 pt-3 text-white">
                <span className="w-12 text-[11px] font-semibold">9:41</span>
                <div className="absolute left-1/2 top-2 h-[24px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
                <div className="flex w-14 justify-end gap-0.5 opacity-90">
                  <span className="h-1.5 w-2.5 rounded-sm bg-white" />
                  <span className="h-1.5 w-2.5 rounded-sm bg-white" />
                  <span className="h-2 w-4 rounded-sm border border-white/90" />
                </div>
              </div>

              {/* OwnerScreenHeader strip (green) */}
              <div className="flex shrink-0 items-center justify-between bg-mintcom-green px-4 pb-3 pt-1 text-white">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">
                    All locations
                  </p>
                  <p className="text-[18px] font-black tracking-tight">Notifications</p>
                </div>
                <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
                  <Bell size={16} />
                  <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D55263] px-1 text-[9px] font-black">
                    4
                  </span>
                </span>
              </div>

              {/* Tabs — All / Cash / Stock / Refunds */}
              <div className="flex shrink-0 gap-1.5 overflow-hidden bg-white dark:bg-mintcom-surface px-3 py-2.5 shadow-sm">
                {tabs.map((t, i) => (
                  <span
                    key={t.id}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                      i === 0
                        ? 'bg-mintcom-green text-black'
                        : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300'
                    }`}
                  >
                    {t.label}
                    <span
                      className={`rounded-md px-1 text-[9px] font-black ${
                        i === 0 ? 'bg-black/10' : 'bg-white text-gray-400 dark:bg-white/10 dark:text-gray-400'
                      }`}
                    >
                      {t.count}
                    </span>
                  </span>
                ))}
              </div>

              {/* Feed cards — AdminPortalAlertsView layout */}
              <div className="min-h-0 flex-1 space-y-0 overflow-hidden bg-white dark:bg-mintcom-surface">
                {alerts.map((a, idx) => {
                  const Icon = a.Icon;
                  return (
                    <div
                      key={a.title}
                      className={`relative flex items-start gap-2.5 px-3 py-3 ${
                        idx < alerts.length - 1 ? 'border-b border-gray-100 dark:border-white/10' : ''
                      }`}
                    >
                      {a.unread && (
                        <span
                          className="absolute start-0 top-3 bottom-3 w-[3px] rounded-e-full"
                          style={{ backgroundColor: a.color }}
                        />
                      )}
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: a.bg, color: a.color }}
                      >
                        <Icon size={17} strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 text-[13px] font-bold leading-snug text-gray-900 dark:text-white">
                            {a.title}
                          </p>
                          <p className="shrink-0 text-[10px] font-semibold text-gray-400">
                            {a.time}
                          </p>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-gray-500 dark:text-gray-400">
                          {a.desc}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-black"
                            style={{ backgroundColor: a.bg, color: a.color }}
                          >
                            {a.pill}
                          </span>
                          <span className="truncate text-[10px] font-semibold text-gray-400">
                            {a.loc}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* iOS home indicator — always readable in light + dark */}
              <div className="relative shrink-0 bg-white dark:bg-mintcom-surface">
                <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-white/12" />
                <div className="flex items-center justify-center pb-2.5 pt-2">
                  <span
                    className="h-[5px] w-[118px] rounded-full bg-gray-900 shadow-[0_1px_2px_rgba(0,0,0,0.18)] dark:bg-white/90 dark:shadow-[0_0_14px_rgba(255,255,255,0.18)]"
                    aria-hidden
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side story */}
        <div className="flex w-[260px] flex-col gap-3">
          <div className="rounded-2xl border border-white/90 bg-white/95 p-4 shadow-lg shadow-black/5 dark:border-white/10 dark:bg-mintcom-surface dark:shadow-black/40">
            <div className="mb-2 flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                <Bell size={18} />
              </span>
              <div>
                <p className="text-[14px] font-bold text-gray-900 dark:text-white">Owner notifications</p>
                <p className="text-[11px] font-semibold text-mintcom-green">Live push + in-app feed</p>
              </div>
            </div>
            <p className="text-[12px] leading-relaxed text-gray-500 dark:text-gray-400">
              Cash shortage, stock, and refunds, the same feed as the admin portal Notifications
              screen.
            </p>
          </div>

          <div className="rounded-2xl border border-white/90 bg-white/95 p-4 shadow-lg dark:border-white/10 dark:bg-mintcom-surface dark:shadow-black/40">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Alert types
            </p>
            <div className="space-y-1.5">
              {(
                [
                  { c: SHORTAGE, l: 'Cash shortage / overage' },
                  { c: STOCK, l: 'Low & critical stock' },
                  { c: WARNING, l: 'Refunds & updates' },
                ] as const
              ).map((x) => (
                <div key={x.l} className="flex items-center gap-2 text-[12px] font-semibold text-gray-700 dark:text-gray-300">
                  <span className="h-2 w-2 rounded-full" style={{ background: x.c }} />
                  {x.l}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-mintcom-green/20 bg-gradient-to-br from-mintcom-green/15 to-mintcom-green/5 p-4">
            <div className="flex items-center gap-2 text-[12px] font-bold text-mintcom-green">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mintcom-green opacity-45" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mintcom-green" />
              </span>
              Real-time push
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-snug text-gray-900 dark:text-white/90">
              Banners land on the lock screen. Tap one to open the matching tab.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Router ────────────────────────────────────────────────────────────── */

const ALL_STATIC_IDS = [
  'pointOfSale',
  'salesControl',
  'staffManagement',
  'advancedReporting',
  'production',
  'aiSystem',
  'multiBranch',
  'simpleUI',
  'fastOnboarding',
  'secure',
  'loyalty',
  'mobileApp',
] as const;

export const STATIC_FEATURE_SCREENSHOTS = new Set<string>(ALL_STATIC_IDS);

export function isStaticFeatureScreenshot(featureId?: string) {
  return Boolean(featureId && STATIC_FEATURE_SCREENSHOTS.has(featureId));
}

export function hasFeatureScreenshot(featureId?: string) {
  return isStaticFeatureScreenshot(featureId);
}

const TITLES: Record<string, string> = {
  salesControl: 'Payment processes',
  staffManagement: 'Employees',
  advancedReporting: 'Reporting',
  production: 'Recipe operations',
  aiSystem: 'AI Assistant',
  multiBranch: 'Owner brands',
  simpleUI: 'Dashboard',
  fastOnboarding: 'Add staff',
  secure: 'Face ID app lock',
  loyalty: 'Loyalty',
  mobileApp: 'Mobile',
};

export function FeatureScreenshot({
  featureId,
  side,
  fill,
}: {
  featureId?: string;
  side?: boolean;
  fill?: boolean;
}) {
  if (!featureId) return null;
  if (featureId === 'pointOfSale') {
    return <FeaturePosScreenshot side={side} fill={fill} />;
  }

  const title = TITLES[featureId] ?? 'Mintcom POS';
  let body: ReactNode = null;
  let bg = '#F5F5F7';
  switch (featureId) {
    case 'salesControl':
      body = <SalesControlShot />;
      break;
    case 'staffManagement':
      body = <StaffShot />;
      break;
    case 'advancedReporting':
      body = <ReportingShot />;
      break;
    case 'production':
      body = <ProductionShot />;
      break;
    case 'aiSystem':
      body = <AiShot />;
      bg = 'transparent';
      break;
    case 'multiBranch':
      body = <BranchShot />;
      break;
    case 'simpleUI':
      body = <SimpleUiShot />;
      break;
    case 'fastOnboarding':
      body = <OnboardShot />;
      break;
    case 'secure':
      body = <SecureShot />;
      bg = 'transparent';
      break;
    case 'loyalty':
      body = <LoyaltyShot />;
      bg = '#f6f3ec';
      break;
    case 'mobileApp':
      body = <MobileShot />;
      bg = 'transparent';
      break;
    default:
      return null;
  }

  return (
    <FeatureShotFrame title={title} side={side} fill={fill} bg={bg}>
      {body}
    </FeatureShotFrame>
  );
}

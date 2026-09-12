/**
 * Demo Reports — mirrors mintcom-pos ReportsScreen layout & features:
 * - Header: Reporting + print + employee filter
 * - When an employee is selected: shift dropdown (same as POS)
 * - Quick ranges: Today / Last 7 / Last 30 / This month + custom
 * - Tabs: General report | Item report
 * - Summary cards: Net, Card, Cash, Refunds, Other, Orders, Time worked, Pay in/out
 * - Orders & receipts list (filter, detail, print, refund demo)
 * - Top selling items
 * - Item report: Items / Categories / Modifiers + related orders
 * Demo data from live shift.sales + realistic seed history. No invented product features.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createInitialCatalog } from './demoCatalog';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Box,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleCheck,
  Clock,
  Coffee,
  Eye,
  Filter,
  Info,
  MoreHorizontal,
  Package,
  Pencil,
  Percent,
  Printer,
  Receipt,
  ShoppingBag,
  SlidersHorizontal,
  Tag,
  TrendingUp,
  Undo2,
  User,
  UtensilsCrossed,
  Wallet,
  X,
} from 'lucide-react';
import type { DemoSale, DemoShift } from './PosDemoExtraScreens';
import { DemoRefundModal, type RefundResult } from './PosDemoRefund';
import type { OrderTender } from './posFeedback';
import {
  PosCardIcon,
  PosCashIcon,
  PosOtherReceiptIcon,
} from './posPaymentIcons';

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/* ─── Order filter journey (mirrors mintcom-pos ReportsScreen Order Filter Modal) ── */

const FILTER_STEPS = [
  { key: 'payment', title: 'Payment Method' },
  { key: 'status', title: 'Status' },
  { key: 'discount', title: 'Discount' },
] as const;

const DEMO_CARD_TYPES = [
  { value: 'Visa', label: 'Visa', color: '#1A1F71' },
  { value: 'Mastercard', label: 'Mastercard', color: '#EB001B' },
  { value: 'Amex', label: 'Amex', color: '#2E77BC' },
] as const;

const DEMO_OTHER_METHODS = [
  { id: 'cliq', name: 'CliQ' },
  { id: 'talabat', name: 'Talabat' },
  { id: 'voucher', name: 'Voucher' },
] as const;

const DEMO_DISCOUNTS = [
  { id: 'staff-10', name: 'Staff 10%' },
  { id: 'happy-hour', name: 'Happy Hour' },
  { id: 'loyalty', name: 'Loyalty Reward' },
] as const;

type PayMethodFilter = null | 'CASH' | 'CARD' | 'OTHER';
type StatusFilter = null | 'COMPLETED' | 'PAID_TAX_CHANGED' | 'REFUNDED';
/** POS discount filter tokens: HAS_DISCOUNT | NO_DISCOUNT | specific discount id */
type DiscountFilterToken = string;

type OrderFilterState = {
  payment: PayMethodFilter;
  cardTypes: string[];
  otherMethods: string[];
  status: StatusFilter;
  discounts: DiscountFilterToken[];
};

const EMPTY_ORDER_FILTERS: OrderFilterState = {
  payment: null,
  cardTypes: [],
  otherMethods: [],
  status: null,
  discounts: [],
};

function countOrderFilters(f: OrderFilterState): number {
  let n = 0;
  if (f.payment && f.cardTypes.length === 0 && f.otherMethods.length === 0) n += 1;
  n += f.cardTypes.length;
  n += f.otherMethods.length;
  if (f.status) n += 1;
  n += f.discounts.length;
  return n;
}

function orderFiltersActive(f: OrderFilterState): boolean {
  return countOrderFilters(f) > 0;
}

/* ─── Demo employee shifts (mirrors POS shift filter after employee pick) ── */

type DemoReportShift = {
  id: string;
  start: number;
  end: number | null;
  label: string;
};

type ShiftLogRow = {
  id: string;
  employeeName: string;
  type: 'open' | 'close';
  at: number;
  amount: number;
  isAuto?: boolean;
};

function dayKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatShiftLabel(start: number, end: number | null) {
  const startStr = new Date(start).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  if (end == null) return `${startStr} - Open`;
  const endStr = new Date(end).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${startStr} - ${endStr}`;
}

/** Build shift options for an employee from their orders (+ live open shift). */
function buildEmployeeShifts(
  orders: ReportOrder[],
  employeeName: string,
  liveShift: DemoShift,
): DemoReportShift[] {
  const mine = orders.filter((o) => o.employeeName === employeeName);
  const byDay = new Map<string, { min: number; max: number }>();
  for (const o of mine) {
    const key = dayKey(o.at);
    const cur = byDay.get(key);
    if (!cur) byDay.set(key, { min: o.at, max: o.at });
    else {
      cur.min = Math.min(cur.min, o.at);
      cur.max = Math.max(cur.max, o.at);
    }
  }

  const result: DemoReportShift[] = [];
  const liveDay =
    liveShift.open && liveShift.startedAt && employeeName === 'You'
      ? dayKey(liveShift.startedAt)
      : null;

  if (liveShift.open && liveShift.startedAt && employeeName === 'You') {
    result.push({
      id: 'live-open',
      start: liveShift.startedAt,
      end: null,
      label: formatShiftLabel(liveShift.startedAt, null),
    });
  }

  const days = Array.from(byDay.entries()).sort((a, b) => b[1].min - a[1].min);
  for (const [key, { min, max }] of days) {
    if (liveDay && key === liveDay) continue; // covered by open shift
    const start = min - 20 * 60_000;
    const end = max + 15 * 60_000;
    result.push({
      id: `shift-${key}`,
      start,
      end,
      label: formatShiftLabel(start, end),
    });
  }

  // If employee has no order-derived shifts, seed a couple of realistic closed shifts
  if (result.length === 0) {
    const now = Date.now();
    const mk = (daysAgo: number, openH: number, closeH: number, id: string): DemoReportShift => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const start = d.getTime() - daysAgo * 86400_000 + openH * 3600_000;
      const end = d.getTime() - daysAgo * 86400_000 + closeH * 3600_000;
      if (end > now && daysAgo === 0) {
        return { id, start, end: null, label: formatShiftLabel(start, null) };
      }
      return { id, start, end, label: formatShiftLabel(start, end) };
    };
    result.push(mk(0, 9, 17, `seed-${employeeName}-today`));
    result.push(mk(1, 10, 18, `seed-${employeeName}-yest`));
    result.push(mk(3, 9, 16, `seed-${employeeName}-mid`));
  }

  return result;
}

/* ─── Seed history (when shift has few sales) ───────────────────────────── */

type ReportLine = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  emoji: string;
  image?: string | null;
  category: string;
};

/** Cafe Delight demo photos — same set served from public/demo-products as the Sales screen */
const REPORT_ITEM_IMAGES: Record<string, string> = {
  Espresso: '/demo-products/espresso.jpg',
  Latte: '/demo-products/latte.jpg',
  Cappuccino: '/demo-products/cappuccino.jpg',
  Croissant: '/demo-products/croissant.jpg',
  Muffin: '/demo-products/muffin.jpg',
  Bagel: '/demo-products/bagel.jpg',
  'Garden Salad': '/demo-products/salad.jpg',
  'Club Sandwich': '/demo-products/sandwich.jpg',
  Cheesecake: '/demo-products/cheesecake.jpg',
  Brownie: '/demo-products/brownie.jpg',
};

/* ─── Price/change history — POS PriceAuditModal (clock badge on item rows) ─── */

type PriceHistoryEntry = {
  id: string;
  itemName: string;
  field: 'price';
  oldPrice: number;
  newPrice: number;
  changedByName: string;
  createdAt: number;
};

const ITEM_CURRENT_PRICE: Record<string, number> = {
  Latte: 4.5,
  Croissant: 4,
  Espresso: 3.5,
  'Club Sandwich': 7.5,
  'Garden Salad': 6.5,
  Cappuccino: 4.25,
  Cheesecake: 5.5,
  Brownie: 3.5,
  Muffin: 3.25,
  Bagel: 3.75,
};

/** Only some items carry a price-change record — mirrors real catalogs where most items never get edited */
function seedPriceHistory(): Record<string, PriceHistoryEntry[]> {
  const now = Date.now();
  const changedBy = ['Sam Cashier', 'Emma Thompson', 'You'];
  const map: Record<string, PriceHistoryEntry[]> = {};
  let i = 0;
  for (const [name, price] of Object.entries(ITEM_CURRENT_PRICE)) {
    if (i % 2 === 0) {
      const oldPrice = +(price - (0.25 + (i % 3) * 0.25)).toFixed(2);
      map[name] = [
        {
          id: `hist-price-${name}`,
          itemName: name,
          field: 'price',
          oldPrice,
          newPrice: price,
          changedByName: changedBy[i % changedBy.length],
          createdAt: now - (3 + i) * 86400_000,
        },
      ];
    }
    i += 1;
  }
  return map;
}

type ReportOrder = {
  id: string;
  orderNo: number;
  total: number;
  tax: number;
  subtotal: number;
  discount: number;
  method: 'cash' | 'card' | 'other' | 'split';
  methodLabel: string;
  cardType?: string;
  status: 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  at: number;
  employeeName: string;
  items: string;
  lines: ReportLine[];
  customer?: string;
  isRefunded?: boolean;
  refundReason?: string;
  refundedLineQty?: Record<string, number>;
  refundedAmount?: number;
  tenders?: OrderTender[];
};

type LocalRefundState = {
  full: boolean;
  reason: string;
  lineQty: Record<string, number>;
  amount: number;
};

const CATS = ['Beverages', 'Pastries', 'Food', 'Desserts'] as const;

function seedHistory(): ReportOrder[] {
  const now = Date.now();
  const withIds = (
    lines: Omit<ReportLine, 'id'>[],
    prefix: string,
  ): ReportLine[] =>
    lines.map((l, idx) => ({
      ...l,
      id: `${prefix}-L${idx}`,
      image: REPORT_ITEM_IMAGES[l.name] ?? null,
    }));

  const mk = (
    i: number,
    hoursAgo: number,
    method: ReportOrder['method'],
    rawLines: Omit<ReportLine, 'id'>[],
    extra?: Partial<ReportOrder>,
  ): ReportOrder => {
    const lines = withIds(rawLines, `hist-${i}`);
    const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
    const tax = +(subtotal * 0.08).toFixed(2);
    const total = +(subtotal + tax - (extra?.discount ?? 0)).toFixed(2);
    const fullRefund = extra?.status === 'REFUNDED';
    return {
      id: `hist-${i}`,
      orderNo: 1000 + i,
      total,
      tax,
      subtotal,
      discount: extra?.discount ?? 0,
      method,
      methodLabel:
        method === 'cash' ? 'Cash' : method === 'card' ? `Card · ${extra?.cardType ?? 'Visa'}` : extra?.methodLabel ?? 'CliQ',
      cardType: extra?.cardType,
      status: extra?.status ?? 'COMPLETED',
      at: now - hoursAgo * 3600_000,
      employeeName: extra?.employeeName ?? (i % 3 === 0 ? 'Chloe Davis' : i % 2 === 0 ? 'Jake Miller' : 'Emma Thompson'),
      items: lines.map((l) => `${l.emoji} ${l.name}${l.qty > 1 ? ` ×${l.qty}` : ''}`).join(' · '),
      lines,
      customer: extra?.customer,
      isRefunded: fullRefund,
      refundReason: extra?.refundReason,
      refundedLineQty: fullRefund
        ? Object.fromEntries(lines.map((l) => [l.id, l.qty]))
        : undefined,
      refundedAmount: fullRefund ? total : undefined,
    };
  };

  return [
    mk(1, 1, 'card', [
      { name: 'Latte', qty: 2, unitPrice: 4.5, emoji: '☕', category: 'Beverages' },
      { name: 'Croissant', qty: 1, unitPrice: 4, emoji: '🥐', category: 'Pastries' },
    ], { cardType: 'Visa' }),
    mk(2, 2, 'cash', [
      { name: 'Espresso', qty: 1, unitPrice: 3.5, emoji: '☕', category: 'Beverages' },
    ]),
    mk(3, 3, 'other', [
      { name: 'Club Sandwich', qty: 1, unitPrice: 7.5, emoji: '🥪', category: 'Food' },
      { name: 'Garden Salad', qty: 1, unitPrice: 6.5, emoji: '🥗', category: 'Food' },
    ], { methodLabel: 'CliQ' }),
    mk(4, 4, 'card', [
      { name: 'Cappuccino', qty: 2, unitPrice: 4.25, emoji: '☕', category: 'Beverages' },
      { name: 'Cheesecake', qty: 1, unitPrice: 5.5, emoji: '🍰', category: 'Desserts' },
    ], { cardType: 'Mastercard', customer: 'Emma W.' }),
    mk(5, 5, 'cash', [
      { name: 'Latte', qty: 1, unitPrice: 4.5, emoji: '☕', category: 'Beverages' },
      { name: 'Brownie', qty: 2, unitPrice: 3.5, emoji: '🍫', category: 'Desserts' },
    ], { discount: 1.5, employeeName: 'Jake Miller' }),
    mk(6, 6, 'card', [
      { name: 'Espresso', qty: 3, unitPrice: 3.5, emoji: '☕', category: 'Beverages' },
    ], { cardType: 'Visa', employeeName: 'Emma Thompson' }),
    mk(7, 7, 'other', [
      { name: 'Club Sandwich', qty: 2, unitPrice: 7.5, emoji: '🥪', category: 'Food' },
    ], { methodLabel: 'Talabat', employeeName: 'Chloe Davis' }),
    mk(8, 8, 'cash', [
      { name: 'Croissant', qty: 4, unitPrice: 4, emoji: '🥐', category: 'Pastries' },
    ], { employeeName: 'Jake Miller' }),
    mk(9, 9, 'card', [
      { name: 'Latte', qty: 1, unitPrice: 4.5, emoji: '☕', category: 'Beverages' },
    ], { status: 'REFUNDED', cardType: 'Visa', refundReason: 'Wrong order', employeeName: 'Emma Thompson' }),
    mk(10, 10, 'card', [
      { name: 'Garden Salad', qty: 1, unitPrice: 6.5, emoji: '🥗', category: 'Food' },
      { name: 'Latte', qty: 1, unitPrice: 4.5, emoji: '☕', category: 'Beverages' },
    ], { cardType: 'Amex', employeeName: 'Chloe Davis' }),
    mk(11, 11, 'cash', [
      { name: 'Cappuccino', qty: 1, unitPrice: 4.25, emoji: '☕', category: 'Beverages' },
    ], { employeeName: 'Jake Miller' }),
    mk(12, 12, 'other', [
      { name: 'Cheesecake', qty: 2, unitPrice: 5.5, emoji: '🍰', category: 'Desserts' },
    ], { methodLabel: 'CliQ', employeeName: 'Emma Thompson' }),
    mk(13, 14, 'card', [
      { name: 'Muffin', qty: 2, unitPrice: 3.25, emoji: '🧁', category: 'Pastries' },
      { name: 'Latte', qty: 1, unitPrice: 4.5, emoji: '☕', category: 'Beverages' },
    ], { cardType: 'Visa', employeeName: 'Chloe Davis' }),
    mk(14, 16, 'cash', [
      { name: 'Bagel', qty: 1, unitPrice: 3.75, emoji: '🥯', category: 'Pastries' },
    ], { employeeName: 'Jake Miller' }),
  ];
}

function mergedRefundedQty(o: ReportOrder, lr?: LocalRefundState): Record<string, number> {
  const base = { ...(o.refundedLineQty ?? {}) };
  if (lr?.lineQty) {
    for (const [id, q] of Object.entries(lr.lineQty)) {
      base[id] = Math.max(base[id] ?? 0, q);
    }
  }
  if (lr?.full || o.status === 'REFUNDED') {
    for (const l of o.lines) base[l.id] = l.qty;
  }
  return base;
}

function effectiveStatus(
  o: ReportOrder,
  lr?: LocalRefundState,
): 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' {
  if (lr?.full || o.status === 'REFUNDED') return 'REFUNDED';
  const rq = mergedRefundedQty(o, lr);
  const any = o.lines.some((l) => (rq[l.id] ?? 0) > 0) || (o.refundedAmount ?? 0) > 0 || !!lr;
  const all =
    o.lines.length > 0 && o.lines.every((l) => (rq[l.id] ?? 0) >= l.qty);
  if (all) return 'REFUNDED';
  if (any || o.status === 'PARTIALLY_REFUNDED') return 'PARTIALLY_REFUNDED';
  return 'COMPLETED';
}

function saleToOrder(s: DemoSale, staffFallback = 'You'): ReportOrder {
  const lines: ReportLine[] =
    s.lines?.map((l) => ({
      id: l.id,
      name: l.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
      emoji: l.emoji,
      image: REPORT_ITEM_IMAGES[l.name] ?? null,
      category:
        /latte|espresso|capp|coffee|tea|milk/i.test(l.name)
          ? 'Beverages'
          : /croissant|pastry|cookie/i.test(l.name)
            ? 'Pastries'
            : /cake|brownie|dessert/i.test(l.name)
              ? 'Desserts'
              : 'Food',
    })) ??
    s.items.split('·').map((part, i) => {
      const t = part.trim();
      const m = t.match(/^(.*?)\s*×\s*(\d+)$/);
      const name = (m ? m[1] : t).replace(/^[^\w]+/, '').trim() || t;
      const qty = m ? parseInt(m[2], 10) : 1;
      return {
        id: `${s.id}-L${i}`,
        name,
        qty,
        unitPrice: s.total / Math.max(1, qty),
        emoji: t.match(/^\S+/)?.[0] ?? '•',
        image: REPORT_ITEM_IMAGES[name] ?? null,
        category: 'Food',
      };
    });

  const subtotal = s.subtotal ?? lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
  const tax = s.tax ?? +(subtotal * 0.08).toFixed(2);
  const discount = s.discount ?? 0;
  const status: ReportOrder['status'] =
    s.status === 'refunded'
      ? 'REFUNDED'
      : s.status === 'partially_refunded'
        ? 'PARTIALLY_REFUNDED'
        : 'COMPLETED';

  return {
    id: s.id,
    orderNo: s.orderNo,
    total: s.total,
    tax,
    subtotal,
    discount,
    method: s.method,
    methodLabel: s.methodLabel,
    status,
    at: s.at,
    employeeName: staffFallback,
    items: s.items,
    lines,
    isRefunded: status === 'REFUNDED',
    refundReason: s.refundReason,
    refundedLineQty: s.refundedLineQty,
    refundedAmount: s.refundedAmount,
    tenders: s.tenders,
  };
}

/* ─── UI bits ───────────────────────────────────────────────────────────── */

function Shell({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-surface ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * POS journey filter option card — icon tile + title/desc + check circle.
 * Mirrors mintcom-pos styles.journeyOptionCard.
 */
function JourneyOption({
  selected,
  icon,
  label,
  desc,
  onClick,
  trailing,
  accent = '#7dc6a2',
  iconBgIdle,
  iconColorIdle,
}: {
  selected: boolean;
  icon: ReactNode;
  label: string;
  desc?: string;
  onClick: () => void;
  trailing?: ReactNode;
  /** Selected border / icon / check color */
  accent?: string;
  iconBgIdle?: string;
  iconColorIdle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl bg-white p-4 text-start shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:bg-mintcom-surface"
      style={{
        borderStyle: 'solid',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? accent : 'rgba(0,0,0,0.08)',
      }}
    >
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          selected || iconColorIdle ? '' : 'text-text-secondary dark:text-mintcom-textSecondary'
        }`}
        style={{
          backgroundColor: selected
            ? accent
            : iconBgIdle ?? 'rgba(148, 163, 184, 0.15)',
          color: selected ? '#fff' : iconColorIdle ?? undefined,
        }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-text-primary dark:text-white">
          {label}
        </span>
        {desc && (
          <span className="mt-0.5 block text-[13px] font-medium text-text-secondary dark:text-mintcom-textSecondary">
            {desc}
          </span>
        )}
      </span>
      {trailing ??
        (selected ? (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: accent }}
          >
            <Check size={14} strokeWidth={3} />
          </span>
        ) : null)}
    </button>
  );
}

/**
 * POS reports modal chrome — matches SalesTotalsBreakdownModal / OtherPaymentsBreakdownModal:
 * dark 70% overlay, 12px radius, green header icon tile, plain X close.
 * Sizes to content (not full screen); body scrolls only when needed (POS content max ~420).
 */
function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  icon,
  /** Narrower card for compact breakdowns like Sales totals (POS maxWidth 640, often smaller on tablet) */
  size = 'default',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Header leading icon (POS green tile). Defaults to chart icon. */
  icon?: ReactNode;
  size?: 'default' | 'compact';
}) {
  // Compact still wide enough for long breakdown labels (no forced ellipsis)
  const widthClass =
    size === 'compact' ? 'w-[calc(100vw-24px)] sm:w-[min(94vw,520px)]' : 'w-[calc(100vw-24px)] sm:w-[min(94vw,560px)]';

  return (
    <div className="absolute inset-0 z-[85] flex items-end sm:items-center justify-center px-3 py-3 sm:px-5 sm:py-6" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className={`relative flex max-h-[min(85dvh,640px)] ${widthClass} flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-mintcom-surface`}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white">
              {icon ?? <BarChart3 size={20} />}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-[17px] font-bold leading-snug text-text-primary dark:text-white sm:text-[18px]">
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 line-clamp-2 text-[13px] text-text-secondary dark:text-mintcom-textSecondary">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text-secondary"
            aria-label="Close"
          >
            <X size={22} strokeWidth={2} />
          </button>
        </div>

        {/* Body — fit content; scroll only past ~420px like POS content maxHeight */}
        <div className="min-h-0 max-h-[min(420px,calc(85dvh-120px))] overflow-y-auto overscroll-contain p-4 pb-5">
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-gray-200 px-5 py-3.5 dark:border-white/10">
            {footer}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/** POS breakdown row: icon tile + full label/detail + amount (no ellipsis on titles) */
function BreakdownRow({
  icon,
  label,
  detail,
  value,
  valueColor,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
          {icon}
        </span>
        <div className="min-w-0 flex-1 pe-1">
          <p className="text-[14px] font-bold leading-snug text-text-primary dark:text-white sm:text-[15px]">
            {label}
          </p>
          {detail && (
            <p className="mt-1 text-[12px] leading-snug text-text-secondary dark:text-mintcom-textSecondary">
              {detail}
            </p>
          )}
        </div>
      </div>
      <p
        className="shrink-0 pt-0.5 text-end text-[15px] font-extrabold tabular-nums text-text-primary dark:text-white sm:text-[16px]"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

/** POS hero total card at top of breakdown modals */
function HeroTotal({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-mintcom-green/20 bg-mintcom-green/[0.07] p-4">
      <div className="flex items-center gap-2.5">
        <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-mintcom-green/12 text-mintcom-green">
          {icon ?? <Wallet size={18} />}
        </span>
        <p className="min-w-0 flex-1 text-[12px] font-bold uppercase leading-snug tracking-wide text-text-secondary dark:text-mintcom-textSecondary">
          {label}
        </p>
      </div>
      <p className="mt-2.5 text-[28px] font-extrabold tabular-nums leading-none text-mintcom-green">
        {value}
      </p>
    </div>
  );
}

/* ─── Payment Receipt (mirrors mintcom-pos ReportsScreen order details modal) ── */

const RECEIPT_DOUBLE = '='.repeat(30);
const RECEIPT_SINGLE = '-'.repeat(30);
const DEMO_RECEIPT_BUSINESS = 'Cafe Delight';
const DEMO_RECEIPT_FOOTER = 'Please come again!';

function formatReceiptDate(at: number) {
  const d = new Date(at);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${dd}/${yy}`;
}

function formatReceiptTime(at: number) {
  return new Date(at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function receiptMoney(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
}

function paymentLabelForReceipt(order: ReportOrder) {
  if (order.method === 'card' && order.cardType) {
    return `Card (${order.cardType})`;
  }
  if (order.method === 'other') {
    return order.methodLabel || 'Other';
  }
  if (order.method === 'cash') return 'CASH';
  return order.methodLabel.toUpperCase();
}

function taxRatePercent(order: ReportOrder) {
  const taxable = Math.max(0, order.subtotal - (order.discount || 0));
  if (taxable <= 0 || order.tax <= 0) return 0;
  return Number(((order.tax / taxable) * 100).toFixed(2));
}

// Demo-only mock of the legal receipt number (production: Order.invoiceNumber,
// INV-YYYY-NNNNN from EstablishmentSequence). Demo orders carry orderNo only,
// so derive the same shape here to keep screenshots/mockups faithful.
function demoInvoiceNumber(orderNo: number) {
  return `INV-${new Date().getFullYear()}-${String(orderNo).padStart(5, '0')}`;
}

/**
 * Exact POS order-details UI: "Payment Receipt" header + green print button,
 * monospace thermal-receipt body (ReportsScreen order details modal).
 */
function PaymentReceiptModal({
  order,
  status,
  refundReason,
  refundedBy,
  onClose,
  onPrint,
}: {
  order: ReportOrder;
  status: 'COMPLETED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  refundReason?: string;
  refundedBy?: string;
  onClose: () => void;
  onPrint: () => void;
}) {
  const taxRate = taxRatePercent(order);
  const isRefunded = status === 'REFUNDED' || status === 'PARTIALLY_REFUNDED';

  return (
    <div className="absolute inset-0 z-[85] flex items-end sm:items-center justify-center px-3 py-3 sm:px-5 sm:py-6" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        role="dialog"
        aria-labelledby="payment-receipt-title"
        className="relative flex max-h-[min(80dvh,640px)] w-[calc(100vw-48px)] sm:w-[min(90vw,400px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-mintcom-surface"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — POS: title + circular green print (no X / no icon tile) */}
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 pb-4 pt-6">
          <h3
            id="payment-receipt-title"
            className="text-[20px] font-bold text-text-primary dark:text-white"
          >
            Payment Receipt
          </h3>
          <button
            type="button"
            onClick={onPrint}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-mintcom-green text-white shadow-sm"
            title="Print"
            aria-label="Print receipt"
          >
            <Printer size={22} />
          </button>
        </div>

        {/* Body — monospace receipt (POS receiptBody) */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-8">
          <div className="font-mono text-[14px] leading-snug text-text-primary dark:text-white">
            <p className="my-1 text-center text-[12px] tracking-wide">{RECEIPT_DOUBLE}</p>

            <div className="my-2 flex justify-center text-text-primary dark:text-white">
              <Coffee size={20} strokeWidth={2} />
            </div>

            <p className="text-center text-[16px] font-bold tracking-wide">
              {DEMO_RECEIPT_BUSINESS}
            </p>

            <p className="my-1 text-center text-[12px] tracking-wide">{RECEIPT_DOUBLE}</p>

            {/* Order meta — two columns like POS */}
            <div className="mb-1 flex items-start justify-between gap-2 text-[13px]">
              <span>Invoice: {demoInvoiceNumber(order.orderNo)}</span>
              <span>Date: {formatReceiptDate(order.at)}</span>
            </div>
            <div className="mb-1 flex items-start justify-between gap-2 text-[13px]">
              <span className="min-w-0 truncate">Served by: {order.employeeName || 'Unknown'}</span>
              <span className="shrink-0">Time: {formatReceiptTime(order.at)}</span>
            </div>

            <p className="my-1.5 text-center text-[12px] tracking-wide opacity-60">{RECEIPT_SINGLE}</p>

            <div className="mb-1 flex justify-between text-[13px] font-bold">
              <span>ITEM</span>
              <span>TOTAL</span>
            </div>
            <p className="my-1.5 text-center text-[12px] tracking-wide opacity-60">{RECEIPT_SINGLE}</p>

            {order.lines.map((l) => (
              <div key={l.id} className="mb-2">
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 flex-1 uppercase">
                    {l.qty}x{' '}
                    {(l.name || '')
                      .replace(/\[\s*(?:history|deleted|archived)\s*\]/gi, '')
                      .replace(/\s{2,}/g, ' ')
                      .trim()}
                  </span>
                  <span className="shrink-0 tabular-nums">{receiptMoney(l.unitPrice * l.qty)}</span>
                </div>
              </div>
            ))}

            <p className="my-1.5 text-center text-[12px] tracking-wide opacity-60">{RECEIPT_SINGLE}</p>

            <div className="mb-1 flex justify-between gap-3">
              <span>Subtotal</span>
              <span className="tabular-nums">{receiptMoney(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="mb-1 flex justify-between gap-3">
                <span>Discount</span>
                <span className="tabular-nums">−{receiptMoney(order.discount)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="mb-1 flex justify-between gap-3">
                <span>Tax ({taxRate}%)</span>
                <span className="tabular-nums">{receiptMoney(order.tax)}</span>
              </div>
            )}

            <p className="my-1.5 text-center text-[12px] tracking-wide opacity-60">{RECEIPT_SINGLE}</p>

            <div className="my-1 flex justify-between gap-3 text-[16px] font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums">{receiptMoney(order.total)}</span>
            </div>

            <p className="my-1 text-center text-[12px] tracking-wide">{RECEIPT_DOUBLE}</p>

            {order.tenders && order.tenders.length > 0 ? (
              <div className="mt-2 space-y-1">
                <p className="text-center font-bold">PAYMENT BREAKDOWN</p>
                {order.tenders.map((tItem, idx) => (
                  <div key={idx} className="flex justify-between gap-2 text-[12px]">
                    <span className="truncate">{tItem.label || tItem.method}</span>
                    <span className="tabular-nums shrink-0">{receiptMoney(tItem.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-center">
                Payment: {paymentLabelForReceipt(order)}
              </p>
            )}

            {isRefunded && (
              <>
                <p className="my-1.5 text-center text-[12px] tracking-wide opacity-60">{RECEIPT_SINGLE}</p>
                <p className="text-center font-bold">Refund Reason</p>
                <p className="text-center">{refundReason || 'N/A'}</p>
                {refundedBy && (
                  <p className="text-center">Served by: {refundedBy}</p>
                )}
              </>
            )}

            <p className="my-1.5 text-center text-[12px] tracking-wide opacity-60">{RECEIPT_SINGLE}</p>

            <p className="mt-2 text-center">Thank you for your visit!</p>
            <p className="text-center">{DEMO_RECEIPT_FOOTER}</p>
            <p className="mt-2 text-center">Powered by Mintcom POS</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] start-1/2 z-[95] max-w-[calc(100vw-32px)] -translate-x-1/2 whitespace-normal text-center rounded-full bg-mintcom-dark px-4 py-2 text-xs font-bold text-white shadow-xl dark:bg-white dark:text-mintcom-dark sm:bottom-6"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** POS SalesSummaryCards-style stat tile (icon | title+value | chevron) — compact for fit-without-page-scroll */
function StatCard({
  label,
  hint,
  value,
  icon,
  primary,
  onClick,
  info,
}: {
  label: string;
  hint?: string;
  value: ReactNode;
  icon: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  info?: string;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLButtonElement | HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showInfo) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowInfo(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  // Match POS SalesSummaryCards: icon 42×42 r12, title 11/500, value 15/700
  const className = `relative flex min-h-[72px] min-w-0 flex-1 items-center gap-3 rounded-xl border p-3 text-start transition-all ${
    primary
      ? 'border-transparent bg-mintcom-green !text-white shadow-sm shadow-mintcom-green/20'
      : 'border-gray-200/90 bg-white dark:border-white/10 dark:bg-mintcom-surface'
  } ${onClick ? 'cursor-pointer' : ''}`;

  const inner = (
    <>
      {info && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            setShowInfo((v) => !v);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setShowInfo((v) => !v);
          }}
          className={`absolute end-2.5 top-2.5 z-20 flex h-[22px] w-[22px] items-center justify-center rounded-full ${
            primary ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-400 dark:bg-white/10'
          }`}
          aria-label="More info"
        >
          <Info size={14} />
        </span>
      )}
      {showInfo && info && (
        <span
          role="tooltip"
          className="absolute end-2.5 top-9 z-30 max-w-[200px] rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-start text-[12px] font-medium leading-snug text-text-primary shadow-lg dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
        >
          {info}
        </span>
      )}

      <span
        className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl ${
          primary ? 'bg-white text-mintcom-green' : 'bg-mintcom-green text-white'
        }`}
      >
        {icon}
      </span>

      <div className={`min-w-0 flex-1 ${info ? 'pe-5' : ''} ${onClick ? 'pe-0.5' : ''}`}>
        <p
          className={`line-clamp-1 text-[11px] font-medium leading-snug tracking-normal ${
            primary ? '!text-white' : 'text-text-secondary dark:text-mintcom-textSecondary'
          }`}
        >
          {label}
        </p>
        {hint && (
          <p
            className={`hidden sm:block text-[9px] font-medium leading-snug ${
              primary ? '!text-white' : 'text-text-tertiary'
            }`}
          >
            {hint}
          </p>
        )}
        <div
          className={`mt-0.5 text-[15px] font-bold tabular-nums leading-tight tracking-normal ${
            primary ? '!text-white' : 'text-text-primary dark:text-white'
          }`}
        >
          {value}
        </div>
      </div>

      {onClick && (
        <ChevronRight
          size={18}
          strokeWidth={2}
          className={`mb-0.5 shrink-0 self-end ${primary ? '!text-white' : 'text-text-tertiary'}`}
          aria-hidden
        />
      )}
    </>
  );

  if (onClick) {
    return (
      <button ref={containerRef as any} type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    );
  }
  return <div ref={containerRef as any} className={className}>{inner}</div>;
}

/** Labeled filter control — mirrors POS PERIOD / DATE RANGE / TIME RANGE */
function FilterField({
  label,
  children,
  className = '',
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary dark:text-mintcom-textSecondary">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterControlButton({
  children,
  onClick,
  active,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-11 min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-start text-[13px] font-semibold text-text-primary outline-none transition-colors dark:bg-mintcom-surface dark:text-white ${
        active
          ? 'border-mintcom-green ring-1 ring-mintcom-green/30'
          : 'border-gray-200 dark:border-white/10'
      } ${className}`}
    >
      {children}
    </button>
  );
}

type PeriodId =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'thisWeek'
  | 'thisMonth'
  | 'lastWeek'
  | 'lastMonth'
  | 'last3Months'
  | 'thisYear'
  | 'custom';

const PERIOD_OPTIONS: { id: PeriodId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'last7', label: 'Last 7 Days' },
  { id: 'last30', label: 'Last 30 Days' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastWeek', label: 'Last Week' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'last3Months', label: 'Last 3 Months' },
  { id: 'thisYear', label: 'This Year' },
  { id: 'custom', label: 'Custom' },
];

/** Desktop order row — matches POS RelatedOrderRow / Orders & Receipts table */
function OrderTableRow({
  order,
  status,
  displayTotal,
  canRefund,
  isLast,
  onView,
  onRefund,
  onPrint,
}: {
  order: ReportOrder;
  status: string;
  displayTotal: number;
  canRefund: boolean;
  isLast?: boolean;
  onView: () => void;
  onRefund: () => void;
  onPrint: () => void;
}) {
  const isRef = status === 'REFUNDED';
  const isPartial = status === 'PARTIALLY_REFUNDED';
  const statusLabel = isRef ? 'Refunded' : isPartial ? 'Partially Refunded' : 'Paid';
  const statusColor = isRef
    ? 'text-mintcom-red'
    : 'text-mintcom-green';
  const d = new Date(order.at);
  const dateStr = d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div
      className={`flex h-[48px] shrink-0 items-center gap-2 px-3 sm:h-[50px] sm:gap-2.5 sm:px-4 ${
        !isLast ? 'border-b border-gray-100 dark:border-white/8' : ''
      }`}
    >
      <button
        type="button"
        onClick={onView}
        className="w-[40px] shrink-0 text-start text-[12px] font-semibold text-text-primary dark:text-white sm:w-[54px] sm:text-[14px]"
      >
        #{order.orderNo}
      </button>
      <button
        type="button"
        onClick={onView}
        className="w-[64px] shrink-0 text-start sm:w-[90px]"
      >
        <p className={`text-[12px] font-medium leading-tight ${statusColor}`}>
          {statusLabel === 'Partially Refunded' ? 'Partial' : statusLabel}
        </p>
        <p className="text-[11px] leading-tight text-text-secondary dark:text-mintcom-textSecondary">
          {timeStr}
        </p>
      </button>
      <span
        className="hidden w-[92px] shrink-0 text-[10px] text-text-tertiary sm:inline"
        title={dateStr}
      >
        {dateStr}
      </span>
      <button
        type="button"
        onClick={onView}
        className={`w-[64px] shrink-0 text-end text-[12px] font-semibold tabular-nums sm:w-[88px] sm:text-[14px] ${
          isRef || isPartial ? 'text-mintcom-red' : 'text-text-primary dark:text-white'
        }`}
      >
        {money(displayTotal)}
      </button>
      <div className="min-w-0 hidden min-[380px]:flex flex-1 items-center justify-end px-2">
        {order.tenders && order.tenders.length > 1 ? (
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
            SPLIT ({order.tenders.length})
          </span>
        ) : (
          <span className="truncate text-[11px] font-medium text-text-tertiary">
            {order.methodLabel}
          </span>
        )}
      </div>
      <div className="flex w-auto shrink-0 items-center justify-end gap-1 sm:gap-1.5">
        {canRefund && (
          <button
            type="button"
            onClick={onRefund}
            className="inline-flex h-9 min-h-[36px] items-center rounded-xl bg-[#D55263] px-2.5 text-[11px] font-bold !text-white shadow-sm sm:h-8 sm:px-3"
          >
            Refund
          </button>
        )}
        <button
          type="button"
          onClick={onPrint}
          className="hidden h-7 w-7 items-center justify-center rounded-xl bg-mintcom-green text-white shadow-sm sm:flex sm:h-8 sm:w-8 sm:rounded-xl"
          title="Print"
        >
          <Printer size={14} />
        </button>
        <button
          type="button"
          onClick={onView}
          className="hidden h-7 w-7 items-center justify-center rounded-xl bg-mintcom-green text-white shadow-sm sm:flex sm:h-8 sm:w-8 sm:rounded-xl"
          title="View details"
        >
          <Eye size={14} />
        </button>
      </div>
    </div>
  );
}

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
function formatDateShort(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime12(d: Date) {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
}
function rangeForPeriod(id: PeriodId): { start: Date; end: Date } {
  const now = new Date();
  const today0 = startOfDay(now);
  const todayEnd = endOfDay(now);
  if (id === 'today') return { start: today0, end: todayEnd };
  if (id === 'yesterday') {
    const y = new Date(today0);
    y.setDate(y.getDate() - 1);
    return { start: startOfDay(y), end: endOfDay(y) };
  }
  if (id === 'last7') {
    const s = new Date(today0);
    s.setDate(s.getDate() - 7);
    return { start: s, end: todayEnd };
  }
  if (id === 'last30') {
    const s = new Date(today0);
    s.setDate(s.getDate() - 30);
    return { start: s, end: todayEnd };
  }
  if (id === 'thisWeek') {
    const s = new Date(today0);
    const day = s.getDay();
    s.setDate(s.getDate() - day);
    return { start: s, end: todayEnd };
  }
  if (id === 'thisMonth') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: todayEnd };
  }
  if (id === 'lastWeek') {
    const end = new Date(today0);
    end.setDate(end.getDate() - end.getDay() - 1);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    return { start: startOfDay(start), end: endOfDay(end) };
  }
  if (id === 'lastMonth') {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    return { start, end };
  }
  if (id === 'last3Months') {
    const s = new Date(today0);
    s.setMonth(s.getMonth() - 3);
    return { start: s, end: todayEnd };
  }
  if (id === 'thisYear') {
    return { start: new Date(now.getFullYear(), 0, 1), end: todayEnd };
  }
  // custom — keep last 7 as demo default
  const s = new Date(today0);
  s.setDate(s.getDate() - 7);
  return { start: s, end: todayEnd };
}

/* ─── Main ──────────────────────────────────────────────────────────────── */

export function DemoReportsScreen({ shift }: { shift: DemoShift }) {
  const [renderedAt] = useState(Date.now);
  const [reportTab, setReportTab] = useState<'general' | 'items'>('general');
  const [period, setPeriod] = useState<PeriodId>('today');
  const [dateRange, setDateRange] = useState(() => rangeForPeriod('today'));
  const [timeStart, setTimeStart] = useState(() => startOfDay());
  const [timeEnd, setTimeEnd] = useState(() => endOfDay());
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  /** Phones collapse the filter row behind a summary bar; sm+ always shows it. */
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  /** Phones show one content pane at a time (tabs); lg+ keeps the split. */
  const [mobilePane, setMobilePane] = useState<'left' | 'right'>('left');
  const [employee, setEmployee] = useState<string>('all');
  /** Shift filter — only used when an employee is selected (like POS) */
  const [selectedShiftId, setSelectedShiftId] = useState<string>('all');
  /** Item report: Products vs Attributes (POS) */
  const [itemMainTab, setItemMainTab] = useState<'products' | 'attributes'>('products');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [itemNameFilter, setItemNameFilter] = useState<string>('all');
  /** Attributes tab filters — mirrors POS parent attribute + add-on (sub-attribute) */
  const [attributeGroupFilter, setAttributeGroupFilter] = useState<string>('all');
  const [addonFilter, setAddonFilter] = useState<string>('all');
  const [topItemsPeriod, setTopItemsPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [showTopPeriodMenu, setShowTopPeriodMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  /** Applied order filters (POS journey model) */
  const [orderFilters, setOrderFilters] = useState<OrderFilterState>(EMPTY_ORDER_FILTERS);
  /** Temporary filters while modal is open — applied only on Apply */
  const [tempFilters, setTempFilters] = useState<OrderFilterState>(EMPTY_ORDER_FILTERS);
  const [filterStep, setFilterStep] = useState(0);
  const [lastAppliedFilterStep, setLastAppliedFilterStep] = useState(0);
  const [showCardTypes, setShowCardTypes] = useState(false);
  const [showOtherPayments, setShowOtherPayments] = useState(false);
  const [showSpecificDiscounts, setShowSpecificDiscounts] = useState(false);
  /** Scroll container for filter journey body — auto-scroll when expanding sub-options (POS) */
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const filterExpandRef = useRef<HTMLDivElement>(null);
  const [selectedOrder, setSelectedOrder] = useState<ReportOrder | null>(null);
  const [modal, setModal] = useState<
    | null
    | 'totals'
    | 'payinout'
    | 'other'
    | 'card'
    | 'time'
    | 'print'
    | 'refund'
    | 'dateRange'
    | 'timeRange'
  >(null);
  const [toast, setToast] = useState<string | null>(null);
  /** Session refunds applied in this reports view (item or full) */
  const [localRefunds, setLocalRefunds] = useState<Record<string, LocalRefundState>>({});
  const [auditModal, setAuditModal] = useState<{
    open: boolean;
    itemName: string;
    history: PriceHistoryEntry[];
  }>({ open: false, itemName: '', history: [] });
  const priceHistoryByName = useMemo(() => seedPriceHistory(), []);
  const openAudit = (name: string) => {
    const entries = priceHistoryByName[name];
    if (!entries) return;
    setAuditModal({ open: true, itemName: name, history: entries });
  };

  const history = useMemo(() => seedHistory(), []);

  const liveOrders = useMemo(
    () => shift.sales.map((s) => saleToOrder(s, 'You')),
    [shift.sales],
  );

  const allOrders = useMemo(() => {
    // Live shift sales first, then seed history (dedupe by orderNo if needed)
    const liveNos = new Set(liveOrders.map((o) => o.orderNo));
    return [...liveOrders, ...history.filter((h) => !liveNos.has(h.orderNo))];
  }, [liveOrders, history]);

  const applyPeriod = (id: PeriodId) => {
    setPeriod(id);
    setShowPeriodMenu(false);
    const r = rangeForPeriod(id);
    setDateRange(r);
    setTimeStart(startOfDay(r.start));
    setTimeEnd(endOfDay(r.end));
    setSelectedShiftId('all');
  };

  const rangeStart = useMemo(() => {
    const s = new Date(dateRange.start);
    s.setHours(timeStart.getHours(), timeStart.getMinutes(), 0, 0);
    return s.getTime();
  }, [dateRange.start, timeStart]);

  const rangeEnd = useMemo(() => {
    const e = new Date(dateRange.end);
    e.setHours(timeEnd.getHours(), timeEnd.getMinutes(), 59, 999);
    return e.getTime();
  }, [dateRange.end, timeEnd]);

  const inRange = useMemo(
    () => allOrders.filter((o) => o.at >= rangeStart && o.at <= rangeEnd),
    [allOrders, rangeStart, rangeEnd],
  );

  const periodLabel = PERIOD_OPTIONS.find((p) => p.id === period)?.label ?? 'Today';
  const isTodayPeriod = period === 'today';

  const employees = useMemo(() => {
    const names = Array.from(new Set(inRange.map((o) => o.employeeName)));
    // Always offer known demo staff so shift filter can be explored even on quiet days
    for (const n of ['You', 'Chloe Davis', 'Jake Miller', 'Emma Thompson']) {
      if (!names.includes(n)) names.push(n);
    }
    return names;
  }, [inRange]);

  /** Shifts for the selected employee (POS: appears after employee pick) */
  const employeeShifts = useMemo(() => {
    if (employee === 'all') return [] as DemoReportShift[];
    // Build from full history in current range + a bit wider so closed shifts show up
    const pool = allOrders.filter((o) => o.at >= rangeStart - 7 * 86400_000);
    return buildEmployeeShifts(pool, employee, shift);
  }, [employee, allOrders, rangeStart, shift]);

  const activeShift = useMemo(
    () =>
      selectedShiftId !== 'all'
        ? employeeShifts.find((s) => s.id === selectedShiftId) ?? null
        : null,
    [employeeShifts, selectedShiftId],
  );

  /** Open/close shift log — POS TotalTimeWorkedLogModal (CASH_IN / CASH_OUT rows) */
  const shiftLogRows = useMemo(() => {
    const pool = allOrders.filter((o) => o.at >= rangeStart - 7 * 86400_000);
    const netFor = (name: string, start: number, end: number | null) =>
      pool
        .filter(
          (o) =>
            o.employeeName === name &&
            o.at >= start &&
            (end == null || o.at <= end) &&
            effectiveStatus(o, localRefunds[o.id]) !== 'REFUNDED',
        )
        .reduce(
          (s, o) => s + Math.max(0, o.total - (localRefunds[o.id]?.amount ?? o.refundedAmount ?? 0)),
          0,
        );

    const names = employee === 'all' ? employees : [employee];
    const rows: ShiftLogRow[] = [];
    for (const name of names) {
      const shifts = buildEmployeeShifts(pool, name, shift);
      for (const s of shifts) {
        const isLiveOpen = name === 'You' && s.id === 'live-open';
        const opening = isLiveOpen ? shift.openingCash : 100;
        rows.push({
          id: `${s.id}-open`,
          employeeName: name,
          type: 'open',
          at: s.start,
          amount: opening,
        });
        if (s.end != null) {
          rows.push({
            id: `${s.id}-close`,
            employeeName: name,
            type: 'close',
            at: s.end,
            amount: opening + netFor(name, s.start, s.end),
            isAuto: true,
          });
        }
      }
    }
    return rows.sort((a, b) => b.at - a.at);
  }, [allOrders, rangeStart, employee, employees, shift, localRefunds]);

  const employeeFiltered = useMemo(() => {
    let list = employee === 'all' ? inRange : inRange.filter((o) => o.employeeName === employee);
    if (employee !== 'all' && activeShift) {
      list = list.filter(
        (o) =>
          o.at >= activeShift.start &&
          (activeShift.end == null || o.at <= activeShift.end),
      );
    }
    return list;
  }, [inRange, employee, activeShift]);

  const filteredOrders = useMemo(() => {
    let list = employeeFiltered;
    const f = orderFilters;

    // Payment method (POS-style)
    if (f.cardTypes.length > 0) {
      list = list.filter(
        (o) =>
          o.method === 'card' &&
          f.cardTypes.some(
            (ct) => (o.cardType ?? '').toLowerCase() === ct.toLowerCase(),
          ),
      );
    } else if (f.otherMethods.length > 0) {
      list = list.filter(
        (o) =>
          o.method === 'other' &&
          f.otherMethods.some((m) =>
            (o.methodLabel ?? '').toLowerCase().includes(m.toLowerCase()),
          ),
      );
    } else if (f.payment === 'CASH') {
      list = list.filter((o) => o.method === 'cash');
    } else if (f.payment === 'CARD') {
      list = list.filter((o) => o.method === 'card');
    } else if (f.payment === 'OTHER') {
      list = list.filter((o) => o.method === 'other');
    }

    // Status
    if (f.status) {
      list = list.filter((o) => {
        const st = effectiveStatus(o, localRefunds[o.id]);
        if (f.status === 'REFUNDED') return st === 'REFUNDED' || st === 'PARTIALLY_REFUNDED';
        if (f.status === 'PAID_TAX_CHANGED') return false; // demo has no tax-changed orders
        return st === f.status;
      });
    }

    // Discount
    if (f.discounts.includes('HAS_DISCOUNT')) {
      list = list.filter((o) => (o.discount ?? 0) > 0);
    } else if (f.discounts.includes('NO_DISCOUNT')) {
      list = list.filter((o) => (o.discount ?? 0) <= 0);
    } else if (f.discounts.some((d) => d !== 'HAS_DISCOUNT' && d !== 'NO_DISCOUNT')) {
      // Specific named discounts — demo tags by discount amount presence + name seed
      list = list.filter((o) => (o.discount ?? 0) > 0);
    }

    return list;
  }, [employeeFiltered, orderFilters, localRefunds]);

  const hasActiveFilters = orderFiltersActive(orderFilters);
  const filterCount = countOrderFilters(orderFilters);
  const hasTempFiltersChanged = orderFiltersActive(tempFilters);

  /**
   * When a big filter card expands (Card types / Other methods / Specific discounts),
   * scroll the journey body so nested options come into view — mirrors POS
   * scrollFilterToExpanded (reveals ~3 sub-rows under the parent card).
   * Runs after paint so the expanded panel ref is mounted.
   */
  const scrollFilterToExpanded = useCallback(() => {
    const run = () => {
      const scroller = filterScrollRef.current;
      const panel = filterExpandRef.current;
      if (!scroller || !panel) return;

      const scrollerRect = scroller.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();
      // How far the panel extends past the visible bottom of the scroller
      const overflowBottom = panelRect.bottom - scrollerRect.bottom + 16;
      if (overflowBottom > 0) {
        scroller.scrollBy({ top: overflowBottom, behavior: 'smooth' });
        return;
      }
      // Or if the top of the expanded block is clipped above
      const overflowTop = scrollerRect.top - panelRect.top + 12;
      if (overflowTop > 0) {
        scroller.scrollBy({ top: -overflowTop, behavior: 'smooth' });
      }
    };
    // Wait for React to commit the expanded sub-options DOM
    window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(run));
    }, 40);
  }, []);

  // Auto-scroll when any expandable filter section opens (POS journey UX)
  useEffect(() => {
    if (!showFilters) return;
    if (showCardTypes || showOtherPayments || showSpecificDiscounts) {
      scrollFilterToExpanded();
    }
  }, [
    showCardTypes,
    showOtherPayments,
    showSpecificDiscounts,
    showFilters,
    scrollFilterToExpanded,
  ]);

  const openOrderFilterModal = () => {
    setTempFilters({
      payment: orderFilters.payment,
      cardTypes: [...orderFilters.cardTypes],
      otherMethods: [...orderFilters.otherMethods],
      status: orderFilters.status,
      discounts: [...orderFilters.discounts],
    });
    setFilterStep(lastAppliedFilterStep);
    setShowCardTypes(orderFilters.cardTypes.length > 0);
    setShowOtherPayments(orderFilters.otherMethods.length > 0 || orderFilters.payment === 'OTHER');
    setShowSpecificDiscounts(
      orderFilters.discounts.some((d) => d !== 'HAS_DISCOUNT' && d !== 'NO_DISCOUNT'),
    );
    setShowFilters(true);
  };

  const clearTempOrderFilters = () => {
    setTempFilters({ ...EMPTY_ORDER_FILTERS });
    setShowCardTypes(false);
    setShowOtherPayments(false);
    setShowSpecificDiscounts(false);
    setFilterStep(0);
  };

  const applyOrderFilters = () => {
    setOrderFilters({
      payment: tempFilters.payment,
      cardTypes: [...tempFilters.cardTypes],
      otherMethods: [...tempFilters.otherMethods],
      status: tempFilters.status,
      discounts: [...tempFilters.discounts],
    });
    setLastAppliedFilterStep(filterStep);
    setShowFilters(false);
  };

  const cancelOrderFilters = () => setShowFilters(false);

  const nextFilterStep = () => {
    if (filterStep < FILTER_STEPS.length - 1) setFilterStep(filterStep + 1);
  };

  const prevFilterStep = () => {
    if (filterStep > 0) {
      const newStep = filterStep - 1;
      setFilterStep(newStep);
      if (newStep === 0) {
        setShowCardTypes(tempFilters.cardTypes.length > 0);
        setShowOtherPayments(
          tempFilters.otherMethods.length > 0 || tempFilters.payment === 'OTHER',
        );
      }
    }
  };

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; step: number }[] = [];
    if (tempFilters.payment === 'CASH') chips.push({ label: 'Cash', step: 0 });
    if (tempFilters.payment === 'CARD' && tempFilters.cardTypes.length === 0)
      chips.push({ label: 'All Cards', step: 0 });
    if (tempFilters.payment === 'OTHER' && tempFilters.otherMethods.length === 0)
      chips.push({ label: 'All Other', step: 0 });
    tempFilters.cardTypes.forEach((c) => chips.push({ label: c, step: 0 }));
    tempFilters.otherMethods.forEach((m) => chips.push({ label: m, step: 0 }));
    if (tempFilters.status === 'COMPLETED') chips.push({ label: 'Paid', step: 1 });
    if (tempFilters.status === 'PAID_TAX_CHANGED')
      chips.push({ label: 'Paid (Tax Change)', step: 1 });
    if (tempFilters.status === 'REFUNDED') chips.push({ label: 'Refunded', step: 1 });
    tempFilters.discounts.forEach((d) => {
      if (d === 'HAS_DISCOUNT') chips.push({ label: 'With Discount', step: 2 });
      else if (d === 'NO_DISCOUNT') chips.push({ label: 'Full Price', step: 2 });
      else {
        const disc = DEMO_DISCOUNTS.find((x) => x.id === d);
        chips.push({ label: disc?.name || 'Discount', step: 2 });
      }
    });
    return chips;
  }, [tempFilters]);

  const summary = useMemo(() => {
    // Prefer live shift numbers when "today" and no employee/shift filter — matches POS live shift
    const useLive =
      isTodayPeriod &&
      employee === 'all' &&
      selectedShiftId === 'all' &&
      (shift.open || shift.orders > 0);

    let cash = 0;
    let card = 0;
    let other = 0;
    let refunds = 0;
    let orders = 0;
    let tax = 0;
    let subtotal = 0;

    for (const o of employeeFiltered) {
      const lr = localRefunds[o.id];
      const st = effectiveStatus(o, lr);
      const refundAmt =
        (lr?.amount ?? 0) +
        (o.refundedAmount ?? 0) +
        (st === 'REFUNDED' && !lr && !o.refundedAmount ? Math.abs(o.total) : 0);
      if (st === 'REFUNDED') {
        refunds += Math.abs(o.total);
        continue;
      }
      orders += 1;
      tax += o.tax;
      subtotal += o.subtotal - o.discount;
      const netOrder = Math.max(0, o.total - (lr?.amount ?? o.refundedAmount ?? 0));
      if (st === 'PARTIALLY_REFUNDED') {
        refunds += lr?.amount ?? o.refundedAmount ?? 0;
      }
      if (o.method === 'cash') cash += netOrder;
      else if (o.method === 'card') card += netOrder;
      else other += netOrder;
      void refundAmt;
    }

    if (useLive && employee === 'all' && !hasActiveFilters) {
      cash = shift.cashSales || cash;
      card = shift.cardSales || card;
      other = shift.otherSales || other;
      orders = shift.orders || orders;
    }

    const net = cash + card + other - refunds;
    const netBeforeTax = subtotal > 0 ? subtotal : net / 1.08;

    return {
      net,
      netBeforeTax,
      cash,
      card,
      other,
      refunds,
      orders,
      tax,
      payIn: useLive ? shift.payIn : 0,
      payOut: useLive ? shift.payOut : 0,
    };
  }, [employeeFiltered, localRefunds, shift, isTodayPeriod, employee, selectedShiftId, hasActiveFilters]);

  const filteredTotals = useMemo(() => {
    if (!hasActiveFilters) return null;
    return filteredOrders
      .filter((o) => effectiveStatus(o, localRefunds[o.id]) !== 'REFUNDED')
      .reduce((s, o) => {
        const lr = localRefunds[o.id];
        return s + Math.max(0, o.total - (lr?.amount ?? o.refundedAmount ?? 0));
      }, 0);
  }, [hasActiveFilters, filteredOrders, localRefunds]);

  const topItemsRangeStart = useMemo(() => {
    const d = startOfDay();
    if (topItemsPeriod === 'today') return d.getTime();
    if (topItemsPeriod === 'week') return d.getTime() - 7 * 86400_000;
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  }, [topItemsPeriod]);

  const topItems = useMemo(() => {
    const map = new Map<
      string,
      { name: string; emoji: string; image?: string | null; qty: number; revenue: number }
    >();
    const pool = allOrders.filter(
      (o) =>
        o.at >= topItemsRangeStart &&
        (employee === 'all' || o.employeeName === employee),
    );
    for (const o of pool) {
      if (effectiveStatus(o, localRefunds[o.id]) === 'REFUNDED') continue;
      const rq = mergedRefundedQty(o, localRefunds[o.id]);
      for (const l of o.lines) {
        const left = Math.max(0, l.qty - (rq[l.id] ?? 0));
        if (left <= 0) continue;
        const cur = map.get(l.name) ?? {
          name: l.name,
          emoji: l.emoji,
          image: l.image,
          qty: 0,
          revenue: 0,
        };
        cur.qty += left;
        cur.revenue += l.unitPrice * left;
        map.set(l.name, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 12);
  }, [allOrders, topItemsRangeStart, employee, localRefunds]);

  /** Demo add-on groups (parent attributes + options) — same catalog as Sales */
  const reportAddonGroups = useMemo(() => createInitialCatalog().addons, []);

  const itemBreakdown = useMemo(() => {
    const items = new Map<
      string,
      {
        name: string;
        emoji: string;
        image?: string | null;
        cat: string;
        qty: number;
        sales: number;
        refunds: number;
        refundQty: number;
      }
    >();
    const cats = new Map<string, { name: string; qty: number; sales: number; refunds: number; refundQty: number }>();
    type ModRow = {
      name: string;
      qty: number;
      sales: number;
      attributeId: string;
      attributeName: string;
    };
    const mods = new Map<string, ModRow>();

    // Seed every catalog add-on option so Attributes filters always have choices (POS)
    let seedI = 0;
    for (const group of reportAddonGroups) {
      for (const opt of group.options) {
        const baseQty = 6 + ((seedI * 3) % 17);
        const sales = +(baseQty * Math.max(0.25, opt.price || 0.5)).toFixed(2);
        mods.set(opt.name, {
          name: opt.name,
          qty: baseQty,
          sales,
          attributeId: group.id,
          attributeName: group.name,
        });
        seedI += 1;
      }
    }

    for (const o of employeeFiltered) {
      const rq = mergedRefundedQty(o, localRefunds[o.id]);
      for (const l of o.lines) {
        const refQ = rq[l.id] ?? 0;
        const left = Math.max(0, l.qty - refQ);
        const soldTotal = l.unitPrice * left;
        const refTotal = l.unitPrice * refQ;
        const it = items.get(l.name) ?? {
          name: l.name,
          emoji: l.emoji,
          image: l.image,
          cat: l.category,
          qty: 0,
          sales: 0,
          refunds: 0,
          refundQty: 0,
        };
        it.qty += left;
        it.sales += soldTotal;
        it.refunds += refTotal;
        it.refundQty += refQ;
        items.set(l.name, it);

        const c = cats.get(l.category) ?? { name: l.category, qty: 0, sales: 0, refunds: 0, refundQty: 0 };
        c.qty += left;
        c.sales += soldTotal;
        c.refunds += refTotal;
        c.refundQty += refQ;
        cats.set(l.category, c);

        // Bump matching catalog add-ons when line looks customized
        if (left > 0) {
          for (const m of mods.values()) {
            if (new RegExp(m.name.replace(/\s+/g, '.*'), 'i').test(l.name)) {
              m.qty += left;
              m.sales += soldTotal * 0.08;
            }
          }
        }
      }
    }

    return {
      items: Array.from(items.values()).sort((a, b) => b.sales - a.sales),
      categories: Array.from(cats.values()).sort((a, b) => b.sales - a.sales),
      modifiers: Array.from(mods.values()).sort((a, b) => b.sales - a.sales),
    };
  }, [employeeFiltered, localRefunds, reportAddonGroups]);

  const filteredItemBreakdown = useMemo(() => {
    let items = itemBreakdown.items;
    if (categoryFilter !== 'all') {
      items = items.filter((i) => i.cat === categoryFilter);
    }
    if (itemNameFilter !== 'all') {
      items = items.filter((i) => i.name === itemNameFilter);
    }
    return items;
  }, [itemBreakdown.items, categoryFilter, itemNameFilter]);

  /** Attributes tab: parent attribute + add-on filters (POS MODIFIERS view) */
  const filteredModifierBreakdown = useMemo(() => {
    let mods = itemBreakdown.modifiers;
    if (attributeGroupFilter !== 'all') {
      mods = mods.filter((m) => m.attributeId === attributeGroupFilter);
    }
    if (addonFilter !== 'all') {
      mods = mods.filter((m) => m.name === addonFilter);
    }
    return mods;
  }, [itemBreakdown.modifiers, attributeGroupFilter, addonFilter]);

  const addonOptionsForFilter = useMemo(() => {
    if (attributeGroupFilter === 'all') return itemBreakdown.modifiers;
    return itemBreakdown.modifiers.filter((m) => m.attributeId === attributeGroupFilter);
  }, [itemBreakdown.modifiers, attributeGroupFilter]);

  const itemReportStats = useMemo(() => {
    const items =
      itemMainTab === 'products'
        ? filteredItemBreakdown
        : filteredModifierBreakdown.map((m) => ({
            name: m.name,
            qty: m.qty,
            sales: m.sales,
            refunds: 0,
          }));
    return {
      sales: items.reduce((s, i) => s + i.sales, 0),
      qty: items.reduce((s, i) => s + i.qty, 0),
      orders: summary.orders,
      refunds:
        itemMainTab === 'products'
          ? filteredItemBreakdown.reduce((s, i) => s + i.refunds, 0)
          : 0,
      refundQty:
        itemMainTab === 'products'
          ? filteredItemBreakdown.reduce((s, i) => s + i.refundQty, 0)
          : 0,
    };
  }, [itemMainTab, filteredItemBreakdown, filteredModifierBreakdown, summary.orders]);

  const hoursWorked = useMemo(() => {
    // Same shape as utils/shiftDuration formatDurationMs ("142h 19m" / "4h" / "45m").
    const fmt = (ms: number) => {
      const totalMinutes = Math.floor(Math.max(ms, 0) / 60_000);
      if (totalMinutes < 1) return '<1m';
      const h = Math.floor(totalMinutes / 60);
      const m = totalMinutes % 60;
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h ${m}m`;
    };
    if (activeShift) {
      const end = activeShift.end ?? renderedAt;
      return fmt(Math.max(0, end - activeShift.start));
    }
    if (shift.open && shift.startedAt && employee === 'all') {
      return fmt(renderedAt - shift.startedAt);
    }
    if (employee !== 'all' && employeeShifts.length > 0) {
      // Sum closed + open shifts in list for this employee
      const total = employeeShifts.reduce((s, sh) => {
        const end = sh.end ?? renderedAt;
        return s + Math.max(0, end - sh.start);
      }, 0);
      return fmt(total);
    }
    return '6h 24m';
  }, [activeShift, shift.open, shift.startedAt, employee, employeeShifts, renderedAt]);

  const ping = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  };

  const statusOf = useCallback(
    (order: ReportOrder) => effectiveStatus(order, localRefunds[order.id]),
    [localRefunds],
  );

  const canRefundOrder = (o: ReportOrder) => statusOf(o) !== 'REFUNDED';

  const applyRefundResult = (result: RefundResult) => {
    if (!selectedOrder) return;
    setLocalRefunds((prev) => {
      const existing = prev[selectedOrder.id];
      const baseQty = mergedRefundedQty(selectedOrder, existing);
      const lineQty = { ...baseQty };
      for (const [id, q] of Object.entries(result.lineQty)) {
        lineQty[id] = (lineQty[id] ?? 0) + q;
      }
      const full =
        result.fullOrder ||
        selectedOrder.lines.every((l) => (lineQty[l.id] ?? 0) >= l.qty);
      const amount = (existing?.amount ?? selectedOrder.refundedAmount ?? 0) + result.amount;
      return {
        ...prev,
        [selectedOrder.id]: {
          full,
          reason: result.reason,
          lineQty,
          amount: full ? selectedOrder.total : amount,
        },
      };
    });
    setModal(null);
    ping(result.fullOrder ? 'Full order refunded' : 'Item refund recorded');
  };

  const cardBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of employeeFiltered) {
      if (statusOf(o) === 'REFUNDED' || o.method !== 'card') continue;
      const lr = localRefunds[o.id];
      const net = Math.max(0, o.total - (lr?.amount ?? o.refundedAmount ?? 0));
      const key = o.cardType || 'Card';
      map.set(key, (map.get(key) ?? 0) + net);
    }
    if (map.size === 0 && summary.card > 0) {
      map.set('Visa', summary.card * 0.55);
      map.set('Mastercard', summary.card * 0.35);
      map.set('Amex', summary.card * 0.1);
    }
    return Array.from(map.entries());
  }, [employeeFiltered, summary.card, localRefunds, statusOf]);

  const otherBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of employeeFiltered) {
      if (statusOf(o) === 'REFUNDED' || o.method !== 'other') continue;
      const lr = localRefunds[o.id];
      const net = Math.max(0, o.total - (lr?.amount ?? o.refundedAmount ?? 0));
      const key = o.methodLabel.replace(/^Other\s*·?\s*/i, '') || 'Other';
      map.set(key, (map.get(key) ?? 0) + net);
    }
    if (map.size === 0 && summary.other > 0) {
      map.set('CliQ', summary.other * 0.6);
      map.set('Talabat', summary.other * 0.4);
    }
    return Array.from(map.entries());
  }, [employeeFiltered, summary.other, localRefunds, statusOf]);

  const top3 = topItems.slice(0, 3);

  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-[#F5F5F7] p-2.5 dark:bg-mintcom-dark sm:p-3 md:p-4"
      onClick={() => {
        if (showPeriodMenu) setShowPeriodMenu(false);
        if (showTopPeriodMenu) setShowTopPeriodMenu(false);
      }}
    >
      {/* ── Header: Reporting + Print (POS desktop) ── */}
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <p className="font-sans text-[18px] font-bold tracking-[-0.02em] text-text-primary dark:text-white sm:text-[20px]">
          Reporting
        </p>
        <button
          type="button"
          onClick={() => setModal('print')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green text-white shadow-sm shadow-mintcom-green/30"
          title="Print report"
        >
          <Printer size={18} />
        </button>
      </div>

      {/* ── Mobile filter summary bar — expands the filter row (always visible on sm+) ── */}
      <button
        type="button"
        onClick={() => setFiltersExpanded((v) => !v)}
        aria-expanded={filtersExpanded}
        className="mb-2 flex min-h-[48px] w-full shrink-0 items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 text-start shadow-sm dark:border-white/10 dark:bg-mintcom-surface sm:hidden"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
          <SlidersHorizontal size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-text-primary dark:text-white">
            {periodLabel} · {formatDateShort(dateRange.start)} - {formatDateShort(dateRange.end)}
          </span>
          <span className="block truncate text-[11px] font-medium text-text-secondary dark:text-mintcom-textSecondary">
            {employee === 'all' ? 'All employees' : employee}
            {employee !== 'all' && selectedShiftId !== 'all'
              ? ` · ${(employeeShifts.find((s) => s.id === selectedShiftId)?.label ?? 'Shift')}`
              : ''}
            {' · '}{formatTime12(timeStart)} - {formatTime12(timeEnd)}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-text-tertiary transition-transform ${filtersExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Filter row: PERIOD | DATE RANGE | TIME RANGE | EMPLOYEE | SHIFT (POS desktop) ── */}
      <div className={`relative z-20 mb-2 shrink-0 flex-wrap items-end gap-2 ${filtersExpanded ? 'flex' : 'hidden'} sm:flex`}>
        <FilterField label="Period" className="w-full min-[380px]:w-[140px] shrink-0">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <FilterControlButton
              active={showPeriodMenu}
              onClick={() => setShowPeriodMenu((v) => !v)}
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Calendar size={16} className="shrink-0 text-mintcom-green" />
                <span className="truncate">{periodLabel}</span>
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-text-tertiary transition-transform ${showPeriodMenu ? 'rotate-180' : ''}`}
              />
            </FilterControlButton>
            {showPeriodMenu && (
              <div className="absolute start-0 top-[calc(100%+6px)] z-50 max-h-64 w-[200px] overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-mintcom-surface">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => applyPeriod(opt.id)}
                    className={`flex min-h-[44px] w-full px-3 py-2 text-start text-[12px] font-semibold transition-colors ${
                      period === opt.id
                        ? 'bg-mintcom-green/10 text-mintcom-green'
                        : 'text-text-primary dark:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </FilterField>

        <FilterField label="Date range" className="min-w-[180px] flex-1 sm:max-w-[260px]">
          <FilterControlButton onClick={() => setModal('dateRange')}>
            <span className="inline-flex min-w-0 items-center gap-2">
              <Calendar size={15} className="shrink-0 text-mintcom-green" />
              <span className="truncate text-[13px] font-semibold">
                {formatDateShort(dateRange.start)} - {formatDateShort(dateRange.end)}
              </span>
            </span>
          </FilterControlButton>
        </FilterField>

        <FilterField label="Time range" className="min-w-[160px] flex-1 sm:max-w-[200px]">
          <FilterControlButton onClick={() => setModal('timeRange')}>
            <span className="inline-flex min-w-0 items-center gap-2">
              <Clock size={15} className="shrink-0 text-mintcom-green" />
              <span className="truncate text-[13px] font-semibold">
                {formatTime12(timeStart)} - {formatTime12(timeEnd)}
              </span>
            </span>
          </FilterControlButton>
        </FilterField>

        {/* Employee — same row as time range (POS filtersRowContainer) */}
        <FilterField label="Employee" className="min-w-[180px] flex-1 sm:max-w-[220px]">
          <div className="relative">
            <select
              value={employee}
              onChange={(e) => {
                setEmployee(e.target.value);
                setSelectedShiftId('all');
              }}
              className="h-11 min-h-[44px] w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 ps-9 pe-8 text-[16px] sm:text-[13px] font-semibold text-text-primary outline-none dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
            >
              <option value="all">All Employees</option>
              {employees.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <User
              size={16}
              className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-mintcom-green"
            />
            <ChevronDown
              size={14}
              className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
            />
          </div>
        </FilterField>

        {/* Shift — only when an employee is selected (POS) */}
        {employee !== 'all' && (
          <FilterField label="Shift" className="min-w-[180px] flex-1 sm:max-w-[240px]">
            <div className="relative">
              <select
                value={selectedShiftId}
                onChange={(e) => setSelectedShiftId(e.target.value)}
                disabled={employeeShifts.length === 0}
                className="h-11 min-h-[44px] w-full appearance-none truncate rounded-xl border border-gray-200 bg-white py-2 ps-9 pe-8 text-[16px] sm:text-[13px] font-semibold text-text-primary outline-none disabled:opacity-50 dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                title="Select shift"
              >
                {employeeShifts.length === 0 ? (
                  <option value="all">No shifts found</option>
                ) : (
                  <>
                    <option value="all">All shifts</option>
                    {employeeShifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </>
                )}
              </select>
              <Clock
                size={15}
                className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-mintcom-green"
              />
              <ChevronDown
                size={14}
                className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-text-tertiary"
              />
            </div>
          </FilterField>
        )}
      </div>

      {/* ── Tabs: General Report | Item Report (underline, POS) ── */}
      <div className="relative mb-2 flex shrink-0 border-b border-gray-200 dark:border-white/10">
        {(
          [
            { id: 'general' as const, label: 'General Report' },
            { id: 'items' as const, label: 'Items Report' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setReportTab(t.id)}
            className={`relative flex-1 py-3 min-h-[44px] text-center text-[12px] font-semibold transition-colors sm:text-[13px] ${
              reportTab === t.id
                ? 'text-mintcom-green'
                : 'text-text-secondary dark:text-mintcom-textSecondary'
            }`}
          >
            {t.label}
            {reportTab === t.id && (
              <span className="absolute inset-x-0 -bottom-px h-[2.5px] rounded-t-full bg-mintcom-green" />
            )}
          </button>
        ))}
      </div>

      {/*
        Page itself does not scroll — only the Orders & Receipts list (and
        item-report lists) scroll. General report fills remaining height.
      */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pe-0.5">
        {/* ═══════ GENERAL REPORT ═══════ */}
        {reportTab === 'general' && (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto lg:overflow-hidden overscroll-contain">
            {/* SalesSummaryCards — compact so 3 order rows fit below without page scroll */}
            <div className="flex sm:grid shrink-0 sm:grid-cols-4 gap-2.5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none -mx-0.5 px-0.5 pb-0.5 [&>*]:w-[158px] [&>*]:flex-none [&>*]:snap-start sm:[&>*]:w-auto">
              <StatCard
                primary
                label="Net Sales"
                hint="Excludes tax & service/other charges"
                value={money(summary.netBeforeTax > 0 ? summary.netBeforeTax : summary.net / 1.08)}
                icon={<TrendingUp size={18} strokeWidth={2.25} />}
                onClick={() => setModal('totals')}
                info="Includes tax and service/other charges. Tap to view the full sales breakdown."
              />
              <StatCard
                label="Card Sales"
                value={money(summary.card)}
                icon={<PosCardIcon size={18} />}
                onClick={() => setModal('card')}
                info="Total paid using card transactions."
              />
              <StatCard
                label="Cash Sales"
                value={money(summary.cash)}
                icon={<PosCashIcon size={18} />}
                info="Total paid with cash transactions."
              />
              <StatCard
                label="Refunds"
                value={money(-Math.abs(summary.refunds))}
                icon={<Undo2 size={16} />}
                info="Money returned to customers in the selected period."
              />
              <StatCard
                label="Other Payments"
                value={money(summary.other)}
                icon={<PosOtherReceiptIcon size={18} />}
                onClick={() => setModal('other')}
                info="Payments from methods beyond cash and card."
              />
              <StatCard
                label="Total Hours Worked"
                value={hoursWorked}
                icon={<Clock size={16} />}
                onClick={() => setModal('time')}
                info="Tap to view detailed shift-time entries."
              />
              <StatCard
                label="Total Orders"
                value={String(summary.orders)}
                icon={<Receipt size={16} />}
                info="Number of orders in the selected period."
              />
              <StatCard
                label="PAY-IN/PAY-OUT"
                value="Non-sales transactions"
                icon={
                  <span className="flex flex-col items-center leading-none">
                    <ArrowDownLeft size={12} strokeWidth={2.5} />
                    <ArrowUpRight size={12} strokeWidth={2.5} className="-mt-0.5" />
                  </span>
                }
                onClick={() => setModal('payinout')}
                info="Tap to view non-sales transactions log"
              />
            </div>

            {/*
              Orders list viewport sized for ~3 compact rows (header ~44 + 3×50 = ~194).
              Only this list scrolls — page chrome stays fixed.
            */}
            <div className="mb-2 grid shrink-0 grid-cols-2 gap-1 rounded-xl bg-cream-100 p-1 dark:bg-mintcom-dark lg:hidden" role="tablist" aria-label="Report sections">
              <button type="button" role="tab" aria-selected={mobilePane === 'left'} onClick={() => setMobilePane('left')} className={`min-h-[40px] rounded-xl px-2 text-[12px] font-bold transition-colors ${mobilePane === 'left' ? 'bg-white text-text-primary shadow-sm dark:bg-mintcom-surface dark:text-white' : 'text-text-secondary dark:text-mintcom-textSecondary'}`}>Orders & Receipts</button>
              <button type="button" role="tab" aria-selected={mobilePane === 'right'} onClick={() => setMobilePane('right')} className={`min-h-[40px] rounded-xl px-2 text-[12px] font-bold transition-colors ${mobilePane === 'right' ? 'bg-white text-text-primary shadow-sm dark:bg-mintcom-surface dark:text-white' : 'text-text-secondary dark:text-mintcom-textSecondary'}`}>Top 3 Items</button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr] gap-3 overflow-hidden overscroll-contain lg:grid-cols-[1.35fr_1fr] lg:grid-rows-1">
              <Shell className={`${mobilePane === 'left' ? 'flex' : 'hidden'} lg:flex min-h-[240px] lg:min-h-0 min-w-0 flex-col overflow-hidden`}>
                <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 dark:border-white/10 sm:px-4">
                  <p className="text-[15px] font-semibold text-text-primary dark:text-white">
                    Orders & Receipts
                  </p>
                  <button
                    type="button"
                    onClick={openOrderFilterModal}
                    className={`relative inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-semibold ${
                      hasActiveFilters
                        ? 'border-mintcom-green bg-mintcom-green/10 text-mintcom-green'
                        : 'border-gray-200 bg-white text-text-secondary dark:border-white/10 dark:bg-mintcom-surface'
                    }`}
                  >
                    <SlidersHorizontal size={13} />
                    Filters
                    {hasActiveFilters && (
                      <span className="absolute -end-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-white bg-mintcom-green px-1 text-[10px] font-bold text-white dark:border-mintcom-surface">
                        {filterCount}
                      </span>
                    )}
                  </button>
                </div>

                {filteredTotals != null && (
                  <div className="mx-3 mt-1.5 shrink-0 rounded-xl bg-mintcom-green px-2.5 py-1.5 !text-white sm:mx-4">
                    <div className="flex items-center justify-between text-[11px] font-semibold !text-white">
                      <span className="inline-flex items-center gap-1.5 !text-white">
                        <Filter size={11} className="text-white" /> Total
                      </span>
                      <span className="text-[13px] font-bold tabular-nums !text-white">{money(filteredTotals)}</span>
                    </div>
                  </div>
                )}

                {/* Only the order cards scroll */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {filteredOrders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <ShoppingBag size={32} className="mb-2 text-gray-300" strokeWidth={1.5} />
                      <p className="text-sm font-medium text-text-secondary">No orders found</p>
                    </div>
                  )}
                  {filteredOrders.map((o, idx) => {
                    const st = statusOf(o);
                    const lr = localRefunds[o.id];
                    const displayTotal =
                      st === 'REFUNDED'
                        ? -Math.abs(o.total)
                        : Math.max(0, o.total - (lr?.amount ?? o.refundedAmount ?? 0));
                    return (
                      <OrderTableRow
                        key={o.id}
                        order={o}
                        status={st}
                        displayTotal={displayTotal}
                        canRefund={canRefundOrder(o)}
                        isLast={idx === filteredOrders.length - 1}
                        onView={() => setSelectedOrder(o)}
                        onRefund={() => {
                          setSelectedOrder(o);
                          setModal('refund');
                        }}
                        onPrint={() => {
                          /* Same as POS view-details receipt; print via header button */
                          setSelectedOrder(o);
                        }}
                      />
                    );
                  })}
                </div>
              </Shell>

              <Shell className={`${mobilePane === 'right' ? 'flex' : 'hidden'} lg:flex min-h-[240px] lg:min-h-0 min-w-0 flex-col overflow-hidden`}>
                <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 dark:border-white/10 sm:px-4">
                  <p className="min-w-0 truncate text-[15px] font-semibold text-text-primary dark:text-white">
                    Top 3 Selling Items
                  </p>
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setShowTopPeriodMenu((v) => !v)}
                      className={`inline-flex h-8 items-center gap-1.5 rounded-xl border bg-white py-1 ps-2 pe-1 text-[11px] font-semibold dark:bg-mintcom-surface ${
                        showTopPeriodMenu
                          ? 'border-mintcom-green'
                          : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <Calendar size={13} className="text-mintcom-green" />
                      <span className="text-text-primary dark:text-white">
                        {topItemsPeriod === 'today'
                          ? 'Today'
                          : topItemsPeriod === 'week'
                            ? 'This Week'
                            : 'This Month'}
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mintcom-green/10 text-mintcom-green">
                        <ChevronDown
                          size={12}
                          className={showTopPeriodMenu ? 'rotate-180' : ''}
                        />
                      </span>
                    </button>
                    {showTopPeriodMenu && (
                      <div className="absolute end-0 top-[calc(100%+6px)] z-40 w-[150px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-white/10 dark:bg-mintcom-surface">
                        {(
                          [
                            { id: 'today' as const, label: 'Today' },
                            { id: 'week' as const, label: 'This Week' },
                            { id: 'month' as const, label: 'This Month' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setTopItemsPeriod(opt.id);
                              setShowTopPeriodMenu(false);
                            }}
                            className={`flex w-full px-3 py-2 text-start text-[12px] font-semibold ${
                              topItemsPeriod === opt.id
                                ? 'bg-mintcom-green/10 text-mintcom-green'
                                : 'text-text-primary dark:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden p-2.5 sm:p-3">
                  {top3.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <BarChart3 size={36} className="mb-2 text-gray-300" strokeWidth={1.25} />
                      <p className="text-[12px] font-medium text-text-tertiary">
                        No top selling items yet
                      </p>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col justify-between gap-0">
                      {top3.map((item, i) => (
                        <button
                          type="button"
                          key={item.name}
                          onClick={() => {
                            setReportTab('items');
                            setItemMainTab('products');
                            setItemNameFilter(item.name);
                          }}
                          className="flex min-h-0 flex-1 items-center gap-2.5 border-b border-gray-100 px-1 text-start transition-colors last:border-0 hover:bg-gray-50 dark:border-white/8 dark:hover:bg-white/5"
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-lg dark:bg-white/5">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              item.emoji || <Package size={18} className="text-gray-400" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-[13px] font-semibold text-text-primary dark:text-white">
                                {item.name}
                              </p>
                              {priceHistoryByName[item.name] && (
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openAudit(item.name);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.stopPropagation();
                                      openAudit(item.name);
                                    }
                                  }}
                                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-500"
                                  aria-label="View price history"
                                >
                                  <Clock size={12} />
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-text-tertiary">{item.qty} sold</p>
                          </div>
                          <p className="text-[13px] font-semibold tabular-nums text-mintcom-green">
                            {money(item.revenue)}
                          </p>
                          <span className="text-[10px] font-bold text-text-tertiary">#{i + 1}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </Shell>
            </div>
          </div>
        )}

        {/* ═══════ ITEM REPORT — exact POS layout ═══════ */}
        {reportTab === 'items' && (
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto lg:overflow-hidden overscroll-contain">
            {/* Products | Attributes + filters (POS: Categories/Items OR Attributes/Add-ons) */}
            <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-nowrap sm:items-center sm:gap-3">
              <div className="col-span-2 grid shrink-0 grid-cols-2 gap-2 rounded-xl bg-transparent sm:flex sm:gap-0">
                <button
                  type="button"
                  onClick={() => {
                    setItemMainTab('products');
                    // Real POS clears attribute filters when switching to Products
                    setAttributeGroupFilter('all');
                    setAddonFilter('all');
                  }}
                  className={`rounded-xl px-5 py-2.5 min-h-[44px] text-[13px] font-semibold transition-colors ${
                    itemMainTab === 'products'
                      ? 'bg-mintcom-green text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-text-secondary dark:border-white/10 dark:bg-mintcom-surface'
                  }`}
                >
                  Products
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemMainTab('attributes');
                    // Real POS clears product filters when switching to Attributes
                    setCategoryFilter('all');
                    setItemNameFilter('all');
                  }}
                  className={`rounded-xl px-5 py-2.5 min-h-[44px] text-[13px] font-semibold transition-colors sm:ms-2 ${
                    itemMainTab === 'attributes'
                      ? 'bg-mintcom-green text-white shadow-sm'
                      : 'border border-gray-200 bg-white text-text-secondary dark:border-white/10 dark:bg-mintcom-surface'
                  }`}
                >
                  Attributes
                </button>
              </div>

              {itemMainTab === 'products' && (
                <div className="col-span-2 grid min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-1 sm:gap-3">
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute start-3 top-1.5 text-[10px] font-medium text-text-tertiary">
                      Categories
                    </span>
                    <select
                      value={categoryFilter}
                      onChange={(e) => {
                        setCategoryFilter(e.target.value);
                        setItemNameFilter('all');
                      }}
                      className="h-[48px] w-full appearance-none rounded-xl border border-gray-200 bg-white pb-1.5 ps-3 pe-8 pt-5 text-[13px] font-semibold text-text-primary outline-none dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                    >
                      <option value="all">All Categories</option>
                      {(itemBreakdown.categories.length
                        ? itemBreakdown.categories.map((c) => c.name)
                        : [...CATS]
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                    />
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute start-3 top-1.5 text-[10px] font-medium text-text-tertiary">
                      Items
                    </span>
                    <select
                      value={itemNameFilter}
                      onChange={(e) => setItemNameFilter(e.target.value)}
                      className="h-[48px] w-full appearance-none rounded-xl border border-gray-200 bg-white pb-1.5 ps-3 pe-8 pt-5 text-[13px] font-semibold text-text-primary outline-none dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                    >
                      <option value="all">All Items</option>
                      {(categoryFilter === 'all'
                        ? itemBreakdown.items
                        : itemBreakdown.items.filter((i) => i.cat === categoryFilter)
                      ).map((i) => (
                        <option key={i.name} value={i.name}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                    />
                  </div>
                </div>
              )}

              {itemMainTab === 'attributes' && (
                <div className="col-span-2 grid min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-1 sm:gap-3">
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute start-3 top-1.5 text-[10px] font-medium text-text-tertiary">
                      Attributes
                    </span>
                    <select
                      value={attributeGroupFilter}
                      onChange={(e) => {
                        setAttributeGroupFilter(e.target.value);
                        setAddonFilter('all');
                      }}
                      className="h-[48px] w-full appearance-none rounded-xl border border-gray-200 bg-white pb-1.5 ps-3 pe-8 pt-5 text-[13px] font-semibold text-text-primary outline-none dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                    >
                      <option value="all">All Attributes</option>
                      {reportAddonGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                    />
                  </div>
                  <div className="relative min-w-0 flex-1">
                    <span className="pointer-events-none absolute start-3 top-1.5 text-[10px] font-medium text-text-tertiary">
                      Add-ons
                    </span>
                    <select
                      value={addonFilter}
                      onChange={(e) => setAddonFilter(e.target.value)}
                      className="h-[48px] w-full appearance-none rounded-xl border border-gray-200 bg-white pb-1.5 ps-3 pe-8 pt-5 text-[13px] font-semibold text-text-primary outline-none dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                    >
                      <option value="all">All Add-ons</option>
                      {addonOptionsForFilter.map((m) => (
                        <option key={`${m.attributeId}-${m.name}`} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 6 compact KPI cards — POS Item Report (icon wells 42×42 r12) */}
            <div className="flex sm:grid shrink-0 sm:grid-cols-4 gap-2.5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory scrollbar-none -mx-0.5 px-0.5 pb-0.5 [&>*]:w-[158px] [&>*]:flex-none [&>*]:snap-start sm:[&>*]:w-auto">
              <StatCard
                primary
                label="Total Sales"
                hint="Excludes tax & service/other charges"
                value={money(itemReportStats.sales)}
                icon={<TrendingUp size={18} strokeWidth={2.25} />}
                onClick={() => setModal('totals')}
              />
              <StatCard
                label="Total Quantity"
                value={itemReportStats.qty}
                icon={<ShoppingBag size={18} />}
              />
              <StatCard
                label="Net Orders"
                value={itemReportStats.orders}
                icon={<Receipt size={18} />}
              />
              <StatCard
                label="Total Refunds"
                value={money(itemReportStats.refunds)}
                icon={<Undo2 size={16} />}
              />
            </div>

            {/* Related Orders (left) | Item Breakdown (right) — only lists scroll */}
            <div className="mb-2 grid shrink-0 grid-cols-2 gap-1 rounded-xl bg-cream-100 p-1 dark:bg-mintcom-dark lg:hidden" role="tablist" aria-label="Report sections">
              <button type="button" role="tab" aria-selected={mobilePane === 'left'} onClick={() => setMobilePane('left')} className={`min-h-[40px] rounded-xl px-2 text-[12px] font-bold transition-colors ${mobilePane === 'left' ? 'bg-white text-text-primary shadow-sm dark:bg-mintcom-surface dark:text-white' : 'text-text-secondary dark:text-mintcom-textSecondary'}`}>Related Orders</button>
              <button type="button" role="tab" aria-selected={mobilePane === 'right'} onClick={() => setMobilePane('right')} className={`min-h-[40px] rounded-xl px-2 text-[12px] font-bold transition-colors ${mobilePane === 'right' ? 'bg-white text-text-primary shadow-sm dark:bg-mintcom-surface dark:text-white' : 'text-text-secondary dark:text-mintcom-textSecondary'}`}>Item Breakdown</button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[1fr] gap-3 overflow-hidden overscroll-contain lg:grid-cols-[1.35fr_1fr] lg:grid-rows-1">
              <Shell className={`${mobilePane === 'left' ? 'flex' : 'hidden'} lg:flex min-h-[240px] lg:min-h-0 min-w-0 flex-col overflow-hidden`}>
                <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 dark:border-white/10 sm:px-4">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-mintcom-green" />
                    <p className="text-[15px] font-semibold text-text-primary dark:text-white">
                      Related Orders
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openOrderFilterModal}
                    className={`relative inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[11px] font-semibold ${
                      hasActiveFilters
                        ? 'border-mintcom-green bg-mintcom-green/10 text-mintcom-green'
                        : 'border-gray-200 text-text-secondary dark:border-white/10'
                    }`}
                  >
                    <SlidersHorizontal size={13} />
                    Filters
                    {hasActiveFilters && (
                      <span className="absolute -end-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-white bg-mintcom-green px-1 text-[10px] font-bold text-white">
                        {filterCount}
                      </span>
                    )}
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {filteredOrders.length === 0 && (
                    <div className="flex flex-col items-center py-10 text-center">
                      <ShoppingBag size={32} className="mb-2 text-gray-300" />
                      <p className="text-sm text-text-secondary">No related orders found</p>
                    </div>
                  )}
                  {filteredOrders.map((o, idx) => {
                    const st = statusOf(o);
                    const lr = localRefunds[o.id];
                    const displayTotal =
                      st === 'REFUNDED'
                        ? -Math.abs(o.total)
                        : Math.max(0, o.total - (lr?.amount ?? o.refundedAmount ?? 0));
                    return (
                      <OrderTableRow
                        key={o.id}
                        order={o}
                        status={st}
                        displayTotal={displayTotal}
                        canRefund={canRefundOrder(o)}
                        isLast={idx === filteredOrders.length - 1}
                        onView={() => setSelectedOrder(o)}
                        onRefund={() => {
                          setSelectedOrder(o);
                          setModal('refund');
                        }}
                        onPrint={() => {
                          /* Same as POS view-details receipt; print via header button */
                          setSelectedOrder(o);
                        }}
                      />
                    );
                  })}
                </div>
              </Shell>

              <Shell className={`${mobilePane === 'right' ? 'flex' : 'hidden'} lg:flex min-h-[240px] lg:min-h-0 min-w-0 flex-col overflow-hidden`}>
                <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-gray-200 px-3 dark:border-white/10 sm:px-4">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-mintcom-green" />
                    <p className="text-[15px] font-semibold text-text-primary dark:text-white">
                      {itemMainTab === 'products' ? 'Item Breakdown' : 'Attribute Breakdown'}
                    </p>
                  </div>
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-mintcom-green/15 px-2 text-[12px] font-bold text-mintcom-green">
                    {itemMainTab === 'products'
                      ? filteredItemBreakdown.length
                      : filteredModifierBreakdown.length}
                  </span>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  {itemMainTab === 'products' &&
                    (filteredItemBreakdown.length === 0 ? (
                      <div className="flex flex-col items-center py-16 text-center">
                        <Box size={36} className="mb-2 text-gray-300" />
                        <p className="text-sm text-text-secondary">No items data</p>
                      </div>
                    ) : (
                      filteredItemBreakdown.map((row, idx) => (
                        <div
                          key={row.name}
                          className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${
                            idx < filteredItemBreakdown.length - 1
                              ? 'border-b border-gray-100 dark:border-white/8'
                              : ''
                          }`}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 text-[24px] leading-none dark:bg-white/5">
                            {row.image ? (
                              <img
                                src={row.image}
                                alt={row.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              row.emoji || <Package size={22} className="text-gray-400" strokeWidth={1.5} />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-[14px] font-semibold text-text-primary dark:text-white">
                                {row.name}
                              </p>
                              {row.refunds > 0 && (
                                <Undo2
                                  size={13}
                                  className="shrink-0 text-amber-500"
                                  aria-label="Has refunds"
                                />
                              )}
                              {priceHistoryByName[row.name] && (
                                <button
                                  type="button"
                                  onClick={() => openAudit(row.name)}
                                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-500/50 bg-amber-500/10 text-amber-500"
                                  aria-label="View price history"
                                >
                                  <Clock size={12} />
                                </button>
                              )}
                            </div>
                            <p className="text-[12px] text-text-tertiary">
                              {row.qty} sold{row.refundQty > 0 ? ` · ${row.refundQty} refunded` : ''}
                            </p>
                          </div>
                          <p className="text-[14px] font-semibold tabular-nums text-mintcom-green">
                            {money(row.sales)}
                          </p>
                        </div>
                      ))
                    ))}
                  {itemMainTab === 'attributes' &&
                    (filteredModifierBreakdown.length === 0 ? (
                      <div className="flex flex-col items-center py-16 text-center">
                        <Box size={36} className="mb-2 text-gray-300" />
                        <p className="text-sm text-text-secondary">No attributes data</p>
                      </div>
                    ) : (
                      filteredModifierBreakdown.map((row, idx) => (
                        <div
                          key={`${row.attributeId}-${row.name}`}
                          className={`flex items-center gap-3 px-3 py-3 sm:px-4 ${
                            idx < filteredModifierBreakdown.length - 1
                              ? 'border-b border-gray-100 dark:border-white/8'
                              : ''
                          }`}
                        >
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50 dark:bg-white/5">
                            <Package size={22} className="text-gray-400" strokeWidth={1.5} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-semibold text-text-primary dark:text-white">
                              {row.name}
                            </p>
                            <p className="text-[12px] text-text-tertiary">
                              {row.attributeName} · {row.qty} sold
                            </p>
                          </div>
                          <p className="text-[14px] font-semibold tabular-nums text-mintcom-green">
                            {money(row.sales)}
                          </p>
                        </div>
                      ))
                    ))}
                </div>
              </Shell>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {/* Order Filter Modal — journey style, exact POS ReportsScreen match */}
        {showFilters && (
          <div className="fixed inset-0 z-[85] flex items-center justify-center p-3 sm:p-4">
            <button
              type="button"
              aria-label="Close filters"
              className="absolute inset-0 bg-black/70"
              onClick={cancelOrderFilters}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative flex h-[min(580px,85dvh)] w-full max-w-[480px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
            >
              {/* Header — "Filter by {step}" */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-white/10">
                <h3 className="text-[20px] font-extrabold tracking-tight text-text-primary dark:text-white">
                  Filter by {FILTER_STEPS[filterStep].title}
                </h3>
                <button
                  type="button"
                  onClick={cancelOrderFilters}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-text-secondary dark:bg-white/10"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Step body — scrolls when nested options expand (POS behavior) */}
              <div
                ref={filterScrollRef}
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-3"
              >
                <div className="flex flex-col gap-3 pb-4">
                  {/* ── Step 0: Payment Method ── */}
                  {filterStep === 0 && (
                    <>
                      {/* All Methods */}
                      <JourneyOption
                        selected={
                          !tempFilters.payment &&
                          tempFilters.cardTypes.length === 0 &&
                          tempFilters.otherMethods.length === 0
                        }
                        icon={<Wallet size={22} />}
                        label="All Methods"
                        desc="Show all payment types"
                        onClick={() => {
                          setTempFilters((t) => ({
                            ...t,
                            payment: null,
                            cardTypes: [],
                            otherMethods: [],
                          }));
                          setShowCardTypes(false);
                          setShowOtherPayments(false);
                        }}
                      />

                      {/* Cash */}
                      <JourneyOption
                        selected={tempFilters.payment === 'CASH'}
                        icon={<PosCashIcon size={22} />}
                        label="Cash"
                        onClick={() => {
                          setTempFilters((t) => ({
                            ...t,
                            payment: 'CASH',
                            cardTypes: [],
                            otherMethods: [],
                          }));
                          setShowCardTypes(false);
                          setShowOtherPayments(false);
                        }}
                      />

                      {/* Card (+ expandable card types) */}
                      <div>
                        <JourneyOption
                          selected={
                            tempFilters.payment === 'CARD' ||
                            showCardTypes ||
                            tempFilters.cardTypes.length > 0
                          }
                          icon={<PosCardIcon size={22} />}
                          label="Card"
                          desc={`${DEMO_CARD_TYPES.length + 1} card options`}
                          trailing={
                            showCardTypes ? (
                              <ChevronUp size={20} className="text-text-tertiary" />
                            ) : (
                              <ChevronDown size={20} className="text-text-tertiary" />
                            )
                          }
                          onClick={() => {
                            const expanding = !showCardTypes;
                            setShowCardTypes(expanding);
                            if (expanding) {
                              setTempFilters((t) => ({
                                ...t,
                                payment: 'CARD',
                                otherMethods: [],
                              }));
                            }
                            setShowOtherPayments(false);
                          }}
                        />
                        {showCardTypes && (
                          <div
                            ref={filterExpandRef}
                            className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setTempFilters((t) => ({
                                  ...t,
                                  cardTypes: [],
                                  payment: 'CARD',
                                }))
                              }
                              className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start ${
                                tempFilters.cardTypes.length === 0
                                  ? 'border-mintcom-green border-[1.5px]'
                                  : 'border-gray-200 dark:border-white/10'
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                  tempFilters.cardTypes.length === 0
                                    ? 'bg-mintcom-green text-white'
                                    : 'bg-gray-200 text-text-secondary dark:bg-white/10'
                                }`}
                              >
                                <PosCardIcon size={18} />
                              </span>
                              <span
                                className={`flex-1 text-[13px] font-semibold ${
                                  tempFilters.cardTypes.length === 0
                                    ? 'text-mintcom-green'
                                    : 'text-text-primary dark:text-white'
                                }`}
                              >
                                All Cards
                              </span>
                              {tempFilters.cardTypes.length === 0 && (
                                <Check size={16} className="text-mintcom-green" />
                              )}
                            </button>
                            {DEMO_CARD_TYPES.map((ct) => {
                              const selected = tempFilters.cardTypes.includes(ct.value);
                              return (
                                <button
                                  key={ct.value}
                                  type="button"
                                  onClick={() => {
                                    setTempFilters((t) => {
                                      const next = selected
                                        ? t.cardTypes.filter((x) => x !== ct.value)
                                        : [...t.cardTypes, ct.value];
                                      return {
                                        ...t,
                                        cardTypes: next,
                                        payment: next.length === 0 ? 'CARD' : null,
                                        otherMethods: [],
                                      };
                                    });
                                  }}
                                  className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start last:mb-0 ${
                                    selected
                                      ? 'border-[1.5px]'
                                      : 'border-gray-200 dark:border-white/10'
                                  }`}
                                  style={selected ? { borderColor: ct.color } : undefined}
                                >
                                  <span
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white"
                                    style={{
                                      backgroundColor: selected ? ct.color : undefined,
                                    }}
                                  >
                                    <span
                                      className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                        selected ? '' : 'bg-gray-200 text-text-secondary dark:bg-white/10'
                                      }`}
                                      style={selected ? { backgroundColor: ct.color } : undefined}
                                    >
                                      <PosCardIcon size={18} className={selected ? 'text-white' : undefined} />
                                    </span>
                                  </span>
                                  <span
                                    className="flex-1 text-[13px] font-semibold"
                                    style={{ color: selected ? ct.color : undefined }}
                                  >
                                    {ct.label}
                                  </span>
                                  {selected && <Check size={16} style={{ color: ct.color }} />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Other Methods */}
                      <div>
                        <JourneyOption
                          selected={
                            showOtherPayments ||
                            tempFilters.otherMethods.length > 0 ||
                            tempFilters.payment === 'OTHER'
                          }
                          icon={<PosOtherReceiptIcon size={22} />}
                          label="Other Methods"
                          desc={`${DEMO_OTHER_METHODS.length} payment options`}
                          trailing={
                            showOtherPayments ? (
                              <ChevronUp size={20} className="text-text-tertiary" />
                            ) : (
                              <ChevronDown size={20} className="text-text-tertiary" />
                            )
                          }
                          onClick={() => {
                            const expanding = !showOtherPayments;
                            setShowOtherPayments(expanding);
                            if (expanding) {
                              setTempFilters((t) => ({
                                ...t,
                                payment: 'OTHER',
                                cardTypes: [],
                              }));
                            }
                            setShowCardTypes(false);
                          }}
                        />
                        {showOtherPayments && (
                          <div
                            ref={filterExpandRef}
                            className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setTempFilters((t) => ({
                                  ...t,
                                  otherMethods: [],
                                  payment: 'OTHER',
                                  cardTypes: [],
                                }))
                              }
                              className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start ${
                                tempFilters.otherMethods.length === 0 &&
                                tempFilters.payment === 'OTHER'
                                  ? 'border-[1.5px] border-mintcom-green'
                                  : 'border-gray-200 dark:border-white/10'
                              }`}
                            >
                              <span
                                className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                  tempFilters.otherMethods.length === 0 &&
                                  tempFilters.payment === 'OTHER'
                                    ? 'bg-mintcom-green text-white'
                                    : 'bg-gray-200 text-text-secondary dark:bg-white/10'
                                }`}
                              >
                                <MoreHorizontal size={18} />
                              </span>
                              <span
                                className={`flex-1 text-[13px] font-semibold ${
                                  tempFilters.otherMethods.length === 0 &&
                                  tempFilters.payment === 'OTHER'
                                    ? 'text-mintcom-green'
                                    : 'text-text-primary dark:text-white'
                                }`}
                              >
                                All Other Payments
                              </span>
                              {tempFilters.otherMethods.length === 0 &&
                                tempFilters.payment === 'OTHER' && (
                                  <Check size={16} className="text-mintcom-green" />
                                )}
                            </button>
                            {DEMO_OTHER_METHODS.map((m) => {
                              const selected = tempFilters.otherMethods.includes(m.name);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => {
                                    setTempFilters((t) => {
                                      const next = selected
                                        ? t.otherMethods.filter((x) => x !== m.name)
                                        : [...t.otherMethods, m.name];
                                      return {
                                        ...t,
                                        otherMethods: next,
                                        // POS: clear main payment when specific other methods are picked
                                        payment: null,
                                        cardTypes: [],
                                      };
                                    });
                                  }}
                                  className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start last:mb-0 ${
                                    selected
                                      ? 'border-[1.5px] border-mintcom-green'
                                      : 'border-gray-200 dark:border-white/10'
                                  }`}
                                >
                                  <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                      selected
                                        ? 'bg-mintcom-green text-white'
                                        : 'bg-gray-200 text-text-secondary dark:bg-white/10'
                                    }`}
                                  >
                                    <PosOtherReceiptIcon size={16} />
                                  </span>
                                  <span
                                    className={`flex-1 text-[13px] font-semibold ${
                                      selected
                                        ? 'text-mintcom-green'
                                        : 'text-text-primary dark:text-white'
                                    }`}
                                  >
                                    {m.name}
                                  </span>
                                  {selected && (
                                    <Check size={16} className="text-mintcom-green" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* ── Step 1: Status ── */}
                  {filterStep === 1 && (
                    <>
                      <JourneyOption
                        selected={!tempFilters.status}
                        icon={<Receipt size={22} />}
                        label="All Orders"
                        desc="Show paid and refunded"
                        onClick={() => setTempFilters((t) => ({ ...t, status: null }))}
                      />
                      <JourneyOption
                        selected={tempFilters.status === 'COMPLETED'}
                        icon={<CircleCheck size={22} />}
                        label="Paid"
                        desc="Successfully completed"
                        accent="#7dc6a2"
                        onClick={() =>
                          setTempFilters((t) => ({ ...t, status: 'COMPLETED' }))
                        }
                      />
                      <JourneyOption
                        selected={tempFilters.status === 'PAID_TAX_CHANGED'}
                        icon={<Pencil size={22} />}
                        label="Paid (Tax Change)"
                        desc="Tax changed transactions"
                        accent="#7dc6a2"
                        onClick={() =>
                          setTempFilters((t) => ({ ...t, status: 'PAID_TAX_CHANGED' }))
                        }
                      />
                      <JourneyOption
                        selected={tempFilters.status === 'REFUNDED'}
                        icon={<Undo2 size={22} />}
                        label="Refunded"
                        desc="Money returned"
                        accent="#D55263"
                        onClick={() =>
                          setTempFilters((t) => ({ ...t, status: 'REFUNDED' }))
                        }
                      />
                    </>
                  )}

                  {/* ── Step 2: Discount ── */}
                  {filterStep === 2 && (
                    <>
                      <JourneyOption
                        selected={tempFilters.discounts.length === 0}
                        icon={<Tag size={22} />}
                        label="All Orders"
                        desc="With or without discount"
                        onClick={() => {
                          setTempFilters((t) => ({ ...t, discounts: [] }));
                          setShowSpecificDiscounts(false);
                        }}
                      />
                      <JourneyOption
                        selected={tempFilters.discounts.includes('HAS_DISCOUNT')}
                        icon={<Percent size={22} />}
                        label="With Discount"
                        desc="Orders with any discount"
                        accent="#F59E0B"
                        iconBgIdle="#FFF7ED"
                        iconColorIdle="#F59E0B"
                        onClick={() => {
                          setTempFilters((t) => ({ ...t, discounts: ['HAS_DISCOUNT'] }));
                          setShowSpecificDiscounts(false);
                        }}
                      />
                      <JourneyOption
                        selected={tempFilters.discounts.includes('NO_DISCOUNT')}
                        icon={<Banknote size={22} />}
                        label="Full Price"
                        desc="No discount applied"
                        onClick={() => {
                          setTempFilters((t) => ({ ...t, discounts: ['NO_DISCOUNT'] }));
                          setShowSpecificDiscounts(false);
                        }}
                      />
                      <div>
                        <JourneyOption
                          selected={
                            showSpecificDiscounts ||
                            tempFilters.discounts.some(
                              (d) => d !== 'HAS_DISCOUNT' && d !== 'NO_DISCOUNT',
                            )
                          }
                          icon={<Tag size={22} />}
                          label="Specific Discounts"
                          desc={`${DEMO_DISCOUNTS.length} discounts`}
                          trailing={
                            showSpecificDiscounts ? (
                              <ChevronUp size={20} className="text-text-tertiary" />
                            ) : (
                              <ChevronDown size={20} className="text-text-tertiary" />
                            )
                          }
                          onClick={() => setShowSpecificDiscounts((v) => !v)}
                        />
                        {showSpecificDiscounts && (
                          <div
                            ref={filterExpandRef}
                            className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-white/10 dark:bg-white/5"
                          >
                            {DEMO_DISCOUNTS.map((d) => {
                              const selected = tempFilters.discounts.includes(d.id);
                              return (
                                <button
                                  key={d.id}
                                  type="button"
                                  onClick={() => {
                                    setTempFilters((t) => {
                                      const withoutGeneric = t.discounts.filter(
                                        (x) => x !== 'HAS_DISCOUNT' && x !== 'NO_DISCOUNT',
                                      );
                                      const next = selected
                                        ? withoutGeneric.filter((x) => x !== d.id)
                                        : [...withoutGeneric, d.id];
                                      return { ...t, discounts: next };
                                    });
                                  }}
                                  className={`mb-1.5 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start last:mb-0 ${
                                    selected
                                      ? 'border-[1.5px] border-mintcom-green'
                                      : 'border-gray-200 dark:border-white/10'
                                  }`}
                                >
                                  <span
                                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                      selected
                                        ? 'bg-mintcom-green text-white'
                                        : 'bg-gray-200 text-text-secondary dark:bg-white/10'
                                    }`}
                                  >
                                    <Percent size={16} />
                                  </span>
                                  <span
                                    className={`flex-1 text-[13px] font-semibold ${
                                      selected
                                        ? 'text-mintcom-green'
                                        : 'text-text-primary dark:text-white'
                                    }`}
                                  >
                                    {d.name}
                                  </span>
                                  {selected && (
                                    <Check size={16} className="text-mintcom-green" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Active filter chips */}
              {activeFilterChips.length > 0 && (
                <div className="shrink-0 border-t border-gray-100 px-6 py-3 dark:border-white/8">
                  <div className="flex flex-wrap gap-2">
                    {activeFilterChips.map((chip, i) => (
                      <button
                        key={`${chip.label}-${i}`}
                        type="button"
                        onClick={() => setFilterStep(chip.step)}
                        className="rounded-xl border border-mintcom-green/40 bg-mintcom-green/10 px-3 py-1.5 text-[12px] font-semibold text-mintcom-green"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer — Back/Clear All · Next: Status · Apply */}
              <div
                className={`flex shrink-0 items-center justify-between gap-3 px-6 py-5 ${
                  activeFilterChips.length > 0
                    ? ''
                    : 'border-t border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="flex-1">
                  {filterStep > 0 ? (
                    <button
                      type="button"
                      onClick={prevFilterStep}
                      className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-[14px] font-semibold text-text-secondary dark:bg-white/10"
                    >
                      <ArrowLeft size={18} />
                      Back
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={clearTempOrderFilters}
                      disabled={!hasTempFiltersChanged}
                      className={`rounded-xl bg-gray-100 px-4 py-3 text-[14px] font-semibold text-text-secondary dark:bg-white/10 ${
                        !hasTempFiltersChanged ? 'opacity-50' : ''
                      }`}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="flex flex-[2] items-center justify-end gap-3">
                  {filterStep < FILTER_STEPS.length - 1 && (
                    <button
                      type="button"
                      onClick={nextFilterStep}
                      className="rounded-xl bg-mintcom-green/90 px-4 py-3 text-[14px] font-semibold text-white"
                    >
                      Next: {FILTER_STEPS[filterStep + 1].title}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={applyOrderFilters}
                    className="rounded-xl bg-mintcom-green px-6 py-3 text-[14px] font-bold tracking-wide text-white shadow-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Order detail — identical to POS Payment Receipt (ReportsScreen) */}
        {selectedOrder && modal !== 'refund' && (
          <PaymentReceiptModal
            order={selectedOrder}
            status={statusOf(selectedOrder)}
            refundReason={
              localRefunds[selectedOrder.id]?.reason || selectedOrder.refundReason
            }
            refundedBy={
              statusOf(selectedOrder) === 'REFUNDED' ||
              statusOf(selectedOrder) === 'PARTIALLY_REFUNDED'
                ? 'You'
                : undefined
            }
            onClose={() => setSelectedOrder(null)}
            onPrint={() => {
              ping('Receipt sent to printer (demo)');
            }}
          />
        )}

        {modal === 'refund' && selectedOrder && (
          <DemoRefundModal
            open
            orderNo={selectedOrder.orderNo}
            orderTotal={Math.max(
              0,
              selectedOrder.total -
                (localRefunds[selectedOrder.id]?.amount ?? selectedOrder.refundedAmount ?? 0),
            )}
            lines={selectedOrder.lines.map((l) => ({
              id: l.id,
              name: l.name,
              qty: l.qty,
              unitPrice: l.unitPrice,
              emoji: l.emoji,
              refundedQty: mergedRefundedQty(selectedOrder, localRefunds[selectedOrder.id])[l.id] ?? 0,
            }))}
            onClose={() => {
              setModal(null);
              setSelectedOrder(null);
            }}
            onConfirm={applyRefundResult}
          />
        )}

        {/*
          Sales totals — exact POS SalesTotalsBreakdownModal copy (en.json):
          salesTotalsBreakdown, salesTotalIncluded, salesExcludingTaxService,
          taxAmount, serviceChargeAmount (+ desc keys).
        */}
        {modal === 'totals' && (
          <ModalShell
            title="Sales Totals Breakdown"
            subtitle="Gross sales, tax, service/other charges, refunds, and payment totals for the selected period."
            icon={<BarChart3 size={20} />}
            size="compact"
            onClose={() => setModal(null)}
          >
            <div className="flex flex-col gap-2.5">
              <HeroTotal
                label="Total Sales (Includes Tax & Service/Other Charges)"
                value={money(summary.net)}
                icon={<Wallet size={18} />}
              />
              <BreakdownRow
                icon={<TrendingUp size={20} />}
                label="Sales Excluding Tax & Service/Other Charges"
                detail="Sales after discounts and refunds, before order-level tax and service/other charges."
                value={money(summary.netBeforeTax)}
              />
              <BreakdownRow
                icon={<Percent size={20} />}
                label="Tax Amount"
                detail="Tax collected after refunds are netted out."
                value={money(summary.tax || Math.max(0, summary.net - summary.netBeforeTax))}
              />
              <BreakdownRow
                icon={<UtensilsCrossed size={20} />}
                label="Service/Other Charges"
                detail="Net service/other charges collected after refunds."
                value={money(0)}
              />
            </div>
          </ModalShell>
        )}

        {/* Card sales — POS OtherPaymentsBreakdownModal (credit-card) */}
        {modal === 'card' && (
          <ModalShell
            title="Card payment methods"
            subtitle="Breakdown by card type"
            icon={<PosCardIcon size={20} />}
            onClose={() => setModal(null)}
          >
            <div className="flex flex-col gap-2.5">
              <HeroTotal
                label="Total card"
                value={money(summary.card)}
                icon={<PosCardIcon size={18} />}
              />
              {cardBreakdown.length === 0 ? (
                <p className="py-10 text-center text-[13px] font-medium text-text-tertiary">
                  No card payments
                </p>
              ) : (
                cardBreakdown.map(([name, amt], idx) => (
                  <BreakdownRow
                    key={name}
                    icon={<PosCardIcon size={20} />}
                    label={name}
                    detail="Card payments"
                    value={money(amt)}
                    valueColor="#7dc6a2"
                    isLast={idx === cardBreakdown.length - 1}
                  />
                ))
              )}
            </div>
          </ModalShell>
        )}

        {/* Other payments */}
        {modal === 'other' && (
          <ModalShell
            title="Other payment methods"
            subtitle="Non-Cash / Card Methods"
            icon={<PosOtherReceiptIcon size={20} />}
            onClose={() => setModal(null)}
          >
            <div className="flex flex-col gap-2.5">
              <HeroTotal
                label="Total other"
                value={money(summary.other)}
                icon={<PosOtherReceiptIcon size={18} />}
              />
              {otherBreakdown.length === 0 ? (
                <p className="py-10 text-center text-[13px] font-medium text-text-tertiary">
                  No other payments
                </p>
              ) : (
                otherBreakdown.map(([name, amt], idx) => (
                  <BreakdownRow
                    key={name}
                    icon={<PosOtherReceiptIcon size={20} />}
                    label={name}
                    detail="Other method"
                    value={money(amt)}
                    valueColor="#7dc6a2"
                    isLast={idx === otherBreakdown.length - 1}
                  />
                ))
              )}
            </div>
          </ModalShell>
        )}

        {/* Pay in / Pay out — POS PayInPayOutLogModal */}
        {modal === 'payinout' && (
          <ModalShell
            title="Pay-In / Pay-Out Log"
            subtitle="Non-sales cash movements"
            icon={<Banknote size={20} />}
            onClose={() => setModal(null)}
          >
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-xl bg-mintcom-green p-4 !text-white shadow-sm">
                  <p className="text-[12px] font-semibold !text-white/90">Total Pay In</p>
                  <p className="mt-1 text-[22px] font-extrabold tabular-nums !text-white">
                    {money(summary.payIn)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#D55263] p-4 !text-white shadow-sm">
                  <p className="text-[12px] font-semibold !text-white/90">Total Pay Out</p>
                  <p className="mt-1 text-[22px] font-extrabold tabular-nums !text-white">
                    {money(summary.payOut)}
                  </p>
                </div>
              </div>

              {/* Table header like POS */}
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                <div className="grid grid-cols-[72px_1fr_88px_70px] gap-1 bg-mintcom-green px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide !text-white sm:grid-cols-[80px_1fr_100px_90px_70px]">
                  <span className="!text-white">Type</span>
                  <span className="!text-white">Note</span>
                  <span className="text-end !text-white">Amount</span>
                  <span className="hidden text-end !text-white sm:block">Date</span>
                  <span className="text-end !text-white">Time</span>
                </div>
                {shift.movements.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Banknote size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px] font-bold text-text-secondary">
                      No PAY-IN/PAY-OUT entries found
                    </p>
                    <p className="mt-1 text-[12px] text-text-tertiary">
                      For selected range
                    </p>
                  </div>
                ) : (
                  shift.movements.map((m) => (
                    <div
                      key={m.id}
                      className="grid grid-cols-[72px_1fr_88px_70px] items-center gap-1 border-t border-gray-100 px-3 py-3 text-[12px] dark:border-white/8 sm:grid-cols-[80px_1fr_100px_90px_70px]"
                    >
                      <span>
                        <span
                          className={`inline-block rounded-xl px-2 py-0.5 text-[10px] font-bold uppercase !text-white ${
                            m.type === 'in' ? 'bg-mintcom-green' : 'bg-[#D55263]'
                          }`}
                        >
                          {m.type === 'in' ? 'PAY-IN' : 'PAY-OUT'}
                        </span>
                      </span>
                      <span className="truncate font-medium text-text-secondary dark:text-mintcom-textSecondary">
                        {m.reason || 'No note provided'}
                      </span>
                      <span className="text-end text-[13px] font-bold tabular-nums text-text-primary dark:text-white">
                        {money(m.amount)}
                      </span>
                      <span className="hidden text-end text-text-tertiary sm:block">
                        {new Date(m.at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-end text-text-tertiary">
                        {new Date(m.at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ModalShell>
        )}

        {/* Time worked — POS TotalTimeWorkedLogModal */}
        {modal === 'time' && (
          <ModalShell
            title="Total Time Worked Log"
            subtitle="Shift hours for the selected range"
            icon={<Clock size={20} />}
            onClose={() => setModal(null)}
          >
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-mintcom-green px-2.5 py-3 text-center !text-white shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wide !text-white/90">
                    Total Shifts
                  </p>
                  <p className="mt-1.5 text-[18px] font-extrabold tabular-nums !text-white">
                    {shiftLogRows.filter((r) => r.type === 'open').length}
                  </p>
                </div>
                <div className="rounded-xl bg-mintcom-green px-2.5 py-3 text-center !text-white shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wide !text-white/90">
                    Active Hours
                  </p>
                  <p className="mt-1.5 text-[18px] font-extrabold tabular-nums !text-white">
                    {hoursWorked}
                  </p>
                </div>
                <div className="rounded-xl bg-mintcom-green px-2.5 py-3 text-center !text-white shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wide !text-white/90">
                    Last Updated
                  </p>
                  <p className="mt-1.5 text-[18px] font-extrabold !text-white">Today</p>
                </div>
              </div>

              {/* Table header like POS TotalTimeWorkedLogModal */}
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                <div className="grid grid-cols-[70px_1fr_78px_66px] gap-1 bg-mintcom-green px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide !text-white sm:grid-cols-[80px_1fr_90px_88px_66px]">
                  <span className="!text-white">Type</span>
                  <span className="!text-white">Shift Summary</span>
                  <span className="text-end !text-white">Amount</span>
                  <span className="hidden text-end !text-white sm:block">Date</span>
                  <span className="text-end !text-white">Time</span>
                </div>
                {shiftLogRows.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Clock size={36} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-[13px] font-bold text-text-secondary">
                      No shift entries found
                    </p>
                    <p className="mt-1 text-[12px] text-text-tertiary">
                      For selected range
                    </p>
                  </div>
                ) : (
                  shiftLogRows.map((r) => (
                    <div
                      key={r.id}
                      className="grid grid-cols-[70px_1fr_78px_66px] items-center gap-1 border-t border-gray-100 px-3 py-3 text-[12px] dark:border-white/8 sm:grid-cols-[80px_1fr_90px_88px_66px]"
                    >
                      <span>
                        <span
                          className={`inline-block rounded-xl px-2 py-0.5 text-center text-[10px] font-bold uppercase !text-white ${
                            r.type === 'open' ? 'bg-mintcom-green' : 'bg-[#D55263]'
                          }`}
                        >
                          {r.type === 'open' ? 'Open' : 'Close'}
                        </span>
                        {r.type === 'close' && r.isAuto && (
                          <span className="mt-1 block text-center text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400">
                            Auto
                          </span>
                        )}
                      </span>
                      <span className="truncate font-medium text-text-secondary dark:text-mintcom-textSecondary">
                        {r.employeeName} {r.type === 'open' ? 'started shift' : 'closed shift'}
                        {employee === 'all' ? '' : ` · ${r.type === 'open' ? 'Opening' : 'Closing'} balance`}
                      </span>
                      <span className="text-end text-[13px] font-bold tabular-nums text-text-primary dark:text-white">
                        {money(r.amount)}
                      </span>
                      <span className="hidden text-end text-text-tertiary sm:block">
                        {new Date(r.at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-end text-text-tertiary">
                        {new Date(r.at).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </ModalShell>
        )}

        {/* Price/change history — POS PriceAuditModal */}
        {auditModal.open && (
          <ModalShell
            title={auditModal.itemName}
            subtitle={`Change History · ${auditModal.history.length} change${auditModal.history.length === 1 ? '' : 's'}`}
            icon={<Clock size={20} className="text-amber-500" />}
            onClose={() => setAuditModal({ open: false, itemName: '', history: [] })}
          >
            <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
              <div className="grid grid-cols-[80px_60px_1fr_70px] gap-1 bg-mintcom-green px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide !text-white sm:grid-cols-[90px_70px_1fr_1fr_90px]">
                <span className="!text-white">Date</span>
                <span className="!text-white">Field</span>
                <span className="text-center !text-white">Old → New</span>
                <span className="hidden !text-white sm:block" />
                <span className="text-end !text-white">Changed By</span>
              </div>
              {auditModal.history.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Clock size={36} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-[13px] font-bold text-text-secondary">
                    No history has been recorded for this item yet.
                  </p>
                </div>
              ) : (
                auditModal.history.map((h) => (
                  <div
                    key={h.id}
                    className="grid grid-cols-[80px_60px_1fr_70px] items-center gap-1 border-t border-gray-100 px-3 py-3 text-[12px] dark:border-white/8 sm:grid-cols-[90px_70px_1fr_1fr_90px]"
                  >
                    <span className="text-text-secondary dark:text-mintcom-textSecondary">
                      <span className="block font-semibold">
                        {new Date(h.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: '2-digit',
                        })}
                      </span>
                      <span className="block text-[10px]">
                        {new Date(h.createdAt).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </span>
                    <span>
                      <span className="inline-block rounded-lg bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                        Price
                      </span>
                    </span>
                    <span className="flex items-center justify-center gap-2 text-[13px]">
                      <span className="font-medium text-text-tertiary line-through">
                        {money(h.oldPrice)}
                      </span>
                      <ChevronRight size={13} className="text-text-tertiary" />
                      <span className="font-bold text-text-primary dark:text-white">
                        {money(h.newPrice)}
                      </span>
                    </span>
                    <span className="hidden sm:block" />
                    <span className="truncate text-end text-text-secondary dark:text-mintcom-textSecondary">
                      {h.changedByName}
                    </span>
                  </div>
                ))
              )}
            </div>
          </ModalShell>
        )}

        {modal === 'print' && (
          <ModalShell
            title="Print report"
            subtitle="PDF / thermal summary (demo)"
            icon={<Printer size={20} />}
            onClose={() => setModal(null)}
            footer={
              <button
                type="button"
                onClick={() => {
                  ping('Report PDF ready (demo)');
                  setModal(null);
                }}
                className="w-full rounded-xl bg-mintcom-green py-3 text-[14px] font-bold text-white shadow-sm"
              >
                Generate report
              </button>
            }
          >
            <div className="flex flex-col gap-2.5">
              <HeroTotal label="Net sales" value={money(summary.net)} />
              <BreakdownRow
                icon={<Calendar size={20} />}
                label="Range"
                value={periodLabel}
              />
              <BreakdownRow
                icon={<Receipt size={20} />}
                label="Orders"
                value={String(summary.orders)}
              />
              <BreakdownRow
                icon={<User size={20} />}
                label="Employee"
                value={employee === 'all' ? 'All Employees' : employee}
                isLast
              />
              <p className="px-1 text-[12px] leading-relaxed text-text-tertiary">
                Real POS generates a PDF or prints via the configured receipt printer / email.
              </p>
            </div>
          </ModalShell>
        )}

        {modal === 'dateRange' && (
          <ModalShell
            title="Date range"
            subtitle="Select start and end dates"
            icon={<Calendar size={20} />}
            onClose={() => setModal(null)}
            footer={
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-full rounded-xl bg-mintcom-green py-3 text-[14px] font-bold text-white shadow-sm"
              >
                Apply
              </button>
            }
          >
            <div className="space-y-3">
              <label className="block text-[12px] font-bold tracking-wide text-text-tertiary">
                Start Date
                <input
                  type="date"
                  value={dayKey(dateRange.start.getTime())}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    const start = startOfDay(new Date(y, m - 1, d));
                    setDateRange((prev) => ({
                      start,
                      end: prev.end < start ? endOfDay(start) : prev.end,
                    }));
                    setPeriod('custom');
                  }}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[14px] font-semibold outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                />
              </label>
              <label className="block text-[12px] font-bold tracking-wide text-text-tertiary">
                End Date
                <input
                  type="date"
                  value={dayKey(dateRange.end.getTime())}
                  onChange={(e) => {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    const end = endOfDay(new Date(y, m - 1, d));
                    setDateRange((prev) => ({
                      start: prev.start > end ? startOfDay(end) : prev.start,
                      end,
                    }));
                    setPeriod('custom');
                  }}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[14px] font-semibold outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                />
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {(['today', 'last7', 'last30', 'thisMonth'] as PeriodId[]).map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      applyPeriod(id);
                      setModal(null);
                    }}
                    className={`rounded-xl px-3.5 py-2 text-[12px] font-bold ${
                      period === id
                        ? 'bg-mintcom-green text-white'
                        : 'bg-gray-100 text-text-secondary dark:bg-white/10 dark:text-white'
                    }`}
                  >
                    {PERIOD_OPTIONS.find((p) => p.id === id)?.label}
                  </button>
                ))}
              </div>
            </div>
          </ModalShell>
        )}

        {modal === 'timeRange' && (
          <ModalShell
            title="Time range"
            subtitle="Filter orders within the day"
            icon={<Clock size={20} />}
            onClose={() => setModal(null)}
            footer={
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-full rounded-xl bg-mintcom-green py-3 text-[14px] font-bold text-white shadow-sm"
              >
                Apply
              </button>
            }
          >
            <div className="space-y-3">
              <label className="block text-[12px] font-bold tracking-wide text-text-tertiary">
                Start Time
                <input
                  type="time"
                  value={`${String(timeStart.getHours()).padStart(2, '0')}:${String(timeStart.getMinutes()).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const t = new Date(timeStart);
                    t.setHours(h, m, 0, 0);
                    setTimeStart(t);
                    setPeriod('custom');
                  }}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[14px] font-semibold outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                />
              </label>
              <label className="block text-[12px] font-bold tracking-wide text-text-tertiary">
                End Time
                <input
                  type="time"
                  value={`${String(timeEnd.getHours()).padStart(2, '0')}:${String(timeEnd.getMinutes()).padStart(2, '0')}`}
                  onChange={(e) => {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const t = new Date(timeEnd);
                    t.setHours(h, m, 59, 999);
                    setTimeEnd(t);
                    setPeriod('custom');
                  }}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[14px] font-semibold outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setTimeStart(startOfDay());
                  setTimeEnd(endOfDay());
                }}
                className="w-full rounded-xl border border-gray-200 py-3 text-[13px] font-bold text-text-secondary dark:border-white/10 dark:text-white"
              >
                Full day (12:00 AM – 11:59 PM)
              </button>
            </div>
          </ModalShell>
        )}
      </AnimatePresence>

      <Toast msg={toast} />
    </div>
  );
}

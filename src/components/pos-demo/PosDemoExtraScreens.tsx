import { useEffect, useMemo, useState, useRef, type HTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowUpDown,
  ArrowUpRight,
  Check,
  Clock,
  AlertTriangle,
  FolderOpen,
  Info,
  List,
  LogIn,
  LogOut,
  Package,
  Pause,
  Receipt,
  ShoppingBag,
  TrendingUp,
  X,
  DollarSign,
  Printer,
  ArrowRight,
  Bell,
  DownloadCloud,
  RotateCcw,
  Trash2,
  Search,
} from 'lucide-react';
import { DemoRefundModal, type RefundResult } from './PosDemoRefund';
import { DemoSalesTrendChart } from './PosDemoSalesTrend';
import {
  PosCardIcon,
  PosCashIcon,
  PosOtherReceiptIcon,
} from './posPaymentIcons';

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

type Staff = { id: string; name: string; role: string; pin: string; emoji: string };

export type CashMovement = {
  id: string;
  type: 'in' | 'out';
  amount: number;
  reason: string;
  at: number;
};

export type DemoSaleLine = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  emoji: string;
};

export type DemoSale = {
  id: string;
  orderNo: number;
  total: number;
  method: 'cash' | 'card' | 'other' | 'split';
  methodLabel: string;
  items: string;
  at: number;
  /** Optional line items for My Orders detail (mirrors POS order lines) */
  lines?: DemoSaleLine[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  orderType?: string;
  status?: 'completed' | 'refunded' | 'partially_refunded';
  /** lineId → qty already refunded */
  refundedLineQty?: Record<string, number>;
  refundReason?: string;
  refundedAmount?: number;
  /** Per-order tender breakdown (matches POS getOrderTenders) */
  tenders?: Array<{
    method: string;
    label: string;
    amount: number;
    tendered?: number;
    change?: number;
    cardType?: string;
    otherPaymentMethod?: string;
  }>;
};

export type DemoShift = {
  open: boolean;
  openingCash: number;
  cashSales: number;
  cardSales: number;
  otherSales: number;
  payIn: number;
  payOut: number;
  orders: number;
  startedAt: number | null;
  movements: CashMovement[];
  sales: DemoSale[];
};

export const emptyShift = (): DemoShift => ({
  open: false,
  openingCash: 0,
  cashSales: 0,
  cardSales: 0,
  otherSales: 0,
  payIn: 0,
  payOut: 0,
  orders: 0,
  startedAt: null,
  movements: [],
  sales: [],
});

function Fill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden p-2.5 sm:p-3 md:p-4 ${className}`}>
      {children}
    </div>
  );
}

function Card({
  children,
  className = '',
  id,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  id?: string;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      id={id}
      className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/8 dark:bg-mintcom-surface ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ─── ATM amount helpers ────────────────────────────────────────────────── */
function useAtmAmount() {
  const [cents, setCents] = useState(0);
  const display = (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const value = cents / 100;
  const onChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    setCents(digits === '' ? 0 : parseInt(digits, 10));
  };
  const reset = () => setCents(0);
  return { display, value, onChange, reset, cents };
}

/* ─── Open / Close shift modal (like CashManagementModal) ───────────────── */
function ShiftCashModal({
  mode,
  open,
  onClose,
  onConfirm,
  summary,
}: {
  mode: 'open' | 'close';
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
  summary?: {
    cashSales: number;
    cardSales: number;
    otherSales: number;
    payIn: number;
    payOut: number;
    openingCash: number;
    orders: number;
    netSales: number;
    expectedCash: number;
    hoursLabel: string;
  };
}) {
  const atm = useAtmAmount();
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      atm.reset();
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const isOpen = mode === 'open';
  // Labels match mintcom-pos CashManagementModal / en.json shift.* dashboard.*
  const title = isOpen ? 'Open Shift' : 'Close Shift';
  const cta = isOpen ? 'Open Shift' : 'Close Shift';
  const subtitle = isOpen
    ? 'Start your day by entering the opening cash amount'
    : 'Review your report and enter the actual cash in the drawer.';

  const submit = () => {
    if (atm.value < 0) {
      setError('Invalid amount');
      return;
    }
    onConfirm(atm.value);
  };

  // Close shift: side-by-side summary | amount (POS CashManagementModal horizontal)
  if (!isOpen && summary) {
    return (
      <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="flex max-h-[min(92%,620px)] w-full max-w-[820px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-mintcom-tertiary dark:bg-mintcom-surface sm:flex-row"
        >
          {/* Left — shift summary (POS close flow) */}
          <div className="flex min-h-0 w-full flex-col border-b border-gray-100 dark:border-white/8 sm:w-[48%] sm:border-b-0 sm:border-e">
            <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-white/8">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#D55263]/15 text-[#D55263]">
                <LogOut size={24} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-text-primary dark:text-white">
                  Close Shift
                </p>
                <p className="mt-0.5 text-[12px] text-text-secondary">
                  Review your shift summary
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10 sm:hidden"
              >
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {(
                [
                  ['Opening Cash', money(summary.openingCash)],
                  ['Cash Sales', money(summary.cashSales)],
                  ['Card Sales', money(summary.cardSales)],
                  ['Other Payment Methods', money(summary.otherSales)],
                  ['PAY-IN', money(summary.payIn)],
                  ['PAY-OUT', money(summary.payOut)],
                  ['Net Sales', money(summary.netSales)],
                  ['Number of Orders', String(summary.orders)],
                ] as const
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-gray-100 py-2.5 text-[13px] dark:border-white/8"
                >
                  <span className="text-text-secondary">{label}</span>
                  <span className="font-bold tabular-nums text-text-primary dark:text-white">
                    {val}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 bg-[#EEF0F3] px-4 py-3 dark:border-white/10 dark:bg-mintcom-dark">
              <span className="text-[13px] font-semibold text-text-secondary">
                Expected Cash
              </span>
              <span className="text-[18px] font-extrabold tabular-nums text-mintcom-green">
                {money(summary.expectedCash)}
              </span>
            </div>
          </div>

          {/* Right — actual cash ATM */}
          <div className="flex min-h-0 w-full flex-1 flex-col px-4 py-4 sm:w-[52%]">
            <div className="mb-1 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="hidden h-8 w-8 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10 sm:flex"
              >
                <X size={16} />
              </button>
            </div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-text-secondary">
              Actual Cash
            </p>
            <div
              className={`mb-2 flex overflow-hidden rounded-xl border-2 bg-[#F9FAFB] dark:bg-mintcom-dark ${
                error ? 'border-mintcom-red' : 'border-gray-200 dark:border-white/10'
              }`}
            >
              <div
                className={`flex w-14 items-center justify-center border-e-2 ${
                  error
                    ? 'border-mintcom-red bg-mintcom-red/10'
                    : 'border-gray-200 bg-mintcom-green/10 dark:border-white/10'
                }`}
              >
                <span
                  className={`text-lg font-black ${
                    error ? 'text-mintcom-red' : 'text-mintcom-green'
                  }`}
                >
                  $
                </span>
              </div>
              <input
                inputMode="numeric"
                value={atm.display}
                onChange={(e) => {
                  atm.onChange(e.target.value);
                  setError('');
                }}
                className="w-full bg-transparent px-4 py-4 text-3xl font-black tabular-nums outline-none dark:text-white"
                autoFocus
              />
            </div>
            {error && (
              <p className="mb-2 text-[11px] font-bold text-mintcom-red">{error}</p>
            )}
            <p className="mb-3 text-[12px] text-text-secondary">
              Variance:{' '}
              <span
                className={`font-extrabold ${
                  atm.value - summary.expectedCash === 0
                    ? 'text-mintcom-green'
                    : 'text-[#D55263]'
                }`}
              >
                {money(atm.value - summary.expectedCash)}
              </span>
            </p>
            <button
              type="button"
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-[12px] font-bold text-text-secondary dark:border-white/10"
            >
              <FolderOpen size={15} className="text-mintcom-green" />
              Open Cash Drawer
            </button>
            <div className="mt-auto flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-[13px] font-bold text-text-secondary dark:border-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submit}
                className="flex-[1.4] rounded-xl bg-[#D55263] py-3 text-[13px] font-extrabold text-white"
              >
                Close Shift
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Open Shift — compact centered modal (POS cash-in)
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex w-full max-w-[400px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-mintcom-tertiary dark:bg-mintcom-surface"
      >
        <div className="flex shrink-0 items-center justify-end px-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4 px-5 pb-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-mintcom-green/20 text-mintcom-green">
              <LogIn size={26} />
            </span>
            <p className="text-base font-extrabold text-text-primary dark:text-white">
              {title}
            </p>
            <p className="text-[12px] text-text-secondary">{subtitle}</p>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold text-text-secondary">
              Opening Cash Amount
            </label>
            <div
              className={`flex overflow-hidden rounded-xl border-2 bg-[#F9FAFB] dark:bg-mintcom-dark ${
                error ? 'border-mintcom-red' : 'border-gray-200 dark:border-white/10'
              }`}
            >
              <div className="flex w-14 items-center justify-center border-e border-gray-200 bg-mintcom-green/10 dark:border-white/10">
                <span className="text-lg font-black text-mintcom-green">$</span>
              </div>
              <input
                inputMode="numeric"
                value={atm.display}
                onChange={(e) => {
                  atm.onChange(e.target.value);
                  setError('');
                }}
                className="w-full bg-transparent px-4 py-3.5 text-2xl font-black tabular-nums outline-none dark:text-white"
                autoFocus
              />
            </div>
            {error && (
              <p className="mt-1 text-[11px] font-bold text-mintcom-red">{error}</p>
            )}
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-[12px] font-bold text-text-secondary dark:border-white/10"
          >
            <FolderOpen size={15} className="text-mintcom-green" />
            Open Cash Drawer
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-[13px] font-bold text-text-secondary dark:border-white/10"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              className="flex-[1.4] rounded-xl bg-mintcom-green py-3 text-[13px] font-extrabold !text-white"
            >
              {cta}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Mid-shift pay-in / pay-out — mirrors POS CashInOutModal (one modal, type toggle) ─ */
export function PayInOutModal({
  open,
  initialType = 'in',
  onClose,
  onConfirm,
}: {
  open: boolean;
  initialType?: 'in' | 'out';
  onClose: () => void;
  onConfirm: (type: 'in' | 'out', amount: number, reason: string) => void;
}) {
  const [type, setType] = useState<'in' | 'out'>(initialType);
  const atm = useAtmAmount();
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setType(initialType);
      atm.reset();
      setReason('');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialType]);

  if (!open) return null;

  const submit = () => {
    if (atm.value <= 0) {
      setError('Enter an amount greater than $0.00');
      return;
    }
    if (!reason.trim()) {
      setError('Reason is required');
      return;
    }
    onConfirm(type, atm.value, reason.trim());
  };

  return (
    <div className="absolute inset-0 z-[80] flex items-end justify-center bg-black/45 px-3 pt-3 backdrop-blur-sm sm:items-center sm:p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-mintcom-tertiary dark:bg-mintcom-surface"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/8">
          <div className="w-8" />
          <p className="text-sm font-black uppercase tracking-wide text-text-primary dark:text-white">
            {type === 'in' ? 'PAY-IN' : 'PAY-OUT'}
          </p>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3 p-4">
          {/* Segmented toggle — POS CashInOutModal */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-cream-100 p-1 dark:bg-mintcom-dark">
            <button
              type="button"
              onClick={() => {
                setType('in');
                setError('');
              }}
              className={`rounded-xl py-2.5 text-xs font-black transition-colors ${
                type === 'in'
                  ? 'bg-mintcom-green text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              PAY-IN
            </button>
            <button
              type="button"
              onClick={() => {
                setType('out');
                setError('');
              }}
              className={`rounded-xl py-2.5 text-xs font-black transition-colors ${
                type === 'out'
                  ? 'bg-mintcom-red text-white shadow-sm'
                  : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              PAY-OUT
            </button>
          </div>

          {/* ATM amount — digits only, always shows 0.00 style like POS useATMInput */}
          <div
            className="flex overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface"
          >
            <div className="flex w-14 shrink-0 items-center justify-center border-e border-gray-200 bg-mintcom-green/10 dark:border-white/10">
              <span className="text-lg font-black text-mintcom-green">$</span>
            </div>
            <input
              inputMode="numeric"
              value={atm.display}
              onChange={(e) => {
                atm.onChange(e.target.value);
                setError('');
              }}
              className={`w-full bg-transparent px-3 py-3.5 text-2xl font-black tabular-nums outline-none dark:text-white ${
                atm.value === 0 ? 'text-[#9CA3AF]' : 'text-text-primary'
              }`}
              autoFocus
            />
          </div>

          {/* Reason with edit icon prefix — POS CashInOutModal */}
          <div
            className={`flex overflow-hidden rounded-xl border bg-white dark:bg-mintcom-surface ${
              error && !reason.trim()
                ? 'border-mintcom-red'
                : 'border-gray-200 dark:border-white/10'
            }`}
          >
            <div className="flex w-14 shrink-0 items-center justify-center border-e border-gray-200 bg-mintcom-green/10 dark:border-white/10">
              {type === 'in' ? (
                <ArrowDownLeft size={20} className="text-mintcom-green" />
              ) : (
                <ArrowUpRight size={20} className="text-mintcom-green" />
              )}
            </div>
            <input
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              placeholder="Add reason"
              className="w-full bg-transparent px-3 py-3.5 text-sm outline-none dark:text-white"
            />
          </div>

          {error && <p className="text-[11px] font-bold text-mintcom-red">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={atm.value <= 0 || !reason.trim()}
            className={`w-full rounded-xl py-3.5 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40 ${
              type === 'in' ? 'bg-mintcom-green' : 'bg-mintcom-red'
            }`}
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ─── Dashboard — mirrors mintcom-pos DashboardScreen + ShiftManagementCard ─ */
export function DemoDashboardScreen({
  staff,
  shift,
  onOpenShift,
  onCloseShift,
  onGoSales,
  onSignOut,
  autoOpenShiftModal = false,
  onAutoOpenShiftModalHandled,
  onOpenShiftSuccessDismiss,
  canOpenShift = true,
  canCloseShift = true,
  canViewAnalytics = true,
}: {
  staff: Staff | null;
  shift: DemoShift;
  onOpenShift: (openingCash: number) => void;
  onCloseShift: (actualCash: number) => void;
  onGoSales: () => void;
  /** POS "Review & Sign Out" after close-shift review */
  onSignOut?: () => void;
  /** Parent asks to open the Open Shift amount popup (e.g. user tapped Sales without a shift). */
  autoOpenShiftModal?: boolean;
  onAutoOpenShiftModalHandled?: () => void;
  /** After OK on "Shift started successfully" (e.g. return to Sales) */
  onOpenShiftSuccessDismiss?: () => void;
  canOpenShift?: boolean;
  canCloseShift?: boolean;
  canViewAnalytics?: boolean;
}) {
  const [renderedAt] = useState(Date.now);
  const [shiftModal, setShiftModal] = useState<'open' | 'close' | null>(null);
  const [shiftStartedSuccess, setShiftStartedSuccess] = useState(false);
  const [todaysOrdersOpen, setTodaysOrdersOpen] = useState(false);
  const [showShiftPrint, setShowShiftPrint] = useState(false);
  const [closedReview, setClosedReview] = useState<{
    expected: number;
    actual: number;
    variance: number;
    openingCash: number;
    cashSales: number;
    cardSales: number;
    otherSales: number;
    payIn: number;
    payOut: number;
    orders: number;
    hoursLabel: string;
    startedAt: number | null;
  } | null>(null);

  useEffect(() => {
    if (autoOpenShiftModal && !shift.open && canOpenShift) {
      setShiftModal('open');
      onAutoOpenShiftModalHandled?.();
    } else if (autoOpenShiftModal && !canOpenShift) {
      onAutoOpenShiftModalHandled?.();
    }
  }, [autoOpenShiftModal, shift.open, canOpenShift, onAutoOpenShiftModalHandled]);

  const isOpen = shift.open;
  const userName = staff?.name ?? 'Cashier';

  // Last-shift demo snapshot when closed (mirrors POS showing previous period)
  const displayNetSales = isOpen
    ? shift.cashSales + shift.cardSales + shift.otherSales
    : 1397.0;
  const displayCashSales = isOpen ? shift.cashSales : 465.0;
  const displayCardSales = isOpen ? shift.cardSales : 765.0;
  const displayOtherSales = isOpen ? shift.otherSales : 167.0;
  const displayOrders = isOpen ? shift.orders : 42;
  /** Demo last-shift cash drawer moves (POS PayCard when viewing prior period) */
  const displayPayIn = isOpen ? shift.payIn : 85.0;
  const displayPayOut = isOpen ? shift.payOut : 40.0;
  const netSales = shift.cashSales + shift.cardSales + shift.otherSales;
  const expectedCash = shift.openingCash + shift.cashSales + shift.payIn - shift.payOut;

  const hoursParts = useMemo(() => {
    if (!shift.startedAt) return { h: 0, m: 0 };
    const ms = renderedAt - shift.startedAt;
    return {
      h: Math.floor(ms / 3_600_000),
      m: Math.floor((ms % 3_600_000) / 60_000),
    };
  }, [renderedAt, shift.startedAt]);

  // Same shape as utils/shiftDuration formatDurationMs ("142h 19m" / "4h" / "45m").
  // POS dashboard card + closed review both use the short form.
  const hoursLabel =
    hoursParts.h === 0
      ? `${hoursParts.m}m`
      : hoursParts.m === 0
        ? `${hoursParts.h}h`
        : `${hoursParts.h}h ${hoursParts.m}m`;
  const displayHoursLabel = isOpen ? hoursLabel : '8h';

  // POS: formatCurrentDateInJordan('EEEE, d MMM yyyy') → "Tuesday, 14 Jul 2026"
  const dateLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // POS: moment format 'dddd M/D/YY - hh:mm A' → "Tuesday 7/14/26 - 01:10 PM"
  const formatShiftDateTime = (ms: number) => {
    const d = new Date(ms);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    const md = `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
    const time = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${weekday} ${md} - ${time}`;
  };

  const shiftStartedLabel = shift.startedAt ? formatShiftDateTime(shift.startedAt) : '';

  /**
   * When no active shift, POS ShiftManagementCard shows last cash-out:
   * "Last shift closed by {name} (Automatically Cashed Out)" + "Shift ended …"
   * Demo seeds a realistic prior auto cash-out; updates after the user closes a shift.
   */
  const [lastCashLog, setLastCashLog] = useState(() => {
    // Yesterday ~ end of day feel — stable enough for a demo snapshot
    const ended = new Date();
    ended.setDate(ended.getDate() - 1);
    ended.setHours(14, 22, 0, 0);
    return {
      name: 'Emma',
      endedAt: ended.getTime(),
      autoClose: true as boolean,
    };
  });

  return (
    <Fill>
      {/* Shift management card — POS ShiftManagementCard */}
      <Card id="tour-shift-card" className="mb-2 shrink-0 overflow-hidden p-0" data-tour-id="tour-shift-card">
        <div className="flex flex-wrap items-start justify-between gap-3 p-3 sm:p-3.5">
          <div className="min-w-0">
            <p className="text-sm font-black text-text-primary dark:text-white sm:text-base">
              {isOpen
                ? `You're Doing Great, ${userName}`
                : `Welcome Back, ${userName}`}
            </p>
            <p className="mt-0.5 text-[11px] text-text-secondary dark:text-mintcom-textSecondary">
              {dateLabel}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {isOpen && (
              <>
                <button
                  type="button"
                  id="tour-my-orders"
                  onClick={() => setTodaysOrdersOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border-[1.5px] border-mintcom-green bg-white px-3.5 py-2 text-[12px] font-bold text-mintcom-green dark:bg-transparent"
                >
                  <List size={16} /> Today's Orders
                </button>
                {canCloseShift && (
                  <button
                    type="button"
                    onClick={() => setShiftModal('close')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#D55263] px-3.5 py-2 text-[12px] font-bold text-white"
                  >
                    <LogOut size={16} /> Close Shift
                  </button>
                )}
              </>
            )}
            {!isOpen && canOpenShift && (
              <button
                type="button"
                id="tour-open-shift"
                onClick={() => setShiftModal('open')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-mintcom-green px-4 py-2.5 text-[11px] font-black !text-white shadow-md shadow-mintcom-green/25"
              >
                <LogIn size={14} className="text-white" /> Open Shift
              </button>
            )}
            {!isOpen && !canOpenShift && (
              <span className="rounded-xl bg-cream-100 px-3 py-2 text-[10px] font-bold text-text-tertiary dark:bg-mintcom-dark">
                Contact your administrator for access.
              </span>
            )}
          </div>
        </div>

        {/* Green shift details bar — always white text on solid mint (never black/gray) */}
        <div className="mx-3 mb-3 rounded-xl bg-mintcom-green px-3.5 py-3 !text-white shadow-sm sm:mx-3.5 sm:px-4">
          {isOpen ? (
            <>
              <p className="text-[15px] font-semibold leading-tight !text-white sm:text-[16px]">
                Current shift of {userName}
              </p>
              <p className="mt-1 text-[12px] font-medium !text-white sm:text-[13px]">
                Shift started {shiftStartedLabel}
              </p>
            </>
          ) : canViewAnalytics ? (
            <>
              <p className="text-[15px] font-semibold leading-snug !text-white sm:text-[16px]">
                Last shift closed by {lastCashLog.name}
                {lastCashLog.autoClose && (
                  <span className="font-semibold text-[#FEE2E2]">
                    {' '}
                    (Automatically Cashed Out)
                  </span>
                )}
              </p>
              <p className="mt-1 text-[12px] font-medium !text-white sm:text-[13px]">
                Shift ended {formatShiftDateTime(lastCashLog.endedAt)}
              </p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-semibold leading-tight !text-white sm:text-[16px]">
                No Active Shift
              </p>
              <p className="mt-1 text-[12px] font-medium !text-white sm:text-[13px]">
                Click &quot;Open Shift&quot; to start your shift
              </p>
            </>
          )}
        </div>
      </Card>

      {/* Metric grid — exact POS: left Net/Cash/Card · right Orders+Pay · Other+Hours · chart */}
      {!canViewAnalytics ? (
        <Card className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-cream-100 text-mintcom-green dark:bg-mintcom-dark">
            <AlertTriangle size={22} />
          </span>
          <p className="text-sm font-black text-text-primary dark:text-white">
            Dashboard Analytics Locked
          </p>
          <p className="mt-1 max-w-xs text-[11px] text-text-secondary dark:text-mintcom-textSecondary">
            You don&apos;t have permission to view dashboard analytics.
          </p>
          <button
            type="button"
            onClick={onGoSales}
            className="mt-4 rounded-xl bg-mintcom-green px-4 py-2 text-xs font-black !text-white"
          >
            Go to Sales
          </button>
        </Card>
      ) : (
        /* Dashboard metrics — stacked scroll on phones, landscape cards on sm+ */
        <div className="flex min-h-0 min-w-0 flex-1 flex-col sm:flex-row gap-3 sm:gap-4 overflow-y-auto sm:overflow-hidden overscroll-contain">
          {/* LEFT ~1/3 — Net / Cash / Card */}
          <div className="flex w-full sm:w-[32%] min-w-0 shrink-0 flex-col gap-3">
            <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-mintcom-green p-4 !text-white">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-mintcom-green">
                  <TrendingUp size={22} strokeWidth={2.25} className="text-mintcom-green" />
                </span>
                <div className="min-w-0 text-start">
                  <p className="text-[15px] font-semibold leading-tight !text-white">Net Sales</p>
                  <p className="mt-0.5 text-[11px] font-normal !text-white/90">
                    Excludes tax and other charges
                  </p>
                </div>
              </div>
              <p className="flex flex-1 items-center justify-center py-3 sm:py-0 text-center text-[22px] sm:text-[28px] font-extrabold tabular-nums tracking-tight !text-white">
                {money(displayNetSales)}
              </p>
            </div>

            <MetricSalesCard
              icon={<PosCashIcon size={22} className="text-white" />}
              label="Cash Sales"
              value={money(displayCashSales)}
            />
            <MetricSalesCard
              icon={<PosCardIcon size={22} className="text-white" />}
              label="Card Sales"
              value={money(displayCardSales)}
            />
          </div>

          {/* RIGHT ~2/3 */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
            <div className="grid shrink-0 grid-cols-1 min-[380px]:grid-cols-2 gap-3">
              <SmallMetric
                icon={<Receipt size={20} className="text-white" />}
                label="Number of Orders"
                value={String(displayOrders)}
                info="Total orders completed in the active period."
              />
              <PayInOutMetric
                payIn={money(displayPayIn)}
                payOut={money(displayPayOut)}
              />
            </div>
            <div className="grid shrink-0 grid-cols-1 min-[380px]:grid-cols-2 gap-3">
              <SmallMetric
                icon={<PosOtherReceiptIcon size={22} className="text-white" />}
                label="Other Payment Methods"
                value={money(displayOtherSales)}
                info="Payments collected using methods other than cash and card."
              />
              <SmallMetric
                icon={<Clock size={20} className="text-white" />}
                label="Total Hours Worked"
                value={displayHoursLabel}
                info="Combined time worked during the selected shift period."
              />
            </div>
            <div className="relative min-h-[300px] sm:min-h-0 min-w-0 flex-1">
              <DemoSalesTrendChart
                shiftOpen={shift.open}
                startedAt={shift.startedAt}
                sales={shift.sales}
                cashSales={shift.cashSales}
                cardSales={shift.cardSales}
                otherSales={shift.otherSales}
              />
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {shiftModal && (
          <ShiftCashModal
            mode={shiftModal}
            open
            onClose={() => setShiftModal(null)}
            summary={
              shiftModal === 'close'
                ? {
                    cashSales: shift.cashSales,
                    cardSales: shift.cardSales,
                    otherSales: shift.otherSales,
                    payIn: shift.payIn,
                    payOut: shift.payOut,
                    openingCash: shift.openingCash,
                    orders: shift.orders,
                    netSales,
                    expectedCash,
                    hoursLabel,
                  }
                : undefined
            }
            onConfirm={(amount) => {
              if (shiftModal === 'open') {
                onOpenShift(amount);
                setShiftModal(null);
                setShiftStartedSuccess(true);
              } else {
                const snap = {
                  expected: expectedCash,
                  actual: amount,
                  variance: amount - expectedCash,
                  openingCash: shift.openingCash,
                  cashSales: shift.cashSales,
                  cardSales: shift.cardSales,
                  otherSales: shift.otherSales,
                  payIn: shift.payIn,
                  payOut: shift.payOut,
                  orders: shift.orders,
                  hoursLabel,
                  startedAt: shift.startedAt,
                };
                onCloseShift(amount);
                setLastCashLog({
                  name: userName,
                  endedAt: Date.now(),
                  autoClose: false,
                });
                setClosedReview(snap);
                setShiftModal(null);
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* POS SuccessModal — Shift started successfully */}
      <AnimatePresence>
        {shiftStartedSuccess && (
          <div
            className="absolute inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
            onClick={() => {
              setShiftStartedSuccess(false);
              onOpenShiftSuccessDismiss?.();
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[320px] rounded-xl border border-gray-200 bg-white px-7 py-8 text-center shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
            >
              <div className="mx-auto mb-3.5 flex h-20 w-20 items-center justify-center rounded-xl bg-mintcom-green/20 text-mintcom-green">
                <Check size={40} strokeWidth={2.5} />
              </div>
              <p className="mb-2.5 text-lg font-bold text-text-primary dark:text-white">
                Success!
              </p>
              <p className="mb-4 text-[15px] leading-5 text-text-secondary">
                Shift started successfully
              </p>
              <button
                type="button"
                onClick={() => {
                  setShiftStartedSuccess(false);
                  onOpenShiftSuccessDismiss?.();
                }}
                className="min-w-[96px] rounded-xl bg-mintcom-green px-6 py-3 text-[15px] font-semibold !text-white"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* POS closed-shift review modal */}
      <AnimatePresence>
        {closedReview && (
          <div className="absolute inset-0 z-[85] flex items-center justify-center bg-black/55 p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex max-h-[min(90%,560px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
            >
              <div className="shrink-0 px-5 pt-5 text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-mintcom-green/15 text-mintcom-green">
                  <Check size={28} strokeWidth={2.5} />
                </div>
                <p className="text-base font-extrabold text-text-primary dark:text-white">
                  Review Your Report
                </p>
                <p className="mt-1 text-[12px] text-text-secondary">
                  Your shift has been closed. Review the summary below.
                </p>
                <div className="mt-3 rounded-xl border border-gray-100 bg-cream-50 px-3 py-2 dark:border-white/8 dark:bg-mintcom-dark">
                  <p className="text-[13px] font-bold text-text-primary dark:text-white">
                    {closedReview.hoursLabel}
                  </p>
                  {closedReview.startedAt && (
                    <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-text-secondary">
                      <Clock size={12} />
                      Started:{' '}
                      {new Date(closedReview.startedAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-0 overflow-y-auto px-5 py-2 text-[12px]">
                {(
                  [
                    ['Opening Cash', money(closedReview.openingCash)],
                    ['Cash Sales', money(closedReview.cashSales)],
                    ['Card Sales', money(closedReview.cardSales)],
                    ['Other Payment Methods', money(closedReview.otherSales)],
                    ['PAY-IN', money(closedReview.payIn)],
                    ['PAY-OUT', money(closedReview.payOut)],
                    ['Net Sales', money(closedReview.cashSales + closedReview.cardSales + closedReview.otherSales)],
                    ['Number of Orders', String(closedReview.orders)],
                  ] as const
                ).map(([label, val]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-b border-gray-100 py-2 dark:border-white/8"
                  >
                    <span className="text-text-secondary">{label}</span>
                    <span className="font-bold tabular-nums text-text-primary dark:text-white">
                      {val}
                    </span>
                  </div>
                ))}
              </div>

              <div className="shrink-0 space-y-1.5 border-t border-gray-100 bg-cream-50 px-5 py-3 dark:border-white/8 dark:bg-mintcom-dark">
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">Expected Cash</span>
                  <span className="font-extrabold tabular-nums text-mintcom-green">
                    {money(closedReview.expected)}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">Actual Cash</span>
                  <span className="font-extrabold tabular-nums dark:text-white">
                    {money(closedReview.actual)}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">Cash Discrepancy</span>
                  <span
                    className={`font-extrabold tabular-nums ${
                      closedReview.variance === 0
                        ? 'text-mintcom-green'
                        : 'text-mintcom-red'
                    }`}
                  >
                    {money(closedReview.variance)}
                  </span>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2 border-t border-gray-100 p-4 dark:border-white/8">
                <button
                  type="button"
                  onClick={() => setShowShiftPrint(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green py-2.5 text-[12px] font-extrabold text-white shadow-sm transition-opacity hover:opacity-90"
                >
                  <Printer size={16} /> Print Report
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClosedReview(null)}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-bold text-text-secondary dark:border-white/10"
                  >
                    Stay on Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setClosedReview(null);
                      onSignOut?.();
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-mintcom-red py-2.5 text-[12px] font-extrabold text-white"
                  >
                    <LogOut size={15} /> Confirm &amp; Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shift Report Print Modal (mirrors POS PrintReportModal / ShiftReportPrintData) */}
      <AnimatePresence>
        {showShiftPrint && (
          <div className="absolute inset-0 z-[85] flex items-center justify-center bg-black/55 p-4">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="flex max-h-[min(90%,580px)] w-full max-w-md flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-white/8">
                <div className="flex items-center gap-2">
                  <Printer size={18} className="text-mintcom-green" />
                  <p className="text-base font-bold text-text-primary dark:text-white">
                    Shift Report
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShiftPrint(false)}
                  className="rounded-lg p-1 text-text-secondary hover:bg-cream-100 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-5 font-mono text-[13px] leading-relaxed">
                <div className="border-b border-dashed border-gray-200 pb-3 text-center dark:border-white/10">
                  <p className="font-sans text-base font-extrabold text-text-primary dark:text-white">Cafe Delight</p>
                  <p className="text-xs text-text-secondary">Shift Summary Report</p>
                  <p className="mt-1 text-[11px] text-text-tertiary">{dateLabel}</p>
                </div>
                <div className="space-y-1.5 py-3 border-b border-dashed border-gray-200 dark:border-white/10">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Cashier:</span>
                    <span className="font-bold text-text-primary dark:text-white">{userName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Status:</span>
                    <span className="font-bold text-mintcom-green">{isOpen ? 'ACTIVE SHIFT' : 'CLOSED'}</span>
                  </div>
                  {shift.startedAt && (
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Started:</span>
                      <span className="tabular-nums">{shiftStartedLabel}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-1.5 py-3 border-b border-dashed border-gray-200 dark:border-white/10">
                  <div className="flex justify-between">
                    <span>Opening Cash:</span>
                    <span className="font-bold tabular-nums">{money(shift.openingCash)}</span>
                  </div>
                  <div className="flex justify-between text-mintcom-green font-bold">
                    <span>Cash Sales (+):</span>
                    <span className="tabular-nums">{money(displayCashSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Card Sales (+):</span>
                    <span className="tabular-nums font-bold">{money(displayCardSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Other Payments (+):</span>
                    <span className="tabular-nums font-bold">{money(displayOtherSales)}</span>
                  </div>
                  <div className="flex justify-between text-mintcom-green">
                    <span>Pay-In (+):</span>
                    <span className="tabular-nums font-bold">{money(displayPayIn)}</span>
                  </div>
                  <div className="flex justify-between text-mintcom-red">
                    <span>Pay-Out (-):</span>
                    <span className="tabular-nums font-bold">−{money(displayPayOut)}</span>
                  </div>
                </div>
                <div className="space-y-1.5 py-3">
                  <div className="flex justify-between font-bold">
                    <span>Net Sales:</span>
                    <span className="text-mintcom-green font-black tabular-nums">{money(displayNetSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="tabular-nums font-bold">{displayOrders}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-gray-200 pt-2 font-bold dark:border-white/10">
                    <span>Expected in Drawer:</span>
                    <span className="tabular-nums text-mintcom-green font-black">{money(expectedCash)}</span>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-100 bg-cream-50 p-4 dark:border-white/8 dark:bg-mintcom-dark">
                <button
                  type="button"
                  onClick={() => {
                    setShowShiftPrint(false);
                    if (typeof window !== 'undefined') window.print();
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green py-2.5 text-sm font-bold text-white shadow-md shadow-mintcom-green/20"
                >
                  <Printer size={16} /> Print Shift Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DemoTodaysOrdersModal
        open={todaysOrdersOpen}
        sales={shift.sales}
        staffName={staff?.name}
        onClose={() => setTodaysOrdersOpen(false)}
      />
    </Fill>
  );
}

function MetricSalesCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  // Static POS SalesCard — equal height via parent flex, fixed padding/type
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[#E2E8F0] bg-[#F4F5F7] p-4 dark:border-white/10 dark:bg-mintcom-dark">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-green !text-white [&_svg]:text-white">
          {icon}
        </span>
        <div className="min-w-0 text-start">
          <p className="text-[13px] font-medium text-[#737182] dark:text-white/70">{label}</p>
          <p className="mt-0.5 text-[11px] font-normal text-[#828287] dark:text-white/45">
            Excludes tax and other charges
          </p>
        </div>
      </div>
      <p className="flex flex-1 items-center justify-center text-center text-[26px] font-bold tabular-nums tracking-normal text-[#1F1D2B] dark:text-white">
        {value}
      </p>
    </div>
  );
}

function SmallMetric({
  icon,
  label,
  value,
  info,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  info?: string;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[90px] items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F4F5F7] p-3 dark:border-white/10 dark:bg-mintcom-dark"
    >
      {info && (
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          className="absolute end-2 top-2 text-[#9CA3AF] hover:text-text-secondary"
          aria-label="Info"
        >
          <Info size={16} />
        </button>
      )}
      {showInfo && info && (
        <div className="absolute end-2 top-8 z-10 max-w-[180px] rounded-xl border border-gray-200 bg-white p-2 text-[10px] font-medium text-text-secondary shadow-lg dark:border-white/10 dark:bg-mintcom-surface dark:text-white">
          {info}
        </div>
      )}
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white [&_svg]:text-white">
        {icon}
      </span>
      <div className="min-w-0 flex-1 pe-5 text-start">
        <p className="truncate text-[11px] font-medium text-[#737182]">{label}</p>
        <p className="mt-0.5 truncate text-[15px] font-bold tabular-nums text-[#1F1D2B] dark:text-white">
          {value}
        </p>
      </div>
    </div>
  );
}

/** POS PayCard — PAY-IN green / PAY-OUT red */
function PayInOutMetric({ payIn, payOut }: { payIn: string; payOut: string }) {
  return (
    <div className="flex min-h-[90px] items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F4F5F7] p-3 dark:border-white/10 dark:bg-mintcom-dark">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green !text-white">
        <ArrowUpDown size={20} className="text-white" />
      </span>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#737182]">
            PAY-IN
          </span>
          <span className="text-[13px] font-bold tabular-nums text-mintcom-green">
            {payIn}
          </span>
        </div>
        <div className="h-px bg-[#E2E8F0] dark:bg-white/10" />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#737182]">
            PAY-OUT
          </span>
          <span className="text-[13px] font-bold tabular-nums text-[#D55263]">
            {payOut}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Reports — full POS ReportsScreen mirror ───────────────────────────── */
export { DemoReportsScreen } from './PosDemoReports';

/* ─── Notifications center (held + stock + system — like real POS) ─────── */
export type DemoHeldTicket = {
  id: string;
  orderNo: number;
  type: 'dine-in' | 'takeaway' | 'delivery';
  lines: { emoji: string; name: string; qty: number; unitPrice: number }[];
  discountPct: number;
  note: string;
  /** Table or guest nickname from Hold Order popup */
  label: string;
  at: number;
};

/* ─── Notification model (mirrors real POS alerts + history) ────────────── */
type AlertKind = 'stock_out' | 'stock_red' | 'stock_yellow' | 'system_update';
type HistoryKind = 'refund' | 'cash' | 'system' | 'order' | 'stock';

type DemoAlert = {
  id: string;
  kind: AlertKind;
  title: string;
  message: string;
  time: string;
};

type DemoHistory = {
  id: string;
  kind: HistoryKind;
  title: string;
  message: string;
  at: number;
  isNew: boolean;
};

const HOUR_MS = 3600_000;
const DAY_MS = 24 * HOUR_MS;

const INITIAL_ALERTS: DemoAlert[] = [
  {
    id: 'a1',
    kind: 'stock_out',
    title: 'Out of Stock',
    message: 'Oat milk is out of stock. The item is blocked on the sales screen until it is restocked.',
    time: '4m ago',
  },
  {
    id: 'a2',
    kind: 'stock_red',
    title: 'Critical Stock Alert',
    message: 'Espresso beans: 4 left, below the red threshold (5). Reorder now.',
    time: '18m ago',
  },
  {
    id: 'a3',
    kind: 'stock_yellow',
    title: 'Low Stock',
    message: 'To-go cups (L): 28 left, low-stock threshold reached. Reorder soon.',
    time: '1h ago',
  },
  {
    id: 'a4',
    kind: 'system_update',
    title: 'System Update 1.1.0',
    message: 'A new version of Mintcom POS is available. Tap to see what’s new.',
    time: 'Now',
  },
];

const INITIAL_HISTORY: DemoHistory[] = [
  {
    id: 'h1',
    kind: 'refund',
    title: 'Order Refunded',
    message: 'Order #1042 was refunded (Refund #R-88). Reason: wrong item.',
    at: Date.now() - 40 * 60_000,
    isNew: true,
  },
  {
    id: 'h2',
    kind: 'cash',
    title: 'Cash Alert',
    message: 'A large cash payment was recorded on order #1039.',
    at: Date.now() - 3 * HOUR_MS,
    isNew: true,
  },
  {
    id: 'h3',
    kind: 'stock',
    title: 'Stock Updated',
    message: 'Croissant restocked: +24 units added to inventory.',
    at: Date.now() - DAY_MS - 2 * HOUR_MS,
    isNew: false,
  },
  {
    id: 'h4',
    kind: 'order',
    title: 'Held Order Resumed',
    message: 'Table 3 order was resumed from hold and completed checkout.',
    at: Date.now() - 3 * DAY_MS,
    isNew: false,
  },
];

function relTime(at: number) {
  const m = Math.max(1, Math.round((Date.now() - at) / 60000));
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* Held order → POS thermal-receipt strip (mirrors PinnedNotificationItem). */
function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="shrink-0 text-[12px] font-semibold uppercase tracking-wide text-gray-500 dark:text-mintcom-textSecondary">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-end text-[13px] font-bold text-[#1A1A1A] dark:text-white">
        {value}
      </span>
    </div>
  );
}

function HeldReceiptCard({
  ticket,
  staffName,
  onResume,
}: {
  ticket: DemoHeldTicket;
  staffName?: string;
  onResume: () => void;
}) {
  const [printed, setPrinted] = useState(false);
  const sub = ticket.lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const total = sub * (1 - ticket.discountPct / 100);
  const qty = ticket.lines.reduce((s, l) => s + l.qty, 0);
  const title = ticket.label || `Held · #${ticket.orderNo}`;

  return (
    <div className="mb-2.5 overflow-hidden rounded-xl border border-gray-300 bg-[#FFFEF9] px-3 pb-2 pt-2.5 shadow-md dark:border-white/10 dark:bg-mintcom-surface">
      <p className="text-center text-lg font-extrabold text-[#1A1A1A] dark:text-white">{title}</p>
      <p className="mb-1.5 text-center text-[11px] font-semibold tracking-[0.12em] text-gray-500 dark:text-mintcom-textSecondary">
        PINNED ORDER
      </p>

      <div className="my-1 border-b border-gray-300 dark:border-white/10" />

      <ReceiptRow label="Time" value={relTime(ticket.at)} />
      <ReceiptRow label="Items" value={`${qty} ${qty === 1 ? 'item' : 'items'}`} />
      {staffName ? <ReceiptRow label="Held by" value={staffName} /> : null}
      {ticket.note ? <ReceiptRow label="Note" value={ticket.note} /> : null}

      <div className="my-1 border-b border-dashed border-gray-300 dark:border-white/10" />

      <div className="flex flex-col items-center gap-0.5 py-1">
        <span className="text-[11px] font-bold tracking-[0.14em] text-gray-500 dark:text-mintcom-textSecondary">
          TOTAL
        </span>
        <span className="text-[22px] font-black leading-none text-[#1A1A1A] dark:text-white">${total.toFixed(2)}</span>
        {ticket.discountPct > 0 && (
          <span className="text-[10px] font-bold text-mintcom-green">{ticket.discountPct}% off</span>
        )}
      </div>

      <div className="my-1 border-b border-gray-300 dark:border-white/10" />

      <div className="flex items-center justify-center gap-2 pb-1">
        <button
          type="button"
          onClick={() => { setPrinted(true); setTimeout(() => setPrinted(false), 1500); }}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-500 dark:border-white/10 dark:bg-mintcom-dark dark:text-mintcom-textSecondary"
        >
          <Printer size={14} /> {printed ? 'Sent ✓' : 'Print'}
        </button>
        <button
          type="button"
          onClick={onResume}
          className="flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-mintcom-green px-4 py-2 text-[13px] font-extrabold text-white"
        >
          Resume <ArrowRight size={15} className="rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}

/* Alert → solid gradient card (mirrors PinnedNotificationItem non-held). */
function alertTone(kind: AlertKind) {
  switch (kind) {
    case 'stock_out':
    case 'stock_red':
      return {
        wrap: 'bg-mintcom-red',
        text: 'text-white',
        sub: 'text-white/90',
        icon: <AlertTriangle size={18} className="text-white" />,
      };
    case 'stock_yellow':
      return {
        wrap: 'bg-mintcom-yellow',
        text: 'text-black',
        sub: 'text-black/80',
        icon: <AlertTriangle size={18} className="text-black" />,
      };
    case 'system_update':
    default:
      return {
        wrap: 'bg-gradient-to-br from-[#3B82F6] to-[#2563EB]',
        text: 'text-white',
        sub: 'text-white/90',
        icon: <DownloadCloud size={18} className="text-white" />,
      };
  }
}

function AlertCard({ alert, onClick }: { alert: DemoAlert; onClick?: () => void }) {
  const tone = alertTone(alert.kind);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-3 w-full overflow-hidden rounded-xl p-4 text-start shadow-md transition-transform active:scale-[0.99] ${tone.wrap}`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
            {tone.icon}
          </span>
          <p className={`min-w-0 flex-1 text-[15px] font-bold ${tone.text}`}>{alert.title}</p>
        </div>
        <span className={`shrink-0 text-[12px] font-semibold ${tone.sub}`}>{alert.time}</span>
      </div>
      <p className={`text-[14px] leading-5 ${tone.sub}`}>{alert.message}</p>
    </button>
  );
}

/* History → NotificationItem card (gradient icon + trash). */
function HistoryIcon({ kind, className }: { kind: HistoryKind; className: string }) {
  const props = { size: 20, className };
  switch (kind) {
    case 'refund':
      return <RotateCcw {...props} />;
    case 'cash':
      return <DollarSign {...props} />;
    case 'order':
      return <ShoppingBag {...props} />;
    case 'stock':
      return <Package {...props} />;
    default:
      return <Bell {...props} />;
  }
}

function HistoryCard({ item, onDelete }: { item: DemoHistory; onDelete: (id: string) => void }) {
  return (
    <div className="mb-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-mintcom-surface">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
            item.isNew
              ? 'bg-gradient-to-br from-mintcom-green to-mintcom-greenDark shadow-sm shadow-mintcom-green/30'
              : 'bg-cream-100 dark:bg-mintcom-dark'
          }`}
        >
          <HistoryIcon
            kind={item.kind}
            className={item.isNew ? 'text-white' : 'text-text-tertiary dark:text-mintcom-gray'}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            {item.isNew && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mintcom-green" />}
            <p
              className={`min-w-0 flex-1 truncate text-[15px] text-text-primary dark:text-white ${
                item.isNew ? 'font-bold' : 'font-semibold'
              }`}
            >
              {item.title}
            </p>
          </div>
          <p className="line-clamp-2 text-[13px] leading-5 text-text-secondary dark:text-mintcom-textSecondary">
            {item.message}
          </p>
          <p className="mt-2 text-[11px] font-medium text-text-tertiary dark:text-mintcom-gray">
            {new Date(item.at).toLocaleString()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-red/10 text-mintcom-red"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

/* Section header pill (special = primary tinted highlight). */
function SectionPill({
  title,
  special,
  action,
}: {
  title: string;
  special?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 mt-1 flex items-center justify-between">
      <span
        className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[13px] font-black uppercase tracking-wide ${
          special
            ? 'bg-mintcom-green/15 text-mintcom-green'
            : 'bg-cream-100 text-text-secondary dark:bg-mintcom-dark dark:text-mintcom-textSecondary'
        }`}
      >
        {title}
      </span>
      {action}
    </div>
  );
}

function ColumnHeader({ title }: { title: string }) {
  return (
    <p className="mb-3 text-sm font-bold uppercase tracking-[0.12em] text-text-secondary dark:text-mintcom-textSecondary">
      {title}
    </p>
  );
}

/**
 * Notifications — mirrors mintcom-pos NotificationsScreen:
 *  • Split layout: Held Orders column + Alerts & History column
 *  • Held orders = thermal receipt strips
 *  • Alerts = solid gradient cards · History = NotificationItem cards
 *  • Search filters held orders · Today / Yesterday / Earlier grouping
 */
export function DemoNotificationsScreen({
  held,
  staffName,
  onResumeHeld,
  onAlertClick,
}: {
  held: DemoHeldTicket[];
  staffName?: string;
  onResumeHeld: (ticket: DemoHeldTicket) => void;
  onDismissHeld?: (id: string) => void;
  onAlertClick?: (alert: DemoAlert) => void;
}) {
  const [alerts] = useState(INITIAL_ALERTS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [search, setSearch] = useState('');
  // Phones show one column at a time (tabs); sm+ keeps the side-by-side split.
  const [notifTab, setNotifTab] = useState<'held' | 'alerts'>(held.length > 0 ? 'held' : 'alerts');

  const filteredHeld = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return held;
    return held.filter(
      (h) =>
        (h.label || '').toLowerCase().includes(q) ||
        String(h.orderNo).includes(q) ||
        h.lines.some((l) => l.name.toLowerCase().includes(q)),
    );
  }, [held, search]);

  const groups = useMemo(() => {
    const today: DemoHistory[] = [];
    const yesterday: DemoHistory[] = [];
    const earlier: DemoHistory[] = [];
    const todayStr = new Date().toDateString();
    const yst = new Date();
    yst.setDate(yst.getDate() - 1);
    const ystStr = yst.toDateString();
    history.forEach((h) => {
      const ds = new Date(h.at).toDateString();
      if (ds === todayStr) today.push(h);
      else if (ds === ystStr) yesterday.push(h);
      else earlier.push(h);
    });
    return { today, yesterday, earlier };
  }, [history]);

  const removeHistory = (id: string) => setHistory((list) => list.filter((h) => h.id !== id));
  const clearAll = () => setHistory([]);

  const hasHistory = history.length > 0;

  const heldColumn = (
    <div className="flex min-h-0 flex-1 flex-col">
      <ColumnHeader title="Held Orders" />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pe-0.5">
        {filteredHeld.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Pause size={40} className="mb-3 text-text-tertiary opacity-50" />
            <p className="text-sm font-bold text-text-secondary dark:text-mintcom-textSecondary">
              {search ? 'No Held Orders Found' : 'No Held Orders'}
            </p>
          </div>
        ) : (
          filteredHeld.map((t) => (
            <HeldReceiptCard key={t.id} ticket={t} staffName={staffName} onResume={() => onResumeHeld(t)} />
          ))
        )}
      </div>
    </div>
  );

  const alertsHistoryColumn = (
    <div className="flex min-h-0 flex-1 flex-col">
      <ColumnHeader title="Alerts & History" />
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pe-0.5">
        {alerts.length === 0 && !hasHistory ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell size={44} className="mb-3 text-text-tertiary opacity-50" />
            <p className="text-base font-bold text-text-primary dark:text-white">No Alerts Yet</p>
            <p className="mt-1 text-sm text-text-secondary dark:text-mintcom-textSecondary">You’re all caught up!</p>
          </div>
        ) : (
          <>
            {alerts.length > 0 && (
              <>
                {alerts.map((a) => (
                  <AlertCard key={a.id} alert={a} onClick={() => onAlertClick?.(a)} />
                ))}
              </>
            )}
            {groups.today.length > 0 && (
              <>
                <SectionPill
                  title="Today"
                  action={
                    <button type="button" onClick={clearAll} className="text-[12px] font-bold text-mintcom-green">
                      Clear All
                    </button>
                  }
                />
                {groups.today.map((h) => (
                  <HistoryCard key={h.id} item={h} onDelete={removeHistory} />
                ))}
              </>
            )}
            {groups.yesterday.length > 0 && (
              <>
                <SectionPill title="Yesterday" />
                {groups.yesterday.map((h) => (
                  <HistoryCard key={h.id} item={h} onDelete={removeHistory} />
                ))}
              </>
            )}
            {groups.earlier.length > 0 && (
              <>
                <SectionPill title="Earlier" />
                {groups.earlier.map((h) => (
                  <HistoryCard key={h.id} item={h} onDelete={removeHistory} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <Fill>
      {/* Header — title + held-order search (mirrors POS desktop header) */}
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="font-barlow text-lg font-black text-text-primary dark:text-white sm:text-2xl">
          Notifications
        </h2>
        <div className={`w-full sm:w-auto items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 dark:border-white/10 dark:bg-mintcom-surface ${notifTab === 'alerts' ? 'hidden sm:flex' : 'flex'}`}>
          <Search size={16} className="shrink-0 text-text-tertiary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search held orders"
            className="min-h-[44px] w-full sm:w-56 bg-transparent py-2 text-[16px] sm:text-[13px] outline-none dark:text-white"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear search" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
              <X size={14} className="text-text-tertiary" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile tabs — one column at a time; sm+ keeps the split */}
      <div className="mb-3 grid shrink-0 grid-cols-2 gap-1 rounded-xl bg-cream-100 p-1 dark:bg-mintcom-dark sm:hidden" role="tablist" aria-label="Notifications views">
        {(
          [
            { id: 'held' as const, label: 'Held Orders', count: filteredHeld.length },
            { id: 'alerts' as const, label: 'Alerts', count: alerts.length + history.length },
          ]
        ).map((t) => {
          const on = notifTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setNotifTab(t.id)}
              className={`flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 text-[13px] font-bold transition-colors ${
                on ? 'bg-white text-text-primary shadow-sm dark:bg-mintcom-surface dark:text-white' : 'text-text-secondary dark:text-mintcom-textSecondary'
              }`}
            >
              <span className="truncate">{t.label}</span>
              {t.count > 0 && (
                <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black ${on ? 'bg-mintcom-green text-white' : 'bg-gray-300/60 text-text-secondary dark:bg-white/10'}`}>
                  {t.count > 99 ? '99+' : t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Split layout — active tab on phones, side-by-side on sm+ */}
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row gap-4 sm:gap-6 overflow-hidden overscroll-contain">
        <div className={`${notifTab === 'held' ? 'flex' : 'hidden'} sm:flex min-h-0 flex-1 flex-col sm:min-w-0`}>
          {heldColumn}
        </div>
        <div className="hidden sm:block w-px shrink-0 self-stretch bg-gray-200 dark:bg-white/8" aria-hidden />
        <div className={`${notifTab === 'alerts' ? 'flex' : 'hidden'} sm:flex min-h-0 flex-1 flex-col sm:min-w-0`}>
          {alertsHistoryColumn}
        </div>
      </div>
    </Fill>
  );
}

/* ─── Settings — full interactive mirror of mintcom-pos SettingsScreen ─── */
export { DemoSettingsScreen } from './PosDemoSettings';

/* ─── Support — full POS ContactSupportScreen mirror ───────────────────── */
export { DemoSupportScreen } from './PosDemoSupport';

/* ─── Today's Orders modal — mirrors POS TodaysOrdersModal (list + detail + refund) ─── */
export function DemoTodaysOrdersModal({
  open,
  sales,
  staffName,
  onClose,
  onViewReceipt,
  onRefund,
}: {
  open: boolean;
  sales: DemoSale[];
  staffName?: string;
  onClose: () => void;
  onViewReceipt?: (sale: DemoSale) => void;
  onRefund?: (saleId: string, result: RefundResult) => void;
}) {
  const [selected, setSelected] = useState<DemoSale | null>(null);
  const [showRefund, setShowRefund] = useState(false);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setShowRefund(false);
    }
  }, [open]);

  // Keep selected in sync when parent updates sales after refund
  useEffect(() => {
    if (!selected) return;
    const fresh = sales.find((s) => s.id === selected.id);
    if (fresh) setSelected(fresh);
  }, [sales, selected]);

  if (!open) return null;

  const statusLabel = (s: DemoSale) => {
    const st = s.status ?? 'completed';
    if (st === 'refunded') return 'Refunded';
    if (st === 'partially_refunded') return 'Partial refund';
    return 'Completed';
  };

  const statusClass = (s: DemoSale) => {
    const st = s.status ?? 'completed';
    if (st === 'refunded') return 'bg-mintcom-red/15 text-mintcom-red';
    if (st === 'partially_refunded') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
    return 'bg-mintcom-green/15 text-mintcom-green';
  };

  const canRefund = (s: DemoSale) => (s.status ?? 'completed') !== 'refunded';

  const refundLines =
    selected?.lines?.map((l) => ({
      id: l.id,
      name: l.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
      emoji: l.emoji,
      refundedQty: selected.refundedLineQty?.[l.id] ?? 0,
    })) ??
    (selected
      ? [
          {
            id: 'all',
            name: selected.items || 'Order',
            qty: 1,
            unitPrice: selected.total,
            emoji: '',
            refundedQty: selected.status === 'refunded' ? 1 : 0,
          },
        ]
      : []);

  return (
    <>
      <div className="absolute inset-0 z-[75] flex items-center justify-center bg-black/55 p-3 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="flex h-[min(88%,560px)] w-full max-w-[720px] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface sm:flex-row"
        >
          {/* List pane — POS MyOrdersModal list */}
          <div
            className={`flex min-h-0 flex-col border-gray-100 dark:border-white/8 ${
              selected ? 'hidden sm:flex sm:w-[42%] sm:border-e' : 'w-full'
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/8">
              <div>
                <h3 className="text-[16px] font-extrabold text-text-primary dark:text-white">
                  Today's Orders
                </h3>
                <p className="text-[11px] text-text-secondary">
                  {staffName ? `${staffName} · this shift` : 'Sales from this shift'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3">
              {sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag size={44} className="mb-3 text-text-tertiary opacity-50" />
                  <p className="text-sm font-bold text-text-primary dark:text-white">
                    No orders yet
                  </p>
                  <p className="mt-1 max-w-[220px] text-[12px] text-text-secondary">
                    Orders from this shift will appear here.
                  </p>
                </div>
              ) : (
                sales.map((sale) => {
                  const time = new Date(sale.at).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const active = selected?.id === sale.id;
                  return (
                    <button
                      key={sale.id}
                      type="button"
                      onClick={() => setSelected(sale)}
                      className={`mb-2 w-full rounded-xl border px-3 py-3 text-start transition-colors ${
                        active
                          ? 'border-mintcom-green bg-mintcom-green/10'
                          : 'border-gray-100 bg-[#F9FAFB] hover:border-mintcom-green/35 dark:border-white/8 dark:bg-mintcom-dark'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[15px] font-extrabold text-text-primary dark:text-white">
                          #{sale.orderNo}
                        </span>
                        <span className="text-[11px] font-medium text-text-tertiary">
                          {time}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[15px] font-extrabold tabular-nums text-mintcom-green">
                          {money(sale.total)}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${statusClass(sale)}`}
                        >
                          {statusLabel(sale)}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[11px] text-text-secondary">
                        {sale.items} · {sale.methodLabel}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Detail pane */}
          <div
            className={`flex min-h-0 min-w-0 flex-1 flex-col ${
              selected ? 'flex' : 'hidden sm:flex'
            }`}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/8">
              <div className="min-w-0">
                {selected ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelected(null)}
                      className="mb-0.5 text-[11px] font-bold text-mintcom-green sm:hidden"
                    >
                      ← Back to list
                    </button>
                    <h3 className="text-[16px] font-extrabold text-text-primary dark:text-white">
                      Order #{selected.orderNo}
                    </h3>
                  </>
                ) : (
                  <h3 className="text-[15px] font-bold text-text-secondary">
                    Select an order
                  </h3>
                )}
              </div>
              {selected && (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10 sm:hidden"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {!selected && (
                <div className="flex h-full flex-col items-center justify-center text-center text-text-tertiary">
                  <Receipt size={40} className="mb-2 opacity-40" />
                  <p className="text-[13px] font-medium">
                    Tap an order to view details
                  </p>
                </div>
              )}

              {selected && (
              <div className="space-y-3">
                <div className="rounded-xl border border-gray-100 bg-[#F9FAFB] p-3 dark:border-white/8 dark:bg-mintcom-dark">
                  <div className="mb-2 flex items-center justify-between text-[12px]">
                    <span className="text-text-secondary">Status</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${statusClass(selected)}`}>
                      {statusLabel(selected)}
                    </span>
                  </div>
                  {selected.tenders && selected.tenders.length > 0 ? (
                    <div className="mb-2">
                      <div className="flex justify-between text-[12px] mb-1.5">
                        <span className="text-text-secondary">Payment Method</span>
                        <span className="font-bold text-text-primary dark:text-white">{selected.methodLabel}</span>
                      </div>
                      <div className="rounded-lg bg-white p-2 text-[11px] space-y-1 border border-gray-100 dark:bg-mintcom-surface dark:border-white/5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Tender Breakdown</span>
                        {selected.tenders.map((tItem, idx) => (
                          <div key={idx} className="flex justify-between font-medium">
                            <span className="text-text-secondary">{tItem.label || tItem.method}</span>
                            <span className="font-bold tabular-nums text-text-primary dark:text-white">{money(tItem.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2 flex justify-between text-[12px]">
                      <span className="text-text-secondary">Payment Method</span>
                      <span className="font-bold text-text-primary dark:text-white">{selected.methodLabel}</span>
                    </div>
                  )}
                  {selected.orderType && (
                    <div className="mb-2 flex justify-between text-[12px]">
                      <span className="text-text-secondary">Type</span>
                      <span className="font-bold capitalize text-text-primary dark:text-white">
                        {selected.orderType.replace('-', ' ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[12px]">
                    <span className="text-text-secondary">Time</span>
                    <span className="font-bold text-text-primary dark:text-white">
                      {new Date(selected.at).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {selected.refundReason && (
                    <p className="mt-2 text-[10px] font-bold text-mintcom-red">
                      Refund: {selected.refundReason}
                      {selected.refundedAmount != null
                        ? ` · ${money(selected.refundedAmount)}`
                        : ''}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-white p-3 dark:border-white/8 dark:bg-mintcom-surface">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                    Items
                  </p>
                  {selected.lines && selected.lines.length > 0 ? (
                    selected.lines.map((line) => {
                      const rq = selected.refundedLineQty?.[line.id] ?? 0;
                      const remaining = line.qty - rq;
                      return (
                        <div
                          key={line.id}
                          className="mb-2 flex justify-between gap-2 border-b border-dashed border-gray-100 pb-2 last:mb-0 last:border-0 last:pb-0 dark:border-white/8"
                        >
                          <span className="text-xs font-medium text-text-primary dark:text-white">
                            {line.qty}x {line.emoji} {line.name}
                            {rq > 0 && (
                              <span className="ms-1 text-[9px] font-bold text-mintcom-red">
                                ({rq} refunded
                                {remaining > 0 ? `, ${remaining} left` : ''})
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-xs font-bold tabular-nums">
                            {money(line.unitPrice * line.qty)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-text-secondary dark:text-mintcom-textSecondary">
                      {selected.items}
                    </p>
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-cream-50 p-3 text-xs dark:border-white/8 dark:bg-mintcom-dark">
                  {selected.subtotal != null && (
                    <div className="mb-1 flex justify-between">
                      <span className="text-text-tertiary">Subtotal</span>
                      <span className="tabular-nums font-bold">{money(selected.subtotal)}</span>
                    </div>
                  )}
                  {selected.discount != null && selected.discount > 0 && (
                    <div className="mb-1 flex justify-between">
                      <span className="text-text-tertiary">Discount</span>
                      <span className="tabular-nums font-bold text-mintcom-red">
                        −{money(selected.discount)}
                      </span>
                    </div>
                  )}
                  {selected.tax != null && (
                    <div className="mb-1 flex justify-between">
                      <span className="text-text-tertiary">Tax</span>
                      <span className="tabular-nums font-bold">{money(selected.tax)}</span>
                    </div>
                  )}
                  <div className="mt-2 flex justify-between border-t border-dashed border-gray-200 pt-2 text-sm font-black dark:border-white/10">
                    <span>Total</span>
                    <span className="text-mintcom-green">{money(selected.total)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {canRefund(selected) && onRefund && (
                    <button
                      type="button"
                      onClick={() => setShowRefund(true)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-mintcom-red py-2.5 text-xs font-black text-white"
                    >
                      Refund
                    </button>
                  )}
                  {onViewReceipt && (
                    <button
                      type="button"
                      onClick={() => onViewReceipt(selected)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-text-primary dark:border-white/10 dark:text-white"
                    >
                      <Receipt size={14} /> View receipt
                    </button>
                  )}
                </div>
              </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {selected && showRefund && (
        <DemoRefundModal
          open={showRefund}
          orderNo={selected.orderNo}
          orderTotal={
            selected.status === 'partially_refunded' && selected.refundedAmount != null
              ? Math.max(0, selected.total - (selected.refundedAmount || 0))
              : selected.total
          }
          lines={refundLines}
          onClose={() => setShowRefund(false)}
          onConfirm={(result) => {
            onRefund?.(selected.id, result);
          }}
        />
      )}
    </>
  );
}

export const DemoMyOrdersModal = DemoTodaysOrdersModal;

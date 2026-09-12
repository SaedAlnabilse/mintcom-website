/**
 * Shared refund modal — mirrors POS RefundModal:
 * - Mode: Refund items | Refund entire order
 * - Item mode: select lines, qty steppers, remaining qty
 * - Reason required, restock toggle, success confirmation
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check, Info, List, ShoppingBag, Undo2, X } from 'lucide-react';

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export type RefundLine = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  emoji?: string;
  /** Already refunded qty on this line */
  refundedQty?: number;
};

export type RefundResult = {
  mode: 'item' | 'order';
  reason: string;
  refundMethod?: 'CASH' | 'CARD' | 'ORIGINAL';
  restock: boolean;
  /** lineId → qty refunded this action */
  lineQty: Record<string, number>;
  amount: number;
  fullOrder: boolean;
};

type Props = {
  open: boolean;
  orderNo: number;
  orderTotal: number;
  lines: RefundLine[];
  onClose: () => void;
  onConfirm: (result: RefundResult) => void;
};

export function DemoRefundModal({ open, orderNo, orderTotal, lines, onClose, onConfirm }: Props) {
  const refundable = useMemo(
    () =>
      lines
        .map((l) => {
          const refunded = l.refundedQty ?? 0;
          const remaining = Math.max(0, l.qty - refunded);
          return { ...l, remaining, refunded };
        })
        .filter((l) => l.remaining > 0),
    [lines],
  );

  const canItem = refundable.length > 0;
  const [mode, setMode] = useState<'item' | 'order'>('order');
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'CARD' | 'ORIGINAL'>('CASH');
  const [restock, setRestock] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ amount: number } | null>(null);

  const QUICK_REASONS = [
    'Customer changed mind',
    'Wrong order / item',
    'Defect / Quality issue',
    'Price correction',
  ];

  useEffect(() => {
    if (!open) return;
    setMode(canItem ? 'order' : 'order');
    setSelected({});
    setReason('');
    setRefundMethod('CASH');
    setRestock(true);
    setError('');
    setSuccess(null);
  }, [open, canItem, orderNo]);

  const selectedAmount = useMemo(() => {
    if (mode === 'order') return orderTotal;
    let sum = 0;
    for (const line of refundable) {
      const q = selected[line.id] ?? 0;
      if (q > 0) sum += line.unitPrice * q;
    }
    return sum;
  }, [mode, orderTotal, refundable, selected]);

  if (!open) return null;

  const selectedCount = Object.values(selected).reduce((s, n) => s + n, 0);

  const toggleLine = (id: string, remaining: number) => {
    setSelected((prev) => {
      if ((prev[id] ?? 0) > 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: Math.min(1, remaining) };
    });
    setError('');
  };

  const setQty = (id: string, qty: number, remaining: number) => {
    const q = Math.max(0, Math.min(remaining, qty));
    setSelected((prev) => {
      if (q <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: q };
    });
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Enter a refund reason');
      return;
    }
    if (mode === 'item') {
      if (selectedCount <= 0) {
        setError('Select at least one item');
        return;
      }
      const lineQty: Record<string, number> = {};
      for (const [id, q] of Object.entries(selected)) {
        if (q > 0) lineQty[id] = q;
      }
      const amount = selectedAmount;
      // Full if every remaining unit on every line is selected
      const fullOrder = refundable.every((l) => (selected[l.id] ?? 0) >= l.remaining);
      onConfirm({
        mode: 'item',
        reason: reason.trim(),
        refundMethod,
        restock,
        lineQty,
        amount,
        fullOrder,
      });
      setSuccess({ amount });
    } else {
      const lineQty: Record<string, number> = {};
      for (const l of refundable) lineQty[l.id] = l.remaining;
      onConfirm({
        mode: 'order',
        reason: reason.trim(),
        refundMethod,
        restock,
        lineQty,
        amount: orderTotal,
        fullOrder: true,
      });
      setSuccess({ amount: orderTotal });
    }
  };

  if (success) {
    return (
      <Overlay onClose={onClose}>
        <div className="flex flex-col items-center p-6 text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-mintcom-green text-white">
            <Check size={32} strokeWidth={3} />
          </div>
          <h3 className="text-lg font-black text-text-primary dark:text-white">Refund complete</h3>
          <p className="mt-1 text-sm text-text-secondary dark:text-mintcom-textSecondary">
            {money(success.amount)} refunded on order #{orderNo}
          </p>
          {restock && (
            <p className="mt-1 text-[11px] font-bold text-mintcom-green">Items restocked (demo)</p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-xl bg-mintcom-green py-2.5 text-sm font-black text-white"
          >
            Close
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/8">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-red/15 text-mintcom-red">
            <Undo2 size={18} />
          </span>
          <div>
            <h3 className="text-base font-black text-text-primary dark:text-white">Refund</h3>
            <p className="text-[11px] text-text-secondary">
              Order #{orderNo} · {money(orderTotal)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10"
        >
          <X size={16} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        {canItem && (
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-cream-50 p-1 dark:border-white/10 dark:bg-mintcom-dark">
            <button
              type="button"
              onClick={() => {
                setMode('item');
                setError('');
              }}
              className={`inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold ${
                mode === 'item'
                  ? 'bg-mintcom-red/15 text-mintcom-red shadow-sm'
                  : 'text-text-secondary'
              }`}
            >
              <List size={14} /> Refund items
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('order');
                setError('');
              }}
              className={`inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-[12px] font-bold ${
                mode === 'order'
                  ? 'bg-mintcom-green/15 text-mintcom-green shadow-sm'
                  : 'text-text-secondary'
              }`}
            >
              <ShoppingBag size={14} /> Entire order
            </button>
          </div>
        )}

        {mode === 'item' && canItem && (
          <div className="mb-3 space-y-1.5">
            <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              Select items
            </p>
            {refundable.map((line) => {
              const q = selected[line.id] ?? 0;
              const isOn = q > 0;
              return (
                <div
                  key={line.id}
                  className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                    isOn
                      ? 'border-mintcom-red/40 bg-mintcom-red/5'
                      : 'border-gray-100 bg-cream-50 dark:border-white/8 dark:bg-mintcom-dark'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleLine(line.id, line.remaining)}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                      isOn ? 'border-mintcom-red bg-mintcom-red text-white' : 'border-gray-300'
                    }`}
                  >
                    {isOn && <Check size={12} strokeWidth={3} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleLine(line.id, line.remaining)}
                    className="min-w-0 flex-1 text-start"
                  >
                    <p className="truncate text-[13px] font-bold dark:text-white">{line.name}</p>
                    <p className="text-[11px] text-text-tertiary">
                      Remaining: {isOn ? line.remaining - q : line.remaining} ·{' '}
                      {money(line.unitPrice)}/ea
                    </p>
                  </button>
                  {isOn ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setQty(line.id, q - 1, line.remaining)}
                        className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white text-sm font-bold shadow-sm dark:bg-mintcom-surface"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs font-black tabular-nums">{q}</span>
                      <button
                        type="button"
                        onClick={() => setQty(line.id, q + 1, line.remaining)}
                        className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-mintcom-red text-sm font-bold text-white"
                      >
                        +
                      </button>
                      <span className="ms-1 min-w-[52px] text-end text-[11px] font-black tabular-nums text-mintcom-red">
                        {money(line.unitPrice * q)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold tabular-nums text-text-tertiary">
                      {money(line.unitPrice * line.remaining)}
                    </span>
                  )}
                </div>
              );
            })}
            {selectedCount > 0 && (
              <p className="text-[11px] font-bold text-mintcom-red">
                {selectedCount} unit{selectedCount === 1 ? '' : 's'} · {money(selectedAmount)}
              </p>
            )}
          </div>
        )}

        {mode === 'order' && (
          <div className="mb-3 rounded-xl border border-mintcom-red/20 bg-mintcom-red/5 px-3 py-3 text-[11px] text-text-secondary dark:text-mintcom-textSecondary">
            Refund the <span className="font-black text-mintcom-red">entire order</span> (
            {money(orderTotal)}). All remaining items will be marked refunded.
          </div>
        )}

        {/* Refund Method Selector (matches POS refund tenders) */}
        <div className="mb-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Refund Method
          </p>
          <div className="grid grid-cols-3 gap-1 rounded-xl border border-gray-200 bg-cream-50 p-1 dark:border-white/10 dark:bg-mintcom-dark">
            {(['CASH', 'CARD', 'ORIGINAL'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRefundMethod(m)}
                className={`rounded-lg min-h-[44px] px-2 py-1.5 text-[11px] font-bold transition-colors ${
                  refundMethod === m
                    ? 'bg-mintcom-green text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary dark:text-mintcom-textSecondary'
                }`}
              >
                {m === 'ORIGINAL' ? 'Original' : m}
              </button>
            ))}
          </div>
          {refundMethod === 'CASH' && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-2.5 text-start text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              <Info size={15} className="shrink-0 text-blue-500" />
              <span>Cash refund will automatically open the cash drawer.</span>
            </div>
          )}
        </div>

        {/* Quick Reason Chips (mirrors POS TodaysOrdersModal quick reasons) */}
        <div className="mb-3">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Quick Reason
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setReason(r);
                  setError('');
                }}
                className={`rounded-lg border px-2.5 py-2 min-h-[36px] text-[12px] font-semibold transition-colors ${
                  reason === r
                    ? 'border-mintcom-red bg-mintcom-red/10 text-mintcom-red'
                    : 'border-gray-200 bg-white text-text-secondary hover:bg-cream-100 dark:border-white/10 dark:bg-mintcom-surface dark:text-mintcom-textSecondary'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-text-tertiary">
            Reason <span className="text-mintcom-red">*</span>
          </span>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            rows={3}
            placeholder="e.g. Wrong item, customer request, spilled drink…"
            className={`w-full rounded-xl border bg-cream-50 px-3 py-2 text-[16px] sm:text-sm outline-none focus:border-mintcom-green dark:bg-mintcom-dark dark:text-white ${
              error && !reason.trim() ? 'border-mintcom-red' : 'border-gray-200 dark:border-mintcom-tertiary'
            }`}
          />
        </label>

        <div className="mb-2 flex items-center justify-between rounded-xl border border-gray-100 bg-cream-50 px-3 py-2.5 dark:border-white/8 dark:bg-mintcom-dark">
          <div>
            <p className="text-xs font-bold dark:text-white">Restock items</p>
            <p className="text-[10px] text-text-tertiary">Return inventory (demo flag)</p>
          </div>
          <button
            type="button"
            onClick={() => setRestock((v) => !v)}
            className={`relative h-8 w-[52px] min-h-[32px] rounded-full ${restock ? 'bg-mintcom-green' : 'bg-gray-300 dark:bg-mintcom-tertiary'}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                restock ? 'start-5' : 'start-0.5'
              }`}
            />
          </button>
        </div>

        {error && <p className="mb-2 text-[11px] font-bold text-mintcom-red">{error}</p>}
      </div>

      <div className="shrink-0 border-t border-gray-100 px-4 pt-3 dark:border-white/8" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="mb-2 flex justify-between text-xs font-bold">
          <span className="text-text-tertiary">Refund amount</span>
          <span className="text-mintcom-red">{money(mode === 'order' ? orderTotal : selectedAmount)}</span>
        </div>
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full min-h-[48px] rounded-xl bg-mintcom-red py-2.5 text-sm font-black text-white"
        >
          Confirm refund
        </button>
      </div>
    </Overlay>
  );
}

function Overlay({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm sm:p-2.5">
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative z-10 flex max-h-[min(520px,88%)] w-full max-w-[min(94%,420px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Merge refund into sale line tracking */
export function applyRefundToSaleLines(
  lines: { id: string; qty: number; unitPrice: number; name: string; emoji: string }[] | undefined,
  lineQty: Record<string, number>,
  prevRefunded: Record<string, number> = {},
): { refundedLineQty: Record<string, number>; allRefunded: boolean; amount: number } {
  const refundedLineQty = { ...prevRefunded };
  let amount = 0;
  for (const line of lines ?? []) {
    const add = lineQty[line.id] ?? 0;
    if (add > 0) {
      refundedLineQty[line.id] = (refundedLineQty[line.id] ?? 0) + add;
      amount += line.unitPrice * add;
    }
  }
  const allRefunded =
    (lines ?? []).length > 0 &&
    (lines ?? []).every((l) => (refundedLineQty[l.id] ?? 0) >= l.qty);
  return { refundedLineQty, allRefunded, amount };
}

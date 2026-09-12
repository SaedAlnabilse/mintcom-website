/**
 * Demo Sales Trend chart — mirrors POS SalesTrendChartCard:
 * - View modes: Active shift (live) | Last shift | Last 7 days | Last 30 days
 * - Multi-series line chart: Net · Cash · Card · Other
 * - Interactive legend toggles, point tooltip, LIVE badge
 * - Y-axis labels + Time x-axis title
 */
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Clock,
  TrendingUp,
  X,
} from 'lucide-react';
import type { DemoSale } from './PosDemoExtraScreens';

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

type ViewMode = 'live' | 'lastShift' | 'last7Days' | 'last30Days';

type Point = {
  time: string;
  cash: number;
  card: number;
  other: number;
  net: number;
  timestamp: number;
};

type Visible = {
  net: boolean;
  cash: boolean;
  card: boolean;
  other: boolean;
};

const COLORS = {
  net: '#7dc6a2',
  cash: '#A8B8BF',
  card: '#737182',
  other: '#D8A85B',
};

function niceCeil(value: number): number {
  if (value <= 0) return 10;
  if (value <= 10) return 10;
  if (value <= 20) return 20;
  if (value <= 50) return 50;
  if (value <= 100) return 100;
  if (value <= 200) return 200;
  if (value <= 500) return 500;
  if (value <= 1000) return 1000;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const n = value / base;
  const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * base;
}

/** POS SalesTrendChartCard uses moment `h:mm A` (e.g. "9:00 AM"). */
function formatAxisTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Sparse x labels like POS: first, last, and every step-th point
 * (max ~8 labels when many points).
 */
function sparseXLabels(times: string[]): string[] {
  const n = times.length;
  if (n === 0) return [];
  const maxLabels = n <= 6 ? n : 8;
  const step = Math.max(1, Math.ceil(n / maxLabels));
  return times.map((t, index) =>
    index === 0 || index === n - 1 || index % step === 0 ? t : '',
  );
}

/** Build live hourly buckets from shift sales (cumulative, like POS live stream). */
function buildLiveSeries(sales: DemoSale[], startedAt: number | null): Point[] {
  if (!startedAt && sales.length === 0) return [];
  const start = startedAt ?? (sales.length ? Math.min(...sales.map((s) => s.at)) : Date.now());
  const end = Date.now();
  const hourMs = 3_600_000;
  // At least 4 points so the line reads; cap ~12 hours
  const firstHour = Math.floor(start / hourMs) * hourMs;
  const lastHour = Math.floor(end / hourMs) * hourMs;
  const points: Point[] = [];
  let cash = 0;
  let card = 0;
  let other = 0;
  const sorted = [...sales].sort((a, b) => a.at - b.at);
  let si = 0;

  for (let t = firstHour; t <= lastHour + hourMs; t += hourMs) {
    while (si < sorted.length && sorted[si].at <= t + hourMs - 1) {
      const s = sorted[si];
      if (s.status !== 'refunded') {
        if (s.method === 'cash') cash += s.total - (s.refundedAmount ?? 0);
        else if (s.method === 'card') card += s.total - (s.refundedAmount ?? 0);
        else other += s.total - (s.refundedAmount ?? 0);
      }
      si++;
    }
    const net = cash + card + other;
    points.push({
      time: formatAxisTime(t),
      cash: +cash.toFixed(2),
      card: +card.toFixed(2),
      other: +other.toFixed(2),
      net: +net.toFixed(2),
      timestamp: t,
    });
    if (t > end + hourMs) break;
    if (points.length >= 14) break;
  }

  // Always include a trailing "now" point with final totals
  if (points.length === 0 || points[points.length - 1].net !== cash + card + other) {
    // already included via loop
  }
  return points.length >= 2
    ? points
    : points.length === 1
      ? [points[0], { ...points[0], time: formatAxisTime(Date.now()), timestamp: Date.now() }]
      : [];
}

function seedLastShift(): Point[] {
  // POS last-shift timeline is typically business hours; labels use h:mm A
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17];
  let cash = 0;
  let card = 0;
  let other = 0;
  const bumps = [
    [40, 55, 10],
    [30, 70, 15],
    [55, 90, 20],
    [80, 120, 25],
    [60, 95, 18],
    [45, 80, 22],
    [70, 110, 30],
    [50, 85, 15],
    [35, 60, 12],
  ];
  return hours.map((h, i) => {
    cash += bumps[i][0];
    card += bumps[i][1];
    other += bumps[i][2];
    const d = new Date();
    d.setHours(h, 0, 0, 0);
    return {
      time: formatAxisTime(d.getTime()),
      cash,
      card,
      other,
      net: cash + card + other,
      timestamp: i,
    };
  });
}

function seedLast7Days(): Point[] {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const nets = [420, 510, 480, 620, 700, 890, 640];
  return days.map((time, i) => {
    const net = nets[i];
    return {
      time,
      cash: +(net * 0.38).toFixed(2),
      card: +(net * 0.48).toFixed(2),
      other: +(net * 0.14).toFixed(2),
      net,
      timestamp: i,
    };
  });
}

function seedLast30Days(): Point[] {
  return [
    { time: 'Week 1', cash: 980, card: 1320, other: 210, net: 2510, timestamp: 0 },
    { time: 'Week 2', cash: 1100, card: 1480, other: 240, net: 2820, timestamp: 1 },
    { time: 'Week 3', cash: 1050, card: 1550, other: 260, net: 2860, timestamp: 2 },
    { time: 'Week 4', cash: 1200, card: 1680, other: 290, net: 3170, timestamp: 3 },
  ];
}

export function DemoSalesTrendChart({
  shiftOpen,
  startedAt,
  sales,
  cashSales,
  cardSales,
  otherSales,
}: {
  shiftOpen: boolean;
  startedAt: number | null;
  sales: DemoSale[];
  cashSales: number;
  cardSales: number;
  otherSales: number;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>(shiftOpen ? 'live' : 'lastShift');
  const [visible, setVisible] = useState<Visible>({
    net: true,
    cash: true,
    card: true,
    other: true,
  });
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // Sync default mode when shift opens/closes
  useEffect(() => {
    if (shiftOpen) setViewMode('live');
    else if (viewMode === 'live') setViewMode('lastShift');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftOpen]);

  const data = useMemo((): Point[] => {
    if (viewMode === 'live') {
      const live = buildLiveSeries(sales, startedAt);
      if (live.length > 0) return live;
      // Open shift but no sales yet — flat zero baseline with a couple of ticks
      if (shiftOpen) {
        const now = Date.now();
        return [
          {
            time: formatAxisTime(startedAt ?? now),
            cash: 0,
            card: 0,
            other: 0,
            net: 0,
            timestamp: startedAt ?? now,
          },
          {
            time: formatAxisTime(now),
            cash: cashSales,
            card: cardSales,
            other: otherSales,
            net: cashSales + cardSales + otherSales,
            timestamp: now,
          },
        ];
      }
      return [];
    }
    if (viewMode === 'lastShift') return seedLastShift();
    if (viewMode === 'last7Days') return seedLast7Days();
    return seedLast30Days();
  }, [viewMode, sales, startedAt, shiftOpen, cashSales, cardSales, otherSales]);

  const maxY = useMemo(() => {
    let m = 0;
    for (const p of data) {
      if (visible.net) m = Math.max(m, p.net);
      if (visible.cash) m = Math.max(m, p.cash);
      if (visible.card) m = Math.max(m, p.card);
      if (visible.other) m = Math.max(m, p.other);
    }
    return niceCeil(m || 10);
  }, [data, visible]);

  /**
   * POS y-axis: 5 ticks via Math.round(min + i * step) with 4 divisions
   * e.g. max 10 → 10, 8, 5, 3, 0 (not 10/7.5/5/2.5/0).
   */
  const yTicks = useMemo(() => {
    const minY = 0;
    const divisions = 4;
    const step = (maxY - minY) / divisions;
    const labels: number[] = [];
    for (let i = divisions; i >= 0; i--) {
      labels.push(Math.round(minY + i * step));
    }
    return labels;
  }, [maxY]);

  // SVG layout — side pad for first/last x labels (POS domainPadding)
  const W = 480;
  const H = 160;
  const padL = 10;
  const padR = 18;
  const padT = 10;
  const padB = 4;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toX = (i: number) =>
    padL + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const toY = (v: number) => padT + plotH - (Math.max(0, v) / maxY) * plotH;

  /** % left within plot box — matches SVG x so labels sit under each point */
  const xLabelLeftPct = (i: number) => `${(toX(i) / W) * 100}%`;
  /** % top within plot box — matches SVG y for axis ticks */
  const yLabelTopPct = (v: number) => `${(toY(v) / H) * 100}%`;
  const xLabels = useMemo(() => sparseXLabels(data.map((p) => p.time)), [data]);

  const formatYTick = (t: number) => {
    if (Math.abs(t) >= 1000) {
      const k = t / 1000;
      return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
    }
    return String(t);
  };

  const lastShiftData = useMemo(() => seedLastShift(), []);
  const toBaselineX = (i: number) =>
    padL + (lastShiftData.length <= 1 ? plotW / 2 : (i / (lastShiftData.length - 1)) * plotW);

  const baselinePathForLastShift = () => {
    return lastShiftData
      .map((p, i) => {
        return `${i === 0 ? 'M' : 'L'} ${toBaselineX(i).toFixed(1)} ${toY(p.net).toFixed(1)}`;
      })
      .join(' ');
  };

  const pathFor = (key: 'net' | 'cash' | 'card' | 'other') => {
    if (data.length === 0) return '';
    return data
      .map((p, i) => {
        const v = key === 'net' ? p.net : key === 'cash' ? p.cash : key === 'card' ? p.card : p.other;
        return `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(v).toFixed(1)}`;
      })
      .join(' ');
  };

  const areaFor = (key: 'net') => {
    if (data.length === 0) return '';
    const line = pathFor(key);
    const last = toX(data.length - 1);
    const first = toX(0);
    return `${line} L ${last.toFixed(1)} ${toY(0).toFixed(1)} L ${first.toFixed(1)} ${toY(0).toFixed(1)} Z`;
  };

  const selected = selectedIdx != null ? data[selectedIdx] : null;

  const modes: { id: ViewMode; label: string; sub: string; live?: boolean }[] = [
    ...(shiftOpen ? [{ id: 'live' as const, label: 'Live', sub: 'Shift in progress', live: true }] : []),
    { id: 'lastShift', label: 'Last Shift', sub: 'Previous' },
    { id: 'last7Days', label: 'Last 7 Days', sub: 'Week' },
    { id: 'last30Days', label: 'Last 30 Days', sub: 'Month' },
  ];

  const toggle = (k: keyof Visible) =>
    setVisible((v) => ({ ...v, [k]: !v[k] }));

  const legend: { key: keyof Visible; label: string; color: string }[] = [
    { key: 'net', label: 'Net Sales', color: COLORS.net },
    { key: 'cash', label: 'Cash Sales', color: COLORS.cash },
    { key: 'card', label: 'Card Sales', color: COLORS.card },
    { key: 'other', label: 'Other Payments', color: COLORS.other },
  ];

  return (
    /* POS SalesTrendChartCard: theme.backgroundSecondary #F4F5F7, border #E2E8F0 */
    <div className="relative flex h-full min-h-0 flex-col rounded-xl border border-[#E2E8F0] bg-[#F4F5F7] p-3 dark:border-white/10 dark:bg-mintcom-dark sm:p-4">
      {/* Header with Title & Modern Segmented Capsule Filter (matching SalesTrendChartCard.tsx) */}
      <div className="relative mb-2 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <TrendingUp size={16} className="text-mintcom-green shrink-0" />
          <p className="font-sans text-[14px] font-bold text-text-primary dark:text-white">
            Sales Trend
          </p>
        </div>

        {/* Modern Segmented Capsule Filter */}
        <div className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border border-gray-200 bg-black/[0.04] p-1 dark:border-white/8 dark:bg-white/[0.06]">
          {modes.map((m) => {
            const on = viewMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setViewMode(m.id);
                  setSelectedIdx(null);
                }}
                className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all ${
                  on
                    ? 'border border-black/5 bg-white text-mintcom-green shadow-xs dark:border-white/10 dark:bg-mintcom-surface'
                    : 'text-text-secondary hover:text-text-primary dark:text-mintcom-textSecondary dark:hover:text-white'
                }`}
              >
                {m.live && (
                  <span className="h-1.5 w-1.5 rounded-full bg-mintcom-green animate-pulse" />
                )}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart body — min height protects Y-tick spacing on short phone plots */}
      <div className="relative flex min-h-[150px] flex-1 gap-1">
        {data.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <TrendingUp size={36} className="mb-2 text-gray-300 dark:text-mintcom-gray" />
            <p className="text-[11px] font-bold text-text-secondary">
              {viewMode === 'live' ? 'No live sales yet. Ring a sale to populate the chart' : 'No data for this range'}
            </p>
          </div>
        ) : (
          <>
            {/*
              Y-axis column height matches plot only (not x-label row),
              so ticks line up with dashed grid like POS Skia chart.
            */}
            <div className="flex w-9 shrink-0 flex-col sm:w-10">
              <div className="relative min-h-0 flex-1">
                {yTicks.map((t, idx) => (
                  <span
                    key={`y-${idx}-${t}`}
                    className="absolute end-0 -translate-y-1/2 pe-1.5 text-[10px] font-medium tabular-nums leading-none text-[#6B7280] dark:text-mintcom-textSecondary"
                    style={{ top: yLabelTopPct(t) }}
                  >
                    {formatYTick(t)}
                  </span>
                ))}
              </div>
              {/* "Sales" sits under 0, level with x-label row — POS axis title */}
              <span className="h-4 shrink-0 pe-1.5 pt-0.5 text-end text-[9px] font-medium leading-none text-[#6B7280] dark:text-mintcom-textSecondary">
                Sales
              </span>
            </div>

            {/* Plot + x labels under dots — horizontally scrollable like POS when many points.
                ≤8 points use tighter spacing so a week fits phones without scrolling. */}
            <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-x-auto overflow-y-hidden overscroll-contain">
              <div
                className="flex h-full min-h-0 flex-1 flex-col"
                style={{ width: `max(100%, ${Math.max(260, (data.length - 1) * (data.length > 8 ? 56 : 40) + 40)}px)` }}
              >
                <div className="relative min-h-0 flex-1">
                  <svg
                  viewBox={`0 0 ${W} ${H}`}
                  className="h-full w-full"
                  preserveAspectRatio="none"
                >
                  {/* Dashed horizontal grid — POS yAxis linePathEffect DashPathEffect [5,5] */}
                  {yTicks.map((t, idx) => (
                    <line
                      key={`g-${idx}-${t}`}
                      x1={padL}
                      x2={W - padR}
                      y1={toY(t)}
                      y2={toY(t)}
                      stroke="#C5C9D3"
                      strokeWidth={1}
                      strokeDasharray="5 5"
                      vectorEffect="non-scaling-stroke"
                      className="dark:stroke-white/15"
                    />
                  ))}
                  {/* Light vertical axis spine (POS chart left edge) */}
                  <line
                    x1={padL}
                    x2={padL}
                    y1={padT}
                    y2={padT + plotH}
                    stroke="#C5C9D3"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    className="dark:stroke-white/15"
                  />

                  {/* Faded Last Shift comparison line (when viewing Live) */}
                  {viewMode === 'live' && shiftOpen && (
                    <path
                      d={baselinePathForLastShift()}
                      fill="none"
                      stroke={COLORS.cash}
                      strokeWidth={1.8}
                      strokeDasharray="4 4"
                      opacity={0.35}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* Net area fill */}
                  {visible.net && (
                    <path d={areaFor('net')} fill="url(#netFill)" opacity={0.25} />
                  )}
                  <defs>
                    <linearGradient id="netFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS.net} stopOpacity="0.5" />
                      <stop offset="100%" stopColor={COLORS.net} stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {visible.other && (
                    <path
                      d={pathFor('other')}
                      fill="none"
                      stroke={COLORS.other}
                      strokeWidth={2.2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {visible.card && (
                    <path
                      d={pathFor('card')}
                      fill="none"
                      stroke={COLORS.card}
                      strokeWidth={2.2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {visible.cash && (
                    <path
                      d={pathFor('cash')}
                      fill="none"
                      stroke={COLORS.cash}
                      strokeWidth={2.2}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                  {visible.net && (
                    <path
                      d={pathFor('net')}
                      fill="none"
                      stroke={COLORS.net}
                      strokeWidth={2.6}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}

                  {/* Dots */}
                  {data.map((p, i) => {
                    const on = selectedIdx === i;
                    return (
                      <g key={p.timestamp}>
                        {visible.net && (
                          <circle
                            cx={toX(i)}
                            cy={toY(p.net)}
                            r={on ? 5 : 3.5}
                            fill={COLORS.net}
                            stroke="#fff"
                            strokeWidth={on ? 2 : 1.5}
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Hit zones */}
                <div className="absolute inset-0 flex">
                  {data.map((p, i) => (
                    <button
                      key={p.timestamp}
                      type="button"
                      onClick={() => setSelectedIdx(i === selectedIdx ? null : i)}
                      className="h-full flex-1"
                      aria-label={`Point ${p.time}`}
                    />
                  ))}
                </div>
              </div>

              {/*
                X labels positioned by the same % as SVG points (toX/W),
                so each tick sits under its dot — not equal flex cells.
                Matches POS Skia formatXLabel + sparse first/last/step.
              */}
              <div className="relative mt-1 h-4 w-full shrink-0">
                {data.map((p, i) => {
                  const label = xLabels[i];
                  if (!label) return null;
                  const isFirst = i === 0;
                  const isLast = i === data.length - 1;
                  return (
                    <span
                      key={p.timestamp}
                      className="absolute top-0 whitespace-nowrap text-[9px] font-semibold tabular-nums text-text-tertiary"
                      style={{
                        left: xLabelLeftPct(i),
                        transform: isFirst
                          ? 'translateX(0%)'
                          : isLast
                            ? 'translateX(-100%)'
                            : 'translateX(-50%)',
                      }}
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            </div>
            </div>
          </>
        )}
      </div>

      <p className="mt-0.5 shrink-0 text-center text-[9px] font-bold uppercase tracking-wider text-text-tertiary">
        Time
      </p>

      {/* Interactive Legend (matching SalesTrendChartCard.tsx) — single scrollable row so the plot keeps its height */}
      <div className="mt-2 flex shrink-0 flex-nowrap items-center justify-start gap-x-2 overflow-x-auto overscroll-contain pb-0.5 sm:justify-center">
        {legend.map((l) => (
          <button
            key={l.key}
            type="button"
            onClick={() => toggle(l.key)}
            className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-semibold transition-all ${
              visible[l.key] ? 'text-text-secondary dark:text-mintcom-textSecondary' : 'opacity-35 line-through'
            }`}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ background: visible[l.key] ? l.color : '#d1d5db' }}
            />
            {l.label}
          </button>
        ))}
        {viewMode === 'live' && shiftOpen && (
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-text-tertiary opacity-60">
            <span className="h-0.5 w-3 border-t border-dashed" style={{ borderColor: COLORS.cash }} />
            <span>Prev Shift (Net)</span>
          </div>
        )}
      </div>

      {/* Point tooltip */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-3 bottom-14 z-10 max-h-[45%] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-mintcom-surface sm:inset-x-auto sm:end-3 sm:start-auto sm:w-52"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold dark:text-white">
                <Clock size={12} className="text-text-tertiary" />
                {selected.time}
              </span>
              <button type="button" onClick={() => setSelectedIdx(null)} aria-label="Close details" className="flex h-11 w-11 items-center justify-center rounded-xl text-text-tertiary">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1 text-[11px]">
              {visible.net && (
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1 text-text-tertiary">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS.net }} />
                    Net
                  </span>
                  <span className="font-black text-mintcom-green">{money(selected.net)}</span>
                </div>
              )}
              {visible.cash && (
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1 text-text-tertiary">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS.cash }} />
                    Cash
                  </span>
                  <span className="font-bold dark:text-white">{money(selected.cash)}</span>
                </div>
              )}
              {visible.card && (
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1 text-text-tertiary">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS.card }} />
                    Card
                  </span>
                  <span className="font-bold dark:text-white">{money(selected.card)}</span>
                </div>
              )}
              {visible.other && (
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1 text-text-tertiary">
                    <span className="h-2 w-2 rounded-full" style={{ background: COLORS.other }} />
                    Other
                  </span>
                  <span className="font-bold dark:text-white">{money(selected.other)}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

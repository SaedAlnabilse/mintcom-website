import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { FullPosPlayground } from '../components/FullPosPlayground';

/**
 * Try POS — static iPad UI.
 *
 * The POS app always renders at a fixed design size (same cards, same layout).
 * We only scale that canvas to fit the glass.
 *
 * Entry: /try-pos
 */

/** Fixed POS “screen” — landscape tablet. Layouts assume this size. */
const DESIGN_W = 1100;
const DESIGN_H = 720;
const DESIGN_ASPECT = DESIGN_W / DESIGN_H;

const MAX_FRAME_W = 2560;

/** Outer metal ring (matches padding: 2.5 on the chrome shell). */
const METAL_PAD = 2.5;

function bezelPx(deviceW: number) {
  return Math.round(Math.min(22, Math.max(10, deviceW * 0.018)));
}

/**
 * Size the outer iPad so the glass matches DESIGN_W × DESIGN_H aspect.
 * Then fill scale paints the POS edge-to-edge — no gutters, no crop.
 */
function fitFrame(availW: number, availH: number) {
  const outerFor = (outerW: number) => {
    const bezel = bezelPx(outerW);
    const glassW = outerW - 2 * METAL_PAD - 2 * bezel;
    if (glassW < 200) return null;
    const glassH = glassW / DESIGN_ASPECT;
    const outerH = glassH + 2 * METAL_PAD + 2 * bezel;
    return { w: outerW, h: outerH };
  };

  let lo = 280;
  let hi = Math.min(availW, MAX_FRAME_W);
  let best = outerFor(Math.min(960, hi)) ?? {
    w: 960,
    h: 960 / DESIGN_ASPECT + 40,
  };

  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    const cand = outerFor(mid);
    if (cand && cand.w <= availW + 0.5 && cand.h <= availH + 0.5) {
      best = cand;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best;
}

function estimateFrameSize() {
  if (typeof window === 'undefined') {
    return { w: 1000, h: 1000 / DESIGN_ASPECT + 48 };
  }
  const padX = window.innerWidth >= 1024 ? 64 : window.innerWidth >= 640 ? 32 : 16;
  const padY = window.innerWidth >= 1024 ? 40 : window.innerWidth >= 640 ? 24 : 16;
  const header = window.innerWidth >= 640 ? 56 : 48;
  return fitFrame(
    Math.max(280, window.innerWidth - padX),
    Math.max(200, window.innerHeight - header - padY),
  );
}

function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 2 || h < 2) return;
      setSize((prev) =>
        Math.abs(prev.w - w) < 0.5 && Math.abs(prev.h - h) < 0.5 ? prev : { w, h },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, size };
}

function useFrameSize() {
  const stageRef = useRef<HTMLElement | null>(null);
  const [size, setSize] = useState(estimateFrameSize);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const next = fitFrame(el.clientWidth, el.clientHeight);
      if (next.w < 2 || next.h < 2) return;
      setSize((prev) =>
        Math.abs(prev.w - next.w) < 0.5 && Math.abs(prev.h - next.h) < 0.5 ? prev : next,
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

  return { stageRef, size };
}

/**
 * Renders children at DESIGN_W × DESIGN_H, then scales to the glass.
 *
 * - fill (tablet): scale X/Y independently so every pixel of the glass is used.
 *   With fitFrame() matching design aspect, sx ≈ sy (no visible distortion) and
 *   nothing is cropped on the right or letterboxed at the bottom.
 * - contain (phone): uniform scale, full UI visible.
 */
function StaticPosCanvas({
  className = '',
  mode = 'fill',
  children,
}: {
  className?: string;
  mode?: 'fill' | 'contain';
  children: ReactNode;
}) {
  const { ref, size } = useElementSize<HTMLDivElement>();
  const ready = size.w > 0 && size.h > 0;
  const sx = ready ? size.w / DESIGN_W : 1;
  const sy = ready ? size.h / DESIGN_H : 1;
  const transform =
    mode === 'fill'
      ? `scale(${sx}, ${sy})`
      : `scale(${Math.min(sx, sy)})`;

  return (
    <div
      ref={ref}
      className={`relative h-full w-full overflow-hidden ${className}`}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          width: DESIGN_W,
          height: DESIGN_H,
          transform,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function radiusPx(deviceW: number, outer: boolean) {
  const base = deviceW * (outer ? 0.034 : 0.028);
  return Math.round(Math.min(outer ? 42 : 36, Math.max(outer ? 18 : 14, base)));
}

export function PosDemoPage() {
  const { stageRef, size } = useFrameSize();
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsCompact(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const bezel = bezelPx(size.w);
  const outerR = radiusPx(size.w, true);
  const innerR = radiusPx(size.w, false);
  const glassR = Math.max(10, Math.round(innerR * 0.45));

  const pos = (
    <div className="h-full w-full">
      <FullPosPlayground mobile={isCompact} />
    </div>
  );

  const demoAppSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Mintcom POS',
    operatingSystem: 'All',
    applicationCategory: 'BusinessApplication',
    description: 'Cloud point-of-sale software for retail, hospitality, and shift management.',
    url: 'https://mintcompos.com/try-pos',
    image: 'https://mintcompos.com/og-image.png',
    offers: {
      '@type': 'Offer',
      price: '0.00',
      priceCurrency: 'USD',
      description: 'Free interactive point-of-sale demo',
    },
  };

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-[#070A10] font-sans text-white select-none">
      <Helmet>
        <title>Try Mintcom POS · Free interactive demo</title>
        <meta
          name="description"
          content="Try a full Mintcom POS experience free: clock in, sell items, customize add-ons, hold orders, and take payment. No account required."
        />
        <meta property="og:title" content="Try Mintcom POS · Free interactive demo" />
        <meta
          property="og:description"
          content="Run a real sale in the Mintcom sandbox. No login required."
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="index,follow" />
        <script type="application/ld+json">{JSON.stringify(demoAppSchema)}</script>
      </Helmet>

      <header className="relative z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#0A0E17]/90 px-3 backdrop-blur-md sm:h-14 sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98] sm:gap-2 sm:px-3 sm:text-xs"
          >
            <ArrowLeft size={13} />
            <span>Website</span>
          </Link>
          <span className="hidden text-xs text-white/15 sm:inline">|</span>
          <span className="hidden truncate text-xs font-medium text-slate-400 sm:inline">iPad Simulator</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300 sm:hidden">
            <Smartphone size={13} className="text-mintcom-green" />
            Pocket POS
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mintcom-green opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-mintcom-green" />
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 sm:text-xs">
            Interactive Demo
          </span>
        </div>
      </header>

      <main
        ref={stageRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden p-0 sm:px-4 sm:py-3 md:px-6 md:py-4 lg:px-8 lg:py-5"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 48%, rgba(125,198,162,0.07) 0%, transparent 58%), radial-gradient(ellipse 90% 80% at 50% 100%, rgba(0,0,0,0.55) 0%, transparent 55%), #070A10',
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mintcom-green/[0.06] blur-3xl"
          style={{ width: size.w * 0.75, height: size.h * 0.7 }}
        />

        {isCompact ? (
          /* Phone: render a real touch-sized POS layout instead of shrinking the tablet. */
          <div
            className="relative h-full w-full overflow-hidden bg-cream-50 shadow-2xl dark:bg-mintcom-dark"
            style={{ transform: 'translate3d(0, 0, 0)' }}
          >
            {pos}
          </div>
        ) : (
          <div
            className="relative transition-[width,height] duration-150 ease-out"
            style={{ width: size.w, height: size.h }}
          >
            <div
              className="absolute inset-0"
              style={{
                borderRadius: outerR,
                padding: 2.5,
                background:
                  'linear-gradient(145deg, #7a7a80 0%, #3a3a3c 18%, #9a9a9f 34%, #1c1c1e 52%, #5c5c60 76%, #2c2c2e 100%)',
                boxShadow: `
                  inset 0 1px 0 rgba(255,255,255,0.28),
                  inset 0 -1px 0 rgba(0,0,0,0.45),
                  0 2px 4px rgba(0,0,0,0.25),
                  0 28px 70px -10px rgba(0,0,0,0.75),
                  0 50px 100px -30px rgba(0,0,0,0.55)
                `,
              }}
            >
              <div
                aria-hidden
                className="absolute z-20"
                style={{
                  left: -3.5,
                  top: '17%',
                  width: 3.5,
                  height: '7.5%',
                  borderRadius: '2px 0 0 2px',
                  background: 'linear-gradient(90deg, #5a5a5e, #2a2a2c)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                }}
              />
              <div
                aria-hidden
                className="absolute z-20"
                style={{
                  left: -3.5,
                  top: '27%',
                  width: 3.5,
                  height: '9.5%',
                  borderRadius: '2px 0 0 2px',
                  background: 'linear-gradient(90deg, #5a5a5e, #2a2a2c)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
                }}
              />
              <div
                aria-hidden
                className="absolute z-20"
                style={{
                  right: '11%',
                  top: -3.5,
                  width: '9%',
                  height: 3.5,
                  borderRadius: '2px 2px 0 0',
                  background: 'linear-gradient(180deg, #5a5a5e, #2a2a2c)',
                  boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.12)',
                }}
              />

              <div
                className="relative flex h-full w-full flex-col"
                style={{
                  borderRadius: innerR,
                  padding: bezel,
                  background:
                    'linear-gradient(180deg, #161618 0%, #08080a 48%, #0c0c0e 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 z-30 flex items-center justify-center"
                  style={{ top: Math.max(5, bezel * 0.32) }}
                >
                  <div
                    className="relative rounded-full"
                    style={{
                      width: Math.max(5, Math.min(8, bezel * 0.35)),
                      height: Math.max(5, Math.min(8, bezel * 0.35)),
                      background:
                        'radial-gradient(circle at 32% 28%, #2a4a6e 0%, #0c1528 42%, #000 78%)',
                      boxShadow:
                        '0 0 0 1px rgba(255,255,255,0.08), inset 0 0 1.5px rgba(0,0,0,0.9)',
                    }}
                  >
                    <div className="absolute left-[15%] top-[15%] h-[30%] w-[30%] rounded-full bg-white/40" />
                  </div>
                </div>

                <div
                  className="relative min-h-0 flex-1 overflow-hidden bg-cream-50 dark:bg-mintcom-dark"
                  style={{
                    borderRadius: glassR,
                    transform: 'translate3d(0, 0, 0)',
                    boxShadow:
                      'inset 0 0 0 0.5px rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* POS fills the full glass — no fake status bar */}
                  <div className="absolute inset-0">
                    <StaticPosCanvas mode="fill">{pos}</StaticPosCanvas>
                  </div>

                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 z-30"
                    style={{
                      background:
                        'linear-gradient(125deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.015) 18%, transparent 38%, transparent 78%, rgba(255,255,255,0.012) 100%)',
                    }}
                  />

                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 bottom-1.5 z-40 flex justify-center"
                  >
                    <div className="h-1 w-28 rounded-full bg-slate-400/45 dark:bg-white/25 sm:w-32" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

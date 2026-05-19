import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  X,
  Plus,
  Minus,
  Coffee,
  Croissant,
  CupSoda,
  CreditCard,
  Banknote,
  Bell,
  Lock,
  ShieldCheck,
  Check,
  Sparkles,
  TrendingUp,
  Star,
  Sun,
  Moon,
  MapPin,
  Compass,
  Wifi,
  Signal,
  Battery,
  ChefHat,
  Wand2,
  MoreHorizontal,
  type LucideIcon,
} from 'lucide-react';
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type WorkflowFeatureId =
  | 'pointOfSale'
  | 'salesControl'
  | 'staffManagement'
  | 'advancedReporting'
  | 'production'
  | 'aiSystem'
  | 'multiBranch'
  | 'simpleUI'
  | 'fastOnboarding'
  | 'secure'
  | 'loyalty'
  | 'mobileApp';

export type WorkflowFeature = {
  id: WorkflowFeatureId;
  title: string;
  description: string;
  icon: LucideIcon;
};

type Props = {
  feature: WorkflowFeature | null;
  index: number;
  onClose: () => void;
};

// ---------------------------------------------------------------------------
// Currency / formatting helpers
// ---------------------------------------------------------------------------
const fmt = (n: number) => `$${n.toFixed(2)}`;

// ===========================================================================
// PER-FEATURE INTERACTIVE DEMOS (unchanged from before)
// ===========================================================================

// 1. POS – tap to add items, live cart total
const PosDemo = ({ t }: { t: any }) => {
  const items = [
    { id: 'esp', name: t('landing.workflow.receipt.demo.pos.espresso', 'Espresso'), price: 3.5, icon: Coffee },
    { id: 'cro', name: t('landing.workflow.receipt.demo.pos.croissant', 'Croissant'), price: 2.75, icon: Croissant },
    { id: 'soda', name: t('landing.workflow.receipt.demo.pos.soda', 'Soda'), price: 2.0, icon: CupSoda },
  ];
  const [cart, setCart] = useState<Record<string, number>>({});
  const subtotal = items.reduce((sum, i) => sum + (cart[i.id] || 0) * i.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <button
              key={it.id}
              onClick={() => setCart((c) => ({ ...c, [it.id]: (c[it.id] || 0) + 1 }))}
              className="group relative flex flex-col items-center gap-1 rounded-lg border border-dashed border-gray-300 dark:border-white/15 bg-white dark:bg-black/20 px-2 py-2.5 hover:border-mintcom-green hover:bg-mintcom-green/5 active:scale-95 transition-all"
            >
              <Icon size={18} className="text-gray-700 dark:text-gray-300 group-hover:text-mintcom-green transition-colors" />
              <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-none">{it.name}</span>
              <span className="text-[10px] font-mono text-mintcom-green">{fmt(it.price)}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1 font-mono text-[11px] pt-1">
        <AnimatePresence initial={false}>
          {items
            .filter((i) => cart[i.id])
            .map((it) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center justify-between text-gray-700 dark:text-gray-300"
              >
                <span>{cart[it.id]}× {it.name}</span>
                <span>{fmt(cart[it.id] * it.price)}</span>
              </motion.div>
            ))}
        </AnimatePresence>

        {subtotal === 0 && (
          <div className="text-center text-[10px] uppercase tracking-widest text-gray-400 py-2">
            {t('landing.workflow.receipt.demo.pos.tap', 'Tap an item to add')}
          </div>
        )}

        {subtotal > 0 && (
          <div className="pt-1.5 mt-1 border-t border-dashed border-gray-300 dark:border-white/15 space-y-0.5">
            <div className="flex justify-between text-gray-500">
              <span>{t('landing.workflow.receipt.demo.pos.subtotal', 'Subtotal')}</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>{t('landing.workflow.receipt.demo.pos.taxLine', 'Tax 8%')}</span>
              <span>{fmt(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-mintcom-green pt-0.5">
              <span>{t('landing.workflow.receipt.demo.pos.totalLine', 'Total')}</span>
              <span>{fmt(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 2. Sales Control – payment method picker + tax slider
const SalesControlDemo = ({ t }: { t: any }) => {
  const methods = [
    { id: 'cash', label: t('landing.workflow.receipt.demo.sales.cash', 'Cash'), icon: Banknote },
    { id: 'card', label: t('landing.workflow.receipt.demo.sales.card', 'Card'), icon: CreditCard },
    { id: 'others', label: t('landing.workflow.receipt.demo.sales.others', 'Others'), icon: MoreHorizontal },
  ];
  const [method, setMethod] = useState('card');
  const [tax, setTax] = useState(8);
  const subtotal = 24.5;
  const total = subtotal * (1 + tax / 100);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1.5">
        {methods.map((m) => {
          const Icon = m.icon;
          const active = method === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-2 transition-all ${
                active
                  ? 'border-mintcom-green bg-mintcom-green/10'
                  : 'border-dashed border-gray-300 dark:border-white/15 hover:border-mintcom-green/50'
              }`}
            >
              <Icon size={18} className={active ? 'text-mintcom-green' : 'text-gray-500'} />
              <span className={`text-[10px] font-bold ${active ? 'text-mintcom-green' : 'text-gray-600 dark:text-gray-400'}`}>
                {m.label}
              </span>
            </button>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-gray-600 dark:text-gray-400">
          <span>{t('landing.workflow.receipt.demo.sales.tax', 'Tax')}</span>
          <span className="text-mintcom-green font-bold">{tax}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={20}
          value={tax}
          onChange={(e) => setTax(Number(e.target.value))}
          className="w-full accent-mintcom-green h-1"
        />
      </div>

      <div className="font-mono text-[11px] space-y-0.5 pt-1.5 border-t border-dashed border-gray-300 dark:border-white/15">
        <div className="flex justify-between text-gray-500">
          <span>{t('landing.workflow.receipt.demo.sales.subtotal', 'Subtotal')}</span>
          <span>{fmt(subtotal)}</span>
        </div>
        <div className="flex justify-between font-bold text-mintcom-green">
          <span>{t('landing.workflow.receipt.demo.sales.total', 'Charged')}</span>
          <span>{fmt(total)}</span>
        </div>
        <div className="text-[9px] uppercase tracking-widest text-gray-400 pt-0.5">
          {t('landing.workflow.receipt.demo.sales.via', 'via {{m}}', { m: methods.find((x) => x.id === method)?.label })}
        </div>
      </div>
    </div>
  );
};

// 3. Staff Management – clock-in toggles
const StaffDemo = ({ t }: { t: any }) => {
  const staff = [
    { id: 'a', name: 'Sara', role: t('landing.workflow.receipt.demo.staff.cashier', 'Cashier') },
    { id: 'b', name: 'Omar', role: t('landing.workflow.receipt.demo.staff.barista', 'Barista') },
    { id: 'c', name: 'Lina', role: t('landing.workflow.receipt.demo.staff.manager', 'Manager') },
  ];
  const [active, setActive] = useState<Record<string, boolean>>({ a: true, b: false, c: true });
  const onShift = Object.values(active).filter(Boolean).length;

  return (
    <div className="space-y-2">
      {staff.map((s) => {
        const isOn = active[s.id];
        return (
          <button
            key={s.id}
            onClick={() => setActive((a) => ({ ...a, [s.id]: !a[s.id] }))}
            className="w-full flex items-center justify-between rounded-lg border border-dashed border-gray-300 dark:border-white/15 px-3 py-2 hover:border-mintcom-green/50 transition-all"
          >
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                isOn ? 'bg-mintcom-green text-white' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
              }`}>
                {s.name[0]}
              </div>
              <div className="text-start">
                <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200 leading-tight">{s.name}</div>
                <div className="text-[9px] uppercase tracking-wider text-gray-500">{s.role}</div>
              </div>
            </div>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${isOn ? 'text-mintcom-green' : 'text-gray-400'}`}>
              {isOn ? t('landing.workflow.receipt.demo.staff.on', 'On shift') : t('landing.workflow.receipt.demo.staff.off', 'Off')}
            </span>
          </button>
        );
      })}
      <div className="text-center text-[10px] font-mono text-gray-500">
        {onShift} / {staff.length} {t('landing.workflow.receipt.demo.staff.working', 'working')}
      </div>
    </div>
  );
};

// 4. Advanced Reporting – animated bar sparkline
const ReportingDemo = ({ t }: { t: any }) => {
  const days = [
    { l: 'M', v: 65 },
    { l: 'T', v: 80 },
    { l: 'W', v: 55 },
    { l: 'T', v: 92 },
    { l: 'F', v: 100 },
    { l: 'S', v: 88 },
    { l: 'S', v: 72 },
  ];
  const total = 4892;
  const maxBarHeight = 64;
  return (
    <div className="space-y-2.5">
      <div className="flex items-end justify-between gap-1.5" style={{ height: maxBarHeight + 16 }}>
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
              style={{
                height: `${(d.v / 100) * maxBarHeight}px`,
                transformOrigin: 'bottom center',
                width: '100%',
              }}
              className="rounded-t-sm bg-gradient-to-t from-mintcom-green to-mintcom-greenLight"
            />
            <span className="text-[9px] font-mono text-gray-500 leading-none">{d.l}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between font-mono text-[11px] text-gray-700 dark:text-gray-300 pt-1 border-t border-dashed border-gray-300 dark:border-white/15">
        <span className="flex items-center gap-1">
          <TrendingUp size={11} className="text-mintcom-green" />
          {t('landing.workflow.receipt.demo.reporting.weekly', 'Weekly sales')}
        </span>
        <span className="text-mintcom-green font-bold">{fmt(total)}</span>
      </div>
    </div>
  );
};

// 5. Recipe & Cost Management – ingredient cost bars
const RecipeDemo = ({ t }: { t: any }) => {
  const ingredients = [
    { n: t('landing.workflow.receipt.demo.recipe.flour', 'Flour'), pct: 18, cost: 0.42 },
    { n: t('landing.workflow.receipt.demo.recipe.butter', 'Butter'), pct: 32, cost: 0.78 },
    { n: t('landing.workflow.receipt.demo.recipe.sugar', 'Sugar'), pct: 12, cost: 0.28 },
  ];
  const cost = ingredients.reduce((s, i) => s + i.cost, 0);
  const sell = 4.5;
  const margin = ((sell - cost) / sell) * 100;
  return (
    <div className="space-y-2">
      {ingredients.map((ing, idx) => (
        <div key={idx}>
          <div className="flex justify-between text-[10px] font-mono text-gray-700 dark:text-gray-300 mb-0.5">
            <span>{ing.n}</span>
            <span>{fmt(ing.cost)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              style={{ width: `${ing.pct * 2}%`, transformOrigin: 'left center' }}
              className="h-full bg-mintcom-green rtl:[transform-origin:right_center]"
            />
          </div>
        </div>
      ))}
      <div className="flex justify-between pt-1.5 mt-1 border-t border-dashed border-gray-300 dark:border-white/15 font-mono text-[11px]">
        <span className="text-gray-500">{t('landing.workflow.receipt.demo.recipe.margin', 'Profit margin')}</span>
        <span className="font-bold text-mintcom-green">{margin.toFixed(0)}%</span>
      </div>
    </div>
  );
};

// 6. AI System – typing assistant
const AiDemo = ({ t }: { t: any }) => {
  const prompts = [
    t('landing.workflow.receipt.demo.ai.q1', 'What sold best today?'),
    t('landing.workflow.receipt.demo.ai.q2', 'Suggest a combo deal'),
    t('landing.workflow.receipt.demo.ai.q3', 'Forecast tomorrow'),
  ];
  const answers = [
    t('landing.workflow.receipt.demo.ai.a1', 'Espresso led with 142 cups, up 18% from yesterday.'),
    t('landing.workflow.receipt.demo.ai.a2', 'Try a "Croissant + Latte" bundle at $5.50 — projects +12% basket.'),
    t('landing.workflow.receipt.demo.ai.a3', 'Expect 320–360 orders, peak 9–11 AM. Schedule 2 baristas.'),
  ];
  const [pick, setPick] = useState<number | null>(null);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (pick === null) return;
    const full = answers[pick];
    setTyped('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 18);
    return () => clearInterval(id);
  }, [pick]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => setPick(i)}
            className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
              pick === i
                ? 'bg-mintcom-green text-white border-mintcom-green'
                : 'border-dashed border-gray-300 dark:border-white/15 hover:border-mintcom-green/50 text-gray-700 dark:text-gray-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="min-h-[72px] rounded-lg bg-mintcom-green/5 border border-dashed border-mintcom-green/30 p-2.5">
        <div className="flex items-start gap-1.5">
          <Sparkles size={12} className="text-mintcom-green mt-0.5 flex-shrink-0" />
          <div className="text-[11px] font-mono text-gray-700 dark:text-gray-300 leading-snug">
            {pick === null ? (
              <span className="text-gray-400 italic">{t('landing.workflow.receipt.demo.ai.placeholder', 'Pick a prompt above')}</span>
            ) : (
              <>
                {typed}
                <span className="inline-block w-1.5 h-3 bg-mintcom-green ml-0.5 animate-pulse" />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 7. Multi-Branch – branch switcher
const MultiBranchDemo = ({ t }: { t: any }) => {
  const branches = [
    { id: 'dt', name: t('landing.workflow.receipt.demo.branch.downtown', 'Downtown'), today: 1842, staff: 6 },
    { id: 'mall', name: t('landing.workflow.receipt.demo.branch.mall', 'Mall'), today: 2310, staff: 8 },
    { id: 'air', name: t('landing.workflow.receipt.demo.branch.airport', 'Airport'), today: 3120, staff: 11 },
  ];
  const [active, setActive] = useState('mall');
  const branch = branches.find((b) => b.id === active)!;
  return (
    <div className="space-y-2.5">
      <div className="flex gap-1">
        {branches.map((b) => (
          <button
            key={b.id}
            onClick={() => setActive(b.id)}
            className={`flex-1 text-[10px] px-2 py-1.5 rounded-md border-2 font-bold transition-all ${
              active === b.id
                ? 'bg-mintcom-green text-white border-mintcom-green'
                : 'border-dashed border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-400 hover:border-mintcom-green/50'
            }`}
          >
            {b.name}
          </button>
        ))}
      </div>
      <motion.div key={branch.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-1.5">
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-white/15 p-2">
          <div className="text-[9px] uppercase tracking-widest text-gray-500">{t('landing.workflow.receipt.demo.branch.today', 'Today')}</div>
          <div className="font-mono text-sm font-bold text-mintcom-green">{fmt(branch.today)}</div>
        </div>
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-white/15 p-2">
          <div className="text-[9px] uppercase tracking-widest text-gray-500">{t('landing.workflow.receipt.demo.branch.staff', 'Staff')}</div>
          <div className="font-mono text-sm font-bold text-mintcom-green">{branch.staff}</div>
        </div>
      </motion.div>
    </div>
  );
};

// 8. Simple UI – theme & density toggle preview
const SimpleUiDemo = ({ t }: { t: any }) => {
  const isDark = document.documentElement.classList.contains('dark');
  const [theme, setTheme] = useState<'light' | 'dark'>(isDark ? 'dark' : 'light');
  const [density, setDensity] = useState<'cozy' | 'compact'>('cozy');
  return (
    <div className="space-y-2.5">
      <div className="flex gap-1.5">
        <button
          onClick={() => setTheme('light')}
          className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-md border-2 ${
            theme === 'light' ? 'bg-mintcom-green text-white border-mintcom-green' : 'border-dashed border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-400'
          }`}
        >
          <Sun size={11} /> {t('landing.workflow.receipt.demo.ui.light', 'Light')}
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex-1 flex items-center justify-center gap-1 text-[10px] py-1.5 rounded-md border-2 ${
            theme === 'dark' ? 'bg-mintcom-green text-white border-mintcom-green' : 'border-dashed border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-400'
          }`}
        >
          <Moon size={11} /> {t('landing.workflow.receipt.demo.ui.dark', 'Dark')}
        </button>
      </div>
      <div className={`rounded-lg p-2 transition-all ${theme === 'dark' ? 'bg-[#0F172A] border border-white/10' : 'bg-cream-100 border border-cream-300'}`}>
        <div className={`flex items-center justify-between mb-1.5`}>
          <div className={`h-2 w-12 rounded ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'}`} />
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-mintcom-green" />
            <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'}`} />
          </div>
        </div>
        <div className={`grid ${density === 'cozy' ? 'gap-1.5 grid-cols-2' : 'gap-0.5 grid-cols-3'}`}>
          {Array.from({ length: density === 'cozy' ? 4 : 6 }).map((_, i) => (
            <div key={i} className={`h-3 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => setDensity('cozy')}
          className={`flex-1 text-[10px] py-1 rounded-md border ${
            density === 'cozy' ? 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green' : 'border-dashed border-gray-300 dark:border-white/15 text-gray-500'
          }`}
        >
          {t('landing.workflow.receipt.demo.ui.cozy', 'Cozy')}
        </button>
        <button
          onClick={() => setDensity('compact')}
          className={`flex-1 text-[10px] py-1 rounded-md border ${
            density === 'compact' ? 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green' : 'border-dashed border-gray-300 dark:border-white/15 text-gray-500'
          }`}
        >
          {t('landing.workflow.receipt.demo.ui.compact', 'Compact')}
        </button>
      </div>
    </div>
  );
};

// 9. Fast Onboarding – self-checking checklist
const OnboardingDemo = ({ t }: { t: any }) => {
  const steps = [
    t('landing.workflow.receipt.demo.onboard.s1', 'Add staff member'),
    t('landing.workflow.receipt.demo.onboard.s2', 'Assign a role'),
    t('landing.workflow.receipt.demo.onboard.s3', 'Run first sale'),
    t('landing.workflow.receipt.demo.onboard.s4', 'Ready to go'),
  ];
  const [done, setDone] = useState<boolean[]>([false, false, false, false]);
  const progress = (done.filter(Boolean).length / steps.length) * 100;
  return (
    <div className="space-y-2">
      <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
          className="h-full bg-mintcom-green"
        />
      </div>
      {steps.map((s, i) => (
        <button
          key={i}
          onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
          className="w-full flex items-center gap-2 text-start"
        >
          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
            done[i] ? 'bg-mintcom-green border-mintcom-green' : 'border-gray-300 dark:border-white/20'
          }`}>
            {done[i] && <Check size={10} className="text-white" strokeWidth={3} />}
          </div>
          <span className={`text-[11px] ${done[i] ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {s}
          </span>
        </button>
      ))}
    </div>
  );
};

// 10. Secure & Reliable – security checks
const SecureDemo = ({ t }: { t: any }) => {
  const checks = [
    t('landing.workflow.receipt.demo.secure.c1', 'Encrypted backups'),
    t('landing.workflow.receipt.demo.secure.c2', '2-factor auth'),
    t('landing.workflow.receipt.demo.secure.c3', 'Role-based access'),
    t('landing.workflow.receipt.demo.secure.c4', '99.9% uptime'),
  ];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg bg-mintcom-green/5 border border-dashed border-mintcom-green/30 p-2">
        <motion.div
          animate={{ rotate: [0, -8, 8, -8, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.5 }}
        >
          <Lock size={16} className="text-mintcom-green" />
        </motion.div>
        <div>
          <div className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{t('landing.workflow.receipt.demo.secure.protected', 'Protected')}</div>
          <div className="text-[9px] uppercase tracking-widest text-mintcom-green">{t('landing.workflow.receipt.demo.secure.live', 'Live')}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {checks.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-1 text-[10px] text-gray-700 dark:text-gray-300"
          >
            <ShieldCheck size={11} className="text-mintcom-green flex-shrink-0" />
            <span className="leading-tight">{c}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 11. Loyalty – animated points counter
const LoyaltyDemo = ({ t }: { t: any }) => {
  const tiers = [
    { name: t('landing.workflow.receipt.demo.loyalty.bronze', 'Bronze'), at: 0 },
    { name: t('landing.workflow.receipt.demo.loyalty.silver', 'Silver'), at: 500 },
    { name: t('landing.workflow.receipt.demo.loyalty.gold', 'Gold'), at: 1000 },
  ];
  const [points, setPoints] = useState(420);
  const tier = tiers.slice().reverse().find((tt) => points >= tt.at) || tiers[0];
  const nextTier = tiers.find((tt) => points < tt.at);
  const progress = nextTier ? (points / nextTier.at) * 100 : 100;
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[9px] uppercase tracking-widest text-gray-500">{t('landing.workflow.receipt.demo.loyalty.tier', 'Tier')}</div>
          <div className="flex items-center gap-1 text-mintcom-green font-bold text-sm">
            <Star size={12} fill="currentColor" /> {tier.name}
          </div>
        </div>
        <motion.div
          key={points}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-mono font-bold text-gray-900 dark:text-white"
        >
          {points}
        </motion.div>
      </div>
      <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          className="h-full bg-gradient-to-r from-mintcom-greenLight to-mintcom-green"
        />
      </div>
      <div className="flex items-center justify-between gap-1.5">
        <button
          onClick={() => setPoints((p) => Math.max(0, p - 100))}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded-md border border-dashed border-gray-300 dark:border-white/15 hover:border-mintcom-green text-gray-600 dark:text-gray-400"
        >
          <Minus size={10} /> {t('landing.workflow.receipt.demo.loyalty.redeem', 'Redeem')}
        </button>
        <button
          onClick={() => setPoints((p) => Math.min(1500, p + 100))}
          className="flex-1 flex items-center justify-center gap-1 text-[10px] py-1 rounded-md bg-mintcom-green text-white font-bold"
        >
          <Plus size={10} /> {t('landing.workflow.receipt.demo.loyalty.earn', 'Earn 100')}
        </button>
      </div>
    </div>
  );
};

// 12. Mobile App – live notifications
const MobileDemo = ({ t }: { t: any }) => {
  const messages = useMemo(
    () => [
      t('landing.workflow.receipt.demo.mobile.n1', 'New order #4218 — $24.50'),
      t('landing.workflow.receipt.demo.mobile.n2', 'Daily target reached 🎉'),
      t('landing.workflow.receipt.demo.mobile.n3', 'Low stock: Espresso beans'),
      t('landing.workflow.receipt.demo.mobile.n4', 'Sara clocked in'),
    ],
    [t]
  );
  const [head, setHead] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHead((h) => (h + 1) % messages.length);
    }, 2400);
    return () => clearInterval(id);
  }, [messages.length]);

  const visible = [0, 1, 2].map((offset) => ({
    text: messages[(head + offset) % messages.length],
    offset,
  }));

  return (
    <div className="space-y-1.5">
      {visible.map((item, idx) => (
        <motion.div
          key={item.text + '-' + idx}
          initial={idx === 0 ? { opacity: 0, y: -10, scale: 0.95 } : false}
          animate={{ opacity: 1 - item.offset * 0.25, y: 0, scale: 1 }}
          transition={{ duration: 0.35 }}
          className="flex items-start gap-2 rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 shadow-sm px-2.5 py-2 h-[44px]"
        >
          <div className="w-6 h-6 rounded-md bg-mintcom-green/15 flex items-center justify-center flex-shrink-0">
            <Bell size={11} className="text-mintcom-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200 leading-tight">Mintcom</div>
            <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate leading-tight">{item.text}</div>
          </div>
          <div className="text-[9px] font-mono text-gray-400">now</div>
        </motion.div>
      ))}
    </div>
  );
};

// ===========================================================================
// SHARED FRAME PIECES
// ===========================================================================

// Faux barcode (CSS only)
const Barcode = ({ seed }: { seed: string }) => {
  const bars = useMemo(() => {
    const hashBar = (index: number) => {
      let hash = index + 1;
      for (let i = 0; i < seed.length; i += 1) {
        hash = Math.imul(hash ^ seed.charCodeAt(i), 1103515245) + 12345;
      }
      return hash >>> 0;
    };

    return Array.from({ length: 38 }, (_, i) => {
      const h = hashBar(i);
      const w = 1 + (h % 4);
      const tall = (h >> 4) % 5 !== 0;
      return { key: i, w, tall };
    });
  }, [seed]);
  return (
    <div className="flex items-end gap-[2px] h-9">
      {bars.map((b) => (
        <div
          key={b.key}
          style={{ width: b.w }}
          className={`bg-gray-900 dark:bg-white ${b.tall ? 'h-full' : 'h-3/4'}`}
        />
      ))}
    </div>
  );
};

const MintcomMark = ({ size = 'md' }: { size?: 'sm' | 'md' }) => (
  <>
    <img
      src={MintcomLogoGreen}
      alt="Mintcom"
      className={`${size === 'sm' ? 'h-5' : 'h-7'} w-auto object-contain dark:hidden`}
    />
    <img
      src={MintcomLogoWhite}
      alt="Mintcom"
      className={`hidden ${size === 'sm' ? 'h-5' : 'h-7'} w-auto object-contain dark:block`}
    />
  </>
);

// Section: feature title + description (used inside each frame)
const FeatureMeta = ({ feature, t }: { feature: WorkflowFeature; t: any }) => (
  <div>
    <div className="flex items-start gap-3">
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
        className="w-11 h-11 rounded-xl bg-mintcom-green/10 dark:bg-mintcom-green/15 flex items-center justify-center flex-shrink-0"
      >
        <feature.icon size={20} className="text-mintcom-green" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <div className="text-[9px] uppercase tracking-[0.2em] text-gray-500">
          {t('landing.workflow.receipt.feature', 'Feature')}
        </div>
        <h3 className="font-bold text-base leading-tight tracking-tight text-gray-900 dark:text-white">
          {feature.title}
        </h3>
      </div>
    </div>
    <p className="mt-3 text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">
      {feature.description}
    </p>
  </div>
);

const TryItDivider = ({ t }: { t: any }) => (
  <div className="my-4 flex items-center gap-2">
    <div className="flex-1 border-t border-dashed border-gray-300 dark:border-white/15" />
    <span className="text-[9px] uppercase tracking-widest text-gray-400">
      {t('landing.workflow.receipt.tryIt', 'Try it')}
    </span>
    <div className="flex-1 border-t border-dashed border-gray-300 dark:border-white/15" />
  </div>
);

// Generic frame container (paper-feel, used by several frames)
const PaperFrame = ({ children, dark = false }: { children: ReactNode; dark?: boolean }) => (
  <div
    className={`relative ${
      dark ? 'bg-[#161616]' : 'bg-cream-50 dark:bg-[#161616]'
    } text-gray-900 dark:text-gray-100 shadow-2xl shadow-black/40 rounded-2xl overflow-hidden`}
  >
    {children}
  </div>
);

// ===========================================================================
// 12 UNIQUE FRAMES — one per feature
// ===========================================================================

type FrameProps = { feature: WorkflowFeature; index: number; t: any };

// 1) POS — Thermal receipt (with tear-off, barcode, SKU)
const PosReceiptFrame = ({ feature, index, t }: FrameProps) => {
  const num = String(1000 + index).padStart(4, '0');
  const sku = `MNT-POS-${num}`;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = new Date().toLocaleDateString();
  return (
    <div className="relative bg-cream-50 dark:bg-[#161616] text-gray-900 dark:text-gray-100 shadow-2xl shadow-black/40 rounded-t-md overflow-hidden">
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(circle_at_20%_10%,_#000_0,_transparent_45%),radial-gradient(circle_at_80%_30%,_#000_0,_transparent_40%)]" />
      <div className="relative px-6 pt-6 pb-5 font-barlow">
        <div className="text-center">
          <div className="inline-flex items-center justify-center"><MintcomMark /></div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mt-2">
            {t('landing.workflow.receipt.frame.pos', 'Sales receipt')}
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-gray-500">
          <span>#{num}</span><span>{date}</span><span>{time}</span>
        </div>
        <div className="my-4 border-t border-dashed border-gray-300 dark:border-white/15" />
        <FeatureMeta feature={feature} t={t} />
        <TryItDivider t={t} />
        <PosDemo t={t} />
        <div className="my-4 border-t border-dashed border-gray-300 dark:border-white/15" />
        <div className="space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-gray-500"><span>{t('landing.workflow.receipt.sku', 'SKU')}</span><span>{sku}</span></div>
          <div className="flex justify-between text-gray-500"><span>{t('landing.workflow.receipt.cashier', 'Cashier')}</span><span>Mintcom</span></div>
        </div>
        <div className="mt-5 flex flex-col items-center gap-1">
          <Barcode seed={sku} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-gray-500">{sku}</span>
        </div>
        <div className="mt-4 text-center">
          <div className="text-[10px] uppercase tracking-[0.25em] text-mintcom-green font-bold">
            {t('landing.workflow.receipt.thanks', 'Thank you')}
          </div>
        </div>
      </div>
      {/* Tear-off serrated edge */}
      <div className="relative h-3 -mt-px">
        <div
          className="absolute inset-x-0 -bottom-px h-3"
          style={{
            backgroundColor: 'var(--receipt-bg, #FEFDFB)',
            WebkitMaskImage: 'radial-gradient(circle at 6px 0, transparent 5px, black 5.5px)',
            maskImage: 'radial-gradient(circle at 6px 0, transparent 5px, black 5.5px)',
            WebkitMaskSize: '12px 12px',
            maskSize: '12px 12px',
            WebkitMaskRepeat: 'repeat-x',
            maskRepeat: 'repeat-x',
          }}
        />
      </div>
    </div>
  );
};

// 2) Sales Control — Credit card on top + transaction approved
const PaymentCardFrame = ({ feature, index, t }: FrameProps) => {
  const num = `**** **** **** ${4000 + index}`;
  return (
    <PaperFrame>
      <div className="relative px-6 pt-6 pb-6 font-barlow">
        {/* Credit card */}
        <div className="relative h-[120px] rounded-2xl bg-gradient-to-br from-mintcom-green to-mintcom-greenDark text-white p-4 overflow-hidden shadow-lg">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute -right-12 top-8 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-[0.25em] font-bold">
              {t('landing.workflow.receipt.frame.salesCard', 'Mintcom Pay')}
            </div>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-full bg-white/40" />
              <div className="w-3 h-3 rounded-full bg-white/70 -ml-1.5" />
            </div>
          </div>
          <div className="relative mt-3 flex items-center gap-2">
            <div className="w-7 h-5 rounded-sm bg-gradient-to-br from-amber-200 to-amber-400" />
            <div className="flex flex-col gap-0.5">
              <div className="w-1 h-1 rounded-full bg-white/60" />
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <div className="w-1 h-1 rounded-full bg-white/60" />
            </div>
          </div>
          <div className="relative mt-3 font-mono text-[14px] tracking-[0.25em] font-bold">{num}</div>
          <div className="relative mt-2 flex items-end justify-between text-[9px] uppercase tracking-widest">
            <div>
              <div className="opacity-70 text-[8px]">{t('landing.workflow.receipt.frame.cardholder', 'Cardholder')}</div>
              <div className="font-bold">Mintcom Merchant</div>
            </div>
            <div className="font-mono">12/29</div>
          </div>
        </div>

        <div className="mt-5"><FeatureMeta feature={feature} t={t} /></div>
        <TryItDivider t={t} />
        <SalesControlDemo t={t} />

        <div className="mt-5 flex items-center justify-between rounded-lg bg-mintcom-green/10 border border-mintcom-green/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-mintcom-green" strokeWidth={3} />
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-mintcom-green">
              {t('landing.workflow.receipt.frame.approved', 'Transaction approved')}
            </div>
          </div>
          <div className="font-mono text-[10px] text-gray-500">AUTH #4{index}82</div>
        </div>
      </div>
    </PaperFrame>
  );
};

// 3) Staff — Employee ID badge with lanyard hole
const BadgeFrame = ({ feature, index, t }: FrameProps) => (
  <div className="relative">
    <PaperFrame>
      {/* Lanyard hole + clip */}
      <div className="relative h-6 bg-mintcom-green flex items-center justify-center">
        <div className="w-12 h-3 rounded-full bg-cream-50 dark:bg-[#161616] ring-2 ring-mintcom-greenDark/40" />
      </div>
      <div className="relative px-6 pt-5 pb-6 font-barlow">
        <div className="flex items-center justify-between">
          <div className="text-[9px] uppercase tracking-[0.25em] font-bold text-mintcom-green">
            {t('landing.workflow.receipt.frame.staffBadge', 'Employee badge')}
          </div>
          <div className="font-mono text-[10px] text-gray-500">EMP-{1000 + index}</div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-mintcom-green/30 to-mintcom-green/10 border border-mintcom-green/30 flex items-center justify-center">
            <feature.icon size={22} className="text-mintcom-green" />
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-gray-500">
              {t('landing.workflow.receipt.frame.role', 'Role')}
            </div>
            <h3 className="font-bold text-base leading-tight tracking-tight text-gray-900 dark:text-white">
              {feature.title}
            </h3>
            <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-mintcom-green/15 text-[9px] font-bold uppercase tracking-widest text-mintcom-green">
              <span className="w-1 h-1 rounded-full bg-mintcom-green animate-pulse" />
              {t('landing.workflow.receipt.frame.active', 'Active')}
            </div>
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">
          {feature.description}
        </p>

        <TryItDivider t={t} />
        <StaffDemo t={t} />

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-dashed border-gray-300 dark:border-white/15">
          <MintcomMark size="sm" />
          <div className="text-[8px] uppercase tracking-[0.2em] text-gray-400">
            {t('landing.workflow.receipt.frame.issued', 'Issued by Mintcom HR')}
          </div>
        </div>
      </div>
    </PaperFrame>
  </div>
);

// 4) Reporting — Report cover sheet
const ReportFrame = ({ feature, index, t }: FrameProps) => (
  <PaperFrame>
    <div className="relative px-6 pt-6 pb-6 font-barlow">
      {/* Top stripe */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-mintcom-green via-mintcom-greenLight to-mintcom-green" />
      <div className="flex items-center justify-between">
        <MintcomMark size="sm" />
        <div className="text-[9px] uppercase tracking-[0.25em] font-bold text-gray-500">
          {t('landing.workflow.receipt.frame.report', 'Quarterly report')}
        </div>
      </div>
      <div className="mt-4 flex items-end justify-between">
        <div className="font-magilio text-3xl font-bold text-gray-900 dark:text-white leading-none">
          Q4·26
        </div>
        <div className="font-mono text-[10px] text-gray-500">RPT-{2000 + index}</div>
      </div>

      <div className="my-4 border-t border-dashed border-gray-300 dark:border-white/15" />

      <FeatureMeta feature={feature} t={t} />
      <TryItDivider t={t} />
      <ReportingDemo t={t} />

      <div className="mt-5 grid grid-cols-3 gap-1.5 font-mono text-[10px]">
        <div className="rounded-md bg-mintcom-green/8 border border-mintcom-green/20 px-2 py-1.5">
          <div className="text-[8px] uppercase tracking-widest text-gray-500">YoY</div>
          <div className="text-mintcom-green font-bold">+18.4%</div>
        </div>
        <div className="rounded-md bg-mintcom-green/8 border border-mintcom-green/20 px-2 py-1.5">
          <div className="text-[8px] uppercase tracking-widest text-gray-500">Margin</div>
          <div className="text-mintcom-green font-bold">62%</div>
        </div>
        <div className="rounded-md bg-mintcom-green/8 border border-mintcom-green/20 px-2 py-1.5">
          <div className="text-[8px] uppercase tracking-widest text-gray-500">CSAT</div>
          <div className="text-mintcom-green font-bold">4.8</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-gray-400 pt-3 border-t border-dashed border-gray-300 dark:border-white/15">
        <span>{t('landing.workflow.receipt.frame.confidential', 'Confidential')}</span>
        <span>{t('landing.workflow.receipt.frame.page', 'Page 1 of 1')}</span>
      </div>
    </div>
  </PaperFrame>
);

// 5) Recipe — Index card with red top stripe (cookbook vibe)
const RecipeCardFrame = ({ feature, index, t }: FrameProps) => (
  <PaperFrame>
    <div className="relative font-barlow">
      {/* Notebook ruling top */}
      <div className="h-2 bg-mintcom-green" />
      <div className="px-6 pt-5 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ChefHat size={14} className="text-mintcom-green" />
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-mintcom-green">
              {t('landing.workflow.receipt.frame.recipe', 'Recipe card')}
            </span>
          </div>
          <div className="font-mono text-[10px] text-gray-500">№ {String(100 + index).padStart(3, '0')}</div>
        </div>
        <FeatureMeta feature={feature} t={t} />

        <div className="my-4 grid grid-cols-3 gap-1.5 text-center font-mono">
          {[
            { l: t('landing.workflow.receipt.frame.prep', 'Prep'), v: '15m' },
            { l: t('landing.workflow.receipt.frame.cook', 'Cook'), v: '20m' },
            { l: t('landing.workflow.receipt.frame.yield', 'Yield'), v: '24×' },
          ].map((s, i) => (
            <div key={i} className="rounded-md bg-mintcom-green/5 border border-dashed border-mintcom-green/30 py-1">
              <div className="text-[8px] uppercase tracking-widest text-gray-500">{s.l}</div>
              <div className="text-[12px] font-bold text-mintcom-green">{s.v}</div>
            </div>
          ))}
        </div>

        <TryItDivider t={t} />
        <RecipeDemo t={t} />
      </div>
      {/* Lined paper bottom */}
      <div
        aria-hidden
        className="h-6 opacity-30"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 7px, rgba(125,198,162,0.5) 8px, rgba(125,198,162,0.5) 8px)',
        }}
      />
    </div>
  </PaperFrame>
);

// 6) AI System — Chat application window
const ChatFrame = ({ feature, index: _index, t }: FrameProps) => (
  <PaperFrame>
    <div className="font-barlow">
      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-3 bg-mintcom-green/10 dark:bg-mintcom-green/15 border-b border-mintcom-green/20">
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8 rounded-full bg-mintcom-green flex items-center justify-center">
            <Wand2 size={14} className="text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-mintcom-green ring-2 ring-cream-50 dark:ring-[#161616]" />
          </div>
          <div>
            <div className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight">Mintcom AI</div>
            <div className="text-[9px] text-mintcom-green font-bold uppercase tracking-widest">
              {t('landing.workflow.receipt.frame.online', 'Online')}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400/70" />
          <span className="w-2 h-2 rounded-full bg-amber-400/70" />
          <span className="w-2 h-2 rounded-full bg-mintcom-green/70" />
        </div>
      </div>

      <div className="px-5 py-5">
        <FeatureMeta feature={feature} t={t} />
        <TryItDivider t={t} />
        <AiDemo t={t} />
      </div>

      <div className="px-4 py-2 border-t border-gray-200 dark:border-white/10 flex items-center gap-2 text-[10px] text-gray-400">
        <Sparkles size={10} className="text-mintcom-green" />
        <span>{t('landing.workflow.receipt.frame.aiFooter', 'Built into every Mintcom dashboard')}</span>
      </div>
    </div>
  </PaperFrame>
);

// 7) Multi-Branch — Folded paper map with compass & scale
const MapFrame = ({ feature, index: _index, t }: FrameProps) => (
  <PaperFrame>
    <div className="relative font-barlow">

      <div className="relative px-6 pt-6 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass size={14} className="text-mintcom-green" />
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-mintcom-green">
              {t('landing.workflow.receipt.frame.map', 'Branch atlas')}
            </span>
          </div>
          {/* Mini compass */}
          <div className="relative w-7 h-7 rounded-full border-2 border-mintcom-green/40 flex items-center justify-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-0.5 text-[7px] font-bold text-mintcom-green">N</div>
            <div className="w-0.5 h-3 bg-mintcom-green" />
          </div>
        </div>

        <FeatureMeta feature={feature} t={t} />

        <div className="my-4 flex items-center gap-1.5 text-[9px] text-gray-500">
          <span>0</span>
          <div className="flex-1 h-1 flex">
            <div className="flex-1 bg-mintcom-green" />
            <div className="flex-1 bg-white dark:bg-black/30 border-y border-mintcom-green" />
            <div className="flex-1 bg-mintcom-green" />
            <div className="flex-1 bg-white dark:bg-black/30 border-y border-mintcom-green" />
          </div>
          <span>5km</span>
        </div>

        <TryItDivider t={t} />
        <MultiBranchDemo t={t} />

        <div className="mt-5 flex items-center justify-between pt-3 border-t border-dashed border-gray-300 dark:border-white/15">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
            <MapPin size={11} className="text-mintcom-green" />
            <span>3 {t('landing.workflow.receipt.frame.locations', 'live locations')}</span>
          </div>
          <MintcomMark size="sm" />
        </div>
      </div>
    </div>
  </PaperFrame>
);

// 8) Simple UI — POS tablet device frame
const TabletFrame = ({ feature, t }: FrameProps) => (
  <div className="relative">
    <div className="relative bg-gray-900 dark:bg-black p-3 rounded-[28px] shadow-2xl shadow-black/40 border border-white/10">
      {/* Front camera */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <div className="w-1 h-1 rounded-full bg-white/30" />
        <div className="w-2 h-1 rounded-full bg-white/20" />
      </div>
      <div className="rounded-[20px] overflow-hidden bg-cream-50 dark:bg-[#161616]">
        <div className="px-5 pt-5 pb-5 font-barlow">
          {/* Status bar */}
          <div className="flex items-center justify-between text-[9px] text-gray-500 mb-3">
            <span className="font-mono">9:41</span>
            <div className="flex items-center gap-1">
              <Signal size={9} />
              <Wifi size={9} />
              <Battery size={11} />
            </div>
          </div>
          <FeatureMeta feature={feature} t={t} />
          <TryItDivider t={t} />
          <SimpleUiDemo t={t} />
        </div>
      </div>
      {/* Home indicator */}
      <div className="mt-3 flex justify-center">
        <div className="w-12 h-1 rounded-full bg-white/20" />
      </div>
    </div>
  </div>
);

// 9) Onboarding — Boarding pass with perforation
const BoardingPassFrame = ({ feature, index, t }: FrameProps) => (
  <PaperFrame>
    <div className="relative font-barlow">
      {/* Top brand strip */}
      <div className="px-5 py-3 bg-mintcom-green flex items-center justify-between text-white">
        <div className="text-[10px] uppercase tracking-[0.25em] font-bold">
          {t('landing.workflow.receipt.frame.boarding', 'Welcome aboard')}
        </div>
        <div className="font-mono text-[10px] opacity-90">SEAT 1A</div>
      </div>
      <div className="px-5 pt-5 pb-5">
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-gray-500">{t('landing.workflow.receipt.frame.from', 'From')}</div>
            <div className="font-mono text-[14px] font-black tracking-tight">DAY 1</div>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-1 text-mintcom-green">
              <span className="w-3 h-px bg-mintcom-green" />
              <Sparkles size={10} />
              <span className="w-3 h-px bg-mintcom-green" />
            </div>
          </div>
          <div className="text-end">
            <div className="text-[9px] uppercase tracking-widest text-gray-500">{t('landing.workflow.receipt.frame.to', 'To')}</div>
            <div className="font-mono text-[14px] font-black tracking-tight">FIRST SALE</div>
          </div>
        </div>

        <FeatureMeta feature={feature} t={t} />
        <TryItDivider t={t} />
        <OnboardingDemo t={t} />

        <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-[10px]">
          <div>
            <div className="text-[8px] uppercase tracking-widest text-gray-500">{t('landing.workflow.receipt.frame.passenger', 'Trainee')}</div>
            <div className="font-bold text-gray-800 dark:text-gray-200">Mintcom Staff</div>
          </div>
          <div className="text-end">
            <div className="text-[8px] uppercase tracking-widest text-gray-500">{t('landing.workflow.receipt.frame.gate', 'Gate')}</div>
            <div className="font-bold text-mintcom-green">G-{index + 1}</div>
          </div>
        </div>
      </div>
      {/* Perforation */}
      <div
        className="h-3 mx-3"
        style={{
          backgroundImage: 'radial-gradient(circle at 4px 50%, rgba(125,198,162,0.5) 1.5px, transparent 1.5px)',
          backgroundSize: '8px 8px',
          backgroundRepeat: 'repeat-x',
          backgroundPosition: 'center',
        }}
      />
      <div className="px-5 pb-4 flex items-center justify-between">
        <Barcode seed={`MNT-${index}`} />
        <div className="font-mono text-[8px] tracking-widest text-gray-500">MNT-WLCM-{1000 + index}</div>
      </div>
    </div>
  </PaperFrame>
);

// 10) Secure — Vault dossier with classified stamp
const VaultFrame = ({ feature, index, t }: FrameProps) => (
  <PaperFrame>
    <div className="relative font-barlow">
      {/* Diagonal security stripe pattern */}
      <div className="absolute top-0 inset-x-0 h-2 bg-[repeating-linear-gradient(45deg,#0F172A_0_8px,#7dc6a2_8px_16px)]" />
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Lock size={14} className="text-mintcom-green" />
            <span className="text-[9px] uppercase tracking-[0.25em] font-bold text-gray-700 dark:text-gray-300">
              {t('landing.workflow.receipt.frame.dossier', 'Security dossier')}
            </span>
          </div>
          {/* Classified stamp */}
          <div className="relative">
            <motion.div
              initial={{ rotate: -10, opacity: 0, scale: 1.2 }}
              animate={{ rotate: -10, opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="px-2 py-0.5 rounded-md border-2 border-red-500/70 text-red-500 text-[9px] font-black uppercase tracking-[0.2em]"
            >
              {t('landing.workflow.receipt.frame.classified', 'Classified')}
            </motion.div>
          </div>
        </div>
        <div className="mt-2 font-mono text-[10px] text-gray-500">CASE FILE · MNT-SEC-{4000 + index}</div>
        <div className="mt-4"><FeatureMeta feature={feature} t={t} /></div>
        <TryItDivider t={t} />
        <SecureDemo t={t} />
        <div className="mt-5 flex items-center justify-between pt-3 border-t border-dashed border-gray-300 dark:border-white/15 text-[9px] uppercase tracking-[0.2em] text-gray-400">
          <span>{t('landing.workflow.receipt.frame.clearance', 'Clearance · Top')}</span>
          <span>{t('landing.workflow.receipt.frame.signed', 'Signed · CISO')}</span>
        </div>
      </div>
    </div>
  </PaperFrame>
);

// 11) Loyalty — Premium membership card
const LoyaltyCardFrame = ({ feature, index, t }: FrameProps) => (
  <PaperFrame>
    <div className="relative font-barlow">
      {/* Premium card */}
      <div className="relative h-[140px] bg-gradient-to-br from-emerald-700 via-mintcom-greenDark to-mintcom-green text-white p-5 overflow-hidden">
        <div className="absolute -right-8 -top-12 w-40 h-40 rounded-full bg-white/10" />
        <div className="absolute right-12 top-12 w-20 h-20 rounded-full bg-amber-300/20 blur-xl" />
        <div className="relative flex items-start justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-[0.25em] opacity-80">
              {t('landing.workflow.receipt.frame.loyalty', 'Member since 2024')}
            </div>
            <div className="font-magilio text-2xl font-bold mt-0.5">Mintcom Club</div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {[0, 1, 2].map((i) => (
              <Star key={i} size={10} fill="#fbbf24" className="text-amber-400" />
            ))}
            <div className="text-[8px] uppercase tracking-widest mt-0.5 opacity-80">Gold Tier</div>
          </div>
        </div>
        <div className="relative mt-6 font-mono text-[14px] tracking-[0.2em]">
          MNT · {String(7700 + index).padStart(4, '0')} · 2904
        </div>
      </div>

      <div className="px-5 pt-5 pb-5">
        <FeatureMeta feature={feature} t={t} />
        <TryItDivider t={t} />
        <LoyaltyDemo t={t} />
      </div>
    </div>
  </PaperFrame>
);

// 12) Mobile App — iPhone-style frame with notch
const PhoneFrame = ({ feature, t }: FrameProps) => (
  <div className="relative">
    <div className="relative bg-gray-900 dark:bg-black p-2.5 rounded-[36px] shadow-2xl shadow-black/40 border border-white/10">
      {/* Side buttons */}
      <div className="absolute -left-1 top-20 w-1 h-10 rounded-l bg-gray-700" />
      <div className="absolute -right-1 top-24 w-1 h-16 rounded-r bg-gray-700" />
      <div className="rounded-[28px] overflow-hidden bg-cream-50 dark:bg-[#161616] relative">
        {/* Dynamic island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-black z-10" />
        <div className="px-5 pt-9 pb-5 font-barlow">
          {/* Status bar */}
          <div className="flex items-center justify-between text-[9px] text-gray-500 mb-3">
            <span className="font-mono">9:41</span>
            <div className="flex items-center gap-1">
              <Signal size={9} />
              <Wifi size={9} />
              <Battery size={11} />
            </div>
          </div>
          <FeatureMeta feature={feature} t={t} />
          <TryItDivider t={t} />
          <MobileDemo t={t} />
        </div>
        {/* Home indicator */}
        <div className="pb-2 flex justify-center">
          <div className="w-24 h-1 rounded-full bg-gray-300 dark:bg-white/30" />
        </div>
      </div>
    </div>
  </div>
);

// ===========================================================================
// FRAME DISPATCHER
// ===========================================================================
const FeatureFrame = (props: FrameProps) => {
  switch (props.feature.id) {
    case 'pointOfSale':
      return <PosReceiptFrame {...props} />;
    case 'salesControl':
      return <PaymentCardFrame {...props} />;
    case 'staffManagement':
      return <BadgeFrame {...props} />;
    case 'advancedReporting':
      return <ReportFrame {...props} />;
    case 'production':
      return <RecipeCardFrame {...props} />;
    case 'aiSystem':
      return <ChatFrame {...props} />;
    case 'multiBranch':
      return <MapFrame {...props} />;
    case 'simpleUI':
      return <TabletFrame {...props} />;
    case 'fastOnboarding':
      return <BoardingPassFrame {...props} />;
    case 'secure':
      return <VaultFrame {...props} />;
    case 'loyalty':
      return <LoyaltyCardFrame {...props} />;
    case 'mobileApp':
      return <PhoneFrame {...props} />;
    default:
      return null;
  }
};

// ===========================================================================
// MODAL SHELL
// ===========================================================================
export const WorkflowReceiptModal = ({ feature, index, onClose }: Props) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    if (!feature) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [feature, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {feature && (
        <motion.div
          key="workflow-receipt-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center p-4 sm:p-6 bg-black/55 backdrop-blur-md overflow-y-auto"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <button
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
            className="fixed top-4 end-4 z-[121] w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white transition-all"
          >
            <X size={18} />
          </button>

          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.8 }}
            style={{ transformOrigin: 'top center' }}
            className="relative w-full max-w-[400px] sm:mt-12"
          >
            <FeatureFrame feature={feature} index={index} t={t} />
            <style>{`
              :root { --receipt-bg: #FEFDFB; }
              .dark { --receipt-bg: #161616; }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WorkflowReceiptModal;

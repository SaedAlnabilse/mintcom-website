import { useEffect, useMemo, useState } from 'react';
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
  Smartphone as SmartphoneIcon,
  Bell,
  Lock,
  ShieldCheck,
  Check,
  Sparkles,
  TrendingUp,
  Star,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';

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

// ---------------------------------------------------------------------------
// Mini demos – one per feature. Tiny, focused, on-brand.
// ---------------------------------------------------------------------------

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
    { id: 'mobile', label: t('landing.workflow.receipt.demo.sales.mobile', 'Mobile'), icon: SmartphoneIcon },
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
  return (
    <div className="space-y-2.5">
      <div className="flex items-end justify-between gap-1 h-20">
        {days.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${d.v}%` }}
              transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
              className="w-full rounded-t-sm bg-gradient-to-t from-mintcom-green to-mintcom-greenLight"
            />
            <span className="text-[9px] font-mono text-gray-500">{d.l}</span>
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
              initial={{ width: 0 }}
              animate={{ width: `${ing.pct * 2}%` }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className="h-full bg-mintcom-green"
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
      <div className="min-h-[56px] rounded-lg bg-mintcom-green/5 border border-dashed border-mintcom-green/30 p-2.5">
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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
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
  const tier = tiers.slice().reverse().find((t) => points >= t.at) || tiers[0];
  const nextTier = tiers.find((t) => points < t.at);
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
          initial={{ scale: 1.2, color: '#7dc6a2' }}
          animate={{ scale: 1, color: '#1F1D2B' }}
          transition={{ duration: 0.4 }}
          className="text-2xl font-mono font-bold dark:text-white"
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

// 12. Mobile App – live notifications popping in
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
  const [shown, setShown] = useState<string[]>([]);

  useEffect(() => {
    let i = 0;
    setShown([messages[0]]);
    const id = setInterval(() => {
      i = (i + 1) % messages.length;
      setShown((s) => [messages[i], ...s].slice(0, 3));
    }, 2200);
    return () => clearInterval(id);
  }, [messages]);

  return (
    <div className="space-y-1.5">
      <AnimatePresence initial={false}>
        {shown.map((m, idx) => (
          <motion.div
            key={m + idx}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1 - idx * 0.25, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4 }}
            className="flex items-start gap-2 rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 shadow-sm px-2.5 py-2"
          >
            <div className="w-6 h-6 rounded-md bg-mintcom-green/15 flex items-center justify-center flex-shrink-0">
              <Bell size={11} className="text-mintcom-green" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-gray-800 dark:text-gray-200">Mintcom</div>
              <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate">{m}</div>
            </div>
            <div className="text-[9px] font-mono text-gray-400">now</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Demo dispatcher
// ---------------------------------------------------------------------------
const FeatureDemo = ({ id, t }: { id: WorkflowFeatureId; t: any }) => {
  switch (id) {
    case 'pointOfSale':
      return <PosDemo t={t} />;
    case 'salesControl':
      return <SalesControlDemo t={t} />;
    case 'staffManagement':
      return <StaffDemo t={t} />;
    case 'advancedReporting':
      return <ReportingDemo t={t} />;
    case 'production':
      return <RecipeDemo t={t} />;
    case 'aiSystem':
      return <AiDemo t={t} />;
    case 'multiBranch':
      return <MultiBranchDemo t={t} />;
    case 'simpleUI':
      return <SimpleUiDemo t={t} />;
    case 'fastOnboarding':
      return <OnboardingDemo t={t} />;
    case 'secure':
      return <SecureDemo t={t} />;
    case 'loyalty':
      return <LoyaltyDemo t={t} />;
    case 'mobileApp':
      return <MobileDemo t={t} />;
    default:
      return null;
  }
};

// ---------------------------------------------------------------------------
// Faux barcode (CSS only)
// ---------------------------------------------------------------------------
const Barcode = ({ seed }: { seed: string }) => {
  const bars = useMemo(() => {
    // Deterministic bar widths from the seed string
    let h = 0;
    for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    return Array.from({ length: 38 }, (_, i) => {
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const w = 1 + (h % 4); // 1-4 px wide
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

// ---------------------------------------------------------------------------
// The receipt modal itself
// ---------------------------------------------------------------------------
export const WorkflowReceiptModal = ({ feature, index, onClose }: Props) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // Lock body scroll & handle ESC
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

  const receiptNumber = feature ? String(1000 + index).padStart(4, '0') : '0000';
  const sku = feature ? `MNT-${feature.id.toUpperCase().slice(0, 6)}-${receiptNumber}` : '';
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = new Date().toLocaleDateString();

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
          {/* Top "printer slot" – decorative */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="hidden sm:block absolute top-6 left-1/2 -translate-x-1/2 w-[340px] h-3 rounded-b-xl bg-gradient-to-b from-gray-700 to-gray-900 shadow-xl shadow-black/40 pointer-events-none"
          >
            <div className="absolute inset-x-6 top-1 h-0.5 rounded bg-black/60" />
          </motion.div>

          {/* Close (outside the receipt for clarity) */}
          <button
            onClick={onClose}
            aria-label={t('common.close', 'Close')}
            className="fixed top-4 end-4 z-[121] w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md flex items-center justify-center text-white transition-all"
          >
            <X size={18} />
          </button>

          {/* Receipt */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: -40, scaleY: 0.4 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -40, scaleY: 0.4 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24, mass: 0.8 }}
            style={{ transformOrigin: 'top center' }}
            className="relative w-full max-w-[380px] sm:mt-12"
          >
            <div className="relative bg-cream-50 dark:bg-[#161616] text-gray-900 dark:text-gray-100 shadow-2xl shadow-black/40 rounded-t-md overflow-hidden">
              {/* Subtle paper texture via radial */}
              <div className="absolute inset-0 opacity-[0.06] pointer-events-none bg-[radial-gradient(circle_at_20%_10%,_#000_0,_transparent_45%),radial-gradient(circle_at_80%_30%,_#000_0,_transparent_40%)]" />

              <div className="relative px-6 pt-6 pb-5 font-barlow">
                {/* Header */}
                <div className="text-center">
                  <div className="inline-flex items-center gap-1.5 text-mintcom-green font-magilio text-xl font-bold tracking-tight">
                    <Sparkles size={14} />
                    {t('landing.workflow.receipt.brand', 'MINTCOM POS')}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-gray-500 mt-0.5">
                    {t('landing.workflow.receipt.subtitle', 'Feature receipt')}
                  </div>
                </div>

                {/* Meta row */}
                <div className="mt-4 flex items-center justify-between font-mono text-[10px] text-gray-500">
                  <span>#{receiptNumber}</span>
                  <span>{date}</span>
                  <span>{time}</span>
                </div>

                {/* Dotted divider */}
                <div className="my-4 border-t border-dashed border-gray-300 dark:border-white/15" />

                {/* Feature title */}
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

                {/* Description */}
                <p className="mt-3 text-[12px] leading-relaxed text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>

                {/* Dotted divider with tear hint */}
                <div className="my-4 flex items-center gap-2">
                  <div className="flex-1 border-t border-dashed border-gray-300 dark:border-white/15" />
                  <span className="text-[9px] uppercase tracking-widest text-gray-400">
                    {t('landing.workflow.receipt.tryIt', 'Try it')}
                  </span>
                  <div className="flex-1 border-t border-dashed border-gray-300 dark:border-white/15" />
                </div>

                {/* Per-feature mini demo */}
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                >
                  <FeatureDemo id={feature.id} t={t} />
                </motion.div>

                {/* Dotted divider */}
                <div className="my-4 border-t border-dashed border-gray-300 dark:border-white/15" />

                {/* Receipt totals area, themed */}
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-gray-500">
                    <span>{t('landing.workflow.receipt.sku', 'SKU')}</span>
                    <span>{sku}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{t('landing.workflow.receipt.cashier', 'Cashier')}</span>
                    <span>Mintcom</span>
                  </div>
                  <div className="flex justify-between text-gray-900 dark:text-white font-bold pt-1 border-t border-dashed border-gray-300 dark:border-white/15">
                    <span>{t('landing.workflow.receipt.total', 'Included')}</span>
                    <span className="text-mintcom-green">$0.00</span>
                  </div>
                </div>

                {/* Barcode */}
                <div className="mt-5 flex flex-col items-center gap-1">
                  <Barcode seed={sku} />
                  <span className="font-mono text-[10px] tracking-[0.2em] text-gray-500">{sku}</span>
                </div>

                {/* Thanks */}
                <div className="mt-4 text-center">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-mintcom-green font-bold">
                    {t('landing.workflow.receipt.thanks', 'Thank you')}
                  </div>
                  <div className="text-[10px] text-gray-500 mt-0.5">
                    {t('landing.workflow.receipt.tagline', 'Built for businesses on the move.')}
                  </div>
                </div>
              </div>

              {/* Tear-off serrated edge */}
              <div className="relative h-3 -mt-px">
                <div
                  className="absolute inset-x-0 -bottom-px h-3"
                  style={{
                    background: 'inherit',
                    backgroundColor: 'var(--receipt-bg, #FEFDFB)',
                    WebkitMaskImage:
                      'radial-gradient(circle at 6px 0, transparent 5px, black 5.5px)',
                    maskImage:
                      'radial-gradient(circle at 6px 0, transparent 5px, black 5.5px)',
                    WebkitMaskSize: '12px 12px',
                    maskSize: '12px 12px',
                    WebkitMaskRepeat: 'repeat-x',
                    maskRepeat: 'repeat-x',
                  }}
                />
              </div>
            </div>

            {/* Apply receipt-bg via inline style hack so the serrated mask matches */}
            <style>{`
              :root { --receipt-bg: #FEFDFB; }
              .dark .receipt-bg-anchor { --receipt-bg: #161616; }
            `}</style>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WorkflowReceiptModal;

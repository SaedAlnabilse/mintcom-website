/**
 * Demo Support — mirrors mintcom-pos ContactSupportScreen:
 * Contact · Quick fixes · Shift playbook · Escalation · Security · FAQ
 * Palette: neutrals + mintcom-green (system) + mintcom-red (alerts only).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Calculator,
  ChevronRight,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileText,
  HelpCircle,
  LifeBuoy,
  Lock,
  Mail,
  Minus,
  Phone,
  Plus,
  Printer,
  Search,
  ShieldAlert,
  Undo2,
  Wrench,
  WifiOff,
  X,
  Zap,
  Banknote,
} from 'lucide-react';

type Urgency = 'low' | 'medium' | 'high';

type QuickFix = {
  id: string;
  title: string;
  steps: string[];
  urgency: Urgency;
  icon: typeof Printer;
};

type Faq = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

const QUICK_FIXES: QuickFix[] = [
  {
    id: 'printer',
    icon: Printer,
    title: 'The receipt did not print. What should I check?',
    urgency: 'medium',
    steps: [
      'Check printer power and paper',
      'Verify Bluetooth/network connection',
      'Reprint from completed order',
      'Reconnect from Settings > Printers',
    ],
  },
  {
    id: 'payment',
    icon: CreditCard,
    title: 'The customer may have been charged, but the order still looks unpaid. What now?',
    urgency: 'high',
    steps: [
      'Do NOT charge the customer again',
      'Check the payment terminal result',
      'Search order by time and amount',
      'Call a manager before retrying',
    ],
  },
  {
    id: 'offline',
    icon: WifiOff,
    title: 'What should I do if the POS is offline or sales are not syncing?',
    urgency: 'high',
    steps: [
      'Continue selling if local mode is on',
      'Keep device powered on',
      'Move to a stable network',
      'Do NOT clear data or uninstall',
    ],
  },
  {
    id: 'drawer',
    icon: Banknote,
    title: 'When should I use Pay-In or Pay-Out?',
    urgency: 'low',
    steps: [
      'Use Pay-In to add money',
      'Use Pay-Out for approved removals',
      'Always enter a clear reason',
      'These notes explain the shift total',
    ],
  },
  {
    id: 'refund',
    icon: Undo2,
    title: 'How should I handle a refund, void, or wrong order?',
    urgency: 'medium',
    steps: [
      'Find order in Reports or My Orders',
      'Use the approved refund/void action',
      'Enter a clear reason',
      'Never recreate orders to hide mistakes',
    ],
  },
];

const SHIFT_GUIDE = [
  {
    id: 'beforeSale',
    icon: Calculator,
    title: 'Before the first sale',
    description:
      'Confirm the correct location, open the shift, count starting cash, check printer paper, and make sure the sync indicator looks healthy.',
    timeLabel: 'Opening',
  },
  {
    id: 'busyService',
    icon: ClipboardList,
    title: 'During busy service',
    description:
      'Search items quickly, confirm modifiers, repeat the total before payment, hold unfinished orders, and add notes for special requests.',
    timeLabel: 'Rush Hour',
  },
  {
    id: 'closeShift',
    icon: Lock,
    title: 'Before closing',
    description:
      'Finish or hold open orders, record pay-ins and pay-outs, count the drawer, explain any cash difference, and wait for sync before signing out.',
    timeLabel: 'Closing',
  },
];

const ESCALATION = [
  'A card or external payment may have charged, but the order still appears unpaid.',
  'The cash drawer is short, over, stuck, or was opened without a sale.',
  "You need to refund, void, discount, change price, or close someone else's shift.",
  "The app stays offline, orders do not sync, or reports do not match today's sales.",
];

const FAQS: Faq[] = [
  {
    id: '1',
    category: 'Opening',
    question: 'What should I check before I start taking orders?',
    answer:
      'Make sure you are logged into the correct location, open your shift, count and enter the starting cash, check receipt paper, confirm the printer is connected, and look at the sync/status indicator. If another shift is still open or Open Shift is disabled, ask a manager before selling.',
  },
  {
    id: '2',
    category: 'Sales Screen',
    question: 'How do I build an order accurately?',
    answer:
      'Open Sales, use category filters or search, tap the item, then choose required modifiers, add-ons, quantity, and notes. Before payment, read back the order, check the cart total, and confirm any taxes or discounts that changed the price.',
  },
  {
    id: '3',
    category: 'Price & Discounts',
    question: 'What if the price, tax, or discount looks wrong?',
    answer:
      'Pause before taking payment. Check the item, modifier, tax selection, and discount on the cart. Do not use a random discount to force the total unless a manager approves it, because that affects sales reports and cash reconciliation.',
  },
  {
    id: '4',
    category: 'Hold Orders',
    question: 'When should I hold an order instead of clearing it?',
    answer:
      'Use Hold Order when a customer steps away, waits for a table, adds more items later, or you need to pause service. Save it with a clear name or table number. When resuming, confirm the items with the customer before taking payment.',
  },
  {
    id: '5',
    category: 'Payments',
    question: 'How do I avoid mistakes when taking payment?',
    answer:
      'Say the total out loud, tap Pay, choose the exact payment method, and enter the received amount for cash. For card or external methods, finish the terminal/payment step first, then complete the POS sale using the same method. Do not mark a card sale as cash.',
  },
  {
    id: '6',
    category: 'Split Payment',
    question: 'How do I split one order across payment methods?',
    answer:
      'Choose Split Payment, enter the amount for each payment method, and confirm each part until the remaining balance is zero. Keep the customer at the register until every part is approved, then review the final receipt total.',
  },
  {
    id: '7',
    category: 'Payment Mismatch',
    question: 'The customer may have been charged, but the order still looks unpaid. What now?',
    answer:
      'Do not charge again immediately. Keep the customer at the register, check the payment terminal result, search the order by time and amount, and note the payment method or approval reference. Ask a manager or support before taking a second payment.',
  },
  {
    id: '8',
    category: 'Refunds & Voids',
    question: 'How should I handle a refund, void, or wrong order?',
    answer:
      'Find the order in Reports or My Orders, use the approved refund or void action, enter a clear reason, and keep the receipt if needed. Refund permission may be required. Do not delete or recreate orders to hide a mistake.',
  },
  {
    id: '9',
    category: 'Receipts & Printer',
    question: 'The receipt did not print. What should I check?',
    answer:
      'Check that the printer is powered on, has paper, the cover is closed, and Bluetooth or network is connected. Reprint from the completed order instead of creating another sale. If it still fails, reconnect the printer from settings or call a manager.',
  },
  {
    id: '10',
    category: 'Cash Drawer',
    question: 'When should I use Pay-In or Pay-Out?',
    answer:
      'Use Pay-In when adding money to the drawer and Pay-Out when removing money for approved expenses, safe drops, or corrections. Always enter a clear reason. These notes help explain the drawer total when the shift is closed.',
  },
  {
    id: '11',
    category: 'Offline & Sync',
    question: 'What should I do if the POS is offline or sales are not syncing?',
    answer:
      'If local selling is allowed, continue carefully and keep the device powered on. Do not clear app data, uninstall the app, or switch accounts to force a fix. Move to a stable network and wait for sync before closing the shift or changing devices.',
  },
  {
    id: '12',
    category: 'Shift Close',
    question: 'What should I do before leaving the register?',
    answer:
      'Finish or hold active orders, print needed receipts, count the drawer, compare expected cash with actual cash, explain any difference, then close the shift. If the app is offline, keep it open until it syncs or ask a manager before signing out.',
  },
];

function SectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.08em] text-text-tertiary dark:text-mintcom-textSecondary ${className}`}
    >
      {children}
    </p>
  );
}

/** Soft green section chip — brand accent without flooding the page */
function SectionChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-mintcom-green/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-mintcom-green">
      {icon}
      {label}
    </span>
  );
}

type Channel = {
  key: string;
  icon: typeof Mail;
  label: string;
  detail: string;
  badge: string;
  badgeIcon: React.ReactNode;
  href?: string;
  to?: string;
};

const CHANNELS: Channel[] = [
  {
    key: 'email',
    icon: Mail,
    label: 'Email Support',
    detail: 'support@mintcompos.com',
    badge: 'Replies in ~2 hrs',
    badgeIcon: <Clock size={10} />,
    href: 'mailto:support@mintcompos.com',
  },
  {
    key: 'help',
    icon: LifeBuoy,
    label: 'Help Center',
    detail: 'Open guides for setup, printers, and daily POS workflows',
    badge: 'Self-serve',
    badgeIcon: <BookOpen size={10} />,
    to: '/support',
  },
  {
    key: 'userManual',
    icon: FileText,
    label: 'User Manual',
    detail: 'Download the PDF guide in your app language',
    badge: 'PDF',
    badgeIcon: <Download size={10} />,
    to: '/support',
  },
  {
    key: 'setupManual',
    icon: Wrench,
    label: 'Setup Manual',
    detail: 'Hardware and first-location setup PDF',
    badge: 'PDF',
    badgeIcon: <Download size={10} />,
    to: '/support',
  },
];

const card =
  'rounded-xl border border-gray-200/90 bg-white dark:border-white/10 dark:bg-mintcom-surface';
const iconWellGreen =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/12 text-mintcom-green';
const iconWellRed =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-red/10 text-mintcom-red';

type DemoSupportScreenProps = {
  /** When set, shows POS-style back chrome (e.g. opened from login Contact support). */
  onBack?: () => void;
  /**
   * `login` — full-screen POS ContactSupport from sign-in ("POS Help for Live Service" + back).
   * `inApp` — try-POS Support tab (default).
   */
  variant?: 'login' | 'inApp';
};

export function DemoSupportScreen({ onBack, variant = 'inApp' }: DemoSupportScreenProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);
  const [activeQuickFix, setActiveQuickFix] = useState<string | null>(null);
  const isLoginPresentation = variant === 'login' || Boolean(onBack);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQS;
    return FAQS.filter(
      (f) =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const filteredFixes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return QUICK_FIXES;
    return QUICK_FIXES.filter(
      (f) => f.title.toLowerCase().includes(q) || f.steps.some((s) => s.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  const contactSection = (
    <section>
      <SectionLabel className="mb-3">Need a support channel?</SectionLabel>
      <div className="space-y-2">
        {CHANNELS.map((ch) => {
          const Icon = ch.icon;
          // Demo only — not clickable (no mailto / navigation in try-POS)
          return (
            <div
              key={ch.key}
              className={`flex cursor-default items-center gap-3 ${card} p-3 select-none`}
              aria-disabled="true"
            >
              <span className={iconWellGreen}>
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-semibold text-text-primary dark:text-white">
                    {ch.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-mintcom-green/10 px-1.5 py-0.5 text-[10px] font-medium text-mintcom-green">
                    {ch.badgeIcon}
                    {ch.badge}
                  </span>
                </span>
                <span className="mt-0.5 block text-[12px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  {ch.detail}
                </span>
              </span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mintcom-green/10 text-mintcom-green opacity-50">
                <ChevronRight size={14} />
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );

  const quickFixSection = filteredFixes.length > 0 && (
    <section>
      <SectionChip icon={<Zap size={12} strokeWidth={2} />} label="Quick fixes" />
      <div className="space-y-2">
        {filteredFixes.map((fix) => {
          const open = activeQuickFix === fix.id;
          const Icon = fix.icon;
          const isHigh = fix.urgency === 'high';
          return (
            <div
              key={fix.id}
              className={`overflow-hidden ${card} ${
                open
                  ? isHigh
                    ? 'border-mintcom-red/30 ring-1 ring-mintcom-red/10'
                    : 'border-mintcom-green/35 ring-1 ring-mintcom-green/10'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveQuickFix(open ? null : fix.id)}
                className="flex w-full items-center gap-3 p-3 text-start"
              >
                <span className={isHigh ? iconWellRed : iconWellGreen}>
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold leading-snug text-text-primary dark:text-white">
                    {fix.title}
                  </span>
                  {isHigh && (
                    <span className="mt-1.5 inline-flex items-center gap-1 rounded-xl bg-mintcom-red/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mintcom-red">
                      <span className="h-1.5 w-1.5 rounded-full bg-mintcom-red" />
                      Needs manager
                    </span>
                  )}
                </span>
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                    open
                      ? isHigh
                        ? 'bg-mintcom-red text-white'
                        : 'bg-mintcom-green text-white'
                      : 'bg-gray-100 text-text-tertiary dark:bg-white/8'
                  }`}
                >
                  {open ? <Minus size={14} /> : <Plus size={14} />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      className={`space-y-2.5 border-t px-3 pb-3.5 pt-3 ${
                        isHigh
                          ? 'border-mintcom-red/15 bg-mintcom-red/[0.03]'
                          : 'border-mintcom-green/15 bg-mintcom-green/[0.03]'
                      }`}
                    >
                      {fix.steps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-xl text-[10px] font-semibold text-white ${
                              isHigh ? 'bg-mintcom-red' : 'bg-mintcom-green'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <p className="pt-0.5 text-[12px] leading-snug text-text-secondary dark:text-mintcom-textSecondary">
                            {step}
                          </p>
                        </div>
                      ))}
                      {isHigh && (
                        <div className="mt-1 flex items-center gap-2 rounded-xl border border-mintcom-red/20 bg-mintcom-red/8 px-2.5 py-2">
                          <ShieldAlert size={13} className="shrink-0 text-mintcom-red" />
                          <p className="text-[11px] font-semibold text-mintcom-red">
                            Do not retry without manager approval
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );

  const securitySection = (
    <section
      className={`rounded-xl border border-mintcom-red/25 bg-white p-4 dark:border-mintcom-red/30 dark:bg-mintcom-surface`}
    >
        <div className="mb-2.5 flex items-center gap-2.5">
          <span className={iconWellRed}>
            <ShieldAlert size={18} strokeWidth={1.75} />
          </span>
          <p className="text-[14px] font-semibold text-mintcom-red">Report a security issue</p>
        </div>
        <p className="mb-3.5 text-[12px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
          If you suspect unauthorized access, fraudulent transactions, or any security concern with
          your account, email us immediately.
        </p>
        <a
          href="mailto:admin@mintcompos.com?subject=Report%20a%20Security%20Issue"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-red px-4 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          <ShieldAlert size={14} />
          Report security issue
        </a>
    </section>
  );

  const shiftSection = (
    <section>
      <SectionChip icon={<CalendarClock size={12} strokeWidth={2} />} label="Shift playbook" />
      <p className="mb-4 text-[12px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
        A quick checklist for real register work, from opening the drawer to closing the day.
      </p>

      <div className="space-y-0">
        {SHIFT_GUIDE.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="flex w-4 shrink-0 flex-col items-center pt-3.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-mintcom-green ring-2 ring-white dark:ring-mintcom-surface" />
                {index < SHIFT_GUIDE.length - 1 && (
                  <span className="w-px flex-1 bg-mintcom-green/25" />
                )}
              </div>
              <div className={`mb-2.5 min-w-0 flex-1 ${card} p-3.5`}>
                <div className="flex items-start gap-3">
                  <span className={iconWellGreen}>
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-semibold text-text-primary dark:text-white">
                        {item.title}
                      </p>
                      <span className="rounded-xl bg-mintcom-green/12 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mintcom-green">
                        {item.timeLabel}
                      </span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Escalation — red only here (manager / risk) */}
      <div className="mt-2 flex gap-3 rounded-xl border border-mintcom-red/20 bg-mintcom-red/[0.04] p-3.5 dark:bg-mintcom-red/[0.08]">
        <span className={iconWellRed}>
          <Phone size={16} strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-mintcom-red">
            Call a manager before continuing when
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
            These cases affect money, permissions, or business records and should not be guessed.
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {ESCALATION.map((s) => (
              <li
                key={s}
                className="flex gap-2 text-[11px] leading-snug text-text-secondary dark:text-mintcom-textSecondary"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-mintcom-red/70" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const faqSection = (
    <section className="pb-4">
      <SectionChip icon={<HelpCircle size={12} strokeWidth={2} />} label="POS Q&A" />
      <p className="mb-3 text-[12px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
        Use these answers during a shift when something is unclear.
      </p>

      <div className="sticky top-0 z-10 -mx-1 bg-white/95 px-1 py-2 backdrop-blur dark:bg-mintcom-dark/95">
        <div className="relative">
          <span className="pointer-events-none absolute start-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-xl bg-mintcom-green/12 text-mintcom-green">
            <Search size={13} />
          </span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Try "refund", "printer", "drawer"…'
            className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-11 pe-12 text-[16px] sm:text-[13px] outline-none focus:border-mintcom-green/50 focus:ring-2 focus:ring-mintcom-green/15 dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute end-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-xl text-text-tertiary hover:bg-mintcom-green/10 hover:text-mintcom-green"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {filteredFaqs.length === 0 ? (
        <div className={`flex flex-col items-center border-dashed py-10 text-center ${card}`}>
          <Search size={24} className="mb-2 text-mintcom-green/50" />
          <p className="text-xs font-medium text-text-secondary">No matching questions found</p>
        </div>
      ) : (
        <div className={`overflow-hidden ${card}`}>
          {filteredFaqs.map((faq, index) => {
            const open = expandedFAQ === faq.id;
            return (
              <div
                key={faq.id}
                className={
                  index < filteredFaqs.length - 1
                    ? 'border-b border-gray-100 dark:border-white/8'
                    : ''
                }
              >
                <button
                  type="button"
                  onClick={() => setExpandedFAQ(open ? null : faq.id)}
                  className={`flex w-full items-start gap-3 px-3.5 py-3 text-start transition-colors ${
                    open ? 'bg-mintcom-green/[0.05]' : ''
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-xl text-[10px] font-semibold ${
                      open
                        ? 'bg-mintcom-green text-white'
                        : 'bg-mintcom-green/12 text-mintcom-green'
                    }`}
                  >
                    {faq.id}
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    <span className="block text-[11px] font-semibold uppercase tracking-wide text-mintcom-green">
                      {faq.category}
                    </span>
                    <span className="mt-0.5 block text-[13px] font-semibold leading-snug text-text-primary dark:text-white">
                      {faq.question}
                    </span>
                  </span>
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xl ${
                      open
                        ? 'bg-mintcom-green text-white'
                        : 'bg-gray-100 text-text-tertiary dark:bg-white/8'
                    }`}
                  >
                    {open ? <Minus size={12} /> : <Plus size={12} />}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-mintcom-green/15 bg-mintcom-green/[0.03] px-3.5 py-3 ps-3.5 sm:ps-12 dark:border-mintcom-green/20">
                        <p className="text-[12px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                          {faq.answer}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-white dark:bg-mintcom-dark">
      {/* Header — matches mintcom-pos ContactSupportScreen: back + "POS Help for Live Service" */}
      <div className="shrink-0 bg-white px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] dark:bg-mintcom-dark sm:px-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          {isLoginPresentation && onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Back"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-text-primary transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
            >
              <ArrowLeft size={22} strokeWidth={2} className="rtl:rotate-180" />
            </button>
          ) : null}
          <h2 className="min-w-0 flex-1 font-sans text-[19px] font-bold leading-tight tracking-tight text-text-primary dark:text-white sm:text-[28px] sm:tracking-[-0.5px]">
            POS Help for Live Service
          </h2>
          {!isLoginPresentation && (
            <Link
              to="/support"
              className="ms-auto inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl border border-mintcom-green/30 bg-mintcom-green/10 px-3 py-1.5 text-[11px] font-semibold text-mintcom-green transition-colors hover:bg-mintcom-green/15"
            >
              Full help center <ChevronRight size={14} className="rtl:rotate-180" />
            </Link>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 sm:pt-2" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="mx-auto flex max-w-5xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <div className="flex flex-col gap-6 lg:max-w-md lg:flex-1">
            {contactSection}
            {quickFixSection}
            {securitySection}
          </div>
          <div className="flex flex-col gap-6 lg:flex-[1.4]">
            {shiftSection}
            {faqSection}
          </div>
        </div>
      </div>
    </div>
  );
}

import { modalSlideVariants as slideVariants } from "./landing/modalSlideVariants";
import { SectionCarouselFooter } from "./landing/SectionCarouselFooter";
import { LandingFeatureCard } from './landing/LandingFeatureCard';
import { useModalKeyboardGuard } from '../hooks/useModalKeyboardGuard';
import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  ShieldCheck,
  Zap,
  Settings,
  Store,
  Play,
  X,
  Users,
  Check,
  Smartphone,
  BarChart3,
  Heart,
  Package,
  CreditCard,
  ChefHat,
  Cloud,
  Home,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Coffee,
  Briefcase,
} from 'lucide-react';
import { Logo } from './Logo';
import MintcomLeafIcon from '../assets/small-logo.svg';
import { FeaturePosScreenshot } from './FeaturePosScreenshot';
import { FeatureScreenshot } from './FeatureScreenshots';
import {
  DEMO_VIDEO_POSTER_URL,
  DEMO_VIDEO_URL,
  HERO_VIDEO_URL,
  isNativeVideoUrl,
} from '../config/downloads';

/**
 * Shared outer frame for ALL 4 Why cards.
 * Fixed 3:2 ratio — identical pixel size on every slide (matches card 2 sales).
 * Story column is forced to this height so the modal never grows on card 1.
 */
const WHY_PREVIEW_FRAME_CLASS = 'relative aspect-[3/2] w-full overflow-hidden';


type FeatureId = 'complete' | 'realUsers' | 'security' | 'multiBranch';

type Feature = {
  id: FeatureId;
  icon: typeof Store;
  /** Outer grid card title (can be shorter than the modal title). */
  cardTitle: string;
  /** Modal / detail title. */
  title: string;
  description: string;
  teaser: string;
  highlights: string[];
};



/** Card chrome matches Features WorkflowFeatureCard — icon + title row, Learn more. */

/**
 * Card 1 — fluid full-bleed modules. Fills the same 3:2 frame as sales/reports
 * (no fixed canvas / FeatureShotFrame scale).
 */
function WhyCompletePreview({ isRtl }: { isRtl?: boolean }) {
  const mods = isRtl
    ? [
        { Icon: Store, name: 'نقطة البيع', sub: 'بيع سريع' },
        { Icon: Cloud, name: 'السحابة', sub: 'مزامنة' },
        { Icon: BarChart3, name: 'تقارير', sub: 'تحليلات' },
        { Icon: Users, name: 'فريق', sub: 'أدوار' },
        { Icon: Heart, name: 'ولاء', sub: 'نقاط' },
        { Icon: Package, name: 'مخزون', sub: 'تتبع' },
        { Icon: ChefHat, name: 'وصفات', sub: 'تكاليف' },
        { Icon: CreditCard, name: 'مدفوعات', sub: 'طرق' },
        { Icon: Smartphone, name: 'الجوال', sub: 'تنبيهات' },
      ]
    : [
        { Icon: Store, name: 'POS', sub: 'Fast Checkout' },
        { Icon: Cloud, name: 'Cloud', sub: 'Live Sync' },
        { Icon: BarChart3, name: 'Reports', sub: 'Analytics' },
        { Icon: Users, name: 'Team', sub: 'Roles' },
        { Icon: Heart, name: 'Loyalty', sub: 'Points' },
        { Icon: Package, name: 'Stock', sub: 'Tracking' },
        { Icon: ChefHat, name: 'Recipes', sub: 'Costing' },
        { Icon: CreditCard, name: 'Payments', sub: 'Methods' },
        { Icon: Smartphone, name: 'Mobile', sub: 'Alerts' },
      ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white font-sans dark:bg-mintcom-dark">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-3 py-2.5 dark:border-white/10 sm:px-3.5 sm:py-3">
        <Logo variant="icon" size="sm" />
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-mintcom-green sm:text-[10px]">
            {isRtl ? 'باقة واحدة' : 'One subscription'}
          </p>
          <p className="truncate text-[13px] font-bold leading-tight text-gray-900 dark:text-white sm:text-[14px]">
            {isRtl ? 'كل شيء مشمول' : 'Everything Included'}
          </p>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-3 gap-1.5 p-2 sm:gap-2 sm:p-2.5">
        {mods.map((m) => (
          <div
            key={m.name}
            className="flex min-h-0 flex-col items-center justify-center rounded-xl border border-gray-200/80 bg-gradient-to-b from-white to-gray-50 px-1 text-center shadow-sm dark:border-white/10 dark:from-[#1a1a1a] dark:to-[#141414] sm:rounded-2xl"
          >
            <span className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-mintcom-green/12 text-mintcom-green sm:mb-1.5 sm:h-9 sm:w-9 sm:rounded-xl">
              <m.Icon size={16} strokeWidth={2} className="sm:hidden" />
              <m.Icon size={18} strokeWidth={2} className="hidden sm:block" />
            </span>
            <p className="truncate px-0.5 text-[10px] font-bold leading-tight text-gray-900 dark:text-white sm:text-[11px]">
              {m.name}
            </p>
            <p className="mt-0.5 truncate px-0.5 text-[8px] font-medium leading-tight text-gray-400 sm:text-[9px]">
              {m.sub}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card 4 — fluid Create New Brand. Same 3:2 outer frame as cards 2 & 3.
 */
function WhyCreateBranchPreview({ isRtl }: { isRtl?: boolean }) {
  const locations = isRtl
    ? [
        { name: 'وسط البلد', type: 'موقع · مقهى', selected: true, Icon: Coffee },
        { name: 'فرع المول', type: 'موقع · مقهى', selected: true, Icon: Coffee },
        { name: 'كشك المطار', type: 'نقطة بيع · تجزئة', selected: false, Icon: ShoppingBag },
        { name: 'حي الجامعة', type: 'نقطة بيع · مطعم', selected: false, Icon: Store },
      ]
    : [
        { name: 'Downtown', type: 'Location · Cafe', selected: true, Icon: Coffee },
        { name: 'Mall Branch', type: 'Location · Cafe', selected: true, Icon: Coffee },
        { name: 'Airport Kiosk', type: 'POS · Retail', selected: false, Icon: ShoppingBag },
        { name: 'University District', type: 'POS · Restaurant', selected: false, Icon: Store },
      ];

  const selectedCount = locations.filter((l) => l.selected).length;

  const wizardSteps = isRtl
    ? [
        { label: 'التفاصيل', icon: 'home' as const, state: 'done' as const },
        { label: 'المواقع', icon: 'map' as const, state: 'active' as const },
        { label: 'الفريق', icon: 'team' as const, state: 'todo' as const },
      ]
    : [
        { label: 'Details', icon: 'home' as const, state: 'done' as const },
        { label: 'Locations', icon: 'map' as const, state: 'active' as const },
        { label: 'Team', icon: 'team' as const, state: 'todo' as const },
      ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white font-sans dark:bg-mintcom-dark">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-white/10 sm:px-3.5 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
            <Briefcase size={15} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="truncate font-sans text-[13px] font-black leading-tight text-gray-900 dark:text-white">
              {isRtl ? 'إنشاء علامة تجارية جديدة' : 'Create New Brand'}
            </p>
            <p className="truncate text-[10px] font-medium text-gray-500 dark:text-gray-400">
              {isRtl ? 'Cafe Delight · ربط المواقع / نقاط البيع' : 'Cafe Delight · Link Location/POS'}
            </p>
          </div>
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-white/10">
          <X size={14} strokeWidth={2.25} />
        </span>
      </div>

      <div className="flex shrink-0 items-center justify-center gap-1 border-b border-gray-100 px-3 py-1.5 dark:border-white/10 sm:gap-2 sm:py-2">
        {wizardSteps.map((step, idx) => {
          const filled = step.state === 'done' || step.state === 'active';
          return (
            <Fragment key={step.label}>
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] sm:h-6 sm:w-6 ${
                    filled
                      ? 'border-mintcom-green bg-mintcom-green text-white'
                      : 'border-gray-200 bg-white text-gray-400 dark:border-white/15 dark:bg-mintcom-surface'
                  }`}
                >
                  {step.state === 'done' ? (
                    <Check size={10} strokeWidth={3} />
                  ) : step.icon === 'map' ? (
                    <MapPin size={10} strokeWidth={2.25} />
                  ) : step.icon === 'team' ? (
                    <Users size={10} strokeWidth={2.25} />
                  ) : (
                    <Home size={10} strokeWidth={2.25} />
                  )}
                </span>
                <span
                  className={`text-[9px] font-bold sm:text-[10px] ${
                    filled ? 'text-mintcom-green' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < wizardSteps.length - 1 && (
                <div
                  className={`mx-0.5 h-0.5 w-5 rounded-full sm:w-8 ${
                    step.state === 'done' ? 'bg-mintcom-green' : 'bg-gray-200 dark:bg-white/10'
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </div>

      <div className="@container shrink-0 px-3 pt-2 sm:px-3.5 sm:pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate font-sans text-[12px] font-black text-gray-900 dark:text-white sm:text-[13px]">
            {isRtl ? 'اختر موقع / نقطة بيع للربط' : 'Select Location/POS to Link'}
          </p>
          <span className="shrink-0 rounded-full bg-mintcom-green/15 px-2 py-0.5 text-[9px] font-black text-mintcom-green">
            {isRtl ? `${selectedCount} محدد` : `${selectedCount} selected`}
          </span>
        </div>
        <p className="mt-0.5 w-full overflow-hidden text-ellipsis whitespace-nowrap font-medium leading-none text-gray-500 dark:text-gray-400 [font-size:clamp(7.5px,2.1cqi,10px)]">
          {isRtl
            ? 'تظهر فقط المواقع غير المرتبطة. المواقع الموجودة في علامة أخرى مخفية.'
            : 'Only unlinked locations are shown. Locations already in another brand are hidden.'}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-1.5 p-2.5 sm:gap-2 sm:p-3">
        {locations.map((loc) => (
          <div
            key={loc.name}
            className={`flex min-h-0 items-center gap-2 rounded-xl border px-2 sm:px-2.5 ${
              loc.selected
                ? 'border-mintcom-green bg-mintcom-green/10'
                : 'border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/[0.03]'
            }`}
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${
                loc.selected
                  ? 'bg-mintcom-green text-white'
                  : 'bg-mintcom-green/12 text-mintcom-green'
              }`}
            >
              <loc.Icon size={15} strokeWidth={2.2} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate font-sans text-[11px] font-extrabold text-gray-900 dark:text-white sm:text-[12px]">
                {loc.name}
              </p>
              <p className="truncate text-[9px] font-semibold text-gray-500 dark:text-gray-400">
                {loc.type}
              </p>
            </div>
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                loc.selected
                  ? 'border-mintcom-green bg-mintcom-green text-white'
                  : 'border-gray-300 bg-transparent dark:border-white/20'
              }`}
            >
              {loc.selected && <Check size={10} strokeWidth={3} />}
            </span>
          </div>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 px-3 py-2 dark:border-white/10 sm:px-3.5">
        <div className="flex h-8 flex-1 items-center justify-center rounded-xl border border-mintcom-green bg-white text-[11px] font-bold text-mintcom-green dark:bg-transparent">
          {isRtl ? 'رجوع' : 'Back'}
        </div>
        <div className="relative flex h-8 flex-[1.2] items-center justify-center rounded-xl bg-mintcom-green text-[11px] font-black text-white shadow-sm shadow-mintcom-green/30">
          <span>{isRtl ? 'متابعة' : 'Continue'}</span>
          <ArrowRight size={13} className="absolute end-3" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}

/**
 * Why Mintcom previews — all sit in the same 3:2 outer frame.
 * Cards 2–3: real try-pos screenshots (fill). Cards 1 & 4: fluid full-bleed UI.
 */
const FeaturePreview = ({ id, isRtl }: { id: FeatureId; isRtl?: boolean }) => {
  if (id === 'complete') {
    return <WhyCompletePreview isRtl={isRtl} />;
  }

  if (id === 'realUsers') {
    return <FeaturePosScreenshot side fill className="h-full w-full" />;
  }

  if (id === 'security') {
    return <FeatureScreenshot featureId="advancedReporting" side fill />;
  }

  return <WhyCreateBranchPreview isRtl={isRtl} />;
};


const FeatureModal = ({
  features,
  activeIndex,
  direction,
  onClose,
  onPrev,
  onNext,
  onJumpTo,
  t,
  isRtl,
}: {
  features: Feature[];
  activeIndex: number;
  direction: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onJumpTo: (i: number) => void;
  t: (...args: any[]) => any;
  isRtl: boolean;
}) => {
  const feature = features[activeIndex];
  if (!feature) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Same shell language as Features modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_-16px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-mintcom-dark"
        dir={isRtl ? 'rtl' : 'ltr'}
        role="dialog"
        aria-modal="true"
        aria-label={feature.title}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={String(t('common.close', 'Close'))}
          className="absolute end-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"
        >
          <X size={16} strokeWidth={2.5} />
        </button>

        <div className="absolute start-4 top-4 z-30 flex items-center gap-1 px-1 py-1 text-xs font-bold text-mintcom-green">
          <span className="tabular-nums">{activeIndex + 1}</span>
          <span className="opacity-50">/</span>
          <span className="tabular-nums opacity-70">{features.length}</span>
        </div>

        <div className="relative min-h-0 overflow-x-hidden overflow-y-auto">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={activeIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative z-10 w-full select-text p-5 pt-12 will-change-transform sm:p-6 sm:pt-12 md:p-8 md:pt-14"
            >
              {/*
                Preview defines row height (always 3:2 of the same column width).
                Story uses h-0 + min-h-full so long card-1 copy cannot enlarge
                the modal — it scrolls instead. Result: card 1 = card 2 size.
              */}
              <div className="grid gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(320px,1.22fr)] lg:gap-8">
                {/* Preview anchors size — same box on every slide */}
                <div className="order-1 w-full min-w-0 lg:order-2 lg:col-start-2 lg:row-start-1">
                  <div
                    className={`overflow-hidden rounded-2xl border border-gray-200/90 shadow-lg shadow-black/10 dark:border-white/10 dark:shadow-black/40 ${
                      feature.id === 'realUsers'
                        ? 'bg-[#f6f3ec] dark:bg-mintcom-dark'
                        : feature.id === 'security'
                          ? 'bg-gray-100 dark:bg-mintcom-dark'
                          : 'bg-white dark:bg-mintcom-dark'
                    }`}
                  >
                    <div className={WHY_PREVIEW_FRAME_CLASS}>
                      <div className="absolute inset-0 overflow-hidden">
                        <FeaturePreview id={feature.id} isRtl={isRtl} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Story height = preview height; full description + all bullets (scroll if needed) */}
                <div className="order-2 flex min-w-0 flex-col lg:order-1 lg:col-start-1 lg:row-start-1 lg:h-0 lg:min-h-full lg:overflow-hidden">
                  <h3 className="shrink-0 font-sans text-xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white sm:text-2xl md:text-[1.75rem] lg:text-[1.85rem]">
                    {feature.title}
                  </h3>
                  <div className="mt-2.5 min-h-0 flex-1 overflow-y-auto overscroll-contain pe-1 [scrollbar-width:thin] [scrollbar-color:rgba(125,198,162,0.45)_transparent]">
                    {/* Full copy — no line-clamp; every word + every bullet is in the DOM */}
                    <p className="max-w-md font-sans text-[13px] font-medium leading-relaxed text-gray-600 dark:text-gray-300 sm:text-[14px] md:text-[15px]">
                      {feature.description}
                    </p>
                    <ul className="mt-3.5 space-y-1.5 pb-2 sm:mt-4 sm:space-y-2">
                      {feature.highlights.map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2 text-[13px] font-semibold leading-snug text-gray-700 dark:text-gray-200 sm:gap-2.5 sm:text-sm"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mintcom-green" />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <SectionCarouselFooter
          totalCount={features.length}
          activeIndex={activeIndex}
          onPrev={onPrev}
          onNext={onNext}
          onJumpTo={onJumpTo}
          isRtl={isRtl}
          prevLabel={String(t("common.previous", "Previous"))}
          nextLabel={String(t("common.next", "Next"))}
        />
      </motion.div>
    </div>
  );
};

export const WhyChooseUs = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);
  const videoRef = useRef<HTMLDivElement>(null);

  // Prefer the same hero/env video when set; otherwise the bundled demo MP4.
  const demoSrc = HERO_VIDEO_URL || DEMO_VIDEO_URL;
  const demoIsNative = isNativeVideoUrl(demoSrc);

  // Plain highlight strings — avoid t('…h1') missing-key → "H1"
  const features: Feature[] = [
    {
      id: 'complete',
      icon: Store,
      cardTitle: t('landing.features.cards.complete.cardTitle', 'Full with No Hidden Cost'),
      title: t('landing.features.cards.complete.title'),
      description: t('landing.features.cards.complete.description'),
      teaser: isRtl ? 'حل كامل' : 'Complete',
      highlights: isRtl
        ? [
            'إدارة الموظفين والصلاحيات حسب الدور',
            'مخزون وتتبع مخزون في الوقت الفعلي',
            'تطبيق جوال مع تنبيهات فورية',
            'الفوترة الإلكترونية المتكاملة',
            'برنامج ولاء ومكافآت العملاء',
            'دعم طرق دفع متعددة',
          ]
        : [
            'Staff Management & Role-Based Access',
            'Real-Time Inventory & Stock Control',
            'Mobile App with Instant Alerts',
            'Integrated E-Invoicing',
            'Customer Loyalty & Rewards Program',
            'Support for Multiple Payment Methods',
          ],
    },
    {
      id: 'realUsers',
      icon: Zap,
      cardTitle: t('landing.features.cards.realUsers.title'),
      title: t('landing.features.cards.realUsers.title'),
      description: t('landing.features.cards.realUsers.description'),
      teaser: isRtl ? 'مستخدمون حقيقيون' : 'Real users',
      highlights: isRtl
        ? [
            'رحلة مستخدم بسيطة وبديهية',
            'واجهة نظيفة وسهلة الاستخدام',
            'أداء سريع وفعّال',
            'مزامنة فورية عبر جميع القنوات',
          ]
        : [
            'Simple & Intuitive User Journey',
            'Clean, User-Friendly Interface',
            'Fast & Efficient Performance',
            'Real-Time Synchronization Across All Channels',
          ],
    },
    {
      id: 'security',
      icon: ShieldCheck,
      cardTitle: t('landing.features.cards.security.title'),
      title: t('landing.features.cards.security.title'),
      description: t('landing.features.cards.security.description'),
      teaser: isRtl ? 'أمان' : 'Security',
      highlights: isRtl
        ? [
            'تشفير كامل للبيانات أثناء النقل والتخزين',
            'نسخ احتياطي وأرشفة تلقائية',
            'استثمار في حماية على مستوى المؤسسات',
          ]
        : [
            'Fully encrypted data in transit and at rest',
            'Automatic backups and secure archival',
            'Enterprise-grade protection investment',
          ],
    },
    {
      id: 'multiBranch',
      icon: Settings,
      cardTitle: t('landing.features.cards.multiBranch.title'),
      title: t('landing.features.cards.multiBranch.title'),
      description: t('landing.features.cards.multiBranch.description'),
      teaser: isRtl ? 'فروع متعددة' : 'Multi-branch',
      highlights: isRtl
        ? [
            'لوحة تحكم مركزية للعلامة التجارية للمواقع المرتبطة',
            'إنشاء مواقع جديدة أو نقاط بيع إضافية داخل المواقع الحالية بسهولة',
            'فصل المواقع أو العلامات التجارية في أي وقت بسلاسة',
          ]
        : [
            'Access a Centralized Brand Dashboard for Connected Locations',
            'Easily Create New Locations or Additional POS Points Within Existing Locations',
            'Seamlessly Disconnect Locations or Separate Brands Anytime',
          ],
    },
  ];

  const handleOpen = useCallback((index: number) => {
    setDirection(1);
    setActiveCard(index);
  }, []);
  const handleClose = useCallback(() => setActiveCard(null), []);
  const handlePrev = useCallback(() => {
    setDirection(isRtl ? 1 : -1);
    setActiveCard((i) => (i === null ? null : (i - 1 + features.length) % features.length));
  }, [features.length, isRtl]);
  const handleNext = useCallback(() => {
    setDirection(isRtl ? -1 : 1);
    setActiveCard((i) => (i === null ? null : (i + 1) % features.length));
  }, [features.length, isRtl]);
  const handleJumpTo = useCallback((target: number) => {
    setActiveCard((i) => {
      if (i === null) return target;
      setDirection(target > i ? 1 : -1);
      return target;
    });
  }, []);

  useModalKeyboardGuard({
    isOpen: activeCard !== null,
    onClose: handleClose,
    onNext: handleNext,
    onPrev: handlePrev,
    isRtl,
    hideChatWidget: true,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVideoLoaded) {
            setIsVideoVisible(true);
            setIsVideoLoaded(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px', threshold: 0 },
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, [isVideoLoaded]);

  return (
    <section
      id="why-mintcom"
      className="relative overflow-hidden bg-gray-50 py-16 dark:bg-[#0f0f0f] lg:py-20"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="absolute end-0 top-0 -z-10 h-[600px] w-[600px] rounded-full bg-mintcom-green/5 blur-[120px]" />
      <div className="absolute bottom-0 start-0 -z-10 h-[400px] w-[400px] rounded-full bg-mintcom-green/3 blur-[100px]" />

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center lg:mb-16"
        >
          <div className="mb-8 inline-flex max-w-full items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-mintcom-green shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:border-white/10 dark:shadow-none">
              <Store size={14} strokeWidth={2.4} className="text-black" />
            </span>
            <span aria-hidden="true" className="h-4 w-px bg-black/15 dark:bg-white/20" />
            <span className="min-w-0 text-[13px] font-semibold leading-snug tracking-widest uppercase text-gray-900 dark:text-white/85 md:text-sm">
              {t('landing.features.badge')}
            </span>
          </div>

          <h2 className="mb-6 font-magilio text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-6xl">
            <span className="text-gray-900 dark:text-white">{t('landing.features.title')}</span>{' '}
            <span className="text-mintcom-green">{t('landing.features.titleHighlight')}</span>
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl">
            {t('landing.features.subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-col gap-16 lg:gap-24">
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4">
            {features.map((feature, index) => (
              <LandingFeatureCard
              key={feature.id ?? index}
              title={feature.cardTitle}
              description={feature.description}
              icon={feature.icon}
              index={index}
              readMoreText={t("landing.features.readMore", "Learn more")}
              onOpen={handleOpen}
            />
            ))}
          </div>

          {/* Video Section — ambient demo loop + Try POS CTA (no modal) */}
          <motion.div
            ref={videoRef}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="mx-auto w-full"
          >
            <div className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] dark:border-white/10">
              {isVideoVisible && demoIsNative ? (
                <video
                  src={demoSrc}
                  poster={DEMO_VIDEO_POSTER_URL}
                  className="h-full w-full scale-[1.01] object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label={t('landing.features.videoTitle')}
                />
              ) : isVideoVisible && !demoIsNative ? (
                <iframe
                  src={demoSrc}
                  className="pointer-events-none h-full w-full scale-[1.01] object-cover"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  title={t('landing.features.videoTitle')}
                />
              ) : (
                <img
                  src={DEMO_VIDEO_POSTER_URL}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              )}

              {/* Cinematic bottom fade — keeps UI readable without covering the product */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />

              {/* Caption + Try POS — no play overlay, no live-demo badge, no fullscreen */}
              <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-8 md:p-10 lg:p-12">
                <div className="flex max-w-3xl flex-col items-start gap-4 sm:gap-5">
                  <div>
                    <h4 className="mb-2 font-sans text-3xl font-bold tracking-tight text-white xs:text-4xl md:text-5xl lg:text-6xl">
                      {t('landing.features.seeInAction')}
                    </h4>
                    <p className="max-w-2xl text-base font-medium text-white/70 sm:text-lg md:text-xl lg:text-2xl">
                      {t('landing.features.seamlessSync')}
                    </p>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => window.open('/try-pos', '_blank', 'noopener,noreferrer')}
                    className="group/cta inline-flex items-center gap-3 rounded-2xl bg-mintcom-green px-6 py-3.5 text-base font-bold text-black shadow-[0_12px_40px_-10px_rgba(124,195,159,0.65)] transition-shadow hover:shadow-[0_16px_48px_-8px_rgba(124,195,159,0.8)] sm:px-8 sm:py-4 sm:text-lg md:text-xl"
                  >
                    <Play size={18} fill="currentColor" className="shrink-0 sm:h-5 sm:w-5" />
                    <span>{t('landing.hero.tryDesktop')}</span>
                    <ArrowRight
                      size={20}
                      className={`shrink-0 transition-transform sm:h-6 sm:w-6 ${isRtl ? 'rotate-180 group-hover/cta:-translate-x-0.5' : 'group-hover/cta:translate-x-0.5'}`}
                    />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {activeCard !== null && (
          <FeatureModal
            features={features}
            activeIndex={activeCard}
            direction={direction}
            onClose={handleClose}
            onPrev={handlePrev}
            onNext={handleNext}
            onJumpTo={handleJumpTo}
            t={t}
            isRtl={isRtl}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

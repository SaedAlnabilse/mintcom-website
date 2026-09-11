import { modalSlideVariants as slideVariants } from "./landing/modalSlideVariants";
import { SectionCarouselFooter } from "./landing/SectionCarouselFooter";
import { LandingFeatureCard } from './landing/LandingFeatureCard';
import { useModalKeyboardGuard } from '../hooks/useModalKeyboardGuard';
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MINTCOM_PRICING } from '../config/pricing';
import {
  CreditCard,
  ShieldCheck,
  Users,
  BarChart3,
  ChefHat,
  Building2,
  LayoutDashboard,
  Zap,
  Lock,
  Heart,
  Smartphone,
  Sparkles,
  Grid3x3,
  Gem,
  Puzzle,
  DollarSign,
  X,
  type LucideIcon,
} from 'lucide-react';
import MintcomLeafIcon from '../assets/small-logo.svg';
import { FeatureInteractiveDemo, hasInteractiveDemo } from './FeatureInteractiveDemos';

type WorkflowFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
  id?: string;
};



/** Same open/slide motion language as Why Mintcom FeatureModal */


/** Shared preview frame for every Features modal card (incl. mobile) — same 3:2 as sales. */
const FEATURE_PREVIEW_FRAME_CLASS = 'aspect-[3/2] w-full overflow-hidden';


const WorkflowFeatureModal = ({
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
  features: WorkflowFeature[];
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
  const hasPreview = hasInteractiveDemo(feature.id);
  // All feature cards use the same split layout + modal size (Why Mintcom pattern)
  const isSplitLayout = hasPreview;

  const featureHighlights = (id?: string): string[] => {
    const key = id ?? '';
    const defaults: Record<string, string[]> = {
      pointOfSale: [
        'Browse by category or All menu',
        'Build orders with add-ons & qty',
        'Charge with card, cash, or other',
      ],
      salesControl: [
        'Accept Cash, Card, and Multiple Payment Methods',
        'Integrated E-Invoicing and E-Tax Configuration',
        'Add Custom Fixed Charges or Fees with the Flexibility to Modify Them During Orders',
      ],
      staffManagement: [
        'Add team members with username & password',
        'Assign roles & fine-grained permissions',
        'Access updates instantly on every POS',
      ],
      advancedReporting: [
        'Sales Reports by Payment Method',
        'Pay-In and Pay-Out Transaction Reports',
        'Detailed Shift and Working Hours Reports Across Different Time Periods',
        'Reports by Items, Categories, and Add-Ons for Deeper Sales Insights',
      ],
      production: [
        'Raw materials grid with stock & unit cost',
        'Low-stock badges and one-tap restock',
        'Recipes for prepared items & menu products',
      ],
      aiSystem: [
        'Generate Product Images Easily',
        'Receive Full, Streamlined Guidance Throughout the App',
        'Get Morning and Weekly Business Operation Briefs',
        'Receive Smart Suggestions to Improve Location Management and Increase Sales',
      ],
      multiBranch: [
        'Create and Manage Multiple POS Points and Locations Through One Centralized Portal',
        'Enjoy Special Discounts for Additional Locations',
        'Streamline Staff Management and Role Assignments Across All Locations',
      ],
      simpleUI: [
        'Clean and User-Friendly Interface',
        'Helpful In-App Tooltips and Info Boxes for Step-by-Step Guidance',
        'Fast, Responsive, and Efficient User Actions',
      ],
      fastOnboarding: [
        'Add staff from dashboard Staff in seconds',
        'Set role, username & password once',
        'They log in on POS with the same password',
      ],
      secure: [
        'Password re-auth for high-impact actions',
        'Role-based access for every staff member',
        'Security tips built into the owner portal',
      ],
      loyalty: [
        'Create Custom Rewards Programs',
        'Build and Manage a Comprehensive Customer Database',
        'QR Code–Enabled Customer Loyalty System',
      ],
      mobileApp: [
        'Live Notifications feed for all locations',
        'Cash, stock & refund tabs with unread badges',
        'iOS push banners that open the right alert',
      ],
    };
    // Do NOT load these via t('…highlights.x.0') — missing keys hit parseMissingKeyHandler
    // which returns the leaf segment ("0"/"1"/"2") instead of the defaultValue.
    return defaults[key] ?? [
      'See the real Mintcom interface',
      'Same screens as Try POS & dashboard',
      'Built for busy businesses',
    ];
  };

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

      {/* Same shell / open animation as Why Mintcom FeatureModal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 16 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_-16px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#121212]"
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

        {/* Natural scroll body like Why — no locked bodyHeight (that fought first-open scale) */}
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
              {isSplitLayout ? (
                <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(320px,1.22fr)] lg:gap-8">
                  <div className="order-2 min-w-0 lg:order-1">
                    <h3 className="line-clamp-2 font-sans text-2xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white md:text-3xl lg:text-[2rem]">
                      {feature.title}
                    </h3>
                    <p className="mt-3 line-clamp-5 max-w-md font-sans text-[15px] font-medium leading-relaxed text-gray-600 dark:text-gray-300 md:text-base">
                      {feature.description}
                    </p>
                    <ul className="mt-5 space-y-2.5">
                      {featureHighlights(feature.id).map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mintcom-green" />
                          <span className="line-clamp-2">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Identical 3:2 frame on every card (incl. #12 mobile) for height consistency */}
                  <div className="order-1 w-full min-w-0 lg:order-2">
                    <div className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-lg shadow-black/10 dark:border-white/10 dark:bg-mintcom-dark dark:shadow-black/40">
                      <div className={FEATURE_PREVIEW_FRAME_CLASS}>
                        <FeatureInteractiveDemo
                          featureId={feature.id}
                          t={t}
                          isRtl={isRtl}
                          side
                          fill
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <h3 className="line-clamp-2 font-sans text-2xl font-bold leading-snug tracking-tight text-gray-900 dark:text-white md:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-4 line-clamp-8 font-sans text-base font-medium leading-relaxed text-gray-600 dark:text-gray-300 md:text-[17px]">
                    {feature.description}
                  </p>
                </div>
              )}
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

export const Features = () => {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';
  const monthlyPrice = MINTCOM_PRICING.primary.monthly;
  const currency = MINTCOM_PRICING.currency;
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [direction, setDirection] = useState(1);

  const workflowFeatures: WorkflowFeature[] = [
    {
      id: 'pointOfSale',
      title: t('landing.workflow.pointOfSale.title'),
      description: t('landing.workflow.pointOfSale.description'),
      icon: CreditCard,
    },
    {
      id: 'salesControl',
      title: t('landing.workflow.salesControl.title'),
      description: t('landing.workflow.salesControl.description'),
      icon: ShieldCheck,
    },
    {
      id: 'staffManagement',
      title: t('landing.workflow.staffManagement.title'),
      description: t('landing.workflow.staffManagement.description'),
      icon: Users,
    },
    {
      id: 'advancedReporting',
      title: t('landing.workflow.advancedReporting.title'),
      description: t('landing.workflow.advancedReporting.description'),
      icon: BarChart3,
    },
    {
      id: 'production',
      title: t('landing.workflow.production.title'),
      description: t('landing.workflow.production.description'),
      icon: ChefHat,
    },
    {
      id: 'aiSystem',
      title: t('landing.workflow.aiSystem.title'),
      description: t('landing.workflow.aiSystem.description'),
      icon: Sparkles,
    },
    {
      id: 'multiBranch',
      title: t('landing.workflow.multiBranch.title'),
      description: t('landing.workflow.multiBranch.description'),
      icon: Building2,
    },
    {
      id: 'simpleUI',
      title: t('landing.workflow.simpleUI.title'),
      description: t('landing.workflow.simpleUI.description'),
      icon: LayoutDashboard,
    },
    {
      id: 'fastOnboarding',
      title: t('landing.workflow.fastOnboarding.title'),
      description: t('landing.workflow.fastOnboarding.description'),
      icon: Zap,
    },
    {
      id: 'secure',
      title: t('landing.workflow.secure.title'),
      description: t('landing.workflow.secure.description'),
      icon: Lock,
    },
    {
      id: 'loyalty',
      title: t('landing.workflow.loyalty.title'),
      description: t('landing.workflow.loyalty.description'),
      icon: Heart,
    },
    {
      id: 'mobileApp',
      title: t('landing.workflow.mobileApp.title'),
      description: t('landing.workflow.mobileApp.description'),
      icon: Smartphone,
    },
  ];

  const handleOpen = useCallback((index: number) => {
    setDirection(1);
    setActiveCard(index);
  }, []);
  const handleClose = useCallback(() => setActiveCard(null), []);
  const handlePrev = useCallback(() => {
    setDirection(-1);
    setActiveCard((i) => (i === null ? null : (i - 1 + workflowFeatures.length) % workflowFeatures.length));
  }, [workflowFeatures.length]);
  const handleNext = useCallback(() => {
    setDirection(1);
    setActiveCard((i) => (i === null ? null : (i + 1) % workflowFeatures.length));
  }, [workflowFeatures.length]);
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

  return (
    <section
      id="features"
      className="py-16 lg:py-24 bg-white dark:bg-[#0f0f0f] overflow-hidden relative"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-mintcom-green/5 rounded-full blur-[120px] -z-10" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-mintcom-green/5 rounded-full blur-[100px] -z-10" />

      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 lg:mb-16 mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-flex max-w-full items-center gap-2.5 mx-auto"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-black/10 bg-mintcom-green shadow-[0_1px_2px_rgba(0,0,0,0.12)] dark:border-white/10 dark:shadow-none">
              <DollarSign size={14} strokeWidth={2.4} className="text-black" />
            </span>
            <span aria-hidden="true" className="h-4 w-px bg-black/15 dark:bg-white/20" />
            <span className="min-w-0 text-[13px] font-semibold leading-snug tracking-widest uppercase text-gray-900 dark:text-white/85 md:text-sm">
              {t('landing.workflow.badge')}
            </span>
          </motion.div>

          <h2 className="text-[clamp(1rem,4.2vw,3.75rem)] whitespace-nowrap font-bold font-magilio mb-6 leading-tight tracking-tight">
            <span className="text-gray-900 dark:text-white">{t('landing.workflow.title')} </span>
            <span className="bg-mintcom-green text-gray-900 dark:text-gray-900 px-2 rounded-sm">
              {t('landing.workflow.titleHighlight', { price: monthlyPrice, currency })}
            </span>
          </h2>
          {t('landing.workflow.subtitle') && (
            <p className="max-w-3xl mx-auto text-base font-light leading-relaxed text-gray-600 dark:text-gray-400 xs:text-lg sm:text-xl">
              {t('landing.workflow.subtitle')}
            </p>
          )}
        </motion.div>

        <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6 xl:grid-cols-4">
          {workflowFeatures.map((feature, index) => (
            <LandingFeatureCard
              key={feature.id ?? index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              index={index}
              readMoreText={t("landing.features.readMore", "Learn more")}
              onOpen={handleOpen}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeCard !== null && (
          <WorkflowFeatureModal
            features={workflowFeatures}
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

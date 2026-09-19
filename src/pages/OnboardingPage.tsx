import { useState, useEffect, useMemo, useCallback, useRef, type ReactNode } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { TourGuide, type TourStep } from '../components/TourGuide';
import { useTranslation } from 'react-i18next';
import {
  Store,
  MapPin,
  DollarSign,
  User,
  Lock,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CreditCard,
  Building2,
  KeyRound,
  Hash,
  ShieldCheck,
  Plus,
  ChevronDown,
  Copy,
  Box,
  Tags,
  Eye,
  EyeOff,
  Smartphone,
  Tablet,
  BookOpen,
  Settings,
  PlayCircle,
  ExternalLink,
  HelpCircle,
  Shield,
  Scale,
  Info,
  Globe,
  RefreshCw,
  CalendarClock,
  LayoutDashboard,
  Users,
  GitBranch,
  Repeat,
  Megaphone,
  Phone
} from 'lucide-react';
import MintcomLeafIcon from '../assets/small-logo.svg';
import MintcomLeafIconWhite from '../assets/small-logo-white.svg';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { QuickInfo } from '../components/QuickInfo';
import { formatCurrencyCode } from '../utils/currency';
import {
  ANDROID_DOWNLOAD_URL,
  IOS_DOWNLOAD_URL,
  OWNER_ANDROID_DOWNLOAD_URL,
  OWNER_IOS_DOWNLOAD_URL,
  ONBOARDING_VIDEO_URL,
  isDirectInstallerDownload,
} from '../config/downloads';
import {
  BILLING_CYCLES,
  type BillingCycle,
  getMintcomPrice,
  getMintcomYearlySavings,
  getMintcomDiscountPercent,
  MINTCOM_PRICING,
} from '../config/pricing';
import { computeVat } from '../config/vat';

// Mintcom Logo imports
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';
import AppStoreBadge from '../assets/app-store-badge.svg';
import GooglePlayBadge from '../assets/google-play-badge.svg';
import { formatInputPlaceholder } from '../utils/textCase';
import {
  getBestTimeZoneForCountry,
  getCountryOptions,
  getCountryPrimaryCurrency,
  getCountryTimeZones,
  getCurrencyOptions,
  getDeviceTimeZone,
  normalizeTimeZone,
} from '../data/globalLocaleOptions';
import { getLocalizedManual } from '../utils/localizedDocs';
import { getPasswordSchema } from '../utils/validation';
import {
  detectCardBrand,
  formatCardNumberInput,
  formatExpiryInput,
  getCardCvvLength,
  getCardDigits,
  isValidCardNumber,
  parseExpiryDate,
  PAYMENT_CARD_API_BRAND,
  MAX_FORMATTED_CARD_NUMBER_LENGTH,
} from '../utils/paymentCard';
import { TEXT_INPUT_LIMITS } from '../config/textLimits';
import { onboardingApi, type OnboardingProfilePayload } from '../services/onboardingApi';
import { useBlockHistoryBack } from '../hooks/useBlockHistoryBack';
import {
  clampPhase,
  isLaunchLocked,
  isOnboardingPhaseSlug,
  mapApiPhase,
  phaseToStepNumber,
  stepNumberToPhase,
  type OnboardingPhaseSlug,
} from '../utils/onboardingPhases';

const ONBOARDING_LAUNCH_STORAGE_KEY = 'mintcom.onboarding.launch.v1';

/** Never persist secrets (passwords / card fields) in sessionStorage. */
const SAFE_DRAFT_KEYS = [
  'name',
  'type',
  'country',
  'currency',
  'address',
  'timezone',
  'establishmentLoginId',
  'firstName',
  'lastName',
  'username',
  'lockedOwner',
  'duplicateFromId',
  'duplicateInventory',
  'duplicateDiscounts',
  'duplicatePaymentMethods',
  'establishmentId',
  'contactPhone',
  'staffSize',
  'branchesPlanned',
  'currentPos',
  'heardAbout',
  'referralCode',
  'marketingConsent',
  'billingCycle',
] as const;

const STAFF_OPTIONS = [
  { value: '1 to 5', labelKey: 'onboarding.businessProfile.staffOptions.1-5' },
  { value: '6 to 15', labelKey: 'onboarding.businessProfile.staffOptions.6-15' },
  { value: '16 to 50', labelKey: 'onboarding.businessProfile.staffOptions.16-50' },
  { value: '50+', labelKey: 'onboarding.businessProfile.staffOptions.50+' },
];

const BRANCH_OPTIONS = [
  { value: 'Just this one', labelKey: 'onboarding.businessProfile.branchesOptions.single' },
  { value: '2 to 5', labelKey: 'onboarding.businessProfile.branchesOptions.2-5' },
  { value: '5+', labelKey: 'onboarding.businessProfile.branchesOptions.5+' },
];

const POS_OPTIONS = [
  { value: 'None (new business)', labelKey: 'onboarding.businessProfile.posOptions.none' },
  { value: 'Cash / paper', labelKey: 'onboarding.businessProfile.posOptions.cash' },
  { value: 'Square', labelKey: 'onboarding.businessProfile.posOptions.square' },
  { value: 'Foodics', labelKey: 'onboarding.businessProfile.posOptions.foodics' },
  { value: 'Other POS', labelKey: 'onboarding.businessProfile.posOptions.other' },
];

const SOURCE_OPTIONS = [
  { value: 'Google', labelKey: 'onboarding.businessProfile.sourceOptions.google' },
  { value: 'Instagram / TikTok', labelKey: 'onboarding.businessProfile.sourceOptions.social' },
  { value: 'Friend / referral', labelKey: 'onboarding.businessProfile.sourceOptions.referral' },
  { value: 'Partner', labelKey: 'onboarding.businessProfile.sourceOptions.partner' },
  { value: 'Other', labelKey: 'onboarding.businessProfile.sourceOptions.other' },
];

const normalizeStaffSize = (val?: string) => {
  if (!val) return '';
  if (val === '1–5' || val === '1-5') return '1 to 5';
  if (val === '6–15' || val === '6-15') return '6 to 15';
  if (val === '16–50' || val === '16-50') return '16 to 50';
  return val;
};

const normalizeBranchesPlanned = (val?: string) => {
  if (!val) return '';
  if (val === '2–5' || val === '2-5') return '2 to 5';
  return val;
};

const normalizeCurrentPos = (val?: string) => {
  if (!val) return '';
  if (val === 'None — new business' || val === 'None - new business') return 'None (new business)';
  return val;
};


const sanitizeDraftForStorage = (value: Record<string, unknown>) => {
  const safe: Record<string, unknown> = {};
  for (const key of SAFE_DRAFT_KEYS) {
    if (value[key] !== undefined) {
      safe[key] = value[key];
    }
  }
  return safe;
};

const readStoredLaunchData = () => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = sessionStorage.getItem(ONBOARDING_LAUNCH_STORAGE_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch {
    return {};
  }
};

const persistStoredLaunchData = (value: Record<string, unknown>) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.setItem(
      ONBOARDING_LAUNCH_STORAGE_KEY,
      JSON.stringify(sanitizeDraftForStorage(value)),
    );
  } catch (error) {
    console.warn('[Onboarding] Failed to persist launch data:', error);
  }
};

const CARD_INPUT_CLASS =
  'min-w-0 w-full flex-1 bg-transparent font-sans text-sm font-bold leading-none text-stone-900 dark:text-zinc-100 placeholder:font-sans placeholder:font-medium placeholder:text-stone-400 focus:outline-none';

function EmbeddedCardField({
  label,
  error,
  children,
}: {
  label: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block w-full min-w-0">
      <span className="mb-1.5 flex min-h-[1.125rem] items-center gap-1 text-sm font-sans leading-relaxed text-stone-600 dark:text-zinc-300">
        {label}
      </span>
      <span
        className={`flex min-h-12 w-full items-center gap-2 rounded-2xl border bg-white px-4 py-3 transition focus-within:border-mintcom-green focus-within:ring-2 focus-within:ring-mintcom-green/20 dark:bg-zinc-900/60 ${
          error
            ? 'border-mintcom-red ring-2 ring-mintcom-red/20'
            : 'border-stone-200 dark:border-zinc-800'
        }`}
      >
        {children}
      </span>
      <span className="mt-1 block min-h-[1rem] text-xs font-sans font-semibold text-mintcom-red">
        {error || '\u00A0'}
      </span>
    </label>
  );
}

function CardBrandMark({ brand }: { brand: 'mastercard' | 'visa' | 'amex' }) {
  // Equal-height badges so Visa / Mastercard / Amex align consistently across
  // OS fonts. The three used to differ in more than height: Mastercard was
  // 11px/bold, Visa 11px/black with extra tracking, and Amex a 9px pill — three
  // typographic treatments inside identical shells, which read as misalignment
  // (TC-045). They now share one label style; only the brand mark differs.
  const shell =
    'inline-flex h-8 min-w-[4.5rem] items-center justify-center gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 font-sans text-[11px] font-bold leading-none tracking-wide text-stone-600 dark:border-zinc-800 dark:bg-zinc-800 dark:text-stone-300';
  const labelClass = 'font-sans text-[11px] font-bold leading-none tracking-wide';

  if (brand === 'mastercard') {
    return (
      <span className={shell} aria-label="Mastercard">
        <span className="relative inline-block h-3.5 w-6 shrink-0" aria-hidden>
          <span className="absolute left-0 top-0 h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
          <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-[#F79E1B]/90" />
        </span>
        <span className={labelClass}>Mastercard</span>
      </span>
    );
  }

  if (brand === 'visa') {
    return (
      <span className={shell} aria-label="Visa">
        <span className={`${labelClass} text-[#1A4F9C] dark:text-[#6B9FE8]`}>
          VISA
        </span>
      </span>
    );
  }

  return (
    <span className={shell} aria-label="American Express">
      <span className={`${labelClass} text-[#2E77BC] dark:text-[#6BA6DC]`}>
        AMEX
      </span>
    </span>
  );
}


export function OnboardingPage() {
  const { t, i18n } = useTranslation();
  const isRTL = t('common.locale') === 'ar';
  const locale = t('common.locale');
  const userManualDoc = getLocalizedManual('user', i18n.language);
  const setupManualDoc = getLocalizedManual('setup', i18n.language);
  const countryOptions = useMemo(() => getCountryOptions(locale), [locale]);
  const allCurrencyOptions = useMemo(() => getCurrencyOptions(locale), [locale]);
  const hasAndroidDownload = Boolean(ANDROID_DOWNLOAD_URL);
  const hasIosDownload = Boolean(IOS_DOWNLOAD_URL);
  const hasOwnerAndroidDownload = Boolean(OWNER_ANDROID_DOWNLOAD_URL);
  const hasOwnerIosDownload = Boolean(OWNER_IOS_DOWNLOAD_URL);
  const hasVideoGuide = Boolean(ONBOARDING_VIDEO_URL);
  const navigate = useNavigate();
  const params = useParams<{ step?: string; phase?: string }>();
  const stepParam = params.step;
  const phaseParam = params.phase;

  // Step 1: Location Details
  const step1Schema = z.object({
    name: z
      .string()
      .min(1, t('onboarding.step1.errors.nameRequired'))
      .max(
        TEXT_INPUT_LIMITS.BUSINESS_NAME,
        t('onboarding.step1.errors.nameMax', {
          defaultValue: `Location name must be at most ${TEXT_INPUT_LIMITS.BUSINESS_NAME} characters`,
          count: TEXT_INPUT_LIMITS.BUSINESS_NAME,
        }),
      ),
    type: z.string().min(1, t('onboarding.step1.errors.typeRequired')),
    country: z.string().min(1, t('onboarding.step1.errors.countryRequired', { defaultValue: 'Country is required' })),
    address: z.string().min(1, t('onboarding.step1.errors.addressRequired')),
    currency: z.string().min(1, t('onboarding.step1.errors.currencyRequired')),
    timezone: z.string().min(1, t('onboarding.step1.errors.timezoneRequired', { defaultValue: 'Timezone is required' })),
  });

  // Step 2: Location Login
  const step2Schema = z.object({
    establishmentLoginId: z.string()
      .min(4, t('onboarding.step3.errors.idMin'))
      .regex(/^[a-zA-Z0-9_-]+$/, t('onboarding.step3.errors.idRegex')),
    establishmentPassword: getPasswordSchema(t),
  });

  // Step 3: Admin Access (owner login credentials)
  const step3Schema = z.object({
    username: z.string()
      .trim()
      .min(1, t('onboarding.step4.errors.usernameMin')),
    password: getPasswordSchema(t),
    firstName: z.string().min(2, t('onboarding.step4.errors.firstNameMin')),
    lastName: z.string().min(2, t('onboarding.step4.errors.lastNameMin')),
  });

  // Step 4: Payment Method
  const step4Schema = z.object({
    cardNumber: z.string(),
    expiryDate: z.string(),
    cvv: z.string(),
    cardName: z.string(),
  }).superRefine((value, ctx) => {
    const cardDigits = getCardDigits(value.cardNumber);
    const parsedExpiry = parseExpiryDate(value.expiryDate);
    const brand = detectCardBrand(cardDigits);
    const cvvLength = getCardCvvLength(brand);

    if (!isValidCardNumber(cardDigits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cardNumber'],
        message: t('paymentMethods.modal.errors.invalidCardNumber', {
          defaultValue: 'Enter a valid card number',
        }),
      });
    }

    if (!parsedExpiry) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiryDate'],
        message: t('paymentMethods.modal.errors.invalidExpiry', {
          defaultValue: 'Invalid expiry date',
        }),
      });
    }

    if (getCardDigits(value.cvv).length !== cvvLength) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cvv'],
        message: t('paymentMethods.modal.errors.invalidCvv', {
          defaultValue: 'Enter a valid CVV',
        }),
      });
    }

    if (!value.cardName.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cardName'],
        message: t('onboarding.step2.errors.cardNameRequired', {
          defaultValue: 'Name on card is required',
        }),
      });
    }
  });

  const { refreshEstablishments, account, needsOnboarding, setCurrentEstablishment, establishments, updateAccount } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [serverPhase, setServerPhase] = useState<OnboardingPhaseSlug>('location');
  const [apiPhase, setApiPhase] = useState<string>('PROFILE');
  const sessionBootRef = useRef(false);

  const [formData, setFormData] = useState<any>(() => readStoredLaunchData());
  const [contactPhone, setContactPhone] = useState<string>(() => formData.contactPhone || '');
  const [staffSize, setStaffSize] = useState<string>(() => normalizeStaffSize(formData.staffSize));
  const [branchesPlanned, setBranchesPlanned] = useState<string>(() => normalizeBranchesPlanned(formData.branchesPlanned));
  const [currentPos, setCurrentPos] = useState<string>(() => normalizeCurrentPos(formData.currentPos));
  const [heardAbout, setHeardAbout] = useState<string>(() => formData.heardAbout || '');
  const [referralCode, setReferralCode] = useState<string>(() => formData.referralCode || '');
  const [marketingConsent, setMarketingConsent] = useState<boolean>(() => !!formData.marketingConsent);
  const launchLocked = isLaunchLocked(serverPhase, apiPhase);

  const [useSavedCard, setUseSavedCard] = useState<boolean>(() => formData.useSavedCard ?? true);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(() => (formData.billingCycle as BillingCycle) || MINTCOM_PRICING.defaultBillingCycle);
  // Explicit, unticked-by-default authorization for recurring billing. Required
  // by card-network / consumer-protection rules for negative-option billing.
  const [billingConsent, setBillingConsent] = useState<boolean>(() => formData.billingConsent ?? false);
  const [consentError, setConsentError] = useState(false);

  const isAdditionalLocation = establishments.length > 0;

  // Password Visibility State
  const [showEstablishmentPassword, setShowEstablishmentPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Duplication State
  const [duplicateFromId, setDuplicateFromId] = useState<string>(() => formData.duplicateFromId || '');
  const [duplicateInventory, setDuplicateInventory] = useState<boolean>(() => formData.duplicateInventory ?? true);
  const [duplicateDiscounts, setDuplicateDiscounts] = useState<boolean>(() => formData.duplicateDiscounts ?? true);
  const [duplicatePaymentMethods, setDuplicatePaymentMethods] = useState<boolean>(() => formData.duplicatePaymentMethods ?? true);
  const [ownerLogin, setOwnerLogin] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    email?: string | null;
  } | null>(null);
  const [isOwnerLoginLoading, setIsOwnerLoginLoading] = useState(false);

  const handleDuplicateSourceChange = (sourceId: string) => {
    setDuplicateFromId(sourceId);

    if (sourceId) {
      setDuplicateInventory(true);
      setDuplicateDiscounts(true);
      setDuplicatePaymentMethods(true);
      updateFormData((prev: any) => ({
        ...prev,
        duplicateFromId: sourceId,
        duplicateInventory: true,
        duplicateDiscounts: true,
        duplicatePaymentMethods: true,
      }));
    } else {
      updateFormData((prev: any) => ({
        ...prev,
        duplicateFromId: '',
        duplicateInventory: false,
        duplicateDiscounts: false,
        duplicatePaymentMethods: false,
      }));
    }
  };

  // Tour Guide State for Step 5
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<'id' | 'password' | null>(null);
  const [showStep5Password, setShowStep5Password] = useState(false);

  const handleCopyField = (text: string, field: 'id' | 'password') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const applyServerSession = useCallback((session: {
    phase: string;
    draft?: Record<string, unknown>;
    establishmentId?: string;
    reservedLoginId?: string;
  }) => {
    const mapped = mapApiPhase(session.phase);
    setApiPhase(session.phase);
    setServerPhase(mapped);
    if (session.draft && typeof session.draft === 'object') {
      const draft = session.draft as Record<string, unknown>;
      if (typeof draft.contactPhone === 'string') setContactPhone(draft.contactPhone);
      if (typeof draft.staffSize === 'string') setStaffSize(normalizeStaffSize(draft.staffSize));
      if (typeof draft.branchesPlanned === 'string') setBranchesPlanned(normalizeBranchesPlanned(draft.branchesPlanned));
      if (typeof draft.currentPos === 'string') setCurrentPos(normalizeCurrentPos(draft.currentPos));
      if (typeof draft.heardAbout === 'string') setHeardAbout(draft.heardAbout);
      if (typeof draft.referralCode === 'string') setReferralCode(draft.referralCode);
      if (typeof draft.marketingConsent === 'boolean') setMarketingConsent(draft.marketingConsent);
      if (typeof draft.duplicateFromId === 'string') setDuplicateFromId(draft.duplicateFromId);
      if (typeof draft.duplicateInventory === 'boolean') setDuplicateInventory(draft.duplicateInventory);
      if (typeof draft.duplicateDiscounts === 'boolean') setDuplicateDiscounts(draft.duplicateDiscounts);
      if (typeof draft.duplicatePaymentMethods === 'boolean') setDuplicatePaymentMethods(draft.duplicatePaymentMethods);
      if (typeof draft.billingCycle === 'string' && (draft.billingCycle === 'monthly' || draft.billingCycle === 'yearly')) {
        setBillingCycle(draft.billingCycle as BillingCycle);
      }

      setFormData((prev: any) => {
        const merged = {
          ...prev,
          ...sanitizeDraftForStorage(session.draft as Record<string, unknown>),
          ...(session.establishmentId ? { establishmentId: session.establishmentId } : {}),
          ...(session.reservedLoginId ? { establishmentLoginId: prev.establishmentLoginId || session.reservedLoginId } : {}),
        };
        persistStoredLaunchData(merged);
        return merged;
      });
    } else if (session.establishmentId || session.reservedLoginId) {
      setFormData((prev: any) => {
        const merged = {
          ...prev,
          ...(session.establishmentId ? { establishmentId: session.establishmentId } : {}),
          ...(session.reservedLoginId ? { establishmentLoginId: prev.establishmentLoginId || session.reservedLoginId } : {}),
        };
        persistStoredLaunchData(merged);
        return merged;
      });
    }
    return mapped;
  }, []);

  const resolveRequestedPhase = useCallback((): OnboardingPhaseSlug | undefined => {
    if (isOnboardingPhaseSlug(phaseParam)) {
      return phaseParam;
    }
    const legacyStep = Number(stepParam);
    if (Number.isInteger(legacyStep) && stepNumberToPhase[legacyStep]) {
      return stepNumberToPhase[legacyStep];
    }
    return undefined;
  }, [phaseParam, stepParam]);

  const goToPhase = useCallback(
    (
      nextPhase: OnboardingPhaseSlug,
      options?: {
        force?: boolean;
        serverPhaseOverride?: OnboardingPhaseSlug;
        apiPhaseOverride?: string;
      },
    ) => {
      const activeServer = options?.serverPhaseOverride ?? serverPhase;
      const activeApi = options?.apiPhaseOverride ?? apiPhase;
      if (options?.serverPhaseOverride) {
        setServerPhase(options.serverPhaseOverride);
      }
      if (options?.apiPhaseOverride) {
        setApiPhase(options.apiPhaseOverride);
      }

      const locked = options?.force
        ? false
        : isLaunchLocked(activeServer, activeApi);
      const effective = options?.force
        ? nextPhase
        : clampPhase(nextPhase, activeServer, locked);
      const finalPhase =
        isLaunchLocked(activeServer, activeApi) && !options?.force
          ? 'launch'
          : effective;
      setStep(phaseToStepNumber[finalPhase]);
      navigate(`/onboarding/${finalPhase}`, { replace: true });
    },
    [apiPhase, navigate, serverPhase],
  );

  /** Back-compat wrapper used by existing step buttons. */
  const goToStep = (nextStep: number) => {
    if (launchLocked) {
      goToPhase('launch');
      return;
    }
    if (nextStep === 1) {
      goToPhase('business');
      return;
    }
    const phase = stepNumberToPhase[Math.min(5, Math.max(1, nextStep))] || 'location';
    goToPhase(phase);
  };

  const updateFormData = (updater: any) => {
    setFormData((previousValue: any) => {
      const nextValue = typeof updater === 'function' ? updater(previousValue) : updater;
      persistStoredLaunchData(nextValue || {});
      return nextValue;
    });
  };

  // Boot: load server session and clamp URL to allowed phase.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await onboardingApi.getSession();
        if (cancelled) return;

        const wantsNewLocation =
          typeof window !== 'undefined' &&
          new URLSearchParams(window.location.search).get('new') === '1';

        let active = session;
        // Add Location entry: ?new=1 forces a fresh wizard.
        // Do NOT auto-restart plain LAUNCH — that is the post-pay done screen
        // (refresh after first payment must keep the user on launch).
        if (
          !sessionBootRef.current &&
          establishments.length > 0 &&
          (wantsNewLocation || session.phase === 'COMPLETED')
        ) {
          active = await onboardingApi.restart();
        }

        const mapped = applyServerSession(active);
        const locked = isLaunchLocked(mapped, active.phase);
        const requested = resolveRequestedPhase();
        const effective = clampPhase(requested, mapped, locked);
        setStep(phaseToStepNumber[effective]);
        if (phaseParam !== effective || stepParam || wantsNewLocation) {
          navigate(`/onboarding/${effective}`, { replace: true });
        }
        sessionBootRef.current = true;
      } catch (err) {
        console.error('[Onboarding] Failed to load session', err);
        const requested = resolveRequestedPhase();
        const fallback = clampPhase(requested, 'location', false);
        setServerPhase('location');
        setStep(phaseToStepNumber[fallback]);
        navigate(`/onboarding/${fallback}`, { replace: true });
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- boot once per mount / auth account
  }, [account?.id]);

  // Re-clamp when URL changes after boot (tamper / manual navigation).
  useEffect(() => {
    if (!sessionReady) return;
    const requested = resolveRequestedPhase();
    const effective = clampPhase(requested, serverPhase, launchLocked);
    setStep(phaseToStepNumber[effective]);
    if (phaseParam !== effective || stepParam) {
      navigate(`/onboarding/${effective}`, { replace: true });
    }
  }, [
    sessionReady,
    phaseParam,
    stepParam,
    serverPhase,
    launchLocked,
    resolveRequestedPhase,
    navigate,
  ]);

  // Guard: redirect to location form if accessing /onboarding/business without
  // required location data (e.g. direct bookmark, incognito tab).
  useEffect(() => {
    if (!sessionReady) return;
    if (phaseParam === 'business' && !formData.name) {
      navigate('/onboarding/location', { replace: true });
    }
  }, [sessionReady, phaseParam, formData.name, navigate]);

  useBlockHistoryBack(launchLocked && sessionReady, () => {
    toast(
      t('onboarding.security.cannotGoBack', {
        defaultValue: 'Setup is finished. You cannot return to payment.',
      }),
      { icon: '🔒' },
    );
  });

  const launchCenterTourSteps: TourStep[] = [
    {
      targetId: 'tour-open-portal',
      title: t('onboarding.tour.openPortalTitle'),
      description: t('onboarding.tour.openPortalDesc')
    },
    {
      targetId: 'tour-pos-app',
      title: t('onboarding.tour.posAppTitle'),
      description: t('onboarding.tour.posAppDesc')
    },
    {
      targetId: 'tour-owner-app',
      title: t('onboarding.tour.ownerAppTitle'),
      description: t('onboarding.tour.ownerAppDesc')
    },
    {
      targetId: 'tour-chat-bot',
      title: t('onboarding.tour.chatBotTitle'),
      description: t('onboarding.tour.chatBotDesc'),
      position: 'top'
    },
    {
      targetId: 'tour-location-stats',
      title: t('onboarding.tour.locationStatsTitle'),
      description: t('onboarding.tour.locationStatsDesc')
    },
    {
      targetId: 'tour-resources',
      title: t('onboarding.tour.resourcesTitle'),
      description: t('onboarding.tour.resourcesDesc'),
      position: isRTL ? 'right' : 'left'
    }
  ];

  // Auto-start tour when reaching Step 5
  useEffect(() => {
    if (step === 5) {
      // Small delay to let the UI render before starting tour
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Determine if this is a Trial (first est) or Paid (additional est) flow
  const isTrialFlow = needsOnboarding;

  // Only show "Use Saved Card" when the account actually has a saved card.
  // Existing locations do not guarantee a reusable card exists.
  const hasSavedCard = !!account?.defaultCardId || !!account?.defaultPaymentMethod;
  const savedCardLast4 = account?.defaultPaymentMethod || '****';

  // Forms
  const form1 = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: formData.name || '',
      type: formData.type || 'restaurant',
      country: formData.country || 'US',
      timezone: formData.timezone || getBestTimeZoneForCountry(formData.country || 'US', getDeviceTimeZone()),
      currency: formData.currency || 'USD',
      address: formData.address || '',
    }
  });

  const form2 = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      establishmentLoginId: formData.establishmentLoginId || '',
      establishmentPassword: formData.establishmentPassword || '',
    }
  });

  const form3 = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      firstName: formData.firstName || account?.firstName || '',
      lastName: formData.lastName || account?.lastName || '',
      username: formData.username || '',
      password: formData.password || '',
    }
  });

  const form4 = useForm({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      cardNumber: formData.cardNumber || '',
      expiryDate: formData.expiryDate || '',
      cvv: formData.cvv || '',
      cardName: formData.cardName || '',
    },
  });

  // Keep form1 in sync with formData when entering Step 1A or when session data loads
  useEffect(() => {
    if (step !== 1 || phaseParam !== 'location') return;
    const curName = form1.getValues('name');
    const curAddress = form1.getValues('address');
    const curType = form1.getValues('type');
    const curCountry = form1.getValues('country');
    const curTimezone = form1.getValues('timezone');
    const curCurrency = form1.getValues('currency');

    if (!curName && formData.name) form1.setValue('name', formData.name);
    if (!curAddress && formData.address) form1.setValue('address', formData.address);
    if ((!curType || curType === 'restaurant') && formData.type) form1.setValue('type', formData.type);
    if ((!curCountry || curCountry === 'US') && formData.country) form1.setValue('country', formData.country);
    if (!curTimezone && formData.timezone) form1.setValue('timezone', formData.timezone);
    if (!curCurrency && formData.currency) form1.setValue('currency', formData.currency);
  }, [step, phaseParam, formData.name, formData.address, formData.type, formData.country, formData.timezone, formData.currency, form1]);

  // Keep form2 in sync with formData when entering Step 2
  useEffect(() => {
    if (step !== 2) return;
    const curLoginId = form2.getValues('establishmentLoginId');
    const curPassword = form2.getValues('establishmentPassword');
    if (!curLoginId && formData.establishmentLoginId) {
      form2.setValue('establishmentLoginId', formData.establishmentLoginId);
    }
    if (!curPassword && formData.establishmentPassword) {
      form2.setValue('establishmentPassword', formData.establishmentPassword);
    }
  }, [step, formData.establishmentLoginId, formData.establishmentPassword, form2]);

  // Keep form3 in sync with formData when entering Step 3
  useEffect(() => {
    if (step !== 3 || isAdditionalLocation) return;
    const curFirst = form3.getValues('firstName');
    const curLast = form3.getValues('lastName');
    const curUsername = form3.getValues('username');
    const curPassword = form3.getValues('password');

    const targetFirst = formData.firstName || account?.firstName || '';
    const targetLast = formData.lastName || account?.lastName || '';

    if (!curFirst && targetFirst) {
      form3.setValue('firstName', targetFirst);
    }
    if (!curLast && targetLast) {
      form3.setValue('lastName', targetLast);
    }
    if (!curUsername && formData.username) {
      form3.setValue('username', formData.username);
    }
    if (!curPassword && formData.password) {
      form3.setValue('password', formData.password);
    }
  }, [step, isAdditionalLocation, formData.firstName, formData.lastName, formData.username, formData.password, account?.firstName, account?.lastName, form3]);

  // Keep form4 and billing choices in sync with formData when entering Step 4
  useEffect(() => {
    if (step !== 4) return;
    const curCardName = form4.getValues('cardName');
    const curCardNumber = form4.getValues('cardNumber');
    const curExpiryDate = form4.getValues('expiryDate');
    const curCvv = form4.getValues('cvv');

    if (!curCardName && formData.cardName) form4.setValue('cardName', formData.cardName);
    if (!curCardNumber && formData.cardNumber) form4.setValue('cardNumber', formData.cardNumber);
    if (!curExpiryDate && formData.expiryDate) form4.setValue('expiryDate', formData.expiryDate);
    if (!curCvv && formData.cvv) form4.setValue('cvv', formData.cvv);
    if (formData.billingCycle && (formData.billingCycle === BILLING_CYCLES.MONTHLY || formData.billingCycle === BILLING_CYCLES.YEARLY)) {
      setBillingCycle(formData.billingCycle as BillingCycle);
    }
    if (typeof formData.useSavedCard === 'boolean') {
      setUseSavedCard(formData.useSavedCard);
    }
    if (typeof formData.billingConsent === 'boolean') {
      setBillingConsent(formData.billingConsent);
    }
  }, [step, formData.cardName, formData.cardNumber, formData.expiryDate, formData.cvv, formData.billingCycle, formData.useSavedCard, formData.billingConsent, form4]);

  const selectedEstablishmentCurrency = form1.watch('currency') || establishments?.[0]?.currency || 'USD';
  const effectiveCurrency = selectedEstablishmentCurrency.toUpperCase();

  const currentMonthlyPrice = getMintcomPrice(BILLING_CYCLES.MONTHLY, isAdditionalLocation, effectiveCurrency);
  const currentYearlyPrice = getMintcomPrice(BILLING_CYCLES.YEARLY, isAdditionalLocation, effectiveCurrency);
  const displayPrice = getMintcomPrice(billingCycle, isAdditionalLocation, effectiveCurrency);
  const yearlySavings = getMintcomYearlySavings(isAdditionalLocation, effectiveCurrency);
  const yearlyDiscountPercent = getMintcomDiscountPercent(isAdditionalLocation, effectiveCurrency);
  const selectedPeriodLabel = billingCycle === BILLING_CYCLES.YEARLY
    ? t('landing.pricing.perYear')
    : t('landing.pricing.perMonth');
  const selectedPlanLabel = billingCycle === BILLING_CYCLES.YEARLY
    ? t('onboarding.step2.yearly')
    : t('onboarding.step2.monthly');
  const formatWholeCurrency = (amount: number) =>
    formatCurrencyCode(amount, effectiveCurrency, t('common.locale'), {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  const selectedPriceWithPeriod = `${formatWholeCurrency(displayPrice)} ${selectedPeriodLabel}`;
  // Stacked-pricing helpers: show the standard price struck-through above the discounted price
  const primaryDisplayPrice = getMintcomPrice(billingCycle, false, effectiveCurrency);
  const hasLocationDiscount = isAdditionalLocation && primaryDisplayPrice > displayPrice;
  const formatWholeNumber = (amount: number) =>
    amount.toLocaleString(t('common.locale'), { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const selectedUnitLabel = `${effectiveCurrency} ${selectedPeriodLabel}`;

  // The backend gives the first establishment a 14-day free trial (TRIAL_DAYS = 14),
  // billing from now + 14 days. Compute the same date here so the disclosure shows
  // the exact day the card will first be charged.
  const TRIAL_DAYS = 14;
  const trialEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + TRIAL_DAYS);
    return d;
  }, []);
  const trialEndDateLabel = trialEndDate.toLocaleDateString(t('common.locale'), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    if (isAdditionalLocation) return;

    const currentValues = form3.getValues();
    const targetFirst = formData.firstName || account?.firstName || '';
    const targetLast = formData.lastName || account?.lastName || '';
    if (!currentValues.firstName && targetFirst) {
      form3.setValue('firstName', targetFirst);
    }
    if (!currentValues.lastName && targetLast) {
      form3.setValue('lastName', targetLast);
    }
    if (!currentValues.username && formData.username) {
      form3.setValue('username', formData.username);
    }
    if (!currentValues.password && formData.password) {
      form3.setValue('password', formData.password);
    }
    // Owner username is left empty on purpose so the owner can choose their own if not in formData.
  }, [account?.email, account?.firstName, account?.lastName, formData.firstName, formData.lastName, formData.username, formData.password, form3, isAdditionalLocation]);

  useEffect(() => {
    let isMounted = true;

    const loadOwnerLogin = async () => {
      if (!isAdditionalLocation) {
        setOwnerLogin(null);
        return;
      }

      setIsOwnerLoginLoading(true);
      try {
        const response = await api.get('/api/accounts/all-employees', {
          headers: { 'X-Skip-Establishment-Header': 'true' },
        });
        const employees = Array.isArray(response.data) ? response.data : [];
        const owner = employees.find((employee: any) =>
          employee?.isAccountOwner || employee?.isOwnerAccount || employee?.isProtected
        );

        if (isMounted) {
          setOwnerLogin(owner || null);
        }
      } catch (error) {
        console.warn('[Onboarding] Failed to load owner login:', error);
        if (isMounted) {
          setOwnerLogin(null);
        }
      } finally {
        if (isMounted) {
          setIsOwnerLoginLoading(false);
        }
      }
    };

    loadOwnerLogin();

    return () => {
      isMounted = false;
    };
  }, [establishments.length, isAdditionalLocation]);

  // Set default currency for additional locations
  useEffect(() => {
    if (establishments.length > 0) {
      form1.setValue('currency', establishments[0].currency);
    }
  }, [establishments, form1]);

  const selectedCountry = form1.watch('country');
  const selectedTimezone = form1.watch('timezone');
  const isCurrencyLocked = establishments.length > 0;

  // VAT / tax preview for the subscription price, resolved from the chosen
  // country. Until Stripe Tax is wired in this is the customer-facing estimate;
  // the final charged amount is always for the country on the payment method.
  const vatBreakdown = computeVat(displayPrice, selectedCountry);
  const vatRule = vatBreakdown.rule;

  // Exact amount + date the customer is authorizing. The disclosure and the
  // consent checkbox must state currency, amount and the first-charge date
  // explicitly (card-network / consumer-protection requirement).
  const formatMoney = (amount: number) =>
    formatCurrencyCode(amount, effectiveCurrency, t('common.locale'), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const vatInclusiveTotalLabel = `${formatMoney(vatBreakdown.total)} ${effectiveCurrency}`;
  const recurringCycleNoun = billingCycle === BILLING_CYCLES.YEARLY
    ? t('onboarding.step2.cycleYear', { defaultValue: 'year' })
    : t('onboarding.step2.cycleMonth', { defaultValue: 'month' });
  const firstChargeDateLabel = isTrialFlow
    ? trialEndDateLabel
    : new Date().toLocaleDateString(t('common.locale'), {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  // When the country changes on first registration, auto-select that country's
  // primary currency. The currency field stays fully editable so the user can
  // pick any other currency afterwards.
  const prevCountryRef = useRef<string | undefined>(formData.country || 'US');

  // When the country changes on first registration, auto-select that country's
  // primary currency. The currency field stays fully editable so the user can
  // pick any other currency afterwards.
  useEffect(() => {
    if (isCurrencyLocked || !selectedCountry) return;
    if (prevCountryRef.current !== undefined && prevCountryRef.current !== selectedCountry) {
      const primaryCurrency = getCountryPrimaryCurrency(selectedCountry);
      if (primaryCurrency) {
        form1.setValue('currency', primaryCurrency, { shouldValidate: true, shouldDirty: true });
      }
    }
    prevCountryRef.current = selectedCountry;
  }, [selectedCountry, isCurrencyLocked, form1]);

  // Timezone follows the country by default (device TZ when it belongs to the
  // country, else the country's primary zone) but stays user-editable per
  // location — this is the worldwide store clock for all reports/dates.
  const timezoneOptions = useMemo(() => {
    const list = getCountryTimeZones(selectedCountry);
    if (list.length > 0) return list;
    const device = getDeviceTimeZone();
    return [device || 'UTC'];
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedCountry) return;
    const current = form1.getValues('timezone');
    const dirty = form1.getFieldState('timezone').isDirty;
    const prevTimezone = formData.timezone;
    // Auto-fill on first paint and on country change until the user overrides.
    if (!current) {
      const best = prevTimezone || getBestTimeZoneForCountry(selectedCountry, getDeviceTimeZone());
      form1.setValue('timezone', best, { shouldValidate: true });
    } else if (!dirty && !prevTimezone) {
      const best = getBestTimeZoneForCountry(selectedCountry, getDeviceTimeZone());
      form1.setValue('timezone', best, { shouldValidate: true });
    } else if (!timezoneOptions.includes(current)) {
      const best = getBestTimeZoneForCountry(selectedCountry, getDeviceTimeZone());
      form1.setValue('timezone', best, { shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  // Always offer the full currency list so owners can override the country default.
  const currencyOptions = allCurrencyOptions;

  const cardNumberValue = form4.watch('cardNumber') || '';
  const cardDigits = getCardDigits(cardNumberValue);
  const cardBrand = detectCardBrand(cardDigits);
  const cvvLength = getCardCvvLength(cardBrand);

  useEffect(() => {
    if (hasSavedCard && useSavedCard) {
      form4.clearErrors();
    }
  }, [form4, hasSavedCard, useSavedCard]);

  const onLocationDetailsSubmit = (data: any) => {
    if (launchLocked) {
      goToPhase('launch');
      return;
    }
    const finalData = {
      ...data,
      currency: establishments.length > 0 ? establishments[0].currency : data.currency,
      timezone: normalizeTimeZone(data.timezone) || getBestTimeZoneForCountry(data.country || formData.country, getDeviceTimeZone()),
      duplicateFromId: duplicateFromId || undefined,
      duplicateInventory: duplicateFromId ? duplicateInventory : false,
      duplicateDiscounts: duplicateFromId ? duplicateDiscounts : false,
      duplicatePaymentMethods: duplicateFromId ? duplicatePaymentMethods : false,
    };
    updateFormData((prev: any) => ({ ...prev, ...finalData }));
    navigate('/onboarding/business', { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submitProfilePayload = async (extraPayload: Partial<OnboardingProfilePayload> = {}) => {
    if (launchLocked) {
      goToPhase('launch');
      return;
    }
    setIsLoading(true);
    const locationValues = form1.getValues();
    const finalData: OnboardingProfilePayload = {
      name: locationValues.name || formData.name,
      type: locationValues.type || formData.type,
      country: locationValues.country || formData.country,
      currency: establishments.length > 0 ? establishments[0].currency : (locationValues.currency || formData.currency),
      address: locationValues.address || formData.address,
      timezone: normalizeTimeZone(locationValues.timezone || formData.timezone) || getBestTimeZoneForCountry(locationValues.country || formData.country, getDeviceTimeZone()),
      duplicateFromId: duplicateFromId || undefined,
      duplicateInventory: duplicateFromId ? duplicateInventory : false,
      duplicateDiscounts: duplicateFromId ? duplicateDiscounts : false,
      duplicatePaymentMethods: duplicateFromId ? duplicatePaymentMethods : false,
      ...extraPayload,
    };

    try {
      const session = await onboardingApi.saveProfile(finalData);
      const mapped = applyServerSession(session);
      updateFormData((prev: any) => ({ ...prev, ...finalData }));
      goToPhase(mapped, {
        force: true,
        serverPhaseOverride: mapped,
        apiPhaseOverride: session.phase,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        t('onboarding.errors.failedToComplete', { defaultValue: 'Could not save this step. Please try again.' });
      toast.error(typeof msg === 'string' ? msg : 'Could not save this step.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipBusinessProfile = async () => {
    updateFormData((prev: any) => ({
      ...prev,
      contactPhone: contactPhone.trim() || undefined,
      staffSize: staffSize || undefined,
      branchesPlanned: branchesPlanned || undefined,
      currentPos: currentPos || undefined,
      heardAbout: heardAbout || undefined,
      referralCode: heardAbout === 'Friend / referral' ? (referralCode.trim() || undefined) : undefined,
    }));
    await submitProfilePayload({});
  };

  const handleContinueBusinessProfile = async () => {
    const businessData: Partial<OnboardingProfilePayload> = {
      contactPhone: contactPhone.trim() || undefined,
      staffSize: staffSize || undefined,
      branchesPlanned: branchesPlanned || undefined,
      currentPos: currentPos || undefined,
      heardAbout: heardAbout || undefined,
      referralCode: heardAbout === 'Friend / referral' ? (referralCode.trim() || undefined) : undefined,
      marketingConsent: marketingConsent,
    };
    updateFormData((prev: any) => ({
      ...prev,
      ...businessData,
    }));
    await submitProfilePayload(businessData);
  };

  const onStep2Submit = async (data: any) => {
    if (launchLocked) {
      goToPhase('launch');
      return;
    }
    setIsLoading(true);
    const rawLoginId = (data.establishmentLoginId || '').trim();

    try {
      // Keep pre-check for friendlier field errors, then hard-gate via checkpoint.
      const response = await api.get('/api/brands/availability/establishment-login-id', {
        params: { establishmentLoginId: rawLoginId },
        headers: { 'X-Skip-Establishment-Header': 'true' },
      });

      if (!response.data?.available) {
        form2.setError('establishmentLoginId', {
          type: 'server',
          message:
            response.data?.message ||
            t('owner.brands.validation.loginIdTakenHint', {
              defaultValue: 'It must be unique across all locations and brands.',
            }),
        });
        setIsLoading(false);
        return;
      }

      const session = await onboardingApi.saveLocationLogin({
        establishmentLoginId: rawLoginId,
      });
      const mapped = applyServerSession(session);
      updateFormData((prev: any) => ({
        ...prev,
        ...data,
        establishmentLoginId: rawLoginId.toLowerCase(),
        // Keep password only in memory (not sessionStorage — stripped by sanitize).
        establishmentPassword: data.establishmentPassword,
      }));
      goToPhase(mapped, {
        force: true,
        serverPhaseOverride: mapped,
        apiPhaseOverride: session.phase,
      });
    } catch (err: any) {
      const rawMessage = err?.response?.data?.message;
      const serverMessage = Array.isArray(rawMessage)
        ? rawMessage.filter(Boolean).join(' ')
        : typeof rawMessage === 'string'
          ? rawMessage
          : '';
      const status = err?.response?.status;
      const fallback =
        status === 401 || status === 403
          ? t('owner.brands.validation.loginIdAuthFailed', {
              defaultValue:
                'Your session could not be verified. Please refresh the page and log in again as the account owner.',
            })
          : t('owner.brands.validation.loginIdCheckFailed', {
              defaultValue: 'Could not verify this Login ID right now. Please try again.',
            });
      form2.setError('establishmentLoginId', {
        type: 'server',
        message: serverMessage || fallback,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onStep3Submit = async (data: any) => {
    if (launchLocked) {
      goToPhase('launch');
      return;
    }
    setIsLoading(true);
    try {
      const payload = isAdditionalLocation
        ? { lockedOwner: true }
        : {
            lockedOwner: false,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
          };
      const session = await onboardingApi.saveOwnerLogin(payload);
      const mapped = applyServerSession(session);
      updateFormData((prev: any) => ({
        ...prev,
        ...data,
        // password memory-only
        password: data.password,
      }));
      goToPhase(mapped, {
        force: true,
        serverPhaseOverride: mapped,
        apiPhaseOverride: session.phase,
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        t('onboarding.errors.failedToComplete', { defaultValue: 'Could not save this step.' });
      toast.error(typeof msg === 'string' ? msg : 'Could not save this step.');
    } finally {
      setIsLoading(false);
    }
  };

  const finishOnboardingWithEstablishment = async (establishment: any) => {
    const estId = establishment?.id;
    if (!estId) {
      throw new Error('Failed to get establishment Id');
    }

    const nextEstablishment = {
      ...establishment,
      id: estId,
      name: establishment.name || formData.name,
      type: establishment.type || formData.type,
      address: establishment.address || formData.address,
      currency: establishment.currency || formData.currency,
      establishmentLoginId: establishment.establishmentLoginId || formData.establishmentLoginId,
    } as any;

    setCurrentEstablishment(nextEstablishment);
    localStorage.setItem('selectedEstablishmentId', estId);

    updateFormData((prev: any) => ({ ...prev, establishmentId: estId }));
    goToPhase('launch', {
      force: true,
      serverPhaseOverride: 'launch',
      apiPhaseOverride: 'LAUNCH',
    });
    toast.success(t('onboarding.messages.complete'));
    await refreshEstablishments();
  };

  const onStep4Submit = async (data: any) => {
    if (launchLocked) {
      goToPhase('launch');
      return;
    }

    // Block submission until the customer explicitly authorizes recurring billing.
    if (!billingConsent) {
      setConsentError(true);
      toast.error(
        t('onboarding.step2.consentRequired', {
          defaultValue: 'Please authorize recurring billing to continue.',
        }),
      );
      return;
    }

    // Passwords are memory-only (never sessionStorage). Refresh on billing requires re-entry.
    if (!formData.establishmentPassword) {
      toast.error(
        t('onboarding.security.reenterLocationPassword', {
          defaultValue: 'Please re-enter your location password to finish setup.',
        }),
      );
      goToPhase('location-login');
      return;
    }
    if (!isAdditionalLocation && !formData.password && !formData.lockedOwner) {
      toast.error(
        t('onboarding.security.reenterOwnerPassword', {
          defaultValue: 'Please re-enter your owner password to finish setup.',
        }),
      );
      goToPhase('owner-login');
      return;
    }

    setIsLoading(true);

    // Handle payment method
    let paymentMethodToken = '';
    let savedCardId = '';

    if (hasSavedCard && useSavedCard) {
      paymentMethodToken = 'use_saved_card';
      savedCardId = account?.defaultCardId || '';
    } else {
      const parsedExpiry = parseExpiryDate(data.expiryDate || '');
      const cardDigitsLocal = getCardDigits(data.cardNumber || '');

      if (!parsedExpiry || !isValidCardNumber(cardDigitsLocal)) {
        toast.error(
          t('paymentMethods.messages.failedToAdd', { defaultValue: 'Failed to add card' }),
        );
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.post('/api/accounts/cards', {
          last4: cardDigitsLocal.slice(-4),
          brand: PAYMENT_CARD_API_BRAND[detectCardBrand(cardDigitsLocal)],
          expMonth: parsedExpiry.month,
          expYear: parsedExpiry.year,
          cardholderName: data.cardName.trim(),
          saveForFuturePurchases: true,
          setAsDefault: true,
        });

        savedCardId = response.data.card?.id;
        paymentMethodToken = 'use_saved_card';
        const newDefaultPaymentMethod =
          response.data.card?.last4 || cardDigitsLocal.slice(-4);

        if (savedCardId) {
          updateAccount({
            defaultCardId: savedCardId,
            defaultPaymentMethod: newDefaultPaymentMethod,
          });
        }
      } catch (err: any) {
        console.error('Failed to save payment method:', err);
        toast.error(t('onboarding.errors.failedToSaveCard'));
        setIsLoading(false);
        return;
      }
    }

    try {
      const completeBody = {
        establishmentLoginId: formData.establishmentLoginId,
        establishmentPassword: formData.establishmentPassword,
        username: formData.username,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        paymentMethodToken,
        savedCardId,
        billingCycle: billingCycle || MINTCOM_PRICING.defaultBillingCycle,
        monthlyPrice: currentMonthlyPrice,
        yearlyPrice: currentYearlyPrice,
      };

      const result = await onboardingApi.complete(completeBody);
      const mapped = applyServerSession(result);

      const createdEstablishment = result.establishment;
      if (createdEstablishment?.id || result.establishmentId) {
        await finishOnboardingWithEstablishment({
          ...(createdEstablishment || {}),
          id: createdEstablishment?.id || result.establishmentId,
        });
      } else {
        goToPhase('launch', {
          force: true,
          serverPhaseOverride: mapped || 'launch',
          apiPhaseOverride: result.phase || 'LAUNCH',
        });
        toast.success(t('onboarding.messages.complete'));
        await refreshEstablishments();
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const errorData = err.response?.data?.message;
      let errorMessage = Array.isArray(errorData)
        ? errorData.join('\n')
        : typeof errorData === 'string'
          ? errorData
          : t('onboarding.errors.failedToComplete');

      if (status === 401 || status === 403) {
        errorMessage =
          'Your session expired or could not be verified. Please refresh, sign in again with Google, and retry.';
      } else if (status === 409) {
        const code = err?.response?.data?.code || err?.response?.data?.message?.code;
        if (code === 'ONBOARDING_ALREADY_COMPLETE' || code === 'ONBOARDING_PHASE_INVALID') {
          try {
            const session = await onboardingApi.getSession();
            applyServerSession(session);
            if (session.phase === 'LAUNCH' || session.phase === 'COMPLETED') {
              setServerPhase('launch');
              setApiPhase(session.phase);
              goToPhase('launch', { force: true });
              return;
            }
          } catch {
            // fall through
          }
        }
        errorMessage =
          typeof errorMessage === 'string'
            ? errorMessage
            : 'This Location Login ID is already taken. Go back and choose another ID.';
      } else if (status === 500 || status === 502) {
        errorMessage =
          errorMessage && errorMessage !== 'Internal server error'
            ? errorMessage
            : 'Server error while creating the location. Please wait a few seconds and try again. If it keeps failing, sign out and sign in again.';
      }

      console.error('[Onboarding] finish failed', {
        status,
        data: err?.response?.data,
      });

      toast.error(errorMessage, {
        duration: String(errorMessage).length > 50 ? 6000 : 4000,
        style: {
          maxWidth: '400px',
          whiteSpace: 'pre-line',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const businessTypeGroups = useMemo(() => [
    {
      category: t('onboarding.step1.businessCategories.foodAndBeverage'),
      options: [
        { id: 'restaurant', label: t('onboarding.step1.businessTypes.restaurant') },
        { id: 'fast_food', label: t('onboarding.step1.businessTypes.fast_food') },
        { id: 'fine_dining', label: t('onboarding.step1.businessTypes.fine_dining') },
        { id: 'cafe', label: t('onboarding.step1.businessTypes.cafe') },
        { id: 'roastery', label: t('onboarding.step1.businessTypes.roastery') },
        { id: 'bakery', label: t('onboarding.step1.businessTypes.bakery') },
        { id: 'dessert', label: t('onboarding.step1.businessTypes.dessert') },
        { id: 'cloud_kitchen', label: t('onboarding.step1.businessTypes.cloud_kitchen') },
        { id: 'food_truck', label: t('onboarding.step1.businessTypes.food_truck') },
        { id: 'pizzeria', label: t('onboarding.step1.businessTypes.pizzeria') },
        { id: 'juice_bar', label: t('onboarding.step1.businessTypes.juice_bar') },
        { id: 'bar', label: t('onboarding.step1.businessTypes.bar') },
        { id: 'catering', label: t('onboarding.step1.businessTypes.catering') },
      ],
    },
    {
      category: t('onboarding.step1.businessCategories.retailAndGroceries'),
      options: [
        { id: 'retail', label: t('onboarding.step1.businessTypes.retail') },
        { id: 'grocery', label: t('onboarding.step1.businessTypes.grocery') },
        { id: 'butchery', label: t('onboarding.step1.businessTypes.butchery') },
      ],
    },
    {
      category: t('onboarding.step1.businessCategories.other'),
      options: [
        { id: 'other', label: t('onboarding.step1.businessTypes.other') },
      ],
    },
  ], [t]);

  const getEstablishmentTypeLabel = (type?: string) => {
    const normalizedType = String(type || 'restaurant').toLowerCase();
    const typeKey = normalizedType === 'retail_store' ? 'retail' : normalizedType;
    const fallback = typeKey
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase());

    return t(`onboarding.step1.businessTypes.${typeKey}`, { defaultValue: fallback });
  };

  const ownerLoginDisplay = {
    firstName: ownerLogin?.firstName || account?.firstName || '',
    lastName: ownerLogin?.lastName || account?.lastName || '',
    username: ownerLogin?.username || account?.email || '',
    email: ownerLogin?.email || account?.email || '',
  };

  const totalSteps = 4;

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-zinc-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-mintcom-green" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-zinc-950 flex flex-col transition-colors duration-300" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Navbar - Shown on All Steps */}
      <div className="sticky top-0 z-50 p-6 flex justify-between items-center border-b border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm">
        {/* Logo returns to the marketing site — setup can be resumed anytime via Continue Onboarding */}
        <Link
          to="/"
          title={t('onboarding.backToWebsite', { defaultValue: 'Back to Mintcom website' })}
          aria-label={t('onboarding.backToWebsite', { defaultValue: 'Back to Mintcom website' })}
          className="flex items-center rounded-xl transition-opacity hover:opacity-80"
        >
          <img
            src={MintcomLogoGreen}
            alt="Mintcom"
            className="h-8 w-auto object-contain dark:hidden"
          />
          <img
            src={MintcomLogoWhite}
            alt="Mintcom"
            className="h-8 w-auto object-contain hidden dark:block"
          />
        </Link>

        {step <= totalSteps && (
          <div className="flex items-center gap-4">
            {isRTL && <span className="text-xs font-bold text-stone-400">{t('onboarding.step')} {step} {t('onboarding.of')} {totalSteps}</span>}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-500 ${step >= s ? 'w-8 bg-mintcom-green' : 'w-4 bg-stone-200 dark:bg-zinc-800'
                    }`}
                />
              ))}
            </div>
            {!isRTL && <span className="text-xs font-bold text-stone-400">{t('onboarding.step')} {step} {t('onboarding.of')} {totalSteps}</span>}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">

          {/* STEP 1A: Location Details */}
          {step === 1 && phaseParam === 'location' && (
            <motion.div
              key="step1-location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl w-full"
            >
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 lg:p-12 shadow-sm dark:shadow-none">
                  <>
                    <div className="mb-10">
                      {/* Steps 2–4 each have a Back control; step 1 had none, so a
                          first-time owner arriving from signup was stranded here
                          with no way out but the browser's own back button
                          (TC-042). There is no previous step, so this exits the
                          wizard: to the owner portal when adding another location,
                          otherwise back to the site. */}
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            const vals = form1.getValues();
                            updateFormData((prev: any) => ({
                              ...prev,
                              ...(vals.name ? { name: vals.name } : {}),
                              ...(vals.type ? { type: vals.type } : {}),
                              ...(vals.country ? { country: vals.country } : {}),
                              ...(vals.timezone ? { timezone: vals.timezone } : {}),
                              ...(vals.currency ? { currency: vals.currency } : {}),
                              ...(vals.address ? { address: vals.address } : {}),
                            }));
                            if (isAdditionalLocation) {
                              navigate('/owner');
                            } else {
                              navigate('/');
                            }
                          }}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors"
                        >
                          {!isRTL && <ArrowLeft size={16} />}
                          {t('onboarding.back')}
                          {isRTL && <ArrowLeft size={16} />}
                        </button>
                        {isAdditionalLocation && (
                          <button
                            type="button"
                            onClick={() => navigate('/owner')}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-mintcom-green dark:text-stone-300 dark:hover:text-mintcom-green transition-colors"
                          >
                            <LayoutDashboard size={16} />
                            {t('common.dashboard', { defaultValue: 'Go to Dashboard' })}
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <h2 className="font-sans text-2xl sm:text-3xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">{t('onboarding.step1.title')}</h2>
                      </div>
                      <p className="text-sm font-sans text-stone-600 dark:text-zinc-300">{t('onboarding.step1.subtitle')}</p>
                    </div>

                    <form onSubmit={form1.handleSubmit(onLocationDetailsSubmit)} autoComplete="off" className="space-y-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.step1.locationName')} <span className="text-mintcom-red mx-1">*</span>
                          </label>
                          <div className="relative group">
                            <Store className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors`} size={20} />
                            <input
                              maxLength={TEXT_INPUT_LIMITS.BUSINESS_NAME}
                              type="text"
                              {...form1.register('name', {
                                onChange: (e) => updateFormData((prev: any) => ({ ...prev, name: e.target.value })),
                              })}
                              className={`w-full bg-white dark:bg-zinc-900/60 border ${form1.formState.errors.name ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                              placeholder={formatInputPlaceholder(t('onboarding.step1.locationNamePlaceholder'), t('common.locale'))}
                            />
                          </div>
                          {form1.formState.errors.name && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 mx-1">{form1.formState.errors.name.message as string}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.step1.businessType')} <span className="text-mintcom-red mx-1">*</span>
                          </label>
                          <div className="relative">
                            <Building2 className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={20} />
                            <select
                              {...form1.register('type', {
                                onChange: (e) => updateFormData((prev: any) => ({ ...prev, type: e.target.value })),
                              })}
                              className={`w-full bg-white dark:bg-zinc-900/60 border ${form1.formState.errors.type ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all appearance-none`}
                            >
                              {businessTypeGroups.map((group) => (
                                <optgroup
                                  key={group.category}
                                  label={group.category}
                                  className="bg-white dark:bg-zinc-900/60 text-stone-900 dark:text-zinc-100 font-semibold"
                                >
                                  {group.options.map((opt) => (
                                    <option
                                      key={opt.id}
                                      value={opt.id}
                                      className="bg-white dark:bg-zinc-900/60 text-stone-900 dark:text-zinc-100 font-normal"
                                    >
                                      {opt.label}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none`} size={16} />
                          </div>
                          {form1.formState.errors.type && (
                            <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 mx-1">
                              {form1.formState.errors.type.message as string}
                            </p>
                          )}
                        </div>

                        {/* Country first — currency is linked to the selected country/region */}
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.step1.country', { defaultValue: 'Country' })} <span className="text-mintcom-red mx-1">*</span>
                          </label>
                          <div className="relative">
                            <Globe className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={20} />
                            <select
                              {...form1.register('country', {
                                onChange: (e) => updateFormData((prev: any) => ({ ...prev, country: e.target.value })),
                              })}
                              className={`w-full bg-white dark:bg-zinc-900/60 border ${form1.formState.errors.country ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all appearance-none`}
                            >
                              {countryOptions.map((countryOption) => (
                                <option key={countryOption.code} value={countryOption.code}>
                                  {countryOption.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none`} size={16} />
                          </div>
                          {form1.formState.errors.country && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 mx-1">{form1.formState.errors.country.message as string}</p>}
                        </div>

                        {/* Store timezone — per-location wall clock for all dates/reports */}
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.step1.timezone', { defaultValue: 'Store timezone' })} <span className="text-mintcom-red mx-1">*</span>
                          </label>
                          <div className="relative">
                            <CalendarClock className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={20} />
                            <select
                              {...form1.register('timezone', {
                                onChange: (e) => updateFormData((prev: any) => ({ ...prev, timezone: e.target.value })),
                              })}
                              className={`w-full bg-white dark:bg-zinc-900/60 border ${form1.formState.errors.timezone ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all appearance-none`}
                            >
                              {timezoneOptions.map((tz) => (
                                <option key={tz} value={tz}>
                                  {tz}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none`} size={16} />
                          </div>
                          <p className="text-xs font-sans text-stone-500 dark:text-zinc-400 mt-1.5 mx-1 flex items-center gap-1.5">
                            <Info size={14} className="flex-shrink-0" />
                            <span>
                              {t('onboarding.step1.timezoneHint', {
                                defaultValue: 'All sales, shifts and reports use this timezone. Current time there: {{time}}.',
                                time: (() => { try { return new Intl.DateTimeFormat(locale || 'en-US', { hour: '2-digit', minute: '2-digit', timeZone: selectedTimezone || timezoneOptions[0] }).format(new Date()); } catch { return ''; } })(),
                              })}
                            </span>
                          </p>
                          {form1.formState.errors.timezone && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 mx-1">{form1.formState.errors.timezone.message as string}</p>}
                        </div>

                        {/* Base Currency Row: auto-filled from country, always free to change on first location */}
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.step1.currency')} <span className="text-mintcom-red mx-1">*</span>
                          </label>
                          <div className="relative">
                            <DollarSign className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 ${isCurrencyLocked ? 'text-stone-500' : 'text-stone-400'}`} size={20} />
                            <select
                              {...form1.register('currency', {
                                onChange: (e) => updateFormData((prev: any) => ({ ...prev, currency: e.target.value })),
                              })}
                              disabled={isCurrencyLocked}
                              className={`w-full bg-white dark:bg-zinc-900/60 border ${form1.formState.errors.currency ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans font-bold text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all appearance-none ${isCurrencyLocked ? 'opacity-60 cursor-not-allowed bg-stone-100 dark:bg-zinc-800' : ''}`}
                            >
                              {currencyOptions.map((currencyOption) => (
                                <option key={currencyOption.code} value={currencyOption.code}>
                                  {currencyOption.label}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none`} size={16} />
                            {isCurrencyLocked && (
                              <div className={`absolute ${isRTL ? 'left-10' : 'right-10'} top-1/2 -translate-y-1/2`}>
                                <Lock size={16} className="text-stone-400" />
                              </div>
                            )}
                          </div>
                          {!isCurrencyLocked && (
                            <p className="text-xs font-sans text-stone-500 dark:text-zinc-400 mt-1.5 mx-1 flex items-center gap-1.5">
                              <Info size={14} className="flex-shrink-0" />
                              <span>
                                {t('onboarding.step1.currencyLinkedToCountry', {
                                  defaultValue: 'Currency is set from the selected country. You can change it if needed.',
                                })}
                              </span>
                            </p>
                          )}
                          {isCurrencyLocked && (
                            <div className="text-xs font-sans text-amber-800 dark:text-amber-300 mt-2 mx-1 flex items-start gap-2 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-xl border border-amber-200 dark:border-amber-500/20 leading-relaxed">
                              <Info size={16} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                              <span>{t('onboarding.step1.currencyLockedNote')}</span>
                            </div>
                          )}
                          {form1.formState.errors.currency && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 mx-1">{form1.formState.errors.currency.message as string}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.step1.address')} <span className="text-mintcom-red mx-1">*</span>
                          </label>
                          <div className="relative">
                            <MapPin className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400`} size={20} />
                            <input maxLength={255}
                              type="text"
                              {...form1.register('address', {
                                onChange: (e) => updateFormData((prev: any) => ({ ...prev, address: e.target.value })),
                              })}
                              className={`w-full bg-white dark:bg-zinc-900/60 border ${form1.formState.errors.address ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                              placeholder={formatInputPlaceholder(t('onboarding.step1.addressPlaceholder'), t('common.locale'))}
                            />
                          </div>
                          {form1.formState.errors.address && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 mx-1">{form1.formState.errors.address.message as string}</p>}
                        </div>

                        {/* Import Settings Section - Only show if user has existing establishments */}
                        {establishments.length > 0 && (
                          <div className="pt-4 border-t border-stone-100 dark:border-white/5">
                            <div className="flex items-center gap-2 mb-4">
                              <Copy className="text-mintcom-green" size={20} />
                              <h3 className="font-sans text-base font-bold text-stone-900 dark:text-zinc-100">{t('onboarding.step1.quickSetup')}</h3>
                            </div>

                            <div className="bg-white dark:bg-zinc-900/60 rounded-2xl p-5 border border-stone-100 dark:border-white/5">
                              <label className="text-xs font-sans text-stone-400 mb-2 flex items-center">
                                {t('onboarding.step1.copySettings')}
                                <QuickInfo text={t('onboarding.step1.copySettingsTip')} />
                              </label>
                              <div className="relative mb-4">
                                <select
                                  value={duplicateFromId}
                                  onChange={(e) => handleDuplicateSourceChange(e.target.value)}
                                  className="w-full bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-stone-900 dark:text-zinc-100 font-sans focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 appearance-none"
                                >
                                  <option value="">{t('onboarding.step1.startFresh')}</option>
                                  {establishments.map((est) => (
                                    <option key={est.id} value={est.id}>
                                      {est.name} ({getEstablishmentTypeLabel(est.type)})
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown className="absolute end-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={16} />
                              </div>

                              {/* Checkboxes - Only show if an establishment is selected */}
                              <AnimatePresence>
                                {duplicateFromId && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3 overflow-hidden"
                                  >
                                    <p className="text-xs font-sans text-stone-400 mb-2">{t('onboarding.step1.selectData')}</p>

                                    {/* Inventory Checkbox */}
                                    <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${duplicateInventory ? 'border-mintcom-green bg-mintcom-green/5' : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300'}`}>
                                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${duplicateInventory ? 'bg-mintcom-green text-black' : 'bg-stone-200 dark:border-zinc-800'}`}>
                                        {duplicateInventory && <Check size={14} strokeWidth={4} />}
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={duplicateInventory}
                                        onChange={(e) => {
                                          setDuplicateInventory(e.target.checked);
                                          updateFormData((prev: any) => ({ ...prev, duplicateInventory: e.target.checked }));
                                        }}
                                      />
                                      <div className="flex-1 flex items-center gap-2">
                                        <Box size={16} className={duplicateInventory ? 'text-mintcom-green' : 'text-stone-400'} />
                                        <div>
                                          <p className="text-sm font-sans text-stone-900 dark:text-zinc-100">{t('onboarding.step1.menu')}</p>
                                          <p className="text-xs font-sans text-stone-500">{t('onboarding.step1.menuDesc')}</p>
                                        </div>
                                      </div>
                                    </label>

                                    {/* Discounts Checkbox */}
                                    <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${duplicateDiscounts ? 'border-mintcom-green bg-mintcom-green/5' : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300'}`}>
                                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${duplicateDiscounts ? 'bg-mintcom-green text-black' : 'bg-stone-200 dark:border-zinc-800'}`}>
                                        {duplicateDiscounts && <Check size={14} strokeWidth={4} />}
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={duplicateDiscounts}
                                        onChange={(e) => {
                                          setDuplicateDiscounts(e.target.checked);
                                          updateFormData((prev: any) => ({ ...prev, duplicateDiscounts: e.target.checked }));
                                        }}
                                      />
                                      <div className="flex-1 flex items-center gap-2">
                                        <Tags size={16} className={duplicateDiscounts ? 'text-mintcom-green' : 'text-stone-400'} />
                                        <div>
                                          <p className="text-sm font-sans text-stone-900 dark:text-zinc-100">{t('onboarding.step1.discounts')}</p>
                                          <p className="text-xs font-sans text-stone-500">{t('onboarding.step1.discountsDesc')}</p>
                                        </div>
                                      </div>
                                    </label>

                                    {/* Payment Methods Checkbox */}
                                    <label className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${duplicatePaymentMethods ? 'border-mintcom-green bg-mintcom-green/5' : 'border-stone-200 dark:border-zinc-800 hover:border-stone-300'}`}>
                                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-3 transition-colors ${duplicatePaymentMethods ? 'bg-mintcom-green text-black' : 'bg-stone-200 dark:border-zinc-800'}`}>
                                        {duplicatePaymentMethods && <Check size={14} strokeWidth={4} />}
                                      </div>
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={duplicatePaymentMethods}
                                        onChange={(e) => {
                                          setDuplicatePaymentMethods(e.target.checked);
                                          updateFormData((prev: any) => ({ ...prev, duplicatePaymentMethods: e.target.checked }));
                                        }}
                                      />
                                      <div className="flex-1 flex items-center gap-2">
                                        <CreditCard size={16} className={duplicatePaymentMethods ? 'text-mintcom-green' : 'text-stone-400'} />
                                        <div>
                                          <p className="text-sm font-sans text-stone-900 dark:text-zinc-100">{t('onboarding.step1.paymentMethods')}</p>
                                          <p className="text-xs font-sans text-stone-500">{t('onboarding.step1.paymentMethodsDesc')}</p>
                                        </div>
                                      </div>
                                    </label>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}

                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 flex items-center justify-center gap-2 active:scale-[0.98] dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                        >
                          {isRTL && <ArrowRight size={15} className="shrink-0" />}
                          {t('onboarding.nextStep')}
                          {!isRTL && <ArrowRight size={15} className="shrink-0" />}
                        </button>
                      </div>
                    </form>
                  </>
              </div>
            </motion.div>
          )}

          {/* STEP 1B: Tell Us About Your Business */}
          {step === 1 && phaseParam === 'business' && (
            <motion.div
              key="step1-business"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl w-full"
            >
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 lg:p-12 shadow-sm dark:shadow-none">
                  <>
                    <div className="mb-10">
                      <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => {
                            updateFormData((prev: any) => ({
                              ...prev,
                              contactPhone: contactPhone.trim(),
                              staffSize,
                              branchesPlanned,
                              currentPos,
                              heardAbout,
                              referralCode: heardAbout === 'Friend / referral' ? referralCode.trim() : '',
                            }));
                            navigate('/onboarding/location', { replace: true });
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors"
                        >
                          {!isRTL && <ArrowLeft size={16} />}
                          {t('onboarding.back')}
                          {isRTL && <ArrowLeft size={16} />}
                        </button>
                        {isAdditionalLocation && (
                          <button
                            type="button"
                            onClick={() => navigate('/owner')}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-mintcom-green dark:text-stone-300 dark:hover:text-mintcom-green transition-colors"
                          >
                            <LayoutDashboard size={16} />
                            {t('common.dashboard', { defaultValue: 'Go to Dashboard' })}
                          </button>
                        )}
                      </div>

                      <div className="flex justify-between items-start mb-2">
                        <h2 className="font-sans text-2xl sm:text-3xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                          {t('onboarding.businessProfile.title')}{' '}
                          <span className="font-normal text-stone-500 dark:text-zinc-400 text-xl sm:text-2xl">
                            ({t('common.optional', { defaultValue: 'Optional' })})
                          </span>
                        </h2>
                      </div>
                      <p className="text-sm font-sans text-stone-600 dark:text-zinc-300">
                        {t('onboarding.businessProfile.subtitle')}
                      </p>
                    </div>

                    <div className="space-y-8" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
                      <div className="space-y-6">
                        {/* Contact Phone */}
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.businessProfile.phoneLabel')}
                          </label>
                          <div className="relative group">
                            <Phone className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors`} size={20} />
                            <input
                              type="tel"
                              value={contactPhone}
                              onChange={(e) => {
                                setContactPhone(e.target.value);
                                updateFormData((prev: any) => ({ ...prev, contactPhone: e.target.value }));
                              }}
                              className={`w-full bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                              placeholder={formatInputPlaceholder(t('onboarding.businessProfile.phonePlaceholder'), t('common.locale'))}
                            />
                          </div>
                          <p className="text-xs font-sans text-stone-500 dark:text-zinc-400 mt-1.5 mx-1 flex items-center gap-1.5">
                            <Info size={14} className="flex-shrink-0" />
                            <span>{t('onboarding.businessProfile.phoneHint')}</span>
                          </p>
                        </div>

                        {/* Staff Size */}
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.businessProfile.staffLabel')}
                          </label>
                          <div className="relative group">
                            <Users className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors`} size={20} />
                            <select
                              value={staffSize}
                              onChange={(e) => {
                                setStaffSize(e.target.value);
                                updateFormData((prev: any) => ({ ...prev, staffSize: e.target.value }));
                              }}
                              className={`w-full bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans ${staffSize ? 'font-bold text-stone-900 dark:text-zinc-100' : 'font-normal text-stone-400'} placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all appearance-none cursor-pointer`}
                            >
                              <option value="" className="text-stone-400 font-normal bg-white dark:bg-zinc-900">
                                {t('onboarding.businessProfile.staffPlaceholder', { defaultValue: 'Select staff size' })}
                              </option>
                              {STAFF_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 font-normal"
                                >
                                  {t(opt.labelKey)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none`} size={16} />
                          </div>
                        </div>

                        {/* Branches Planned */}
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.businessProfile.branchesLabel')}
                          </label>
                          <div className="relative group">
                            <GitBranch className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors`} size={20} />
                            <select
                              value={branchesPlanned}
                              onChange={(e) => {
                                setBranchesPlanned(e.target.value);
                                updateFormData((prev: any) => ({ ...prev, branchesPlanned: e.target.value }));
                              }}
                              className={`w-full bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans ${branchesPlanned ? 'font-bold text-stone-900 dark:text-zinc-100' : 'font-normal text-stone-400'} placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all appearance-none cursor-pointer`}
                            >
                              <option value="" className="text-stone-400 font-normal bg-white dark:bg-zinc-900">
                                {t('onboarding.businessProfile.branchesPlaceholder', { defaultValue: 'Select branches planned' })}
                              </option>
                              {BRANCH_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 font-normal"
                                >
                                  {t(opt.labelKey)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none`} size={16} />
                          </div>
                        </div>

                        {/* Current POS */}
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.businessProfile.posLabel')}
                          </label>
                          <div className="relative group">
                            <Repeat className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors`} size={20} />
                            <select
                              value={currentPos}
                              onChange={(e) => {
                                setCurrentPos(e.target.value);
                                updateFormData((prev: any) => ({ ...prev, currentPos: e.target.value }));
                              }}
                              className={`w-full bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans ${currentPos ? 'font-bold text-stone-900 dark:text-zinc-100' : 'font-normal text-stone-400'} placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all appearance-none cursor-pointer`}
                            >
                              <option value="" className="text-stone-400 font-normal bg-white dark:bg-zinc-900">
                                {t('onboarding.businessProfile.posPlaceholder', { defaultValue: 'Select current POS' })}
                              </option>
                              {POS_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 font-normal"
                                >
                                  {t(opt.labelKey)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none`} size={16} />
                          </div>
                        </div>

                        {/* How did you hear about us */}
                        <div className="space-y-2">
                          <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                            {t('onboarding.businessProfile.sourceLabel')}
                          </label>
                          <div className="relative group">
                            <Megaphone className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors`} size={20} />
                            <select
                              value={heardAbout}
                              onChange={(e) => {
                                setHeardAbout(e.target.value);
                                updateFormData((prev: any) => ({ ...prev, heardAbout: e.target.value }));
                              }}
                              className={`w-full bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans ${heardAbout ? 'font-bold text-stone-900 dark:text-zinc-100' : 'font-normal text-stone-400'} placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all appearance-none cursor-pointer`}
                            >
                              <option value="" className="text-stone-400 font-normal bg-white dark:bg-zinc-900">
                                {t('onboarding.businessProfile.sourcePlaceholder', { defaultValue: 'Select how you heard about us' })}
                              </option>
                              {SOURCE_OPTIONS.map((opt) => (
                                <option
                                  key={opt.value}
                                  value={opt.value}
                                  className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 font-normal"
                                >
                                  {t(opt.labelKey)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none`} size={16} />
                          </div>
                          {heardAbout === 'Friend / referral' && (
                            <div className="space-y-2 pt-2">
                              <label className="text-sm font-sans font-medium text-stone-600 dark:text-zinc-300 mx-1 flex items-center">
                                {t('onboarding.businessProfile.referralCodeLabel')}
                              </label>
                              <div className="relative group">
                                <Tags className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors`} size={20} />
                                <input
                                  type="text"
                                  value={referralCode}
                                  onChange={(e) => {
                                    setReferralCode(e.target.value);
                                    updateFormData((prev: any) => ({ ...prev, referralCode: e.target.value }));
                                  }}
                                  className={`w-full bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                                  placeholder={formatInputPlaceholder(t('onboarding.businessProfile.referralCodePlaceholder'), t('common.locale'))}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                      </div>

                      <div className="flex items-center gap-3 pt-4">
                        <button
                          type="button"
                          onClick={handleSkipBusinessProfile}
                          disabled={isLoading}
                          className="flex-1 rounded-xl border border-stone-200 bg-white py-3 text-sm font-semibold text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 dark:border-zinc-800 dark:bg-transparent dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
                        >
                          {t('onboarding.businessProfile.skip')}
                        </button>
                        <button
                          type="button"
                          onClick={handleContinueBusinessProfile}
                          disabled={isLoading}
                          className="flex-[2] rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 flex items-center justify-center gap-2 active:scale-[0.98] dark:bg-mintcom-green dark:text-black dark:hover:brightness-110 disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="animate-spin" size={15} />
                          ) : (
                            <>
                              {isRTL && <ArrowRight size={15} className="shrink-0" />}
                              <span>{t('onboarding.businessProfile.continue')}</span>
                              {!isRTL && <ArrowRight size={15} className="shrink-0" />}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Location Login Details */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 lg:p-12 shadow-sm dark:shadow-none">
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        const vals = form2.getValues();
                        updateFormData((prev: any) => ({
                          ...prev,
                          establishmentLoginId: vals.establishmentLoginId !== undefined ? vals.establishmentLoginId.trim().toLowerCase() : prev.establishmentLoginId,
                          establishmentPassword: vals.establishmentPassword !== undefined ? vals.establishmentPassword : prev.establishmentPassword,
                        }));
                        goToStep(1);
                      }}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors"
                    >
                      {!isRTL && <ArrowLeft size={16} />}
                      {t('onboarding.back')}
                      {isRTL && <ArrowLeft size={16} />}
                    </button>
                    {isAdditionalLocation && (
                      <button
                        type="button"
                        onClick={() => navigate('/owner')}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-mintcom-green dark:text-stone-300 dark:hover:text-mintcom-green transition-colors"
                      >
                        <LayoutDashboard size={16} />
                        {t('common.dashboard', { defaultValue: 'Go to Dashboard' })}
                      </button>
                    )}
                  </div>
                  <h2 className="font-sans text-2xl sm:text-3xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight mb-2">{t('onboarding.step3.title')}</h2>
                  <p className="text-sm font-sans text-stone-600 dark:text-zinc-300">{t('onboarding.step3.subtitle')}</p>
                  <div className="mt-4 p-3 bg-mintcom-green/10 text-mintcom-green text-sm rounded-xl font-sans border border-mintcom-green/20">
                    <p>✨ <strong>{t('onboarding.step3.uniqueAccess')}</strong> {t('onboarding.step3.uniqueAccessDesc')}</p>
                  </div>
                </div>

                <form onSubmit={form2.handleSubmit(onStep2Submit)} autoComplete="off" className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="space-y-2">
                    <label className="text-xs font-sans text-stone-400 ml-1 flex items-center">
                      {t('onboarding.step3.locationId')} <span className="text-mintcom-red mx-1">*</span>
                      <QuickInfo text={t('onboarding.step3.locationIdTip')} />
                    </label>
                    <div className="relative group">
                      <Smartphone className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                      <input maxLength={255}
                        type="text"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                        {...form2.register('establishmentLoginId', {
                          onChange: (e) => updateFormData((prev: any) => ({ ...prev, establishmentLoginId: e.target.value })),
                        })}
                        className={`w-full bg-white dark:bg-zinc-900/60 border ${form2.formState.errors.establishmentLoginId ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ps-12 pe-4 text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                        placeholder={formatInputPlaceholder(t('onboarding.step3.locationIdPlaceholder'), t('common.locale'))}
                      />
                    </div>
                    {form2.formState.errors.establishmentLoginId && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 ml-1">{form2.formState.errors.establishmentLoginId.message as string}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-sans text-stone-400 ml-1 flex items-center">
                      {t('onboarding.step3.password')} <span className="text-mintcom-red mx-1">*</span>
                      <QuickInfo text={t('onboarding.step3.passwordTip')} />
                    </label>
                    <div className="relative group">
                      <KeyRound className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                      <input maxLength={255}
                        type={showEstablishmentPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...form2.register('establishmentPassword', {
                          onChange: (e) => updateFormData((prev: any) => ({ ...prev, establishmentPassword: e.target.value })),
                        })}
                        className={`w-full bg-white dark:bg-zinc-900/60 border ${form2.formState.errors.establishmentPassword ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ps-12 pe-12 text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                        placeholder={formatInputPlaceholder(t('onboarding.step3.passwordPlaceholder'), t('common.locale'))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEstablishmentPassword(!showEstablishmentPassword)}
                        className="absolute end-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                      >
                        {showEstablishmentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {form2.formState.errors.establishmentPassword && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 ml-1">{form2.formState.errors.establishmentPassword.message as string}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 flex items-center justify-center gap-2 active:scale-[0.98] dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                    >
                      {isRTL && <ArrowRight size={15} className="shrink-0" />}
                      {t('onboarding.nextStep')}
                      {!isRTL && <ArrowRight size={15} className="shrink-0" />}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Admin Access */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md w-full"
            >
              <div className="bg-white dark:bg-zinc-900/60 rounded-2xl border border-stone-200 dark:border-zinc-800 p-6 sm:p-8 lg:p-12 shadow-sm dark:shadow-none">
                <div className="mb-10">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-stone-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        const vals = form3.getValues();
                        updateFormData((prev: any) => ({
                          ...prev,
                          firstName: vals.firstName !== undefined ? vals.firstName : prev.firstName,
                          lastName: vals.lastName !== undefined ? vals.lastName : prev.lastName,
                          username: vals.username !== undefined ? vals.username : prev.username,
                          password: vals.password !== undefined ? vals.password : prev.password,
                        }));
                        goToStep(2);
                      }}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors"
                    >
                      {!isRTL && <ArrowLeft size={16} />}
                      {t('onboarding.back')}
                      {isRTL && <ArrowLeft size={16} />}
                    </button>
                    {isAdditionalLocation && (
                      <button
                        type="button"
                        onClick={() => navigate('/owner')}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-mintcom-green dark:text-stone-300 dark:hover:text-mintcom-green transition-colors"
                      >
                        <LayoutDashboard size={16} />
                        {t('common.dashboard', { defaultValue: 'Go to Dashboard' })}
                      </button>
                    )}
                  </div>
                  <h2 className="font-sans text-2xl sm:text-3xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight mb-2">
                    {isAdditionalLocation
                      ? t('onboarding.step4.lockedTitle', { defaultValue: 'Owner Login Ready' })
                      : t('onboarding.step4.title')}
                  </h2>
                  <p className="text-sm font-sans text-stone-600 dark:text-zinc-300">
                    {isAdditionalLocation
                      ? t('onboarding.step4.lockedSubtitle', { defaultValue: 'Your universal owner account is already linked to this account.' })
                      : t('onboarding.step4.subtitle')}
                  </p>
                  <div className="mt-4 p-3 bg-mintcom-green/10 text-mintcom-green text-sm rounded-xl font-sans border border-mintcom-green/20">
                    <p>
                      {isAdditionalLocation
                        ? t('onboarding.step4.lockedNote', {
                            defaultValue:
                              'Your previous universal owner account already has access to all locations. These details are locked here to prevent duplicate owner accounts.',
                          })
                        : t('onboarding.step4.step2Note')}
                    </p>
                  </div>
                </div>

                {isAdditionalLocation ? (
                  <div className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-900 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 shrink-0 text-mintcom-green" size={20} />
                        <p className="text-sm font-sans font-semibold leading-6">
                          {t('onboarding.step4.universalOwnerNotice', {
                            defaultValue:
                              'This owner login is universal. It will manage POS and Back Office access for this new location automatically after launch.',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-sans text-stone-400 ml-1">
                          {t('onboarding.step4.firstName')}
                        </label>
                        <div className="relative">
                          <User className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                          <input
                            value={ownerLoginDisplay.firstName}
                            readOnly
                            className="w-full bg-stone-100 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ps-12 pe-4 text-base sm:text-sm font-sans font-normal text-stone-600 dark:text-zinc-300"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-sans text-stone-400 ml-1">
                          {t('onboarding.step4.lastName')}
                        </label>
                        <div className="relative">
                          <User className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                          <input
                            value={ownerLoginDisplay.lastName}
                            readOnly
                            className="w-full bg-stone-100 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ps-12 pe-4 text-base sm:text-sm font-sans font-normal text-stone-600 dark:text-zinc-300"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-sans text-stone-400 ml-1">
                        {t('onboarding.step4.username')}
                      </label>
                      <div className="relative">
                        <User className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                        <input
                          value={
                            isOwnerLoginLoading
                              ? t('onboarding.step4.loadingOwnerLogin', { defaultValue: 'Loading owner login...' })
                              : ownerLoginDisplay.username
                          }
                          readOnly
                          className="w-full bg-stone-100 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ps-12 pe-12 text-base sm:text-sm font-sans font-normal text-stone-600 dark:text-zinc-300"
                        />
                        <Lock className="absolute end-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-sans text-stone-400 ml-1">
                        {t('onboarding.step4.ownerEmail', { defaultValue: 'Owner Email' })}
                      </label>
                      <div className="relative">
                        <User className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                        <input
                          value={ownerLoginDisplay.email}
                          readOnly
                          className="w-full bg-stone-100 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl py-4 ps-12 pe-12 text-base sm:text-sm font-sans font-normal text-stone-600 dark:text-zinc-300"
                        />
                        <Lock className="absolute end-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                      </div>
                      <p className="text-xs font-sans text-stone-500 dark:text-zinc-400 ml-1">
                        {t('onboarding.step4.lockedHelper', {
                          defaultValue:
                            'Edit the universal owner login from Employees or Account Settings, not from location setup.',
                        })}
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        type="button"
                        onClick={() => onStep3Submit({ lockedOwner: true })}
                        disabled={isOwnerLoginLoading || isLoading}
                        className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={15} /> : null}
                        {isRTL && <ArrowRight size={15} className="shrink-0" />}
                        {t('onboarding.nextStep')}
                        {!isRTL && <ArrowRight size={15} className="shrink-0" />}
                      </button>
                    </div>
                  </div>
                ) : (
                <form onSubmit={form3.handleSubmit(onStep3Submit)} autoComplete="off" className="space-y-6" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-sans text-stone-400 ml-1">
                        {t('onboarding.step4.firstName')} <span className="text-mintcom-red">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                        <input maxLength={255}
                          type="text"
                          autoComplete="new-password"
                          autoCorrect="off"
                          spellCheck={false}
                          {...form3.register('firstName', {
                            onChange: (e) => updateFormData((prev: any) => ({ ...prev, firstName: e.target.value })),
                          })}
                          className={`w-full bg-white dark:bg-zinc-900/60 border ${form3.formState.errors.firstName ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ps-12 pe-4 text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                          placeholder={formatInputPlaceholder(t('onboarding.step4.firstNamePlaceholder'), t('common.locale'))}
                        />
                      </div>
                      {form3.formState.errors.firstName && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 ml-1">{form3.formState.errors.firstName.message as string}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-sans text-stone-400 ml-1">
                        {t('onboarding.step4.lastName')} <span className="text-mintcom-red">*</span>
                      </label>
                      <div className="relative group">
                        <User className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                        <input maxLength={255}
                          type="text"
                          autoComplete="new-password"
                          autoCorrect="off"
                          spellCheck={false}
                          {...form3.register('lastName', {
                            onChange: (e) => updateFormData((prev: any) => ({ ...prev, lastName: e.target.value })),
                          })}
                          className={`w-full bg-white dark:bg-zinc-900/60 border ${form3.formState.errors.lastName ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ps-12 pe-4 text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                          placeholder={formatInputPlaceholder(t('onboarding.step4.lastNamePlaceholder'), t('common.locale'))}
                        />
                      </div>
                      {form3.formState.errors.lastName && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 ml-1">{form3.formState.errors.lastName.message as string}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-sans text-stone-400 ml-1 flex items-center">
                      {t('onboarding.step4.username')} <span className="text-mintcom-red mx-1">*</span>
                      <QuickInfo text={t('onboarding.step4.usernameTip')} />
                    </label>
                    <div className="relative group">
                      <User className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                      <input maxLength={255}
                        type="text"
                        autoComplete="new-password"
                        autoCorrect="off"
                        spellCheck={false}
                        {...form3.register('username', {
                          onChange: (e) => updateFormData((prev: any) => ({ ...prev, username: e.target.value })),
                        })}
                        className={`w-full bg-white dark:bg-zinc-900/60 border ${form3.formState.errors.username ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ps-12 pe-4 text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                        placeholder={formatInputPlaceholder(t('onboarding.step4.usernamePlaceholder'), t('common.locale'))}
                      />
                    </div>
                    {form3.formState.errors.username && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 ml-1">{form3.formState.errors.username.message as string}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-sans text-stone-400 ml-1 flex items-center">
                      {t('onboarding.step4.password')} <span className="text-mintcom-red mx-1">*</span>
                      <QuickInfo text={t('onboarding.step4.passwordTip')} />
                    </label>
                    <div className="relative group">
                      <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                      <input maxLength={255}
                        type={showAdminPassword ? "text" : "password"}
                        autoComplete="new-password"
                        {...form3.register('password', {
                          onChange: (e) => updateFormData((prev: any) => ({ ...prev, password: e.target.value })),
                        })}
                        className={`w-full bg-white dark:bg-zinc-900/60 border ${form3.formState.errors.password ? 'border-mintcom-red ring-2 ring-mintcom-red/20' : 'border-stone-200 dark:border-zinc-800'} rounded-2xl py-4 ps-12 pe-12 text-base sm:text-sm font-sans font-normal text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 transition-all`}
                        placeholder={formatInputPlaceholder(t('onboarding.step4.passwordPlaceholder'), t('common.locale'))}
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute end-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors"
                      >
                        {showAdminPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {form3.formState.errors.password && <p className="text-mintcom-red text-xs font-sans text-stone-500 mt-1 ml-1">{form3.formState.errors.password.message as string}</p>}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                    >
                      {isRTL && <ArrowRight size={15} className="shrink-0" />}
                      {t('onboarding.nextStep')}
                      {!isRTL && <ArrowRight size={15} className="shrink-0" />}
                    </button>
                  </div>
                </form>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Trial & Payment — two cards side by side (plan | payment) */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-6xl px-4"
            >
              <div className="mb-6 flex justify-between items-center px-2">
                <button
                  type="button"
                  onClick={() => {
                    const vals = form4.getValues();
                    updateFormData((prev: any) => ({
                      ...prev,
                      billingCycle,
                      cardName: vals.cardName !== undefined ? vals.cardName : prev.cardName,
                      cardNumber: vals.cardNumber !== undefined ? vals.cardNumber : prev.cardNumber,
                      expiryDate: vals.expiryDate !== undefined ? vals.expiryDate : prev.expiryDate,
                      cvv: vals.cvv !== undefined ? vals.cvv : prev.cvv,
                      useSavedCard,
                      billingConsent,
                    }));
                    goToStep(3);
                  }}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white transition-colors"
                >
                  {!isRTL && <ArrowLeft size={16} />}
                  {t('onboarding.back')}
                  {isRTL && <ArrowLeft size={16} />}
                </button>
                {isAdditionalLocation && (
                  <button
                    type="button"
                    onClick={() => navigate('/owner')}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-mintcom-green dark:text-stone-300 dark:hover:text-mintcom-green transition-colors"
                  >
                    <LayoutDashboard size={16} />
                    {t('common.dashboard', { defaultValue: 'Go to Dashboard' })}
                  </button>
                )}
              </div>

              <form
                onSubmit={form4.handleSubmit(onStep4Submit)}
                autoComplete="off"
                dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:shadow-none lg:divide-x lg:divide-stone-200 dark:lg:divide-zinc-800">
                  {/* ── LEFT: plan / trial summary ── */}
                  <div className="flex flex-col gap-6 p-8 lg:p-10">
                    <div>
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                          <ShieldCheck size={19} strokeWidth={1.75} />
                        </span>
                        <div className="min-w-0">
                          <h2 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">
                            {isTrialFlow
                              ? t('onboarding.step2.trialTitle')
                              : t('onboarding.step2.activateTitle')}
                          </h2>
                          {isTrialFlow ? (
                            <span className="mt-1 inline-flex items-center rounded-full bg-yellow-400 px-2.5 py-0.5 text-[11px] font-sans font-bold text-black">
                              {t('onboarding.step2.freeDays', {
                                defaultValue: '{{days}} DAYS FREE',
                                days: TRIAL_DAYS,
                              })}
                            </span>
                          ) : (
                            <span className="mt-1 inline-flex items-center rounded-full bg-mintcom-green px-2.5 py-0.5 text-[11px] font-sans font-bold text-black">
                              {selectedPriceWithPeriod}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">
                        {isTrialFlow
                          ? t('onboarding.step2.trialDesc')
                          : t('onboarding.step2.activateDesc', { amount: selectedPriceWithPeriod })}
                      </p>
                    </div>

                    {/* Billing cycle toggle */}
                    <div>
                      {isTrialFlow && (
                        <p className="mb-2 text-sm font-sans leading-relaxed text-stone-600 dark:text-zinc-300">
                          {t('onboarding.step2.trialChooseCycleHint', {
                            defaultValue: "Pick what you'll be billed after your free trial",
                          })}
                        </p>
                      )}
                      <div className="inline-grid w-full grid-cols-2 gap-1 rounded-xl border border-stone-200 bg-white p-1 dark:border-zinc-800 dark:bg-transparent">
                        <button
                          type="button"
                          onClick={() => {
                            setBillingCycle(BILLING_CYCLES.MONTHLY);
                            updateFormData((prev: any) => ({ ...prev, billingCycle: BILLING_CYCLES.MONTHLY }));
                          }}
                          className={`rounded-lg py-2 text-[13px] font-semibold transition-colors ${
                            billingCycle === BILLING_CYCLES.MONTHLY
                              ? 'bg-stone-900 text-white dark:bg-mintcom-green dark:text-black'
                              : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                          }`}
                        >
                          {t('onboarding.step2.monthly')}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBillingCycle(BILLING_CYCLES.YEARLY);
                            updateFormData((prev: any) => ({ ...prev, billingCycle: BILLING_CYCLES.YEARLY }));
                          }}
                          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-semibold transition-colors ${
                            billingCycle === BILLING_CYCLES.YEARLY
                              ? 'bg-stone-900 text-white dark:bg-mintcom-green dark:text-black'
                              : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                          }`}
                        >
                          <span>{t('onboarding.step2.yearly')}</span>
                          {yearlyDiscountPercent > 0 && (
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-sans font-bold leading-none ${
                                billingCycle === BILLING_CYCLES.YEARLY
                                  ? 'bg-black text-mintcom-green'
                                  : 'bg-mintcom-green/15 text-mintcom-green'
                              }`}
                            >
                              {t('landing.pricing.savePercent', {
                                percent: yearlyDiscountPercent,
                                defaultValue: `Save ${yearlyDiscountPercent}%`,
                              })}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Total due */}
                    <div className="rounded-xl border border-stone-200 bg-white p-5 dark:border-zinc-800 dark:bg-transparent">
                      <span className="mb-3 block text-sm font-sans font-medium leading-relaxed text-stone-600 dark:text-zinc-300">
                        {t('onboarding.step2.totalDue')}
                      </span>

                      {isTrialFlow ? (
                        <div className="flex items-baseline gap-2">
                          <span className="font-sans text-4xl sm:text-5xl font-black leading-none text-stone-900 dark:text-zinc-100 tracking-tight">
                            {formatWholeNumber(0)}
                          </span>
                          <span className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                            {selectedUnitLabel}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start">
                          {hasLocationDiscount && (
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <span className="font-sans text-xs sm:text-sm font-bold text-stone-400 dark:text-stone-500 line-through decoration-2">
                                {formatWholeNumber(primaryDisplayPrice)} {selectedUnitLabel}
                              </span>
                              <span className="inline-flex items-center rounded-full bg-mintcom-green/15 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 dark:text-mintcom-green">
                                -{formatWholeNumber(primaryDisplayPrice - displayPrice)} {effectiveCurrency}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-2">
                            <span className="font-sans text-4xl sm:text-5xl font-black leading-none text-stone-900 dark:text-zinc-100 tracking-tight">
                              {formatWholeNumber(vatBreakdown.total)}
                            </span>
                            <span className="text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                              {selectedUnitLabel}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Price breakdown — subtotal, VAT, total */}
                      {isTrialFlow && (
                        <p className="mb-2 mt-4 text-[11px] font-sans font-bold uppercase tracking-[0.1em] text-stone-400 dark:text-stone-500">
                          {t('onboarding.step2.breakdownAfterTrial', {
                            defaultValue: 'After your free trial, each period:',
                          })}
                        </p>
                      )}
                      <div
                        className={`space-y-2 rounded-xl border border-mintcom-green/15 bg-white/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-900/60 ${
                          isTrialFlow ? '' : 'mt-4'
                        }`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-sans text-stone-600 dark:text-zinc-300">
                            {t('onboarding.step2.subtotal', { defaultValue: 'Subtotal' })}
                          </span>
                          <span className="font-sans font-bold tabular-nums text-stone-900 dark:text-zinc-100">
                            {formatWholeCurrency(vatBreakdown.subtotal)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-1.5 font-sans text-stone-600 dark:text-zinc-300">
                            {vatRule
                              ? `${vatRule.label} (${vatRule.rate}%)`
                              : t('onboarding.step2.taxNotApplicable', { defaultValue: 'Tax' })}
                            <QuickInfo
                              text={t('onboarding.step2.taxTooltip', {
                                defaultValue:
                                  'Tax is estimated from your location. The final amount is calculated for the country on your payment method.',
                              })}
                            />
                          </span>
                          <span className="font-sans font-bold tabular-nums text-stone-900 dark:text-zinc-100">
                            {vatRule ? formatWholeCurrency(vatBreakdown.vatAmount) : '—'}
                          </span>
                        </div>

                        <div className="my-1 border-t border-dashed border-stone-200 dark:border-zinc-800" />

                        <div className="flex items-center justify-between">
                          <span className="font-sans text-sm font-bold text-stone-900 dark:text-zinc-100">
                            {isTrialFlow
                              ? t('onboarding.step2.totalAfterTrial', { defaultValue: 'Total after trial' })
                              : t('onboarding.step2.total', { defaultValue: 'Total' })}
                          </span>
                          <span className="flex items-baseline gap-1.5">
                            <span className="font-sans text-lg font-black tabular-nums text-mintcom-green">
                              {formatWholeCurrency(vatBreakdown.total)}
                            </span>
                            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-500 dark:text-zinc-400">
                              {selectedPeriodLabel}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-mintcom-green">
                        <RefreshCw size={14} className="shrink-0" />
                        <span className="text-sm font-sans font-bold">
                          {isTrialFlow
                            ? t('onboarding.step2.trialThenPrice', {
                                defaultValue: `Then ${selectedPriceWithPeriod}, billed after your ${TRIAL_DAYS}-day trial`,
                                price: selectedPriceWithPeriod,
                                days: TRIAL_DAYS,
                              })
                            : t('onboarding.step2.billedCycle', {
                                defaultValue: `Billed ${selectedPlanLabel.toLowerCase()}`,
                                cycle: selectedPlanLabel.toLowerCase(),
                              })}
                        </span>
                      </div>

                      {billingCycle === BILLING_CYCLES.YEARLY && (
                        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <img src={MintcomLeafIcon} alt="" style={{ width: 12, height: 12 }} className="scale-x-[-1] object-contain text-mintcom-green" />
                          <span className="text-xs font-bold uppercase tracking-wider text-mintcom-green">
                            {t('landing.pricing.save')} {formatWholeCurrency(yearlySavings)}{' '}
                            {t('landing.pricing.perYear')}
                          </span>
                          <span className="text-xs text-stone-400 line-through">
                            {formatWholeCurrency(currentMonthlyPrice * 12)} {t('landing.pricing.perYear')}
                          </span>
                        </div>
                      )}

                      {hasLocationDiscount && (
                        <div className="mt-4 flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 dark:border-zinc-800 dark:bg-transparent">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                            <Tags size={16} strokeWidth={1.75} />
                          </span>
                          <div className="leading-tight">
                            <p className="text-sm font-sans font-bold text-stone-900 dark:text-zinc-100">
                              {t('onboarding.step2.addedLocation', { defaultValue: 'Added Location' })}
                            </p>
                            <p className="text-xs font-sans font-medium text-stone-500 dark:text-zinc-400 mt-0.5">
                              {t('onboarding.step2.existingAccountBenefit', {
                                defaultValue: 'Existing Account Benefit',
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trial disclosure */}
                    {isTrialFlow && (
                      <div className="flex items-start gap-3 rounded-xl border border-stone-200 bg-white p-4 dark:border-zinc-800 dark:bg-transparent">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                          <CalendarClock size={16} strokeWidth={1.75} />
                        </span>
                        <div className="leading-snug">
                          <p className="text-sm font-sans font-bold text-stone-900 dark:text-zinc-100">
                            {t('onboarding.step2.trialDisclosureTitle', {
                              defaultValue: `Free until ${trialEndDateLabel}`,
                              date: trialEndDateLabel,
                            })}
                          </p>
                          <p className="mt-1 text-xs font-sans text-stone-600 dark:text-zinc-300">
                            {t('onboarding.step2.trialDisclosureBody', {
                              defaultValue: `After your 14-day free trial ends on ${trialEndDateLabel}, you'll start paying ${selectedPriceWithPeriod} for this location. Cancel anytime before then and you won't be charged.`,
                              date: trialEndDateLabel,
                              price: selectedPriceWithPeriod,
                              days: TRIAL_DAYS,
                            })}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── RIGHT: payment details ── */}
                  <div className="flex flex-col gap-5 border-t border-stone-100 p-8 dark:border-zinc-800 lg:border-t-0 lg:p-10">
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-[11px] font-sans font-bold uppercase tracking-[0.12em] text-mintcom-green">
                        <Lock size={13} className="shrink-0" />
                        <span>
                          {t('paymentMethods.modal.subtitle', {
                            defaultValue: 'Secure · 256-bit encrypted',
                          })}
                        </span>
                      </div>
                      <h3 className="font-sans text-xl font-bold text-stone-900 dark:text-zinc-100 sm:text-2xl">
                        {t('onboarding.step2.paymentDetails', {
                          defaultValue: 'Payment Details',
                        })}
                      </h3>
                    </div>

                    {/* Saved card options */}
                    {hasSavedCard && (
                      <div className="space-y-3">
                        <div
                          onClick={() => {
                            setUseSavedCard(true);
                            updateFormData((prev: any) => ({ ...prev, useSavedCard: true }));
                          }}
                          className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                            useSavedCard
                              ? 'border-mintcom-green bg-mintcom-green/5'
                              : 'border-stone-200 bg-white hover:border-stone-300 dark:border-zinc-800 dark:bg-transparent dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                useSavedCard ? 'bg-mintcom-green/15 text-mintcom-green' : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300'
                              }`}
                            >
                              <CreditCard size={19} strokeWidth={1.75} />
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-sans font-bold text-stone-900 dark:text-zinc-100">
                                {t('onboarding.step2.useSaved')}
                              </p>
                              <p className="text-xs font-sans text-stone-500">
                                **** **** **** {savedCardLast4}
                              </p>
                            </div>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                useSavedCard
                                  ? 'border-mintcom-green bg-mintcom-green'
                                  : 'border-stone-300'
                              }`}
                            >
                              {useSavedCard && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() => {
                            setUseSavedCard(false);
                            updateFormData((prev: any) => ({ ...prev, useSavedCard: false }));
                          }}
                          className={`cursor-pointer rounded-2xl border p-4 transition-colors ${
                            !useSavedCard
                              ? 'border-mintcom-green bg-mintcom-green/5'
                              : 'border-stone-200 bg-white hover:border-stone-300 dark:border-zinc-800 dark:bg-transparent dark:hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                                !useSavedCard ? 'bg-mintcom-green/15 text-mintcom-green' : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300'
                              }`}
                            >
                              <Plus
                                size={19}
                                strokeWidth={1.75}
                                className={!useSavedCard ? 'text-mintcom-green' : 'text-stone-400'}
                              />
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-sans font-bold text-stone-900 dark:text-zinc-100">
                                {t('onboarding.step2.addNew')}
                              </p>
                              <p className="text-xs font-sans text-stone-500">
                                {t('onboarding.step2.differentMethod')}
                              </p>
                            </div>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                                !useSavedCard
                                  ? 'border-mintcom-green bg-mintcom-green'
                                  : 'border-stone-300'
                              }`}
                            >
                              {!useSavedCard && <div className="h-2 w-2 rounded-full bg-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* New card form */}
                    {(!hasSavedCard || !useSavedCard) && (
                      <div className="space-y-1">
                        <EmbeddedCardField
                          label={t('paymentMethods.modal.cardNumber', {
                            defaultValue: 'Card Number',
                          })}
                          error={form4.formState.errors.cardNumber?.message as string | undefined}
                        >
                          <input
                            type="text"
                            autoComplete="cc-number"
                            {...form4.register('cardNumber')}
                            value={cardNumberValue}
                            onChange={(e) => {
                              const formatted = formatCardNumberInput(e.target.value);
                              form4.setValue('cardNumber', formatted, {
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                              form4.clearErrors('cardNumber');
                              updateFormData((prev: any) => ({ ...prev, cardNumber: formatted }));
                            }}
                            maxLength={MAX_FORMATTED_CARD_NUMBER_LENGTH}
                            inputMode="numeric"
                            placeholder="0000 0000 0000 0000"
                            className={CARD_INPUT_CLASS}
                          />
                          <CreditCard size={18} className="shrink-0 text-stone-400" aria-hidden />
                        </EmbeddedCardField>

                        <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2 sm:items-start">
                          <EmbeddedCardField
                            label={t('paymentMethods.modal.expiry', {
                              defaultValue: 'Expiry Date',
                            })}
                            error={form4.formState.errors.expiryDate?.message as string | undefined}
                          >
                            <input
                              type="text"
                              autoComplete="cc-exp"
                              {...form4.register('expiryDate')}
                              value={form4.watch('expiryDate') || ''}
                              onChange={(e) => {
                                const formatted = formatExpiryInput(e.target.value);
                                form4.setValue('expiryDate', formatted, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                });
                                form4.clearErrors('expiryDate');
                                updateFormData((prev: any) => ({ ...prev, expiryDate: formatted }));
                              }}
                              maxLength={5}
                              inputMode="numeric"
                              placeholder="MM/YY"
                              className={CARD_INPUT_CLASS}
                            />
                          </EmbeddedCardField>

                          <EmbeddedCardField
                            label={
                              <span className="flex items-center">
                                {t('paymentMethods.modal.cvv', { defaultValue: 'CVV' })}
                                <QuickInfo text={t('paymentMethods.modal.cvvTip', { defaultValue: '3 or 4-digit security code on the back of your card (or front for Amex).' })} />
                              </span>
                            }
                            error={form4.formState.errors.cvv?.message as string | undefined}
                          >
                            <input
                              type="password"
                              autoComplete="cc-csc"
                              {...form4.register('cvv')}
                              value={form4.watch('cvv') || ''}
                              onChange={(e) => {
                                const val = getCardDigits(e.target.value).slice(0, cvvLength);
                                form4.setValue(
                                  'cvv',
                                  val,
                                  {
                                    shouldDirty: true,
                                    shouldTouch: true,
                                  },
                                );
                                form4.clearErrors('cvv');
                                updateFormData((prev: any) => ({ ...prev, cvv: val }));
                              }}
                              maxLength={4}
                              inputMode="numeric"
                              placeholder="•••"
                              className={CARD_INPUT_CLASS}
                            />
                          </EmbeddedCardField>
                        </div>

                        <EmbeddedCardField
                          label={t('paymentMethods.modal.cardholder', {
                            defaultValue: 'Cardholder Name',
                          })}
                          error={form4.formState.errors.cardName?.message as string | undefined}
                        >
                          <input
                            maxLength={255}
                            type="text"
                            autoComplete="cc-name"
                            {...form4.register('cardName')}
                            value={form4.watch('cardName') || ''}
                            onChange={(e) => {
                              form4.setValue('cardName', e.target.value, {
                                shouldDirty: true,
                                shouldTouch: true,
                              });
                              form4.clearErrors('cardName');
                              updateFormData((prev: any) => ({ ...prev, cardName: e.target.value }));
                            }}
                            placeholder={t('paymentMethods.modal.cardholderPlaceholder', {
                              defaultValue: 'Name as it appears on card',
                            })}
                            className={CARD_INPUT_CLASS}
                          />
                        </EmbeddedCardField>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                          <CardBrandMark brand="mastercard" />
                          <CardBrandMark brand="visa" />
                          <CardBrandMark brand="amex" />
                        </div>
                      </div>
                    )}

                    <div className="mt-auto space-y-3 pt-2">
                      <button
                        type={hasSavedCard && useSavedCard ? 'button' : 'submit'}
                        onClick={
                          hasSavedCard && useSavedCard ? () => onStep4Submit({}) : undefined
                        }
                        disabled={isLoading || !billingConsent}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green py-3 text-sm font-semibold text-black transition-colors hover:bg-mintcom-green/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isLoading ? <Loader2 className="animate-spin" size={15} /> : null}
                        {isTrialFlow
                          ? t('onboarding.step2.startTrialButton')
                          : t('onboarding.completeLaunch')}
                        {!isLoading && (
                          isRTL
                            ? <ArrowLeft size={15} className="shrink-0" />
                            : <ArrowRight size={15} className="shrink-0" />
                        )}
                      </button>

                      {/* Mandatory recurring-billing disclosure, directly above consent */}
                      <p className="text-center text-[11px] font-sans leading-relaxed text-stone-500 dark:text-zinc-400">
                        {isTrialFlow
                          ? t('onboarding.step2.trialDisclosureCheckout', {
                              defaultValue:
                                '{{days}}-day free trial: You will not be charged today. Your subscription will auto-renew on {{date}} and you will be charged {{amount}} (incl. applicable VAT) every {{cycle}} until you cancel.',
                              days: TRIAL_DAYS,
                              date: firstChargeDateLabel,
                              amount: vatInclusiveTotalLabel,
                              cycle: recurringCycleNoun,
                            })
                          : t('onboarding.step2.paidDisclosureCheckout', {
                              defaultValue:
                                'You will be charged {{amount}} (incl. applicable VAT) today. Your subscription will auto-renew and you will be charged {{amount}} every {{cycle}} until you cancel.',
                              amount: vatInclusiveTotalLabel,
                              cycle: recurringCycleNoun,
                            })}
                        {' '}
                        {t('onboarding.step2.cancelPath', {
                          defaultValue:
                            'You can cancel at any time in Owner Portal → Billing. View our',
                        })}{' '}
                        <a
                          href="/legal/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-stone-600 underline-offset-2 hover:text-mintcom-green hover:underline dark:text-stone-300"
                        >
                          {t('onboarding.step5.terms', { defaultValue: 'Terms of Service' })}
                        </a>
                        {', '}
                        {t('onboarding.step2.consentAnd', { defaultValue: 'and' })}{' '}
                        <a
                          href="/legal/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-stone-600 underline-offset-2 hover:text-mintcom-green hover:underline dark:text-stone-300"
                        >
                          {t('onboarding.step5.privacy', { defaultValue: 'Privacy Policy' })}
                        </a>
                        .
                      </p>

                      {/* Mandatory unticked authorization checkbox */}
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors ${
                          consentError && !billingConsent
                            ? 'border-mintcom-red/60 bg-mintcom-red/5'
                            : 'border-stone-200 bg-stone-100 dark:border-zinc-800 dark:bg-zinc-800'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={billingConsent}
                          onChange={(e) => {
                            setBillingConsent(e.target.checked);
                            if (e.target.checked) setConsentError(false);
                            updateFormData((prev: any) => ({ ...prev, billingConsent: e.target.checked }));
                          }}
                          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-mintcom-green"
                        />
                        <span className="text-[11px] font-sans leading-relaxed text-stone-600 dark:text-zinc-300">
                          {isTrialFlow
                            ? t('onboarding.step2.consentCheckboxTrial', {
                                defaultValue:
                                  'You agree that Mintcom will charge your card in the amount above starting on {{date}} and on a recurring {{cycleNoun}} basis until you cancel in accordance with our Terms. You can cancel at any time in your account settings.',
                                date: firstChargeDateLabel,
                                cycleNoun: recurringCycleNoun,
                              })
                            : t('onboarding.step2.consentCheckboxPaid', {
                                defaultValue:
                                  'You agree that Mintcom will charge your card in the amount above now and on a recurring {{cycleNoun}} basis until you cancel in accordance with our Terms. You can cancel at any time in your account settings.',
                                cycleNoun: recurringCycleNoun,
                              })}
                        </span>
                      </label>
                      {consentError && !billingConsent && (
                        <p className="text-center text-[11px] font-sans font-semibold text-mintcom-red">
                          {t('onboarding.step2.consentRequired', {
                            defaultValue: 'Please authorize recurring billing to continue.',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full max-w-6xl px-4"
            >
              {/* Top Hero Bar */}
              <div className="mb-6">
                <div className="bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl p-6 lg:p-8 overflow-hidden shadow-sm">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.2 }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green"
                      >
                        <img
                          src={MintcomLeafIcon}
                          alt=""
                          className="h-5 w-5 object-contain dark:hidden"
                        />
                        <img
                          src={MintcomLeafIconWhite}
                          alt=""
                          className="hidden h-5 w-5 object-contain dark:block"
                        />
                      </motion.div>
                      <div>
                        <motion.h2
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 }}
                          className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100"
                        >
                          {t('onboarding.step5.welcomeTitle')}
                        </motion.h2>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-stone-500 dark:text-zinc-400"
                        >
                          <span className="inline-flex items-center rounded-lg bg-mintcom-green/15 px-2.5 py-0.5 font-sans font-bold text-emerald-800 dark:text-mintcom-green">
                            {formData.name}
                          </span>
                          <span>{t('onboarding.step5.isReadyToGo')}</span>
                        </motion.div>
                      </div>
                    </div>

                    <motion.div
                      id="tour-open-portal"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 }}
                      className="relative shrink-0 w-full lg:w-auto"
                    >
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          const newEstablishment = establishments.find(e => e.id === formData.establishmentId);
                          if (newEstablishment) {
                            setCurrentEstablishment(newEstablishment);
                          }
                          window.open(`/owner/establishments?highlight=${formData.establishmentId}&setup=1`, '_blank');
                        }}
                        className="relative w-full lg:w-auto flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                      >
                        <Building2 size={22} />
                        <span>{t('onboarding.step5.openOwnerPortal')}</span>
                        <ExternalLink size={18} />
                      </motion.button>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Column: Download Apps & Credentials (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* POS App */}
                  <motion.div
                    id="tour-pos-app"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 shadow-sm transition-colors dark:bg-orange-500/20">
                        <Tablet size={28} className="text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-sans text-lg font-bold text-stone-900 dark:text-zinc-100">{t('onboarding.step5.posApp')}</h3>
                        <p className="mt-0.5 text-sm leading-snug text-stone-500 dark:text-zinc-400">{t('onboarding.step5.posAppDesc')}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          {hasAndroidDownload ? (
                            <a
                              href={ANDROID_DOWNLOAD_URL}
                              download={isDirectInstallerDownload(ANDROID_DOWNLOAD_URL) ? true : undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t('common.getItOnGooglePlay')}
                              className="inline-flex shrink-0 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/40 rounded-md"
                            >
                              <img src={GooglePlayBadge} alt={t('common.getItOnGooglePlay')} className="block h-[44px] w-auto object-contain" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              aria-label={t('common.androidDownloadComingSoon')}
                              className="inline-flex shrink-0 cursor-not-allowed opacity-50"
                            >
                              <img src={GooglePlayBadge} alt={t('common.getItOnGooglePlay')} className="block h-[44px] w-auto object-contain" />
                            </button>
                          )}
                          {hasIosDownload ? (
                            <a
                              href={IOS_DOWNLOAD_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t('common.downloadOnAppStore')}
                              className="inline-flex shrink-0 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/40 rounded-md"
                            >
                              <img src={AppStoreBadge} alt={t('common.downloadOnAppStore')} className="block h-[44px] w-auto object-contain" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              aria-label={t('common.iosDownloadComingSoon')}
                              className="inline-flex shrink-0 cursor-not-allowed opacity-50"
                            >
                              <img src={AppStoreBadge} alt={t('common.downloadOnAppStore')} className="block h-[44px] w-auto object-contain" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Owner App */}
                  <motion.div
                    id="tour-owner-app"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 shadow-sm transition-colors dark:bg-blue-500/20">
                        <Smartphone size={28} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-sans text-lg font-bold text-stone-900 dark:text-zinc-100">{t('onboarding.step5.ownerApp')}</h3>
                        <p className="mt-0.5 text-sm leading-snug text-stone-500 dark:text-zinc-400">{t('onboarding.step5.ownerAppDesc')}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2.5">
                          {hasOwnerAndroidDownload ? (
                            <a
                              href={OWNER_ANDROID_DOWNLOAD_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t('common.getItOnGooglePlay')}
                              className="inline-flex shrink-0 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/40 rounded-md"
                            >
                              <img src={GooglePlayBadge} alt={t('common.getItOnGooglePlay')} className="block h-[44px] w-auto object-contain" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              aria-label={t('common.ownerAndroidDownloadComingSoon')}
                              className="inline-flex shrink-0 cursor-not-allowed opacity-50"
                            >
                              <img src={GooglePlayBadge} alt={t('common.getItOnGooglePlay')} className="block h-[44px] w-auto object-contain" />
                            </button>
                          )}
                          {hasOwnerIosDownload ? (
                            <a
                              href={OWNER_IOS_DOWNLOAD_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={t('common.downloadOnAppStore')}
                              className="inline-flex shrink-0 transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-mintcom-green/40 rounded-md"
                            >
                              <img src={AppStoreBadge} alt={t('common.downloadOnAppStore')} className="block h-[44px] w-auto object-contain" />
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              aria-label={t('common.ownerIosDownloadComingSoon')}
                              className="inline-flex shrink-0 cursor-not-allowed opacity-50"
                            >
                              <img src={AppStoreBadge} alt={t('common.downloadOnAppStore')} className="block h-[44px] w-auto object-contain" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Location Credentials */}
                  <motion.div
                    id="tour-location-stats"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm text-stone-900 dark:text-zinc-100"
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-3 border-b border-stone-100 dark:border-white/5 mb-3">
                      <div className="w-10 h-10 bg-mintcom-green/15 rounded-xl flex items-center justify-center">
                        <Building2 size={20} className="text-mintcom-green" />
                      </div>
                      <div>
                        <h3 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.locationReady')}</h3>
                        <p className="text-xs text-stone-500">{t('onboarding.step5.setupComplete')}</p>
                      </div>
                    </div>

                    {/* Location ID Row */}
                    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-stone-100 dark:border-white/5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Hash size={16} className="text-stone-400 dark:text-stone-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">{t('onboarding.step5.locationId')}</p>
                          <p className="font-mono text-stone-900 dark:text-zinc-100 font-sans font-bold text-sm truncate">{formData.establishmentLoginId}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyField(formData.establishmentLoginId, 'id')}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 transition hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-stone-300 dark:hover:bg-white/10"
                        title={t('common.copy')}
                      >
                        {copiedField === 'id' ? (
                          <>
                            <Check size={13} className="text-mintcom-green" />
                            <span className="text-mintcom-green">{t('common.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} />
                            <span>{t('common.copy')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Password Row */}
                    <div className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Lock size={16} className="text-stone-400 dark:text-stone-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-stone-400 dark:text-stone-500 mb-0.5">{t('onboarding.step5.password')}</p>
                          <p className="text-stone-900 dark:text-zinc-100 font-sans font-bold text-sm truncate font-mono tracking-wider">
                            {showStep5Password ? (formData.establishmentPassword || '••••••••') : '••••••••'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {formData.establishmentPassword && (
                          <button
                            type="button"
                            onClick={() => setShowStep5Password(!showStep5Password)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-600 transition hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-stone-300 dark:hover:bg-white/10"
                            title={showStep5Password ? 'Hide password' : 'Show password'}
                          >
                            {showStep5Password ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        )}
                        {formData.establishmentPassword && (
                          <button
                            type="button"
                            onClick={() => handleCopyField(formData.establishmentPassword, 'password')}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-700 transition hover:bg-stone-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-stone-300 dark:hover:bg-white/10"
                            title={t('common.copy')}
                          >
                            {copiedField === 'password' ? (
                              <>
                                <Check size={13} className="text-mintcom-green" />
                                <span className="text-mintcom-green">{t('common.copied')}</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                <span>{t('common.copy')}</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Right Column: Resources Grid (7 cols) */}
                <div className="lg:col-span-7">
                  <motion.div
                    id="tour-resources"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm h-full flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-5">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300">
                        <BookOpen size={19} strokeWidth={1.75} />
                      </span>
                      <div>
                        <h3 className="font-barlow text-[17px] font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('onboarding.step5.resourcesAndHelp')}</h3>
                        <p className="text-xs text-stone-500">{t('onboarding.tour.resourcesDesc')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {/* User Manual */}
                      <a
                        href={userManualDoc.path}
                        download={userManualDoc.filename}
                        className="group rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 flex flex-col justify-between"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                          <BookOpen size={19} strokeWidth={1.75} />
                        </span>
                        <div>
                          <h4 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.userManual')}</h4>
                          <p className="text-xs text-stone-500 mt-1">{t('onboarding.step5.completeGuide')}</p>
                        </div>
                      </a>

                      {/* Setup Manual */}
                      <a
                        href={setupManualDoc.path}
                        download={setupManualDoc.filename}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 flex flex-col justify-between"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                          <Settings size={19} strokeWidth={1.75} />
                        </span>
                        <div>
                          <h4 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.setupManual')}</h4>
                          <p className="text-xs text-stone-500 mt-1">{t('onboarding.step5.hardwareSetup')}</p>
                        </div>
                      </a>

                      {/* Video Tutorial */}
                      {hasVideoGuide ? (
                        <a
                          href={ONBOARDING_VIDEO_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 flex flex-col justify-between"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                            <PlayCircle size={19} strokeWidth={1.75} />
                          </span>
                          <div>
                            <h4 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.videoGuide')}</h4>
                            <p className="text-xs text-stone-500 mt-1">{t('onboarding.step5.quickStart')}</p>
                          </div>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          aria-label={t('owner.account.videoGuideComingSoon')}
                          className="group rounded-2xl border border-stone-200 bg-white p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900/60 opacity-60 cursor-not-allowed text-left flex flex-col justify-between"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                            <PlayCircle size={19} strokeWidth={1.75} />
                          </span>
                          <div>
                            <h4 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.videoGuide')}</h4>
                            <p className="text-xs text-stone-500 mt-1">{t('onboarding.step5.quickStart')}</p>
                          </div>
                        </button>
                      )}

                      {/* Q&A Center */}
                      <a
                        href="/qa"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 flex flex-col justify-between"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                          <HelpCircle size={19} strokeWidth={1.75} />
                        </span>
                        <div>
                          <h4 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.qaCenter')}</h4>
                          <p className="text-xs text-stone-500 mt-1">{t('onboarding.step5.faqs')}</p>
                        </div>
                      </a>

                      {/* Privacy */}
                      <a
                        href="/legal/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 flex flex-col justify-between"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                          <Shield size={19} strokeWidth={1.75} />
                        </span>
                        <div>
                          <h4 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.privacy')}</h4>
                          <p className="text-xs text-stone-500 mt-1">{t('onboarding.step5.dataProtection')}</p>
                        </div>
                      </a>

                      {/* Terms */}
                      <a
                        href="/legal/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 flex flex-col justify-between"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                          <Scale size={19} strokeWidth={1.75} />
                        </span>
                        <div>
                          <h4 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.terms')}</h4>
                          <p className="text-xs text-stone-500 mt-1">{t('onboarding.step5.agreement')}</p>
                        </div>
                      </a>

                      {/* About - spans 2 cols on sm */}
                      <a
                        href="/about"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-stone-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-zinc-700 col-span-2 sm:col-span-1 flex flex-col justify-between"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300 mb-3">
                          <Info size={19} strokeWidth={1.75} />
                        </span>
                        <div>
                          <h4 className="font-sans font-bold text-stone-900 dark:text-zinc-100 text-sm">{t('onboarding.step5.aboutUs')}</h4>
                          <p className="text-xs text-stone-500 mt-1">{t('onboarding.step5.ourStory')}</p>
                        </div>
                      </a>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-center"
              >
                <p className="text-sm text-stone-500">
                  {t('onboarding.step5.needHelp')} <a href="mailto:info@mintcompos.com" className="text-mintcom-green font-sans font-bold hover:underline">info@mintcompos.com</a>
                </p>
              </motion.div>

              {/* Tour Guide */}
              <TourGuide
                steps={launchCenterTourSteps}
                isOpen={isTourOpen}
                onClose={() => setIsTourOpen(false)}
                onComplete={() => setIsTourOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

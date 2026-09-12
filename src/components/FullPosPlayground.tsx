import { useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Hash,
  Headphones,
  Home,
  Inbox,
  Info,
  LayoutGrid,
  List,
  Lock,
  LogOut,
  Menu,
  Minus,
  PauseCircle,
  Package,
  Pencil,
  Percent,
  PieChart,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  Repeat,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Star,
  Trash2,
  Truck,
  User,
  UserCheck,
  Users,
  Utensils,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  getSmartQuickCashSuggestions,
  triggerCartAddFeedback,
  triggerOutOfStockBuzzer,
  saveActiveCartDraft,
  loadActiveCartDraft,
  clearActiveCartDraft,
  type OrderTender,
} from './pos-demo/posFeedback';
import { Logo } from './Logo';
import {
  DemoDashboardScreen,
  DemoNotificationsScreen,
  DemoReportsScreen,
  DemoSettingsScreen,
  DemoSupportScreen,
  emptyShift,
  PayInOutModal,
  type DemoShift,
} from './pos-demo/PosDemoExtraScreens';
import {
  DEFAULT_DEMO_SALES_SETTINGS,
  type DemoSalesSettings,
  type DemoTaxRate,
} from './pos-demo/PosDemoSettings';
import { PosDemoLogin } from './pos-demo/PosDemoLogin';
import {
  PosCardIcon,
  PosCashIcon,
  PosOtherReceiptIcon,
  PosSplitReceiptIcon,
} from './pos-demo/posPaymentIcons';
import {
  createInitialCatalog,
  salesCategoriesFromCatalog,
  salesProductsFromCatalog,
} from './pos-demo/demoCatalog';

/**
 * Full POS sandbox — styled like real Mintcom POS (mintcom-pos SalesScreen)
 * + website light/dark tokens (mintcom-dark / cream / mintcom-green).
 * No account, no API. Labels hardcoded (demo-only).
 */

/** mintcom-pos TEXT_INPUT_LIMITS.QUICK_NOTE */
const NOTE_LIMIT = 80;

type PosOption = { id: string; name: string; price: number; available?: boolean };
type PosAttribute = { id: string; name: string; multi?: boolean; required?: boolean; options: PosOption[] };
type PosProduct = {
  id: string;
  name: string;
  price: number;
  emoji: string;
  categoryId: string;
  attributes?: PosAttribute[];
  imageDataUrl?: string | null;
  trackStock?: boolean;
  availableStock?: number;
  taxId?: string | null;
  taxRate?: number;
};
type CartLine = {
  id: string;
  productId: string;
  name: string;
  basePrice: number;
  /** Net unit price after item discount (base + addons − item %) */
  unitPrice: number;
  qty: number;
  emoji: string;
  /** Optional product image for cart thumbnails (matches POS) */
  imageDataUrl?: string | null;
  addons: PosOption[];
  note?: string;
  /** Item-level discount from addon modal (POS applyItemDiscount) */
  discountPct?: number;
  discountName?: string;
  /** True when the product has add-on groups (show Selected Attributes + Edit in POS) */
  hasAttributes?: boolean;
};

const DEMO_ITEM_DISCOUNTS = [
  { id: 'none', name: 'No Discount', pct: 0 },
  { id: 'staff', name: 'Staff', pct: 10 },
  { id: 'happy', name: 'Happy Hour', pct: 15 },
  { id: 'vip', name: 'VIP', pct: 20 },
] as const;

function lineGrossUnit(line: CartLine): number {
  return line.basePrice + line.addons.reduce((s, a) => s + a.price, 0);
}

function lineNetUnit(line: CartLine, pct = line.discountPct ?? 0): number {
  return lineGrossUnit(line) * (1 - Math.max(0, pct) / 100);
}
type HeldTicket = {
  id: string;
  orderNo: number;
  type: OrderType;
  lines: CartLine[];
  discountPct: number;
  note: string;
  /** Table number or guest nickname — like real POS holdOrder nickname */
  label: string;
  at: number;
};

const HOLD_TABLE_COUNT = 12;
type OrderType = 'dine-in' | 'takeaway' | 'delivery';
type PayMethod = 'cash' | 'card' | 'cliq' | 'talabat' | 'voucher' | 'split';
/** Payment receipt panel tabs only — Split is a separate POS modal */
type CheckoutTab = 'cash' | 'card' | 'other';
type Phase = 'connect' | 'login' | 'app';
type Screen =
  | 'dashboard'
  | 'sales'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'support';
/** Demo role permissions — mirrors real POS access control */
type Perm =
  | 'sales'
  | 'dashboard'
  | 'open_shift'
  | 'close_shift'
  | 'cash_movement'
  | 'reports'
  | 'notifications'
  | 'settings'
  | 'support'
  | 'discount'
  | 'hold'
  | 'void_item'
  | 'split'
  | 'loyalty';

const ALL_PERMS: Perm[] = [
  'sales',
  'dashboard',
  'open_shift',
  'close_shift',
  'cash_movement',
  'reports',
  'notifications',
  'settings',
  'support',
  'discount',
  'hold',
  'void_item',
  'split',
  'loyalty',
];

type Staff = {
  id: string;
  name: string;
  role: string;
  pin: string;
  emoji: string;
  perms: Perm[];
  /** Short blurb on clock-in card */
  accessNote: string;
};

/**
 * Matches mintcom-pos SideBar / useNavigationMenu order.
 * Kitchen is intentionally omitted from the try-pos demo for now.
 * Icons mirror Material icons used in POS (home, person-outline, pie-chart,
 * notifications-none, support-agent, settings).
 */
const NAV_ITEMS: {
  id: Screen;
  label: string;
  short: string;
  icon: typeof Home;
  badge?: 'alerts';
  perm: Perm;
}[] = [
  { id: 'sales',          label: 'Sales',         short: 'Sales',   icon: Home,        perm: 'sales' },
  { id: 'dashboard',      label: 'Dashboard',     short: 'Home',    icon: User,        perm: 'dashboard' },
  { id: 'reports',        label: 'Reports',       short: 'Reports', icon: PieChart,    perm: 'reports' },
  { id: 'notifications',  label: 'Notifications', short: 'Alerts',  icon: Bell,        badge: 'alerts', perm: 'notifications' },
  { id: 'support',        label: 'Support',       short: 'Support', icon: Headphones,  perm: 'support' },
  { id: 'settings',       label: 'Settings',      short: 'Settings',icon: Settings,    perm: 'settings' },
];

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

/**
 * Real POS default product art (line-art package box from mintcom-pos).
 * Cache-busted so browsers/dist never keep the old open-box illustration.
 */
const DEFAULT_PRODUCT_IMG = '/default_product.png?v=pos-box';

/** POS AmountText style: "1,234.00 USD" (amount + currency code) */
const posAmount = (n: number) =>
  `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

/** Split POS amount for AmountText-like dual styling */
const splitPosAmount = (n: number) => {
  const raw = posAmount(n);
  const m = raw.match(/^([\d.,\s+-]+)\s*(.*)$/);
  return { amount: m?.[1]?.trim() ?? raw, currency: m?.[2]?.trim() ?? '' };
};

/** Product image URL: custom photo or POS default box */
const productImgSrc = (imageDataUrl?: string | null) =>
  imageDataUrl && imageDataUrl.trim() ? imageDataUrl : DEFAULT_PRODUCT_IMG;

/**
 * Product image treatment (matches POS ProductCard):
 * - custom photos: cover the frame
 * - default package box: contain + centered so the full box is visible (not cropped)
 */
const productImgClass = (
  imageDataUrl?: string | null,
  extra = '',
  opts?: { thumb?: boolean },
) => {
  const hasCustom = !!(imageDataUrl && imageDataUrl.trim());
  // Thumbs need tiny padding so the default box is still visible at 40px
  const pad = opts?.thumb ? 'p-1' : 'p-4 sm:p-5';
  return [
    'h-full w-full',
    hasCustom ? 'object-cover' : `object-contain object-center ${pad}`,
    extra,
  ]
    .filter(Boolean)
    .join(' ');
};

const productImgWrapClass = (imageDataUrl?: string | null, extra = '') =>
  [
    imageDataUrl && imageDataUrl.trim()
      ? 'bg-gray-50 dark:bg-mintcom-dark'
      : 'bg-white dark:bg-mintcom-surface',
    extra,
  ]
    .filter(Boolean)
    .join(' ');

/** Compact POS-style price: amount + small currency (e.g. 4.25 USD) */
const PriceText = ({
  value,
  size = 'md',
  className = '',
}: {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) => {
  const { amount, currency } = splitPosAmount(value);
  const amountCls =
    size === 'lg'
      ? 'text-lg font-extrabold'
      : size === 'sm'
        ? 'text-[13px] font-extrabold'
        : 'text-base font-extrabold sm:text-[17px]';
  const curCls =
    size === 'lg' ? 'text-[11px]' : size === 'sm' ? 'text-[9px]' : 'text-[10px] sm:text-[11px]';
  return (
    <span className={`inline-flex items-baseline gap-1 tabular-nums text-mintcom-green ${className}`}>
      <span className={amountCls}>{amount}</span>
      {currency ? <span className={`${curCls} font-bold`}>{currency}</span> : null}
    </span>
  );
};

/* ─── Demo loyalty types (mirrors POS LoyaltyModal) ─── */
type DemoLoyaltyCustomer = {
  id: string;
  name: string;
  phone: string;
  points: number;
  tier: string;
};

type DemoLoyaltyReward = {
  id: string;
  name: string;
  type: 'DISCOUNT' | 'FREE_ITEM';
  pointsRequired: number;
  discountPercentage?: number;
  freeCategoryId?: string;
  freeCategoryName?: string;
};

type DemoAppliedReward = {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FREE_ITEM';
  value: number;
  pointsCost: number;
  freeItem?: {
    productId: string;
    name: string;
    emoji?: string;
    imageDataUrl?: string | null;
    addons: PosOption[];
    note?: string;
  };
};

/** Single demo guest — shown in the search fields; Check Points loads them */
const DEMO_LOYALTY_CUSTOMERS: DemoLoyaltyCustomer[] = [
  { id: 'c1', name: 'Emma Wilson', phone: '0790123456', points: 1000, tier: 'Gold' },
];

const DEMO_LOYALTY_REWARDS: DemoLoyaltyReward[] = [
  { id: 'r1', name: '10% Off', type: 'DISCOUNT', pointsRequired: 100, discountPercentage: 10 },
  { id: 'r2', name: '15% Off', type: 'DISCOUNT', pointsRequired: 200, discountPercentage: 15 },
  {
    id: 'r3',
    name: 'Free Pastry',
    type: 'FREE_ITEM',
    pointsRequired: 150,
    freeCategoryId: 'pastries',
    freeCategoryName: 'Pastries',
  },
  {
    id: 'r4',
    name: 'Free Drink',
    type: 'FREE_ITEM',
    pointsRequired: 80,
    freeCategoryId: 'beverages',
    freeCategoryName: 'Beverages',
  },
];

const ORDER_DISCOUNTS = [
  { id: 'none', name: 'No Discount', pct: 0 },
  { id: 'staff', name: 'Staff', pct: 10 },
  { id: 'happy', name: 'Happy Hour', pct: 15 },
  { id: 'vip', name: 'VIP', pct: 20 },
  { id: 'senior', name: 'Senior', pct: 5 },
] as const;

const STAFF: Staff[] = [
  {
    id: 'emma',
    name: 'Emma',
    role: 'Cashier',
    pin: '1234',
    emoji: '',
    accessNote: 'Full access to all screens',
    perms: [...ALL_PERMS],
  },
  {
    id: 'jake',
    name: 'Jake',
    role: 'Barista',
    pin: '0000',
    emoji: '',
    accessNote: 'Sales, hold, delete items, loyalty',
    perms: ['sales', 'notifications', 'support', 'hold', 'void_item', 'loyalty'],
  },
  {
    id: 'chloe',
    name: 'Chloe',
    role: 'Manager',
    pin: '9999',
    emoji: '',
    accessNote: 'Full access to all screens',
    perms: [...ALL_PERMS],
  },
];

export function FullPosPlayground({ mobile = false }: { mobile?: boolean }) {
  const [catalog, setCatalog] = useState(() => createInitialCatalog());
  const [businessName, setBusinessName] = useState('Cafe Delight');
  const products = useMemo(() => salesProductsFromCatalog(catalog), [catalog]);
  const categoriesList = useMemo(() => salesCategoriesFromCatalog(catalog), [catalog]);
  const [phase, setPhase] = useState<Phase>('connect');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>('dashboard');
  const notifUnread = 3; // seed unread stock/system alerts in notifications center
  const [staff, setStaff] = useState<Staff | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [catOpen, setCatOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [cashOpOpen, setCashOpOpen] = useState(false);
  const [cashOpType, setCashOpType] = useState<'in' | 'out'>('in');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [isBasketMinimized, setIsBasketMinimized] = useState(false);
  /**
   * Session sales settings (tax + service charge) — same source as Settings screen,
   * mirroring mintcom-pos appSettings used by OrderSummaryPanel.
   */
  const [salesSettings, setSalesSettings] = useState<DemoSalesSettings>(
    DEFAULT_DEMO_SALES_SETTINGS,
  );
  /** Per-order tax override (still defaults from settings.taxRate) */
  const [taxRate, setTaxRate] = useState(DEFAULT_DEMO_SALES_SETTINGS.taxRate);
  const [taxName, setTaxName] = useState<string | null>('Sales Tax');
  const [taxModalOpen, setTaxModalOpen] = useState(false);
  /** Per-order service charge override mode (POS ServiceChargeModal) */
  const [scMode, setScMode] = useState<'DEFAULT' | 'NONE' | 'CUSTOM'>('DEFAULT');
  const [scCustomType, setScCustomType] = useState<'PERCENTAGE' | 'FIXED'>(
    DEFAULT_DEMO_SALES_SETTINGS.serviceChargeType,
  );
  const [scCustomValue, setScCustomValue] = useState(
    DEFAULT_DEMO_SALES_SETTINGS.serviceChargeValue,
  );
  const [scModalOpen, setScModalOpen] = useState(false);
  const [held, setHeld] = useState<HeldTicket[]>(() => [
    {
      id: 'held-1',
      orderNo: 101,
      type: 'dine-in',
      label: 'Table 1',
      note: 'Window seat',
      discountPct: 0,
      at: Date.now() - 0.5 * 3600_000,
      lines: [
        { id: 'h1-l1', productId: 'latte', name: 'Latte', basePrice: 4.5, unitPrice: 4.5, qty: 2, emoji: '', imageDataUrl: null, addons: [] },
        { id: 'h1-l2', productId: 'croissant', name: 'Croissant', basePrice: 4, unitPrice: 4, qty: 1, emoji: '', imageDataUrl: null, addons: [] },
      ],
    },
    {
      id: 'held-2',
      orderNo: 102,
      type: 'dine-in',
      label: 'Table 3',
      note: '',
      discountPct: 0,
      at: Date.now() - 0.25 * 3600_000,
      lines: [
        { id: 'h2-l1', productId: 'cappuccino', name: 'Cappuccino', basePrice: 4.25, unitPrice: 4.25, qty: 1, emoji: '', imageDataUrl: null, addons: [] },
        { id: 'h2-l2', productId: 'muffin', name: 'Muffin', basePrice: 3.25, unitPrice: 3.25, qty: 2, emoji: '', imageDataUrl: null, addons: [] },
      ],
    },
    {
      id: 'held-3',
      orderNo: 103,
      type: 'takeaway',
      label: 'Takeaway',
      note: 'Call when ready',
      discountPct: 0,
      at: Date.now() - 0.1 * 3600_000,
      lines: [
        { id: 'h3-l1', productId: 'espresso', name: 'Espresso', basePrice: 3.5, unitPrice: 3.5, qty: 1, emoji: '', imageDataUrl: null, addons: [] },
        { id: 'h3-l2', productId: 'bagel', name: 'Bagel', basePrice: 3.75, unitPrice: 3.75, qty: 1, emoji: '', imageDataUrl: null, addons: [] },
      ],
    },
  ]);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');
  const [discountPct, setDiscountPct] = useState(0);
  const [discountName, setDiscountName] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState('');
  /** POS-style popups for order-panel actions */
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  /** POS NoPrinterModal — print estimate / reprint when no thermal printer */
  const [noPrinterModal, setNoPrinterModal] = useState<null | 'estimate' | 'receipt'>(null);
  const [showPaymentPanel, setShowPaymentPanel] = useState(false);
  const [showSplitPanel, setShowSplitPanel] = useState(false);
  const [paymentTab, setPaymentTab] = useState<CheckoutTab>('cash');
  const [showLoyalty, setShowLoyalty] = useState(false);
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<DemoLoyaltyCustomer | null>(null);
  const [appliedLoyaltyReward, setAppliedLoyaltyReward] = useState<DemoAppliedReward | null>(null);
  const [orderNo, setOrderNo] = useState(1042);
  const [lastReceipt, setLastReceipt] = useState<{
    lines: CartLine[];
    total: number;
    method: PayMethod;
    orderNo: number;
    type: OrderType;
    discountPct: number;
    discount: number;
    tax: number;
    subtotal: number;
    /** Cash tendered − total (POS PaymentSuccessfulModal changeAmount) */
    changeAmount?: number;
    /** Amount cashier received (cash) for demo display */
    tendered?: number;
  } | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [addonItem, setAddonItem] = useState<PosProduct | null>(null);
  const [addonSel, setAddonSel] = useState<Record<string, string[]>>({});
  const [addonQty, setAddonQty] = useState(1);
  const [addonQtyText, setAddonQtyText] = useState('1');
  const [addonNote, setAddonNote] = useState('');
  const [addonDiscountPct, setAddonDiscountPct] = useState(0);
  const [addonDiscountOpen, setAddonDiscountOpen] = useState(false);
  const [addonErrors, setAddonErrors] = useState<string[]>([]);
  /** When set, confirmAddons updates this cart line instead of adding a new one */
  const [editLineId, setEditLineId] = useState<string | null>(null);

  // Lock background scroll while a full-screen modal overlay is open (addon,
  // split, payment) so only the pop-up scrolls — mirrors POS modal behavior.
  const modalOpen = !!(addonItem || showSplitPanel || showPaymentPanel);
  useEffect(() => {
    if (!modalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [modalOpen]);

  // Active Cart Draft Preservation (mirrors POS useActiveCartDraft)
  useEffect(() => {
    const draft = loadActiveCartDraft<{
      lines: CartLine[];
      orderNote?: string;
      orderType?: OrderType;
      discountPct?: number;
      discountName?: string | null;
    }>();
    if (draft && Array.isArray(draft.lines) && draft.lines.length > 0) {
      setCart(draft.lines);
      if (draft.orderNote) setOrderNote(draft.orderNote);
      if (draft.orderType) setOrderType(draft.orderType);
      if (draft.discountPct) setDiscountPct(draft.discountPct);
      if (draft.discountName) setDiscountName(draft.discountName);
    }
  }, []);

  useEffect(() => {
    if (cart.length > 0) {
      saveActiveCartDraft({
        lines: cart,
        orderNote,
        orderType,
        discountPct,
        discountName,
      });
    } else {
      clearActiveCartDraft();
    }
  }, [cart, orderNote, orderType, discountPct, discountName]);

  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [shift, setShift] = useState<DemoShift>(() => emptyShift());
  const [, setFlash] = useState<string | null>(null);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  /** When true, Dashboard auto-opens the Open Shift amount popup */
  const [promptOpenShift, setPromptOpenShift] = useState(false);
  /** After opening shift from a blocked payment, return here with cart intact */
  const [returnToSalesAfterShift, setReturnToSalesAfterShift] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  /** Mirrors POS SalesHeader retail / sort controls */
  const [retailMode] = useState(false);
  /** Sync badge & SyncSliderDrawer state (mirrors POS SyncStatusBadge + SyncSliderDrawer) */
  const [isSyncDrawerOpen, setIsSyncDrawerOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncJustCompleted, setSyncJustCompleted] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date>(() => new Date());

  const handleTriggerManualSync = () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncedTime(new Date());
      setSyncJustCompleted(true);
      ping('All offline data synced successfully');
      setTimeout(() => setSyncJustCompleted(false), 3500);
    }, 1200);
  };

  const [sortBy, setSortBy] = useState<'recent' | 'alpha' | 'bestseller'>('recent');
  const [sortOpen, setSortOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  /**
   * POS SideBar expand/collapse — Menu toggle opens labels + brand mark
   * (matches mintcom-pos SideBar isExpandedMenuOpen).
   */
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const shiftOrders = shift.orders;
  const shiftRevenue = shift.cashSales + shift.cardSales + shift.otherSales;

  const can = (perm: Perm) => !!staff?.perms.includes(perm);

  const goScreen = (id: Screen) => {
    const item = NAV_ITEMS.find((n) => n.id === id);
    if (item && !can(item.perm)) {
      ping(`${item.label} · manager only`);
      return;
    }
    // Barista has no dashboard — land on sales
    if (id === 'dashboard' && !can('dashboard')) {
      setScreen(can('sales') ? 'sales' : 'support');
      return;
    }
    setScreen(id);
  };

  /**
   * Same gate as payment methods: if cash/shift is not open, go to Dashboard
   * and auto-open the Open Cash (start shift) popup. After success, return to Sales.
   */
  const requireOpenShift = (message = 'Open a shift to continue') => {
    if (shift.open) return true;
    setScreen('dashboard');
    setPromptOpenShift(true);
    setReturnToSalesAfterShift(true);
    setShowPaymentPanel(false);
    setShowSplitPanel(false);
    setMobileCartOpen(false);
    setCashOpOpen(false);
    ping(message);
    return false;
  };

  /** Block only at checkout — sales browsing & adding items is always allowed */
  const requireOpenShiftForPayment = () =>
    requireOpenShift('Open a shift to take payment');

  /** Open payment panel with order summary (like POS PaymentPanel) — Cash / Card / Other only */
  const openPayment = (tab: CheckoutTab) => {
    if (!cart.length) return;
    if (!requireOpenShiftForPayment()) return;
    setShowSplitPanel(false);
    setPaymentTab(tab);
    setShowPaymentPanel(true);
    setMobileCartOpen(false);
  };

  /** Split opens its own modal (mintcom-pos SplitPaymentModal) — not a tab on the receipt pad */
  const openSplit = () => {
    if (!cart.length) return;
    if (!requireOpenShiftForPayment()) return;
    if (!can('split')) {
      ping('Split payments · manager only');
      return;
    }
    setShowPaymentPanel(false);
    setShowSplitPanel(true);
    setMobileCartOpen(false);
  };

  // Lock document to a true full-screen POS shell (no body/page scroll)
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, []);

  const visible = useMemo(() => {
    let list =
      selectedCategory === 'all' ? products : products.filter((p) => p.categoryId === selectedCategory);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q));
    // Sort mirrors POS SalesScreen: alphabetical / most recent / bestseller
    if (sortBy === 'alpha') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'bestseller') {
      // Demo seed: beverages first as “popular”, then price desc
      const catRank = (id: string) =>
        id === 'beverages' ? 0 : id === 'pastries' ? 1 : id === 'food' ? 2 : 3;
      list = [...list].sort((a, b) => catRank(a.categoryId) - catRank(b.categoryId) || b.price - a.price);
    } else {
      // recent — keep catalog order (newest-style)
      list = [...list];
    }
    return list;
  }, [products, selectedCategory, search, sortBy]);

  const activeCat = categoriesList.find((c) => c.id === selectedCategory) ?? categoriesList[0];
  const isAllMenu = selectedCategory === 'all';
  const hasQuery = search.trim().length > 0;
  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categoriesList;
    return categoriesList.filter((c) => c.name.toLowerCase().includes(q));
  }, [categoriesList, categorySearch]);

  const subtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const discount = subtotal * (discountPct / 100);
  const afterDiscount = Math.max(0, subtotal - discount);

  // Sync per-order defaults when Settings change (like POS reading appSettings)
  useEffect(() => {
    if (cart.length === 0) {
      setTaxRate(salesSettings.taxEnabled ? salesSettings.taxRate : 0);
      setScCustomType(salesSettings.serviceChargeType);
      setScCustomValue(salesSettings.serviceChargeValue);
      if (!salesSettings.serviceChargeEnabled) {
        setScMode('NONE');
      } else {
        setScMode(salesSettings.serviceChargeAutoApply ? 'DEFAULT' : 'NONE');
      }
    }
  }, [
    salesSettings.taxEnabled,
    salesSettings.taxRate,
    salesSettings.serviceChargeEnabled,
    salesSettings.serviceChargeAutoApply,
    salesSettings.serviceChargeType,
    salesSettings.serviceChargeValue,
    cart.length,
  ]);

  // Feature toggled mid-order from Settings
  useEffect(() => {
    if (!salesSettings.serviceChargeEnabled) {
      setScMode('NONE');
      return;
    }
    if (salesSettings.serviceChargeAutoApply) {
      setScMode((m) => (m === 'NONE' ? 'DEFAULT' : m));
    }
  }, [salesSettings.serviceChargeEnabled, salesSettings.serviceChargeAutoApply]);

  // Service charge after discount (POS orderSlice)
  const scFeatureOn = salesSettings.serviceChargeEnabled;
  const scType =
    scMode === 'CUSTOM' ? scCustomType : salesSettings.serviceChargeType;
  const scValue =
    scMode === 'CUSTOM' ? scCustomValue : salesSettings.serviceChargeValue;
  // Applied when feature on and not waived (NONE). Amount is $0 with empty cart.
  const serviceChargeApplied = scFeatureOn && scMode !== 'NONE';
  const serviceChargeAmount = !serviceChargeApplied
    ? 0
    : scType === 'PERCENTAGE'
      ? Math.round(afterDiscount * (Math.min(100, scValue) / 100) * 100) / 100
      : Math.min(Math.max(0, afterDiscount), Math.max(0, scValue));

  const taxRateEffective = salesSettings.taxEnabled ? taxRate : 0;
  const taxBase = salesSettings.serviceChargeTaxable
    ? afterDiscount + serviceChargeAmount
    : afterDiscount;
  const tax = Math.round(taxBase * (taxRateEffective / 100) * 100) / 100;
  const total = Math.round((afterDiscount + serviceChargeAmount + tax) * 100) / 100;
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);
  const settingsTaxDefault = salesSettings.taxEnabled ? salesSettings.taxRate : 0;
  const isTaxChanged = Math.abs(taxRateEffective - settingsTaxDefault) > 0.0001;

  // POS OrderSummaryPanel: show when enabled OR amount > 0 — even with empty cart
  const showServiceChargeRow = scFeatureOn || serviceChargeAmount > 0;
  const serviceChargeLabel =
    scType === 'PERCENTAGE' && scMode !== 'NONE'
      ? `${salesSettings.serviceChargeName} (${scValue}%)`
      : salesSettings.serviceChargeName;

  // Permissions — managers/settings vs cashier override (POS OrderSummaryPanel)
  const canChangeTax =
    salesSettings.taxEnabled &&
    (can('settings') ||
      staff?.role === 'Manager' ||
      staff?.role === 'Owner' ||
      staff?.role === 'Cashier'); // demo: cashiers can change tax like many POS setups with permission
  const canOverrideServiceCharge =
    scFeatureOn &&
    (can('settings') ||
      staff?.role === 'Manager' ||
      staff?.role === 'Owner' ||
      salesSettings.serviceChargeAllowCashierOverride);

  const ping = (msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 1400);
  };

  /** Always open the add-ons modal (even when item has no attributes) — matches POS */
  const openItem = (p: PosProduct) => {
    const initial: Record<string, string[]> = {};
    (p.attributes ?? []).forEach((attr) => {
      // POS starts with nothing selected; required attrs validated on add
      initial[attr.id] = [];
    });
    setAddonSel(initial);
    setAddonQty(1);
    setAddonQtyText('1');
    setAddonNote('');
    setAddonDiscountPct(0);
    setAddonDiscountOpen(false);
    setAddonErrors([]);
    setEditLineId(null);
    setAddonItem(p);
  };

  /** Re-open add-on modal for a cart line (POS “Edit item”) */
  const openEditLine = (line: CartLine) => {
    const product = products.find((p) => p.id === line.productId);
    if (!product) {
      ping('Product not found');
      return;
    }
    const initial: Record<string, string[]> = {};
    (product.attributes ?? []).forEach((attr) => {
      initial[attr.id] = attr.options
        .filter((o) => line.addons.some((a) => a.id === o.id))
        .map((o) => o.id);
    });
    setAddonSel(initial);
    setAddonQty(line.qty);
    setAddonQtyText(String(line.qty));
    setAddonNote(line.note || '');
    setAddonDiscountPct(line.discountPct ?? 0);
    setAddonDiscountOpen(false);
    setAddonErrors([]);
    setEditLineId(line.id);
    setAddonItem(product);
    setMobileCartOpen(false);
  };

  const toggleOption = (attr: PosAttribute, opt: PosOption) => {
    setAddonSel((prev) => {
      const cur = prev[attr.id] ?? [];
      if (attr.multi) {
        const has = cur.includes(opt.id);
        return { ...prev, [attr.id]: has ? cur.filter((x) => x !== opt.id) : [...cur, opt.id] };
      }
      // Single-select: tap again to deselect (matches POS)
      if (cur.includes(opt.id)) return { ...prev, [attr.id]: [] };
      return { ...prev, [attr.id]: [opt.id] };
    });
    setAddonErrors((errs) => errs.filter((id) => id !== attr.id));
  };

  const addonPreview = useMemo(() => {
    if (!addonItem) return { addons: [] as PosOption[], unitGross: 0, unitNet: 0, lineTotal: 0 };
    const addons: PosOption[] = [];
    (addonItem.attributes ?? []).forEach((attr) => {
      (addonSel[attr.id] ?? []).forEach((id) => {
        const o = attr.options.find((x) => x.id === id);
        if (o) addons.push(o);
      });
    });
    const unitGross = addonItem.price + addons.reduce((s, a) => s + a.price, 0);
    const unitNet = unitGross * (1 - addonDiscountPct / 100);
    const lineTotal = unitNet * Math.max(1, addonQty);
    return { addons, unitGross, unitNet, lineTotal };
  }, [addonItem, addonSel, addonDiscountPct, addonQty]);

  const confirmAddons = () => {
    if (!addonItem) return;
    const missing = (addonItem.attributes ?? [])
      .filter((attr) => attr.required && !(addonSel[attr.id]?.length))
      .map((attr) => attr.id);
    if (missing.length) {
      setAddonErrors(missing);
      return;
    }
    const { addons, unitNet } = addonPreview;
    const note = addonNote.trim();
    const hasAttributes = !!(addonItem.attributes && addonItem.attributes.length > 0);
    const discMeta =
      addonDiscountPct > 0
        ? DEMO_ITEM_DISCOUNTS.find((d) => d.pct === addonDiscountPct)
        : undefined;
    const nextLine: CartLine = {
      id: editLineId || `${addonItem.id}-${Date.now()}`,
      productId: addonItem.id,
      name: addonItem.name,
      basePrice: addonItem.price,
      unitPrice: unitNet,
      qty: addonQty,
      emoji: addonItem.emoji,
      imageDataUrl: addonItem.imageDataUrl,
      addons,
      note: note || undefined,
      discountPct: addonDiscountPct > 0 ? addonDiscountPct : undefined,
      discountName: discMeta?.name,
      hasAttributes,
    };

    if (editLineId) {
      setCart((prev) => prev.map((l) => (l.id === editLineId ? nextLine : l)));
      setEditLineId(null);
    } else {
      const key = [
        addons.map((a) => a.id).sort().join(','),
        note,
        String(addonDiscountPct),
      ].join('|');
      setCart((prev) => {
        const existing = prev.find(
          (l) =>
            l.productId === addonItem.id &&
            l.addons.map((a) => a.id).sort().join(',') === addons.map((a) => a.id).sort().join(',') &&
            (l.note || '') === note &&
            (l.discountPct ?? 0) === addonDiscountPct &&
            Math.abs(l.unitPrice - unitNet) < 0.001,
        );
        if (existing) {
          return prev.map((l) => (l.id === existing.id ? { ...l, qty: l.qty + addonQty } : l));
        }
        return [...prev, { ...nextLine, id: `${addonItem.id}-${key || 'plain'}-${Date.now()}` }];
      });
    }
    setLastAdded(addonItem.id);
    setAddonItem(null);
    setAddonDiscountOpen(false);
    window.setTimeout(() => setLastAdded(null), 350);
  };

  const closeAddonModal = () => {
    setAddonItem(null);
    setEditLineId(null);
    setAddonDiscountOpen(false);
    setAddonErrors([]);
  };

  const updateLineDiscount = (lineId: string, pct: number, name?: string) => {
    if (!can('discount')) {
      ping('Discount · manager only');
      return;
    }
    setCart((prev) =>
      prev.map((l) => {
        if (l.id !== lineId) return l;
        const nextPct = pct > 0 ? pct : undefined;
        return {
          ...l,
          discountPct: nextPct,
          discountName: nextPct ? name : undefined,
          unitPrice: lineNetUnit(l, pct),
        };
      }),
    );
  };

  const updateLineNote = (lineId: string, note: string) => {
    setCart((prev) =>
      prev.map((l) =>
        l.id === lineId ? { ...l, note: note.trim() || undefined } : l,
      ),
    );
  };

  const applyOrderDiscount = (id: string) => {
    if (!can('discount')) {
      ping('Discount · manager only');
      return;
    }
    // Manual order discount clears a % loyalty reward (same exclusivity idea as POS cart)
    if (appliedLoyaltyReward?.type === 'PERCENTAGE') {
      setAppliedLoyaltyReward(null);
    }
    const d = ORDER_DISCOUNTS.find((x) => x.id === id) ?? ORDER_DISCOUNTS[0];
    setDiscountPct(d.pct);
    setDiscountName(d.pct > 0 ? d.name : null);
    ping(d.pct > 0 ? `Discount · ${d.name} ${d.pct}%` : 'Discount removed');
  };

  const loyaltyName = loyaltyCustomer
    ? `${loyaltyCustomer.name}${appliedLoyaltyReward ? ` · ${appliedLoyaltyReward.name}` : ''}`
    : null;

  const attachLoyalty = (customer: DemoLoyaltyCustomer, reward: DemoAppliedReward | null) => {
    setLoyaltyCustomer(customer);
    setAppliedLoyaltyReward(reward);
    if (reward?.type === 'PERCENTAGE' && reward.value > 0) {
      setDiscountPct(reward.value);
      setDiscountName(reward.name);
    } else if (reward?.type === 'FREE_ITEM' && reward.freeItem) {
      // Add free item to cart at $0
      const free = reward.freeItem;
      setCart((prev) => [
        ...prev,
        {
          id: `free-${free.productId}-${Date.now()}`,
          productId: free.productId,
          name: free.name.startsWith('Free ') ? free.name : `Free ${free.name}`,
          basePrice: 0,
          unitPrice: 0,
          qty: 1,
          emoji: '',
          imageDataUrl: free.imageDataUrl,
          addons: free.addons,
          note: free.note,
        },
      ]);
    }
    setShowLoyalty(false);
    ping(
      reward
        ? `Loyalty · ${customer.name} · ${reward.name}`
        : `Loyalty · ${customer.name}`,
    );
  };

  const detachLoyalty = () => {
    setLoyaltyCustomer(null);
    setAppliedLoyaltyReward(null);
    // If current discount came from a loyalty % reward name, clear it
    if (discountName && DEMO_LOYALTY_REWARDS.some((r) => r.name === discountName)) {
      setDiscountPct(0);
      setDiscountName(null);
    }
    setShowLoyalty(false);
    ping('Loyalty removed');
  };

  const requestClearOrder = () => {
    if (!can('void_item')) {
      ping('Clear order · not allowed for your role');
      return;
    }
    if (!cart.length) {
      ping('Cart is empty');
      return;
    }
    setClearConfirmOpen(true);
  };

  const confirmClearOrder = () => {
    setClearConfirmOpen(false);
    clearOrder();
  };

  /** POS printEstimateReceipt — unpaid estimate; no printer → NoPrinterModal */
  const openPrintEstimate = () => {
    if (!cart.length) {
      ping('Add items to the order before printing.');
      return;
    }
    // Demo has no physical printer — same path as POS when getDefaultPrinter() is null
    setNoPrinterModal('estimate');
  };

  const openPrintPaidReceipt = () => {
    setNoPrinterModal('receipt');
  };

  const changeQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0),
    );
  };

  const openHoldModal = () => {
    if (!cart.length) return;
    if (!can('hold')) {
      ping('Hold order · not allowed for your role');
      return;
    }
    setShowHoldModal(true);
  };

  const confirmHold = (label: string) => {
    if (!cart.length || !label.trim()) return;
    const name = label.trim();
    setHeld((h) => [
      {
        id: `h-${Date.now()}`,
        orderNo,
        type: orderType,
        lines: cart,
        discountPct,
        note: orderNote,
        label: name,
        at: Date.now(),
      },
      ...h,
    ]);
    setCart([]);
    setDiscountPct(0);
    setDiscountName(null);
    setOrderNote('');
    setOrderNo((n) => n + 1);
    setShowHoldModal(false);
    setMobileCartOpen(false);
    ping(`Held · ${name}`);
  };

  const resumeHeld = (ticket: HeldTicket) => {
    if (cart.length) {
      // Park current ticket with a temp label so resume never loses it
      setHeld((h) => [
        {
          id: `h-${Date.now()}`,
          orderNo,
          type: orderType,
          lines: cart,
          discountPct,
          note: orderNote,
          label: `Parked #${orderNo}`,
          at: Date.now(),
        },
        ...h.filter((x) => x.id !== ticket.id),
      ]);
    } else {
      setHeld((h) => h.filter((x) => x.id !== ticket.id));
    }
    setCart(ticket.lines);
    setOrderType(ticket.type);
    setDiscountPct(ticket.discountPct);
    setOrderNote(ticket.note);
    setOrderNo(ticket.orderNo);
    setScreen('sales');
    setMobileCartOpen(true);
    ping(`Resumed · ${ticket.label}`);
  };

  const usedHoldLabels = useMemo(
    () => held.map((h) => h.label),
    [held],
  );

  const clearOrder = () => {
    setCart([]);
    setDiscountPct(0);
    setDiscountName(null);
    setOrderNote('');
    setLoyaltyCustomer(null);
    setAppliedLoyaltyReward(null);
    setNoteModalOpen(false);
    clearActiveCartDraft();
    ping('Order cleared');
  };

  const finalizeSale = (
    method: PayMethod,
    methodLabel: string,
    amounts: { cash: number; card: number; other: number; change?: number; tendered?: number },
  ) => {
    if (!cart.length) return;
    if (!requireOpenShiftForPayment()) return;
    const methodBucket: 'cash' | 'card' | 'other' =
      method === 'cash' ? 'cash' : method === 'card' ? 'card' : method === 'split' ? 'other' : 'other';
    // For split, bucket is mixed — track real amounts from `amounts`
    const itemsLabel = cart.map((l) => `${l.name}${l.qty > 1 ? ` ×${l.qty}` : ''}`).join(' · ');
    const saleId = `sale-${Date.now()}`;
    const thisOrderNo = orderNo;
    const changeAmount =
      method === 'cash'
        ? Math.max(0, Math.round((amounts.change ?? 0) * 100) / 100)
        : 0;
    const tendered =
      method === 'cash'
        ? Math.max(0, Math.round((amounts.tendered ?? total) * 100) / 100)
        : undefined;

    // Per-order normalized tender breakdown (mirrors POS getOrderTenders)
    const tenders: OrderTender[] = [];
    if (method === 'split') {
      if (amounts.cash > 0) {
        tenders.push({ method: 'CASH', label: 'Cash', amount: amounts.cash, tendered: amounts.cash });
      }
      if (amounts.card > 0) {
        tenders.push({ method: 'CARD', label: 'Card (Visa)', amount: amounts.card, cardType: 'Visa' });
      }
      if (amounts.other > 0) {
        tenders.push({ method: 'OTHER', label: 'Other', amount: amounts.other, otherPaymentMethod: 'Other' });
      }
    } else if (method === 'cash') {
      tenders.push({ method: 'CASH', label: 'Cash', amount: total, tendered, change: changeAmount });
    } else if (method === 'card') {
      tenders.push({ method: 'CARD', label: methodLabel || 'Card', amount: total, cardType: 'Visa' });
    } else {
      tenders.push({ method: 'OTHER', label: methodLabel || 'Other', amount: total, otherPaymentMethod: methodLabel });
    }

    setShift((s) => ({
      ...s,
      orders: s.orders + 1,
      cashSales: s.cashSales + amounts.cash,
      cardSales: s.cardSales + amounts.card,
      otherSales: s.otherSales + amounts.other,
      sales: [
        {
          id: saleId,
          orderNo: thisOrderNo,
          total,
          method: (method === 'split' ? 'split' : methodBucket) as 'cash' | 'card' | 'other' | 'split',
          methodLabel,
          items: itemsLabel,
          at: Date.now(),
          lines: cart.map((l) => ({
            id: l.id,
            name: l.name,
            qty: l.qty,
            unitPrice: l.unitPrice,
            emoji: '',
          })),
          subtotal,
          tax,
          discount,
          orderType,
          status: 'completed' as const,
          tenders,
        },
        ...s.sales,
      ].slice(0, 40),
    }));

    // Decrement stock-tracked products in the shared catalog so Stock
    // Management and Sales stay in sync (mirrors the real POS updateStock).
    setCatalog((c) => {
      const soldQty = new Map<string, number>();
      cart.forEach((l) => soldQty.set(l.productId, (soldQty.get(l.productId) || 0) + l.qty));
      let changed = false;
      const nextProducts = c.products.map((p) => {
        if (!p.trackStock || !soldQty.has(p.id)) return p;
        changed = true;
        return { ...p, availableStock: Math.max(0, (p.availableStock ?? 0) - (soldQty.get(p.id) || 0)) };
      });
      return changed ? { ...c, products: nextProducts } : c;
    });

    setLastReceipt({
      lines: cart,
      total,
      method,
      orderNo: thisOrderNo,
      type: orderType,
      discountPct,
      discount,
      tax,
      subtotal,
      changeAmount,
      tendered,
    });
    setShowReceipt(true);
    setShowPaymentPanel(false);
    setShowSplitPanel(false);
    setCart([]);
    clearActiveCartDraft();
    setDiscountPct(0);
    setDiscountName(null);
    setOrderNote('');
    setLoyaltyCustomer(null);
    setAppliedLoyaltyReward(null);
    setOrderNo((n) => n + 1);
    setMobileCartOpen(false);
  };

  const openShift = (openingCash: number) => {
    setShift({
      ...emptyShift(),
      open: true,
      openingCash,
      startedAt: Date.now(),
    });
    setPromptOpenShift(false);
    ping(`Shift open · ${money(openingCash)}`);
    // Navigation back to Sales happens after "Shift started successfully" OK
    // (onOpenShiftSuccessDismiss) — same as real POS.
  };

  const closeShift = () => {
    setShift(emptyShift());
    ping('Shift closed');
  };

  const recordPayInOut = (type: 'in' | 'out', amount: number, reason: string) => {
    setShift((s) => ({
      ...s,
      payIn: s.payIn + (type === 'in' ? amount : 0),
      payOut: s.payOut + (type === 'out' ? amount : 0),
      movements: [
        { id: `m-${Date.now()}`, type, amount, reason, at: Date.now() },
        ...s.movements,
      ],
    }));
    ping(type === 'in' ? `Cash in ${money(amount)}` : `Cash out ${money(amount)}`);
  };

  const openCashOperation = () => {
    // Mirror POS: no open cash → Open Cash popup (same as tapping Cash/Card/Other)
    if (!requireOpenShift('Open a shift to pay in or pay out')) return;
    setCashOpType('in');
    setCashOpOpen(true);
  };

  const clockOut = () => {
    setStaff(null);
    setCart([]);
    setHeld([]);
    setShift(emptyShift());
    setDiscountPct(0);
    setDiscountName(null);
    setOrderNote('');
    setLoyaltyCustomer(null);
    setAppliedLoyaltyReward(null);
    setShowReceipt(false);
    setPhase('login');
  };

  /* ─── Store Connection ─── */
  if (phase === 'connect') {
    return (
      <div className="try-pos-root relative isolate h-full w-full overflow-hidden">
        <PosDemoStoreConnect
          onConnect={() => setPhase('login')}
        />
      </div>
    );
  }

  /* ─── Login ─── */
  if (phase === 'login') {
    return (
      <div className="try-pos-root relative isolate h-full w-full overflow-hidden">
        <PosDemoLogin
          businessName={businessName}
          staffList={STAFF}
          onBack={() => setPhase('connect')}
          onSuccess={(s) => {
            const staffMember = s as Staff;
            setStaff(staffMember);
            setPhase('app');
            const home = staffMember.perms.includes('dashboard')
              ? 'dashboard'
              : staffMember.perms.includes('sales')
                ? 'sales'
                : 'support';
            setScreen(home);
          }}
        />
      </div>
    );
  }

  const sharedOrderPanelProps = {
    orderNo,
    cart,
    orderType,
    discountPct,
    discountName,
    orderDiscounts: [...ORDER_DISCOUNTS],
    onApplyDiscount: applyOrderDiscount,
    orderNote,
    loyaltyName,
    subtotal,
    discount,
    tax,
    taxRate: taxRateEffective,
    taxName,
    isTaxChanged,
    onEditTax: canChangeTax ? () => cart.length && setTaxModalOpen(true) : undefined,
    serviceChargeAmount,
    serviceChargeLabel,
    serviceChargeActive: showServiceChargeRow,
    onEditServiceCharge: canOverrideServiceCharge ? () => setScModalOpen(true) : undefined,
    serviceChargeEditDisabled: cart.length === 0,
    total,
    onShowNote: () => {
      if (!cart.length) { ping('Add items first'); return; }
      setNoteModalOpen(true);
    },
    onHold: openHoldModal,
    onClear: requestClearOrder,
    onLoyalty: () => {
      if (!can('loyalty')) { ping('Loyalty · manager only'); return; }
      setShowLoyalty(true);
    },
    onPrint: openPrintEstimate,
    onChangeQty: changeQty,
    onEditLine: openEditLine,
    onUpdateLineDiscount: updateLineDiscount,
    onUpdateLineNote: updateLineNote,
    onPayCash: () => openPayment('cash'),
    onPayCard: () => openPayment('card'),
    onPayOther: () => openPayment('other'),
    onPaySplit: openSplit,
    canDiscount: can('discount'),
    canHold: can('hold'),
    canVoid: can('void_item'),
    canLoyalty: can('loyalty'),
    canSplit: can('split'),
    canClear: can('void_item'),
  };

  /* ─── Main POS app shell ─── */
  return (
    <div className="try-pos-root relative isolate flex h-full max-h-full flex-col overflow-hidden bg-cream-50 text-text-primary dark:bg-mintcom-dark dark:text-white">

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/*
          Side rail — pixel-matched to mintcom-pos SideBar.tsx
          Collapsed: icon-only rail (permanent width reserve)
          Expanded (Menu): overlays content with labels + brand mark
          Kitchen intentionally omitted from the demo.
        */}
        {/* Permanent width reserve for tablet; phones use a top bar and drawer. */}
        {!mobile && <div className="block h-full w-[72px] shrink-0" aria-hidden />}
        {!mobile && sidebarExpanded && (
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 z-40 block"
            style={{ left: mobile ? 0 : 72, background: mobile ? 'rgba(0,0,0,0.45)' : 'transparent' }}
            onClick={() => setSidebarExpanded(false)}
          />
        )}
        <nav
          className={`${mobile ? 'hidden' : 'absolute'} inset-y-0 start-0 z-50 h-full flex-col items-center overflow-hidden`}
          style={{
            backgroundColor: '#1F1D2B',
            width: sidebarExpanded ? (mobile ? 'min(300px, 86vw)' : 230) : 72,
            paddingTop: 16,
            paddingBottom: 24,
            transition: 'width 120ms ease',
            boxShadow: sidebarExpanded ? '8px 0 24px rgba(0,0,0,0.35)' : 'none',
          }}
          aria-label="POS navigation"
        >
          {/* Rail: logo + Menu + items + Logout, space-between like POS */}
          <div className="flex h-full w-full flex-col items-center justify-between">
            {/* Logo — leaf collapsed, full brand expanded */}
            <button
              type="button"
              title="Sales"
              onClick={() => {
                setSidebarExpanded(false);
                goScreen('sales');
              }}
              className={`flex items-center justify-center rounded-xl transition-all ${
                sidebarExpanded ? 'h-16 w-[198px]' : 'h-14 w-14'
              }`}
            >
              {sidebarExpanded ? (
                <Logo variant="full" theme="dark" size="md" className="pointer-events-none" />
              ) : (
                <Logo variant="icon" size="md" className="pointer-events-none" />
              )}
            </button>

            {/* Menu toggle — opens/closes expanded labels */}
            <button
              type="button"
              onClick={() => setSidebarExpanded((v) => !v)}
              className={`flex h-14 items-center rounded-xl text-white transition-colors hover:bg-white/5 ${
                sidebarExpanded
                  ? 'w-[198px] justify-start gap-3 px-4'
                  : 'w-14 justify-center'
              }`}
              aria-expanded={sidebarExpanded}
              aria-label={sidebarExpanded ? 'Close menu' : 'Open menu'}
            >
              <span className="flex h-8 w-8 items-center justify-center">
                <Menu size={24} strokeWidth={2} />
              </span>
              {sidebarExpanded && (
                <span className="text-[14px] font-semibold text-white">Menu</span>
              )}
            </button>

            {/* Nav destinations */}
            {NAV_ITEMS.map((item) => {
              const on = screen === item.id;
              const Icon = item.icon;
              const allowed = can(item.perm);
              const badge = item.badge === 'alerts' ? held.length + notifUnread : 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-tour-id={item.id === 'sales' ? 'tour-nav-sales' : undefined}
                  title={allowed ? item.label : `${item.label} · locked`}
                  disabled={!allowed}
                  onClick={() => {
                    if (!allowed) return;
                    setSidebarExpanded(false);
                    goScreen(item.id);
                  }}
                  className={`relative flex h-14 items-center rounded-xl text-white transition-all duration-150 ${
                    sidebarExpanded
                      ? 'w-[198px] justify-start gap-3 px-4'
                      : 'w-14 justify-center'
                  } ${allowed ? '' : 'opacity-30'} ${
                    on ? '' : allowed ? 'hover:bg-white/5' : ''
                  }`}
                  style={on ? { backgroundColor: '#7dc6a2' } : undefined}
                >
                  <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                    {allowed ? <Icon size={24} strokeWidth={1.75} /> : <Lock size={20} />}
                    {allowed && badge > 0 && (
                      <span
                        className="absolute -end-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D55263] px-1 text-[10px] font-bold leading-none text-white"
                        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </span>
                  {sidebarExpanded && (
                    <span className="truncate text-[15px] font-semibold text-white">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Logout */}
            <button
              type="button"
              onClick={() => {
                setSidebarExpanded(false);
                setLogoutModalOpen(true);
              }}
              title="Sign Out"
              className={`flex h-14 items-center rounded-xl text-white transition-colors hover:bg-white/5 ${
                sidebarExpanded
                  ? 'w-[198px] justify-start gap-3 px-4'
                  : 'w-14 justify-center'
              }`}
            >
              <span className="flex h-8 w-8 items-center justify-center">
                <LogOut size={24} strokeWidth={1.75} />
              </span>
              {sidebarExpanded && (
                <span className="text-[15px] font-semibold text-white">Sign Out</span>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile top bar */}
        <div className={`${mobile ? 'flex' : 'hidden'} absolute inset-x-0 top-0 z-40 h-[calc(3.5rem+env(safe-area-inset-top))] items-center gap-2 border-b border-white/5 px-3 shadow-lg`} style={{ backgroundColor: '#1F1D2B', paddingTop: 'env(safe-area-inset-top)' }}>
          <button
            type="button"
            onClick={() => setSidebarExpanded(true)}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
            <Logo variant="full" theme="dark" size="sm" />
          <div className="ms-auto flex items-center gap-2">
            {screen === 'sales' && (
              <button
                type="button"
                onClick={() => setMobileCartOpen(true)}
                className="relative flex h-11 items-center gap-2 rounded-xl bg-mintcom-green px-3 text-[12px] font-black !text-white shadow-md shadow-black/20"
              >
                <ShoppingBag size={16} />
                Cart
                {itemCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D55263] px-1 text-[9px] font-black text-white">
                    {itemCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile drawer — same items/look as POS expanded SideBar */}
        <AnimatePresence>
          {mobile && sidebarExpanded && (
            <>
              <motion.button
                type="button"
                aria-label="Close menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[60] bg-black/50"
                onClick={() => setSidebarExpanded(false)}
              />
              <motion.nav
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'tween', duration: 0.18 }}
                className="absolute inset-y-0 start-0 z-[70] flex w-[min(300px,86vw)] flex-col"
                style={{ backgroundColor: '#1F1D2B', paddingTop: 'max(20px, env(safe-area-inset-top))', paddingBottom: 'max(28px, env(safe-area-inset-bottom))' }}
                aria-label="POS navigation"
              >
                <div className="mb-2 flex items-center px-5">
                  <Logo variant="full" theme="dark" size="md" />
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarExpanded(false)}
                  className="mx-3 mb-1 flex h-14 items-center gap-3 rounded-xl px-4 text-white hover:bg-white/5"
                >
                  <Menu size={24} />
                  <span className="text-[14px] font-semibold">Menu</span>
                </button>
                <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto overscroll-contain px-3 pb-2 pt-1">
                  <div className="flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => {
                      const on = screen === item.id;
                      const Icon = item.icon;
                      const allowed = can(item.perm);
                      const badge = item.badge === 'alerts' ? held.length + notifUnread : 0;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={!allowed}
                          onClick={() => {
                            if (!allowed) return;
                            setSidebarExpanded(false);
                            goScreen(item.id);
                          }}
                          className={`relative flex h-14 items-center gap-3 rounded-xl px-4 text-white transition-colors ${
                            allowed ? '' : 'opacity-30'
                          } ${on ? '' : allowed ? 'hover:bg-white/5' : ''}`}
                          style={on ? { backgroundColor: '#7dc6a2' } : undefined}
                        >
                          <span className="relative flex h-8 w-8 items-center justify-center">
                            {allowed ? <Icon size={24} strokeWidth={1.75} /> : <Lock size={20} />}
                            {allowed && badge > 0 && (
                              <span className="absolute -end-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#D55263] px-1 text-[10px] font-bold text-white">
                                {badge > 99 ? '99+' : badge}
                              </span>
                            )}
                          </span>
                          <span className="text-[15px] font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarExpanded(false);
                      setLogoutModalOpen(true);
                    }}
                    className="flex h-14 items-center gap-3 rounded-xl px-4 text-white hover:bg-white/5"
                  >
                    <LogOut size={24} strokeWidth={1.75} />
                    <span className="text-[15px] font-semibold">Sign Out</span>
                  </button>
                </div>
              </motion.nav>
            </>
          )}
        </AnimatePresence>

        {/* Main column */}
        <div className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${mobile ? 'pt-[calc(3.5rem+env(safe-area-inset-top))]' : 'pt-0'}`}>

        {/* Content — static landscape: menu + order side-by-side */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
          {screen === 'dashboard' && (
            <DemoDashboardScreen
              staff={staff}
              shift={shift}
              onOpenShift={openShift}
              onCloseShift={closeShift}
              onGoSales={() => goScreen('sales')}
              onSignOut={clockOut}
              autoOpenShiftModal={promptOpenShift}
              onAutoOpenShiftModalHandled={() => setPromptOpenShift(false)}
              onOpenShiftSuccessDismiss={() => {
                // After Success! OK — if payment opened shift, land back on Sales
                if (returnToSalesAfterShift) {
                  setReturnToSalesAfterShift(false);
                  setScreen('sales');
                }
              }}
              canOpenShift={can('open_shift')}
              canCloseShift={can('close_shift')}
              canViewAnalytics={can('dashboard')}
            />
          )}

          {screen === 'reports' && <DemoReportsScreen shift={shift} />}
          {screen === 'notifications' && (
            <DemoNotificationsScreen
              held={held}
              staffName={staff?.name}
              onResumeHeld={(ticket) => {
                // Map DemoHeldTicket shape → HeldTicket used in playground state
                const full = held.find((h) => h.id === ticket.id);
                if (full) resumeHeld(full);
              }}
              onDismissHeld={(id) => {
                setHeld((list) => list.filter((h) => h.id !== id));
                ping('Held order dismissed');
              }}
              onAlertClick={(a) => {
                if (a.kind === 'system_update') {
                  ping('System update details — demo');
                } else {
                  setScreen('dashboard');
                  ping(`Opening inventory · ${a.title}`);
                }
              }}
            />
          )}
          {screen === 'settings' && (
            <DemoSettingsScreen
              catalog={catalog}
              onCatalogChange={setCatalog}
              businessName={businessName}
              onBusinessNameChange={setBusinessName}
              salesSettings={salesSettings}
              onSalesSettingsChange={setSalesSettings}
            />
          )}
          {screen === 'support' && <DemoSupportScreen />}

          {screen === 'sales' && (
            <>
              {/* Menu pane ~2.3 or full width when basket minimized (mirrors POS mainContentFull) */}
              <section className={`flex h-full min-h-0 min-w-0 ${isBasketMinimized ? 'flex-1' : 'flex-[2.3]'} flex-col overflow-hidden bg-cream-50 dark:bg-mintcom-dark ${mobile && screen === 'sales' ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]' : ''}`}>
                {/* Sales Header — mirrors mintcom-pos SalesHeader exactly */}
                <header className={`shrink-0 bg-white dark:bg-mintcom-surface ${mobile ? 'px-3 py-2.5' : 'px-4 py-3 sm:px-5'}`}>
                  {/* Top row: square avatar + stacked date/tenant · Train / Retail / Open Drawer */}
                  <div className={`flex items-start justify-between ${mobile ? 'gap-2' : 'gap-3'}`}>
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div className={`${mobile ? 'h-10 w-10' : 'h-11 w-11'} mt-0.5 flex shrink-0 items-center justify-center rounded-xl bg-mintcom-green !text-white`}>
                        <span className="text-[15px] font-bold !text-white">
                          {staff ? staff.name.slice(0, 2).toUpperCase() : 'SA'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`${mobile ? 'text-base' : 'text-lg sm:text-xl'} truncate font-bold leading-tight text-text-primary dark:text-white`}>
                          {staff?.name || 'Guest'}
                        </p>
                        <div className="mt-0.5 flex flex-col items-start">
                          <p className={`${mobile ? 'hidden' : ''} text-[12px] text-text-secondary dark:text-mintcom-textSecondary sm:text-[13px]`}>
                            {new Date().toLocaleDateString(undefined, {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-[12px] font-semibold text-mintcom-green sm:text-[13px]">
                            {businessName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`mt-1 shrink-0 items-center justify-end gap-1.5 sm:gap-2 ${mobile ? 'hidden' : 'flex flex-wrap'}`}>
                      {/* Sync Status Badge — mirrors POS SyncStatusBadge */}
                      <button
                        type="button"
                        onClick={() => setIsSyncDrawerOpen(true)}
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] border border-[#7dc6a2]/25 bg-[#EAF6F1] px-3 text-[13px] font-semibold text-[#7dc6a2] transition-transform active:scale-95 dark:border-mintcom-green/20 dark:bg-mintcom-green/15 dark:text-mintcom-green"
                        title={isSyncing ? 'Syncing...' : 'All data synced — click to view sync status'}
                        aria-label={isSyncing ? 'Syncing...' : 'Synced'}
                      >
                        <span
                          className={`h-2 w-2 rounded-full bg-[#7dc6a2] dark:bg-mintcom-green ${
                            isSyncing ? 'animate-ping' : ''
                          }`}
                        />
                        <span>{isSyncing ? 'Syncing...' : 'Synced'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => ping('Cash drawer opened')}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-2.5 text-[12px] font-semibold text-mintcom-green dark:border-white/10 dark:bg-mintcom-dark"
                      >
                        <Inbox size={14} />
                        <span className="hidden sm:inline">Open Drawer</span>
                      </button>

                      {/* Basket minimize / HUD (mirrors POS SalesHeader exactly) */}
                      {!isBasketMinimized ? (
                        <button
                          type="button"
                          onClick={() => setIsBasketMinimized(true)}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-mintcom-green transition-colors hover:border-mintcom-green/50 active:bg-mintcom-green/10 dark:border-white/10 dark:bg-mintcom-dark"
                          title="Minimize Basket"
                          aria-label="Minimize Basket"
                        >
                          <SidebarToggleIcon isMinimized={false} size={18} color="currentColor" strokeWidth={2} />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Telemetry Touchpoint: Bag Icon + Order Info + Total Amount */}
                          <button
                            type="button"
                            onClick={() => setIsBasketMinimized(false)}
                            className="flex items-center gap-2 py-0.5 px-0.5 text-start transition-opacity hover:opacity-85"
                            title={itemCount > 0 ? 'View Basket' : 'Expand Basket'}
                            aria-label={itemCount > 0 ? 'View Basket' : 'Expand Basket'}
                          >
                            {/* Shopping Bag Icon Tile with Soft Green Background & Notification Badge */}
                            <div
                              className={`relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] ${
                                itemCount > 0
                                  ? 'bg-mintcom-green/15 text-mintcom-green'
                                  : 'bg-black/[0.04] text-text-secondary dark:bg-white/[0.06] dark:text-mintcom-textSecondary'
                              }`}
                            >
                              <ShoppingBag size={16} />
                              {itemCount > 0 && (
                                <span className="absolute -top-1 -end-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-[1.5px] border-white bg-mintcom-red px-1 text-[9px] font-extrabold text-white dark:border-mintcom-surface">
                                  {itemCount > 99 ? '99+' : itemCount}
                                </span>
                              )}
                            </div>

                            {/* Info Stack */}
                            <div className="flex flex-col justify-center gap-px min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold tracking-[0.2px] text-text-secondary dark:text-mintcom-textSecondary">
                                  #{orderNo || '---'}
                                </span>
                                <span className="text-[10px] font-bold text-text-secondary dark:text-mintcom-textSecondary">•</span>
                                <span className="text-[11px] font-semibold uppercase tracking-[0.2px] text-text-secondary dark:text-mintcom-textSecondary">
                                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                                </span>
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-[16px] font-black tracking-tight leading-[19px] text-[#111827] dark:text-white tabular-nums">
                                  {total.toFixed(2)}
                                </span>
                                <span className="text-[10.5px] font-extrabold tracking-wider text-mintcom-green">
                                  USD
                                </span>
                              </div>
                            </div>
                          </button>

                          {/* Hairline Divider */}
                          <div className="h-[22px] w-px bg-gray-200 dark:bg-white/12 mx-0.5" />

                          {/* Expand Action Button (matching 36px header action buttons) */}
                          <button
                            type="button"
                            onClick={() => setIsBasketMinimized(false)}
                            className="flex h-9 items-center gap-1.5 rounded-xl bg-mintcom-green px-3 text-[11.5px] font-extrabold uppercase tracking-[0.5px] text-white shadow-md shadow-mintcom-green/25 transition-all hover:brightness-105 active:scale-[0.98]"
                            aria-label={itemCount > 0 ? 'EXPAND TO CONTINUE' : 'EXPAND BASKET'}
                          >
                            <SidebarToggleIcon isMinimized={true} size={14} color="#FFFFFF" strokeWidth={2.2} />
                            <span className="truncate">
                              {itemCount > 0 ? 'EXPAND TO CONTINUE' : 'EXPAND BASKET'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider — matches POS SalesHeader */}
                  <div className={`${mobile ? 'my-2' : 'my-3'} h-px bg-gray-200 dark:bg-white/10`} />

                  {/* Toolbar: PAY-IN/PAY-OUT + search/category pill + sort */}
                  <div className="flex items-center gap-2 sm:gap-2.5">
                    <button
                      type="button"
                      onClick={openCashOperation}
                      className={`${mobile ? 'h-11 w-11 justify-center px-0' : 'h-12 px-3 sm:px-4'} inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-mintcom-green text-[11px] font-extrabold uppercase tracking-wide !text-white shadow-md shadow-mintcom-green/30 sm:text-[12px]`}
                      title={!shift.open ? 'Open a shift first' : 'Pay in or pay out cash'}
                    >
                      <Repeat size={14} strokeWidth={2.5} />
                      {!mobile && <span className="hidden xs:inline sm:inline">PAY-IN/PAY-OUT</span>}
                      {!mobile && <span className="sm:hidden">PAY</span>}
                    </button>

                    {/* Unified filter pill — live search + category zone (POS filterPill) */}
                    <div
                      className={`flex ${mobile ? 'h-11' : 'h-12'} min-w-0 flex-1 items-center overflow-hidden rounded-xl border-[1.5px] transition-shadow ${
                        searchFocused || hasQuery
                          ? 'border-mintcom-green bg-[#f0f7f4] shadow-sm dark:bg-[#1c2822]'
                          : 'border-transparent bg-gray-100 dark:bg-mintcom-dark'
                      }`}
                    >
                      <Search
                        size={15}
                        className={`ms-3.5 shrink-0 ${
                          searchFocused || hasQuery ? 'text-mintcom-green' : 'text-text-secondary'
                        }`}
                      />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onFocus={() => setSearchFocused(true)}
                        onBlur={() => setSearchFocused(false)}
                        placeholder={
                          !isAllMenu
                            ? `Search in ${activeCat.name}…`
                            : 'Search menu…'
                        }
                        className="min-w-0 flex-1 bg-transparent px-2.5 py-0 text-[16px] sm:text-[15px] font-medium text-text-primary outline-none placeholder:text-text-secondary dark:text-white"
                      />
                      {hasQuery && (
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          className="flex h-11 w-11 shrink-0 items-center justify-center text-mintcom-green"
                          aria-label="Clear search"
                        >
                          <X size={15} />
                        </button>
                      )}

                      <div className="mx-0.5 h-[22px] w-px shrink-0 bg-gray-200 dark:bg-white/15" />

                      <button
                        type="button"
                        onClick={() => {
                          setCategorySearch('');
                          setCatOpen(true);
                        }}
                        className={`me-1 ${mobile ? 'hidden' : 'min-w-[100px] max-w-[180px] px-3 sm:min-w-[110px] flex'} min-h-[36px] items-center gap-1.5 rounded-xl py-1.5 text-[12px] sm:text-[13px] ${
                          !isAllMenu
                            ? 'bg-mintcom-green/15 font-bold text-mintcom-green'
                            : 'font-semibold text-text-secondary dark:text-mintcom-textSecondary'
                        }`}
                      >
                        {isAllMenu ? (
                          <LayoutGrid size={13} className="shrink-0" />
                        ) : (
                          <Package size={13} className="shrink-0" />
                        )}
                        <span className="truncate">{isAllMenu ? 'Category' : activeCat.name}</span>
                        {!isAllMenu ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCategory('all');
                            }}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl hover:bg-mintcom-green/20"
                            aria-label="Clear category"
                          >
                            <X size={12} />
                          </button>
                        ) : (
                          <ChevronDown size={13} className="shrink-0 opacity-70" />
                        )}
                      </button>
                    </div>

                    {/* Sort button — tune-variant equivalent */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setSortOpen((v) => !v)}
                        className={`${mobile ? 'h-11 w-11' : 'h-12 w-12'} flex items-center justify-center rounded-xl border border-gray-200 bg-gray-100 text-mintcom-green dark:border-white/10 dark:bg-mintcom-dark`}
                        title="Sort products"
                      >
                        <SlidersHorizontal size={18} />
                      </button>
                      <AnimatePresence>
                        {sortOpen && (
                          <>
                            {/* Full-screen catch — close when clicking anywhere else */}
                            <button
                              type="button"
                              className="fixed inset-0 z-[60] cursor-default"
                              aria-label="Close sort"
                              onClick={() => setSortOpen(false)}
                            />
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute end-0 top-full z-[70] mt-1.5 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-mintcom-surface"
                            >
                              <div className="border-b border-gray-100 px-3 py-2 dark:border-white/8">
                                <p className="text-[12px] font-bold text-text-primary dark:text-white">Sort by</p>
                              </div>
                              {(
                                [
                                  { id: 'alpha' as const, label: 'Alphabetical' },
                                  { id: 'recent' as const, label: 'Most recent' },
                                  { id: 'bestseller' as const, label: 'Bestseller' },
                                ] as const
                              ).map((opt) => (
                                <button
                                  key={opt.id}
                                  type="button"
                                  onClick={() => {
                                    setSortBy(opt.id);
                                    setSortOpen(false);
                                  }}
                                  className={`flex min-h-[44px] w-full items-center border-s-[3px] px-3 py-2.5 text-start text-[13px] transition-colors ${
                                    sortBy === opt.id
                                      ? 'border-mintcom-green bg-mintcom-green/10 font-bold text-mintcom-green'
                                      : 'border-transparent font-medium text-text-primary hover:bg-cream-50 dark:text-white dark:hover:bg-white/5'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                </header>

                {/* Mobile category chips — one-thumb filtering, snap scroll */}
                {mobile && (
                  <div className="shrink-0 border-b border-gray-100 bg-white px-2.5 py-2 dark:border-white/5 dark:bg-mintcom-surface">
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-none snap-x snap-mandatory">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory('all')}
                        aria-pressed={isAllMenu}
                        className={`h-9 shrink-0 snap-start rounded-full px-3.5 text-[12px] font-bold transition-colors ${
                          isAllMenu
                            ? 'bg-mintcom-green text-white shadow-sm'
                            : 'border border-gray-200 bg-white text-text-secondary dark:border-white/10 dark:bg-mintcom-dark dark:text-mintcom-textSecondary'
                        }`}
                      >
                        All
                      </button>
                      {categoriesList.map((c) => {
                        const on = selectedCategory === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCategory(c.id)}
                            aria-pressed={on}
                            className={`h-9 shrink-0 snap-start whitespace-nowrap rounded-full px-3.5 text-[12px] font-bold transition-colors ${
                              on
                                ? 'bg-mintcom-green text-white shadow-sm'
                                : 'border border-gray-200 bg-white text-text-secondary dark:border-white/10 dark:bg-mintcom-dark dark:text-mintcom-textSecondary'
                            }`}
                          >
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Product grid / retail list — mirrors POS ProductCard */}
                <div id="tour-product-grid" className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${mobile ? 'p-2.5' : 'p-3'}`}>
                  {retailMode ? (
                    <div className="flex flex-col gap-2">
                      {visible.map((p) => (
                        <motion.button
                          key={p.id}
                          type="button"
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            const stock = p.availableStock ?? 0;
                            if (p.trackStock && stock <= 0) {
                              triggerOutOfStockBuzzer();
                              ping(`Out of Stock: ${p.name} is currently out of stock`);
                              return;
                            }
                            triggerCartAddFeedback();
                            openItem(p);
                          }}
                          className="group relative flex w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-start dark:border-white/10 dark:bg-mintcom-surface"
                        >
                          {lastAdded === p.id && (
                            <span className="absolute end-12 top-1 z-20 rounded-full bg-mintcom-green px-1.5 py-0.5 text-[9px] font-black text-white">
                              +1
                            </span>
                          )}
                          <div className={productImgWrapClass(p.imageDataUrl, 'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl')}>
                            <img
                              src={productImgSrc(p.imageDataUrl)}
                              alt=""
                              className={productImgClass(p.imageDataUrl, '', { thumb: true })}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-bold text-text-primary dark:text-white">
                              {p.name}
                            </p>
                          </div>
                          <PriceText value={p.price} size="sm" className="shrink-0" />
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-white">
                            <Plus size={16} strokeWidth={2.5} />
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  ) : (
                    <div className={`grid ${mobile ? 'grid-cols-2 gap-2.5' : isBasketMinimized ? 'grid-cols-4 sm:grid-cols-5 gap-3' : 'grid-cols-3 gap-3'}`}>
                      {visible.map((p) => {
                        const cartQty = cart
                          .filter((l) => l.productId === p.id)
                          .reduce((s, l) => s + l.qty, 0);
                        const stockLeft = p.trackStock
                          ? Math.max(0, (p.availableStock ?? 0) - cartQty)
                          : null;
                        const soldOut = stockLeft !== null && stockLeft <= 0;
                        return (
                        <motion.button
                          key={p.id}
                          type="button"
                          whileTap={soldOut ? undefined : { scale: 0.97 }}
                          onClick={() => {
                            if (soldOut) {
                              triggerOutOfStockBuzzer();
                              ping(`Out of Stock: ${p.name} is currently out of stock`);
                              return;
                            }
                            triggerCartAddFeedback();
                            openItem(p);
                          }}
                          aria-disabled={soldOut}
                          className={`group relative flex ${mobile ? 'min-h-[148px]' : 'min-h-[168px] sm:min-h-[200px]'} flex-col overflow-hidden rounded-xl border border-gray-100 bg-white text-start shadow-sm transition-shadow dark:border-white/8 dark:bg-mintcom-surface ${
                            soldOut ? 'cursor-not-allowed opacity-60' : 'hover:shadow-md'
                          }`}
                        >
                          {lastAdded === p.id && !soldOut && (
                            <span className="absolute end-2 top-2 z-20 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                              +1
                            </span>
                          )}
                          {stockLeft !== null && (
                            <span
                              className={`absolute start-2 top-2 z-20 rounded-lg px-1.5 py-0.5 text-[9.5px] font-black text-white ${
                                soldOut
                                  ? 'bg-mintcom-red'
                                  : stockLeft <= 5
                                    ? 'bg-mintcom-red'
                                    : stockLeft <= 10
                                      ? 'bg-amber-500'
                                      : 'bg-black/45'
                              }`}
                            >
                              {soldOut ? 'Out of stock' : `${stockLeft} Left`}
                            </span>
                          )}
                          <div className={productImgWrapClass(p.imageDataUrl, `relative flex ${mobile ? 'h-[72px]' : 'h-[100px] sm:h-[140px]'} w-full shrink-0 items-center justify-center overflow-hidden`)}>
                            <img
                              src={productImgSrc(p.imageDataUrl)}
                              alt=""
                              className={productImgClass(p.imageDataUrl)}
                            />
                          </div>
                          <div className={`flex flex-1 flex-col justify-start ${mobile ? 'p-2' : 'px-3.5 py-3.5'}`}>
                            <p className={`text-[13px] font-bold leading-snug text-text-primary dark:text-white sm:text-[15px] sm:leading-5 ${mobile ? 'line-clamp-1' : 'line-clamp-2'}`}>
                              {p.name}
                            </p>
                            <div className={`flex items-center justify-between gap-1.5 ${mobile ? 'mt-1' : 'mt-2'}`}>
                              <PriceText value={p.price} className="min-w-0 flex-1 text-[12px]" />
                              <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform ${soldOut ? 'bg-gray-300 dark:bg-white/10' : 'bg-mintcom-green group-hover:scale-105'}`}>
                                <Plus size={18} strokeWidth={2.5} />
                                {cartQty > 0 && (
                                  <span className="absolute -end-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#1F1D2B] px-1 text-[9px] font-black text-white ring-2 ring-white dark:bg-white dark:text-mintcom-dark dark:ring-mintcom-surface">
                                    {cartQty}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                        </motion.button>
                        );
                      })}
                    </div>
                  )}
                  {visible.length === 0 && (
                    <p className="py-10 text-center text-sm text-text-tertiary dark:text-mintcom-gray">
                      No products match your search
                    </p>
                  )}
                </div>
              </section>

              {/* Order pane */}
              {!mobile && !isBasketMinimized && (
                <OrderPanel
                  panelId="tour-order-panel"
                  payActionsId="tour-pay-actions"
                  className="flex h-full w-full max-w-[340px] flex-[1] overflow-hidden border-s border-gray-200 bg-white dark:border-mintcom-tertiary dark:bg-mintcom-surface"
                  {...sharedOrderPanelProps}
                />
              )}
            </>
          )}

        </div>
        </div>

        {/* Hold order modal — table grid or nickname like real POS HoldOrderModal */}
        <AnimatePresence>
          {showHoldModal && (
            <HoldOrderModal
              usedLabels={usedHoldLabels}
              tableCount={HOLD_TABLE_COUNT}
              itemCount={itemCount}
              orderTotal={total}
              onCancel={() => setShowHoldModal(false)}
              onHold={confirmHold}
            />
          )}
        </AnimatePresence>

        {/* Sync Status Drawer / Modal — mirrors POS SyncSliderDrawer */}
        <AnimatePresence>
          {isSyncDrawerOpen && (
            <div
              className="absolute inset-0 z-[95] flex items-center justify-center bg-black/60 p-2.5 sm:p-3 backdrop-blur-sm"
              onClick={() => setIsSyncDrawerOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="relative flex max-h-[min(90%,500px)] w-[min(94%,420px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
              >
                {/* Modal Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-mintcom-green/15 text-mintcom-green">
                      <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-text-primary dark:text-white">
                        Cloud Sync Status
                      </h3>
                      <p className="text-[11px] text-text-secondary dark:text-mintcom-textSecondary">
                        Last Synced: {syncJustCompleted ? 'Just now' : lastSyncedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSyncDrawerOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 min-h-0 space-y-2.5 overflow-y-auto p-3 sm:p-3.5">
                  {/* Hero Status Card */}
                  <div className="rounded-xl border border-mintcom-green/30 bg-mintcom-green/10 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/20 text-mintcom-green">
                        {isSyncing ? (
                          <RefreshCw size={18} className="animate-spin text-mintcom-green" />
                        ) : (
                          <CheckCircle2 size={20} className="text-mintcom-green" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-bold text-mintcom-green">
                          {isSyncing ? 'Syncing Data...' : syncJustCompleted ? 'All Data Synced Successfully' : 'All Data Synced'}
                        </h4>
                        <p className="text-[11px] text-text-secondary dark:text-mintcom-textSecondary">
                          {isSyncing
                            ? 'Sending offline orders and fetching latest catalogue'
                            : 'Your POS is fully up to date with cloud servers'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2 border-t border-mintcom-green/20 pt-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-mintcom-green/20 px-2.5 py-0.5 text-[10px] font-bold text-mintcom-green">
                        <span className="h-1.5 w-1.5 rounded-full bg-mintcom-green" />
                        Connected to Cloud
                      </span>
                    </div>
                  </div>

                  {/* Checklist Section Heading */}
                  <div>
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                      Review real-time sync with cloud servers
                    </p>

                    {/* Sync Breakdown Checklist Card */}
                    <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-gray-50/70 dark:divide-white/5 dark:border-white/10 dark:bg-mintcom-dark/50">
                      {[
                        {
                          icon: Receipt,
                          title: 'Orders & Sales',
                          subtitle: 'All completed orders sent to server',
                        },
                        {
                          icon: UtensilsCrossed,
                          title: 'Menu & Products',
                          subtitle: 'Categories, items & pricing up to date',
                        },
                        {
                          icon: Inbox,
                          title: 'Shifts & Cash Drawer',
                          subtitle: 'Shift records and cash logs synchronized',
                        },
                        {
                          icon: Users,
                          title: 'Customers & Loyalty',
                          subtitle: 'Points balances and customer records verified',
                        },
                        {
                          icon: SlidersHorizontal,
                          title: 'Store Settings & Taxes',
                          subtitle: 'Tax rates, discounts & receipt configs active',
                        },
                      ].map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={item.title} className="flex items-center gap-2.5 p-2 sm:p-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-200/60 text-mintcom-green dark:bg-white/10">
                              <ItemIcon size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[12px] font-bold text-text-primary dark:text-white leading-tight">
                                {item.title}
                              </p>
                              <p className="text-[10.5px] text-text-secondary dark:text-mintcom-textSecondary truncate">
                                {item.subtitle}
                              </p>
                            </div>
                            <CheckCircle2 size={15} className="shrink-0 text-mintcom-green" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Offline Safe Guarantee Note */}
                  <div className="flex items-start gap-2 rounded-xl border border-blue-500/20 bg-blue-50/70 p-2.5 dark:border-blue-400/20 dark:bg-blue-950/20">
                    <Shield size={14} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                    <p className="text-[11px] leading-snug text-blue-900 dark:text-blue-300">
                      <strong>Offline Safety:</strong> All sales, receipts, and inventory made while offline are securely stored in your device encrypted storage.
                    </p>
                  </div>
                </div>

                {/* Footer Button */}
                <div className="shrink-0 border-t border-gray-100 p-2.5 sm:p-3 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handleTriggerManualSync}
                    disabled={isSyncing}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-mintcom-green/90 disabled:opacity-60"
                  >
                    <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
                    <span>{isSyncing ? 'Syncing...' : 'Sync Everything Now'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Order Note — mintcom-pos NoteModal (showOrderTypeActions) */}
        <DemoNoteModal
          open={noteModalOpen}
          title="Add Note to Order"
          value={orderNote}
          onChange={setOrderNote}
          showOrderTypeActions
          orderType={orderType}
          onOrderTypeChange={setOrderType}
          onCancel={() => setNoteModalOpen(false)}
          onSave={() => {
            setNoteModalOpen(false);
            const typePart =
              orderType !== 'dine-in' ? orderTypeLabel(orderType) : '';
            if (orderNote.trim() || typePart) {
              ping(
                typePart
                  ? orderNote.trim()
                    ? `Note saved · ${typePart}`
                    : `Order type · ${typePart}`
                  : 'Note saved',
              );
            } else {
              ping('Note cleared');
            }
          }}
        />

        {/* Clear order confirm — mirrors POS clear-all confirmation */}
        <AnimatePresence>
          {clearConfirmOpen && (
            <div
              className="absolute inset-0 z-[80] flex items-center justify-center bg-black/45 p-2.5"
              onClick={() => setClearConfirmOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={(e) => e.stopPropagation()}
                className="w-[min(94%,360px)] rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#D55263]/15 text-[#D55263]">
                  <Trash2 size={22} />
                </div>
                <h3 className="text-center text-base font-extrabold text-text-primary dark:text-white">
                  Clear order?
                </h3>
                <p className="mt-2 text-center text-sm text-text-secondary dark:text-mintcom-textSecondary">
                  Remove all {itemCount} item{itemCount === 1 ? '' : 's'} from this order? This cannot be undone.
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setClearConfirmOpen(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold dark:border-white/15 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmClearOrder}
                    className="flex-1 rounded-xl bg-[#D55263] py-3 text-sm font-bold text-white"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/*
          No Printer — identical to mintcom-pos NoPrinterModal
          (print estimate / paid receipt when no thermal printer configured).
        */}
        <AnimatePresence>
          {noPrinterModal && (
            <div
              className="absolute inset-0 z-[90] flex items-center justify-center bg-black/70 p-5"
              onClick={() => setNoPrinterModal(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-[460px] rounded-xl border border-gray-200 bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-mintcom-surface"
              >
                <div className="mx-auto mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                  <Printer size={22} strokeWidth={2} />
                </div>
                <h3 className="mb-2 text-center text-[22px] font-bold text-text-primary dark:text-white">
                  {noPrinterModal === 'estimate'
                    ? 'No Printer Configured'
                    : 'No Printer Configured'}
                </h3>
                <p className="mb-3.5 text-center text-[15px] leading-snug text-text-secondary dark:text-mintcom-textSecondary">
                  {noPrinterModal === 'estimate'
                    ? 'Please configure a printer in settings first.'
                    : 'Please set up a printer in Settings → Main Settings → Receipt & printer.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setNoPrinterModal(null);
                    setShowReceipt(false);
                    setScreen('settings');
                    ping('Open Receipt & printer in Settings');
                  }}
                  className="mb-2.5 w-full rounded-xl bg-mintcom-green py-[11px] text-center text-sm font-bold text-white"
                >
                  Add Printer
                </button>
                <button
                  type="button"
                  onClick={() => setNoPrinterModal(null)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-[11px] text-center text-sm font-bold text-text-secondary dark:border-white/15 dark:bg-mintcom-surface dark:text-mintcom-textSecondary"
                >
                  Cancel
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/*
          Logout Confirmation — matches mintcom-pos LogoutModal:
          red #D55263 icon + Confirm, title/warning from POS en.json logout.*
        */}
        <AnimatePresence>
          {logoutModalOpen && (
            <div
              className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
              onClick={() => setLogoutModalOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-[min(90%,450px)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-mintcom-surface"
              >
                <div className="flex flex-col items-center px-[30px] py-[30px]">
                  <h3 className="mb-5 text-center text-[22px] font-semibold leading-snug text-text-primary dark:text-white">
                    Are you sure you want to sign out?
                  </h3>

                  {/* Active shift warning — POS logout.activeShiftWarning */}
                  {shift.open && (
                    <div
                      className="mb-5 flex w-full items-center gap-2 rounded-xl border-s-[3px] p-3"
                      style={{
                        backgroundColor: 'rgba(213, 82, 99, 0.08)',
                        borderLeftColor: '#D55263',
                      }}
                    >
                      <AlertTriangle size={20} className="shrink-0" style={{ color: '#D55263' }} />
                      <p className="flex-1 text-[14px] font-medium leading-snug" style={{ color: '#D55263' }}>
                        You have an active shift. It will be closed automatically.
                      </p>
                    </div>
                  )}

                  <div className="flex w-full gap-2.5">
                    <button
                      type="button"
                      onClick={() => setLogoutModalOpen(false)}
                      className="flex-1 rounded-xl border border-gray-200 bg-white py-[15px] text-center text-[16px] font-bold text-text-secondary dark:border-white/15 dark:bg-mintcom-surface dark:text-mintcom-textSecondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoutModalOpen(false);
                        clockOut();
                      }}
                      className="flex-1 rounded-xl py-[15px] text-center text-[16px] font-bold text-white"
                      style={{ backgroundColor: '#D55263' }}
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Pay-in / Pay-out — ATM amount like POS CashInOutModal */}
        <AnimatePresence>
          {cashOpOpen && (
            <PayInOutModal
              open={cashOpOpen}
              initialType={cashOpType}
              onClose={() => setCashOpOpen(false)}
              onConfirm={(type, amount, reason) => {
                recordPayInOut(type, amount, reason);
                setCashOpOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Tax selection — POS TaxSelectionModal (ATM % + quick chips) */}
        <AnimatePresence>
          {taxModalOpen && salesSettings.taxEnabled && (
            <TaxRateModal
              open={taxModalOpen}
              currentRate={taxRate}
              defaultRate={salesSettings.taxRate}
              taxes={salesSettings.taxes}
              onClose={() => setTaxModalOpen(false)}
              onSelect={(rate, name) => {
                setTaxRate(rate);
                setTaxName(name ?? null);
                setTaxModalOpen(false);
                ping(
                  rate === 0
                    ? 'No tax applied'
                    : `Tax set to ${rate}%${name ? ` (${name})` : ''}`,
                );
              }}
            />
          )}
        </AnimatePresence>

        {/* Service charge override — POS ServiceChargeModal (only if enabled in Settings) */}
        <AnimatePresence>
          {scModalOpen && salesSettings.serviceChargeEnabled && (
            <ServiceChargeEditModal
              open={scModalOpen}
              amount={serviceChargeAmount}
              mode={scMode}
              defaultType={salesSettings.serviceChargeType}
              defaultValue={salesSettings.serviceChargeValue}
              customType={scCustomType}
              customValue={scCustomValue}
              chargeName={salesSettings.serviceChargeName}
              onClose={() => setScModalOpen(false)}
              onApplyDefault={() => {
                setScMode('DEFAULT');
                setScCustomType(salesSettings.serviceChargeType);
                setScCustomValue(salesSettings.serviceChargeValue);
                ping(`${salesSettings.serviceChargeName} · default applied`);
              }}
              onRemove={() => {
                setScMode('NONE');
                ping(`${salesSettings.serviceChargeName} removed`);
              }}
              onCustom={(type, value) => {
                setScMode('CUSTOM');
                setScCustomType(type);
                setScCustomValue(value);
              }}
            />
          )}
        </AnimatePresence>

        {/* Category Selection Modal — mirrors POS CategorySelectionModal */}
        <AnimatePresence>
          {catOpen && (
            <div
              className="absolute inset-0 z-[100] flex items-end justify-center bg-black/45 p-2 backdrop-blur-sm sm:items-center sm:p-3"
              onClick={() => setCatOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={(e) => e.stopPropagation()}
                className="relative flex max-h-[min(88%,480px)] w-[min(94%,380px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
              >
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-100 px-4 py-3.5 dark:border-white/8">
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-mintcom-green">
                      {categorySearch.trim() ? 'Searching…' : 'Select Category'}
                    </p>
                    <p className="truncate text-base font-extrabold text-text-primary dark:text-white">
                      {categorySearch.trim() ? 'Search Results' : activeCat.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCatOpen(false)}
                    className="rounded-xl p-1.5 text-text-secondary hover:bg-cream-100 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="shrink-0 px-4 pt-3">
                  <div
                    className={`flex items-center gap-2 rounded-xl border bg-gray-50 px-3 dark:bg-mintcom-dark ${
                      categorySearch
                        ? 'border-mintcom-green border-[1.5px]'
                        : 'border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <Search
                      size={15}
                      className={categorySearch ? 'text-mintcom-green' : 'text-text-secondary'}
                    />
                    <input
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      placeholder="Search categories"
                      className="w-full bg-transparent py-2.5 text-[13px] font-medium text-text-primary outline-none dark:text-white"
                      autoFocus
                    />
                    {categorySearch && (
                      <button
                        type="button"
                        onClick={() => setCategorySearch('')}
                        className="text-text-secondary"
                        aria-label="Clear"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
                  {filteredCategories.map((c) => {
                    const isSelected = selectedCategory === c.id;
                    const isAll = c.id === 'all';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(c.id);
                          setCatOpen(false);
                          setCategorySearch('');
                        }}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-start transition-all ${
                          isSelected
                            ? 'border-mintcom-green bg-mintcom-green/10'
                            : 'border-gray-200 bg-gray-50 hover:bg-cream-50 dark:border-white/10 dark:bg-mintcom-dark dark:hover:bg-white/5'
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            isSelected ? 'bg-mintcom-green text-white' : 'bg-mintcom-green/15 text-mintcom-green'
                          }`}
                        >
                          {isAll ? <LayoutGrid size={16} /> : <Package size={16} />}
                        </span>
                        <span
                          className={`min-w-0 flex-1 truncate text-[14px] font-bold ${
                            isSelected ? 'text-mintcom-green' : 'text-text-primary dark:text-white'
                          }`}
                        >
                          {c.name}
                        </span>
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border ${
                            isSelected
                              ? 'border-mintcom-green bg-mintcom-green/15 text-mintcom-green'
                              : 'border-transparent'
                          }`}
                        >
                          {isSelected && <Check size={15} strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                  {filteredCategories.length === 0 && (
                    <p className="py-8 text-center text-sm text-text-tertiary">No categories found</p>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {mobile && screen === 'sales' && (
          <button
            type="button"
            onClick={() => setMobileCartOpen(true)}
            className="absolute inset-x-3 z-40 flex h-14 items-center gap-3 rounded-xl bg-[#1F1D2B] px-3 text-white shadow-[0_12px_32px_rgba(0,0,0,0.35)] active:scale-[0.99]"
            style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            aria-label={`Open order with ${itemCount} items`}
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green !text-white">
              <ShoppingBag size={19} />
              {itemCount > 0 && (
                <span className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D55263] px-1 text-[10px] font-black text-white">
                  {itemCount}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1 text-start">
              <span className="block text-[10px] font-bold uppercase text-white/55">Current order</span>
              <span className="block truncate text-sm font-black">{itemCount ? `${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Tap products to begin'}</span>
            </span>
            <span className="text-end">
              <span className="block text-[10px] font-bold uppercase text-white/55">Total</span>
              <span className="block text-base font-black text-mintcom-green">{money(total)}</span>
            </span>
            <ChevronDown size={18} className="-rotate-90 text-white/60" />
          </button>
        )}

        {/* Mobile order sheet */}
        <AnimatePresence>
          {mobile && mobileCartOpen && screen === 'sales' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-black/45 backdrop-blur-sm"
              onClick={() => setMobileCartOpen(false)}
            >
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-x-0 bottom-0 flex h-[min(92dvh,680px)] max-h-[100dvh] flex-col rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-mintcom-tertiary dark:bg-mintcom-surface"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              >
                <div className="flex justify-center pt-2">
                  <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
                </div>
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/8">
                  <p className="text-sm font-black">Order #{orderNo}</p>
                  <button
                    type="button"
                    onClick={() => setMobileCartOpen(false)}
                    aria-label="Close order"
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10"
                  >
                    <X size={16} />
                  </button>
                </div>
                <OrderPanel
                  className="flex min-h-0 flex-1"
                  {...sharedOrderPanelProps}
                  compact
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment panel — receipt + Cash / Card / Other only (POS PaymentPanel) */}
        <AnimatePresence>
          {showPaymentPanel && (
            <PaymentCheckoutPanel
              cart={cart}
              orderNo={orderNo}
              orderType={orderType}
              orderNote={orderNote}
              subtotal={subtotal}
              discount={discount}
              discountPct={discountPct}
              serviceChargeAmount={serviceChargeAmount}
              serviceChargeName={salesSettings.serviceChargeName}
              tax={tax}
              taxRate={taxRateEffective}
              total={total}
              initialTab={paymentTab}
              onClose={() => setShowPaymentPanel(false)}
              onComplete={finalizeSale}
              staffName={staff?.name || 'Cashier'}
              businessName={businessName}
            />
          )}
        </AnimatePresence>

        {/* Split — separate modal like mintcom-pos SplitPaymentModal (no receipt) */}
        <AnimatePresence>
          {showSplitPanel && (
            <SplitPaymentDemoModal
              cart={cart}
              orderNo={orderNo}
              subtotal={subtotal}
              discount={discount}
              serviceChargeAmount={serviceChargeAmount}
              serviceChargeName={salesSettings.serviceChargeName}
              tax={tax}
              taxRate={taxRateEffective}
              total={total}
              onClose={() => setShowSplitPanel(false)}
              onComplete={finalizeSale}
            />
          )}
        </AnimatePresence>

        {/* Addon modal — identical to mintcom-pos AddonModal (screenshot-matched) */}
        <AnimatePresence>
          {addonItem && (() => {
            const headerPrice = splitPosAmount(addonItem.price);
            const totalPrice = splitPosAmount(addonPreview.lineTotal);
            const stockLeft =
              addonItem.trackStock
                ? Math.max(0, (addonItem.availableStock ?? 0) - Math.max(0, cart.filter((l) => l.productId === addonItem.id).reduce((s, l) => s + l.qty, 0)))
                : null;
            const stockRemaining =
              stockLeft === null ? null : Math.max(0, stockLeft - addonQty);
            const selectedDiscountLabel =
              addonDiscountPct > 0
                ? `${DEMO_ITEM_DISCOUNTS.find((d) => d.pct === addonDiscountPct)?.name ?? 'Discount'} ${addonDiscountPct}%`
                : 'No Discounts Added';

            return (
              <motion.div
                key="addon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 p-2 sm:p-3"
                onClick={closeAddonModal}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative flex w-[min(96%,560px)] flex-col overflow-hidden rounded-xl border border-[#e9ecef] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] dark:border-white/10 dark:bg-mintcom-surface"
                >
                  {addonDiscountOpen && (
                    <button
                      type="button"
                      className="absolute inset-0 z-[90] cursor-default"
                      aria-label="Close discount menu"
                      onClick={() => setAddonDiscountOpen(false)}
                    />
                  )}

                  {/* ── Product header — matches POS: image | name+price | qty ── */}
                  <div className="flex shrink-0 items-center gap-3 px-4 py-3.5">
                    {/* Image */}
                    <div className={productImgWrapClass(addonItem.imageDataUrl, 'flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F5F7FA]')}>
                      <img
                        src={productImgSrc(addonItem.imageDataUrl)}
                        alt=""
                        className={productImgClass(addonItem.imageDataUrl)}
                      />
                    </div>

                    {/* Name + price — never compete with qty for width */}
                    <div className="min-w-0 flex-1 pe-2">
                      <p
                        className="truncate text-[17px] font-bold leading-6 tracking-[-0.3px] text-[#1F2937] dark:text-white"
                        title={addonItem.name}
                      >
                        {addonItem.name}
                      </p>
                      <p className="mt-0.5 text-[16px] font-bold tabular-nums leading-6 tracking-[-0.2px] text-[#7dc6a2]">
                        {headerPrice.amount}
                        {headerPrice.currency ? (
                          <span className="ms-1 text-[12px] font-bold">{headerPrice.currency}</span>
                        ) : null}
                      </p>
                    </div>

                    {/* Qty — fixed-width cluster like POS (Image #2) */}
                    <div className="flex w-[120px] sm:w-[132px] shrink-0 flex-col items-center">
                      <div className="flex w-full items-center justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={addonQty <= 1}
                          onClick={() => {
                            const q = Math.max(1, addonQty - 1);
                            setAddonQty(q);
                            setAddonQtyText(String(q));
                          }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-[#F3F4F6] text-[#6B7280] disabled:opacity-40 dark:border-white/10 dark:bg-white/10 dark:text-white"
                          aria-label="Decrease quantity"
                        >
                          <span className="text-base font-semibold leading-none">−</span>
                        </button>
                        <div className="relative h-10 w-11 shrink-0">
                          <input
                            value={addonQtyText}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[^0-9]/g, '');
                              setAddonQtyText(cleaned);
                              if (cleaned === '') {
                                setAddonQty(1);
                                return;
                              }
                              let val = parseInt(cleaned, 10);
                              if (Number.isNaN(val) || val < 1) val = 1;
                              if (stockLeft !== null && val > stockLeft) val = Math.max(1, stockLeft);
                              if (val > 9999) val = 9999;
                              setAddonQty(val);
                              setAddonQtyText(String(val));
                            }}
                            onBlur={() => {
                              if (!addonQtyText || parseInt(addonQtyText, 10) < 1) {
                                setAddonQty(1);
                                setAddonQtyText('1');
                              } else {
                                setAddonQtyText(String(addonQty));
                              }
                            }}
                            inputMode="numeric"
                            className="h-10 w-11 rounded-xl border border-gray-300 bg-white pb-0.5 text-center text-[16px] sm:text-sm font-bold text-[#1F2937] outline-none dark:border-white/20 dark:bg-mintcom-dark dark:text-white"
                          />
                          {/* Underline under the number — matches POS quantityInputUnderline */}
                          <span
                            aria-hidden
                            className="pointer-events-none absolute bottom-[7px] left-2.5 right-2.5 h-px rounded-xl bg-black dark:bg-white"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={stockLeft !== null && addonQty >= stockLeft}
                          onClick={() => {
                            if (stockLeft !== null && addonQty >= stockLeft) return;
                            const q = Math.min(9999, addonQty + 1);
                            setAddonQty(q);
                            setAddonQtyText(String(q));
                          }}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7dc6a2] text-white shadow-sm disabled:bg-[#D1D5DB] disabled:opacity-60"
                          aria-label="Increase quantity"
                        >
                          <Plus size={16} strokeWidth={2.5} />
                        </button>
                      </div>
                      {stockRemaining !== null && (
                        <p
                          className={`mt-1 w-full text-center text-[11px] font-medium ${
                            stockRemaining <= 0
                              ? 'font-semibold text-[#D55263]'
                              : stockRemaining <= 2
                                ? 'text-[#F59E0B]'
                                : 'text-[#6B7280]'
                          }`}
                        >
                          {stockRemaining} Left
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── Note + Discount row ── */}
                  <div
                    className={`relative flex shrink-0 items-stretch gap-2 border-b border-[#E5E7EB] px-3.5 py-2 dark:border-white/10 sm:gap-2.5 sm:px-4 sm:py-2.5 ${
                      addonDiscountOpen ? 'z-[100]' : ''
                    }`}
                  >
                    <div className="flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#E5E7EB] bg-[#e8e8e8] px-3 py-2 dark:border-white/10 dark:bg-mintcom-dark sm:min-h-11">
                      <Pencil size={18} className="shrink-0 text-[#6B7280]" strokeWidth={1.75} />
                      <input
                        value={addonNote}
                        onChange={(e) => setAddonNote(e.target.value.slice(0, 120))}
                        placeholder="Add Note"
                        className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-[#1F2937] outline-none placeholder:text-[#9CA3AF] dark:text-white"
                      />
                      {addonNote.trim() && (
                        <button
                          type="button"
                          onClick={() => setAddonNote('')}
                          className="shrink-0 text-[#6B7280]"
                          aria-label="Clear note"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>

                    {/* Discount — full label "No Discounts Added" (no ellipsis), like POS */}
                    <div className="relative shrink-0">
                      <button
                        type="button"
                        onClick={() => setAddonDiscountOpen((v) => !v)}
                        className="flex h-full min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-[#E5E7EB] bg-[#e8e8e8] px-3 py-2 dark:border-white/10 dark:bg-mintcom-dark sm:min-h-11 sm:px-3.5"
                      >
                        <BadgePercent
                          size={18}
                          className={`shrink-0 ${
                            addonDiscountPct > 0 ? 'text-[#F59E0B]' : 'text-[#6B7280]'
                          }`}
                          strokeWidth={1.75}
                        />
                        <span className="text-[12px] font-semibold leading-4 text-[#1F2937] dark:text-white sm:text-[13px]">
                          {selectedDiscountLabel}
                        </span>
                      </button>

                      {addonDiscountOpen && (
                        <div className="absolute end-0 top-[calc(100%+4px)] z-[1000] min-w-full max-h-[180px] overflow-y-auto rounded-xl border border-[#E5E7EB] bg-[#e8e8e8] shadow-lg dark:border-white/10 dark:bg-mintcom-surface">
                          {DEMO_ITEM_DISCOUNTS.map((d) => {
                            const on = addonDiscountPct === d.pct;
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setAddonDiscountPct(d.pct);
                                  setAddonDiscountOpen(false);
                                }}
                                className={`flex w-full items-center justify-between gap-2 border-b border-[#E5E7EB]/80 px-3 py-3 text-start last:border-0 dark:border-white/8 ${
                                  on ? 'bg-[#7dc6a2]/20' : 'hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                              >
                                <span
                                  className={`flex-1 text-sm font-semibold ${
                                    on ? 'font-bold text-[#2D5A3D]' : 'text-[#1F2937] dark:text-white'
                                  }`}
                                >
                                  {d.name}
                                </span>
                                {d.pct > 0 && (
                                  <span
                                    className={`ms-2 text-xs font-bold ${
                                      on ? 'text-[#7dc6a2]' : 'text-[#6B7280]'
                                    }`}
                                  >
                                    {d.pct}% off
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/*
                    Attributes body — fixed height for 0 / 1 / 2+ add-ons so the
                    modal never stretches differently. Scroll when content overflows.
                    Option tiles always h-[120px] in a 3-col grid (1 or 2 options
                    stay same size as a full row of 3).
                  */}
                  <div className="h-[240px] shrink-0 overflow-y-auto overscroll-contain px-3.5 py-3 sm:h-[300px] sm:px-4 sm:py-3.5">
                    {!(addonItem.attributes?.length) ? (
                      <div className="flex h-full items-center justify-center px-4">
                        <p className="text-center text-sm leading-5 text-[#999]">
                          No add-ons available for this item
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {(addonItem.attributes ?? []).map((attr) => {
                          const hasError = addonErrors.includes(attr.id);
                          return (
                            <div
                              key={attr.id}
                              className={
                                hasError
                                  ? 'rounded-xl border border-[#D55263] bg-[#FDF2F4] px-3 py-3'
                                  : ''
                              }
                            >
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <p className="text-[15px] font-bold uppercase tracking-[-0.2px] text-[#1F2937] dark:text-white">
                                  {attr.name}
                                </p>
                                <span
                                  className={`rounded-xl px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                                    attr.required
                                      ? hasError
                                        ? 'bg-[#D97706] text-white'
                                        : 'bg-[#FFFBEB] text-[#D97706]'
                                      : 'bg-[#F9FAFB] text-[#6B7280] dark:bg-white/5'
                                  }`}
                                >
                                  {attr.required ? 'Required' : 'Optional'}
                                </span>
                                <span className="rounded-xl border border-[#A7F3D0] bg-[#eef7ec] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#7dc6a2] dark:border-mintcom-green/35 dark:bg-mintcom-green/10">
                                  {attr.multi ? 'Multi Select' : 'Single Select'}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-3">
                                {attr.options.map((opt) => {
                                  const selected = (addonSel[attr.id] ?? []).includes(opt.id);
                                  const optPrice = splitPosAmount(opt.price);
                                  const unavailable = opt.available === false;
                                  return (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      disabled={unavailable}
                                      aria-disabled={unavailable}
                                      onClick={() => {
                                        if (unavailable) {
                                          ping(`${opt.name} is unavailable`);
                                          return;
                                        }
                                        toggleOption(attr, opt);
                                      }}
                                      className={`relative box-border flex h-[120px] w-full min-w-0 flex-none flex-col items-center justify-center rounded-xl border-2 p-3 text-center transition-colors ${
                                        unavailable
                                          ? 'cursor-not-allowed border-[#E5E7EB] bg-gray-50 opacity-55 dark:border-white/10 dark:bg-mintcom-dark'
                                          : selected
                                            ? 'border-[#7dc6a2] bg-[#7dc6a2]/10 shadow-[0_2px_6px_rgba(125,198,162,0.15)]'
                                            : 'border-[#E5E7EB] bg-white hover:border-[#7dc6a2]/50 dark:border-white/10 dark:bg-mintcom-dark'
                                      }`}
                                    >
                                      {selected && !unavailable && (
                                        <span className="absolute end-2 top-2 z-[1] flex h-[22px] w-[22px] items-center justify-center rounded-xl bg-[#7dc6a2]">
                                          <Check size={14} strokeWidth={3} className="text-white" />
                                        </span>
                                      )}
                                      {unavailable && (
                                        <span className="absolute end-1.5 top-1.5 z-[1] rounded-md bg-mintcom-red/15 px-1.5 py-0.5 text-[8.5px] font-black uppercase text-mintcom-red">
                                          Unavailable
                                        </span>
                                      )}
                                      <span
                                        className={`mb-3 line-clamp-2 w-full px-0.5 text-base font-semibold leading-snug ${
                                          unavailable
                                            ? 'text-text-tertiary line-through dark:text-mintcom-gray'
                                            : selected
                                              ? 'text-[#7dc6a2]'
                                              : 'text-[#1F2937] dark:text-white'
                                        }`}
                                      >
                                        {opt.name}
                                      </span>
                                      <span
                                        className={`shrink-0 text-sm font-bold tabular-nums ${
                                          unavailable
                                            ? 'text-text-tertiary dark:text-mintcom-gray'
                                            : selected
                                              ? 'text-text-primary dark:text-white'
                                              : 'text-text-secondary dark:text-mintcom-textSecondary'
                                        }`}
                                      >
                                        {optPrice.amount}
                                        {optPrice.currency ? ` ${optPrice.currency}` : ''}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Bottom: Add to Billing ── */}
                  <div className="shrink-0 border-t border-[#E5E7EB] px-3.5 py-3 dark:border-white/10 sm:px-4 sm:py-3.5">
                    <button
                      type="button"
                      onClick={confirmAddons}
                      className="flex w-full items-center justify-between rounded-xl bg-[#7dc6a2] px-4 py-3 text-white shadow-[0_4px_12px_rgba(125,198,162,0.35)] transition-transform active:scale-[0.99] sm:px-5 sm:py-3.5"
                    >
                      <span className="text-[15px] font-bold tracking-[0.2px] sm:text-base">
                        {editLineId ? 'Save Changes' : 'Add to Billing'}
                      </span>
                      <span className="flex min-w-[80px] items-baseline justify-end gap-1 tabular-nums">
                        <span className="text-base font-bold tracking-[-0.2px] sm:text-lg">{totalPrice.amount}</span>
                        {totalPrice.currency && (
                          <span className="text-[9px] font-bold text-white/78">{totalPrice.currency}</span>
                        )}
                      </span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Loyalty modal — full POS LoyaltyModal clone */}
        <AnimatePresence>
          {showLoyalty && (
            <DemoLoyaltyModal
              customers={DEMO_LOYALTY_CUSTOMERS}
              rewards={DEMO_LOYALTY_REWARDS}
              products={products}
              attachedCustomer={loyaltyCustomer}
              currentReward={appliedLoyaltyReward}
              hasOrderItems={cart.length > 0}
              onClose={() => setShowLoyalty(false)}
              onAttach={attachLoyalty}
              onDetach={detachLoyalty}
            />
          )}
        </AnimatePresence>

        {/*
          Payment Successful — mirrors mintcom-pos PaymentSuccessfulModal
          (icon, title, change/method box, Back to Sales, Print Receipt).
        */}
        <AnimatePresence>
          {showReceipt && lastReceipt && (
            <div
              className="absolute inset-0 z-[70] flex items-center justify-center bg-black/70 p-5"
              onClick={() => setShowReceipt(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={(e) => e.stopPropagation()}
                className="flex w-[min(94%,420px)] max-h-[85%] flex-col items-center overflow-y-auto overscroll-contain rounded-xl border border-[#e9ecef] bg-white px-5 sm:px-8 py-7 sm:py-9 text-center shadow-[0_8px_40px_rgba(0,0,0,0.15)] dark:border-white/10 dark:bg-mintcom-surface"
              >
                <div className="mb-[18px] flex h-20 w-20 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                  <Check size={48} strokeWidth={2.5} />
                </div>
                <h3 className="mb-2.5 text-[24px] font-bold leading-tight text-text-primary dark:text-white sm:text-[32px]">
                  Payment Successful
                </h3>
                <p className="mb-4 text-[15px] text-text-secondary dark:text-mintcom-textSecondary">
                  Transaction completed successfully
                </p>

                {/* Change (cash + change) or Payment Method — POS PaymentSuccessfulModal */}
                {lastReceipt.method === 'cash' && (lastReceipt.changeAmount ?? 0) > 0 ? (
                  <div className="mb-5 w-full rounded-xl bg-[#f8f9fa] px-4 py-4 dark:bg-white/5">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-text-secondary">
                      Change
                    </p>
                    <p className="mt-1 text-[28px] font-extrabold tabular-nums leading-none text-mintcom-green">
                      {money(lastReceipt.changeAmount ?? 0)}
                    </p>
                    {lastReceipt.tendered != null && (
                      <p className="mt-2 text-[12px] text-text-tertiary">
                        Received {money(lastReceipt.tendered)} · Total {money(lastReceipt.total)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mb-5 w-full rounded-xl bg-[#f8f9fa] px-4 py-4 dark:bg-white/5">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-text-secondary">
                      Payment Method
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-mintcom-green">
                      {lastReceipt.method === 'cash'
                        ? `Cash · ${money(lastReceipt.total)}`
                        : payMethodLabel(lastReceipt.method)}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowReceipt(false);
                    setScreen('sales');
                  }}
                  className="mb-2.5 w-full rounded-xl bg-mintcom-green py-3.5 text-[15px] font-bold text-white shadow-md shadow-mintcom-green/25"
                >
                  Back to Sales
                </button>

                <button
                  type="button"
                  onClick={() => openPrintPaidReceipt()}
                  className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-[14px] font-bold text-text-secondary dark:border-white/15 dark:bg-mintcom-surface dark:text-mintcom-textSecondary"
                >
                  <Printer size={18} />
                  Print Receipt
                </button>

                <Link
                  to="/signup"
                  className="w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-bold text-text-primary dark:border-white/10 dark:text-white"
                >
                  Create free account
                </Link>

                <p className="mt-3 text-[11px] text-text-tertiary dark:text-mintcom-gray">
                  Order #{lastReceipt.orderNo} · Shift: {shiftOrders} sale
                  {shiftOrders === 1 ? '' : 's'} · {money(shiftRevenue)}
                </p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * Empty cart illustration — same SVG paths as mintcom-pos EmptyCartIcon
 * (cart body + wheels + green circle with white X).
 */
function EmptyCartIcon({
  size = 120,
  color = '#7dc6a2',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 145 143"
      className={className}
      aria-hidden
    >
      <g transform="translate(0,143) scale(0.1,-0.1)" stroke="none">
        {/* Cart body */}
        <path
          d="M63 1165c-9-26 4-30 107-33 64-3 103-8 110-16 5-7 50-129 100-271 49-142 99-268 110-280 17-19 19-26 9-54-8-24-8-39 1-62 23-55 42-58 331-59 145 0 270 0 277 0 8 0 12 9 10 22-3 21-3 21-266 19-227-2-267 0-288 14-29 19-32 55-6 78 16 15 48 17 236 17 228 0 264 6 281 47 30 76 125 359 125 373 0 15-10 19-64 22l-64 3-5-51c-6-59-33-118-78-168-102-117-305-116-411 2-50 56-70 97-77 162l-6 55-51-3c-60-3-61-2-98 96-36 93-52 102-181 102-77 0-97-3-102-15z"
          fill={color}
        />
        {/* Wheels */}
        <path
          d="M624 366c-49-22-59-74-23-120 45-57 139-19 139 55 0 28-30 69-49 69-5 0-15 2-23 5-7 2-27-2-44-9z"
          fill={color}
        />
        <path
          d="M937 352c-25-28-22-84 6-110 69-65 176 26 117 101-17 22-30 27-64 27-29 0-48-6-59-18z"
          fill={color}
        />
        {/* Circle */}
        <path
          d="M690 1184c-165-71-194-302-52-411 158-121 382-10 382 189 0 67-15 108-56 157-60 71-189 102-274 65z"
          fill={color}
        />
        {/* X mark — white */}
        <path
          d="M670 1020 l70 -70 -70 -70 c-20 -20 -20 -30 0 -50 20 -20 30 -20 50 0 l70 70 70 -70 c20 -20 30 -20 50 0 20 20 20 30 0 50 l-70 70 70 70 c20 20 20 30 0 50 -20 20 -30 20 -50 0 l-70 -70 -70 70 c-20 20 -30 20 -50 0 -20 -20 -20 -30 0 -50z"
          fill="white"
        />
      </g>
    </svg>
  );
}

function ActionBtn({
  title,
  onClick,
  disabled,
  danger,
  activeGreen,
  children,
  badge,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  activeGreen?: boolean;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex h-11 min-h-[44px] flex-1 items-center justify-center rounded-xl !text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-opacity disabled:opacity-60 ${
        disabled
          ? 'bg-[#9CA3AF]'
          : danger
            ? 'bg-[#D55263]'
            : activeGreen
              ? 'bg-[#22c55e]'
              : 'bg-[#7dc6a2]'
      }`}
    >
      {children}
      {badge}
    </button>
  );
}

/* ─── Order panel (desktop + mobile sheet) ─── */
function OrderPanel({
  className = '',
  orderNo,
  cart,
  orderType,
  discountPct,
  discountName,
  orderDiscounts = [],
  onApplyDiscount,
  orderNote,
  loyaltyName,
  subtotal,
  discount,
  tax,
  taxRate = 8,
  taxName,
  isTaxChanged = false,
  onEditTax,
  serviceChargeAmount = 0,
  serviceChargeLabel = 'Service Charge',
  serviceChargeActive = false,
  onEditServiceCharge,
  serviceChargeEditDisabled = false,
  total,
  onShowNote,
  onHold,
  onClear,
  onLoyalty,
  onPrint,
  onChangeQty,
  onEditLine,
  onUpdateLineDiscount,
  onUpdateLineNote,
  onPayCash,
  onPayCard,
  onPayOther,
  onPaySplit,
  canDiscount = true,
  canHold = true,
  canVoid = true,
  canLoyalty = true,
  canSplit = true,
  canClear = true,
  compact,
  panelId,
  payActionsId,
}: {
  className?: string;
  orderNo: number;
  cart: CartLine[];
  orderType: OrderType;
  discountPct: number;
  discountName?: string | null;
  orderDiscounts?: ReadonlyArray<{ id: string; name: string; pct: number }>;
  onApplyDiscount?: (id: string) => void;
  orderNote: string;
  loyaltyName: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate?: number;
  taxName?: string | null;
  isTaxChanged?: boolean;
  onEditTax?: () => void;
  serviceChargeAmount?: number;
  serviceChargeLabel?: string;
  serviceChargeActive?: boolean;
  onEditServiceCharge?: () => void;
  /** POS disables SC edit when cart is empty but still shows the row */
  serviceChargeEditDisabled?: boolean;
  total: number;
  onShowNote: () => void;
  onHold: () => void;
  onClear: () => void;
  onLoyalty: () => void;
  onPrint?: () => void;
  onChangeQty: (id: string, d: number) => void;
  onEditLine?: (line: CartLine) => void;
  /** POS item-level discount (OrderSummaryPanel applyItemDiscount) */
  onUpdateLineDiscount?: (lineId: string, pct: number, name?: string) => void;
  /** POS item special note */
  onUpdateLineNote?: (lineId: string, note: string) => void;
  onPayCash: () => void;
  onPayCard: () => void;
  onPayOther: () => void;
  onPaySplit: () => void;
  canDiscount?: boolean;
  canHold?: boolean;
  canVoid?: boolean;
  canLoyalty?: boolean;
  canSplit?: boolean;
  canClear?: boolean;
  compact?: boolean;
  panelId?: string;
  payActionsId?: string;
}) {
  const empty = cart.length === 0;
  // Accordion expand like POS OrderSummaryPanel — one open at a time
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const linesContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when a new item is added to the cart
  const prevCartLength = useRef(cart.length);
  useEffect(() => {
    if (cart.length > prevCartLength.current && bottomRef.current) {
      window.setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
    prevCartLength.current = cart.length;
  }, [cart.length]);

  /** POS Apply Discount is an anchored dropdown, not a full-screen modal */
  const [discountOpen, setDiscountOpen] = useState(false);
  /**
   * Item discount menu — mirrors mintcom-pos OrderSummaryPanel Modal dropdown:
   * measured from the trigger, portaled over the full try-pos frame so it is
   * never clipped by the cart card / scroll pane.
   */
  const [lineDiscountMenu, setLineDiscountMenu] = useState<{
    id: string;
    top: number;
    left: number;
    width: number;
  } | null>(null);
  /** Per-line special note editor */
  const [lineNoteEdit, setLineNoteEdit] = useState<{ id: string; draft: string } | null>(null);

  // Real POS closes the discount Modal on interaction — dismiss on cart scroll
  useEffect(() => {
    const el = linesContainerRef.current;
    if (!el) return;
    const onScroll = () => setLineDiscountMenu(null);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const closeLineDiscountMenu = () => setLineDiscountMenu(null);

  const openLineDiscountMenu = (lineId: string, anchor: HTMLElement) => {
    const root =
      (document.querySelector('.try-pos-root') as HTMLElement | null) ?? null;
    const rootRect = root?.getBoundingClientRect();
    const btnRect = anchor.getBoundingClientRect();
    // StaticPosCanvas scales try-pos-root — convert viewport → local design px
    const scaleX =
      root && rootRect && root.offsetWidth > 0
        ? rootRect.width / root.offsetWidth
        : 1;
    const scaleY =
      root && rootRect && root.offsetHeight > 0
        ? rootRect.height / root.offsetHeight
        : 1;
    const localBtnBottom = rootRect
      ? (btnRect.bottom - rootRect.top) / scaleY
      : btnRect.bottom;
    const localBtnTop = rootRect
      ? (btnRect.top - rootRect.top) / scaleY
      : btnRect.top;
    const leftRaw = rootRect
      ? (btnRect.left - rootRect.left) / scaleX
      : btnRect.left;
    const width = Math.max(
      rootRect ? btnRect.width / scaleX : btnRect.width,
      160,
    );
    const hostH = root?.offsetHeight ?? window.innerHeight;
    const hostW = root?.offsetWidth ?? window.innerWidth;
    const menuH = 220;
    const topBelow = localBtnBottom + 4;
    const top =
      topBelow + menuH > hostH - 8
        ? Math.max(8, localBtnTop - menuH - 4)
        : topBelow;
    // Keep the menu inside the POS frame on narrow phones.
    const left = Math.max(8, Math.min(leftRaw, hostW - width - 8));
    setLineDiscountMenu((cur) =>
      cur?.id === lineId ? null : { id: lineId, top, left, width },
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedId((cur) => (cur === id ? null : id));
    closeLineDiscountMenu();
  };

  const openDiscountDropdown = () => {
    if (!canDiscount) return;
    if (empty) return;
    setDiscountOpen((v) => !v);
  };

  const noteLine = lineNoteEdit
    ? cart.find((l) => l.id === lineNoteEdit.id) ?? null
    : null;

  return (
    <aside
      className={`relative flex h-full min-h-0 flex-col overflow-hidden ${className}`}
      id={panelId}
    >
      {/* Order panel header — identical to POS OrderPanelHeader */}
      <div className="border-b border-[#f0f0f0] px-3.5 py-3 dark:border-white/10">
        {empty ? (
          <div className="flex items-center justify-between gap-3 px-1 py-2">
            <p className="flex-1 text-sm font-medium text-[#9CA3AF]">Add items to start</p>
            <button
              type="button"
              title="Loyalty"
              onClick={onLoyalty}
              disabled={!canLoyalty}
              className={`relative flex h-[42px] w-[52px] shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${
                !canLoyalty
                  ? 'bg-[#9CA3AF] opacity-60'
                  : loyaltyName
                    ? 'bg-[#22c55e]'
                    : 'bg-[#7dc6a2]'
              }`}
            >
              {loyaltyName ? <UserCheck size={22} /> : <Star size={22} />}
              {loyaltyName && (
                <span className="absolute end-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-white bg-[#22c55e]">
                  <Check size={8} strokeWidth={3} className="text-white" />
                </span>
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-2.5 flex items-stretch justify-between gap-2">
              {/* Discount + anchored dropdown (POS style) */}
              <div className="relative flex-1">
                <button
                  type="button"
                  title="Discount"
                  aria-label="Discount"
                  onClick={openDiscountDropdown}
                  disabled={!canDiscount}
                  className={`relative flex h-[42px] w-full items-center justify-center rounded-xl text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] disabled:opacity-60 ${
                    !canDiscount ? 'bg-[#9CA3AF]' : 'bg-[#7dc6a2]'
                  }`}
                >
                  <BadgePercent size={22} strokeWidth={2} />
                  {discountPct > 0 && (
                    <span className="absolute end-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-white bg-[#FFC107] px-1 text-[9px] font-bold leading-none text-white">
                      {discountPct}%
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {discountOpen && (
                    <>
                      {/* Full-screen catch — close when clicking anywhere else */}
                      <button
                        type="button"
                        className="fixed inset-0 z-[60] cursor-default"
                        aria-label="Close discount menu"
                        onClick={() => setDiscountOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute start-0 top-[calc(100%+6px)] z-[70] min-w-[200px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.15)] dark:border-white/10 dark:bg-mintcom-surface"
                      >
                        <div className="flex items-center gap-2 border-b border-gray-100 px-3.5 py-3.5 dark:border-white/8">
                          <BadgePercent size={18} className="text-mintcom-green" />
                          <p className="text-[15px] font-bold text-text-primary dark:text-white">
                            Apply Discount
                          </p>
                        </div>
                        <div className="max-h-[180px] overflow-y-auto">
                          {orderDiscounts.map((d, index) => {
                            const selected =
                              d.pct === 0
                                ? discountPct === 0
                                : discountPct === d.pct &&
                                  (!discountName || discountName === d.name);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  onApplyDiscount?.(d.id);
                                  setDiscountOpen(false);
                                }}
                                className={`flex w-full flex-col border-b border-gray-100 px-3.5 py-3 text-start last:border-0 dark:border-white/8 ${
                                  selected
                                    ? 'border-s-[3px] border-s-mintcom-green bg-mintcom-green/10'
                                    : 'border-s-[3px] border-s-transparent hover:bg-cream-50 dark:hover:bg-white/5'
                                } ${index === orderDiscounts.length - 1 ? '' : ''}`}
                              >
                                <span
                                  className={`text-sm font-medium ${
                                    selected
                                      ? 'font-bold text-mintcom-green'
                                      : 'text-text-primary dark:text-white'
                                  }`}
                                >
                                  {d.name}
                                </span>
                                {d.pct > 0 && (
                                  <span className="mt-0.5 text-xs text-text-secondary">
                                    {d.pct}% off
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <ActionBtn
                title="Note"
                onClick={onShowNote}
                badge={
                  freeTextOrderNote(orderNote) || orderType !== 'dine-in' ? (
                    <span className="absolute end-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-white bg-[#D55263] text-[9px] font-black leading-none text-white">
                      !
                    </span>
                  ) : null
                }
              >
                <Pencil size={22} strokeWidth={2} />
              </ActionBtn>

              <ActionBtn title="Hold order" onClick={onHold} disabled={!canHold}>
                <PauseCircle size={22} strokeWidth={2} />
              </ActionBtn>

              <ActionBtn
                title="Loyalty"
                onClick={onLoyalty}
                disabled={!canLoyalty}
                activeGreen={!!loyaltyName}
                badge={
                  loyaltyName ? (
                    <span className="absolute end-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-white bg-[#22c55e]">
                      <Check size={8} strokeWidth={3} className="text-white" />
                    </span>
                  ) : null
                }
              >
                {loyaltyName ? <UserCheck size={22} /> : <Star size={22} />}
              </ActionBtn>

              {onPrint && (
                <ActionBtn title="Print estimate" onClick={onPrint}>
                  <Printer size={22} strokeWidth={2} />
                </ActionBtn>
              )}

              <ActionBtn title="Clear order" onClick={onClear} disabled={!canClear} danger>
                <Trash2 size={22} strokeWidth={2} />
              </ActionBtn>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-[#6B7280] dark:text-mintcom-textSecondary">
                  Order number
                </span>
                <span className="text-[16px] font-extrabold text-[#111827] dark:text-white">
                  #{orderNo}
                </span>
              </div>
              {cart.length > 0 && (
                <span className="text-[13px] font-semibold text-[#6B7280] dark:text-mintcom-textSecondary">
                  {cart.reduce((s, l) => s + l.qty, 0)} {cart.reduce((s, l) => s + l.qty, 0) === 1 ? 'item' : 'items'}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Lines */}
      <div
        ref={linesContainerRef}
        className={`min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2 ${compact ? '' : ''}`}
      >
        {empty ? (
          /* POS OrderSummaryPanel emptyState + EmptyCartIcon */
          <div className="flex h-full min-h-[180px] flex-col items-center justify-center px-6 py-12 text-center">
            <EmptyCartIcon size={120} className="mb-5" />
            <p className="mb-1.5 text-[17px] font-bold tracking-tight text-text-primary dark:text-white">
              No items in cart
            </p>
            <p className="text-[13.5px] font-normal text-text-secondary dark:text-mintcom-textSecondary">
              Add items to get started
            </p>
          </div>
        ) : (
          cart.map((line) => {
            const expanded = expandedId === line.id;
            const lineTotal = line.unitPrice * line.qty;
            return (
              <div
                key={line.id}
                id={`cart-line-${line.id}`}
                className="overflow-hidden rounded-xl border border-gray-200 bg-cream-100 dark:border-white/10 dark:bg-mintcom-dark"
              >
                {/* Collapsed header — tap to expand like POS SwipeableOrderItem */}
                <button
                  type="button"
                  onClick={() => toggleExpand(line.id)}
                  className="flex w-full items-center gap-2.5 p-2.5 text-start"
                >
                  <span className={productImgWrapClass(line.imageDataUrl, 'flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-white/10')}>
                    <img
                      src={productImgSrc(line.imageDataUrl)}
                      alt=""
                      className={productImgClass(line.imageDataUrl, '', { thumb: true })}
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-bold text-text-primary dark:text-white">{line.name}</p>
                    {line.addons.length > 0 && (
                      <p className="mt-0.5 truncate text-[11px] font-medium text-text-tertiary dark:text-mintcom-textSecondary">
                        + {line.addons.map((a) => a.name).join(' · ')}
                      </p>
                    )}
                    {/* Discount only in expanded body (POS) — not on collapsed card header */}
                    {line.note && (
                      <p className="mt-0.5 line-clamp-1 text-[10.5px] text-text-secondary dark:text-mintcom-textSecondary">
                        Note: {line.note}
                      </p>
                    )}
                    <p className="mt-0.5 text-[14px] font-bold text-text-primary dark:text-white">
                      {money(lineTotal)} <span className="text-[11px] font-medium text-text-secondary dark:text-mintcom-textSecondary">USD</span>
                    </p>
                  </div>
                  {/* POS SwipeableOrderItem quantityBadge: 36×36, borderRadius 12 */}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mintcom-green text-[13px] font-bold tracking-wide text-white shadow-sm">
                    ×{line.qty}
                  </span>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface">
                    <ChevronDown
                      size={16}
                      className={`text-text-tertiary transition-transform ${expanded ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>

                {/* Expanded body — mirrors POS OrderSummaryPanel expanded card */}
                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden"
                      onAnimationComplete={() => {
                        const el = linesContainerRef.current?.querySelector(`#cart-line-${line.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                      }}
                    >
                      <div className="space-y-2.5 border-t border-gray-200/80 bg-[#e8e8e8]/60 px-2.5 pb-2.5 pt-2 dark:border-white/8 dark:bg-white/5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-text-secondary">Base Price</span>
                          <PriceText value={line.basePrice} size="sm" className="!text-text-primary dark:!text-white [&_span]:!text-inherit" />
                        </div>

                        {/* Selected Attributes — always when product has add-ons (POS) */}
                        {line.hasAttributes && (
                          <div className="rounded-xl border border-mintcom-green/30 bg-mintcom-green/10 px-2.5 py-2">
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <p className="text-[12px] font-bold text-text-primary dark:text-white">
                                Selected Attributes
                              </p>
                              {onEditLine && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditLine(line);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-xl border border-mintcom-green/40 bg-mintcom-green/15 px-2 py-1 text-[11px] font-bold text-mintcom-green"
                                >
                                  <Pencil size={12} />
                                  Edit item
                                </button>
                              )}
                            </div>
                            {line.addons.length === 0 ? (
                              <p className="text-[11px] font-medium text-text-secondary dark:text-mintcom-textSecondary">
                                No Selected Attributes
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {line.addons.map((a) => (
                                  <div key={a.id} className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-text-primary dark:text-white">
                                      • {a.name}
                                    </span>
                                    <span className="font-bold tabular-nums text-mintcom-green">
                                      {a.price > 0 ? `+${money(a.price)}` : 'Free'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-text-secondary">Quantity</span>
                          <div className="inline-flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-0.5 dark:border-white/10 dark:bg-mintcom-surface">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onChangeQty(line.id, -1);
                              }}
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold text-text-secondary hover:bg-cream-100 dark:hover:bg-white/10"
                            >
                              −
                            </button>
                            <span className="w-7 text-center text-sm font-black tabular-nums text-text-primary dark:text-white">
                              {line.qty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onChangeQty(line.id, 1);
                              }}
                              className="flex h-11 w-11 items-center justify-center rounded-xl bg-mintcom-green text-sm font-bold text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Discount — POS OrderSummaryPanel expandedRow + Modal dropdown */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-text-secondary">Discount</span>
                          <div className="relative min-w-0 flex-1 max-w-[200px]">
                            <button
                              type="button"
                              disabled={!canDiscount || !onUpdateLineDiscount}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!canDiscount || !onUpdateLineDiscount) return;
                                setLineNoteEdit(null);
                                openLineDiscountMenu(line.id, e.currentTarget);
                              }}
                              className={`flex w-full items-center justify-between gap-1.5 rounded-xl border px-2.5 py-2 text-start text-[11px] font-semibold disabled:opacity-60 ${
                                lineDiscountMenu?.id === line.id
                                  ? 'border-mintcom-green bg-mintcom-green/10 text-mintcom-green'
                                  : 'border-gray-200 bg-[#e8e8e8] text-text-primary dark:border-white/10 dark:bg-white/10 dark:text-white'
                              }`}
                            >
                              <span className="min-w-0 truncate">
                                {(line.discountPct ?? 0) > 0 && line.discountName
                                  ? `${line.discountName} (${line.discountPct}%)`
                                  : canDiscount
                                    ? 'Select discount'
                                    : 'No permission'}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`shrink-0 transition-transform ${
                                  lineDiscountMenu?.id === line.id ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Special Note — opens item NoteModal (same chrome as order Note) */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-text-secondary">
                            Special Note
                          </span>
                          <button
                            type="button"
                            disabled={!onUpdateLineNote}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!onUpdateLineNote) return;
                              closeLineDiscountMenu();
                              // Same as mintcom-pos OrderSummaryPanel → NoteModal
                              setLineNoteEdit({
                                id: line.id,
                                draft: (line.note || '').slice(0, NOTE_LIMIT),
                              });
                            }}
                            className="inline-flex items-center gap-1.5 text-[12px] font-bold text-mintcom-green disabled:opacity-50"
                          >
                            <Pencil size={14} />
                            {line.note?.trim() ? 'Edit note' : 'Add note'}
                            {line.note?.trim() ? (
                              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-mintcom-green text-[9px] font-black text-white">
                                !
                              </span>
                            ) : null}
                          </button>
                        </div>
                        {line.note?.trim() ? (
                          <div className="rounded-xl border border-mintcom-green/25 bg-[#f1f7f4] px-2.5 py-2 text-[12px] text-text-primary dark:border-mintcom-green/30 dark:bg-mintcom-green/10 dark:text-white">
                            {line.note}
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between border-t border-gray-200/80 pt-2 dark:border-white/8">
                          <span className="text-xs font-black text-text-primary dark:text-white">
                            Item total
                          </span>
                          <PriceText value={lineTotal} size="sm" />
                        </div>

                        {canVoid && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onChangeQty(line.id, -line.qty);
                              if (expandedId === line.id) setExpandedId(null);
                            }}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-mintcom-red py-2 text-[11px] font-black text-white"
                          >
                            <Trash2 size={13} /> Remove item
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
        {/* Order type is internal (quick-action note tags) — not shown as cart banners */}
        {freeTextOrderNote(orderNote) ? (
          <p className="rounded-xl bg-mintcom-yellow/10 px-2.5 py-1.5 text-[10px] font-medium text-text-secondary dark:text-mintcom-textSecondary">
            Note: {freeTextOrderNote(orderNote)}
          </p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {/* Totals + payment methods — mirrors POS OrderSummaryPanel */}
      <div className="border-t border-gray-100 px-3.5 py-3 dark:border-white/8">
        <div className="space-y-1.5 text-[13.5px]">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary dark:text-mintcom-textSecondary">Subtotal</span>
            <span className="tabular-nums font-medium text-text-primary dark:text-white">{money(subtotal)}</span>
          </div>
          {discountPct > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-text-secondary dark:text-mintcom-textSecondary">Discount {discountPct}%</span>
              <span className="tabular-nums font-medium text-text-primary dark:text-white">−{money(discount)}</span>
            </div>
          )}
          {/* Service charge — visible when enabled even with empty cart (POS) */}
          {(serviceChargeActive || serviceChargeAmount > 0) && (
            <button
              type="button"
              disabled={
                !onEditServiceCharge || serviceChargeEditDisabled
              }
              onClick={() => {
                if (serviceChargeEditDisabled || !onEditServiceCharge) return;
                onEditServiceCharge();
              }}
              className="flex w-full items-center justify-between gap-2 text-start disabled:cursor-default"
            >
              <span className="inline-flex items-center gap-1.5 text-text-secondary dark:text-mintcom-textSecondary">
                {serviceChargeLabel}
                {onEditServiceCharge && !serviceChargeEditDisabled && (
                  <Pencil size={13} className="text-text-tertiary" />
                )}
              </span>
              <span className="tabular-nums font-medium text-text-primary dark:text-white">
                {money(serviceChargeAmount)}
              </span>
            </button>
          )}
          {/* Tax rate — tappable Change Tax Rate modal */}
          <button
            type="button"
            disabled={empty || !onEditTax}
            onClick={onEditTax}
            className="flex w-full items-center justify-between gap-2 text-start disabled:cursor-default"
          >
            <span
              className={`inline-flex items-center gap-1.5 ${
                isTaxChanged
                  ? 'font-bold text-mintcom-green'
                  : 'text-text-secondary dark:text-mintcom-textSecondary'
              }`}
            >
              {taxRate === 0
                ? 'No Tax'
                : `Tax ${taxName ? `(${taxName}) ` : ''}${taxRate}%`}
              {onEditTax && !empty && (
                <Pencil
                  size={13}
                  className={isTaxChanged ? 'text-mintcom-green' : 'text-text-tertiary'}
                />
              )}
            </span>
            <span
              className={`tabular-nums font-medium ${
                isTaxChanged
                  ? 'font-bold text-mintcom-green'
                  : 'text-text-primary dark:text-white'
              }`}
            >
              {money(tax)}
            </span>
          </button>
        </div>

        {/* Separator Line — mirrors POS totalSeparator */}
        <div className="my-2.5 h-px w-full bg-gray-200 dark:bg-white/10" />

        <div className="flex items-center justify-between text-base font-bold text-text-primary dark:text-white">
          <span>Total</span>
          <span className="tabular-nums text-xl font-extrabold text-mintcom-green">{money(total)}</span>
        </div>

        {/* Payment Method header + Split — always shown like Cash/Card/Other; disabled when cart empty */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="text-[14px] font-bold text-text-primary dark:text-white">
            Payment Method
          </p>
          {canSplit && (
            <button
              type="button"
              disabled={empty}
              onClick={onPaySplit}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl border-[1.5px] px-2.5 py-1.5 text-[12.5px] font-bold transition-opacity ${
                empty
                  ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-[#9CA3AF] dark:border-white/10 dark:bg-white/5'
                  : 'border-mintcom-green/50 bg-mintcom-green/15 text-mintcom-green'
              }`}
            >
              <PosSplitReceiptIcon
                size={16}
                className={empty ? 'text-[#D1D5DB]' : 'text-mintcom-green'}
              />
              Split
            </button>
          )}
        </div>

        {/* Cap tile width so they stay square-ish on wide order panes (not stretched) */}
        <div id={payActionsId} className="mx-auto mt-2 grid w-full max-w-[280px] grid-cols-3 gap-2">
          <PayTile
            disabled={empty}
            onClick={onPayCash}
            icon={<PosCashIcon size={28} className="text-mintcom-green" />}
            label="Cash"
          />
          <PayTile
            disabled={empty}
            onClick={onPayCard}
            icon={<PosCardIcon size={28} className="text-mintcom-green" />}
            label="Card"
          />
          <PayTile
            disabled={empty}
            onClick={onPayOther}
            icon={<PosOtherReceiptIcon size={30} className="text-mintcom-green" />}
            label="Other"
          />
        </div>
      </div>

      {/*
        Item discount menu — mintcom-pos OrderSummaryPanel Modal dropdown.
        Portaled so the card floats over the full POS (not clipped by cart overflow).
      */}
      {lineDiscountMenu && onUpdateLineDiscount
        ? createPortal(
            <div className="absolute inset-0 z-[85]" role="presentation">
              <button
                type="button"
                className="absolute inset-0 cursor-default bg-black/[0.05]"
                aria-label="Close discount menu"
                onClick={closeLineDiscountMenu}
              />
              <div
                className="absolute z-[86] max-h-[220px] overflow-y-auto overscroll-contain rounded-xl border border-gray-200 bg-[#e8e8e8] shadow-[0_8px_24px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-mintcom-surface"
                style={{
                  top: lineDiscountMenu.top,
                  left: lineDiscountMenu.left,
                  width: lineDiscountMenu.width,
                }}
                role="listbox"
                aria-label="Select item discount"
              >
                {DEMO_ITEM_DISCOUNTS.map((d) => {
                  const line = cart.find((l) => l.id === lineDiscountMenu.id);
                  const selected =
                    d.pct === 0
                      ? !(line?.discountPct && line.discountPct > 0)
                      : line?.discountPct === d.pct;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onUpdateLineDiscount(
                          lineDiscountMenu.id,
                          d.pct,
                          d.pct > 0 ? d.name : undefined,
                        );
                        closeLineDiscountMenu();
                      }}
                      className={`flex w-full items-center justify-between gap-2 border-b border-gray-200/80 px-3 py-3 text-start last:border-0 dark:border-white/8 ${
                        selected
                          ? 'bg-mintcom-green/15'
                          : 'hover:bg-white/70 dark:hover:bg-white/5'
                      }`}
                    >
                      <span className="min-w-0">
                        <span
                          className={`block text-[13px] font-medium ${
                            selected
                              ? 'font-bold text-mintcom-green'
                              : 'text-text-primary dark:text-white'
                          }`}
                        >
                          {d.name}
                        </span>
                        {d.pct > 0 && (
                          <span className="mt-0.5 block text-[11px] text-mintcom-green">
                            {d.pct}% off
                          </span>
                        )}
                      </span>
                      {selected ? (
                        <Check size={16} className="shrink-0 text-mintcom-green" strokeWidth={2.5} />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>,
            (document.querySelector('.try-pos-root') as HTMLElement | null) ??
              document.body,
          )
        : null}

      {/*
        Item special note — same NoteModal as mintcom-pos OrderSummaryPanel:
        title “Note for {name}”, no order-type chips, saves to this cart line only.
        Portaled full-frame over Try POS (not clipped to the order pane).
      */}
      {lineNoteEdit && onUpdateLineNote ? (
        <DemoNoteModal
          open
          title={`Note for ${noteLine?.name || 'item'}`}
          value={lineNoteEdit.draft}
          onChange={(next) =>
            setLineNoteEdit({ id: lineNoteEdit.id, draft: next })
          }
          onCancel={() => setLineNoteEdit(null)}
          onSave={() => {
            onUpdateLineNote(lineNoteEdit.id, lineNoteEdit.draft.trim());
            setLineNoteEdit(null);
          }}
        />
      ) : null}
    </aside>
  );
}

/**
 * Full loyalty program modal — mirrors mintcom-pos LoyaltyModal:
 * Search / Scan QR / New Customer tabs, found customer + rewards, attach footer.
 */
function DemoLoyaltyModal({
  customers,
  rewards,
  products,
  attachedCustomer,
  currentReward,
  hasOrderItems,
  onClose,
  onAttach,
  onDetach,
}: {
  customers: DemoLoyaltyCustomer[];
  rewards: DemoLoyaltyReward[];
  products: PosProduct[];
  attachedCustomer: DemoLoyaltyCustomer | null;
  currentReward: DemoAppliedReward | null;
  hasOrderItems: boolean;
  onClose: () => void;
  onAttach: (customer: DemoLoyaltyCustomer, reward: DemoAppliedReward | null) => void;
  onDetach: () => void;
}) {
  type Mode = 'SEARCH' | 'SCAN_QR' | 'ENROLL' | 'FOUND' | 'FREE_ITEM';
  const [mode, setMode] = useState<Mode>(attachedCustomer ? 'FOUND' : 'SEARCH');
  const [enrollName, setEnrollName] = useState('');
  const [enrollPhone, setEnrollPhone] = useState('');
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState<DemoLoyaltyCustomer | null>(attachedCustomer);
  const [selectedReward, setSelectedReward] = useState<DemoAppliedReward | null>(currentReward);
  const [pendingFree, setPendingFree] = useState<DemoLoyaltyReward | null>(null);
  const [localCustomers, setLocalCustomers] = useState(customers);
  const [scanCode, setScanCode] = useState('');

  const pointsAfter = useMemo(() => {
    if (!customer) return 0;
    let pts = customer.points;
    if (selectedReward) {
      const same = currentReward && selectedReward.id === currentReward.id;
      if (!same) {
        if (currentReward) pts += currentReward.pointsCost;
        pts -= selectedReward.pointsCost;
      }
    } else if (currentReward) {
      pts += currentReward.pointsCost;
    }
    return Math.max(0, pts);
  }, [customer, selectedReward, currentReward]);

  const selectCustomer = (c: DemoLoyaltyCustomer) => {
    setCustomer(c);
    setSelectedReward(currentReward && attachedCustomer?.id === c.id ? currentReward : null);
    setError('');
    setMode('FOUND');
  };

  const handleSearch = () => {
    setError('');
    // One demo guest (pre-filled in the fields) — open their loyalty profile
    const guest = localCustomers[0];
    if (!guest) {
      setError('No loyalty guest available');
      return;
    }
    selectCustomer(guest);
  };

  const handleEnroll = () => {
    const name = enrollName.trim();
    if (!name) {
      setError('Name is required');
      return;
    }
    if (localCustomers.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError('A customer with this name already exists');
      return;
    }
    const created: DemoLoyaltyCustomer = {
      id: `new-${Date.now()}`,
      name,
      phone: enrollPhone.trim(),
      points: 0,
      tier: 'Member',
    };
    setLocalCustomers((list) => [created, ...list]);
    selectCustomer(created);
  };

  const handleSelectReward = (reward: DemoLoyaltyReward) => {
    if (!customer || customer.points < reward.pointsRequired) return;
    if (reward.type === 'DISCOUNT' && !hasOrderItems) {
      setError('Add items to the order before redeeming a % discount');
      return;
    }
    if (reward.type === 'FREE_ITEM') {
      setPendingFree(reward);
      setMode('FREE_ITEM');
      setError('');
      return;
    }
    setError('');
    setSelectedReward({
      id: reward.id,
      name: reward.name,
      type: 'PERCENTAGE',
      value: reward.discountPercentage ?? 0,
      pointsCost: reward.pointsRequired,
    });
  };

  const freeItems = useMemo(() => {
    if (!pendingFree?.freeCategoryId) return [];
    return products.filter((p) => p.categoryId === pendingFree.freeCategoryId);
  }, [pendingFree, products]);

  const tabs: { id: Mode; label: string; icon: typeof Search }[] = [
    { id: 'SEARCH', label: 'Search', icon: Search },
    { id: 'SCAN_QR', label: 'Scan QR', icon: Hash },
    { id: 'ENROLL', label: 'New Customer', icon: User },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/70 p-2 sm:p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[min(88%,500px)] w-[min(96%,380px)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-mintcom-surface"
      >
        {/* Green header — award + Loyalty Program */}
        <div className="relative shrink-0 bg-gradient-to-r from-[#7dc6a2] to-[#5aaf88] px-3 py-3 sm:px-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
              <Star size={18} className="text-[#7dc6a2]" fill="currentColor" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold text-white">Loyalty Program</p>
              <p className="text-[10px] font-medium text-white/85">Search, enroll, redeem rewards</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-white/90 hover:bg-white/15"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Tabs — hidden on FOUND / FREE_ITEM */}
            {mode !== 'FOUND' && mode !== 'FREE_ITEM' && (
              <div className="flex gap-1 px-2 pt-2">
                {tabs.map((t) => {
                  const on = mode === t.id;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setMode(t.id);
                        setError('');
                      }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-[12px] font-bold transition-colors ${
                        on
                          ? 'bg-mintcom-green/10 text-mintcom-green'
                          : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="hidden sm:inline">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {error && (
              <div className="mx-4 mt-3 rounded-xl bg-[#D55263]/10 px-3 py-2 text-[12px] font-semibold text-[#D55263]">
                {error}
              </div>
            )}

            {/* SEARCH — one demo guest pre-filled in the fields; Check Points opens them */}
            {mode === 'SEARCH' && (() => {
              const guest = localCustomers[0];
              return (
              <div className="space-y-4 p-5">
                <div>
                  <p className="mb-1.5 text-[13px] font-bold text-text-primary dark:text-white">
                    Customer Loyalty
                  </p>
                  <div className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 opacity-90 dark:border-white/10 dark:bg-mintcom-dark">
                    <User size={16} className="shrink-0 text-text-tertiary" />
                    <input
                      value={guest?.name ?? 'Emma Wilson'}
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                      className="pointer-events-none w-full cursor-not-allowed select-none bg-transparent py-3 text-sm font-semibold text-text-primary outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-text-tertiary">
                    Or
                  </span>
                  <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
                </div>

                <div>
                  <p className="mb-1.5 text-[13px] font-bold text-text-primary dark:text-white">
                    Customer Phone
                  </p>
                  <div className="flex cursor-not-allowed items-center gap-2 rounded-xl border border-gray-200 bg-gray-100 px-3 opacity-90 dark:border-white/10 dark:bg-mintcom-dark">
                    <Hash size={16} className="shrink-0 text-text-tertiary" />
                    <input
                      value={guest?.phone ?? '0790123456'}
                      readOnly
                      tabIndex={-1}
                      aria-readonly="true"
                      className="pointer-events-none w-full cursor-not-allowed select-none bg-transparent py-3 text-sm font-semibold text-text-primary outline-none dark:text-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSearch}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7dc6a2] to-[#5aaf88] py-3.5 text-sm font-bold text-white shadow-md shadow-mintcom-green/25"
                >
                  <Search size={18} />
                  Check Points
                </button>
              </div>
              );
            })()}

            {/* SCAN QR (demo: enter id/phone) */}
            {mode === 'SCAN_QR' && (
              <div className="space-y-4 p-5">
                <p className="text-[13px] font-bold text-text-primary dark:text-white">
                  Scan Google Wallet QR / Barcode
                </p>
                <div className="flex h-40 items-center justify-center rounded-xl bg-black">
                  <div className="text-center text-white/70">
                    <Hash size={36} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium">Camera preview (demo)</p>
                    <p className="mt-1 text-[10px] opacity-60">Enter customer phone or ID below</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 dark:border-white/10 dark:bg-mintcom-dark">
                  <Search size={16} className="text-text-tertiary" />
                  <input
                    value={scanCode}
                    onChange={(e) => setScanCode(e.target.value)}
                    placeholder="Point camera at QR code… or type phone"
                    className="w-full bg-transparent py-3 text-sm outline-none dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const code = scanCode.trim();
                    const found =
                      localCustomers.find((c) => c.phone.includes(code) || c.id === code) ||
                      localCustomers.find((c) => c.name.toLowerCase().includes(code.toLowerCase()));
                    if (!found) {
                      setError('Customer not found for scanned code.');
                      return;
                    }
                    selectCustomer(found);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7dc6a2] py-3 text-sm font-bold text-white"
                >
                  Lookup scan
                </button>
              </div>
            )}

            {/* ENROLL */}
            {mode === 'ENROLL' && (
              <div className="space-y-4 p-5">
                <div>
                  <p className="mb-1.5 text-[13px] font-bold text-text-primary dark:text-white">
                    Customer Name
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 dark:border-white/10 dark:bg-mintcom-dark">
                    <User size={16} className="text-text-tertiary" />
                    <input
                      value={enrollName}
                      onChange={(e) => {
                        setEnrollName(e.target.value);
                        setError('');
                      }}
                      placeholder="Full name"
                      className="w-full bg-transparent py-3 text-sm outline-none dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[13px] font-bold text-text-primary dark:text-white">
                    Customer Phone (optional)
                  </p>
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 dark:border-white/10 dark:bg-mintcom-dark">
                    <Hash size={16} className="text-text-tertiary" />
                    <input
                      value={enrollPhone}
                      onChange={(e) =>
                        setEnrollPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 15))
                      }
                      placeholder="Phone number"
                      inputMode="tel"
                      className="w-full bg-transparent py-3 text-sm outline-none dark:text-white"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleEnroll}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7dc6a2] to-[#5aaf88] py-3.5 text-sm font-bold text-white"
                >
                  <User size={18} />
                  Create Account
                </button>
              </div>
            )}

            {/* FOUND — points + rewards */}
            {mode === 'FOUND' && customer && (
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-mintcom-dark">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-text-primary dark:text-white">
                      {customer.name}
                    </p>
                    <p className="text-[12px] text-text-secondary">
                      {customer.phone || 'No phone added'}
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 rounded-xl bg-mintcom-green px-2 py-0.5 text-[10px] font-bold text-white">
                      <Star size={10} fill="currentColor" />
                      {customer.tier}
                    </span>
                  </div>
                  <div className="text-end">
                    {selectedReward && customer.points !== pointsAfter ? (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-sm text-text-secondary line-through">
                          {customer.points}
                        </span>
                        <span className="text-text-tertiary">→</span>
                        <span className="text-2xl font-black tabular-nums text-mintcom-green">
                          {pointsAfter}
                        </span>
                      </div>
                    ) : (
                      <p className="text-2xl font-black tabular-nums text-mintcom-green">
                        {customer.points}
                      </p>
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-tertiary">
                      PTS
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {}}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green py-3 text-[13px] font-bold text-white"
                >
                  <Hash size={18} />
                  Show Customer Pass QR Code
                </button>

                {selectedReward && (
                  <div className="flex items-center gap-2 rounded-xl border border-mintcom-green bg-mintcom-green/10 px-3 py-2.5">
                    <Check size={18} className="shrink-0 text-mintcom-green" strokeWidth={2.5} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-text-primary dark:text-white">
                        {selectedReward.name}
                      </p>
                      <p className="text-[11px] text-text-secondary">
                        −{selectedReward.pointsCost} pts
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReward(null)}
                      className="text-[#D55263]"
                      aria-label="Remove reward"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                <p className="text-sm font-bold text-text-primary dark:text-white">
                  Available Rewards
                </p>
                <div className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-white/10 dark:bg-mintcom-dark">
                  {rewards.map((reward) => {
                    const canRedeem = customer.points >= reward.pointsRequired;
                    const isSelected = selectedReward?.id === reward.id;
                    return (
                      <button
                        key={reward.id}
                        type="button"
                        disabled={!canRedeem || isSelected}
                        onClick={() => handleSelectReward(reward)}
                        className={`flex w-full items-center gap-3 rounded-xl border bg-white px-3 py-3 text-start transition-colors dark:bg-mintcom-surface ${
                          isSelected
                            ? 'border-mintcom-green'
                            : 'border-gray-200 dark:border-white/10'
                        } ${canRedeem ? '' : 'opacity-60'}`}
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                          {reward.type === 'FREE_ITEM' ? (
                            <ShoppingBag size={18} />
                          ) : (
                            <Percent size={18} />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-text-primary dark:text-white">
                            {reward.name}
                          </p>
                          <p className="text-[12px] font-semibold text-mintcom-green">
                            {reward.pointsRequired} pts
                          </p>
                        </div>
                        {isSelected ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mintcom-green text-white">
                            <Check size={12} strokeWidth={3} />
                          </span>
                        ) : canRedeem ? (
                          <span className="text-[12px] font-bold text-mintcom-green">Redeem</span>
                        ) : (
                          <Lock size={16} className="text-text-tertiary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FREE ITEM pick */}
            {mode === 'FREE_ITEM' && pendingFree && (
              <div className="space-y-3 p-5">
                <div className="text-center">
                  <ShoppingBag size={32} className="mx-auto text-mintcom-green" />
                  <p className="mt-2 text-base font-bold text-text-primary dark:text-white">
                    Select free item
                  </p>
                  <p className="text-[12px] text-text-secondary">{pendingFree.freeCategoryName}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {freeItems.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (!customer) return;
                        setSelectedReward({
                          id: pendingFree.id,
                          name: pendingFree.name,
                          type: 'FREE_ITEM',
                          value: 0,
                          pointsCost: pendingFree.pointsRequired,
                          freeItem: {
                            productId: p.id,
                            name: p.name,
                            imageDataUrl: p.imageDataUrl,
                            addons: [],
                          },
                        });
                        setMode('FOUND');
                        setPendingFree(null);
                      }}
                      className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-mintcom-dark"
                    >
                      <div className="mb-2 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white">
                        <img
                          src={productImgSrc(p.imageDataUrl)}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="line-clamp-2 text-center text-[12px] font-bold text-text-primary dark:text-white">
                        {p.name}
                      </p>
                    </button>
                  ))}
                </div>
                {freeItems.length === 0 && (
                  <p className="py-6 text-center text-sm text-text-secondary">
                    No items in this category
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMode('FOUND');
                    setPendingFree(null);
                  }}
                  className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-text-secondary dark:border-white/10"
                >
                  Back
                </button>
              </div>
            )}
          </div>

          {/* Sticky footer for FOUND */}
          {mode === 'FOUND' && customer && (
            <div className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white p-3 dark:border-white/10 dark:bg-mintcom-surface">
              <button
                type="button"
                title="Search another"
                onClick={() => {
                  setMode('SEARCH');
                  setCustomer(null);
                  setSelectedReward(null);
                  setError('');
                }}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-text-primary dark:bg-mintcom-dark dark:text-white"
              >
                <Search size={18} />
              </button>
              <button
                type="button"
                title="Remove customer"
                onClick={onDetach}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#D55263]/10 text-[#D55263]"
              >
                <Trash2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => onAttach(customer, selectedReward)}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-mintcom-green text-sm font-bold text-white"
              >
                Attach to Order
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Mirrors mintcom-pos HoldOrderModal 1:1
 * 3-step UX:
 * 1. 'choose' — Dine-In Table choice card (with free/held count) vs Custom Note choice card
 * 2. 'tables' — Responsive table grid with status indicators, back button, selection banner, and hold action
 * 3. 'custom' — Character-counted note input, guidance, tip card, selection banner, and hold action
 */
type HoldModalStep = 'choose' | 'tables' | 'custom';

function HoldOrderModal({
  usedLabels,
  tableCount = 12,
  itemCount,
  orderTotal,
  onCancel,
  onHold,
}: {
  usedLabels: string[];
  tableCount?: number;
  itemCount: number;
  orderTotal: number;
  onCancel: () => void;
  onHold: (label: string) => void;
}) {
  const [step, setStep] = useState<HoldModalStep>('choose');
  const [selectedTable, setSelectedTable] = useState('');
  const [nickname, setNickname] = useState('');

  const allTables = useMemo(() => {
    return Array.from({ length: tableCount }, (_, i) => {
      const name = `Table ${i + 1}`;
      const used = usedLabels.some((u) => u.toLowerCase() === name.toLowerCase());
      return { name, num: i + 1, used };
    });
  }, [tableCount, usedLabels]);

  const freeCount = allTables.filter((t) => !t.used).length;
  const busyCount = allTables.filter((t) => t.used).length;

  const isHoldEnabled = selectedTable !== '' || nickname.trim() !== '';
  const currentTargetName = selectedTable || (nickname.trim() ? `"${nickname.trim()}"` : '');

  const handleConfirmHold = () => {
    const finalLabel = selectedTable || nickname.trim();
    if (!finalLabel) return;
    onHold(finalLabel);
  };

  const getHeaderTitle = () => {
    switch (step) {
      case 'tables':
        return 'Dine-In Table';
      case 'custom':
        return 'Custom Note';
      default:
        return 'Hold Order';
    }
  };

  const getHeaderSubtitle = () => {
    switch (step) {
      case 'tables':
        return `Select a table · ${itemCount} items (${money(orderTotal)})`;
      case 'custom':
        return `e.g., John, counter pickup, etc. · ${itemCount} items`;
      default:
        return `Select a table or a custom note · ${itemCount} items (${money(orderTotal)})`;
    }
  };

  return (
    <div
      className="absolute inset-0 z-[80] flex items-center justify-center bg-black/60 p-2.5 sm:p-3 backdrop-blur-sm"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[min(90%,490px)] w-[min(94%,440px)] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-2.5 dark:border-white/10">
          {step !== 'choose' ? (
            <button
              type="button"
              onClick={() => {
                setSelectedTable('');
                setNickname('');
                setStep('choose');
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
              title="Back"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <span className="w-7" />
          )}

          <div className="flex-1 text-center">
            <h3 className="text-[15px] font-bold text-text-primary dark:text-white">
              {getHeaderTitle()}
            </h3>
            <p className="truncate text-[10.5px] text-text-secondary dark:text-mintcom-textSecondary">
              {getHeaderSubtitle()}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-3.5">
          <AnimatePresence mode="wait">
            {/* ─── Step 1: Choose Step ─── */}
            {step === 'choose' && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-1 flex-col justify-center gap-2.5"
              >
                {/* Tables Card */}
                <button
                  type="button"
                  onClick={() => setStep('tables')}
                  className="group flex flex-1 flex-col justify-center rounded-2xl border-2 border-gray-200 bg-gray-50/70 p-4 text-start transition-all hover:border-mintcom-green/50 hover:bg-white active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[15px] font-bold text-text-primary group-hover:text-mintcom-green dark:text-white">
                        Dine-In Table
                      </h4>
                      <p className="mt-0.5 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                        Select a table
                      </p>
                      <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
                        <span className="flex items-center gap-1.5 text-mintcom-green">
                          <span className="h-1.5 w-1.5 rounded-full bg-mintcom-green" />
                          {freeCount} free
                        </span>
                        {busyCount > 0 && (
                          <span className="flex items-center gap-1.5 text-[#D55263]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#D55263]" />
                            {busyCount} held
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-text-secondary transition-transform group-hover:translate-x-1 group-hover:text-mintcom-green" />
                  </div>
                </button>

                {/* Custom Note Card */}
                <button
                  type="button"
                  onClick={() => setStep('custom')}
                  className="group flex flex-1 flex-col justify-center rounded-2xl border-2 border-gray-200 bg-gray-50/70 p-4 text-start transition-all hover:border-mintcom-green/50 hover:bg-white active:scale-[0.99] dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-[15px] font-bold text-text-primary group-hover:text-mintcom-green dark:text-white">
                        Custom Note
                      </h4>
                      <p className="mt-0.5 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                        e.g., John, counter pickup, delivery, etc.
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-text-secondary transition-transform group-hover:translate-x-1 group-hover:text-mintcom-green" />
                  </div>
                </button>
              </motion.div>
            )}

            {/* ─── Step 2: Tables Grid Step ─── */}
            {step === 'tables' && (
              <motion.div
                key="tables"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-1 flex-col"
              >
                {/* Status info row */}
                <div className="mb-2.5 flex items-center gap-3 px-1 text-[11px] font-semibold">
                  <span className="flex items-center gap-1.5 text-mintcom-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-mintcom-green" />
                    {freeCount} free
                  </span>
                  {busyCount > 0 && (
                    <span className="flex items-center gap-1.5 text-[#D55263]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#D55263]" />
                      {busyCount} held
                    </span>
                  )}
                </div>

                {/* Table Grid */}
                <div className="grid flex-1 grid-cols-4 gap-2 overflow-y-auto p-1">
                  {allTables.map((t) => {
                    const isSelected = selectedTable === t.name;
                    return (
                      <button
                        key={t.name}
                        type="button"
                        disabled={t.used}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTable('');
                          } else {
                            setSelectedTable(t.name);
                            setNickname('');
                          }
                        }}
                        className={`flex aspect-square flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all ${
                          isSelected
                            ? 'border-2 border-mintcom-green bg-mintcom-green/15 text-mintcom-green shadow-sm'
                            : t.used
                              ? 'cursor-not-allowed border-red-200 bg-red-50 text-red-500 opacity-75 dark:border-red-900/40 dark:bg-red-950/25'
                              : 'border-gray-200 bg-white hover:border-mintcom-green/50 active:scale-95 dark:border-white/10 dark:bg-mintcom-dark'
                        }`}
                      >
                        <span className={`text-base font-black ${
                          isSelected
                            ? 'text-mintcom-green'
                            : t.used
                              ? 'text-red-500'
                              : 'text-text-primary dark:text-white'
                        }`}>
                          {t.num}
                        </span>
                        <span className={`text-[9.5px] font-bold ${
                          isSelected
                            ? 'text-mintcom-green'
                            : t.used
                              ? 'text-red-500'
                              : 'text-text-secondary dark:text-mintcom-textSecondary'
                        }`}>
                          {t.used ? 'Held' : isSelected ? 'Selected' : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: Custom Note Step ─── */}
            {step === 'custom' && (
              <motion.div
                key="custom"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="flex flex-1 flex-col space-y-3"
              >
                {/* Guidance row */}
                <div className="flex items-center gap-2 text-[11px] text-text-secondary dark:text-mintcom-textSecondary">
                  <Receipt size={13} className="text-mintcom-green shrink-0" />
                  <span>Enter a customer name or note to easily identify this held order.</span>
                </div>

                {/* Input section */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-text-primary dark:text-white">Customer Name / Note</span>
                    <span className="text-text-secondary">{nickname.length}/40</span>
                  </div>

                  <div className="relative">
                    <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 focus-within:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark">
                      <span className="flex h-10 w-10 items-center justify-center border-e border-gray-200 text-text-tertiary dark:border-white/10">
                        <Pencil size={14} />
                      </span>
                      <input
                        autoFocus
                        value={nickname}
                        onChange={(e) => {
                          const v = e.target.value.slice(0, 40);
                          setNickname(v);
                          if (v.trim()) setSelectedTable('');
                        }}
                        placeholder="e.g., John, counter pickup, delivery, etc."
                        maxLength={40}
                        className="h-10 flex-1 bg-transparent px-3 text-[13px] font-medium outline-none dark:text-white"
                      />
                      {nickname && (
                        <button
                          type="button"
                          onClick={() => setNickname('')}
                          className="flex h-10 w-9 items-center justify-center text-text-tertiary hover:text-text-primary"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tip Card */}
                <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 text-[11px] text-text-secondary dark:border-white/10 dark:bg-white/[0.03] dark:text-mintcom-textSecondary">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-mintcom-green" />
                  <span>Useful for takeaway orders, counter pickups, delivery, or phone orders.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky Selection Banner (steps 2 & 3 when something is picked) */}
        {step !== 'choose' && isHoldEnabled && (
          <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 px-3 py-2 dark:border-white/10 dark:bg-mintcom-dark/50">
            <div className="flex items-center justify-between rounded-xl border border-mintcom-green/30 bg-mintcom-green/10 px-2.5 py-1.5 text-[11px]">
              <div className="flex min-w-0 items-center gap-1.5">
                <CheckCircle2 size={14} className="shrink-0 text-mintcom-green" />
                <span className="truncate text-text-secondary dark:text-mintcom-textSecondary">
                  Holding order as:{' '}
                  <strong className="text-mintcom-green">{currentTargetName}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedTable('');
                  setNickname('');
                }}
                className="ms-2 rounded-lg p-0.5 text-text-tertiary hover:text-text-primary"
                title="Clear selection"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Modal Footer (steps 2 & 3) */}
        {step !== 'choose' && (
          <div className="flex shrink-0 gap-2 border-t border-gray-100 p-2.5 sm:p-3 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                setSelectedTable('');
                setNickname('');
                setStep('choose');
              }}
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3.5 text-[12px] font-bold text-text-secondary transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-mintcom-textSecondary dark:hover:bg-white/5"
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <button
              type="button"
              disabled={!isHoldEnabled}
              onClick={handleConfirmHold}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-mintcom-green text-[12.5px] font-bold text-white shadow-sm transition-colors hover:bg-mintcom-green/90 disabled:opacity-45"
            >
              <PauseCircle size={16} />
              <span>Hold Order</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/**
 * Sidebar toggle icon (mirrors mintcom-pos SidebarToggleIcon.tsx exactly)
 * - isMinimized=false: sidebar open -> arrow points right (>) towards sidebar to minimize it
 * - isMinimized=true: sidebar minimized -> arrow points left (<) out from sidebar to expand it
 */
function SidebarToggleIcon({
  isMinimized = false,
  size = 18,
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
}: {
  isMinimized?: boolean;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}) {
  const dividerX = 15;
  const arrowPath = !isMinimized ? 'M 8 9 L 11 12 L 8 15' : 'M 11 9 L 8 12 L 11 15';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="4" ry="4" />
      <line x1={dividerX} y1="3" x2={dividerX} y2="21" />
      <path d={arrowPath} />
    </svg>
  );
}

function PayTile({
  label,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-[75px] w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border-[1.5px] border-mintcom-green/45 bg-mintcom-green/[0.07] px-2.5 py-3 transition-all hover:bg-mintcom-green/14 active:scale-[0.98] disabled:opacity-35"
    >
      <span className="flex h-10 w-10 items-center justify-center text-mintcom-green">{icon}</span>
      <span className="text-[12.5px] font-semibold leading-none tracking-tight text-text-primary dark:text-white">
        {label}
      </span>
    </button>
  );
}

function orderTypeLabel(t: OrderType) {
  if (t === 'dine-in') return 'Dine in';
  if (t === 'takeaway') return 'Takeaway';
  return 'Delivery';
}

/** Free-text part of order note — type tags like [Takeaway] stay hidden in the cart UI. */
function freeTextOrderNote(note: string): string {
  return note.replace(/^\[(dine in|takeaway|delivery)\]\s*/i, '').trim();
}

/**
 * Mirrors mintcom-pos NoteModal.tsx exactly:
 * - Full-frame dimmed overlay (portaled into `.try-pos-root`)
 * - Centered card, X close, textarea + n/80 + Save
 * - Order notes: optional Takeaway / Delivery quick chips
 * - Item notes: title “Note for {name}”, no order-type chips
 */
function DemoNoteModal({
  open,
  title,
  value,
  onChange,
  onSave,
  onCancel,
  showOrderTypeActions = false,
  orderType = 'dine-in',
  onOrderTypeChange,
}: {
  open: boolean;
  title: string;
  value: string;
  onChange: (next: string) => void;
  onSave: () => void;
  onCancel: () => void;
  showOrderTypeActions?: boolean;
  orderType?: OrderType;
  onOrderTypeChange?: (t: OrderType) => void;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(
      (document.querySelector('.try-pos-root') as HTMLElement | null) ??
        document.body,
    );
  }, []);

  if (!open || !host) return null;

  return createPortal(
    <div
      className="absolute inset-0 z-[90] flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onClick={onCancel}
      role="presentation"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex w-[min(94%,500px)] max-h-[80%] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
      >
        <div className="flex min-h-[52px] shrink-0 items-center border-b border-gray-100 px-4 dark:border-white/8 sm:px-5">
          <span className="w-9 shrink-0" />
          <p className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold text-text-secondary sm:text-base">
            {title}
          </p>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-cream-100 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
          {showOrderTypeActions && onOrderTypeChange && (
            <div className="mb-4">
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-text-secondary dark:text-mintcom-textSecondary">
                Quick add to note
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { id: 'dine-in' as const, label: 'Dine-In', Icon: Utensils },
                    { id: 'takeaway' as const, label: 'Takeaway', Icon: ShoppingBag },
                    { id: 'delivery' as const, label: 'Delivery', Icon: Truck },
                  ] as const
                ).map((t) => {
                  const tag = `[${t.label}]`;
                  const on = orderType === t.id;
                  const Icon = t.Icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        const stripType = /^\[(dine in|takeaway|delivery)\]\s*/i;
                        const body = value.replace(stripType, '');
                        if (on) {
                          onOrderTypeChange('dine-in');
                          onChange(body.trimStart().slice(0, NOTE_LIMIT));
                          return;
                        }
                        onOrderTypeChange(t.id);
                        const next = body.trim()
                          ? `${tag} ${body.trim()}`
                          : `${tag} `;
                        onChange(next.slice(0, NOTE_LIMIT));
                      }}
                      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border-[1.5px] py-2.5 text-[12px] font-bold transition-colors ${
                        on
                          ? 'border-mintcom-green bg-mintcom-green/12 text-mintcom-green'
                          : 'border-gray-200 bg-white text-text-secondary hover:border-mintcom-green/30 dark:border-white/10 dark:bg-mintcom-dark dark:text-mintcom-textSecondary'
                      }`}
                    >
                      <Icon size={15} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <textarea
            value={value}
            onChange={(e) => {
              const v = e.target.value.slice(0, NOTE_LIMIT);
              onChange(v);
              if (showOrderTypeActions && onOrderTypeChange) {
                const tag = v
                  .match(/^\[(dine in|takeaway|delivery)\]/i)?.[1]
                  ?.toLowerCase();
                if (tag === 'takeaway') onOrderTypeChange('takeaway');
                else if (tag === 'delivery') onOrderTypeChange('delivery');
                else onOrderTypeChange('dine-in');
              }
            }}
            placeholder="e.g., Customer will pick up at 7:00 PM"
            rows={5}
            autoFocus
            maxLength={NOTE_LIMIT}
            className="min-h-[140px] w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-[15px] font-medium text-text-primary outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
          />
          <p className="mb-5 mt-1 text-end text-xs text-text-tertiary">
            {value.length}/{NOTE_LIMIT}
          </p>
          <button
            type="button"
            onClick={onSave}
            className="w-full rounded-xl bg-mintcom-green py-3.5 text-[15px] font-bold text-white shadow-md shadow-mintcom-green/25"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>,
    host,
  );
}

function payMethodLabel(m: PayMethod | null) {
  if (m === 'cash') return 'Cash';
  if (m === 'card') return 'Card';
  if (m === 'cliq') return 'CliQ';
  if (m === 'talabat') return 'Talabat';
  if (m === 'voucher') return 'Voucher';
  if (m === 'split') return 'Split';
  return '—';
}

/** Tax selection — mirrors mintcom-pos/src/components/TaxSelectionModal.tsx */
function TaxRateModal({
  open,
  currentRate,
  defaultRate,
  taxes,
  onClose,
  onSelect,
}: {
  open: boolean;
  currentRate: number;
  defaultRate: number;
  taxes?: DemoTaxRate[];
  onClose: () => void;
  onSelect: (rate: number, taxName?: string, taxId?: string) => void;
}) {
  const MAX_RATE_CENTS = 10000; // 100.00%
  const QUICK_PERCENTAGES = [0, 5, 10, 16];

  const configuredTaxes = useMemo(() => {
    if (taxes && taxes.length > 0) {
      return taxes.map((t) => {
        const r = Number(t.rate);
        const ratePercent = r <= 1 && r > 0 ? Number((r * 100).toFixed(2)) : r;
        return {
          id: t.id,
          name: t.name,
          rate: r,
          ratePercent,
          isDefault: Boolean(t.isDefault),
        };
      });
    }
    return [
      { id: 'tax-default', name: 'Sales Tax', rate: defaultRate / 100, ratePercent: defaultRate, isDefault: true },
      { id: 'tax-special', name: 'Special Tax', rate: 0.05, ratePercent: 5, isDefault: false },
      { id: 'tax-zero', name: 'Zero-Rated / Exempt', rate: 0, ratePercent: 0, isDefault: false },
    ];
  }, [taxes, defaultRate]);

  const [taxCents, setTaxCents] = useState(() =>
    Math.min(Math.round(currentRate * 100), MAX_RATE_CENTS),
  );
  const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);
  const [selectedTaxName, setSelectedTaxName] = useState<string | null>(null);

  const currentNumericPercent = taxCents / 100;
  const taxInput = currentNumericPercent.toFixed(2);
  const isTaxEmpty = taxCents === 0;
  const isAtDefault = Math.abs(currentNumericPercent - defaultRate) < 0.0001;

  useEffect(() => {
    if (open) {
      const initialCents = Math.min(Math.max(Math.round(currentRate * 100), 0), MAX_RATE_CENTS);
      setTaxCents(initialCents);
      const currPct = initialCents / 100;
      const match = configuredTaxes.find((ct) => Math.abs(ct.ratePercent - currPct) < 0.001);
      if (match) {
        setSelectedTaxId(match.id);
        setSelectedTaxName(match.name);
      } else {
        setSelectedTaxId(null);
        setSelectedTaxName(null);
      }
    }
  }, [open, currentRate, configuredTaxes]);

  // Synchronize matching preset selection whenever configured taxes or taxCents change
  useEffect(() => {
    if (configuredTaxes.length > 0) {
      const match = configuredTaxes.find(
        (ct) => Math.abs(ct.ratePercent - currentNumericPercent) < 0.001,
      );
      if (match) {
        setSelectedTaxId(match.id);
        setSelectedTaxName(match.name);
      } else {
        setSelectedTaxId(null);
        setSelectedTaxName(null);
      }
    }
  }, [configuredTaxes, currentNumericPercent]);

  if (!open) return null;

  const handleSelectPreset = (tax: { id: string; name: string; ratePercent: number }) => {
    const cents = Math.min(Math.max(Math.round(tax.ratePercent * 100), 0), MAX_RATE_CENTS);
    setTaxCents(cents);
    setSelectedTaxId(tax.id);
    setSelectedTaxName(tax.name);
  };

  const handleTaxTextChange = (text: string) => {
    const digitsOnly = text.replace(/\D/g, '');
    if (digitsOnly === '') {
      setTaxCents(0);
      setSelectedTaxId(null);
      setSelectedTaxName(null);
      return;
    }
    const significantDigits = digitsOnly.replace(/^0+(?=\d)/, '');
    const newCents = parseInt(significantDigits || '0', 10);
    if (newCents > MAX_RATE_CENTS) return;
    setTaxCents(newCents);
  };

  const handleQuickPercent = (pct: number) => {
    const cents = Math.min(Math.max(Math.round(pct * 100), 0), MAX_RATE_CENTS);
    setTaxCents(cents);
  };

  const handleResetToDefault = () => {
    const cents = Math.min(Math.max(Math.round(defaultRate * 100), 0), MAX_RATE_CENTS);
    setTaxCents(cents);
  };

  const handleApply = () => {
    const rate = Number((taxCents / 100).toFixed(2));
    onSelect(rate, selectedTaxName || undefined, selectedTaxId || undefined);
    onClose();
  };

  return (
    <div
      className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/8">
          <p className="text-base font-bold text-text-primary dark:text-white">
            Change Tax Rate
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-text-secondary hover:bg-cream-100 dark:hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Section 1: Choose from Configured Rates (mirrors POS presetsGrid) */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-mintcom-textSecondary">
              Choose from Configured Rates
            </p>
            <div className="space-y-2">
              {configuredTaxes.map((tax) => {
                const isSelected =
                  selectedTaxId === tax.id ||
                  (!selectedTaxId && Math.abs(tax.ratePercent - currentNumericPercent) < 0.001);

                return (
                  <button
                    key={tax.id}
                    type="button"
                    onClick={() => handleSelectPreset(tax)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-start transition-all ${
                      isSelected
                        ? 'border-mintcom-green bg-mintcom-green/[0.09] shadow-sm dark:bg-mintcom-green/15'
                        : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/60 dark:border-white/10 dark:bg-mintcom-dark'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`truncate text-sm font-bold ${
                          isSelected ? 'text-mintcom-green' : 'text-text-primary dark:text-white'
                        }`}
                      >
                        {tax.name}
                      </span>
                      {tax.isDefault && (
                        <span className="text-[11px] font-semibold text-text-tertiary">
                          (Default)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`rounded-lg px-2.5 py-1 text-xs font-black tabular-nums ${
                          isSelected
                            ? 'bg-mintcom-green text-white'
                            : 'bg-gray-200/80 text-text-secondary dark:bg-white/10 dark:text-gray-300'
                        }`}
                      >
                        {tax.ratePercent}%
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-mintcom-green text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Custom Tax Percentage (mirrors POS ATM card + quick chips) */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/8">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary dark:text-mintcom-textSecondary">
                Custom Tax Percentage (%)
              </p>
              {selectedTaxName && (
                <span className="inline-flex items-center rounded-md bg-mintcom-green/15 px-2 py-0.5 text-[11px] font-bold text-mintcom-green">
                  {selectedTaxName}
                </span>
              )}
            </div>

            {/* ATM-style Input */}
            <div className="flex overflow-hidden rounded-xl border border-gray-200 bg-gray-50/80 dark:border-white/10 dark:bg-mintcom-dark">
              <div className="flex items-center justify-center border-e border-gray-200 bg-mintcom-green/15 px-3.5 dark:border-white/10">
                <span className="text-base font-black text-mintcom-green">%</span>
              </div>
              <input
                inputMode="numeric"
                value={taxInput}
                onChange={(e) => handleTaxTextChange(e.target.value)}
                className={`w-full bg-transparent px-3 py-3 text-2xl font-black tabular-nums outline-none dark:text-white ${
                  isTaxEmpty ? 'text-text-tertiary' : 'text-text-primary'
                }`}
              />
            </div>

            {/* Quick Selection Buttons */}
            <div className="mt-2.5 grid grid-cols-4 gap-2">
              {QUICK_PERCENTAGES.map((pct) => {
                const isSelected = Math.abs(currentNumericPercent - pct) < 0.001;
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleQuickPercent(pct)}
                    className={`rounded-xl border py-2 text-xs font-extrabold transition-colors ${
                      isSelected
                        ? 'border-mintcom-green bg-mintcom-green/15 text-mintcom-green dark:bg-mintcom-green/25'
                        : 'border-gray-200 bg-white hover:bg-gray-50 text-text-primary dark:border-white/10 dark:bg-mintcom-surface dark:text-white'
                    }`}
                  >
                    {pct}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset to Default Button */}
          <button
            type="button"
            disabled={isAtDefault}
            onClick={handleResetToDefault}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-bold text-text-secondary transition-opacity disabled:opacity-40 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            <RotateCcw size={13} className={isAtDefault ? 'text-text-tertiary' : 'text-mintcom-green'} />
            <span>Reset to default ({defaultRate}%)</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 border-t border-gray-100 p-4 dark:border-white/8">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-text-secondary hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 rounded-xl bg-mintcom-green py-2.5 text-sm font-extrabold text-white shadow-sm hover:bg-mintcom-green/90"
          >
            Apply Tax
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/** Service charge override — mirrors mintcom-pos/src/components/ServiceChargeModal.tsx */
function ServiceChargeEditModal({
  open,
  amount,
  mode,
  defaultType,
  defaultValue,
  customType,
  customValue,
  chargeName = 'Service Charge',
  onClose,
  onApplyDefault,
  onRemove,
  onCustom,
}: {
  open: boolean;
  amount: number;
  mode: 'DEFAULT' | 'NONE' | 'CUSTOM';
  defaultType: 'PERCENTAGE' | 'FIXED';
  defaultValue: number;
  customType: 'PERCENTAGE' | 'FIXED';
  customValue: number;
  chargeName?: string;
  onClose: () => void;
  onApplyDefault: () => void;
  onRemove: () => void;
  onCustom: (type: 'PERCENTAGE' | 'FIXED', value: number) => void;
}) {
  const PERCENTAGE_PRESETS = [0, 5, 10, 12, 15, 20];
  const [cType, setCType] = useState<'PERCENTAGE' | 'FIXED'>(customType);
  const [cValue, setCValue] = useState(String(customValue));

  useEffect(() => {
    if (!open) return;
    if (mode === 'CUSTOM') {
      setCType(customType);
      setCValue(String(customValue));
    } else {
      setCType(defaultType);
      setCValue(String(defaultValue));
    }
  }, [open, mode, customType, customValue, defaultType, defaultValue]);

  if (!open) return null;

  const defaultSubtitle =
    defaultType === 'PERCENTAGE' ? `${defaultValue}%` : money(defaultValue);

  const handleTypeChange = (nextType: 'PERCENTAGE' | 'FIXED') => {
    setCType(nextType);
    const num = parseFloat(cValue) || 0;
    const norm = nextType === 'PERCENTAGE' ? Math.min(num, 100) : num;
    onCustom(nextType, norm);
  };

  const handleValueChange = (valText: string) => {
    const sanitized = valText.replace(/[^0-9.]/g, '');
    const firstDot = sanitized.indexOf('.');
    const nextValue =
      firstDot === -1
        ? sanitized
        : `${sanitized.slice(0, firstDot + 1)}${sanitized.slice(firstDot + 1).replace(/\./g, '')}`;
    setCValue(nextValue);
    const num = parseFloat(nextValue) || 0;
    const norm = cType === 'PERCENTAGE' ? Math.min(num, 100) : num;
    onCustom(cType, norm);
  };

  const handlePresetSelect = (preset: number) => {
    setCValue(String(preset));
    onCustom(cType, preset);
  };

  return (
    <div
      className="absolute inset-0 z-[110] flex items-center justify-center bg-black/60 p-3"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] max-h-[90vh] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
      >
        {/* Header (mirrors POS modalHeader) */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
              <UtensilsCrossed size={19} />
            </div>
            <div>
              <p className="text-base font-bold text-text-primary dark:text-white leading-tight">
                {chargeName}
              </p>
              <p className="text-xs text-text-secondary dark:text-mintcom-textSecondary">
                Fee Adjustment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums border ${
                amount > 0
                  ? 'border-mintcom-green/40 bg-mintcom-green/15 text-mintcom-green'
                  : 'border-gray-200 bg-gray-100 text-text-secondary dark:border-white/10 dark:bg-white/5 dark:text-gray-400'
              }`}
            >
              {amount > 0 ? `+ ${money(amount)}` : money(0)}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-1.5 text-text-secondary hover:bg-cream-100 dark:hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 3 Mode Option Cards (cardsRow) */}
          <div className="grid grid-cols-1 min-[380px]:grid-cols-3 gap-2">
            {/* 1. Default Option */}
            <button
              type="button"
              onClick={onApplyDefault}
              className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                mode === 'DEFAULT'
                  ? 'border-2 border-mintcom-green bg-mintcom-green/10 text-mintcom-green shadow-sm'
                  : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/60 text-text-primary dark:border-white/10 dark:bg-mintcom-dark dark:text-white'
              }`}
            >
              <span className="text-sm font-extrabold truncate w-full">
                {defaultSubtitle}
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-text-secondary dark:text-mintcom-textSecondary">
                Default
              </span>
            </button>

            {/* 2. No Charge Option */}
            <button
              type="button"
              onClick={onRemove}
              className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                mode === 'NONE'
                  ? 'border-2 border-mintcom-green bg-mintcom-green/10 text-mintcom-green shadow-sm'
                  : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/60 text-text-primary dark:border-white/10 dark:bg-mintcom-dark dark:text-white'
              }`}
            >
              <span className="text-sm font-extrabold truncate w-full">
                No Charge
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-text-secondary dark:text-mintcom-textSecondary">
                Waived
              </span>
            </button>

            {/* 3. Custom Option */}
            <button
              type="button"
              onClick={() => {
                const num = parseFloat(cValue) || 0;
                onCustom(cType, num);
              }}
              className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                mode === 'CUSTOM'
                  ? 'border-2 border-mintcom-green bg-mintcom-green/10 text-mintcom-green shadow-sm'
                  : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100/60 text-text-primary dark:border-white/10 dark:bg-mintcom-dark dark:text-white'
              }`}
            >
              <span className="text-sm font-extrabold truncate w-full">
                Custom
              </span>
              <span className="mt-0.5 text-[10px] font-semibold text-text-secondary dark:text-mintcom-textSecondary">
                Adjust
              </span>
            </button>
          </div>

          {/* Context details section */}
          {mode === 'DEFAULT' && (
            <div className="flex items-start gap-3 rounded-xl border border-mintcom-green/20 bg-mintcom-green/[0.08] p-3.5 dark:bg-mintcom-green/10">
              <Info size={17} className="mt-0.5 shrink-0 text-mintcom-green" />
              <div>
                <p className="text-xs font-bold text-text-primary dark:text-white">
                  Establishment Default Applied
                </p>
                <p className="mt-0.5 text-xs text-text-secondary dark:text-mintcom-textSecondary">
                  Using the store standard rate of {defaultSubtitle}.
                </p>
              </div>
            </div>
          )}

          {mode === 'NONE' && (
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 dark:border-white/10 dark:bg-white/5">
              <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-mintcom-green" />
              <div>
                <p className="text-xs font-bold text-text-primary dark:text-white">
                  Service Charge Waived
                </p>
                <p className="mt-0.5 text-xs text-text-secondary dark:text-mintcom-textSecondary">
                  No service charge will be added to this current order.
                </p>
              </div>
            </div>
          )}

          {mode === 'CUSTOM' && (
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-white/10 dark:bg-mintcom-dark space-y-3.5">
              {/* Type toggle */}
              <div className="flex rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-mintcom-surface">
                <button
                  type="button"
                  onClick={() => handleTypeChange('PERCENTAGE')}
                  className={`flex-1 rounded-lg py-2 text-xs font-extrabold transition-colors ${
                    cType === 'PERCENTAGE'
                      ? 'bg-mintcom-green text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary dark:text-mintcom-textSecondary dark:hover:text-white'
                  }`}
                >
                  % Percentage
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('FIXED')}
                  className={`flex-1 rounded-lg py-2 text-xs font-extrabold transition-colors ${
                    cType === 'FIXED'
                      ? 'bg-mintcom-green text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary dark:text-mintcom-textSecondary dark:hover:text-white'
                  }`}
                >
                  $ Fixed Amount
                </button>
              </div>

              {/* Value Input */}
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex h-11 w-11 items-center justify-center border-e border-gray-200 bg-mintcom-green/15 dark:border-white/10">
                  <span className="text-sm font-black text-mintcom-green">
                    {cType === 'PERCENTAGE' ? '%' : '$'}
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={cValue}
                  onChange={(e) => handleValueChange(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent px-3 py-2 text-lg font-bold tabular-nums outline-none dark:text-white"
                />
                {cValue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleValueChange('')}
                    className="p-2 text-text-tertiary hover:text-text-primary"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Quick Presets (when Percentage) */}
              {cType === 'PERCENTAGE' && (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                  {PERCENTAGE_PRESETS.map((preset) => {
                    const isPresetActive = Number(cValue) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={`min-h-[44px] rounded-lg border py-2 text-xs font-extrabold transition-colors ${
                          isPresetActive
                            ? 'border-mintcom-green bg-mintcom-green text-white shadow-sm'
                            : 'border-gray-200 bg-white text-text-primary hover:bg-gray-100/60 dark:border-white/10 dark:bg-mintcom-surface dark:text-white'
                        }`}
                      >
                        {preset}%
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 dark:border-white/8">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green py-3 text-sm font-extrabold text-white shadow-md transition-colors hover:bg-mintcom-green/90"
          >
            <Check size={18} strokeWidth={2.5} />
            <span>Done</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Payment checkout — identical shell to mintcom-pos PaymentPanel:
 * full-height side panel, receipt column left + cash/card/other pad right.
 * Method is fixed from the Cash/Card/Other tile that opened the panel (no tabs).
 */
function PaymentCheckoutPanel({
  cart,
  orderNo,
  orderNote = '',
  subtotal,
  discount,
  serviceChargeAmount = 0,
  serviceChargeName = 'Service Charge',
  tax,
  taxRate = 8,
  total,
  initialTab,
  onClose,
  onComplete,
  staffName = 'Cashier',
}: {
  cart: CartLine[];
  orderNo: number;
  orderType: OrderType;
  orderNote?: string;
  subtotal: number;
  discount: number;
  discountPct: number;
  serviceChargeAmount?: number;
  serviceChargeName?: string;
  tax: number;
  taxRate?: number;
  total: number;
  initialTab: CheckoutTab;
  onClose: () => void;
  onComplete: (
    method: PayMethod,
    methodLabel: string,
    amounts: { cash: number; card: number; other: number; change?: number; tendered?: number },
  ) => void;
  staffName?: string;
  businessName?: string;
}) {
  // Fixed method from opener (matches POS paymentMethod) — not a tab strip
  const tab = initialTab;
  // POS cash starts empty (0.00), not pre-filled with total
  const [tenderedCents, setTenderedCents] = useState(0);
  const [cardBrand, setCardBrand] = useState<'Visa' | 'Mastercard' | 'Amex'>('Visa');
  const [otherId, setOtherId] = useState<'cliq' | 'talabat' | 'voucher'>('cliq');
  const [printReceipt, setPrintReceipt] = useState(true);

  useEffect(() => {
    setTenderedCents(0);
  }, [initialTab]);

  const amountDue = total;
  const tendered = tenderedCents / 100;
  const change = Math.max(0, Math.round((tendered - amountDue) * 100) / 100);
  const remaining = Math.max(0, Math.round((amountDue - tendered) * 100) / 100);
  const short = tendered + 0.001 < amountDue;
  const canChargeCash = !short && tenderedCents > 0;

  const nowLabel = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const methodLabel =
    tab === 'cash'
      ? 'CASH'
      : tab === 'card'
        ? `CARD · ${cardBrand}`
        : otherId === 'cliq'
          ? 'CliQ'
          : otherId === 'talabat'
            ? 'Talabat'
            : 'Voucher';

  const confirmCash = () => {
    if (!canChargeCash) return;
    const changeDue = Math.max(0, Math.round((tendered - amountDue) * 100) / 100);
    onComplete('cash', 'Cash', {
      cash: amountDue,
      card: 0,
      other: 0,
      tendered,
      change: changeDue,
    });
  };
  const confirmCard = () => {
    onComplete('card', `Card · ${cardBrand}`, { cash: 0, card: amountDue, other: 0 });
  };
  const confirmOther = () => {
    const label = otherId === 'cliq' ? 'CliQ' : otherId === 'talabat' ? 'Talabat' : 'Voucher';
    onComplete(otherId, label, { cash: 0, card: 0, other: amountDue });
  };

  const appendDigit = (d: string) => {
    if (d === 'back') {
      setTenderedCents((c) => Math.floor(c / 10));
      return;
    }
    if (d === '00') {
      setTenderedCents((c) => Math.min(99999999, c * 100));
      return;
    }
    setTenderedCents((c) => Math.min(99999999, c * 10 + Number(d)));
  };

  const setExact = () => setTenderedCents(Math.round(amountDue * 100));
  const smartCashSuggestions = useMemo(
    () => getSmartQuickCashSuggestions(amountDue),
    [amountDue],
  );
  const diff = Math.round((tendered - amountDue) * 100) / 100;

  const receiptLines = (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-mintcom-surface">
      {/* Header — denser, matches POS receiptTitleCompact */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4 pb-2.5 dark:border-white/10 sm:px-5 sm:pt-7" style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}>
        <p className="text-[15px] font-semibold text-[#1F2937] dark:text-white">
          Payment Receipt
        </p>
        <div className="flex items-center gap-1.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[10px] border border-mintcom-green/30 bg-mintcom-green/15 text-mintcom-green">
            <Printer size={14} />
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={printReceipt}
            onClick={() => setPrintReceipt((v) => !v)}
            className={`relative h-5 w-9 rounded-full transition-colors ${
              printReceipt ? 'bg-mintcom-green' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                printReceipt ? 'start-4' : 'start-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="shrink-0 space-y-0.5 px-4 pt-3 sm:px-5">
        <p className="text-[11px] font-medium text-text-secondary">Order Number</p>
        <p className="text-[16px] font-extrabold leading-tight text-[#111827] dark:text-white">
          #{orderNo}
        </p>
        <p className="pt-0.5 text-[12px] leading-snug text-text-secondary">
          Payment Method: {methodLabel}
        </p>
        <p className="text-[12px] leading-snug text-text-secondary">
          Taken by: {staffName}
        </p>
        {orderNote.trim() ? (
          <p className="text-[12px] leading-snug text-text-secondary">
            Note: {orderNote.trim()}
          </p>
        ) : null}
        <p className="text-[12px] leading-snug text-text-secondary">Date: {nowLabel}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-0 overflow-y-auto px-4 py-2.5 sm:px-5">
        {cart.map((line) => (
          <div
            key={line.id}
            className="flex items-start justify-between gap-2 border-b border-gray-100 py-2 text-[13px] dark:border-white/8"
          >
            <span className="min-w-0 flex-1 font-medium leading-snug text-text-primary dark:text-white">
              {line.qty} {line.name}
              {line.addons.length > 0 && (
                <span className="mt-0.5 block text-[11px] text-text-tertiary">
                  {line.addons.map((a) => a.name).join(', ')}
                </span>
              )}
            </span>
            <span className="shrink-0 font-semibold tabular-nums text-text-primary dark:text-white">
              {(line.unitPrice * line.qty).toFixed(2)}{' '}
              <span className="text-[11px] font-medium text-text-secondary">USD</span>
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto shrink-0 space-y-1.5 border-t border-gray-100 px-4 py-3 text-[13px] dark:border-white/8 sm:px-5">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal</span>
          <span className="tabular-nums font-semibold text-text-primary dark:text-white">
            {subtotal.toFixed(2)}{' '}
            <span className="text-[11px] font-medium text-text-secondary">USD</span>
          </span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-text-secondary">
            <span>Discount</span>
            <span className="tabular-nums font-semibold text-[#D55263]">
              -{discount.toFixed(2)}{' '}
              <span className="text-[11px] font-medium text-text-secondary">USD</span>
            </span>
          </div>
        )}
        {serviceChargeAmount > 0 && (
          <div className="flex justify-between text-text-secondary">
            <span>{serviceChargeName || 'Service Charge'}</span>
            <span className="tabular-nums font-semibold text-text-primary dark:text-white">
              {serviceChargeAmount.toFixed(2)}{' '}
              <span className="text-[11px] font-medium text-text-secondary">USD</span>
            </span>
          </div>
        )}
        {/* Tax group (matching POS PaymentPanel) */}
        <div className="flex justify-between text-text-secondary">
          <span>{taxRate === 0 ? 'No Tax' : `Tax (${taxRate}%)`}</span>
          <span className="tabular-nums font-semibold text-text-primary dark:text-white">
            {tax.toFixed(2)}{' '}
            <span className="text-[11px] font-medium text-text-secondary">USD</span>
          </span>
        </div>
        {tab === 'cash' && (
          <div className="flex justify-between text-text-secondary">
            <span>Change</span>
            <span className="tabular-nums font-semibold text-text-primary dark:text-white">
              {change.toFixed(2)}{' '}
              <span className="text-[11px] font-medium text-text-secondary">USD</span>
            </span>
          </div>
        )}
        <div className="flex justify-between pt-0.5 text-[17px] font-extrabold text-[#111827] dark:text-white">
          <span>Total</span>
          <span className="tabular-nums">
            {amountDue.toFixed(2)}{' '}
            <span className="text-[12px] font-bold text-text-secondary">USD</span>
          </span>
        </div>
      </div>
    </div>
  );

  /** Numpad rows — POS CashPaymentNumpad: each row flex:1, each key flex:1 → equal heights */
  const numpadRows: Array<Array<'1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '00' | '0' | 'back'>> =
    [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['00', '0', 'back'],
    ];

  const cashPad = (
    /* Narrow cash column — keys stay equal, not stretched edge-to-edge */
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[300px] flex-1 flex-col sm:max-w-[320px]">
      {/* Received amount — POS CashPaymentNumpad amount card */}
      <div className="mb-2 shrink-0 rounded-xl border border-[#E8EEE9] bg-gradient-to-b from-[#F7FAF7] to-[#F3F7F4] px-3 py-2 dark:border-white/10 dark:from-mintcom-dark dark:to-mintcom-dark">
        <p className="text-center text-[11px] font-medium tracking-wide text-text-secondary">
          Received Amount
        </p>
        <div className="mt-1 flex items-baseline justify-center gap-1.5">
          <p
            className={`text-[28px] font-extrabold leading-none tabular-nums tracking-tight ${
              tenderedCents === 0 ? 'text-[#C4CDD5]' : 'text-[#111827] dark:text-white'
            }`}
          >
            {tendered.toFixed(2)}
          </p>
          <span className="text-[12px] font-bold text-text-secondary">USD</span>
        </div>
        <div className="mx-auto mt-2 h-1 max-w-[200px] overflow-hidden rounded-full bg-[#E3EDE6] dark:bg-white/10">
          <div
            className="h-full rounded-full bg-mintcom-green transition-all duration-200"
            style={{
              width: `${Math.min(100, amountDue > 0 ? (tendered / amountDue) * 100 : 0)}%`,
            }}
          />
        </div>
        <div className="mt-2 flex justify-center">
          {tendered === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mintcom-green/15 px-2.5 py-1 text-[11px] font-bold text-mintcom-green">
              Amount Due {amountDue.toFixed(2)} USD
            </span>
          ) : diff === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mintcom-green/15 px-2.5 py-1 text-[11px] font-bold text-mintcom-green">
              Exact Amount
            </span>
          ) : diff > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-mintcom-green/15 px-2.5 py-1 text-[11px] font-bold text-mintcom-green">
              Change: {diff.toFixed(2)} USD
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              Short by: {Math.abs(diff).toFixed(2)} USD
            </span>
          )}
        </div>
      </div>

      {/* Exact + dynamic smart cash suggestions strictly >= total (mirrors POS getSmartQuickCashSuggestions) */}
      <div className="mb-2 flex shrink-0 gap-1.5">
        {[
          { label: 'Exact', onClick: setExact },
          ...smartCashSuggestions.map((val) => ({
            label: `${val}`,
            onClick: () => setTenderedCents(Math.round(val * 100)),
          })),
        ].map((b) => (
          <button
            key={b.label}
            type="button"
            onClick={b.onClick}
            className="h-11 min-h-[44px] max-h-[44px] flex-1 rounded-xl border border-gray-200 bg-white px-1 text-[12px] font-bold text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors active:border-mintcom-green active:bg-mintcom-green/10 dark:border-white/10 dark:bg-mintcom-dark dark:text-white truncate"
          >
            {b.label}
          </button>
        ))}
      </div>

      {/*
        Numpad: equal rows/keys, constrained width so keys are not over-wide.
      */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5">
        {numpadRows.map((row) => (
          <div key={row.join('-')} className="flex min-h-[48px] flex-1 gap-1.5">
            {row.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => appendDigit(k)}
                className={`flex h-full min-h-0 flex-1 items-center justify-center rounded-xl border-[1.5px] text-[18px] font-bold tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-transform active:scale-[0.98] ${
                  k === 'back'
                    ? 'border-[#E5E7EB] bg-[#F3F4F6] text-[#374151] dark:border-white/10 dark:bg-white/10 dark:text-white'
                    : 'border-[#E8E8E8] bg-white text-[#111827] active:border-mintcom-green active:bg-mintcom-green/12 dark:border-white/10 dark:bg-mintcom-dark dark:text-white'
                }`}
              >
                {k === 'back' ? '⌫' : k}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Cancel + Charge / Remaining — same height for both */}
      <div className="mt-2 flex h-11 shrink-0 items-stretch gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="flex h-full w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#F0C4C9] text-[#D55263] transition-colors active:bg-[#D55263]/8"
          aria-label="Cancel"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          disabled={!canChargeCash}
          onClick={confirmCash}
          className={`flex h-full min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-2 text-[12px] font-extrabold transition-opacity truncate ${
            canChargeCash
              ? 'bg-mintcom-green text-white shadow-md shadow-mintcom-green/25 active:opacity-90'
              : 'bg-[#EEF2F0] text-[#6B7280]'
          }`}
        >
          {canChargeCash
            ? `Charge ${amountDue.toFixed(2)} USD`
            : `${remaining.toFixed(2)} USD Remaining`}
        </button>
      </div>
    </div>
  );

  const cardPad = (
    <div className="flex h-full min-h-0 flex-col pt-1">
      <p className="mb-3 shrink-0 text-center text-[14px] font-bold text-text-primary dark:text-white">
        Select Card Type
      </p>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {(
          [
            { id: 'Visa' as const, label: 'Visa' },
            { id: 'Mastercard' as const, label: 'Mastercard' },
            { id: 'Amex' as const, label: 'American Express' },
          ] as const
        ).map((b) => {
          const selected = cardBrand === b.id;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setCardBrand(b.id)}
              className={`flex w-full shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-colors ${
                selected
                  ? 'border-mintcom-green bg-mintcom-green/10'
                  : 'border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-dark'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  selected
                    ? 'bg-mintcom-green/15 text-mintcom-green'
                    : 'bg-cream-100 text-text-secondary dark:bg-white/5'
                }`}
              >
                <PosCardIcon size={18} />
              </span>
              <span
                className={`min-w-0 flex-1 text-[14px] font-semibold ${
                  selected ? 'text-mintcom-green' : 'text-text-primary dark:text-white'
                }`}
              >
                {b.label}
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected
                    ? 'border-mintcom-green bg-mintcom-green'
                    : 'border-gray-300 bg-white dark:border-white/25 dark:bg-transparent'
                }`}
              >
                {selected && <Check size={12} className="text-white" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex shrink-0 items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#F0C4C9] text-[#D55263]"
        >
          <X size={20} />
        </button>
        <button
          type="button"
          onClick={confirmCard}
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-mintcom-green text-[14px] font-extrabold text-white shadow-md shadow-mintcom-green/25"
        >
          Charge {amountDue.toFixed(2)} USD
        </button>
      </div>
    </div>
  );

  const otherPad = (
    <div className="flex h-full min-h-0 flex-col pt-1">
      <p className="mb-3 shrink-0 text-center text-[14px] font-bold text-text-primary dark:text-white">
        Select Other Payment
      </p>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {(
          [
            { id: 'cliq' as const, label: 'CliQ' },
            { id: 'talabat' as const, label: 'Talabat' },
            { id: 'voucher' as const, label: 'Voucher' },
          ] as const
        ).map((m) => {
          const selected = otherId === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setOtherId(m.id)}
              className={`flex w-full shrink-0 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start transition-colors ${
                selected
                  ? 'border-mintcom-green bg-mintcom-green/10'
                  : 'border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-dark'
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  selected
                    ? 'bg-mintcom-green/15 text-mintcom-green'
                    : 'bg-cream-100 text-text-secondary dark:bg-white/5'
                }`}
              >
                <PosOtherReceiptIcon size={18} />
              </span>
              <span
                className={`min-w-0 flex-1 text-[14px] font-semibold ${
                  selected ? 'text-mintcom-green' : 'text-text-primary dark:text-white'
                }`}
              >
                {m.label}
              </span>
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  selected
                    ? 'border-mintcom-green bg-mintcom-green'
                    : 'border-gray-300 bg-white dark:border-white/25 dark:bg-transparent'
                }`}
              >
                {selected && <Check size={12} className="text-white" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-auto flex shrink-0 items-center gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#F0C4C9] text-[#D55263]"
        >
          <X size={20} />
        </button>
        <button
          type="button"
          onClick={confirmOther}
          className="flex h-11 flex-1 items-center justify-center rounded-xl bg-mintcom-green text-[14px] font-extrabold text-white shadow-md shadow-mintcom-green/25"
        >
          Charge {amountDue.toFixed(2)} USD
        </button>
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-[75] flex justify-end">
      {/* Backdrop — tap to close (POS overlay) */}
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-label="Close payment"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Side panel — narrower overall shell */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 flex h-full w-full max-w-[min(100%,680px)] flex-col overflow-hidden rounded-s-2xl border-s border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface sm:flex-row lg:max-w-[min(100%,720px)]"
      >
        {/* LEFT — Payment Receipt */}
        <div className="flex max-h-[40%] min-h-0 w-full shrink-0 flex-col border-b border-gray-100 dark:border-white/10 sm:max-h-none sm:w-[44%] sm:border-b-0 sm:border-e">
          {receiptLines}
        </div>

        {/* RIGHT — method pad (cash keys max ~320px wide, centered) */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center bg-[#FAFBFA] px-3 py-3 dark:bg-mintcom-dark/30 sm:w-[56%] sm:px-4 sm:py-4">
          {tab === 'cash' && cashPad}
          {tab === 'card' && <div className="flex h-full w-full max-w-[340px] flex-col">{cardPad}</div>}
          {tab === 'other' && <div className="flex h-full w-full max-w-[340px] flex-col">{otherPad}</div>}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Split payment — side drawer from the right (mintcom-pos SplitPaymentModal).
 * Setup menu is narrower; amount/item/pay flows use a wider drawer like POS.
 */
function SplitPaymentDemoModal({
  cart,
  orderNo = 1,
  subtotal,
  discount = 0,
  serviceChargeAmount = 0,
  serviceChargeName = 'Service Charge',
  tax = 0,
  taxRate = 16,
  total,
  onClose,
  onComplete,
}: {
  cart: CartLine[];
  orderNo?: number;
  subtotal?: number;
  discount?: number;
  serviceChargeAmount?: number;
  serviceChargeName?: string;
  tax?: number;
  taxRate?: number;
  total: number;
  onClose: () => void;
  onComplete: (
    method: PayMethod,
    methodLabel: string,
    amounts: { cash: number; card: number; other: number },
  ) => void;
}) {
  type SplitMode = null | 'amount' | 'item' | 'pay';
  const [splitMode, setSplitMode] = useState<SplitMode>(null);
  const [splitPayments, setSplitPayments] = useState<
    Array<{ amount: number; method: 'cash' | 'card' }>
  >([]);
  const [splitAmountCents, setSplitAmountCents] = useState(0);
  const [numPeople, setNumPeople] = useState(2);
  const [selectedForPayment, setSelectedForPayment] = useState<Record<string, number>>({});
  const [payStep, setPayStep] = useState(0);
  /** Per-share cash tender (POS SplitPaymentProcessModal ATM input) */
  const [payTenderedCents, setPayTenderedCents] = useState(0);
  const [payCardBrand, setPayCardBrand] = useState<'Visa' | 'Mastercard' | 'Amex'>('Visa');

  const EQUAL_SPLIT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12] as const;
  const PERSON_PALETTE = [
    '#7dc6a2',
    '#4A90D9',
    '#D0C962',
    '#E07A5F',
    '#9B6FD9',
    '#5FC4C0',
    '#F2A65A',
    '#BA6CB1',
  ];

  const splitAllocated = splitPayments.reduce((s, p) => s + p.amount, 0);
  const splitRemaining = Math.round((total - splitAllocated) * 100) / 100;
  const splitComplete = Math.abs(splitRemaining) < 0.005 && splitPayments.length > 0;
  const splitAmount = splitAmountCents / 100;
  const canAddSplitAmount = splitAmount > 0 && splitAmount <= splitRemaining + 0.001;

  const cartBaseSubtotal = cart.reduce((s, l) => s + l.unitPrice * l.qty, 0);
  const itemTotalMultiplier = cartBaseSubtotal > 0 ? total / cartBaseSubtotal : 1;
  const itemSelectedBase = Object.entries(selectedForPayment).reduce((sum, [id, qty]) => {
    const line = cart.find((l) => l.id === id);
    return line ? sum + line.unitPrice * qty : sum;
  }, 0);
  const itemSelectedTotal = Math.round(itemSelectedBase * itemTotalMultiplier * 100) / 100;
  const itemRemainingTotal = Math.round(Math.max(0, total - itemSelectedTotal) * 100) / 100;
  const itemSelectedCount = Object.values(selectedForPayment).reduce((s, q) => s + (q || 0), 0);
  const itemPendingCount = cart.reduce(
    (s, l) => s + Math.max(0, l.qty - (selectedForPayment[l.id] || 0)),
    0,
  );
  const hasItemSelection = itemSelectedCount > 0;

  const mode: 'menu' | 'amount' | 'item' | 'pay' =
    splitMode === null ? 'menu' : splitMode;
  const remForHero =
    mode === 'item'
      ? itemRemainingTotal
      : mode === 'amount' || mode === 'pay'
        ? splitRemaining
        : total;
  const allocated = Math.max(0, total - (mode === 'menu' ? total : remForHero));
  const fraction =
    mode === 'menu' || total <= 0 ? 0 : Math.min(1, Math.max(0, allocated / total));

  const goPayStep = (next: number) => {
    setPayStep(next);
    setPayTenderedCents(0);
    setPayCardBrand('Visa');
  };

  const enterPayMode = (parts: Array<{ amount: number; method: 'cash' | 'card' }>) => {
    setSplitPayments(parts);
    setSplitMode('pay');
    setPayStep(0);
    setPayTenderedCents(0);
    setPayCardBrand('Visa');
  };

  // ── POS SplitPaymentProcessModal: receipt left + cash/card pad right ──
  if (splitMode === 'pay' && splitPayments[payStep]) {
    const share = splitPayments[payStep];
    const shareAmount = share.amount;
    const isCash = share.method === 'cash';
    const tendered = payTenderedCents / 100;
    const change = Math.max(0, Math.round((tendered - shareAmount) * 100) / 100);
    const short = tendered + 0.001 < shareAmount;
    const canChargeCash = isCash && !short && payTenderedCents > 0;
    const canChargeCard = !isCash; // demo: card always ready once selected
    const canProcess = isCash ? canChargeCash : canChargeCard;
    const isLastShare = payStep >= splitPayments.length - 1;
    const methodLabel = isCash
      ? 'Cash'
      : `Card · ${payCardBrand}`;
    const nowLabel = new Date().toLocaleString(undefined, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const shareRatio = total > 0 ? shareAmount / total : 1 / splitPayments.length;
    const cartItemsTotal = cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
    const effectiveSubtotal = subtotal !== undefined ? subtotal : cartItemsTotal;
    const shareSubtotal = Math.round(effectiveSubtotal * shareRatio * 100) / 100;
    const shareDiscount = Math.round(discount * shareRatio * 100) / 100;
    const shareServiceCharge = Math.round(serviceChargeAmount * shareRatio * 100) / 100;
    const shareTax = Math.round(tax * shareRatio * 100) / 100;
    const taxRowLabel = taxRate === 0 ? 'No Tax' : `Tax (${taxRate}%)`;

    const advanceOrComplete = () => {
      if (!canProcess) return;
      if (!isLastShare) {
        goPayStep(payStep + 1);
        return;
      }
      const amounts = { cash: 0, card: 0, other: 0 };
      splitPayments.forEach((p) => {
        if (p.method === 'card') amounts.card += p.amount;
        else amounts.cash += p.amount;
      });
      onComplete('split', `Split (${splitPayments.length} shares)`, amounts);
    };

    return (
      <div className="absolute inset-0 z-[75] flex justify-end">
        <motion.button
          type="button"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          aria-label="Close split payment"
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 flex h-full w-full max-w-[min(100%,720px)] flex-col overflow-hidden rounded-s-2xl border-s border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface sm:flex-row lg:max-w-[min(100%,760px)]"
        >
          {/* LEFT — split receipt (POS process modal) */}
          <div className="flex max-h-[40%] min-h-0 w-full shrink-0 flex-col border-b border-gray-100 bg-[#FAFBFA] dark:border-white/8 dark:bg-mintcom-dark/40 sm:max-h-none sm:w-[42%] sm:border-b-0 sm:border-e">
            <div className="px-3.5 pt-5 pb-1 sm:pt-6">
              <p className="text-[14px] font-extrabold text-text-primary dark:text-white">
                Split Payment
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-mintcom-green">
                Share {payStep + 1} of {splitPayments.length}
              </p>
              <p className="mt-1 text-[11px] font-bold text-text-secondary">
                Order #{orderNo}
              </p>
              <p className="mt-0.5 text-[11px] text-text-secondary">
                Payment Method:{' '}
                <span className="font-bold text-text-primary dark:text-white">
                  {methodLabel}
                </span>
              </p>
              <p className="text-[11px] text-text-secondary">Date: {nowLabel}</p>
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3.5 py-1.5">
              {cart.map((line) => (
                <div
                  key={line.id}
                  className="flex items-start justify-between gap-2 border-b border-gray-100 py-1.5 text-[12px] dark:border-white/8"
                >
                  <span className="min-w-0 flex-1 font-medium text-text-primary dark:text-white">
                    {line.qty} {line.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums dark:text-white">
                    {(line.unitPrice * line.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            {/* Fiscal summary — mirrors POS SplitPaymentProcessModal summaryRowCompact with taxRowLabel */}
            <div className="shrink-0 space-y-1.5 border-t border-gray-100 px-3.5 py-2.5 text-[12px] dark:border-white/8">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-text-primary dark:text-white">
                  {shareSubtotal.toFixed(2)} USD
                </span>
              </div>
              {shareDiscount > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>Discount</span>
                  <span className="tabular-nums font-semibold text-[#D55263]">
                    -{shareDiscount.toFixed(2)} USD
                  </span>
                </div>
              )}
              {shareServiceCharge > 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>{serviceChargeName || 'Service Charge'}</span>
                  <span className="tabular-nums font-semibold text-text-primary dark:text-white">
                    {shareServiceCharge.toFixed(2)} USD
                  </span>
                </div>
              )}
              {/* Tax Group */}
              <div className="flex justify-between text-text-secondary">
                <span>{taxRowLabel}</span>
                <span className="tabular-nums font-semibold text-text-primary dark:text-white">
                  {shareTax.toFixed(2)} USD
                </span>
              </div>
              {isCash && (
                <div className="flex justify-between text-text-secondary">
                  <span>Change</span>
                  <span
                    className={`tabular-nums font-semibold ${
                      change > 0 ? 'font-bold text-mintcom-green' : 'text-text-primary dark:text-white'
                    }`}
                  >
                    {change.toFixed(2)} USD
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-1.5 text-[15px] font-extrabold text-text-primary dark:border-white/8 dark:text-white">
                <span>Total</span>
                <span className="tabular-nums text-mintcom-green font-extrabold">
                  {shareAmount.toFixed(2)} USD
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — method + numpad / card (POS process modal) */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white dark:bg-mintcom-surface">
            <div className="flex shrink-0 items-center gap-2 px-3 pt-4 pb-1 sm:pt-5">
              <button
                type="button"
                onClick={() => {
                  if (payStep > 0) goPayStep(payStep - 1);
                  else {
                    setSplitMode(null);
                    setPayTenderedCents(0);
                  }
                }}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-text-primary hover:bg-cream-100 dark:text-white dark:hover:bg-white/10"
                aria-label="Back"
              >
                <ArrowLeft size={18} />
              </button>
              <p className="text-[12px] font-bold text-text-secondary">
                Paying share {payStep + 1}/{splitPayments.length}
              </p>
            </div>

            {/* Cash / Card method cards — same icons as Sales payment tiles */}
            <div className="flex shrink-0 gap-2 px-3 pb-2">
              {(
                [
                  {
                    id: 'cash' as const,
                    label: 'Cash',
                    icon: (cls: string) => <PosCashIcon size={18} className={cls} />,
                  },
                  {
                    id: 'card' as const,
                    label: 'Card',
                    icon: (cls: string) => <PosCardIcon size={18} className={cls} />,
                  },
                ] as const
              ).map((m) => {
                const active = share.method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setSplitPayments((list) =>
                        list.map((p, i) =>
                          i === payStep ? { ...p, method: m.id } : p,
                        ),
                      );
                      setPayTenderedCents(0);
                    }}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-2.5 py-2.5 text-start ${
                      active
                        ? 'border-mintcom-green bg-gradient-to-br from-mintcom-green to-[#3d9a6e] text-white shadow-md shadow-mintcom-green/20'
                        : 'border-gray-200 bg-white text-text-secondary dark:border-white/10 dark:bg-mintcom-dark'
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                        active ? 'bg-white/20 text-white' : 'bg-cream-100 text-mintcom-green dark:bg-white/5'
                      }`}
                    >
                      {m.icon(active ? 'text-white' : 'text-mintcom-green')}
                    </span>
                    <span
                      className={`flex-1 text-[13px] font-extrabold ${
                        active ? 'text-white' : 'dark:text-white/70'
                      }`}
                    >
                      {m.label}
                    </span>
                    {active && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white">
                        <Check size={11} className="text-mintcom-green" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
              {isCash ? (
                <div className="flex h-full min-h-0 flex-col gap-2">
                  <div className="rounded-xl border border-[#E5EFE8] bg-[#F8FAF7] px-3 py-2.5 dark:border-white/10 dark:bg-mintcom-dark">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-text-secondary">
                        Received Amount
                      </p>
                      {payTenderedCents > 0 && (
                        <button
                          type="button"
                          onClick={() => setPayTenderedCents(0)}
                          className="text-[11px] font-bold text-[#D55263]"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="mt-1 flex items-end justify-between gap-2">
                      <p
                        className={`text-[30px] font-black leading-none tabular-nums ${
                          payTenderedCents === 0
                            ? 'text-[#C4CDD5]'
                            : 'text-text-primary dark:text-white'
                        }`}
                      >
                        {tendered.toFixed(2)}
                      </p>
                      <span className="pb-1 text-[12px] font-bold text-text-secondary">
                        USD
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E5EFE8] dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-mintcom-green transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            shareAmount > 0 ? (tendered / shareAmount) * 100 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="mt-2">
                      <span className="inline-flex rounded-full bg-mintcom-green/15 px-2.5 py-1 text-[11px] font-bold text-mintcom-green">
                        Amount Due {shareAmount.toFixed(2)} USD
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      {
                        label: 'Exact',
                        onClick: () =>
                          setPayTenderedCents(Math.round(shareAmount * 100)),
                      },
                      { label: '10', onClick: () => setPayTenderedCents(1000) },
                      { label: '20', onClick: () => setPayTenderedCents(2000) },
                      { label: '50', onClick: () => setPayTenderedCents(5000) },
                    ].map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        onClick={b.onClick}
                        className="rounded-xl border border-gray-200 bg-white py-2 text-[12px] font-bold dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid min-h-0 flex-1 grid-cols-3 grid-rows-4 gap-1.5">
                    {(
                      [
                        '1',
                        '2',
                        '3',
                        '4',
                        '5',
                        '6',
                        '7',
                        '8',
                        '9',
                        '00',
                        '0',
                        'back',
                      ] as const
                    ).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          if (k === 'back') {
                            setPayTenderedCents((c) => Math.floor(c / 10));
                            return;
                          }
                          if (k === '00') {
                            setPayTenderedCents((c) => Math.min(99999999, c * 100));
                            return;
                          }
                          setPayTenderedCents((c) =>
                            Math.min(99999999, c * 10 + Number(k)),
                          );
                        }}
                        className="flex min-h-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-[17px] font-bold hover:bg-mintcom-green hover:text-white dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                      >
                        {k === 'back' ? '⌫' : k}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-text-secondary">
                    To pay by card
                  </p>
                  <div className="rounded-xl bg-mintcom-green/10 px-3 py-3">
                    <p className="text-[28px] font-black tabular-nums text-mintcom-green">
                      {shareAmount.toFixed(2)}{' '}
                      <span className="text-sm font-bold">USD</span>
                    </p>
                  </div>
                  <p className="text-center text-[12px] font-bold text-text-primary dark:text-white">
                    Select Card Type
                  </p>
                  <div className="space-y-2">
                    {(
                      [
                        { id: 'Visa' as const, label: 'Visa' },
                        { id: 'Mastercard' as const, label: 'Mastercard' },
                        { id: 'Amex' as const, label: 'American Express' },
                      ] as const
                    ).map((b) => {
                      const selected = payCardBrand === b.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setPayCardBrand(b.id)}
                          className={`flex w-full shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-start ${
                            selected
                              ? 'border-mintcom-green bg-mintcom-green/10'
                              : 'border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-dark'
                          }`}
                        >
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              selected
                                ? 'bg-mintcom-green/15 text-mintcom-green'
                                : 'bg-cream-100 text-text-secondary dark:bg-white/5'
                            }`}
                          >
                            <PosCardIcon size={18} />
                          </span>
                          <span
                            className={`min-w-0 flex-1 text-[14px] font-semibold ${
                              selected
                                ? 'text-mintcom-green'
                                : 'text-text-primary dark:text-white'
                            }`}
                          >
                            {b.label}
                          </span>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              selected
                                ? 'border-mintcom-green bg-mintcom-green'
                                : 'border-gray-300 bg-white dark:border-white/25'
                            }`}
                          >
                            {selected && (
                              <Check size={12} className="text-white" strokeWidth={3} />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer — cancel + complete / continue */}
            <div className="flex shrink-0 items-center gap-2 border-t border-gray-100 px-3 py-2.5 dark:border-white/8">
              <button
                type="button"
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[#E8A0A8] text-[#D55263]"
                aria-label="Cancel"
              >
                <X size={20} />
              </button>
              <button
                type="button"
                disabled={!canProcess}
                onClick={advanceOrComplete}
                className={`flex h-11 min-w-0 flex-1 items-center justify-center rounded-xl text-[14px] font-extrabold ${
                  canProcess
                    ? 'bg-mintcom-green text-white shadow-md shadow-mintcom-green/25'
                    : 'bg-[#EEF2F0] text-[#9CA3AF]'
                }`}
              >
                {isCash && !canChargeCash
                  ? `${Math.max(0, shareAmount - tendered).toFixed(2)} USD Remaining`
                  : isLastShare
                    ? `Complete · ${shareAmount.toFixed(2)} USD`
                    : `Continue · ${shareAmount.toFixed(2)} USD`}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[75] flex justify-end">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-label="Close split payment"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative z-10 flex h-full w-full flex-col overflow-hidden rounded-s-2xl border-s border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface ${
          mode === 'menu'
            ? 'max-w-[min(100%,480px)] sm:max-w-[min(100%,520px)]'
            : 'max-w-[min(100%,680px)] sm:max-w-[min(100%,720px)]'
        }`}
      >
        {/*
          Green hero — matches mintcom-pos SplitPaymentModal LinearGradient hero
          (title + total bill + items/remaining on primary green).
        */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-mintcom-green to-[#3d9a6e] px-4 pb-3.5" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
          <div className="relative flex items-center justify-between gap-2">
            {mode !== 'menu' ? (
              <button
                type="button"
                onClick={() => {
                  setSplitMode(null);
                  setSplitAmountCents(0);
                  setSelectedForPayment({});
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
                aria-label="Back"
              >
                <ArrowLeft size={16} className="text-white" />
              </button>
            ) : (
              <span className="h-11 w-11 shrink-0" />
            )}
            <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white">
                Split Payment
              </p>
              {mode !== 'menu' && mode !== 'pay' && (
                <span className="inline-flex max-w-[50%] items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                  {mode === 'amount' ? <DollarSign size={11} className="text-white" /> : <ShoppingBag size={11} className="text-white" />}
                  {mode === 'amount' ? 'By Amount' : 'By Item'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white hover:bg-white/25"
              aria-label="Close"
            >
              <X size={15} className="text-white" />
            </button>
          </div>

          <div className="relative mt-3 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-white/80">Total bill</p>
              <p className="text-[22px] font-black leading-none tabular-nums tracking-tight text-white">
                {total.toFixed(2)}
                <span className="ms-1 text-[11px] font-bold text-white/90">USD</span>
              </p>
            </div>
            <div className="min-w-0 text-end">
              <p className="text-[11px] font-medium text-white/80">
                {mode === 'menu' ? 'Items' : 'Remaining'}
              </p>
              <p className="text-[22px] font-black leading-none tabular-nums tracking-tight text-white">
                {mode === 'menu' ? cart.length : remForHero.toFixed(2)}
                {mode !== 'menu' && (
                  <span className="ms-1 text-[11px] font-bold text-white/90">USD</span>
                )}
              </p>
            </div>
          </div>

          {mode !== 'menu' && mode !== 'pay' && (
            <div className="relative mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all"
                  style={{ width: `${fraction * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] font-semibold text-white">
                {Math.round(fraction * 100)}%{' '}
                <span className="font-medium text-white/75">allocated</span>
              </p>
            </div>
          )}
        </div>

        {/* Method switcher */}
        {(splitMode === 'amount' || splitMode === 'item') && (
          <div className="flex shrink-0 gap-2 border-b border-gray-100 px-3 py-2 dark:border-white/8">
            {(
              [
                { id: 'amount' as const, icon: DollarSign, label: 'By Amount' },
                { id: 'item' as const, icon: ShoppingBag, label: 'By Item' },
              ] as const
            ).map((m) => {
              const active = splitMode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (splitMode === m.id) return;
                    if (m.id === 'amount') {
                      setSplitMode('amount');
                      setSelectedForPayment({});
                    } else {
                      setSplitMode('item');
                      setSplitAmountCents(0);
                    }
                  }}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-xl border px-2.5 py-2 text-start transition-all ${
                    active
                      ? 'border-mintcom-green bg-gradient-to-br from-mintcom-green to-[#3d9a6e] text-white shadow-md shadow-mintcom-green/25'
                      : 'border-gray-200 bg-white text-text-secondary dark:border-white/10 dark:bg-mintcom-dark'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl ${
                      active ? 'bg-white/20' : 'bg-cream-100 dark:bg-white/5'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-white' : ''} />
                  </span>
                  <span
                    className={`min-w-0 flex-1 truncate text-[12px] font-extrabold ${
                      active ? 'text-white' : 'text-text-secondary dark:text-white/70'
                    }`}
                  >
                    {m.label}
                  </span>
                  {active && (
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white">
                      <Check size={11} className="text-mintcom-green" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto sm:overflow-hidden overscroll-contain">
          {/* Menu */}
          {splitMode === null && (
            <div className="flex min-h-0 flex-1 flex-col px-3.5 py-3">
              <p className="mb-2.5 text-center text-[12px] font-medium text-text-secondary">
                Choose how to split the bill
              </p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSplitMode('amount');
                    setSplitPayments([]);
                    setSplitAmountCents(0);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-start shadow-sm dark:border-white/10 dark:bg-mintcom-dark"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                    <DollarSign size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-extrabold text-text-primary dark:text-white">
                      By Amount
                    </span>
                    <span className="mt-0.5 block text-[11px] text-text-secondary">
                      Each Person Pays a Custom Amount
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      <span className="rounded-xl bg-mintcom-green/15 px-1.5 py-0.5 text-[9px] font-bold text-mintcom-green">
                        Split Equally
                      </span>
                      <span className="rounded-xl bg-cream-100 px-1.5 py-0.5 text-[9px] font-bold text-text-secondary dark:bg-white/10">
                        Custom amounts
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-text-tertiary" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSplitMode('item');
                    setSelectedForPayment({});
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-start shadow-sm dark:border-white/10 dark:bg-mintcom-dark"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                    <ShoppingBag size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-extrabold text-text-primary dark:text-white">
                      By Item
                    </span>
                    <span className="mt-0.5 block text-[11px] text-text-secondary">
                      Select Specific Items for Each Payment
                    </span>
                    <span className="mt-1.5 inline-flex">
                      <span className="rounded-xl bg-mintcom-green/15 px-1.5 py-0.5 text-[9px] font-bold text-mintcom-green">
                        {cart.length} items
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-text-tertiary" />
                </button>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="mt-auto w-full rounded-xl border border-gray-200 bg-cream-50 py-2.5 text-[13px] font-bold text-text-secondary dark:border-white/10 dark:bg-mintcom-dark dark:text-white/70"
              >
                Cancel
              </button>
            </div>
          )}

          {/* By Amount */}
          {splitMode === 'amount' && (
            <div className="flex sm:min-h-0 sm:flex-1 flex-col">
              <div className="grid sm:min-h-0 sm:flex-1 grid-cols-1 gap-2 overflow-visible sm:overflow-hidden sm:grid-cols-2 sm:items-stretch">
                <div className="flex min-h-0 flex-col border-b border-gray-100 px-3 py-2 dark:border-white/8 sm:border-b-0 sm:border-e">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                      Split equally
                    </p>
                    <p className="text-[10px] text-text-tertiary">Tap to apply</p>
                  </div>
                  <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
                    {EQUAL_SPLIT_OPTIONS.map((count) => {
                      const each = Number((total / count).toFixed(2));
                      const selected =
                        numPeople === count && splitPayments.length === count;
                      return (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            const eachAmt = parseFloat((total / count).toFixed(2));
                            const parts = Array.from({ length: count }, (_, i) => {
                              if (i === count - 1) {
                                return {
                                  amount: parseFloat(
                                    (total - eachAmt * (count - 1)).toFixed(2),
                                  ),
                                  method: (i % 2 === 0 ? 'cash' : 'card') as 'cash' | 'card',
                                };
                              }
                              return {
                                amount: eachAmt,
                                method: (i % 2 === 0 ? 'cash' : 'card') as 'cash' | 'card',
                              };
                            });
                            setSplitPayments(parts);
                            setNumPeople(count);
                            setSplitAmountCents(0);
                          }}
                          className={`min-w-[56px] min-h-[44px] shrink-0 rounded-xl border px-2 py-1.5 ${
                            selected
                              ? 'border-mintcom-green bg-mintcom-green/15'
                              : 'border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-dark'
                          }`}
                        >
                          <span className="flex items-center justify-center gap-0.5">
                            <Users
                              size={11}
                              className={
                                selected ? 'text-mintcom-green' : 'text-text-secondary'
                              }
                            />
                            <span
                              className={`text-[13px] font-extrabold ${
                                selected
                                  ? 'text-mintcom-green'
                                  : 'text-text-primary dark:text-white'
                              }`}
                            >
                              {count}
                            </span>
                          </span>
                          <span
                            className={`mt-0.5 block text-center text-[9px] font-semibold tabular-nums ${
                              selected ? 'text-mintcom-green' : 'text-text-secondary'
                            }`}
                          >
                            {each.toFixed(2)}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {splitPayments.length > 0 ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                            Persons
                          </p>
                          <span className="rounded-full bg-mintcom-green/15 px-1.5 py-0.5 text-[9px] font-extrabold text-mintcom-green">
                            {splitPayments.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSplitPayments([]);
                            setSplitAmountCents(0);
                          }}
                          className="text-[10px] font-bold text-text-secondary"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="min-h-0 flex-1 space-y-0 overflow-y-auto rounded-xl border border-gray-100 bg-[#F4F5F7] dark:border-white/8 dark:bg-mintcom-dark">
                        {splitPayments.map((p, index) => {
                          const tint = PERSON_PALETTE[index % PERSON_PALETTE.length];
                          const pct =
                            total > 0 ? ((p.amount / total) * 100).toFixed(0) : '0';
                          return (
                            <div
                              key={index}
                              className={`flex items-center gap-2 px-2.5 py-2 ${
                                index < splitPayments.length - 1
                                  ? 'border-b border-black/5 dark:border-white/5'
                                  : ''
                              }`}
                            >
                              <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-extrabold"
                                style={{
                                  backgroundColor: `${tint}1F`,
                                  borderColor: `${tint}55`,
                                  color: tint,
                                }}
                              >
                                P{index + 1}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-bold text-text-primary dark:text-white">
                                  Person {index + 1}
                                </p>
                                <p className="text-[10px] text-text-secondary">
                                  {pct}% of bill
                                </p>
                              </div>
                              <p className="text-[12px] font-extrabold tabular-nums text-text-primary dark:text-white">
                                {p.amount.toFixed(2)}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setSplitPayments((list) =>
                                    list.filter((_, i) => i !== index),
                                  )
                                }
                                className="flex h-10 w-10 min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl bg-[#D55263]/10 text-[#D55263]"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex min-h-[100px] flex-1 flex-col items-center justify-center gap-1.5 rounded-xl bg-mintcom-green/5 px-3 text-center">
                      <Users size={20} className="text-text-tertiary" />
                      <p className="text-[11px] font-medium text-text-secondary">
                        Tap an equal split above or enter a custom amount
                      </p>
                    </div>
                  )}
                </div>

                {/* Amount + full-height numpad (fills column — not thin fixed keys) */}
                <div className="flex h-full min-h-[260px] flex-1 flex-col px-3 py-2 sm:min-h-0">
                  <div className="mb-1 flex shrink-0 items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-text-secondary">
                      Amount
                    </p>
                    {splitAmountCents > 0 && (
                      <button
                        type="button"
                        onClick={() => setSplitAmountCents(0)}
                        className="text-[10px] font-bold text-[#D55263]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div
                    className={`mb-2 flex shrink-0 items-center gap-2 rounded-xl border-2 bg-white px-2.5 py-2.5 dark:bg-mintcom-dark ${
                      canAddSplitAmount
                        ? 'border-mintcom-green shadow-sm shadow-mintcom-green/15'
                        : 'border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <span className="rounded-xl bg-mintcom-green/15 px-2 py-1 text-[11px] font-extrabold text-mintcom-green">
                      $
                    </span>
                    <p
                      className={`min-w-0 flex-1 text-[26px] font-black leading-none tabular-nums tracking-tight ${
                        splitAmountCents === 0
                          ? 'text-text-tertiary'
                          : 'text-text-primary dark:text-white'
                      }`}
                    >
                      {splitAmount.toFixed(2)}
                    </p>
                  </div>

                  {/* 4 equal rows × 3 keys — fills remaining height */}
                  <div className="flex min-h-[240px] flex-1 flex-col gap-1.5">
                    {(
                      [
                        ['1', '2', '3'],
                        ['4', '5', '6'],
                        ['7', '8', '9'],
                        ['00', '0', 'back'],
                      ] as const
                    ).map((row) => (
                      <div key={row.join('-')} className="flex min-h-[48px] flex-1 gap-1.5">
                        {row.map((k) => (
                          <button
                            key={k}
                            type="button"
                            disabled={splitComplete && k !== 'back'}
                            onClick={() => {
                              if (k === 'back') {
                                setSplitAmountCents((c) => Math.floor(c / 10));
                                return;
                              }
                              if (k === '00') {
                                setSplitAmountCents((c) => Math.min(99999999, c * 100));
                                return;
                              }
                              setSplitAmountCents((c) =>
                                Math.min(99999999, c * 10 + Number(k)),
                              );
                            }}
                            className={`flex h-full min-h-0 flex-1 items-center justify-center rounded-xl border-[1.5px] text-[17px] font-bold tabular-nums shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-transform active:scale-[0.98] disabled:opacity-40 ${
                              k === 'back'
                                ? 'border-[#E5E7EB] bg-[#F3F4F6] text-[#374151] dark:border-white/10 dark:bg-white/10 dark:text-white'
                                : 'border-gray-200 bg-white text-[#111827] active:border-mintcom-green active:bg-mintcom-green/12 dark:border-white/10 dark:bg-mintcom-dark dark:text-white'
                            }`}
                          >
                            {k === 'back' ? '⌫' : k}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    disabled={!canAddSplitAmount}
                    onClick={() => {
                      if (!canAddSplitAmount) return;
                      setSplitPayments((p) => [
                        ...p,
                        {
                          amount: Math.round(splitAmount * 100) / 100,
                          method: (p.length % 2 === 0 ? 'cash' : 'card') as 'cash' | 'card',
                        },
                      ]);
                      setSplitAmountCents(0);
                    }}
                    className={`mt-2 flex h-11 w-full shrink-0 items-center justify-center gap-1.5 rounded-xl text-[14px] font-extrabold ${
                      canAddSplitAmount
                        ? 'bg-mintcom-green text-white shadow-md shadow-mintcom-green/20'
                        : 'bg-cream-100 text-text-tertiary dark:bg-white/5'
                    }`}
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    Add
                    {splitAmountCents > 0 ? ` ${splitAmount.toFixed(2)}` : ''}
                  </button>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-100 bg-white px-3 py-2 dark:border-white/8 dark:bg-mintcom-surface">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-text-secondary">
                    {splitPayments.length > 0
                      ? `${splitPayments.length} persons`
                      : 'No splits yet'}
                  </p>
                  <p className="text-[15px] font-extrabold tabular-nums text-text-primary dark:text-white">
                    <span className={splitComplete ? 'text-mintcom-green' : ''}>
                      {splitAllocated.toFixed(2)}
                    </span>
                    <span className="text-text-tertiary"> / {total.toFixed(2)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-cream-50 px-4 text-[14px] font-extrabold text-text-secondary dark:border-white/10 dark:bg-mintcom-dark dark:text-white/80"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!splitComplete}
                  onClick={() => {
                    if (!splitComplete) return;
                    enterPayMode(splitPayments);
                  }}
                  className={`inline-flex h-11 min-w-[140px] flex-1 sm:flex-none sm:min-w-[160px] items-center justify-center gap-1.5 rounded-xl px-3 sm:px-4 text-[13px] sm:text-[14px] font-extrabold truncate ${
                    splitComplete
                      ? 'bg-mintcom-green text-white shadow-md shadow-mintcom-green/25'
                      : 'bg-cream-100 text-text-tertiary dark:bg-white/5 dark:text-white/50'
                  }`}
                >
                  {splitComplete ? 'Proceed to Payment' : 'Add all to continue'}
                  {splitComplete && <ArrowRight size={15} />}
                </button>
              </div>
            </div>
          )}

          {/* By Item */}
          {splitMode === 'item' && (
            <div className="flex sm:min-h-0 sm:flex-1 flex-col">
              <div className="grid sm:min-h-0 sm:flex-1 grid-cols-1 gap-2 overflow-visible sm:overflow-hidden p-2 sm:grid-cols-2">
                <div className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-cream-50 dark:border-white/10 dark:bg-mintcom-dark">
                  <div className="absolute inset-y-0 start-0 w-1 bg-gray-300 dark:bg-white/15" />
                  <div className="flex items-center gap-2 border-b border-gray-100 px-2.5 py-2 dark:border-white/8">
                    <span className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white dark:bg-mintcom-surface">
                      <List size={14} className="text-text-secondary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[12px] font-extrabold text-text-primary dark:text-white">
                        Remaining
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {itemPendingCount} items
                      </p>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
                    {cart
                      .filter((l) => l.qty - (selectedForPayment[l.id] || 0) > 0)
                      .map((line) => {
                        const selectedQty = selectedForPayment[line.id] || 0;
                        const remQty = line.qty - selectedQty;
                        const initial = (line.name || '?').trim().charAt(0).toUpperCase();
                        return (
                          <div
                            key={line.id}
                            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 dark:border-white/10 dark:bg-mintcom-surface"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-cream-50 text-[13px] font-extrabold text-text-secondary dark:border-white/10 dark:bg-mintcom-dark">
                              {initial}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-bold text-text-primary dark:text-white">
                                {line.name}
                              </p>
                              <p className="text-[10px] text-text-secondary">
                                {line.unitPrice.toFixed(2)}{' '}
                                <span className="text-text-tertiary">/ ea</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 rounded-xl bg-cream-100 p-0.5 dark:bg-mintcom-dark">
                              <button
                                type="button"
                                disabled={selectedQty <= 0}
                                onClick={() => {
                                  setSelectedForPayment((prev) => {
                                    const cur = prev[line.id] || 0;
                                    if (cur <= 1) {
                                      const next = { ...prev };
                                      delete next[line.id];
                                      return next;
                                    }
                                    return { ...prev, [line.id]: cur - 1 };
                                  });
                                }}
                                className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white disabled:opacity-35 dark:bg-mintcom-surface"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center text-[12px] font-extrabold tabular-nums dark:text-white">
                                {remQty}
                              </span>
                              <button
                                type="button"
                                disabled={remQty <= 0}
                                onClick={() => {
                                  setSelectedForPayment((prev) => {
                                    const cur = prev[line.id] || 0;
                                    if (cur >= line.qty) return prev;
                                    return { ...prev, [line.id]: cur + 1 };
                                  });
                                }}
                                className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-mintcom-green text-white disabled:opacity-40"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {itemPendingCount === 0 && (
                      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mintcom-green/15 text-mintcom-green">
                          <Check size={24} />
                        </span>
                        <p className="text-[12px] font-medium text-text-secondary">
                          All items selected
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-gray-100 bg-white px-2.5 py-2 dark:border-white/8 dark:bg-mintcom-surface">
                    <span className="text-[11px] font-medium text-text-secondary">
                      Remaining
                    </span>
                    <span className="text-[13px] font-extrabold tabular-nums dark:text-white">
                      {itemRemainingTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="relative flex min-h-0 flex-col overflow-hidden rounded-xl border border-mintcom-green/30 bg-mintcom-green/5">
                  <div className="absolute inset-y-0 start-0 w-1 bg-mintcom-green" />
                  <div className="flex items-center gap-2 border-b border-mintcom-green/15 px-2.5 py-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                      <ShoppingCart size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-extrabold text-mintcom-green">
                        Paying Now
                      </p>
                      <p className="text-[10px] text-text-secondary">
                        {itemSelectedCount} items
                      </p>
                    </div>
                    {hasItemSelection && (
                      <button
                        type="button"
                        onClick={() => setSelectedForPayment({})}
                        className="rounded-xl bg-[#D55263]/10 px-2 py-1 text-[10px] font-bold text-[#D55263]"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
                    {Object.entries(selectedForPayment)
                      .filter(([, q]) => q > 0)
                      .map(([id, qty]) => {
                        const line = cart.find((l) => l.id === id);
                        if (!line) return null;
                        const initial = (line.name || '?').trim().charAt(0).toUpperCase();
                        const remQty = line.qty - qty;
                        return (
                          <div
                            key={id}
                            className="flex items-center gap-2 rounded-xl border border-mintcom-green/25 bg-white p-2 dark:bg-mintcom-surface"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-mintcom-green/30 bg-mintcom-green/10 text-[13px] font-extrabold text-mintcom-green">
                              {initial}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-bold text-text-primary dark:text-white">
                                {line.name}
                              </p>
                              <p className="text-[10px] font-bold text-mintcom-green">
                                {(line.unitPrice * qty).toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-0.5 rounded-xl bg-cream-100 p-0.5 dark:bg-mintcom-dark">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedForPayment((prev) => {
                                    const cur = prev[id] || 0;
                                    if (cur <= 1) {
                                      const next = { ...prev };
                                      delete next[id];
                                      return next;
                                    }
                                    return { ...prev, [id]: cur - 1 };
                                  });
                                }}
                                className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-white dark:bg-mintcom-surface"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center text-[12px] font-extrabold tabular-nums dark:text-white">
                                {qty}
                              </span>
                              <button
                                type="button"
                                disabled={remQty <= 0}
                                onClick={() => {
                                  setSelectedForPayment((prev) => {
                                    const cur = prev[id] || 0;
                                    if (cur >= line.qty) return prev;
                                    return { ...prev, [id]: cur + 1 };
                                  });
                                }}
                                className="flex h-10 w-10 min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-mintcom-green text-white disabled:opacity-40"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedForPayment((prev) => {
                                  const next = { ...prev };
                                  delete next[id];
                                  return next;
                                });
                              }}
                              className="flex h-10 w-10 min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl bg-[#D55263]/10 text-[#D55263]"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        );
                      })}
                    {!hasItemSelection && (
                      <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-text-tertiary dark:bg-mintcom-surface">
                          <ArrowLeft size={22} />
                        </span>
                        <p className="text-[12px] font-medium text-text-secondary">
                          Tap + to add items here
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between border-t border-mintcom-green/15 bg-white px-2.5 py-2 dark:bg-mintcom-surface">
                    <span className="text-[11px] font-medium text-text-secondary">To pay</span>
                    <span className="text-[13px] font-extrabold tabular-nums text-mintcom-green">
                      {itemSelectedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-100 bg-white px-3 py-2 dark:border-white/8 dark:bg-mintcom-surface">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-bold text-text-secondary">
                    {hasItemSelection
                      ? `${itemSelectedCount} items selected`
                      : 'Select items to continue'}
                  </p>
                  <p
                    className={`text-[15px] font-extrabold tabular-nums ${
                      hasItemSelection
                        ? 'text-mintcom-green'
                        : 'text-text-primary dark:text-white'
                    }`}
                  >
                    {itemSelectedTotal.toFixed(2)} USD
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-cream-50 px-4 text-[14px] font-extrabold text-text-secondary dark:border-white/10 dark:bg-mintcom-dark dark:text-white/80"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!hasItemSelection}
                  onClick={() => {
                    if (!hasItemSelection) return;
                    const parts: Array<{ amount: number; method: 'cash' | 'card' }> = [
                      { amount: itemSelectedTotal, method: 'cash' },
                    ];
                    if (itemRemainingTotal > 0.005) {
                      parts.push({ amount: itemRemainingTotal, method: 'card' });
                    }
                    enterPayMode(parts);
                  }}
                  className={`inline-flex h-11 min-w-[140px] flex-1 sm:flex-none sm:min-w-[160px] items-center justify-center gap-1.5 rounded-xl px-3 sm:px-4 text-[13px] sm:text-[14px] font-extrabold truncate ${
                    hasItemSelection
                      ? 'bg-mintcom-green text-white shadow-md shadow-mintcom-green/25'
                      : 'bg-cream-100 text-text-tertiary dark:bg-white/5 dark:text-white/50'
                  }`}
                >
                  {hasItemSelection
                    ? `Pay ${itemSelectedTotal.toFixed(2)}`
                    : 'Select items to continue'}
                  {hasItemSelection && <ArrowRight size={15} />}
                </button>
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

type StoreConnectProps = {
  onConnect: () => void;
};

function PosDemoStoreConnect({ onConnect }: StoreConnectProps) {
  const [connecting, setConnecting] = useState(false);
  /** Full-screen POS Contact Support (same as TenantSelection → ContactSupport). */
  const [showContactSupport, setShowContactSupport] = useState(false);

  const handleConnect = async () => {
    setConnecting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 800));
    setConnecting(false);
    onConnect();
  };

  return (
    <div className="relative flex h-full max-h-full overflow-hidden bg-white dark:bg-mintcom-dark">
      {/* Left pane: Store Connection details — full width on phones, half on sm+ */}
      <div className="relative flex min-h-0 min-w-0 w-full sm:w-1/2 flex-1 flex-col overflow-hidden">
        <div className="h-6 sm:h-8" />

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">

          <div className="m-auto w-full max-w-[340px]">
            {/* POS TenantSelectionScreen cleanTitleContainer + headerSubtitle */}
            <div className="mb-2 flex items-center justify-center gap-2.5">
              <p className="font-sans text-[24px] font-extrabold leading-tight text-[#333] dark:text-white sm:text-[32px]">
                Connect to Store
              </p>
              <Home size={28} strokeWidth={2} className="shrink-0 text-[#333] dark:text-white sm:h-8 sm:w-8" aria-hidden />
            </div>
            <p className="mb-[34px] text-center font-sans text-[17px] font-normal leading-snug text-[#999]">
              Enter your store credentials to continue
            </p>

            {/* Establishment ID */}
            <div className="mb-4">
              <label className="block text-[12px] font-black uppercase tracking-wider text-text-secondary dark:text-mintcom-textSecondary mb-2">
                Establishment ID/Slug
              </label>
              <div className="flex h-14 items-center rounded-xl border border-[#d1d5db] bg-white px-4 dark:border-white/15 dark:bg-mintcom-surface">
                <Hash size={20} className="me-3 shrink-0 text-[#999]" />
                <input
                  type="text"
                  readOnly
                  placeholder="Establishment ID/Slug"
                  value="cafedelight"
                  className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#555] dark:text-[#ccc] outline-none cursor-not-allowed select-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-8">
              <label className="block text-[12px] font-black uppercase tracking-wider text-text-secondary dark:text-mintcom-textSecondary mb-2">
                Password
              </label>
              <div className="flex h-14 items-center rounded-xl border border-[#d1d5db] bg-white px-4 dark:border-white/15 dark:bg-mintcom-surface">
                <Lock size={20} className="me-3 shrink-0 text-[#999]" />
                <input
                  type="password"
                  readOnly
                  value="delight123"
                  className="h-full min-w-0 flex-1 bg-transparent text-[16px] text-[#555] dark:text-[#ccc] outline-none cursor-not-allowed select-none"
                />
              </div>
            </div>

            <button
              type="button"
              disabled={connecting}
              onClick={handleConnect}
              className="relative flex h-14 w-full items-center justify-center rounded-xl bg-mintcom-green px-5 text-base font-semibold text-white shadow-md shadow-mintcom-green/25 transition-all hover:brightness-105 active:scale-[0.99] disabled:bg-[#A0A0A0]"
            >
              <span>{connecting ? 'Connecting...' : 'Connect'}</span>
              {!connecting && (
                <ArrowRight size={20} className="absolute end-5 rtl:rotate-180" strokeWidth={2.25} />
              )}
            </button>

            {/* Section 3: Create New Account Section — mirrors mintcom-pos TenantSelectionScreen */}
            <div className="mt-5 w-full">
              <div className="mb-4 flex items-center">
                <div className="h-px flex-1 bg-[#e5e7eb] dark:bg-white/10" />
                <span className="mx-3 text-[13px] font-semibold uppercase text-[#6b7280]">
                  OR
                </span>
                <div className="h-px flex-1 bg-[#e5e7eb] dark:bg-white/10" />
              </div>

              <Link
                to="/signup"
                target="_blank"
                rel="noreferrer"
                className="flex h-14 w-full items-center justify-center gap-2.5 rounded-xl border-[1.5px] border-mintcom-green bg-white text-base font-bold text-mintcom-green shadow-sm shadow-mintcom-green/15 transition-all hover:bg-mintcom-green/5 active:scale-[0.99] dark:bg-mintcom-surface"
              >
                <User size={20} className="text-mintcom-green" />
                <span>Create New Account</span>
              </Link>

              <p className="mt-2.5 text-center text-xs leading-relaxed text-[#999]">
                New to Mintcom? Register your store online, then come back and connect with your Store ID.
              </p>
            </div>

            {/* Footer — matches mintcom-pos TenantSelectionScreen */}
            <div className="mt-6 text-center">
              <p className="text-sm text-[#666]">
                Need help?{' '}
                <button
                  type="button"
                  onClick={() => setShowContactSupport(true)}
                  className="font-bold text-mintcom-green underline"
                >
                  Contact support
                </button>
              </p>
              <p className="mt-2 text-sm text-[#666]">
                <a
                  href="https://mintcompos.com/legal/privacy"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-mintcom-green hover:underline"
                >
                  Privacy Policy
                </a>
                <span className="mx-1.5 text-[#666]"> · </span>
                <a
                  href="https://mintcompos.com/legal/terms"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-mintcom-green hover:underline"
                >
                  Terms of Service
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right pane: Brand panel — tablet/desktop only */}
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-[#6baf8b] sm:flex">
        <div className="pointer-events-none absolute -bottom-16 -start-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-28 -end-8 h-40 w-40 rounded-full bg-white/10 blur-xl" />
        <div className="pointer-events-none absolute start-0 end-0 bottom-0 h-[30%] bg-gradient-to-t from-black/10 to-transparent" />

        <div className="relative z-10 flex max-w-[460px] flex-col items-center px-10 text-center">
          <Logo theme="dark" size="lg" className="scale-125" />
        </div>
      </div>

      {/* Connecting overlay */}
      <AnimatePresence>
        {connecting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-mintcom-dark/90"
          >
            <div className="flex flex-col items-center gap-3">
              <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-mintcom-green/25 border-t-mintcom-green" />
              <p className="text-sm font-bold text-text-secondary dark:text-mintcom-textSecondary">
                Connecting register to Cafe Delight...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact support — POS Help for Live Service (same as real POS TenantSelection) */}
      <AnimatePresence>
        {showContactSupport && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className="absolute inset-0 z-[70] flex flex-col bg-white dark:bg-mintcom-dark"
          >
            <DemoSupportScreen
              variant="login"
              onBack={() => setShowContactSupport(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

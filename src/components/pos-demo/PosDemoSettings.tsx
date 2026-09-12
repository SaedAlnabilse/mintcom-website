/**
 * Demo Settings — mirrors mintcom-pos SettingsScreen + each settings tab:
 * sidebar, search, expandable groups, add/edit/delete modals, printer modal,
 * unsaved-changes confirmation. Local demo state only (nothing persists).
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Apple,
  Archive,
  ArrowRight,
  Box,
  Building2,
  Cake,
  Calendar,
  Carrot,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Coffee,
  Cookie,
  CreditCard,
  Croissant,
  Eye,
  EyeOff,
  FileText,
  RefreshCw,
  Bluetooth,
  Wifi,
  Briefcase,
  Beer,
  Wine,
  Soup,
  Flame,
  Smartphone,
  Monitor,
  AlertTriangle,
  Zap,
  ZapOff,
  Minus,
  Bug,
  Cable,
  CircleCheck,
  CupSoda,
  Drumstick,
  Fish,
  Gift,
  Globe,
  Grid3X3,
  Heart,
  IceCreamCone,
  Info,
  LayoutGrid,
  List,
  Lock,
  Martini,
  Package,
  Percent,
  Pizza,
  Plus,
  Printer,
  Sandwich,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Search,
  Settings2,
  Shapes,
  Shield,
  Tag,
  Trash2,
  Pencil,
  RotateCcw,
  UploadCloud,
  User,
  Utensils,
  UtensilsCrossed,
  Wrench,
  X,
} from 'lucide-react';
import { DemoManufacturingPanel } from './PosDemoManufacturing';
import {
  DEFAULT_HOLD_ORDER_TABLE_COUNT,
  MAX_HOLD_ORDER_TABLE_COUNT,
  MAX_HOLD_ORDER_TABLE_DIGITS,
} from '../../utils/settingsPayload';
import { DemoProductFormModal, type DemoProductFormValue } from './PosDemoProductForm';
import type {
  DemoCatalog,
  DemoCatalogAddon,
  DemoCatalogCategory,
  DemoCatalogProduct,
} from './demoCatalog';

const money = (n: number) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });

export interface DemoTaxRate {
  id: string;
  name: string;
  rate: number; // fraction e.g. 0.16
  isDefault: boolean;
}

const QUICK_TAX_RATES = ['0', '5', '10', '16'];

// Module-scope id generator for demo entities created in event handlers.
// Kept outside the component so render stays pure (react-hooks/purity).
let demoIdSeq = 0;
const nextDemoId = (prefix: string): string => `${prefix}-${Date.now()}-${(demoIdSeq += 1)}`;

/* Category icon picker set — mirrors the POS CategoryFormModal AVAILABLE_ICONS. */
const CATEGORY_ICONS: { key: string; Icon: typeof Coffee }[] = [
  { key: 'utensils', Icon: Utensils },
  { key: 'coffee', Icon: Coffee },
  { key: 'cup', Icon: CupSoda },
  { key: 'cocktail', Icon: Martini },
  { key: 'silverware', Icon: UtensilsCrossed },
  { key: 'cake', Icon: Cake },
  { key: 'croissant', Icon: Croissant },
  { key: 'icecream', Icon: IceCreamCone },
  { key: 'cookie', Icon: Cookie },
  { key: 'pizza', Icon: Pizza },
  { key: 'burger', Icon: Sandwich },
  { key: 'drumstick', Icon: Drumstick },
  { key: 'fish', Icon: Fish },
  { key: 'fruit', Icon: Apple },
  { key: 'carrot', Icon: Carrot },
  { key: 'tag', Icon: Tag },
  { key: 'star', Icon: Star },
  { key: 'heart', Icon: Heart },
  { key: 'gift', Icon: Gift },
  { key: 'shopping', Icon: ShoppingBag },
  { key: 'noodles', Icon: Soup },
  { key: 'beer', Icon: Beer },
  { key: 'glass-wine', Icon: Wine },
  { key: 'wine', Icon: Wine },
  { key: 'fire', Icon: Flame },
];
const CATEGORY_ICON_MAP: Record<string, typeof Coffee> = Object.fromEntries(
  CATEGORY_ICONS.map((c) => [c.key, c.Icon]),
);

/** Renders a category's icon (icon key → lucide), falling back to emoji or a neutral shape. */
function CategoryIcon({
  category,
  size = 28,
  className,
}: {
  category: { icon?: string; emoji?: string };
  size?: number;
  className?: string;
}) {
  const Ic = category.icon ? CATEGORY_ICON_MAP[category.icon] : undefined;
  if (Ic) return <Ic size={size} className={className} />;
  if (category.emoji) return <span style={{ fontSize: size * 0.9 }}>{category.emoji}</span>;
  return <Shapes size={size} className={className} />;
}

/* ─── Types & seed data ─────────────────────────────────────────────────── */

type SettingsTab =
  | 'business'
  | 'sales'
  | 'products'
  | 'categories'
  | 'stock'
  | 'addons'
  | 'manufacturing'
  | 'activity'
  | 'language'
  | 'about';

type Disc = { id: string; name: string; percentage: number; active: boolean };
type PayMethod = { id: string; name: string; emoji: string; active: boolean; required?: boolean };
type CardType = { id: string; name: string; active: boolean };
type Reward = { id: string; name: string; type: 'FREE_ITEM' | 'DISCOUNT'; points: number; value?: number };
type Product = DemoCatalogProduct;
type Category = DemoCatalogCategory;
type AddonGroup = DemoCatalogAddon;
type Employee = { id: string; name: string; username: string; role: string; pin: string; emoji: string; owner?: boolean };
type ActivityEntry = { id: string; at: number; who: string; action: string; detail: string };

const NAV: {
  id: SettingsTab;
  label: string;
  sub: string;
  icon: typeof Building2;
}[] = [
  { id: 'business', label: 'Main Settings', sub: 'Manage details for Cafe Delight', icon: Building2 },
  { id: 'sales', label: 'Payment Processes', sub: 'Configure how payments are accepted, processed, and recorded', icon: Percent },
  { id: 'products', label: 'Product Management', sub: 'Add, edit, and organize items for quick and accurate checkout', icon: Box },
  { id: 'categories', label: 'Categories', sub: 'Manage product categories', icon: Grid3X3 },
  { id: 'stock', label: 'Stock Management', sub: 'Update stock & availability', icon: Package },
  { id: 'addons', label: 'Attributes', sub: 'Add and manage item add-ons and customization options', icon: Tag },
  { id: 'manufacturing', label: 'Recipe Operations', sub: 'View and update recipes and ingredients', icon: Wrench },
  { id: 'activity', label: 'Activity Log', sub: 'View past activities & changes', icon: Clock },
  { id: 'language', label: 'Language', sub: 'Change App Language', icon: Globe },
  { id: 'about', label: 'About Us', sub: 'About Mintcom', icon: Info },
];

/** Mirrors mintcom-pos YourBusinessScreen themeOptions */
const THEMES = [
  { id: 'green', name: 'Green', colors: ['#2C3E50', '#8B8FA3', '#7dc6a2', '#C8CBCE'], desc: 'Soft mint accent on light surfaces' },
  { id: 'yellow', name: 'Yellow', colors: ['#2C3E50', '#8B8FA3', '#D0C962', '#C8CBCE'], desc: 'Warm gold accent' },
  { id: 'blue', name: 'Blue', colors: ['#2C3E50', '#8B8FA3', '#4A90D9', '#C8CBCE'], desc: 'Cool blue accent' },
  { id: 'dark', name: 'Dark Mode', colors: ['#000000', '#1F2937', '#7dc6a2', '#374151'], desc: 'Dark surfaces with mint accent' },
] as const;

const MAX_HOLD_ORDER_TABLES = MAX_HOLD_ORDER_TABLE_COUNT;
const MAX_EMPLOYEES = 50;

/** Mirrors mintcom-pos EditEmployeeModal POS_PERMISSIONS */
const DEMO_POS_PERMISSIONS = [
  { id: 'open_cash_drawer', label: 'Open drawer without making sale' },
  { id: 'change_taxes', label: 'Change tax rate in order' },
  { id: 'change_service_charge', label: 'Change Service Charge in order' },
  { id: 'pay_in_pay_out', label: 'Pay-in/pay-out (non-sales transactions)' },
  { id: 'dashboard', label: 'View current analytics in dashboard' },
  { id: 'view_shift_reports', label: 'View previous shift analytics in dashboard' },
  { id: 'restock_items', label: 'Restock items', desc: 'Adjust stock levels from the POS' },
  { id: 'manage_open_tickets', label: 'Manage previous held orders' },
  { id: 'refunds', label: 'Make refunds' },
  { id: 'discounts', label: 'Apply discounts' },
  { id: 'loyalty_system_access', label: 'Loyalty system access' },
  { id: 'reprint_receipts', label: 'Reprint receipt or send' },
  { id: 'live_chat', label: 'Access support portal' },
] as const;

/** Mirrors mintcom-pos BACKOFFICE_PERMISSIONS */
const DEMO_BACKOFFICE_PERMISSIONS: { id: string; label: string; desc?: string }[] = [
  { id: 'view_reports', label: 'Access full report', desc: 'Dashboard and analytics' },
  { id: 'cancel_receipts', label: 'Make refunds', desc: 'Refund completed orders from back office' },
  { id: 'manage_inventory', label: 'Manage recipe operations' },
  { id: 'manage_payment_methods', label: 'Manage payment methods' },
  { id: 'manage_employees', label: 'Manage employees' },
  { id: 'manage_discounts', label: 'Discounts, loyalty and customers' },
  { id: 'manage_settings', label: 'Change establishment settings' },
  { id: 'manage_service_charge', label: 'Service Charge' },
  { id: 'export_data', label: 'Allow data export' },
];

/** Demo custom roles (like Settings → Roles templates on POS) */
const DEMO_CUSTOM_ROLES: {
  id: string;
  name: string;
  permissions: string[];
  posAccess: boolean;
  backofficeAccess: boolean;
  backofficePermissions: string[];
}[] = [
  {
    id: 'role-cashier',
    name: 'Cashier',
    permissions: ['discounts', 'refunds', 'reprint_receipts', 'loyalty_system_access'],
    posAccess: true,
    backofficeAccess: false,
    backofficePermissions: [],
  },
  {
    id: 'role-manager',
    name: 'Manager',
    permissions: DEMO_POS_PERMISSIONS.map((p) => p.id),
    posAccess: true,
    backofficeAccess: true,
    backofficePermissions: ['view_reports', 'manage_employees', 'manage_discounts', 'manage_settings'],
  },
  {
    id: 'role-barista',
    name: 'Barista',
    permissions: ['discounts', 'reprint_receipts', 'restock_items'],
    posAccess: true,
    backofficeAccess: false,
    backofficePermissions: [],
  },
];

type DemoPrinter = {
  id: string;
  name: string;
  connection: 'BLUETOOTH' | 'WIFI' | 'ETHERNET';
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  isDefault?: boolean;
  address?: string;
  paperWidth: 58 | 80;
};

/* ─── Shared UI bits ────────────────────────────────────────────────────── */

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/8 dark:bg-mintcom-surface">
      {children}
    </div>
  );
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        disabled ? 'opacity-50' : ''
      } ${on ? 'bg-mintcom-green' : 'bg-gray-300 dark:bg-mintcom-tertiary'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          on ? 'start-5' : 'start-0.5'
        }`}
      />
    </button>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-[80] flex items-center justify-center bg-black/50 p-2.5 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className={`flex max-h-[min(480px,88%)] w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface ${
          wide ? 'max-w-[min(94%,420px)]' : 'max-w-[min(94%,380px)]'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-white/8">
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-normal text-text-primary dark:text-white">{title}</p>
            {subtitle && (
              <p className="text-[11px] text-text-secondary dark:text-mintcom-textSecondary">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-cream-100 dark:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer && (
          <div className="shrink-0 border-t border-gray-100 px-4 py-3 dark:border-white/8">{footer}</div>
        )}
      </motion.div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
        {label}
      </span>
      {children}
    </label>
  );
}

/* ─── Sales (Payment Processes) group primitives — mirror the POS groups ─── */
function InfoDot({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative ms-1.5 inline-flex">
      <button
        type="button"
        title={text}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="More info"
        className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-gray-200 text-[9px] font-black text-text-tertiary transition-colors hover:bg-mintcom-green hover:text-white dark:bg-white/10 dark:hover:bg-mintcom-green"
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          onClick={(e) => e.stopPropagation()}
          className="absolute start-0 top-6 z-50 max-w-[240px] rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium leading-snug text-text-primary shadow-lg dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
        >
          {text}
        </span>
      )}
    </span>
  );
}

/** Collapsible group card matching DiscountGroup / PaymentMethodGroup / CardTypeGroup. */
function SalesGroup({
  title,
  info,
  open,
  onToggle,
  children,
}: {
  title: string;
  info?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-4 text-start"
      >
        <span className="flex items-center text-[15px] font-semibold text-text-primary dark:text-white">
          {title}
          {info && <InfoDot text={info} />}
        </span>
        <ChevronDown
          size={20}
          className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-gray-200 px-4 pb-3 pt-1 dark:border-white/8">{children}</div>
      )}
    </div>
  );
}

/** Row with logo/icon + name + edit + delete (matches the POS list rows). */
function SalesListRow({
  icon,
  name,
  onEdit,
  onDelete,
}: {
  icon: ReactNode;
  name: ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {icon}
        <span className="truncate text-[15px] text-text-primary dark:text-white">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-red/10 text-mintcom-red"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

function AddLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 py-3 text-[15px] font-semibold text-mintcom-green"
    >
      + {label}
    </button>
  );
}

const inputCls =
  'w-full min-h-[44px] rounded-xl border border-gray-200 bg-cream-50 px-3 py-2.5 text-[16px] sm:text-sm font-medium text-text-primary outline-none focus:border-mintcom-green dark:border-mintcom-tertiary dark:bg-mintcom-dark dark:text-white';

function ConfirmModal({
  open,
  title,
  body,
  confirmLabel = 'Confirm',
  danger,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <ModalShell title={title} onClose={onCancel}>
      <p className="text-sm text-text-secondary dark:text-mintcom-textSecondary">{body}</p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold dark:border-white/10"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`flex-1 rounded-xl py-2.5 text-sm font-black text-white ${
            danger ? 'bg-mintcom-red' : 'bg-mintcom-green'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}

function Toast({ msg }: { msg: string | null }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="pointer-events-none fixed bottom-20 start-1/2 z-[90] -translate-x-1/2 rounded-full bg-mintcom-dark px-4 py-2 text-xs font-bold text-white shadow-xl dark:bg-white dark:text-mintcom-dark sm:bottom-6"
        >
          {msg}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Shared sales/tax/service settings — Sales screen reads the same object as Settings (like POS appSettings) */
export type DemoSalesSettings = {
  taxEnabled: boolean;
  taxRate: number;
  taxes?: DemoTaxRate[];
  serviceChargeEnabled: boolean;
  serviceChargeName: string;
  serviceChargeType: 'PERCENTAGE' | 'FIXED';
  serviceChargeValue: number;
  serviceChargeTaxable: boolean;
  serviceChargeAutoApply: boolean;
  serviceChargeAllowCashierOverride: boolean;
};

export const DEFAULT_DEMO_SALES_SETTINGS: DemoSalesSettings = {
  taxEnabled: true,
  taxRate: 8,
  taxes: [
    { id: 'tax-default', name: 'Sales Tax', rate: 0.08, isDefault: true },
    { id: 'tax-custom-1', name: 'Special Tax', rate: 0.05, isDefault: false },
    { id: 'tax-custom-2', name: 'Zero-Rated / Exempt', rate: 0.00, isDefault: false },
  ],
  serviceChargeEnabled: false,
  serviceChargeName: 'Service Charge',
  serviceChargeType: 'PERCENTAGE',
  serviceChargeValue: 10,
  serviceChargeTaxable: false,
  serviceChargeAutoApply: true,
  serviceChargeAllowCashierOverride: true,
};

/* ─── Main screen ───────────────────────────────────────────────────────── */

export function DemoSettingsScreen({
  catalog,
  onCatalogChange,
  businessName = 'Cafe Delight',
  onBusinessNameChange,
  salesSettings,
  onSalesSettingsChange,
}: {
  /** Soft-saved for the whole try-pos session */
  catalog: DemoCatalog;
  onCatalogChange: (next: DemoCatalog | ((prev: DemoCatalog) => DemoCatalog)) => void;
  businessName?: string;
  onBusinessNameChange?: (name: string) => void;
  /** Lifted so Sales order totals match Settings (mintcom-pos appSettings) */
  salesSettings?: DemoSalesSettings;
  onSalesSettingsChange?: (next: DemoSalesSettings) => void;
}) {
  const [renderedAt] = useState(Date.now);
  const [active, setActive] = useState<SettingsTab>('business');
  const [selectedSettingsCategory, setSelectedSettingsCategory] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [dirty, setDirty] = useState(false);
  const [pendingTab, setPendingTab] = useState<SettingsTab | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    tax: true,
    payments: false,
    discounts: false,
    loyalty: false,
    service: false,
    cards: false,
    fiscal: false,
    team: true,
    theme: false,
    receipt: false,
  });

  // Business — mirrors YourBusinessScreen
  const [bizName] = useState(businessName);
  const [joinDate] = useState('30/04/2026');
  const [themeId, setThemeId] = useState<(typeof THEMES)[number]['id']>('green');
  const [useDeviceTheme, setUseDeviceTheme] = useState(false);
  const [tableCount, setTableCount] = useState(DEFAULT_HOLD_ORDER_TABLE_COUNT);
  const [holdTableMaxError, setHoldTableMaxError] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([
    // `pin` field is demo-only storage for staff password (min 6 anything)
    { id: 'owner', name: 'Cafe Delight', username: 'owner', role: 'Owner', pin: '', emoji: '', owner: true },
    { id: '1', name: 'Emma Thompson', username: 'emma', role: 'Cashier', pin: '123456', emoji: '' },
    { id: '2', name: 'Jake Miller', username: 'jake', role: 'USER', pin: '000000', emoji: '' },
    { id: '3', name: 'Chloe Davis', username: 'chloe', role: 'ADMIN', pin: '999999', emoji: '' },
  ]);
  const [receiptSettingsOpen, setReceiptSettingsOpen] = useState(false);
  const [receiptHeader, setReceiptHeader] = useState(businessName);
  const [receiptFooter, setReceiptFooter] = useState('Thank you, come again!');
  const [bizDescription, setBizDescription] = useState('Specialty Coffee House');
  const [bizAddress, setBizAddress] = useState('123 Main Street, Springfield, IL');
  const [showBizNameOnReceipt, setShowBizNameOnReceipt] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showAddress, setShowAddress] = useState(true);
  const [showLogo, setShowLogo] = useState(true);
  const [showTaxId, setShowTaxId] = useState(true);
  const [taxIdNumber, setTaxIdNumber] = useState('');
  const [invoiceStart, setInvoiceStart] = useState('1000');
  const [showFarewell, setShowFarewell] = useState(true);
  const [paperWidth, setPaperWidth] = useState<58 | 80>(80);
  const [demoPrinters, setDemoPrinters] = useState<DemoPrinter[]>([
    {
      id: 'p1',
      name: 'Front Counter · Epson TM-T20',
      connection: 'BLUETOOTH',
      status: 'CONNECTED',
      isDefault: true,
      address: '00:11:22:33:44:55',
      paperWidth: 80,
    },
    {
      id: 'p2',
      name: 'Kitchen · Star TSP143',
      connection: 'WIFI',
      status: 'DISCONNECTED',
      address: '192.168.1.42',
      paperWidth: 80,
    },
  ]);
  const [connectedPrinterId, setConnectedPrinterId] = useState<string | null>('p1');
  const [printerScanning, setPrinterScanning] = useState(false);
  const [scanType, setScanType] = useState<'BLUETOOTH' | 'WIFI' | null>(null);
  const [scannedPrinters, setScannedPrinters] = useState<DemoPrinter[]>([]);
  const [showScanResults, setShowScanResults] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('9100');
  const [manualName, setManualName] = useState('');
  const [printCopies, setPrintCopies] = useState(1);
  const [editingPrinterId, setEditingPrinterId] = useState<string | null>(null);
  const [editedPrinterName, setEditedPrinterName] = useState('');
  const [deletePass, setDeletePass] = useState('');
  const [deletePassError, setDeletePassError] = useState('');
  /** EditEmployeeModal draft state */
  const [draftBaseRole, setDraftBaseRole] = useState<'ADMIN' | 'USER'>('USER');
  const [draftCustomRoleId, setDraftCustomRoleId] = useState('');
  const [draftRolesOpen, setDraftRolesOpen] = useState(false);
  const [draftEmail, setDraftEmail] = useState('');
  const [draftConfirmPass, setDraftConfirmPass] = useState('');
  const [showDraftPass, setShowDraftPass] = useState(false);
  const [showDraftConfirmPass, setShowDraftConfirmPass] = useState(false);
  const [draftPosAccess, setDraftPosAccess] = useState(true);
  const [draftBackofficeAccess, setDraftBackofficeAccess] = useState(false);
  const [draftPermIds, setDraftPermIds] = useState<string[]>(['discounts', 'refunds']);
  const [draftBoPermIds, setDraftBoPermIds] = useState<string[]>([]);
  const [draftAllDiscounts, setDraftAllDiscounts] = useState(true);
  const [draftAllowedDiscountIds, setDraftAllowedDiscountIds] = useState<string[]>([]);
  const [draftDiscountsOpen, setDraftDiscountsOpen] = useState(false);
  const [empFieldErrors, setEmpFieldErrors] = useState<Record<string, string>>({});
  const [infoBanner, setInfoBanner] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Sales — seeded from parent session settings (POS appSettings)
  const seed = salesSettings ?? DEFAULT_DEMO_SALES_SETTINGS;
  const [taxOn] = useState(seed.taxEnabled);
  const [taxRate, setTaxRate] = useState(seed.taxRate.toFixed(2));

  // Taxes — mirrors POS TaxRatesGroup
  const [taxesList, setTaxesList] = useState<DemoTaxRate[]>([
    {
      id: 'tax-default',
      name: 'Sales Tax',
      rate: Number((seed.taxRate / 100).toFixed(4)) || 0.16,
      isDefault: true,
    },
    {
      id: 'tax-custom-1',
      name: 'Special Tax',
      rate: 0.05,
      isDefault: false,
    },
  ]);
  const [taxFilter, setTaxFilter] = useState('');
  const [taxEditor, setTaxEditor] = useState<{
    id: string | null;
    name: string;
    ratePercent: string;
    isDefault?: boolean;
  } | null>(null);
  const [taxNameError, setTaxNameError] = useState('');
  const [taxRateError, setTaxRateError] = useState('');
  const [taxToDelete, setTaxToDelete] = useState<DemoTaxRate | null>(null);
  const [showDefaultTaxLockModal, setShowDefaultTaxLockModal] = useState(false);

  const filteredTaxes = useMemo(() => {
    if (!taxFilter.trim()) return taxesList;
    const q = taxFilter.toLowerCase().trim();
    return taxesList.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        `${(x.rate * 100).toFixed(0)}%`.includes(q) ||
        `${(x.rate * 100).toFixed(2)}%`.includes(q),
    );
  }, [taxesList, taxFilter]);

  const handleQuickTaxRate = (rate: string) => {
    if (!taxEditor) return;
    setTaxEditor({ ...taxEditor, ratePercent: rate });
    if (taxRateError) setTaxRateError('');
  };

  const handleSaveTax = () => {
    if (!taxEditor) return;
    let hasErr = false;
    if (!taxEditor.name.trim()) {
      setTaxNameError('Tax name is required');
      hasErr = true;
    } else {
      setTaxNameError('');
    }
    const p = parseFloat(taxEditor.ratePercent);
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      setTaxRateError('Please enter a rate between 0% and 100%');
      hasErr = true;
    } else {
      setTaxRateError('');
    }
    if (hasErr) return;

    const rateFraction = Number((p / 100).toFixed(6));

    if (taxEditor.id) {
      setTaxesList((prev) =>
        prev.map((t) =>
          t.id === taxEditor.id
            ? { ...t, name: taxEditor.name.trim(), rate: rateFraction }
            : t,
        ),
      );
      if (taxEditor.isDefault) {
        setTaxRate(p.toFixed(2));
        emitSalesSettings({ taxRate: p, taxEnabled: p > 0 });
        ping(`Default sales tax updated to ${p}%`);
      } else {
        ping(`Tax "${taxEditor.name.trim()}" updated`);
      }
    } else {
      const newTax: DemoTaxRate = {
        id: nextDemoId('tax'),
        name: taxEditor.name.trim(),
        rate: rateFraction,
        isDefault: false,
      };
      setTaxesList((prev) => [...prev, newTax]);
      ping(`Tax rate "${taxEditor.name.trim()}" created`);
    }

    markDirty();
    setTaxEditor(null);
  };

  const handleDeleteTaxConfirm = () => {
    if (!taxToDelete) return;
    setTaxesList((prev) => prev.filter((t) => t.id !== taxToDelete.id));
    ping(`Tax "${taxToDelete.name}" deleted`);
    setTaxToDelete(null);
    markDirty();
  };
  // Service charge (mirrors ServiceChargeSettingsGroup)
  const [serviceOn, setServiceOn] = useState(seed.serviceChargeEnabled);
  const [serviceName, setServiceName] = useState(seed.serviceChargeName);
  const [serviceType, setServiceType] = useState<'PERCENTAGE' | 'FIXED'>(seed.serviceChargeType);
  const [serviceRate, setServiceRate] = useState(seed.serviceChargeValue.toFixed(2));
  const [serviceTaxable, setServiceTaxable] = useState(seed.serviceChargeTaxable);
  const [serviceAutoApply, setServiceAutoApply] = useState(seed.serviceChargeAutoApply);
  const [serviceOverride, setServiceOverride] = useState(seed.serviceChargeAllowCashierOverride);
  const [discounts, setDiscounts] = useState<Disc[]>([
    { id: 'd1', name: 'Staff', percentage: 15, active: true },
    { id: 'd2', name: 'Happy hour', percentage: 10, active: true },
    { id: 'd3', name: 'Loyalty 5%', percentage: 5, active: false },
  ]);
  const [payMethods, setPayMethods] = useState<PayMethod[]>([
    { id: 'cash', name: 'Cash', emoji: '', active: true, required: true },
    { id: 'card', name: 'Card', emoji: '', active: true },
    { id: 'cliq', name: 'CliQ', emoji: '', active: true },
    { id: 'talabat', name: 'Talabat', emoji: '', active: false },
  ]);
  const [cardTypes, setCardTypes] = useState<CardType[]>([
    { id: 'visa', name: 'Visa', active: true },
    { id: 'mc', name: 'Mastercard', active: true },
    { id: 'amex', name: 'Amex', active: false },
  ]);
  // Loyalty (mirrors LoyaltyGroup: earning rule + rewards)
  const [loyaltyOn, setLoyaltyOn] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState(10);
  const [loyaltySpend, setLoyaltySpend] = useState('1.00');
  const [rewards, setRewards] = useState<Reward[]>([
    { id: 'rw1', name: 'Free coffee', type: 'FREE_ITEM', points: 100 },
    { id: 'rw2', name: '10% off order', type: 'DISCOUNT', points: 250, value: 10 },
  ]);
  const [fiscalOn, setFiscalOn] = useState(false);

  // Catalog — soft-saved on parent for whole try-pos session
  const products = catalog.products;
  const categories = catalog.categories;
  const addons = catalog.addons;
  // Product Management view mode & filters (mirrors POS ProductManagementScreen)
  const [productViewMode, setProductViewMode] = useState<'grid' | 'list'>('grid');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'archived'>('all');
  const [productSortOption, setProductSortOption] = useState<
    'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'
  >('newest');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    let list = products.filter((p) => {
      // Category filter
      if (selectedSettingsCategory !== 'all' && p.categoryId !== selectedSettingsCategory) {
        return false;
      }
      // Query search
      if (q && !p.name.toLowerCase().includes(q)) {
        return false;
      }
      // Status filter
      const isArchived = !p.active;
      const stock = p.availableStock ?? 0;
      if (productStatusFilter === 'archived') {
        return isArchived;
      }
      if (isArchived) {
        return false;
      }
      if (productStatusFilter === 'out_of_stock') {
        return p.trackStock && stock <= 0;
      }
      if (productStatusFilter === 'low_stock') {
        return p.trackStock && stock > 0 && stock <= 10;
      }
      if (productStatusFilter === 'in_stock') {
        return !p.trackStock || stock > 0;
      }
      return true;
    });

    // Sort
    if (productSortOption === 'oldest') {
      list = [...list].reverse();
    } else if (productSortOption === 'name_asc') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (productSortOption === 'name_desc') {
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    } else if (productSortOption === 'price_asc') {
      list = [...list].sort((a, b) => a.price - b.price);
    } else if (productSortOption === 'price_desc') {
      list = [...list].sort((a, b) => b.price - a.price);
    } else if (productSortOption === 'stock_asc') {
      list = [...list].sort((a, b) => (a.availableStock ?? 9999) - (b.availableStock ?? 9999));
    } else if (productSortOption === 'stock_desc') {
      list = [...list].sort((a, b) => (b.availableStock ?? 0) - (a.availableStock ?? 0));
    }

    return list;
  }, [products, selectedSettingsCategory, productSearch, productStatusFilter, productSortOption]);
  const setProducts = (
    updater: Product[] | ((prev: Product[]) => Product[]),
  ) => {
    onCatalogChange((prev) => ({
      ...prev,
      products: typeof updater === 'function' ? updater(prev.products) : updater,
    }));
  };
  const setCategories = (
    updater: Category[] | ((prev: Category[]) => Category[]),
  ) => {
    onCatalogChange((prev) => ({
      ...prev,
      categories: typeof updater === 'function' ? updater(prev.categories) : updater,
    }));
  };
  const setAddons = (
    updater: AddonGroup[] | ((prev: AddonGroup[]) => AddonGroup[]),
  ) => {
    onCatalogChange((prev) => ({
      ...prev,
      addons: typeof updater === 'function' ? updater(prev.addons) : updater,
    }));
  };

  // Stock Management (mirrors POS): Item Stock + Add-on Availability tabs
  const [stockTab, setStockTab] = useState<'stock' | 'availability'>('stock');
  const [stockSearch, setStockSearch] = useState('');
  const [stockEdits, setStockEdits] = useState<Record<string, string>>({});
  const [availOpen, setAvailOpen] = useState<Record<string, boolean>>({});
  // Attributes (Add-ons) screen state (mirrors POS AttributesScreen)
  const [attrSearch, setAttrSearch] = useState('');
  const [expandedAttr, setExpandedAttr] = useState<string | null>(null);
  const [draftMulti, setDraftMulti] = useState(false);
  const [draftRequired, setDraftRequired] = useState(false);
  const [activity, setActivity] = useState<ActivityEntry[]>([
    { id: 'a1', at: renderedAt - 1800_000, who: 'Chloe', action: 'Updated tax rate', detail: '8%' },
    { id: 'a2', at: renderedAt - 3600_000, who: 'Emma', action: 'Restocked item', detail: 'To-go cups L +40' },
    { id: 'a3', at: renderedAt - 5400_000, who: 'Jake', action: 'Opened shift', detail: 'Opening cash $150' },
    { id: 'a4', at: renderedAt - 7200_000, who: 'Chloe', action: 'Added discount', detail: 'Happy hour 10%' },
    { id: 'a5', at: renderedAt - 86400_000, who: 'Emma', action: 'Edited product', detail: 'Latte price $4.50' },
    { id: 'a6', at: renderedAt - 90000_000, who: 'Jake', action: 'Added payment method', detail: 'Visa' },
    { id: 'a7', at: renderedAt - 172800_000, who: 'Chloe', action: 'Added employee', detail: 'Emma Thompson' },
    { id: 'a8', at: renderedAt - 200000_000, who: 'Emma', action: 'Updated stock', detail: 'Croissant → 12' },
    { id: 'a9', at: renderedAt - 259200_000, who: 'Chloe', action: 'Added category', detail: 'Seasonal Drinks' },
    { id: 'a10', at: renderedAt - 345600_000, who: 'Jake', action: 'Closed shift', detail: 'Cash $412.75' },
    { id: 'a11', at: renderedAt - 432000_000, who: 'Emma', action: 'Edited employee', detail: 'Jake Miller → Barista' },
    { id: 'a12', at: renderedAt - 518400_000, who: 'Chloe', action: 'Added attribute', detail: 'Milk Options' },
  ]);
  const [lang, setLang] = useState<'en' | 'ar'>('en');

  // Modals
  type ModalKind =
    | null
    | { type: 'employee'; emp?: Employee }
    | { type: 'discount'; d?: Disc }
    | { type: 'pay'; p?: PayMethod }
    | { type: 'card'; c?: CardType }
    | { type: 'product'; p?: Product }
    | { type: 'category'; c?: Category }
    | { type: 'addon-opt'; groupId: string; opt?: { id: string; name: string; price: number } }
    | { type: 'addon-group'; g?: AddonGroup }
    | { type: 'printer' }
    | { type: 'reward'; r?: Reward }
    | { type: 'delete'; title: string; body: string; confirmLabel?: string; onConfirm: () => void };

  const [modal, setModal] = useState<ModalKind>(null);

  // Form draft for modals
  const [draftName, setDraftName] = useState('');
  const [draftUsername, setDraftUsername] = useState('');
  const [draftPin, setDraftPin] = useState('');
  const [draftPass, setDraftPass] = useState('');
  const [draftPct, setDraftPct] = useState('');
  const [draftPrice, setDraftPrice] = useState('');
  const [draftEmoji, setDraftEmoji] = useState('');
  const [draftIcon, setDraftIcon] = useState('');
  const [draftAdminOnly, setDraftAdminOnly] = useState(false);
  const [draftRewardType, setDraftRewardType] = useState<'FREE_ITEM' | 'DISCOUNT'>('FREE_ITEM');
  const [draftRewardPoints, setDraftRewardPoints] = useState('100');

  const ping = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 1600);
  };

  const markDirty = () => setDirty(true);

  /** Push tax + service charge to Sales (same session as POS appSettings) */
  const emitSalesSettings = (patch: Partial<DemoSalesSettings> = {}) => {
    onSalesSettingsChange?.({
      taxEnabled: patch.taxEnabled ?? taxOn,
      taxRate:
        patch.taxRate ?? Math.max(0, Math.min(100, parseFloat(taxRate) || 0)),
      taxes: patch.taxes ?? taxesList,
      serviceChargeEnabled: patch.serviceChargeEnabled ?? serviceOn,
      serviceChargeName:
        patch.serviceChargeName ?? (serviceName.trim() || 'Service Charge'),
      serviceChargeType: patch.serviceChargeType ?? serviceType,
      serviceChargeValue:
        patch.serviceChargeValue ?? Math.max(0, parseFloat(serviceRate) || 0),
      serviceChargeTaxable: patch.serviceChargeTaxable ?? serviceTaxable,
      serviceChargeAutoApply: patch.serviceChargeAutoApply ?? serviceAutoApply,
      serviceChargeAllowCashierOverride:
        patch.serviceChargeAllowCashierOverride ?? serviceOverride,
    });
  };

  const logActivity = (action: string, detail: string) => {
    setActivity((a) => [
      { id: `a-${Date.now()}`, at: Date.now(), who: 'You', action, detail },
      ...a,
    ].slice(0, 40));
  };

  const saveAll = () => {
    setDirty(false);
    onBusinessNameChange?.(bizName.trim() || 'Cafe Delight');
    setReceiptHeader((h) => (h === businessName ? bizName.trim() || h : h));
    emitSalesSettings();
    logActivity('Saved settings', NAV.find((n) => n.id === active)?.label ?? 'Settings');
    ping('Soft-saved · live on Sales until you exit Try POS');
  };

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const discardAll = () => {
    if (!dirty) return;
    setShowDiscardConfirm(true);
  };

  const confirmDiscard = () => {
    setDirty(false);
    setShowDiscardConfirm(false);
    ping('Changes discarded');
  };

  // Catalog changes soft-save immediately so Sales reflects them without a separate save
  const softCatalogPing = (msg: string) => {
    markDirty();
    ping(`${msg} · live on Sales`);
  };

  const requestTab = (id: SettingsTab) => {
    if (id === active) return;
    if (dirty) {
      setPendingTab(id);
      return;
    }
    setActive(id);
  };

  const toggleGroup = (key: string) =>
    setOpenGroups((g) => ({ ...g, [key]: !g[key] }));

  const activeMeta = NAV.find((n) => n.id === active) ?? NAV[0];

  // Open modal helpers — mirrors EditEmployeeModal (add resets + auto password)
  const openEmployee = (emp?: Employee) => {
    setEmpFieldErrors({});
    setDraftRolesOpen(false);
    setDraftDiscountsOpen(false);
    setShowDraftPass(false);
    setShowDraftConfirmPass(false);
    setDraftConfirmPass('');
    setDraftEmail('');
    setDraftAllDiscounts(true);
    setDraftAllowedDiscountIds([]);

    if (!emp) {
      setDraftName('');
      setDraftUsername('');
      setDraftBaseRole('USER');
      setDraftCustomRoleId('');
      // Demo only: optional prefilled 6-digit password label (still called password)
      setDraftPin(String(Math.floor(100000 + Math.random() * 900000)));
      setDraftPass('');
      setDraftPosAccess(true);
      setDraftBackofficeAccess(false);
      setDraftPermIds(['discounts', 'refunds']);
      setDraftBoPermIds([]);
    } else {
      const roleRaw = String(emp.role || 'USER').toUpperCase();
      const base: 'ADMIN' | 'USER' =
        emp.owner || roleRaw === 'ADMIN' || roleRaw === 'OWNER' ? 'ADMIN' : 'USER';
      setDraftName(emp.name);
      setDraftUsername(emp.username);
      setDraftBaseRole(base);
      setDraftCustomRoleId(base === 'USER' ? (roleRaw === 'MANAGER' ? 'role-manager' : roleRaw === 'CASHIER' ? 'role-cashier' : roleRaw === 'BARISTA' ? 'role-barista' : 'role-cashier') : '');
      setDraftPin(emp.pin || '');
      setDraftPass('');
      setDraftPosAccess(true);
      setDraftBackofficeAccess(base === 'ADMIN');
      setDraftPermIds(
        base === 'ADMIN'
          ? DEMO_POS_PERMISSIONS.map((p) => p.id)
          : ['discounts', 'refunds', 'reprint_receipts'],
      );
      setDraftBoPermIds(base === 'ADMIN' ? DEMO_BACKOFFICE_PERMISSIONS.map((p) => p.id) : []);
    }
    setModal({ type: 'employee', emp });
  };

  const toggleDraftPerm = (id: string) => {
    setDraftPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleDraftBoPerm = (id: string) => {
    setDraftBoPermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const applyCustomRole = (roleId: string) => {
    const tpl = DEMO_CUSTOM_ROLES.find((r) => r.id === roleId);
    if (!tpl) return;
    setDraftBaseRole('USER');
    setDraftCustomRoleId(roleId);
    setDraftPosAccess(tpl.posAccess);
    setDraftBackofficeAccess(!!tpl.backofficeAccess);
    setDraftPermIds([...tpl.permissions]);
    setDraftBoPermIds([...(tpl.backofficePermissions ?? [])]);
    setDraftAllDiscounts(true);
    setDraftRolesOpen(false);
  };

  const applyAdminRole = () => {
    setDraftBaseRole('ADMIN');
    setDraftCustomRoleId('');
    setDraftPermIds(DEMO_POS_PERMISSIONS.map((p) => p.id));
    setDraftBoPermIds(DEMO_BACKOFFICE_PERMISSIONS.map((p) => p.id));
    setDraftPosAccess(true);
    setDraftBackofficeAccess(true);
    setDraftAllDiscounts(true);
    setDraftRolesOpen(false);
  };

  const validateEmployeeForm = (isAdd: boolean): boolean => {
    const errors: Record<string, string> = {};
    const uname = draftUsername.trim();
    if (!uname) errors.username = 'Username is required';
    else if (!/^[a-zA-Z0-9_]+$/.test(uname))
      errors.username = 'Username can only contain letters, numbers, and underscores';

    if (draftBaseRole === 'ADMIN' || draftBackofficeAccess) {
      if (!draftEmail.trim()) errors.email = 'Email is required for Admin users';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim()))
        errors.email = 'Please enter a valid email address';
    } else if (draftEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draftEmail.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (draftBaseRole !== 'ADMIN' && !draftCustomRoleId) {
      errors.role = 'Please select a role';
    }

    if (draftBaseRole === 'USER' && !draftPosAccess && !draftBackofficeAccess) {
      errors.permissions =
        'Enable Basic Sales Permissions or Advanced Back Office Permission to continue.';
      errors.general = errors.permissions;
    }

    if (isAdd) {
      if (!draftPass.trim()) errors.password = 'Password is required';
      else if (draftPass.length < 6)
        errors.password = 'Password must be at least 6 characters (any characters)';
      if (draftPass !== draftConfirmPass)
        errors.confirmPassword = 'Passwords do not match';
    } else if (draftPass || draftConfirmPass) {
      if (draftPass && draftPass.length < 6)
        errors.password = 'Password must be at least 6 characters (any characters)';
      if (draftPass !== draftConfirmPass)
        errors.confirmPassword = 'Passwords do not match';
    }

    setEmpFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openDeleteEmployee = (e: Employee) => {
    if (e.owner) {
      setInfoBanner({
        title: 'Owner protected',
        message: 'The account owner cannot be deactivated from employee management.',
        type: 'info',
      });
      return;
    }
    setDeletePass('');
    setDeletePassError('');
    setModal({
      type: 'delete',
      title: 'Delete Employee',
      body: `Are you sure you want to delete ${e.name}? This will remove their access to clock in on this terminal. Enter your password to confirm.`,
      confirmLabel: 'Delete Employee',
      onConfirm: () => {
        // Password confirmed in delete modal UI
        setEmployees((list) => list.filter((x) => x.id !== e.id));
        markDirty();
        logActivity('Deleted employee', e.name);
        ping('Employee deleted');
        setModal(null);
        setDeletePass('');
      },
    });
  };
  const openDiscount = (d?: Disc) => {
    setDraftName(d?.name ?? '');
    setDraftPct((d?.percentage ?? 10).toFixed(2));
    setDraftAdminOnly(false);
    setModal({ type: 'discount', d });
  };
  const openReward = (r?: Reward) => {
    setDraftName(r?.name ?? '');
    setDraftRewardType(r?.type ?? 'FREE_ITEM');
    setDraftRewardPoints(String(r?.points ?? 100));
    setDraftPct((r?.value ?? 10).toFixed(2));
    setModal({ type: 'reward', r });
  };
  const openPay = (p?: PayMethod) => {
    setDraftName(p?.name ?? '');
    setDraftEmoji(p?.emoji ?? '');
    setModal({ type: 'pay', p });
  };
  const openCard = (c?: CardType) => {
    setDraftName(c?.name ?? '');
    setModal({ type: 'card', c });
  };
  const openProduct = (p?: Product) => {
    setModal({ type: 'product', p });
  };

  const saveProductForm = (value: DemoProductFormValue) => {
    if (modal?.type !== 'product') return;
    if (modal.p) {
      setProducts((list) =>
        list.map((p) =>
          p.id === modal.p!.id
            ? {
                ...p,
                name: value.name,
                price: value.price,
                costPrice: value.costPrice,
                emoji: value.emoji,
                categoryId: value.categoryId,
                description: value.description,
                trackStock: value.trackStock,
                availableStock: value.availableStock,
                yellowThreshold: value.yellowThreshold,
                redThreshold: value.redThreshold,
                allowNegativeStock: value.allowNegativeStock,
                attributeIds: value.attributeIds,
                imageDataUrl: value.imageDataUrl,
                taxId: value.taxId,
                taxRate: value.taxRate,
              }
            : p,
        ),
      );
      logActivity('Edited product', value.name);
      softCatalogPing('Product updated');
    } else {
      const id = nextDemoId('p');
      setProducts((list) => [
        ...list,
        {
          id,
          name: value.name,
          price: value.price,
          costPrice: value.costPrice,
          emoji: value.emoji,
          categoryId: value.categoryId,
          active: true,
          description: value.description,
          trackStock: value.trackStock,
          availableStock: value.availableStock,
          yellowThreshold: value.yellowThreshold,
          redThreshold: value.redThreshold,
          allowNegativeStock: value.allowNegativeStock,
          attributeIds: value.attributeIds,
          imageDataUrl: value.imageDataUrl,
          taxId: value.taxId,
          taxRate: value.taxRate,
        },
      ]);
      logActivity('Added product', value.name);
      softCatalogPing('Product added');
    }
    setModal(null);
  };
  const openCategory = (c?: Category) => {
    setDraftName(c?.name ?? '');
    setDraftEmoji(c?.emoji ?? '');
    setDraftIcon(c?.icon ?? '');
    setModal({ type: 'category', c });
  };
  // Save a product's stock from the Stock Management "Item Stock" tab.
  // Writes straight into the shared catalog so Sales & Product Management match.
  const saveStock = (productId: string) => {
    const raw = stockEdits[productId];
    if (raw === undefined || raw === '') return;
    const next = parseInt(raw, 10);
    if (!Number.isFinite(next) || next < 0) return;
    const prod = products.find((p) => p.id === productId);
    if (!prod || next === (prod.availableStock ?? 0)) return;
    setProducts((list) =>
      list.map((p) => (p.id === productId ? { ...p, availableStock: next } : p)),
    );
    setStockEdits((e) => {
      const copy = { ...e };
      delete copy[productId];
      return copy;
    });
    markDirty();
    logActivity('Updated stock', `${prod.name} → ${next}`);
    ping(`Stock updated · ${prod.name}`);
  };

  const toggleAddonAvailability = (groupId: string, optId: string) => {
    setAddons((groups) =>
      groups.map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: g.options.map((o) =>
                o.id === optId ? { ...o, available: o.available === false } : o,
              ),
            }
          : g,
      ),
    );
    markDirty();
  };
  const openAddonOpt = (groupId: string, opt?: { id: string; name: string; price: number }) => {
    setDraftName(opt?.name ?? '');
    setDraftPrice((opt?.price ?? 0).toFixed(2));
    setModal({ type: 'addon-opt', groupId, opt });
  };
  const openAddonGroup = (g?: AddonGroup) => {
    setDraftName(g?.name ?? '');
    setDraftMulti(!!g?.multi);
    setDraftRequired(!!g?.required);
    setModal({ type: 'addon-group', g });
  };

  const saveModal = () => {
    if (!modal) return;
    if (modal.type === 'employee') {
      const isAdd = !modal.emp;
      if (!validateEmployeeForm(isAdd)) return;
      const uname = draftUsername.trim();
      const displayName = draftName.trim() || uname;
      const roleLabel =
        draftBaseRole === 'ADMIN'
          ? 'ADMIN'
          : DEMO_CUSTOM_ROLES.find((r) => r.id === draftCustomRoleId)?.name || 'USER';
      if (modal.emp) {
        setEmployees((list) =>
          list.map((e) =>
            e.id === modal.emp!.id
              ? {
                  ...e,
                  name: displayName,
                  username: uname,
                  role: e.owner ? 'Owner' : roleLabel,
                  pin: String(draftPin).slice(0, 32) || e.pin,
                }
              : e,
          ),
        );
        logActivity('Updated employee', displayName);
        ping('Employee updated');
        setInfoBanner({
          title: 'Saved',
          message: `${displayName} was updated. Soft-save until you exit Try POS.`,
          type: 'success',
        });
      } else {
        const nonOwners = employees.filter((e) => !e.owner).length;
        if (nonOwners >= MAX_EMPLOYEES) {
          setInfoBanner({
            title: 'Error',
            message: `Maximum is ${MAX_EMPLOYEES} employees. To add more, contact Mintcom support at support@mintcompos.com with your account email. Never share your password.`,
            type: 'error',
          });
          return;
        }
        setEmployees((list) => [
          {
            id: `e-${Date.now()}`,
            name: displayName,
            username: uname,
            role: roleLabel,
            pin: String(draftPin).slice(0, 32) || '111111',
            emoji: '',
          },
          ...list,
        ]);
        logActivity('Added employee', displayName);
        ping('Employee added');
        setInfoBanner({
          title: 'Employee added',
          message: `${displayName} can clock in with username “${uname}” and auto-generated password ${draftPin}.`,
          type: 'success',
        });
      }
      markDirty();
      setModal(null);
      return;
    } else if (modal.type === 'discount') {
      const pct = Math.min(100, Math.max(0, parseFloat(draftPct) || 0));
      if (!draftName.trim()) return;
      if (modal.d) {
        setDiscounts((list) =>
          list.map((d) => (d.id === modal.d!.id ? { ...d, name: draftName.trim(), percentage: pct } : d)),
        );
        ping('Discount updated');
      } else {
        setDiscounts((list) => [
          ...list,
          { id: `d-${Date.now()}`, name: draftName.trim(), percentage: pct, active: true },
        ]);
        logActivity('Added discount', `${draftName.trim()} ${pct}%`);
        ping('Discount added');
      }
      markDirty();
    } else if (modal.type === 'pay') {
      if (!draftName.trim()) return;
      if (modal.p) {
        setPayMethods((list) =>
          list.map((p) => (p.id === modal.p!.id ? { ...p, name: draftName.trim(), emoji: draftEmoji } : p)),
        );
        ping('Payment method updated');
      } else {
        setPayMethods((list) => [
          ...list,
          { id: `pm-${Date.now()}`, name: draftName.trim(), emoji: draftEmoji || '', active: true },
        ]);
        logActivity('Added payment method', draftName.trim());
        ping('Payment method added');
      }
      markDirty();
    } else if (modal.type === 'card') {
      if (!draftName.trim()) return;
      if (modal.c) {
        setCardTypes((list) =>
          list.map((c) => (c.id === modal.c!.id ? { ...c, name: draftName.trim() } : c)),
        );
        ping('Card type updated');
      } else {
        setCardTypes((list) => [...list, { id: `ct-${Date.now()}`, name: draftName.trim(), active: true }]);
        ping('Card type added');
      }
      markDirty();
    } else if (modal.type === 'reward') {
      if (!draftName.trim()) return;
      const pts = Math.max(0, parseInt(draftRewardPoints, 10) || 0);
      const val = draftRewardType === 'DISCOUNT' ? Math.min(100, Math.max(0, parseFloat(draftPct) || 0)) : undefined;
      if (modal.r) {
        setRewards((list) =>
          list.map((r) =>
            r.id === modal.r!.id ? { ...r, name: draftName.trim(), type: draftRewardType, points: pts, value: val } : r,
          ),
        );
        ping('Reward updated');
      } else {
        setRewards((list) => [
          ...list,
          { id: `rw-${Date.now()}`, name: draftName.trim(), type: draftRewardType, points: pts, value: val },
        ]);
        ping('Reward added');
      }
      markDirty();
    } else if (modal.type === 'category') {
      if (!draftName.trim() || !draftIcon) return;
      if (modal.c) {
        setCategories((list) =>
          list.map((c) =>
            c.id === modal.c!.id ? { ...c, name: draftName.trim(), icon: draftIcon } : c,
          ),
        );
        softCatalogPing('Category updated');
      } else {
        setCategories((list) => [
          ...list,
          { id: `c-${Date.now()}`, name: draftName.trim(), emoji: '', icon: draftIcon, active: true },
        ]);
        logActivity('Added category', draftName.trim());
        softCatalogPing('Category added');
      }
    } else if (modal.type === 'addon-opt') {
      const price = Math.max(0, parseFloat(draftPrice) || 0);
      if (!draftName.trim()) return;
      setAddons((groups) =>
        groups.map((g) => {
          if (g.id !== modal.groupId) return g;
          if (modal.opt) {
            return {
              ...g,
              options: g.options.map((o) =>
                o.id === modal.opt!.id ? { ...o, name: draftName.trim(), price } : o,
              ),
            };
          }
          return {
            ...g,
            options: [...g.options, { id: `o-${Date.now()}`, name: draftName.trim(), price }],
          };
        }),
      );
      softCatalogPing(modal.opt ? 'Add-on option updated' : 'Add-on option added');
    } else if (modal.type === 'addon-group') {
      if (!draftName.trim()) return;
      if (modal.g) {
        setAddons((groups) =>
          groups.map((g) =>
            g.id === modal.g!.id
              ? { ...g, name: draftName.trim(), multi: draftMulti, required: draftRequired }
              : g,
          ),
        );
        softCatalogPing('Attribute updated');
      } else {
        const newId = nextDemoId('ag');
        setAddons((groups) => [
          ...groups,
          { id: newId, name: draftName.trim(), multi: draftMulti, required: draftRequired, options: [] },
        ]);
        setExpandedAttr(newId);
        logActivity('Added attribute', draftName.trim());
        softCatalogPing('Attribute added');
      }
    } else if (modal.type === 'printer') {
      logActivity('Updated printer settings', `${paperWidth}mm paper`);
      ping('Printer settings saved');
      markDirty();
    }
    setModal(null);
  };

  useEffect(() => {
    // Demo banner so users know nothing is saved to a server
  }, []);

  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden p-3 font-sans sm:p-4">
      {/* Use div not h1 — site CSS forces Magilio on h1/h2; POS uses Inter */}
      <p className="mb-3 shrink-0 text-[22px] font-bold tracking-[-0.02em] text-text-primary dark:text-white sm:text-[26px]">
        Settings
      </p>

      {/* Two cards — stacked on phones, nav rail + content on sm+ */}
      <div className="flex min-h-0 flex-1 flex-col sm:flex-row gap-3 sm:gap-5 overflow-hidden">
        <aside className="w-full sm:w-60 shrink-0 overflow-x-auto sm:overflow-y-auto rounded-xl bg-gray-100 p-2 dark:bg-mintcom-dark no-scrollbar">
          <div className="flex flex-row sm:flex-col gap-2 sm:gap-2.5 py-1">
            {NAV.map((item) => {
              const on = active === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => requestTab(item.id)}
                  className={`flex min-h-[44px] shrink-0 snap-start items-center gap-2 sm:gap-3.5 rounded-xl px-3 sm:px-3.5 py-2.5 sm:py-3 text-start transition-all ${
                    on
                      ? 'bg-mintcom-green text-white shadow-md shadow-mintcom-green/25'
                      : 'text-text-primary hover:bg-white dark:text-white dark:hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span className="whitespace-nowrap text-[13px] font-semibold sm:whitespace-normal">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right card — content (POS SettingsHeader + body) */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-[#F3F4F6] dark:bg-mintcom-dark">
          <div className="shrink-0 border-b border-[#E5E7EB] px-4 pb-4 pt-4 dark:border-white/8 sm:px-6 sm:pt-5">
            <p className="text-[20px] font-bold tracking-[-0.2px] text-[#111827] dark:text-white">
              {activeMeta.label}
            </p>
            <p className="mt-0.5 text-[13px] font-normal leading-[18px] text-[#6B7280] opacity-90 dark:text-mintcom-textSecondary">
              {active === 'business'
                ? `Manage details for ${bizName.trim() || 'Cafe Delight'}`
                : activeMeta.sub}
            </p>
          </div>

          <div
            className={`min-h-0 flex-1 overscroll-contain ${
              active === 'manufacturing'
                ? 'flex flex-col overflow-hidden p-4 sm:p-5 md:px-6 md:py-4'
                : 'overflow-y-auto p-2.5 sm:p-3 md:p-4'
            }`}
          >
          {/* ── Main Settings (mirrors mintcom-pos YourBusinessScreen) ── */}
          {active === 'business' && (
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-0 pb-2">
              {/* Business profile — read-only logo / name / join date */}
              <Shell>
                <div className="space-y-5 p-5 sm:p-6">
                  <div>
                    <p className="mb-3 text-[15px] font-medium tracking-wide text-text-primary dark:text-white">
                      Brand Logo
                    </p>
                    <div className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-gray-200 bg-cream-50 py-4 opacity-70 dark:border-white/10 dark:bg-mintcom-dark">
                      <UploadCloud size={20} className="text-text-tertiary" />
                      <span className="text-sm font-medium text-text-tertiary">Upload logo</span>
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 text-[15px] font-medium tracking-wide text-text-primary dark:text-white">
                      Business Name
                    </p>
                    <input
                      readOnly
                      value={bizName}
                      className="w-full cursor-default rounded-xl border border-gray-200 bg-cream-50 px-3.5 py-3 text-[15px] text-text-primary outline-none dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                    />
                  </div>
                  <div>
                    <p className="mb-3 text-[15px] font-medium tracking-wide text-text-primary dark:text-white">
                      Join Date
                    </p>
                    <input
                      readOnly
                      value={joinDate}
                      className="w-full cursor-default rounded-xl border border-gray-200 bg-cream-50 px-3.5 py-3 text-[15px] text-text-primary outline-none dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                    />
                  </div>
                  <div
                    className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
                    style={{ background: '#FFFBEB', borderColor: '#F59E0B' }}
                  >
                    <Info size={16} className="mt-0.5 shrink-0" style={{ color: '#B45309' }} />
                    <p className="text-[12px] leading-relaxed" style={{ color: '#B45309' }}>
                      Business name and logo can only be changed from the Online Portal (Website) or back office app.
                    </p>
                  </div>
                </div>
              </Shell>

              {/* Employees */}
              <p className="mb-2.5 mt-6 text-[16px] font-bold tracking-wide text-text-primary dark:text-white">
                Employees ({employees.length})
              </p>
              <Shell>
                <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-white/10">
                  <span className="min-w-0 flex-1 text-[13px] font-bold text-text-primary dark:text-white">
                    Employee Name
                  </span>
                  <span className="hidden min-w-0 flex-1 text-[13px] font-bold text-text-primary sm:block dark:text-white">
                    Username
                  </span>
                  <span className="w-[64px] sm:w-[88px] shrink-0 truncate text-[13px] font-bold text-text-primary dark:text-white">
                    Role
                  </span>
                  <div className="w-[88px] shrink-0 text-end">
                    <button
                      type="button"
                      onClick={() => openEmployee()}
                      className="inline-flex min-h-[40px] items-center gap-1 rounded-xl bg-mintcom-green px-3 py-1.5 text-[12px] font-bold text-white shadow-sm"
                    >
                      <span className="text-sm leading-none">+</span> Add
                    </button>
                  </div>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {employees.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center gap-2 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-white/5"
                      style={e.owner ? { background: 'rgba(245,158,11,0.08)' } : undefined}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-text-primary dark:text-white">{e.name}</p>
                        <p className="truncate text-[12px] text-text-secondary sm:hidden dark:text-mintcom-textSecondary">
                          {e.username}
                        </p>
                      </div>
                      <span className="hidden min-w-0 flex-1 truncate text-[13px] text-text-primary sm:block dark:text-white">
                        {e.username}
                      </span>
                      <span
                        className={`w-[64px] sm:w-[88px] shrink-0 truncate text-[12px] sm:text-[13px] font-semibold ${
                          e.owner ? 'text-[#B45309]' : 'text-mintcom-green'
                        }`}
                      >
                        {e.owner ? 'Owner' : e.role}
                      </span>
                      <div className="flex w-[96px] shrink-0 items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEmployee(e)}
                          aria-label="Edit employee"
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-mintcom-green hover:bg-mintcom-green/10"
                          title="Edit"
                        >
                          <Pencil size={18} />
                        </button>
                        {e.owner ? (
                          <span
                            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#B45309]"
                            title="Owner protected"
                          >
                            <Shield size={18} />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openDeleteEmployee(e)}
                            aria-label="Delete employee"
                            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#D55263] hover:bg-mintcom-red/10"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {employees.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-semibold text-text-secondary">You have no employees yet</p>
                      <p className="mt-1 text-xs text-text-tertiary">Add team members who can clock in on this terminal.</p>
                    </div>
                  )}
                </div>
              </Shell>

              {/* Hold Order Settings */}
              <p className="mb-2.5 mt-6 text-[16px] font-bold tracking-wide text-text-primary dark:text-white">
                Hold Order Settings
              </p>
              <Shell>
                <div className="p-4 sm:p-5">
                  <div className="mb-2 flex items-center">
                    <span className="text-[15px] font-medium text-text-primary dark:text-white">
                      Tables Available
                    </span>
                    <InfoDot text={`Number of tables (Table 1, Table 2...) shown when holding an order. Maximum ${MAX_HOLD_ORDER_TABLES}.`} />
                  </div>
                  <input
                    value={tableCount === 0 ? '' : String(tableCount)}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, MAX_HOLD_ORDER_TABLE_DIGITS);
                      if (!clean) {
                        setTableCount(0);
                        setHoldTableMaxError(false);
                        markDirty();
                        return;
                      }
                      const n = parseInt(clean, 10);
                      if (n > MAX_HOLD_ORDER_TABLES) {
                        setTableCount(MAX_HOLD_ORDER_TABLES);
                        setHoldTableMaxError(true);
                        markDirty();
                        return;
                      }
                      setTableCount(n);
                      setHoldTableMaxError(false);
                      markDirty();
                    }}
                    maxLength={MAX_HOLD_ORDER_TABLE_DIGITS}
                    inputMode="numeric"
                    placeholder={`e.g. ${DEFAULT_HOLD_ORDER_TABLE_COUNT}`}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-[15px] font-medium outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                  />
                  {holdTableMaxError && (
                    <p className="mt-2 text-[12px] font-medium text-[#D55263]">
                      Maximum is {MAX_HOLD_ORDER_TABLES} tables.
                    </p>
                  )}
                </div>
              </Shell>

              {/* Receipt & Printer */}
              <p className="mb-2.5 mt-6 text-[16px] font-bold tracking-wide text-text-primary dark:text-white">
                Receipt &amp; Printer
              </p>
              <Shell>
                {/* Change Receipt Setting — expandable */}
                <button
                  type="button"
                  onClick={() => setReceiptSettingsOpen((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 text-start dark:border-white/10"
                >
                  <span className="flex items-center gap-2 text-[15px] font-medium text-text-primary dark:text-white">
                    <FileText size={18} className="text-text-primary dark:text-white" />
                    Change Receipt Setting
                  </span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-text-secondary transition-transform ${receiptSettingsOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {receiptSettingsOpen && (
                  <div className="space-y-4 border-b border-gray-200 p-4 dark:border-white/10">
                    {/* Identity Visibility */}
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                      <p className="text-[15px] font-bold text-text-primary dark:text-white">Identity Visibility</p>
                      <p className="mb-4 mt-1 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                        Control which business identity fields appear on printed receipts.
                      </p>
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-[14px] font-medium text-text-primary dark:text-white">Business Name</span>
                            <span className="flex items-center gap-2">
                              <span className="text-[12px] text-text-secondary">Show</span>
                              <Toggle
                                on={showBizNameOnReceipt}
                                onToggle={() => {
                                  setShowBizNameOnReceipt((v) => !v);
                                  markDirty();
                                }}
                              />
                            </span>
                          </div>
                          <input
                            value={receiptHeader}
                            disabled={!showBizNameOnReceipt}
                            onChange={(e) => {
                              setReceiptHeader(e.target.value);
                              markDirty();
                            }}
                            className={`${inputCls} ${!showBizNameOnReceipt ? 'opacity-50' : ''}`}
                            placeholder="Business name on receipt"
                          />
                        </div>
                        <div className="border-t border-gray-100 pt-4 dark:border-white/8">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="text-[14px] font-medium text-text-primary dark:text-white">Description</span>
                            <span className="flex items-center gap-2">
                              <span className="text-[12px] text-text-secondary">Show</span>
                              <Toggle
                                on={showDescription}
                                onToggle={() => {
                                  setShowDescription((v) => !v);
                                  markDirty();
                                }}
                              />
                            </span>
                          </div>
                          <input
                            value={bizDescription}
                            disabled={!showDescription}
                            onChange={(e) => {
                              setBizDescription(e.target.value);
                              markDirty();
                            }}
                            className={`${inputCls} ${!showDescription ? 'opacity-50' : ''}`}
                            placeholder="e.g. Specialty Coffee House"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Branding Protocol */}
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                      <p className="text-[15px] font-bold text-text-primary dark:text-white">Branding Protocol</p>
                      <p className="mb-4 mt-1 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                        Logo display rules for thermal receipts.
                      </p>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <span className="text-[14px] font-medium text-text-primary dark:text-white">Show Logo</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[12px] text-text-secondary">Show</span>
                          <Toggle
                            on={showLogo}
                            onToggle={() => {
                              setShowLogo((v) => !v);
                              markDirty();
                            }}
                          />
                        </span>
                      </div>
                      <div className={showLogo ? '' : 'pointer-events-none opacity-50'}>
                        <button
                          type="button"
                          onClick={() => ping('Demo only: receipt logo upload is managed on the real POS')}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-cream-50 py-3 text-sm font-medium text-text-primary dark:border-white/10 dark:bg-mintcom-dark dark:text-white"
                        >
                          <UploadCloud size={18} /> Upload logo
                        </button>
                      </div>
                    </div>

                    {/* Location Metadata */}
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                      <p className="text-[15px] font-bold text-text-primary dark:text-white">Location Metadata</p>
                      <p className="mb-4 mt-1 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                        Address lines printed under the business name.
                      </p>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[14px] font-medium text-text-primary dark:text-white">Address</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[12px] text-text-secondary">Show</span>
                          <Toggle
                            on={showAddress}
                            onToggle={() => {
                              setShowAddress((v) => !v);
                              markDirty();
                            }}
                          />
                        </span>
                      </div>
                      <input
                        value={bizAddress}
                        disabled={!showAddress}
                        onChange={(e) => {
                          setBizAddress(e.target.value);
                          markDirty();
                        }}
                        className={`${inputCls} ${!showAddress ? 'opacity-50' : ''}`}
                        placeholder="e.g. 123 Main Street, Springfield, IL"
                      />
                    </div>

                    {/* Regulatory Data */}
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                      <div className="mb-1 flex items-center gap-1">
                        <p className="text-[15px] font-bold text-text-primary dark:text-white">Regulatory Data</p>
                        <InfoDot text="Tax ID/TRN is your tax registration number shown on receipts. The receipt number is a separate numeric value used to start invoice numbering." />
                      </div>
                      <p className="mb-4 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                        Tax ID and invoice start number for compliance.
                      </p>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[14px] font-medium text-text-primary dark:text-white">Tax ID / TRN</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[12px] text-text-secondary">Show</span>
                          <Toggle
                            on={showTaxId}
                            onToggle={() => {
                              setShowTaxId((v) => !v);
                              markDirty();
                            }}
                          />
                        </span>
                      </div>
                      <input
                        value={taxIdNumber}
                        disabled={!showTaxId}
                        onChange={(e) => {
                          setTaxIdNumber(
                            e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9 \-/.]/g, '')
                              .slice(0, 32),
                          );
                          markDirty();
                        }}
                        className={`${inputCls} ${!showTaxId ? 'opacity-50' : ''}`}
                        placeholder="e.g. DE123456789"
                      />
                      <p className="mb-3 mt-2 text-[12px] text-text-secondary">
                        This may be legally required in your country. Check your local tax rules and add it if needed.
                      </p>
                      <div
                        className="mb-4 flex items-start gap-2 rounded-xl border px-3 py-2.5"
                        style={{ background: '#FFFBEB', borderColor: '#F59E0B' }}
                      >
                        <Info size={14} className="mt-0.5 shrink-0" style={{ color: '#E6A23C' }} />
                        <p className="text-[12px] leading-relaxed" style={{ color: '#5C3A21' }}>
                          For e-invoicing providers (JoFotara / ZATCA), configure{' '}
                          <button
                            type="button"
                            className="font-bold text-mintcom-green underline"
                            onClick={() => {
                              setActive('sales');
                              setOpenGroups((g) => ({ ...g, fiscal: true }));
                              ping('Opened Payment Processes · E-Invoicing');
                            }}
                          >
                            E-Invoicing &amp; Tax Compliance
                          </button>{' '}
                          under Payment Processes.
                        </p>
                      </div>
                      <div className="mb-2 flex items-center gap-1">
                        <span className="text-[14px] font-medium text-text-primary dark:text-white">
                          Receipt Number Start
                        </span>
                        <InfoDot text="Optional. The number receipt/invoice numbering begins from. Leave empty to use the default." />
                      </div>
                      <input
                        value={invoiceStart}
                        onChange={(e) => {
                          setInvoiceStart(e.target.value.replace(/\D/g, '').slice(0, 12));
                          markDirty();
                        }}
                        inputMode="numeric"
                        className={inputCls}
                        placeholder="e.g., 1000"
                      />
                    </div>

                    {/* Client Relations */}
                    <div className="rounded-xl border border-gray-200 p-4 dark:border-white/10">
                      <p className="text-[15px] font-bold text-text-primary dark:text-white">Client Relations</p>
                      <p className="mb-4 mt-1 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                        Farewell line printed at the bottom of the receipt.
                      </p>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-[14px] font-medium text-text-primary dark:text-white">Farewell Message</span>
                        <span className="flex items-center gap-2">
                          <span className="text-[12px] text-text-secondary">Show</span>
                          <Toggle
                            on={showFarewell}
                            onToggle={() => {
                              setShowFarewell((v) => !v);
                              markDirty();
                            }}
                          />
                        </span>
                      </div>
                      <input
                        value={receiptFooter}
                        disabled={!showFarewell}
                        onChange={(e) => {
                          setReceiptFooter(e.target.value);
                          markDirty();
                        }}
                        className={`${inputCls} ${!showFarewell ? 'opacity-50' : ''}`}
                        placeholder="e.g., Thank you, come again!"
                      />
                    </div>
                  </div>
                )}

                {/* Printer Settings row — opens modal like POS */}
                <button
                  type="button"
                  onClick={() => setModal({ type: 'printer' })}
                  className="flex w-full items-center justify-between gap-3 px-4 py-4 text-start"
                >
                  <span className="flex items-center gap-2 text-[15px] font-medium text-text-primary dark:text-white">
                    <Printer size={18} />
                    Printer Settings
                  </span>
                  <ChevronRight size={20} className="text-text-secondary" />
                </button>
              </Shell>

              {/* Customize Theme */}
              <p className="mb-2.5 mt-6 text-[16px] font-bold tracking-wide text-text-primary dark:text-white">
                Customize Theme
              </p>
              <Shell>
                <div className="p-4 sm:p-5">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {THEMES.map((t) => {
                      const primary = t.colors[2];
                      const selected = themeId === t.id && !useDeviceTheme;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setThemeId(t.id);
                            setUseDeviceTheme(false);
                            markDirty();
                            ping(`Theme · ${t.name}`);
                          }}
                          className="flex items-center justify-between gap-3 rounded-xl border border-transparent p-2 text-start transition-colors hover:bg-cream-50 dark:hover:bg-white/[0.04]"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <span
                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white dark:bg-mintcom-surface"
                              style={{ borderColor: selected ? primary : '#D1D5DB' }}
                            >
                              {selected && (
                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: primary }} />
                              )}
                            </span>
                            <span className="text-[14px] font-medium text-text-primary dark:text-white">{t.name}</span>
                          </span>
                          <span className="flex shrink-0 overflow-hidden rounded-lg shadow-sm">
                            {t.colors.map((c) => (
                              <span key={c} className="h-7 w-5 sm:w-6" style={{ background: c }} />
                            ))}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/8">
                    <span className="text-[14px] font-medium text-text-primary dark:text-white">
                      Use Device Settings
                    </span>
                    <Toggle
                      on={useDeviceTheme}
                      onToggle={() => {
                        setUseDeviceTheme((v) => !v);
                        markDirty();
                        ping(useDeviceTheme ? 'Custom theme' : 'Following device theme');
                      }}
                    />
                  </div>
                </div>
              </Shell>
            </div>
          )}

          {/* ── Payment Processes (mirrors POS SalesManagementScreen) ── */}
          {active === 'sales' && (
            <div className="mx-auto flex max-w-2xl flex-col gap-5">
              {/* Taxes — mirrors POS TaxRatesGroup */}
              <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-mintcom-surface">
                {/* Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                      <Percent size={18} />
                    </span>
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="text-[15px] font-bold text-text-primary dark:text-white">
                          Taxes
                        </span>
                        <InfoDot text="Product prices include tax. Tax is shown separately on the receipt." />
                      </div>
                      <p className="text-[12px] text-text-tertiary">
                        Standard default sales tax · add custom rates per product
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTaxNameError('');
                      setTaxRateError('');
                      setTaxEditor({
                        id: null,
                        name: '',
                        ratePercent: '16',
                      });
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-mintcom-green px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition-colors hover:bg-mintcom-green/90"
                  >
                    <Plus size={15} />
                    <span>Add Tax</span>
                  </button>
                </div>

                {/* Pricing Context Banner */}
                <div className="my-3.5 flex items-center gap-2.5 rounded-xl border border-blue-500/20 bg-blue-50/80 p-3 text-[12px] dark:border-blue-400/20 dark:bg-blue-950/20">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    <Info size={14} />
                  </span>
                  <span className="text-blue-900 dark:text-blue-300">
                    Product prices include tax. Tax is shown separately on receipts and invoices.
                  </span>
                </div>

                {/* Search Bar (when multiple rates exist) */}
                {taxesList.length > 2 && (
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 dark:border-white/10 dark:bg-mintcom-dark">
                    <Search size={14} className="text-text-tertiary" />
                    <input
                      value={taxFilter}
                      onChange={(e) => setTaxFilter(e.target.value)}
                      placeholder="Search tax rates by name or rate…"
                      className="flex-1 bg-transparent text-[12px] outline-none dark:text-white"
                    />
                    {taxFilter && (
                      <button type="button" onClick={() => setTaxFilter('')}>
                        <X size={14} className="text-text-tertiary" />
                      </button>
                    )}
                  </div>
                )}

                {/* Empty State */}
                {taxesList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 py-8 text-center dark:border-white/10">
                    <Percent size={28} className="text-text-tertiary" />
                    <p className="text-[13px] font-bold text-text-primary dark:text-white">
                      No tax rates yet
                    </p>
                    <p className="text-[11px] text-text-tertiary">
                      Configure standard sales tax or custom rates.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setTaxNameError('');
                        setTaxRateError('');
                        setTaxEditor({ id: null, name: '', ratePercent: '16' });
                      }}
                      className="mt-1 flex items-center gap-1.5 rounded-xl bg-mintcom-green px-3 py-1.5 text-[12px] font-bold text-white"
                    >
                      <Plus size={14} />
                      <span>Create Tax Rate</span>
                    </button>
                  </div>
                ) : filteredTaxes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
                    <Search size={20} className="text-text-tertiary" />
                    <p className="text-[12px] text-text-secondary">
                      No rates match “{taxFilter}”
                    </p>
                    <button
                      type="button"
                      onClick={() => setTaxFilter('')}
                      className="text-[11px] font-bold text-mintcom-green"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                    {/* Header Row */}
                    <div className="flex items-center border-b border-gray-200 bg-gray-50/80 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-text-tertiary dark:border-white/10 dark:bg-white/[0.03]">
                      <span className="flex-1">Tax Name</span>
                      <span className="w-24 text-center">Rate</span>
                      <span className="w-24 text-end">Actions</span>
                    </div>

                    {/* Tax items */}
                    {filteredTaxes.map((item, idx) => {
                      const isLast = idx === filteredTaxes.length - 1;
                      return (
                        <div
                          key={item.id}
                          className={`flex items-center px-4 py-3 ${
                            isLast ? '' : 'border-b border-gray-100 dark:border-white/5'
                          } ${
                            item.isDefault
                              ? 'bg-mintcom-green/[0.06] dark:bg-mintcom-green/[0.08]'
                              : ''
                          }`}
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="truncate text-[13px] font-bold text-text-primary dark:text-white">
                              {item.name}
                            </span>
                            {item.isDefault && (
                              <span className="rounded bg-mintcom-green/15 px-1.5 py-0.5 text-[10px] font-extrabold text-mintcom-green">
                                Default
                              </span>
                            )}
                          </div>

                          <span className="w-24 text-center text-[13px] font-extrabold tabular-nums text-text-primary dark:text-white">
                            {(item.rate * 100).toFixed(0)}%
                          </span>

                          <div className="flex w-24 items-center justify-end gap-1.5">
                            {item.isDefault ? (
                              <button
                                type="button"
                                onClick={() => setShowDefaultTaxLockModal(true)}
                                title="Default tax is protected"
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/[0.04] text-text-tertiary hover:bg-black/[0.08] dark:bg-white/[0.06]"
                              >
                                <Lock size={13} />
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => {
                                setTaxNameError('');
                                setTaxRateError('');
                                setTaxEditor({
                                  id: item.id,
                                  name: item.name,
                                  ratePercent: (item.rate * 100)
                                    .toFixed(2)
                                    .replace(/\.00$/, ''),
                                  isDefault: item.isDefault,
                                });
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-mintcom-green/15 text-mintcom-green hover:bg-mintcom-green/25"
                              title="Edit"
                            >
                              <Pencil size={13} />
                            </button>

                            {!item.isDefault && (
                              <button
                                type="button"
                                onClick={() => setTaxToDelete(item)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10 text-[#D55263] hover:bg-red-500/20"
                                title="Delete"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Footnote */}
                    <div className="flex items-center gap-2 border-t border-gray-200 bg-gray-50/50 px-4 py-2.5 text-[11px] text-text-tertiary dark:border-white/10 dark:bg-white/[0.02]">
                      <RefreshCw size={12} className="shrink-0" />
                      <span>
                        The default sales tax applies to new products. Custom rates can be assigned directly to individual products.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Fiscal Compliance (standalone card matching POS FiscalComplianceGroup) */}
              <div className="rounded-xl border border-gray-300 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-mintcom-surface">
                <button
                  type="button"
                  onClick={() => toggleGroup('fiscal')}
                  className="flex w-full items-center justify-between text-start"
                >
                  <span className="flex items-center text-[15px] font-semibold text-text-primary dark:text-white">
                    E-Invoicing &amp; Tax Compliance
                    <InfoDot text="Fiscal providers (JoFotara / ZATCA) and a verification QR on receipts." />
                  </span>
                  <div className="flex items-center gap-2">
                    <Toggle
                      on={fiscalOn}
                      onToggle={() => {
                        setFiscalOn((v) => !v);
                        markDirty();
                        ping(fiscalOn ? 'Fiscal off' : 'Fiscal on (demo)');
                      }}
                    />
                    <ChevronDown
                      size={20}
                      className={`text-text-secondary transition-transform ${openGroups.fiscal ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>
                {openGroups.fiscal && (
                  <p className="mt-3 text-[12px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                    On the real POS this configures country fiscal providers (e.g. JoFotara / ZATCA) and prints a
                    verification QR on receipts. In the sandbox it only flips a local flag.
                  </p>
                )}
              </div>

              {/* Service Charge */}
              <div className="rounded-xl border border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-surface">
                <button
                  type="button"
                  onClick={() => serviceOn && toggleGroup('service')}
                  className="flex w-full items-center justify-between px-4 py-4 text-start"
                >
                  <span className="flex items-center text-[15px] font-semibold text-text-primary dark:text-white">
                    Service Charge
                    <InfoDot text="An optional charge added to orders, such as a service percentage." />
                  </span>
                  <div className="flex items-center gap-2">
                    {serviceOn && (
                      <ChevronDown
                        size={20}
                        className={`text-text-secondary transition-transform ${openGroups.service ? '' : 'rotate-180'}`}
                      />
                    )}
                    <Toggle
                      on={serviceOn}
                      onToggle={() => {
                        const next = !serviceOn;
                        setServiceOn(next);
                        markDirty();
                        emitSalesSettings({ serviceChargeEnabled: next });
                        ping(
                          next
                            ? 'Service charge on · live on Sales'
                            : 'Service charge off · hidden on Sales',
                        );
                      }}
                    />
                  </div>
                </button>
                {serviceOn && !openGroups.service && (
                  <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-white/8">
                    {/* Charge Name */}
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Charge Name</p>
                    <input
                      value={serviceName}
                      onChange={(e) => {
                        setServiceName(e.target.value);
                        markDirty();
                        emitSalesSettings({ serviceChargeName: e.target.value });
                      }}
                      className={`${inputCls} mb-3`}
                    />
                    {/* Charge Type */}
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Charge Type</p>
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      {(['PERCENTAGE', 'FIXED'] as const).map((opt) => {
                        const on = serviceType === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setServiceType(opt);
                              markDirty();
                              emitSalesSettings({ serviceChargeType: opt });
                            }}
                            className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[13px] font-bold ${
                              on
                                ? 'border-mintcom-green bg-mintcom-green text-white'
                                : 'border-gray-200 bg-white text-text-secondary dark:border-white/10 dark:bg-mintcom-dark dark:text-mintcom-textSecondary'
                            }`}
                          >
                            <span>{opt === 'PERCENTAGE' ? '%' : '$'}</span>
                            {opt === 'PERCENTAGE' ? 'Percentage' : 'Fixed Amount'}
                            {on && <Check size={14} />}
                          </button>
                        );
                      })}
                    </div>
                    {/* Value */}
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-text-tertiary">Value</p>
                    <div className="mb-3 flex items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-mintcom-dark">
                      <span className="flex h-11 w-11 items-center justify-center bg-mintcom-green/10 text-base font-extrabold text-mintcom-green">
                        {serviceType === 'PERCENTAGE' ? '%' : '$'}
                      </span>
                      <input
                        value={serviceRate}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
                          const cents = digits === '' ? 0 : parseInt(digits, 10);
                          const formatted = (cents / 100).toFixed(2);
                          setServiceRate(formatted);
                          markDirty();
                          emitSalesSettings({
                            serviceChargeValue: cents / 100,
                          });
                        }}
                        inputMode="numeric"
                        className="h-11 flex-1 bg-transparent px-3 text-sm font-bold outline-none dark:text-white tabular-nums"
                      />
                    </div>
                    <div className="my-2 h-px bg-gray-200 dark:bg-white/8" />
                    {(
                      [
                        {
                          label: 'Taxable',
                          desc: 'Include in tax calculation',
                          on: serviceTaxable,
                          key: 'serviceChargeTaxable' as const,
                          set: setServiceTaxable,
                        },
                        {
                          label: 'Auto Apply to Orders',
                          desc: 'Automatically add to every order',
                          on: serviceAutoApply,
                          key: 'serviceChargeAutoApply' as const,
                          set: setServiceAutoApply,
                        },
                        {
                          label: 'Allow Cashier Override',
                          desc: 'Cashiers can remove or modify',
                          on: serviceOverride,
                          key: 'serviceChargeAllowCashierOverride' as const,
                          set: setServiceOverride,
                        },
                      ] as const
                    ).map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="text-[13px] font-bold text-text-primary dark:text-white">{row.label}</p>
                          <p className="text-[11px] text-text-tertiary">{row.desc}</p>
                        </div>
                        <Toggle
                          on={row.on}
                          onToggle={() => {
                            const next = !row.on;
                            row.set(next);
                            markDirty();
                            emitSalesSettings({ [row.key]: next });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Types */}
              <SalesGroup
                title="Card Types"
                info="Choose what type of card payments you accept."
                open={!!openGroups.cards}
                onToggle={() => toggleGroup('cards')}
              >
                {cardTypes.map((c) => (
                  <SalesListRow
                    key={c.id}
                    icon={
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                        <CreditCard size={20} />
                      </span>
                    }
                    name={c.name}
                    onEdit={() => openCard(c)}
                    onDelete={() =>
                      setModal({
                        type: 'delete',
                        title: 'Delete Card Type',
                        body: `"${c.name}" will be removed from card payments.`,
                        onConfirm: () => {
                          setCardTypes((list) => list.filter((x) => x.id !== c.id));
                          markDirty();
                          setModal(null);
                          ping('Card type removed');
                        },
                      })
                    }
                  />
                ))}
                <AddLink label="Add Card Type" onClick={() => openCard()} />
              </SalesGroup>

              {/* Other Payment Methods */}
              <SalesGroup
                title="Other Payment Methods"
                info="Create various ways to accept payments like digital wallets or delivery apps."
                open={!!openGroups.payments}
                onToggle={() => toggleGroup('payments')}
              >
                {payMethods
                  .filter((p) => p.id !== 'cash' && p.id !== 'card')
                  .map((p) => (
                    <SalesListRow
                      key={p.id}
                      icon={<span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-lg">{p.emoji}</span>}
                      name={p.name}
                      onEdit={() => openPay(p)}
                      onDelete={() =>
                        setModal({
                          type: 'delete',
                          title: 'Remove Payment Method',
                          body: `"${p.name}" will be removed from checkout.`,
                          onConfirm: () => {
                            setPayMethods((list) => list.filter((x) => x.id !== p.id));
                            markDirty();
                            setModal(null);
                            ping('Payment method removed');
                          },
                        })
                      }
                    />
                  ))}
                <AddLink label="Add Other Payment Method" onClick={() => openPay()} />
              </SalesGroup>

              {/* Discount List */}
              <SalesGroup
                title="Discount List"
                open={!!openGroups.discounts}
                onToggle={() => toggleGroup('discounts')}
              >
                {discounts.map((d) => (
                  <SalesListRow
                    key={d.id}
                    icon={
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-mintcom-green/15 text-xs font-black text-mintcom-green">
                        {d.percentage}%
                      </span>
                    }
                    name={
                      <span>
                        {d.name} - ({d.percentage}%)
                        {!d.active && <span className="ms-2 text-[11px] font-bold text-text-tertiary">Inactive</span>}
                      </span>
                    }
                    onEdit={() => openDiscount(d)}
                    onDelete={() =>
                      setModal({
                        type: 'delete',
                        title: 'Remove Discount',
                        body: `Deactivate "${d.name} ${d.percentage}%"? Historical receipts keep their original snapshots.`,
                        onConfirm: () => {
                          setDiscounts((list) => list.filter((x) => x.id !== d.id));
                          markDirty();
                          setModal(null);
                          ping('Discount removed');
                        },
                      })
                    }
                  />
                ))}
                <AddLink label="Create Discount" onClick={() => openDiscount()} />
              </SalesGroup>

              {/* Loyalty Program */}
              <div className="rounded-xl border border-gray-300 bg-white shadow-sm dark:border-white/10 dark:bg-mintcom-surface">
                <div className="flex items-center justify-between px-4 py-4">
                  <span className="text-[15px] font-semibold text-text-primary dark:text-white">Loyalty Program</span>
                  <Toggle on={loyaltyOn} onToggle={() => { setLoyaltyOn((v) => !v); markDirty(); }} />
                </div>
                {loyaltyOn && (
                  <div className="border-t border-gray-200 px-4 pb-4 pt-3 dark:border-white/8">
                    {/* Earning Rule */}
                    <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-mintcom-green">
                      <TrendingUp size={15} /> Earning Rule
                    </p>
                    <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl bg-cream-50 p-3 dark:bg-mintcom-dark">
                      <div className="flex-1 min-w-[120px]">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">For every</p>
                        <div className="flex w-full items-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface">
                          <span className="flex h-9 w-8 shrink-0 items-center justify-center text-sm font-black text-mintcom-green">$</span>
                          <input
                            value={loyaltySpend}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                              const cents = digits === '' ? 0 : parseInt(digits, 10);
                              const formatted = (cents / 100).toFixed(2);
                              setLoyaltySpend(formatted);
                              markDirty();
                            }}
                            inputMode="numeric"
                            className="h-9 w-full min-w-0 bg-transparent px-2 text-sm font-bold outline-none dark:text-white tabular-nums"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Customer earns</p>
                        <div className="flex w-full items-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface">
                          <input
                            type="number"
                            min={0}
                            value={loyaltyPoints}
                            onChange={(e) => { setLoyaltyPoints(Number(e.target.value)); markDirty(); }}
                            className="h-9 w-full min-w-0 bg-transparent px-2 text-sm font-bold outline-none dark:text-white"
                          />
                          <span className="flex h-9 items-center pe-3 text-[11px] font-black text-mintcom-green shrink-0">PTS</span>
                        </div>
                      </div>
                    </div>

                    {/* Rewards */}
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-mintcom-green">
                        <Gift size={15} /> Rewards
                      </p>
                      <button
                        type="button"
                        onClick={() => openReward()}
                        className="inline-flex items-center gap-1 rounded-xl bg-mintcom-green px-2.5 py-1.5 text-[11px] font-black text-white"
                      >
                        <Plus size={12} /> Add Reward
                      </button>
                    </div>
                    {rewards.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-gray-200 py-6 text-center dark:border-white/10">
                        <p className="text-[13px] font-bold text-text-secondary dark:text-mintcom-textSecondary">
                          You have no rewards configured yet
                        </p>
                        <p className="text-[11px] text-text-tertiary">Add rewards to encourage customer loyalty</p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {rewards.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-cream-50 px-3 py-2.5 dark:border-white/8 dark:bg-mintcom-dark"
                          >
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                              <Gift size={16} />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-bold text-text-primary dark:text-white">{r.name}</p>
                              <p className="text-[11px] text-text-tertiary">
                                {r.type === 'FREE_ITEM' ? 'Free Item' : `${r.value ?? 0}% off`} • {r.points} points
                              </p>
                            </div>
                            <button type="button" onClick={() => openReward(r)} className="flex h-8 w-8 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setModal({
                                  type: 'delete',
                                  title: 'Delete Reward',
                                  body: `"${r.name}" will be removed from the loyalty program.`,
                                  onConfirm: () => {
                                    setRewards((list) => list.filter((x) => x.id !== r.id));
                                    markDirty();
                                    setModal(null);
                                    ping('Reward removed');
                                  },
                                })
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-xl bg-mintcom-red/10 text-mintcom-red"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ── Product Management (mirrors POS ProductManagementScreen) ── */}
          {active === 'products' && (
            <div className="mx-auto max-w-3xl">
              {/* Search + category dropdown row */}
              <div className="mb-3.5 flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search"
                    className="min-h-[44px] w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-9 pe-3 text-[16px] sm:text-[13px] outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                  />
                </div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCatMenuOpen((v) => !v)}
                    className={`flex min-h-[44px] items-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-semibold ${
                      selectedSettingsCategory !== 'all'
                        ? 'border-mintcom-green bg-mintcom-green/10 text-mintcom-green'
                        : 'border-gray-200 text-text-secondary dark:border-white/10 dark:text-mintcom-textSecondary'
                    }`}
                  >
                    <Grid3X3 size={14} />
                    <span className="max-w-[120px] truncate">
                      {selectedSettingsCategory === 'all'
                        ? 'All Categories'
                        : categories.find((c) => c.id === selectedSettingsCategory)?.name || 'All Categories'}
                    </span>
                    {selectedSettingsCategory !== 'all' ? (
                      <X
                        size={14}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSettingsCategory('all');
                        }}
                      />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </button>
                  {catMenuOpen && (
                    <>
                      <div className="absolute inset-0 z-10" onClick={() => setCatMenuOpen(false)} />
                      <div className="absolute end-0 z-20 mt-1 max-h-64 w-52 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-mintcom-surface">
                        {[{ id: 'all', name: 'All Categories', emoji: '' }, ...categories].map((c) => {
                          const on = selectedSettingsCategory === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedSettingsCategory(c.id);
                                setCatMenuOpen(false);
                              }}
                              className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-start text-[13px] font-medium ${
                                on ? 'bg-mintcom-green/15 text-mintcom-green' : 'text-text-primary hover:bg-cream-100 dark:text-white dark:hover:bg-white/5'
                              }`}
                            >
                              {c.id === 'all' ? (
                                <Grid3X3 size={15} />
                              ) : (
                                <CategoryIcon category={c} size={15} />
                              )}
                              <span className="truncate">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {/* Sort dropdown (mirrors POS ProductSortFilterModal) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-text-secondary hover:text-text-primary dark:border-white/10 dark:bg-mintcom-surface dark:text-mintcom-textSecondary"
                    title="Sort products"
                  >
                    <SlidersHorizontal size={14} className="text-mintcom-green" />
                    <span className="hidden sm:inline">Sort</span>
                    <ChevronDown size={14} />
                  </button>
                  {sortMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortMenuOpen(false)} />
                      <div className="absolute end-0 z-20 mt-1 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-mintcom-surface">
                        {[
                          { id: 'newest', label: 'Newest First' },
                          { id: 'oldest', label: 'Oldest First' },
                          { id: 'name_asc', label: 'Name (A-Z)' },
                          { id: 'name_desc', label: 'Name (Z-A)' },
                          { id: 'price_asc', label: 'Price: Low to High' },
                          { id: 'price_desc', label: 'Price: High to Low' },
                          { id: 'stock_asc', label: 'Stock: Low to High' },
                          { id: 'stock_desc', label: 'Stock: High to Low' },
                        ].map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              setProductSortOption(opt.id as any);
                              setSortMenuOpen(false);
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-start text-[12px] font-medium ${
                              productSortOption === opt.id
                                ? 'bg-mintcom-green/15 text-mintcom-green font-bold'
                                : 'text-text-primary hover:bg-cream-100 dark:text-white dark:hover:bg-white/5'
                            }`}
                          >
                            <span>{opt.label}</span>
                            {productSortOption === opt.id && <Check size={14} />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* View mode toggle: Grid / List (mirrors POS viewMode toggle) */}
                <div className="flex items-center rounded-xl border border-gray-200 bg-cream-50 p-0.5 dark:border-white/10 dark:bg-mintcom-dark">
                  <button
                    type="button"
                    onClick={() => setProductViewMode('grid')}
                    className={`rounded-lg p-2 transition-colors ${
                      productViewMode === 'grid'
                        ? 'bg-white text-mintcom-green shadow-sm dark:bg-mintcom-surface'
                        : 'text-text-secondary hover:text-text-primary dark:text-mintcom-textSecondary'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setProductViewMode('list')}
                    className={`rounded-lg p-2 transition-colors ${
                      productViewMode === 'list'
                        ? 'bg-white text-mintcom-green shadow-sm dark:bg-mintcom-surface'
                        : 'text-text-secondary hover:text-text-primary dark:text-mintcom-textSecondary'
                    }`}
                    title="List View"
                  >
                    <List size={15} />
                  </button>
                </div>
              </div>

              {/* Stock Status Filter Tabs (mirrors POS statusFilter tabs) */}
              <div className="mb-3.5 flex items-center gap-1.5 overflow-x-auto snap-x pb-0.5 text-xs font-semibold">
                {[
                  { key: 'all', label: 'All Items' },
                  { key: 'in_stock', label: 'In Stock' },
                  { key: 'low_stock', label: 'Low Stock' },
                  { key: 'out_of_stock', label: 'Out of Stock' },
                  { key: 'archived', label: 'Archived' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setProductStatusFilter(tab.key as any)}
                    className={`rounded-xl px-4 py-2.5 min-h-[44px] font-bold transition-colors shrink-0 snap-start ${
                      productStatusFilter === tab.key
                        ? 'bg-mintcom-green text-white shadow-sm'
                        : 'bg-white text-text-secondary hover:bg-cream-100 dark:bg-mintcom-surface dark:text-mintcom-textSecondary border border-gray-200 dark:border-white/10'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <span className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-mintcom-green/15 text-mintcom-green">
                    <Package size={44} />
                  </span>
                  <p className="text-lg font-semibold text-text-primary dark:text-white">
                    {selectedSettingsCategory !== 'all' || productSearch || productStatusFilter !== 'all' ? 'No products match your filters' : 'You have no products yet'}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary dark:text-mintcom-textSecondary">
                    Tap to add your first product
                  </p>
                  <button
                    type="button"
                    onClick={() => openProduct()}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-mintcom-green px-4 py-2.5 text-[13px] font-black text-white"
                  >
                    <Plus size={16} /> Add Product
                  </button>
                </div>
              ) : productViewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {/* Add New Item card (mirrors AddItemCard) */}
                  <button
                    type="button"
                    onClick={() => openProduct()}
                    className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-mintcom-green bg-mintcom-green/[0.08] p-4 text-center transition-colors hover:bg-mintcom-green/15"
                  >
                    <Plus size={32} className="text-mintcom-green" strokeWidth={2.2} />
                    <span className="text-base font-semibold text-mintcom-green">Add New Item</span>
                  </button>

                  {filteredProducts.map((p) => {
                    const stock = p.availableStock ?? 0;
                    const status = !p.trackStock
                      ? null
                      : stock <= 0
                        ? 'out'
                        : stock <= 5
                          ? 'red'
                          : stock <= 10
                            ? 'yellow'
                            : 'normal';
                    const archived = !p.active;
                    const willHardDelete = p.id.startsWith('p-');
                    return (
                      <div
                        key={p.id}
                        className={`relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm dark:bg-mintcom-surface ${
                          archived
                            ? 'border-dashed border-slate-400'
                            : status === 'red' || status === 'out'
                              ? 'border-2 border-mintcom-red'
                              : status === 'yellow'
                                ? 'border-2 border-amber-500'
                                : 'border-gray-200 dark:border-white/8'
                        }`}
                      >
                        {/* Image + badge */}
                        <button type="button" onClick={() => openProduct(p)} className="block w-full text-start">
                          <div className="relative flex h-[130px] w-full items-center justify-center overflow-hidden bg-gray-50 dark:bg-mintcom-dark">
                            {p.imageDataUrl ? (
                              <img
                                src={p.imageDataUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Package size={40} className="text-gray-300 dark:text-white/20" />
                            )}
                            {archived ? (
                              <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-xl bg-slate-500 px-2 py-1 text-[10px] font-black text-white">
                                <Archive size={11} /> Inactive
                              </span>
                            ) : status ? (
                              <span
                                className={`absolute end-2 top-2 rounded-xl px-2 py-1 text-[10px] font-black text-white ${
                                  status === 'red' || status === 'out'
                                    ? 'bg-mintcom-red'
                                    : status === 'yellow'
                                      ? 'bg-amber-500'
                                      : 'bg-black/45'
                                }`}
                              >
                                {status === 'out' ? 'Out of Stock' : `${stock} Left`}
                              </span>
                            ) : null}
                          </div>
                          <div className={`px-3 pb-1 pt-2 text-center ${archived ? 'opacity-60' : ''}`}>
                            <p className="line-clamp-2 text-[15px] font-bold text-text-primary dark:text-white">{p.name}</p>
                            <p className="mt-1 text-sm font-semibold text-mintcom-green">{money(p.price)}</p>
                          </div>
                        </button>
                        {/* Buttons */}
                        <div className="mt-auto flex gap-2 p-3">
                          <button
                            type="button"
                            onClick={() => openProduct(p)}
                            className="flex min-h-[44px] flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-mintcom-green px-1 text-[11px] font-semibold text-white"
                          >
                            <Pencil size={13} /> Edit
                          </button>
                          {archived ? (
                            <button
                              type="button"
                              onClick={() => {
                                setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, active: true } : x)));
                                markDirty();
                                ping('Product reactivated');
                              }}
                              className="flex min-h-[44px] flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-amber-500 px-1 text-[11px] font-semibold text-white"
                            >
                              <RotateCcw size={13} /> Reactivate
                            </button>
                          ) : willHardDelete ? (
                            <button
                              type="button"
                              onClick={() =>
                                setModal({
                                  type: 'delete',
                                  title: 'Delete Product',
                                  body: `"${p.name}" has no sales history and will be permanently deleted. This cannot be undone.`,
                                  confirmLabel: 'Delete',
                                  onConfirm: () => {
                                    setProducts((list) => list.filter((x) => x.id !== p.id));
                                    markDirty();
                                    setModal(null);
                                    ping('Product deleted');
                                  },
                                })
                              }
                              className="flex min-h-[44px] flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-mintcom-red px-1 text-[11px] font-semibold text-white"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setModal({
                                  type: 'delete',
                                  title: 'Archive Product',
                                  body: `"${p.name}" has sales history, so it will be archived (hidden from Sales). You can reactivate it anytime.`,
                                  confirmLabel: 'Archive',
                                  onConfirm: () => {
                                    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, active: false } : x)));
                                    markDirty();
                                    setModal(null);
                                    ping('Product archived');
                                  },
                                })
                              }
                              className="flex min-h-[44px] flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-mintcom-red px-1 text-[11px] font-semibold text-white"
                            >
                              <Archive size={13} /> Archive
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* List View (mirrors POS ProductManagementRow) */
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => openProduct()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-mintcom-green bg-mintcom-green/[0.08] p-3 text-sm font-bold text-mintcom-green transition-colors hover:bg-mintcom-green/15"
                  >
                    <Plus size={18} strokeWidth={2.5} />
                    <span>Add New Product</span>
                  </button>
                  {filteredProducts.map((p) => {
                    const stock = p.availableStock ?? 0;
                    const status = !p.trackStock
                      ? null
                      : stock <= 0
                        ? 'out'
                        : stock <= 5
                          ? 'red'
                          : stock <= 10
                            ? 'yellow'
                            : 'normal';
                    const archived = !p.active;
                    const willHardDelete = p.id.startsWith('p-');
                    const catName = categories.find((c) => c.id === p.categoryId)?.name || 'General';

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm dark:bg-mintcom-surface ${
                          archived
                            ? 'border-dashed border-slate-400 opacity-75'
                            : status === 'red' || status === 'out'
                              ? 'border-mintcom-red/40'
                              : 'border-gray-200 dark:border-white/8'
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-mintcom-dark">
                          {p.imageDataUrl ? (
                            <img src={p.imageDataUrl} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <Package size={22} className="text-text-tertiary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 text-start">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-text-primary dark:text-white">{p.name}</p>
                            <span className="rounded-md bg-cream-100 px-1.5 py-0.5 text-[10px] font-semibold text-text-secondary dark:bg-white/10 dark:text-mintcom-textSecondary">
                              {catName}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs">
                            <span className="font-bold text-mintcom-green">{money(p.price)}</span>
                            {p.trackStock && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                  stock <= 0
                                    ? 'bg-mintcom-red/15 text-mintcom-red'
                                    : stock <= 10
                                      ? 'bg-amber-500/15 text-amber-600'
                                      : 'bg-mintcom-green/15 text-mintcom-green'
                                }`}
                              >
                                {stock <= 0 ? 'Out of stock' : `${stock} in stock`}
                              </span>
                            )}
                            {archived && (
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold uppercase text-slate-700 dark:bg-white/10 dark:text-slate-300">
                                Archived
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openProduct(p)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-text-secondary hover:border-mintcom-green hover:text-mintcom-green dark:border-white/10 dark:text-mintcom-textSecondary"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          {archived ? (
                            <button
                              type="button"
                              onClick={() => {
                                setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, active: true } : x)));
                                markDirty();
                                ping('Product reactivated');
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                              title="Reactivate"
                            >
                              <RotateCcw size={14} />
                            </button>
                          ) : willHardDelete ? (
                            <button
                              type="button"
                              onClick={() =>
                                setModal({
                                  type: 'delete',
                                  title: 'Delete Product',
                                  body: `"${p.name}" has no sales history and will be permanently deleted. This cannot be undone.`,
                                  confirmLabel: 'Delete',
                                  onConfirm: () => {
                                    setProducts((list) => list.filter((x) => x.id !== p.id));
                                    markDirty();
                                    setModal(null);
                                    ping('Product deleted');
                                  },
                                })
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-mintcom-red/30 text-mintcom-red hover:bg-mintcom-red/10"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setModal({
                                  type: 'delete',
                                  title: 'Archive Product',
                                  body: `"${p.name}" has sales history, so it will be archived (hidden from Sales). You can reactivate it anytime.`,
                                  confirmLabel: 'Archive',
                                  onConfirm: () => {
                                    setProducts((list) => list.map((x) => (x.id === p.id ? { ...x, active: false } : x)));
                                    markDirty();
                                    setModal(null);
                                    ping('Product archived');
                                  },
                                })
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-mintcom-red/30 text-mintcom-red hover:bg-mintcom-red/10"
                              title="Archive"
                            >
                              <Archive size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Categories (mirrors POS CategoriesScreen) ── */}
          {active === 'categories' && (
            <div className="mx-auto max-w-2xl">
              {/* Search */}
              <div className="mb-4">
                <div className="relative w-full sm:w-56">
                  <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                  <input
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    placeholder="Search"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-9 pe-3 text-[13px] outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                  />
                </div>
              </div>

              {(() => {
                const q = catSearch.trim().toLowerCase();
                const shown = categories.filter((c) => !q || c.name.toLowerCase().includes(q));
                return (
                  <>
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {/* Add Category tile */}
                      <button
                        type="button"
                        onClick={() => openCategory()}
                        className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-mintcom-green bg-mintcom-green/[0.08] p-2 text-center transition-colors hover:bg-mintcom-green/15"
                      >
                        <Plus size={26} className="text-mintcom-green" strokeWidth={2.2} />
                        <span className="text-[11px] font-semibold leading-tight text-mintcom-green">Add Category</span>
                      </button>
                      {shown.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => openCategory(c)}
                          className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border p-2 text-center ${
                            c.active
                              ? 'border-gray-200 bg-gray-50 dark:border-white/8 dark:bg-mintcom-dark'
                              : 'border-dashed border-slate-400 opacity-70'
                          }`}
                        >
                          <CategoryIcon
                            category={c}
                            size={30}
                            className="text-text-secondary dark:text-mintcom-textSecondary"
                          />
                          <span className="line-clamp-1 w-full text-[11px] font-semibold text-text-secondary dark:text-mintcom-textSecondary">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>

                    {categories.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-14 text-center">
                        <span className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-mintcom-green/15 text-mintcom-green">
                          <Tag size={44} />
                        </span>
                        <p className="text-lg font-semibold text-text-primary dark:text-white">You have no categories yet</p>
                        <p className="mt-1 text-sm text-text-secondary dark:text-mintcom-textSecondary">
                          Create your first category to start organizing your products
                        </p>
                        <button
                          type="button"
                          onClick={() => openCategory()}
                          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-mintcom-green px-4 py-2.5 text-[13px] font-black text-white"
                        >
                          <Plus size={16} /> Add Category
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* ── Stock Management (mirrors POS StockManagementScreen) ── */}
          {active === 'stock' && (() => {
            const q = stockSearch.trim().toLowerCase();
            const stockItems = products.filter(
              (p) => p.trackStock && (!q || p.name.toLowerCase().includes(q)),
            );
            const availGroups = addons.filter(
              (g) => !q || g.name.toLowerCase().includes(q) || g.options.some((o) => o.name.toLowerCase().includes(q)),
            );
            return (
              <div className="mx-auto max-w-2xl">
                {/* Search + segmented tabs */}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-9 pe-3 text-[13px] outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                    />
                  </div>
                  <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-mintcom-dark">
                    {([
                      { id: 'stock' as const, label: 'Item Stock', count: stockItems.length },
                      { id: 'availability' as const, label: 'Add-on Availability', count: availGroups.length },
                    ]).map((tb) => {
                      const on = stockTab === tb.id;
                      return (
                        <button
                          key={tb.id}
                          type="button"
                          onClick={() => setStockTab(tb.id)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors ${
                            on ? 'bg-mintcom-green text-white shadow-sm' : 'text-text-secondary dark:text-mintcom-textSecondary'
                          }`}
                        >
                          {tb.label}
                          <span className={`rounded-full px-1.5 text-[10px] font-black ${on ? 'bg-white/25 text-white' : 'bg-gray-200 text-text-tertiary dark:bg-white/10'}`}>
                            {tb.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Item Stock tab */}
                {stockTab === 'stock' ? (
                  stockItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream-100 text-text-tertiary dark:bg-mintcom-dark">
                        <Package size={36} />
                      </span>
                      <p className="text-base font-bold text-text-primary dark:text-white">
                        {q ? 'No results found' : 'You have no stock-tracked items yet'}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary dark:text-mintcom-textSecondary">
                        {q ? 'Try a different search term' : 'Items with stock tracking enabled will appear here'}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {stockItems.map((p) => {
                        const current = p.availableStock ?? 0;
                        // Pre-fill with the real current stock so the value is editable, not a hint.
                        const raw = stockEdits[p.id] ?? String(current);
                        const changed = raw !== '' && parseInt(raw, 10) !== current;
                        const red = p.redThreshold ?? 5;
                        const yellow = p.yellowThreshold ?? 10;
                        const tone =
                          current <= 0 ? 'red' : current <= red ? 'red' : current <= yellow ? 'yellow' : 'ok';
                        return (
                          <div
                            key={p.id}
                            className={`rounded-xl border bg-white p-3.5 shadow-sm dark:bg-mintcom-surface ${
                              tone === 'red'
                                ? 'border-mintcom-red/40'
                                : tone === 'yellow'
                                  ? 'border-amber-500/40'
                                  : 'border-gray-200 dark:border-white/8'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 dark:bg-mintcom-dark">
                                {p.imageDataUrl ? (
                                  <img
                                    src={p.imageDataUrl}
                                    alt=""
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <Package size={22} className="text-gray-300 dark:text-white/20" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[15px] font-bold text-text-primary dark:text-white">{p.name}</p>
                                <p className="mt-0.5 text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                                  Current: {current} units
                                </p>
                              </div>
                            </div>
                            <p className="mb-1.5 mt-3 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                              New Quantity
                            </p>
                            <div className="flex items-center gap-2">
                              <input
                                value={raw}
                                onChange={(e) =>
                                  setStockEdits((s) => ({ ...s, [p.id]: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                                }
                                inputMode="numeric"
                                className={`h-11 flex-1 rounded-xl border bg-white px-3 text-center text-sm font-bold text-text-primary outline-none dark:bg-mintcom-dark dark:text-white ${
                                  changed ? 'border-mintcom-green bg-mintcom-green/[0.04]' : 'border-gray-200 dark:border-white/10'
                                }`}
                              />
                              <button
                                type="button"
                                disabled={!changed}
                                onClick={() => saveStock(p.id)}
                                className={`flex h-11 items-center gap-1.5 rounded-xl px-4 text-[13px] font-bold text-white ${
                                  changed ? 'bg-mintcom-green' : 'cursor-not-allowed bg-gray-300 dark:bg-white/10'
                                }`}
                              >
                                <Check size={15} /> Save
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : /* Add-on Availability tab */ availGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream-100 text-text-tertiary dark:bg-mintcom-dark">
                      <Check size={36} />
                    </span>
                    <p className="text-base font-bold text-text-primary dark:text-white">
                      {q ? 'No results found' : 'You have no add-ons yet'}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary dark:text-mintcom-textSecondary">
                      {q ? 'Try a different search term' : 'Add-ons with options will appear here'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availGroups.map((g) => {
                      const open = availOpen[g.id] ?? true;
                      return (
                        <div
                          key={g.id}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/8 dark:bg-mintcom-surface"
                        >
                          <button
                            type="button"
                            onClick={() => setAvailOpen((s) => ({ ...s, [g.id]: !open }))}
                            className="flex w-full items-center justify-between px-4 py-3.5 text-start"
                          >
                            <span className="text-[15px] font-semibold text-text-primary dark:text-white">{g.name}</span>
                            <ChevronDown size={20} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
                          </button>
                          {open && (
                            <div className="border-t border-gray-100 dark:border-white/8">
                              {g.options.map((o) => {
                                const avail = o.available !== false;
                                return (
                                  <div
                                    key={o.id}
                                    className="flex items-center justify-between gap-3 border-b border-gray-50 px-4 py-3 last:border-0 dark:border-white/5"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-[14px] font-medium text-text-primary dark:text-white">{o.name}</p>
                                      <p className="text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                                        +{money(o.price)}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                          avail ? 'bg-mintcom-green/15 text-mintcom-green' : 'bg-mintcom-red/15 text-mintcom-red'
                                        }`}
                                      >
                                        {avail ? 'Available' : 'Unavailable'}
                                      </span>
                                      <Toggle on={avail} onToggle={() => toggleAddonAvailability(g.id, o.id)} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Attributes (mirrors POS AttributesScreen) ── */}
          {active === 'addons' && (() => {
            const q = attrSearch.trim().toLowerCase();
            const groups = addons.filter(
              (g) => !q || g.name.toLowerCase().includes(q) || g.options.some((o) => o.name.toLowerCase().includes(q)),
            );
            return (
              <div className="mx-auto max-w-2xl">
                {/* Search + Add New Attribute */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search size={15} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                    <input
                      value={attrSearch}
                      onChange={(e) => setAttrSearch(e.target.value)}
                      placeholder="Search group"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 ps-9 pe-3 text-[13px] outline-none focus:border-mintcom-green dark:border-white/10 dark:bg-mintcom-surface dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddonGroup()}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-mintcom-green px-3.5 py-2.5 text-[13px] font-black text-white"
                  >
                    <Plus size={15} /> Add New Attribute
                  </button>
                </div>

                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 text-center">
                    <span className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream-100 text-text-tertiary dark:bg-mintcom-dark">
                      <Tag size={36} />
                    </span>
                    <p className="text-base font-bold text-text-primary dark:text-white">
                      {q ? 'No results found' : 'You have no add-ons yet'}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary dark:text-mintcom-textSecondary">
                      {q ? 'Try a different search term' : 'Click "Add New" to start creating add-ons for your items'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {groups.map((g) => {
                      const open = expandedAttr === g.id;
                      return (
                        <div
                          key={g.id}
                          className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/8 dark:bg-mintcom-surface"
                        >
                          {/* Group header — name + edit + delete + chevron */}
                          <div className="flex items-center gap-2 px-4 py-3.5">
                            <button
                              type="button"
                              onClick={() => setExpandedAttr(open ? null : g.id)}
                              className="min-w-0 flex-1 text-start"
                            >
                              <span className="text-[15px] font-semibold text-text-primary dark:text-white">{g.name}</span>
                              <span className="ms-2 text-[11px] font-medium text-text-tertiary">
                                {g.multi ? 'Multi Select' : 'Single Select'}
                                {g.required ? ' · Required' : ''}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openAddonGroup(g)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green"
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setModal({
                                  type: 'delete',
                                  title: 'Delete Add-on Group',
                                  body: `"${g.name}" and all its options will be removed.`,
                                  confirmLabel: 'Delete',
                                  onConfirm: () => {
                                    setAddons((groups2) => groups2.filter((x) => x.id !== g.id));
                                    markDirty();
                                    setModal(null);
                                    ping('Attribute deleted');
                                  },
                                })
                              }
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-red/10 text-mintcom-red"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExpandedAttr(open ? null : g.id)}
                              className="flex h-9 w-9 items-center justify-center text-text-secondary"
                            >
                              <ChevronDown size={20} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                            </button>
                          </div>

                          {/* Sub-attributes (options) */}
                          {open && (
                            <div className="border-t border-gray-100 px-4 pb-2 pt-1 dark:border-white/8">
                              {g.options.map((o) => {
                                const unavailable = o.available === false;
                                return (
                                  <div key={o.id} className="flex items-center justify-between gap-2 border-b border-gray-50 py-3 last:border-0 dark:border-white/5">
                                    <div className="min-w-0">
                                      <p className={`flex items-center gap-1.5 text-[14px] font-medium ${unavailable ? 'text-text-tertiary line-through dark:text-mintcom-gray' : 'text-text-primary dark:text-white'}`}>
                                        {o.name}
                                        {unavailable && (
                                          <span className="rounded-md bg-mintcom-red/15 px-1.5 py-0.5 text-[8.5px] font-black uppercase text-mintcom-red no-underline">
                                            Unavailable
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-[12px] text-text-secondary dark:text-mintcom-textSecondary">
                                        {o.price > 0 ? money(o.price) : 'Complimentary'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openAddonOpt(g.id, o)}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setModal({
                                            type: 'delete',
                                            title: 'Delete Add-on',
                                            body: `"${o.name}" will be removed from ${g.name}.`,
                                            confirmLabel: 'Delete',
                                            onConfirm: () => {
                                              setAddons((groups2) =>
                                                groups2.map((x) =>
                                                  x.id === g.id
                                                    ? { ...x, options: x.options.filter((op) => op.id !== o.id) }
                                                    : x,
                                                ),
                                              );
                                              markDirty();
                                              setModal(null);
                                              ping('Add-on removed');
                                            },
                                          })
                                        }
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-mintcom-red/10 text-mintcom-red"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                              <button
                                type="button"
                                onClick={() => openAddonOpt(g.id)}
                                className="py-3 text-[15px] font-semibold text-mintcom-green"
                              >
                                Add add-on option
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Manufacturing / Recipe Operations (full POS mirror) ── */}
          {active === 'manufacturing' && (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <DemoManufacturingPanel
                onActivity={(action, detail) => {
                  logActivity(action, detail);
                }}
              />
            </div>
          )}

          {/* ── Activity Log (mirrors POS ActivityLogScreen) ── */}
          {active === 'activity' && (() => {
            const end = new Date();
            const start = new Date(renderedAt - 6 * 86400_000);
            const fmtD = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return (
              <div className="mx-auto max-w-2xl">
                {/* Filter card — Date Range · Time · Print · Refresh */}
                <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-white/8 dark:bg-mintcom-surface">
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-[150px] flex-1">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Date Range</p>
                      <div className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-cream-50 px-2 text-[13px] font-semibold text-text-primary dark:border-white/10 dark:bg-mintcom-dark dark:text-white">
                        <Calendar size={16} className="text-mintcom-green" />
                        {fmtD(start)} - {fmtD(end)}, {end.getFullYear()}
                      </div>
                    </div>
                    <div className="min-w-[130px] flex-1">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">Time</p>
                      <div className="flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-cream-50 px-2 text-[13px] font-semibold text-text-primary dark:border-white/10 dark:bg-mintcom-dark dark:text-white">
                        <Clock size={15} className="text-mintcom-green" />
                        12:00 AM - 11:59 PM
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => ping('PDF exported (demo)')}
                      className="flex h-10 items-center gap-1.5 rounded-xl bg-mintcom-green px-3.5 text-[13px] font-bold text-white"
                    >
                      <Printer size={16} /> Print
                    </button>
                    <button
                      type="button"
                      onClick={() => ping('Activity refreshed')}
                      className="flex h-10 items-center gap-1.5 rounded-xl bg-mintcom-green px-3.5 text-[13px] font-bold text-white"
                    >
                      <RefreshCw size={16} /> Refresh
                    </button>
                  </div>
                </div>

                {/* Log list */}
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/8 dark:bg-mintcom-surface">
                  {activity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 text-center">
                      <p className="text-base font-bold text-text-primary dark:text-white">You have no logs yet</p>
                      <p className="mt-1 text-sm text-text-secondary dark:text-mintcom-textSecondary">
                        Try adjusting the date range to see activity history
                      </p>
                    </div>
                  ) : (
                    activity.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-0 dark:border-white/8"
                      >
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mintcom-green text-white">
                          <User size={16} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] leading-snug">
                            <span className="font-black text-mintcom-green">{a.who}</span>
                            <span className="text-text-primary dark:text-white"> {a.action}</span>
                            {a.detail ? <span className="text-text-secondary dark:text-mintcom-textSecondary"> · {a.detail}</span> : null}
                          </p>
                          <p className="mt-0.5 text-[11px] text-text-tertiary">
                            {new Date(a.at).toLocaleString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            }).replace(',', '')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Language (mirrors POS LanguageSettingsScreen) ── */}
          {active === 'language' && (
            <div className="mx-auto max-w-2xl">
              {/* Language list — one card per language (POS LanguageSettingsScreen) */}
              <div className="flex flex-col gap-3">
                {([
                  { code: 'en' as const, native: 'English', name: 'English', soon: false },
                  { code: 'ar' as const, native: 'العربية', name: 'Arabic', soon: true },
                  { code: 'zh' as const, native: '中文', name: 'Chinese', soon: true },
                ]).map((l) => {
                  const selected = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      disabled={l.soon}
                      onClick={() => {
                        if (l.soon) return;
                        setLang(l.code as 'en' | 'ar');
                        markDirty();
                      }}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl border-2 px-5 py-4 text-start transition-colors ${
                        selected
                          ? 'border-mintcom-green bg-mintcom-green/10'
                          : 'border-gray-200 bg-white hover:border-mintcom-green/60 dark:border-white/10 dark:bg-mintcom-surface'
                      } ${l.soon ? 'cursor-not-allowed opacity-55' : ''}`}
                    >
                      <div className="min-w-0">
                        <p className="text-[18px] font-semibold text-text-primary dark:text-white">{l.native}</p>
                        <p className="mt-0.5 text-sm text-text-secondary dark:text-mintcom-textSecondary">{l.name}</p>
                      </div>
                      {l.soon ? (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-cream-100 px-2.5 py-1 text-[11px] font-bold text-text-tertiary dark:bg-white/10">
                          <Clock size={13} />
                          Coming Soon
                        </span>
                      ) : selected ? (
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mintcom-green text-white">
                          <Check size={16} />
                        </span>
                      ) : (
                        <span className="h-7 w-7 shrink-0 rounded-full border-2 border-gray-300 dark:border-white/20" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Restart info */}
              <div className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-cream-50 px-4 py-3.5 dark:border-white/10 dark:bg-mintcom-dark">
                <Info size={20} className="mt-0.5 shrink-0 text-mintcom-green" />
                <p className="text-sm leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  The app will automatically restart when you change the language to apply layout changes.
                </p>
              </div>
            </div>
          )}
          {/* ── About Us (mirrors POS AboutUsScreen) ── */}
          {active === 'about' && (
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-mintcom-surface sm:p-6">
                {/* Intro paragraphs */}
                <p className="mb-4 text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  Mintcom LLC is a technology solutions company specializing in Point of Sale (POS) systems and
                  digital business management platforms. Our products are designed to simplify daily operations,
                  from fast, reliable sales processing on digital devices to automated management tools that give
                  businesses full operational visibility.
                </p>
                <p className="mb-4 text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  At the core of Mintcom is one clear goal: to give business owners accurate, real-time access to
                  their data while enabling faster, smoother checkout experiences for their customers.
                </p>
                <p className="mb-4 text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  The Mintcom app is available on both iOS and Android and can be downloaded for free. Businesses
                  can create a Mintcom account and complete setup directly through the POS app or via the online
                  management dashboard. Mintcom also supports multi-branch operations, so owners and account managers
                  can add, merge, or separate establishments from a single universal dashboard, with discounted
                  pricing for additional branches.
                </p>

                {/* Our Value Proposition */}
                <h3 className="mb-4 mt-6 border-b border-gray-100 pb-2 text-[17px] font-black text-text-primary dark:border-white/8 dark:text-white">
                  Our Value Proposition
                </h3>
                {[
                  'Affordable. Transparent. Complete. Mintcom offers one of the most competitive POS solutions in the market when considering the full range of included services. Our pricing is transparent, with no hidden fees or unexpected costs, just a complete, all-in-one system at an accessible monthly rate.',
                  'Built for Simplicity. We developed Mintcom in close collaboration with business owners and frontline staff. The result is an intuitive system that can be learned in minutes, not days. Guided in-app tours and clear workflows ensure users always know what to do.',
                  'Performance-Driven Design. Speed, reliability, and usability are central to everything we build. Mintcom is engineered for fast transactions and smooth daily operations, with workflows designed using behavioral insights so critical actions are easy to access.',
                ].map((p) => (
                  <div key={p} className="mb-4 flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-mintcom-green" />
                    <p className="text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">{p}</p>
                  </div>
                ))}

                {/* Our Story */}
                <h3 className="mb-4 mt-6 border-b border-gray-100 pb-2 text-[17px] font-black text-text-primary dark:border-white/8 dark:text-white">
                  Our Story
                </h3>
                <p className="mb-4 text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  Mintcom officially launched in 2025, shaped by years of in-depth research into the evolving POS
                  and retail technology landscape.
                </p>
                <p className="mb-4 text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  Over three years of dedicated development went into building a platform that combines powerful
                  performance, enterprise-grade security, and seamless scalability. Every feature was thoughtfully
                  crafted around real business challenges, creating an experience that is intuitive, reliable, and
                  ready to grow with businesses at every stage.
                </p>
                <p className="mb-4 text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  Today, Mintcom empowers businesses around the world with a modern POS ecosystem designed to
                  simplify operations, enhance efficiency, and deliver the flexibility needed in a fast-moving
                  retail environment.
                </p>

                {/* App Information */}
                <div className="mt-6 rounded-xl border border-gray-200 bg-cream-50 p-4 dark:border-white/8 dark:bg-mintcom-dark">
                  <div className="mb-3 flex items-center gap-2.5">
                    <Info size={20} className="text-mintcom-green" />
                    <p className="text-[17px] font-bold text-text-primary dark:text-white">App Information</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { l: 'Version:', v: '1.0.0' },
                      { l: 'Build:', v: '009' },
                      { l: 'Released:', v: 'July 2026' },
                      { l: 'Commercial Registration:', v: '200182379' },
                    ].map((r) => (
                      <div key={r.l} className="flex items-center justify-between gap-3 text-[14px]">
                        <span className="font-medium text-text-secondary dark:text-mintcom-textSecondary">{r.l}</span>
                        <span className="font-bold text-text-primary dark:text-white">{r.v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Us */}
                <h3 className="mb-4 mt-6 border-b border-gray-100 pb-2 text-[17px] font-black text-text-primary dark:border-white/8 dark:text-white">
                  Contact Us
                </h3>
                <p className="mb-3 text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  For sales inquiries, please contact us at:
                </p>
                <p className="mb-4 text-[14px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                  <span className="font-bold text-text-primary dark:text-white">Email:</span>{' '}
                  <a href="mailto:support@mintcompos.com" className="text-mintcom-green underline">
                    support@mintcompos.com
                  </a>
                  <br />
                  <span className="font-bold text-text-primary dark:text-white">Website:</span>{' '}
                  <a
                    href="https://mintcompos.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-mintcom-green underline"
                  >
                    https://mintcompos.com/
                  </a>
                </p>

                {/* Privacy & Legal */}
                <h3 className="mb-2 mt-6 border-b border-gray-100 pb-2 text-[17px] font-black text-text-primary dark:border-white/8 dark:text-white">
                  Privacy & Legal
                </h3>
                <a
                  href="https://mintcompos.com/legal/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 text-[15px] font-medium text-mintcom-green underline"
                >
                  View Privacy Policy <ArrowRight size={16} />
                </a>
                <a
                  href="https://mintcompos.com/legal/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between py-2 text-[15px] font-medium text-mintcom-green underline"
                >
                  Terms of Service <ArrowRight size={16} />
                </a>

                <p className="mt-4 text-[14px] text-text-secondary dark:text-mintcom-textSecondary">
                  All rights reserved, Mintcom LLC 2026
                </p>
              </div>
            </div>
          )}
          </div>

          {/* Sticky footer — Discard / Save Changes (mirrors POS) */}
          <div className="flex shrink-0 items-center gap-3 border-t border-gray-200 px-3 pt-3 sm:px-4" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <button
              type="button"
              onClick={discardAll}
              disabled={!dirty}
              className={`flex-1 rounded-xl py-3.5 text-sm font-bold transition-colors ${
                dirty
                  ? 'bg-gray-200 text-text-primary hover:bg-gray-300 dark:bg-white/10 dark:text-white'
                  : 'cursor-default bg-gray-200/60 text-text-tertiary dark:bg-white/5 dark:text-mintcom-gray'
              }`}
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={saveAll}
              disabled={!dirty}
              className={`flex-1 rounded-xl py-3.5 text-sm font-black text-white transition-colors ${
                dirty
                  ? 'bg-mintcom-green shadow-md shadow-mintcom-green/25 hover:bg-mintcom-greenDark'
                  : 'cursor-default bg-mintcom-green/45'
              }`}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved changes (tab switch) — like POS ConfirmationModal */}
      <ConfirmModal
        open={!!pendingTab}
        title="Unsaved Changes"
        body="Are you sure you want to leave without saving your changes?"
        confirmLabel="Confirm"
        danger
        onCancel={() => setPendingTab(null)}
        onConfirm={() => {
          if (pendingTab) {
            setDirty(false);
            setActive(pendingTab);
            setPendingTab(null);
          }
        }}
      />

      {/* Discard Changes — mirrors POS YourBusinessScreen ConfirmationModal */}
      <ConfirmModal
        open={showDiscardConfirm}
        title="Discard changes?"
        body="Are you sure you want to discard all unsaved changes on this screen?"
        confirmLabel="Discard"
        danger
        onCancel={() => setShowDiscardConfirm(false)}
        onConfirm={confirmDiscard}
      />

      {/* Dynamic modals */}
      <AnimatePresence>
        {modal?.type === 'employee' && (() => {
          const isAdd = !modal.emp;
          const isOwner = !!modal.emp?.owner;
          const roleLabel =
            draftBaseRole === 'ADMIN'
              ? 'Admin (Full Access)'
              : DEMO_CUSTOM_ROLES.find((r) => r.id === draftCustomRoleId)?.name || 'Select a role';
          const roleSelected = draftBaseRole === 'ADMIN' || !!draftCustomRoleId;
          const err = (k: string) => empFieldErrors[k];
          const fieldBorder = (k: string) =>
            err(k) ? 'border-[#D55263]' : 'border-gray-200 dark:border-white/10';

          const Checkbox = ({ on, disabled }: { on: boolean; disabled?: boolean }) => (
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                on
                  ? 'border-mintcom-green bg-mintcom-green'
                  : 'border-gray-300 bg-white dark:border-white/20 dark:bg-mintcom-dark'
              } ${disabled ? 'opacity-60' : ''}`}
            >
              {on && <Check size={12} className="text-white" strokeWidth={3} />}
            </span>
          );

          return (
            <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/55 p-2.5 backdrop-blur-[2px] sm:p-3">
              <button
                type="button"
                aria-label="Close"
                className="absolute inset-0"
                onClick={() => setModal(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                role="dialog"
                aria-labelledby="employee-modal-title"
                className="relative flex h-auto max-h-[min(92%,560px)] w-full max-w-[min(94%,400px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Sticky header — compact so more form fits in the iPad frame */}
                <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-3.5 py-2.5 dark:border-white/10">
                  <span className="w-8" />
                  <h3
                    id="employee-modal-title"
                    className="text-center text-[16px] font-bold text-text-primary dark:text-white sm:text-[17px]"
                  >
                    {isAdd ? 'Add Employee' : 'Edit Employee'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Scrollable body — only this region scrolls; footer stays pinned */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3 sm:px-4">
                  {err('general') && (
                    <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-2">
                      <AlertTriangle size={15} className="shrink-0 text-[#D55263]" />
                      <p className="text-[11px] font-medium text-[#D55263]">{err('general')}</p>
                    </div>
                  )}

                  {isOwner && (
                    <div
                      className="mb-3 flex items-start gap-2 rounded-xl border px-2.5 py-2"
                      style={{ background: '#FFFBEB', borderColor: '#F59E0B' }}
                    >
                      <Shield size={15} className="mt-0.5 shrink-0 text-[#B45309]" />
                      <p className="text-[11px] leading-relaxed text-[#B45309]">
                        The owner profile is managed from Account settings. Role and deletion are protected.
                      </p>
                    </div>
                  )}

                  {/* Full Name (optional) */}
                  <label className="mb-2.5 block">
                    <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                      Full Name <span className="font-normal text-text-tertiary">(optional)</span>
                    </span>
                    <input
                      className={`w-full rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-mintcom-green dark:bg-mintcom-dark dark:text-white ${fieldBorder('employeeName')}`}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </label>

                  {/* Username * */}
                  <label className="mb-2.5 block">
                    <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                      Username <span className="text-[#D55263]">*</span>
                    </span>
                    <input
                      className={`w-full rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-mintcom-green dark:bg-mintcom-dark dark:text-white ${fieldBorder('username')}`}
                      value={draftUsername}
                      onChange={(e) => {
                        setDraftUsername(e.target.value.replace(/\s/g, ''));
                        if (empFieldErrors.username)
                          setEmpFieldErrors((p) => ({ ...p, username: '' }));
                      }}
                      placeholder="johndoe"
                      autoCapitalize="none"
                      autoComplete="off"
                    />
                    {err('username') && (
                      <p className="mt-1 text-[11px] font-medium text-[#D55263]">{err('username')}</p>
                    )}
                  </label>

                  {/* Role dropdown */}
                  <div className="mb-2.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-[12px] font-medium text-text-secondary">Role</span>
                    </div>
                    <button
                      type="button"
                      disabled={isOwner}
                      onClick={() => !isOwner && setDraftRolesOpen((v) => !v)}
                      className={`flex w-full items-center justify-between rounded-xl border bg-white px-3 py-2.5 text-start dark:bg-mintcom-dark ${fieldBorder('role')} ${isOwner ? 'opacity-60' : ''}`}
                    >
                      <span className="flex items-center gap-2">
                        <Briefcase
                          size={16}
                          className={draftBaseRole === 'ADMIN' ? 'text-blue-600' : 'text-mintcom-green'}
                        />
                        <span
                          className={`text-[13px] font-medium ${
                            roleSelected ? 'text-text-primary dark:text-white' : 'text-text-tertiary'
                          }`}
                        >
                          {roleLabel}
                        </span>
                      </span>
                      <ChevronDown
                        size={18}
                        className={`text-text-secondary transition-transform ${draftRolesOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {draftRolesOpen && !isOwner && (
                      <div className="mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-mintcom-surface">
                        <button
                          type="button"
                          onClick={applyAdminRole}
                          className={`flex w-full items-center justify-between gap-2 border-b border-gray-100 px-3.5 py-3 text-start dark:border-white/8 ${
                            draftBaseRole === 'ADMIN' ? 'bg-blue-50 dark:bg-blue-500/10' : ''
                          }`}
                        >
                          <span>
                            <span
                              className={`block text-[14px] font-semibold ${
                                draftBaseRole === 'ADMIN' ? 'text-blue-600' : 'text-text-primary dark:text-white'
                              }`}
                            >
                              Admin (Full Access)
                            </span>
                            <span className="text-[12px] text-text-secondary">All permissions enabled</span>
                          </span>
                          {draftBaseRole === 'ADMIN' && (
                            <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-blue-600 bg-blue-600">
                              <Check size={12} className="text-white" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                        {DEMO_CUSTOM_ROLES.map((r, i) => {
                          const on = draftCustomRoleId === r.id && draftBaseRole !== 'ADMIN';
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => applyCustomRole(r.id)}
                              className={`flex w-full items-center justify-between gap-2 px-3.5 py-3 text-start ${
                                i < DEMO_CUSTOM_ROLES.length - 1
                                  ? 'border-b border-gray-100 dark:border-white/8'
                                  : ''
                              } ${on ? 'bg-mintcom-green/10' : ''}`}
                            >
                              <span>
                                <span
                                  className={`block text-[14px] ${
                                    on
                                      ? 'font-semibold text-mintcom-green'
                                      : 'font-medium text-text-primary dark:text-white'
                                  }`}
                                >
                                  {r.name}
                                </span>
                                <span className="text-[12px] text-text-secondary">
                                  {r.permissions.length} permissions
                                </span>
                              </span>
                              {on && (
                                <span className="flex h-5 w-5 items-center justify-center rounded border-2 border-mintcom-green bg-mintcom-green">
                                  <Check size={12} className="text-white" strokeWidth={3} />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {err('role') && (
                      <p className="mt-1 text-[12px] font-medium text-[#D55263]">{err('role')}</p>
                    )}
                  </div>

                  {/* Email */}
                  <label className="mb-2.5 block">
                    <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                      Email
                      {(draftBaseRole === 'ADMIN' || draftBackofficeAccess) ? (
                        <span className="text-[#D55263]"> *</span>
                      ) : (
                        <span className="font-normal text-text-tertiary"> (optional)</span>
                      )}
                    </span>
                    <input
                      className={`w-full rounded-xl border bg-white px-3 py-2.5 text-[14px] outline-none focus:border-mintcom-green dark:bg-mintcom-dark dark:text-white ${fieldBorder('email')}`}
                      value={draftEmail}
                      onChange={(e) => {
                        setDraftEmail(e.target.value);
                        if (empFieldErrors.email) setEmpFieldErrors((p) => ({ ...p, email: '' }));
                      }}
                      placeholder={
                        draftBaseRole === 'ADMIN' || draftBackofficeAccess
                          ? 'admin@example.com'
                          : 'optional@example.com'
                      }
                      type="email"
                      autoCapitalize="none"
                    />
                    {err('email') && (
                      <p className="mt-1 text-[11px] font-medium text-[#D55263]">{err('email')}</p>
                    )}
                  </label>

                  {/* ── Access to basic sales (POS) ── */}
                  <div className="mb-2.5 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => {
                        if (draftBaseRole === 'ADMIN') return;
                        setDraftPosAccess((v) => !v);
                      }}
                      className={`flex w-full items-center justify-between gap-2.5 px-3 py-2.5 text-start ${
                        draftPosAccess ? 'rounded-t-xl' : 'rounded-xl'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            draftPosAccess
                              ? 'bg-mintcom-green text-white'
                              : 'bg-gray-100 text-text-secondary dark:bg-white/10'
                          }`}
                        >
                          <Smartphone size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1">
                            <span className="text-[13px] font-semibold text-text-primary dark:text-white">
                              Access to basic sales
                            </span>
                            <span title="Sales screen: take orders, accept payments, and open shifts.">
                              <Info size={13} className="text-text-tertiary" />
                            </span>
                          </span>
                          <span className="block text-[10px] leading-snug text-text-secondary">
                            Allow access to the POS sales terminal
                          </span>
                        </span>
                      </span>
                      <Toggle
                        on={draftPosAccess}
                        onToggle={() => {
                          if (draftBaseRole === 'ADMIN') return;
                          setDraftPosAccess((v) => !v);
                        }}
                        disabled={draftBaseRole === 'ADMIN'}
                      />
                    </button>

                    {draftPosAccess && (
                      <div className="border-t border-gray-200 dark:border-white/10">
                        <div className="px-3 pb-1 pt-2.5">
                          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                            Access to basic sales
                          </p>
                          <div className="mb-1.5 flex gap-2 rounded-xl bg-mintcom-green/10 px-2.5 py-2">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mintcom-green/20 text-mintcom-green">
                              <Check size={10} strokeWidth={3} />
                            </span>
                            <div>
                              <p className="text-[12px] font-semibold text-text-primary dark:text-white">
                                Included by default
                              </p>
                              <p className="text-[10px] leading-snug text-text-secondary">
                                Sales screen access is included, so this role can take orders, accept payments, and open shifts.
                              </p>
                            </div>
                          </div>
                        </div>

                        {DEMO_POS_PERMISSIONS.map((p) => {
                          const on = draftBaseRole === 'ADMIN' || draftPermIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              disabled={draftBaseRole === 'ADMIN'}
                              onClick={() => toggleDraftPerm(p.id)}
                              className={`flex w-full items-center gap-2.5 border-t border-gray-100 px-3 py-2 text-start dark:border-white/5 ${
                                on ? 'bg-mintcom-green/[0.06]' : ''
                              }`}
                            >
                              <Checkbox on={on} disabled={draftBaseRole === 'ADMIN'} />
                              <span className="min-w-0">
                                <span
                                  className={`block text-[13px] ${
                                    on
                                      ? 'font-semibold text-text-primary dark:text-white'
                                      : 'font-medium text-text-primary dark:text-white'
                                  }`}
                                >
                                  {p.label}
                                </span>
                                {'desc' in p && p.desc && (
                                  <span className="text-[11px] text-text-secondary">{p.desc}</span>
                                )}
                              </span>
                            </button>
                          );
                        })}

                        {/* Allowed Discounts (when discounts permission on) */}
                        {(draftBaseRole === 'ADMIN' || draftPermIds.includes('discounts')) && (
                          <div className="border-t border-gray-200 px-3 py-2.5 dark:border-white/10">
                            <button
                              type="button"
                              onClick={() => setDraftDiscountsOpen((v) => !v)}
                              className="flex w-full items-center justify-between gap-2"
                            >
                              <span className="text-[13px] font-semibold text-text-primary dark:text-white">
                                Allowed Discounts
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] text-text-secondary">
                                {draftAllDiscounts
                                  ? 'All Allowed'
                                  : `${draftAllowedDiscountIds.length} selected`}
                                <ChevronDown
                                  size={16}
                                  className={`transition-transform ${draftDiscountsOpen ? 'rotate-180' : ''}`}
                                />
                              </span>
                            </button>
                            {draftDiscountsOpen && (
                              <div className="mt-2 space-y-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftAllDiscounts(true);
                                    setDraftAllowedDiscountIds([]);
                                  }}
                                  className="flex w-full items-center gap-3 py-2 text-start"
                                >
                                  <Checkbox on={draftAllDiscounts} />
                                  <span className="text-[14px] text-text-primary dark:text-white">
                                    Allow all discounts
                                  </span>
                                </button>
                                {!draftAllDiscounts &&
                                  discounts.map((d) => {
                                    const on = draftAllowedDiscountIds.includes(d.id);
                                    return (
                                      <button
                                        key={d.id}
                                        type="button"
                                        onClick={() =>
                                          setDraftAllowedDiscountIds((prev) =>
                                            on ? prev.filter((x) => x !== d.id) : [...prev, d.id],
                                          )
                                        }
                                        className="flex w-full items-center gap-3 py-2 ps-8 text-start"
                                      >
                                        <Checkbox on={on} />
                                        <span>
                                          <span className="block text-[14px] text-text-primary dark:text-white">
                                            {d.name}
                                          </span>
                                          <span className="text-[12px] text-text-secondary">
                                            {d.percentage}% off
                                          </span>
                                        </span>
                                      </button>
                                    );
                                  })}
                                {!draftAllDiscounts && discounts.length === 0 && (
                                  <p className="py-2 text-[12px] text-text-tertiary">
                                    No discounts available. Create discounts in Payment Processes.
                                  </p>
                                )}
                                {draftAllDiscounts && (
                                  <button
                                    type="button"
                                    onClick={() => setDraftAllDiscounts(false)}
                                    className="text-[12px] font-semibold text-mintcom-green"
                                  >
                                    Restrict specific discounts…
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ── Advanced Back Office Permission ── */}
                  <div className="mb-2.5 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                    <div
                      className={`flex items-center justify-between gap-2.5 px-3 py-2.5 ${
                        draftBackofficeAccess ? 'rounded-t-xl' : 'rounded-xl'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            draftBackofficeAccess
                              ? 'bg-[#3B82F6] text-white'
                              : 'bg-gray-100 text-text-secondary dark:bg-white/10'
                          }`}
                        >
                          <Monitor size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1">
                            <span className="text-[13px] font-semibold text-text-primary dark:text-white">
                              Advanced Back Office Permission
                            </span>
                            <span title="Allows access to advanced back office features such as employee management, settings and reports.">
                              <Info size={13} className="text-text-tertiary" />
                            </span>
                          </span>
                          <span className="block text-[10px] leading-snug text-text-secondary">
                            Allow access to the advanced management portal
                          </span>
                        </span>
                      </span>
                      <button
                        type="button"
                        disabled={draftBaseRole === 'ADMIN'}
                        onClick={() => {
                          if (draftBaseRole === 'ADMIN') return;
                          setDraftBackofficeAccess((v) => {
                            const next = !v;
                            if (next && draftBoPermIds.length === 0) {
                              setDraftBoPermIds(['view_reports', 'manage_employees']);
                            }
                            return next;
                          });
                        }}
                        className={`relative h-[22px] w-10 shrink-0 rounded-full p-0.5 transition-colors ${
                          draftBackofficeAccess ? 'bg-[#3B82F6]' : 'bg-gray-300 dark:bg-mintcom-tertiary'
                        } ${draftBaseRole === 'ADMIN' ? 'opacity-60' : ''}`}
                      >
                        <span
                          className={`absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${
                            draftBackofficeAccess ? 'start-[20px]' : 'start-0.5'
                          }`}
                        />
                      </button>
                    </div>

                    {draftBackofficeAccess && (
                      <div className="border-t border-gray-200 dark:border-white/10">
                        <div className="px-3 pb-1 pt-2.5">
                          <div className="mb-1.5 flex gap-2 rounded-xl bg-mintcom-green/10 px-2.5 py-2">
                            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-mintcom-green/20 text-mintcom-green">
                              <Check size={10} strokeWidth={3} />
                            </span>
                            <div>
                              <p className="text-[12px] font-semibold text-text-primary dark:text-white">
                                Included by default
                              </p>
                              <p className="text-[10px] leading-snug text-text-secondary">
                                Basic sales operations are included by default with back office access.
                              </p>
                            </div>
                          </div>
                        </div>
                        {DEMO_BACKOFFICE_PERMISSIONS.map((p) => {
                          const on =
                            draftBaseRole === 'ADMIN' || draftBoPermIds.includes(p.id);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              disabled={draftBaseRole === 'ADMIN'}
                              onClick={() => toggleDraftBoPerm(p.id)}
                              className={`flex w-full items-center gap-2.5 border-t border-gray-100 px-3 py-2 text-start dark:border-white/5 ${
                                on ? 'bg-[#3B82F6]/[0.06]' : ''
                              }`}
                            >
                              <Checkbox on={on} disabled={draftBaseRole === 'ADMIN'} />
                              <span className="min-w-0">
                                <span
                                  className={`block text-[13px] ${
                                    on ? 'font-semibold' : 'font-medium'
                                  } text-text-primary dark:text-white`}
                                >
                                  {p.label}
                                </span>
                                {p.desc && (
                                  <span className="text-[11px] text-text-secondary">{p.desc}</span>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {!draftPosAccess && !draftBackofficeAccess && (
                    <div className="mb-2.5 flex items-center gap-2 rounded-xl border border-[#FCD34D] bg-[#FEF3C7] px-2.5 py-2">
                      <AlertTriangle size={14} className="shrink-0 text-[#D97706]" />
                      <p className="text-[11px] font-semibold text-[#92400E]">
                        This role has no access to POS or Back Office.
                      </p>
                    </div>
                  )}

                  {err('permissions') && (
                    <p className="mb-2 text-[11px] font-medium text-[#D55263]">{err('permissions')}</p>
                  )}

                  {/* Password */}
                  <div className="mb-2.5">
                    <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                      {isAdd ? 'Password' : 'Change Password'}
                      {isAdd ? (
                        <span className="text-[#D55263]"> *</span>
                      ) : (
                        <span className="font-normal text-text-tertiary">
                          {' '}
                          (Leave blank to keep current password)
                        </span>
                      )}
                    </span>
                    <div
                      className={`flex items-center overflow-hidden rounded-xl border bg-white dark:bg-mintcom-dark ${fieldBorder('password')}`}
                    >
                      <input
                        className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none dark:text-white"
                        type={showDraftPass ? 'text' : 'password'}
                        value={draftPass}
                        onChange={(e) => {
                          setDraftPass(e.target.value);
                          if (empFieldErrors.password)
                            setEmpFieldErrors((p) => ({ ...p, password: '' }));
                        }}
                        placeholder={
                          isAdd
                            ? '8+ chars, upper, lower, number'
                            : 'Enter new password'
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowDraftPass((v) => !v)}
                        className="px-2.5 text-mintcom-green"
                        aria-label={showDraftPass ? 'Hide password' : 'Show password'}
                      >
                        {showDraftPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {err('password') && (
                      <p className="mt-1 text-[11px] font-medium text-[#D55263]">{err('password')}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-1">
                    <span className="mb-1.5 block text-[12px] font-medium text-text-secondary">
                      {isAdd ? 'Confirm Password' : 'Confirm New Password'}
                      {isAdd && <span className="text-[#D55263]"> *</span>}
                    </span>
                    <div
                      className={`flex items-center overflow-hidden rounded-xl border bg-white dark:bg-mintcom-dark ${fieldBorder('confirmPassword')}`}
                    >
                      <input
                        className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[13px] outline-none dark:text-white"
                        type={showDraftConfirmPass ? 'text' : 'password'}
                        value={draftConfirmPass}
                        onChange={(e) => {
                          setDraftConfirmPass(e.target.value);
                          if (empFieldErrors.confirmPassword)
                            setEmpFieldErrors((p) => ({ ...p, confirmPassword: '' }));
                        }}
                        placeholder="Confirm Password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDraftConfirmPass((v) => !v)}
                        className="px-2.5 text-mintcom-green"
                        aria-label={showDraftConfirmPass ? 'Hide password' : 'Show password'}
                      >
                        {showDraftConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {err('confirmPassword') && (
                      <p className="mt-1 text-[11px] font-medium text-[#D55263]">
                        {err('confirmPassword')}
                      </p>
                    )}
                  </div>

                  {isAdd && draftPin && (
                    <p className="mt-2 text-center text-[10px] text-text-tertiary">
                      Password {draftPin} auto-generated for login (same as real POS).
                    </p>
                  )}
                </div>

                {/* Sticky footer — always visible inside the frame */}
                <div className="flex shrink-0 gap-2 border-t border-gray-200 bg-white px-3.5 pt-2.5 dark:border-white/10 dark:bg-mintcom-surface sm:px-4 sm:pt-3" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="min-h-[44px] flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-semibold text-text-secondary dark:border-white/10"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveModal}
                    className="min-h-[44px] flex-1 rounded-xl bg-mintcom-green py-2.5 text-[13px] font-bold text-white shadow-sm"
                  >
                    {isAdd ? 'Confirm' : 'Save'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {modal?.type === 'discount' && (
          <ModalShell
            title={modal.d ? 'Edit Discount' : 'Create Discount'}
            onClose={() => setModal(null)}
            footer={
              <button type="button" onClick={saveModal} className="w-full rounded-xl bg-mintcom-green py-2.5 text-sm font-black text-white">
                Confirm
              </button>
            }
          >
            <Field label="Discount Name">
              <input className={inputCls} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g., Student discount" />
            </Field>
            <Field label="Discount Percentage">
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                <span className="flex h-11 w-11 items-center justify-center bg-mintcom-green/10 text-base font-extrabold text-mintcom-green">%</span>
                <input
                  className="h-11 flex-1 bg-transparent px-3 text-sm font-bold outline-none dark:text-white tabular-nums"
                  value={draftPct}
                  inputMode="numeric"
                  placeholder="0.00"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                    const cents = digits === '' ? 0 : parseInt(digits, 10);
                    if (cents > 10000) return;
                    setDraftPct((cents / 100).toFixed(2));
                  }}
                />
              </div>
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-cream-50 px-3 py-2.5 dark:border-white/8 dark:bg-mintcom-dark">
              <span className="text-[13px] font-bold text-text-primary dark:text-white">Admin Only</span>
              <Toggle on={draftAdminOnly} onToggle={() => setDraftAdminOnly((v) => !v)} />
            </div>
          </ModalShell>
        )}

        {modal?.type === 'pay' && (
          <ModalShell
            title={modal.p ? 'Edit Other Payment Method' : 'Add Other Payment Method'}
            onClose={() => setModal(null)}
            footer={
              <button type="button" onClick={saveModal} className="w-full rounded-xl bg-mintcom-green py-2.5 text-sm font-black text-white">
                Save
              </button>
            }
          >
            <Field label="Other payment name">
              <input className={inputCls} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g., Apple Pay" />
            </Field>
            <Field label="Other payment logo">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mintcom-green/15 text-xl">{draftEmoji || ''}</span>
                <button
                  type="button"
                  onClick={() => ping('Demo only: image upload disabled')}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-bold text-text-secondary dark:border-white/10 dark:text-mintcom-textSecondary"
                >
                  <UploadCloud size={14} /> Upload Image
                </button>
              </div>
            </Field>
          </ModalShell>
        )}

        {modal?.type === 'card' && (
          <ModalShell
            title={modal.c ? 'Edit Card Type' : 'Add Card Type'}
            onClose={() => setModal(null)}
            footer={
              <button type="button" onClick={saveModal} className="w-full rounded-xl bg-mintcom-green py-2.5 text-sm font-black text-white">
                {modal.c ? 'Save' : 'Add'}
              </button>
            }
          >
            <Field label="Card Type Name">
              <input className={inputCls} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g., Visa" />
            </Field>
            <Field label="Card Type Logo">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                  <CreditCard size={22} />
                </span>
                <button
                  type="button"
                  onClick={() => ping('Demo only: image upload disabled')}
                  className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-bold text-text-secondary dark:border-white/10 dark:text-mintcom-textSecondary"
                >
                  <UploadCloud size={14} /> Upload Image
                </button>
              </div>
            </Field>
          </ModalShell>
        )}

        {modal?.type === 'reward' && (
          <ModalShell
            title={modal.r ? 'Edit Reward' : 'Add Reward'}
            onClose={() => setModal(null)}
            footer={
              <button type="button" onClick={saveModal} className="w-full rounded-xl bg-mintcom-green py-2.5 text-sm font-black text-white">
                Save
              </button>
            }
          >
            <Field label="Reward Name">
              <input className={inputCls} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g., Free coffee" />
            </Field>
            <Field label="Reward Type">
              <div className="grid grid-cols-2 gap-2">
                {(['FREE_ITEM', 'DISCOUNT'] as const).map((tp) => {
                  const on = draftRewardType === tp;
                  return (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setDraftRewardType(tp)}
                      className={`rounded-xl border py-2.5 text-[13px] font-bold ${
                        on
                          ? 'border-mintcom-green bg-mintcom-green text-white'
                          : 'border-gray-200 text-text-secondary dark:border-white/10 dark:text-mintcom-textSecondary'
                      }`}
                    >
                      {tp === 'FREE_ITEM' ? 'Free Item' : 'Discount'}
                    </button>
                  );
                })}
              </div>
            </Field>
            {draftRewardType === 'DISCOUNT' && (
              <Field label="Discount Percentage">
                <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                  <span className="flex h-11 w-11 items-center justify-center bg-mintcom-green/10 text-base font-extrabold text-mintcom-green">%</span>
                  <input
                    className="h-11 flex-1 bg-transparent px-3 text-sm font-bold outline-none dark:text-white tabular-nums"
                    value={draftPct}
                    inputMode="numeric"
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                      const cents = digits === '' ? 0 : parseInt(digits, 10);
                      if (cents > 10000) return;
                      setDraftPct((cents / 100).toFixed(2));
                    }}
                  />
                </div>
              </Field>
            )}
            <Field label="Points Required">
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                <span className="flex h-11 items-center bg-mintcom-green/10 px-3 text-[11px] font-black text-mintcom-green">PTS</span>
                <input
                  className="h-11 flex-1 bg-transparent px-3 text-sm font-bold outline-none dark:text-white"
                  value={draftRewardPoints}
                  inputMode="numeric"
                  onChange={(e) => setDraftRewardPoints(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </Field>
          </ModalShell>
        )}

        {modal?.type === 'product' && (
          <DemoProductFormModal
            open
            mode={modal.p ? 'edit' : 'add'}
            categories={categories.map((c) => ({ id: c.id, name: c.name, emoji: c.emoji }))}
            addons={addons.map((a) => ({ id: a.id, name: a.name, multi: a.multi }))}
            taxes={taxesList.map((t) => ({ id: t.id, name: t.name, rate: t.rate, isDefault: t.isDefault }))}
            taxRate={parseFloat(taxRate) || 8}
            initial={
              modal.p
                ? {
                    id: modal.p.id,
                    name: modal.p.name,
                    price: modal.p.price,
                    costPrice: modal.p.costPrice ?? 0,
                    emoji: modal.p.emoji,
                    categoryId: modal.p.categoryId,
                    active: modal.p.active,
                    description: modal.p.description ?? '',
                    trackStock: modal.p.trackStock ?? false,
                    availableStock: modal.p.availableStock ?? 0,
                    yellowThreshold: modal.p.yellowThreshold ?? 5,
                    redThreshold: modal.p.redThreshold ?? 2,
                    allowNegativeStock: modal.p.allowNegativeStock ?? false,
                    attributeIds: modal.p.attributeIds ?? [],
                    imageDataUrl: modal.p.imageDataUrl ?? null,
                    taxId: modal.p.taxId ?? null,
                    taxRate: modal.p.taxRate,
                  }
                : {
                    categoryId: categories[0]?.id ?? 'bev',
                    taxId: taxesList.find((t) => t.isDefault)?.id ?? taxesList[0]?.id,
                  }
            }
            willHardDelete={modal.p ? modal.p.id.startsWith('p-') : false}
            onClose={() => setModal(null)}
            onSave={saveProductForm}
            onRemove={
              modal.p
                ? () => {
                    const id = modal.p!.id;
                    const hard = id.startsWith('p-');
                    if (hard) {
                      setProducts((list) => list.filter((p) => p.id !== id));
                      logActivity('Deleted product', modal.p!.name);
                      softCatalogPing('Product deleted');
                    } else {
                      setProducts((list) => list.map((p) => (p.id === id ? { ...p, active: false } : p)));
                      logActivity('Archived product', modal.p!.name);
                      softCatalogPing('Product archived');
                    }
                    setModal(null);
                  }
                : undefined
            }
          />
        )}

        {modal?.type === 'category' && (() => {
          const isEdit = !!modal.c;
          const itemCount = modal.c ? products.filter((p) => p.categoryId === modal.c!.id).length : 0;
          const canRemove = isEdit && itemCount === 0;
          const cannotRemove = isEdit && itemCount > 0;
          const nameError = draftName !== '' && !draftName.trim();
          const iconError = !!draftName.trim() && !draftIcon;
          const canSave = !!draftName.trim() && !!draftIcon;
          return (
            <ModalShell
              title={isEdit ? 'Edit Category' : 'Add Category'}
              onClose={() => setModal(null)}
              footer={
                <div className="flex gap-2.5">
                  {isEdit && (
                    <button
                      type="button"
                      disabled={!canRemove}
                      onClick={() => {
                        if (!canRemove) return;
                        setCategories((list) => list.filter((c) => c.id !== modal.c!.id));
                        logActivity('Deleted category', modal.c!.name);
                        setModal(null);
                        softCatalogPing('Category deleted');
                      }}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-bold text-white ${
                        canRemove ? 'bg-mintcom-red' : 'cursor-not-allowed bg-gray-400 opacity-60'
                      }`}
                    >
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-text-secondary dark:border-white/10 dark:bg-mintcom-dark dark:text-mintcom-textSecondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!canSave}
                    onClick={saveModal}
                    className={`flex-1 rounded-xl py-2.5 text-sm font-black text-white ${
                      canSave ? 'bg-mintcom-green' : 'cursor-not-allowed bg-mintcom-green/45'
                    }`}
                  >
                    {isEdit ? 'Save' : 'Add'}
                  </button>
                </div>
              }
            >
              {/* Category Name */}
              <p className="mb-1.5 text-[13px] text-text-secondary dark:text-mintcom-textSecondary">Category Name</p>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="e.g., Salad"
                className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none focus:border-mintcom-green dark:bg-mintcom-dark dark:text-white ${
                  nameError ? 'border-mintcom-red' : 'border-gray-200 dark:border-white/10'
                }`}
              />
              {nameError && (
                <p className="mt-1 text-[12px] text-mintcom-red">Please enter a category name</p>
              )}

              {/* Choose Icon */}
              <p className="mb-1.5 mt-4 text-[13px] text-text-secondary dark:text-mintcom-textSecondary">Choose Icon</p>
              <div
                className={`rounded-xl border bg-gray-50 p-3 dark:bg-mintcom-dark ${
                  iconError ? 'border-mintcom-red' : 'border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="flex flex-wrap justify-center gap-3">
                  {CATEGORY_ICONS.map(({ key, Icon }) => {
                    const on = draftIcon === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setDraftIcon(key)}
                        className={`flex h-[54px] w-[54px] items-center justify-center rounded-xl border shadow-sm transition-colors ${
                          on
                            ? 'border-mintcom-green bg-mintcom-green text-white'
                            : 'border-gray-200 bg-white text-gray-400 dark:border-white/10 dark:bg-mintcom-surface'
                        }`}
                      >
                        <Icon size={28} />
                      </button>
                    );
                  })}
                </div>
              </div>
              {iconError && <p className="mt-1 text-[12px] text-mintcom-red">Please select an icon</p>}

              {/* Cannot-remove warning */}
              {cannotRemove && (
                <div className="mt-3 flex items-start gap-2 rounded-xl border-s-4 border-mintcom-red bg-mintcom-red/10 px-3 py-2.5">
                  <Info size={18} className="mt-0.5 shrink-0 text-mintcom-red" />
                  <p className="text-[13px] font-semibold text-mintcom-red">
                    Cannot delete category, you have ({itemCount}) items assigned to this category
                  </p>
                </div>
              )}
            </ModalShell>
          );
        })()}

        {modal?.type === 'addon-opt' && (
          <ModalShell
            title={modal.opt ? 'Edit add-on option' : 'Add add-on option'}
            onClose={() => setModal(null)}
            footer={
              <button type="button" onClick={saveModal} className="w-full rounded-xl bg-mintcom-green py-2.5 text-sm font-black text-white">
                {modal.opt ? 'Save' : 'Add'}
              </button>
            }
          >
            <Field label="Name">
              <input className={inputCls} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Add-on option (e.g., Small, Large)" />
            </Field>
            <Field label="Price">
              <div className="flex items-center overflow-hidden rounded-xl border border-gray-200 dark:border-white/10">
                <span className="flex h-11 w-11 items-center justify-center bg-mintcom-green/10 text-base font-extrabold text-mintcom-green">$</span>
                <input
                  className="h-11 flex-1 bg-transparent px-3 text-sm font-bold outline-none dark:text-white tabular-nums"
                  value={draftPrice}
                  inputMode="numeric"
                  placeholder="0.00"
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 7);
                    const cents = digits === '' ? 0 : parseInt(digits, 10);
                    setDraftPrice((cents / 100).toFixed(2));
                  }}
                />
              </div>
            </Field>
          </ModalShell>
        )}

        {modal?.type === 'addon-group' && (
          <ModalShell
            title={modal.g ? 'Edit Attribute' : 'Add Attribute'}
            subtitle="Define a category of add-ons"
            onClose={() => setModal(null)}
            footer={
              <button type="button" onClick={saveModal} className="w-full rounded-xl bg-mintcom-green py-2.5 text-sm font-black text-white">
                {modal.g ? 'Save' : 'Add'}
              </button>
            }
          >
            <Field label="Name">
              <input className={inputCls} value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="Add-on category (e.g., sizes)" />
            </Field>
            <Field label="Input Type">
              <div className="grid grid-cols-2 gap-2">
                {([
                  { multi: false, label: 'Single Select' },
                  { multi: true, label: 'Multi Select' },
                ]).map((opt) => {
                  const on = draftMulti === opt.multi;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setDraftMulti(opt.multi)}
                      className={`rounded-xl border py-2.5 text-[13px] font-bold ${
                        on
                          ? 'border-mintcom-green bg-mintcom-green text-white'
                          : 'border-gray-200 text-text-secondary dark:border-white/10 dark:text-mintcom-textSecondary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[11px] text-text-tertiary">
                Choose whether customers can select one option or multiple options.
              </p>
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-cream-50 px-3 py-2.5 dark:border-white/8 dark:bg-mintcom-dark">
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-text-primary dark:text-white">Required</p>
                <p className="text-[11px] text-text-tertiary">Customers must choose at least one option.</p>
              </div>
              <Toggle on={draftRequired} onToggle={() => setDraftRequired((v) => !v)} />
            </div>
          </ModalShell>
        )}

        {modal?.type === 'printer' && (() => {
          const connIcon = (c: DemoPrinter['connection']) =>
            c === 'WIFI' ? Wifi : c === 'BLUETOOTH' ? Bluetooth : Cable;
          const statusColor = (p: DemoPrinter) => {
            if (connectedPrinterId === p.id) return '#22C55E';
            if (p.status === 'ERROR') return '#D55263';
            return '#9CA3AF';
          };
          const runScan = (type: 'BLUETOOTH' | 'WIFI') => {
            setScanType(type);
            setPrinterScanning(true);
            setShowScanResults(false);
            window.setTimeout(() => {
              setPrinterScanning(false);
              const found: DemoPrinter[] =
                type === 'BLUETOOTH'
                  ? [
                      {
                        id: `scan-bt-${Date.now()}`,
                        name: 'Epson TM-m30',
                        connection: 'BLUETOOTH',
                        status: 'DISCONNECTED',
                        address: 'AA:BB:CC:DD:EE:FF',
                        paperWidth: 80,
                      },
                    ]
                  : [
                      {
                        id: `scan-wifi-${Date.now()}`,
                        name: 'Star mC-Print3',
                        connection: 'WIFI',
                        status: 'DISCONNECTED',
                        address: '192.168.1.88',
                        paperWidth: 80,
                      },
                    ];
              const newOnes = found.filter(
                (fp) => !demoPrinters.some((sp) => sp.address === fp.address || sp.name === fp.name),
              );
              setScannedPrinters(newOnes);
              setShowScanResults(true);
              if (newOnes.length === 0) {
                setInfoBanner({
                  title: 'No Printers Found',
                  message: 'Make sure your printer is turned on and within range.',
                  type: 'info',
                });
              }
            }, 900);
          };

          return (
            <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/55 p-2.5 backdrop-blur-[2px] sm:p-3">
              <button
                type="button"
                aria-label="Close"
                className="absolute inset-0"
                onClick={() => setModal(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                role="dialog"
                aria-labelledby="printer-modal-title"
                className="relative flex max-h-[min(92%,560px)] w-full max-w-[min(94%,440px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header — icon tile + title + business name (POS PrinterSettingsModal) */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/15 text-mintcom-green">
                      <Printer size={24} />
                    </span>
                    <div className="min-w-0">
                      <h3
                        id="printer-modal-title"
                        className="text-[18px] font-bold text-text-primary dark:text-white"
                      >
                        Printer Settings
                      </h3>
                      <p className="truncate text-[13px] text-text-tertiary">
                        {bizName || 'Cafe Delight'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-tertiary hover:bg-gray-100 dark:hover:bg-white/10"
                    aria-label="Close"
                  >
                    <X size={22} />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
                  {/* Configured Printers */}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <CircleCheck size={18} className="text-mintcom-green" />
                      <p className="text-[15px] font-bold text-text-primary dark:text-white">
                        Configured Printers
                      </p>
                    </div>

                    {demoPrinters.length === 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-cream-50 px-4 py-8 text-center dark:border-white/10 dark:bg-mintcom-dark">
                        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-200/60 text-text-tertiary dark:bg-white/10">
                          <Printer size={32} />
                        </span>
                        <p className="text-[14px] font-semibold text-text-secondary">No printers configured</p>
                        <p className="mt-1 text-[12px] text-text-tertiary">Scan for printers to add one</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {demoPrinters.map((p) => {
                          const connected = connectedPrinterId === p.id;
                          const ConnIcon = connIcon(p.connection);
                          const sc = statusColor(p);
                          return (
                            <div
                              key={p.id}
                              className="rounded-xl border border-gray-200 bg-white p-3.5 dark:border-white/10 dark:bg-mintcom-surface"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                                  <ConnIcon size={22} />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p className="truncate text-[14px] font-bold text-text-primary dark:text-white">
                                      {p.name}
                                    </p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPrinterId(p.id);
                                        setEditedPrinterName(p.name);
                                      }}
                                      className="rounded p-0.5 text-text-tertiary hover:text-mintcom-green"
                                      title="Edit name"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    {p.isDefault && (
                                      <span className="rounded-md bg-mintcom-green px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-0.5 text-[12px] text-text-tertiary">
                                    {p.connection} · {p.address || '—'}
                                  </p>
                                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                    <span
                                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                      style={{ background: `${sc}18`, color: sc }}
                                    >
                                      <span
                                        className="h-1.5 w-1.5 rounded-full"
                                        style={{ background: sc }}
                                      />
                                      {connected
                                        ? 'Connected'
                                        : p.status === 'ERROR'
                                          ? 'Error'
                                          : 'Disconnected'}
                                    </span>
                                    <span className="text-[11px] font-medium text-text-secondary">
                                      {p.paperWidth}mm
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-3 flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (connected) {
                                      setConnectedPrinterId(null);
                                      setDemoPrinters((list) =>
                                        list.map((x) =>
                                          x.id === p.id ? { ...x, status: 'DISCONNECTED' } : x,
                                        ),
                                      );
                                      ping('Printer disconnected');
                                    } else {
                                      setConnectedPrinterId(p.id);
                                      setDemoPrinters((list) =>
                                        list.map((x) => ({
                                          ...x,
                                          status:
                                            x.id === p.id
                                              ? 'CONNECTED'
                                              : x.status === 'CONNECTED'
                                                ? 'DISCONNECTED'
                                                : x.status,
                                        })),
                                      );
                                      ping(`Connected · ${p.name}`);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-mintcom-green px-2.5 py-1.5 text-[12px] font-semibold text-mintcom-green"
                                >
                                  {connected ? <ZapOff size={14} /> : <Zap size={14} />}
                                  {connected ? 'Disconnect' : 'Connect'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInfoBanner({
                                      title: 'Success',
                                      message: 'Test receipt printed successfully!',
                                      type: 'success',
                                    });
                                    ping(`Test print · ${p.name}`);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] font-semibold text-text-primary dark:border-white/10 dark:text-white"
                                >
                                  <Printer size={14} /> Test
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = p.paperWidth === 80 ? 58 : 80;
                                    setDemoPrinters((list) =>
                                      list.map((x) =>
                                        x.id === p.id ? { ...x, paperWidth: next } : x,
                                      ),
                                    );
                                    if (p.isDefault) setPaperWidth(next);
                                    markDirty();
                                    ping(`Paper width · ${next}mm`);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[12px] font-semibold text-text-primary dark:border-white/10 dark:text-white"
                                >
                                  {p.paperWidth}mm
                                </button>
                                {!p.isDefault && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDemoPrinters((list) =>
                                        list.map((x) => ({ ...x, isDefault: x.id === p.id })),
                                      );
                                      setPaperWidth(p.paperWidth);
                                      markDirty();
                                      ping('Default printer set');
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-mintcom-green px-2.5 py-1.5 text-[12px] font-semibold text-mintcom-green"
                                  >
                                    <Star size={14} /> Set Default
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModal({
                                      type: 'delete',
                                      title: 'Remove Printer',
                                      body: `Are you sure you want to remove "${p.name}"?`,
                                      confirmLabel: 'Delete',
                                      onConfirm: () => {
                                        if (connectedPrinterId === p.id) setConnectedPrinterId(null);
                                        setDemoPrinters((list) => list.filter((x) => x.id !== p.id));
                                        markDirty();
                                        ping('Printer removed');
                                        setModal({ type: 'printer' });
                                      },
                                    });
                                  }}
                                  className="inline-flex items-center justify-center rounded-lg p-1.5 text-[#D55263]"
                                  title="Remove"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Printer */}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Plus size={18} className="text-text-primary dark:text-white" />
                      <p className="text-[15px] font-bold text-text-primary dark:text-white">Add Printer</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={printerScanning}
                        onClick={() => runScan('BLUETOOTH')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-mintcom-green py-3 text-[13px] font-bold text-white disabled:opacity-70"
                      >
                        <Bluetooth size={18} />
                        {printerScanning && scanType === 'BLUETOOTH' ? 'Scanning…' : 'Scan Bluetooth'}
                      </button>
                      <button
                        type="button"
                        disabled={printerScanning}
                        onClick={() => runScan('WIFI')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B82F6] py-3 text-[13px] font-bold text-white disabled:opacity-70"
                      >
                        <Wifi size={18} />
                        {printerScanning && scanType === 'WIFI' ? 'Scanning…' : 'Scan Network'}
                      </button>
                    </div>

                    {showScanResults && scannedPrinters.length > 0 && (
                      <div className="mt-3 rounded-xl border border-mintcom-green/30 bg-mintcom-green/[0.06] p-3">
                        <p className="mb-2 text-[13px] font-bold text-mintcom-green">
                          Found {scannedPrinters.length} printer(s)
                        </p>
                        {scannedPrinters.map((sp) => {
                          const SpIcon = connIcon(sp.connection);
                          return (
                            <div
                              key={sp.id}
                              className="flex items-center justify-between gap-2 border-b border-mintcom-green/15 py-2 last:border-0"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <SpIcon size={16} className="shrink-0 text-text-tertiary" />
                                <div className="min-w-0">
                                  <p className="truncate text-[13px] font-semibold text-text-primary dark:text-white">
                                    {sp.name}
                                  </p>
                                  <p className="text-[11px] text-text-tertiary">{sp.address}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setDemoPrinters((list) => [
                                    ...list,
                                    {
                                      ...sp,
                                      isDefault: list.length === 0,
                                      status: 'DISCONNECTED',
                                    },
                                  ]);
                                  setScannedPrinters((list) => list.filter((x) => x.id !== sp.id));
                                  markDirty();
                                  setInfoBanner({
                                    title: 'Printer Added',
                                    message: `${sp.name} has been added successfully.`,
                                    type: 'success',
                                  });
                                }}
                                className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-mintcom-green px-2.5 py-1.5 text-[12px] font-bold text-white"
                              >
                                <Plus size={14} /> Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Network Printer by IP */}
                    <div className="mt-3 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/[0.06] p-3.5">
                      <div className="mb-1 flex items-center gap-2 text-[#3B82F6]">
                        <Cable size={20} />
                        <p className="text-[14px] font-bold">Network Printer (Wired/Ethernet)</p>
                      </div>
                      <p className="mb-3 text-[12px] leading-relaxed text-text-secondary">
                        For printers connected to your router via Ethernet cable. Enter the printer&apos;s IP
                        address manually.
                      </p>
                      {!showManualAdd ? (
                        <button
                          type="button"
                          onClick={() => setShowManualAdd(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#3B82F6] bg-[#3B82F6]/15 px-3 py-2 text-[13px] font-bold text-[#3B82F6]"
                        >
                          <Plus size={16} /> Add Network Printer by IP
                        </button>
                      ) : (
                        <div className="space-y-2.5">
                          <div>
                            <p className="mb-1 text-[12px] font-medium text-text-secondary">
                              Printer Name (Optional)
                            </p>
                            <input
                              className={inputCls}
                              value={manualName}
                              onChange={(e) => setManualName(e.target.value)}
                              placeholder="e.g., Kitchen Printer"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <p className="mb-1 text-[12px] font-medium text-text-secondary">
                                IP Address <span className="text-[#D55263]">*</span>
                              </p>
                              <input
                                className={inputCls}
                                value={manualIp}
                                onChange={(e) => setManualIp(e.target.value)}
                                placeholder="192.168.1.100"
                                inputMode="decimal"
                              />
                            </div>
                            <div>
                              <p className="mb-1 text-[12px] font-medium text-text-secondary">Port</p>
                              <input
                                className={inputCls}
                                value={manualPort}
                                onChange={(e) =>
                                  setManualPort(e.target.value.replace(/\D/g, '').slice(0, 5))
                                }
                                placeholder="9100"
                                inputMode="numeric"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowManualAdd(false);
                                setManualIp('');
                                setManualPort('9100');
                                setManualName('');
                              }}
                              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-semibold text-text-secondary dark:border-white/10"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const ipOk =
                                  /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/.test(manualIp);
                                if (!ipOk) {
                                  setInfoBanner({
                                    title: 'Invalid IP Address',
                                    message:
                                      'Please Enter a Valid IP Address (e.g., 192.168.1.100).',
                                    type: 'error',
                                  });
                                  return;
                                }
                                const port = parseInt(manualPort, 10) || 9100;
                                if (port < 1 || port > 65535) {
                                  setInfoBanner({
                                    title: 'Invalid Port',
                                    message: 'Please enter a valid port number (1-65535).',
                                    type: 'error',
                                  });
                                  return;
                                }
                                if (
                                  demoPrinters.some(
                                    (x) => x.address === manualIp && x.connection === 'ETHERNET',
                                  )
                                ) {
                                  setInfoBanner({
                                    title: 'Printer Already Exists',
                                    message: 'A printer with this IP and port is already configured.',
                                    type: 'error',
                                  });
                                  return;
                                }
                                const name =
                                  manualName.trim() || `Network Printer (${manualIp})`;
                                setDemoPrinters((list) => [
                                  ...list,
                                  {
                                    id: `net-${manualIp}-${port}`,
                                    name,
                                    connection: 'ETHERNET',
                                    status: 'DISCONNECTED',
                                    address: `${manualIp}:${port}`,
                                    paperWidth: 80,
                                    isDefault: list.length === 0,
                                  },
                                ]);
                                setShowManualAdd(false);
                                setManualIp('');
                                setManualPort('9100');
                                setManualName('');
                                markDirty();
                                setInfoBanner({
                                  title: 'Printer Added',
                                  message: `${name} has been added successfully.`,
                                  type: 'success',
                                });
                              }}
                              className="inline-flex flex-1 items-center justify-center gap-1 rounded-xl bg-[#3B82F6] py-2.5 text-[13px] font-bold text-white"
                            >
                              <Plus size={14} /> Add Printer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Testing Mode / Debug */}
                    <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-50/80 p-3.5 dark:bg-amber-500/10">
                      <p className="text-[14px] font-bold text-amber-700 dark:text-amber-400">
                        🔧 Testing Mode
                      </p>
                      <p className="mb-3 mt-1 text-[12px] leading-relaxed text-text-secondary">
                        Don&apos;t have a printer yet? Add a virtual printer to test the functionality.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (demoPrinters.some((x) => x.id.startsWith('debug-'))) {
                            setInfoBanner({
                              title: 'Debug Printer Added',
                              message: 'A virtual debug printer is already configured.',
                              type: 'info',
                            });
                            return;
                          }
                          setDemoPrinters((list) => [
                            ...list,
                            {
                              id: `debug-${Date.now()}`,
                              name: 'Debug Printer (Virtual)',
                              connection: 'WIFI',
                              status: 'DISCONNECTED',
                              address: 'debug://local',
                              paperWidth: 80,
                              isDefault: list.length === 0,
                            },
                          ]);
                          markDirty();
                          setInfoBanner({
                            title: 'Debug Printer Added',
                            message:
                              'A virtual debug printer has been added for testing purposes.',
                            type: 'success',
                          });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 px-3 py-2 text-[13px] font-bold text-amber-700 dark:text-amber-400"
                      >
                        <Bug size={18} /> Add Debug Printer (For Testing)
                      </button>
                    </div>
                  </div>

                  {/* Printing Options */}
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                      <Settings2 size={18} className="text-text-primary dark:text-white" />
                      <p className="text-[15px] font-bold text-text-primary dark:text-white">
                        Printing Options
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-b border-gray-200 pb-4 dark:border-white/10">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-text-primary dark:text-white">
                          Number of copies
                        </p>
                        <p className="text-[12px] text-text-secondary">
                          Print multiple copies of each receipt
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPrintCopies((c) => Math.max(1, c - 1))}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10"
                        >
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center text-[15px] font-bold tabular-nums text-text-primary dark:text-white">
                          {printCopies}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPrintCopies((c) => Math.min(10, c + 1))}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Open Cash Drawer */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!connectedPrinterId) {
                        setInfoBanner({
                          title: 'Error',
                          message: 'Failed to open cash drawer',
                          type: 'error',
                        });
                        return;
                      }
                      ping('Cash drawer opened (demo)');
                      setInfoBanner({
                        title: 'Success',
                        message: 'Cash drawer opened.',
                        type: 'success',
                      });
                    }}
                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-mintcom-green py-3.5 text-[14px] font-bold text-mintcom-green"
                  >
                    <CreditCard size={22} />
                    Open Cash Drawer
                  </button>
                </div>
              </motion.div>

              {/* Edit printer name nested modal */}
              {editingPrinterId && (
                <div className="fixed inset-0 z-[95] flex items-center justify-center px-6">
                  <button
                    type="button"
                    className="absolute inset-0 bg-black/50"
                    aria-label="Close"
                    onClick={() => setEditingPrinterId(null)}
                  />
                  <div className="relative w-full max-w-sm rounded-xl border border-gray-200 bg-white p-5 shadow-xl dark:border-white/10 dark:bg-mintcom-surface">
                    <p className="mb-3 text-[16px] font-bold text-text-primary dark:text-white">
                      Edit Printer Name
                    </p>
                    <input
                      className={inputCls}
                      value={editedPrinterName}
                      onChange={(e) => setEditedPrinterName(e.target.value)}
                      placeholder="Enter printer name"
                      autoFocus
                    />
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPrinterId(null)}
                        className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-semibold dark:border-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!editedPrinterName.trim()) return;
                          setDemoPrinters((list) =>
                            list.map((x) =>
                              x.id === editingPrinterId
                                ? { ...x, name: editedPrinterName.trim() }
                                : x,
                            ),
                          );
                          setEditingPrinterId(null);
                          markDirty();
                          ping('Printer name updated');
                        }}
                        className="flex-1 rounded-xl bg-mintcom-green py-2.5 text-[13px] font-bold text-white"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Delete employee — password confirmation like POS PasswordConfirmationModal */}
        {modal?.type === 'delete' && modal.title === 'Delete Employee' && (
          <ModalShell
            title={modal.title}
            onClose={() => {
              setModal(null);
              setDeletePass('');
              setDeletePassError('');
            }}
            footer={
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModal(null);
                    setDeletePass('');
                    setDeletePassError('');
                  }}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold dark:border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!deletePass.trim()) {
                      setDeletePassError('Enter your password to confirm.');
                      return;
                    }
                    // Demo: any non-empty password works
                    setDeletePassError('');
                    modal.onConfirm();
                  }}
                  className="flex-1 rounded-xl bg-[#D55263] py-2.5 text-sm font-black text-white"
                >
                  {modal.confirmLabel ?? 'Delete Employee'}
                </button>
              </div>
            }
          >
            <div className="mb-4 flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D55263]/15 text-[#D55263]">
                <Trash2 size={28} />
              </span>
            </div>
            <p className="mb-4 text-center text-sm leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
              {modal.body}
            </p>
            <Field label="Your Password">
              <input
                className={inputCls}
                type="password"
                value={deletePass}
                onChange={(e) => {
                  setDeletePass(e.target.value);
                  setDeletePassError('');
                }}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </Field>
            {deletePassError && (
              <p className="text-[12px] font-medium text-[#D55263]">{deletePassError}</p>
            )}
          </ModalShell>
        )}

        {modal?.type === 'delete' && modal.title !== 'Delete Employee' && (
          <ConfirmModal
            open
            title={modal.title}
            body={modal.body}
            confirmLabel={modal.confirmLabel ?? 'Delete'}
            danger
            onCancel={() => {
              if (modal.title === 'Remove Printer') {
                setModal({ type: 'printer' });
              } else {
                setModal(null);
              }
            }}
            onConfirm={modal.onConfirm}
          />
        )}

        {/* Tax Editor Modal — matches POS TaxRatesGroup modal */}
        {taxEditor && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px]">
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0"
              onClick={() => setTaxEditor(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative flex h-auto max-h-[min(90%,500px)] w-full max-w-[420px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-white/10">
                <span className="w-8" />
                <h3 className="text-center text-[16px] font-bold text-text-primary dark:text-white">
                  {taxEditor.id
                    ? taxEditor.isDefault
                      ? 'Edit Default Sales Tax'
                      : 'Edit Tax Rate'
                    : 'Add Tax Rate'}
                </h3>
                <button
                  type="button"
                  onClick={() => setTaxEditor(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Content */}
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {/* 1. Tax Name */}
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-text-secondary dark:text-mintcom-textSecondary">
                    Tax Name
                  </label>
                  <div
                    className={`flex items-center overflow-hidden rounded-xl border bg-gray-50 dark:bg-mintcom-dark ${
                      taxNameError
                        ? 'border-red-500'
                        : 'border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center border-e border-gray-200 text-text-tertiary dark:border-white/10">
                      <Tag size={16} />
                    </span>
                    <input
                      value={taxEditor.name}
                      onChange={(e) => {
                        setTaxEditor((prev) => (prev ? { ...prev, name: e.target.value } : null));
                        if (taxNameError) setTaxNameError('');
                      }}
                      placeholder="e.g. Sales Tax"
                      className="h-11 flex-1 bg-transparent px-3 text-[14px] font-medium outline-none dark:text-white"
                    />
                  </div>
                  {taxNameError && (
                    <p className="mt-1 text-[11px] font-medium text-red-500">{taxNameError}</p>
                  )}
                </div>

                {/* 2. Rate Percentage */}
                <div>
                  <label className="mb-1.5 block text-[12px] font-bold text-text-secondary dark:text-mintcom-textSecondary">
                    Rate Percentage (%)
                  </label>
                  <div
                    className={`flex items-center overflow-hidden rounded-xl border bg-gray-50 dark:bg-mintcom-dark ${
                      taxRateError
                        ? 'border-red-500'
                        : 'border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center border-e border-gray-200 text-base font-extrabold text-mintcom-green dark:border-white/10">
                      %
                    </span>
                    <input
                      value={taxEditor.ratePercent}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, '');
                        setTaxEditor((prev) => (prev ? { ...prev, ratePercent: val } : null));
                        if (taxRateError) setTaxRateError('');
                      }}
                      placeholder="16"
                      inputMode="decimal"
                      className="h-11 flex-1 bg-transparent px-3 text-[14px] font-bold tabular-nums outline-none dark:text-white"
                    />
                  </div>
                  {taxRateError && (
                    <p className="mt-1 text-[11px] font-medium text-red-500">{taxRateError}</p>
                  )}

                  {/* Quick rate chips */}
                  <div className="mt-2.5 flex gap-2">
                    {QUICK_TAX_RATES.map((qr) => {
                      const isSel = taxEditor.ratePercent === qr;
                      return (
                        <button
                          key={qr}
                          type="button"
                          onClick={() => handleQuickTaxRate(qr)}
                          className={`flex-1 rounded-lg border py-1.5 text-[12px] font-bold transition-all ${
                            isSel
                              ? 'border-mintcom-green bg-mintcom-green/15 text-mintcom-green'
                              : 'border-gray-200 bg-white text-text-secondary hover:border-gray-300 dark:border-white/10 dark:bg-mintcom-dark dark:text-mintcom-textSecondary'
                          }`}
                        >
                          {qr}%
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex shrink-0 gap-2.5 border-t border-gray-100 p-4 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTaxEditor(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-bold text-text-secondary transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-mintcom-textSecondary dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveTax}
                  className="flex-1 rounded-xl bg-mintcom-green py-2.5 text-[13px] font-bold text-white shadow-sm transition-colors hover:bg-mintcom-green/90"
                >
                  Save Tax Rate
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Tax Modal — matches POS TaxRatesGroup delete modal */}
        {taxToDelete && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px]">
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0"
              onClick={() => setTaxToDelete(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative flex w-full max-w-[380px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-[#D55263]">
                  <Trash2 size={24} />
                </span>
              </div>
              <h3 className="text-center text-[16px] font-bold text-text-primary dark:text-white">
                Delete Tax Rate
              </h3>
              <p className="mt-2 text-center text-[13px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                Are you sure you want to delete{' '}
                <strong className="text-text-primary dark:text-white">
                  {taxToDelete.name} ({(taxToDelete.rate * 100).toFixed(0)}%)
                </strong>
                ? Products using this rate will automatically fall back to the default sales tax.
              </p>
              <div className="mt-5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setTaxToDelete(null)}
                  className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[13px] font-bold text-text-secondary dark:border-white/10 dark:text-mintcom-textSecondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTaxConfirm}
                  className="flex-1 rounded-xl bg-[#D55263] py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-[#D55263]/90"
                >
                  Delete Tax Rate
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Default Tax Lock Info Modal — matches POS TaxRatesGroup default tax modal */}
        {showDefaultTaxLockModal && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/55 p-3 backdrop-blur-[2px]">
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0"
              onClick={() => setShowDefaultTaxLockModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-mintcom-surface"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex justify-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.05] text-text-secondary dark:bg-white/[0.08] dark:text-white">
                  <Lock size={22} />
                </span>
              </div>
              <h3 className="text-center text-[16px] font-bold text-text-primary dark:text-white">
                Default Sales Tax Protected
              </h3>
              <p className="mt-2 text-center text-[13px] leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
                The default sales tax cannot be deleted. You can edit its rate instead to update sales tax across the system.
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowDefaultTaxLockModal(false)}
                  className="w-full rounded-xl bg-mintcom-green py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-mintcom-green/90"
                >
                  Got It
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info / success / error — mirrors POS InfoModal */}
      {infoBanner && (
        <ModalShell
          title={infoBanner.title}
          onClose={() => setInfoBanner(null)}
          footer={
            <button
              type="button"
              onClick={() => setInfoBanner(null)}
              className="w-full rounded-xl bg-mintcom-green py-2.5 text-sm font-black text-white"
            >
              OK
            </button>
          }
        >
          <div className="mb-3 flex justify-center">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full ${
                infoBanner.type === 'success'
                  ? 'bg-mintcom-green/15 text-mintcom-green'
                  : infoBanner.type === 'error'
                    ? 'bg-[#D55263]/15 text-[#D55263]'
                    : 'bg-amber-100 text-amber-700'
              }`}
            >
              {infoBanner.type === 'success' ? (
                <Check size={24} />
              ) : infoBanner.type === 'error' ? (
                <X size={24} />
              ) : (
                <Info size={24} />
              )}
            </span>
          </div>
          <p className="text-center text-sm leading-relaxed text-text-secondary dark:text-mintcom-textSecondary">
            {infoBanner.message}
          </p>
        </ModalShell>
      )}

      <Toast msg={toast} />
    </div>
  );
}

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Wifi,
  ChevronRight,
  ChevronLeft,
  Globe,
  LayoutGrid,
  List,
  MapPin,
  Sun,
  Moon,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Bell,
  Receipt,
  Clock,
  CheckCircle2,
  ChefHat,
  Sparkles,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  RESTAURANT_INFO,
  MENU_CATEGORIES,
  MENU_ITEMS,
  type MenuItem,
  type CartItem,
  type CartItemOption,
  type TableOrder,
} from './menuData';

export interface CustomerDigitalMenuProps {
  version?: 'v1' | 'v2';
  tableNumber?: string;
  initialLang?: 'en' | 'ar';
  initialTheme?: 'dark' | 'light';
  wifiName?: string;
  wifiPass?: string;
  onCallWaiter?: (table: string, type: 'waiter' | 'bill') => void;
  onOrderPlaced?: (order: TableOrder) => void;
  isEmbeddedInFrame?: boolean;
}

type DietaryFilter = 'all' | 'popular' | 'chef' | 'vegetarian' | 'vegan' | 'spicy' | 'gluten-free';

export const CustomerDigitalMenu: React.FC<CustomerDigitalMenuProps> = ({
  version = 'v1',
  tableNumber = 'Table 4',
  initialLang = 'en',
  initialTheme = 'light',
  wifiName,
  wifiPass,
  onCallWaiter,
  onOrderPlaced,
  isEmbeddedInFrame = false,
}) => {
  const isV2 = version === 'v2';

  const [lang, setLang] = useState<'en' | 'ar'>(initialLang);
  const [theme, setTheme] = useState<'dark' | 'light'>(initialTheme);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFilter, setSelectedFilter] = useState<DietaryFilter>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);

  // V2 Specific State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [placedOrders, setPlacedOrders] = useState<TableOrder[]>([]);
  const [activeOrderModal, setActiveOrderModal] = useState<TableOrder | null>(null);
  const [generalKitchenNote, setGeneralKitchenNote] = useState('');
  const [serviceAlert, setServiceAlert] = useState<{ type: 'waiter' | 'bill'; message: string } | null>(null);

  // Item customization modal state
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [modalQuantity, setModalQuantity] = useState(1);
  const [modalItemNote, setModalItemNote] = useState('');

  // Sync external theme changes
  useEffect(() => {
    if (initialTheme) {
      setTheme(initialTheme);
    }
  }, [initialTheme]);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const isRtl = lang === 'ar';
  const isDark = theme === 'dark';

  const effectiveWifiName = wifiName?.trim() || RESTAURANT_INFO.wifiName;
  const effectiveWifiPass = wifiPass?.trim() || RESTAURANT_INFO.wifiPass;

  // Localized text dictionary
  const t = {
    searchPlaceholder: isRtl ? 'ابحث في قائمة الطعام والمشروبات...' : 'Search delicious dishes, drinks, ingredients...',
    allCategories: isRtl ? 'جميع الأطباق' : 'Full Menu',
    callWaiter: isRtl ? 'طلب النادل' : 'Call Waiter',
    requestBill: isRtl ? 'طلب الفاتورة' : 'Request Bill',
    wifi: isRtl ? 'واي فاي المطعم' : 'Guest Wi-Fi',
    viewDetails: isRtl ? 'التفاصيل والخيارات' : 'Options & Details',
    allergens: isRtl ? 'تنبيه الحساسية' : 'Allergen Advisory',
    calories: isRtl ? 'سعرة' : 'kcal',
    prepTime: isRtl ? 'التحضير' : 'Prep',
    close: isRtl ? 'إغلاق' : 'Close',
    specialInstructions: isRtl ? 'ملاحظات خاصة للمطبخ' : 'Special Kitchen Instructions',
    specialPlaceholder: isRtl ? 'مثال: بدون بصل، الصوص على جنب...' : 'e.g. Extra dressing on side, less salt...',
    copyWifi: isRtl ? 'نسخ كلمة السر' : 'Copy Password',
    wifiCopied: isRtl ? 'تم النسخ بنجاح!' : 'Password Copied!',
    waiterNotified: isRtl ? 'تم إرسال التنبيه!' : 'Server Alert Sent!',
    waiterMessage: isRtl
      ? `تم إشعار طاقم الخدمة لطاولة (${tableNumber}). النادل في طريقه إليكم فوراً.`
      : `Staff notified for ${tableNumber}. Your server is on the way.`,
    billNotified: isRtl ? 'تم استلام طلب الفاتورة!' : 'Receipt Requested!',
    billMessage: isRtl
      ? `تم إبلاغ الكاشير لطاولة (${tableNumber}). سيحضر النادل الفاتورة وجهاز الدفع.`
      : `Cashier notified for ${tableNumber}. Your server will bring the receipt & terminal.`,
    noItemsFound: isRtl ? 'لم نجد أطباق مطابقة لبحثك' : 'No menu items match your search',
    clearFilters: isRtl ? 'إعادة ضبط البحث' : 'Clear Search & Filters',
    popularBadge: isRtl ? 'الأكثر طلباً' : 'Bestseller',
    chefBadge: isRtl ? 'توصية الشيف' : "Chef's Signature",
    spicyBadge: isRtl ? 'حار' : 'Spicy',
    veganBadge: isRtl ? 'نباتي صرف' : 'Vegan',
    vegBadge: isRtl ? 'نباتي' : 'Vegetarian',
    gfBadge: isRtl ? 'خالي غلوتين' : 'Gluten Free',
    poweredBy: isRtl ? 'قائمة رقمية مدعومة بنظام Mintcom' : 'Digital Menu Powered by Mintcom',
    // V2 translations
    addToOrder: isRtl ? 'إضافة للطلب' : 'Add to Order',
    viewOrder: isRtl ? 'استعراض الطلب' : 'View Order',
    itemsCount: (n: number) => isRtl ? `${n} أصناف` : `${n} item${n > 1 ? 's' : ''}`,
    yourOrder: isRtl ? `طلب الطاولة (${tableNumber})` : `Table Order (${tableNumber})`,
    orderEmpty: isRtl ? 'سلة الطلب فارغة حالياً' : 'Your order is currently empty',
    orderEmptyDesc: isRtl ? 'اختر أطباقك المفضلة وأضفها للطلب' : 'Select dishes from the menu to start your table order',
    subtotal: isRtl ? 'المجموع' : 'Subtotal',
    taxInclusive: isRtl ? 'شامل الضريبة والخدمة' : 'Tax & Service Inclusive',
    sendOrder: isRtl ? '🚀 إرسال الطلب للمطبخ' : '🚀 Send Order to Kitchen',
    orderPlacedTitle: isRtl ? 'تم إرسال الطلب للمطبخ بنجاح!' : 'Order Dispatched to Kitchen!',
    orderPlacedDesc: isRtl
      ? `تم استلام طلبكم لطاولة (${tableNumber}) ووصل إلى شاشة المطبخ مباشرة.`
      : `Received for ${tableNumber}. Your ticket has reached the kitchen display and preparation started.`,
    activeOrders: isRtl ? 'متابعة حالة الطلب' : 'Active Orders Track',
    orderNumber: isRtl ? 'رقم الطلب' : 'Order #',
    statusReceived: isRtl ? 'تم الاستلام' : 'Order Received',
    statusPreparing: isRtl ? 'جاري التحضير بالشيف' : 'Preparing in Kitchen',
    statusServed: isRtl ? 'جاهز للتقديم' : 'Ready & Served',
    addMore: isRtl ? 'إضافة أطباق أخرى' : 'Add More Dishes',
    itemNotePlaceholder: isRtl ? 'أي تعديل على هذا الطبق؟ (مثال: بدون صوص)' : 'Special notes for this dish (optional)',
  };

  // Fixed establishment price formatter
  const formatPrice = (price: number) => {
    const symbol = isRtl ? RESTAURANT_INFO.currency.symbolAr : RESTAURANT_INFO.currency.symbolEn;
    const formatted = price.toFixed(2);
    return `${formatted} ${symbol}`;
  };

  // Filter items
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false;
      }

      // Dietary filter
      if (selectedFilter === 'chef' && !item.tags.includes('chef')) return false;
      if (selectedFilter === 'vegetarian' && !item.tags.includes('vegetarian') && !item.tags.includes('vegan')) return false;
      if (selectedFilter === 'vegan' && !item.tags.includes('vegan')) return false;
      if (selectedFilter === 'spicy' && !item.tags.includes('spicy')) return false;
      if (selectedFilter === 'gluten-free' && !item.tags.includes('gluten-free')) return false;
      if (selectedFilter === 'popular' && !item.tags.includes('popular')) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchEn = item.name.en.toLowerCase().includes(query) || item.description.en.toLowerCase().includes(query);
        const matchAr = item.name.ar.includes(query) || item.description.ar.includes(query);
        const matchAllergen = item.allergens.some((a) => a.toLowerCase().includes(query));
        if (!matchEn && !matchAr && !matchAllergen) return false;
      }

      return true;
    });
  }, [selectedCategory, selectedFilter, searchQuery]);

  const handleOpenItem = (item: MenuItem) => {
    setSelectedItem(item);
    setModalQuantity(1);
    setModalItemNote('');
    const initialOpts: Record<string, string> = {};
    if (item.optionGroups) {
      item.optionGroups.forEach((g) => {
        if (g.options.length > 0) {
          initialOpts[g.id] = g.options[0].id;
        }
      });
    }
    setSelectedOptions(initialOpts);
  };

  // Calculate modal single item price with selected options
  const modalUnitPrice = useMemo(() => {
    if (!selectedItem) return 0;
    let base = selectedItem.price;
    if (selectedItem.optionGroups) {
      for (const group of selectedItem.optionGroups) {
        const chosenId = selectedOptions[group.id];
        const chosenOpt = group.options.find((o) => o.id === chosenId);
        if (chosenOpt) {
          base += chosenOpt.price;
        }
      }
    }
    return base;
  }, [selectedItem, selectedOptions]);

  // V2 Cart Actions
  const handleAddToCart = () => {
    if (!selectedItem) return;
    const chosenOptions: CartItemOption[] = [];
    if (selectedItem.optionGroups) {
      for (const group of selectedItem.optionGroups) {
        const optId = selectedOptions[group.id];
        const opt = group.options.find((o) => o.id === optId);
        if (opt) {
          chosenOptions.push({
            groupId: group.id,
            groupName: group.name,
            optionId: opt.id,
            optionName: opt.name,
            price: opt.price,
          });
        }
      }
    }

    const unitPrice = modalUnitPrice;
    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      menuItem: selectedItem,
      quantity: modalQuantity,
      selectedOptions: chosenOptions,
      specialNote: modalItemNote.trim() || undefined,
      unitPrice,
      totalPrice: unitPrice * modalQuantity,
    };

    setCart((prev) => [...prev, newItem]);
    setSelectedItem(null);
  };

  const handleUpdateQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.id === cartItemId
            ? { ...item, quantity: newQty, totalPrice: item.unitPrice * newQty }
            : item
        )
      );
    }
  };

  const handleRemoveFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [cart]);

  const handleSendOrderToKitchen = () => {
    if (cart.length === 0) return;
    const orderNum = `#${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder: TableOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      tableNumber,
      items: [...cart],
      subtotal: cartSubtotal,
      total: cartSubtotal,
      timestamp: timeStr,
      status: 'received',
      specialInstructions: generalKitchenNote.trim() || undefined,
    };

    setPlacedOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    setGeneralKitchenNote('');
    setShowCartModal(false);
    setActiveOrderModal(newOrder);
    onOrderPlaced?.(newOrder);
  };

  const handleServiceCall = (type: 'waiter' | 'bill') => {
    onCallWaiter?.(tableNumber, type);
    setServiceAlert({
      type,
      message: type === 'waiter' ? t.waiterMessage : t.billMessage,
    });
    setTimeout(() => {
      setServiceAlert(null);
    }, 4500);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`relative w-full font-sans transition-colors duration-300 selection:bg-emerald-500 selection:text-white ${
        isDark ? 'bg-[#0a0f18] text-slate-100' : 'bg-slate-50 text-slate-900'
      } ${isEmbeddedInFrame ? 'h-full overflow-y-auto' : 'min-h-screen'}`}
    >
      {/* Service Alert Toast (V2) */}
      {serviceAlert && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm animate-in slide-in-from-top-4 duration-300">
          <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center gap-3 border border-emerald-400/40">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              {serviceAlert.type === 'waiter' ? <Bell className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
            </div>
            <div className="flex-1 text-xs">
              <p className="font-bold">
                {serviceAlert.type === 'waiter' ? t.waiterNotified : t.billNotified}
              </p>
              <p className="text-[11px] opacity-90 mt-0.5">{serviceAlert.message}</p>
            </div>
            <button onClick={() => setServiceAlert(null)} className="p-1 hover:bg-white/20 rounded-lg">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Clean Restaurant Header */}
      <div
        className={`px-4 pt-4 pb-3.5 border-b transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-slate-900 via-slate-900/90 to-[#0a0f18] border-white/5'
            : 'bg-gradient-to-b from-white via-slate-50 to-slate-100 border-slate-200 shadow-xs'
        }`}
      >
        {/* Top Control Bar */}
        <div className={`flex items-center justify-between gap-2 pb-3 mb-3 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
          {/* Table Location Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-xs ${
              isDark
                ? 'bg-slate-800/90 border border-white/10 text-emerald-400'
                : 'bg-white border border-slate-200 text-emerald-600 shadow-xs'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{tableNumber}</span>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-1.5">
            {/* Theme Toggle (Light / Dark) */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-full border transition-colors shadow-xs active:scale-95 ${
                isDark
                  ? 'bg-slate-800 border-white/10 text-slate-200 hover:text-amber-300'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-amber-500'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            </button>

            {/* Wi-Fi Pill */}
            <button
              onClick={() => setShowWifiModal(true)}
              className={`p-2 rounded-full border transition-colors shadow-xs active:scale-95 ${
                isDark
                  ? 'bg-slate-800 border-white/10 text-slate-200 hover:text-emerald-400'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-emerald-600'
              }`}
              title={t.wifi}
            >
              <Wifi className="w-3.5 h-3.5" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className={`px-3 py-1.5 text-xs font-bold rounded-full border transition-all flex items-center gap-1.5 shadow-xs active:scale-95 ${
                isDark
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Restaurant Brand Info */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 flex items-center justify-center text-2xl shadow-md border border-white/20 p-2 text-white shrink-0">
            {RESTAURANT_INFO.logo}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className={`text-base sm:text-lg font-extrabold tracking-tight truncate ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                {RESTAURANT_INFO.name[lang]}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/30 shrink-0">
                ★ {RESTAURANT_INFO.rating}
              </span>
            </div>
            <p className={`text-[11px] truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {RESTAURANT_INFO.tagline[lang]}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-emerald-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{RESTAURANT_INFO.openingHours[lang]}</span>
            </div>
          </div>
        </div>

        {/* Version 2 Exclusive: Active Table Service Buttons */}
        {isV2 && (
          <div className="mt-3.5 pt-3 border-t border-dashed border-slate-200 dark:border-white/10 flex items-center gap-2">
            <button
              onClick={() => handleServiceCall('waiter')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                isDark
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.callWaiter}</span>
            </button>
            <button
              onClick={() => handleServiceCall('bill')}
              className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                isDark
                  ? 'bg-slate-800 border-white/10 text-slate-200 hover:bg-slate-700'
                  : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t.requestBill}</span>
            </button>
          </div>
        )}

        {/* Version 2: Placed Orders Alert Pill */}
        {isV2 && placedOrders.length > 0 && (
          <div className="mt-2.5">
            <button
              onClick={() => setActiveOrderModal(placedOrders[0])}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 dark:text-emerald-300 text-xs font-bold flex items-center justify-between transition-all hover:bg-emerald-500/25"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>
                  {placedOrders[0].orderNumber} {t.statusPreparing}
                </span>
              </div>
              <span className="text-[11px] underline flex items-center gap-1">
                {t.activeOrders} <ChevronRight className="w-3 h-3" />
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Sticky Header: Search, Categories & Filters */}
      <div
        className={`sticky top-0 z-30 backdrop-blur-xl border-b py-2.5 px-3 space-y-2.5 shadow-md transition-colors ${
          isDark ? 'bg-[#0a0f18]/95 border-white/5' : 'bg-white/95 border-slate-200/80'
        }`}
      >
        {/* Search & View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className={`w-full py-2 rounded-xl text-xs transition-all ${
                isDark
                  ? 'bg-slate-900/90 border border-white/10 text-white placeholder-slate-400 focus:border-emerald-500'
                  : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
              } ${isRtl ? 'pr-9 pl-8' : 'pl-9 pr-8'}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white ${
                  isRtl ? 'left-2.5' : 'right-2.5'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View Toggle Button */}
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className={`p-2 rounded-xl border transition-colors shrink-0 ${
              isDark
                ? 'bg-slate-900 border-white/10 text-slate-300 hover:text-white'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900'
            }`}
            title={viewMode === 'list' ? 'Switch to Grid View' : 'Switch to List View'}
          >
            {viewMode === 'list' ? <LayoutGrid className="w-4 h-4 text-emerald-500" /> : <List className="w-4 h-4 text-emerald-500" />}
          </button>
        </div>

        {/* Category Sticky Slider */}
        <div
          ref={categoryScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 scroll-smooth"
        >
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                : isDark
                ? 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-white/5'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            🍽️ {t.allCategories}
          </button>
          {MENU_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/25 scale-[1.02]'
                    : isDark
                    ? 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-white/5'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name[lang]}</span>
              </button>
            );
          })}
        </div>

        {/* Dietary Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all shrink-0 font-medium ${
              selectedFilter === 'all'
                ? isDark
                  ? 'bg-white/15 text-white border border-white/20'
                  : 'bg-slate-800 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('popular')}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              selectedFilter === 'popular'
                ? 'bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⭐ {t.popularBadge}
          </button>
          <button
            onClick={() => setSelectedFilter('chef')}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              selectedFilter === 'chef'
                ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/40 font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            👨‍🍳 {t.chefBadge}
          </button>
          <button
            onClick={() => setSelectedFilter('vegetarian')}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              selectedFilter === 'vegetarian'
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/40 font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌱 {t.vegBadge}
          </button>
          <button
            onClick={() => setSelectedFilter('spicy')}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              selectedFilter === 'spicy'
                ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/40 font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌶️ {t.spicyBadge}
          </button>
          <button
            onClick={() => setSelectedFilter('gluten-free')}
            className={`px-2.5 py-1 text-[11px] rounded-lg transition-all shrink-0 flex items-center gap-1 ${
              selectedFilter === 'gluten-free'
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 font-semibold'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌾 {t.gfBadge}
          </button>
        </div>
      </div>

      {/* Menu Item Cards List / Grid */}
      <div className={`p-3 ${isV2 && cart.length > 0 ? 'pb-32' : 'pb-24'}`}>
        {filteredItems.length === 0 ? (
          <div
            className={`text-center py-16 px-4 rounded-2xl border my-4 ${
              isDark ? 'bg-slate-900/40 border-white/5' : 'bg-white border-slate-200'
            }`}
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mb-3 text-xl">
              🔍
            </div>
            <h3 className="text-sm font-bold">{t.noItemsFound}</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Try another search term or reset filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedFilter('all');
              }}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
            >
              {t.clearFilters}
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* ================= LIST VIEW ================= */
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className={`group relative border rounded-2xl p-3 flex gap-3.5 transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                  isDark
                    ? 'bg-slate-900/80 hover:bg-slate-900 border-white/5 hover:border-emerald-500/40 shadow-md hover:shadow-xl hover:shadow-emerald-950/20'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-emerald-500/40 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Food Image */}
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-950 shrink-0">
                  <img
                    src={item.image}
                    alt={item.name[lang]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Badges on image */}
                  {item.tags.includes('chef') && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-purple-950/90 text-purple-200 text-[9px] font-bold tracking-wider backdrop-blur-sm shadow border border-purple-500/30">
                      CHEF
                    </span>
                  )}
                  {item.tags.includes('popular') && !item.tags.includes('chef') && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-amber-950/90 text-amber-200 text-[9px] font-bold tracking-wider backdrop-blur-sm shadow border border-amber-500/30">
                      TOP
                    </span>
                  )}
                </div>

                {/* Card Content */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <div className="flex items-start justify-between gap-1">
                      <h3
                        className={`text-xs sm:text-sm font-bold group-hover:text-emerald-500 transition-colors line-clamp-1 tracking-tight ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {item.name[lang]}
                      </h3>
                    </div>
                    <p className={`text-[11px] mt-1 line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.description[lang]}
                    </p>
                  </div>

                  {/* Price & Action Row */}
                  <div className={`flex items-end justify-between mt-2 pt-1.5 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs sm:text-sm font-extrabold text-emerald-500 tracking-tight">
                        {formatPrice(item.price)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.tags.includes('spicy') && <span title="Spicy">🌶️</span>}
                      {item.tags.includes('vegan') && <span title="Vegan">🌿</span>}
                      {item.tags.includes('vegetarian') && !item.tags.includes('vegan') && <span title="Vegetarian">🌱</span>}
                      <span
                        className={`p-1 rounded-lg transition-colors ${
                          isDark
                            ? 'bg-white/5 text-slate-300 group-hover:bg-emerald-500 group-hover:text-slate-950'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-500 group-hover:text-white'
                        }`}
                      >
                        {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ================= GRID VIEW ================= */
          <div className="grid grid-cols-2 gap-2.5">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenItem(item)}
                className={`group relative border rounded-2xl overflow-hidden flex flex-col transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  isDark
                    ? 'bg-slate-900/80 hover:bg-slate-900 border-white/5 hover:border-emerald-500/40 shadow-md'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80 hover:border-emerald-500/40 shadow-sm'
                }`}
              >
                {/* Food Image */}
                <div className="relative h-32 w-full bg-slate-950 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name[lang]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Image Badge */}
                  {item.tags.includes('chef') && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-purple-950/90 text-purple-200 text-[8px] font-bold border border-purple-500/30">
                      CHEF
                    </span>
                  )}
                  {item.tags.includes('popular') && !item.tags.includes('chef') && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-950/90 text-amber-200 text-[8px] font-bold border border-amber-500/30">
                      TOP
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      className={`text-xs font-bold group-hover:text-emerald-500 transition-colors line-clamp-1 ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {item.name[lang]}
                    </h3>
                    <p className={`text-[10px] mt-0.5 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.description[lang]}
                    </p>
                  </div>

                  <div className={`flex items-center justify-between mt-2 pt-1 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className="text-xs font-extrabold text-emerald-500">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Brand watermark */}
        <div className="text-center pt-8 pb-3">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-[11px] shadow-xs ${
              isDark ? 'bg-slate-900/80 border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t.poweredBy}</span>
          </div>
        </div>
      </div>

      {/* ================= VERSION 2: FLOATING CART BAR ================= */}
      {isV2 && cart.length > 0 && (
        <div className="fixed bottom-3 left-0 right-0 z-40 px-3 flex justify-center pointer-events-none">
          <div className="w-full max-w-md pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
            <button
              onClick={() => setShowCartModal(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold shadow-2xl shadow-emerald-500/40 flex items-center justify-between transition-all active:scale-[0.98] border border-emerald-400/40"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950 font-extrabold text-xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div className="text-left text-xs leading-tight">
                  <span className="block font-black text-slate-950">{t.itemsCount(totalCartCount)}</span>
                  <span className="text-[11px] text-slate-900 font-medium">{t.yourOrder}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-black text-slate-950">
                <span>{formatPrice(cartSubtotal)}</span>
                <span className="px-2.5 py-1 rounded-xl bg-slate-950 text-emerald-400 flex items-center gap-1 font-bold text-[11px]">
                  <span>{t.viewOrder}</span>
                  {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ================= DISH DETAIL MODAL (V1 & V2) ================= */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-lg border rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 ${
              isDark ? 'bg-[#0d1424] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Hero Image */}
            <div className="relative h-60 sm:h-64 w-full bg-slate-950 shrink-0">
              <img
                src={selectedItem.image}
                alt={selectedItem.name[lang]}
                className="w-full h-full object-cover"
              />
              <div
                className={`absolute inset-0 bg-gradient-to-t ${
                  isDark ? 'from-[#0d1424] via-transparent to-black/50' : 'from-white via-transparent to-black/50'
                }`}
              />

              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/90 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedItem.name[lang]}
                  </h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {selectedItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] px-2 py-0.5 rounded-md border capitalize font-medium ${
                          isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xl font-extrabold text-emerald-500 tracking-tight">
                    {formatPrice(isV2 ? modalUnitPrice * modalQuantity : selectedItem.price)}
                  </span>
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {selectedItem.description[lang]}
              </p>

              {/* Option Groups */}
              {selectedItem.optionGroups?.map((group) => (
                <div key={group.id} className={`space-y-2 pt-2 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{group.name[lang]}</span>
                    {group.required && (
                      <span className="text-[10px] text-emerald-500 font-semibold uppercase tracking-wider">Required</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {group.options.map((opt) => {
                      const isSelected = selectedOptions[group.id] === opt.id;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-300 font-semibold'
                              : isDark
                              ? 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-900'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name={group.id}
                              checked={isSelected}
                              disabled={!isV2}
                              onChange={() =>
                                setSelectedOptions((prev) => ({
                                  ...prev,
                                  [group.id]: opt.id,
                                }))
                              }
                              className="accent-emerald-500"
                            />
                            <span>{opt.name[lang]}</span>
                          </div>
                          {opt.price > 0 && (
                            <span className="text-emerald-500 font-bold">
                              +{formatPrice(opt.price)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Version 2: Special Instructions for this dish */}
              {isV2 && (
                <div className={`pt-2 border-t space-y-1.5 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.specialInstructions}</span>
                  </label>
                  <input
                    type="text"
                    value={modalItemNote}
                    onChange={(e) => setModalItemNote(e.target.value)}
                    placeholder={t.itemNotePlaceholder}
                    className={`w-full py-2 px-3 rounded-xl text-xs transition-all ${
                      isDark
                        ? 'bg-slate-900 border border-white/10 text-white placeholder-slate-500'
                        : 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className={`p-3.5 border-t flex items-center gap-2 ${isDark ? 'bg-[#0a0f18] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              {isV2 ? (
                /* V2: Quantity selector + Add to Order */
                <div className="w-full flex items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className={`flex items-center border rounded-xl p-1 shrink-0 ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}>
                    <button
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                      disabled={modalQuantity <= 1}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-black">{modalQuantity}</span>
                    <button
                      onClick={() => setModalQuantity((q) => q + 1)}
                      className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Add to Order Button */}
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/25 flex items-center justify-between active:scale-[0.98]"
                  >
                    <span className="flex items-center gap-1.5 text-white">
                      <ShoppingCart className="w-4 h-4" />
                      <span>{t.addToOrder}</span>
                    </span>
                    <span className="text-white font-black">
                      {formatPrice(modalUnitPrice * modalQuantity)}
                    </span>
                  </button>
                </div>
              ) : (
                /* V1: View Only Close Button */
                <button
                  onClick={() => setSelectedItem(null)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors shadow ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-100' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  {t.close}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= VERSION 2: CART REVIEW DRAWER MODAL ================= */}
      {isV2 && showCartModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-lg border rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 duration-200 ${
              isDark ? 'bg-[#0d1424] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black">{t.yourOrder}</h3>
                  <p className="text-[11px] text-slate-400">{t.itemsCount(totalCartCount)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items Scrollable List */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1">
              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <ShoppingCart className="w-10 h-10 text-slate-500 mx-auto" />
                  <p className="text-sm font-bold">{t.orderEmpty}</p>
                  <p className="text-xs text-slate-400">{t.orderEmptyDesc}</p>
                </div>
              ) : (
                cart.map((cItem) => (
                  <div
                    key={cItem.id}
                    className={`p-3 rounded-2xl border flex items-start gap-3 transition-colors ${
                      isDark ? 'bg-slate-900/80 border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <img
                      src={cItem.menuItem.image}
                      alt={cItem.menuItem.name[lang]}
                      className="w-14 h-14 rounded-xl object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold truncate">{cItem.menuItem.name[lang]}</h4>
                        <span className="text-xs font-black text-emerald-500 shrink-0">
                          {formatPrice(cItem.totalPrice)}
                        </span>
                      </div>

                      {/* Selected Options summary */}
                      {cItem.selectedOptions.length > 0 && (
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {cItem.selectedOptions.map((o) => o.optionName[lang]).join(', ')}
                        </p>
                      )}

                      {/* Special Note */}
                      {cItem.specialNote && (
                        <p className="text-[10px] text-amber-400/90 italic mt-0.5">
                          "{cItem.specialNote}"
                        </p>
                      )}

                      {/* Quantity Stepper Row */}
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-dashed border-white/10">
                        <div className="flex items-center gap-1.5 border border-white/10 rounded-lg p-0.5">
                          <button
                            onClick={() => handleUpdateQuantity(cItem.id, cItem.quantity - 1)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-6 text-center">{cItem.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(cItem.id, cItem.quantity + 1)}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemoveFromCart(cItem.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 rounded-lg hover:bg-rose-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* General Kitchen Instructions Textarea */}
              {cart.length > 0 && (
                <div className={`p-3 rounded-2xl border space-y-1.5 ${isDark ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <ChefHat className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t.specialInstructions}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={generalKitchenNote}
                    onChange={(e) => setGeneralKitchenNote(e.target.value)}
                    placeholder={t.specialPlaceholder}
                    className={`w-full p-2 rounded-xl text-xs resize-none transition-all ${
                      isDark
                        ? 'bg-slate-950 border border-white/10 text-white placeholder-slate-500'
                        : 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className={`p-4 border-t space-y-3 ${isDark ? 'bg-[#0a0f18] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{t.subtotal}</span>
                    <span>{formatPrice(cartSubtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-500">
                    <span>{t.taxInclusive}</span>
                    <span>✓</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black pt-1 border-t border-white/10">
                    <span>{isRtl ? 'المجموع النهائي' : 'Grand Total'}</span>
                    <span className="text-emerald-500 text-base">{formatPrice(cartSubtotal)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSendOrderToKitchen}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-black text-xs transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  <span>{t.sendOrder}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= VERSION 2: ORDER STATUS MODAL ================= */}
      {isV2 && activeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div
            className={`relative w-full max-w-sm border rounded-3xl p-5 shadow-2xl space-y-4 text-center ${
              isDark ? 'bg-[#0d1424] border-emerald-500/30 text-white' : 'bg-white border-emerald-500/30 text-slate-900'
            }`}
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 mx-auto flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="w-7 h-7 text-slate-950" />
            </div>

            <div>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                {activeOrderModal.orderNumber}
              </span>
              <h3 className="text-base font-black mt-2">{t.orderPlacedTitle}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.orderPlacedDesc}</p>
            </div>

            {/* Order Timeline */}
            <div className={`p-3 rounded-2xl border text-left space-y-2.5 text-xs ${isDark ? 'bg-slate-900/90 border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="flex-1">{t.statusReceived}</span>
                <span className="text-[10px] opacity-75">{activeOrderModal.timestamp}</span>
              </div>
              <div className="flex items-center gap-2.5 text-amber-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                <span className="flex-1">{t.statusPreparing}</span>
                <span className="text-[10px] opacity-75">~15m</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
                <span className="flex-1">{t.statusServed}</span>
              </div>
            </div>

            {/* Ordered Items summary list */}
            <div className="text-left text-xs space-y-1 max-h-28 overflow-y-auto px-1">
              {activeOrderModal.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-slate-300">
                  <span>{item.quantity}x {item.menuItem.name[lang]}</span>
                  <span className="font-semibold">{formatPrice(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveOrderModal(null)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow"
            >
              {t.addMore}
            </button>
          </div>
        </div>
      )}

      {/* Wi-Fi Details Modal */}
      {showWifiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div
            className={`border p-5 rounded-2xl max-w-xs w-full text-center space-y-3 shadow-2xl ${
              isDark ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold">{t.wifi}</h3>
            <div
              className={`p-3 rounded-xl border text-left text-xs space-y-1 font-mono ${
                isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                Network: <span className="font-bold text-slate-900 dark:text-white">{effectiveWifiName}</span>
              </div>
              <div className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                Password: <span className="font-bold text-emerald-500">{effectiveWifiPass}</span>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(effectiveWifiPass);
                setWifiCopied(true);
                setTimeout(() => {
                  setWifiCopied(false);
                  setShowWifiModal(false);
                }, 1200);
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow"
            >
              {wifiCopied ? (isRtl ? '✓ تم نسخ كلمة السر!' : '✓ Password Copied!') : t.copyWifi}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

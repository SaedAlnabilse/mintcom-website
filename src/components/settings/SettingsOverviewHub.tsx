import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store,
  CreditCard,
  Receipt,
  ShieldCheck,
  MonitorSmartphone,
  BookOpen,
  Trash2,
  Search,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Coins,
  ReceiptText,
  FileSpreadsheet,
} from 'lucide-react';

interface SettingsOverviewHubProps {
  settings: any;
  currentEstablishment: any;
  permittedTabIds: string[];
  onNavigateToSection: (sectionId: string) => void;
  currencySymbol: string;
}

interface SettingCardConfig {
  id: string;
  categoryId: 'identity' | 'financials' | 'operations' | 'danger';
  title: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  glowColor: string;
  borderColor: string;
  badge?: string;
  statusType?: 'success' | 'neutral' | 'warning' | 'danger';
  keywords: string[];
}

export function SettingsOverviewHub({
  settings,
  currentEstablishment,
  permittedTabIds,
  onNavigateToSection,
  currencySymbol,
}: SettingsOverviewHubProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');

  const allCards: SettingCardConfig[] = useMemo(() => {
    return [
      {
        id: 'profile',
        categoryId: 'identity',
        title: t('settings.overview.cards.profile.title', 'Store Profile'),
        description: t(
          'settings.overview.cards.profile.description',
          'Business name, address, contact email, logo, and legal tax registration number.',
        ),
        icon: Store,
        iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        glowColor: 'group-hover:shadow-emerald-500/10',
        borderColor: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/30',
        badge: settings?.restaurantName || currentEstablishment?.name || undefined,
        statusType: 'neutral',
        keywords: [
          'profile',
          'store',
          'name',
          'logo',
          'address',
          'email',
          'tax id',
          'trn',
          'login id',
          'ملف',
          'متجر',
          'شعار',
          'عنوان',
          'بريد',
        ],
      },
      {
        id: 'receipt',
        categoryId: 'identity',
        title: t('settings.overview.cards.receipts.title', 'Receipts & Branding'),
        description: t(
          'settings.overview.cards.receipts.description',
          'Receipt logo, custom header notes, farewell message, and printed customer fields.',
        ),
        icon: Receipt,
        iconBg: 'bg-amber-500/10 dark:bg-amber-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
        glowColor: 'group-hover:shadow-amber-500/10',
        borderColor: 'hover:border-amber-500/40 dark:hover:border-amber-500/30',
        badge: settings?.receiptLogo ? t('settings.overview.quickGlance.configured', 'Logo Set') : undefined,
        statusType: settings?.receiptLogo ? 'success' : 'neutral',
        keywords: [
          'receipt',
          'receipts',
          'branding',
          'logo',
          'header',
          'footer',
          'farewell',
          'print',
          'إيصال',
          'إيصالات',
          'طباعة',
          'ترويسة',
        ],
      },
      {
        id: 'sales',
        categoryId: 'financials',
        title: t('settings.overview.cards.sales.title', 'Sales Setup & Taxes'),
        description: t(
          'settings.overview.cards.sales.description',
          'System currency, default sales tax rate, product tax overrides, and service charges.',
        ),
        icon: CreditCard,
        iconBg: 'bg-mintcom-green/15 dark:bg-mintcom-green/20',
        iconColor: 'text-mintcom-green',
        glowColor: 'group-hover:shadow-mintcom-green/10',
        borderColor: 'hover:border-mintcom-green/40 dark:hover:border-mintcom-green/30',
        badge: `${settings?.taxRate ?? 0}% Tax · ${settings?.currency || currentEstablishment?.currency || 'USD'}`,
        statusType: 'success',
        keywords: [
          'sales',
          'tax',
          'taxes',
          'vat',
          'currency',
          'service charge',
          'fee',
          'rate',
          'مبيعات',
          'ضريبة',
          'ضرائب',
          'عملة',
          'خدمة',
        ],
      },
      {
        id: 'einvoicing',
        categoryId: 'financials',
        title: t('settings.overview.cards.einvoicing.title', 'E-Invoicing & Fiscal'),
        description: t(
          'settings.overview.cards.einvoicing.description',
          'Universal electronic invoicing, country tax regulations, and QR verification.',
        ),
        icon: ShieldCheck,
        iconBg: 'bg-purple-500/10 dark:bg-purple-500/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
        glowColor: 'group-hover:shadow-purple-500/10',
        borderColor: 'hover:border-purple-500/40 dark:hover:border-purple-500/30',
        badge: settings?.fiscalEnabled
          ? t('settings.overview.quickGlance.active', 'Active')
          : t('settings.overview.quickGlance.inactive', 'Disabled'),
        statusType: settings?.fiscalEnabled ? 'success' : 'neutral',
        keywords: [
          'einvoicing',
          'fiscal',
          'compliance',
          'zatca',
          'qr',
          'tax authority',
          'jordan',
          'saudi',
          'فوترة',
          'إلكترونية',
          'امتثال',
          'زاتكا',
        ],
      },
      {
        id: 'accounting',
        categoryId: 'financials',
        title: t('settings.overview.cards.accounting.title', 'Accounting & VAT'),
        description: t(
          'settings.overview.cards.accounting.description',
          'Automatic daily Z-Report sync with Xero & QuickBooks, UK VAT split, and ledger mapping.',
        ),
        icon: BookOpen,
        iconBg: 'bg-sky-500/10 dark:bg-sky-500/20',
        iconColor: 'text-sky-600 dark:text-sky-400',
        glowColor: 'group-hover:shadow-sky-500/10',
        borderColor: 'hover:border-sky-500/40 dark:hover:border-sky-500/30',
        badge: 'Xero · QuickBooks',
        statusType: 'neutral',
        keywords: [
          'accounting',
          'xero',
          'quickbooks',
          'z-report',
          'ledger',
          'sync',
          'vat',
          'محاسبة',
          'قيود',
          'مزامنة',
          'دفاتر',
        ],
      },
      {
        id: 'pos',
        categoryId: 'operations',
        title: t('settings.overview.cards.pos.title', 'POS & Shifts'),
        description: t(
          'settings.overview.cards.pos.description',
          'Held order capacity, table management limits, and multi-shift cashier settings.',
        ),
        icon: MonitorSmartphone,
        iconBg: 'bg-teal-500/10 dark:bg-teal-500/20',
        iconColor: 'text-teal-600 dark:text-teal-400',
        glowColor: 'group-hover:shadow-teal-500/10',
        borderColor: 'hover:border-teal-500/40 dark:hover:border-teal-500/30',
        badge: `${settings?.holdOrderTableCount ?? 10} Tables`,
        statusType: 'neutral',
        keywords: [
          'pos',
          'shift',
          'shifts',
          'register',
          'tables',
          'terminal',
          'hold orders',
          'cashier',
          'كاشير',
          'ورديات',
          'طاولات',
          'نقطة بيع',
        ],
      },
      {
        id: 'danger',
        categoryId: 'danger',
        title: t('settings.overview.cards.danger.title', 'Delete Location'),
        description: t(
          'settings.overview.cards.danger.description',
          'Initiate permanent decommissioning and deletion of this store location.',
        ),
        icon: Trash2,
        iconBg: 'bg-rose-500/10 dark:bg-rose-500/20',
        iconColor: 'text-rose-600 dark:text-rose-400',
        glowColor: 'group-hover:shadow-rose-500/10',
        borderColor: 'hover:border-rose-500/40 dark:hover:border-rose-500/30',
        badge: t('settings.overview.categories.danger', 'Danger Zone'),
        statusType: 'danger',
        keywords: [
          'delete',
          'remove',
          'danger',
          'decommission',
          'restore',
          'حذف',
          'إلغاء',
          'خطر',
        ],
      },
    ];
  }, [settings, currentEstablishment, t]);

  // Filter cards by permission and search query
  const visibleCards = useMemo(() => {
    return allCards.filter((card) => {
      // Must be permitted for the current user
      if (!permittedTabIds.includes(card.id)) return false;

      // Filter by search query if present
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      const matchesTitle = card.title.toLowerCase().includes(q);
      const matchesDesc = card.description.toLowerCase().includes(q);
      const matchesKeyword = card.keywords.some((k) => k.toLowerCase().includes(q));
      return matchesTitle || matchesDesc || matchesKeyword;
    });
  }, [allCards, permittedTabIds, searchQuery]);

  const categories = useMemo(() => {
    return [
      {
        id: 'identity',
        title: t('settings.overview.categories.identity', 'General & Identity'),
        cards: visibleCards.filter((c) => c.categoryId === 'identity'),
      },
      {
        id: 'financials',
        title: t('settings.overview.categories.financials', 'Financials & Sales'),
        cards: visibleCards.filter((c) => c.categoryId === 'financials'),
      },
      {
        id: 'operations',
        title: t('settings.overview.categories.operations', 'Operations & Till'),
        cards: visibleCards.filter((c) => c.categoryId === 'operations'),
      },
      {
        id: 'danger',
        title: t('settings.overview.categories.danger', 'Danger Zone'),
        cards: visibleCards.filter((c) => c.categoryId === 'danger'),
      },
    ].filter((cat) => cat.cards.length > 0);
  }, [visibleCards, t]);

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-8 animate-fadeIn font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('settings.overview.title', 'Settings & Configuration')}
            </h1>
            {currentEstablishment?.name && (
              <span className="hidden sm:inline-flex px-3 py-1 rounded-lg bg-mintcom-green/10 text-mintcom-green font-semibold text-xs border border-mintcom-green/20">
                {currentEstablishment.name}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 max-w-2xl">
            {t(
              'settings.overview.subtitle',
              'Manage your store profile, financial setup, hardware registers, and integrations.',
            )}
          </p>
        </div>

        {/* Real-time Search Filter */}
        <div className="relative w-full md:w-80">
          <Search
            size={16}
            className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${
              isRTL ? 'right-3.5' : 'left-3.5'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'settings.overview.searchPlaceholder',
              'Search settings... (e.g. tax, receipt, logo, shifts)',
            )}
            className={`w-full py-2.5 rounded-xl text-sm bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mintcom-green/40 focus:border-mintcom-green transition-all shadow-sm ${
              isRTL ? 'pr-10 pl-9' : 'pl-10 pr-9'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className={`absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded-md transition-colors ${
                isRTL ? 'left-2.5' : 'right-2.5'
              }`}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Live Configuration Glance Ribbon */}
      {!searchQuery && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-white/[0.03] dark:via-white/[0.05] dark:to-white/[0.03] border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-md">
          {/* Currency */}
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-mintcom-green/10 text-mintcom-green flex items-center justify-center shrink-0">
              <Coins size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('settings.overview.quickGlance.currency', 'Currency')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {settings?.currency || currentEstablishment?.currency || 'USD'} ({currencySymbol})
              </p>
            </div>
          </div>

          {/* Default Tax */}
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('settings.overview.quickGlance.taxRate', 'Default Tax')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {settings?.taxRate ?? 0}%
              </p>
            </div>
          </div>

          {/* Receipt Branding */}
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <ReceiptText size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('settings.overview.quickGlance.receiptLogo', 'Receipt Logo')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {settings?.receiptLogo
                  ? t('settings.overview.quickGlance.configured', 'Configured')
                  : t('settings.overview.quickGlance.notConfigured', 'Not set')}
              </p>
            </div>
          </div>

          {/* Fiscal Compliance */}
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t('settings.overview.quickGlance.fiscal', 'E-Invoicing')}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5">
                {settings?.fiscalEnabled ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={13} />
                    {t('settings.overview.quickGlance.active', 'Active')}
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    {t('settings.overview.quickGlance.inactive', 'Disabled')}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categorized Settings Cards */}
      {categories.length > 0 ? (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="space-y-3.5">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {category.title}
                </h2>
                <div className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => onNavigateToSection(card.id)}
                      className={`group relative text-left p-5 rounded-2xl bg-white dark:bg-[#11161d] border border-gray-200 dark:border-white/10 hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${card.borderColor} ${card.glowColor} focus:outline-none focus:ring-2 focus:ring-mintcom-green/50`}
                      style={{ textAlign: isRTL ? 'right' : 'left' }}
                    >
                      <div className="space-y-3 w-full">
                        <div className="flex items-start justify-between gap-3">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${card.iconBg} ${card.iconColor}`}
                          >
                            <Icon size={22} />
                          </div>

                          {card.badge && (
                            <span
                              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full truncate max-w-[150px] ${
                                card.statusType === 'danger'
                                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                  : card.statusType === 'success'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                              }`}
                            >
                              {card.badge}
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-gray-900 dark:text-white group-hover:text-mintcom-green transition-colors">
                            {card.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-2">
                            {card.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-gray-400 group-hover:text-mintcom-green transition-colors">
                        <span>{t('settings.overview.viewScreen', 'Open')}</span>
                        <ArrowIcon
                          size={15}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State for Search */
        <div className="py-16 text-center rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-gray-200/60 dark:bg-white/10 text-gray-400 mx-auto flex items-center justify-center">
            <Search size={22} />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            {t('settings.overview.noResults', 'No settings match your search')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            {t(
              'settings.overview.noResultsDesc',
              'Try different search terms or browse categories below.',
            )}
          </p>
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          >
            {t('settings.overview.clearSearch', 'Clear search')}
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Check,
  LifeBuoy,
  Monitor,
  Moon,
  SlidersHorizontal,
  Sun,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { PortalDropdown } from '../PortalDropdown';

type SidebarPreferencesHelpMenuProps = {
  /** Renders a single icon button for the collapsed sidebar. */
  compact?: boolean;
  canReplay?: boolean;
  onReplay?: () => Promise<boolean>;
  onOpenHelpCenter?: () => void;
};

export function SidebarPreferencesHelpMenu({
  compact = false,
  canReplay = false,
  onReplay,
  onOpenHelpCenter,
}: SidebarPreferencesHelpMenuProps) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const isRTL = t('common.locale') === 'ar';
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const normalizedLanguage = (i18n.resolvedLanguage || i18n.language || 'en')
    .toLowerCase()
    .startsWith('ar')
    ? 'ar'
    : 'en';

  const languages = [
    { code: 'en', nativeName: t('common.languages.en'), shortName: 'EN', comingSoon: false },
    { code: 'ar', nativeName: t('common.languages.ar'), shortName: 'AR', comingSoon: false },
    { code: 'zh', nativeName: t('common.languages.zh'), shortName: 'ZH', comingSoon: true },
  ];

  const themeOptions = [
    { id: 'light', label: t('theme.light'), icon: Sun },
    { id: 'dark', label: t('theme.dark'), icon: Moon },
    { id: 'system', label: t('theme.system'), icon: Monitor },
  ] as const;

  const activeLanguage = languages.find((lang) => lang.code === normalizedLanguage) || languages[0];
  const ActiveThemeIcon = theme === 'dark' ? Moon : theme === 'system' ? Monitor : Sun;

  const handleReplay = async () => {
    if (!onReplay || isReplaying) return;
    setIsReplaying(true);
    // Keep a stable, mounted focus target active while authorization is in
    // flight. The replay modal records `document.activeElement` when it opens
    // and can then return focus to this trigger after it exits.
    triggerRef.current?.focus();
    try {
      const allowed = await onReplay();
      if (allowed) setIsOpen(false);
    } finally {
      setIsReplaying(false);
    }
  };

  const handleLanguageSelect = (code: string) => {
    // Close before switching: an RTL flip moves the whole sidebar, which
    // would leave the fixed-position portal menu anchored to stale coords.
    setIsOpen(false);
    void i18n.changeLanguage(code);
  };

  const triggerClasses = compact
    ? `flex h-12 w-12 items-center justify-center rounded-xl text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${
        isOpen ? 'bg-stone-100 text-stone-900 dark:bg-zinc-800 dark:text-zinc-100' : ''
      }`
    : `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm font-bold text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 ${
        isOpen ? 'bg-stone-100 text-stone-900 dark:bg-zinc-800 dark:text-zinc-100' : ''
      }`;

  return (
    <div className={compact ? 'relative group' : 'w-full'}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('common.helpAndPreferences')}
        onClick={() => setIsOpen((open) => !open)}
        className={triggerClasses}
      >
        <SlidersHorizontal size={compact ? 24 : 20} />
        {!compact && (
          <>
            <span>{t('common.helpAndPreferences')}</span>
            <span className="ms-auto flex items-center gap-1.5">
              <span className="rounded-md bg-stone-100 px-1.5 py-0.5 text-[10px] font-black tracking-wider text-stone-500 dark:bg-zinc-800 dark:text-zinc-400">
                {activeLanguage.shortName}
              </span>
              <ActiveThemeIcon size={15} className="text-stone-400" />
            </span>
          </>
        )}
      </button>

      {compact && (
        <div className="pointer-events-none absolute left-full top-1/2 z-[80] ms-2 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-white/10 bg-stone-900/90 px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-xl backdrop-blur-md transition-all group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:opacity-100 rtl:left-auto rtl:right-full rtl:ml-0 rtl:mr-2 rtl:-translate-x-1 rtl:group-hover:translate-x-0">
          {t('common.helpAndPreferences')}
        </div>
      )}

      <PortalDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        align={isRTL ? 'right' : 'left'}
        width="w-64"
        maxHeight="max-h-[min(75vh,30rem)]"
      >
        <div role="menu" dir={isRTL ? 'rtl' : 'ltr'} className="overflow-y-auto p-2">
          <p className="px-2 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-stone-400">
            {t('common.appearance')}
          </p>
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-50 p-1 dark:bg-zinc-800">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="menuitemradio"
                aria-checked={theme === option.id}
                onClick={() => setTheme(option.id)}
                className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 transition-all ${
                  theme === option.id
                    ? 'bg-white text-mintcom-green shadow-sm dark:bg-zinc-800'
                    : 'text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                <option.icon size={16} />
                <span className="text-[11px] font-semibold leading-none">{option.label}</span>
              </button>
            ))}
          </div>

          <p className="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">
            {t('common.language')}
          </p>
          {languages.map((lang) => (
            <button
              key={lang.code}
              type="button"
              role="menuitemradio"
              aria-checked={normalizedLanguage === lang.code}
              disabled={lang.comingSoon}
              aria-disabled={lang.comingSoon}
              onClick={() => handleLanguageSelect(lang.code)}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-start text-sm font-semibold transition-all ${
                lang.comingSoon
                  ? 'cursor-not-allowed text-stone-400 opacity-60 dark:text-zinc-600'
                  : normalizedLanguage === lang.code
                    ? 'bg-mintcom-green/10 text-mintcom-green'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="opacity-70">{lang.shortName}</span>
                <span>{lang.nativeName}</span>
              </span>
              {lang.comingSoon ? (
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-400 dark:bg-zinc-800 dark:text-zinc-500">
                  {t('common.comingSoon')}
                </span>
              ) : (
                normalizedLanguage === lang.code && <Check size={16} className="text-mintcom-green" />
              )}
            </button>
          ))}

          <p className="px-2 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-stone-400">
            {t('common.helpAndSupport')}
          </p>
          {canReplay && onReplay && (
            <button
              type="button"
              role="menuitem"
              disabled={isReplaying}
              onClick={() => void handleReplay()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-950 disabled:cursor-wait disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <BookOpen size={17} className="text-mintcom-green" />
              <span>{t('dashboard.setupGuide.menuItem')}</span>
            </button>
          )}
          {onOpenHelpCenter && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                onOpenHelpCenter();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50 hover:text-stone-950 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            >
              <LifeBuoy size={17} className="text-stone-400" />
              <span>{t('dashboard.setupGuide.helpCenter')}</span>
            </button>
          )}
        </div>
      </PortalDropdown>
    </div>
  );
}

export default SidebarPreferencesHelpMenu;

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LanguageSwitcherProps {
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  compact?: boolean;
  dropdownDirection?: 'down' | 'up' | 'right';
  showGlobeIcon?: boolean;
  /** Renders the globe on its own, without the language code next to it. */
  iconOnly?: boolean;
  label?: string;
  iconSize?: number;
}

export const LanguageSwitcher = ({
  className = '',
  buttonClassName = '',
  menuClassName = '',
  compact = false,
  dropdownDirection = 'down',
  showGlobeIcon = true,
  iconOnly = false,
  label,
  iconSize = 16,
}: LanguageSwitcherProps) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  const currentLanguage = languages.find((lang) => lang.code === normalizedLanguage) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const handleLanguageClick = (lang: (typeof languages)[number]) => {
    if (lang.comingSoon) return;
    changeLanguage(lang.code);
  };

  const menuPositionClass =
    dropdownDirection === 'up'
      ? 'bottom-full mb-2 left-0 rtl:left-auto rtl:right-0'
      : dropdownDirection === 'right'
        ? 'left-full ml-2 bottom-0 rtl:left-auto rtl:right-full rtl:mr-2 rtl:ml-0'
        : 'top-full mt-2 left-0 rtl:left-auto rtl:right-0';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-800 hover:bg-stone-200 dark:hover:bg-zinc-800 transition-all text-stone-700 dark:text-zinc-300 ${buttonClassName}`}
        aria-label={t('common.aria.changeLanguage')}
      >
        {showGlobeIcon && <Globe size={iconSize} className="text-stone-500 dark:text-zinc-400" />}
        {iconOnly ? null : label ? (
          <span>{label}</span>
        ) : compact ? (
          <span className="text-xs font-black tracking-wider leading-none">{currentLanguage.shortName}</span>
        ) : (
          <>
            <span className="text-sm font-bold hidden sm:inline">{currentLanguage.nativeName}</span>
            <span className="text-sm font-bold sm:hidden">{currentLanguage.shortName}</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
            className={`absolute ${menuPositionClass} w-40 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl overflow-hidden p-1.5 shadow-xl z-[90] ${menuClassName}`}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageClick(lang)}
                disabled={lang.comingSoon}
                aria-disabled={lang.comingSoon}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl label-strong font-sans transition-all ${
                  lang.comingSoon
                    ? 'text-stone-400 dark:text-zinc-600 cursor-not-allowed opacity-60'
                    : normalizedLanguage === lang.code
                      ? 'bg-mintcom-green/10 text-mintcom-green'
                      : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-zinc-800 hover:text-stone-900 dark:hover:text-zinc-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="opacity-70">{lang.shortName}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {lang.comingSoon ? (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-400 dark:text-zinc-500">
                    {t('common.comingSoon')}
                  </span>
                ) : (
                  normalizedLanguage === lang.code && <Check size={16} className="text-mintcom-green" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


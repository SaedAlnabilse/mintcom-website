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
    { code: 'en', nativeName: t('common.languages.en'), shortName: 'EN' },
    { code: 'ar', nativeName: t('common.languages.ar'), shortName: 'AR' },
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
        className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10 transition-all text-gray-700 dark:text-gray-300 ${buttonClassName}`}
        aria-label={t('common.aria.changeLanguage')}
      >
        {showGlobeIcon && <Globe size={iconSize} className="text-gray-500 dark:text-gray-400" />}
        {label ? (
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
            className={`absolute ${menuPositionClass} w-40 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden p-1.5 shadow-xl z-[90] ${menuClassName}`}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${
                  normalizedLanguage === lang.code
                    ? 'bg-paymint-green/10 text-paymint-green'
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="opacity-70">{lang.shortName}</span>
                  <span>{lang.nativeName}</span>
                </div>
                {normalizedLanguage === lang.code && <Check size={16} className="text-paymint-green" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


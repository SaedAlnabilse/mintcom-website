import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useState, useRef, useEffect } from 'react';

interface ThemeToggleProps {
  dropdownDirection?: 'up' | 'down' | 'right';
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
}

export const ThemeToggle = ({ dropdownDirection = 'down', className = '', iconSize = 20, showLabel = false }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [isOpen]);

  const { t } = useTranslation();
  const options = [
    { id: 'light', label: t('theme.light'), icon: Sun },
    { id: 'dark', label: t('theme.dark'), icon: Moon },
    { id: 'system', label: t('theme.system'), icon: Monitor },
  ] as const;

  const getDropdownClasses = () => {
    switch (dropdownDirection) {
      case 'up':
        return 'left-0 rtl:left-auto rtl:right-0 bottom-full mb-3';
      case 'right':
        return 'left-full rtl:left-auto rtl:right-full bottom-0 ml-2 rtl:ml-0 rtl:mr-2';
      case 'down':
      default:
        return 'right-0 rtl:right-auto rtl:left-0 top-full mt-3';
    }
  };

  const getAnimationProps = () => {
    switch (dropdownDirection) {
      case 'up':
        return { initial: { opacity: 0, y: 10, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 10, scale: 0.95 } };
      case 'right':
        return { initial: { opacity: 0, x: -10, scale: 0.95 }, animate: { opacity: 1, x: 0, scale: 1 }, exit: { opacity: 0, x: -10, scale: 0.95 } };
      case 'down':
      default:
        return { initial: { opacity: 0, y: -10, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -10, scale: 0.95 } };
    }
  };

  return (
    <div className={`relative ${showLabel ? 'w-full' : ''}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center transition-all active:scale-90 ${!showLabel && !className.includes('justify-') ? 'justify-center' : ''} ${className || 'w-9 h-9 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-paymint-green dark:hover:text-paymint-green'} ${isOpen ? 'bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white' : ''}`}
        title={t('theme.toggle')}
      >
        <div className="relative flex items-center justify-center" style={{ width: iconSize, height: iconSize }}>
          <AnimatePresence mode="wait">
            {theme === 'light' && (
              <motion.div key="light" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                <Sun size={iconSize} />
              </motion.div>
            )}
            {theme === 'dark' && (
              <motion.div key="dark" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                <Moon size={iconSize} />
              </motion.div>
            )}
            {theme === 'system' && (
              <motion.div key="system" className="absolute inset-0 flex items-center justify-center" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
                <Monitor size={iconSize} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {showLabel && <span>{t('theme.switchTheme')}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setIsOpen(false)} />
            <motion.div
              {...getAnimationProps()}
              style={{ position: 'absolute', zIndex: 9999 }}
              className={`${getDropdownClasses()} w-40 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden p-1.5 shadow-xl`}
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTheme(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${theme === option.id
                    ? 'bg-paymint-green/10 text-paymint-green'
                    : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <option.icon size={16} />
                  {option.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};


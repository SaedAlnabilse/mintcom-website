import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

interface ThemeToggleProps {
  dropdownDirection?: 'up' | 'down';
}

export const ThemeToggle = ({ dropdownDirection = 'down' }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ] as const;

  const dropdownPositionClass = dropdownDirection === 'up' 
    ? 'left-0 bottom-full mb-3' 
    : 'right-0 top-full mt-3';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-paymint-green dark:hover:text-paymint-green transition-all shadow-sm active:scale-90"
        title="Toggle theme"
      >
        <AnimatePresence mode="wait">
          {theme === 'light' && (
            <motion.div key="light" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <Sun size={20} />
            </motion.div>
          )}
          {theme === 'dark' && (
            <motion.div key="dark" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <Moon size={20} />
            </motion.div>
          )}
          {theme === 'system' && (
            <motion.div key="system" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }}>
              <Monitor size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: dropdownDirection === 'up' ? 10 : -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: dropdownDirection === 'up' ? 10 : -10, scale: 0.95 }}
              style={{ position: 'absolute', zIndex: 9999 }}
              className={`${dropdownPositionClass} w-40 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden p-1.5`}
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setTheme(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    theme === option.id
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
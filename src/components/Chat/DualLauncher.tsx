import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, HelpCircle, X, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DualLauncherProps {
  onOpenChat: () => void;
  onOpenFAQ: () => void;
  isChatOpen: boolean;
  isFAQOpen: boolean;
  onCloseAll: () => void;
}

export function DualLauncher({ onOpenChat, onOpenFAQ, isChatOpen, isFAQOpen, onCloseAll }: DualLauncherProps) {
  const { t } = useTranslation();
  const isRTL = t('common.locale') === 'ar';
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When open, show a sleek close button at the bottom right
  if (isChatOpen || isFAQOpen) {
    return (
      <motion.button
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 90 }}
        onClick={onCloseAll}
        className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[999999] w-14 h-14 rounded-2xl bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 transition-all hover:scale-105`}
      >
        <X size={22} />
      </motion.button>
    );
  }

  return (
    <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[999999]`} ref={containerRef}>
      <motion.div
        layout
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className={`relative flex items-center ${isExpanded 
          ? "p-1.5 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-gray-200/60 dark:border-white/10 overflow-hidden" 
          : "p-0 bg-transparent border-transparent shadow-none"}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isExpanded ? (
            <motion.button
              key="collapsed"
              layout="position"
              onClick={() => setIsExpanded(true)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#7CC39F] to-[#5BA882] text-white shadow-lg shadow-[#7CC39F]/40 hover:shadow-[#7CC39F]/60 transition-shadow"
            >
              <Sparkles size={22} className="animate-pulse" />
              {/* Notification dot */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-400 rounded-full border-2 border-white dark:border-[#0F172A] flex items-center justify-center"
              />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              layout="position"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-1"
            >
              {/* Primary Trigger (Ask AI) */}
              <motion.button
                layout="position"
                onClick={() => {
                  setIsExpanded(false);
                  onOpenChat();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#7CC39F] to-[#5BA882] text-white font-bold text-sm shadow-lg shadow-[#7CC39F]/30 transition-all hover:shadow-[#7CC39F]/50"
              >
                <Bot size={18} />
                <span>{t('chat.launcher.ask')}</span>
              </motion.button>

              <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1" />

              {/* Secondary Trigger (Q&A) */}
              <motion.button
                layout="position"
                onClick={() => {
                  setIsExpanded(false);
                  onOpenFAQ();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 font-bold text-sm transition-all"
              >
                <HelpCircle size={18} />
                <span>{t('chat.launcher.help')}</span>
              </motion.button>

              <motion.button
                layout="position"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors ml-0.5"
              >
                <X size={16} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

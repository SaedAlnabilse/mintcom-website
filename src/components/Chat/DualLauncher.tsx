import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, HelpCircle, X, Sparkles, ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface DualLauncherProps {
  onOpenChat: () => void;
  onOpenFAQ: () => void;
  onOpenTasks?: () => void;
  isChatOpen: boolean;
  isFAQOpen: boolean;
  isTasksOpen?: boolean;
  onCloseAll: () => void;
}

export function DualLauncher({ onOpenChat, onOpenFAQ, onOpenTasks, isChatOpen, isFAQOpen, isTasksOpen = false, onCloseAll }: DualLauncherProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const { account } = useAuth();
  
  const isDashboardRoute = /^\/dashboard\/[^/]+/.test(location.pathname);
  const isBrandRoute = /^\/brand\/[^/]+/.test(location.pathname);
  const isOwnerRoute = /^\/owner/.test(location.pathname);
  const isRTL = t('common.locale') === 'ar';
  const isAnyOpen = isChatOpen || isFAQOpen || isTasksOpen;

  // Determine the unique key for this "website" context
  let contextId = 'public';
  if (isDashboardRoute) {
    contextId = `dashboard-${params.locationSlug}`;
  } else if (isBrandRoute) {
    contextId = `brand-${params.brandId}`;
  } else if (isOwnerRoute) {
    contextId = 'owner-portal';
  }

  // Final key includes user ID for per-user settings
  const storageKey = `paymint.chatbot.tooltip_dismissed.${account?.id || 'anon'}.${contextId}`;

  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(storageKey) !== 'true';
  });

  // Sync tooltip visibility when storageKey changes (e.g. switching establishments)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem(storageKey) === 'true';
      setShowTooltip(!isDismissed);
    }
  }, [storageKey]);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close tooltip when clicking launcher or dismissing
  const dismissTooltip = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowTooltip(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  };

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

  // Keep mode switcher visible while one panel is open so users can switch directly.
  if (isAnyOpen) {
    return (
      <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[999999]`} ref={containerRef} dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className={`w-[min(${isDashboardRoute && onOpenTasks ? '440px' : '340px'},calc(100vw-20px))] flex items-center gap-2 p-1.5 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_32px_rgba(0,0,0,0.4)] border border-gray-200/60 dark:border-white/10`}
        >
          <div className={`grid ${isDashboardRoute && onOpenTasks ? 'grid-cols-3' : 'grid-cols-2'} gap-1 flex-1 p-1 rounded-xl bg-gray-100/80 dark:bg-white/5`}>
            <button
              onClick={() => {
                onOpenChat();
                dismissTooltip();
              }}
              aria-pressed={isChatOpen}
              className={`h-11 w-full flex items-center justify-center gap-2 px-3 rounded-xl font-bold text-sm transition-all ${isChatOpen
                  ? 'bg-gradient-to-r from-[#7CC39F] to-[#5BA882] text-white shadow-md shadow-[#7CC39F]/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                }`}
            >
              <Bot size={18} />
              <span>{t('chat.launcher.ask')}</span>
            </button>

            <button
              onClick={() => {
                onOpenFAQ();
                dismissTooltip();
              }}
              aria-pressed={isFAQOpen}
              className={`h-11 w-full flex items-center justify-center gap-2 px-3 rounded-xl font-bold text-sm transition-all ${isFAQOpen
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                }`}
            >
              <HelpCircle size={18} />
              <span>{t('chat.launcher.help')}</span>
            </button>

            {isDashboardRoute && onOpenTasks && (
              <button
                onClick={() => {
                  onOpenTasks();
                  dismissTooltip();
                }}
                aria-pressed={isTasksOpen}
                className={`h-11 w-full flex items-center justify-center gap-2 px-3 rounded-xl font-bold text-sm transition-all ${isTasksOpen
                    ? 'bg-gradient-to-r from-[#6FAE4A] to-[#4A8A2F] text-white shadow-md shadow-[#6FAE4A]/30'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                  }`}
              >
                <ClipboardCheck size={18} />
                <span>{t('chat.tasks.title', 'Tasks')}</span>
              </button>
            )}
          </div>

          <button
            onClick={onCloseAll}
            className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[999999]`} ref={containerRef} dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        layout
        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
        className={`relative flex items-center ${isExpanded
          ? `w-[min(${isDashboardRoute && onOpenTasks ? '440px' : '340px'},calc(100vw-20px))] p-1.5 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] border border-gray-200/60 dark:border-white/10 overflow-hidden`
          : "p-0 bg-transparent border-transparent shadow-none"}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isExpanded ? (
            <motion.div
              key="collapsed-container"
              className="relative flex items-center"
            >
              {/* Tooltip message */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                    className={`absolute bottom-16 ${isRTL ? 'left-0' : 'right-0'} flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-200 text-sm font-bold rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 whitespace-nowrap z-50`}
                  >
                    <span>{t('chat.launcher.help_message', 'How can I help you?')} 👋</span>
                    <button
                      onClick={dismissTooltip}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400"
                    >
                      <X size={14} />
                    </button>
                    {/* Tooltip arrow - centered over the 48px icon */}
                    <div className={`absolute -bottom-1.5 ${isRTL ? 'left-[18px]' : 'right-[18px]'} w-3 h-3 bg-white dark:bg-[#1E293B] border-b border-r border-gray-200 dark:border-white/10 rotate-45`} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                key="collapsed"
                id="tour-chat-bot"
                layout="position"
                onClick={() => {
                  setIsExpanded(true);
                  dismissTooltip();
                }}
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
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              layout="position"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="flex items-center gap-2 w-full"
            >
              <div className={`grid ${isDashboardRoute && onOpenTasks ? 'grid-cols-3' : 'grid-cols-2'} gap-1 flex-1 p-1 rounded-xl bg-gray-100/80 dark:bg-white/5`}>
                {/* Primary Trigger (Ask AI) */}
                <motion.button
                  layout="position"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenChat();
                    dismissTooltip();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-11 w-full px-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7CC39F] to-[#5BA882] text-white font-bold text-sm shadow-md shadow-[#7CC39F]/30 transition-all hover:shadow-[#7CC39F]/50"
                >
                  <Bot size={18} />
                  <span>{t('chat.launcher.ask')}</span>
                </motion.button>

                {/* FAQ Trigger */}
                <motion.button
                  layout="position"
                  onClick={() => {
                    setIsExpanded(false);
                    onOpenFAQ();
                    dismissTooltip();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-11 w-full px-3 flex items-center justify-center gap-2 rounded-xl bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 font-bold text-sm border border-gray-200/60 dark:border-white/10 transition-all hover:bg-gray-50 dark:hover:bg-white/10"
                >
                  <HelpCircle size={18} />
                  <span>{t('chat.launcher.help')}</span>
                </motion.button>

                {/* Dashboard Tasks Trigger */}
                {isDashboardRoute && onOpenTasks && (
                  <motion.button
                    layout="position"
                    onClick={() => {
                      setIsExpanded(false);
                      onOpenTasks();
                      dismissTooltip();
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-11 w-full px-3 flex items-center justify-center gap-2 rounded-xl bg-[#6FAE4A]/10 text-[#6FAE4A] dark:text-[#88D65F] font-bold text-sm border border-[#6FAE4A]/20 transition-all hover:bg-[#6FAE4A]/20"
                  >
                    <ClipboardCheck size={18} />
                    <span>{t('chat.tasks.title', 'Tasks')}</span>
                  </motion.button>
                )}
              </div>

              <motion.button
                layout="position"
                onClick={() => setIsExpanded(false)}
                className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
              >
                <X size={18} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, ClipboardCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PaymintLeafIcon from '../../assets/small-logo.svg';

interface DualLauncherProps {
  onOpenChat: () => void;
  onOpenFAQ: () => void;
  onOpenTasks?: () => void;
  isChatOpen: boolean;
  isFAQOpen: boolean;
  isTasksOpen?: boolean;
  onCloseAll: () => void;
  tasksCount?: number;
}

export function DualLauncher({ 
  onOpenChat, 
  onOpenFAQ, 
  onOpenTasks, 
  isChatOpen, 
  isFAQOpen, 
  isTasksOpen = false, 
  onCloseAll,
  tasksCount = 0
}: DualLauncherProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const params = useParams();
  const { account } = useAuth();
  
  const isDashboardRoute = /^\/dashboard\/[^/]+/.test(location.pathname);
  const isBrandRoute = /^\/brand\/[^/]+/.test(location.pathname);
  const isOwnerRoute = /^\/owner/.test(location.pathname);
  const isRTL = t('common.locale') === 'ar';
  const isAnyOpen = isChatOpen || isFAQOpen || isTasksOpen;

  // Smart Visibility State
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at the very top or if any panel is open
      if (currentScrollY < 50 || isAnyOpen) {
        setIsVisible(true);
      } else {
        // Hide on scroll down, show on scroll up
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
          setIsVisible(false);
        } else if (currentScrollY < lastScrollY) {
          setIsVisible(true);
        }
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isAnyOpen]);

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

  const dismissTooltip = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowTooltip(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
    }
  };

  // If ANY panel is open, show the unified switcher bar
  if (isAnyOpen) {
    return (
      <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[900]`} dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          id="paymint-launcher-switcher"
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 26 }}
          className={`w-[min(${isDashboardRoute ? '440px' : '340px'},calc(100vw-20px))] flex items-center gap-2 p-1.5 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl rounded-xl shadow-[0_10px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_32px_rgba(0,0,0,0.4)] border border-gray-200/60 dark:border-white/10`}
        >
          <div className={`grid ${isDashboardRoute ? 'grid-cols-3' : 'grid-cols-2'} gap-1 flex-1 p-1 rounded-xl bg-gray-100/80 dark:bg-white/5`}>
            {/* Ask AI Tab */}
            <button
              onClick={() => {
                onOpenChat();
                dismissTooltip();
              }}
              aria-pressed={isChatOpen}
              className={`h-11 w-full flex items-center justify-center gap-2 px-3 rounded-xl font-bold text-sm transition-all ${isChatOpen
                  ? 'bg-[#E6F4EA] text-[#3C8E4C] shadow-sm border border-[#7CC39F]/20'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                }`}
            >
              <img src={PaymintLeafIcon} alt="" className={`w-5 h-5 object-contain scale-x-[-1] ${isChatOpen ? '' : 'brightness-0 dark:invert opacity-50'}`} />
              <span>{t('chat.launcher.ask')}</span>
            </button>

            {/* Help Center Tab */}
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

            {/* Tasks Tab (Dashboard Only) */}
            {isDashboardRoute && (
              <button
                onClick={() => {
                  if (onOpenTasks) onOpenTasks();
                  dismissTooltip();
                }}
                aria-pressed={isTasksOpen}
                className={`h-11 w-full flex items-center justify-center gap-2 px-3 rounded-xl font-bold text-sm transition-all ${isTasksOpen
                    ? 'bg-[#E6F4EA] text-[#3C8E4C] shadow-sm border border-[#7CC39F]/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
                  }`}
              >
                <ClipboardCheck size={18} />
                <span>{t('chat.tasks.title', 'Tasks')}</span>
              </button>
            )}
          </div>

          {/* Global Close Button */}
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

  // Collapsed state - show separate buttons if on dashboard and tasks remain
  return (
    <div className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-[900] flex flex-col items-end gap-2`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* 1. Tasks Launcher (Separate) */}
      <AnimatePresence>
        {isDashboardRoute && tasksCount > 0 && isVisible && (
          <motion.button
            key="tasks-launcher"
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onOpenTasks && onOpenTasks()}
            className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#E6F4EA] dark:bg-[#7CC39F]/10 text-[#3C8E4C] shadow-lg shadow-[#7CC39F]/20 hover:shadow-[#7CC39F]/40 transition-all border border-[#7CC39F]/20"
          >
            <ClipboardCheck size={24} />
            
            {/* Task count badge */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 bg-yellow-400 rounded-full border-2 border-white dark:border-[#0F172A] flex items-center justify-center shadow-md"
            >
              <span className="text-[10px] font-black text-gray-900 leading-none">
                {tasksCount}
              </span>
            </motion.div>

            {/* Tooltip for tasks - Fixed direction to show towards screen center */}
            <div className={`absolute ${isRTL ? 'left-full ml-2' : 'right-full mr-2'} top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl`}>
              {t('chat.tasks.title', 'Tasks')}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. Chat Launcher (Separate) */}
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            className="relative flex items-center"
          >
            {/* Tooltip message - Smart positioning to avoid overlap */}
            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={isDashboardRoute && tasksCount > 0 
                    ? { opacity: 0, x: isRTL ? -10 : 10, y: "-50%", scale: 0.8 } 
                    : { opacity: 0, y: 10, scale: 0.8 }
                  }
                  animate={isDashboardRoute && tasksCount > 0 
                    ? { opacity: 1, x: 0, y: "-50%", scale: 1 } 
                    : { opacity: 1, y: 0, scale: 1 }
                  }
                  exit={isDashboardRoute && tasksCount > 0 
                    ? { opacity: 0, x: isRTL ? -10 : 10, y: "-50%", scale: 0.8 } 
                    : { opacity: 0, y: 10, scale: 0.8 }
                  }
                  className={`absolute flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-[#1E293B] text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl shadow-xl border border-gray-200 dark:border-white/10 whitespace-nowrap z-50 ${
                    isDashboardRoute && tasksCount > 0
                      ? `top-1/2 ${isRTL ? 'left-full ml-3' : 'right-full mr-3'}`
                      : `bottom-[60px] ${isRTL ? 'left-0' : 'right-0'}`
                  }`}
                >
                  <span>{t('chat.launcher.help_message', 'How can I help you?')} 👋</span>
                  <button
                    onClick={dismissTooltip}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400"
                  >
                    <X size={14} />
                  </button>
                  
                  {/* Arrow positioning based on tooltip location */}
                  {isDashboardRoute && tasksCount > 0 ? (
                    /* Side Arrow */
                    <div className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? '-left-1.5' : '-right-1.5'} w-3 h-3 bg-white dark:bg-[#1E293B] ${isRTL ? 'border-b border-l' : 'border-t border-r'} border-gray-200 dark:border-white/10 rotate-45`} />
                  ) : (
                    /* Bottom Arrow (centered over button) */
                    <div className={`absolute -bottom-1.5 ${isRTL ? 'left-[18px]' : 'right-[18px]'} w-3 h-3 bg-white dark:bg-[#1E293B] border-b border-r border-gray-200 dark:border-white/10 rotate-45`} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              id="tour-chat-bot"
              layout
              onClick={() => {
                onOpenChat();
                dismissTooltip();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="group relative flex items-center justify-center w-12 h-12 rounded-xl bg-[#E6F4EA] dark:bg-[#7CC39F]/10 shadow-lg shadow-[#7CC39F]/20 hover:shadow-[#7CC39F]/40 transition-all border border-[#7CC39F]/20"
            >
              <img 
                src={PaymintLeafIcon} 
                alt="" 
                className="w-8 h-8 object-contain scale-x-[-1] drop-shadow-sm" 
              />

              {/* Tooltip for Chat - matching tasks style */}
              <div className={`absolute ${isRTL ? 'left-full ml-2' : 'right-full mr-2'} top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-xl`}>
                {t('chat.launcher.ask', 'Ask AI')}
              </div>
              
              {/* Notification dot if tasks completed */}
              {isDashboardRoute && tasksCount === 0 && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-paymint-green rounded-full border-2 border-white dark:border-[#0F172A] flex items-center justify-center shadow-sm" />
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, HelpCircle, X, Sparkles } from 'lucide-react';

interface DualLauncherProps {
  onOpenChat: () => void;
  onOpenFAQ: () => void;
  isChatOpen: boolean;
  isFAQOpen: boolean;
  onCloseAll: () => void;
}

export function DualLauncher({ onOpenChat, onOpenFAQ, isChatOpen, isFAQOpen, onCloseAll }: DualLauncherProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.classList.toggle('launcher-expanded', isExpanded);
    return () => document.body.classList.remove('launcher-expanded');
  }, [isExpanded]);

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
        className="fixed bottom-6 right-6 z-[999999] w-12 h-12 rounded-full bg-white dark:bg-[#1E293B] text-gray-900 dark:text-white shadow-2xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 transition-colors"
      >
        <X size={20} />
      </motion.button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[999999]" ref={containerRef}>
      <motion.div 
        layout
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        className="relative flex items-center p-1.5 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-xl rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-gray-200/50 dark:border-white/10 overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isExpanded ? (
            <motion.button
              key="collapsed"
              layout="position"
              onClick={() => setIsExpanded(true)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[#7CC39F] text-black shadow-lg shadow-[#7CC39F]/30"
            >
              <Sparkles size={20} className="animate-pulse" />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              layout="position"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex items-center"
            >
              {/* Primary Trigger (Ask AI) */}
              <motion.button
                layout="position"
                onClick={onOpenChat}
                className="relative z-10 flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#7CC39F] text-black font-bold text-sm shadow-lg shadow-[#7CC39F]/30 group transition-all hover:brightness-110 whitespace-nowrap"
              >
                <Bot size={20} />
                <span>Ask AI</span>
              </motion.button>

              <motion.div layout="position" className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-2 flex-shrink-0" />

              {/* Secondary Trigger (Q&A) */}
              <motion.button
                layout="position"
                onClick={onOpenFAQ}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 font-bold text-sm transition-all whitespace-nowrap mr-2"
              >
                <HelpCircle size={18} />
                <span>Help</span>
              </motion.button>
              
              <motion.button
                layout="position"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors ml-1"
              >
                <X size={14} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}


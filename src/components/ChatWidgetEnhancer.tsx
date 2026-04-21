import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DualLauncher } from './Chat/DualLauncher';
import { FAQModal } from './Chat/FAQModal';
import { SmartChatbot } from './Chat/SmartChatbot';
import { TasksModal } from './Chat/TasksModal';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'paymint.widget.tasks.v1';
const POPUP_SEEN_KEY = 'paymint.widget.tasks.popup.seen';
const TOTAL_TASKS = 8; // Match the number of tasks in TasksWidget

const checkAllCompleted = () => {
    if (typeof window === 'undefined') return false;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            const completedCount = Object.values(parsed).filter(Boolean).length;
            return completedCount >= TOTAL_TASKS;
        }
    } catch {
        return false;
    }
    return false;
};

export const ChatWidgetEnhancer = () => {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isFAQOpen, setIsFAQOpen] = useState(false);
    const [isTasksOpen, setIsTasksOpen] = useState(false);
    const [tasksCount, setTasksCount] = useState(0);
    const [showCongratsPopup, setShowCongratsPopup] = useState(false);

    useEffect(() => {
        const handleTasksUpdate = () => {
            const completed = checkAllCompleted();

            // Calculate pending count
            if (typeof window !== 'undefined') {
                try {
                    const raw = window.localStorage.getItem(STORAGE_KEY);
                    const completedCount = raw ? Object.values(JSON.parse(raw)).filter(Boolean).length : 0;
                    setTasksCount(TOTAL_TASKS - completedCount);
                } catch {
                    setTasksCount(TOTAL_TASKS);
                }
            }

            // If completed and we haven't shown the popup yet, show it
            if (completed && typeof window !== 'undefined') {
                const seen = window.localStorage.getItem(POPUP_SEEN_KEY);
                if (!seen) {
                    setShowCongratsPopup(true);
                    window.localStorage.setItem(POPUP_SEEN_KEY, 'true');
                }
            }
        };

        // Check on mount as well in case it was completed while unmounted
        handleTasksUpdate();

        window.addEventListener('paymint-tasks-updated', handleTasksUpdate);
        return () => window.removeEventListener('paymint-tasks-updated', handleTasksUpdate);
    }, []);

    const handleOpenChat = () => {
        setIsChatOpen(true);
        setIsFAQOpen(false);
        setIsTasksOpen(false);
    };

    const handleOpenFAQ = () => {
        setIsFAQOpen(true);
        setIsChatOpen(false);
        setIsTasksOpen(false);
    };

    const handleOpenTasks = () => {
        setIsTasksOpen(true);
        setIsChatOpen(false);
        setIsFAQOpen(false);
    };

    const handleCloseAll = () => {
        setIsChatOpen(false);
        setIsFAQOpen(false);
        setIsTasksOpen(false);
    };

    return (
        <>
            <DualLauncher
                onOpenChat={handleOpenChat}
                onOpenFAQ={handleOpenFAQ}
                onOpenTasks={handleOpenTasks}
                isChatOpen={isChatOpen}
                isFAQOpen={isFAQOpen}
                isTasksOpen={isTasksOpen}
                onCloseAll={handleCloseAll}
                tasksCount={tasksCount}
            />
            <SmartChatbot
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
            />
            <FAQModal
                isOpen={isFAQOpen}
                onClose={() => setIsFAQOpen(false)}
            />
            <TasksModal 
                isOpen={isTasksOpen}
                onClose={() => setIsTasksOpen(false)}
            />

            {/* Congratulations Popup */}
            <AnimatePresence>
                {showCongratsPopup && createPortal(
                    <div className="fixed inset-0 z-[9999999] flex items-center justify-center p-4 isolate">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCongratsPopup(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            dir={isRTL ? 'rtl' : 'ltr'}
                            className="relative w-full max-w-sm bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden"
                        >
                            <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 mb-4 rounded-full bg-[#7CC39F]/10 flex items-center justify-center relative">
                                    <PartyPopper size={32} className="text-[#7CC39F]" />
                                    <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2, type: "spring" }}
                                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-white dark:bg-[#0F172A] rounded-full flex items-center justify-center"
                                    >
                                        <div className="w-5 h-5 bg-[#7CC39F] text-white rounded-full flex items-center justify-center">
                                            <CheckCircle2 size={12} strokeWidth={3} />
                                        </div>
                                    </motion.div>
                                </div>
                                
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    {t('chat.tasks.congratsTitle', 'Congratulations! 🎉')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                                    {t('chat.tasks.congratsMessage', 'You have successfully completed all the setup tasks. Your location is now fully ready to go!')}
                                </p>

                                <button
                                    onClick={() => setShowCongratsPopup(false)}
                                    className="w-full py-3.5 px-4 bg-gradient-to-r from-[#7CC39F] to-[#5BA882] hover:brightness-105 text-white font-bold rounded-xl shadow-lg shadow-[#7CC39F]/30 transition-all active:scale-[0.98]"
                                >
                                    {t('common.continue', 'Continue')}
                                </button>
                            </div>
                            
                            <button
                                onClick={() => setShowCongratsPopup(false)}
                                className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors`}
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </AnimatePresence>
        </>
    );
};


import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DualLauncher } from './Chat/DualLauncher';
import { FAQModal } from './Chat/FAQModal';
import { SmartChatbot } from './Chat/SmartChatbot';
import { TasksModal } from './Chat/TasksModal';
import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, X, CheckCircle2, Smartphone } from 'lucide-react';
import MintcomLeafIcon from '../assets/small-logo.svg';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import {
    areAllSetupTasksCompleted,
    countPendingSetupTasks,
    getDashboardTasksContextId,
    getPopupSeenKey,
    getTasksStorageKey,
    readCompletedTasksMap,
    TOTAL_SETUP_TASKS,
} from '../data/setupTasks';

export const ChatWidgetEnhancer = () => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const hideOnTryPos =
        location.pathname === '/try-pos' || location.pathname.startsWith('/try-pos/');
    const hideOnCustomerMenu =
        location.pathname === '/menu' ||
        location.pathname.startsWith('/menu/') ||
        location.pathname === '/qr-menu-demo' ||
        location.pathname.startsWith('/qr-menu-demo');
    const isRTL = i18n.language === 'ar';
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isFAQOpen, setIsFAQOpen] = useState(false);
    const [isTasksOpen, setIsTasksOpen] = useState(false);
    const [tasksCount, setTasksCount] = useState(0);
    const [showCongratsPopup, setShowCongratsPopup] = useState(false);
    const [isHiddenByOverlay, setIsHiddenByOverlay] = useState(false);
    const activeCongratsSeenKeyRef = useRef<string | null>(null);

    // Must match TasksModal: ChatWidgetEnhancer sits outside the dashboard route tree,
    // so useParams().locationSlug is always undefined — parse pathname instead.
    const storageContextId = useMemo(
        () => getDashboardTasksContextId(location.pathname),
        [location.pathname],
    );
    const storageKey = useMemo(() => getTasksStorageKey(storageContextId), [storageContextId]);
    const popupSeenKey = useMemo(() => getPopupSeenKey(storageContextId), [storageContextId]);

    const refreshTasksCount = useCallback(() => {
        const completedMap = readCompletedTasksMap(storageKey);
        setTasksCount(countPendingSetupTasks(completedMap));
        return areAllSetupTasksCompleted(completedMap);
    }, [storageKey]);

    const openCongratsOnce = useCallback(() => {
        if (typeof window === 'undefined') return false;
        try {
            if (window.localStorage.getItem(popupSeenKey)) return false;
        } catch {
            // Storage privacy/errors must not suppress a completion message.
        }

        activeCongratsSeenKeyRef.current = popupSeenKey;
        setIsTasksOpen(false);
        setIsChatOpen(false);
        setIsFAQOpen(false);
        setShowCongratsPopup(true);
        return true;
    }, [popupSeenKey]);

    const acknowledgeCongrats = useCallback(() => {
        const seenKey = activeCongratsSeenKeyRef.current || popupSeenKey;
        try {
            window.localStorage.setItem(seenKey, 'true');
        } catch {
            // The popup can still close when storage is unavailable.
        }
        activeCongratsSeenKeyRef.current = null;
        setShowCongratsPopup(false);
    }, [popupSeenKey]);

    useEffect(() => {
        const handleTasksUpdate = () => {
            const allDone = refreshTasksCount();
            // Fallback: if all tasks are done and we never celebrated, show the popup.
            // Covers cases where the transition event was missed (HMR, remount, etc.).
            if (allDone) {
                openCongratsOnce();
            }
        };

        const handleAllCompleted = () => {
            refreshTasksCount();
            openCongratsOnce();
        };

        // Sync badge; if already fully done and never celebrated, show popup.
        if (refreshTasksCount()) {
            openCongratsOnce();
        }

        window.addEventListener('mintcom-tasks-updated', handleTasksUpdate);
        window.addEventListener('mintcom-tasks-all-completed', handleAllCompleted);
        return () => {
            window.removeEventListener('mintcom-tasks-updated', handleTasksUpdate);
            window.removeEventListener('mintcom-tasks-all-completed', handleAllCompleted);
        };
    }, [refreshTasksCount, openCongratsOnce]);

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

    useEffect(() => {
        window.addEventListener('mintcom-open-tasks', handleOpenTasks);
        return () => window.removeEventListener('mintcom-open-tasks', handleOpenTasks);
    }, []);

    // Allow other parts of the app (e.g. landing page modals) to temporarily
    // hide the chat widget so it doesn't sit on top of their overlays.
    useEffect(() => {
        const handleHide = () => setIsHiddenByOverlay(true);
        const handleShow = () => setIsHiddenByOverlay(false);
        window.addEventListener('mintcom-chat-widget-hide', handleHide);
        window.addEventListener('mintcom-chat-widget-show', handleShow);
        return () => {
            window.removeEventListener('mintcom-chat-widget-hide', handleHide);
            window.removeEventListener('mintcom-chat-widget-show', handleShow);
        };
    }, []);

    const handleCloseAll = () => {
        setIsChatOpen(false);
        setIsFAQOpen(false);
        setIsTasksOpen(false);
    };

    const closeCongrats = acknowledgeCongrats;

    const handleGetAppFromCongrats = () => {
        acknowledgeCongrats();
        window.dispatchEvent(new Event('mintcom-open-mobile-app'));
    };

    // Full-screen POS sandbox & customer digital menu — keep layout clean (no DualLauncher / chatbot)
    if (hideOnTryPos || hideOnCustomerMenu) {
        return null;
    }

    return (
        <>
            <div
                aria-hidden={isHiddenByOverlay || undefined}
                className={isHiddenByOverlay ? 'pointer-events-none opacity-0 invisible transition-opacity duration-150' : 'transition-opacity duration-150'}
            >
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
            </div>

            {/* Celebration popup — shown once when every setup task is done */}
            <AnimatePresence>
                {showCongratsPopup && createPortal(
                    <div
                        dir={isRTL ? 'rtl' : 'ltr'}
                        className="fixed inset-0 z-[9999999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 isolate"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="setup-congrats-title"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={closeCongrats}
                            className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 80, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.96 }}
                            transition={{ type: 'spring', duration: 0.45, bounce: 0.28 }}
                            className="relative w-full sm:max-w-md bg-white dark:bg-[#0F172A] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 overflow-hidden z-10"
                        >
                            <div
                                className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#7dc6a2]/20 via-[#7dc6a2]/5 to-transparent"
                                aria-hidden
                            />

                            <div className="sm:hidden flex justify-center pt-3 pb-1 relative z-10">
                                <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                            </div>

                            <button
                                onClick={closeCongrats}
                                className="absolute top-4 end-4 z-20 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                                aria-label={t('common.close', 'Close')}
                            >
                                <X size={16} />
                            </button>

                            <div className="relative px-6 pt-10 pb-8 flex flex-col items-center text-center">
                                <div className="relative mb-5">
                                    <motion.div
                                        initial={{ scale: 0.6, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: 'spring', delay: 0.05 }}
                                        className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7dc6a2]/25 to-[#5BA882]/15 flex items-center justify-center ring-8 ring-[#7dc6a2]/10"
                                    >
                                        <PartyPopper size={36} className="text-[#5BA882]" />
                                    </motion.div>
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.25, type: 'spring' }}
                                        className="absolute -bottom-1 -end-1 w-8 h-8 bg-white dark:bg-[#0F172A] rounded-full flex items-center justify-center shadow-sm"
                                    >
                                        <div className="w-6 h-6 bg-[#7dc6a2] text-white rounded-full flex items-center justify-center">
                                            <CheckCircle2 size={14} strokeWidth={3} />
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35 }}
                                        className="absolute -top-1 -start-2 text-[#7dc6a2]"
                                    >
                                        <img src={MintcomLeafIcon} alt="" style={{ width: 16, height: 16 }} className="scale-x-[-1] object-contain" />
                                    </motion.div>
                                </div>

                                <p className="text-xs font-bold uppercase tracking-widest text-[#5BA882] mb-2">
                                    {t('chat.tasks.allDoneTitle', 'All Done!')}
                                </p>
                                <h3
                                    id="setup-congrats-title"
                                    className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
                                >
                                    {t('chat.tasks.congratsTitle', 'Congratulations! 🎉')}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-2 max-w-sm">
                                    {t(
                                        'chat.tasks.congratsMessage',
                                        'Every setup step is done and your location is ready for real sales. Install the POS app on your devices to start ringing up orders, and reopen this guide any time from the Tasks button.',
                                    )}
                                </p>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mb-6">
                                    {t('chat.tasks.congratsProgress', {
                                        total: TOTAL_SETUP_TASKS,
                                        defaultValue: `All ${TOTAL_SETUP_TASKS} setup steps completed`,
                                    })}
                                </p>

                                <div className="w-full space-y-2.5">
                                    <button
                                        type="button"
                                        onClick={handleGetAppFromCongrats}
                                        className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#7dc6a2] to-[#5BA882] hover:brightness-105 text-white font-bold rounded-xl shadow-lg shadow-[#7dc6a2]/25 transition-all active:scale-[0.98]"
                                    >
                                        <Smartphone size={18} />
                                        <span>{t('chat.tasks.congratsGetApp', 'Install POS App')}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeCongrats}
                                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                    >
                                        {t('chat.tasks.congratsContinue', 'Continue to Dashboard')}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>,
                    document.body,
                )}
            </AnimatePresence>
        </>
    );
};

import { AnimatePresence, motion } from 'framer-motion';
import {
    Check,
    ChevronDown,
    ChevronUp,
    ClipboardCheck,
    ExternalLink,
    ListTodo,
    PartyPopper,
    RotateCcw,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TaskNavigation {
    path: string;
    state?: Record<string, unknown>;
}

interface TaskItem {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    navigation: TaskNavigation;
    estimateMinutes: number;
}

/* ------------------------------------------------------------------ */
/*  LocalStorage helpers                                               */
/* ------------------------------------------------------------------ */

const STORAGE_KEY = 'paymint.widget.tasks.v1';
const DISMISSED_KEY = 'paymint.widget.tasks.dismissed';

function readCompletedState(): Record<string, boolean> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed as Record<string, boolean>;
    } catch {
        /* ignore */
    }
    return {};
}

function readDismissedState(): boolean {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(DISMISSED_KEY) === 'true';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function TasksWidget() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const navigate = useNavigate();
    const location = useLocation();

    const [completedById, setCompletedById] = useState<Record<string, boolean>>(readCompletedState);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(readDismissedState);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    /* ---- only show on dashboard routes ---- */
    const isDashboardRoute = /^\/dashboard\/[^/]+/.test(location.pathname);

    const dashboardSlug = useMemo(() => {
        const match = location.pathname.match(/^\/dashboard\/([^/]+)/);
        return match ? match[1] : null;
    }, [location.pathname]);

    const dashboardRoute = useCallback(
        (suffix: string, fallback: string) =>
            dashboardSlug ? `/dashboard/${dashboardSlug}${suffix}` : fallback,
        [dashboardSlug],
    );

    /* ---- build task list ---- */
    const tasks = useMemo<TaskItem[]>(
        () => [
            {
                id: 'location-profile',
                title: t('chat.tasks.profile.title'),
                description: t('chat.tasks.profile.description'),
                actionLabel: t('chat.tasks.profile.action'),
                navigation: {
                    path: dashboardRoute('/settings', '/onboarding/step/1'),
                    state: { openSettingsTab: 'profile' },
                },
                estimateMinutes: 2,
            },
            {
                id: 'receipt-settings',
                title: t('chat.tasks.receipt.title'),
                description: t('chat.tasks.receipt.description'),
                actionLabel: t('chat.tasks.receipt.action'),
                navigation: {
                    path: dashboardRoute('/settings', '/onboarding/step/1'),
                    state: { openSettingsTab: 'receipt' },
                },
                estimateMinutes: 2,
            },
            {
                id: 'create-category',
                title: t('chat.tasks.categories.title'),
                description: t('chat.tasks.categories.description'),
                actionLabel: t('chat.tasks.categories.action'),
                navigation: {
                    path: dashboardRoute('/categories', '/onboarding/step/1'),
                    state: { openCreateModal: true },
                },
                estimateMinutes: 2,
            },
            {
                id: 'add-product',
                title: t('chat.tasks.products.title'),
                description: t('chat.tasks.products.description'),
                actionLabel: t('chat.tasks.products.action'),
                navigation: {
                    path: dashboardRoute('/products', '/onboarding/step/1'),
                    state: { openCreateModal: true },
                },
                estimateMinutes: 2,
            },
            {
                id: 'setup-payments',
                title: t('chat.tasks.payments.title'),
                description: t('chat.tasks.payments.description'),
                actionLabel: t('chat.tasks.payments.action'),
                navigation: {
                    path: dashboardRoute('/payment-methods', '/onboarding/step/2'),
                    state: { openCreateModal: true },
                },
                estimateMinutes: 2,
            },
            {
                id: 'setup-taxes',
                title: t('chat.tasks.taxes.title'),
                description: t('chat.tasks.taxes.description'),
                actionLabel: t('chat.tasks.taxes.action'),
                navigation: {
                    path: dashboardRoute('/settings', '/onboarding/step/2'),
                    state: { openSettingsTab: 'sales' },
                },
                estimateMinutes: 1,
            },
            {
                id: 'add-staff',
                title: t('chat.tasks.staff.title'),
                description: t('chat.tasks.staff.description'),
                actionLabel: t('chat.tasks.staff.action'),
                navigation: {
                    path: dashboardRoute('/staff', '/onboarding/step/4'),
                    state: { openCreateModal: true },
                },
                estimateMinutes: 2,
            },
            {
                id: 'go-live',
                title: t('chat.tasks.goLive.title'),
                description: t('chat.tasks.goLive.description'),
                actionLabel: t('chat.tasks.goLive.action'),
                navigation: { path: '/onboarding/step/5' },
                estimateMinutes: 3,
            },
        ],
        [t, dashboardRoute],
    );

    /* ---- derived state ---- */
    const completedCount = useMemo(
        () => tasks.filter((task) => completedById[task.id]).length,
        [tasks, completedById],
    );

    const allCompleted = completedCount === tasks.length;

    const totalMinutes = useMemo(
        () => tasks.reduce((sum, task) => sum + task.estimateMinutes, 0),
        [tasks],
    );

    const remainingMinutes = useMemo(
        () =>
            tasks.reduce((sum, task) => sum + (completedById[task.id] ? 0 : task.estimateMinutes), 0),
        [tasks, completedById],
    );

    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    /* ---- persistence ---- */
    useEffect(() => {
        setCompletedById(readCompletedState());
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedById));
            window.dispatchEvent(new Event('paymint-tasks-updated'));
        } catch {
            /* no-op */
        }
    }, [completedById]);

    /* ---- auto-dismiss when all complete ---- */
    useEffect(() => {
        if (allCompleted && !isPanelOpen) {
            setIsDismissed(true);
            window.localStorage.setItem(DISMISSED_KEY, 'true');
        }
    }, [allCompleted, isPanelOpen]);

    /* ---- when panel opens, expand first pending, then collapse (no auto expand) ---- */
    useEffect(() => {
        if (!isPanelOpen) {
            setExpandedId(null);
            return;
        }
        // Do NOT auto-expand any task — panel opens collapsed
    }, [isPanelOpen]);

    /* ---- handlers ---- */
    const toggleComplete = (taskId: string) => {
        setCompletedById((prev) => {
            const isNowComplete = !prev[taskId];
            // If marking as complete and it's the currently expanded task, collapse it
            if (isNowComplete && expandedId === taskId) {
                setExpandedId(null);
            }
            return {
                ...prev,
                [taskId]: isNowComplete,
            };
        });
    };

    const handleOpenTask = (navigation: TaskNavigation) => {
        // Close the expanded task so user can focus
        setExpandedId(null);
        navigate(navigation.path, navigation.state ? { state: navigation.state } : undefined);
    };

    const openPanel = () => {
        setIsPanelOpen(true);
        setIsDismissed(false);
        window.localStorage.removeItem(DISMISSED_KEY);
    };

    const closePanel = () => {
        setIsPanelOpen(false);
    };

    const handleResetTasks = () => {
        setCompletedById({});
        setIsDismissed(false);
        window.localStorage.removeItem(DISMISSED_KEY);
        window.localStorage.removeItem(STORAGE_KEY);
    };

    useEffect(() => {
        const handleOpenTasksEvent = () => {
            openPanel();
        };
        window.addEventListener('paymint-open-tasks', handleOpenTasksEvent);
        return () => window.removeEventListener('paymint-open-tasks', handleOpenTasksEvent);
    }, []);

    /* ---- visibility ---- */
    if (!isDashboardRoute) return null;
    // If all tasks completed and dismissed (panel closed), hide FAB
    if (allCompleted && isDismissed && !isPanelOpen) return null;

    const pendingCount = tasks.length - completedCount;

    return (
        <>
            {/* ======================= FLOATING ACTION BUTTON ======================= */}
            <AnimatePresence>
                {!isPanelOpen && (
                    <motion.button
                        id="tasks-widget-fab"
                        key="tasks-fab"
                        initial={{ opacity: 0, scale: 0.4, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.4, y: 30 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={openPanel}
                        className={`fixed bottom-[90px] ${isRTL ? 'left-6' : 'right-6'} z-[999998] group`}
                        aria-label="Open setup tasks"
                    >
                        {/* Outer glow ring */}
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute inset-0 rounded-2xl bg-[#7CC39F]/30"
                        />

                        {/* Main button */}
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7CC39F] to-[#5BA882] text-white shadow-lg shadow-[#7CC39F]/40 flex items-center justify-center transition-shadow group-hover:shadow-[#7CC39F]/60">
                            <ListTodo size={22} strokeWidth={2.2} />
                        </div>

                        {/* Badge with pending count */}
                        {pendingCount > 0 && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`absolute -top-1.5 ${isRTL ? '-left-1.5' : '-right-1.5'} min-w-[22px] h-[22px] px-1 rounded-full bg-amber-400 text-[11px] font-black text-gray-900 flex items-center justify-center border-2 border-white dark:border-[#0F172A] shadow-sm`}
                            >
                                {pendingCount}
                            </motion.div>
                        )}

                        {/* All done badge */}
                        {allCompleted && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className={`absolute -top-1.5 ${isRTL ? '-left-1.5' : '-right-1.5'} w-[22px] h-[22px] rounded-full bg-[#7CC39F] text-white flex items-center justify-center border-2 border-white dark:border-[#0F172A]`}
                            >
                                <Check size={12} strokeWidth={3} />
                            </motion.div>
                        )}
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ======================= TASKS PANEL ======================= */}
            <AnimatePresence>
                {isPanelOpen && (
                    <motion.div
                        id="tasks-widget-panel"
                        key="tasks-panel"
                        initial={{ opacity: 0, y: 30, scale: 0.92 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.92 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        dir={isRTL ? 'rtl' : 'ltr'}
                        className={`fixed bottom-[90px] ${isRTL ? 'left-[30px]' : 'right-[30px]'} z-[999999] w-[400px] max-w-[calc(100vw-60px)] h-[600px] max-h-[calc(100vh-150px)] bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 flex flex-col overflow-hidden`}
                    >
                        {/* ---------- Header ---------- */}
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7CC39F]/20 to-[#7CC39F]/5 text-[#7CC39F] flex items-center justify-center">
                                    <ClipboardCheck size={18} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                                        {t('chat.tasks.title')}
                                    </h3>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 leading-tight">
                                        {completedCount}/{tasks.length} {t('chat.tasks.completed')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {/* Reset button (only appears when some tasks are completed) */}
                                {completedCount > 0 && (
                                    <button
                                        onClick={handleResetTasks}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                                        aria-label="Reset tasks"
                                        title="Reset all tasks"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                )}
                                <button
                                    onClick={closePanel}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
                                    aria-label={t('common.close')}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* ---------- Scrollable content ---------- */}
                        <div
                            ref={scrollContainerRef}
                            className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3"
                        >
                            {/* Progress card */}
                            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] p-4">
                                <h4 className="text-xl font-bold text-gray-900 dark:text-white text-center">
                                    {t('chat.tasks.setupGuideTitle')}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300 text-center mt-1 leading-relaxed">
                                    {t('chat.tasks.setupGuideSubtitle')}
                                </p>

                                <div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
                                    <span>{t('chat.tasks.stepsCount', { count: tasks.length })}</span>
                                    <span>
                                        {t('chat.tasks.aboutMinutes', {
                                            minutes: remainingMinutes || totalMinutes,
                                        })}
                                    </span>
                                </div>

                                <div className="mt-2 h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-[#7CC39F] to-[#5BA882]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                </div>

                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                    {t('chat.tasks.progressText', {
                                        done: completedCount,
                                        total: tasks.length,
                                    })}
                                </p>
                            </div>

                            {/* All-done celebration */}
                            {allCompleted && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-2xl border border-[#7CC39F]/30 dark:border-[#7CC39F]/20 bg-[#7CC39F]/10 dark:bg-[#7CC39F]/10 p-5 text-center"
                                >
                                    <PartyPopper
                                        size={40}
                                        className="mx-auto text-[#7CC39F] mb-2"
                                    />
                                    <h4 className="text-lg font-bold text-[#7CC39F] dark:text-[#7CC39F]">
                                        {t('chat.tasks.allDoneTitle', 'All Done! 🎉')}
                                    </h4>
                                    <p className="text-sm text-[#7CC39F]/80 dark:text-[#7CC39F]/80 mt-1">
                                        {t(
                                            'chat.tasks.allDoneSubtitle',
                                            'Your location is fully set up and ready to go.',
                                        )}
                                    </p>
                                </motion.div>
                            )}

                            {/* Task items */}
                            {tasks.map((task, index) => {
                                const isCompleted = Boolean(completedById[task.id]);
                                const isExpanded = expandedId === task.id;

                                return (
                                    <div
                                        key={task.id}
                                        id={`widget-task-item-${task.id}`}
                                        className={`rounded-2xl border overflow-hidden transition-colors ${isCompleted
                                            ? 'border-[#7CC39F]/30 dark:border-[#7CC39F]/10 bg-[#7CC39F]/5 dark:bg-[#7CC39F]/5'
                                            : 'border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.02]'
                                            } shadow-sm`}
                                    >
                                        <button
                                            onClick={() => {
                                                const isExpanding = expandedId !== task.id;
                                                setExpandedId(isExpanding ? task.id : null);
                                                if (isExpanding) {
                                                    setTimeout(() => {
                                                        const el = document.getElementById(`widget-task-item-${task.id}`);
                                                        if (el) {
                                                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                                        }
                                                    }, 250);
                                                }
                                            }}
                                            className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors"
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-colors ${isCompleted
                                                    ? 'bg-[#7CC39F]/15 text-[#7CC39F]'
                                                    : 'bg-[#7CC39F]/10 text-gray-700 dark:text-gray-200'
                                                    }`}
                                            >
                                                {isCompleted ? <Check size={18} /> : index + 1}
                                            </div>

                                            <span
                                                className={`flex-1 text-base font-bold transition-colors ${isCompleted
                                                    ? 'text-gray-400 dark:text-gray-500 line-through'
                                                    : 'text-gray-900 dark:text-white'
                                                    }`}
                                            >
                                                {task.title}
                                            </span>

                                            <span className="text-gray-400 flex-shrink-0">
                                                {isExpanded ? (
                                                    <ChevronUp size={18} />
                                                ) : (
                                                    <ChevronDown size={18} />
                                                )}
                                            </span>
                                        </button>

                                        <AnimatePresence initial={false}>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-4 pb-4 pt-0">
                                                        <div className="h-px bg-gray-100 dark:bg-white/10 mb-4" />
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                                            {task.description}
                                                        </p>

                                                        <div className="mt-4 flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleOpenTask(task.navigation)}
                                                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7CC39F] to-[#5BA882] text-white font-bold text-sm shadow-sm hover:brightness-105 transition-all"
                                                            >
                                                                <span>{task.actionLabel}</span>
                                                                <ExternalLink size={14} />
                                                            </button>

                                                            <button
                                                                onClick={() => toggleComplete(task.id)}
                                                                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${isCompleted
                                                                    ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                                                    : 'text-[#7CC39F] hover:bg-[#7CC39F]/10'
                                                                    }`}
                                                            >
                                                                <Check size={14} />
                                                                <span>
                                                                    {isCompleted
                                                                        ? t('chat.tasks.completed')
                                                                        : t('chat.tasks.markAsCompleted')}
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

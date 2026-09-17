import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, ClipboardList, ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  areAllSetupTasksCompleted,
  getDashboardTasksContextId,
  getTasksStorageKey,
  readCompletedTasksMap,
  SETUP_TASK_IDS,
} from '../../data/setupTasks';
import { ModalCloseButton } from '../ui';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TaskNavigation {
  path: string;
  state?: Record<string, unknown>;
}

interface TaskItem {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  /** Navigate to a dashboard page, or open a global UI (e.g. mobile app modal). */
  navigation?: TaskNavigation;
  openEvent?: string;
  estimateMinutes: number;
}

export function TasksModal({ isOpen, onClose }: TasksModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const [completedById, setCompletedById] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  /** Skip the first persist after loading from localStorage so we don't overwrite with stale state. */
  const skipNextPersistRef = useRef(true);
  const prevAllDoneRef = useRef(false);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        // Ignore clicks on the launcher switcher bar
        const target = event.target as Element;
        const isSwitcher = target.closest('#mintcom-launcher-switcher');
        const isSetupGuide = target.closest('#mintcom-tour-guide-active');
        const isWelcomePopup = target.closest('#mintcom-dashboard-welcome-popup');
        if (!isSwitcher && !isSetupGuide && !isWelcomePopup) {
          onClose();
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const dashboardSlug = useMemo(() => {
    const match = location.pathname.match(/^\/dashboard\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);
  const storageKey = useMemo(
    () => getTasksStorageKey(getDashboardTasksContextId(location.pathname)),
    [location.pathname],
  );

  const dashboardRoute = useCallback((suffix: string, fallback: string) =>
    dashboardSlug ? `/dashboard/${dashboardSlug}${suffix}` : fallback,
  [dashboardSlug]);

  // One outcome per step — no double visits to the same screen.
  // Order: identity → money → menu → growth → team → launch.
  const tasks = useMemo<TaskItem[]>(() => [
    {
      id: 'location-profile',
      title: t('chat.tasks.profile.title'),
      description: t('chat.tasks.profile.description'),
      actionLabel: t('chat.tasks.profile.action'),
      navigation: {
        path: dashboardRoute('/settings', '/onboarding'),
        state: { openSettingsTab: 'profile' }
      },
      estimateMinutes: 1
    },
    {
      id: 'receipt-settings',
      title: t('chat.tasks.receipt.title'),
      description: t('chat.tasks.receipt.description'),
      actionLabel: t('chat.tasks.receipt.action'),
      navigation: {
        path: dashboardRoute('/settings', '/onboarding'),
        state: { openSettingsTab: 'receipt' }
      },
      estimateMinutes: 1
    },
    {
      id: 'setup-taxes',
      title: t('chat.tasks.taxes.title'),
      description: t('chat.tasks.taxes.description'),
      actionLabel: t('chat.tasks.taxes.action'),
      navigation: {
        path: dashboardRoute('/settings', '/onboarding'),
        state: { openSettingsTab: 'sales' }
      },
      estimateMinutes: 1
    },
    {
      id: 'setup-payments',
      title: t('chat.tasks.payments.title'),
      description: t('chat.tasks.payments.description'),
      actionLabel: t('chat.tasks.payments.action'),
      navigation: {
        path: dashboardRoute('/payment-methods', '/onboarding'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 1
    },
    {
      id: 'create-category',
      title: t('chat.tasks.categories.title'),
      description: t('chat.tasks.categories.description'),
      actionLabel: t('chat.tasks.categories.action'),
      navigation: {
        path: dashboardRoute('/categories', '/onboarding'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 1
    },
    {
      id: 'add-product',
      title: t('chat.tasks.products.title'),
      description: t('chat.tasks.products.description'),
      actionLabel: t('chat.tasks.products.action'),
      navigation: {
        path: dashboardRoute('/products', '/onboarding'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 4
    },
    {
      id: 'addons',
      title: t('chat.tasks.addons.title'),
      description: t('chat.tasks.addons.description'),
      actionLabel: t('chat.tasks.addons.action'),
      navigation: {
        path: dashboardRoute('/addons', '/onboarding'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 2
    },
    {
      id: 'discounts',
      title: t('chat.tasks.discounts.title'),
      description: t('chat.tasks.discounts.description'),
      actionLabel: t('chat.tasks.discounts.action'),
      navigation: {
        path: dashboardRoute('/discounts', '/onboarding'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 2
    },
    {
      id: 'loyalty',
      title: t('chat.tasks.loyalty.title'),
      description: t('chat.tasks.loyalty.description'),
      actionLabel: t('chat.tasks.loyalty.action'),
      navigation: {
        path: dashboardRoute('/loyalty', '/onboarding')
      },
      estimateMinutes: 2
    },
    {
      id: 'roles',
      title: t('chat.tasks.roles.title'),
      description: t('chat.tasks.roles.description'),
      actionLabel: t('chat.tasks.roles.action'),
      navigation: {
        path: dashboardRoute('/roles', '/onboarding')
      },
      estimateMinutes: 2
    },
    {
      id: 'add-staff',
      title: t('chat.tasks.staff.title'),
      description: t('chat.tasks.staff.description'),
      actionLabel: t('chat.tasks.staff.action'),
      navigation: {
        path: dashboardRoute('/staff', '/onboarding'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 2
    },
    {
      id: 'go-live',
      title: t('chat.tasks.goLive.title'),
      description: t('chat.tasks.goLive.description'),
      actionLabel: t('chat.tasks.goLive.action'),
      // Opens the Get Mobile App modal (App Store / Google Play) in the dashboard shell.
      openEvent: 'mintcom-open-mobile-app',
      estimateMinutes: 2
    }
  ], [t, dashboardRoute]);

  useEffect(() => {
    skipNextPersistRef.current = true;
    const loaded = readCompletedTasksMap(storageKey);
    setCompletedById(loaded);
    prevAllDoneRef.current = areAllSetupTasksCompleted(loaded);
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(completedById));
      window.dispatchEvent(new Event('mintcom-tasks-updated'));

      const allDone = areAllSetupTasksCompleted(completedById);
      // Fire once when the user just finished the last remaining task.
      if (allDone && !prevAllDoneRef.current) {
        window.dispatchEvent(new Event('mintcom-tasks-all-completed'));
      }
      prevAllDoneRef.current = allDone;
    } catch {
      // No-op if storage is unavailable.
    }
  }, [completedById, storageKey]);

  useEffect(() => {
    if (!isOpen || tasks.length === 0) {
      return;
    }

    // Only auto-expand if no task is currently expanded
    setExpandedId(current => {
      if (current) return current;
      const firstPending = tasks.find((task) => !completedById[task.id]);
      return firstPending ? firstPending.id : tasks[0].id;
    });
  }, [isOpen, tasks, completedById]);

  // Scroll to expanded task if it exists when the modal opens
  useEffect(() => {
    if (isOpen && expandedId) {
      setTimeout(() => {
        const el = document.getElementById(`task-item-${expandedId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only fire when isOpen changes

  const completedCount = useMemo(
    () => SETUP_TASK_IDS.filter((id) => completedById[id]).length,
    [completedById]
  );

  const totalMinutes = useMemo(
    () => tasks.reduce((sum, task) => sum + task.estimateMinutes, 0),
    [tasks]
  );

  const remainingMinutes = useMemo(
    () => tasks.reduce((sum, task) => sum + (completedById[task.id] ? 0 : task.estimateMinutes), 0),
    [tasks, completedById]
  );

  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  const toggleComplete = (taskId: string) => {
    setCompletedById((prev) => {
      const isNowComplete = !prev[taskId];
      // If marking as complete and it's the currently expanded task, collapse it
      if (isNowComplete && expandedId === taskId) {
        setExpandedId(null);
      }
      const next = {
        ...prev,
        [taskId]: isNowComplete,
      };

      // Eager celebration when the last incomplete task is checked (don't wait only on effect).
      if (isNowComplete && areAllSetupTasksCompleted(next) && typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // ignore
        }
        // Defer so React state commit finishes first.
        queueMicrotask(() => {
          window.dispatchEvent(new Event('mintcom-tasks-updated'));
          window.dispatchEvent(new Event('mintcom-tasks-all-completed'));
        });
      }

      return next;
    });
  };

  const handleOpenTask = (task: TaskItem) => {
    onClose(); // Close the modal so the user can complete the task
    if (task.openEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(task.openEvent));
      return;
    }
    if (task.navigation) {
      navigate(task.navigation.path, task.navigation.state ? { state: task.navigation.state } : undefined);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`fixed bottom-[100px] ${isRTL ? 'left-[30px]' : 'right-[30px]'} z-[950] w-[400px] max-w-[calc(100vw-60px)] h-[600px] max-h-[calc(100vh-150px)] bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 flex flex-col overflow-hidden`}
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#7dc6a2]/10 text-[#7dc6a2] flex items-center justify-center">
                <ClipboardList size={16} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('chat.tasks.title')}</h3>
            </div>
            <ModalCloseButton onClose={onClose} />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            <div
              data-tour-id="tasks-setup-overview"
              className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] p-4"
            >
              <h4 className="text-xl font-bold text-gray-900 dark:text-white text-center">{t('chat.tasks.setupGuideTitle')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 text-center mt-1 leading-relaxed">
                {t('chat.tasks.setupGuideSubtitle')}
              </p>

              <div className="flex items-center justify-between mt-3 text-sm text-gray-500 dark:text-gray-400">
                <span>{t('chat.tasks.stepsCount', { count: tasks.length })}</span>
                <span>{t('chat.tasks.aboutMinutes', { minutes: remainingMinutes || totalMinutes })}</span>
              </div>

              <div className="mt-2 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7dc6a2] to-[#5BA882] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                {t('chat.tasks.progressText', { done: completedCount, total: tasks.length })}
              </p>
            </div>

            {tasks.map((task, index) => {
              const isCompleted = Boolean(completedById[task.id]);
              const isExpanded = expandedId === task.id;

              return (
                <div
                  key={task.id}
                  id={`task-item-${task.id}`}
                  className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/[0.02] shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => {
                      const isExpanding = expandedId !== task.id;
                      setExpandedId(isExpanding ? task.id : null);
                      if (isExpanding) {
                        setTimeout(() => {
                          const el = document.getElementById(`task-item-${task.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                          }
                        }, 250);
                      }
                    }}
                    className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50/80 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                        isCompleted
                          ? 'bg-[#7dc6a2]/15 text-[#5BA882]'
                          : 'bg-[#7dc6a2]/10 text-gray-700 dark:text-gray-200'
                      }`}
                    >
                      {isCompleted ? <Check size={18} /> : index + 1}
                    </div>

                    <span className={`flex-1 text-base font-bold ${isCompleted ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                      {task.title}
                    </span>

                    <span className="text-gray-400 flex-shrink-0">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 pt-0">
                          <div className="h-px bg-gray-100 dark:bg-white/10 mb-4" />
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {task.description}
                          </p>

                          <div className="mt-4 flex items-center gap-2">
                            <button
                              onClick={() => handleOpenTask(task)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7dc6a2] to-[#5BA882] text-white font-bold text-sm shadow-sm hover:brightness-105 transition-all"
                            >
                              <span>{task.actionLabel}</span>
                              <ExternalLink size={14} />
                            </button>

                            <button
                              onClick={() => toggleComplete(task.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                                isCompleted
                                  ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                  : 'text-[#7dc6a2] hover:bg-[#7dc6a2]/10'
                              }`}
                            >
                              <Check size={14} />
                              <span>
                                {isCompleted ? t('chat.tasks.completed') : t('chat.tasks.markAsCompleted')}
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
  );
}


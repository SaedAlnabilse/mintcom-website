import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ChevronUp, ClipboardList, ExternalLink, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';

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
  navigation: TaskNavigation;
  estimateMinutes: number;
}

const STORAGE_KEY = 'paymint.widget.tasks.v1';

function readCompletedState(): Record<string, boolean> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, boolean>;
    }
  } catch {
    // Ignore invalid persisted data and start fresh.
  }

  return {};
}

export function TasksModal({ isOpen, onClose }: TasksModalProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const navigate = useNavigate();
  const location = useLocation();
  const [completedById, setCompletedById] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const dashboardSlug = useMemo(() => {
    const match = location.pathname.match(/^\/dashboard\/([^/]+)/);
    return match ? match[1] : null;
  }, [location.pathname]);

  const dashboardRoute = (suffix: string, fallback: string) =>
    dashboardSlug ? `/dashboard/${dashboardSlug}${suffix}` : fallback;

  const tasks = useMemo<TaskItem[]>(() => [
    {
      id: 'location-profile',
      title: t('chat.tasks.profile.title'),
      description: t('chat.tasks.profile.description'),
      actionLabel: t('chat.tasks.profile.action'),
      navigation: {
        path: dashboardRoute('/settings', '/onboarding/step/1'),
        state: { openSettingsTab: 'profile' }
      },
      estimateMinutes: 2
    },
    {
      id: 'receipt-settings',
      title: t('chat.tasks.receipt.title'),
      description: t('chat.tasks.receipt.description'),
      actionLabel: t('chat.tasks.receipt.action'),
      navigation: {
        path: dashboardRoute('/settings', '/onboarding/step/1'),
        state: { openSettingsTab: 'receipt' }
      },
      estimateMinutes: 2
    },
    {
      id: 'create-category',
      title: t('chat.tasks.categories.title'),
      description: t('chat.tasks.categories.description'),
      actionLabel: t('chat.tasks.categories.action'),
      navigation: {
        path: dashboardRoute('/categories', '/onboarding/step/1'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 2
    },
    {
      id: 'add-product',
      title: t('chat.tasks.products.title'),
      description: t('chat.tasks.products.description'),
      actionLabel: t('chat.tasks.products.action'),
      navigation: {
        path: dashboardRoute('/products', '/onboarding/step/1'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 2
    },
    {
      id: 'setup-payments',
      title: t('chat.tasks.payments.title'),
      description: t('chat.tasks.payments.description'),
      actionLabel: t('chat.tasks.payments.action'),
      navigation: {
        path: dashboardRoute('/payment-methods', '/onboarding/step/2'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 2
    },
    {
      id: 'setup-taxes',
      title: t('chat.tasks.taxes.title'),
      description: t('chat.tasks.taxes.description'),
      actionLabel: t('chat.tasks.taxes.action'),
      navigation: {
        path: dashboardRoute('/settings', '/onboarding/step/2'),
        state: { openSettingsTab: 'sales' }
      },
      estimateMinutes: 1
    },
    {
      id: 'add-staff',
      title: t('chat.tasks.staff.title'),
      description: t('chat.tasks.staff.description'),
      actionLabel: t('chat.tasks.staff.action'),
      navigation: {
        path: dashboardRoute('/staff', '/onboarding/step/4'),
        state: { openCreateModal: true }
      },
      estimateMinutes: 2
    },
    {
      id: 'go-live',
      title: t('chat.tasks.goLive.title'),
      description: t('chat.tasks.goLive.description'),
      actionLabel: t('chat.tasks.goLive.action'),
      navigation: { path: '/onboarding/step/5' },
      estimateMinutes: 3
    }
  ], [t, dashboardSlug]);

  useEffect(() => {
    setCompletedById(readCompletedState());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(completedById));
      window.dispatchEvent(new Event('paymint-tasks-updated'));
    } catch {
      // No-op if storage is unavailable.
    }
  }, [completedById]);

  useEffect(() => {
    if (!isOpen || tasks.length === 0) {
      return;
    }

    const firstPending = tasks.find((task) => !completedById[task.id]);
    setExpandedId(firstPending ? firstPending.id : tasks[0].id);
  }, [isOpen, tasks, completedById]);

  const completedCount = useMemo(
    () => tasks.filter((task) => completedById[task.id]).length,
    [tasks, completedById]
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
    setCompletedById((prev) => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleOpenTask = (navigation: TaskNavigation) => {
    navigate(navigation.path, navigation.state ? { state: navigation.state } : undefined);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          dir={isRTL ? 'rtl' : 'ltr'}
          className={`fixed bottom-[100px] ${isRTL ? 'left-[30px]' : 'right-[30px]'} z-[999999] w-[400px] max-w-[calc(100vw-60px)] h-[600px] max-h-[calc(100vh-150px)] bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl border border-gray-200/50 dark:border-white/10 flex flex-col overflow-hidden`}
        >
          <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#7CC39F]/10 text-[#7CC39F] flex items-center justify-center">
                <ClipboardList size={16} />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('chat.tasks.title')}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-colors"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
            <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.02] p-4">
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
                  className="h-full rounded-full bg-gradient-to-r from-[#7CC39F] to-[#5BA882] transition-all"
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
                          ? 'bg-[#7CC39F]/15 text-[#5BA882]'
                          : 'bg-[#7CC39F]/10 text-gray-700 dark:text-gray-200'
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
                              onClick={() => handleOpenTask(task.navigation)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7CC39F] to-[#5BA882] text-white font-bold text-sm shadow-sm hover:brightness-105 transition-all"
                            >
                              <span>{task.actionLabel}</span>
                              <ExternalLink size={14} />
                            </button>

                            <button
                              onClick={() => toggleComplete(task.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-colors ${
                                isCompleted
                                  ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                                  : 'text-[#7CC39F] hover:bg-[#7CC39F]/10'
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

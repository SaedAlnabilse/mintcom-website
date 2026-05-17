import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ArrowRightLeft, ShieldCheck, X } from 'lucide-react';
import { useScrollLock } from '../hooks/useScrollLock';

interface ReplacementRole {
  id: string;
  name: string;
}

interface RoleDeleteResolutionModalProps {
  isOpen: boolean;
  roleName: string;
  employeeCount?: number;
  assignmentCount?: number;
  locationCount?: number;
  replacementRoles: ReplacementRole[];
  isSubmitting?: boolean;
  onClose: () => void;
  onDetach: () => void | Promise<void>;
  onReassign: (replacementRoleId: string) => void | Promise<void>;
}

export function RoleDeleteResolutionModal({
  isOpen,
  roleName,
  employeeCount,
  assignmentCount,
  locationCount,
  replacementRoles,
  isSubmitting = false,
  onClose,
  onDetach,
  onReassign,
}: RoleDeleteResolutionModalProps) {
  const { t } = useTranslation();
  const [selectedReplacementId, setSelectedReplacementId] = useState('');

  useScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedReplacementId(replacementRoles[0]?.id || '');
  }, [isOpen, replacementRoles]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isSubmitting ? undefined : onClose}
            className="fixed inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
            className="relative z-10 w-full sm:max-w-lg overflow-hidden rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10"
          >
            <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500" />

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              aria-label={t('common.closeModal')}
              className="absolute top-4 right-4 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
            >
              <X size={20} />
            </button>

            <div className="p-6 sm:p-8 pb-safe">
              <div className="flex items-start gap-4 pr-12">
                <div className="mt-1 p-3 rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {t('roles.deleteResolution.title', {
                      defaultValue: 'Role is assigned to employees',
                    })}
                  </h3>
                  <p className="mt-2 text-sm font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t('roles.deleteResolution.message', {
                      defaultValue:
                        'Choose what happens to employees using "{{roleName}}" before deleting it.',
                      roleName,
                    })}
                  </p>
                  {(employeeCount || assignmentCount || locationCount) && (
                    <p className="mt-2 text-xs font-bold text-gray-400 dark:text-gray-500">
                      {t('roles.deleteResolution.summary', {
                        defaultValue:
                          '{{employeeCount}} employees, {{assignmentCount}} assignments, {{locationCount}} locations affected',
                        employeeCount: employeeCount || 0,
                        assignmentCount: assignmentCount || 0,
                        locationCount: locationCount || 0,
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={20} className="mt-0.5 text-mintcom-green shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white">
                        {t('roles.deleteResolution.detachTitle', {
                          defaultValue: 'Keep their current access',
                        })}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('roles.deleteResolution.detachDesc', {
                          defaultValue:
                            'Delete the role and keep each employee permissions exactly as they are.',
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onDetach}
                    disabled={isSubmitting}
                    className="mt-4 w-full rounded-xl bg-mintcom-green px-4 py-3 text-sm font-black text-black transition-all hover:bg-mintcom-green/90 disabled:opacity-60"
                  >
                    {isSubmitting
                      ? t('common.loading', { defaultValue: 'Loading...' })
                      : t('roles.deleteResolution.detachAction', {
                          defaultValue: 'Keep permissions and delete role',
                        })}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                  <div className="flex items-start gap-3">
                    <ArrowRightLeft size={20} className="mt-0.5 text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-gray-900 dark:text-white">
                        {t('roles.deleteResolution.reassignTitle', {
                          defaultValue: 'Move employees to another role',
                        })}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                        {t('roles.deleteResolution.reassignDesc', {
                          defaultValue:
                            'Employees will receive the selected role permissions immediately.',
                        })}
                      </p>
                    </div>
                  </div>

                  <select
                    value={selectedReplacementId}
                    onChange={(event) => setSelectedReplacementId(event.target.value)}
                    disabled={replacementRoles.length === 0 || isSubmitting}
                    className="mt-4 w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0F172A] px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green disabled:opacity-60"
                  >
                    {replacementRoles.length === 0 ? (
                      <option value="">
                        {t('roles.deleteResolution.noReplacement', {
                          defaultValue: 'No replacement roles available',
                        })}
                      </option>
                    ) : (
                      replacementRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={() => selectedReplacementId && onReassign(selectedReplacementId)}
                    disabled={!selectedReplacementId || isSubmitting}
                    className="mt-4 w-full rounded-xl border border-blue-500/30 bg-blue-500 px-4 py-3 text-sm font-black text-white transition-all hover:bg-blue-600 disabled:opacity-60"
                  >
                    {isSubmitting
                      ? t('common.loading', { defaultValue: 'Loading...' })
                      : t('roles.deleteResolution.reassignAction', {
                          defaultValue: 'Move employees and delete role',
                        })}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

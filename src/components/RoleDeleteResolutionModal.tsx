import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRightLeft, ShieldCheck } from 'lucide-react';
import { Modal, ModalBody, ModalCloseButton } from './ui';

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

  useEffect(() => {
    if (!isOpen) return;
    setSelectedReplacementId(replacementRoles[0]?.id || '');
  }, [isOpen, replacementRoles]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnBackdrop={!isSubmitting}>
      <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-500 z-10" />

      <ModalCloseButton onClose={onClose} disabled={isSubmitting} autoPositionAbsolute />

      <ModalBody>
        <div>
              <div className="flex items-start gap-4 pr-12">
                <div className="mt-1 p-3 rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900 dark:text-zinc-100 tracking-tight">
                    {t('roles.deleteResolution.title', {
                      defaultValue: 'Role is assigned to employees',
                    })}
                  </h3>
                  <p className="mt-2 text-sm font-bold text-stone-500 dark:text-zinc-400 leading-relaxed">
                    {t('roles.deleteResolution.message', {
                      defaultValue:
                        'Choose what happens to employees using "{{roleName}}" before deleting it.',
                      roleName,
                    })}
                  </p>
                  {(employeeCount || assignmentCount || locationCount) && (
                    <p className="mt-2 text-xs font-bold text-stone-400 dark:text-zinc-500">
                      {t('roles.deleteResolution.summary', {
                        defaultValue:
                          '{{employeeCount}} employees, {{assignmentCount}} assignments, {{locationCount}} establishments affected',
                        employeeCount: employeeCount || 0,
                        assignmentCount: assignmentCount || 0,
                        locationCount: locationCount || 0,
                      })}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800 p-4">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={20} className="mt-0.5 text-mintcom-green shrink-0" />
                    <div>
                      <h4 className="text-sm font-black text-stone-900 dark:text-zinc-100">
                        {t('roles.deleteResolution.detachTitle', {
                          defaultValue: 'Keep their current access',
                        })}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-stone-500 dark:text-zinc-400 leading-relaxed">
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

                <div className="rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-800 p-4">
                  <div className="flex items-start gap-3">
                    <ArrowRightLeft size={20} className="mt-0.5 text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-stone-900 dark:text-zinc-100">
                        {t('roles.deleteResolution.reassignTitle', {
                          defaultValue: 'Move employees to another role',
                        })}
                      </h4>
                      <p className="mt-1 text-xs font-bold text-stone-500 dark:text-zinc-400 leading-relaxed">
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
                    className="mt-4 w-full rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-bold text-stone-900 dark:text-zinc-100 outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green disabled:opacity-60"
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
                className="mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-60"
              >
                {t('common.cancel')}
              </button>
            </div>
      </ModalBody>
    </Modal>
  );
}

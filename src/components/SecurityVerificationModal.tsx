import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ShieldAlert,
    X,
    AlertTriangle,
    ShieldCheck,
    CreditCard,
    Building2,
    Trash2
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useScrollLock } from '../hooks/useScrollLock';
import { StepUpVerifier } from './StepUpVerifier';
import { reauthHeaders, type StepUpAction } from '../services/stepUp';

interface ApiError {
    response?: {
        data?: {
            message?: string;
            code?: string;
            allowedAction?: string;
        };
    };
}

export type SecurityMode =
    | 'cancel'
    | 'stop-trial'
    | 'delete-card'
    | 'dissolve-brand'
    | 'delete-employee'
    | 'delete-owner-employee'
    | 'revoke-brand-access'
    | 'delete-account'
    | 'dissolve-establishment'
    | 'reactivate'
    | 'delete-customer'
    | 'reactivate-account';

interface SecurityVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
    targetId: string;
    targetName: string;
    mode: SecurityMode;
    price?: number;
    currency?: string;
    isResuming?: boolean;
    onError?: (error: ApiError) => boolean | void;
    /**
     * Extra fields for the destructive request body (e.g. a deletion reason,
     * or the brand id that `revoke-brand-access` needs in its URL).
     */
    extraBody?: Record<string, unknown>;
    /** Second path segment for routes addressing two records. */
    parentId?: string;
}

/**
 * Confirmation gate for high-impact actions.
 *
 * This used to demand the account password. Owners who signed up with Google or
 * Apple never chose one, so for them every gated action was a dead end.
 * {@link StepUpVerifier} now asks the server which proofs the account can
 * actually produce and offers only those.
 */
export function SecurityVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    targetId,
    targetName,
    mode,
    price,
    currency,
    isResuming,
    onError,
    extraBody,
    parentId
}: SecurityVerificationModalProps) {
    const { t } = useTranslation();
    const [error, setError] = useState('');
    const errorBannerRef = useRef<HTMLDivElement>(null);

    useScrollLock(isOpen);

    useEffect(() => {
        if (!isOpen) setError('');
    }, [isOpen]);

    const showError = useCallback((message: string) => {
        setError(message);
        setTimeout(() => {
            errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }, []);

    const getModeConfig = () => {
        switch (mode) {
            case 'delete-customer':
                return {
                    title: t('security.modes.deleteCustomer.title'),
                    warning: t('security.modes.deleteCustomer.warning', { name: targetName }),
                    buttonText: t('security.modes.deleteCustomer.button'),
                    icon: ShieldAlert,
                    color: 'text-mintcom-red',
                    bg: 'bg-mintcom-red/10',
                    endpoint: `/api/customers/${targetId}`,
                    method: 'delete' as const,
                    action: 'delete-customer' as StepUpAction
                };
            case 'cancel':
                return {
                    title: t('security.modes.cancel.title'),
                    warning: t('security.modes.cancel.warning', { name: targetName }),
                    buttonText: t('security.modes.cancel.button'),
                    icon: ShieldAlert,
                    color: 'text-mintcom-red',
                    bg: 'bg-mintcom-red/10',
                    endpoint: `/api/accounts/subscriptions/${targetId}/cancel`,
                    method: 'post' as const,
                    action: 'cancel-subscription' as StepUpAction
                };
            case 'stop-trial':
                return {
                    title: t('security.modes.stopTrial.title'),
                    warning: t('security.modes.stopTrial.warning', { name: targetName }),
                    buttonText: t('security.modes.stopTrial.button'),
                    icon: AlertTriangle,
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10',
                    endpoint: `/api/accounts/subscriptions/${targetId}/stop-trial`,
                    method: 'post' as const,
                    action: 'stop-trial' as StepUpAction
                };
            case 'delete-card':
                return {
                    title: t('security.modes.deleteCard.title'),
                    warning: t('security.modes.deleteCard.warning', { name: targetName }),
                    buttonText: t('security.modes.deleteCard.button'),
                    icon: CreditCard,
                    color: 'text-mintcom-red',
                    bg: 'bg-mintcom-red/10',
                    endpoint: `/api/accounts/cards/${targetId}`,
                    method: 'delete' as const,
                    action: 'delete-card' as StepUpAction
                };
            case 'dissolve-brand':
                return {
                    title: t('security.modes.dissolveBrand.title'),
                    warning: t('security.modes.dissolveBrand.warning', { name: targetName }),
                    buttonText: t('security.modes.dissolveBrand.button'),
                    icon: Building2,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/10',
                    endpoint: `/api/brands/${targetId}/dissolve`,
                    method: 'delete' as const,
                    action: 'dissolve-brand' as StepUpAction
                };
            case 'delete-employee':
                return {
                    title: t('security.modes.deleteEmployee.title'),
                    warning: t('security.modes.deleteEmployee.warning', { name: targetName }),
                    buttonText: t('security.modes.deleteEmployee.button'),
                    icon: ShieldAlert,
                    color: 'text-mintcom-red',
                    bg: 'bg-mintcom-red/10',
                    endpoint: `/api/users/${targetId}`,
                    method: 'delete' as const,
                    action: 'delete-staff' as StepUpAction
                };
            case 'delete-owner-employee':
                return {
                    title: t('security.modes.deleteEmployee.title'),
                    warning: t('security.modes.deleteEmployee.warning', { name: targetName }),
                    buttonText: t('security.modes.deleteEmployee.button'),
                    icon: ShieldAlert,
                    color: 'text-mintcom-red',
                    bg: 'bg-mintcom-red/10',
                    endpoint: `/api/accounts/employees/${targetId}`,
                    method: 'delete' as const,
                    action: 'delete-account-employee' as StepUpAction
                };
            case 'revoke-brand-access':
                return {
                    title: t('security.modes.revokeBrandAccess.title', 'Remove Brand Access'),
                    warning: t('security.modes.revokeBrandAccess.warning', {
                        name: targetName,
                        defaultValue: '{{name}} will lose access to every location in this brand.'
                    }),
                    buttonText: t('security.modes.revokeBrandAccess.button', 'Remove access'),
                    icon: ShieldAlert,
                    color: 'text-mintcom-red',
                    bg: 'bg-mintcom-red/10',
                    endpoint: `/api/brands/${parentId}/employees/${targetId}/brand-access`,
                    method: 'delete' as const,
                    action: 'revoke-brand-access' as StepUpAction
                };
            case 'delete-account':
                return {
                    title: t('security.modes.deleteAccount.title', 'Delete Account'),
                    warning: t('security.modes.deleteAccount.warning', {
                        defaultValue:
                            'Your account will be locked immediately and permanently deleted after 30 days.'
                    }),
                    buttonText: t('security.modes.deleteAccount.button', 'Delete my account'),
                    icon: Trash2,
                    color: 'text-mintcom-red',
                    bg: 'bg-mintcom-red/10',
                    endpoint: `/api/accounts/me`,
                    method: 'delete' as const,
                    action: 'delete-account' as StepUpAction
                };
            case 'dissolve-establishment':
                return {
                    title: t('security.modes.dissolveEstablishment.title'),
                    warning: t('security.modes.dissolveEstablishment.warning', { name: targetName }),
                    buttonText: t('security.modes.dissolveEstablishment.button'),
                    icon: Building2,
                    color: 'text-mintcom-red',
                    bg: 'bg-mintcom-red/10',
                    endpoint: `/api/establishments/${targetId}/dissolve`,
                    method: 'delete' as const,
                    action: 'dissolve-establishment' as StepUpAction
                };
            case 'reactivate':
                return {
                    title: t('security.modes.reactivate.title'),
                    warning: isResuming
                        ? t('security.modes.reactivate.warningResume')
                        : t('security.modes.reactivate.warningRestart', {
                              name: targetName,
                              price: price?.toFixed(2) || '20.00',
                              currency: currency || 'USD',
                          }),
                    buttonText: t('security.modes.reactivate.button'),
                    icon: ShieldCheck,
                    color: 'text-mintcom-green',
                    bg: 'bg-mintcom-green/10',
                    endpoint: `/api/accounts/subscriptions/${targetId}/resume`,
                    method: 'post' as const,
                    action: 'resume-subscription' as StepUpAction
                };
            case 'reactivate-account':
                return {
                    title: t('security.modes.reactivateAccount.title'),
                    warning: t('security.modes.reactivateAccount.warning'),
                    buttonText: t('security.modes.reactivateAccount.button'),
                    icon: ShieldCheck,
                    color: 'text-mintcom-green',
                    bg: 'bg-mintcom-green/10',
                    endpoint: `/api/accounts/me/restore`,
                    method: 'post' as const,
                    action: 'restore-account' as StepUpAction
                };
            default:
                throw new Error('Invalid mode');
        }
    };

    const config = getModeConfig();

    // Account-level actions have no target record; the server scopes those
    // proofs to the account itself.
    const stepUpTargetId =
        mode === 'reactivate-account' || mode === 'delete-account' ? undefined : targetId;

    /** Spend the verified proof on the destructive request itself. */
    const runAction = useCallback(
        async (reauthToken: string) => {
            try {
                const headers = reauthHeaders(reauthToken);
                const body = extraBody ?? {};
                const res =
                    config.method === 'post'
                        ? await api.post(config.endpoint, body, { headers })
                        : await api.delete(config.endpoint, { headers, data: body });

                await onSuccess();
                toast.success(res.data?.message || t('common.done'));
                onClose();
            } catch (err) {
                const apiError = err as ApiError;
                if (onError?.(apiError)) return;
                showError(apiError.response?.data?.message || t('security.verificationFailed'));
            }
        },
        [config.endpoint, config.method, extraBody, onClose, onError, onSuccess, showError, t]
    );

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div
                    dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                    className="fixed inset-0 z-[9999] popup-surface flex items-center justify-center p-4 font-sans selection:bg-mintcom-green selection:text-black"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                        className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-300 shadow-2xl shadow-black/20"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-start justify-between bg-gray-50/50 dark:bg-black/20">
                            <div className="flex items-center gap-5">
                                <div
                                    className={`w-14 h-14 rounded-xl ${config.bg} flex items-center justify-center ${config.color} shadow-sm`}
                                >
                                    {React.createElement(config.icon, { size: 28 })}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                                        {config.title}
                                    </h2>
                                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                        {t('security.highImpact')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                aria-label={t('common.close', { defaultValue: 'Close' })}
                                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-8 py-8 custom-scrollbar flex-1 pb-safe space-y-6">
                            <AnimatePresence>
                                {!!error && (
                                    <motion.div
                                        ref={errorBannerRef}
                                        role="alert"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="p-4 rounded-xl bg-mintcom-red/10 border border-mintcom-red/20 flex items-center gap-3.5"
                                    >
                                        <ShieldAlert className="text-mintcom-red shrink-0" size={20} />
                                        <p className="text-[13px] font-black text-mintcom-red">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Warning Box */}
                            <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 shadow-sm">
                                <div className="flex gap-4">
                                    <AlertTriangle
                                        className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5"
                                        size={20}
                                    />
                                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                        {config.warning}
                                    </p>
                                </div>
                            </div>

                            <StepUpVerifier
                                action={config.action}
                                targetId={stepUpTargetId}
                                onVerified={runAction}
                                onError={showError}
                                submitLabel={config.buttonText}
                                tone={config.color === 'text-mintcom-red' ? 'danger' : 'primary'}
                            />
                        </div>

                        {/* Footer */}
                        <div className="px-8 pt-6 pb-10 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 sticky bottom-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full py-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] font-black text-gray-500 tracking-[0.15em] uppercase hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
                            >
                                {t('common.cancel')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

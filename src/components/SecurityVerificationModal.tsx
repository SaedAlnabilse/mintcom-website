import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
    ShieldAlert,
    X,
    Mail,
    Lock,
    Loader2,
    AlertTriangle,
    ShieldCheck,
    CreditCard,
    Building2,
    Eye,
    EyeOff
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useScrollLock } from '../hooks/useScrollLock';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface SecurityVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    targetId: string;
    targetName: string;
    mode: 'cancel' | 'stop-trial' | 'delete-card' | 'dissolve-brand' | 'delete-employee' | 'dissolve-establishment' | 'reactivate' | 'delete-customer';
}

export function SecurityVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    targetId,
    targetName,
    mode
}: SecurityVerificationModalProps) {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const errorBannerRef = useRef<HTMLDivElement>(null);

    useScrollLock(isOpen);

    const getModeConfig = () => {
        switch (mode) {
            case 'delete-customer':
                return {
                    title: t('security.modes.deleteCustomer.title'),
                    warning: t('security.modes.deleteCustomer.warning', { name: targetName }),
                    buttonText: t('security.modes.deleteCustomer.button'),
                    icon: ShieldAlert,
                    color: 'text-paymint-red',
                    bg: 'bg-paymint-red/10',
                    endpoint: `/api/customers/${targetId}`,
                    method: 'delete'
                };
            case 'cancel':
                return {
                    title: t('security.modes.cancel.title'),
                    warning: t('security.modes.cancel.warning', { name: targetName }),
                    buttonText: t('security.modes.cancel.button'),
                    icon: ShieldAlert,
                    color: 'text-paymint-red',
                    bg: 'bg-paymint-red/10',
                    endpoint: `/api/accounts/subscriptions/${targetId}/cancel`,
                    method: 'post'
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
                    method: 'post'
                };
            case 'delete-card':
                return {
                    title: t('security.modes.deleteCard.title'),
                    warning: t('security.modes.deleteCard.warning', { name: targetName }),
                    buttonText: t('security.modes.deleteCard.button'),
                    icon: CreditCard,
                    color: 'text-paymint-red',
                    bg: 'bg-paymint-red/10',
                    endpoint: `/api/accounts/cards/${targetId}`,
                    method: 'delete'
                };
            case 'dissolve-brand':
                return {
                    title: t('security.modes.dissolveBrand.title'),
                    warning: t('security.modes.dissolveBrand.warning', { name: targetName }),
                    buttonText: t('security.modes.dissolveBrand.button'),
                    icon: Building2,
                    color: 'text-purple-500',
                    bg: 'bg-purple-500/10',
                    endpoint: `/api/brands/${targetId}/dissolve`,
                    method: 'delete'
                };
            case 'delete-employee':
                return {
                    title: t('security.modes.deleteEmployee.title'),
                    warning: t('security.modes.deleteEmployee.warning', { name: targetName }),
                    buttonText: t('security.modes.deleteEmployee.button'),
                    icon: ShieldAlert,
                    color: 'text-paymint-red',
                    bg: 'bg-paymint-red/10',
                    endpoint: `/api/users/${targetId}`,
                    method: 'delete'
                };
            case 'dissolve-establishment':
                return {
                    title: t('security.modes.dissolveEstablishment.title'),
                    warning: t('security.modes.dissolveEstablishment.warning', { name: targetName }),
                    buttonText: t('security.modes.dissolveEstablishment.button'),
                    icon: Building2,
                    color: 'text-paymint-red',
                    bg: 'bg-paymint-red/10',
                    endpoint: `/api/establishments/${targetId}/dissolve`,
                    method: 'delete'
                };
            case 'reactivate':
                return {
                    title: t('security.modes.reactivate.title'),
                    warning: t('security.modes.reactivate.warning', { name: targetName }),
                    buttonText: t('security.modes.reactivate.button'),
                    icon: ShieldCheck,
                    color: 'text-paymint-green',
                    bg: 'bg-paymint-green/10',
                    endpoint: `/api/accounts/subscriptions/${targetId}/resume`,
                    method: 'post'
                };
            default:
                throw new Error('Invalid mode');
        }
    };

    const config = getModeConfig();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!email) newErrors.email = t('common.emailRequired');
        if (!password) newErrors.password = t('common.passwordRequired');

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setTimeout(() => {
                errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        try {
            setIsSubmitting(true);
            setErrors({});
            const res = await (config.method === 'post'
                ? api.post(
                    config.endpoint,
                    { email, password },
                    { headers: { 'X-Skip-Auth-Redirect': 'true' } },
                )
                : api.delete(config.endpoint, {
                    data: { email, password },
                    headers: { 'X-Skip-Auth-Redirect': 'true' },
                }));

            toast.success(res.data.message || t('common.done'));
            onSuccess();
            onClose();
            setEmail('');
            setPassword('');
        } catch (err) {
            const msg = (err as ApiError).response?.data?.message || t('security.verificationFailed');
            setErrors({ general: msg });
            setTimeout(() => {
                errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                    className="fixed inset-0 z-[9999] popup-surface flex items-center justify-center p-4 font-sans"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden z-10"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-white/5 relative bg-gray-50/50 dark:bg-white/[0.02]">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-black text-paymint-green tracking-widest">{t('security.highImpact')}</span>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                                        {config.title}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 mt-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500">
                                <AlertTriangle size={20} className="shrink-0" />
                                <p className="text-sm font-bold text-gray-500 leading-6">
                                    {config.warning}
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Error Banner */}
                            {Object.keys(errors).length > 0 && (
                                <div ref={errorBannerRef} className="p-4 rounded-xl bg-paymint-red/5 dark:bg-paymint-red/10 border border-paymint-red/20 text-paymint-red text-sm font-bold flex items-center gap-2 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-paymint-red flex-shrink-0" />
                                    {t('security.errorBanner')}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 tracking-widest block ml-1">{t('security.identityLabel')}</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-paymint-green opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (errors.email) setErrors({ ...errors, email: '' });
                                            }}
                                            placeholder={t('auth.login.emailPlaceholder')}
                                            className={`w-full bg-gray-50 dark:bg-white/[0.03] border ${errors.email ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-paymint-green/10 transition-all placeholder-gray-300 dark:placeholder-gray-700`}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    {errors.email && <p className="ml-1 text-xs font-black text-paymint-red tracking-wide">{errors.email}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-400 tracking-widest block ml-1">{t('security.passwordLabel')}</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-paymint-green opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => {
                                                setPassword(e.target.value);
                                                if (errors.password) setErrors({ ...errors, password: '' });
                                            }}
                                            placeholder="********"
                                            className={`w-full bg-gray-50 dark:bg-white/[0.03] border ${errors.password ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl py-3 pl-12 pr-10 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-paymint-green/10 transition-all placeholder-gray-300 dark:placeholder-gray-700`}
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="ml-1 text-xs font-black text-paymint-red tracking-wide">{errors.password}</p>}
                                </div>

                                {/* Master Key Info Box */}
                                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-start gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                        <span className="text-[10px] font-black">i</span>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-black text-blue-700 dark:text-blue-400 tracking-wider">
                                            {t('security.masterKeyInfo.title', 'What Is a Master Access Key?')}
                                        </p>
                                        <p className="text-[11px] leading-relaxed font-bold text-blue-600/80 dark:text-blue-400/70">
                                            {t('security.masterKeyInfo.description', 'This is your primary account password. You can reset it from your account management if you have forgotten it.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 font-black text-xs tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                    disabled={isSubmitting}
                                >
                                    {t('security.dismiss')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-black text-xs tracking-[0.2em] transition-all shadow-xl disabled:opacity-50 disabled:scale-95 ${config.color === 'text-paymint-red' ? 'bg-paymint-red text-white shadow-paymint-red/20' : 'bg-paymint-green text-black shadow-paymint-green/20'}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>{t('security.verifying')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>{config.buttonText}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-xs font-black text-gray-400 tracking-widest text-center mt-4 flex items-center justify-center gap-2">
                                <span className="text-xs font-black text-paymint-green tracking-widest">{t('security.encrypted')}</span>
                            </p>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}


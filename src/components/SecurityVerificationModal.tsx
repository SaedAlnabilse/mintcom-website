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
    EyeOff,
    Trash2
} from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { QuickInfo } from './QuickInfo';
import { PasswordResetOtpModal } from './PasswordResetOtpModal';

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
    const { account } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Check if user has a local password (Google users might not)
    const hasPassword = account?.hasPassword !== false;

    const [errors, setErrors] = useState<Record<string, string>>({});
    const errorBannerRef = useRef<HTMLDivElement>(null);

    // Modal state for creating password if missing
    const [showCreatePassword, setShowCreatePassword] = useState(false);

    useScrollLock(isOpen);

    // Auto-populate email if available
    React.useEffect(() => {
        if (isOpen && account?.email) {
            setEmail(account.email);
        }
    }, [isOpen, account]);

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

    // Handle "No Password" state (e.g. for Google users)
    if (!hasPassword) {
        return createPortal(
            <AnimatePresence>
                {isOpen && (
                    <div
                        dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                        className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
                    >
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm"
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col p-8 text-center"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-6">
                                <ShieldAlert size={40} />
                            </div>
                            
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {t('security.noMasterKeyTitle', 'Master Access Key Required')}
                            </h3>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                                {t('security.noMasterKeyDesc', 'To perform high-impact actions, you must first create a Master Access Key for your account.')}
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => setShowCreatePassword(true)}
                                    className="w-full py-4 bg-paymint-green text-black rounded-2xl text-sm font-black shadow-lg shadow-paymint-green/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Lock size={18} strokeWidth={3} />
                                    {t('security.createMasterKey', 'Create Master Access Key')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 font-bold rounded-2xl text-sm transition-all hover:bg-gray-200 dark:hover:bg-white/10"
                                >
                                    {t('common.cancel')}
                                </button>
                            </div>

                            <PasswordResetOtpModal
                                isOpen={showCreatePassword}
                                onClose={() => setShowCreatePassword(false)}
                                onSuccess={() => {
                                    setShowCreatePassword(false);
                                    window.location.reload(); 
                                }}
                                type="account"
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>,
            document.body
        );
    }

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                    className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans selection:bg-paymint-green selection:text-black"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] transition-colors duration-300"
                    >
                        {/* Mobile drag handle */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="px-6 sm:px-8 py-3 sm:py-4 border-b border-gray-100 dark:border-white/5 flex items-start justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-2xl ${config.bg} flex items-center justify-center ${config.color} shadow-sm`}>
                                    {React.createElement(config.icon, { size: 22 })}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                                        {config.title}
                                    </h2>
                                    <p className="text-[10px] font-medium text-gray-500 mt-0.5">
                                        {t('security.highImpact')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-6 sm:px-8 py-6 custom-scrollbar flex-1 pb-safe">
                            <form id="security-verify-form" onSubmit={handleSubmit} className="space-y-6">
                                {/* Error Banner */}
                                <AnimatePresence>
                                    {Object.keys(errors).length > 0 && (
                                        <motion.div
                                            ref={errorBannerRef}
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center gap-3"
                                        >
                                            <ShieldAlert className="text-red-500 shrink-0" size={18} />
                                            <p className="text-xs font-bold text-red-600 dark:text-red-400">
                                                {t('security.errorBanner')}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Warning Box */}
                                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20">
                                    <div className="flex gap-3">
                                        <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0" size={18} />
                                        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed">
                                            {config.warning}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    {/* Account Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase px-1 block">
                                            {t('security.identityLabel')}
                                        </label>
                                        <div className="relative group">
                                            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.email || errors.general?.toLowerCase().includes('email') ? 'text-paymint-red' : 'text-gray-400 group-focus-within:text-paymint-green'} transition-colors`} size={16} />
                                            <input maxLength={255}
                                                type="email"
                                                value={email}
                                                onChange={(e) => {
                                                    setEmail(e.target.value);
                                                    if (errors.email || errors.general) setErrors({});
                                                }}
                                                placeholder={t('auth.login.emailPlaceholder')}
                                                className={`w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-black/20 border ${errors.email || errors.general?.toLowerCase().includes('email') ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/5'} rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/30 transition-all`}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        {(errors.email || (errors.general && errors.general.toLowerCase().includes('email'))) && (
                                            <p className="ml-1 text-[10px] font-bold text-paymint-red flex items-center gap-1">
                                                <X size={10} strokeWidth={3} />
                                                {errors.email || errors.general}
                                            </p>
                                        )}
                                    </div>

                                    {/* Password Input */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 px-1">
                                            <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase block">
                                                {t('security.passwordLabel')}
                                            </label>
                                            <QuickInfo text={t('security.masterKeyInfo.description')} />
                                        </div>
                                        <div className="relative group">
                                            <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.password || (errors.general && !errors.general.toLowerCase().includes('email')) ? 'text-paymint-red' : 'text-gray-400 group-focus-within:text-paymint-green'} transition-colors`} size={16} />
                                            <input maxLength={255}
                                                type={showPassword ? 'text' : 'password'}
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    if (errors.password || (errors.general && !errors.general.toLowerCase().includes('email'))) setErrors({});
                                                }}
                                                required
                                                autoFocus
                                                className={`w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-black/20 border ${errors.password || (errors.general && !errors.general.toLowerCase().includes('email')) ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/30 transition-all`}
                                                placeholder="********"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                        {(errors.password || (errors.general && !errors.general.toLowerCase().includes('email'))) && (
                                            <p className="ml-1 text-[10px] font-bold text-paymint-red flex items-center gap-1">
                                                <X size={10} strokeWidth={3} />
                                                {errors.password || errors.general}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Master Key Info Box */}
                                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-start gap-3">
                                        <div className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                            <span className="text-[9px] font-black">i</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[10px] font-black text-blue-700 dark:text-blue-400 tracking-wider">
                                                {t('security.masterKeyInfo.title', 'What Is a Master Access Key?')}
                                            </p>
                                            <p className="text-[10px] leading-relaxed font-bold text-blue-600/80 dark:text-blue-400/70">
                                                {t('security.masterKeyInfo.description', 'This is your primary account password. You can reset it from your account management if you have forgotten it.')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-5 sm:p-6 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 bg-gray-50/50 dark:bg-black/20 sticky bottom-0 pb-safe">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                form="security-verify-form"
                                disabled={isSubmitting || !password}
                                className={`flex-[2] px-4 py-3.5 rounded-xl text-white font-bold text-xs hover:brightness-110 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${config.color === 'text-paymint-red' ? 'bg-paymint-red shadow-red-500/20' : 'bg-paymint-green text-black shadow-paymint-green/20'}`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="animate-spin" size={16} />
                                ) : (
                                    <>
                                        <Trash2 size={16} />
                                        {config.buttonText}
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

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
import { useAuth } from '../context/AuthContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { QuickInfo } from './QuickInfo';
import { PasswordResetOtpModal } from './PasswordResetOtpModal';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

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
    mode: 'cancel' | 'stop-trial' | 'delete-card' | 'dissolve-brand' | 'delete-employee' | 'dissolve-establishment' | 'reactivate' | 'delete-customer' | 'reactivate-account';
    price?: number;
    isResuming?: boolean;
}

export function SecurityVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    targetId,
    targetName,
    mode,
    price,
    isResuming
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
                    warning: isResuming 
                        ? t('security.modes.reactivate.warningResume') 
                        : t('security.modes.reactivate.warningRestart', { name: targetName, price: price?.toFixed(2) || '20.00' }),
                    buttonText: t('security.modes.reactivate.button'),
                    icon: ShieldCheck,
                    color: 'text-paymint-green',
                    bg: 'bg-paymint-green/10',
                    endpoint: `/api/accounts/subscriptions/${targetId}/resume`,
                    method: 'post'
                };
            case 'reactivate-account':
                return {
                    title: t('security.modes.reactivateAccount.title'),
                    warning: t('security.modes.reactivateAccount.warning'),
                    buttonText: t('security.modes.reactivateAccount.button'),
                    icon: ShieldCheck,
                    color: 'text-paymint-green',
                    bg: 'bg-paymint-green/10',
                    endpoint: `/api/accounts/me/restore`,
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

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div
                    dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                    className="fixed inset-0 z-[9999] popup-surface flex items-center justify-center p-4 font-sans selection:bg-paymint-green selection:text-black"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm"
                    />

                    {!hasPassword ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col p-8 text-center z-10"
                        >
                            <div className="w-20 h-20 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto mb-6">
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
                                    className="w-full py-4 bg-paymint-green text-black rounded-xl text-sm font-black shadow-lg shadow-paymint-green/20 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Lock size={18} strokeWidth={3} />
                                    {t('security.createMasterKey', 'Create Master Access Key')}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-500 font-bold rounded-xl text-sm transition-all hover:bg-gray-200 dark:hover:bg-white/10"
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
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                            className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/5 overflow-hidden flex flex-col max-h-[92vh] transition-colors duration-300 shadow-2xl shadow-black/20"
                        >
                            {/* Header */}
                            <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex items-start justify-between bg-gray-50/50 dark:bg-black/20">
                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-xl ${config.bg} flex items-center justify-center ${config.color} shadow-sm`}>
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
                                    className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all active:scale-90"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            <div className="overflow-y-auto px-8 py-8 custom-scrollbar flex-1 pb-safe">
                                <form id="security-verify-form" onSubmit={handleSubmit} className="space-y-8">
                                    {/* Error Banner */}
                                    <AnimatePresence>
                                        {Object.keys(errors).length > 0 && (
                                            <motion.div
                                                ref={errorBannerRef}
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="p-4 rounded-xl bg-paymint-red/10 border border-paymint-red/20 flex items-center gap-3.5"
                                            >
                                                <ShieldAlert className="text-paymint-red shrink-0" size={20} />
                                                <p className="text-[13px] font-black text-paymint-red">
                                                    {errors.general || t('security.errorBanner')}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Warning Box */}
                                    <div className="p-5 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-500/20 shadow-sm">
                                        <div className="flex gap-4">
                                            <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={20} />
                                            <p className="text-sm font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                                {config.warning}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {/* Account Email */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-normal text-gray-400 tracking-[0.2em]  px-1 block">
                                                {formatInputLabel(t('security.identityLabel'), t('common.locale'))}
                                            </label>
                                            <div className="relative group">
                                                <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 ${errors.email || errors.general?.toLowerCase().includes('email') ? 'text-paymint-red' : 'text-gray-400 group-focus-within:text-paymint-green'} transition-colors`} size={18} />
                                                <input maxLength={255}
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => {
                                                        setEmail(e.target.value);
                                                        if (errors.email || errors.general) setErrors({});
                                                    }}
                                                    placeholder={formatInputPlaceholder(t('auth.login.emailPlaceholder'), t('common.locale'))}
                                                    className={`w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-black/20 border ${errors.email || errors.general?.toLowerCase().includes('email') ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/5'} rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/30 transition-all shadow-sm`}
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            {(errors.email || (errors.general && errors.general.toLowerCase().includes('email'))) && (
                                                <p className="px-1 text-[11px] font-black text-paymint-red flex items-center gap-1.5 animate-pulse">
                                                    <X size={12} strokeWidth={3} />
                                                    {errors.email || errors.general}
                                                </p>
                                            )}
                                        </div>

                                        {/* Password Section */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 px-1">
                                                    <label className="text-[10px] font-normal text-gray-400 tracking-[0.2em]  block">
                                                        {formatInputLabel(t('security.passwordLabel'), t('common.locale'))}
                                                    </label>
                                                    <QuickInfo text={t('security.masterKeyInfo.description')} />
                                                </div>
                                                <div className="relative group">
                                                    <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 ${errors.password || (errors.general && !errors.general.toLowerCase().includes('email')) ? 'text-paymint-red' : 'text-gray-400 group-focus-within:text-paymint-green'} transition-colors`} size={18} />
                                                    <input maxLength={255}
                                                        type={showPassword ? 'text' : 'password'}
                                                        value={password}
                                                        onChange={(e) => {
                                                            setPassword(e.target.value);
                                                            if (errors.password || (errors.general && !errors.general.toLowerCase().includes('email'))) setErrors({});
                                                        }}
                                                        required
                                                        autoFocus
                                                        disabled={isSubmitting}
                                                        className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-black/20 border ${errors.password || (errors.general && !errors.general.toLowerCase().includes('email')) ? 'border-paymint-red ring-2 ring-paymint-red/20' : 'border-gray-200 dark:border-white/10'} rounded-xl text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/30 transition-all shadow-sm`}
                                                        placeholder={formatInputPlaceholder("********", t('common.locale'))}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        disabled={isSubmitting}
                                                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    >
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                {(errors.password || (errors.general && !errors.general.toLowerCase().includes('email'))) && (
                                                    <p className="px-1 text-[11px] font-black text-paymint-red flex items-center gap-1.5 animate-pulse">
                                                        <X size={12} strokeWidth={3} />
                                                        {errors.password || errors.general}
                                                    </p>
                                                )}
                                            </div>
                                            
                                            {/* Master Key Info Box */}
                                            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-500/10 border border-blue-100/50 dark:border-blue-500/20 flex items-start gap-4">
                                                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                                    <span className="text-[10px] font-black">i</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[11px] font-black text-blue-700 dark:text-blue-400 tracking-wider uppercase">
                                                        {t('security.masterKeyInfo.title', 'What Is a Master Access Key?')}
                                                    </p>
                                                    <p className="text-[13px] leading-relaxed font-bold text-blue-600/80 dark:text-blue-400/70">
                                                        {t('security.masterKeyInfo.description', 'This is your primary account password. You can reset it from your account management if you have forgotten it.')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="px-8 pt-6 pb-10 border-t border-gray-100 dark:border-white/5 flex items-center gap-5 bg-gray-50/50 dark:bg-black/20 sticky bottom-0">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={isSubmitting}
                                    className="flex-1 py-4 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] font-black text-gray-500 tracking-[0.15em] uppercase hover:text-gray-900 dark:hover:text-white transition-all shadow-sm active:scale-95"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    form="security-verify-form"
                                    disabled={isSubmitting || !password}
                                    className={`flex-[1.5] py-4 rounded-xl text-white font-black text-[11px] tracking-[0.15em] uppercase hover:brightness-110 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 active:scale-95 ${config.color === 'text-paymint-red' ? 'bg-paymint-red shadow-paymint-red/20' : 'bg-paymint-green text-black shadow-paymint-green/20'}`}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="animate-spin" size={20} strokeWidth={3} />
                                    ) : (
                                        <>
                                            <ShieldCheck size={20} strokeWidth={2.5} />
                                            {config.buttonText}
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}

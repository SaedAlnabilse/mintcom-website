import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Shield, Key, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useScrollLock } from '../hooks/useScrollLock';
import { useTranslation } from 'react-i18next';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

interface PasswordResetOtpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    type: 'account' | 'establishment' | 'brand';
    targetId?: string;
    targetName?: string;
}

type Step = 'request' | 'verify' | 'newPassword' | 'success';

export function PasswordResetOtpModal({
    isOpen,
    onClose,
    onSuccess,
    type,
    targetId,
    targetName,
}: PasswordResetOtpModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('request');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [maskedEmail, setMaskedEmail] = useState('');
    const [error, setError] = useState('');

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const errorRef = useRef<HTMLDivElement>(null);

    useScrollLock(isOpen);

    useEffect(() => {
        if (isOpen) {
            setStep('request');
            setOtp(['', '', '', '', '', '']);
            setNewPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error]);

    const title = useMemo(() => {
        switch (type) {
            case 'account':
                return t('passwordReset.title.account');
            case 'establishment':
                return t('passwordReset.title.establishment', { name: targetName });
            case 'brand':
                return t('passwordReset.title.brand', { name: targetName });
            default:
                return t('passwordReset.title.default');
        }
    }, [type, targetName, t]);

    const handleRequestOtp = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/api/accounts/request-password-otp');
            setMaskedEmail(response.data.email);
            setStep('verify');
            toast.success(t('passwordReset.messages.codeSent'));
        } catch (err) {
            const error = err as ApiError;
            const msg = error.response?.data?.message || t('passwordReset.messages.failedToSend');
            setError(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            value = value.slice(-1);
        }

        const newOtp = [...otp];
        newOtp[index] = value.toUpperCase();
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleVerifyOtp = async () => {
        const otpString = otp.join('');
        if (otpString.length !== 6) {
            setError(t('passwordReset.messages.enterFullCode'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post('/api/accounts/verify-password-otp', { otp: otpString });
            setStep('newPassword');
            toast.success(t('passwordReset.messages.codeVerified'));
        } catch (err) {
            const error = err as ApiError;
            setError(error.response?.data?.message || t('passwordReset.messages.invalidCode'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setError(t('auth.validation.passwordsDoNotMatch'));
            return;
        }

        if (newPassword.length < 8) {
            setError(t('auth.validation.passwordMin'));
            return;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            setError(t('auth.validation.passwordNumber'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const otpString = otp.join('');

            if (type === 'account') {
                await api.post('/api/accounts/reset-password-otp', {
                    otp: otpString,
                    newPassword,
                });
            } else if (type === 'establishment') {
                await api.post(`/api/accounts/reset-establishment-password/${targetId}`, {
                    newPassword,
                });
            } else if (type === 'brand') {
                await api.post(`/api/accounts/reset-brand-password/${targetId}`, {
                    newPassword,
                });
            }

            setStep('success');
            toast.success(t('passwordReset.messages.passwordReset'));
        } catch (err) {
            const error = err as ApiError;
            setError(error.response?.data?.message || t('passwordReset.messages.failedToReset'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (step === 'success') {
            onSuccess();
        }
        onClose();
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 font-sans"
                onClick={handleClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-[#111111] rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-white/[0.05] overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/[0.05]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-paymint-green/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-paymint-green" />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                {title}
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-500 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {/* Step 1: Request Otp */}
                        {step === 'request' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {t('passwordReset.steps.verifyTitle')}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-500">
                                        {t('passwordReset.steps.verifyDesc')}
                                    </p>
                                </div>

                                {error && (
                                    <div ref={errorRef} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleRequestOtp}
                                    disabled={isLoading}
                                    className="w-full py-3 px-4 bg-paymint-green hover:bg-paymint-green/90 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('passwordReset.form.sending')}
                                        </>
                                    ) : (
                                        <>
                                            <Mail size={18} />
                                            {t('passwordReset.form.sendCode')}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Step 2: Enter Otp */}
                        {step === 'verify' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-paymint-green/10 flex items-center justify-center mx-auto mb-4">
                                        <Shield className="w-8 h-8 text-paymint-green" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {t('passwordReset.steps.enterCodeTitle')}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-500">
                                        {t('passwordReset.steps.enterCodeDesc', { email: maskedEmail })}
                                    </p>
                                </div>

                                {/* Otp Input */}
                                <div className="flex justify-center gap-2">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => {
                                                otpRefs.current[index] = el;
                                            }}
                                            type="text"
                                            maxLength={1}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all"
                                        />
                                    ))}
                                </div>

                                {error && (
                                    <div ref={errorRef} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleVerifyOtp}
                                    disabled={isLoading || otp.join('').length !== 6}
                                    className="w-full py-3 px-4 bg-paymint-green hover:bg-paymint-green/90 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('passwordReset.form.verifying')}
                                        </>
                                    ) : (
                                        t('passwordReset.form.verifyCode')
                                    )}
                                </button>

                                <button
                                    onClick={handleRequestOtp}
                                    disabled={isLoading}
                                    className="w-full py-2 text-sm text-gray-500 hover:text-paymint-green transition-colors"
                                >
                                    {t('passwordReset.form.resend')}
                                </button>
                            </div>
                        )}

                        {/* Step 3: New Password */}
                        {step === 'newPassword' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Key className="w-8 h-8 text-purple-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {t('passwordReset.steps.newPasswordTitle')}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-500">
                                        {t('passwordReset.steps.newPasswordDesc')}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">
                                            {t('passwordReset.form.newPassword')}
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all"
                                            placeholder={t('passwordReset.form.passwordPlaceholder')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <label className="text-xs font-black text-gray-400 tracking-widest mb-2 block">
                                            {t('passwordReset.form.confirmPassword')}
                                        </label>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all"
                                            placeholder={t('passwordReset.form.confirmPlaceholder')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {error && (
                                    <div ref={errorRef} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleResetPassword}
                                    disabled={isLoading || !newPassword || !confirmPassword}
                                    className="w-full py-3 px-4 bg-paymint-green hover:bg-paymint-green/90 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            {t('passwordReset.form.resetting')}
                                        </>
                                    ) : (
                                        t('passwordReset.form.resetButton')
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Step 4: Success */}
                        {step === 'success' && (
                            <div className="space-y-6 text-center">
                                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                        {t('passwordReset.steps.successTitle')}
                                    </h3>
                                    <p className="text-sm font-bold text-gray-500">
                                        {t('passwordReset.steps.successDesc')}
                                    </p>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="w-full py-3 px-4 bg-paymint-green hover:bg-paymint-green/90 text-black font-bold rounded-xl transition-all"
                                >
                                    {t('common.done')}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

import { useState, useRef, useEffect, useMemo } from 'react';
import { Mail, Shield, Key, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { Modal, ModalHeader, ModalBody } from './ui';
import { useTranslation } from 'react-i18next';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

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
    const [resetProof, setResetProof] = useState('');
    const [error, setError] = useState('');

    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const errorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setStep('request');
            setOtp(['', '', '', '', '', '']);
            setNewPassword('');
            setConfirmPassword('');
            setResetProof('');
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
            setResetProof('');
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
            const response = await api.post<{ resetProof: string }>(
                '/api/accounts/verify-password-otp',
                { otp: otpString },
            );
            setResetProof(response.data.resetProof);
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

        if (!/[A-Z]/.test(newPassword)) {
            setError(t('auth.validation.passwordUppercase'));
            return;
        }

        if (!/[a-z]/.test(newPassword)) {
            setError(t('auth.validation.passwordLowercase'));
            return;
        }

        if (!/[0-9]/.test(newPassword)) {
            setError(t('auth.validation.passwordNumber'));
            return;
        }

        if (!/[^A-Za-z0-9]/.test(newPassword)) {
            setError(t('auth.validation.passwordSymbol'));
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            if (type === 'account') {
                if (!resetProof) {
                    throw new Error('Password-reset proof is missing');
                }
                await api.post('/api/accounts/reset-password-otp', {
                    resetProof,
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

    const criteria = [
        { label: t('auth.validation.passwordMin'), met: newPassword.length >= 8 },
        { label: t('auth.validation.passwordUppercase'), met: /[A-Z]/.test(newPassword) },
        { label: t('auth.validation.passwordLowercase'), met: /[a-z]/.test(newPassword) },
        { label: t('auth.validation.passwordNumber'), met: /[0-9]/.test(newPassword) },
        { label: t('auth.validation.passwordSymbol'), met: /[^A-Za-z0-9]/.test(newPassword) },
    ];

    const handleClose = () => {
        if (step === 'success') {
            onSuccess();
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="sm">
            <ModalHeader
                title={title}
                icon={<Shield size={24} />}
                onClose={handleClose}
            />

            <ModalBody>
                <div>
                        {/* Step 1: Request Otp */}
                        {step === 'request' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="font-barlow text-xl font-bold text-stone-900 dark:text-zinc-100 mb-2">
                                        {t('passwordReset.steps.verifyTitle')}
                                    </h3>
                                    <p className="text-sm font-bold text-stone-500">
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
                                    className="w-full py-3 px-4 bg-mintcom-green hover:bg-mintcom-green/90 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                                    <div className="w-16 h-16 rounded-full bg-mintcom-green/10 flex items-center justify-center mx-auto mb-4">
                                        <Shield className="w-8 h-8 text-mintcom-green" />
                                    </div>
                                    <h3 className="font-barlow text-xl font-bold text-stone-900 dark:text-zinc-100 mb-2">
                                        {t('passwordReset.steps.enterCodeTitle')}
                                    </h3>
                                    <p className="text-sm font-bold text-stone-500">
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
                                            className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20 outline-none transition-all"
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
                                    className="w-full py-3 px-4 bg-mintcom-green hover:bg-mintcom-green/90 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                                    className="w-full py-2 text-sm text-stone-500 hover:text-mintcom-green transition-colors"
                                >
                                    {t('passwordReset.form.resend')}
                                </button>
                            </div>
                        )}

                        {/* Step 3: New Password */}
                        {step === 'newPassword' && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                                        <Key className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <h3 className="font-barlow text-xl font-bold text-stone-900 dark:text-zinc-100 mb-2">
                                        {t('passwordReset.steps.newPasswordTitle')}
                                    </h3>
                                    <p className="text-sm font-bold text-stone-500">
                                        {t('passwordReset.steps.newPasswordDesc')}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="label-strong font-sans mb-2 block">
                                            {formatInputLabel(t('passwordReset.form.newPassword'), t('common.locale'))}
                                        </label>
                                        <input maxLength={255}
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20 outline-none transition-all"
                                            placeholder={formatInputPlaceholder(t('passwordReset.form.passwordPlaceholder'), t('common.locale'))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-9 text-stone-400 hover:text-stone-600"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <label className="label-strong font-sans mb-2 block">
                                            {formatInputLabel(t('passwordReset.form.confirmPassword'), t('common.locale'))}
                                        </label>
                                        <input maxLength={255}
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-stone-900 dark:text-zinc-100 focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20 outline-none transition-all"
                                            placeholder={formatInputPlaceholder(t('passwordReset.form.confirmPlaceholder'), t('common.locale'))}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-9 text-stone-400 hover:text-stone-600"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 bg-stone-50 dark:bg-zinc-800/40 rounded-[12px] border border-stone-200 dark:border-zinc-800">
                                    {criteria.map((item, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            {item.met ? (
                                                <CheckCircle2 size={14} className="text-mintcom-green flex-shrink-0" />
                                            ) : (
                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 dark:border-zinc-800 flex-shrink-0" />
                                            )}
                                            <span className={`text-[10px] font-bold ${item.met ? 'text-mintcom-green' : 'text-stone-400'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
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
                                    className="w-full py-3 px-4 bg-mintcom-green hover:bg-mintcom-green/90 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                                <div className="w-20 h-20 rounded-full bg-mintcom-green/ flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-10 h-10 text-mintcom-green" />
                                </div>
                                <div>
                                    <h3 className="font-barlow text-lg font-bold text-stone-900 dark:text-zinc-100 mb-2">
                                        {t('passwordReset.steps.successTitle')}
                                    </h3>
                                    <p className="text-sm font-bold text-stone-500">
                                        {t('passwordReset.steps.successDesc')}
                                    </p>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="w-full py-3 px-4 bg-mintcom-green hover:bg-mintcom-green/90 text-black font-bold rounded-xl transition-all"
                                >
                                    {t('common.done')}
                                </button>
                            </div>
                        )}
                    </div>
            </ModalBody>
        </Modal>
    );
}

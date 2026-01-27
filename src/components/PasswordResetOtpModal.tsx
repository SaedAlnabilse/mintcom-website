import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Shield, Key, CheckCircle2, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

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

    useEffect(() => {
        if (isOpen) {
            setStep('request');
            setOtp(['', '', '', '', '', '']);
            setNewPassword('');
            setConfirmPassword('');
            setError('');
        }
    }, [isOpen]);

    const getTitle = () => {
        switch (type) {
            case 'account':
                return 'Reset Account Password';
            case 'establishment':
                return `Reset Password for ${targetName}`;
            case 'brand':
                return `Reset Password for ${targetName}`;
            default:
                return 'Reset Password';
        }
    };

    const handleRequestOtp = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/api/accounts/request-password-otp');
            setMaskedEmail(response.data.email);
            setStep('verify');
            toast.success('Verification code sent to your email');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to send code');
            toast.error(err.response?.data?.message || 'Failed to send code');
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
            setError('Enter the full code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await api.post('/api/accounts/verify-password-otp', { otp: otpString });
            setStep('newPassword');
            toast.success('Code verified');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            setError('Password must contain, lowercase, and a number');
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
            toast.success('Password reset');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password');
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

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {getTitle()}
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
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        Verify Your Identity
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        We'll send a 6-digit code to your registered email address.
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
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
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Mail size={18} />
                                            Send Verification Code
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
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        Enter Verification Code
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        We sent a code to <span className="font-semibold text-gray-900 dark:text-white">{maskedEmail}</span>
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
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
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
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify Code'
                                    )}
                                </button>

                                <button
                                    onClick={handleRequestOtp}
                                    disabled={isLoading}
                                    className="w-full py-2 text-sm text-gray-500 hover:text-paymint-green transition-colors"
                                >
                                    Didn't receive the code? Resend
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
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        Create New Password
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Enter a strong password with at least 8 characters
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <label className="text-[10px] font-bold text-gray-400 tracking-widest mb-2 block">
                                            New Password
                                        </label>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all"
                                            placeholder="Enter new password"
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
                                        <label className="text-[10px] font-bold text-gray-400 tracking-widest mb-2 block">
                                            Confirm Password
                                        </label>
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white focus:border-paymint-green focus:ring-2 focus:ring-paymint-green/20 outline-none transition-all"
                                            placeholder="Confirm new password"
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
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
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
                                            Resetting...
                                        </>
                                    ) : (
                                        'Reset Password'
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
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                        Password Reset Successfully!
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Your password has been updated. You can now use your new password.
                                    </p>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="w-full py-3 px-4 bg-paymint-green hover:bg-paymint-green/90 text-black font-bold rounded-xl transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

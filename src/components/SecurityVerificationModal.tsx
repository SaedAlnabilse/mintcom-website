import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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


interface SecurityVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    targetId: string;
    targetName: string;
    mode: 'cancel' | 'stop-trial' | 'delete-card' | 'dissolve-brand' | 'delete-employee' | 'dissolve-establishment' | 'reactivate';
}

export function SecurityVerificationModal({
    isOpen,
    onClose,
    onSuccess,
    targetId,
    targetName,
    mode
}: SecurityVerificationModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);



    const getModeConfig = () => {
        switch (mode) {
            case 'cancel':
                return {
                    title: 'Cancel Subscription',
                    warning: `Canceling will lock access immediately. Your data for "${targetName}" will be permanently deleted in 30 days.`,
                    buttonText: 'Confirm Cancellation',
                    icon: ShieldAlert,
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    endpoint: `/api/accounts/subscriptions/${targetId}/cancel`,
                    method: 'post'
                };
            case 'stop-trial':
                return {
                    title: 'Stop Trial',
                    warning: `You are about to end the trial for "${targetName}". Access will be revoked immediately and the infrastructure will be deactivated.`,
                    buttonText: 'Stop Trial Now',
                    icon: AlertTriangle,
                    color: 'text-amber-500',
                    bg: 'bg-amber-500/10',
                    endpoint: `/api/accounts/subscriptions/${targetId}/stop-trial`,
                    method: 'post'
                };
            case 'delete-card':
                return {
                    title: 'Delete Payment Method',
                    warning: `Removing card ending in "${targetName}". This action is permanent. You won't be able to use this card for future payments unless re-added.`,
                    buttonText: 'Delete Card',
                    icon: CreditCard,
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    endpoint: `/api/accounts/cards/${targetId}`,
                    method: 'delete'
                };
            case 'dissolve-brand':
                return {
                    title: 'Dissolve Brand Identity',
                    warning: `You are about to dissolve "${targetName}". All establishments will return to independent nodes. This action is sensitive and affects infrastructure routing.`,
                    buttonText: 'Dissolve Brand',
                    icon: Building2,
                    color: 'text-purple-500',
                    bg: 'bg-purple-500/10',
                    endpoint: `/api/brands/${targetId}/dissolve`,
                    method: 'delete'
                };
                return {
                    title: 'Delete Team Member',
                    warning: `You are about to permanently remove "${targetName}" from the team. This will revoke all their access permissions immediately.`,
                    buttonText: 'Delete Member',
                    icon: ShieldAlert,
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    endpoint: `/api/users/${targetId}`,
                    method: 'delete'
                };
            case 'delete-employee':
                return {
                    title: 'Delete Team Member',
                    warning: `You are about to permanently remove "${targetName}" from the team. This will revoke all their access permissions immediately.`,
                    buttonText: 'Delete Member',
                    icon: ShieldAlert,
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    endpoint: `/api/users/${targetId}`,
                    method: 'delete'
                };
            case 'dissolve-establishment':
                return {
                    title: 'Dissolve Establishment',
                    warning: `You are about to dissolve "${targetName}". This will permanently remove the establishment and all associated data from the brand. This action cannot be undone.`,
                    buttonText: 'Dissolve Establishment',
                    icon: Building2,
                    color: 'text-red-500',
                    bg: 'bg-red-500/10',
                    endpoint: `/api/establishments/${targetId}/dissolve`,
                    method: 'delete'
                };
            case 'reactivate':
                return {
                    title: 'Reactivate Subscription',
                    warning: `This will immediately charge your default card $20.00 to start a new billing cycle for "${targetName}".`,
                    buttonText: 'Reactivate Now',
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
        if (!email || !password) {
            toast.error('Please enter your credentials');
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await (config.method === 'post'
                ? api.post(config.endpoint, { email, password })
                : api.delete(config.endpoint, { data: { email, password } }));

            toast.success(res.data.message || 'Action completed successfully');
            onSuccess();
            onClose();
            setEmail('');
            setPassword('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Verification failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-3xl border border-gray-200 dark:border-white/10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
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
                                <div className={`w-12 h-12 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center`}>
                                    <config.icon size={24} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShieldCheck size={12} className="text-paymint-green" />
                                        <span className="text-[10px] font-black text-paymint-green uppercase tracking-[0.2em]">High Impact Action</span>
                                    </div>
                                    <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
                                        {config.title}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-500">
                                <AlertTriangle size={20} className="shrink-0" />
                                <p className="text-xs font-bold leading-relaxed uppercase tracking-wider">
                                    {config.warning}
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block ml-1">Identity Confirmation (Email)</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-paymint-green opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-paymint-green/10 transition-all placeholder-gray-300 dark:placeholder-gray-700"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] block ml-1">Master Access Key (Password)</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-paymint-green opacity-50 group-focus-within:opacity-100 transition-opacity" size={16} />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-12 pr-10 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-paymint-green/10 transition-all placeholder-gray-300 dark:placeholder-gray-700"
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
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-3.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                    disabled={isSubmitting}
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 disabled:scale-95 ${config.color === 'text-red-500' ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-paymint-green text-black'}`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldAlert size={16} />
                                            <span>{config.buttonText}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest text-center mt-4 flex items-center justify-center gap-2">
                                <ShieldCheck size={12} className="text-paymint-green" />
                                End-to-End Encrypted Security Session
                            </p>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

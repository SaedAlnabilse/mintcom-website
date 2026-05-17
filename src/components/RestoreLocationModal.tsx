import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Shield, Lock, User, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

interface RestoreLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRestore: (data: any) => Promise<void>;
    isRestoring: boolean;
}

export function RestoreLocationModal({ isOpen, onClose, onRestore, isRestoring }: RestoreLocationModalProps) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        accountEmail: '',
        password: '',
        newLocationLoginId: '',
        newLocationPassword: '',
    });

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onRestore(formData);
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-[#1E293B] w-full sm:w-[90vw] sm:max-w-md rounded-t-3xl sm:rounded-2xl overflow-hidden h-[92vh] sm:h-auto sm:max-h-[85vh] flex flex-col transition-colors duration-300 border border-gray-200 dark:border-white/5 relative z-10"
                >
                    {/* Mobile Drag Handle */}
                    <div className="sm:hidden flex justify-center pt-2 pb-1">
                      <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                    </div>
                    <div className="p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-2xl bg-mintcom-green/10 text-mintcom-green">
                                    <RefreshCw size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        {t('security.restore.title')}
                                    </h3>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5">
                                        {t('security.restore.step', { current: step, total: 2 })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {step === 1 ? (
                            <form onSubmit={handleNext} className="space-y-6">
                                <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 mb-6">
                                    <div className="flex gap-3">
                                        <Shield className="text-blue-500 shrink-0" size={18} />
                                        <p className="text-xs font-bold text-blue-700 dark:text-blue-400 leading-relaxed">
                                            {t('security.restore.step1Desc')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-normal text-gray-500 dark:text-gray-400  tracking-normal mb-2 ml-1">
                                            {formatInputLabel(t('security.restore.ownerEmail'), t('common.locale'))}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mintcom-green transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                required
                                                type="email"
                                                value={formData.accountEmail}
                                                onChange={(e) => setFormData({ ...formData, accountEmail: e.target.value })}
                                                placeholder={formatInputPlaceholder("owner@example.com", t('common.locale'))}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-gray-500 dark:text-gray-400  tracking-normal mb-2 ml-1">
                                            {formatInputLabel(t('security.restore.ownerPassword'), t('common.locale'))}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mintcom-green transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                required
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder={formatInputPlaceholder("••••••••", t('common.locale'))}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-mintcom-green text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[#5fa888] transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {t('common.next')}
                                    <ArrowRight size={16} />
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="p-4 bg-amber-50 dark:bg-amber-500/5 rounded-2xl border border-amber-100 dark:border-amber-500/10 mb-6">
                                    <div className="flex gap-3">
                                        <AlertTriangle className="text-amber-500 shrink-0" size={18} />
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                                            {t('security.restore.step2Desc')}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-normal text-gray-500 dark:text-gray-400  tracking-normal mb-2 ml-1">
                                            {formatInputLabel(t('security.restore.newLoginId'), t('common.locale'))}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mintcom-green transition-colors">
                                                <User size={18} />
                                            </div>
                                            <input
                                                required
                                                type="text"
                                                value={formData.newLocationLoginId}
                                                onChange={(e) => setFormData({ ...formData, newLocationLoginId: e.target.value })}
                                                placeholder={formatInputPlaceholder("E.g. shop_01", t('common.locale'))}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-normal text-gray-500 dark:text-gray-400  tracking-normal mb-2 ml-1">
                                            {formatInputLabel(t('security.restore.newPassword'), t('common.locale'))}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mintcom-green transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                required
                                                type="password"
                                                value={formData.newLocationPassword}
                                                onChange={(e) => setFormData({ ...formData, newLocationPassword: e.target.value })}
                                                placeholder={formatInputPlaceholder("••••••••", t('common.locale'))}
                                                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/20 focus:border-mintcom-green transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-4 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                                    >
                                        {t('common.back')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isRestoring}
                                        className="flex-[2] py-4 bg-mintcom-green text-black font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-[#5fa888] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isRestoring ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : (
                                            t('security.restore.confirm')
                                        )}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
}

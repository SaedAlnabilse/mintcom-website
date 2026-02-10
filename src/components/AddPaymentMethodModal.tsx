import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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

interface AddPaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddPaymentMethodModal({ isOpen, onClose, onSuccess }: AddPaymentMethodModalProps) {
    const { t } = useTranslation();
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const errorBannerRef = useRef<HTMLDivElement>(null);

    useScrollLock(isOpen);

    // Format card number with spaces
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
        if (formatted.length <= 19) {
            setCardNumber(formatted);
            if (errors.cardNumber) setErrors({ ...errors, cardNumber: '' });
        }
    };

    // Format expiry as Mm/Yy
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 4) {
            if (value.length >= 2) {
                setExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
            } else {
                setExpiry(value);
            }
            if (errors.expiry) setErrors({ ...errors, expiry: '' });
        }
    };

    const getCardBrand = (number: string) => {
        const clean = number.replace(/\D/g, '');
        if (clean.match(/^4/)) return t('paymentMethods.brands.visa');
        if (clean.match(/^5[1-5]/)) return t('paymentMethods.brands.mastercard');
        if (clean.match(/^3[47]/)) return t('paymentMethods.brands.amex');
        if (clean.match(/^6/)) return t('paymentMethods.brands.discover');
        return t('common.unknown');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!cardNumber) newErrors.cardNumber = t('common.required');
        if (!expiry) newErrors.expiry = t('common.required');
        if (!cvc) newErrors.cvc = t('common.required');
        if (!name) newErrors.name = t('common.required');

        const cleanNumber = cardNumber.replace(/\D/g, '');
        const [expMonth, expYear] = expiry.split('/').map(p => parseInt(p, 10));

        if (expiry && (!expMonth || !expYear || expMonth < 1 || expMonth > 12)) {
            newErrors.expiry = t('paymentMethods.modal.errors.invalidExpiry');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to error
            setTimeout(() => {
                errorBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        try {
            setIsSubmitting(true);
            const brand = getCardBrand(cleanNumber);
            const last4 = cleanNumber.slice(-4);

            await api.post('/api/accounts/cards', {
                last4,
                brand,
                expMonth,
                expYear,
                cardholderName: name,
                setAsDefault: true,
            });

            toast.success(t('paymentMethods.messages.added'));
            onSuccess();
            onClose();

            // Reset form
            setCardNumber('');
            setExpiry('');
            setCvc('');
            setName('');
            setErrors({});
        } catch (err) {
            const msg = (err as ApiError).response?.data?.message || t('paymentMethods.messages.failedToAdd');
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
                    className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-2xl w-full sm:max-w-md overflow-hidden relative z-10 max-h-[92vh] sm:max-h-[90vh]"
                    >
                        {/* Mobile drag handle */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                        </div>

                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar pb-safe">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('paymentMethods.modal.title')}</h2>
                                    <p className="text-sm font-bold text-gray-500 mt-1">{t('paymentMethods.modal.subtitle')}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Error Banner */}
                                {Object.keys(errors).length > 0 && (
                                    <div ref={errorBannerRef} className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold animate-pulse">
                                        {errors.general || errors.expiry || errors.cardNumber || errors.cvc || errors.name || t('paymentMethods.modal.errors.correctErrors')}
                                    </div>
                                )}

                                {/* Card Number */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 tracking-widest block pl-1">{t('paymentMethods.modal.cardNumber')}</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            placeholder="0000 0000 0000 0000"
                                            className={`w-full h-14 bg-gray-50 dark:bg-white/5 border ${errors.cardNumber ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 pl-12 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-all font-mono`}
                                        />
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {getCardBrand(cardNumber) !== t('common.unknown') && (
                                                <span className="text-xs font-black text-paymint-green tracking-wider bg-paymint-green/10 px-2 py-1 rounded-md border border-paymint-green/20">
                                                    {getCardBrand(cardNumber)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {errors.cardNumber && <p className="text-xs font-bold text-red-500 pl-1">{errors.cardNumber}</p>}
                                </div>

                                {/* Expiry & Cvc */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 tracking-widest block pl-1">{t('paymentMethods.modal.expiry')}</label>
                                        <input
                                            type="text"
                                            value={expiry}
                                            onChange={handleExpiryChange}
                                            placeholder={t('paymentMethods.modal.expiryPlaceholder') || "MM/YY"}
                                            maxLength={5}
                                            className={`w-full h-14 bg-gray-50 dark:bg-white/5 border ${errors.expiry ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-all text-center font-mono`}
                                        />
                                        {errors.expiry && <p className="text-xs font-bold text-red-500 pl-1">{errors.expiry}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 tracking-widest block pl-1">{t('paymentMethods.modal.cvc')}</label>
                                        <div className="relative group">
                                            <input
                                                type="password"
                                                value={cvc}
                                                onChange={(e) => { setCvc(e.target.value.replace(/\D/g, '').slice(0, 4)); if (errors.cvc) setErrors({ ...errors, cvc: '' }); }}
                                                placeholder="123"
                                                maxLength={4}
                                                className={`w-full h-14 bg-gray-50 dark:bg-white/5 border ${errors.cvc ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 pl-10 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-all font-mono`}
                                            />
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={16} />
                                        </div>
                                        {errors.cvc && <p className="text-xs font-bold text-red-500 pl-1">{errors.cvc}</p>}
                                    </div>
                                </div>

                                {/* Cardholder Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 tracking-widest block pl-1">{t('paymentMethods.modal.cardholder')}</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                                        placeholder={t('onboarding.step2.cardName')}
                                        className={`w-full h-14 bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-all`}
                                    />
                                    {errors.name && <p className="text-xs font-bold text-red-500 pl-1">{errors.name}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-paymint-green text-black rounded-xl font-black text-xs tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-paymint-green/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <ShieldCheck size={18} />
                                            {t('paymentMethods.modal.secureVault')}
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 tracking-wider">
                                    <Lock size={10} />
                                    <span>{t('paymentMethods.modal.encrypted')}</span>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}


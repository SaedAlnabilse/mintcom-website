import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useScrollLock } from '../hooks/useScrollLock';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

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
    const [cardLast4, setCardLast4] = useState('');
    const [brand, setBrand] = useState('CARD');
    const [expiry, setExpiry] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const scrollRef = useRef<HTMLDivElement>(null);
    const errorBannerRef = useRef<HTMLDivElement>(null);

    useScrollLock(isOpen);

    const handleCardLast4Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
        setCardLast4(value);
            if (errors.cardLast4) {
                const newErrors = { ...errors };
                delete newErrors.cardLast4;
                setErrors(newErrors);
            }
    };

    // Format expiry as Mm/Yy
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        if (value.length <= 4) {
            let formatted = value;
            if (value.length >= 2) {
                formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
            }
            setExpiry(formatted);
            if (errors.expiry) {
                const newErrors = { ...errors };
                delete newErrors.expiry;
                setErrors(newErrors);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        if (!/^\d{4}$/.test(cardLast4)) newErrors.cardLast4 = t('paymentMethods.modal.errors.invalidCard', { defaultValue: 'Enter the last 4 digits only' });
        if (!brand) newErrors.brand = t('common.required');
        if (!expiry) newErrors.expiry = t('common.required');
        if (!name) newErrors.name = t('common.required');

        const [expMonthStr, expYearStr] = expiry.split('/');
        const expMonth = parseInt(expMonthStr, 10);
        const expYear = expYearStr?.length === 2 ? 2000 + parseInt(expYearStr, 10) : NaN;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        if (
            expiry &&
            (!expMonth ||
                !Number.isFinite(expYear) ||
                expMonth < 1 ||
                expMonth > 12 ||
                expYear < currentYear ||
                (expYear === currentYear && expMonth < currentMonth))
        ) {
            newErrors.expiry = t('paymentMethods.modal.errors.invalidExpiry');
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            // Scroll to the first field that has an error
            setTimeout(() => {
                const firstErrorField = scrollRef.current?.querySelector('.border-red-500');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                }
            }, 50);
            return;
        }

        try {
            setIsSubmitting(true);

            await api.post('/api/accounts/cards', {
                last4: cardLast4,
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
            setCardLast4('');
            setBrand('CARD');
            setExpiry('');
            setName('');
            setErrors({});
        } catch (err) {
            const msg = (err as ApiError).response?.data?.message || t('paymentMethods.messages.failedToAdd');
            setErrors({ general: msg });
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            }, 50);
        } finally {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div
                    dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                    className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 font-barlow"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 dark:bg-black/80 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                        className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-[2rem] border border-gray-200 dark:border-white/10 w-full sm:max-w-md overflow-hidden relative z-10 max-h-[92vh] sm:max-h-[90vh]"
                    >
                        {/* Mobile drag handle */}
                        <div className="sm:hidden flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                        </div>

                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-mintcom-green/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                        <div className="p-4 sm:p-8 overflow-y-auto custom-scrollbar pb-safe">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('paymentMethods.modal.title')}</h2>
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
                                        {errors.general || errors.expiry || errors.cardLast4 || errors.brand || errors.name || t('paymentMethods.modal.errors.correctErrors')}
                                    </div>
                                )}

                                {/* Card Metadata */}
                                <div className="space-y-2">
                                    <label className="text-sm font-normal text-gray-900 dark:text-white tracking-tight block pl-1">{formatInputLabel('Card last 4', t('common.locale'))}</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={cardLast4}
                                            onChange={handleCardLast4Change}
                                            placeholder={formatInputPlaceholder("1234", t('common.locale'))}
                                            inputMode="numeric"
                                            maxLength={4}
                                            className={`w-full h-14 bg-gray-50 dark:bg-white/5 border ${errors.cardLast4 ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 pl-12 font-normal text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-all`}
                                        />
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-mintcom-green transition-colors" size={20} />
                                    </div>
                                    {errors.cardLast4 && <p className="text-xs font-bold text-red-500 pl-1">{errors.cardLast4}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-normal text-gray-900 dark:text-white tracking-tight block pl-1">{formatInputLabel('Brand', t('common.locale'))}</label>
                                    <select
                                        value={brand}
                                        onChange={(e) => { setBrand(e.target.value); if (errors.brand) setErrors({ ...errors, brand: '' }); }}
                                        className={`w-full h-14 bg-gray-50 dark:bg-white/5 border ${errors.brand ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 font-normal text-gray-900 dark:text-white focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-all`}
                                    >
                                        <option value="CARD">Card</option>
                                        <option value="VISA">Visa</option>
                                        <option value="MASTERCARD">Mastercard</option>
                                        <option value="AMEX">American Express</option>
                                        <option value="DISCOVER">Discover</option>
                                    </select>
                                    {errors.brand && <p className="text-xs font-bold text-red-500 pl-1">{errors.brand}</p>}
                                </div>

                                {/* Expiry */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-normal text-gray-900 dark:text-white tracking-tight block pl-1">{formatInputLabel(t('paymentMethods.modal.expiry'), t('common.locale'))}</label>
                                        <input
                                            type="text"
                                            value={expiry}
                                            onChange={handleExpiryChange}
                                            placeholder={formatInputPlaceholder(t('paymentMethods.modal.expiryPlaceholder') || "MM/YY", t('common.locale'))}
                                            maxLength={5}
                                            className={`w-full h-14 bg-gray-50 dark:bg-white/5 border ${errors.expiry ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 font-normal text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-all text-center`}
                                        />
                                        {errors.expiry && <p className="text-xs font-bold text-red-500 pl-1">{errors.expiry}</p>}
                                    </div>
                                </div>

                                {/* Cardholder Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-normal text-gray-900 dark:text-white tracking-tight block pl-1">{formatInputLabel(t('paymentMethods.modal.cardholder'), t('common.locale'))}</label>
                                    <input maxLength={255}
                                        type="text"
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: '' }); }}
                                        className={`w-full h-14 bg-gray-50 dark:bg-white/5 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 font-normal text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-mintcom-green focus:ring-1 focus:ring-mintcom-green transition-all`}
                                    />
                                    {errors.name && <p className="text-xs font-bold text-red-500 pl-1">{errors.name}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 bg-mintcom-green text-black rounded-xl font-black text-xs tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-mintcom-green/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none uppercase"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        t('paymentMethods.modal.secureVault')
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <Lock size={10} />
                                        <span>{t('paymentMethods.modal.encrypted')}</span>
                                    </div>
                                    <span className="text-gray-300">•</span>
                                    <Link 
                                        to="/legal/terms" 
                                        target="_blank" 
                                        className="text-mintcom-green hover:underline decoration-mintcom-green/30"
                                    >
                                        {t('paymentMethods.modal.termsAndConditions')}
                                    </Link>
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




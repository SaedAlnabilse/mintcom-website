import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useScrollLock } from '../hooks/useScrollLock';

interface AddPaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddPaymentMethodModal({ isOpen, onClose, onSuccess }: AddPaymentMethodModalProps) {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useScrollLock(isOpen);

    // Format card number with spaces
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
        if (formatted.length <= 19) {
            setCardNumber(formatted);
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
        }
    };

    const getCardBrand = (number: string) => {
        const clean = number.replace(/\D/g, '');
        if (clean.match(/^4/)) return 'Visa';
        if (clean.match(/^5[1-5]/)) return 'Mastercard';
        if (clean.match(/^3[47]/)) return 'Amex';
        if (clean.match(/^6/)) return 'Discover';
        return 'Unknown';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cardNumber || !expiry || !cvc || !name) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            setIsSubmitting(true);

            const cleanNumber = cardNumber.replace(/\D/g, '');
            const [expMonth, expYear] = expiry.split('/').map(p => parseInt(p, 10));
            const brand = getCardBrand(cleanNumber);
            const last4 = cleanNumber.slice(-4);

            if (!expMonth || !expYear || expMonth < 1 || expMonth > 12) {
                toast.error('Invalid expiry date');
                return;
            }

            await api.post('/api/accounts/cards', {
                last4,
                brand,
                expMonth,
                expYear,
                cardholderName: name,
                setAsDefault: true,
            });

            toast.success('Payment method added');
            onSuccess();
            onClose();

            // Reset form
            setCardNumber('');
            setExpiry('');
            setCvc('');
            setName('');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to add card');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 font-sans">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md overflow-hidden relative z-10"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />

                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">New Card</h2>
                                    <p className="text-xs font-bold text-gray-400 tracking-widest mt-1">Secure Payment Vault</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Card Number */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 tracking-widest block pl-1">Card Number</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={cardNumber}
                                            onChange={handleCardNumberChange}
                                            placeholder="0000 0000 0000 0000"
                                            className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 pl-12 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-all font-mono"
                                        />
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            {getCardBrand(cardNumber) !== 'Unknown' && (
                                                <span className="text-xs font-black text-paymint-green tracking-wider bg-paymint-green/10 px-2 py-1 rounded-md border border-paymint-green/20">
                                                    {getCardBrand(cardNumber)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expiry & Cvc */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 tracking-widest block pl-1">Expiry</label>
                                        <input
                                            type="text"
                                            value={expiry}
                                            onChange={handleExpiryChange}
                                            placeholder="Mm/Yy"
                                            maxLength={5}
                                            className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-all text-center font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 tracking-widest block pl-1">Cvc</label>
                                        <div className="relative group">
                                            <input
                                                type="password"
                                                value={cvc}
                                                onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                placeholder="123"
                                                maxLength={4}
                                                className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 pl-10 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-all font-mono"
                                            />
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={16} />
                                        </div>
                                    </div>
                                </div>

                                {/* Cardholder Name */}
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 tracking-widest block pl-1">Cardholder Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full h-14 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 font-bold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-paymint-green focus:ring-1 focus:ring-paymint-green transition-all"
                                    />
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
                                            Secure Vault
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 tracking-wider">
                                    <Lock size={10} />
                                    <span>256-Bit Ssl Encrypted</span>
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


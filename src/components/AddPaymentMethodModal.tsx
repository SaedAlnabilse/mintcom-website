import React, { useMemo, useRef, useState } from 'react';
import { CreditCard, Lock, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { QuickInfo } from './QuickInfo';
import api from '../config/api';
import toast from 'react-hot-toast';
import { Modal, ModalBody, ModalCloseButton } from './ui';
import {
    detectCardBrand,
    formatCardNumberInput,
    formatExpiryInput,
    getCardCvvLength,
    getCardDigits,
    isValidCardNumber,
    parseExpiryDate,
    PAYMENT_CARD_API_BRAND,
    MAX_FORMATTED_CARD_NUMBER_LENGTH,
} from '../utils/paymentCard';

interface ApiError {
    response?: {
        data?: {
            message?: string | string[];
        };
    };
}

interface AddPaymentMethodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void | Promise<void>;
    linkEstablishmentId?: string | null;
    linkEstablishmentName?: string | null;
}

export function AddPaymentMethodModal({ isOpen, onClose, onSuccess, linkEstablishmentId, linkEstablishmentName }: AddPaymentMethodModalProps) {
    const { t } = useTranslation();
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [name, setName] = useState('');
    const [saveForFuturePurchases, setSaveForFuturePurchases] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const scrollRef = useRef<HTMLDivElement>(null);

    const cardDigits = useMemo(() => getCardDigits(cardNumber), [cardNumber]);
    const brand = useMemo(() => detectCardBrand(cardDigits), [cardDigits]);
    const cvvLength = getCardCvvLength(brand);

    const clearError = (key: string) => {
        if (!errors[key] && !errors.general) return;
        const next = { ...errors };
        delete next[key];
        delete next.general;
        setErrors(next);
    };

    const resetForm = () => {
        setCardNumber('');
        setExpiry('');
        setCvv('');
        setName('');
        setSaveForFuturePurchases(false);
        setErrors({});
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const nextErrors: Record<string, string> = {};
        const parsedExpiry = parseExpiryDate(expiry);

        if (!isValidCardNumber(cardDigits)) {
            nextErrors.cardNumber = t('paymentMethods.modal.errors.invalidCardNumber', {
                defaultValue: 'Enter a valid card number',
            });
        }

        if (!parsedExpiry) {
            nextErrors.expiry = t('paymentMethods.modal.errors.invalidExpiry', {
                defaultValue: 'Invalid expiry date',
            });
        }

        if (getCardDigits(cvv).length !== cvvLength) {
            nextErrors.cvv = t('paymentMethods.modal.errors.invalidCvv', {
                defaultValue: 'Enter a valid CVV',
            });
        }

        if (!name.trim()) {
            nextErrors.name = t('common.required', { defaultValue: 'Required' });
        }

        if (Object.keys(nextErrors).length > 0 || !parsedExpiry) {
            setErrors(nextErrors);
            setTimeout(() => {
                scrollRef.current?.querySelector('[data-error="true"]')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }, 50);
            return;
        }

        try {
            setIsSubmitting(true);

            const response = await api.post('/api/accounts/cards', {
                last4: cardDigits.slice(-4),
                brand: PAYMENT_CARD_API_BRAND[brand],
                expMonth: parsedExpiry.month,
                expYear: parsedExpiry.year,
                cardholderName: name.trim(),
                saveForFuturePurchases,
                setAsDefault: false,
            });

            const cardId = response.data?.card?.id;
            if (linkEstablishmentId && cardId) {
                await api.post(`/api/accounts/cards/${encodeURIComponent(cardId)}/link/${encodeURIComponent(linkEstablishmentId)}`);
            }

            toast.success(linkEstablishmentId
                ? t('owner.billing.card_added_and_assigned', { defaultValue: 'Card added and assigned to this location' })
                : t('paymentMethods.messages.added', { defaultValue: 'Card added' }));
            resetForm();
            await onSuccess();
            onClose();
        } catch (err) {
            const rawMessage = (err as ApiError).response?.data?.message;
            const msg = Array.isArray(rawMessage)
                ? rawMessage.join('\n')
                : rawMessage || t('paymentMethods.messages.failedToAdd', { defaultValue: 'Failed to add card' });
            setErrors({ general: msg });
            setTimeout(() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }), 50);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="sm">
            <ModalBody className="pt-8 sm:pt-10">
                <div ref={scrollRef} className="space-y-4">
                    <div className="mb-7 flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold tracking-normal text-gray-900 dark:text-white">
                                {t('paymentMethods.modal.title', { defaultValue: 'Add Payment Card' })}
                            </h2>
                            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium tracking-normal text-slate-500 dark:text-slate-400">
                                <Lock size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
                                <span>
                                    {linkEstablishmentName
                                        ? t('owner.billing.add_card_for_location', {
                                            defaultValue: 'New card will be used for {{name}}',
                                            name: linkEstablishmentName,
                                        })
                                        : t('paymentMethods.modal.subtitle', {
                                            defaultValue: 'Secure - 256-bit encrypted',
                                        })}
                                </span>
                            </div>
                        </div>
                        <ModalCloseButton onClose={handleClose} disabled={isSubmitting} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {errors.general && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold tracking-normal text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
                                {errors.general}
                            </div>
                        )}

                        <CardField
                            label={t('paymentMethods.modal.cardNumber', { defaultValue: 'Card Number' })}
                            error={errors.cardNumber}
                        >
                            <input
                                type="text"
                                value={cardNumber}
                                onChange={(e) => {
                                    setCardNumber(formatCardNumberInput(e.target.value));
                                    clearError('cardNumber');
                                }}
                                placeholder="0000 0000 0000 0000"
                                inputMode="numeric"
                                autoComplete="cc-number"
                                maxLength={MAX_FORMATTED_CARD_NUMBER_LENGTH}
                                data-error={errors.cardNumber ? 'true' : undefined}
                                className="h-10 min-w-0 flex-1 bg-transparent text-base font-medium tracking-normal text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
                            />
                            <CreditCard size={18} className="shrink-0 text-slate-400 dark:text-slate-500" />
                        </CardField>

                        <div className="grid grid-cols-2 gap-3">
                            <CardField
                                label={t('paymentMethods.modal.expiry', { defaultValue: 'Expiry Date' })}
                                error={errors.expiry}
                            >
                                <input
                                    type="text"
                                    value={expiry}
                                    onChange={(e) => {
                                        setExpiry(formatExpiryInput(e.target.value));
                                        clearError('expiry');
                                    }}
                                    placeholder="MM/YY"
                                    inputMode="numeric"
                                    autoComplete="cc-exp"
                                    maxLength={5}
                                    data-error={errors.expiry ? 'true' : undefined}
                                    className="h-10 min-w-0 flex-1 bg-transparent text-base font-medium tracking-normal text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
                                />
                            </CardField>

                            <CardField
                                label={
                                    <span className="flex items-center">
                                        {t('paymentMethods.modal.cvv', { defaultValue: 'CVV' })}
                                        <QuickInfo text={t('paymentMethods.modal.cvvTip', { defaultValue: '3 or 4-digit security code on the back of your card (or front for Amex).' })} />
                                    </span>
                                }
                                error={errors.cvv}
                            >
                                <input
                                    type="password"
                                    value={cvv}
                                    onChange={(e) => {
                                        setCvv(getCardDigits(e.target.value).slice(0, cvvLength));
                                        clearError('cvv');
                                    }}
                                    placeholder="..."
                                    inputMode="numeric"
                                    autoComplete="cc-csc"
                                    maxLength={4}
                                    data-error={errors.cvv ? 'true' : undefined}
                                    className="h-10 min-w-0 flex-1 bg-transparent text-base font-medium tracking-normal text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
                                />
                            </CardField>
                        </div>

                        <CardField
                            label={t('paymentMethods.modal.cardholder', { defaultValue: 'Cardholder Name' })}
                            error={errors.name}
                        >
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    clearError('name');
                                }}
                                placeholder={t('paymentMethods.modal.cardholderPlaceholder', {
                                    defaultValue: 'Name as it appears on card',
                                })}
                                autoComplete="cc-name"
                                maxLength={80}
                                data-error={errors.name ? 'true' : undefined}
                                className="h-10 min-w-0 flex-1 bg-transparent text-base font-medium tracking-normal text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-slate-500"
                            />
                        </CardField>

                        <button
                            type="button"
                            onClick={() => setSaveForFuturePurchases((value) => !value)}
                            className="flex items-center gap-2 pt-1 text-left text-sm font-medium tracking-normal text-slate-600 transition-colors dark:text-slate-300"
                        >
                            <span
                                className={`grid h-4 w-4 place-items-center rounded-sm border transition ${
                                    saveForFuturePurchases
                                        ? 'border-[#5DC99B] bg-[#5DC99B]'
                                        : 'border-slate-300 bg-white dark:border-white/20 dark:bg-slate-900/60'
                                }`}
                            >
                                {saveForFuturePurchases && <Check size={12} className="text-white" />}
                            </span>
                            <span>
                                {t('paymentMethods.modal.saveForFuture', {
                                    defaultValue: 'Save card for future purchases',
                                })}
                            </span>
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#5DC99B] text-base font-semibold tracking-normal text-white shadow-lg shadow-[#5DC99B]/25 transition hover:bg-[#55bc90] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isSubmitting ? (
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            ) : (
                                <>
                                    <CreditCard size={15} />
                                    {t('paymentMethods.modal.addCard', { defaultValue: 'Add Card' })}
                                </>
                            )}
                        </button>

                        <div className="flex items-center justify-center gap-5 pt-1 text-sm font-semibold tracking-normal text-gray-400 dark:text-slate-400">
                            <BrandMark brand="mastercard" />
                            <BrandMark brand="visa" />
                            <BrandMark brand="amex" />
                        </div>
                    </form>
                </div>
            </ModalBody>
        </Modal>
    );
}

interface CardFieldProps {
    label: React.ReactNode;
    error?: string;
    children: React.ReactNode;
}

function CardField({ label, error, children }: CardFieldProps) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium tracking-normal text-slate-600 dark:text-slate-300">{label}</span>
            <span
                className={`flex h-10 items-center rounded-md border bg-white px-3 transition dark:bg-slate-900/60 focus-within:border-[#5DC99B] focus-within:ring-2 focus-within:ring-[#5DC99B]/15 ${
                    error ? 'border-red-500 dark:border-red-500' : 'border-gray-200 dark:border-white/10'
                }`}
            >
                {children}
            </span>
            {error && <span className="mt-1 block text-xs font-semibold tracking-normal text-red-600 dark:text-red-400">{error}</span>}
        </label>
    );
}

function BrandMark({ brand }: { brand: 'mastercard' | 'visa' | 'amex' }) {
    if (brand === 'mastercard') {
        return (
            <span className="inline-flex items-center gap-1.5">
                <span className="relative inline-block h-4 w-7 shrink-0">
                    <span className="absolute left-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-[#EB001B]" />
                    <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full bg-[#F79E1B]/90" />
                </span>
                <span>Mastercard</span>
            </span>
        );
    }

    if (brand === 'visa') {
        return (
            <span className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-4 min-w-[30px] items-center justify-center rounded bg-white px-1 shadow-xs border border-slate-200 dark:border-white/10 shrink-0">
                    <span className="text-[8.5px] font-black italic tracking-tighter text-[#1434CB] leading-none">
                        VISA
                    </span>
                </span>
                <span>Visa</span>
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex h-4 min-w-[30px] items-center justify-center rounded bg-[#2E77BC] px-1 text-[8px] font-black tracking-normal text-white shrink-0">
                AMEX
            </span>
            <span>Amex</span>
        </span>
    );
}

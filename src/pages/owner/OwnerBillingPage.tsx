import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, CreditCard, DollarSign, Trash2, AlertCircle, Calendar, CheckCircle2, XCircle, Zap, MoreVertical, Eye, ArrowUpDown, RotateCcw, Check, FileText, X } from 'lucide-react';

import api from '../../config/api';
import { BILLING_CYCLES, getMintcomPrice } from '../../config/pricing';
import { AddPaymentMethodModal } from '../../components/AddPaymentMethodModal';
import { type SubscriptionInvoiceData } from '../../components/billing/SubscriptionInvoice';
import { InvoiceHistoryModal } from '../../components/billing/InvoiceHistoryModal';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { BusyOverlay } from '../../components/BusyOverlay';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Pagination } from '../../components/ui';
import { StatValue } from '../../components/ui/StatValue';
import {
    isActivePendingCancellation,
    requiresPaidReactivation,
} from '../../utils/subscriptionRecovery';
import { getDaysUntilDeletion } from '../../utils/deletionRecovery';
import { biIcon } from '../../components/ui/BiIcon';

interface SavedCard {
    id: string;
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
    cardholderName?: string;
    isDefault: boolean;
    linkedEstablishments: { id: string; name: string }[];
    canDelete: boolean;
}

interface EstablishmentBilling {
    id: string;
    name: string;
    establishmentLoginId?: string;
    subscriptionStatus: string;
    isActive?: boolean;
    cancelAtPeriodEnd: boolean;
    canceledAt?: string;
    deletionScheduledFor?: string | null;
    trialEndsAt?: string;
    currentPeriodEnd?: string;
    subscriptionEndDate?: string;
    monthlyPrice: number;
    billingCycle?: 'monthly' | 'yearly';
    yearlyPrice?: number;
    currency?: string;
    nextBillDate?: string;
    paymentCard: { id: string; brand: string; last4: string; isInherited?: boolean } | null;
}


interface BillingData {
    savedCards: SavedCard[];
    defaultCard: { id: string; brand: string; last4: string; expMonth: number; expYear: number } | null;
    establishments: EstablishmentBilling[];
    totalMonthlyCost: number;
    nextInvoiceDate: string | null;
}

export function OwnerBillingPage() {
    const { t } = useTranslation();
    const [billingData, setBillingData] = useState<BillingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [securityModal, setSecurityModal] = useState<{
        isOpen: boolean,
        targetId: string,
        targetName: string,
        mode: 'cancel' | 'stop-trial' | 'delete-card' | 'dissolve-brand' | 'reactivate',
        price?: number,
        currency?: string,
        isResuming?: boolean
    }>({
        isOpen: false,
        targetId: '',
        targetName: '',
        mode: 'cancel'
    });
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [nextBillSortOrder, setNextBillSortOrder] = useState<'asc' | 'desc'>('asc');
    const [cardAssignmentEstablishment, setCardAssignmentEstablishment] = useState<EstablishmentBilling | null>(null);
    const [addCardEstablishmentId, setAddCardEstablishmentId] = useState<string | null>(null);
    const [addCardEstablishmentName, setAddCardEstablishmentName] = useState<string | null>(null);
    const [isAssigningCard, setIsAssigningCard] = useState(false);
    const [invoiceHistoryFor, setInvoiceHistoryFor] = useState<{ id: string; name: string } | null>(null);
    const [invoiceSummary, setInvoiceSummary] = useState<SubscriptionInvoiceData | null>(null);

    const { refreshEstablishments, setCurrentEstablishment, establishments } = useAuth();

    const openLocationDashboard = useCallback(
        (est: EstablishmentBilling) => {
            setActiveMenu(null);

            // Prefer login slug (matches /dashboard/:locationSlug routes).
            // Fall back to auth establishments list, then establishment id.
            const fromAuth = establishments?.find((e) => e.id === est.id) as
                | { id: string; name?: string; establishmentLoginId?: string; type?: string; currency?: string }
                | undefined;
            const slug = (
                est.establishmentLoginId ||
                fromAuth?.establishmentLoginId ||
                est.id
            )
                .toString()
                .trim();

            // Seed this tab's session so resolver has a matching location
            // if the new tab reuses the same origin storage (same browser).
            const establishmentPayload = {
                id: est.id,
                name: est.name,
                establishmentLoginId: slug,
                type: fromAuth?.type || 'RESTAURANT',
                currency: fromAuth?.currency || 'USD',
            } as any;
            try {
                setCurrentEstablishment(establishmentPayload);
                localStorage.setItem('selectedEstablishmentId', est.id);
            } catch {
                // Non-blocking — URL slug is the primary deep-link.
            }

            window.open(`/dashboard/${encodeURIComponent(slug)}`, '_blank');
        },
        [establishments, setCurrentEstablishment],
    );

    const fetchBillingInfo = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const response = await api.get('/api/accounts/billing');
            setBillingData(response.data);
        } catch (err) {
            console.error('Failed to fetch billing info:', err);
            toast.error(t('owner.billing.fetchFailed'));
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchBillingInfo();
    }, [fetchBillingInfo]);

    // Close menu when clicking outside or scrolling
    useEffect(() => {
        if (!activeMenu) return;

        const handleClick = () => setActiveMenu(null);
        const handleScroll = () => setActiveMenu(null);

        document.addEventListener('click', handleClick);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            document.removeEventListener('click', handleClick);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeMenu]);

    useEffect(() => {
        setCurrentPage(1);
    }, [nextBillSortOrder]);

    const handleSecuritySuccess = async () => {
        const targetId = securityModal.targetId;
        const mode = securityModal.mode;

        // Optimistic update for cancellation. Paid subscriptions cancel at the
        // end of the paid period ("Cancels Soon"); anything else (trial,
        // past-due) is canceled immediately. fetchBillingInfo below replaces
        // this with the server's real state either way.
        if (mode === 'cancel') {
            setBillingData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    establishments: prev.establishments.map(est => {
                        if (est.id !== targetId) return est;
                        return est.subscriptionStatus === 'ACTIVE'
                            ? { ...est, cancelAtPeriodEnd: true, canceledAt: new Date().toISOString() }
                            : { ...est, subscriptionStatus: 'CANCELED', cancelAtPeriodEnd: false };
                    })
                };
            });
        }

        // Close modal immediately for better UX
        setSecurityModal(prev => ({ ...prev, isOpen: false }));

        // Refresh billing data and global establishments in background
        try {
            await Promise.all([
                fetchBillingInfo(true),
                refreshEstablishments()
            ]);
        } catch (err) {
            console.error('Failed to refresh after security action:', err);
        }
    };

    const isCanceledEstablishment = (est: Pick<EstablishmentBilling, 'subscriptionStatus'>) =>
        est.subscriptionStatus?.toUpperCase() === 'CANCELED';

    const openAddCardModal = (establishmentId?: string | null, establishmentName?: string | null) => {
        setAddCardEstablishmentId(establishmentId || null);
        setAddCardEstablishmentName(establishmentName || null);
        setIsAddCardModalOpen(true);
    };

    const openChangeCardForEstablishment = (est: EstablishmentBilling) => {
        if (isCanceledEstablishment(est)) {
            toast.error(t('owner.billing.cannotChangeCardCanceled', {
                defaultValue: 'You cannot change the card for a canceled location.',
            }));
            return;
        }
        if ((billingData?.savedCards.length || 0) === 0) {
            openAddCardModal(est.id, est.name);
            return;
        }
        setCardAssignmentEstablishment(est);
    };

    const handleAssignCardToEstablishment = async (cardId: string, establishmentId: string) => {
        const est = billingData?.establishments.find((e) => e.id === establishmentId);
        if (est && isCanceledEstablishment(est)) {
            toast.error(t('owner.billing.cannotChangeCardCanceled', {
                defaultValue: 'You cannot change the card for a canceled location.',
            }));
            setCardAssignmentEstablishment(null);
            return;
        }
        try {
            setIsAssigningCard(true);
            await api.post(`/api/accounts/cards/${encodeURIComponent(cardId)}/link/${encodeURIComponent(establishmentId)}`);
            toast.success(t('owner.billing.cardUpdated'));
            setCardAssignmentEstablishment(null);
            await fetchBillingInfo();
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('owner.billing.cardUpdateFailed'));
        } finally {
            setIsAssigningCard(false);
        }
    };

    const handleDeleteCard = (cardId: string, last4: string) => {
        setSecurityModal({
            isOpen: true,
            targetId: cardId,
            targetName: last4,
            mode: 'delete-card'
        });
    };

    const handleCancelSubscription = (establishmentId: string, name: string) => {
        setSecurityModal({
            isOpen: true,
            targetId: establishmentId,
            targetName: name,
            mode: 'cancel'
        });
    };

    const handleResumeSubscription = async (establishmentId: string, name: string) => {
        const est = billingData?.establishments.find(e => e.id === establishmentId);
        if (est && isActivePendingCancellation(est)) {
            try {
                const res = await api.post(`/api/accounts/subscriptions/${establishmentId}/resume`);
                toast.success(res.data.message);
                fetchBillingInfo();
            } catch (err: any) {
                toast.error(err.response?.data?.message || t('owner.billing.resumeFailed'));
            }
        } else {
            // Find index for correct price
            const fullIndex = billingData?.establishments.findIndex(e => e.id === establishmentId) ?? 0;
            const price = est ? getEstablishmentPrice(est, fullIndex) : getMintcomPrice(BILLING_CYCLES.MONTHLY, false, billingCurrency);

            setSecurityModal({
                isOpen: true,
                targetId: establishmentId,
                targetName: name,
                mode: 'reactivate',
                price: price,
                currency: est?.currency || billingCurrency,
                // A locked/finalized subscription starts a paid cycle. The
                // current period date is not authority for no-charge resume.
                isResuming: false
            });
        }
    };

    const handleStopTrial = (establishmentId: string, name: string) => {
        setSecurityModal({
            isOpen: true,
            targetId: establishmentId,
            targetName: name,
            mode: 'stop-trial'
        });
    };

    const getStatusBadge = (est: EstablishmentBilling) => {
        if (isActivePendingCancellation(est)) {
            return (
                <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-bold tracking-widest text-amber-500">
                        <Calendar size={12} />
                        {t('owner.billing.cancelsSoon')}
                    </span>
                    {est.subscriptionEndDate && (
                        <span className="text-[10px] font-bold text-amber-500/60 tracking-tight">
                            {t('owner.billing.cancelsOn', { date: formatBillingDate(est.subscriptionEndDate) })}
                        </span>
                    )}
                </div>
            );
        }

        switch (est.subscriptionStatus?.toUpperCase()) {
            case 'TRIAL':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-mintcom-green/10 border border-mintcom-green/20 rounded-lg text-xs font-bold tracking-widest text-mintcom-green">
                        <Zap size={12} />
                        {t('owner.locations.trial')}
                    </span>
                );
            case 'ACTIVE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-mintcom-green/10 border border-mintcom-green/20 rounded-lg text-xs font-bold tracking-widest text-mintcom-green">
                        <CheckCircle2 size={12} />
                        {t('common.active')}
                    </span>
                );
            case 'CANCELED': {
                const daysLeft = getDaysUntilDeletion(est.deletionScheduledFor) ?? 0;
                return (
                    <div className="flex flex-col items-center gap-1">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold tracking-widest text-red-500">
                            <XCircle size={12} />
                            {t('owner.locations.canceled')}
                        </span>
                        <span className="text-[10px] font-bold text-red-500/60 tracking-tight flex flex-col items-center">
                            <span>{t('owner.billing.canceledOn', { date: formatBillingDate(est.canceledAt) })}</span>
                            <span className="text-red-500 font-black uppercase text-[9px] mt-0.5">{t('owner.billing.daysRemaining', { count: daysLeft })}</span>
                        </span>
                    </div>
                );
            }
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 border border-gray-500/20 rounded-lg text-xs font-bold tracking-widest text-gray-500">
                        {est.subscriptionStatus ? est.subscriptionStatus.charAt(0).toUpperCase() + est.subscriptionStatus.slice(1).toLowerCase() : t('common.error')}
                    </span>
                );
        }
    };


    const activeEstablishments = billingData?.establishments.filter(
        est => est.subscriptionStatus?.toUpperCase() !== 'CANCELED'
    ) || [];

    const billingCurrency = activeEstablishments[0]?.currency || 'USD';

    // Helper to get correct price for an establishment by its index and currency
    const getEstablishmentPrice = (est: EstablishmentBilling, index: number) => {
        const estCurrency = est.currency || billingCurrency;
        const isAdditional = index > 0;
        if (est.billingCycle === 'yearly') {
            return est.yearlyPrice || getMintcomPrice(BILLING_CYCLES.YEARLY, isAdditional, estCurrency);
        }
        return est.monthlyPrice || getMintcomPrice(BILLING_CYCLES.MONTHLY, isAdditional, estCurrency);
    };

    let totalMonthlyCost = 0;
    let totalYearlyCost = 0;
    let hasYearlyPlan = false;

    activeEstablishments.forEach((est, index) => {
        if (est.billingCycle === 'yearly') {
            hasYearlyPlan = true;
            totalYearlyCost += getEstablishmentPrice(est, index);
        } else {
            totalMonthlyCost += getEstablishmentPrice(est, index);
        }
    });

    /**
     * Builds the *summary* document shown when a location has never been
     * charged, so nothing has been issued for it yet.
     *
     * This is deliberately not an invoice: it carries no number, is priced from
     * today's plan table, and is labelled so it cannot be filed as a tax
     * document. Real invoices come from the server and are never recomputed.
     */
    const buildSummaryData = (est: EstablishmentBilling, index: number): SubscriptionInvoiceData => {
        const estCurrency = est.currency || billingCurrency;
        const isYearly = est.billingCycle === 'yearly';
        const isAdditional = index > 0;
        const monthlyRate = est.monthlyPrice || getMintcomPrice(BILLING_CYCLES.MONTHLY, isAdditional, estCurrency);
        const total = getEstablishmentPrice(est, index);
        const quantity = isYearly ? 12 : 1;
        const subtotal = monthlyRate * quantity;

        return {
            number: null,
            status: est.subscriptionStatus?.toUpperCase() || 'ACTIVE',
            issueDate: new Date(),
            currency: estCurrency,
            subtotal,
            discount: Math.max(0, subtotal - total),
            taxAmount: 0,
            total,
            cardBrand: est.paymentCard?.brand || null,
            cardLast4: est.paymentCard?.last4 || null,
            isEstimate: true,
            nextBillDate: est.nextBillDate || est.trialEndsAt || null,
            establishmentId: est.id,
            establishmentName: est.name,
            snapshot: {
                seller: {
                    name: 'Mintcom POS',
                    address: '',
                    email: 'support@mintcompos.com',
                },
                billTo: {
                    name: est.name,
                    reference: est.establishmentLoginId || null,
                },
                billingCycle: isYearly ? 'yearly' : 'monthly',
                lineItems: [{
                    description: isYearly
                        ? 'Mintcom POS — Premium Plan (Yearly)'
                        : 'Mintcom POS — Premium Plan (Monthly)',
                    detail: isYearly
                        ? 'Full software license · 12-month subscription'
                        : 'Full software license · 1-month subscription',
                    unitPrice: monthlyRate,
                    quantity,
                    amount: subtotal,
                }],
                terms: 'No charge is due until the date above. Prices shown are the current plan rates and may change before the first charge.',
            },
        };
    };

    const openInvoiceForEstablishment = (est: EstablishmentBilling) => {
        const index = billingData?.establishments.findIndex(e => e.id === est.id) ?? 0;
        setActiveMenu(null);
        setInvoiceSummary(buildSummaryData(est, index < 0 ? 0 : index));
        setInvoiceHistoryFor({ id: est.id, name: est.name });
    };

    /** Split "Brand — Branch" so long QA names stay readable without ellipsis. */
    const splitLocationName = (name: string) => {
        const seps = [' — ', ' – ', ' - '];
        for (const sep of seps) {
            const idx = name.indexOf(sep);
            if (idx > 0) {
                return {
                    primary: name.slice(0, idx).trim(),
                    secondary: name.slice(idx + sep.length).trim(),
                };
            }
        }
        return { primary: name, secondary: null as string | null };
    };

    const getBillTimestamp = (dateValue?: string) => {
        if (!dateValue) return null;
        const timestamp = new Date(dateValue).getTime();
        return Number.isNaN(timestamp) ? null : timestamp;
    };

    const sortedEstablishments = [...(billingData?.establishments || [])].sort((a, b) => {
        const timeA = getBillTimestamp(a.nextBillDate);
        const timeB = getBillTimestamp(b.nextBillDate);

        if (timeA === null && timeB === null) return a.name.localeCompare(b.name);
        if (timeA === null) return 1;
        if (timeB === null) return -1;
        if (timeA === timeB) return a.name.localeCompare(b.name);

        return nextBillSortOrder === 'asc' ? timeA - timeB : timeB - timeA;
    });

    const paginatedEstablishments = sortedEstablishments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(sortedEstablishments.length / itemsPerPage);
    const billingDateLocale = t('common.language') === 'Arabic' ? 'ar-SA' : 'en-US';

    const formatBillingDate = (dateValue?: string | Date | null) => {
        if (!dateValue) return null;
        const parsedDate = dateValue instanceof Date ? dateValue : new Date(dateValue);
        if (Number.isNaN(parsedDate.getTime())) return null;
        return parsedDate.toLocaleDateString(billingDateLocale, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const toHeaderCase = (value: string) => {
        if (t('common.language') === 'Arabic') return value;
        return value
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const tableNextBillDate = (() => {
        if (!billingData?.establishments.length) return null;

        const validDates = billingData.establishments
            .map(est => est.nextBillDate)
            .filter((date): date is string => Boolean(date))
            .map(date => new Date(date))
            .filter(date => !Number.isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime());

        if (!validDates.length) return null;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        return validDates.find(date => date.getTime() >= startOfToday.getTime()) ?? validDates[0];
    })();

    return (
        <div className="space-y-6 sm:space-y-8 pb-10 font-sans" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
            {/* Full-screen blocker while data loads, so no second action can
                be stacked on an in-flight request. */}
            <BusyOverlay visible={isLoading} />
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{t('owner.billing.title')}</h1>
                    <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">
                        {t('owner.billing.subtitle')}
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold text-gray-400 tracking-widest capitalize mb-1">
                            {t('owner.billing.monthly')}
                        </p>
                        <StatValue
                            value={totalMonthlyCost}
                            currency={billingCurrency}
                            className="text-xl"
                            containerClassName="justify-end"
                        />
                    </div>
                    {hasYearlyPlan && (
                        <>
                            <div className="w-px h-10 bg-gray-200 dark:bg-white/10 hidden sm:block" />
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-bold text-mintcom-green tracking-widest capitalize mb-1">
                                    {t('owner.billing.yearly')}
                                </p>
                                <StatValue
                                    value={totalYearlyCost}
                                    currency={billingCurrency}
                                    className="text-xl text-mintcom-green"
                                    containerClassName="justify-end"
                                />
                            </div>
                        </>
                    )}
                    <div className="w-px h-10 bg-gray-200 dark:bg-white/10 hidden sm:block" />
                    <button
                        onClick={() => openAddCardModal()}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-mintcom-green text-black font-bold text-sm hover:bg-[#5fa888] transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        <span>{t('owner.billing.addPaymentMethod')}</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: t('owner.billing.cards'), value: billingData?.savedCards.length || 0, icon: biIcon('bi-credit-card'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
                    { label: t('owner.billing.plans'), value: billingData?.establishments.filter(e => e.subscriptionStatus === 'ACTIVE' || e.subscriptionStatus === 'TRIAL').length || 0, icon: biIcon('bi-lightning-charge'), color: 'text-mintcom-green', bg: 'bg-mintcom-green/10' },
                    {
                        label: t('owner.billing.nextBill'),
                        value: tableNextBillDate
                            ? formatBillingDate(tableNextBillDate)
                            : t('owner.billing.noBill'),
                        icon: biIcon('bi-calendar-event'),
                        color: 'text-mintcom-green',
                        bg: 'bg-mintcom-green/10'
                    },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 flex items-center gap-4 shadow-sm transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10 flex items-center gap-4 w-full">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 transition-transform duration-300`}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <p className="dashboard-stat-title mb-0.5">{stat.label}</p>
                                {typeof stat.value === 'number' ? (
                                    <StatValue 
                                        value={stat.value} 
                                        className="text-xl"
                                        isInteger={true}
                                    />
                                ) : (
                                    <p className="dashboard-card-value text-xl">{stat.value}</p>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Saved Cards Section */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard size={18} className="text-mintcom-green" />
                        {t('owner.billing.cards')}
                    </h2>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map(i => (
                                <div key={i} className="h-40 bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : billingData?.savedCards.length === 0 ? (
                        <motion.button
                            onClick={() => openAddCardModal()}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 hover:text-mintcom-green hover:border-mintcom-green/30 transition-all flex flex-col items-center gap-3 bg-gray-50 dark:bg-white/[0.02]"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                <Plus size={24} />
                            </div>
                            <span className="text-xs font-bold tracking-wide">{t('owner.billing.addCard')}</span>
                        </motion.button>
                    ) : (
                        <div className="space-y-4">
                            {billingData?.savedCards.map((card, index) => (
                                <motion.div
                                    key={card.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={`group relative p-6 h-48 rounded-2xl flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-lg transition-all border ${card.isDefault
                                        ? 'bg-white dark:bg-[#1E293B] border-mintcom-green/30 ring-1 ring-mintcom-green/10'
                                        : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/5 hover:border-mintcom-green/30'
                                        }`}
                                >
                                    {/* Gradient Blob */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-1.5">
                                            <p className="dashboard-card-label">{t('owner.billing.addCard')}</p>
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-300 text-[8px] font-black rounded-[12px] tracking-widest">
                                                {t('owner.billing.saved_card', { defaultValue: 'Saved' })}
                                            </div>
                                        </div>
                                        
                                        <p className="text-xl font-bold tracking-[0.15em] text-gray-900 dark:text-white">
                                            <span className="opacity-30">••••</span> {card.last4}
                                        </p>
                                    </div>

                                    <div className="relative z-10 flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="dashboard-card-label">{t('categories.form.nameLabel')}</p>
                                            <p className="font-bold tracking-wider text-xs text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{card.cardholderName || 'User'}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="dashboard-card-label">{t('owner.billing.expires')}</p>
                                            <p className="font-bold text-xs text-gray-800 dark:text-gray-200">{card.expMonth}/{card.expYear.toString().slice(-2)}</p>
                                        </div>
                                    </div>

                                    {/* Actions Overlay - Visible on hover or when primary action button is clicked on mobile */}
                                    <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 z-20 pointer-events-none group-hover:pointer-events-auto">
                                        {card.canDelete ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id, card.last4); }}
                                                className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-400 hover:text-red-500 hover:border-red-500/50 flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 pointer-events-auto"
                                                title={t('owner.billing.deleteCard')}
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        ) : (
                                            <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-300 dark:text-gray-600 flex items-center justify-center cursor-not-allowed" title={t('owner.billing.linkedNote')}>
                                                <Trash2 size={20} />
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Subscriptions Section */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign size={18} className="text-mintcom-green" />
                        {t('owner.billing.plans')}
                    </h2>

                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-visible shadow-sm">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 table-header-row items-center">
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-10" />
                                <span>{toHeaderCase(t('owner.billing.location'))}</span>
                            </div>
                            <div className="col-span-2 text-center flex justify-center">{toHeaderCase(t('owner.billing.status'))}</div>
                            <div className="col-span-2 text-center flex justify-center">{toHeaderCase(t('owner.billing.cost'))}</div>
                            <div className="col-span-2 text-center flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setNextBillSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="inline-flex items-center gap-1 hover:text-mintcom-green transition-colors"
                                    title={`${toHeaderCase(t('owner.billing.nextBill'))}: ${nextBillSortOrder === 'asc' ? toHeaderCase(t('common.next')) : toHeaderCase(t('community.sort.latest'))}`}
                                >
                                    <span>{toHeaderCase(t('owner.billing.nextBill'))}</span>
                                    <ArrowUpDown size={12} />
                                </button>
                            </div>
                            <div className="col-span-1 text-center flex justify-center">{toHeaderCase(t('owner.billing.payment'))}</div>
                            <div className="col-span-1 text-center flex justify-center">{toHeaderCase(t('common.actions'))}</div>
                        </div>

                        {isLoading ? (
                            <div className="p-8 space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : billingData?.establishments.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-sm font-bold text-gray-500">{t('owner.billing.noSubscriptions')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {paginatedEstablishments.map((est) => (
                                    <div
                                        key={est.id}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-3 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center group relative"
                                    >
                                        {/* Location — full name, no ellipsis; split brand / branch when possible */}
                                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-mintcom-green transition-colors shrink-0">
                                                {est.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                {(() => {
                                                    const { primary, secondary } = splitLocationName(est.name);
                                                    const planLabel = est.billingCycle === 'yearly'
                                                        ? t('owner.billing.yearlyPlan')
                                                        : t('owner.billing.monthlyPlan');
                                                    return (
                                                        <>
                                                            <h3
                                                                className="text-sm font-bold tracking-tight text-gray-900 dark:text-white leading-snug break-words"
                                                                title={est.name}
                                                            >
                                                                {primary}
                                                            </h3>
                                                            <p className="dashboard-card-meta leading-snug break-words mt-0.5">
                                                                {[secondary, planLabel].filter(Boolean).join(' · ')}
                                                            </p>
                                                            {est.establishmentLoginId ? (
                                                                <p
                                                                    className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 tracking-wide mt-0.5 break-all"
                                                                    title={est.establishmentLoginId}
                                                                >
                                                                    {est.establishmentLoginId}
                                                                </p>
                                                            ) : null}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2 text-center flex justify-center">
                                            {getStatusBadge(est)}
                                        </div>

                                        {/* Cost — plain price; trials show free-now + post-trial rate */}
                                        <div className="col-span-2 text-center flex justify-center">
                                            {(() => {
                                                // Find original index in full list for correct pricing
                                                const fullIndex = billingData?.establishments.findIndex(e => e.id === est.id) ?? 0;
                                                const price = getEstablishmentPrice(est, fullIndex);
                                                const itemCurrency = est.currency || billingCurrency;
                                                const isYearly = est.billingCycle === 'yearly';
                                                const isTrial = est.subscriptionStatus?.toUpperCase() === 'TRIAL';
                                                const formattedPrice = Number(price).toLocaleString(t('common.locale'), {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                });
                                                if (isTrial) {
                                                    const periodLabel = isYearly
                                                        ? t('common.yearly', { defaultValue: 'yearly' })
                                                        : t('common.monthly', { defaultValue: 'monthly' });
                                                    return (
                                                        <div
                                                            className="flex flex-col items-center gap-0.5 whitespace-nowrap"
                                                            title={t('owner.billing.trialEndsNotice', {
                                                                defaultValue: `Free now · then {{price}} {{currency}} {{period}} after trial`,
                                                                price: formattedPrice,
                                                                currency: itemCurrency,
                                                                period: periodLabel,
                                                                date: formatBillingDate(est.nextBillDate || est.trialEndsAt) || '',
                                                            })}
                                                        >
                                                            <span className="inline-flex items-baseline gap-1 text-sm font-bold tracking-tight text-mintcom-green">
                                                                <span>0.00</span>
                                                                <span className="text-[10px] font-black uppercase text-mintcom-green/70">
                                                                    {itemCurrency}
                                                                </span>
                                                            </span>
                                                            <span className="text-[10px] font-bold text-mintcom-green/80">
                                                                {t('owner.billing.trial', { defaultValue: 'Trial' })}
                                                            </span>
                                                            {/* Post-trial rate — always show the real amount under "Then" */}
                                                            <span className="inline-flex items-baseline gap-1 text-[11px] font-bold tracking-tight text-gray-700 dark:text-gray-200">
                                                                <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                                                                    {t('owner.billing.then', { defaultValue: 'Then' })}
                                                                </span>
                                                                <span>{formattedPrice}</span>
                                                                <span className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500">
                                                                    {itemCurrency}
                                                                </span>
                                                            </span>
                                                            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                                                                {periodLabel}
                                                            </span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="flex flex-col items-center gap-0.5 whitespace-nowrap">
                                                        <span className="inline-flex items-baseline gap-1 text-sm font-bold tracking-tight text-gray-900 dark:text-white">
                                                            <span>{formattedPrice}</span>
                                                            <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500">
                                                                {itemCurrency}
                                                            </span>
                                                        </span>
                                                        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                                                            {isYearly ? t('common.yearly') : t('common.monthly')}
                                                        </span>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Next Bill */}
                                        <div className="col-span-2 text-center flex justify-center">
                                            {formatBillingDate(est.nextBillDate) ? (
                                                <div className="flex flex-col items-center gap-0.5">
                                                    <p className="dashboard-card-meta text-center">
                                                        {formatBillingDate(est.nextBillDate)}
                                                    </p>
                                                    {est.subscriptionStatus?.toUpperCase() === 'TRIAL' ? (
                                                        <p className="text-[10px] font-bold text-mintcom-green/80">
                                                            {t('owner.billing.trialEnds', { defaultValue: 'Trial ends' })}
                                                        </p>
                                                    ) : null}
                                                </div>
                                            ) : (
                                                <p className="text-xs font-bold text-gray-400 text-center">-</p>
                                            )}
                                        </div>

                                        {/* Payment */}
                                        <div className="col-span-1 text-center flex justify-center items-center min-w-0">
                                            <span className="dashboard-card-meta text-center break-words leading-snug" title={est.paymentCard ? `${est.paymentCard.brand} •••• ${est.paymentCard.last4}` : undefined}>
                                                {est.paymentCard ? `${est.paymentCard.brand} •••• ${est.paymentCard.last4}` : t('owner.billing.noCard')}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-1 text-center flex justify-center relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenu(activeMenu === est.id ? null : est.id);
                                                }}
                                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            <AnimatePresence>
                                                {activeMenu === est.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-white/10 shadow-xl z-50 overflow-hidden"
                                                    >
                                                        <button
                                                            onClick={() => openLocationDashboard(est)}
                                                            className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 tracking-wide transition-colors flex items-center gap-2"
                                                        >
                                                            <Eye size={14} />
                                                            {t('owner.billing.viewDashboard')}
                                                        </button>
                                                        <button
                                                            onClick={() => openInvoiceForEstablishment(est)}
                                                            className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 tracking-wide transition-colors flex items-center gap-2"
                                                        >
                                                            <FileText size={14} />
                                                            {t('owner.billing.invoice.action', { defaultValue: 'Invoices' })}
                                                        </button>
                                                        {!isCanceledEstablishment(est) && (
                                                            <button
                                                                onClick={() => {
                                                                    setActiveMenu(null);
                                                                    openChangeCardForEstablishment(est);
                                                                }}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 tracking-wide transition-colors flex items-center gap-2"
                                                            >
                                                                <CreditCard size={14} />
                                                                {t('owner.billing.change_card', { defaultValue: 'Change Card' })}
                                                            </button>
                                                        )}
                                                        {est.subscriptionStatus === 'TRIAL' && !est.cancelAtPeriodEnd && (
                                                            <button
                                                                onClick={() => handleStopTrial(est.id, est.name)}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 tracking-wide transition-colors flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} />
                                                                {t('owner.billing.stopTrial')}
                                                            </button>
                                                        )}
                                                        {est.subscriptionStatus === 'ACTIVE' && !est.cancelAtPeriodEnd && (
                                                            <button
                                                                onClick={() => handleCancelSubscription(est.id, est.name)}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 tracking-wide transition-colors flex items-center gap-2"
                                                            >
                                                                <Trash2 size={14} />
                                                                {t('owner.billing.cancelSub')}
                                                            </button>
                                                        )}
                                                        {(isActivePendingCancellation(est) || requiresPaidReactivation(est)) && (
                                                            <button
                                                                onClick={() => handleResumeSubscription(est.id, est.name)}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-mintcom-green hover:bg-mintcom-green/10 tracking-wide transition-colors flex items-center gap-2"
                                                            >
                                                                <RotateCcw size={14} />
                                                                {['CANCELED', 'PAST_DUE', 'SUSPENDED'].includes(est.subscriptionStatus?.toUpperCase()) ? t('owner.billing.reactivate') : t('owner.billing.resume')}
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
}

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            variant="footer"
                        />
                    </div>

                    {/* Alert Banner for Cancellations */}
                    {billingData?.establishments.some((establishment) =>
                        isActivePendingCancellation(establishment),
                    ) && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-xs font-black text-amber-500 tracking-widest mb-1">{t('owner.billing.endingSoon')}</h4>
                                <p className="text-xs font-bold text-amber-500 leading-relaxed">
                                    {t('owner.billing.endingSoonDesc')}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <AddPaymentMethodModal
                isOpen={isAddCardModalOpen}
                onClose={() => {
                    setIsAddCardModalOpen(false);
                    setAddCardEstablishmentId(null);
                    setAddCardEstablishmentName(null);
                }}
                onSuccess={fetchBillingInfo}
                linkEstablishmentId={addCardEstablishmentId}
                linkEstablishmentName={addCardEstablishmentName}
            />

            {typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        {cardAssignmentEstablishment && billingData && (
                            <div
                                dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                                className="fixed inset-0 z-[9999] popup-surface flex items-end justify-center p-0 sm:items-center sm:p-4 font-sans"
                            >
                                {/* Full-viewport dimmer — same layering as other owner popups */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm"
                                    onClick={() =>
                                        !isAssigningCard && setCardAssignmentEstablishment(null)
                                    }
                                />

                                <motion.div
                                    initial={{ opacity: 0, y: 24 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 24 }}
                                    className="relative z-10 w-full max-w-md rounded-t-2xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-[#1E293B] sm:rounded-2xl"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="mb-4 flex items-start justify-between gap-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {t('owner.billing.change_card', {
                                                    defaultValue: 'Change Card',
                                                })}
                                            </h3>
                                            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                                                {cardAssignmentEstablishment.name}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isAssigningCard}
                                            onClick={() => setCardAssignmentEstablishment(null)}
                                            aria-label={t('common.close', { defaultValue: 'Close' })}
                                            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90 disabled:opacity-50"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {billingData.savedCards.map((card) => {
                                            const isCurrent =
                                                cardAssignmentEstablishment.paymentCard?.id ===
                                                card.id;
                                            return (
                                                <button
                                                    key={card.id}
                                                    type="button"
                                                    disabled={isAssigningCard || isCurrent}
                                                    onClick={() =>
                                                        handleAssignCardToEstablishment(
                                                            card.id,
                                                            cardAssignmentEstablishment.id,
                                                        )
                                                    }
                                                    className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                                                        isCurrent
                                                            ? 'border-mintcom-green/40 bg-mintcom-green/10'
                                                            : 'border-gray-200 hover:border-mintcom-green/40 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'
                                                    } disabled:cursor-default`}
                                                >
                                                    <span>
                                                        <span className="block text-sm font-bold text-gray-900 dark:text-white">
                                                            {card.brand} •••• {card.last4}
                                                        </span>
                                                        <span className="block text-xs font-medium text-gray-500 dark:text-gray-400">
                                                            {card.cardholderName ||
                                                                t('owner.billing.cardholder', {
                                                                    defaultValue: 'Cardholder',
                                                                })}
                                                        </span>
                                                    </span>
                                                    {isCurrent && (
                                                        <Check
                                                            size={18}
                                                            className="text-mintcom-green"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        type="button"
                                        disabled={isAssigningCard}
                                        onClick={() => {
                                            const establishmentId =
                                                cardAssignmentEstablishment.id;
                                            const establishmentName =
                                                cardAssignmentEstablishment.name;
                                            setCardAssignmentEstablishment(null);
                                            openAddCardModal(
                                                establishmentId,
                                                establishmentName,
                                            );
                                        }}
                                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green px-4 py-3 text-sm font-bold text-black transition hover:bg-[#5fa888] disabled:opacity-60"
                                    >
                                        <Plus size={16} />
                                        {t('owner.billing.add_new_card', {
                                            defaultValue: 'Add new card',
                                        })}
                                    </button>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}

            <InvoiceHistoryModal
                establishment={invoiceHistoryFor}
                fallbackSummary={invoiceSummary}
                onClose={() => setInvoiceHistoryFor(null)}
            />

            <SecurityVerificationModal
                isOpen={securityModal.isOpen}
                onClose={() => setSecurityModal({ ...securityModal, isOpen: false })}
                onSuccess={handleSecuritySuccess}
                targetId={securityModal.targetId}
                targetName={securityModal.targetName}
                mode={securityModal.mode}
                price={securityModal.price}
                currency={securityModal.currency}
                isResuming={securityModal.isResuming}
            />
        </div>
    );
};

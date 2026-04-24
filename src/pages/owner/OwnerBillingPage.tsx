import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, CreditCard, DollarSign, Trash2, Star, AlertCircle, Calendar, CheckCircle2, XCircle, Zap, MoreVertical, Eye, ArrowUpDown } from 'lucide-react';
import api from '../../config/api';
import { AddPaymentMethodModal } from '../../components/AddPaymentMethodModal';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Pagination } from '../../components/ui';

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
    subscriptionStatus: string;
    cancelAtPeriodEnd: boolean;
    canceledAt?: string;
    trialEndsAt?: string;
    subscriptionEndDate?: string;
    monthlyPrice: number;
    billingCycle?: 'monthly' | 'yearly';
    yearlyPrice?: number;
    nextBillDate?: string;
    paymentCard: { id: string; brand: string; last4: string } | null;
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
        isResuming?: boolean
    }>({
        isOpen: false,
        targetId: '',
        targetName: '',
        mode: 'cancel'
    });
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [nextBillSortOrder, setNextBillSortOrder] = useState<'asc' | 'desc'>('asc');

    const { refreshEstablishments } = useAuth();

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

        // Optimistic update for cancellation
        if (mode === 'cancel') {
            setBillingData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    establishments: prev.establishments.map(est =>
                        est.id === targetId
                            ? { ...est, subscriptionStatus: 'CANCELED', cancelAtPeriodEnd: false }
                            : est
                    )
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

    const handleSetDefaultCard = async (cardId: string) => {
        try {
            await api.post(`/api/accounts/cards/${cardId}/set-default`);
            toast.success(t('owner.billing.cardUpdated'));
            fetchBillingInfo();
        } catch (err: any) {
            toast.error(err.response?.data?.message || t('owner.billing.cardUpdateFailed'));
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

    const handleResumeSubscription = async (establishmentId: string, name: string, isPendingCancel: boolean) => {
        if (isPendingCancel) {
            try {
                const res = await api.post(`/api/accounts/subscriptions/${establishmentId}/resume`);
                toast.success(res.data.message);
                fetchBillingInfo();
            } catch (err: any) {
                toast.error(err.response?.data?.message || t('owner.billing.resumeFailed'));
            }
        } else {
            // Check if within paid period
            const est = billingData?.establishments.find(e => e.id === establishmentId);
            const isWithinPaidPeriod = est?.subscriptionEndDate ? new Date() < new Date(est.subscriptionEndDate) : false;
            
            // Find index for correct price
            const fullIndex = billingData?.establishments.findIndex(e => e.id === establishmentId) ?? 0;
            const price = est ? getEstablishmentPrice(est, fullIndex) : 20;

            setSecurityModal({
                isOpen: true,
                targetId: establishmentId,
                targetName: name,
                mode: 'reactivate',
                price: price,
                isResuming: isWithinPaidPeriod
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

    const getDaysLeft = (canceledAt?: string) => {
        if (!canceledAt) return 30;
        const cancelDate = new Date(canceledAt);
        const now = new Date();
        const diffTime = now.getTime() - cancelDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const remaining = 30 - diffDays;
        return remaining > 0 ? remaining : 0;
    };

    const getStatusBadge = (est: EstablishmentBilling) => {
        if (est.cancelAtPeriodEnd) {
            return (
                <div className="flex flex-col items-center gap-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-bold tracking-widest text-amber-500">
                        <Calendar size={12} />
                        {t('owner.billing.cancelsSoon')}
                    </span>
                    {est.subscriptionEndDate && (
                        <span className="text-[10px] font-bold text-amber-500/60 tracking-tight">
                            {t('owner.billing.canceledOn', { date: formatBillingDate(est.canceledAt || new Date()) })}
                        </span>
                    )}
                </div>
            );
        }

        switch (est.subscriptionStatus?.toUpperCase()) {
            case 'TRIAL':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-paymint-green/ border border-paymint-green/ rounded-lg text-xs font-bold tracking-widest text-paymint-green">
                        <Zap size={12} />
                        {t('owner.locations.trial')}
                    </span>
                );
            case 'ACTIVE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-paymint-green/10 border border-paymint-green/20 rounded-lg text-xs font-bold tracking-widest text-paymint-green">
                        <CheckCircle2 size={12} />
                        {t('common.active')}
                    </span>
                );
            case 'CANCELED': {
                const daysLeft = getDaysLeft(est.canceledAt);
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


    // Apply correct pricing: first location = $20/mo, additional = $17/mo
    // The backend may return flat $20 for all, so we override client-side
    const FIRST_LOCATION_PRICE = 20;
    const ADDITIONAL_LOCATION_PRICE = 17;

    const activeEstablishments = billingData?.establishments.filter(
        est => est.subscriptionStatus?.toUpperCase() !== 'CANCELED'
    ) || [];

    let totalMonthlyCost = 0;
    let totalYearlyCost = 0;
    let hasYearlyPlan = false;

    activeEstablishments.forEach((est, index) => {
        if (est.billingCycle === 'yearly') {
            hasYearlyPlan = true;
            totalYearlyCost += est.yearlyPrice || (index === 0 ? 210 : 180);
        } else {
            totalMonthlyCost += index === 0 ? FIRST_LOCATION_PRICE : ADDITIONAL_LOCATION_PRICE;
        }
    });

    // Helper to get correct price for an establishment by its index
    const getEstablishmentPrice = (est: EstablishmentBilling, index: number) => {
        // If backend provides billingCycle=yearly, use yearly price
        if (est.billingCycle === 'yearly') {
            return est.yearlyPrice || (index === 0 ? 210 : 180);
        }
        // Monthly: first location = $20, additional = $17
        return index === 0 ? FIRST_LOCATION_PRICE : ADDITIONAL_LOCATION_PRICE;
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
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
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
                        <div className="flex items-baseline justify-end">
                            <span className="dashboard-card-value text-xl">${totalMonthlyCost.toFixed(2)}</span>
                            <span className="text-xs font-bold text-gray-400 ml-0.5">{t('common.monthly')}</span>
                        </div>
                    </div>
                    {hasYearlyPlan && (
                        <>
                            <div className="w-px h-10 bg-gray-200 dark:bg-white/10 hidden sm:block" />
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-bold text-paymint-green tracking-widest capitalize mb-1">
                                    {t('owner.billing.yearly')}
                                </p>
                                <div className="flex items-baseline justify-end">
                                    <span className="dashboard-card-value text-xl text-paymint-green">${totalYearlyCost.toFixed(2)}</span>
                                    <span className="text-xs font-bold text-gray-400 ml-0.5">{t('common.yearly')}</span>
                                </div>
                            </div>
                        </>
                    )}
                    <div className="w-px h-10 bg-gray-200 dark:bg-white/10 hidden sm:block" />
                    <button
                        onClick={() => setIsAddCardModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-[#68B390] transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        <span>{t('owner.billing.addPaymentMethod')}</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: t('owner.billing.cards'), value: billingData?.savedCards.length || 0, icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: t('owner.billing.plans'), value: billingData?.establishments.filter(e => e.subscriptionStatus === 'ACTIVE' || e.subscriptionStatus === 'TRIAL').length || 0, icon: Zap, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
                    {
                        label: t('owner.billing.nextBill'),
                        value: tableNextBillDate
                            ? formatBillingDate(tableNextBillDate)
                            : t('owner.billing.noBill'),
                        icon: Calendar,
                        color: 'text-purple-500',
                        bg: 'bg-purple-500/10'
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
                                <p className="dashboard-card-label mb-0.5">{stat.label}</p>
                                <p className="dashboard-card-value text-xl">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Saved Cards Section */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard size={18} className="text-paymint-green" />
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
                            onClick={() => setIsAddCardModalOpen(true)}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10 text-gray-400 hover:text-paymint-green hover:border-paymint-green/30 transition-all flex flex-col items-center gap-3 bg-gray-50 dark:bg-white/[0.02]"
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
                                        ? 'bg-white dark:bg-[#1E293B] border-paymint-green/30 ring-1 ring-paymint-green/10'
                                        : 'bg-white dark:bg-[#1E293B] border-gray-200 dark:border-white/5 hover:border-paymint-green/30'
                                        }`}
                                >
                                    {/* Gradient Blob */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                    <div className="relative z-10 flex justify-between items-start">
                                        <div className="space-y-1.5">
                                            <p className="dashboard-card-label">{t('owner.billing.addCard')}</p>
                                            <p className="text-xl font-bold tracking-[0.15em] text-gray-900 dark:text-white">
                                                <span className="opacity-30">••••</span> {card.last4}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {card.isDefault && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-paymint-green text-black text-[8px] font-black rounded-full tracking-widest shadow-lg shadow-paymint-green/20">
                                                    <div className="w-1 h-1 rounded-full bg-black animate-pulse" />
                                                    {t('owner.billing.primary')}
                                                </div>
                                            )}
                                            {card.brand === 'VISA' && (
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center">
                                                    <span className="font-black italic text-sm text-gray-900 dark:text-white">Visa</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex justify-between items-end">
                                        <div className="space-y-1">
                                            <p className="dashboard-card-label">{t('categories.form.nameLabel')}</p>
                                            <p className="font-bold tracking-wider text-xs text-gray-800 dark:text-gray-200">{card.cardholderName || 'User'}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="dashboard-card-label">{t('owner.billing.expires')}</p>
                                            <p className="font-bold text-xs text-gray-800 dark:text-gray-200">{card.expMonth}/{card.expYear.toString().slice(-2)}</p>
                                        </div>
                                    </div>

                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-white/10 dark:bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 z-20">
                                        {!card.isDefault && (
                                            <button
                                                onClick={() => handleSetDefaultCard(card.id)}
                                                className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-400 hover:text-paymint-green hover:border-paymint-green/50 flex items-center justify-center transition-all shadow-xl hover:scale-110"
                                                title={t('owner.billing.setDefault')}
                                            >
                                                <Star size={20} />
                                            </button>
                                        )}
                                        {card.canDelete ? (
                                            <button
                                                onClick={() => handleDeleteCard(card.id, card.last4)}
                                                className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-400 hover:text-red-500 hover:border-red-500/50 flex items-center justify-center transition-all shadow-xl hover:scale-110"
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
                        <DollarSign size={18} className="text-paymint-green" />
                        {t('owner.billing.plans')}
                    </h2>

                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-visible shadow-sm">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 dashboard-card-label items-center">
                            <div className="col-span-4 flex items-center gap-3">
                                <div className="w-10" />
                                <span>{toHeaderCase(t('owner.billing.service'))}</span>
                            </div>
                            <div className="col-span-2 text-center flex justify-center">{toHeaderCase(t('owner.billing.status'))}</div>
                            <div className="col-span-1 text-center flex justify-center">{toHeaderCase(t('owner.billing.cost'))}</div>
                            <div className="col-span-2 text-center flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => setNextBillSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    className="inline-flex items-center gap-1 hover:text-paymint-green transition-colors"
                                    title={`${toHeaderCase(t('owner.billing.nextBill'))}: ${nextBillSortOrder === 'asc' ? toHeaderCase(t('common.next')) : toHeaderCase(t('sort.latest'))}`}
                                >
                                    <span>{toHeaderCase(t('owner.billing.nextBill'))}</span>
                                    <ArrowUpDown size={12} />
                                </button>
                            </div>
                            <div className="col-span-2 text-center flex justify-center">{toHeaderCase(t('owner.billing.payment'))}</div>
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
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center group relative"
                                    >
                                        {/* Service */}
                                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-paymint-green transition-colors shrink-0">
                                                {est.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-sm font-bold tracking-tight text-gray-900 dark:text-white truncate" title={est.name}>
                                                    {est.name}
                                                </h3>
                                                <p className="dashboard-card-meta truncate">
                                                    {est.billingCycle === 'yearly' ? t('owner.billing.yearlyPlan') : t('owner.billing.monthlyPlan')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-2 text-center flex justify-center">
                                            {getStatusBadge(est)}
                                        </div>

                                        {/* Cost */}
                                        <div className="col-span-1 text-center flex justify-center">
                                            {(() => {
                                                // Find original index in full list for correct pricing
                                                const fullIndex = billingData?.establishments.findIndex(e => e.id === est.id) ?? 0;
                                                const price = getEstablishmentPrice(est, fullIndex);
                                                const isYearly = est.billingCycle === 'yearly';
                                                return (
                                                    <div className="flex flex-col items-center">
                                                        <div className="flex items-baseline">
                                                            <span className="font-bold text-gray-900 dark:text-white text-sm">
                                                                ${price}
                                                            </span>
                                                            <span className="text-xs text-gray-400 ml-0.5">
                                                                {isYearly ? t('common.yearly') : t('common.monthly')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Next Bill */}
                                        <div className="col-span-2 text-center flex justify-center">
                                            {formatBillingDate(est.nextBillDate) ? (
                                                <p className="dashboard-card-meta text-center">
                                                    {formatBillingDate(est.nextBillDate)}
                                                </p>
                                            ) : (
                                                <p className="text-xs font-bold text-gray-400 text-center">—</p>
                                            )}
                                        </div>

                                        {/* Payment */}
                                        <div className="col-span-2 text-center flex justify-center">
                                            <span className="dashboard-card-meta truncate text-center">
                                                {est.paymentCard ? `•••• ${est.paymentCard.last4}` : t('owner.billing.noCard')}
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
                                                            onClick={() => window.open(`/dashboard`, '_blank')}
                                                            className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 tracking-wide transition-colors flex items-center gap-2"
                                                        >
                                                            <Eye size={14} />
                                                            {t('owner.billing.viewDashboard')}
                                                        </button>
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
                                                        {(est.cancelAtPeriodEnd || est.subscriptionStatus === 'CANCELED') && (
                                                            <button
                                                                onClick={() => handleResumeSubscription(est.id, est.name, est.cancelAtPeriodEnd)}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-paymint-green hover:bg-paymint-green/10 tracking-wide transition-colors"
                                                            >
                                                                {est.subscriptionStatus === 'CANCELED' ? t('owner.billing.reactivate') : t('owner.billing.resume')}
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
                    {billingData?.establishments.some(e => e.cancelAtPeriodEnd) && (
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
                onClose={() => setIsAddCardModalOpen(false)}
                onSuccess={fetchBillingInfo}
            />

            <SecurityVerificationModal
                isOpen={securityModal.isOpen}
                onClose={() => setSecurityModal({ ...securityModal, isOpen: false })}
                onSuccess={handleSecuritySuccess}
                targetId={securityModal.targetId}
                targetName={securityModal.targetName}
                mode={securityModal.mode}
                price={securityModal.price}
                isResuming={securityModal.isResuming}
            />
        </div>
    );
};




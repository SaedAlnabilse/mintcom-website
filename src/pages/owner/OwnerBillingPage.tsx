import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CreditCard, DollarSign, Trash2, Star, AlertCircle, Calendar, CheckCircle2, XCircle, Zap, MoreVertical, Eye } from 'lucide-react';
import api from '../../config/api';
import { AddPaymentMethodModal } from '../../components/AddPaymentMethodModal';
import { SecurityVerificationModal } from '../../components/SecurityVerificationModal';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

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
    const [billingData, setBillingData] = useState<BillingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
    const [securityModal, setSecurityModal] = useState<{
        isOpen: boolean,
        targetId: string,
        targetName: string,
        mode: 'cancel' | 'stop-trial' | 'delete-card' | 'dissolve-brand' | 'reactivate'
    }>({
        isOpen: false,
        targetId: '',
        targetName: '',
        mode: 'cancel'
    });
    const [activeMenu, setActiveMenu] = useState<string | null>(null);



    const { refreshEstablishments } = useAuth();

    useEffect(() => {
        fetchBillingInfo();
    }, []);

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

    const fetchBillingInfo = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const response = await api.get('/api/accounts/billing');
            setBillingData(response.data);
        } catch (err) {
            console.error('Failed to fetch billing info:', err);
            if (!silent) toast.error('Failed to load billing information');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

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
            toast.success('Default card updated');
            fetchBillingInfo();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to update default card');
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
                toast.error(err.response?.data?.message || 'Failed to resume subscription');
            }
        } else {
            setSecurityModal({
                isOpen: true,
                targetId: establishmentId,
                targetName: name,
                mode: 'reactivate'
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
        if (est.cancelAtPeriodEnd) {
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs font-bold tracking-widest text-amber-500">
                    <Calendar size={12} />
                    Cancels Soon
                </span>
            );
        }

        switch (est.subscriptionStatus?.toUpperCase()) {
            case 'TRIAL':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-bold tracking-widest text-emerald-500">
                        <Zap size={12} />
                        Trial
                    </span>
                );
            case 'ACTIVE':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-paymint-green/10 border border-paymint-green/20 rounded-lg text-xs font-bold tracking-widest text-paymint-green">
                        <CheckCircle2 size={12} />
                        Active
                    </span>
                );
            case 'CANCELED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg text-xs font-bold tracking-widest text-red-500">
                        <XCircle size={12} />
                        Canceled
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-500/10 border border-gray-500/20 rounded-lg text-xs font-bold tracking-widest text-gray-500">
                        {est.subscriptionStatus ? est.subscriptionStatus.charAt(0).toUpperCase() + est.subscriptionStatus.slice(1).toLowerCase() : 'Unknown'}
                    </span>
                );
        }
    };

    const totalMonthlyCost = billingData?.totalMonthlyCost || 0;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 rounded-lg bg-paymint-green/10 text-paymint-green text-xs font-black tracking-widest border border-paymint-green/20">
                            Billing
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Billing</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Manage payments and subscriptions
                    </p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-gray-400 tracking-widest mb-1">Monthly Cost</p>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">${totalMonthlyCost.toFixed(2)}</span>
                            <span className="text-xs font-bold text-gray-400">/mo</span>
                        </div>
                    </div>
                    <div className="w-px h-10 bg-gray-200 dark:bg-white/10 hidden sm:block" />
                    <button
                        onClick={() => setIsAddCardModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-paymint-green text-black font-bold text-sm hover:bg-emerald-400 transition-all shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Add Payment Method</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Cards', value: billingData?.savedCards.length || 0, icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { label: 'Plans', value: billingData?.establishments.filter(e => e.subscriptionStatus === 'ACTIVE' || e.subscriptionStatus === 'TRIAL').length || 0, icon: Zap, color: 'text-paymint-green', bg: 'bg-paymint-green/10' },
                    {
                        label: 'Next Bill',
                        value: billingData?.nextInvoiceDate
                            ? new Date(billingData.nextInvoiceDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'No Bill',
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
                        className="group relative p-5 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/5 flex items-center gap-4 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none ${stat.bg}`} />
                        <div className="relative z-10 flex items-center gap-4 w-full">
                            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                <stat.icon size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-400 tracking-wide mb-0.5">{stat.label}</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Saved Cards Section */}
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard size={18} className="text-paymint-green" />
                        Cards
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
                            <span className="text-xs font-bold tracking-wide">Add Card</span>
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
                                            <p className="text-xs font-black tracking-[0.2em] text-gray-400">Card</p>
                                            <p className="text-xl font-bold tracking-[0.15em] text-gray-900 dark:text-white">
                                                <span className="opacity-30">••••</span> {card.last4}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-2">
                                            {card.isDefault && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-paymint-green text-black text-[8px] font-black rounded-full tracking-widest shadow-lg shadow-paymint-green/20">
                                                    <div className="w-1 h-1 rounded-full bg-black animate-pulse" />
                                                    Primary
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
                                            <p className="text-xs font-black tracking-[0.2em] text-gray-400">Name</p>
                                            <p className="font-bold tracking-wider text-xs text-gray-800 dark:text-gray-200">{card.cardholderName || 'User'}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-xs font-black tracking-[0.2em] text-gray-400">Expires</p>
                                            <p className="font-bold text-xs text-gray-800 dark:text-gray-200">{card.expMonth}/{card.expYear.toString().slice(-2)}</p>
                                        </div>
                                    </div>

                                    {/* Actions Overlay */}
                                    <div className="absolute inset-0 bg-white/10 dark:bg-black/40 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 z-20">
                                        {!card.isDefault && (
                                            <button
                                                onClick={() => handleSetDefaultCard(card.id)}
                                                className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-400 hover:text-paymint-green hover:border-paymint-green/50 flex items-center justify-center transition-all shadow-xl hover:scale-110"
                                                title="Set as Default"
                                            >
                                                <Star size={20} />
                                            </button>
                                        )}
                                        {card.canDelete ? (
                                            <button
                                                onClick={() => handleDeleteCard(card.id, card.last4)}
                                                className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 text-gray-400 hover:text-red-500 hover:border-red-500/50 flex items-center justify-center transition-all shadow-xl hover:scale-110"
                                                title="Delete Card"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        ) : (
                                            <div className="w-12 h-12 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-gray-300 dark:text-gray-600 flex items-center justify-center cursor-not-allowed" title="Linked to active subscriptions">
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
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign size={18} className="text-paymint-green" />
                        Subscriptions
                    </h2>

                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 overflow-visible shadow-sm">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/5 text-xs font-bold text-gray-500 tracking-wide">
                            <div className="col-span-4">Service</div>
                            <div className="col-span-3">Status</div>
                            <div className="col-span-2">Cost</div>
                            <div className="col-span-3 text-center">Payment</div>
                        </div>

                        {isLoading ? (
                            <div className="p-8 space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : billingData?.establishments.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-gray-400 font-medium">No active subscriptions</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {billingData?.establishments.map((est, index) => (
                                    <motion.div
                                        key={est.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors items-center group relative"
                                    >
                                        {/* Service */}
                                        <div className="col-span-4 flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-sm font-bold text-gray-400 group-hover:text-paymint-green transition-colors">
                                                {est.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-sm">{est.name}</h3>
                                                <p className="text-xs text-gray-500">Standard Plan</p>
                                            </div>
                                        </div>

                                        {/* Status */}
                                        <div className="col-span-3">
                                            {getStatusBadge(est)}
                                        </div>

                                        {/* Cost */}
                                        <div className="col-span-2">
                                            <p className="font-bold text-gray-900 dark:text-white text-sm">${est.monthlyPrice}</p>
                                            <p className="text-xs text-gray-400">/month</p>
                                        </div>

                                        {/* Payment & Actions */}
                                        <div className="col-span-3 flex items-center justify-center relative">
                                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                                {est.paymentCard ? `•••• ${est.paymentCard.last4}` : 'No Card'}
                                            </span>

                                            <div className="absolute right-0">
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
                                                            {est.subscriptionStatus === 'TRIAL' && !est.cancelAtPeriodEnd && (
                                                                <button
                                                                    onClick={() => handleStopTrial(est.id, est.name)}
                                                                    className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 tracking-wide transition-colors"
                                                                >
                                                                    Stop Trial
                                                                </button>
                                                            )}
                                                            {est.subscriptionStatus === 'ACTIVE' && !est.cancelAtPeriodEnd && (
                                                                <button
                                                                    onClick={() => handleCancelSubscription(est.id, est.name)}
                                                                    className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 tracking-wide transition-colors"
                                                                >
                                                                    Cancel Sub
                                                                </button>
                                                            )}
                                                            {(est.cancelAtPeriodEnd || est.subscriptionStatus === 'CANCELED') && (
                                                                <button
                                                                    onClick={() => handleResumeSubscription(est.id, est.name, est.cancelAtPeriodEnd)}
                                                                    className="w-full px-4 py-3 text-left text-xs font-bold text-paymint-green hover:bg-paymint-green/10 tracking-wide transition-colors"
                                                                >
                                                                    {est.subscriptionStatus === 'CANCELED' ? 'Reactivate ($20)' : 'Resume'}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => window.open(`/dashboard`, '_blank')}
                                                                className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 tracking-wide transition-colors flex items-center gap-2"
                                                            >
                                                                <Eye size={14} />
                                                                View Dashboard
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Alert Banner for Cancellations */}
                    {billingData?.establishments.some(e => e.cancelAtPeriodEnd) && (
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-500 tracking-wide mb-1">Ending Soon</h4>
                                <p className="text-xs font-medium text-amber-600/80 dark:text-amber-500/80 leading-relaxed">
                                    Some subscriptions will end after this billing cycle.
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
            />
        </div>
    );
};

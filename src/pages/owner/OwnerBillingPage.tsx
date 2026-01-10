import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, CreditCard } from 'lucide-react';
import api from '../../config/api';
import { useAuth } from '../../context/AuthContext';

interface PaymentMethod {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
}

interface EstablishmentBilling {
    id: string;
    name: string;
    subscriptionStatus: string;
    paymentMethod: PaymentMethod | null;
}

export function OwnerBillingPage() {
    const { establishments } = useAuth();
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [billingEsts, setBillingEsts] = useState<EstablishmentBilling[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchBillingInfo();
    }, []);

    const fetchBillingInfo = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/api/accounts/billing');
            if (response.data) {
                setPaymentMethod(response.data.paymentMethod);
                setBillingEsts(response.data.establishments || []);
            }
        } catch (err) {
            // Demo fallback
            setPaymentMethod({
                brand: 'VISA',
                last4: '4242',
                expMonth: 12,
                expYear: 28,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'TRIAL':
                return (
                    <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 rounded-full text-xs font-bold uppercase">
                        TRIAL
                    </span>
                );
            case 'ACTIVE':
                return (
                    <span className="px-3 py-1 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-full text-xs font-bold uppercase">
                        ACTIVE
                    </span>
                );
            default:
                return (
                    <span className="px-3 py-1 bg-gray-50 dark:bg-white/10 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-full text-xs font-bold uppercase">
                        {status}
                    </span>
                );
        }
    };

    const totalMonthlyCost = establishments.length * 20;

    return (
        <div className="max-w-3xl">
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-white via-gray-50 to-white dark:from-[#0A0A0A] dark:via-[#111] dark:to-[#0A0A0A] p-8 border border-gray-200 dark:border-white/5 shadow-sm mb-8">
                <div className="absolute top-0 right-0 w-96 h-96 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-paymint-green flex items-center justify-center shadow-lg shadow-paymint-green/30">
                            <CreditCard size={28} className="text-black" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Billing & Subscription</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm">Manage payments and subscriptions</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm mb-6"
            >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Method</h2>

                {isLoading ? (
                    <p className="text-gray-500 dark:text-gray-400">Loading...</p>
                ) : paymentMethod ? (
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-2 bg-indigo-600 dark:bg-paymint-green text-white dark:text-black text-xs font-bold rounded-lg uppercase">
                            {paymentMethod.brand}
                        </div>
                        <div>
                            <p className="text-gray-900 dark:text-white font-medium">
                                •••• •••• •••• {paymentMethod.last4}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                            </p>
                        </div>
                    </div>
                ) : (
                    <button className="px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Plus size={18} />
                        Add Payment Method
                    </button>
                )}
            </motion.div>

            {/* Active Subscriptions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/5 p-6 shadow-sm"
            >
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Active Subscriptions</h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="text-left py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Establishment</th>
                                <th className="text-left py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="text-left py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment Method</th>
                                <th className="text-right py-3 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {establishments.map((est) => {
                                // Find establishment-specific billing info if available
                                const estBilling = billingEsts.find(e => e.id === est.id);
                                const estPaymentMethod = estBilling?.paymentMethod || paymentMethod;

                                return (
                                    <tr key={est.id} className="border-b border-gray-50 dark:border-white/5">
                                        <td className="py-4 font-medium text-gray-900 dark:text-white">{est.name}</td>
                                        <td className="py-4">{getStatusBadge(est.subscriptionStatus)}</td>
                                        <td className="py-4">
                                            {estPaymentMethod ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-5 bg-gray-100 dark:bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                                                        {estPaymentMethod.brand}
                                                    </div>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">•••• {estPaymentMethod.last4}</span>
                                                    {estBilling?.paymentMethod && (
                                                        <span className="ml-2 text-[10px] bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">
                                                            Specific
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">No payment method</span>
                                            )}
                                        </td>
                                        <td className="py-4 text-right text-gray-600 dark:text-gray-400">$20.00</td>
                                    </tr>
                                );
                            })}
                            <tr className="font-bold">
                                <td className="py-4 text-gray-900 dark:text-white">Total Monthly</td>
                                <td></td>
                                <td></td>
                                <td className="py-4 text-right text-gray-900 dark:text-white">${totalMonthlyCost.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

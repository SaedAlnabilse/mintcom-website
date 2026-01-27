import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../config/api';
import { ConfirmModal } from './ConfirmModal';
import { QuickInfo } from './QuickInfo';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderDetailModalProps {
    order: any;
    onClose: () => void;
    onRefundSuccess?: () => void;
}

export function OrderDetailModal({ order, onClose, onRefundSuccess }: OrderDetailModalProps) {
    const [confirmConfig, setConfirmConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'success' | 'warning' | 'info';
        confirmText?: string;
        showCancel?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'Jod',
            minimumFractionDigits: 2,
        }).format(value).replace('Jod', '').trim() + ' Jod';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-paymint-green/10 text-paymint-green border-paymint-green/20';
            case 'PENDING':
            case 'HELD':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'REFUNDED':
                return 'bg-paymint-red/10 text-paymint-red border-paymint-red/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const handleRefund = async () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Initiate Refund',
            message: 'Are you sure you want to reverse this transaction? This action is permanent.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.post(`/api/orders/${order.id}/refund`, {
                        reason: 'Refunded via web dashboard',
                    });
                    toast.success('Order reversed');
                    if (onRefundSuccess) onRefundSuccess();
                    onClose();
                } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to process refund');
                }
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-200 dark:border-white/5 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
                <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between relative isolate">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black text-gray-400 tracking-[0.2em]">Transaction Log</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                            <span className="text-[10px] font-black text-paymint-green tracking-widest">Protocol Active</span>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Order #{order.orderNumber}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-10">
                    {/* Order Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                Execution
                                <QuickInfo text="Timestamp when the order was committed." />
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                Status
                                <QuickInfo text="Current state of the settlement." />
                            </p>
                            <span
                                className={`inline-flex px-2 py-0.5 text-[9px] font-black tracking-widest rounded-md border ${getStatusColor(
                                    order.paymentStatus || order.status,
                                )}`}
                            >
                                {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1).toLowerCase() : order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase()}
                            </span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                Protocol
                                <QuickInfo text="Method used to settle the transaction." />
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{order.paymentMethod}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                Operator
                                <QuickInfo text="Staff member authorized for this transaction." />
                            </p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{order.user?.username || 'System'}</p>
                        </div>
                        {order.customer && (
                            <>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                        Client Identity
                                        <QuickInfo text="Name associated with the client account." />
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customer.name}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                        Contact Metadata
                                        <QuickInfo text="Client communication identifier." />
                                    </p>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customer.phone}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Order Items */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-paymint-green rounded-full" />
                            <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-widest">Inventory Manifest</h3>
                        </div>
                        <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-inner">
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {order.items?.map((item: any) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between group hover:bg-white dark:hover:bg-white/[0.02] transition-colors">
                                        <div>
                                            <p className="text-gray-900 dark:text-white font-bold text-sm">{item.name}</p>
                                            <p className="text-[10px] font-black text-gray-400 tracking-widest mt-0.5">
                                                Qty: {item.quantity} × {formatCurrency(item.price || item.basePrice || 0).replace(' Jod', '')}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(item.total || item.finalPrice || 0)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-900 dark:bg-black p-8 rounded-2xl space-y-4 shadow-xl relative overflow-hidden isolate">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-paymint-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />

                        <div className="flex justify-between text-gray-400">
                            <span className="text-[10px] font-black tracking-widest flex items-center gap-1">
                                Subtotal
                            </span>
                            <span className="text-sm font-bold">{formatCurrency(order.subtotal || 0)}</span>
                        </div>
                        {(order.discount || 0) > 0 && (
                            <div className="flex justify-between text-paymint-red">
                                <span className="text-[10px] font-black tracking-widest flex items-center gap-1">
                                    Discount
                                </span>
                                <span className="text-sm font-bold">-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-400">
                            <span className="text-[10px] font-black tracking-widest flex items-center gap-1">
                                Tax Metadata
                            </span>
                            <span className="text-sm font-bold">{formatCurrency(order.tax || 0)}</span>
                        </div>
                        <div className="flex justify-between text-white font-bold text-xl pt-6 border-t border-white/10 mt-2">
                            <span className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-paymint-green animate-pulse" />
                                <span className="text-xs font-black tracking-[0.2em]">Net Settlement</span>
                            </span>
                            <span className="text-2xl tracking-tighter text-paymint-green">{formatCurrency(order.total || 0)}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.note && (
                        <div>
                            <p className="text-[10px] font-black text-gray-400 tracking-widest mb-2 px-1">Special Directives</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/5 font-medium leading-relaxed italic">
                                "{order.note}"
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 px-6 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-black tracking-[0.2em] text-[10px] rounded-2xl transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm"
                        >
                            Close Entry
                        </button>
                        {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                            <button
                                onClick={handleRefund}
                                className="flex-1 py-4 px-6 bg-paymint-red/10 text-paymint-red hover:bg-paymint-red hover:text-white font-black tracking-[0.2em] text-[10px] rounded-2xl transition-all border border-paymint-red/20 active:scale-95 shadow-lg shadow-paymint-red/10"
                            >
                                Reverse Protocol
                            </button>
                        )}
                    </div>
                </div>
            </motion.div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
            />
        </div>
    );
}

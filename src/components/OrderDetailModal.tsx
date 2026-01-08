import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../config/api';
import { ConfirmModal } from './ConfirmModal';

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
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'JOD',
            minimumFractionDigits: 2,
        }).format(value).replace('JOD', '').trim() + ' JOD';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-paymint-green/20 text-paymint-green';
            case 'PENDING':
            case 'HELD':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'REFUNDED':
                return 'bg-accent/20 text-accent';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const handleRefund = async () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Refund Order',
            message: 'Are you sure you want to refund this order? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.post(`/api/orders/${order.id}/refund`, {
                        reason: 'Refunded via web dashboard',
                    });
                    toast.success('Order refunded successfully');
                    if (onRefundSuccess) onRefundSuccess();
                    onClose();
                } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Failed to process refund');
                }
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-colors duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-gray-200/50 dark:shadow-none transition-colors duration-300">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order #{order.orderNumber}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Order Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Date & Time</p>
                            <p className="text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Status</p>
                            <span
                                className={`inline-block px-2 py-1 text-xs font-bold rounded ${getStatusColor(
                                    order.paymentStatus || order.status,
                                )}`}
                            >
                                {order.paymentStatus || order.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Payment Method</p>
                            <p className="text-gray-900 dark:text-white">{order.paymentMethod}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Staff</p>
                            <p className="text-gray-900 dark:text-white">{order.user?.username || 'Unknown'}</p>
                        </div>
                        {order.customer && (
                            <>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Customer</p>
                                    <p className="text-gray-900 dark:text-white">{order.customer.name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Phone</p>
                                    <p className="text-gray-900 dark:text-white">{order.customer.phone}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Items</h3>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl divide-y divide-gray-200 dark:divide-gray-600 border border-gray-100 dark:border-transparent transition-colors">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-900 dark:text-white font-medium">{item.name}</p>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                                            Qty: {item.quantity} x {formatCurrency(item.price || item.basePrice || 0)}
                                        </p>
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium">{formatCurrency(item.total || item.finalPrice || 0)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-2 border border-gray-100 dark:border-transparent transition-colors">
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal || 0)}</span>
                        </div>
                        {(order.discount || 0) > 0 && (
                            <div className="flex justify-between text-accent dark:text-accent">
                                <span>Discount</span>
                                <span>-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-600 dark:text-gray-300">
                            <span>Tax</span>
                            <span>{formatCurrency(order.tax || 0)}</span>
                        </div>
                        <div className="flex justify-between text-gray-900 dark:text-white font-bold text-lg pt-2 border-t border-gray-200 dark:border-gray-600">
                            <span>Total</span>
                            <span>{formatCurrency(order.total || 0)}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.note && (
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Note</p>
                            <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-transparent">{order.note}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                            <button
                                onClick={handleRefund}
                                className="flex-1 py-3 px-4 bg-accent/5 text-accent hover:bg-accent/10 dark:bg-accent dark:text-white dark:hover:bg-accent/90 font-bold rounded-xl transition-colors"
                            >
                                Refund Order
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-700 dark:border-transparent dark:text-white dark:hover:bg-gray-600 font-bold rounded-xl transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>

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




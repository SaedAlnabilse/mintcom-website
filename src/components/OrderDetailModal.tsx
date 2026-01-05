import api from '../config/api';

interface OrderDetailModalProps {
    order: any;
    onClose: () => void;
    onRefundSuccess?: () => void;
}

export function OrderDetailModal({ order, onClose, onRefundSuccess }: OrderDetailModalProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-500/20 text-green-400';
            case 'PENDING':
            case 'HELD':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'REFUNDED':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const handleRefund = async () => {
        if (!confirm('Are you sure you want to refund this order?')) return;

        try {
            await api.post(`/api/orders/${order.id}/refund`, {
                reason: 'Refunded via web dashboard',
            });
            if (onRefundSuccess) onRefundSuccess();
            onClose();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to process refund');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Order #{order.orderNumber}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
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
                            <p className="text-gray-400 text-sm">Date & Time</p>
                            <p className="text-white">{formatDate(order.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Status</p>
                            <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                    order.paymentStatus || order.status,
                                )}`}
                            >
                                {order.paymentStatus || order.status}
                            </span>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Payment Method</p>
                            <p className="text-white">{order.paymentMethod}</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Staff</p>
                            <p className="text-white">{order.user?.username || 'Unknown'}</p>
                        </div>
                        {order.customer && (
                            <>
                                <div>
                                    <p className="text-gray-400 text-sm">Customer</p>
                                    <p className="text-white">{order.customer.name}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Phone</p>
                                    <p className="text-white">{order.customer.phone}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-lg font-medium text-white mb-3">Items</h3>
                        <div className="bg-gray-700/50 rounded-lg divide-y divide-gray-600">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="p-3 flex items-center justify-between">
                                    <div>
                                        <p className="text-white font-medium">{item.name}</p>
                                        <p className="text-gray-400 text-sm">
                                            Qty: {item.quantity} x {formatCurrency(item.price || item.basePrice || 0)}
                                        </p>
                                    </div>
                                    <p className="text-white font-medium">{formatCurrency(item.total || item.finalPrice || 0)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-700/50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-gray-300">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal || 0)}</span>
                        </div>
                        {(order.discount || 0) > 0 && (
                            <div className="flex justify-between text-red-400">
                                <span>Discount</span>
                                <span>-{formatCurrency(order.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-300">
                            <span>Tax</span>
                            <span>{formatCurrency(order.tax || 0)}</span>
                        </div>
                        <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-gray-600">
                            <span>Total</span>
                            <span>{formatCurrency(order.total || 0)}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.note && (
                        <div>
                            <p className="text-gray-400 text-sm">Note</p>
                            <p className="text-white">{order.note}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                            <button
                                onClick={handleRefund}
                                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Refund Order
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

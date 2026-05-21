import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../config/api';
import { QuickInfo } from './QuickInfo';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../hooks/useScrollLock';
import { useCurrency } from '../context/CurrencyContext';
import { formatInputPlaceholder } from '../utils/textCase';

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
}

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price?: number;
    basePrice?: number;
    total?: number;
    finalPrice?: number;
    refundedFromOrderItemId?: string | null;
}

export interface Order {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentStatus?: string;
    orderType?: 'PAID' | 'PAID_TAX_CHANGED' | 'REFUNDED';
    isTaxChanged?: boolean;
    paymentMethod: string;
    cardType?: string;
    otherPaymentMethod?: string;
    user?: { username: string };
    employeeName?: string;
    refundedByName?: string;
    refundReason?: string;
    reason?: string;
    refund_reason?: string;
    customer?: { name: string; phone: string };
    items?: OrderItem[];
    subtotal?: number;
    discount?: number;
    serviceChargeAmount?: number;
    serviceChargeName?: string;
    serviceChargeNameSnapshot?: string;
    tax?: number;
    total?: number;
    note?: string;
    refundOrders?: Array<{ items?: OrderItem[] }>;
}

const getOrderItemId = (item: any): string => String(item?.id || item?.orderItemId || '');

const getItemTotal = (item: any): number => {
    const numeric = Number(item?.total ?? item?.finalPrice ?? item?.price ?? 0);
    return Number.isFinite(numeric) ? Math.abs(numeric) : 0;
};

const getItemUnitTotal = (item: any): number =>
    getItemTotal(item) / Math.max(1, Number(item?.quantity || 1));

const getRefundItemSignature = (item: any): string => {
    const itemId = String(item?.itemId || item?.item?.id || '');
    const basePrice = Math.abs(
        Number(item?.basePrice ?? item?.unitPrice ?? item?.price ?? 0),
    ).toFixed(4);
    const attributes = (item?.chosenAttributes || item?.selectedAttributes || [])
        .map((attr: any) =>
            String(attr?.subAttributeId || attr?.subAttribute?.id || attr?.id || ''),
        )
        .filter(Boolean)
        .sort()
        .join(',');

    return `${itemId}|${basePrice}|${attributes}`;
};

const getRefundedQuantities = (order: any) => {
    const refunded = new Map<string, number>();
    (order?.refundOrders || []).forEach((refundOrder: any) => {
        (refundOrder?.items || []).forEach((item: any) => {
            const quantity = Math.max(0, Number(item?.quantity || 0));
            const originalId = item?.refundedFromOrderItemId;
            if (originalId) {
                refunded.set(originalId, (refunded.get(originalId) || 0) + quantity);
                return;
            }

            const signature = getRefundItemSignature(item);
            refunded.set(signature, (refunded.get(signature) || 0) + quantity);
        });
    });
    return refunded;
};

export interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
    onRefundSuccess?: () => void;
    canRefund?: boolean;
}

export function OrderDetailModal({ order, onClose, onRefundSuccess, canRefund = true }: OrderDetailModalProps) {
    const { t } = useTranslation();
    const [isRefundReasonModalOpen, setIsRefundReasonModalOpen] = useState(false);
    const [refundReason, setRefundReason] = useState('');
    const [refundReasonError, setRefundReasonError] = useState('');
    const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);
    const [restockItems, setRestockItems] = useState(false);
    const [selectedRefundItems, setSelectedRefundItems] = useState<Record<string, number>>({});

    // Compute if any item has trackStock enabled - check both possible data shapes
    const hasStockTrackedItems = order?.items?.some((item: any) => item?.trackStock || item?.item?.trackStock) || false;

    useScrollLock(!!order);

    // Use global currency context instead of hardcoded JOD
    const { formatAmount } = useCurrency();
    const formatCurrency = (value: number) => formatAmount(value);
    const isNegativeTotal = (order.total || 0) < 0;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString(t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-mintcom-green/10 text-mintcom-green border-mintcom-green/20';
            case 'PENDING':
            case 'HELD':
                return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'REFUNDED':
            case 'PARTIALLY_REFUNDED':
                return 'bg-mintcom-red/10 text-mintcom-red border-mintcom-red/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const isRefundable =
        order.paymentStatus === 'COMPLETED' ||
        order.status === 'COMPLETED' ||
        order.status === 'PARTIALLY_REFUNDED';

    const refundableItems = useMemo(() => {
        const refunded = getRefundedQuantities(order);
        return (order.items || [])
            .map((item: any) => {
                const orderItemId = getOrderItemId(item);
                const refundedQuantity =
                    refunded.get(orderItemId) || refunded.get(getRefundItemSignature(item)) || 0;
                const remainingRefundQuantity = Math.max(
                    0,
                    Number(item?.quantity || 0) - refundedQuantity,
                );
                return { ...item, orderItemId, remainingRefundQuantity };
            })
            .filter((item: any) => item.orderItemId && item.remainingRefundQuantity > 0);
    }, [order]);

    const selectedRefundLines = useMemo(
        () =>
            refundableItems
                .map((item: any) => {
                    const quantity = Math.min(
                        Math.max(0, Number(selectedRefundItems[item.orderItemId] || 0)),
                        Number(item.remainingRefundQuantity || 0),
                    );
                    return { item, orderItemId: item.orderItemId, quantity };
                })
                .filter(line => line.quantity > 0),
        [refundableItems, selectedRefundItems],
    );

    const selectedRefundAmount = selectedRefundLines.reduce(
        (sum, line) => sum + getItemUnitTotal(line.item) * line.quantity,
        0,
    );

    const handleRefund = async () => {
        if (!canRefund) {
            toast.error(t('orders.messages.refundFailed'));
            return;
        }

        setRefundReason('');
        setRefundReasonError('');
        setRestockItems(false);
        setSelectedRefundItems(
            refundableItems.reduce((acc: Record<string, number>, item: any) => {
                acc[item.orderItemId] = Number(item.remainingRefundQuantity || 1);
                return acc;
            }, {}),
        );
        setIsRefundReasonModalOpen(true);
    };

    const getOrderStatusLabel = (): string => {
        const isTaxChangedPaid =
            (order.orderType === 'PAID_TAX_CHANGED' || !!order.isTaxChanged) &&
            ((order.paymentStatus || order.status) === 'COMPLETED');
        if (isTaxChangedPaid) {
            return t('orders.status.paidTaxChanged');
        }
        const rawStatus = (order.paymentStatus || order.status || 'PENDING').toLowerCase();
        const statusKey = rawStatus === 'pending' || rawStatus === 'held' ? 'onHold' : rawStatus;
        return t(`orders.status.${statusKey}` as any);
    };

    const submitRefundWithReason = async () => {
        const trimmedReason = refundReason.trim();
        if (!trimmedReason) {
            setRefundReasonError('Refund reason is required');
            return;
        }
        if (selectedRefundLines.length === 0) {
            setRefundReasonError('Select at least one item to refund');
            return;
        }

        try {
            setIsRefundSubmitting(true);
            await api.post(`/api/orders/${order.id}/refund-items`, {
                refundReason: trimmedReason,
                restockItems: restockItems,
                items: selectedRefundLines.map(line => ({
                    orderItemId: line.orderItemId,
                    quantity: line.quantity,
                })),
            });
            toast.success(t('orders.messages.refundSuccess'));
            setIsRefundReasonModalOpen(false);
            if (onRefundSuccess) onRefundSuccess();
            onClose();
        } catch (err) {
            toast.error((err as ApiError).response?.data?.message || t('orders.messages.refundFailed'));
        } finally {
            setIsRefundSubmitting(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <div
                dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                className="fixed inset-0 z-[9999] popup-surface flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 dark:bg-black/80 backdrop-blur-sm font-sans"
            >
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                    className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden relative scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-white/20 custom-scrollbar-modal"
                >
                    {/* Mobile drag handle */}
                    <div className="sm:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-white dark:bg-[#1E293B] z-10">
                        <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                    </div>

                    <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between relative isolate">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-mintcom-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="label-strong font-outfit">{t('orders.details.title')}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                <span className="label-strong font-outfit text-mintcom-green">{t('orders.details.processed')}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{t('orders.table.order')} #{order.orderNumber}</h2>
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
                                <p className="label-strong font-outfit mb-2 flex items-center gap-1">
                                    {t('orders.details.date')}
                                    <QuickInfo text={t('orders.details.dateTip')} />
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                                <p className="label-strong font-outfit mb-2 flex items-center gap-1">
                                    {t('orders.details.status')}
                                    <QuickInfo text={t('orders.details.statusTip')} />
                                </p>
                                <span
                                    className={`inline-flex px-2 py-0.5 label-strong font-outfit rounded-md border ${getStatusColor(
                                        order.paymentStatus || order.status,
                                    )}`}
                                >
                                    {getOrderStatusLabel()}
                                </span>
                            </div>
                            <div>
                                <p className="label-strong font-outfit mb-2 flex items-center gap-1">
                                    {t('orders.details.payment')}
                                    <QuickInfo text={t('orders.details.paymentTip')} />
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {order.paymentMethod === 'CARD' && order.cardType
                                        ? t('orders.payment.cardWithBrand', { brand: order.cardType })
                                        : order.paymentMethod === 'CASH'
                                            ? t('orders.payment.cash')
                                            : order.otherPaymentMethod || order.paymentMethod}
                                </p>
                            </div>
                            <div>
                                <p className="label-strong font-outfit mb-2 flex items-center gap-1">
                                    {t('orders.details.staff')}
                                    <QuickInfo text={t('orders.details.staffTip')} />
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{order.employeeName || order.user?.username || t('common.pos')}</p>
                            </div>
                            {order.refundedByName && (
                                <div>
                                    <p className="label-strong font-outfit mb-2 flex items-center gap-1">
                                        {t('orders.details.refundedBy')}
                                        <QuickInfo text={t('orders.details.refundedByTip')} />
                                    </p>
                                    <p className="text-sm font-bold text-mintcom-red">{order.refundedByName}</p>
                                </div>
                            )}
                            {((order.paymentStatus || order.status) === 'REFUNDED') && (
                                <div className="col-span-2 md:col-span-4">
                                    <p className="label-strong font-outfit mb-2">
                                        Refund Reason
                                    </p>
                                    <p className="text-sm font-bold text-mintcom-red break-words">
                                        {order.refundReason || order.reason || order.refund_reason || 'N/A'}
                                    </p>
                                </div>
                            )}
                            {order.customer && (
                                <>
                                    <div className="col-span-2">
                                        <p className="label-strong font-outfit mb-2 flex items-center gap-1">
                                            {t('orders.details.customer')}
                                            <QuickInfo text={t('orders.details.customerTip')} />
                                        </p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customer.name}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="label-strong font-outfit mb-2 flex items-center gap-1">
                                            {t('orders.details.contact')}
                                            <QuickInfo text={t('orders.details.contactTip')} />
                                        </p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customer.phone}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Order Items */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-widest">{t('orders.details.items')}</h3>
                            </div>
                            <div className="bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-inner">
                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                    {order.items?.map((item) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between group hover:bg-white dark:hover:bg-white/[0.02] transition-colors">
                                            <div>
                                                <p className="text-gray-900 dark:text-white font-bold text-sm">{item.name}</p>
                                                <p className="label-strong font-outfit mt-0.5">
                                                    {t('orders.details.qty')}: {item.quantity.toLocaleString(t('common.locale'))} x {formatCurrency(item.price || item.basePrice || 0)}
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
                            <div className="absolute top-0 right-0 w-32 h-32 bg-mintcom-green/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />

                            <div className="flex justify-between text-gray-400">
                                <span className="label-strong font-outfit flex items-center gap-1">
                                    {t('orders.details.subtotal')}
                                </span>
                                <span className="text-sm font-bold">{formatCurrency(order.subtotal || 0)}</span>
                            </div>
                            {(order.discount || 0) > 0 && (
                                <div className="flex justify-between text-mintcom-red">
                                    <span className="label-strong font-outfit flex items-center gap-1">
                                        {t('orders.details.discount')}
                                    </span>
                                    <span className="text-sm font-bold">-{formatCurrency(order.discount || 0)}</span>
                                </div>
                            )}
                            {(order.serviceChargeAmount || 0) > 0 && (
                                <div className="flex justify-between text-gray-400">
                                    <span className="label-strong font-outfit flex items-center gap-1">
                                        {order.serviceChargeName || order.serviceChargeNameSnapshot || t('orders.details.serviceCharge', { defaultValue: 'Service Charge' })}
                                    </span>
                                    <span className="text-sm font-bold">{formatCurrency(order.serviceChargeAmount || 0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-400">
                                <span className="label-strong font-outfit flex items-center gap-1">
                                    {t('orders.details.tax')}
                                </span>
                                <span className="text-sm font-bold">{formatCurrency(order.tax || 0)}</span>
                            </div>
                            <div className="flex justify-between text-white font-bold text-xl pt-6 border-t border-white/10 mt-2">
                                <span className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${isNegativeTotal ? 'bg-mintcom-red' : 'bg-mintcom-green'}`} />
                                    <span className="text-xs font-black tracking-[0.2em]">{t('orders.details.total')}</span>
                                </span>
                                <span className={`text-2xl tracking-tighter ${isNegativeTotal ? 'text-mintcom-red' : 'text-mintcom-green'}`}>
                                    {formatCurrency(order.total || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Notes */}
                        {order.note && (
                            <div>
                                <p className="label-strong font-outfit mb-2 px-1">{t('orders.details.notes')}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/5 font-medium leading-relaxed italic">
                                    "{order.note}"
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-start gap-4 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 px-6 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-black tracking-[0.2em] text-xs rounded-2xl transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm"
                            >
                                {t('common.close')}
                            </button>
                            {isRefundable && (
                                <div className="flex-1">
                                    <button
                                        onClick={() => {
                                            if (!canRefund) return;
                                            handleRefund();
                                        }}
                                        disabled={!canRefund}
                                        className={`w-full py-4 px-6 font-black tracking-[0.2em] text-xs rounded-2xl transition-all border active:scale-95 ${canRefund
                                            ? 'bg-mintcom-red/10 text-mintcom-red hover:bg-mintcom-red hover:text-white border-mintcom-red/20 shadow-lg shadow-mintcom-red/10'
                                            : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10 cursor-not-allowed'
                                            }`}
                                    >
                                        {t('orders.actions.refund')}
                                    </button>
                                    {!canRefund && (
                                        <p className="mt-2 text-xs font-semibold text-red-600">
                                            {t('orders.messages.noRefundPermission')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {isRefundReasonModalOpen && (
                    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/60 p-4">
                        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/10 p-5 sm:p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {t('orders.details.refundConfirmTitle')}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                {t('orders.details.refundConfirmMessage')}
                            </p>
                            <div className="mt-4 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {t('orders.details.items')}
                                    </span>
                                    <span className="text-sm font-bold text-mintcom-red">
                                        {formatCurrency(selectedRefundAmount)}
                                    </span>
                                </div>
                                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                                    {refundableItems.map((item: any) => {
                                        const selectedQty = Number(selectedRefundItems[item.orderItemId] || 0);
                                        const selected = selectedQty > 0;
                                        const remaining = Number(item.remainingRefundQuantity || 0);
                                        return (
                                            <div
                                                key={item.orderItemId}
                                                className={`rounded-xl border p-3 ${selected
                                                    ? 'border-mintcom-red bg-mintcom-red/5'
                                                    : 'border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedRefundItems(prev => {
                                                                const next = { ...prev };
                                                                if (next[item.orderItemId]) {
                                                                    delete next[item.orderItemId];
                                                                } else {
                                                                    next[item.orderItemId] = 1;
                                                                }
                                                                return next;
                                                            });
                                                        }}
                                                        className={`h-5 w-5 rounded-full border ${selected ? 'border-mintcom-red bg-mintcom-red' : 'border-gray-400'}`}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                                                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                            Remaining: {remaining}
                                                        </p>
                                                    </div>
                                                    {selected && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedRefundItems(prev => ({
                                                                        ...prev,
                                                                        [item.orderItemId]: Math.max(1, selectedQty - 1),
                                                                    }))
                                                                }
                                                                disabled={selectedQty <= 1}
                                                                className="h-8 w-8 rounded-full border border-gray-300 text-sm font-bold disabled:opacity-40 dark:border-white/15"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="min-w-5 text-center text-sm font-black text-gray-900 dark:text-white">
                                                                {selectedQty}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedRefundItems(prev => ({
                                                                        ...prev,
                                                                        [item.orderItemId]: Math.min(remaining, selectedQty + 1),
                                                                    }))
                                                                }
                                                                disabled={selectedQty >= remaining}
                                                                className="h-8 w-8 rounded-full border border-gray-300 text-sm font-bold disabled:opacity-40 dark:border-white/15"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm font-normal text-gray-800 dark:text-gray-100 mb-2">
                                    Refund reason
                                </label>
                                <textarea maxLength={2000}
                                    value={refundReason}
                                    onChange={(e) => {
                                        setRefundReason(e.target.value);
                                        if (refundReasonError && e.target.value.trim()) {
                                            setRefundReasonError('');
                                        }
                                    }}
                                    placeholder={formatInputPlaceholder("Enter refund reason", t('common.locale'))}
                                    rows={4}
                                    className="w-full rounded-xl border border-gray-300 dark:border-white/15 bg-white dark:bg-[#0F172A] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-mintcom-green/40"
                                />
                                {refundReasonError && (
                                    <p className="mt-2 text-sm text-red-600">{refundReasonError}</p>
                                )}
                            </div>

                            {/* Restock Toggle */}
                            {hasStockTrackedItems && (
                                <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-semibold ${restockItems ? 'text-mintcom-green dark:text-mintcom-green' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {t('orders.reports.restockItems')}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {t('orders.reports.restockDescription')}
                                        </span>
                                    </div>
                                    <label className="relative inline-flex cursor-pointer items-center">
                                        <input
                                            type="checkbox"
                                            className="peer sr-only"
                                            checked={restockItems}
                                            onChange={(e) => setRestockItems(e.target.checked)}
                                        />
                                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-mintcom-green peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-mintcom-green/20 dark:border-gray-600 dark:bg-gray-700"></div>
                                    </label>
                                </div>
                            )}

                            <div className="mt-5 flex gap-3">
                                <button
                                    onClick={() => {
                                        if (isRefundSubmitting) return;
                                        setIsRefundReasonModalOpen(false);
                                        setRefundReason('');
                                        setRefundReasonError('');
                                        setSelectedRefundItems({});
                                    }}
                                    className="flex-1 rounded-xl border border-gray-300 dark:border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={submitRefundWithReason}
                                    disabled={isRefundSubmitting}
                                    className="flex-1 rounded-xl bg-mintcom-red px-4 py-2.5 text-sm font-semibold text-white hover:bg-mintcom-red/90 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isRefundSubmitting ? t('common.loading') : t('orders.actions.refund')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AnimatePresence>,
        document.body
    );
}



import { useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../config/api';
import { ConfirmModal } from './ConfirmModal';
import { QuickInfo } from './QuickInfo';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollLock } from '../hooks/useScrollLock';
import { useCurrency } from '../context/CurrencyContext';

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
}

export interface Order {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    paymentStatus?: string;
    paymentMethod: string;
    cardType?: string;
    otherPaymentMethod?: string;
    user?: { username: string };
    employeeName?: string;
    refundedByName?: string;
    customer?: { name: string; phone: string };
    items?: OrderItem[];
    subtotal?: number;
    discount?: number;
    tax?: number;
    total?: number;
    note?: string;
}

export interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
    onRefundSuccess?: () => void;
}

export function OrderDetailModal({ order, onClose, onRefundSuccess }: OrderDetailModalProps) {
    const { t } = useTranslation();
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

    useScrollLock(!!order);

    // Use global currency context instead of hardcoded JOD
    const { formatAmount } = useCurrency();
    const formatCurrency = (value: number) => formatAmount(value);

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
            title: t('orders.details.refundConfirmTitle'),
            message: t('orders.details.refundConfirmMessage'),
            type: 'danger',
            onConfirm: async () => {
                try {
                    await api.post(`/api/orders/${order.id}/refund`, {
                        reason: t('orders.messages.refundReasonWeb'),
                    });
                    toast.success(t('orders.messages.refundSuccess'));
                    if (onRefundSuccess) onRefundSuccess();
                    onClose();
                } catch (err) {
                    toast.error((err as ApiError).response?.data?.message || t('orders.messages.refundFailed'));
                }
            }
        });
    };

    return createPortal(
        <AnimatePresence>
            <div
                dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-[9999] transition-colors duration-300 font-sans"
            >
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: "spring", duration: 0.4, bounce: 0.2 }}
                    className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl border border-gray-200 dark:border-white/5 w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden shadow-2xl relative scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-gray-300 dark:hover:scrollbar-thumb-white/20 custom-scrollbar-modal"
                >
                    {/* Mobile drag handle */}
                    <div className="sm:hidden flex justify-center pt-3 pb-1 sticky top-0 bg-white dark:bg-[#1E293B] z-10">
                        <div className="w-10 h-1 bg-gray-300 dark:bg-white/20 rounded-full" />
                    </div>

                    <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between relative isolate">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-paymint-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-10" />
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-black text-gray-400 tracking-widest">{t('orders.details.title')}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                <span className="text-xs font-black text-paymint-green tracking-widest">{t('orders.details.processed')}</span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{t('orders.table.order')} #{order.orderNumber}</h2>
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
                                <p className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                    {t('orders.details.date')}
                                    <QuickInfo text={t('orders.details.dateTip')} />
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatDate(order.createdAt)}</p>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                    {t('orders.details.status')}
                                    <QuickInfo text={t('orders.details.statusTip')} />
                                </p>
                                <span
                                    className={`inline-flex px-2 py-0.5 text-xs font-black tracking-widest rounded-md border ${getStatusColor(
                                        order.paymentStatus || order.status,
                                    )}`}
                                >
                                    {t(`orders.status.${(order.paymentStatus || order.status || 'PENDING').toLowerCase() === 'pending' || (order.paymentStatus || order.status || 'PENDING').toLowerCase() === 'held' ? 'onHold' : (order.paymentStatus || order.status || 'PENDING').toLowerCase()}` as any)}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
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
                                <p className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                    {t('orders.details.staff')}
                                    <QuickInfo text={t('orders.details.staffTip')} />
                                </p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{order.employeeName || order.user?.username || t('common.pos')}</p>
                            </div>
                            {order.refundedByName && (
                                <div>
                                    <p className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                        {t('orders.details.refundedBy')}
                                        <QuickInfo text={t('orders.details.refundedByTip')} />
                                    </p>
                                    <p className="text-sm font-bold text-paymint-red">{order.refundedByName}</p>
                                </div>
                            )}
                            {order.customer && (
                                <>
                                    <div className="col-span-2">
                                        <p className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
                                            {t('orders.details.customer')}
                                            <QuickInfo text={t('orders.details.customerTip')} />
                                        </p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{order.customer.name}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-black text-gray-400 tracking-widest mb-2 flex items-center gap-1">
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
                                                <p className="text-xs font-black text-gray-400 tracking-widest mt-0.5">
                                                    {t('orders.details.qty')}: {item.quantity.toLocaleString(t('common.locale'))} × {formatCurrency(item.price || item.basePrice || 0)}
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
                                <span className="text-xs font-black tracking-widest flex items-center gap-1">
                                    {t('orders.details.subtotal')}
                                </span>
                                <span className="text-sm font-bold">{formatCurrency(order.subtotal || 0)}</span>
                            </div>
                            {(order.discount || 0) > 0 && (
                                <div className="flex justify-between text-paymint-red">
                                    <span className="text-xs font-black tracking-widest flex items-center gap-1">
                                        {t('orders.details.discount')}
                                    </span>
                                    <span className="text-sm font-bold">-{formatCurrency(order.discount || 0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-400">
                                <span className="text-xs font-black tracking-widest flex items-center gap-1">
                                    {t('orders.details.tax')}
                                </span>
                                <span className="text-sm font-bold">{formatCurrency(order.tax || 0)}</span>
                            </div>
                            <div className="flex justify-between text-white font-bold text-xl pt-6 border-t border-white/10 mt-2">
                                <span className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-paymint-green animate-pulse" />
                                    <span className="text-xs font-black tracking-[0.2em]">{t('orders.details.total')}</span>
                                </span>
                                <span className="text-2xl tracking-tighter text-paymint-green">{formatCurrency(order.total || 0)}</span>
                            </div>
                        </div>

                        {/* Notes */}
                        {order.note && (
                            <div>
                                <p className="text-xs font-black text-gray-400 tracking-widest mb-2 px-1">{t('orders.details.notes')}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.02] p-4 rounded-xl border border-gray-100 dark:border-white/5 font-medium leading-relaxed italic">
                                    "{order.note}"
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 px-6 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-black tracking-[0.2em] text-xs rounded-2xl transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm"
                            >
                                {t('common.close')}
                            </button>
                            {(order.paymentStatus === 'COMPLETED' || order.status === 'COMPLETED') && (
                                <button
                                    onClick={handleRefund}
                                    className="flex-1 py-4 px-6 bg-paymint-red/10 text-paymint-red hover:bg-paymint-red hover:text-white font-black tracking-[0.2em] text-xs rounded-2xl transition-all border border-paymint-red/20 active:scale-95 shadow-lg shadow-paymint-red/10"
                                >
                                    {t('orders.actions.refund')}
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
        </AnimatePresence>,
        document.body
    );
}

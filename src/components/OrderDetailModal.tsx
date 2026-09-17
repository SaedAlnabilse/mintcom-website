import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { QuickInfo } from './QuickInfo';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton } from './ui';
import { useCurrency } from '../context/CurrencyContext';
import { OrderRefundModal } from './OrderRefundModal';
import { StatValue } from './ui/StatValue';
import { formatPaymentBrandName } from '../utils/paymentCard';
import { formatInEstablishmentTimezone } from '../utils/establishmentTime';
import { useAuth } from '../context/AuthContext';

const stripNameMarkers = (raw: string) =>
    (raw || '')
        .replace(/\[\s*(?:history|deleted|archived)\s*\]/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

export interface OrderItem {
    id: string;
    orderItemId?: string;
    itemId?: string;
    name: string;
    quantity: number;
    price?: number;
    basePrice?: number;
    unitPrice?: number;
    finalUnitPrice?: number;
    total?: number;
    finalPrice?: number;
    refundedFromOrderItemId?: string | null;
    trackStock?: boolean;
    item?: { id?: string; trackStock?: boolean };
    chosenAttributes?: any[];
    selectedAttributes?: any[];
    taxId?: string;
    taxNameSnapshot?: string;
    taxRateSnapshot?: number;
    taxAmountSnapshot?: number;
}

export const getItemUnitPrice = (item: OrderItem): number => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const candidate = Number(
        item.unitPrice ??
        item.finalUnitPrice ??
        item.price ??
        item.basePrice
    );
    if (Number.isFinite(candidate) && candidate > 0) {
        return candidate;
    }
    if (Number.isFinite(item.finalPrice) && Number(item.finalPrice) > 0) {
        return Number(item.finalPrice);
    }
    if (Number.isFinite(item.total) && Number(item.total) > 0) {
        return Number(item.total) / qty;
    }
    return 0;
};

export const getItemLineTotal = (item: OrderItem): number => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = getItemUnitPrice(item);
    const rawTotal = Number(item.total);

    if (Number.isFinite(rawTotal) && rawTotal > 0) {
        // If qty > 1 and rawTotal equals single unit price, rawTotal was mistakenly set to unit price
        if (qty > 1 && Math.abs(rawTotal - unitPrice) < 0.01) {
            return qty * unitPrice;
        }
        return rawTotal;
    }

    if (unitPrice > 0) {
        return qty * unitPrice;
    }

    const finalPrice = Number(item.finalPrice);
    if (Number.isFinite(finalPrice) && finalPrice > 0) {
        return qty > 1 ? qty * finalPrice : finalPrice;
    }

    return 0;
};

export interface Order {
    id: string;
    orderNumber: string;
    invoiceNumber?: string | null;
    createdAt: string;
    status: string;
    paymentStatus?: string;
    orderType?: 'PAID' | 'PAID_TAX_CHANGED' | 'REFUNDED';
    isTaxChanged?: boolean;
    isTaxCustomized?: boolean;
    taxRate?: number;
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
    serviceChargeType?: 'PERCENTAGE' | 'FIXED';
    serviceChargeValue?: number;
    serviceChargeTypeSnapshot?: 'PERCENTAGE' | 'FIXED';
    serviceChargeValueSnapshot?: number;
    serviceChargeOverrideMode?: 'DEFAULT' | 'NONE' | 'CUSTOM';
    serviceChargeTaxable?: boolean;
    serviceChargeTaxableSnapshot?: boolean;
    isServiceChargeChanged?: boolean;
    serviceChargeReason?: string;
    tax?: number;
    taxBreakdown?: Array<{
        id: string;
        name: string;
        rate: number;
        amount: number;
    }>;
    total?: number;
    note?: string;
    refundOrders?: Array<{ items?: OrderItem[] }>;
    tenders?: Array<{
        method: string;
        label: string;
        amount: number;
        tendered?: number;
        change?: number;
        isRefund?: boolean;
        cardType?: string;
        otherPaymentMethod?: string;
    }>;
    refundTenders?: Array<{
        method: string;
        label: string;
        amount: number;
        isRefund?: boolean;
        cardType?: string;
        otherPaymentMethod?: string;
    }>;
}

export interface OrderDetailModalProps {
    order: Order;
    onClose: () => void;
    onRefundSuccess?: () => void;
    canRefund?: boolean;
    canRestock?: boolean;
}

export function OrderDetailModal({ order, onClose, onRefundSuccess, canRefund = true, canRestock = true }: OrderDetailModalProps) {
    const { t } = useTranslation();
    const { currentEstablishment } = useAuth();
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

    // Use global currency context instead of hardcoded JOD
    const { currencySymbol, formatAmount } = useCurrency();
    const formatCurrency = (value: number) => formatAmount(value);
    const isNegativeTotal = (order.total || 0) < 0;

    // Tax & Service Charge summary labels — mirror the POS receipt / order
    // details: split tax into items tax and service charge tax, and show explicit
    // tax-exclusive subtotal and tax-inclusive total labels.
    const summaryLabels = useMemo(() => {
        // Subtotal & Total labels: explicit tax-exclusive / tax-inclusive indicators
        const subtotalLabel = t('orders.details.subtotalExclTaxLabel', {
            defaultValue: 'Subtotal (excl. Tax)',
        });
        const totalLabel = t('orders.details.totalInclTaxLabel', {
            defaultValue: 'TOTAL (incl. Tax)',
        });

        // ── Service charge ────────────────────────────────────────────────
        let serviceChargeLabel =
            order.serviceChargeName ||
            order.serviceChargeNameSnapshot ||
            t('orders.details.serviceCharge', { defaultValue: 'Service Charge' });
        const scType = order.serviceChargeType || order.serviceChargeTypeSnapshot;
        const scValue = Number(
            order.serviceChargeValue ?? order.serviceChargeValueSnapshot,
        );
        // serviceChargeValue is already a percent (e.g. 15 → "(15%)") — show as-is.
        if (scType === 'PERCENTAGE' && Number.isFinite(scValue) && scValue > 0) {
            serviceChargeLabel += ` (${Number(scValue.toFixed(2))}%)`;
        }
        const serviceChargeChanged =
            order.serviceChargeOverrideMode === 'CUSTOM' ||
            order.serviceChargeOverrideMode === 'NONE' ||
            Boolean(order.isServiceChargeChanged);
        if (serviceChargeChanged) {
            serviceChargeLabel += ` (${t('orders.details.changed', {
                defaultValue: 'Changed',
            })})`;
        }
        const serviceChargeReason = (order.serviceChargeReason || '').trim();

        // ── Tax Breakdown (Items vs Service Charge) ────────────────────────
        const taxChanged =
            Boolean(order.isTaxChanged) ||
            order.orderType === 'PAID_TAX_CHANGED' ||
            Boolean(order.isTaxCustomized);

        const explicitRate = Number(order.taxRate);
        let fallbackRatePercent = 16;
        if (Number.isFinite(explicitRate) && explicitRate >= 0) {
            fallbackRatePercent = explicitRate <= 1 ? explicitRate * 100 : explicitRate;
        } else {
            const taxableBase = Math.max(
                0,
                Number(order.subtotal || 0) - Number(order.discount || 0),
            );
            if (taxableBase > 0 && Number(order.tax || 0) > 0) {
                fallbackRatePercent = (Number(order.tax || 0) / taxableBase) * 100;
            }
        }
        fallbackRatePercent = Number(fallbackRatePercent.toFixed(2));

        let itemsTax = 0;
        let scTax = 0;
        let showScTax = false;
        let singleItemRate: number | null = null;
        let scRate: number | null = null;

        const scAmount = Number(order.serviceChargeAmount || 0);

        if (Array.isArray(order.taxBreakdown) && order.taxBreakdown.length > 0) {
            const scEntry = order.taxBreakdown.find((b: any) => b.id === '__service_charge__');
            const itemsEntries = order.taxBreakdown.filter((b: any) => b.id !== '__service_charge__');

            itemsTax = Math.round(itemsEntries.reduce((sum: number, b: any) => sum + (Number(b.amount) || 0), 0) * 100) / 100;

            const positiveTaxBuckets = itemsEntries.filter((b: any) => Number(b.rate) > 0 && Math.abs(Number(b.amount) || 0) > 0.0001);
            const distinctPositiveRates = Array.from(new Set(positiveTaxBuckets.map((b: any) => Number(b.rate))));
            singleItemRate = (distinctPositiveRates.length === 1 && !taxChanged) ? distinctPositiveRates[0] : null;

            scTax = scEntry ? Math.round((Number(scEntry.amount) || 0) * 100) / 100 : 0;
            scRate = scEntry && Number.isFinite(Number(scEntry.rate)) && Number(scEntry.rate) > 0 ? Number(scEntry.rate) : null;

            const isScTaxable = order.serviceChargeTaxableSnapshot !== undefined
                ? Boolean(order.serviceChargeTaxableSnapshot)
                : order.serviceChargeTaxable !== undefined
                    ? Boolean(order.serviceChargeTaxable)
                    : true;

            showScTax = scEntry !== undefined && Math.abs(scTax) > 0.0001 && scAmount !== 0 && isScTaxable;
        } else {
            const isScTaxable = Boolean(order.serviceChargeTaxableSnapshot ?? order.serviceChargeTaxable);
            const totalTax = Number(order.tax || 0);

            if (isScTaxable && scAmount > 0) {
                scRate = fallbackRatePercent;
                scTax = Math.round(scAmount * (fallbackRatePercent / 100) * 100) / 100;
                showScTax = scTax > 0;
            } else {
                scTax = 0;
                showScTax = false;
            }

            itemsTax = Math.max(0, Math.round((totalTax - (showScTax ? scTax : 0)) * 100) / 100);

            if (Array.isArray(order.items) && order.items.length > 0) {
                const positiveRates = order.items
                    .map((it: any) => {
                        const r = Number(it.taxRateSnapshot);
                        if (!Number.isFinite(r) || r <= 0) return null;
                        return r <= 1 ? Number((r * 100).toFixed(2)) : Number(r.toFixed(2));
                    })
                    .filter((r): r is number => r !== null);
                const distinctRates = Array.from(new Set(positiveRates));
                if (distinctRates.length === 1 && !taxChanged) {
                    singleItemRate = distinctRates[0];
                } else if (distinctRates.length > 1) {
                    singleItemRate = null;
                } else {
                    singleItemRate = (!taxChanged && fallbackRatePercent > 0) ? fallbackRatePercent : null;
                }
            } else {
                singleItemRate = (!taxChanged && fallbackRatePercent > 0) ? fallbackRatePercent : null;
            }
        }

        const taxSummaryLines: Array<{ id: string; label: string; amount: number }> = [];

        if (itemsTax > 0 || (Number(order.tax || 0) > 0 && !showScTax)) {
            let itemsTaxLabel: string;
            if (singleItemRate !== null) {
                itemsTaxLabel = t('orders.details.taxOnItemsWithRate', {
                    rate: singleItemRate,
                    defaultValue: `Tax ${singleItemRate}% on items`,
                });
            } else {
                itemsTaxLabel = t('orders.details.taxOnItems', {
                    defaultValue: 'Tax on items',
                });
            }
            if (taxChanged) {
                itemsTaxLabel += ` (${t('orders.details.customized', { defaultValue: 'Customized' })})`;
            }
            taxSummaryLines.push({
                id: 'items_tax',
                label: itemsTaxLabel,
                amount: itemsTax || Number(order.tax || 0),
            });
        }

        if (showScTax && scTax > 0) {
            const effectiveScRate = scRate !== null && scRate > 0 ? scRate : fallbackRatePercent;
            let scTaxLabel: string;
            if (effectiveScRate > 0) {
                scTaxLabel = t('orders.details.taxOnServiceWithRate', {
                    rate: effectiveScRate,
                    defaultValue: `Tax ${effectiveScRate}% on service`,
                });
            } else {
                scTaxLabel = t('orders.details.taxOnService', {
                    defaultValue: 'Tax on service',
                });
            }
            taxSummaryLines.push({
                id: 'sc_tax',
                label: scTaxLabel,
                amount: scTax,
            });
        }

        return {
            subtotalLabel,
            totalLabel,
            taxSummaryLines,
            serviceChargeLabel,
            serviceChargeReason,
        };
    }, [order, t]);

    const formatDate = (dateString: string) => {
        return formatInEstablishmentTimezone(dateString, t('common.locale') === 'ar' ? 'ar-EG' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }, currentEstablishment);
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

    const handleRefund = () => {
        if (!canRefund) {
            toast.error(t('orders.messages.noRefundPermission'));
            return;
        }
        setIsRefundModalOpen(true);
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

    const paymentLabel =
        order.tenders && order.tenders.length > 1
            ? t('orders.payment.splitCount', { count: order.tenders.length, defaultValue: `Split (${order.tenders.length})` })
            : order.paymentMethod === 'CARD' && order.cardType
                ? t('orders.payment.cardWithBrand', { brand: formatPaymentBrandName(order.cardType) })
                : order.paymentMethod === 'CASH'
                    ? t('orders.payment.cash')
                    : order.otherPaymentMethod
                        ? formatPaymentBrandName(order.otherPaymentMethod)
                        : formatPaymentBrandName(order.paymentMethod);

    return (
        <Modal isOpen={!!order} onClose={onClose} size="xl">
            <ModalHeader
                title={`${t('orders.table.order')} ${order.invoiceNumber ?? `#${order.orderNumber}`}`}
                subtitle={t('orders.details.title')}
                onClose={onClose}
            />

            <ModalBody>
                <div className="space-y-5">
                        {/* Meta grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-3">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    {t('orders.details.date')}
                                    <QuickInfo text={t('orders.details.dateTip')} />
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                                    {formatDate(order.createdAt)}
                                </p>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-3">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    {t('orders.details.status')}
                                    <QuickInfo text={t('orders.details.statusTip')} />
                                </p>
                                <span
                                    className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-md border ${getStatusColor(
                                        order.paymentStatus || order.status,
                                    )}`}
                                >
                                    {getOrderStatusLabel()}
                                </span>
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-3">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    {t('orders.details.payment')}
                                    <QuickInfo text={t('orders.details.paymentTip')} />
                                </p>
                                {order.tenders && order.tenders.length > 1 ? (
                                    <div className="space-y-1">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                            {t('orders.payment.splitCount', { count: order.tenders.length, defaultValue: `Split (${order.tenders.length})` })}
                                        </p>
                                        <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 pt-1 border-t border-gray-200 dark:border-white/10">
                                            {order.tenders.map((tItem, idx) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <span>{tItem.label}</span>
                                                    <span className="font-medium">{formatCurrency(tItem.amount)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {paymentLabel}
                                    </p>
                                )}
                            </div>
                            <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-3">
                                <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                    {t('orders.details.staff')}
                                    <QuickInfo text={t('orders.details.staffTip')} />
                                </p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {order.employeeName || order.user?.username || t('common.pos')}
                                </p>
                            </div>
                            {order.refundedByName && (
                                <div className="rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-3">
                                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                        {t('orders.details.refundedBy')}
                                        <QuickInfo text={t('orders.details.refundedByTip')} />
                                    </p>
                                    <p className="text-sm font-semibold text-mintcom-red">{order.refundedByName}</p>
                                </div>
                            )}
                            {order.refundTenders && order.refundTenders.length > 0 && (
                                <div className="rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-3 col-span-2 sm:col-span-2">
                                    <p className="text-xs text-red-500 font-semibold mb-1">
                                        {t('orders.details.refundedTenders', { defaultValue: 'Refunded Tenders' })}
                                    </p>
                                    <div className="text-xs text-red-600 dark:text-red-400 space-y-0.5">
                                        {order.refundTenders.map((rt, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <span>{rt.label}</span>
                                                <span className="font-medium">-{formatCurrency(rt.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {((order.paymentStatus || order.status) === 'REFUNDED') && (
                                <div className="col-span-2 sm:col-span-4 rounded-xl border border-red-100 dark:border-red-500/20 bg-red-50/50 dark:bg-red-500/5 p-3">
                                    <p className="text-xs text-gray-500 mb-1">
                                        {t('orders.details.refundReason', { defaultValue: 'Refund Reason' })}
                                    </p>
                                    <p className="text-sm font-semibold text-mintcom-red break-words">
                                        {order.refundReason || order.reason || order.refund_reason || 'N/A'}
                                    </p>
                                </div>
                            )}
                            {order.customer && (
                                <>
                                    <div className="col-span-2 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-3">
                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            {t('orders.details.customer')}
                                            <QuickInfo text={t('orders.details.customerTip')} />
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer.name}</p>
                                    </div>
                                    <div className="col-span-2 rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-3">
                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                                            {t('orders.details.contact')}
                                            <QuickInfo text={t('orders.details.contactTip')} />
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer.phone}</p>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Items */}
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                {t('orders.details.items')}
                            </h3>
                            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                                <div className="divide-y divide-gray-100 dark:divide-white/10">
                                    {order.items?.map((item) => {
                                        const qty = Math.max(1, Number(item.quantity) || 1);
                                        const unitPrice = getItemUnitPrice(item);
                                        const lineTotal = getItemLineTotal(item);

                                        return (
                                            <div key={item.id} className="px-3.5 py-3 flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{stripNameMarkers(item.name)}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {t('orders.details.qty')}: {qty.toLocaleString(t('common.locale'))} × {formatCurrency(unitPrice)}
                                                    </p>
                                                </div>
                                                <StatValue
                                                    value={lineTotal}
                                                    currency={currencySymbol}
                                                    className="text-sm font-semibold text-gray-900 dark:text-white"
                                                    containerClassName="justify-end shrink-0"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Totals — clean receipt style */}
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-4 space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">{summaryLabels.subtotalLabel}</span>
                                <StatValue
                                    value={order.subtotal || 0}
                                    currency={currencySymbol}
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                    containerClassName="justify-end"
                                />
                            </div>
                            {(order.discount || 0) > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-mintcom-red">{t('orders.details.discount')}</span>
                                    <StatValue
                                        value={order.discount || 0}
                                        currency={currencySymbol}
                                        prefix="-"
                                        className="text-sm font-medium text-mintcom-red"
                                        containerClassName="justify-end"
                                    />
                                </div>
                            )}
                            {(order.serviceChargeAmount || 0) > 0 && (
                                <div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">{summaryLabels.serviceChargeLabel}</span>
                                        <StatValue
                                            value={order.serviceChargeAmount || 0}
                                            currency={currencySymbol}
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                            containerClassName="justify-end"
                                        />
                                    </div>
                                    {summaryLabels.serviceChargeReason && (
                                        <p className="text-xs text-gray-400 mt-1 ps-1">
                                            {summaryLabels.serviceChargeReason}
                                        </p>
                                    )}
                                </div>
                            )}
                            {summaryLabels.taxSummaryLines.map((line) => (
                                <div key={line.id} className="flex justify-between text-sm">
                                    <span className="text-gray-500">{line.label}</span>
                                    <StatValue
                                        value={line.amount}
                                        currency={currencySymbol}
                                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        containerClassName="justify-end"
                                    />
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-3 mt-1 border-t border-gray-100 dark:border-white/10">
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {summaryLabels.totalLabel}
                                </span>
                                <StatValue
                                    value={order.total || 0}
                                    currency={currencySymbol}
                                    className={`text-lg font-bold ${isNegativeTotal ? 'text-mintcom-red' : 'text-gray-900 dark:text-white'}`}
                                    containerClassName="justify-end"
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        {order.note && (
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1.5">{t('orders.details.notes')}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/[0.03] p-3 rounded-xl border border-gray-100 dark:border-white/10 leading-relaxed">
                                    {order.note}
                                </p>
                            </div>
                        )}
                    </div>
            </ModalBody>

            <ModalFooter>
                <ModalCancelButton onClick={onClose}>
                    {t('common.close')}
                </ModalCancelButton>
                {isRefundable && (
                    <div className="flex-1">
                        <button
                            onClick={() => {
                                if (!canRefund) return;
                                handleRefund();
                            }}
                            disabled={!canRefund}
                            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold border transition-colors ${canRefund
                                ? 'bg-mintcom-red text-white border-mintcom-red hover:bg-mintcom-red/90'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10 cursor-not-allowed'
                                }`}
                        >
                            {t('orders.actions.refund')}
                        </button>
                        {!canRefund && (
                            <p className="mt-1.5 text-xs font-medium text-red-600 text-center">
                                {t('orders.messages.noRefundPermission')}
                            </p>
                        )}
                    </div>
                )}
            </ModalFooter>

            <OrderRefundModal
                order={order}
                isOpen={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                onRefundSuccess={onRefundSuccess}
                canRefund={canRefund}
                canRestock={canRestock}
            />
        </Modal>
    );
}


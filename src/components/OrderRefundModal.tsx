import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
  Check,
  CheckCircle2,
  Circle,
  List,
  Loader2,
  Minus,
  Package,
  Plus,
  RotateCcw,
  ShoppingBag,
  X,
} from 'lucide-react';
import api, { extractErrorMessage } from '../config/api';
import { TEXT_INPUT_LIMITS } from '../config/textLimits';
import { useCurrency } from '../context/CurrencyContext';
import { useScrollLock } from '../hooks/useScrollLock';
import { formatInputLabel, formatInputPlaceholder } from '../utils/textCase';

export interface RefundOrderItem {
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
  remainingRefundQuantity?: number;
}

export interface RefundOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  total?: number;
  items?: RefundOrderItem[];
  refundOrders?: Array<{ total?: number; items?: RefundOrderItem[] }>;
}

type RefundMode = 'item' | 'order';

type SelectedRefundLine = {
  item: RefundOrderItem;
  orderItemId: string;
  quantity: number;
};

interface OrderRefundModalProps {
  order: RefundOrder;
  isOpen: boolean;
  onClose: () => void;
  onRefundSuccess?: (updatedOrder?: RefundOrder) => void;
  canRefund?: boolean;
  canRestock?: boolean;
}

const getRefundOrderItemId = (item: RefundOrderItem): string =>
  String(item?.id || item?.orderItemId || '');

const getRefundItemName = (item: RefundOrderItem, fallback: string): string =>
  item?.name || fallback;

const getRefundItemSignature = (item: RefundOrderItem): string => {
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

const getRefundedQuantitiesByLine = (orderDetails: RefundOrder) => {
  const refunded = new Map<string, number>();
  const refundOrders = Array.isArray(orderDetails?.refundOrders)
    ? orderDetails.refundOrders
    : [];

  refundOrders.forEach(refundOrder => {
    const refundItems = Array.isArray(refundOrder?.items)
      ? refundOrder.items
      : [];

    refundItems.forEach(refundItem => {
      const quantity = Math.max(0, Number(refundItem?.quantity || 0));
      const refundedFromOrderItemId = String(
        refundItem?.refundedFromOrderItemId || '',
      );

      if (refundedFromOrderItemId) {
        refunded.set(
          refundedFromOrderItemId,
          (refunded.get(refundedFromOrderItemId) || 0) + quantity,
        );
        return;
      }

      const signature = getRefundItemSignature(refundItem);
      refunded.set(signature, (refunded.get(signature) || 0) + quantity);
    });
  });

  return refunded;
};

const getRefundItemTotal = (item: RefundOrderItem): number => {
  const value = item?.total ?? item?.finalPrice ?? item?.price ?? 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.abs(numeric) : 0;
};

const getRefundItemUnitTotal = (item: RefundOrderItem): number => {
  const quantity = Math.max(1, Number(item?.quantity || 1));
  const explicitUnit = Number(item?.unitPrice ?? item?.finalUnitPrice);
  if (Number.isFinite(explicitUnit) && explicitUnit > 0) {
    return explicitUnit;
  }
  return getRefundItemTotal(item) / quantity;
};

const buildRefundableItems = (orderDetails: RefundOrder): RefundOrderItem[] => {
  const items = Array.isArray(orderDetails?.items) ? orderDetails.items : [];
  const refundedByLine = getRefundedQuantitiesByLine(orderDetails);

  return items
    .map(item => {
      const orderItemId = getRefundOrderItemId(item);
      const originalQuantity = Math.max(0, Number(item?.quantity || 0));
      const refundedQuantity =
        refundedByLine.get(orderItemId) ||
        refundedByLine.get(getRefundItemSignature(item)) ||
        0;
      const remainingRefundQuantity = Math.max(
        0,
        originalQuantity - refundedQuantity,
      );

      return {
        ...item,
        orderItemId,
        remainingRefundQuantity,
      };
    })
    .filter(item => Boolean(item.orderItemId) && Number(item.remainingRefundQuantity) > 0);
};

const getRefundedAmountFromResult = (
  result: any,
  fallbackAmount: number,
): number => {
  if (typeof result?.refundedAmount === 'number') {
    return Math.abs(result.refundedAmount);
  }

  const refundOrders = Array.isArray(result?.refundOrders)
    ? result.refundOrders
    : [];
  const latestRefundOrder = refundOrders[refundOrders.length - 1];
  if (typeof latestRefundOrder?.total === 'number') {
    return Math.abs(latestRefundOrder.total);
  }

  if (typeof result?.total === 'number') {
    return Math.abs(result.total);
  }

  return fallbackAmount;
};

const isRefundableOrder = (order: RefundOrder): boolean =>
  order.paymentStatus === 'COMPLETED' ||
  order.status === 'COMPLETED' ||
  order.status === 'PARTIALLY_REFUNDED';

export function OrderRefundModal({
  order,
  isOpen,
  onClose,
  onRefundSuccess,
  canRefund = true,
  canRestock = true,
}: OrderRefundModalProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCurrency();
  const [refundMode, setRefundMode] = useState<RefundMode>('order');
  const [selectedRefundItems, setSelectedRefundItems] = useState<Record<string, number>>({});
  const [refundReason, setRefundReason] = useState('');
  const [refundReasonError, setRefundReasonError] = useState('');
  const [restockItems, setRestockItems] = useState(false);
  const [isRefundSubmitting, setIsRefundSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [refundedAmount, setRefundedAmount] = useState(0);

  useScrollLock(isOpen);

  const refundableItems = useMemo(() => buildRefundableItems(order), [order]);
  const canRefundByItem = refundableItems.length > 0;
  const hasStockTrackedItems = useMemo(
    () =>
      canRestock &&
      (order.items || []).some(item => item?.trackStock || item?.item?.trackStock),
    [canRestock, order.items],
  );

  const selectedRefundLines = useMemo<SelectedRefundLine[]>(
    () =>
      refundableItems
        .map(item => {
          const orderItemId = String(item.orderItemId || '');
          const quantity = Math.min(
            Math.max(0, Number(selectedRefundItems[orderItemId] || 0)),
            Number(item.remainingRefundQuantity || 0),
          );
          return { item, orderItemId, quantity };
        })
        .filter(line => line.quantity > 0),
    [refundableItems, selectedRefundItems],
  );

  const selectedRefundItemsAmount = selectedRefundLines.reduce(
    (sum, line) => sum + getRefundItemUnitTotal(line.item) * line.quantity,
    0,
  );

  const selectedRefundItemsCount = selectedRefundLines.reduce(
    (sum, line) => sum + line.quantity,
    0,
  );

  useEffect(() => {
    if (!isOpen) return;

    const firstRefundableItem = refundableItems[0];
    setRefundMode(firstRefundableItem ? 'item' : 'order');
    setSelectedRefundItems(
      firstRefundableItem?.orderItemId
        ? { [firstRefundableItem.orderItemId]: 1 }
        : {},
    );
    setRefundReason('');
    setRefundReasonError('');
    setRestockItems(false);
    setIsRefundSubmitting(false);
    setShowSuccessModal(false);
    setRefundedAmount(0);
  }, [isOpen, order.id, refundableItems]);

  const closeRefundModal = useCallback(() => {
    if (isRefundSubmitting) return;
    onClose();
  }, [isRefundSubmitting, onClose]);

  const closeSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    onClose();
  }, [onClose]);

  const updateRefundItemQuantity = useCallback(
    (item: RefundOrderItem, quantity: number) => {
      const orderItemId = String(item.orderItemId || getRefundOrderItemId(item));
      const remaining = Math.max(0, Number(item.remainingRefundQuantity || 0));
      const nextQuantity = Math.min(Math.max(1, quantity), remaining);

      setSelectedRefundItems(prev => ({
        ...prev,
        [orderItemId]: nextQuantity,
      }));
    },
    [],
  );

  const toggleRefundItem = useCallback((item: RefundOrderItem) => {
    const orderItemId = String(item.orderItemId || getRefundOrderItemId(item));
    setSelectedRefundItems(prev => {
      const next = { ...prev };
      if (next[orderItemId]) {
        delete next[orderItemId];
      } else {
        next[orderItemId] = 1;
      }
      return next;
    });
  }, []);

  const selectFullOrderMode = useCallback(() => {
    setRefundMode('order');
    setRefundReasonError('');
  }, []);

  const selectItemMode = useCallback(() => {
    if (!canRefundByItem) return;
    setRefundMode('item');
    setRefundReasonError('');
    if (selectedRefundLines.length === 0 && refundableItems[0]?.orderItemId) {
      setSelectedRefundItems({ [refundableItems[0].orderItemId]: 1 });
    }
  }, [canRefundByItem, refundableItems, selectedRefundLines.length]);

  const submitRefundWithReason = async () => {
    if (!canRefund) {
      setRefundReasonError(t('orders.messages.noRefundPermission'));
      return;
    }

    if (!isRefundableOrder(order)) {
      setRefundReasonError(t('orders.messages.refundFailed'));
      return;
    }

    const trimmedReason = refundReason.trim();
    if (!trimmedReason) {
      setRefundReasonError(
        formatInputLabel('Refund Reason is required', t('common.locale')),
      );
      return;
    }

    const isItemRefund = refundMode === 'item' && canRefundByItem;
    if (isItemRefund && selectedRefundLines.length === 0) {
      setRefundReasonError(
        t('orders.messages.noRefundableItems', {
          defaultValue: 'No refundable items remaining for this order.',
        }),
      );
      return;
    }

    setIsRefundSubmitting(true);
    setRefundReasonError('');

    try {
      const response = isItemRefund
        ? await api.post(`/api/orders/${order.id}/refund-items`, {
            refundReason: trimmedReason,
            restockItems,
            items: selectedRefundLines.map(line => ({
              orderItemId: line.orderItemId,
              quantity: line.quantity,
            })),
          })
        : await api.post(`/api/orders/${order.id}/refund`, {
            refundReason: trimmedReason,
            restockItems,
          });

      const fallbackAmount = isItemRefund
        ? selectedRefundItemsAmount
        : Math.abs(Number(order.total || 0));
      const amount = getRefundedAmountFromResult(response.data, fallbackAmount);
      setRefundedAmount(amount);
      setRefundReason('');
      setSelectedRefundItems({});
      setRestockItems(false);
      setShowSuccessModal(true);
      onRefundSuccess?.(response.data);
    } catch (err) {
      const message =
        extractErrorMessage(err) ||
        t('orders.messages.refundFailed', {
          defaultValue: 'Failed to process refund',
        });
      setRefundReasonError(message);
      toast.error(message);
    } finally {
      setIsRefundSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
    >
      <div className="absolute inset-0" onClick={showSuccessModal ? closeSuccessModal : closeRefundModal} />

      {showSuccessModal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-sm rounded-t-2xl border border-gray-200 bg-white p-6 text-center shadow-2xl dark:border-white/10 dark:bg-[#1E293B] sm:rounded-2xl"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mintcom-green text-white">
            <Check size={30} />
          </div>
          <h3 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">
            {t('orders.messages.refundSuccess')}
          </h3>
          <p className="mt-2 text-sm font-black text-mintcom-red">
            {formatAmount(refundedAmount)}
          </p>
          <button
            type="button"
            onClick={closeSuccessModal}
            className="mt-5 w-full rounded-xl bg-mintcom-green px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-mintcom-green/90"
          >
            {t('common.close')}
          </button>
        </div>
      ) : (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-order-title"
          className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1E293B] sm:max-h-[86vh] sm:rounded-2xl"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mintcom-red/10 text-mintcom-red">
                <RotateCcw size={20} />
              </div>
              <div className="min-w-0">
                <h3 id="refund-order-title" className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('orders.details.refundConfirmTitle')}
                </h3>
                <p className="truncate text-xs font-bold text-gray-500 dark:text-gray-400">
                  {t('orders.table.order')} #{order.orderNumber} - {formatAmount(Math.abs(Number(order.total || 0)))}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeRefundModal}
              disabled={isRefundSubmitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <p className="mb-4 text-sm font-semibold text-gray-600 dark:text-gray-300">
              {t('orders.details.refundConfirmMessage')}
            </p>

            {canRefundByItem && (
              <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-white/10 dark:bg-white/5">
                <button
                  type="button"
                  onClick={selectItemMode}
                  disabled={isRefundSubmitting}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-black transition-all ${
                    refundMode === 'item'
                      ? 'bg-mintcom-red/10 text-mintcom-red shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <List size={15} />
                  <span className="truncate">
                    {formatInputLabel(t('orders.details.refundItems'), t('common.locale'))}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={selectFullOrderMode}
                  disabled={isRefundSubmitting}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 text-xs font-black transition-all ${
                    refundMode === 'order'
                      ? 'bg-mintcom-green/10 text-mintcom-green shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  <ShoppingBag size={15} />
                  <span className="truncate">
                    {formatInputLabel(t('orders.details.refundEntireOrder'), t('common.locale'))}
                  </span>
                </button>
              </div>
            )}

            {refundMode === 'item' && canRefundByItem && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {t('orders.details.items')}
                  </span>
                  <div className="text-right">
                    <span className="block text-sm font-black text-mintcom-red">
                      {formatAmount(selectedRefundItemsAmount)}
                    </span>
                    <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                      {t('orders.details.selectedItems', {
                        count: selectedRefundItemsCount,
                      })}
                    </span>
                  </div>
                </div>

                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {refundableItems.map(item => {
                    const orderItemId = String(item.orderItemId || '');
                    const selectedQuantity = Number(selectedRefundItems[orderItemId] || 0);
                    const isSelected = selectedQuantity > 0;
                    const remaining = Math.max(0, Number(item.remainingRefundQuantity || 0));
                    const clampedQuantity = Math.min(Math.max(1, selectedQuantity || 1), Math.max(1, remaining));
                    const unitAmount = getRefundItemUnitTotal(item);

                    return (
                      <button
                        type="button"
                        key={orderItemId}
                        onClick={() => toggleRefundItem(item)}
                        disabled={isRefundSubmitting}
                        className={`w-full rounded-xl border p-3 text-left transition-colors ${
                          isSelected
                            ? 'border-mintcom-red bg-mintcom-red/5'
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {isSelected ? (
                            <CheckCircle2 className="mt-0.5 shrink-0 text-mintcom-red" size={20} />
                          ) : (
                            <Circle className="mt-0.5 shrink-0 text-gray-400" size={20} />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-900 dark:text-white">
                              {getRefundItemName(
                                item,
                                t('common.notAvailable', { defaultValue: 'N/A' }),
                              )}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {t('orders.details.remaining')}: {remaining}
                            </p>

                            {isSelected && (
                              <div className="mt-3 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={event => {
                                    event.stopPropagation();
                                    updateRefundItemQuantity(item, clampedQuantity - 1);
                                  }}
                                  disabled={clampedQuantity <= 1 || isRefundSubmitting}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-700 disabled:opacity-40 dark:border-white/15 dark:text-gray-200"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="min-w-6 text-center text-sm font-black text-gray-900 dark:text-white">
                                  {clampedQuantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={event => {
                                    event.stopPropagation();
                                    updateRefundItemQuantity(item, clampedQuantity + 1);
                                  }}
                                  disabled={clampedQuantity >= remaining || isRefundSubmitting}
                                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-gray-700 disabled:opacity-40 dark:border-white/15 dark:text-gray-200"
                                >
                                  <Plus size={14} />
                                </button>
                                <span className="ml-auto text-sm font-black text-mintcom-red">
                                  {formatAmount(unitAmount * clampedQuantity)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {hasStockTrackedItems && (
              <label className="mb-4 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-white/10 dark:bg-white/5">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
                    <Package size={17} className={restockItems ? 'text-mintcom-green' : 'text-gray-400'} />
                    {t('orders.reports.restockItems')}
                  </span>
                  <span className="mt-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t('orders.reports.restockDescription')}
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={restockItems}
                  onChange={event => setRestockItems(event.target.checked)}
                  disabled={isRefundSubmitting}
                  className="h-5 w-5 rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green"
                />
              </label>
            )}

            <label className="block text-sm font-bold text-gray-800 dark:text-gray-100">
              {formatInputLabel('Refund Reason', t('common.locale'))}
            </label>
            <textarea
              maxLength={TEXT_INPUT_LIMITS.REFUND_REASON}
              value={refundReason}
              onChange={event => {
                setRefundReason(event.target.value);
                if (refundReasonError && event.target.value.trim()) {
                  setRefundReasonError('');
                }
              }}
              placeholder={formatInputPlaceholder('Enter refund reason', t('common.locale'))}
              rows={4}
              disabled={isRefundSubmitting}
              className={`mt-2 w-full resize-none rounded-xl border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-shadow focus:ring-2 focus:ring-mintcom-green/40 disabled:opacity-60 dark:bg-[#0F172A] dark:text-white ${
                refundReasonError
                  ? 'border-mintcom-red'
                  : 'border-gray-300 dark:border-white/15'
              }`}
            />
            {refundReasonError && (
              <p className="mt-2 text-sm font-semibold text-mintcom-red">
                {refundReasonError}
              </p>
            )}
          </div>

          <div className="flex gap-3 border-t border-gray-100 px-5 py-4 dark:border-white/10 sm:px-6">
            <button
              type="button"
              onClick={closeRefundModal}
              disabled={isRefundSubmitting}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/15 dark:text-gray-200 dark:hover:bg-white/5"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={submitRefundWithReason}
              disabled={isRefundSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-mintcom-red px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-mintcom-red/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefundSubmitting && <Loader2 size={16} className="animate-spin" />}
              {isRefundSubmitting ? t('common.loading') : t('orders.actions.refund')}
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}

export default OrderRefundModal;

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import {
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
import {
  calculateSelectedRefundAmount,
  withRefundAllocation,
} from '../utils/refundAllocation';

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
  refundUnitAmountWithAdjustments?: number;
}

export interface RefundOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  subtotal?: number;
  discount?: number;
  discountAmount?: number;
  serviceChargeAmount?: number;
  tax?: number;
  total?: number;
  items?: RefundOrderItem[];
  refundOrders?: Array<{
    subtotal?: number;
    discountAmount?: number;
    serviceChargeAmount?: number;
    tax?: number;
    total?: number;
    items?: RefundOrderItem[];
  }>;
}

type ActiveShiftOption = { id: string; employeeName: string; registerId: string | null; startTime: string };
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
  (item?.name || fallback).replace(/\[\s*(?:history|deleted|archived)\s*\]/gi, '').replace(/\s{2,}/g, ' ').trim() || fallback;

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
  const allocatedUnit = Number(item?.refundUnitAmountWithAdjustments);
  if (Number.isFinite(allocatedUnit) && allocatedUnit > 0) {
    return allocatedUnit;
  }

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

  const refundableItems = items
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

  return withRefundAllocation(orderDetails, refundableItems);
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

  // Active-shift resolution — required for EVERY refund.
  const [activeShifts, setActiveShifts] = useState<ActiveShiftOption[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  const [shiftError, setShiftError] = useState('');

  const fetchActiveShifts = useCallback(async () => {
    setIsLoadingShifts(true);
    setShiftError('');
    try {
      const res = await api.get('/api/shifts/establishment/active');
      const list: ActiveShiftOption[] = res.data?.shifts || [];
      setActiveShifts(list);
      if (list.length === 1) {
        setSelectedShiftId(list[0].id);
      } else {
        setSelectedShiftId('');
      }
      // Clear any stale error left from a previous render cycle
      setShiftError('');
      setRefundReasonError('');
    } catch (err: any) {
      console.warn('Failed to fetch active shifts:', err);
      setShiftError(err?.response?.data?.message || 'Failed to load active shifts');
      setActiveShifts([]);
    } finally {
      setIsLoadingShifts(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchActiveShifts();
  }, [isOpen, fetchActiveShifts]);

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

  const selectedRefundItemsAmount = useMemo(
    () => calculateSelectedRefundAmount(order, selectedRefundLines),
    [order, selectedRefundLines],
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
    setSelectedShiftId('');
    setShiftError('');
  }, [isOpen, order.id, refundableItems]);

  const closeRefundModal = useCallback(() => {
    if (isRefundSubmitting) return;
    onClose();
  }, [isRefundSubmitting, onClose]);


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

const generateClientRequestId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r % 4) + 8;
    return v.toString(16);
  });
};

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

    // Re-fetch shifts fresh right before submit — the modal may have been
    // open long enough for the drawer situation to change.
    let shifts = activeShifts;
    try {
      const res = await api.get('/api/shifts/establishment/active');
      const fresh: ActiveShiftOption[] = res.data?.shifts || [];
      setActiveShifts(fresh);
      setSelectedShiftId(fresh.length === 1 ? fresh[0].id : '');
      shifts = fresh;
    } catch {
      // Fall through to client-side state if the refresh itself fails.
    }

    // Guard: must have an active shift to process any refund.
    if (shifts.length === 0) {
      setRefundReasonError(t('orders.messages.noActiveShift', {
        defaultValue: 'A refund cannot be processed without an active register shift. Please open a shift first.',
      }));
      toast.error(t('orders.messages.noActiveShift', {
        defaultValue: 'A refund cannot be processed without an active register shift. Please open a shift first.',
      }));
      return;
    }
    if (shifts.length > 1 && !selectedShiftId) {
      setRefundReasonError(t('orders.messages.multipleActiveShifts', {
        defaultValue: 'Multiple active shifts are open. Please select a register before refunding.',
      }));
      toast.error(t('orders.messages.multipleActiveShifts', {
        defaultValue: 'Multiple active shifts are open. Please select a register before refunding.',
      }));
      return;
    }

    setIsRefundSubmitting(true);
    setRefundReasonError('');

    try {
      const clientRequestId = generateClientRequestId();
      const disposition = restockItems ? 'RESTOCKED' : 'NOT_RESTOCKED';

      const response = isItemRefund
        ? await api.post(`/api/orders/${order.id}/refund-items`, {
            clientRequestId,
            refundReason: trimmedReason,
            restockItems,
            disposition,
            shiftId: selectedShiftId || (shifts.length === 1 ? shifts[0].id : undefined),
            items: selectedRefundLines.map(line => ({
              orderItemId: line.orderItemId,
              quantity: line.quantity,
              disposition,
              restock: restockItems,
            })),
          })
        : await api.post(`/api/orders/${order.id}/refund`, {
            clientRequestId,
            refundReason: trimmedReason,
            restockItems,
            disposition,
            shiftId: selectedShiftId || (shifts.length === 1 ? shifts[0].id : undefined),
          });

      setRefundReason('');
      setSelectedRefundItems({});
      setRestockItems(false);
      // Close immediately after a brief confirmation flash, then force a full page refresh.
      toast.success(t('orders.messages.refundSuccess', {
        defaultValue: 'Refund processed successfully.',
      }));
      setTimeout(() => {
        onClose();
        onRefundSuccess?.(response.data);
      }, 800);
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
      <div className="absolute inset-0" onClick={closeRefundModal} />

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

            {/* Active-shift resolution UI — only render after fetch completes
                so we never flash a stale error before the real result arrives. */}
            {!isLoadingShifts && activeShifts.length === 0 && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
                <p className="text-sm font-bold text-red-700 dark:text-red-300">
                  ⚠️ {t('orders.details.noActiveShiftTitle', { defaultValue: 'Active Register Shift Required' })}
                </p>
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {shiftError || t('orders.details.noActiveShiftMessage', {
                    defaultValue: 'A refund cannot be processed without an active register shift. Please open a shift on a register terminal.',
                  })}
                </p>
              </div>
            )}
            {!isLoadingShifts && activeShifts.length === 1 && (
              <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800 dark:bg-green-950">
                <p className="text-sm font-bold text-green-700 dark:text-green-300">
                  🟢 {t('orders.details.singleShiftTitle', { defaultValue: 'Active Register Shift' })}
                </p>
                <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                  {t('orders.details.singleShiftMessage', {
                    defaultValue: 'Refund will be recorded on {{name}} ({{register}})',
                    name: activeShifts[0].employeeName,
                    register: activeShifts[0].registerId ? `Register ${activeShifts[0].registerId}` : 'Register',
                  })}
                </p>
              </div>
            )}
            {!isLoadingShifts && activeShifts.length > 1 && (
              <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-white/5">
                <p className="mb-3 text-sm font-bold text-gray-900 dark:text-white">
                  {t('orders.details.selectShiftTitle', { defaultValue: 'Select Register for Refund:' })}
                </p>
                {activeShifts.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedShiftId(s.id)}
                    className={`mb-2 flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition-colors ${
                      selectedShiftId === s.id
                        ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-white/10 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className={`flex h-4 w-4 shrink-0 rounded-full border-2 ${
                      selectedShiftId === s.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-500'
                    }`}>
                      {selectedShiftId === s.id && (
                        <div className="mx-auto my-auto h-1.5 w-1.5 rounded-full bg-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {s.employeeName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {s.registerId ? `Register ${s.registerId} • ` : ''}
                        Started {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                ))}
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
    </div>,
    document.body,
  );
}

export default OrderRefundModal;
  {isRefundSubmitting ? t('common.loading') : t('orders.actions.refund')}
            </button>
          </div>
        </div>
    </div>,
    document.body,
  );
}

export default OrderRefundModal;

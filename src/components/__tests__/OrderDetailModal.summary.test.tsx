import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { OrderDetailModal, type Order } from '../OrderDetailModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'common.locale': 'en',
        'common.close': 'Close',
        'common.pos': 'POS Terminal',
        'orders.details.title': 'Order Details',
        'orders.table.order': 'Order',
        'orders.details.date': 'Date',
        'orders.details.status': 'Status',
        'orders.details.payment': 'Payment',
        'orders.details.staff': 'Staff',
        'orders.details.items': 'Items',
        'orders.details.qty': 'Qty',
        'orders.details.subtotal': 'Subtotal',
        'orders.details.subtotalExclTaxLabel': 'Subtotal (excl. Tax)',
        'orders.details.discount': 'Discount',
        'orders.details.serviceCharge': 'Service Charge',
        'orders.details.tax': 'Tax',
        'orders.details.taxWithRate': `Tax (${options?.rate}%)`,
        'orders.details.taxOnItemsWithRate': `Tax ${options?.rate}% on items`,
        'orders.details.taxOnItems': 'Tax on items',
        'orders.details.taxOnServiceWithRate': `Tax ${options?.rate}% on service`,
        'orders.details.taxOnService': 'Tax on service',
        'orders.details.total': 'Total',
        'orders.details.totalInclTaxLabel': 'TOTAL (incl. Tax)',
        'orders.details.customized': 'Customized',
        'orders.details.changed': 'Changed',
        'orders.payment.cash': 'Cash',
      };
      return translations[key] || options?.defaultValue || key;
    },
  }),
}));

vi.mock('../../context/CurrencyContext', () => ({
  useCurrency: () => ({
    currencySymbol: 'JOD',
    formatAmount: (val: number) => Number(val).toFixed(2),
  }),
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentEstablishment: { id: 'est_1', name: 'Main Branch' },
  }),
}));

vi.mock('../../hooks/useScrollLock', () => ({
  useScrollLock: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../OrderRefundModal', () => ({
  OrderRefundModal: () => null,
}));

vi.mock('../QuickInfo', () => ({
  QuickInfo: () => null,
}));

describe('OrderDetailModal - Receipt Summary Redesign Parity', () => {
  it('Scenario A: Standard single-rate 16% without service charge', () => {
    const order: Order = {
      id: 'ord_1',
      orderNumber: '1001',
      createdAt: '2026-09-14T12:00:00Z',
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      taxRate: 16,
      subtotal: 8.62,
      discount: 0,
      tax: 1.38,
      total: 10.0,
      items: [
        {
          id: 'item_1',
          name: 'Burger',
          quantity: 1,
          finalPrice: 8.62,
          taxRateSnapshot: 0.16,
          taxAmountSnapshot: 1.38,
        },
      ],
    };

    render(<OrderDetailModal order={order} onClose={vi.fn()} />);

    expect(screen.getByText('Subtotal (excl. Tax)')).toBeInTheDocument();
    expect(screen.getByText('Tax 16% on items')).toBeInTheDocument();
    expect(screen.queryByText(/Tax.*on service/)).toBeNull();
    expect(screen.getByText('TOTAL (incl. Tax)')).toBeInTheDocument();
  });

  it('Scenario B: Single-rate 16% with taxable Service Charge (10%)', () => {
    const order: Order = {
      id: 'ord_2',
      orderNumber: '1002',
      createdAt: '2026-09-14T12:00:00Z',
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      taxRate: 16,
      subtotal: 13.62,
      discount: 0,
      serviceChargeAmount: 1.5,
      serviceChargeType: 'PERCENTAGE',
      serviceChargeValue: 10,
      serviceChargeTaxableSnapshot: true,
      tax: 1.62,
      total: 16.74,
      items: [
        {
          id: 'item_1',
          name: 'Entree',
          quantity: 1,
          finalPrice: 13.62,
          taxRateSnapshot: 0.16,
          taxAmountSnapshot: 1.38,
        },
      ],
    };

    render(<OrderDetailModal order={order} onClose={vi.fn()} />);

    expect(screen.getByText('Subtotal (excl. Tax)')).toBeInTheDocument();
    expect(screen.getByText(/Service Charge \(10%\)/)).toBeInTheDocument();
    expect(screen.getByText('Tax 16% on items')).toBeInTheDocument();
    expect(screen.getByText('Tax 16% on service')).toBeInTheDocument();
    expect(screen.getByText('TOTAL (incl. Tax)')).toBeInTheDocument();
  });

  it('Scenario C: Single-rate 16% with non-taxable Service Charge (10%)', () => {
    const order: Order = {
      id: 'ord_3',
      orderNumber: '1003',
      createdAt: '2026-09-14T12:00:00Z',
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      taxRate: 16,
      subtotal: 8.62,
      discount: 0,
      serviceChargeAmount: 1.5,
      serviceChargeType: 'PERCENTAGE',
      serviceChargeValue: 10,
      serviceChargeTaxableSnapshot: false,
      tax: 1.38,
      total: 11.5,
      items: [
        {
          id: 'item_1',
          name: 'Burger',
          quantity: 1,
          finalPrice: 8.62,
          taxRateSnapshot: 0.16,
          taxAmountSnapshot: 1.38,
        },
      ],
    };

    render(<OrderDetailModal order={order} onClose={vi.fn()} />);

    expect(screen.getByText('Subtotal (excl. Tax)')).toBeInTheDocument();
    expect(screen.getByText(/Service Charge \(10%\)/)).toBeInTheDocument();
    expect(screen.getByText('Tax 16% on items')).toBeInTheDocument();
    // Non-taxable SC must NOT render a tax on service line
    expect(screen.queryByText(/Tax.*on service/)).toBeNull();
    expect(screen.getByText('TOTAL (incl. Tax)')).toBeInTheDocument();
  });

  it('Scenario D: Multi-rate cart (16% + 4%) shows generic "Tax on items"', () => {
    const order: Order = {
      id: 'ord_4',
      orderNumber: '1004',
      createdAt: '2026-09-14T12:00:00Z',
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      taxRate: 16,
      subtotal: 13.62,
      discount: 0,
      serviceChargeAmount: 1.5,
      serviceChargeType: 'PERCENTAGE',
      serviceChargeValue: 10,
      serviceChargeTaxableSnapshot: true,
      tax: 1.82,
      total: 16.94,
      items: [
        {
          id: 'item_1',
          name: 'Standard Item (16%)',
          quantity: 1,
          finalPrice: 8.62,
          taxRateSnapshot: 0.16,
          taxAmountSnapshot: 1.38,
        },
        {
          id: 'item_2',
          name: 'Reduced Rate Item (4%)',
          quantity: 1,
          finalPrice: 5.0,
          taxRateSnapshot: 0.04,
          taxAmountSnapshot: 0.2,
        },
      ],
    };

    render(<OrderDetailModal order={order} onClose={vi.fn()} />);

    expect(screen.getByText('Subtotal (excl. Tax)')).toBeInTheDocument();
    // Multi-rate cart outputs single consolidated "Tax on items" without a rate
    expect(screen.getByText('Tax on items')).toBeInTheDocument();
    expect(screen.getByText('Tax 16% on service')).toBeInTheDocument();
    expect(screen.getByText('TOTAL (incl. Tax)')).toBeInTheDocument();
  });

  it('Scenario E: Tax-exempt order (0% tax) does not render tax lines', () => {
    const order: Order = {
      id: 'ord_5',
      orderNumber: '1005',
      createdAt: '2026-09-14T12:00:00Z',
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      taxRate: 0,
      subtotal: 10.0,
      discount: 0,
      tax: 0,
      total: 10.0,
      items: [
        {
          id: 'item_1',
          name: 'Exempt Item',
          quantity: 1,
          finalPrice: 10.0,
          taxRateSnapshot: 0,
          taxAmountSnapshot: 0,
        },
      ],
    };

    render(<OrderDetailModal order={order} onClose={vi.fn()} />);

    expect(screen.getByText('Subtotal (excl. Tax)')).toBeInTheDocument();
    expect(screen.queryByText(/Tax.*on items/)).toBeNull();
    expect(screen.queryByText(/Tax.*on service/)).toBeNull();
    expect(screen.getByText('TOTAL (incl. Tax)')).toBeInTheDocument();
  });

  it('Scenario F: Customized tax label appends (Customized)', () => {
    const order: Order = {
      id: 'ord_6',
      orderNumber: '1006',
      createdAt: '2026-09-14T12:00:00Z',
      status: 'COMPLETED',
      paymentMethod: 'CASH',
      isTaxCustomized: true,
      taxRate: 16,
      subtotal: 8.62,
      discount: 0,
      tax: 1.38,
      total: 10.0,
      items: [
        {
          id: 'item_1',
          name: 'Burger',
          quantity: 1,
          finalPrice: 8.62,
          taxRateSnapshot: 0.16,
          taxAmountSnapshot: 1.38,
        },
      ],
    };

    render(<OrderDetailModal order={order} onClose={vi.fn()} />);

    expect(screen.getByText('Tax on items (Customized)')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { StaffView } from './StaffView';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (key === 'common.locale') return 'en';
      if (opts && typeof opts.defaultValue === 'string') return opts.defaultValue;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_target, tag: string) => (props: React.PropsWithChildren<any>) => {
        const { children, initial, animate, transition, ...rest } = props;
        const Tag = tag as any;
        return <Tag {...rest}>{children}</Tag>;
      },
    },
  ),
}));

vi.mock('../../../../context/CurrencyContext', () => ({
  useCurrency: () => ({ currencySymbol: 'JOD' }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ locationSlug: 'main' }),
}));

const shift = (over: Partial<Record<string, unknown>> = {}) => ({
  id: 'shift-1',
  status: 'CLOSED',
  startTime: '2026-08-26T08:00:00.000Z',
  endTime: '2026-08-26T12:00:00.000Z',
  totalSales: 200,
  orderCount: 10,
  totalDiscounts: 0,
  totalRefunds: 25,
  discrepancy: 0,
  user: { name: 'Sara Ali', username: 'Sara Ali' },
  ...over,
});

const cardValue = (label: string) => {
  const title = screen.getByTitle(label);
  return title.parentElement?.textContent?.replace(label, '') ?? '';
};

describe('StaffView totals', () => {
  // Regression: selecting a staff member (or a single shift) used to switch the
  // summary cards onto the staff dropdown's own shift list, which always spans
  // whole days and ignores the shift/time filters — so the cards reported the
  // whole day while the filtered report below showed one shift.
  it('sums only the shifts fetched for the active filters when a staff member is selected', () => {
    render(
      <StaffView
        shifts={[shift()] as any}
        selectedEmployeeId="emp-1"
        rangeEnd="2026-08-26T23:59:00.000Z"
        employees={[{ label: 'Sara Ali', value: 'emp-1' }]}
      />,
    );

    expect(cardValue('orders.reports.staff.totalSales')).toContain('200');
    expect(cardValue('orders.reports.staff.totalRefunds')).toContain('25');
    expect(cardValue('orders.reports.staff.totalOrders')).toContain('10');
  });

  it('matches the unfiltered totals across multiple shifts', () => {
    render(
      <StaffView
        shifts={[shift(), shift({ id: 'shift-2', totalSales: 100, totalRefunds: 5, orderCount: 3 })] as any}
        selectedEmployeeId={null}
        rangeEnd="2026-08-26T23:59:00.000Z"
        employees={[{ label: 'Sara Ali', value: 'emp-1' }]}
      />,
    );

    expect(cardValue('orders.reports.staff.totalSales')).toContain('300');
    expect(cardValue('orders.reports.staff.totalRefunds')).toContain('30');
    expect(cardValue('orders.reports.staff.totalOrders')).toContain('13');
  });
});

const RANGE_END = '2026-08-26T23:59:00.000Z';

const renderLeaderboard = (shifts: any[], rangeEnd = RANGE_END) =>
  render(
    <StaffView
      shifts={shifts as any}
      selectedEmployeeId={null}
      rangeEnd={rangeEnd}
      employees={[{ label: 'Sara Ali', value: 'emp-1' }]}
    />,
  );

const salesPerHourCell = () => {
  // Last cell of the single leaderboard row.
  const cells = screen.getAllByRole('cell');
  return cells[cells.length - 1].textContent ?? '';
};

describe('StaffView sales per hour', () => {
  it('divides sales by hours on the till', () => {
    // 200 over a 4h shift.
    renderLeaderboard([shift()]);
    expect(salesPerHourCell()).toContain('50');
  });

  // Regression: any positive duration used to produce a rate, so a shift a
  // minute long read as hundreds per hour. The Shifts report and the exports
  // already suppressed these.
  it('shows no rate for a shift shorter than five minutes', () => {
    renderLeaderboard([
      shift({
        startTime: '2026-08-26T08:00:00.000Z',
        endTime: '2026-08-26T08:01:00.000Z',
        totalSales: 8.19,
      }),
    ]);

    expect(salesPerHourCell()).toBe('-');
  });

  // Regression: an open shift was measured against `Date.now()` with no bound,
  // so one left open for days buried the rate on a single-day report.
  it('bounds an open shift at the end of the reported window', () => {
    renderLeaderboard([
      shift({ endTime: null, startTime: '2026-08-26T20:00:00.000Z' }),
    ]);

    // 20:00 -> 23:59 is ~4h, not "now minus 20:00".
    const cells = screen.getAllByRole('cell');
    expect(cells[cells.length - 1].textContent).toContain('50');
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CustomerModal } from '../CustomerModal';
import type { Customer } from '../CustomerModal';
import enTranslations from '../../../../src/i18n/locales/en.json';

function resolveKey(obj: unknown, key: string): string | undefined {
  const segments = key.split('.');
  let current: unknown = obj;
  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, vars?: Record<string, unknown>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, name) => {
    const value = vars[name];
    return value === undefined || value === null ? '' : String(value);
  });
}

const mockT = (key: string, options?: Record<string, unknown> | string) => {
  if (key === 'common.locale') {
    return 'en';
  }

  const opts = typeof options === 'string' ? { defaultValue: options } : (options || {});
  const resolved = resolveKey(enTranslations, key);
  if (resolved !== undefined) {
    return interpolate(resolved, opts as Record<string, unknown>);
  }
  if (typeof opts === 'object' && typeof (opts as { defaultValue?: unknown }).defaultValue === 'string') {
    return interpolate((opts as { defaultValue: string }).defaultValue, opts as Record<string, unknown>);
  }
  return key;
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('CustomerModal', () => {
  const mockCustomer: Customer = {
    id: 'cust-123',
    name: 'Jane Doe',
    phone: '+1 555-0199',
    email: 'jane@example.com',
    points: 450,
    totalSpent: 1200.5,
    totalVisits: 8,
  };

  it('renders correctly in Add Customer mode', () => {
    render(
      <CustomerModal
        isOpen={true}
        onClose={vi.fn()}
        customer={null}
        onSaveCustomer={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: /Add Customer/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/E.g. Alexander Hamilton|Full Name/i)).toBeInTheDocument();
  });

  it('renders correctly in Edit/Profile mode with customer stats and populated fields', () => {
    render(
      <CustomerModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
        onSaveCustomer={vi.fn()}
        onAdjustPoints={vi.fn()}
        onDeleteCustomer={vi.fn()}
        currencySymbol="$"
      />
    );

    expect(screen.getByRole('heading', { name: 'Jane Doe' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1 555-0199')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    // Address is intentionally not collected: no input should render for it.
    expect(screen.queryByPlaceholderText(/Street, City, Country/i)).not.toBeInTheDocument();

    // Stats bar checks
    expect(screen.getAllByText('450').length).toBeGreaterThan(0); // points
    expect(screen.getByText('8')).toBeInTheDocument(); // visits
  });

  it('allows switching to Loyalty & Points tab and adjusting points', async () => {
    const mockAdjustPoints = vi.fn().mockResolvedValue(550);

    render(
      <CustomerModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
        onSaveCustomer={vi.fn()}
        onAdjustPoints={mockAdjustPoints}
        currencySymbol="$"
      />
    );

    // Switch to loyalty tab
    const loyaltyTabBtn = screen.getByRole('button', { name: /Adjust Loyalty|Loyalty/i });
    fireEvent.click(loyaltyTabBtn);

    // Should see loyalty points controls
    expect(screen.getByRole('button', { name: /\+100/i })).toBeInTheDocument();

    // Click preset +100 chip
    const preset100Btn = screen.getByRole('button', { name: /\+100/i });
    fireEvent.click(preset100Btn);

    // Verify projected balance banner shows up (450 + 100 = 550)
    expect(screen.getByText(/550 pts/i)).toBeInTheDocument();

    // Click Add Points submit button
    const submitPointsBtn = screen.getByRole('button', { name: /Apply Add Points/i });
    fireEvent.click(submitPointsBtn);

    await waitFor(() => {
      expect(mockAdjustPoints).toHaveBeenCalledWith('cust-123', 100, 'add');
    });
  });

  it('validates customer profile inputs on save', async () => {
    const mockSave = vi.fn();

    render(
      <CustomerModal
        isOpen={true}
        onClose={vi.fn()}
        customer={null}
        onSaveCustomer={mockSave}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Save Customer/i });
    fireEvent.click(submitBtn);

    // Name is required, should not call save
    await waitFor(() => {
      expect(mockSave).not.toHaveBeenCalled();
    });
  });

  it('calls onSaveCustomer when valid data is submitted', async () => {
    const mockSave = vi.fn().mockResolvedValue(true);

    render(
      <CustomerModal
        isOpen={true}
        onClose={vi.fn()}
        customer={null}
        onSaveCustomer={mockSave}
      />
    );

    const nameInput = screen.getByPlaceholderText(/E.g. Alexander Hamilton|Full Name/i);
    fireEvent.change(nameInput, {
      target: { value: 'Alice Smith' },
    });

    const phoneInput = screen.getByPlaceholderText(/\+000 000 000|\+1 234 567 8900/i);
    fireEvent.change(phoneInput, {
      target: { value: '555-1234' },
    });

    const submitBtn = screen.getByRole('button', { name: /Save Customer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Alice Smith',
          phone: '555-1234',
        }),
        undefined
      );
    });
  });

  it('calls onSaveCustomer when only phone is submitted (name is optional and left empty)', async () => {
    const mockSave = vi.fn().mockResolvedValue(true);

    render(
      <CustomerModal
        isOpen={true}
        onClose={vi.fn()}
        customer={null}
        onSaveCustomer={mockSave}
      />
    );

    const phoneInput = screen.getByPlaceholderText(/\+000 000 000|\+1 234 567 8900/i);
    fireEvent.change(phoneInput, {
      target: { value: '555-9876' },
    });

    const submitBtn = screen.getByRole('button', { name: /Save Customer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '',
          phone: '555-9876',
        }),
        undefined
      );
    });
  });

  it('renders remove customer buttons in both header and footer and triggers onDeleteCustomer', () => {
    const mockDelete = vi.fn();

    render(
      <CustomerModal
        isOpen={true}
        onClose={vi.fn()}
        customer={mockCustomer}
        onSaveCustomer={vi.fn()}
        onDeleteCustomer={mockDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /Remove Customer/i });
    expect(deleteButtons.length).toBe(2); // Top header icon button + bottom footer text button

    // Click the bottom remove button
    fireEvent.click(deleteButtons[1]);
    expect(mockDelete).toHaveBeenCalledWith(mockCustomer);
  });
});

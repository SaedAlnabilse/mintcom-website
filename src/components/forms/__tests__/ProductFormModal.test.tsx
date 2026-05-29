import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProductFormModal } from '../ProductFormModal';
import api from '../../../config/api';
import * as productImageUtils from '../../../utils/productImage';
import enTranslations from '../../../i18n/locales/en.json';

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

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ locationSlug: 'test-location' }),
}));

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

vi.mock('../../../hooks/useScrollLock', () => ({
  useScrollLock: vi.fn(),
}));

vi.mock('../../../config/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('ProductFormModal image generation', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    localStorage.clear();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (URL as any).createObjectURL = vi.fn(() => 'blob:mock-preview');
    (URL as any).revokeObjectURL = vi.fn();
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input: any) =>
      Promise.reject(new Error(`Unexpected fetch request: ${String(input)}`))
    );

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/api/attributes') {
        return Promise.resolve({ data: [] }) as any;
      }

      if (url === '/app-settings') {
        return Promise.resolve({ data: { taxRate: 0, currency: 'JOD' } }) as any;
      }

      return Promise.resolve({ data: {} }) as any;
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('uses Pollinations only and saves the generated image', async () => {
    vi.spyOn(productImageUtils, 'generatePollinationsProductImage').mockResolvedValue({
      file: new File(['fake-image'], 'espresso-pollinations.jpg', { type: 'image/jpeg' }),
      previewUrl: 'data:image/jpeg;base64,ZmFrZS1pbWFnZQ==',
      prompt: 'studio product photo of espresso in a cup on clean white background',
    });

    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        categories={[{ id: 'coffee', name: 'Coffee' }]}
        defaultCategoryId="coffee"
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Organic Espresso/i), {
      target: { value: 'Espresso' },
    });

    fireEvent.change(screen.getAllByPlaceholderText(/^0$/i)[0], {
      target: { value: '350' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate image/i }));

    await waitFor(() => {
      expect(screen.getByText('Your generated image is ready.')).toBeInTheDocument();
    });

    expect(api.post).not.toHaveBeenCalled();

    fireEvent.submit(document.getElementById('product-form') as HTMLFormElement);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedFormData = onSubmit.mock.calls[0][0] as FormData;
    const imageFile = submittedFormData.get('image');

    expect(imageFile).toBeInstanceOf(File);
    expect((imageFile as File).name).toContain('espresso-pollinations');
  });

  it('shows a live timer while generating and falls back after a Pollinations failure', async () => {
    vi.spyOn(productImageUtils, 'generatePollinationsProductImage').mockImplementationOnce(() =>
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Pollinations unavailable')), 250);
      })
    );

    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        categories={[{ id: 'coffee', name: 'Coffee' }]}
        defaultCategoryId="coffee"
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Organic Espresso/i), {
      target: { value: 'Organic Espresso' },
    });

    fireEvent.change(screen.getAllByPlaceholderText(/^0$/)[0], {
      target: { value: '350' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Generate image/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Generating\.\.\. 0\.\d{2}s/ })).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Free fallback')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Organic Espresso/i), {
      target: { value: 'Organic Latte' },
    });

    expect(screen.getByText('Needs refresh')).toBeInTheDocument();
    expect(
      screen.getByText('The current image no longer matches the latest product details.')
    ).toBeInTheDocument();

    fireEvent.submit(document.getElementById('product-form') as HTMLFormElement);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const submittedFormData = onSubmit.mock.calls[0][0] as FormData;
    const imageFile = submittedFormData.get('image');

    expect(imageFile).toBeInstanceOf(File);
    expect((imageFile as File).name).toContain('organic-espresso-fallback');
  });

  it('blocks reactivation until an active category is selected', async () => {
    const onReactivate = vi.fn().mockResolvedValue(undefined);

    render(
      <ProductFormModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        onReactivate={onReactivate}
        initialData={{
          id: 'item-1',
          name: 'Archived Latte',
          price: 3.5,
          isAvailable: false,
          categoryId: 'old-category',
          deletedAt: '2026-01-01T00:00:00.000Z',
        }}
        categories={[
          {
            id: 'old-category',
            name: 'Old Category',
            isActive: false,
            deletedAt: '2026-01-01T00:00:00.000Z',
          },
          { id: 'coffee', name: 'Coffee', isActive: true },
        ]}
      />
    );

    expect(screen.getByText('Category needs attention')).toBeInTheDocument();
    expect(screen.getByText(/inactive category/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reactivate/i })).toBeDisabled();

    fireEvent.click(screen.getByText('Old Category (Inactive)'));
    fireEvent.click(screen.getByText('Coffee'));

    const reactivateButton = screen.getByRole('button', { name: /Reactivate/i });
    expect(reactivateButton).not.toBeDisabled();
    fireEvent.click(reactivateButton);

    const confirmButtons = screen.getAllByRole('button', { name: /Reactivate/i });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    expect(onReactivate).toHaveBeenCalledWith('item-1', 'coffee');
  });
});

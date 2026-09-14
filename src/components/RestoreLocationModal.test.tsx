import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type React from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  RestoreLocationModal,
  type RestoreLocationFormData,
} from './RestoreLocationModal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'common.locale' ? 'en' : key),
  }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

describe('RestoreLocationModal', () => {
  it('sends every verified credential under the cancel-deletion API contract', async () => {
    const onRestore = vi.fn<
      (data: RestoreLocationFormData) => Promise<void>
    >().mockResolvedValue(undefined);

    render(
      <RestoreLocationModal
        isOpen
        onClose={vi.fn()}
        onRestore={onRestore}
        isRestoring={false}
      />,
    );

    const stepOneInputs = document.querySelectorAll<HTMLInputElement>(
      'input',
    );
    fireEvent.change(stepOneInputs[0], {
      target: { value: 'owner@example.com' },
    });
    fireEvent.change(stepOneInputs[1], {
      target: { value: 'OwnerPassword1!' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'common.next' }));

    const stepTwoInputs = document.querySelectorAll<HTMLInputElement>('input');
    fireEvent.change(stepTwoInputs[0], { target: { value: 'cafe-restored' } });
    fireEvent.change(stepTwoInputs[1], {
      target: { value: 'NewLocationPassword1!' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'security.restore.confirm' }),
    );

    await waitFor(() => {
      expect(onRestore).toHaveBeenCalledWith({
        accountEmail: 'owner@example.com',
        password: 'OwnerPassword1!',
        authProvider: 'password',
        newLocationLoginId: 'cafe-restored',
        newLocationPassword: 'NewLocationPassword1!',
      });
    });
  });
});

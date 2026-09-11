import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsOverviewHub } from '../SettingsOverviewHub';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: any) => {
      if (typeof defaultValue === 'string') return defaultValue;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

describe('SettingsOverviewHub', () => {
  const mockSettings = {
    restaurantName: 'Cedar & Spice',
    taxRate: 16,
    currency: 'JOD',
    receiptLogo: 'https://example.com/logo.png',
    fiscalEnabled: true,
    holdOrderTableCount: 12,
  };

  const mockEstablishment = {
    id: 'est-1',
    name: 'Cedar & Spice — Abdali Flagship',
    currency: 'JOD',
  };

  const permittedTabIds = [
    'profile',
    'sales',
    'pos',
    'receipt',
    'einvoicing',
    'accounting',
    'danger',
  ];

  it('renders overview header and location name', () => {
    render(
      <SettingsOverviewHub
        settings={mockSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={permittedTabIds}
        onNavigateToSection={vi.fn()}
      />,
    );

    expect(screen.getByText('Settings & Configuration')).toBeDefined();
    expect(screen.getByText('Cedar & Spice — Abdali Flagship')).toBeDefined();
  });

  it('renders permitted cards and triggers onNavigateToSection when clicked', () => {
    const onNavigate = vi.fn();
    render(
      <SettingsOverviewHub
        settings={mockSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={permittedTabIds}
        onNavigateToSection={onNavigate}
      />,
    );

    const storeProfileCard = screen.getByText('Store Profile');
    expect(storeProfileCard).toBeDefined();

    fireEvent.click(storeProfileCard);
    expect(onNavigate).toHaveBeenCalledWith('profile');
  });

  it('only renders permitted category cards', () => {
    render(
      <SettingsOverviewHub
        settings={mockSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={['sales']}
        onNavigateToSection={vi.fn()}
      />,
    );

    expect(screen.getByText('Sales Setup & Taxes')).toBeDefined();
    expect(screen.queryByText('Store Profile')).toBeNull();
  });

  it('renders empty state when no categories are permitted', () => {
    render(
      <SettingsOverviewHub
        settings={mockSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={[]}
        onNavigateToSection={vi.fn()}
      />,
    );
    expect(
      screen.getByText('No settings sections available for your account.'),
    ).toBeDefined();
  });

  it('renders long establishment name badge fully without truncation', () => {
    const longNameSettings = {
      ...mockSettings,
      restaurantName: 'Cedar & Spice — Rainbow Street Flagship',
    };
    render(
      <SettingsOverviewHub
        settings={longNameSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={permittedTabIds}
        onNavigateToSection={vi.fn()}
      />,
    );

    const badge = screen.getByText('Cedar & Spice — Rainbow Street Flagship');
    expect(badge).toBeDefined();
    expect(badge.getAttribute('title')).toBe(
      'Cedar & Spice — Rainbow Street Flagship',
    );
  });
});


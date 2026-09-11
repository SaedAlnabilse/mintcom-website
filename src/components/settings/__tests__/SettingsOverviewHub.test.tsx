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

  it('renders overview header, location name, and glance stats', () => {
    render(
      <SettingsOverviewHub
        settings={mockSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={permittedTabIds}
        onNavigateToSection={vi.fn()}
        currencySymbol="JD"
      />,
    );

    expect(screen.getByText('Settings & Configuration')).toBeDefined();
    expect(screen.getByText('Cedar & Spice — Abdali Flagship')).toBeDefined();
    expect(screen.getByText('JOD (JD)')).toBeDefined();
    expect(screen.getByText('16%')).toBeDefined();
  });

  it('renders permitted cards and triggers onNavigateToSection when clicked', () => {
    const onNavigate = vi.fn();
    render(
      <SettingsOverviewHub
        settings={mockSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={permittedTabIds}
        onNavigateToSection={onNavigate}
        currencySymbol="JD"
      />,
    );

    const storeProfileCard = screen.getByText('Store Profile');
    expect(storeProfileCard).toBeDefined();

    fireEvent.click(storeProfileCard);
    expect(onNavigate).toHaveBeenCalledWith('profile');
  });

  it('filters cards by search query', () => {
    render(
      <SettingsOverviewHub
        settings={mockSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={permittedTabIds}
        onNavigateToSection={vi.fn()}
        currencySymbol="JD"
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      'Search settings... (e.g. tax, receipt, logo, shifts)',
    );
    fireEvent.change(searchInput, { target: { value: 'shifts' } });

    expect(screen.getByText('POS & Shifts')).toBeDefined();
    expect(screen.queryByText('Store Profile')).toBeNull();
  });

  it('shows empty search state when nothing matches', () => {
    render(
      <SettingsOverviewHub
        settings={mockSettings}
        currentEstablishment={mockEstablishment}
        permittedTabIds={permittedTabIds}
        onNavigateToSection={vi.fn()}
        currencySymbol="JD"
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      'Search settings... (e.g. tax, receipt, logo, shifts)',
    );
    fireEvent.change(searchInput, { target: { value: 'nonexistentkeyword12345' } });

    expect(screen.getByText('No settings match your search')).toBeDefined();
    expect(screen.getByText('Clear search')).toBeDefined();

    fireEvent.click(screen.getByText('Clear search'));
    expect(screen.getByText('Store Profile')).toBeDefined();
  });
});

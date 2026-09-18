import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SidebarUserProfileFooter } from '../SidebarUserProfileFooter';
import { MobileNavigationDrawer } from '../MobileNavigationDrawer';
import { LayoutDashboard } from 'lucide-react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    account: { id: 'acc-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    currentEstablishment: null,
    establishments: [],
  }),
}));

describe('Layout Deduplicated Components', () => {
  it('renders SidebarUserProfileFooter actions without an identity card', () => {
    render(
      <MemoryRouter>
        <SidebarUserProfileFooter
          sidebarOpen={true}
          scope="owner"
          locations={[]}
          onOpenMobileAppModal={vi.fn()}
          onLogout={vi.fn()}
        />
      </MemoryRouter>,
    );

    // The identity card was removed from the sidebar/drawer footer; the
    // actions it sat above must all still be reachable.
    expect(screen.getByText('dashboard.menu.logout')).toBeDefined();
    expect(screen.getByText('owner.menu.getMobileApp')).toBeDefined();
    expect(screen.queryByText('John Doe')).toBeNull();
    expect(screen.queryByText('john@example.com')).toBeNull();
  });

  it('renders MobileNavigationDrawer navigation items and keeps logout reachable', () => {
    render(
      <MemoryRouter>
        <MobileNavigationDrawer
          isOpen={true}
          onClose={vi.fn()}
          menuItems={[
            { icon: LayoutDashboard, label: 'Overview', path: '/owner' },
          ]}
          account={{ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' } as any}
          scope="owner"
          onLogout={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText('Overview')).toBeDefined();
    // The identity card was removed from the drawer; logout must survive it,
    // since the card's icon button used to be the only way out on mobile.
    expect(screen.getByText('Log out')).toBeDefined();
    expect(screen.queryByText('John')).toBeNull();
  });
});

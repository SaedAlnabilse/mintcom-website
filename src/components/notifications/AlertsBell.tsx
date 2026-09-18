import { useMemo } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { REQUIRED_PERMISSIONS } from '../../config/permissions';
import { useAuth } from '../../context/AuthContext';
import { useBackofficeAlerts } from '../../hooks/useBackofficeAlerts';
import { checkPermission } from '../../hooks/usePermissionGuard';
import type { BackofficeAlertScope } from '../../services/backofficeAlertsApi';

export interface AlertsBellLocation {
  id: string;
  name: string;
  slug?: string;
  currency?: string;
}

export interface AlertsBellProps {
  scope: BackofficeAlertScope;
  establishmentId?: string;
  establishmentIds?: readonly string[];
  locations?: readonly AlertsBellLocation[];
  className?: string;
}

export function AlertsBell({
  scope,
  establishmentId,
  establishmentIds,
  locations = [],
  className = '',
}: AlertsBellProps) {
  const { t } = useTranslation();
  const { account } = useAuth();
  const { pathname } = useLocation();
  const { brandId, locationSlug } = useParams<{
    brandId?: string;
    locationSlug?: string;
  }>();

  const hasAccess = checkPermission(
    account,
    REQUIRED_PERMISSIONS.notifications,
  );
  const countState = useBackofficeAlerts({
    scope,
    establishmentId,
    establishmentIds,
    enabled: hasAccess,
    mode: 'count',
  });

  const activeLocationSlug =
    locationSlug ||
    (establishmentId
      ? locations.find((location) => location.id === establishmentId)?.slug
      : undefined);

  const notificationsPath = useMemo(() => {
    if (scope === 'owner') return '/owner/notifications';
    if (scope === 'brand') {
      return brandId
        ? `/brand/${encodeURIComponent(brandId)}/notifications`
        : null;
    }
    return activeLocationSlug
      ? `/dashboard/${encodeURIComponent(activeLocationSlug)}/notifications`
      : null;
  }, [activeLocationSlug, brandId, scope]);

  if (!hasAccess || !notificationsPath) return null;

  const isActive = pathname === notificationsPath;
  const unreadCount = countState.unreadCount;
  const badge = unreadCount > 99 ? '99+' : String(unreadCount);
  const bellLabel = t('notifications.bell.ariaLabel', {
    count: unreadCount,
    defaultValue: 'Notifications, {{count}} unread',
  });

  return (
    <div className={`relative ${className}`}>
      <Link
        to={notificationsPath}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition focus:outline-none focus:ring-2 focus:ring-mintcom-green ${
          isActive
            ? 'bg-mintcom-green/10 text-mintcom-green'
            : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
        }`}
        aria-label={bellLabel}
        aria-current={isActive ? 'page' : undefined}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute -end-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white dark:ring-zinc-900"
            aria-hidden="true"
          >
            {badge}
          </span>
        )}
      </Link>
    </div>
  );
}

export default AlertsBell;

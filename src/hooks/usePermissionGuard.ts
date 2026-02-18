import { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { REQUIRED_PERMISSIONS, hasPermission as checkPerms } from '../config/permissions';

/**
 * Hook to check if the current user has permission to access the current page.
 * If not, redirects to dashboard and shows an error toast.
 *
 * Uses the centralized hasPermission helper from config/permissions.ts
 * which normalizes legacy aliases → canonical names before comparison.
 *
 * @param overridePermissions - Optional custom permissions to check instead of route-based
 * @returns { hasPermission: boolean, requiredPermissions: string[] }
 */
export function usePermissionGuard(overridePermissions?: string[]) {
  const { account } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { locationSlug } = useParams();

  // Extract relative path from current location
  const getRelativePath = (): string => {
    const fullPath = location.pathname;
    // Pattern: /dashboard/:slug/rest -> rest
    const match = fullPath.match(/^\/dashboard\/[^/]+\/(.+)$/);
    if (match) return match[1];
    // Pattern: /dashboard/:slug -> '.'
    if (fullPath.match(/^\/dashboard\/[^/]+\/?$/)) return '.';
    return fullPath;
  };

  const relativePath = getRelativePath();
  const requiredPermissions = overridePermissions || REQUIRED_PERMISSIONS[relativePath];

  // Check if user has at least one of the required permissions
  const hasPermission = (): boolean => {
    // No account = not authenticated, let ProtectedRoute handle it
    if (!account) return true;

    // Primary owners bypass all permission checks
    if (!account.isSecondaryAdmin) return true;

    // No permissions required for this route
    if (!requiredPermissions || requiredPermissions.length === 0) return true;

    // Alias-aware permission check via centralized helper
    return checkPerms(account.permissions, requiredPermissions);
  };

  useEffect(() => {
    if (!hasPermission()) {
      toast.error('You do not have permission to access this page', {
        duration: 5000,
        id: 'route-permission-denied',
      });

      // Redirect to dashboard home
      const dashboardHome = locationSlug ? `/dashboard/${locationSlug}` : '/dashboard';
      navigate(dashboardHome, { replace: true });
    }
  }, [location.pathname, account?.permissions]);

  return {
    hasPermission: hasPermission(),
    requiredPermissions,
  };
}

/**
 * Helper function to check if user has a specific permission.
 * Use this for checking permissions within components (e.g., hide/show buttons).
 *
 * Uses the centralized hasPermission helper from config/permissions.ts
 * which normalizes legacy aliases → canonical names before comparison.
 *
 * @param account - The account object from useAuth()
 * @param requiredPermissions - Array of permission strings (user needs at least one)
 * @returns boolean
 */
export function checkPermission(
  account: { isSecondaryAdmin?: boolean; permissions?: string[] } | null,
  requiredPermissions: string[]
): boolean {
  // No account = not authenticated
  if (!account) return false;

  // Primary owners bypass all permission checks
  if (!account.isSecondaryAdmin) return true;

  // No permissions required
  if (!requiredPermissions || requiredPermissions.length === 0) return true;

  // Alias-aware permission check via centralized helper
  return checkPerms(account.permissions, requiredPermissions);
}

import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FullScreenLoader } from './LoadingState';

const LOCKED_SUBSCRIPTION_STATUSES = new Set([
  'CANCELED',
  'SUSPENDED',
  'TRIAL_EXPIRED',
]);

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, needsOnboarding, account, establishments } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  // Only redirect if we're NOT loading and there's NO account data
  if (!isAuthenticated && !account) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // If user needs onboarding (no establishments), redirect to onboarding
  // But allow access to onboarding page itself
  // NOTE: Only redirect if we've confirmed establishments are actually empty
  // (not just still loading)
  if (needsOnboarding && !location.pathname.startsWith('/onboarding') && establishments.length === 0) {
    console.log('[ProtectedRoute] No establishments, redirecting to onboarding');
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

// Separate component for routes that require an establishment
export function EstablishmentRequiredRoute() {
  const { isAuthenticated, isLoading, needsOnboarding, currentEstablishment, account } = useAuth();
  const location = useLocation();
  const { locationSlug } = useParams();

  if (isLoading) {
    return <FullScreenLoader />;
  }

  // Only redirect if we're NOT loading and there's NO account data
  if (!isAuthenticated && !account) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  // If no location slug, redirect to select-establishment
  if (!locationSlug) {
    return <Navigate to="/select-establishment" replace />;
  }

  if (!currentEstablishment) {
    return <Navigate to={`/dashboard/${locationSlug}/establishments`} replace />;
  }

  // Lock normal dashboard access when billing has suspended the location.
  // Redirect to the owner-level billing page to reactivate.
  if (LOCKED_SUBSCRIPTION_STATUSES.has(currentEstablishment.subscriptionStatus)) {
    return <Navigate to="/owner/billing" replace />;
  }

  return <Outlet />;
}





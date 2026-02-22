import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, needsOnboarding, account, establishments } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-paymint-green mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
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
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-paymint-green mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
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

  // Lock access if subscription is canceled
  // Except for the billing page so they can reactivate
  const isBillingPage = location.pathname.includes('/billing');
  if (currentEstablishment.subscriptionStatus === 'CANCELED' && !isBillingPage) {
    return <Navigate to={`/dashboard/${locationSlug}/billing`} replace />;
  }

  return <Outlet />;
}




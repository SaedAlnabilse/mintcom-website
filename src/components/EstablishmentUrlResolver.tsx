import { useEffect } from 'react';
import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingFallback } from './LoadingFallback';

const LOCKED_SUBSCRIPTION_STATUSES = new Set([
    'CANCELED',
    'SUSPENDED',
    'TRIAL_EXPIRED',
]);

export function EstablishmentUrlResolver({ children }: { children: React.ReactNode }) {
    const {
        establishments,
        currentEstablishment,
        setCurrentEstablishment,
        isLoading: authLoading,
        isAuthenticated,
        needsOnboarding
    } = useAuth();

    const { locationSlug } = useParams<{ locationSlug: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            navigate('/login', { replace: true, state: { from: location } });
            return;
        }

        if (needsOnboarding) {
            navigate('/onboarding', { replace: true });
            return;
        }

        if (!locationSlug) {
            navigate('/select-establishment', { replace: true });
            return;
        }

        const isCurrentMatch = currentEstablishment && (
            currentEstablishment.establishmentLoginId === locationSlug ||
            currentEstablishment.id === locationSlug
        );

        if (isCurrentMatch) {
            const persistedEstablishment = sessionStorage.getItem('currentEstablishment');
            let persistedEstablishmentId: string | null = null;

            if (persistedEstablishment) {
                try {
                    persistedEstablishmentId = JSON.parse(persistedEstablishment)?.id ?? null;
                } catch {
                    persistedEstablishmentId = null;
                }
            }

            if (!persistedEstablishmentId || persistedEstablishmentId !== currentEstablishment.id) {
                setCurrentEstablishment(currentEstablishment);
            }

            // Force redirect to slug if we are on ID
            if (currentEstablishment && 
                currentEstablishment.establishmentLoginId && 
                locationSlug === currentEstablishment.id && 
                locationSlug !== currentEstablishment.establishmentLoginId) {
                
                const newPath = location.pathname.replace(
                    `/dashboard/${locationSlug}`, 
                    `/dashboard/${currentEstablishment.establishmentLoginId}`
                );
                navigate(newPath, { replace: true });
            }
            return;
        }

        const targetEst = establishments.find(e =>
            e.establishmentLoginId === locationSlug ||
            e.id === locationSlug
        );

        if (targetEst) {
            setCurrentEstablishment(targetEst);
        } else {
            navigate('/select-establishment', { replace: true });
        }

    }, [
        authLoading,
        isAuthenticated,
        needsOnboarding,
        locationSlug,
        establishments,
        currentEstablishment,
        navigate,
        setCurrentEstablishment,
        location
    ]);

    if (authLoading) {
        return <LoadingFallback message="Validating location..." />;
    }

    if (!currentEstablishment || (
        currentEstablishment.id !== locationSlug &&
        currentEstablishment.establishmentLoginId !== locationSlug
    )) {
        return <LoadingFallback message="Switching location..." />;
    }

    const isBillingPage = location.pathname.includes('/billing');
    if (
        LOCKED_SUBSCRIPTION_STATUSES.has(currentEstablishment.subscriptionStatus) &&
        !isBillingPage
    ) {
        const basePath = `/dashboard/${locationSlug}`;
        return <Navigate to={`${basePath}/billing`} replace />;
    }

    return <>{children}</>;
}


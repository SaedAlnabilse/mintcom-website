import { useCallback, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AlertTriangle, CalendarClock, LogOut, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import api, { extractErrorMessage } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { SecurityVerificationModal } from '../components/SecurityVerificationModal';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import {
  AppleAuthButton,
  type AppleAuthCredential,
} from '../components/AppleAuthButton';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';
import {
  getDaysUntilDeletion,
  getDeletionDeadline,
  hasPendingAccountDeletion,
} from '../utils/deletionRecovery';

type RestorePayload =
  | { authProvider: 'google'; credential: string }
  | { authProvider: 'apple'; identityToken: string; nonce: string };

export function AccountRecoveryPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    account,
    establishments,
    logout,
    refreshEstablishments,
    refreshProfile,
    updateAccount,
  } = useAuth();
  const [showPasswordVerification, setShowPasswordVerification] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [providerError, setProviderError] = useState<string | null>(null);

  const deadline = getDeletionDeadline(account?.deletionScheduledFor);
  const daysRemaining = getDaysUntilDeletion(account?.deletionScheduledFor);
  const formattedDeadline = useMemo(
    () =>
      deadline?.toLocaleDateString(i18n.language || 'en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }) ?? null,
    [deadline, i18n.language],
  );

  const finishRestoration = useCallback(async () => {
    // The restore request already succeeded. Remove the local lock immediately
    // so a transient refresh failure never traps the owner in a second restore.
    updateAccount({
      deletionRequestedAt: null,
      deletionScheduledFor: null,
    });

    const [profileResult, establishmentsResult] = await Promise.allSettled([
      refreshProfile(),
      refreshEstablishments(),
    ]);

    if (profileResult.status === 'rejected' || establishmentsResult.status === 'rejected') {
      toast.error(
        t('account.recovery.refreshFailed', {
          defaultValue: 'Your account was restored, but some account data could not be refreshed. It will reload on the next page.',
        }),
      );
    }

    const refreshedEstablishments =
      establishmentsResult.status === 'fulfilled'
        ? establishmentsResult.value
        : establishments;

    navigate(
      refreshedEstablishments.length > 0 ? '/select-establishment' : '/onboarding',
      { replace: true },
    );
  }, [establishments, navigate, refreshEstablishments, refreshProfile, t, updateAccount]);

  const restoreWithProvider = async (payload: RestorePayload) => {
    try {
      setIsRestoring(true);
      setProviderError(null);
      const response = await api.post('/api/accounts/me/restore', payload, {
        headers: { 'X-Skip-Auth-Redirect': 'true' },
      });
      await finishRestoration();
      toast.success(response.data?.message || t('account.restored'));
    } catch (error) {
      setProviderError(
        extractErrorMessage(error) ||
          t('account.restoreFailed'),
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleGoogleRestore = (credential: string) => {
    void restoreWithProvider({ authProvider: 'google', credential });
  };

  const handleAppleRestore = (credential: AppleAuthCredential) => {
    void restoreWithProvider({
      authProvider: 'apple',
      identityToken: credential.identityToken,
      nonce: credential.nonce,
    });
  };

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  if (!hasPendingAccountDeletion(account)) {
    return (
      <Navigate
        to={establishments.length > 0 ? '/select-establishment' : '/onboarding'}
        replace
      />
    );
  }

  const provider = account.authProvider || 'password';

  return (
    <div
      dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-gray-50 px-5 py-6 text-gray-900 dark:bg-[#050505] dark:text-white sm:px-8"
    >
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
        <div>
          <img src={MintcomLogoGreen} alt="Mintcom" className="h-9 w-auto dark:hidden" />
          <img src={MintcomLogoWhite} alt="Mintcom" className="hidden h-9 w-auto dark:block" />
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-600 transition-colors hover:text-red-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">{t('common.logout')}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-92px)] w-full max-w-xl items-center py-10">
        <section className="w-full overflow-hidden rounded-3xl border border-red-200 bg-white shadow-xl shadow-red-950/5 dark:border-red-500/20 dark:bg-[#111827]">
          <div className="border-b border-red-100 bg-red-50 px-6 py-5 dark:border-red-500/10 dark:bg-red-500/10 sm:px-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  {t('account.recovery.title', { defaultValue: 'Restore your Mintcom account' })}
                </h1>
                <p className="mt-1 text-sm font-medium text-red-700 dark:text-red-300">
                  {t('account.recovery.locked', {
                    defaultValue: 'Your account is locked while permanent deletion is pending.',
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-6 sm:p-8">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 shrink-0 text-red-600" size={20} />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {daysRemaining === null
                      ? t('account.deletionScheduled', { count: 0 })
                      : t('account.deletionScheduled', { count: daysRemaining })}
                  </p>
                  {formattedDeadline && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {t('account.recovery.deadline', {
                        date: formattedDeadline,
                        defaultValue: 'Permanent deletion is scheduled for {{date}}.',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm font-medium leading-6 text-gray-600 dark:text-gray-300">
              {t('account.recovery.explanation', {
                defaultValue: 'Verify your identity to cancel deletion. Your account and the establishments locked by this account deletion will be restored.',
              })}
            </p>

            {providerError && (
              <div
                role="alert"
                className="rounded-2xl border border-mintcom-red bg-mintcom-red p-4 text-sm font-bold text-white"
              >
                {providerError}
              </div>
            )}

            {provider === 'google' ? (
              <GoogleAuthButton
                onSuccess={handleGoogleRestore}
                onError={setProviderError}
                text="continue_with"
                disabled={isRestoring}
              />
            ) : provider === 'apple' ? (
              <AppleAuthButton
                onSuccess={handleAppleRestore}
                onError={setProviderError}
                text="continue_with"
                disabled={isRestoring}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setProviderError(null);
                  setShowPasswordVerification(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mintcom-green px-5 py-4 text-sm font-black text-black transition-colors hover:bg-[#69b690]"
              >
                <ShieldCheck size={19} />
                {t('account.restoreAction')}
              </button>
            )}

            <p className="text-center text-xs font-medium text-gray-400">
              {t('account.recovery.noCookieOnly', {
                defaultValue: 'For your security, being signed in is not enough. Identity verification is required.',
              })}
            </p>
          </div>
        </section>
      </main>

      <SecurityVerificationModal
        isOpen={showPasswordVerification}
        onClose={() => setShowPasswordVerification(false)}
        onSuccess={finishRestoration}
        targetId="me"
        targetName={account.email}
        mode="reactivate-account"
      />
    </div>
  );
}


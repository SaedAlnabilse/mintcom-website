import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { extractErrorMessage } from '../../config/api';

export const AccountingCallbackPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

    const exchangeToken = async () => {
      const code = searchParams.get('code');
      const realmId = searchParams.get('realmId');
      const state = searchParams.get('state');
      const errorParam = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        setIsProcessing(false);
        setError(errorDescription || errorParam || 'OAuth authorization failed.');
        return;
      }

      if (!code) {
        setIsProcessing(false);
        setError('No authorization code returned from provider.');
        return;
      }

      const savedProvider =
        sessionStorage.getItem('pending_accounting_provider') ||
        (realmId ? 'QUICKBOOKS' : 'XERO');
      const returnUrl =
        sessionStorage.getItem('accounting_return_url') || '/select-establishment';

      try {
        // The server resolves the redirect URI itself and verifies `state`, so
        // neither is ours to send. redirectUri is not merely unused: the
        // ValidationPipe runs forbidNonWhitelisted, so a stray field is a 400
        // reading "property redirectUri should not exist".
        await api.post(`/api/accounting/oauth/${savedProvider.toLowerCase()}/callback`, {
          code,
          state,
          realmId: realmId || undefined,
        });

        sessionStorage.removeItem('pending_accounting_provider');
        sessionStorage.removeItem('accounting_return_url');

        toast.success(
          t('settings.accounting.connectedSuccess', 'Successfully connected to {{provider}}!', {
            provider: savedProvider,
          }),
        );

        // Ensure target return URL has tab=accounting
        const targetUrl = new URL(returnUrl, window.location.origin);
        targetUrl.searchParams.set('tab', 'accounting');
        navigate(targetUrl.pathname + targetUrl.search, { replace: true });
      } catch (err) {
        setIsProcessing(false);
        const msg = extractErrorMessage(err) || 'Failed to exchange OAuth token.';
        setError(msg);
        toast.error(msg);
      }
    };

    exchangeToken();
  }, [searchParams, navigate, t]);

  const handleReturn = () => {
    const returnUrl =
      sessionStorage.getItem('accounting_return_url') || '/select-establishment';
    navigate(returnUrl, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.05] rounded-3xl p-8 shadow-xl text-center space-y-6">
        {isProcessing ? (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-[#13B5EA]/10 text-[#13B5EA] flex items-center justify-center mx-auto">
              <Loader2 size={32} className="animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Connecting to Accounting Provider...
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please wait while we complete authorization and secure your connection.
            </p>
          </div>
        ) : error ? (
          <div className="space-y-4 py-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Connection Failed
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 p-3 rounded-xl break-words">
              {error}
            </p>
            <button
              type="button"
              onClick={handleReturn}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ArrowLeft size={16} />
              Return to Settings
            </button>
          </div>
        ) : (
          <div className="space-y-4 py-8">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Connected Successfully!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Redirecting you back to your accounting settings...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountingCallbackPage;

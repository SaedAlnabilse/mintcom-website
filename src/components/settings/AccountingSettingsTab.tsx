import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  RotateCw,
  AlertTriangle,
  Unplug,
  Save,
  Building2,
  ShieldCheck,
  Calendar,
  Layers,
  Copy,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api, { extractErrorMessage } from '../../config/api';
import { getAccountingRedirectUri } from '../../utils/accountingOAuth';

interface AccountInfo {
  code: string;
  name: string;
  type: string;
  taxType?: string;
  status: 'ACTIVE' | 'ARCHIVED';
}

interface AccountingMapping {
  cashClearingAccountId: string;
  cardClearingAccountId: string;
  deliveryClearingAccountId?: string | null;
  deliveryCommissionExpenseAccountId?: string | null;
  cashVarianceExpenseAccountId: string;
  salesStandardVatAccountId: string;
  salesReducedVatAccountId?: string | null;
  salesZeroVatAccountId: string;
  salesExemptAccountId?: string | null;
  serviceChargeAccountId?: string | null;
  vatLiabilityAccountId: string;
  staffTipsPayableAccountId?: string | null;
  cashVarianceIncomeAccountId: string;
  roundingAdjustmentAccountId: string;
}

interface IntegrationStatus {
  id?: string;
  provider: 'XERO' | 'QUICKBOOKS' | null;
  isConnected: boolean;
  tenantId?: string | null;
  tenantName?: string | null;
  country?: string;
  maskedAccessToken?: string;
  tokenExpiresAt?: string | null;
  syncAutoOnClose?: boolean;
  lastSyncAt?: string | null;
  mapping?: AccountingMapping | null;
}

interface SyncLog {
  id: string;
  shiftId: string;
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  externalReferenceId?: string | null;
  externalUrl?: string | null;
  debitTotal: number;
  creditTotal: number;
  roundingDrift: number;
  errorMessage?: string | null;
  retryCount: number;
  syncedAt?: string | null;
  createdAt: string;
  shift: {
    id: string;
    startTime: string;
    endTime: string | null;
    employeeName: string;
  };
}

export const AccountingSettingsTab: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<IntegrationStatus | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [mappingForm, setMappingForm] = useState<AccountingMapping>({
    cashClearingAccountId: '',
    cardClearingAccountId: '',
    deliveryClearingAccountId: '',
    cashVarianceExpenseAccountId: '',
    salesStandardVatAccountId: '',
    salesReducedVatAccountId: '',
    salesZeroVatAccountId: '',
    salesExemptAccountId: '',
    serviceChargeAccountId: '',
    vatLiabilityAccountId: '',
    staffTipsPayableAccountId: '',
    cashVarianceIncomeAccountId: '',
    roundingAdjustmentAccountId: '',
  });

  const [savingMapping, setSavingMapping] = useState(false);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [retryingShiftId, setRetryingShiftId] = useState<string | null>(null);
  const [refreshingLogs, setRefreshingLogs] = useState(false);

  const isUS = (status?.country || 'GB').toUpperCase() === 'US';

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statusRes, logsRes] = await Promise.all([
        api.get<IntegrationStatus>('/api/accounting/status'),
        api.get<SyncLog[]>('/api/accounting/logs').catch(() => ({ data: [] })),
      ]);

      const integStatus = statusRes.data;
      setStatus(integStatus);
      setLogs(logsRes.data || []);

      if (integStatus?.mapping) {
        setMappingForm({
          cashClearingAccountId: integStatus.mapping.cashClearingAccountId || '',
          cardClearingAccountId: integStatus.mapping.cardClearingAccountId || '',
          deliveryClearingAccountId: integStatus.mapping.deliveryClearingAccountId || '',
          cashVarianceExpenseAccountId: integStatus.mapping.cashVarianceExpenseAccountId || '',
          salesStandardVatAccountId: integStatus.mapping.salesStandardVatAccountId || '',
          salesReducedVatAccountId: integStatus.mapping.salesReducedVatAccountId || '',
          salesZeroVatAccountId: integStatus.mapping.salesZeroVatAccountId || '',
          salesExemptAccountId: integStatus.mapping.salesExemptAccountId || '',
          serviceChargeAccountId: integStatus.mapping.serviceChargeAccountId || '',
          vatLiabilityAccountId: integStatus.mapping.vatLiabilityAccountId || '',
          staffTipsPayableAccountId: integStatus.mapping.staffTipsPayableAccountId || '',
          cashVarianceIncomeAccountId: integStatus.mapping.cashVarianceIncomeAccountId || '',
          roundingAdjustmentAccountId: integStatus.mapping.roundingAdjustmentAccountId || '',
        });
      }

      if (integStatus?.isConnected) {
        const accsRes = await api.get<AccountInfo[]>('/api/accounting/accounts').catch(() => ({ data: [] }));
        setAccounts(accsRes.data || []);
      }
    } catch (err) {
      console.error('[Accounting] Failed to load status:', err);
      toast.error(extractErrorMessage(err) || 'Failed to load accounting settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle OAuth code exchange if redirected from Xero / QuickBooks
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const realmId = params.get('realmId');
      const state = params.get('state');
      const savedProvider = sessionStorage.getItem('pending_accounting_provider') || (realmId ? 'QUICKBOOKS' : 'XERO');

      if (code) {
        try {
          toast.loading(t('settings.accounting.connecting', 'Connecting to accounting provider...'), { id: 'oauth-exchange' });

          // The server resolves the redirect URI itself and verifies `state`,
          // so neither is ours to choose. state is required: without it the
          // callback is refused.
          await api.post(`/api/accounting/oauth/${savedProvider.toLowerCase()}/callback`, {
            code,
            state,
            realmId: realmId || undefined,
          });

          sessionStorage.removeItem('pending_accounting_provider');
          // Clear query params cleanly and keep tab=accounting
          params.delete('code');
          params.delete('state');
          params.delete('realmId');
          params.set('tab', 'accounting');
          const cleanUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
          window.history.replaceState({}, document.title, cleanUrl);

          toast.success(t('settings.accounting.connectedSuccess', 'Successfully connected to {{provider}}!', { provider: savedProvider }), { id: 'oauth-exchange' });
          await fetchData();
        } catch (err) {
          toast.error(extractErrorMessage(err) || 'Failed to exchange OAuth token.', { id: 'oauth-exchange' });
        }
      }
    };

    handleOAuthCallback();
  }, [fetchData, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Initiate OAuth connect
  const handleConnect = async (provider: 'XERO' | 'QUICKBOOKS') => {
    try {
      setConnectingProvider(provider);
      sessionStorage.setItem('pending_accounting_provider', provider);
      sessionStorage.setItem('accounting_return_url', window.location.pathname + window.location.search);

      const res = await api.get<{ authorizationUrl: string }>(
        `/api/accounting/oauth/${provider.toLowerCase()}/authorize`,
      );

      if (res.data?.authorizationUrl) {
        window.location.href = res.data.authorizationUrl;
      } else {
        throw new Error('No authorization URL returned from server.');
      }
    } catch (err) {
      toast.error(extractErrorMessage(err) || `Failed to initiate ${provider} connection.`);
      setConnectingProvider(null);
    }
  };

  // Disconnect integration
  const handleDisconnect = async () => {
    if (!window.confirm(t('settings.accounting.confirmDisconnect', 'Are you sure you want to disconnect your accounting software? Automatic Z-report sync will be suspended.'))) {
      return;
    }
    try {
      setDisconnecting(true);
      await api.post('/api/accounting/disconnect');
      toast.success(t('settings.accounting.disconnectedSuccess', 'Accounting software disconnected.'));
      await fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err) || 'Failed to disconnect accounting software.');
    } finally {
      setDisconnecting(false);
    }
  };

  // Save Chart of Accounts mapping
  const handleSaveMapping = async (e: React.FormEvent) => {
    e.preventDefault();

    // Required fields verification
    const requiredKeys: (keyof AccountingMapping)[] = [
      'cashClearingAccountId',
      'cardClearingAccountId',
      'cashVarianceExpenseAccountId',
      'salesStandardVatAccountId',
      'salesZeroVatAccountId',
      'vatLiabilityAccountId',
      'cashVarianceIncomeAccountId',
      'roundingAdjustmentAccountId',
    ];

    for (const key of requiredKeys) {
      if (!mappingForm[key]?.trim()) {
        toast.error(t('settings.accounting.requiredFieldMissing', 'Please fill in all required account mappings.'));
        return;
      }
    }

    try {
      setSavingMapping(true);
      await api.put('/api/accounting/mapping', mappingForm);
      toast.success(t('settings.accounting.mappingSaved', 'Chart of Accounts mapping saved successfully!'));
      await fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err) || 'Failed to save account mapping.');
    } finally {
      setSavingMapping(false);
    }
  };

  // Retry shift sync
  const handleRetrySync = async (shiftId: string) => {
    try {
      setRetryingShiftId(shiftId);
      await api.post(`/api/accounting/sync/${shiftId}`);
      toast.success(t('settings.accounting.syncRetrySuccess', 'Shift synced successfully!'));
      await fetchData();
    } catch (err) {
      toast.error(extractErrorMessage(err) || 'Shift sync retry failed.');
    } finally {
      setRetryingShiftId(null);
    }
  };

  const handleRefreshLogs = async () => {
    try {
      setRefreshingLogs(true);
      const res = await api.get<SyncLog[]>('/api/accounting/logs');
      setLogs(res.data || []);
      toast.success(t('common.refreshed', 'Logs refreshed'));
    } catch {
      toast.error('Failed to refresh sync logs');
    } finally {
      setRefreshingLogs(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-4 border-mintcom-green/20 border-t-mintcom-green rounded-full animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
          {t('common.loading', 'Loading accounting settings...')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 sm:space-y-8 font-sans">
      {/* 1. Provider Connection Card */}
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shadow-sm shrink-0">
              <BookOpen size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('settings.accounting.title', 'Accounting & VAT Integration')}
                </h3>
                {status?.isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
                    <CheckCircle2 size={13} />
                    {status.provider === 'XERO' ? 'Xero' : 'QuickBooks Online'} Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300">
                    <XCircle size={13} />
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {t(
                  'settings.accounting.subtitle',
                  isUS
                    ? 'Automatically sync daily aggregated Z-Reports into Xero or QuickBooks with single-rate sales tax and rounding drift protection on shift close.'
                    : 'Automatically sync daily aggregated Z-Reports into Xero or QuickBooks with multi-tax UK VAT split and rounding drift protection on shift close.',
                )}
              </p>
            </div>
          </div>

          {status?.isConnected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 rounded-xl transition-all self-start sm:self-center"
            >
              {disconnecting ? (
                <div className="w-4 h-4 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
              ) : (
                <Unplug size={16} />
              )}
              <span>{t('settings.accounting.disconnect', 'Disconnect')}</span>
            </button>
          )}
        </div>

        {/* Connection Details or Connect Buttons */}
        <div className="mt-6">
          {status?.isConnected ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Organization / Tenant</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <Building2 size={16} className="text-gray-400" />
                  {status.tenantName || status.tenantId || 'Primary Organization'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Automatic Sync</p>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400 mt-1 flex items-center gap-1.5">
                  <ShieldCheck size={16} />
                  Active on register/shift close
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Synced</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1 flex items-center gap-1.5">
                  <Clock size={16} className="text-gray-400" />
                  {status.lastSyncAt ? new Date(status.lastSyncAt).toLocaleString() : 'No syncs yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Connect your accounting platform using OAuth 2.0 to begin automatic double-entry Z-report syncs upon cashier shift close.
              </p>
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleConnect('XERO')}
                  disabled={connectingProvider !== null}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#13B5EA] text-white font-bold text-sm hover:bg-[#0fa4d4] transition-all shadow-sm disabled:opacity-50"
                >
                  {connectingProvider === 'XERO' ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white text-[#13B5EA] flex items-center justify-center font-black text-xs">
                      X
                    </div>
                  )}
                  <span>Connect to Xero</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleConnect('QUICKBOOKS')}
                  disabled={connectingProvider !== null}
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#2CA01C] text-white font-bold text-sm hover:bg-[#258d18] transition-all shadow-sm disabled:opacity-50"
                >
                  {connectingProvider === 'QUICKBOOKS' ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white text-[#2CA01C] flex items-center justify-center font-black text-xs">
                      QB
                    </div>
                  )}
                  <span>Connect to QuickBooks Online</span>
                </button>
              </div>

              {/* OAuth Redirect URI Helper Card */}
              <div className="mt-4 p-4 rounded-xl bg-blue-50/60 dark:bg-blue-900/10 border border-blue-200/70 dark:border-blue-800/40 text-xs text-blue-950 dark:text-blue-200 space-y-2.5">
                <div className="flex items-center justify-between font-semibold">
                  <span className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-bold">
                    <Info size={15} className="text-[#13B5EA] shrink-0" />
                    Xero & QuickBooks OAuth Redirect URI
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                    Exact Match Required
                  </span>
                </div>
                <p className="text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
                  In your <a href="https://developer.xero.com/app/manage" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-[#13B5EA]">Xero Developer Portal</a> under <strong>Configuration &gt; Redirect URIs</strong>, register this exact URL verbatim (no trailing slash or query params):
                </p>
                <div className="flex items-center gap-2 bg-white dark:bg-black/30 border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2 font-mono text-[11px] select-all break-all shadow-inner">
                  <span className="flex-1 text-gray-800 dark:text-gray-200 select-all">{getAccountingRedirectUri()}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getAccountingRedirectUri());
                      toast.success(t('common.copied', 'Copied redirect URI to clipboard!'));
                    }}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors text-gray-600 dark:text-gray-300 shrink-0 flex items-center gap-1"
                    title="Copy Redirect URI"
                  >
                    <Copy size={13} />
                    <span className="font-sans text-[11px] font-medium">Copy</span>
                  </button>
                </div>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80">
                  ⚠️ Note: Xero requires <code className="bg-blue-100 dark:bg-blue-950/80 px-1 py-0.5 rounded font-mono">http://localhost</code> for local development (IP addresses like <code className="bg-blue-100 dark:bg-blue-950/80 px-1 py-0.5 rounded font-mono">127.0.0.1</code> are disallowed) and <code className="bg-blue-100 dark:bg-blue-950/80 px-1 py-0.5 rounded font-mono">https://</code> in production.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2. Chart of Accounts Mapping Card */}
      {status?.isConnected && (
        <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-start gap-4 pb-6 border-b border-gray-100 dark:border-white/5">
            <div className="w-12 h-12 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shadow-sm shrink-0">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Chart of Accounts Mapping
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                Select which General Ledger accounts in {status.provider === 'XERO' ? 'Xero' : 'QuickBooks Online'} map to each Mintcom POS tender, revenue, and tax liability bucket.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveMapping} className="mt-6 space-y-8">
            {/* Section A: Clearing Accounts (Tenders) */}
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>Tenders & Clearing Accounts (Debits)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Cash Clearing Account <span className="text-red-500">*</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.cashClearingAccountId}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, cashClearingAccountId: code }))}
                    placeholder="e.g. 100 - Till Cash Clearing"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Net cash collected in cash drawers (before variance adjustments)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Card Clearing Account <span className="text-red-500">*</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.cardClearingAccountId}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, cardClearingAccountId: code }))}
                    placeholder="e.g. 101 - Card Payments Clearing"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Card tenders cleared into bank feed (Zettle, Dojo, Stripe)</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Delivery Aggregators Clearing (Optional)
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.deliveryClearingAccountId || ''}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, deliveryClearingAccountId: code }))}
                    placeholder="e.g. 102 - Delivery Clearing (Deliveroo/UberEats)"
                  />
                  <p className="text-xs text-gray-400 mt-1">Net sales from online delivery aggregators</p>
                </div>
              </div>
            </div>

            {/* Section B: Sales Revenue Accounts */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>
                  {isUS
                    ? 'Sales Revenue Buckets (Credits - Net of Sales Tax)'
                    : 'Sales Revenue Buckets (Credits - Net of VAT)'}
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {isUS ? 'Taxable Sales Account' : 'Standard Rate (20% VAT) Sales'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.salesStandardVatAccountId}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, salesStandardVatAccountId: code }))}
                    placeholder={isUS ? 'e.g. 200 - Taxable Sales' : 'e.g. 200 - Sales Standard 20%'}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {isUS
                      ? 'General taxable menu sales subject to state/local sales tax'
                      : 'Dine-in hot meals, hot drinks, soft drinks'}
                  </p>
                </div>

                {!isUS && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Reduced Rate (5% VAT) Sales (Optional)
                    </label>
                    <AccountSelect
                      accounts={accounts}
                      value={mappingForm.salesReducedVatAccountId || ''}
                      onChange={(code) => setMappingForm((prev) => ({ ...prev, salesReducedVatAccountId: code }))}
                      placeholder="e.g. 201 - Sales Reduced 5%"
                    />
                    <p className="text-xs text-gray-400 mt-1">Special hospitality reduced rates</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {isUS ? 'Exempt / Non-Taxable Sales Account' : 'Zero Rate (0% VAT) Sales'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.salesZeroVatAccountId}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, salesZeroVatAccountId: code }))}
                    placeholder={isUS ? 'e.g. 202 - Non-Taxable Sales' : 'e.g. 202 - Sales Zero 0%'}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {isUS
                      ? 'Non-taxable groceries, gift cards, or exempt items'
                      : 'Cold takeaway food, bakery, groceries'}
                  </p>
                </div>

                {!isUS && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Exempt Sales (Optional)
                    </label>
                    <AccountSelect
                      accounts={accounts}
                      value={mappingForm.salesExemptAccountId || ''}
                      onChange={(code) => setMappingForm((prev) => ({ ...prev, salesExemptAccountId: code }))}
                      placeholder="e.g. 203 - Sales Exempt"
                    />
                    <p className="text-xs text-gray-400 mt-1">VAT exempt sales and vouchers</p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {isUS ? 'Service Charge Revenue (Optional)' : 'Mandatory Service Charge Revenue (Optional)'}
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.serviceChargeAccountId || ''}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, serviceChargeAccountId: code }))}
                    placeholder="e.g. 204 - Service Charge Revenue"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {isUS
                      ? 'Service charges and gratuities revenue'
                      : 'Mandatory service charge (subject to 20% standard VAT)'}
                  </p>
                </div>
              </div>
            </div>

            {/* Section C: Tax Liability & Variances */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span>Tax Liability, Variances & Guard Accounts</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {isUS ? 'Sales Tax Payable Account' : 'Output VAT Liability Account'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.vatLiabilityAccountId}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, vatLiabilityAccountId: code }))}
                    placeholder={isUS ? 'e.g. 820 - Sales Tax Payable' : 'e.g. 820 - Output VAT Liability (HMRC)'}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {isUS
                      ? 'Current liability account for state and local sales tax remittance'
                      : 'Current liability account for HMRC quarterly VAT return'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Rounding Drift Guard Adjustment Account <span className="text-red-500">*</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.roundingAdjustmentAccountId}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, roundingAdjustmentAccountId: code }))}
                    placeholder="e.g. 495 - Rounding Adjustment Variance"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Absorbs penny rounding drift (≤ £0.02) to guarantee balanced journals</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Cash Drawer Shortage Expense Account <span className="text-red-500">*</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.cashVarianceExpenseAccountId}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, cashVarianceExpenseAccountId: code }))}
                    placeholder="e.g. 490 - Cash Shortage Expense"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Expense account debited when register counted cash is short</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Cash Drawer Overage Income Account <span className="text-red-500">*</span>
                  </label>
                  <AccountSelect
                    accounts={accounts}
                    value={mappingForm.cashVarianceIncomeAccountId}
                    onChange={(code) => setMappingForm((prev) => ({ ...prev, cashVarianceIncomeAccountId: code }))}
                    placeholder="e.g. 491 - Cash Overage Income"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Income account credited when register counted cash is over</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={savingMapping}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-mintcom-green text-black font-bold text-sm hover:bg-[#5fa888] transition-all shadow-sm disabled:opacity-50"
              >
                {savingMapping ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                <span>Save Account Mapping</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Z-Report Sync Logs Table */}
      <div className="bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-white/[0.03] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-mintcom-green/10 flex items-center justify-center text-mintcom-green shadow-sm shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Recent Z-Report Shift Sync Logs
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                History of double-entry journals posted automatically on shift close or manually retried.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefreshLogs}
            disabled={refreshingLogs}
            className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all self-end sm:self-center"
            title="Refresh logs"
          >
            <RotateCw size={18} className={refreshingLogs ? 'animate-spin text-mintcom-green' : ''} />
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 mb-3">
                <Calendar size={22} />
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                No shift journals synced yet
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Once a register shift is closed, daily double-entry Z-reports will appear here automatically.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="pb-3 pr-4">Shift Time</th>
                  <th className="pb-3 px-4">Cashier</th>
                  <th className="pb-3 px-4">Debits / Credits</th>
                  <th className="pb-3 px-4">Drift</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4">Reference</th>
                  <th className="pb-3 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="py-4 pr-4 text-gray-900 dark:text-white whitespace-nowrap">
                      {new Date(log.shift.startTime).toLocaleDateString()}{' '}
                      <span className="text-xs text-gray-400">
                        {new Date(log.shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-700 dark:text-gray-300">
                      {log.shift.employeeName}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="text-gray-900 dark:text-white font-semibold">
                        £{Number(log.debitTotal).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {Number(log.roundingDrift) === 0 ? '£0.00' : `£${Number(log.roundingDrift).toFixed(2)}`}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {log.status === 'SYNCED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300">
                          <CheckCircle2 size={13} />
                          Synced
                        </span>
                      )}
                      {log.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          <Clock size={13} />
                          Pending
                        </span>
                      )}
                      {log.status === 'FAILED' && (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300"
                          title={log.errorMessage || 'Sync failed'}
                        >
                          <AlertTriangle size={13} />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {log.externalUrl ? (
                        <a
                          href={log.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-mintcom-green hover:underline text-xs font-semibold"
                        >
                          <span>{log.externalReferenceId || 'View Journal'}</span>
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">{log.externalReferenceId || '—'}</span>
                      )}
                    </td>
                    <td className="py-4 pl-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleRetrySync(log.shiftId)}
                        disabled={retryingShiftId === log.shiftId}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg transition-all disabled:opacity-50"
                      >
                        {retryingShiftId === log.shiftId ? (
                          <div className="w-3 h-3 border-2 border-gray-400 border-t-gray-700 rounded-full animate-spin" />
                        ) : (
                          <RotateCw size={12} />
                        )}
                        <span>Retry</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

interface AccountSelectProps {
  accounts: AccountInfo[];
  value: string;
  onChange: (code: string) => void;
  placeholder?: string;
  required?: boolean;
}

const AccountSelect: React.FC<AccountSelectProps> = ({
  accounts,
  value,
  onChange,
  placeholder,
  required = false,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={required}
      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#16181A] text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-mintcom-green/50 focus:border-mintcom-green transition-all"
    >
      <option value="">{placeholder || 'Select Account...'}</option>
      {accounts.map((acc) => (
        <option key={acc.code} value={acc.code} disabled={acc.status === 'ARCHIVED'}>
          {acc.code} - {acc.name} ({acc.type}){acc.status === 'ARCHIVED' ? ' [ARCHIVED]' : ''}
        </option>
      ))}
      {value && !accounts.some((a) => a.code === value) && (
        <option value={value}>
          {value} (Custom Account Code)
        </option>
      )}
    </select>
  );
};

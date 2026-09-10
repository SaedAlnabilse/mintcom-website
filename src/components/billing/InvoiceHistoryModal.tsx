import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Eye, FileText, Printer, Table, X } from 'lucide-react';

import api from '../../config/api';
import { Pagination } from '../ui';
import {
  SubscriptionInvoiceModal,
  downloadHtmlDocument,
  printHtmlDocument,
  type SubscriptionInvoiceData,
} from './SubscriptionInvoice';

const PAGE_SIZE = 10;

interface InvoiceListResponse {
  invoices: SubscriptionInvoiceData[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const money = (value: number, currency: string) =>
  `${Number(value || 0).toFixed(2)} ${currency}`;

const formatDate = (value: string | Date | null | undefined, locale: string) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const csvEscape = (value: unknown) => {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/**
 * A statement of account: every issued invoice as one row.
 *
 * Printing the history prints this table, not each document — an owner filing
 * or reconciling wants the list, and the individual documents stay available
 * one click away.
 */
const buildHistoryHtml = (
  invoices: SubscriptionInvoiceData[],
  locationName: string,
  currency: string,
) => {
  const total = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const rows = invoices
    .map((invoice) => `
      <tr>
        <td class="mono">${escapeHtml(invoice.number || '—')}</td>
        <td>${escapeHtml(formatDate(invoice.issueDate, 'en-US'))}</td>
        <td>${escapeHtml(invoice.snapshot?.billTo?.name || '—')}</td>
        <td>${escapeHtml(
          invoice.periodStart && invoice.periodEnd
            ? `${formatDate(invoice.periodStart, 'en-US')} – ${formatDate(invoice.periodEnd, 'en-US')}`
            : '—',
        )}</td>
        <td>${escapeHtml(invoice.status)}</td>
        <td class="right">${escapeHtml(money(invoice.total, invoice.currency))}</td>
      </tr>`)
    .join('');

  return `
    <div class="statement">
      <div class="statement-head">
        <div>
          <div class="brand">Mintcom</div>
        </div>
        <div class="right">
          <div class="title">INVOICE HISTORY</div>
          <div class="sub">${escapeHtml(locationName)}</div>
          <div class="sub">Generated ${escapeHtml(formatDate(new Date(), 'en-US'))}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Invoice</th><th>Date</th><th>Location</th>
            <th>Period</th><th>Status</th><th class="right">Amount</th>
          </tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="6">No invoices issued yet.</td></tr>'}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">Total (${escapeHtml(String(invoices.length))} invoice${invoices.length === 1 ? '' : 's'})</td>
            <td class="right">${escapeHtml(money(total, currency))}</td>
          </tr>
        </tfoot>
      </table>
      <p class="foot">Mintcom POS · support@mintcompos.com</p>
    </div>
    <style>
      .statement{max-width:840px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:32px 36px;color:#111827;font-family:'Inter',sans-serif}
      .statement-head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #e5e7eb;padding-bottom:20px;margin-bottom:24px}
      .brand{font-size:22px;font-weight:800;color:#111827;letter-spacing:-.5px}
      .title{font-size:16px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#111827}
      .sub{font-size:11px;font-weight:500;color:#6b7280;margin-top:2px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:24px}
      th{background:#f9fafb;text-transform:uppercase;font-size:10px;letter-spacing:.06em;color:#6b7280;padding:10px 12px;border-bottom:1px solid #e5e7eb;border-top:1px solid #e5e7eb;text-align:left}
      td{padding:12px;border-bottom:1px solid #f3f4f6;color:#374151}
      tfoot td{font-weight:700;color:#111827;border-top:1.5px solid #111827;border-bottom:none;padding-top:12px}
      .right{text-align:right}
      .mono{font-variant-numeric:tabular-nums;font-weight:600;color:#111827}
      .foot{text-align:center;font-size:10px;color:#9ca3af;padding-top:16px;border-top:1px solid #e5e7eb;margin:0}
      @media print{.statement{border:none;padding:0}}
    </style>`;
};

const buildHistoryCsv = (invoices: SubscriptionInvoiceData[]) => {
  const header = [
    'Invoice number', 'Issue date', 'Location', 'Period start', 'Period end',
    'Status', 'Currency', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment reference',
  ];
  const rows = invoices.map((invoice) => [
    invoice.number,
    formatDate(invoice.issueDate, 'en-US'),
    invoice.snapshot?.billTo?.name || '',
    formatDate(invoice.periodStart, 'en-US'),
    formatDate(invoice.periodEnd, 'en-US'),
    invoice.status,
    invoice.currency,
    Number(invoice.subtotal || 0).toFixed(2),
    Number(invoice.discount || 0).toFixed(2),
    Number(invoice.taxAmount || 0).toFixed(2),
    Number(invoice.total || 0).toFixed(2),
    invoice.paymentRef || '',
  ]);
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
};

export interface InvoiceHistoryModalProps {
  /** Location the history is scoped to. Null closes the modal. */
  establishment: { id: string; name: string } | null;
  /**
   * Document to show when the location has never been charged, so the owner
   * still sees what they are paying for. Rendered with no invoice number.
   */
  fallbackSummary?: SubscriptionInvoiceData | null;
  onClose: () => void;
}

/** Invoice history for one location, with per-document and whole-list export. */
export function InvoiceHistoryModal({ establishment, fallbackSummary, onClose }: InvoiceHistoryModalProps) {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<SubscriptionInvoiceData[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  /** Bumped to re-run the fetch effect when the user retries the same page. */
  const [reloadToken, setReloadToken] = useState(0);
  const [openInvoice, setOpenInvoice] = useState<SubscriptionInvoiceData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const locale = t('common.language') === 'Arabic' ? 'ar-SA' : 'en-US';
  const establishmentId = establishment?.id ?? null;

  useEffect(() => {
    if (!establishmentId) return;
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setLoadError(false);
      try {
        const response = await api.get<InvoiceListResponse>('/api/accounts/invoices', {
          params: { establishmentId, page, limit: PAGE_SIZE },
        });
        if (cancelled) return;
        setInvoices(response.data.invoices || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
        setTotal(response.data.pagination?.total || 0);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load invoices:', error);
        setLoadError(true);
        setInvoices([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [establishmentId, page, reloadToken]);

  // A new location resets to the first page rather than a page that may not exist.
  useEffect(() => {
    setPage(1);
  }, [establishmentId]);

  const currency = invoices[0]?.currency || fallbackSummary?.currency || 'USD';

  /**
   * Exporting the history exports all of it, not just the page on screen, so
   * the file matches what the owner asked for.
   */
  const fetchAllInvoices = useCallback(async (): Promise<SubscriptionInvoiceData[]> => {
    if (!establishmentId) return [];
    if (total <= invoices.length) return invoices;
    const all: SubscriptionInvoiceData[] = [];
    for (let fetchPage = 1; fetchPage <= 50; fetchPage++) {
      const response = await api.get<InvoiceListResponse>('/api/accounts/invoices', {
        params: { establishmentId, page: fetchPage, limit: 100 },
      });
      const batch = response.data.invoices || [];
      all.push(...batch);
      const totalCount = response.data.total || 0;
      if (batch.length === 0 || batch.length < 100) break;
      if (totalCount && all.length >= totalCount) break;
    }
    return all;
  }, [establishmentId, invoices, total]);

  const withExport = useCallback(
    async (run: (rows: SubscriptionInvoiceData[]) => void) => {
      setIsExporting(true);
      try {
        run(await fetchAllInvoices());
      } catch (error) {
        console.error('Invoice history export failed:', error);
        toast.error(
          t('owner.billing.invoice.exportFailed', {
            defaultValue: 'Could not export the invoice history. Please try again.',
          }),
        );
      } finally {
        setIsExporting(false);
      }
    },
    [fetchAllInvoices, t],
  );

  const handlePrintHistory = useCallback(() => {
    void withExport((rows) => {
      const opened = printHtmlDocument(
        buildHistoryHtml(rows, establishment?.name || '', currency),
        `Invoice history — ${establishment?.name || ''}`,
      );
      if (!opened) {
        toast.error(
          t('owner.billing.invoice.popupBlocked', {
            defaultValue: 'Allow pop-ups for this site to print.',
          }),
        );
      }
    });
  }, [currency, establishment, t, withExport]);

  const handleDownloadHistory = useCallback(() => {
    void withExport((rows) => {
      downloadHtmlDocument(
        buildHistoryHtml(rows, establishment?.name || '', currency),
        `Invoice history — ${establishment?.name || ''}`,
        `Mintcom-Invoice-History-${(establishment?.name || 'location').replace(/[^a-zA-Z0-9]+/g, '-')}.html`,
      );
    });
  }, [currency, establishment, withExport]);

  const handleDownloadCsv = useCallback(() => {
    void withExport((rows) => {
      const blob = new Blob([buildHistoryCsv(rows)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Mintcom-Invoice-History-${(establishment?.name || 'location').replace(/[^a-zA-Z0-9]+/g, '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }, [establishment, withExport]);

  const summaryTotal = useMemo(
    () => invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0),
    [invoices],
  );

  if (typeof document === 'undefined') return null;

  const hasInvoices = invoices.length > 0;

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {establishment && !openInvoice && (
            <div
              dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}
              className="fixed inset-0 z-[9998] popup-surface flex items-end justify-center p-0 sm:items-center sm:p-4 font-sans"
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm"
                onClick={onClose}
              />

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 24 }}
                className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1E293B] sm:rounded-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4 dark:border-white/5">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-bold text-gray-900 dark:text-white">
                      {t('owner.billing.invoice.historyTitle', { defaultValue: 'Invoice History' })}
                    </h3>
                    <p className="truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                      {establishment.name}
                      {total > 0 ? ` · ${total}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadCsv}
                      disabled={!hasInvoices || isExporting}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <Table size={15} />
                      <span className="hidden sm:inline">
                        {t('owner.billing.invoice.exportCsv', { defaultValue: 'CSV' })}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadHistory}
                      disabled={!hasInvoices || isExporting}
                      className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                    >
                      <Download size={15} />
                      <span className="hidden sm:inline">
                        {t('owner.billing.invoice.downloadHistory', { defaultValue: 'Download All' })}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintHistory}
                      disabled={!hasInvoices || isExporting}
                      className="flex items-center gap-2 rounded-xl border border-mintcom-green/20 bg-mintcom-green/10 px-3 py-2 text-xs font-bold text-mintcom-green transition hover:bg-mintcom-green/20 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Printer size={15} />
                      <span className="hidden sm:inline">
                        {t('owner.billing.invoice.printHistory', { defaultValue: 'Print History' })}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label={t('common.close', { defaultValue: 'Close' })}
                      className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm active:scale-90"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5">
                  {isLoading ? (
                    <div className="space-y-2">
                      {[0, 1, 2].map((row) => (
                        <div key={row} className="h-14 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                      ))}
                    </div>
                  ) : loadError ? (
                    <div className="py-12 text-center">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {t('owner.billing.invoice.loadFailed', { defaultValue: 'Could not load invoices' })}
                      </p>
                      <button
                        type="button"
                        onClick={() => setReloadToken((token) => token + 1)}
                        className="mt-3 rounded-xl bg-mintcom-green/10 px-4 py-2 text-xs font-bold text-mintcom-green"
                      >
                        {t('common.retry', { defaultValue: 'Retry' })}
                      </button>
                    </div>
                  ) : !hasInvoices ? (
                    <div className="py-12 text-center">
                      <FileText size={32} className="mx-auto text-gray-300 dark:text-white/20" />
                      <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">
                        {t('owner.billing.invoice.emptyTitle', { defaultValue: 'No Invoices Yet' })}
                      </p>
                      <p className="mx-auto mt-1 max-w-md text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t('owner.billing.invoice.emptyBody', {
                          defaultValue:
                            'A numbered invoice is issued automatically the first time a payment for this location settles.',
                        })}
                      </p>
                      {fallbackSummary && (
                        <button
                          type="button"
                          onClick={() => setOpenInvoice(fallbackSummary)}
                          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                        >
                          <Eye size={14} />
                          {t('owner.billing.invoice.viewSummary', { defaultValue: 'View Subscription Summary' })}
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] text-left">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                              {[
                                t('owner.billing.invoice.colNumber', { defaultValue: 'Invoice' }),
                                t('owner.billing.invoice.colDate', { defaultValue: 'Date' }),
                                t('owner.billing.invoice.colPeriod', { defaultValue: 'Period' }),
                                t('owner.billing.invoice.colStatus', { defaultValue: 'Status' }),
                                t('owner.billing.invoice.colAmount', { defaultValue: 'Amount' }),
                                '',
                              ].map((header, index) => (
                                <th
                                  key={`${header}-${index}`}
                                  className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 ${
                                    index === 4 ? 'text-right' : ''
                                  }`}
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map((invoice) => (
                              <tr
                                key={invoice.id}
                                className="border-b border-gray-50 transition hover:bg-gray-50 dark:border-white/5 dark:hover:bg-white/5"
                              >
                                <td className="px-3 py-3 text-xs font-bold tabular-nums text-gray-900 dark:text-white">
                                  {invoice.number}
                                </td>
                                <td className="px-3 py-3 text-xs font-medium text-gray-600 dark:text-gray-300">
                                  {formatDate(invoice.issueDate, locale)}
                                </td>
                                <td className="px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {invoice.periodStart && invoice.periodEnd
                                    ? `${formatDate(invoice.periodStart, locale)} – ${formatDate(invoice.periodEnd, locale)}`
                                    : '—'}
                                </td>
                                <td className="px-3 py-3">
                                  <span className="rounded-lg bg-mintcom-green/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-mintcom-green">
                                    {invoice.status}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-right text-xs font-bold tabular-nums text-gray-900 dark:text-white">
                                  {money(invoice.total, invoice.currency)}
                                </td>
                                <td className="px-3 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => setOpenInvoice(invoice)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] font-bold text-gray-600 transition hover:bg-white dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10"
                                  >
                                    <Eye size={13} />
                                    {t('owner.billing.invoice.view', { defaultValue: 'View' })}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          {t('owner.billing.invoice.pageTotal', {
                            defaultValue: 'This page: {{amount}}',
                            amount: money(summaryTotal, currency),
                          })}
                        </p>
                        {totalPages > 1 && (
                          <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onPageChange={setPage}
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
      )}

      <SubscriptionInvoiceModal
        data={openInvoice}
        onClose={() => setOpenInvoice(null)}
        leadingAction={(
          <button
            type="button"
            onClick={() => setOpenInvoice(null)}
            aria-label={t('common.back', { defaultValue: 'Back' })}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
        )}
      />
    </>
  );
}

export default InvoiceHistoryModal;

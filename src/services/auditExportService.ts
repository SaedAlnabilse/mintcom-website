import api from '../config/api';

/**
 * Declare to the audit trail that a report left the browser.
 *
 * The dashboard builds CSV/XLSX/PDF files client-side from data it has already
 * fetched, so the server sees the page reads but never the export itself
 * (ACTIVITY_LOG_OMNICHANNEL_PLAN.md §2.6). Without this, someone exporting the
 * full customer list leaves no trace.
 *
 * Fire-and-forget: an export the user asked for must not fail because the audit
 * trail was unreachable. It is self-reported and therefore best-effort by
 * nature — the planned high-volume-read rule on the list endpoints is what
 * catches a client that stays deliberately silent.
 */
export async function recordDataExport(params: {
  reportType: string;
  format: 'csv' | 'xlsx' | 'pdf' | 'json' | 'print';
  rowCount: number;
  establishmentId?: string;
  filters?: Record<string, unknown>;
  includesPii?: boolean;
}): Promise<void> {
  try {
    await api.post('/api/audit-events/data-export', params);
  } catch (error) {
    console.warn('[Audit] Failed to record data export', error);
  }
}

/**
 * Reports whose files carry customer-identifying columns.
 *
 * A list rather than column inference: reports gain columns far more often than
 * anyone revisits this, and over-declaring is the safe direction.
 */
const PII_REPORTS = ['customer', 'loyalty', 'employee', 'staff'];

export function exportIncludesPii(reportType: string): boolean {
  const normalized = reportType.toLowerCase();
  return PII_REPORTS.some(token => normalized.includes(token));
}

import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ModalHeader, ModalBody, ModalFooter, ModalCancelButton, ModalSubmitButton } from '../ui';
import { Download, Printer } from 'lucide-react';

/** Official Mintcom logo SVG vector */
const MintcomLogoSvg = ({ height = 28 }: { height?: number }) => (
  <svg
    viewBox="145 470 825 150"
    xmlns="http://www.w3.org/2000/svg"
    style={{ height, width: 'auto', display: 'block' }}
    aria-label="Mintcom"
  >
    <defs>
      <style>{`.m-logo-leaf{fill:#ace2bf}.m-logo-brand{fill:#7dc6a2}`}</style>
    </defs>
    <g>
      <g>
        <path className="m-logo-brand" d="m289.4,599.06v-80.38c0-2.26,1.83-4.09,4.09-4.09h16.55v11.75c7.19-8.89,15.88-13.34,26.04-13.34,11,0,18.94,4.45,23.82,13.34,7.41-8.89,15.98-13.34,25.72-13.34,12.91,0,21.38,4.87,25.4,14.61,1.48,3.17,2.22,9,2.22,17.47v53.99h-22.23v-48.27c0-8.68-.74-14.08-2.22-16.2-2.54-3.17-6.03-4.76-10.48-4.76-7.2,0-11.86,3.71-13.97,11.12-1.06,4.24-1.59,10.06-1.59,17.47v40.65h-22.55v-57.48c-.64-5.08-2.22-8.36-4.76-9.84-1.48-1.27-3.71-1.91-6.67-1.91-7.62,0-12.7,3.6-15.24,10.8-1.27,3.39-1.9,9.21-1.9,17.47v40.97h-22.23Z" />
        <path className="m-logo-brand" d="m460.7,599.06v-84.47h20.64v12.7c6.99-9.53,15.98-14.29,26.99-14.29s18.84,3.07,23.5,9.21c3.81,4.66,5.72,12.81,5.72,24.45v52.4h-22.23v-43.19c0-7.41-.11-11.64-.32-12.7-.85-5.08-2.75-8.78-5.72-11.12-2.12-1.48-4.76-2.22-7.94-2.22-8.47,0-13.97,3.92-16.51,11.75-1.27,3.39-1.9,9.85-1.9,19.37v38.11h-22.23Z" />
        <path className="m-logo-brand" d="m596.13,595.56c-5.71,2.33-11.65,3.51-17.79,3.51-8.25,0-14.18-2.44-17.79-7.32-1.47-2.11-2.54-4.96-3.17-8.57-.63-3.17-.84-8.47-.63-15.88v-36.84h-10.49v-17.79h10.49v-16.8h22.23v16.8h15.25v17.79h-15.25v41.92c.43,3.83,1.27,6.14,2.54,7,.84.84,2.11,1.27,3.81,1.27,2.13,0,5.09-.75,8.9-2.22l1.9,17.13Z" />
        <path className="m-logo-brand" d="m715.16,593.98c-14.4-7.62-21.59-20.96-21.59-40.01,0-7.83,1.8-15.13,5.4-21.91,3.81-6.77,9-11.96,15.56-15.56,6.56-3.6,14.08-5.4,22.55-5.4,12.7,0,23.13,4.08,31.28,12.23,8.15,8.15,12.23,18.58,12.23,31.28s-4.02,23.29-12.07,31.76c-8.26,8.47-18.74,12.7-31.44,12.7-8.05,0-15.35-1.69-21.91-5.08Zm37.79-21.28c3.17-4.87,4.76-10.8,4.76-17.78s-1.59-13.12-4.76-17.78c-3.81-5.29-9.11-7.94-15.88-7.94s-12.07,2.65-15.88,7.94c-3.18,4.66-4.76,10.59-4.76,17.78s1.59,12.92,4.76,17.78c3.81,5.51,9.1,8.26,15.88,8.26s12.07-2.75,15.88-8.26Z" />
        <path className="m-logo-brand" d="m790.11,599.06v-80.38c0-2.26,1.83-4.09,4.09-4.09h16.55v11.75c7.19-8.89,15.88-13.34,26.04-13.34,11,0,18.94,4.45,23.82,13.34,7.41-8.89,15.98-13.34,25.72-13.34,12.91,0,21.38,4.87,25.4,14.61,1.48,3.17,2.22,9,2.22,17.47v49.89c0,2.26-1.83,4.09-4.09,4.09h-18.14v-48.27c0-8.68-.74-14.08-2.22-16.2-2.54-3.17-6.03-4.76-10.48-4.76-7.2,0-11.86,3.71-13.97,11.12-1.06,4.24-1.59,10.06-1.59,17.47v40.65h-22.55v-57.48c-.64-5.08-2.22-8.36-4.76-9.84-1.48-1.27-3.71-1.91-6.67-1.91-7.62,0-12.7,3.6-15.24,10.8-1.27,3.39-1.9,9.21-1.9,17.47v40.97h-22.23Z" />
        <path className="m-logo-brand" d="m645.08,599.06c-7.19,0-13.39-1.2-18.58-3.6-5.2-2.4-9.54-5.59-13.04-9.59-3.5-4-6.12-8.52-7.87-13.56-1.75-5.04-2.62-10.27-2.62-15.66v-2.85c0-5.59.9-10.96,2.7-16.11,1.8-5.14,4.47-9.72,8.02-13.71,3.55-4,7.94-7.14,13.19-9.44,5.24-2.3,11.26-3.45,18.06-3.45,7.39,0,13.94,1.42,19.63,4.27,5.69,2.85,10.24,6.82,13.64,11.91,2.54,3.82,4.25,8.08,5.11,12.79.46,2.54-1.45,4.89-4.03,4.89h-15.56c-1.78,0-3.41-1.14-3.9-2.85-.72-2.56-2.04-4.78-3.95-6.66-2.6-2.55-6.25-3.82-10.94-3.82-4,0-7.32,1-9.97,3-2.65,2-4.62,4.77-5.92,8.32-1.3,3.55-1.95,7.67-1.95,12.36,0,4.4.6,8.37,1.8,11.91,1.2,3.55,3.12,6.3,5.77,8.24,2.65,1.95,6.12,2.92,10.42,2.92,3.2,0,5.92-.57,8.17-1.72,2.25-1.15,4.02-2.75,5.32-4.79.79-1.24,1.41-2.6,1.87-4.08.55-1.77,2.1-3.04,3.95-3.04h15.57c2.56,0,4.46,2.33,4.03,4.85-.82,4.82-2.55,9.17-5.19,13.06-3.5,5.15-8.14,9.17-13.94,12.06-5.8,2.9-12.39,4.34-19.78,4.34Z" />
        <g>
          <rect className="m-logo-brand" x="425.7" y="514.59" width="22.55" height="84.47" rx="4.09" ry="4.09" />
          <circle className="m-logo-brand" cx="436.97" cy="492.2" r="11.27" />
        </g>
        <g>
          <path className="m-logo-brand" d="m176.11,585.77c-2.5-3.57-5.59-9.19-7.14-13.98-4.86-15.03-6.2-38.89,16.52-56.94,9.64-7.66,21.63-12.18,33.8-14.2,16.83-2.8,34.34-.73,50.85-4.79-2.07,4.64-2.51,9.65-2.17,14.33.42,5.79,1.92,11.29,2.5,17.04,1.73,17.18-5.29,36.35-18.69,51.05-7.79,8.55-17.82,15.68-28.8,19.16-10.27,3.26-29.69,2.16-43.91-8.5" />
          <path className="m-logo-leaf" d="m222.69,542.5c-5.01,5.83-10.24,11.66-15.27,17.09-.59.63-.35,1.58.46,1.8,15.6,4.24,30.89-.15,38.96-4.96-12.03,9.36-29.19,12.47-42.79,7.89-.47-.16-1.03-.02-1.38.36-3.93,4.17-7.61,8-10.83,11.28-.59.6-.41,1.53.36,1.8,14.99,5.25,30.3,1.57,38.4-2.84-11.41,8.18-29.07,9.57-41.85,5.21-.46-.16-1-.02-1.36.33-2.21,2.2-4.01,3.96-5.28,5.17,0,0-6.32,6.24-10.23,11.62-.45.62-1.36.78-1.89.3-1.07-.95-2.07-1.96-2.99-3.03-.41-.48-.24-1.22.37-1.61,3.1-1.96,11.94-9.63,11.94-9.63,2.2-2.03,4.39-4.07,6.57-6.14.42-.4.5-.98.2-1.42-7.36-10.98-7.12-26.12.76-37.77-3.74,7.68-5.69,21.6,1.92,34.44.38.64,1.36.7,1.94.14,4.15-4.01,8.27-8.09,12.34-12.22.36-.36.44-.87.23-1.29-5.56-10.87-3.66-25.19,4.88-35.76-4.2,6.89-7.48,19.55-2.4,31.93.31.76,1.42.87,2.05.23,5.14-5.32,10.19-10.73,15.14-16.18.36-.39.41-.93.14-1.34-5.04-7.75-4.79-18.51.76-27-2.59,5.46-3.98,15.13.9,24.02.38.69,1.45.72,2.02.08,5.71-6.41,11.27-12.88,16.65-19.38-4.2,6.6-10.18,14.35-16.81,22.28-.57.68-.25,1.65.61,1.78,12.35,1.97,23.69-2.47,29.45-6.69-8.53,8.05-21.68,11.67-32.65,9.08-.47-.11-.98.05-1.31.42Z" />
        </g>
      </g>
      <path className="m-logo-brand" d="m945.31,507.42v13.41h-1.36v-10.71l-4.78,10.71h-.99l-4.78-10.67v10.67h-1.36v-13.41h1.44l5.19,11.62,5.19-11.62h1.46Zm-15.42-.17v1.13h-3.77v12.46h-1.36v-12.46h-3.79v-1.13h8.92Z" />
    </g>
  </svg>
);

/** One frozen line of the document. Values come from the server snapshot. */
export interface InvoiceLineItem {
  description: string;
  detail?: string;
  /** Rate the line was priced at, per unit. */
  unitPrice: number;
  /** Months covered: 1 for monthly, 12 for yearly. */
  quantity: number;
  amount: number;
}

/**
 * The document body as it was at issue time. The server never recomputes this,
 * so a plan rename or price change cannot rewrite a past invoice.
 */
export interface InvoiceSnapshot {
  seller: { name: string; address: string; email: string };
  billTo: {
    name: string;
    reference?: string | null;
    accountName?: string | null;
    accountEmail?: string | null;
  };
  billingCycle: 'monthly' | 'yearly';
  lineItems: InvoiceLineItem[];
  terms?: string;
  /** Reconstructed by the migration from a charge that predates this table. */
  backfilled?: boolean;
}

export interface SubscriptionInvoiceData {
  id?: string | null;
  /**
   * Server-issued document number, e.g. INV-2026-000123.
   *
   * `null` means nothing has been charged yet, so no invoice exists. The
   * document then renders as a subscription summary with no number — it must
   * not be filed as a tax document.
   */
  number: string | null;
  status: string;
  issueDate: string | Date;
  periodStart?: string | Date | null;
  periodEnd?: string | Date | null;
  currency: string;
  subtotal: number;
  discount: number;
  taxAmount?: number;
  total: number;
  cardBrand?: string | null;
  cardLast4?: string | null;
  /** Processor reference for the settled charge. */
  paymentRef?: string | null;
  snapshot: InvoiceSnapshot;
  /** ISTD / JoFotara identifiers, printed only once submission is live. */
  taxAuthorityUuid?: string | null;
  taxAuthorityQr?: string | null;
  /** True when the amounts are a forecast, not a charge that happened. */
  isEstimate?: boolean;
  nextBillDate?: string | null;
  establishmentId?: string | null;
  establishmentName?: string | null;
}

/** Amount ranges here are subscription prices, so plain 2-decimal money is enough. */
const money = (value: number, currency: string) =>
  `${Number(value || 0).toFixed(2)} ${currency}`;

const formatDate = (value: Date | string | null | undefined) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const INVOICE_DOM_ID = 'mintcom-subscription-invoice';

/** File-name-safe stem for downloads. */
const documentSlug = (data: SubscriptionInvoiceData) =>
  data.number ||
  `Summary-${(data.snapshot.billTo.name || 'Establishment').replace(/[^a-zA-Z0-9]+/g, '-')}`;

/**
 * An invoice states whether the money moved, not what the subscription state
 * is, so the stored status is translated into payment language here.
 */
const paymentStatusLabel = (data: SubscriptionInvoiceData) => {
  if (!data.number) return 'Not charged yet';
  switch ((data.status || '').toUpperCase()) {
    case 'PAID':
      return 'Paid';
    case 'VOID':
      return 'Void';
    case 'REFUNDED':
      return 'Refunded';
    case 'ISSUED':
      return 'Payment due';
    default:
      return 'Paid';
  }
};

const metaLabelStyle = {
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: '#6b7280',
  marginBottom: 6,
};

/** The printable document itself: formal, clean, paper-styled document. */
export function SubscriptionInvoiceDocument({ data }: { data: SubscriptionInvoiceData }) {
  const { snapshot } = data;
  const isIssued = Boolean(data.number);
  const nextBill = formatDate(data.nextBillDate);
  const periodStart = formatDate(data.periodStart);
  const periodEnd = formatDate(data.periodEnd);

  return (
    <div
      id={INVOICE_DOM_ID}
      style={{
        maxWidth: 720,
        margin: '0 auto',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        padding: '36px 40px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#111827',
        lineHeight: 1.5,
      }}
    >
      {/* Formal Header: Logo on left, Document Title & ID on right */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #e5e7eb',
          paddingBottom: 22,
          marginBottom: 24,
        }}
      >
        <div>
          <MintcomLogoSvg height={30} />
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase' as const,
              color: '#111827',
            }}
          >
            {isIssued ? 'Invoice' : 'Subscription Summary'}
          </div>
          {isIssued ? (
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginTop: 3 }}>
              #{data.number}
            </div>
          ) : (
            <div style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af', marginTop: 3 }}>
              Not a tax document
            </div>
          )}
        </div>
      </div>

      {/* Notice for unissued summary: simple, formal left-bordered note */}
      {!isIssued && (
        <div
          style={{
            background: '#f9fafb',
            borderLeft: '3px solid #9ca3af',
            borderRadius: 4,
            padding: '10px 14px',
            marginBottom: 24,
            fontSize: 11,
            color: '#4b5563',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: '#111827', fontWeight: 600 }}>
            No invoice has been issued for this location yet.
          </strong>{' '}
          This document summarizes the current subscription terms and expected charge. A numbered
          invoice is issued automatically the first time a payment settles.
        </div>
      )}

      {/* Metadata / Parties: 3 clean columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
          marginBottom: 28,
        }}
      >
        <div>
          <div style={metaLabelStyle}>From</div>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: '#111827' }}>{snapshot.seller.name}</div>
            {snapshot.seller.address ? <div>{snapshot.seller.address}</div> : null}
            <div>{snapshot.seller.email}</div>
          </div>
        </div>

        <div>
          <div style={metaLabelStyle}>Bill To</div>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, color: '#111827' }}>{snapshot.billTo.name}</div>
            {snapshot.billTo.reference ? <div>{snapshot.billTo.reference}</div> : null}
            {snapshot.billTo.accountEmail ? <div>{snapshot.billTo.accountEmail}</div> : null}
          </div>
        </div>

        <div>
          <div style={metaLabelStyle}>{isIssued ? 'Invoice Details' : 'Summary Details'}</div>
          <div style={{ fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
            <div>
              <span style={{ color: '#6b7280' }}>Date: </span>
              <span style={{ fontWeight: 500, color: '#111827' }}>{formatDate(data.issueDate)}</span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Billing cycle: </span>
              <span style={{ fontWeight: 500, color: '#111827', textTransform: 'capitalize' as const }}>
                {snapshot.billingCycle}
              </span>
            </div>
            <div>
              <span style={{ color: '#6b7280' }}>Currency: </span>
              <span style={{ fontWeight: 500, color: '#111827' }}>{data.currency}</span>
            </div>
            {periodStart && periodEnd ? (
              <div>
                <span style={{ color: '#6b7280' }}>Period: </span>
                <span style={{ fontWeight: 500, color: '#111827' }}>
                  {periodStart} – {periodEnd}
                </span>
              </div>
            ) : null}
            {!isIssued && nextBill ? (
              <div>
                <span style={{ color: '#6b7280' }}>Next charge: </span>
                <span style={{ fontWeight: 500, color: '#111827' }}>{nextBill}</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Formal Line Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' as const, marginBottom: 24, fontSize: 12 }}>
        <thead>
          <tr style={{ borderTop: '1px solid #e5e7eb', borderBottom: '1.5px solid #e5e7eb', background: '#f9fafb' }}>
            <th
              style={{
                padding: '10px 12px',
                textAlign: 'left' as const,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                color: '#6b7280',
              }}
            >
              Description
            </th>
            <th
              style={{
                padding: '10px 12px',
                textAlign: 'center' as const,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                color: '#6b7280',
              }}
            >
              Duration
            </th>
            <th
              style={{
                padding: '10px 12px',
                textAlign: 'right' as const,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                color: '#6b7280',
              }}
            >
              Rate
            </th>
            <th
              style={{
                padding: '10px 12px',
                textAlign: 'right' as const,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.06em',
                color: '#6b7280',
              }}
            >
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {snapshot.lineItems.map((line, index) => (
            <tr key={`${line.description}-${index}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '12px', color: '#111827', fontWeight: 600 }}>
                {line.description}
                {line.detail ? (
                  <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 400, marginTop: 2 }}>
                    {line.detail}
                  </div>
                ) : null}
              </td>
              <td style={{ padding: '12px', color: '#374151', textAlign: 'center' as const, whiteSpace: 'nowrap' as const }}>
                {line.quantity === 1 ? '1 month' : `${line.quantity} months`}
              </td>
              <td
                style={{
                  padding: '12px',
                  color: '#374151',
                  textAlign: 'right' as const,
                  whiteSpace: 'nowrap' as const,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {money(line.unitPrice, data.currency)}
                {line.quantity > 1 ? ' /mo' : ''}
              </td>
              <td
                style={{
                  padding: '12px',
                  color: '#111827',
                  fontWeight: 600,
                  textAlign: 'right' as const,
                  whiteSpace: 'nowrap' as const,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {money(line.amount, data.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 28 }}>
        <div style={{ width: 250 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '4px 0',
              fontSize: 12,
              color: '#4b5563',
            }}
          >
            <span>Subtotal</span>
            <span style={{ fontWeight: 500, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
              {money(data.subtotal, data.currency)}
            </span>
          </div>
          {data.discount > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                fontSize: 12,
                color: '#4b5563',
              }}
            >
              <span>Yearly discount</span>
              <span style={{ fontWeight: 500, color: '#059669', fontVariantNumeric: 'tabular-nums' }}>
                −{money(data.discount, data.currency)}
              </span>
            </div>
          )}
          {(data.taxAmount || 0) > 0 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '4px 0',
                fontSize: 12,
                color: '#4b5563',
              }}
            >
              <span>Tax</span>
              <span style={{ fontWeight: 500, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>
                {money(data.taxAmount || 0, data.currency)}
              </span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1.5px solid #111827',
              marginTop: 6,
              paddingTop: 8,
              fontSize: 14,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            <span>Total</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{money(data.total, data.currency)}</span>
          </div>
        </div>
      </div>

      {/* Formal Payment Method & Status Block */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
          padding: '12px 16px',
          background: '#f9fafb',
          border: '1px solid #f3f4f6',
          borderRadius: 6,
          marginBottom: 20,
          fontSize: 11,
        }}
      >
        <div>
          <div style={metaLabelStyle}>Payment Method</div>
          <div style={{ color: '#374151' }}>
            {data.cardLast4 ? (
              <span>
                <strong style={{ fontWeight: 600, color: '#111827' }}>{data.cardBrand || 'Card'}</strong> ending in •••• {data.cardLast4}
              </span>
            ) : (
              <span style={{ color: '#6b7280' }}>No card on file</span>
            )}
          </div>
        </div>
        <div>
          <div style={metaLabelStyle}>Payment Status</div>
          <div style={{ color: '#374151' }}>
            <strong style={{ fontWeight: 600, color: '#111827' }}>{paymentStatusLabel(data)}</strong>
            <span style={{ color: '#6b7280' }}>
              {' '}· {snapshot.billingCycle === 'yearly' ? 'Billed yearly' : 'Billed monthly'}
            </span>
          </div>
        </div>
      </div>

      {/* Tax Authority (if present) */}
      {(data.taxAuthorityUuid || data.taxAuthorityQr) && (
        <div style={{ marginBottom: 16 }}>
          <div style={metaLabelStyle}>Tax Authority</div>
          <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6, wordBreak: 'break-all' as const }}>
            {data.taxAuthorityUuid ? <div>UUID: {data.taxAuthorityUuid}</div> : null}
            {data.taxAuthorityQr || null}
          </div>
        </div>
      )}

      {/* Terms & Notes */}
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14, marginTop: 14, fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          {snapshot.terms ||
            'Charged automatically to the payment method on file at the start of each billing period. Questions about this document: support@mintcompos.com'}
          {snapshot.backfilled ? ' Reconstructed from the payment ledger.' : ''}
        </p>
      </div>

      {/* Formal Footer */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          paddingTop: 14,
          marginTop: 18,
          textAlign: 'center' as const,
          fontSize: 10,
          color: '#9ca3af',
          lineHeight: 1.6,
        }}
      >
        <span>{snapshot.seller.name}</span>
        {snapshot.seller.address ? <span> · {snapshot.seller.address}</span> : null}
        <span> · </span>
        <a href="https://mintcompos.com" style={{ color: '#6b7280', textDecoration: 'none' }}>
          mintcompos.com
        </a>
        <span> · </span>
        <a href={`mailto:${snapshot.seller.email}`} style={{ color: '#6b7280', textDecoration: 'none' }}>
          {snapshot.seller.email}
        </a>
      </div>
    </div>
  );
}

/** Wrap a rendered document in a standalone printable page. */
export const buildStandaloneHtml = (bodyHtml: string, title: string, autoPrint: boolean) => [
  '<!DOCTYPE html><html><head><meta charset="utf-8" />',
  `<title>${title}</title>`,
  '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">',
  '<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:"Inter",sans-serif;background:#f9fafb;padding:32px 20px;color:#111827}',
  '@media print{body{background:#fff;padding:0}#mintcom-subscription-invoice{border:none;border-radius:0;padding:0;max-width:100%}}</style></head><body>',
  bodyHtml,
  autoPrint ? '<script>setTimeout(function(){window.print()},300)</scr' + 'ipt>' : '',
  '</body></html>',
].join('');

/** Open `html` in a new tab and trigger the browser print dialog. */
export const printHtmlDocument = (html: string, title: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return false;
  printWindow.document.write(buildStandaloneHtml(html, title, true));
  printWindow.document.close();
  return true;
};

/** Save `html` as a standalone file the user can reopen or print later. */
export const downloadHtmlDocument = (html: string, title: string, fileName: string) => {
  const blob = new Blob([buildStandaloneHtml(html, title, false)], {
    type: 'text/html;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export interface SubscriptionInvoiceModalProps {
  data: SubscriptionInvoiceData | null;
  onClose: () => void;
  /** Rendered to the left of the actions, e.g. a "back to history" button. */
  leadingAction?: React.ReactNode;
}

/** Owner-facing invoice viewer with print (save as PDF) and download actions. */
export function SubscriptionInvoiceModal({ data, onClose, leadingAction }: SubscriptionInvoiceModalProps) {
  const { t } = useTranslation();
  const documentRef = useRef<HTMLDivElement>(null);

  const getInvoiceHtml = useCallback(() => {
    const node = documentRef.current?.querySelector(`#${INVOICE_DOM_ID}`);
    return node ? node.outerHTML : null;
  }, []);

  const documentTitle = data
    ? data.number
      ? `Invoice ${data.number}`
      : `Subscription Summary — ${data.snapshot.billTo.name}`
    : '';

  const handlePrint = useCallback(() => {
    const html = getInvoiceHtml();
    if (!html || !data) return;
    printHtmlDocument(html, documentTitle);
  }, [data, documentTitle, getInvoiceHtml]);

  const handleDownload = useCallback(() => {
    const html = getInvoiceHtml();
    if (!html || !data) return;
    downloadHtmlDocument(html, documentTitle, `Mintcom-${documentSlug(data)}.html`);
  }, [data, documentTitle, getInvoiceHtml]);

  if (!data) return null;

  return (
    <Modal isOpen={!!data} onClose={onClose} size="xl" className="sm:max-w-3xl">
      <ModalHeader
        title={data.number
          ? t('owner.billing.invoice.title', { defaultValue: 'Subscription Invoice' })
          : t('owner.billing.invoice.summaryTitle', { defaultValue: 'Subscription Summary' })}
        subtitle={`${data.snapshot.billTo.name}${data.number ? ` · #${data.number}` : ''}`}
        onClose={onClose}
      />

      <ModalBody>
        <div ref={documentRef} className="bg-gray-100/70 dark:bg-black/40 p-4 sm:p-6">
          <SubscriptionInvoiceDocument data={data} />
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex items-center gap-2 w-full justify-end">
          {leadingAction}
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
          >
            <Download size={15} />
            <span className="hidden sm:inline">
              {t('owner.billing.invoice.download', { defaultValue: 'Download' })}
            </span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-mintcom-green/20 bg-mintcom-green/10 px-3 py-2 text-xs font-bold text-mintcom-green transition hover:bg-mintcom-green/20"
          >
            <Printer size={15} />
            <span className="hidden sm:inline">
              {t('owner.billing.invoice.print', { defaultValue: 'Print / Save PDF' })}
            </span>
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

export default SubscriptionInvoiceModal;

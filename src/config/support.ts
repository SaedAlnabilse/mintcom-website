import { env } from './env';

const DEFAULT_SUPPORT_ADMIN_EMAILS = ['support@paymintpos.net'];

export const SUPPORT_ADMIN_EMAILS = (
  env.VITE_SUPPORT_ADMIN_EMAILS
    ? env.VITE_SUPPORT_ADMIN_EMAILS.split(',')
    : DEFAULT_SUPPORT_ADMIN_EMAILS
)
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isSupportAdminEmail(email?: string | null) {
  return !!email && SUPPORT_ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

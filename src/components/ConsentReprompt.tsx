import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getConsentStatus, recordConsent } from '../services/legalConsent';

/**
 * Global gate that re-prompts a signed-in account owner to accept the Terms of
 * Service / Privacy Policy when the backend reports their accepted policy
 * version is stale (reacceptanceRequired). Mounted once at the app root, inside
 * AuthProvider. Fails open: if the consent check errors (offline, etc.) it does
 * NOT block the app.
 *
 * Backed by the legal/consent authority (src/services/legalConsent.ts ->
 * /api/legal/consent). The policy TEXT lives in the bundled legal pages; this
 * only handles the version/acceptance handshake.
 */
export function ConsentReprompt() {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, account, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Track which account id we've already checked so we fetch once per session.
  const checkedFor = useRef<string | null>(null);

  const isRtl = t('common.locale') === 'ar';
  // Owner only — secondary admins / employees are out of scope (mirrors how
  // AuthContext skips owner-only calls for isSecondaryAdmin users).
  const isOwner = !!account && account.isSecondaryAdmin !== true;

  useEffect(() => {
    if (isLoading || !isAuthenticated || !isOwner || !account) return;
    if (checkedFor.current === account.id) return;
    checkedFor.current = account.id;

    let cancelled = false;
    (async () => {
      try {
        const status = await getConsentStatus();
        if (!cancelled && status.reacceptanceRequired) setOpen(true);
      } catch {
        // Fail open: never block the app on a consent-check error.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, isOwner, account]);

  const handleAccept = async () => {
    setSubmitting(true);
    try {
      await recordConsent(true);
      setOpen(false);
    } catch {
      toast.error(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    setSubmitting(true);
    // logout() handles its own overlay + hard redirect to /login.
    await logout();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[2200] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
          >
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mintcom-green/10 text-mintcom-green">
                <ShieldCheck size={28} />
              </div>
              <h3 className="font-barlow text-2xl font-bold text-gray-900 dark:text-white">
                {t('legal.consent.title')}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {t('legal.consent.body')}
              </p>
            </div>

            <div className="mb-6 flex flex-col gap-2 text-center">
              <a
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-mintcom-green hover:underline"
              >
                {t('legal.consent.reviewPrivacy')}
              </a>
              <a
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-bold text-mintcom-green hover:underline"
              >
                {t('legal.consent.reviewTerms')}
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAccept}
                disabled={submitting}
                className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-mintcom-green font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-all disabled:opacity-60"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                />
                <span className="relative">{t('legal.consent.acceptButton')}</span>
              </motion.button>
              <button
                onClick={handleDecline}
                disabled={submitting}
                className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
              >
                {t('legal.consent.declineButton')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../config/api';
import { useTranslation } from 'react-i18next';

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('auth.verifyEmail.linkInvalidOrExpired'));
      return;
    }

    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyEmail = async () => {
      try {
        const response = await api.post('/api/accounts/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || t('auth.verifyEmail.verified'));
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || t('auth.verifyEmail.linkExpired'));
      }
    };

    verifyEmail();
  }, [token, t]);

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-12 transition-colors duration-300" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8 max-w-md w-full text-center"
      >
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mintcom-green/10">
              <Loader2 className="w-8 h-8 text-mintcom-green animate-spin" />
            </div>
            <h2 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('auth.verifyEmail.verifyingTitle')}</h2>
            <p className="text-[15px] text-stone-500 dark:text-zinc-400">{t('auth.verifyEmail.verifyingSubtitle')}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-mintcom-green/10">
              <CheckCircle className="w-8 h-8 text-mintcom-green" />
            </div>
            <h2 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('auth.verifyEmail.successTitle')}</h2>
            <p className="text-[15px] text-stone-500 dark:text-zinc-400">{message}</p>
            <Link
              to="/login"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 active:scale-[0.97] dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
            >
              <span>{t('auth.verifyEmail.continueLogin')}</span>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('auth.verifyEmail.linkExpiredTitle')}</h2>
            <p className="text-[15px] text-stone-500 dark:text-zinc-400">
              {t('auth.verifyEmail.linkInvalidOrExpired')}
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-flex w-full items-center justify-center rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 active:scale-[0.97] dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
              >
                {t('auth.verifyEmail.goToLogin')}
              </Link>
              <Link
                to="/"
                className="text-sm font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
              >
                {t('auth.verifyEmail.backToHome')}
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}


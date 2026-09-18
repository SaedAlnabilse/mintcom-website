import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

export function ForgotPasswordPage() {
  const { t } = useTranslation();

  const forgotPasswordSchema = z.object({
    email: z.string().email(t('validation.emailInvalid')),
  });

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await api.post('/api/accounts/forgot-password', data);
      setSentEmail(data.email);
      setIsSuccess(true);
      toast.success(t('auth.forgotPassword.resetLinkSent'));
    } catch {
      // Always show success to prevent email enumeration
      // The backend returns success even for non-existent emails
      setSentEmail(data.email);
      setIsSuccess(true);
      toast.success(t('auth.forgotPassword.resetLinkSent'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-12 transition-colors duration-300" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        {/* Back to Login */}
        {!isSuccess && (
            <button
              onClick={() => navigate('/login')}
              aria-label={t('auth.forgotPassword.backToLogin')}
              className="flex min-h-[44px] items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors mb-8 group"
            >
              <ArrowLeft size={15} className={`transition-transform group-hover:-translate-x-0.5 ${t('common.locale') === 'ar' ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
              {t('auth.forgotPassword.backToLogin')}
            </button>
        )}

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8"
            >
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-mintcom-green/10 text-mintcom-green">
                  <Mail size={22} />
                </div>
                <h1 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('auth.forgotPassword.title')}</h1>
                <p className="mt-2 text-[15px] text-stone-500 dark:text-zinc-400">{t('auth.forgotPassword.subtitle')}</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">{formatInputLabel(t('auth.forgotPassword.emailLabel'), t('common.locale'))}</label>
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
                    <input maxLength={255}
                      type="email"
                      {...register('email')}
                      className={`w-full rounded-xl border bg-white py-3 ps-10 pe-4 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20 transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${errors.email ? 'border-red-500' : 'border-stone-200 dark:border-zinc-700'}`}
                      placeholder={formatInputPlaceholder(t('auth.login.emailPlaceholder'), t('common.locale'))}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs font-semibold text-red-500 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : null}
                  {t('auth.forgotPassword.sendLink')}
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8 text-center"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mintcom-green/10">
                <CheckCircle2 className="text-mintcom-green" size={28} />
              </div>
              <h2 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100">{t('auth.forgotPassword.emailSent')}</h2>
              <p className="mt-2 text-[15px] text-stone-500 dark:text-zinc-400">
                {t('auth.forgotPassword.linkSentTo')}
                <br />
                <span className="font-semibold text-stone-900 dark:text-zinc-100">{sentEmail}</span>
              </p>

              <div className="mt-6 pt-5 border-t border-stone-200 dark:border-zinc-800">
                <p className="text-sm text-stone-500">
                  {t('auth.forgotPassword.didntReceive')}{' '}
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-sm font-semibold text-mintcom-greenInk hover:underline dark:text-mintcom-green"
                  >
                    {t('auth.forgotPassword.tryAnotherEmail')}
                  </button>
                </p>
              </div>

              <Link
                to="/login"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
              >
                <ArrowLeft size={15} />
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}


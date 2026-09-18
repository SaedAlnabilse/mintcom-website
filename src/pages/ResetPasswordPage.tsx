import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';
import { getPasswordSchema, STRONG_PASSWORD } from '../utils/validation';

export function ResetPasswordPage() {
  const { t } = useTranslation();

  const resetPasswordSchema = z.object({
    password: getPasswordSchema(t, 'validation'),
    confirmPassword: z.string(),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('validation.passwordsDoNotMatch'),
    path: ["confirmPassword"],
  });

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    }
  });

  const password = watch('password');

  const criteria = [
    { label: t('validation.passwordMin'), met: password.length >= STRONG_PASSWORD.min },
    ...STRONG_PASSWORD.checks.map(check => ({
      label: t(`validation.${check.key}`),
      met: check.regex.test(password),
    })),
  ];

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error(t('auth.resetPassword.invalidLink'));
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/accounts/reset-password', {
        token,
        newPassword: data.password,
      });
      localStorage.removeItem('account');
      localStorage.removeItem('accessToken');
      sessionStorage.removeItem('currentEstablishment');
      setIsSuccess(true);
      toast.success(t('auth.resetPassword.success'));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('auth.resetPassword.invalidLink'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-12 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8 max-w-md w-full text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 mb-3">{t('auth.resetPassword.invalidLinkTitle')}</h2>
          <p className="text-[15px] text-stone-500 dark:text-zinc-400 mb-6 leading-relaxed">
            {t('auth.resetPassword.invalidLinkSubtitle')}
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
          >
            {t('auth.resetPassword.getNewLink')}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-12 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8 max-w-md w-full text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mintcom-green/10">
            <CheckCircle className="w-8 h-8 text-mintcom-green" />
          </div>
          <h2 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 mb-3">{t('auth.resetPassword.successTitle')}</h2>
          <p className="text-[15px] text-stone-500 dark:text-zinc-400 mb-6 leading-relaxed">
            {t('auth.resetPassword.passwordUpdatedShort')}
          </p>
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
          >
            {t('auth.resetPassword.goToLogin')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-100 dark:bg-zinc-950 flex items-center justify-center px-4 py-12 transition-colors duration-300" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8 max-w-md w-full"
      >
        <div className="mb-6 text-center">
          <h1 className="font-magilio text-2xl font-bold tracking-tight text-stone-900 dark:text-zinc-100 mb-2">
            {t('auth.resetPassword.resetTitle')}{' '}
            <span className="text-mintcom-green">{t('auth.resetPassword.passwordHighlight')}</span>
          </h1>
          <p className="text-[15px] text-stone-500 dark:text-zinc-400">
            {t('auth.resetPassword.enterNewPassword')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">{formatInputLabel(t('auth.resetPassword.passwordLabel'), t('common.locale'))}</label>
            <div className="relative">
              <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <input maxLength={255}
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full rounded-xl border border-stone-200 bg-white py-3 ps-10 pe-12 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20 transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder={formatInputPlaceholder("••••••••", t('common.locale'))}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                className="absolute end-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="text-xs font-semibold text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">{formatInputLabel(t('auth.resetPassword.confirmPasswordLabel'), t('common.locale'))}</label>
            <div className="relative">
              <Lock className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" size={15} />
              <input maxLength={255}
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="w-full rounded-xl border border-stone-200 bg-white py-3 ps-10 pe-12 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-mintcom-green focus:ring-2 focus:ring-mintcom-green/20 transition-all dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                placeholder={formatInputPlaceholder("••••••••", t('common.locale'))}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                className="absolute end-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs font-semibold text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-stone-50 dark:bg-zinc-900 rounded-xl border border-stone-200 dark:border-zinc-800">
            {criteria.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                {item.met ? (
                  <CheckCircle2 size={14} className="text-mintcom-green flex-shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-stone-300 dark:border-zinc-700 flex-shrink-0" />
                )}
                <span className={`text-xs font-semibold ${item.met ? 'text-mintcom-green' : 'text-stone-400'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
            >
              {isLoading ? <Loader2 className="animate-spin" size={15} /> : null}
              {t('auth.resetPassword.reset').toUpperCase()}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

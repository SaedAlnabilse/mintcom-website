import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export function ResetPasswordPage() {
  const { t } = useTranslation();

  const resetPasswordSchema = z.object({
    password: z.string()
      .min(8, t('validation.passwordMin'))
      .regex(/[A-Z]/, t('validation.passwordUppercase'))
      .regex(/[a-z]/, t('validation.passwordLowercase'))
      .regex(/[0-9]/, t('validation.passwordNumber')),
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

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

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
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 max-w-md w-full text-center shadow-2xl shadow-gray-200/50 dark:shadow-none"
        >
          <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-10 h-10 text-accent" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t('auth.resetPassword.invalidLinkTitle')}</h2>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {t('auth.resetPassword.invalidLinkSubtitle')}
          </p>
          <Link
            to="/forgot-password"
            className="inline-flex items-center justify-center w-full bg-paymint-green text-black text-xs font-black tracking-widest py-4 px-6 rounded-2xl hover:bg-paymint-green/90 transition-all active:scale-95 shadow-lg shadow-paymint-green/20"
          >
            {t('auth.resetPassword.getNewLink')}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 max-w-md w-full text-center shadow-2xl shadow-gray-200/50 dark:shadow-none"
        >
          <div className="w-20 h-20 bg-paymint-green/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-paymint-green" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t('auth.resetPassword.successTitle')}</h2>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            {t('auth.resetPassword.passwordUpdatedShort')}
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full bg-gray-900 dark:bg-white text-white dark:text-black text-xs font-black tracking-widest py-4 px-6 rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-lg shadow-gray-900/20"
          >
            {t('auth.resetPassword.goToLogin')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 max-w-md w-full shadow-2xl shadow-gray-200/50 dark:shadow-none"
      >
        <div className="text-center mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
            {t('auth.resetPassword.resetTitle')} <span className="text-paymint-green">{t('auth.resetPassword.passwordHighlight')}</span>
          </h1>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('auth.resetPassword.enterNewPassword')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 tracking-widest ml-1">{t('auth.resetPassword.passwordLabel')}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-accent text-xs font-bold text-gray-500 mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 tracking-widest ml-1">{t('auth.resetPassword.confirmPasswordLabel')}</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-accent text-xs font-bold text-gray-500 mt-1 ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-paymint-green text-black text-xs font-black tracking-widest py-4 px-6 rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
              {t('auth.resetPassword.reset').toUpperCase()}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

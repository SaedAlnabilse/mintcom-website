import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock, X,
  AlertTriangle, Send, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton, AuthDivider } from '../components/GoogleAuthButton';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';

export function LoginPage() {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';

  const loginSchema = z.object({
    email: z.string().email(t('validation.emailInvalid')),
    password: z.string().min(1, t('validation.passwordRequired')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, resendVerification } = useAuth();

  const redirectTo = (location.state as { from?: string })?.from;

  const handleGoogleSuccess = async (credential: string) => {
    try {
      const result = await loginWithGoogle(credential);
      if (result.success) {
        toast.success(result.message || t('common.welcome'));
        navigate(redirectTo || '/');
      } else {
        toast.error(result.error || t('auth.login.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleGoogleError = (error: string) => toast.error(error);

  const { register, handleSubmit, setError, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success(t('common.welcomeBack'));
        navigate(redirectTo || '/');
      } else {
        if (result.error === 'Email not verified') {
          setUnverifiedEmail(data.email);
          setShowVerifyModal(true);
        } else {
          toast.error(result.error || t('auth.login.failed'));
          setError('email', { type: 'manual' });
          setError('password', { type: 'manual' });
        }
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await resendVerification(unverifiedEmail);
      if (result.success) {
        toast.success(t('auth.signup.verificationSent'));
        setShowVerifyModal(false);
      } else {
        toast.error(result.error || t('auth.verifyEmail.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsResending(false);
    }
  };

  const inputBase = (hasError: boolean) =>
    `w-full rounded-2xl border bg-gray-50/70 px-5 py-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-paymint-green/30 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10 ${
      hasError
        ? 'border-red-400 dark:border-red-500'
        : 'border-gray-200 dark:border-white/10 focus:border-paymint-green/40'
    }`;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen items-center justify-center bg-white px-6 py-12 transition-colors duration-300 dark:bg-[#050505]"
    >
      <Helmet>
        <title>{t('metadata.login.title')}</title>
        <meta name="description" content={t('metadata.login.description')} />
        <meta property="og:title" content={t('metadata.login.title')} />
        <meta property="og:description" content={t('metadata.login.description')} />
      </Helmet>

      {/* Background ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-paymint-green/8 blur-[140px]" />
        <div className="absolute -bottom-20 right-[10%] h-[300px] w-[300px] rounded-full bg-emerald-400/5 blur-[100px]" />
        {/* Faint grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            color: '#7CC39F',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      {/* Minimal top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 md:px-10">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="pointer-events-auto">
          <img src={PaymintLogoGreen} alt="PayMint" className="h-8 w-auto object-contain dark:hidden" />
          <img src={PaymintLogoWhite} alt="PayMint" className="hidden h-8 w-auto object-contain dark:block" />
        </Link>
        <div className="pointer-events-auto flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Back link */}
        <a
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft size={15} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
          {t('auth.signup.backButton')}
        </a>

        {/* Heading */}
        <div className="mb-8">
          <h1 className="font-magilio text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            {t('auth.login.title')}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Glass card */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/90 p-8 shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-paymint-green/10 blur-3xl" />

          <div className="relative">
            {/* Google */}
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              text="signin_with"
              disabled={isSubmitting}
            />

            <AuthDivider />

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {formatInputLabel(t('auth.login.emailLabel'), t('common.locale'))}
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    maxLength={255}
                    {...register('email')}
                    type="email"
                    id="login-email"
                    autoComplete="email"
                    className={`${inputBase(!!errors.email)} ps-10`}
                    placeholder={formatInputPlaceholder(t('auth.login.emailPlaceholder'), t('common.locale'))}
                  />
                </div>
                {errors.email?.message && (
                  <p role="alert" className="text-xs font-bold text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="block text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {formatInputLabel(t('auth.login.passwordLabel'), t('common.locale'))}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[12px] font-bold text-paymint-green hover:underline"
                  >
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    maxLength={255}
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    autoComplete="current-password"
                    className={`${inputBase(!!errors.password)} ps-10 pe-12`}
                    placeholder={formatInputPlaceholder(t('auth.login.passwordPlaceholder'), t('common.locale'))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password?.message && (
                  <p role="alert" className="text-xs font-bold text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Keep logged in */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="keepLoggedIn"
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-paymint-green focus:ring-paymint-green dark:border-white/20"
                />
                <label htmlFor="keepLoggedIn" className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t('auth.login.keepLoggedIn')}
                </label>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-paymint-green font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-shadow hover:shadow-[0_12px_32px_-8px_rgba(124,195,159,0.7)] disabled:opacity-60"
              >
                <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">{isSubmitting ? t('auth.login.loggingIn') : t('auth.login.loginButton')}</span>
                <ArrowRight size={16} className={`relative transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('auth.login.noAccount')}{' '}
                <Link to="/signup" className="font-bold text-paymint-green hover:underline">
                  {t('auth.login.signUp')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Verification modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVerifyModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              <button
                onClick={() => setShowVerifyModal(false)}
                className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                  <AlertTriangle size={28} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-magilio text-2xl font-bold text-gray-900 dark:text-white">
                  {t('auth.verifyEmail.verifyingTitle')}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('auth.verifyEmail.verifyingSubtitle')}
                </p>
                <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{unverifiedEmail}</p>
              </div>

              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-paymint-green font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-all disabled:opacity-60"
                >
                  <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  {isResending ? (
                    <span className="relative">{t('auth.verifyEmail.sending')}</span>
                  ) : (
                    <>
                      <Send size={15} className="relative" />
                      <span className="relative">{t('auth.verifyEmail.resendButton')}</span>
                    </>
                  )}
                </motion.button>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
                >
                  {t('common.close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

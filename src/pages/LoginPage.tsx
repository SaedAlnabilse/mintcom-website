import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock, X,
  AlertTriangle, Send, ArrowRight, KeyRound, UserPlus, Clock,
} from 'lucide-react';
import MintcomLeafIcon from '../assets/small-logo.svg';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton, AuthDivider, GOOGLE_CLIENT_ID } from '../components/GoogleAuthButton';
import { AppleAuthButton, APPLE_AUTH_ENABLED, type AppleAuthCredential } from '../components/AppleAuthButton';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';
import { useScrollLock } from '../hooks/useScrollLock';
import { getPostLoginDestination } from '../utils/postLoginRedirect';

type SocialProvider = 'google' | 'apple';

const isWrongCredentialsError = (error?: string, code?: string) => {
  if (code === 'OWNER_SESSION_ACTIVE' || code === 'ACCOUNT_NOT_FOUND') return false;
  // Empty / generic failure after a form submit almost always means bad credentials.
  if (!error) return true;
  const normalized = error.toLowerCase();
  if (normalized.includes('too many') || normalized.includes('throttler') || normalized.includes('rate limit')) {
    return false;
  }
  // Never surface password-strength rules on login — show the sign-in modal instead.
  if (
    normalized.includes('password must') ||
    normalized.includes('uppercase') ||
    normalized.includes('lowercase letter') ||
    normalized.includes('at least 8 characters')
  ) {
    return true;
  }
  return (
    normalized.includes('invalid email or password') ||
    normalized.includes('invalid credentials') ||
    normalized.includes('login failed') ||
    normalized.includes('check your credentials') ||
    normalized.includes('incorrect password') ||
    normalized.includes('unauthorized')
  );
};

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
  const [showWrongCredentialsModal, setShowWrongCredentialsModal] = useState(false);
  const [showNoAccountModal, setShowNoAccountModal] = useState(false);
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [socialProvider, setSocialProvider] = useState<SocialProvider>('google');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginWithGoogle, loginWithApple, resendVerification } = useAuth();

  const anyAuthModalOpen =
    showVerifyModal || showWrongCredentialsModal || showNoAccountModal || showRateLimitModal;
  useScrollLock(anyAuthModalOpen);

  const redirectTo = (location.state as { from?: string })?.from;

  const finishLogin = (result: {
    needsOnboarding?: boolean;
    requiresAccountRecovery?: boolean;
    isSecondaryAdmin?: boolean;
    establishments?: import('../types').Establishment[];
  }) => {
    navigate(
      getPostLoginDestination({
        redirectTo,
        requiresAccountRecovery: result.requiresAccountRecovery,
        needsOnboarding: result.needsOnboarding,
        isSecondaryAdmin: result.isSecondaryAdmin,
        establishments: result.establishments,
      }),
      { replace: true },
    );
  };

  const handleGoogleSuccess = async (credential: string) => {
    try {
      // Login page only: never auto-create an account from Google.
      const result = await loginWithGoogle(credential, undefined, 'login');
      if (result.success) {
        toast.success(result.message || t('common.welcome'));
        finishLogin(result);
      } else if (result.code === 'ACCOUNT_NOT_FOUND') {
        setSocialProvider('google');
        setShowNoAccountModal(true);
      } else if (
        result.statusCode === 429 ||
        result.error?.toLowerCase().includes('too many') ||
        result.error?.toLowerCase().includes('throttler')
      ) {
        setShowRateLimitModal(true);
      } else {
        toast.error(result.error || t('auth.login.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleGoogleError = (error: string) => toast.error(error);

  const handleAppleSuccess = async (credential: AppleAuthCredential) => {
    try {
      // Login page only: never auto-create an account from Apple.
      const result = await loginWithApple(credential, 'login');
      if (result.success) {
        toast.success(result.message || t('common.welcome'));
        finishLogin(result);
      } else if (result.code === 'ACCOUNT_NOT_FOUND') {
        setSocialProvider('apple');
        setShowNoAccountModal(true);
      } else if (
        result.statusCode === 429 ||
        result.error?.toLowerCase().includes('too many') ||
        result.error?.toLowerCase().includes('throttler')
      ) {
        setShowRateLimitModal(true);
      } else {
        toast.error(result.error || t('auth.login.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const { register, handleSubmit, setError, setFocus, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);
      if (result.success) {
        toast.success(t('common.welcomeBack'));
        finishLogin(result);
      } else {
        if (result.error === 'Email not verified') {
          setUnverifiedEmail(data.email);
          setShowVerifyModal(true);
        } else if (
          result.statusCode === 429 ||
          result.error?.toLowerCase().includes('too many') ||
          result.error?.toLowerCase().includes('throttler') ||
          result.error?.toLowerCase().includes('rate limit')
        ) {
          setShowRateLimitModal(true);
        } else if (isWrongCredentialsError(result.error, result.code)) {
          setError('email', { type: 'manual' });
          setError('password', { type: 'manual' });
          setShowWrongCredentialsModal(true);
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

  const handleTryAgain = () => {
    setShowWrongCredentialsModal(false);
    // Give the modal a beat to close, then focus password for a quick retry.
    setTimeout(() => setFocus('password'), 150);
  };

  const goToSignUp = () => {
    setShowWrongCredentialsModal(false);
    setShowNoAccountModal(false);
    navigate('/signup');
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
    `w-full rounded-2xl border bg-gray-50/70 px-5 py-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10 ${
      hasError
        ? 'border-red-400 dark:border-red-500'
        : 'border-gray-200 dark:border-white/10 focus:border-mintcom-green/40'
    }`;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen items-center justify-center bg-white px-6 pb-12 pt-24 transition-colors duration-300 dark:bg-[#050505] md:py-12"
    >
      <Helmet>
        <title>{t('metadata.login.title')}</title>
        <meta name="description" content={t('metadata.login.description')} />
        <meta property="og:title" content={t('metadata.login.title')} />
        <meta property="og:description" content={t('metadata.login.description')} />
      </Helmet>

      {/* Background ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-mintcom-green/8 blur-[140px]" />
        <div className="absolute -bottom-20 right-[10%] h-[300px] w-[300px] rounded-full bg-emerald-400/5 blur-[100px]" />
        {/* Faint grid */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04] dark:hidden"
          style={{
            backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            color: '#7dc6a2',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      {/* Minimal top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 md:px-10">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="pointer-events-auto">
          <img src={MintcomLogoGreen} alt="Mintcom" className="h-8 w-auto object-contain dark:hidden" />
          <img src={MintcomLogoWhite} alt="Mintcom" className="hidden h-8 w-auto object-contain dark:block" />
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
        className="relative z-10 w-full max-w-md xl:max-w-lg 2xl:max-w-xl"
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
          <h1 className="font-magilio text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl 2xl:text-5xl">
            {t('auth.login.title')}
          </h1>
          <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 2xl:text-base">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Glass card */}
        <div className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/90 p-8 shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none 2xl:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-mintcom-green/10 blur-3xl" />

          <div className="relative">
            {/* Social sign-in — Google and/or Apple, shown when configured */}
            {(GOOGLE_CLIENT_ID || APPLE_AUTH_ENABLED) && (
              <>
                <div className="space-y-3">
                  {GOOGLE_CLIENT_ID && (
                    <GoogleAuthButton
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      text="signin_with"
                      disabled={isSubmitting}
                    />
                  )}
                  {APPLE_AUTH_ENABLED && (
                    <AppleAuthButton
                      onSuccess={handleAppleSuccess}
                      onError={handleGoogleError}
                      text="signin_with"
                      disabled={isSubmitting}
                    />
                  )}
                </div>

                <AuthDivider />
              </>
            )}

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
                    className="text-[12px] font-bold text-mintcom-greenInk hover:underline dark:text-mintcom-green"
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
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green dark:border-white/20"
                />
                <label htmlFor="keepLoggedIn" className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t('auth.login.keepLoggedIn')}
                </label>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green font-bold text-black shadow-md shadow-mintcom-green/20 transition-all hover:bg-mintcom-green/90 disabled:opacity-60"
                style={{ borderRadius: 12, backgroundColor: '#7dc6a2' }}
              >
                <span className="relative font-bold text-black">{isSubmitting ? t('auth.login.loggingIn') : t('auth.login.loginButton')}</span>
                <ArrowRight size={16} className={`text-black transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('auth.login.noAccount')}{' '}
                <Link to="/signup" className="font-bold text-mintcom-greenInk hover:underline dark:text-mintcom-green">
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="verify-email-title"
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              <button
                type="button"
                onClick={() => setShowVerifyModal(false)}
                aria-label={t('auth.login.ariaCloseModal')}
                className="absolute end-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                  <AlertTriangle size={28} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3 id="verify-email-title" className="font-barlow text-2xl font-bold text-gray-900 dark:text-white">
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
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-mintcom-green font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-all disabled:opacity-60"
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
                  type="button"
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

      {/* Wrong email / password modal */}
      <AnimatePresence>
        {showWrongCredentialsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWrongCredentialsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="wrong-credentials-title"
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-400/15 blur-3xl"
              />
              <button
                type="button"
                onClick={() => setShowWrongCredentialsModal(false)}
                aria-label={t('auth.login.ariaCloseModal')}
                className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="relative mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
                  <KeyRound size={28} className="text-rose-600 dark:text-rose-400" />
                </div>
                <h3
                  id="wrong-credentials-title"
                  className="font-barlow text-2xl font-bold text-gray-900 dark:text-white"
                >
                  {t('auth.login.wrongCredentialsTitle')}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t('auth.login.wrongCredentialsMessage')}
                </p>
              </div>

              <div className="relative flex flex-col gap-3 sm:flex-row">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleTryAgain}
                  className="group relative inline-flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-mintcom-green px-4 py-3.5 font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-all"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <KeyRound size={15} className="relative" />
                  <span className="relative">{t('auth.login.tryAgain')}</span>
                </motion.button>
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={goToSignUp}
                  className="inline-flex min-h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  <UserPlus size={15} />
                  {t('auth.login.createAccount')}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google / Apple — no linked Mintcom account */}
      <AnimatePresence>
        {showNoAccountModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNoAccountModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="no-social-account-title"
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-mintcom-green/20 blur-3xl"
              />
              <button
                type="button"
                onClick={() => setShowNoAccountModal(false)}
                aria-label={t('auth.login.ariaCloseModal')}
                className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="relative mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mintcom-green/15 dark:bg-mintcom-green/20">
                  <img src={MintcomLeafIcon} alt="" style={{ width: 28, height: 28 }} className="scale-x-[-1] object-contain" />
                </div>
                <h3
                  id="no-social-account-title"
                  className="font-barlow text-2xl font-bold text-gray-900 dark:text-white"
                >
                  {t('auth.login.noSocialAccountTitle')}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t('auth.login.noSocialAccountMessage', {
                    provider:
                      socialProvider === 'apple'
                        ? t('auth.login.noSocialAccountApple')
                        : t('auth.login.noSocialAccountGoogle'),
                  })}
                </p>
              </div>

              <div className="relative flex flex-col gap-3">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={goToSignUp}
                  className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-mintcom-green font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-all"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <UserPlus size={16} className="relative" />
                  <span className="relative">{t('auth.login.createAccount')}</span>
                  <ArrowRight
                    size={16}
                    className={`relative transition-transform ${isRtl ? 'rotate-180' : ''}`}
                  />
                </motion.button>
                <button
                  type="button"
                  onClick={() => setShowNoAccountModal(false)}
                  className="w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/10 dark:text-gray-400 dark:hover:bg-white/5"
                >
                  {t('common.close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rate limit / Too many requests modal */}
      <AnimatePresence>
        {showRateLimitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRateLimitModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="rate-limit-title"
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl"
              />
              <button
                type="button"
                onClick={() => setShowRateLimitModal(false)}
                aria-label={t('auth.login.ariaCloseModal')}
                className="absolute end-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <div className="relative mb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
                  <Clock size={28} className="text-amber-600 dark:text-amber-400" />
                </div>
                <h3
                  id="rate-limit-title"
                  className="font-barlow text-2xl font-bold text-gray-900 dark:text-white"
                >
                  {t('auth.login.rateLimitTitle', { defaultValue: 'Too Many Attempts' })}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {t('auth.login.rateLimitMessage', {
                    defaultValue:
                      'For your security, sign-in attempts have been temporarily limited due to multiple rapid attempts. Please wait 1 minute before trying again.',
                  })}
                </p>
              </div>

              <div className="relative flex flex-col gap-3">
                <motion.button
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setShowRateLimitModal(false)}
                  className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-mintcom-green font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-all"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                  <Clock size={16} className="relative" />
                  <span className="relative">
                    {t('auth.login.rateLimitClose', { defaultValue: 'I Understand' })}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock,
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
import { ModalCloseButton, Modal, ModalBody } from '../components/ui';
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
    `w-full rounded-2xl border bg-gray-50/70 px-5 py-4 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10 ${
      hasError
        ? 'border-red-400 dark:border-red-500'
        : 'border-gray-200 dark:border-white/10 focus:border-mintcom-green/40'
    }`;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-cream-100 dark:bg-zinc-950 flex items-center justify-center px-6 pb-12 pt-24 transition-colors duration-300"
    >
      <Helmet>
        <title>{t('metadata.login.title')}</title>
        <meta name="description" content={t('metadata.login.description')} />
        <meta property="og:title" content={t('metadata.login.title')} />
        <meta property="og:description" content={t('metadata.login.description')} />
      </Helmet>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-mintcom-green/8 blur-[140px]" />
        <div className="absolute -bottom-20 right-[10%] h-[300px] w-[300px] rounded-full bg-emerald-400/5 blur-[100px]" />
      </div>

      <nav className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 md:px-10">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="pointer-events-auto">
          <img src={MintcomLogoGreen} alt="Mintcom" className="h-8 w-auto object-contain dark:hidden" />
          <img src={MintcomLogoWhite} alt="Mintcom" className="hidden h-8 w-auto object-contain dark:block" />
        </Link>
        <div className="pointer-events-auto flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative z-10 w-full max-w-md xl:max-w-lg"
      >
        <a
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-stone-500 transition-colors hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft size={15} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
          {t('auth.signup.backButton')}
        </a>

        {/* Heading — support header style */}
        <div className="mb-5 text-center">
          <h1 className="font-magilio text-3xl font-bold tracking-tight sm:text-4xl text-stone-900 dark:text-zinc-100">
            {t('auth.login.title')}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-stone-500 dark:text-zinc-400">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Card — quiet bordered white */}
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-8">
          <div className="relative">
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

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">
                  {formatInputLabel(t('auth.login.emailLabel'), t('common.locale'))}
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" />
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
                  <p role="alert" className="text-xs font-semibold text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-[13px] font-semibold text-stone-700 dark:text-zinc-200">
                    {formatInputLabel(t('auth.login.passwordLabel'), t('common.locale'))}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[13px] font-semibold text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {t('auth.login.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-stone-400" />
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
                    className="absolute end-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.password?.message && (
                  <p role="alert" className="text-xs font-semibold text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Keep logged in */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="keepLoggedIn"
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green dark:border-zinc-700"
                />
                <label htmlFor="keepLoggedIn" className="cursor-pointer text-sm font-medium text-stone-600 dark:text-zinc-300">
                  {t('auth.login.keepLoggedIn')}
                </label>
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:opacity-50 dark:bg-mintcom-green dark:text-black dark:hover:brightness-110"
              >
                <span>{isSubmitting ? t('auth.login.loggingIn') : t('auth.login.loginButton')}</span>
                <ArrowRight size={15} className={`shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
              </motion.button>
            </form>

            <div className="mt-5 text-center">
              <p className="text-[13px] text-stone-500 dark:text-zinc-400">
                {t('auth.login.noAccount')}{' '}
                <Link to="/signup" className="font-semibold text-mintcom-greenInk hover:underline dark:text-mintcom-green">
                  {t('auth.login.signUp')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Verification modal */}
      <Modal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        size="sm"
        ariaLabel={t('auth.verifyEmail.verifyingTitle')}
      >
        <ModalCloseButton onClose={() => setShowVerifyModal(false)} autoPositionAbsolute />

        <ModalBody>
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
        </ModalBody>
      </Modal>

      {/* Wrong email / password modal */}
      <Modal
        isOpen={showWrongCredentialsModal}
        onClose={() => setShowWrongCredentialsModal(false)}
        size="sm"
        ariaLabel={t('auth.login.wrongCredentialsTitle')}
      >
        <ModalCloseButton onClose={() => setShowWrongCredentialsModal(false)} autoPositionAbsolute />

        <ModalBody>
          <div className="relative mb-6 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-rose-400/15 blur-3xl"
            />
            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-900/30">
              <KeyRound size={28} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3
              id="wrong-credentials-title"
              className="relative font-barlow text-2xl font-bold text-gray-900 dark:text-white"
            >
              {t('auth.login.wrongCredentialsTitle')}
            </h3>
            <p className="relative mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
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
        </ModalBody>
      </Modal>

      {/* Google / Apple — no linked Mintcom account */}
      <Modal
        isOpen={showNoAccountModal}
        onClose={() => setShowNoAccountModal(false)}
        size="sm"
        ariaLabel={t('auth.login.noSocialAccountTitle')}
      >
        <ModalCloseButton onClose={() => setShowNoAccountModal(false)} autoPositionAbsolute />

        <ModalBody>
          <div className="relative mb-6 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full bg-mintcom-green/20 blur-3xl"
            />
            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mintcom-green/15 dark:bg-mintcom-green/20">
              <img src={MintcomLeafIcon} alt="" style={{ width: 28, height: 28 }} className="scale-x-[-1] object-contain" />
            </div>
            <h3
              id="no-social-account-title"
              className="relative font-barlow text-2xl font-bold text-gray-900 dark:text-white"
            >
              {t('auth.login.noSocialAccountTitle')}
            </h3>
            <p className="relative mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
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
        </ModalBody>
      </Modal>

      {/* Rate limit / Too many requests modal */}
      <Modal
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        size="sm"
        ariaLabel={t('auth.login.rateLimitTitle', { defaultValue: 'Too Many Attempts' })}
      >
        <ModalCloseButton onClose={() => setShowRateLimitModal(false)} autoPositionAbsolute />

        <ModalBody>
          <div className="relative mb-6 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-400/15 blur-3xl"
            />
            <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <Clock size={28} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h3
              id="rate-limit-title"
              className="relative font-barlow text-2xl font-bold text-gray-900 dark:text-white"
            >
              {t('auth.login.rateLimitTitle', { defaultValue: 'Too Many Attempts' })}
            </h3>
            <p className="relative mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
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
        </ModalBody>
      </Modal>
    </div>
  );
}

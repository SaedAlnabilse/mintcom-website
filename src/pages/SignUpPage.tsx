import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock, User, Check,
  ShieldCheck, CheckCircle2, ArrowRight, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  GoogleAuthButton, AuthDivider, GOOGLE_CLIENT_ID,
  type GoogleAuthButtonHandle,
} from '../components/GoogleAuthButton';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Spinner } from '../components/ui/Spinner';
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';
import { formatInputPlaceholder, formatInputLabel } from '../utils/textCase';
import { getSignUpSchema, type SignUpFormData } from '../utils/validation';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';

export function SignUpPage() {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';

  const signUpSchema = getSignUpSchema(t);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const [showGoogleTermsModal, setShowGoogleTermsModal] = useState(false);
  const [modalAgreed, setModalAgreed] = useState(false);
  const [subscribeToNews, setSubscribeToNews] = useState(false);
  const [modalSubscribeToNews, setModalSubscribeToNews] = useState(false);
  const googleAuthRef = useRef<GoogleAuthButtonHandle>(null);

  const navigate = useNavigate();
  const { register: registerAccount, loginWithGoogle, resendVerification } = useAuth();

  const {
    register, handleSubmit, watch, setError, setValue,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '',
      password: '', confirmPassword: '', agreeToTerms: false,
    },
  });

  const password = watch('password');
  const agreed = !!watch('agreeToTerms');

  const criteria = [
    { label: t('auth.validation.passwordMin'), met: password.length >= 8 },
    { label: t('auth.validation.passwordUppercase'), met: /[A-Z]/.test(password) },
    { label: t('auth.validation.passwordLowercase'), met: /[a-z]/.test(password) },
    { label: t('auth.validation.passwordNumber'), met: /[0-9]/.test(password) },
  ];

  const handleGoogleAuthClick = (e: React.MouseEvent) => {
    if (!agreed) {
      e.stopPropagation();
      setModalAgreed(false);
      setModalSubscribeToNews(false);
      setShowGoogleTermsModal(true);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    if (!agreed) {
      setError('agreeToTerms', { type: 'manual', message: t('auth.validation.termsRequired') });
      return;
    }
    try {
      const result = await loginWithGoogle(credential, subscribeToNews);
      if (result.success) {
        toast.success(result.message || t('auth.signup.success'));
        navigate('/');
      } else {
        toast.error(result.error || t('auth.signup.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleGoogleError = (error: string) => toast.error(error);

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    try {
      const result = await registerAccount({
        email: data.email, password: data.password,
        firstName: data.firstName, lastName: data.lastName, subscribeToNews,
      });
      if (result.success) {
        setRegisteredEmail(data.email);
        setRegistrationSuccess(true);
        toast.success(t('auth.signup.success'));
      } else {
        toast.error(result.error || t('auth.signup.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail || isResendingVerification) return;

    setIsResendingVerification(true);
    try {
      const result = await resendVerification(registeredEmail);
      if (result.success) {
        toast.success(result.message || t('auth.signup.verificationSent'));
      } else {
        toast.error(result.error || t('auth.signup.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    } finally {
      setIsResendingVerification(false);
    }
  };

  /* ── Input base classes ── */
  const inputBase = (hasError: boolean) =>
    `w-full rounded-2xl border bg-gray-50/70 px-5 py-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-mintcom-green/30 dark:bg-white/5 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-white/10 ${
      hasError
        ? 'border-red-400 dark:border-red-500'
        : 'border-gray-200 dark:border-white/10 focus:border-mintcom-green/40'
    }`;

  /* ── Success screen ── */
  if (registrationSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-4 dark:bg-[#050505]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md overflow-hidden rounded-3xl border border-gray-200/70 bg-white/90 p-12 text-center shadow-[0_20px_60px_-20px_rgba(0,0,0,0.15)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.03]"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-mintcom-green/15 ring-4 ring-mintcom-green/20"
          >
            <Check size={40} strokeWidth={2.5} className="text-mintcom-green" />
          </motion.div>
          <h2 className="font-barlow text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('auth.signup.checkEmail')}
          </h2>
          <p className="mt-4 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400">
            {t('auth.signup.verificationSent')}{' '}
            <span className="font-bold text-gray-900 dark:text-white">{registeredEmail}</span>.{' '}
            {t('auth.signup.clickToVerify')}
          </p>
          <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-white/[0.03]">
            <p className="text-xs text-gray-500">
              {t('auth.signup.didntReceive')}{' '}
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResendingVerification}
                className="font-bold text-mintcom-green hover:underline disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isResendingVerification ? t('common.sending', 'Sending...') : t('auth.signup.resendVerification')}
              </button>
            </p>
          </div>
          <Link
            to="/login"
            className="group mt-8 inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-mintcom-green font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-shadow hover:shadow-[0_12px_32px_-8px_rgba(124,195,159,0.7)]"
          >
            {t('auth.signup.goToLogin')}
            <ArrowRight size={16} className={isRtl ? 'rotate-180' : ''} />
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="relative flex min-h-screen bg-white transition-colors duration-300 dark:bg-[#050505]"
    >
      <Helmet>
        <title>{t('metadata.signup.title')}</title>
        <meta name="description" content={t('metadata.signup.description')} />
        <meta property="og:title" content={t('metadata.signup.title')} />
        <meta property="og:description" content={t('metadata.signup.description')} />
      </Helmet>

      {/* Loading overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-4 rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              <Spinner size={32} />
              <p className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                {t('auth.signup.creatingYourAccount')}
              </p>
              <p className="text-xs font-medium text-gray-500">{t('auth.signup.pleaseWait')}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Minimal top bar ── */}
      <div className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 md:px-10">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src={MintcomLogoGreen} alt="Mintcom" className="h-8 w-auto object-contain dark:hidden" />
          <img src={MintcomLogoWhite} alt="Mintcom" className="hidden h-8 w-auto object-contain dark:block" />
        </Link>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* ── Left: Form ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-12 pt-24 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
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
              {t('auth.signup.title')}
            </h1>
            <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('auth.signup.subtitle')}
            </p>
          </div>

          {/* Glass card */}
          <div className="relative overflow-hidden rounded-3xl border border-gray-200/70 bg-white/90 p-8 shadow-[0_4px_15px_-6px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none">
            {/* Subtle corner glow */}
            <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-mintcom-green/10 blur-3xl" />

            <form onSubmit={handleSubmit(onSubmit)} className="relative space-y-5">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="block text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {t('auth.signup.firstNameLabel')}<span className="ml-1 text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      maxLength={255}
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      autoComplete="given-name"
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                      className={`${inputBase(!!errors.firstName)} ps-10`}
                      placeholder={formatInputPlaceholder(t('auth.signup.firstNamePlaceholder'), t('common.locale'))}
                    />
                  </div>
                  {errors.firstName?.message && (
                    <p id="firstName-error" role="alert" className="text-xs font-bold text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="block text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                    {t('auth.signup.lastNameLabel')}<span className="ml-1 text-red-400">*</span>
                  </label>
                  <input
                    maxLength={255}
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    autoComplete="family-name"
                    aria-invalid={!!errors.lastName}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    className={inputBase(!!errors.lastName)}
                    placeholder={formatInputPlaceholder(t('auth.signup.lastNamePlaceholder'), t('common.locale'))}
                  />
                  {errors.lastName?.message && (
                    <p id="lastName-error" role="alert" className="text-xs font-bold text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {t('auth.signup.emailLabel')}<span className="ml-1 text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    maxLength={255}
                    {...register('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`${inputBase(!!errors.email)} ps-10`}
                    placeholder={formatInputPlaceholder(t('auth.signup.emailPlaceholder'), t('common.locale'))}
                  />
                </div>
                {errors.email?.message && (
                  <p id="email-error" role="alert" className="text-xs font-bold text-red-500">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {t('auth.signup.passwordLabel')}<span className="ml-1 text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    maxLength={255}
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    className={`${inputBase(!!errors.password)} ps-10 pe-12`}
                    placeholder={formatInputPlaceholder(t('auth.signup.passwordPlaceholder'), t('common.locale'))}
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
                  <p id="password-error" role="alert" className="text-xs font-bold text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-[12px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
                  {t('auth.signup.confirmPasswordLabel')}<span className="ml-1 text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    maxLength={255}
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    aria-invalid={!!errors.confirmPassword}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    className={`${inputBase(!!errors.confirmPassword)} ps-10 pe-12`}
                    placeholder={formatInputPlaceholder(t('auth.signup.confirmPasswordPlaceholder'), t('common.locale'))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                    className="absolute end-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {errors.confirmPassword?.message && (
                  <p id="confirmPassword-error" role="alert" className="text-xs font-bold text-red-500">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Password criteria */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-white/[0.03]">
                {criteria.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {item.met ? (
                      <CheckCircle2 size={13} className="flex-shrink-0 text-mintcom-green" />
                    ) : (
                      <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border-2 border-gray-300 dark:border-white/10" />
                    )}
                    <span className={`text-[10px] font-bold ${item.met ? 'text-mintcom-green' : 'text-gray-400'}`}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 py-1">
                  <input
                    {...register('agreeToTerms')}
                    id="agreeToTerms"
                    type="checkbox"
                    aria-invalid={!!errors.agreeToTerms}
                    aria-describedby={errors.agreeToTerms ? 'agreeToTerms-error' : undefined}
                    className={`mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green dark:border-white/20 ${errors.agreeToTerms ? 'border-red-400' : ''}`}
                  />
                  <label htmlFor="agreeToTerms" className="cursor-pointer text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {t('landing.contact.termsAgree')}{' '}
                    <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-bold text-mintcom-green hover:underline">{t('landing.contact.privacyPolicy')}</Link>{' '}
                    {t('common.and')}{' '}
                    <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="font-bold text-mintcom-green hover:underline">{t('landing.contact.termsOfService')}</Link>.
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p id="agreeToTerms-error" role="alert" className="text-xs font-bold text-red-500">{errors.agreeToTerms.message}</p>
                )}
                <div className="flex items-start gap-3 py-1">
                  <input
                    id="subscribeToNews"
                    type="checkbox"
                    checked={subscribeToNews}
                    onChange={(e) => setSubscribeToNews(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green dark:border-white/20"
                  />
                  <label htmlFor="subscribeToNews" className="cursor-pointer text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {formatInputLabel(t('auth.signup.subscribeToNews'), t('common.locale'))}
                  </label>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                type="submit"
                disabled={isSubmitting}
                className="group relative inline-flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-mintcom-green font-bold text-black shadow-[0_8px_24px_-8px_rgba(124,195,159,0.6)] transition-shadow hover:shadow-[0_12px_32px_-8px_rgba(124,195,159,0.7)] disabled:opacity-60"
              >
                <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">{isSubmitting ? t('auth.signup.creatingAccount') : t('auth.signup.signUpButton')}</span>
                <ArrowRight size={16} className={`relative transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
              </motion.button>
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <AuthDivider />
                <div className="relative w-full">
                  <GoogleAuthButton
                    ref={googleAuthRef}
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signup_with"
                    disabled={isSubmitting}
                  />
                  {!agreed && (
                    <div className="absolute inset-0 z-20 cursor-pointer" onClick={handleGoogleAuthClick} />
                  )}
                </div>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('auth.signup.haveAccount')}{' '}
                <Link to="/login" className="font-bold text-mintcom-green hover:underline">
                  {t('auth.signup.logIn')}
                </Link>
              </p>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5 dark:border-white/5">
              <p className="text-center text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
                {t('auth.signup.disclaimerPrefix')}{' '}
                <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-mintcom-green hover:underline">{t('footer.termsOfService')}</Link>{' '}
                {t('common.and')}{' '}
                <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-mintcom-green hover:underline">{t('footer.privacyPolicy')}</Link>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Right: Benefits panel ── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50 lg:flex lg:flex-1 lg:items-center lg:justify-center dark:from-[#050505] dark:via-[#0a0a0a] dark:to-[#050505]">
        {/* Background ambient */}
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 right-[10%] h-[400px] w-[400px] rounded-full bg-mintcom-green/10 blur-[120px]" />
          <div className="absolute -bottom-20 left-[10%] h-[400px] w-[400px] rounded-full bg-emerald-400/5 blur-[120px]" />
          {/* Faint grid */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] dark:opacity-[0.07]"
            style={{
              backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              color: '#7dc6a2',
              maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
              WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-lg px-10"
        >
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-xl border border-mintcom-green/25 bg-white/70 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-mintcom-green shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(124,195,159,0.5)] backdrop-blur-xl dark:bg-white/5">
            <Zap size={12} fill="currentColor" />
            <span>{t('auth.signup.allFeaturesIncluded')}</span>
          </div>

          <h2 className="font-magilio text-4xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white lg:text-5xl">
            {t('landing.features.title')}{' '}
            <span className="bg-gradient-to-r from-mintcom-green via-emerald-400 to-mintcom-green bg-clip-text text-transparent">
              {t('landing.features.titleHighlight')}
            </span>
          </h2>
          <p className="mt-4 text-base font-light leading-relaxed text-gray-600 dark:text-gray-400">
            {t('landing.features.subtitle')}
          </p>

          {/* Feature list */}
          <ul className="mt-10 space-y-5">
            {[
              { title: t('auth.signup.feature1Title'), desc: t('auth.signup.feature1Desc') },
              { title: t('auth.signup.feature2Title'), desc: t('auth.signup.feature2Desc') },
              { title: t('auth.signup.feature3Title'), desc: t('auth.signup.feature3Desc') },
              { title: t('auth.signup.feature5Title'), desc: t('auth.signup.feature5Desc') },
              { title: t('auth.signup.feature6Title'), desc: t('auth.signup.feature6Desc') },
              { title: t('auth.signup.feature7Title'), desc: t('auth.signup.feature7Desc') },
              { title: t('dashboard.menu.recipes'), desc: t('manufacturing.subtitle', 'Track raw materials, recipes, and automatic production costs.') },
              { title: t('auth.signup.feature4Title'), desc: t('auth.signup.feature4Desc') },
            ].map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="group flex items-start gap-4 rounded-2xl border border-transparent p-3 transition-all duration-300 hover:border-mintcom-green/15 hover:bg-mintcom-green/5"
              >
                <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-mintcom-green/10 ring-1 ring-mintcom-green/20 transition-all group-hover:bg-mintcom-green group-hover:ring-mintcom-green/40">
                  <Check size={15} strokeWidth={3} className="text-mintcom-green transition-colors group-hover:text-black" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold tracking-tight text-gray-900 dark:text-white">{item.title}</p>
                  <p className="mt-0.5 text-xs font-light leading-relaxed text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* ── Google Terms Modal ── */}
      <AnimatePresence>
        {showGoogleTermsModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGoogleTermsModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-mintcom-green/10">
                  <ShieldCheck size={28} className="text-mintcom-green" />
                </div>
                <h3 className="font-barlow text-2xl font-bold text-gray-900 dark:text-white">
                  {t('common.security')}
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('auth.signup.subtitle')}
                </p>
              </div>

              <div className="space-y-4">
                <div
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-mintcom-green/20 dark:border-white/5 dark:bg-white/[0.03]"
                  onClick={() => setModalAgreed(!modalAgreed)}
                >
                  <input
                    id="modal-agree"
                    type="checkbox"
                    checked={modalAgreed}
                    readOnly
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green dark:border-white/20"
                  />
                  <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-300" onClick={(e) => e.stopPropagation()}>
                    {t('landing.contact.termsAgree')}{' '}
                    <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-mintcom-green hover:underline">{t('landing.contact.privacyPolicy')}</Link>{' '}
                    {t('common.and')}{' '}
                    <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-mintcom-green hover:underline">{t('landing.contact.termsOfService')}</Link>.
                  </div>
                </div>

                <div
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/70 p-4 transition-colors hover:border-mintcom-green/20 dark:border-white/5 dark:bg-white/[0.03]"
                  onClick={() => setModalSubscribeToNews(!modalSubscribeToNews)}
                >
                  <input
                    id="modal-subscribe"
                    type="checkbox"
                    checked={modalSubscribeToNews}
                    readOnly
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green dark:border-white/20"
                  />
                  <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-300" onClick={(e) => e.stopPropagation()}>
                    {t('auth.signup.subscribeToNews')}
                  </div>
                </div>

                <GoogleAuthButton
                  onSuccess={async (credential) => {
                    setValue('agreeToTerms', true);
                    setSubscribeToNews(modalSubscribeToNews);
                    setShowGoogleTermsModal(false);
                    try {
                      const result = await loginWithGoogle(credential, modalSubscribeToNews);
                      if (result.success) {
                        toast.success(result.message || t('auth.signup.success'));
                        navigate('/');
                      } else {
                        toast.error(result.error || t('auth.signup.failed'));
                      }
                    } catch {
                      toast.error(t('common.error'));
                    }
                  }}
                  onError={handleGoogleError}
                  text="signup_with"
                  disabled={!modalAgreed || isSubmitting}
                />

                <button
                  onClick={() => setShowGoogleTermsModal(false)}
                  className="w-full py-2 text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-white"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

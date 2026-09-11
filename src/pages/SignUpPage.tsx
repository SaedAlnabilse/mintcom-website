import { useState, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, ArrowLeft, Mail, Lock, User, Check,
  ShieldCheck, ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  GoogleAuthButton, AuthDivider, GOOGLE_CLIENT_ID,
  type GoogleAuthButtonHandle,
} from '../components/GoogleAuthButton';
import { AppleAuthButton, APPLE_AUTH_ENABLED, type AppleAuthCredential } from '../components/AppleAuthButton';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Spinner } from '../components/ui/Spinner';
import MintcomLogoGreen from '../assets/green-full-logo.svg';
import MintcomLogoWhite from '../assets/white-green-full-logo.svg';
import { formatInputPlaceholder } from '../utils/textCase';
import { getSignUpSchema, type SignUpFormData } from '../utils/validation';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { ThemeToggle } from '../components/ThemeToggle';
import { getPostLoginDestination } from '../utils/postLoginRedirect';

export function SignUpPage() {
  const { t } = useTranslation();
  const isRtl = t('common.locale') === 'ar';

  const signUpSchema = getSignUpSchema(t);

  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
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
  const { register: registerAccount, loginWithGoogle, loginWithApple, resendVerification } = useAuth();

  const finishSignup = (result: {
    needsOnboarding?: boolean;
    requiresAccountRecovery?: boolean;
    isSecondaryAdmin?: boolean;
    establishments?: import('../types').Establishment[];
  }) => {
    navigate(
      getPostLoginDestination({
        requiresAccountRecovery: result.requiresAccountRecovery,
        needsOnboarding: result.needsOnboarding,
        isSecondaryAdmin: result.isSecondaryAdmin,
        establishments: result.establishments,
      }),
      { replace: true },
    );
  };

  const {
    register, handleSubmit, watch, setError, setValue,
    formState: { errors, touchedFields },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '', lastName: '', email: '',
      password: '', agreeToTerms: false,
    },
    mode: 'onChange',
  });

  const password = watch('password') || '';
  const agreed = !!watch('agreeToTerms');

  const criteria = useMemo(() => [
    { label: t('auth.validation.passwordMin', '8+ characters'), met: password.length >= 8 },
    { label: t('auth.validation.passwordUppercase', 'Uppercase letter'), met: /[A-Z]/.test(password) },
    { label: t('auth.validation.passwordLowercase', 'Lowercase letter'), met: /[a-z]/.test(password) },
    { label: t('auth.validation.passwordNumber', 'Number'), met: /[0-9]/.test(password) },
    { label: t('auth.validation.passwordSymbol', 'Symbol (@$!%*?&)'), met: /[^A-Za-z0-9]/.test(password) },
  ], [password, t]);

  const passedCriteriaCount = useMemo(() => criteria.filter(c => c.met).length, [criteria]);



  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-gray-200 dark:bg-white/10' };
    if (passedCriteriaCount <= 2) return { score: 1, label: t('validation.weak', 'Weak'), color: 'bg-red-500' };
    if (passedCriteriaCount <= 3) return { score: 2, label: t('validation.fair', 'Fair'), color: 'bg-amber-500' };
    if (passedCriteriaCount <= 4) return { score: 3, label: t('validation.good', 'Good'), color: 'bg-emerald-500' };
    return { score: 4, label: t('validation.strong', 'Strong'), color: 'bg-mintcom-green' };
  }, [password, passedCriteriaCount, t]);

  const handleGoogleAuthClick = useCallback((e: React.MouseEvent) => {
    if (!agreed) {
      e.stopPropagation();
      setModalAgreed(false);
      setModalSubscribeToNews(false);
      setShowGoogleTermsModal(true);
    }
  }, [agreed]);

  const handleGoogleSuccess = useCallback(async (credential: string) => {
    if (!agreed) {
      setError('agreeToTerms', { type: 'manual', message: t('auth.validation.termsRequired') });
      return;
    }
    try {
      const result = await loginWithGoogle(credential, subscribeToNews, 'signup');
      if (result.success) {
        toast.success(result.message || t('auth.signup.success'));
        finishSignup(result);
      } else {
        toast.error(result.error || t('auth.signup.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  }, [agreed, subscribeToNews, loginWithGoogle, setError, t]);

  const handleGoogleError = useCallback((error: string) => toast.error(error), []);

  const handleAppleSuccess = async (credential: AppleAuthCredential) => {
    if (!agreed) {
      setError('agreeToTerms', { type: 'manual', message: t('auth.validation.termsRequired') });
      return;
    }
    try {
      const result = await loginWithApple({ ...credential, subscribeToNews }, 'signup');
      if (result.success) {
        toast.success(result.message || t('auth.signup.success'));
        finishSignup(result);
      } else {
        toast.error(result.error || t('auth.signup.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    try {
      const result = await registerAccount({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        subscribeToNews,
        acceptedTerms: !!data.agreeToTerms,
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

  const inputContainerClass = (hasError: boolean, isSuccess?: boolean) =>
    `relative flex items-center w-full rounded-[12px] border transition-all duration-200 bg-gray-50/80 dark:bg-white/[0.04] ${
      hasError
        ? 'border-red-500/70 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
        : isSuccess
        ? 'border-emerald-500/40 focus-within:border-mintcom-green focus-within:ring-2 focus-within:ring-mintcom-green/20'
        : 'border-gray-200/90 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 focus-within:border-mintcom-green focus-within:bg-white dark:focus-within:bg-white/[0.07] focus-within:ring-2 focus-within:ring-mintcom-green/20'
    }`;

  if (registrationSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-[#070A12]" dir={isRtl ? 'rtl' : 'ltr'}>
        <Helmet>
          <title>{t('auth.signup.title')} | Mintcom</title>
          <meta name="description" content="Sign up for Mintcom POS platform" />
        </Helmet>
        <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xl dark:border-white/5 dark:bg-[#0E1424]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-mintcom-green/20 text-mintcom-green">
            <Mail size={32} />
          </div>
          <h2 className="font-magilio text-2xl font-bold text-gray-900 dark:text-white">
            {t('auth.signup.checkEmail')}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {t('auth.signup.clickToVerify')}
          </p>
          <p className="mt-1 font-semibold text-gray-900 dark:text-white">
            {registeredEmail}
          </p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={isResendingVerification}
              className="w-full rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
            >
              {isResendingVerification ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={16} />
                  {t('auth.signup.pleaseWait')}
                </span>
              ) : (
                t('auth.signup.resendVerification')
              )}
            </button>
            <Link
              to="/login"
              className="block w-full rounded-xl py-3 text-sm font-bold text-mintcom-greenInk hover:underline dark:text-mintcom-green"
            >
              {t('auth.signup.goToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-screen w-full flex-col bg-[#FAFAFA] font-sans text-gray-900 antialiased transition-colors duration-300 dark:bg-[#070A12] dark:text-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <Helmet>
        <title>{t('auth.signup.title', 'Create your account')} | Mintcom</title>
        <meta name="description" content="Sign up for Mintcom POS & Cloud Management System." />
      </Helmet>

      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -start-[15%] -top-[10%] h-[550px] w-[550px] rounded-full bg-mintcom-green/[0.08] blur-[130px] dark:bg-mintcom-green/[0.04]" />
        <div className="absolute -bottom-[10%] -end-[10%] h-[550px] w-[550px] rounded-full bg-emerald-500/[0.06] blur-[140px] dark:bg-emerald-500/[0.03]" />
      </div>

      {/* Minimal top bar — same as login */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 md:px-10">
        <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="pointer-events-auto" aria-label="Mintcom Home">
          <img src={MintcomLogoGreen} alt="Mintcom" className="h-8 w-auto object-contain dark:hidden" />
          <img src={MintcomLogoWhite} alt="Mintcom" className="hidden h-8 w-auto object-contain dark:block" />
        </Link>
        <div className="pointer-events-auto flex items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <main className="relative z-20 flex w-full flex-1 items-center justify-center px-4 pb-16 pt-24 sm:px-6 md:px-8">
        <div className="w-full max-w-xl">
          {/* Back link — same place as login (above the content) */}
          <Link
            to="/"
            className="group mb-8 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft size={15} className={`transition-transform group-hover:-translate-x-0.5 ${isRtl ? 'rotate-180' : ''}`} />
            <span>{t('auth.signup.backButton', 'Back')}</span>
          </Link>
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-xl overflow-hidden rounded-[24px] border border-gray-200/90 bg-white/90 p-6 shadow-xl shadow-gray-200/40 backdrop-blur-xl dark:border-white/10 dark:bg-[#0D121F]/80 dark:shadow-none sm:p-8 md:p-10"
        >
          <div aria-hidden className="pointer-events-none absolute -end-16 -top-16 h-40 w-40 rounded-full bg-mintcom-green/10 blur-3xl" />

          <div>
            <div className="mb-6">
              <h1 className="font-magilio text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                {t('auth.signup.title', 'Create your account')}
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
                {t('auth.signup.subtitle', 'Start managing your restaurant, cafe, or store with high-speed POS and Cloud analytics.')}
              </p>
            </div>

            {(GOOGLE_CLIENT_ID || APPLE_AUTH_ENABLED) && (
              <div className="mb-6 space-y-3">
                {GOOGLE_CLIENT_ID && (
                  <div className="relative w-full">
                    <GoogleAuthButton
                      ref={googleAuthRef}
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      text="signup_with"
                      disabled={isSubmitting}
                    />
                    {!agreed && (
                      <div
                        className="absolute inset-0 z-20 cursor-pointer"
                        onClick={handleGoogleAuthClick}
                        title={t('auth.validation.termsRequired', 'Please accept terms to continue with Google')}
                      />
                    )}
                  </div>
                )}
                {APPLE_AUTH_ENABLED && (
                  <AppleAuthButton
                    onSuccess={handleAppleSuccess}
                    onError={handleGoogleError}
                    onBeforeSignIn={() => {
                      if (!agreed) {
                        setModalAgreed(false);
                        setModalSubscribeToNews(false);
                        setShowGoogleTermsModal(true);
                        return false;
                      }
                      return true;
                    }}
                    text="signup_with"
                    disabled={isSubmitting}
                  />
                )}
                <AuthDivider />
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-4.5" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="firstName" className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t('auth.signup.firstNameLabel', 'First name')}<span className="ms-1 text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div className={inputContainerClass(!!errors.firstName, touchedFields.firstName && !errors.firstName)}>
                    <User size={16} className="ms-4 text-gray-400" aria-hidden="true" />
                    <input
                      maxLength={255}
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      autoComplete="given-name"
                      aria-required="true"
                      aria-invalid={!!errors.firstName}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                      className="w-full bg-transparent px-3 py-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                      placeholder={formatInputPlaceholder(t('auth.signup.firstNamePlaceholder', 'John'), t('common.locale'))}
                    />
                  </div>
                  {errors.firstName?.message && (
                    <p id="firstName-error" className="text-[11px] font-bold text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lastName" className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t('auth.signup.lastNameLabel', 'Last name')}<span className="ms-1 text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div className={inputContainerClass(!!errors.lastName, touchedFields.lastName && !errors.lastName)}>
                    <User size={16} className="ms-4 text-gray-400" aria-hidden="true" />
                    <input
                      maxLength={255}
                      {...register('lastName')}
                      type="text"
                      id="lastName"
                      autoComplete="family-name"
                      aria-required="true"
                      aria-invalid={!!errors.lastName}
                      aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                      className="w-full bg-transparent px-3 py-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                      placeholder={formatInputPlaceholder(t('auth.signup.lastNamePlaceholder', 'Doe'), t('common.locale'))}
                    />
                  </div>
                  {errors.lastName?.message && (
                    <p id="lastName-error" className="text-[11px] font-bold text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {t('auth.signup.emailLabel', 'Work Email')}<span className="ms-1 text-red-500" aria-hidden="true">*</span>
                </label>
                <div className={inputContainerClass(!!errors.email, touchedFields.email && !errors.email)}>
                  <Mail size={16} className="ms-4 text-gray-400" aria-hidden="true" />
                  <input
                    maxLength={255}
                    {...register('email')}
                    type="email"
                    id="email"
                    autoComplete="email"
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className="w-full bg-transparent px-3 py-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                    placeholder={formatInputPlaceholder(t('auth.signup.emailPlaceholder', 'john@example.com'), t('common.locale'))}
                  />
                </div>
                {errors.email?.message && (
                  <p id="email-error" className="text-[11px] font-bold text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {t('auth.signup.passwordLabel', 'Password')}<span className="ms-1 text-red-500" aria-hidden="true">*</span>
                  </label>
                  {password.length > 0 && (
                    <span className="text-[11px] font-bold text-gray-400">
                      {passwordStrength.label}
                    </span>
                  )}
                </div>

                <div className={inputContainerClass(!!errors.password, passedCriteriaCount === 5)}>
                  <Lock size={16} className="ms-4 text-gray-400" aria-hidden="true" />
                  <input
                    maxLength={255}
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    aria-required="true"
                    aria-invalid={!!errors.password}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    className="w-full bg-transparent px-3 py-3.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-gray-500"
                    placeholder={formatInputPlaceholder(t('auth.signup.passwordPlaceholder', 'Create a strong password'), t('common.locale'))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? t('auth.login.hidePassword', 'Hide password') : t('auth.login.showPassword', 'Show password')}
                    aria-pressed={showPassword}
                    className="me-3 p-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {(isPasswordFocused || password.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pt-1.5"
                  >
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.score >= step
                              ? passwordStrength.color
                              : 'bg-gray-200 dark:bg-white/10'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="mt-2.5 grid grid-cols-1 gap-1 xs:grid-cols-2">
                      {criteria.map((item) => (
                        <div
                          key={item.label}
                          className={`flex items-center gap-1.5 text-[11px] font-semibold transition-colors ${
                            item.met
                              ? 'text-emerald-600 dark:text-mintcom-green'
                              : 'text-gray-400 dark:text-gray-500'
                          }`}
                        >
                          <div className={`flex h-3.5 w-3.5 items-center justify-center rounded-full ${
                            item.met ? 'bg-mintcom-green/20 text-mintcom-green' : 'bg-gray-200 dark:bg-white/10'
                          }`}>
                            <Check size={9} strokeWidth={3} />
                          </div>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                {errors.password?.message && (
                  <p id="password-error" className="text-[11px] font-bold text-red-500">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-start gap-3">
                    <input
                      id="agreeToTerms"
                      type="checkbox"
                      aria-required="true"
                      aria-invalid={!!errors.agreeToTerms}
                      aria-describedby={errors.agreeToTerms ? 'agreeToTerms-error' : undefined}
                      {...register('agreeToTerms')}
                      className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green dark:border-white/20 dark:bg-white/5"
                    />
                    <label htmlFor="agreeToTerms" className="cursor-pointer text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-300">
                      {t('landing.contact.termsAgree', 'I agree to the')}{' '}
                      <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-mintcom-greenInk hover:underline dark:text-mintcom-green">
                        {t('landing.contact.privacyPolicy', 'Privacy Policy')}
                      </Link>{' '}
                      {t('common.and', 'and')}{' '}
                      <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-mintcom-greenInk hover:underline dark:text-mintcom-green">
                        {t('landing.contact.termsOfService', 'Terms of Service')}
                      </Link>.
                    </label>
                  </div>
                  {errors.agreeToTerms && (
                    <p id="agreeToTerms-error" className="mt-1.5 ps-7 text-[11px] font-bold text-red-500">{errors.agreeToTerms.message}</p>
                  )}
                </div>

                <div className="flex items-start gap-3">
                  <input
                    id="subscribeToNews"
                    type="checkbox"
                    checked={subscribeToNews}
                    onChange={(e) => setSubscribeToNews(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer rounded border-gray-300 text-mintcom-green focus:ring-mintcom-green dark:border-white/20 dark:bg-white/5"
                  />
                  <label htmlFor="subscribeToNews" className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-300">
                    {t('auth.signup.subscribeToNews', 'Send me occasional product updates, features, and business tips.')}
                  </label>
                </div>
              </div>

              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="group relative mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-mintcom-green font-bold text-black shadow-md shadow-mintcom-green/20 transition-all hover:bg-mintcom-green/90 disabled:opacity-60"
                style={{ borderRadius: 12, backgroundColor: '#7dc6a2' }}
              >
                <span className="relative font-bold text-black">
                  {isSubmitting ? t('auth.signup.creatingAccount') : t('auth.signup.signUpButton')}
                </span>
                <ArrowRight size={16} className={`text-black transition-transform ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </motion.button>
            </form>
          </div>

          <div className="mt-6 border-t border-gray-100/80 pt-4 text-center dark:border-white/5">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('auth.signup.haveAccount')}{' '}
              <Link to="/login" className="font-bold text-mintcom-greenInk hover:underline dark:text-mintcom-green">
                {t('auth.signup.goToLogin', 'Sign In')}
              </Link>
            </p>
          </div>
        </motion.div>
        </div>
      </main>

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="flex flex-col items-center gap-4 rounded-3xl border border-gray-100 bg-white p-10 shadow-2xl dark:border-white/10 dark:bg-[#0e0e0e]"
            >
              <Spinner size={36} />
              <p className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                {t('auth.signup.creatingYourAccount', 'Creating your account...')}
              </p>
              <p className="text-xs font-medium text-gray-500">{t('auth.signup.pleaseWait', 'Please wait a moment')}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
                <h3 className="font-magilio text-2xl font-bold text-gray-900 dark:text-white">
                  {t('common.security', 'Terms & Privacy Agreement')}
                </h3>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {t('auth.signup.subtitle', 'Please review and accept our terms before continuing with social login.')}
                </p>
              </div>

              <div className="space-y-4">
                <div
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 transition-colors hover:border-mintcom-green/30 dark:border-white/5 dark:bg-white/[0.03]"
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
                    {t('landing.contact.termsAgree', 'I agree to the')}{' '}
                    <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-mintcom-greenInk hover:underline dark:text-mintcom-green">{t('landing.contact.privacyPolicy', 'Privacy Policy')}</Link>{' '}
                    {t('common.and', 'and')}{' '}
                    <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="font-bold text-mintcom-greenInk hover:underline dark:text-mintcom-green">{t('landing.contact.termsOfService', 'Terms of Service')}</Link>.
                  </div>
                </div>

                <div
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-gray-50/80 p-4 transition-colors hover:border-mintcom-green/30 dark:border-white/5 dark:bg-white/[0.03]"
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
                    {t('auth.signup.subscribeToNews', 'Send me occasional product updates and feature releases.')}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {GOOGLE_CLIENT_ID && (
                    <GoogleAuthButton
                      onSuccess={async (credential) => {
                        setValue('agreeToTerms', true);
                        setSubscribeToNews(modalSubscribeToNews);
                        setShowGoogleTermsModal(false);
                        try {
                          const result = await loginWithGoogle(credential, modalSubscribeToNews, 'signup');
                          if (result.success) {
                            toast.success(result.message || t('auth.signup.success'));
                            finishSignup(result);
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
                  )}
                  {APPLE_AUTH_ENABLED && (
                    <AppleAuthButton
                      onSuccess={async (credential) => {
                        setValue('agreeToTerms', true);
                        setSubscribeToNews(modalSubscribeToNews);
                        setShowGoogleTermsModal(false);
                        try {
                          const result = await loginWithApple(
                            { ...credential, subscribeToNews: modalSubscribeToNews },
                            'signup',
                          );
                          if (result.success) {
                            toast.success(result.message || t('auth.signup.success'));
                            finishSignup(result);
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
                  )}
                </div>

                <button
                  onClick={() => setShowGoogleTermsModal(false)}
                  className="w-full py-2 text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-white"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

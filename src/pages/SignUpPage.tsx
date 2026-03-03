import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Check, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton, AuthDivider, GOOGLE_CLIENT_ID, type GoogleAuthButtonHandle } from '../components/GoogleAuthButton';
import { useTranslation } from 'react-i18next';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';

export function SignUpPage() {
  const { t } = useTranslation();

  const signUpSchema = z.object({
    firstName: z.string().min(2, t('auth.validation.firstNameMin')),
    lastName: z.string().min(2, t('auth.validation.lastNameMin')),
    email: z.string().email(t('auth.validation.emailInvalid')),
    password: z
      .string()
      .min(8, t('auth.validation.passwordMin'))
      .regex(/[A-Z]/, t('auth.validation.passwordUppercase'))
      .regex(/[a-z]/, t('auth.validation.passwordLowercase'))
      .regex(/[0-9]/, t('auth.validation.passwordNumber')),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine(val => val === true, {
      message: t('auth.validation.termsRequired'),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.validation.passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });

  type SignUpFormData = z.infer<typeof signUpSchema>;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showGoogleTermsModal, setShowGoogleTermsModal] = useState(false);
  const [modalAgreed, setModalAgreed] = useState(false);
  const [subscribeToNews, setSubscribeToNews] = useState(false);
  const [modalSubscribeToNews, setModalSubscribeToNews] = useState(false);
  const googleAuthRef = useRef<GoogleAuthButtonHandle>(null);

  const navigate = useNavigate();
  const { register: registerAccount, loginWithGoogle } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setError,
    setValue,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    }
  });

  const agreed = !!watch('agreeToTerms');

  const handleGoogleAuthClick = (e: React.MouseEvent) => {
    if (!agreed) {
      e.stopPropagation();
      setModalAgreed(false);
      setModalSubscribeToNews(false);
      setShowGoogleTermsModal(true);
    }
  };

  const handleModalContinue = () => {
    if (modalAgreed) {
      setValue('agreeToTerms', true);
      setSubscribeToNews(modalSubscribeToNews);
      setShowGoogleTermsModal(false);
      // Small delay to ensure state update and then trigger Google
      setTimeout(() => {
        googleAuthRef.current?.triggerPrompt();
      }, 100);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    if (!agreed) {
      setError('agreeToTerms', {
        type: 'manual',
        message: t('auth.validation.termsRequired')
      });
      return;
    }
    try {
      const result = await loginWithGoogle(credential, subscribeToNews);

      if (result.success) {
        toast.success(result.message || t('auth.signup.success'));
        if (result.isSecondaryAdmin) {
          navigate('/dashboard');
        } else {
          navigate('/owner');
        }
      } else {
        toast.error(result.error || t('auth.signup.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleGoogleError = (error: string) => {
    toast.error(error);
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

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-transparent transition-colors duration-300"
        >
          <div className="w-16 h-16 bg-paymint-green/10 dark:bg-paymint-green/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-paymint-green" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">{t('auth.signup.checkEmail')}</h2>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-6">
            {t('auth.signup.verificationSent')} <span className="text-gray-900 dark:text-white font-bold">{registeredEmail}</span>.
            {t('auth.signup.clickToVerify')}
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-100 dark:border-transparent">
            <p className="text-xs font-bold text-gray-500">
              {t('auth.signup.didntReceive')}{' '}
              <button className="text-sm font-bold text-paymint-green hover:underline">{t('auth.signup.resendVerification')}</button>
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full bg-paymint-green text-black font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-paymint-green/20"
          >
            {t('auth.signup.goToLogin')}
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex transition-colors duration-300 relative" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-screen Loading Overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl"
            >
              <Loader2 className="w-16 h-16 text-paymint-green animate-spin" />
              <p className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{t('auth.signup.creatingYourAccount')}</p>
              <p className="text-xs font-bold text-gray-500">{t('auth.signup.pleaseWait')}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-transparent transition-colors duration-300 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md py-8"
        >
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('auth.signup.backButton')}
          </Link>

          <div className="mb-8">
            <div className="flex mb-4">
              <img
                src={PaymintLogoGreen}
                alt="PayMint"
                className="h-12 w-auto object-contain dark:hidden"
              />
              <img
                src={PaymintLogoWhite}
                alt="PayMint"
                className="h-12 w-auto object-contain hidden dark:block"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t('auth.signup.title')}</h2>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{t('auth.signup.subtitle')}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 transition-colors duration-300 border border-gray-100 dark:border-transparent">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                    {t('auth.signup.firstNameLabel')}<span className="text-accent ml-1">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      aria-label={t('auth.signup.firstNameLabel')}
                      aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                      autoComplete="given-name"
                      className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.firstName ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                        } rounded-lg py-3 ps-10 pe-4 text-base sm:text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                      placeholder={t('auth.signup.firstNamePlaceholder')}
                    />
                  </div>
                  {errors.firstName?.message && (
                    <p id="firstName-error" role="alert" className="text-accent text-xs font-bold mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                    {t('auth.signup.lastNameLabel')}<span className="text-accent ml-1">*</span>
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    id="lastName"
                    aria-label={t('auth.signup.lastNameLabel')}
                    aria-describedby={errors.lastName ? 'lastName-error' : undefined}
                    autoComplete="family-name"
                    className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.lastName ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                      } rounded-lg py-3 px-4 text-base sm:text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                    placeholder={t('auth.signup.lastNamePlaceholder')}
                  />
                  {errors.lastName?.message && (
                    <p id="lastName-error" role="alert" className="text-accent text-xs font-bold mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                  {t('auth.signup.emailLabel')}<span className="text-accent ml-1">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    aria-label={t('auth.signup.emailLabel')}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    autoComplete="email"
                    className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.email ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                      } rounded-lg py-3 ps-10 pe-4 text-base sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                    placeholder={t('auth.signup.emailPlaceholder')}
                  />
                </div>
                {errors.email?.message && (
                  <p id="email-error" role="alert" className="text-accent text-xs font-bold mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                  {t('auth.signup.passwordLabel')}<span className="text-accent ml-1">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    aria-label={t('auth.signup.passwordLabel')}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    autoComplete="new-password"
                    className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.password ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                      } rounded-lg py-3 ps-10 pe-14 text-base sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                    placeholder={t('auth.signup.passwordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password?.message && (
                  <p id="password-error" role="alert" className="text-accent text-xs font-bold mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                  {t('auth.signup.confirmPasswordLabel')}<span className="text-accent ml-1">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    aria-label={t('auth.signup.confirmPasswordLabel')}
                    aria-describedby={errors.confirmPassword ? 'confirmPassword-error' : undefined}
                    autoComplete="new-password"
                    className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.confirmPassword ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                      } rounded-lg py-3 ps-10 pe-14 text-base sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                    placeholder={t('auth.signup.confirmPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                    className="absolute end-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" role="alert" className="text-accent text-xs font-bold mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 py-1">
                  <input
                    {...register('agreeToTerms')}
                    id="agreeToTerms"
                    type="checkbox"
                    className={`w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-paymint-green focus:ring-paymint-green cursor-pointer transition-colors ${errors.agreeToTerms ? 'border-accent ring-1 ring-accent' : ''}`}
                  />
                  <label htmlFor="agreeToTerms" className="text-xs text-gray-600 dark:text-gray-400 leading-tight cursor-pointer pt-0.5">
                    {t('landing.contact.termsAgree')} <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-paymint-green font-bold hover:underline inline-block">{t('landing.contact.privacyPolicy')}</Link> {t('common.and')} <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-paymint-green font-bold hover:underline inline-block">{t('landing.contact.termsOfService')}</Link>.
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-accent text-xs font-bold -mt-1">{errors.agreeToTerms.message}</p>
                )}

                <div className="flex items-center gap-3 py-1">
                  <input
                    id="subscribeToNews"
                    type="checkbox"
                    checked={subscribeToNews}
                    onChange={(e) => setSubscribeToNews(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-paymint-green focus:ring-paymint-green cursor-pointer transition-colors"
                  />
                  <label htmlFor="subscribeToNews" className="text-xs text-gray-600 dark:text-gray-400 leading-tight cursor-pointer pt-0.5">
                    {t('auth.signup.subscribeToNews')}
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-paymint-green text-black text-xs font-black tracking-widest hover:bg-paymint-green/90 disabled:opacity-50 disabled:cursor-paymint-wait py-3 px-4 rounded-lg transition-colors shadow-lg shadow-paymint-green/20"
              >
                {isSubmitting ? t('auth.signup.creatingAccount') : t('auth.signup.signUpButton')}
              </button>
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <AuthDivider />

                {/* Google Sign-Up Button */}
                <div className="w-full" onClickCapture={handleGoogleAuthClick}>
                  <GoogleAuthButton
                    ref={googleAuthRef}
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signup_with"
                    disabled={isSubmitting}
                  />
                </div>
              </>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                {t('auth.signup.haveAccount')}{' '}
                <Link to="/login" className="text-sm font-bold text-paymint-green hover:underline">
                  {t('auth.signup.logIn')}
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 text-center leading-relaxed uppercase tracking-wider">
                {t('auth.signup.disclaimerPrefix')} <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-paymint-green hover:underline">{t('footer.termsOfService')}</Link> {t('common.and')} <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-paymint-green hover:underline">{t('footer.privacyPolicy')}</Link>.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-gray-50 dark:bg-[#0a0f12] items-center justify-center p-12 transition-colors duration-300">
        <div className="max-w-xl w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800/50 rounded-xl p-10 shadow-xl dark:shadow-2xl border border-gray-100 dark:border-white/5 backdrop-blur-sm"
          >
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">{t('auth.signup.allFeaturesIncluded')}</h2>
            <div className="grid grid-cols-1 gap-y-7">
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
                <div key={i} className="flex items-start gap-6 group">
                  <div className="w-12 h-12 rounded-xl bg-paymint-green/10 dark:bg-paymint-green/20 flex items-center justify-center flex-shrink-0 mt-1 transition-all duration-300 group-hover:scale-110 group-hover:bg-paymint-green/20 group-hover:rotate-3">
                    <Check className="w-7 h-7 text-paymint-green" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-black text-xl leading-tight mb-1">{item.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm font-bold leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Google Terms Modal */}
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
              className="relative bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl max-w-md w-full p-8 shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-paymint-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={32} className="text-paymint-green" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {t('common.security')}
                </h3>
                <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-2">
                  {t('auth.signup.subtitle')}
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <input
                    id="modal-agree"
                    type="checkbox"
                    checked={modalAgreed}
                    onChange={(e) => setModalAgreed(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-paymint-green focus:ring-paymint-green cursor-pointer transition-colors"
                  />
                  <label htmlFor="modal-agree" className="text-xs font-bold text-gray-600 dark:text-gray-300 leading-snug cursor-pointer pt-0.5">
                    {t('landing.contact.termsAgree')} <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-paymint-green font-black hover:underline">{t('landing.contact.privacyPolicy')}</Link> {t('common.and')} <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-paymint-green font-black hover:underline">{t('landing.contact.termsOfService')}</Link>.
                  </label>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                  <input
                    id="modal-subscribe"
                    type="checkbox"
                    checked={modalSubscribeToNews}
                    onChange={(e) => setSubscribeToNews(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-paymint-green focus:ring-paymint-green cursor-pointer transition-colors"
                  />
                  <label htmlFor="modal-subscribe" className="text-xs font-bold text-gray-600 dark:text-gray-300 leading-snug cursor-pointer pt-0.5">
                    {t('auth.signup.subscribeToNews')}
                  </label>
                </div>

                <button
                  onClick={handleModalContinue}
                  disabled={!modalAgreed}
                  className="w-full py-4 bg-paymint-green text-black font-black text-sm tracking-widest rounded-xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
                >
                  {t('common.continue').toUpperCase()}
                  <Check size={18} strokeWidth={3} />
                </button>

                <button
                  onClick={() => setShowGoogleTermsModal(false)}
                  className="w-full py-2 text-xs font-black text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors uppercase tracking-widest"
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

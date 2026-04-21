import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, X, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton, AuthDivider } from '../components/GoogleAuthButton';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// PayMint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.svg';
import PaymintLogoWhite from '../assets/white-green-full-logo.svg';

export function LoginPage() {
  const { t } = useTranslation();

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

  // If the user was redirected here from a protected page, redirect back after login
  const redirectTo = (location.state as { from?: string })?.from;

  const handleGoogleSuccess = async (credential: string) => {
    try {
      const result = await loginWithGoogle(credential);

      if (result.success) {
        toast.success(result.message || t('common.welcome'));
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/');
        }
      } else {
        toast.error(result.error || t('auth.login.failed'));
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleGoogleError = (error: string) => {
    toast.error(error);
  };

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password);

      if (result.success) {
        toast.success(t('common.welcomeBack'));
        // Redirect back to the page they were trying to access, or default to the landing page
        if (redirectTo) {
          navigate(redirectTo);
        } else {
          navigate('/');
        }
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300 relative" dir={t('common.locale') === 'ar' ? 'rtl' : 'ltr'}>
      <Helmet>
        <title>{t('metadata.login.title')}</title>
        <meta name="description" content={t('metadata.login.description')} />
        <meta property="og:title" content={t('metadata.login.title')} />
        <meta property="og:description" content={t('metadata.login.description')} />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-end mb-4">
          <LanguageSwitcher compact />
        </div>

        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('auth.login.backToHome')}
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-none p-8 transition-colors duration-300 border border-gray-200 dark:border-white/10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src={PaymintLogoGreen}
                alt="PayMint"
                className="h-10 w-auto object-contain dark:hidden"
              />
              <img
                src={PaymintLogoWhite}
                alt="PayMint"
                className="h-10 w-auto object-contain hidden dark:block"
              />
            </div>
            <h2 className="text-2xl sm:text-3xl font-sans font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{t('auth.login.title')}</h2>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('auth.login.subtitle')}</p>
          </div>

          {/* Google Sign-In Button */}
          <GoogleAuthButton
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            disabled={isSubmitting}
          />

          <AuthDivider />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                {t('auth.login.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input maxLength={255}
                  {...register('email')}
                  type="email"
                  id="login-email"
                  aria-label={t('auth.login.ariaEmail')}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  autoComplete="email"
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.email ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-xl py-3 pl-10 pr-4 text-base sm:text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder={t('auth.login.emailPlaceholder')}
                />
              </div>
              {errors.email?.message && (
                <p id="email-error" role="alert" className="text-accent dark:text-accent text-xs font-bold mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                {t('auth.login.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input maxLength={255}
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  aria-label={t('auth.login.ariaPassword')}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  autoComplete="current-password"
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.password ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-xl py-3 pl-10 pr-12 text-base sm:text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder={t('auth.login.passwordPlaceholder')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white touch-target"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-accent dark:text-accent text-xs font-bold mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  aria-label={t('auth.login.ariaKeepLoggedIn')}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-paymint-green focus:ring-paymint-green bg-gray-50 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm font-bold text-gray-600 dark:text-gray-300">{t('auth.login.keepLoggedIn')}</span>
              </label>
              <Link to="/forgot-password" university-link className="text-sm font-bold text-paymint-green hover:underline">
                {t('auth.login.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-paymint-green text-black text-sm font-bold hover:bg-paymint-green/90 disabled:opacity-50 disabled:cursor-paymint-wait py-5 rounded-xl transition-all shadow-md shadow-paymint-green/20"
            >
              {isSubmitting ? t('auth.login.loggingIn') : t('auth.login.loginButton')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
              {t('auth.login.noAccount')}{' '}
              <Link to="/signup" className="text-sm font-bold text-paymint-green hover:underline">
                {t('auth.login.signUp')}
              </Link>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Verification Required Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-gray-200 dark:border-white/10"
            >
              <button
                onClick={() => setShowVerifyModal(false)}
                aria-label={t('auth.login.ariaCloseModal')}
                className="absolute right-2 top-2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('auth.verifyEmail.verifyingTitle')}
                </h3>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  {t('auth.verifyEmail.verifyingSubtitle')}
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                  {unverifiedEmail}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full flex items-center justify-center bg-paymint-green text-black text-xs font-black tracking-widest py-5 rounded-xl hover:bg-paymint-green/90 transition-all shadow-md shadow-paymint-green/20 disabled:opacity-50"
                >
                  {isResending ? (
                    t('auth.verifyEmail.sending')
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('auth.verifyEmail.resendButton')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-black tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('common.close').toUpperCase()}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


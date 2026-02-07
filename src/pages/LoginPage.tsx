import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, X, AlertTriangle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton, AuthDivider } from '../components/GoogleAuthButton';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.png';
import PaymintLogoWhite from '../assets/white-green-full-logo.png';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle, resendVerification } = useAuth();

  const handleGoogleSuccess = async (credential: string) => {
    try {
      const result = await loginWithGoogle(credential);

      if (result.success) {
        toast.success(result.message || 'Welcome!');
        if (result.isSecondaryAdmin) {
          navigate('/dashboard');
        } else {
          navigate('/owner');
        }
      } else {
        toast.error(result.error || 'Google login failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
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
        toast.success('Welcome back!');
        // Redirect based on user type
        if (result.isSecondaryAdmin) {
          navigate('/dashboard');
        } else {
          navigate('/owner');
        }
      } else {
        if (result.error === 'Email not verified') {
          setUnverifiedEmail(data.email);
          setShowVerifyModal(true);
        } else {
          toast.error(result.error || 'Login failed');
          setError('email', { type: 'manual' });
          setError('password', { type: 'manual' });
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await resendVerification(unverifiedEmail);
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
        setShowVerifyModal(false);
      } else {
        toast.error(result.error || 'Failed to resend email');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link
          to="/"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-2xl p-8 transition-colors duration-300 border border-gray-100 dark:border-transparent">
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
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Welcome</h2>
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Sign in to your account</p>
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
              <label className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  id="login-email"
                  aria-label="Email address"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  autoComplete="email"
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.email ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-lg py-3 pl-10 pr-4 text-base sm:text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email?.message && (
                <p id="email-error" role="alert" className="text-accent dark:text-accent text-xs font-bold text-gray-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  aria-label="Password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  autoComplete="current-password"
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.password ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-lg py-3 pl-10 pr-12 text-base sm:text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white touch-target"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" role="alert" className="text-accent dark:text-accent text-xs font-bold text-gray-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  aria-label="Keep me logged in"
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-paymint-green focus:ring-paymint-green bg-gray-50 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm font-bold text-gray-600 dark:text-gray-300">Keep me logged in</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-bold text-paymint-green hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-paymint-green text-black text-xs font-black tracking-widest hover:bg-paymint-green/90 disabled:opacity-50 disabled:cursor-paymint-wait py-3 px-4 rounded-lg transition-colors shadow-lg shadow-paymint-green/20"
            >
              {isSubmitting ? 'Signing In...' : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
              No account?{' '}
              <Link to="/signup" className="text-sm font-bold text-paymint-green hover:underline">
                Sign up
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
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-gray-100 dark:border-gray-700"
            >
              <button
                onClick={() => setShowVerifyModal(false)}
                aria-label="Close modal"
                className="absolute right-2 top-2 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Verify Your Email
                </h3>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                  Please confirm your email to log in. Check your inbox.
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                  {unverifiedEmail}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full flex items-center justify-center bg-paymint-green text-black text-xs font-black tracking-widest py-3 px-4 rounded-lg hover:bg-paymint-green/90 transition-colors disabled:opacity-50"
                >
                  {isResending ? (
                    'SENDING...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Resend Verification Email
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowVerifyModal(false)}
                  className="w-full py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-black tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}




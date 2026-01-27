import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, User, Phone, Check, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

// Paymint Logo imports
import PaymintLogoGreen from '../assets/green-full-logo.png';
import PaymintLogoWhite from '../assets/white-green-full-logo.png';

const signUpSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(5, 'Please enter a valid phone number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const { register: registerAccount } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpFormData) => {
    setIsSubmitting(true);
    try {
      const result = await registerAccount({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
      });

      if (result.success) {
        setRegisteredEmail(data.email);
        setRegistrationSuccess(true);
        toast.success('Account created successfully!');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Check Your Email</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            We've sent a verification link to <span className="text-gray-900 dark:text-white font-medium">{registeredEmail}</span>.
            Please click the link to verify your account.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-gray-100 dark:border-transparent">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Didn't receive the email? Check your spam folder or{' '}
              <button className="text-paymint-green hover:underline">resend verification</button>
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center w-full bg-paymint-green text-black font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-paymint-green/20"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex transition-colors duration-300 relative">
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
              <p className="text-xl font-semibold text-gray-900 dark:text-white">Creating your account...</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Please wait a moment</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white dark:bg-transparent transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
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
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create your account</h2>
            <p className="text-gray-600 dark:text-gray-400">Start your 7-day free trial.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name<span className="text-accent ml-1">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...register('firstName')}
                    type="text"
                    className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.firstName ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                      } rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                    placeholder="John"
                  />
                </div>
                {errors.firstName?.message && (
                  <p className="text-accent dark:text-accent text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name<span className="text-accent ml-1">*</span>
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.lastName ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-lg py-3 px-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder="Doe"
                />
                {errors.lastName?.message && (
                  <p className="text-accent dark:text-accent text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address<span className="text-accent ml-1">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.email ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email?.message && (
                <p className="text-accent dark:text-accent text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number<span className="text-accent ml-1">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.phone ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-lg py-3 pl-10 pr-4 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {errors.phone?.message && (
                <p className="text-accent dark:text-accent text-sm mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password<span className="text-accent ml-1">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.password ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-lg py-3 pl-10 pr-12 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="text-accent dark:text-accent text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password<span className="text-accent ml-1">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('confirmPassword')}
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full bg-gray-50 dark:bg-gray-700/50 border ${errors.confirmPassword ? 'border-accent' : 'border-gray-200 dark:border-gray-600'
                    } rounded-lg py-3 pl-10 pr-12 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green focus:border-transparent transition-colors`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-accent dark:text-accent text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-paymint-green text-black font-bold hover:bg-paymint-green/90 disabled:opacity-50 disabled:cursor-not-allowed py-3 px-4 rounded-lg transition-colors shadow-lg shadow-paymint-green/20"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-paymint-green hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex flex-1 bg-paymint-green/5 dark:bg-gradient-to-br dark:from-paymint-green/20 dark:to-paymint-green/5 items-center justify-center p-8 transition-colors duration-300">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Everything you need to run your business</h2>
          <div className="space-y-6">
            {[
              { title: '7-Day Free Trial', desc: 'Try all features with no commitment' },
              { title: 'Unlimited Employees', desc: 'Add as many staff members as you need' },
              { title: 'Unlimited Devices', desc: 'Use on any device, anywhere' },
              { title: 'Real-time Analytics', desc: 'Track sales and performance instantly' },
              { title: 'Multi-Location Support', desc: 'Manage multiple establishments' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-paymint-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-paymint-green" />
                </div>
                <div>
                  <h3 className="text-gray-900 dark:text-white font-medium">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}




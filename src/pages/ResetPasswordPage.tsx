import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
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
      toast.error('Invalid or missing token');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/api/accounts/reset-password', {
        token,
        newPassword: data.password,
      });
      setIsSuccess(true);
      toast.success('Password reset successful');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
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
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Invalid Link</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link 
            to="/forgot-password"
            className="inline-flex items-center justify-center w-full bg-paymint-green text-black font-black py-4 px-6 rounded-2xl hover:bg-paymint-green/90 transition-all active:scale-95 shadow-lg shadow-paymint-green/20"
          >
            Request New Link
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
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Success!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
            Your password has been reset successfully. You can now log in with your new password.
          </p>
          <Link 
            to="/login"
            className="inline-flex items-center justify-center w-full bg-gray-900 dark:bg-white text-white dark:text-black font-black py-4 px-6 rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-lg shadow-gray-900/20"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 max-w-md w-full shadow-2xl shadow-gray-200/50 dark:shadow-none"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
            Reset <span className="text-paymint-green">Password</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Create a secure new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">New Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-12 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
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
            {errors.password && <p className="text-accent text-xs font-bold mt-1 ml-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] ml-1">Confirm Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-12 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all"
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
            {errors.confirmPassword && <p className="text-accent text-xs font-bold mt-1 ml-1">{errors.confirmPassword.message}</p>}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-paymint-green text-black font-black py-4 px-6 rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-95"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : null}
              Update Password
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

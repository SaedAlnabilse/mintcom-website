import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await api.post('/auth/forgot-password', data);
      setSentEmail(data.email);
      setIsSuccess(true);
      toast.success('Reset link sent!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        {/* Back to Login */}
        {!isSuccess && (
          <button 
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-xs font-black tracking-widest">Log In</span>
          </button>
        )}

        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-white/5 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none p-8 lg:p-12 border border-gray-200 dark:border-white/10"
            >
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-paymint-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Mail className="text-paymint-green" size={32} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Forgot Password?</h1>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-2">We'll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 tracking-widest ml-1">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-paymint-green transition-colors" size={20} />
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full bg-gray-50 dark:bg-black/20 border ${errors.email ? 'border-accent' : 'border-gray-200 dark:border-white/10'} rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-paymint-green/50 transition-all`}
                      placeholder="you@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-accent text-xs font-bold text-gray-500 mt-1 ml-1">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-paymint-green text-black text-xs font-black tracking-widest rounded-2xl hover:bg-paymint-green/90 transition-all shadow-xl shadow-paymint-green/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : null}
                  Send Link
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-white/5 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-none p-8 lg:p-12 border border-gray-200 dark:border-white/10 text-center"
            >
              <div className="w-20 h-20 bg-paymint-green/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="text-paymint-green" size={40} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Email Sent</h2>
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mt-4">
                Link sent to:
                <br />
                <span className="text-gray-900 dark:text-white font-bold">{sentEmail}</span>
              </p>
              
              <div className="mt-10 pt-8 border-t border-gray-100 dark:border-white/5">
                <p className="text-xs font-bold text-gray-500">
                  Didn't receive the email?{' '}
                  <button 
                    onClick={() => setIsSuccess(false)}
                    className="text-sm font-bold text-paymint-green hover:underline"
                  >
                    Try another email
                  </button>
                </p>
              </div>

              <Link
                to="/login"
                className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white hover:text-paymint-green transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

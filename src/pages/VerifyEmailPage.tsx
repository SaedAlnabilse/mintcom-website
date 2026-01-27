import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../config/api';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing verification token.');
      return;
    }

    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const verifyEmail = async () => {
      try {
        const response = await api.post('/api/accounts/verify-email', { token });
        setStatus('success');
        setMessage(response.data.message || 'Your email has been verified successfully.');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 transition-colors duration-300">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-white/5 rounded-[2.5rem] border border-gray-200 dark:border-white/10 p-8 lg:p-12 max-w-md w-full text-center shadow-2xl shadow-gray-200/50 dark:shadow-none"
      >
        {status === 'verifying' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-paymint-green/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-10 h-10 text-paymint-green animate-spin" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Verifying Email</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Please wait while we verify your account...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-paymint-green/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-paymint-green" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Email Verified!</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
            <Link 
              to="/login"
              className="inline-flex items-center justify-center w-full bg-paymint-green text-black font-black py-4 px-6 rounded-2xl hover:bg-paymint-green/90 transition-all active:scale-95 shadow-lg shadow-paymint-green/20"
            >
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Verification Link Expired</h2>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              This link is invalid or has already been used. If you've already verified your account, you can log in now.
            </p>
            <div className="flex flex-col gap-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full bg-gray-900 dark:bg-white text-white dark:text-black font-black py-4 px-6 rounded-2xl hover:scale-105 transition-all active:scale-95 shadow-lg"
              >
                Go to Login
              </Link>
              <Link
                to="/"
                className="text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold text-sm tracking-widest transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

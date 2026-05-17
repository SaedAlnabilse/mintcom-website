import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, X, Check } from 'lucide-react';

interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
}

export const LoginRequiredModal = ({ open, onClose, redirectTo = '/support/tickets/new' }: LoginRequiredModalProps) => {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-[0_24px_80px_-16px_rgba(0,0,0,0.25)] dark:border-white/10 dark:bg-[#161616]"
          >
            {/* close */}
            <button onClick={onClose}
              className="absolute end-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15">
              <X size={14} strokeWidth={2.5} />
            </button>

            <div className="p-8">
              {/* icon */}
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-mintcom-green/10">
                <LogIn size={26} className="text-mintcom-green" />
              </div>

              <h2 className="font-barlow text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                {t('support.loginModal.title', 'Sign in to continue')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                {t('support.loginModal.desc', 'You need to be logged in to submit a support ticket. It only takes a moment.')}
              </p>

              {/* benefits */}
              <div className="mt-5 space-y-2.5 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-white/8 dark:bg-white/[0.03]">
                {[
                  t('support.loginModal.benefit1', 'Track your ticket status in real time'),
                  t('support.loginModal.benefit2', 'Get email notifications on replies'),
                  t('support.loginModal.benefit3', 'View your full support history'),
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300">
                    <Check size={14} className="flex-shrink-0 text-mintcom-green" />
                    {b}
                  </div>
                ))}
              </div>

              {/* actions */}
              <div className="mt-6 flex flex-col gap-3">
                <Link
                  to="/login"
                  state={{ from: redirectTo }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-mintcom-green py-3.5 text-sm font-bold text-black shadow-[0_4px_20px_-4px_rgba(125,198,162,0.5)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_-4px_rgba(125,198,162,0.65)]"
                >
                  <LogIn size={16} />
                  {t('support.loginModal.loginBtn', 'Log in to continue')}
                </Link>
                <Link
                  to="/signup"
                  state={{ from: redirectTo }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  {t('support.loginModal.signupBtn', "Don't have an account? Sign up")}
                </Link>
                <button onClick={onClose}
                  className="text-sm font-medium text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200">
                  {t('common.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

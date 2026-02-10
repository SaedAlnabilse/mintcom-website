import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function LoginOverlay({ isSuccess = false }: { isSuccess?: boolean }) {
  const { t } = useTranslation();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => setShowSuccess(true), 0);
    }
  }, [isSuccess]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 relative inline-block"
        >
          {/* Pulsing background circle */}
          <motion.div
            className="absolute inset-0 bg-paymint-green/20 rounded-full"
            animate={{ 
              scale: showSuccess ? [1, 1.2, 1] : [1, 1.5, 1],
              opacity: showSuccess ? [0.5, 0.8, 0.5] : [0.5, 0, 0.5] 
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="w-24 h-24 bg-paymint-green/10 rounded-full flex items-center justify-center relative z-10 transition-colors duration-500">
            {showSuccess ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
              >
                <Check className="w-10 h-10 text-paymint-green" strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="w-10 h-10 text-paymint-green" />
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {showSuccess ? t('auth.login.welcomeBack') : t('auth.login.signingIn')}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 dark:text-gray-400"
        >
          {showSuccess ? t('auth.login.redirecting') : t('auth.login.checkingInfo')}
        </motion.p>
      </div>
    </div>
  );
}

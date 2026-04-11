import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
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
          
          <div className="w-24 h-24 bg-paymint-green/5 rounded-full flex items-center justify-center relative z-10">
            {showSuccess ? (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                className="w-16 h-16 bg-paymint-green/10 rounded-full flex items-center justify-center"
              >
                <Check className="w-8 h-8 text-paymint-green" strokeWidth={3} />
              </motion.div>
            ) : (
              <div className="relative">
                {/* Outer pulsing ring */}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 border-2 border-paymint-green/30 rounded-full absolute -inset-2" 
                />
                
                {/* Main rotating ring - High Resolution SVG */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 flex items-center justify-center"
                >
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Background Track */}
                    <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-paymint-green/20" />
                    {/* High Precision Arc */}
                    <path
                      d="M50 10 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="#7CC39F"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                  </svg>
                </motion.div>

                {/* Inner slow-pulse core */}
                <motion.div 
                  animate={{ scale: [0.8, 1, 0.8], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-3 h-3 bg-paymint-green rounded-full absolute inset-0 m-auto"
                />
              </div>
            )}
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-sans font-bold tracking-tight text-gray-900 dark:text-white mb-2"
        >
          {showSuccess ? t('auth.login.welcomeBack') : t('auth.login.signingIn')}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 dark:text-gray-400 font-medium"
        >
          {showSuccess ? t('auth.login.redirecting') : t('auth.login.checkingInfo')}
        </motion.p>
      </div>
    </div>
  );
}


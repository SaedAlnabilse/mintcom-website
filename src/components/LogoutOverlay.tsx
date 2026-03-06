import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LogoutOverlay() {
  const { t } = useTranslation();
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
            className="absolute inset-0 bg-paymint-red/20 rounded-full"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="w-24 h-24 bg-paymint-red/10 rounded-full flex items-center justify-center relative z-10">
            <LogOut className="w-10 h-10 text-paymint-red" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {t('auth.logout.loggingOut')}
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-500 dark:text-gray-400"
        >
          {t('auth.logout.seeYou')}
        </motion.p>
      </div>
    </div>
  );
}

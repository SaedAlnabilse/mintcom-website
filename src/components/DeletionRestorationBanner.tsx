import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { SecurityVerificationModal } from './SecurityVerificationModal';

export function DeletionRestorationBanner() {
  const { t } = useTranslation();
  const { account, updateAccount } = useAuth();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (account?.deletionRequestedAt) {
      const deletionDate = new Date(account.deletionRequestedAt);
      deletionDate.setDate(deletionDate.getDate() + 30);
      const now = new Date();
      const diffTime = deletionDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDaysRemaining(diffDays > 0 ? diffDays : 0);
    }
  }, [account?.deletionRequestedAt]);

  if (!account?.deletionRequestedAt) return null;

  const handleRestoreClick = () => {
    setShowVerifyModal(true);
  };

  const handleSuccess = () => {
    updateAccount({ deletionRequestedAt: undefined });
    toast.success(t('account.restored'));
  };

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-4 z-[100] shadow-lg animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="animate-pulse" />
        <p className="text-sm font-bold tracking-tight">
          {t('account.deletionScheduled', { count: daysRemaining ?? 0 })}
        </p>
      </div>
      <button
        onClick={handleRestoreClick}
        className="flex items-center gap-2 px-4 py-1.5 bg-white text-red-600 rounded-lg label-strong font-outfit hover:bg-gray-100 transition-all shadow-sm"
      >
        {t('account.restoreAction')}
      </button>

      <SecurityVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onSuccess={handleSuccess}
        targetId="me"
        targetName={account.email || ''}
        mode="reactivate-account"
      />
    </div>
  );
}


import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export function DeletionRestorationBanner() {
  const { t } = useTranslation();
  const { account, updateAccount } = useAuth();
  const [isRestoring, setIsRestoring] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

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

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      const response = await api.post('/api/accounts/me/restore');
      
      if (response.data.success) {
        toast.success(t('account.restored'));
        updateAccount({ deletionRequestedAt: undefined });
      }
    } catch (error) {
      console.error('Failed to restore account:', error);
      toast.error((error as ApiError).response?.data?.message || t('account.restoreFailed'));
    } finally {
      setIsRestoring(false);
    }
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
        onClick={handleRestore}
        disabled={isRestoring}
        className="flex items-center gap-2 px-4 py-1.5 bg-white text-red-600 rounded-lg text-xs font-black tracking-widest hover:bg-gray-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
      >
        {isRestoring ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
            {t('account.restoring')}
          </>
        ) : (
          t('account.restoreAction')
        )}
      </button>
    </div>
  );
}


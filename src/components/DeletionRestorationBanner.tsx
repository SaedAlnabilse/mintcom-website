import { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../config/api';
import toast from 'react-hot-toast';

export function DeletionRestorationBanner() {
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
        toast.success('Account restored!');
        updateAccount({ deletionRequestedAt: undefined });
      }
    } catch (error: any) {
      console.error('Failed to restore account:', error);
      toast.error(error.response?.data?.message || 'Failed to restore account. Please contact support.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-4 z-[100] shadow-lg animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="animate-pulse" />
        <p className="text-sm font-bold tracking-tight">
          Your account is scheduled for deletion in <span className="underline decoration-2 underline-offset-2">{daysRemaining} days</span>.
        </p>
      </div>
      <button
        onClick={handleRestore}
        disabled={isRestoring}
        className="flex items-center gap-2 px-4 py-1.5 bg-white text-red-600 rounded-lg text-xs font-black tracking-widest hover:bg-gray-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
      >
        {isRestoring ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Restoring...
          </>
        ) : (
          'Restore Account'
        )}
      </button>
    </div>
  );
}

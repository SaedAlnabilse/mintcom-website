import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ACCOUNT_RECOVERY_PATH,
  getDaysUntilDeletion,
  hasPendingAccountDeletion,
} from '../utils/deletionRecovery';

export function DeletionRestorationBanner() {
  const { t } = useTranslation();
  const { account } = useAuth();
  const navigate = useNavigate();
  const daysRemaining = getDaysUntilDeletion(account?.deletionScheduledFor);

  if (!hasPendingAccountDeletion(account)) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-4 z-[100] shadow-lg animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2">
        <AlertTriangle size={18} className="animate-pulse" />
        <p className="text-sm font-bold tracking-tight">
          {t('account.deletionScheduled', { count: daysRemaining ?? 0 })}
        </p>
      </div>
      <button
        type="button"
        onClick={() => navigate(ACCOUNT_RECOVERY_PATH)}
        className="flex items-center gap-2 px-4 py-1.5 bg-white text-red-600 rounded-lg label-strong font-sans hover:bg-stone-100 transition-all shadow-sm"
      >
        {t('account.restoreAction')}
      </button>
    </div>
  );
}

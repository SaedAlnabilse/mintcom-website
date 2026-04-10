import { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtimeService';
import type { ConnectionStatus } from '../services/realtimeService';
import { Activity, WifiOff, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Real-time Connection Status Indicator
 *
 * Displays the current WebSocket connection status as a small indicator.
 * Can be placed in the header or sidebar.
 *
 * Usage:
 * ```tsx
 * <RealtimeStatusIndicator />
 * ```
 */
export const RealtimeStatusIndicator: React.FC = () => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    // Get initial status
    setStatus(realtimeService.getConnectionStatus());

    // Subscribe to status changes
    const unsubscribe = realtimeService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return unsubscribe;
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
      case 'disconnected':
      default:
        return {
          icon: (
            <div className="relative flex h-2 w-2 mx-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-paymint-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-paymint-green"></span>
            </div>
          ),
          text: t('common.status.live'),
          color: 'text-paymint-green',
          bgColor: 'bg-paymint-green/10',
          borderColor: 'border-paymint-green/20',
        };
      case 'connecting':
        return {
          icon: <Activity size={14} className="animate-pulse" />,
          text: t('common.status.connecting'),
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
        };
      case 'error':
        return {
          icon: <AlertCircle size={14} />,
          text: t('common.status.error'),
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        };
    }
  };

  const config = getStatusConfig();

  const handleClick = () => {
    if (status === 'disconnected' || status === 'error') {
      realtimeService.reconnect();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.1em]
        ${config.bgColor} ${config.color} ${config.borderColor}
        border transition-all duration-200 hover:opacity-80
        ${(status === 'disconnected' || status === 'error') ? 'cursor-pointer' : 'cursor-default'}
      `}
      title={status === 'disconnected' || status === 'error' ? t('common.status.reconnect') : `${t('common.status.label')}: ${t(`common.status.${status}`)}`}
    >
      {config.icon}
      <span className="hidden sm:inline-block">{config.text}</span>
    </button>
  );
};

export default RealtimeStatusIndicator;

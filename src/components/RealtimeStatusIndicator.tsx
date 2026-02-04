import { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtimeService';
import type { ConnectionStatus } from '../services/realtimeService';
import { Activity, Wifi, WifiOff, AlertCircle } from 'lucide-react';

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
        return {
          icon: <Wifi size={14} />,
          text: 'Live',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
        };
      case 'connecting':
        return {
          icon: <Activity size={14} className="animate-pulse" />,
          text: 'Connecting...',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
        };
      case 'error':
        return {
          icon: <AlertCircle size={14} />,
          text: 'Error',
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
        };
      case 'disconnected':
      default:
        return {
          icon: <WifiOff size={14} />,
          text: 'Offline',
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/20',
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
        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
        ${config.bgColor} ${config.color} ${config.borderColor}
        border transition-all duration-200 hover:opacity-80
        ${(status === 'disconnected' || status === 'error') ? 'cursor-pointer' : 'cursor-default'}
      `}
      title={status === 'disconnected' || status === 'error' ? 'Click to reconnect' : `Status: ${status}`}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.text}</span>
    </button>
  );
};

export default RealtimeStatusIndicator;

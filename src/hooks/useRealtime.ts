import { useEffect, useRef, useCallback, useState } from 'react';
import { realtimeService } from '../services/realtimeService';
import type { DataChangeEventType, ConnectionStatus, DataChangeEvent } from '../services/realtimeService';

interface UseRealtimeOptions {
  establishmentId: string | null;
  enabled?: boolean;
}

/**
 * Hook to manage real-time service connection
 * 
 * Usage:
 * ```tsx
 * function DashboardPage() {
 *   const { isConnected, onRefresh } = useRealtime({
 *     establishmentId: currentEstablishment?.id,
 *   });
 *   
 *   // Auto-refresh when data changes
 *   useEffect(() => {
 *     const unsubscribe = onRefresh((type) => {
 *       if (type === DataChangeEventType.ORDER_CREATED) {
 *         refetchOrders();
 *       }
 *     });
 *     return unsubscribe;
 *   }, [onRefresh]);
 *   
 *   return <DashboardContent />;
 * }
 * ```
 */
export const useRealtime = (options: UseRealtimeOptions) => {
  const { establishmentId, enabled = true } = options;
  const initialized = useRef(false);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // Initialize realtime service when establishment is available
  useEffect(() => {
    if (enabled && establishmentId && !initialized.current) {
      console.log('[useRealtime] Initializing realtime service...');
      realtimeService.initialize(establishmentId);
      initialized.current = true;
    }

    // Cleanup on unmount or when establishment changes
    return () => {
      if (!establishmentId || !enabled) {
        console.log('[useRealtime] Cleaning up realtime service...');
        realtimeService.cleanup();
        initialized.current = false;
      }
    };
  }, [enabled, establishmentId]);

  // Subscribe to connection status
  useEffect(() => {
    const unsubscribe = realtimeService.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });
    return unsubscribe;
  }, []);

  /**
   * Subscribe to refresh requests
   */
  const onRefresh = useCallback((callback: (eventType: string) => void) => {
    return realtimeService.onRefreshRequest(callback);
  }, []);

  /**
   * Subscribe to a specific event type
   */
  const subscribe = useCallback(<T,>(
    eventType: DataChangeEventType,
    callback: (event: DataChangeEvent<T>) => void
  ) => {
    return realtimeService.subscribe(eventType, callback);
  }, []);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    realtimeService.reconnect();
  }, []);

  return {
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected',
    hasError: status === 'error',
    status,
    onRefresh,
    subscribe,
    reconnect,
  };
};

export default useRealtime;

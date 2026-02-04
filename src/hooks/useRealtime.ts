import { useEffect, useRef, useCallback, useState } from 'react';
import { realtimeService } from '../services/realtimeService';
import type { DataChangeEventType, ConnectionStatus, DataChangeEvent } from '../services/realtimeService';

interface UseRealtimeOptions {
  establishmentId: string | null;
  authToken?: string | null;
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
 *     authToken: accessToken, // Optional - pass JWT for authenticated connections
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
  const { establishmentId, authToken, enabled = true } = options;
  const initialized = useRef(false);
  const currentEstablishmentId = useRef<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  // Initialize realtime service when establishment is available
  useEffect(() => {
    // Only initialize if enabled and we have an establishment ID
    if (!enabled || !establishmentId) {
      // Cleanup if we were previously initialized
      if (initialized.current) {
        console.log('[useRealtime] Cleaning up realtime service (disabled or no establishment)...');
        realtimeService.cleanup();
        initialized.current = false;
        currentEstablishmentId.current = null;
      }
      return;
    }

    // Check if we need to reinitialize (new establishment)
    if (initialized.current && currentEstablishmentId.current !== establishmentId) {
      console.log('[useRealtime] Establishment changed, reinitializing...');
      realtimeService.cleanup();
      initialized.current = false;
    }

    // Initialize if not already done
    if (!initialized.current) {
      console.log('[useRealtime] Initializing realtime service...');
      realtimeService.initialize(establishmentId, authToken || undefined);
      initialized.current = true;
      currentEstablishmentId.current = establishmentId;
    }

    // Cleanup on unmount
    return () => {
      console.log('[useRealtime] Component unmounting, cleaning up realtime service...');
      realtimeService.cleanup();
      initialized.current = false;
      currentEstablishmentId.current = null;
    };
  }, [enabled, establishmentId, authToken]);

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

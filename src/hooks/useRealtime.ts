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
 *     // Website sessions authenticate with the HttpOnly cookie.
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
  const currentAuthToken = useRef<string | null | undefined>(null);

  // Initialize realtime service when establishment is available
  useEffect(() => {
    // Only initialize if enabled and we have an establishment ID
    if (!enabled || !establishmentId) {
      // DON'T cleanup when establishmentId is temporarily null
      // The connection should stay alive across page navigations
      // Only skip initialization, but don't destroy existing subscriptions
      console.log('[useRealtime] Skipping initialization (disabled or no establishment)');
      return;
    }

    // Check if we need to reinitialize (establishment changed or auth token added)
    const needsReconnect = initialized.current && (
      (currentEstablishmentId.current && currentEstablishmentId.current !== establishmentId) ||
      (authToken && !currentAuthToken.current) // Token was added - need to reconnect authenticated
    );

    if (needsReconnect) {
      console.log('[useRealtime] Reconnecting...', {
        establishmentChanged: currentEstablishmentId.current !== establishmentId,
        tokenAdded: authToken && !currentAuthToken.current
      });
      // Disconnect socket, but preserve callbacks so they can re-register
      realtimeService.disconnect();
      initialized.current = false;
    }

    // Initialize if not already done
    if (!initialized.current) {
      console.log('[useRealtime] 🚀 Initializing realtime service for establishment:', establishmentId, 'with auth:', !!authToken);
      realtimeService.initialize(establishmentId, authToken || undefined);
      initialized.current = true;
      currentEstablishmentId.current = establishmentId;
      currentAuthToken.current = authToken;
    }

    // Don't cleanup on unmount - keep the connection alive
    // The service is a singleton and should persist across page navigations
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

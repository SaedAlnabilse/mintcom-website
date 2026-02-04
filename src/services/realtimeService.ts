import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

/**
 * Real-time Event Types
 */
export const DataChangeEventTypes = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_REFUNDED: 'order.refunded',
  ITEM_UPDATED: 'item.updated',
  ITEM_STOCK_CHANGED: 'item.stock_changed',
  CATEGORY_UPDATED: 'category.updated',
  CUSTOMER_UPDATED: 'customer.updated',
  SETTINGS_UPDATED: 'settings.updated',
  SHIFT_STARTED: 'shift.started',
  SHIFT_ENDED: 'shift.ended',
} as const;

export type DataChangeEventType = typeof DataChangeEventTypes[keyof typeof DataChangeEventTypes];

/**
 * Event payload interfaces
 */
export interface OrderCreatedPayload {
  orderId: string;
  orderNumber: number;
  total: number;
  status: string;
  createdAt: string;
  servedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  itemCount: number;
}

export interface ItemUpdatedPayload {
  itemId: string;
  name: string;
  changes: {
    price?: number;
    availableStock?: number;
    isAvailable?: boolean;
    name?: string;
    categoryId?: string;
  };
  previousValues?: Record<string, any>;
}

export interface DataChangeEvent<T = any> {
  type: DataChangeEventType;
  timestamp: string;
  establishmentId: string;
  payload: T;
  source: 'pos' | 'website' | 'owner' | 'system';
  userId?: string;
}

/**
 * Connection status
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

/**
 * Event callbacks
 */
type EventCallback<T> = (event: DataChangeEvent<T>) => void;

/**
 * Real-time Service for Website
 * 
 * Manages WebSocket connection to the backend and handles
 * real-time data synchronization across all Paymint applications.
 */
class RealtimeService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;
  private isManualDisconnect = false;
  private eventCallbacks: Map<string, Set<EventCallback<any>>> = new Map();
  private establishmentId: string | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusChangeCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private refreshCallbacks: Set<(type: string) => void> = new Set();

  /**
   * Initialize the service
   */
  initialize(establishmentId: string): void {
    this.establishmentId = establishmentId;
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.socket?.connected) {
      console.log('[Realtime] Already connected');
      return;
    }

    if (!this.establishmentId) {
      console.warn('[Realtime] Cannot connect: Missing establishmentId');
      return;
    }

    this.setConnectionStatus('connecting');

    // Use API_BASE_URL if set, otherwise fall back to window.location.origin
    // In production, API_BASE_URL should point to the backend
    const baseUrl = API_BASE_URL || window.location.origin;
    // Convert http/https to ws/wss
    const wsUrl = baseUrl.replace(/^http/, 'ws');
    
    console.log(`[Realtime] Connecting to ${wsUrl}/realtime...`);

    this.socket = io(`${wsUrl}/realtime`, {
      withCredentials: true, // Send cookies for authentication
      query: {
        establishmentId: this.establishmentId,
        clientType: 'website',
      },
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: false, // We handle reconnection manually
    });

    this.setupEventHandlers();
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('[Realtime] Connected:', this.socket?.id);
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      
      // Show subtle connection toast
      toast.success('Real-time updates connected', {
        duration: 2000,
        position: 'bottom-right',
      });
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      // Only log first few errors to reduce console spam
      if (this.reconnectAttempts <= 2) {
        console.error('[Realtime] Connection error:', error.message);
      }
      this.setConnectionStatus('error');
      this.scheduleReconnect();
    });

    // Disconnected
    this.socket.on('disconnect', (reason) => {
      console.log('[Realtime] Disconnected:', reason);
      this.setConnectionStatus('disconnected');
      
      if (!this.isManualDisconnect && reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    // Server confirmation
    this.socket.on('connected', (data) => {
      console.log('[Realtime] Server confirmed connection:', data);
    });

    // Data change events
    this.socket.on('data:change', (event: DataChangeEvent<any>) => {
      this.handleDataChangeEvent(event);
    });

    // Ping/pong for connection health
    this.socket.on('pong', (data) => {
      console.log('[Realtime] Pong received:', data);
    });
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Realtime] Max reconnection attempts reached - giving up');
      // Don't show error toast - the app still works without real-time updates
      this.setConnectionStatus('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    // Only log on first few attempts to reduce console spam
    if (this.reconnectAttempts <= 3) {
      console.log(`[Realtime] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    }

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Set connection status and notify listeners
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status;
    this.statusChangeCallbacks.forEach(callback => callback(status));
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusChangeCallbacks.add(callback);
    return () => this.statusChangeCallbacks.delete(callback);
  }

  /**
   * Subscribe to refresh requests (for auto-refreshing data)
   */
  onRefreshRequest(callback: (type: string) => void): () => void {
    this.refreshCallbacks.add(callback);
    return () => this.refreshCallbacks.delete(callback);
  }

  /**
   * Handle incoming data change events
   */
  private handleDataChangeEvent(event: DataChangeEvent<any>): void {
    console.log('[Realtime] Received event:', event.type, event.payload);

    // Process event based on type
    switch (event.type) {
      case DataChangeEventTypes.ORDER_CREATED:
        this.handleOrderCreated(event.payload as OrderCreatedPayload);
        break;
      case DataChangeEventTypes.ORDER_REFUNDED:
        this.handleOrderRefunded(event.payload);
        break;
      case DataChangeEventTypes.ITEM_UPDATED:
        this.handleItemUpdated(event.payload as ItemUpdatedPayload);
        break;
      case DataChangeEventTypes.SETTINGS_UPDATED:
        this.handleSettingsUpdated();
        break;
    }

    // Notify registered callbacks
    const callbacks = this.eventCallbacks.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('[Realtime] Error in event callback:', error);
        }
      });
    }

    // Notify refresh listeners
    this.refreshCallbacks.forEach(callback => {
      try {
        callback(event.type);
      } catch (error) {
        console.error('[Realtime] Error in refresh callback:', error);
      }
    });
  }

  /**
   * Handle order created event
   */
  private handleOrderCreated(payload: OrderCreatedPayload): void {
    // Show toast notification
    toast.success(
      `New Order #${payload.orderNumber} - ${this.formatCurrency(payload.total)}`,
      {
        duration: 4000,
        position: 'top-right',
        icon: '🛒',
      }
    );
  }

  /**
   * Handle order refunded event
   */
  private handleOrderRefunded(payload: any): void {
    toast.error(
      `Order #${payload.orderNumber} has been refunded`,
      {
        duration: 5000,
        position: 'top-right',
        icon: '↩️',
      }
    );
  }

  /**
   * Handle item updated event
   */
  private handleItemUpdated(payload: ItemUpdatedPayload): void {
    const { name, changes } = payload;

    if (changes.price !== undefined) {
      toast(
        `${name} price updated to ${this.formatCurrency(changes.price)}`,
        {
          duration: 4000,
          position: 'top-right',
          icon: '💰',
        }
      );
    } else {
      toast(
        `${name} has been updated`,
        {
          duration: 3000,
          position: 'top-right',
          icon: '📝',
        }
      );
    }
  }

  /**
   * Handle settings updated event
   */
  private handleSettingsUpdated(): void {
    toast(
      'Store settings have been updated',
      {
        duration: 4000,
        position: 'top-right',
        icon: '⚙️',
      }
    );
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T>(eventType: DataChangeEventType, callback: EventCallback<T>): () => void {
    if (!this.eventCallbacks.has(eventType)) {
      this.eventCallbacks.set(eventType, new Set());
    }
    
    this.eventCallbacks.get(eventType)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventCallbacks.get(eventType)?.delete(callback);
    };
  }

  /**
   * Send ping to server (for connection health check)
   */
  ping(): void {
    this.socket?.emit('ping');
  }

  /**
   * Manually disconnect
   */
  disconnect(): void {
    this.isManualDisconnect = true;
    this.socket?.disconnect();
    this.setConnectionStatus('disconnected');
  }

  /**
   * Reconnect manually
   */
  reconnect(): void {
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnect();
    this.eventCallbacks.clear();
    this.statusChangeCallbacks.clear();
    this.refreshCallbacks.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;

import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { formatCurrencyCode } from '../utils/currency';
import { env } from '../config/env';

// Use the same-origin proxy in production so realtime auth stays first-party.
// In development, prefer VITE_API_URL (local backend) so testing hits localhost:3000.
const BACKEND_WS_URL = env.PROD
  ? window.location.origin
  : import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Real-time Event Types
 */
export const DataChangeEventTypes = {
  ORDER_CREATED: 'order.created',
  ORDER_UPDATED: 'order.updated',
  ORDER_REFUNDED: 'order.refunded',
  ITEM_CREATED: 'item.created',
  ITEM_UPDATED: 'item.updated',
  ITEM_DELETED: 'item.deleted',
  ITEM_STOCK_CHANGED: 'item.stock_changed',
  CATEGORY_CREATED: 'category.created',
  CATEGORY_UPDATED: 'category.updated',
  CATEGORY_DELETED: 'category.deleted',
  CUSTOMER_CREATED: 'customer.created',
  CUSTOMER_UPDATED: 'customer.updated',
  CUSTOMER_DELETED: 'customer.deleted',
  STAFF_CREATED: 'staff.created',
  STAFF_UPDATED: 'staff.updated',
  STAFF_DELETED: 'staff.deleted',
  SETTINGS_UPDATED: 'settings.updated',
  SHIFT_STARTED: 'shift.started',
  SHIFT_ENDED: 'shift.ended',
  HELD_ORDER_CREATED: 'held_order.created',
  HELD_ORDER_UPDATED: 'held_order.updated',
  HELD_ORDER_DELETED: 'held_order.deleted',
  RAW_MATERIAL_CREATED: 'raw_material.created',
  RAW_MATERIAL_UPDATED: 'raw_material.updated',
  RAW_MATERIAL_DELETED: 'raw_material.deleted',
  SUB_RECIPE_CREATED: 'sub_recipe.created',
  SUB_RECIPE_UPDATED: 'sub_recipe.updated',
  SUB_RECIPE_DELETED: 'sub_recipe.deleted',
  FINAL_RECIPE_CREATED: 'final_recipe.created',
  FINAL_RECIPE_UPDATED: 'final_recipe.updated',
  FINAL_RECIPE_DELETED: 'final_recipe.deleted',
  MANUFACTURING_STOCK_CHANGED: 'manufacturing.stock_changed',
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
type RawEventCallback<T = any> = (payload: T) => void;

/**
 * Real-time Service for Website
 * 
 * Manages WebSocket connection to the backend and handles
 * real-time data synchronization across all Mintcom applications.
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
  private authToken: string | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private statusChangeCallbacks: Set<(status: ConnectionStatus) => void> = new Set();
  private refreshCallbacks: Set<(type: string) => void> = new Set();
  private rawEventCallbacks: Map<string, Set<RawEventCallback>> = new Map();
  private boundRawEvents: Set<string> = new Set();

  private createSyntheticEvent<T>(
    type: DataChangeEventType,
    payload: T,
  ): DataChangeEvent<T> {
    return {
      type,
      timestamp: new Date().toISOString(),
      establishmentId: this.establishmentId || '',
      payload,
      source: 'system',
    };
  }

  private isDataChangeEventType(value: unknown): value is DataChangeEventType {
    return (
      typeof value === 'string' &&
      Object.values(DataChangeEventTypes).includes(value as DataChangeEventType)
    );
  }

  /**
   * Initialize the service with optional auth token
   */
  initialize(establishmentId: string, authToken?: string): void {
    console.log('[Realtime] 🚀 Initializing service for establishment:', establishmentId, 'with auth token:', !!authToken);

    // If already connected with different auth, disconnect first
    if (this.socket?.connected && this.authToken !== authToken) {
      console.log('[Realtime] Auth token changed, reconnecting...');
      this.socket.disconnect();
    }

    this.establishmentId = establishmentId;
    this.authToken = authToken || null;
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    if (this.socket?.connected) {
      console.log('[Realtime] Already connected, socket ID:', this.socket.id);
      return;
    }

    // Community can connect without an establishment (tenant-global).
    // Establishment-scoped features still pass establishmentId when available.

    this.setConnectionStatus('connecting');

    const wsUrl = BACKEND_WS_URL;

    console.log(`[Realtime] 🔌 Connecting to ${wsUrl}/realtime...`);
    if (this.establishmentId) {
      console.log(`[Realtime] 🏢 Establishment ID: ${this.establishmentId}`);
    }

    // Build connection options
    const connectionOptions: any = {
      withCredentials: true, // Send cookies for authentication
      query: {
        ...(this.establishmentId ? { establishmentId: this.establishmentId } : {}),
        clientType: 'website',
      },
      transports: ['polling', 'websocket'], // Start with polling, then upgrade to websocket
      timeout: 30000,
      reconnection: false, // We handle reconnection manually
      forceNew: true, // Force new connection
    };

    // Add auth token if available
    if (this.authToken) {
      console.log('[Realtime] 🔑 Adding auth token to connection');
      connectionOptions.auth = {
        token: this.authToken,
      };
    } else {
      console.log('[Realtime] ⚠️ No auth token - connecting anonymously (may have limited access)');
    }

    this.socket = io(`${wsUrl}/realtime`, connectionOptions);
    this.boundRawEvents.clear();

    this.setupEventHandlers();
  }

  private bindRawEvent(eventName: string): void {
    if (!this.socket || this.boundRawEvents.has(eventName)) return;

    this.boundRawEvents.add(eventName);
    this.socket.on(eventName, (payload: any) => {
      const callbacks = this.rawEventCallbacks.get(eventName);
      callbacks?.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[Realtime] Error in ${eventName} callback:`, error);
        }
      });
    });
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    console.log('[Realtime] 🎧 Setting up event handlers...');

    // Connection established
    this.socket.on('connect', () => {
      console.log('[Realtime] ✅ Connected successfully! Socket ID:', this.socket?.id);
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
      console.error('[Realtime] ❌ Connection error:', error.message);
      console.error('[Realtime] Error details:', error);
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

    // Data change events. The server emits the canonical 'data:change' only
    // (TC-101) — do NOT also listen to the legacy 'data:changed' alias: with
    // an older dual-emitting server that processed every event twice.
    this.socket.on('data:change', (event: DataChangeEvent<any>) => {
      this.handleDataChangeEvent(event);
    });

    // Legacy/direct room events emitted by backend listeners
    const bindLegacyEvent = (eventName: string, eventType: DataChangeEventType) => {
      this.socket?.on(eventName, (payload: any) => {
        this.handleDataChangeEvent(this.createSyntheticEvent(eventType, payload));
      });
    };

    bindLegacyEvent('order:created', DataChangeEventTypes.ORDER_CREATED);
    bindLegacyEvent('order:updated', DataChangeEventTypes.ORDER_UPDATED);
    bindLegacyEvent('order:refunded', DataChangeEventTypes.ORDER_REFUNDED);
    bindLegacyEvent('shift:started', DataChangeEventTypes.SHIFT_STARTED);
    bindLegacyEvent('shift:ended', DataChangeEventTypes.SHIFT_ENDED);
    bindLegacyEvent('held_order:created', DataChangeEventTypes.HELD_ORDER_CREATED);
    bindLegacyEvent('held_order:updated', DataChangeEventTypes.HELD_ORDER_UPDATED);
    bindLegacyEvent('held_order:deleted', DataChangeEventTypes.HELD_ORDER_DELETED);

    this.socket.on('inventory:changed', (payload: any) => {
      const payloadType = payload?.type;
      const eventType =
        this.isDataChangeEventType(payloadType)
          ? payloadType
          : DataChangeEventTypes.ITEM_STOCK_CHANGED;
      this.handleDataChangeEvent(this.createSyntheticEvent(eventType, payload));
    });

    this.socket.on('categories:changed', (payload: any) => {
      const payloadType = payload?.type;
      const eventType =
        this.isDataChangeEventType(payloadType)
          ? payloadType
          : DataChangeEventTypes.CATEGORY_UPDATED;
      this.handleDataChangeEvent(this.createSyntheticEvent(eventType, payload));
    });

    // Ping/pong for connection health
    this.socket.on('pong', (data) => {
      console.log('[Realtime] Pong received:', data);
    });

    this.rawEventCallbacks.forEach((_callbacks, eventName) => {
      this.bindRawEvent(eventName);
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
   * Subscribe to direct socket events that are not data:change payloads.
   */
  onRaw<T = any>(eventName: string, callback: RawEventCallback<T>): () => void {
    if (!this.rawEventCallbacks.has(eventName)) {
      this.rawEventCallbacks.set(eventName, new Set());
    }

    this.rawEventCallbacks.get(eventName)!.add(callback as RawEventCallback);
    this.bindRawEvent(eventName);

    return () => {
      const callbacks = this.rawEventCallbacks.get(eventName);
      callbacks?.delete(callback as RawEventCallback);
      if (callbacks?.size === 0) {
        this.rawEventCallbacks.delete(eventName);
      }
    };
  }

  /**
   * Handle incoming data change events
   */
  private handleDataChangeEvent(event: DataChangeEvent<any>): void {
    console.log('[Realtime] 📥 Received event:', event.type, event.payload);

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
      case DataChangeEventTypes.ITEM_STOCK_CHANGED:
        this.handleItemStockChanged(event.payload);
        break;
      case DataChangeEventTypes.SETTINGS_UPDATED:
        this.handleSettingsUpdated();
        break;
      case DataChangeEventTypes.HELD_ORDER_CREATED:
        this.handleHeldOrderCreated(event.payload);
        break;
      case DataChangeEventTypes.HELD_ORDER_DELETED:
        this.handleHeldOrderDeleted(event.payload);
        break;
      case DataChangeEventTypes.SHIFT_STARTED:
        this.handleShiftStarted(event.payload);
        break;
      case DataChangeEventTypes.SHIFT_ENDED:
        this.handleShiftEnded(event.payload);
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
    console.log('[Realtime] 📡 Notifying refresh listeners for event:', event.type, 'Listeners:', this.refreshCallbacks.size);
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
   * Handle item stock changed event
   */
  private handleItemStockChanged(payload: any): void {
    if (payload.newStock <= 5) {
      toast.error(
        `${payload.name} is running low (${payload.newStock} left)`,
        {
          duration: 5000,
          position: 'top-right',
          icon: '📦',
        }
      );
    }
  }

  /**
   * Handle held order created event
   */
  private handleHeldOrderCreated(payload: any): void {
    toast(
      `Order "${payload.nickname}" held by ${payload.employeeName || 'POS'}`,
      {
        duration: 4000,
        position: 'top-right',
        icon: '📌',
      }
    );
  }

  /**
   * Handle held order deleted event
   */
  private handleHeldOrderDeleted(payload: any): void {
    toast(
      `Held order "${payload.nickname}" was removed`,
      {
        duration: 3000,
        position: 'top-right',
        icon: '🗑️',
      }
    );
  }

  /**
   * Handle shift started event
   */
  private handleShiftStarted(payload: any): void {
    console.log('[Realtime] 🟢 Shift started event received:', payload);
    toast.success(
      `Shift started by ${payload.employeeName || 'Employee'}`,
      {
        duration: 4000,
        position: 'top-right',
        icon: '🟢',
      }
    );
  }

  /**
   * Handle shift ended event
   */
  private handleShiftEnded(payload: any): void {
    console.log('[Realtime] 🔴 Shift ended event received:', payload);
    const message = payload.autoClose
      ? `Shift auto-closed for ${payload.employeeName || 'Employee'}`
      : `Shift ended by ${payload.employeeName || 'Employee'}`;

    toast(
      message,
      {
        duration: 4000,
        position: 'top-right',
        icon: '🔴',
      }
    );
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number): string {
    return formatCurrencyCode(amount, 'USD', 'en-US');
  }

  /**
   * Initialize for community pages (no establishment required).
   * Reuses the singleton socket; cookies authenticate website sessions.
   */
  initializeCommunity(authToken?: string): void {
    if (this.socket?.connected) {
      // Already connected — community rooms can still be joined.
      this.authToken = authToken || this.authToken;
      return;
    }
    // Use a sentinel so connect() proceeds without a real establishment.
    this.establishmentId = this.establishmentId || 'community';
    this.authToken = authToken || null;
    this.connect();
  }

  /**
   * Join a community room (global / topic / user).
   */
  subscribeCommunityRoom(
    room: 'global' | 'topic' | 'user',
    opts?: { topicId?: string; profileId?: string },
  ): void {
    if (!this.socket?.connected) {
      // Queue until connect — emit after short delay if not yet connected
      const tryJoin = () => {
        if (this.socket?.connected) {
          this.socket.emit('subscribe:community', { room, ...opts });
        }
      };
      this.socket?.once('connect', tryJoin);
      // Also try immediately in case we race the connect handler
      setTimeout(tryJoin, 500);
      return;
    }
    this.socket.emit('subscribe:community', { room, ...opts });
  }

  unsubscribeCommunityRoom(
    room: 'global' | 'topic' | 'user',
    opts?: { topicId?: string; profileId?: string },
  ): void {
    this.socket?.emit('unsubscribe:community', { room, ...opts });
  }

  /**
   * Listen for raw community events (not data:change envelope).
   */
  onCommunityEvent(eventName: string, callback: (payload: any) => void): () => void {
    this.bindRawEvent(eventName);
    if (!this.rawEventCallbacks.has(eventName)) {
      this.rawEventCallbacks.set(eventName, new Set());
    }
    this.rawEventCallbacks.get(eventName)!.add(callback);
    return () => {
      this.rawEventCallbacks.get(eventName)?.delete(callback);
    };
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
    console.log('[Realtime] 🔄 Manual reconnect requested. Current callbacks:', this.refreshCallbacks.size);
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Get current callback count (for debugging)
   */
  getCallbackCount(): number {
    return this.refreshCallbacks.size;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnect();
    this.eventCallbacks.clear();
    this.statusChangeCallbacks.clear();
    this.refreshCallbacks.clear();
    this.rawEventCallbacks.clear();
    this.boundRawEvents.clear();
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;

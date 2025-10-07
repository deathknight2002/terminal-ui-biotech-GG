/**
 * WebSocket Client for Real-time Biotech Terminal Data
 * Handles real-time market data, biotech updates, and system alerts
 */

import { io, Socket } from 'socket.io-client';

export interface WebSocketConfig {
  url: string;
  autoConnect: boolean;
  reconnection: boolean;
  reconnectionAttempts: number;
  reconnectionDelay: number;
}

export interface MarketDataUpdate {
  symbol: string;
  data: any;
  timestamp: number;
}

export interface BiotechUpdate {
  assetId: string;
  update: any;
  timestamp: number;
}

export interface CatalystAlert {
  catalystId: string;
  alert: any;
  timestamp: number;
}

export interface FinancialModelUpdate {
  modelId: string;
  results: any;
  timestamp: number;
}

export interface SystemAlert {
  alert: any;
  timestamp: number;
}

export type DataStreamType = 
  | 'market_data'
  | 'biotech_update'
  | 'catalyst_alert'
  | 'model_update'
  | 'system_alert';

export interface DataSubscription {
  type: DataStreamType;
  handler: (data: any) => void;
}

class WebSocketClient {
  private socket: Socket | null = null;
  private config: WebSocketConfig;
  private subscriptions: Map<string, DataSubscription[]> = new Map();
  private isConnected = false;
  private authToken: string | null = null;

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: 'http://localhost:3001',
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      ...config,
    };
  }

  connect(authToken?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.authToken = authToken || null;
      
      this.socket = io(this.config.url, {
        autoConnect: this.config.autoConnect,
        reconnection: this.config.reconnection,
        reconnectionAttempts: this.config.reconnectionAttempts,
        reconnectionDelay: this.config.reconnectionDelay,
      });

      this.socket.on('connect', () => {
        console.log('🔌 Connected to WebSocket server');
        this.isConnected = true;

        // Authenticate if token is provided
        if (this.authToken) {
          this.socket!.emit('authenticate', { token: this.authToken });
        }

        resolve();
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected from WebSocket server:', reason);
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('🔥 WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('authenticated', (data) => {
        if (data.success) {
          console.log('✅ WebSocket authentication successful');
        } else {
          console.error('❌ WebSocket authentication failed:', data.error);
        }
      });

      // Setup data handlers
      this.setupDataHandlers();

      // Connect
      this.socket.connect();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 WebSocket disconnected');
    }
  }

  private setupDataHandlers(): void {
    if (!this.socket) return;

    // Market data updates
    this.socket.on('market_data', (data: MarketDataUpdate) => {
      this.notifySubscribers('market_data', data);
    });

    // Biotech updates
    this.socket.on('biotech_update', (data: BiotechUpdate) => {
      this.notifySubscribers('biotech_update', data);
    });

    // Catalyst alerts
    this.socket.on('catalyst_alert', (data: CatalystAlert) => {
      this.notifySubscribers('catalyst_alert', data);
    });

    // Financial model updates
    this.socket.on('model_update', (data: FinancialModelUpdate) => {
      this.notifySubscribers('model_update', data);
    });

    // System alerts
    this.socket.on('system_alert', (data: SystemAlert) => {
      this.notifySubscribers('system_alert', data);
    });

    // Heartbeat
    this.socket.on('heartbeat_ack', () => {
      // Handle heartbeat acknowledgment
    });
  }

  private notifySubscribers(type: DataStreamType, data: any): void {
    const typeSubscriptions = this.subscriptions.get(type) || [];
    typeSubscriptions.forEach(sub => {
      try {
        sub.handler(data);
      } catch (error) {
        console.error(`Error in ${type} subscription handler:`, error);
      }
    });
  }

  subscribe(type: DataStreamType, handler: (data: any) => void): () => void {
    const subscriptionId = `${type}_${Date.now()}_${Math.random()}`;
    
    if (!this.subscriptions.has(type)) {
      this.subscriptions.set(type, []);
    }
    
    this.subscriptions.get(type)!.push({ type, handler });

    // Subscribe to data stream on server
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', { streams: [type] });
    }

    // Return unsubscribe function
    return () => {
      const typeSubscriptions = this.subscriptions.get(type) || [];
      const index = typeSubscriptions.findIndex(sub => sub.handler === handler);
      if (index > -1) {
        typeSubscriptions.splice(index, 1);
      }

      // Unsubscribe from server if no more handlers
      if (typeSubscriptions.length === 0 && this.socket && this.isConnected) {
        this.socket.emit('unsubscribe', { streams: [type] });
      }
    };
  }

  // Subscribe to specific market symbols
  subscribeToMarketData(symbols: string[], handler: (data: MarketDataUpdate) => void): () => void {
    const streams = symbols.map(symbol => `market:${symbol}`);
    
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', { streams });
    }

    return this.subscribe('market_data', handler);
  }

  // Subscribe to specific biotech assets
  subscribeToBiotechAssets(assetIds: string[], handler: (data: BiotechUpdate) => void): () => void {
    const streams = assetIds.map(assetId => `biotech:${assetId}`);
    
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', { streams });
    }

    return this.subscribe('biotech_update', handler);
  }

  // Subscribe to catalyst alerts
  subscribeToCatalysts(catalystIds: string[], handler: (data: CatalystAlert) => void): () => void {
    const streams = catalystIds.map(catalystId => `catalysts:${catalystId}`);
    
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', { streams });
    }

    return this.subscribe('catalyst_alert', handler);
  }

  // Subscribe to financial model updates
  subscribeToFinancialModels(modelIds: string[], handler: (data: FinancialModelUpdate) => void): () => void {
    const streams = modelIds.map(modelId => `models:${modelId}`);
    
    if (this.socket && this.isConnected) {
      this.socket.emit('subscribe', { streams });
    }

    return this.subscribe('model_update', handler);
  }

  // Get connection status
  getStatus(): {
    connected: boolean;
    authenticated: boolean;
    subscriptions: number;
  } {
    const totalSubscriptions = Array.from(this.subscriptions.values())
      .reduce((total, subs) => total + subs.length, 0);

    return {
      connected: this.isConnected,
      authenticated: !!this.authToken,
      subscriptions: totalSubscriptions,
    };
  }

  // Send heartbeat
  heartbeat(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('heartbeat');
    }
  }
}

// Create default WebSocket client instance
export const wsClient = new WebSocketClient();

// Export WebSocket client class for custom configurations
export { WebSocketClient };
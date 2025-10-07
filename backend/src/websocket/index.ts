import { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger.js';
import { config } from '../config/environment.js';

interface ClientData {
  userId?: string;
  subscriptions: Set<string>;
  lastHeartbeat: number;
}

const connectedClients = new Map<string, ClientData>();

export function setupWebSocket(io: SocketServer): void {
  logger.info('🔌 Setting up WebSocket server');

  io.on('connection', (socket) => {
    const clientId = socket.id;
    logger.info(`👤 Client connected: ${clientId}`);

    // Initialize client data
    connectedClients.set(clientId, {
      subscriptions: new Set(),
      lastHeartbeat: Date.now(),
    });

    // Authentication
    socket.on('authenticate', (data: { token: string }) => {
      try {
        // TODO: Implement JWT token verification
        const userId = 'user_123'; // Placeholder
        
        const clientData = connectedClients.get(clientId);
        if (clientData) {
          clientData.userId = userId;
          logger.info(`✅ Client authenticated: ${clientId} -> ${userId}`);
          socket.emit('authenticated', { success: true, userId });
        }
      } catch (error) {
        logger.error(`❌ Authentication failed for ${clientId}:`, error);
        socket.emit('authenticated', { success: false, error: 'Invalid token' });
      }
    });

    // Subscribe to data streams
    socket.on('subscribe', (data: { streams: string[] }) => {
      const clientData = connectedClients.get(clientId);
      if (!clientData) return;

      data.streams.forEach(stream => {
        clientData.subscriptions.add(stream);
        socket.join(stream);
        logger.info(`📡 Client ${clientId} subscribed to: ${stream}`);
      });

      socket.emit('subscribed', { streams: data.streams });
    });

    // Unsubscribe from data streams
    socket.on('unsubscribe', (data: { streams: string[] }) => {
      const clientData = connectedClients.get(clientId);
      if (!clientData) return;

      data.streams.forEach(stream => {
        clientData.subscriptions.delete(stream);
        socket.leave(stream);
        logger.info(`📡 Client ${clientId} unsubscribed from: ${stream}`);
      });

      socket.emit('unsubscribed', { streams: data.streams });
    });

    // Heartbeat
    socket.on('heartbeat', () => {
      const clientData = connectedClients.get(clientId);
      if (clientData) {
        clientData.lastHeartbeat = Date.now();
        socket.emit('heartbeat_ack');
      }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`👤 Client disconnected: ${clientId} (${reason})`);
      connectedClients.delete(clientId);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`🔥 Socket error for ${clientId}:`, error);
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = Date.now();
    const timeout = config.websocket.heartbeatInterval * 2;

    for (const [clientId, clientData] of connectedClients.entries()) {
      if (now - clientData.lastHeartbeat > timeout) {
        logger.warn(`⏰ Removing inactive client: ${clientId}`);
        io.sockets.sockets.get(clientId)?.disconnect();
        connectedClients.delete(clientId);
      }
    }
  }, config.websocket.heartbeatInterval);

  logger.info('✅ WebSocket server configured');
}

// Broadcast functions for different data types
export function broadcastMarketData(io: SocketServer, symbol: string, data: any): void {
  const room = `market:${symbol}`;
  io.to(room).emit('market_data', {
    symbol,
    data,
    timestamp: Date.now(),
  });
}

export function broadcastBiotechUpdate(io: SocketServer, assetId: string, update: any): void {
  const room = `biotech:${assetId}`;
  io.to(room).emit('biotech_update', {
    assetId,
    update,
    timestamp: Date.now(),
  });
}

export function broadcastCatalystAlert(io: SocketServer, catalystId: string, alert: any): void {
  const room = `catalysts:${catalystId}`;
  io.to(room).emit('catalyst_alert', {
    catalystId,
    alert,
    timestamp: Date.now(),
  });
}

export function broadcastFinancialModelUpdate(io: SocketServer, modelId: string, results: any): void {
  const room = `models:${modelId}`;
  io.to(room).emit('model_update', {
    modelId,
    results,
    timestamp: Date.now(),
  });
}

export function broadcastSystemAlert(io: SocketServer, alert: any): void {
  io.emit('system_alert', {
    alert,
    timestamp: Date.now(),
  });
}

// Get connection statistics
export function getConnectionStats(): {
  totalConnections: number;
  authenticatedConnections: number;
  subscriptionsByStream: Record<string, number>;
} {
  const stats = {
    totalConnections: connectedClients.size,
    authenticatedConnections: 0,
    subscriptionsByStream: {} as Record<string, number>,
  };

  for (const clientData of connectedClients.values()) {
    if (clientData.userId) {
      stats.authenticatedConnections++;
    }

    for (const subscription of clientData.subscriptions) {
      stats.subscriptionsByStream[subscription] = 
        (stats.subscriptionsByStream[subscription] || 0) + 1;
    }
  }

  return stats;
}